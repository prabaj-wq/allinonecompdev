import os
import time
import logging
import json
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Request, status, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
    max_age=600,  # 10 minutes
)

# Add trusted hosts middleware
allowed_hosts = [
    host.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]
    for host in settings.allowed_origins
    if host.startswith(('http://', 'https://'))
]

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=allowed_hosts if settings.is_production else ["*"],
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

# Import routers after middleware setup
from routers import (
    auth, users, onboarding, roles, entities, accounts, 
    company_management, dashboard, fst, trial_balance, consolidation, 
    ifrs_accounts, custom_axes, hierarchies, database_management, 
    upload, process, financial_statements, assets, audit, 
    budget, backup_restore, business_tools, axes_entity, axes_account, sql, role_management
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
                            "userDisplayName": user_data[0]
                        }
            except Exception as e:
                print(f"Error decoding token: {e}")
        
        # Fallback: try to get the most recent company and user
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
            ORDER BY u.created_at DESC 
            LIMIT 1
        """)
        
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
                "userDisplayName": user_data[0]
            }
        
    except Exception as e:
        print(f"Error getting user info: {e}")
    
    # Final fallback
    return {
        "username": "admin",
        "email": "admin@company.com",
        "company_name": "Default Company",
        "user_id": 1,
        "is_active": True,
        "display_name": "admin",
        "name": "admin",
        "user": "admin",
        "firstName": "admin",
        "lastName": "",
        "fullName": "admin",
        "role": "admin",
        "userRole": "admin",
        "userType": "admin",
        "accountType": "admin",
        "displayName": "admin",
        "loginName": "admin",
        "userName": "admin",
        "userDisplayName": "admin"
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