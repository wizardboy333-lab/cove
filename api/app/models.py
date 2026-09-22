"""SQLAlchemy models for Cove MVP (V1 locked decisions)."""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TargetType(str, enum.Enum):
    post = "post"
    user = "user"
    group = "group"
    writing = "writing"
    topic = "topic"


class ReportStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"
    dismissed = "dismissed"


class FriendshipStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class WritingVisibility(str, enum.Enum):
    public = "public"
    friends = "friends"
    private = "private"


class MembershipRole(str, enum.Enum):
    member = "member"
    mod = "mod"
    owner = "owner"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Age gate — never store full DOB
    is_18_plus: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    age_attested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    age_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verification_vendor_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    birth_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    accepted_tos_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    jurisdiction: Mapped[str] = mapped_column(String(8), default="US", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    posts: Mapped[list[Post]] = relationship("Post", back_populates="author")
    memberships: Mapped[list[GroupMembership]] = relationship(
        "GroupMembership", back_populates="user"
    )
    created_groups: Mapped[list[Group]] = relationship("Group", back_populates="creator")
    writings: Mapped[list[Writing]] = relationship("Writing", back_populates="author")


class InviteCode(Base):
    __tablename__ = "invite_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    created_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    max_uses: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    use_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    redemptions: Mapped[list[InviteRedemption]] = relationship(
        "InviteRedemption", back_populates="invite_code"
    )


class InviteRedemption(Base):
    __tablename__ = "invite_redemptions"
    __table_args__ = (UniqueConstraint("invite_code_id", "user_id", name="uq_invite_redeem"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    invite_code_id: Mapped[int] = mapped_column(
        ForeignKey("invite_codes.id"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    redeemed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    invite_code: Mapped[InviteCode] = relationship("InviteCode", back_populates="redemptions")


class Friendship(Base):
    __tablename__ = "friendships"
    __table_args__ = (
        UniqueConstraint("requester_id", "addressee_id", name="uq_friendship_pair"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    requester_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    addressee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[FriendshipStatus] = mapped_column(
        Enum(FriendshipStatus, name="friendship_status"),
        default=FriendshipStatus.pending,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_follow"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    following_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Block(Base):
    __tablename__ = "blocks"
    __table_args__ = (UniqueConstraint("blocker_id", "blocked_id", name="uq_block"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    blocker_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    blocked_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Mute(Base):
    __tablename__ = "mutes"
    __table_args__ = (UniqueConstraint("muter_id", "muted_id", name="uq_mute"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    muter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    muted_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    group_type: Mapped[str | None] = mapped_column(String(32), nullable=True)  # topic|local
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    creator: Mapped[User] = relationship("User", back_populates="created_groups")
    memberships: Mapped[list[GroupMembership]] = relationship(
        "GroupMembership", back_populates="group", cascade="all, delete-orphan"
    )
    posts: Mapped[list[Post]] = relationship("Post", back_populates="group")
    topics: Mapped[list[Topic]] = relationship("Topic", back_populates="group")


class GroupMembership(Base):
    __tablename__ = "group_memberships"
    __table_args__ = (UniqueConstraint("user_id", "group_id", name="uq_membership"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(16), default="member", nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User", back_populates="memberships")
    group: Mapped[Group] = relationship("Group", back_populates="memberships")


class Topic(Base):
    """Thread inside a group."""

    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False, index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    group: Mapped[Group] = relationship("Group", back_populates="topics")
    posts: Mapped[list[Post]] = relationship("Post", back_populates="topic")


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("groups.id"), nullable=True, index=True
    )
    topic_id: Mapped[int | None] = mapped_column(
        ForeignKey("topics.id"), nullable=True, index=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    report_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    author: Mapped[User] = relationship("User", back_populates="posts")
    group: Mapped[Group | None] = relationship("Group", back_populates="posts")
    topic: Mapped[Topic | None] = relationship("Topic", back_populates="posts")


class Writing(Base):
    __tablename__ = "writings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    visibility: Mapped[WritingVisibility] = mapped_column(
        Enum(WritingVisibility, name="writing_visibility"),
        default=WritingVisibility.public,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    author: Mapped[User] = relationship("User", back_populates="writings")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    target_type: Mapped[TargetType] = mapped_column(
        Enum(TargetType, name="target_type"), nullable=False
    )
    target_id: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"),
        default=ReportStatus.open,
        nullable=False,
    )


class PlaceMode(str, enum.Enum):
    metro = "metro"
    virtual = "virtual"


class AttendeeListVisibility(str, enum.Enum):
    public = "public"
    going_only = "going_only"
    host_only = "host_only"


class RsvpStatus(str, enum.Enum):
    going = "going"
    interested = "interested"
    declined = "declined"


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="America/New_York", nullable=False)
    place_mode: Mapped[PlaceMode] = mapped_column(
        Enum(PlaceMode, name="place_mode"),
        nullable=False,
    )
    metro_area: Mapped[str | None] = mapped_column(String(120), nullable=True)
    virtual_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    attendee_list_visibility: Mapped[AttendeeListVisibility] = mapped_column(
        Enum(AttendeeListVisibility, name="attendee_list_visibility"),
        default=AttendeeListVisibility.going_only,
        nullable=False,
    )
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cancelled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    host: Mapped[User] = relationship("User", foreign_keys=[host_id])
    rsvps: Mapped[list[Rsvp]] = relationship(
        "Rsvp", back_populates="event", cascade="all, delete-orphan"
    )


class Rsvp(Base):
    __tablename__ = "rsvps"
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_rsvp_event_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[RsvpStatus] = mapped_column(
        Enum(RsvpStatus, name="rsvp_status"),
        nullable=False,
    )
    show_on_list: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    event: Mapped[Event] = relationship("Event", back_populates="rsvps")
    user: Mapped[User] = relationship("User", foreign_keys=[user_id])


class KinkStance(str, enum.Enum):
    into = "into"
    curious = "curious"
    limit = "limit"


class KinkTag(Base):
    __tablename__ = "kink_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("kink_tags.id"), nullable=True, index=True
    )
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)

    parent: Mapped[KinkTag | None] = relationship(
        "KinkTag", remote_side="KinkTag.id", back_populates="children"
    )
    children: Mapped[list[KinkTag]] = relationship("KinkTag", back_populates="parent")


class UserKink(Base):
    __tablename__ = "user_kinks"
    __table_args__ = (UniqueConstraint("user_id", "kink_id", name="uq_user_kink"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    kink_id: Mapped[int] = mapped_column(ForeignKey("kink_tags.id"), nullable=False, index=True)
    stance: Mapped[KinkStance] = mapped_column(
        Enum(KinkStance, name="kink_stance"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    kink: Mapped[KinkTag] = relationship("KinkTag")
    user: Mapped[User] = relationship("User", foreign_keys=[user_id])
