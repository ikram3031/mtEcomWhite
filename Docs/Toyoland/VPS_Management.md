# Toyoland Dev VPS & Deployment Management Guide

This document serves as the complete operational manual for managing the **Toyoland Dev** environment on the Engulfic VPS (`144.79.218.8`).

---

## 1. Directory Structure on VPS

The architecture decouples the **codebase** from the **client configuration** (white-label setup) and maps to the custom directories requested by the client.

| Purpose | Path on VPS | Description |
| :--- | :--- | :--- |
| **Codebase (Live)** | `/ikram/Toyoland` | The codebase repository cloned from the `Live` branch. Contains `backend`, `dashboard`, and `docker-compose.prod.yml`. |
| **Client Configs** | `/opt/toyoland-dev/configs` | Contains all sensitive `.env` files specific to Toyoland Dev. **Never committed to Git.** |
| **Client Uploads** | `/ikram/caution/uploads` | Stores all persistent product/user images and assets. |

---

## 2. Configuration & Environment Variables (.env)

The environment variables are stored centrally on the VPS host and mounted directly into the Docker containers at runtime. This ensures that any `git pull` or branch switch will **never** overwrite production credentials.

### File Locations:
1. **Backend Env:** `/opt/toyoland-dev/configs/backend.env`
2. **Dashboard Env:** `/opt/toyoland-dev/configs/dashboard.env`

### How to Edit Configs:
If you need to change a database password, JWT secret, or update ports:
```bash
ssh -i "C:\Users\mdikr\.ssh\engulfic" root@144.79.218.8
nano /opt/toyoland-dev/configs/backend.env
```
*(After editing, you must restart the backend container for changes to take effect).*

---

## 3. Docker Volume Mounts & Static Files

To ensure data persistence and correct file paths, volumes are strictly mapped between the VPS host and the containers.

### Backend Volumes
- **Env:** `/opt/toyoland-dev/configs/backend.env` → `/app/.env` (Read-only)
- **Uploads (Primary):** `/ikram/caution/uploads` → `/app/uploads`
- **Uploads (Secondary):** `/ikram/caution/uploads` → `/app/src/uploads`

### Database Volumes
- **MongoDB Data:** Docker internal volume `toyoland-dev_mongodb-data`

---

## 4. How to Redeploy (Update Development)

Whenever new code is merged into the `Live` branch on GitHub, follow these exact steps to update the Toyoland Dev server:

```bash
# 1. Login to the VPS
ssh -i "C:\Users\mdikr\.ssh\engulfic" root@144.79.218.8

# 2. Go to the Toyoland codebase directory
cd /ikram/Toyoland

# 3. Pull the latest code from GitHub
git pull origin Live

# 4. Set the client name environment variable
export CLIENT_NAME=toyoland-dev

# 5. Rebuild and restart the containers in the background
docker compose --env-file /opt/toyoland-dev/configs/backend.env -f docker-compose.prod.yml up -d --build
```
*Note: We use `--build` to ensure any new `npm install` packages are baked into the fresh container images.*

---

## 5. Docker Containers & Ports

| Service | Container Name | Internal Port | Host Port | Connected Domain / IP |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | `toyoland-backend-dev` | `5092` | `5092` | Direct access or reverse proxy to domain later |
| **Dashboard** | `toyoland-dashboard-dev` | `8005` | `8005` | Direct access or reverse proxy to domain later |
| **Database** | `toyoland-mongodb-dev` | `27017` | `27018` (Host) | Direct IP (Port `27018`) via Firewall Rules |

---

## 6. Useful Maintenance Commands

### Check Live Logs
If the site crashes or you need to debug API requests:
```bash
# View backend logs (tail last 50 lines and follow live)
docker logs toyoland-backend-dev --tail 50 -f

# View dashboard logs
docker logs toyoland-dashboard-dev --tail 50 -f
```

### Restart Services (Without Rebuilding)
If you just changed an `.env` file and need to restart the app:
```bash
docker restart toyoland-backend-dev
docker restart toyoland-dashboard-dev
```

### Check Running Status
```bash
docker ps --filter name=toyoland --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## 7. Security & File Permissions
The `.env` files contain sensitive information. They must be secured on the host machine.
If the backend fails to start because it cannot read `.env`, verify permissions:
```bash
# The files must be readable by the Node.js user inside the container
chmod 644 /opt/toyoland-dev/configs/*.env
```
