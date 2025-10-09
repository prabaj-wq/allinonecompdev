-- Role Management Database Schema
-- This file creates all necessary tables for the role management system

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    company_id VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    UNIQUE(name, company_id)
);

-- Create users table (extends existing user system)
CREATE TABLE IF NOT EXISTS role_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    company_id VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(username, company_id),
    UNIQUE(email, company_id)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL, -- user_management, role_management, database_access, etc.
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, execute
    company_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, company_id)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(255),
    UNIQUE(role_id, permission_id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES role_users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255),
    resource_id VARCHAR(100),
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    company_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, warning
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create access_requests table
CREATE TABLE IF NOT EXISTS access_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES role_users(id) ON DELETE CASCADE,
    requester_username VARCHAR(100) NOT NULL,
    requested_role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    current_role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    reviewer_id INTEGER REFERENCES role_users(id) ON DELETE SET NULL,
    reviewer_username VARCHAR(100),
    review_reason TEXT,
    company_id VARCHAR(255) NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Create system_integrations table
CREATE TABLE IF NOT EXISTS system_integrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- PostgreSQL, Internal API, REST API, File System
    description TEXT,
    connection_string TEXT,
    status VARCHAR(20) DEFAULT 'disconnected', -- connected, warning, error, disconnected
    health_percentage INTEGER DEFAULT 0,
    last_sync TIMESTAMP,
    company_id VARCHAR(255) NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, company_id)
);

-- Insert default permissions
INSERT INTO permissions (name, description, module, action, company_id) VALUES
-- User Management Permissions
('user_create', 'Create new users', 'user_management', 'create', 'Default Company'),
('user_read', 'View user information', 'user_management', 'read', 'Default Company'),
('user_update', 'Update user information', 'user_management', 'update', 'Default Company'),
('user_delete', 'Delete users', 'user_management', 'delete', 'Default Company'),

-- Role Management Permissions
('role_create', 'Create new roles', 'role_management', 'create', 'Default Company'),
('role_read', 'View role information', 'role_management', 'read', 'Default Company'),
('role_update', 'Update role information', 'role_management', 'update', 'Default Company'),
('role_delete', 'Delete roles', 'role_management', 'delete', 'Default Company'),

-- Database Access Permissions
('database_create', 'Create database records', 'database_access', 'create', 'Default Company'),
('database_read', 'Read database records', 'database_access', 'read', 'Default Company'),
('database_update', 'Update database records', 'database_access', 'update', 'Default Company'),
('database_delete', 'Delete database records', 'database_access', 'delete', 'Default Company'),
('database_execute', 'Execute database queries', 'database_access', 'execute', 'Default Company'),

-- System Settings Permissions
('settings_create', 'Create system settings', 'system_settings', 'create', 'Default Company'),
('settings_read', 'View system settings', 'system_settings', 'read', 'Default Company'),
('settings_update', 'Update system settings', 'system_settings', 'update', 'Default Company'),
('settings_delete', 'Delete system settings', 'system_settings', 'delete', 'Default Company'),

-- Audit Logs Permissions
('audit_read', 'View audit logs', 'audit_logs', 'read', 'Default Company')
ON CONFLICT (name, company_id) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, company_id, permissions) VALUES
('Super Admin', 'Full system access with all permissions', 'Default Company', '{"user_management": ["create", "read", "update", "delete"], "role_management": ["create", "read", "update", "delete"], "database_access": ["create", "read", "update", "delete", "execute"], "system_settings": ["create", "read", "update", "delete"], "audit_logs": ["read"]}'),
('Admin', 'Administrative access with most permissions', 'Default Company', '{"user_management": ["create", "read", "update", "delete"], "role_management": ["read"], "database_access": ["create", "read", "update", "delete", "execute"], "system_settings": ["read"], "audit_logs": ["read"]}'),
('Manager', 'Management access with limited permissions', 'Default Company', '{"user_management": ["read"], "role_management": [], "database_access": ["create", "read", "update", "delete"], "system_settings": [], "audit_logs": ["read"]}'),
('User', 'Standard user access', 'Default Company', '{"user_management": [], "role_management": [], "database_access": ["read", "update"], "system_settings": [], "audit_logs": []}'),
('Viewer', 'Read-only access', 'Default Company', '{"user_management": [], "role_management": [], "database_access": ["read"], "system_settings": [], "audit_logs": []}')
ON CONFLICT (name, company_id) DO NOTHING;

-- Insert default system integrations
INSERT INTO system_integrations (name, type, description, status, health_percentage, company_id, last_sync) VALUES
('EPM Tool Database', 'PostgreSQL', 'Main application database', 'connected', 98, 'Default Company', CURRENT_TIMESTAMP),
('User Authentication API', 'Internal API', 'Internal user authentication service', 'connected', 95, 'Default Company', CURRENT_TIMESTAMP),
('External Data API', 'REST API', 'External financial data integration', 'warning', 85, 'Default Company', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('File Storage System', 'File System', 'Document and file storage system', 'connected', 92, 'Default Company', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
('Backup Service', 'Internal API', 'Automated backup and recovery service', 'error', 0, 'Default Company', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (name, company_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roles_company_id ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_role_users_company_id ON role_users(company_id);
CREATE INDEX IF NOT EXISTS idx_role_users_role_id ON role_users(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_company_id ON permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_requests_company_id ON access_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_system_integrations_company_id ON system_integrations(company_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_users_updated_at BEFORE UPDATE ON role_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_integrations_updated_at BEFORE UPDATE ON system_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
