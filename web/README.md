# Cove Web

Next.js (App Router) + TypeScript + Tailwind frontend. Dark original Cove aesthetic (`cove-*` tokens).

## Locked V1 UI notes

- Age gate: `is_18_plus` attestation + optional `birth_year` (no full DOB). Persisted in localStorage.
- Signup: open registration — email/password/displayName + 18+ attestation (no invite).
- Mock API client in `lib/api.ts` — prefer `NEXT_PUBLIC_API_URL` for future live backend.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Landing (post-gate) |
| `/gate` | 18+ attestation + guidelines |
| `/login`, `/signup` | Auth (open signup, 18+) |
| `/home` | Chronological feed + compose (`/feed` redirects here) |
| `/profile`, `/profile/edit` | Profile |
| `/groups`, `/groups/new`, `/groups/[id]` | Groups |
| `/writings`, `/writings/new`, `/writings/[id]` | Long-form writings |

## Run

```bash
cd web
npm install
npm run dev -- -p 3000 -H 127.0.0.1
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).
