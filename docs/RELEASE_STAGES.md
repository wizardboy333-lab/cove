# Cove — Release stages

Numbered map of the 90-day build plan in [`PRODUCT_ARCHITECTURE.md`](./PRODUCT_ARCHITECTURE.md) §F. Locked product rules live in [`V1_DECISIONS.md`](./V1_DECISIONS.md).

| Stage | Window | Theme | Status (2026-09-22) |
|-------|--------|-------|---------------------|
| **1** | Days 1–7 | Foundations — auth, 18+ gate, profile basics, deploy | Done (open reg + Render) |
| **2** | Days 8–14 | Graph & privacy — friends, follow, block/mute | Done (API) |
| **3** | Days 15–21 | Kinks — taxonomy seed + profile kinks UI | Not started |
| **4** | Days 22–35 | Groups forum — CRUD, topics, posts, mods | Done (thin) |
| **5** | Days 36–45 | Writings + home feed | Done (thin) |
| **6** | Days 46–55 | Media — presigned photos, blur-until-tap | Not started (placeholders only) |
| **7** | Days 56–65 | **Events thin slice** — metro/virtual create + RSVP | Done (thin) |
| **8** | Days 66–75 | DMs + safety queue | Partial (reports API; no DMs) |
| **9** | Days 76–90 | Search, polish, soft-launch ops | Partial (open reg live) |

Out of scope until later: street venues, maps, video, billing, native apps, group chat, guest browsing, demographic people search.

---

## Stage 7 — Build prompt (copy for agents)

```
# Cove Stage 7 — Events thin slice

You are shipping Stage 7 of Cove (working title). Repo: /workspace/cove (monorepo: FastAPI api/ + Next.js web/). Public: https://cove-web-pwur.onrender.com + https://cove-api-7hwg.onrender.com. GitHub: wizardboy333-lab/cove. CRT retro theme (green #33ff66, magenta accents, VT323). Follow V1_DECISIONS.md.

## Goal
Members can create metro or virtual events, RSVP going/interested/declined, see upcoming events, and view attendee lists according to host privacy. No street addresses. No maps. No private_venue / venue reveal yet (decide: place_mode is only metro | virtual).

## Locked constraints
- place_mode: metro | virtual only (reject private_venue in API with 400).
- Public event fields: title, description, starts_at, ends_at (optional), timezone, place_mode, metro_area (required if metro), capacity (optional).
- Private fields: virtual_url only visible to host + RSVP status=going.
- attendee_list_visibility: public | going_only | host_only (default going_only).
- Never store street address or lat/long.
- Auth required for all event routes (same as groups).
- Enforce blocks: blocked host/viewer cannot see each other's events in lists/detail (404 or omit).
- Style match existing groups/writings pages (AppShell, Card, Button, cove-* tokens).

## API (FastAPI, mirror groups.py style)
Models (SQLAlchemy in models.py; create_all is fine for MVP):
- Event: id, host_id, title, description, starts_at, ends_at nullable, timezone (str, default America/New_York), place_mode enum, metro_area nullable, virtual_url nullable, attendee_list_visibility enum, capacity nullable int, cancelled bool default false, created_at
- Rsvp: id, event_id, user_id, status enum going|interested|declined, show_on_list bool default true, unique(event_id,user_id), created_at

Schemas: EventCreate, EventUpdate (host only), EventOut (omit virtual_url unless entitled), RsvpUpsert {status, show_on_list?}, RsvpOut, AttendeeOut {user_id, display_name, status} (filtered by visibility).

Routes:
- POST   /api/events                 create (host = current user; auto RSVP going)
- GET    /api/events                 list upcoming non-cancelled (optional ?metro= filter); exclude blocked
- GET    /api/events/{id}            detail (+ my_rsvp if any; virtual_url if entitled)
- PATCH  /api/events/{id}            host only
- POST   /api/events/{id}/cancel     host only (soft cancel)
- PUT    /api/events/{id}/rsvp       upsert RSVP
- DELETE /api/events/{id}/rsvp       clear RSVP
- GET    /api/events/{id}/attendees  filtered list

Wire router in main.py. Document paths in api/OPENAPI_PATHS.md.

## Web (Next.js App Router, client pages like groups)
- types: Event, RsvpStatus
- api.ts: map + list/create/get/update/cancel/rsvp/attendees helpers
- Nav: add Events link
- /events           list upcoming + link New event
- /events/new       form: title, description, starts_at (datetime-local), ends_at optional, timezone select (common US), place_mode metro|virtual, metro_area if metro, capacity optional, attendee_list_visibility
- /events/[id]      detail, RSVP buttons, attendee list (or locked message), host Cancel, show virtual link only when going/host
- EventCard component (title, when, metro/virtual chip, going count if known)

## UX copy
- Remind hosts: city/metro or virtual only — never put a street address in the description.
- Cancelled events show a clear CANCELLED chip and block new RSVPs.

## Done when
1. Local API smoke: create metro event, create virtual event, RSVP as second user, attendees respect going_only, virtual_url hidden until going.
2. Web pages work against live API (NEXT_PUBLIC_API_URL).
3. Docs: RELEASE_STAGES Stage 7 status → Done; OPENAPI_PATHS updated.
4. Commit + push main so Render redeploys api + web.

## Out of scope (do not build)
Street venue, maps, event chat, host mass-message, photo attachments on events, search, calendar sync.
```

---

## Stage 7 acceptance checklist

- [x] `events` + `rsvps` tables
- [x] CRUD + RSVP + attendees API
- [x] `/events`, `/events/new`, `/events/[id]` UI + nav
- [x] virtual URL privacy
- [x] no street addresses in schema
- [x] pushed to `main` / Render

---

## Stage 3 — Build prompt (Kinks)

```
Ship Stage 3: kink taxonomy seed + user_kinks on profiles.
- Models: KinkTag (id, slug, name, parent_id nullable, category), UserKink (user_id, kink_id, stance into|curious|limit, unique pair)
- Seed ~150 curated adult kink tags (English) via script or startup if empty
- API: GET /api/kinks, GET/PUT /api/profiles/me/kinks, include on GET /api/profiles/{id} if visibility allows (default public for MVP)
- Web: /kinks browse, profile section to add/remove with stance chips, CRT styling
- No people search by kink facets
```

---

## Stage 6 — Build prompt (Media)

```
Ship Stage 6 thin media: image upload only, NSFW default, blur-until-tap.
- Store files under api/uploads (or MEDIA_ROOT); serve via /api/media/{id}/file with auth
- Media model + optional writing_id / is_avatar
- POST multipart /api/media/upload; DELETE own
- Wire profile avatar upload + writing attachment; reuse PixelMediaPlaceholder pattern for blur
- Document Render ephemeral disk caveat in RENDER.md
```

---

## Stage 8 — Build prompt (DMs + safety)

```
Ship Stage 8: 1:1 DMs + admin report queue UI.
- DmConversation (two user ids sorted), DmMessage
- Routes under /api/dms/...; enforce blocks; optional new-account DM friction
- Web /inbox + /inbox/[id]
- /admin/reports for is_admin (list/open reports)
```

---

## Stage 9 — Build prompt (Search + polish)

```
Ship Stage 9a/b thin: search + legal stubs + empty-state polish.
- GET /api/search?q=&types=
- /explore UI; /legal/tos /legal/privacy /legal/guidelines
- Update RELEASE_STAGES statuses to Done where shipped; push main
```

