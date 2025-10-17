from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text, 
    JSON, DECIMAL, Date, Enum, UniqueConstraint, Index, func
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
import enum

# Import Base from database module to ensure all models use the same declarative base
from database import Base


class ProcessType(str, enum.Enum):
    CONSOLIDATION = "consolidation"
    ROLLFORWARD = "rollforward"
    SIMULATION = "simulation"
    ADJUSTMENT = "adjustment"
    ELIMINATION = "elimination"


class ProcessStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    SIMULATED = "simulated"
    APPROVED = "approved"
    FINALIZED = "finalized"
    ARCHIVED = "archived"


class NodeType(str, enum.Enum):
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
    DATA_IMPORT = "data_import"
    VALIDATION = "validation"
    REPORT_GENERATION = "report_generation"
    OCI_ITEM = "oci_item"
    SCENARIO_COMPARISON = "scenario_comparison"


class ConnectionType(str, enum.Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    CONDITIONAL = "conditional"
    LOOP = "loop"


# Main Process Definition
class ProcessDefinition(Base):
    __tablename__ = "process_definitions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    process_type = Column(String(50), default=ProcessType.CONSOLIDATION)
    status = Column(String(50), default=ProcessStatus.DRAFT)
    fiscal_year = Column(Integer)
    base_scenario_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Settings stored as JSONB
    settings = Column(JSONB, default={})  # fiscal_calendar, rounding_rules, permissions
    
    # Metadata
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_company_fiscal', 'company_id', 'fiscal_year'),
        Index('idx_process_status', 'status'),
    )


# Canvas Nodes
class ProcessNode(Base):
    __tablename__ = "process_nodes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID(as_uuid=True), ForeignKey('process_definitions.id'), nullable=False, index=True)
    node_type = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    sequence = Column(Integer)
    
    # Canvas position
    x = Column(Float, default=0)
    y = Column(Float, default=0)
    
    # Node configuration with extensive customization
    configuration = Column(JSONB, default={})  # All node settings
    custom_logic = Column(Text)  # Custom calculation/validation logic
    custom_fields = Column(JSONB, default={})  # User-defined fields
    
    # Execution state
    is_active = Column(Boolean, default=True)
    is_locked = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_process_nodes', 'process_id', 'sequence'),
    )


# Node Connections
class ProcessNodeConnection(Base):
    __tablename__ = "process_node_connections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID(as_uuid=True), ForeignKey('process_definitions.id'), nullable=False)
    from_node_id = Column(UUID(as_uuid=True), ForeignKey('process_nodes.id'), nullable=False)
    to_node_id = Column(UUID(as_uuid=True), ForeignKey('process_nodes.id'), nullable=False)
    
    connection_type = Column(String(50), default=ConnectionType.SEQUENTIAL)
    
    # Data mapping and conditional logic
    data_mapping = Column(JSONB, default={})  # Map output fields to input fields
    conditional_logic = Column(Text)  # Python expression for conditional execution
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_connections', 'process_id', 'from_node_id', 'to_node_id'),
    )


# Process Periods (Jan, Feb, etc.)
class ProcessPeriod(Base):
    __tablename__ = "process_periods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID(as_uuid=True), ForeignKey('process_definitions.id'), nullable=False, index=True)
    period_name = Column(String(50))
    period_number = Column(Integer)
    period_start_date = Column(Date)
    period_end_date = Column(Date)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


# Process Data (Raw Financial Data)
class ProcessData(Base):
    __tablename__ = "process_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('process_definitions.id'), nullable=False)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey('process_scenarios.id'), nullable=False, index=True)
    period_id = Column(UUID(as_uuid=True), ForeignKey('process_periods.id'))
    
    # Financial data
    entity_id = Column(String(50))  # Company A, B, etc.
    account_code = Column(String(50))
    account_name = Column(String(255))
    amount = Column(DECIMAL(20, 2))
    currency = Column(String(3))
    
    # Data classification
    data_type = Column(String(50))  # actual, forecast, budget
    is_consolidated = Column(Boolean, default=False)
    
    # Audit
    imported_at = Column(DateTime, default=datetime.utcnow)
    imported_by = Column(UUID(as_uuid=True))
    
    __table_args__ = (
        Index('idx_process_data', 'process_id', 'scenario_id', 'period_id'),
        Index('idx_entity_account', 'entity_id', 'account_code'),
    )


# Process Staging (Temporary Results During Simulation)
class ProcessStaging(Base):
    __tablename__ = "process_staging"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    execution_id = Column(UUID(as_uuid=True), ForeignKey('process_executions.id'), nullable=False, index=True)
    node_id = Column(UUID(as_uuid=True), ForeignKey('process_nodes.id'), nullable=False)
    period_id = Column(UUID(as_uuid=True), ForeignKey('process_periods.id'))
    
    # Staging data
    entity_id = Column(String(50))
    account_code = Column(String(50))
    amount = Column(DECIMAL(20, 2))
    currency = Column(String(3))
    
    # Metadata
    node_output_index = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_staging_execution', 'execution_id', 'node_id'),
    )


# Process Journals (Final Journal Entries)
class ProcessJournal(Base):
    __tablename__ = "process_journals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('process_definitions.id'), nullable=False)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey('process_scenarios.id'), nullable=False)
    execution_id = Column(UUID(as_uuid=True), ForeignKey('process_executions.id'))
    period_id = Column(UUID(as_uuid=True), ForeignKey('process_periods.id'))
    
    # Journal details
    journal_date = Column(Date)
    journal_description = Column(String(500))
    source_node_id = Column(UUID(as_uuid=True), ForeignKey('process_nodes.id'))
    
    # Line items
    entity_id = Column(String(50))
    account_code = Column(String(50))
    account_name = Column(String(255))
    debit_amount = Column(DECIMAL(20, 2), default=0)
    credit_amount = Column(DECIMAL(20, 2), default=0)
    currency = Column(String(3))
    
    # Status
    is_posted = Column(Boolean, default=False)
    posted_at = Column(DateTime)
    
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_journal_process', 'process_id', 'scenario_id'),
        Index('idx_journal_period', 'period_id'),
    )


# Process Scenarios
class ProcessScenario(Base):
    __tablename__ = "process_scenarios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('process_definitions.id'), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    scenario_type = Column(String(50))  # actual, forecast, budget, simulation
    
    # Versioning
    parent_scenario_id = Column(UUID(as_uuid=True), index=True)  # For branching
    version_number = Column(Integer, default=1)
    is_base = Column(Boolean, default=False)
    
    # Parameter overrides for what-if
    fx_rate_overrides = Column(JSONB, default={})  # Currency: rate
    tax_rate_overrides = Column(JSONB, default={})
    profit_share_overrides = Column(JSONB, default={})
    custom_parameters = Column(JSONB, default={})
    
    status = Column(String(50), default=ProcessStatus.DRAFT)
    
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_scenario_process', 'process_id'),
        Index('idx_scenario_parent', 'parent_scenario_id'),
    )


# Process Executions (Run History)
class ProcessExecution(Base):
    __tablename__ = "process_executions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('process_definitions.id'), nullable=False)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey('process_scenarios.id'), nullable=False)
    
    execution_type = Column(String(50))  # simulate, finalize
    status = Column(String(50), default="in_progress")  # in_progress, success, error, warnings
    
    # Execution details
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    execution_time_ms = Column(Integer)  # Duration in milliseconds
    
    # Results
    results = Column(JSONB, default={})  # Consolidated figures
    warnings = Column(JSONB, default=[])  # List of warnings
    errors = Column(JSONB, default=[])  # List of errors
    alerts = Column(JSONB, default=[])  # Threshold alerts
    
    # Approval
    is_approved = Column(Boolean, default=False)
    approved_by = Column(UUID(as_uuid=True))
    approved_at = Column(DateTime)
    
    executed_by = Column(UUID(as_uuid=True))
    
    __table_args__ = (
        Index('idx_execution', 'process_id', 'scenario_id'),
        Index('idx_execution_status', 'status'),
    )


# Entity Structure & Ownership
class EntityStructure(Base):
    __tablename__ = "entity_structure"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('process_definitions.id'))
    
    parent_entity_id = Column(String(50))
    child_entity_id = Column(String(50))
    
    # Ownership
    ownership_percentage = Column(Float)  # 100, 75, 50, etc.
    consolidation_method = Column(String(50))  # full, equity, cost
    
    # Acquisition details
    acquisition_date = Column(Date)
    acquisition_price = Column(DECIMAL(20, 2))
    fair_value = Column(DECIMAL(20, 2))
    goodwill = Column(DECIMAL(20, 2))
    
    # NCI Calculation
    nci_method = Column(String(50))  # proportionate_share, fair_value
    nci_percentage = Column(Float)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_entity_structure', 'parent_entity_id', 'child_entity_id'),
    )


# Process Execution History (Audit Trail)
class ProcessAuditTrail(Base):
    __tablename__ = "process_audit_trail"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('process_definitions.id'), nullable=False)
    
    # What changed
    action_type = Column(String(50))  # create, update, delete, execute, approve
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
        Index('idx_audit_entity', 'entity_type', 'entity_id'),
    )


# Validation Rules
class ValidationRule(Base):
    __tablename__ = "validation_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    process_id = Column(UUID(as_uuid=True), ForeignKey('process_definitions.id'))
    
    rule_name = Column(String(255))
    rule_description = Column(Text)
    rule_type = Column(String(50))  # balance_sheet, intercompany, completeness, custom
    rule_expression = Column(Text)  # Python/SQL expression
    
    # Severity
    severity = Column(String(50))  # error, warning, info
    
    # Auto-fix
    can_auto_fix = Column(Boolean, default=False)
    auto_fix_logic = Column(Text)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# Process Override Rules (User Customizations)
class ProcessOverride(Base):
    __tablename__ = "process_overrides"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    execution_id = Column(UUID(as_uuid=True), ForeignKey('process_executions.id'), nullable=False)
    node_id = Column(UUID(as_uuid=True), ForeignKey('process_nodes.id'))
    
    # Override details
    override_type = Column(String(50))  # value, calculation, exclusion
    field_name = Column(String(255))
    override_value = Column(JSONB)
    reason = Column(Text)
    
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_override_execution', 'execution_id'),
    )


# Custom Logic Templates
class CustomLogicTemplate(Base):
    __tablename__ = "custom_logic_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    template_name = Column(String(255))
    template_description = Column(Text)
    logic_code = Column(Text)  # Python code
    node_type = Column(String(50))
    
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(DateTime, default=datetime.utcnow)