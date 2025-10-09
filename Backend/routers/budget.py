from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import List, Optional
from pydantic import BaseModel
import psycopg2
import os
import json
from datetime import datetime, date
from decimal import Decimal

router = APIRouter(prefix="/budget", tags=["Budget & Forecasting"])

class BudgetCreate(BaseModel):
    budget_name: str
    budget_type: str
    fiscal_year: int
    period_start: str
    period_end: str
    description: Optional[str] = ""

class BudgetLineCreate(BaseModel):
    budget_id: int
    account_code: str
    account_name: str
    entity_code: Optional[str] = None
    jan_amount: Optional[float] = 0
    feb_amount: Optional[float] = 0
    mar_amount: Optional[float] = 0
    apr_amount: Optional[float] = 0
    may_amount: Optional[float] = 0
    jun_amount: Optional[float] = 0
    jul_amount: Optional[float] = 0
    aug_amount: Optional[float] = 0
    sep_amount: Optional[float] = 0
    oct_amount: Optional[float] = 0
    nov_amount: Optional[float] = 0
    dec_amount: Optional[float] = 0

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
        'password': 'root@123'
    }

@router.get("/")
def get_budgets(company_name: str = Query(...)):
    """Get all budgets for a company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create budgets table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS budgets (
                    id SERIAL PRIMARY KEY,
                    budget_name VARCHAR(255) NOT NULL,
                    budget_version VARCHAR(50) DEFAULT 'v1.0',
                    budget_type VARCHAR(50) NOT NULL,
                    period_start DATE NOT NULL,
                    period_end DATE NOT NULL,
                    fiscal_year INTEGER NOT NULL,
                    total_revenue DECIMAL(20,2) DEFAULT 0,
                    total_expenses DECIMAL(20,2) DEFAULT 0,
                    total_assets DECIMAL(20,2) DEFAULT 0,
                    total_liabilities DECIMAL(20,2) DEFAULT 0,
                    net_income DECIMAL(20,2) DEFAULT 0,
                    status VARCHAR(50) DEFAULT 'Draft',
                    approval_status VARCHAR(50) DEFAULT 'Pending',
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(100)
                )
            """)
            
            cur.execute("""
                SELECT id, budget_name, budget_version, budget_type, period_start, period_end,
                       fiscal_year, total_revenue, total_expenses, total_assets, total_liabilities,
                       net_income, status, approval_status, description, created_at, updated_at
                FROM budgets
                ORDER BY fiscal_year DESC, created_at DESC
            """)
            
            budgets_data = cur.fetchall()
            cur.close()
            conn.close()
            
            budgets = []
            for budget in budgets_data:
                budgets.append({
                    'id': budget[0],
                    'budget_name': budget[1],
                    'budget_version': budget[2],
                    'budget_type': budget[3],
                    'period_start': budget[4].isoformat() if budget[4] else None,
                    'period_end': budget[5].isoformat() if budget[5] else None,
                    'fiscal_year': budget[6],
                    'total_revenue': float(budget[7]) if budget[7] else 0,
                    'total_expenses': float(budget[8]) if budget[8] else 0,
                    'total_assets': float(budget[9]) if budget[9] else 0,
                    'total_liabilities': float(budget[10]) if budget[10] else 0,
                    'net_income': float(budget[11]) if budget[11] else 0,
                    'status': budget[12],
                    'approval_status': budget[13],
                    'description': budget[14],
                    'created_at': budget[15].isoformat() if budget[15] else None,
                    'updated_at': budget[16].isoformat() if budget[16] else None
                })
            
            return {"budgets": budgets}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "budgets": [
                    {
                        'id': 1,
                        'budget_name': 'Annual Budget 2025',
                        'budget_version': 'v1.0',
                        'budget_type': 'ANNUAL',
                        'period_start': '2025-01-01',
                        'period_end': '2025-12-31',
                        'fiscal_year': 2025,
                        'total_revenue': 12000000,
                        'total_expenses': 10000000,
                        'total_assets': 15000000,
                        'total_liabilities': 8000000,
                        'net_income': 2000000,
                        'status': 'Draft',
                        'approval_status': 'Pending',
                        'description': 'Annual operating budget for 2025',
                        'created_at': '2024-12-01T00:00:00',
                        'updated_at': '2024-12-01T00:00:00'
                    },
                    {
                        'id': 2,
                        'budget_name': 'Q1 2025 Budget',
                        'budget_version': 'v1.0',
                        'budget_type': 'QUARTERLY',
                        'period_start': '2025-01-01',
                        'period_end': '2025-03-31',
                        'fiscal_year': 2025,
                        'total_revenue': 3000000,
                        'total_expenses': 2500000,
                        'total_assets': 15000000,
                        'total_liabilities': 8000000,
                        'net_income': 500000,
                        'status': 'Approved',
                        'approval_status': 'Approved',
                        'description': 'First quarter budget for 2025',
                        'created_at': '2024-11-15T00:00:00',
                        'updated_at': '2024-12-01T00:00:00'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting budgets: {e}")
        return {"budgets": []}

@router.post("/")
async def create_budget(request: Request):
    """Create a new budget"""
    try:
        # Parse request body
        body = await request.body()
        try:
            budget_data = json.loads(body)
            print(f"=== BUDGET CREATION REQUEST DATA ===")
            print(f"Raw request data: {budget_data}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        budget_name = budget_data.get('budget_name', '')
        budget_type = budget_data.get('budget_type', 'ANNUAL')
        fiscal_year = int(budget_data.get('fiscal_year', datetime.now().year))
        period_start = budget_data.get('period_start', '')
        period_end = budget_data.get('period_end', '')
        description = budget_data.get('description', '')
        
        # Validate required fields
        if not budget_name:
            raise HTTPException(status_code=400, detail="Budget name is required")
        if not period_start or not period_end:
            raise HTTPException(status_code=400, detail="Period start and end dates are required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Insert new budget
        cur.execute("""
            INSERT INTO budgets (budget_name, budget_type, fiscal_year, period_start, period_end,
                               description, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """, (
            budget_name, budget_type, fiscal_year, period_start, period_end, description
        ))
        
        created_budget_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Budget created successfully",
            "budget": {
                "id": created_budget_id,
                "budget_name": budget_name,
                "budget_type": budget_type,
                "fiscal_year": fiscal_year,
                "status": "Draft",
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating budget: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create budget: {str(e)}"
        )

@router.get("/{budget_id}/lines")
def get_budget_lines(budget_id: int, company_name: str = Query(...)):
    """Get budget lines for a specific budget"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create budget_lines table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS budget_lines (
                    id SERIAL PRIMARY KEY,
                    budget_id INTEGER NOT NULL,
                    account_code VARCHAR(100) NOT NULL,
                    account_name VARCHAR(255) NOT NULL,
                    entity_code VARCHAR(100),
                    entity_name VARCHAR(255),
                    jan_amount DECIMAL(15,2) DEFAULT 0,
                    feb_amount DECIMAL(15,2) DEFAULT 0,
                    mar_amount DECIMAL(15,2) DEFAULT 0,
                    apr_amount DECIMAL(15,2) DEFAULT 0,
                    may_amount DECIMAL(15,2) DEFAULT 0,
                    jun_amount DECIMAL(15,2) DEFAULT 0,
                    jul_amount DECIMAL(15,2) DEFAULT 0,
                    aug_amount DECIMAL(15,2) DEFAULT 0,
                    sep_amount DECIMAL(15,2) DEFAULT 0,
                    oct_amount DECIMAL(15,2) DEFAULT 0,
                    nov_amount DECIMAL(15,2) DEFAULT 0,
                    dec_amount DECIMAL(15,2) DEFAULT 0,
                    q1_total DECIMAL(15,2) DEFAULT 0,
                    q2_total DECIMAL(15,2) DEFAULT 0,
                    q3_total DECIMAL(15,2) DEFAULT 0,
                    q4_total DECIMAL(15,2) DEFAULT 0,
                    annual_total DECIMAL(15,2) DEFAULT 0,
                    line_type VARCHAR(50) DEFAULT 'Regular',
                    status VARCHAR(50) DEFAULT 'Active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cur.execute("""
                SELECT id, account_code, account_name, entity_code, entity_name,
                       jan_amount, feb_amount, mar_amount, apr_amount, may_amount, jun_amount,
                       jul_amount, aug_amount, sep_amount, oct_amount, nov_amount, dec_amount,
                       q1_total, q2_total, q3_total, q4_total, annual_total, line_type, status
                FROM budget_lines
                WHERE budget_id = %s
                ORDER BY account_code
            """, (budget_id,))
            
            lines_data = cur.fetchall()
            cur.close()
            conn.close()
            
            lines = []
            for line in lines_data:
                lines.append({
                    'id': line[0],
                    'account_code': line[1],
                    'account_name': line[2],
                    'entity_code': line[3],
                    'entity_name': line[4],
                    'jan_amount': float(line[5]) if line[5] else 0,
                    'feb_amount': float(line[6]) if line[6] else 0,
                    'mar_amount': float(line[7]) if line[7] else 0,
                    'apr_amount': float(line[8]) if line[8] else 0,
                    'may_amount': float(line[9]) if line[9] else 0,
                    'jun_amount': float(line[10]) if line[10] else 0,
                    'jul_amount': float(line[11]) if line[11] else 0,
                    'aug_amount': float(line[12]) if line[12] else 0,
                    'sep_amount': float(line[13]) if line[13] else 0,
                    'oct_amount': float(line[14]) if line[14] else 0,
                    'nov_amount': float(line[15]) if line[15] else 0,
                    'dec_amount': float(line[16]) if line[16] else 0,
                    'q1_total': float(line[17]) if line[17] else 0,
                    'q2_total': float(line[18]) if line[18] else 0,
                    'q3_total': float(line[19]) if line[19] else 0,
                    'q4_total': float(line[20]) if line[20] else 0,
                    'annual_total': float(line[21]) if line[21] else 0,
                    'line_type': line[22],
                    'status': line[23]
                })
            
            return {"budget_lines": lines}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "budget_lines": [
                    {
                        'id': 1,
                        'account_code': '4000',
                        'account_name': 'Sales Revenue',
                        'entity_code': 'ENT_001',
                        'entity_name': 'Main Entity',
                        'jan_amount': 1000000,
                        'feb_amount': 1000000,
                        'mar_amount': 1000000,
                        'apr_amount': 1000000,
                        'may_amount': 1000000,
                        'jun_amount': 1000000,
                        'jul_amount': 1000000,
                        'aug_amount': 1000000,
                        'sep_amount': 1000000,
                        'oct_amount': 1000000,
                        'nov_amount': 1000000,
                        'dec_amount': 1000000,
                        'q1_total': 3000000,
                        'q2_total': 3000000,
                        'q3_total': 3000000,
                        'q4_total': 3000000,
                        'annual_total': 12000000,
                        'line_type': 'Regular',
                        'status': 'Active'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting budget lines: {e}")
        return {"budget_lines": []}

@router.post("/{budget_id}/lines")
async def create_budget_line(budget_id: int, request: Request):
    """Create a budget line"""
    try:
        # Parse request body
        body = await request.body()
        try:
            line_data = json.loads(body)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        account_code = line_data.get('account_code', '')
        account_name = line_data.get('account_name', '')
        entity_code = line_data.get('entity_code', '')
        entity_name = line_data.get('entity_name', '')
        
        # Monthly amounts
        monthly_amounts = {}
        months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
        
        for month in months:
            monthly_amounts[f'{month}_amount'] = float(line_data.get(f'{month}_amount', 0))
        
        # Calculate totals
        q1_total = monthly_amounts['jan_amount'] + monthly_amounts['feb_amount'] + monthly_amounts['mar_amount']
        q2_total = monthly_amounts['apr_amount'] + monthly_amounts['may_amount'] + monthly_amounts['jun_amount']
        q3_total = monthly_amounts['jul_amount'] + monthly_amounts['aug_amount'] + monthly_amounts['sep_amount']
        q4_total = monthly_amounts['oct_amount'] + monthly_amounts['nov_amount'] + monthly_amounts['dec_amount']
        annual_total = q1_total + q2_total + q3_total + q4_total
        
        # Validate required fields
        if not account_code:
            raise HTTPException(status_code=400, detail="Account code is required")
        if not account_name:
            raise HTTPException(status_code=400, detail="Account name is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Insert new budget line
        cur.execute("""
            INSERT INTO budget_lines (budget_id, account_code, account_name, entity_code, entity_name,
                                    jan_amount, feb_amount, mar_amount, apr_amount, may_amount, jun_amount,
                                    jul_amount, aug_amount, sep_amount, oct_amount, nov_amount, dec_amount,
                                    q1_total, q2_total, q3_total, q4_total, annual_total,
                                    created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """, (
            budget_id, account_code, account_name, entity_code, entity_name,
            monthly_amounts['jan_amount'], monthly_amounts['feb_amount'], monthly_amounts['mar_amount'],
            monthly_amounts['apr_amount'], monthly_amounts['may_amount'], monthly_amounts['jun_amount'],
            monthly_amounts['jul_amount'], monthly_amounts['aug_amount'], monthly_amounts['sep_amount'],
            monthly_amounts['oct_amount'], monthly_amounts['nov_amount'], monthly_amounts['dec_amount'],
            q1_total, q2_total, q3_total, q4_total, annual_total
        ))
        
        created_line_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Budget line created successfully",
            "budget_line": {
                "id": created_line_id,
                "budget_id": budget_id,
                "account_code": account_code,
                "account_name": account_name,
                "annual_total": annual_total,
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating budget line: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create budget line: {str(e)}"
        )

@router.get("/forecasts")
def get_forecasts(company_name: str = Query(...)):
    """Get forecasts for a company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create forecasts table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS forecasts (
                    id SERIAL PRIMARY KEY,
                    forecast_name VARCHAR(255) NOT NULL,
                    forecast_type VARCHAR(50) NOT NULL,
                    forecast_method VARCHAR(50) NOT NULL,
                    forecast_frequency VARCHAR(50) DEFAULT 'MONTHLY',
                    forecast_start_date DATE NOT NULL,
                    forecast_end_date DATE NOT NULL,
                    forecast_horizon INTEGER DEFAULT 12,
                    base_period VARCHAR(50),
                    growth_rate DECIMAL(5,2) DEFAULT 0,
                    seasonality_factor DECIMAL(5,2) DEFAULT 0,
                    status VARCHAR(50) DEFAULT 'Draft',
                    accuracy_score DECIMAL(5,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(100)
                )
            """)
            
            cur.execute("""
                SELECT id, forecast_name, forecast_type, forecast_method, forecast_frequency,
                       forecast_start_date, forecast_end_date, forecast_horizon, base_period,
                       growth_rate, seasonality_factor, status, accuracy_score, created_at
                FROM forecasts
                ORDER BY created_at DESC
            """)
            
            forecasts_data = cur.fetchall()
            cur.close()
            conn.close()
            
            forecasts = []
            for forecast in forecasts_data:
                forecasts.append({
                    'id': forecast[0],
                    'forecast_name': forecast[1],
                    'forecast_type': forecast[2],
                    'forecast_method': forecast[3],
                    'forecast_frequency': forecast[4],
                    'forecast_start_date': forecast[5].isoformat() if forecast[5] else None,
                    'forecast_end_date': forecast[6].isoformat() if forecast[6] else None,
                    'forecast_horizon': forecast[7],
                    'base_period': forecast[8],
                    'growth_rate': float(forecast[9]) if forecast[9] else 0,
                    'seasonality_factor': float(forecast[10]) if forecast[10] else 0,
                    'status': forecast[11],
                    'accuracy_score': float(forecast[12]) if forecast[12] else None,
                    'created_at': forecast[13].isoformat() if forecast[13] else None
                })
            
            return {"forecasts": forecasts}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "forecasts": [
                    {
                        'id': 1,
                        'forecast_name': 'Revenue Forecast 2025',
                        'forecast_type': 'REVENUE',
                        'forecast_method': 'TREND_ANALYSIS',
                        'forecast_frequency': 'MONTHLY',
                        'forecast_start_date': '2025-01-01',
                        'forecast_end_date': '2025-12-31',
                        'forecast_horizon': 12,
                        'base_period': '2024',
                        'growth_rate': 8.5,
                        'seasonality_factor': 1.2,
                        'status': 'Active',
                        'accuracy_score': 92.5,
                        'created_at': '2024-12-01T00:00:00'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting forecasts: {e}")
        return {"forecasts": []}

@router.post("/forecasts")
async def create_forecast(request: Request):
    """Create a new forecast"""
    try:
        # Parse request body
        body = await request.body()
        try:
            forecast_data = json.loads(body)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        forecast_name = forecast_data.get('forecast_name', '')
        forecast_type = forecast_data.get('forecast_type', 'REVENUE')
        forecast_method = forecast_data.get('forecast_method', 'TREND_ANALYSIS')
        forecast_start_date = forecast_data.get('forecast_start_date', '')
        forecast_end_date = forecast_data.get('forecast_end_date', '')
        growth_rate = float(forecast_data.get('growth_rate', 0))
        
        # Validate required fields
        if not forecast_name:
            raise HTTPException(status_code=400, detail="Forecast name is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Insert new forecast
        cur.execute("""
            INSERT INTO forecasts (forecast_name, forecast_type, forecast_method,
                                 forecast_start_date, forecast_end_date, growth_rate,
                                 created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """, (
            forecast_name, forecast_type, forecast_method,
            forecast_start_date, forecast_end_date, growth_rate
        ))
        
        created_forecast_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Forecast created successfully",
            "forecast": {
                "id": created_forecast_id,
                "forecast_name": forecast_name,
                "forecast_type": forecast_type,
                "status": "Draft",
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating forecast: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create forecast: {str(e)}"
        )
