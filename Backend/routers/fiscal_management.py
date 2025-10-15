"""
Fiscal Year & Scenario Management API Router
Comprehensive consolidation-ready API for fiscal year, period, and scenario management
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text, desc, asc
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field
import json

from company_database import get_company_db
from models.fiscal_management import (
    FiscalYear, Period, Scenario, ScenarioData, 
    ScenarioComparison, ConsolidationRule
)

router = APIRouter(prefix="/api/fiscal-management", tags=["Fiscal Management"])

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

class FiscalYearUpdate(BaseModel):
    year_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    description: Optional[str] = None
    is_consolidation_year: Optional[bool] = None
    consolidation_method: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class PeriodCreate(BaseModel):
    fiscal_year_id: int
    period_code: str = Field(..., max_length=20)
    period_name: str = Field(..., max_length=255)
    period_type: str = Field(default="month")
    start_date: date
    end_date: date
    status: str = Field(default="open")
    is_rollup_period: bool = Field(default=False)
    parent_period_id: Optional[int] = None
    sort_order: int = Field(default=0)
    consolidation_enabled: bool = Field(default=True)
    description: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class PeriodUpdate(BaseModel):
    period_name: Optional[str] = None
    period_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    is_rollup_period: Optional[bool] = None
    parent_period_id: Optional[int] = None
    sort_order: Optional[int] = None
    consolidation_enabled: Optional[bool] = None
    consolidation_cutoff_date: Optional[datetime] = None
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ScenarioCreate(BaseModel):
    fiscal_year_id: int
    scenario_code: str = Field(..., max_length=50)
    scenario_name: str = Field(..., max_length=255)
    scenario_type: str = Field(..., description="actual, budget, forecast, what_if, stress, custom")
    parent_scenario_id: Optional[int] = None
    version_number: str = Field(default="1.0")
    status: str = Field(default="draft")
    is_baseline: bool = Field(default=False)
    is_consolidated: bool = Field(default=False)
    allow_overrides: bool = Field(default=True)
    auto_calculate: bool = Field(default=True)
    description: Optional[str] = None
    assumptions: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    consolidation_method: str = Field(default="full")
    settings: Dict[str, Any] = Field(default_factory=dict)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ScenarioUpdate(BaseModel):
    scenario_name: Optional[str] = None
    scenario_type: Optional[str] = None
    parent_scenario_id: Optional[int] = None
    version_number: Optional[str] = None
    revision_number: Optional[int] = None
    status: Optional[str] = None
    is_baseline: Optional[bool] = None
    is_consolidated: Optional[bool] = None
    allow_overrides: Optional[bool] = None
    auto_calculate: Optional[bool] = None
    description: Optional[str] = None
    assumptions: Optional[str] = None
    tags: Optional[List[str]] = None
    consolidation_method: Optional[str] = None
    elimination_rules: Optional[Dict[str, Any]] = None
    approval_status: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class BulkPeriodCreate(BaseModel):
    fiscal_year_id: int
    period_type: str = Field(default="month")  # month, quarter, custom
    auto_generate: bool = Field(default=True)
    custom_periods: Optional[List[PeriodCreate]] = None

class ScenarioDataCreate(BaseModel):
    scenario_id: int
    period_id: int
    entity_id: Optional[int] = None
    account_id: Optional[int] = None
    amount: float = Field(default=0.0)
    currency: str = Field(default="USD")
    elimination_type: Optional[str] = None
    adjustment_type: Optional[str] = None
    source_system: Optional[str] = None
    notes: Optional[str] = None
    custom_dimensions: Dict[str, Any] = Field(default_factory=dict)

# ===== FISCAL YEAR ENDPOINTS =====

@router.get("/fiscal-years")
async def get_fiscal_years(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    year_code: Optional[str] = Query(None),
    include_periods: bool = Query(False),
    include_scenarios: bool = Query(False),
    db: Session = Depends(get_company_db)
):
    """Get all fiscal years with optional filtering"""
    query = db.query(FiscalYear)
    
    if status:
        query = query.filter(FiscalYear.status == status)
    if year_code:
        query = query.filter(FiscalYear.year_code.ilike(f"%{year_code}%"))
    
    if include_periods:
        query = query.options(joinedload(FiscalYear.periods))
    if include_scenarios:
        query = query.options(joinedload(FiscalYear.scenarios))
    
    fiscal_years = query.offset(skip).limit(limit).all()
    
    return {
        "fiscal_years": fiscal_years,
        "total": db.query(FiscalYear).count(),
        "skip": skip,
        "limit": limit
    }

@router.get("/fiscal-years/{fiscal_year_id}")
async def get_fiscal_year(
    fiscal_year_id: int,
    include_periods: bool = Query(True),
    include_scenarios: bool = Query(True),
    db: Session = Depends(get_company_db)
):
    """Get a specific fiscal year with full details"""
    query = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id)
    
    if include_periods:
        query = query.options(joinedload(FiscalYear.periods))
    if include_scenarios:
        query = query.options(joinedload(FiscalYear.scenarios))
    
    fiscal_year = query.first()
    if not fiscal_year:
        raise HTTPException(status_code=404, detail="Fiscal year not found")
    
    return fiscal_year

@router.post("/fiscal-years")
async def create_fiscal_year(
    fiscal_year_data: FiscalYearCreate,
    db: Session = Depends(get_company_db)
):
    """Create a new fiscal year"""
    # Check for duplicate year code
    existing = db.query(FiscalYear).filter(FiscalYear.year_code == fiscal_year_data.year_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Fiscal year code already exists")
    
    # Validate date range
    if fiscal_year_data.start_date >= fiscal_year_data.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    fiscal_year = FiscalYear(**fiscal_year_data.dict())
    db.add(fiscal_year)
    db.commit()
    db.refresh(fiscal_year)
    
    return fiscal_year

@router.put("/fiscal-years/{fiscal_year_id}")
async def update_fiscal_year(
    fiscal_year_id: int,
    fiscal_year_data: FiscalYearUpdate,
    db: Session = Depends(get_company_db)
):
    """Update a fiscal year"""
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(status_code=404, detail="Fiscal year not found")
    
    update_data = fiscal_year_data.dict(exclude_unset=True)
    
    # Validate date range if both dates are provided
    start_date = update_data.get('start_date', fiscal_year.start_date)
    end_date = update_data.get('end_date', fiscal_year.end_date)
    if start_date >= end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    for field, value in update_data.items():
        setattr(fiscal_year, field, value)
    
    fiscal_year.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(fiscal_year)
    
    return fiscal_year

@router.delete("/fiscal-years/{fiscal_year_id}")
async def delete_fiscal_year(
    fiscal_year_id: int,
    force: bool = Query(False, description="Force delete even if periods/scenarios exist"),
    db: Session = Depends(get_company_db)
):
    """Delete a fiscal year"""
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(status_code=404, detail="Fiscal year not found")
    
    # Check for dependent records
    period_count = db.query(Period).filter(Period.fiscal_year_id == fiscal_year_id).count()
    scenario_count = db.query(Scenario).filter(Scenario.fiscal_year_id == fiscal_year_id).count()
    
    if (period_count > 0 or scenario_count > 0) and not force:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete fiscal year with {period_count} periods and {scenario_count} scenarios. Use force=true to override."
        )
    
    db.delete(fiscal_year)
    db.commit()
    
    return {"message": "Fiscal year deleted successfully"}

# ===== PERIOD ENDPOINTS =====

@router.get("/fiscal-years/{fiscal_year_id}/periods")
async def get_periods(
    fiscal_year_id: int,
    period_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    include_children: bool = Query(True),
    db: Session = Depends(get_company_db)
):
    """Get all periods for a fiscal year"""
    query = db.query(Period).filter(Period.fiscal_year_id == fiscal_year_id)
    
    if period_type:
        query = query.filter(Period.period_type == period_type)
    if status:
        query = query.filter(Period.status == status)
    
    periods = query.order_by(Period.sort_order, Period.start_date).all()
    
    return {
        "periods": periods,
        "fiscal_year_id": fiscal_year_id,
        "total": len(periods)
    }

@router.post("/fiscal-years/{fiscal_year_id}/periods")
async def create_period(
    fiscal_year_id: int,
    period_data: PeriodCreate,
    db: Session = Depends(get_company_db)
):
    """Create a new period"""
    # Verify fiscal year exists
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(status_code=404, detail="Fiscal year not found")
    
    # Check for duplicate period code within fiscal year
    existing = db.query(Period).filter(
        and_(Period.fiscal_year_id == fiscal_year_id, Period.period_code == period_data.period_code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Period code already exists in this fiscal year")
    
    # Validate date range
    if period_data.start_date >= period_data.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Ensure period is within fiscal year range
    if (period_data.start_date < fiscal_year.start_date or 
        period_data.end_date > fiscal_year.end_date):
        raise HTTPException(status_code=400, detail="Period must be within fiscal year date range")
    
    period_data.fiscal_year_id = fiscal_year_id
    period = Period(**period_data.dict())
    db.add(period)
    db.commit()
    db.refresh(period)
    
    return period

@router.post("/fiscal-years/{fiscal_year_id}/periods/bulk")
async def create_periods_bulk(
    fiscal_year_id: int,
    bulk_data: BulkPeriodCreate,
    db: Session = Depends(get_company_db)
):
    """Create multiple periods at once"""
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(status_code=404, detail="Fiscal year not found")
    
    created_periods = []
    
    if bulk_data.auto_generate and bulk_data.period_type == "month":
        # Auto-generate monthly periods
        from dateutil.relativedelta import relativedelta
        current_date = fiscal_year.start_date
        month_num = 1
        
        while current_date < fiscal_year.end_date:
            # Calculate end of month
            next_month = current_date + relativedelta(months=1)
            period_end = min(next_month - relativedelta(days=1), fiscal_year.end_date)
            
            period = Period(
                fiscal_year_id=fiscal_year_id,
                period_code=f"P{month_num:02d}",
                period_name=f"{current_date.strftime('%B %Y')}",
                period_type="month",
                start_date=current_date,
                end_date=period_end,
                sort_order=month_num,
                status="open",
                consolidation_enabled=True
            )
            
            db.add(period)
            created_periods.append(period)
            
            current_date = next_month
            month_num += 1
    
    elif bulk_data.custom_periods:
        # Create custom periods
        for period_data in bulk_data.custom_periods:
            period_data.fiscal_year_id = fiscal_year_id
            period = Period(**period_data.dict())
            db.add(period)
            created_periods.append(period)
    
    db.commit()
    
    for period in created_periods:
        db.refresh(period)
    
    return {
        "created_periods": created_periods,
        "count": len(created_periods)
    }

@router.put("/periods/{period_id}")
async def update_period(
    period_id: int,
    period_data: PeriodUpdate,
    db: Session = Depends(get_company_db)
):
    """Update a period"""
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    
    update_data = period_data.dict(exclude_unset=True)
    
    # Validate date range if both dates are provided
    start_date = update_data.get('start_date', period.start_date)
    end_date = update_data.get('end_date', period.end_date)
    if start_date >= end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    for field, value in update_data.items():
        setattr(period, field, value)
    
    period.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(period)
    
    return period

# ===== SCENARIO ENDPOINTS =====

@router.get("/fiscal-years/{fiscal_year_id}/scenarios")
async def get_scenarios(
    fiscal_year_id: int,
    scenario_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_baseline: Optional[bool] = Query(None),
    include_data: bool = Query(False),
    db: Session = Depends(get_company_db)
):
    """Get all scenarios for a fiscal year"""
    query = db.query(Scenario).filter(Scenario.fiscal_year_id == fiscal_year_id)
    
    if scenario_type:
        query = query.filter(Scenario.scenario_type == scenario_type)
    if status:
        query = query.filter(Scenario.status == status)
    if is_baseline is not None:
        query = query.filter(Scenario.is_baseline == is_baseline)
    
    if include_data:
        query = query.options(joinedload(Scenario.scenario_data))
    
    scenarios = query.order_by(Scenario.scenario_code).all()
    
    return {
        "scenarios": scenarios,
        "fiscal_year_id": fiscal_year_id,
        "total": len(scenarios)
    }

@router.get("/scenarios/{scenario_id}")
async def get_scenario(
    scenario_id: int,
    include_data: bool = Query(False),
    include_children: bool = Query(False),
    db: Session = Depends(get_company_db)
):
    """Get a specific scenario with details"""
    query = db.query(Scenario).filter(Scenario.id == scenario_id)
    
    if include_data:
        query = query.options(joinedload(Scenario.scenario_data))
    if include_children:
        query = query.options(joinedload(Scenario.child_scenarios))
    
    scenario = query.first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return scenario

@router.post("/fiscal-years/{fiscal_year_id}/scenarios")
async def create_scenario(
    fiscal_year_id: int,
    scenario_data: ScenarioCreate,
    db: Session = Depends(get_company_db)
):
    """Create a new scenario"""
    # Verify fiscal year exists
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(status_code=404, detail="Fiscal year not found")
    
    # Check for duplicate scenario code within fiscal year
    existing = db.query(Scenario).filter(
        and_(Scenario.fiscal_year_id == fiscal_year_id, Scenario.scenario_code == scenario_data.scenario_code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Scenario code already exists in this fiscal year")
    
    scenario_data.fiscal_year_id = fiscal_year_id
    scenario = Scenario(**scenario_data.dict())
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    
    return scenario

@router.put("/scenarios/{scenario_id}")
async def update_scenario(
    scenario_id: int,
    scenario_data: ScenarioUpdate,
    db: Session = Depends(get_company_db)
):
    """Update a scenario"""
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    update_data = scenario_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(scenario, field, value)
    
    scenario.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(scenario)
    
    return scenario

@router.post("/scenarios/{scenario_id}/duplicate")
async def duplicate_scenario(
    scenario_id: int,
    new_scenario_code: str = Body(..., embed=True),
    new_scenario_name: str = Body(..., embed=True),
    copy_data: bool = Body(default=False, embed=True),
    db: Session = Depends(get_company_db)
):
    """Duplicate an existing scenario"""
    original_scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not original_scenario:
        raise HTTPException(status_code=404, detail="Original scenario not found")
    
    # Check for duplicate scenario code
    existing = db.query(Scenario).filter(
        and_(Scenario.fiscal_year_id == original_scenario.fiscal_year_id, 
             Scenario.scenario_code == new_scenario_code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="New scenario code already exists")
    
    # Create new scenario
    new_scenario = Scenario(
        fiscal_year_id=original_scenario.fiscal_year_id,
        scenario_code=new_scenario_code,
        scenario_name=new_scenario_name,
        scenario_type=original_scenario.scenario_type,
        parent_scenario_id=scenario_id,
        version_number="1.0",
        revision_number=1,
        status="draft",
        is_baseline=False,
        is_consolidated=original_scenario.is_consolidated,
        allow_overrides=original_scenario.allow_overrides,
        auto_calculate=original_scenario.auto_calculate,
        description=f"Copy of {original_scenario.scenario_name}",
        consolidation_method=original_scenario.consolidation_method,
        settings=original_scenario.settings,
        custom_fields=original_scenario.custom_fields
    )
    
    db.add(new_scenario)
    db.commit()
    db.refresh(new_scenario)
    
    # Copy data if requested
    if copy_data:
        original_data = db.query(ScenarioData).filter(ScenarioData.scenario_id == scenario_id).all()
        for data_point in original_data:
            new_data = ScenarioData(
                scenario_id=new_scenario.id,
                period_id=data_point.period_id,
                entity_id=data_point.entity_id,
                account_id=data_point.account_id,
                amount=data_point.amount,
                currency=data_point.currency,
                notes=f"Copied from scenario {original_scenario.scenario_code}",
                custom_dimensions=data_point.custom_dimensions
            )
            db.add(new_data)
        
        db.commit()
    
    return new_scenario

# ===== SCENARIO DATA ENDPOINTS =====

@router.get("/scenarios/{scenario_id}/data")
async def get_scenario_data(
    scenario_id: int,
    period_id: Optional[int] = Query(None),
    entity_id: Optional[int] = Query(None),
    account_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=10000),
    db: Session = Depends(get_company_db)
):
    """Get scenario data with filtering"""
    query = db.query(ScenarioData).filter(ScenarioData.scenario_id == scenario_id)
    
    if period_id:
        query = query.filter(ScenarioData.period_id == period_id)
    if entity_id:
        query = query.filter(ScenarioData.entity_id == entity_id)
    if account_id:
        query = query.filter(ScenarioData.account_id == account_id)
    
    total = query.count()
    data = query.offset(skip).limit(limit).all()
    
    return {
        "data": data,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("/scenarios/{scenario_id}/data")
async def create_scenario_data(
    scenario_id: int,
    data_points: List[ScenarioDataCreate],
    db: Session = Depends(get_company_db)
):
    """Create scenario data points"""
    # Verify scenario exists
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    created_data = []
    for data_point in data_points:
        data_point.scenario_id = scenario_id
        scenario_data = ScenarioData(**data_point.dict())
        db.add(scenario_data)
        created_data.append(scenario_data)
    
    db.commit()
    
    for data in created_data:
        db.refresh(data)
    
    return {
        "created_data": created_data,
        "count": len(created_data)
    }

# ===== UTILITY ENDPOINTS =====

@router.get("/fiscal-years/{fiscal_year_id}/summary")
async def get_fiscal_year_summary(
    fiscal_year_id: int,
    db: Session = Depends(get_company_db)
):
    """Get comprehensive summary of fiscal year"""
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(status_code=404, detail="Fiscal year not found")
    
    # Get counts and statistics
    period_count = db.query(Period).filter(Period.fiscal_year_id == fiscal_year_id).count()
    scenario_count = db.query(Scenario).filter(Scenario.fiscal_year_id == fiscal_year_id).count()
    
    # Get scenario breakdown by type
    scenario_types = db.query(
        Scenario.scenario_type, 
        func.count(Scenario.id).label('count')
    ).filter(Scenario.fiscal_year_id == fiscal_year_id).group_by(Scenario.scenario_type).all()
    
    # Get period breakdown by type
    period_types = db.query(
        Period.period_type,
        func.count(Period.id).label('count')
    ).filter(Period.fiscal_year_id == fiscal_year_id).group_by(Period.period_type).all()
    
    return {
        "fiscal_year": fiscal_year,
        "statistics": {
            "total_periods": period_count,
            "total_scenarios": scenario_count,
            "scenario_types": [{"type": st[0], "count": st[1]} for st in scenario_types],
            "period_types": [{"type": pt[0], "count": pt[1]} for pt in period_types]
        }
    }

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
