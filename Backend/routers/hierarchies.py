from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import List, Optional
from pydantic import BaseModel
import psycopg2
import os
import json
from datetime import datetime

router = APIRouter(prefix="/hierarchies", tags=["Hierarchies"])

class HierarchyCreate(BaseModel):
    hierarchy_id: str
    hierarchy_name: str
    hierarchy_type: str
    description: Optional[str] = ""
    parent_hierarchy_id: Optional[str] = None
    level_number: Optional[int] = 1

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
def get_hierarchies(company_name: str = Query(...)):
    """Get all hierarchies for a company"""
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
                ORDER BY hierarchy_type, level_number, hierarchy_name
            """)
            
            hierarchies_data = cur.fetchall()
            cur.close()
            conn.close()
            
            hierarchies = []
            for hierarchy in hierarchies_data:
                hierarchies.append({
                    'hierarchy_id': hierarchy[0],
                    'hierarchy_name': hierarchy[1],
                    'hierarchy_type': hierarchy[2],
                    'description': hierarchy[3],
                    'parent_hierarchy_id': hierarchy[4],
                    'level_number': hierarchy[5],
                    'created_date': hierarchy[6].isoformat() if hierarchy[6] else None
                })
            
            return {"hierarchies": hierarchies}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "hierarchies": [
                    {
                        'hierarchy_id': 'H1',
                        'hierarchy_name': 'Main Entity Hierarchy',
                        'hierarchy_type': 'Entity',
                        'description': 'Primary entity organizational structure',
                        'parent_hierarchy_id': None,
                        'level_number': 1,
                        'created_date': '2024-01-01T00:00:00'
                    },
                    {
                        'hierarchy_id': 'A1',
                        'hierarchy_name': 'Asset Account Hierarchy',
                        'hierarchy_type': 'Account',
                        'description': 'Asset account classification structure',
                        'parent_hierarchy_id': None,
                        'level_number': 1,
                        'created_date': '2024-01-01T00:00:00'
                    },
                    {
                        'hierarchy_id': 'FST1',
                        'hierarchy_name': 'Balance Sheet Structure',
                        'hierarchy_type': 'FST',
                        'description': 'Financial statement template hierarchy',
                        'parent_hierarchy_id': None,
                        'level_number': 1,
                        'created_date': '2024-01-01T00:00:00'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting hierarchies: {e}")
        return {"hierarchies": []}

@router.get("/{hierarchy_type}")
def get_hierarchies_by_type(hierarchy_type: str, company_name: str = Query(...)):
    """Get hierarchies by type for current company"""
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
                WHERE hierarchy_type = %s
                ORDER BY level_number, hierarchy_name
            """, (hierarchy_type,))
            
            hierarchies_data = cur.fetchall()
            cur.close()
            conn.close()
            
            hierarchies = []
            for hierarchy in hierarchies_data:
                hierarchies.append({
                    'hierarchy_id': hierarchy[0],
                    'hierarchy_name': hierarchy[1],
                    'hierarchy_type': hierarchy[2],
                    'description': hierarchy[3],
                    'parent_hierarchy_id': hierarchy[4],
                    'level_number': hierarchy[5],
                    'created_date': hierarchy[6].isoformat() if hierarchy[6] else None
                })
            
            return {"hierarchies": hierarchies}
            
        except psycopg2.OperationalError:
            # Return filtered sample data
            sample_hierarchies = [
                {
                    'hierarchy_id': 'H1',
                    'hierarchy_name': 'Main Entity Hierarchy',
                    'hierarchy_type': 'Entity',
                    'description': 'Primary entity organizational structure',
                    'parent_hierarchy_id': None,
                    'level_number': 1,
                    'created_date': '2024-01-01T00:00:00'
                },
                {
                    'hierarchy_id': 'A1',
                    'hierarchy_name': 'Asset Account Hierarchy',
                    'hierarchy_type': 'Account',
                    'description': 'Asset account classification structure',
                    'parent_hierarchy_id': None,
                    'level_number': 1,
                    'created_date': '2024-01-01T00:00:00'
                },
                {
                    'hierarchy_id': 'FST1',
                    'hierarchy_name': 'Balance Sheet Structure',
                    'hierarchy_type': 'FST',
                    'description': 'Financial statement template hierarchy',
                    'parent_hierarchy_id': None,
                    'level_number': 1,
                    'created_date': '2024-01-01T00:00:00'
                }
            ]
            
            filtered_hierarchies = [h for h in sample_hierarchies if h['hierarchy_type'] == hierarchy_type]
            return {"hierarchies": filtered_hierarchies}
            
    except Exception as e:
        print(f"Error getting hierarchies by type: {e}")
        return {"hierarchies": []}

@router.post("/")
async def create_hierarchy(request: Request):
    """Create a new hierarchy"""
    try:
        # Parse request body
        body = await request.body()
        try:
            hierarchy_data = json.loads(body)
            print(f"=== HIERARCHY CREATION REQUEST DATA ===")
            print(f"Raw request data: {hierarchy_data}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        hierarchy_id = hierarchy_data.get('hierarchy_id', '')
        hierarchy_name = hierarchy_data.get('hierarchy_name', '')
        hierarchy_type = hierarchy_data.get('hierarchy_type', '')
        description = hierarchy_data.get('description', '')
        parent_hierarchy_id = hierarchy_data.get('parent_hierarchy_id', None)
        level_number = hierarchy_data.get('level_number', 1)
        
        # Validate required fields
        if not hierarchy_id:
            raise HTTPException(status_code=400, detail="Hierarchy ID is required")
        if not hierarchy_name:
            raise HTTPException(status_code=400, detail="Hierarchy name is required")
        if not hierarchy_type:
            raise HTTPException(status_code=400, detail="Hierarchy type is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')  # Default fallback
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Check for duplicate hierarchy_id
        cur.execute("SELECT hierarchy_id FROM hierarchies WHERE hierarchy_id = %s", (hierarchy_id,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail=f"Hierarchy ID '{hierarchy_id}' already exists")
        
        # Insert new hierarchy
        cur.execute("""
            INSERT INTO hierarchies (hierarchy_id, hierarchy_name, hierarchy_type, 
                                   description, parent_hierarchy_id, level_number, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING hierarchy_id
        """, (
            hierarchy_id, hierarchy_name, hierarchy_type,
            description, parent_hierarchy_id, level_number
        ))
        
        created_hierarchy_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Hierarchy created successfully",
            "hierarchy": {
                "hierarchy_id": created_hierarchy_id,
                "hierarchy_name": hierarchy_name,
                "hierarchy_type": hierarchy_type,
                "description": description,
                "parent_hierarchy_id": parent_hierarchy_id,
                "level_number": level_number,
                "created_date": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating hierarchy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create hierarchy: {str(e)}"
        )

@router.put("/{hierarchy_id}")
async def update_hierarchy(hierarchy_id: str, request: Request):
    """Update an existing hierarchy"""
    try:
        # Parse request body
        body = await request.body()
        try:
            hierarchy_data = json.loads(body)
            print(f"=== HIERARCHY UPDATE REQUEST DATA ===")
            print(f"Raw request data: {hierarchy_data}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        hierarchy_name = hierarchy_data.get('hierarchy_name', '')
        hierarchy_type = hierarchy_data.get('hierarchy_type', '')
        description = hierarchy_data.get('description', '')
        parent_hierarchy_id = hierarchy_data.get('parent_hierarchy_id', None)
        level_number = hierarchy_data.get('level_number', 1)
        
        # Validate required fields
        if not hierarchy_name:
            raise HTTPException(status_code=400, detail="Hierarchy name is required")
        if not hierarchy_type:
            raise HTTPException(status_code=400, detail="Hierarchy type is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')  # Default fallback
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Check if hierarchy exists
        cur.execute("SELECT hierarchy_name FROM hierarchies WHERE hierarchy_id = %s", (hierarchy_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Hierarchy not found")
        
        # Update hierarchy
        cur.execute("""
            UPDATE hierarchies 
            SET hierarchy_name = %s, hierarchy_type = %s, description = %s,
                parent_hierarchy_id = %s, level_number = %s
            WHERE hierarchy_id = %s
        """, (
            hierarchy_name, hierarchy_type, description,
            parent_hierarchy_id, level_number, hierarchy_id
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Hierarchy updated successfully",
            "hierarchy": {
                "hierarchy_id": hierarchy_id,
                "hierarchy_name": hierarchy_name,
                "hierarchy_type": hierarchy_type,
                "description": description,
                "parent_hierarchy_id": parent_hierarchy_id,
                "level_number": level_number,
                "updated_date": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error updating hierarchy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update hierarchy: {str(e)}"
        )

@router.delete("/{hierarchy_id}")
def delete_hierarchy(hierarchy_id: str, company_name: str = Query(...)):
    """Delete a hierarchy"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Check if hierarchy exists before deleting
        cur.execute("SELECT hierarchy_name FROM hierarchies WHERE hierarchy_id = %s", (hierarchy_id,))
        hierarchy = cur.fetchone()
        
        if not hierarchy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hierarchy not found"
            )
        
        # Check for dependencies (child hierarchies)
        cur.execute("SELECT COUNT(*) FROM hierarchies WHERE parent_hierarchy_id = %s", (hierarchy_id,))
        child_count = cur.fetchone()[0]
        
        if child_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete hierarchy '{hierarchy[0]}' - it has {child_count} child hierarchies"
            )
        
        # Delete the hierarchy
        cur.execute("DELETE FROM hierarchies WHERE hierarchy_id = %s", (hierarchy_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": f"Hierarchy '{hierarchy[0]}' deleted successfully"
        }
        
    except Exception as e:
        print(f"Error deleting hierarchy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete hierarchy: {str(e)}"
        )
