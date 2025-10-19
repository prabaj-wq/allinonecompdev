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

@router.get("/processes")
async def get_processes(
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Get all financial processes for a company"""
    try:
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
            
            return {"processes": processes}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching processes: {str(e)}")

@router.post("/processes")
async def create_process(
    company_name: str = Query(...),
    process_data: ProcessCreate = Body(...),
    current_user = Depends(get_current_active_user)
):
    """Create a new financial process"""
    try:
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
            node_id = str(uuid.uuid4())
            cur.execute(
                """
                INSERT INTO financial_process_nodes 
                (id, process_id, node_type, name, description, x, y, sequence, canvas_mode, configuration, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW())
                RETURNING id, node_type, name, description, x, y, canvas_mode
                """,
                (
                    node_id,
                    process_id,
                    node_data.get("node_type") or node_data.get("type"),
                    node_data.get("name"),
                    node_data.get("description", ""),
                    node_data.get("x_position") or node_data.get("x", 100),
                    node_data.get("y_position") or node_data.get("y", 100),
                    node_data.get("sequence", 1),
                    node_data.get("canvas_mode", "entity"),
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
            
            if not config_row:
                # Return empty configuration if none exists yet
                return {
                    "nodes": [],
                    "entityWorkflowNodes": [],
                    "consolidationWorkflowNodes": [],
                    "flowMode": "entity",
                    "selectedEntities": [],
                    "fiscalYear": None,
                    "periods": [],
                    "scenario": None,
                    "fiscalSettingsLocked": False
                }
            
            # Return the stored configuration
            config = config_row['configuration']
            config['updated_at'] = config_row['updated_at'].isoformat() if config_row['updated_at'] else None
            
            return config
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching configuration: {str(e)}")

@router.put("/processes/{process_id}/configuration")
async def save_process_configuration(
    process_id: str,
    configuration: dict = Body(...),
    company_name: str = Query(...),
    current_user = Depends(get_current_active_user)
):
    """Save process configuration including workflow nodes, settings, and fiscal parameters"""
    try:
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
            conn.commit()
            
            return {
                "message": "Configuration saved successfully",
                "configuration_id": str(result['id']),
                "updated_at": result['updated_at'].isoformat() if result['updated_at'] else None
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving configuration: {str(e)}")
