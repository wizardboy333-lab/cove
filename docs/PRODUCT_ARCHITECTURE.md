# Cove — Product & Architecture Spec (v0.1)

Working title: **Cove**. An 18+ social network / forum for BDSM, kink, and fetish community — education, discussion, groups, events, writings — **not** a dating/hookup market. Inspired by FetLife’s community strengths; original product, brand, and UX.

Audience: 18+ only · English first · Solo / tiny team · Practical ship plan

---

## A. Product spec

### Must-have MVP (ship in ~90 days)

| Area | MVP |
|------|-----|
| **Access** | Email+password auth, email verify, hard 18+ attestation + birthdate (store age band or DOB hashed/server-side only), ToS/guidelines accept |
| **Profile** | Nickname (unique), avatar, short bio, gender/identity (custom + presets), orientation, role (Dom/sub/switch/etc. + custom), city/region (approximate — city or metro, not street), kink list with stance, relationship links to other members (optional, mutual confirm) |
| **Groups** | Create topic or local group, join, forum threads (title + posts), pin, group mods, basic group rules |
| **Writings** | Long-form posts / journals with tags, comments, visibility controls |
| **Feed** | Chronological activity from friends + joined groups (follow + friend) |
| **Social graph** | Friend request + accept; follow (one-way); block; mute |
| **DMs** | 1:1 text DMs only (no groups chat in MVP) |
| **Media** | Image upload only (no video yet), NSFW flag default on, visibility scopes, blur-until-tap for feeds |
| **Events (thin)** | Create event (title, time, timezone, city or “virtual”, description), RSVP going/interested, attendee list visible per host setting |
| **Search (limited)** | Search groups, events, writings/tags, kinks; **member search only by nickname exact/prefix** — no age/gender/orientation filters |
| **Safety** | Report content/user, block, mute; admin queue; community guidelines gate |
| **Trust** | Free for all core features |

### v2 (explicitly later)

- Video + richer albums
- Multi-persona / alt accounts with linked privacy modes
- Advanced event discovery map (geohash, never exact address public)
- Supporter tier (badges, higher limits, fewer ads if any)
- Group chat / event chat rooms
- Push notifications polish, iOS/Android apps
- i18n
- Stronger age verification (vendor ID check) where legally required
- Mentorship / education curricula collections
- Polls, polls in groups, wiki-style group resources

### User types

| Type | Powers |
|------|--------|
| **Member** | Profile, post, join groups, RSVP, DM (subject to blocks), report |
| **Group mod** | Pin/lock/delete threads in their group, remove members, appoint other mods (owner only), edit group rules |
| **Event host** | Edit event, manage RSVP visibility, cancel event, message attendees (optional v1.1) |
| **Site admin** | User suspend/ban, content remove, report queue, feature flags, kink taxonomy edit |
| **Site trust & safety** (role) | Same as admin for reports; no billing/infra |

### Privacy model (who can see what)

Default stance: **opt-in visibility**, kink-positive but not broadcast-by-default.

**Scopes (reuse everywhere):** `public` (logged-in members) · `friends` · `followers` (optional) · `group:<id>` · `private` (only self) · later: `close_friends` list

| Object | Default | Notes |
|--------|---------|-------|
| Profile core (nick, avatar, role, city metro) | public (members) | Real name never collected as required field |
| Kink list | public or friends (user choice) | Hard limits never shown as searchable “shopping” facets |
| Relationship links | mutual + each side’s visibility | |
| Writings | public / friends / private | |
| Photos | friends (recommended default) | Blur in feeds until explicit expand; albums inherit |
| Friend list | friends or private | |
| Group membership | group-visible | |
| Event exact venue | **host-only until RSVP “going”** or “share with going” | Public page: city/metro + virtual link policy |
| DMs | participants only | |
| Search indexing | public fields only | No DOB, no email, no exact address |

Guest (logged out): landing + guidelines only; **no** browsing profiles/media (reduces scraping and age-risk).

### Community guidelines outline

1. **18+ only** — zero tolerance for anyone under 18; zero CSAM; no “age play” involving minors in any form.
2. **Consent culture** — fantasy ≠ consent to contact; no means no; negotiate in good faith; respect limits fields.
3. **Consensual adult kink only** — fictional CNC/rape-play discussion in clearly marked spaces OK; **real-world non-consensual crime content, trafficking, and how-to crime** banned.
4. **No doxxing** — no publishing real names, workplaces, addresses, or private photos of others.
5. **Anti-harassment** — no stalking, repeated unwanted DMs after block, brigade, or vote/report abuse.
6. **No public criminal accusation as drama** — serious allegations go to law enforcement / private report to T&S, not call-out threads (reduces defamation and pile-ons).
7. **Events** — hosts responsible for local legality and consent norms; site is not a venue.
8. **Intellectual honesty** — no impersonation; alts allowed later only if policy allows and not for evasion of bans.

---

## B. Information architecture

### Main nav (mobile-first)

1. **Home** (feed)
2. **Explore** (groups, events, writings, kinks — not “people browser”)
3. **Create** (+) — writing, photo, event, group thread
4. **Inbox** (DMs + notifications)
5. **Me** (profile, settings, privacy, safety)

Secondary: Groups · Events · Writings · Kinks directory (read-only taxonomy)

### Key screens

- Onboarding: age gate → guidelines → create nickname → optional kink starter pack → find 1 local/topic group
- Profile (view/edit) + Kinks tab + Writings tab + Photos tab + Relations tab
- Group hub → Threads list → Thread detail
- Event detail + RSVP
- Writing editor (markdown) + reader
- Feed
- Limited search
- Report modal; Block confirm; Admin report queue

### Profile sections

1. Header: avatar, nickname, role badges, metro, short bio  
2. Identity: gender/identity, orientation, role  
3. Kinks: stance chips (Into / Curious / Soft limit / Hard limit / No)  
4. Relations: partners/friends-in-dynamic (linked accounts)  
5. About / guidelines personal note  
6. Writings & photos (tabbed, respect privacy)  
7. Safety: “How to approach me” + “Do not contact me about…”  

### Data model in plain English

- **User** — account + profile fields + privacy defaults + status (active/suspended).  
- **KinkTag** — hierarchical taxonomy (parent/child), slug, description, NSFW flag.  
- **UserKink** — user ↔ tag + **stance** + optional note + visibility.  
- **Friendship** — bidirectional accepted link; **Follow** — one-way.  
- **Group** — topic or local; rules; owner; settings.  
- **GroupMember** — role (member/mod/owner).  
- **Topic (thread)** — belongs to group; title; pinned; locked.  
- **Post** — reply inside a topic **or** a writing on profile; author; body; visibility; tags.  
- **Event** — host; time range; place mode (metro / virtual / private venue); visibility; capacity.  
- **Rsvp** — status going/interested/can’t; show on list?.  
- **Media** — owner; storage key; blur hash; visibility; attached to profile/writing/event.  
- **Report** — target type/id; reason; reporter; state (open/actioned/dismissed).  
- **Block / Mute** — actor → target.  
- **DM Thread / Message** — 1:1.  
- **Notification** — sparse types for MVP.

---

## C. Technical recommendations

### Stack recommendation (2026)

**Recommended for a tiny team: custom app on Next.js (App Router) + Postgres + object storage + Redis.**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Next.js + Postgres + S3-compatible + Redis** | One language (TS) possible with tRPC/ORM; great mobile web; you own privacy/feed/kink model | You build forum/event semantics | **Best default** |
| **Rails + Hotwire + Postgres** (FetLife heritage) | Batteries, solid conventions, fast CRUD | Hiring/AI assist skews JS; less “app-like” mobile UX unless lots of custom | Strong if you’re Rails-fluent |
| **Discourse / Flarum base** | Instant forums, mods, trust levels | Fighting the product toward social graph, kink taxonomy, events, media privacy is painful | **Use only if groups/forum is 90% of product** — it isn’t |
| **Remix / SvelteKit** | Excellent UX engineering | Smaller ecosystem than Next for your AI pair programmers | Fine alternative to Next |

**Start custom** (not Discourse). FetLife’s value is the **social + kink + event + privacy** mesh; forum software optimizes thread discussion and will fight you on profiles/media/graph.

**API shape:** start with **Next.js full-stack** (Server Actions + Route Handlers) *or* split `web/` + `api/` (FastAPI) if you already have that split with teammates. For solo: **one Next.js app + Prisma/Drizzle + Postgres** ships faster. For Queenie/Diva split: keep **Next web + FastAPI**, shared OpenAPI contract.

### Media handling

- Upload via **presigned URLs** to S3/R2/Bunny; never stream through app servers long-term.  
- Store **private by default**; deliver via **short-lived signed URLs**.  
- Generate **blurhash** + low-res placeholder; feed shows blurred until user taps “Show” (consent click).  
- Mark objects `nsfw=true` by default for this product.  
- Virus scan (ClamAV or vendor) async; quarantine bucket.  
- Video in v2: HLS via Mux/Cloudflare Stream with signed playback.

### Auth, 18+, abuse

- Auth: email/password + session cookies (httpOnly, secure, sameSite) or Lucia/Auth.js; optional OAuth later (many IdPs hate adult).  
- **18+ gate:** DOB at signup + checkbox attestation + re-prompt periodically; **deny under 18** at account creation (don’t soft-hold).  
- Consider **age-assurance vendor** (e.g. regional AV laws) as feature-flagged module — expensive and frictiony; plan hooks now.  
- Rate limits: IP + account on signup, login, DM, report, search, upload.  
- Abuse: captcha on suspicious signup; device fingerprint light-touch; ban evasion watch on email root + IP blocks.  
- DMs: freemium-style **friction for new accounts** (e.g. can’t DM until email verified + profile age > 24h + 1 group join) — kills spam without dating-site filters.

### Approximate infra cost (order-of-magnitude USD/month)

Assumes managed Postgres, Redis, object storage, one region, modest media.

| Scale | Users MAU | Infra ballpark | Notes |
|-------|-----------|----------------|-------|
| Early | ~1k | **$40–150** | Single Render/Fly/Railway + R2 + small Postgres |
| Growth | ~50k | **$800–3,000** | Multi-instance API/web, bigger DB, CDN egress, Redis, email, error tracking |
| Large | ~500k | **$8k–40k+** | Read replicas, dedicated media pipeline, heavier moderation tooling, support systems, possible multi-region |

Biggest cost drivers: **media egress**, **moderation labor** (not infra), email, and compliance tooling — not raw CPU.

---

## D. Database sketch

### Core tables (fields abbreviated)

**users**  
`id`, `email`, `password_hash`, `email_verified_at`, `nickname` (unique), `status`, `dob` or `birth_year`+month (minimize), `age_attested_at`, `created_at`, `last_seen_at`, `role` (member/admin)

**profiles**  
`user_id`, `bio`, `avatar_media_id`, `gender_label`, `orientation_label`, `role_label`, `metro_area`, `country_code`, `approach_me`, `do_not_contact_about`, `profile_visibility`, `kinks_visibility`, `created_at`

**kink_tags**  
`id`, `parent_id` (nullable), `slug`, `name`, `description`, `nsfw`, `is_active`, `sort`

**user_kinks**  
`user_id`, `kink_tag_id`, `stance` (`into`|`curious`|`soft_limit`|`hard_limit`|`no`), `note`, `visibility`, unique(user_id, kink_tag_id)

**friendships**  
`user_id`, `friend_id`, `status` (`pending`|`accepted`), `requested_by`, unique pair ordered

**follows**  
`follower_id`, `followee_id`, unique

**blocks / mutes**  
`actor_id`, `target_id`, `created_at`

**groups**  
`id`, `slug`, `name`, `description`, `kind` (`topic`|`local`), `metro_area`, `rules`, `owner_id`, `is_private`, `created_at`

**group_members**  
`group_id`, `user_id`, `role` (`member`|`mod`|`owner`), `joined_at`

**topics**  
`id`, `group_id`, `author_id`, `title`, `is_pinned`, `is_locked`, `last_activity_at`

**posts**  
`id`, `author_id`, `kind` (`topic_reply`|`writing`|`status`), `topic_id` nullable, `title` nullable, `body_md`, `visibility`, `group_id` nullable, `created_at`, `edited_at`, `deleted_at`

**post_tags** — post ↔ tag (writing tags; may reuse kink_tags or separate `content_tags`)

**events**  
`id`, `host_id`, `title`, `description`, `starts_at`, `ends_at`, `timezone`, `place_mode` (`metro`|`virtual`|`private_venue`), `metro_area`, `venue_private_notes` (only to going), `virtual_url_private`, `attendee_list_visibility`, `capacity`, `created_at`

**rsvps**  
`event_id`, `user_id`, `status` (`going`|`interested`|`declined`), `show_on_list`, unique(event_id, user_id)

**media**  
`id`, `owner_id`, `storage_key`, `blurhash`, `width`, `height`, `content_type`, `visibility`, `nsfw`, `scan_status`, `created_at`

**media_attachments** — media ↔ post/profile/event

**reports**  
`id`, `reporter_id`, `target_type`, `target_id`, `reason_code`, `details`, `state`, `handled_by`, `created_at`

**dm_threads** / **dm_messages** — standard 1:1

**notifications** — `user_id`, `type`, `payload_json`, `read_at`

### Kink taxonomy

- Hierarchical **kink_tags** (e.g. Impact → Spanking → Implements).  
- User attaches tag with **stance** (into / curious / soft_limit / hard_limit / no).  
- Directory browse by tag; **member discovery by tag returns anonymized counts or group recommendations first**, not a meat-market grid. Optional: “members who share this kink” only as **friends-of-friends** or **opt-in**.  
- Hard limits: never used as ad targeting; careful with search — prefer “education writings tagged X” over “people into X nearby.”

---

## E. Safety, legal, ops

### Age verification options (ladder)

1. **MVP:** DOSchecksum DOB + explicit attestation + terms; block under 18; session re-check.  
2. **Enhanced:** email + phone verify; rate-limit.  
3. **Legal-defensible AV (when required):** certified age-assurance vendor (tokenized “over 18” claim, minimize storing ID images yourself).  
4. **Never:** trust social login alone as age proof.

Consult counsel for your launch jurisdictions (US state AV laws, UK Online Safety Act, EU). This section is product design, not legal advice.

### Report / block / mute

- **Mute** — hide from feed/DMs without notifying.  
- **Block** — mutual invisibility + DM ban.  
- **Report** — reasons: underage suspicion, harassment, non-consent content, doxxing, spam, other.  
- Queue: oldest open + severity; actions: warn, remove content, suspend, ban, mark “legal hold.”  
- Reporter gets **generic** “we took action” — not a public verdict thread.

### Do not store

- Legal name (unless payment KYC later via processor-hosted fields)  
- Exact home address  
- Government ID images on your own disk if a vendor can tokenize  
- Precise lat/long of residence; for events prefer metro + private venue reveal  
- Unhashed or reversible DOB in analytics warehouses  

### Payments risk

Adult platforms get **denied by many processors**. Plan: Stripe often difficult for explicit NSFW; expect **specialist adult billing** (high fees), crypto as last resort (compliance headaches), or **supporter tier via third-party** with careful ToS. Ship **free core** first; delay cards until counsel + processor intro.

### Moderation staffing (small launch)

| Stage | Model |
|-------|-------|
| 0–1k users | Founder + 1 trusted volunteer mod; daily report triage; clear escalation |
| 1k–10k | Paid part-time T&S (10–20h/week) + volunteer group mods; written playbooks |
| 10k+ | Rotate on-call; specialize CSAM reporting to NCMEC/cyber tip where applicable; outside counsel on speed-dial |

Automate: spam heuristics, hash-matching for known CSAM (PhotoDNA or equivalent where available), keyword queues — **never** fully automate bans for nuanced kink context without human review.

---

## F. 90-day build plan

Assume: solo or 2–3 people + AI. Working title Cove. Cut ruthlessly.

### What to cut from v1

- Video  
- Multi-persona  
- Maps / precise geolocation  
- Supporter billing  
- Native apps  
- Fancy recommendation ML  
- Group chat  
- Full FetLife kink import  
- Public guest browsing  
- Age/gender people search (never)

### Week-by-week

**Days 1–7 — Foundations**  
Repo, Postgres schema v1, auth, 18+ gate, guidelines accept, profile nickname + bio + metro, deploy preview URL.

**Days 8–14 — Graph & privacy skeleton**  
Friend request/accept, follow, block/mute, visibility helper on all reads.

**Days 15–21 — Kinks**  
Taxonomy seed (curated 150–300 tags, hierarchical), user_kinks UI, profile kinks tab.

**Days 22–35 — Groups forum**  
Groups CRUD, members, topics, posts, pin/lock, mod roles, feed integration for group activity.

**Days 36–45 — Writings + feed**  
Markdown writings with tags + visibility; home feed (friends + groups); notifications basic.

**Days 46–55 — Media**  
Presigned image upload, blurhash, signed read URLs, attach to profile/writing; blur-until-tap.

**Days 56–65 — Events thin slice**  
Create/RSVP, metro/virtual, attendee privacy, show on explore.

**Days 66–75 — DMs + safety**  
1:1 DMs with new-account friction; report queue; admin suspend; block enforcement everywhere.

**Days 76–83 — Limited search + polish**  
Search groups/events/writings/kinks; nickname search only for people; mobile UX pass; rate limits.

**Days 84–90 — Soft launch**  
Open registration (18+ attestation), seed education groups, moderation playbook drill, backup/restore, legal pages (ToS, Privacy, Guidelines), metrics (signups, reports SLA).

### Team split suggestion (matches current)

- **Diva:** API/auth, age gate, privacy enforcement, reports  
- **Queenie:** mobile-first UI, profile/kinks/groups/feed  
- **Grok Bot:** architecture, schema, infra/deploy, integration, taxonomy seed

---

## Clarifying questions (after first complete pass)

1. **Launch geography** — primarily one country/state, or global English from day one? (drives AV and event/legal copy)  
2. **DOB storage** — store full DOB server-side, or only “over 18 verified + birth year”?  
3. **Events** — must v1 support private venue reveal to “going,” or is metro/virtual enough?  
4. **Media risk appetite** — photos only until a specialist host is lined up?  
5. **Name** — keep **Cove**, or do you have a preferred product name/domain?  
6. **Existing forum software** — any hard preference for Rails vs Next despite the recommendation?  
7. **Invite-only beta** — ~~yes/no for first 90 days?~~ **Decided: no.** Open registration (18+).

---

## Locked v1 decisions (2026-09-22)

See [V1_DECISIONS.md](./V1_DECISIONS.md). Summary: US-English first; no full DOB (vendor AV + `is_18_plus` / optional `birth_year`); events metro/virtual only; photos+text only; working name Cove; Next.js+Postgres; **open registration** (18+; invite codes optional/unused).
