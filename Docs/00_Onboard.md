# White-Label Client Onboarding & Setup Guide (`Docs/00_Onboard.md`)

This guide explains how to set up and deploy a new client using the centralized, white-labeled architecture. We will use the client **"Decantre"** as the setup reference.

---

## Prerequisites
1. Root SSH access to the client VPS (e.g., `144.79.218.126`).
2. Git installed on the VPS.
3. Docker & Docker Compose installed on the VPS.

---

## Setup Steps

### Step 1: Initialize Client Directories & Config Templates
Log in to your VPS as root and navigate to the project directory where you cloned the repository. Run the setup script with the client name (lowercase, no spaces):

```bash
# syntax: bash client-setup.sh <client_name>
bash client-setup.sh decantre
```

This will automatically create:
- `/opt/decantre/configs/` (Secure configurations, chmod `700`)
- `/opt/decantre/uploads/` (Static media storage, chmod `755`)
- `/opt/decantre/configs/backend.env` (Template for database & SMTP credentials)
- `/opt/decantre/configs/dashboard.env` (Template for API routing variables)

---

## Step 2: Configure Environment Files

### 1. Configure Backend Environment (`/opt/decantre/configs/backend.env`)
Open the backend configuration template:
```bash
nano /opt/decantre/configs/backend.env
```
Fill in the client credentials. Example configuration for **Decantre**:
```env
NODE_ENV=production
PORT=5092

# MongoDB Credentials
MONGODB_URI=mongodb://admin:11223345@127.0.0.1:27017/perfume-store?authSource=admin
MONGODB_DB_NAME=perfume-store

# Container Names & Initialization
MONGODB_CONTAINER_NAME=decantre-mongodb-live
BACKEND_CONTAINER_NAME=decantre-backend-live
DASHBOARD_CONTAINER_NAME=decantre-dashboard-live

MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=11223345
MONGO_INITDB_DATABASE=perfume-store

# Port Mappings
BACKEND_PORT=5092
DASHBOARD_PORT=8005

# Security
ACCESS_TOKEN_SECRET=your_jwt_access_token_secret_key_at_least_20_chars
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_MS=2592000000

# SMTP / Email
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_ENCRYPTION=TLS
SMTP_USER=contact@decantrebd.com
SMTP_PASSWORD=dec@Ntr3
SMTP_FROM_NAME=Decantre BD
SMTP_FROM=contact@decantrebd.com

# Dynamic CORS & Source Routing Log classification
ALLOWED_ORIGINS=https://dev.decantrebd.com,https://v2.decantrebd.com,https://decantrebd.com,https://dashboard.decantrebd.com
FRONTEND_DOMAIN_KEYWORDS=decantrebd.com
DASHBOARD_DOMAIN_KEYWORDS=dashboard.decantrebd.com,v2.decantrebd.com
```

### 2. Configure Dashboard Environment (`/opt/decantre/configs/dashboard.env`)
Open the dashboard configuration template:
```bash
nano /opt/decantre/configs/dashboard.env
```
Provide the public API base URL of the client backend API service:
```env
PORT=8005
VITE_PORT=8005
VITE_API_BASE_URL=https://service.decantrebd.com
```

---

## Step 3: Run the Deploy Command
Once your environment variables are configured, set the `CLIENT_NAME` system parameter and deploy using `docker compose`:

```bash
# Export the client name so docker-compose.prod.yml resolves it
export CLIENT_NAME=decantre

# Build and start services in detached mode
docker compose -f docker-compose.prod.yml up -d --build
```
Alternatively, you can run the deployment via the `Makefile` options after exporting the variable.

---

## Step 4: Configure Nginx Routing
Ensure the Nginx configuration on the VPS routes the domain names appropriately to the allocated host ports:
- Storefront Frontend (Separate repository, running on `8011` / `8001`)
- Backend API (Running on `5092` or `5093`) -> `proxy_pass http://127.0.0.1:5092;`
- Admin Dashboard (Running on `8005` or `8015`) -> `proxy_pass http://127.0.0.1:8005;`
