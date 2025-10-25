"""Extended Journal Entry Endpoints - Workflows, Templates, Attachments, Onboarding"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import Optional, Dict, Any, List
import json
from datetime import datetime, date, timedelta
import logging
import psycopg2
import os
import uuid
from pathlib import Path
import shutil

router = APIRouter(prefix="/journal-entry", tags=["Journal Entry Extended"])
logger = logging.getLogger(__name__)

# Import shared utilities
from .journal_utils import (
    get_company_connection, get_company_db_name, generate_batch_number,
    update_batch_totals, log_audit_event, create_journal_tables
)

# ==================== APPROVAL WORKFLOW ENDPOINTS ====================

@router.get("/approval-workflows")
async def get_approval_workflows(
    company_name: str = Query(...),
    include_inactive: bool = Query(False)
):
    """Get approval workflows"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()
            
            query = "SELECT * FROM journal_approval_workflows WHERE 1=1"
            params = []
            
            if not include_inactive:
                query += " AND is_active = TRUE"
            
            query += " ORDER BY workflow_name"
            
            cursor.execute(query, params)
            columns = [desc[0] for desc in cursor.description]
            workflows = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return {"workflows": workflows, "total": len(workflows)}
    except Exception as e:
        logger.error(f"Error fetching workflows: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approval-workflows")
async def create_approval_workflow(
    workflow_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Create new approval workflow"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO journal_approval_workflows (
                    workflow_name, amount_threshold, requires_all_approvers,
                    approver_levels, categories, entity_codes, metadata, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                workflow_data.get('workflow_name'),
                workflow_data.get('amount_threshold'),
                workflow_data.get('requires_all_approvers', False),
                json.dumps(workflow_data.get('approver_levels', [])),
                json.dumps(workflow_data.get('categories', [])),
                json.dumps(workflow_data.get('entity_codes', [])),
                json.dumps(workflow_data.get('metadata', {})),
                workflow_data.get('created_by', 'system')
            ))
            
            workflow_id = cursor.fetchone()[0]
            conn.commit()
            
            return {"workflow_id": workflow_id, "message": "Workflow created successfully"}
    except Exception as e:
        logger.error(f"Error creating workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TEMPLATES & RECURRING ENTRIES ====================

@router.get("/templates")
async def get_journal_templates(
    company_name: str = Query(...),
    category_id: Optional[int] = Query(None),
    is_recurring: Optional[bool] = Query(None)
):
    """Get journal entry templates"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()
            
            query = "SELECT * FROM journal_templates WHERE is_active = TRUE"
            params = []
            
            if category_id:
                query += " AND category_id = %s"
                params.append(category_id)
            
            if is_recurring is not None:
                query += " AND is_recurring = %s"
                params.append(is_recurring)
            
            query += " ORDER BY template_name"
            
            cursor.execute(query, params)
            columns = [desc[0] for desc in cursor.description]
            templates = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return {"templates": templates, "total": len(templates)}
    except Exception as e:
        logger.error(f"Error fetching templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates")
async def create_journal_template(
    template_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Create new journal entry template"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO journal_templates (
                    template_name, template_code, description, category_id,
                    is_recurring, recurrence_pattern, recurrence_end_date,
                    default_entity, default_scenario, template_lines, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                template_data.get('template_name'),
                template_data.get('template_code'),
                template_data.get('description'),
                template_data.get('category_id'),
                template_data.get('is_recurring', False),
                template_data.get('recurrence_pattern'),
                template_data.get('recurrence_end_date'),
                template_data.get('default_entity'),
                template_data.get('default_scenario'),
                json.dumps(template_data.get('template_lines', [])),
                template_data.get('created_by', 'system')
            ))
            
            template_id = cursor.fetchone()[0]
            conn.commit()
            
            return {"template_id": template_id, "message": "Template created successfully"}
    except Exception as e:
        logger.error(f"Error creating template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates/{template_id}/copy")
async def copy_journal_template(
    template_id: int,
    copy_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Copy/duplicate a journal template"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            
            # Get original template
            cursor.execute("SELECT * FROM journal_templates WHERE id = %s", (template_id,))
            columns = [desc[0] for desc in cursor.description]
            template = dict(zip(columns, cursor.fetchone()))
            
            if not template:
                raise HTTPException(status_code=404, detail="Template not found")
            
            # Create copy with new name/code
            new_code = copy_data.get('template_code', f"{template['template_code']}_copy")
            new_name = copy_data.get('template_name', f"{template['template_name']} (Copy)")
            
            cursor.execute("""
                INSERT INTO journal_templates (
                    template_name, template_code, description, category_id,
                    is_recurring, recurrence_pattern, recurrence_end_date,
                    default_entity, default_scenario, template_lines, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                new_name, new_code, template['description'], template['category_id'],
                template['is_recurring'], template['recurrence_pattern'],
                template['recurrence_end_date'], template['default_entity'],
                template['default_scenario'], json.dumps(template['template_lines']),
                copy_data.get('created_by', 'system')
            ))
            
            new_template_id = cursor.fetchone()[0]
            conn.commit()
            
            return {"template_id": new_template_id, "message": "Template copied successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error copying template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batches/{batch_id}/copy")
async def copy_journal_batch(
    batch_id: int,
    copy_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Copy/duplicate a journal batch"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            
            # Get original batch
            cursor.execute("SELECT * FROM journal_batches WHERE id = %s", (batch_id,))
            columns = [desc[0] for desc in cursor.description]
            batch = dict(zip(columns, cursor.fetchone()))
            
            if not batch:
                raise HTTPException(status_code=404, detail="Batch not found")
            
            # Create new batch
            new_batch_number = generate_batch_number(conn)
            cursor.execute("""
                INSERT INTO journal_batches (
                    batch_number, journal_reference, description, journal_date,
                    process_id, entity_id, scenario_id, fiscal_year, period,
                    category_id, category, journal_type, status, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                new_batch_number,
                copy_data.get('journal_reference', new_batch_number),
                batch['description'],
                copy_data.get('journal_date', date.today()),
                batch['process_id'],
                copy_data.get('entity_id', batch['entity_id']),
                copy_data.get('scenario_id', batch['scenario_id']),
                copy_data.get('fiscal_year', batch['fiscal_year']),
                copy_data.get('period', batch['period']),
                batch['category_id'],
                batch['category'],
                'manual',
                'draft',
                copy_data.get('created_by', 'system')
            ))
            
            new_batch_id = cursor.fetchone()[0]
            
            # Copy lines
            cursor.execute("SELECT * FROM journal_lines WHERE batch_id = %s", (batch_id,))
            lines = cursor.fetchall()
            line_columns = [desc[0] for desc in cursor.description]
            
            for line_data in lines:
                line = dict(zip(line_columns, line_data))
                cursor.execute("""
                    INSERT INTO journal_lines (
                        batch_id, line_number, entry_type, entity_code, entity_name,
                        account_code, account_name, amount, currency, description, created_by
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    new_batch_id, line['line_number'], line['entry_type'],
                    line['entity_code'], line['entity_name'],
                    line['account_code'], line['account_name'],
                    line['amount'], line['currency'], line['description'],
                    copy_data.get('created_by', 'system')
                ))
            
            update_batch_totals(conn, new_batch_id)
            log_audit_event(conn, new_batch_id, None, 'copy', f"Copied from batch {batch['batch_number']}",
                          performed_by=copy_data.get('created_by', 'system'))
            conn.commit()
            
            return {
                "batch_id": new_batch_id,
                "batch_number": new_batch_number,
                "message": "Batch copied successfully"
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error copying batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ATTACHMENTS ====================

@router.post("/batches/{batch_id}/attachments")
async def upload_journal_attachment(
    batch_id: int,
    file: UploadFile = File(...),
    company_name: str = Query(...),
    uploaded_by: str = Query('system')
):
    """Upload attachment for journal batch"""
    try:
        # Create upload directory
        upload_dir = Path("uploads") / "journal_attachments" / get_company_db_name(company_name)
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_ext = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = file_path.stat().st_size
        
        # Save to database
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO journal_attachments (
                    batch_id, filename, original_filename, file_path,
                    file_size, mime_type, uploaded_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                batch_id, unique_filename, file.filename, str(file_path),
                file_size, file.content_type, uploaded_by
            ))
            
            attachment_id = cursor.fetchone()[0]
            
            # Update attachment count
            cursor.execute("""
                UPDATE journal_batches
                SET attachment_count = (
                    SELECT COUNT(*) FROM journal_attachments WHERE batch_id = %s
                )
                WHERE id = %s
            """, (batch_id, batch_id))
            
            log_audit_event(conn, batch_id, None, 'attach_file',
                          f"Uploaded attachment: {file.filename}",
                          performed_by=uploaded_by)
            conn.commit()
            
            return {
                "attachment_id": attachment_id,
                "filename": unique_filename,
                "message": "File uploaded successfully"
            }
    except Exception as e:
        logger.error(f"Error uploading attachment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batches/{batch_id}/attachments")
async def get_journal_attachments(
    batch_id: int,
    company_name: str = Query(...)
):
    """Get attachments for journal batch"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM journal_attachments
                WHERE batch_id = %s
                ORDER BY uploaded_at DESC
            """, (batch_id,))
            
            columns = [desc[0] for desc in cursor.description]
            attachments = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return {"attachments": attachments, "total": len(attachments)}
    except Exception as e:
        logger.error(f"Error fetching attachments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ONBOARDING CHECKLIST ====================

@router.get("/onboarding")
async def get_onboarding_checklist(
    company_name: str = Query(...),
    process_id: Optional[int] = Query(None),
    entity_id: Optional[str] = Query(None),
    scenario_id: Optional[int] = Query(None),
    fiscal_year: Optional[str] = Query(None),
    period: Optional[str] = Query(None)
):
    """Get onboarding checklist"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()
            
            query = "SELECT * FROM journal_onboarding_checklist WHERE 1=1"
            params = []
            
            if process_id:
                query += " AND process_id = %s"
                params.append(process_id)
            if entity_id:
                query += " AND entity_id = %s"
                params.append(entity_id)
            if scenario_id:
                query += " AND scenario_id = %s"
                params.append(scenario_id)
            if fiscal_year:
                query += " AND fiscal_year = %s"
                params.append(fiscal_year)
            if period:
                query += " AND period = %s"
                params.append(period)
            
            cursor.execute(query, params)
            columns = [desc[0] for desc in cursor.description]
            result = cursor.fetchone()
            
            if result:
                checklist = dict(zip(columns, result))
            else:
                # Create new checklist if not exists
                cursor.execute("""
                    INSERT INTO journal_onboarding_checklist (
                        process_id, entity_id, scenario_id, fiscal_year, period, created_by
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING *
                """, (process_id, entity_id, scenario_id, fiscal_year, period, 'system'))
                columns = [desc[0] for desc in cursor.description]
                checklist = dict(zip(columns, cursor.fetchone()))
                conn.commit()
            
            return {"checklist": checklist}
    except Exception as e:
        logger.error(f"Error fetching onboarding checklist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/onboarding/{checklist_id}")
async def update_onboarding_checklist(
    checklist_id: int,
    checklist_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Update onboarding checklist"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            
            update_fields = []
            params = []
            
            for field in ['categories_configured', 'approvals_configured', 'templates_created',
                         'recurring_configured', 'custom_fields_configured', 'attachments_configured', 'notes']:
                if field in checklist_data:
                    update_fields.append(f"{field} = %s")
                    params.append(checklist_data[field])
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            params.append(checklist_id)
            
            cursor.execute(f"""
                UPDATE journal_onboarding_checklist
                SET {', '.join(update_fields)}, modified_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """, params)
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Checklist not found")
            
            columns = [desc[0] for desc in cursor.description]
            checklist = dict(zip(columns, cursor.fetchone()))
            conn.commit()
            
            return {"checklist": checklist, "message": "Checklist updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating onboarding checklist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PERIOD LOCKS ====================

@router.post("/period-locks")
async def lock_period(
    lock_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Lock a period to prevent further journal entries"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO journal_period_locks (
                    fiscal_year, period, process_id, entity_id, scenario_id,
                    is_locked, locked_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (fiscal_year, period, process_id, entity_id, scenario_id)
                DO UPDATE SET is_locked = EXCLUDED.is_locked,
                            locked_by = EXCLUDED.locked_by,
                            locked_at = CURRENT_TIMESTAMP
                RETURNING id
            """, (
                lock_data.get('fiscal_year'),
                lock_data.get('period'),
                lock_data.get('process_id'),
                lock_data.get('entity_id'),
                lock_data.get('scenario_id'),
                True,
                lock_data.get('locked_by', 'system')
            ))
            
            lock_id = cursor.fetchone()[0]
            conn.commit()
            
            return {"lock_id": lock_id, "message": "Period locked successfully"}
    except Exception as e:
        logger.error(f"Error locking period: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/period-locks/{lock_id}")
async def unlock_period(
    lock_id: int,
    unlock_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Unlock a period"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE journal_period_locks
                SET is_locked = FALSE, unlock_reason = %s
                WHERE id = %s
                RETURNING id
            """, (unlock_data.get('unlock_reason', 'Manual unlock'), lock_id))
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Lock not found")
            
            conn.commit()
            return {"message": "Period unlocked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unlocking period: {e}")
        raise HTTPException(status_code=500, detail=str(e))
