# Decantre Fullstack - VPS Deployment & Architecture Documentation (`z_deployments.md`)

This document provides a comprehensive reference for the server environments, domain/subdomain mappings, Git branches, Docker container allocations, and database configurations on the VPS (`144.79.218.126`).

---

## 1. Environment Architecture & Git Branch Matrix

| Environment                      | Purpose                          | VPS Directory Path | Git Branch |
| :------------------------------- | :------------------------------- | :----------------- | :--------- |
| **Primary / Dev (current live)** | Active Development & Legacy Live | `/opt/dev`         | `Decantre` |
| **Production / Live**            | Dedicated Production Deployment  | `/decantre/live`   | `Live`     |

---

## 2. Domain & Subdomain Nginx Routing Matrix

All web traffic is routed through Nginx reverse proxy on the VPS with active Let's Encrypt HTTPS (SSL) certificates.

| Domain / Subdomain                 | Connected Application   | Target Proxy Port       | Host Directory   | Docker Container Name     |
| :--------------------------------- | :---------------------- | :---------------------- | :--------------- | :------------------------ |
| `https://decantrebd.com`           | Primary Frontend Client | `http://localhost:8001` | `/opt/dev`       | `decantre-frontend-dev`   |
| `https://dashboard.decantrebd.com` | Primary Admin Dashboard | `http://localhost:8005` | `/opt/dev`       | `decantre-dashboard-dev`  |
| `https://server.decantrebd.com`    | Primary Express API     | `http://localhost:5092` | `/opt/dev`       | `decantre-backend-dev`    |
| `https://service.decantrebd.com`   | Live Express API        | `http://localhost:5093` | `/decantre/live` | `decantre-backend-live`   |
| `https://dev.decantrebd.com`       | Live Frontend Client    | `http://localhost:8011` | `/decantre/live` | `decantre-frontend-live`  |
| `https://v2.decantrebd.com`        | Live Admin Dashboard    | `http://localhost:8015` | `/decantre/live` | `decantre-dashboard-live` |

---

## 3. Docker Containers & Port Allocation Matrix

### A. Primary Environment (`/opt/dev` - Branch: `Decantre`)

- **Docker Compose File**: `/opt/dev/docker-compose.dev.yml`
- **Container Suffix**: `-dev`

| Container Name           | Service                 | Internal Port | Mapped Host Port | Status & Health   |
| :----------------------- | :---------------------- | :------------ | :--------------- | :---------------- |
| `decantre-frontend-dev`  | React / Vite Frontend   | `8001`        | `8001`           | Running (Healthy) |
| `decantre-dashboard-dev` | Next.js Dashboard       | `8005`        | `8005`           | Running (Healthy) |
| `decantre-backend-dev`   | Express Node.js API     | `5092`        | `5092`           | Running (Healthy) |
| `decantre-mongodb-dev`   | MongoDB Database Engine | `27017`       | `27017`          | Running           |

### B. Production Environment (`/decantre/live` - Branch: `Live`)

- **Docker Compose File**: `/decantre/live/docker-compose.live.yml`
- **Container Suffix**: `-live`

| Container Name            | Service                 | Internal Port | Mapped Host Port | Status & Health   |
| :------------------------ | :---------------------- | :------------ | :--------------- | :---------------- |
| `decantre-frontend-live`  | React / Vite Frontend   | `8001`        | `8011`           | Running (Healthy) |
| `decantre-dashboard-live` | Next.js Dashboard       | `8005`        | `8015`           | Running (Healthy) |
| `decantre-backend-live`   | Express Node.js API     | `5093`        | `5093`           | Running (Healthy) |
| `decantre-mongodb-live`   | MongoDB Database Engine | `27017`       | `27019`          | Running           |

---

## 4. Database & Storage Architecture

### A. MongoDB Databases

- **Primary Database (`/opt/dev`)**:
  - DB Name: `perfume-store`
  - MongoDB Volume: `dev_mongodb-data-dev`
  - Record Counts: 402 Products, 829 Orders, 833 Payments, 224 Members, 131 Brands, 4 Categories, 4 System Users.
- **Production Database (`/decantre/live`)**:
  - DB Name: `perfume-store-live`
  - MongoDB Volume: `live_mongodb-data-live`
  - Record Counts: 402 Products, 829 Orders, 833 Payments, 224 Members, 131 Brands, 4 Categories, 4 System Users (restored from dump archive).

### B. Uploads & Asset Synchronization

- **Primary Uploads**: `/opt/dev/uploads` (mounted inside `decantre-backend-dev` at `/app/uploads`)
- **Live Uploads**: `/decantre/live/uploads` (mounted inside `decantre-backend-live` at `/app/uploads`)

### C. SMTP Email & OTP Configuration
- **SMTP Host**: `smtp.hostinger.com`
- **SMTP Port**: `587` (TLS)
- **SMTP User**: `info@decantrebd.com`
- **Status**: Configured in `/decantre/live/backend/.env` for member OTP emails & order notifications.

---

## 5. Key Operations & Management Commands

### A. Deploy / Update Production Environment (`/decantre/live`)

```bash
ssh root@144.79.218.126
cd /decantre/live
git fetch origin
git pull origin Live
docker compose -p live -f docker-compose.live.yml up -d --build
```

### B. Deploy / Update Primary Environment (`/opt/dev`)

```bash
ssh root@144.79.218.126
cd /opt/dev
git fetch origin
git pull origin Decantre
docker compose -f docker-compose.dev.yml up -d --build
```

### C. Check Running Containers & Logs

```bash
# Check all running containers
docker ps

# Check logs for Live Backend
docker logs decantre-backend-live --tail=50 -f

# Check logs for Live Dashboard
docker logs decantre-dashboard-live --tail=50 -f
```

### D. Take Full Database Backup

```bash
docker exec decantre-mongodb-live mongodump -u admin -p 11223345 --authenticationDatabase admin --db perfume-store-live --archive=/tmp/perfume-store-backup.archive --gzip
```
