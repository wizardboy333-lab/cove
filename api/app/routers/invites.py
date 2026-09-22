"""Invite code create + public validate."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.auth import CurrentUser, DbSession
from app.models import InviteCode
from app.schemas import InviteCreate, InviteOut, InviteValidateOut

router = APIRouter(prefix="/api/invites", tags=["invites"])


def _normalize(code: str) -> str:
    return code.strip().upper()


def _redeemable(invite: InviteCode) -> tuple[bool, str | None, int]:
    remaining = max(0, invite.max_uses - invite.use_count)
    if invite.revoked:
        return False, "INVITE_REVOKED", remaining
    if invite.expires_at is not None:
        exp = invite.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            return False, "INVITE_EXPIRED", remaining
    if remaining <= 0:
        return False, "INVITE_EXHAUSTED", 0
    return True, None, remaining


@router.post("", response_model=InviteOut, status_code=status.HTTP_201_CREATED)
def create_invite(body: InviteCreate, user: CurrentUser, db: DbSession) -> InviteOut:
    """
    Beta admin-lite: any authenticated user may create an invite code.
    TODO: restrict to admin/trusted hosts before open registration.
    """
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
        created_by_user_id=user.id,
        max_uses=body.max_uses,
        use_count=0,
        expires_at=body.expires_at,
        revoked=False,
        note=getattr(body, "note", None),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return InviteOut.model_validate(invite)


@router.get("/validate/{code}", response_model=InviteValidateOut)
def validate_invite(code: str, db: DbSession) -> InviteValidateOut:
    invite = db.scalar(select(InviteCode).where(InviteCode.code == _normalize(code)))
    if invite is None:
        return InviteValidateOut(
            code=_normalize(code),
            redeemable=False,
            reason="INVITE_INVALID",
            remaining_uses=None,
        )
    ok, reason, remaining = _redeemable(invite)
    return InviteValidateOut(
        code=invite.code,
        redeemable=ok,
        reason=reason,
        remaining_uses=remaining,
    )
