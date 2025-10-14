from fastapi import APIRouter, HTTPException, status, Query, Request, Depends
from typing import Optional
from database import get_db, Company
from sqlalchemy.orm import Session
import os

router = APIRouter(prefix="/database-info", tags=["Database Info"])

@router.get("/active-database")
def get_active_database(request: Request):
    """Get the currently active database/company for the user session"""
    try:
        # Get company from session or token
        company_name = None
        
        # Try to get from session first
        if hasattr(request, 'session'):
            company_name = request.session.get('company_name')
        
        # Try to get from Authorization header (JWT token)
        if not company_name:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                try:
                    from jose import jwt
                    token = auth_header.split(' ')[1]
                    payload = jwt.decode(token, "your-secret-key-change-in-production", algorithms=["HS256"])
                    company_name = payload.get("company_name")
                except Exception as e:
                    print(f"Error decoding token: {e}")
        
        # Try to get from query parameters as fallback
        if not company_name:
            company_name = request.query_params.get('company_name')
        
        # Default fallback
        if not company_name:
            company_name = "Default Company"
        
        # Get database name
        db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        return {
            "company_name": company_name,
            "database_name": db_name,
            "is_active": True,
            "status": "connected"
        }
        
    except Exception as e:
        return {
            "company_name": "Default Company",
            "database_name": "default_company",
            "is_active": False,
            "status": "error",
            "error": str(e)
        }

@router.get("/available-databases")
def get_available_databases(db: Session = Depends(get_db)):
    """Get list of available company databases"""
    try:
        # Get all companies from main database
        companies = db.query(Company).filter(Company.status == 'active').all()
        
        databases = []
        for company in companies:
            db_name = company.name.lower().replace(' ', '_').replace('-', '_')
            databases.append({
                "company_name": company.name,
                "company_code": company.code,
                "database_name": db_name,
                "status": company.status,
                "environment_type": getattr(company, 'environment_type', 'production')
            })
        
        return {
            "databases": databases,
            "total_count": len(databases)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving databases: {str(e)}"
        )

@router.post("/switch-database")
def switch_database(request: Request, company_name: str = Query(...)):
    """Switch to a different company database"""
    try:
        # Validate company exists
        # This would typically update the session or return a new token
        
        db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        # In a real implementation, you would:
        # 1. Validate the company exists and user has access
        # 2. Update the session or issue a new JWT token
        # 3. Return success confirmation
        
        return {
            "message": f"Successfully switched to {company_name}",
            "company_name": company_name,
            "database_name": db_name,
            "status": "switched"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error switching database: {str(e)}"
        )
