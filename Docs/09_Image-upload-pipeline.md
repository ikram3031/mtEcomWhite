# Product Image Upload Pipeline & Lifecycle Guide

This guide details the end-to-end lifecycle of product image management, covering local directory ingestion, processing/compression using Sharp, MongoDB sync, and VPS host deployment.

---

## Process Overview

```
Raw Images (jpg / png / webp)  ← Place in local img/ folder
         │
         ▼
┌─────────────────────────────────────────────┐
│  STEP 1: upload-productImg_fromFolder.js    │  ← Targets database products containing placeholder URLs
└─────────────────────────────────────────────┘
         │ Writes errors to scripts/failed-product-images.json
         ▼
┌─────────────────────────────────────────────┐
│  STEP 2: uploadImageFromJSON.js             │  ← Retries missing items from failed JSON list
└─────────────────────────────────────────────┘
         │ Accumulates remaining errors to failed_product_image.json
         ▼
   Sharp Image Compression & Processing
   • Main image  → 1200×1200 max, WebP format, quality 90
   • Thumbnail   → 600×600 max, WebP format, quality 90
         │
         ▼
   Output saved to: src/uploads/<batchFolder>/
   • product_<slug>_<did>.webp
   • thumb_<slug>_<did>.webp
         │
         ▼
   Database synchronization (Mongoose)
   • Update product.imageUrl & product.thumbnailUrl
         │
         ▼
┌─────────────────────────────────────────────┐
│  STEP 3: VPS Host Sync (scp)                │  ← Transfers compressed batches to production
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  STEP 4: set-placeHolder.js (Final Polish)  │  ← Sets fallback icons for unmatched products
└─────────────────────────────────────────────┘
```

---

## Prerequisites

Navigate to the backend directory and ensure all dependencies are set up:

```bash
# Navigate to backend directory
cd backend

# Install dependencies (requires sharp, mongoose, dotenv)
npm install
```

Configure your environment file (`.env`):
* `MONGODB_URI` must point to your target database instance.
* Source raw images inside the `img/` folder using slug-matched names:
  * Example: `"Lancôme Idôle EDP"` → `lancome-idole-edp.jpg`
  * Example: `"Giorgio Armani Sì"` → `giorgio-armani-si.jpg`

---

## Pipeline Execution Steps

### Script 1: Initial Processing from Local Folder
Executes lookup matching for all products in MongoDB whose `imageUrl` matches the system placeholder.

```bash
node ./scripts/upload-productImg_fromFolder.js
```

**Operation Flow:**
1. Fetches all products marked with fallback placeholder URLs from MongoDB.
2. Formats and normalizes the product title into a standard slug.
3. Performs a filesystem lookup in the `img/` folder.
4. **On Match:** Resizes and converts the raw image to WebP, outputs to `src/uploads/`, and updates the Mongoose model.
5. **On Failure:** Records the missing product identifiers in `scripts/failed-product-images.json`.

---

### Script 2: Targeted JSON Ingestion (Retry Pipeline)
Retries the pipeline targeting the failure output list.

```bash
node ./scripts/uplaodImageFromJSON.js
```

**Input Interface (`failed_product_image.json`):**
```json
[
  { "did": "WC-12345", "name": "Lancôme Idôle EDP" },
  { "did": "WC-67890", "name": "Giorgio Armani Sì Passione EDP" }
]
```

**Operation Flow:**
1. Ingests failure entries from the JSON index.
2. Normalizes accents and diacritics using Unicode decomposition:
   ```javascript
   text
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .toLowerCase()
     .replace(/[^a-z0-9]+/g, "-");
   ```
3. Creates batch output subdirectories (50 files maximum per batch folder).
4. Updates MongoDB keys and overwrites the input JSON file with remaining unresolved failures.

---

### Script 3: Fallback Verification
Applies fallback assets to products that lack a source image, ensuring clean frontend rendering without broken media links.

```bash
node ./scripts/set-placeHolder.js
```

Sets the target fields to system constants:
* `imageUrl = "/uploads/product_placeholder.webp"`
* `thumbnailUrl = "/uploads/product_placeholder.webp"`

---

## Converted File VPS Sync

Transfer the processed WebP files from your local storage to the production VPS environment using SSH secure copy.

> [!WARNING]
> Run this command from your **local PowerShell** environment, not from inside the active SSH VPS terminal.

```powershell
scp -r backend/src/uploads/* root@144.79.218.126:/var/www/uploads/
```

Verify connection and verify files on the remote VPS host:
```bash
ssh root@144.79.218.126
ls -la /var/www/uploads/
```

---

## Directory Reference Schema

```text
Decantre_Fullstack/
├── failed_product_image.json          ← Retry queue file
└── backend/
    ├── img/                           ← Raw source images repository
    │   ├── lancome-idole-edp.jpg
    │   └── giorgio-armani-si.jpg
    ├── src/
    │   └── uploads/                   ← Target folder for compressed output
    │       ├── product_placeholder.webp
    │       ├── 26080101/
    │       │   ├── product_lancome-idole-edp_abc123.webp
    │       │   └── thumb_lancome-idole-edp_abc123.webp
    │       └── 26080102/
    │           └── ...
    └── scripts/
        ├── upload-productImg_fromFolder.js
        ├── uplaodImageFromJSON.js
        ├── set-placeHolder.js
        └── failed-product-images.json
```
