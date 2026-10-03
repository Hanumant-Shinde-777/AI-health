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

---

## Prerequisites

- **Node.js 20 LTS or newer** (with npm)
- A **Supabase** project (free tier is fine) for the PostgreSQL database
- A **Groq API key** for AI follow-up questions — free at [console.groq.com/keys](https://console.groq.com/keys)

## Quick start

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

# Prints OTP codes in the backend terminal (SMS delivery is mocked)
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

SMS sending is mocked, so OTP codes are **printed in the backend terminal** (as `[OTP] SMS → <phone>: 123456`) while `DEV_LOG_OTP=true`. Register a patient or doctor in the app, then enter the code from the backend terminal.

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
- Leave `DEV_LOG_OTP` unset (it defaults to off in production) and wire up real SMS delivery in `backend/utils/sendOTP.js`.
- Set `TRUST_PROXY=1` behind a reverse proxy. Rate limits are kept in memory per server instance — use a shared store such as Redis if you run more than one.
- Build the frontend with `VITE_API_URL` pointing at the deployed API, then serve `frontend/dist/` as a single-page app (all unknown paths → `index.html`).

## API reference

- [`backend/README.md`](AI%20Health%20Assistant/backend/README.md) — route overview
- [`API_DOCS.md`](AI%20Health%20Assistant/API_DOCS.md) — detailed API documentation
- [`postman_collection.json`](AI%20Health%20Assistant/postman_collection.json) — importable Postman collection
