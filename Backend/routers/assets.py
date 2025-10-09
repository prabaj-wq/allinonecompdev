from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import List, Optional
from pydantic import BaseModel
import psycopg2
import os
import json
from datetime import datetime, date
from decimal import Decimal

router = APIRouter(prefix="/assets", tags=["Asset Management"])

class AssetCreate(BaseModel):
    asset_code: str
    asset_name: str
    category: str
    location: str
    acquisition_date: str
    acquisition_cost: float
    useful_life: int
    depreciation_method: str
    status: Optional[str] = "Active"
    description: Optional[str] = ""

class AssetUpdate(BaseModel):
    asset_name: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    current_value: Optional[float] = None
    status: Optional[str] = None
    description: Optional[str] = None

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
def get_assets(company_name: str = Query(...)):
    """Get all assets for a company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create assets table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS assets (
                    id SERIAL PRIMARY KEY,
                    asset_code VARCHAR(50) UNIQUE NOT NULL,
                    asset_name VARCHAR(255) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    location VARCHAR(255),
                    acquisition_date DATE NOT NULL,
                    acquisition_cost DECIMAL(15,2) NOT NULL,
                    current_value DECIMAL(15,2),
                    accumulated_depreciation DECIMAL(15,2) DEFAULT 0,
                    net_book_value DECIMAL(15,2),
                    useful_life INTEGER NOT NULL,
                    depreciation_method VARCHAR(50) NOT NULL,
                    status VARCHAR(50) DEFAULT 'Active',
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(100),
                    updated_by VARCHAR(100)
                )
            """)
            
            cur.execute("""
                SELECT id, asset_code, asset_name, category, location, acquisition_date,
                       acquisition_cost, current_value, accumulated_depreciation, net_book_value,
                       useful_life, depreciation_method, status, description, created_at, updated_at
                FROM assets
                ORDER BY asset_code
            """)
            
            assets_data = cur.fetchall()
            cur.close()
            conn.close()
            
            assets = []
            for asset in assets_data:
                assets.append({
                    'id': asset[0],
                    'asset_code': asset[1],
                    'asset_name': asset[2],
                    'category': asset[3],
                    'location': asset[4],
                    'acquisition_date': asset[5].isoformat() if asset[5] else None,
                    'acquisition_cost': float(asset[6]) if asset[6] else 0,
                    'current_value': float(asset[7]) if asset[7] else 0,
                    'accumulated_depreciation': float(asset[8]) if asset[8] else 0,
                    'net_book_value': float(asset[9]) if asset[9] else 0,
                    'useful_life': asset[10],
                    'depreciation_method': asset[11],
                    'status': asset[12],
                    'description': asset[13],
                    'created_at': asset[14].isoformat() if asset[14] else None,
                    'updated_at': asset[15].isoformat() if asset[15] else None
                })
            
            return {"assets": assets}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            return {
                "assets": [
                    {
                        'id': 1,
                        'asset_code': 'PPE001',
                        'asset_name': 'Office Building',
                        'category': 'Buildings',
                        'location': 'New York',
                        'acquisition_date': '2020-01-15',
                        'acquisition_cost': 5000000,
                        'current_value': 4800000,
                        'accumulated_depreciation': 200000,
                        'net_book_value': 4600000,
                        'useful_life': 30,
                        'depreciation_method': 'Straight Line',
                        'status': 'Active',
                        'description': 'Main office building',
                        'created_at': '2024-01-01T00:00:00',
                        'updated_at': '2024-01-01T00:00:00'
                    },
                    {
                        'id': 2,
                        'asset_code': 'PPE002',
                        'asset_name': 'Manufacturing Equipment',
                        'category': 'Machinery',
                        'location': 'Chicago',
                        'acquisition_date': '2021-03-20',
                        'acquisition_cost': 2500000,
                        'current_value': 2000000,
                        'accumulated_depreciation': 500000,
                        'net_book_value': 2000000,
                        'useful_life': 10,
                        'depreciation_method': 'Declining Balance',
                        'status': 'Active',
                        'description': 'Production line equipment',
                        'created_at': '2024-01-01T00:00:00',
                        'updated_at': '2024-01-01T00:00:00'
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting assets: {e}")
        return {"assets": []}

@router.post("/")
async def create_asset(request: Request):
    """Create a new asset"""
    try:
        # Parse request body
        body = await request.body()
        try:
            asset_data = json.loads(body)
            print(f"=== ASSET CREATION REQUEST DATA ===")
            print(f"Raw request data: {asset_data}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        asset_code = asset_data.get('asset_code', '')
        asset_name = asset_data.get('asset_name', '')
        category = asset_data.get('category', '')
        location = asset_data.get('location', '')
        acquisition_date = asset_data.get('acquisition_date', '')
        acquisition_cost = float(asset_data.get('acquisition_cost', 0))
        useful_life = int(asset_data.get('useful_life', 1))
        depreciation_method = asset_data.get('depreciation_method', 'Straight Line')
        status = asset_data.get('status', 'Active')
        description = asset_data.get('description', '')
        
        # Validate required fields
        if not asset_code:
            raise HTTPException(status_code=400, detail="Asset code is required")
        if not asset_name:
            raise HTTPException(status_code=400, detail="Asset name is required")
        if not category:
            raise HTTPException(status_code=400, detail="Category is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Check for duplicate asset codes
        cur.execute("SELECT asset_code FROM assets WHERE asset_code = %s", (asset_code,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail=f"Asset code '{asset_code}' already exists")
        
        # Calculate initial values
        current_value = acquisition_cost
        net_book_value = acquisition_cost
        
        # Insert new asset
        cur.execute("""
            INSERT INTO assets (asset_code, asset_name, category, location, acquisition_date,
                              acquisition_cost, current_value, net_book_value, useful_life,
                              depreciation_method, status, description, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """, (
            asset_code, asset_name, category, location, acquisition_date,
            acquisition_cost, current_value, net_book_value, useful_life,
            depreciation_method, status, description
        ))
        
        created_asset_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Asset created successfully",
            "asset": {
                "id": created_asset_id,
                "asset_code": asset_code,
                "asset_name": asset_name,
                "category": category,
                "location": location,
                "acquisition_cost": acquisition_cost,
                "status": status,
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating asset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create asset: {str(e)}"
        )

@router.put("/{asset_id}")
async def update_asset(asset_id: int, request: Request):
    """Update an existing asset"""
    try:
        # Parse request body
        body = await request.body()
        try:
            asset_data = json.loads(body)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Check if asset exists
        cur.execute("SELECT asset_code FROM assets WHERE id = %s", (asset_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Asset not found")
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        
        for field, value in asset_data.items():
            if field in ['asset_name', 'category', 'location', 'current_value', 'status', 'description']:
                update_fields.append(f"{field} = %s")
                update_values.append(value)
        
        if update_fields:
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            update_values.append(asset_id)
            
            query = f"UPDATE assets SET {', '.join(update_fields)} WHERE id = %s"
            cur.execute(query, update_values)
            
            conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            "message": "Asset updated successfully",
            "asset_id": asset_id,
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"Error updating asset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update asset: {str(e)}"
        )

@router.delete("/{asset_id}")
def delete_asset(asset_id: int, company_name: str = Query(...)):
    """Delete an asset"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Check if asset exists before deleting
        cur.execute("SELECT asset_name FROM assets WHERE id = %s", (asset_id,))
        asset = cur.fetchone()
        
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )
        
        # Delete the asset
        cur.execute("DELETE FROM assets WHERE id = %s", (asset_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": f"Asset '{asset[0]}' deleted successfully"
        }
        
    except Exception as e:
        print(f"Error deleting asset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete asset: {str(e)}"
        )

@router.get("/categories")
def get_asset_categories(company_name: str = Query(...)):
    """Get asset categories"""
    try:
        # Return standard asset categories
        categories = [
            {"id": 1, "name": "Buildings", "description": "Real estate and buildings"},
            {"id": 2, "name": "Machinery", "description": "Manufacturing and production equipment"},
            {"id": 3, "name": "Vehicles", "description": "Company vehicles and transportation"},
            {"id": 4, "name": "IT Equipment", "description": "Computers, servers, and IT hardware"},
            {"id": 5, "name": "Furniture", "description": "Office furniture and fixtures"},
            {"id": 6, "name": "Intangible", "description": "Patents, trademarks, and software"}
        ]
        
        return {"categories": categories}
        
    except Exception as e:
        print(f"Error getting asset categories: {e}")
        return {"categories": []}

@router.post("/{asset_id}/depreciation")
async def calculate_depreciation(asset_id: int, request: Request):
    """Calculate depreciation for an asset"""
    try:
        # Parse request body
        body = await request.body()
        try:
            calc_data = json.loads(body)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        period_months = calc_data.get('period_months', 12)
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Get asset details
        cur.execute("""
            SELECT acquisition_cost, useful_life, depreciation_method, accumulated_depreciation
            FROM assets WHERE id = %s
        """, (asset_id,))
        
        asset_data = cur.fetchone()
        if not asset_data:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        acquisition_cost, useful_life, method, accumulated_dep = asset_data
        
        # Calculate depreciation based on method
        if method == 'Straight Line':
            annual_depreciation = float(acquisition_cost) / useful_life
            period_depreciation = annual_depreciation * (period_months / 12)
        elif method == 'Declining Balance':
            rate = 2 / useful_life  # Double declining balance
            current_value = float(acquisition_cost) - float(accumulated_dep or 0)
            period_depreciation = current_value * rate * (period_months / 12)
        else:
            period_depreciation = 0
        
        # Update accumulated depreciation
        new_accumulated = float(accumulated_dep or 0) + period_depreciation
        new_net_book_value = float(acquisition_cost) - new_accumulated
        
        cur.execute("""
            UPDATE assets 
            SET accumulated_depreciation = %s, net_book_value = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (new_accumulated, new_net_book_value, asset_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "depreciation_calculated": period_depreciation,
            "accumulated_depreciation": new_accumulated,
            "net_book_value": new_net_book_value,
            "calculation_date": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"Error calculating depreciation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate depreciation: {str(e)}"
        )
