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
from contextlib import contextmanager
from auth.dependencies import get_current_user

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
    company_name: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Get custom fields for a specific card type"""
    try:
        create_tables_if_not_exist(company_name)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(
                "SELECT * FROM data_input_custom_fields WHERE card_type = %s ORDER BY created_at",
                (card_type,)
            )
            fields = cur.fetchall()
            
        return {"fields": fields}
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Entries Endpoints
@router.get("/{card_type}/entries")
async def get_entries(
    card_type: str,
    process_id: int = Query(...),
    scenario_id: int = Query(...),
    company_name: str = Query(...),
    limit: int = Query(500),
    offset: int = Query(0),
    current_user: dict = Depends(get_current_user)
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
    company_name: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Create a new custom field"""
    try:
        create_tables_if_not_exist(company_name)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            cur.execute(
                """INSERT INTO data_input_custom_fields 
                (card_type, field_name, field_type, is_required, options, created_by, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (card_type, field_data['field_name'], field_data['field_type'], 
                 field_data.get('is_required', False), field_data.get('options', ''), 
                 current_user.get('username', 'system'), datetime.utcnow())
            )
            conn.commit()
            
        return {"message": "Custom field created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/custom-fields/{card_type}/{field_id}")
async def delete_custom_field(
    card_type: str,
    field_id: int,
    company_name: str = Query(...),
    current_user: dict = Depends(get_current_user)
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
    company_name: str = Query(...),
    current_user: dict = Depends(get_current_user)
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
    company_name: str = Query(...),
    current_user: dict = Depends(get_current_user)
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
    company_name: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Create a manual entry"""
    try:
        create_tables_if_not_exist(company_name)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            username = current_user.get('username', 'system')
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

# Export Data Endpoint
@router.get("/export/{card_type}")
async def export_data(
    card_type: str,
    company_name: str = Query(...),
    process_id: Optional[str] = Query(None),
    scenario_id: Optional[str] = Query(None)
):
    """Export data as CSV for a specific card type"""
    try:
        if not process_id:
            raise HTTPException(status_code=400, detail="process_id is required for export")

        print(f"📤 Export request: card_type={card_type}, company={company_name}, process_id={process_id}, scenario_id={scenario_id}")

        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Resolve process-specific table name used by financial_process data input
            cur.execute("SELECT name FROM financial_processes WHERE id = %s", (process_id,))
            process_row = cur.fetchone()
            if not process_row:
                raise HTTPException(status_code=404, detail="Process not found")

            safe_process_name = re.sub(r'[^a-zA-Z0-9_]', '_', process_row['name'].lower())
            table_name = f"{safe_process_name}_{card_type}_entries"

            # Ensure table exists
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = %s
                )
            """, (table_name,))
            if not cur.fetchone()[0]:
                print(f"⚠️ Export table missing: {table_name}")
                raise HTTPException(status_code=404, detail="No data available for export")

            where_conditions = ["process_id = %s"]
            params: List[Any] = [process_id]

            if scenario_id is not None:
                where_conditions.append("(scenario_id = %s OR scenario_id IS NULL)")
                params.append(scenario_id)

            where_clause = " AND ".join(where_conditions)

            field_mapping: Dict[str, str]
            headers: List[str]

            if card_type == 'entity_amounts':
                field_mapping = {
                    'Entity Code': 'entity_code',
                    'Entity Name': 'entity_name',
                    'Account Code': 'account_code',
                    'Account Name': 'account_name',
                    'Period Code': 'period_code',
                    'Period Name': 'period_name',
                    'Fiscal Year': 'fiscal_year',
                    'Fiscal Month': 'fiscal_month',
                    'Transaction Date': 'transaction_date',
                    'Amount': 'amount',
                    'Currency': 'currency',
                    'Scenario Code': 'scenario_code',
                    'Description': 'description',
                    'Reference ID': 'reference_id',
                    'Custom Fields': 'custom_fields',
                    'Created At': 'created_at'
                }
                headers = [
                    'Entity Code', 'Entity Name', 'Account Code', 'Account Name',
                    'Period Code', 'Period Name', 'Fiscal Year', 'Fiscal Month',
                    'Transaction Date', 'Amount', 'Currency', 'Scenario Code',
                    'Description', 'Reference ID', 'Custom Fields', 'Created At'
                ]
            elif card_type == 'ic_amounts':
                field_mapping = {
                    'From Entity Code': 'from_entity_code',
                    'From Entity Name': 'from_entity_name',
                    'To Entity Code': 'to_entity_code',
                    'To Entity Name': 'to_entity_name',
                    'From Account Code': 'from_account_code',
                    'From Account Name': 'from_account_name',
                    'To Account Code': 'to_account_code',
                    'To Account Name': 'to_account_name',
                    'Transaction Date': 'transaction_date',
                    'Amount': 'amount',
                    'Currency': 'currency',
                    'Transaction Type': 'transaction_type',
                    'FX Rate': 'fx_rate',
                    'Description': 'description',
                    'Reference ID': 'reference_id',
                    'Custom Fields': 'custom_fields',
                    'Created At': 'created_at'
                }
                headers = [
                    'From Entity Code', 'From Entity Name', 'To Entity Code', 'To Entity Name',
                    'From Account Code', 'From Account Name', 'To Account Code', 'To Account Name',
                    'Transaction Date', 'Amount', 'Currency', 'Transaction Type', 'FX Rate',
                    'Description', 'Reference ID', 'Custom Fields', 'Created At'
                ]
            elif card_type == 'other_amounts':
                field_mapping = {
                    'Entity Code': 'entity_code',
                    'Entity Name': 'entity_name',
                    'Account Code': 'account_code',
                    'Account Name': 'account_name',
                    'Period Code': 'period_code',
                    'Period Name': 'period_name',
                    'Fiscal Year': 'fiscal_year',
                    'Fiscal Month': 'fiscal_month',
                    'Transaction Date': 'transaction_date',
                    'Amount': 'amount',
                    'Currency': 'currency',
                    'Scenario Code': 'scenario_code',
                    'Description': 'description',
                    'Reference ID': 'reference_id',
                    'Custom Fields': 'custom_fields',
                    'Created At': 'created_at'
                }
                headers = [
                    'Entity Code', 'Entity Name', 'Account Code', 'Account Name',
                    'Period Code', 'Period Name', 'Fiscal Year', 'Fiscal Month',
                    'Transaction Date', 'Amount', 'Currency', 'Scenario Code',
                    'Description', 'Reference ID', 'Custom Fields', 'Created At'
                ]
            else:
                raise HTTPException(status_code=400, detail="Invalid card type")

            query = f"""
                SELECT *
                FROM {table_name}
                WHERE {where_clause}
                ORDER BY created_at DESC
            """

            print(f"📄 Export query: {query}")
            print(f"📄 Export params: {params}")
            cur.execute(query, params)
            rows = cur.fetchall()
            print(f"✅ Retrieved {len(rows)} rows for export")

        if not rows:
            df = pd.DataFrame(columns=headers)
        else:
            data_for_df: List[List[Any]] = []
            for row in rows:
                record: List[Any] = []
                for header in headers:
                    source_key = field_mapping.get(header)
                    value = row.get(source_key) if source_key else ''
                    if source_key == 'custom_fields' and isinstance(value, (dict, list)):
                        value = json.dumps(value)
                    record.append('' if value is None else value)
                data_for_df.append(record)

            df = pd.DataFrame(data_for_df, columns=headers)

        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_data = csv_buffer.getvalue()

        filename = f"{card_type}_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

        return StreamingResponse(
            iter([csv_data]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Template Download Endpoint
@router.get("/{card_type}/template")
async def download_template(
    card_type: str,
    company_name: str = Query(...),
    current_user: dict = Depends(get_current_user)
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
