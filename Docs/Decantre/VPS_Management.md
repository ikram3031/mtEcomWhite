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

## 4. How to Redeploy (Update Production)

Whenever new code is merged into the `Live` branch on GitHub, follow these exact steps to update the live server:

```bash
# 1. Login to the VPS
ssh root@144.79.218.126

# 2. Go to the live codebase directory
cd /opt/live

# 3. Pull the latest code from GitHub
git pull origin Live

# 4. Set the client name environment variable
export CLIENT_NAME=decantre

# 5. Rebuild and restart the containers in the background
docker compose -f docker-compose.prod.yml up -d --build
```
*Note: We use `--build` to ensure any new `npm install` packages are baked into the fresh container images.*

---

## 5. Docker Containers & Ports

| Service | Container Name | Internal Port | Host Port | Connected Domain |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | `decantre-backend-live` | `5093` | `5093` | `https://service.decantrebd.com` |
| **Dashboard** | `decantre-dashboard-live` | `8005` | `8015` | `https://v2.decantrebd.com` |
| **Database** | `decantre-mongodb-live` | `27017` | `None` (Internal) | `N/A` |

---

## 6. Useful Maintenance Commands

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

## 7. Security & File Permissions
The `.env` files contain sensitive information. They must be secured on the host machine.
If the backend fails to start because it cannot read `.env`, verify permissions:
```bash
# The files must be readable by the Node.js user inside the container
chmod 644 /opt/decantre/configs/*.env
```
