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

class PeriodCreate(BaseModel):
    code: str
    name: str
    start_date: datetime
    end_date: datetime
    type: PeriodType
    status: PeriodStatus = PeriodStatus.open

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

# Mock endpoints to prevent import errors
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

@router.get("/periods", response_model=List[PeriodResponse])
async def get_periods():
    """Get all periods - mock implementation"""
    return [
        {
            "id": 1,
            "code": "Q1-24",
            "name": "Q1 2024",
            "start_date": "2024-01-01T00:00:00",
            "end_date": "2024-03-31T23:59:59",
            "type": "quarterly",
            "status": "open"
        }
    ]

@router.get("/scenarios", response_model=List[ScenarioResponse])
async def get_scenarios():
    """Get all scenarios - mock implementation"""
    return [
        {
            "id": 1,
            "code": "ACTUAL",
            "name": "Actual",
            "description": "Actual financial data",
            "type": "actual",
            "status": "active"
        }
    ]

@router.get("/health")
async def fiscal_health():
    """Health check endpoint"""
    return {"status": "ok", "message": "Fiscal management API is running"}
