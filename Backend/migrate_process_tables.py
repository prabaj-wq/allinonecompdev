"""
Migration script to create/update financial process tables in company databases
Run this to ensure all tables exist with correct schema
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
import re

def get_db_config():
    """Get database connection configuration."""
    if os.getenv('DOCKER_ENV') == 'true':
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
    else:
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
        
    return {
        'host': POSTGRES_HOST,
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'epm_password')
    }

def normalize_company_db_name(company_name: str) -> str:
    """Normalize company name for database naming."""
    if not company_name:
        return "default_company"
    sanitized = re.sub(r"[^a-z0-9_]", "_", company_name.lower().replace(" ", "_"))
    sanitized = sanitized.strip("_")
    return sanitized or "default_company"

def ensure_financial_tables(conn):
    """Ensure financial process tables exist in the company database."""
    cur = conn.cursor()
    
    print("Creating/updating financial_processes table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS financial_processes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            process_type VARCHAR(50) DEFAULT 'profit_loss',
            status VARCHAR(50) DEFAULT 'draft',
            fiscal_year INTEGER,
            reporting_currency VARCHAR(3) DEFAULT 'USD',
            settings JSONB DEFAULT '{}',
            created_by UUID,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    
    print("Creating/updating financial_process_nodes table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS financial_process_nodes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            process_id UUID REFERENCES financial_processes(id) ON DELETE CASCADE,
            node_type VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            x FLOAT DEFAULT 0,
            y FLOAT DEFAULT 0,
            width FLOAT DEFAULT 200,
            height FLOAT DEFAULT 100,
            canvas_mode VARCHAR(50) DEFAULT 'entity',
            configuration JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            sequence INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    
    print("Creating/updating process_connections table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS process_connections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            process_id UUID REFERENCES financial_processes(id) ON DELETE CASCADE,
            from_node_id UUID REFERENCES financial_process_nodes(id) ON DELETE CASCADE,
            to_node_id UUID REFERENCES financial_process_nodes(id) ON DELETE CASCADE,
            connection_type VARCHAR(50) DEFAULT 'data_flow',
            conditions JSONB DEFAULT '{}',
            transformation_rules JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    
    print("Creating/updating process_scenarios table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS process_scenarios (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            process_id UUID REFERENCES financial_processes(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            scenario_type VARCHAR(50) DEFAULT 'actual',
            status VARCHAR(50) DEFAULT 'draft',
            version_number INTEGER DEFAULT 1,
            fx_rate_overrides JSONB DEFAULT '{}',
            custom_parameters JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    
    # Drop old table if it exists with wrong name
    print("Checking for old process_nodes table...")
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'process_nodes'
        );
    """)
    if cur.fetchone()[0]:
        print("Found old process_nodes table, migrating data...")
        cur.execute("""
            INSERT INTO financial_process_nodes 
            SELECT * FROM process_nodes
            ON CONFLICT (id) DO NOTHING;
        """)
        print("Dropping old process_nodes table...")
        cur.execute("DROP TABLE IF EXISTS process_nodes CASCADE;")
    
    conn.commit()
    print("✓ All tables created/updated successfully!")

def migrate_company_database(company_name: str):
    """Migrate a specific company database."""
    db_name = normalize_company_db_name(company_name)
    print(f"\n{'='*60}")
    print(f"Migrating database: {db_name} (for company: {company_name})")
    print(f"{'='*60}")
    
    try:
        conn = psycopg2.connect(database=db_name, **get_db_config())
        ensure_financial_tables(conn)
        conn.close()
        print(f"✓ Successfully migrated {db_name}")
    except psycopg2.OperationalError as e:
        print(f"✗ Error: Database '{db_name}' not found or not accessible: {e}")
    except Exception as e:
        print(f"✗ Error migrating {db_name}: {e}")

def list_company_databases():
    """List all company databases."""
    try:
        conn = psycopg2.connect(database='postgres', **get_db_config())
        cur = conn.cursor()
        
        cur.execute("""
            SELECT datname FROM pg_database 
            WHERE datname LIKE 'company_%' 
            ORDER BY datname;
        """)
        
        databases = [row[0] for row in cur.fetchall()]
        conn.close()
        return databases
    except Exception as e:
        print(f"Error listing databases: {e}")
        return []

if __name__ == "__main__":
    print("\n" + "="*60)
    print("Financial Process Tables Migration Script")
    print("="*60)
    
    # List all company databases
    databases = list_company_databases()
    
    if not databases:
        print("\nNo company databases found!")
        print("Please specify a company name to migrate:")
        company_name = input("Company name: ").strip()
        if company_name:
            migrate_company_database(company_name)
    else:
        print(f"\nFound {len(databases)} company database(s):")
        for db in databases:
            print(f"  - {db}")
        
        print("\nMigrating all company databases...")
        for db in databases:
            # Extract company name from database name
            company_name = db.replace('company_', '').replace('_', ' ')
            migrate_company_database(company_name)
    
    print("\n" + "="*60)
    print("Migration complete!")
    print("="*60 + "\n")
