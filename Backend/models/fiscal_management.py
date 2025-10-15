"""
Fiscal Year & Scenario Management Models
Comprehensive consolidation-ready models for fiscal year, period, and scenario management
"""

from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Boolean, JSON, UniqueConstraint, Date
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from company_database_base import CompanyBase

class FiscalYear(CompanyBase):
    """Fiscal Year/Accounting Year Management"""
    __tablename__ = "fiscal_years"
    
    id = Column(Integer, primary_key=True, index=True)
    year_code = Column(String(20), nullable=False, index=True)  # e.g., "FY2024", "2024"
    year_name = Column(String(255), nullable=False)  # e.g., "Fiscal Year 2024"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(50), default="draft")  # draft, active, locked, archived
    description = Column(Text, nullable=True)
    
    # Consolidation settings
    is_consolidation_year = Column(Boolean, default=True)
    consolidation_method = Column(String(50), default="full")  # full, proportional, equity
    
    # Metadata and settings
    settings = Column(JSONB, default='{}')  # JSON for flexible settings
    custom_fields = Column(JSONB, default='{}')  # User-defined custom fields
    
    # Audit fields
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    periods = relationship("Period", back_populates="fiscal_year", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="fiscal_year", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('year_code', name='uq_fiscal_year_code'),
    )

class Period(CompanyBase):
    """Fiscal Periods (Months, Quarters, Custom Periods)"""
    __tablename__ = "periods"
    
    id = Column(Integer, primary_key=True, index=True)
    fiscal_year_id = Column(Integer, ForeignKey("fiscal_years.id"), nullable=False)
    period_code = Column(String(20), nullable=False, index=True)  # e.g., "P1", "Jan2024", "Q1"
    period_name = Column(String(255), nullable=False)  # e.g., "January 2024", "Q1 2024"
    period_type = Column(String(50), default="month")  # month, quarter, year, custom
    
    # Date range
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Status and hierarchy
    status = Column(String(50), default="open")  # open, closed, locked
    is_rollup_period = Column(Boolean, default=False)  # True for quarters/years that aggregate sub-periods
    parent_period_id = Column(Integer, ForeignKey("periods.id"), nullable=True)
    sort_order = Column(Integer, default=0)
    
    # Consolidation settings
    consolidation_enabled = Column(Boolean, default=True)
    consolidation_cutoff_date = Column(DateTime, nullable=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    settings = Column(JSONB, default='{}')
    custom_fields = Column(JSONB, default='{}')
    
    # Audit fields
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    fiscal_year = relationship("FiscalYear", back_populates="periods")
    parent_period = relationship("Period", remote_side=[id], backref="child_periods")
    scenario_data = relationship("ScenarioData", back_populates="period")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('fiscal_year_id', 'period_code', name='uq_period_code_year'),
    )

class Scenario(CompanyBase):
    """Financial Scenarios (Budget, Forecast, Actual, What-If)"""
    __tablename__ = "scenarios"
    
    id = Column(Integer, primary_key=True, index=True)
    fiscal_year_id = Column(Integer, ForeignKey("fiscal_years.id"), nullable=False)
    scenario_code = Column(String(50), nullable=False, index=True)  # e.g., "BUDGET", "ACTUAL", "FC1"
    scenario_name = Column(String(255), nullable=False)  # e.g., "Annual Budget 2024"
    scenario_type = Column(String(50), nullable=False)  # actual, budget, forecast, what_if, stress, custom
    
    # Scenario hierarchy and versioning
    parent_scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=True)
    version_number = Column(String(20), default="1.0")
    revision_number = Column(Integer, default=1)
    
    # Status and lifecycle
    status = Column(String(50), default="draft")  # draft, active, final, archived
    is_baseline = Column(Boolean, default=False)  # True if this is the baseline for comparisons
    is_consolidated = Column(Boolean, default=False)  # True if this scenario includes consolidated data
    
    # Scenario settings and rules
    allow_overrides = Column(Boolean, default=True)  # Allow manual adjustments
    auto_calculate = Column(Boolean, default=True)  # Auto-calculate derived values
    data_seeding_rules = Column(JSONB, default='{}')  # Rules for seeding from other scenarios
    
    # Metadata and descriptions
    description = Column(Text, nullable=True)
    assumptions = Column(Text, nullable=True)  # Key assumptions for this scenario
    tags = Column(JSONB, default='[]')  # Array of tags/labels
    
    # Consolidation settings
    consolidation_method = Column(String(50), default="full")  # full, proportional, equity
    elimination_rules = Column(JSONB, default='{}')  # Inter-company elimination rules
    
    # Workflow and approval
    approval_status = Column(String(50), default="pending")  # pending, approved, rejected
    approved_by = Column(Integer, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    # Advanced settings
    settings = Column(JSONB, default='{}')  # Flexible settings storage
    custom_fields = Column(JSONB, default='{}')  # User-defined custom fields
    
    # Audit fields
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    fiscal_year = relationship("FiscalYear", back_populates="scenarios")
    parent_scenario = relationship("Scenario", remote_side=[id], backref="child_scenarios")
    scenario_data = relationship("ScenarioData", back_populates="scenario", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('fiscal_year_id', 'scenario_code', name='uq_scenario_code_year'),
    )

class ScenarioData(CompanyBase):
    """Actual data storage for scenario values"""
    __tablename__ = "scenario_data"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    period_id = Column(Integer, ForeignKey("periods.id"), nullable=False)
    entity_id = Column(Integer, nullable=True)  # Reference to entities table
    account_id = Column(Integer, nullable=True)  # Reference to accounts table
    
    # Value storage
    amount = Column(Numeric(18, 2), default=0.00)
    currency = Column(String(10), default="USD")
    
    # Additional dimensions for consolidation
    elimination_type = Column(String(50), nullable=True)  # intercompany, minority, etc.
    adjustment_type = Column(String(50), nullable=True)  # manual, automatic, calculated
    
    # Data lineage and audit
    source_system = Column(String(100), nullable=True)
    import_batch_id = Column(String(100), nullable=True)
    calculation_formula = Column(Text, nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    custom_dimensions = Column(JSONB, default='{}')  # Additional custom dimensions
    
    # Audit fields
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    scenario = relationship("Scenario", back_populates="scenario_data")
    period = relationship("Period", back_populates="scenario_data")
    
    # Constraints for data integrity
    __table_args__ = (
        UniqueConstraint('scenario_id', 'period_id', 'entity_id', 'account_id', name='uq_scenario_data'),
    )

class ScenarioComparison(CompanyBase):
    """Predefined scenario comparisons for reporting"""
    __tablename__ = "scenario_comparisons"
    
    id = Column(Integer, primary_key=True, index=True)
    comparison_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Scenarios being compared
    base_scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    compare_scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    
    # Comparison settings
    comparison_type = Column(String(50), default="variance")  # variance, percentage, ratio
    include_entities = Column(JSONB, default='[]')  # Array of entity IDs to include
    include_accounts = Column(JSONB, default='[]')  # Array of account IDs to include
    
    # Metadata
    is_active = Column(Boolean, default=True)
    settings = Column(JSONB, default='{}')
    
    # Audit fields
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    base_scenario = relationship("Scenario", foreign_keys=[base_scenario_id])
    compare_scenario = relationship("Scenario", foreign_keys=[compare_scenario_id])

class ConsolidationRule(CompanyBase):
    """Rules for consolidation processing"""
    __tablename__ = "consolidation_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(255), nullable=False)
    rule_type = Column(String(50), nullable=False)  # elimination, adjustment, calculation
    
    # Rule conditions
    applies_to_scenarios = Column(JSONB, default='[]')  # Array of scenario IDs
    applies_to_entities = Column(JSONB, default='[]')  # Array of entity IDs
    applies_to_accounts = Column(JSONB, default='[]')  # Array of account IDs
    
    # Rule definition
    rule_formula = Column(Text, nullable=True)  # SQL or formula expression
    rule_parameters = Column(JSONB, default='{}')  # Parameters for the rule
    
    # Execution settings
    execution_order = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    
    # Audit fields
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
