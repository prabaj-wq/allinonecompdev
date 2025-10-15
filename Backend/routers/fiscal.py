from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from enum import Enum
import json

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

# Pydantic models for request validation
class PeriodBase(BaseModel):
    code: str
    name: str
    start_date: datetime
    end_date: datetime
    type: PeriodType
    status: PeriodStatus = PeriodStatus.open
    is_rollup: bool = False
    parent_period_id: Optional[int] = None

    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class PeriodCreate(PeriodBase):
    pass

class PeriodUpdate(PeriodBase):
    code: Optional[str] = None
    name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    type: Optional[PeriodType] = None
    status: Optional[PeriodStatus] = None

class PeriodResponse(PeriodBase):
    id: int
    fiscal_year_id: int

    class Config:
        orm_mode = True

class ScenarioBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    type: ScenarioType
    parent_scenario_id: Optional[int] = None
    version: int = 1
    status: ScenarioStatus = ScenarioStatus.draft
    created_by: Optional[str] = None
    tags: Optional[str] = None
    custom_fields: Optional[dict] = None

class ScenarioCreate(ScenarioBase):
    pass

class ScenarioUpdate(ScenarioBase):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[ScenarioType] = None
    status: Optional[ScenarioStatus] = None
    tags: Optional[str] = None
    custom_fields: Optional[dict] = None

class ScenarioResponse(ScenarioBase):
    id: int
    fiscal_year_id: int
    created_date: Optional[datetime] = None
    last_modified: Optional[datetime] = None

    class Config:
        orm_mode = True

class FiscalYearBase(BaseModel):
    name: str
    code: str
    start_date: datetime
    end_date: datetime
    status: FiscalYearStatus = FiscalYearStatus.active
    metadata: Optional[dict] = None

    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class FiscalYearCreate(FiscalYearBase):
    pass

class FiscalYearUpdate(FiscalYearBase):
    name: Optional[str] = None
    code: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[FiscalYearStatus] = None
    metadata: Optional[dict] = None

class FiscalYearResponse(FiscalYearBase):
    id: int
    periods: List[PeriodResponse] = []
    scenarios: List[ScenarioResponse] = []

    class Config:
        orm_mode = True

class AuditLogCreate(BaseModel):
    fiscal_year_id: Optional[int] = None
    scenario_id: Optional[int] = None
    action: str
    user: str
    details: Optional[str] = None

# Fiscal Year Endpoints
@router.post("/years", response_model=FiscalYearResponse, status_code=status.HTTP_201_CREATED)
async def create_fiscal_year(fiscal_year: FiscalYearCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        # Convert metadata dict to JSON string if provided
        metadata_json = None
        if fiscal_year.metadata:
            metadata_json = json.dumps(fiscal_year.metadata)
            
        db_fiscal_year = FiscalYear(
            name=fiscal_year.name,
            code=fiscal_year.code,
            start_date=fiscal_year.start_date,
            end_date=fiscal_year.end_date,
            status=fiscal_year.status,
            metadata=metadata_json
        )
        db.add(db_fiscal_year)
        db.commit()
        db.refresh(db_fiscal_year)
        
        # Log the creation
        audit_log = AuditLog(
            fiscal_year_id=db_fiscal_year.id,
            action="create",
            user=current_user.username,
            timestamp=datetime.now(),
            details=f"Created fiscal year {db_fiscal_year.name}"
        )
        db.add(audit_log)
        db.commit()
        
        return db_fiscal_year
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fiscal year with this code already exists"
        )

@router.get("/years", response_model=List[FiscalYearResponse])
async def get_fiscal_years(status: Optional[FiscalYearStatus] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    query = db.query(FiscalYear)
    if status:
        query = query.filter(FiscalYear.status == status)
    return query.all()

@router.get("/years/{fiscal_year_id}", response_model=FiscalYearResponse)
async def get_fiscal_year(fiscal_year_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fiscal year with ID {fiscal_year_id} not found"
        )
    return fiscal_year

@router.put("/years/{fiscal_year_id}", response_model=FiscalYearResponse)
async def update_fiscal_year(fiscal_year_id: int, fiscal_year_update: FiscalYearUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not db_fiscal_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fiscal year with ID {fiscal_year_id} not found"
        )
    
    # Update fields if provided
    update_data = fiscal_year_update.dict(exclude_unset=True)
    
    # Handle metadata conversion
    if "metadata" in update_data and update_data["metadata"] is not None:
        update_data["metadata"] = json.dumps(update_data["metadata"])
    
    for key, value in update_data.items():
        setattr(db_fiscal_year, key, value)
    
    # Log the update
    audit_log = AuditLog(
        fiscal_year_id=db_fiscal_year.id,
        action="update",
        user=current_user.username,
        timestamp=datetime.now(),
        details=f"Updated fiscal year {db_fiscal_year.name}"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(db_fiscal_year)
    return db_fiscal_year

@router.delete("/years/{fiscal_year_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fiscal_year(fiscal_year_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not db_fiscal_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fiscal year with ID {fiscal_year_id} not found"
        )
    
    # Log the deletion before actually deleting
    audit_log = AuditLog(
        action="delete",
        user=current_user.username,
        timestamp=datetime.now(),
        details=f"Deleted fiscal year {db_fiscal_year.name} (ID: {fiscal_year_id})"
    )
    db.add(audit_log)
    
    # Delete the fiscal year (cascade will handle related periods and scenarios)
    db.delete(db_fiscal_year)
    db.commit()
    return None

# Period Endpoints
@router.post("/years/{fiscal_year_id}/periods", response_model=PeriodResponse, status_code=status.HTTP_201_CREATED)
async def create_period(fiscal_year_id: int, period: PeriodCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if fiscal year exists
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fiscal year with ID {fiscal_year_id} not found"
        )
    
    # Validate period dates are within fiscal year
    if period.start_date < fiscal_year.start_date or period.end_date > fiscal_year.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Period dates must be within fiscal year date range"
        )
    
    # Check for overlapping periods
    existing_periods = db.query(Period).filter(Period.fiscal_year_id == fiscal_year_id).all()
    for existing_period in existing_periods:
        if (period.start_date <= existing_period.end_date and period.end_date >= existing_period.start_date):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Period overlaps with existing period {existing_period.name}"
            )
    
    # Create new period
    db_period = Period(
        fiscal_year_id=fiscal_year_id,
        code=period.code,
        name=period.name,
        start_date=period.start_date,
        end_date=period.end_date,
        type=period.type,
        status=period.status,
        is_rollup=period.is_rollup,
        parent_period_id=period.parent_period_id
    )
    db.add(db_period)
    
    # Log the creation
    audit_log = AuditLog(
        fiscal_year_id=fiscal_year_id,
        action="create",
        user=current_user.username,
        timestamp=datetime.now(),
        details=f"Created period {period.name} for fiscal year {fiscal_year.name}"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(db_period)
    return db_period

@router.get("/years/{fiscal_year_id}/periods", response_model=List[PeriodResponse])
async def get_periods(fiscal_year_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if fiscal year exists
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fiscal year with ID {fiscal_year_id} not found"
        )
    
    periods = db.query(Period).filter(Period.fiscal_year_id == fiscal_year_id).all()
    return periods

@router.get("/periods/{period_id}", response_model=PeriodResponse)
async def get_period(period_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Period with ID {period_id} not found"
        )
    return period

@router.put("/periods/{period_id}", response_model=PeriodResponse)
async def update_period(period_id: int, period_update: PeriodUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_period = db.query(Period).filter(Period.id == period_id).first()
    if not db_period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Period with ID {period_id} not found"
        )
    
    # Get fiscal year to validate dates
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == db_period.fiscal_year_id).first()
    
    # Update fields if provided
    update_data = period_update.dict(exclude_unset=True)
    
    # Validate new dates if provided
    if "start_date" in update_data or "end_date" in update_data:
        new_start_date = update_data.get("start_date", db_period.start_date)
        new_end_date = update_data.get("end_date", db_period.end_date)
        
        # Check dates are within fiscal year
        if new_start_date < fiscal_year.start_date or new_end_date > fiscal_year.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Period dates must be within fiscal year date range"
            )
        
        # Check for overlapping periods
        existing_periods = db.query(Period).filter(
            Period.fiscal_year_id == db_period.fiscal_year_id,
            Period.id != period_id
        ).all()
        
        for existing_period in existing_periods:
            if (new_start_date <= existing_period.end_date and new_end_date >= existing_period.start_date):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Updated period would overlap with existing period {existing_period.name}"
                )
    
    for key, value in update_data.items():
        setattr(db_period, key, value)
    
    # Log the update
    audit_log = AuditLog(
        fiscal_year_id=db_period.fiscal_year_id,
        action="update",
        user=current_user.username,
        timestamp=datetime.now(),
        details=f"Updated period {db_period.name}"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(db_period)
    return db_period

@router.delete("/periods/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_period(period_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_period = db.query(Period).filter(Period.id == period_id).first()
    if not db_period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Period with ID {period_id} not found"
        )
    
    # Log the deletion
    audit_log = AuditLog(
        fiscal_year_id=db_period.fiscal_year_id,
        action="delete",
        user=current_user.username,
        timestamp=datetime.now(),
        details=f"Deleted period {db_period.name} (ID: {period_id})"
    )
    db.add(audit_log)
    
    db.delete(db_period)
    db.commit()
    return None

# Scenario Endpoints
@router.post("/years/{fiscal_year_id}/scenarios", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED)
async def create_scenario(fiscal_year_id: int, scenario: ScenarioCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if fiscal year exists
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fiscal year with ID {fiscal_year_id} not found"
        )
    
    # Convert custom_fields dict to JSON string if provided
    custom_fields_json = None
    if scenario.custom_fields:
        custom_fields_json = json.dumps(scenario.custom_fields)
    
    # Create new scenario
    db_scenario = Scenario(
        fiscal_year_id=fiscal_year_id,
        code=scenario.code,
        name=scenario.name,
        description=scenario.description,
        type=scenario.type,
        parent_scenario_id=scenario.parent_scenario_id,
        version=scenario.version,
        status=scenario.status,
        created_by=current_user.username,
        created_date=datetime.now(),
        last_modified=datetime.now(),
        tags=scenario.tags,
        custom_fields=custom_fields_json
    )
    db.add(db_scenario)
    
    # Log the creation
    audit_log = AuditLog(
        fiscal_year_id=fiscal_year_id,
        scenario_id=db_scenario.id,
        action="create",
        user=current_user.username,
        timestamp=datetime.now(),
        details=f"Created scenario {scenario.name} for fiscal year {fiscal_year.name}"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

@router.get("/years/{fiscal_year_id}/scenarios", response_model=List[ScenarioResponse])
async def get_scenarios(fiscal_year_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if fiscal year exists
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fiscal year with ID {fiscal_year_id} not found"
        )
    
    scenarios = db.query(Scenario).filter(Scenario.fiscal_year_id == fiscal_year_id).all()
    return scenarios

@router.get("/scenarios/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(scenario_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with ID {scenario_id} not found"
        )
    return scenario

@router.put("/scenarios/{scenario_id}", response_model=ScenarioResponse)
async def update_scenario(scenario_id: int, scenario_update: ScenarioUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not db_scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with ID {scenario_id} not found"
        )
    
    # Update fields if provided
    update_data = scenario_update.dict(exclude_unset=True)
    
    # Handle custom_fields conversion
    if "custom_fields" in update_data and update_data["custom_fields"] is not None:
        update_data["custom_fields"] = json.dumps(update_data["custom_fields"])
    
    for key, value in update_data.items():
        setattr(db_scenario, key, value)
    
    # Update last_modified timestamp
    db_scenario.last_modified = datetime.now()
    
    # Log the update
    audit_log = AuditLog(
        fiscal_year_id=db_scenario.fiscal_year_id,
        scenario_id=db_scenario.id,
        action="update",
        user=current_user.username,
        timestamp=datetime.now(),
        details=f"Updated scenario {db_scenario.name}"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

@router.delete("/scenarios/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scenario(scenario_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not db_scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with ID {scenario_id} not found"
        )
    
    # Log the deletion
    audit_log = AuditLog(
        fiscal_year_id=db_scenario.fiscal_year_id,
        action="delete",
        user=current_user.username,
        timestamp=datetime.now(),
        details=f"Deleted scenario {db_scenario.name} (ID: {scenario_id})"
    )
    db.add(audit_log)
    
    db.delete(db_scenario)
    db.commit()
    return None

# Bulk Operations
@router.post("/years/{fiscal_year_id}/periods/bulk", response_model=List[PeriodResponse], status_code=status.HTTP_201_CREATED)
async def create_periods_bulk(fiscal_year_id: int, periods: List[PeriodCreate], db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if fiscal year exists
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fiscal year with ID {fiscal_year_id} not found"
        )
    
    # Validate all periods
    existing_periods = db.query(Period).filter(Period.fiscal_year_id == fiscal_year_id).all()
    new_periods = []
    
    for period in periods:
        # Validate period dates are within fiscal year
        if period.start_date < fiscal_year.start_date or period.end_date > fiscal_year.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Period {period.name} dates must be within fiscal year date range"
            )
        
        # Check for overlapping with existing periods
        for existing_period in existing_periods:
            if (period.start_date <= existing_period.end_date and period.end_date >= existing_period.start_date):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Period {period.name} overlaps with existing period {existing_period.name}"
                )
        
        # Check for overlapping with new periods
        for new_period in new_periods:
            if (period.start_date <= new_period.end_date and period.end_date >= new_period.start_date):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Period {period.name} overlaps with another new period {new_period.name}"
                )
        
        # Create period object
        db_period = Period(
            fiscal_year_id=fiscal_year_id,
            code=period.code,
            name=period.name,
            start_date=period.start_date,
            end_date=period.end_date,
            type=period.type,
            status=period.status,
            is_rollup=period.is_rollup,
            parent_period_id=period.parent_period_id
        )
        new_periods.append(db_period)
        db.add(db_period)
    
    # Log the bulk creation
    audit_log = AuditLog(
        fiscal_year_id=fiscal_year_id,
        action="bulk_create",
        user=current_user.username,
        timestamp=datetime.now(),
        details=f"Bulk created {len(periods)} periods for fiscal year {fiscal_year.name}"
    )
    db.add(audit_log)
    
    db.commit()
    
    # Refresh all periods
    for period in new_periods:
        db.refresh(period)
    
    return new_periods

# Audit Log Endpoints
@router.get("/years/{fiscal_year_id}/audit", response_model=List[dict])
async def get_fiscal_year_audit_logs(fiscal_year_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if fiscal year exists
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.id == fiscal_year_id).first()
    if not fiscal_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fiscal year with ID {fiscal_year_id} not found"
        )
    
    audit_logs = db.query(AuditLog).filter(AuditLog.fiscal_year_id == fiscal_year_id).order_by(AuditLog.timestamp.desc()).all()
    
    # Convert to dict for response
    result = []
    for log in audit_logs:
        result.append({
            "id": log.id,
            "action": log.action,
            "user": log.user,
            "timestamp": log.timestamp,
            "details": log.details,
            "scenario_id": log.scenario_id
        })
    
    return result

@router.get("/scenarios/{scenario_id}/audit", response_model=List[dict])
async def get_scenario_audit_logs(scenario_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Check if scenario exists
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with ID {scenario_id} not found"
        )
    
    audit_logs = db.query(AuditLog).filter(AuditLog.scenario_id == scenario_id).order_by(AuditLog.timestamp.desc()).all()
    
    # Convert to dict for response
    result = []
    for log in audit_logs:
        result.append({
            "id": log.id,
            "action": log.action,
            "user": log.user,
            "timestamp": log.timestamp,
            "details": log.details,
            "fiscal_year_id": log.fiscal_year_id
        })
    
    return result