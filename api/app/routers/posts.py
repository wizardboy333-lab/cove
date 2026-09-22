"""Post routes (feed + standalone posts)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import joinedload

from app.auth import CurrentUser, DbSession, OptionalUser
from app.models import GroupMembership, Post, Topic
from app.schemas import PostCreate, PostOut
from app.social_helpers import blocked_user_ids_for

router = APIRouter(prefix="/api/posts", tags=["posts"])


def _to_out(post: Post) -> PostOut:
    return PostOut(
        id=post.id,
        author_id=post.author_id,
        group_id=post.group_id,
        topic_id=post.topic_id,
        body=post.body,
        created_at=post.created_at,
        hidden=post.hidden,
        report_count=post.report_count,
        author_display_name=post.author.display_name if post.author else None,
    )


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(body: PostCreate, user: CurrentUser, db: DbSession) -> PostOut:
    group_id = body.group_id
    topic_id = body.topic_id

    if topic_id is not None:
        topic = db.get(Topic, topic_id)
        if topic is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"detail": "Topic not found", "code": "NOT_FOUND"},
            )
        if topic.locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"detail": "Topic is locked", "code": "TOPIC_LOCKED"},
            )
        group_id = topic.group_id
        membership = db.scalar(
            select(GroupMembership).where(
                GroupMembership.user_id == user.id,
                GroupMembership.group_id == group_id,
            )
        )
        if membership is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"detail": "Join the group before posting", "code": "NOT_A_MEMBER"},
            )
    elif group_id is not None:
        membership = db.scalar(
            select(GroupMembership).where(
                GroupMembership.user_id == user.id,
                GroupMembership.group_id == group_id,
            )
        )
        if membership is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"detail": "Join the group before posting", "code": "NOT_A_MEMBER"},
            )

    post = Post(
        author_id=user.id,
        group_id=group_id,
        topic_id=topic_id,
        body=body.body.strip(),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post = db.scalar(
        select(Post).options(joinedload(Post.author)).where(Post.id == post.id)
    )
    assert post is not None
    return _to_out(post)


@router.get("/feed", response_model=list[PostOut])
def feed(
    db: DbSession,
    user: OptionalUser,
    limit: int = 50,
    offset: int = 0,
) -> list[PostOut]:
    """
    Chronological home feed.

    MVP: non-hidden personal posts (group_id IS NULL, topic_id IS NULL) from anyone
    not blocked, PLUS posts in groups the user has joined (excluding blocked authors).
    Guests: 401 AGE_GATE_REQUIRED.
    """
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Confirm you are 18+ and sign in to view the feed",
                "code": "AGE_GATE_REQUIRED",
            },
        )

    joined_ids = list(
        db.scalars(
            select(GroupMembership.group_id).where(GroupMembership.user_id == user.id)
        ).all()
    )
    blocked = blocked_user_ids_for(db, user.id)

    conditions = [(Post.group_id.is_(None)) & (Post.topic_id.is_(None))]
    if joined_ids:
        conditions.append(Post.group_id.in_(joined_ids))

    q = (
        select(Post)
        .options(joinedload(Post.author))
        .where(Post.hidden.is_(False), or_(*conditions))
        .order_by(Post.created_at.desc())
        .limit(min(limit, 100))
        .offset(max(offset, 0))
    )
    posts = db.scalars(q).unique().all()
    if blocked:
        posts = [p for p in posts if p.author_id not in blocked]
    return [_to_out(p) for p in posts]


@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: int, db: DbSession, user: OptionalUser) -> PostOut:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Confirm you are 18+ and sign in to view posts",
                "code": "AGE_GATE_REQUIRED",
            },
        )
    post = db.scalar(
        select(Post).options(joinedload(Post.author)).where(Post.id == post_id)
    )
    if post is None or post.hidden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Post not found", "code": "NOT_FOUND"},
        )
    if post.author_id in blocked_user_ids_for(db, user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Post not found", "code": "NOT_FOUND"},
        )
    return _to_out(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, user: CurrentUser, db: DbSession) -> Response:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Post not found", "code": "NOT_FOUND"},
        )
    if post.author_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Only the author can delete this post", "code": "FORBIDDEN"},
        )
    db.delete(post)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
