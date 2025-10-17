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

from database import get_db
from auth.dependencies import get_current_active_user
from models.financial_process import *

router = APIRouter(prefix="/api/financial-process", tags=["Financial Process"])

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ProcessCreate(BaseModel):
    name: str
    description: Optional[str] = None
    process_type: str = "profit_loss"
    fiscal_year: Optional[int] = None
    reporting_currency: str = "USD"
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
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get all financial processes for a company"""
    try:
        # Get company database
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        
        # Query processes
        query = text(f"""
            SELECT id, name, description, process_type, status, fiscal_year, 
                   reporting_currency, created_at, updated_at
            FROM {company_db_name}.financial_processes
            ORDER BY created_at DESC
        """)
        
        result = db.execute(query)
        processes = [dict(row._mapping) for row in result]
        
        return {"processes": processes}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching processes: {str(e)}")

@router.post("/processes")
async def create_process(
    company_name: str = Query(...),
    process_data: ProcessCreate = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create a new financial process"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        process_id = str(uuid.uuid4())
        
        query = text(f"""
            INSERT INTO {company_db_name}.financial_processes 
            (id, company_id, name, description, process_type, fiscal_year, 
             reporting_currency, settings, created_by, created_at, updated_at)
            VALUES (:id, :company_id, :name, :description, :process_type, :fiscal_year,
                    :reporting_currency, :settings, :created_by, NOW(), NOW())
            RETURNING id, name, description, process_type, status
        """)
        
        result = db.execute(query, {
            "id": process_id,
            "company_id": str(uuid.uuid4()),  # Company UUID
            "name": process_data.name,
            "description": process_data.description,
            "process_type": process_data.process_type,
            "fiscal_year": process_data.fiscal_year,
            "reporting_currency": process_data.reporting_currency,
            "settings": json.dumps(process_data.settings),
            "created_by": str(current_user.id)
        })
        
        db.commit()
        process = dict(result.fetchone()._mapping)
        
        return {"process": process}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating process: {str(e)}")

@router.get("/processes/{process_id}")
async def get_process(
    process_id: str,
    company_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get process details with nodes and connections"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        
        # Get process
        process_query = text(f"""
            SELECT * FROM {company_db_name}.financial_processes 
            WHERE id = :process_id
        """)
        
        process_result = db.execute(process_query, {"process_id": process_id})
        process = dict(process_result.fetchone()._mapping)
        
        # Get nodes
        nodes_query = text(f"""
            SELECT * FROM {company_db_name}.process_nodes 
            WHERE process_id = :process_id
            ORDER BY sequence
        """)
        
        nodes_result = db.execute(nodes_query, {"process_id": process_id})
        nodes = [dict(row._mapping) for row in nodes_result]
        
        # Get connections
        connections_query = text(f"""
            SELECT * FROM {company_db_name}.process_connections 
            WHERE process_id = :process_id
        """)
        
        connections_result = db.execute(connections_query, {"process_id": process_id})
        connections = [dict(row._mapping) for row in connections_result]
        
        return {
            "process": process,
            "nodes": nodes,
            "connections": connections
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching process: {str(e)}")

# ============================================================================
# NODE MANAGEMENT
# ============================================================================

@router.post("/processes/{process_id}/nodes")
async def create_node(
    process_id: str,
    company_name: str = Query(...),
    node_data: NodeCreate = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Create a new process node"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        node_id = str(uuid.uuid4())
        
        query = text(f"""
            INSERT INTO {company_db_name}.process_nodes 
            (id, process_id, node_type, name, description, x, y, configuration, created_at, updated_at)
            VALUES (:id, :process_id, :node_type, :name, :description, :x, :y, :configuration, NOW(), NOW())
            RETURNING id, node_type, name, x, y
        """)
        
        result = db.execute(query, {
            "id": node_id,
            "process_id": process_id,
            "node_type": node_data.node_type,
            "name": node_data.name,
            "description": node_data.description,
            "x": node_data.x,
            "y": node_data.y,
            "configuration": json.dumps(node_data.configuration)
        })
        
        db.commit()
        node = dict(result.fetchone()._mapping)
        
        return {"node": node}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating node: {str(e)}")

@router.put("/processes/{process_id}/nodes/{node_id}")
async def update_node(
    process_id: str,
    node_id: str,
    company_name: str = Query(...),
    node_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update a process node"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        
        # Build update query dynamically
        update_fields = []
        params = {"node_id": node_id, "process_id": process_id}
        
        for key, value in node_data.items():
            if key in ['name', 'description', 'x', 'y', 'configuration', 'is_active']:
                update_fields.append(f"{key} = :{key}")
                if key == 'configuration':
                    params[key] = json.dumps(value)
                else:
                    params[key] = value
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        query = text(f"""
            UPDATE {company_db_name}.process_nodes 
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE id = :node_id AND process_id = :process_id
            RETURNING id, name, x, y
        """)
        
        result = db.execute(query, params)
        db.commit()
        
        updated_node = result.fetchone()
        if not updated_node:
            raise HTTPException(status_code=404, detail="Node not found")
        
        return {"node": dict(updated_node._mapping)}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating node: {str(e)}")

@router.delete("/processes/{process_id}/nodes/{node_id}")
async def delete_node(
    process_id: str,
    node_id: str,
    company_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Delete a process node"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        
        # Delete connections first
        delete_connections_query = text(f"""
            DELETE FROM {company_db_name}.process_connections 
            WHERE from_node_id = :node_id OR to_node_id = :node_id
        """)
        
        db.execute(delete_connections_query, {"node_id": node_id})
        
        # Delete node
        delete_node_query = text(f"""
            DELETE FROM {company_db_name}.process_nodes 
            WHERE id = :node_id AND process_id = :process_id
        """)
        
        result = db.execute(delete_node_query, {"node_id": node_id, "process_id": process_id})
        db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Node not found")
        
        return {"message": "Node deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting node: {str(e)}")

# ============================================================================
# SCENARIO MANAGEMENT
# ============================================================================

@router.get("/processes/{process_id}/scenarios")
async def get_scenarios(
    process_id: str,
    company_name: str = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get all scenarios for a process"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        
        query = text(f"""
            SELECT id, name, description, scenario_type, status, version_number,
                   fx_rate_overrides, custom_parameters, created_at
            FROM {company_db_name}.process_scenarios
            WHERE process_id = :process_id
            ORDER BY created_at DESC
        """)
        
        result = db.execute(query, {"process_id": process_id})
        scenarios = [dict(row._mapping) for row in result]
        
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
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get reference data for process building"""
    try:
        company_db_name = f"company_{company_name.lower().replace(' ', '_').replace('-', '_')}"
        
        # Get accounts
        accounts_query = text(f"""
            SELECT code, name, account_type FROM {company_db_name}.accounts
            WHERE is_active = true ORDER BY code
        """)
        accounts_result = db.execute(accounts_query)
        accounts = [{"code": row.code, "name": row.name, "type": row.account_type} 
                   for row in accounts_result]
        
        # Get entities
        entities_query = text(f"""
            SELECT code, name, currency FROM {company_db_name}.entities
            WHERE is_active = true ORDER BY code
        """)
        entities_result = db.execute(entities_query)
        entities = [{"code": row.code, "name": row.name, "currency": row.currency} 
                   for row in entities_result]
        
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
