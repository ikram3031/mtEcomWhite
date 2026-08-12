#!/bin/bash

# ============================================================
# White-Label Client Setup Script
# VPS এ নতুন ক্লায়েন্ট সেটআপ করার জন্য এই স্ক্রিপ্টটি চালান
# Run: bash client-setup.sh <client_name>
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if client name is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Client name is required.${NC}"
    echo -e "Usage: bash client-setup.sh <client_name>"
    echo -e "Example: bash client-setup.sh toyoland"
    exit 1
fi

CLIENT_NAME=$(echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d ' ')

CONFIG_DIR="/opt/$CLIENT_NAME/configs"
UPLOAD_DIR="/opt/$CLIENT_NAME/uploads"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║      White-Label Client Setup Tool       ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ── Step 1: Create required directories ──────────────────────
echo -e "${YELLOW}[1/4] Creating config and upload directories for $CLIENT_NAME...${NC}"
mkdir -p "$CONFIG_DIR"
mkdir -p "$UPLOAD_DIR"
chmod 700 "$CONFIG_DIR"    # শুধু root পড়তে পারবে
chmod 755 "$UPLOAD_DIR"
echo -e "${GREEN}✓ Directories ready at /opt/$CLIENT_NAME${NC}"

# ── Step 2: Generate backend.env ─────────────────────────────
BACKEND_ENV="$CONFIG_DIR/backend.env"

if [ -f "$BACKEND_ENV" ]; then
    echo -e "${YELLOW}[2/4] backend.env already exists. Skipping creation.${NC}"
    echo -e "      Edit manually: ${CYAN}nano $BACKEND_ENV${NC}"
else
    echo -e "${YELLOW}[2/4] Creating backend.env template...${NC}"
    cat > "$BACKEND_ENV" << 'EOF'
NODE_ENV=production
PORT=5092

# MongoDB Connection
MONGODB_URI=
MONGODB_DB_NAME=

# Container Names (ক্লায়েন্ট নাম দিয়ে পরিবর্তন করুন)
MONGODB_CONTAINER_NAME=
BACKEND_CONTAINER_NAME=
DASHBOARD_CONTAINER_NAME=
MONGO_INITDB_ROOT_USERNAME=
MONGO_INITDB_ROOT_PASSWORD=
MONGO_INITDB_DATABASE=

# Ports
BACKEND_PORT=5092
DASHBOARD_PORT=8005

# JWT / Security
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_MS=2592000000

# Super Admin
ALLOW_SUPER_ADMIN_CREATION=false

# SMTP / Email
SMTP_HOST=
SMTP_PORT=587
SMTP_ENCRYPTION=TLS
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=
SMTP_FROM=

# White-Label CORS & Routing
ALLOWED_ORIGINS=
FRONTEND_DOMAIN_KEYWORDS=
DASHBOARD_DOMAIN_KEYWORDS=

# Frontend/Dashboard Build Env (Used during docker build of dashboard)
VITE_API_BASE_URL=

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EOF
    chmod 600 "$BACKEND_ENV"
    echo -e "${GREEN}✓ backend.env created${NC}"
    echo -e "  ${CYAN}→ Fill in: nano $BACKEND_ENV${NC}"
fi

# ── Step 3: Generate dashboard.env ───────────────────────────
DASHBOARD_ENV="$CONFIG_DIR/dashboard.env"

if [ -f "$DASHBOARD_ENV" ]; then
    echo -e "${YELLOW}[3/4] dashboard.env already exists. Skipping creation.${NC}"
    echo -e "      Edit manually: ${CYAN}nano $DASHBOARD_ENV${NC}"
else
    echo -e "${YELLOW}[3/4] Creating dashboard.env template...${NC}"
    cat > "$DASHBOARD_ENV" << 'EOF'
PORT=8005
VITE_PORT=8005

# Backend API URL (Client এর production backend domain)
VITE_API_BASE_URL=
EOF
    chmod 600 "$DASHBOARD_ENV"
    echo -e "${GREEN}✓ dashboard.env created${NC}"
    echo -e "  ${CYAN}→ Fill in: nano $DASHBOARD_ENV${NC}"
fi

# ── Step 4: Summary ──────────────────────────────────────────
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "  Config files are at: ${CYAN}$CONFIG_DIR${NC}"
echo -e "  Uploads will be at:  ${CYAN}$UPLOAD_DIR${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Fill backend config:   ${CYAN}nano $BACKEND_ENV${NC}"
echo -e "  2. Fill dashboard config: ${CYAN}nano $DASHBOARD_ENV${NC}"
echo -e "  3. Deploy:                ${CYAN}make deploy${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
