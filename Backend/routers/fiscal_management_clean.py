"""
Fiscal Year & Scenario Management API Router
Clean working version to prevent crashes
"""

from fastapi import APIRouter, HTTPException, Query, Header
from typing import List, Optional, Dict, Any
from datetime import datetime, date
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
                    settings JSONB DEFAULT '{}',
                    custom_fields JSONB DEFAULT '{}',
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_by INTEGER,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
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
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_by INTEGER,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(fiscal_year_id, scenario_code)
                )
            """)
            
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

# ===== ENDPOINTS =====

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "fiscal_management"}

@router.get("/fiscal-years")
async def get_fiscal_years(
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Get all fiscal years"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cur.execute("SELECT * FROM fiscal_years ORDER BY start_date DESC")
            fiscal_years = cur.fetchall()
            
            return {
                "fiscal_years": fiscal_years,
                "total": len(fiscal_years)
            }
    except Exception as e:
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
    fiscal_year_data: FiscalYearCreate,
    x_company_database: str = Header(..., alias="X-Company-Database")
):
    """Create a new fiscal year"""
    try:
        ensure_fiscal_tables(x_company_database)
        
        with get_company_connection(x_company_database) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Simple insert
            insert_query = """
                INSERT INTO fiscal_years (
                    year_code, year_name, start_date, end_date, status, description
                ) VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """
            
            cur.execute(insert_query, (
                fiscal_year_data.year_code,
                fiscal_year_data.year_name,
                fiscal_year_data.start_date,
                fiscal_year_data.end_date,
                fiscal_year_data.status,
                fiscal_year_data.description
            ))
            
            fiscal_year = cur.fetchone()
            conn.commit()
            
            return fiscal_year
    except Exception as e:
        return {"error": str(e)}

@router.get("/scenarios/types")
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
