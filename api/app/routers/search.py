"""Limited search — groups/events/writings/kinks + people by display_name prefix only."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import or_, select

from app.auth import CurrentUser, DbSession
from app.models import Event, Group, KinkTag, User, Writing, WritingVisibility
from app.social_helpers import blocked_user_ids_for
from pydantic import BaseModel

router = APIRouter(prefix="/api/search", tags=["search"])


class SearchHit(BaseModel):
    type: str
    id: int
    title: str
    subtitle: str | None = None


class SearchOut(BaseModel):
    q: str
    results: list[SearchHit]


@router.get("", response_model=SearchOut)
def search(
    user: CurrentUser,
    db: DbSession,
    q: str = Query(min_length=1, max_length=120),
    type: str | None = Query(default=None, alias="type"),
    types: str | None = Query(default=None),
) -> SearchOut:
    needle = q.strip()
    if not needle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "q required", "code": "QUERY_REQUIRED"},
        )

    raw = (type or types or "groups,events,writings,kinks,people").lower()
    wanted = {t.strip() for t in raw.split(",") if t.strip()}
    allowed = {"groups", "events", "writings", "kinks", "people"}
    if not wanted <= allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "type must be groups|events|writings|kinks|people",
                "code": "INVALID_TYPE",
            },
        )

    results: list[SearchHit] = []
    like = f"%{needle}%"
    prefix = f"{needle}%"
    blocked = blocked_user_ids_for(db, user.id)

    if "groups" in wanted:
        rows = db.scalars(
            select(Group)
            .where(or_(Group.name.ilike(like), Group.description.ilike(like)))
            .order_by(Group.name.asc())
            .limit(20)
        ).all()
        for g in rows:
            results.append(
                SearchHit(
                    type="groups",
                    id=g.id,
                    title=g.name,
                    subtitle=(g.description or "")[:120] or None,
                )
            )

    if "events" in wanted:
        now = datetime.now(timezone.utc)
        rows = db.scalars(
            select(Event)
            .where(
                Event.cancelled.is_(False),
                Event.starts_at >= now,
                or_(Event.title.ilike(like), Event.metro_area.ilike(like)),
            )
            .order_by(Event.starts_at.asc())
            .limit(20)
        ).all()
        for e in rows:
            if e.host_id in blocked:
                continue
            results.append(
                SearchHit(
                    type="events",
                    id=e.id,
                    title=e.title,
                    subtitle=e.metro_area or e.place_mode.value,
                )
            )

    if "writings" in wanted:
        rows = db.scalars(
            select(Writing)
            .where(
                Writing.hidden.is_(False),
                Writing.visibility == WritingVisibility.public,
                or_(Writing.title.ilike(like), Writing.body.ilike(like)),
            )
            .order_by(Writing.created_at.desc())
            .limit(20)
        ).all()
        for w in rows:
            if w.author_id in blocked:
                continue
            results.append(
                SearchHit(type="writings", id=w.id, title=w.title, subtitle=None)
            )

    if "kinks" in wanted:
        rows = db.scalars(
            select(KinkTag)
            .where(or_(KinkTag.name.ilike(like), KinkTag.slug.ilike(like)))
            .order_by(KinkTag.name.asc())
            .limit(30)
        ).all()
        for k in rows:
            results.append(
                SearchHit(
                    type="kinks",
                    id=k.id,
                    title=k.name,
                    subtitle=k.category,
                )
            )

    if "people" in wanted:
        # display_name prefix ONLY — no demographic filters
        rows = db.scalars(
            select(User)
            .where(
                User.is_active.is_(True),
                User.display_name.ilike(prefix),
            )
            .order_by(User.display_name.asc())
            .limit(20)
        ).all()
        for u in rows:
            if u.id == user.id:
                continue
            if u.id in blocked:
                continue
            results.append(
                SearchHit(
                    type="people",
                    id=u.id,
                    title=u.display_name,
                    subtitle=None,
                )
            )

    return SearchOut(q=needle, results=results)
