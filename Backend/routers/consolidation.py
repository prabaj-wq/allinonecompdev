from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
import psycopg2
import os
from datetime import datetime, date

router = APIRouter(prefix="/consolidation", tags=["Consolidation"])

def get_db_config():
    """Get database configuration"""
    if os.getenv('DOCKER_ENV') == 'true':
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
    else:
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
        
    return {
        'host': POSTGRES_HOST,
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'user': 'postgres',
        'password': 'root@123'
    }

class ICTransaction(BaseModel):
    transaction_id: str
    entity_from: str
    entity_to: str
    account_code: str
    amount: float
    currency: Optional[str] = "USD"
    transaction_date: Optional[date] = None
    description: Optional[str] = None

class ConsolidationJournal(BaseModel):
    journal_name: str
    journal_type: str
    period: str
    year: int
    description: Optional[str] = None

class JournalEntry(BaseModel):
    line_number: int
    entity_code: Optional[str] = None
    account_code: str
    description: Optional[str] = None
    debit_amount: Optional[float] = 0
    credit_amount: Optional[float] = 0
    currency: Optional[str] = "USD"

@router.get("/ic-receivables")
def get_ic_receivables(company_name: str = Query(...)):
    """Get IC receivables for current company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            cur.execute("""
                SELECT transaction_id, entity_from, entity_to, account_code, amount,
                       currency, transaction_date, description, status, elimination_status
                FROM intercompany_transactions
                WHERE account_code LIKE '1%' OR account_code LIKE '2%'
                ORDER BY transaction_date DESC
            """)
            
            receivables = []
            for row in cur.fetchall():
                (trans_id, entity_from, entity_to, account_code, amount,
                 currency, trans_date, description, status, elim_status) = row
                
                receivables.append({
                    "transaction_id": trans_id,
                    "entity_from": entity_from,
                    "entity_to": entity_to,
                    "account_code": account_code,
                    "amount": float(amount),
                    "currency": currency,
                    "transaction_date": trans_date.isoformat() if trans_date else None,
                    "description": description,
                    "status": status,
                    "elimination_status": elim_status
                })
            
            cur.close()
            conn.close()
            
            return {"ic_receivables": receivables}
            
        except psycopg2.OperationalError:
            # Return sample data if database doesn't exist
            sample_receivables = [
                {
                    "transaction_id": "IC_001",
                    "entity_from": f"{company_name}_001",
                    "entity_to": f"{company_name}_002",
                    "account_code": "1200",
                    "amount": 50000.00,
                    "currency": "USD",
                    "transaction_date": "2024-12-01",
                    "description": "Intercompany loan receivable",
                    "status": "active",
                    "elimination_status": "pending"
                },
                {
                    "transaction_id": "IC_002",
                    "entity_from": f"{company_name}_001",
                    "entity_to": f"{company_name}_003",
                    "account_code": "1300",
                    "amount": 25000.00,
                    "currency": "USD",
                    "transaction_date": "2024-11-15",
                    "description": "Trade receivable from subsidiary",
                    "status": "active",
                    "elimination_status": "pending"
                }
            ]
            return {"ic_receivables": sample_receivables}
            
    except Exception as e:
        print(f"Error getting IC receivables: {e}")
        return {"ic_receivables": []}

@router.get("/ic-payables")
def get_ic_payables(company_name: str = Query(...)):
    """Get IC payables for current company"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            cur.execute("""
                SELECT transaction_id, entity_from, entity_to, account_code, amount,
                       currency, transaction_date, description, status, elimination_status
                FROM intercompany_transactions
                WHERE account_code LIKE '4%' OR account_code LIKE '5%'
                ORDER BY transaction_date DESC
            """)
            
            payables = []
            for row in cur.fetchall():
                (trans_id, entity_from, entity_to, account_code, amount,
                 currency, trans_date, description, status, elim_status) = row
                
                payables.append({
                    "transaction_id": trans_id,
                    "entity_from": entity_from,
                    "entity_to": entity_to,
                    "account_code": account_code,
                    "amount": float(amount),
                    "currency": currency,
                    "transaction_date": trans_date.isoformat() if trans_date else None,
                    "description": description,
                    "status": status,
                    "elimination_status": elim_status
                })
            
            cur.close()
            conn.close()
            
            return {"ic_payables": payables}
            
        except psycopg2.OperationalError:
            # Return sample data
            sample_payables = [
                {
                    "transaction_id": "IC_003",
                    "entity_from": f"{company_name}_002",
                    "entity_to": f"{company_name}_001",
                    "account_code": "4100",
                    "amount": 30000.00,
                    "currency": "USD",
                    "transaction_date": "2024-12-01",
                    "description": "Intercompany service payable",
                    "status": "active",
                    "elimination_status": "pending"
                }
            ]
            return {"ic_payables": sample_payables}
            
    except Exception as e:
        print(f"Error getting IC payables: {e}")
        return {"ic_payables": []}

@router.get("/journals")
def get_consolidation_journals(company_name: str = Query(...), period: Optional[str] = None, year: Optional[int] = None):
    """Get consolidation journals"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Build query with optional filters
            where_conditions = []
            params = []
            
            if period:
                where_conditions.append("period = %s")
                params.append(period)
            
            if year:
                where_conditions.append("year = %s")
                params.append(year)
            
            where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
            
            query = f"""
                SELECT id, journal_name, journal_type, period, year, description,
                       status, total_debit, total_credit, created_by, created_at,
                       approved_at, approved_by
                FROM consolidation_journals
                {where_clause}
                ORDER BY created_at DESC
            """
            
            cur.execute(query, params)
            
            journals = []
            for row in cur.fetchall():
                (journal_id, name, j_type, period, year, description, status,
                 total_debit, total_credit, created_by, created_at, approved_at, approved_by) = row
                
                journals.append({
                    "id": journal_id,
                    "journal_name": name,
                    "journal_type": j_type,
                    "period": period,
                    "year": year,
                    "description": description,
                    "status": status,
                    "total_debit": float(total_debit) if total_debit else 0,
                    "total_credit": float(total_credit) if total_credit else 0,
                    "created_by": created_by,
                    "created_at": created_at.isoformat() if created_at else None,
                    "approved_at": approved_at.isoformat() if approved_at else None,
                    "approved_by": approved_by
                })
            
            cur.close()
            conn.close()
            
            return {"journals": journals}
            
        except psycopg2.OperationalError:
            # Return sample journals
            sample_journals = [
                {
                    "id": 1,
                    "journal_name": "IC Elimination - Q4 2024",
                    "journal_type": "Elimination",
                    "period": "Q4",
                    "year": 2024,
                    "description": "Quarterly intercompany eliminations",
                    "status": "draft",
                    "total_debit": 75000.00,
                    "total_credit": 75000.00,
                    "created_by": "Admin",
                    "created_at": "2024-12-15T10:30:00",
                    "approved_at": None,
                    "approved_by": None
                }
            ]
            return {"journals": sample_journals}
            
    except Exception as e:
        print(f"Error getting consolidation journals: {e}")
        return {"journals": []}

@router.post("/journals")
def create_consolidation_journal(journal: ConsolidationJournal, company_name: str = Query(...)):
    """Create a new consolidation journal"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO consolidation_journals (journal_name, journal_type, period, year,
                                              description, status, total_debit, total_credit,
                                              created_by, created_at)
            VALUES (%s, %s, %s, %s, %s, 'draft', 0, 0, 'System', CURRENT_TIMESTAMP)
            RETURNING id
        """, (journal.journal_name, journal.journal_type, journal.period, 
              journal.year, journal.description))
        
        journal_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Consolidation journal created successfully",
            "journal_id": journal_id
        }
        
    except Exception as e:
        print(f"Error creating consolidation journal: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create journal: {str(e)}")

@router.get("/journals/{journal_id}/entries")
def get_journal_entries(journal_id: int, company_name: str = Query(...)):
    """Get entries for a specific consolidation journal"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            cur.execute("""
                SELECT id, line_number, entity_code, account_code, description,
                       debit_amount, credit_amount, currency, created_at
                FROM consolidation_journal_entries
                WHERE journal_id = %s
                ORDER BY line_number
            """, (journal_id,))
            
            entries = []
            for row in cur.fetchall():
                (entry_id, line_num, entity_code, account_code, description,
                 debit, credit, currency, created_at) = row
                
                entries.append({
                    "id": entry_id,
                    "line_number": line_num,
                    "entity_code": entity_code,
                    "account_code": account_code,
                    "description": description,
                    "debit_amount": float(debit) if debit else 0,
                    "credit_amount": float(credit) if credit else 0,
                    "currency": currency,
                    "created_at": created_at.isoformat() if created_at else None
                })
            
            cur.close()
            conn.close()
            
            return {"entries": entries}
            
        except psycopg2.OperationalError:
            # Return sample entries
            sample_entries = [
                {
                    "id": 1,
                    "line_number": 1,
                    "entity_code": f"{company_name}_001",
                    "account_code": "1200",
                    "description": "Eliminate IC receivable",
                    "debit_amount": 0.00,
                    "credit_amount": 50000.00,
                    "currency": "USD",
                    "created_at": "2024-12-15T10:30:00"
                },
                {
                    "id": 2,
                    "line_number": 2,
                    "entity_code": f"{company_name}_002",
                    "account_code": "4100",
                    "description": "Eliminate IC payable",
                    "debit_amount": 50000.00,
                    "credit_amount": 0.00,
                    "currency": "USD",
                    "created_at": "2024-12-15T10:30:00"
                }
            ]
            return {"entries": sample_entries}
            
    except Exception as e:
        print(f"Error getting journal entries: {e}")
        return {"entries": []}

@router.get("/settings")
def get_consolidation_settings(company_name: str = Query(...)):
    """Get consolidation settings"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            cur.execute("""
                SELECT setting_name, setting_value, setting_type, description, is_active
                FROM consolidation_settings
                WHERE is_active = TRUE
                ORDER BY setting_name
            """)
            
            settings = {}
            for row in cur.fetchall():
                name, value, setting_type, description, is_active = row
                settings[name] = {
                    "value": value,
                    "type": setting_type,
                    "description": description,
                    "is_active": is_active
                }
            
            cur.close()
            conn.close()
            
            return {"settings": settings}
            
        except psycopg2.OperationalError:
            # Return default settings
            default_settings = {
                "consolidation_method": {
                    "value": "full",
                    "type": "string",
                    "description": "Default consolidation method",
                    "is_active": True
                },
                "functional_currency": {
                    "value": "USD",
                    "type": "string",
                    "description": "Functional currency for consolidation",
                    "is_active": True
                },
                "elimination_threshold": {
                    "value": "1000",
                    "type": "number",
                    "description": "Minimum amount for IC eliminations",
                    "is_active": True
                }
            }
            return {"settings": default_settings}
            
    except Exception as e:
        print(f"Error getting consolidation settings: {e}")
        return {"settings": {}}
