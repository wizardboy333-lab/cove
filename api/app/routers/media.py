"""Image upload + serve (MVP local disk; Render ephemeral)."""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select

from app.auth import CurrentUser, DbSession
from app.config import get_settings
from app.models import Media, Writing
from app.schemas import MediaOut
from app.social_helpers import is_blocked_either_way

router = APIRouter(prefix="/api/media", tags=["media"])

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_BYTES = 8 * 1024 * 1024  # 8 MiB


def _media_root() -> Path:
    settings = get_settings()
    root = Path(settings.media_root)
    if not root.is_absolute():
        # api/ cwd when running uvicorn from api/
        root = Path.cwd() / root
    root.mkdir(parents=True, exist_ok=True)
    return root


def _out(m: Media) -> MediaOut:
    return MediaOut(
        id=m.id,
        owner_id=m.owner_id,
        content_type=m.content_type,
        original_filename=m.original_filename,
        nsfw=m.nsfw,
        blurhash=m.blurhash,
        writing_id=m.writing_id,
        is_avatar=m.is_avatar,
        created_at=m.created_at,
        url=f"/api/media/{m.id}/file",
    )


@router.post("/upload", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
async def upload_media(
    user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
    nsfw: bool = Form(default=True),
    writing_id: int | None = Form(default=None),
    is_avatar: bool = Form(default=False),
) -> MediaOut:
    ctype = (file.content_type or "").lower().split(";")[0].strip()
    if ctype not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "Only image/jpeg, image/png, image/webp, image/gif allowed",
                "code": "UNSUPPORTED_MEDIA",
            },
        )
    if writing_id is not None:
        writing = db.get(Writing, writing_id)
        if writing is None or writing.author_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"detail": "Writing not found", "code": "NOT_FOUND"},
            )

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "File too large (max 8MB)", "code": "FILE_TOO_LARGE"},
        )
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Empty file", "code": "EMPTY_FILE"},
        )

    ext = ALLOWED_TYPES[ctype]
    key = f"{user.id}/{uuid.uuid4().hex}{ext}"
    dest = _media_root() / key
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)

    if is_avatar:
        # clear previous avatar flags for this user
        prev = db.scalars(
            select(Media).where(Media.owner_id == user.id, Media.is_avatar.is_(True))
        ).all()
        for m in prev:
            m.is_avatar = False
        # also set user.avatar_url to API path after flush
    media = Media(
        owner_id=user.id,
        storage_key=key,
        content_type=ctype,
        original_filename=(file.filename or "")[:255] or None,
        nsfw=bool(nsfw),
        blurhash=None,  # stub — client uses CSS blur
        writing_id=writing_id,
        is_avatar=bool(is_avatar),
    )
    db.add(media)
    db.flush()
    if is_avatar:
        user.avatar_url = f"/api/media/{media.id}/file"
        db.add(user)
    db.commit()
    db.refresh(media)
    return _out(media)



@router.get("/writing/{writing_id}", response_model=list[MediaOut])
def list_writing_media(
    writing_id: int, user: CurrentUser, db: DbSession
) -> list[MediaOut]:
    writing = db.get(Writing, writing_id)
    if writing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Writing not found", "code": "NOT_FOUND"},
        )
    if is_blocked_either_way(db, user.id, writing.author_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Writing not found", "code": "NOT_FOUND"},
        )
    rows = db.scalars(
        select(Media)
        .where(Media.writing_id == writing_id)
        .order_by(Media.created_at.asc())
    ).all()
    return [_out(m) for m in rows]


@router.get("/{media_id}", response_model=MediaOut)
def get_media(media_id: int, user: CurrentUser, db: DbSession) -> MediaOut:
    media = db.get(Media, media_id)
    if media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Media not found", "code": "NOT_FOUND"},
        )
    if is_blocked_either_way(db, user.id, media.owner_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Media not found", "code": "NOT_FOUND"},
        )
    return _out(media)


@router.get("/{media_id}/file")
def get_media_file(media_id: int, user: CurrentUser, db: DbSession):
    media = db.get(Media, media_id)
    if media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Media not found", "code": "NOT_FOUND"},
        )
    if is_blocked_either_way(db, user.id, media.owner_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Media not found", "code": "NOT_FOUND"},
        )
    path = _media_root() / media.storage_key
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "File missing on disk", "code": "FILE_MISSING"},
        )
    return FileResponse(
        path,
        media_type=media.content_type,
        filename=media.original_filename or path.name,
    )


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(media_id: int, user: CurrentUser, db: DbSession) -> None:
    media = db.get(Media, media_id)
    if media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Media not found", "code": "NOT_FOUND"},
        )
    if media.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Not your media", "code": "FORBIDDEN"},
        )
    path = _media_root() / media.storage_key
    if media.is_avatar and user.avatar_url and str(media.id) in (user.avatar_url or ""):
        user.avatar_url = None
        db.add(user)
    db.delete(media)
    db.commit()
    if path.is_file():
        try:
            path.unlink()
        except OSError:
            pass
    return None


