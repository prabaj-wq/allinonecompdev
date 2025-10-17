"""
Company-specific database schema for EPM consolidation tool.
This module contains all the models that should be created in each company's database.
Based on the comprehensive olddatabase.py schema for proper EPM functionality.
"""

from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Boolean, JSON, event, Table, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import text
from datetime import datetime
from typing import Optional

# Create base class for company-specific models
from company_database_base import CompanyBase


# Association table for many-to-many relationship between roles and permissions
role_permission = Table(
    'role_permission',
    CompanyBase.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True),
    UniqueConstraint('role_id', 'permission_id', name='uq_role_permission')
)


# ===== CORE EPM MODELS =====

class Account(CompanyBase):
    """Chart of Accounts - IFRS compliant account structure"""
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    account_code = Column(String(100), nullable=False, index=True)
    account_name = Column(String(255), nullable=False)
    ifrs_category = Column(String(100))
    statement = Column(String(50))  # BS, PL, CF
    description = Column(Text, nullable=True)
    hierarchy_id = Column(Integer, nullable=True)
    parent_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = relationship("Account", remote_side=[id], backref="children")

class Entity(CompanyBase):
    """Entity/Subsidiary management"""
    __tablename__ = "entities"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_code = Column(String(100), nullable=False, index=True)
    entity_name = Column(String(255), nullable=False)
    entity_type = Column(String(50), nullable=True)  # Parent, Subsidiary, Joint Venture, Associate
    country = Column(String(100), nullable=True)
    currency = Column(String(10))
    hierarchy_id = Column(Integer, nullable=True)
    parent_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    ownership_percentage = Column(Numeric(5, 2), default=100.00)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = relationship("Entity", remote_side=[id], backref="children")

class Hierarchy(CompanyBase):
    """Hierarchical structures for entities and accounts"""
    __tablename__ = "hierarchies"
    
    id = Column(Integer, primary_key=True, index=True)
    hierarchy_type = Column(String(50), nullable=False)  # Entity, Account, Custom
    hierarchy_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FSTTemplate(CompanyBase):
    """Financial Statement Templates"""
    __tablename__ = "fst_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String(255), nullable=False)
    template_type = Column(String(50), nullable=False)  # Balance Sheet, P&L, Cash Flow
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FSTElement(CompanyBase):
    """Financial Statement Elements"""
    __tablename__ = "fst_elements"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("fst_templates.id"), nullable=False)
    element_name = Column(String(255), nullable=False)
    element_type = Column(String(50), nullable=False)  # Header, Line Item, Subtotal, Total
    account_codes = Column(JSON, nullable=True)  # Array of account codes
    order_index = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    template = relationship("FSTTemplate", backref="elements")

class TBEntry(CompanyBase):
    """Trial Balance Entries"""
    __tablename__ = "tb_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    period = Column(String(20), nullable=False)  # YYYY-MM
    debit_amount = Column(Numeric(20, 2), default=0)
    credit_amount = Column(Numeric(20, 2), default=0)
    is_adjusted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    entity = relationship("Entity")
    account = relationship("Account")

class Upload(CompanyBase):
    """File upload tracking"""
    __tablename__ = "uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # TB, Journal, etc.
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    records_processed = Column(Integer, default=0)
    records_total = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class ConsolidationSettings(CompanyBase):
    """Consolidation configuration"""
    __tablename__ = "consolidation_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    setting_name = Column(String(100), nullable=False, unique=True)
    setting_value = Column(Text, nullable=True)
    setting_type = Column(String(50), nullable=False)  # string, number, boolean, json
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class IntercompanyTransaction(CompanyBase):
    """Intercompany transactions for elimination"""
    __tablename__ = "intercompany_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), nullable=False, unique=True)
    sender_entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    receiver_entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    amount = Column(Numeric(20, 2), nullable=False)
    currency = Column(String(10), nullable=False)
    transaction_date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="pending")  # pending, matched, eliminated
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sender_entity = relationship("Entity", foreign_keys=[sender_entity_id])
    receiver_entity = relationship("Entity", foreign_keys=[receiver_entity_id])
    account = relationship("Account")

class ConsolidationJournal(CompanyBase):
    """Consolidation adjustment journals"""
    __tablename__ = "consolidation_journals"
    
    id = Column(Integer, primary_key=True, index=True)
    journal_number = Column(String(100), nullable=False, unique=True)
    journal_date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    journal_type = Column(String(50), nullable=False)  # elimination, adjustment, reclassification
    status = Column(String(50), default="draft")  # draft, posted, reversed
    total_debit = Column(Numeric(20, 2), default=0)
    total_credit = Column(Numeric(20, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    posted_at = Column(DateTime, nullable=True)
    
    # Relationships
    entries = relationship("ConsolidationJournalEntry", back_populates="journal", cascade="all, delete-orphan")

class ConsolidationJournalEntry(CompanyBase):
    """Consolidation journal entries"""
    __tablename__ = "consolidation_journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    journal_id = Column(Integer, ForeignKey("consolidation_journals.id"), nullable=False)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    debit_amount = Column(Numeric(20, 2), default=0)
    credit_amount = Column(Numeric(20, 2), default=0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    journal = relationship("ConsolidationJournal", back_populates="entries")
    entity = relationship("Entity")
    account = relationship("Account")

class OwnershipStructure(CompanyBase):
    """Ownership structure for consolidation"""
    __tablename__ = "ownership_structures"
    
    id = Column(Integer, primary_key=True, index=True)
    parent_entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    subsidiary_entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    ownership_percentage = Column(Numeric(5, 2), nullable=False)
    effective_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent_entity = relationship("Entity", foreign_keys=[parent_entity_id])
    subsidiary_entity = relationship("Entity", foreign_keys=[subsidiary_entity_id])

class IFRSAccount(CompanyBase):
    """IFRS-compliant account structure"""
    __tablename__ = "ifrs_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    account_code = Column(String(100), nullable=False, unique=True)
    account_name = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=False)  # Asset, Liability, Equity, Income, Expense
    statement = Column(String(50), nullable=False)  # Balance Sheet, P&L, Cash Flow
    ifrs_category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Role(CompanyBase):
    """User roles for company-specific access control"""
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    role_code = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_system_role = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")
    permissions = relationship("Permission", secondary=role_permission, back_populates="roles")

class Permission(CompanyBase):
    """Permissions for role-based access control"""
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    permission_code = Column(String(100), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    module = Column(String(100), nullable=True)
    action = Column(String(100), nullable=True)
    resource = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    roles = relationship("Role", secondary=role_permission, back_populates="permissions")

class UserRole(CompanyBase):
    """User-role assignments"""
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # Reference to main database user
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by = Column(Integer, nullable=True)  # User ID who assigned the role
    
    # Relationships
    role = relationship("Role", back_populates="user_roles")

class CustomAxis(CompanyBase):
    """Custom dimensions for multi-dimensional reporting"""
    __tablename__ = "custom_axes"
    
    id = Column(Integer, primary_key=True, index=True)
    axis_name = Column(String(100), nullable=False, unique=True)
    axis_type = Column(String(50), nullable=False)  # entity, account, custom
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CustomAxisColumn(CompanyBase):
    """Custom axis columns/fields"""
    __tablename__ = "custom_axis_columns"
    
    id = Column(Integer, primary_key=True, index=True)
    axis_id = Column(Integer, ForeignKey("custom_axes.id"), nullable=False)
    column_name = Column(String(100), nullable=False)
    column_type = Column(String(50), nullable=False)  # text, number, date, dropdown
    is_required = Column(Boolean, default=False)
    default_value = Column(Text, nullable=True)
    validation_rules = Column(JSON, nullable=True)
    order_index = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    axis = relationship("CustomAxis", backref="columns")

class CustomAxisValue(CompanyBase):
    """Custom axis values/records"""
    __tablename__ = "custom_axis_values"
    
    id = Column(Integer, primary_key=True, index=True)
    axis_id = Column(Integer, ForeignKey("custom_axes.id"), nullable=False)
    record_data = Column(JSON, nullable=False)  # Flexible data storage
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    axis = relationship("CustomAxis", backref="values")

class AxesSettings(CompanyBase):
    """Axes settings for entity management"""
    __tablename__ = "axes_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    axes_type = Column(String(50), nullable=False)  # entity, account, custom
    custom_fields = Column(JSONB, nullable=True, default='[]')
    linked_axes = Column(JSONB, nullable=True, default='[]')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class HierarchyNode(CompanyBase):
    """Hierarchy nodes for tree structures"""
    __tablename__ = "hierarchy_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(100), nullable=True)
    parent_id = Column(Integer, ForeignKey("hierarchy_nodes.id"), nullable=True)
    hierarchy_id = Column(Integer, ForeignKey("hierarchies.id"), nullable=False)
    company_id = Column(String(255), nullable=False)
    level = Column(Integer, default=0)
    path = Column(String(500), nullable=True)  # Materialized path
    is_leaf = Column(Boolean, default=True)
    custom_fields = Column(JSONB, default='{}')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = relationship("HierarchyNode", remote_side=[id], backref="children")
    hierarchy = relationship("Hierarchy")

class AxesEntity(CompanyBase):
    """Enhanced entities for axes management"""
    __tablename__ = "axes_entities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("hierarchy_nodes.id"), nullable=True)
    node_id = Column(Integer, ForeignKey("hierarchy_nodes.id"), nullable=True)
    hierarchy_id = Column(Integer, ForeignKey("hierarchies.id"), nullable=True)
    company_id = Column(String(255), nullable=False)
    level = Column(Integer, default=0)
    is_leaf = Column(Boolean, default=True)
    entity_type = Column(String(50), default='Subsidiary')
    geography = Column(String(100), nullable=True)
    currency = Column(String(10), default='USD')
    custom_fields = Column(JSONB, default='{}')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent_node = relationship("HierarchyNode", foreign_keys=[parent_id])
    assigned_node = relationship("HierarchyNode", foreign_keys=[node_id])
    hierarchy = relationship("Hierarchy")
    
    # Unique constraint
    __table_args__ = (UniqueConstraint('code', 'company_id', name='uq_axes_entity_code_company'),)

class AxesAccount(CompanyBase):
    """Enhanced accounts for axes management"""
    __tablename__ = "axes_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("hierarchy_nodes.id"), nullable=True)
    node_id = Column(Integer, ForeignKey("hierarchy_nodes.id"), nullable=True)
    hierarchy_id = Column(Integer, ForeignKey("hierarchies.id"), nullable=True)
    company_id = Column(String(255), nullable=False)
    level = Column(Integer, default=0)
    is_leaf = Column(Boolean, default=True)
    account_type = Column(String(50), default='Standard')
    statement = Column(String(50), default='balance_sheet')  # balance_sheet, cashflow, profit_and_loss, statement_of_changes_in_equity
    category = Column(String(50), default='asset')  # asset, liability, equity, income, expense
    custom_fields = Column(JSONB, default='{}')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent_node = relationship("HierarchyNode", foreign_keys=[parent_id])
    assigned_node = relationship("HierarchyNode", foreign_keys=[node_id])
    hierarchy = relationship("Hierarchy")
    
    # Unique constraint
    __table_args__ = (UniqueConstraint('code', 'company_id', name='uq_axes_account_code_company'),)

class AuditTrail(CompanyBase):
    """Audit trail for all changes"""
    __tablename__ = "audit_trails"
    
    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String(100), nullable=False)
    record_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False)  # INSERT, UPDATE, DELETE
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    user_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)

# Import fiscal management models
from models.fiscal_management import (
    FiscalYear, Period, Scenario, ScenarioData, 
    ScenarioComparison, ConsolidationRule
)

# Import financial process models
from models.financial_process import (
    FinancialProcess, ProcessNode, ProcessConnection, ProcessScenario,
    EntityStructure, ConsolidationRule as FPConsolidationRule, ProcessData,
    ProcessExecution, ProcessJournal, FXRate, ValidationRule, ProcessAlert, ProcessAuditTrail
)

def create_company_database_schema(engine):
    """Create all tables for a company database"""
    CompanyBase.metadata.create_all(bind=engine)
