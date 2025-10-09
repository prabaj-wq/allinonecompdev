"""
Initialize Role Management Database Schema
Run this script to create all necessary tables and initial data for role management
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

def get_db_connection():
    """Get database connection using environment variables"""
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=int(os.getenv('POSTGRES_PORT', 5432)),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'epm_password'),
        database=os.getenv('POSTGRES_DB', 'epm_tool')
    )

def execute_sql_file(cursor, file_path):
    """Execute SQL commands from a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
            
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for statement in statements:
            if statement:
                cursor.execute(statement)
                
        print(f"✅ Successfully executed SQL file: {file_path}")
        return True
    except Exception as e:
        print(f"❌ Error executing SQL file {file_path}: {e}")
        return False

def initialize_role_management_schema():
    """Initialize the role management database schema"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("🚀 Initializing Role Management Database Schema...")
        
        # Execute the schema file
        schema_file = os.path.join(os.path.dirname(__file__), 'database', 'role_management_schema.sql')
        
        if not os.path.exists(schema_file):
            print(f"❌ Schema file not found: {schema_file}")
            return False
            
        success = execute_sql_file(cursor, schema_file)
        
        if success:
            conn.commit()
            print("✅ Role Management schema initialized successfully!")
            
            # Verify tables were created
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('roles', 'role_users', 'permissions', 'role_permissions', 
                                  'audit_logs', 'access_requests', 'system_integrations')
                ORDER BY table_name
            """)
            
            tables = cursor.fetchall()
            print(f"📊 Created {len(tables)} role management tables:")
            for table in tables:
                print(f"   - {table[0]}")
                
            return True
        else:
            conn.rollback()
            return False
            
    except Exception as e:
        print(f"❌ Error initializing role management schema: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def add_sample_data():
    """Add sample data for testing"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("📝 Adding sample data...")
        
        # Add sample users
        sample_users = [
            {
                'username': 'admin',
                'email': 'admin@company.com',
                'full_name': 'System Administrator',
                'company_id': 'Default Company',
                'role_id': 1  # Super Admin
            },
            {
                'username': 'john.doe',
                'email': 'john.doe@company.com',
                'full_name': 'John Doe',
                'company_id': 'Default Company',
                'role_id': 2  # Admin
            },
            {
                'username': 'jane.smith',
                'email': 'jane.smith@company.com',
                'full_name': 'Jane Smith',
                'company_id': 'Default Company',
                'role_id': 3  # Manager
            }
        ]
        
        for user in sample_users:
            cursor.execute("""
                INSERT INTO role_users (username, email, full_name, company_id, role_id)
                VALUES (%(username)s, %(email)s, %(full_name)s, %(company_id)s, %(role_id)s)
                ON CONFLICT (username, company_id) DO NOTHING
            """, user)
        
        # Add sample audit logs
        sample_logs = [
            {
                'username': 'admin',
                'action': 'User Login',
                'resource': 'Authentication',
                'details': 'Successful login from web interface',
                'company_id': 'Default Company',
                'status': 'success'
            },
            {
                'username': 'john.doe',
                'action': 'Role Updated',
                'resource': 'Role: Manager',
                'details': 'Updated role permissions',
                'company_id': 'Default Company',
                'status': 'success'
            },
            {
                'username': 'jane.smith',
                'action': 'Database Access',
                'resource': 'Database: epm_tool',
                'details': 'Accessed financial data for reporting',
                'company_id': 'Default Company',
                'status': 'success'
            }
        ]
        
        for log in sample_logs:
            cursor.execute("""
                INSERT INTO audit_logs (username, action, resource, details, company_id, status, timestamp)
                VALUES (%(username)s, %(action)s, %(resource)s, %(details)s, %(company_id)s, %(status)s, %s)
            """, (*log.values(), datetime.now()))
        
        # Add sample access requests
        sample_requests = [
            {
                'requester_username': 'jane.smith',
                'requested_role_id': 2,  # Admin
                'current_role_id': 3,    # Manager
                'reason': 'Need admin access for quarterly reporting tasks',
                'company_id': 'Default Company',
                'status': 'pending'
            }
        ]
        
        for request in sample_requests:
            cursor.execute("""
                INSERT INTO access_requests (requester_username, requested_role_id, current_role_id, reason, company_id, status)
                VALUES (%(requester_username)s, %(requested_role_id)s, %(current_role_id)s, %(reason)s, %(company_id)s, %(status)s)
            """, request)
        
        conn.commit()
        print("✅ Sample data added successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error adding sample data: {e}")
        conn.rollback()
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def verify_installation():
    """Verify the installation by checking data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("🔍 Verifying installation...")
        
        # Check roles
        cursor.execute("SELECT COUNT(*) as count FROM roles WHERE company_id = 'Default Company'")
        roles_count = cursor.fetchone()['count']
        print(f"   📋 Roles: {roles_count}")
        
        # Check permissions
        cursor.execute("SELECT COUNT(*) as count FROM permissions WHERE company_id = 'Default Company'")
        permissions_count = cursor.fetchone()['count']
        print(f"   🔐 Permissions: {permissions_count}")
        
        # Check users
        cursor.execute("SELECT COUNT(*) as count FROM role_users WHERE company_id = 'Default Company'")
        users_count = cursor.fetchone()['count']
        print(f"   👥 Users: {users_count}")
        
        # Check audit logs
        cursor.execute("SELECT COUNT(*) as count FROM audit_logs WHERE company_id = 'Default Company'")
        logs_count = cursor.fetchone()['count']
        print(f"   📊 Audit Logs: {logs_count}")
        
        # Check system integrations
        cursor.execute("SELECT COUNT(*) as count FROM system_integrations WHERE company_id = 'Default Company'")
        integrations_count = cursor.fetchone()['count']
        print(f"   🔗 System Integrations: {integrations_count}")
        
        if all([roles_count > 0, permissions_count > 0, integrations_count > 0]):
            print("✅ Role Management system is ready!")
            return True
        else:
            print("❌ Some data is missing. Please check the installation.")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying installation: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def main():
    """Main initialization function"""
    print("=" * 60)
    print("🚀 ROLE MANAGEMENT SYSTEM INITIALIZATION")
    print("=" * 60)
    
    # Step 1: Initialize schema
    if not initialize_role_management_schema():
        print("❌ Failed to initialize schema. Exiting.")
        return False
    
    print()
    
    # Step 2: Add sample data
    if not add_sample_data():
        print("❌ Failed to add sample data. Exiting.")
        return False
    
    print()
    
    # Step 3: Verify installation
    if not verify_installation():
        print("❌ Installation verification failed.")
        return False
    
    print()
    print("=" * 60)
    print("🎉 ROLE MANAGEMENT SYSTEM READY!")
    print("=" * 60)
    print("📍 API Endpoints available at:")
    print("   - GET  /api/role-management/roles")
    print("   - POST /api/role-management/roles")
    print("   - GET  /api/role-management/users")
    print("   - GET  /api/role-management/audit-logs")
    print("   - GET  /api/role-management/permission-matrix")
    print("   - GET  /api/role-management/system-integrations")
    print()
    print("🔐 Default Admin User:")
    print("   - Username: admin")
    print("   - Email: admin@company.com")
    print("   - Role: Super Admin")
    print()
    print("🎯 Ready for production use!")
    
    return True

if __name__ == "__main__":
    main()
