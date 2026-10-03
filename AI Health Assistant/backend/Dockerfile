# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# AI Health Assistant — backend (Express + Prisma)
#
# Targets:
#   dev   → nodemon hot reload, used by docker-compose.dev.yml
#   prod  → (default) slim production image, runs as the non-root `node` user
# ---------------------------------------------------------------------------

ARG NODE_VERSION=20

# ---- base: OS packages Prisma's query engine needs on Alpine --------------
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# ---- deps: all dependencies (incl. prisma CLI) + generated Prisma client --
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate

# ---- dev: hot reload with nodemon (source is bind-mounted at runtime) -----
FROM deps AS dev
ENV NODE_ENV=development
# Polling (-L) is required: file events from Windows/macOS bind mounts don't reach the container
RUN npm install -g nodemon@3 --no-audit --no-fund
EXPOSE 5000
CMD ["nodemon", "-L", "--watch", ".", "--ext", "js,json,prisma", "server.js"]

# ---- prod: production dependencies only ---------------------------------
FROM base AS prod
ENV NODE_ENV=production \
    PORT=5000

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Generated Prisma client (lives outside the @prisma/client package)
COPY --from=deps --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node . .

# Writable log directory (mounted as a volume by docker-compose)
RUN mkdir -p /app/logs && chown -R node:node /app/logs

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" > /dev/null || exit 1

CMD ["node", "server.js"]
