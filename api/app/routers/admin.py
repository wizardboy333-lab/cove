"""Admin invite management — INVITE_FLOW contract."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.auth import CurrentUser, DbSession
from app.models import InviteCode, User
from app.schemas import InviteCreate, InviteOut

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(user: CurrentUser) -> User:
    if not getattr(user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Admin only", "code": "FORBIDDEN"},
        )
    return user


AdminUser = Depends(require_admin)  # noqa: N816 — used as annotation below


def _normalize(code: str) -> str:
    return code.strip().upper()


@router.post("/invites", response_model=InviteOut, status_code=status.HTTP_201_CREATED)
def admin_create_invite(
    body: InviteCreate,
    db: DbSession,
    admin: User = Depends(require_admin),
) -> InviteOut:
    """Create an invite code (admin/founder only)."""
    raw = body.code.strip() if body.code else f"COVE-{secrets.token_hex(4).upper()}"
    code = _normalize(raw)
    existing = db.scalar(select(InviteCode).where(InviteCode.code == code))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "Invite code already exists", "code": "INVITE_EXISTS"},
        )
    invite = InviteCode(
        code=code,
        created_by_user_id=admin.id,
        max_uses=body.max_uses,
        use_count=0,
        expires_at=body.expires_at,
        revoked=False,
        note=body.note,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return InviteOut.model_validate(invite)


@router.get("/invites", response_model=list[InviteOut])
def admin_list_invites(
    db: DbSession,
    admin: User = Depends(require_admin),
) -> list[InviteOut]:
    """List all invite codes with use_count / max_uses (admin only)."""
    rows = db.scalars(select(InviteCode).order_by(InviteCode.created_at.desc())).all()
    return [InviteOut.model_validate(r) for r in rows]
