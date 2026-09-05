# Engulfic Complete Production & VPS Management Manual

This document provides the single source of truth for the **Engulfic** production deployment, server infrastructure, credentials, environment variables, Nginx routing, and database management.

---

## 1. VPS Infrastructure Details

| Resource | Value |
| :--- | :--- |
| **Server Hostname** | `plexivia.server.com` |
| **Server IP** | `144.79.218.112` |
| **SSH User** | `root` |
| **SSH Port** | `22` |
| **SSH Key Path (Local)** | `C:\Users\mdikr\.ssh\engulfic` |
| **SSH Connect Command** | `ssh -i "C:\Users\mdikr\.ssh\engulfic" root@144.79.218.112` |
| **OS** | Ubuntu 20.04 / 22.04 LTS Minimal |

---

## 2. Production Directory Architecture

All client assets and binaries are strictly isolated under `/engulfic/` namespace:

| Purpose | Host Path on VPS | Description |
| :--- | :--- | :--- |
| **Live Codebase** | `/engulfic/opt/live` | Multi-tenant backend, dashboard, docker compose configurations |
| **Storefront Codebase** | `/engulfic/opt/storefront` | React + Vite storefront repository |
| **Storefront Static Web** | `/engulfic/var/www/storefront/dist` | Production static build served directly by Nginx |
| **Central Configs** | `/engulfic/opt/configs` | Production `.env` files (e.g. `backend.env`) |
| **Uploads Storage** | `/engulfic/var/www/uploads` | Persistent product and gallery media |

---

## 3. Cloudflare & R2 Object Storage Credentials

Cloudflare R2 is configured for automated database backup, image asset distribution, and failover sync:

| Parameter | Value |
| :--- | :--- |
| **Account ID** | `fa0942a4bd8e442e22f78fdb6a2a605a` |
| **API Token** | `cfat_kTWWKG...[CONFIGURED_ON_VPS]` |
| **Access Key ID** | `5f0500c118548702bac32a3d027bc355` |
| **Secret Access Key** | `78903a1d53535384109a104e7a49e2c85ab6d08936f645124430a41c32b051c7` |
| **S3 API Endpoint** | `https://fa0942a4bd8e442e22f78fdb6a2a605a.r2.cloudflarestorage.com` |
| **R2 Bucket Name** | `client-hub` |
| **Storage Prefix** | `engulfic/` |
| **Public Asset Domain** | `https://media.engulfic.com` |

---

## 4. Production Environment Configuration (`/engulfic/opt/configs/backend.env`)

```env
NODE_ENV=production
PORT=5094
CLIENT_NAME=engulfic
CLIENT_CONFIG_PATH=/engulfic/opt/configs
PUBLIC_UPLOADS_PATH=/engulfic/var/www/uploads

# Port Bindings
MONGODB_PORT=27017
BACKEND_PORT=5094
DASHBOARD_PORT=8015

# MongoDB Internal URI
MONGODB_URI=mongodb://admin:engulfic_pass_2026@engulfic-mongodb-live:27017/engulfic-db?authSource=admin
MONGODB_DB_NAME=engulfic-db
MONGODB_CONTAINER_NAME=engulfic-mongodb-live
BACKEND_CONTAINER_NAME=engulfic-backend-live
DASHBOARD_CONTAINER_NAME=engulfic-dashboard-live

# Database Root Credentials
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=engulfic_pass_2026
MONGO_INITDB_DATABASE=engulfic-db

# JWT Security Secrets
ACCESS_TOKEN_SECRET=engulfic_super_jwt_secret_token_noble_2026
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_MS=2592000000

# Professional SMTP Mailer
SMTP_HOST=roxy.us.webxlogin.com
SMTP_PORT=465
SMTP_ENCRYPTION=TLS
SMTP_USER=info@engulfic.com
SMTP_PASSWORD="cx@_ujRt9ILW}@23Pt"
SMTP_FROM_NAME="Engulfic"
SMTP_FROM=info@engulfic.com

# Domain Policies & CORS
ALLOWED_ORIGINS=https://engulfic.com,https://dashboard.engulfic.com,https://server.engulfic.com,http://localhost:8015,http://localhost:5094
FRONTEND_DOMAIN_KEYWORDS=engulfic.com
DASHBOARD_DOMAIN_KEYWORDS=dashboard.engulfic.com

# Meta Pixel & Server-Side Conversions API (CAPI)
FB_PIXEL_ID=881944871465552
FB_ACCESS_TOKEN=EABA1t6647xYBSe...[STORED_ON_VPS]

# API Base for Frontend Clients
VITE_API_BASE_URL=https://server.engulfic.com
VITE_CLIENT=engulfic

# Cloudflare R2 Automated Sync
R2_ACCOUNT_ID=fa0942a4bd8e442e22f78fdb6a2a605a
R2_ACCESS_KEY_ID=5f0500c118548702bac32a3d027bc355
R2_SECRET_ACCESS_KEY=78903a1d53535384109a104e7a49e2c85ab6d08936f645124430a41c32b051c7
R2_BUCKET_NAME=client-hub
R2_PUBLIC_URL=https://media.engulfic.com
R2_SYNC_INTERVAL_DAYS=2
R2_SYNC_ENABLED=true
```

---

## 5. Nginx Reverse Proxy & Domain Routing (`/etc/nginx/sites-available/engulfic.conf`)

| Domain | Target / Handler | Purpose |
| :--- | :--- | :--- |
| `engulfic.com` / `www.engulfic.com` | `root /engulfic/var/www/storefront/dist;` | Customer-facing Vite SPA with reCAPTCHA & Size charts |
| `server.engulfic.com` | `proxy_pass http://127.0.0.1:5094;` | Backend REST API & Webhooks |
| `dashboard.engulfic.com` | `proxy_pass http://127.0.0.1:8015;` | Multi-Tenant Merchant Admin Dashboard |
| `/uploads/` (on all domains) | `alias /engulfic/var/www/uploads/;` | Static asset serving with 30-day cache |

---

## 6. Docker Containers & Network Topology

All Docker ports are bound exclusively to `127.0.0.1` on the host to prevent bypass of Nginx reverse proxy and firewall filters:

```bash
docker ps --format "table {{.Names}}	{{.Status}}	{{.Ports}}"
```

| Container Name | Internal Port | Host Binding | Status |
| :--- | :--- | :--- | :--- |
| `engulfic-mongodb-live` | `27017` | `127.0.0.1:27017` | Up & Seeding Ready |
| `engulfic-backend-live` | `5094` (internal 5092) | `127.0.0.1:5094` | Healthy |
| `engulfic-dashboard-live`| `8005` | `127.0.0.1:8015` | Running |

---

## 7. Connecting to MongoDB Remotely (MongoDB Compass via SSH Tunnel)

Direct external access to MongoDB port `27017` is blocked for security. Use SSH Tunneling in Compass:

1. **Host Tab**: `mongodb://localhost:27017`
2. **Authentication**:
   - Username: `admin`
   - Password: `engulfic_pass_2026`
   - Authentication DB: `admin`
3. **SSH Tunnel Tab**:
   - Proxy Method: `SSH with Identity File`
   - SSH Hostname: `144.79.218.112`
   - SSH Port: `22`
   - SSH Username: `root`
   - SSH Identity File: `C:\Users\mdikr\.ssh\engulfic`

---

## 8. GitHub Deploy Key for VPS (`ikram3031/Engulfic`)

To allow the VPS to pull updates directly without password prompts, add this public key under **Repository Settings > Deploy Keys** on GitHub:

```text
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDrzpWYEscbKLgd5Dn+BDSDDTyEcIm2pYYt0f0GOK7BV9R75XsDV8KZn6OBoyk0VB26nHhqHtTjlwMPFv0AHmC8Gzz7EOeEFkvCuVr9vVsUvcUTZKeI3bbVSKOv7Kmo2ltL+rlf37dbHSSo2tMqsCpqhGFTLt9mji+x/odxDTnd3UgAbp30H82NIDAJnL9sZArT64iH8NqIgKe0qT6lbVnqFU3QakAtuVCZ1V8HkCPS1pLATzuKS9jjscVrZxDxaa0ybIfi0Rqmy6HDDIXk38TB6/BjkYbUXH8T2OtLdsXHB6gVqGg7YvVpPRT8CjowJInV3qEAAxJoN36asdihGG0b vps-rsa2048-key
```

---

## 9. Common Operational Commands

### Restart All Services
```bash
docker restart engulfic-backend-live engulfic-dashboard-live engulfic-mongodb-live
systemctl reload nginx
```

### View Live Logs
```bash
docker logs engulfic-backend-live -f --tail 100
docker logs engulfic-dashboard-live -f --tail 100
```
