# ☁️ Cloudflare & R2 Object Storage Configuration (Plexivia / Client Fleet)

## 📋 Account Overview
* **Account ID:** `fa0942a4bd8e442e22f78fdb6a2a605a`
* **API Token:** `[CONFIGURED_IN_VPS_ENV]` (cfat_***)

---

## 🪣 Cloudflare R2 S3-Compatible API Credentials
* **S3 API Endpoint:** `https://fa0942a4bd8e442e22f78fdb6a2a605a.r2.cloudflarestorage.com`
* **Access Key ID:** `5f0500c118548702bac32a3d027bc355`
* **Secret Access Key:** `[CONFIGURED_IN_VPS_ENV]` (78903a1d***)
* **Primary Backup Bucket:** `client-hub`
* **Engulfic Storage Path:** `client-hub/engulfic/`

---

## 🛠️ Environment Configuration Format (`backend.env`)
```ini
R2_ACCOUNT_ID=fa0942a4bd8e442e22f78fdb6a2a605a
R2_ACCESS_KEY_ID=5f0500c118548702bac32a3d027bc355
R2_SECRET_ACCESS_KEY=<YOUR_SECRET_ACCESS_KEY>
R2_BUCKET_NAME=client-hub
R2_PUBLIC_URL=https://media.engulfic.com
R2_SYNC_INTERVAL_DAYS=2
R2_SYNC_ENABLED=true
```
