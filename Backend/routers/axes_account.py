from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import text, create_engine
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, validator
from database import get_db, Company
import psycopg2
import psycopg2.extras
import os
import json
import re
from datetime import datetime
from contextlib import contextmanager

router = APIRouter(prefix="/axes-account", tags=["Axes Account"])

# Add a diagnostic endpoint
@router.get("/health")
async def health_check(company_name: str = Query(...)):
    """Check database connectivity and table status"""
    try:
        db_name = get_company_db_name(company_name)
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()

            # Check which tables exist
            cur.execute("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('axes_settings', 'hierarchies', 'hierarchy_nodes', 'axes_accounts')
                ORDER BY table_name
            """)
            existing_tables = [row[0] for row in cur.fetchall()]

            # Check all tables
            cur.execute("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            all_tables = [row[0] for row in cur.fetchall()]

            required_tables = ['axes_settings', 'hierarchies', 'hierarchy_nodes', 'axes_accounts']
            missing_tables = [t for t in required_tables if t not in existing_tables]

            return {
                "status": "healthy" if len(missing_tables) == 0 else "missing_tables",
                "database": db_name,
                "company": company_name,
                "required_tables": required_tables,
                "existing_tables": existing_tables,
                "missing_tables": missing_tables,
                "all_tables": all_tables
            }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

# ===== PYDANTIC MODELS =====

class CustomFieldDefinition(BaseModel):
    field_name: str
    field_label: Optional[str] = None
    field_type: str  # text, number, dropdown, sql_dropdown, boolean, date
    is_required: bool = False
    is_unique: bool = False
    default_value: Optional[str] = None
    dropdown_values: Optional[List[str]] = None
    sql_query: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None
    display_order: Optional[int] = 0

class AxesSettingsCreate(BaseModel):
    axes_type: str = "account"
    custom_fields: List[CustomFieldDefinition] = []
    linked_axes: Optional[List[str]] = None  # Links to other axes like 'account'

class AxesAccountCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    hierarchy_id: Optional[int] = None
    level: int = 0
    account_type: str = 'Standard'  # Default account type
    statement: str = 'balance_sheet'  # balance_sheet, cashflow, profit_and_loss, statement_of_changes_in_equity
    category: str = 'asset'  # asset, liability, equity, income, expense
    custom_fields: Dict[str, Any] = {}

    @validator('code')
    def validate_code(cls, v):
        if not re.match(r'^[A-Z0-9_]+$', v):
            raise ValueError('Code must contain only uppercase letters, numbers, and underscores')
        return v
    
    @validator('statement')
    def validate_statement(cls, v):
        valid_statements = ['balance_sheet', 'cashflow', 'profit_and_loss', 'statement_of_changes_in_equity']
        if v not in valid_statements:
            raise ValueError(f'Statement must be one of: {", ".join(valid_statements)}')
        return v
    
    @validator('category')
    def validate_category(cls, v):
        valid_categories = ['asset', 'liability', 'equity', 'income', 'expense']
        if v not in valid_categories:
            raise ValueError(f'Category must be one of: {", ".join(valid_categories)}')
        return v

class AxesAccountUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    node_id: Optional[int] = None  # For assigning accounts to hierarchy nodes
    hierarchy_id: Optional[int] = None  # For assigning accounts to hierarchies
    level: Optional[int] = None
    account_type: Optional[str] = None
    statement: Optional[str] = None
    category: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class AxesAccountResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str]
    parent_id: Optional[int]
    level: int
    account_type: str
    statement: str
    category: str
    custom_fields: Dict[str, Any]
    children: Optional[List['AxesAccountResponse']] = None
    created_at: datetime
    updated_at: datetime

# Enable forward references
AxesAccountResponse.model_rebuild()

# ===== DATABASE UTILITIES =====

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

def calculate_node_path(parent_id: int, node_id: int, company_name: str) -> str:
    """Calculate materialized path for a node"""
    if parent_id is None:
        return f"/{node_id}/"

    with get_company_connection(company_name) as conn:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT path FROM hierarchy_nodes
            WHERE id = %s AND company_id = %s
        """, (parent_id, company_name))

        parent_row = cur.fetchone()
        if parent_row:
            return f"{parent_row['path']}{node_id}/"
        else:
            return f"/{node_id}/"

def update_node_paths(node_id: int, company_name: str):
    """Update paths for all descendants of a node"""
    with get_company_connection(company_name) as conn:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get all descendants using the old path
        cur.execute("""
            WITH RECURSIVE descendants AS (
                SELECT id, parent_id, path, level
                FROM hierarchy_nodes
                WHERE id = %s AND company_id = %s

                UNION ALL

                SELECT n.id, n.parent_id, n.path, n.level
                FROM hierarchy_nodes n
                JOIN descendants d ON n.parent_id = d.id
                WHERE n.company_id = %s
            )
            SELECT * FROM descendants ORDER BY level
        """, (node_id, company_name, company_name))

        nodes = cur.fetchall()

        # Update paths for each node
        for node in nodes:
            new_path = calculate_node_path(node['parent_id'], node['id'], company_name)
            cur.execute("""
                UPDATE hierarchy_nodes
                SET path = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND company_id = %s
            """, (new_path, node['id'], company_name))

        conn.commit()

@contextmanager
def get_company_connection(company_name: str):
    """Get database connection for specific company"""
    db_config = get_db_config()
    company_db_name = get_company_db_name(company_name)

    conn = None
    try:
        # First try to connect to the company database
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        conn.autocommit = False
        yield conn
    except psycopg2.OperationalError as e:
        if "does not exist" in str(e):
            # Database doesn't exist, try to create it
            try:
                # Connect to default database to create company database
                default_conn = psycopg2.connect(
                    database='postgres',
                    **db_config
                )
                default_conn.autocommit = True
                cur = default_conn.cursor()
                cur.execute(f'CREATE DATABASE "{company_db_name}"')
                cur.close()
                default_conn.close()

                # Now connect to the new database
                conn = psycopg2.connect(
                    database=company_db_name,
                    **db_config
                )
                conn.autocommit = False
                yield conn
            except Exception as create_error:
                raise Exception(f"Failed to create company database: {str(create_error)}")
        else:
            raise Exception(f"Database connection error: {str(e)}")
        if conn:
            conn.rollback()
        raise Exception(f"Database error: {str(e)}")
    finally:
        if conn:
            conn.close()

def init_axes_tables(company_name: str):
    """Initialize axes tables for a company database"""
    print(f"🔧 Starting table initialization for company: {company_name}")
    with get_company_connection(company_name) as conn:
        cur = conn.cursor()
        print(f"✅ Database connection established")

        # Create axes_settings table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS axes_settings (
                id SERIAL PRIMARY KEY,
                axes_type VARCHAR(50) NOT NULL DEFAULT 'account',
                custom_fields JSONB DEFAULT '[]',
                linked_axes JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(axes_type)
            )
        """)

        # Add unique constraint on axes_type if it doesn't exist
        cur.execute("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'axes_settings_axes_type_key'
                ) THEN
                    ALTER TABLE axes_settings ADD CONSTRAINT axes_settings_axes_type_key UNIQUE (axes_type);
                END IF;
            END $$;
        """)

        # First, add missing columns to existing tables before creating new ones
        try:
            # Add company_id to hierarchies table if it exists
            cur.execute("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='hierarchies') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                      WHERE table_name='hierarchies' AND column_name='company_id') THEN
                            ALTER TABLE hierarchies ADD COLUMN company_id VARCHAR(255) DEFAULT 'Default Company';
                            UPDATE hierarchies SET company_id = 'Default Company' WHERE company_id IS NULL;
                            ALTER TABLE hierarchies ALTER COLUMN company_id SET NOT NULL;
                        END IF;
                    END IF;
                END $$;
            """)

            # Add company_id to hierarchy_nodes table if it exists
            cur.execute("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='hierarchy_nodes') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                      WHERE table_name='hierarchy_nodes' AND column_name='company_id') THEN
                            ALTER TABLE hierarchy_nodes ADD COLUMN company_id VARCHAR(255) DEFAULT 'Default Company';
                            UPDATE hierarchy_nodes SET company_id = 'Default Company' WHERE company_id IS NULL;
                            ALTER TABLE hierarchy_nodes ALTER COLUMN company_id SET NOT NULL;
                        END IF;

                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                      WHERE table_name='hierarchy_nodes' AND column_name='path') THEN
                            ALTER TABLE hierarchy_nodes ADD COLUMN path TEXT DEFAULT '';
                        END IF;

                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                      WHERE table_name='hierarchy_nodes' AND column_name='sort_order') THEN
                            ALTER TABLE hierarchy_nodes ADD COLUMN sort_order INTEGER DEFAULT 0;
                        END IF;
                    END IF;
                END $$;
            """)

            # Add company_id to axes_accounts table if it exists
            cur.execute("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='axes_accounts') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                      WHERE table_name='axes_accounts' AND column_name='company_id') THEN
                            ALTER TABLE axes_accounts ADD COLUMN company_id VARCHAR(255) DEFAULT 'Default Company';
                            UPDATE axes_accounts SET company_id = 'Default Company' WHERE company_id IS NULL;
                            ALTER TABLE axes_accounts ALTER COLUMN company_id SET NOT NULL;
                        END IF;

                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                                      WHERE table_name='axes_accounts' AND column_name='account_type') THEN
                            ALTER TABLE axes_accounts ADD COLUMN account_type VARCHAR(50) DEFAULT 'Standard';
                        END IF;


                    END IF;
                END $$;
            """)
        except Exception as e:
            print(f"Note: Column addition phase: {e}")

        # Fix foreign key constraint on axes_accounts.parent_id
        try:
            # Drop old constraint if it exists (pointing to axes_accounts)
            cur.execute("""
                DO $$
                BEGIN
                    -- Drop the old foreign key constraint if it exists
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE constraint_name = 'axes_accounts_parent_id_fkey'
                        AND table_name = 'axes_accounts'
                    ) THEN
                        ALTER TABLE axes_accounts DROP CONSTRAINT axes_accounts_parent_id_fkey;
                    END IF;

                    -- Add the correct foreign key constraint pointing to hierarchy_nodes
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE constraint_name = 'axes_accounts_parent_id_fkey_nodes'
                        AND table_name = 'axes_accounts'
                    ) THEN
                        ALTER TABLE axes_accounts
                        ADD CONSTRAINT axes_accounts_parent_id_fkey_nodes
                        FOREIGN KEY (parent_id) REFERENCES hierarchy_nodes(id) ON DELETE SET NULL;
                    END IF;
                END $$;
            """)
            print("✅ Fixed axes_accounts.parent_id foreign key constraint")
        except Exception as e:
            print(f"Note: Foreign key fix: {e}")

        # Create hierarchies table with company isolation
        cur.execute("""
            CREATE TABLE IF NOT EXISTS hierarchies (
                id SERIAL PRIMARY KEY,
                hierarchy_name VARCHAR(255) NOT NULL,
                hierarchy_type VARCHAR(100) DEFAULT 'account',
                description TEXT,
                company_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(hierarchy_name, company_id)
            )
        """)

        # Create index for company-scoped hierarchy queries
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_hierarchies_company
            ON hierarchies (company_id)
        """)

        # Create hierarchy_nodes table with Materialized Path pattern
        cur.execute("""
            CREATE TABLE IF NOT EXISTS hierarchy_nodes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(100) NOT NULL,
                parent_id INTEGER REFERENCES hierarchy_nodes(id) ON DELETE CASCADE,
                hierarchy_id INTEGER REFERENCES hierarchies(id) ON DELETE CASCADE,
                company_id VARCHAR(255) NOT NULL,
                path TEXT NOT NULL DEFAULT '',
                level INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(code, hierarchy_id, company_id)
            )
        """)

        # Create index for efficient path queries (using btree instead of gist for compatibility)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_path
            ON hierarchy_nodes (path)
        """)

        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_company_hierarchy
            ON hierarchy_nodes (company_id, hierarchy_id)
        """)

        # Create axes_accounts table with company isolation
        cur.execute("""
            CREATE TABLE IF NOT EXISTS axes_accounts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(100) NOT NULL,
                description TEXT,
                parent_id INTEGER REFERENCES hierarchy_nodes(id) ON DELETE SET NULL,
                node_id INTEGER REFERENCES hierarchy_nodes(id) ON DELETE SET NULL,
                hierarchy_id INTEGER REFERENCES hierarchies(id) ON DELETE SET NULL,
                company_id VARCHAR(255) NOT NULL,
                level INTEGER DEFAULT 0,
                is_leaf BOOLEAN DEFAULT TRUE,
                account_type VARCHAR(50) DEFAULT 'Standard',
                statement VARCHAR(50) DEFAULT 'balance_sheet',
                category VARCHAR(50) DEFAULT 'asset',
                custom_fields JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(code, company_id)
            )
        """)

        # Add missing columns if they don't exist (for existing tables)
        try:
            # Add node_id column
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'axes_accounts' AND column_name = 'node_id'
            """)
            if not cur.fetchone():
                print("🔧 Adding node_id column to axes_accounts table...")
                cur.execute("""
                    ALTER TABLE axes_accounts
                    ADD COLUMN node_id INTEGER REFERENCES hierarchy_nodes(id) ON DELETE SET NULL
                """)
                print("✅ node_id column added successfully")
            else:
                print("✅ node_id column already exists")
                
            # Add description column
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'axes_accounts' AND column_name = 'description'
            """)
            if not cur.fetchone():
                print("🔧 Adding description column to axes_accounts table...")
                cur.execute("""
                    ALTER TABLE axes_accounts
                    ADD COLUMN description TEXT
                """)
                print("✅ description column added successfully")
            else:
                print("✅ description column already exists")
                
            # Add statement column
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'axes_accounts' AND column_name = 'statement'
            """)
            if not cur.fetchone():
                print("🔧 Adding statement column to axes_accounts table...")
                cur.execute("""
                    ALTER TABLE axes_accounts
                    ADD COLUMN statement VARCHAR(50) DEFAULT 'balance_sheet'
                """)
                print("✅ statement column added successfully")
            else:
                print("✅ statement column already exists")
                
            # Add category column
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'axes_accounts' AND column_name = 'category'
            """)
            if not cur.fetchone():
                print("🔧 Adding category column to axes_accounts table...")
                cur.execute("""
                    ALTER TABLE axes_accounts
                    ADD COLUMN category VARCHAR(50) DEFAULT 'asset'
                """)
                print("✅ category column added successfully")
            else:
                print("✅ category column already exists")
                
        except Exception as e:
            print(f"⚠️ Error checking/adding columns: {e}")

        # Create indexes for efficient company-scoped queries
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_axes_accounts_company_hierarchy
            ON axes_accounts (company_id, hierarchy_id)
        """)

        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_axes_accounts_parent
            ON axes_accounts (parent_id, company_id)
        """)

        # Create performance indexes
        try:
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_hierarchies_company
                ON hierarchies (company_id)
            """)

            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_company_hierarchy
                ON hierarchy_nodes (company_id, hierarchy_id)
            """)

            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_axes_accounts_company_hierarchy
                ON axes_accounts (company_id, hierarchy_id)
            """)
        except Exception as e:
            print(f"Note: Index creation: {e}")

        # Create indexes for performance
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_axes_accounts_parent_id ON axes_accounts(parent_id);
            CREATE INDEX IF NOT EXISTS idx_axes_accounts_code ON axes_accounts(code);
            CREATE INDEX IF NOT EXISTS idx_axes_accounts_level ON axes_accounts(level);
        """)

        # Create trigger for updating updated_at
        cur.execute("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        """)

        cur.execute("""
            DROP TRIGGER IF EXISTS update_axes_accounts_updated_at ON axes_accounts;
            CREATE TRIGGER update_axes_accounts_updated_at
                BEFORE UPDATE ON axes_accounts
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        """)

        cur.execute("""
            DROP TRIGGER IF EXISTS update_axes_settings_updated_at ON axes_settings;
            CREATE TRIGGER update_axes_settings_updated_at
                BEFORE UPDATE ON axes_settings
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        """)

        conn.commit()

def validate_sql_query(sql_query: str) -> bool:
    """Validate SQL query for security (only allow SELECT statements)"""
    # Remove comments and normalize whitespace
    cleaned_query = re.sub(r'--.*?$', '', sql_query, flags=re.MULTILINE)
    cleaned_query = re.sub(r'/\*.*?\*/', '', cleaned_query, flags=re.DOTALL)
    cleaned_query = cleaned_query.strip().upper()

    # Check if it starts with SELECT
    if not cleaned_query.startswith('SELECT'):
        return False

    # Check for dangerous keywords
    dangerous_keywords = [
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
        'TRUNCATE', 'EXEC', 'EXECUTE', 'DECLARE', 'CURSOR'
    ]

    for keyword in dangerous_keywords:
        if keyword in cleaned_query:
            return False

    return True

async def add_custom_field_column(cur, field: CustomFieldDefinition):
    """Add a new column to axes_accounts table for a custom field"""
    try:
        # Map field types to PostgreSQL types
        type_mapping = {
            'text': 'TEXT',
            'textarea': 'TEXT',
            'number': 'NUMERIC',
            'date': 'DATE',
            'select': 'VARCHAR(255)',
            'boolean': 'BOOLEAN',
            'sql_dropdown': 'VARCHAR(255)',
            'sql_query': 'VARCHAR(255)'
        }

        pg_type = type_mapping.get(field.field_type, 'TEXT')
        column_name = field.field_name.lower()

        # Validate column name (alphanumeric and underscore only)
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', column_name):
            raise ValueError(f"Invalid column name: {column_name}")

        # Check if column already exists
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'axes_accounts' AND column_name = %s
        """, (column_name,))

        if not cur.fetchone():
            # Add the column
            default_value = ""
            if field.field_type == 'boolean':
                default_value = "DEFAULT FALSE"
            elif hasattr(field, 'default_value') and field.default_value:
                default_value = f"DEFAULT '{field.default_value}'"

            alter_query = f"ALTER TABLE axes_accounts ADD COLUMN {column_name} {pg_type} {default_value}"
            cur.execute(alter_query)
            print(f"✅ Added column {column_name} ({pg_type}) to axes_accounts table")

    except Exception as e:
        print(f"❌ Error adding column {field.field_name}: {str(e)}")
        raise

async def remove_custom_field_column(cur, field_name: str):
    """Remove a column from axes_accounts table for a deleted custom field"""
    try:
        column_name = field_name.lower()

        # Validate column name
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', column_name):
            return  # Skip invalid column names

        # Check if column exists
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'axes_accounts' AND column_name = %s
        """, (column_name,))

        if cur.fetchone():
            # Remove the column
            alter_query = f"ALTER TABLE axes_accounts DROP COLUMN IF EXISTS {column_name}"
            cur.execute(alter_query)
            print(f"✅ Removed column {column_name} from axes_accounts table")

    except Exception as e:
        print(f"❌ Error removing column {field_name}: {str(e)}")
        # Don't raise here to avoid breaking the entire operation

def get_custom_field_columns(cur, company_name: str) -> dict:
    """Get custom field column information from axes_settings"""
    try:
        cur.execute("SELECT custom_fields FROM axes_settings WHERE axes_type = 'account'")
        result = cur.fetchone()
        if result and result['custom_fields']:
            custom_fields = json.loads(result['custom_fields']) if isinstance(result['custom_fields'], str) else result['custom_fields']
            return {field.get('field_name'): field for field in custom_fields if field.get('field_name')}
        return {}
    except Exception as e:
        print(f"❌ Error getting custom field columns: {str(e)}")
        return {}

def build_account_insert_query(custom_fields_config: dict, account_data: dict) -> tuple:
    """Build dynamic INSERT query for account with custom fields"""
    base_columns = ['name', 'code', 'description', 'parent_id', 'hierarchy_id', 'company_id', 'level', 'is_leaf', 'account_type', 'statement', 'category']
    base_values = [
        account_data.get('name'),
        account_data.get('code'),
        account_data.get('description', ''),
        account_data.get('parent_id'),
        account_data.get('hierarchy_id'),
        account_data.get('company_id'),
        account_data.get('level', 0),
        account_data.get('is_leaf', True),
        account_data.get('account_type', 'Standard'),
        account_data.get('statement', 'balance_sheet'),
        account_data.get('category', 'asset')
    ]

    # Add custom field columns and values
    custom_columns = []
    custom_values = []
    custom_fields_data = account_data.get('custom_fields', {})

    for field_name, field_config in custom_fields_config.items():
        column_name = field_name.lower()
        custom_columns.append(column_name)

        # Get value from custom_fields or use default
        value = custom_fields_data.get(field_name, field_config.get('default_value', '') or '')

        # Convert value based on field type
        if field_config.get('field_type') == 'boolean':
            value = bool(value) if value else False
        elif field_config.get('field_type') == 'number':
            value = float(value) if value else None
        elif field_config.get('field_type') == 'date':
            # Convert empty date strings to None (NULL in database)
            value = value if value and value.strip() else None

        custom_values.append(value)

    all_columns = base_columns + custom_columns
    all_values = base_values + custom_values

    columns_str = ', '.join(all_columns)
    placeholders = ', '.join(['%s'] * len(all_columns))

    query = f"INSERT INTO axes_accounts ({columns_str}) VALUES ({placeholders}) RETURNING *"

    return query, all_values

def build_account_update_query(custom_fields_config: dict, account_data: dict, account_id: int) -> tuple:
    """Build dynamic UPDATE query for account with custom fields"""
    base_updates = []
    values = []

    # Base fields that can be updated
    updatable_fields = ['name', 'code', 'description', 'parent_id', 'hierarchy_id', 'level', 'is_leaf', 'account_type', 'statement', 'category', 'node_id']

    for field in updatable_fields:
        if field in account_data:
            base_updates.append(f"{field} = %s")
            values.append(account_data[field])

    # Add custom field updates
    custom_fields_data = account_data.get('custom_fields', {})

    for field_name, field_config in custom_fields_config.items():
        column_name = field_name.lower()

        if field_name in custom_fields_data:
            base_updates.append(f"{column_name} = %s")

            # Convert value based on field type
            value = custom_fields_data[field_name]
            if field_config.get('field_type') == 'boolean':
                value = bool(value) if value else False
            elif field_config.get('field_type') == 'number':
                value = float(value) if value else None
            elif field_config.get('field_type') == 'date':
                # Convert empty date strings to None (NULL in database)
                value = value if value and value.strip() else None

            values.append(value)

    if not base_updates:
        return None, []

    updates_str = ', '.join(base_updates)
    values.append(account_id)  # Add account_id for WHERE clause

    query = f"UPDATE axes_accounts SET {updates_str} WHERE id = %s RETURNING *"

    return query, values

def build_account_select_query(custom_fields_config: dict, where_clause: str = "", params: list = None) -> tuple:
    """Build dynamic SELECT query for accounts with custom fields"""
    base_columns = ['id', 'name', 'code', 'description', 'parent_id', 'hierarchy_id', 'company_id', 'level', 'is_leaf', 'account_type', 'statement', 'category', 'node_id', 'created_at', 'updated_at']

    # Add custom field columns
    custom_columns = [field_name.lower() for field_name in custom_fields_config.keys()]

    all_columns = base_columns + custom_columns
    columns_str = ', '.join(all_columns)

    query = f"SELECT {columns_str} FROM axes_accounts"

    if where_clause:
        query += f" WHERE {where_clause}"

    return query, params or []

def convert_account_result_to_dict(row: dict, custom_fields_config: dict) -> dict:
    """Convert database row to account dict with custom_fields object"""
    if not row:
        return {}

    # Base account fields
    account = {
        'id': row.get('id'),
        'name': row.get('name'),
        'code': row.get('code'),
        'parent_id': row.get('parent_id'),
        'hierarchy_id': row.get('hierarchy_id'),
        'company_id': row.get('company_id'),
        'level': row.get('level'),
        'is_leaf': row.get('is_leaf'),
        'account_type': row.get('account_type'),
        'node_id': row.get('node_id'),
        'created_at': row.get('created_at'),
        'updated_at': row.get('updated_at'),
        'custom_fields': {}
    }

    # Extract custom field values
    for field_name in custom_fields_config.keys():
        column_name = field_name.lower()
        if column_name in row:
            account['custom_fields'][field_name] = row[column_name]

    return account

# ===== API ENDPOINTS =====

@router.post("/init")
async def initialize_axes_tables_endpoint(company_name: str = Query(...)):
    """Initialize axes tables for a company"""
    try:
        print(f"🔄 Initializing axes tables for company: {company_name}")
        init_axes_tables(company_name)
        print(f"✅ Axes tables initialized successfully for company: {company_name}")

        # Verify tables were created
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('axes_settings', 'hierarchies', 'hierarchy_nodes', 'axes_accounts')
                ORDER BY table_name
            """)
            tables = [row[0] for row in cur.fetchall()]
            print(f"📋 Tables found: {tables}")

        return {
            "message": f"Axes tables initialized successfully for company: {company_name}",
            "tables_created": tables,
            "company_db": get_company_db_name(company_name)
        }
    except Exception as e:
        import traceback
        print(f"❌ Error initializing tables: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize axes tables: {str(e)}"
        )

@router.get("/settings")
async def get_axes_settings(company_name: str = Query(...)):
    """Get axes settings for a company"""
    try:
        # Ensure all tables exist first
        init_axes_tables(company_name)

        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            cur.execute("""
                SELECT * FROM axes_settings WHERE axes_type = 'account'
            """)
            settings = cur.fetchone()

            if not settings:
                # Create default settings
                default_settings = {
                    'axes_type': 'account',
                    'custom_fields': [],
                    'linked_axes': []
                }

                cur.execute("""
                    INSERT INTO axes_settings (axes_type, custom_fields, linked_axes)
                    VALUES (%(axes_type)s, %(custom_fields)s, %(linked_axes)s)
                    RETURNING *
                """, default_settings)
                settings = cur.fetchone()
                conn.commit()

            return dict(settings)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get axes settings: {str(e)}"
        )

@router.post("/settings")
async def update_axes_settings(
    settings: AxesSettingsCreate,
    company_name: str = Query(...)
):
    """Update axes settings for a company and create database columns for custom fields"""
    try:
        # Validate SQL queries in custom fields
        for field in settings.custom_fields:
            if field.field_type == 'sql_dropdown' and field.sql_query:
                if not validate_sql_query(field.sql_query):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid SQL query in field {field.field_name}"
                    )

        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get existing custom fields to compare
            cur.execute("SELECT custom_fields FROM axes_settings WHERE axes_type = %s", (settings.axes_type,))
            existing_settings = cur.fetchone()
            existing_fields = []
            if existing_settings and existing_settings['custom_fields']:
                existing_fields = json.loads(existing_settings['custom_fields']) if isinstance(existing_settings['custom_fields'], str) else existing_settings['custom_fields']

            existing_field_names = {field.get('field_name') for field in existing_fields}
            new_field_names = {field.field_name for field in settings.custom_fields}

            # Add new columns for new custom fields
            for field in settings.custom_fields:
                if field.field_name not in existing_field_names:
                    await add_custom_field_column(cur, field)

            # Remove columns for deleted custom fields
            deleted_fields = existing_field_names - new_field_names
            for field_name in deleted_fields:
                if field_name:  # Ensure field_name is not None or empty
                    await remove_custom_field_column(cur, field_name)

            # Convert Pydantic models to dict for JSON storage
            custom_fields_json = [field.dict() for field in settings.custom_fields]

            cur.execute("""
                INSERT INTO axes_settings (axes_type, custom_fields, linked_axes)
                VALUES (%s, %s, %s)
                ON CONFLICT (axes_type)
                DO UPDATE SET
                    custom_fields = EXCLUDED.custom_fields,
                    linked_axes = EXCLUDED.linked_axes,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            """, (
                settings.axes_type,
                json.dumps(custom_fields_json),
                json.dumps(settings.linked_axes or [])
            ))

            result = cur.fetchone()
            conn.commit()

            return dict(result)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update axes settings: {str(e)}"
        )

@router.get("/dropdown-values")
async def get_dropdown_values(
    field_name: str = Query(...),
    sql_query: str = Query(...),
    company_name: str = Query(...)
):
    """Execute SQL query to get dropdown values for custom fields"""
    try:
        # Validate SQL query
        if not validate_sql_query(sql_query):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid SQL query. Only SELECT statements are allowed."
            )

        with get_company_connection(company_name) as conn:
            cur = conn.cursor()

            # Replace placeholder for active company
            processed_query = sql_query.replace(':active_company_id', f"'{company_name}'")

            cur.execute(processed_query)
            results = cur.fetchall()

            # Extract values (assuming single column result)
            values = [row[0] for row in results if row[0] is not None]

            return {"field_name": field_name, "values": values}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute dropdown query: {str(e)}"
        )

@router.get("/elements")
async def get_account_elements(
    company_name: str = Query(...),
    hierarchy_id: Optional[int] = Query(None)
):
    """Get account elements for dropdowns - simplified format"""
    try:
        ensure_tables_exist(company_name)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get accounts with hierarchy info
            query = """
                SELECT 
                    a.id,
                    a.account_code as code,
                    a.account_name as name,
                    a.account_code,
                    a.account_name,
                    a.account_type,
                    a.statement,
                    a.category,
                    h.hierarchy_name,
                    h.id as hierarchy_id
                FROM account_axes a
                LEFT JOIN hierarchies h ON a.hierarchy_id = h.id
                WHERE a.is_active = true
            """
            params = []
            
            if hierarchy_id:
                query += " AND a.hierarchy_id = %s"
                params.append(hierarchy_id)
            
            query += " ORDER BY a.account_code"
            
            cur.execute(query, params)
            accounts = cur.fetchall()
            
            return [dict(account) for account in accounts]
            
    except Exception as e:
        print(f"Error getting account elements: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get account elements: {str(e)}"
        )

@router.get("/accounts")
async def get_accounts(
    company_name: str = Query(...),
    hierarchy_id: Optional[int] = Query(None),
    parent_id: Optional[int] = Query(None),
    node_id: Optional[int] = Query(None),
    level: Optional[int] = Query(None),
    include_children: bool = Query(False)
):
    """Get accounts with optional filtering and hierarchical structure"""
    try:
        # Ensure all tables exist first
        init_axes_tables(company_name)

        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get custom field configuration for dynamic queries
            custom_fields_config = get_custom_field_columns(cur, company_name)

            if include_children:
                # Get hierarchical structure using recursive CTE
                cur.execute("""
                    WITH RECURSIVE account_hierarchy AS (
                        -- Base case: root accounts
                        SELECT id, name, code, parent_id, level, is_leaf, custom_fields,
                               created_at, updated_at, 0 as depth
                        FROM axes_accounts
                        WHERE parent_id IS NULL

                        UNION ALL

                        -- Recursive case: children
                        SELECT a.id, a.name, a.code, a.parent_id, a.level, a.is_leaf,
                               a.custom_fields, a.created_at, a.updated_at, ah.depth + 1
                        FROM axes_accounts a
                        INNER JOIN account_hierarchy ah ON a.parent_id = ah.id
                    )
                    SELECT * FROM account_hierarchy ORDER BY level, name
                """)
            else:
                # Simple query with optional filters
                where_conditions = ["company_id = %s"]
                params = [company_name]

                if hierarchy_id is not None:
                    where_conditions.append("hierarchy_id = %s")
                    params.append(hierarchy_id)

                if parent_id is not None:
                    where_conditions.append("parent_id = %s")
                    params.append(parent_id)

                if node_id is not None:
                    where_conditions.append("node_id = %s")
                    params.append(node_id)

                if level is not None:
                    where_conditions.append("level = %s")
                    params.append(level)

                # Build dynamic query with custom fields
                where_clause = ' AND '.join(where_conditions)
                query, query_params = build_account_select_query(custom_fields_config, where_clause, params)
                query += " ORDER BY level, name"

                cur.execute(query, query_params)
                accounts = cur.fetchall()

                # Convert to list of dicts with custom fields properly formatted
                result = [convert_account_result_to_dict(dict(account), custom_fields_config) for account in accounts]

            return {"accounts": result, "total": len(result)}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get accounts: {str(e)}"
        )

@router.post("/accounts")
async def create_account(
    account: AxesAccountCreate,
    company_name: str = Query(...)
):
    """Create a new account"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Check if code already exists for this company
            cur.execute("SELECT id FROM axes_accounts WHERE code = %s AND company_id = %s", (account.code, company_name))
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Account with code '{account.code}' already exists"
                )

            # If parent_id is provided, calculate level from parent
            if account.parent_id:
                # Check if parent is a hierarchy node or account
                cur.execute("""
                    SELECT level FROM hierarchy_nodes
                    WHERE id = %s AND company_id = %s
                """, (account.parent_id, company_name))
                parent_result = cur.fetchone()
                if parent_result:
                    account.level = parent_result['level'] + 1
                else:
                    # Check if parent is an account
                    cur.execute("""
                        SELECT level FROM axes_accounts
                        WHERE id = %s AND company_id = %s
                    """, (account.parent_id, company_name))
                    parent_result = cur.fetchone()
                    if parent_result:
                        account.level = parent_result['level'] + 1
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Parent with ID {account.parent_id} not found"
                        )

            # Get custom field configuration
            custom_fields_config = get_custom_field_columns(cur, company_name)

            # Prepare account data for dynamic query
            account_data = {
                'name': account.name,
                'code': account.code,
                'description': account.description,
                'parent_id': account.parent_id,
                'hierarchy_id': account.hierarchy_id,
                'company_id': company_name,
                'level': account.level,
                'is_leaf': True,
                'account_type': account.account_type,
                'statement': account.statement,
                'category': account.category,
                'custom_fields': account.custom_fields
            }

            # Build and execute dynamic insert query
            query, values = build_account_insert_query(custom_fields_config, account_data)
            cur.execute(query, values)

            new_account = cur.fetchone()
            conn.commit()

            return dict(new_account)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create account: {str(e)}"
        )

@router.get("/accounts/{account_id}")
async def get_account(
    account_id: int,
    company_name: str = Query(...),
    include_children: bool = Query(False)
):
    """Get a specific account by ID"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get custom field configuration for dynamic queries
            custom_fields_config = get_custom_field_columns(cur, company_name)

            # Build dynamic query for single account
            query, params = build_account_select_query(custom_fields_config, "id = %s", [account_id])
            cur.execute(query, params)

            account = cur.fetchone()
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Account with ID {account_id} not found"
                )

            # Convert result to expected format
            result = convert_account_result_to_dict(dict(account), custom_fields_config)

            if include_children:
                # Build dynamic query for children
                children_query, children_params = build_account_select_query(custom_fields_config, "parent_id = %s", [account_id])
                children_query += " ORDER BY name"
                cur.execute(children_query, children_params)

                children = cur.fetchall()
                result['children'] = [convert_account_result_to_dict(dict(child), custom_fields_config) for child in children]

            return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get account: {str(e)}"
        )

@router.put("/accounts/{account_id}")
async def update_account(
    account_id: int,
    account_update: AxesAccountUpdate,
    company_name: str = Query(...)
):
    """Update an existing account"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Check if account exists for this company
            cur.execute("SELECT * FROM axes_accounts WHERE id = %s AND company_id = %s", (account_id, company_name))
            existing_account = cur.fetchone()
            if not existing_account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Account with ID {account_id} not found"
                )

            # Get custom field configuration for dynamic updates
            custom_fields_config = get_custom_field_columns(cur, company_name)

            # Prepare account data for dynamic update
            account_data = {}

            if account_update.name is not None:
                account_data['name'] = account_update.name

            if account_update.code is not None:
                # Check if new code already exists (excluding current account) for this company
                cur.execute("SELECT id FROM axes_accounts WHERE code = %s AND id != %s AND company_id = %s",
                           (account_update.code, account_id, company_name))
                if cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Account with code '{account_update.code}' already exists"
                    )
                account_data['code'] = account_update.code

            if account_update.parent_id is not None:
                account_data['parent_id'] = account_update.parent_id

            if account_update.level is not None:
                account_data['level'] = account_update.level

            # Check if node_id was provided in the request (even if it's None)
            if 'node_id' in account_update.__fields_set__:
                account_data['node_id'] = account_update.node_id

            if account_update.hierarchy_id is not None:
                account_data['hierarchy_id'] = account_update.hierarchy_id

            if account_update.account_type is not None:
                account_data['account_type'] = account_update.account_type


            # Include custom fields for dynamic column updates
            if account_update.custom_fields is not None:
                account_data['custom_fields'] = account_update.custom_fields

            if not account_data:
                return dict(existing_account)

            # Build and execute dynamic update query
            query, values = build_account_update_query(custom_fields_config, account_data, account_id)

            if query is None:
                return dict(existing_account)

            cur.execute(query, values)
            updated_account = cur.fetchone()
            conn.commit()

            # Convert result back to expected format
            result = convert_account_result_to_dict(dict(updated_account), custom_fields_config)
            return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update account: {str(e)}"
        )

@router.delete("/accounts/{account_id}")
async def delete_account(
    account_id: int,
    company_name: str = Query(...),
    cascade: bool = Query(False)
):
    """Delete an account (with optional cascade delete of children)"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Check if account exists
            cur.execute("SELECT * FROM axes_accounts WHERE id = %s", (account_id,))
            account = cur.fetchone()
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Account with ID {account_id} not found"
                )

            # Check for children
            cur.execute("SELECT COUNT(*) as child_count FROM axes_accounts WHERE parent_id = %s", (account_id,))
            child_count = cur.fetchone()['child_count']

            if child_count > 0 and not cascade:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Account has {child_count} children. Use cascade=true to delete all children."
                )

            # Delete account (CASCADE constraint will handle children if cascade=true)
            cur.execute("DELETE FROM axes_accounts WHERE id = %s", (account_id,))

            # Update parent's is_leaf status if this was the last child
            if account['parent_id']:
                cur.execute("""
                    SELECT COUNT(*) as sibling_count
                    FROM axes_accounts
                    WHERE parent_id = %s AND id != %s
                """, (account['parent_id'], account_id))

                sibling_count = cur.fetchone()['sibling_count']
                if sibling_count == 0:
                    cur.execute("""
                        UPDATE axes_accounts
                        SET is_leaf = TRUE
                        WHERE id = %s
                    """, (account['parent_id'],))

            conn.commit()

            return {
                "message": f"Account '{account['name']}' deleted successfully",
                "deleted_account": dict(account)
            }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )

@router.get("/hierarchy-tree")
async def get_hierarchy_tree(company_name: str = Query(...)):
    """Get complete hierarchy tree structure"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get all accounts
            cur.execute("""
                SELECT id, name, code, parent_id, level, is_leaf, custom_fields,
                       created_at, updated_at
                FROM axes_accounts
                ORDER BY level, name
            """)

            accounts = cur.fetchall()

            # Build tree structure
            account_dict = {account['id']: dict(account) for account in accounts}

            # Add children arrays
            for account in account_dict.values():
                account['children'] = []

            # Build parent-child relationships
            root_accounts = []
            for account in account_dict.values():
                if account['parent_id'] is None:
                    root_accounts.append(account)
                else:
                    parent = account_dict.get(account['parent_id'])
                    if parent:
                        parent['children'].append(account)

            return {
                "tree": root_accounts,
                "total_accounts": len(accounts),
                "max_level": max([a['level'] for a in accounts], default=0)
            }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get hierarchy tree: {str(e)}"
        )

@router.post("/validate-sql")
async def validate_sql_endpoint(
    sql_query: str = Query(...),
    company_name: str = Query(...)
):
    """Validate SQL query for dropdown fields"""
    try:
        return validate_sql_query(sql_query, company_name)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to validate SQL: {str(e)}"
        )

# ===== HIERARCHY MANAGEMENT =====

class HierarchyCreate(BaseModel):
    hierarchy_name: str
    hierarchy_type: str = "account"
    description: Optional[str] = None

class HierarchyResponse(BaseModel):
    id: int
    hierarchy_name: str
    hierarchy_type: str
    description: Optional[str]
    account_count: int = 0
    created_at: datetime
    updated_at: datetime

@router.get("/hierarchies")
async def get_hierarchies(company_name: str = Query(...)):
    """Get all hierarchies for a company"""
    try:
        # Ensure all tables exist first
        init_axes_tables(company_name)

        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get account hierarchies only with account counts
            cur.execute("""
                SELECT
                    h.*,
                    COALESCE(COUNT(a.id), 0) as account_count
                FROM hierarchies h
                LEFT JOIN axes_accounts a ON a.hierarchy_id = h.id AND a.company_id = %s
                WHERE h.company_id = %s AND h.hierarchy_type = 'account'
                GROUP BY h.id, h.hierarchy_name, h.hierarchy_type, h.description, h.created_at, h.updated_at
                ORDER BY h.hierarchy_name
            """, (company_name, company_name))

            hierarchies = cur.fetchall()
            conn.commit()

            return {"hierarchies": hierarchies}

    except Exception as e:
        import traceback
        print(f"Error in get_hierarchies: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get hierarchies: {str(e)}"
        )

@router.post("/hierarchies")
async def create_hierarchy(
    hierarchy: HierarchyCreate,
    company_name: str = Query(...)
):
    """Create a new hierarchy"""
    try:
        # Ensure all tables exist first
        init_axes_tables(company_name)

        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Insert new hierarchy
            cur.execute("""
                INSERT INTO hierarchies (hierarchy_name, hierarchy_type, description, company_id)
                VALUES (%s, %s, %s, %s)
                RETURNING *
            """, (hierarchy.hierarchy_name, hierarchy.hierarchy_type, hierarchy.description, company_name))

            new_hierarchy = cur.fetchone()
            conn.commit()

            return {"hierarchy": new_hierarchy, "message": "Hierarchy created successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create hierarchy: {str(e)}"
        )

@router.put("/hierarchies/{hierarchy_id}")
async def update_hierarchy(
    hierarchy_id: int,
    hierarchy_data: dict,
    company_name: str = Query(...)
):
    """Update a hierarchy"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Check if hierarchy exists
            cur.execute("SELECT * FROM hierarchies WHERE id = %s AND company_id = %s", (hierarchy_id, company_name))
            existing_hierarchy = cur.fetchone()

            if not existing_hierarchy:
                raise HTTPException(status_code=404, detail="Hierarchy not found")

            # Update hierarchy
            hierarchy_name = hierarchy_data.get('hierarchy_name', existing_hierarchy['hierarchy_name'])
            hierarchy_type = hierarchy_data.get('hierarchy_type', existing_hierarchy['hierarchy_type'])
            description = hierarchy_data.get('description', existing_hierarchy['description'])

            cur.execute("""
                UPDATE hierarchies
                SET hierarchy_name = %s, hierarchy_type = %s, description = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND company_id = %s
                RETURNING *
            """, (hierarchy_name, hierarchy_type, description, hierarchy_id, company_name))

            updated_hierarchy = cur.fetchone()
            conn.commit()

            return {"hierarchy": dict(updated_hierarchy), "message": "Hierarchy updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update hierarchy: {str(e)}"
        )

@router.delete("/hierarchies/{hierarchy_id}")
async def delete_hierarchy(
    hierarchy_id: int,
    company_name: str = Query(...),
    cascade: bool = Query(False)
):
    """Delete a hierarchy and optionally cascade delete accounts"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()

            if cascade:
                # Delete all accounts in this hierarchy first
                cur.execute("DELETE FROM axes_accounts WHERE hierarchy_id = %s AND company_id = %s", (hierarchy_id, company_name))
                # Delete all nodes in this hierarchy
                cur.execute("DELETE FROM hierarchy_nodes WHERE hierarchy_id = %s AND company_id = %s", (hierarchy_id, company_name))
            else:
                # Check if hierarchy has accounts
                cur.execute("SELECT COUNT(*) FROM axes_accounts WHERE hierarchy_id = %s AND company_id = %s", (hierarchy_id, company_name))
                account_count = cur.fetchone()[0]
                # Check if hierarchy has nodes
                cur.execute("SELECT COUNT(*) FROM hierarchy_nodes WHERE hierarchy_id = %s AND company_id = %s", (hierarchy_id, company_name))
                node_count = cur.fetchone()[0]

                if account_count > 0 or node_count > 0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot delete hierarchy with {account_count} accounts and {node_count} nodes. Use cascade=true to force delete."
                    )

            # Delete the hierarchy
            cur.execute("DELETE FROM hierarchies WHERE id = %s AND company_id = %s", (hierarchy_id, company_name))
            conn.commit()

            return {"message": "Hierarchy deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete hierarchy: {str(e)}"
        )

@router.get("/hierarchy-structure/{hierarchy_id}")
async def get_hierarchy_structure(
    hierarchy_id: int,
    company_name: str = Query(...)
):
    """Get hierarchy structure with nodes and unassigned accounts"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Get all hierarchy nodes for this company using materialized path ordering
            cur.execute("""
                SELECT * FROM hierarchy_nodes
                WHERE hierarchy_id = %s AND company_id = %s
                ORDER BY path, sort_order, name
            """, (hierarchy_id, company_name))

            nodes_data = cur.fetchall()

            # Get all accounts in this hierarchy for this company
            cur.execute("""
                SELECT * FROM axes_accounts
                WHERE hierarchy_id = %s AND company_id = %s
                ORDER BY level, name
            """, (hierarchy_id, company_name))

            accounts_data = cur.fetchall()

            # Build hierarchical structure for nodes
            nodes_by_parent = {}
            for node in nodes_data:
                parent_id = node['parent_id']
                if parent_id not in nodes_by_parent:
                    nodes_by_parent[parent_id] = []
                nodes_by_parent[parent_id].append(node)

            # Group accounts by node_id (accounts assigned to hierarchy nodes)
            accounts_by_node = {}
            unassigned_accounts = []

            for account in accounts_data:
                node_id = account['node_id']
                if node_id is None:
                    # Account not assigned to any node
                    unassigned_accounts.append({
                        "id": account['id'],
                        "name": account['name'],
                        "code": account['code'],
                        "account_type": account['account_type'],
                        "custom_fields": account['custom_fields']
                    })
                else:
                    # Account assigned to a node
                    if node_id not in accounts_by_node:
                        accounts_by_node[node_id] = []
                    accounts_by_node[node_id].append({
                        "id": account['id'],
                        "name": account['name'],
                        "code": account['code'],
                        "account_type": account['account_type'],
                        "custom_fields": account['custom_fields']
                    })

            # Build tree structure starting from root nodes (parent_id = None)
            def build_node_tree(parent_id=None):
                if parent_id not in nodes_by_parent:
                    return []

                result = []
                for node in nodes_by_parent[parent_id]:
                    node_obj = {
                        "id": node['id'],
                        "name": node['name'],
                        "code": node['code'],
                        "level": node['level'],
                        "type": "node",  # Mark as node, not account
                        "accounts": accounts_by_node.get(node['id'], []),  # Accounts in this node
                        "children": build_node_tree(node['id'])  # Child nodes
                    }
                    result.append(node_obj)
                return result

            nodes = build_node_tree(None)

            # Also collect all accounts (assigned + unassigned) for export
            all_accounts = []
            for account in accounts_data:
                all_accounts.append({
                    "id": account['id'],
                    "name": account['name'],
                    "code": account['code'],
                    "account_type": account['account_type'],
                    "custom_fields": account['custom_fields'],
                    "node_id": account['node_id']
                })

            return {
                "hierarchy_id": hierarchy_id,
                "nodes": nodes,
                "accounts": all_accounts,  # All accounts for export
                "unassigned_accounts": unassigned_accounts  # Just unassigned for UI
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get hierarchy structure: {str(e)}"
        )

class NodeCreate(BaseModel):
    name: str
    code: str
    hierarchy_id: int
    parent_id: Optional[int] = None
    level: int = 0

@router.post("/hierarchy-nodes")
async def create_hierarchy_node(
    node_data: NodeCreate,
    company_name: str = Query(...)
):
    """Create a new hierarchy node (folder)"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Extract node data
            name = node_data.name.strip()
            code = node_data.code.strip()
            hierarchy_id = node_data.hierarchy_id
            parent_id = node_data.parent_id
            level = 0  # Will be calculated based on parent

            # Calculate level based on parent
            if parent_id:
                cur.execute("""
                    SELECT level FROM hierarchy_nodes
                    WHERE id = %s AND company_id = %s
                """, (parent_id, company_name))
                parent_result = cur.fetchone()
                if parent_result:
                    level = parent_result['level'] + 1
                else:
                    raise HTTPException(status_code=400, detail=f"Parent node with ID {parent_id} not found")

            # Validate required fields
            if not name:
                raise HTTPException(status_code=400, detail="Node name is required")
            if not code:
                raise HTTPException(status_code=400, detail="Node code is required")
            if not hierarchy_id:
                raise HTTPException(status_code=400, detail="Hierarchy ID is required")

            # Check if code already exists in hierarchy_nodes for this company
            cur.execute("""
                SELECT id FROM hierarchy_nodes
                WHERE code = %s AND hierarchy_id = %s AND company_id = %s
            """, (code, hierarchy_id, company_name))

            if cur.fetchone():
                raise HTTPException(status_code=400, detail=f"Node code '{code}' already exists in this hierarchy")

            # Create the hierarchy node with materialized path
            cur.execute("""
                INSERT INTO hierarchy_nodes (
                    name, code, parent_id, hierarchy_id, company_id, level, path, sort_order
                ) VALUES (%s, %s, %s, %s, %s, %s, '', 0)
                RETURNING *
            """, (name, code, parent_id, hierarchy_id, company_name, level))

            print(f"✅ Created node '{name}' with level {level} under parent {parent_id}")

            new_node = cur.fetchone()
            node_id = new_node['id']

            # Calculate and update the materialized path
            path = calculate_node_path(parent_id, node_id, company_name)
            cur.execute("""
                UPDATE hierarchy_nodes
                SET path = %s
                WHERE id = %s AND company_id = %s
                RETURNING *
            """, (path, node_id, company_name))

            updated_node = cur.fetchone()
            conn.commit()

            result = {
                "id": updated_node['id'],
                "name": updated_node['name'],
                "code": updated_node['code'],
                "parent_id": updated_node['parent_id'],
                "hierarchy_id": updated_node['hierarchy_id'],
                "level": updated_node['level'],
                "path": updated_node['path'],
                "children": []
            }

            print(f"✅ Node created successfully: {result}")
            return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create node: {str(e)}"
        )

class NodeUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None

@router.put("/hierarchy-nodes/{node_id}")
async def update_hierarchy_node(
    node_id: int,
    node_data: NodeUpdate,
    company_name: str = Query(...)
):
    """Update a hierarchy node"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # Check if node exists
            cur.execute("SELECT * FROM axes_accounts WHERE id = %s", (node_id,))
            existing_node = cur.fetchone()

            if not existing_node:
                raise HTTPException(status_code=404, detail="Node not found")

            # Update node
            name = node_data.name if node_data.name is not None else existing_node['name']
            code = node_data.code if node_data.code is not None else existing_node['code']

            cur.execute("""
                UPDATE axes_accounts
                SET name = %s, code = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """, (name, code, node_id))

            updated_node = cur.fetchone()
            conn.commit()

            return {
                "id": updated_node['id'],
                "name": updated_node['name'],
                "code": updated_node['code'],
                "parent_id": updated_node['parent_id'],
                "hierarchy_id": updated_node['hierarchy_id'],
                "level": updated_node['level'],
                "is_leaf": updated_node['is_leaf'],
                "custom_fields": updated_node['custom_fields']
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update node: {str(e)}"
        )

@router.delete("/hierarchy-nodes/{node_id}")
async def delete_hierarchy_node(
    node_id: int,
    company_name: str = Query(...),
    cascade: bool = False
):
    """Delete a hierarchy node"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()

            if cascade:
                # Delete node and all children (CASCADE will handle this)
                cur.execute("DELETE FROM axes_accounts WHERE id = %s", (node_id,))
            else:
                # Check if node has children
                cur.execute("SELECT COUNT(*) FROM axes_accounts WHERE parent_id = %s", (node_id,))
                child_count = cur.fetchone()[0]

                if child_count > 0:
                    raise HTTPException(
                        status_code=400,
                        detail="Cannot delete node with children. Use cascade=true to delete all children."
                    )

                cur.execute("DELETE FROM axes_accounts WHERE id = %s", (node_id,))

            conn.commit()
            return {"message": "Node deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete node: {str(e)}"
        )
