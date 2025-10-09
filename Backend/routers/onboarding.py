from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine, text
from typing import Dict, Any
import os
from urllib.parse import quote_plus
from datetime import datetime, timedelta
import json
import traceback
import time
import logging
from jose import jwt
from passlib.context import CryptContext

# Configure logging
logger = logging.getLogger(__name__)

from database import get_db, Base, Company, User, SessionLocal
from pydantic import BaseModel, EmailStr
from enum import Enum as PyEnum
from config import settings

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class EnvironmentType(str, PyEnum):
    PRODUCTION = "production"
    DEVELOPMENT = "development"

class CompanyCreate(BaseModel):
    company_name: str
    environment_type: EnvironmentType
    industry: str

class AdminUserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
class OnboardingData(BaseModel):
    company: CompanyCreate
    admin_user: AdminUserCreate

def get_postgres_password() -> str:
    """Get the correct postgres password from environment"""
    return os.getenv('POSTGRES_PASSWORD', 'epm_password')

def get_db_connection_params() -> Dict[str, str]:
    """Get database connection parameters based on environment"""
    return {
        'host': 'postgres' if os.getenv('DOCKER_ENV') == 'true' else 'localhost',
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'user': 'postgres',
        'password': get_postgres_password()
    }

def create_company_database(company_name: str) -> str:
    """Create a new database for the company with proper permissions"""
    try:
        database_name = company_name.lower().replace(' ', '_').replace('-', '_')
        db_params = get_db_connection_params()
        
        # Build connection URL for postgres database
        encoded_password = quote_plus(db_params['password'])
        postgres_url = f"postgresql://{db_params['user']}:{encoded_password}@{db_params['host']}:{db_params['port']}/postgres"
        
        print(f"Creating database '{database_name}'...")
        postgres_engine = create_engine(postgres_url, isolation_level="AUTOCOMMIT")
        
        with postgres_engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :dbname"), {"dbname": database_name})
            if result.fetchone():
                print(f"Database '{database_name}' already exists")
                return database_name
            
            # Create database
            conn.execute(text(f'CREATE DATABASE "{database_name}"'))
            print(f"Created database '{database_name}'")
        
        # Note: We're using postgres user consistently, so no need to grant to epm_user
        # The postgres user already has all privileges
        
        return database_name
        
    except Exception as e:
        print(f"Error creating company database: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create database: {str(e)}"
        )


def create_company_tables(database_name: str):
    """Create all necessary tables in the company database using the company-specific schema"""
    try:
        print(f"Creating tables in database: {database_name}")
        db_params = get_db_connection_params()
        
        # Use postgres user for creating tables (already has permissions set up)
        encoded_password = quote_plus(db_params['password'])
        db_url = f"postgresql://{db_params['user']}:{encoded_password}@{db_params['host']}:{db_params['port']}/{database_name}"
        
        engine = create_engine(db_url, echo=True)
        
        # Import and use the company-specific database schema
        from company_database import create_company_database_schema
        create_company_database_schema(engine)
        
        print(f"Successfully created all company tables in database '{database_name}'")
        
    except Exception as e:
        print(f"Error creating tables: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create tables: {str(e)}"
        )

def create_company_and_user_records(data: OnboardingData, database_name: str):
    """Create company and user records in the main database"""
    logger.info(f"=== Starting create_company_and_user_records ===")
    logger.info(f"Company name: {data.company.company_name}, Database: {database_name}")
    print(f"Creating company and user records...")
    
    # Create a new session for this operation
    db = SessionLocal()
    try:
        # Check if company already exists
        existing_company = db.query(Company).filter(
            (Company.name == data.company.company_name) | 
            (Company.code == database_name.lower())
        ).first()
        
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Company '{data.company.company_name}' already exists"
            )
        
        # Create company
        company = Company(
            name=data.company.company_name,
            code=database_name.lower(),
            environment_type=data.company.environment_type,
            industry=data.company.industry,
            status='active'
        )
        db.add(company)
        db.flush()
        logger.info(f"Created company: {company.name} (ID: {company.id})")
        print(f"Created company: {company.name} (ID: {company.id})")
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == data.admin_user.email)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email '{data.admin_user.email}' already exists"
            )
        
        # Create admin user
        from auth.utils import get_password_hash
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
        logger.info(f"Created admin user: {user.username} (ID: {user.id})")
        print(f"Created admin user: {user.username} (ID: {user.id})")
        
        # Skip role and permission creation for now to avoid transaction issues
        # TODO: Add role and permission creation later
        logger.info("Skipping role/permission creation for simplified onboarding")
        
        # Commit all changes
        logger.info(f"About to commit all changes...")
        db.commit()
        logger.info(f"✓ COMMIT SUCCESSFUL - Company ID: {company.id}, User ID: {user.id}")
        print(f"✓ COMMIT SUCCESSFUL - Company ID: {company.id}, User ID: {user.id}")
        
        # Verify the company was saved by querying again
        db.refresh(company)  # Refresh the object from database
        verification_company = db.query(Company).filter(Company.id == company.id).first()
        if verification_company:
            logger.info(f"✅ Verification: Company '{verification_company.name}' exists in database")
            print(f"✅ Verification: Company '{verification_company.name}' exists in database")
        else:
            logger.error("❌ Verification failed: Company not found in database after creation")
            print("❌ Verification failed: Company not found in database after creation")
        
        return company.id, user.id
        
    except HTTPException as he:
        logger.error(f"✗ HTTPException in create_company_and_user_records: {he.detail}")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"✗ Exception in create_company_and_user_records: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        db.rollback()
        print(f"Error creating records: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create records: {str(e)}"
        )
    finally:
        db.close()
        logger.info(f"=== Finished create_company_and_user_records ===")

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

@router.get("/status")
def get_onboarding_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Check if onboarding is needed - always allow new companies"""
    try:
        company_count = db.query(Company).filter(Company.status == 'active').count()
        # Always allow onboarding for new companies
        onboarding_required = True
        print(f"Found {company_count} active companies, onboarding always available")
        
        return {
            "onboarding_required": onboarding_required,
            "timestamp": int(time.time()),
            "existing_companies": company_count
        }
    except Exception as e:
        print(f"Error checking onboarding status: {e}")
        return {
            "onboarding_required": True,
            "timestamp": int(time.time())
        }


@router.post("/complete", status_code=status.HTTP_201_CREATED)
def complete_onboarding(data: OnboardingData):
    """Complete the onboarding process - creates company database, tables, and user records"""
    logger.info(f"🚀 Starting onboarding for company: {data.company.company_name}")
    print(f"🚀 Starting onboarding for company: {data.company.company_name}")
    
    try:
        # Step 1: Create company database
        logger.info("📊 Step 1: Creating company database...")
        database_name = create_company_database(data.company.company_name)
        logger.info(f"✅ Created database: {database_name}")
        
        # Step 2: Create tables in company database
        logger.info("📋 Step 2: Creating tables in company database...")
        create_company_tables(database_name)
        logger.info(f"✅ Created tables in database: {database_name}")
        
        # Step 3: Create company and user records in main database
        logger.info("👤 Step 3: Creating company and user records...")
        company_id, user_id = create_company_and_user_records(data, database_name)
        logger.info(f"✅ Created company (ID: {company_id}) and user (ID: {user_id})")
        
        # Step 4: Generate access token
        logger.info("🔑 Step 4: Generating access token...")
        access_token = create_access_token(
            data={"sub": str(user_id), "company_id": str(company_id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        logger.info("✅ Access token generated")
        
        logger.info("🎉 Onboarding completed successfully!")
        print("🎉 Onboarding completed successfully!")
        
        return {
            "status": "success",
            "message": "Onboarding completed successfully",
            "access_token": access_token,
            "token_type": "bearer",
            "company_id": company_id,
            "user_id": user_id,
            "database_name": database_name,
            "company_name": data.company.company_name,
            "username": data.admin_user.username
        }
        
    except HTTPException as he:
        logger.error(f"❌ HTTPException during onboarding: {he.detail}")
        print(f"❌ HTTPException during onboarding: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"❌ Onboarding failed: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        print(f"❌ Onboarding failed: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Onboarding failed: {str(e)}"
        )