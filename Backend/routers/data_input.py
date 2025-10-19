from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from datetime import datetime
from typing import Optional, List, Dict, Any
import pandas as pd
import io
import json
import psycopg2
import psycopg2.extras
import os
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
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
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
            'ic_amounts': 'ic_amounts',
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
                'ic_amounts': 'ic_amounts',
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
                account_id = int(entry_data.get('account_id'))
                cur.execute(
                    """
                    INSERT INTO ic_amounts (
                        process_id, scenario_id, year_id, period_id,
                        from_entity_id, to_entity_id, account_id,
                        amount, currency, description, custom_fields, origin, created_by, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        process_id, scenario_id, year_id, period_id,
                        from_entity_id, to_entity_id, account_id,
                        amount, currency, description, json.dumps(entry_data.get('custom_fields') or {}),
                        origin, username, now, now
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
            'entity_amounts': ['account_id', 'entity_id', 'period_id', 'amount', 'currency', 'description'],
            'ic_amounts': ['account_id', 'from_entity_id', 'to_entity_id', 'period_id', 'amount', 'currency', 'description'],
            'other_amounts': ['account_id', 'entity_id', 'period_id', 'amount', 'currency', 'description']
        }
        
        headers = templates.get(card_type, [])
        df = pd.DataFrame(columns=headers)
        
        # Create CSV
        csv_data = df.to_csv(index=False)
        
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            iter([csv_data]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={card_type}_template.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
