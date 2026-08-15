# White-Label Client Onboarding & Setup Guide (`Docs/02_Onboard_Client.md`)

This guide explains how to set up and deploy a new client using the centralized, white-labeled architecture. We will use the client **"Decantre"** and **"Engulfic"** as setup references.

---

## Prerequisites
1. Root SSH access to the client VPS (e.g., `144.79.218.126` or `144.79.218.8`).
2. Git installed on the VPS.
3. Docker & Docker Compose installed on the VPS.

---

## Setup Steps

### Step 1: Initialize Client Directories & Config Templates
Log in to your VPS as root and navigate to the project directory where you cloned the repository (`/opt/live`). Run the setup script with the client name (lowercase, no spaces):

```bash
# syntax: bash client-setup.sh <client_name>
bash client-setup.sh decantre
# or for engulfic:
bash client-setup.sh engulfic
```

This will automatically create:
- `/opt/<client>/configs/` (Secure configurations, chmod `700`)
- `/opt/<client>/uploads/` (Static media storage, chmod `755`)
- `/opt/<client>/configs/backend.env` (Template for database, port, and SMTP credentials)
- `/opt/<client>/configs/dashboard.env` (Template for dashboard API routing variables)

---

## Step 2: Configure Environment Files

### 1. Configure Backend Environment (`/opt/<client>/configs/backend.env`)
Open the backend configuration file:
```bash
nano /opt/<client>/configs/backend.env
```

Fill in the client credentials. Example configuration for **Engulfic**:
```env
NODE_ENV=production
PORT=5094

# Client Identifier & Config Mount
CLIENT_NAME=engulfic
CLIENT_CONFIG_PATH=/opt/engulfic/configs

# MongoDB Connection & Credentials
MONGODB_URI=mongodb://admin:<your_db_password>@engulfic-mongodb-live:27017/engulfic-db?authSource=admin
MONGODB_DB_NAME=engulfic-db

# Container Names
MONGODB_CONTAINER_NAME=engulfic-mongodb-live
BACKEND_CONTAINER_NAME=engulfic-backend-live
DASHBOARD_CONTAINER_NAME=engulfic-dashboard-live

MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=<your_db_password>
MONGO_INITDB_DATABASE=engulfic-db

# Port Mappings
BACKEND_PORT=5094
DASHBOARD_PORT=8015

# Security & JWT
ACCESS_TOKEN_SECRET=your_jwt_access_token_secret_key_at_least_20_chars
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_MS=2592000000

# SMTP / Email
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_ENCRYPTION=TLS
SMTP_USER=info@engulfic.com
SMTP_PASSWORD=<your_smtp_password>
SMTP_FROM_NAME=Engulfic
SMTP_FROM=info@engulfic.com

# Dynamic CORS & Source Routing
ALLOWED_ORIGINS=https://engulfic.com,https://dashboard.engulfic.com,https://server.engulfic.com,http://localhost:8005
FRONTEND_DOMAIN_KEYWORDS=engulfic.com
DASHBOARD_DOMAIN_KEYWORDS=dashboard.engulfic.com
```

> [!IMPORTANT]
> **Pre-Deployment CORS Checklist:**
> To prevent CORS issues when deploying new clients or custom domains (e.g. `https://dashboard.toyoland.shop`, `https://toyoland.shop`, `https://server.toyoland.shop`):
> 1. Always list all custom storefront, dashboard, and API URLs in `ALLOWED_ORIGINS` inside `/opt/<client>/configs/backend.env`.
> 2. The backend (`backend/src/app.js`) automatically validates requests against `ALLOWED_ORIGINS` and dynamically allows any origin matching registered client keywords (`toyoland`, `engulfic`, `decantre`, etc.) to guarantee seamless cross-origin requests.

### 2. Configure Dashboard Environment (`/opt/<client>/configs/dashboard.env`)
Open the dashboard configuration file:
```bash
nano /opt/<client>/configs/dashboard.env
```

Provide the public API base URL and client key:
```env
PORT=8005
VITE_PORT=8005
VITE_API_BASE_URL=https://server.engulfic.com
VITE_CLIENT=engulfic
```

> [!NOTE]
> **VITE_CLIENT Parameter:**
> This variable controls client-specific properties like theme branding, custom logos, and menu permissions. Make sure to match the client key exactly as defined in `dashboard/src/clientConfig` folders (`01decantre`, `02engulfic`, `03toyoland`).

---

## Step 3: Run Automated Deployment via Makefile

Our dynamic `Makefile` handles client auto-detection, environment loading, and container lifecycle automatically.

Navigate to `/opt/live` and run:

```bash
cd /opt/live

# 1. Full Deploy (Backend + Dashboard + MongoDB):
make deploy

# 2. Granular Builds:
make build-dashboard    # Rebuild & restart only the dashboard container
make build-backend      # Rebuild & restart only the backend container

# 3. Status & Logs:
make status             # Check all container status & health
make logs-dashboard     # View live dashboard logs
make logs-backend       # View live backend API logs
```

### Manual Client Override:
If multiple client folders exist or you want to explicitly specify the tenant:
```bash
make deploy CLIENT=engulfic
make deploy CLIENT=decantre
```

---

## Step 4: Configure Nginx Reverse Proxy
Ensure the Nginx configuration on the VPS routes the domain names appropriately to the allocated host ports:
- **Storefront Frontend:** Running on host port `8001` -> `proxy_pass http://127.0.0.1:8001;`
- **Backend API:** Running on host port `5094` (or `5092`) -> `proxy_pass http://127.0.0.1:5094;`
- **Admin Dashboard:** Running on host port `8015` (or `8005`) -> `proxy_pass http://127.0.0.1:8015;`
