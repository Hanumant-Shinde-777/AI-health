# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# AI Health Assistant — frontend (Vite + React)
#
# Targets:
#   dev   → Vite dev server with hot reload, used by docker-compose.dev.yml
#   prod  → (default) static build served by nginx, /api proxied to the backend
# ---------------------------------------------------------------------------

ARG NODE_VERSION=20

# ---- deps ---------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- dev: Vite dev server (source is bind-mounted at runtime) -----------
FROM deps AS dev
# Polling is required: file events from Windows/macOS bind mounts don't reach the container
ENV CHOKIDAR_USEPOLLING=true
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ---- build: type-check and produce dist/ --------------------------------
FROM deps AS build
# VITE_* values are baked into the bundle at build time.
# "/api" = same origin; nginx proxies it to the backend container.
ARG VITE_API_URL=/api
ARG VITE_DEMO_MODE=false
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_DEMO_MODE=${VITE_DEMO_MODE}
COPY . .
RUN npm run build

# ---- prod: nginx --------------------------------------------------------
FROM nginx:alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz > /dev/null || exit 1
