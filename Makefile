# AI Health Assistant — Docker shortcuts. Run `make help` for the list.

COMPOSE     := docker compose
COMPOSE_DEV := docker compose -f docker-compose.dev.yml

.DEFAULT_GOAL := help
.PHONY: help env build up down logs restart ps dev dev-down clean shell-backend shell-frontend db-push

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

env: ## Create .env from .env.example (if missing)
	@test -f .env || (cp .env.example .env && echo "Created .env — fill in DATABASE_URL, DIRECT_URL, JWT_SECRET, GROQ_API_KEY")

build: ## Build production images
	$(COMPOSE) build

up: ## Start production stack in the background
	$(COMPOSE) up -d

down: ## Stop production stack
	$(COMPOSE) down

logs: ## Follow logs of all services
	$(COMPOSE) logs -f

restart: ## Restart all services
	$(COMPOSE) restart

ps: ## Show service status
	$(COMPOSE) ps

dev: ## Start dev stack with hot reload (frontend :5173, API :5001)
	$(COMPOSE_DEV) up --build

dev-down: ## Stop dev stack
	$(COMPOSE_DEV) down

clean: ## Remove all containers, networks and volumes (prod + dev)
	$(COMPOSE) --profile redis down -v --remove-orphans
	$(COMPOSE_DEV) down -v --remove-orphans

shell-backend: ## Open a shell in the backend container
	$(COMPOSE) exec backend sh

shell-frontend: ## Open a shell in the frontend container
	$(COMPOSE) exec frontend sh

db-push: ## Sync Prisma schema to the database (uses the dev image, which has the prisma CLI)
	$(COMPOSE_DEV) run --rm --no-deps backend npx prisma db push
