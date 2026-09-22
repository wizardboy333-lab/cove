# Cove

**Cove** is an adult social forum MVP (FetLife-inspired *shape*, original branding). Soft dark “ink / mist” aesthetic. Built for consenting adults only.

## Product brief

A private social space where adults can:

- Create an account behind a hard **18+ age gate**
- Maintain a **profile**
- Publish **text posts** and browse a **feed**
- Join and participate in **groups**

V1 is intentionally small: auth, age gate, profiles, text posts/feed, groups. No media-heavy features until those basics work.

### Strict policy

- **18+ only.** Age confirmation is required before using the product.
- **No illegal content.** Illegal sexual content (including anything involving minors), non-consensual material, and other illegal activity are banned. This is a consenting-adults product — not a free-for-all.

Do not copy FetLife branding, copy, or assets. Cove is original.

## Registration

**Open signup** for adults 18+. Hard age gate + attestation; optional `birth_year` only — **no full DOB**. Invite codes are unused by default (`require_invite=false`); see deprecated [`docs/INVITE_FLOW.md`](./docs/INVITE_FLOW.md).

## MVP scope (V1)


| Area | Status intent |
|------|----------------|
| Auth (signup / login / JWT) | In progress (`api`) |
| 18+ interstitial / gate | Stub in `web` |
| Profiles | Stub UI + API routes |
| Text posts + feed | Stub UI + API routes |
| Groups | Stub UI + API routes |

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI (Python), SQLAlchemy, SQLite local / Postgres-ready |
| Infra | Docker Compose stub (optional); deploy owned later by Grok Bot |

## Ownership

| Path | Owner | Notes |
|------|-------|--------|
| `api/` | **Diva** | Backend. Do not overwrite her work. |
| `web/` | **Queenie** | Frontend UI. |
| Root README, `.gitignore`, compose, later deploy | **Grok Bot** | Skeleton + infra. |

## Repo layout

```
cove/
  api/          # FastAPI (Diva)
  web/          # Next.js (Queenie)
  docs/         # Product contracts (V1_DECISIONS, PRODUCT_ARCHITECTURE, …)
  README.md
  .gitignore
  docker-compose.yml   # optional local stack stub
```

## Run locally

### API (port 8000)

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # optional
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: http://localhost:8000/health
- OpenAPI docs: http://localhost:8000/docs

### Web (port 3000)

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000 — expect the 18+ gate, then the dark landing and placeholder routes:

`/`, `/login`, `/signup`, `/feed`, `/u/[username]`, `/groups`, `/groups/[id]`

Point the web app at the API (Queenie will wire `NEXT_PUBLIC_API_URL` or similar; default API is `http://localhost:8000`).

### Optional Compose

```bash
docker compose up   # see docker-compose.yml — postgres + api + web stubs
```

## Notes for teammates

- **Diva:** own everything under `api/`. Root files are safe for Grok Bot to maintain.
- **Queenie:** own `web/` UI; AgeGate stub lives in `web/components/AgeGate.tsx`.
- **Grok Bot:** skeleton, README, later deploy — do not push to GitHub until asked.
