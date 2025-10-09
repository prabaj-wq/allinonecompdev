from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ValidationError
from typing import Optional
import psycopg2
import os
import hashlib
import secrets

router = APIRouter(prefix="/company-management", tags=["Company Management"])

class NewCompanyRequest(BaseModel):
    company_name: str
    industry: str
    environment_type: str = "development"  # Default value
    admin_username: str = "admin"  # Default value
    admin_email: Optional[str] = None
    admin_password: str = "admin123"  # Default value

@router.post("/create-company")
def create_new_company(company_data: dict):
    """Create a new company database with admin user"""
    print(f"Raw request data: {company_data}")
    
    try:
        # Generate default email if not provided
        if 'admin_email' not in company_data or not company_data['admin_email']:
            company_data['admin_email'] = f"admin@{company_data['company_name'].lower().replace(' ', '').replace('-', '')}.com"
        
        # Validate the request data
        validated_data = NewCompanyRequest(**company_data)
        print(f"Validated company creation request: {validated_data}")
    except ValidationError as e:
        print(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation error: {e.errors()}"
        )
    
    try:
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = 'root@123'
        
        # Generate company code
        company_code = validated_data.company_name[:3].upper() + str(secrets.randbelow(9000) + 1000)
        
        # Connect to main database to create company record
        main_conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database='epm_tool'
        )
        
        main_cur = main_conn.cursor()
        
        # Check if company already exists
        main_cur.execute("SELECT name FROM companies WHERE name = %s", (validated_data.company_name,))
        if main_cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company with this name already exists"
            )
        
        # Create company record in main database
        main_cur.execute("""
            INSERT INTO companies (name, code, industry, environment_type, status, created_at)
            VALUES (%s, %s, %s, %s, 'active', CURRENT_TIMESTAMP)
            RETURNING id
        """, (validated_data.company_name, company_code, validated_data.industry, validated_data.environment_type))
        
        company_id = main_cur.fetchone()[0]
        
        # Hash the admin password using bcrypt (same as auth.py)
        import bcrypt
        password_hash = bcrypt.hashpw(validated_data.admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create admin user in main database
        main_cur.execute("""
            INSERT INTO users (username, email, password_hash, company_id, role, created_at)
            VALUES (%s, %s, %s, %s, 'admin', CURRENT_TIMESTAMP)
        """, (validated_data.admin_username, validated_data.admin_email, password_hash, company_id))
        
        main_conn.commit()
        main_cur.close()
        main_conn.close()
        
        # Create company-specific database
        company_db_name = validated_data.company_name.lower().replace(' ', '_').replace('-', '_')
        
        # Connect as superuser to create new database
        super_conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database='postgres'
        )
        super_conn.autocommit = True
        super_cur = super_conn.cursor()
        
        # Create the new database
        super_cur.execute(f'CREATE DATABASE "{company_db_name}"')
        super_cur.close()
        super_conn.close()
        
        # Connect to the new database and create initial schema
        company_conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database=company_db_name
        )
        
        company_cur = company_conn.cursor()
        
        # Create comprehensive database schema
        create_tables_sql = """
        -- Entities table
        CREATE TABLE IF NOT EXISTS entities (
            id SERIAL PRIMARY KEY,
            entity_code VARCHAR(50) UNIQUE NOT NULL,
            entity_name VARCHAR(255) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            country VARCHAR(100),
            currency VARCHAR(10),
            hierarchy_id VARCHAR(50),
            parent_entity_id INTEGER,
            ownership_percentage DECIMAL(5,2),
            consolidation_method VARCHAR(50),
            functional_currency VARCHAR(10),
            reporting_currency VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Accounts table
        CREATE TABLE IF NOT EXISTS accounts (
            id SERIAL PRIMARY KEY,
            account_code VARCHAR(50) UNIQUE NOT NULL,
            account_name VARCHAR(255) NOT NULL,
            account_type VARCHAR(50) NOT NULL,
            description TEXT,
            hierarchy_id VARCHAR(50),
            parent_account_id INTEGER,
            account_category VARCHAR(100),
            normal_balance VARCHAR(10),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Hierarchies table
        CREATE TABLE IF NOT EXISTS hierarchies (
            id SERIAL PRIMARY KEY,
            hierarchy_id VARCHAR(50) UNIQUE NOT NULL,
            hierarchy_name VARCHAR(255) NOT NULL,
            hierarchy_type VARCHAR(50) NOT NULL,
            description TEXT,
            parent_hierarchy_id VARCHAR(50),
            level_number INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Trial Balance Entries
        CREATE TABLE IF NOT EXISTS tb_entries (
            id SERIAL PRIMARY KEY,
            entity_code VARCHAR(50) NOT NULL,
            account_code VARCHAR(50) NOT NULL,
            period VARCHAR(20) NOT NULL,
            year INTEGER NOT NULL,
            debit_amount DECIMAL(15,2) DEFAULT 0,
            credit_amount DECIMAL(15,2) DEFAULT 0,
            balance_amount DECIMAL(15,2) DEFAULT 0,
            currency VARCHAR(10),
            source_file VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(entity_code, account_code, period, year)
        );

        -- FST Templates
        CREATE TABLE IF NOT EXISTS fst_templates (
            id SERIAL PRIMARY KEY,
            template_name VARCHAR(255) NOT NULL,
            template_type VARCHAR(100) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- FST Elements
        CREATE TABLE IF NOT EXISTS fst_elements (
            id VARCHAR(100) PRIMARY KEY,
            template_id INTEGER REFERENCES fst_templates(id),
            element_name VARCHAR(255) NOT NULL,
            element_type VARCHAR(50) NOT NULL,
            calculation_formula TEXT,
            account_mapping JSONB,
            display_order INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Uploads tracking
        CREATE TABLE IF NOT EXISTS uploads (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            file_type VARCHAR(50),
            file_size INTEGER,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed BOOLEAN DEFAULT FALSE,
            entity_code VARCHAR(50),
            period VARCHAR(20),
            year INTEGER
        );

        -- Consolidation Settings
        CREATE TABLE IF NOT EXISTS consolidation_settings (
            id SERIAL PRIMARY KEY,
            setting_name VARCHAR(255) NOT NULL,
            setting_value TEXT,
            setting_type VARCHAR(50),
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Intercompany Transactions
        CREATE TABLE IF NOT EXISTS intercompany_transactions (
            id SERIAL PRIMARY KEY,
            transaction_id VARCHAR(100) UNIQUE NOT NULL,
            entity_from VARCHAR(50) NOT NULL,
            entity_to VARCHAR(50) NOT NULL,
            account_code VARCHAR(50) NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            currency VARCHAR(10),
            transaction_date DATE,
            description TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            elimination_status VARCHAR(50) DEFAULT 'not_eliminated',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Consolidation Journals
        CREATE TABLE IF NOT EXISTS consolidation_journals (
            id SERIAL PRIMARY KEY,
            journal_name VARCHAR(255) NOT NULL,
            journal_type VARCHAR(100) NOT NULL,
            period VARCHAR(20) NOT NULL,
            year INTEGER NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'draft',
            total_debit DECIMAL(15,2) DEFAULT 0,
            total_credit DECIMAL(15,2) DEFAULT 0,
            created_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_at TIMESTAMP,
            approved_by VARCHAR(100)
        );

        -- Consolidation Journal Entries
        CREATE TABLE IF NOT EXISTS consolidation_journal_entries (
            id SERIAL PRIMARY KEY,
            journal_id INTEGER REFERENCES consolidation_journals(id),
            line_number INTEGER NOT NULL,
            entity_code VARCHAR(50),
            account_code VARCHAR(50) NOT NULL,
            description TEXT,
            debit_amount DECIMAL(15,2) DEFAULT 0,
            credit_amount DECIMAL(15,2) DEFAULT 0,
            currency VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Asset Management
        CREATE TABLE IF NOT EXISTS assets (
            id SERIAL PRIMARY KEY,
            asset_code VARCHAR(50) UNIQUE NOT NULL,
            asset_name VARCHAR(255) NOT NULL,
            asset_category VARCHAR(100),
            asset_type VARCHAR(100),
            description TEXT,
            purchase_date DATE,
            purchase_cost DECIMAL(15,2),
            current_value DECIMAL(15,2),
            depreciation_method VARCHAR(50),
            useful_life INTEGER,
            location VARCHAR(255),
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_entities_code ON entities(entity_code);
        CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(account_code);
        CREATE INDEX IF NOT EXISTS idx_tb_entries_entity_period ON tb_entries(entity_code, period, year);
        CREATE INDEX IF NOT EXISTS idx_ic_transactions_entities ON intercompany_transactions(entity_from, entity_to);
        """
        
        # Execute all table creation statements
        company_cur.execute(create_tables_sql)
        
        # Insert sample data
        company_cur.execute("""
            INSERT INTO entities (entity_code, entity_name, entity_type, country, currency, hierarchy_id)
            VALUES (%s, %s, 'Parent', 'Canada', 'CAD', 'H1')
        """, (f"{validated_data.company_name}_001", f"{validated_data.company_name} Main Entity"))
        
        sample_accounts = [
            ("1000", "Cash and Cash Equivalents", "Asset", "Cash and bank balances", "A1"),
            ("2000", "Accounts Receivable", "Asset", "Trade receivables", "A2"),
            ("3000", "Inventory", "Asset", "Inventory assets", "A3"),
            ("4000", "Accounts Payable", "Liability", "Trade payables", "L1"),
            ("5000", "Revenue", "Revenue", "Operating revenue", "R1"),
            ("6000", "Cost of Sales", "Expense", "Direct costs", "E1")
        ]
        
        for account in sample_accounts:
            company_cur.execute("""
                INSERT INTO accounts (account_code, account_name, account_type, description, hierarchy_id)
                VALUES (%s, %s, %s, %s, %s)
            """, account)
        
        company_conn.commit()
        company_cur.close()
        company_conn.close()
        
        # Return success response
        return {
            "success": True,
            "message": "Company created successfully",
            "company_name": validated_data.company_name,
            "company_code": company_code,
            "username": validated_data.admin_username,
            "admin_email": validated_data.admin_email,
            "redirect": "/dashboard"
        }
        
    except psycopg2.Error as e:
        print(f"Database error creating company: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error creating company: {e}")
        print(f"Full traceback: {error_details}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create company: {str(e)}"
        )

@router.get("/check-company-name")
def check_company_name(company_name: str):
    """Check if company name is available"""
    try:
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = 'root@123'
        
        # Connect to main database
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database='epm_tool'
        )
        
        cur = conn.cursor()
        cur.execute("SELECT name FROM companies WHERE name = %s", (company_name,))
        exists = cur.fetchone() is not None
        cur.close()
        conn.close()
        
        return {
            "available": not exists,
            "message": "Company name is available" if not exists else "Company name already exists"
        }
        
    except Exception as e:
        print(f"Error checking company name: {e}")
        return {"available": True, "message": "Unable to check availability"}
