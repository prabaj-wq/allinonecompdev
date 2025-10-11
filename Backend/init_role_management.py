"""Role management schema initialisation helper.

Run this script to apply the role management schema to the primary
`epm_tool` database. Demo data seeding is disabled by default to keep
production environments clean. Set ROLE_MGMT_SEED_DATA=true if you
explicitly want to insert sample data for manual testing.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Iterable

import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA_PATH = Path(__file__).parent / "database" / "role_management_schema.sql"


def _log(level: str, message: str) -> None:
    print(f"[{level}] {message}")


def log_info(message: str) -> None:
    _log("INFO", message)


def log_success(message: str) -> None:
    _log("SUCCESS", message)


def log_warning(message: str) -> None:
    _log("WARN", message)


def log_error(message: str) -> None:
    _log("ERROR", message)


def get_db_connection() -> psycopg2.extensions.connection:
    """Create a PostgreSQL connection using standard environment variables."""
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", 5432)),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "epm_password"),
        database=os.getenv("POSTGRES_DB", "epm_tool"),
    )


def execute_sql_file(cursor: psycopg2.extensions.cursor, sql_path: Path) -> None:
    """Execute the full SQL script contained in `sql_path`."""
    if not sql_path.exists():
        raise FileNotFoundError(f"Schema file not found: {sql_path}")

    sql_text = sql_path.read_text(encoding="utf-8")
    cursor.execute(sql_text)


def initialize_role_management_schema() -> bool:
    """Apply the latest role management schema to the database."""
    log_info("Applying role management database schema...")
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        execute_sql_file(cursor, SCHEMA_PATH)
        conn.commit()
        log_success("Schema applied successfully.")
        return True
    except Exception as exc:
        if conn:
            conn.rollback()
        log_error(f"Schema initialization failed: {exc}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def _table_exists(cursor: psycopg2.extensions.cursor, table_name: str) -> bool:
    cursor.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = %s
        )
        """,
        (table_name,),
    )
    return bool(cursor.fetchone()[0])


def verify_installation() -> bool:
    """Confirm that all required tables exist."""
    required_tables: Iterable[str] = (
        "custom_roles",
        "role_permissions_detailed",
        "user_profiles",
        "role_management_audit_logs",
        "access_requests",
        "system_integrations",
    )

    log_info("Verifying role management tables...")
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        missing: list[str] = []
        for table in required_tables:
            exists = _table_exists(cursor, table)
            status = "present" if exists else "missing"
            log_info(f" - {table}: {status}")
            if not exists:
                missing.append(table)

        if missing:
            log_warning(
                "Verification completed with missing tables: "
                + ", ".join(missing)
            )
            return False

        log_success("Verification complete. All required tables are present.")
        return True
    except Exception as exc:
        log_error(f"Verification failed: {exc}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def seed_sample_data() -> bool:
    """Insert optional sample data for manual testing."""
    log_info("Seeding sample role management data (ROLE_MGMT_SEED_DATA enabled)...")
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        sample_page_permissions = {
            "/rolemanagement/user-access-dashboard": True,
            "/rolemanagement/role-profile-management": True,
        }
        sample_database_permissions = {
            "epm_tool": {"read": True, "write": False, "execute": False, "admin": False}
        }

        cursor.execute(
            """
            INSERT INTO custom_roles (
                name,
                description,
                company_id,
                page_permissions,
                database_permissions,
                risk_level,
                created_by
            )
            VALUES (%s, %s, %s, %s::jsonb, %s::jsonb, %s, %s)
            ON CONFLICT (name, company_id) DO NOTHING
            """,
            (
                "Sample Administrator",
                "Example role created for testing. Remove ROLE_MGMT_SEED_DATA to disable.",
                "Default Company",
                json.dumps(sample_page_permissions),
                json.dumps(sample_database_permissions),
                "medium",
                "system",
            ),
        )

        conn.commit()
        log_success("Sample role inserted successfully.")
        return True
    except Exception as exc:
        if conn:
            conn.rollback()
        log_error(f"Sample data seeding failed: {exc}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def main() -> bool:
    print("=" * 60)
    print("ROLE MANAGEMENT SETUP")
    print("=" * 60)

    if not initialize_role_management_schema():
        return False

    seed_requested = os.getenv("ROLE_MGMT_SEED_DATA", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    if seed_requested:
        if not seed_sample_data():
            return False
    else:
        log_info("Sample data seeding skipped (ROLE_MGMT_SEED_DATA not enabled).")

    verify_installation()

    print("=" * 60)
    log_success("Role management setup complete.")
    print("=" * 60)
    return True


if __name__ == "__main__":
    main()
