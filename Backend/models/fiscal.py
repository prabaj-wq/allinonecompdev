from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, Enum, DateTime, Text
from sqlalchemy.orm import relationship
from .base import Base
import enum

class FiscalYearStatus(enum.Enum):
    active = "Active"
    locked = "Locked"
    archived = "Archived"

class PeriodType(enum.Enum):
    month = "Month"
    quarter = "Quarter"
    custom = "Custom"

class PeriodStatus(enum.Enum):
    open = "Open"
    closed = "Closed"
    locked = "Locked"

class ScenarioType(enum.Enum):
    base = "Base"
    budget = "Budget"
    forecast = "Forecast"
    whatif = "What-If"
    stress = "Stress"
    custom = "Custom"

class ScenarioStatus(enum.Enum):
    draft = "Draft"
    active = "Active"
    final = "Final"
    archived = "Archived"
    locked = "Locked"

class FiscalYear(Base):
    __tablename__ = "fiscal_years"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(FiscalYearStatus), default=FiscalYearStatus.active)
    metadata = Column(Text)
    periods = relationship("Period", back_populates="fiscal_year", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="fiscal_year", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="fiscal_year")

class Period(Base):
    __tablename__ = "periods"
    id = Column(Integer, primary_key=True)
    fiscal_year_id = Column(Integer, ForeignKey("fiscal_years.id"))
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    type = Column(Enum(PeriodType), nullable=False)
    status = Column(Enum(PeriodStatus), default=PeriodStatus.open)
    is_rollup = Column(Boolean, default=False)
    parent_period_id = Column(Integer, ForeignKey("periods.id"), nullable=True)
    fiscal_year = relationship("FiscalYear", back_populates="periods")
    parent_period = relationship("Period", remote_side=[id])

class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(Integer, primary_key=True)
    fiscal_year_id = Column(Integer, ForeignKey("fiscal_years.id"))
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    type = Column(Enum(ScenarioType), nullable=False)
    parent_scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=True)
    version = Column(Integer, default=1)
    status = Column(Enum(ScenarioStatus), default=ScenarioStatus.draft)
    created_by = Column(String)
    created_date = Column(DateTime)
    last_modified = Column(DateTime)
    tags = Column(String)
    custom_fields = Column(Text)
    fiscal_year = relationship("FiscalYear", back_populates="scenarios")
    parent_scenario = relationship("Scenario", remote_side=[id])
    audit_logs = relationship("AuditLog", back_populates="scenario")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    fiscal_year_id = Column(Integer, ForeignKey("fiscal_years.id"), nullable=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=True)
    action = Column(String)
    user = Column(String)
    timestamp = Column(DateTime)
    details = Column(Text)
    fiscal_year = relationship("FiscalYear", back_populates="audit_logs")
    scenario = relationship("Scenario", back_populates="audit_logs")