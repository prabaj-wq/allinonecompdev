-- Create or update the postgres user with the correct password
ALTER USER postgres PASSWORD 'epm_password';

-- Create epm_user if it doesn't exist with CREATEDB privilege
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'epm_user') THEN
        CREATE USER epm_user WITH PASSWORD 'epm_password' CREATEDB CREATEROLE;
    ELSE
        -- Grant necessary privileges to existing user
        ALTER USER epm_user CREATEDB CREATEROLE;
    END IF;
END
$$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE epm_tool WITH OWNER = epm_user ENCODING = ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'epm_tool')\gexec

-- Connect to the database
\c epm_tool

-- Grant all privileges on the database to epm_user
GRANT ALL PRIVILEGES ON DATABASE epm_tool TO epm_user;

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Grant all privileges on the schema to epm_user
GRANT ALL PRIVILEGES ON SCHEMA public TO epm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO epm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO epm_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO epm_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO epm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO epm_user;

-- Create companies table with all required columns
CREATE TABLE IF NOT EXISTS public.companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    environment_type VARCHAR(50) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table with all required columns
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_user_email UNIQUE(company_id, email),
    CONSTRAINT uq_company_username UNIQUE(company_id, username)
);

-- Role and permission tables removed - these belong in company-specific databases

-- Change ownership of all tables to epm_user
ALTER TABLE public.companies OWNER TO epm_user;
ALTER TABLE public.users OWNER TO epm_user;

-- Set search path for the session
SET search_path TO public;