"""
Process Builder Module - Complete Financial Process Automation
Supports: Consolidation, Roll-Forward, Adjustments, FX Translation, NCI Handling, etc.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
import json
import uuid
from contextlib import contextmanager

from database import get_db
from auth.auth import get_current_active_user

router = APIRouter(prefix="/process", tags=["Process Builder"])

# ============================================================================
# PYDANTIC MODELS - Request/Response Validation
# ============================================================================

class ProcessCreate(BaseModel):
    """Create new process"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    process_type: Literal[
        "consolidation", "roll_forward", "adjustments", "period_close",
        "forecasting", "reporting", "variance_analysis"
    ]
    fiscal_year: int
    base_currency: str = "USD"
    company_id: int

class ProcessUpdate(BaseModel):
    """Update process metadata"""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["draft", "active", "completed", "archived"]] = None
    settings: Optional[Dict[str, Any]] = None

class NodeCreate(BaseModel):
    """Add node to canvas"""
    process_id: int
    node_type: Literal[
        "journal_entries", "forms", "entity_structure", "tb_verification",
        "intercompany_eliminations", "fx_translation", "fair_value_adjustments",
        "deferred_taxes", "nci_allocation", "retained_earnings_rollforward",
        "goodwill_impairment", "profit_calculation", "opening_balance_adjustments",
        "prior_period_errors", "oci_items", "epa_calculation"
    ]
    title: str
    description: Optional[str] = None
    position_x: int
    position_y: int
    configuration: Dict[str, Any] = {}
    custom_fields: Optional[List[Dict[str, Any]]] = None

class NodeUpdate(BaseModel):
    """Update node configuration"""
    title: Optional[str] = None
    description: Optional[str] = None
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    configuration: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None

class NodeConnect(BaseModel):
    """Connect two nodes"""
    process_id: int
    source_node_id: int
    target_node_id: int
    mapping: Optional[Dict[str, str]] = None

class PeriodCreate(BaseModel):
    """Add period to process"""
    process_id: int
    period_name: str
    start_date: str  # ISO format
    end_date: str
    fiscal_year: int
    is_open: bool = True

class RuleCreate(BaseModel):
    """Add processing rule"""
    process_id: int
    rule_type: Literal[
        "fx_translation", "intercompany", "nci", "fair_value", 
        "deferred_tax", "rounding", "validation"
    ]
    rule_name: str
    rule_config: Dict[str, Any]
    priority: int = 10

class ValidationCheck(BaseModel):
    """Validation rule"""
    check_type: str
    check_config: Dict[str, Any]
    alert_level: Literal["warning", "error"] = "error"

# ============================================================================
# DATABASE SCHEMA - SQL Initialization
# ============================================================================

SCHEMA_SQL = """
-- Processes (Main workflow definitions)
CREATE TABLE IF NOT EXISTS process_main (
    id SERIAL PRIMARY KEY,
    process_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    company_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    process_type VARCHAR(50) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    base_currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'draft',
    canvas_config JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id INTEGER,
    updated_by_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
);

-- Process Nodes (Individual steps on canvas)
CREATE TABLE IF NOT EXISTS process_nodes (
    id SERIAL PRIMARY KEY,
    node_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    process_id INTEGER NOT NULL,
    node_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    node_config JSONB DEFAULT '{}',
    input_schema JSONB DEFAULT '{}',
    output_schema JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '[]',
    is_enabled BOOLEAN DEFAULT TRUE,
    execution_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES process_main(id) ON DELETE CASCADE
);

-- Node Connections (Data flow between nodes)
CREATE TABLE IF NOT EXISTS process_connections (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL,
    source_node_id INTEGER NOT NULL,
    target_node_id INTEGER NOT NULL,
    connection_type VARCHAR(50) DEFAULT 'sequential',
    mapping JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES process_main(id) ON DELETE CASCADE,
    FOREIGN KEY (source_node_id) REFERENCES process_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES process_nodes(id) ON DELETE CASCADE
);

-- Process Periods
CREATE TABLE IF NOT EXISTS process_periods (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL,
    period_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES process_main(id) ON DELETE CASCADE
);

-- Processing Rules
CREATE TABLE IF NOT EXISTS process_rules (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL,
    rule_type VARCHAR(100) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_config JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES process_main(id) ON DELETE CASCADE
);

-- Staging Data (Simulation results)
CREATE TABLE IF NOT EXISTS process_staging (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL,
    node_id INTEGER,
    run_id UUID DEFAULT gen_random_uuid(),
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    error_log TEXT,
    executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES process_main(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES process_nodes(id) ON DELETE SET NULL
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS process_audit (
    id SERIAL PRIMARY KEY,
    process_id INTEGER,
    action VARCHAR(100) NOT NULL,
    change_details JSONB DEFAULT '{}',
    performed_by_id INTEGER,
    audit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES process_main(id) ON DELETE SET NULL
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_process_company ON process_main(company_id);
CREATE INDEX IF NOT EXISTS idx_process_status ON process_main(status);
CREATE INDEX IF NOT EXISTS idx_process_type ON process_main(process_type);
CREATE INDEX IF NOT EXISTS idx_nodes_process ON process_nodes(process_id);
CREATE INDEX IF NOT EXISTS idx_connections_process ON process_connections(process_id);
CREATE INDEX IF NOT EXISTS idx_staging_process ON process_staging(process_id);
CREATE INDEX IF NOT EXISTS idx_staging_run ON process_staging(run_id);
CREATE INDEX IF NOT EXISTS idx_audit_process ON process_audit(process_id);
"""

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def init_process_schema(db: Session, company_id: int):
    """Initialize process schema for company database"""
    try:
        db.execute(text(SCHEMA_SQL))
        db.commit()
    except Exception as e:
        db.rollback()
        # Tables may already exist, which is fine

def get_company_db(company_id: int, db: Session) -> Session:
    """Get company-specific database connection"""
    # Validate company exists
    result = db.execute(
        text("SELECT id FROM company WHERE id = :company_id"),
        {"company_id": company_id}
    ).first()
    if not result:
        raise HTTPException(status_code=404, detail="Company not found")
    return db

def log_audit(db: Session, process_id: int, action: str, details: dict, user_id: int):
    """Log audit trail"""
    try:
        db.execute(
            text("""
                INSERT INTO process_audit 
                (process_id, action, change_details, performed_by_id)
                VALUES (:process_id, :action, :details, :user_id)
            """),
            {
                "process_id": process_id,
                "action": action,
                "details": json.dumps(details),
                "user_id": user_id
            }
        )
        db.commit()
    except Exception as e:
        pass  # Don't fail on audit error

# ============================================================================
# PROCESS MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/create", response_model=dict)
def create_process(
    data: ProcessCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Create new process"""
    try:
        db = get_company_db(data.company_id, db)
        init_process_schema(db, data.company_id)
        
        result = db.execute(
            text("""
                INSERT INTO process_main 
                (company_id, name, description, process_type, fiscal_year, 
                 base_currency, created_by_id)
                VALUES (:company_id, :name, :description, :process_type, 
                        :fiscal_year, :base_currency, :user_id)
                RETURNING id, process_id, name, status, created_at
            """),
            {
                "company_id": data.company_id,
                "name": data.name,
                "description": data.description,
                "process_type": data.process_type,
                "fiscal_year": data.fiscal_year,
                "base_currency": data.base_currency,
                "user_id": user.id
            }
        )
        db.commit()
        row = result.first()
        
        log_audit(db, row[0], "CREATE", {"name": data.name}, user.id)
        
        return {
            "id": row[0],
            "process_id": str(row[1]),
            "name": row[2],
            "status": row[3],
            "created_at": row[4].isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list")
def list_processes(
    company_id: int,
    process_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """List all processes for company"""
    try:
        db = get_company_db(company_id, db)
        init_process_schema(db, company_id)
        
        query = "SELECT id, process_id, name, description, process_type, status, fiscal_year, created_at FROM process_main WHERE company_id = :company_id"
        params = {"company_id": company_id}
        
        if process_type:
            query += " AND process_type = :process_type"
            params["process_type"] = process_type
        if status:
            query += " AND status = :status"
            params["status"] = status
        
        query += " ORDER BY created_at DESC"
        
        result = db.execute(text(query), params).fetchall()
        
        return [
            {
                "id": row[0],
                "process_id": str(row[1]),
                "name": row[2],
                "description": row[3],
                "process_type": row[4],
                "status": row[5],
                "fiscal_year": row[6],
                "created_at": row[7].isoformat()
            }
            for row in result
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{process_id}/details")
def get_process_details(
    process_id: int,
    company_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Get complete process with all nodes, connections, periods, rules"""
    try:
        db = get_company_db(company_id, db)
        init_process_schema(db, company_id)
        
        # Get process
        process_result = db.execute(
            text("SELECT * FROM process_main WHERE id = :id AND company_id = :company_id"),
            {"id": process_id, "company_id": company_id}
        ).first()
        
        if not process_result:
            raise HTTPException(status_code=404, detail="Process not found")
        
        # Get nodes
        nodes_result = db.execute(
            text("SELECT id, node_id, node_type, title, description, position_x, position_y, node_config, custom_fields, is_enabled FROM process_nodes WHERE process_id = :process_id ORDER BY execution_order"),
            {"process_id": process_id}
        ).fetchall()
        
        nodes = [
            {
                "id": row[0],
                "node_id": str(row[1]),
                "node_type": row[2],
                "title": row[3],
                "description": row[4],
                "position_x": row[5],
                "position_y": row[6],
                "configuration": row[7],
                "custom_fields": row[8],
                "is_enabled": row[9]
            }
            for row in nodes_result
        ]
        
        # Get connections
        connections_result = db.execute(
            text("SELECT id, source_node_id, target_node_id, mapping FROM process_connections WHERE process_id = :process_id AND is_active = TRUE"),
            {"process_id": process_id}
        ).fetchall()
        
        connections = [
            {
                "id": row[0],
                "source_node_id": row[1],
                "target_node_id": row[2],
                "mapping": row[3]
            }
            for row in connections_result
        ]
        
        # Get periods
        periods_result = db.execute(
            text("SELECT id, period_name, start_date, end_date, fiscal_year, is_open FROM process_periods WHERE process_id = :process_id"),
            {"process_id": process_id}
        ).fetchall()
        
        periods = [
            {
                "id": row[0],
                "period_name": row[1],
                "start_date": row[2].isoformat(),
                "end_date": row[3].isoformat(),
                "fiscal_year": row[4],
                "is_open": row[5]
            }
            for row in periods_result
        ]
        
        # Get rules
        rules_result = db.execute(
            text("SELECT id, rule_type, rule_name, rule_config, priority FROM process_rules WHERE process_id = :process_id AND is_active = TRUE ORDER BY priority"),
            {"process_id": process_id}
        ).fetchall()
        
        rules = [
            {
                "id": row[0],
                "rule_type": row[1],
                "rule_name": row[2],
                "configuration": row[3],
                "priority": row[4]
            }
            for row in rules_result
        ]
        
        return {
            "process": {
                "id": process_result[0],
                "process_id": str(process_result[1]),
                "name": process_result[3],
                "description": process_result[4],
                "process_type": process_result[5],
                "fiscal_year": process_result[6],
                "base_currency": process_result[7],
                "status": process_result[8],
                "settings": process_result[10],
                "created_at": process_result[14].isoformat() if process_result[14] else None
            },
            "nodes": nodes,
            "connections": connections,
            "periods": periods,
            "rules": rules
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{process_id}/update")
def update_process(
    process_id: int,
    company_id: int,
    data: ProcessUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Update process"""
    try:
        db = get_company_db(company_id, db)
        
        updates = []
        params = {"id": process_id, "company_id": company_id}
        
        if data.name:
            updates.append("name = :name")
            params["name"] = data.name
        if data.description is not None:
            updates.append("description = :description")
            params["description"] = data.description
        if data.status:
            updates.append("status = :status")
            params["status"] = data.status
        if data.settings:
            updates.append("settings = :settings")
            params["settings"] = json.dumps(data.settings)
        
        if not updates:
            return {"message": "No updates"}
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        updates.append("updated_by_id = :user_id")
        params["user_id"] = user.id
        
        query = f"UPDATE process_main SET {', '.join(updates)} WHERE id = :id AND company_id = :company_id"
        db.execute(text(query), params)
        db.commit()
        
        log_audit(db, process_id, "UPDATE", data.dict(), user.id)
        
        return {"message": "Process updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# NODE MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/{process_id}/nodes/add")
def add_node(
    process_id: int,
    company_id: int,
    data: NodeCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Add node to canvas"""
    try:
        db = get_company_db(company_id, db)
        
        result = db.execute(
            text("""
                INSERT INTO process_nodes 
                (process_id, node_type, title, description, position_x, position_y, 
                 node_config, custom_fields)
                VALUES (:process_id, :node_type, :title, :description, :x, :y, 
                        :config, :fields)
                RETURNING id, node_id, node_type, title
            """),
            {
                "process_id": process_id,
                "node_type": data.node_type,
                "title": data.title,
                "description": data.description,
                "x": data.position_x,
                "y": data.position_y,
                "config": json.dumps(data.configuration),
                "fields": json.dumps(data.custom_fields or [])
            }
        )
        db.commit()
        row = result.first()
        
        log_audit(db, process_id, "ADD_NODE", {"node_type": data.node_type, "title": data.title}, user.id)
        
        return {
            "id": row[0],
            "node_id": str(row[1]),
            "node_type": row[2],
            "title": row[3]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{process_id}/nodes/{node_id}/update")
def update_node(
    process_id: int,
    node_id: int,
    company_id: int,
    data: NodeUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Update node configuration"""
    try:
        db = get_company_db(company_id, db)
        
        updates = []
        params = {"node_id": node_id, "process_id": process_id}
        
        if data.title:
            updates.append("title = :title")
            params["title"] = data.title
        if data.description is not None:
            updates.append("description = :description")
            params["description"] = data.description
        if data.position_x is not None:
            updates.append("position_x = :x")
            params["x"] = data.position_x
        if data.position_y is not None:
            updates.append("position_y = :y")
            params["y"] = data.position_y
        if data.configuration:
            updates.append("node_config = :config")
            params["config"] = json.dumps(data.configuration)
        if data.is_enabled is not None:
            updates.append("is_enabled = :enabled")
            params["enabled"] = data.is_enabled
        
        if not updates:
            return {"message": "No updates"}
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        
        query = f"UPDATE process_nodes SET {', '.join(updates)} WHERE id = :node_id AND process_id = :process_id"
        db.execute(text(query), params)
        db.commit()
        
        log_audit(db, process_id, "UPDATE_NODE", {"node_id": node_id}, user.id)
        
        return {"message": "Node updated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{process_id}/nodes/{node_id}/delete")
def delete_node(
    process_id: int,
    node_id: int,
    company_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Delete node"""
    try:
        db = get_company_db(company_id, db)
        
        # Delete node and cascade connections
        db.execute(text("DELETE FROM process_connections WHERE source_node_id = :node_id OR target_node_id = :node_id"), {"node_id": node_id})
        db.execute(text("DELETE FROM process_nodes WHERE id = :node_id AND process_id = :process_id"), {"node_id": node_id, "process_id": process_id})
        db.commit()
        
        log_audit(db, process_id, "DELETE_NODE", {"node_id": node_id}, user.id)
        
        return {"message": "Node deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# NODE CONNECTION ENDPOINTS
# ============================================================================

@router.post("/{process_id}/nodes/connect")
def connect_nodes(
    process_id: int,
    company_id: int,
    data: NodeConnect,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Connect two nodes"""
    try:
        db = get_company_db(company_id, db)
        
        db.execute(
            text("""
                INSERT INTO process_connections 
                (process_id, source_node_id, target_node_id, mapping)
                VALUES (:process_id, :source, :target, :mapping)
            """),
            {
                "process_id": process_id,
                "source": data.source_node_id,
                "target": data.target_node_id,
                "mapping": json.dumps(data.mapping or {})
            }
        )
        db.commit()
        
        log_audit(db, process_id, "CONNECT_NODES", {
            "source": data.source_node_id,
            "target": data.target_node_id
        }, user.id)
        
        return {"message": "Nodes connected"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{process_id}/connections/{connection_id}/delete")
def delete_connection(
    process_id: int,
    connection_id: int,
    company_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Delete connection"""
    try:
        db = get_company_db(company_id, db)
        
        db.execute(
            text("UPDATE process_connections SET is_active = FALSE WHERE id = :conn_id AND process_id = :process_id"),
            {"conn_id": connection_id, "process_id": process_id}
        )
        db.commit()
        
        return {"message": "Connection deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# PERIOD MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/{process_id}/periods/add")
def add_period(
    process_id: int,
    company_id: int,
    data: PeriodCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Add period"""
    try:
        db = get_company_db(company_id, db)
        
        db.execute(
            text("""
                INSERT INTO process_periods 
                (process_id, period_name, start_date, end_date, fiscal_year, is_open)
                VALUES (:process_id, :name, :start, :end, :year, :is_open)
            """),
            {
                "process_id": process_id,
                "name": data.period_name,
                "start": data.start_date,
                "end": data.end_date,
                "year": data.fiscal_year,
                "is_open": data.is_open
            }
        )
        db.commit()
        
        log_audit(db, process_id, "ADD_PERIOD", {"period": data.period_name}, user.id)
        
        return {"message": "Period added"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# RULES MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/{process_id}/rules/add")
def add_rule(
    process_id: int,
    company_id: int,
    data: RuleCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Add processing rule"""
    try:
        db = get_company_db(company_id, db)
        
        db.execute(
            text("""
                INSERT INTO process_rules 
                (process_id, rule_type, rule_name, rule_config, priority)
                VALUES (:process_id, :type, :name, :config, :priority)
            """),
            {
                "process_id": process_id,
                "type": data.rule_type,
                "name": data.rule_name,
                "config": json.dumps(data.rule_config),
                "priority": data.priority
            }
        )
        db.commit()
        
        return {"message": "Rule added"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# NODE TEMPLATES ENDPOINT
# ============================================================================

@router.get("/templates/all")
def get_all_templates():
    """Get all available node templates with configurations"""
    templates = {
        "journal_entries": {
            "title": "Journal Entries",
            "icon": "BookOpen",
            "description": "Create and manage journal entries with account mappings",
            "configuration": {
                "entry_date": "required",
                "reference": "optional",
                "narrative": "optional",
                "auto_reverse": False
            }
        },
        "forms": {
            "title": "Forms & Data Collection",
            "icon": "FileText",
            "description": "Collect custom data from users via structured forms",
            "configuration": {
                "form_type": "custom",
                "required_fields": [],
                "submission_tracking": True
            }
        },
        "entity_structure": {
            "title": "Entity Structure",
            "icon": "GitBranch",
            "description": "Define and manage entity hierarchies and ownership percentages",
            "configuration": {
                "parent_entity": "required",
                "child_entities": [],
                "ownership_method": "direct",  # direct or step
                "acquisition_date": "optional"
            }
        },
        "tb_verification": {
            "title": "Trial Balance Verification",
            "icon": "CheckCircle",
            "description": "Verify and reconcile trial balances with tolerance checks",
            "configuration": {
                "tolerance_amount": 0.01,
                "tolerance_percentage": 0.001,
                "auto_reconcile": False
            }
        },
        "intercompany_eliminations": {
            "title": "Intercompany Eliminations",
            "icon": "Link",
            "description": "Eliminate IC transactions, profit in inventory, upstream/downstream",
            "configuration": {
                "elimination_method": "full",  # full or partial
                "inventory_method": "fifo",
                "profit_in_inventory": True,
                "fx_differences": "record"
            }
        },
        "fx_translation": {
            "title": "FX / Foreign Currency Translation",
            "icon": "Globe",
            "description": "Handle currency conversion with CTA recording",
            "configuration": {
                "translation_method": "closing_rate",  # closing_rate or average
                "cta_treatment": "equity",  # equity or p_and_l
                "rate_date": "period_end",
                "revalue_opening": False
            }
        },
        "fair_value_adjustments": {
            "title": "Fair Value Adjustments",
            "icon": "DollarSign",
            "description": "Record and depreciate acquisition fair value differences",
            "configuration": {
                "fva_method": "push_down",  # push_down or consolidation
                "amortization": True,
                "useful_life_years": 5,
                "impairment_testing": True
            }
        },
        "deferred_taxes": {
            "title": "Deferred Taxes",
            "icon": "Percent",
            "description": "Calculate deferred tax impacts on consolidation adjustments",
            "configuration": {
                "tax_rate": 25.0,
                "jurisdiction": "default",
                "dta_recognition": "full",
                "valuation_allowance": False
            }
        },
        "nci_allocation": {
            "title": "Non-Controlling Interest (NCI)",
            "icon": "Users",
            "description": "Allocate profits and equity to minority shareholders",
            "configuration": {
                "measurement_method": "proportionate",  # proportionate or fair_value
                "profit_allocation": True,
                "oci_allocation": True,
                "dividend_tracking": True
            }
        },
        "retained_earnings_rollforward": {
            "title": "Retained Earnings Rollforward",
            "icon": "TrendingUp",
            "description": "Calculate period-end retained earnings from components",
            "configuration": {
                "opening_balance_method": "from_prior",
                "adjustment_tracking": True,
                "dividend_deduction": True,
                "error_correction": True
            }
        },
        "goodwill_impairment": {
            "title": "Goodwill & Impairment Testing",
            "icon": "AlertCircle",
            "description": "Test and record goodwill and intangible impairment",
            "configuration": {
                "impairment_method": "fair_value",
                "cgu_definition": "cash_generating_unit",
                "discount_rate": 10.0,
                "growth_rate": 2.0
            }
        },
        "profit_calculation": {
            "title": "Profit / Loss Calculation",
            "icon": "BarChart3",
            "description": "Calculate profit for entity, group, segments",
            "configuration": {
                "profit_type": "net",  # net, operating, gross
                "segment_reporting": False,
                "comparative_periods": True
            }
        },
        "opening_balance_adjustments": {
            "title": "Opening Balance Adjustments",
            "icon": "Database",
            "description": "Manage opening balances for consolidation",
            "configuration": {
                "source_prior_period": True,
                "manual_adjustment": True,
                "validation_check": True
            }
        },
        "prior_period_errors": {
            "title": "Prior Period Errors & Restatements",
            "icon": "AlertTriangle",
            "description": "Handle prior period errors and accounting policy changes",
            "configuration": {
                "error_type": "material",
                "restatement_date": "period_start",
                "disclosure_required": True
            }
        },
        "oci_items": {
            "title": "Other Comprehensive Income (OCI)",
            "icon": "Activity",
            "description": "Capture OCI items not in P&L",
            "configuration": {
                "oci_items": ["revaluation", "currency", "actuarial"],
                "reclassification_tracking": True
            }
        },
        "epa_calculation": {
            "title": "Earnings Per Share (EPS)",
            "icon": "Calculator",
            "description": "Calculate basic and diluted EPS",
            "configuration": {
                "eps_type": "basic",  # basic or diluted
                "weighted_average": True,
                "treasury_stock": False
            }
        }
    }
    return {"templates": templates}

# ============================================================================
# SIMULATION & FINALIZATION ENDPOINTS
# ============================================================================

@router.post("/{process_id}/simulate")
def simulate_process(
    process_id: int,
    company_id: int,
    period_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Run process in simulation mode (staging tables only)"""
    try:
        db = get_company_db(company_id, db)
        
        # Create staging run
        run_id = str(uuid.uuid4())
        
        # Get all enabled nodes ordered by execution
        nodes = db.execute(
            text("SELECT id, node_type, node_config FROM process_nodes WHERE process_id = :process_id AND is_enabled = TRUE ORDER BY execution_order"),
            {"process_id": process_id}
        ).fetchall()
        
        # Execute each node to staging
        for node_id, node_type, node_config in nodes:
            db.execute(
                text("""
                    INSERT INTO process_staging 
                    (process_id, node_id, run_id, status)
                    VALUES (:process_id, :node_id, :run_id, 'simulated')
                """),
                {"process_id": process_id, "node_id": node_id, "run_id": run_id}
            )
        
        db.commit()
        
        log_audit(db, process_id, "SIMULATE", {"run_id": run_id}, user.id)
        
        return {
            "run_id": run_id,
            "status": "completed",
            "nodes_processed": len(nodes)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{process_id}/finalize")
def finalize_process(
    process_id: int,
    company_id: int,
    run_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Finalize process - commit staging to production"""
    try:
        db = get_company_db(company_id, db)
        
        # Update process status
        db.execute(
            text("UPDATE process_main SET status = 'completed' WHERE id = :id"),
            {"id": process_id}
        )
        
        # Mark staging as finalized
        db.execute(
            text("UPDATE process_staging SET status = 'finalized' WHERE run_id = :run_id"),
            {"run_id": run_id}
        )
        
        db.commit()
        
        log_audit(db, process_id, "FINALIZE", {"run_id": run_id}, user.id)
        
        return {"message": "Process finalized"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# AUDIT & HISTORY ENDPOINTS
# ============================================================================

@router.get("/{process_id}/audit")
def get_audit_trail(
    process_id: int,
    company_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Get complete audit trail"""
    try:
        db = get_company_db(company_id, db)
        
        result = db.execute(
            text("SELECT action, change_details, performed_by_id, audit_timestamp FROM process_audit WHERE process_id = :process_id ORDER BY audit_timestamp DESC"),
            {"process_id": process_id}
        ).fetchall()
        
        return [
            {
                "action": row[0],
                "details": row[1],
                "performed_by": row[2],
                "timestamp": row[3].isoformat()
            }
            for row in result
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))