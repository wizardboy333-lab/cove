"""Password hashing, JWT create/verify, FastAPI auth dependencies."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail={"detail": "Could not validate credentials", "code": "AUTH_REQUIRED"},
    headers={"WWW-Authenticate": "Bearer"},
)

AGE_GATE_EXCEPTION = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail={"detail": "Age gate required — Cove is 18+ only", "code": "AGE_GATE_REQUIRED"},
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str | int, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> str:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        sub = payload.get("sub")
        if sub is None:
            raise CREDENTIALS_EXCEPTION
        return str(sub)
    except JWTError as exc:
        raise CREDENTIALS_EXCEPTION from exc


def birth_year_implies_under_18(birth_year: int, today: date | None = None) -> bool:
    """
    Conservative check using year only (no full DOB stored).
    If current year - birth_year < 18, user is clearly under 18.
    """
    today = today or date.today()
    return (today.year - birth_year) < 18


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise CREDENTIALS_EXCEPTION
    user_id = decode_token(credentials.credentials)
    user = db.get(User, int(user_id))
    if user is None or not user.is_active:
        raise CREDENTIALS_EXCEPTION
    return user


def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User | None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    try:
        user_id = decode_token(credentials.credentials)
    except HTTPException:
        return None
    user = db.get(User, int(user_id))
    if user is None or not user.is_active:
        return None
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]
DbSession = Annotated[Session, Depends(get_db)]
