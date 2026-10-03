# AI Health Assistant

A mobile-first health triage app. Patients describe symptoms by voice or text, answer AI-generated follow-up questions, and get a risk level and a recommended specialist; doctors review cases and issue prescriptions.

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Redux Toolkit, i18next (English, Hindi, Marathi)
- **Backend:** Node.js, Express, Prisma, PostgreSQL (Supabase)
- **AI pipeline:** emergency keyword detection → local symptom dataset → Groq (Llama 3) for follow-up questions and final analysis

The code lives in [`AI Health Assistant/`](AI%20Health%20Assistant/):

```
AI Health Assistant/
├── backend/     Express API (port 5000)
├── frontend/    React app (port 5173)
├── API_DOCS.md
└── postman_collection.json
```

Docker files live in the repo root: `docker-compose.yml`, `docker-compose.dev.yml`, `.env.example`, `Makefile`, plus a `Dockerfile` and `.dockerignore` in `backend/` and `frontend/` (and `frontend/nginx.conf`).

---

## Run with Docker

You need **Docker Desktop** (or Docker Engine with Compose v2), a **Supabase** project and a **Groq API key**. Node.js is not required on the host.

### 1. Configure

```bash
cp .env.example .env     # or: make env
```

Edit `.env` in the repo root and set at least `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` and `GROQ_API_KEY`. Write values **without quotes**, and escape a literal `$` in a password as `$$` (Compose interpolates `$`). The full list is in [Docker environment variables](#docker-environment-variables).

### 2. Create the database tables (first run, and after schema changes)

```bash
make db-push
# without make:
docker compose -f docker-compose.dev.yml run --rm --no-deps backend npx prisma db push
```

### 3. Start

```bash
make build && make up
# without make:
docker compose build
docker compose up -d
docker compose ps        # backend and frontend should become "healthy"
```

Open **http://localhost**. nginx serves the React build and proxies `/api` to the backend, so the browser talks to a single origin. The API is also published directly at http://localhost:5000/api (`curl http://localhost:5000/api/health`).

| Service | Container port | Host port | Notes |
|---|---|---|---|
| `frontend` (nginx) | 80 | `FRONTEND_PORT` (80) | SPA + `/api` reverse proxy |
| `backend` (Express) | 5000 | `BACKEND_PORT` (5000) | Health check: `GET /api/health` |
| `redis` (optional) | 6379 | not published | Only with `docker compose --profile redis up -d` |

OTP codes: in production they are sent by SMS through Twilio — set the `TWILIO_*` variables in `.env`. To sign in on a local Docker setup without Twilio, set `DEV_LOG_OTP=true` in `.env`, run `docker compose up -d`, and read the code from `docker compose logs backend`.

### Development mode (hot reload)

```bash
make dev
# without make:
docker compose -f docker-compose.dev.yml up --build
```

- App: **http://localhost:5173** (Vite dev server) · API: **http://localhost:5001/api** (nodemon)
- `backend/` and `frontend/` are bind-mounted — saving a file reloads the API or hot-updates the page. File watching uses polling, so it works on Windows/macOS.
- `NODE_ENV=development` and `DEV_LOG_OTP=true` are forced, so OTP codes appear in the logs.
- After changing `package.json`, rebuild and reset the cached `node_modules` volumes: `docker compose -f docker-compose.dev.yml down -v && make dev`.
- The dev stack uses its own project name (`ai-health-dev`), so it can run alongside the production stack.

### Make targets

| Command | Runs |
|---|---|
| `make build` | `docker compose build` |
| `make up` | `docker compose up -d` |
| `make down` | `docker compose down` |
| `make logs` | `docker compose logs -f` |
| `make restart` | `docker compose restart` |
| `make ps` | `docker compose ps` |
| `make dev` | `docker compose -f docker-compose.dev.yml up --build` |
| `make dev-down` | Stop the dev stack |
| `make clean` | Remove all containers, networks **and volumes** (prod + dev) |
| `make shell-backend` / `make shell-frontend` | `sh` inside the running container |
| `make db-push` | `prisma db push` against `DATABASE_URL` / `DIRECT_URL` |
| `make env` | Create `.env` from `.env.example` |

`make` isn't installed on Windows by default — use the plain `docker compose` commands shown, or run `make` from Git Bash/WSL after installing it (e.g. `choco install make`).

### Docker environment variables

All variables go in the root `.env` (template: [`.env.example`](.env.example)). The backend variables are the same as in [Backend (`backend/.env`)](#backend-backendenv); these are Docker-specific or have different defaults:

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Forced to `production` in `docker-compose.yml`, `development` in `docker-compose.dev.yml` |
| `FRONTEND_URL` | `http://localhost` | Must include the URL users open the app at — browsers send `Origin` even on same-origin POSTs, and production CORS rejects unlisted origins |
| `TRUST_PROXY` | `1` | The API sits behind nginx |
| `DEV_LOG_OTP` | `false` | Print OTP codes to `docker compose logs backend` (local testing without Twilio) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` (or `TWILIO_MESSAGING_SERVICE_SID`) | — | **Required in production.** SMS delivery of OTP codes |
| `VITE_API_URL` | `/api` | **Build-time.** API base URL baked into the frontend bundle. Rebuild the frontend after changing it |
| `VITE_DEMO_MODE` | `false` | **Build-time.** Fall back to demo data when the API is unreachable |
| `REDIS_URL` | `redis://redis:6379` | Reserved for a shared rate-limit store; the backend currently rate-limits in memory |
| `FRONTEND_PORT` / `BACKEND_PORT` | `80` / `5000` | Host ports of the production stack |
| `DEV_FRONTEND_PORT` / `DEV_BACKEND_PORT` | `5173` / `5001` | Host ports of the dev stack |

---

## Run without Docker

**Prerequisites**

- **Node.js 20 LTS or newer** (with npm)
- A **Supabase** project (free tier is fine) for the PostgreSQL database
- A **Groq API key** for AI follow-up questions — free at [console.groq.com/keys](https://console.groq.com/keys)

## Quick start (without Docker)

### 1. Install dependencies

```bash
cd "AI Health Assistant/backend"
npm install

cd "../frontend"
npm install
```

### 2. Configure the backend

Create `AI Health Assistant/backend/.env`. You can start from `.env.example`, but **every line in it is commented out** — remove the leading `#` from the lines you use. At minimum, set:

```env
PORT=5000
NODE_ENV=development

# Supabase → Project Settings → Database → Connection string
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres?sslmode=require"

JWT_SECRET=<a long random string>
GROQ_API_KEY=<your Groq key>

# Prints OTP codes in the backend terminal (for local use without an SMS provider)
DEV_LOG_OTP=true
```

- `DATABASE_URL` uses the **pooler** (port `6543`); `DIRECT_URL` uses the **direct** connection (port `5432`).
- URL-encode special characters in the database password: `#` → `%23`, `@` → `%40`.
- Generate a JWT secret with: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
- `backend/.env` is gitignored — never commit it.

See [Environment variables](#environment-variables) for the full list.

### 3. Create the database tables

```bash
cd "AI Health Assistant/backend"
npm run db:push
```

This creates the tables in Supabase from `prisma/schema.prisma` and generates the Prisma client. Run it again whenever the schema changes.

### 4. Configure the frontend

`AI Health Assistant/frontend/.env` is already in the repo:

```env
VITE_API_URL=http://localhost:5000/api
```

Change it only if the API runs somewhere else.

### 5. Run

Use two terminals:

```bash
# Terminal 1 — API on http://localhost:5000/api
cd "AI Health Assistant/backend"
npm run dev

# Terminal 2 — app on http://localhost:5173
cd "AI Health Assistant/frontend"
npm run dev
```

Open **http://localhost:5173**. Check the API with `curl http://localhost:5000/api/health` → `{"success":true,...}`.

### 6. Sign in locally

Without an SMS provider configured, OTP codes are **printed in the backend terminal** (as `[OTP] SMS → <phone>: 123456`) while `DEV_LOG_OTP=true`. Register a patient or doctor in the app, then enter the code from the backend terminal.

---

## Scripts

**Backend** (`AI Health Assistant/backend`)

| Command | What it does |
|---|---|
| `npm run dev` | Start the API and restart on code changes |
| `npm start` | Start the API (production) |
| `npm run db:push` | Sync the Prisma schema to the database and generate the client |
| `npm run db:generate` | Regenerate the Prisma client only |
| `npm run db:migrate` | Create and apply a migration (development) |
| `npm run db:studio` | Open Prisma Studio to browse data |

**Frontend** (`AI Health Assistant/frontend`)

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | Supabase pooler connection string (port 6543) |
| `DIRECT_URL` | **Yes** | — | Supabase direct connection string (port 5432), used by Prisma schema commands |
| `JWT_SECRET` | **Yes in production** | insecure dev value | Signs login tokens. The server warns at startup if unset in production |
| `GROQ_API_KEY` | For AI questions | — | Without it, symptom analysis still works from the local dataset, but AI follow-up questions fail |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model, with automatic fallback to `llama-3.1-8b-instant` |
| `PORT` | No | `5000` | API port |
| `NODE_ENV` | No | `development` | Set to `production` when deployed |
| `FRONTEND_URL` | **Yes in production** | `http://localhost:5173,http://localhost:5174` | Browser origins allowed to call the API (comma-separated, e.g. `https://app.example.com`). In development any `localhost` / `127.0.0.1` port is also allowed |
| `JWT_EXPIRES_IN` | No | `7d` | Login token lifetime |
| `OTP_TTL_MINUTES` | No | `10` | OTP validity |
| `DEV_LOG_OTP` | No | `true` in development, `false` in production | Print OTP codes to the server log |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | **Yes in production** | — | Twilio credentials for sending OTP codes by SMS. Without them, production sign-in fails with 503 |
| `TWILIO_PHONE_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID` | **Yes in production** | — | SMS sender: a Twilio number or a Messaging Service |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | For uploads | — | Profile picture uploads |
| `MAX_OTP_ATTEMPTS` / `OTP_LOCK_MINUTES` | No | `5` / `15` | Lock login after repeated wrong OTPs |
| `MAX_PASSWORD_ATTEMPTS` / `PASSWORD_LOCK_MINUTES` | No | `5` / `15` | Lock login after repeated wrong passwords |
| `RATE_LIMIT_AUTH_MAX` / `RATE_LIMIT_AUTH_WINDOW_MINUTES` | No | `30` / `15` | Per-IP limit on `/api/auth` |
| `RATE_LIMIT_AI_MAX` / `RATE_LIMIT_AI_WINDOW_MINUTES` | No | `40` / `1` | Per-IP limit on `/api/ai` |
| `TRUST_PROXY` | Behind a proxy | — | Set to `1` behind Render, Nginx, etc. so rate limits see the real client IP |

### Frontend (`frontend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Base URL of the backend API |

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Backend exits with `Database is not configured` | `DATABASE_URL` is missing from `backend/.env` |
| Backend exits with `DATABASE_URL still has placeholder values` | The `[PROJECT-REF]` / `[REGION]` placeholders are still in the URL — paste the real Supabase connection strings |
| `@prisma/client did not initialize yet` | Run `npm run db:push` (or `npm run db:generate`) in `backend/` |
| "Symptom analysis failed" right after submitting symptoms; API says `requires GROQ_API_KEY` | Set `GROQ_API_KEY` in `backend/.env` and restart the backend |
| Changes to `backend/.env` have no effect | `npm run dev` restarts on code changes but not on `.env` changes — stop it and start it again |
| `EADDRINUSE` on port 5000 or 5173 | Another copy is still running — stop it, or change `PORT` / pass `--port` to Vite |
| Requests blocked by CORS (API returns 403 "CORS blocked origin") | Add the exact frontend origin (scheme + host + port) to `FRONTEND_URL` and restart the backend. In development, `localhost` and `127.0.0.1` on any port are always allowed |
| HTTP 429 "Too many requests" | Per-IP rate limit hit — wait for the window to reset, or raise the `RATE_LIMIT_*` values for local testing |
| Login locked after wrong codes | 5 wrong OTPs or passwords lock the account for 15 minutes (see `MAX_*_ATTEMPTS`) |

## Production notes

- Set `NODE_ENV=production`, a strong unique `JWT_SECRET`, and `FRONTEND_URL` to your deployed frontend's origin (e.g. `https://app.example.com`). In production only the origins listed there can call the API from a browser — the startup log prints the effective CORS policy.
- Set the `TWILIO_*` variables so OTP codes are delivered by SMS, and leave `DEV_LOG_OTP` unset (it defaults to off in production).
- Set `TRUST_PROXY=1` behind a reverse proxy. Rate limits are kept in memory per server instance — use a shared store such as Redis if you run more than one.
- Build the frontend with `VITE_API_URL` pointing at the deployed API, then serve `frontend/dist/` as a single-page app (all unknown paths → `index.html`).

### Deploying with Docker

- On the server: clone the repo, create `.env` from `.env.example`, then `docker compose up -d --build`. Containers restart automatically (`unless-stopped`), including after a reboot once Docker starts.
- Set `FRONTEND_URL` to the public origin (e.g. `https://health.example.com`) — otherwise every POST from the browser is rejected by CORS.
- Terminate HTTPS in front of the stack (a host-level nginx/Caddy/Traefik, or a cloud load balancer) and forward to the `frontend` container's port. If that adds a second proxy hop, set `TRUST_PROXY=2`.
- Once nginx proxies all API traffic, you can stop publishing the backend port: remove `ports` from the `backend` service (it stays reachable to nginx on `app-network`).
- `VITE_*` values are compiled into the frontend image: rebuild (`docker compose build frontend`) after changing them.
- The backend runs as the non-root `node` user; both containers have health checks (`docker compose ps` shows `healthy`). Logs go to stdout — view them with `docker compose logs`, and configure Docker's log rotation (`max-size`) on long-running hosts.
- To update: `git pull && docker compose up -d --build`, and `make db-push` if `prisma/schema.prisma` changed.
- Redis is only provisioned (`--profile redis`); running several backend replicas still needs the rate limiter moved to a shared store.

## API reference

- [`backend/README.md`](AI%20Health%20Assistant/backend/README.md) — route overview
- [`API_DOCS.md`](AI%20Health%20Assistant/API_DOCS.md) — detailed API documentation
- [`postman_collection.json`](AI%20Health%20Assistant/postman_collection.json) — importable Postman collection
