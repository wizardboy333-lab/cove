"""Moderation: report + hide post/writing."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.auth import CurrentUser, DbSession
from app.models import Group, Post, Report, ReportStatus, TargetType, Topic, User, Writing
from app.schemas import MessageOut, ReportCreate, ReportOut

router = APIRouter(prefix="/api/moderation", tags=["moderation"])


@router.post("/report", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def create_report(body: ReportCreate, user: CurrentUser, db: DbSession) -> ReportOut:
    target_type = TargetType(body.target_type)

    if target_type == TargetType.post:
        target = db.get(Post, body.target_id)
        if target is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"detail": "Post not found", "code": "NOT_FOUND"},
            )
        target.report_count = int(target.report_count or 0) + 1
    elif target_type == TargetType.user:
        if db.get(User, body.target_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"detail": "User not found", "code": "NOT_FOUND"},
            )
    elif target_type == TargetType.group:
        if db.get(Group, body.target_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"detail": "Group not found", "code": "NOT_FOUND"},
            )
    elif target_type == TargetType.writing:
        if db.get(Writing, body.target_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"detail": "Writing not found", "code": "NOT_FOUND"},
            )
    elif target_type == TargetType.topic:
        if db.get(Topic, body.target_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"detail": "Topic not found", "code": "NOT_FOUND"},
            )

    report = Report(
        reporter_id=user.id,
        target_type=target_type,
        target_id=body.target_id,
        reason=body.reason.strip(),
        status=ReportStatus.open,
    )
    db.add(report)
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


@router.get("/reports", response_model=list[ReportOut])
def list_open_reports(user: CurrentUser, db: DbSession) -> list[ReportOut]:
    """
    List open reports.
    TODO: restrict to admin/mod before production. MVP: any authenticated user.
    """
    rows = db.scalars(
        select(Report)
        .where(Report.status == ReportStatus.open)
        .order_by(Report.created_at.desc())
    ).all()
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


@router.post("/posts/{post_id}/hide", response_model=MessageOut)
def hide_post(post_id: int, user: CurrentUser, db: DbSession) -> MessageOut:
    """
    MVP admin stub: any authenticated user may hide a post.
    Replace with role checks (admin/moderator) before production.
    """
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Post not found", "code": "NOT_FOUND"},
        )
    post.hidden = True
    db.add(post)
    db.commit()
    return MessageOut(detail="Post hidden", code="POST_HIDDEN")


@router.post("/writings/{writing_id}/hide", response_model=MessageOut)
def hide_writing(writing_id: int, user: CurrentUser, db: DbSession) -> MessageOut:
    """MVP admin stub: any authenticated user may hide a writing."""
    writing = db.get(Writing, writing_id)
    if writing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Writing not found", "code": "NOT_FOUND"},
        )
    writing.hidden = True
    db.add(writing)
    db.commit()
    return MessageOut(detail="Writing hidden", code="WRITING_HIDDEN")
