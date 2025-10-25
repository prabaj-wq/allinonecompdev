"""Shared utilities for journal entry modules"""

import json
import psycopg2
import os
from contextlib import contextmanager

def get_db_config():
    """Get database configuration for Docker environment"""
    if os.getenv('DOCKER_ENV') == 'true':
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
    else:
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')

    return {
        'host': POSTGRES_HOST,
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'root@123')
    }

def get_company_db_name(company_name: str) -> str:
    """Convert company name to database name"""
    return company_name.lower().replace(' ', '_').replace('-', '_')

@contextmanager
def get_company_connection(company_name: str):
    """Get database connection for specific company"""
    db_config = get_db_config()
    company_db_name = get_company_db_name(company_name)

    conn = None
    try:
        conn = psycopg2.connect(database=company_db_name, **db_config)
        conn.autocommit = False
        yield conn
    except psycopg2.OperationalError as e:
        if "does not exist" in str(e):
            try:
                default_conn = psycopg2.connect(database='postgres', **db_config)
                default_conn.autocommit = True
                cur = default_conn.cursor()
                cur.execute(f'CREATE DATABASE "{company_db_name}"')
                cur.close()
                default_conn.close()

                conn = psycopg2.connect(database=company_db_name, **db_config)
                conn.autocommit = False
                yield conn
            except Exception as create_error:
                raise Exception(f"Failed to create company database: {str(create_error)}")
        else:
            raise Exception(f"Database connection error: {str(e)}")
    finally:
        if conn:
            conn.close()

def generate_batch_number(conn):
    """Generate unique batch number"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COALESCE(MAX(CAST(SUBSTRING(batch_number FROM 3) AS INTEGER)), 0) + 1
        FROM journal_batches 
        WHERE batch_number LIKE 'JE%'
    """)
    next_number = cursor.fetchone()[0]
    return f"JE{next_number:06d}"

def update_batch_totals(conn, batch_id):
    """Update batch debit/credit totals"""
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE journal_batches 
        SET total_debits = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM journal_lines 
            WHERE batch_id = %s AND entry_type = 'debit'
        ),
        total_credits = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM journal_lines 
            WHERE batch_id = %s AND entry_type = 'credit'
        ),
        is_balanced = (
            (SELECT COALESCE(SUM(amount), 0) FROM journal_lines WHERE batch_id = %s AND entry_type = 'debit') =
            (SELECT COALESCE(SUM(amount), 0) FROM journal_lines WHERE batch_id = %s AND entry_type = 'credit')
        )
        WHERE id = %s
    """, (batch_id, batch_id, batch_id, batch_id, batch_id))

def log_audit_event(conn, batch_id, line_id, action_type, action_description, old_values=None, new_values=None, performed_by='system'):
    """Log audit trail event"""
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO journal_audit_logs (
            batch_id, line_id, action_type, action_description,
            old_values, new_values, performed_by
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        batch_id, line_id, action_type, action_description,
        json.dumps(old_values or {}), json.dumps(new_values or {}), performed_by
    ))

def is_period_locked(conn, fiscal_year, period, process_id, entity_id, scenario_id):
    """Check if period is locked"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT is_locked FROM journal_period_locks
        WHERE fiscal_year = %s AND period = %s
        AND (process_id = %s OR process_id IS NULL)
        AND (entity_id = %s OR entity_id IS NULL)
        AND (scenario_id = %s OR scenario_id IS NULL)
        ORDER BY process_id DESC NULLS LAST,
                 entity_id DESC NULLS LAST,
                 scenario_id DESC NULLS LAST
        LIMIT 1
    """, (fiscal_year, period, process_id, entity_id, scenario_id))
    result = cursor.fetchone()
    return result[0] if result else False

def create_journal_tables(conn):
    """Create comprehensive journal entry tables"""
    cursor = conn.cursor()
    
    # 1. Journal Categories
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_categories (
            id SERIAL PRIMARY KEY,
            category_code VARCHAR(50) UNIQUE NOT NULL,
            category_name VARCHAR(255) NOT NULL,
            description TEXT,
            color VARCHAR(20),
            icon VARCHAR(50),
            requires_attachments BOOLEAN DEFAULT FALSE,
            required_custom_fields JSONB DEFAULT '[]',
            default_approval_workflow_id INTEGER,
            default_debit_account VARCHAR(50),
            default_credit_account VARCHAR(50),
            metadata JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT TRUE,
            created_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP
        )
    """)
    
    # 2. Approval Workflows
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_approval_workflows (
            id SERIAL PRIMARY KEY,
            workflow_name VARCHAR(255) NOT NULL,
            amount_threshold DECIMAL(15,2),
            requires_all_approvers BOOLEAN DEFAULT FALSE,
            approver_levels JSONB DEFAULT '[]',
            categories JSONB DEFAULT '[]',
            entity_codes JSONB DEFAULT '[]',
            metadata JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT TRUE,
            created_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP
        )
    """)
    
    # 3. Journal Batches
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_batches (
            id SERIAL PRIMARY KEY,
            batch_number VARCHAR(50) UNIQUE NOT NULL,
            journal_reference VARCHAR(100),
            description TEXT,
            journal_date DATE NOT NULL,
            process_id INTEGER,
            entity_id VARCHAR(50),
            scenario_id INTEGER,
            fiscal_year VARCHAR(50),
            period VARCHAR(50),
            category_id INTEGER REFERENCES journal_categories(id),
            category VARCHAR(100),
            journal_type VARCHAR(50) DEFAULT 'manual',
            status VARCHAR(50) DEFAULT 'draft',
            workflow_status VARCHAR(50) DEFAULT 'pending',
            workflow_config JSONB DEFAULT '{}',
            created_by VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP,
            submitted_by VARCHAR(100),
            submitted_at TIMESTAMP,
            approved_by VARCHAR(100),
            approved_at TIMESTAMP,
            posted_by VARCHAR(100),
            posted_at TIMESTAMP,
            total_debits DECIMAL(15,2) DEFAULT 0,
            total_credits DECIMAL(15,2) DEFAULT 0,
            is_balanced BOOLEAN DEFAULT FALSE,
            recurring_template_id INTEGER,
            attachment_count INTEGER DEFAULT 0
        )
    """)
    
    # 4. Journal Lines
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_lines (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER REFERENCES journal_batches(id) ON DELETE CASCADE,
            line_number INTEGER NOT NULL,
            entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('debit', 'credit')),
            entity_code VARCHAR(50),
            entity_name VARCHAR(200),
            account_code VARCHAR(50),
            account_name VARCHAR(200),
            amount DECIMAL(15,2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            description TEXT,
            created_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP
        )
    """)
    
    # 5. Templates
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_templates (
            id SERIAL PRIMARY KEY,
            template_name VARCHAR(200) NOT NULL,
            template_code VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            category_id INTEGER REFERENCES journal_categories(id),
            is_active BOOLEAN DEFAULT TRUE,
            is_recurring BOOLEAN DEFAULT FALSE,
            recurrence_pattern VARCHAR(50),
            recurrence_end_date DATE,
            default_entity VARCHAR(50),
            default_scenario VARCHAR(50),
            template_lines JSONB DEFAULT '[]',
            created_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP
        )
    """)
    
    # 6. Audit Trail
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_audit_logs (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER REFERENCES journal_batches(id),
            line_id INTEGER REFERENCES journal_lines(id),
            action_type VARCHAR(50) NOT NULL,
            action_description TEXT,
            old_values JSONB DEFAULT '{}',
            new_values JSONB DEFAULT '{}',
            performed_by VARCHAR(100),
            performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address VARCHAR(50),
            user_agent TEXT
        )
    """)
    
    # 7. Attachments
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_attachments (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER REFERENCES journal_batches(id) ON DELETE CASCADE,
            filename VARCHAR(500),
            original_filename VARCHAR(500),
            file_path TEXT,
            file_size INTEGER,
            mime_type VARCHAR(100),
            uploaded_by VARCHAR(100),
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 8. Onboarding Checklist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_onboarding_checklist (
            id SERIAL PRIMARY KEY,
            process_id INTEGER,
            entity_id VARCHAR(50),
            scenario_id INTEGER,
            fiscal_year VARCHAR(50),
            period VARCHAR(50),
            categories_configured BOOLEAN DEFAULT FALSE,
            approvals_configured BOOLEAN DEFAULT FALSE,
            templates_created BOOLEAN DEFAULT FALSE,
            recurring_configured BOOLEAN DEFAULT FALSE,
            custom_fields_configured BOOLEAN DEFAULT FALSE,
            attachments_configured BOOLEAN DEFAULT FALSE,
            notes TEXT,
            metadata JSONB DEFAULT '{}',
            created_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modified_by VARCHAR(100),
            modified_at TIMESTAMP,
            UNIQUE(process_id, entity_id, scenario_id, fiscal_year, period)
        )
    """)
    
    # 9. Period Locks
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_period_locks (
            id SERIAL PRIMARY KEY,
            fiscal_year VARCHAR(50),
            period VARCHAR(50),
            process_id INTEGER,
            entity_id VARCHAR(50),
            scenario_id INTEGER,
            is_locked BOOLEAN DEFAULT FALSE,
            locked_by VARCHAR(100),
            locked_at TIMESTAMP,
            unlock_reason TEXT,
            UNIQUE(fiscal_year, period, process_id, entity_id, scenario_id)
        )
    """)
    
    conn.commit()
