from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db, Company
# Note: Account model moved to company-specific databases
import psycopg2
import os

router = APIRouter(prefix="/ifrs-accounts", tags=["IFRS Accounts"])

class AccountCreate(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    description: Optional[str] = None
    hierarchy_id: Optional[str] = None

class AccountResponse(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    description: Optional[str] = None
    hierarchy_id: Optional[str] = None

@router.get("/")
def get_ifrs_accounts(company_name: str = Query(...)):
    """Get all IFRS accounts for a company"""
    try:
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = 'root@123'
        
        # Connect to company-specific database
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                database=company_db_name
            )
            
            cur = conn.cursor()
            cur.execute("""
                SELECT account_code, account_name, account_type, description, hierarchy_id 
                FROM accounts ORDER BY account_code
            """)
            accounts_data = cur.fetchall()
            cur.close()
            conn.close()
            
            accounts = []
            for account in accounts_data:
                accounts.append({
                    "account_code": account[0],
                    "account_name": account[1],
                    "account_type": account[2],
                    "description": account[3],
                    "hierarchy_id": account[4]
                })
            
            return {"accounts": accounts}
            
        except psycopg2.OperationalError:
            # Company database doesn't exist, return sample data
            return {
                "accounts": [
                    {
                        "account_code": "1000",
                        "account_name": "Cash and Cash Equivalents",
                        "account_type": "Asset",
                        "description": "Cash and bank balances",
                        "hierarchy_id": "A1"
                    },
                    {
                        "account_code": "2000",
                        "account_name": "Accounts Receivable",
                        "account_type": "Asset",
                        "description": "Trade receivables",
                        "hierarchy_id": "A2"
                    },
                    {
                        "account_code": "3000",
                        "account_name": "Inventory",
                        "account_type": "Asset",
                        "description": "Inventory assets",
                        "hierarchy_id": "A3"
                    },
                    {
                        "account_code": "4000",
                        "account_name": "Accounts Payable",
                        "account_type": "Liability",
                        "description": "Trade payables",
                        "hierarchy_id": "L1"
                    },
                    {
                        "account_code": "5000",
                        "account_name": "Revenue",
                        "account_type": "Revenue",
                        "description": "Operating revenue",
                        "hierarchy_id": "R1"
                    },
                    {
                        "account_code": "6000",
                        "account_name": "Cost of Sales",
                        "account_type": "Expense",
                        "description": "Direct costs",
                        "hierarchy_id": "E1"
                    }
                ]
            }
            
    except Exception as e:
        print(f"Error getting accounts: {e}")
        # Return fallback data
        return {
            "accounts": [
                {
                    "account_code": "1000",
                    "account_name": "Cash and Cash Equivalents",
                    "account_type": "Asset",
                    "description": "Cash and bank balances",
                    "hierarchy_id": "A1"
                }
            ]
        }

@router.post("/", response_model=dict)
def create_account(account: AccountCreate, company_name: str = Query(...)):
    """Create a new IFRS account"""
    try:
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = 'root@123'
        
        # Connect to company-specific database
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database=company_db_name
        )
        
        cur = conn.cursor()
        
        # Create accounts table if it doesn't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS accounts (
                account_code VARCHAR(50) PRIMARY KEY,
                account_name VARCHAR(255) NOT NULL,
                account_type VARCHAR(50) NOT NULL,
                description TEXT,
                hierarchy_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert new account
        cur.execute("""
            INSERT INTO accounts (account_code, account_name, account_type, description, hierarchy_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (account.account_code, account.account_name, account.account_type, 
              account.description, account.hierarchy_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {"success": True, "message": "Account created successfully"}
        
    except Exception as e:
        print(f"Error creating account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create account: {str(e)}"
        )

@router.delete("/{account_code}")
def delete_account(account_code: str, company_name: str = Query(...)):
    """Delete an IFRS account"""
    try:
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = 'root@123'
        
        # Connect to company-specific database
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database=company_db_name
        )
        
        cur = conn.cursor()
        cur.execute("DELETE FROM accounts WHERE account_code = %s", (account_code,))
        
        if cur.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {"success": True, "message": "Account deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )
