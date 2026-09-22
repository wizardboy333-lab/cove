# Render deploy notes

## Ephemeral disk (media MVP)

Stage 6 stores uploads on the API service local disk (`MEDIA_ROOT`, default `uploads/` under the API working directory).

On **Render free/starter** the filesystem is **ephemeral**:

- Files disappear on redeploy, restart, or disk recycle.
- Do not rely on uploaded photos surviving across deploys.
- For production, move to S3-compatible object storage + signed URLs (presigned upload was deferred).

Auth is still required to read `/api/media/{id}/file`.

## Services

- Web: `cove-web` (Next.js) — `NEXT_PUBLIC_API_URL` must point at the API host.
- API: `cove-api` (FastAPI) — set `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`.
