# Project Architecture & Directory Map (`z_architecture.md`)

> **Note for AI Assistant / LLM**: Read this file to instantly understand the full-stack architecture, folder layout, data flow, and key patterns of this repository without needing to scan every folder.

---

## 1. Project Overview & Multi-App Layout

This repository is a **Monorepo / Multi-App Fullstack E-Commerce System** named **Decantre**. It consists of three primary applications and root orchestration files.

```
Decantre_Fullstack/
├── backend/          # Node.js (ESM) + Express + MongoDB REST API backend
├── frontend/         # React + Vite customer-facing Storefront application
├── dashboard/        # Next.js (App Router) + Tailwind + TypeScript Admin Panel
├── docker-compose.yml / dev / prod # Docker container orchestrations
├── nginx.conf / prod # Nginx reverse proxy configurations
└── z_*.md            # Architectural, command, and deployment guides (Root level context)
```

---

## 2. Comprehensive Directory Structure

### 🔹 Root Directory
- `Makefile` - Development and deployment shortcut commands.
- `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.prod.yml` - Docker compose setups for local dev, staging, and production environments.
- `nginx.conf`, `nginx-prod.conf`, `nginx-prod-secure.conf` - Nginx reverse-proxy rules routing requests (`/api` -> backend, `/dashboard` -> dashboard app, `/` -> storefront).
- `prod-deploy.sh`, `prod-deploy-v2.sh`, `update-deploy.sh` - Automated deployment scripts for Linux servers.
- `z_command.md` - Useful deployment, docker, and operational commands.
- `z_domainConnect.md` - Domain, SSL, and DNS connection guides.
- `z_git_architecture_guide.md` - Multi-client Git branch & environment configuration strategy.
- `z_architecture.md` - **[THIS FILE]** Overall architecture map & guide for AI & developers.

---

### 🔹 1. Backend (`/backend`)
* **Tech Stack**: Node.js (>=22, ESM `"type": "module"`), Express.js (v5), MongoDB + Mongoose (v8), Zod validation, JWT authentication, Sharp image processing, Pino logger.

#### Folder Map:
```
backend/
├── src/
│   ├── app.js               # Express app initialization, CORS, middleware, global error handling
│   ├── server.js            # Server entry point (starts server listening on specified PORT)
│   ├── database/
│   │   └── index.js         # MongoDB connection setup using Mongoose
│   ├── core/                # Public Storefront Logic & APIS
│   │   ├── controllers/     # Core Business logic controllers (Products, Orders, Auth, Cart, etc.)
│   │   ├── helper/          # Utility helpers & calculation functions
│   │   ├── middlewares/     # Auth checks, admin authorization, validation middlewares
│   │   ├── models/          # Mongoose database schemas & models for core storefront
│   │   ├── routes/          # Express route definitions for core storefront endpoints
│   │   ├── routesIndex.js   # Centralized aggregator for all core routes
│   │   └── utils/           # Shared backend utility functions
│   ├── dashboard/           # Admin Dashboard-Specific Backend APIs
│   │   ├── controllers/     # Admin-only business logic (Inventory management, Analytics, Order admin)
│   │   ├── models/          # Admin/Dashboard specific schemas or extensions
│   │   └── routes/          # Admin API endpoints (prefixed/isolated for dashboard)
│   ├── assets/              # Uploaded assets & static file storage
│   └── templates/           # Email templates (Nodemailer html templates)
├── scripts/                 # Maintenance, migration, and DB seed scripts
├── API_ENDPOINTS.md         # Detailed backend API documentation
├── Dockerfile               # Backend Docker build instructions
└── package.json             # ESM Express configuration & dependencies
```

---

### 🔹 2. Customer Frontend (`/frontend`)
* **Tech Stack**: React 18+, Vite, Tailwind CSS, Lucide React, Bun/NPM package management.
* **Role**: Customer-facing web shop / storefront UI.

#### Folder Map:
```
frontend/
├── src/
│   ├── main.jsx             # React DOM entry point
│   ├── App.jsx              # Main App component with routing & layout wrappers
│   ├── index.css            # Global CSS styles & Tailwind configuration
│   ├── config.theme.json    # Storefront theme configuration (colors, branding)
│   ├── core/                # Core customer UI modules & flows
│   ├── components/          # Reusable UI components (Buttons, Cards, Inputs, Modals, Navbar, Footer)
│   ├── pages/               # Top-level view pages (Home, ProductDetails, Cart, Checkout, Profile)
│   ├── data/                # Mock data or static data definitions
│   └── utils/               # Client-side helper functions & API fetch wrappers
├── public/                  # Static assets (images, icons, favicons)
├── index.html               # Main HTML entry file for Vite
├── vite.config.js           # Vite build & alias configuration
└── package.json             # Frontend dependencies & scripts (`bun run dev` / `npm run dev`)
```

---

### 🔹 3. Admin Dashboard (`/dashboard`)
* **Tech Stack**: Next.js (App Router, TypeScript), Tailwind CSS, Radix UI / Shadcn components, Zustand / Redux state store.
* **Role**: Internal store management, inventory control, order fulfillment, user management, and analytics.

#### Folder Map:
```
dashboard/
├── app/                     # Next.js App Router root
│   ├── layout.tsx           # Main root layout context & font setups
│   ├── globals.css          # Next.js global Tailwind styles
│   └── (core)/              # Route Group for core dashboard views
│       ├── page.tsx         # Dashboard landing redirect/view
│       ├── login/           # Admin authentication route (`/login`)
│       └── dashboard/       # Protected Dashboard area (`/dashboard/*`)
├── components/              # Dashboard UI components (Sidebar, DataTables, Charts, Header)
├── hooks/                   # Custom React hooks for dashboard state/data fetching
├── lib/                     # Axios/Fetch client, API helpers, utility functions
├── store/                   # Global state management stores
├── types/                   # TypeScript interfaces & type definitions
├── utils/                   # Dashboard specific utilities
├── instructions.md          # Guidelines for dashboard development
└── package.json             # Next.js dependencies & scripts
```

---

## 3. Communication & Data Flow Architecture

```
[ Customer Browser ]         [ Admin Browser ]
         │                           │
         │ (HTTP / React)            │ (HTTP / Next.js)
         ▼                           ▼
 ┌──────────────────────────────────────────────┐
 │             Nginx Reverse Proxy              │
 │  - /           -> Frontend container (Vite)  │
 │  - /dashboard  -> Dashboard container (Next) │
 │  - /api        -> Backend container (Express)│
 └──────────────────────┬───────────────────────┘
                        │
                        ▼
 ┌──────────────────────────────────────────────┐
 │               Express Backend                │
 │  - Router Core        (Storefront APIs)      │
 │  - Router Dashboard   (Admin Management APIs)│
 │  - Auth Middleware    (JWT Token Validation) │
 └──────────────────────┬───────────────────────┘
                        │ (Mongoose ESM Driver)
                        ▼
 ┌──────────────────────────────────────────────┐
 │               MongoDB Database               │
 └──────────────────────────────────────────────┘
```

---

## 4. Key Conventions for AI Developers & Agents

1. **Backend Layer Separation**:
   - Storefront APIs live inside `backend/src/core/`.
   - Admin-only APIs live inside `backend/src/dashboard/`.
   - Never leak admin endpoints into public routes.

2. **Frontend vs Dashboard**:
   - `frontend/` is pure Vite + React (Client side rendered).
   - `dashboard/` is Next.js App Router with TypeScript.

3. **Branch & Environment Guidelines**:
   - Always refer to `z_git_architecture_guide.md` when modifying environment configuration.
   - Do not commit local `.env` files to git. Use `.env.example` templates.

4. **Root Docs (`z_*`)**:
   - Any operational or architectural document in root must start with `z_` for quick AI & developer recognition.
