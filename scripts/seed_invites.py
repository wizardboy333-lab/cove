#!/usr/bin/env python3
"""
Seed invite codes for Cove invite-only beta.

Usage (from api/ with venv active):
  python scripts/seed_invites.py
  python scripts/seed_invites.py --count 50 --prefix COVE-BETA --max-uses 1

If the invite_codes table does not exist yet, prints the expected schema and exits 1.
Does not invent migrations — Diva owns models; this only inserts once the table is present.
"""

from __future__ import annotations

import argparse
import secrets
import string
import sys
from pathlib import Path

# Allow `python scripts/seed_invites.py` from api/
API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))


EXPECTED_SCHEMA = """
Expected schema (matches docs/INVITE_FLOW.md + app.models.InviteCode):

  invite_codes
    id                  INTEGER PK
    code                VARCHAR(64) UNIQUE NOT NULL
    created_by_user_id  INTEGER NULL  REFERENCES users(id)
    max_uses            INTEGER NOT NULL DEFAULT 1   -- max_redemptions
    use_count           INTEGER NOT NULL DEFAULT 0
    expires_at          DATETIME NULL
    created_at          DATETIME NOT NULL
    revoked             BOOLEAN NOT NULL DEFAULT 0
    note                TEXT NULL                 -- optional; add if missing

  invite_redemptions
    id                  INTEGER PK
    invite_code_id      INTEGER NOT NULL REFERENCES invite_codes(id)
    user_id             INTEGER NOT NULL REFERENCES users(id)
    redeemed_at         DATETIME NOT NULL
    UNIQUE (invite_code_id, user_id)

Create tables via app startup (Base.metadata.create_all) or migration, then re-run.
""".strip()


def _table_exists(conn, name: str) -> bool:
    dialect = conn.dialect.name
    if dialect == "sqlite":
        row = conn.exec_driver_sql(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
            (name,),
        ).fetchone()
        return row is not None
    # Postgres / others
    row = conn.exec_driver_sql(
        "SELECT 1 FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_name = %s",
        (name,),
    ).fetchone()
    return row is not None


def _columns(conn, table: str) -> set[str]:
    dialect = conn.dialect.name
    if dialect == "sqlite":
        rows = conn.exec_driver_sql(f"PRAGMA table_info({table})").fetchall()
        # cid, name, type, notnull, dflt_value, pk
        return {r[1] for r in rows}
    rows = conn.exec_driver_sql(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_schema = 'public' AND table_name = %s",
        (table,),
    ).fetchall()
    return {r[0] for r in rows}


def _gen_code(prefix: str, n: int, width: int = 4) -> str:
    return f"{prefix}-{n:0{width}d}"


def _random_suffix(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed Cove beta invite codes")
    parser.add_argument("--count", type=int, default=50, help="How many codes (default 50)")
    parser.add_argument("--prefix", type=str, default="COVE-BETA", help="Code prefix")
    parser.add_argument("--max-uses", type=int, default=1, help="max_uses / max_redemptions")
    parser.add_argument(
        "--note",
        type=str,
        default="beta cohort seed",
        help="Admin note (stored only if column exists)",
    )
    parser.add_argument(
        "--out",
        type=str,
        default="",
        help="Optional path to write minted codes (one per line)",
    )
    args = parser.parse_args()

    if args.count < 1:
        print("ERROR: --count must be >= 1", file=sys.stderr)
        return 1

    try:
        from sqlalchemy import create_engine, text
        from app.config import get_settings
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: could not import app config / sqlalchemy: {exc}", file=sys.stderr)
        print("Run from api/ with venv active: pip install -r requirements.txt", file=sys.stderr)
        return 1

    settings = get_settings()
    engine = create_engine(settings.database_url)

    with engine.begin() as conn:
        if not _table_exists(conn, "invite_codes"):
            print("ERROR: table invite_codes does not exist yet.")
            print()
            print(EXPECTED_SCHEMA)
            print()
            print("Start the API once (uvicorn app.main:app) so create_all runs,")
            print("or apply Diva's migration, then re-run this script.")
            return 1

        cols = _columns(conn, "invite_codes")
        required = {"code", "max_uses", "use_count"}
        missing = required - cols
        if missing:
            print(f"ERROR: invite_codes missing columns: {sorted(missing)}")
            print()
            print(EXPECTED_SCHEMA)
            return 1

        has_note = "note" in cols
        has_revoked = "revoked" in cols
        minted: list[str] = []
        skipped = 0

        for i in range(1, args.count + 1):
            code = _gen_code(args.prefix.upper().rstrip("-"), i)
            exists = conn.execute(
                text("SELECT 1 FROM invite_codes WHERE upper(code) = :c"),
                {"c": code.upper()},
            ).fetchone()
            if exists:
                # Collision: try random variant once
                alt = f"{code}-{_random_suffix(4)}"
                exists_alt = conn.execute(
                    text("SELECT 1 FROM invite_codes WHERE upper(code) = :c"),
                    {"c": alt.upper()},
                ).fetchone()
                if exists_alt:
                    skipped += 1
                    continue
                code = alt

            fields = ["code", "max_uses", "use_count"]
            values = [":code", ":max_uses", "0"]
            params: dict = {"code": code.upper(), "max_uses": args.max_uses}

            if has_revoked:
                fields.append("revoked")
                values.append("0" if engine.dialect.name == "sqlite" else "false")

            if has_note:
                fields.append("note")
                values.append(":note")
                params["note"] = args.note

            sql = (
                f"INSERT INTO invite_codes ({', '.join(fields)}) "
                f"VALUES ({', '.join(values)})"
            )
            conn.execute(text(sql), params)
            minted.append(code.upper())

    print(f"Minted {len(minted)} invite code(s) (skipped {skipped}). max_uses={args.max_uses}")
    for c in minted:
        print(c)

    out_path = args.out.strip()
    if not out_path:
        out_path = str(Path(__file__).resolve().parent / "seed_invites.out.txt")
    Path(out_path).write_text("\n".join(minted) + ("\n" if minted else ""), encoding="utf-8")
    print(f"Wrote {out_path}")

    if not has_note:
        print(
            "NOTE: invite_codes.note column absent — codes inserted without note. "
            "See docs/INVITE_FLOW.md PATCH for Diva."
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
