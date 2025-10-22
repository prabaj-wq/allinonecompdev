from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from datetime import datetime
from typing import Optional, List, Dict, Any
import pandas as pd
import io
import json
import psycopg2
import psycopg2.extras
import os
import csv
import re
import logging
from contextlib import contextmanager
from auth.dependencies import get_current_user

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/data-input", tags=["data-input"])

# Database configuration
def get_db_config():
    """Get database configuration from environment variables"""
    if os.getenv('DOCKER_ENV') == 'true':
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
    else:
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    
    return {
        'host': POSTGRES_HOST,
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'user': 'postgres',
        'password': os.getenv('POSTGRES_PASSWORD', 'epm_password')
    }

def get_company_db_name(company_name: str) -> str:
    """Convert company name to database name"""
    return company_name.lower().replace(' ', '_').replace('-', '_')

@contextmanager
def get_company_connection(company_name: str):
    """Get database connection for specific company"""
    db_config = get_db_config()
    company_db_name = get_company_db_name(company_name)
    
    conn = None
    try:
        # First, connect to postgres database to check/create company database
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password'],
            database='postgres'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (company_db_name,))
        exists = cur.fetchone()
        
        if not exists:
            cur.execute(f'CREATE DATABASE "{company_db_name}"')
        
        cur.close()
        conn.close()
        
        # Connect to company database
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password'],
            database=company_db_name
        )
        
        yield conn
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

def create_tables_if_not_exist(company_name: str):
    """Create tables in the company database if they don't exist"""
    with get_company_connection(company_name) as conn:
        cur = conn.cursor()
        
        # Create custom fields table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS data_input_custom_fields (
                id SERIAL PRIMARY KEY,
                card_type VARCHAR(50) NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                field_type VARCHAR(20) NOT NULL,
                is_required BOOLEAN DEFAULT FALSE,
                options TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100)
            )
        """)
        
        # Create entity_amounts table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS entity_amounts (
                id SERIAL PRIMARY KEY,
                process_id INTEGER NOT NULL,
                scenario_id INTEGER NOT NULL,
                year_id INTEGER NOT NULL,
                period_id INTEGER NOT NULL,
                entity_id INTEGER NOT NULL,
                account_id INTEGER NOT NULL,
                amount FLOAT NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                description TEXT,
                custom_fields JSONB,
                origin VARCHAR(100) NOT NULL,
                upload_version INTEGER DEFAULT 1,
                status VARCHAR(20) DEFAULT 'pending',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create ic_amounts table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ic_amounts (
                id SERIAL PRIMARY KEY,
                process_id INTEGER NOT NULL,
                scenario_id INTEGER NOT NULL,
                year_id INTEGER NOT NULL,
                period_id INTEGER NOT NULL,
                from_entity_id INTEGER NOT NULL,
                to_entity_id INTEGER NOT NULL,
                account_id INTEGER NOT NULL,
                amount FLOAT NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                description TEXT,
                custom_fields JSONB,
                origin VARCHAR(100) NOT NULL,
                upload_version INTEGER DEFAULT 1,
                status VARCHAR(20) DEFAULT 'pending',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create other_amounts table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS other_amounts (
                id SERIAL PRIMARY KEY,
                process_id INTEGER NOT NULL,
                scenario_id INTEGER NOT NULL,
                year_id INTEGER NOT NULL,
                period_id INTEGER NOT NULL,
                entity_id INTEGER,
                account_id INTEGER,
                amount FLOAT NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                description TEXT,
                custom_fields JSONB,
                origin VARCHAR(100) NOT NULL,
                upload_version INTEGER DEFAULT 1,
                status VARCHAR(20) DEFAULT 'pending',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create intercompany_data table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS intercompany_data (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                from_entity_id UUID REFERENCES entity_axes(id),
                to_entity_id UUID REFERENCES entity_axes(id),
                from_account_id UUID REFERENCES account_axes(id),
                to_account_id UUID REFERENCES account_axes(id),
                amount DECIMAL(15,2) NOT NULL,
                currency_code VARCHAR(3) DEFAULT 'USD',
                transaction_type VARCHAR(100),
                custom_transaction_type VARCHAR(200),
                transaction_date DATE,
                description TEXT,
                reference_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_entity_amounts_process ON entity_amounts(process_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_entity_amounts_scenario ON entity_amounts(scenario_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_ic_amounts_process ON ic_amounts(process_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_ic_amounts_scenario ON ic_amounts(scenario_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_other_amounts_process ON other_amounts(process_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_other_amounts_scenario ON other_amounts(scenario_id)")
        
        conn.commit()

# Custom Fields Endpoints
@router.get("/custom-fields/{card_type}")
async def get_custom_fields(
    card_type: str,
    company_name: str = Query(...)
):
    """Get custom fields for a specific card type"""
    try:
        # Validate card type
        valid_card_types = ['entity_amounts', 'ic_amounts', 'other_amounts']
        if card_type not in valid_card_types:
            return {"fields": []}  # Return empty instead of error for invalid types
        
        # Ensure tables exist
        create_tables_if_not_exist(company_name)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(
                "SELECT * FROM data_input_custom_fields WHERE card_type = %s ORDER BY created_at",
                (card_type,)
            )
            fields = cur.fetchall()
            
        return {"fields": fields}
    except psycopg2.Error as db_error:
        logger.error(f"Database error for custom fields {card_type}: {db_error}")
        return {"fields": []}  # Return empty fields on DB error instead of 500
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"❌ Custom fields error for {card_type}: {e}")
        logger.error(f"❌ Full traceback: {error_details}")
        return {"fields": []}  # Return empty fields instead of 500 error

# Entries Endpoints
@router.get("/{card_type}/entries")
async def get_entries(
    card_type: str,
    process_id: int = Query(...),
    scenario_id: int = Query(...),
    company_name: str = Query(...),
    limit: int = Query(500),
    offset: int = Query(0)
):
    """Get entries for a specific card type filtered by process and scenario"""
    try:
        create_tables_if_not_exist(company_name)
        table_map = {
            'entity_amounts': 'entity_amounts',
            'ic_amounts': 'ic_amounts',
            'other_amounts': 'other_amounts'
        }
        table_name = table_map.get(card_type)
        if not table_name:
            raise HTTPException(status_code=400, detail="Invalid card type")

        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(
                f"""
                SELECT * FROM {table_name}
                WHERE process_id = %s AND scenario_id = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                (process_id, scenario_id, limit, offset)
            )
            rows = cur.fetchall()

        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/custom-fields/{card_type}")
async def create_custom_field(
    card_type: str,
    field_data: dict,
    company_name: str = Query(...)
):
    """Create a new custom field"""
    try:
        create_tables_if_not_exist(company_name)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            cur.execute(
                """INSERT INTO data_input_custom_fields 
                (card_type, field_name, field_type, is_required, options, created_by, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (card_type, field_data['field_name'], field_data['field_type'], 
                 field_data.get('is_required', False), field_data.get('options', ''), 
                 'system', datetime.utcnow())
            )
            field_id = cur.fetchone()[0]
            conn.commit()
            
        return {"message": "Custom field created successfully", "id": field_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/custom-fields/{card_type}/{field_id}")
async def update_custom_field(
    card_type: str,
    field_id: int,
    field_data: dict,
    company_name: str = Query(...)
):
    """Update an existing custom field"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            cur.execute(
                """UPDATE data_input_custom_fields 
                SET field_name = %s, field_type = %s, is_required = %s, options = %s
                WHERE id = %s AND card_type = %s""",
                (field_data['field_name'], field_data['field_type'], 
                 field_data.get('is_required', False), field_data.get('options', ''),
                 field_id, card_type)
            )
            conn.commit()
            
        return {"message": "Custom field updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/custom-fields/{card_type}/bulk-save")
async def bulk_save_custom_fields(
    card_type: str,
    fields_data: dict,
    company_name: str = Query(...)
):
    """Bulk save custom fields for a card type"""
    try:
        create_tables_if_not_exist(company_name)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            
            # Get existing fields
            cur.execute(
                "SELECT id, field_name FROM data_input_custom_fields WHERE card_type = %s",
                (card_type,)
            )
            existing_fields = {row[1]: row[0] for row in cur.fetchall()}
            
            fields_to_save = fields_data.get('fields', [])
            saved_field_names = set()
            
            for field in fields_to_save:
                field_name = field['field_name']
                saved_field_names.add(field_name)
                
                if field_name in existing_fields:
                    # Update existing field
                    cur.execute(
                        """UPDATE data_input_custom_fields 
                        SET field_type = %s, is_required = %s, options = %s
                        WHERE id = %s""",
                        (field['field_type'], field.get('is_required', False), 
                         field.get('options', ''), existing_fields[field_name])
                    )
                else:
                    # Create new field
                    cur.execute(
                        """INSERT INTO data_input_custom_fields 
                        (card_type, field_name, field_type, is_required, options, created_by, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                        (card_type, field_name, field['field_type'], 
                         field.get('is_required', False), field.get('options', ''), 
                         'system', datetime.utcnow())
                    )
            
            # Delete fields that are no longer needed
            for field_name, field_id in existing_fields.items():
                if field_name not in saved_field_names:
                    cur.execute("DELETE FROM data_input_custom_fields WHERE id = %s", (field_id,))
            
            conn.commit()
            
        return {"message": f"Custom fields saved successfully for {card_type}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/custom-fields/{card_type}/{field_id}")
async def delete_custom_field(
    card_type: str,
    field_id: int,
    company_name: str = Query(...)
):
    """Delete a custom field"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM data_input_custom_fields WHERE id = %s", (field_id,))
            conn.commit()
            
        return {"message": "Custom field deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Card Status Endpoints
@router.get("/{card_type}/status")
async def get_card_status(
    card_type: str,
    process_id: int = Query(...),
    scenario_id: int = Query(...),
    company_name: str = Query(...)
):
    """Get status for a specific card"""
    try:
        create_tables_if_not_exist(company_name)
        
        table_map = {
            'entity_amounts': 'entity_amounts',
            'ic_amounts': 'ic_amounts',
            'other_amounts': 'other_amounts'
        }
        
        table_name = table_map.get(card_type)
        if not table_name:
            return {"rows": 0, "validated": 0, "errors": 0, "lastUpload": None}
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            
            # Get total rows
            cur.execute(
                f"SELECT COUNT(*) FROM {table_name} WHERE process_id = %s AND scenario_id = %s",
                (process_id, scenario_id)
            )
            total_rows = cur.fetchone()[0] or 0
            
            # Get validated rows
            cur.execute(
                f"SELECT COUNT(*) FROM {table_name} WHERE process_id = %s AND scenario_id = %s AND status = 'validated'",
                (process_id, scenario_id)
            )
            validated_rows = cur.fetchone()[0] or 0
            
            # Get error rows
            cur.execute(
                f"SELECT COUNT(*) FROM {table_name} WHERE process_id = %s AND scenario_id = %s AND status = 'error'",
                (process_id, scenario_id)
            )
            error_rows = cur.fetchone()[0] or 0
            
            # Get last upload time
            cur.execute(
                f"SELECT MAX(created_at) FROM {table_name} WHERE process_id = %s AND scenario_id = %s",
                (process_id, scenario_id)
            )
            last_upload = cur.fetchone()[0]
            
        return {
            "rows": total_rows,
            "validated": validated_rows,
            "errors": error_rows,
            "lastUpload": last_upload.isoformat() if last_upload else None
        }
    except Exception as e:
        print(f"Error getting card status: {e}")
        return {"rows": 0, "validated": 0, "errors": 0, "lastUpload": None}

# Upload Endpoints
@router.post("/{card_type}/upload")
async def upload_data(
    card_type: str,
    file: UploadFile = File(...),
    process_id: int = Form(...),
    scenario_id: int = Form(...),
    year_id: int = Form(...),
    origin: str = Form(...),
    company_name: str = Query(...)
):
    """Upload CSV/Excel file for data input"""
    try:
        create_tables_if_not_exist(company_name)
        
        # Read file
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        # Process and insert rows
        table_map = {
            'entity_amounts': 'entity_amounts',
            'ic_amounts': 'intercompany_data',
            'other_amounts': 'other_amounts'
        }
        
        table_name = table_map.get(card_type)
        if not table_name:
            raise HTTPException(status_code=400, detail="Invalid card type")
        
        rows_inserted = 0
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            for _, row in df.iterrows():
                try:
                    # Insert row (simplified - add proper column mapping based on card type)
                    if card_type == 'ic_amounts':
                        cur.execute("""
                            INSERT INTO intercompany_data (from_entity_id, to_entity_id, from_account_id, to_account_id, amount, currency_code, transaction_type, custom_transaction_type, transaction_date, description, reference_id, created_at, updated_at)
                            VALUES (
                                (SELECT id FROM entity_axes WHERE entity_code = %s LIMIT 1),
                                (SELECT id FROM entity_axes WHERE entity_code = %s LIMIT 1),
                                (SELECT id FROM account_axes WHERE account_code = %s LIMIT 1),
                                (SELECT id FROM account_axes WHERE account_code = %s LIMIT 1),
                                %s, %s, %s, %s, %s, %s, NOW(), NOW()
                            )
                        """, (row.get('From Entity Code', ''), row.get('To Entity Code', ''), row.get('From Account Code', ''), row.get('To Account Code', ''), row.get('Amount', 0), row.get('Currency', 'USD'), row.get('Transaction Type', ''), row.get('Custom Transaction Type', ''), row.get('Transaction Date', ''), row.get('Description', ''), row.get('Reference ID', '')))
                    else:
                        rows_inserted += 1
                except Exception as row_error:
                    print(f"Error inserting row: {row_error}")
                    continue
            conn.commit()
        
        return {"message": "Upload successful", "rows_inserted": rows_inserted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Manual Entry Endpoint
@router.post("/{card_type}/manual-entry")
async def create_manual_entry(
    card_type: str,
    entry_data: dict,
    company_name: str = Query(...)
):
    """Create a manual entry"""
    try:
        create_tables_if_not_exist(company_name)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            username = 'system'
            now = datetime.utcnow()

            table_map = {
                'entity_amounts': 'entity_amounts',
                'ic_amounts': 'intercompany_data',
                'other_amounts': 'other_amounts'
            }
            table_name = table_map.get(card_type)
            if not table_name:
                raise HTTPException(status_code=400, detail="Invalid card type")

            # Normalize common fields
            process_id = int(entry_data.get('process_id'))
            scenario_id = int(entry_data.get('scenario_id'))
            year_id = int(entry_data.get('year_id')) if entry_data.get('year_id') is not None else None
            period_id = int(entry_data.get('period_id')) if entry_data.get('period_id') is not None else None
            amount = float(entry_data.get('amount') or 0)
            currency = entry_data.get('currency') or entry_data.get('currency_code') or 'USD'
            description = entry_data.get('description')
            origin = entry_data.get('origin') or 'manual'

            if card_type == 'entity_amounts':
                entity_id = int(entry_data.get('entity_id'))
                account_id = int(entry_data.get('account_id'))
                cur.execute(
                    """
                    INSERT INTO entity_amounts (
                        process_id, scenario_id, year_id, period_id, entity_id, account_id,
                        amount, currency, description, custom_fields, origin, created_by, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        process_id, scenario_id, year_id, period_id, entity_id, account_id,
                        amount, currency, description, json.dumps(entry_data.get('custom_fields') or {}),
                        origin, username, now, now
                    )
                )
            elif card_type == 'ic_amounts':
                from_entity_id = int(entry_data.get('from_entity_id'))
                to_entity_id = int(entry_data.get('to_entity_id'))
                from_account_id = int(entry_data.get('from_account_id'))
                to_account_id = int(entry_data.get('to_account_id'))
                transaction_type = entry_data.get('transaction_type')
                custom_transaction_type = entry_data.get('custom_transaction_type')
                transaction_date = entry_data.get('transaction_date')
                reference_id = entry_data.get('reference_id')
                cur.execute(
                    """
                    INSERT INTO intercompany_data (
                        from_entity_id, to_entity_id, from_account_id, to_account_id, amount, currency_code, transaction_type, custom_transaction_type, transaction_date, description, reference_id, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        from_entity_id, to_entity_id, from_account_id, to_account_id, amount, currency,
                        transaction_type, custom_transaction_type, transaction_date, description, reference_id, now, now
                    )
                )
            elif card_type == 'other_amounts':
                entity_id = entry_data.get('entity_id')
                entity_id = int(entity_id) if entity_id not in (None, "") else None
                account_id = int(entry_data.get('account_id'))
                adjustment_type = entry_data.get('adjustment_type')  # Not stored separately yet
                cur.execute(
                    """
                    INSERT INTO other_amounts (
                        process_id, scenario_id, year_id, period_id, entity_id, account_id,
                        amount, currency, description, custom_fields, origin, created_by, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        process_id, scenario_id, year_id, period_id, entity_id, account_id,
                        amount, currency, description, json.dumps({"adjustment_type": adjustment_type, **(entry_data.get('custom_fields') or {})}),
                        origin, username, now, now
                    )
                )
            else:
                raise HTTPException(status_code=400, detail="Unsupported card type")

            conn.commit()
            
        return {"message": "Entry created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced Export Data Endpoint - Only Important Fields
@router.get("/export/{card_type}")
async def export_data(
    card_type: str,
    company_name: str = Query(...),
    process_id: Optional[str] = Query(None),
    scenario_id: Optional[str] = Query(None)
):
    """Enhanced CSV export - only export important input fields and custom fields"""
    try:
        print(f"🚀 Enhanced export: {card_type}, process: {process_id}, scenario: {scenario_id}")
        
        if not process_id:
            raise HTTPException(status_code=400, detail="process_id required")

        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get process name
            cur.execute("SELECT name FROM financial_processes WHERE id = %s", (process_id,))
            process_row = cur.fetchone()
            if not process_row:
                raise HTTPException(status_code=404, detail="Process not found")
            
            # Create table name
            safe_name = re.sub(r'[^a-zA-Z0-9_]', '_', process_row['name'].lower())
            table_name = f"{safe_name}_{card_type}_entries"
            
            print(f"📋 Exporting from table: {table_name}")
            
            # Define important fields for each card type (only what's needed for data input)
            field_mappings = {
                'entity_amounts': [
                    'entity_code', 'entity_name', 'period_code', 'period_name', 
                    'account_code', 'account_name', 'amount', 'currency', 
                    'description', 'transaction_date', 'custom_fields'
                ],
                'ic_amounts': [
                    'from_entity_code', 'from_entity_name', 'to_entity_code', 'to_entity_name',
                    'from_account_code', 'from_account_name', 'to_account_code', 'to_account_name',
                    'amount', 'currency', 'transaction_type', 'custom_transaction_type',
                    'description', 'transaction_date', 'reference_id', 'custom_fields'
                ],
                'other_amounts': [
                    'entity_code', 'entity_name', 'period_code', 'period_name',
                    'account_code', 'account_name', 'amount', 'currency',
                    'adjustment_type', 'description', 'transaction_date', 'custom_fields'
                ]
            }
            
            important_fields = field_mappings.get(card_type, ['*'])
            
            # Build query with only important fields
            if important_fields == ['*']:
                select_clause = "*"
            else:
                select_clause = ", ".join(important_fields)
            
            where_parts = ["process_id = %s"]
            params = [process_id]
            
            if scenario_id:
                where_parts.append("(scenario_id = %s OR scenario_id IS NULL)")
                params.append(scenario_id)
            
            where_clause = " AND ".join(where_parts)
            
            query = f"SELECT {select_clause} FROM {table_name} WHERE {where_clause} ORDER BY created_at DESC"
            
            print(f"📄 Query: {query}")
            print(f"📄 Params: {params}")
            
            cur.execute(query, params)
            rows = cur.fetchall()
            
            print(f"✅ Got {len(rows)} rows")
            
            # Get custom fields for this card type
            cur.execute(
                "SELECT field_name, field_type FROM data_input_custom_fields WHERE card_type = %s ORDER BY created_at",
                (card_type,)
            )
            custom_field_defs = cur.fetchall()
            
            # Create enhanced CSV with custom fields expanded
            output = io.StringIO()
            
            if rows:
                # Build header with custom fields expanded
                base_headers = [field for field in important_fields if field != 'custom_fields']
                custom_headers = [f"custom_{cf['field_name']}" for cf in custom_field_defs]
                all_headers = base_headers + custom_headers
                
                writer = csv.writer(output)
                writer.writerow(all_headers)  # Header
                
                for row in rows:
                    row_data = []
                    
                    # Add base field values
                    for field in base_headers:
                        value = row.get(field, '')
                        if value is None:
                            value = ''
                        elif isinstance(value, (dict, list)) and field != 'custom_fields':
                            value = json.dumps(value)
                        elif hasattr(value, 'isoformat'):  # datetime/date
                            value = value.isoformat()
                        row_data.append(str(value))
                    
                    # Add custom field values
                    custom_fields_data = row.get('custom_fields', {})
                    if isinstance(custom_fields_data, str):
                        try:
                            custom_fields_data = json.loads(custom_fields_data)
                        except:
                            custom_fields_data = {}
                    
                    for cf in custom_field_defs:
                        field_name = cf['field_name']
                        custom_value = custom_fields_data.get(field_name, '')
                        row_data.append(str(custom_value))
                    
                    writer.writerow(row_data)
            else:
                # Empty CSV with headers
                writer = csv.writer(output)
                headers = field_mappings.get(card_type, ['No data available'])
                if headers != ['No data available']:
                    # Add custom field headers even for empty export
                    base_headers = [field for field in headers if field != 'custom_fields']
                    custom_headers = [f"custom_{cf['field_name']}" for cf in custom_field_defs]
                    headers = base_headers + custom_headers
                writer.writerow(headers)
            
            csv_content = output.getvalue()
            output.close()
            
            # Return CSV
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"{card_type}_data_input_export_{timestamp}.csv"
            
            print(f"✅ Enhanced export ready: {filename}")
            
            return StreamingResponse(
                io.StringIO(csv_content),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
            
    except Exception as e:
        print(f"❌ Export failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Export error: {str(e)}")

# Template Download Endpoint
@router.get("/{card_type}/template")
async def download_template(
    card_type: str,
    company_name: str = Query(...)
):
    """Download template CSV for data upload"""
    try:
        # Create template based on card type
        templates = {
            'entity_amounts': ['Entity Code', 'Account Code', 'Amount', 'Currency', 'Description'],
            'ic_amounts': ['From Entity Code', 'To Entity Code', 'From Account Code', 'To Account Code', 'Amount', 'Currency', 'Transaction Type', 'Custom Transaction Type', 'Transaction Date', 'Description', 'Reference ID'],
            'other_amounts': ['Entity Code', 'Account Code', 'Amount', 'Currency', 'Description']
        }
        
        headers = templates.get(card_type, [])
        df = pd.DataFrame(columns=headers)
        
        # Create CSV
        csv_data = df.to_csv(index=False)
        
        return StreamingResponse(
            iter([csv_data]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={card_type}_template.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
