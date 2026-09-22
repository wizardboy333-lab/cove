# Cove API (MVP)

Adult social forum backend — **18+ only**, **US jurisdiction**, **open registration**. Not a FetLife clone.

Stack: FastAPI · SQLAlchemy · SQLite (Postgres-ready via `DATABASE_URL`) · JWT Bearer · uvicorn.

## Quick start

```bash
cd /workspace/cove/api
source .venv/bin/activate
pip install -r requirements.txt
rm -f cove.db   # wipe OK for MVP schema changes
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

- Health: `GET http://localhost:8001/health`
- Public config: `GET http://localhost:8001/api/config/public`
- Docs: `http://localhost:8001/docs`
- Invites: optional/unused by default (`REQUIRE_INVITE=false`); tables/routes retained

## Auth for Queenie (Next.js)

### Header

```
Authorization: Bearer <access_token>
```

### Signup `POST /api/auth/signup`

**Do not send `date_of_birth`.** Full DOB is never accepted or stored.

```json
{
  "email": "user@example.com",
  "password": "at-least-8-chars",
  "display_name": "River",
  "is_18_plus": true,
  "age_attestation": true,
  "birth_year": 1990,
  "accepted_tos": true
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `invite_code` | no | optional; redeemed if present + valid. Blank OK while `require_invite=false` |
| `is_18_plus` | yes | must be `true` |
| `age_attestation` | yes | must be `true` |
| `accepted_tos` | yes | must be `true` |
| `birth_year` | no | rejected if clearly under 18 |

Error `code` values: `AGE_GATE_REQUIRED`, `INVITE_REQUIRED`, `INVITE_INVALID`, `INVITE_EXPIRED`, `INVITE_EXHAUSTED`, `INVITE_REVOKED`, `EMAIL_TAKEN`.

Stored age fields: `is_18_plus`, `age_attested_at`, optional `birth_year`, nullable `age_verified_at` / `verification_vendor_id`.

### Login / me / logout

1. `POST /api/auth/login` → `{ access_token, token_type, user }`
2. `GET /api/auth/me`
3. `POST /api/auth/logout` — 204; **client discards token**

### Age vendor stub

`POST /api/auth/age-vendor/start` — stub while `age_vendor_enabled=false`.

### Invites

- Public: `GET /api/invites/validate/{code}`
- Admin: `POST /api/admin/invites`, `GET /api/admin/invites` (first user is admin)
- Invite rows: `use_count` / `max_uses` / optional `note`

CORS: `http://localhost:3000`, `http://127.0.0.1:3000`.

## Content policy

See [CONTENT_POLICY.md](./CONTENT_POLICY.md).

## Full route index

See [OPENAPI_PATHS.md](./OPENAPI_PATHS.md).
