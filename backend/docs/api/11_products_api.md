# Products API

This document describes the product listing, filtering, search, detail, create, update, and delete endpoints backed by MongoDB.

Base path: `/api/v1/products`

---

## 1) List Products (GET & POST)

Products can be listed using either `GET` (query string parameters) or `POST` (JSON body for rich queries / storefront search).

- **Endpoints:**
  - `GET /api/v1/products`
  - `POST /api/v1/products`
  - `POST /api/v1/products/search`

### Supported Parameters (Query or JSON Body):

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `q` / `search` / `keyword` | `string` | Free-text search against product `name`, `slug`, `description`, `notes`, `tags`, and `did` |
| `category` / `categories` | `string` \| `string[]` | Filter by Category ObjectId, DID, or slug |
| `brand` / `brands` | `string` \| `string[]` | Filter by Brand ObjectId, DID, or slug |
| `stockStatus` | `string` | Filter by stock status (`instock`, `outofstock`, `preorder`, or `all`) |
| `type` | `string` | Product type (`simple` or `variant`) |
| `season` | `string` | Season filter (`Summer`, `Winter`, `Spring`, `Autumn`, `All-Season`) |
| `minPrice` / `min_price` | `number` | Minimum price filter (evaluates product price / offerPrice / variants) |
| `maxPrice` / `max_price` | `number` | Maximum price filter (evaluates product price / offerPrice / variants) |
| `skip` / `offset` | `integer` | Number of items to skip (default `0`) |
| `limit` | `integer` | Number of items to return per page (default `10`, max `100`) |
| `sortBy` | `string` | Field to sort by: `createdAt`, `name`, `price`, `updatedAt`, `stockStatus` (default `createdAt`) |
| `order` | `string` | Sort order direction: `asc` or `desc` (default `desc`) |
| `sort` | `string` | High-level storefront aliases: `newest`, `oldest`, `price-asc`, `price-desc`, `name-asc`, `name-desc` |

---

### Response Structure (200 OK):

```json
{
  "status": "success",
  "data": [
    {
      "id": "6a770be9693b9d377d78f433",
      "name": "Dolce & Gabbana D&G L'Imperatrice EDT",
      "slug": "dolce-gabbana-dg-limperatrice-edt",
      "description": "<p>Top Notes: ...</p>",
      "type": "variant",
      "price": 0,
      "offerPrice": null,
      "stockStatus": "instock",
      "did": "d51273772a2bc11f",
      "season": "All-Season",
      "tags": ["women", "summer"],
      "notes": ["Watermelon", "Kiwi"],
      "brand": ["68c623cef30ed08c"],
      "categories": [
        {
          "_id": "6a64742900d5281346d53875",
          "name": "For Her",
          "slug": "for-her",
          "did": "3b23f4610b15517f"
        }
      ],
      "variants": [
        {
          "size": "02ml",
          "price": 260,
          "offerPrice": null,
          "stockQuantity": 10,
          "sku": "",
          "sortOrder": 0,
          "imageUrl": null
        }
      ],
      "imageUrl": "/src/uploads/260808/sample.webp",
      "thumbnailUrl": "/src/uploads/260808/thumb_sample.webp",
      "images": [],
      "created_at": "2026-08-08T10:58:49.033Z",
      "updated_at": "2026-08-08T10:59:35.430Z"
    }
  ],
  "pagination": {
    "total": 414,
    "limit": 15,
    "skip": 0
  }
}
```

> **CRITICAL CONTRACT NOTE:**  
> The `pagination` object contains `total`, `limit`, and `skip`.  
> Frontend applications and Admin Dashboard calculate dynamic page count using:  
> `totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit))`  
> **Never rename or remove fields from the `pagination` object.**

---

## 2) Get Single Product

- **Endpoint:** `GET /api/v1/products/:identifier`
- `:identifier` may be a MongoDB ObjectId (`_id`), a product `slug`, or deterministic `did`.
- **Response (200 OK):**
```json
{
  "data": {
    "id": "6a770be9693b9d377d78f433",
    "name": "Dolce & Gabbana D&G L'Imperatrice EDT",
    "slug": "dolce-gabbana-dg-limperatrice-edt",
    "did": "d51273772a2bc11f",
    "type": "variant",
    "stockStatus": "instock",
    "variants": [ ... ],
    "categories": [ ... ],
    "brand": [ ... ]
  }
}
```
- **Error (404 Not Found):**
```json
{
  "status": "error",
  "message": "Product not found"
}
```

---

## 3) Create Product (Authenticated: Owner / Admin)

- **Endpoint:** `POST /api/v1/products` *(when called with product creation payload and Authorization Bearer token)*
- **Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: application/json`
- **Required Fields:** `name`, `slug`, `imageUrl` (or `thumbnailUrl`)
- **Response (201 Created):**
```json
{
  "status": "success",
  "message": "Product created successfully",
  "data": { ... }
}
```

---

## 4) Update Product (Authenticated: Owner / Admin)

- **Endpoint:** `PUT /api/v1/products/:identifier`
- **Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: application/json`
- Updates mutable product fields, images, variants, categories, brands, tags, and notes.
- **Response (200 OK):**
```json
{
  "status": "success",
  "data": { ... }
}
```

---

## 5) Delete Product (Authenticated: Owner / Admin)

- **Endpoint:** `DELETE /api/v1/products/:identifier`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response (200 OK):**
```json
{
  "status": "success",
  "message": "Product deleted successfully"
}
```

