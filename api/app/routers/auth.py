"""Auth routes: signup (invite + age, no DOB), login, logout, me, age-vendor stub."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func, select

from app.auth import (
    CurrentUser,
    DbSession,
    birth_year_implies_under_18,
    create_access_token,
    hash_password,
    verify_password,
)
from app.config import get_settings
from app.models import InviteCode, InviteRedemption, User
from app.schemas import (
    AgeVendorStartOut,
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserMe,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _invite_redeemable(invite: InviteCode | None) -> tuple[bool, str | None]:
    """Return (ok, error_code) using INVITE_FLOW codes."""
    if invite is None:
        return False, "INVITE_INVALID"
    if invite.revoked:
        return False, "INVITE_REVOKED"
    if invite.expires_at is not None:
        exp = invite.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            return False, "INVITE_EXPIRED"
    if invite.use_count >= invite.max_uses:
        return False, "INVITE_EXHAUSTED"
    return True, None


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, db: DbSession) -> TokenResponse:
    """
    Open registration signup. Never accepts or stores date_of_birth / full DOB.
    Persists is_18_plus, age_attested_at, optional birth_year only.
    invite_code is optional — blank succeeds when require_invite=false; if present, redeem when valid.
    """
    settings = get_settings()

    if not body.age_attestation or not body.is_18_plus:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "Age attestation required — Cove is 18+ only",
                "code": "AGE_GATE_REQUIRED",
            },
        )
    if not body.accepted_tos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "You must accept the Terms of Service", "code": "TOS_REQUIRED"},
        )
    if body.birth_year is not None and birth_year_implies_under_18(body.birth_year):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "detail": "birth_year implies under 18 — Cove is 18+ only",
                "code": "AGE_GATE_REQUIRED",
            },
        )

    invite: InviteCode | None = None
    raw = (body.invite_code or "").strip()
    if settings.require_invite and not raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Invite code is required", "code": "INVITE_REQUIRED"},
        )
    if raw:
        invite = db.scalar(select(InviteCode).where(InviteCode.code == raw.upper()))
        ok, reason = _invite_redeemable(invite)
        if not ok or invite is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "detail": "Invite code is not redeemable",
                    "code": reason or "INVITE_INVALID",
                },
            )

    existing = db.scalar(select(User).where(User.email == body.email.lower()))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "Email already registered", "code": "EMAIL_TAKEN"},
        )

    now = datetime.now(timezone.utc)
    user_count = db.scalar(select(func.count()).select_from(User)) or 0
    # MVP: first registered user becomes admin (founder)
    make_admin = user_count == 0

    user = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        display_name=body.display_name.strip(),
        is_18_plus=True,
        age_attested_at=now,
        age_verified_at=None,
        verification_vendor_id=None,
        birth_year=body.birth_year,
        accepted_tos_at=now,
        jurisdiction=settings.jurisdiction,
        is_active=True,
        is_private=False,
        is_admin=make_admin,
    )
    db.add(user)
    db.flush()

    if invite is not None:
        invite.use_count = int(invite.use_count or 0) + 1
        db.add(invite)
        db.add(
            InviteRedemption(
                invite_code_id=invite.id,
                user_id=user.id,
                redeemed_at=now,
            )
        )

    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, token_type="bearer", user=UserMe.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Invalid email or password", "code": "AUTH_REQUIRED"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Account disabled", "code": "ACCOUNT_DISABLED"},
        )
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, token_type="bearer", user=UserMe.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(_user: CurrentUser) -> Response:
    """MVP stub — client discards the Bearer token. No server-side blacklist yet."""
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserMe)
def me(user: CurrentUser) -> UserMe:
    return UserMe.model_validate(user)


@router.post("/age-vendor/start", response_model=AgeVendorStartOut)
def age_vendor_start(_user: CurrentUser) -> AgeVendorStartOut:
    """
    Vendor age-verification hook (stub). Feature-flagged via age_vendor_enabled.
    Does not collect or store full DOB — vendor would hold ID + DOB later.
    """
    settings = get_settings()
    if not settings.age_vendor_enabled:
        return AgeVendorStartOut(
            status="stub",
            vendor="none",
            message="Age vendor verification is disabled (feature flag). Attestation-only for MVP.",
        )
    return AgeVendorStartOut(
        status="stub",
        vendor="none",
        message="Age vendor enabled but no provider wired yet. Hook returns stub.",
    )
