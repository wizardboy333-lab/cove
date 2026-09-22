"""Writings with visibility enforcement."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.auth import CurrentUser, DbSession
from app.models import Writing, WritingVisibility
from app.schemas import WritingCreate, WritingOut, WritingUpdate
from app.social_helpers import are_friends, is_blocked_either_way

router = APIRouter(prefix="/api/writings", tags=["writings"])


def _can_view(db: DbSession, writing: Writing, viewer: CurrentUser) -> bool:
    if writing.hidden and writing.author_id != viewer.id:
        return False
    if writing.author_id == viewer.id:
        return True
    if is_blocked_either_way(db, viewer.id, writing.author_id):
        return False
    if writing.visibility == WritingVisibility.public:
        return True
    if writing.visibility == WritingVisibility.private:
        return False
    if writing.visibility == WritingVisibility.friends:
        return are_friends(db, viewer.id, writing.author_id)
    return False


@router.post("", response_model=WritingOut, status_code=status.HTTP_201_CREATED)
def create_writing(body: WritingCreate, user: CurrentUser, db: DbSession) -> WritingOut:
    writing = Writing(
        author_id=user.id,
        title=body.title.strip(),
        body=body.body,
        visibility=WritingVisibility(body.visibility),
        hidden=False,
    )
    db.add(writing)
    db.commit()
    db.refresh(writing)
    return WritingOut(
        id=writing.id,
        author_id=writing.author_id,
        title=writing.title,
        body=writing.body,
        visibility=writing.visibility.value,
        created_at=writing.created_at,
        updated_at=writing.updated_at,
        hidden=writing.hidden,
    )


@router.get("/me", response_model=list[WritingOut])
def my_writings(user: CurrentUser, db: DbSession) -> list[WritingOut]:
    rows = db.scalars(
        select(Writing)
        .where(Writing.author_id == user.id)
        .order_by(Writing.created_at.desc())
    ).all()
    return [
        WritingOut(
            id=w.id,
            author_id=w.author_id,
            title=w.title,
            body=w.body,
            visibility=w.visibility.value,
            created_at=w.created_at,
            updated_at=w.updated_at,
            hidden=w.hidden,
        )
        for w in rows
    ]


@router.get("/{writing_id}", response_model=WritingOut)
def get_writing(writing_id: int, user: CurrentUser, db: DbSession) -> WritingOut:
    writing = db.get(Writing, writing_id)
    if writing is None or not _can_view(db, writing, user):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Writing not found", "code": "NOT_FOUND"},
        )
    return WritingOut(
        id=writing.id,
        author_id=writing.author_id,
        title=writing.title,
        body=writing.body,
        visibility=writing.visibility.value,
        created_at=writing.created_at,
        updated_at=writing.updated_at,
        hidden=writing.hidden,
    )


@router.patch("/{writing_id}", response_model=WritingOut)
def update_writing(
    writing_id: int, body: WritingUpdate, user: CurrentUser, db: DbSession
) -> WritingOut:
    writing = db.get(Writing, writing_id)
    if writing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Writing not found", "code": "NOT_FOUND"},
        )
    if writing.author_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Only the author can edit", "code": "FORBIDDEN"},
        )
    data = body.model_dump(exclude_unset=True)
    if "visibility" in data and data["visibility"] is not None:
        writing.visibility = WritingVisibility(data.pop("visibility"))
    for key, value in data.items():
        setattr(writing, key, value)
    writing.updated_at = datetime.now(timezone.utc)
    db.add(writing)
    db.commit()
    db.refresh(writing)
    return WritingOut(
        id=writing.id,
        author_id=writing.author_id,
        title=writing.title,
        body=writing.body,
        visibility=writing.visibility.value,
        created_at=writing.created_at,
        updated_at=writing.updated_at,
        hidden=writing.hidden,
    )


@router.delete("/{writing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_writing(writing_id: int, user: CurrentUser, db: DbSession) -> Response:
    writing = db.get(Writing, writing_id)
    if writing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Writing not found", "code": "NOT_FOUND"},
        )
    if writing.author_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Only the author can delete", "code": "FORBIDDEN"},
        )
    db.delete(writing)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
