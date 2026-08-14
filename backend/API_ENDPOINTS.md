# Decantre API Endpoints Reference

Base API Address in Dev Environment: `https://server.decantrebd.com`

---

## 1. Product Endpoints

**Base Prefix:** `/api/v1/products`

- **GET `/`** - List all products with filtering (`q`), sorting (`sortBy`, `order`), and pagination (`page`, `limit`).
- **GET `/search`** - Autocomplete / live-search endpoint that returns minimal fields (`id`, `name`, `category`, `image`) for query `q`.
- **GET `/:identifier`** - Fetch details of a single product using its Mongo ID or slug.

---

## 2. Search Endpoints

**Base Prefix:** `/api/v1/search`

- **GET `/`** - Search products with keyword (`q`), returning matching products and tracking search analytics.
- **GET `/popular`** - Fetch top popular search terms sorted by frequency.
- **GET `/recent`** - Fetch user's recent search terms _(Requires JWT Authorization Header)_.
- **DELETE `/recent`** - Clear user's recent search history or specific term using `?q=term` _(Requires JWT Authorization Header)_.


---

## 3. Auth Endpoints

**Base Prefix:** `/api/v1/auth`

- **POST `/login`** - Authenticate admin/user credentials and return access and refresh tokens.
- **POST `/refresh-token`** - Renew expired access tokens using the refresh token.
- **POST `/logout`** - Invalidate active session tokens.

---

## 4. Users Endpoints

**Base Prefix:** `/api/v1/users` _(Requires JWT Authorization Header)_

- **GET `/`** - List all registered users.
- **GET `/:userId`** - Fetch details of a specific user.
- **POST `/`** - Create a new user.
- **PUT `/:userId`** - Update an existing user.
- **DELETE `/:userId`** - Delete a user.

---

## 5. Orders Endpoints

**Base Prefix:** `/api/v1/orders`

- **POST `/new-order`** - Create a new order _(Public Endpoint)_.
- **GET `/`** - List all orders _(Owner/Admin/Manager only)_.
- **GET `/:orderId`** - Fetch a specific order details _(Owner/Admin/Manager only)_.
- **PUT `/:orderId`** - Update an order _(Owner/Admin/Manager only)_.
- **DELETE `/:orderId`** - Delete an order _(Owner/Admin only)_.

---

## 6. Public Read/Search Endpoints

The following resources expose public read and search endpoints:

- **Products:** `GET /api/v1/products`, `GET /api/v1/products/:identifier`, `GET /api/v1/products/check-slug/:slug`
- **Categories:** `GET /api/v1/categories`, `GET /api/v1/categories/:id`
- **Brands:** `GET /api/v1/brands`, `GET /api/v1/brands/:id`
- **Coupons:** `GET /api/v1/coupons`, `GET /api/v1/coupons/:id`

### Role Summary

- **Owner/Admin:** can manage products, categories, brands, coupons, and orders.
- **Manager:** can view and manage products, coupons, and orders; can view/edit orders but cannot delete them.
- **Admin:** cannot delete Owner/Admin users.

---

## 7. Email Endpoints

**Base Prefix:** `/api/v1/sendEmail`

- **GET `/`** & **POST `/`** - Send a test email (`?email=user@example.com`).
- **POST `/invoice`** - Send structured HTML Invoice email containing transaction details to target client.

---

## 7. Export Endpoints

**Base Prefix:** `/api/v1/export`

- **GET `/products/mysql`** - Query the external WordPress/MySQL database for products and write them to a local JSON file in `data/products_from_mysql.json`.

---

## 8. WordPress Sync Endpoints

**Base Prefix:** `/api/wp`

- **GET `/products`** - List WordPress products.
- **GET `/products/:identifier`** - Fetch a single WordPress product by ID or slug.
- **GET `/taxonomies/categories`** - List categories retrieved from the WordPress database.
- **GET `/taxonomies/brands`** - List brands/taxonomies retrieved from the WordPress database.
