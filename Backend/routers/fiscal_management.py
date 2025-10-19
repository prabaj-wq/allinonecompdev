"""
Fiscal Year & Scenario Management API Router
Clean working version - no syntax errors
"""

from fastapi import APIRouter, HTTPException, Query, Header
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field
import psycopg2
import psycopg2.extras
import os
import json

router = APIRouter(prefix="/fiscal-management", tags=["Fiscal Management"])

# ===== DATABASE CONNECTION =====

def get_db_config():
    """Get database configuration"""
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

def get_company_connection(company_name: str):
    """Get database connection for specific company"""
    db_config = get_db_config()
    company_db_name = get_company_db_name(company_name)
    
    conn = psycopg2.connect(
        database=company_db_name,
        **db_config
    )
    return conn

def ensure_fiscal_tables(company_name: str):
    """Ensure fiscal management tables exist in company database"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            
            # Create fiscal_years table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS fiscal_years (
                    id SERIAL PRIMARY KEY,
                    year_code VARCHAR(20) UNIQUE NOT NULL,
                    year_name VARCHAR(255) NOT NULL,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    status VARCHAR(50) DEFAULT 'draft',
                    description TEXT,
                    is_consolidation_year BOOLEAN DEFAULT TRUE,
                    consolidation_method VARCHAR(50) DEFAULT 'full',
                    roll_forward_method VARCHAR(50) DEFAULT 'copy_previous_period',
                    roll_forward_copy_scope VARCHAR(50) DEFAULT 'amounts_and_journals',
                    opening_balance_source_year_id INTEGER REFERENCES fiscal_years(id),
                    previous_year_offsets JSONB DEFAULT '[]',
                    next_year_offsets JSONB DEFAULT '[]',
                    settings JSONB DEFAULT '{}',
                    custom_fields JSONB DEFAULT '{}',
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_by INTEGER,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Ensure new columns exist for legacy databases
            cur.execute("""
                ALTER TABLE fiscal_years
                ADD COLUMN IF NOT EXISTS roll_forward_method VARCHAR(50) DEFAULT 'copy_previous_period'
            """)
            cur.execute("""
                ALTER TABLE fiscal_years
                ADD COLUMN IF NOT EXISTS roll_forward_copy_scope VARCHAR(50) DEFAULT 'amounts_and_journals'
            """)
            cur.execute("""
                ALTER TABLE fiscal_years
                ADD COLUMN IF NOT EXISTS opening_balance_source_year_id INTEGER REFERENCES fiscal_years(id)
            """)
            cur.execute("""
                ALTER TABLE fiscal_years
                ADD COLUMN IF NOT EXISTS previous_year_offsets JSONB DEFAULT '[]'
            """)
            cur.execute("""
                ALTER TABLE fiscal_years
                ADD COLUMN IF NOT EXISTS next_year_offsets JSONB DEFAULT '[]'
            """)
            
            # Create periods table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS periods (
                    id SERIAL PRIMARY KEY,
                    fiscal_year_id INTEGER REFERENCES fiscal_years(id) ON DELETE CASCADE,
                    period_code VARCHAR(20) NOT NULL,
                    period_name VARCHAR(255) NOT NULL,
                    period_type VARCHAR(50) DEFAULT 'month',
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    status VARCHAR(50) DEFAULT 'open',
                    is_rollup_period BOOLEAN DEFAULT FALSE,
                    parent_period_id INTEGER REFERENCES periods(id),
                    sort_order INTEGER DEFAULT 0,
                    consolidation_enabled BOOLEAN DEFAULT TRUE,
                    consolidation_cutoff_date TIMESTAMP,
                    description TEXT,
                    settings JSONB DEFAULT '{}',
                    custom_fields JSONB DEFAULT '{}',
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_by INTEGER,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(fiscal_year_id, period_code)
                )
            """)
            
            # Create scenarios table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS scenarios (
                    id SERIAL PRIMARY KEY,
                    fiscal_year_id INTEGER REFERENCES fiscal_years(id) ON DELETE CASCADE,
                    scenario_code VARCHAR(50) NOT NULL,
                    scenario_name VARCHAR(255) NOT NULL,
                    scenario_type VARCHAR(50) NOT NULL,
                    parent_scenario_id INTEGER REFERENCES scenarios(id),
                    version_number VARCHAR(20) DEFAULT '1.0',
                    revision_number INTEGER DEFAULT 1,
                    status VARCHAR(50) DEFAULT 'draft',
                    is_baseline BOOLEAN DEFAULT FALSE,
                    is_consolidated BOOLEAN DEFAULT FALSE,
                    allow_overrides BOOLEAN DEFAULT TRUE,
                    auto_calculate BOOLEAN DEFAULT TRUE,
                    data_seeding_rules JSONB DEFAULT '{}',
                    description TEXT,
                    assumptions TEXT,
                    tags JSONB DEFAULT '[]',
                    consolidation_method VARCHAR(50) DEFAULT 'full',
                    elimination_rules JSONB DEFAULT '{}',
                    approval_status VARCHAR(50) DEFAULT 'pending',
                    approved_by INTEGER,
                    approved_at TIMESTAMP,
                    settings JSONB DEFAULT '{}',
                    custom_fields JSONB DEFAULT '{}',
                    custom_field_definitions JSONB DEFAULT '[]',
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_by INTEGER,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(fiscal_year_id, scenario_code)
                )
            """)
            
            # Add custom_field_definitions column if it doesn't exist (for existing tables)
            try:
                cur.execute("""
                    ALTER TABLE scenarios 
                    ADD COLUMN IF NOT EXISTS custom_field_definitions JSONB DEFAULT '[]'
                """)
            except Exception as e:
                print(f"Note: Could not add custom_field_definitions column: {e}")
            
            # Add reference scenario columns for previous/next scenario references
            try:
                cur.execute("""
                    ALTER TABLE scenarios 
                    ADD COLUMN IF NOT EXISTS previous_scenario_offsets JSONB DEFAULT '[]'
                """)
                cur.execute("""
                    ALTER TABLE scenarios 
                    ADD COLUMN IF NOT EXISTS next_scenario_offsets JSONB DEFAULT '[]'
                """)
                # Add new reference columns for enhanced reference scenarios
                cur.execute("""
                    ALTER TABLE scenarios 
                    ADD COLUMN IF NOT EXISTS previous_references JSONB DEFAULT '[]'
                """)
                cur.execute("""
                    ALTER TABLE scenarios 
                    ADD COLUMN IF NOT EXISTS upcoming_references JSONB DEFAULT '[]'
                """)
            except Exception as e:
                print(f"Note: Could not add scenario reference columns: {e}")
            
            conn.commit()
            return True
    except Exception as e:
        print(f"Error creating fiscal tables: {e}")
        return False

# ===== PYDANTIC MODELS =====

class FiscalYearCreate(BaseModel):
    year_code: str = Field(..., max_length=20)
    year_name: str = Field(..., max_length=255)
    start_date: date
    end_date: date
    status: str = Field(default="draft")
    description: Optional[str] = None
    is_consolidation_year: bool = Field(default=True)
    consolidation_method: str = Field(default="full")
    settings: Dict[str, Any] = Field(default_factory=dict)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

# Add a new model for updating fiscal year settings
class FiscalYearSettingsUpdate(BaseModel):
    settings: Dict[str, Any] = Field(default_factory=dict)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    roll_forward_method: Optional[str] = Field(default=None)
    roll_forward_copy_scope: Optional[str] = Field(default=None)
    opening_balance_source_year_id: Optional[int] = Field(default=None)
    previous_year_offsets: Optional[List[int]] = Field(default=None)
    next_year_offsets: Optional[List[int]] = Field(default=None)

# ===== ENDPOINTS =====

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    print("🏥 Health check called")
    return {"status": "ok", "service": "fiscal_management", "timestamp": datetime.now().isoformat()}

@router.get("/test-db/{company_name}")
async def test_database_connection(company_name: str):
    """Test database connection for a company"""
    try:
        print(f"🧪 Testing database connection for: {company_name}")
        ensure_fiscal_tables(company_name)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            cur.execute("SELECT 1 as test")
            result = cur.fetchone()
            
        print(f"✅ Database connection successful for: {company_name}")
        return {"status": "ok", "company": company_name, "test_result": result[0]}
    except Exception as e:
        print(f"❌ Database connection failed for {company_name}: {str(e)}")
        return {"status": "error", "company": company_name, "error": str(e)}

@router.get("/fiscal-years")
async def get_fiscal_years(
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Get all fiscal years"""
    try:
        print(f"📡 Fetching fiscal years for company: {x_company_database}")
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cur.execute("SELECT * FROM fiscal_years ORDER BY start_date DESC")
            fiscal_years = cur.fetchall()
            
            print(f"✅ Found {len(fiscal_years)} fiscal years")
            return {
                "fiscal_years": fiscal_years,
                "total": len(fiscal_years)
            }
    except Exception as e:
        print(f"❌ Error fetching fiscal years: {str(e)}")
        return {
            "fiscal_years": [],
            "total": 0,
            "error": str(e)
        }

@router.get("/fiscal-years/{fiscal_year_id}")
async def get_fiscal_year(
    fiscal_year_id: int,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Get a specific fiscal year"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cur.execute("SELECT * FROM fiscal_years WHERE id = %s", (fiscal_year_id,))
            fiscal_year = cur.fetchone()
            
            if not fiscal_year:
                return {"error": "Fiscal year not found"}
            
            return fiscal_year
    except Exception as e:
        return {"error": str(e)}

@router.post("/fiscal-years")
async def create_fiscal_year(
    fiscal_year_data: dict,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Create a new fiscal year"""
    try:
        print(f"🚀 Creating fiscal year for company: {x_company_database}")
        print(f"📊 Fiscal year data: {fiscal_year_data}")
        
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Simple insert
            insert_query = """
                INSERT INTO fiscal_years (
                    year_code, year_name, start_date, end_date, status, description,
                    is_consolidation_year, consolidation_method, roll_forward_method,
                    roll_forward_copy_scope, opening_balance_source_year_id,
                    previous_year_offsets, next_year_offsets, settings
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """
            
            cur.execute(insert_query, (
                fiscal_year_data.get('year_code'),
                fiscal_year_data.get('year_name'),
                fiscal_year_data.get('start_date'),
                fiscal_year_data.get('end_date'),
                fiscal_year_data.get('status', 'draft'),
                fiscal_year_data.get('description'),
                fiscal_year_data.get('is_consolidation_year', True),
                fiscal_year_data.get('consolidation_method', 'full'),
                fiscal_year_data.get('roll_forward_method', 'copy_previous_period'),
                fiscal_year_data.get('roll_forward_copy_scope', 'amounts_and_journals'),
                fiscal_year_data.get('opening_balance_source_year_id'),
                json.dumps(fiscal_year_data.get('previous_year_offsets', [])),
                json.dumps(fiscal_year_data.get('next_year_offsets', [])),
                json.dumps(fiscal_year_data.get('settings', {}))
            ))
            
            fiscal_year = cur.fetchone()
            conn.commit()
            
            print(f"✅ Fiscal year created successfully: {fiscal_year}")
            return fiscal_year
    except Exception as e:
        print(f"❌ Error creating fiscal year: {str(e)}")
        return {"error": str(e)}

@router.put("/fiscal-years/{fiscal_year_id}")
async def update_fiscal_year(
    fiscal_year_id: int,
    fiscal_year_data: FiscalYearSettingsUpdate,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Update a fiscal year settings"""
    try:
        print(f"🚀 Updating fiscal year {fiscal_year_id} for company: {x_company_database}")
        print(f"📊 Fiscal year data: {fiscal_year_data}")
        
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Update query
            update_query = """
                UPDATE fiscal_years 
                SET settings = %s,
                    custom_fields = %s,
                    roll_forward_method = COALESCE(%s, roll_forward_method),
                    roll_forward_copy_scope = COALESCE(%s, roll_forward_copy_scope),
                    opening_balance_source_year_id = %s,
                    previous_year_offsets = %s,
                    next_year_offsets = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """
            
            cur.execute(update_query, (
                json.dumps(fiscal_year_data.settings),
                json.dumps(fiscal_year_data.custom_fields),
                fiscal_year_data.roll_forward_method,
                fiscal_year_data.roll_forward_copy_scope,
                fiscal_year_data.opening_balance_source_year_id,
                json.dumps(fiscal_year_data.previous_year_offsets if fiscal_year_data.previous_year_offsets is not None else []),
                json.dumps(fiscal_year_data.next_year_offsets if fiscal_year_data.next_year_offsets is not None else []),
                fiscal_year_id
            ))
            
            fiscal_year = cur.fetchone()
            conn.commit()
            
            if not fiscal_year:
                return {"error": "Fiscal year not found"}
            
            print(f"✅ Fiscal year updated successfully: {fiscal_year}")
            return fiscal_year
    except Exception as e:
        print(f"❌ Error updating fiscal year: {str(e)}")
        return {"error": str(e)}

@router.get("/fiscal-years/{fiscal_year_id}/periods")
async def get_periods(
    fiscal_year_id: int,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Get periods for a fiscal year"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cur.execute("SELECT * FROM periods WHERE fiscal_year_id = %s ORDER BY sort_order", (fiscal_year_id,))
            periods = cur.fetchall()
            
            return {
                "periods": periods,
                "fiscal_year_id": fiscal_year_id,
                "total": len(periods)
            }
    except Exception as e:
        return {"error": str(e), "periods": [], "total": 0}

@router.get("/periods/{period_id}")
async def get_period(
    period_id: int,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Get a specific period"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cur.execute("SELECT * FROM periods WHERE id = %s", (period_id,))
            period = cur.fetchone()
            
            if not period:
                raise HTTPException(status_code=404, detail="Period not found")
            
            return period
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching period: {str(e)}")

@router.post("/fiscal-years/{fiscal_year_id}/periods")
async def create_period(
    fiscal_year_id: int,
    period_data: dict,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Create a new period"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Simple insert
            insert_query = """
                INSERT INTO periods (
                    fiscal_year_id, period_code, period_name, period_type, 
                    start_date, end_date, status, sort_order, description
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """
            
            cur.execute(insert_query, (
                fiscal_year_id,
                period_data.get('period_code'),
                period_data.get('period_name'),
                period_data.get('period_type', 'month'),
                period_data.get('start_date'),
                period_data.get('end_date'),
                period_data.get('status', 'open'),
                period_data.get('sort_order', 0),
                period_data.get('description')
            ))
            
            period = cur.fetchone()
            conn.commit()
            
            return period
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating period: {str(e)}")

@router.put("/periods/{period_id}")
async def update_period(
    period_id: int,
    period_data: dict,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Update a period"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Update query
            update_query = """
                UPDATE periods 
                SET period_code = %s, period_name = %s, period_type = %s, 
                    start_date = %s, end_date = %s, status = %s, sort_order = %s, 
                    description = %s, is_rollup_period = %s, consolidation_enabled = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """
            
            cur.execute(update_query, (
                period_data.get('period_code'),
                period_data.get('period_name'),
                period_data.get('period_type', 'month'),
                period_data.get('start_date'),
                period_data.get('end_date'),
                period_data.get('status', 'open'),
                period_data.get('sort_order', 0),
                period_data.get('description'),
                period_data.get('is_rollup_period', False),
                period_data.get('consolidation_enabled', True),
                period_id
            ))
            
            period = cur.fetchone()
            conn.commit()
            
            if not period:
                raise HTTPException(status_code=404, detail="Period not found")
            
            return period
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating period: {str(e)}")

@router.delete("/periods/{period_id}")
async def delete_period(
    period_id: int,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Delete a period"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor()
            
            cur.execute("DELETE FROM periods WHERE id = %s RETURNING id", (period_id,))
            result = cur.fetchone()
            conn.commit()
            
            if not result:
                raise HTTPException(status_code=404, detail="Period not found")
            
            return {"message": "Period deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting period: {str(e)}")

@router.post("/fiscal-years/{fiscal_year_id}/periods/bulk")
async def create_bulk_periods(
    fiscal_year_id: int,
    bulk_data: dict,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Create multiple periods at once (auto-generate)"""
    try:
        print(f"🚀 Creating bulk periods for fiscal year: {fiscal_year_id}")
        print(f"📊 Bulk data: {bulk_data}")

        ensure_fiscal_tables(x_company_database)

        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get fiscal year info
            cur.execute("SELECT * FROM fiscal_years WHERE id = %s", (fiscal_year_id,))
            fiscal_year = cur.fetchone()

            if not fiscal_year:
                return {"error": "Fiscal year not found"}

            start_date = fiscal_year['start_date']
            end_date = fiscal_year['end_date']
            period_type = bulk_data.get('period_type', 'month')

            created_periods = []

            if period_type == 'month':
                # Generate 12 monthly periods
                current_date = start_date
                for i in range(12):
                    month_start = current_date
                    if i == 11:  # Last month
                        month_end = end_date
                    else:
                        # Calculate next month
                        if current_date.month == 12:
                            month_end = date(current_date.year + 1, 1, 31)
                        else:
                            month_end = date(current_date.year, current_date.month + 1, 1) - timedelta(days=1)

                    # Insert period
                    insert_query = """
                        INSERT INTO periods (
                            fiscal_year_id, period_code, period_name, period_type,
                            start_date, end_date, status, sort_order, description,
                            is_rollup_period, consolidation_enabled
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING *
                    """

                    period_code = f"M{i+1:02d}"
                    period_name = current_date.strftime("%B %Y")

                    cur.execute(insert_query, (
                        fiscal_year_id,
                        period_code,
                        period_name,
                        'month',
                        month_start,
                        month_end,
                        'open',
                        i,
                        f"Monthly period {i+1}",
                        False,
                        True
                    ))

                    created_period = cur.fetchone()
                    created_periods.append(created_period)

                    # Move to next month
                    if i < 11:  # Don't advance past last month
                        current_date = month_end + timedelta(days=1)

            elif period_type == 'quarter':
                # Generate 4 quarterly periods
                quarters = [
                    (1, 3, "Q1"),
                    (4, 6, "Q2"),
                    (7, 9, "Q3"),
                    (10, 12, "Q4")
                ]

                for i, (start_month, end_month, quarter_name) in enumerate(quarters):
                    quarter_start = date(start_date.year, start_month, 1)
                    quarter_end = date(start_date.year, end_month, 28)  # Approximate

                    # Adjust for actual fiscal year end
                    if i == 3:  # Last quarter
                        quarter_end = end_date

                    # Insert period
                    insert_query = """
                        INSERT INTO periods (
                            fiscal_year_id, period_code, period_name, period_type,
                            start_date, end_date, status, sort_order, description,
                            is_rollup_period, consolidation_enabled
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING *
                    """

                    cur.execute(insert_query, (
                        fiscal_year_id,
                        quarter_name,
                        f"{quarter_name} {start_date.year}",
                        'quarter',
                        quarter_start,
                        quarter_end,
                        'open',
                        i,
                        f"Quarterly period {quarter_name}",
                        True,
                        True
                    ))

                    created_period = cur.fetchone()
                    created_periods.append(created_period)

            conn.commit()
            print(f"✅ Created {len(created_periods)} periods successfully")

            return {
                "message": f"Successfully created {len(created_periods)} {period_type}ly periods",
                "periods": created_periods,
                "total": len(created_periods)
            }

    except Exception as e:
        print(f"❌ Error creating bulk periods: {str(e)}")
        return {"error": str(e)}
@router.get("/fiscal-years/{fiscal_year_id}/scenarios")
async def get_scenarios(
    fiscal_year_id: int,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Get scenarios for a fiscal year"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cur.execute("SELECT * FROM scenarios WHERE fiscal_year_id = %s ORDER BY created_at DESC, id DESC", (fiscal_year_id,))
            scenarios = cur.fetchall()
            
            return {
                "scenarios": scenarios,
                "fiscal_year_id": fiscal_year_id,
                "total": len(scenarios)
            }
    except Exception as e:
        return {"error": str(e), "scenarios": [], "total": 0}

@router.post("/fiscal-years/{fiscal_year_id}/scenarios")
async def create_scenario(
    fiscal_year_id: int,
    scenario_data: dict,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Create a new scenario"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Simple insert
            insert_query = """
                INSERT INTO scenarios (
                    fiscal_year_id, scenario_code, scenario_name, scenario_type, 
                    description, status, version_number, is_baseline, 
                    allow_overrides, auto_calculate, consolidation_method,
                    custom_field_definitions
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """
            
            cur.execute(insert_query, (
                fiscal_year_id,
                scenario_data.get('scenario_code'),
                scenario_data.get('scenario_name'),
                scenario_data.get('scenario_type', 'budget'),
                scenario_data.get('description'),
                scenario_data.get('status', 'draft'),
                scenario_data.get('version_number', '1.0'),
                scenario_data.get('is_baseline', False),
                scenario_data.get('allow_overrides', True),
                scenario_data.get('auto_calculate', True),
                scenario_data.get('consolidation_method', 'full'),
                json.dumps(scenario_data.get('custom_field_definitions', []))
            ))
            
            scenario = cur.fetchone()
            conn.commit()
            
            return scenario
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating scenario: {str(e)}")

@router.get("/scenarios/{scenario_id}")
async def get_scenario(
    scenario_id: int,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Get a specific scenario"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cur.execute("SELECT * FROM scenarios WHERE id = %s", (scenario_id,))
            scenario = cur.fetchone()
            
            if not scenario:
                raise HTTPException(status_code=404, detail="Scenario not found")
            
            return scenario
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scenario: {str(e)}")

@router.put("/scenarios/{scenario_id}")
async def update_scenario(
    scenario_id: int,
    scenario_data: dict,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Update a scenario"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Update query
            update_query = """
                UPDATE scenarios 
                SET scenario_code = %s, scenario_name = %s, scenario_type = %s, 
                    description = %s, status = %s, version_number = %s, is_baseline = %s, 
                    allow_overrides = %s, auto_calculate = %s, consolidation_method = %s,
                    custom_field_definitions = %s, settings = %s,
                    previous_scenario_offsets = %s, next_scenario_offsets = %s,
                    previous_references = %s, upcoming_references = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """
            
            cur.execute(update_query, (
                scenario_data.get('scenario_code'),
                scenario_data.get('scenario_name'),
                scenario_data.get('scenario_type', 'budget'),
                scenario_data.get('description'),
                scenario_data.get('status', 'draft'),
                scenario_data.get('version_number', '1.0'),
                scenario_data.get('is_baseline', False),
                scenario_data.get('allow_overrides', True),
                scenario_data.get('auto_calculate', True),
                scenario_data.get('consolidation_method', 'full'),
                json.dumps(scenario_data.get('custom_field_definitions', [])),
                json.dumps(scenario_data.get('settings', {})),
                json.dumps(scenario_data.get('previous_scenario_offsets', [])),
                json.dumps(scenario_data.get('next_scenario_offsets', [])),
                json.dumps(scenario_data.get('previous_references', [])),
                json.dumps(scenario_data.get('upcoming_references', [])),
                scenario_id
            ))
            
            scenario = cur.fetchone()
            conn.commit()
            
            if not scenario:
                raise HTTPException(status_code=404, detail="Scenario not found")
            
            return scenario
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating scenario: {str(e)}")

@router.delete("/scenarios/{scenario_id}")
async def delete_scenario(
    scenario_id: int,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Delete a scenario"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor()
            
            cur.execute("DELETE FROM scenarios WHERE id = %s RETURNING id", (scenario_id,))
            result = cur.fetchone()
            conn.commit()
            
            if not result:
                raise HTTPException(status_code=404, detail="Scenario not found")
            
            return {"message": "Scenario deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting scenario: {str(e)}")

@router.get("/scenarios/{scenario_id}/custom-fields")
async def get_scenario_custom_fields(
    scenario_id: int,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Get custom field definitions for a scenario"""
    try:
        ensure_fiscal_tables(x_company_database)

        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            cur.execute("SELECT custom_field_definitions FROM scenarios WHERE id = %s", (scenario_id,))
            scenario = cur.fetchone()

            if not scenario:
                return {"error": "Scenario not found"}

            return {
                "scenario_id": scenario_id,
                "custom_fields": scenario['custom_field_definitions'] or []
            }
    except Exception as e:
        return {"error": str(e)}

@router.post("/scenarios/{scenario_id}/custom-fields")
async def add_scenario_custom_field(
    scenario_id: int,
    field_data: dict,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Add a custom field definition to a scenario"""
    try:
        ensure_fiscal_tables(x_company_database)

        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get current custom field definitions
            cur.execute("SELECT custom_field_definitions FROM scenarios WHERE id = %s", (scenario_id,))
            scenario = cur.fetchone()

            if not scenario:
                return {"error": "Scenario not found"}

            current_fields = scenario['custom_field_definitions'] or []

            # Add new field
            new_field = {
                "id": f"field_{len(current_fields) + 1}",
                "name": field_data.get('name'),
                "label": field_data.get('label'),
                "type": field_data.get('type', 'text'),
                "required": field_data.get('required', False),
                "options": field_data.get('options', []),
                "validation": field_data.get('validation', {}),
                "default_value": field_data.get('default_value'),
                "description": field_data.get('description')
            }

            current_fields.append(new_field)

            # Update scenario
            cur.execute("""
                UPDATE scenarios
                SET custom_field_definitions = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (current_fields, scenario_id))

            conn.commit()

            return {
                "message": "Custom field added successfully",
                "field": new_field,
                "custom_fields": current_fields
            }
    except Exception as e:
        return {"error": str(e)}

@router.put("/scenarios/{scenario_id}/custom-fields/{field_id}")
async def update_scenario_custom_field(
    scenario_id: int,
    field_id: str,
    field_data: dict,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Update a custom field definition"""
    try:
        ensure_fiscal_tables(x_company_database)

        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get current custom field definitions
            cur.execute("SELECT custom_field_definitions FROM scenarios WHERE id = %s", (scenario_id,))
            scenario = cur.fetchone()

            if not scenario:
                return {"error": "Scenario not found"}

            current_fields = scenario['custom_field_definitions'] or []

            # Find and update field
            field_updated = False
            for field in current_fields:
                if field['id'] == field_id:
                    field.update({
                        "name": field_data.get('name', field['name']),
                        "label": field_data.get('label', field['label']),
                        "type": field_data.get('type', field['type']),
                        "required": field_data.get('required', field['required']),
                        "options": field_data.get('options', field['options']),
                        "validation": field_data.get('validation', field['validation']),
                        "default_value": field_data.get('default_value', field['default_value']),
                        "description": field_data.get('description', field['description'])
                    })
                    field_updated = True
                    break

            if not field_updated:
                return {"error": "Field not found"}

            # Update scenario
            cur.execute("""
                UPDATE scenarios
                SET custom_field_definitions = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (current_fields, scenario_id))

            conn.commit()

            return {
                "message": "Custom field updated successfully",
                "field": current_fields,
                "custom_fields": current_fields
            }
    except Exception as e:
        return {"error": str(e)}

@router.delete("/scenarios/{scenario_id}/custom-fields/{field_id}")
async def delete_scenario_custom_field(
    scenario_id: int,
    field_id: str,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Delete a custom field definition"""
    try:
        ensure_fiscal_tables(x_company_database)

        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get current custom field definitions
            cur.execute("SELECT custom_field_definitions FROM scenarios WHERE id = %s", (scenario_id,))
            scenario = cur.fetchone()

            if not scenario:
                return {"error": "Scenario not found"}

            current_fields = scenario['custom_field_definitions'] or []

            # Remove field
            current_fields = [field for field in current_fields if field['id'] != field_id]

            # Update scenario
            cur.execute("""
                UPDATE scenarios
                SET custom_field_definitions = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (current_fields, scenario_id))

            conn.commit()

            return {
                "message": "Custom field deleted successfully",
                "custom_fields": current_fields
            }
    except Exception as e:
        return {"error": str(e)}
async def get_scenario_types():
    """Get available scenario types"""
    return {
        "scenario_types": [
            {"code": "actual", "name": "Actual", "description": "Historical actual data"},
            {"code": "budget", "name": "Budget", "description": "Annual budget/plan"},
            {"code": "forecast", "name": "Forecast", "description": "Updated forecast"},
            {"code": "what_if", "name": "What-If", "description": "Scenario analysis"},
            {"code": "stress", "name": "Stress Test", "description": "Stress testing scenarios"},
            {"code": "custom", "name": "Custom", "description": "User-defined scenario type"}
        ]
    }

@router.get("/periods/types")
async def get_period_types():
    """Get available period types"""
    return {
        "period_types": [
            {"code": "month", "name": "Monthly", "description": "Monthly periods"},
            {"code": "quarter", "name": "Quarterly", "description": "Quarterly periods"},
            {"code": "year", "name": "Annual", "description": "Annual periods"},
            {"code": "custom", "name": "Custom", "description": "Custom date ranges"}
        ]
    }
