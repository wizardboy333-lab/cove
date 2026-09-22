"""Profile routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.auth import CurrentUser, DbSession, OptionalUser, birth_year_implies_under_18
from app.models import GroupMembership, User
from app.schemas import ProfileUpdate, UserLimited, UserMe, UserPublic
from app.social_helpers import are_friends, is_blocked_either_way

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def _shares_group(db: DbSession, a: int, b: int) -> bool:
    a_groups = set(
        db.scalars(select(GroupMembership.group_id).where(GroupMembership.user_id == a)).all()
    )
    if not a_groups:
        return False
    b_groups = set(
        db.scalars(select(GroupMembership.group_id).where(GroupMembership.user_id == b)).all()
    )
    return bool(a_groups & b_groups)


@router.get("/{user_id}")
def get_profile(
    user_id: int,
    db: DbSession,
    viewer: OptionalUser,
) -> UserPublic | UserLimited:
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found", "code": "NOT_FOUND"},
        )

    if viewer is not None and is_blocked_either_way(db, viewer.id, user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "User not found", "code": "NOT_FOUND"},
        )

    if not user.is_private:
        return UserPublic.model_validate(user)

    if viewer is not None and viewer.id == user.id:
        return UserPublic.model_validate(user)

    if viewer is not None and (
        _shares_group(db, viewer.id, user.id) or are_friends(db, viewer.id, user.id)
    ):
        return UserPublic.model_validate(user)

    if viewer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Sign in and confirm you are 18+ to view private profiles",
                "code": "AGE_GATE_REQUIRED",
            },
        )

    return UserLimited(id=user.id, display_name=user.display_name, is_private=True, limited=True)


@router.patch("/me", response_model=UserMe)
def update_me(body: ProfileUpdate, user: CurrentUser, db: DbSession) -> UserMe:
    data = body.model_dump(exclude_unset=True)
    if "birth_year" in data and data["birth_year"] is not None:
        if birth_year_implies_under_18(data["birth_year"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "detail": "birth_year implies under 18 — Cove is 18+ only",
                    "code": "AGE_GATE_REQUIRED",
                },
            )
    for key, value in data.items():
        setattr(user, key, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserMe.model_validate(user)
