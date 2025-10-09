from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db, Company
# Note: Entity model moved to company-specific databases
import psycopg2
import os
import json
from datetime import datetime

router = APIRouter(prefix="/entities", tags=["Entities"])

class EntityCreate(BaseModel):
    entity_name: str
    entity_type: str
    country: Optional[str] = ""
    currency: Optional[str] = ""
    hierarchy_id: Optional[str] = None
    parent_id: Optional[str] = None

class EntityResponse(BaseModel):
    entity_code: str
    entity_name: str
    entity_type: str
    country: str
    currency: str
    hierarchy_id: Optional[str] = None

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
def get_entities(company_name: str = Query(...)):
    """Get all entities for a company"""
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
                SELECT entity_code, entity_name, entity_type, country, currency, 
                       hierarchy_id, parent_entity_id, ownership_percentage, 
                       consolidation_method, functional_currency, reporting_currency,
                       created_at
                FROM entities ORDER BY entity_code
            """)
            entities_data = cur.fetchall()
            cur.close()
            conn.close()
            
            entities = []
            for entity in entities_data:
                entities.append({
                    "entity_code": entity[0],
                    "entity_name": entity[1],
                    "entity_type": entity[2],
                    "country": entity[3],
                    "currency": entity[4],
                    "hierarchy_id": entity[5],
                    "parent_entity_id": entity[6],
                    "ownership_percentage": float(entity[7]) if entity[7] else None,
                    "consolidation_method": entity[8],
                    "functional_currency": entity[9],
                    "reporting_currency": entity[10],
                })
            
            return {"entities": entities}
            
        except psycopg2.OperationalError:
            # Return empty data if database doesn't exist - user will create their own entities
            return {"entities": []}
            
    except Exception as e:
        print(f"Error getting entities: {e}")
        # Return empty data - no demo data
        return {"entities": []}

@router.post("/")
async def create_entity(request: Request):
    """Create a new entity"""
    try:
        # Parse request body
        body = await request.body()
        try:
            entity_data = json.loads(body)
            print(f"=== ENTITY CREATION REQUEST DATA ===")
            print(f"Raw request data: {entity_data}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        entity_name = entity_data.get('entity_name', '')
        entity_type = entity_data.get('entity_type', '')
        country = entity_data.get('country', '')
        currency = entity_data.get('currency', '')
        hierarchy_id = entity_data.get('hierarchy_id', '')
        parent_id = entity_data.get('parent_id', '')
        
        # Validate required fields
        if not entity_name:
            raise HTTPException(status_code=400, detail="Entity name is required")
        if not entity_type:
            raise HTTPException(status_code=400, detail="Entity type is required")
        
        # Get company name from query parameter or session
        company_name = request.query_params.get('company_name', 'Backo')  # Default fallback
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Get existing entities count to generate entity code
        cur.execute("SELECT COUNT(*) FROM entities")
        entity_count = cur.fetchone()[0]
        entity_code = f"ENT_{entity_count + 1:03d}"
        
        # Check for duplicate entity names
        cur.execute("SELECT entity_code FROM entities WHERE entity_name = %s", (entity_name.strip(),))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail=f"Entity with name '{entity_name}' already exists")
        
        # Insert new entity
        cur.execute("""
            INSERT INTO entities (entity_code, entity_name, entity_type, country, currency, 
                                hierarchy_id, parent_entity_id, ownership_percentage, 
                                consolidation_method, functional_currency, reporting_currency, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING entity_code
        """, (
            entity_code, entity_name, entity_type, country, currency, 
            hierarchy_id if hierarchy_id else None,
            int(parent_id) if parent_id and str(parent_id).isdigit() else None,
            100.0,  # Default ownership percentage
            'Full',  # Default consolidation method
            currency or 'USD',  # Default functional currency
            currency or 'USD'   # Default reporting currency
        ))
        
        created_entity_code = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Entity added successfully", 
            "entity": {
                "entity_code": created_entity_code,
                "entity_name": entity_name,
                "entity_type": entity_type,
                "country": country,
                "currency": currency,
                "hierarchy_id": hierarchy_id,
                "created_date": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating entity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create entity: {str(e)}"
        )

@router.delete("/{entity_code}")
def delete_entity(entity_code: str, company_name: str = Query(...)):
    """Delete an entity"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Check if entity exists before deleting
        cur.execute("SELECT entity_name FROM entities WHERE entity_code = %s", (entity_code,))
        entity = cur.fetchone()
        
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        # Delete the entity
        cur.execute("DELETE FROM entities WHERE entity_code = %s", (entity_code,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True, 
            "message": f"Entity '{entity[0]}' deleted successfully"
        }
        
    except Exception as e:
        print(f"Error deleting entity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete entity: {str(e)}"
        )
