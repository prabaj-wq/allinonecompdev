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

router = APIRouter(prefix="/axes-entity", tags=["Axes Entity"])

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
                AND table_name IN ('axes_settings', 'hierarchies', 'hierarchy_nodes', 'axes_entities')
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
            
            required_tables = ['axes_settings', 'hierarchies', 'hierarchy_nodes', 'axes_entities']
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
    axes_type: str = "entity"
    custom_fields: List[CustomFieldDefinition] = []
    linked_axes: Optional[List[str]] = None  # Links to other axes like 'account'

class AxesEntityCreate(BaseModel):
    name: str
    code: str
    parent_id: Optional[int] = None
    hierarchy_id: Optional[int] = None
    level: int = 0
    entity_type: str = 'Subsidiary'  # Can be 'Parent', 'Subsidiary', 'Branch', etc.
    geography: Optional[str] = None
    currency: str = 'USD'  # Now accepts any currency code
    custom_fields: Dict[str, Any] = {}
    
    @validator('code')
    def validate_code(cls, v):
        if not re.match(r'^[A-Z0-9_]+$', v):
            raise ValueError('Code must contain only uppercase letters, numbers, and underscores')
        return v

class AxesEntityUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    parent_id: Optional[int] = None
    node_id: Optional[int] = None  # For assigning entities to hierarchy nodes
    hierarchy_id: Optional[int] = None  # For assigning entities to hierarchies
    level: Optional[int] = None
    entity_type: Optional[str] = None
    geography: Optional[str] = None
    currency: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class AxesEntityResponse(BaseModel):
    id: int
    name: str
    code: str
    parent_id: Optional[int]
    level: int
    entity_type: str
    geography: Optional[str]
    currency: str
    custom_fields: Dict[str, Any]
    children: Optional[List['AxesEntityResponse']] = None
    created_at: datetime
    updated_at: datetime

# Enable forward references
AxesEntityResponse.model_rebuild()

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

def ensure_tables_exist(company_name: str):
    """Ensure all necessary tables exist for the company database"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            
            # Create axes_settings table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS axes_settings (
                    id SERIAL PRIMARY KEY,
                    axes_type VARCHAR(50) NOT NULL DEFAULT 'entity',
                    custom_fields JSONB DEFAULT '[]',
                    linked_axes JSONB DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(axes_type)
                )
            """)
            
            # Create hierarchies table with company isolation
            cur.execute("""
                CREATE TABLE IF NOT EXISTS hierarchies (
                    id SERIAL PRIMARY KEY,
                    hierarchy_name VARCHAR(255) NOT NULL,
                    hierarchy_type VARCHAR(100) DEFAULT 'entity',
                    description TEXT,
                    company_id VARCHAR(255) NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(hierarchy_name, company_id)
                )
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
                    level INTEGER DEFAULT 0,
                    path VARCHAR(500),
                    is_leaf BOOLEAN DEFAULT TRUE,
                    custom_fields JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(code, hierarchy_id, company_id)
                )
            """)
            
            # Create axes_entities table with company isolation
            cur.execute("""
                CREATE TABLE IF NOT EXISTS axes_entities (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    code VARCHAR(100) NOT NULL,
                    parent_id INTEGER REFERENCES hierarchy_nodes(id) ON DELETE SET NULL,
                    node_id INTEGER REFERENCES hierarchy_nodes(id) ON DELETE SET NULL,
                    hierarchy_id INTEGER REFERENCES hierarchies(id) ON DELETE SET NULL,
                    company_id VARCHAR(255) NOT NULL,
                    level INTEGER DEFAULT 0,
                    is_leaf BOOLEAN DEFAULT TRUE,
                    entity_type VARCHAR(50) DEFAULT 'Subsidiary',
                    geography VARCHAR(100),
                    currency VARCHAR(10) DEFAULT 'USD',
                    custom_fields JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(code, company_id)
                )
            """)
            
            # Create indexes for better performance
            cur.execute("CREATE INDEX IF NOT EXISTS idx_hierarchies_company ON hierarchies(company_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_company ON hierarchy_nodes(company_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_hierarchy ON hierarchy_nodes(hierarchy_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_axes_entities_company ON axes_entities(company_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_axes_entities_hierarchy ON axes_entities(hierarchy_id)")
            
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
            
            conn.commit()
            print(f"✅ All tables ensured for company: {company_name}")
            
    except Exception as e:
        print(f"❌ Error ensuring tables for company {company_name}: {e}")
        raise

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
                axes_type VARCHAR(50) NOT NULL DEFAULT 'entity',
                custom_fields JSONB DEFAULT '[]',
                linked_axes JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(axes_type)
            )
        """)
        
        # First, add missing columns to existing tables before creating new ones
        try:
            # Add company_id to hierarchies table if it exists
            cur.execute(f"""
                DO $$ 
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='hierarchies') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='hierarchies' AND column_name='company_id') THEN
                            ALTER TABLE hierarchies ADD COLUMN company_id VARCHAR(255) DEFAULT '{company_name}';
                            UPDATE hierarchies SET company_id = '{company_name}' WHERE company_id IS NULL;
                            ALTER TABLE hierarchies ALTER COLUMN company_id SET NOT NULL;
                        END IF;
                    END IF;
                END $$;
            """)
            
            # Add company_id to hierarchy_nodes table if it exists
            cur.execute(f"""
                DO $$ 
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='hierarchy_nodes') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='hierarchy_nodes' AND column_name='company_id') THEN
                            ALTER TABLE hierarchy_nodes ADD COLUMN company_id VARCHAR(255) DEFAULT '{company_name}';
                            UPDATE hierarchy_nodes SET company_id = '{company_name}' WHERE company_id IS NULL;
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
            
            # Add company_id to axes_entities table if it exists
            cur.execute(f"""
                DO $$ 
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='axes_entities') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='axes_entities' AND column_name='company_id') THEN
                            ALTER TABLE axes_entities ADD COLUMN company_id VARCHAR(255) DEFAULT '{company_name}';
                            UPDATE axes_entities SET company_id = '{company_name}' WHERE company_id IS NULL;
                            ALTER TABLE axes_entities ALTER COLUMN company_id SET NOT NULL;
                        END IF;
                        
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='axes_entities' AND column_name='entity_type') THEN
                            ALTER TABLE axes_entities ADD COLUMN entity_type VARCHAR(50) DEFAULT 'Subsidiary';
                        END IF;
                        
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='axes_entities' AND column_name='geography') THEN
                            ALTER TABLE axes_entities ADD COLUMN geography VARCHAR(100);
                        END IF;
                        
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='axes_entities' AND column_name='currency') THEN
                            ALTER TABLE axes_entities ADD COLUMN currency VARCHAR(10) DEFAULT 'USD';
                        END IF;
                    END IF;
                END $$;
            """)
        except Exception as e:
            print(f"Note: Column addition phase: {e}")
        
        # Fix foreign key constraint on axes_entities.parent_id (only if table exists)
        try:
            # Check if axes_entities table exists first
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'axes_entities'
                )
            """)
            table_exists = cur.fetchone()[0]
            
            if table_exists:
                # Drop old constraint if it exists (pointing to axes_entities)
                cur.execute("""
                    DO $$ 
                    BEGIN
                        -- Drop the old foreign key constraint if it exists
                        IF EXISTS (
                            SELECT 1 FROM information_schema.table_constraints 
                            WHERE constraint_name = 'axes_entities_parent_id_fkey' 
                            AND table_name = 'axes_entities'
                        ) THEN
                            ALTER TABLE axes_entities DROP CONSTRAINT axes_entities_parent_id_fkey;
                        END IF;
                        
                        -- Add the correct foreign key constraint pointing to hierarchy_nodes
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.table_constraints 
                            WHERE constraint_name = 'axes_entities_parent_id_fkey_nodes' 
                            AND table_name = 'axes_entities'
                        ) THEN
                            ALTER TABLE axes_entities 
                            ADD CONSTRAINT axes_entities_parent_id_fkey_nodes 
                            FOREIGN KEY (parent_id) REFERENCES hierarchy_nodes(id) ON DELETE SET NULL;
                        END IF;
                    END $$;
                """)
                print("✅ Fixed axes_entities.parent_id foreign key constraint")
            else:
                print("ℹ️ axes_entities table doesn't exist yet, skipping foreign key fix")
        except Exception as e:
            print(f"Note: Foreign key fix: {e}")
        
        # Create hierarchies table with company isolation
        cur.execute("""
            CREATE TABLE IF NOT EXISTS hierarchies (
                id SERIAL PRIMARY KEY,
                hierarchy_name VARCHAR(255) NOT NULL,
                hierarchy_type VARCHAR(100) DEFAULT 'entity',
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
        
        # Create axes_entities table with company isolation
        cur.execute("""
            CREATE TABLE IF NOT EXISTS axes_entities (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(100) NOT NULL,
                parent_id INTEGER REFERENCES hierarchy_nodes(id) ON DELETE SET NULL,
                node_id INTEGER REFERENCES hierarchy_nodes(id) ON DELETE SET NULL,
                hierarchy_id INTEGER REFERENCES hierarchies(id) ON DELETE SET NULL,
                company_id VARCHAR(255) NOT NULL,
                level INTEGER DEFAULT 0,
                is_leaf BOOLEAN DEFAULT TRUE,
                entity_type VARCHAR(50) DEFAULT 'Subsidiary',
                geography VARCHAR(100),
                currency VARCHAR(10) DEFAULT 'USD',
                custom_fields JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(code, company_id)
            )
        """)
        
        # Add node_id column if it doesn't exist (for existing tables)
        try:
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'axes_entities' AND column_name = 'node_id'
            """)
            if not cur.fetchone():
                print("🔧 Adding node_id column to axes_entities table...")
                cur.execute("""
                    ALTER TABLE axes_entities 
                    ADD COLUMN node_id INTEGER REFERENCES hierarchy_nodes(id) ON DELETE SET NULL
                """)
                print("✅ node_id column added successfully")
            else:
                print("✅ node_id column already exists")
        except Exception as e:
            print(f"⚠️ Error checking/adding node_id column: {e}")
        
        # Create indexes for efficient company-scoped queries
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_axes_entities_company_hierarchy 
            ON axes_entities (company_id, hierarchy_id)
        """)
        
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_axes_entities_parent 
            ON axes_entities (parent_id, company_id)
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
                CREATE INDEX IF NOT EXISTS idx_axes_entities_company_hierarchy 
                ON axes_entities (company_id, hierarchy_id)
            """)
        except Exception as e:
            print(f"Note: Index creation: {e}")
        
        # Create indexes for performance
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_axes_entities_parent_id ON axes_entities(parent_id);
            CREATE INDEX IF NOT EXISTS idx_axes_entities_code ON axes_entities(code);
            CREATE INDEX IF NOT EXISTS idx_axes_entities_level ON axes_entities(level);
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
            DROP TRIGGER IF EXISTS update_axes_entities_updated_at ON axes_entities;
            CREATE TRIGGER update_axes_entities_updated_at
                BEFORE UPDATE ON axes_entities
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
    """Add a new column to axes_entities table for a custom field"""
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
            WHERE table_name = 'axes_entities' AND column_name = %s
        """, (column_name,))
        
        if not cur.fetchone():
            # Add the column
            default_value = ""
            if field.field_type == 'boolean':
                default_value = "DEFAULT FALSE"
            elif hasattr(field, 'default_value') and field.default_value:
                default_value = f"DEFAULT '{field.default_value}'"
            
            alter_query = f"ALTER TABLE axes_entities ADD COLUMN {column_name} {pg_type} {default_value}"
            cur.execute(alter_query)
            print(f"✅ Added column {column_name} ({pg_type}) to axes_entities table")
        
    except Exception as e:
        print(f"❌ Error adding column {field.field_name}: {str(e)}")
        raise

async def remove_custom_field_column(cur, field_name: str):
    """Remove a column from axes_entities table for a deleted custom field"""
    try:
        column_name = field_name.lower()
        
        # Validate column name
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', column_name):
            return  # Skip invalid column names
        
        # Check if column exists
        cur.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'axes_entities' AND column_name = %s
        """, (column_name,))
        
        if cur.fetchone():
            # Remove the column
            alter_query = f"ALTER TABLE axes_entities DROP COLUMN IF EXISTS {column_name}"
            cur.execute(alter_query)
            print(f"✅ Removed column {column_name} from axes_entities table")
        
    except Exception as e:
        print(f"❌ Error removing column {field_name}: {str(e)}")
        # Don't raise here to avoid breaking the entire operation

def get_custom_field_columns(cur, company_name: str) -> dict:
    """Get custom field column information from axes_settings"""
    try:
        cur.execute("SELECT custom_fields FROM axes_settings WHERE axes_type = 'entity'")
        result = cur.fetchone()
        if result and result['custom_fields']:
            custom_fields = json.loads(result['custom_fields']) if isinstance(result['custom_fields'], str) else result['custom_fields']
            return {field.get('field_name'): field for field in custom_fields if field.get('field_name')}
        return {}
    except Exception as e:
        print(f"❌ Error getting custom field columns: {str(e)}")
        return {}

def build_entity_insert_query(custom_fields_config: dict, entity_data: dict) -> tuple:
    """Build dynamic INSERT query for entity with custom fields"""
    base_columns = ['name', 'code', 'parent_id', 'hierarchy_id', 'company_id', 'level', 'is_leaf', 'entity_type', 'geography', 'currency']
    base_values = [
        entity_data.get('name'),
        entity_data.get('code'),
        entity_data.get('parent_id'),
        entity_data.get('hierarchy_id'),
        entity_data.get('company_id'),
        entity_data.get('level', 0),
        entity_data.get('is_leaf', True),
        entity_data.get('entity_type', 'Subsidiary'),
        entity_data.get('geography', ''),
        entity_data.get('currency', 'USD')
    ]
    
    # Add custom field columns and values
    custom_columns = []
    custom_values = []
    custom_fields_data = entity_data.get('custom_fields', {})
    
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
    
    query = f"INSERT INTO axes_entities ({columns_str}) VALUES ({placeholders}) RETURNING *"
    
    return query, all_values

def build_entity_update_query(custom_fields_config: dict, entity_data: dict, entity_id: int) -> tuple:
    """Build dynamic UPDATE query for entity with custom fields"""
    base_updates = []
    values = []
    
    # Base fields that can be updated
    updatable_fields = ['name', 'code', 'parent_id', 'hierarchy_id', 'level', 'is_leaf', 'entity_type', 'geography', 'currency', 'node_id']
    
    for field in updatable_fields:
        if field in entity_data:
            base_updates.append(f"{field} = %s")
            values.append(entity_data[field])
    
    # Add custom field updates
    custom_fields_data = entity_data.get('custom_fields', {})
    
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
    values.append(entity_id)  # Add entity_id for WHERE clause
    
    query = f"UPDATE axes_entities SET {updates_str} WHERE id = %s RETURNING *"
    
    return query, values

def build_entity_select_query(custom_fields_config: dict, where_clause: str = "", params: list = None) -> tuple:
    """Build dynamic SELECT query for entities with custom fields"""
    base_columns = ['id', 'name', 'code', 'parent_id', 'hierarchy_id', 'company_id', 'level', 'is_leaf', 'entity_type', 'geography', 'currency', 'node_id', 'created_at', 'updated_at']
    
    # Add custom field columns
    custom_columns = [field_name.lower() for field_name in custom_fields_config.keys()]
    
    all_columns = base_columns + custom_columns
    columns_str = ', '.join(all_columns)
    
    query = f"SELECT {columns_str} FROM axes_entities"
    
    if where_clause:
        query += f" WHERE {where_clause}"
    
    return query, params or []

def convert_entity_result_to_dict(row: dict, custom_fields_config: dict) -> dict:
    """Convert database row to entity dict with custom_fields object"""
    if not row:
        return {}
    
    # Base entity fields
    entity = {
        'id': row.get('id'),
        'name': row.get('name'),
        'code': row.get('code'),
        'parent_id': row.get('parent_id'),
        'hierarchy_id': row.get('hierarchy_id'),
        'company_id': row.get('company_id'),
        'level': row.get('level'),
        'is_leaf': row.get('is_leaf'),
        'entity_type': row.get('entity_type'),
        'geography': row.get('geography'),
        'currency': row.get('currency'),
        'node_id': row.get('node_id'),
        'created_at': row.get('created_at'),
        'updated_at': row.get('updated_at'),
        'custom_fields': {}
    }
    
    # Extract custom field values
    for field_name in custom_fields_config.keys():
        column_name = field_name.lower()
        if column_name in row:
            entity['custom_fields'][field_name] = row[column_name]
    
    return entity

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
                AND table_name IN ('axes_settings', 'hierarchies', 'hierarchy_nodes', 'axes_entities')
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
                SELECT * FROM axes_settings WHERE axes_type = 'entity'
            """)
            settings = cur.fetchone()
            
            if not settings:
                # Create default settings
                default_settings = {
                    'axes_type': 'entity',
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

@router.get("/entities")
async def get_entities(
    company_name: str = Query(...),
    hierarchy_id: Optional[int] = Query(None),
    parent_id: Optional[int] = Query(None),
    node_id: Optional[int] = Query(None),
    level: Optional[int] = Query(None),
    include_children: bool = Query(False)
):
    """Get entities with optional filtering and hierarchical structure"""
    try:
        # Ensure all tables exist first
        ensure_tables_exist(company_name)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get custom field configuration for dynamic queries
            custom_fields_config = get_custom_field_columns(cur, company_name)
            
            if include_children:
                # Get hierarchical structure using recursive CTE
                cur.execute("""
                    WITH RECURSIVE entity_hierarchy AS (
                        -- Base case: root entities
                        SELECT id, name, code, parent_id, level, is_leaf, custom_fields, 
                               created_at, updated_at, 0 as depth
                        FROM axes_entities 
                        WHERE parent_id IS NULL
                        
                        UNION ALL
                        
                        -- Recursive case: children
                        SELECT e.id, e.name, e.code, e.parent_id, e.level, e.is_leaf, 
                               e.custom_fields, e.created_at, e.updated_at, eh.depth + 1
                        FROM axes_entities e
                        INNER JOIN entity_hierarchy eh ON e.parent_id = eh.id
                    )
                    SELECT * FROM entity_hierarchy ORDER BY level, name
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
                query, query_params = build_entity_select_query(custom_fields_config, where_clause, params)
                query += " ORDER BY level, name"
                
                cur.execute(query, query_params)
                entities = cur.fetchall()
                
                # Convert to list of dicts with custom fields properly formatted
                result = [convert_entity_result_to_dict(dict(entity), custom_fields_config) for entity in entities]
            
            return {"entities": result, "total": len(result)}
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get entities: {str(e)}"
        )

@router.post("/entities")
async def create_entity(
    entity: AxesEntityCreate,
    company_name: str = Query(...)
):
    """Create a new entity"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Check if code already exists for this company
            cur.execute("SELECT id FROM axes_entities WHERE code = %s AND company_id = %s", (entity.code, company_name))
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Entity with code '{entity.code}' already exists"
                )
            
            # If parent_id is provided, calculate level from parent
            if entity.parent_id:
                # Check if parent is a hierarchy node or entity
                cur.execute("""
                    SELECT level FROM hierarchy_nodes 
                    WHERE id = %s AND company_id = %s
                """, (entity.parent_id, company_name))
                parent_result = cur.fetchone()
                if parent_result:
                    entity.level = parent_result['level'] + 1
                else:
                    # Check if parent is an entity
                    cur.execute("""
                        SELECT level FROM axes_entities 
                        WHERE id = %s AND company_id = %s
                    """, (entity.parent_id, company_name))
                    parent_result = cur.fetchone()
                    if parent_result:
                        entity.level = parent_result['level'] + 1
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Parent with ID {entity.parent_id} not found"
                        )
            
            # Get custom field configuration
            custom_fields_config = get_custom_field_columns(cur, company_name)
            
            # Prepare entity data for dynamic query
            entity_data = {
                'name': entity.name,
                'code': entity.code,
                'parent_id': entity.parent_id,
                'hierarchy_id': entity.hierarchy_id,
                'company_id': company_name,
                'level': entity.level,
                'is_leaf': True,
                'entity_type': entity.entity_type,
                'geography': entity.geography,
                'currency': entity.currency,
                'custom_fields': entity.custom_fields
            }
            
            # Build and execute dynamic insert query
            query, values = build_entity_insert_query(custom_fields_config, entity_data)
            cur.execute(query, values)
            
            new_entity = cur.fetchone()
            conn.commit()
            
            return dict(new_entity)
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create entity: {str(e)}"
        )

@router.get("/entities/{entity_id}")
async def get_entity(
    entity_id: int,
    company_name: str = Query(...),
    include_children: bool = Query(False)
):
    """Get a specific entity by ID"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get custom field configuration for dynamic queries
            custom_fields_config = get_custom_field_columns(cur, company_name)
            
            # Build dynamic query for single entity
            query, params = build_entity_select_query(custom_fields_config, "id = %s", [entity_id])
            cur.execute(query, params)
            
            entity = cur.fetchone()
            if not entity:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Entity with ID {entity_id} not found"
                )
            
            # Convert result to expected format
            result = convert_entity_result_to_dict(dict(entity), custom_fields_config)
            
            if include_children:
                # Build dynamic query for children
                children_query, children_params = build_entity_select_query(custom_fields_config, "parent_id = %s", [entity_id])
                children_query += " ORDER BY name"
                cur.execute(children_query, children_params)
                
                children = cur.fetchall()
                result['children'] = [convert_entity_result_to_dict(dict(child), custom_fields_config) for child in children]
            
            return result
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get entity: {str(e)}"
        )

@router.put("/entities/{entity_id}")
async def update_entity(
    entity_id: int,
    entity_update: AxesEntityUpdate,
    company_name: str = Query(...)
):
    """Update an existing entity"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Check if entity exists for this company
            cur.execute("SELECT * FROM axes_entities WHERE id = %s AND company_id = %s", (entity_id, company_name))
            existing_entity = cur.fetchone()
            if not existing_entity:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Entity with ID {entity_id} not found"
                )
            
            # Get custom field configuration for dynamic updates
            custom_fields_config = get_custom_field_columns(cur, company_name)
            
            # Prepare entity data for dynamic update
            entity_data = {}
            
            if entity_update.name is not None:
                entity_data['name'] = entity_update.name
            
            if entity_update.code is not None:
                # Check if new code already exists (excluding current entity) for this company
                cur.execute("SELECT id FROM axes_entities WHERE code = %s AND id != %s AND company_id = %s", 
                           (entity_update.code, entity_id, company_name))
                if cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Entity with code '{entity_update.code}' already exists"
                    )
                entity_data['code'] = entity_update.code
            
            if entity_update.parent_id is not None:
                entity_data['parent_id'] = entity_update.parent_id
            
            if entity_update.level is not None:
                entity_data['level'] = entity_update.level
            
            # Check if node_id was provided in the request (even if it's None)
            if 'node_id' in entity_update.__fields_set__:
                entity_data['node_id'] = entity_update.node_id
            
            if entity_update.hierarchy_id is not None:
                entity_data['hierarchy_id'] = entity_update.hierarchy_id
            
            if entity_update.entity_type is not None:
                entity_data['entity_type'] = entity_update.entity_type
                
            if entity_update.geography is not None:
                entity_data['geography'] = entity_update.geography
                
            if entity_update.currency is not None:
                entity_data['currency'] = entity_update.currency
            
            # Include custom fields for dynamic column updates
            if entity_update.custom_fields is not None:
                entity_data['custom_fields'] = entity_update.custom_fields
            
            if not entity_data:
                return dict(existing_entity)
            
            # Build and execute dynamic update query
            query, values = build_entity_update_query(custom_fields_config, entity_data, entity_id)
            
            if query is None:
                return dict(existing_entity)
            
            cur.execute(query, values)
            updated_entity = cur.fetchone()
            conn.commit()
            
            # Convert result back to expected format
            result = convert_entity_result_to_dict(dict(updated_entity), custom_fields_config)
            return result
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update entity: {str(e)}"
        )

@router.delete("/entities/{entity_id}")
async def delete_entity(
    entity_id: int,
    company_name: str = Query(...),
    cascade: bool = Query(False)
):
    """Delete an entity (with optional cascade delete of children)"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Check if entity exists
            cur.execute("SELECT * FROM axes_entities WHERE id = %s", (entity_id,))
            entity = cur.fetchone()
            if not entity:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Entity with ID {entity_id} not found"
                )
            
            # Check for children
            cur.execute("SELECT COUNT(*) as child_count FROM axes_entities WHERE parent_id = %s", (entity_id,))
            child_count = cur.fetchone()['child_count']
            
            if child_count > 0 and not cascade:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Entity has {child_count} children. Use cascade=true to delete all children."
                )
            
            # Delete entity (CASCADE constraint will handle children if cascade=true)
            cur.execute("DELETE FROM axes_entities WHERE id = %s", (entity_id,))
            
            # Update parent's is_leaf status if this was the last child
            if entity['parent_id']:
                cur.execute("""
                    SELECT COUNT(*) as sibling_count 
                    FROM axes_entities 
                    WHERE parent_id = %s AND id != %s
                """, (entity['parent_id'], entity_id))
                
                sibling_count = cur.fetchone()['sibling_count']
                if sibling_count == 0:
                    cur.execute("""
                        UPDATE axes_entities 
                        SET is_leaf = TRUE 
                        WHERE id = %s
                    """, (entity['parent_id'],))
            
            conn.commit()
            
            return {
                "message": f"Entity '{entity['name']}' deleted successfully",
                "deleted_entity": dict(entity)
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete entity: {str(e)}"
        )

@router.get("/hierarchy-tree")
async def get_hierarchy_tree(company_name: str = Query(...)):
    """Get complete hierarchy tree structure"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get all entities
            cur.execute("""
                SELECT id, name, code, parent_id, level, is_leaf, custom_fields, 
                       created_at, updated_at
                FROM axes_entities 
                ORDER BY level, name
            """)
            
            entities = cur.fetchall()
            
            # Build tree structure
            entity_dict = {entity['id']: dict(entity) for entity in entities}
            
            # Add children arrays
            for entity in entity_dict.values():
                entity['children'] = []
            
            # Build parent-child relationships
            root_entities = []
            for entity in entity_dict.values():
                if entity['parent_id'] is None:
                    root_entities.append(entity)
                else:
                    parent = entity_dict.get(entity['parent_id'])
                    if parent:
                        parent['children'].append(entity)
            
            return {
                "tree": root_entities,
                "total_entities": len(entities),
                "max_level": max([e['level'] for e in entities], default=0)
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
    hierarchy_type: str = "entity"
    description: Optional[str] = None

class HierarchyResponse(BaseModel):
    id: int
    hierarchy_name: str
    hierarchy_type: str
    description: Optional[str]
    entity_count: int = 0
    created_at: datetime
    updated_at: datetime

@router.get("/hierarchies")
async def get_hierarchies(company_name: str = Query(...)):
    """Get all hierarchies for a company"""
    try:
        # Ensure all tables exist first
        ensure_tables_exist(company_name)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get hierarchies with entity counts (only entity type hierarchies)
            cur.execute("""
                SELECT
                    h.*,
                    COALESCE(COUNT(e.id), 0) as entity_count
                FROM hierarchies h
                LEFT JOIN axes_entities e ON e.hierarchy_id = h.id AND e.company_id = %s
                WHERE h.company_id = %s AND h.hierarchy_type = 'entity'
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
    """Delete a hierarchy and optionally cascade delete entities"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            
            if cascade:
                # Delete all entities in this hierarchy first
                cur.execute("DELETE FROM axes_entities WHERE hierarchy_id = %s AND company_id = %s", (hierarchy_id, company_name))
                # Delete all nodes in this hierarchy
                cur.execute("DELETE FROM hierarchy_nodes WHERE hierarchy_id = %s AND company_id = %s", (hierarchy_id, company_name))
            else:
                # Check if hierarchy has entities
                cur.execute("SELECT COUNT(*) FROM axes_entities WHERE hierarchy_id = %s AND company_id = %s", (hierarchy_id, company_name))
                entity_count = cur.fetchone()[0]
                # Check if hierarchy has nodes
                cur.execute("SELECT COUNT(*) FROM hierarchy_nodes WHERE hierarchy_id = %s AND company_id = %s", (hierarchy_id, company_name))
                node_count = cur.fetchone()[0]
                
                if entity_count > 0 or node_count > 0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot delete hierarchy with {entity_count} entities and {node_count} nodes. Use cascade=true to force delete."
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
    """Get hierarchy structure with nodes and unassigned entities"""
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
            
            # Get all entities in this hierarchy for this company
            cur.execute("""
                SELECT * FROM axes_entities 
                WHERE hierarchy_id = %s AND company_id = %s
                ORDER BY level, name
            """, (hierarchy_id, company_name))
            
            entities_data = cur.fetchall()
            
            # Build hierarchical structure for nodes
            nodes_by_parent = {}
            for node in nodes_data:
                parent_id = node['parent_id']
                if parent_id not in nodes_by_parent:
                    nodes_by_parent[parent_id] = []
                nodes_by_parent[parent_id].append(node)
            
            # Group entities by node_id (entities assigned to hierarchy nodes)
            entities_by_node = {}
            unassigned_entities = []
            
            for entity in entities_data:
                node_id = entity['node_id']
                if node_id is None:
                    # Entity not assigned to any node
                    unassigned_entities.append({
                        "id": entity['id'],
                        "name": entity['name'],
                        "code": entity['code'],
                        "entity_type": entity['entity_type'],
                        "geography": entity['geography'],
                        "currency": entity['currency'],
                        "custom_fields": entity['custom_fields']
                    })
                else:
                    # Entity assigned to a node
                    if node_id not in entities_by_node:
                        entities_by_node[node_id] = []
                    entities_by_node[node_id].append({
                        "id": entity['id'],
                        "name": entity['name'],
                        "code": entity['code'],
                        "entity_type": entity['entity_type'],
                        "geography": entity['geography'],
                        "currency": entity['currency'],
                        "custom_fields": entity['custom_fields']
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
                        "type": "node",  # Mark as node, not entity
                        "entities": entities_by_node.get(node['id'], []),  # Entities in this node
                        "children": build_node_tree(node['id'])  # Child nodes
                    }
                    result.append(node_obj)
                return result
            
            nodes = build_node_tree(None)
            
            # Also collect all entities (assigned + unassigned) for export
            all_entities = []
            for entity in entities_data:
                all_entities.append({
                    "id": entity['id'],
                    "name": entity['name'],
                    "code": entity['code'],
                    "entity_type": entity['entity_type'],
                    "geography": entity['geography'],
                    "currency": entity['currency'],
                    "custom_fields": entity['custom_fields'],
                    "node_id": entity['node_id']
                })
            
            return {
                "hierarchy_id": hierarchy_id,
                "nodes": nodes,
                "entities": all_entities,  # All entities for export
                "unassigned_entities": unassigned_entities  # Just unassigned for UI
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
            cur.execute("SELECT * FROM axes_entities WHERE id = %s", (node_id,))
            existing_node = cur.fetchone()
            
            if not existing_node:
                raise HTTPException(status_code=404, detail="Node not found")
            
            # Update node
            name = node_data.name if node_data.name is not None else existing_node['name']
            code = node_data.code if node_data.code is not None else existing_node['code']
            
            cur.execute("""
                UPDATE axes_entities 
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
                cur.execute("DELETE FROM axes_entities WHERE id = %s", (node_id,))
            else:
                # Check if node has children
                cur.execute("SELECT COUNT(*) FROM axes_entities WHERE parent_id = %s", (node_id,))
                child_count = cur.fetchone()[0]
                
                if child_count > 0:
                    raise HTTPException(
                        status_code=400, 
                        detail="Cannot delete node with children. Use cascade=true to delete all children."
                    )
                
                cur.execute("DELETE FROM axes_entities WHERE id = %s", (node_id,))
            
            conn.commit()
            return {"message": "Node deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete node: {str(e)}"
        )
