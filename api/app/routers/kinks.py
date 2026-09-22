"""Kink taxonomy directory."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.auth import CurrentUser, DbSession
from app.models import KinkTag
from app.schemas import KinkTagOut
from sqlalchemy import or_, select

router = APIRouter(prefix="/api/kinks", tags=["kinks"])


@router.get("", response_model=list[KinkTagOut])
def list_kinks(
    user: CurrentUser,
    db: DbSession,
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    parent_id: int | None = Query(default=None),
) -> list[KinkTagOut]:
    stmt = select(KinkTag).order_by(KinkTag.name.asc())
    if category and category.strip():
        stmt = stmt.where(KinkTag.category == category.strip())
    if parent_id is not None:
        stmt = stmt.where(KinkTag.parent_id == parent_id)
    if q and q.strip():
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(KinkTag.name.ilike(like), KinkTag.slug.ilike(like)))
    rows = db.scalars(stmt).all()
    return [KinkTagOut.model_validate(r) for r in rows]
