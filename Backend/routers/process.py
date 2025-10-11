from fastapi import (
    APIRouter,
    HTTPException,
    status,
    Query,
    Request,
    UploadFile,
    File,
    Form,
)
from typing import Optional, Dict, Any, List, Tuple
from pydantic import BaseModel, validator
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import json
import csv
import re
from datetime import datetime
from decimal import Decimal
from contextlib import contextmanager
from io import BytesIO, StringIO

try:
    import openpyxl  # type: ignore
except ImportError:  # pragma: no cover - handled gracefully at runtime
    openpyxl = None


router = APIRouter(prefix="/process", tags=["Data Processing"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def get_db_config() -> Dict[str, Any]:
    """Get database connection configuration."""
    host = os.getenv("POSTGRES_HOST", "postgres" if os.getenv("DOCKER_ENV") == "true" else "localhost")
    return {
        "host": host,
        "port": os.getenv("POSTGRES_PORT", "5432"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "epm_password"),
    }


def normalize_company_db_name(company_name: str) -> str:
    """Normalise the company name to match database naming rules."""
    if not company_name:
        return "default_company"
    sanitized = re.sub(r"[^a-z0-9_]", "_", company_name.lower().replace(" ", "_"))
    sanitized = sanitized.strip("_")
    return sanitized or "default_company"


@contextmanager
def company_connection(company_name: str):
    """Context manager that yields a connection to the company specific database."""
    db_name = normalize_company_db_name(company_name)
    try:
        conn = psycopg2.connect(database=db_name, **get_db_config())
    except psycopg2.OperationalError as exc:
        raise HTTPException(status_code=404, detail=f"Database for company '{company_name}' is not available: {exc}")
    try:
        yield conn
    finally:
        conn.close()


def ensure_tb_entries_schema(conn: psycopg2.extensions.connection) -> None:
    """Create tb_entries table and ensure required columns/indexes exist."""
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS tb_entries (
            id SERIAL PRIMARY KEY,
            account_code VARCHAR(255) NOT NULL,
            account_name VARCHAR(255) NOT NULL,
            entity_code VARCHAR(255),
            entity_name VARCHAR(255),
            period VARCHAR(50) NOT NULL,
            year VARCHAR(10) NOT NULL,
            debit_amount NUMERIC(18, 2) DEFAULT 0,
            credit_amount NUMERIC(18, 2) DEFAULT 0,
            balance_amount NUMERIC(18, 2) DEFAULT 0,
            currency VARCHAR(10),
            entry_category VARCHAR(100),
            counterparty VARCHAR(255),
            description TEXT,
            entry_type VARCHAR(20) DEFAULT 'debit',
            source VARCHAR(50) DEFAULT 'manual',
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    additional_columns = {
        "entity_name": "VARCHAR(255)",
        "currency": "VARCHAR(10)",
        "entry_category": "VARCHAR(100)",
        "counterparty": "VARCHAR(255)",
        "entry_type": "VARCHAR(20) DEFAULT 'debit'",
        "source": "VARCHAR(50) DEFAULT 'manual'",
        "created_by": "VARCHAR(255)",
        "updated_by": "VARCHAR(255)",
    }

    for column, definition in additional_columns.items():
        cur.execute(f"ALTER TABLE tb_entries ADD COLUMN IF NOT EXISTS {column} {definition}")

    cur.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_tb_entries_period_year
        ON tb_entries (period, year)
        """
    )

    conn.commit()
    cur.close()


def decimal_to_float(value: Optional[Decimal]) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def fetch_accounts(conn: psycopg2.extensions.connection, company_name: str) -> List[Dict[str, Any]]:
    """Fetch account metadata from axes_accounts."""
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT code, name, category, statement, account_type
            FROM axes_accounts
            WHERE company_id = %s
            ORDER BY code
            """,
            (company_name,),
        )
        rows = cur.fetchall()
        cur.close()
        return [
            {
                "code": row["code"],
                "name": row["name"],
                "label": f"{row['code']} · {row['name']}",
                "category": row.get("category"),
                "statement": row.get("statement"),
                "account_type": row.get("account_type"),
            }
            for row in rows
        ]
    except psycopg2.errors.UndefinedTable:
        return []


def fetch_entities(conn: psycopg2.extensions.connection, company_name: str) -> List[Dict[str, Any]]:
    """Fetch entity metadata from axes_entities."""
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT code, name, currency, entity_type, geography
            FROM axes_entities
            WHERE company_id = %s
            ORDER BY name
            """,
            (company_name,),
        )
        rows = cur.fetchall()
        cur.close()
        return [
            {
                "code": row["code"],
                "name": row["name"],
                "label": f"{row['code']} · {row['name']}",
                "currency": row.get("currency"),
                "entity_type": row.get("entity_type"),
                "geography": row.get("geography"),
            }
            for row in rows
        ]
    except psycopg2.errors.UndefinedTable:
        return []


def fetch_account_details(
    conn: psycopg2.extensions.connection, company_name: str, account_code: str
) -> Optional[Dict[str, Any]]:
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        """
        SELECT code, name, category, statement, account_type
        FROM axes_accounts
        WHERE company_id = %s AND code = %s
        LIMIT 1
        """,
        (company_name, account_code),
    )
    row = cur.fetchone()
    cur.close()
    return row


def fetch_entity_details(
    conn: psycopg2.extensions.connection, company_name: str, entity_code: str
) -> Optional[Dict[str, Any]]:
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        """
        SELECT code, name, currency, entity_type
        FROM axes_entities
        WHERE company_id = %s AND code = %s
        LIMIT 1
        """,
        (company_name, entity_code),
    )
    row = cur.fetchone()
    cur.close()
    return row


def serialise_entry(row: Dict[str, Any]) -> Dict[str, Any]:
    debit_amount = decimal_to_float(row.get("debit_amount"))
    credit_amount = decimal_to_float(row.get("credit_amount"))
    entry_type = (row.get("entry_type") or ("debit" if debit_amount >= credit_amount else "credit")).lower()
    amount = debit_amount if entry_type == "debit" else credit_amount

    return {
        "id": row["id"],
        "account_code": row.get("account_code"),
        "account_name": row.get("account_name"),
        "entity_code": row.get("entity_code"),
        "entity_name": row.get("entity_name"),
        "period": row.get("period"),
        "year": row.get("year"),
        "entry_type": entry_type,
        "amount": amount,
        "debit_amount": debit_amount,
        "credit_amount": credit_amount,
        "balance_amount": decimal_to_float(row.get("balance_amount")),
        "currency": row.get("currency"),
        "entry_category": row.get("entry_category"),
        "counterparty": row.get("counterparty"),
        "description": row.get("description"),
        "source": row.get("source"),
        "created_at": row.get("created_at").isoformat() if row.get("created_at") else None,
        "updated_at": row.get("updated_at").isoformat() if row.get("updated_at") else None,
    }


def compute_amounts(amount: float, entry_type: str) -> Tuple[float, float]:
    """Return debit and credit values based on amount and entry type."""
    effective_amount = abs(float(amount))
    entry_type = entry_type.lower()

    if effective_amount == 0:
        return 0.0, 0.0

    if entry_type == "credit":
        return 0.0, effective_amount
    return effective_amount, 0.0


def parse_numeric(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float, Decimal)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.strip()
        if cleaned == "":
            return None
        cleaned = cleaned.replace(",", "")
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def map_uploaded_columns(headers: List[str]) -> Dict[str, int]:
    aliases = {
        "entity_code": ["entity_code", "entity", "entity id", "entity_id", "entity code"],
        "entity_name": ["entity_name", "entity name"],
        "account_code": ["account_code", "account", "account id", "account id/code"],
        "account_name": ["account_name", "account name"],
        "amount": ["amount", "value"],
        "entry_type": ["entry_type", "type", "drcr", "debit_credit"],
        "currency": ["currency", "ccy"],
        "entry_category": ["entry_category", "category", "classification"],
        "counterparty": ["counterparty", "counter party", "ic_partner", "intercompany"],
        "description": ["description", "memo", "note", "narrative"],
    }

    column_map: Dict[str, int] = {}
    normalised = [str(h).strip().lower() if h is not None else "" for h in headers]

    for key, options in aliases.items():
        for alias in options:
            if alias in normalised:
                column_map[key] = normalised.index(alias)
                break

    required = {"entity_code", "account_code", "amount"}
    missing = [r for r in required if r not in column_map]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded file is missing required columns: {', '.join(missing)}",
        )

    return column_map


def parse_uploaded_entries(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """Parse an uploaded CSV/XLSX file and return entry dictionaries."""
    extension = os.path.splitext(filename)[1].lower()
    records: List[Dict[str, Any]] = []

    def process_row(row: Dict[str, Any], row_number: int) -> None:
        amount = parse_numeric(row.get("amount"))
        if amount is None:
            raise ValueError("Amount is required")
        entry_type = (row.get("entry_type") or ("debit" if amount >= 0 else "credit")).strip().lower()
        if entry_type not in ("debit", "credit"):
            raise ValueError("Entry type must be debit or credit")

        entity_value = row.get("entity_code")
        account_value = row.get("account_code")

        if entity_value is None or str(entity_value).strip() == "":
            raise ValueError("Entity code is required")
        if account_value is None or str(account_value).strip() == "":
            raise ValueError("Account code is required")

        records.append(
            {
                "entity_code": str(entity_value).strip(),
                "entity_name": (str(row.get("entity_name")).strip() if row.get("entity_name") else None),
                "account_code": str(account_value).strip(),
                "account_name": (str(row.get("account_name")).strip() if row.get("account_name") else None),
                "amount": float(abs(amount)),
                "entry_type": entry_type if amount >= 0 else ("credit" if entry_type == "debit" else "debit"),
                "currency": (str(row.get("currency")).strip() if row.get("currency") else None),
                "entry_category": (str(row.get("entry_category")).strip() if row.get("entry_category") else "Imported"),
                "counterparty": (str(row.get("counterparty")).strip() if row.get("counterparty") else None),
                "description": (str(row.get("description")).strip() if row.get("description") else None),
            }
        )

    if extension in (".xlsx", ".xlsm", ".xltx", ".xltm"):
        if openpyxl is None:
            raise HTTPException(
                status_code=400,
                detail="openpyxl library is required to process Excel files. Please install it or upload CSV instead.",
            )
        workbook = openpyxl.load_workbook(BytesIO(file_bytes), data_only=True)
        sheet = workbook.active
        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            raise HTTPException(status_code=400, detail="The uploaded spreadsheet is empty.")

        column_map = map_uploaded_columns(list(rows[0] or []))
        for idx, data_row in enumerate(rows[1:], start=2):
            if not data_row or all(cell is None for cell in data_row):
                continue
            row_dict = {key: data_row[column_map[key]] if column_map.get(key) is not None else None for key in column_map}
            try:
                process_row(row_dict, idx)
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=f"Row {idx}: {exc}") from exc

    elif extension == ".csv":
        text_stream = StringIO(file_bytes.decode("utf-8-sig"))
        reader = csv.DictReader(text_stream)
        if reader.fieldnames is None:
            raise HTTPException(status_code=400, detail="CSV file is missing header row.")
        column_map = map_uploaded_columns(reader.fieldnames)
        for idx, csv_row in enumerate(reader, start=2):
            filtered_row = {key: csv_row.get(headers_idx) for key, headers_idx in column_map.items()}
            try:
                process_row(filtered_row, idx)
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=f"Row {idx}: {exc}") from exc
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload CSV or XLSX formats.")

    return records


def insert_entry_record(
    conn: psycopg2.extensions.connection,
    company_name: str,
    entry_data: Dict[str, Any],
    source: str = "manual",
) -> Dict[str, Any]:
    """Insert a record into tb_entries and return the persisted row."""
    ensure_tb_entries_schema(conn)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    entry_type = (entry_data.get("entry_type") or "debit").lower()
    if entry_type not in {"debit", "credit"}:
        entry_type = "debit"

    amount_value = parse_numeric(entry_data.get("amount")) or 0.0
    if amount_value < 0:
        amount_value = abs(amount_value)
        entry_type = "credit" if entry_type == "debit" else "debit"

    account_details = fetch_account_details(conn, company_name, entry_data["account_code"])
    entity_details = fetch_entity_details(conn, company_name, entry_data["entity_code"])

    account_name = entry_data.get("account_name") or (account_details.get("name") if account_details else entry_data["account_code"])
    entity_name = entry_data.get("entity_name") or (entity_details.get("name") if entity_details else entry_data["entity_code"])
    currency = entry_data.get("currency") or (entity_details.get("currency") if entity_details and entity_details.get("currency") else "USD")

    debit_amount, credit_amount = compute_amounts(amount_value, entry_type)
    balance_amount = debit_amount - credit_amount

    cur.execute(
        """
        INSERT INTO tb_entries (
            account_code, account_name, entity_code, entity_name,
            period, year, debit_amount, credit_amount, balance_amount,
            currency, entry_category, counterparty, description,
            entry_type, source, created_at, updated_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
        """,
        (
            entry_data["account_code"],
            account_name,
            entry_data["entity_code"],
            entity_name,
            entry_data["period"],
            entry_data["year"],
            debit_amount,
            credit_amount,
            balance_amount,
            currency,
            entry_data.get("entry_category") or ("Imported" if source == "upload" else "Manual Entry"),
            entry_data.get("counterparty"),
            entry_data.get("description"),
            entry_type,
            source,
        ),
    )
    inserted = cur.fetchone()
    cur.close()
    return inserted


def update_entry_record(
    conn: psycopg2.extensions.connection,
    company_name: str,
    entry_id: int,
    payload: Dict[str, Any],
) -> Dict[str, Any]:
    """Update an existing entry and return the refreshed row."""
    ensure_tb_entries_schema(conn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM tb_entries WHERE id = %s", (entry_id,))
    existing = cur.fetchone()
    if not existing:
        cur.close()
        raise HTTPException(status_code=404, detail="Process entry not found")

    account_code = payload.get("account_code", existing["account_code"])
    entity_code = payload.get("entity_code", existing["entity_code"])
    period = payload.get("period", existing["period"])
    year = payload.get("year", existing["year"])

    entry_type = (
        (payload.get("entry_type") or existing.get("entry_type") or ("debit" if existing["debit_amount"] >= existing["credit_amount"] else "credit"))
        .lower()
    )
    if entry_type not in {"debit", "credit"}:
        entry_type = "debit"

    amount_value = payload.get("amount")
    if amount_value is None:
        amount_value = existing["debit_amount"] if entry_type == "debit" else existing["credit_amount"]
    amount_value = parse_numeric(amount_value) or 0.0
    if amount_value < 0:
        amount_value = abs(amount_value)
        entry_type = "credit" if entry_type == "debit" else "debit"

    account_details = fetch_account_details(conn, company_name, account_code)
    entity_details = fetch_entity_details(conn, company_name, entity_code)

    account_name = payload.get("account_name") or existing.get("account_name") or (
        account_details.get("name") if account_details else account_code
    )
    entity_name = payload.get("entity_name") or existing.get("entity_name") or (
        entity_details.get("name") if entity_details else entity_code
    )
    currency = payload.get("currency") or existing.get("currency") or (
        entity_details.get("currency") if entity_details and entity_details.get("currency") else "USD"
    )

    entry_category = payload.get("entry_category", existing.get("entry_category"))
    counterparty = payload.get("counterparty", existing.get("counterparty"))
    description = payload.get("description", existing.get("description"))

    debit_amount, credit_amount = compute_amounts(amount_value, entry_type)
    balance_amount = debit_amount - credit_amount

    cur.execute(
        """
        UPDATE tb_entries
        SET account_code = %s,
            account_name = %s,
            entity_code = %s,
            entity_name = %s,
            period = %s,
            year = %s,
            debit_amount = %s,
            credit_amount = %s,
            balance_amount = %s,
            currency = %s,
            entry_category = %s,
            counterparty = %s,
            description = %s,
            entry_type = %s,
            source = COALESCE(%s, source),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING *
        """,
        (
            account_code,
            account_name,
            entity_code,
            entity_name,
            period,
            year,
            debit_amount,
            credit_amount,
            balance_amount,
            currency,
            entry_category,
            counterparty,
            description,
            entry_type,
            payload.get("source"),
            entry_id,
        ),
    )
    refreshed = cur.fetchone()
    cur.close()
    return refreshed


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class ManualEntry(BaseModel):
    period: str
    year: str
    entity_code: str
    account_code: str
    amount: float
    entry_type: str = "debit"
    currency: Optional[str] = None
    entry_category: Optional[str] = "Manual Entry"
    counterparty: Optional[str] = None
    description: Optional[str] = None
    account_name: Optional[str] = None
    entity_name: Optional[str] = None

    @validator("entry_type")
    def validate_entry_type(cls, value: str) -> str:
        value = value.lower()
        if value not in {"debit", "credit"}:
            raise ValueError("entry_type must be either 'debit' or 'credit'")
        return value


class ManualEntryUpdate(BaseModel):
    period: Optional[str] = None
    year: Optional[str] = None
    entity_code: Optional[str] = None
    account_code: Optional[str] = None
    amount: Optional[float] = None
    entry_type: Optional[str] = None
    currency: Optional[str] = None
    entry_category: Optional[str] = None
    counterparty: Optional[str] = None
    description: Optional[str] = None
    account_name: Optional[str] = None
    entity_name: Optional[str] = None

    @validator("entry_type")
    def validate_entry_type(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.lower()
        if value not in {"debit", "credit"}:
            raise ValueError("entry_type must be either 'debit' or 'credit'")
        return value


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------


@router.get("/reference-data")
def get_reference_data(company_name: str = Query(...)) -> Dict[str, Any]:
    """Return account and entity dropdown data for the selected company."""
    with company_connection(company_name) as conn:
        accounts = fetch_accounts(conn, company_name)
        entities = fetch_entities(conn, company_name)

    currencies = sorted({entity["currency"] for entity in entities if entity.get("currency")})

    return {
        "accounts": accounts,
        "entities": entities,
        "currencies": currencies,
    }


@router.get("/entries")
def get_process_entries(
    period: str = Query(...),
    year: str = Query(...),
    company_name: str = Query(...),
) -> Dict[str, Any]:
    """Return processed entries for a given period and year."""
    with company_connection(company_name) as conn:
        ensure_tb_entries_schema(conn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT *
            FROM tb_entries
            WHERE period = %s AND year = %s
            ORDER BY created_at DESC, id DESC
            """,
            (period, year),
        )
        rows = cur.fetchall()
        cur.close()

    entries = [serialise_entry(row) for row in rows]
    total_debit = sum(entry["debit_amount"] for entry in entries)
    total_credit = sum(entry["credit_amount"] for entry in entries)

    return {
        "entries": entries,
        "summary": {
            "count": len(entries),
            "total_debit": total_debit,
            "total_credit": total_credit,
            "net_balance": total_debit - total_credit,
        },
    }


@router.post("/entries")
async def create_process_entry(
    entry: ManualEntry,
    company_name: str = Query(...),
    request: Request = None,
) -> Dict[str, Any]:
    """Create a manual process entry."""
    entry_payload = entry.dict()
    with company_connection(company_name) as conn:
        try:
            inserted = insert_entry_record(conn, company_name, entry_payload, source="manual")
            conn.commit()
        except Exception as exc:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create entry: {exc}") from exc

    return {"message": "Entry recorded successfully", "entry": serialise_entry(inserted)}


@router.put("/entries/{entry_id}")
async def update_process_entry(
    entry_id: int,
    entry_update: ManualEntryUpdate,
    company_name: str = Query(...),
) -> Dict[str, Any]:
    """Update an existing process entry."""
    payload = entry_update.dict(exclude_unset=True)
    with company_connection(company_name) as conn:
        try:
            updated = update_entry_record(conn, company_name, entry_id, payload)
            conn.commit()
        except HTTPException:
            conn.rollback()
            raise
        except Exception as exc:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to update entry: {exc}") from exc

    return {"message": "Entry updated successfully", "entry": serialise_entry(updated)}


@router.delete("/entries/{entry_id}")
def delete_process_entry(entry_id: int, company_name: str = Query(...)) -> Dict[str, Any]:
    """Delete a process entry."""
    with company_connection(company_name) as conn:
        ensure_tb_entries_schema(conn)
        cur = conn.cursor()
        cur.execute("SELECT account_name FROM tb_entries WHERE id = %s", (entry_id,))
        existing = cur.fetchone()
        if not existing:
            cur.close()
            raise HTTPException(status_code=404, detail="Process entry not found")

        cur.execute("DELETE FROM tb_entries WHERE id = %s", (entry_id,))
        conn.commit()
        cur.close()

    return {"success": True, "message": f"Entry '{existing[0]}' deleted successfully"}


@router.post("/entries/upload")
async def upload_process_entries(
    company_name: str = Query(...),
    period: str = Form(...),
    year: str = Form(...),
    file: UploadFile = File(...),
) -> Dict[str, Any]:
    """Upload process entries via CSV/XLSX file."""
    contents = await file.read()
    rows = parse_uploaded_entries(contents, file.filename)

    inserted = 0
    errors: List[str] = []
    inserted_entries: List[Dict[str, Any]] = []

    with company_connection(company_name) as conn:
        ensure_tb_entries_schema(conn)
        for index, row in enumerate(rows, start=1):
            payload = {
                "account_code": row["account_code"],
                "account_name": row.get("account_name"),
                "entity_code": row["entity_code"],
                "entity_name": row.get("entity_name"),
                "period": period,
                "year": year,
                "amount": row["amount"],
                "entry_type": row["entry_type"],
                "currency": row.get("currency"),
                "entry_category": row.get("entry_category"),
                "counterparty": row.get("counterparty"),
                "description": row.get("description"),
            }
            try:
                inserted_row = insert_entry_record(conn, company_name, payload, source="upload")
                conn.commit()
                inserted += 1
                inserted_entries.append(serialise_entry(inserted_row))
            except Exception as exc:
                conn.rollback()
                errors.append(f"Row {index}: {exc}")

    return {
        "message": f"Imported {inserted} entries",
        "inserted": inserted,
        "errors": errors[:50],
        "entries": inserted_entries,
    }


@router.post("/generate-financial-statements")
async def generate_financial_statements(
    request: Request,
    company_name: str = Query(...),
) -> Dict[str, Any]:
    """Generate simple financial statements for a given period and year."""
    payload = await request.json()
    period = payload.get("period")
    year = payload.get("year")

    if not period or not year:
        raise HTTPException(status_code=400, detail="Period and year are required")

    with company_connection(company_name) as conn:
        ensure_tb_entries_schema(conn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT te.account_code,
                   te.account_name,
                   te.debit_amount,
                   te.credit_amount,
                   te.balance_amount,
                   COALESCE(a.account_type, te.entry_category) AS account_type
            FROM tb_entries te
            LEFT JOIN axes_accounts a
                ON te.account_code = a.code
               AND a.company_id = %s
            WHERE te.period = %s AND te.year = %s
            """,
            (company_name, period, year),
        )
        rows = cur.fetchall()
        cur.close()

    balance_sheet = {"assets": [], "liabilities": [], "equity": []}
    income_statement = {"revenue": [], "expenses": []}

    for row in rows:
        account_type = (row.get("account_type") or "").lower()
        entry = {
            "account_code": row["account_code"],
            "account_name": row["account_name"],
            "debit_amount": decimal_to_float(row["debit_amount"]),
            "credit_amount": decimal_to_float(row["credit_amount"]),
            "balance_amount": decimal_to_float(row["balance_amount"]),
        }

        if account_type in {"asset", "assets"}:
            balance_sheet["assets"].append(entry)
        elif account_type in {"liability", "liabilities"}:
            balance_sheet["liabilities"].append(entry)
        elif account_type == "equity":
            balance_sheet["equity"].append(entry)
        elif account_type in {"revenue", "income"}:
            income_statement["revenue"].append(entry)
        elif account_type == "expense":
            income_statement["expenses"].append(entry)
        else:
            # Fallback classification when account type is unknown
            if entry["balance_amount"] >= 0:
                balance_sheet["assets"].append(entry)
            else:
                balance_sheet["liabilities"].append(entry)

    total_assets = sum(item["balance_amount"] for item in balance_sheet["assets"])
    total_liabilities = sum(item["balance_amount"] for item in balance_sheet["liabilities"])
    total_equity = sum(item["balance_amount"] for item in balance_sheet["equity"])

    total_revenue = sum(item["balance_amount"] for item in income_statement["revenue"])
    total_expenses = sum(item["balance_amount"] for item in income_statement["expenses"])
    net_income = total_revenue - total_expenses

    return {
        "success": True,
        "period": period,
        "year": year,
        "balance_sheet": {
            "assets": balance_sheet["assets"],
            "liabilities": balance_sheet["liabilities"],
            "equity": balance_sheet["equity"],
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "total_equity": total_equity,
        },
        "income_statement": {
            "revenue": income_statement["revenue"],
            "expenses": income_statement["expenses"],
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "net_income": net_income,
        },
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/balances")
def get_account_balances(
    account: str = Query(...),
    date: str = Query(...),
    company_name: str = Query(...),
) -> Dict[str, Any]:
    """Return recent balances for a given account up to a specific date."""
    with company_connection(company_name) as conn:
        ensure_tb_entries_schema(conn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT account_code,
                   account_name,
                   debit_amount,
                   credit_amount,
                   balance_amount,
                   period,
                   year,
                   entity_code,
                   entity_name,
                   currency,
                   created_at
            FROM tb_entries
            WHERE account_code = %s AND created_at <= %s
            ORDER BY created_at DESC
            LIMIT 25
            """,
            (account, date),
        )
        rows = cur.fetchall()
        cur.close()

    balances = [
        {
            "account_code": row["account_code"],
            "account_name": row["account_name"],
            "debit_amount": decimal_to_float(row["debit_amount"]),
            "credit_amount": decimal_to_float(row["credit_amount"]),
            "balance_amount": decimal_to_float(row["balance_amount"]),
            "period": row["period"],
            "year": row["year"],
            "entity_code": row["entity_code"],
            "entity_name": row["entity_name"],
            "currency": row["currency"],
            "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        }
        for row in rows
    ]

    return {"balances": balances}
