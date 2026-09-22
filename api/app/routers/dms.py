"""1:1 direct messages with block + new-account friction."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import desc, or_, select

from app.auth import CurrentUser, DbSession
from app.models import DmConversation, DmMessage, User
from app.schemas import (
    DmConversationCreate,
    DmConversationOut,
    DmMessageCreate,
    DmMessageOut,
)
from app.social_helpers import are_friends, is_blocked_either_way

router = APIRouter(prefix="/api/dms", tags=["dms"])

NEW_ACCOUNT_HOURS = 24


def _pair(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)


def _other_id(conv: DmConversation, me: int) -> int:
    return conv.user_b_id if conv.user_a_id == me else conv.user_a_id


def _participant(conv: DmConversation, user_id: int) -> bool:
    return user_id in (conv.user_a_id, conv.user_b_id)


def _account_age_ok(user: User, other_id: int, db: DbSession) -> None:
    """New accounts (<24h) may only DM mutual friends."""
    created = user.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    age = datetime.now(timezone.utc) - created
    if age >= timedelta(hours=NEW_ACCOUNT_HOURS):
        return
    if are_friends(db, user.id, other_id):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "detail": "Accounts under 24h can only DM mutual friends",
            "code": "DM_FRICTION",
        },
    )


def _conv_out(db: DbSession, conv: DmConversation, me: int) -> DmConversationOut:
    other = _other_id(conv, me)
    other_user = db.get(User, other)
    last = db.scalar(
        select(DmMessage)
        .where(DmMessage.conversation_id == conv.id)
        .order_by(desc(DmMessage.created_at))
        .limit(1)
    )
    preview = None
    last_at = None
    if last is not None:
        preview = last.body[:120]
        last_at = last.created_at
    return DmConversationOut(
        id=conv.id,
        other_user_id=other,
        other_display_name=other_user.display_name if other_user else "Member",
        created_at=conv.created_at,
        last_message_preview=preview,
        last_message_at=last_at,
    )


@router.post(
    "/conversations",
    response_model=DmConversationOut,
    status_code=status.HTTP_201_CREATED,
)
def start_conversation(
    body: DmConversationCreate, user: CurrentUser, db: DbSession
) -> DmConversationOut:
    if body.user_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Cannot DM yourself", "code": "INVALID"},
        )
    other = db.get(User, body.user_id)
    if other is None or not other.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found", "code": "NOT_FOUND"},
        )
    if is_blocked_either_way(db, user.id, other.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found", "code": "NOT_FOUND"},
        )
    _account_age_ok(user, other.id, db)

    a, b = _pair(user.id, other.id)
    conv = db.scalar(
        select(DmConversation).where(
            DmConversation.user_a_id == a, DmConversation.user_b_id == b
        )
    )
    if conv is None:
        conv = DmConversation(user_a_id=a, user_b_id=b)
        db.add(conv)
        db.commit()
        db.refresh(conv)
    return _conv_out(db, conv, user.id)


@router.get("/conversations", response_model=list[DmConversationOut])
def list_conversations(user: CurrentUser, db: DbSession) -> list[DmConversationOut]:
    rows = db.scalars(
        select(DmConversation)
        .where(
            or_(
                DmConversation.user_a_id == user.id,
                DmConversation.user_b_id == user.id,
            )
        )
        .order_by(desc(DmConversation.created_at))
    ).all()
    out: list[DmConversationOut] = []
    for conv in rows:
        other = _other_id(conv, user.id)
        if is_blocked_either_way(db, user.id, other):
            continue
        out.append(_conv_out(db, conv, user.id))
    # sort by last message
    out.sort(key=lambda c: c.last_message_at or c.created_at, reverse=True)
    return out


@router.get("/conversations/{conversation_id}/messages", response_model=list[DmMessageOut])
def list_messages(
    conversation_id: int, user: CurrentUser, db: DbSession
) -> list[DmMessageOut]:
    conv = db.get(DmConversation, conversation_id)
    if conv is None or not _participant(conv, user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Conversation not found", "code": "NOT_FOUND"},
        )
    other = _other_id(conv, user.id)
    if is_blocked_either_way(db, user.id, other):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Conversation not found", "code": "NOT_FOUND"},
        )
    rows = db.scalars(
        select(DmMessage)
        .where(DmMessage.conversation_id == conversation_id)
        .order_by(DmMessage.created_at.asc())
        .limit(200)
    ).all()
    return [DmMessageOut.model_validate(m) for m in rows]


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=DmMessageOut,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    conversation_id: int,
    body: DmMessageCreate,
    user: CurrentUser,
    db: DbSession,
) -> DmMessageOut:
    conv = db.get(DmConversation, conversation_id)
    if conv is None or not _participant(conv, user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Conversation not found", "code": "NOT_FOUND"},
        )
    other = _other_id(conv, user.id)
    if is_blocked_either_way(db, user.id, other):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Cannot message this user", "code": "BLOCKED"},
        )
    _account_age_ok(user, other, db)
    msg = DmMessage(
        conversation_id=conv.id,
        sender_id=user.id,
        body=body.body.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return DmMessageOut.model_validate(msg)
