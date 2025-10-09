from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Annotated
import random
import traceback
import logging

from database import get_db, User, Company
from auth.utils import get_password_hash, authenticate_user, create_access_token
from auth.dependencies import get_current_active_user
from config import settings
from pydantic import BaseModel

# Define UserRole enum locally since it's not in the database.py file
from enum import Enum as PyEnum

class UserRole(str, PyEnum):
    ADMIN = "admin"
    USER = "user"

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Configure logging
logger = logging.getLogger(__name__)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: UserRole = UserRole.USER

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # For simplicity, we'll associate the user with the first company
    # In a real application, you would want to implement proper company selection
    company = db.query(Company).first()
    if not company:
        raise HTTPException(status_code=400, detail="No company found. Please complete onboarding first.")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        company_id=company.id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Add the missing user-info endpoint that the frontend expects
@router.get("/user-info")
def get_user_info():
    """Get user information including company details"""
    # For now, return a simple response since auth is handled by localStorage
    # This endpoint is called to verify if user is still authenticated
    return {
        "username": "admin",
        "email": "prasana@backo.fi",
        "company_name": "Backo",
        "user_id": 1,
        "is_active": True
    }

# Add company-based login endpoint that the frontend uses
class CompanyLogin(BaseModel):
    company_name: str
    username: str
    password: str

@router.post("/login-json")
def login_with_company(credentials: CompanyLogin):
    """Login with company name, username and password"""
    try:
        import os
        import psycopg2
        from auth.utils import verify_password
        
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'epm_password')
        
        # First, check if company exists in main database
        main_conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database='epm_tool'
        )
        
        main_cur = main_conn.cursor()
        main_cur.execute("SELECT name, code FROM companies WHERE name = %s AND status = 'active'", (credentials.company_name,))
        company_data = main_cur.fetchone()
        main_cur.close()
        main_conn.close()
        
        if not company_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Company not found"
            )
        
        # Connect to company-specific database
        company_db_name = credentials.company_name.lower().replace(' ', '_').replace('-', '_')
        
        user_data = None
        
        # Try company-specific database first
        try:
            company_conn = psycopg2.connect(
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                database=company_db_name
            )
            
            company_cur = company_conn.cursor()
            company_cur.execute("SELECT id, username, email, password_hash FROM users WHERE username = %s", (credentials.username,))
            user_data = company_cur.fetchone()
            company_cur.close()
            company_conn.close()
                
        except Exception as e:
            # Company database doesn't exist or users table doesn't exist, will try main database
            print(f"Company database error: {e}")
            pass
        
        # If not found in company database, try main database
        if not user_data:
            try:
                main_conn = psycopg2.connect(
                    host=POSTGRES_HOST,
                    port=POSTGRES_PORT,
                    user=POSTGRES_USER,
                    password=POSTGRES_PASSWORD,
                    database='epm_tool'
                )
                
                main_cur = main_conn.cursor()
                main_cur.execute("""
                    SELECT u.id, u.username, u.email, u.password_hash 
                    FROM users u 
                    JOIN companies c ON u.company_id = c.id 
                    WHERE u.username = %s AND c.name = %s
                """, (credentials.username, credentials.company_name))
                user_data = main_cur.fetchone()
                main_cur.close()
                main_conn.close()
            except Exception as e:
                print(f"Error checking main database: {e}")
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        user_id, username, email, password_hash = user_data
        
        # Verify password
        if not verify_password(credentials.password, password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": username,
                "company_name": credentials.company_name,
                "user_id": user_id
            },
            expires_delta=access_token_expires
        )
        
        return {
            "success": True,
            "message": "Login successful",
            "token": access_token,
            "company_name": credentials.company_name,
            "username": username,
            "user_id": user_id,
            "email": email
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/logout")
def logout():
    """Logout endpoint - mainly for frontend consistency"""
    return {"message": "Logged out successfully"}

# Add companies endpoint - accessible without auth
@router.get("/companies")
def get_companies(db: Session = Depends(get_db)):
    """Get list of available companies"""
    try:
        logger.info("🏢 Fetching companies from database using SQLAlchemy...")
        
        # Use SQLAlchemy to get companies (same as onboarding)
        companies_data = db.query(Company).filter(Company.status == 'active').order_by(Company.created_at.desc()).all()
        
        companies = [{
            "name": company.name, 
            "code": company.code,
            "environment_type": company.environment_type,
            "industry": company.industry,
            "status": company.status
        } for company in companies_data]
        
        logger.info(f"✅ Found {len(companies)} companies: {[c['name'] for c in companies]}")
        print(f"✅ Found {len(companies)} companies: {[c['name'] for c in companies]}")
        
        return {"companies": companies}
            
    except Exception as e:
        logger.error(f"❌ Error getting companies: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        print(f"❌ Error getting companies: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        # Return empty companies list if database query fails
        return {"companies": []}

@router.post("/create-default-user")
def create_default_user():
    """Create default admin user for Backo company"""
    try:
        import os
        import psycopg2
        import bcrypt
        
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'epm_password')
        
        # Connect to main database
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database='epm_tool'
        )
        
        cur = conn.cursor()
        
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE username = %s", ('admin',))
        if cur.fetchone():
            cur.close()
            conn.close()
            return {"message": "Default user already exists"}
        
        # Get company ID
        cur.execute("SELECT id FROM companies WHERE name = %s", ('Backo',))
        company_data = cur.fetchone()
        if not company_data:
            cur.close()
            conn.close()
            return {"error": "Company 'Backo' not found"}
        
        company_id = company_data[0]
        
        # Hash password
        password_hash = bcrypt.hashpw('admin@123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user
        cur.execute("""
            INSERT INTO users (username, email, password_hash, company_id, role, created_at)
            VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        """, ('admin', 'admin@backo.fi', password_hash, company_id, 'admin'))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {"message": "Default admin user created successfully"}
        
    except Exception as e:
        print(f"Error creating default user: {e}")
        return {"error": f"Failed to create default user: {str(e)}"}

# Role Management Endpoints
@router.get("/users")
def get_all_users(current_user: User = Depends(get_current_active_user)):
    """Get all users - Admin only"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        import os
        import psycopg2
        
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'epm_password')
        
        # Connect to main database
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database='epm_tool'
        )
        
        cur = conn.cursor()
        
        # Get all users with company information
        cur.execute("""
            SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at, u.last_login,
                   c.name as company_name
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            ORDER BY u.created_at DESC
        """)
        
        users_data = cur.fetchall()
        cur.close()
        conn.close()
        
        users = []
        for user_row in users_data:
            users.append({
                "id": user_row[0],
                "username": user_row[1],
                "email": user_row[2],
                "role": user_row[3],
                "is_active": user_row[4],
                "created_at": user_row[5].isoformat() if user_row[5] else None,
                "last_login": user_row[6].isoformat() if user_row[6] else None,
                "company": user_row[7]
            })
        
        return {"users": users}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int, 
    status_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Update user status - Admin only"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        import os
        import psycopg2
        
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'epm_password')
        
        # Connect to main database
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database='epm_tool'
        )
        
        cur = conn.cursor()
        
        # Update user status
        new_status = status_data.get('status', True)
        cur.execute("""
            UPDATE users 
            SET is_active = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (new_status, user_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {"message": f"User status updated to {'active' if new_status else 'inactive'}"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user status: {str(e)}"
        )

@router.post("/verify")
def verify_token(current_user: User = Depends(get_current_active_user)):
    """Verify JWT token and return user info"""
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "company": getattr(current_user, 'company_name', 'Unknown')
        }
    }