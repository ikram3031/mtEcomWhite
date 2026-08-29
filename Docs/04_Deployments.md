# Multi-Client VPS Deployments & Port Mapping Directory

This document serves as the master record of all white-label clients deployed on the VPS hosts.

---

## 1. Decantre VPS Host (`144.79.218.126`)

### A. Environment Paths & Volumes
- **Primary Codebase (Live):** `/opt/live` (Branch: `Live`)
- **Legacy Codebase (Dev):** `/opt/dev` (Branch: `Decantre`)
- **Client Configuration Root:** `/opt/decantre/configs/`
- **Uploads/Assets Directory:** `/var/www/uploads/` & `/opt/decantre/uploads/`

### B. Active Containers & Port Routing
| Container Name | Service / Role | Host Port Binding | Internal Port | Domain / Routing | Exposure Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`decantre-backend-live`** | Express Node.js API | `127.0.0.1:5093` | `5093` | `https://service.decantrebd.com` & `https://server.decantrebd.com` | Reverse Proxied via Nginx |
| **`decantre-dashboard-live`** | React/Vite Dashboard | `127.0.0.1:8015` | `8005` | `https://v2.decantrebd.com` | Reverse Proxied via Nginx |
| **`decantre-mongodb-live`** | MongoDB Engine | `127.0.0.1:27017` | `27017` | Direct Access / Local IP | **Localhost Only (SSH Tunnel)** |
| **`devtest-backend`** | DevTest Express API (`/opt/dev`) | `127.0.0.1:5092` | `5092` | Reverse Proxied / Localhost | Localhost Only |
| **`devtest-mongodb`** | DevTest MongoDB (`/opt/dev`) | `127.0.0.1:27018` | `27017` | Direct Access (Port `27018`) | Localhost Only |
| **`decantre-frontend-live`** | Production Frontend | `127.0.0.1:8001` | `8001` | `https://decantrebd.com` | Reverse Proxied via Nginx |

---

## 2. Engulfic & Toyoland VPS Host (`144.79.218.8`)

### A. Environment Paths & Volumes
- **Engulfic Codebase (Live):** `/opt/live` (Branch: `Live`)
- **Toyoland Dev Codebase (Dev):** `/ikram/Toyoland` (Branch: `Live`)
- **Engulfic Configurations:** `/opt/engulfic/configs/`
- **Toyoland Configurations:** `/opt/toyoland-dev/configs/`
- **Engulfic Uploads:** `/var/www/uploads/` & `/opt/engulfic/uploads/`
- **Toyoland Uploads:** `/ikram/caution/uploads/`

### B. Active Containers & Port Routing
| Container Name | Client / Service | Host Port Binding | Internal Port | Domain / Routing | Exposure Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`engulfic-backend-live`** | Engulfic Live API | `127.0.0.1:5094` | `5092` | `https://server.engulfic.com` | Reverse Proxied via Nginx |
| **`engulfic-dashboard-live`** | Engulfic Live Dashboard | `127.0.0.1:8015` | `8005` | `https://dashboard.engulfic.com` | Reverse Proxied via Nginx |
| **`engulfic-mongodb-live`** | Engulfic MongoDB | `127.0.0.1:27017` | `27017` | Direct Access | **Localhost Only (SSH Tunnel)** |
| **`engulfic-frontend`** | Engulfic Legacy Frontend | `127.0.0.1:8001` | `8001` | `https://engulfic.com` | Reverse Proxied via Nginx |
| **`toyoland-backend-dev`** | Toyoland Dev API | `127.0.0.1:5092` | `5092` | Direct Access / Local IP | Localhost Only |
| **`toyoland-dashboard-dev`** | Toyoland Dev Dashboard | `127.0.0.1:8005` | `8005` | Direct Access / Local IP | Localhost Only |
| **`toyoland-frontend`** | Toyoland Dev Frontend | `127.0.0.1:8006` | `8006` | Direct Access (Port `8006`) | Localhost Only |
| **`toyoland-mongodb-dev`** | Toyoland MongoDB | `127.0.0.1:27018` | `27017` | Direct Access | **Localhost Only (SSH Tunnel)** |

---

## 3. General Maintenance Workflows

### A. Sourcing Custom Configs on VPS
Since we use dynamic compose settings, always run deployments with the environment file flag:
```bash
# Example for Toyoland Dev:
docker compose --env-file /opt/toyoland-dev/configs/backend.env -f docker-compose.prod.yml up -d --build

# Example for Engulfic Live:
docker compose --env-file /opt/engulfic/configs/backend.env -f docker-compose.prod.yml up -d --build
```

### B. Updating Database Access IPs (Firewall)
If your public IP changes and you can no longer connect via Mongo Compass:
```bash
# 1. Inspect dropped packets log to find your new IP:
dmesg | grep MONGO_DROP | tail -n 5

# 2. Add your new IP to iptables:
iptables -I DOCKER-USER -i ens3 -p tcp -s <NEW_IP> --dport <PORT> -j ACCEPT

# 3. Save the rules persistently:
netfilter-persistent save
```
*(On Decantre VPS, the active port is `27017` (live). On Engulfic VPS, ports are `27017` and `27018`).*
