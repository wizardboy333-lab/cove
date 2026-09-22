# Cove v1 — Locked decisions (2026-09-22)

One line: **US-English, vendor age-gate without storing full DOB, city/virtual events, photos + text, working name Cove, Next.js + Postgres, open registration (18+).**

| # | Decision |
|---|----------|
| 1 | **Launch:** United States / English first. Legal home = US (age-gate, ToS, processors, abuse reporting). Accept members elsewhere; add CA/UK/AU only after verification + takedown flows work. |
| 2 | **Age data:** Do **not** store full DOB. Store `age_verified_at`, `verification_vendor_id`, optional `birth_year` (for “40s” display), `is_18_plus`. Vendor holds ID + full DOB. |
| 3 | **Events v1:** Metro / city / virtual only. **No street addresses.** Optional later: venue reveal to Going after delay. |
| 4 | **Media v1:** Photos + writings only. No native video/live. Link-out specialist host in v2 if needed. |
| 5 | **Name:** Working title **Cove** (internal). Public brand/domain TBD — unique two-syllable + unused .com/.social; don’t bet on cove.com. |
| 6 | **Stack:** **Next.js + Postgres** (+ object storage + Redis). No hard Rails preference. FastAPI split OK only if teammate ownership needs it; prefer one Next app + Drizzle/Prisma for speed unless already split. |
| 7 | **Access:** **Open registration.** Anyone 18+ may sign up with email/password + age attestation. ~~Invite-only 90-day beta~~ **struck** — invite tables/routes may remain unused/optional for future campaigns; `require_invite=false` by default. |

## MVP feature cut (confirmed)

In: auth, vendor-ready 18+ gate (attestation + hooks), profiles + kinks, groups/forum, writings, feed, friends/follows/block/mute, 1:1 DMs, photos, thin metro/virtual events, limited search, reports/admin. Invite codes optional/unused.

Out: video, multi-persona, maps/street venue, billing, native apps, ML recs, group chat, guest browsing, demographic people search, global localization.
