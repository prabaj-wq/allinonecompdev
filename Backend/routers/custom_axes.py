from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import psycopg2
import psycopg2.extras
import os
import json
import re
from datetime import datetime
from contextlib import contextmanager

router = APIRouter(prefix="/custom-axes", tags=["Custom Axes"])

@router.get("/test")
def test_endpoint():
    """Simple test endpoint to verify API is working"""
    return {"message": "Custom axes API is working!", "status": "success"}

class CustomFieldDefinition(BaseModel):
    column_name: str
    field_type: str  # text, number, date, dropdown, checkbox
    is_required: bool = False
    options: List[str] = []
    default_value: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None

class CustomAxisCreate(BaseModel):
    axis_name: str
    description: Optional[str] = ""
    columns: List[CustomFieldDefinition] = []

class CustomAxisUpdate(BaseModel):
    axis_name: Optional[str] = None
    description: Optional[str] = None
    columns: Optional[List[CustomFieldDefinition]] = None

class CustomElementCreate(BaseModel):
    name: str
    code: Optional[str] = None
    hierarchy_id: Optional[int] = None
    parent_id: Optional[int] = None
    custom_fields: Dict[str, Any] = {}

class HierarchyCreate(BaseModel):
    hierarchy_name: str
    hierarchy_type: str = "custom"
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

def get_company_db_name(company_name: str) -> str:
    """Get database name for a company"""
    return company_name.lower().replace(' ', '_').replace('-', '_')

@contextmanager
def get_company_connection(company_name: str):
    """Get database connection for a company"""
    db_config = get_db_config()
    company_db_name = get_company_db_name(company_name)
    
    conn = psycopg2.connect(
        database=company_db_name,
        **db_config
    )
    try:
        yield conn
    finally:
        conn.close()

def create_custom_table(conn, table_name: str, columns: List[CustomFieldDefinition]):
    """Create a custom table with dynamic columns"""
    cur = conn.cursor()
    
    # Start with base columns
    column_definitions = [
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255) NOT NULL',
        'code VARCHAR(100) UNIQUE',
        'hierarchy_id INTEGER REFERENCES hierarchies(id)',
        'parent_id INTEGER REFERENCES hierarchy_nodes(id)',
        'is_active BOOLEAN DEFAULT TRUE',
        'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ]
    
    # Add custom columns
    for column in columns:
        col_name = column.column_name.lower().replace(' ', '_')
        
        if column.field_type == 'text':
            col_type = 'TEXT'
        elif column.field_type == 'number':
            col_type = 'NUMERIC'
        elif column.field_type == 'date':
            col_type = 'DATE'
        elif column.field_type in ['dropdown', 'checkbox']:
            col_type = 'TEXT'
        else:
            col_type = 'TEXT'
            
        nullable = '' if column.is_required else ''
        column_definitions.append(f'{col_name} {col_type} {nullable}')
    
    create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {', '.join(column_definitions)}
        )
    """
    
    cur.execute(create_table_sql)
    conn.commit()
    cur.close()

@router.get("/")
def get_custom_axes(company_name: str = Query(...)):
    """Get all custom axes for a company"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(psycopg2.extras.RealDictCursor)
            
            # Create custom_axes table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS custom_axes (
                    id SERIAL PRIMARY KEY,
                    axis_name VARCHAR(100) UNIQUE NOT NULL,
                    table_name VARCHAR(100) UNIQUE NOT NULL,
                    description TEXT,
                    columns JSONB DEFAULT '[]',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Also ensure hierarchies table exists for custom axes
            cur.execute("""
                CREATE TABLE IF NOT EXISTS hierarchies (
                    id SERIAL PRIMARY KEY,
                    hierarchy_name VARCHAR(255) NOT NULL,
                    hierarchy_type VARCHAR(50) NOT NULL,
                    description TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create hierarchy_nodes table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS hierarchy_nodes (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    code VARCHAR(100) NOT NULL,
                    parent_id INTEGER REFERENCES hierarchy_nodes(id) ON DELETE CASCADE,
                    hierarchy_id INTEGER REFERENCES hierarchies(id) ON DELETE CASCADE,
                    company_id VARCHAR(255) NOT NULL,
                    level INTEGER DEFAULT 0,
                    path VARCHAR(500),
                    is_leaf BOOLEAN DEFAULT TRUE,
                    custom_fields JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            
            # Get all custom axes
            cur.execute("""
                SELECT id, axis_name, table_name, description, columns, is_active,
                       created_at, updated_at
                FROM custom_axes 
                ORDER BY axis_name
            """)
            
            axes = cur.fetchall()
            
            # For each axis, get the count of elements
            for axis in axes:
                try:
                    cur.execute(f"SELECT COUNT(*) as count FROM {axis['table_name']}")
                    count_result = cur.fetchone()
                    axis['nodes_count'] = count_result['count'] if count_result else 0
                except:
                    axis['nodes_count'] = 0
            
            return {"axes": axes}
            
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/")
def create_custom_axis(axis_data: CustomAxisCreate, company_name: str = Query(...)):
    """Create a new custom axis with dynamic table"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(psycopg2.extras.RealDictCursor)
            
            # Create custom_axes table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS custom_axes (
                    id SERIAL PRIMARY KEY,
                    axis_name VARCHAR(100) UNIQUE NOT NULL,
                    table_name VARCHAR(100) UNIQUE NOT NULL,
                    description TEXT,
                    columns JSONB DEFAULT '[]',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            
            # Generate table name
            table_name = f"cust_{axis_data.axis_name.lower().replace(' ', '_').replace('-', '_')}_axes"
            
            # Validate table name
            if not re.match(r'^[a-z][a-z0-9_]*$', table_name):
                raise HTTPException(status_code=400, detail="Invalid axis name for table creation")
            
            # Insert axis record
            cur.execute("""
                INSERT INTO custom_axes (axis_name, table_name, description, columns)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (
                axis_data.axis_name,
                table_name,
                axis_data.description,
                json.dumps([col.dict() for col in axis_data.columns])
            ))
            
            axis_id = cur.fetchone()['id']
            conn.commit()
            
            # Create the custom table
            create_custom_table(conn, table_name, axis_data.columns)
            
            return {
                "message": "Custom axis created successfully",
                "axis_id": axis_id,
                "table_name": table_name
            }
            
    except psycopg2.IntegrityError as e:
        if "duplicate key" in str(e):
            raise HTTPException(status_code=400, detail="Axis name already exists")
        raise HTTPException(status_code=400, detail=f"Database constraint error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating axis: {str(e)}")

# Additional endpoints for full functionality
@router.get("/{axis_name}")
def get_custom_axis(axis_name: str, company_name: str = Query(...)):
    """Get a specific custom axis"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(psycopg2.extras.RealDictCursor)
            
            cur.execute("""
                SELECT id, axis_name, table_name, description, columns, is_active,
                       created_at, updated_at
                FROM custom_axes 
                WHERE axis_name = %s OR table_name LIKE %s
            """, (axis_name, f"%{axis_name}%"))
            
            axis = cur.fetchone()
            if not axis:
                raise HTTPException(status_code=404, detail="Custom axis not found")
            
            return {"axis": axis}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/{axis_name}/hierarchies")
def get_custom_axis_hierarchies(axis_name: str, company_name: str = Query(...)):
    """Get hierarchies for a custom axis"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(psycopg2.extras.RealDictCursor)
            
            cur.execute("""
                SELECT h.id, h.hierarchy_name as name, h.description, h.hierarchy_type, h.is_active,
                       h.created_at, h.updated_at, 'Active' as status
                FROM hierarchies h
                WHERE h.hierarchy_type = 'custom'
                ORDER BY h.hierarchy_name
            """)
            
            hierarchies = cur.fetchall()
            return {"hierarchies": hierarchies}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/{axis_name}/hierarchies")
def create_custom_axis_hierarchy(axis_name: str, hierarchy_data: HierarchyCreate, company_name: str = Query(...)):
    """Create a hierarchy for a custom axis"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            
            # Ensure hierarchies table exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS hierarchies (
                    id SERIAL PRIMARY KEY,
                    hierarchy_name VARCHAR(255) NOT NULL,
                    hierarchy_type VARCHAR(50) NOT NULL,
                    description TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cur.execute("""
                INSERT INTO hierarchies (hierarchy_name, hierarchy_type, description)
                VALUES (%s, %s, %s)
                RETURNING id
            """, (
                hierarchy_data.hierarchy_name,
                hierarchy_data.hierarchy_type,
                hierarchy_data.description
            ))
            
            hierarchy_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                "message": "Hierarchy created successfully",
                "hierarchy_id": hierarchy_id
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating hierarchy: {str(e)}")

@router.get("/{axis_name}/elements")
def get_custom_axis_elements(axis_name: str, company_name: str = Query(...)):
    """Get elements for a custom axis"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(psycopg2.extras.RealDictCursor)
            
            # Get the table name
            cur.execute("SELECT table_name, columns FROM custom_axes WHERE axis_name = %s", (axis_name,))
            axis_result = cur.fetchone()
            
            if not axis_result:
                raise HTTPException(status_code=404, detail="Custom axis not found")
            
            table_name = axis_result['table_name']
            
            # Get all elements from the custom table
            cur.execute(f"""
                SELECT * FROM {table_name}
                ORDER BY name
            """)
            
            elements = cur.fetchall()
            return {"elements": elements}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/{axis_name}/elements")
def create_custom_axis_element(axis_name: str, element_data: CustomElementCreate, company_name: str = Query(...)):
    """Create an element for a custom axis"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(psycopg2.extras.RealDictCursor)
            
            # Get the table name and columns
            cur.execute("SELECT table_name, columns FROM custom_axes WHERE axis_name = %s", (axis_name,))
            axis_result = cur.fetchone()
            
            if not axis_result:
                raise HTTPException(status_code=404, detail="Custom axis not found")
            
            table_name = axis_result['table_name']
            columns_def = axis_result['columns']
            
            # Build insert query dynamically
            base_fields = ['name', 'code', 'hierarchy_id', 'parent_id']
            base_values = [element_data.name, element_data.code, element_data.hierarchy_id, element_data.parent_id]
            
            # Add custom fields
            for field_name, field_value in element_data.custom_fields.items():
                safe_field_name = field_name.lower().replace(' ', '_')
                base_fields.append(safe_field_name)
                base_values.append(field_value)
            
            placeholders = ', '.join(['%s'] * len(base_values))
            fields_str = ', '.join(base_fields)
            
            cur.execute(f"""
                INSERT INTO {table_name} ({fields_str})
                VALUES ({placeholders})
                RETURNING id
            """, base_values)
            
            element_id = cur.fetchone()['id']
            conn.commit()
            
            return {
                "message": "Element created successfully",
                "element_id": element_id
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating element: {str(e)}")

@router.delete("/{axis_id}")
def delete_custom_axis(axis_id: int, company_name: str = Query(...)):
    """Delete a custom axis and its table"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(psycopg2.extras.RealDictCursor)
            
            # Get the table name first
            cur.execute("SELECT table_name FROM custom_axes WHERE id = %s", (axis_id,))
            result = cur.fetchone()
            
            if not result:
                raise HTTPException(status_code=404, detail="Custom axis not found")
            
            table_name = result['table_name']
            
            # Drop the custom table
            cur.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE")
            
            # Delete the axis record
            cur.execute("DELETE FROM custom_axes WHERE id = %s", (axis_id,))
            
            conn.commit()
            return {"message": "Custom axis and table deleted successfully"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting axis: {str(e)}")

@router.put("/{axis_id}")
def update_custom_axis(axis_id: int, axis_data: CustomAxisUpdate, company_name: str = Query(...)):
    """Update a custom axis"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            
            update_fields = []
            values = []
            
            if axis_data.axis_name is not None:
                update_fields.append("axis_name = %s")
                values.append(axis_data.axis_name)
            
            if axis_data.description is not None:
                update_fields.append("description = %s")
                values.append(axis_data.description)
            
            if axis_data.columns is not None:
                update_fields.append("columns = %s")
                values.append(json.dumps([col.dict() for col in axis_data.columns]))
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(axis_id)
            
            cur.execute(f"""
                UPDATE custom_axes 
                SET {', '.join(update_fields)}
                WHERE id = %s
            """, values)
            
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Custom axis not found")
            
            conn.commit()
            return {"message": "Custom axis updated successfully"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating axis: {str(e)}")

@router.put("/{axis_name}/elements/{element_code}")
def update_custom_axis_element(axis_name: str, element_code: str, element_data: dict, company_name: str = Query(...)):
    """Update an element in a custom axis"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            
            # Get the table name
            cur.execute("SELECT table_name FROM custom_axes WHERE axis_name = %s", (axis_name,))
            axis_result = cur.fetchone()
            
            if not axis_result:
                raise HTTPException(status_code=404, detail="Custom axis not found")
            
            table_name = axis_result[0]
            
            # Build update query dynamically
            update_fields = []
            values = []
            
            for field_name, field_value in element_data.items():
                if field_name != 'id':  # Don't update ID
                    safe_field_name = field_name.lower().replace(' ', '_')
                    update_fields.append(f"{safe_field_name} = %s")
                    values.append(field_value)
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(element_code)
            
            cur.execute(f"""
                UPDATE {table_name}
                SET {', '.join(update_fields)}
                WHERE code = %s
            """, values)
            
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Element not found")
            
            conn.commit()
            return {"message": "Element updated successfully"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating element: {str(e)}")

@router.delete("/{axis_name}/elements/{element_code}")
def delete_custom_axis_element(axis_name: str, element_code: str, company_name: str = Query(...)):
    """Delete an element from a custom axis"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            
            # Get the table name
            cur.execute("SELECT table_name FROM custom_axes WHERE axis_name = %s", (axis_name,))
            axis_result = cur.fetchone()
            
            if not axis_result:
                raise HTTPException(status_code=404, detail="Custom axis not found")
            
            table_name = axis_result[0]
            
            cur.execute(f"DELETE FROM {table_name} WHERE code = %s", (element_code,))
            
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Element not found")
            
            conn.commit()
            return {"message": "Element deleted successfully"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting element: {str(e)}")

@router.get("/{axis_name}/hierarchy-structure/{hierarchy_id}")
def get_custom_axis_hierarchy_structure(axis_name: str, hierarchy_id: int, company_name: str = Query(...)):
    """Get hierarchy structure for a custom axis"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(psycopg2.extras.RealDictCursor)
            
            # Get hierarchy nodes
            cur.execute("""
                SELECT id, name, code, parent_id, level, path, is_leaf, custom_fields
                FROM hierarchy_nodes
                WHERE hierarchy_id = %s
                ORDER BY level, name
            """, (hierarchy_id,))
            
            nodes = cur.fetchall()
            
            # Get unassigned elements
            cur.execute("SELECT table_name FROM custom_axes WHERE axis_name = %s", (axis_name,))
            axis_result = cur.fetchone()
            
            unassigned_elements = []
            if axis_result:
                table_name = axis_result['table_name']
                cur.execute(f"""
                    SELECT * FROM {table_name}
                    WHERE hierarchy_id = %s AND parent_id IS NULL
                    ORDER BY name
                """, (hierarchy_id,))
                unassigned_elements = cur.fetchall()
            
            return {
                "nodes": nodes,
                "unassigned_elements": unassigned_elements,
                "hierarchy_id": hierarchy_id
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
