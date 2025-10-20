"""
Enhanced Financial Process API Router
Comprehensive API for all financial consolidation and process management features
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_, desc
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, date
from decimal import Decimal
import json
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import re
import csv
import os
from pathlib import Path

from database import get_db
from auth.dependencies import get_current_active_user
from models.financial_process import *

router = APIRouter(prefix="/financial-process", tags=["Financial Process"])

# ============================================================================
# DATABASE CONNECTION HELPERS
# ============================================================================

def get_db_config():
    """Get database connection configuration."""
    import os
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

    # Create financial_processes table if it doesn't exist
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

    # Create process_configurations table for storing workflow configurations
    cur.execute("""
        CREATE TABLE IF NOT EXISTS process_configurations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            process_id UUID REFERENCES financial_processes(id) ON DELETE CASCADE,
            configuration JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(process_id)
        )
    """)

    # Backfill newer columns that might be missing on existing databases
    cur.execute("""
        ALTER TABLE financial_processes
        ADD COLUMN IF NOT EXISTS canvas_config JSONB DEFAULT '{}'
    """)
    cur.execute("""
        ALTER TABLE financial_processes
        ADD COLUMN IF NOT EXISTS base_scenario_id UUID
    """)

    # Create financial_process_nodes table to match the model
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

    cur.execute("""
        ALTER TABLE financial_process_nodes
        ADD COLUMN IF NOT EXISTS width FLOAT DEFAULT 200
    """)
    cur.execute("""
        ALTER TABLE financial_process_nodes
        ADD COLUMN IF NOT EXISTS height FLOAT DEFAULT 100
    """)
    cur.execute("""
        ALTER TABLE financial_process_nodes
        ADD COLUMN IF NOT EXISTS canvas_mode VARCHAR(50) DEFAULT 'entity'
    """)
    cur.execute("""
        ALTER TABLE financial_process_nodes
        ADD COLUMN IF NOT EXISTS entity_context VARCHAR(100)
    """)
    cur.execute("""
        ALTER TABLE financial_process_nodes
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'
    """)

    # Create process_connections table
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

    cur.execute("""
        ALTER TABLE process_connections
        ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}'
    """)
    cur.execute("""
        ALTER TABLE process_connections
        ADD COLUMN IF NOT EXISTS transformation_rules JSONB DEFAULT '{}'
    """)
    cur.execute("""
        ALTER TABLE process_connections
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    """)

    # Create process_scenarios table
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

    cur.execute("""
        ALTER TABLE process_scenarios
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft'
    """)
    cur.execute("""
        ALTER TABLE process_scenarios
        ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1
    """)
    cur.execute("""
        ALTER TABLE process_scenarios
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    """)

    # Create entity_amounts table for data input
    cur.execute("""
        CREATE TABLE IF NOT EXISTS entity_amounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            process_id UUID REFERENCES financial_processes(id) ON DELETE CASCADE,
            entity_code VARCHAR(100) NOT NULL,
            period_code VARCHAR(50) NOT NULL,
            period_date DATE,
            account_code VARCHAR(100) NOT NULL,
            amount DECIMAL(18, 2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            scenario_code VARCHAR(100),
            description TEXT,
            origin VARCHAR(50) DEFAULT 'web_input',
            custom_fields JSONB DEFAULT '{}',
            created_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Create ic_amounts table (Intercompany amounts with counterparty)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ic_amounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            process_id UUID REFERENCES financial_processes(id) ON DELETE CASCADE,
            entity_code VARCHAR(100) NOT NULL,
            counterparty_entity_code VARCHAR(100) NOT NULL,
            period_code VARCHAR(50) NOT NULL,
            period_date DATE,
            account_code VARCHAR(100) NOT NULL,
            amount DECIMAL(18, 2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            scenario_code VARCHAR(100),
            description TEXT,
            ic_reason VARCHAR(200),
            origin VARCHAR(50) DEFAULT 'web_input',
            custom_fields JSONB DEFAULT '{}',
            created_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Create other_amounts table (Manual adjustments, reclassifications)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS other_amounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            process_id UUID REFERENCES financial_processes(id) ON DELETE CASCADE,
            entity_code VARCHAR(100),
            period_code VARCHAR(50) NOT NULL,
            period_date DATE,
            account_code VARCHAR(100) NOT NULL,
            amount DECIMAL(18, 2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            scenario_code VARCHAR(100),
            description TEXT,
            adjustment_type VARCHAR(100),
            origin VARCHAR(50) DEFAULT 'web_input',
            custom_fields JSONB DEFAULT '{}',
            created_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Create entity_node_configurations table for entity-specific node settings
    cur.execute("""
        CREATE TABLE IF NOT EXISTS entity_node_configurations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            process_id UUID REFERENCES financial_processes(id) ON DELETE CASCADE,
            entity_code VARCHAR(50) NOT NULL,
            node_id UUID REFERENCES financial_process_nodes(id) ON DELETE CASCADE,
            enabled BOOLEAN DEFAULT true,
            settings JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(process_id, entity_code, node_id)
        )
    """)

    # Create process_executions table for tracking execution history
    cur.execute("""
        CREATE TABLE IF NOT EXISTS process_executions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            process_id UUID REFERENCES financial_processes(id) ON DELETE CASCADE,
            entity_code VARCHAR(50),
            node_id UUID REFERENCES financial_process_nodes(id) ON DELETE CASCADE,
            execution_type VARCHAR(50) DEFAULT 'node', -- 'node' or 'full_process'
            status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'error'
            start_time TIMESTAMP DEFAULT NOW(),
            end_time TIMESTAMP,
            execution_data JSONB DEFAULT '{}',
            csv_file_path TEXT,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Create csv_exports table for tracking CSV file exports
    cur.execute("""
        CREATE TABLE IF NOT EXISTS csv_exports (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            process_id UUID REFERENCES financial_processes(id) ON DELETE CASCADE,
            entity_code VARCHAR(50),
            export_type VARCHAR(50) NOT NULL, -- 'entity_amounts', 'ic_amounts', 'other_amounts', 'consolidated'
            file_path TEXT NOT NULL,
            file_size BIGINT,
            row_count INTEGER,
            export_date TIMESTAMP DEFAULT NOW(),
            fiscal_year INTEGER,
            period_code VARCHAR(20),
            scenario_id UUID
        )
    """)

    # Add indexes for better query performance
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_entity_amounts_process 
        ON entity_amounts(process_id, entity_code, period_code)
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_ic_amounts_process 
        ON ic_amounts(process_id, entity_code, counterparty_entity_code, period_code)
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_other_amounts_process 
        ON other_amounts(process_id, period_code)
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_entity_node_configs 
        ON entity_node_configurations(process_id, entity_code)
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_process_executions 
        ON process_executions(process_id, entity_code, status)
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_csv_exports 
        ON csv_exports(process_id, entity_code, export_type)
    """)

    conn.commit()

def ensure_tables_via_sqlalchemy(company_name: str):
    """Ensure tables exist using direct connection."""
    db_name = normalize_company_db_name(company_name)
    try:
        conn = psycopg2.connect(database=db_name, **get_db_config())
        ensure_financial_tables(conn)
        conn.close()
    except Exception as e:
        print(f"Warning: Could not ensure tables for {company_name}: {e}")

@contextmanager
def company_connection(company_name: str):
    """Context manager for company-specific database connection."""
    db_name = normalize_company_db_name(company_name)
    try:
        conn = psycopg2.connect(database=db_name, **get_db_config())
        ensure_financial_tables(conn)  # Ensure tables exist
    except psycopg2.OperationalError as exc:
        raise HTTPException(status_code=404, detail=f"Database for company '{company_name}' not available: {exc}")
    try:
        yield conn
    finally:
        conn.close()

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ProcessCreate(BaseModel):
    name: str
    description: Optional[str] = None
    process_type: Optional[str] = "General"
    fiscal_year: Optional[int] = None
    reporting_currency: Optional[str] = "USD"
    settings: Optional[Dict[str, Any]] = {}

class ProcessUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class NodeCreate(BaseModel):
    node_type: str
    name: str
    description: Optional[str] = None
    x: float = 0
    y: float = 0
    configuration: Optional[Dict[str, Any]] = {}

class ScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = None
    scenario_type: str = "actual"
    fx_rate_overrides: Optional[Dict[str, Any]] = {}
    custom_parameters: Optional[Dict[str, Any]] = {}

class EntityStructureCreate(BaseModel):
    entity_code: str
    entity_name: str
    parent_entity_code: Optional[str] = None
    ownership_percentage: Decimal
    consolidation_method: str = "full_consolidation"
    functional_currency: str = "USD"

class ConsolidationRuleCreate(BaseModel):
    rule_name: str
    rule_type: str
    description: Optional[str] = None
    source_entities: List[str] = []
    elimination_method: str = "full"

# ============================================================================
# PROCESS MANAGEMENT
# ============================================================================

@router.get("/health")
async def health_check():
    """Health check for financial process router"""
    return {"status": "ok", "router": "financial_process"}

@router.get("/processes")
async def get_processes(
    company_name: str = Query(...)
):
    """Get all financial processes for a company"""
    try:
        print(f"🔍 GET /processes called for company: {company_name}")
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Query processes
            cur.execute("""
                SELECT id, name, description, process_type, status, fiscal_year, 
                       reporting_currency, created_at, updated_at
                FROM financial_processes
                ORDER BY created_at DESC
            """)
            
            processes = []
            for row in cur.fetchall():
                processes.append({
                    "id": str(row['id']),
                    "name": row['name'],
                    "description": row['description'],
                    "process_type": row['process_type'],
                    "status": row['status'],
                    "fiscal_year": row['fiscal_year'],
                    "reporting_currency": row['reporting_currency'],
                    "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                    "updated_at": row['updated_at'].isoformat() if row['updated_at'] else None
                })
            
            print(f"✅ Found {len(processes)} processes")
            return {"processes": processes}
        
    except Exception as e:
        print(f"❌ Error fetching processes: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching processes: {str(e)}")

@router.post("/processes")
async def create_process(
    company_name: str = Query(...),
    process_data: ProcessCreate = Body(...)
):
    """Create a new financial process"""
    try:
        print(f"🚀 POST /processes called for company: {company_name}")
        print(f"📊 Process data: {process_data}")
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            process_id = str(uuid.uuid4())
            company_id = str(uuid.uuid4())
            
            # Insert new process
            cur.execute("""
                INSERT INTO financial_processes 
                (id, company_id, name, description, process_type, fiscal_year, 
                 reporting_currency, settings, created_by, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id, name, description, process_type, status, fiscal_year, reporting_currency
            """, (
                process_id,
                company_id,
                process_data.name,
                process_data.description,
                getattr(process_data, 'process_type', 'General'),
                process_data.fiscal_year,
                getattr(process_data, 'reporting_currency', 'USD'),
                json.dumps(process_data.settings or {}),
                str(uuid.uuid4())  # Generate a new UUID for created_by
            ))
            
            conn.commit()
            process = cur.fetchone()
            
            return {
                "process": {
                    "id": str(process['id']),
                    "name": process['name'],
                    "description": process['description'],
                    "process_type": process['process_type'],
                    "status": process['status'],
                    "fiscal_year": process['fiscal_year'],
                    "reporting_currency": process['reporting_currency']
                }
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating process: {str(e)}")

@router.get("/processes/{process_id}")
async def get_process(
    process_id: str,
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Get process details with nodes and connections"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute(
                """
                SELECT id, name, description, process_type, status, fiscal_year, reporting_currency,
                       settings, created_at, updated_at
                FROM financial_processes
                WHERE id = %s
                """,
                (process_id,)
            )
            process_row = cur.fetchone()
            if not process_row:
                raise HTTPException(status_code=404, detail="Process not found")

            cur.execute(
                """
                SELECT id, process_id, node_type, name, description, x, y, width, height,
                       canvas_mode, configuration, is_active, sequence, created_at, updated_at
                FROM financial_process_nodes
                WHERE process_id = %s
                ORDER BY sequence
                """,
                (process_id,)
            )
            node_rows = cur.fetchall()

            cur.execute(
                """
                SELECT id, process_id, from_node_id, to_node_id, connection_type,
                       conditions, transformation_rules, created_at, updated_at
                FROM process_connections
                WHERE process_id = %s
                """,
                (process_id,)
            )
            connection_rows = cur.fetchall()

        def _convert_timestamps(row):
            converted = dict(row)
            for key in ["created_at", "updated_at"]:
                if key in converted and converted[key] is not None:
                    converted[key] = converted[key].isoformat()
            return converted

        process = _convert_timestamps(process_row)
        process["id"] = str(process["id"])

        nodes = []
        for row in node_rows:
            node = _convert_timestamps(row)
            node["id"] = str(node["id"])
            node["process_id"] = str(node["process_id"])
            if node.get("from_node_id") is not None:
                node["from_node_id"] = str(node["from_node_id"])
            if node.get("to_node_id") is not None:
                node["to_node_id"] = str(node["to_node_id"])
            nodes.append(node)

        connections = []
        for row in connection_rows:
            connection = _convert_timestamps(row)
            connection["id"] = str(connection["id"])
            connection["process_id"] = str(connection["process_id"])
            connection["from_node_id"] = str(connection["from_node_id"])
            connection["to_node_id"] = str(connection["to_node_id"])
            connections.append(connection)

        return {
            "process": process,
            "nodes": nodes,
            "connections": connections
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching process: {str(e)}")

# ============================================================================
# NODE MANAGEMENT
# ============================================================================

@router.post("/processes/{process_id}/nodes")
async def create_node(
    process_id: str,
    company_name: str = Query(...),
    node_data: Dict[str, Any] = Body(...),
    current_user = Depends(get_current_active_user)
):
    """Create a new process node"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Use frontend-provided ID if available, otherwise generate new UUID
            node_id = node_data.get("id") or str(uuid.uuid4())
            cur.execute(
                """
                INSERT INTO financial_process_nodes 
                (id, process_id, node_type, name, description, x, y, sequence, canvas_mode, entity_context, status, configuration, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW())
                RETURNING id, node_type, name, description, x, y, canvas_mode, entity_context, status
                """,
                (
                    node_id,
                    process_id,
                    node_data.get("node_type") or node_data.get("type"),
                    node_data.get("name") or node_data.get("title"),
                    node_data.get("description", ""),
                    node_data.get("x_position") or node_data.get("x", 100),
                    node_data.get("y_position") or node_data.get("y", 100),
                    node_data.get("sequence", 1),
                    node_data.get("canvas_mode", "entity"),
                    node_data.get("entity_context") or node_data.get("entityContext"),
                    node_data.get("status", "pending"),
                    json.dumps(node_data.get("configuration", {}))
                )
            )
            saved_node = cur.fetchone()
            conn.commit()

        if not saved_node:
            raise HTTPException(status_code=500, detail="Failed to create node")

        saved_node = dict(saved_node)
        saved_node["id"] = node_id
        return saved_node

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating node: {str(e)}")

@router.put("/nodes/{node_id}")
async def update_node(
    node_id: str,
    company_name: str = Query(...),
    node_data: Dict[str, Any] = Body(...),
    current_user = Depends(get_current_active_user)
):
    """Update a process node"""
    try:
        update_clauses = []
        values = []

        for key, value in node_data.items():
            if key == "x_position":
                update_clauses.append("x = %s")
                values.append(value)
            elif key == "y_position":
                update_clauses.append("y = %s")
                values.append(value)
            elif key in ["name", "description", "x", "y", "configuration", "is_active", "canvas_mode", "sequence"]:
                update_clauses.append(f"{key} = %s")
                if key == "configuration":
                    values.append(json.dumps(value))
                else:
                    values.append(value)

        if not update_clauses:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        values.append(node_id)

        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = f"""
                UPDATE financial_process_nodes
                SET {', '.join(update_clauses)}, updated_at = NOW()
                WHERE id = %s
                RETURNING id, name, x, y, description, canvas_mode
            """
            cur.execute(query, tuple(values))
            updated_node = cur.fetchone()
            conn.commit()

        if not updated_node:
            raise HTTPException(status_code=404, detail="Node not found")

        node = dict(updated_node)
        node["id"] = str(node["id"])
        return {"node": node}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating node: {str(e)}")

@router.delete("/nodes/{node_id}")
async def delete_node(
    node_id: str,
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Delete a process node"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor()
            cur.execute(
                """
                DELETE FROM process_connections
                WHERE from_node_id = %s OR to_node_id = %s
                """,
                (node_id, node_id)
            )
            cur.execute(
                """
                DELETE FROM financial_process_nodes
                WHERE id = %s
                """,
                (node_id,)
            )
            deleted = cur.rowcount
            conn.commit()

        if deleted == 0:
            raise HTTPException(status_code=404, detail="Node not found")

        return {"message": "Node deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting node: {str(e)}")

@router.get("/processes/{process_id}/nodes")
async def get_process_nodes(
    process_id: str,
    company_name: str = Query(...),
    entity_context: str = Query(None, description="Filter by entity context"),
    current_user = Depends(get_current_active_user)
):
    """Get all nodes for a process, optionally filtered by entity context"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            if entity_context and entity_context != 'all':
                # Filter by specific entity context
                cur.execute("""
                    SELECT id, node_type, name, description, x, y, width, height, 
                           canvas_mode, entity_context, status, configuration, sequence, 
                           is_active, created_at, updated_at
                    FROM financial_process_nodes 
                    WHERE process_id = %s AND entity_context = %s AND is_active = true
                    ORDER BY sequence, created_at
                """, (process_id, entity_context))
            elif entity_context == 'all':
                # Get all nodes but group by entity context
                cur.execute("""
                    SELECT id, node_type, name, description, x, y, width, height, 
                           canvas_mode, entity_context, status, configuration, sequence, 
                           is_active, created_at, updated_at
                    FROM financial_process_nodes 
                    WHERE process_id = %s AND is_active = true AND entity_context IS NOT NULL
                    ORDER BY entity_context, sequence, created_at
                """, (process_id,))
            else:
                # Get all nodes
                cur.execute("""
                    SELECT id, node_type, name, description, x, y, width, height, 
                           canvas_mode, entity_context, status, configuration, sequence, 
                           is_active, created_at, updated_at
                    FROM financial_process_nodes 
                    WHERE process_id = %s AND is_active = true
                    ORDER BY sequence, created_at
                """, (process_id,))
            
            nodes = cur.fetchall()
            
            # Convert to list of dictionaries
            nodes_list = []
            for node in nodes:
                node_dict = dict(node)
                # Parse configuration JSON
                if node_dict.get('configuration'):
                    try:
                        node_dict['configuration'] = json.loads(node_dict['configuration']) if isinstance(node_dict['configuration'], str) else node_dict['configuration']
                    except:
                        node_dict['configuration'] = {}
                nodes_list.append(node_dict)
            
            return {
                "nodes": nodes_list,
                "total_count": len(nodes_list),
                "entity_context": entity_context
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching nodes: {str(e)}")

# ============================================================================
# CONNECTION MANAGEMENT
# ============================================================================

@router.post("/processes/{process_id}/connections")
async def create_connection(
    process_id: str,
    company_name: str = Query(...),
    connection_data: Dict[str, Any] = Body(...),
    current_user = Depends(get_current_active_user)
):
    """Create a connection between two nodes"""
    try:
        connection_id = str(uuid.uuid4())
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                INSERT INTO process_connections 
                (id, process_id, from_node_id, to_node_id, connection_type, conditions, transformation_rules, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id, from_node_id, to_node_id, connection_type
                """,
                (
                    connection_id,
                    process_id,
                    connection_data.get("from_node_id"),
                    connection_data.get("to_node_id"),
                    connection_data.get("connection_type", "data_flow"),
                    json.dumps(connection_data.get("conditions", {})),
                    json.dumps(connection_data.get("transformation_rules", {}))
                )
            )
            saved_connection = cur.fetchone()
            conn.commit()

        if not saved_connection:
            raise HTTPException(status_code=500, detail="Failed to create connection")

        connection = dict(saved_connection)
        connection["id"] = connection_id
        return connection

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating connection: {str(e)}")

# ============================================================================
# SCENARIO MANAGEMENT
# ============================================================================

@router.get("/processes/{process_id}/scenarios")
async def get_scenarios(
    process_id: str,
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Get all scenarios for a process"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                SELECT id, name, description, scenario_type, status, version_number,
                       fx_rate_overrides, custom_parameters, created_at, updated_at
                FROM process_scenarios
                WHERE process_id = %s
                ORDER BY created_at DESC
                """,
                (process_id,)
            )
            rows = cur.fetchall()

        scenarios = []
        for row in rows:
            scenario = dict(row)
            scenario["id"] = str(scenario["id"])
            if scenario.get("created_at") is not None:
                scenario["created_at"] = scenario["created_at"].isoformat()
            if scenario.get("updated_at") is not None:
                scenario["updated_at"] = scenario["updated_at"].isoformat()
            scenarios.append(scenario)

        return {"scenarios": scenarios}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scenarios: {str(e)}")

@router.post("/processes/{process_id}/scenarios")
async def create_scenario(
    process_id: str,
    company_name: str = Query(...),
    scenario_data: ScenarioCreate = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create a new scenario"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        scenario_id = str(uuid.uuid4())
        
        query = text(f"""
            INSERT INTO {company_db_name}.process_scenarios 
            (id, company_id, process_id, name, description, scenario_type, 
             fx_rate_overrides, custom_parameters, created_by, created_at, updated_at)
            VALUES (:id, :company_id, :process_id, :name, :description, :scenario_type,
                    :fx_rate_overrides, :custom_parameters, :created_by, NOW(), NOW())
            RETURNING id, name, scenario_type, status
        """)
        
        result = db.execute(query, {
            "id": scenario_id,
            "company_id": str(uuid.uuid4()),
            "process_id": process_id,
            "name": scenario_data.name,
            "description": scenario_data.description,
            "scenario_type": scenario_data.scenario_type,
            "fx_rate_overrides": json.dumps(scenario_data.fx_rate_overrides),
            "custom_parameters": json.dumps(scenario_data.custom_parameters),
            "created_by": str(current_user.id)
        })
        
        db.commit()
        scenario = dict(result.fetchone()._mapping)
        
        return {"scenario": scenario}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating scenario: {str(e)}")

# ============================================================================
# ENTITY STRUCTURE MANAGEMENT
# ============================================================================

@router.get("/processes/{process_id}/entities")
async def get_entity_structure(
    process_id: str,
    company_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get entity structure for a process"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        
        query = text(f"""
            SELECT * FROM {company_db_name}.entity_structures
            WHERE process_id = :process_id AND is_active = true
            ORDER BY entity_code
        """)
        
        result = db.execute(query, {"process_id": process_id})
        entities = [dict(row._mapping) for row in result]
        
        return {"entities": entities}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching entity structure: {str(e)}")

@router.post("/processes/{process_id}/entities")
async def create_entity_structure(
    process_id: str,
    company_name: str = Query(...),
    entity_data: EntityStructureCreate = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create entity structure entry"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        entity_id = str(uuid.uuid4())
        
        query = text(f"""
            INSERT INTO {company_db_name}.entity_structures 
            (id, company_id, process_id, entity_code, entity_name, parent_entity_code,
             ownership_percentage, consolidation_method, functional_currency, created_at, updated_at)
            VALUES (:id, :company_id, :process_id, :entity_code, :entity_name, :parent_entity_code,
                    :ownership_percentage, :consolidation_method, :functional_currency, NOW(), NOW())
            RETURNING id, entity_code, entity_name, ownership_percentage
        """)
        
        result = db.execute(query, {
            "id": entity_id,
            "company_id": str(uuid.uuid4()),
            "process_id": process_id,
            "entity_code": entity_data.entity_code,
            "entity_name": entity_data.entity_name,
            "parent_entity_code": entity_data.parent_entity_code,
            "ownership_percentage": entity_data.ownership_percentage,
            "consolidation_method": entity_data.consolidation_method,
            "functional_currency": entity_data.functional_currency
        })
        
        db.commit()
        entity = dict(result.fetchone()._mapping)
        
        return {"entity": entity}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating entity structure: {str(e)}")

# ============================================================================
# PROCESS EXECUTION
# ============================================================================

@router.post("/processes/{process_id}/execute")
async def execute_process(
    process_id: str,
    scenario_id: str = Query(...),
    execution_type: str = Query(default="simulate"),
    company_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Execute a financial process"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        execution_id = str(uuid.uuid4())
        
        # Create execution record
        create_execution_query = text(f"""
            INSERT INTO {company_db_name}.process_executions 
            (id, company_id, process_id, scenario_id, execution_type, status, 
             started_at, executed_by)
            VALUES (:id, :company_id, :process_id, :scenario_id, :execution_type, 
                    'in_progress', NOW(), :executed_by)
        """)
        
        db.execute(create_execution_query, {
            "id": execution_id,
            "company_id": str(uuid.uuid4()),
            "process_id": process_id,
            "scenario_id": scenario_id,
            "execution_type": execution_type,
            "executed_by": str(current_user.id)
        })
        
        # Here you would implement the actual process execution logic
        # For now, we'll simulate a successful execution
        
        # Update execution as completed
        update_execution_query = text(f"""
            UPDATE {company_db_name}.process_executions 
            SET status = 'success', completed_at = NOW(), 
                execution_time_ms = 1000,
                results = :results
            WHERE id = :execution_id
        """)
        
        results = {
            "total_entities": 5,
            "total_accounts": 100,
            "journals_generated": 25,
            "warnings": [],
            "errors": []
        }
        
        db.execute(update_execution_query, {
            "execution_id": execution_id,
            "results": json.dumps(results)
        })
        
        db.commit()
        
        return {
            "execution_id": execution_id,
            "status": "success",
            "results": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error executing process: {str(e)}")

# ============================================================================
# REFERENCE DATA
# ============================================================================

@router.get("/reference-data")
async def get_reference_data(
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Get reference data for process building"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get accounts
            cur.execute("""
                SELECT account_code as code, account_name as name, ifrs_category as account_type 
                FROM accounts
                WHERE is_active = true ORDER BY account_code
            """)
            accounts = [dict(row) for row in cur.fetchall()]
            
            # Get entities
            cur.execute("""
                SELECT entity_code as code, entity_name as name, currency 
                FROM entities
                WHERE is_active = true ORDER BY entity_code
            """)
            entities = [dict(row) for row in cur.fetchall()]
            
            return {
                "accounts": accounts,
                "entities": entities,
                "currencies": ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"],
                "node_types": [
                    {"type": "data_input", "name": "Data Input", "category": "Input"},
                    {"type": "journal_entry", "name": "Journal Entry", "category": "Processing"},
                    {"type": "fx_translation", "name": "FX Translation", "category": "Processing"},
                    {"type": "intercompany_elimination", "name": "Intercompany Elimination", "category": "Processing"},
                    {"type": "nci_allocation", "name": "NCI Allocation", "category": "Processing"},
                    {"type": "profit_loss", "name": "Profit & Loss Calculation", "category": "Calculation"},
                    {"type": "retained_earnings", "name": "Retained Earnings Rollforward", "category": "Calculation"},
                    {"type": "consolidation_output", "name": "Consolidation Output", "category": "Output"},
                    {"type": "validation", "name": "Validation", "category": "Control"},
                    {"type": "report_generation", "name": "Report Generation", "category": "Output"}
                ]
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reference data: {str(e)}")

# ============================================================================
# VALIDATION AND ALERTS
# ============================================================================

@router.get("/processes/{process_id}/alerts")
async def get_process_alerts(
    process_id: str,
    company_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get alerts for a process"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        
        query = text(f"""
            SELECT id, alert_type, severity, title, message, entity_code, 
                   account_code, amount, is_resolved, created_at
            FROM {company_db_name}.process_alerts
            WHERE process_id = :process_id
            ORDER BY created_at DESC
            LIMIT 100
        """)
        
        result = db.execute(query, {"process_id": process_id})
        alerts = [dict(row._mapping) for row in result]
        
        return {"alerts": alerts}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")

# ============================================================================
# NODE EXECUTION AND STATUS TRACKING
# ============================================================================

@router.post("/processes/{process_id}/execute-node")
async def execute_individual_node(
    process_id: str,
    node_data: dict = Body(...),
    company_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Execute an individual node in the process"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        node_id = node_data.get("node_id")
        node_type = node_data.get("node_type")
        entities = node_data.get("entities", [])
        
        # Create node execution record
        execution_id = str(uuid.uuid4())
        
        create_execution_query = text(f"""
            INSERT INTO {company_db_name}.process_executions 
            (id, company_id, process_id, execution_type, status, started_at, executed_by, 
             execution_data)
            VALUES (:id, :company_id, :process_id, :execution_type, 'running', NOW(), 
                    :executed_by, :execution_data)
        """)
        
        execution_data = {
            "node_id": node_id,
            "node_type": node_type,
            "entities": entities,
            "execution_mode": "individual_node"
        }
        
        db.execute(create_execution_query, {
            "id": execution_id,
            "company_id": str(uuid.uuid4()),
            "process_id": process_id,
            "execution_type": "node_execution",
            "executed_by": str(current_user.id),
            "execution_data": json.dumps(execution_data)
        })
        
        # Simulate node execution based on type
        import time
        import random
        
        # Simulate processing time
        processing_time = random.uniform(1, 3)  # 1-3 seconds
        time.sleep(processing_time)
        
        # Simulate success/failure
        success_rate = 0.9  # 90% success rate
        is_success = random.random() < success_rate
        
        if is_success:
            results = {
                "status": "completed",
                "message": f"{node_type} executed successfully",
                "entities_processed": len(entities),
                "processing_time_ms": int(processing_time * 1000),
                "records_affected": random.randint(10, 100)
            }
            status = "success"
        else:
            results = {
                "status": "error",
                "message": f"Failed to execute {node_type}",
                "error_details": "Simulated execution error for testing",
                "processing_time_ms": int(processing_time * 1000)
            }
            status = "error"
        
        # Update execution record
        update_execution_query = text(f"""
            UPDATE {company_db_name}.process_executions 
            SET status = :status, completed_at = NOW(), 
                execution_time_ms = :execution_time,
                results = :results
            WHERE id = :execution_id
        """)
        
        db.execute(update_execution_query, {
            "execution_id": execution_id,
            "status": status,
            "execution_time": int(processing_time * 1000),
            "results": json.dumps(results)
        })
        
        db.commit()
        
        return {
            "execution_id": execution_id,
            "node_id": node_id,
            "status": status,
            "results": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error executing node: {str(e)}")

@router.post("/processes/{process_id}/execute-flow")
async def execute_process_flow(
    process_id: str,
    flow_data: dict = Body(...),
    company_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Execute entire process flow sequentially"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        
        flow_mode = flow_data.get("flow_mode", "entity")
        entities = flow_data.get("entities", [])
        year = flow_data.get("year")
        period = flow_data.get("period")
        
        # Create flow execution record
        execution_id = str(uuid.uuid4())
        
        create_execution_query = text(f"""
            INSERT INTO {company_db_name}.process_executions 
            (id, company_id, process_id, execution_type, status, started_at, executed_by, 
             execution_data)
            VALUES (:id, :company_id, :process_id, :execution_type, 'running', NOW(), 
                    :executed_by, :execution_data)
        """)
        
        execution_data = {
            "flow_mode": flow_mode,
            "entities": entities,
            "year": year,
            "period": period,
            "execution_mode": "full_flow"
        }
        
        db.execute(create_execution_query, {
            "id": execution_id,
            "company_id": str(uuid.uuid4()),
            "process_id": process_id,
            "execution_type": "flow_execution",
            "executed_by": str(current_user.id),
            "execution_data": json.dumps(execution_data)
        })
        
        # Define flow steps based on mode
        if flow_mode == "entity":
            flow_steps = [
                "data_input", "journal_entry", "fx_translation", "deferred_tax",
                "profit_loss", "retained_earnings", "validation", "report_generation"
            ]
        else:  # consolidation
            flow_steps = [
                "data_input", "intercompany_elimination", "nci_allocation",
                "goodwill_impairment", "consolidation_output", "report_generation"
            ]
        
        # Execute each step
        step_results = []
        total_processing_time = 0
        
        for i, step in enumerate(flow_steps):
            import time
            import random
            
            step_time = random.uniform(0.5, 2.0)  # 0.5-2 seconds per step
            time.sleep(step_time)
            total_processing_time += step_time
            
            step_result = {
                "step": i + 1,
                "node_type": step,
                "status": "completed",
                "processing_time_ms": int(step_time * 1000),
                "entities_processed": len(entities),
                "records_affected": random.randint(5, 50)
            }
            step_results.append(step_result)
        
        # Final results
        results = {
            "status": "completed",
            "flow_mode": flow_mode,
            "total_steps": len(flow_steps),
            "entities_processed": len(entities),
            "total_processing_time_ms": int(total_processing_time * 1000),
            "step_results": step_results,
            "summary": {
                "journals_created": random.randint(20, 100),
                "eliminations_processed": random.randint(5, 25) if flow_mode == "consolidation" else 0,
                "reports_generated": 3
            }
        }
        
        # Update execution record
        update_execution_query = text(f"""
            UPDATE {company_db_name}.process_executions 
            SET status = 'success', completed_at = NOW(), 
                execution_time_ms = :execution_time,
                results = :results
            WHERE id = :execution_id
        """)
        
        db.execute(update_execution_query, {
            "execution_id": execution_id,
            "execution_time": int(total_processing_time * 1000),
            "results": json.dumps(results)
        })
        
        db.commit()
        
        return {
            "execution_id": execution_id,
            "status": "success",
            "results": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error executing flow: {str(e)}")

@router.get("/processes/{process_id}/execution-history")
async def get_execution_history(
    process_id: str,
    company_name: str = Query(...),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get execution history for a process"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        
        query = text(f"""
            SELECT id, execution_type, status, started_at, completed_at, 
                   execution_time_ms, results, execution_data
            FROM {company_db_name}.process_executions
            WHERE process_id = :process_id
            ORDER BY started_at DESC
            LIMIT :limit
        """)
        
        result = db.execute(query, {"process_id": process_id, "limit": limit})
        executions = []
        
        for row in result:
            execution = dict(row._mapping)
            # Parse JSON fields
            if execution['results']:
                execution['results'] = json.loads(execution['results'])
            if execution['execution_data']:
                execution['execution_data'] = json.loads(execution['execution_data'])
            executions.append(execution)
        
        return {"executions": executions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching execution history: {str(e)}")

# ============================================================================
# DATA INPUT MANAGEMENT
# ============================================================================

def create_process_table(conn, process_id: str, process_name: str, data_type: str):
    """Create process-specific table for data isolation"""
    cur = conn.cursor()
    
    # Sanitize process name for table naming
    safe_process_name = re.sub(r'[^a-zA-Z0-9_]', '_', process_name.lower())
    table_name = f"{safe_process_name}_{data_type}_entries"
    
    # Create table if it doesn't exist
    if data_type == 'entity_amounts':
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id VARCHAR(36) PRIMARY KEY,
                process_id VARCHAR(36) NOT NULL,
                entity_id VARCHAR(36),
                entity_code VARCHAR(50),
                entity_name VARCHAR(255),
                account_id VARCHAR(36),
                account_code VARCHAR(50),
                account_name VARCHAR(255),
                period_id VARCHAR(36),
                period_code VARCHAR(50),
                period_name VARCHAR(255),
                fiscal_year VARCHAR(100),
                fiscal_month VARCHAR(10),
                transaction_date DATE,
                amount DECIMAL(18,2),
                currency VARCHAR(10) DEFAULT 'USD',
                scenario_id VARCHAR(36),
                scenario_code VARCHAR(50),
                description TEXT,
                reference_id VARCHAR(100),
                custom_fields JSONB DEFAULT '{{}}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100)
            )
        """)
    elif data_type == 'ic_amounts':
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id VARCHAR(36) PRIMARY KEY,
                process_id VARCHAR(36) NOT NULL,
                from_entity_id VARCHAR(36),
                from_entity_code VARCHAR(50),
                from_entity_name VARCHAR(255),
                to_entity_id VARCHAR(36),
                to_entity_code VARCHAR(50),
                to_entity_name VARCHAR(255),
                from_account_id VARCHAR(36),
                from_account_code VARCHAR(50),
                from_account_name VARCHAR(255),
                to_account_id VARCHAR(36),
                to_account_code VARCHAR(50),
                to_account_name VARCHAR(255),
                period_id VARCHAR(36),
                period_code VARCHAR(50),
                period_name VARCHAR(255),
                fiscal_year VARCHAR(100),
                fiscal_month VARCHAR(10),
                transaction_date DATE,
                amount DECIMAL(18,2),
                currency VARCHAR(10) DEFAULT 'USD',
                scenario_id VARCHAR(36),
                scenario_code VARCHAR(50),
                description TEXT,
                reference_id VARCHAR(100),
                transaction_type VARCHAR(100),
                fx_rate DECIMAL(10,6) DEFAULT 1.0,
                custom_fields JSONB DEFAULT '{{}}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100)
            )
        """)
    elif data_type == 'other_amounts':
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id VARCHAR(36) PRIMARY KEY,
                process_id VARCHAR(36) NOT NULL,
                entity_id VARCHAR(36),
                entity_code VARCHAR(50),
                entity_name VARCHAR(255),
                account_id VARCHAR(36),
                account_code VARCHAR(50),
                account_name VARCHAR(255),
                period_id VARCHAR(36),
                period_code VARCHAR(50),
                period_name VARCHAR(255),
                fiscal_year VARCHAR(100),
                fiscal_month VARCHAR(10),
                transaction_date DATE,
                amount DECIMAL(18,2),
                currency VARCHAR(10) DEFAULT 'USD',
                scenario_id VARCHAR(36),
                scenario_code VARCHAR(50),
                description TEXT,
                reference_id VARCHAR(100),
                adjustment_type VARCHAR(100),
                custom_transaction_type VARCHAR(100),
                custom_fields JSONB DEFAULT '{{}}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100)
            )
        """)
    
    # Update existing tables to fix column size issues
    try:
        cur.execute(f"ALTER TABLE {table_name} ALTER COLUMN fiscal_year TYPE VARCHAR(100)")
        print(f"✅ Updated fiscal_year column size in {table_name}")
    except Exception as e:
        # Column might already be the right size or table might not exist yet
        print(f"ℹ️ Fiscal year column update for {table_name}: {e}")
    
    conn.commit()
    return table_name

def convert_date_to_period(transaction_date: str, conn, company_name: str):
    """Convert transaction date to fiscal period information"""
    try:
        from datetime import datetime
        
        # Handle None or empty transaction_date
        if not transaction_date:
            print("⚠️ No transaction date provided, using current date")
            date_obj = datetime.now().date()
        else:
            date_obj = datetime.strptime(transaction_date, '%Y-%m-%d').date()
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Find the appropriate fiscal year and period
        cur.execute("""
            SELECT fy.id as fiscal_year_id, fy.year_name as fiscal_year,
                   p.id as period_id, p.period_name, p.period_code,
                   p.start_date, p.end_date
            FROM fiscal_years fy
            JOIN periods p ON p.fiscal_year_id = fy.id
            WHERE %s BETWEEN p.start_date AND p.end_date
            ORDER BY p.start_date
            LIMIT 1
        """, (date_obj,))
        
        period_info = cur.fetchone()
        
        if period_info:
            return {
                'fiscal_year_id': period_info['fiscal_year_id'],
                'fiscal_year': period_info['fiscal_year'],
                'period_id': period_info['period_id'],
                'period_name': period_info['period_name'],
                'period_code': period_info['period_code'],
                'fiscal_month': str(date_obj.month).zfill(2)
            }
        else:
            # Check if any fiscal years exist at all
            cur.execute("SELECT COUNT(*) as count FROM fiscal_years")
            fy_count = cur.fetchone()['count']
            
            if fy_count == 0:
                print(f"⚠️ No fiscal years found in database. Please set up fiscal years first.")
            else:
                print(f"⚠️ No period found for date {date_obj}. Available fiscal years: {fy_count}")
            
            # Fallback: create basic period info from date
            return {
                'fiscal_year_id': None,
                'fiscal_year': str(date_obj.year),
                'period_id': None,
                'period_name': f"{date_obj.strftime('%B')} {date_obj.year}",
                'period_code': f"{date_obj.year}-{str(date_obj.month).zfill(2)}",
                'fiscal_month': str(date_obj.month).zfill(2)
            }
    except Exception as e:
        print(f"Error converting date to period: {e}")
        return {
            'fiscal_year_id': None,
            'fiscal_year': '2024',
            'period_id': None,
            'period_name': 'Unknown Period',
            'period_code': 'UNKNOWN',
            'fiscal_month': '01'
        }

@router.post("/processes/{process_id}/data-input/{data_type}")
async def create_data_input(
    process_id: str,
    data_type: str,  # 'entity_amounts', 'ic_amounts', or 'other_amounts'
    data: dict = Body(...),
    company_name: str = Query(...)
):
    """Create a new data input entry with process-specific table and proper data handling"""
    try:
        print(f"💾 Creating {data_type} entry for process {process_id}")
        print(f"📥 Data received: {data}")
        
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            try:
                # Get process information
                cur.execute("SELECT name FROM financial_processes WHERE id = %s", (process_id,))
                process_result = cur.fetchone()
                process_name = process_result['name'] if process_result else f"process_{process_id[:8]}"
                
                # Create process-specific table
                table_name = create_process_table(conn, process_id, process_name, data_type)
                
                # Convert transaction date to period information
                transaction_date = data.get('transaction_date') or data.get('period_date')
                period_info = convert_date_to_period(transaction_date, conn, company_name)
                
                # Get entity information - handle both entity_id and entity_code
                entity_info = {}
                entity_identifier = data.get('entity_id') or data.get('entity_code')
                if entity_identifier:
                    print(f"🔍 Looking up entity with identifier: {entity_identifier}")
                    cur.execute("""
                        SELECT id, code, name 
                        FROM axes_entities 
                        WHERE id = %s OR code = %s::text
                    """, (entity_identifier, str(entity_identifier)))
                    entity_result = cur.fetchone()
                    if entity_result:
                        entity_info = {
                            'entity_id': entity_result['id'],
                            'entity_code': entity_result['code'],
                            'entity_name': entity_result['name']
                        }
                        print(f"✅ Found entity: {entity_info}")
                    else:
                        print(f"⚠️ Entity not found for identifier: {entity_identifier}")
                else:
                    print("⚠️ No entity identifier provided")
                
                # Get account information - handle both account_id and account_code
                account_info = {}
                account_identifier = data.get('account_id') or data.get('account_code')
                if account_identifier:
                    print(f"🔍 Looking up account with identifier: {account_identifier}")
                    cur.execute("""
                        SELECT id, code, name 
                        FROM axes_accounts 
                        WHERE id = %s OR code = %s::text
                    """, (account_identifier, str(account_identifier)))
                    account_result = cur.fetchone()
                    if account_result:
                        account_info = {
                            'account_id': account_result['id'],
                            'account_code': account_result['code'],
                            'account_name': account_result['name']
                        }
                        print(f"✅ Found account: {account_info}")
                    else:
                        print(f"⚠️ Account not found for identifier: {account_identifier}")
                else:
                    print("⚠️ No account identifier provided")
                
                entry_id = str(uuid.uuid4())
                
                # Insert data based on type
                if data_type == 'entity_amounts':
                    cur.execute(f"""
                        INSERT INTO {table_name} 
                        (id, process_id, entity_id, entity_code, entity_name, account_id, account_code, account_name,
                         period_id, period_code, period_name, fiscal_year, fiscal_month, transaction_date,
                         amount, currency, scenario_id, scenario_code, description, reference_id, custom_fields, created_by)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING *
                    """, (
                        entry_id, process_id, 
                        entity_info.get('entity_id'), entity_info.get('entity_code'), entity_info.get('entity_name'),
                        account_info.get('account_id'), account_info.get('account_code'), account_info.get('account_name'),
                        period_info['period_id'], period_info['period_code'], period_info['period_name'],
                        period_info['fiscal_year'], period_info['fiscal_month'], transaction_date,
                        data.get('amount'), data.get('currency', 'USD'),
                        data.get('scenario_id'), data.get('scenario_code'), data.get('description'),
                        data.get('reference_id'), json.dumps(data.get('custom_fields', {})), data.get('created_by')
                    ))
                
                elif data_type == 'ic_amounts':
                    # Get from/to entity information
                    from_entity_info = {}
                    to_entity_info = {}
                    from_account_info = {}
                    to_account_info = {}
                
                    if data.get('from_entity_id'):
                        cur.execute("SELECT code, name FROM axes_entities WHERE id = %s OR code = %s::text", 
                                  (data.get('from_entity_id'), str(data.get('from_entity_id'))))
                        result = cur.fetchone()
                        if result:
                            from_entity_info = {'entity_code': result['code'], 'entity_name': result['name']}
                    
                    if data.get('to_entity_id'):
                        cur.execute("SELECT code, name FROM axes_entities WHERE id = %s OR code = %s::text", 
                                  (data.get('to_entity_id'), str(data.get('to_entity_id'))))
                        result = cur.fetchone()
                        if result:
                            to_entity_info = {'entity_code': result['code'], 'entity_name': result['name']}
                    
                    if data.get('from_account_id'):
                        cur.execute("SELECT code, name FROM axes_accounts WHERE id = %s OR code = %s::text", 
                                  (data.get('from_account_id'), str(data.get('from_account_id'))))
                        result = cur.fetchone()
                        if result:
                            from_account_info = {'account_code': result['code'], 'account_name': result['name']}
                    
                    if data.get('to_account_id'):
                        cur.execute("SELECT code, name FROM axes_accounts WHERE id = %s OR code = %s::text", 
                                  (data.get('to_account_id'), str(data.get('to_account_id'))))
                        result = cur.fetchone()
                        if result:
                            to_account_info = {'account_code': result['code'], 'account_name': result['name']}
                    
                    cur.execute(f"""
                        INSERT INTO {table_name} 
                        (id, process_id, from_entity_id, from_entity_code, from_entity_name, to_entity_id, to_entity_code, to_entity_name,
                         from_account_id, from_account_code, from_account_name, to_account_id, to_account_code, to_account_name,
                         period_id, period_code, period_name, fiscal_year, fiscal_month, transaction_date,
                         amount, currency, scenario_id, scenario_code, description, reference_id, transaction_type, fx_rate, custom_fields, created_by)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING *
                    """, (
                        entry_id, process_id,
                        data.get('from_entity_id'), from_entity_info.get('entity_code'), from_entity_info.get('entity_name'),
                        data.get('to_entity_id'), to_entity_info.get('entity_code'), to_entity_info.get('entity_name'),
                        data.get('from_account_id'), from_account_info.get('account_code'), from_account_info.get('account_name'),
                        data.get('to_account_id'), to_account_info.get('account_code'), to_account_info.get('account_name'),
                        period_info['period_id'], period_info['period_code'], period_info['period_name'],
                        period_info['fiscal_year'], period_info['fiscal_month'], data.get('transaction_date'),
                        data.get('amount'), data.get('currency_code', 'USD'),
                        data.get('scenario_id'), data.get('scenario_code'), data.get('description'),
                        data.get('reference_id'), data.get('transaction_type'), data.get('fx_rate', 1.0),
                        json.dumps(data.get('custom_fields', {})), data.get('created_by')
                    ))
                
                elif data_type == 'other_amounts':
                    cur.execute(f"""
                        INSERT INTO {table_name} 
                        (id, process_id, entity_id, entity_code, entity_name, account_id, account_code, account_name,
                         period_id, period_code, period_name, fiscal_year, fiscal_month, transaction_date,
                         amount, currency, scenario_id, scenario_code, description, reference_id, 
                         adjustment_type, custom_transaction_type, custom_fields, created_by)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING *
                    """, (
                        entry_id, process_id,
                        entity_info.get('entity_id'), entity_info.get('entity_code'), entity_info.get('entity_name'),
                        account_info.get('account_id'), account_info.get('account_code'), account_info.get('account_name'),
                        period_info['period_id'], period_info['period_code'], period_info['period_name'],
                        period_info['fiscal_year'], period_info['fiscal_month'], data.get('transaction_date'),
                        data.get('amount'), data.get('currency', 'USD'),
                        data.get('scenario_id'), data.get('scenario_code'), data.get('description'),
                        data.get('reference_id'), data.get('adjustment_type'), data.get('custom_transaction_type'),
                        json.dumps(data.get('custom_fields', {})), data.get('created_by')
                    ))
            
                result = cur.fetchone()
                conn.commit()
                
                print(f"✅ Created {data_type} entry in table {table_name}: {result}")
                return {
                    "entry": dict(result), 
                    "table_name": table_name,
                    "message": f"{data_type.replace('_', ' ').title()} entry created successfully"
                }
                
            except Exception as inner_e:
                conn.rollback()
                print(f"❌ Transaction error in {data_type}: {str(inner_e)}")
                raise inner_e
            
    except Exception as e:
        print(f"❌ Error creating {data_type}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating data input: {str(e)}")

@router.get("/processes/{process_id}/data-input/{data_type}")
async def get_data_input(
    process_id: str,
    data_type: str,
    company_name: str = Query(...),
    entity_filter: Optional[str] = Query(None, description="Filter by entity ID or code"),
    year_id: Optional[str] = Query(None, description="Filter by fiscal year"),
    scenario_id: Optional[str] = Query(None, description="Filter by scenario")
):
    """Get all data input entries for a specific type with optional filtering from process-specific tables"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get process information to determine table name
            cur.execute("SELECT name FROM financial_processes WHERE id = %s", (process_id,))
            process_result = cur.fetchone()
            process_name = process_result['name'] if process_result else f"process_{process_id[:8]}"
            
            # Generate process-specific table name
            safe_process_name = re.sub(r'[^a-zA-Z0-9_]', '_', process_name.lower())
            table_name = f"{safe_process_name}_{data_type}_entries"
            
            # Check if table exists
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = %s
                )
            """, (table_name,))
            
            result = cur.fetchone()
            table_exists = result['exists'] if result else False
            
            if not table_exists:
                print(f"⚠️ Table {table_name} does not exist, returning empty results")
                return {
                    "entries": [],
                    "filters": {
                        "entity_filter": entity_filter,
                        "year_id": year_id,
                        "scenario_id": scenario_id,
                        "data_type": data_type
                    },
                    "total_count": 0,
                    "table_name": table_name,
                    "table_exists": False
                }
            
            # Build dynamic WHERE clause based on filters
            where_conditions = ["process_id = %s"]
            params = [process_id]
            
            # Add entity filter based on data type
            if entity_filter and entity_filter != 'all':
                if data_type == 'entity_amounts':
                    where_conditions.append("(entity_id = %s OR entity_code = %s)")
                    params.extend([entity_filter, entity_filter])
                elif data_type == 'ic_amounts':
                    where_conditions.append("(from_entity_id = %s OR to_entity_id = %s OR from_entity_code = %s OR to_entity_code = %s)")
                    params.extend([entity_filter, entity_filter, entity_filter, entity_filter])
                elif data_type == 'other_amounts':
                    where_conditions.append("(entity_id = %s OR entity_code = %s)")
                    params.extend([entity_filter, entity_filter])
            
            # Add year filter if provided
            if year_id:
                where_conditions.append("fiscal_year = %s")
                params.append(year_id)
            
            # Add scenario filter if provided
            if scenario_id:
                where_conditions.append("scenario_id = %s")
                params.append(scenario_id)
            
            where_clause = " AND ".join(where_conditions)
            
            query = f"""
                SELECT * FROM {table_name}
                WHERE {where_clause}
                ORDER BY created_at DESC
            """
            
            cur.execute(query, params)
            entries = cur.fetchall()
            
            # Convert to list of dicts for JSON serialization
            entries_list = []
            for entry in entries:
                entry_dict = dict(entry)
                # Convert any Decimal values to float for JSON serialization
                for key, value in entry_dict.items():
                    if isinstance(value, Decimal):
                        entry_dict[key] = float(value)
                entries_list.append(entry_dict)
            
            print(f"✅ Retrieved {len(entries_list)} entries from table {table_name}")
            
            return {
                "entries": entries_list,
                "filters": {
                    "entity_filter": entity_filter,
                    "year_id": year_id,
                    "scenario_id": scenario_id,
                    "data_type": data_type
                },
                "total_count": len(entries_list),
                "table_name": table_name,
                "table_exists": True
            }
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching data input: {str(e)}")

@router.delete("/processes/{process_id}/data-input/{data_type}/{entry_id}")
async def delete_data_input(
    process_id: str,
    data_type: str,
    entry_id: str,
    company_name: str = Query(...)
):
    """Delete a data input entry"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor()
            
            table_name = data_type
            cur.execute(f"""
                DELETE FROM {table_name}
                WHERE id = %s AND process_id = %s
                RETURNING id
            """, (entry_id, process_id))
            
            result = cur.fetchone()
            conn.commit()
            
            if not result:
                raise HTTPException(status_code=404, detail="Entry not found")
            
            return {"message": "Entry deleted successfully"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting entry: {str(e)}")

@router.get("/processes/{process_id}/data-input-summary")
async def get_data_input_summary(
    process_id: str,
    company_name: str = Query(...),
    entity_filter: Optional[str] = Query(None, description="Filter by entity ID or code")
):
    """Get summary statistics for data input across all types"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            summary = {}
            
            # Get counts for each data type
            for data_type in ['entity_amounts', 'ic_amounts', 'other_amounts']:
                where_conditions = ["process_id = %s"]
                params = [process_id]
                
                # Add entity filter if provided
                if entity_filter and entity_filter != 'all':
                    if data_type == 'entity_amounts':
                        where_conditions.append("(entity_id = %s OR entity_code = %s)")
                        params.extend([entity_filter, entity_filter])
                    elif data_type == 'ic_amounts':
                        where_conditions.append("(from_entity_id = %s OR to_entity_id = %s OR from_entity_code = %s OR to_entity_code = %s)")
                        params.extend([entity_filter, entity_filter, entity_filter, entity_filter])
                    elif data_type == 'other_amounts':
                        where_conditions.append("(entity_id = %s OR entity_code = %s)")
                        params.extend([entity_filter, entity_filter])
                
                where_clause = " AND ".join(where_conditions)
                
                # Check if table exists first
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = %s
                    )
                """, (data_type,))
                
                table_exists = cur.fetchone()[0]
                
                if table_exists:
                    cur.execute(f"""
                        SELECT 
                            COUNT(*) as total_entries,
                            COALESCE(SUM(CASE WHEN amount IS NOT NULL THEN ABS(amount) ELSE 0 END), 0) as total_amount,
                            COUNT(DISTINCT COALESCE(entity_id, entity_code)) as unique_entities
                        FROM {data_type}
                        WHERE {where_clause}
                    """, params)
                    
                    result = cur.fetchone()
                    summary[data_type] = {
                        "total_entries": result['total_entries'] or 0,
                        "total_amount": float(result['total_amount']) if result['total_amount'] else 0.0,
                        "unique_entities": result['unique_entities'] or 0
                    }
                else:
                    summary[data_type] = {
                        "total_entries": 0,
                        "total_amount": 0.0,
                        "unique_entities": 0
                    }
            
            return {
                "summary": summary,
                "entity_filter": entity_filter,
                "process_id": process_id
            }
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching data input summary: {str(e)}")

# ============================================================================
# PROCESS CONFIGURATION MANAGEMENT
# ============================================================================

@router.get("/processes/{process_id}/configuration")
async def get_process_configuration(
    process_id: str,
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Get process configuration including workflow nodes, settings, and fiscal parameters"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get configuration from process_configurations table
            cur.execute("""
                SELECT configuration, updated_at
                FROM process_configurations
                WHERE process_id = %s
            """, (process_id,))
            
            config_row = cur.fetchone()
            
            # Load nodes from database
            cur.execute("""
                SELECT id, node_type, name, description, x, y, width, height, 
                       canvas_mode, entity_context, status, configuration, sequence, 
                       is_active, created_at, updated_at
                FROM financial_process_nodes 
                WHERE process_id = %s AND is_active = true
                ORDER BY sequence, created_at
            """, (process_id,))
            
            nodes_from_db = cur.fetchall()
            
            # Convert database nodes to frontend format
            nodes = []
            for node in nodes_from_db:
                node_dict = dict(node)
                # Convert configuration JSON string back to dict
                if node_dict.get('configuration'):
                    try:
                        node_dict['configuration'] = json.loads(node_dict['configuration']) if isinstance(node_dict['configuration'], str) else node_dict['configuration']
                    except:
                        node_dict['configuration'] = {}
                
                # Map database fields to frontend format
                frontend_node = {
                    "id": str(node_dict['id']),
                    "type": node_dict['node_type'],
                    "title": node_dict['name'],
                    "description": node_dict['description'] or "",
                    "x": float(node_dict['x']) if node_dict['x'] else 100,
                    "y": float(node_dict['y']) if node_dict['y'] else 100,
                    "width": float(node_dict['width']) if node_dict['width'] else 200,
                    "height": float(node_dict['height']) if node_dict['height'] else 100,
                    "entityContext": node_dict['entity_context'],
                    "status": node_dict['status'] or 'pending',
                    "sequence": node_dict['sequence'] or 0,
                    "config": node_dict['configuration'] or {},
                    "flowType": "both",  # Default value
                    "category": "Process",  # Default value
                    "color": "bg-blue-500",  # Default value
                    "icon": node_dict['node_type']  # Will be converted to icon component on frontend
                }
                nodes.append(frontend_node)
            
            if not config_row:
                # Return configuration with nodes from database
                return {
                    "nodes": nodes,
                    "entityWorkflowNodes": [n for n in nodes if n.get('entityContext') or True],  # Include all for backward compatibility
                    "consolidationWorkflowNodes": [n for n in nodes if n.get('entityContext') or True],
                    "flowMode": "entity",
                    "selectedEntities": [],
                    "fiscalYear": None,
                    "periods": [],
                    "scenario": None,
                    "fiscalSettingsLocked": False
                }
            
            # Return the stored configuration with nodes from database
            config = config_row['configuration']
            config['nodes'] = nodes  # Override with database nodes
            config['entityWorkflowNodes'] = [n for n in nodes if n.get('entityContext') or True]
            config['consolidationWorkflowNodes'] = [n for n in nodes if n.get('entityContext') or True]
            config['updated_at'] = config_row['updated_at'].isoformat() if config_row['updated_at'] else None
            
            return config
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching configuration: {str(e)}")

@router.put("/processes/{process_id}/configuration")
async def save_process_configuration(
    process_id: str,
    configuration: dict = Body(...),
    company_name: str = Query(...)
):
    """Save process configuration including workflow nodes, settings, and fiscal parameters"""
    try:
        print(f"💾 PUT /processes/{process_id}/configuration called")
        print(f"📊 Configuration data: {json.dumps(configuration, indent=2)}")
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Check if configuration already exists
            cur.execute("""
                SELECT id FROM process_configurations
                WHERE process_id = %s
            """, (process_id,))
            
            existing = cur.fetchone()
            
            if existing:
                # Update existing configuration
                cur.execute("""
                    UPDATE process_configurations
                    SET configuration = %s, updated_at = NOW()
                    WHERE process_id = %s
                    RETURNING id, updated_at
                """, (json.dumps(configuration), process_id))
            else:
                # Insert new configuration
                config_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO process_configurations 
                    (id, process_id, configuration, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                    RETURNING id, updated_at
                """, (config_id, process_id, json.dumps(configuration)))
            
            result = cur.fetchone()
            
            # Save nodes to database if they exist in configuration
            nodes = configuration.get('nodes', [])
            if nodes:
                print(f"💾 Saving {len(nodes)} nodes to database")
                
                # First, mark all existing nodes as inactive
                cur.execute("""
                    UPDATE financial_process_nodes 
                    SET is_active = false, updated_at = NOW()
                    WHERE process_id = %s
                """, (process_id,))
                
                # Insert or update nodes
                for node in nodes:
                    node_id = node.get('id')
                    if not node_id:
                        node_id = str(uuid.uuid4())
                    
                    # Validate UUID format
                    try:
                        uuid.UUID(node_id)
                    except ValueError:
                        print(f"⚠️ Invalid UUID format for node {node_id}, generating new UUID")
                        node_id = str(uuid.uuid4())
                    
                    # Check if node exists
                    cur.execute("""
                        SELECT id FROM financial_process_nodes 
                        WHERE id = %s
                    """, (node_id,))
                    
                    existing_node = cur.fetchone()
                    
                    if existing_node:
                        # Update existing node
                        cur.execute("""
                            UPDATE financial_process_nodes 
                            SET node_type = %s, name = %s, description = %s, 
                                x = %s, y = %s, width = %s, height = %s,
                                entity_context = %s, status = %s, sequence = %s,
                                configuration = %s, is_active = true, updated_at = NOW()
                            WHERE id = %s
                        """, (
                            node.get('type'),
                            node.get('title') or node.get('name'),
                            node.get('description', ''),
                            node.get('x', 100),
                            node.get('y', 100),
                            node.get('width', 200),
                            node.get('height', 100),
                            node.get('entityContext'),
                            node.get('status', 'pending'),
                            node.get('sequence', 0),
                            json.dumps(node.get('config', {})),
                            node_id
                        ))
                    else:
                        # Insert new node
                        cur.execute("""
                            INSERT INTO financial_process_nodes 
                            (id, process_id, node_type, name, description, x, y, width, height,
                             entity_context, status, sequence, configuration, is_active, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, true, NOW(), NOW())
                        """, (
                            node_id,
                            process_id,
                            node.get('type'),
                            node.get('title') or node.get('name'),
                            node.get('description', ''),
                            node.get('x', 100),
                            node.get('y', 100),
                            node.get('width', 200),
                            node.get('height', 100),
                            node.get('entityContext'),
                            node.get('status', 'pending'),
                            node.get('sequence', 0),
                            json.dumps(node.get('config', {}))
                        ))
                
                print(f"✅ Successfully saved {len(nodes)} nodes to database")
            
            conn.commit()
            
            return {
                "message": "Configuration and nodes saved successfully",
                "configuration_id": str(result['id']),
                "nodes_saved": len(nodes),
                "updated_at": result['updated_at'].isoformat() if result['updated_at'] else None
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving configuration: {str(e)}")

@router.get("/processes/{process_id}/consolidation-nodes")
async def get_consolidation_nodes(
    process_id: str,
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Get nodes specifically for consolidation mode - returns nodes from all entities"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get all nodes that are suitable for consolidation
            cur.execute("""
                SELECT id, node_type, name, description, x, y, width, height, 
                       canvas_mode, entity_context, status, configuration, sequence, 
                       is_active, created_at, updated_at
                FROM financial_process_nodes 
                WHERE process_id = %s AND is_active = true 
                AND (canvas_mode = 'consolidation' OR canvas_mode = 'both' OR canvas_mode IS NULL)
                ORDER BY entity_context, sequence, created_at
            """, (process_id,))
            
            nodes = cur.fetchall()
            
            # Convert to list and group by entity
            nodes_by_entity = {}
            for node in nodes:
                node_dict = dict(node)
                # Parse configuration JSON
                if node_dict.get('configuration'):
                    try:
                        node_dict['configuration'] = json.loads(node_dict['configuration']) if isinstance(node_dict['configuration'], str) else node_dict['configuration']
                    except:
                        node_dict['configuration'] = {}
                
                entity_context = node_dict.get('entity_context', 'global')
                if entity_context not in nodes_by_entity:
                    nodes_by_entity[entity_context] = []
                nodes_by_entity[entity_context].append(node_dict)
            
            return {
                "nodes_by_entity": nodes_by_entity,
                "total_entities": len(nodes_by_entity),
                "total_nodes": len(nodes)
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching consolidation nodes: {str(e)}")

@router.put("/processes/{process_id}/flow-mode")
async def update_flow_mode(
    process_id: str,
    flow_data: dict = Body(...),
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Update the flow mode (entity vs consolidation) for a process"""
    try:
        flow_mode = flow_data.get('flow_mode', 'entity')
        selected_entities = flow_data.get('selected_entities', [])
        
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Update the process configuration
            cur.execute("""
                UPDATE process_configurations 
                SET configuration = jsonb_set(
                    COALESCE(configuration, '{}'),
                    '{flow_mode}',
                    %s
                ) || jsonb_build_object('selected_entities', %s)
                WHERE process_id = %s
            """, (json.dumps(flow_mode), json.dumps(selected_entities), process_id))
            
            conn.commit()
            
            return {
                "message": f"Flow mode updated to {flow_mode}",
                "flow_mode": flow_mode,
                "selected_entities": selected_entities
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating flow mode: {str(e)}")

# ============================================================================
# PYDANTIC MODELS FOR NEW FUNCTIONALITY
# ============================================================================

class EntityNodeConfig(BaseModel):
    entity_code: str
    node_id: str
    enabled: bool = True
    settings: Dict[str, Any] = {}

class ProcessExecutionRequest(BaseModel):
    entities: List[str]
    fiscal_year: Optional[int] = None
    periods: List[str] = []
    scenario_id: Optional[str] = None
    flow_mode: str = "entity"
    node_id: Optional[str] = None  # For single node execution

class CSVExportRequest(BaseModel):
    entity_codes: List[str] = []
    export_types: List[str] = ["entity_amounts", "ic_amounts", "other_amounts"]
    fiscal_year: Optional[int] = None
    period_codes: List[str] = []

# ============================================================================
# CSV EXPORT UTILITIES
# ============================================================================

def ensure_csv_directory(company_name: str) -> str:
    """Ensure CSV export directory exists and return path."""
    csv_dir = Path(f"./csv_exports/{normalize_company_db_name(company_name)}")
    csv_dir.mkdir(parents=True, exist_ok=True)
    return str(csv_dir)

def export_entity_amounts_to_csv(conn, process_id: str, entity_codes: List[str], csv_dir: str) -> Dict[str, Any]:
    """Export entity amounts to CSV file."""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Build query with entity filter
    entity_filter = ""
    params = [process_id]
    if entity_codes:
        placeholders = ",".join(["%s"] * len(entity_codes))
        entity_filter = f"AND entity_code IN ({placeholders})"
        params.extend(entity_codes)
    
    cur.execute(f"""
        SELECT process_id, entity_code, account_code, period_code, 
               amount, currency, description, custom_fields, created_at
        FROM entity_amounts 
        WHERE process_id = %s {entity_filter}
        ORDER BY entity_code, period_code, account_code
    """, params)
    
    rows = cur.fetchall()
    
    if not rows:
        return {"file_path": None, "row_count": 0}
    
    # Generate CSV filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"entity_amounts_{timestamp}.csv"
    file_path = os.path.join(csv_dir, filename)
    
    # Write to CSV
    with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['process_id', 'entity_code', 'account_code', 'period_code', 
                     'amount', 'currency', 'description', 'custom_fields', 'created_at']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in rows:
            # Convert custom_fields JSON to string
            row_dict = dict(row)
            row_dict['custom_fields'] = json.dumps(row_dict['custom_fields']) if row_dict['custom_fields'] else ''
            writer.writerow(row_dict)
    
    return {
        "file_path": file_path,
        "row_count": len(rows),
        "file_size": os.path.getsize(file_path)
    }

def export_ic_amounts_to_csv(conn, process_id: str, entity_codes: List[str], csv_dir: str) -> Dict[str, Any]:
    """Export intercompany amounts to CSV file."""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    entity_filter = ""
    params = [process_id]
    if entity_codes:
        placeholders = ",".join(["%s"] * len(entity_codes))
        entity_filter = f"AND entity_code IN ({placeholders})"
        params.extend(entity_codes)
    
    cur.execute(f"""
        SELECT process_id, entity_code, counterparty_entity_code, account_code, 
               period_code, amount, currency, transaction_type, description, 
               custom_fields, created_at
        FROM ic_amounts 
        WHERE process_id = %s {entity_filter}
        ORDER BY entity_code, counterparty_entity_code, period_code, account_code
    """, params)
    
    rows = cur.fetchall()
    
    if not rows:
        return {"file_path": None, "row_count": 0}
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"ic_amounts_{timestamp}.csv"
    file_path = os.path.join(csv_dir, filename)
    
    with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['process_id', 'entity_code', 'counterparty_entity_code', 'account_code', 
                     'period_code', 'amount', 'currency', 'transaction_type', 'description', 
                     'custom_fields', 'created_at']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in rows:
            row_dict = dict(row)
            row_dict['custom_fields'] = json.dumps(row_dict['custom_fields']) if row_dict['custom_fields'] else ''
            writer.writerow(row_dict)
    
    return {
        "file_path": file_path,
        "row_count": len(rows),
        "file_size": os.path.getsize(file_path)
    }

def export_other_amounts_to_csv(conn, process_id: str, csv_dir: str) -> Dict[str, Any]:
    """Export other amounts (adjustments) to CSV file."""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT process_id, account_code, period_code, amount, currency, 
               description, adjustment_type, custom_fields, created_at
        FROM other_amounts 
        WHERE process_id = %s
        ORDER BY period_code, account_code
    """, [process_id])
    
    rows = cur.fetchall()
    
    if not rows:
        return {"file_path": None, "row_count": 0}
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"other_amounts_{timestamp}.csv"
    file_path = os.path.join(csv_dir, filename)
    
    with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['process_id', 'account_code', 'period_code', 'amount', 'currency', 
                     'description', 'adjustment_type', 'custom_fields', 'created_at']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in rows:
            row_dict = dict(row)
            row_dict['custom_fields'] = json.dumps(row_dict['custom_fields']) if row_dict['custom_fields'] else ''
            writer.writerow(row_dict)
    
    return {
        "file_path": file_path,
        "row_count": len(rows),
        "file_size": os.path.getsize(file_path)
    }

# ============================================================================
# ENTITY-SPECIFIC CONFIGURATION ENDPOINTS
# ============================================================================

@router.post("/processes/{process_id}/entity-node-configs")
async def save_entity_node_configurations(
    process_id: str,
    configs: List[EntityNodeConfig],
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Save entity-specific node configurations."""
    try:
        ensure_tables_via_sqlalchemy(company_name)
        
        with company_connection(company_name) as conn:
            cur = conn.cursor()
            
            # Delete existing configurations for this process
            cur.execute("""
                DELETE FROM entity_node_configurations 
                WHERE process_id = %s
            """, (process_id,))
            
            # Insert new configurations
            for config in configs:
                cur.execute("""
                    INSERT INTO entity_node_configurations 
                    (process_id, entity_code, node_id, enabled, settings, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (process_id, entity_code, node_id) 
                    DO UPDATE SET 
                        enabled = EXCLUDED.enabled,
                        settings = EXCLUDED.settings,
                        updated_at = NOW()
                """, (
                    process_id, 
                    config.entity_code, 
                    config.node_id, 
                    config.enabled, 
                    json.dumps(config.settings)
                ))
            
            conn.commit()
            
            return {
                "message": "Entity node configurations saved successfully",
                "configurations_count": len(configs)
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving entity configurations: {str(e)}")

@router.get("/processes/{process_id}/entity-node-configs")
async def get_entity_node_configurations(
    process_id: str,
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Get entity-specific node configurations."""
    try:
        ensure_tables_via_sqlalchemy(company_name)
        
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("""
                SELECT entity_code, node_id, enabled, settings, created_at, updated_at
                FROM entity_node_configurations 
                WHERE process_id = %s
                ORDER BY entity_code, node_id
            """, (process_id,))
            
            configs = cur.fetchall()
            
            return {
                "configurations": [dict(config) for config in configs]
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching entity configurations: {str(e)}")

# ============================================================================
# PROCESS EXECUTION ENDPOINTS
# ============================================================================

@router.post("/processes/{process_id}/execute-node")
async def execute_process_node(
    process_id: str,
    execution_request: ProcessExecutionRequest,
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Execute a specific process node for selected entities."""
    try:
        ensure_tables_via_sqlalchemy(company_name)
        
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Create execution record
            execution_id = str(uuid.uuid4())
            
            for entity_code in execution_request.entities:
                cur.execute("""
                    INSERT INTO process_executions 
                    (id, process_id, entity_code, node_id, execution_type, status, 
                     start_time, execution_data, created_at)
                    VALUES (%s, %s, %s, %s, 'node', 'running', NOW(), %s, NOW())
                """, (
                    str(uuid.uuid4()),
                    process_id,
                    entity_code,
                    execution_request.node_id,
                    json.dumps({
                        "fiscal_year": execution_request.fiscal_year,
                        "periods": execution_request.periods,
                        "scenario_id": execution_request.scenario_id,
                        "flow_mode": execution_request.flow_mode
                    })
                ))
            
            conn.commit()
            
            # Simulate processing time
            import time
            time.sleep(2)
            
            # Update execution status to completed
            cur.execute("""
                UPDATE process_executions 
                SET status = 'completed', end_time = NOW()
                WHERE process_id = %s AND node_id = %s
            """, (process_id, execution_request.node_id))
            
            conn.commit()
            
            return {
                "message": "Node executed successfully",
                "execution_id": execution_id,
                "entities_processed": len(execution_request.entities)
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing node: {str(e)}")

@router.post("/processes/{process_id}/execute-flow")
async def execute_full_process_flow(
    process_id: str,
    execution_request: ProcessExecutionRequest,
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Execute the complete process flow for selected entities."""
    try:
        ensure_tables_via_sqlalchemy(company_name)
        
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get all nodes for this process
            cur.execute("""
                SELECT id, node_type, sequence 
                FROM financial_process_nodes 
                WHERE process_id = %s AND is_active = true
                ORDER BY sequence
            """, (process_id,))
            
            nodes = cur.fetchall()
            
            execution_id = str(uuid.uuid4())
            
            # Create execution records for full flow
            for entity_code in execution_request.entities:
                cur.execute("""
                    INSERT INTO process_executions 
                    (id, process_id, entity_code, execution_type, status, 
                     start_time, execution_data, created_at)
                    VALUES (%s, %s, %s, 'full_process', 'running', NOW(), %s, NOW())
                """, (
                    str(uuid.uuid4()),
                    process_id,
                    entity_code,
                    json.dumps({
                        "fiscal_year": execution_request.fiscal_year,
                        "periods": execution_request.periods,
                        "scenario_id": execution_request.scenario_id,
                        "flow_mode": execution_request.flow_mode,
                        "nodes_count": len(nodes)
                    })
                ))
            
            conn.commit()
            
            # Simulate processing
            import time
            time.sleep(5)
            
            # Update execution status
            cur.execute("""
                UPDATE process_executions 
                SET status = 'completed', end_time = NOW()
                WHERE process_id = %s AND execution_type = 'full_process'
            """, (process_id,))
            
            conn.commit()
            
            return {
                "message": "Full process flow executed successfully",
                "execution_id": execution_id,
                "entities_processed": len(execution_request.entities),
                "nodes_executed": len(nodes)
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing process flow: {str(e)}")

# ============================================================================
# CSV EXPORT ENDPOINTS
# ============================================================================

@router.post("/processes/{process_id}/export-csv")
async def export_process_data_to_csv(
    process_id: str,
    export_request: CSVExportRequest,
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Export process data to CSV files for consolidation."""
    try:
        ensure_tables_via_sqlalchemy(company_name)
        csv_dir = ensure_csv_directory(company_name)
        
        with company_connection(company_name) as conn:
            cur = conn.cursor()
            
            export_results = []
            
            # Export entity amounts
            if "entity_amounts" in export_request.export_types:
                result = export_entity_amounts_to_csv(conn, process_id, export_request.entity_codes, csv_dir)
                if result["file_path"]:
                    # Record export in database
                    cur.execute("""
                        INSERT INTO csv_exports 
                        (process_id, export_type, file_path, file_size, row_count, 
                         export_date, fiscal_year)
                        VALUES (%s, 'entity_amounts', %s, %s, %s, NOW(), %s)
                    """, (
                        process_id, 
                        result["file_path"], 
                        result["file_size"], 
                        result["row_count"],
                        export_request.fiscal_year
                    ))
                    export_results.append({
                        "type": "entity_amounts",
                        "file_path": result["file_path"],
                        "row_count": result["row_count"]
                    })
            
            # Export IC amounts
            if "ic_amounts" in export_request.export_types:
                result = export_ic_amounts_to_csv(conn, process_id, export_request.entity_codes, csv_dir)
                if result["file_path"]:
                    cur.execute("""
                        INSERT INTO csv_exports 
                        (process_id, export_type, file_path, file_size, row_count, 
                         export_date, fiscal_year)
                        VALUES (%s, 'ic_amounts', %s, %s, %s, NOW(), %s)
                    """, (
                        process_id, 
                        result["file_path"], 
                        result["file_size"], 
                        result["row_count"],
                        export_request.fiscal_year
                    ))
                    export_results.append({
                        "type": "ic_amounts",
                        "file_path": result["file_path"],
                        "row_count": result["row_count"]
                    })
            
            # Export other amounts
            if "other_amounts" in export_request.export_types:
                result = export_other_amounts_to_csv(conn, process_id, csv_dir)
                if result["file_path"]:
                    cur.execute("""
                        INSERT INTO csv_exports 
                        (process_id, export_type, file_path, file_size, row_count, 
                         export_date, fiscal_year)
                        VALUES (%s, 'other_amounts', %s, %s, %s, NOW(), %s)
                    """, (
                        process_id, 
                        result["file_path"], 
                        result["file_size"], 
                        result["row_count"],
                        export_request.fiscal_year
                    ))
                    export_results.append({
                        "type": "other_amounts",
                        "file_path": result["file_path"],
                        "row_count": result["row_count"]
                    })
            
            conn.commit()
            
            return {
                "message": "CSV export completed successfully",
                "exports": export_results,
                "csv_directory": csv_dir
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting CSV: {str(e)}")

@router.get("/processes/{process_id}/csv-exports")
async def get_csv_export_history(
    process_id: str,
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Get CSV export history for a process."""
    try:
        ensure_tables_via_sqlalchemy(company_name)
        
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("""
                SELECT id, entity_code, export_type, file_path, file_size, 
                       row_count, export_date, fiscal_year, period_code
                FROM csv_exports 
                WHERE process_id = %s
                ORDER BY export_date DESC
                LIMIT 50
            """, (process_id,))
            
            exports = cur.fetchall()
            
            return {
                "exports": [dict(export) for export in exports]
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching export history: {str(e)}")

@router.get("/debug/fiscal-years")
async def debug_fiscal_years(company_name: str = Query(...)):
    """Debug endpoint to check fiscal years setup"""
    try:
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Check fiscal years
            cur.execute("SELECT COUNT(*) as count FROM fiscal_years")
            fy_count = cur.fetchone()['count']
            
            # Check periods
            cur.execute("SELECT COUNT(*) as count FROM periods")
            period_count = cur.fetchone()['count']
            
            # Get sample fiscal years
            cur.execute("SELECT id, year_name, start_date, end_date FROM fiscal_years LIMIT 5")
            sample_fy = cur.fetchall()
            
            # Get sample periods
            cur.execute("SELECT id, period_name, start_date, end_date FROM periods LIMIT 5")
            sample_periods = cur.fetchall()
            
            return {
                "fiscal_years_count": fy_count,
                "periods_count": period_count,
                "sample_fiscal_years": [dict(fy) for fy in sample_fy],
                "sample_periods": [dict(p) for p in sample_periods],
                "message": f"Found {fy_count} fiscal years and {period_count} periods"
            }
            
    except Exception as e:
        return {
            "error": str(e),
            "fiscal_years_count": 0,
            "periods_count": 0,
            "message": "Error checking fiscal years - they may not be set up yet"
        }
