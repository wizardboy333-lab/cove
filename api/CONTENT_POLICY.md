# Cove Content Policy (MVP)

Cove is an **adult social forum for people 18 and older only**. Legal home: **United States**. Locale: **en-US**.

## Hard rules

- **18+ only.** Signup requires `age_attestation: true` and `is_18_plus: true`. Optional `birth_year` is rejected if it clearly implies under 18. **Full date of birth is never collected or stored.** Vendor ID verification is stubbed (`age_vendor_enabled`).
- **No CSAM.** Any sexual content involving minors (real or fictional depictions of anyone under 18) is strictly prohibited and will be removed; accounts will be disabled.
- **No illegal content.** Do not post content that facilitates or depicts illegal activity beyond adult consensual topics allowed by applicable US law.
- **Consent & dignity.** Non-consensual imagery, doxxing, and harassment are reportable and subject to removal.
- **Not a FetLife clone.** Cove is its own product; do not scrape or mirror other platforms' private data.

## Registration

Open signup for 18+ adults. `require_invite` defaults to **false**. Invite codes are optional/unused; if sent, they may be redeemed when valid.

## Moderation stubs (MVP)

- `POST /api/moderation/report` with `target_type` of `post` | `user` | `group` | `writing` | `topic`.
- Reporting a post increments `report_count`.
- Hide endpoints set `hidden=true` (MVP: any authenticated user — replace with admin/mod roles before production).
- `GET /api/moderation/reports` lists open reports (MVP any authed — TODO admin).
