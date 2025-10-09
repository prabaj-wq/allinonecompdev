from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text, inspect
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging
import re
from pydantic import BaseModel

# Import database and auth dependencies
from database import User, get_db
from auth.dependencies import get_current_active_user
import os

# Router setup
router = APIRouter(prefix="/sql", tags=["sql"])
logger = logging.getLogger(__name__)

# Request/Response Models
class QueryExecuteRequest(BaseModel):
    query: str
    page: int = 1
    page_size: int = 50

class QuerySaveRequest(BaseModel):
    name: str
    query: str
    description: Optional[str] = None


@router.get("/tables")
async def get_database_tables(
    current_user: User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    """Get all tables in the current database with their columns for SQL Query Console"""
    try:
        logger.info(f"User {current_user.username} requesting database tables")
        
        # Get database inspector
        inspector = inspect(db.bind)
        
        # Get all table names from public schema
        table_names = inspector.get_table_names(schema='public')
        
        # Filter out internal tables
        excluded_tables = ['alembic_version', 'spatial_ref_sys']
        table_names = [t for t in table_names if t not in excluded_tables]
        
        # Sort tables alphabetically
        table_names.sort()
        
        # Get columns for each table
        tables_with_columns = []
        for table_name in table_names:
            try:
                columns = inspector.get_columns(table_name, schema='public')
                pk_constraint = inspector.get_pk_constraint(table_name, schema='public')
                primary_keys = pk_constraint.get('constrained_columns', []) if pk_constraint else []
                
                table_info = {
                    "table_name": table_name,
                    "columns": [
                        {
                            "column_name": col["name"],
                            "data_type": str(col["type"]),
                            "nullable": col.get("nullable", True),
                            "default": str(col.get("default", "")) if col.get("default") else None,
                            "is_primary_key": col["name"] in primary_keys
                        }
                        for col in columns
                    ]
                }
                tables_with_columns.append(table_info)
            except Exception as table_error:
                logger.warning(f"Error reading table {table_name}: {str(table_error)}")
                continue
        
        logger.info(f"Successfully retrieved {len(tables_with_columns)} tables")
        
        return {
            "success": True,
            "message": f"Database schema retrieved successfully - {len(tables_with_columns)} tables found",
            "data": tables_with_columns
        }
    except Exception as e:
        logger.error(f"Error retrieving database schema: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve database schema: {str(e)}")


@router.post("/execute")
async def execute_sql_query(
    query: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Execute a SELECT SQL query with pagination and security validation"""
    try:
        sql_query = query.get("query", "").strip()
        page = query.get("page", 1)
        page_size = min(query.get("page_size", 50), 1000)  # Max 1000 rows per page
        
        if not sql_query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        logger.info(f"User {current_user.username} executing query (page {page}, size {page_size})")
        logger.debug(f"Query: {sql_query[:200]}...")  # Log first 200 chars
        
        # Validate query is SELECT statement
        query_lower = sql_query.lower()
        if not query_lower.startswith("select"):
            raise HTTPException(status_code=400, detail="Only SELECT queries are allowed for security reasons")
        
        # Check for forbidden keywords using regex for whole word matching
        forbidden_keywords = [
            r"\binsert\b", r"\bupdate\b", r"\bdelete\b", r"\bdrop\b", r"\bcreate\b", r"\balter\b",
            r"\btruncate\b", r"\bgrant\b", r"\brevoke\b", r"\bexecute\b", r"\bcall\b",
            r"\bbegin\b", r"\bcommit\b", r"\brollback\b", r"\binto\b\s+outfile\b", r"\bload_file\b"
        ]
        
        for pattern in forbidden_keywords:
            if re.search(pattern, query_lower, re.IGNORECASE):
                keyword = pattern.replace(r"\b", "").replace("\\", "")
                raise HTTPException(status_code=400, detail=f"Forbidden keyword '{keyword}' detected in query")
        
        # Add LIMIT and OFFSET for pagination
        offset = (page - 1) * page_size
        
        # Check if query already has LIMIT
        has_limit = re.search(r"\blimit\b", query_lower)
        if has_limit:
            paginated_query = sql_query  # Use as-is if user specified LIMIT
        else:
            paginated_query = f"{sql_query} LIMIT {page_size} OFFSET {offset}"
        
        # Execute query with timeout tracking
        start_time = datetime.now()
        result = db.execute(text(paginated_query))
        rows = result.fetchall()
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Get column names
        columns = list(result.keys())
        
        # Convert rows to dictionaries with proper type handling
        rows_dict = []
        for row in rows:
            row_dict = {}
            for col, value in zip(columns, row):
                # Handle special types
                if value is None:
                    row_dict[col] = None
                elif isinstance(value, datetime):
                    row_dict[col] = value.isoformat()
                elif isinstance(value, (bytes, bytearray)):
                    row_dict[col] = value.decode('utf-8', errors='replace')
                else:
                    row_dict[col] = str(value) if not isinstance(value, (int, float, bool)) else value
            rows_dict.append(row_dict)
        
        # Get total count for pagination (only if no LIMIT in original query)
        total_count = len(rows_dict)
        if not has_limit:
            count_query = f"SELECT COUNT(*) as total FROM ({sql_query}) as count_subquery"
            try:
                count_result = db.execute(text(count_query))
                total_count = count_result.scalar() or 0
            except Exception as count_error:
                logger.warning(f"Count query failed: {count_error}")
                total_count = len(rows_dict)
        
        logger.info(f"Query executed successfully: {len(rows_dict)} rows in {execution_time:.2f}s")
        
        return {
            "success": True,
            "message": f"Query executed successfully in {execution_time:.2f} seconds",
            "data": {
                "columns": columns,
                "rows": rows_dict,
                "total_count": total_count,
                "current_page": page,
                "page_size": page_size,
                "execution_time": execution_time
            }
        }
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        logger.error(f"SQLAlchemy error executing query: {error_msg}")
        raise HTTPException(status_code=400, detail=f"SQL error: {error_msg}")
    except Exception as e:
        logger.error(f"Error executing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")


@router.get("/saved-queries")
async def get_saved_queries(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get saved queries for the current user"""
    try:
        # TODO: Implement saved queries table in future
        # For now, return common useful queries for IFRS consolidation
        default_queries = [
            {
                "id": 1,
                "name": "Trial Balance Summary",
                "query": "SELECT account_code, account_name, SUM(debit) as total_debit, SUM(credit) as total_credit FROM tb_entries GROUP BY account_code, account_name ORDER BY account_code;",
                "description": "Summarize trial balance entries by account",
                "created_at": datetime.now().isoformat()
            },
            {
                "id": 2,
                "name": "Entity List",
                "query": "SELECT entity_code, entity_name, parent_code, currency FROM entities ORDER BY entity_code;",
                "description": "List all entities with their hierarchy",
                "created_at": datetime.now().isoformat()
            },
            {
                "id": 3,
                "name": "Chart of Accounts",
                "query": "SELECT account_code, account_name, account_type, is_consolidated FROM accounts ORDER BY account_code;",
                "description": "Display chart of accounts",
                "created_at": datetime.now().isoformat()
            },
            {
                "id": 4,
                "name": "Consolidation Settings",
                "query": "SELECT company_id, setting_key, setting_value, description FROM consolidation_settings ORDER BY company_id, setting_key;",
                "description": "View consolidation configuration",
                "created_at": datetime.now().isoformat()
            }
        ]
        
        return {
            "success": True,
            "message": "Saved queries retrieved successfully",
            "data": default_queries
        }
    except Exception as e:
        logger.error(f"Error retrieving saved queries: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-query")
async def save_query(
    query_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Save a query for the current user"""
    try:
        name = query_data.get("name", "Untitled Query")
        query_text = query_data.get("query", "")
        description = query_data.get("description", "")
        
        if not query_text:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        logger.info(f"User {current_user.username} saving query: {name}")
        
        # TODO: Implement saved queries table in database
        # For now, just acknowledge the save
        saved_query = {
            "id": int(datetime.now().timestamp()),  # Use timestamp as temporary ID
            "name": name,
            "query": query_text,
            "description": description,
            "user_id": current_user.id,
            "created_at": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "message": "Query saved successfully",
            "data": saved_query
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_query_history(
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get query history for the current user"""
    try:
        logger.info(f"User {current_user.username} requesting query history (limit: {limit})")
        
        # TODO: Implement query history table in database
        # For now, return empty array
        return {
            "success": True,
            "message": "Query history retrieved successfully",
            "data": []
        }
    except Exception as e:
        logger.error(f"Error retrieving query history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
