# Deployment

How Supracarer is built and deployed. Monorepo: **`api/`** (NestJS + Prisma) and
**`mobile/`** (Expo/React Native). Database is **Neon Postgres**.

## Branch model
- `main` — production (protected; deploys to prod).
- `dev` — integration/staging (deploys to the Railway staging service).
- `feature/*`, `fix/*` — branch off `dev`, PR back into `dev`.

Promote to prod with a PR from `dev` → `main`.

---

## Backend — Railway (Docker)

The API deploys to **Railway** using [`api/Dockerfile`](api/Dockerfile). Railway
builds from GitHub on push.

### Service settings that MUST be right
Railway's auto-detection fights this monorepo. In the service **Settings**:

| Setting | Value | Why |
|---|---|---|
| **Root Directory** | `api` | So Railway builds inside `api/` and finds our Dockerfile. Without it, Railway runs the root **npm workspace** build. |
| **Builder** | `Dockerfile` | Forces the Dockerfile (also pinned in [`api/railway.json`](api/railway.json)). |
| **Dockerfile Path** | `Dockerfile` | Relative to the root directory (`api`). |
| **Custom Build Command** | **empty** | A stale `npm run build --workspace=@supramobile/api` here **overrides the Dockerfile** and skips `prisma generate` → hundreds of phantom TS errors. Must be blank. |
| **Custom Start Command** | **empty** | Use the Dockerfile `CMD` (migrate + start). |

### Gotchas we already hit (don't relearn these)
1. **Nixpacks skips `prisma generate`.** If the build shows `npm run build --workspace=...`, Railway is NOT using the Dockerfile → you'll get 300+ `Module '@prisma/client' has no exported member` / `Property 'x' does not exist on PrismaService` errors. Fix: the settings above (esp. Root Directory + empty Custom Build Command).
2. **Workspace lockfile drift.** The real lockfile is the repo-root `package-lock.json`, so `api/package-lock.json` is stale and `npm ci` fails ("can only install when package.json and package-lock.json are in sync"). The Dockerfile uses **`npm install`** (not `npm ci`) — the Docker context is api-only, so it resolves cleanly.
3. **Migrations use `DIRECT_URL`.** `prisma.config.ts` points migrations at `DIRECT_URL` (Neon's non-pooled URL). Set BOTH `DATABASE_URL` (pooled, app runtime) and `DIRECT_URL` (direct, migrations).
4. **`PORT`** is provided by Railway — do **not** set it as a variable; `main.ts` reads `process.env.PORT`.

### Environment variables (Railway → Variables)
Copy values from `api/.env`. Required: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, `NODE_ENV=production`, Paystack (`PAYSTACK_*`), Cloudinary
(`CLOUDINARY_*`), mail (`RESEND_API_KEY`/SMTP), Twilio (`TWILIO_*`).
Set `API_URL` and `PAYSTACK_CALLBACK_URL` to the Railway public URL.

### Migrations
The container runs `npx prisma migrate deploy` on start (see the Dockerfile `CMD`).
Migrations are hand-written and committed under `api/prisma/migrations/`. Never run
`prisma migrate dev` against a shared database.

### Health checks
- `GET /api/v1/health` — liveness (no DB). Use as Railway's health-check path and for uptime pings.
- `GET /api/v1/health/ready` — pings Postgres; confirms Neon connectivity.

### First-time setup (recap)
1. New Web Service → connect repo → **Root Directory `api`**, Branch `dev`.
2. Builder = Dockerfile; clear any Custom Build/Start Command.
3. Add env vars (above).
4. Settings → Networking → **Generate Domain**.
5. Verify `/api/v1/health` and `/api/v1/health/ready`.

---

## Frontend — Expo / EAS

API base URL is in [`mobile/constants/config.ts`](mobile/constants/config.ts):
- `__DEV__` (Expo Go / dev build) → local IP (`DEV_API_URL`).
- Production/preview builds → the Railway URL (later: `https://api.supracarer.com`).

> To test the app against the deployed API from Expo Go, temporarily point
> `DEV_API_URL` at the Railway URL.

EAS build/submit config lives in `mobile/eas.json` (profiles: development / preview / production). OTA JS updates via `eas update`; native builds via `eas build`.

---

## CI
`.github/workflows/ci.yml` runs on PRs into `dev`/`main`: typecheck + lint for both
`api` (with `prisma generate` first) and `mobile`.

## TODO
- Point `api.supracarer.com` (we own it) at Railway; then swap the URL in `config.ts`.
- Second Railway service for `main` (production), separate Neon branch/db.
