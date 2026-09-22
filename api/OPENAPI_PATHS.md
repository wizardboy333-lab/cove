# Cove API — route index (V1)

**Base URL (local MVP):** `http://0.0.0.0:8001`  
**Access:** Open registration (`require_invite=false`). Invite admin routes remain optional.

**Auth header:** `Authorization: Bearer <access_token>`

## Seed invite codes

| Code | max_uses | note |
|------|----------|------|
| `COVE-BETA-001` | 10000 | seeded local beta code |
| `COVE-BETA` | 1000 | web mock alias |
| `WELCOME-90` | 1000 | web mock alias |

## Age / invite signup contract

- **No full DOB** — never send or store `date_of_birth`.
- Signup body: `email`, `password`, `display_name`, `is_18_plus=true`, `age_attestation=true`, optional `invite_code`, optional `birth_year`, `accepted_tos=true`. Invite not required (`require_invite=false`).
- Stored: `is_18_plus`, `age_attested_at`, optional `birth_year`, `age_verified_at` / `verification_vendor_id` (null until vendor), `accepted_tos_at`, `jurisdiction=US`.
- Invite redeem increments `use_count` and writes `invite_redemptions`.

### Signup error codes

| HTTP | code | when |
|------|------|------|
| 400 | `AGE_GATE_REQUIRED` | attestation / is_18_plus false, or birth_year implies &lt;18 |
| 400 | `INVITE_REQUIRED` | blank/missing invite only if `require_invite=true` (currently **false** — open reg) |
| 400 | `INVITE_INVALID` | code not found |
| 400 | `INVITE_EXPIRED` | expires_at in the past |
| 400 | `INVITE_EXHAUSTED` | use_count &gt;= max_uses |
| 400 | `INVITE_REVOKED` | revoked=true |
| 409 | `EMAIL_TAKEN` | email already registered |

---

## Routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/` | no | API blurb |
| GET | `/health` | no | Liveness |
| GET | `/api/search` | Bearer | `?q=` + `type=`/`types=` groups\|events\|writings\|kinks\|people (prefix name only) |
| GET | `/docs` | no | Swagger UI |
| GET | `/openapi.json` | no | OpenAPI schema |
| GET | `/api/config/public` | no | `{jurisdiction, tos_version, locale, require_invite=false, age_vendor_enabled}` |
| POST | `/api/auth/signup` | no | Open reg + age attestation; returns JWT + user (**no DOB**) |
| POST | `/api/auth/login` | no | JWT + user |
| POST | `/api/auth/logout` | Bearer | 204 stub; client discards token |
| GET | `/api/auth/me` | Bearer | Current user (includes `is_admin`) |
| POST | `/api/auth/age-vendor/start` | Bearer | Stub `{status, vendor, message}` |
| GET | `/api/invites/validate/{code}` | no | Public redeemability check |
| POST | `/api/invites` | Bearer | Beta: any authed may mint (prefer admin) |
| POST | `/api/admin/invites` | Bearer **admin** | Create invite (`InviteCreate` → `InviteOut`, optional `note`) |
| GET | `/api/admin/invites` | Bearer **admin** | List invites (`use_count` / `max_uses` / `note`) |
| POST | `/api/dms/conversations` | Bearer | `{user_id}` get-or-create 1:1; blocks + 24h friction |
| GET | `/api/dms/conversations` | Bearer | My threads |
| GET | `/api/dms/conversations/{id}/messages` | Bearer | Message history |
| POST | `/api/dms/conversations/{id}/messages` | Bearer | `{body}` |
| GET | `/api/admin/reports` | Bearer **admin** | Open report queue |
| POST | `/api/admin/reports/{id}/resolve` | Bearer **admin** | |
| POST | `/api/admin/reports/{id}/dismiss` | Bearer **admin** | |
| GET | `/api/profiles/{user_id}` | optional | Public / limited; blocks → 404 |
| PATCH | `/api/profiles/me` | Bearer | Update profile (+ optional birth_year) |
| POST | `/api/media/upload` | Bearer | multipart image; form `nsfw` `writing_id?` `is_avatar?` |
| GET | `/api/media/{media_id}` | Bearer | Metadata + url |
| GET | `/api/media/{media_id}/file` | Bearer | Binary file (auth required) |
| DELETE | `/api/media/{media_id}` | Bearer | Owner only |
| GET | `/api/media/writing/{writing_id}` | Bearer | Attachments for a writing |
| POST | `/api/friends/request` | Bearer | `{user_id}` |
| POST | `/api/friends/accept` | Bearer | `{user_id}` |
| POST | `/api/friends/decline` | Bearer | `{user_id}` |
| GET | `/api/friends` | Bearer | Pending + accepted + declined |
| POST | `/api/follows/{user_id}` | Bearer | |
| DELETE | `/api/follows/{user_id}` | Bearer | |
| POST | `/api/blocks/{user_id}` | Bearer | Drops follow edges |
| DELETE | `/api/blocks/{user_id}` | Bearer | |
| POST | `/api/mutes/{user_id}` | Bearer | |
| DELETE | `/api/mutes/{user_id}` | Bearer | |
| POST | `/api/posts` | Bearer | Feed/group/topic post |
| GET | `/api/posts/feed` | Bearer | Chronological; excludes blocked authors |
| GET | `/api/posts/{post_id}` | Bearer | |
| DELETE | `/api/posts/{post_id}` | Bearer | Author only |
| POST | `/api/groups` | Bearer | Create + auto-join owner; optional `group_type` |
| GET | `/api/groups` | Bearer | |
| GET | `/api/groups/{id_or_slug}` | Bearer | |
| POST | `/api/groups/{group_id}/join` | Bearer | |
| POST | `/api/groups/{group_id}/leave` | Bearer | |
| GET | `/api/groups/{group_id}/posts` | Bearer | Non-topic group posts |
| POST | `/api/groups/{group_id}/topics` | Bearer | `{title}` |
| GET | `/api/groups/{group_id}/topics` | Bearer | |
| GET | `/api/topics/{topic_id}` | Bearer | |
| POST | `/api/topics/{topic_id}/posts` | Bearer | `{body}` |
| GET | `/api/topics/{topic_id}/posts` | Bearer | |
| POST | `/api/writings` | Bearer | `{title, body, visibility}` public\|friends\|private |
| GET | `/api/writings/me` | Bearer | |
| GET | `/api/writings/{writing_id}` | Bearer | Visibility enforced |
| PATCH | `/api/writings/{writing_id}` | Bearer | Author only |
| DELETE | `/api/writings/{writing_id}` | Bearer | Author only |
| GET | `/api/kinks` | Bearer | Taxonomy list; optional `?q=` `?category=` `?parent_id=` |
| GET | `/api/profiles/me/kinks` | Bearer | Current user kink stances |
| PUT | `/api/profiles/me/kinks` | Bearer | Replace set `{kinks:[{kink_id,stance}]}` into\|curious\|limit |
| GET | `/api/profiles/{user_id}/kinks` | optional | Visible when profile is; no kink-facet people search |
| POST | `/api/events` | Bearer | Create metro/virtual event; auto RSVP going as host |
| GET | `/api/events` | Bearer | Upcoming non-cancelled; optional `?metro=`; excludes blocked hosts |
| GET | `/api/events/{event_id}` | Bearer | Detail + `my_rsvp`; `virtual_url` only for host or going |
| PATCH | `/api/events/{event_id}` | Bearer | Host only |
| POST | `/api/events/{event_id}/cancel` | Bearer | Host soft-cancel |
| PUT | `/api/events/{event_id}/rsvp` | Bearer | Upsert `{status, show_on_list?}` going\|interested\|declined |
| DELETE | `/api/events/{event_id}/rsvp` | Bearer | Clear RSVP (204) |
| GET | `/api/events/{event_id}/attendees` | Bearer | Filtered by `attendee_list_visibility`; blocks omitted |
| POST | `/api/moderation/report` | Bearer | post\|user\|group\|writing\|topic |
| GET | `/api/moderation/reports` | Bearer | Open reports (MVP any authed; TODO admin) |
| POST | `/api/moderation/posts/{post_id}/hide` | Bearer | MVP any authed |
| POST | `/api/moderation/writings/{writing_id}/hide` | Bearer | MVP any authed |

## Admin gate

- `users.is_admin` boolean.
- **First signup becomes admin** (founder) for local MVP.
- Admin routes return `403 FORBIDDEN` for non-admins.
