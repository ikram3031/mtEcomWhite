# Decantre VPS & Deployment Management Guide

This document serves as the complete operational manual for managing the **Decantre** production environment on the VPS (`144.79.218.126`).

---

## 1. Directory Structure on VPS

The architecture strictly decouples the **codebase** from the **client configuration** (white-label setup). 

| Purpose | Path on VPS | Description |
| :--- | :--- | :--- |
| **Codebase (Live)** | `/opt/live` | The central repository cloned from the `Live` branch. Contains `backend`, `dashboard`, and `docker-compose.prod.yml`. |
| **Client Configs** | `/opt/decantre/configs` | Contains all sensitive `.env` files specific to Decantre. **Never committed to Git.** |
| **Client Uploads** | `/var/www/uploads` | Stores all persistent product/user images and assets. |

---

## 2. Configuration & Environment Variables (.env)

The environment variables are stored centrally on the VPS host and mounted directly into the Docker containers at runtime. This ensures that any `git pull` or branch switch will **never** overwrite production credentials.

### File Locations:
1. **Backend Env:** `/opt/decantre/configs/backend.env`
2. **Dashboard Env:** `/opt/decantre/configs/dashboard.env`

### How to Edit Configs:
If you need to change a database password, JWT secret, or update the CORS `ALLOWED_ORIGINS`:
```bash
ssh root@144.79.218.126
nano /opt/decantre/configs/backend.env
```
*(After editing, you must restart the backend container for changes to take effect).*

---

## 3. Docker Volume Mounts & Static Files

To ensure data persistence and correct file paths, volumes are strictly mapped between the VPS host and the containers.

### Backend Volumes
- **Env:** `/opt/decantre/configs/backend.env` → `/app/.env` (Read-only)
- **Uploads (Primary):** `/var/www/uploads` → `/app/src/uploads`
- **Uploads (Secondary):** `/opt/decantre/uploads` → `/app/uploads`

### Database Volumes
- **MongoDB Data:** Docker internal volume `live_mongodb-data`

---

## 4. Domain & Environment Architecture

The Decantre system is structured into two distinct operational environments:

### 🛠️ Development & Staging Environment:
- **Frontend Storefront:** `https://dev.decantrebd.com`
- **Dashboard Management:** `https://v2.decantrebd.com`
- **Backend API:** `https://service.decantrebd.com`

### 🚀 Production & Live Environment:
- **Frontend Storefront:** `https://decantrebd.com`
- **Dashboard Management:** `https://dashboard.decantrebd.com`
- **Backend API:** `https://server.decantrebd.com`

---

## 5. How to Redeploy (Update Live / Production)

Whenever new code is committed and pushed to the `Live` branch on GitHub, follow these exact commands to update the VPS:

```bash
# 1. Login to the VPS
ssh root@144.79.218.126

# 2. Go to the live codebase directory
cd /opt/live

# 3. Pull latest code from Live branch
git pull origin Live

# 4. Rebuild and restart the containers with explicit client configs
CLIENT_NAME=decantre \
CLIENT_CONFIG_PATH=/opt/decantre/configs \
PUBLIC_UPLOADS_PATH=/opt/decantre/uploads \
docker compose --env-file /opt/decantre/configs/backend.env -f docker-compose.prod.yml up -d --build
```
*Note: Using `--build` guarantees that all Vite frontend assets, Tailwind CSS bundles, and Node.js dependencies are freshly compiled into the Docker image.*

---

## 6. Docker Containers, Ports & Nginx Reverse Proxy
All application containers bind strictly to `127.0.0.1` (localhost) to prevent direct public exposure and ensure all traffic is filtered through Nginx SSL.

| Service | Container Name | Internal Port | Host Port Binding | Public Domains | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend API** | `decantre-backend-live` | `5093` | `127.0.0.1:5093` | `https://server.decantrebd.com` (Prod)<br>`https://service.decantrebd.com` (Dev) | Express API, Auth, MongoDB |
| **Dashboard** | `decantre-dashboard-live` | `8005` | `127.0.0.1:8015` | `https://dashboard.decantrebd.com` (Prod)<br>`https://v2.decantrebd.com` (Dev) | Vite + React Admin Panel |
| **Frontend** | `decantre-frontend-live` | `8001` | `0.0.0.0:8001` | `https://decantrebd.com` (Prod)<br>`https://dev.decantrebd.com` (Dev) | Storefront UI |
| **Database** | `decantre-mongodb-live` | `27017` | `127.0.0.1:27017` | `N/A` (Internal Docker network only) | **Localhost Only** (SSH Tunnel Access) |

---

## 7. Useful Maintenance Commands

### Check Live Logs
If the site crashes or you need to debug API requests:
```bash
# View backend logs (tail last 50 lines and follow live)
docker logs decantre-backend-live --tail 50 -f

# View dashboard logs
docker logs decantre-dashboard-live --tail 50 -f
```

### Restart Services (Without Rebuilding)
If you just changed an `.env` file and need to restart the app:
```bash
docker restart decantre-backend-live
docker restart decantre-dashboard-live
```

### Check Running Status
```bash
docker ps --filter name=decantre --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## 8. Security & File Permissions
The `.env` files contain sensitive information. They must be secured on the host machine.
If the backend fails to start because it cannot read `.env`, verify permissions:
```bash
# The files must be readable by the Node.js user inside the container
chmod 644 /opt/decantre/configs/*.env
```

---

## 9. Database Security & Firewall Hardening (CRITICAL)

### A. Why 0.0.0.0 Port Binding is Dangerous
- By default, Docker injects `PREROUTING` rules into Linux `iptables` that **bypass standard UFW firewall rules**.
- If MongoDB port is mapped without a host IP (e.g. `27017:27017` or `0.0.0.0:27017`), it becomes accessible to the entire public Internet, exposing the database to automated ransomware bots and brute-force dictionary attacks.
- In our `docker-compose.prod.yml`, all database and application ports are strictly bound to `127.0.0.1`:
  ```yaml
  ports:
    - "127.0.0.1:${MONGODB_PORT:-27017}:27017"
  ```

### B. Verify Port Binding on VPS
Log into the VPS and check active listening sockets:
```bash
ss -tulpn | grep 27017
# Expected output:
# tcp LISTEN 0 4096 127.0.0.1:27017 0.0.0.0:* users:(("docker-proxy",...))
```
*(If the output shows `0.0.0.0:27017` or `:::27017`, rebuild compose with `docker compose -f docker-compose.prod.yml up -d`)*

### C. Recommended VPS Firewall (UFW) Rules
Keep the VPS attack surface minimal by opening only SSH and web traffic ports:
```bash
# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow standard web & SSH ports
ufw allow 22/tcp    # SSH (or your custom SSH port)
ufw allow 80/tcp    # HTTP (Let's Encrypt & Redirect)
ufw allow 443/tcp   # HTTPS (Nginx SSL)

# Enable firewall
ufw enable
ufw status verbose
```

### D. Connecting to MongoDB Remotely via MongoDB Compass (SSH Tunnel)
Because port `27017` is blocked from the public internet, developers and database admins connect securely through an encrypted SSH tunnel.

#### Configuration in MongoDB Compass:
1. **Connection String / Host**: `mongodb://localhost:27017`
2. **Authentication Tab**:
   - Authentication: `Username / Password`
   - Username: `<MONGO_INITDB_ROOT_USERNAME>`
   - Password: `<MONGO_INITDB_ROOT_PASSWORD>`
   - Authentication DB: `admin`
3. **Proxy / SSH Tunnel Tab**:
   - Proxy Method: `SSH with Password` (or `SSH with Identity File`)
   - SSH Hostname: `144.79.218.126`
   - SSH Port: `22`
   - SSH Username: `root`
   - SSH Password or Key File: *(Your VPS SSH credential)*
4. Click **Connect** — Compass communicates through the encrypted SSH tunnel directly into `127.0.0.1:27017`.

