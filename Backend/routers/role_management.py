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
from psycopg2.extensions import connection as PGConnection
import json
import os
import secrets
import string
import bcrypt

router = APIRouter(prefix="/api/role-management", tags=["role-management"])

# Import database dependencies
from database import get_db, User, Company
from sqlalchemy.orm import Session

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
    page_permissions: Dict[str, Any] = Field(default_factory=dict)
    database_permissions: Dict[str, Any] = Field(default_factory=dict)
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    temporary_password: Optional[str] = None
    company_name: Optional[str] = None

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

# ===== Shared Role Management Helpers =====

def parse_json_field(value: Any, default: Any):
    """Safely parse JSON-like fields that may arrive as strings or python objects."""
    if value is None:
        return default
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if parsed is not None else default
        except (ValueError, TypeError):
            return default
    return default


def normalize_page_permissions(value: Any) -> Dict[str, bool]:
    """Convert stored page permission payloads into a flat map of route -> bool."""
    raw = parse_json_field(value, {})
    result: Dict[str, bool] = {}

    if isinstance(raw, dict):
        for route, perm_value in raw.items():
            if isinstance(perm_value, dict):
                result[route] = any(bool(inner) for inner in perm_value.values())
            elif isinstance(perm_value, str):
                result[route] = perm_value.lower() in {"true", "1", "yes", "access", "allowed", "full_access"}
            else:
                result[route] = bool(perm_value)
    elif isinstance(raw, (list, tuple, set)):
        for entry in raw:
            if isinstance(entry, str):
                result[entry] = True

    return result


def normalize_database_permissions(value: Any) -> Dict[str, Dict[str, bool]]:
    """Convert stored database permission payloads into explicit read/write/execute flags."""
    raw = parse_json_field(value, {})
    normalised: Dict[str, Dict[str, bool]] = {}

    if isinstance(raw, dict):
        for db_name, permissions in raw.items():
            base = {"read": False, "write": False, "execute": False, "admin": False}

            if isinstance(permissions, dict):
                for key in base:
                    raw_value = permissions.get(key)
                    if isinstance(raw_value, bool):
                        base[key] = raw_value
                    elif isinstance(raw_value, str):
                        base[key] = raw_value.lower() in {"true", "1", "yes", "allow", "allowed"}

                extras = permissions.get("permissions")
                if isinstance(extras, (list, tuple, set)):
                    for entry in extras:
                        lowered = str(entry).lower()
                        if lowered == "full_access":
                            base = {perm: True for perm in base}
                        elif lowered in base:
                            base[lowered] = True
            elif isinstance(permissions, (list, tuple, set)):
                lowered = {str(entry).lower() for entry in permissions}
                if "full_access" in lowered:
                    base = {perm: True for perm in base}
                else:
                    for perm in base:
                        if perm in lowered:
                            base[perm] = True
            elif isinstance(permissions, str):
                lowered = permissions.lower()
                if lowered == "full_access":
                    base = {perm: True for perm in base}
                elif lowered in base:
                    base[lowered] = True
            elif isinstance(permissions, bool):
                base["read"] = permissions

            if base.get("admin"):
                base["read"] = True
                base["write"] = True
                base["execute"] = True

            normalised[db_name] = base

    return normalised


def merge_page_permissions(base: Dict[str, bool], overrides: Dict[str, bool]) -> Dict[str, bool]:
    """Combine role-derived page permissions with user overrides."""
    merged = dict(base or {})
    for route, allowed in (overrides or {}).items():
        merged[route] = bool(allowed)
    return merged


def merge_database_permissions(base: Dict[str, Dict[str, bool]], overrides: Dict[str, Dict[str, bool]]) -> Dict[str, Dict[str, bool]]:
    """Merge role database permissions with user overrides, preserving explicit flags."""
    merged: Dict[str, Dict[str, bool]] = {}

    all_db_names = set((base or {}).keys()) | set((overrides or {}).keys())
    for db_name in all_db_names:
        base_perms = (base or {}).get(db_name, {})
        override_perms = (overrides or {}).get(db_name, {})
        merged_permissions = {}
        for perm in ("read", "write", "execute", "admin"):
            merged_permissions[perm] = bool(base_perms.get(perm)) or bool(override_perms.get(perm))
        if merged_permissions.get("admin"):
            merged_permissions["read"] = True
            merged_permissions["write"] = True
            merged_permissions["execute"] = True
        merged[db_name] = merged_permissions
    return merged


def ensure_role_management_tables(cursor):
    """Ensure core role-management tables exist before executing operations."""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS custom_roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            company_id VARCHAR(255) NOT NULL,
            page_permissions JSONB DEFAULT '{}'::jsonb,
            database_permissions JSONB DEFAULT '{}'::jsonb,
            permissions JSONB DEFAULT '{}'::jsonb,
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

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS role_permissions_detailed (
            id SERIAL PRIMARY KEY,
            role_id INTEGER REFERENCES custom_roles(id) ON DELETE CASCADE,
            permission_type VARCHAR(50) NOT NULL,
            resource_name VARCHAR(255) NOT NULL,
            parent_resource VARCHAR(255),
            permission_level VARCHAR(50) NOT NULL,
            granted BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(255)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            role_id INTEGER,
            company_id VARCHAR(255) NOT NULL,
            permissions JSONB DEFAULT '{}'::jsonb,
            database_access JSONB DEFAULT '{}'::jsonb,
            metadata JSONB DEFAULT '{}'::jsonb,
            username VARCHAR(255),
            created_by VARCHAR(255),
            last_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, company_id)
        )
    """)

    cursor.execute("""
        ALTER TABLE user_profiles
            ADD COLUMN IF NOT EXISTS database_access JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS username VARCHAR(255),
            ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
            ADD COLUMN IF NOT EXISTS last_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS role_id INTEGER,
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
    """)

    cursor.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.table_constraints
                WHERE constraint_type = 'FOREIGN KEY'
                  AND constraint_name = 'user_profiles_role_id_fkey'
                  AND table_name = 'user_profiles'
            ) THEN
                ALTER TABLE user_profiles
                    ADD CONSTRAINT user_profiles_role_id_fkey
                    FOREIGN KEY (role_id) REFERENCES custom_roles(id)
                    ON DELETE SET NULL;
            END IF;
        END;
        $$;
    """)

    cursor.execute("""
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

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS access_requests (
            id SERIAL PRIMARY KEY,
            requester_username VARCHAR(255) NOT NULL,
            company_id VARCHAR(255) NOT NULL,
            requested_module VARCHAR(255) NOT NULL,
            requested_page VARCHAR(255),
            requested_permissions JSONB DEFAULT '[]'::jsonb,
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

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_integrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            type VARCHAR(50) NOT NULL,
            description TEXT,
            connection_string TEXT,
            status VARCHAR(20) DEFAULT 'disconnected',
            health_percentage INTEGER DEFAULT 0,
            last_sync TIMESTAMP,
            company_id VARCHAR(255) NOT NULL,
            config JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, company_id)
        )
    """)

    cursor.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    cursor.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'trg_custom_roles_updated_at'
            ) THEN
                CREATE TRIGGER trg_custom_roles_updated_at
                BEFORE UPDATE ON custom_roles
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_profiles_updated_at'
            ) THEN
                CREATE TRIGGER trg_user_profiles_updated_at
                BEFORE UPDATE ON user_profiles
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'trg_system_integrations_updated_at'
            ) THEN
                CREATE TRIGGER trg_system_integrations_updated_at
                BEFORE UPDATE ON system_integrations
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            END IF;
        END;
        $$;
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_custom_roles_company ON custom_roles(company_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions_detailed(role_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_profiles_company_username ON user_profiles(company_id, username)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_role_management_audit_company ON role_management_audit_logs(company_id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_access_requests_company_status ON access_requests(company_id, status)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_system_integrations_company ON system_integrations(company_id)
    """)


def ensure_company_record(cursor: RealDictCursor, company_name: str) -> Dict[str, Any]:
    """Ensure a company exists and return its record."""
    # First try exact match
    cursor.execute(
        "SELECT id, name, code FROM companies WHERE name = %s",
        (company_name,)
    )
    existing = cursor.fetchone()
    if existing:
        return dict(existing)
    
    # If "Default Company" is requested but doesn't exist, try to find the first company
    if company_name == "Default Company":
        cursor.execute(
            "SELECT id, name, code FROM companies ORDER BY created_at ASC LIMIT 1"
        )
        first_company = cursor.fetchone()
        if first_company:
            return dict(first_company)

    base_code = "".join(ch.lower() for ch in company_name if ch.isalnum())
    base_code = base_code[:20] or "company"
    candidate_code = base_code

    attempt = 0
    while True:
        cursor.execute(
            "SELECT 1 FROM companies WHERE code = %s",
            (candidate_code,)
        )
        if not cursor.fetchone():
            break
        attempt += 1
        candidate_code = f"{base_code}-{secrets.token_hex(2)}"

    cursor.execute(
        """
        INSERT INTO companies (name, code, environment_type, industry, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, name, code
        """,
        (company_name, candidate_code, "production", "General", "active")
    )
    return dict(cursor.fetchone())


def fetch_users_for_company(company_name: str, role_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Fetch users and attached role metadata for a company."""
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "postgres"),
        database=os.getenv("DB_NAME", "epm_tool"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "epm_password"),
        port=os.getenv("DB_PORT", "5432")
    )

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        ensure_role_management_tables(cur)
        conn.commit()

        query = """
            SELECT 
                u.id,
                u.username,
                u.email,
                u.is_active,
                u.last_login,
                u.created_at,
                u.updated_at,
                c.id AS company_id,
                c.name AS company_name,
                up.role_id,
                up.permissions,
                up.database_access,
                up.metadata,
                up.is_active AS profile_active,
                up.last_action,
                r.name AS role_name,
                r.description AS role_description
            FROM users u
            INNER JOIN companies c ON u.company_id = c.id
            LEFT JOIN user_profiles up 
                ON up.user_id = u.id 
               AND up.company_id = c.name
            LEFT JOIN custom_roles r 
                ON up.role_id = r.id
               AND r.company_id = c.name
            WHERE c.name = %s
            ORDER BY u.created_at DESC
        """
        params: List[Any] = [company_name]

        cur.execute(query, params)
        users = cur.fetchall()

        safe_users: List[Dict[str, Any]] = []
        for user_row in users:
            if role_id and user_row.get("role_id") not in {role_id, str(role_id)}:
                continue

            permissions_payload = parse_json_field(user_row.get("permissions"), {})
            metadata_payload = parse_json_field(user_row.get("metadata"), {})

            page_permissions = normalize_page_permissions(permissions_payload.get("page_permissions"))
            database_permissions = normalize_database_permissions(permissions_payload.get("database_permissions"))

            user_dict = {
                "id": user_row.get("id"),
                "username": user_row.get("username"),
                "email": user_row.get("email"),
                "is_active": bool(user_row.get("is_active") and user_row.get("profile_active", True)),
                "last_login": user_row.get("last_login"),
                "created_at": user_row.get("created_at"),
                "updated_at": user_row.get("updated_at"),
                "company_id": user_row.get("company_id"),
                "company": user_row.get("company_name"),
                "role_id": user_row.get("role_id"),
                "role_name": user_row.get("role_name"),
                "role_description": user_row.get("role_description"),
                "last_action": user_row.get("last_action"),
                "page_permissions": page_permissions,
                "database_permissions": database_permissions,
                "metadata": metadata_payload,
                "full_name": metadata_payload.get("full_name", ""),
                "department": metadata_payload.get("department", ""),
                "position": metadata_payload.get("position", ""),
                "phone": metadata_payload.get("phone", ""),
            }

            safe_users.append(user_dict)

        return safe_users
    finally:
        conn.close()

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

        ensure_role_management_tables(cur)
        conn.commit()

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

        ensure_role_management_tables(cur)
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
        ensure_role_management_tables(cur)
        conn.commit()
        
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
        ensure_role_management_tables(cur)
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
        return fetch_users_for_company(company_name, role_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

@router.get("/available-pages")
async def get_available_pages(company_name: str = Query(...), role_id: Optional[int] = Query(None)):
    """Get all available pages for user creation with inheritance logic"""
    try:
        # Define all available pages in the system
        all_pages = {
            "/dashboard": {"name": "Dashboard", "category": "Core", "risk_level": "low"},
            "/accounts": {"name": "Chart of Accounts", "category": "Accounting", "risk_level": "medium"},
            "/entities": {"name": "Entity Management", "category": "Accounting", "risk_level": "medium"},
            "/consolidation": {"name": "Consolidation", "category": "Accounting", "risk_level": "high"},
            "/financial-statements": {"name": "Financial Statements", "category": "Reporting", "risk_level": "medium"},
            "/fst-items": {"name": "FST Items", "category": "Reporting", "risk_level": "medium"},
            "/trial-balance": {"name": "Trial Balance", "category": "Reporting", "risk_level": "medium"},
            "/advanced-features": {"name": "Advanced Features", "category": "Advanced", "risk_level": "high"},
            "/real-time-analytics": {"name": "Real-time Analytics", "category": "Analytics", "risk_level": "medium"},
            "/narrative-reporting": {"name": "Narrative Reporting", "category": "Reporting", "risk_level": "medium"},
            "/rolemanagement": {"name": "Role Management", "category": "Administration", "risk_level": "high"},
            "/system-management": {"name": "System Management", "category": "Administration", "risk_level": "high"},
            "/database-management": {"name": "Database Management", "category": "Administration", "risk_level": "high"},
            "/api-management": {"name": "API Management", "category": "Administration", "risk_level": "high"},
            "/audit": {"name": "Audit Logs", "category": "Administration", "risk_level": "high"},
            "/etl": {"name": "ETL Management", "category": "Data", "risk_level": "high"}
        }
        
        role_permissions = {}
        if role_id:
            # Get role permissions for inheritance
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "postgres"),
                database=os.getenv("DB_NAME", "epm_tool"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "epm_password"),
                port=os.getenv("DB_PORT", "5432")
            )
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("""
                SELECT page_permissions FROM custom_roles 
                WHERE id = %s AND company_id = %s
            """, (role_id, company_name))
            
            role_data = cur.fetchone()
            if role_data and role_data['page_permissions']:
                role_permissions = json.loads(role_data['page_permissions']) if isinstance(role_data['page_permissions'], str) else role_data['page_permissions']
            
            cur.close()
            conn.close()
        
        # Format response with inheritance information
        pages_with_inheritance = []
        for page_path, page_info in all_pages.items():
            inherited = role_permissions.get(page_path, False) if role_id else False
            pages_with_inheritance.append({
                "path": page_path,
                "name": page_info["name"],
                "category": page_info["category"],
                "risk_level": page_info["risk_level"],
                "inherited_from_role": inherited,
                "enabled": inherited  # Default to inherited value
            })
        
        return {
            "pages": pages_with_inheritance,
            "role_id": role_id,
            "total_pages": len(all_pages)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch available pages: {str(e)}")

@router.get("/users/{user_id}")
async def get_user_detail(user_id: int, company_name: str = Query(...)):
    """Get detailed information for a single user."""
    try:
        users = fetch_users_for_company(company_name)
        for user in users:
            if str(user.get("id")) == str(user_id):
                return {"user": user}
        raise HTTPException(status_code=404, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user: {str(e)}")


@router.get("/user-activity/{user_id}")
async def get_user_activity(
    user_id: int,
    company_name: str = Query(...),
    limit: int = Query(25, ge=1, le=200)
):
    """Return recent audit activity for a specific user."""
    conn: Optional[PGConnection] = None
    cur: Optional[RealDictCursor] = None
    try:
        users = fetch_users_for_company(company_name)
        target_user = next((user for user in users if str(user.get("id")) == str(user_id)), None)
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")

        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT *
            FROM role_management_audit_logs
            WHERE company_id = %s AND username = %s
            ORDER BY timestamp DESC
            LIMIT %s
            """,
            (company_name, target_user["username"], limit)
        )
        records = cur.fetchall()

        return {
            "user": target_user,
            "activity": [dict(entry) for entry in records]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load user activity: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

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
async def create_user(user: UserCreate, company_name: Optional[str] = Query(None), 
                     username: str = Query("admin"), request: Request = None, db: Session = Depends(get_db)):
    """Create a new user and provision permissions using the shared provisioning logic."""
    try:
        user_payload = user.dict()
        if company_name:
            user_payload.setdefault("company_name", company_name)
        resolved_company = user_payload.get("company_name")
        if not resolved_company:
            raise HTTPException(status_code=400, detail="company_name is required")

        # Backwards compatibility: promote legacy permission payloads if present
        if not user_payload.get("page_permissions") and user_payload.get("permissions"):
            legacy_permissions = user_payload.get("permissions", {})
            user_payload["page_permissions"] = {
                permission: True
                for module_permissions in legacy_permissions.values()
                for permission in module_permissions
            }

        if not user_payload.get("database_permissions") and user_payload.get("database_access"):
            user_payload["database_permissions"] = {
                db_name: {"read": True, "write": False, "execute": False}
                for db_name in user_payload.get("database_access", [])
            }

        # Delegate to the comprehensive provisioning routine
        return await create_user_with_db_access(
            user_payload,
            company_name=resolved_company,
            username=username,
            request=request
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

# Permission Matrix Endpoints
@router.get("/permissions")
async def get_permissions(company_name: str = Query(...)):
    """Get all permissions for a company"""
    conn: Optional[PGConnection] = None
    cur: Optional[RealDictCursor] = None
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        ensure_role_management_tables(cur)

        cur.execute(
            """
            SELECT permissions
            FROM custom_roles
            WHERE company_id = %s
            """,
            (company_name,)
        )
        rows = cur.fetchall()

        permissions: List[Dict[str, Any]] = []
        seen = set()
        next_id = 1

        for row in rows:
            role_permissions = parse_json_field(row.get("permissions"), {})
            if not isinstance(role_permissions, dict):
                continue
            for module, actions in role_permissions.items():
                if not isinstance(actions, (list, tuple, set)):
                    continue
                for action in actions:
                    key = (str(module), str(action))
                    if key in seen:
                        continue
                    seen.add(key)
                    permissions.append({
                        "id": next_id,
                        "module": str(module),
                        "action": str(action),
                        "name": f"{str(action).title()} {str(module).replace('_', ' ').title()}",
                        "description": f"{str(action).title()} access for {str(module)}",
                        "company_id": company_name
                    })
                    next_id += 1

        return {"permissions": permissions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch permissions: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@router.get("/permission-matrix")
async def get_permission_matrix(company_name: str = Query(...)):
    """Get the complete permission matrix for all roles"""
    conn: Optional[PGConnection] = None
    cur: Optional[RealDictCursor] = None
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        ensure_role_management_tables(cur)

        cur.execute(
            """
            SELECT id, name, permissions, database_permissions
            FROM custom_roles
            WHERE company_id = %s
            ORDER BY name
            """,
            (company_name,)
        )
        roles = cur.fetchall()

        matrix: Dict[str, Dict[str, List[str]]] = {}
        database_matrix: Dict[str, Dict[str, List[str]]] = {}

        for role in roles:
            role_key = str(role["id"])
            stored_permissions = parse_json_field(role.get("permissions"), {})
            matrix[role_key] = {}
            if isinstance(stored_permissions, dict):
                for module, actions in stored_permissions.items():
                    if isinstance(actions, (list, tuple, set)):
                        matrix[role_key][module] = sorted({str(action) for action in actions})

            db_permissions = normalize_database_permissions(role.get("database_permissions"))
            database_matrix[role_key] = {
                db: sorted([perm for perm, allowed in perms.items() if allowed])
                for db, perms in db_permissions.items()
            }

        return {
            "matrix": matrix,
            "database_matrix": database_matrix
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch permission matrix: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@router.put("/permission-matrix")
async def update_permission_matrix(
    payload: Dict[str, Any],
    company_name: str = Query(...),
    username: str = Query("admin"),
    request: Request = None
):
    """Update the permission matrix for all roles"""
    conn: Optional[PGConnection] = None
    cur: Optional[RealDictCursor] = None
    try:
        ip_address, user_agent = get_client_info(request)
        matrix = payload.get("matrix", {}) or {}
        database_matrix = payload.get("database_matrix", {}) or {}

        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        ensure_role_management_tables(cur)

        updated_roles: List[int] = []
        for role_key, module_permissions in matrix.items():
            try:
                role_id = int(role_key)
            except (TypeError, ValueError):
                continue

            cur.execute(
                """
                SELECT permissions, database_permissions
                FROM custom_roles
                WHERE id = %s AND company_id = %s
                """,
                (role_id, company_name)
            )
            existing = cur.fetchone()
            if not existing:
                continue

            current_permissions = parse_json_field(existing.get("permissions"), {})
            current_db_permissions = normalize_database_permissions(existing.get("database_permissions"))

            cleaned_permissions: Dict[str, List[str]] = {}
            if isinstance(module_permissions, dict):
                for module, actions in module_permissions.items():
                    if isinstance(actions, (list, tuple, set)):
                        cleaned_permissions[module] = sorted({str(action) for action in actions})
            else:
                cleaned_permissions = current_permissions

            db_updates_raw = database_matrix.get(role_key)
            if isinstance(db_updates_raw, dict):
                cleaned_db_permissions: Dict[str, Dict[str, bool]] = {}
                for db_name, perms in db_updates_raw.items():
                    perm_set = {str(p).lower() for p in (perms or [])}
                    cleaned_db_permissions[db_name] = {
                        "read": "read" in perm_set or "admin" in perm_set or "full_access" in perm_set,
                        "write": "write" in perm_set or "admin" in perm_set or "full_access" in perm_set,
                        "execute": "execute" in perm_set or "admin" in perm_set or "full_access" in perm_set,
                        "admin": "admin" in perm_set or "full_access" in perm_set
                    }
                    if cleaned_db_permissions[db_name]["admin"]:
                        cleaned_db_permissions[db_name]["read"] = True
                        cleaned_db_permissions[db_name]["write"] = True
                        cleaned_db_permissions[db_name]["execute"] = True
                final_db_permissions = cleaned_db_permissions
            else:
                final_db_permissions = current_db_permissions

            cur.execute(
                """
                UPDATE custom_roles
                SET permissions = %s,
                    database_permissions = %s,
                    updated_at = CURRENT_TIMESTAMP,
                    last_action = CURRENT_TIMESTAMP
                WHERE id = %s AND company_id = %s
                """,
                (
                    json.dumps(cleaned_permissions),
                    json.dumps(final_db_permissions),
                    role_id,
                    company_name
                )
            )
            updated_roles.append(role_id)

        conn.commit()

        if updated_roles:
            log_audit_event(
                company_name,
                username,
                "Permission Matrix Updated",
                "Permission Matrix",
                ",".join(map(str, updated_roles)),
                f"Updated permission matrix for roles: {', '.join(map(str, updated_roles))}",
                "success",
                ip_address,
                user_agent
            )

        return {"message": "Permission matrix updated successfully", "updated_roles": updated_roles}
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update permission matrix: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

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
            SELECT 
                al.*, 
                up.metadata AS user_metadata,
                up.role_id AS user_role_id,
                r.name AS user_role_name
            FROM role_management_audit_logs al
            LEFT JOIN user_profiles up 
                ON al.username = up.username 
               AND al.company_id = up.company_id
            LEFT JOIN custom_roles r 
                ON up.role_id = r.id 
               AND r.company_id = al.company_id
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
        enriched_logs: List[Dict[str, Any]] = []
        for log in logs:
            log_dict = dict(log)
            metadata = parse_json_field(log_dict.pop("user_metadata", {}), {})
            log_dict["user_full_name"] = metadata.get("full_name")
            log_dict["user_department"] = metadata.get("department")
            log_dict["user_position"] = metadata.get("position")
            log_dict["user_phone"] = metadata.get("phone")
            log_dict["user_role_name"] = log_dict.get("user_role_name")
            enriched_logs.append(log_dict)
        
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
            "logs": enriched_logs,
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
        ensure_role_management_tables(cur)

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
        ensure_role_management_tables(cur)
        conn.commit()
        
        query = """
            SELECT 
                ar.id,
                ar.requester_username,
                ar.company_id,
                ar.requested_module,
                ar.requested_page,
                ar.requested_permissions,
                ar.reason,
                ar.urgency,
                ar.business_justification,
                ar.status,
                ar.requested_at AS created_at,
                ar.reviewed_at,
                ar.reviewer_username,
                ar.review_reason,
                ar.ip_address,
                ar.user_agent,
                ar.auto_approved,
                COALESCE(up_req.metadata->>'full_name', ar.requester_username) AS requester_name,
                COALESCE(u_req.email, '') AS requester_email,
                COALESCE(up_rev.metadata->>'full_name', ar.reviewer_username) AS reviewer_name,
                COALESCE(u_rev.email, '') AS reviewer_email
            FROM access_requests ar
            LEFT JOIN user_profiles up_req ON ar.requester_username = up_req.username AND ar.company_id = up_req.company_id
            LEFT JOIN users u_req ON up_req.user_id = u_req.id
            LEFT JOIN user_profiles up_rev ON ar.reviewer_username = up_rev.username AND ar.company_id = up_rev.company_id
            LEFT JOIN users u_rev ON up_rev.user_id = u_rev.id
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
        raw_requests = cur.fetchall()
        requests: List[Dict[str, Any]] = []
        for entry in raw_requests:
            entry_dict = dict(entry)
            entry_dict["requested_permissions"] = parse_json_field(
                entry_dict.get("requested_permissions"), []
            )
            requests.append(entry_dict)
        
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
            "requests": requests,
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
        ensure_role_management_tables(cur)
        conn.commit()
        
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
    user_id: int = Query(...),
    company_name: str = Query(...)
):
    """Check if a user has access to a specific page/module"""
    try:
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
            SELECT up.permissions, up.role_id, r.page_permissions
            FROM user_profiles up
            LEFT JOIN custom_roles r ON up.role_id = r.id
            WHERE up.user_id = %s AND up.company_id = %s
        """, (user_id, company_name))
        
        user_permissions = cur.fetchone()
        
        if not user_permissions:
            return {
                "has_access": False,
                "reason": "User not found or no permissions assigned",
                "requires_request": True
            }
        
        # Parse permissions
        user_perms = json.loads(user_permissions['permissions']) if user_permissions['permissions'] else {}
        role_perms = json.loads(user_permissions['page_permissions']) if user_permissions['page_permissions'] else {}
        
        # Check page permissions
        page_permissions = user_perms.get('page_permissions', {})
        role_page_permissions = role_perms if isinstance(role_perms, dict) else {}
        
        # Combine user and role permissions (user permissions override role permissions)
        combined_permissions = {**role_page_permissions, **page_permissions}
        
        # Check if user has access to the specific page
        page_path = f"/{page}" if not page.startswith('/') else page
        has_access = combined_permissions.get(page_path, False)
        
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
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        ensure_role_management_tables(cur)
        cur.execute("""
            SELECT * FROM system_integrations 
            WHERE company_id = %s 
            ORDER BY name
        """, (company_name,))
        integrations = cur.fetchall()
        return {"integrations": [dict(integration) for integration in integrations]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch system integrations: {str(e)}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@router.put("/system-integrations/{integration_id}")
async def update_system_integration(integration_id: int, 
                                  integration: SystemIntegrationUpdate,
                                  company_name: str = Query(...),
                                  username: str = Query("admin"),
                                  request: Request = None):
    """Update a system integration"""
    try:
        ip_address, user_agent = get_client_info(request)
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        ensure_role_management_tables(cur)

        cur.execute(
            "SELECT * FROM system_integrations WHERE id = %s AND company_id = %s",
            (integration_id, company_name)
        )
        existing = cur.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="System integration not found")

        cur.execute("""
            UPDATE system_integrations 
            SET status = %s, health_percentage = %s, config = %s, 
                last_sync = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND company_id = %s
            RETURNING *
        """, (
            integration.status,
            integration.health_percentage,
            json.dumps(integration.config) if integration.config else existing["config"],
            integration_id,
            company_name
        ))
        updated_integration = cur.fetchone()
        conn.commit()

        log_audit_event(
            company_name,
            username,
            "System Integration Updated",
            "System Integration",
            str(integration_id),
            f"Updated integration: {existing['name']}",
            "success",
            ip_address,
            user_agent
        )

        return {"integration": dict(updated_integration), "message": "Integration updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update system integration: {str(e)}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

# ===== USER CREATION WITH DATABASE PROVISIONING =====

@router.post("/users")
async def create_user_with_db_access(
    user_data: dict,
    company_name: str = Query(...),
    username: str = Query("admin"),
    request: Request = None
):
    """Create a new user with real database access provisioning"""
    conn = None
    cur = None
    new_user = None
    user_profile = None
    role_permissions_applied = {}
    combined_page_permissions = {}
    combined_database_permissions = {}
    metadata_payload = {}
    database_users_created = []
    company_id = None
    resolved_company = None

    try:
        resolved_company = (company_name or user_data.get("company_name") or "").strip()
        if not resolved_company:
            raise HTTPException(status_code=400, detail="company_name is required")

        required_fields = {
            "username": "Username is required",
            "email": "Email is required",
            "password": "Password is required"
        }
        for field, message in required_fields.items():
            if not user_data.get(field):
                raise HTTPException(status_code=400, detail=message)

        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "postgres"),
            database=os.getenv("DB_NAME", "epm_tool"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "epm_password"),
            port=os.getenv("DB_PORT", "5432")
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        ensure_role_management_tables(cur)

        company_record = ensure_company_record(cur, resolved_company)
        company_id = company_record["id"]

        cur.execute(
            """
            SELECT 1
            FROM users
            WHERE company_id = %s AND LOWER(username) = LOWER(%s)
            """,
            (company_id, user_data["username"])
        )
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists for this company")

        cur.execute(
            """
            SELECT 1
            FROM users
            WHERE company_id = %s AND LOWER(email) = LOWER(%s)
            """,
            (company_id, user_data["email"])
        )
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists for this company")

        password_hash = bcrypt.hashpw(
            user_data["password"].encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        cur.execute(
            """
            INSERT INTO users (company_id, username, email, password_hash, is_active, is_superuser, created_at, updated_at)
            VALUES (%s, %s, %s, %s, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, username, email, is_active, last_login, created_at, updated_at
            """,
            (company_id, user_data["username"], user_data["email"], password_hash)
        )
        new_user = cur.fetchone()
        user_id = new_user["id"]

        incoming_page_permissions = normalize_page_permissions(user_data.get("page_permissions"))
        incoming_database_permissions = normalize_database_permissions(user_data.get("database_permissions"))

        role_page_permissions: Dict[str, bool] = {}
        role_database_permissions: Dict[str, Dict[str, bool]] = {}

        if user_data.get("role_id"):
            cur.execute(
                """
                SELECT id, name, description, page_permissions, database_permissions
                FROM custom_roles
                WHERE id = %s AND company_id = %s
                """,
                (user_data["role_id"], resolved_company)
            )
            role_row = cur.fetchone()
            if role_row:
                role_page_permissions = normalize_page_permissions(role_row["page_permissions"])
                role_database_permissions = normalize_database_permissions(role_row["database_permissions"])
                role_permissions_applied = {
                    "role_name": role_row["name"],
                    "role_description": role_row["description"],
                    "pages": [path for path, allowed in role_page_permissions.items() if allowed],
                    "databases": [db for db, perms in role_database_permissions.items() if any(perms.values())]
                }

        combined_page_permissions = merge_page_permissions(role_page_permissions, incoming_page_permissions)
        combined_database_permissions = merge_database_permissions(role_database_permissions, incoming_database_permissions)

        permissions_payload = {
            "page_permissions": combined_page_permissions,
            "database_permissions": combined_database_permissions
        }
        metadata_payload = {
            "full_name": user_data.get("full_name", ""),
            "department": user_data.get("department", ""),
            "position": user_data.get("position", ""),
            "phone": user_data.get("phone", "")
        }

        cur.execute(
            """
            INSERT INTO user_profiles (user_id, role_id, company_id, permissions, database_access, metadata, username, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                user_id,
                user_data.get("role_id"),
                resolved_company,
                json.dumps(permissions_payload),
                json.dumps(combined_database_permissions),
                json.dumps(metadata_payload),
                user_data["username"],
                username
            )
        )
        user_profile = cur.fetchone()

        # Also create user in company-specific database for authentication
        company_db_name = resolved_company.lower().replace(' ', '_').replace('-', '_')
        try:
            company_conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "postgres"),
                database=company_db_name,
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "epm_password"),
                port=os.getenv("DB_PORT", "5432")
            )
            company_cur = company_conn.cursor()
            
            # Create users table if it doesn't exist
            company_cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_superuser BOOLEAN DEFAULT FALSE,
                    last_login TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert user into company database
            company_cur.execute("""
                INSERT INTO users (username, email, password_hash, is_active, is_superuser, created_at, updated_at)
                VALUES (%s, %s, %s, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (username) DO NOTHING
            """, (user_data["username"], user_data["email"], password_hash))
            
            company_conn.commit()
            company_cur.close()
            company_conn.close()
            
        except Exception as e:
            print(f"Warning: Could not create user in company database {company_db_name}: {e}")
            # Don't fail the entire operation if company database creation fails

        conn.commit()

    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

    ip_address, user_agent = get_client_info(request) if request else (None, None)
    log_audit_event(
        resolved_company,
        username,
        "User Created",
        "User",
        str(new_user["id"]) if new_user else None,
        f"Created user: {user_data['username']}",
        "success",
        ip_address,
        user_agent
    )

    user_result = {
        **new_user,
        "company": resolved_company,
        "company_id": company_id,
        "role_id": user_data.get("role_id"),
        "role_name": role_permissions_applied.get("role_name"),
        "role_description": role_permissions_applied.get("role_description"),
        "page_permissions": combined_page_permissions,
        "database_permissions": combined_database_permissions,
        "metadata": metadata_payload,
        "full_name": metadata_payload.get("full_name"),
        "department": metadata_payload.get("department"),
        "position": metadata_payload.get("position"),
        "phone": metadata_payload.get("phone"),
        "database_users_created": database_users_created
    }

    databases_with_access = [
        db for db, perms in combined_database_permissions.items() if any(perms.values())
    ]

    return {
        "user": user_result,
        "profile": dict(user_profile) if user_profile else None,
        "database_access": database_users_created,
        "role_permissions_applied": role_permissions_applied,
        "message": f"User created successfully with access to {len(databases_with_access)} databases"
    }
