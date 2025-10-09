from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
import psycopg2
import os
import json

router = APIRouter(prefix="/fst", tags=["Financial Statement Templates"])

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

class FSTTemplate(BaseModel):
    template_name: str
    template_type: str
    description: Optional[str] = None

class FSTElement(BaseModel):
    element_name: str
    element_type: str
    calculation_formula: Optional[str] = None
    account_mapping: Optional[dict] = None
    display_order: Optional[int] = None

@router.get("/templates")
def get_fst_templates(company_name: str = Query(...)):
    """Get FST templates for current company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            cur.execute("""
                SELECT id, template_name, template_type, description, is_active, created_at
                FROM fst_templates
                WHERE is_active = TRUE
                ORDER BY template_name
            """)
            
            templates = []
            for row in cur.fetchall():
                template_id, name, template_type, description, is_active, created_at = row
                templates.append({
                    "id": template_id,
                    "template_name": name,
                    "template_type": template_type,
                    "description": description,
                    "is_active": is_active,
                    "created_at": created_at.isoformat() if created_at else None
                })
            
            cur.close()
            conn.close()
            
            return {"templates": templates}
            
        except psycopg2.OperationalError:
            # Return sample templates if database doesn't exist
            sample_templates = [
                {
                    "id": 1,
                    "template_name": "Balance Sheet - IFRS",
                    "template_type": "Balance Sheet",
                    "description": "Standard IFRS Balance Sheet template",
                    "is_active": True,
                    "created_at": "2024-01-01T00:00:00"
                },
                {
                    "id": 2,
                    "template_name": "Income Statement - IFRS",
                    "template_type": "Income Statement",
                    "description": "Standard IFRS Income Statement template",
                    "is_active": True,
                    "created_at": "2024-01-01T00:00:00"
                },
                {
                    "id": 3,
                    "template_name": "Cash Flow Statement",
                    "template_type": "Cash Flow",
                    "description": "Standard Cash Flow Statement template",
                    "is_active": True,
                    "created_at": "2024-01-01T00:00:00"
                }
            ]
            return {"templates": sample_templates}
            
    except Exception as e:
        print(f"Error getting FST templates: {e}")
        return {"templates": []}

@router.post("/templates")
def create_fst_template(template: FSTTemplate, company_name: str = Query(...)):
    """Create a new FST template"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO fst_templates (template_name, template_type, description, is_active, created_at)
            VALUES (%s, %s, %s, TRUE, CURRENT_TIMESTAMP)
            RETURNING id
        """, (template.template_name, template.template_type, template.description))
        
        template_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "FST template created successfully",
            "template_id": template_id
        }
        
    except Exception as e:
        print(f"Error creating FST template: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create template: {str(e)}")

@router.get("/templates/{template_id}/elements")
def get_fst_elements(template_id: int, company_name: str = Query(...)):
    """Get elements for a specific FST template"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            cur.execute("""
                SELECT id, element_name, element_type, calculation_formula, 
                       account_mapping, display_order, created_at
                FROM fst_elements
                WHERE template_id = %s
                ORDER BY display_order, element_name
            """, (template_id,))
            
            elements = []
            for row in cur.fetchall():
                element_id, name, element_type, formula, mapping, order, created_at = row
                elements.append({
                    "id": element_id,
                    "element_name": name,
                    "element_type": element_type,
                    "calculation_formula": formula,
                    "account_mapping": mapping,
                    "display_order": order,
                    "created_at": created_at.isoformat() if created_at else None
                })
            
            cur.close()
            conn.close()
            
            return {"elements": elements}
            
        except psycopg2.OperationalError:
            # Return sample elements if database doesn't exist
            sample_elements = [
                {
                    "id": "element_001",
                    "element_name": "Current Assets",
                    "element_type": "Line Item",
                    "calculation_formula": "SUM(1000:1999)",
                    "account_mapping": {"accounts": ["1000", "1100", "1200"]},
                    "display_order": 1,
                    "created_at": "2024-01-01T00:00:00"
                },
                {
                    "id": "element_002",
                    "element_name": "Non-Current Assets",
                    "element_type": "Line Item",
                    "calculation_formula": "SUM(2000:2999)",
                    "account_mapping": {"accounts": ["2000", "2100", "2200"]},
                    "display_order": 2,
                    "created_at": "2024-01-01T00:00:00"
                }
            ]
            return {"elements": sample_elements}
            
    except Exception as e:
        print(f"Error getting FST elements: {e}")
        return {"elements": []}

@router.get("/hierarchies")
def get_fst_hierarchies(company_name: str = Query(...)):
    """Get FST hierarchies for current company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            cur.execute("""
                SELECT hierarchy_id, hierarchy_name, hierarchy_type, description, 
                       parent_hierarchy_id, level_number, created_at
                FROM hierarchies
                WHERE hierarchy_type = 'FST'
                ORDER BY level_number, hierarchy_name
            """)
            
            hierarchies = []
            for row in cur.fetchall():
                h_id, name, h_type, desc, parent_id, level, created_at = row
                hierarchies.append({
                    "hierarchy_id": h_id,
                    "hierarchy_name": name,
                    "hierarchy_type": h_type,
                    "description": desc,
                    "parent_hierarchy_id": parent_id,
                    "level_number": level,
                    "created_at": created_at.isoformat() if created_at else None
                })
            
            cur.close()
            conn.close()
            
            return {"hierarchies": hierarchies}
            
        except psycopg2.OperationalError:
            # Return sample hierarchies if database doesn't exist
            sample_hierarchies = [
                {
                    "hierarchy_id": "FST_001",
                    "hierarchy_name": "Balance Sheet Structure",
                    "hierarchy_type": "FST",
                    "description": "Balance Sheet hierarchical structure",
                    "parent_hierarchy_id": None,
                    "level_number": 1,
                    "created_at": "2024-01-01T00:00:00"
                },
                {
                    "hierarchy_id": "FST_002",
                    "hierarchy_name": "Income Statement Structure",
                    "hierarchy_type": "FST",
                    "description": "Income Statement hierarchical structure",
                    "parent_hierarchy_id": None,
                    "level_number": 1,
                    "created_at": "2024-01-01T00:00:00"
                }
            ]
            return {"hierarchies": sample_hierarchies}
            
    except Exception as e:
        print(f"Error getting FST hierarchies: {e}")
        return {"hierarchies": []}
