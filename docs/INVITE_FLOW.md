# Cove — Invite flow (**DEPRECATED / optional unused**)

**Status:** ~~Invite-only beta (90 days)~~ **DEPRECATED as of 2026-09-22.**  
Product decision: **open registration** for anyone 18+. See [`V1_DECISIONS.md`](./V1_DECISIONS.md) (#7).

Invite tables, admin routes, and `invite_code` on signup remain in the codebase for a possible future campaign, but:

| Rule | Current |
|------|---------|
| Default | `require_invite=false` — blank/missing `invite_code` **must succeed** |
| Signup | Email + password + display name + `is_18_plus` / `age_attestation` (18+) |
| Optional redeem | If a non-blank `invite_code` is sent, the API may validate + redeem it; invalid codes still error |
| Cohort / waitlist | Not required for launch |
| Age | **No full DOB.** Signup sends `is_18_plus` attestation + optional `birth_year` |

## User journey (current)

```
Landing → /gate (18+ interstitial) → /signup
  1. Display name, email, password
  2. Optional birth year (decade display — not full DOB)
  3. Check “I confirm I am 18 or older”
  4. Submit → POST /api/auth/signup { …, is_18_plus, age_attestation }  # no invite required
  5. On success: JWT + user → /home
```

## Optional future use

If product re-enables invites (`REQUIRE_INVITE=true`):

- Admin: `POST|GET /api/admin/invites`
- Public: `GET /api/invites/validate/{code}`
- Signup requires a redeemable code; error codes `INVITE_REQUIRED` / `INVITE_INVALID` / `INVITE_EXPIRED` / `INVITE_EXHAUSTED` / `INVITE_REVOKED`
- Seed script: `api/scripts/seed_invites.py` (or `scripts/seed_invites.py`)

Until then, treat this doc as historical contract for unused invite plumbing.

## Related

- Locked decisions: [`V1_DECISIONS.md`](./V1_DECISIONS.md) (#7 open registration)
- Architecture: [`PRODUCT_ARCHITECTURE.md`](./PRODUCT_ARCHITECTURE.md)
- Web signup: `web/app/signup/page.tsx` + `web/lib/api.ts`
