import os
import time
import logging
import json
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional
import secrets
from datetime import datetime, timedelta

from fastapi import FastAPI, Request, status, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from starlette.middleware.sessions import SessionMiddleware

from database import engine, Base, get_db
from config import settings
import logging

# Configure logger
logger = logging.getLogger(__name__)

# Initialize FastAPI with lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.APP_NAME} in {settings.ENVIRONMENT.upper()} mode")
    logger.info(f"Frontend URL: {settings.FRONTEND_URL}")
    logger.info(f"Database URL: {settings.DATABASE_URL}")
    logger.info(f"Allowed origins: {settings.allowed_origins}")
    
    # Create necessary directories
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Initialize database
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version="1.0.0",
        description="Backend API for All in One Company Application",
        routes=app.routes,
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    # Add security to all endpoints
    for path in openapi_schema.get("paths", {}).values():
        for method in path.values():
            if method.get("operationId") not in ["login_access_token", "read_root", "health_check"]:
                method["security"] = [{"OAuth2PasswordBearer": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for All in One Company Application",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,  # Disable default docs
    redoc_url=None,  # Disable default redoc
    openapi_url="/api/openapi.json" if not settings.is_production else None,
)

# Custom docs and redoc endpoints
@app.get("/api/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    if settings.is_production:
        raise HTTPException(status_code=404, detail="Not Found")
    return get_swagger_ui_html(
        openapi_url="/api/openapi.json",
        title=f"{settings.APP_NAME} - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="/static/swagger-ui-bundle.js",
        swagger_css_url="/static/swagger-ui.css",
    )

@app.get("/api/redoc", include_in_schema=False)
async def redoc_html():
    if settings.is_production:
        raise HTTPException(status_code=404, detail="Not Found")
    return get_redoc_html(
        openapi_url="/api/openapi.json",
        title=f"{settings.APP_NAME} - ReDoc",
        redoc_js_url="/static/redoc.standalone.js",
    )

# Set the custom OpenAPI schema
app.openapi = custom_openapi

# Add middleware for security and performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configure CORS - Flexible origin handling
cors_origins = settings.BACKEND_CORS_ORIGINS
allow_credentials = True

# If using wildcard (*), we need to disable credentials for security
if "*" in cors_origins:
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
    max_age=600,  # 10 minutes
)

# Add trusted hosts middleware
if "*" not in cors_origins:
    allowed_hosts = [
        host.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]
        for host in cors_origins
        if host.startswith(('http://', 'https://'))
    ]
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=allowed_hosts,
    )
else:
    # Allow all hosts when using wildcard CORS
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"],
    )

# Add session middleware if needed
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    session_cookie=settings.SESSION_COOKIE_NAME,
    max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # in seconds
    same_site="lax",
    https_only=settings.SECURE_COOKIES,
)

# Force HTTPS in production
if settings.is_production:
    app.add_middleware(HTTPSRedirectMiddleware)
    
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        security_headers = {
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self';",
        }
        
        for header, value in security_headers.items():
            response.headers[header] = value
            
        return response

# Page access control middleware
@app.middleware("http")
async def check_page_permissions(request: Request, call_next):
    """Check if user has permission to access the requested page"""
    
    # Skip permission check for certain endpoints
    skip_paths = [
        "/api/auth/",
        "/api/onboarding/",
        "/api/user-info",
        "/api/companies",
        "/api/role-management/login",
        "/api/role-management/user-info",
        "/api/role-management/logout",
        "/api/health",
        "/",
        "/docs",
        "/redoc",
        "/openapi.json"
    ]
    
    # Check if path should be skipped
    path = request.url.path
    if any(path.startswith(skip_path) for skip_path in skip_paths):
        return await call_next(request)
    
    # Get session from cookies
    session_id = request.cookies.get('session_id')
    if not session_id or session_id not in sessions:
        # For API endpoints, return 401
        if path.startswith('/api/'):
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication required", "requires_login": True}
            )
        # For other paths, let them through (frontend will handle)
        return await call_next(request)
    
    session = sessions[session_id]
    
    # Only allow access for actual admin username, not role-based
    if session.get('username') == 'admin':
        return await call_next(request)
    
    # For regular users, check page permissions
    user_id = session.get('user_id')
    company_name = session.get('company_name')
    
    if user_id and company_name:
        # Get user's page permissions from database
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "postgres"),
                database=os.getenv("DB_NAME", "epm_tool"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "epm_password"),
                port=os.getenv("DB_PORT", "5432")
            )
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get user's permissions from user_profiles
            cur.execute("""
                SELECT up.permissions, r.page_permissions as role_permissions
                FROM user_profiles up
                LEFT JOIN custom_roles r ON up.role_id = r.id
                WHERE up.user_id = %s AND up.company_id = %s
            """, (user_id, company_name))
            
            user_perms = cur.fetchone()
            cur.close()
            conn.close()
            
            if user_perms:
                # Parse permissions
                user_permissions = user_perms.get('permissions', {})
                role_permissions = user_perms.get('role_permissions', {})
                
                if isinstance(user_permissions, str):
                    import json
                    user_permissions = json.loads(user_permissions)
                if isinstance(role_permissions, str):
                    import json
                    role_permissions = json.loads(role_permissions)
                
                # Get page permissions
                page_perms = user_permissions.get('page_permissions', {})
                role_page_perms = role_permissions if isinstance(role_permissions, dict) else {}
                
                # Combine permissions (user permissions override role permissions)
                combined_perms = {**role_page_perms, **page_perms}
                
                # Map API paths to page permissions
                page_mappings = {
                    '/api/role-management/': '/rolemanagement',
                    '/api/accounts/': '/accounts',
                    '/api/entities/': '/entities',
                    '/api/consolidation/': '/consolidation',
                    '/api/financial-statements/': '/financial-statements',
                    '/api/trial-balance/': '/trial-balance',
                    '/api/analytics/': '/real-time-analytics',
                    '/api/audit/': '/audit',
                    '/api/etl/': '/etl',
                    '/api/process/': '/process',
                    '/api/tax/': '/tax-management',
                    '/api/journal/': '/journal-entries',
                    '/api/reports/': '/reports',
                    '/api/axes/': '/axes',
                    '/api/axes-entity/': '/entity',
                    '/api/axes-account/': '/accounts',
                    '/api/ifrs-accounts/': '/accounts'
                }
                
                # Check if user has permission for this path
                for api_path, page_path in page_mappings.items():
                    if path.startswith(api_path):
                        if not combined_perms.get(page_path, False):
                            return JSONResponse(
                                status_code=403,
                                content={
                                    "detail": f"Access denied to {page_path}. Contact administrator for access.",
                                    "requires_permission": True,
                                    "page": page_path,
                                    "user_permissions": combined_perms
                                }
                            )
                        break
                
        except Exception as e:
            print(f"Error checking permissions: {e}")
            # On error, allow access but log it
    
    # Special check for role management (most restrictive)
    if path.startswith('/api/role-management/') and path not in ['/api/role-management/login', '/api/role-management/user-info', '/api/role-management/logout']:
        # Only superadmin can access role management
        return JSONResponse(
            status_code=403,
            content={
                "detail": "Access denied. Only administrators can access role management.",
                "requires_permission": True,
                "page": "role-management"
            }
        )
    
    # For other API endpoints, check user permissions from database
    if path.startswith('/api/'):
        try:
            # Get user permissions from database
            import psycopg2
            from psycopg2.extras import RealDictCursor
            
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "postgres"),
                database=os.getenv("DB_NAME", "epm_tool"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "epm_password"),
                port=os.getenv("DB_PORT", "5432")
            )
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get user's permissions
            cur.execute("""
                SELECT up.permissions, up.role_id, r.page_permissions
                FROM user_profiles up
                LEFT JOIN custom_roles r ON up.role_id = r.id
                WHERE up.user_id = %s AND up.company_id = %s
            """, (session.get('user_id'), session.get('company_name')))
            
            user_permissions = cur.fetchone()
            cur.close()
            conn.close()
            
            if user_permissions:
                # Parse permissions
                user_perms = json.loads(user_permissions['permissions']) if user_permissions['permissions'] else {}
                role_perms = json.loads(user_permissions['page_permissions']) if user_permissions['page_permissions'] else {}
                
                # Combine permissions
                page_permissions = user_perms.get('page_permissions', {})
                role_page_permissions = role_perms if isinstance(role_perms, dict) else {}
                combined_permissions = {**role_page_permissions, **page_permissions}
                
                # Map API paths to page permissions
                page_mappings = {
                    '/api/accounts': '/accounts',
                    '/api/entities': '/entities',
                    '/api/consolidation': '/consolidation',
                    '/api/financial-statements': '/financial-statements',
                    '/api/fst': '/fst-items',
                    '/api/trial-balance': '/trial-balance',
                    '/api/dashboard': '/dashboard',
                    '/api/audit': '/audit',
                    '/api/database-management': '/database-management',
                    '/api/system-management': '/system-management'
                }
                
                # Check if user has permission for this API path
                for api_path, page_path in page_mappings.items():
                    if path.startswith(api_path):
                        if not combined_permissions.get(page_path, False):
                            return JSONResponse(
                                status_code=403,
                                content={
                                    "detail": f"Access denied. You don't have permission to access {page_path}.",
                                    "requires_permission": True,
                                    "page": page_path.replace('/', ''),
                                    "can_request_access": True
                                }
                            )
                        break
            
        except Exception as e:
            print(f"Error checking permissions: {e}")
            # If there's an error checking permissions, allow access but log it
            pass
    
    return await call_next(request)

# Session management (simple in-memory for demo, can be enhanced with Redis)
sessions = {}

def create_session(company_name: str, username: str, user_id: int = None, role: str = "user") -> str:
    """Create a new session"""
    session_id = secrets.token_urlsafe(32)
    sessions[session_id] = {
        'company_name': company_name,
        'username': username,
        'user_id': user_id,
        'role': role,
        'created_at': datetime.now(),
        'expires_at': datetime.now() + timedelta(hours=8)  # 8 hour session
    }
    return session_id

def get_session(session_id: str) -> Optional[dict]:
    """Get session data if valid"""
    if session_id not in sessions:
        return None
    
    session = sessions[session_id]
    if datetime.now() > session['expires_at']:
        del sessions[session_id]
        return None
    
    return session

def verify_credentials(company_name: str, username: str, password: str) -> Optional[dict]:
    """Verify user credentials and return user data"""
    try:
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
        main_cur.execute("SELECT name, code FROM companies WHERE name = %s AND status = 'active'", (company_name,))
        company_data = main_cur.fetchone()
        main_cur.close()
        main_conn.close()
        
        if not company_data:
            return None
        
        # Connect to company-specific database first
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        user_data = None
        
        try:
            company_conn = psycopg2.connect(
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                database=company_db_name
            )
            
            company_cur = company_conn.cursor()
            company_cur.execute("SELECT id, username, email, password_hash FROM users WHERE username = %s", (username,))
            user_data = company_cur.fetchone()
            company_cur.close()
            company_conn.close()
                
        except Exception as e:
            print(f"Company database error: {e}")
        
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
                    SELECT u.id, u.username, u.email, u.password_hash, u.is_superuser
                    FROM users u 
                    JOIN companies c ON u.company_id = c.id 
                    WHERE u.username = %s AND c.name = %s
                """, (username, company_name))
                user_data = main_cur.fetchone()
                main_cur.close()
                main_conn.close()
            except Exception as e:
                print(f"Error checking main database: {e}")
        
        if not user_data:
            return None
        
        user_id, username_db, email, password_hash = user_data[:4]
        is_superuser = user_data[4] if len(user_data) > 4 else False
        
        # Verify password
        if not verify_password(password, password_hash):
            return None
        
        return {
            'user_id': user_id,
            'username': username_db,
            'email': email,
            'company_name': company_name,
            'is_superuser': is_superuser,
            'role': 'admin' if is_superuser else 'user'
        }
        
    except Exception as e:
        print(f"Error verifying credentials: {e}")
        return None

# Import routers after middleware setup
from routers import (
    auth, users, onboarding, roles, entities, accounts, 
    company_management, dashboard, fst, trial_balance, consolidation, 
    ifrs_accounts, custom_axes, hierarchies, database_management, database_info,
    upload, process, financial_statements, assets, audit, 
    budget, backup_restore, business_tools, axes_entity, axes_account, sql, role_management, fiscal, fiscal_management
)

# Include all routers with /api prefix
# All routers including SQL router should use the same prefix pattern
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(onboarding.router, prefix="/api")
app.include_router(roles.router, prefix="/api")
app.include_router(entities.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(ifrs_accounts.router, prefix="/api")
app.include_router(custom_axes.router, prefix="/api")
app.include_router(hierarchies.router, prefix="/api")
app.include_router(database_management.router, prefix="/api")
app.include_router(database_info.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(process.router, prefix="/api")
app.include_router(company_management.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(fst.router, prefix="/api")
app.include_router(trial_balance.router, prefix="/api")
app.include_router(consolidation.router, prefix="/api")
app.include_router(financial_statements.router, prefix="/api")
app.include_router(assets.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(budget.router, prefix="/api")
app.include_router(backup_restore.router, prefix="/api")
app.include_router(business_tools.router, prefix="/api")
app.include_router(axes_entity.router, prefix="/api")
app.include_router(axes_account.router, prefix="/api")
app.include_router(sql.router, prefix="/api")
app.include_router(fiscal.router, prefix="/api")
app.include_router(fiscal_management.router, prefix="/api")
app.include_router(role_management.router)

# Add a specific route to check first install status
@app.get("/api/first-install-status")
@app.get("/first-install-status")
def get_first_install_status():
    """Check if this is the first installation"""
    first_install_file = "config/first_install.json"
    is_first_install = True
    if os.path.exists(first_install_file):
        try:
            import json
            with open(first_install_file, 'r') as f:
                data = json.load(f)
                is_first_install = data.get("first_install", True)
        except Exception as e:
            pass
    return {"first_install": is_first_install}

# Test endpoint to check if axes-entity router is working
@app.get("/api/axes-entity-test")
def test_axes_entity():
    """Test endpoint for axes entity"""
    return {"message": "Axes entity router is working", "status": "ok"}

# Add companies endpoint at /api/companies (without auth prefix)
@app.get("/api/companies")
def get_companies_direct(request: Request):
    """Get current user's company only - direct endpoint"""
    try:
        import psycopg2
        
        # Try to get user's company from token
        authorization = request.headers.get("authorization")
        user_company = None
        
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            from jose import jwt
            try:
                payload = jwt.decode(token, "your-secret-key-change-in-production", algorithms=["HS256"])
                user_company = payload.get("company_name")
            except Exception as e:
                print(f"Error decoding token for companies: {e}")
        
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = 'root@123'
        
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database='epm_tool'
        )
        
        cur = conn.cursor()
        
        if user_company:
            # Return only the user's company
            cur.execute("SELECT name, code FROM companies WHERE name = %s AND status = 'active'", (user_company,))
        else:
            # Fallback: return the most recent company
            cur.execute("SELECT name, code FROM companies WHERE status = 'active' ORDER BY created_at DESC LIMIT 1")
            
        companies_data = cur.fetchall()
        cur.close()
        conn.close()
        
        companies = [{"name": company[0], "code": company[1]} for company in companies_data]
        
        return {"companies": companies}
            
    except Exception as e:
        logger.error(f"Error getting companies: {e}")
        return {"companies": []}

# Add user-info endpoint at /api/user-info (without auth prefix)
@app.get("/api/user-info")
def get_user_info_direct(request: Request):
    """Get user information - direct endpoint"""
    try:
        # Try to get user info from token if available
        authorization = request.headers.get("authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            from jose import jwt
            try:
                payload = jwt.decode(token, "your-secret-key-change-in-production", algorithms=["HS256"])
                username = payload.get("sub")
                company_name = payload.get("company_name")
                user_id = payload.get("user_id")
                
                if username and company_name:
                    # Get user details from database
                    import psycopg2
                    if os.getenv('DOCKER_ENV') == 'true':
                        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
                    else:
                        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
                        
                    conn = psycopg2.connect(
                        host=POSTGRES_HOST,
                        port=os.getenv('POSTGRES_PORT', '5432'),
                        user='postgres',
                        password='root@123',
                        database='epm_tool'
                    )
                    
                    cur = conn.cursor()
                    cur.execute("""
                        SELECT u.username, u.email, c.name, u.id, u.role
                        FROM users u 
                        JOIN companies c ON u.company_id = c.id 
                        WHERE u.username = %s AND c.name = %s
                    """, (username, company_name))
                    
                    user_data = cur.fetchone()
                    cur.close()
                    conn.close()
                    
                    if user_data:
                        return {
                            "username": user_data[0],
                            "email": user_data[1],
                            "company_name": user_data[2],
                            "user_id": user_data[3],
                            "role": user_data[4],
                            "is_active": True,
                            "display_name": user_data[0],
                            "name": user_data[0],
                            "user": user_data[0],
                            "firstName": user_data[0],
                            "lastName": "",
                            "fullName": user_data[0],
                            "userRole": user_data[4],
                            "userType": user_data[4],
                            "accountType": user_data[4],
                            "displayName": user_data[0],
                            "loginName": user_data[0],
                            "userName": user_data[0],
                            "userDisplayName": user_data[0],
                            "is_superuser": user_data[4] == 'admin'
                        }
            except Exception as e:
                print(f"Error decoding token: {e}")
        
        # Try to get user from session cookies
        session_id = request.cookies.get('session_id')
        if session_id:
            session = get_session(session_id)
            if session:
                return {
                    "authenticated": True,
                    "username": session['username'],
                    "email": session.get('email', ''),
                    "company_name": session['company_name'],
                    "user_id": session.get('user_id'),
                    "role": session.get('role', 'user'),
                    "is_active": True,
                    "display_name": session['username'],
                    "name": session['username'],
                    "user": session['username'],
                    "firstName": session['username'],
                    "lastName": "",
                    "fullName": session['username'],
                    "userRole": session.get('role', 'user'),
                    "userType": session.get('role', 'user'),
                    "accountType": session.get('role', 'user'),
                    "displayName": session['username'],
                    "loginName": session['username'],
                    "userName": session['username'],
                    "userDisplayName": session['username'],
                    "is_superuser": session.get('role') == 'admin'
                }
        
        # If no session, return unauthenticated
        return {
            "authenticated": False,
            "username": None,
            "email": None,
            "company_name": None,
            "user_id": None,
            "role": None,
            "is_active": False,
            "message": "No active session found"
        }
        
    except Exception as e:
        print(f"Error getting user info: {e}")
        return {
            "authenticated": False,
            "username": None,
            "email": None,
            "company_name": None,
            "user_id": None,
            "role": None,
            "is_active": False,
            "message": "Error getting user info"
        }

# Add hierarchies endpoint at /api/hierarchies (without auth prefix)
@app.get("/api/hierarchies")
def get_hierarchies_direct():
    """Get hierarchies - direct endpoint"""
    return {
        "hierarchies": [
            {
                "hierarchy_id": "H1",
                "hierarchy_name": "Main Hierarchy",
                "hierarchy_type": "Entity",
                "description": "Primary entity hierarchy"
            },
            {
                "hierarchy_id": "A1",
                "hierarchy_name": "Asset Hierarchy",
                "hierarchy_type": "Account",
                "description": "Asset account hierarchy"
            }
        ]
    }

# ===== ROLE MANAGEMENT AUTHENTICATION APIs =====
@app.post("/api/role-management/login")
async def role_management_login(request: Request):
    """Role Management specific login endpoint - uses same auth system as main app"""
    try:
        data = await request.json()
        company_name = data.get('company_name', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not all([company_name, username, password]):
            raise HTTPException(status_code=400, detail="Company name, username, and password are required")
        
        user_data = verify_credentials(company_name, username, password)
        if user_data:
            session_id = create_session(
                company_name=user_data['company_name'],
                username=user_data['username'],
                user_id=user_data['user_id'],
                role=user_data['role']
            )
            
            # Add app identifier to session
            if session_id in sessions:
                sessions[session_id]['app'] = 'role_management'
                sessions[session_id]['email'] = user_data['email']
                sessions[session_id]['is_superuser'] = user_data['is_superuser']
            
            response = JSONResponse({
                "success": True,
                "message": "Login successful",
                "user": {
                    "username": user_data['username'], 
                    "company_name": user_data['company_name'], 
                    "role": user_data['role'],
                    "is_superuser": user_data['is_superuser']
                }
            })
            response.set_cookie(
                key="session_id", 
                value=session_id, 
                httponly=True, 
                secure=False, 
                samesite="lax", 
                max_age=28800  # 8 hours
            )
            return response
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/role-management/user-info")
async def role_management_user_info(request: Request):
    """Get Role Management user information - uses same session system as main app"""
    try:
        session_id = request.cookies.get('session_id')
        if not session_id or session_id not in sessions:
            return JSONResponse({"authenticated": False, "user": None})
        
        session = sessions[session_id]
        if session.get('app') == 'role_management' or 'app' not in session:
            return JSONResponse({
                "authenticated": True,
                "user": {
                    "username": session['username'], 
                    "company_name": session['company_name'], 
                    "role": session.get('role', 'user'),
                    "is_superuser": session.get('is_superuser', False),
                    "user_id": session.get('user_id'),
                    "email": session.get('email', '')
                }
            })
        return JSONResponse({"authenticated": False, "user": None})
    except Exception as e:
        return JSONResponse({"authenticated": False, "user": None, "error": str(e)})

@app.post("/api/role-management/logout")
async def role_management_logout(request: Request):
    """Role Management logout endpoint - uses same session system as main app"""
    try:
        session_id = request.cookies.get('session_id')
        if session_id and session_id in sessions:
            del sessions[session_id]
        response = JSONResponse({"success": True, "message": "Logged out successfully"})
        response.delete_cookie("session_id")
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")

def check_if_first_install():
    """Check if this is the first installation by checking database for companies"""
    try:
        import psycopg2
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = 'root@123'
        
        # Connect to main database
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database='epm_tool'
        )
        
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM companies WHERE status = 'active'")
        company_count = cur.fetchone()[0]
        cur.close()
        conn.close()
        
        # If there are no active companies, this is a first install
        is_first_install = company_count == 0
        logger.info(f"Found {company_count} active companies, first install: {is_first_install}")
        return is_first_install
        
    except Exception as e:
        logger.info(f"Error checking companies for first install: {e}")
        # If there's an error connecting to database, assume first install
        return True

@app.on_event("startup")
def on_startup():
    """Initialize database tables when the application starts"""
    # Check if this is a first install by looking at the database
    is_first_install = check_if_first_install()
    
    # Skip automatic table creation - tables are created during onboarding/company creation
    if not is_first_install:
        logger.info("Existing companies found, skipping automatic table initialization (handled by company creation)")
    else:
        logger.info("First install detected, skipping database initialization until onboarding is complete")

@app.get("/")
def read_root():
    return {"message": "Enterprise Consolidation EPM Tool API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "The requested resource was not found"},
    )

@app.exception_handler(500)
async def server_error_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

# Health check endpoint with more detailed information
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": os.getenv('ENVIRONMENT', 'development'),
        "version": "1.0.0",
        "timestamp": time.time()
    }

# Root endpoint with API information
@app.get("/")
async def root():
    return {
        "message": "All in One Company API is running",
        "environment": os.getenv('ENVIRONMENT', 'development'),
        "docs": "/api/docs" if os.getenv('ENVIRONMENT') != 'production' else None,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment variable or use default
    port = int(os.getenv("PORT", "8000"))
    
    # Configure SSL if certificates are available
    ssl_keyfile = os.getenv("SSL_KEYFILE")
    ssl_certfile = os.getenv("SSL_CERTFILE")
    
    # Only enable reload in development
    reload = settings.is_development
    
    # Configure logging
    log_level = "info"
    if settings.DEBUG:
        log_level = "debug"
    elif settings.is_production:
        log_level = "warning"
    
    # Configure server
    server_config = {
        "app": "main:app",
        "host": "0.0.0.0",
        "port": port,
        "reload": reload,
        "log_level": log_level,
        "workers": 4 if settings.is_production else 1,
        "timeout_keep_alive": 30,
    }
    
    # Add SSL configuration if available
    if ssl_keyfile and ssl_certfile and os.path.exists(ssl_keyfile) and os.path.exists(ssl_certfile):
        server_config.update({
            "ssl_keyfile": ssl_keyfile,
            "ssl_certfile": ssl_certfile,
            "ssl_keyfile_password": os.getenv("SSL_KEYFILE_PASSWORD"),
        })
    
    # Start the server
    uvicorn.run(**server_config)