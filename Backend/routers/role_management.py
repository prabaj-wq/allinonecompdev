"""
Role Management API Router
Handles all role management operations including users, roles, permissions, audit logs, and access requests
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import os
import secrets
import string

router = APIRouter(prefix="/api/role-management", tags=["role-management"])

# Import database dependencies
from database import get_db, User, Company
from sqlalchemy.orm import Session

# Mock function to replace get_company_connection for now
def get_company_connection(company_name):
    """Mock database connection - not used in updated endpoints"""
    pass

# Pydantic Models
class RoleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    page_permissions: Dict[str, bool] = Field(default_factory=dict)
    database_permissions: Dict[str, Any] = Field(default_factory=dict)
    company: Optional[str] = None

class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    permissions: Optional[Dict[str, List[str]]] = None
    is_active: Optional[bool] = None

class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=6)
    is_active: bool = True
    role_id: Optional[int] = None  # Allow role assignment during user creation
    database_access: List[str] = Field(default_factory=list)  # List of database names
    permissions: Dict[str, List[str]] = Field(default_factory=dict)  # Custom permissions
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    temporary_password: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r'^[^@]+@[^@]+\.[^@]+$')
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    role_id: Optional[int] = None
    is_active: Optional[bool] = None

class AccessRequestCreate(BaseModel):
    requested_module: str = Field(min_length=1)
    requested_page: str = Field(min_length=1)
    requested_permissions: List[str] = Field(default_factory=list)
    reason: str = Field(min_length=10)
    urgency: str = Field(default="normal", pattern=r'^(low|normal|high|critical)$')
    business_justification: Optional[str] = None

class AccessRequestReview(BaseModel):
    status: str = Field(pattern=r'^(approved|rejected)$')
    review_reason: Optional[str] = None

class AuditLogCreate(BaseModel):
    action: str
    resource: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[str] = None
    status: str = Field(default="success", pattern=r'^(success|failed|warning)$')

class SystemIntegrationUpdate(BaseModel):
    status: str = Field(pattern=r'^(connected|warning|error|disconnected)$')
    health_percentage: int = Field(ge=0, le=100)
    config: Optional[Dict[str, Any]] = None

# Helper Functions
def log_audit_event(company_name: str, username: str, action: str, resource: str = None, 
                   resource_id: str = None, details: str = None, status: str = "success", 
                   ip_address: str = None, user_agent: str = None, device_type: str = None):
    """Log an audit event to the main epm_tool database"""
    try:
        # Use main database connection instead of company-specific
        
        # Connect to main epm_tool database
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor()
        
        # Create audit_logs table if it doesn't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS role_management_audit_logs (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                action VARCHAR(255) NOT NULL,
                resource VARCHAR(255),
                resource_id VARCHAR(255),
                details TEXT,
                ip_address INET,
                user_agent TEXT,
                device_type VARCHAR(100),
                company_id VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'success',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                session_id VARCHAR(255),
                risk_level VARCHAR(20) DEFAULT 'low'
            )
        """)
        
        # Determine device type from user agent
        if not device_type and user_agent:
            user_agent_lower = user_agent.lower()
            if 'mobile' in user_agent_lower or 'android' in user_agent_lower or 'iphone' in user_agent_lower:
                device_type = 'Mobile'
            elif 'tablet' in user_agent_lower or 'ipad' in user_agent_lower:
                device_type = 'Tablet'
            else:
                device_type = 'Desktop'
        
        # Determine risk level based on action
        risk_level = 'low'
        high_risk_actions = ['User Deleted', 'Role Deleted', 'Permission Modified', 'Access Granted', 'Login Failed']
        medium_risk_actions = ['User Created', 'Role Created', 'Password Changed', 'Access Requested']
        
        if action in high_risk_actions:
            risk_level = 'high'
        elif action in medium_risk_actions:
            risk_level = 'medium'
        
        cur.execute("""
            INSERT INTO role_management_audit_logs 
            (username, action, resource, resource_id, details, ip_address, user_agent, 
             device_type, company_id, status, timestamp, risk_level)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (username, action, resource, resource_id, details, ip_address, 
              user_agent, device_type, company_name, status, datetime.now(), risk_level))
        
        conn.commit()
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Failed to log audit event: {e}")

def get_client_info(request: Request):
    """Extract client IP and user agent from request"""
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent", "")
    return ip_address, user_agent

# Role Management Endpoints
@router.get("/system-modules")
async def get_system_modules(company_name: str = Query(...)):
    """Get all system modules and tabs for permission assignment"""
    try:
        modules = {
            "core_system": {
                "name": "Core System",
                "icon": "settings",
                "tabs": [
                    {"id": "dashboard", "name": "Dashboard", "description": "Main dashboard access"},
                    {"id": "user_management", "name": "User Management", "description": "Manage users and profiles"},
                    {"id": "company_settings", "name": "Company Settings", "description": "Company configuration"},
                    {"id": "system_logs", "name": "System Logs", "description": "View system logs"}
                ]
            },
            "financial_planning": {
                "name": "Financial Planning",
                "icon": "calculator",
                "tabs": [
                    {"id": "budget_planning", "name": "Budget Planning", "description": "Create and manage budgets"},
                    {"id": "forecasting", "name": "Forecasting", "description": "Financial forecasting tools"},
                    {"id": "variance_analysis", "name": "Variance Analysis", "description": "Budget vs actual analysis"}
                ]
            },
            "entity_management": {
                "name": "Entity Management", 
                "icon": "building",
                "tabs": [
                    {"id": "entity_hierarchy", "name": "Entity Hierarchy", "description": "Manage entity structures"},
                    {"id": "entity_data", "name": "Entity Data", "description": "Entity master data"},
                    {"id": "consolidation_rules", "name": "Consolidation Rules", "description": "Define consolidation logic"}
                ]
            },
            "account_management": {
                "name": "Account Management",
                "icon": "list",
                "tabs": [
                    {"id": "chart_of_accounts", "name": "Chart of Accounts", "description": "Manage account structures"},
                    {"id": "account_mapping", "name": "Account Mapping", "description": "Map accounts across entities"},
                    {"id": "account_reconciliation", "name": "Account Reconciliation", "description": "Account reconciliation tools"}
                ]
            },
            "reporting": {
                "name": "Reporting & Analytics",
                "icon": "bar-chart",
                "tabs": [
                    {"id": "financial_reports", "name": "Financial Reports", "description": "Standard financial reports"},
                    {"id": "custom_reports", "name": "Custom Reports", "description": "Build custom reports"},
                    {"id": "analytics_dashboard", "name": "Analytics Dashboard", "description": "Advanced analytics"}
                ]
            },
            "workflow": {
                "name": "Workflow & Approval",
                "icon": "workflow",
                "tabs": [
                    {"id": "approval_workflows", "name": "Approval Workflows", "description": "Manage approval processes"},
                    {"id": "task_management", "name": "Task Management", "description": "Track tasks and assignments"},
                    {"id": "notification_center", "name": "Notification Center", "description": "System notifications"}
                ]
            },
            "database_access": {
                "name": "Database Access",
                "icon": "database",
                "databases": [
                    {"id": "epm_tool", "name": "Main EPM Database", "permissions": ["read", "write", "execute"]},
                    {"id": "axes_entity", "name": "Entity Database", "permissions": ["read", "write", "execute"]},
                    {"id": "axes_account", "name": "Account Database", "permissions": ["read", "write", "execute"]},
                    {"id": "reporting_db", "name": "Reporting Database", "permissions": ["read", "execute"]},
                    {"id": "audit_db", "name": "Audit Database", "permissions": ["read"]}
                ]
            }
        }
        
        return {"modules": modules}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch system modules: {str(e)}")

@router.get("/roles")
async def get_roles(company_name: str = Query(...), 
                   search: Optional[str] = Query(None),
                   status_filter: Optional[str] = Query(None),
                   request: Request = None):
    """Get all roles for a company with enhanced filtering"""
    try:
        
        # Try to connect with better error handling
        try:
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "postgres"),
                database=os.getenv("DB_NAME", "epm_tool"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "epm_password"),
                port=os.getenv("DB_PORT", "5432"),
                connect_timeout=10
            )
        except psycopg2.OperationalError as e:
            print(f"PostgreSQL connection failed in get_roles: {e}")
            # Return empty roles list if database is not available
            return {"roles": []}
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Create roles table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS custom_roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                company_id VARCHAR(255) NOT NULL,
                page_permissions JSONB DEFAULT '{}',
                database_permissions JSONB DEFAULT '{}',
                permissions JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE,
                is_system_role BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                last_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                risk_level VARCHAR(20) DEFAULT 'low',
                UNIQUE(name, company_id)
            )
        """)
        
        # Create role permissions detailed table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS role_permissions_detailed (
                id SERIAL PRIMARY KEY,
                role_id INTEGER REFERENCES custom_roles(id) ON DELETE CASCADE,
                permission_type VARCHAR(50) NOT NULL, -- 'page' or 'database' or 'table'
                resource_name VARCHAR(255) NOT NULL, -- page path, database name, or table name
                parent_resource VARCHAR(255), -- database name for tables
                permission_level VARCHAR(50) NOT NULL, -- 'read', 'write', 'execute', 'full_access', 'access'
                granted BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255)
            )
        """)
        
        # Create user profiles table for role assignment
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                company_id VARCHAR(255) NOT NULL,
                role_id INTEGER REFERENCES custom_roles(id),
                permissions JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                login_count INTEGER DEFAULT 0,
                UNIQUE(user_id, company_id)
            )
        """)
        
        # Insert default roles if none exist
        cur.execute("SELECT COUNT(*) as count FROM custom_roles WHERE company_id = %s", [company_name])
        if cur.fetchone()['count'] == 0:
            default_roles = [
                {
                    "name": "Super Admin",
                    "description": "Full system access with all permissions",
                    "permissions": {"core_system": ["dashboard", "user_management", "company_settings", "system_logs"], "financial_planning": ["budget_planning", "forecasting", "variance_analysis"], "entity_management": ["entity_hierarchy", "entity_data", "consolidation_rules"], "account_management": ["chart_of_accounts", "account_mapping", "account_reconciliation"], "reporting": ["financial_reports", "custom_reports", "analytics_dashboard"], "workflow": ["approval_workflows", "task_management", "notification_center"]},
                    "database_permissions": {"epm_tool": ["read", "write", "execute"], "axes_entity": ["read", "write", "execute"], "axes_account": ["read", "write", "execute"], "reporting_db": ["read", "execute"], "audit_db": ["read"]},
                    "is_system_role": True,
                    "risk_level": "high"
                },
                {
                    "name": "Finance Manager", 
                    "description": "Financial planning and reporting access",
                    "permissions": {"core_system": ["dashboard"], "financial_planning": ["budget_planning", "forecasting", "variance_analysis"], "reporting": ["financial_reports", "custom_reports", "analytics_dashboard"]},
                    "database_permissions": {"epm_tool": ["read", "write"], "reporting_db": ["read", "execute"]},
                    "is_system_role": True,
                    "risk_level": "medium"
                },
                {
                    "name": "Analyst",
                    "description": "Read-only access to reports and analytics",
                    "permissions": {"core_system": ["dashboard"], "reporting": ["financial_reports", "analytics_dashboard"]},
                    "database_permissions": {"epm_tool": ["read"], "reporting_db": ["read"]},
                    "is_system_role": True,
                    "risk_level": "low"
                }
            ]
            
            for role in default_roles:
                cur.execute("""
                    INSERT INTO custom_roles (name, description, company_id, permissions, database_permissions, is_system_role, risk_level, created_by)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (role["name"], role["description"], company_name, json.dumps(role["permissions"]), 
                      json.dumps(role["database_permissions"]), role["is_system_role"], role["risk_level"], "system"))
        
        # Build query with filters
        query = """
            SELECT r.*, 
                   COUNT(up.id) as user_count,
                   MAX(up.last_login) as last_user_activity
            FROM custom_roles r
            LEFT JOIN user_profiles up ON r.id = up.role_id AND up.company_id = r.company_id
            WHERE r.company_id = %s
        """
        params = [company_name]
        
        if search:
            query += " AND (r.name ILIKE %s OR r.description ILIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
            
        if status_filter and status_filter != 'all':
            if status_filter == 'active':
                query += " AND r.is_active = TRUE"
            elif status_filter == 'inactive':
                query += " AND r.is_active = FALSE"
            elif status_filter == 'system':
                query += " AND r.is_system_role = TRUE"
            elif status_filter == 'custom':
                query += " AND r.is_system_role = FALSE"
        
        query += " GROUP BY r.id ORDER BY r.created_at DESC"
        
        cur.execute(query, params)
        roles = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {"roles": [dict(role) for role in roles]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch roles: {str(e)}")

@router.post("/roles")
async def create_role(role: RoleCreate, company_name: str = Query(...), 
                     username: str = Query("admin"), request: Request = None):
    """Create a new comprehensive role"""
    try:
        ip_address, user_agent = get_client_info(request) if request else (None, None)
        
        import psycopg2
        from psycopg2.extras import RealDictCursor
        import os
        
        # Try to connect to PostgreSQL with better error handling
        try:
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "postgres"),
                database=os.getenv("DB_NAME", "epm_tool"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "epm_password"),
                port=os.getenv("DB_PORT", "5432"),
                connect_timeout=10
            )
        except psycopg2.OperationalError as e:
            print(f"PostgreSQL connection failed: {e}")
            # Return a more user-friendly error message
            if "Connection refused" in str(e):
                raise HTTPException(
                    status_code=503, 
                    detail="Database server is not available. Please ensure PostgreSQL is running and try again."
                )
            else:
                raise HTTPException(
                    status_code=503,
                    detail=f"Database connection error: {str(e)}"
                )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Create tables if they don't exist (same as in get_roles)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS custom_roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                company_id VARCHAR(255) NOT NULL,
                page_permissions JSONB DEFAULT '{}',
                database_permissions JSONB DEFAULT '{}',
                permissions JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE,
                is_system_role BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                last_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                risk_level VARCHAR(20) DEFAULT 'low',
                UNIQUE(name, company_id)
            )
        """)
        
        # Create role permissions detailed table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS role_permissions_detailed (
                id SERIAL PRIMARY KEY,
                role_id INTEGER REFERENCES custom_roles(id) ON DELETE CASCADE,
                permission_type VARCHAR(50) NOT NULL, -- 'page' or 'database' or 'table'
                resource_name VARCHAR(255) NOT NULL, -- page path, database name, or table name
                parent_resource VARCHAR(255), -- database name for tables
                permission_level VARCHAR(50) NOT NULL, -- 'read', 'write', 'execute', 'full_access', 'access'
                granted BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255)
            )
        """)
        
        # Create user profiles table for role assignment
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                company_id VARCHAR(255) NOT NULL,
                role_id INTEGER REFERENCES custom_roles(id),
                permissions JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                login_count INTEGER DEFAULT 0,
                UNIQUE(user_id, company_id)
            )
        """)
        
        # Commit table creation
        conn.commit()
        
        # Check if role name already exists
        cur.execute("SELECT id FROM custom_roles WHERE name = %s AND company_id = %s", 
                   (role.name, company_name))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Role name already exists")
        
        # Determine risk level based on permissions
        risk_level = 'low'
        high_risk_pages = ['/rolemanagement', '/system-management', '/database-management', '/api-management']
        medium_risk_pages = ['/financial-statements', '/consolidation', '/etl', '/audit']
        
        enabled_pages = [page for page, enabled in role.page_permissions.items() if enabled]
        
        if any(page in high_risk_pages for page in enabled_pages):
            risk_level = 'high'
        elif any(page in medium_risk_pages for page in enabled_pages):
            risk_level = 'medium'
        
        # Also check database permissions for risk
        if role.database_permissions:
            for db_perms in role.database_permissions.values():
                if isinstance(db_perms, dict) and (db_perms.get('write') or db_perms.get('execute')):
                    if risk_level == 'low':
                        risk_level = 'medium'
                    elif risk_level == 'medium':
                        risk_level = 'high'
        
        # Create role
        cur.execute("""
            INSERT INTO custom_roles (name, description, company_id, page_permissions, database_permissions, risk_level, created_by, last_action)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (role.name, role.description, company_name, json.dumps(role.page_permissions), 
              json.dumps(role.database_permissions), risk_level, username, datetime.now()))
        
        new_role = cur.fetchone()
        
        # Ensure tables are committed before using them
        conn.commit()
        
        # Insert page permissions
        for page_path, granted in role.page_permissions.items():
            if granted:
                cur.execute("""
                    INSERT INTO role_permissions_detailed 
                    (role_id, permission_type, resource_name, permission_level, granted, created_by)
                    VALUES (%s, 'page', %s, 'access', %s, %s)
                """, (new_role['id'], page_path, granted, username))
        
        # Insert database and table permissions
        for db_name, db_perms in role.database_permissions.items():
            if isinstance(db_perms, dict):
                # Database-level permissions
                for perm_type in ['read', 'write', 'execute']:
                    if db_perms.get(perm_type):
                        cur.execute("""
                            INSERT INTO role_permissions_detailed 
                            (role_id, permission_type, resource_name, permission_level, granted, created_by)
                            VALUES (%s, 'database', %s, %s, %s, %s)
                        """, (new_role['id'], db_name, perm_type, True, username))
                
                # Table-level permissions
                if 'tables' in db_perms and isinstance(db_perms['tables'], dict):
                    for table_name, table_perms in db_perms['tables'].items():
                        if isinstance(table_perms, dict):
                            for perm_type in ['read', 'write', 'full_access']:
                                if table_perms.get(perm_type):
                                    cur.execute("""
                                        INSERT INTO role_permissions_detailed 
                                        (role_id, permission_type, resource_name, parent_resource, permission_level, granted, created_by)
                                        VALUES (%s, 'table', %s, %s, %s, %s, %s)
                                    """, (new_role['id'], table_name, db_name, perm_type, True, username))
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Log audit event
        log_audit_event(company_name, username, "Role Created", "Role", 
                      str(new_role['id']), f"Created role: {role.name} with risk level: {risk_level}", 
                      "success", ip_address, user_agent)
        
        return {"role": dict(new_role), "message": "Role created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create role: {str(e)}")

@router.get("/check-permission")
async def check_user_permission(
    user_id: int = Query(...),
    permission_type: str = Query(...), # 'page', 'database', 'table'
    resource_name: str = Query(...),
    permission_level: str = Query(...), # 'read', 'write', 'execute', 'access', 'full_access'
    parent_resource: Optional[str] = Query(None), # database name for table permissions
    company_name: str = Query(...)
):
    """Check if a user has a specific permission"""
    try:
        
        try:
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "postgres"),
                database=os.getenv("DB_NAME", "epm_tool"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "epm_password"),
                port=os.getenv("DB_PORT", "5432"),
                connect_timeout=5
            )
        except psycopg2.OperationalError:
            # If database is not available, return False for safety
            return {"has_permission": False, "reason": "Database not available"}
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get user's role
        cur.execute("""
            SELECT role_id FROM user_profiles 
            WHERE user_id = %s AND company_id = %s
        """, (user_id, company_name))
        
        user_profile = cur.fetchone()
        if not user_profile:
            return {"has_permission": False, "reason": "User profile not found"}
        
        # Check permission in detailed permissions table
        if parent_resource:
            # Table permission check
            cur.execute("""
                SELECT granted FROM role_permissions_detailed
                WHERE role_id = %s 
                AND permission_type = %s 
                AND resource_name = %s 
                AND parent_resource = %s
                AND permission_level = %s
            """, (user_profile['role_id'], permission_type, resource_name, parent_resource, permission_level))
        else:
            # Page or database permission check
            cur.execute("""
                SELECT granted FROM role_permissions_detailed
                WHERE role_id = %s 
                AND permission_type = %s 
                AND resource_name = %s 
                AND permission_level = %s
            """, (user_profile['role_id'], permission_type, resource_name, permission_level))
        
        permission = cur.fetchone()
        
        cur.close()
        conn.close()
        
        has_permission = permission['granted'] if permission else False
        
        return {
            "has_permission": has_permission,
            "user_id": user_id,
            "permission_type": permission_type,
            "resource_name": resource_name,
            "permission_level": permission_level,
            "parent_resource": parent_resource
        }
        
    except Exception as e:
        return {"has_permission": False, "reason": f"Error checking permission: {str(e)}"}

@router.post("/assign-role")
async def assign_role_to_user(
    user_id: int = Query(...),
    role_id: int = Query(...),
    company_name: str = Query(...),
    assigned_by: str = Query("admin"),
    request: Request = None
):
    """Assign a role to a user and apply all permissions"""
    try:
        
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get role details
        cur.execute("""
            SELECT * FROM custom_roles WHERE id = %s AND company_id = %s
        """, (role_id, company_name))
        
        role = cur.fetchone()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Create or update user profile
        cur.execute("""
            INSERT INTO user_profiles (user_id, company_id, role_id, permissions, updated_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id, company_id) 
            DO UPDATE SET 
                role_id = EXCLUDED.role_id,
                permissions = EXCLUDED.permissions,
                updated_at = EXCLUDED.updated_at
            RETURNING *
        """, (user_id, company_name, role_id, 
              json.dumps({"page_permissions": role['page_permissions'], "database_permissions": role['database_permissions']}),
              datetime.now()))
        
        user_profile = cur.fetchone()
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Log the role assignment
        ip_address, user_agent = get_client_info(request) if request else (None, None)
        log_audit_event(company_name, assigned_by, "Role Assigned", "User", 
                      str(user_id), f"Assigned role '{role['name']}' to user {user_id}", 
                      "success", ip_address, user_agent)
        
        return {
            "message": f"Role '{role['name']}' successfully assigned to user",
            "user_profile": dict(user_profile),
            "applied_permissions": {
                "pages": list(role['page_permissions'].keys()) if role['page_permissions'] else [],
                "databases": list(role['database_permissions'].keys()) if role['database_permissions'] else []
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign role: {str(e)}")

@router.get("/user-permissions/{user_id}")
async def get_user_permissions(
    user_id: int,
    company_name: str = Query(...)
):
    """Get all permissions for a specific user"""
    try:
        
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get user profile with role information
        cur.execute("""
            SELECT up.*, cr.name as role_name, cr.description as role_description,
                   cr.page_permissions, cr.database_permissions, cr.risk_level
            FROM user_profiles up
            LEFT JOIN custom_roles cr ON up.role_id = cr.id
            WHERE up.user_id = %s AND up.company_id = %s
        """, (user_id, company_name))
        
        user_profile = cur.fetchone()
        
        if not user_profile:
            return {
                "user_id": user_id,
                "has_role": False,
                "permissions": {},
                "message": "No role assigned to this user"
            }
        
        # Get detailed permissions
        cur.execute("""
            SELECT permission_type, resource_name, parent_resource, permission_level, granted
            FROM role_permissions_detailed
            WHERE role_id = %s
            ORDER BY permission_type, resource_name
        """, (user_profile['role_id'],))
        
        detailed_permissions = cur.fetchall()
        
        cur.close()
        conn.close()
        
        # Organize permissions by type
        organized_permissions = {
            "pages": {},
            "databases": {},
            "tables": {}
        }
        
        for perm in detailed_permissions:
            if perm['permission_type'] == 'page':
                organized_permissions['pages'][perm['resource_name']] = perm['granted']
            elif perm['permission_type'] == 'database':
                if perm['resource_name'] not in organized_permissions['databases']:
                    organized_permissions['databases'][perm['resource_name']] = {}
                organized_permissions['databases'][perm['resource_name']][perm['permission_level']] = perm['granted']
            elif perm['permission_type'] == 'table':
                if perm['parent_resource'] not in organized_permissions['tables']:
                    organized_permissions['tables'][perm['parent_resource']] = {}
                if perm['resource_name'] not in organized_permissions['tables'][perm['parent_resource']]:
                    organized_permissions['tables'][perm['parent_resource']][perm['resource_name']] = {}
                organized_permissions['tables'][perm['parent_resource']][perm['resource_name']][perm['permission_level']] = perm['granted']
        
        return {
            "user_id": user_id,
            "has_role": True,
            "role_name": user_profile['role_name'],
            "role_description": user_profile['role_description'],
            "risk_level": user_profile['risk_level'],
            "permissions": organized_permissions,
            "raw_permissions": {
                "page_permissions": user_profile['page_permissions'],
                "database_permissions": user_profile['database_permissions']
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user permissions: {str(e)}")

@router.get("/roles/{role_id}")
async def get_role_details(role_id: int, company_name: str = Query(...)):
    """Get detailed information about a specific role"""
    try:
        
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Create tables if they don't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS custom_roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                company_id VARCHAR(255) NOT NULL,
                page_permissions JSONB DEFAULT '{}',
                database_permissions JSONB DEFAULT '{}',
                permissions JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE,
                is_system_role BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                last_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                risk_level VARCHAR(20) DEFAULT 'low',
                UNIQUE(name, company_id)
            )
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                company_id VARCHAR(255) NOT NULL,
                role_id INTEGER REFERENCES custom_roles(id),
                permissions JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                login_count INTEGER DEFAULT 0,
                UNIQUE(user_id, company_id)
            )
        """)
        
        conn.commit()
        
        # Get role details (fixed query - removed up.username)
        cur.execute("""
            SELECT r.*, 
                   COUNT(up.id) as user_count,
                   MAX(up.last_login) as last_user_activity,
                   ARRAY_AGG(u.username) FILTER (WHERE u.username IS NOT NULL) as assigned_users
            FROM custom_roles r
            LEFT JOIN user_profiles up ON r.id = up.role_id AND up.company_id = r.company_id
            LEFT JOIN users u ON up.user_id = u.id
            WHERE r.id = %s AND r.company_id = %s
            GROUP BY r.id
        """, (role_id, company_name))
        
        role = cur.fetchone()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Get recent audit logs for this role
        cur.execute("""
            SELECT * FROM role_management_audit_logs 
            WHERE resource = 'Role' AND resource_id = %s AND company_id = %s
            ORDER BY timestamp DESC LIMIT 10
        """, (str(role_id), company_name))
        
        audit_logs = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {
            "role": dict(role),
            "audit_logs": [dict(log) for log in audit_logs]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch role details: {str(e)}")

@router.put("/roles/{role_id}")
async def update_role(role_id: int, role: RoleCreate, company_name: str = Query(...), 
                     username: str = Query("admin"), request: Request = None):
    """Update a role"""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Create tables if they don't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS custom_roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                company_id VARCHAR(255) NOT NULL,
                page_permissions JSONB DEFAULT '{}',
                database_permissions JSONB DEFAULT '{}',
                permissions JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE,
                is_system_role BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                last_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                risk_level VARCHAR(20) DEFAULT 'low',
                UNIQUE(name, company_id)
            )
        """)
        
        conn.commit()
        
        # Check if role exists
        cur.execute("SELECT * FROM custom_roles WHERE id = %s AND company_id = %s", 
                   (role_id, company_name))
        existing_role = cur.fetchone()
        if not existing_role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Check if new name already exists (if name is being updated)
        if role.name and role.name != existing_role['name']:
            cur.execute("SELECT id FROM custom_roles WHERE name = %s AND company_id = %s AND id != %s", 
                       (role.name, company_name, role_id))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Role name already exists")
        
        # Determine risk level based on permissions
        risk_level = 'low'
        high_risk_pages = ['/rolemanagement', '/system-management', '/database-management', '/api-management']
        medium_risk_pages = ['/financial-statements', '/consolidation', '/etl', '/audit']
        
        enabled_pages = [page for page, enabled in role.page_permissions.items() if enabled]
        
        if any(page in high_risk_pages for page in enabled_pages):
            risk_level = 'high'
        elif any(page in medium_risk_pages for page in enabled_pages):
            risk_level = 'medium'
        
        # Also check database permissions for risk
        if role.database_permissions:
            for db_perms in role.database_permissions.values():
                if isinstance(db_perms, dict) and (db_perms.get('write') or db_perms.get('execute')):
                    if risk_level == 'low':
                        risk_level = 'medium'
                    elif risk_level == 'medium':
                        risk_level = 'high'
        
        # Update role
        cur.execute("""
            UPDATE custom_roles 
            SET name = %s, description = %s, page_permissions = %s, database_permissions = %s, 
                risk_level = %s, updated_at = %s, last_action = %s
            WHERE id = %s AND company_id = %s
            RETURNING *
        """, (role.name, role.description, json.dumps(role.page_permissions), 
              json.dumps(role.database_permissions), risk_level, datetime.now(), 
              datetime.now(), role_id, company_name))
        
        updated_role = cur.fetchone()
        if not updated_role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Log audit event
        ip_address, user_agent = get_client_info(request) if request else (None, None)
        log_audit_event(company_name, username, "Role Updated", "Role", 
                      str(role_id), f"Updated role: {role.name}", 
                      "success", ip_address, user_agent)
        
        return {"role": dict(updated_role), "message": "Role updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update role: {str(e)}")

@router.delete("/roles/{role_id}")
async def delete_role(role_id: int, company_name: str = Query(...), 
                     username: str = Query("admin"), request: Request = None):
    """Delete a role (soft delete)"""
    try:
        ip_address, user_agent = get_client_info(request)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Check if role exists
            cur.execute("SELECT * FROM roles WHERE id = %s AND company_id = %s", 
                       (role_id, company_name))
            role = cur.fetchone()
            if not role:
                raise HTTPException(status_code=404, detail="Role not found")
            
            # Check if role is in use
            cur.execute("SELECT COUNT(*) as count FROM role_users WHERE role_id = %s AND is_active = true", 
                       (role_id,))
            user_count = cur.fetchone()['count']
            if user_count > 0:
                raise HTTPException(status_code=400, 
                                  detail=f"Cannot delete role. {user_count} users are assigned to this role.")
            
            # Soft delete role
            cur.execute("""
                UPDATE roles 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND company_id = %s
            """, (role_id, company_name))
            conn.commit()
            
            # Log audit event
            log_audit_event(company_name, username, "Role Deleted", "Role", 
                          str(role_id), f"Deleted role: {role['name']}", 
                          "success", ip_address, user_agent)
            
            return {"message": "Role deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete role: {str(e)}")

@router.delete("/roles/{role_id}")
async def delete_role_enhanced(role_id: int, company_name: str = Query(...), username: str = Query("admin"), request: Request = None):
    """Delete a role and all its associated permissions"""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if role exists and get details for logging
        cur.execute("""
            SELECT * FROM custom_roles WHERE id = %s AND company_id = %s
        """, (role_id, company_name))
        
        role = cur.fetchone()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Check if role is assigned to any users
        cur.execute("""
            SELECT COUNT(*) as user_count FROM user_profiles 
            WHERE role_id = %s AND company_id = %s
        """, (role_id, company_name))
        
        user_count_result = cur.fetchone()
        user_count = user_count_result['user_count'] if user_count_result else 0
        
        if user_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete role '{role['name']}' as it is assigned to {user_count} user(s). Please reassign users to different roles first."
            )
        
        # Delete role permissions first (due to foreign key constraints)
        cur.execute("""
            DELETE FROM role_permissions_detailed WHERE role_id = %s
        """, (role_id,))
        
        # Delete the role
        cur.execute("""
            DELETE FROM custom_roles WHERE id = %s AND company_id = %s
        """, (role_id, company_name))
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Log the deletion
        ip_address, user_agent = get_client_info(request) if request else (None, None)
        log_audit_event(company_name, username, "Role Deleted", "Role", 
                      str(role_id), f"Deleted role '{role['name']}'", 
                      "success", ip_address, user_agent)
        
        return {
            "message": f"Role '{role['name']}' deleted successfully",
            "deleted_role": {
                "id": role['id'],
                "name": role['name'],
                "description": role['description']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete role: {str(e)}")

# User Management Endpoints
@router.get("/users")
async def get_users(company_name: str = Query(...), role_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    """Get all users for a company"""
    try:
        # Query users from the existing users table
        query = db.query(User).filter(User.company == company_name)
        
        if role_id:
            # Filter by role if specified
            query = query.filter(User.role == str(role_id))
        
        users = query.all()
        
        # Convert to dict format
        users_data = []
        for user in users:
            user_dict = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "company": user.company,
                "role": user.role,
                "role_name": user.role,  # Use role as role_name for now
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
            users_data.append(user_dict)
        
        return {"users": users_data}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

@router.get("/databases")
async def get_available_databases(company_name: str = Query(...)):
    """Get list of available databases for access assignment"""
    try:
        
        # Try to connect to PostgreSQL and get actual databases
        try:
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "postgres"),  # Use 'postgres' service name in Docker
                database="postgres",  # Connect to postgres database to list all databases
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "epm_password"),
                port=os.getenv("DB_PORT", "5432")
            )
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get all databases except system databases
            cur.execute("""
                SELECT datname 
                FROM pg_database 
                WHERE datistemplate = false 
                AND datname NOT IN ('postgres', 'template0', 'template1')
                ORDER BY datname
            """)
            
            databases = [row['datname'] for row in cur.fetchall()]
            
            cur.close()
            conn.close()
            
            return {"databases": databases}
            
        except psycopg2.Error as e:
            print(f"PostgreSQL connection error: {e}")
            # Return your actual databases from the screenshot
            actual_databases = [
                "default_company",
                "epm_tool", 
                "funfusion360",
                "my_company",
                "postgres",
                "production_test_company",
                "template0",
                "template1",
                "test_company"
            ]
            return {"databases": actual_databases}
            
    except Exception as e:
        print(f"General error in get_databases: {e}")
        # Return basic fallback
        return {"databases": ["epm_tool", "postgres"]}

@router.get("/database-tables/{database_name}")
async def get_database_tables(database_name: str, company_name: str = Query(...)):
    """Get list of tables in a specific database"""
    try:
        
        # Try multiple connection methods to get the actual tables
        conn = None
        
        # Method 1: Try to connect to the specific database
        try:
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "postgres"),
                database=database_name,
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "epm_password"),
                port=os.getenv("DB_PORT", "5432"),
                connect_timeout=5
            )
        except psycopg2.Error:
            # Method 2: Try connecting to postgres database and query for tables in specific database
            try:
                conn = psycopg2.connect(
                    host=os.getenv("DB_HOST", "postgres"),
                    database="postgres",
                    user=os.getenv("DB_USER", "postgres"),
                    password=os.getenv("DB_PASSWORD", "epm_password"),
                    port=os.getenv("DB_PORT", "5432"),
                    connect_timeout=5
                )
                
                cur = conn.cursor(cursor_factory=RealDictCursor)
                
                # Query tables from the specific database via postgres connection
                cur.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_catalog = %s 
                    AND table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                    ORDER BY table_name
                """, (database_name,))
                
                tables = [row['table_name'] for row in cur.fetchall()]
                cur.close()
                conn.close()
                
                if tables:
                    return {"tables": tables}
                
            except psycopg2.Error:
                pass
        
        # If we have a connection, get the tables
        if conn:
            try:
                cur = conn.cursor(cursor_factory=RealDictCursor)
                
                # Get all tables in the database
                cur.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                    ORDER BY table_name
                """)
                
                tables = [row['table_name'] for row in cur.fetchall()]
                
                cur.close()
                conn.close()
                
                return {"tables": tables}
                
            except psycopg2.Error as e:
                print(f"PostgreSQL connection error for database {database_name}: {e}")
                
                # Try to connect to epm_tool database as fallback to get actual table structure
                try:
                    fallback_conn = psycopg2.connect(
                        host=os.getenv("DB_HOST", "postgres"),
                        database="epm_tool",  # Use epm_tool as fallback
                        user=os.getenv("DB_USER", "postgres"),
                        password=os.getenv("DB_PASSWORD", "epm_password"),
                        port=os.getenv("DB_PORT", "5432")
                    )
                
                    fallback_cur = fallback_conn.cursor(cursor_factory=RealDictCursor)
                    
                    # Get actual tables from epm_tool database
                    fallback_cur.execute("""
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_type = 'BASE TABLE'
                        ORDER BY table_name
                    """)
                    
                    actual_tables = [row['table_name'] for row in fallback_cur.fetchall()]
                    
                    fallback_cur.close()
                    fallback_conn.close()
                    
                    if actual_tables:
                        return {"tables": actual_tables}
                        
                except Exception as fallback_error:
                    print(f"Fallback connection also failed: {fallback_error}")
                
                # Return the actual tables from your screenshot - these are your real database tables
                actual_database_tables = [
                    "accounts", "audit_trails", "axes_settings", "consolidation_journal_entries",
                    "consolidation_journals", "consolidation_settings", "custom_axes", 
                    "custom_axis_columns", "custom_axis_values", "entities", "fst_elements",
                    "fst_templates", "hierarchies", "ifrs_accounts", "intercompany_transactions",
                    "ownership_structures", "permissions", "role_permission", "roles",
                    "tb_entries", "uploads", "user_roles"
                ]
                
                # Return database-specific tables based on the database name
                if database_name == "epm_tool":
                    return {"tables": actual_database_tables}
                elif database_name in ["default_company", "funfusion360", "my_company", "production_test_company", "test_company"]:
                    # These databases likely have similar structure
                    return {"tables": actual_database_tables}
                else:
                    # For other databases, return a subset
                    return {"tables": ["entities", "accounts", "hierarchies", "permissions", "roles"]}
            
    except Exception as e:
        print(f"General error getting tables for {database_name}: {e}")
        # Return minimal fallback
        return {"tables": ["entities", "accounts", "reports"]}

@router.post("/users")
async def create_user(user: UserCreate, company_name: str = Query(...), 
                     username: str = Query("admin"), request: Request = None, db: Session = Depends(get_db)):
    """Create a new user with comprehensive access control"""
    try:
        ip_address, user_agent = get_client_info(request)
        
        # Check if username or email already exists in main users table
        existing_user = db.query(User).filter(
            (User.username == user.username) | (User.email == user.email),
            User.company == company_name
        ).first()
        
        if existing_user:
            if existing_user.username == user.username:
                raise HTTPException(status_code=400, detail="Username already exists")
            else:
                raise HTTPException(status_code=400, detail="Email already exists")
        
        # Generate temporary password if not provided
        temp_password = user.temporary_password or ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        # Create user in main users table
        new_user = User(
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            company=company_name,
            role=str(user.role_id) if user.role_id else "user",
            is_active=True,
            password_hash="temp_hash_" + temp_password  # Will be changed on first login
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create extended user profile in role management system
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor()
        
        # Create user_profiles table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                username VARCHAR(255) NOT NULL,
                company_id VARCHAR(255) NOT NULL,
                role_id INTEGER,
                database_access JSONB DEFAULT '[]',
                custom_permissions JSONB DEFAULT '{}',
                department VARCHAR(255),
                position VARCHAR(255),
                phone VARCHAR(50),
                last_login TIMESTAMP,
                login_count INTEGER DEFAULT 0,
                failed_login_attempts INTEGER DEFAULT 0,
                account_locked BOOLEAN DEFAULT FALSE,
                password_expires_at TIMESTAMP,
                must_change_password BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255)
            )
        """)
        
        # Insert user profile
        cur.execute("""
            INSERT INTO user_profiles 
            (user_id, username, company_id, role_id, database_access, custom_permissions, 
             department, position, phone, created_by, password_expires_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            new_user.id, user.username, company_name, user.role_id,
            json.dumps(user.database_access), json.dumps(user.permissions),
            user.department, user.position, user.phone, username,
            datetime.now() + timedelta(days=30)  # Password expires in 30 days
        ))
        
        user_profile = cur.fetchone()
        
        # If role_id is provided, apply role permissions
        role_permissions_applied = {}
        if user.role_id:
            # Get role details and apply permissions
            cur.execute("""
                SELECT * FROM custom_roles WHERE id = %s AND company_id = %s
            """, (user.role_id, company_name))
            
            role = cur.fetchone()
            if role:
                # Update user profile with role permissions
                cur.execute("""
                    UPDATE user_profiles 
                    SET permissions = %s, updated_at = %s
                    WHERE user_id = %s AND company_id = %s
                """, (
                    json.dumps({
                        "page_permissions": role[4] if role[4] else {},  # page_permissions column
                        "database_permissions": role[5] if role[5] else {}  # database_permissions column
                    }),
                    datetime.now(),
                    new_user.id,
                    company_name
                ))
                
                role_permissions_applied = {
                    "role_name": role[1],  # name column
                    "role_description": role[2],  # description column
                    "pages": list(role[4].keys()) if role[4] else [],
                    "databases": list(role[5].keys()) if role[5] else []
                }
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Log audit event
        log_audit_event(
            company_name, username, "User Created", "User", 
            str(new_user.id), 
            f"Created user: {user.username} with databases: {', '.join(user.database_access)}", 
            "success", ip_address, user_agent
        )
        
        return {
            "user": {
                "id": new_user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "company": company_name,
                "role_id": user.role_id,
                "database_access": user.database_access,
                "is_active": True,
                "must_change_password": True
            },
            "role_permissions_applied": role_permissions_applied,
            "temporary_password": temp_password,
            "message": f"User created successfully{' with role permissions applied' if role_permissions_applied else ''}. Please provide the temporary password to the user."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

# Permission Matrix Endpoints
@router.get("/permissions")
async def get_permissions(company_name: str = Query(...)):
    """Get all permissions for a company"""
    try:
        # Return mock permissions data since we don't have a permissions table yet
        mock_permissions = [
            {
                "id": 1,
                "module": "users",
                "action": "create",
                "name": "Create Users",
                "description": "Create new user accounts",
                "company_id": company_name
            },
            {
                "id": 2,
                "module": "users",
                "action": "read",
                "name": "View Users",
                "description": "View user accounts and details",
                "company_id": company_name
            },
            {
                "id": 3,
                "module": "users",
                "action": "update",
                "name": "Update Users",
                "description": "Edit user accounts and settings",
                "company_id": company_name
            },
            {
                "id": 4,
                "module": "users",
                "action": "delete",
                "name": "Delete Users",
                "description": "Remove user accounts",
                "company_id": company_name
            },
            {
                "id": 5,
                "module": "roles",
                "action": "create",
                "name": "Create Roles",
                "description": "Create new roles",
                "company_id": company_name
            },
            {
                "id": 6,
                "module": "roles",
                "action": "read",
                "name": "View Roles",
                "description": "View roles and permissions",
                "company_id": company_name
            },
            {
                "id": 7,
                "module": "roles",
                "action": "update",
                "name": "Update Roles",
                "description": "Edit roles and permissions",
                "company_id": company_name
            },
            {
                "id": 8,
                "module": "roles",
                "action": "delete",
                "name": "Delete Roles",
                "description": "Remove roles",
                "company_id": company_name
            },
            {
                "id": 9,
                "module": "reports",
                "action": "read",
                "name": "View Reports",
                "description": "Access reporting features",
                "company_id": company_name
            },
            {
                "id": 10,
                "module": "settings",
                "action": "update",
                "name": "System Settings",
                "description": "Modify system settings",
                "company_id": company_name
            }
        ]
        
        return {"permissions": mock_permissions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch permissions: {str(e)}")

@router.get("/permission-matrix")
async def get_permission_matrix(company_name: str = Query(...)):
    """Get the complete permission matrix for all roles"""
    try:
        # Return mock data for now
        mock_roles = [
            {
                "id": 1,
                "name": "Admin",
                "permissions": {
                    "users": ["create", "read", "update", "delete"],
                    "roles": ["create", "read", "update", "delete"],
                    "reports": ["read"],
                    "settings": ["update"]
                }
            },
            {
                "id": 2,
                "name": "Manager",
                "permissions": {
                    "users": ["read", "update"],
                    "roles": ["read"],
                    "reports": ["read"]
                }
            },
            {
                "id": 3,
                "name": "User",
                "permissions": {
                    "users": ["read"],
                    "reports": ["read"]
                }
            }
        ]
        
        mock_permissions = [
            {"module": "users", "action": "create", "name": "Create Users", "description": "Create new user accounts"},
            {"module": "users", "action": "read", "name": "View Users", "description": "View user accounts"},
            {"module": "users", "action": "update", "name": "Update Users", "description": "Edit user accounts"},
            {"module": "users", "action": "delete", "name": "Delete Users", "description": "Remove user accounts"},
            {"module": "roles", "action": "create", "name": "Create Roles", "description": "Create new roles"},
            {"module": "roles", "action": "read", "name": "View Roles", "description": "View roles"},
            {"module": "roles", "action": "update", "name": "Update Roles", "description": "Edit roles"},
            {"module": "roles", "action": "delete", "name": "Delete Roles", "description": "Remove roles"},
            {"module": "reports", "action": "read", "name": "View Reports", "description": "Access reports"},
            {"module": "settings", "action": "update", "name": "System Settings", "description": "Modify settings"}
        ]
        
        return {
            "roles": mock_roles,
            "permissions": mock_permissions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch permission matrix: {str(e)}")

@router.put("/permission-matrix")
async def update_permission_matrix(matrix: Dict[str, Dict[str, List[str]]], 
                                 company_name: str = Query(...), 
                                 username: str = Query("admin"), 
                                 request: Request = None):
    """Update the permission matrix for all roles"""
    try:
        ip_address, user_agent = get_client_info(request)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor()
            
            # Update each role's permissions
            for role_name, permissions in matrix.items():
                cur.execute("""
                    UPDATE roles 
                    SET permissions = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE name = %s AND company_id = %s
                """, (json.dumps(permissions), role_name, company_name))
            
            conn.commit()
            
            # Log audit event
            log_audit_event(company_name, username, "Permission Matrix Updated", 
                          "Permission Matrix", None, "Updated permission matrix for all roles", 
                          "success", ip_address, user_agent)
            
            return {"message": "Permission matrix updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update permission matrix: {str(e)}")

# Audit Logs Endpoints
@router.get("/audit-logs")
async def get_audit_logs(company_name: str = Query(...), 
                        status: Optional[str] = Query(None),
                        risk_level: Optional[str] = Query(None),
                        action_filter: Optional[str] = Query(None),
                        date_from: Optional[str] = Query(None),
                        date_to: Optional[str] = Query(None),
                        limit: int = Query(100, le=1000),
                        offset: int = Query(0, ge=0)):
    """Get comprehensive audit logs for role management"""
    try:
        
        # Connect to main epm_tool database
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT al.*, u.full_name as user_full_name, u.email as user_email
            FROM role_management_audit_logs al
            LEFT JOIN users u ON al.username = u.username AND al.company_id = u.company
            WHERE al.company_id = %s
        """
        params = [company_name]
        
        if status and status != 'all':
            query += " AND al.status = %s"
            params.append(status)
            
        if risk_level and risk_level != 'all':
            query += " AND al.risk_level = %s"
            params.append(risk_level)
            
        if action_filter:
            query += " AND al.action ILIKE %s"
            params.append(f"%{action_filter}%")
            
        if date_from:
            query += " AND al.timestamp >= %s"
            params.append(date_from)
            
        if date_to:
            query += " AND al.timestamp <= %s"
            params.append(date_to)
        
        query += " ORDER BY al.timestamp DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cur.execute(query, params)
        logs = cur.fetchall()
        
        # Get total count
        count_query = "SELECT COUNT(*) as total FROM role_management_audit_logs WHERE company_id = %s"
        count_params = [company_name]
        
        if status and status != 'all':
            count_query += " AND status = %s"
            count_params.append(status)
        if risk_level and risk_level != 'all':
            count_query += " AND risk_level = %s"
            count_params.append(risk_level)
        if action_filter:
            count_query += " AND action ILIKE %s"
            count_params.append(f"%{action_filter}%")
        if date_from:
            count_query += " AND timestamp >= %s"
            count_params.append(date_from)
        if date_to:
            count_query += " AND timestamp <= %s"
            count_params.append(date_to)
        
        cur.execute(count_query, count_params)
        total = cur.fetchone()['total']
        
        # Get statistics
        stats_query = """
            SELECT 
                COUNT(*) as total_logs,
                COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
                COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count,
                COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk_count,
                COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk_count,
                COUNT(DISTINCT username) as unique_users,
                COUNT(CASE WHEN timestamp >= CURRENT_DATE THEN 1 END) as today_count
            FROM role_management_audit_logs 
            WHERE company_id = %s
        """
        cur.execute(stats_query, [company_name])
        stats = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {
            "logs": [dict(log) for log in logs],
            "total": total,
            "limit": limit,
            "offset": offset,
            "statistics": dict(stats)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit logs: {str(e)}")

@router.post("/audit-logs/manual")
async def create_manual_audit_log(
    log_data: AuditLogCreate,
    company_name: str = Query(...),
    username: str = Query("system"),
    request: Request = None
):
    """Create a manual audit log entry"""
    try:
        ip_address, user_agent = get_client_info(request)
        
        log_audit_event(
            company_name=company_name,
            username=username,
            action=log_data.action,
            resource=log_data.resource,
            resource_id=log_data.resource_id,
            details=log_data.details,
            status=log_data.status,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return {"message": "Audit log created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create audit log: {str(e)}")

# Access Request Endpoints
@router.post("/access-requests")
async def create_access_request(
    access_request: AccessRequestCreate,
    company_name: str = Query(...),
    username: str = Query(...),
    request: Request = None
):
    """Create a new access request"""
    try:
        ip_address, user_agent = get_client_info(request)
        
        import psycopg2
        from psycopg2.extras import RealDictCursor
        import os
        
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor()
        
        # Create access_requests table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS access_requests (
                id SERIAL PRIMARY KEY,
                requester_username VARCHAR(255) NOT NULL,
                company_id VARCHAR(255) NOT NULL,
                requested_module VARCHAR(255) NOT NULL,
                requested_page VARCHAR(255) NOT NULL,
                requested_permissions JSONB DEFAULT '[]',
                reason TEXT NOT NULL,
                urgency VARCHAR(20) DEFAULT 'normal',
                business_justification TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP,
                reviewer_username VARCHAR(255),
                review_reason TEXT,
                ip_address INET,
                user_agent TEXT,
                auto_approved BOOLEAN DEFAULT FALSE
            )
        """)
        
        # Insert access request
        cur.execute("""
            INSERT INTO access_requests 
            (requester_username, company_id, requested_module, requested_page, 
             requested_permissions, reason, urgency, business_justification, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            username, company_name, access_request.requested_module, access_request.requested_page,
            json.dumps(access_request.requested_permissions), access_request.reason,
            access_request.urgency, access_request.business_justification, ip_address, user_agent
        ))
        
        new_request = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        # Log audit event
        log_audit_event(
            company_name, username, "Access Requested", "Access Request", 
            str(new_request[0]), 
            f"Requested access to {access_request.requested_module}/{access_request.requested_page}", 
            "success", ip_address, user_agent
        )
        
        return {"request_id": new_request[0], "message": "Access request submitted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create access request: {str(e)}")

@router.get("/access-requests")
async def get_access_requests(
    company_name: str = Query(...), 
    status: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    requester: Optional[str] = Query(None)
):
    """Get access requests for a company with filtering"""
    try:
        
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT ar.*, 
                   u.full_name as requester_full_name,
                   u.email as requester_email,
                   rev.full_name as reviewer_full_name
            FROM access_requests ar
            LEFT JOIN users u ON ar.requester_username = u.username AND ar.company_id = u.company
            LEFT JOIN users rev ON ar.reviewer_username = rev.username AND ar.company_id = rev.company
            WHERE ar.company_id = %s
        """
        params = [company_name]
        
        if status and status != 'all':
            query += " AND ar.status = %s"
            params.append(status)
            
        if urgency and urgency != 'all':
            query += " AND ar.urgency = %s"
            params.append(urgency)
            
        if requester:
            query += " AND ar.requester_username ILIKE %s"
            params.append(f"%{requester}%")
        
        query += " ORDER BY ar.requested_at DESC"
        
        cur.execute(query, params)
        requests = cur.fetchall()
        
        # Get statistics
        stats_query = """
            SELECT 
                COUNT(*) as total_requests,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
                COUNT(CASE WHEN urgency = 'critical' THEN 1 END) as critical_count,
                COUNT(CASE WHEN requested_at >= CURRENT_DATE THEN 1 END) as today_count
            FROM access_requests 
            WHERE company_id = %s
        """
        cur.execute(stats_query, [company_name])
        stats = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {
            "requests": [dict(req) for req in requests],
            "statistics": dict(stats)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch access requests: {str(e)}")

@router.put("/access-requests/{request_id}/review")
async def review_access_request(
    request_id: int,
    review: AccessRequestReview,
    company_name: str = Query(...),
    reviewer_username: str = Query(...),
    request: Request = None
):
    """Review an access request (approve/reject)"""
    try:
        ip_address, user_agent = get_client_info(request)
        
        import psycopg2
        from psycopg2.extras import RealDictCursor
        import os
        
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get the access request
        cur.execute("""
            SELECT * FROM access_requests 
            WHERE id = %s AND company_id = %s
        """, (request_id, company_name))
        
        access_request = cur.fetchone()
        if not access_request:
            raise HTTPException(status_code=404, detail="Access request not found")
        
        if access_request['status'] != 'pending':
            raise HTTPException(status_code=400, detail="Access request has already been reviewed")
        
        # Update the request
        cur.execute("""
            UPDATE access_requests 
            SET status = %s, reviewed_at = %s, reviewer_username = %s, review_reason = %s
            WHERE id = %s AND company_id = %s
            RETURNING *
        """, (review.status, datetime.now(), reviewer_username, review.review_reason, request_id, company_name))
        
        updated_request = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        # Log audit event
        log_audit_event(
            company_name, reviewer_username, f"Access Request {review.status.title()}", 
            "Access Request", str(request_id), 
            f"{review.status.title()} access request for {access_request['requested_module']}/{access_request['requested_page']}", 
            "success", ip_address, user_agent
        )
        
        return {
            "request": dict(updated_request),
            "message": f"Access request {review.status} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review access request: {str(e)}")

@router.post("/check-access")
async def check_user_access(
    module: str = Query(...),
    page: str = Query(...),
    company_name: str = Query(...),
    username: str = Query(...)
):
    """Check if user has access to a specific module/page"""
    try:
        
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get user's role and permissions
        cur.execute("""
            SELECT up.*, cr.permissions, cr.name as role_name
            FROM user_profiles up
            LEFT JOIN custom_roles cr ON up.role_id = cr.id
            WHERE up.username = %s AND up.company_id = %s
        """, (username, company_name))
        
        user_profile = cur.fetchone()
        
        if not user_profile:
            return {"has_access": False, "reason": "User profile not found"}
        
        permissions = user_profile['permissions'] or {}
        
        # Check if user has access to the module/page
        has_access = False
        if module in permissions:
            module_permissions = permissions[module]
            if page in module_permissions:
                has_access = True
        
        cur.close()
        conn.close()
        
        return {
            "has_access": has_access,
            "user_role": user_profile['role_name'],
            "module": module,
            "page": page,
            "reason": "Access granted" if has_access else "Insufficient permissions"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check access: {str(e)}")

# System Integration Endpoints
@router.get("/system-integrations")
async def get_system_integrations(company_name: str = Query(...)):
    """Get system integrations for a company"""
    try:
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT * FROM system_integrations 
                WHERE company_id = %s 
                ORDER BY name
            """, (company_name,))
            integrations = cur.fetchall()
            
            return {"integrations": [dict(integration) for integration in integrations]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch system integrations: {str(e)}")

@router.put("/system-integrations/{integration_id}")
async def update_system_integration(integration_id: int, 
                                  integration: SystemIntegrationUpdate,
                                  company_name: str = Query(...),
                                  username: str = Query("admin"),
                                  request: Request = None):
    """Update a system integration"""
    try:
        ip_address, user_agent = get_client_info(request)
        
        with get_company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Check if integration exists
            cur.execute("SELECT * FROM system_integrations WHERE id = %s AND company_id = %s", 
                       (integration_id, company_name))
            existing = cur.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="System integration not found")
            
            # Update integration
            cur.execute("""
                UPDATE system_integrations 
                SET status = %s, health_percentage = %s, config = %s, 
                    last_sync = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND company_id = %s
                RETURNING *
            """, (integration.status, integration.health_percentage, 
                  json.dumps(integration.config) if integration.config else existing['config'],
                  integration_id, company_name))
            
            updated_integration = cur.fetchone()
            conn.commit()
            
            # Log audit event
            log_audit_event(company_name, username, "System Integration Updated", 
                          "System Integration", str(integration_id), 
                          f"Updated integration: {existing['name']}", 
                          "success", ip_address, user_agent)
            
            return {"integration": dict(updated_integration), "message": "Integration updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update system integration: {str(e)}")

# ===== USER CREATION WITH DATABASE PROVISIONING =====

@router.post("/users")
async def create_user_with_db_access(
    user_data: dict,
    company_name: str = Query(...),
    username: str = Query("admin"),
    request: Request = None
):
    """Create a new user with real database access provisioning"""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Create tables if they don't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                role VARCHAR(100) DEFAULT 'user',
                department VARCHAR(255),
                position VARCHAR(255),
                phone VARCHAR(50),
                is_active BOOLEAN DEFAULT TRUE,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                page_permissions JSONB DEFAULT '{}',
                database_permissions JSONB DEFAULT '{}'
            )
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role_id INTEGER,
                company_id VARCHAR(255) NOT NULL,
                permissions JSONB DEFAULT '{}',
                database_access JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                last_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        
        # Hash password
        import bcrypt
        password_hash = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Check if username or email already exists
        cur.execute("SELECT id FROM users WHERE username = %s OR email = %s", 
                   (user_data['username'], user_data['email']))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Username or email already exists")
        
        # Create user in main users table
        cur.execute("""
            INSERT INTO users (username, email, full_name, password_hash, company, department, 
                             position, phone, page_permissions, database_permissions)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            user_data['username'],
            user_data['email'], 
            user_data['full_name'],
            password_hash,
            company_name,
            user_data.get('department', ''),
            user_data.get('position', ''),
            user_data.get('phone', ''),
            json.dumps(user_data.get('page_permissions', {})),
            json.dumps(user_data.get('database_permissions', {}))
        ))
        
        new_user = cur.fetchone()
        user_id = new_user['id']
        
        # Create user profile
        cur.execute("""
            INSERT INTO user_profiles (user_id, role_id, company_id, permissions, database_access, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            user_id,
            user_data.get('role_id'),
            company_name,
            json.dumps(user_data.get('page_permissions', {})),
            json.dumps(user_data.get('database_permissions', {})),
            username
        ))
        
        user_profile = cur.fetchone()
        
        # Create real database users for each database with permissions
        database_users_created = []
        for db_name, permissions in user_data.get('database_permissions', {}).items():
            if any(permissions.values()):  # If any permission is granted
                try:
                    # Create database-specific username
                    db_username = f"{user_data['username']}_{db_name}".lower()
                    db_password = user_data['password']  # Use same password for simplicity
                    
                    # Connect to the specific database to create user
                    db_conn = psycopg2.connect(
                        host=os.getenv("DB_HOST", "postgres"),
                        database=db_name,
                        user=os.getenv("DB_USER", "postgres"),
                        password=os.getenv("DB_PASSWORD", "epm_password"),
                        port=os.getenv("DB_PORT", "5432")
                    )
                    
                    db_cur = db_conn.cursor()
                    
                    # Create database user
                    db_cur.execute(f"CREATE USER {db_username} WITH PASSWORD %s", (db_password,))
                    
                    # Grant permissions based on configuration
                    if permissions.get('read', False):
                        db_cur.execute(f"GRANT SELECT ON ALL TABLES IN SCHEMA public TO {db_username}")
                        db_cur.execute(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO {db_username}")
                    
                    if permissions.get('write', False):
                        db_cur.execute(f"GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {db_username}")
                        db_cur.execute(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO {db_username}")
                    
                    if permissions.get('execute', False):
                        db_cur.execute(f"GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO {db_username}")
                        db_cur.execute(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO {db_username}")
                    
                    db_conn.commit()
                    db_cur.close()
                    db_conn.close()
                    
                    database_users_created.append({
                        'database': db_name,
                        'username': db_username,
                        'permissions': permissions
                    })
                    
                except Exception as db_error:
                    print(f"Warning: Failed to create database user for {db_name}: {str(db_error)}")
                    # Continue with other databases even if one fails
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Log audit event
        ip_address, user_agent = get_client_info(request) if request else (None, None)
        log_audit_event(company_name, username, "User Created", "User", 
                      str(user_id), f"Created user: {user_data['username']}", 
                      "success", ip_address, user_agent)
        
        # Return user data (excluding password hash)
        user_result = dict(new_user)
        user_result.pop('password_hash', None)
        user_result['database_users_created'] = database_users_created
        
        return {
            "user": user_result,
            "profile": dict(user_profile),
            "database_access": database_users_created,
            "message": f"User created successfully with access to {len(database_users_created)} databases"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.get("/users")
async def get_users(company_name: str = Query(...)):
    """Get all users for a company"""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Create tables if they don't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                role VARCHAR(100) DEFAULT 'user',
                department VARCHAR(255),
                position VARCHAR(255),
                phone VARCHAR(50),
                is_active BOOLEAN DEFAULT TRUE,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                page_permissions JSONB DEFAULT '{}',
                database_permissions JSONB DEFAULT '{}'
            )
        """)
        
        conn.commit()
        
        # Get users for the company
        cur.execute("""
            SELECT u.*, up.role_id, r.name as role_name
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN custom_roles r ON up.role_id = r.id
            WHERE u.company = %s
            ORDER BY u.created_at DESC
        """, (company_name,))
        
        users = cur.fetchall()
        
        # Remove password hashes from response
        safe_users = []
        for user in users:
            user_dict = dict(user)
            user_dict.pop('password_hash', None)
            safe_users.append(user_dict)
        
        cur.close()
        conn.close()
        
        return {"users": safe_users}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")
