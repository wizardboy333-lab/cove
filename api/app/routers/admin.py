"""Admin invite management — INVITE_FLOW contract."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.auth import CurrentUser, DbSession
from app.models import InviteCode, Report, ReportStatus, User
from app.schemas import InviteCreate, InviteOut, ReportOut

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



@router.get("/reports", response_model=list[ReportOut])
def admin_list_reports(
    db: DbSession,
    admin: User = Depends(require_admin),
    status_filter: str = "open",
) -> list[ReportOut]:
    """Admin report queue — open reports by default."""
    stmt = select(Report).order_by(Report.created_at.desc())
    if status_filter == "open":
        stmt = stmt.where(Report.status == ReportStatus.open)
    rows = db.scalars(stmt.limit(200)).all()
    return [
        ReportOut(
            id=r.id,
            reporter_id=r.reporter_id,
            target_type=r.target_type.value,
            target_id=r.target_id,
            reason=r.reason,
            created_at=r.created_at,
            status=r.status.value,
        )
        for r in rows
    ]


@router.post("/reports/{report_id}/resolve", response_model=ReportOut)
def admin_resolve_report(
    report_id: int,
    db: DbSession,
    admin: User = Depends(require_admin),
) -> ReportOut:
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Report not found", "code": "NOT_FOUND"},
        )
    report.status = ReportStatus.resolved
    db.commit()
    db.refresh(report)
    return ReportOut(
        id=report.id,
        reporter_id=report.reporter_id,
        target_type=report.target_type.value,
        target_id=report.target_id,
        reason=report.reason,
        created_at=report.created_at,
        status=report.status.value,
    )


@router.post("/reports/{report_id}/dismiss", response_model=ReportOut)
def admin_dismiss_report(
    report_id: int,
    db: DbSession,
    admin: User = Depends(require_admin),
) -> ReportOut:
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Report not found", "code": "NOT_FOUND"},
        )
    report.status = ReportStatus.dismissed
    db.commit()
    db.refresh(report)
    return ReportOut(
        id=report.id,
        reporter_id=report.reporter_id,
        target_type=report.target_type.value,
        target_id=report.target_id,
        reason=report.reason,
        created_at=report.created_at,
        status=report.status.value,
    )
