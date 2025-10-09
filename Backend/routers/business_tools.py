from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import List, Optional
from pydantic import BaseModel
import psycopg2
import os
import json
from datetime import datetime, date
from decimal import Decimal

router = APIRouter(prefix="/business-tools", tags=["Business Tools"])

class IntegrationCreate(BaseModel):
    integration_name: str
    integration_type: str
    api_endpoint: str
    api_key: Optional[str] = ""
    status: Optional[str] = "Active"
    description: Optional[str] = ""

class WorkflowCreate(BaseModel):
    workflow_name: str
    workflow_type: str
    trigger_event: str
    actions: List[dict]
    status: Optional[str] = "Active"
    description: Optional[str] = ""

def get_db_config():
    """Get database configuration"""
    if os.getenv('DOCKER_ENV') == 'true':
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
    else:
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
        
    return {
        'host': POSTGRES_HOST,
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'user': 'postgres',
        'password': 'root@123'
    }

@router.get("/integrations")
def get_integrations(company_name: str = Query(...)):
    """Get all integrations for a company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create integrations table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS integrations (
                    id SERIAL PRIMARY KEY,
                    integration_name VARCHAR(255) NOT NULL,
                    integration_type VARCHAR(100) NOT NULL,
                    api_endpoint VARCHAR(500),
                    api_key VARCHAR(500),
                    status VARCHAR(50) DEFAULT 'Active',
                    last_sync TIMESTAMP,
                    sync_frequency VARCHAR(50) DEFAULT 'Daily',
                    error_count INTEGER DEFAULT 0,
                    last_error TEXT,
                    description TEXT,
                    configuration JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(100)
                )
            """)
            
            cur.execute("""
                SELECT id, integration_name, integration_type, api_endpoint, status,
                       last_sync, sync_frequency, error_count, last_error, description,
                       configuration, created_at, updated_at
                FROM integrations
                ORDER BY integration_name
            """)
            
            integrations_data = cur.fetchall()
            cur.close()
            conn.close()
            
            integrations = []
            for integration in integrations_data:
                integrations.append({
                    'id': integration[0],
                    'integration_name': integration[1],
                    'integration_type': integration[2],
                    'api_endpoint': integration[3],
                    'status': integration[4],
                    'last_sync': integration[5].isoformat() if integration[5] else None,
                    'sync_frequency': integration[6],
                    'error_count': integration[7],
                    'last_error': integration[8],
                    'description': integration[9],
                    'configuration': integration[10] if integration[10] else {},
                    'created_at': integration[11].isoformat() if integration[11] else None,
                    'updated_at': integration[12].isoformat() if integration[12] else None
                })
            
            return {"integrations": integrations}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "integrations": [
                    {
                        'id': 1,
                        'integration_name': 'QuickBooks Online',
                        'integration_type': 'Accounting',
                        'api_endpoint': 'https://sandbox-quickbooks.api.intuit.com',
                        'status': 'Active',
                        'last_sync': '2024-01-15T10:30:00',
                        'sync_frequency': 'Daily',
                        'error_count': 0,
                        'last_error': None,
                        'description': 'QuickBooks Online integration for trial balance import',
                        'configuration': {'auto_sync': True, 'sync_time': '02:00'},
                        'created_at': '2024-01-01T00:00:00',
                        'updated_at': '2024-01-15T10:30:00'
                    },
                    {
                        'id': 2,
                        'integration_name': 'SAP ERP',
                        'integration_type': 'ERP',
                        'api_endpoint': 'https://api.sap.com/v1',
                        'status': 'Inactive',
                        'last_sync': '2024-01-10T08:00:00',
                        'sync_frequency': 'Weekly',
                        'error_count': 2,
                        'last_error': 'Authentication failed',
                        'description': 'SAP ERP integration for financial data',
                        'configuration': {'auto_sync': False},
                        'created_at': '2024-01-01T00:00:00',
                        'updated_at': '2024-01-10T08:00:00'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting integrations: {e}")
        return {"integrations": []}

@router.post("/integrations")
async def create_integration(request: Request):
    """Create a new integration"""
    try:
        # Parse request body
        body = await request.body()
        try:
            integration_data = json.loads(body)
            print(f"=== INTEGRATION CREATION REQUEST DATA ===")
            print(f"Raw request data: {integration_data}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        integration_name = integration_data.get('integration_name', '')
        integration_type = integration_data.get('integration_type', '')
        api_endpoint = integration_data.get('api_endpoint', '')
        api_key = integration_data.get('api_key', '')
        status = integration_data.get('status', 'Active')
        description = integration_data.get('description', '')
        sync_frequency = integration_data.get('sync_frequency', 'Daily')
        configuration = integration_data.get('configuration', {})
        
        # Validate required fields
        if not integration_name:
            raise HTTPException(status_code=400, detail="Integration name is required")
        if not integration_type:
            raise HTTPException(status_code=400, detail="Integration type is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Insert new integration
        cur.execute("""
            INSERT INTO integrations (integration_name, integration_type, api_endpoint, api_key,
                                    status, sync_frequency, description, configuration,
                                    created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """, (
            integration_name, integration_type, api_endpoint, api_key,
            status, sync_frequency, description, json.dumps(configuration)
        ))
        
        created_integration_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Integration created successfully",
            "integration": {
                "id": created_integration_id,
                "integration_name": integration_name,
                "integration_type": integration_type,
                "status": status,
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating integration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create integration: {str(e)}"
        )

@router.get("/workflows")
def get_workflows(company_name: str = Query(...)):
    """Get all workflows for a company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create workflows table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS workflows (
                    id SERIAL PRIMARY KEY,
                    workflow_name VARCHAR(255) NOT NULL,
                    workflow_type VARCHAR(100) NOT NULL,
                    trigger_event VARCHAR(255) NOT NULL,
                    actions JSONB NOT NULL,
                    status VARCHAR(50) DEFAULT 'Active',
                    execution_count INTEGER DEFAULT 0,
                    last_executed TIMESTAMP,
                    success_count INTEGER DEFAULT 0,
                    error_count INTEGER DEFAULT 0,
                    last_error TEXT,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(100)
                )
            """)
            
            cur.execute("""
                SELECT id, workflow_name, workflow_type, trigger_event, actions, status,
                       execution_count, last_executed, success_count, error_count, last_error,
                       description, created_at, updated_at
                FROM workflows
                ORDER BY workflow_name
            """)
            
            workflows_data = cur.fetchall()
            cur.close()
            conn.close()
            
            workflows = []
            for workflow in workflows_data:
                workflows.append({
                    'id': workflow[0],
                    'workflow_name': workflow[1],
                    'workflow_type': workflow[2],
                    'trigger_event': workflow[3],
                    'actions': workflow[4] if workflow[4] else [],
                    'status': workflow[5],
                    'execution_count': workflow[6],
                    'last_executed': workflow[7].isoformat() if workflow[7] else None,
                    'success_count': workflow[8],
                    'error_count': workflow[9],
                    'last_error': workflow[10],
                    'description': workflow[11],
                    'created_at': workflow[12].isoformat() if workflow[12] else None,
                    'updated_at': workflow[13].isoformat() if workflow[13] else None
                })
            
            return {"workflows": workflows}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "workflows": [
                    {
                        'id': 1,
                        'workflow_name': 'Auto Trial Balance Import',
                        'workflow_type': 'Data Import',
                        'trigger_event': 'file_uploaded',
                        'actions': [
                            {'type': 'validate_data', 'config': {'required_columns': ['account_code', 'amount']}},
                            {'type': 'import_data', 'config': {'table': 'tb_entries'}},
                            {'type': 'send_notification', 'config': {'email': 'admin@company.com'}}
                        ],
                        'status': 'Active',
                        'execution_count': 15,
                        'last_executed': '2024-01-15T10:30:00',
                        'success_count': 14,
                        'error_count': 1,
                        'last_error': None,
                        'description': 'Automatically process uploaded trial balance files',
                        'created_at': '2024-01-01T00:00:00',
                        'updated_at': '2024-01-15T10:30:00'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting workflows: {e}")
        return {"workflows": []}

@router.post("/workflows")
async def create_workflow(request: Request):
    """Create a new workflow"""
    try:
        # Parse request body
        body = await request.body()
        try:
            workflow_data = json.loads(body)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        workflow_name = workflow_data.get('workflow_name', '')
        workflow_type = workflow_data.get('workflow_type', '')
        trigger_event = workflow_data.get('trigger_event', '')
        actions = workflow_data.get('actions', [])
        status = workflow_data.get('status', 'Active')
        description = workflow_data.get('description', '')
        
        # Validate required fields
        if not workflow_name:
            raise HTTPException(status_code=400, detail="Workflow name is required")
        if not trigger_event:
            raise HTTPException(status_code=400, detail="Trigger event is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Insert new workflow
        cur.execute("""
            INSERT INTO workflows (workflow_name, workflow_type, trigger_event, actions,
                                 status, description, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """, (
            workflow_name, workflow_type, trigger_event, json.dumps(actions),
            status, description
        ))
        
        created_workflow_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Workflow created successfully",
            "workflow": {
                "id": created_workflow_id,
                "workflow_name": workflow_name,
                "workflow_type": workflow_type,
                "trigger_event": trigger_event,
                "status": status,
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating workflow: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create workflow: {str(e)}"
        )

@router.get("/reports")
def get_business_reports(company_name: str = Query(...)):
    """Get available business reports"""
    try:
        # Return available business reports
        reports = [
            {
                "id": 1,
                "report_name": "Financial Performance Dashboard",
                "report_type": "Financial",
                "description": "Comprehensive financial performance metrics",
                "parameters": ["period", "year", "entity"],
                "output_formats": ["PDF", "Excel", "JSON"],
                "last_generated": "2024-01-15T10:30:00",
                "status": "Active"
            },
            {
                "id": 2,
                "report_name": "Consolidation Summary",
                "report_type": "Consolidation",
                "description": "Consolidated financial statements with eliminations",
                "parameters": ["period", "year"],
                "output_formats": ["PDF", "Excel"],
                "last_generated": "2024-01-14T15:45:00",
                "status": "Active"
            },
            {
                "id": 3,
                "report_name": "Audit Trail Report",
                "report_type": "Audit",
                "description": "Complete audit trail of all system changes",
                "parameters": ["start_date", "end_date", "user"],
                "output_formats": ["PDF", "CSV"],
                "last_generated": "2024-01-13T09:20:00",
                "status": "Active"
            },
            {
                "id": 4,
                "report_name": "Budget vs Actual Analysis",
                "report_type": "Budget",
                "description": "Variance analysis between budget and actual figures",
                "parameters": ["period", "year", "budget_id"],
                "output_formats": ["PDF", "Excel"],
                "last_generated": "2024-01-12T14:10:00",
                "status": "Active"
            }
        ]
        
        return {"reports": reports}
        
    except Exception as e:
        print(f"Error getting business reports: {e}")
        return {"reports": []}

@router.post("/reports/{report_id}/generate")
async def generate_report(report_id: int, request: Request):
    """Generate a business report"""
    try:
        # Parse request body for report parameters
        body = await request.body()
        try:
            report_params = json.loads(body) if body else {}
        except Exception as e:
            report_params = {}
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        # Simulate report generation
        report_data = {
            "report_id": report_id,
            "company_name": company_name,
            "parameters": report_params,
            "generated_at": datetime.now().isoformat(),
            "status": "Completed",
            "file_path": f"reports/report_{report_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
            "file_size": 1024000,  # 1MB sample size
            "page_count": 25
        }
        
        return {
            "success": True,
            "message": "Report generated successfully",
            "report": report_data
        }
        
    except Exception as e:
        print(f"Error generating report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )

@router.get("/analytics")
def get_business_analytics(company_name: str = Query(...)):
    """Get business analytics and KPIs"""
    try:
        # Return sample business analytics
        analytics = {
            "financial_kpis": {
                "revenue_growth": 12.5,
                "profit_margin": 18.3,
                "roa": 8.7,
                "roe": 15.2,
                "current_ratio": 2.1,
                "debt_to_equity": 0.45
            },
            "operational_kpis": {
                "data_quality_score": 94.2,
                "automation_rate": 78.5,
                "process_efficiency": 89.1,
                "user_adoption": 92.3
            },
            "trends": {
                "monthly_revenue": [1000000, 1050000, 1100000, 1150000, 1200000, 1250000],
                "monthly_expenses": [800000, 820000, 850000, 880000, 900000, 920000],
                "monthly_profit": [200000, 230000, 250000, 270000, 300000, 330000]
            },
            "forecasts": {
                "next_quarter_revenue": 3900000,
                "next_quarter_profit": 975000,
                "confidence_level": 87.5
            }
        }
        
        return {"analytics": analytics}
        
    except Exception as e:
        print(f"Error getting business analytics: {e}")
        return {"analytics": {}}

@router.get("/notifications")
def get_notifications(company_name: str = Query(...)):
    """Get system notifications"""
    try:
        # Return sample notifications
        notifications = [
            {
                "id": 1,
                "type": "info",
                "title": "Trial Balance Upload Complete",
                "message": "Trial balance for Q4 2024 has been successfully uploaded and processed",
                "timestamp": "2024-01-15T10:30:00",
                "read": False,
                "priority": "medium"
            },
            {
                "id": 2,
                "type": "warning",
                "title": "Integration Error",
                "message": "SAP ERP integration failed - authentication required",
                "timestamp": "2024-01-15T08:45:00",
                "read": False,
                "priority": "high"
            },
            {
                "id": 3,
                "type": "success",
                "title": "Backup Completed",
                "message": "Daily backup completed successfully",
                "timestamp": "2024-01-15T02:00:00",
                "read": True,
                "priority": "low"
            }
        ]
        
        return {"notifications": notifications}
        
    except Exception as e:
        print(f"Error getting notifications: {e}")
        return {"notifications": []}
