"""Shared social graph helpers (blocks, friendships)."""

from __future__ import annotations

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.models import Block, Friendship, FriendshipStatus


def is_blocked_either_way(db: Session, a: int, b: int) -> bool:
    row = db.scalar(
        select(Block.id).where(
            or_(
                and_(Block.blocker_id == a, Block.blocked_id == b),
                and_(Block.blocker_id == b, Block.blocked_id == a),
            )
        )
    )
    return row is not None


def blocked_user_ids_for(db: Session, user_id: int) -> set[int]:
    """Users this user blocked OR who blocked this user."""
    rows = db.execute(
        select(Block.blocker_id, Block.blocked_id).where(
            or_(Block.blocker_id == user_id, Block.blocked_id == user_id)
        )
    ).all()
    out: set[int] = set()
    for blocker_id, blocked_id in rows:
        out.add(blocked_id if blocker_id == user_id else blocker_id)
    return out


def are_friends(db: Session, a: int, b: int) -> bool:
    row = db.scalar(
        select(Friendship.id).where(
            Friendship.status == FriendshipStatus.accepted,
            or_(
                and_(Friendship.requester_id == a, Friendship.addressee_id == b),
                and_(Friendship.requester_id == b, Friendship.addressee_id == a),
            ),
        )
    )
    return row is not None


def find_friendship(db: Session, a: int, b: int) -> Friendship | None:
    return db.scalar(
        select(Friendship).where(
            or_(
                and_(Friendship.requester_id == a, Friendship.addressee_id == b),
                and_(Friendship.requester_id == b, Friendship.addressee_id == a),
            )
        )
    )
