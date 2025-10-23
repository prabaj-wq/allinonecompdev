from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class JournalBatch(Base):
    """Journal Entry Batch - Groups related journal entries together"""
    __tablename__ = 'journal_batches'
    
    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text)
    
    # Process context
    process_id = Column(Integer, ForeignKey('processes.id'), nullable=True)
    entity_id = Column(String(50), nullable=True)  # From axes_entity
    scenario_id = Column(Integer, nullable=True)
    fiscal_year = Column(String(50), nullable=True)
    period = Column(String(50), nullable=True)
    
    # Batch metadata
    category = Column(String(100), nullable=False)  # Accruals, Inter-company, etc.
    journal_type = Column(String(50), default='manual')  # manual, adjustment, correction, accrual, recurring
    
    # Workflow and status
    status = Column(String(50), default='draft')  # draft, submitted, approved, posted, reversed
    workflow_status = Column(String(50), default='pending')
    
    # Audit fields
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    modified_by = Column(String(100))
    modified_at = Column(DateTime, onupdate=datetime.utcnow)
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    posted_by = Column(String(100))
    posted_at = Column(DateTime)
    reversed_by = Column(String(100))
    reversed_at = Column(DateTime)
    
    # Batch settings
    auto_reverse = Column(Boolean, default=False)
    auto_reverse_date = Column(DateTime)
    recurring_template_id = Column(Integer, ForeignKey('journal_templates.id'), nullable=True)
    
    # Validation
    total_debits = Column(Numeric(15, 2), default=0)
    total_credits = Column(Numeric(15, 2), default=0)
    is_balanced = Column(Boolean, default=False)
    
    # Relationships
    journal_lines = relationship("JournalLine", back_populates="batch", cascade="all, delete-orphan")
    template = relationship("JournalTemplate", back_populates="batches")

class JournalLine(Base):
    """Individual Journal Entry Line"""
    __tablename__ = 'journal_lines'
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey('journal_batches.id'), nullable=False)
    line_number = Column(Integer, nullable=False)  # Order within batch
    
    # Transaction details
    transaction_date = Column(DateTime, nullable=False)
    period = Column(String(50), nullable=False)
    
    # Entity and accounts
    entity_code = Column(String(50), nullable=False)  # From axes_entity
    entity_name = Column(String(200))
    account_debit_code = Column(String(50))  # From axes_account
    account_debit_name = Column(String(200))
    account_credit_code = Column(String(50))  # From axes_account
    account_credit_name = Column(String(200))
    
    # Amounts and currency
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), default='INR')
    exchange_rate = Column(Numeric(10, 6), default=1.0)
    base_currency_amount = Column(Numeric(15, 2))
    
    # Description and reference
    description = Column(Text, nullable=False)
    reference_number = Column(String(100))
    memo = Column(Text)
    
    # Inter-company
    from_entity = Column(String(50))  # For IC transactions
    to_entity = Column(String(50))    # For IC transactions
    
    # Custom fields (JSONB for flexibility)
    custom_fields = Column(JSON, default={})
    
    # Supporting documents
    attachment_links = Column(JSON, default=[])  # Array of document URLs/paths
    
    # Audit fields
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    modified_by = Column(String(100))
    modified_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    batch = relationship("JournalBatch", back_populates="journal_lines")

class JournalTemplate(Base):
    """Recurring Journal Entry Templates"""
    __tablename__ = 'journal_templates'
    
    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String(200), nullable=False)
    template_code = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    category = Column(String(100), nullable=False)
    
    # Template settings
    is_active = Column(Boolean, default=True)
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String(50))  # monthly, quarterly, annually
    
    # Default values for template
    default_entity = Column(String(50))
    default_scenario = Column(String(50))
    default_period_type = Column(String(50))
    
    # Template lines (JSON structure)
    template_lines = Column(JSON, default=[])
    
    # Audit fields
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    modified_by = Column(String(100))
    modified_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    batches = relationship("JournalBatch", back_populates="template")

class JournalCustomField(Base):
    """Custom Field Definitions for Journal Entries"""
    __tablename__ = 'journal_custom_fields'
    
    id = Column(Integer, primary_key=True, index=True)
    field_name = Column(String(100), nullable=False)
    field_label = Column(String(200), nullable=False)
    field_type = Column(String(50), nullable=False)  # text, number, date, dropdown, checkbox
    
    # Field configuration
    is_required = Column(Boolean, default=False)
    default_value = Column(String(500))
    dropdown_options = Column(JSON, default=[])  # For dropdown fields
    validation_rules = Column(JSON, default={})
    
    # Scope
    applies_to_category = Column(String(100))  # Apply to specific categories
    applies_to_entity = Column(String(50))     # Apply to specific entities
    
    # Audit fields
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class JournalUploadBatch(Base):
    """Bulk Upload Batch Tracking"""
    __tablename__ = 'journal_upload_batches'
    
    id = Column(Integer, primary_key=True, index=True)
    upload_batch_id = Column(String(100), unique=True, nullable=False)
    filename = Column(String(500), nullable=False)
    
    # Upload metadata
    total_rows = Column(Integer, default=0)
    successful_rows = Column(Integer, default=0)
    failed_rows = Column(Integer, default=0)
    
    # Processing status
    status = Column(String(50), default='processing')  # processing, completed, failed
    error_log = Column(JSON, default=[])  # Array of error messages
    
    # Audit fields
    uploaded_by = Column(String(100), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)

class JournalApprovalWorkflow(Base):
    """Approval Workflow Configuration"""
    __tablename__ = 'journal_approval_workflows'
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_name = Column(String(200), nullable=False)
    
    # Approval criteria
    amount_threshold = Column(Numeric(15, 2))
    account_types = Column(JSON, default=[])  # Array of account types requiring approval
    entity_codes = Column(JSON, default=[])   # Array of entities requiring approval
    categories = Column(JSON, default=[])     # Array of categories requiring approval
    
    # Approval levels
    approver_levels = Column(JSON, default=[])  # Array of approver configurations
    
    # Settings
    is_active = Column(Boolean, default=True)
    require_all_approvers = Column(Boolean, default=False)
    
    # Audit fields
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    modified_by = Column(String(100))
    modified_at = Column(DateTime, onupdate=datetime.utcnow)

class JournalAuditLog(Base):
    """Audit Trail for Journal Entry Changes"""
    __tablename__ = 'journal_audit_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey('journal_batches.id'), nullable=False)
    line_id = Column(Integer, ForeignKey('journal_lines.id'), nullable=True)
    
    # Action details
    action_type = Column(String(50), nullable=False)  # create, update, delete, approve, post, reverse
    action_description = Column(Text)
    
    # Change tracking
    old_values = Column(JSON, default={})
    new_values = Column(JSON, default={})
    
    # Audit fields
    performed_by = Column(String(100), nullable=False)
    performed_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
