"""Group + topic routes."""

from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.auth import CurrentUser, DbSession, OptionalUser
from app.models import Group, GroupMembership, Post, Topic
from app.schemas import (
    GroupCreate,
    GroupOut,
    PostOut,
    TopicCreate,
    TopicOut,
    TopicPostCreate,
)

router = APIRouter(prefix="/api/groups", tags=["groups"])
topics_router = APIRouter(prefix="/api/topics", tags=["topics"])


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug[:120] or "group"


def _unique_slug(db: DbSession, base: str) -> str:
    slug = base
    n = 2
    while db.scalar(select(Group.id).where(Group.slug == slug)) is not None:
        slug = f"{base}-{n}"
        n += 1
    return slug


def _group_out(db: DbSession, group: Group) -> GroupOut:
    count = db.scalar(
        select(func.count()).select_from(GroupMembership).where(
            GroupMembership.group_id == group.id
        )
    )
    return GroupOut(
        id=group.id,
        name=group.name,
        slug=group.slug,
        description=group.description,
        creator_id=group.creator_id,
        group_type=group.group_type,
        created_at=group.created_at,
        member_count=int(count or 0),
    )


def _resolve_group(db: DbSession, id_or_slug: str) -> Group:
    if id_or_slug.isdigit():
        group = db.get(Group, int(id_or_slug))
    else:
        group = db.scalar(select(Group).where(Group.slug == id_or_slug))
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Group not found", "code": "NOT_FOUND"},
        )
    return group


def _require_member(db: DbSession, user_id: int, group_id: int) -> GroupMembership:
    membership = db.scalar(
        select(GroupMembership).where(
            GroupMembership.user_id == user_id,
            GroupMembership.group_id == group_id,
        )
    )
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Join the group first", "code": "NOT_A_MEMBER"},
        )
    return membership


def _post_out(post: Post) -> PostOut:
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


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(body: GroupCreate, user: CurrentUser, db: DbSession) -> GroupOut:
    slug = _unique_slug(db, _slugify(body.name))
    group = Group(
        name=body.name.strip(),
        slug=slug,
        description=body.description,
        creator_id=user.id,
        group_type=body.group_type,
    )
    db.add(group)
    db.flush()
    db.add(GroupMembership(user_id=user.id, group_id=group.id, role="owner"))
    db.commit()
    db.refresh(group)
    return _group_out(db, group)


@router.get("", response_model=list[GroupOut])
def list_groups(db: DbSession, user: OptionalUser) -> list[GroupOut]:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Confirm you are 18+ and sign in to browse groups",
                "code": "AGE_GATE_REQUIRED",
            },
        )
    groups = db.scalars(select(Group).order_by(Group.created_at.desc())).all()
    return [_group_out(db, g) for g in groups]


@router.get("/{id_or_slug}", response_model=GroupOut)
def get_group(id_or_slug: str, db: DbSession, user: OptionalUser) -> GroupOut:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Confirm you are 18+ and sign in to view groups",
                "code": "AGE_GATE_REQUIRED",
            },
        )
    return _group_out(db, _resolve_group(db, id_or_slug))


@router.post("/{group_id}/join", response_model=GroupOut)
def join_group(group_id: int, user: CurrentUser, db: DbSession) -> GroupOut:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Group not found", "code": "NOT_FOUND"},
        )
    existing = db.scalar(
        select(GroupMembership).where(
            GroupMembership.user_id == user.id,
            GroupMembership.group_id == group_id,
        )
    )
    if existing is None:
        db.add(GroupMembership(user_id=user.id, group_id=group_id, role="member"))
        db.commit()
    return _group_out(db, group)


@router.post("/{group_id}/leave", response_model=GroupOut)
def leave_group(group_id: int, user: CurrentUser, db: DbSession) -> GroupOut:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Group not found", "code": "NOT_FOUND"},
        )
    membership = db.scalar(
        select(GroupMembership).where(
            GroupMembership.user_id == user.id,
            GroupMembership.group_id == group_id,
        )
    )
    if membership is not None:
        db.delete(membership)
        db.commit()
    return _group_out(db, group)


@router.get("/{group_id}/posts", response_model=list[PostOut])
def group_posts(
    group_id: int,
    db: DbSession,
    user: OptionalUser,
    limit: int = 50,
    offset: int = 0,
) -> list[PostOut]:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Confirm you are 18+ and sign in to view group posts",
                "code": "AGE_GATE_REQUIRED",
            },
        )
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Group not found", "code": "NOT_FOUND"},
        )
    posts = db.scalars(
        select(Post)
        .options(joinedload(Post.author))
        .where(Post.group_id == group_id, Post.hidden.is_(False), Post.topic_id.is_(None))
        .order_by(Post.created_at.desc())
        .limit(min(limit, 100))
        .offset(max(offset, 0))
    ).unique().all()
    return [_post_out(p) for p in posts]


@router.post(
    "/{group_id}/topics",
    response_model=TopicOut,
    status_code=status.HTTP_201_CREATED,
)
def create_topic(
    group_id: int, body: TopicCreate, user: CurrentUser, db: DbSession
) -> TopicOut:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Group not found", "code": "NOT_FOUND"},
        )
    _require_member(db, user.id, group_id)
    topic = Topic(
        group_id=group_id,
        author_id=user.id,
        title=body.title.strip(),
        pinned=False,
        locked=False,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return TopicOut.model_validate(topic)


@router.get("/{group_id}/topics", response_model=list[TopicOut])
def list_topics(
    group_id: int,
    db: DbSession,
    user: OptionalUser,
    limit: int = 50,
    offset: int = 0,
) -> list[TopicOut]:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Confirm you are 18+ and sign in to view topics",
                "code": "AGE_GATE_REQUIRED",
            },
        )
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Group not found", "code": "NOT_FOUND"},
        )
    topics = db.scalars(
        select(Topic)
        .where(Topic.group_id == group_id)
        .order_by(Topic.pinned.desc(), Topic.created_at.desc())
        .limit(min(limit, 100))
        .offset(max(offset, 0))
    ).all()
    return [TopicOut.model_validate(t) for t in topics]


@topics_router.get("/{topic_id}", response_model=TopicOut)
def get_topic(topic_id: int, db: DbSession, user: OptionalUser) -> TopicOut:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Confirm you are 18+ and sign in to view topics",
                "code": "AGE_GATE_REQUIRED",
            },
        )
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Topic not found", "code": "NOT_FOUND"},
        )
    return TopicOut.model_validate(topic)


@topics_router.post(
    "/{topic_id}/posts",
    response_model=PostOut,
    status_code=status.HTTP_201_CREATED,
)
def create_topic_post(
    topic_id: int, body: TopicPostCreate, user: CurrentUser, db: DbSession
) -> PostOut:
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
    _require_member(db, user.id, topic.group_id)
    post = Post(
        author_id=user.id,
        group_id=topic.group_id,
        topic_id=topic.id,
        body=body.body.strip(),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post = db.scalar(
        select(Post).options(joinedload(Post.author)).where(Post.id == post.id)
    )
    assert post is not None
    return _post_out(post)


@topics_router.get("/{topic_id}/posts", response_model=list[PostOut])
def list_topic_posts(
    topic_id: int,
    db: DbSession,
    user: OptionalUser,
    limit: int = 50,
    offset: int = 0,
) -> list[PostOut]:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Confirm you are 18+ and sign in to view topic posts",
                "code": "AGE_GATE_REQUIRED",
            },
        )
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Topic not found", "code": "NOT_FOUND"},
        )
    posts = db.scalars(
        select(Post)
        .options(joinedload(Post.author))
        .where(Post.topic_id == topic_id, Post.hidden.is_(False))
        .order_by(Post.created_at.asc())
        .limit(min(limit, 100))
        .offset(max(offset, 0))
    ).unique().all()
    return [_post_out(p) for p in posts]
