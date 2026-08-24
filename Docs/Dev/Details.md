# Dev Environment Deployment Details (DevTest)

This document provides a comprehensive operational guide for the **DevTest** development environment deployed on the Decantre VPS host (`144.79.218.126`).

---

## 1. Architecture & Container Specifications

The Dev environment runs isolated from the production environment on dedicated ports and containers.

| Service | Container Name | Host Port | Internal Port | Network | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dev API Backend** | `devtest-backend` | `5092` | `5092` | `dev_client-network` | 🟢 Active |
| **Dev MongoDB** | `devtest-mongodb` | `27018` | `27017` | `dev_client-network` | 🟢 Active |

---

## 2. Paths, Codebase & Config Directories

| Purpose | Path on VPS | Description |
| :--- | :--- | :--- |
| **Dev Codebase** | `/opt/dev` | Git working directory (Branch: `Decantre` / `temp`) |
| **Dev Configs** | `/opt/devtest/configs/` | Contains `backend.env` for environment variables |
| **Active Client Target** | `/opt/dev/.client` | Set to `devtest` |
| **Shared Uploads** | `/var/www/uploads` | Mounted to `/app/uploads` for persistent product & banner images |

---

## 3. Database Configuration

- **Engine:** MongoDB 7.0 (Container: `devtest-mongodb`)
- **Database Name:** `Perfume`
- **Host Port:** `27018` (Exposed publicly / Whitelisted IP)
- **Internal Port:** `27017`
- **Root Username:** `admin`
- **Root Password:** `11223345`
- **Internal Connection URI (Container-to-Container):**
  ```
  mongodb://admin:11223345@devtest-mongodb:27017/Perfume?authSource=admin
  ```
- **External Connection URI (Mongo Compass / Remote):**
  ```
  mongodb://admin:11223345@144.79.218.126:27018/Perfume?authSource=admin
  ```
- **Cloned Data:** 8,812 total documents (including 456 full product documents, categories, users, reviews, and logs cloned from live).

---

## 4. CORS & Access Configuration

The Dev backend is configured with open CORS access so that any frontend client, local development server (`localhost:3000`, `localhost:5173`), staging domain, or API tool (Postman, ThunderClient) can access the API seamlessly.

- **`ALLOWED_ORIGINS=*`** (Permissive wildcard origin policy with `credentials: true`)
- **Supported Methods:** `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`

---

## 5. Maintenance & Deployment Commands

### Rebuilding & Deploying Dev Backend
```bash
# 1. SSH into VPS
ssh root@144.79.218.126

# 2. Navigate to dev directory
cd /opt/dev

# 3. Pull latest changes
git pull origin Decantre

# 4. Rebuild and launch backend
CLIENT_NAME=devtest CLIENT_CONFIG_PATH=/opt/devtest/configs docker compose --env-file /opt/devtest/configs/backend.env -f docker-compose.prod.yml up -d --build backend
```

### Restarting Dev Backend
```bash
docker restart devtest-backend
```

### Checking Logs
```bash
# Backend Logs
docker logs devtest-backend --tail 50 -f

# MongoDB Logs
docker logs devtest-mongodb --tail 50 -f
```

### Refreshing Data from Live Database
To re-clone the latest data from `decantre-mongodb-live` into the dev `Perfume` database:
```bash
docker exec decantre-mongodb-live mongodump -u admin -p 11223345 --authenticationDatabase admin --db DecantreBD --archive | \
docker exec -i devtest-mongodb mongorestore -u admin -p 11223345 --authenticationDatabase admin --drop --nsFrom='DecantreBD.*' --nsTo='Perfume.*' --archive
```

---

## 6. Local Frontend & Dashboard Connection

When running frontend apps locally on your machine, configure them to point to the DevTest Backend (`http://144.79.218.126:5092`):

### A. Decantre Frontend (`F:\Decantre\.env`, `.env.local`, `.env.development`)
```env
VITE_API_URL=http://144.79.218.126:5092
VITE_IMAGE_BASE_URL=http://144.79.218.126:5092
```

### B. Dashboard (`F:\AFull\dashboard\.env`, `.env.local`, `.env.development`)
```env
VITE_API_BASE_URL=http://144.79.218.126:5092
```

---

## 7. API Verification & Testing

- **Health Check / Root:**
  ```bash
  curl http://144.79.218.126:5092/
  ```
- **List Products:**
  ```bash
  curl "http://144.79.218.126:5092/api/v1/products?limit=5"
  ```

