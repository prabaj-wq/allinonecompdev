-- ============================================================================
-- Role Management Schema
-- ============================================================================
-- This script provisions the dedicated role management tables inside the main
-- `epm_tool` database. The tables are intentionally empty; no demo data is
-- inserted so that production deployments start in a clean state.
-- ============================================================================

-- Custom roles definition
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
    UNIQUE (name, company_id)
);

-- Detailed permission catalogue for each role
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
);

-- User profile extensions that track role assignments and overrides
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES custom_roles(id) ON DELETE SET NULL,
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
    UNIQUE (user_id, company_id)
);

-- Audit log table capturing compliance activity
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
);

-- Access request workflow table
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
);

-- Connected system registry
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
    UNIQUE (name, company_id)
);

-- Generic function for updating `updated_at` columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to tables that need automatic `updated_at` maintenance
CREATE TRIGGER trg_custom_roles_updated_at
BEFORE UPDATE ON custom_roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_system_integrations_updated_at
BEFORE UPDATE ON system_integrations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helpful indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_roles_company ON custom_roles (company_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions_detailed (role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_username ON user_profiles (company_id, username);
CREATE INDEX IF NOT EXISTS idx_role_management_audit_company ON role_management_audit_logs (company_id);
CREATE INDEX IF NOT EXISTS idx_role_management_audit_timestamp ON role_management_audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_company_status ON access_requests (company_id, status);
CREATE INDEX IF NOT EXISTS idx_access_requests_requested_at ON access_requests (requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_integrations_company ON system_integrations (company_id);
