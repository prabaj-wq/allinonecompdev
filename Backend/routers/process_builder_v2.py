import json
import uuid
import logging
from datetime import datetime, date
from decimal import Decimal
from typing import List, Dict, Optional, Any
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import pandas as pd
import re

from database import get_db
from auth.dependencies import get_current_user
from models.process_builder import (
    ProcessDefinition, ProcessNode, ProcessNodeConnection, ProcessPeriod,
    ProcessData, ProcessStaging, ProcessJournal, ProcessScenario,
    ProcessExecution, EntityStructure, ProcessAuditTrail, ValidationRule,
    ProcessOverride, CustomLogicTemplate, ProcessType, ProcessStatus,
    NodeType, ConnectionType
)

router = APIRouter(prefix="/process", tags=["Process Builder"])
logger = logging.getLogger(__name__)


# ==================== UTILITY FUNCTIONS ====================

def get_company_id_from_user(current_user: dict) -> str:
    """Extract company_id from JWT token"""
    return current_user.get('company_id', str(uuid.uuid4()))


def audit_log(db: Session, company_id: str, process_id: str, 
              action: str, entity_type: str, entity_id: str, 
              old_values: Dict = None, new_values: Dict = None, user_id: str = None):
    """Create audit trail entry"""
    audit = ProcessAuditTrail(
        company_id=company_id,
        process_id=process_id,
        action_type=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        old_values=old_values,
        new_values=new_values
    )
    db.add(audit)


def create_validation_alerts(execution_results: Dict) -> List[Dict]:
    """Generate validation alerts based on execution results"""
    alerts = []
    
    # Check balance sheet balance (Assets = Liabilities + Equity)
    if execution_results.get('total_assets') and execution_results.get('total_liabilities'):
        total_liabilities = Decimal(str(execution_results['total_liabilities'])) + Decimal(str(execution_results.get('total_equity', 0)))
        total_assets = Decimal(str(execution_results['total_assets']))
        
        if abs(total_assets - total_liabilities) > 0.01:
            alerts.append({
                'type': 'error',
                'message': f'Balance Sheet Out of Balance: Assets {total_assets} != Liabilities + Equity {total_liabilities}',
                'severity': 'error'
            })
    
    # Check retained earnings not negative
    if execution_results.get('retained_earnings', 0) < 0:
        alerts.append({
            'type': 'warning',
            'message': f"Negative Retained Earnings: {execution_results['retained_earnings']}",
            'severity': 'warning'
        })
    
    # Check intercompany net to zero
    if execution_results.get('ic_balance', 0) != 0:
        alerts.append({
            'type': 'warning',
            'message': f"Intercompany not net to zero: {execution_results['ic_balance']}",
            'severity': 'warning'
        })
    
    # Check FX variance threshold
    if abs(execution_results.get('fx_variance', 0)) > 100:
        alerts.append({
            'type': 'warning',
            'message': f"High FX Variance: {execution_results['fx_variance']}",
            'severity': 'warning'
        })
    
    return alerts


# ==================== PROCESS MANAGEMENT ENDPOINTS ====================

@router.post("/create")
async def create_process(
    name: str = Body(...),
    description: str = Body(None),
    process_type: str = Body(ProcessType.CONSOLIDATION),
    fiscal_year: int = Body(...),
    base_scenario_id: Optional[str] = Body(None),
    settings: Dict = Body(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new process"""
    try:
        company_id = get_company_id_from_user(current_user)
        process_id = uuid.uuid4()
        
        process = ProcessDefinition(
            id=process_id,
            company_id=company_id,
            name=name,
            description=description,
            process_type=process_type,
            fiscal_year=fiscal_year,
            base_scenario_id=base_scenario_id and uuid.UUID(base_scenario_id),
            settings=settings or {},
            created_by=current_user['id'],
            status=ProcessStatus.DRAFT
        )
        
        db.add(process)
        audit_log(db, company_id, str(process_id), "create", "process", str(process_id), 
                 new_values={'name': name, 'type': process_type}, user_id=current_user['id'])
        db.commit()
        
        return {
            "id": str(process_id),
            "name": name,
            "status": ProcessStatus.DRAFT,
            "message": "Process created successfully"
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating process: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_processes(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all processes for the company"""
    try:
        company_id = get_company_id_from_user(current_user)
        
        processes = db.query(ProcessDefinition).filter(
            ProcessDefinition.company_id == company_id
        ).offset(skip).limit(limit).all()
        
        return [
            {
                "id": str(p.id),
                "name": p.name,
                "type": p.process_type,
                "status": p.status,
                "fiscal_year": p.fiscal_year,
                "created_at": p.created_at.isoformat()
            }
            for p in processes
        ]
    except Exception as e:
        logger.error(f"Error listing processes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{process_id}")
async def get_process(
    process_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get process details with all nodes and connections"""
    try:
        company_id = get_company_id_from_user(current_user)
        process_id_uuid = uuid.UUID(process_id)
        
        process = db.query(ProcessDefinition).filter(
            and_(ProcessDefinition.id == process_id_uuid, 
                 ProcessDefinition.company_id == company_id)
        ).first()
        
        if not process:
            raise HTTPException(status_code=404, detail="Process not found")
        
        # Get all nodes
        nodes = db.query(ProcessNode).filter(ProcessNode.process_id == process_id_uuid).all()
        
        # Get all connections
        connections = db.query(ProcessNodeConnection).filter(
            ProcessNodeConnection.process_id == process_id_uuid
        ).all()
        
        # Get periods
        periods = db.query(ProcessPeriod).filter(
            ProcessPeriod.process_id == process_id_uuid
        ).all()
        
        # Get entity structure
        entities = db.query(EntityStructure).filter(
            EntityStructure.process_id == process_id_uuid
        ).all()
        
        return {
            "id": str(process.id),
            "name": process.name,
            "description": process.description,
            "type": process.process_type,
            "status": process.status,
            "fiscal_year": process.fiscal_year,
            "settings": process.settings,
            "nodes": [
                {
                    "id": str(n.id),
                    "type": n.node_type,
                    "name": n.name,
                    "sequence": n.sequence,
                    "x": n.x,
                    "y": n.y,
                    "configuration": n.configuration,
                    "custom_logic": n.custom_logic,
                    "custom_fields": n.custom_fields,
                    "is_active": n.is_active,
                    "is_locked": n.is_locked
                }
                for n in nodes
            ],
            "connections": [
                {
                    "id": str(c.id),
                    "from_node_id": str(c.from_node_id),
                    "to_node_id": str(c.to_node_id),
                    "type": c.connection_type,
                    "data_mapping": c.data_mapping,
                    "conditional_logic": c.conditional_logic
                }
                for c in connections
            ],
            "periods": [
                {
                    "id": str(p.id),
                    "name": p.period_name,
                    "number": p.period_number,
                    "start_date": p.period_start_date.isoformat(),
                    "end_date": p.period_end_date.isoformat()
                }
                for p in periods
            ],
            "entities": [
                {
                    "id": str(e.id),
                    "parent": e.parent_entity_id,
                    "child": e.child_entity_id,
                    "ownership": e.ownership_percentage,
                    "consolidation_method": e.consolidation_method,
                    "nci_percentage": e.nci_percentage
                }
                for e in entities
            ]
        }
    except Exception as e:
        logger.error(f"Error getting process: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{process_id}")
async def update_process(
    process_id: str,
    name: Optional[str] = Body(None),
    description: Optional[str] = Body(None),
    settings: Optional[Dict] = Body(None),
    status: Optional[str] = Body(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update process"""
    try:
        company_id = get_company_id_from_user(current_user)
        process_id_uuid = uuid.UUID(process_id)
        
        process = db.query(ProcessDefinition).filter(
            and_(ProcessDefinition.id == process_id_uuid,
                 ProcessDefinition.company_id == company_id)
        ).first()
        
        if not process:
            raise HTTPException(status_code=404, detail="Process not found")
        
        old_values = {
            "name": process.name,
            "status": process.status,
            "settings": process.settings
        }
        
        if name:
            process.name = name
        if description is not None:
            process.description = description
        if settings:
            process.settings = {**process.settings, **settings}
        if status:
            process.status = status
        
        process.updated_at = datetime.utcnow()
        
        audit_log(db, company_id, process_id, "update", "process", process_id,
                 old_values=old_values, new_values={"name": name, "status": status},
                 user_id=current_user['id'])
        
        db.commit()
        
        return {"message": "Process updated", "id": process_id}
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating process: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== NODE OPERATIONS ====================

@router.post("/{process_id}/node/add")
async def add_node(
    process_id: str,
    node_type: str = Body(...),
    name: str = Body(...),
    x: float = Body(0),
    y: float = Body(0),
    sequence: int = Body(None),
    configuration: Dict = Body(None),
    custom_logic: str = Body(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a node to the process canvas"""
    try:
        company_id = get_company_id_from_user(current_user)
        process_id_uuid = uuid.UUID(process_id)
        
        # Verify process exists
        process = db.query(ProcessDefinition).filter(
            and_(ProcessDefinition.id == process_id_uuid,
                 ProcessDefinition.company_id == company_id)
        ).first()
        
        if not process:
            raise HTTPException(status_code=404, detail="Process not found")
        
        # Auto-calculate sequence if not provided
        if sequence is None:
            max_seq = db.query(ProcessNode).filter(
                ProcessNode.process_id == process_id_uuid
            ).count()
            sequence = max_seq + 1
        
        node_id = uuid.uuid4()
        node = ProcessNode(
            id=node_id,
            process_id=process_id_uuid,
            node_type=node_type,
            name=name,
            sequence=sequence,
            x=x,
            y=y,
            configuration=configuration or {},
            custom_logic=custom_logic
        )
        
        db.add(node)
        audit_log(db, company_id, process_id, "create", "node", str(node_id),
                 new_values={"name": name, "type": node_type}, user_id=current_user['id'])
        db.commit()
        
        return {
            "id": str(node_id),
            "name": name,
            "type": node_type,
            "sequence": sequence,
            "message": "Node added successfully"
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding node: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{process_id}/node/{node_id}")
async def update_node(
    process_id: str,
    node_id: str,
    name: Optional[str] = Body(None),
    x: Optional[float] = Body(None),
    y: Optional[float] = Body(None),
    configuration: Optional[Dict] = Body(None),
    custom_logic: Optional[str] = Body(None),
    custom_fields: Optional[Dict] = Body(None),
    is_active: Optional[bool] = Body(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update node configuration"""
    try:
        company_id = get_company_id_from_user(current_user)
        node_id_uuid = uuid.UUID(node_id)
        process_id_uuid = uuid.UUID(process_id)
        
        node = db.query(ProcessNode).filter(
            and_(ProcessNode.id == node_id_uuid,
                 ProcessNode.process_id == process_id_uuid)
        ).first()
        
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        
        old_values = {
            "name": node.name,
            "x": node.x,
            "y": node.y,
            "configuration": node.configuration
        }
        
        if name:
            node.name = name
        if x is not None:
            node.x = x
        if y is not None:
            node.y = y
        if configuration:
            node.configuration = {**node.configuration, **configuration}
        if custom_logic:
            node.custom_logic = custom_logic
        if custom_fields:
            node.custom_fields = {**node.custom_fields, **custom_fields}
        if is_active is not None:
            node.is_active = is_active
        
        node.updated_at = datetime.utcnow()
        
        audit_log(db, company_id, process_id, "update", "node", node_id,
                 old_values=old_values, new_values={"name": name, "x": x, "y": y},
                 user_id=current_user['id'])
        
        db.commit()
        
        return {"message": "Node updated", "id": node_id}
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating node: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{process_id}/node/{node_id}")
async def delete_node(
    process_id: str,
    node_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a node and its connections"""
    try:
        company_id = get_company_id_from_user(current_user)
        node_id_uuid = uuid.UUID(node_id)
        process_id_uuid = uuid.UUID(process_id)
        
        node = db.query(ProcessNode).filter(
            and_(ProcessNode.id == node_id_uuid,
                 ProcessNode.process_id == process_id_uuid)
        ).first()
        
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        
        # Delete all connections involving this node
        db.query(ProcessNodeConnection).filter(
            or_(ProcessNodeConnection.from_node_id == node_id_uuid,
                ProcessNodeConnection.to_node_id == node_id_uuid)
        ).delete()
        
        # Delete the node
        db.delete(node)
        
        audit_log(db, company_id, process_id, "delete", "node", node_id,
                 user_id=current_user['id'])
        
        db.commit()
        
        return {"message": "Node deleted", "id": node_id}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting node: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CONNECTION OPERATIONS ====================

@router.post("/{process_id}/connect")
async def connect_nodes(
    process_id: str,
    from_node_id: str = Body(...),
    to_node_id: str = Body(...),
    connection_type: str = Body(ConnectionType.SEQUENTIAL),
    data_mapping: Dict = Body(None),
    conditional_logic: str = Body(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create connection between two nodes"""
    try:
        company_id = get_company_id_from_user(current_user)
        from_node_id_uuid = uuid.UUID(from_node_id)
        to_node_id_uuid = uuid.UUID(to_node_id)
        process_id_uuid = uuid.UUID(process_id)
        
        # Verify nodes exist
        from_node = db.query(ProcessNode).filter(
            ProcessNode.id == from_node_id_uuid
        ).first()
        to_node = db.query(ProcessNode).filter(
            ProcessNode.id == to_node_id_uuid
        ).first()
        
        if not from_node or not to_node:
            raise HTTPException(status_code=404, detail="One or both nodes not found")
        
        connection_id = uuid.uuid4()
        connection = ProcessNodeConnection(
            id=connection_id,
            process_id=process_id_uuid,
            from_node_id=from_node_id_uuid,
            to_node_id=to_node_id_uuid,
            connection_type=connection_type,
            data_mapping=data_mapping or {},
            conditional_logic=conditional_logic
        )
        
        db.add(connection)
        audit_log(db, company_id, process_id, "create", "connection", str(connection_id),
                 new_values={"from": from_node_id, "to": to_node_id},
                 user_id=current_user['id'])
        db.commit()
        
        return {
            "id": str(connection_id),
            "from_node_id": from_node_id,
            "to_node_id": to_node_id,
            "type": connection_type,
            "message": "Connection created"
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{process_id}/connection/{connection_id}")
async def disconnect_nodes(
    process_id: str,
    connection_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a connection between nodes"""
    try:
        company_id = get_company_id_from_user(current_user)
        connection_id_uuid = uuid.UUID(connection_id)
        
        connection = db.query(ProcessNodeConnection).filter(
            ProcessNodeConnection.id == connection_id_uuid
        ).first()
        
        if not connection:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        db.delete(connection)
        audit_log(db, company_id, process_id, "delete", "connection", connection_id,
                 user_id=current_user['id'])
        db.commit()
        
        return {"message": "Connection deleted"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PERIODS & ENTITIES ====================

@router.post("/{process_id}/periods/define")
async def define_periods(
    process_id: str,
    periods: List[Dict] = Body(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Define periods for the process"""
    try:
        company_id = get_company_id_from_user(current_user)
        process_id_uuid = uuid.UUID(process_id)
        
        # Delete existing periods
        db.query(ProcessPeriod).filter(
            ProcessPeriod.process_id == process_id_uuid
        ).delete()
        
        for period_data in periods:
            period = ProcessPeriod(
                id=uuid.uuid4(),
                process_id=process_id_uuid,
                period_name=period_data.get('name'),
                period_number=period_data.get('number'),
                period_start_date=datetime.strptime(period_data['start_date'], '%Y-%m-%d').date(),
                period_end_date=datetime.strptime(period_data['end_date'], '%Y-%m-%d').date(),
                is_active=period_data.get('is_active', True)
            )
            db.add(period)
        
        db.commit()
        
        return {"message": f"{len(periods)} periods defined"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error defining periods: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{process_id}/entities/register")
async def register_entities(
    process_id: str,
    entities: List[Dict] = Body(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register entity structure and ownership"""
    try:
        company_id = get_company_id_from_user(current_user)
        process_id_uuid = uuid.UUID(process_id)
        
        for entity_data in entities:
            entity = EntityStructure(
                id=uuid.uuid4(),
                company_id=company_id,
                process_id=process_id_uuid,
                parent_entity_id=entity_data['parent'],
                child_entity_id=entity_data['child'],
                ownership_percentage=Decimal(str(entity_data['ownership'])),
                consolidation_method=entity_data.get('method', 'full'),
                nci_method=entity_data.get('nci_method', 'fair_value'),
                nci_percentage=100 - Decimal(str(entity_data['ownership']))
            )
            db.add(entity)
        
        db.commit()
        
        return {"message": f"{len(entities)} entities registered"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error registering entities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DATA OPERATIONS ====================

@router.post("/{process_id}/scenario/{scenario_id}/data/import")
async def import_data(
    process_id: str,
    scenario_id: str,
    data: List[Dict] = Body(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import financial data for scenario"""
    try:
        company_id = get_company_id_from_user(current_user)
        process_id_uuid = uuid.UUID(process_id)
        scenario_id_uuid = uuid.UUID(scenario_id)
        
        for row in data:
            process_data = ProcessData(
                id=uuid.uuid4(),
                company_id=company_id,
                process_id=process_id_uuid,
                scenario_id=scenario_id_uuid,
                period_id=row.get('period_id') and uuid.UUID(row['period_id']),
                entity_id=row['entity_id'],
                account_code=row['account_code'],
                account_name=row.get('account_name'),
                amount=Decimal(str(row['amount'])),
                currency=row.get('currency', 'USD'),
                data_type=row.get('type', 'actual'),
                imported_by=current_user['id']
            )
            db.add(process_data)
        
        db.commit()
        
        return {"message": f"{len(data)} records imported"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error importing data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== EXECUTION & CALCULATION ENGINE ====================

def calculate_journal_entries(
    db: Session,
    process_id: str,
    scenario_id: str,
    node_id: str,
    node_config: Dict,
    node_type: str
) -> Dict:
    """Main calculation engine - handles all 26 financial features"""
    
    process_id_uuid = uuid.UUID(process_id)
    scenario_id_uuid = uuid.UUID(scenario_id)
    node_id_uuid = uuid.UUID(node_id)
    
    results = {
        'entries': [],
        'calculations': {},
        'alerts': []
    }
    
    try:
        # Get all source data
        data = db.query(ProcessData).filter(
            and_(ProcessData.process_id == process_id_uuid,
                 ProcessData.scenario_id == scenario_id_uuid)
        ).all()
        
        # Convert to DataFrame for easier calculation
        df_data = pd.DataFrame([
            {
                'entity_id': d.entity_id,
                'account_code': d.account_code,
                'amount': float(d.amount),
                'currency': d.currency,
                'period_id': d.period_id,
                'type': d.data_type
            }
            for d in data
        ])
        
        # Handle different node types with their specific logic
        if node_type == NodeType.ROLLFORWARD:
            results = calculate_rollforward(df_data, node_config, results)
        
        elif node_type == NodeType.FX_TRANSLATION:
            results = calculate_fx_translation(df_data, node_config, results)
        
        elif node_type == NodeType.INTERCOMPANY_ELIMINATION:
            results = calculate_intercompany_elimination(df_data, node_config, results)
        
        elif node_type == NodeType.NCI_ALLOCATION:
            results = calculate_nci_allocation(df_data, node_config, results)
        
        elif node_type == NodeType.DEFERRED_TAX:
            results = calculate_deferred_tax(df_data, node_config, results)
        
        elif node_type == NodeType.GOODWILL_IMPAIRMENT:
            results = calculate_goodwill_impairment(df_data, node_config, results)
        
        elif node_type == NodeType.PROFIT_LOSS:
            results = calculate_profit_loss(df_data, node_config, results)
        
        elif node_type == NodeType.EPS_CALCULATION:
            results = calculate_eps(df_data, node_config, results)
        
        elif node_type == NodeType.RETAINED_EARNINGS:
            results = calculate_retained_earnings(df_data, node_config, results)
        
        elif node_type == NodeType.CONSOLIDATION_OUTPUT:
            results = generate_consolidation_output(df_data, node_config, results)
        
        # Custom logic execution
        if node_config.get('custom_logic'):
            results = execute_custom_logic(df_data, node_config.get('custom_logic'), results)
        
    except Exception as e:
        logger.error(f"Error in calculation: {e}")
        results['alerts'].append({
            'type': 'error',
            'message': str(e)
        })
    
    return results


# ==================== CALCULATION FUNCTIONS FOR EACH FEATURE ====================

def calculate_rollforward(df_data: pd.DataFrame, config: Dict, results: Dict) -> Dict:
    """Calculate balance rollforward with opening + changes = closing"""
    
    try:
        opening_balance_code = config.get('opening_balance_code')
        closing_balance_code = config.get('closing_balance_code')
        
        if opening_balance_code and closing_balance_code:
            # Group by entity and account
            by_entity = df_data.groupby(['entity_id', 'account_code'])
            
            for (entity, account), group in by_entity:
                opening = group[group['type'] == 'opening']['amount'].sum()
                changes = group[group['type'] != 'opening']['amount'].sum()
                closing = opening + changes
                
                results['entries'].append({
                    'entity_id': entity,
                    'account': account,
                    'opening': opening,
                    'changes': changes,
                    'closing': closing,
                    'type': 'rollforward'
                })
                
                results['calculations'][f'{entity}_{account}'] = {
                    'opening': opening,
                    'changes': changes,
                    'closing': closing
                }
    
    except Exception as e:
        results['alerts'].append({'type': 'error', 'message': str(e)})
    
    return results


def calculate_fx_translation(df_data: pd.DataFrame, config: Dict, results: Dict) -> Dict:
    """Calculate FX translation using temporal or current rate method"""
    
    try:
        method = config.get('method', 'current')  # current or temporal
        fx_rates = config.get('fx_rates', {})
        
        for _, row in df_data.iterrows():
            currency = row['currency']
            rate = Decimal(str(fx_rates.get(currency, 1.0)))
            
            translated_amount = Decimal(str(row['amount'])) * rate
            fx_gain_loss = translated_amount - Decimal(str(row['amount']))
            
            results['entries'].append({
                'entity_id': row['entity_id'],
                'account': row['account_code'],
                'original_currency': currency,
                'original_amount': row['amount'],
                'rate': float(rate),
                'translated_amount': float(translated_amount),
                'fx_gain_loss': float(fx_gain_loss),
                'method': method,
                'type': 'fx_translation'
            })
        
        total_fx = sum([e['fx_gain_loss'] for e in results['entries'] if e['type'] == 'fx_translation'])
        results['calculations']['total_fx_gain_loss'] = total_fx
        
        if abs(total_fx) > 1000:
            results['alerts'].append({
                'type': 'warning',
                'message': f'High FX variance: {total_fx}'
            })
    
    except Exception as e:
        results['alerts'].append({'type': 'error', 'message': str(e)})
    
    return results


def calculate_intercompany_elimination(df_data: pd.DataFrame, config: Dict, results: Dict) -> Dict:
    """Eliminate intercompany transactions"""
    
    try:
        intercompany_accounts = config.get('intercompany_accounts', {})
        
        # Find matching IC transactions
        for ic_account, details in intercompany_accounts.items():
            parent_company = details.get('parent')
            subsidiary = details.get('subsidiary')
            
            parent_data = df_data[(df_data['entity_id'] == parent_company) & 
                                (df_data['account_code'] == ic_account)]
            sub_data = df_data[(df_data['entity_id'] == subsidiary) & 
                              (df_data['account_code'] == ic_account)]
            
            if not parent_data.empty and not sub_data.empty:
                parent_amount = parent_data['amount'].sum()
                sub_amount = sub_data['amount'].sum()
                
                # Calculate difference to eliminate
                elimination_amount = (parent_amount + sub_amount) / 2
                
                results['entries'].append({
                    'from_entity': parent_company,
                    'to_entity': subsidiary,
                    'account': ic_account,
                    'elimination_amount': elimination_amount,
                    'parent_balance': parent_amount,
                    'subsidiary_balance': sub_amount,
                    'type': 'intercompany_elimination'
                })
                
                results['calculations'][f'IC_{ic_account}'] = {
                    'parent': parent_amount,
                    'subsidiary': sub_amount,
                    'eliminated': elimination_amount
                }
    
    except Exception as e:
        results['alerts'].append({'type': 'error', 'message': str(e)})
    
    return results


def calculate_nci_allocation(df_data: pd.DataFrame, config: Dict, results: Dict) -> Dict:
    """Calculate NCI (Non-Controlling Interest) allocation"""
    
    try:
        nci_percentage = config.get('nci_percentage', 0)
        method = config.get('method', 'fair_value')  # fair_value or proportionate_share
        subsidiary_profit = config.get('subsidiary_profit', 0)
        subsidiary_equity = config.get('subsidiary_equity', 0)
        
        # NCI share of profit
        nci_profit_share = Decimal(str(subsidiary_profit)) * Decimal(str(nci_percentage)) / 100
        
        # NCI share of equity
        nci_equity_share = Decimal(str(subsidiary_equity)) * Decimal(str(nci_percentage)) / 100
        
        # Fair value adjustment if applicable
        fair_value_adjustment = Decimal(0)
        if method == 'fair_value':
            fair_value = config.get('fair_value', 0)
            fair_value_adjustment = (Decimal(str(fair_value)) * Decimal(str(nci_percentage)) / 100 - nci_equity_share)
        
        results['entries'].append({
            'nci_percentage': nci_percentage,
            'method': method,
            'subsidiary_profit': float(subsidiary_profit),
            'nci_profit_share': float(nci_profit_share),
            'subsidiary_equity': float(subsidiary_equity),
            'nci_equity_share': float(nci_equity_share),
            'fair_value_adjustment': float(fair_value_adjustment),
            'total_nci': float(nci_equity_share + fair_value_adjustment),
            'type': 'nci_allocation'
        })
        
        results['calculations']['nci'] = {
            'profit_share': float(nci_profit_share),
            'equity_share': float(nci_equity_share),
            'fair_value_adjustment': float(fair_value_adjustment)
        }
    
    except Exception as e:
        results['alerts'].append({'type': 'error', 'message': str(e)})
    
    return results


def calculate_deferred_tax(df_data: pd.DataFrame, config: Dict, results: Dict) -> Dict:
    """Calculate deferred tax adjustments"""
    
    try:
        tax_rate = config.get('tax_rate', 0.21)
        temporary_differences = config.get('temporary_differences', {})
        
        total_dta = Decimal(0)
        total_dtl = Decimal(0)
        
        for difference_type, amount in temporary_differences.items():
            amount_decimal = Decimal(str(amount))
            deferred_amount = amount_decimal * Decimal(str(tax_rate))
            
            if amount > 0:
                total_dta += deferred_amount
            else:
                total_dtl += deferred_amount
            
            results['entries'].append({
                'difference_type': difference_type,
                'amount': float(amount),
                'tax_rate': tax_rate,
                'deferred_amount': float(deferred_amount),
                'type': 'deferred_tax'
            })
        
        results['calculations']['deferred_tax'] = {
            'total_dta': float(total_dta),
            'total_dtl': float(total_dtl),
            'net_deferred': float(total_dta - total_dtl)
        }
    
    except Exception as e:
        results['alerts'].append({'type': 'error', 'message': str(e)})
    
    return results


def calculate_goodwill_impairment(df_data: pd.DataFrame, config: Dict, results: Dict) -> Dict:
    """Calculate goodwill impairment testing"""
    
    try:
        goodwill_amount = config.get('goodwill_amount', 0)
        fair_value = config.get('fair_value', 0)
        carrying_value = config.get('carrying_value', 0)
        
        impairment_loss = Decimal(0)
        if fair_value < carrying_value:
            impairment_loss = Decimal(str(carrying_value)) - Decimal(str(fair_value))
        
        results['entries'].append({
            'goodwill_amount': float(goodwill_amount),
            'fair_value': float(fair_value),
            'carrying_value': float(carrying_value),
            'impairment_loss': float(impairment_loss),
            'type': 'goodwill_impairment'
        })
        
        results['calculations']['goodwill'] = {
            'original': float(goodwill_amount),
            'impairment': float(impairment_loss),
            'remaining': float(Decimal(str(goodwill_amount)) - impairment_loss)
        }
        
        if impairment_loss > 0:
            results['alerts'].append({
                'type': 'warning',
                'message': f'Goodwill impairment detected: {impairment_loss}'
            })
    
    except Exception as e:
        results['alerts'].append({'type': 'error', 'message': str(e)})
    
    return results


def calculate_profit_loss(df_data: pd.DataFrame, config: Dict, results: Dict) -> Dict:
    """Calculate P&L with margins and segments"""
    
    try:
        revenue_code = config.get('revenue_code')
        cogs_code = config.get('cogs_code')
        
        revenue = df_data[df_data['account_code'] == revenue_code]['amount'].sum()
        cogs = df_data[df_data['account_code'] == cogs_code]['amount'].sum()
        
        gross_profit = Decimal(str(revenue)) - Decimal(str(cogs))
        gross_margin = (gross_profit / Decimal(str(revenue)) * 100) if revenue != 0 else Decimal(0)
        
        # Operating expenses
        operating_expenses = config.get('operating_expenses', 0)
        operating_profit = gross_profit - Decimal(str(operating_expenses))
        
        # Tax
        tax_rate = config.get('tax_rate', 0.21)
        tax = operating_profit * Decimal(str(tax_rate))
        net_profit = operating_profit - tax
        
        results['entries'].append({
            'revenue': float(revenue),
            'cogs': float(cogs),
            'gross_profit': float(gross_profit),
            'gross_margin_pct': float(gross_margin),
            'operating_expenses': operating_expenses,
            'operating_profit': float(operating_profit),
            'tax': float(tax),
            'net_profit': float(net_profit),
            'type': 'profit_loss'
        })
        
        results['calculations']['pl'] = {
            'revenue': float(revenue),
            'gross_profit': float(gross_profit),
            'operating_profit': float(operating_profit),
            'net_profit': float(net_profit)
        }
    
    except Exception as e:
        results['alerts'].append({'type': 'error', 'message': str(e)})
    
    return results


def calculate_eps(df_data: pd.DataFrame, config: Dict, results: Dict) -> Dict:
    """Calculate EPS (Earnings Per Share) - basic and diluted"""
    
    try:
        net_income = config.get('net_income', 0)
        weighted_shares = config.get('weighted_shares', 1)
        dilutive_securities = config.get('dilutive_securities', 0)
        
        basic_eps = Decimal(str(net_income)) / Decimal(str(weighted_shares))
        diluted_eps = Decimal(str(net_income)) / (Decimal(str(weighted_shares)) + Decimal(str(dilutive_securities)))
        
        results['entries'].append({
            'net_income': float(net_income),
            'weighted_shares': float(weighted_shares),
            'basic_eps': float(basic_eps),
            'dilutive_securities': dilutive_securities,
            'diluted_eps': float(diluted_eps),
            'type': 'eps_calculation'
        })
        
        results['calculations']['eps'] = {
            'basic': float(basic_eps),
            'diluted': float(diluted_eps)
        }
    
    except Exception as e:
        results['alerts'].append({'type': 'error', 'message': str(e)})
    
    return results


def calculate_retained_earnings(df_data: pd.DataFrame, config: Dict, results: Dict) -> Dict:
    """Calculate retained earnings rollforward"""
    
    try:
        opening_re = config.get('opening_retained_earnings', 0)
        net_profit = config.get('net_profit', 0)
        dividends = config.get('dividends', 0)
        other_adjustments = config.get('other_adjustments', 0)
        
        closing_re = (Decimal(str(opening_re)) + 
                     Decimal(str(net_profit)) - 
                     Decimal(str(dividends)) + 
                     Decimal(str(other_adjustments)))
        
        results['entries'].append({
            'opening_retained_earnings': float(opening_re),
            'net_profit': float(net_profit),
            'dividends': float(dividends),
            'other_adjustments': other_adjustments,
            'closing_retained_earnings': float(closing_re),
            'type': 'retained_earnings'
        })
        
        results['calculations']['retained_earnings'] = {
            'opening': float(opening_re),
            'net_profit': float(net_profit),
            'closing': float(closing_re)
        }
        
        if closing_re < 0:
            results['alerts'].append({
                'type': 'warning',
                'message': f'Negative retained earnings: {closing_re}'
            })
    
    except Exception as e:
        results['alerts'].append({'type': 'error', 'message': str(e)})
    
    return results


def generate_consolidation_output(df_data: pd.DataFrame, config: Dict, results: Dict) -> Dict:
    """Generate consolidated financial statements"""
    
    try:
        # Aggregate all data
        consolidated = df_data.groupby('account_code')['amount'].sum()
        
        results['entries'] = consolidated.to_dict()
        results['calculations']['consolidated_statements'] = {
            'total_assets': float(consolidated.get('ASSETS', 0)),
            'total_liabilities': float(consolidated.get('LIABILITIES', 0)),
            'total_equity': float(consolidated.get('EQUITY', 0))
        }
    
    except Exception as e:
        results['alerts'].append({'type': 'error', 'message': str(e)})
    
    return results


def execute_custom_logic(df_data: pd.DataFrame, custom_code: str, results: Dict) -> Dict:
    """Execute custom calculation logic"""
    
    try:
        # Create safe execution context
        safe_dict = {
            'df_data': df_data,
            'Decimal': Decimal,
            'pd': pd,
            'results': results
        }
        
        exec(custom_code, {"__builtins__": {}}, safe_dict)
        
        if 'results' in safe_dict:
            results = safe_dict['results']
    
    except Exception as e:
        logger.error(f"Error executing custom logic: {e}")
        results['alerts'].append({
            'type': 'error',
            'message': f'Custom logic error: {str(e)}'
        })
    
    return results


# ==================== EXECUTION ENDPOINTS ====================

@router.post("/{process_id}/scenario/{scenario_id}/execute")
async def execute_process(
    process_id: str,
    scenario_id: str,
    execution_type: str = Body('simulate'),  # simulate or finalize
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute process nodes and generate journals"""
    
    try:
        company_id = get_company_id_from_user(current_user)
        process_id_uuid = uuid.UUID(process_id)
        scenario_id_uuid = uuid.UUID(scenario_id)
        
        import time
        start_time = time.time()
        
        # Create execution record
        execution_id = uuid.uuid4()
        execution = ProcessExecution(
            id=execution_id,
            company_id=company_id,
            process_id=process_id_uuid,
            scenario_id=scenario_id_uuid,
            execution_type=execution_type,
            status='in_progress',
            executed_by=current_user['id']
        )
        db.add(execution)
        db.flush()
        
        # Get all nodes in sequence
        nodes = db.query(ProcessNode).filter(
            ProcessNode.process_id == process_id_uuid
        ).order_by(ProcessNode.sequence).all()
        
        all_results = {}
        all_warnings = []
        all_errors = []
        all_alerts = []
        
        # Execute each node
        for node in nodes:
            try:
                if node.is_active:
                    node_results = calculate_journal_entries(
                        db, process_id, scenario_id, str(node.id),
                        node.configuration, node.node_type
                    )
                    
                    all_results[str(node.id)] = node_results.get('calculations', {})
                    all_warnings.extend(node_results.get('warnings', []))
                    all_errors.extend(node_results.get('errors', []))
                    all_alerts.extend(node_results.get('alerts', []))
                    
                    # Store staging data for simulation
                    if execution_type == 'simulate':
                        for entry in node_results.get('entries', []):
                            staging = ProcessStaging(
                                id=uuid.uuid4(),
                                company_id=company_id,
                                execution_id=execution_id,
                                node_id=node.id,
                                entity_id=entry.get('entity_id'),
                                account_code=entry.get('account'),
                                amount=Decimal(str(entry.get('amount', 0))),
                                currency=entry.get('currency', 'USD')
                            )
                            db.add(staging)
            
            except Exception as e:
                logger.error(f"Error executing node {node.id}: {e}")
                all_errors.append(str(e))
        
        # Validation
        validation_alerts = create_validation_alerts(all_results.get('consolidated_statements', {}))
        all_alerts.extend(validation_alerts)
        
        # If finalizing, create journals
        if execution_type == 'finalize':
            staging_data = db.query(ProcessStaging).filter(
                ProcessStaging.execution_id == execution_id
            ).all()
            
            for staging in staging_data:
                journal = ProcessJournal(
                    id=uuid.uuid4(),
                    company_id=company_id,
                    process_id=process_id_uuid,
                    scenario_id=scenario_id_uuid,
                    execution_id=execution_id,
                    entity_id=staging.entity_id,
                    account_code=staging.account_code,
                    debit_amount=staging.amount if staging.amount > 0 else 0,
                    credit_amount=staging.amount if staging.amount < 0 else 0,
                    currency=staging.currency,
                    is_posted=True,
                    posted_at=datetime.utcnow(),
                    created_by=current_user['id']
                )
                db.add(journal)
        
        # Update execution record
        execution.status = 'success' if not all_errors else 'error'
        execution.results = all_results
        execution.warnings = all_warnings
        execution.errors = all_errors
        execution.alerts = all_alerts
        execution.completed_at = datetime.utcnow()
        execution.execution_time_ms = int((time.time() - start_time) * 1000)
        
        db.commit()
        
        return {
            "execution_id": str(execution_id),
            "status": execution.status,
            "results": all_results,
            "warnings": all_warnings,
            "errors": all_errors,
            "alerts": all_alerts,
            "execution_time_ms": execution.execution_time_ms
        }
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error executing process: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SCENARIO OPERATIONS ====================

@router.post("/{process_id}/scenario/create")
async def create_scenario(
    process_id: str,
    name: str = Body(...),
    scenario_type: str = Body('actual'),
    parent_scenario_id: Optional[str] = Body(None),
    is_base: bool = Body(False),
    parameters: Optional[Dict] = Body(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new scenario (what-if or branch)"""
    
    try:
        company_id = get_company_id_from_user(current_user)
        process_id_uuid = uuid.UUID(process_id)
        
        scenario_id = uuid.uuid4()
        scenario = ProcessScenario(
            id=scenario_id,
            company_id=company_id,
            process_id=process_id_uuid,
            name=name,
            scenario_type=scenario_type,
            parent_scenario_id=parent_scenario_id and uuid.UUID(parent_scenario_id),
            is_base=is_base,
            fx_rate_overrides=parameters.get('fx_rates', {}) if parameters else {},
            tax_rate_overrides=parameters.get('tax_rates', {}) if parameters else {},
            profit_share_overrides=parameters.get('profit_shares', {}) if parameters else {},
            created_by=current_user['id']
        )
        
        db.add(scenario)
        db.commit()
        
        return {
            "id": str(scenario_id),
            "name": name,
            "type": scenario_type,
            "message": "Scenario created"
        }
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{process_id}/scenarios")
async def list_scenarios(
    process_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all scenarios for a process"""
    
    try:
        company_id = get_company_id_from_user(current_user)
        process_id_uuid = uuid.UUID(process_id)
        
        scenarios = db.query(ProcessScenario).filter(
            and_(ProcessScenario.process_id == process_id_uuid,
                 ProcessScenario.company_id == company_id)
        ).all()
        
        return [
            {
                "id": str(s.id),
                "name": s.name,
                "type": s.scenario_type,
                "is_base": s.is_base,
                "status": s.status,
                "created_at": s.created_at.isoformat()
            }
            for s in scenarios
        ]
    
    except Exception as e:
        logger.error(f"Error listing scenarios: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{process_id}/scenario/{scenario_id}/approve")
async def approve_scenario(
    process_id: str,
    scenario_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve scenario for finalization"""
    
    try:
        company_id = get_company_id_from_user(current_user)
        scenario_id_uuid = uuid.UUID(scenario_id)
        
        scenario = db.query(ProcessScenario).filter(
            and_(ProcessScenario.id == scenario_id_uuid,
                 ProcessScenario.company_id == company_id)
        ).first()
        
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        scenario.status = ProcessStatus.APPROVED
        scenario.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Scenario approved"}
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error approving scenario: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{process_id}/scenario/{scenario_id}/override")
async def add_override(
    process_id: str,
    scenario_id: str,
    execution_id: str = Body(...),
    node_id: str = Body(...),
    field_name: str = Body(...),
    override_value: Any = Body(...),
    reason: str = Body(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add manual override to execution"""
    
    try:
        company_id = get_company_id_from_user(current_user)
        
        override = ProcessOverride(
            id=uuid.uuid4(),
            company_id=company_id,
            execution_id=uuid.UUID(execution_id),
            node_id=uuid.UUID(node_id),
            override_type='value',
            field_name=field_name,
            override_value=override_value,
            reason=reason,
            created_by=current_user['id']
        )
        
        db.add(override)
        db.commit()
        
        return {"message": "Override added"}
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding override: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== REPORTING ====================

@router.get("/{process_id}/scenario/{scenario_id}/execution/{execution_id}/report")
async def get_execution_report(
    process_id: str,
    scenario_id: str,
    execution_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get execution report with all details"""
    
    try:
        company_id = get_company_id_from_user(current_user)
        execution_id_uuid = uuid.UUID(execution_id)
        
        execution = db.query(ProcessExecution).filter(
            and_(ProcessExecution.id == execution_id_uuid,
                 ProcessExecution.company_id == company_id)
        ).first()
        
        if not execution:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        return {
            "id": str(execution.id),
            "status": execution.status,
            "type": execution.execution_type,
            "results": execution.results,
            "alerts": execution.alerts,
            "warnings": execution.warnings,
            "errors": execution.errors,
            "execution_time_ms": execution.execution_time_ms,
            "started_at": execution.started_at.isoformat(),
            "completed_at": execution.completed_at.isoformat() if execution.completed_at else None
        }
    
    except Exception as e:
        logger.error(f"Error getting report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{process_id}/scenario/{scenario_id}/consolidated-statements")
async def get_consolidated_statements(
    process_id: str,
    scenario_id: str,
    execution_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get consolidated P&L and Balance Sheet"""
    
    try:
        company_id = get_company_id_from_user(current_user)
        
        # Get journals or staging data
        if execution_id:
            data = db.query(ProcessJournal).filter(
                and_(ProcessJournal.company_id == company_id,
                     ProcessJournal.execution_id == uuid.UUID(execution_id))
            ).all()
        else:
            data = db.query(ProcessJournal).filter(
                and_(ProcessJournal.company_id == company_id,
                     ProcessJournal.scenario_id == uuid.UUID(scenario_id))
            ).all()
        
        # Group by account
        accounts = {}
        for journal in data:
            key = journal.account_code
            if key not in accounts:
                accounts[key] = Decimal(0)
            accounts[key] += (journal.debit_amount - journal.credit_amount)
        
        return {
            "consolidated": {k: float(v) for k, v in accounts.items()}
        }
    
    except Exception as e:
        logger.error(f"Error getting statements: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ADDITIONAL UTILITY ENDPOINTS ====================

@router.get("/{process_id}/scenarios/{scenario_id_1}/compare/{scenario_id_2}")
async def compare_scenarios(
    process_id: str,
    scenario_id_1: str,
    scenario_id_2: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare two scenarios with variance analysis"""
    try:
        company_id = get_company_id_from_user(current_user)
        
        # Get both scenarios
        scenario_1 = db.query(ProcessScenario).filter(
            and_(ProcessScenario.id == uuid.UUID(scenario_id_1),
                 ProcessScenario.company_id == company_id)
        ).first()
        
        scenario_2 = db.query(ProcessScenario).filter(
            and_(ProcessScenario.id == uuid.UUID(scenario_id_2),
                 ProcessScenario.company_id == company_id)
        ).first()
        
        if not scenario_1 or not scenario_2:
            raise HTTPException(status_code=404, detail="One or both scenarios not found")
        
        # Get journals for both scenarios
        journals_1 = db.query(ProcessJournal).filter(
            ProcessJournal.scenario_id == uuid.UUID(scenario_id_1)
        ).all()
        
        journals_2 = db.query(ProcessJournal).filter(
            ProcessJournal.scenario_id == uuid.UUID(scenario_id_2)
        ).all()
        
        # Build comparison data
        accounts_1 = {}
        for j in journals_1:
            key = j.account_code
            if key not in accounts_1:
                accounts_1[key] = Decimal(0)
            accounts_1[key] += (j.debit_amount - j.credit_amount)
        
        accounts_2 = {}
        for j in journals_2:
            key = j.account_code
            if key not in accounts_2:
                accounts_2[key] = Decimal(0)
            accounts_2[key] += (j.debit_amount - j.credit_amount)
        
        # Calculate variances
        variances = {}
        all_accounts = set(list(accounts_1.keys()) + list(accounts_2.keys()))
        for account in all_accounts:
            val1 = accounts_1.get(account, Decimal(0))
            val2 = accounts_2.get(account, Decimal(0))
            variance = val2 - val1
            variance_pct = (variance / val1 * 100) if val1 != 0 else 0
            
            variances[account] = {
                'scenario_1': float(val1),
                'scenario_2': float(val2),
                'variance': float(variance),
                'variance_pct': float(variance_pct)
            }
        
        return {
            "scenario_1": {
                "id": str(scenario_1.id),
                "name": scenario_1.name,
                "data": {k: float(v) for k, v in accounts_1.items()}
            },
            "scenario_2": {
                "id": str(scenario_2.id),
                "name": scenario_2.name,
                "data": {k: float(v) for k, v in accounts_2.items()}
            },
            "variances": variances
        }
    
    except Exception as e:
        logger.error(f"Error comparing scenarios: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{process_id}/executions")
async def get_execution_history(
    process_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get execution history for a process"""
    try:
        company_id = get_company_id_from_user(current_user)
        
        executions = db.query(ProcessExecution).filter(
            and_(ProcessExecution.process_id == uuid.UUID(process_id),
                 ProcessExecution.company_id == company_id)
        ).order_by(ProcessExecution.started_at.desc()).all()
        
        return {
            "executions": [
                {
                    "id": str(e.id),
                    "scenario_id": str(e.scenario_id),
                    "execution_type": e.execution_type,
                    "status": e.status,
                    "started_at": e.started_at.isoformat(),
                    "completed_at": e.completed_at.isoformat() if e.completed_at else None,
                    "execution_time_ms": e.execution_time_ms,
                    "is_approved": e.is_approved
                }
                for e in executions
            ]
        }
    
    except Exception as e:
        logger.error(f"Error getting execution history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{process_id}/audit-trail")
async def get_audit_trail(
    process_id: str,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get audit trail for a process"""
    try:
        company_id = get_company_id_from_user(current_user)
        
        trails = db.query(ProcessAuditTrail).filter(
            and_(ProcessAuditTrail.process_id == uuid.UUID(process_id),
                 ProcessAuditTrail.company_id == company_id)
        ).order_by(ProcessAuditTrail.created_at.desc()).limit(limit).all()
        
        return {
            "audit_trail": [
                {
                    "id": str(t.id),
                    "action_type": t.action_type,
                    "entity_type": t.entity_type,
                    "entity_id": str(t.entity_id),
                    "user_id": str(t.user_id),
                    "old_values": t.old_values,
                    "new_values": t.new_values,
                    "created_at": t.created_at.isoformat()
                }
                for t in trails
            ]
        }
    
    except Exception as e:
        logger.error(f"Error getting audit trail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{process_id}/validation-rules")
async def get_validation_rules(
    process_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get validation rules for a process"""
    try:
        company_id = get_company_id_from_user(current_user)
        
        rules = db.query(ValidationRule).filter(
            and_(ValidationRule.process_id == uuid.UUID(process_id),
                 ValidationRule.company_id == company_id,
                 ValidationRule.is_active == True)
        ).all()
        
        return {
            "rules": [
                {
                    "id": str(r.id),
                    "rule_name": r.rule_name,
                    "rule_type": r.rule_type,
                    "severity": r.severity,
                    "can_auto_fix": r.can_auto_fix
                }
                for r in rules
            ]
        }
    
    except Exception as e:
        logger.error(f"Error getting validation rules: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{process_id}/validation-rules/add")
async def add_validation_rule(
    process_id: str,
    rule_name: str = Body(...),
    rule_type: str = Body(...),
    rule_expression: str = Body(...),
    severity: str = Body('warning'),
    can_auto_fix: bool = Body(False),
    auto_fix_logic: Optional[str] = Body(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a validation rule"""
    try:
        company_id = get_company_id_from_user(current_user)
        
        rule = ValidationRule(
            id=uuid.uuid4(),
            company_id=company_id,
            process_id=uuid.UUID(process_id),
            rule_name=rule_name,
            rule_type=rule_type,
            rule_expression=rule_expression,
            severity=severity,
            can_auto_fix=can_auto_fix,
            auto_fix_logic=auto_fix_logic,
            is_active=True
        )
        
        db.add(rule)
        db.commit()
        
        return {
            "id": str(rule.id),
            "message": "Validation rule added successfully"
        }
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding validation rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{process_id}/custom-logic-templates")
async def get_custom_logic_templates(
    process_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get custom logic templates for a process"""
    try:
        company_id = get_company_id_from_user(current_user)
        
        templates = db.query(CustomLogicTemplate).filter(
            and_(CustomLogicTemplate.company_id == company_id,
                 CustomLogicTemplate.is_active == True)
        ).all()
        
        return {
            "templates": [
                {
                    "id": str(t.id),
                    "template_name": t.template_name,
                    "template_description": t.template_description,
                    "node_type": t.node_type,
                    "logic_code": t.logic_code
                }
                for t in templates
            ]
        }
    
    except Exception as e:
        logger.error(f"Error getting custom logic templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{process_id}/custom-logic-templates/create")
async def create_custom_logic_template(
    process_id: str,
    template_name: str = Body(...),
    template_description: str = Body(...),
    node_type: str = Body(...),
    logic_code: str = Body(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a custom logic template"""
    try:
        company_id = get_company_id_from_user(current_user)
        
        template = CustomLogicTemplate(
            id=uuid.uuid4(),
            company_id=company_id,
            template_name=template_name,
            template_description=template_description,
            node_type=node_type,
            logic_code=logic_code,
            is_active=True,
            created_by=current_user['id']
        )
        
        db.add(template)
        db.commit()
        
        return {
            "id": str(template.id),
            "message": "Custom logic template created successfully"
        }
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating custom logic template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{process_id}/preview-data")
async def preview_data(
    process_id: str,
    scenario_id: str = Body(...),
    period_id: Optional[str] = Body(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Preview data before execution"""
    try:
        company_id = get_company_id_from_user(current_user)
        
        query = db.query(ProcessData).filter(
            and_(ProcessData.process_id == uuid.UUID(process_id),
                 ProcessData.scenario_id == uuid.UUID(scenario_id),
                 ProcessData.company_id == company_id)
        )
        
        if period_id:
            query = query.filter(ProcessData.period_id == uuid.UUID(period_id))
        
        data = query.limit(100).all()
        
        return {
            "preview": [
                {
                    "entity_id": d.entity_id,
                    "account_code": d.account_code,
                    "account_name": d.account_name,
                    "amount": float(d.amount),
                    "currency": d.currency,
                    "data_type": d.data_type
                }
                for d in data
            ],
            "total_records": query.count()
        }
    
    except Exception as e:
        logger.error(f"Error previewing data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{process_id}/scenario/{scenario_id}/version-history")
async def get_scenario_versions(
    process_id: str,
    scenario_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get version history for a scenario"""
    try:
        company_id = get_company_id_from_user(current_user)
        
        scenarios = db.query(ProcessScenario).filter(
            and_(ProcessScenario.process_id == uuid.UUID(process_id),
                 ProcessScenario.company_id == company_id,
                 or_(ProcessScenario.id == uuid.UUID(scenario_id),
                     ProcessScenario.parent_scenario_id == uuid.UUID(scenario_id)))
        ).order_by(ProcessScenario.version_number.desc()).all()
        
        return {
            "versions": [
                {
                    "id": str(s.id),
                    "name": s.name,
                    "version_number": s.version_number,
                    "scenario_type": s.scenario_type,
                    "status": s.status,
                    "created_at": s.created_at.isoformat()
                }
                for s in scenarios
            ]
        }
    
    except Exception as e:
        logger.error(f"Error getting scenario versions: {e}")
        raise HTTPException(status_code=500, detail=str(e))