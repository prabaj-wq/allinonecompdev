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
        
        # Also create role management tables in epm_tool database
        if database_name != "epm_tool":
            print("Creating role management tables in epm_tool database...")
            epm_db_url = f"postgresql://{db_params['user']}:{encoded_password}@{db_params['host']}:{db_params['port']}/epm_tool"
            epm_engine = create_engine(epm_db_url, echo=True)
            
            # Import the ensure function from role_management
            from routers.role_management import ensure_role_management_tables
            import psycopg2
            from psycopg2.extras import RealDictCursor
            
            # Create connection and ensure tables
            epm_conn = psycopg2.connect(
                host=db_params['host'],
                database="epm_tool",
                user=db_params['user'],
                password=db_params['password'],
                port=db_params['port']
            )
            epm_cur = epm_conn.cursor(cursor_factory=RealDictCursor)
            ensure_role_management_tables(epm_cur)
            epm_conn.commit()
            epm_cur.close()
            epm_conn.close()
            print("Role management tables created in epm_tool database")
        
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
        
        # Create admin role and permissions for the first user
        logger.info("Creating admin role and permissions...")
        try:
            create_admin_role_and_permissions(company.id, user.id, database_name)
            logger.info("✅ Admin role and permissions created successfully")
        except Exception as role_error:
            logger.warning(f"⚠️ Failed to create admin role: {role_error}")
            # Don't fail the onboarding if role creation fails
            pass
        
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

def create_admin_role_and_permissions(company_id: int, user_id: int, database_name: str):
    """Create admin role and assign full permissions to the first user"""
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        db_params = get_db_connection_params()
        
        # Connect to epm_tool database for role management
        conn = psycopg2.connect(
            host=db_params['host'],
            database="epm_tool",
            user=db_params['user'],
            password=db_params['password'],
            port=db_params['port']
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Ensure role management tables exist
        from routers.role_management import ensure_role_management_tables
        ensure_role_management_tables(cur)
        
        # Create Super Admin role with full permissions
        admin_role_data = {
            'name': 'Super Admin',
            'description': 'Full system administrator with all permissions',
            'page_permissions': {
                '/dashboard': True,
                '/process': True,
                '/fiscal-management': True,
                '/axes-entity': True,
                '/axes-accounts': True,
                '/custom-axes': True,
                '/database-management': True,
                '/role-management': True,
                '/user-management': True,
                '/reports': True,
                '/settings': True,
                '/audit-logs': True,
                '/system-integration': True,
                '/backup-restore': True,
                '/company-management': True
            },
            'database_permissions': {
                database_name: {
                    'read': True,
                    'write': True,
                    'execute': True,
                    'admin': True
                }
            },
            'is_active': True,
            'created_by': 'system',
            'company': database_name
        }
        
        # Insert admin role
        cur.execute("""
            INSERT INTO roles (name, description, page_permissions, database_permissions, is_active, created_by, company, created_at, updated_at)
            VALUES (%(name)s, %(description)s, %(page_permissions)s, %(database_permissions)s, %(is_active)s, %(created_by)s, %(company)s, NOW(), NOW())
            RETURNING id
        """, {
            'name': admin_role_data['name'],
            'description': admin_role_data['description'],
            'page_permissions': json.dumps(admin_role_data['page_permissions']),
            'database_permissions': json.dumps(admin_role_data['database_permissions']),
            'is_active': admin_role_data['is_active'],
            'created_by': admin_role_data['created_by'],
            'company': admin_role_data['company']
        })
        
        role_result = cur.fetchone()
        admin_role_id = role_result['id']
        
        # Assign role to user
        cur.execute("""
            INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
            VALUES (%s, %s, %s, NOW(), TRUE)
            ON CONFLICT (user_id, role_id) DO UPDATE SET is_active = TRUE, assigned_at = NOW()
        """, (user_id, admin_role_id, 'system'))
        
        # Create user permissions record with full access
        user_permissions = {
            'page_permissions': admin_role_data['page_permissions'],
            'database_permissions': admin_role_data['database_permissions'],
            'role_permissions': admin_role_data['page_permissions'],
            'temporary_access': {},
            'custom_permissions': {}
        }
        
        cur.execute("""
            INSERT INTO user_permissions (user_id, permissions, role_id, updated_by, updated_at, company)
            VALUES (%s, %s, %s, %s, NOW(), %s)
            ON CONFLICT (user_id) DO UPDATE SET 
                permissions = EXCLUDED.permissions,
                role_id = EXCLUDED.role_id,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
        """, (user_id, json.dumps(user_permissions), admin_role_id, 'system', database_name))
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"✅ Created Super Admin role (ID: {admin_role_id}) and assigned to user {user_id}")
        
    except Exception as e:
        logger.error(f"❌ Error creating admin role: {str(e)}")
        raise

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

@router.post("/fix-admin-permissions")
def fix_existing_admin_permissions():
    """Fix admin permissions for existing users who should be admins"""
    try:
        db = SessionLocal()
        
        # Get all companies and their first users (who should be admins)
        companies = db.query(Company).filter(Company.status == 'active').all()
        
        fixed_users = []
        
        for company in companies:
            # Get the first user for this company (should be admin)
            first_user = db.query(User).filter(
                User.company_id == company.id
            ).order_by(User.id.asc()).first()
            
            if first_user:
                # Make sure they're marked as superuser
                if not first_user.is_superuser:
                    first_user.is_superuser = True
                    db.commit()
                
                # Create admin role and permissions
                try:
                    create_admin_role_and_permissions(company.id, first_user.id, company.code)
                    fixed_users.append({
                        'company': company.name,
                        'user': first_user.username,
                        'user_id': first_user.id
                    })
                except Exception as role_error:
                    logger.warning(f"Failed to create admin role for {first_user.username}: {role_error}")
        
        db.close()
        
        return {
            "status": "success",
            "message": f"Fixed admin permissions for {len(fixed_users)} users",
            "fixed_users": fixed_users
        }
        
    except Exception as e:
        logger.error(f"Error fixing admin permissions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fix admin permissions: {str(e)}"
        )