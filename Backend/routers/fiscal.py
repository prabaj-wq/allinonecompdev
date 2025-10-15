from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

router = APIRouter(prefix="/fiscal", tags=["fiscal"])

# Define enums locally to avoid import issues
class FiscalYearStatus(str, Enum):
    active = "active"
    closed = "closed"
    draft = "draft"

class PeriodType(str, Enum):
    monthly = "monthly"
    quarterly = "quarterly"
    yearly = "yearly"

class PeriodStatus(str, Enum):
    open = "open"
    closed = "closed"
    locked = "locked"

class ScenarioType(str, Enum):
    actual = "actual"
    budget = "budget"
    forecast = "forecast"

class ScenarioStatus(str, Enum):
    draft = "draft"
    active = "active"
    archived = "archived"

# Simple response models
class FiscalYearResponse(BaseModel):
    id: int
    name: str
    code: str
    start_date: datetime
    end_date: datetime
    status: FiscalYearStatus

class PeriodResponse(BaseModel):
    id: int
    code: str
    name: str
    start_date: datetime
    end_date: datetime
    type: PeriodType
    status: PeriodStatus

class ScenarioResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    type: ScenarioType
    status: ScenarioStatus

# Simple create/update models
class PeriodCreate(BaseModel):
    code: str
    name: str
    start_date: datetime
    end_date: datetime
    type: PeriodType
    status: PeriodStatus = PeriodStatus.open
    is_rollup: bool = False
    parent_period_id: Optional[int] = None

class PeriodUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    type: Optional[PeriodType] = None
    status: Optional[PeriodStatus] = None

class ScenarioCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    type: ScenarioType
    status: ScenarioStatus = ScenarioStatus.draft

class ScenarioUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[ScenarioType] = None
    status: Optional[ScenarioStatus] = None

class FiscalYearCreate(BaseModel):
    name: str
    code: str
    start_date: datetime
    end_date: datetime
    status: FiscalYearStatus = FiscalYearStatus.active

class FiscalYearUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[FiscalYearStatus] = None

# Fiscal Year Endpoints
@router.post("/years", response_model=FiscalYearResponse, status_code=status.HTTP_201_CREATED)
async def create_fiscal_year(fiscal_year: FiscalYearCreate):
    """Create a new fiscal year - mock implementation"""
    return {
        "id": 1,
        "name": fiscal_year.name,
        "code": fiscal_year.code,
        "start_date": fiscal_year.start_date,
        "end_date": fiscal_year.end_date,
        "status": fiscal_year.status
    }

@router.get("/years", response_model=List[FiscalYearResponse])
async def get_fiscal_years():
    """Get all fiscal years - mock implementation"""
    return [
        {
            "id": 1,
            "name": "FY 2024",
            "code": "FY24",
            "start_date": "2024-01-01T00:00:00",
            "end_date": "2024-12-31T23:59:59",
            "status": "active"
        }
    ]

@router.get("/years/{fiscal_year_id}", response_model=FiscalYearResponse)
async def get_fiscal_year(fiscal_year_id: int):
    """Get fiscal year by ID - mock implementation"""
    if fiscal_year_id == 1:
        return {
            "id": 1,
            "name": "FY 2024",
            "code": "FY24",
            "start_date": "2024-01-01T00:00:00",
            "end_date": "2024-12-31T23:59:59",
            "status": "active"
        }
    raise HTTPException(status_code=404, detail="Fiscal year not found")

@router.put("/years/{fiscal_year_id}", response_model=FiscalYearResponse)
async def update_fiscal_year(fiscal_year_id: int, fiscal_year_update: FiscalYearUpdate):
    """Update a fiscal year - mock implementation"""
    if fiscal_year_id == 1:
        return {
            "id": 1,
            "name": fiscal_year_update.name,
            "code": fiscal_year_update.code,
            "start_date": fiscal_year_update.start_date,
            "end_date": fiscal_year_update.end_date,
            "status": fiscal_year_update.status
        }
    raise HTTPException(status_code=404, detail="Fiscal year not found")

@router.delete("/years/{fiscal_year_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fiscal_year(fiscal_year_id: int):
    """Delete a fiscal year - mock implementation"""
    if fiscal_year_id != 1:
        raise HTTPException(status_code=404, detail="Fiscal year not found")
    return None

# Period Endpoints
@router.post("/years/{fiscal_year_id}/periods", response_model=PeriodResponse, status_code=status.HTTP_201_CREATED)
async def create_period(fiscal_year_id: int, period: PeriodCreate):
    """Create a new period - mock implementation"""
    return {
        "id": 1,
        "code": period.code,
        "name": period.name,
        "start_date": period.start_date,
        "end_date": period.end_date,
        "type": period.type,
        "status": period.status,
        "fiscal_year_id": fiscal_year_id
    }

@router.get("/years/{fiscal_year_id}/periods", response_model=List[PeriodResponse])
async def get_periods(fiscal_year_id: int):
    """Get all periods for a fiscal year - mock implementation"""
    if fiscal_year_id == 1:
        return [
            {
                "id": 1,
                "code": "Q1-24",
                "name": "Q1 2024",
                "start_date": "2024-01-01T00:00:00",
                "end_date": "2024-03-31T23:59:59",
                "type": "quarterly",
                "status": "open",
                "fiscal_year_id": fiscal_year_id
            }
        ]
    raise HTTPException(status_code=404, detail="Fiscal year not found")

@router.get("/periods/{period_id}", response_model=PeriodResponse)
async def get_period(period_id: int):
    """Get a period by ID - mock implementation"""
    if period_id == 1:
        return {
            "id": 1,
            "code": "Q1-24",
            "name": "Q1 2024",
            "start_date": "2024-01-01T00:00:00",
            "end_date": "2024-03-31T23:59:59",
            "type": "quarterly",
            "status": "open",
            "fiscal_year_id": 1
        }
    raise HTTPException(status_code=404, detail="Period not found")

@router.put("/periods/{period_id}", response_model=PeriodResponse)
async def update_period(period_id: int, period_update: PeriodUpdate):
    """Update a period - mock implementation"""
    if period_id == 1:
        return {
            "id": 1,
            "code": period_update.code,
            "name": period_update.name,
            "start_date": period_update.start_date,
            "end_date": period_update.end_date,
            "type": period_update.type,
            "status": period_update.status,
            "fiscal_year_id": 1
        }
    raise HTTPException(status_code=404, detail="Period not found")

@router.delete("/periods/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_period(period_id: int):
    """Delete a period - mock implementation"""
    if period_id != 1:
        raise HTTPException(status_code=404, detail="Period not found")
    return None

# Scenario Endpoints
@router.post("/years/{fiscal_year_id}/scenarios", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED)
async def create_scenario(fiscal_year_id: int, scenario: ScenarioCreate):
    """Create a new scenario - mock implementation"""
    return {
        "id": 1,
        "code": scenario.code,
        "name": scenario.name,
        "description": scenario.description,
        "type": scenario.type,
        "status": scenario.status,
        "fiscal_year_id": fiscal_year_id
    }

@router.get("/years/{fiscal_year_id}/scenarios", response_model=List[ScenarioResponse])
async def get_scenarios(fiscal_year_id: int):
    """Get all scenarios for a fiscal year - mock implementation"""
    if fiscal_year_id == 1:
        return [
            {
                "id": 1,
                "code": "ACTUAL",
                "name": "Actual",
                "description": "Actual financial data",
                "type": "actual",
                "status": "active",
                "fiscal_year_id": fiscal_year_id
            }
        ]
    raise HTTPException(status_code=404, detail="Fiscal year not found")

@router.get("/scenarios/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(scenario_id: int):
    """Get a scenario by ID - mock implementation"""
    if scenario_id == 1:
        return {
            "id": 1,
            "code": "ACTUAL",
            "name": "Actual",
            "description": "Actual financial data",
            "type": "actual",
            "status": "active",
            "fiscal_year_id": 1
        }
    raise HTTPException(status_code=404, detail="Scenario not found")

@router.put("/scenarios/{scenario_id}", response_model=ScenarioResponse)
async def update_scenario(scenario_id: int, scenario_update: ScenarioUpdate):
    """Update a scenario - mock implementation"""
    if scenario_id == 1:
        return {
            "id": 1,
            "code": scenario_update.code,
            "name": scenario_update.name,
            "description": scenario_update.description,
            "type": scenario_update.type,
            "status": scenario_update.status,
            "fiscal_year_id": 1
        }
    raise HTTPException(status_code=404, detail="Scenario not found")

@router.delete("/scenarios/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scenario(scenario_id: int):
    """Delete a scenario - mock implementation"""
    if scenario_id != 1:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return None

# Bulk Operations
@router.post("/years/{fiscal_year_id}/periods/bulk", response_model=List[PeriodResponse], status_code=status.HTTP_201_CREATED)
async def create_periods_bulk(fiscal_year_id: int, periods: List[PeriodCreate]):
    """Create multiple periods - mock implementation"""
    return [
        {
            "id": 1,
            "code": period.code,
            "name": period.name,
            "start_date": period.start_date,
            "end_date": period.end_date,
            "type": period.type,
            "status": period.status,
            "fiscal_year_id": fiscal_year_id
        } for period in periods
    ]

# Audit Log Endpoints
@router.get("/years/{fiscal_year_id}/audit", response_model=List[dict])
async def get_fiscal_year_audit_logs(fiscal_year_id: int):
    """Get audit logs for a fiscal year - mock implementation"""
    if fiscal_year_id == 1:
        return [
            {
                "id": 1,
                "action": "create",
                "user": "admin",
                "timestamp": "2024-01-01T00:00:00",
                "details": "Created fiscal year FY 2024",
                "scenario_id": None
            }
        ]
    raise HTTPException(status_code=404, detail="Fiscal year not found")

@router.get("/scenarios/{scenario_id}/audit", response_model=List[dict])
async def get_scenario_audit_logs(scenario_id: int):
    """Get audit logs for a scenario - mock implementation"""
    if scenario_id == 1:
        return [
            {
                "id": 1,
                "action": "create",
                "user": "admin",
                "timestamp": "2024-01-01T00:00:00",
                "details": "Created scenario Actual",
                "fiscal_year_id": 1
            }
        ]
    raise HTTPException(status_code=404, detail="Scenario not found")

# Health Check Endpoint
@router.get("/health")
async def fiscal_health():
    """Health check endpoint"""
    return {"status": "ok", "message": "Fiscal management API is running"}