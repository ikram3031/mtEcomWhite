# Images API

## Base Path

`/api/v1/images`

## Notes

- All upload requests require authentication.
- Include the access token in the `Authorization` header:

```http
Authorization: Bearer <accessToken>
```
- Only `Owner` and `Admin` roles can upload images.

## Endpoints

### 1. Resize / Redirect Image

- **Method:** GET
- **URL:** `/api/v1/images/resize`
- **Authentication:** Not required

#### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `url` | String | Yes | Image URL to redirect to. |

---

### 2. Upload Image

- **Method:** POST
- **URL:** `/api/v1/images/upload`
- **Content-Type:** `multipart/form-data`

#### Request Parameters

| Name | Source | Type | Description |
|---|---|---|---|
| `image` | Body (File) | File | The image file to be uploaded (Max 1MB). |
| `type` | Body / Query | String | Set to `product` to process as a product image (resizes to 1200x1200 max, and generates a 200x200 max thumbnail). |
| `productSlug` | Body / Query | String | (Optional) Product slug used to generate formatted WebP file names (`<slug>_main_<timestamp>.webp`). |
| `variantName` | Body / Query | String | (Optional) Product variant size/name used to generate formatted WebP file names (`<slug>_<variant>_<timestamp>.webp`). |

#### Request Example (Product Upload)
```http
POST /api/v1/images/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

[Form Data: image (file), type=product, productSlug=perfume-x, variantName=100ml]
```

#### Success Response (Product Upload)
```json
{
  "status": "success",
  "data": {
    "imageUrl": "/uploads/2026/08-01/product_my-image-file_171234567890.webp",
    "thumbnailUrl": "/uploads/2026/08-01/thumb_my-image-file_171234567890.webp"
  }
}
```

#### Success Response (General Image Upload)
```json
{
  "status": "success",
  "data": {
    "imageUrl": "/uploads/2026/08-01/image_my-image-file_171234567890.webp"
  }
}
```

#### Error Responses

##### Missing File
- **Status:** 400 Bad Request
```json
{
  "status": "error",
  "message": "No file uploaded"
}
```

##### Unauthorized
- **Status:** 401 Unauthorized
```json
{
  "status": "error",
  "message": "Authorization header missing"
}
```

##### Forbidden
- **Status:** 403 Forbidden
```json
{
  "status": "error",
  "message": "Forbidden"
}
```
