# Deploy Cove on Render (free tier)

Blueprint: [`render.yaml`](../render.yaml) — Postgres + `cove-api` + `cove-web`.

## Prerequisites

1. Push this repo to GitHub (Grok Bot handles auth/push).
2. Render account with room for **one free Postgres** (workspace limit: one free DB).

## Deploy

1. Render Dashboard → **New** → **Blueprint**.
2. Connect the Cove GitHub repo; confirm `render.yaml`.
3. Apply. Wait for `cove-db`, then `cove-api`, then `cove-web`.

## URLs

| Service   | Expected URL (may get a random suffix)   |
|-----------|------------------------------------------|
| API       | `https://cove-api-7hwg.onrender.com`          |
| Web       | `https://cove-web.onrender.com`          |

### Fix `NEXT_PUBLIC_API_URL` if the API hostname is not exact

`NEXT_PUBLIC_*` is baked into the Next.js client at **Docker build** time.

1. Open the live `cove-api` URL from the dashboard (copy host).
2. On **cove-web** → Environment → set:
   `NEXT_PUBLIC_API_URL=https://<actual-cove-api-host>`
3. **Manual Deploy** → **Clear build cache & deploy** (required so the ARG rebuilds).

Blueprint `fromService` `host` alone is hostname-only (no `https://`) and is awkward for build-args; hardcoding then correcting in the dashboard is the MVP path.

## Env (API)

| Variable        | Source                                      |
|-----------------|---------------------------------------------|
| `DATABASE_URL`  | From `cove-db` connection string            |
| `SECRET_KEY`    | Auto-generated                              |
| `CORS_ORIGINS`  | `*` (browser → public API)                  |
| `REQUIRE_INVITE`| `false` (open registration)                 |

SQLite is **not** used on Render free web (ephemeral disk). Prefer free Postgres.

## Local Docker smoke (optional)

```bash
# API
docker build -t cove-api ./api
docker run --rm -p 8000:8000 -e SECRET_KEY=dev -e CORS_ORIGINS=* cove-api

# Web (point at a reachable API)
docker build -t cove-web --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 ./web
docker run --rm -p 3000:3000 cove-web
```

## Free-tier caveats

- Web services sleep after ~15 minutes idle → cold starts.
- Free Postgres expires after **30 days** (14-day grace to upgrade).
- No persistent disk on free web; do not rely on SQLite files in the container.

## Health

- API: `GET /health` → `{"status":"ok","service":"cove-api"}`
