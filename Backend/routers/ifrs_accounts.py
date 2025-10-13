from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import List, Optional
from pydantic import BaseModel
import psycopg2
import os
import json
import re
from datetime import datetime

router = APIRouter(prefix="/ifrs-accounts", tags=["IFRS Accounts"])

class IFRSAccountCreate(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    description: Optional[str] = ""
    hierarchy_id: Optional[str] = None

class IFRSAccountResponse(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    description: str
    hierarchy_id: Optional[str] = None
    created_date: str

def get_db_config():
    """Get database configuration"""
    if os.getenv('DOCKER_ENV') == 'true':
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
    else:
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
        
    return {
        'host': POSTGRES_HOST,
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'epm_password')
    }

@router.get("/")
def get_ifrs_accounts(company_name: str = Query(None)):
    """Get IFRS account structure for current company"""
    try:
        # Fix company name resolution
        if not company_name or company_name == "Default Company":
            # Get actual company name from database
            try:
                db_config = get_db_config()
                conn = psycopg2.connect(database="epm_tool", **db_config)
                cur = conn.cursor()
                cur.execute("SELECT name FROM companies WHERE status = 'active' ORDER BY created_at ASC LIMIT 1")
                company_result = cur.fetchone()
                if company_result:
                    company_name = company_result[0]
                    print(f"🔧 IFRS: Fixed company name → '{company_name}'")
                else:
                    company_name = "finfusion360"  # Fallback
                cur.close()
                conn.close()
            except Exception as e:
                print(f"Error resolving company for IFRS: {e}")
                company_name = "finfusion360"  # Fallback
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            cur.execute("""
                SELECT account_code, account_name, account_type, description, 
                       hierarchy_id, parent_account_id, account_category, 
                       normal_balance, is_active, created_at, updated_at
                FROM accounts 
                WHERE is_active = TRUE
                ORDER BY account_code
            """)
            
            accounts_data = cur.fetchall()
            cur.close()
            conn.close()
            
            accounts = []
            for account in accounts_data:
                accounts.append({
                    'account_code': account[0],
                    'account_name': account[1],
                    'account_type': account[2],
                    'description': account[3] or '',
                    'hierarchy_id': account[4],
                    'parent_account_id': account[5],
                    'account_category': account[6],
                    'normal_balance': account[7],
                    'is_active': account[8],
                    'created_date': account[9].isoformat() if account[9] else '',
                    'updated_date': account[10].isoformat() if account[10] else '',
                    'statement': account[2]  # Use account_type as statement for compatibility
                })
            
            print(f"Loaded {len(accounts)} accounts from SQL database for company: {company_name}")
            return {"accounts": accounts}
            
        except psycopg2.OperationalError:
            # Return sample accounts if database doesn't exist
            sample_accounts = [
                {
                    'account_code': '1000',
                    'account_name': 'Cash and Cash Equivalents',
                    'account_type': 'Asset',
                    'description': 'Current assets - cash and equivalents',
                    'hierarchy_id': 'A1',
                    'parent_account_id': None,
                    'account_category': 'Current Assets',
                    'normal_balance': 'Debit',
                    'is_active': True,
                    'created_date': '2024-01-01T00:00:00',
                    'updated_date': '2024-01-01T00:00:00',
                    'statement': 'Asset'
                },
                {
                    'account_code': '2000',
                    'account_name': 'Accounts Receivable',
                    'account_type': 'Asset',
                    'description': 'Trade receivables from customers',
                    'hierarchy_id': 'A2',
                    'parent_account_id': None,
                    'account_category': 'Current Assets',
                    'normal_balance': 'Debit',
                    'is_active': True,
                    'created_date': '2024-01-01T00:00:00',
                    'updated_date': '2024-01-01T00:00:00',
                    'statement': 'Asset'
                },
                {
                    'account_code': '4000',
                    'account_name': 'Accounts Payable',
                    'account_type': 'Liability',
                    'description': 'Trade payables to suppliers',
                    'hierarchy_id': 'L1',
                    'parent_account_id': None,
                    'account_category': 'Current Liabilities',
                    'normal_balance': 'Credit',
                    'is_active': True,
                    'created_date': '2024-01-01T00:00:00',
                    'updated_date': '2024-01-01T00:00:00',
                    'statement': 'Liability'
                }
            ]
            return {"accounts": sample_accounts}
            
    except Exception as e:
        print(f"Error in get_ifrs_accounts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_ifrs_account(request: Request):
    """Add new IFRS account for current company"""
    try:
        # Parse request body
        body = await request.body()
        try:
            account_data = json.loads(body)
            print(f"=== ACCOUNT CREATION REQUEST DATA ===")
            print(f"Raw request data: {account_data}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        account_code = account_data.get('account_code', '')
        account_name = account_data.get('account_name', '')
        account_type = account_data.get('account_type', '')
        description = account_data.get('description', '')
        hierarchy_id = account_data.get('hierarchy_id', '')
        
        # Validate required fields
        if not account_code:
            raise HTTPException(status_code=400, detail="Account code is required")
        if not account_name:
            raise HTTPException(status_code=400, detail="Account name is required")
        if not account_type:
            raise HTTPException(status_code=400, detail="Account type is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')  # Default fallback
        
        # Validate account code format (4 digits)
        if not re.match(r'^\d{4}$', account_code):
            raise HTTPException(status_code=400, detail="Account code must be exactly 4 digits")
        
        # Validate account type
        valid_types = ['Asset', 'Liability', 'Equity', 'Income', 'Expense']
        if account_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid account type. Must be one of: {', '.join(valid_types)}")
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Check for duplicate account codes
        cur.execute("SELECT account_code FROM accounts WHERE account_code = %s", (account_code,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail=f"Account code '{account_code}' already exists")
        
        # Determine account category and normal balance based on account type
        account_category_map = {
            'Asset': 'Current Assets',
            'Liability': 'Current Liabilities', 
            'Equity': 'Equity',
            'Income': 'Revenue',
            'Expense': 'Operating Expenses'
        }
        
        normal_balance_map = {
            'Asset': 'Debit',
            'Liability': 'Credit',
            'Equity': 'Credit', 
            'Income': 'Credit',
            'Expense': 'Debit'
        }
        
        account_category = account_category_map.get(account_type, 'Other')
        normal_balance = normal_balance_map.get(account_type, 'Debit')
        
        # Insert new account
        cur.execute("""
            INSERT INTO accounts (account_code, account_name, account_type, description, 
                                hierarchy_id, parent_account_id, account_category, 
                                normal_balance, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING account_code
        """, (
            account_code, account_name, account_type, description,
            hierarchy_id if hierarchy_id else None,
            None,  # parent_account_id
            account_category,
            normal_balance,
            True  # is_active
        ))
        
        created_account_code = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Account added successfully",
            "account": {
                "account_code": created_account_code,
                "account_name": account_name,
                "account_type": account_type,
                "description": description,
                "hierarchy_id": hierarchy_id,
                "created_date": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error creating IFRS account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create account: {str(e)}"
        )

@router.delete("/{account_code}")
def delete_ifrs_account(account_code: str, company_name: str = Query(...)):
    """Delete IFRS account for current company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Check if account exists before deleting
        cur.execute("SELECT account_name FROM accounts WHERE account_code = %s", (account_code,))
        account = cur.fetchone()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Check if account is used in trial balance entries
        cur.execute("SELECT COUNT(*) FROM tb_entries WHERE account_code = %s", (account_code,))
        tb_count = cur.fetchone()[0]
        
        if tb_count > 0:
            # Soft delete - mark as inactive instead of hard delete
            cur.execute("""
                UPDATE accounts 
                SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
                WHERE account_code = %s
            """, (account_code,))
            message = f"Account '{account[0]}' marked as inactive (has trial balance entries)"
        else:
            # Hard delete if no dependencies
            cur.execute("DELETE FROM accounts WHERE account_code = %s", (account_code,))
            message = f"Account '{account[0]}' deleted successfully"
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": message
        }
        
    except Exception as e:
        print(f"Error deleting IFRS account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )

@router.put("/{account_code}")
async def update_ifrs_account(account_code: str, request: Request):
    """Update IFRS account for current company"""
    try:
        # Parse request body
        body = await request.body()
        try:
            account_data = json.loads(body)
            print(f"=== ACCOUNT UPDATE REQUEST DATA ===")
            print(f"Raw request data: {account_data}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Extract data from JSON body
        account_name = account_data.get('account_name', '')
        account_type = account_data.get('account_type', '')
        description = account_data.get('description', '')
        hierarchy_id = account_data.get('hierarchy_id', '')
        
        # Validate required fields
        if not account_name:
            raise HTTPException(status_code=400, detail="Account name is required")
        if not account_type:
            raise HTTPException(status_code=400, detail="Account type is required")
        
        # Get company name from query parameter
        company_name = request.query_params.get('company_name', 'Backo')  # Default fallback
        
        # Validate account type
        valid_types = ['Asset', 'Liability', 'Equity', 'Income', 'Expense']
        if account_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid account type. Must be one of: {', '.join(valid_types)}")
        
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Check if account exists
        cur.execute("SELECT account_name FROM accounts WHERE account_code = %s", (account_code,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Determine account category and normal balance based on account type
        account_category_map = {
            'Asset': 'Current Assets',
            'Liability': 'Current Liabilities', 
            'Equity': 'Equity',
            'Income': 'Revenue',
            'Expense': 'Operating Expenses'
        }
        
        normal_balance_map = {
            'Asset': 'Debit',
            'Liability': 'Credit',
            'Equity': 'Credit', 
            'Income': 'Credit',
            'Expense': 'Debit'
        }
        
        account_category = account_category_map.get(account_type, 'Other')
        normal_balance = normal_balance_map.get(account_type, 'Debit')
        
        # Update account
        cur.execute("""
            UPDATE accounts 
            SET account_name = %s, account_type = %s, description = %s, 
                hierarchy_id = %s, account_category = %s, normal_balance = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE account_code = %s
        """, (
            account_name, account_type, description,
            hierarchy_id if hierarchy_id else None,
            account_category, normal_balance, account_code
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "Account updated successfully",
            "account": {
                "account_code": account_code,
                "account_name": account_name,
                "account_type": account_type,
                "description": description,
                "hierarchy_id": hierarchy_id,
                "updated_date": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        print(f"Error updating IFRS account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update account: {str(e)}"
        )
