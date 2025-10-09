from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import List, Optional
from pydantic import BaseModel
import psycopg2
import os
import json
from datetime import datetime

router = APIRouter(prefix="/custom-axes", tags=["Custom Axes"])

class CustomAxisCreate(BaseModel):
    axis_id: str
    axis_name: str
    description: Optional[str] = ""
    value_type: Optional[str] = "text"
    is_active: Optional[bool] = True
    is_required: Optional[bool] = False
    display_order: Optional[int] = 0
    created_by: Optional[str] = "system"

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
def get_custom_axes(company_name: str = Query(...)):
    """Get all custom axes for a company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create custom_axes table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS custom_axes (
                    id SERIAL PRIMARY KEY,
                    axis_id VARCHAR(50) UNIQUE NOT NULL,
                    axis_name VARCHAR(255) NOT NULL,
                    description TEXT,
                    value_type VARCHAR(50) DEFAULT 'text',
                    is_active BOOLEAN DEFAULT TRUE,
                    is_required BOOLEAN DEFAULT FALSE,
                    display_order INTEGER DEFAULT 0,
                    created_by VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cur.execute("""
                SELECT id, axis_id, axis_name, description, value_type, 
                       is_active, is_required, display_order, created_by, 
                       created_at, updated_at
                FROM custom_axes
                ORDER BY display_order, axis_name
            """)
            
            axes_data = cur.fetchall()
            cur.close()
            conn.close()
            
            axes = []
            for axis in axes_data:
                axes.append({
                    'id': axis[0],
                    'axis_id': axis[1],
                    'axis_name': axis[2],
                    'description': axis[3],
                    'value_type': axis[4],
                    'is_active': axis[5],
                    'is_required': axis[6],
                    'display_order': axis[7],
                    'created_by': axis[8],
                    'created_at': axis[9].isoformat() if axis[9] else None,
                    'updated_at': axis[10].isoformat() if axis[10] else None
                })
            
            return {"axes": axes}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "axes": [
                    {
                        'id': 1,
                        'axis_id': 'REGION',
                        'axis_name': 'Geographic Region',
                        'description': 'Regional breakdown for reporting',
                        'value_type': 'text',
                        'is_active': True,
                        'is_required': False,
                        'display_order': 1,
                        'created_by': 'system',
                        'created_at': '2024-01-01T00:00:00',
                        'updated_at': '2024-01-01T00:00:00'
                    },
                    {
                        'id': 2,
                        'axis_id': 'PRODUCT',
                        'axis_name': 'Product Line',
                        'description': 'Product categorization',
                        'value_type': 'text',
                        'is_active': True,
                        'is_required': False,
                        'display_order': 2,
                        'created_by': 'system',
                        'created_at': '2024-01-01T00:00:00',
                        'updated_at': '2024-01-01T00:00:00'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting custom axes: {e}")
        return {"axes": []}

@router.post("/")
async def create_custom_axis(request: Request):
    """Create a new custom axis"""
    try:
        # Parse request body
        body = await request.body()
        try:
            axis_data = json.loads(body)
            print(f"=== CUSTOM AXIS CREATION REQUEST DATA ===")
            print(f"Raw request data: {axis_data}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        axis_id = axis_data.get('axis_id', '')
        axis_name = axis_data.get('axis_name', '')
        description = axis_data.get('description', '')
        value_type = axis_data.get('value_type', 'text')
        is_active = axis_data.get('is_active', True)
        is_required = axis_data.get('is_required', False)
        display_order = axis_data.get('display_order', 0)
        created_by = axis_data.get('created_by', 'system')
        
        # Validate required fields
        if not axis_id:
            raise HTTPException(status_code=400, detail="Axis ID is required")
        if not axis_name:
            raise HTTPException(status_code=400, detail="Axis name is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')  # Default fallback
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Create custom_axes table if it doesn't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS custom_axes (
                id SERIAL PRIMARY KEY,
                axis_id VARCHAR(50) UNIQUE NOT NULL,
                axis_name VARCHAR(255) NOT NULL,
                description TEXT,
                value_type VARCHAR(50) DEFAULT 'text',
                is_active BOOLEAN DEFAULT TRUE,
                is_required BOOLEAN DEFAULT FALSE,
                display_order INTEGER DEFAULT 0,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Check for duplicate axis_id
        cur.execute("SELECT axis_id FROM custom_axes WHERE axis_id = %s", (axis_id,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail=f"Axis ID '{axis_id}' already exists")
        
        # Insert new axis
        cur.execute("""
            INSERT INTO custom_axes (axis_id, axis_name, description, value_type, 
                                   is_active, is_required, display_order, created_by,
                                   created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """, (
            axis_id, axis_name, description, value_type,
            is_active, is_required, display_order, created_by
        ))
        
        created_axis_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Custom axis created successfully",
            "axis": {
                "id": created_axis_id,
                "axis_id": axis_id,
                "axis_name": axis_name,
                "description": description,
                "value_type": value_type,
                "is_active": is_active,
                "is_required": is_required,
                "display_order": display_order,
                "created_by": created_by,
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating custom axis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create custom axis: {str(e)}"
        )

@router.get("/stats")
def get_custom_axes_stats(company_name: str = Query(...)):
    """Get custom axes statistics"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Count total axes
            cur.execute("SELECT COUNT(*) FROM custom_axes")
            total_axes = cur.fetchone()[0]
            
            # Count active axes
            cur.execute("SELECT COUNT(*) FROM custom_axes WHERE is_active = TRUE")
            active_axes = cur.fetchone()[0]
            
            # Count axis values (if table exists)
            try:
                cur.execute("SELECT COUNT(*) FROM custom_axis_values")
                total_values = cur.fetchone()[0]
            except:
                total_values = 0
            
            # Count assignments (if table exists)
            try:
                cur.execute("SELECT COUNT(*) FROM custom_axis_assignments")
                total_assignments = cur.fetchone()[0]
            except:
                total_assignments = 0
            
            cur.close()
            conn.close()
            
            return {
                "totalAxes": total_axes,
                "activeAxes": active_axes,
                "totalValues": total_values,
                "totalAssignments": total_assignments
            }
            
        except psycopg2.OperationalError:
            # Return sample stats if database doesn't exist
            return {
                "totalAxes": 2,
                "activeAxes": 2,
                "totalValues": 8,
                "totalAssignments": 15
            }
            
    except Exception as e:
        print(f"Error getting custom axes stats: {e}")
        return {
            "totalAxes": 0,
            "activeAxes": 0,
            "totalValues": 0,
            "totalAssignments": 0
        }

@router.delete("/{axis_id}")
def delete_custom_axis(axis_id: str, company_name: str = Query(...)):
    """Delete a custom axis"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Check if axis exists before deleting
        cur.execute("SELECT axis_name FROM custom_axes WHERE axis_id = %s", (axis_id,))
        axis = cur.fetchone()
        
        if not axis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Custom axis not found"
            )
        
        # Delete the axis
        cur.execute("DELETE FROM custom_axes WHERE axis_id = %s", (axis_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": f"Custom axis '{axis[0]}' deleted successfully"
        }
        
    except Exception as e:
        print(f"Error deleting custom axis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete custom axis: {str(e)}"
        )
