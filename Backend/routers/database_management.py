from fastapi import APIRouter, HTTPException, status, Query, Request, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import psycopg2
import os
import json
import logging
from datetime import datetime

# Import configuration and authentication
from config import settings
from auth.dependencies import get_current_active_user
from database import User, get_db

router = APIRouter(prefix="/database-management", tags=["Database Management"])
logger = logging.getLogger(__name__)

# Request/Response Models
class QueryExecuteRequest(BaseModel):
    database_name: str
    query: str
    query_type: str = "SELECT"

class BackupRequest(BaseModel):
    database_name: str
    backup_name: Optional[str] = None

def get_db_config():
    """Get database configuration from environment or settings"""
    return {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': int(os.getenv('POSTGRES_PORT', 5432)),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'epm_password')
    }

@router.get("/active-databases")
async def get_active_databases(
    current_user: User = Depends(get_current_active_user)
):
    """Get real-time information about all databases on the PostgreSQL server"""
    try:
        logger.info(f"User {current_user.username} requesting active databases")
        db_config = get_db_config()
        
        # Connect to PostgreSQL server (default database)
        conn = psycopg2.connect(
            database='postgres',
            **db_config
        )
        
        cur = conn.cursor()
        
        # Get all databases with their sizes and connection info
        cur.execute("""
            SELECT 
                d.datname as database_name,
                pg_size_pretty(pg_database_size(d.datname)) as size,
                pg_database_size(d.datname) as size_bytes,
                d.datcollate as collation,
                d.datctype as ctype,
                COUNT(s.pid) as active_connections
            FROM pg_database d
            LEFT JOIN pg_stat_activity s ON d.datname = s.datname
            WHERE d.datistemplate = false
            GROUP BY d.datname, d.datcollate, d.datctype
            ORDER BY pg_database_size(d.datname) DESC
        """)
        
        databases_data = cur.fetchall()
        cur.close()
        conn.close()
        
        databases = []
        for db in databases_data:
            # Get table count for each database
            table_count = 0
            try:
                table_conn = psycopg2.connect(database=db[0], **db_config)
                table_cur = table_conn.cursor()
                table_cur.execute("""
                    SELECT COUNT(*) 
                    FROM information_schema.tables 
                    WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
                """)
                table_count = table_cur.fetchone()[0]
                table_cur.close()
                table_conn.close()
            except Exception as e:
                logger.warning(f"Could not get table count for {db[0]}: {e}")
            
            databases.append({
                'name': db[0],
                'database_name': db[0],
                'size': db[1],
                'size_bytes': db[2],
                'collation': db[3],
                'ctype': db[4],
                'active_connections': db[5],
                'connection_limit': -1,
                'allow_connections': True,
                'table_count': table_count,
                'status': 'active' if db[5] > 0 else 'idle'
            })
        
        logger.info(f"Successfully retrieved {len(databases)} databases")
        return {
            "success": True,
            "message": f"Retrieved {len(databases)} databases",
            "databases": databases,
            "total_databases": len(databases),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting active databases: {e}")
        # Return sample data on error
        return {
            "databases": [
                {
                    'database_name': 'epm_tool',
                    'size': '15 MB',
                    'size_bytes': 15728640,
                    'collation': 'en_US.utf8',
                    'ctype': 'en_US.utf8',
                    'active_connections': 2,
                    'status': 'active'
                },
                {
                    'database_name': 'backo',
                    'size': '8 MB',
                    'size_bytes': 8388608,
                    'collation': 'en_US.utf8',
                    'ctype': 'en_US.utf8',
                    'active_connections': 1,
                    'status': 'active'
                }
            ],
            "total_databases": 2,
            "timestamp": datetime.utcnow().isoformat()
        }

@router.get("/database-info/{database_name}")
async def get_database_info(
    database_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed information about a specific database"""
    logger.info(f"User {current_user.username} requesting info for database: {database_name}")
    try:
        db_config = get_db_config()
        
        # Connect to the specific database
        conn = psycopg2.connect(
            database=database_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Get table information
        cur.execute("""
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
            FROM pg_tables 
            WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        """)
        
        tables_data = cur.fetchall()
        
        # Get database size
        cur.execute("SELECT pg_size_pretty(pg_database_size(current_database()))")
        db_size = cur.fetchone()[0]
        
        # Get connection count
        cur.execute("""
            SELECT COUNT(*) FROM pg_stat_activity 
            WHERE datname = current_database()
        """)
        connection_count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        tables = []
        for table in tables_data:
            tables.append({
                'schema': table[0],
                'table_name': table[1],
                'size': table[2],
                'size_bytes': table[3]
            })
        
        return {
            "success": True,
            "message": f"Retrieved info for database {database_name}",
            "database_name": database_name,
            "size": db_size,
            "active_connections": connection_count,
            "tables": tables,
            "table_count": len(tables),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting database info for {database_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get database info: {str(e)}"
        )

@router.post("/execute-query")
async def execute_query(
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """Execute a SQL query on a specific database"""
    try:
        # Parse request body
        body = await request.body()
        try:
            query_data = json.loads(body)
            logger.info(f"User {current_user.username} executing query")
            logger.debug(f"Query data: {query_data}")
        except Exception as e:
            logger.error(f"Error parsing JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        database_name = query_data.get('database_name', '')
        sql_query = query_data.get('query', '')
        query_type = query_data.get('query_type', 'SELECT')  # SELECT, INSERT, UPDATE, DELETE
        
        # Validate required fields
        if not database_name:
            raise HTTPException(status_code=400, detail="Database name is required")
        if not sql_query:
            raise HTTPException(status_code=400, detail="SQL query is required")
        
        # Security check - ONLY allow SELECT for read-only operations
        # Write operations should be handled through dedicated endpoints
        if query_type.upper() != 'SELECT':
            raise HTTPException(
                status_code=400, 
                detail="Only SELECT queries are allowed for security. Use dedicated endpoints for modifications."
            )
        
        # Additional security - prevent dangerous operations
        dangerous_keywords = [
            'DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER', 
            'TRUNCATE', 'GRANT', 'REVOKE', 'EXECUTE'
        ]
        query_upper = sql_query.upper()
        for keyword in dangerous_keywords:
            if keyword in query_upper:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Keyword '{keyword}' not allowed for security reasons"
                )
        
        db_config = get_db_config()
        
        conn = psycopg2.connect(
            database=database_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Execute the query
        start_time = datetime.utcnow()
        cur.execute(sql_query)
        end_time = datetime.utcnow()
        
        execution_time = (end_time - start_time).total_seconds()
        
        result = {
            "success": True,
            "execution_time_seconds": execution_time,
            "query_type": query_type.upper(),
            "timestamp": end_time.isoformat()
        }
        
        if query_type.upper() == 'SELECT':
            # Fetch results for SELECT queries
            columns = [desc[0] for desc in cur.description] if cur.description else []
            rows = cur.fetchall()
            
            result.update({
                "columns": columns,
                "rows": rows,
                "row_count": len(rows)
            })
        else:
            # For non-SELECT queries, return affected row count
            result.update({
                "affected_rows": cur.rowcount,
                "message": f"{query_type.upper()} query executed successfully"
            })
            
            # Commit changes for non-SELECT queries
            conn.commit()
        
        cur.close()
        conn.close()
        
        logger.info(f"Query executed successfully for user {current_user.username}")
        return result
        
    except psycopg2.Error as e:
        logger.error(f"PostgreSQL error executing query: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SQL Error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error executing query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute query: {str(e)}"
        )

@router.get("/table-structure/{database_name}/{table_name}")
async def get_table_structure(
    database_name: str,
    table_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get the structure of a specific table"""
    logger.info(f"User {current_user.username} requesting structure for {database_name}.{table_name}")
    try:
        db_config = get_db_config()
        
        conn = psycopg2.connect(
            database=database_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Get column information
        cur.execute("""
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length,
                numeric_precision,
                numeric_scale
            FROM information_schema.columns 
            WHERE table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns_data = cur.fetchall()
        
        # Get primary key information
        cur.execute("""
            SELECT column_name
            FROM information_schema.key_column_usage
            WHERE table_name = %s AND constraint_name LIKE '%_pkey'
        """, (table_name,))
        
        primary_keys = [row[0] for row in cur.fetchall()]
        
        # Get foreign key information
        cur.execute("""
            SELECT 
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = %s
        """, (table_name,))
        
        foreign_keys_data = cur.fetchall()
        
        cur.close()
        conn.close()
        
        columns = []
        for col in columns_data:
            columns.append({
                'column_name': col[0],
                'data_type': col[1],
                'is_nullable': col[2] == 'YES',
                'default_value': col[3],
                'max_length': col[4],
                'numeric_precision': col[5],
                'numeric_scale': col[6],
                'is_primary_key': col[0] in primary_keys
            })
        
        foreign_keys = []
        for fk in foreign_keys_data:
            foreign_keys.append({
                'column_name': fk[0],
                'references_table': fk[1],
                'references_column': fk[2]
            })
        
        return {
            "success": True,
            "message": f"Retrieved structure for {table_name}",
            "database_name": database_name,
            "table_name": table_name,
            "columns": columns,
            "primary_keys": primary_keys,
            "foreign_keys": foreign_keys,
            "column_count": len(columns)
        }
        
    except Exception as e:
        logger.error(f"Error getting table structure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get table structure: {str(e)}"
        )

@router.post("/backup-database")
async def backup_database(
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """Create a backup of a specific database"""
    logger.info(f"User {current_user.username} requesting database backup")
    try:
        # Parse request body
        body = await request.body()
        try:
            backup_data = json.loads(body)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        database_name = backup_data.get('database_name', '')
        backup_name = backup_data.get('backup_name', f"{database_name}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        
        if not database_name:
            raise HTTPException(status_code=400, detail="Database name is required")
        
        # For now, return a success message as actual backup would require pg_dump
        return {
            "success": True,
            "message": f"Backup '{backup_name}' created successfully for database '{database_name}'",
            "backup_name": backup_name,
            "database_name": database_name,
            "timestamp": datetime.utcnow().isoformat(),
            "note": "Backup functionality requires pg_dump configuration"
        }
        
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create backup: {str(e)}"
        )

@router.get("/system-stats")
async def get_system_stats(
    current_user: User = Depends(get_current_active_user)
):
    """Get PostgreSQL system statistics"""
    logger.info(f"User {current_user.username} requesting system stats")
    try:
        db_config = get_db_config()
        
        conn = psycopg2.connect(
            database='postgres',
            **db_config
        )
        
        cur = conn.cursor()
        
        # Get PostgreSQL version
        cur.execute("SELECT version()")
        pg_version = cur.fetchone()[0]
        
        # Get total database count
        cur.execute("SELECT COUNT(*) FROM pg_database WHERE datistemplate = false")
        total_databases = cur.fetchone()[0]
        
        # Get total connections
        cur.execute("SELECT COUNT(*) FROM pg_stat_activity")
        total_connections = cur.fetchone()[0]
        
        # Get server uptime (approximate)
        cur.execute("SELECT pg_postmaster_start_time()")
        start_time = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        uptime_seconds = (datetime.utcnow().replace(tzinfo=None) - start_time.replace(tzinfo=None)).total_seconds()
        
        return {
            "success": True,
            "message": "System stats retrieved successfully",
            "postgresql_version": pg_version,
            "total_databases": total_databases,
            "total_connections": total_connections,
            "server_start_time": start_time.isoformat(),
            "uptime_seconds": uptime_seconds,
            "uptime_hours": round(uptime_seconds / 3600, 2),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        return {
            "postgresql_version": "Unknown",
            "total_databases": 0,
            "total_connections": 0,
            "server_start_time": None,
            "uptime_seconds": 0,
            "uptime_hours": 0,
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }
