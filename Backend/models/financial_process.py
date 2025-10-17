"""
Enhanced Financial Process Models
Comprehensive models for all financial consolidation and process management features
"""

from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text, 
    JSON, DECIMAL, Date, Enum, UniqueConstraint, Index, func
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
import enum

from database import Base

# ============================================================================
# ENUMS
# ============================================================================

class ProcessType(str, enum.Enum):
    PROFIT_LOSS = "profit_loss"
    NCI_HANDLING = "nci_handling"
    RETAINED_EARNINGS = "retained_earnings_rollforward"
    FX_TRANSLATION = "fx_translation"
    IC_ELIMINATIONS = "intercompany_eliminations"
    GOODWILL_FAIR_VALUE = "goodwill_fair_value_adjustments"
    DEFERRED_TAXES = "deferred_taxes"
    OPENING_BALANCES = "opening_balance_adjustments"
    MINORITY_ACCOUNTING = "minority_associate_jv_accounting"
    PRIOR_PERIOD_ERRORS = "prior_period_errors_changes"
    STATEMENT_EQUITY = "statement_changes_equity"
    OCI_ITEMS = "oci_items"
    EPS_CALCULATION = "weighted_average_eps"
    VALUATION_IMPAIRMENT = "valuation_impairment"
    WHAT_IF_SIMULATION = "what_if_simulation"
    SCENARIO_VERSION_CONTROL = "scenario_version_control"
    ALERTS_EXCEPTIONS = "alerts_exceptions"
    ENTITY_STRUCTURE = "entity_structure_ownership"
    CONSOLIDATION_RULES = "consolidation_rules"
    ACQUISITION_ACCOUNTING = "acquisition_accounting"
    UNREALIZED_PROFIT = "unrealized_profit_elimination"
    FAIR_VALUE_DEPRECIATION = "fair_value_depreciation"
    INVESTMENT_ASSOCIATES = "investment_associates_equity_method"
    REVALUATION_SURPLUS = "revaluation_surplus"
    DISPOSAL_OWNERSHIP = "disposal_ownership_changes"

class ProcessStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    SIMULATION = "simulation"
    READY_FOR_APPROVAL = "ready_for_approval"
    APPROVED = "approved"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class NodeType(str, enum.Enum):
    DATA_INPUT = "data_input"
    JOURNAL_ENTRY = "journal_entry"
    ROLLFORWARD = "rollforward"
    FX_TRANSLATION = "fx_translation"
    INTERCOMPANY_ELIMINATION = "intercompany_elimination"
    NCI_ALLOCATION = "nci_allocation"
    DEFERRED_TAX = "deferred_tax"
    GOODWILL_IMPAIRMENT = "goodwill_impairment"
    PROFIT_LOSS = "profit_loss"
    RETAINED_EARNINGS = "retained_earnings"
    OPENING_BALANCE = "opening_balance"
    EPS_CALCULATION = "eps_calculation"
    CONSOLIDATION_OUTPUT = "consolidation_output"
    CUSTOM_CALCULATION = "custom_calculation"
    VALIDATION = "validation"
    REPORT_GENERATION = "report_generation"
    OCI_ITEM = "oci_item"
    SCENARIO_COMPARISON = "scenario_comparison"
    WHAT_IF_ANALYSIS = "what_if_analysis"
    FAIR_VALUE_ADJUSTMENT = "fair_value_adjustment"
    UNREALIZED_PROFIT_ELIM = "unrealized_profit_elimination"
    ACQUISITION_ACCOUNTING = "acquisition_accounting"
    ASSOCIATE_EQUITY_METHOD = "associate_equity_method"
    REVALUATION_ADJUSTMENT = "revaluation_adjustment"

class ConsolidationMethod(str, enum.Enum):
    FULL_CONSOLIDATION = "full_consolidation"
    PROPORTIONATE_CONSOLIDATION = "proportionate_consolidation"
    EQUITY_METHOD = "equity_method"
    COST_METHOD = "cost_method"

class NCIMethod(str, enum.Enum):
    FAIR_VALUE = "fair_value"
    PROPORTIONATE_SHARE = "proportionate_share"

class FXTranslationMethod(str, enum.Enum):
    CURRENT_RATE = "current_rate"
    TEMPORAL = "temporal"
    MONETARY_NONMONETARY = "monetary_nonmonetary"

# ============================================================================
# MAIN MODELS
# ============================================================================

class FinancialProcess(Base):
    """Main Financial Process Definition"""
    __tablename__ = "financial_processes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    process_type = Column(String(50), default=ProcessType.PROFIT_LOSS)
    status = Column(String(50), default=ProcessStatus.DRAFT)
    
    # Process Configuration
    fiscal_year = Column(Integer)
    base_scenario_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    reporting_currency = Column(String(3), default='USD')
    
    # Canvas Configuration
    canvas_config = Column(JSONB, default={})  # Canvas layout, zoom, etc.
    
    # Process Settings
    settings = Column(JSONB, default={})  # Rounding, validation rules, etc.
    
    # Metadata
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_financial_process_company', 'company_id'),
        Index('idx_financial_process_status', 'status'),
    )

class ProcessNode(Base):
    """Process Canvas Nodes"""
    __tablename__ = "process_nodes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'), nullable=False, index=True)
    node_type = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Canvas Position
    x = Column(Float, default=0)
    y = Column(Float, default=0)
    width = Column(Float, default=200)
    height = Column(Float, default=100)
    
    # Node Configuration
    configuration = Column(JSONB, default={})
    custom_logic = Column(Text)
    validation_rules = Column(JSONB, default=[])
    
    # Execution
    sequence = Column(Integer)
    is_active = Column(Boolean, default=True)
    is_locked = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_process_nodes', 'process_id', 'sequence'),
    )

class ProcessConnection(Base):
    """Connections between Process Nodes"""
    __tablename__ = "process_connections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'), nullable=False)
    from_node_id = Column(UUID(as_uuid=True), ForeignKey('process_nodes.id'), nullable=False)
    to_node_id = Column(UUID(as_uuid=True), ForeignKey('process_nodes.id'), nullable=False)
    
    # Connection Configuration
    connection_type = Column(String(50), default='sequential')
    data_mapping = Column(JSONB, default={})
    conditional_logic = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_process_connections', 'process_id'),
    )

class ProcessScenario(Base):
    """Process Scenarios for What-If Analysis"""
    __tablename__ = "process_scenarios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    scenario_type = Column(String(50))  # actual, forecast, budget, simulation
    
    # Versioning
    parent_scenario_id = Column(UUID(as_uuid=True), index=True)
    version_number = Column(Integer, default=1)
    is_base = Column(Boolean, default=False)
    
    # Parameter Overrides
    fx_rate_overrides = Column(JSONB, default={})
    tax_rate_overrides = Column(JSONB, default={})
    profit_share_overrides = Column(JSONB, default={})
    custom_parameters = Column(JSONB, default={})
    
    status = Column(String(50), default=ProcessStatus.DRAFT)
    
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProcessPeriod(Base):
    """Process Periods"""
    __tablename__ = "process_periods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'), nullable=False, index=True)
    
    period_name = Column(String(50))  # Jan, Feb, Q1, etc.
    period_number = Column(Integer)
    period_start_date = Column(Date)
    period_end_date = Column(Date)
    fiscal_year = Column(Integer)
    
    is_active = Column(Boolean, default=True)
    is_closed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class EntityStructure(Base):
    """Entity Ownership and Structure"""
    __tablename__ = "entity_structures"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'))
    
    entity_code = Column(String(50), nullable=False)
    entity_name = Column(String(255), nullable=False)
    parent_entity_code = Column(String(50))
    
    # Ownership Details
    ownership_percentage = Column(DECIMAL(5, 2))  # 0.00 to 100.00
    control_percentage = Column(DECIMAL(5, 2))
    consolidation_method = Column(String(50), default=ConsolidationMethod.FULL_CONSOLIDATION)
    
    # Acquisition Details
    acquisition_date = Column(Date)
    acquisition_price = Column(DECIMAL(20, 2))
    fair_value_net_assets = Column(DECIMAL(20, 2))
    goodwill_amount = Column(DECIMAL(20, 2))
    
    # NCI Configuration
    nci_method = Column(String(50), default=NCIMethod.PROPORTIONATE_SHARE)
    nci_percentage = Column(DECIMAL(5, 2))
    
    # Currency
    functional_currency = Column(String(3))
    reporting_currency = Column(String(3))
    fx_translation_method = Column(String(50), default=FXTranslationMethod.CURRENT_RATE)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_entity_structure', 'company_id', 'entity_code'),
    )

class ConsolidationRule(Base):
    """Consolidation Rules and Eliminations"""
    __tablename__ = "consolidation_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'))
    
    rule_name = Column(String(255), nullable=False)
    rule_type = Column(String(50))  # intercompany, fx_translation, nci, etc.
    description = Column(Text)
    
    # Rule Configuration
    source_entities = Column(JSONB, default=[])  # List of entity codes
    target_entities = Column(JSONB, default=[])
    account_filters = Column(JSONB, default={})  # Account code patterns
    
    # Elimination Logic
    elimination_method = Column(String(50))  # full, proportionate, custom
    custom_logic = Column(Text)  # Python/SQL logic
    
    # Conditions
    conditions = Column(JSONB, default={})
    priority = Column(Integer, default=100)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProcessData(Base):
    """Process Financial Data"""
    __tablename__ = "process_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'), nullable=False)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey('process_scenarios.id'), nullable=False)
    period_id = Column(UUID(as_uuid=True), ForeignKey('process_periods.id'))
    
    # Financial Data
    entity_code = Column(String(50), nullable=False)
    account_code = Column(String(50), nullable=False)
    account_name = Column(String(255))
    
    # Amounts
    local_amount = Column(DECIMAL(20, 2))  # In functional currency
    reporting_amount = Column(DECIMAL(20, 2))  # In reporting currency
    currency = Column(String(3))
    fx_rate = Column(DECIMAL(10, 6))
    
    # Classification
    data_type = Column(String(50))  # actual, budget, forecast
    entry_type = Column(String(10))  # debit, credit
    
    # Consolidation Flags
    is_intercompany = Column(Boolean, default=False)
    is_eliminated = Column(Boolean, default=False)
    elimination_reference = Column(String(255))
    
    # Metadata
    source_reference = Column(String(255))
    imported_at = Column(DateTime, default=datetime.utcnow)
    imported_by = Column(UUID(as_uuid=True))
    
    __table_args__ = (
        Index('idx_process_data', 'process_id', 'scenario_id', 'period_id'),
        Index('idx_entity_account', 'entity_code', 'account_code'),
    )

class ProcessExecution(Base):
    """Process Execution History"""
    __tablename__ = "process_executions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'), nullable=False)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey('process_scenarios.id'), nullable=False)
    
    execution_type = Column(String(50))  # simulate, finalize
    status = Column(String(50), default="in_progress")
    
    # Execution Details
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    execution_time_ms = Column(Integer)
    
    # Results
    results = Column(JSONB, default={})
    warnings = Column(JSONB, default=[])
    errors = Column(JSONB, default=[])
    alerts = Column(JSONB, default=[])
    
    # Approval
    is_approved = Column(Boolean, default=False)
    approved_by = Column(UUID(as_uuid=True))
    approved_at = Column(DateTime)
    
    executed_by = Column(UUID(as_uuid=True))
    
    __table_args__ = (
        Index('idx_execution', 'process_id', 'scenario_id'),
    )

class ProcessJournal(Base):
    """Generated Journal Entries"""
    __tablename__ = "process_journals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'), nullable=False)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey('process_scenarios.id'), nullable=False)
    execution_id = Column(UUID(as_uuid=True), ForeignKey('process_executions.id'))
    period_id = Column(UUID(as_uuid=True), ForeignKey('process_periods.id'))
    
    # Journal Details
    journal_number = Column(String(50))
    journal_date = Column(Date)
    journal_description = Column(String(500))
    source_node_id = Column(UUID(as_uuid=True), ForeignKey('process_nodes.id'))
    
    # Line Items
    entity_code = Column(String(50))
    account_code = Column(String(50))
    account_name = Column(String(255))
    debit_amount = Column(DECIMAL(20, 2), default=0)
    credit_amount = Column(DECIMAL(20, 2), default=0)
    currency = Column(String(3))
    
    # References
    reference = Column(String(255))
    counterparty = Column(String(255))
    
    # Status
    is_posted = Column(Boolean, default=False)
    posted_at = Column(DateTime)
    
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, default=datetime.utcnow)

class FXRate(Base):
    """Foreign Exchange Rates"""
    __tablename__ = "fx_rates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'))
    
    from_currency = Column(String(3), nullable=False)
    to_currency = Column(String(3), nullable=False)
    rate_date = Column(Date, nullable=False)
    rate_type = Column(String(50))  # spot, average, closing
    
    rate = Column(DECIMAL(10, 6), nullable=False)
    
    # Metadata
    source = Column(String(100))  # manual, bloomberg, reuters, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_fx_rates', 'from_currency', 'to_currency', 'rate_date'),
        UniqueConstraint('company_id', 'from_currency', 'to_currency', 'rate_date', 'rate_type'),
    )

class ValidationRule(Base):
    """Process Validation Rules"""
    __tablename__ = "validation_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'))
    
    rule_name = Column(String(255), nullable=False)
    rule_description = Column(Text)
    rule_type = Column(String(50))  # balance_sheet, intercompany, completeness
    
    # Rule Logic
    rule_expression = Column(Text)  # SQL/Python expression
    threshold_value = Column(DECIMAL(20, 2))
    threshold_percentage = Column(DECIMAL(5, 2))
    
    # Severity and Actions
    severity = Column(String(50))  # error, warning, info
    can_auto_fix = Column(Boolean, default=False)
    auto_fix_logic = Column(Text)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProcessAlert(Base):
    """Process Alerts and Exceptions"""
    __tablename__ = "process_alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'), nullable=False)
    execution_id = Column(UUID(as_uuid=True), ForeignKey('process_executions.id'))
    
    alert_type = Column(String(50))  # validation, threshold, exception
    severity = Column(String(50))  # critical, warning, info
    title = Column(String(255))
    message = Column(Text)
    
    # Context
    entity_code = Column(String(50))
    account_code = Column(String(50))
    amount = Column(DECIMAL(20, 2))
    
    # Resolution
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(UUID(as_uuid=True))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class ProcessAuditTrail(Base):
    """Process Audit Trail"""
    __tablename__ = "process_audit_trail"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('financial_processes.id'), nullable=False)
    
    # What changed
    action_type = Column(String(50))  # create, update, delete, execute
    entity_type = Column(String(50))  # process, node, scenario, execution
    entity_id = Column(UUID(as_uuid=True))
    
    # Who changed it
    user_id = Column(UUID(as_uuid=True))
    
    # Change details
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    change_details = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_audit_process', 'process_id'),
    )
