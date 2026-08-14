.PHONY: deploy build build-backend build-dashboard build-bg build-dash logs logs-backend logs-dashboard status down help

# ── Dynamic Client Configuration Detection ────────────────────
# Accepts CLIENT from command line (e.g. make deploy CLIENT=engulfic)
# Or auto-detects from existing VPS directories (/opt/<client>)
CLIENT ?= $(shell if [ -f .client ]; then cat .client; \
	elif [ -d /opt/engulfic ]; then echo engulfic; \
	elif [ -d /opt/decantre ]; then echo decantre; \
	elif [ -d /opt/toyoland ]; then echo toyoland; \
	elif [ -f .env ]; then echo local; \
	else echo engulfic; fi)

# Resolve the config env file path
ENV_FILE ?= $(shell if [ -f /opt/$(CLIENT)/configs/backend.env ]; then echo /opt/$(CLIENT)/configs/backend.env; \
	elif [ -f /opt/$(CLIENT)/configs/.env ]; then echo /opt/$(CLIENT)/configs/.env; \
	elif [ -f .env ]; then echo .env; \
	else echo /opt/$(CLIENT)/configs/backend.env; fi)

COMPOSE = docker compose --env-file $(ENV_FILE) -f docker-compose.prod.yml

# ── Targets ───────────────────────────────────────────────────

help:
	@echo "White-Label Multi-Tenant Deployment Automation"
	@echo "Active Client: $(CLIENT)"
	@echo "Env File:      $(ENV_FILE)"
	@echo ""
	@echo "Available commands:"
	@echo "  make deploy             Pull latest & rebuild both backend + dashboard"
	@echo "  make build-backend      Pull latest & rebuild backend container"
	@echo "  make build-dashboard    Pull latest & rebuild dashboard container"
	@echo "  make status             Show running container status"
	@echo "  make logs               View all container logs"
	@echo "  make logs-backend       View backend container logs"
	@echo "  make logs-dashboard     View dashboard container logs"
	@echo "  make down               Stop all client containers"
	@echo ""
	@echo "Override client manually:"
	@echo "  make deploy CLIENT=engulfic"
	@echo "  make deploy CLIENT=decantre"

deploy:
	@echo "🚀 Deploying for client [$(CLIENT)] using config [$(ENV_FILE)]..."
	git pull origin Live
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d
	@echo "✓ Deployment complete for [$(CLIENT)]!"

build: deploy

build-backend:
	@echo "🚀 Rebuilding Backend for client [$(CLIENT)]..."
	git pull origin Live
	$(COMPOSE) build --no-cache backend
	$(COMPOSE) up -d backend
	@echo "✓ Backend rebuild complete!"

build-bg: build-backend

build-dashboard:
	@echo "🚀 Rebuilding Dashboard for client [$(CLIENT)]..."
	git pull origin Live
	$(COMPOSE) build --no-cache dashboard
	$(COMPOSE) up -d dashboard
	@echo "✓ Dashboard rebuild complete!"

build-dash: build-dashboard

status:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

logs-backend:
	$(COMPOSE) logs -f backend

logs-bg: logs-backend

logs-dashboard:
	$(COMPOSE) logs -f dashboard

logs-dash: logs-dashboard

down:
	$(COMPOSE) down