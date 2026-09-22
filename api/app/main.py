"""Cove MVP API — adult social forum (18+ only)."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.kink_seed import seed_kink_tags
from app.models import InviteCode
from app.routers import admin, auth, events, groups, invites, kinks, media, meta, moderation, posts, profiles, social, writings


SEED_INVITE_CODE = "COVE-BETA-001"
SEED_INVITE_MAX_USES = 10_000


def seed_invite_code() -> None:
    db = SessionLocal()
    try:
        seeds = [
            (SEED_INVITE_CODE, SEED_INVITE_MAX_USES, "seeded local beta code"),
            ("COVE-BETA", 1000, "web mock alias"),
            ("WELCOME-90", 1000, "web mock alias"),
        ]
        for code, max_uses, note in seeds:
            existing = db.scalar(select(InviteCode).where(InviteCode.code == code))
            if existing is None:
                db.add(
                    InviteCode(
                        code=code,
                        created_by_user_id=None,
                        max_uses=max_uses,
                        use_count=0,
                        expires_at=None,
                        revoked=False,
                        note=note,
                    )
                )
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_invite_code()
    db = SessionLocal()
    try:
        seed_kink_tags(db)
    finally:
        db.close()
    yield


settings = get_settings()

app = FastAPI(
    title="Cove API",
    description=(
        "Cove — adult social forum (18+ only, US jurisdiction). Not a FetLife clone. "
        "JWT Bearer auth. Open registration (18+). See README for Queenie (frontend) integration."
    ),
    version="0.2.0",
    lifespan=lifespan,
)

# CORS_ORIGINS=* (Render free) cannot use allow_credentials=True with wildcard.
# Auth uses Bearer tokens in Authorization, not cookies — credentials=False is fine.
_cors_origins = settings.cors_origin_list
_cors_wildcard = _cors_origins == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=not _cors_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meta.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(invites.router)
app.include_router(profiles.router)
app.include_router(social.router)
app.include_router(posts.router)
app.include_router(groups.router)
app.include_router(groups.topics_router)
app.include_router(writings.router)
app.include_router(events.router)
app.include_router(kinks.router)
app.include_router(media.router)
app.include_router(moderation.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "cove-api"}


@app.get("/")
def root() -> JSONResponse:
    return JSONResponse(
        {
            "name": "Cove API",
            "version": "0.2.0",
            "docs": "/docs",
            "health": "/health",
            "jurisdiction": settings.jurisdiction,
            "locale": settings.locale,
            "note": "18+ only. Open registration. See CONTENT_POLICY.md",
        }
    )
