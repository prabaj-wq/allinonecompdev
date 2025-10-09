from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import List, Optional
from pydantic import BaseModel
import psycopg2
import os
import json
from datetime import datetime, date
from decimal import Decimal

router = APIRouter(prefix="/audit", tags=["Audit Management"])

class AuditCreate(BaseModel):
    audit_name: str
    audit_type: str
    period: str
    year: str
    auditor_name: Optional[str] = ""
    status: Optional[str] = "Planning"
    description: Optional[str] = ""

class MaterialityCreate(BaseModel):
    materiality_type: str
    base_amount: float
    percentage: float
    calculated_amount: float
    period: str
    year: str
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

@router.get("/")
def get_audits(company_name: str = Query(...)):
    """Get all audits for a company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create audits table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS audits (
                    id SERIAL PRIMARY KEY,
                    audit_name VARCHAR(255) NOT NULL,
                    audit_type VARCHAR(100) NOT NULL,
                    period VARCHAR(50) NOT NULL,
                    year VARCHAR(10) NOT NULL,
                    auditor_name VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'Planning',
                    start_date DATE,
                    end_date DATE,
                    description TEXT,
                    findings JSONB,
                    recommendations JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(100)
                )
            """)
            
            cur.execute("""
                SELECT id, audit_name, audit_type, period, year, auditor_name, status,
                       start_date, end_date, description, findings, recommendations,
                       created_at, updated_at, created_by
                FROM audits
                ORDER BY created_at DESC
            """)
            
            audits_data = cur.fetchall()
            cur.close()
            conn.close()
            
            audits = []
            for audit in audits_data:
                audits.append({
                    'id': audit[0],
                    'audit_name': audit[1],
                    'audit_type': audit[2],
                    'period': audit[3],
                    'year': audit[4],
                    'auditor_name': audit[5],
                    'status': audit[6],
                    'start_date': audit[7].isoformat() if audit[7] else None,
                    'end_date': audit[8].isoformat() if audit[8] else None,
                    'description': audit[9],
                    'findings': audit[10] if audit[10] else [],
                    'recommendations': audit[11] if audit[11] else [],
                    'created_at': audit[12].isoformat() if audit[12] else None,
                    'updated_at': audit[13].isoformat() if audit[13] else None,
                    'created_by': audit[14]
                })
            
            return {"audits": audits}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "audits": [
                    {
                        'id': 1,
                        'audit_name': 'Year-End Financial Audit 2024',
                        'audit_type': 'Financial',
                        'period': 'Q4',
                        'year': '2024',
                        'auditor_name': 'KPMG',
                        'status': 'In Progress',
                        'start_date': '2024-12-01',
                        'end_date': '2024-12-31',
                        'description': 'Annual financial statement audit',
                        'findings': [],
                        'recommendations': [],
                        'created_at': '2024-12-01T00:00:00',
                        'updated_at': '2024-12-01T00:00:00',
                        'created_by': 'admin'
                    },
                    {
                        'id': 2,
                        'audit_name': 'Internal Controls Review',
                        'audit_type': 'Internal',
                        'period': 'Q3',
                        'year': '2024',
                        'auditor_name': 'Internal Audit Team',
                        'status': 'Completed',
                        'start_date': '2024-09-01',
                        'end_date': '2024-09-30',
                        'description': 'Review of internal control systems',
                        'findings': [],
                        'recommendations': [],
                        'created_at': '2024-09-01T00:00:00',
                        'updated_at': '2024-09-30T00:00:00',
                        'created_by': 'admin'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting audits: {e}")
        return {"audits": []}

@router.post("/")
async def create_audit(request: Request):
    """Create a new audit"""
    try:
        # Parse request body
        body = await request.body()
        try:
            audit_data = json.loads(body)
            print(f"=== AUDIT CREATION REQUEST DATA ===")
            print(f"Raw request data: {audit_data}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        audit_name = audit_data.get('audit_name', '')
        audit_type = audit_data.get('audit_type', '')
        period = audit_data.get('period', '')
        year = audit_data.get('year', '')
        auditor_name = audit_data.get('auditor_name', '')
        status = audit_data.get('status', 'Planning')
        description = audit_data.get('description', '')
        start_date = audit_data.get('start_date', None)
        end_date = audit_data.get('end_date', None)
        
        # Validate required fields
        if not audit_name:
            raise HTTPException(status_code=400, detail="Audit name is required")
        if not audit_type:
            raise HTTPException(status_code=400, detail="Audit type is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Insert new audit
        cur.execute("""
            INSERT INTO audits (audit_name, audit_type, period, year, auditor_name, status,
                              start_date, end_date, description, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """, (
            audit_name, audit_type, period, year, auditor_name, status,
            start_date, end_date, description
        ))
        
        created_audit_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Audit created successfully",
            "audit": {
                "id": created_audit_id,
                "audit_name": audit_name,
                "audit_type": audit_type,
                "period": period,
                "year": year,
                "status": status,
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating audit: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create audit: {str(e)}"
        )

@router.get("/materiality")
def get_materiality(company_name: str = Query(...), period: str = Query(...), year: str = Query(...)):
    """Get materiality calculations"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create materiality table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS audit_materiality (
                    id SERIAL PRIMARY KEY,
                    materiality_type VARCHAR(100) NOT NULL,
                    base_amount DECIMAL(15,2) NOT NULL,
                    percentage DECIMAL(5,2) NOT NULL,
                    calculated_amount DECIMAL(15,2) NOT NULL,
                    period VARCHAR(50) NOT NULL,
                    year VARCHAR(10) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(100)
                )
            """)
            
            cur.execute("""
                SELECT id, materiality_type, base_amount, percentage, calculated_amount,
                       period, year, description, created_at, updated_at
                FROM audit_materiality
                WHERE period = %s AND year = %s
                ORDER BY materiality_type
            """, (period, year))
            
            materiality_data = cur.fetchall()
            cur.close()
            conn.close()
            
            materiality = []
            for mat in materiality_data:
                materiality.append({
                    'id': mat[0],
                    'materiality_type': mat[1],
                    'base_amount': float(mat[2]) if mat[2] else 0,
                    'percentage': float(mat[3]) if mat[3] else 0,
                    'calculated_amount': float(mat[4]) if mat[4] else 0,
                    'period': mat[5],
                    'year': mat[6],
                    'description': mat[7],
                    'created_at': mat[8].isoformat() if mat[8] else None,
                    'updated_at': mat[9].isoformat() if mat[9] else None
                })
            
            return {"materiality": materiality}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "materiality": [
                    {
                        'id': 1,
                        'materiality_type': 'Overall Materiality',
                        'base_amount': 10000000,
                        'percentage': 5.0,
                        'calculated_amount': 500000,
                        'period': period,
                        'year': year,
                        'description': 'Overall materiality based on total assets',
                        'created_at': '2024-01-01T00:00:00',
                        'updated_at': '2024-01-01T00:00:00'
                    },
                    {
                        'id': 2,
                        'materiality_type': 'Performance Materiality',
                        'base_amount': 500000,
                        'percentage': 75.0,
                        'calculated_amount': 375000,
                        'period': period,
                        'year': year,
                        'description': 'Performance materiality (75% of overall)',
                        'created_at': '2024-01-01T00:00:00',
                        'updated_at': '2024-01-01T00:00:00'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting materiality: {e}")
        return {"materiality": []}

@router.post("/materiality")
async def create_materiality(request: Request):
    """Create materiality calculation"""
    try:
        # Parse request body
        body = await request.body()
        try:
            mat_data = json.loads(body)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        materiality_type = mat_data.get('materiality_type', '')
        base_amount = float(mat_data.get('base_amount', 0))
        percentage = float(mat_data.get('percentage', 0))
        calculated_amount = float(mat_data.get('calculated_amount', 0))
        period = mat_data.get('period', '')
        year = mat_data.get('year', '')
        description = mat_data.get('description', '')
        
        # Validate required fields
        if not materiality_type:
            raise HTTPException(status_code=400, detail="Materiality type is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Insert new materiality calculation
        cur.execute("""
            INSERT INTO audit_materiality (materiality_type, base_amount, percentage, calculated_amount,
                                         period, year, description, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """, (
            materiality_type, base_amount, percentage, calculated_amount,
            period, year, description
        ))
        
        created_mat_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Materiality calculation created successfully",
            "materiality": {
                "id": created_mat_id,
                "materiality_type": materiality_type,
                "calculated_amount": calculated_amount,
                "period": period,
                "year": year,
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating materiality: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create materiality: {str(e)}"
        )

@router.get("/trail")
def get_audit_trail(company_name: str = Query(...), limit: int = Query(100)):
    """Get audit trail logs"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create audit trail table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS audit_trail (
                    id SERIAL PRIMARY KEY,
                    table_name VARCHAR(100) NOT NULL,
                    record_id VARCHAR(100) NOT NULL,
                    action VARCHAR(50) NOT NULL,
                    old_values JSONB,
                    new_values JSONB,
                    user_id VARCHAR(100),
                    user_name VARCHAR(255),
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cur.execute("""
                SELECT id, table_name, record_id, action, old_values, new_values,
                       user_id, user_name, ip_address, created_at
                FROM audit_trail
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit,))
            
            trail_data = cur.fetchall()
            cur.close()
            conn.close()
            
            trail = []
            for entry in trail_data:
                trail.append({
                    'id': entry[0],
                    'table_name': entry[1],
                    'record_id': entry[2],
                    'action': entry[3],
                    'old_values': entry[4] if entry[4] else {},
                    'new_values': entry[5] if entry[5] else {},
                    'user_id': entry[6],
                    'user_name': entry[7],
                    'ip_address': entry[8],
                    'created_at': entry[9].isoformat() if entry[9] else None
                })
            
            return {"audit_trail": trail}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "audit_trail": [
                    {
                        'id': 1,
                        'table_name': 'accounts',
                        'record_id': '1000',
                        'action': 'UPDATE',
                        'old_values': {'account_name': 'Cash'},
                        'new_values': {'account_name': 'Cash and Cash Equivalents'},
                        'user_id': '1',
                        'user_name': 'admin',
                        'ip_address': '192.168.1.100',
                        'created_at': '2024-01-15T10:30:00'
                    },
                    {
                        'id': 2,
                        'table_name': 'entities',
                        'record_id': 'ENT_001',
                        'action': 'CREATE',
                        'old_values': {},
                        'new_values': {'entity_name': 'Main Entity', 'entity_type': 'Parent'},
                        'user_id': '1',
                        'user_name': 'admin',
                        'ip_address': '192.168.1.100',
                        'created_at': '2024-01-15T09:15:00'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting audit trail: {e}")
        return {"audit_trail": []}

@router.get("/findings/{audit_id}")
def get_audit_findings(audit_id: int, company_name: str = Query(...)):
    """Get findings for a specific audit"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create audit findings table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS audit_findings (
                    id SERIAL PRIMARY KEY,
                    audit_id INTEGER NOT NULL,
                    finding_title VARCHAR(255) NOT NULL,
                    finding_type VARCHAR(100) NOT NULL,
                    severity VARCHAR(50) NOT NULL,
                    description TEXT,
                    recommendation TEXT,
                    status VARCHAR(50) DEFAULT 'Open',
                    assigned_to VARCHAR(255),
                    due_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cur.execute("""
                SELECT id, finding_title, finding_type, severity, description, recommendation,
                       status, assigned_to, due_date, created_at, updated_at
                FROM audit_findings
                WHERE audit_id = %s
                ORDER BY severity DESC, created_at DESC
            """, (audit_id,))
            
            findings_data = cur.fetchall()
            cur.close()
            conn.close()
            
            findings = []
            for finding in findings_data:
                findings.append({
                    'id': finding[0],
                    'finding_title': finding[1],
                    'finding_type': finding[2],
                    'severity': finding[3],
                    'description': finding[4],
                    'recommendation': finding[5],
                    'status': finding[6],
                    'assigned_to': finding[7],
                    'due_date': finding[8].isoformat() if finding[8] else None,
                    'created_at': finding[9].isoformat() if finding[9] else None,
                    'updated_at': finding[10].isoformat() if finding[10] else None
                })
            
            return {"findings": findings}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "findings": [
                    {
                        'id': 1,
                        'finding_title': 'Segregation of Duties',
                        'finding_type': 'Internal Control',
                        'severity': 'High',
                        'description': 'Lack of proper segregation of duties in accounts payable process',
                        'recommendation': 'Implement proper authorization levels and approval workflows',
                        'status': 'Open',
                        'assigned_to': 'Finance Manager',
                        'due_date': '2024-02-15',
                        'created_at': '2024-01-15T00:00:00',
                        'updated_at': '2024-01-15T00:00:00'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting audit findings: {e}")
        return {"findings": []}

@router.post("/findings")
async def create_audit_finding(request: Request):
    """Create a new audit finding"""
    try:
        # Parse request body
        body = await request.body()
        try:
            finding_data = json.loads(body)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        audit_id = finding_data.get('audit_id', 0)
        finding_title = finding_data.get('finding_title', '')
        finding_type = finding_data.get('finding_type', '')
        severity = finding_data.get('severity', 'Medium')
        description = finding_data.get('description', '')
        recommendation = finding_data.get('recommendation', '')
        assigned_to = finding_data.get('assigned_to', '')
        due_date = finding_data.get('due_date', None)
        
        # Validate required fields
        if not finding_title:
            raise HTTPException(status_code=400, detail="Finding title is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Insert new finding
        cur.execute("""
            INSERT INTO audit_findings (audit_id, finding_title, finding_type, severity, description,
                                      recommendation, assigned_to, due_date, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """, (
            audit_id, finding_title, finding_type, severity, description,
            recommendation, assigned_to, due_date
        ))
        
        created_finding_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Audit finding created successfully",
            "finding": {
                "id": created_finding_id,
                "finding_title": finding_title,
                "severity": severity,
                "status": "Open",
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating audit finding: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create audit finding: {str(e)}"
        )
