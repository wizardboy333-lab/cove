"""Pydantic v2 request/response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ── Auth ──────────────────────────────────────────────────────────────────────


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)
    age_attestation: bool
    is_18_plus: bool
    invite_code: str = Field(default="", max_length=64)
    birth_year: int | None = Field(default=None, ge=1900, le=2100)
    accepted_tos: bool = True

    @field_validator("age_attestation")
    @classmethod
    def must_attest(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("age_attestation must be true — Cove is 18+ only")
        return v

    @field_validator("is_18_plus")
    @classmethod
    def must_be_18(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("is_18_plus must be true — Cove is 18+ only")
        return v

    @field_validator("accepted_tos")
    @classmethod
    def must_accept_tos(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("accepted_tos must be true")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    display_name: str
    bio: str | None = None
    avatar_url: str | None = None
    is_private: bool
    birth_year: int | None = None
    created_at: datetime


class UserLimited(BaseModel):
    """Returned when profile is private and viewer lacks access."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    display_name: str
    is_private: Literal[True] = True
    limited: Literal[True] = True


class UserMe(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    display_name: str
    bio: str | None = None
    avatar_url: str | None = None
    is_private: bool
    is_18_plus: bool
    age_attested_at: datetime
    age_verified_at: datetime | None = None
    verification_vendor_id: str | None = None
    birth_year: int | None = None
    accepted_tos_at: datetime | None = None
    jurisdiction: str
    created_at: datetime
    is_active: bool
    is_admin: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserMe


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    bio: str | None = Field(default=None, max_length=2000)
    avatar_url: str | None = Field(default=None, max_length=512)
    is_private: bool | None = None
    birth_year: int | None = Field(default=None, ge=1900, le=2100)


class PublicConfigOut(BaseModel):
    jurisdiction: str
    tos_version: str
    locale: str
    require_invite: bool
    age_vendor_enabled: bool


class AgeVendorStartOut(BaseModel):
    status: str
    vendor: str
    message: str


# ── Invites ───────────────────────────────────────────────────────────────────


class InviteCreate(BaseModel):
    code: str | None = Field(default=None, min_length=4, max_length=64)
    max_uses: int = Field(default=1, ge=1, le=100_000)
    expires_at: datetime | None = None
    note: str | None = Field(default=None, max_length=500)


class InviteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    created_by_user_id: int | None
    max_uses: int
    use_count: int
    expires_at: datetime | None
    created_at: datetime
    revoked: bool
    note: str | None = None


class InviteValidateOut(BaseModel):
    code: str
    redeemable: bool
    reason: str | None = None
    remaining_uses: int | None = None


# ── Posts ─────────────────────────────────────────────────────────────────────


class PostCreate(BaseModel):
    body: str = Field(min_length=1, max_length=10000)
    group_id: int | None = None
    topic_id: int | None = None


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_id: int
    group_id: int | None
    topic_id: int | None = None
    body: str
    created_at: datetime
    hidden: bool
    report_count: int
    author_display_name: str | None = None


class TopicPostCreate(BaseModel):
    body: str = Field(min_length=1, max_length=10000)


# ── Groups / topics ───────────────────────────────────────────────────────────


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    group_type: Literal["topic", "local"] | None = None


class GroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None
    creator_id: int
    group_type: str | None = None
    created_at: datetime
    member_count: int | None = None


class TopicCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)


class TopicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    group_id: int
    author_id: int
    title: str
    pinned: bool
    locked: bool
    created_at: datetime


# ── Social ────────────────────────────────────────────────────────────────────


class UserIdBody(BaseModel):
    user_id: int


class FriendshipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requester_id: int
    addressee_id: int
    status: str
    created_at: datetime
    other_user_id: int | None = None
    other_display_name: str | None = None


class FollowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    follower_id: int
    following_id: int
    created_at: datetime


class BlockOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    blocker_id: int
    blocked_id: int
    created_at: datetime


class MuteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    muter_id: int
    muted_id: int
    created_at: datetime


class MessageOut(BaseModel):
    detail: str
    code: str | None = None


# ── Writings ──────────────────────────────────────────────────────────────────


class WritingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    body: str = Field(min_length=1, max_length=100000)
    visibility: Literal["public", "friends", "private"] = "public"


class WritingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    body: str | None = Field(default=None, min_length=1, max_length=100000)
    visibility: Literal["public", "friends", "private"] | None = None


class WritingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_id: int
    title: str
    body: str
    visibility: str
    created_at: datetime
    updated_at: datetime
    hidden: bool


# ── Moderation ────────────────────────────────────────────────────────────────


class ReportCreate(BaseModel):
    target_type: Literal["post", "user", "group", "writing", "topic"]
    target_id: int
    reason: str = Field(min_length=1, max_length=2000)


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reporter_id: int
    target_type: str
    target_id: int
    reason: str
    created_at: datetime
    status: str


class ErrorOut(BaseModel):
    detail: str
    code: str


# ── Events ────────────────────────────────────────────────────────────────────


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=10000)
    starts_at: datetime
    ends_at: datetime | None = None
    timezone: str = Field(default="America/New_York", min_length=1, max_length=64)
    place_mode: str = Field(min_length=1, max_length=32)
    metro_area: str | None = Field(default=None, max_length=120)
    virtual_url: str | None = Field(default=None, max_length=512)
    attendee_list_visibility: Literal["public", "going_only", "host_only"] = "going_only"
    capacity: int | None = Field(default=None, ge=1, le=100_000)


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=10000)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    timezone: str | None = Field(default=None, min_length=1, max_length=64)
    place_mode: str | None = Field(default=None, min_length=1, max_length=32)
    metro_area: str | None = Field(default=None, max_length=120)
    virtual_url: str | None = Field(default=None, max_length=512)
    attendee_list_visibility: Literal["public", "going_only", "host_only"] | None = None
    capacity: int | None = Field(default=None, ge=1, le=100_000)


class RsvpOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    user_id: int
    status: str
    show_on_list: bool
    created_at: datetime


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    host_id: int
    host_display_name: str | None = None
    title: str
    description: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    timezone: str
    place_mode: str
    metro_area: str | None = None
    virtual_url: str | None = None
    attendee_list_visibility: str
    capacity: int | None = None
    cancelled: bool
    created_at: datetime
    going_count: int | None = None
    my_rsvp: RsvpOut | None = None


class RsvpUpsert(BaseModel):
    status: Literal["going", "interested", "declined"]
    show_on_list: bool | None = True


class AttendeeOut(BaseModel):
    user_id: int
    display_name: str
    status: str


# ── Kinks ─────────────────────────────────────────────────────────────────────


class KinkTagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    parent_id: int | None = None
    category: str | None = None


class UserKinkOut(BaseModel):
    kink_id: int
    slug: str
    name: str
    category: str | None = None
    stance: str
    parent_id: int | None = None


class UserKinkItem(BaseModel):
    kink_id: int
    stance: Literal["into", "curious", "limit"]


class UserKinksPut(BaseModel):
    kinks: list[UserKinkItem] = Field(default_factory=list, max_length=200)


# ── Media ─────────────────────────────────────────────────────────────────────


class MediaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    content_type: str
    original_filename: str | None = None
    nsfw: bool = True
    blurhash: str | None = None
    writing_id: int | None = None
    is_avatar: bool = False
    created_at: datetime
    url: str | None = None  # /api/media/{id}/file


# ── DMs ───────────────────────────────────────────────────────────────────────


class DmConversationCreate(BaseModel):
    user_id: int


class DmConversationOut(BaseModel):
    id: int
    other_user_id: int
    other_display_name: str
    created_at: datetime
    last_message_preview: str | None = None
    last_message_at: datetime | None = None


class DmMessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class DmMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: int
    body: str
    created_at: datetime
