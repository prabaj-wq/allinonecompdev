#!/usr/bin/env python3
"""
Simple onboarding endpoint for testing
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database import SessionLocal, Company, User
from auth.utils import get_password_hash

app = FastAPI()

class CompanyCreate(BaseModel):
    company_name: str
    environment_type: str
    industry: str

class AdminUserCreate(BaseModel):
    username: str
    email: str
    password: str

class OnboardingData(BaseModel):
    company: CompanyCreate
    admin_user: AdminUserCreate

@app.post("/test-onboarding")
def test_onboarding(data: OnboardingData):
    """Simple onboarding test"""
    
    db = SessionLocal()
    try:
        # Create company
        database_name = data.company.company_name.lower().replace(' ', '_').replace('-', '_')
        
        company = Company(
            name=data.company.company_name,
            code=database_name,
            status='active'
        )
        db.add(company)
        db.flush()
        
        # Create user
        hashed_password = get_password_hash(data.admin_user.password)
        user = User(
            company_id=company.id,
            username=data.admin_user.username,
            email=data.admin_user.email,
            password_hash=hashed_password,
            is_active=True,
            is_superuser=True
        )
        db.add(user)
        db.flush()
        
        # Commit
        db.commit()
        
        return {
            "status": "success",
            "company_id": company.id,
            "user_id": user.id,
            "database_name": database_name
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
