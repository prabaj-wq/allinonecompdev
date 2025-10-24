from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from typing import Optional, Dict, Any, List, Tuple, Union
import json
from datetime import datetime, date, timedelta
import logging
import psycopg2
import os
from contextlib import contextmanager
from pathlib import Path
import uuid
import shutil
import calendar
from typing import Iterable
from decimal import Decimal


router = APIRouter(prefix="/journal-entry", tags=["Journal Entry"])
logger = logging.getLogger(__name__)

# ==================== DATABASE UTILITIES ====================

def get_db_config():
    """Get database configuration for Docker environment"""
    if os.getenv('DOCKER_ENV') == 'true':
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
    else:
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')

    return {
        'host': POSTGRES_HOST,
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'root@123')
    }


def get_company_db_name(company_name: str) -> str:
    """Convert company name to database name"""
    return company_name.lower().replace(' ', '_').replace('-', '_')


def get_company_upload_dir(company_name: str) -> Path:
    """Return or create attachment directory for a company"""
    base_upload_dir = Path(os.getenv("JOURNAL_UPLOAD_DIR", "uploads/journal_attachments"))
    company_dir = base_upload_dir / get_company_db_name(company_name)
    company_dir.mkdir(parents=True, exist_ok=True)
    return company_dir


@contextmanager
def get_company_connection(company_name: str):
    """Get database connection for specific company"""
    db_config = get_db_config()
    company_db_name = get_company_db_name(company_name)

    conn = None
    try:
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        conn.autocommit = False
        yield conn
    except psycopg2.OperationalError as e:
        if "does not exist" in str(e):
            try:
                default_conn = psycopg2.connect(
                    database='postgres',
                    **db_config
                )
                default_conn.autocommit = True
                cur = default_conn.cursor()
                cur.execute(f'CREATE DATABASE "{company_db_name}"')
                cur.close()
                default_conn.close()

                conn = psycopg2.connect(
                    database=company_db_name,
                    **db_config
                )
                conn.autocommit = False
                yield conn
            except Exception as create_error:
                raise Exception(f"Failed to create company database: {str(create_error)}")
        else:
            raise Exception(f"Database connection error: {str(e)}")
    finally:
        if conn:
            conn.close()

# ==================== JOURNAL BATCH ENDPOINTS ====================

@router.get("/batches")
async def get_journal_batches(
    company_name: str = Query(...),
    process_id: Optional[int] = Query(None),
    entity_id: Optional[str] = Query(None),
    scenario_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get journal batches with filtering"""
    try:
        with get_company_connection(company_name) as conn:
            # Ensure tables exist
            create_journal_tables(conn)
            
            # Build query
            query = """
                SELECT jb.*, COUNT(jl.id) as line_count
                FROM journal_batches jb
                LEFT JOIN journal_lines jl ON jb.id = jl.batch_id
                WHERE 1=1
            """
            params = []
            
            if process_id:
                query += " AND jb.process_id = %s"
                params.append(process_id)
            if entity_id:
                query += " AND jb.entity_id = %s"
                params.append(entity_id)
            if scenario_id:
                query += " AND jb.scenario_id = %s"
                params.append(scenario_id)
            if category:
                query += " AND jb.category = %s"
                params.append(category)
            if status:
                query += " AND jb.status = %s"
                params.append(status)
            
            query += """
                GROUP BY jb.id
                ORDER BY jb.created_at DESC
                LIMIT %s OFFSET %s
            """
            params.extend([limit, offset])
            
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            columns = [desc[0] for desc in cursor.description]
            batches = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return {"batches": batches}
            
    except Exception as e:
        logger.error(f"Error fetching journal batches: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batches")
async def create_journal_batch(
    batch_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Create new journal batch"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            if is_period_locked(
                conn,
                batch_data.get('fiscal_year'),
                batch_data.get('period'),
                batch_data.get('process_id'),
                batch_data.get('entity_id'),
                batch_data.get('scenario_id')
            ):
                raise HTTPException(status_code=403, detail="Period is locked for this context")

            category_code = batch_data.get('category_code') or batch_data.get('category')
            category_record = None
            if category_code:
                cursor.execute(
                    """
                    SELECT id, category_code, category_name, default_approval_workflow_id
                    FROM journal_categories
                    WHERE (UPPER(category_code) = UPPER(%s) OR UPPER(category_name) = UPPER(%s))
                      AND is_active = true
                    LIMIT 1
                    """,
                    (category_code, category_code)
                )
                result = cursor.fetchone()
                if result:
                    columns = [desc[0] for desc in cursor.description]
                    category_record = dict(zip(columns, result))

            # Generate batch number
            batch_number = generate_batch_number(conn)

            category_name = (
                category_record["category_name"] if category_record else batch_data.get('category_name')
            ) or batch_data.get('category', 'Manual Adjustments')

            cursor.execute("""
                INSERT INTO journal_batches (
                    batch_number, description, process_id, entity_id, scenario_id,
                    fiscal_year, period, category, journal_type, status,
                    created_by, total_debits, total_credits, is_balanced, category_code
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                batch_number,
                batch_data.get('description', ''),
                batch_data.get('process_id'),
                batch_data.get('entity_id'),
                batch_data.get('scenario_id'),
                batch_data.get('fiscal_year'),
                batch_data.get('period'),
                category_name,
                batch_data.get('journal_type', 'manual'),
                batch_data.get('status', 'draft'),
                batch_data.get('created_by', 'system'),
                0, 0, False,
                category_record["category_code"] if category_record else None
            ))

            batch_id = cursor.fetchone()[0]

            if category_record:
                cursor.execute(
                    """UPDATE journal_batches SET category_id = %s WHERE id = %s""",
                    (category_record["id"], batch_id)
                )

            batch_snapshot = fetch_batch(conn, batch_id)
            workflow = get_applicable_workflow(conn, batch_snapshot)
            if workflow:
                cursor.execute(
                    """
                    UPDATE journal_batches
                    SET workflow_config = %s,
                        workflow_status = 'pending'
                    WHERE id = %s
                    """,
                    (json.dumps({"workflow_id": workflow["id"], "workflow_name": workflow["workflow_name"]}), batch_id)
                )

            log_audit_event(
                conn,
                batch_id=batch_id,
                line_id=None,
                action_type="create_batch",
                action_description=f"Batch {batch_number} created",
                new_values=batch_snapshot,
                performed_by=batch_data.get('created_by', 'system')
            )

            conn.commit()

            return {"batch_id": batch_id, "batch_number": batch_number}
    except Exception as e:
        logger.error(f"Error generating journal summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batches/{batch_id}/lines")
async def get_journal_lines(
    batch_id: int,
    company_name: str = Query(...)
):
    """Get journal lines for a batch"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM journal_lines 
                WHERE batch_id = %s 
                ORDER BY line_number
            """, (batch_id,))
            
            columns = [desc[0] for desc in cursor.description]
            lines = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return {"lines": lines}
            
    except Exception as e:
        logger.error(f"Error fetching journal lines: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batches/{batch_id}/lines")
async def create_journal_line(
    batch_id: int,
    line_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Create new journal line"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            batch = fetch_batch(conn, batch_id)
            if not batch:
                raise HTTPException(status_code=404, detail="Batch not found")

            if is_period_locked(
                conn,
                batch.get('fiscal_year'),
                batch.get('period'),
                batch.get('process_id'),
                batch.get('entity_id'),
                batch.get('scenario_id')
            ):
                raise HTTPException(status_code=403, detail="Period is locked for this context")
            
            # Get next line number
            cursor.execute("""
                SELECT COALESCE(MAX(line_number), 0) + 1 
                FROM journal_lines WHERE batch_id = %s
            """, (batch_id,))
            line_number = cursor.fetchone()[0]
            
            # Insert line
            cursor.execute("""
                INSERT INTO journal_lines (
                    batch_id, line_number, transaction_date, period,
                    entity_code, entity_name, account_debit_code, account_debit_name,
                    account_credit_code, account_credit_name, amount, currency,
                    description, reference_number, custom_fields, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                batch_id, line_number,
                line_data.get('transaction_date'),
                line_data.get('period'),
                line_data.get('entity_code'),
                line_data.get('entity_name'),
                line_data.get('account_debit_code'),
                line_data.get('account_debit_name'),
                line_data.get('account_credit_code'),
                line_data.get('account_credit_name'),
                line_data.get('amount', 0),
                line_data.get('currency', 'INR'),
                line_data.get('description', ''),
                line_data.get('reference_number'),
                json.dumps(line_data.get('custom_fields', {})),
                line_data.get('created_by', 'system')
            ))
            
            line_id = cursor.fetchone()[0]
            
            # Update batch totals
            update_batch_totals(conn, batch_id)
            log_audit_event(
                conn,
                batch_id=batch_id,
                line_id=line_id,
                action_type="create_line",
                action_description=f"Line {line_number} added",
                new_values={**line_data, "line_number": line_number},
                performed_by=line_data.get('created_by', 'system')
            )
            conn.commit()
            
            return {"line_id": line_id}
            
    except Exception as e:
        logger.error(f"Error creating journal line: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _serialize_category_row(columns: List[str], row) -> Dict[str, Any]:
    record = dict(zip(columns, row))
    if record.get("required_custom_fields") is None:
        record["required_custom_fields"] = []
    if record.get("metadata") is None:
        record["metadata"] = {}
    return record


# ==================== CATEGORIES ENDPOINTS ====================

@router.get("/categories")
async def get_journal_categories(
    company_name: str = Query(...),
    include_inactive: bool = Query(False),
    search: Optional[str] = Query(None)
):
    """Get journal categories created by users"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)

            cursor = conn.cursor()
            query = """
                SELECT id, category_code, category_name, description, color,
                       requires_attachments, required_custom_fields,
                       default_approval_workflow_id, default_debit_account,
                       default_credit_account, metadata, is_active,
                       created_by, created_at, modified_by, modified_at
                FROM journal_categories
                WHERE 1=1
            """
            params: List[Any] = []

            if not include_inactive:
                query += " AND is_active = true"

            if search:
                query += " AND (category_code ILIKE %s OR category_name ILIKE %s)"
                like = f"%{search}%"
                params.extend([like, like])

            query += " ORDER BY category_name ASC"
            cursor.execute(query, params)

            columns = [col[0] for col in cursor.description]
            categories = [_serialize_category_row(columns, row) for row in cursor.fetchall()]

            return {"categories": categories, "count": len(categories)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching journal categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch journal categories")


@router.post("/categories")
async def create_journal_category(
    category_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Create a new journal category"""
    required_fields = ["category_code", "category_name", "created_by"]
    missing = [field for field in required_fields if not category_data.get(field)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")

    category_code = category_data["category_code"].strip().upper()
    category_name = category_data["category_name"].strip()

    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id FROM journal_categories WHERE UPPER(category_code) = %s",
                (category_code,)
            )
            if cursor.fetchone():
                raise HTTPException(status_code=409, detail="Category code already exists")

            cursor.execute(
                """
                INSERT INTO journal_categories (
                    category_code, category_name, description, color,
                    requires_attachments, required_custom_fields,
                    default_approval_workflow_id, default_debit_account,
                    default_credit_account, metadata, is_active, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
                """,
                (
                    category_code,
                    category_name,
                    category_data.get("description"),
                    category_data.get("color"),
                    category_data.get("requires_attachments", False),
                    json.dumps(category_data.get("required_custom_fields", [])),
                    category_data.get("default_approval_workflow_id"),
                    category_data.get("default_debit_account"),
                    category_data.get("default_credit_account"),
                    json.dumps(category_data.get("metadata", {})),
                    category_data.get("is_active", True),
                    category_data.get("created_by")
                )
            )

            new_id, created_at = cursor.fetchone()
            conn.commit()

            category = {
                "id": new_id,
                "category_code": category_code,
                "category_name": category_name,
                "description": category_data.get("description"),
                "color": category_data.get("color"),
                "requires_attachments": category_data.get("requires_attachments", False),
                "required_custom_fields": category_data.get("required_custom_fields", []),
                "default_approval_workflow_id": category_data.get("default_approval_workflow_id"),
                "default_debit_account": category_data.get("default_debit_account"),
                "default_credit_account": category_data.get("default_credit_account"),
                "metadata": category_data.get("metadata", {}),
                "is_active": category_data.get("is_active", True),
                "created_by": category_data.get("created_by"),
                "created_at": created_at
            }

            return {"category": category}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating journal category: {e}")
        raise HTTPException(status_code=500, detail="Failed to create journal category")


@router.put("/categories/{category_id}")
async def update_journal_category(
    category_id: int,
    category_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Update an existing journal category"""
    if not category_data.get("modified_by"):
        raise HTTPException(status_code=400, detail="modified_by is required")

    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id, category_code FROM journal_categories WHERE id = %s",
                (category_id,)
            )
            existing = cursor.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Category not found")

            update_fields = [
                "category_name", "description", "color", "requires_attachments",
                "required_custom_fields", "default_approval_workflow_id",
                "default_debit_account", "default_credit_account", "metadata",
                "is_active"
            ]

            set_clauses = []
            params: List[Any] = []
            for field in update_fields:
                if field in category_data:
                    set_clauses.append(f"{field} = %s")
                    value = category_data[field]
                    if field in {"required_custom_fields", "metadata"}:
                        value = json.dumps(value)
                    params.append(value)

            if not set_clauses:
                raise HTTPException(status_code=400, detail="No updatable fields provided")

            set_clauses.append("modified_by = %s")
            set_clauses.append("modified_at = CURRENT_TIMESTAMP")
            params.append(category_data["modified_by"])
            params.append(category_id)

            update_sql = f"UPDATE journal_categories SET {', '.join(set_clauses)} WHERE id = %s"
            cursor.execute(update_sql, params)

            conn.commit()
            return {"message": "Category updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating journal category: {e}")
        raise HTTPException(status_code=500, detail="Failed to update journal category")


@router.delete("/categories/{category_id}")
async def delete_journal_category(
    category_id: int,
    company_name: str = Query(...)
):
    """Soft delete a journal category"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id FROM journal_categories WHERE id = %s",
                (category_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Category not found")

            cursor.execute(
                "UPDATE journal_categories SET is_active = false WHERE id = %s",
                (category_id,)
            )
            conn.commit()

            return {"message": "Category deactivated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting journal category: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete journal category")


def _serialize_workflow_row(columns: List[str], row) -> Dict[str, Any]:
    record = dict(zip(columns, row))
    for field, default in (
        ("approver_levels", []),
        ("categories", []),
        ("entity_codes", []),
        ("metadata", {})
    ):
        if record.get(field) is None:
            record[field] = default
    return record


# ==================== APPROVAL WORKFLOW ENDPOINTS ====================

@router.get("/approval-workflows")
async def get_approval_workflows(
    company_name: str = Query(...),
    include_inactive: bool = Query(False),
    search: Optional[str] = Query(None),
    category_code: Optional[str] = Query(None)
):
    """List approval workflows with optional filters"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)

            cursor = conn.cursor()
            query = """
                SELECT id, workflow_name, amount_threshold, requires_all_approvers,
                       approver_levels, categories, entity_codes, metadata,
                       is_active, created_by, created_at, modified_by, modified_at
                FROM journal_approval_workflows
                WHERE 1=1
            """
            params: List[Any] = []

            if not include_inactive:
                query += " AND is_active = true"

            if search:
                query += " AND workflow_name ILIKE %s"
                params.append(f"%{search}%")

            if category_code:
                query += " AND (categories @> %s OR categories IS NULL)"
                params.append(json.dumps([category_code]))

            query += " ORDER BY workflow_name ASC"
            cursor.execute(query, params)

            columns = [col[0] for col in cursor.description]
            workflows = [_serialize_workflow_row(columns, row) for row in cursor.fetchall()]

            return {"workflows": workflows, "count": len(workflows)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching approval workflows: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch approval workflows")


@router.post("/approval-workflows")
async def create_approval_workflow(
    workflow_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Create a new approval workflow"""
    required_fields = ["workflow_name", "created_by"]
    missing = [field for field in required_fields if not workflow_data.get(field)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")

    workflow_name = workflow_data["workflow_name"].strip()
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id FROM journal_approval_workflows WHERE LOWER(workflow_name) = LOWER(%s)",
                (workflow_name,)
            )
            if cursor.fetchone():
                raise HTTPException(status_code=409, detail="Workflow name already exists")

            cursor.execute(
                """
                INSERT INTO journal_approval_workflows (
                    workflow_name, amount_threshold, requires_all_approvers,
                    approver_levels, categories, entity_codes, metadata,
                    is_active, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
                """,
                (
                    workflow_name,
                    workflow_data.get("amount_threshold"),
                    workflow_data.get("requires_all_approvers", False),
                    json.dumps(workflow_data.get("approver_levels", [])),
                    json.dumps(workflow_data.get("categories", [])),
                    json.dumps(workflow_data.get("entity_codes", [])),
                    json.dumps(workflow_data.get("metadata", {})),
                    workflow_data.get("is_active", True),
                    workflow_data.get("created_by")
                )
            )

            workflow_id, created_at = cursor.fetchone()
            conn.commit()

            workflow = {
                "id": workflow_id,
                "workflow_name": workflow_name,
                "amount_threshold": workflow_data.get("amount_threshold"),
                "requires_all_approvers": workflow_data.get("requires_all_approvers", False),
                "approver_levels": workflow_data.get("approver_levels", []),
                "categories": workflow_data.get("categories", []),
                "entity_codes": workflow_data.get("entity_codes", []),
                "metadata": workflow_data.get("metadata", {}),
                "is_active": workflow_data.get("is_active", True),
                "created_by": workflow_data.get("created_by"),
                "created_at": created_at
            }

            return {"workflow": workflow}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating approval workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to create approval workflow")


@router.put("/approval-workflows/{workflow_id}")
async def update_approval_workflow(
    workflow_id: int,
    workflow_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Update an approval workflow"""
    if not workflow_data.get("modified_by"):
        raise HTTPException(status_code=400, detail="modified_by is required")

    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id FROM journal_approval_workflows WHERE id = %s",
                (workflow_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Workflow not found")

            update_fields = [
                "workflow_name", "amount_threshold", "requires_all_approvers",
                "approver_levels", "categories", "entity_codes",
                "metadata", "is_active"
            ]

            set_clauses = []
            params: List[Any] = []
            for field in update_fields:
                if field in workflow_data:
                    set_clauses.append(f"{field} = %s")
                    value = workflow_data[field]
                    if field in {"approver_levels", "categories", "entity_codes", "metadata"}:
                        value = json.dumps(value)
                    params.append(value)

            if not set_clauses:
                raise HTTPException(status_code=400, detail="No updatable fields provided")

            set_clauses.append("modified_by = %s")
            set_clauses.append("modified_at = CURRENT_TIMESTAMP")
            params.append(workflow_data["modified_by"])
            params.append(workflow_id)

            update_sql = f"UPDATE journal_approval_workflows SET {', '.join(set_clauses)} WHERE id = %s"
            cursor.execute(update_sql, params)

            conn.commit()
            return {"message": "Workflow updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating approval workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to update approval workflow")


@router.delete("/approval-workflows/{workflow_id}")
async def delete_approval_workflow(
    workflow_id: int,
    company_name: str = Query(...)
):
    """Soft delete an approval workflow"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id FROM journal_approval_workflows WHERE id = %s",
                (workflow_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Workflow not found")

            cursor.execute(
                "UPDATE journal_approval_workflows SET is_active = false WHERE id = %s",
                (workflow_id,)
            )
            conn.commit()

            return {"message": "Workflow deactivated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting approval workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete approval workflow")


def _serialize_onboarding_row(columns: List[str], row) -> Dict[str, Any]:
    record = dict(zip(columns, row))
    if record.get("metadata") is None:
        record["metadata"] = {}
    return record


# ==================== ONBOARDING CHECKLIST ENDPOINTS ====================

@router.get("/onboarding")
async def get_onboarding_checklists(
    company_name: str = Query(...),
    process_id: Optional[int] = Query(None),
    entity_id: Optional[str] = Query(None),
    scenario_id: Optional[int] = Query(None),
    fiscal_year: Optional[str] = Query(None),
    period: Optional[str] = Query(None)
):
    """Fetch onboarding checklist entries with optional filters"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)

            cursor = conn.cursor()
            query = """
                SELECT id, process_id, entity_id, scenario_id, fiscal_year, period,
                       categories_configured, approvals_configured, templates_created,
                       recurring_configured, custom_fields_configured, attachments_configured,
                       notes, metadata, created_by, created_at, modified_by, modified_at
                FROM journal_onboarding_checklist
                WHERE 1=1
            """
            params: List[Any] = []

            if process_id is not None:
                query += " AND process_id = %s"
                params.append(process_id)
            if entity_id is not None:
                query += " AND entity_id = %s"
                params.append(entity_id)
            if scenario_id is not None:
                query += " AND scenario_id = %s"
                params.append(scenario_id)
            if fiscal_year is not None:
                query += " AND fiscal_year = %s"
                params.append(fiscal_year)
            if period is not None:
                query += " AND period = %s"
                params.append(period)

            query += " ORDER BY created_at DESC"
            cursor.execute(query, params)

            columns = [col[0] for col in cursor.description]
            rows = [_serialize_onboarding_row(columns, row) for row in cursor.fetchall()]

            return {"checklists": rows, "count": len(rows)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching onboarding checklists: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch onboarding checklists")


@router.post("/onboarding")
async def create_onboarding_checklist(
    checklist_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Create an onboarding checklist record"""
    required_fields = ["process_id", "entity_id", "scenario_id", "fiscal_year", "period", "created_by"]
    missing = [field for field in required_fields if checklist_data.get(field) in (None, "")]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")

    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                """
                INSERT INTO journal_onboarding_checklist (
                    process_id, entity_id, scenario_id, fiscal_year, period,
                    categories_configured, approvals_configured, templates_created,
                    recurring_configured, custom_fields_configured, attachments_configured,
                    notes, metadata, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
                """,
                (
                    checklist_data.get("process_id"),
                    checklist_data.get("entity_id"),
                    checklist_data.get("scenario_id"),
                    checklist_data.get("fiscal_year"),
                    checklist_data.get("period"),
                    checklist_data.get("categories_configured", False),
                    checklist_data.get("approvals_configured", False),
                    checklist_data.get("templates_created", False),
                    checklist_data.get("recurring_configured", False),
                    checklist_data.get("custom_fields_configured", False),
                    checklist_data.get("attachments_configured", False),
                    checklist_data.get("notes"),
                    json.dumps(checklist_data.get("metadata", {})),
                    checklist_data.get("created_by")
                )
            )

            checklist_id, created_at = cursor.fetchone()
            conn.commit()

            checklist = {
                "id": checklist_id,
                **{key: checklist_data.get(key) for key in [
                    "process_id", "entity_id", "scenario_id", "fiscal_year", "period",
                    "categories_configured", "approvals_configured", "templates_created",
                    "recurring_configured", "custom_fields_configured", "attachments_configured",
                    "notes", "metadata", "created_by"
                ]},
                "created_at": created_at
            }

            return {"checklist": checklist}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating onboarding checklist: {e}")
        raise HTTPException(status_code=500, detail="Failed to create onboarding checklist")


@router.put("/onboarding/{checklist_id}")
async def update_onboarding_checklist(
    checklist_id: int,
    checklist_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Update onboarding checklist flags or notes"""
    if not checklist_data.get("modified_by"):
        raise HTTPException(status_code=400, detail="modified_by is required")

    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id FROM journal_onboarding_checklist WHERE id = %s",
                (checklist_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Checklist not found")

            update_fields = [
                "categories_configured", "approvals_configured", "templates_created",
                "recurring_configured", "custom_fields_configured", "attachments_configured",
                "notes", "metadata"
            ]

            set_clauses = []
            params: List[Any] = []
            for field in update_fields:
                if field in checklist_data:
                    set_clauses.append(f"{field} = %s")
                    value = checklist_data[field]
                    if field == "metadata":
                        value = json.dumps(value)
                    params.append(value)

            if not set_clauses:
                raise HTTPException(status_code=400, detail="No updatable fields provided")

            set_clauses.append("modified_by = %s")
            set_clauses.append("modified_at = CURRENT_TIMESTAMP")
            params.append(checklist_data["modified_by"])
            params.append(checklist_id)

            update_sql = f"UPDATE journal_onboarding_checklist SET {', '.join(set_clauses)} WHERE id = %s"
            cursor.execute(update_sql, params)

            conn.commit()
            return {"message": "Checklist updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating onboarding checklist: {e}")
        raise HTTPException(status_code=500, detail="Failed to update onboarding checklist")


@router.delete("/onboarding/{checklist_id}")
async def delete_onboarding_checklist(
    checklist_id: int,
    company_name: str = Query(...)
):
    """Remove an onboarding checklist record"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id FROM journal_onboarding_checklist WHERE id = %s",
                (checklist_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Checklist not found")

            cursor.execute(
                "DELETE FROM journal_onboarding_checklist WHERE id = %s",
                (checklist_id,)
            )
            conn.commit()

            return {"message": "Checklist deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting onboarding checklist: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete onboarding checklist")


def _serialize_upload_batch_row(columns: List[str], row) -> Dict[str, Any]:
    record = dict(zip(columns, row))
    if record.get("error_log") is None:
        record["error_log"] = []
    if record.get("metadata") is None:
        record["metadata"] = {}
    return record


# ==================== UPLOAD BATCH ENDPOINTS ====================

@router.get("/upload-batches")
async def get_upload_batches(
    company_name: str = Query(...),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """List journal upload batches with optional status filter"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            query = """
                SELECT id, upload_batch_id, filename, status, total_rows,
                       successful_rows, failed_rows, error_log, uploaded_by,
                       uploaded_at, processed_at, metadata
                FROM journal_upload_batches
                WHERE 1=1
            """
            params: List[Any] = []

            if status:
                query += " AND status = %s"
                params.append(status)

            query += " ORDER BY uploaded_at DESC LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            cursor.execute(query, params)

            columns = [col[0] for col in cursor.description]
            batches = [_serialize_upload_batch_row(columns, row) for row in cursor.fetchall()]

            return {"upload_batches": batches, "count": len(batches)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching upload batches: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch upload batches")


@router.post("/upload-batches")
async def create_upload_batch(
    company_name: str = Query(...),
    filename: str = Form(...),
    total_rows: int = Form(...),
    uploaded_by: str = Form(...),
    metadata: Optional[str] = Form(None)
):
    """Create a new upload batch entry prior to processing"""
    if total_rows < 0:
        raise HTTPException(status_code=400, detail="total_rows must be non-negative")

    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            upload_batch_id = uuid.uuid4().hex
            cursor.execute(
                """
                INSERT INTO journal_upload_batches (
                    upload_batch_id, filename, status, total_rows,
                    successful_rows, failed_rows, error_log,
                    uploaded_by, metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, uploaded_at
                """,
                (
                    upload_batch_id,
                    filename,
                    "processing",
                    total_rows,
                    0,
                    0,
                    json.dumps([]),
                    uploaded_by,
                    json.dumps(json.loads(metadata) if metadata else {})
                )
            )

            record_id, uploaded_at = cursor.fetchone()
            conn.commit()

            upload_batch = {
                "id": record_id,
                "upload_batch_id": upload_batch_id,
                "filename": filename,
                "status": "processing",
                "total_rows": total_rows,
                "successful_rows": 0,
                "failed_rows": 0,
                "error_log": [],
                "uploaded_by": uploaded_by,
                "uploaded_at": uploaded_at,
                "metadata": json.loads(metadata) if metadata else {}
            }

            return {"upload_batch": upload_batch}

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="metadata must be valid JSON")
    except Exception as e:
        logger.error(f"Error creating upload batch: {e}")
        raise HTTPException(status_code=500, detail="Failed to create upload batch")


@router.get("/upload-batches/{upload_batch_id}")
async def get_upload_batch_detail(
    upload_batch_id: str,
    company_name: str = Query(...)
):
    """Fetch a single upload batch by its public identifier"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT id, upload_batch_id, filename, status, total_rows,
                       successful_rows, failed_rows, error_log, uploaded_by,
                       uploaded_at, processed_at, metadata
                FROM journal_upload_batches
                WHERE upload_batch_id = %s
                """,
                (upload_batch_id,)
            )

            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Upload batch not found")

            columns = [desc[0] for desc in cursor.description]
            batch = _serialize_upload_batch_row(columns, result)
            return {"upload_batch": batch}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching upload batch detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch upload batch detail")


@router.put("/upload-batches/{upload_batch_id}")
async def update_upload_batch(
    upload_batch_id: str,
    company_name: str = Query(...),
    status: Optional[str] = Form(None),
    successful_rows: Optional[int] = Form(None),
    failed_rows: Optional[int] = Form(None),
    processed_at: Optional[str] = Form(None),
    append_errors: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None)
):
    """Update upload batch progress counts, status, and errors"""
    if all(value is None for value in [status, successful_rows, failed_rows, processed_at, append_errors, metadata]):
        raise HTTPException(status_code=400, detail="No updates provided")

    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id, error_log, metadata FROM journal_upload_batches WHERE upload_batch_id = %s",
                (upload_batch_id,)
            )
            existing = cursor.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Upload batch not found")

            record_id, existing_errors, existing_metadata = existing
            update_clauses = []
            params: List[Any] = []

            if status:
                update_clauses.append("status = %s")
                params.append(status)

            if successful_rows is not None:
                if successful_rows < 0:
                    raise HTTPException(status_code=400, detail="successful_rows cannot be negative")
                update_clauses.append("successful_rows = %s")
                params.append(successful_rows)

            if failed_rows is not None:
                if failed_rows < 0:
                    raise HTTPException(status_code=400, detail="failed_rows cannot be negative")
                update_clauses.append("failed_rows = %s")
                params.append(failed_rows)

            if processed_at:
                try:
                    processed_dt = datetime.fromisoformat(processed_at)
                except ValueError:
                    raise HTTPException(status_code=400, detail="processed_at must be ISO datetime string")
                update_clauses.append("processed_at = %s")
                params.append(processed_dt)

            if append_errors:
                try:
                    new_errors = json.loads(append_errors)
                    if not isinstance(new_errors, list):
                        raise ValueError
                except ValueError:
                    raise HTTPException(status_code=400, detail="append_errors must be a JSON array")

                combined_errors = (existing_errors or []) + new_errors
                update_clauses.append("error_log = %s")
                params.append(json.dumps(combined_errors))

            if metadata:
                try:
                    metadata_json = json.loads(metadata)
                except json.JSONDecodeError:
                    raise HTTPException(status_code=400, detail="metadata must be valid JSON")
                update_clauses.append("metadata = %s")
                params.append(json.dumps(metadata_json))

            if not update_clauses:
                raise HTTPException(status_code=400, detail="No valid updates provided")

            update_clauses.append("processed_at = processed_at")  # ensures processed_at column exists even if unchanged
            update_sql = f"UPDATE journal_upload_batches SET {', '.join(update_clauses)} WHERE upload_batch_id = %s"
            params.append(upload_batch_id)
            cursor.execute(update_sql, params)

            conn.commit()
            return {"message": "Upload batch updated"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating upload batch: {e}")
        raise HTTPException(status_code=500, detail="Failed to update upload batch")


def _serialize_attachment_row(columns: List[str], row) -> Dict[str, Any]:
    record = dict(zip(columns, row))
    if record.get("metadata") is None:
        record["metadata"] = {}
    return record


# ==================== ATTACHMENTS ENDPOINTS ====================

@router.get("/attachments")
async def list_journal_attachments(
    company_name: str = Query(...),
    batch_id: Optional[int] = Query(None),
    line_id: Optional[int] = Query(None)
):
    """List attachments for a batch or specific line"""
    if not batch_id and not line_id:
        raise HTTPException(status_code=400, detail="batch_id or line_id must be provided")

    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            query = """
                SELECT id, batch_id, line_id, file_name, file_path, file_type,
                       file_size, description, metadata, uploaded_by, uploaded_at
                FROM journal_attachments
                WHERE 1=1
            """
            params: List[Any] = []

            if batch_id:
                query += " AND batch_id = %s"
                params.append(batch_id)
            if line_id:
                query += " AND line_id = %s"
                params.append(line_id)

            query += " ORDER BY uploaded_at DESC"
            cursor.execute(query, params)

            columns = [col[0] for col in cursor.description]
            attachments = [_serialize_attachment_row(columns, row) for row in cursor.fetchall()]

            return {"attachments": attachments, "count": len(attachments)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing attachments: {e}")
        raise HTTPException(status_code=500, detail="Failed to list attachments")


@router.post("/attachments")
async def upload_journal_attachment(
    company_name: str = Query(...),
    batch_id: int = Form(...),
    line_id: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None),
    uploaded_by: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload a new attachment for a journal batch or line"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute("SELECT id FROM journal_batches WHERE id = %s", (batch_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Batch not found")

            if line_id:
                cursor.execute("SELECT id FROM journal_lines WHERE id = %s AND batch_id = %s", (line_id, batch_id))
                if not cursor.fetchone():
                    raise HTTPException(status_code=404, detail="Journal line not found in batch")

            dest_dir = get_company_upload_dir(company_name)
            unique_name = f"{uuid.uuid4().hex}_{file.filename}"
            dest_path = dest_dir / unique_name

            with dest_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            cursor.execute(
                """
                INSERT INTO journal_attachments (
                    batch_id, line_id, file_name, file_path, file_type,
                    file_size, description, metadata, uploaded_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, uploaded_at
                """,
                (
                    batch_id,
                    line_id,
                    file.filename,
                    str(dest_path),
                    file.content_type,
                    dest_path.stat().st_size,
                    description,
                    json.dumps(json.loads(metadata) if metadata else {}),
                    uploaded_by
                )
            )

            attachment_id, uploaded_at = cursor.fetchone()
            conn.commit()

            attachment = {
                "id": attachment_id,
                "batch_id": batch_id,
                "line_id": line_id,
                "file_name": file.filename,
                "file_path": str(dest_path),
                "file_type": file.content_type,
                "file_size": dest_path.stat().st_size,
                "description": description,
                "metadata": json.loads(metadata) if metadata else {},
                "uploaded_by": uploaded_by,
                "uploaded_at": uploaded_at
            }

            return {"attachment": attachment}

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="metadata must be valid JSON")
    except Exception as e:
        logger.error(f"Error uploading attachment: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload attachment")
    finally:
        file.file.close()


@router.delete("/attachments/{attachment_id}")
async def delete_journal_attachment(
    attachment_id: int,
    company_name: str = Query(...)
):
    """Delete an attachment and remove the stored file"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                "SELECT file_path FROM journal_attachments WHERE id = %s",
                (attachment_id,)
            )
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Attachment not found")

            file_path = Path(result[0])
            cursor.execute("DELETE FROM journal_attachments WHERE id = %s", (attachment_id,))
            conn.commit()

            try:
                if file_path.exists():
                    file_path.unlink()
            except Exception as file_error:
                logger.warning(f"Failed to delete attachment file {file_path}: {file_error}")

            return {"message": "Attachment deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting attachment: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete attachment")


# ==================== TEMPLATES ENDPOINTS ====================

@router.get("/templates")
async def get_journal_templates(
    company_name: str = Query(...),
    category: Optional[str] = Query(None)
):
    """Get journal entry templates"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            
            query = "SELECT * FROM journal_templates WHERE is_active = true"
            params = []
            
            if category:
                query += " AND category = %s"
                params.append(category)
            
            query += " ORDER BY template_name"
            
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            columns = [desc[0] for desc in cursor.description]
            templates = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return {"templates": templates}
            
    except Exception as e:
        logger.error(f"Error fetching templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates")
async def create_journal_template(
    template_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Create new journal template"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO journal_templates (
                    template_name, template_code, description, category,
                    is_recurring, recurrence_pattern, default_entity,
                    default_scenario, template_lines, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                template_data.get('template_name'),
                template_data.get('template_code'),
                template_data.get('description', ''),
                template_data.get('category'),
                template_data.get('is_recurring', False),
                template_data.get('recurrence_pattern'),
                template_data.get('default_entity'),
                template_data.get('default_scenario'),
                json.dumps(template_data.get('template_lines', [])),
                template_data.get('created_by', 'system')
            ))
            
            template_id = cursor.fetchone()[0]
            conn.commit()
            
            return {"template_id": template_id}
            
    except Exception as e:
        logger.error(f"Error creating template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates/{template_id}/apply")
async def apply_journal_template(
    template_id: int,
    application_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Apply template to create journal batch"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            template = fetch_template(conn, template_id)
            if not template:
                raise HTTPException(status_code=404, detail="Template not found")

            actor = application_data.get('created_by', 'system')
            result = create_batch_from_template(conn, template, application_data, actor=actor)
            batch = fetch_batch(conn, result["batch_id"])

            workflow = get_applicable_workflow(conn, batch)
            if workflow:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE journal_batches
                    SET workflow_config = %s,
                        workflow_status = 'pending'
                    WHERE id = %s
                    """,
                    (json.dumps({"workflow_id": workflow["id"], "workflow_name": workflow["workflow_name"]}), result["batch_id"])
                )

            record_status_history(
                conn,
                batch_id=result["batch_id"],
                previous_status=None,
                new_status=batch.get('status') if batch else None,
                changed_by=actor,
                reason="Generated from template",
                metadata={"template_id": template_id}
            )

            conn.commit()
            return result
            
    except Exception as e:
        logger.error(f"Error applying template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== RECURRING ENTRIES ENDPOINTS ====================

@router.get("/recurring")
async def get_recurring_entries(
    company_name: str = Query(...),
    status: Optional[str] = Query(None)
):
    """Get recurring journal entries"""
    try:
        with get_company_connection(company_name) as conn:
            query = """
                SELECT jb.*, jt.template_name, jt.recurrence_pattern
                FROM journal_batches jb
                LEFT JOIN journal_templates jt ON jb.recurring_template_id = jt.id
                WHERE jb.recurring_template_id IS NOT NULL
            """
            params = []
            
            if status:
                query += " AND jb.status = %s"
                params.append(status)
            
            query += " ORDER BY jb.created_at DESC"
            
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            columns = [desc[0] for desc in cursor.description]
            entries = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return {"recurring_entries": entries}
            
    except Exception as e:
        logger.error(f"Error fetching recurring entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recurring/generate")
async def generate_recurring_entries(
    generation_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Generate recurring entries for a period"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)

            scheduler = RecurringScheduler(conn, company_name)
            generated = scheduler.generate_for_period(
                fiscal_year=generation_data.get('fiscal_year'),
                period=generation_data.get('period'),
                run_date=generation_data.get('transaction_date'),
                actor=generation_data.get('created_by', 'system')
            )

            conn.commit()
            return {"generated_batches": generated}
            
    except Exception as e:
        logger.error(f"Error generating recurring entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== VALIDATION & APPROVAL ENDPOINTS ====================

@router.post("/batches/{batch_id}/validate")
async def validate_journal_batch(
    batch_id: int,
    company_name: str = Query(...)
):
    """Validate journal batch for posting"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()

            # Get batch and lines
            cursor.execute("SELECT * FROM journal_batches WHERE id = %s", (batch_id,))
            batch = cursor.fetchone()
            if not batch:
                raise HTTPException(status_code=404, detail="Batch not found")

            cursor.execute("SELECT * FROM journal_lines WHERE batch_id = %s", (batch_id,))
            lines = cursor.fetchall()
            
            validation_results = {
                "is_valid": True,
                "errors": [],
                "warnings": [],
                "summary": {}
            }
            
            # Validation rules
            if not lines:
                validation_results["errors"].append("Batch has no journal lines")
                validation_results["is_valid"] = False
            
            # Check debit/credit balance
            total_debits = sum(line[11] for line in lines if line[7])  # account_debit_code exists
            total_credits = sum(line[11] for line in lines if line[9])  # account_credit_code exists
            
            if abs(total_debits - total_credits) > 0.01:  # Allow for rounding
                validation_results["errors"].append(f"Debits ({total_debits}) do not equal Credits ({total_credits})")
                validation_results["is_valid"] = False
            
            # Check required fields
            for i, line in enumerate(lines):
                line_errors = []
                if not line[7] and not line[9]:  # No debit or credit account
                    line_errors.append("Missing both debit and credit accounts")
                if not line[12]:  # No description
                    line_errors.append("Missing description")
                if line[11] <= 0:  # Amount <= 0
                    line_errors.append("Amount must be greater than 0")
                
                if line_errors:
                    validation_results["errors"].extend([f"Line {i+1}: {error}" for error in line_errors])
                    validation_results["is_valid"] = False
            
            # Update batch validation status
            cursor.execute("""
                UPDATE journal_batches 
                SET is_balanced = %s 
                WHERE id = %s
            """, (validation_results["is_valid"], batch_id))
            log_audit_event(
                conn,
                batch_id=batch_id,
                line_id=None,
                action_type="validate_batch",
                action_description="Batch validation executed",
                new_values={"validation": validation_results},
                performed_by="system"
            )
            conn.commit()
            
            validation_results["summary"] = {
                "total_lines": len(lines),
                "total_debits": total_debits,
                "total_credits": total_credits,
                "is_balanced": abs(total_debits - total_credits) <= 0.01
            }
            
            return validation_results
            
    except Exception as e:
        logger.error(f"Error validating batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batches/{batch_id}/submit")
async def submit_journal_batch(
    batch_id: int,
    submission_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Submit journal batch for approval"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()

            # Validate first
            batch = fetch_batch(conn, batch_id)
            if not batch:
                raise HTTPException(status_code=404, detail="Batch not found")

            if batch.get('status') not in ('draft', 'rejected'):
                raise HTTPException(status_code=400, detail="Only draft batches can be submitted")

            if is_period_locked(
                conn,
                batch.get('fiscal_year'),
                batch.get('period'),
                batch.get('process_id'),
                batch.get('entity_id'),
                batch.get('scenario_id')
            ):
                raise HTTPException(status_code=403, detail="Period is locked for this context")

            validation = await validate_journal_batch(batch_id, company_name)
            if not validation["is_valid"]:
                raise HTTPException(status_code=400, detail="Batch validation failed")

            updated_batch = fetch_batch(conn, batch_id)
            if not updated_batch or not updated_batch.get('is_balanced'):
                raise HTTPException(status_code=400, detail="Batch must be balanced before submission")

            previous_status = batch.get('status')
            # Update batch status
            cursor.execute("""
                UPDATE journal_batches 
                SET status = 'submitted', 
                    workflow_status = 'pending_approval',
                    modified_by = %s,
                    modified_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (submission_data.get('submitted_by', 'system'), batch_id))
            
            log_audit_event(
                conn,
                batch_id=batch_id,
                line_id=None,
                action_type='submit',
                action_description=f"Batch submitted for approval: {submission_data.get('comments', '')}",
                performed_by=submission_data.get('submitted_by', 'system')
            )
            existing = fetch_batch(conn, batch_id)
            record_status_history(
                conn,
                batch_id=batch_id,
                previous_status=previous_status,
                new_status='submitted',
                changed_by=submission_data.get('submitted_by', 'system'),
                reason=submission_data.get('comments'),
                metadata={"validation": validation}
            )
            
            conn.commit()
            return {"message": "Batch submitted successfully"}
            
    except Exception as e:
        logger.error(f"Error submitting batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batches/{batch_id}/approve")
async def approve_journal_batch(
    batch_id: int,
    approval_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Approve journal batch"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()

            batch = fetch_batch(conn, batch_id)
            if not batch:
                raise HTTPException(status_code=404, detail="Batch not found")

            if batch.get('status') != 'submitted':
                raise HTTPException(status_code=400, detail="Only submitted batches can be approved")

            if is_period_locked(
                conn,
                batch.get('fiscal_year'),
                batch.get('period'),
                batch.get('process_id'),
                batch.get('entity_id'),
                batch.get('scenario_id')
            ):
                raise HTTPException(status_code=403, detail="Period is locked for this context")

            previous_status = batch.get('status')
            # Update batch status
            cursor.execute("""
                UPDATE journal_batches 
                SET status = 'approved', 
                    workflow_status = 'approved',
                    approved_by = %s,
                    approved_at = CURRENT_TIMESTAMP,
                    modified_by = %s,
                    modified_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                approval_data.get('approved_by', 'system'),
                approval_data.get('approved_by', 'system'),
                batch_id
            ))
            
            log_audit_event(
                conn,
                batch_id=batch_id,
                line_id=None,
                action_type='approve',
                action_description=f"Batch approved: {approval_data.get('comments', '')}",
                performed_by=approval_data.get('approved_by', 'system')
            )
            existing = fetch_batch(conn, batch_id)
            record_status_history(
                conn,
                batch_id=batch_id,
                previous_status=previous_status,
                new_status='approved',
                changed_by=approval_data.get('approved_by', 'system'),
                reason=approval_data.get('comments')
            )
            
            conn.commit()
            return {"message": "Batch approved successfully"}
            
    except Exception as e:
        logger.error(f"Error approving batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batches/{batch_id}/post")
async def post_journal_batch(
    batch_id: int,
    posting_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Post journal batch to ledger"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()

            # Check if approved
            batch = fetch_batch(conn, batch_id)
            if not batch:
                raise HTTPException(status_code=404, detail="Batch not found")

            if batch.get('status') != 'approved':
                raise HTTPException(status_code=400, detail="Batch must be approved before posting")

            if is_period_locked(
                conn,
                batch.get('fiscal_year'),
                batch.get('period'),
                batch.get('process_id'),
                batch.get('entity_id'),
                batch.get('scenario_id')
            ):
                raise HTTPException(status_code=403, detail="Period is locked for this context")

            # Ensure batch is balanced before posting
            validation = await validate_journal_batch(batch_id, company_name)
            if not validation["is_valid"]:
                raise HTTPException(status_code=400, detail="Batch validation failed before posting")

            refreshed_batch = fetch_batch(conn, batch_id)
            if not refreshed_batch or not refreshed_batch.get('is_balanced'):
                raise HTTPException(status_code=400, detail="Batch must be balanced before posting")

            previous_status = batch.get('status')
            # Update batch status
            cursor.execute("""
                UPDATE journal_batches 
                SET status = 'posted', 
                    workflow_status = 'posted',
                    posted_by = %s,
                    posted_at = CURRENT_TIMESTAMP,
                    modified_by = %s,
                    modified_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                posting_data.get('posted_by', 'system'),
                posting_data.get('posted_by', 'system'),
                batch_id
            ))
            
            log_audit_event(
                conn,
                batch_id=batch_id,
                line_id=None,
                action_type='post',
                action_description=f"Batch posted to ledger: {posting_data.get('comments', '')}",
                performed_by=posting_data.get('posted_by', 'system')
            )
            existing = fetch_batch(conn, batch_id)
            record_status_history(
                conn,
                batch_id=batch_id,
                previous_status=previous_status,
                new_status='posted',
                changed_by=posting_data.get('posted_by', 'system'),
                reason=posting_data.get('comments'),
                metadata={"validation": validation}
            )
            
            conn.commit()
            return {"message": "Batch posted successfully"}
            
    except Exception as e:
        logger.error(f"Error posting batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batches/{batch_id}/audit-trail")
async def get_batch_audit_trail(
    batch_id: int,
    company_name: str = Query(...)
):
    """Get audit trail for journal batch"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM journal_audit_logs 
                WHERE batch_id = %s 
                ORDER BY performed_at DESC
            """, (batch_id,))
            
            columns = [desc[0] for desc in cursor.description]
            audit_trail = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return {"audit_trail": audit_trail}
            
    except Exception as e:
        logger.error(f"Error fetching audit trail: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batches/{batch_id}/status-history")
async def get_batch_status_history(
    batch_id: int,
    company_name: str = Query(...)
):
    """Get status history timeline for a batch"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT * FROM journal_status_history
                WHERE batch_id = %s
                ORDER BY changed_at DESC
                """,
                (batch_id,)
            )

            columns = [desc[0] for desc in cursor.description]
            history = [dict(zip(columns, row)) for row in cursor.fetchall()]
            return {"status_history": history}

    except Exception as e:
        logger.error(f"Error fetching status history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/period-locks")
async def list_period_locks(
    company_name: str = Query(...),
    fiscal_year: Optional[str] = Query(None),
    period: Optional[str] = Query(None)
):
    """List configured period locks"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()
            query = """
                SELECT * FROM journal_period_locks
                WHERE 1=1
            """
            params: List[Any] = []
            if fiscal_year:
                query += " AND fiscal_year = %s"
                params.append(fiscal_year)
            if period:
                query += " AND period = %s"
                params.append(period)

            query += " ORDER BY fiscal_year DESC, period DESC"
            cursor.execute(query, params)

            columns = [desc[0] for desc in cursor.description]
            locks = [dict(zip(columns, row)) for row in cursor.fetchall()]
            return {"locks": locks, "count": len(locks)}

    except Exception as e:
        logger.error(f"Error listing period locks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/period-locks")
async def create_period_lock(
    lock_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Create or update a period lock"""
    required = ["fiscal_year", "period", "is_locked", "changed_by"]
    missing = [field for field in required if lock_data.get(field) in (None, "")]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")

    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()

            cursor.execute(
                """
                INSERT INTO journal_period_locks (
                    process_id, entity_id, scenario_id, fiscal_year, period,
                    is_locked, locked_by, locked_at, reason, metadata
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, %s, %s)
                ON CONFLICT (process_id, entity_id, scenario_id, fiscal_year, period)
                DO UPDATE SET
                    is_locked = EXCLUDED.is_locked,
                    locked_by = EXCLUDED.locked_by,
                    locked_at = EXCLUDED.locked_at,
                    reason = EXCLUDED.reason,
                    metadata = EXCLUDED.metadata
                RETURNING id
                """,
                (
                    lock_data.get('process_id'),
                    lock_data.get('entity_id'),
                    lock_data.get('scenario_id'),
                    lock_data['fiscal_year'],
                    lock_data['period'],
                    lock_data['is_locked'],
                    lock_data['changed_by'],
                    lock_data.get('reason'),
                    json.dumps(lock_data.get('metadata', {}))
                )
            )

            lock_id = cursor.fetchone()[0]
            conn.commit()
            return {"lock_id": lock_id}

    except Exception as e:
        logger.error(f"Error creating period lock: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/period-locks/{lock_id}")
async def delete_period_lock(
    lock_id: int,
    company_name: str = Query(...)
):
    """Delete a period lock"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM journal_period_locks WHERE id = %s", (lock_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Lock not found")
            conn.commit()
            return {"message": "Period lock removed"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting period lock: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== HELPER FUNCTIONS ====================

def create_journal_tables(conn):
    """Create or evolve journal entry tables for a company database"""
    cursor = conn.cursor()

    # ===================== MASTER DATA TABLES =====================
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_categories (
            id SERIAL PRIMARY KEY,
            category_code VARCHAR(50) UNIQUE NOT NULL,
            category_name VARCHAR(200) NOT NULL,
            description TEXT,
            color VARCHAR(20),
            requires_attachments BOOLEAN DEFAULT false,
            required_custom_fields JSONB DEFAULT '[]',
            default_approval_workflow_id INTEGER,
            default_debit_account VARCHAR(50),
            default_credit_account VARCHAR(50),
            metadata JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_by VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_period_locks (
            id SERIAL PRIMARY KEY,
            process_id INTEGER,
            entity_id VARCHAR(50),
            scenario_id INTEGER,
            fiscal_year VARCHAR(50) NOT NULL,
            period VARCHAR(50) NOT NULL,
            is_locked BOOLEAN DEFAULT false,
            locked_by VARCHAR(100),
            locked_at TIMESTAMP,
            reason TEXT,
            metadata JSONB DEFAULT '{}',
            UNIQUE (process_id, entity_id, scenario_id, fiscal_year, period)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_approval_workflows (
            id SERIAL PRIMARY KEY,
            workflow_name VARCHAR(200) NOT NULL,
            amount_threshold DECIMAL(15,2),
            requires_all_approvers BOOLEAN DEFAULT false,
            approver_levels JSONB DEFAULT '[]',
            categories JSONB DEFAULT '[]',
            entity_codes JSONB DEFAULT '[]',
            metadata JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_by VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_onboarding_checklist (
            id SERIAL PRIMARY KEY,
            process_id INTEGER,
            entity_id VARCHAR(50),
            scenario_id INTEGER,
            fiscal_year VARCHAR(50),
            period VARCHAR(50),
            categories_configured BOOLEAN DEFAULT false,
            approvals_configured BOOLEAN DEFAULT false,
            templates_created BOOLEAN DEFAULT false,
            recurring_configured BOOLEAN DEFAULT false,
            custom_fields_configured BOOLEAN DEFAULT false,
            attachments_configured BOOLEAN DEFAULT false,
            notes TEXT,
            metadata JSONB DEFAULT '{}',
            created_by VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP
        )
        """
    )

    # ===================== JOURNAL BATCH HEADER =====================
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_batches (
            id SERIAL PRIMARY KEY,
            batch_number VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            process_id INTEGER,
            entity_id VARCHAR(50),
            scenario_id INTEGER,
            fiscal_year VARCHAR(50),
            period VARCHAR(50),
            category VARCHAR(100) NOT NULL,
            journal_type VARCHAR(50) DEFAULT 'manual',
            status VARCHAR(50) DEFAULT 'draft',
            workflow_status VARCHAR(50) DEFAULT 'pending',
            created_by VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP,
            approved_by VARCHAR(100),
            approved_at TIMESTAMP,
            posted_by VARCHAR(100),
            posted_at TIMESTAMP,
            total_debits DECIMAL(15,2) DEFAULT 0,
            total_credits DECIMAL(15,2) DEFAULT 0,
            is_balanced BOOLEAN DEFAULT false,
            auto_reverse BOOLEAN DEFAULT false,
            auto_reverse_date TIMESTAMP
        )
        """
    )

    cursor.execute(
        """ALTER TABLE journal_batches
                 ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES journal_categories(id)"""
    )
    cursor.execute(
        """ALTER TABLE journal_batches
                 ADD COLUMN IF NOT EXISTS category_code VARCHAR(50)"""
    )
    cursor.execute(
        """ALTER TABLE journal_batches
                 ADD COLUMN IF NOT EXISTS status_reason TEXT"""
    )
    cursor.execute(
        """ALTER TABLE journal_batches
                 ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100)"""
    )
    cursor.execute(
        """ALTER TABLE journal_batches
                 ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP"""
    )
    cursor.execute(
        """ALTER TABLE journal_batches
                 ADD COLUMN IF NOT EXISTS workflow_config JSONB DEFAULT '{}'"""
    )
    cursor.execute(
        """ALTER TABLE journal_batches
                 ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'"""
    )
    cursor.execute(
        """ALTER TABLE journal_batches
                 ADD COLUMN IF NOT EXISTS onboarding_checklist_id INTEGER REFERENCES journal_onboarding_checklist(id)"""
    )

    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_journal_batches_context
            ON journal_batches (process_id, entity_id, scenario_id, fiscal_year, period)
        """
    )
    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_journal_batches_status
            ON journal_batches (status, workflow_status)
        """
    )

    # ===================== JOURNAL LINES =====================
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_lines (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER REFERENCES journal_batches(id) ON DELETE CASCADE,
            line_number INTEGER NOT NULL,
            transaction_date TIMESTAMP NOT NULL,
            period VARCHAR(50) NOT NULL,
            entity_code VARCHAR(50) NOT NULL,
            entity_name VARCHAR(200),
            account_debit_code VARCHAR(50),
            account_debit_name VARCHAR(200),
            account_credit_code VARCHAR(50),
            account_credit_name VARCHAR(200),
            amount DECIMAL(15,2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            exchange_rate DECIMAL(10,6) DEFAULT 1.0,
            description TEXT NOT NULL,
            reference_number VARCHAR(100),
            memo TEXT,
            from_entity VARCHAR(50),
            to_entity VARCHAR(50),
            custom_fields JSONB DEFAULT '{}',
            attachment_links JSONB DEFAULT '[]',
            created_by VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP
        )
        """
    )

    cursor.execute(
        """ALTER TABLE journal_lines
                 ADD COLUMN IF NOT EXISTS entry_type VARCHAR(10)"""
    )
    cursor.execute(
        """ALTER TABLE journal_lines
                 ADD COLUMN IF NOT EXISTS account_code VARCHAR(50)"""
    )
    cursor.execute(
        """ALTER TABLE journal_lines
                 ADD COLUMN IF NOT EXISTS account_name VARCHAR(200)"""
    )
    cursor.execute(
        """ALTER TABLE journal_lines
                 ADD COLUMN IF NOT EXISTS debit_amount DECIMAL(15,2)"""
    )
    cursor.execute(
        """ALTER TABLE journal_lines
                 ADD COLUMN IF NOT EXISTS credit_amount DECIMAL(15,2)"""
    )
    cursor.execute(
        """ALTER TABLE journal_lines
                 ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50)"""
    )
    cursor.execute(
        """CREATE INDEX IF NOT EXISTS idx_journal_lines_batch ON journal_lines (batch_id)"""
    )
    cursor.execute(
        """CREATE INDEX IF NOT EXISTS idx_journal_lines_entity ON journal_lines (entity_code)"""
    )

    # ===================== JOURNAL TEMPLATES & RECURRING =====================
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_templates (
            id SERIAL PRIMARY KEY,
            template_name VARCHAR(200) NOT NULL,
            template_code VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            category VARCHAR(100) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            is_recurring BOOLEAN DEFAULT false,
            recurrence_pattern VARCHAR(50),
            default_entity VARCHAR(50),
            default_scenario VARCHAR(50),
            template_lines JSONB DEFAULT '[]',
            created_by VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP
        )
        """
    )

    cursor.execute(
        """ALTER TABLE journal_templates
                 ADD COLUMN IF NOT EXISTS recurrence_frequency VARCHAR(50)"""
    )
    cursor.execute(
        """ALTER TABLE journal_templates
                 ADD COLUMN IF NOT EXISTS recurrence_end_date DATE"""
    )
    cursor.execute(
        """ALTER TABLE journal_templates
                 ADD COLUMN IF NOT EXISTS next_run_date DATE"""
    )
    cursor.execute(
        """ALTER TABLE journal_templates
                 ADD COLUMN IF NOT EXISTS auto_post BOOLEAN DEFAULT false"""
    )
    cursor.execute(
        """ALTER TABLE journal_templates
                 ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'"""
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_recurring_schedules (
            id SERIAL PRIMARY KEY,
            template_id INTEGER REFERENCES journal_templates(id) ON DELETE CASCADE,
            next_run_date DATE,
            end_date DATE,
            recurrence_frequency VARCHAR(50),
            occurrences_run INTEGER DEFAULT 0,
            max_occurrences INTEGER,
            metadata JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        )
        """
    )

    cursor.execute(
        """ALTER TABLE journal_recurring_schedules
                 ADD COLUMN IF NOT EXISTS last_run_date TIMESTAMP"""
    )
    cursor.execute(
        """ALTER TABLE journal_recurring_schedules
                 ADD COLUMN IF NOT EXISTS last_batch_id INTEGER"""
    )
    cursor.execute(
        """ALTER TABLE journal_recurring_schedules
                 ADD COLUMN IF NOT EXISTS last_fiscal_year VARCHAR(50)"""
    )
    cursor.execute(
        """ALTER TABLE journal_recurring_schedules
                 ADD COLUMN IF NOT EXISTS last_period VARCHAR(50)"""
    )
    cursor.execute(
        """ALTER TABLE journal_recurring_schedules
                 ADD COLUMN IF NOT EXISTS last_generated_by VARCHAR(100)"""
    )
    cursor.execute(
        """CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_template
                 ON journal_recurring_schedules (template_id)"""
    )

    # ===================== ATTACHMENTS & UPLOADS =====================
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_attachments (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER REFERENCES journal_batches(id) ON DELETE CASCADE,
            line_id INTEGER REFERENCES journal_lines(id) ON DELETE CASCADE,
            file_name VARCHAR(500) NOT NULL,
            file_path VARCHAR(1000) NOT NULL,
            file_type VARCHAR(50),
            file_size BIGINT,
            description TEXT,
            metadata JSONB DEFAULT '{}',
            uploaded_by VARCHAR(100) NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_upload_batches (
            id SERIAL PRIMARY KEY,
            upload_batch_id VARCHAR(100) UNIQUE NOT NULL,
            filename VARCHAR(500) NOT NULL,
            status VARCHAR(50) DEFAULT 'processing',
            total_rows INTEGER DEFAULT 0,
            successful_rows INTEGER DEFAULT 0,
            failed_rows INTEGER DEFAULT 0,
            error_log JSONB DEFAULT '[]',
            uploaded_by VARCHAR(100) NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP,
            metadata JSONB DEFAULT '{}'
        )
        """
    )

    # ===================== AUDIT & STATUS HISTORY =====================
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_audit_logs (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER REFERENCES journal_batches(id) ON DELETE CASCADE,
            line_id INTEGER REFERENCES journal_lines(id) ON DELETE SET NULL,
            action_type VARCHAR(50) NOT NULL,
            action_description TEXT,
            old_values JSONB DEFAULT '{}',
            new_values JSONB DEFAULT '{}',
            performed_by VARCHAR(100) NOT NULL,
            performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address VARCHAR(50),
            user_agent VARCHAR(500)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS journal_status_history (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER REFERENCES journal_batches(id) ON DELETE CASCADE,
            previous_status VARCHAR(50),
            new_status VARCHAR(50) NOT NULL,
            changed_by VARCHAR(100) NOT NULL,
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reason TEXT,
            metadata JSONB DEFAULT '{}'
        )
        """
    )

    conn.commit()

def generate_batch_number(conn):
    """Generate unique batch number"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COALESCE(MAX(CAST(SUBSTRING(batch_number FROM 3) AS INTEGER)), 0) + 1
        FROM journal_batches 
        WHERE batch_number LIKE 'JE%'
    """)
    next_number = cursor.fetchone()[0]
    return f"JE{next_number:06d}"

def update_batch_totals(conn, batch_id):
    """Update batch debit/credit totals"""
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE journal_batches 
        SET total_debits = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM journal_lines 
            WHERE batch_id = %s AND account_debit_code IS NOT NULL
        ),
        total_credits = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM journal_lines 
            WHERE batch_id = %s AND account_credit_code IS NOT NULL
        )
        WHERE id = %s
    """, (batch_id, batch_id, batch_id))
    
    # Check if balanced
    cursor.execute("""
        UPDATE journal_batches 
        SET is_balanced = (total_debits = total_credits)
        WHERE id = %s
    """, (batch_id,))


def log_audit_event(
    conn,
    batch_id: int,
    line_id: Optional[int],
    action_type: str,
    action_description: str,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    performed_by: str = "system",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Insert an audit log entry for journal activity"""
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO journal_audit_logs (
            batch_id, line_id, action_type, action_description,
            old_values, new_values, performed_by, ip_address, user_agent
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            batch_id,
            line_id,
            action_type,
            action_description,
            json.dumps(old_values or {}),
            json.dumps(new_values or {}),
            performed_by,
            ip_address,
            user_agent
        )
    )


def record_status_history(
    conn,
    batch_id: int,
    previous_status: Optional[str],
    new_status: str,
    changed_by: str,
    reason: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """Record a batch status transition"""
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO journal_status_history (
            batch_id, previous_status, new_status, changed_by, reason, metadata
        ) VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            batch_id,
            previous_status,
            new_status,
            changed_by,
            reason,
            json.dumps(metadata or {})
        )
    )


def get_applicable_workflow(conn, batch: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Resolve approval workflow based on batch context"""
    cursor = conn.cursor()

    # Direct category assignment first
    if batch.get("category_id"):
        cursor.execute(
            """
            SELECT jaw.*
            FROM journal_approval_workflows jaw
            JOIN journal_categories jc ON jc.default_approval_workflow_id = jaw.id
            WHERE jc.id = %s AND jaw.is_active = true
            """,
            (batch["category_id"],)
        )
        result = cursor.fetchone()
        if result:
            columns = [desc[0] for desc in cursor.description]
            return dict(zip(columns, result))

    # Otherwise match by thresholds/categories/entities
    cursor.execute(
        """
        SELECT *
        FROM journal_approval_workflows
        WHERE is_active = true
          AND (categories = '[]'::jsonb OR categories IS NULL OR categories @> %s)
          AND (entity_codes = '[]'::jsonb OR entity_codes IS NULL OR entity_codes @> %s)
          AND (amount_threshold IS NULL OR amount_threshold <= %s)
        ORDER BY amount_threshold DESC NULLS LAST
        LIMIT 1
        """,
        (
            json.dumps([batch.get("category_code")]) if batch.get("category_code") else json.dumps([]),
            json.dumps([batch.get("entity_id")]) if batch.get("entity_id") else json.dumps([]),
            batch.get("total_debits", 0)
        )
    )

    result = cursor.fetchone()
    if result:
        columns = [desc[0] for desc in cursor.description]
        return dict(zip(columns, result))
    return None


def is_period_locked(
    conn,
    fiscal_year: Optional[str],
    period: Optional[str],
    process_id: Optional[int],
    entity_id: Optional[str],
    scenario_id: Optional[int]
) -> bool:
    """Check if a given context is locked for journal activity"""
    if not fiscal_year or not period:
        return False

    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT is_locked
        FROM journal_period_locks
        WHERE fiscal_year = %s
          AND period = %s
          AND (process_id = %s OR process_id IS NULL)
          AND (entity_id = %s OR entity_id IS NULL)
          AND (scenario_id = %s OR scenario_id IS NULL)
        ORDER BY 
          CASE WHEN process_id IS NULL THEN 1 ELSE 0 END,
          CASE WHEN entity_id IS NULL THEN 1 ELSE 0 END,
          CASE WHEN scenario_id IS NULL THEN 1 ELSE 0 END
        LIMIT 1
        """,
        (fiscal_year, period, process_id, entity_id, scenario_id)
    )
    result = cursor.fetchone()
    return bool(result and result[0])


def fetch_batch(conn, batch_id: int) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM journal_batches WHERE id = %s", (batch_id,))
    row = cursor.fetchone()
    if not row:
        return None
    columns = [desc[0] for desc in cursor.description]
    return dict(zip(columns, row))


def fetch_template(conn, template_id: int) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM journal_templates WHERE id = %s", (template_id,))
    row = cursor.fetchone()
    if not row:
        return None
    columns = [desc[0] for desc in cursor.description]
    template = dict(zip(columns, row))
    if isinstance(template.get("template_lines"), str):
        try:
            template["template_lines"] = json.loads(template["template_lines"] or "[]")
        except json.JSONDecodeError:
            template["template_lines"] = []
    return template


def create_batch_from_template(
    conn,
    template: Dict[str, Any],
    application_data: Dict[str, Any],
    actor: str = "system"
) -> Dict[str, Any]:
    cursor = conn.cursor()

    fiscal_year = application_data.get('fiscal_year')
    period = application_data.get('period')
    process_id = application_data.get('process_id')
    entity_id = application_data.get('entity_id') or template.get('default_entity')
    scenario_id = application_data.get('scenario_id') or template.get('default_scenario')

    if is_period_locked(conn, fiscal_year, period, process_id, entity_id, scenario_id):
        raise HTTPException(status_code=403, detail="Period is locked for this context")

    category_code = template.get('category')
    category_record = None
    if category_code:
        cursor.execute(
            """
            SELECT id, category_code, category_name
            FROM journal_categories
            WHERE (UPPER(category_code) = UPPER(%s) OR UPPER(category_name) = UPPER(%s))
              AND is_active = true
            LIMIT 1
            """,
            (category_code, category_code)
        )
        result = cursor.fetchone()
        if result:
            cat_cols = [desc[0] for desc in cursor.description]
            category_record = dict(zip(cat_cols, result))

    batch_number = generate_batch_number(conn)

    cursor.execute(
        """
        INSERT INTO journal_batches (
            batch_number, description, process_id, entity_id, scenario_id,
            fiscal_year, period, category, journal_type, status,
            created_by, total_debits, total_credits, is_balanced,
            category_code, recurring_template_id
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            batch_number,
            application_data.get('description') or template.get('description') or template.get('template_name'),
            process_id,
            entity_id,
            scenario_id,
            fiscal_year,
            period,
            category_record["category_name"] if category_record else category_code or 'Recurring',
            application_data.get('journal_type', template.get('journal_type', 'recurring')),
            application_data.get('status', 'draft'),
            actor,
            0,
            0,
            False,
            category_record["category_code"] if category_record else category_code,
            template.get('id')
        )
    )

    batch_id = cursor.fetchone()[0]

    if category_record:
        cursor.execute(
            "UPDATE journal_batches SET category_id = %s WHERE id = %s",
            (category_record["id"], batch_id)
        )

    line_date = application_data.get('transaction_date') or datetime.utcnow().date().isoformat()
    template_lines = template.get('template_lines') or []
    for idx, line in enumerate(template_lines, start=1):
        amount = application_data.get('amount', line.get('amount', 0))
        cursor.execute(
            """
            INSERT INTO journal_lines (
                batch_id, line_number, transaction_date, period,
                entity_code, entity_name, account_debit_code, account_debit_name,
                account_credit_code, account_credit_name, amount, currency,
                description, reference_number, created_by
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                batch_id,
                idx,
                application_data.get('transaction_date') or line.get('transaction_date') or line_date,
                period,
                line.get('entity_code') or entity_id,
                line.get('entity_name') or '',
                line.get('account_debit_code'),
                line.get('account_debit_name'),
                line.get('account_credit_code'),
                line.get('account_credit_name'),
                amount,
                line.get('currency', application_data.get('currency', 'INR')),
                line.get('description', template.get('template_name')),
                line.get('reference_number', application_data.get('reference_number')), 
                actor
            )
        )

    update_batch_totals(conn, batch_id)
    log_audit_event(
        conn,
        batch_id=batch_id,
        line_id=None,
        action_type="generate_from_template",
        action_description=f"Batch {batch_number} generated from template {template.get('template_code')}",
        new_values={"template_id": template.get('id'), "application_data": application_data},
        performed_by=actor
    )

    return {"batch_id": batch_id, "batch_number": batch_number}
