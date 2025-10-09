from sqlalchemy import create_engine, Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import text
import os
from datetime import datetime
from typing import Optional
import psycopg2.extras
from dotenv import load_dotenv
from sqlalchemy.orm import backref
from sqlalchemy import Date
from sqlalchemy.dialects.postgresql import ARRAY

# Database configuration - prioritize PostgreSQL, fallback to SQLite
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'root@123')  # Use the correct password
POSTGRES_DB = os.getenv('POSTGRES_DB', 'finfusion360')

def get_database_url():
    """Get the database URL based on environment variables"""
    # URL encode the password to handle special characters
    from urllib.parse import quote_plus
    encoded_password = quote_plus(POSTGRES_PASSWORD)
    return f"postgresql://{POSTGRES_USER}:{encoded_password}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Try PostgreSQL first, fallback to SQLite
try:
    # URL encode the password to handle special characters
    DATABASE_URL = get_database_url()
    engine = create_engine(DATABASE_URL, echo=False)
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Connected to PostgreSQL database: " + POSTGRES_DB)
except Exception as e:
    print("PostgreSQL connection failed: " + str(e))
    print("Falling back to SQLite")
    DATABASE_URL = "sqlite:///./epm_consolidation.db"
    engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Company-specific database functions
def get_company_engine(company_name: str):
    """Get SQLAlchemy engine for a specific company database"""
    return engine

def get_company_session(company_name: str):
    """Get database session for a specific company"""
    return SessionLocal()

# Models
class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="company")
    accounts = relationship("Account", back_populates="company")
    entities = relationship("Entity", back_populates="company")
    hierarchies = relationship("Hierarchy", back_populates="company")
    fst_templates = relationship("FSTTemplate", back_populates="company")
    tb_entries = relationship("TBEntry", back_populates="company")
    uploads = relationship("Upload", back_populates="company")
    account_audit_logs = relationship("AccountAuditLog", back_populates="company")
    consolidation_settings = relationship("ConsolidationSettings", back_populates="company")
    disclosure_checklists = relationship("DisclosureChecklist", back_populates="company")
    supplier_reconciliations = relationship("SupplierReconciliation", back_populates="company")
    
    # Asset Management relationships
    assets = relationship("Asset", back_populates="company")
    asset_categories = relationship("AssetCategory", back_populates="company")
    asset_locations = relationship("AssetLocation", back_populates="company")
    asset_maintenance = relationship("AssetMaintenance", back_populates="company")
    asset_audits = relationship("AssetAudit", back_populates="company")
    warranty_records = relationship("WarrantyRecord", back_populates="company")
    asset_users = relationship("AssetUser", back_populates="company")
    system_settings = relationship("SystemSetting", back_populates="company")
    
    # Compliance Management relationships
    compliance_frameworks = relationship("ComplianceFramework", back_populates="company")
    compliance_controls = relationship("ComplianceControl", back_populates="company")
    compliance_policies = relationship("CompliancePolicy", back_populates="company")
    compliance_assessments = relationship("ComplianceAssessment", back_populates="company")
    
    # ESG Management relationships
    esg_indicators = relationship("ESGIndicator", back_populates="company")
    esg_data_points = relationship("ESGDataPoint", back_populates="company")
    esg_materiality_matrix = relationship("ESGMaterialityMatrix", back_populates="company")
    
    # Project Management relationships
    projects = relationship("Project", back_populates="company")
    project_tasks = relationship("ProjectTask", back_populates="company")
    project_milestones = relationship("ProjectMilestone", back_populates="company")
    
    # Purchase Order Management relationships
    purchase_orders = relationship("PurchaseOrder", back_populates="company")
    purchase_order_items = relationship("PurchaseOrderItem", back_populates="company")
    suppliers = relationship("Supplier", back_populates="company")
    
    # Revenue Analytics relationships
    revenue_streams = relationship("RevenueStream", back_populates="company")
    revenue_transactions = relationship("RevenueTransaction", back_populates="company")
    sales_pipeline = relationship("SalesPipeline", back_populates="company")
    
    # Role Management relationships
    roles = relationship("Role", back_populates="company")
    permissions = relationship("Permission", back_populates="company")
    role_permissions = relationship("RolePermission", back_populates="company")
    user_roles = relationship("UserRole", back_populates="company")
    
    # Stakeholder Management relationships
    stakeholders = relationship("Stakeholder", back_populates="company")
    stakeholder_interactions = relationship("StakeholderInteraction", back_populates="company")
    stakeholder_feedback = relationship("StakeholderFeedback", back_populates="company")
    
    # CRM relationships
    customers = relationship("Customer", back_populates="company")
    opportunities = relationship("Opportunity", back_populates="company")
    customer_interactions = relationship("CustomerInteraction", back_populates="company")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    username = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="users")
    
    # Composite unique constraint on company_id + username
    __table_args__ = (
        # PostgreSQL unique constraint will be handled by migration
    )

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    account_code = Column(String(100), nullable=False)
    account_name = Column(String(255), nullable=False)
    ifrs_category = Column(String(100))
    statement = Column(String(50))
    description = Column(Text, nullable=True)
    hierarchy_id = Column(Integer, nullable=True)
    node_id = Column(Integer, ForeignKey("account_nodes.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="accounts")
    account_node = relationship("AccountNode", back_populates="accounts")
    
    # Composite unique constraint on company_id + account_code
    __table_args__ = (
        # PostgreSQL unique constraint will be handled by migration
    )

class Entity(Base):
    __tablename__ = "entities"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    entity_code = Column(String(100), nullable=False)
    entity_name = Column(String(255), nullable=False)
    entity_type = Column(String(50), nullable=True)
    country = Column(String(100), nullable=True)
    currency = Column(String(10))
    hierarchy_id = Column(Integer, nullable=True)
    parent_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    node_id = Column(Integer, ForeignKey("entity_nodes.id"), nullable=True)  # Link to hierarchy node
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Custom fields
    public_company = Column(Boolean, nullable=True)
    jurisdiction = Column(String(100), nullable=True)
    business_sector = Column(String(255), nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="entities")
    entity_node = relationship("EntityNode", back_populates="entities")
    parent = relationship("Entity", remote_side=[id], backref="children")
    
    # Composite unique constraint on company_id + entity_code
    __table_args__ = (
        # PostgreSQL unique constraint will be handled by migration
    )

class FSTTemplate(Base):
    __tablename__ = "fst_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    statement_type = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    line_item = Column(String(255), nullable=False)
    display_order = Column(Integer, default=0)
    formula = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="fst_templates")
    elements = relationship("FSTElement", back_populates="template", cascade="all, delete-orphan")

class FSTElement(Base):
    __tablename__ = "fst_elements"
    
    id = Column(String(100), primary_key=True)  # element_20250817185943
    template_id = Column(Integer, ForeignKey("fst_templates.id"), nullable=False)
    element_type = Column(String(50), nullable=False)  # 'element', 'formula', or 'header'
    name = Column(String(255), nullable=False)
    account_code = Column(String(100), nullable=True)  # For element type, not for formula
    formula = Column(Text, nullable=True)  # For formula type, e.g., "1 + 2 + 3"
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)
    color = Column(String(50), nullable=True)  # Color code for styling (e.g., "#FF0000", "blue")
    created_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    template = relationship("FSTTemplate", back_populates="elements")

class TBEntry(Base):
    __tablename__ = "tb_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    period = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    entity_code = Column(String(100), nullable=False)
    account_code = Column(String(100), nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    source_filename = Column(String(255), nullable=True)
    source_type = Column(String(50), default='process_entry')
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="tb_entries")

class Upload(Base):
    __tablename__ = "uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="uploads")

class Hierarchy(Base):
    __tablename__ = "hierarchies"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    hierarchy_type = Column(String(50), nullable=False)
    hierarchy_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="hierarchies")

class AccountAuditLog(Base):
    __tablename__ = "account_audit_log"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    account_code = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)
    changes = Column(JSON, nullable=True)
    user = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="account_audit_logs")

class ConsolidationSettings(Base):
    __tablename__ = "consolidation_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    setting_key = Column(String(100), nullable=False)
    setting_value = Column(Text)
    setting_type = Column(String(50), default="string")  # string, number, boolean, json
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="consolidation_settings")
    
    # Composite unique constraint
    __table_args__ = (
        # PostgreSQL unique constraint will be handled by migration
    )

class IntercompanyTransaction(Base):
    __tablename__ = "intercompany_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Transaction details
    transaction_type = Column(String(100), nullable=False)  # IC_RECEIVABLE, IC_PAYABLE, etc.
    entity = Column(String(255), nullable=False)  # Entity name
    counterparty = Column(String(255), nullable=False)  # Counterparty entity name
    entity_account = Column(String(100), nullable=False)  # Account code for entity
    counterparty_account = Column(String(100), nullable=False)  # Account code for counterparty
    
    # Amounts
    entity_amount = Column(Numeric(15, 2), nullable=False)
    counterparty_amount = Column(Numeric(15, 2), nullable=False)
    difference = Column(Numeric(15, 2), default=0)
    
    # Period and dates
    period = Column(String(2), nullable=False)  # Month (01-12)
    year = Column(Integer, nullable=False)
    transaction_date = Column(DateTime, nullable=False)
    
    # Additional details
    description = Column(Text)
    reference = Column(String(255))  # Invoice number, contract reference, etc.
    currency = Column(String(3), default="USD")
    exchange_rate = Column(Numeric(10, 6), default=1.0)
    
    # Status and matching
    status = Column(String(50), default="Open")  # Open, Matched, Unmatched, Eliminated
    matching_id = Column(String(100))  # ID to link matching transactions
    elimination_entry_id = Column(Integer, ForeignKey("consolidation_journals.id"))
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    
    # Relationships
    company = relationship("Company")
    elimination_entry = relationship("ConsolidationJournal", foreign_keys=[elimination_entry_id])

class ConsolidationJournal(Base):
    __tablename__ = "consolidation_journals"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Journal details
    journal_number = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    journal_date = Column(DateTime, nullable=False)
    period = Column(String(2), nullable=False)  # Month (01-12)
    year = Column(Integer, nullable=False)
    
    # Journal type and status
    journal_type = Column(String(100), nullable=False)  # ELIMINATION, ADJUSTMENT, REVERSAL, etc.
    status = Column(String(50), default="Draft")  # Draft, Posted, Reversed, Cancelled
    
    # Balance validation
    total_debits = Column(Numeric(15, 2), default=0)
    total_credits = Column(Numeric(15, 2), default=0)
    is_balanced = Column(Boolean, default=False)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    posted_by = Column(String(100))
    posted_at = Column(DateTime)
    
    # Relationships
    company = relationship("Company")
    entries = relationship("ConsolidationJournalEntry", back_populates="journal", cascade="all, delete-orphan")

class ConsolidationJournalEntry(Base):
    __tablename__ = "consolidation_journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    journal_id = Column(Integer, ForeignKey("consolidation_journals.id"), nullable=False)
    
    # Entry details
    entry_type = Column(String(50), nullable=False)  # Debit, Credit
    account_code = Column(String(100), nullable=False)
    entity = Column(String(255), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    
    # Additional details
    description = Column(Text)
    reference = Column(String(255))
    line_number = Column(Integer, default=0)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    journal = relationship("ConsolidationJournal", back_populates="entries")

class ProcessJournalCategory(Base):
    __tablename__ = "process_journal_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Category details
    category_code = Column(String(50), nullable=False)
    category_name = Column(String(255), nullable=False)
    description = Column(Text)
    source_type = Column(String(50), default='category')
    
    # Period and year filtering
    period = Column(String(50), nullable=True)
    year = Column(Integer, nullable=True)
    
    # Category settings
    is_active = Column(Boolean, default=True)
    default_journal_type = Column(String(100), default="ADJUSTMENT")
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    journals = relationship("ProcessJournal", back_populates="category")

class ProcessJournal(Base):
    __tablename__ = "process_journals"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("process_journal_categories.id"), nullable=True)
    
    # Journal details
    journal_number = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    journal_date = Column(DateTime, nullable=False)
    source_type = Column(String(50), default='journal')
    period = Column(String(50), nullable=False)  # Month name or quarter
    year = Column(Integer, nullable=False)
    
    # Journal type and status
    journal_type = Column(String(100), nullable=False)  # ADJUSTMENT, REVERSAL, CORRECTION, etc.
    status = Column(String(50), default="Draft")  # Draft, Posted, Reversed, Cancelled
    
    # Balance validation
    total_debits = Column(Numeric(15, 2), default=0)
    total_credits = Column(Numeric(15, 2), default=0)
    is_balanced = Column(Boolean, default=False)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    posted_by = Column(String(100))
    posted_at = Column(DateTime)
    
    # Relationships
    company = relationship("Company")
    category = relationship("ProcessJournalCategory", back_populates="journals")
    entries = relationship("ProcessJournalEntry", back_populates="journal", cascade="all, delete-orphan")

class ProcessJournalEntry(Base):
    __tablename__ = "process_journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    journal_id = Column(Integer, ForeignKey("process_journals.id"), nullable=False)
    
    # Entry details
    entry_type = Column(String(50), nullable=False)  # Debit, Credit
    account_code = Column(String(100), nullable=False)
    entity = Column(String(255), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    
    # Additional details
    description = Column(Text)
    reference = Column(String(255))
    line_number = Column(Integer, default=0)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    journal = relationship("ProcessJournal", back_populates="entries")

class OwnershipStructure(Base):
    __tablename__ = "ownership_structures"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Entity details
    parent_entity = Column(String(255), nullable=False)
    subsidiary_entity = Column(String(255), nullable=False)
    
    # Ownership details
    ownership_percentage = Column(Numeric(5, 2), nullable=False)  # 0.00 to 100.00
    nci_percentage = Column(Numeric(5, 2), default=0)  # 100 - ownership_percentage
    
    # Relationship type and description
    relationship_type = Column(String(100), nullable=False)  # Acquisition, Merger, Joint Venture, Restructuring/Spin-off, Other
    description = Column(Text)  # Detailed description of the relationship
    
    # Validity period
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime)  # NULL if ongoing
    
    # Financial details
    fair_value_net_assets = Column(Numeric(15, 2), nullable=False)
    purchase_consideration = Column(Numeric(15, 2))
    goodwill_method = Column(String(50), default="Partial")  # Partial, Full
    goodwill_value = Column(Numeric(15, 2))
    nci_value = Column(Numeric(15, 2))
    
    # Legacy fields for backward compatibility
    effective_date = Column(DateTime)  # Kept for backward compatibility
    entity_name = Column(String(255))  # Kept for backward compatibility
    entity_id = Column(String(100))  # Kept for backward compatibility
    economic_interest_percentage = Column(Numeric(5, 2))
    voting_rights_percentage = Column(Numeric(5, 2))
    ownership_event_type = Column(String(100))
    acquisition_date = Column(DateTime)
    ownership_type = Column(String(50))
    acquisition_cost = Column(Numeric(15, 2))
    consideration_paid = Column(Numeric(15, 2))
    
    # Status
    status = Column(String(50), default="Active")  # Active, Inactive
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")

class NCICalculation(Base):
    __tablename__ = "nci_calculations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Calculation period
    period = Column(String(2), nullable=False)  # Month (01-12)
    year = Column(Integer, nullable=False)
    
    # Entity details
    entity_name = Column(String(255), nullable=False)
    ownership_percentage = Column(Numeric(5, 2), nullable=False)
    nci_percentage = Column(Numeric(5, 2), nullable=False)
    
    # Financial amounts
    subsidiary_equity = Column(Numeric(15, 2), nullable=False)
    parent_share = Column(Numeric(15, 2), nullable=False)
    minority_interest = Column(Numeric(15, 2), nullable=False)
    nci_amount = Column(Numeric(15, 2), nullable=False)
    
    # Goodwill and adjustments
    goodwill_allocation = Column(Numeric(15, 2), default=0)
    fair_value_adjustments = Column(Numeric(15, 2), default=0)
    other_adjustments = Column(Numeric(15, 2), default=0)
    
    # Calculation method
    calculation_method = Column(String(100), default="Proportionate")  # Proportionate, Fair Value
    goodwill_method = Column(String(50), default="Partial")  # Partial, Full
    
    # Status
    status = Column(String(50), default="Calculated")  # Calculated, Reviewed, Approved
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    calculated_by = Column(String(100))
    reviewed_by = Column(String(100))
    reviewed_at = Column(DateTime)
    
    # Relationships
    company = relationship("Company")

class RollForwardEntry(Base):
    __tablename__ = "roll_forward_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Entry details
    account_code = Column(String(100), nullable=False)
    entity = Column(String(255), nullable=False)
    
    # Period details
    from_period = Column(String(2), nullable=False)
    from_year = Column(Integer, nullable=False)
    to_period = Column(String(2), nullable=False)
    to_year = Column(Integer, nullable=False)
    
    # Amounts
    opening_balance = Column(Numeric(15, 2), nullable=False)
    movements = Column(Numeric(15, 2), default=0)
    closing_balance = Column(Numeric(15, 2), nullable=False)
    
    # Movement details
    movement_type = Column(String(100))  # Net Income, Dividends, Capital Changes, etc.
    description = Column(Text)
    
    # Status
    status = Column(String(50), default="Open")  # Open, Closed, Adjusted
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")

class ConsolidatedFinancialStatement(Base):
    __tablename__ = "consolidated_financial_statements"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Statement details
    statement_type = Column(String(100), nullable=False)  # Balance Sheet, Income Statement, etc.
    period = Column(String(2), nullable=False)  # Month (01-12)
    year = Column(Integer, nullable=False)
    statement_date = Column(DateTime, nullable=False)
    
    # Content
    statement_data = Column(JSONB)  # Store the complete statement as JSON
    summary_data = Column(JSONB)  # Store key metrics and summaries
    
    # Status
    status = Column(String(50), default="Draft")  # Draft, Final, Published
    version = Column(String(20), default="1.0")
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    
    # Relationships
    company = relationship("Company")

# Utility functions
def bulk_upsert_tb_entries(db_session, entries_data, company_id):
    """Bulk upsert trial balance entries using COPY for performance"""
    try:
        # Use COPY for bulk insert (PostgreSQL specific)
        if hasattr(engine.dialect, 'psycopg2_version'):
            # PostgreSQL with psycopg2
            conn = engine.raw_connection()
            cursor = conn.cursor()
            
            # Prepare data for COPY
            data = []
            for entry in entries_data:
                data.append((
                    company_id,
                    entry['period'],
                    entry['year'],
                    entry['month'],
                    entry['entity_code'],
                    entry['account_code'],
                    entry['amount'],
                    entry.get('source_filename', '')
                ))
            
            # Use execute_values for bulk insert
            psycopg2.extras.execute_values(
                cursor,
                """
                INSERT INTO tb_entries (company_id, period, year, month, entity_code, account_code, amount, source_filename)
                VALUES %s
                ON CONFLICT (company_id, period, year, month, entity_code, account_code) 
                DO UPDATE SET amount = EXCLUDED.amount, source_filename = EXCLUDED.source_filename
                """,
                data,
                template=None
            )
            
            conn.commit()
            cursor.close()
            conn.close()
            return True
            
        else:
            # Fallback to SQLAlchemy for other databases
            for entry_data in entries_data:
                entry = TBEntry(
                    company_id=company_id,
                    period=entry_data['period'],
                    year=entry_data['year'],
                    month=entry_data['month'],
                    entity_code=entry_data['entity_code'],
                    account_code=entry_data['account_code'],
                    amount=entry_data['amount'],
                    source_filename=entry_data.get('source_filename', '')
                )
                db_session.add(entry)
            
            db_session.commit()
            return True
            
    except Exception as e:
        print(f"Error in bulk upsert: {e}")
        db_session.rollback()
        return False

def get_company_id_by_name(db_session, company_name: str) -> Optional[int]:
    """Get company ID by name with caching"""
    company = db_session.query(Company).filter(Company.name == company_name).first()
    return company.id if company else None

def create_indexes():
    """Create performance indexes for the database"""
    try:
        with engine.connect() as conn:
            # Indexes for tb_entries
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_tb_entries_company_year_period 
                ON tb_entries(company_id, year, period)
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_tb_entries_company_entity 
                ON tb_entries(company_id, entity_code)
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_tb_entries_company_account 
                ON tb_entries(company_id, account_code)
            """))
            
            # Indexes for other tables
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_accounts_company_code 
                ON accounts(company_id, account_code)
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_entities_company_code 
                ON entities(company_id, entity_code)
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_company_username 
                ON users(company_id, username)
            """))
            
            conn.commit()
            print("✓ Database indexes created successfully")
            
    except Exception as e:
        print(f"Error creating indexes: {e}")

# Initialize database
def init_db():
    """Initialize the database with tables"""
    try:
        Base.metadata.create_all(bind=engine)
        create_indexes()
        print("✓ Database initialized successfully")
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

def init_company_database(company_name: str):
    """Initialize database for a specific company"""
    try:
        # First, create the database if it doesn't exist
        with engine.connect() as conn:
            # Check if database exists
            safe_name = company_name.replace(' ', '_').replace('-', '_').lower()
            safe_name = ''.join(c for c in safe_name if c.isalnum() or c == '_')[:30]
            
            result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :db_name"), {"db_name": safe_name})
            exists = result.fetchone()
            
            if not exists:
                # Create the database - need to commit this outside transaction
                conn.commit()
                conn.execute(text(f"CREATE DATABASE {safe_name}"))
                print(f"✓ Created database '{safe_name}' for company '{company_name}'")
            
        # Now initialize the company-specific database
        company_engine = get_company_engine(company_name)
        Base.metadata.create_all(bind=company_engine)
        
        print(f"✓ Company database '{company_name}' initialized successfully")
        return True
        
    except Exception as e:
        print(f"Error initializing company database '{company_name}': {e}")
        return False

def create_company_indexes(conn, company_name: str):
    """Create performance indexes for a specific company database"""
    try:
        # Indexes for tb_entries
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_tb_entries_company_year_period 
            ON tb_entries(company_id, year, period)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_tb_entries_company_entity 
            ON tb_entries(company_id, entity_code)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_tb_entries_company_account 
            ON tb_entries(company_id, account_code)
        """))
        
        # Indexes for other tables
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_accounts_company_code 
            ON accounts(company_id, account_code)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_entities_company_code 
            ON entities(company_id, entity_code)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_company_username 
            ON users(company_id, username)
        """))
        
        conn.commit()
        print(f"✓ Database indexes created successfully for {company_name}")
        
    except Exception as e:
        print(f"Error creating indexes for {company_name}: {e}")

class AccountCategoryConfig(Base):
    """Account Category Configuration for Debit/Credit Effects"""
    __tablename__ = "account_category_config"
    
    id = Column(Integer, primary_key=True, index=True)
    account_type = Column(String(50), unique=True, nullable=False, index=True)
    debit_effect = Column(String(100), nullable=False)  # e.g., "Increase (+)", "Decrease (-)"
    credit_effect = Column(String(100), nullable=False)  # e.g., "Decrease (-)", "Increase (+)"
    sign = Column(String(10), nullable=False)  # e.g., "+", "-"
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to accounts - temporarily commented out to fix SQLAlchemy initialization
    # accounts = relationship("IFRSAccount", back_populates="category_config")

class EnhancedIntercompanyTransaction(Base):
    """Enhanced IC Transaction with Account Category Effects"""
    __tablename__ = "enhanced_ic_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(String(50), nullable=False, index=True)
    counterparty_id = Column(String(50), nullable=False, index=True)
    entity_account_id = Column(String(50), nullable=False, index=True)
    counterparty_account_id = Column(String(50), nullable=False, index=True)
    transaction_category = Column(String(100), nullable=False)
    description = Column(Text)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), default='USD')
    transaction_date = Column(Date, nullable=False)
    period = Column(String(20), nullable=False, index=True)
    year = Column(String(10), nullable=False, index=True)
    
    # Account category effects
    entity_account_category = Column(String(50))
    counterparty_account_category = Column(String(50))
    entity_debit_effect = Column(String(100))
    entity_credit_effect = Column(String(100))
    counterparty_debit_effect = Column(String(100))
    counterparty_credit_effect = Column(String(100))
    
    # Transaction details
    debit_amount = Column(Numeric(15, 2))
    credit_amount = Column(Numeric(15, 2))
    action_tip = Column(Text)
    status = Column(String(50), default='pending')  # pending, matched, reconciled, approved
    match_id = Column(String(100), index=True)  # For linking matched transactions
    
    # Elimination status for consolidation
    elimination = Column(String(3), default='no')  # 'yes' or 'no' - whether transaction should be eliminated in consolidation
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    approved_by = Column(String(100))
    approval_date = Column(DateTime)
    
    # Relationships - temporarily commented out to fix SQLAlchemy initialization
    # entity = relationship("Entity", foreign_keys=[entity_id])
    # counterparty = relationship("Entity", foreign_keys=[counterparty_id])
    # entity_account = relationship("IFRSAccount", foreign_keys=[entity_account_id])
    # counterparty_account = relationship("IFRSAccount", foreign_keys=[counterparty_account_id])

# Separate IC Transaction Tables
class ICReceivable(Base):
    """IC Receivable Transactions"""
    __tablename__ = "ic_receivables"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(String(50), nullable=False, index=True)
    counterparty_id = Column(String(50), nullable=False, index=True)
    account_id = Column(String(50), nullable=False, index=True)
    transaction_category = Column(String(100), nullable=False)
    description = Column(Text)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), default='USD')
    transaction_date = Column(Date, nullable=False)
    period = Column(String(20), nullable=False, index=True)
    year = Column(String(10), nullable=False, index=True)
    status = Column(String(50), default='pending')
    match_id = Column(String(100), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships - temporarily commented out to fix SQLAlchemy initialization
    # entity = relationship("Entity", foreign_keys=[entity_id])
    # counterparty = relationship("Entity", foreign_keys=[counterparty_id])
    # account = relationship("IFRSAccount", foreign_keys=[account_id])

class ICPayable(Base):
    """IC Payable Transactions"""
    __tablename__ = "ic_payables"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(String(50), nullable=False, index=True)
    counterparty_id = Column(String(50), nullable=False, index=True)
    account_id = Column(String(50), nullable=False, index=True)
    transaction_category = Column(String(100), nullable=False)
    description = Column(Text)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), default='USD')
    transaction_date = Column(Date, nullable=False)
    period = Column(String(20), nullable=False, index=True)
    year = Column(String(10), nullable=False, index=True)
    status = Column(String(50), default='pending')
    match_id = Column(String(100), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships - temporarily commented out to fix SQLAlchemy initialization
    # entity = relationship("Entity", foreign_keys=[entity_id])
    # counterparty = relationship("Entity", foreign_keys=[counterparty_id])
    # account = relationship("IFRSAccount", foreign_keys=[account_id])

class ICLoan(Base):
    """IC Loan Transactions"""
    __tablename__ = "ic_loans"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(String(50), nullable=False, index=True)
    counterparty_id = Column(String(50), nullable=False, index=True)
    account_id = Column(String(50), nullable=False, index=True)
    transaction_category = Column(String(100), nullable=False)
    description = Column(Text)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), default='USD')
    transaction_date = Column(Date, nullable=False)
    period = Column(String(20), nullable=False, index=True)
    year = Column(String(10), nullable=False, index=True)
    interest_rate = Column(Numeric(5, 2))
    maturity_date = Column(Date)
    status = Column(String(50), default='pending')
    match_id = Column(String(100), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships - temporarily commented out to fix SQLAlchemy initialization
    # entity = relationship("Entity", foreign_keys=[entity_id])
    # counterparty = relationship("Entity", foreign_keys=[counterparty_id])
    # account = relationship("IFRSAccount", foreign_keys=[account_id])

class ICDividend(Base):
    """IC Dividend Transactions"""
    __tablename__ = "ic_dividends"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(String(50), nullable=False, index=True)
    counterparty_id = Column(String(50), nullable=False, index=True)
    account_id = Column(String(50), nullable=False, index=True)
    transaction_category = Column(String(100), nullable=False)
    description = Column(Text)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), default='USD')
    transaction_date = Column(Date, nullable=False)
    period = Column(String(20), nullable=False, index=True)
    year = Column(String(10), nullable=False, index=True)
    dividend_type = Column(String(50))  # Regular, Special, etc.
    ex_date = Column(Date)
    record_date = Column(Date)
    payment_date = Column(Date)
    status = Column(String(50), default='pending')
    match_id = Column(String(100), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships - temporarily commented out to fix SQLAlchemy initialization
    # entity = relationship("Entity", foreign_keys=[entity_id])
    # counterparty = relationship("Entity", foreign_keys=[counterparty_id])
    # account = relationship("IFRSAccount", foreign_keys=[account_id])

class ICService(Base):
    """IC Service Transactions"""
    __tablename__ = "ic_services"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(String(50), nullable=False, index=True)
    counterparty_id = Column(String(50), nullable=False, index=True)
    account_id = Column(String(50), nullable=False, index=True)
    transaction_category = Column(String(100), nullable=False)
    description = Column(Text)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), default='USD')
    transaction_date = Column(Date, nullable=False)
    period = Column(String(20), nullable=False, index=True)
    year = Column(String(10), nullable=False, index=True)
    service_type = Column(String(100))  # Management, IT, HR, etc.
    service_period_start = Column(Date)
    service_period_end = Column(Date)
    status = Column(String(50), default='pending')
    match_id = Column(String(100), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships - temporarily commented out to fix SQLAlchemy initialization
    # entity = relationship("Entity", foreign_keys=[entity_id])
    # counterparty = relationship("Entity", foreign_keys=[counterparty_id])
    # account = relationship("IFRSAccount", foreign_keys=[account_id])

class ICMatchingRule(Base):
    """IC Transaction Matching Rules"""
    __tablename__ = "ic_matching_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), nullable=False)
    rule_description = Column(Text)
    
    # Matching criteria
    entity_account_pattern = Column(String(200))  # Regex pattern for account matching
    counterparty_account_pattern = Column(String(200))
    amount_tolerance = Column(Numeric(10, 2), default=0.01)  # Allowable difference
    period_match = Column(Boolean, default=True)  # Must match period
    year_match = Column(Boolean, default=True)   # Must match year
    
    # Auto-elimination settings
    auto_eliminate = Column(Boolean, default=True)
    elimination_account = Column(String(50))  # Account for elimination entries
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ICEliminationEntry(Base):
    """IC Elimination Entries for Consolidation"""
    __tablename__ = "ic_elimination_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    elimination_date = Column(Date, nullable=False)
    period = Column(String(20), nullable=False, index=True)
    year = Column(String(10), nullable=False, index=True)
    
    # Matched transactions
    entity_transaction_id = Column(Integer, ForeignKey("enhanced_ic_transactions.id"))
    counterparty_transaction_id = Column(Integer, ForeignKey("enhanced_ic_transactions.id"))
    
    # Elimination details
    elimination_account = Column(String(50), nullable=False)
    elimination_amount = Column(Numeric(15, 2), nullable=False)
    elimination_type = Column(String(50))  # "IC Receivable", "IC Payable", etc.
    
    # Consolidation details
    consolidated_entity = Column(String(100))
    consolidated_period = Column(String(20))
    consolidated_year = Column(String(10))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships - temporarily commented out to fix SQLAlchemy initialization
    # entity_transaction = relationship("EnhancedIntercompanyTransaction", foreign_keys=[entity_transaction_id])
    # counterparty_transaction = relationship("EnhancedIntercompanyTransaction", foreign_keys=[counterparty_transaction_id])

# Update existing IFRSAccount model to include category configuration
class IFRSAccount(Base):
    """IFRS Account with Category Configuration"""
    __tablename__ = "ifrs_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    account_code = Column(String(50), unique=True, nullable=False, index=True)
    account_name = Column(String(200), nullable=False)
    account_type = Column(String(50), nullable=False, index=True)  # Asset, Liability, Equity, Income, Expense
    parent_account = Column(String(50), nullable=True)  # Temporarily removed foreign key to fix initialization
    hierarchy_level = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Category configuration relationship - temporarily commented out
    # category_config_id = Column(Integer, ForeignKey("account_category_config.id"))
    # category_config = relationship("AccountCategoryConfig", back_populates="accounts")
    
    # Relationships - temporarily commented out to fix SQLAlchemy initialization
    # children = relationship("IFRSAccount", backref=backref("parent", remote_side=[id]))
    # ic_transactions_entity = relationship("EnhancedIntercompanyTransaction", foreign_keys=[EnhancedIntercompanyTransaction.entity_account_id])
    # ic_transactions_counterparty = relationship("EnhancedIntercompanyTransaction", foreign_keys=[EnhancedIntercompanyTransaction.counterparty_account_id])

# Budgeting and Forecasting Models
class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Budget details
    budget_name = Column(String(255), nullable=False)
    budget_version = Column(String(50), nullable=False, default="v1.0")
    budget_type = Column(String(50), nullable=False)  # ANNUAL, QUARTERLY, MONTHLY, PROJECT
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    fiscal_year = Column(Integer, nullable=False)
    
    # Budget amounts
    total_revenue = Column(Numeric(20, 2), default=0)
    total_expenses = Column(Numeric(20, 2), default=0)
    total_assets = Column(Numeric(20, 2), default=0)
    total_liabilities = Column(Numeric(20, 2), default=0)
    net_income = Column(Numeric(20, 2), default=0)
    
    # Status and workflow
    status = Column(String(50), default="Draft")  # Draft, Submitted, Under Review, Approved, Active, Closed
    approval_status = Column(String(50), default="Pending")  # Pending, Approved, Rejected
    workflow_step = Column(String(100), default="Creation")
    
    # Budget hierarchy
    parent_budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=True)
    department_id = Column(String(100), nullable=True)
    project_id = Column(String(100), nullable=True)
    
    # Metadata
    description = Column(Text)
    assumptions = Column(JSONB)  # Store budget assumptions as JSON
    notes = Column(Text)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    
    # Relationships
    company = relationship("Company")
    parent_budget = relationship("Budget", remote_side=[id])
    budget_lines = relationship("BudgetLine", back_populates="budget")
    budget_versions = relationship("BudgetVersion", back_populates="budget")

class BudgetLine(Base):
    __tablename__ = "budget_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    
    # Line details
    account_code = Column(String(100), nullable=False)
    account_name = Column(String(255), nullable=False)
    entity_code = Column(String(100), nullable=True)
    entity_name = Column(String(255), nullable=True)
    
    # Amounts by period
    jan_amount = Column(Numeric(15, 2), default=0)
    feb_amount = Column(Numeric(15, 2), default=0)
    mar_amount = Column(Numeric(15, 2), default=0)
    apr_amount = Column(Numeric(15, 2), default=0)
    may_amount = Column(Numeric(15, 2), default=0)
    jun_amount = Column(Numeric(15, 2), default=0)
    jul_amount = Column(Numeric(15, 2), default=0)
    aug_amount = Column(Numeric(15, 2), default=0)
    sep_amount = Column(Numeric(15, 2), default=0)
    oct_amount = Column(Numeric(15, 2), default=0)
    nov_amount = Column(Numeric(15, 2), default=0)
    dec_amount = Column(Numeric(15, 2), default=0)
    
    # Totals
    q1_total = Column(Numeric(15, 2), default=0)
    q2_total = Column(Numeric(15, 2), default=0)
    q3_total = Column(Numeric(15, 2), default=0)
    q4_total = Column(Numeric(15, 2), default=0)
    annual_total = Column(Numeric(15, 2), default=0)
    
    # Line metadata
    line_type = Column(String(50), default="Regular")  # Regular, Driver-Based, Formula
    driver_type = Column(String(100), nullable=True)  # Headcount, Units, Price, etc.
    driver_value = Column(Numeric(15, 2), nullable=True)
    formula = Column(Text, nullable=True)
    
    # Status
    status = Column(String(50), default="Active")
    notes = Column(Text)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    budget = relationship("Budget", back_populates="budget_lines")

class BudgetVersion(Base):
    __tablename__ = "budget_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    
    # Version details
    version_number = Column(String(50), nullable=False)
    version_name = Column(String(255), nullable=False)
    version_type = Column(String(50), default="Revision")  # Original, Revision, Final
    
    # Changes tracking
    changes_summary = Column(Text)
    changes_details = Column(JSONB)  # Detailed changes as JSON
    
    # Status
    status = Column(String(50), default="Draft")
    is_current = Column(Boolean, default=False)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    
    # Relationships
    budget = relationship("Budget", back_populates="budget_versions")

class Forecast(Base):
    __tablename__ = "forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Forecast details
    forecast_name = Column(String(255), nullable=False)
    forecast_type = Column(String(50), nullable=False)  # REVENUE, EXPENSE, CASH_FLOW, BALANCE_SHEET
    forecast_method = Column(String(50), nullable=False)  # TOP_DOWN, BOTTOM_UP, DRIVER_BASED, STATISTICAL
    forecast_frequency = Column(String(50), default="MONTHLY")  # DAILY, WEEKLY, MONTHLY, QUARTERLY
    
    # Period details
    forecast_start_date = Column(Date, nullable=False)
    forecast_end_date = Column(Date, nullable=False)
    forecast_horizon = Column(Integer, default=12)  # Number of periods to forecast
    
    # Forecast data
    base_scenario_data = Column(JSONB)  # Store forecast data as JSON
    optimistic_scenario_data = Column(JSONB)
    pessimistic_scenario_data = Column(JSONB)
    
    # Drivers and assumptions
    business_drivers = Column(JSONB)  # Store business drivers as JSON
    assumptions = Column(JSONB)  # Store forecast assumptions as JSON
    
    # Status
    status = Column(String(50), default="Draft")  # Draft, Active, Completed, Archived
    accuracy_score = Column(Numeric(5, 2), nullable=True)  # Forecast accuracy percentage
    
    # Metadata
    description = Column(Text)
    notes = Column(Text)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    last_updated_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    forecast_lines = relationship("ForecastLine", back_populates="forecast")
    forecast_scenarios = relationship("ForecastScenario", back_populates="forecast")

class ForecastLine(Base):
    __tablename__ = "forecast_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    forecast_id = Column(Integer, ForeignKey("forecasts.id"), nullable=False)
    
    # Line details
    account_code = Column(String(100), nullable=False)
    account_name = Column(String(255), nullable=False)
    entity_code = Column(String(100), nullable=True)
    entity_name = Column(String(255), nullable=True)
    
    # Period data (stored as JSON for flexibility)
    period_data = Column(JSONB)  # Store monthly/quarterly data as JSON
    
    # Driver information
    driver_type = Column(String(100), nullable=True)
    driver_value = Column(Numeric(15, 2), nullable=True)
    driver_formula = Column(Text, nullable=True)
    
    # Forecast accuracy
    historical_accuracy = Column(Numeric(5, 2), nullable=True)
    confidence_interval = Column(JSONB, nullable=True)
    
    # Status
    status = Column(String(50), default="Active")
    notes = Column(Text)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    forecast = relationship("Forecast", back_populates="forecast_lines")

class ForecastScenario(Base):
    __tablename__ = "forecast_scenarios"
    
    id = Column(Integer, primary_key=True, index=True)
    forecast_id = Column(Integer, ForeignKey("forecasts.id"), nullable=False)
    
    # Scenario details
    scenario_name = Column(String(255), nullable=False)
    scenario_type = Column(String(50), default="Base")  # Base, Optimistic, Pessimistic, Custom
    probability = Column(Numeric(5, 2), default=100)  # Probability percentage
    
    # Scenario data
    scenario_data = Column(JSONB)  # Store scenario-specific data as JSON
    assumptions = Column(JSONB)  # Scenario-specific assumptions
    
    # Impact analysis
    revenue_impact = Column(Numeric(10, 2), default=0)  # Percentage impact
    expense_impact = Column(Numeric(10, 2), default=0)
    net_income_impact = Column(Numeric(10, 2), default=0)
    
    # Status
    status = Column(String(50), default="Active")
    is_default = Column(Boolean, default=False)
    
    # Metadata
    description = Column(Text)
    notes = Column(Text)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    forecast = relationship("Forecast", back_populates="forecast_scenarios")

class BusinessDriver(Base):
    __tablename__ = "business_drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Driver details
    driver_name = Column(String(255), nullable=False)
    driver_code = Column(String(100), nullable=False)
    driver_type = Column(String(50), nullable=False)  # HEADCOUNT, UNITS, PRICE, VOLUME, etc.
    driver_category = Column(String(100), nullable=True)  # REVENUE, EXPENSE, OPERATIONAL
    
    # Driver values
    current_value = Column(Numeric(15, 2), nullable=True)
    unit_of_measure = Column(String(50), nullable=True)
    currency = Column(String(3), default="USD")
    
    # Driver relationships
    related_accounts = Column(JSONB)  # Accounts that use this driver
    driver_formula = Column(Text, nullable=True)  # Formula for calculating driver impact
    
    # Historical data
    historical_data = Column(JSONB)  # Store historical driver values as JSON
    
    # Status
    status = Column(String(50), default="Active")
    is_required = Column(Boolean, default=False)
    
    # Metadata
    description = Column(Text)
    notes = Column(Text)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")

class BudgetForecastComparison(Base):
    __tablename__ = "budget_forecast_comparisons"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Comparison details
    comparison_name = Column(String(255), nullable=False)
    comparison_type = Column(String(50), nullable=False)  # BUDGET_VS_ACTUAL, FORECAST_VS_ACTUAL, BUDGET_VS_FORECAST
    period = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    
    # Reference data
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=True)
    forecast_id = Column(Integer, ForeignKey("forecasts.id"), nullable=True)
    
    # Comparison results
    comparison_data = Column(JSONB)  # Store comparison results as JSON
    variance_analysis = Column(JSONB)  # Store variance analysis as JSON
    
    # Thresholds and alerts
    variance_threshold = Column(Numeric(5, 2), default=5.0)  # Percentage threshold for alerts
    alert_status = Column(String(50), default="Normal")  # Normal, Warning, Critical
    
    # Status
    status = Column(String(50), default="Active")
    
    # Metadata
    description = Column(Text)
    notes = Column(Text)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    budget = relationship("Budget")
    forecast = relationship("Forecast")

class RollingForecast(Base):
    __tablename__ = "rolling_forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Rolling forecast details
    forecast_name = Column(String(255), nullable=False)
    forecast_period = Column(String(50), nullable=False)  # Monthly, Quarterly
    rolling_horizon = Column(Integer, default=12)  # Number of periods to forecast ahead
    
    # Current forecast data
    current_forecast_data = Column(JSONB)
    previous_forecast_data = Column(JSONB)
    
    # Update tracking
    last_update_date = Column(DateTime, nullable=True)
    next_update_date = Column(DateTime, nullable=True)
    update_frequency = Column(String(50), default="MONTHLY")
    
    # Accuracy tracking
    forecast_accuracy = Column(JSONB)  # Store accuracy metrics as JSON
    trend_analysis = Column(JSONB)  # Store trend analysis as JSON
    
    # Status
    status = Column(String(50), default="Active")
    auto_update = Column(Boolean, default=True)
    
    # Metadata
    description = Column(Text)
    notes = Column(Text)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")

# Custom Axes Models
class CustomAxis(Base):
    __tablename__ = "custom_axes"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Axis details
    axis_id = Column(String(50), nullable=False)  # Unique identifier like "D01", "P01"
    axis_name = Column(String(255), nullable=False)  # e.g., "Department", "Product Category"
    description = Column(Text, nullable=True)
    value_type = Column(String(50), nullable=False)  # text, number, date, boolean, dropdown
    
    # Configuration
    is_active = Column(Boolean, default=True)
    is_required = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    axis_values = relationship("CustomAxisValue", back_populates="axis", cascade="all, delete-orphan")
    axis_columns = relationship("CustomAxisColumn", back_populates="axis", cascade="all, delete-orphan")
    
    # Composite unique constraint on company_id + axis_id
    __table_args__ = (
        # PostgreSQL unique constraint will be handled by migration
    )

class CustomAxisColumn(Base):
    __tablename__ = "custom_axis_columns"
    
    id = Column(Integer, primary_key=True, index=True)
    axis_id = Column(Integer, ForeignKey("custom_axes.id"), nullable=False)
    
    # Column details
    column_name = Column(String(255), nullable=False)  # e.g., "Manager", "Cost Center"
    data_type = Column(String(50), nullable=False)  # text, number, date, boolean, dropdown
    is_required = Column(Boolean, default=False)
    default_value = Column(Text, nullable=True)
    validation_rule = Column(Text, nullable=True)  # JSON validation rules
    display_order = Column(Integer, default=0)
    
    # For dropdown type
    dropdown_options = Column(JSONB, nullable=True)  # Array of options for dropdown
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    axis = relationship("CustomAxis", back_populates="axis_columns")
    
    # Composite unique constraint on axis_id + column_name
    __table_args__ = (
        # PostgreSQL unique constraint will be handled by migration
    )

class CustomAxisValue(Base):
    __tablename__ = "custom_axis_values"
    
    id = Column(Integer, primary_key=True, index=True)
    axis_id = Column(Integer, ForeignKey("custom_axes.id"), nullable=False)
    
    # Value details
    value_id = Column(String(100), nullable=False)  # Unique identifier for the value
    value_name = Column(String(255), nullable=False)  # e.g., "HR", "Finance"
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    
    # Dynamic column values (stored as JSON)
    column_values = Column(JSONB, nullable=True)  # {"Manager": "Alice", "Cost Center": "CC001"}
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    axis = relationship("CustomAxis", back_populates="axis_values")
    
    # Composite unique constraint on axis_id + value_id
    __table_args__ = (
        # PostgreSQL unique constraint will be handled by migration
    )

class CustomAxisAssignment(Base):
    __tablename__ = "custom_axis_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Assignment details
    axis_id = Column(Integer, ForeignKey("custom_axes.id"), nullable=False)
    value_id = Column(Integer, ForeignKey("custom_axis_values.id"), nullable=False)
    
    # What this assignment is linked to
    entity_code = Column(String(100), nullable=True)  # If linked to entity
    account_code = Column(String(100), nullable=True)  # If linked to account
    tb_entry_id = Column(Integer, ForeignKey("tb_entries.id"), nullable=True)  # If linked to specific transaction
    
    # Additional context
    period = Column(String(50), nullable=True)
    year = Column(Integer, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    axis = relationship("CustomAxis")
    value = relationship("CustomAxisValue")
    tb_entry = relationship("TBEntry")

# Dynamic Custom Axes Models (for table-based axes system)
class AxisMetadata(Base):
    """Metadata for dynamic custom axes - stores axis definitions and column schemas"""
    __tablename__ = "axes_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Axis details
    axis_name = Column(String(255), nullable=False)  # e.g., "Products", "Departments"
    description = Column(Text, nullable=True)
    table_name = Column(String(255), nullable=False)  # e.g., "axis_products", "axis_departments"
    
    # Column definitions (stored as JSON)
    columns = Column(JSONB, nullable=False)  # Array of column definitions
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    
    # Unique constraint on company_id + axis_name
    __table_args__ = (
        # PostgreSQL unique constraint will be handled by migration
    )

class JournalCategory(Base):
    """Journal Categories for organizing journal entries"""
    __tablename__ = "journal_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    entity_code = Column(String(100), nullable=False, index=True)
    
    # Category details
    category_name = Column(String(255), nullable=False)
    category_code = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    
    # Category type and classification
    category_type = Column(String(100), nullable=False)  # ADJUSTMENT, RECLASSIFICATION, ELIMINATION, etc.
    account_type = Column(String(100))  # ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    
    # Status and workflow
    status = Column(String(50), default="Active")  # Active, Inactive, Archived
    approval_required = Column(Boolean, default=False)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    updated_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    journal_entries = relationship("JournalEntry", back_populates="category", cascade="all, delete-orphan")

class JournalEntry(Base):
    """Individual Journal Entries within categories"""
    __tablename__ = "journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("journal_categories.id"), nullable=False)
    
    # Journal details
    journal_number = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    journal_date = Column(DateTime, nullable=False)
    period = Column(String(2), nullable=False)  # Month (01-12)
    year = Column(Integer, nullable=False)
    
    # Journal type and status
    journal_type = Column(String(100), nullable=False)  # MANUAL, ADJUSTMENT, RECLASSIFICATION, etc.
    status = Column(String(50), default="Draft")  # Draft, Posted, Reversed, Cancelled
    
    # Balance validation
    total_debits = Column(Numeric(15, 2), default=0)
    total_credits = Column(Numeric(15, 2), default=0)
    is_balanced = Column(Boolean, default=False)
    
    # Reference and notes
    reference_number = Column(String(255))  # Invoice number, contract reference, etc.
    notes = Column(Text)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    posted_by = Column(String(100))
    posted_at = Column(DateTime)
    
    # Relationships
    company = relationship("Company")
    category = relationship("JournalCategory", back_populates="journal_entries")
    entries = relationship("JournalEntryLine", back_populates="journal", cascade="all, delete-orphan")

class JournalEntryLine(Base):
    """Individual lines within a journal entry"""
    __tablename__ = "journal_entry_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    journal_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=False)
    
    # Line details
    line_number = Column(Integer, nullable=False)
    entry_type = Column(String(50), nullable=False)  # Debit, Credit
    account_code = Column(String(100), nullable=False)
    account_name = Column(String(255), nullable=False)
    entity_code = Column(String(100), nullable=False)
    entity_name = Column(String(255), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    
    # Additional details
    description = Column(Text)
    reference = Column(String(255))
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    journal = relationship("JournalEntry", back_populates="entries")

class DisclosureChecklist(Base):
    __tablename__ = "disclosure_checklists"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(50), default="pending")  # pending, in-progress, completed
    priority = Column(String(50), default="medium")  # low, medium, high
    due_date = Column(Date, nullable=True)
    assigned_to = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    compliance_framework = Column(String(100), nullable=True)
    risk_level = Column(String(50), default="medium")  # low, medium, high
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="disclosure_checklists")
    checklist_items = relationship("DisclosureChecklistItem", back_populates="checklist", cascade="all, delete-orphan")
    attachments = relationship("DisclosureAttachment", back_populates="checklist", cascade="all, delete-orphan")

class DisclosureChecklistItem(Base):
    __tablename__ = "disclosure_checklist_items"
    
    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("disclosure_checklists.id"), nullable=False)
    item_text = Column(String(500), nullable=False)
    completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    completed_by = Column(String(255), nullable=True)
    order_index = Column(Integer, default=0)
    
    # Relationships
    checklist = relationship("DisclosureChecklist", back_populates="checklist_items")

class DisclosureAttachment(Base):
    __tablename__ = "disclosure_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("disclosure_checklists.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(String(255), nullable=True)
    
    # Relationships
    checklist = relationship("DisclosureChecklist", back_populates="attachments")

# ============================================================================
# SUPPLIER RECONCILIATION MODELS
# ============================================================================

class SupplierReconciliation(Base):
    __tablename__ = "supplier_reconciliations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    supplier_name = Column(String(255), nullable=False)
    supplier_code = Column(String(100), nullable=False)
    reconciliation_period = Column(String(50), nullable=False)  # e.g., "2024-01"
    reconciliation_date = Column(Date, nullable=False)
    status = Column(String(50), default="pending")  # pending, in-progress, completed, disputed
    assigned_to = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Financial totals
    supplier_balance = Column(Numeric(15, 2), default=0)
    our_balance = Column(Numeric(15, 2), default=0)
    difference_amount = Column(Numeric(15, 2), default=0)
    reconciled_amount = Column(Numeric(15, 2), default=0)
    
    # Relationships
    company = relationship("Company", back_populates="supplier_reconciliations")
    reconciliation_items = relationship("SupplierReconciliationItem", back_populates="reconciliation", cascade="all, delete-orphan")
    attachments = relationship("SupplierReconciliationAttachment", back_populates="reconciliation", cascade="all, delete-orphan")

class SupplierReconciliationItem(Base):
    __tablename__ = "supplier_reconciliation_items"
    
    id = Column(Integer, primary_key=True, index=True)
    reconciliation_id = Column(Integer, ForeignKey("supplier_reconciliations.id"), nullable=False)
    item_type = Column(String(50), nullable=False)  # invoice, payment, credit_note, adjustment
    reference_number = Column(String(100), nullable=False)
    item_date = Column(Date, nullable=False)
    description = Column(String(500), nullable=True)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(String(50), default="unmatched")  # unmatched, matched, disputed
    matched_item_id = Column(Integer, nullable=True)  # Reference to matched item
    notes = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    
    # Relationships
    reconciliation = relationship("SupplierReconciliation", back_populates="reconciliation_items")

class SupplierReconciliationAttachment(Base):
    __tablename__ = "supplier_reconciliation_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    reconciliation_id = Column(Integer, ForeignKey("supplier_reconciliations.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(String(255), nullable=True)
    
    # Relationships
    reconciliation = relationship("SupplierReconciliation", back_populates="attachments")

# ============================================================================
# SUPPLIER INVOICES AND PAYMENTS MODELS
# ============================================================================

class SupplierInvoice(Base):
    __tablename__ = "supplier_invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    supplier_name = Column(String(255), nullable=False)
    supplier_code = Column(String(100), nullable=False)
    invoice_number = Column(String(100), nullable=False)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="USD")
    description = Column(Text, nullable=True)
    status = Column(String(50), default="pending")  # pending, paid, disputed, cancelled
    period = Column(String(50), nullable=False)  # e.g., "2024-01"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")

class SupplierPayment(Base):
    __tablename__ = "supplier_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    supplier_name = Column(String(255), nullable=False)
    supplier_code = Column(String(100), nullable=False)
    payment_reference = Column(String(100), nullable=False)
    payment_date = Column(Date, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="USD")
    description = Column(Text, nullable=True)
    status = Column(String(50), default="completed")  # completed, pending, failed, cancelled
    period = Column(String(50), nullable=False)  # e.g., "2024-01"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")

# ============================================================================
# DISPUTES AND AUDIT LOG MODELS
# ============================================================================

class SupplierDispute(Base):
    __tablename__ = "supplier_disputes"
    
    id = Column(Integer, primary_key=True, index=True)
    reconciliation_id = Column(Integer, ForeignKey("supplier_reconciliations.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("supplier_reconciliation_items.id"), nullable=True)
    dispute_type = Column(String(100), nullable=False)  # amount, date, reference, other
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="open")  # open, investigating, resolved, closed
    priority = Column(String(50), default="medium")  # low, medium, high, critical
    assigned_to = Column(String(255), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    created_by = Column(String(255), nullable=True)
    resolved_by = Column(String(255), nullable=True)
    
    # Relationships
    reconciliation = relationship("SupplierReconciliation")
    item = relationship("SupplierReconciliationItem")

class SupplierAuditLog(Base):
    __tablename__ = "supplier_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    reconciliation_id = Column(Integer, ForeignKey("supplier_reconciliations.id"), nullable=False)
    action = Column(String(100), nullable=False)  # created, updated, status_changed, dispute_raised, etc.
    description = Column(Text, nullable=True)
    old_values = Column(Text, nullable=True)  # JSON stored as text
    new_values = Column(Text, nullable=True)  # JSON stored as text
    user_id = Column(String(255), nullable=True)
    user_name = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)
    
    # Relationships
    reconciliation = relationship("SupplierReconciliation")

# ========== AUDIT MODELS ==========

class AuditEngagement(Base):
    __tablename__ = "audit_engagements"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Engagement details
    engagement_name = Column(String(255), nullable=False)
    client_name = Column(String(255), nullable=False)
    engagement_type = Column(String(100), nullable=False)  # External, Internal, Review, etc.
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    
    # Risk assessment
    risk_level = Column(String(50), default="medium")  # low, medium, high, critical
    materiality_threshold = Column(Numeric(15, 2))
    tolerable_misstatement = Column(Numeric(15, 2))
    
    # Team and status
    engagement_partner = Column(String(255))
    engagement_manager = Column(String(255))
    status = Column(String(50), default="planning")  # planning, fieldwork, review, completed
    progress_percentage = Column(Integer, default=0)
    
    # Dates
    planning_start_date = Column(Date)
    fieldwork_start_date = Column(Date)
    review_start_date = Column(Date)
    completion_date = Column(Date)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    workpapers = relationship("AuditWorkpaper", back_populates="engagement")
    findings = relationship("AuditFinding", back_populates="engagement")
    risk_assessments = relationship("AuditRiskAssessment", back_populates="engagement")

class AuditWorkpaper(Base):
    __tablename__ = "audit_workpapers"
    
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("audit_engagements.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Workpaper details
    title = Column(String(255), nullable=False)
    workpaper_number = Column(String(100), unique=True, nullable=False)
    account_code = Column(String(100))
    account_name = Column(String(255))
    assertion = Column(String(100))  # Existence, Completeness, Valuation, etc.
    
    # Risk and materiality
    risk_level = Column(String(50), default="medium")
    materiality = Column(Numeric(15, 2))
    sample_size = Column(Integer)
    
    # Work performed
    work_performed = Column(Text)
    findings = Column(Text)
    conclusions = Column(Text)
    recommendations = Column(Text)
    
    # Status and assignment
    status = Column(String(50), default="not_started")  # not_started, in_progress, completed, review
    priority = Column(String(50), default="medium")  # low, medium, high, critical
    assigned_to = Column(String(255))
    reviewer = Column(String(255))
    
    # Dates
    due_date = Column(Date)
    started_date = Column(Date)
    completed_date = Column(Date)
    reviewed_date = Column(Date)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    engagement = relationship("AuditEngagement", back_populates="workpapers")
    company = relationship("Company")
    documents = relationship("AuditDocument", back_populates="workpaper")

class AuditFinding(Base):
    __tablename__ = "audit_findings"
    
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("audit_engagements.id"), nullable=False)
    workpaper_id = Column(Integer, ForeignKey("audit_workpapers.id"))
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Finding details
    title = Column(String(255), nullable=False)
    category = Column(String(100))  # Revenue, Inventory, Fixed Assets, etc.
    severity = Column(String(50), default="medium")  # low, medium, high, critical
    description = Column(Text, nullable=False)
    impact = Column(Text)
    root_cause = Column(Text)
    recommendation = Column(Text)
    
    # Status and assignment
    status = Column(String(50), default="open")  # open, in_progress, resolved, closed
    assigned_to = Column(String(255))
    due_date = Column(Date)
    resolution_date = Column(Date)
    
    # Financial impact
    potential_misstatement = Column(Numeric(15, 2))
    actual_misstatement = Column(Numeric(15, 2))
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    engagement = relationship("AuditEngagement", back_populates="findings")
    workpaper = relationship("AuditWorkpaper")
    company = relationship("Company")

class AuditRiskAssessment(Base):
    __tablename__ = "audit_risk_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("audit_engagements.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Risk details
    risk_category = Column(String(100), nullable=False)  # Inherent, Control, Detection
    risk_area = Column(String(255), nullable=False)  # Revenue, Inventory, etc.
    risk_description = Column(Text, nullable=False)
    risk_level = Column(String(50), default="medium")  # low, medium, high, critical
    
    # Assessment details
    likelihood = Column(String(50))  # low, medium, high
    impact = Column(String(50))  # low, medium, high
    mitigation_strategy = Column(Text)
    controls_in_place = Column(Text)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    engagement = relationship("AuditEngagement", back_populates="risk_assessments")
    company = relationship("Company")

class AuditDocument(Base):
    __tablename__ = "audit_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    workpaper_id = Column(Integer, ForeignKey("audit_workpapers.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Document details
    title = Column(String(255), nullable=False)
    document_type = Column(String(100))  # Evidence, Confirmation, Analysis, etc.
    file_path = Column(String(500))
    file_size = Column(Integer)
    mime_type = Column(String(100))
    
    # Content
    description = Column(Text)
    content = Column(Text)  # For text-based documents
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    workpaper = relationship("AuditWorkpaper", back_populates="documents")
    company = relationship("Company")

class AuditSchedule(Base):
    __tablename__ = "audit_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("audit_engagements.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Schedule details
    task_name = Column(String(255), nullable=False)
    task_type = Column(String(100))  # Planning, Fieldwork, Review, Reporting
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Progress and status
    status = Column(String(50), default="not_started")  # not_started, in_progress, completed
    progress_percentage = Column(Integer, default=0)
    
    # Assignment
    assigned_to = Column(String(255))
    dependencies = Column(JSON)  # Array of task IDs this task depends on
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    engagement = relationship("AuditEngagement")
    company = relationship("Company")

class AuditConfirmation(Base):
    __tablename__ = "audit_confirmations"
    
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("audit_engagements.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Confirmation details
    confirmation_type = Column(String(100), nullable=False)  # Bank, Customer, Vendor, etc.
    third_party_name = Column(String(255), nullable=False)
    third_party_address = Column(Text)
    account_balance = Column(Numeric(15, 2))
    
    # Status and dates
    status = Column(String(50), default="pending")  # pending, sent, received, reconciled
    sent_date = Column(Date)
    due_date = Column(Date)
    received_date = Column(Date)
    
    # Response details
    response_received = Column(Boolean, default=False)
    response_amount = Column(Numeric(15, 2))
    response_differences = Column(Text)
    reconciliation_notes = Column(Text)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    engagement = relationship("AuditEngagement")
    company = relationship("Company")

class AuditSampling(Base):
    __tablename__ = "audit_sampling"
    
    id = Column(Integer, primary_key=True, index=True)
    workpaper_id = Column(Integer, ForeignKey("audit_workpapers.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Sampling details
    sampling_method = Column(String(100), nullable=False)  # Statistical, Non-statistical, Haphazard
    population_size = Column(Integer, nullable=False)
    sample_size = Column(Integer, nullable=False)
    confidence_level = Column(Integer, default=95)
    tolerable_deviation_rate = Column(Numeric(5, 2))
    
    # Selection criteria
    selection_criteria = Column(Text)
    stratification_criteria = Column(Text)
    
    # Results
    exceptions_found = Column(Integer, default=0)
    deviation_rate = Column(Numeric(5, 2))
    upper_deviation_limit = Column(Numeric(5, 2))
    conclusion = Column(Text)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    workpaper = relationship("AuditWorkpaper")
    company = relationship("Company")

class AuditTimeTracking(Base):
    __tablename__ = "audit_time_tracking"
    
    id = Column(Integer, primary_key=True, index=True)
    engagement_id = Column(Integer, ForeignKey("audit_engagements.id"), nullable=False)
    workpaper_id = Column(Integer, ForeignKey("audit_workpapers.id"))
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Time tracking details
    user_name = Column(String(255), nullable=False)
    activity_description = Column(Text, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    hours_spent = Column(Numeric(5, 2))
    
    # Budget comparison
    budgeted_hours = Column(Numeric(5, 2))
    variance = Column(Numeric(5, 2))
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    engagement = relationship("AuditEngagement")
    workpaper = relationship("AuditWorkpaper")
    company = relationship("Company")

class AuditIndependence(Base):
    __tablename__ = "audit_independence"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Independence details
    staff_member = Column(String(255), nullable=False)
    relationship_type = Column(String(100))  # Financial, Business, Family, etc.
    relationship_description = Column(Text)
    client_name = Column(String(255))
    
    # Assessment
    independence_status = Column(String(50), default="compliant")  # compliant, non_compliant, requires_review
    risk_level = Column(String(50), default="low")  # low, medium, high
    mitigation_measures = Column(Text)
    
    # Dates
    disclosure_date = Column(Date, nullable=False)
    review_date = Column(Date)
    resolution_date = Column(Date)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")

# ========== WORKFLOW MODELS ==========

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Workflow details
    name = Column(String(255), nullable=False)
    description = Column(Text)
    workflow_type = Column(String(100), nullable=False)  # Monthly Close, Budget Planning, etc.
    status = Column(String(50), default="draft")  # draft, active, paused, completed, archived
    
    # Workflow configuration
    workflow_data = Column(JSONB)  # Store the complete workflow structure as JSON
    template_id = Column(Integer, ForeignKey("workflow_templates.id"), nullable=True)
    
    # Assignment and approval
    assigned_to = Column(String(255))  # User or team assigned
    approvers = Column(JSONB)  # Array of approver IDs
    current_step = Column(Integer, default=1)
    total_steps = Column(Integer, default=1)
    
    # Dates and progress
    start_date = Column(Date)
    due_date = Column(Date)
    completed_date = Column(Date)
    progress_percentage = Column(Integer, default=0)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    last_updated_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    template = relationship("WorkflowTemplate")
    steps = relationship("WorkflowStep", back_populates="workflow", cascade="all, delete-orphan")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowTemplate(Base):
    __tablename__ = "workflow_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Template details
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))  # Finance, Audit, Compliance, etc.
    template_type = Column(String(100))  # Monthly Close, Budget Planning, etc.
    
    # Template configuration
    workflow_structure = Column(JSONB)  # Store the template workflow structure
    default_assignees = Column(JSONB)  # Default user assignments
    default_duration = Column(Integer)  # Default duration in days
    
    # Status and usage
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    workflows = relationship("Workflow", back_populates="template")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    
    # Step details
    step_number = Column(Integer, nullable=False)
    step_name = Column(String(255), nullable=False)
    step_type = Column(String(100), nullable=False)  # task, approval, notification, decision, integration, document, calculation, validation
    
    # Step configuration
    step_config = Column(JSONB)  # Store step-specific configuration
    integration_tab = Column(String(100))  # Which tab this step integrates with
    integration_action = Column(String(100))  # What action to perform
    
    # Assignment and dependencies
    assigned_to = Column(String(255))
    dependencies = Column(JSONB)  # Array of step IDs this step depends on
    estimated_duration = Column(Integer)  # Duration in hours
    
    # Status and progress
    status = Column(String(50), default="pending")  # pending, in_progress, completed, skipped, failed
    start_date = Column(DateTime)
    completed_date = Column(DateTime)
    actual_duration = Column(Integer)  # Actual duration in hours
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workflow = relationship("Workflow", back_populates="steps")
    executions = relationship("WorkflowStepExecution", back_populates="step", cascade="all, delete-orphan")

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    
    # Execution details
    execution_name = Column(String(255), nullable=False)
    execution_type = Column(String(100))  # manual, scheduled, triggered
    trigger_source = Column(String(100))  # user, system, integration
    
    # Status and progress
    status = Column(String(50), default="running")  # running, completed, failed, paused
    current_step = Column(Integer, default=1)
    progress_percentage = Column(Integer, default=0)
    
    # Dates
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Results and errors
    result_data = Column(JSONB)  # Store execution results
    error_log = Column(Text)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    workflow = relationship("Workflow", back_populates="executions")
    step_executions = relationship("WorkflowStepExecution", back_populates="execution", cascade="all, delete-orphan")

class WorkflowStepExecution(Base):
    __tablename__ = "workflow_step_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("workflow_executions.id"), nullable=False)
    step_id = Column(Integer, ForeignKey("workflow_steps.id"), nullable=False)
    
    # Execution details
    status = Column(String(50), default="pending")  # pending, running, completed, failed, skipped
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    duration = Column(Integer)  # Duration in seconds
    
    # Results and data
    input_data = Column(JSONB)  # Input data for the step
    output_data = Column(JSONB)  # Output data from the step
    error_message = Column(Text)
    
    # Assignment
    assigned_to = Column(String(255))
    completed_by = Column(String(255))
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    execution = relationship("WorkflowExecution", back_populates="step_executions")
    step = relationship("WorkflowStep", back_populates="executions")

class WorkflowNotification(Base):
    __tablename__ = "workflow_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    step_id = Column(Integer, ForeignKey("workflow_steps.id"), nullable=True)
    
    # Notification details
    notification_type = Column(String(100), nullable=False)  # reminder, approval, completion, error
    title = Column(String(255), nullable=False)
    message = Column(Text)
    
    # Recipients
    recipients = Column(JSONB)  # Array of user IDs or email addresses
    sent_to = Column(JSONB)  # Array of users who received the notification
    
    # Status and delivery
    status = Column(String(50), default="pending")  # pending, sent, delivered, read, failed
    delivery_method = Column(String(100))  # email, in_app, sms
    
    # Dates
    scheduled_at = Column(DateTime)
    sent_at = Column(DateTime)
    read_at = Column(DateTime)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    workflow = relationship("Workflow")
    step = relationship("WorkflowStep")

# Business Valuation & Impairment Models
class Valuation(Base):
    __tablename__ = "valuations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)  # Link to specific entity
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)    # Link to specific asset
    
    # Valuation details
    valuation_type = Column(String(100), nullable=False)  # DCF, Comparables, Transaction, Asset-based
    valuation_date = Column(Date, nullable=False)
    analyst = Column(String(255), nullable=False)
    method = Column(String(255), nullable=False)
    summary = Column(Text)
    
    # Financial inputs
    base_value = Column(Numeric(15, 2))
    currency = Column(String(10), default="USD")
    
    # Status and approval
    status = Column(String(50), default="draft")  # draft, in_review, approved, rejected
    approved_by = Column(String(255))
    approved_at = Column(DateTime)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(255))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    entity = relationship("Entity")
    asset = relationship("Asset")
    dcf_details = relationship("DCFDetails", back_populates="valuation", cascade="all, delete-orphan")
    comparables = relationship("Comparable", back_populates="valuation", cascade="all, delete-orphan")
    impairment_tests = relationship("ImpairmentTest", back_populates="valuation", cascade="all, delete-orphan")

class DCFDetails(Base):
    __tablename__ = "dcf_details"
    
    id = Column(Integer, primary_key=True, index=True)
    valuation_id = Column(Integer, ForeignKey("valuations.id"), nullable=False)
    
    # Cash flow projections (stored as JSON for flexibility)
    cash_flows = Column(JSONB, nullable=False)  # Array of yearly cash flows
    projection_years = Column(Integer, default=5)
    
    # Discount rate inputs
    discount_rate = Column(Numeric(5, 4), nullable=False)  # e.g., 0.1250 for 12.5%
    risk_free_rate = Column(Numeric(5, 4))
    equity_risk_premium = Column(Numeric(5, 4))
    beta = Column(Numeric(5, 4))
    
    # Terminal value
    terminal_growth_rate = Column(Numeric(5, 4), default=0.02)  # 2% default
    terminal_value = Column(Numeric(15, 2))
    
    # Results
    present_value_cash_flows = Column(Numeric(15, 2))
    present_value_terminal = Column(Numeric(15, 2))
    total_enterprise_value = Column(Numeric(15, 2))
    
    # Assumptions and notes
    assumptions = Column(Text)
    notes = Column(Text)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    valuation = relationship("Valuation", back_populates="dcf_details")

class Comparable(Base):
    __tablename__ = "comparables"
    
    id = Column(Integer, primary_key=True, index=True)
    valuation_id = Column(Integer, ForeignKey("valuations.id"), nullable=False)
    
    # Peer company details
    peer_company = Column(String(255), nullable=False)
    industry = Column(String(255))
    market_cap = Column(Numeric(15, 2))
    
    # Financial metrics
    metric_type = Column(String(100), nullable=False)  # P/E, EV/EBITDA, P/B, etc.
    metric_value = Column(Numeric(10, 4))
    revenue = Column(Numeric(15, 2))
    ebitda = Column(Numeric(15, 2))
    net_income = Column(Numeric(15, 2))
    
    # Analysis
    analyst_comments = Column(Text)
    weight = Column(Numeric(3, 2), default=1.0)  # Weight in analysis
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    valuation = relationship("Valuation", back_populates="comparables")

class ImpairmentTest(Base):
    __tablename__ = "impairment_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    valuation_id = Column(Integer, ForeignKey("valuations.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    
    # Test details
    test_date = Column(Date, nullable=False)
    test_type = Column(String(100), nullable=False)  # Annual, Trigger-based, Reversal
    
    # Financial amounts
    carrying_amount = Column(Numeric(15, 2), nullable=False)
    recoverable_amount = Column(Numeric(15, 2))
    fair_value = Column(Numeric(15, 2))
    value_in_use = Column(Numeric(15, 2))
    
    # Results
    impairment_loss = Column(Numeric(15, 2))
    result = Column(String(50))  # impaired, not_impaired, reversal
    
    # Analysis
    discount_rate_used = Column(Numeric(5, 4))
    growth_rate_assumed = Column(Numeric(5, 4))
    cash_flow_projections = Column(JSONB)
    
    # Notes and documentation
    notes = Column(Text)
    supporting_documents = Column(Text)
    
    # Status
    status = Column(String(50), default="draft")  # draft, reviewed, approved
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(255))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    valuation = relationship("Valuation", back_populates="impairment_tests")
    asset = relationship("Asset")

# Enhanced Asset model for Asset Management
class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    
    # Asset Management specific fields
    asset_id = Column(String(100), nullable=False, unique=True)  # AT-2025-0001
    serial_number = Column(String(100))
    brand = Column(String(100))
    model = Column(String(100))
    condition = Column(String(50), default="good")  # excellent, good, fair, poor
    
    # Asset details
    asset_name = Column(String(255), nullable=False)
    asset_type = Column(String(100))  # laptop, desktop, server, etc.
    asset_category = Column(String(100))  # Property, Equipment, Goodwill, etc.
    
    # Location and ownership
    location_id = Column(Integer, ForeignKey("asset_locations.id"))
    owner_id = Column(Integer, ForeignKey("asset_users.id"))
    
    # Financial details
    acquisition_cost = Column(Numeric(15, 2))
    current_book_value = Column(Numeric(15, 2))
    accumulated_depreciation = Column(Numeric(15, 2))
    purchase_price = Column(Numeric(12, 2))
    currency = Column(String(3), default="USD")
    depreciation_method = Column(String(50))
    useful_life = Column(Integer)  # in years
    salvage_value = Column(Numeric(12, 2))
    current_value = Column(Numeric(12, 2))
    
    # Dates
    acquisition_date = Column(Date)
    purchase_date = Column(Date)
    warranty_expiration = Column(Date)
    last_maintenance = Column(Date)
    retirement_date = Column(Date)
    
    # Technical specifications
    technical_specs = Column(JSONB)  # All technical details
    
    # Additional fields
    description = Column(Text)
    notes = Column(Text)
    is_critical = Column(Boolean, default=False)
    requires_special_handling = Column(Boolean, default=False)
    include_in_audit = Column(Boolean, default=True)
    barcode = Column(String(100))
    qr_code = Column(String(100))
    
    # Status
    status = Column(String(50), default="active")  # active, spare, repair, retired, disposed, impaired
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    updated_by = Column(String(100))
    
    # Relationships
    company = relationship("Company", back_populates="assets")
    entity = relationship("Entity")
    impairment_tests = relationship("ImpairmentTest", back_populates="asset")
    location = relationship("AssetLocation")
    owner = relationship("AssetUser")
    technical_specs = relationship("AssetTechnicalSpecs", back_populates="asset")
    financial_details = relationship("AssetFinancialDetails", back_populates="asset")
    location_history = relationship("AssetLocationHistory", back_populates="asset")
    maintenance_records = relationship("AssetMaintenanceRecord", back_populates="asset")
    ownership_history = relationship("AssetOwnershipHistory", back_populates="asset")
    status_history = relationship("AssetStatusHistory", back_populates="asset")

# ================= ASSET MANAGEMENT EXTENDED MODELS =================
class AssetFinancialDetails(Base):
    __tablename__ = "asset_financial_details"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    purchase_price = Column(Numeric(15,2))
    currency = Column(String(10))
    useful_life_years = Column(Integer)
    depreciation_method = Column(String(50))
    salvage_value = Column(Numeric(15,2))
    current_value = Column(Numeric(15,2))
    depreciation_rate = Column(Numeric(5,2))
    notes = Column(Text)

    asset = relationship("Asset", back_populates="financial_details")

class AssetTechnicalSpecs(Base):
    __tablename__ = "asset_technical_specs"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    processor = Column(String(255))
    ram = Column(String(50))
    storage = Column(String(50))
    os = Column(String(50))
    model = Column(String(100))
    manufacturer = Column(String(100))
    warranty_expiry = Column(Date)
    additional_specs = Column(JSONB)

    asset = relationship("Asset", back_populates="technical_specs")

class AssetLocationHistory(Base):
    __tablename__ = "asset_location_history"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    location = Column(String(255))
    room = Column(String(100))
    coordinates = Column(JSONB)
    moved_by = Column(String(100))
    moved_date = Column(DateTime)
    reason = Column(Text)
    is_current = Column(Boolean, default=False)

    asset = relationship("Asset", back_populates="location_history")

class AssetMaintenanceRecord(Base):
    __tablename__ = "asset_maintenance_records"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    type = Column(String(50))
    description = Column(Text)
    performed_by = Column(String(100))
    cost = Column(Numeric(15,2))
    scheduled_date = Column(Date)
    completed_date = Column(Date)
    status = Column(String(50))
    notes = Column(Text)
    attachments = Column(JSONB)

    asset = relationship("Asset", back_populates="maintenance_records")

class AssetOwnershipHistory(Base):
    __tablename__ = "asset_ownership_history"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    owner_name = Column(String(100))
    owner_email = Column(String(100))
    department = Column(String(100))
    employee_id = Column(String(50))
    assigned_date = Column(DateTime)
    assigned_by = Column(String(100))
    reason = Column(Text)
    unassigned_date = Column(DateTime)
    is_current = Column(Boolean, default=False)

    asset = relationship("Asset", back_populates="ownership_history")

class AssetStatusHistory(Base):
    __tablename__ = "asset_status_history"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    status = Column(String(50))
    reason = Column(String(100))
    notes = Column(Text)
    scheduled_date = Column(Date)
    changed_by = Column(String(100))
    changed_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset", back_populates="status_history")

class FinancialStatement(Base):
    __tablename__ = "financial_statements"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    fst_template_id = Column(Integer, ForeignKey("fst_templates.id"), nullable=True)
    
    # Statement details
    period = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    # Handle both PostgreSQL (with ARRAY) and SQLite (with JSON) for entity_codes
    if 'postgresql' in os.getenv('DATABASE_URL', '').lower():
        entity_codes = Column(ARRAY(String(100)), nullable=True)
    else:
        entity_codes = Column(JSON, nullable=True)
    presentation_currency = Column(String(10), nullable=False, default='USD')
    
    # Content
    statement_data = Column(JSONB, nullable=False)  # Store the complete statement as JSON
    summary_data = Column(JSONB, nullable=True)  # Store key metrics and summaries
    fx_rates_used = Column(JSONB, nullable=True)  # Store FX rates used for conversion
    generation_metadata = Column(JSONB, nullable=True)  # Store generation process metadata
    
    # Status
    status = Column(String(50), default="Generated")  # Generated, Final, Published
    version = Column(String(20), default="1.0")
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    
    # Relationships
    company = relationship("Company")
    fst_template = relationship("FSTTemplate")

class GeneratedFS(Base):
    """Simple table to store generated financial statement data"""
    __tablename__ = "generated_fs"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("fst_templates.id"), nullable=False)
    
    # Statement details
    period = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    # Handle both PostgreSQL (with ARRAY) and SQLite (with JSON) for entity_codes
    if 'postgresql' in os.getenv('DATABASE_URL', '').lower():
        entity_codes = Column(ARRAY(String(100)), nullable=True)
    else:
        entity_codes = Column(JSON, nullable=True)
    presentation_currency = Column(String(10), nullable=False, default='USD')
    
    # Line items data
    line_name = Column(String(255), nullable=False)
    account_code = Column(String(100), nullable=True)
    line_type = Column(String(50), nullable=False)  # 'element', 'formula', 'total'
    display_order = Column(Integer, nullable=False)
    
    # Amounts by entity
    amounts = Column(JSONB, nullable=False)  # {"FinFusionGroup": 1000, "FinFusionProducts": 500, "Total": 1500}
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    template = relationship("FSTTemplate")

# =============================================================================
# ADDITIONAL ASSET MANAGEMENT TABLES
# =============================================================================

class AssetCategory(Base):
    """Asset categories for classification"""
    __tablename__ = "asset_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("asset_categories.id"))
    is_active = Column(Boolean, default=True)
    custom_fields = Column(JSONB)  # Custom field definitions
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="asset_categories")
    parent = relationship("AssetCategory", remote_side=[id])
    children = relationship("AssetCategory", back_populates="parent")

class AssetLocation(Base):
    """Physical locations for assets"""
    __tablename__ = "asset_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    building = Column(String(100))
    floor = Column(String(50))
    room = Column(String(50))
    address = Column(Text)
    coordinates = Column(JSONB)  # {"lat": 0, "lng": 0}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="asset_locations")

class AssetUser(Base):
    """Asset users/owners"""
    __tablename__ = "asset_users"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    employee_id = Column(String(50))
    department = Column(String(100))
    role = Column(String(100))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="asset_users")

class AssetMaintenance(Base):
    """Asset maintenance records"""
    __tablename__ = "asset_maintenance"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    maintenance_type = Column(String(50), nullable=False)  # preventive, corrective, upgrade
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="scheduled")  # scheduled, in_progress, completed, cancelled
    
    # Dates
    scheduled_date = Column(Date)
    start_date = Column(DateTime)
    completion_date = Column(DateTime)
    next_due_date = Column(Date)
    
    # Financial
    cost = Column(Numeric(12, 2))
    currency = Column(String(3), default="USD")
    vendor = Column(String(100))
    invoice_number = Column(String(100))
    
    # Technical details
    parts_used = Column(JSONB)  # List of parts and quantities
    technician = Column(String(100))
    notes = Column(Text)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company", back_populates="asset_maintenance")
    asset = relationship("Asset")

class AssetAudit(Base):
    """Asset audit records"""
    __tablename__ = "asset_audits"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    audit_type = Column(String(50), nullable=False)  # quarterly, annual, spot_check
    audit_date = Column(Date, nullable=False)
    auditor = Column(String(100), nullable=False)
    status = Column(String(50), default="pending")  # pending, in_progress, completed, failed
    
    # Audit results
    physical_location = Column(String(255))
    condition_verified = Column(String(50))
    status_verified = Column(String(50))
    discrepancies = Column(JSONB)  # List of discrepancies found
    notes = Column(Text)
    
    # Compliance
    is_compliant = Column(Boolean)
    compliance_notes = Column(Text)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="asset_audits")
    asset = relationship("Asset")

class WarrantyRecord(Base):
    """Warranty information for assets"""
    __tablename__ = "warranty_records"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    warranty_type = Column(String(50), nullable=False)  # manufacturer, extended, service
    vendor = Column(String(100), nullable=False)
    warranty_number = Column(String(100))
    
    # Dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    registration_date = Column(Date)
    
    # Financial
    cost = Column(Numeric(12, 2))
    currency = Column(String(3), default="USD")
    coverage_details = Column(Text)
    
    # Contact information
    vendor_contact = Column(JSONB)  # Contact details
    support_number = Column(String(50))
    support_email = Column(String(255))
    
    # Status
    status = Column(String(50), default="active")  # active, expired, voided
    is_transferable = Column(Boolean, default=False)
    requires_registration = Column(Boolean, default=False)
    
    # Additional
    terms_conditions = Column(Text)
    notes = Column(Text)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="warranty_records")
    asset = relationship("Asset")

class SystemSetting(Base):
    """System configuration settings"""
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    setting_category = Column(String(100), nullable=False)  # general, audit, notifications, integrations
    setting_key = Column(String(100), nullable=False)
    setting_value = Column(JSONB)
    setting_type = Column(String(50), default="string")  # string, number, boolean, json
    description = Column(Text)
    is_encrypted = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String(100))
    
    # Relationships
    company = relationship("Company", back_populates="system_settings")

class NotificationRule(Base):
    """Notification rules for asset management"""
    __tablename__ = "notification_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    event_type = Column(String(100), nullable=False)  # warranty_expiry, maintenance_due, audit_due
    trigger_conditions = Column(JSONB)  # Conditions that trigger the notification
    notification_methods = Column(JSONB)  # email, sms, in_app
    recipients = Column(JSONB)  # List of recipients
    is_active = Column(Boolean, default=True)
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    
    # Timing
    advance_days = Column(Integer, default=30)  # How many days in advance to notify
    repeat_interval = Column(Integer)  # Days between repeat notifications
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")

class Integration(Base):
    """External system integrations"""
    __tablename__ = "integrations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)  # procurement, vendor, financial, hr
    status = Column(String(50), default="inactive")  # active, inactive, error, testing
    
    # Connection details
    endpoint_url = Column(String(500))
    api_key = Column(String(500))  # Encrypted
    credentials = Column(JSONB)  # Encrypted credentials
    configuration = Column(JSONB)  # Integration-specific settings
    
    # Sync settings
    sync_frequency = Column(String(50), default="daily")  # real_time, hourly, daily, weekly
    last_sync = Column(DateTime)
    next_sync = Column(DateTime)
    sync_status = Column(String(50))
    sync_errors = Column(JSONB)  # List of recent sync errors
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")

class AuditTemplate(Base):
    """Audit templates for different audit types"""
    __tablename__ = "audit_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    audit_type = Column(String(100), nullable=False)  # quarterly, annual, spot_check
    template_data = Column(JSONB)  # Template structure and questions
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")

class UserSession(Base):
    """User session tracking"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(500), nullable=False, unique=True)
    device_info = Column(JSONB)  # Device and browser information
    ip_address = Column(String(45))
    user_agent = Column(Text)
    login_time = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    logout_time = Column(DateTime)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    company = relationship("Company")
    user = relationship("User")

class AssetAnalytics(Base):
    """Asset analytics and reporting data"""
    __tablename__ = "asset_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    report_type = Column(String(100), nullable=False)  # dashboard, distribution, age_analysis, warranty
    report_data = Column(JSONB, nullable=False)  # Cached report data
    filters_applied = Column(JSONB)  # Filters used for this report
    generated_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)  # When this cached data expires
    
    # Relationships
    company = relationship("Company")

# ===== COMPLIANCE MANAGEMENT TABLES =====
class ComplianceFramework(Base):
    """Compliance frameworks like IFRS, GDPR, SOX, etc."""
    __tablename__ = "compliance_frameworks"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(100), nullable=False)  # IFRS, GDPR, SOX, etc.
    version = Column(String(50))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    controls = relationship("ComplianceControl", back_populates="framework")
    policies = relationship("CompliancePolicy", back_populates="framework")

class ComplianceControl(Base):
    """Individual compliance controls within frameworks"""
    __tablename__ = "compliance_controls"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    framework_id = Column(Integer, ForeignKey("compliance_frameworks.id"), nullable=False)
    control_id = Column(String(50), nullable=False)  # e.g., "IFRS-001", "GDPR-ART-5"
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))  # Financial, Operational, IT, etc.
    risk_level = Column(String(20))  # Low, Medium, High, Critical
    status = Column(String(20), default="active")  # active, inactive, deprecated
    owner = Column(String(100))  # Responsible person/team
    frequency = Column(String(50))  # Daily, Weekly, Monthly, Quarterly, Annually
    last_reviewed = Column(DateTime)
    next_review = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    framework = relationship("ComplianceFramework", back_populates="controls")
    assessments = relationship("ComplianceAssessment", back_populates="control")

class CompliancePolicy(Base):
    """Compliance policies and procedures"""
    __tablename__ = "compliance_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    framework_id = Column(Integer, ForeignKey("compliance_frameworks.id"), nullable=False)
    policy_id = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    content = Column(Text)  # Full policy content
    version = Column(String(20), default="1.0")
    status = Column(String(20), default="draft")  # draft, active, archived
    effective_date = Column(DateTime)
    expiry_date = Column(DateTime)
    owner = Column(String(100))
    approver = Column(String(100))
    approved_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    framework = relationship("ComplianceFramework", back_populates="policies")

class ComplianceAssessment(Base):
    """Compliance assessments and testing results"""
    __tablename__ = "compliance_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    control_id = Column(Integer, ForeignKey("compliance_controls.id"), nullable=False)
    assessment_type = Column(String(50))  # Self-assessment, Internal Audit, External Audit
    assessor = Column(String(100))
    assessment_date = Column(DateTime, default=datetime.utcnow)
    result = Column(String(20))  # Pass, Fail, Partial, N/A
    score = Column(Integer)  # 0-100
    findings = Column(Text)
    recommendations = Column(Text)
    remediation_plan = Column(Text)
    due_date = Column(DateTime)
    status = Column(String(20), default="open")  # open, in_progress, completed, closed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    control = relationship("ComplianceControl", back_populates="assessments")

# ===== ESG MANAGEMENT TABLES =====
class ESGIndicator(Base):
    """ESG indicators and metrics"""
    __tablename__ = "esg_indicators"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    indicator_code = Column(String(50), nullable=False)  # e.g., "EN-1", "SO-5", "G-1"
    name = Column(String(255), nullable=False)
    category = Column(String(50))  # Environmental, Social, Governance
    subcategory = Column(String(100))
    description = Column(Text)
    unit = Column(String(50))  # kg, %, $, etc.
    data_type = Column(String(20))  # numeric, percentage, text, boolean
    is_mandatory = Column(Boolean, default=False)
    reporting_frequency = Column(String(20))  # Annual, Quarterly, Monthly
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    data_points = relationship("ESGDataPoint", back_populates="indicator")

class ESGDataPoint(Base):
    """ESG data collection points"""
    __tablename__ = "esg_data_points"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("esg_indicators.id"), nullable=False)
    reporting_period = Column(String(20))  # 2024, Q1-2024, etc.
    value = Column(Numeric(15, 4))
    text_value = Column(Text)
    data_source = Column(String(255))
    collection_date = Column(DateTime, default=datetime.utcnow)
    verified = Column(Boolean, default=False)
    verified_by = Column(String(100))
    verified_date = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    indicator = relationship("ESGIndicator", back_populates="data_points")

class ESGMaterialityMatrix(Base):
    """ESG materiality matrix for stakeholder importance vs business impact"""
    __tablename__ = "esg_materiality_matrix"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("esg_indicators.id"), nullable=False)
    stakeholder_importance = Column(Integer)  # 1-5 scale
    business_impact = Column(Integer)  # 1-5 scale
    materiality_level = Column(String(20))  # High, Medium, Low
    last_updated = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    indicator = relationship("ESGIndicator")

# ===== PROJECT MANAGEMENT TABLES =====
class Project(Base):
    """Project information and details"""
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    project_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    project_type = Column(String(50))  # Internal, Client, R&D, etc.
    status = Column(String(20), default="planning")  # planning, active, on_hold, completed, cancelled
    priority = Column(String(20))  # Low, Medium, High, Critical
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    budget = Column(Numeric(15, 2))
    actual_cost = Column(Numeric(15, 2), default=0)
    progress = Column(Integer, default=0)  # 0-100
    project_manager = Column(String(100))
    sponsor = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    tasks = relationship("ProjectTask", back_populates="project")
    milestones = relationship("ProjectMilestone", back_populates="project")

class ProjectTask(Base):
    """Project tasks and activities"""
    __tablename__ = "project_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    task_code = Column(String(50))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="not_started")  # not_started, in_progress, completed, blocked
    priority = Column(String(20))  # Low, Medium, High
    assignee = Column(String(100))
    start_date = Column(DateTime)
    due_date = Column(DateTime)
    completed_date = Column(DateTime)
    estimated_hours = Column(Numeric(8, 2))
    actual_hours = Column(Numeric(8, 2), default=0)
    progress = Column(Integer, default=0)  # 0-100
    dependencies = Column(JSONB)  # Array of task IDs this task depends on
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    project = relationship("Project", back_populates="tasks")

class ProjectMilestone(Base):
    """Project milestones and key deliverables"""
    __tablename__ = "project_milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    target_date = Column(DateTime)
    actual_date = Column(DateTime)
    status = Column(String(20), default="pending")  # pending, achieved, missed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    project = relationship("Project", back_populates="milestones")

# ===== PURCHASE ORDER MANAGEMENT TABLES =====
class PurchaseOrder(Base):
    """Purchase orders and procurement"""
    __tablename__ = "purchase_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    po_number = Column(String(50), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    requester = Column(String(100))
    department = Column(String(100))
    status = Column(String(20), default="draft")  # draft, pending_approval, approved, sent, received, cancelled
    priority = Column(String(20))  # Low, Medium, High, Urgent
    order_date = Column(DateTime, default=datetime.utcnow)
    required_date = Column(DateTime)
    total_amount = Column(Numeric(15, 2))
    currency = Column(String(3), default="USD")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order")

class PurchaseOrderItem(Base):
    """Individual items in purchase orders"""
    __tablename__ = "purchase_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    item_code = Column(String(50))
    description = Column(String(255), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(15, 2), nullable=False)
    unit = Column(String(20))  # pcs, kg, m, etc.
    received_quantity = Column(Numeric(10, 2), default=0)
    status = Column(String(20), default="pending")  # pending, partially_received, received
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    purchase_order = relationship("PurchaseOrder", back_populates="items")

class Supplier(Base):
    """Supplier information"""
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    supplier_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    contact_person = Column(String(100))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    tax_id = Column(String(50))
    payment_terms = Column(String(100))
    currency = Column(String(3), default="USD")
    status = Column(String(20), default="active")  # active, inactive, suspended
    rating = Column(Integer)  # 1-5 rating
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")

# ===== REVENUE ANALYTICS TABLES =====
class RevenueStream(Base):
    """Revenue streams and sources"""
    __tablename__ = "revenue_streams"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    stream_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))  # Product Sales, Services, Subscriptions, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    transactions = relationship("RevenueTransaction", back_populates="stream")

class RevenueTransaction(Base):
    """Individual revenue transactions"""
    __tablename__ = "revenue_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    stream_id = Column(Integer, ForeignKey("revenue_streams.id"), nullable=False)
    transaction_id = Column(String(50), nullable=False)
    customer = Column(String(255))
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="USD")
    transaction_date = Column(DateTime, nullable=False)
    period = Column(String(20))  # 2024, Q1-2024, 2024-01, etc.
    status = Column(String(20), default="confirmed")  # pending, confirmed, cancelled
    payment_method = Column(String(50))
    region = Column(String(100))
    sales_rep = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    stream = relationship("RevenueStream", back_populates="transactions")

class SalesPipeline(Base):
    """Sales pipeline and opportunities"""
    __tablename__ = "sales_pipeline"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    opportunity_id = Column(String(50), nullable=False)
    customer = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    stage = Column(String(50))  # Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
    probability = Column(Integer)  # 0-100
    estimated_value = Column(Numeric(15, 2))
    currency = Column(String(3), default="USD")
    expected_close_date = Column(DateTime)
    actual_close_date = Column(DateTime)
    sales_rep = Column(String(100))
    source = Column(String(100))  # Website, Referral, Cold Call, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")

# ===== ROLE MANAGEMENT TABLES =====
class Role(Base):
    """User roles and permissions"""
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    role_code = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_system_role = Column(Boolean, default=False)  # System-defined vs custom
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    permissions = relationship("RolePermission", back_populates="role")
    user_roles = relationship("UserRole", back_populates="role")

class Permission(Base):
    """System permissions and access rights"""
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    permission_code = Column(String(100), nullable=False)  # e.g., "asset.create", "user.read"
    name = Column(String(255), nullable=False)
    description = Column(Text)
    module = Column(String(50))  # Asset Management, Compliance, etc.
    action = Column(String(50))  # create, read, update, delete, approve
    resource = Column(String(50))  # asset, user, report, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    role_permissions = relationship("RolePermission", back_populates="permission")

class RolePermission(Base):
    """Many-to-many relationship between roles and permissions"""
    __tablename__ = "role_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False)
    granted = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    granted_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="role_permissions")

class UserRole(Base):
    """User role assignments"""
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by = Column(String(100))
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime)
    
    # Relationships
    company = relationship("Company")
    user = relationship("User")
    role = relationship("Role", back_populates="user_roles")

# ===== STAKEHOLDER MANAGEMENT TABLES =====
class Stakeholder(Base):
    """Stakeholder information"""
    __tablename__ = "stakeholders"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    stakeholder_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50))  # Customer, Supplier, Investor, Employee, Community, etc.
    category = Column(String(100))  # Primary, Secondary, Internal, External
    contact_person = Column(String(100))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    website = Column(String(255))
    industry = Column(String(100))
    size = Column(String(50))  # Small, Medium, Large, Enterprise
    influence_level = Column(String(20))  # Low, Medium, High, Critical
    interest_level = Column(String(20))  # Low, Medium, High, Critical
    status = Column(String(20), default="active")  # active, inactive, dormant
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    interactions = relationship("StakeholderInteraction", back_populates="stakeholder")
    feedback = relationship("StakeholderFeedback", back_populates="stakeholder")

class StakeholderInteraction(Base):
    """Stakeholder interactions and communications"""
    __tablename__ = "stakeholder_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    stakeholder_id = Column(Integer, ForeignKey("stakeholders.id"), nullable=False)
    interaction_type = Column(String(50))  # Meeting, Call, Email, Survey, Event
    subject = Column(String(255))
    description = Column(Text)
    interaction_date = Column(DateTime, default=datetime.utcnow)
    duration_minutes = Column(Integer)
    participants = Column(JSONB)  # Array of participant names
    outcome = Column(Text)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    stakeholder = relationship("Stakeholder", back_populates="interactions")

class StakeholderFeedback(Base):
    """Stakeholder feedback and surveys"""
    __tablename__ = "stakeholder_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    stakeholder_id = Column(Integer, ForeignKey("stakeholders.id"), nullable=False)
    feedback_type = Column(String(50))  # Survey, Complaint, Suggestion, Compliment
    title = Column(String(255))
    content = Column(Text)
    rating = Column(Integer)  # 1-5 or 1-10 scale
    nps_score = Column(Integer)  # Net Promoter Score
    sentiment = Column(String(20))  # Positive, Neutral, Negative
    category = Column(String(100))  # Product, Service, Support, etc.
    status = Column(String(20), default="new")  # new, in_review, resolved, closed
    priority = Column(String(20))  # Low, Medium, High, Critical
    assigned_to = Column(String(100))
    response = Column(Text)
    response_date = Column(DateTime)
    feedback_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    stakeholder = relationship("Stakeholder", back_populates="feedback")

# ===== CRM TABLES =====
class Customer(Base):
    """Customer information and profiles"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    customer_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50))  # Individual, Company, Organization
    industry = Column(String(100))
    size = Column(String(50))  # Small, Medium, Large, Enterprise
    status = Column(String(20), default="active")  # active, inactive, prospect, lead
    source = Column(String(100))  # Website, Referral, Cold Call, etc.
    contact_person = Column(String(100))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    website = Column(String(255))
    annual_revenue = Column(Numeric(15, 2))
    employee_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    opportunities = relationship("Opportunity", back_populates="customer")
    interactions = relationship("CustomerInteraction", back_populates="customer")

class Opportunity(Base):
    """Sales opportunities and deals"""
    __tablename__ = "opportunities"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    opportunity_id = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    stage = Column(String(50))  # Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
    probability = Column(Integer)  # 0-100
    estimated_value = Column(Numeric(15, 2))
    currency = Column(String(3), default="USD")
    expected_close_date = Column(DateTime)
    actual_close_date = Column(DateTime)
    sales_rep = Column(String(100))
    source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    customer = relationship("Customer", back_populates="opportunities")

class CustomerInteraction(Base):
    """Customer interactions and communications"""
    __tablename__ = "customer_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    interaction_type = Column(String(50))  # Call, Email, Meeting, Demo, Support
    subject = Column(String(255))
    description = Column(Text)
    interaction_date = Column(DateTime, default=datetime.utcnow)
    duration_minutes = Column(Integer)
    outcome = Column(Text)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    customer = relationship("Customer", back_populates="interactions")

# ===== PROPERLY NAMED INTEGRATION TABLES (AVOIDING DUPLICATES) =====

# ===== COMPLIANCE MANAGEMENT TABLES (PROPERLY NAMED) =====
class ComplianceFrameworkTable(Base):
    """Compliance frameworks like IFRS, GDPR, SOX, etc."""
    __tablename__ = "compliance_frameworks_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(100), nullable=False)  # IFRS, GDPR, SOX, etc.
    version = Column(String(50))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    controls = relationship("ComplianceControlTable", back_populates="framework")
    policies = relationship("CompliancePolicyTable", back_populates="framework")

class ComplianceControlTable(Base):
    """Individual compliance controls within frameworks"""
    __tablename__ = "compliance_controls_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    framework_id = Column(Integer, ForeignKey("compliance_frameworks_table.id"), nullable=False)
    control_id = Column(String(50), nullable=False)  # e.g., "IFRS-001", "GDPR-ART-5"
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))  # Financial, Operational, IT, etc.
    risk_level = Column(String(20))  # Low, Medium, High, Critical
    status = Column(String(20), default="active")  # active, inactive, deprecated
    owner = Column(String(100))  # Responsible person/team
    frequency = Column(String(50))  # Daily, Weekly, Monthly, Quarterly, Annually
    last_reviewed = Column(DateTime)
    next_review = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    framework = relationship("ComplianceFrameworkTable", back_populates="controls")
    assessments = relationship("ComplianceAssessmentTable", back_populates="control")

class CompliancePolicyTable(Base):
    """Compliance policies and procedures"""
    __tablename__ = "compliance_policies_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    framework_id = Column(Integer, ForeignKey("compliance_frameworks_table.id"), nullable=False)
    policy_id = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    content = Column(Text)  # Full policy content
    version = Column(String(20), default="1.0")
    status = Column(String(20), default="draft")  # draft, active, archived
    effective_date = Column(DateTime)
    expiry_date = Column(DateTime)
    owner = Column(String(100))
    approver = Column(String(100))
    approved_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    framework = relationship("ComplianceFrameworkTable", back_populates="policies")

class ComplianceAssessmentTable(Base):
    """Compliance assessments and testing results"""
    __tablename__ = "compliance_assessments_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    control_id = Column(Integer, ForeignKey("compliance_controls_table.id"), nullable=False)
    assessment_type = Column(String(50))  # Self-assessment, Internal Audit, External Audit
    assessor = Column(String(100))
    assessment_date = Column(DateTime, default=datetime.utcnow)
    result = Column(String(20))  # Pass, Fail, Partial, N/A
    score = Column(Integer)  # 0-100
    findings = Column(Text)
    recommendations = Column(Text)
    remediation_plan = Column(Text)
    due_date = Column(DateTime)
    status = Column(String(20), default="open")  # open, in_progress, completed, closed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    control = relationship("ComplianceControlTable", back_populates="assessments")

# ===== ESG MANAGEMENT TABLES (PROPERLY NAMED) =====
class ESGIndicatorTable(Base):
    """ESG indicators and metrics"""
    __tablename__ = "esg_indicators_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    indicator_code = Column(String(50), nullable=False)  # e.g., "EN-1", "SO-5", "G-1"
    name = Column(String(255), nullable=False)
    category = Column(String(50))  # Environmental, Social, Governance
    subcategory = Column(String(100))
    description = Column(Text)
    unit = Column(String(50))  # kg, %, $, etc.
    data_type = Column(String(20))  # numeric, percentage, text, boolean
    is_mandatory = Column(Boolean, default=False)
    reporting_frequency = Column(String(20))  # Annual, Quarterly, Monthly
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    data_points = relationship("ESGDataPointTable", back_populates="indicator")

class ESGDataPointTable(Base):
    """ESG data collection points"""
    __tablename__ = "esg_data_points_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("esg_indicators_table.id"), nullable=False)
    reporting_period = Column(String(20))  # 2024, Q1-2024, etc.
    value = Column(Numeric(15, 4))
    text_value = Column(Text)
    data_source = Column(String(255))
    collection_date = Column(DateTime, default=datetime.utcnow)
    verified = Column(Boolean, default=False)
    verified_by = Column(String(100))
    verified_date = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    indicator = relationship("ESGIndicatorTable", back_populates="data_points")

class ESGMaterialityMatrixTable(Base):
    """ESG materiality matrix for stakeholder importance vs business impact"""
    __tablename__ = "esg_materiality_matrix_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("esg_indicators_table.id"), nullable=False)
    stakeholder_importance = Column(Integer)  # 1-5 scale
    business_impact = Column(Integer)  # 1-5 scale
    materiality_level = Column(String(20))  # High, Medium, Low
    last_updated = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    indicator = relationship("ESGIndicatorTable")

# ===== PROJECT MANAGEMENT TABLES (PROPERLY NAMED) =====
class ProjectTable(Base):
    """Project information and details"""
    __tablename__ = "projects_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    project_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    project_type = Column(String(50))  # Internal, Client, R&D, etc.
    status = Column(String(20), default="planning")  # planning, active, on_hold, completed, cancelled
    priority = Column(String(20))  # Low, Medium, High, Critical
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    budget = Column(Numeric(15, 2))
    actual_cost = Column(Numeric(15, 2), default=0)
    progress = Column(Integer, default=0)  # 0-100
    project_manager = Column(String(100))
    sponsor = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    tasks = relationship("ProjectTaskTable", back_populates="project")
    milestones = relationship("ProjectMilestoneTable", back_populates="project")

class ProjectTaskTable(Base):
    """Project tasks and activities"""
    __tablename__ = "project_tasks_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects_table.id"), nullable=False)
    task_code = Column(String(50))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="not_started")  # not_started, in_progress, completed, blocked
    priority = Column(String(20))  # Low, Medium, High
    assignee = Column(String(100))
    start_date = Column(DateTime)
    due_date = Column(DateTime)
    completed_date = Column(DateTime)
    estimated_hours = Column(Numeric(8, 2))
    actual_hours = Column(Numeric(8, 2), default=0)
    progress = Column(Integer, default=0)  # 0-100
    dependencies = Column(JSONB)  # Array of task IDs this task depends on
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    project = relationship("ProjectTable", back_populates="tasks")

class ProjectMilestoneTable(Base):
    """Project milestones and key deliverables"""
    __tablename__ = "project_milestones_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects_table.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    target_date = Column(DateTime)
    actual_date = Column(DateTime)
    status = Column(String(20), default="pending")  # pending, achieved, missed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    project = relationship("ProjectTable", back_populates="milestones")

# ===== PURCHASE ORDER MANAGEMENT TABLES (PROPERLY NAMED) =====
class PurchaseOrderTable(Base):
    """Purchase orders and procurement"""
    __tablename__ = "purchase_orders_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    po_number = Column(String(50), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers_table.id"))
    requester = Column(String(100))
    department = Column(String(100))
    status = Column(String(20), default="draft")  # draft, pending_approval, approved, sent, received, cancelled
    priority = Column(String(20))  # Low, Medium, High, Urgent
    order_date = Column(DateTime, default=datetime.utcnow)
    required_date = Column(DateTime)
    total_amount = Column(Numeric(15, 2))
    currency = Column(String(3), default="USD")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    supplier = relationship("SupplierTable", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItemTable", back_populates="purchase_order")

class PurchaseOrderItemTable(Base):
    """Individual items in purchase orders"""
    __tablename__ = "purchase_order_items_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders_table.id"), nullable=False)
    item_code = Column(String(50))
    description = Column(String(255), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(15, 2), nullable=False)
    unit = Column(String(20))  # pcs, kg, m, etc.
    received_quantity = Column(Numeric(10, 2), default=0)
    status = Column(String(20), default="pending")  # pending, partially_received, received
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    purchase_order = relationship("PurchaseOrderTable", back_populates="items")

class SupplierTable(Base):
    """Supplier information"""
    __tablename__ = "suppliers_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    supplier_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    contact_person = Column(String(100))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    tax_id = Column(String(50))
    payment_terms = Column(String(100))
    currency = Column(String(3), default="USD")
    status = Column(String(20), default="active")  # active, inactive, suspended
    rating = Column(Integer)  # 1-5 rating
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    purchase_orders = relationship("PurchaseOrderTable", back_populates="supplier")

# ===== REVENUE ANALYTICS TABLES (PROPERLY NAMED) =====
class RevenueStreamTable(Base):
    """Revenue streams and sources"""
    __tablename__ = "revenue_streams_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    stream_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))  # Product Sales, Services, Subscriptions, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    transactions = relationship("RevenueTransactionTable", back_populates="stream")

class RevenueTransactionTable(Base):
    """Individual revenue transactions"""
    __tablename__ = "revenue_transactions_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    stream_id = Column(Integer, ForeignKey("revenue_streams_table.id"), nullable=False)
    transaction_id = Column(String(50), nullable=False)
    customer = Column(String(255))
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="USD")
    transaction_date = Column(DateTime, nullable=False)
    period = Column(String(20))  # 2024, Q1-2024, 2024-01, etc.
    status = Column(String(20), default="confirmed")  # pending, confirmed, cancelled
    payment_method = Column(String(50))
    region = Column(String(100))
    sales_rep = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    stream = relationship("RevenueStreamTable", back_populates="transactions")

class SalesPipelineTable(Base):
    """Sales pipeline and opportunities"""
    __tablename__ = "sales_pipeline_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    opportunity_id = Column(String(50), nullable=False)
    customer = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    stage = Column(String(50))  # Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
    probability = Column(Integer)  # 0-100
    estimated_value = Column(Numeric(15, 2))
    currency = Column(String(3), default="USD")
    expected_close_date = Column(DateTime)
    actual_close_date = Column(DateTime)
    sales_rep = Column(String(100))
    source = Column(String(100))  # Website, Referral, Cold Call, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")

# ===== ROLE MANAGEMENT TABLES (PROPERLY NAMED) =====
class RoleTable(Base):
    """User roles and permissions"""
    __tablename__ = "roles_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    role_code = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_system_role = Column(Boolean, default=False)  # System-defined vs custom
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    permissions = relationship("RolePermissionTable", back_populates="role")
    user_roles = relationship("UserRoleTable", back_populates="role")

class PermissionTable(Base):
    """System permissions and access rights"""
    __tablename__ = "permissions_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    permission_code = Column(String(100), nullable=False)  # e.g., "asset.create", "user.read"
    name = Column(String(255), nullable=False)
    description = Column(Text)
    module = Column(String(50))  # Asset Management, Compliance, etc.
    action = Column(String(50))  # create, read, update, delete, approve
    resource = Column(String(50))  # asset, user, report, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    role_permissions = relationship("RolePermissionTable", back_populates="permission")

class RolePermissionTable(Base):
    """Many-to-many relationship between roles and permissions"""
    __tablename__ = "role_permissions_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles_table.id"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions_table.id"), nullable=False)
    granted = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    granted_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    role = relationship("RoleTable", back_populates="permissions")
    permission = relationship("PermissionTable", back_populates="role_permissions")

class UserRoleTable(Base):
    """User role assignments"""
    __tablename__ = "user_roles_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles_table.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by = Column(String(100))
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime)
    
    # Relationships
    company = relationship("Company")
    user = relationship("User")
    role = relationship("RoleTable", back_populates="user_roles")

# ===== STAKEHOLDER MANAGEMENT TABLES (PROPERLY NAMED) =====
class StakeholderTable(Base):
    """Stakeholder information"""
    __tablename__ = "stakeholders_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    stakeholder_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50))  # Customer, Supplier, Investor, Employee, Community, etc.
    category = Column(String(100))  # Primary, Secondary, Internal, External
    contact_person = Column(String(100))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    website = Column(String(255))
    industry = Column(String(100))
    size = Column(String(50))  # Small, Medium, Large, Enterprise
    influence_level = Column(String(20))  # Low, Medium, High, Critical
    interest_level = Column(String(20))  # Low, Medium, High, Critical
    status = Column(String(20), default="active")  # active, inactive, dormant
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    interactions = relationship("StakeholderInteractionTable", back_populates="stakeholder")
    feedback = relationship("StakeholderFeedbackTable", back_populates="stakeholder")

class StakeholderInteractionTable(Base):
    """Stakeholder interactions and communications"""
    __tablename__ = "stakeholder_interactions_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    stakeholder_id = Column(Integer, ForeignKey("stakeholders_table.id"), nullable=False)
    interaction_type = Column(String(50))  # Meeting, Call, Email, Survey, Event
    subject = Column(String(255))
    description = Column(Text)
    interaction_date = Column(DateTime, default=datetime.utcnow)
    duration_minutes = Column(Integer)
    participants = Column(JSONB)  # Array of participant names
    outcome = Column(Text)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    stakeholder = relationship("StakeholderTable", back_populates="interactions")

class StakeholderFeedbackTable(Base):
    """Stakeholder feedback and surveys"""
    __tablename__ = "stakeholder_feedback_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    stakeholder_id = Column(Integer, ForeignKey("stakeholders_table.id"), nullable=False)
    feedback_type = Column(String(50))  # Survey, Complaint, Suggestion, Compliment
    title = Column(String(255))
    content = Column(Text)
    rating = Column(Integer)  # 1-5 or 1-10 scale
    nps_score = Column(Integer)  # Net Promoter Score
    sentiment = Column(String(20))  # Positive, Neutral, Negative
    category = Column(String(100))  # Product, Service, Support, etc.
    status = Column(String(20), default="new")  # new, in_review, resolved, closed
    priority = Column(String(20))  # Low, Medium, High, Critical
    assigned_to = Column(String(100))
    response = Column(Text)
    response_date = Column(DateTime)
    feedback_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    stakeholder = relationship("StakeholderTable", back_populates="feedback")

# ===== CRM TABLES (PROPERLY NAMED) =====
class CustomerCRMTable(Base):
    """Customer information and profiles for CRM"""
    __tablename__ = "customers_crm_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    customer_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50))  # Individual, Company, Organization
    industry = Column(String(100))
    size = Column(String(50))  # Small, Medium, Large, Enterprise
    status = Column(String(20), default="active")  # active, inactive, prospect, lead
    source = Column(String(100))  # Website, Referral, Cold Call, etc.
    contact_person = Column(String(100))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    website = Column(String(255))
    annual_revenue = Column(Numeric(15, 2))
    employee_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    opportunities = relationship("OpportunityCRMTable", back_populates="customer")
    interactions = relationship("CustomerInteractionCRMTable", back_populates="customer")

class OpportunityCRMTable(Base):
    """Sales opportunities and deals for CRM"""
    __tablename__ = "opportunities_crm_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers_crm_table.id"), nullable=False)
    opportunity_id = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    stage = Column(String(50))  # Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
    probability = Column(Integer)  # 0-100
    estimated_value = Column(Numeric(15, 2))
    currency = Column(String(3), default="USD")
    expected_close_date = Column(DateTime)
    actual_close_date = Column(DateTime)
    sales_rep = Column(String(100))
    source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    customer = relationship("CustomerCRMTable", back_populates="opportunities")

class CustomerInteractionCRMTable(Base):
    """Customer interactions and communications for CRM"""
    __tablename__ = "customer_interactions_crm_table"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers_crm_table.id"), nullable=False)
    interaction_type = Column(String(50))  # Call, Email, Meeting, Demo, Support
    subject = Column(String(255))
    description = Column(Text)
    interaction_date = Column(DateTime, default=datetime.utcnow)
    duration_minutes = Column(Integer)
    outcome = Column(Text)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    customer = relationship("CustomerCRMTable", back_populates="interactions")

# ===== COMPREHENSIVE INTEGRATION DATABASE SCHEMA =====
# Based on thorough analysis of all 9 integrations

# ===== 1. ASSET MANAGEMENT COMPREHENSIVE TABLES =====
class AssetManagementAsset(Base):
    """Comprehensive asset management - physical and digital assets"""
    __tablename__ = "asset_management_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    asset_id = Column(String(50), nullable=False, unique=True)  # AT-2025-0001
    name = Column(String(255), nullable=False)
    description = Column(Text)
    asset_type = Column(String(100), nullable=False)  # laptop, desktop, server, printer, phone, etc.
    category = Column(String(100))  # IT Equipment, Furniture, Vehicles, Software, etc.
    subcategory = Column(String(100))
    brand = Column(String(100))
    model = Column(String(100))
    serial_number = Column(String(100), unique=True)
    asset_tag = Column(String(50))
    status = Column(String(50), default="active")  # active, inactive, repair, retired, spare, lost, stolen
    condition = Column(String(50))  # excellent, good, fair, poor, damaged
    location = Column(String(255))  # room-103, building-a, etc.
    department = Column(String(100))
    cost_center = Column(String(100))
    owner = Column(String(100))  # John Smith
    assigned_to = Column(String(100))
    custodian = Column(String(100))
    purchase_date = Column(DateTime)
    purchase_price = Column(Numeric(15, 2))
    current_value = Column(Numeric(15, 2))
    depreciation_method = Column(String(50))  # straight_line, declining_balance, etc.
    useful_life_years = Column(Integer)
    warranty_start_date = Column(DateTime)
    warranty_end_date = Column(DateTime)
    warranty_provider = Column(String(100))
    warranty_contact = Column(String(255))
    insurance_policy = Column(String(100))
    insurance_value = Column(Numeric(15, 2))
    last_maintenance_date = Column(DateTime)
    next_maintenance_date = Column(DateTime)
    maintenance_frequency = Column(String(50))  # monthly, quarterly, annually
    disposal_date = Column(DateTime)
    disposal_method = Column(String(50))  # sold, donated, recycled, destroyed
    disposal_value = Column(Numeric(15, 2))
    notes = Column(Text)
    attachments = Column(JSONB)  # Array of file paths
    custom_fields = Column(JSONB)  # Flexible custom attributes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    updated_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    maintenance_records = relationship("AssetManagementMaintenance", back_populates="asset")
    audit_records = relationship("AssetManagementAudit", back_populates="asset")
    location_history = relationship("AssetManagementLocationHistory", back_populates="asset")

class AssetManagementCategory(Base):
    """Asset categories and classifications"""
    __tablename__ = "asset_management_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    parent_category_id = Column(Integer, ForeignKey("asset_management_categories.id"))
    depreciation_rate = Column(Numeric(5, 2))  # Annual depreciation percentage
    useful_life_years = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    parent_category = relationship("AssetManagementCategory", remote_side=[id])
    subcategories = relationship("AssetManagementCategory", back_populates="parent_category")

class AssetManagementLocation(Base):
    """Asset locations and sites"""
    __tablename__ = "asset_management_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    location_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    location_type = Column(String(50))  # building, floor, room, desk, etc.
    parent_location_id = Column(Integer, ForeignKey("asset_management_locations.id"))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    contact_person = Column(String(100))
    contact_phone = Column(String(50))
    contact_email = Column(String(255))
    capacity = Column(Integer)  # Maximum number of assets
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    parent_location = relationship("AssetManagementLocation", remote_side=[id])
    sub_locations = relationship("AssetManagementLocation", back_populates="parent_location")

class AssetManagementMaintenance(Base):
    """Asset maintenance and service records"""
    __tablename__ = "asset_management_maintenance"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("asset_management_assets.id"), nullable=False)
    maintenance_type = Column(String(50))  # preventive, corrective, emergency, upgrade
    title = Column(String(255), nullable=False)
    description = Column(Text)
    scheduled_date = Column(DateTime)
    completed_date = Column(DateTime)
    status = Column(String(50), default="scheduled")  # scheduled, in_progress, completed, cancelled
    priority = Column(String(20))  # low, medium, high, critical
    assigned_to = Column(String(100))
    vendor = Column(String(100))
    cost = Column(Numeric(15, 2))
    parts_used = Column(JSONB)  # Array of parts with quantities
    labor_hours = Column(Numeric(8, 2))
    next_maintenance_date = Column(DateTime)
    notes = Column(Text)
    attachments = Column(JSONB)  # Array of file paths
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    
    # Relationships
    company = relationship("Company")
    asset = relationship("AssetManagementAsset", back_populates="maintenance_records")

class AssetManagementAudit(Base):
    """Asset audit and verification records"""
    __tablename__ = "asset_management_audits"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("asset_management_assets.id"), nullable=False)
    audit_type = Column(String(50))  # physical, financial, compliance
    audit_date = Column(DateTime, default=datetime.utcnow)
    auditor = Column(String(100))
    status = Column(String(50))  # found, missing, damaged, disposed
    location_verified = Column(Boolean, default=True)
    condition_verified = Column(Boolean, default=True)
    custodian_verified = Column(Boolean, default=True)
    discrepancies = Column(Text)
    recommendations = Column(Text)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    asset = relationship("AssetManagementAsset", back_populates="audit_records")

class AssetManagementLocationHistory(Base):
    """Asset location change history"""
    __tablename__ = "asset_management_location_history"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("asset_management_assets.id"), nullable=False)
    from_location = Column(String(255))
    to_location = Column(String(255))
    change_date = Column(DateTime, default=datetime.utcnow)
    reason = Column(String(255))
    changed_by = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    asset = relationship("AssetManagementAsset", back_populates="location_history")

# ===== 2. COMPLIANCE MANAGEMENT COMPREHENSIVE TABLES =====
class ComplianceManagementFramework(Base):
    """Compliance frameworks and standards"""
    __tablename__ = "compliance_management_frameworks"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    framework_code = Column(String(50), nullable=False)  # IFRS, GDPR, SOX, ISO27001, etc.
    name = Column(String(255), nullable=False)
    description = Column(Text)
    version = Column(String(50))
    effective_date = Column(DateTime)
    expiry_date = Column(DateTime)
    regulatory_body = Column(String(255))
    jurisdiction = Column(String(100))
    industry_scope = Column(String(255))
    compliance_level = Column(String(50))  # mandatory, recommended, optional
    risk_level = Column(String(20))  # low, medium, high, critical
    owner = Column(String(100))
    status = Column(String(50), default="active")  # active, inactive, superseded
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    controls = relationship("ComplianceManagementControl", back_populates="framework")
    policies = relationship("ComplianceManagementPolicy", back_populates="framework")

class ComplianceManagementControl(Base):
    """Compliance controls and requirements"""
    __tablename__ = "compliance_management_controls"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    framework_id = Column(Integer, ForeignKey("compliance_management_frameworks.id"), nullable=False)
    control_id = Column(String(50), nullable=False)  # IFRS-001, GDPR-ART-5, etc.
    title = Column(String(255), nullable=False)
    description = Column(Text)
    control_type = Column(String(50))  # preventive, detective, corrective
    category = Column(String(100))  # financial, operational, IT, HR, etc.
    subcategory = Column(String(100))
    risk_level = Column(String(20))  # low, medium, high, critical
    impact_level = Column(String(20))  # low, medium, high, critical
    likelihood = Column(String(20))  # low, medium, high, critical
    status = Column(String(50), default="active")  # active, inactive, deprecated
    owner = Column(String(100))
    responsible_party = Column(String(100))
    frequency = Column(String(50))  # daily, weekly, monthly, quarterly, annually
    last_reviewed = Column(DateTime)
    next_review = Column(DateTime)
    implementation_date = Column(DateTime)
    testing_frequency = Column(String(50))
    last_tested = Column(DateTime)
    next_test = Column(DateTime)
    evidence_required = Column(Text)
    automation_level = Column(String(50))  # manual, semi_automated, fully_automated
    cost_estimate = Column(Numeric(15, 2))
    effort_hours = Column(Numeric(8, 2))
    dependencies = Column(JSONB)  # Array of control IDs this control depends on
    related_controls = Column(JSONB)  # Array of related control IDs
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    framework = relationship("ComplianceManagementFramework", back_populates="controls")
    assessments = relationship("ComplianceManagementAssessment", back_populates="control")
    policies = relationship("ComplianceManagementPolicy", back_populates="control")

class ComplianceManagementPolicy(Base):
    """Compliance policies and procedures"""
    __tablename__ = "compliance_management_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    framework_id = Column(Integer, ForeignKey("compliance_management_frameworks.id"), nullable=False)
    control_id = Column(Integer, ForeignKey("compliance_management_controls.id"))
    policy_id = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    content = Column(Text)  # Full policy content
    policy_type = Column(String(50))  # policy, procedure, guideline, standard
    version = Column(String(20), default="1.0")
    status = Column(String(50), default="draft")  # draft, review, approved, active, archived
    effective_date = Column(DateTime)
    expiry_date = Column(DateTime)
    review_frequency = Column(String(50))  # monthly, quarterly, annually
    last_reviewed = Column(DateTime)
    next_review = Column(DateTime)
    owner = Column(String(100))
    author = Column(String(100))
    approver = Column(String(100))
    approved_date = Column(DateTime)
    distribution_list = Column(JSONB)  # Array of recipients
    training_required = Column(Boolean, default=False)
    training_frequency = Column(String(50))
    compliance_level = Column(String(50))  # mandatory, recommended, optional
    risk_rating = Column(String(20))  # low, medium, high, critical
    attachments = Column(JSONB)  # Array of file paths
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    framework = relationship("ComplianceManagementFramework", back_populates="policies")
    control = relationship("ComplianceManagementControl", back_populates="policies")

class ComplianceManagementAssessment(Base):
    """Compliance assessments and testing"""
    __tablename__ = "compliance_management_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    control_id = Column(Integer, ForeignKey("compliance_management_controls.id"), nullable=False)
    assessment_id = Column(String(50), nullable=False)
    assessment_type = Column(String(50))  # self_assessment, internal_audit, external_audit, testing
    title = Column(String(255), nullable=False)
    description = Column(Text)
    assessor = Column(String(100))
    assessment_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)
    completion_date = Column(DateTime)
    status = Column(String(50), default="planned")  # planned, in_progress, completed, overdue
    result = Column(String(50))  # pass, fail, partial, not_applicable
    score = Column(Integer)  # 0-100
    findings = Column(Text)
    recommendations = Column(Text)
    remediation_plan = Column(Text)
    remediation_due_date = Column(DateTime)
    remediation_status = Column(String(50))  # open, in_progress, completed, closed
    evidence_provided = Column(JSONB)  # Array of evidence file paths
    attachments = Column(JSONB)  # Array of file paths
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    control = relationship("ComplianceManagementControl", back_populates="assessments")

class ComplianceManagementIncident(Base):
    """Compliance incidents and violations"""
    __tablename__ = "compliance_management_incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    incident_id = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    incident_type = Column(String(50))  # violation, breach, non_compliance, etc.
    severity = Column(String(20))  # low, medium, high, critical
    status = Column(String(50), default="reported")  # reported, investigating, resolved, closed
    reported_date = Column(DateTime, default=datetime.utcnow)
    reported_by = Column(String(100))
    affected_framework_id = Column(Integer, ForeignKey("compliance_management_frameworks.id"))
    affected_control_id = Column(Integer, ForeignKey("compliance_management_controls.id"))
    impact_assessment = Column(Text)
    root_cause = Column(Text)
    corrective_actions = Column(Text)
    preventive_measures = Column(Text)
    resolution_date = Column(DateTime)
    resolved_by = Column(String(100))
    lessons_learned = Column(Text)
    attachments = Column(JSONB)  # Array of file paths
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    framework = relationship("ComplianceManagementFramework")
    control = relationship("ComplianceManagementControl")

# ===== 3. ESG MANAGEMENT COMPREHENSIVE TABLES =====
class ESGManagementIndicator(Base):
    """ESG indicators and metrics"""
    __tablename__ = "esg_management_indicators"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    indicator_code = Column(String(50), nullable=False)  # EN-1, SO-5, G-1, etc.
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(50))  # Environmental, Social, Governance
    subcategory = Column(String(100))  # Climate, Diversity, Board Composition, etc.
    framework = Column(String(100))  # GRI, SASB, TCFD, UN SDGs, etc.
    unit = Column(String(50))  # kg, %, $, number, etc.
    data_type = Column(String(20))  # numeric, percentage, text, boolean
    calculation_method = Column(Text)
    data_source = Column(String(255))
    collection_frequency = Column(String(20))  # daily, weekly, monthly, quarterly, annually
    reporting_frequency = Column(String(20))  # quarterly, annually
    is_mandatory = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    target_value = Column(Numeric(15, 4))
    baseline_value = Column(Numeric(15, 4))
    baseline_year = Column(Integer)
    owner = Column(String(100))
    responsible_party = Column(String(100))
    verification_required = Column(Boolean, default=False)
    verification_method = Column(String(100))
    status = Column(String(50), default="active")  # active, inactive, deprecated
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    data_points = relationship("ESGManagementDataPoint", back_populates="indicator")
    targets = relationship("ESGManagementTarget", back_populates="indicator")

class ESGManagementDataPoint(Base):
    """ESG data collection and reporting"""
    __tablename__ = "esg_management_data_points"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("esg_management_indicators.id"), nullable=False)
    reporting_period = Column(String(20))  # 2024, Q1-2024, 2024-01, etc.
    reporting_year = Column(Integer)
    reporting_quarter = Column(Integer)
    reporting_month = Column(Integer)
    value = Column(Numeric(15, 4))
    text_value = Column(Text)
    unit = Column(String(50))
    data_source = Column(String(255))
    collection_date = Column(DateTime, default=datetime.utcnow)
    collection_method = Column(String(100))
    verified = Column(Boolean, default=False)
    verified_by = Column(String(100))
    verified_date = Column(DateTime)
    verification_method = Column(String(100))
    quality_score = Column(Integer)  # 1-5 quality rating
    notes = Column(Text)
    assumptions = Column(Text)
    limitations = Column(Text)
    attachments = Column(JSONB)  # Array of file paths
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    indicator = relationship("ESGManagementIndicator", back_populates="data_points")

class ESGManagementTarget(Base):
    """ESG targets and goals"""
    __tablename__ = "esg_management_targets"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("esg_management_indicators.id"), nullable=False)
    target_name = Column(String(255), nullable=False)
    target_description = Column(Text)
    target_type = Column(String(50))  # absolute, relative, intensity, etc.
    target_value = Column(Numeric(15, 4))
    target_unit = Column(String(50))
    baseline_value = Column(Numeric(15, 4))
    baseline_year = Column(Integer)
    target_year = Column(Integer)
    interim_targets = Column(JSONB)  # Array of interim targets by year
    status = Column(String(50), default="active")  # active, achieved, missed, cancelled
    progress = Column(Numeric(5, 2))  # Percentage progress
    last_updated = Column(DateTime, default=datetime.utcnow)
    owner = Column(String(100))
    responsible_party = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    indicator = relationship("ESGManagementIndicator", back_populates="targets")

class ESGManagementMaterialityMatrix(Base):
    """ESG materiality assessment matrix"""
    __tablename__ = "esg_management_materiality_matrix"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("esg_management_indicators.id"), nullable=False)
    assessment_year = Column(Integer)
    stakeholder_importance = Column(Integer)  # 1-5 scale
    business_impact = Column(Integer)  # 1-5 scale
    materiality_level = Column(String(20))  # high, medium, low
    stakeholder_group = Column(String(100))  # customers, employees, investors, etc.
    assessment_method = Column(String(100))
    assessment_date = Column(DateTime, default=datetime.utcnow)
    assessor = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    indicator = relationship("ESGManagementIndicator")

class ESGManagementReport(Base):
    """ESG reports and disclosures"""
    __tablename__ = "esg_management_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    report_name = Column(String(255), nullable=False)
    report_type = Column(String(50))  # sustainability_report, esg_disclosure, etc.
    reporting_framework = Column(String(100))  # GRI, SASB, TCFD, etc.
    reporting_period = Column(String(20))  # 2024, Q1-2024, etc.
    reporting_year = Column(Integer)
    status = Column(String(50), default="draft")  # draft, review, published, archived
    publication_date = Column(DateTime)
    due_date = Column(DateTime)
    author = Column(String(100))
    reviewer = Column(String(100))
    approver = Column(String(100))
    content = Column(Text)
    executive_summary = Column(Text)
    key_highlights = Column(JSONB)  # Array of key highlights
    attachments = Column(JSONB)  # Array of file paths
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")

# ===== ENTITY HIERARCHY NODES =====

class EntityNode(Base):
    __tablename__ = "entity_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    hierarchy_id = Column(Integer, ForeignKey("hierarchies.id"), nullable=False)
    parent_node_id = Column(Integer, ForeignKey("entity_nodes.id"), nullable=True)
    node_name = Column(String(255), nullable=False)
    node_code = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    level = Column(Integer, default=0)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    parent_node = relationship("EntityNode", remote_side=[id])
    child_nodes = relationship("EntityNode", back_populates="parent_node")
    entities = relationship("Entity", back_populates="entity_node")

class AccountNode(Base):
    __tablename__ = "account_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    hierarchy_id = Column(Integer, ForeignKey("hierarchies.id"), nullable=False)
    parent_node_id = Column(Integer, ForeignKey("account_nodes.id"), nullable=True)
    node_name = Column(String(255), nullable=False)
    node_code = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    level = Column(Integer, default=0)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    parent_node = relationship("AccountNode", remote_side=[id])
    child_nodes = relationship("AccountNode", back_populates="parent_node")
    accounts = relationship("Account", back_populates="account_node")

# ===== UNIVERSAL DIMENSIONS TEMPLATE TABLES =====

class DimensionHierarchy(Base):
    __tablename__ = "dimension_hierarchies"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    dimension_type = Column(String(50), nullable=False)  # 'entity', 'account', 'user', etc.
    hierarchy_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("dimension_hierarchies.id"), nullable=True)
    level = Column(Integer, default=0)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    
    # Relationships
    company = relationship("Company")
    parent = relationship("DimensionHierarchy", remote_side=[id])
    children = relationship("DimensionHierarchy", back_populates="parent")

class DimensionElement(Base):
    __tablename__ = "dimension_elements"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    dimension_type = Column(String(50), nullable=False)
    element_code = Column(String(100), nullable=False)
    element_name = Column(String(255), nullable=False)
    element_type = Column(String(50), nullable=True)
    hierarchy_id = Column(Integer, ForeignKey("dimension_hierarchies.id"), nullable=True)
    parent_element_id = Column(Integer, ForeignKey("dimension_elements.id"), nullable=True)
    level = Column(Integer, default=0)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    custom_fields = Column(JSONB, nullable=True)  # Store custom field values
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    
    # Relationships
    company = relationship("Company")
    hierarchy = relationship("DimensionHierarchy")
    parent_element = relationship("DimensionElement", remote_side=[id])
    child_elements = relationship("DimensionElement", back_populates="parent_element")

class CustomFieldsConfig(Base):
    __tablename__ = "custom_fields_config"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    dimension_type = Column(String(50), nullable=False)
    field_name = Column(String(100), nullable=False)
    field_label = Column(String(255), nullable=False)
    field_type = Column(String(50), nullable=False)  # 'text', 'select', 'boolean', 'sql_query', 'number', 'date'
    field_options = Column(JSONB, nullable=True)  # For select fields, SQL queries, etc.
    is_required = Column(Boolean, default=False)
    is_unique = Column(Boolean, default=False)
    default_value = Column(Text, nullable=True)
    validation_rules = Column(JSONB, nullable=True)  # Custom validation rules
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")

class AuditTrail(Base):
    __tablename__ = "audit_trail"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    table_name = Column(String(100), nullable=False)
    record_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False)  # 'INSERT', 'UPDATE', 'DELETE'
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)
    changed_by = Column(String(100), nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Relationships
    company = relationship("Company")

class LinkingReferences(Base):
    __tablename__ = "linking_references"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    source_dimension_type = Column(String(50), nullable=False)
    source_element_id = Column(Integer, nullable=False)
    target_dimension_type = Column(String(50), nullable=False)
    target_element_id = Column(Integer, nullable=False)
    relationship_type = Column(String(50), nullable=False)  # 'belongs_to', 'has_many', 'many_to_many'
    reference_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100), nullable=True)
    
    # Relationships
    company = relationship("Company")

# ===== REPORTS TABLES =====

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    report_type = Column(String(50), default="custom")  # 'custom', 'standard', 'template'
    category = Column(String(100), nullable=True)  # 'financial', 'operational', 'compliance', etc.
    is_public = Column(Boolean, default=False)
    is_template = Column(Boolean, default=False)
    created_by = Column(String(100), nullable=False)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    definitions = relationship("ReportDefinition", back_populates="report", cascade="all, delete-orphan")
    executions = relationship("ReportExecution", back_populates="report", cascade="all, delete-orphan")

class ReportDefinition(Base):
    __tablename__ = "report_definitions"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    version = Column(Integer, default=1)
    definition = Column(JSONB, nullable=False)  # Store report layout, formulas, filters, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100), nullable=False)
    
    # Relationships
    report = relationship("Report", back_populates="definitions")

class ReportExecution(Base):
    __tablename__ = "report_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    execution_date = Column(DateTime, default=datetime.utcnow)
    executed_by = Column(String(100), nullable=False)
    parameters = Column(JSONB, nullable=True)  # Store execution parameters
    status = Column(String(50), default="completed")  # 'running', 'completed', 'failed'
    result_data = Column(JSONB, nullable=True)  # Store execution results
    error_message = Column(Text, nullable=True)
    
    # Relationships
    report = relationship("Report", back_populates="executions")
