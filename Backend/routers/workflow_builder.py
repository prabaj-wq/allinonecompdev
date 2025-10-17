"""
Workflow Builder Router - Process Automation Framework
Handles canvas-based workflow design, node management, simulation, and execution
"""

from fastapi import APIRouter, HTTPException, Query, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Literal
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import sql
import json
from datetime import datetime
from decimal import Decimal
from contextlib import contextmanager
import os
import re
import uuid

from auth.dependencies import get_current_active_user
from database import User

router = APIRouter(prefix="/workflow", tags=["Workflow Builder"])


# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

def get_db_config() -> Dict[str, Any]:
    """Get database connection configuration."""
    host = os.getenv("POSTGRES_HOST", "postgres" if os.getenv("DOCKER_ENV") == "true" else "localhost")
    return {
        "host": host,
        "port": os.getenv("POSTGRES_PORT", "5432"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "epm_password"),
    }


def normalize_company_db_name(company_name: str) -> str:
    """Normalize company name for database naming."""
    if not company_name:
        return "default_company"
    sanitized = re.sub(r"[^a-z0-9_]", "_", company_name.lower().replace(" ", "_"))
    sanitized = sanitized.strip("_")
    return sanitized or "default_company"


@contextmanager
def company_connection(company_name: str):
    """Context manager for company-specific database connection."""
    db_name = normalize_company_db_name(company_name)
    try:
        conn = psycopg2.connect(database=db_name, **get_db_config())
    except psycopg2.OperationalError as exc:
        raise HTTPException(status_code=404, detail=f"Database for company '{company_name}' not available: {exc}")
    try:
        yield conn
    finally:
        conn.close()


# ============================================================================
# SCHEMA INITIALIZATION
# ============================================================================

def ensure_workflow_schema(conn: psycopg2.extensions.connection) -> None:
    """Create all workflow tables if they don't exist."""
    cur = conn.cursor()
    
    # Workflows table - main process definition
    cur.execute("""
        CREATE TABLE IF NOT EXISTS workflows (
            id SERIAL PRIMARY KEY,
            workflow_id VARCHAR(100) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            process_type VARCHAR(50) NOT NULL DEFAULT 'general',
            status VARCHAR(50) NOT NULL DEFAULT 'draft',
            fiscal_year VARCHAR(10),
            base_scenario_id INTEGER,
            canvas_config JSONB DEFAULT '{}',
            settings JSONB DEFAULT '{}',
            version INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT TRUE,
            created_by VARCHAR(255),
            created_by_id INTEGER,
            updated_by VARCHAR(255),
            updated_by_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Workflow nodes - individual workflow steps
    cur.execute("""
        CREATE TABLE IF NOT EXISTS workflow_nodes (
            id SERIAL PRIMARY KEY,
            node_id VARCHAR(100) UNIQUE NOT NULL,
            workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
            node_type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            position_x NUMERIC(10, 2),
            position_y NUMERIC(10, 2),
            node_config JSONB DEFAULT '{}',
            input_schema JSONB DEFAULT '{}',
            output_schema JSONB DEFAULT '{}',
            custom_fields JSONB DEFAULT '[]',
            is_enabled BOOLEAN DEFAULT TRUE,
            execution_order INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Node connections - how nodes link together
    cur.execute("""
        CREATE TABLE IF NOT EXISTS node_connections (
            id SERIAL PRIMARY KEY,
            workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
            source_node_id INTEGER NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
            target_node_id INTEGER NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
            connection_type VARCHAR(50) DEFAULT 'sequential',
            mapping JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Workflow periods - periods for this workflow
    cur.execute("""
        CREATE TABLE IF NOT EXISTS workflow_periods (
            id SERIAL PRIMARY KEY,
            workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
            period_name VARCHAR(50) NOT NULL,
            period_start_date DATE,
            period_end_date DATE,
            fiscal_year VARCHAR(10),
            is_open BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Workflow staging tables - temporary data for simulation
    cur.execute("""
        CREATE TABLE IF NOT EXISTS workflow_staging (
            id SERIAL PRIMARY KEY,
            workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
            node_id INTEGER NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
            staging_run_id VARCHAR(100) NOT NULL,
            input_data JSONB,
            output_data JSONB,
            execution_status VARCHAR(50) DEFAULT 'pending',
            execution_log TEXT,
            executed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Workflow audit trail - track all changes
    cur.execute("""
        CREATE TABLE IF NOT EXISTS workflow_audit_trail (
            id SERIAL PRIMARY KEY,
            workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
            action VARCHAR(100) NOT NULL,
            change_details JSONB,
            performed_by VARCHAR(255),
            performed_by_id INTEGER,
            audit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Workflow rules - consolidation and processing rules
    cur.execute("""
        CREATE TABLE IF NOT EXISTS workflow_rules (
            id SERIAL PRIMARY KEY,
            workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
            rule_name VARCHAR(255) NOT NULL,
            rule_type VARCHAR(50) NOT NULL,
            rule_config JSONB DEFAULT '{}',
            priority INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Add indices
    cur.execute("CREATE INDEX IF NOT EXISTS idx_workflows_type ON workflows(process_type)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow ON workflow_nodes(workflow_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_node_connections_workflow ON node_connections(workflow_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_workflow_staging_run ON workflow_staging(staging_run_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_workflow_audit_workflow ON workflow_audit_trail(workflow_id)")
    
    conn.commit()
    cur.close()


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class CustomFieldModel(BaseModel):
    field_name: str
    field_label: str
    field_type: str
    options: List[str] = []
    default_value: Optional[Any] = None
    is_required: bool = False
    validation_rules: Dict[str, Any] = {}


class NodeConfigModel(BaseModel):
    title: str
    description: Optional[str] = None
    node_type: str
    custom_fields: List[CustomFieldModel] = []
    input_schema: Dict[str, Any] = {}
    output_schema: Dict[str, Any] = {}
    node_config: Dict[str, Any] = {}


class CreateWorkflowRequest(BaseModel):
    name: str
    description: Optional[str] = None
    process_type: str = "general"
    fiscal_year: Optional[str] = None
    settings: Dict[str, Any] = {}


class UpdateWorkflowSettingsRequest(BaseModel):
    settings: Dict[str, Any]


class AddNodeRequest(BaseModel):
    node_type: str
    title: str
    description: Optional[str] = None
    position_x: float = 0
    position_y: float = 0
    node_config: Dict[str, Any] = {}
    custom_fields: List[CustomFieldModel] = []


class ConnectNodesRequest(BaseModel):
    source_node_id: int
    target_node_id: int
    connection_type: str = "sequential"
    mapping: Dict[str, Any] = {}


class CreatePeriodRequest(BaseModel):
    period_name: str
    period_start_date: Optional[str] = None
    period_end_date: Optional[str] = None
    fiscal_year: Optional[str] = None


class AddRuleRequest(BaseModel):
    rule_name: str
    rule_type: str
    rule_config: Dict[str, Any] = {}
    priority: int = 0


# ============================================================================
# WORKFLOW CRUD OPERATIONS
# ============================================================================

@router.post("/workflows/create")
async def create_workflow(
    request: CreateWorkflowRequest,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new workflow."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor()
        
        workflow_id = f"wf_{uuid.uuid4().hex[:12]}"
        
        cur.execute("""
            INSERT INTO workflows 
            (workflow_id, name, description, process_type, fiscal_year, status, 
             settings, created_by, created_by_id, created_at)
            VALUES (%s, %s, %s, %s, %s, 'draft', %s, %s, %s, NOW())
            RETURNING id, workflow_id, name, description, process_type, status, created_at
        """, (workflow_id, request.name, request.description, request.process_type, 
              request.fiscal_year, json.dumps(request.settings), current_user.username, current_user.id))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        
        return {
            "status": "success",
            "workflow": dict(result) if result else {}
        }


@router.get("/workflows/list")
async def list_workflows(
    company_name: str = Query(...),
    process_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
):
    """List workflows with optional filtering."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT * FROM workflows WHERE is_active = TRUE"
        params = []
        
        if process_type:
            query += " AND process_type = %s"
            params.append(process_type)
        
        if status:
            query += " AND status = %s"
            params.append(status)
        
        query += " ORDER BY created_at DESC"
        cur.execute(query, params)
        workflows = cur.fetchall()
        cur.close()
        
        return {
            "workflows": [dict(w) for w in workflows],
            "total": len(workflows)
        }


@router.get("/workflows/{workflow_id}/details")
async def get_workflow_details(
    workflow_id: str,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Get workflow details including all nodes and connections."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get workflow
        cur.execute("SELECT * FROM workflows WHERE workflow_id = %s", (workflow_id,))
        workflow = cur.fetchone()
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Get nodes
        cur.execute("""
            SELECT * FROM workflow_nodes 
            WHERE workflow_id = %s 
            ORDER BY execution_order, created_at
        """, (workflow['id'],))
        nodes = cur.fetchall()
        
        # Get connections
        cur.execute("""
            SELECT * FROM node_connections 
            WHERE workflow_id = %s AND is_active = TRUE
        """, (workflow['id'],))
        connections = cur.fetchall()
        
        # Get periods
        cur.execute("""
            SELECT * FROM workflow_periods 
            WHERE workflow_id = %s
            ORDER BY period_start_date
        """, (workflow['id'],))
        periods = cur.fetchall()
        
        # Get rules
        cur.execute("""
            SELECT * FROM workflow_rules 
            WHERE workflow_id = %s AND is_active = TRUE
            ORDER BY priority DESC
        """, (workflow['id'],))
        rules = cur.fetchall()
        
        cur.close()
        
        return {
            "workflow": dict(workflow) if workflow else {},
            "nodes": [dict(n) for n in nodes],
            "connections": [dict(c) for c in connections],
            "periods": [dict(p) for p in periods],
            "rules": [dict(r) for r in rules]
        }


@router.put("/workflows/{workflow_id}/update")
async def update_workflow(
    workflow_id: str,
    request: UpdateWorkflowSettingsRequest,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Update workflow settings."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE workflows 
            SET settings = %s, updated_by = %s, updated_by_id = %s, updated_at = NOW()
            WHERE workflow_id = %s
        """, (json.dumps(request.settings), current_user.username, current_user.id, workflow_id))
        
        # Audit log
        cur.execute("""
            INSERT INTO workflow_audit_trail (workflow_id, action, change_details, performed_by, performed_by_id)
            SELECT id, 'UPDATE_SETTINGS', %s, %s, %s FROM workflows WHERE workflow_id = %s
        """, (json.dumps(request.settings), current_user.username, current_user.id, workflow_id))
        
        conn.commit()
        cur.close()
        
        return {"status": "success", "message": "Workflow settings updated"}


# ============================================================================
# NODE MANAGEMENT
# ============================================================================

@router.post("/workflows/{workflow_id}/nodes/add")
async def add_node(
    workflow_id: str,
    request: AddNodeRequest,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Add a node to the workflow canvas."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get workflow
        cur.execute("SELECT id FROM workflows WHERE workflow_id = %s", (workflow_id,))
        workflow = cur.fetchone()
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        node_id = f"node_{uuid.uuid4().hex[:12]}"
        
        # Get next execution order
        cur.execute(
            "SELECT COALESCE(MAX(execution_order), 0) + 1 as next_order FROM workflow_nodes WHERE workflow_id = %s",
            (workflow['id'],)
        )
        next_order = cur.fetchone()['next_order']
        
        cur.execute("""
            INSERT INTO workflow_nodes 
            (node_id, workflow_id, node_type, title, description, position_x, position_y,
             node_config, custom_fields, execution_order, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id, node_id, node_type, title, execution_order
        """, (node_id, workflow['id'], request.node_type, request.title, request.description,
              request.position_x, request.position_y, json.dumps(request.node_config),
              json.dumps([f.dict() for f in request.custom_fields]), next_order))
        
        node = cur.fetchone()
        conn.commit()
        cur.close()
        
        return {
            "status": "success",
            "node": dict(node) if node else {}
        }


@router.post("/workflows/{workflow_id}/nodes/connect")
async def connect_nodes(
    workflow_id: str,
    request: ConnectNodesRequest,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Connect two nodes in the workflow."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor()
        
        # Verify workflow exists
        cur.execute("SELECT id FROM workflows WHERE workflow_id = %s", (workflow_id,))
        workflow = cur.fetchone()
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Verify nodes exist and belong to workflow
        cur.execute(
            "SELECT id FROM workflow_nodes WHERE id = %s AND workflow_id = %s",
            (request.source_node_id, workflow[0])
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Source node not found")
        
        cur.execute(
            "SELECT id FROM workflow_nodes WHERE id = %s AND workflow_id = %s",
            (request.target_node_id, workflow[0])
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Target node not found")
        
        # Create connection
        cur.execute("""
            INSERT INTO node_connections 
            (workflow_id, source_node_id, target_node_id, connection_type, mapping, is_active)
            VALUES (%s, %s, %s, %s, %s, TRUE)
        """, (workflow[0], request.source_node_id, request.target_node_id,
              request.connection_type, json.dumps(request.mapping)))
        
        conn.commit()
        cur.close()
        
        return {"status": "success", "message": "Nodes connected"}


@router.delete("/workflows/{workflow_id}/nodes/{node_id}/delete")
async def delete_node(
    workflow_id: str,
    node_id: int,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a node from the workflow."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor()
        
        # Verify node belongs to workflow
        cur.execute(
            "SELECT id FROM workflow_nodes WHERE id = %s AND workflow_id = (SELECT id FROM workflows WHERE workflow_id = %s)",
            (node_id, workflow_id)
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Node not found in workflow")
        
        # Mark connections as inactive
        cur.execute(
            "UPDATE node_connections SET is_active = FALSE WHERE source_node_id = %s OR target_node_id = %s",
            (node_id, node_id)
        )
        
        # Delete node
        cur.execute("DELETE FROM workflow_nodes WHERE id = %s", (node_id,))
        
        conn.commit()
        cur.close()
        
        return {"status": "success", "message": "Node deleted"}


# ============================================================================
# PERIODS MANAGEMENT
# ============================================================================

@router.post("/workflows/{workflow_id}/periods/add")
async def add_period(
    workflow_id: str,
    request: CreatePeriodRequest,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Add a period to the workflow."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM workflows WHERE workflow_id = %s", (workflow_id,))
        workflow = cur.fetchone()
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        cur.execute("""
            INSERT INTO workflow_periods 
            (workflow_id, period_name, period_start_date, period_end_date, fiscal_year, is_open)
            VALUES (%s, %s, %s, %s, %s, TRUE)
        """, (workflow[0], request.period_name, request.period_start_date,
              request.period_end_date, request.fiscal_year))
        
        conn.commit()
        cur.close()
        
        return {"status": "success", "message": "Period added"}


# ============================================================================
# RULES MANAGEMENT
# ============================================================================

@router.post("/workflows/{workflow_id}/rules/add")
async def add_rule(
    workflow_id: str,
    request: AddRuleRequest,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Add a rule to the workflow."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM workflows WHERE workflow_id = %s", (workflow_id,))
        workflow = cur.fetchone()
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        cur.execute("""
            INSERT INTO workflow_rules 
            (workflow_id, rule_name, rule_type, rule_config, priority, is_active)
            VALUES (%s, %s, %s, %s, %s, TRUE)
        """, (workflow[0], request.rule_name, request.rule_type,
              json.dumps(request.rule_config), request.priority))
        
        conn.commit()
        cur.close()
        
        return {"status": "success", "message": "Rule added"}


# ============================================================================
# SIMULATION & EXECUTION
# ============================================================================

@router.post("/workflows/{workflow_id}/simulate")
async def simulate_workflow(
    workflow_id: str,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Run workflow in simulation mode (staging tables only)."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        run_id = f"sim_{uuid.uuid4().hex[:12]}"
        
        cur.execute("SELECT id FROM workflows WHERE workflow_id = %s", (workflow_id,))
        workflow = cur.fetchone()
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Get all enabled nodes in execution order
        cur.execute("""
            SELECT id, node_id, node_type, node_config FROM workflow_nodes
            WHERE workflow_id = %s AND is_enabled = TRUE
            ORDER BY execution_order
        """, (workflow['id'],))
        nodes = cur.fetchall()
        
        # Create staging records for each node
        for node in nodes:
            cur.execute("""
                INSERT INTO workflow_staging 
                (workflow_id, node_id, staging_run_id, execution_status, created_at)
                VALUES (%s, %s, %s, 'pending', NOW())
            """, (workflow['id'], node['id'], run_id))
        
        conn.commit()
        cur.close()
        
        return {
            "status": "success",
            "simulation_run_id": run_id,
            "message": "Simulation started"
        }


@router.post("/workflows/{workflow_id}/finalize")
async def finalize_workflow(
    workflow_id: str,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Finalize workflow - mark as complete and ready for deployment."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE workflows
            SET status = 'finalized', updated_by = %s, updated_by_id = %s, updated_at = NOW()
            WHERE workflow_id = %s
        """, (current_user.username, current_user.id, workflow_id))
        
        # Audit log
        cur.execute("""
            INSERT INTO workflow_audit_trail (workflow_id, action, performed_by, performed_by_id)
            SELECT id, 'FINALIZED', %s, %s FROM workflows WHERE workflow_id = %s
        """, (current_user.username, current_user.id, workflow_id))
        
        conn.commit()
        cur.close()
        
        return {"status": "success", "message": "Workflow finalized"}


# ============================================================================
# SMART NODE SUGGESTIONS
# ============================================================================

NODE_TEMPLATES = {
    'journal_entries': {
        'title': 'Journal Entries',
        'description': 'Create and manage journal entries',
        'inputs': ['account_code', 'amount', 'entity_code'],
        'outputs': ['entry_id', 'balance'],
    },
    'forms': {
        'title': 'Forms & Data Collection',
        'description': 'Collect custom data via forms',
        'inputs': ['form_schema'],
        'outputs': ['form_data'],
    },
    'entity_structure': {
        'title': 'Entity Structure',
        'description': 'Define and manage entity hierarchies',
        'inputs': ['entity_code', 'parent_entity'],
        'outputs': ['hierarchy_id'],
    },
    'tb_verification': {
        'title': 'Trial Balance Verification',
        'description': 'Verify and reconcile trial balances',
        'inputs': ['debit_total', 'credit_total'],
        'outputs': ['is_balanced', 'variance'],
    },
    'intercompany_elimination': {
        'title': 'Intercompany Eliminations',
        'description': 'Eliminate intercompany transactions',
        'inputs': ['amount', 'counterparty_entity'],
        'outputs': ['eliminated_amount'],
    },
    'fx_translation': {
        'title': 'FX/Foreign Currency Translation',
        'description': 'Handle foreign currency conversions',
        'inputs': ['amount', 'from_currency', 'to_currency', 'fx_rate'],
        'outputs': ['translated_amount', 'fx_variance'],
    },
    'fair_value_adjustment': {
        'title': 'Fair Value Adjustments',
        'description': 'Record and depreciate fair value differences',
        'inputs': ['fair_value', 'book_value', 'useful_life'],
        'outputs': ['adjustment', 'accumulated_amortization'],
    },
    'deferred_tax': {
        'title': 'Deferred Taxes',
        'description': 'Calculate deferred tax impacts',
        'inputs': ['adjustment_amount', 'tax_rate'],
        'outputs': ['deferred_tax_asset', 'deferred_tax_liability'],
    },
    'nci_calculation': {
        'title': 'Non-Controlling Interest (NCI)',
        'description': 'Calculate non-controlling interest allocations',
        'inputs': ['subsidiary_profit', 'nci_percentage'],
        'outputs': ['nci_amount'],
    },
    'retained_earnings': {
        'title': 'Retained Earnings Rollforward',
        'description': 'Roll forward retained earnings balances',
        'inputs': ['opening_balance', 'net_profit', 'dividends'],
        'outputs': ['closing_balance'],
    },
}


@router.get("/node-templates/suggestions")
async def get_node_suggestions(
    workflow_id: str = Query(...),
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Get smart node suggestions based on existing nodes."""
    with company_connection(company_name) as conn:
        ensure_workflow_schema(conn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get existing nodes
        cur.execute("""
            SELECT node_type FROM workflow_nodes
            WHERE workflow_id = (SELECT id FROM workflows WHERE workflow_id = %s)
        """, (workflow_id,))
        existing = set(row['node_type'] for row in cur.fetchall())
        cur.close()
        
        # Get all templates, filter out existing ones
        suggestions = [
            {
                'type': k,
                'title': v['title'],
                'description': v['description'],
                'inputs': v['inputs'],
                'outputs': v['outputs'],
                'recommended': k not in existing
            }
            for k, v in NODE_TEMPLATES.items()
        ]
        
        # Sort: recommended first, then by type
        suggestions.sort(key=lambda x: (not x['recommended'], x['type']))
        
        return {"node_templates": suggestions}


@router.get("/node-templates/all")
async def get_all_templates():
    """Get all available node templates."""
    templates = [
        {
            'type': k,
            'title': v['title'],
            'description': v['description'],
            'inputs': v['inputs'],
            'outputs': v['outputs'],
        }
        for k, v in NODE_TEMPLATES.items()
    ]
    return {"templates": templates}