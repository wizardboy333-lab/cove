"""Public meta / config endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings
from app.schemas import PublicConfigOut

router = APIRouter(tags=["meta"])


@router.get("/api/config/public", response_model=PublicConfigOut)
def public_config() -> PublicConfigOut:
    settings = get_settings()
    return PublicConfigOut(
        jurisdiction=settings.jurisdiction,
        tos_version=settings.tos_version,
        locale=settings.locale,
        require_invite=settings.require_invite,
        age_vendor_enabled=settings.age_vendor_enabled,
    )
