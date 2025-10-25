from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import Optional, Dict, Any, List
import json
from datetime import datetime, date
import logging
import psycopg2
import os
import uuid
from pathlib import Path

# Import shared utilities
from .journal_utils import (
    get_company_connection, get_company_db_name, generate_batch_number,
    update_batch_totals, log_audit_event, is_period_locked, create_journal_tables
)

router = APIRouter(prefix="/journal-entry", tags=["Journal Entry"])
logger = logging.getLogger(__name__)

# ==================== DATABASE UTILITIES ====================
# All utilities moved to journal_utils.py to avoid circular imports

# ==================== DATABASE UTILITIES ====================
# All utilities imported from journal_utils.py

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
            
            # Generate batch number
            batch_number = generate_batch_number(conn)
            
            # Insert batch
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO journal_batches (
                    batch_number, journal_reference, description, journal_date,
                    process_id, entity_id, scenario_id,
                    fiscal_year, period, category_id, category, journal_type, status,
                    created_by, total_debits, total_credits, is_balanced
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                batch_number,
                batch_data.get('journal_reference', ''),
                batch_data.get('description', ''),
                batch_data.get('journal_date'),
                batch_data.get('process_id'),
                batch_data.get('entity_id'),
                batch_data.get('scenario_id'),
                batch_data.get('fiscal_year'),
                batch_data.get('period'),
                batch_data.get('category_id'),
                batch_data.get('category', 'Manual Adjustments'),
                batch_data.get('journal_type', 'manual'),
                batch_data.get('status', 'draft'),
                batch_data.get('created_by', 'system'),
                0, 0, False
            ))
            
            batch_id = cursor.fetchone()[0]
            
            log_audit_event(conn, batch_id, None, "create_batch",
                          f"Batch {batch_number} created", {}, {},
                          batch_data.get('created_by', 'system'))
            
            conn.commit()
            
            return {"batch_id": batch_id, "batch_number": batch_number}
            
    except Exception as e:
        logger.error(f"Error creating journal batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/batches/{batch_id}")
async def update_journal_batch(
    batch_id: int,
    batch_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Update journal batch header"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE journal_batches
                SET journal_reference = %s, journal_date = %s, description = %s,
                    modified_by = %s, modified_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id
            """, (
                batch_data.get('journal_reference'),
                batch_data.get('journal_date'),
                batch_data.get('description'),
                batch_data.get('modified_by', 'system'),
                batch_id
            ))
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Batch not found")
            
            log_audit_event(conn, batch_id, None, "update_batch",
                          "Batch header updated", {}, batch_data,
                          batch_data.get('modified_by', 'system'))
            conn.commit()
            
            return {"message": "Batch updated successfully"}
    except Exception as e:
        logger.error(f"Error updating batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batches/{batch_id}")
async def get_journal_batch_details(
    batch_id: int,
    company_name: str = Query(...)
):
    """Get detailed journal batch with lines"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            
            # Get batch
            cursor.execute("SELECT * FROM journal_batches WHERE id = %s", (batch_id,))
            columns = [desc[0] for desc in cursor.description]
            batch_data = cursor.fetchone()
            
            if not batch_data:
                raise HTTPException(status_code=404, detail="Batch not found")
            
            batch = dict(zip(columns, batch_data))
            
            # Get lines
            cursor.execute("""
                SELECT * FROM journal_lines 
                WHERE batch_id = %s 
                ORDER BY line_number
            """, (batch_id,))
            line_columns = [desc[0] for desc in cursor.description]
            lines = [dict(zip(line_columns, row)) for row in cursor.fetchall()]
            
            batch['lines'] = lines
            
            return {"batch": batch}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching batch details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== JOURNAL LINES ENDPOINTS ====================

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
            
            # Get next line number
            cursor.execute("""
                SELECT COALESCE(MAX(line_number), 0) + 1 
                FROM journal_lines WHERE batch_id = %s
            """, (batch_id,))
            line_number = cursor.fetchone()[0]
            
            # Insert line
            cursor.execute("""
                INSERT INTO journal_lines (
                    batch_id, line_number, entry_type, entity_code, entity_name, account_code, account_name,
                    amount, currency, description, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                batch_id, line_number,
                line_data.get('entry_type', 'debit'),
                line_data.get('entity_code'),
                line_data.get('entity_name'),
                line_data.get('account_code'),
                line_data.get('account_name'),
                line_data.get('amount', 0),
                line_data.get('currency', 'INR'),
                line_data.get('description', ''),
                line_data.get('created_by', 'system')
            ))
            
            line_id = cursor.fetchone()[0]
            
            # Update batch totals
            update_batch_totals(conn, batch_id)
            conn.commit()
            
            return {"line_id": line_id}
            
    except Exception as e:
        logger.error(f"Error creating journal line: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CATEGORIES ENDPOINTS ====================

@router.get("/categories")
async def get_journal_categories(
    company_name: str = Query(...),
    include_inactive: bool = Query(False)
):
    """Get user-created journal entry categories"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()
            
            query = "SELECT * FROM journal_categories WHERE 1=1"
            params = []
            
            if not include_inactive:
                query += " AND is_active = TRUE"
            
            query += " ORDER BY category_name"
            
            cursor.execute(query, params)
            columns = [desc[0] for desc in cursor.description]
            categories = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return {"categories": categories, "total": len(categories)}
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories")
async def create_journal_category(
    category_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Create new journal entry category"""
    try:
        with get_company_connection(company_name) as conn:
            create_journal_tables(conn)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO journal_categories (
                    category_code, category_name, description, color, icon,
                    requires_attachments, required_custom_fields,
                    default_approval_workflow_id, default_debit_account,
                    default_credit_account, metadata, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                category_data.get('category_code'),
                category_data.get('category_name'),
                category_data.get('description'),
                category_data.get('color', '#3B82F6'),
                category_data.get('icon', 'FileText'),
                category_data.get('requires_attachments', False),
                json.dumps(category_data.get('required_custom_fields', [])),
                category_data.get('default_approval_workflow_id'),
                category_data.get('default_debit_account'),
                category_data.get('default_credit_account'),
                json.dumps(category_data.get('metadata', {})),
                category_data.get('created_by', 'system')
            ))
            
            category_id = cursor.fetchone()[0]
            conn.commit()
            
            return {"category_id": category_id, "message": "Category created successfully"}
    except Exception as e:
        logger.error(f"Error creating category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/categories/{category_id}")
async def update_journal_category(
    category_id: int,
    category_data: Dict[str, Any],
    company_name: str = Query(...)
):
    """Update journal entry category"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE journal_categories
                SET category_name = %s, description = %s, color = %s, icon = %s,
                    requires_attachments = %s, required_custom_fields = %s,
                    default_approval_workflow_id = %s, default_debit_account = %s,
                    default_credit_account = %s, metadata = %s, is_active = %s,
                    modified_by = %s, modified_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id
            """, (
                category_data.get('category_name'),
                category_data.get('description'),
                category_data.get('color'),
                category_data.get('icon'),
                category_data.get('requires_attachments'),
                json.dumps(category_data.get('required_custom_fields', [])),
                category_data.get('default_approval_workflow_id'),
                category_data.get('default_debit_account'),
                category_data.get('default_credit_account'),
                json.dumps(category_data.get('metadata', {})),
                category_data.get('is_active', True),
                category_data.get('modified_by', 'system'),
                category_id
            ))
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Category not found")
            
            conn.commit()
            return {"message": "Category updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/categories/{category_id}")
async def delete_journal_category(
    category_id: int,
    company_name: str = Query(...)
):
    """Delete (deactivate) journal entry category"""
    try:
        with get_company_connection(company_name) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE journal_categories
                SET is_active = FALSE, modified_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id
            """, (category_id,))
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Category not found")
            
            conn.commit()
            return {"message": "Category deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting category: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
                    template_name, template_code, description, category_id,
                    is_active, is_recurring, recurrence_pattern, recurrence_end_date,
                    default_entity, default_scenario, template_lines, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                template_data.get('template_name'),
                template_data.get('template_code'),
                template_data.get('description', ''),
                template_data.get('category_id'),
                template_data.get('is_active', True),
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
            cursor = conn.cursor()
            
            # Get template
            cursor.execute("SELECT * FROM journal_templates WHERE id = %s", (template_id,))
            template = cursor.fetchone()
            if not template:
                raise HTTPException(status_code=404, detail="Template not found")
            
            # Create batch from template
            batch_data = {
                'description': f"{template[1]} - {application_data.get('description', '')}",
                'process_id': application_data.get('process_id'),
                'entity_id': application_data.get('entity_id', template[10]),  # default_entity
                'scenario_id': application_data.get('scenario_id'),
                'fiscal_year': application_data.get('fiscal_year'),
                'period': application_data.get('period'),
                'category': template[4],  # category
                'created_by': application_data.get('created_by', 'system')
            }
            
            # Create batch
            batch_number = generate_batch_number(conn)
            cursor.execute("""
                INSERT INTO journal_batches (
                    batch_number, description, process_id, entity_id, scenario_id,
                    fiscal_year, period, category, journal_type, status,
                    created_by, recurring_template_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                batch_number,
                batch_data['description'],
                batch_data['process_id'],
                batch_data['entity_id'],
                batch_data['scenario_id'],
                batch_data['fiscal_year'],
                batch_data['period'],
                batch_data['category'],
                'template',
                'draft',
                batch_data['created_by'],
                template_id
            ))
            
            batch_id = cursor.fetchone()[0]
            
            # Apply template lines
            template_lines = json.loads(template[11]) if template[11] else []
            for i, line_template in enumerate(template_lines):
                cursor.execute("""
                    INSERT INTO journal_lines (
                        batch_id, line_number, entry_type, transaction_date, period,
                        entity_code, entity_name, account_code, account_name, amount, currency,
                        description, reference_number, created_by
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    batch_id, i + 1,
                    line_template.get('entry_type', 'debit'),
                    application_data.get('transaction_date'),
                    batch_data['period'],
                    line_template.get('entity_code', batch_data['entity_id']),
                    line_template.get('entity_name', ''),
                    line_template.get('account_code'),
                    line_template.get('account_name'),
                    application_data.get('amount', line_template.get('amount', 0)),
                    line_template.get('currency', 'INR'),
                    line_template.get('description', ''),
                    application_data.get('reference_number', ''),
                    batch_data['created_by']
                ))
            
            # Update batch totals
            update_batch_totals(conn, batch_id)
            conn.commit()
            
            return {"batch_id": batch_id, "batch_number": batch_number}
            
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
            cursor = conn.cursor()
            
            # Get active recurring templates
            cursor.execute("""
                SELECT * FROM journal_templates 
                WHERE is_active = true AND is_recurring = true
            """)
            
            templates = cursor.fetchall()
            generated_batches = []
            
            for template in templates:
                # Check if already generated for this period
                cursor.execute("""
                    SELECT id FROM journal_batches 
                    WHERE recurring_template_id = %s 
                    AND period = %s AND fiscal_year = %s
                """, (template[0], generation_data.get('period'), generation_data.get('fiscal_year')))
                
                if cursor.fetchone():
                    continue  # Already generated
                
                # Apply template for this period
                application_data = {
                    'description': f"Auto-generated for {generation_data.get('period')}",
                    'entity_id': template[10],  # default_entity
                    'fiscal_year': generation_data.get('fiscal_year'),
                    'period': generation_data.get('period'),
                    'transaction_date': generation_data.get('transaction_date'),
                    'created_by': generation_data.get('created_by', 'system')
                }
                
                # Use the apply template logic
                result = await apply_journal_template(template[0], application_data, company_name)
                generated_batches.append(result)
            
            return {"generated_batches": generated_batches}
            
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
            validation = await validate_journal_batch(batch_id, company_name)
            if not validation["is_valid"]:
                raise HTTPException(status_code=400, detail="Batch validation failed")
            
            # Update batch status
            cursor.execute("""
                UPDATE journal_batches 
                SET status = 'submitted', 
                    workflow_status = 'pending_approval',
                    modified_by = %s,
                    modified_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (submission_data.get('submitted_by', 'system'), batch_id))
            
            # Log audit trail
            cursor.execute("""
                INSERT INTO journal_audit_logs (
                    batch_id, action_type, action_description, 
                    performed_by, performed_at
                ) VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            """, (
                batch_id, 'submit', 
                f"Batch submitted for approval: {submission_data.get('comments', '')}",
                submission_data.get('submitted_by', 'system')
            ))
            
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
            
            # Log audit trail
            cursor.execute("""
                INSERT INTO journal_audit_logs (
                    batch_id, action_type, action_description, 
                    performed_by, performed_at
                ) VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            """, (
                batch_id, 'approve', 
                f"Batch approved: {approval_data.get('comments', '')}",
                approval_data.get('approved_by', 'system')
            ))
            
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
            cursor.execute("SELECT status FROM journal_batches WHERE id = %s", (batch_id,))
            batch = cursor.fetchone()
            if not batch or batch[0] != 'approved':
                raise HTTPException(status_code=400, detail="Batch must be approved before posting")
            
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
            
            # Log audit trail
            cursor.execute("""
                INSERT INTO journal_audit_logs (
                    batch_id, action_type, action_description, 
                    performed_by, performed_at
                ) VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            """, (
                batch_id, 'post', 
                f"Batch posted to ledger: {posting_data.get('comments', '')}",
                posting_data.get('posted_by', 'system')
            ))
            
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
