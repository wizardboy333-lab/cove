"""Application settings — env-driven, Postgres-ready via DATABASE_URL."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite:///./cove.db"
    secret_key: str = "cove-mvp-dev-secret-change-in-production-please"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # V1 locked product / legal flags
    jurisdiction: str = "US"
    tos_version: str = "2026-09-22"
    require_invite: bool = False  # open registration — invite-only beta removed
    age_vendor_enabled: bool = False  # feature flag; stub endpoint only
    locale: str = "en-US"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
