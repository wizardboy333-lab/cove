"""Friends, follows, blocks, mutes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import and_, or_, select

from app.auth import CurrentUser, DbSession
from app.models import Block, Follow, Friendship, FriendshipStatus, Mute, User
from app.schemas import (
    BlockOut,
    FollowOut,
    FriendshipOut,
    MessageOut,
    MuteOut,
    UserIdBody,
)
from app.social_helpers import find_friendship, is_blocked_either_way

router = APIRouter(prefix="/api", tags=["social"])


def _require_user(db: DbSession, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found", "code": "NOT_FOUND"},
        )
    return user


# ── Friends ───────────────────────────────────────────────────────────────────


@router.post("/friends/request", response_model=FriendshipOut, status_code=status.HTTP_201_CREATED)
def friend_request(body: UserIdBody, user: CurrentUser, db: DbSession) -> FriendshipOut:
    if body.user_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Cannot friend yourself", "code": "INVALID"},
        )
    _require_user(db, body.user_id)
    if is_blocked_either_way(db, user.id, body.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Cannot interact — block in place", "code": "BLOCKED"},
        )
    existing = find_friendship(db, user.id, body.user_id)
    if existing is not None:
        if existing.status == FriendshipStatus.accepted:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"detail": "Already friends", "code": "ALREADY_FRIENDS"},
            )
        if existing.status == FriendshipStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"detail": "Friend request already pending", "code": "PENDING"},
            )
        # declined → reopen as new pending from current user
        existing.requester_id = user.id
        existing.addressee_id = body.user_id
        existing.status = FriendshipStatus.pending
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return FriendshipOut(
            id=existing.id,
            requester_id=existing.requester_id,
            addressee_id=existing.addressee_id,
            status=existing.status.value,
            created_at=existing.created_at,
            other_user_id=body.user_id,
        )

    fr = Friendship(
        requester_id=user.id,
        addressee_id=body.user_id,
        status=FriendshipStatus.pending,
    )
    db.add(fr)
    db.commit()
    db.refresh(fr)
    return FriendshipOut(
        id=fr.id,
        requester_id=fr.requester_id,
        addressee_id=fr.addressee_id,
        status=fr.status.value,
        created_at=fr.created_at,
        other_user_id=body.user_id,
    )


@router.post("/friends/accept", response_model=FriendshipOut)
def friend_accept(body: UserIdBody, user: CurrentUser, db: DbSession) -> FriendshipOut:
    fr = db.scalar(
        select(Friendship).where(
            Friendship.requester_id == body.user_id,
            Friendship.addressee_id == user.id,
            Friendship.status == FriendshipStatus.pending,
        )
    )
    if fr is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Pending friend request not found", "code": "NOT_FOUND"},
        )
    if is_blocked_either_way(db, user.id, body.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Cannot interact — block in place", "code": "BLOCKED"},
        )
    fr.status = FriendshipStatus.accepted
    db.add(fr)
    db.commit()
    db.refresh(fr)
    return FriendshipOut(
        id=fr.id,
        requester_id=fr.requester_id,
        addressee_id=fr.addressee_id,
        status=fr.status.value,
        created_at=fr.created_at,
        other_user_id=body.user_id,
    )


@router.post("/friends/decline", response_model=FriendshipOut)
def friend_decline(body: UserIdBody, user: CurrentUser, db: DbSession) -> FriendshipOut:
    fr = db.scalar(
        select(Friendship).where(
            Friendship.requester_id == body.user_id,
            Friendship.addressee_id == user.id,
            Friendship.status == FriendshipStatus.pending,
        )
    )
    if fr is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Pending friend request not found", "code": "NOT_FOUND"},
        )
    fr.status = FriendshipStatus.declined
    db.add(fr)
    db.commit()
    db.refresh(fr)
    return FriendshipOut(
        id=fr.id,
        requester_id=fr.requester_id,
        addressee_id=fr.addressee_id,
        status=fr.status.value,
        created_at=fr.created_at,
        other_user_id=body.user_id,
    )


@router.get("/friends", response_model=list[FriendshipOut])
def list_friends(user: CurrentUser, db: DbSession) -> list[FriendshipOut]:
    rows = db.scalars(
        select(Friendship).where(
            or_(Friendship.requester_id == user.id, Friendship.addressee_id == user.id)
        )
    ).all()
    out: list[FriendshipOut] = []
    for fr in rows:
        other = fr.addressee_id if fr.requester_id == user.id else fr.requester_id
        other_user = db.get(User, other)
        out.append(
            FriendshipOut(
                id=fr.id,
                requester_id=fr.requester_id,
                addressee_id=fr.addressee_id,
                status=fr.status.value,
                created_at=fr.created_at,
                other_user_id=other,
                other_display_name=other_user.display_name if other_user else None,
            )
        )
    return out


# ── Follows ───────────────────────────────────────────────────────────────────


@router.post("/follows/{user_id}", response_model=FollowOut, status_code=status.HTTP_201_CREATED)
def follow_user(user_id: int, user: CurrentUser, db: DbSession) -> FollowOut:
    if user_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Cannot follow yourself", "code": "INVALID"},
        )
    _require_user(db, user_id)
    if is_blocked_either_way(db, user.id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Cannot interact — block in place", "code": "BLOCKED"},
        )
    existing = db.scalar(
        select(Follow).where(Follow.follower_id == user.id, Follow.following_id == user_id)
    )
    if existing:
        return FollowOut.model_validate(existing)
    row = Follow(follower_id=user.id, following_id=user_id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return FollowOut.model_validate(row)


@router.delete("/follows/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(user_id: int, user: CurrentUser, db: DbSession) -> Response:
    row = db.scalar(
        select(Follow).where(Follow.follower_id == user.id, Follow.following_id == user_id)
    )
    if row is not None:
        db.delete(row)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Blocks ────────────────────────────────────────────────────────────────────


@router.post("/blocks/{user_id}", response_model=BlockOut, status_code=status.HTTP_201_CREATED)
def block_user(user_id: int, user: CurrentUser, db: DbSession) -> BlockOut:
    if user_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Cannot block yourself", "code": "INVALID"},
        )
    _require_user(db, user_id)
    existing = db.scalar(
        select(Block).where(Block.blocker_id == user.id, Block.blocked_id == user_id)
    )
    if existing:
        return BlockOut.model_validate(existing)

    # Drop follow edges both ways on block
    for edge in db.scalars(
        select(Follow).where(
            or_(
                and_(Follow.follower_id == user.id, Follow.following_id == user_id),
                and_(Follow.follower_id == user_id, Follow.following_id == user.id),
            )
        )
    ).all():
        db.delete(edge)

    row = Block(blocker_id=user.id, blocked_id=user_id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return BlockOut.model_validate(row)


@router.delete("/blocks/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unblock_user(user_id: int, user: CurrentUser, db: DbSession) -> Response:
    row = db.scalar(
        select(Block).where(Block.blocker_id == user.id, Block.blocked_id == user_id)
    )
    if row is not None:
        db.delete(row)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Mutes ─────────────────────────────────────────────────────────────────────


@router.post("/mutes/{user_id}", response_model=MuteOut, status_code=status.HTTP_201_CREATED)
def mute_user(user_id: int, user: CurrentUser, db: DbSession) -> MuteOut:
    if user_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Cannot mute yourself", "code": "INVALID"},
        )
    _require_user(db, user_id)
    existing = db.scalar(
        select(Mute).where(Mute.muter_id == user.id, Mute.muted_id == user_id)
    )
    if existing:
        return MuteOut.model_validate(existing)
    row = Mute(muter_id=user.id, muted_id=user_id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return MuteOut.model_validate(row)


@router.delete("/mutes/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unmute_user(user_id: int, user: CurrentUser, db: DbSession) -> Response:
    row = db.scalar(
        select(Mute).where(Mute.muter_id == user.id, Mute.muted_id == user_id)
    )
    if row is not None:
        db.delete(row)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
