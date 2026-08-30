# Kawaii Kutir — Client Credentials & Onboarding Details

This document stores the client profile, WooCommerce migration credentials, and onboarding configuration for **Kawaii Kutir** (`kawaiikutir.shop`).

---

## 1. Client Profile

| Field | Value |
| :--- | :--- |
| **Brand Name** | Kawaii Kutir |
| **Client Key / ID** | `kawaiikutir` (`04`) |
| **Primary Domain** | [kawaiikutir.shop](https://kawaiikutir.shop) |
| **Storefront URL** | `https://kawaiikutir.shop` |
| **Dashboard URL** | `https://admin.kawaiikutir.shop` |
| **Backend API URL** | `https://server.kawaiikutir.shop` |
| **Support Email** | `kawaiikutir@gmail.com` |
| **Contact Phone** | `01600905774` |
| **Business Address** | South Mugda, Dhaka-1214 |

---

## 2. WooCommerce REST API Credentials

For catalog synchronization, product migration, customer data, and order history:

- **Store Base URL:** `https://kawaiikutir.shop`
- **Consumer Key:** `ck_acffe2d36983735fe6481bbf17311ca30ac7e8f6`
- **Consumer Secret:** `cs_8ff8da64afc142ed76fdbfa7c1a852eaf662f61b`
- **Permissions:** Read / Write
- **API Endpoint:** `/wp-json/wc/v3/`

---

## 3. Pre-Migration Data Audit Summary

The following assets and records have been verified via WooCommerce REST API:

- **Categories (5):**
  - `Combo` (ID: 43)
  - `Key Chains` (ID: 32)
  - `Purse & Wallets` (ID: 15)
  - `T-shirt` (ID: 51)
  - `Tote` (ID: 52)
- **Products (12):**
  - Simple Products: Kawaii Pink Duo Combo, Kawaii Black Duo Combo
  - Variable Products with Multi-Attributes: Animal Plush Pendant, Bear Designed Tote Bag, Cat Designed Tote Bag, Hello Kitty Keychains, Luxury Wallets, Mini Purses, Cute Bunny Keychains, Premium Plush Keychains
- **Historical Orders:** 52 Orders (with line items, pricing, customer billing & shipping data)
- **Registered Customers:** 6 Customers
- **Active Coupons (11):** `sp70`, `sp130`, `sp40`, `sp120`, `sp80`, `sp20`, `sp150`, `dis30`, `sp140`, `sp50`, `sp100`

---

## 4. Platform Configuration Files

- **Unified Configuration:** `configs/kawaiikutir.json`
- **Dashboard Configuration:** `dashboard/src/clientConfig/04kawaiikutir/config.json`
- **Dashboard Registry:** `dashboard/src/clientConfig/index.js`
- **Backend CORS & Allowed Origins:** `backend/src/app.js`
- **Sync Command:** `node scripts/sync-config.js kawaiikutir`
