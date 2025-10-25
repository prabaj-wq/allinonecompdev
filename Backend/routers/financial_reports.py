"""
Financial Reports Module - Process Context Integration
Generates financial statements from process data with hierarchical account support
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse

try:
    from fastapi.responses import FileResponse
except ImportError:
    FileResponse = None
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_, desc, asc
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, date, timedelta
from decimal import Decimal
import json
import uuid
import psycopg2
import psycopg2.extras
import pandas as pd
import io
import os
import tempfile
import logging

# Try to import reportlab, but make it optional
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import (
        SimpleDocTemplate,
        Table,
        TableStyle,
        Paragraph,
        Spacer,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import inch

    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    # Define dummy values to prevent errors
    A4 = (595.27, 841.89)

from database import get_db

try:
    from auth.dependencies import get_current_active_user
except ImportError:
    # Fallback if auth module is not properly configured
    async def get_current_active_user():
        return {"username": "system", "id": "system"}


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/financial-reports", tags=["Financial Reports"])

# ============================================================================
# PYDANTIC MODELS
# ============================================================================


class ProcessContext(BaseModel):
    """Process context for report generation"""

    process_id: Optional[str] = None
    process_name: Optional[str] = None
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    scenario_id: Optional[str] = None
    scenario_name: Optional[str] = None
    fiscal_year: Optional[int] = None
    period_ids: Optional[List[str]] = None
    period_names: Optional[List[str]] = None


class HierarchySelection(BaseModel):
    """Hierarchy selection for reports"""

    hierarchy_id: str
    hierarchy_name: str
    hierarchy_type: Literal["Account", "Entity", "FST"]
    include_children: bool = True
    level_limit: Optional[int] = None


class ReportSettings(BaseModel):
    """Report generation settings"""

    report_type: Literal[
        "balance_sheet",
        "income_statement",
        "cash_flow",
        "statement_equity",
        "comprehensive",
    ]
    periods: List[str]
    comparative_periods: Optional[List[str]] = None
    show_zero_balances: bool = False
    currency: str = "USD"
    consolidation_level: Literal["entity", "group"] = "entity"
    rounding_factor: int = 1  # 1=units, 1000=thousands, 1000000=millions
    show_variances: bool = False
    drill_down_enabled: bool = True


class ReportRequest(BaseModel):
    """Complete report generation request"""

    process_context: ProcessContext
    hierarchy_selection: HierarchySelection
    report_settings: ReportSettings
    filters: Optional[Dict[str, Any]] = None


class AccountHierarchyNode(BaseModel):
    """Account hierarchy tree node"""

    account_code: str
    account_name: str
    hierarchy_id: str
    parent_hierarchy_id: Optional[str] = None
    level_number: int
    children: List["AccountHierarchyNode"] = []
    amounts: Dict[str, Decimal] = {}


AccountHierarchyNode.model_rebuild()

# ============================================================================
# DATABASE UTILITIES
# ============================================================================


def get_db_config():
    """Get database configuration"""
    if os.getenv("DOCKER_ENV") == "true":
        POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
    else:
        POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")

    return {
        "host": POSTGRES_HOST,
        "port": os.getenv("POSTGRES_PORT", "5432"),
        "user": "postgres",
        "password": os.getenv("POSTGRES_PASSWORD", "root@123"),
    }


def get_company_connection(company_name: str):
    """Get connection to company database"""
    db_config = get_db_config()
    company_db_name = company_name.lower().replace(" ", "_").replace("-", "_")

    return psycopg2.connect(database=company_db_name, **db_config)


# ============================================================================
# HIERARCHY AND ACCOUNT MANAGEMENT
# ============================================================================


@router.get("/hierarchies")
async def get_report_hierarchies(
    company_name: str = Query(...), hierarchy_type: Optional[str] = Query(None)
):
    """Get available hierarchies for report generation"""
    try:
        conn = get_company_connection(company_name)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get hierarchies
        if hierarchy_type:
            cur.execute(
                """
                SELECT hierarchy_id, hierarchy_name, hierarchy_type,
                       description, parent_hierarchy_id, level_number
                FROM hierarchies
                WHERE hierarchy_type = %s
                ORDER BY level_number, hierarchy_name
            """,
                (hierarchy_type,),
            )
        else:
            cur.execute("""
                SELECT hierarchy_id, hierarchy_name, hierarchy_type,
                       description, parent_hierarchy_id, level_number
                FROM hierarchies
                ORDER BY hierarchy_type, level_number, hierarchy_name
            """)

        hierarchies = cur.fetchall()

        # Build tree structure
        hierarchy_tree = build_hierarchy_tree(hierarchies)

        cur.close()
        conn.close()

        return {
            "success": True,
            "hierarchies": hierarchy_tree,
            "total_count": len(hierarchies),
        }

    except Exception as e:
        logger.error(f"Error fetching hierarchies: {e}")
        return {"success": False, "error": str(e), "hierarchies": []}


def build_hierarchy_tree(hierarchies):
    """Build hierarchical tree structure"""
    hierarchy_dict = {h["hierarchy_id"]: dict(h) for h in hierarchies}

    # Add children array to each hierarchy
    for h in hierarchy_dict.values():
        h["children"] = []

    # Build parent-child relationships
    root_hierarchies = []
    for h in hierarchy_dict.values():
        if h["parent_hierarchy_id"] and h["parent_hierarchy_id"] in hierarchy_dict:
            hierarchy_dict[h["parent_hierarchy_id"]]["children"].append(h)
        else:
            root_hierarchies.append(h)

    return root_hierarchies


@router.get("/accounts/hierarchy/{hierarchy_id}")
async def get_accounts_by_hierarchy(
    hierarchy_id: str,
    company_name: str = Query(...),
    include_amounts: bool = Query(False),
    process_context: Optional[str] = Query(None),
):
    """Get accounts under a specific hierarchy with optional amounts"""
    try:
        conn = get_company_connection(company_name)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Parse process context if provided
        context = None
        if process_context:
            context = json.loads(process_context)

        # Get accounts under this hierarchy
        cur.execute(
            """
            SELECT a.account_code, a.account_name, a.account_type,
                   a.hierarchy_id, h.hierarchy_name, h.level_number,
                   h.parent_hierarchy_id
            FROM accounts a
            LEFT JOIN hierarchies h ON a.hierarchy_id = h.hierarchy_id
            WHERE a.hierarchy_id = %s OR h.parent_hierarchy_id = %s
            ORDER BY a.account_code
        """,
            (hierarchy_id, hierarchy_id),
        )

        accounts = cur.fetchall()

        # Get amounts if requested and context provided
        if include_amounts and context:
            account_amounts = get_account_amounts(cur, accounts, context)
        else:
            account_amounts = {}

        # Build account tree with amounts
        account_tree = []
        for account in accounts:
            account_dict = dict(account)
            if include_amounts:
                account_dict["amounts"] = account_amounts.get(
                    account["account_code"], {}
                )
            account_tree.append(account_dict)

        cur.close()
        conn.close()

        return {
            "success": True,
            "accounts": account_tree,
            "hierarchy_id": hierarchy_id,
            "total_count": len(accounts),
        }

    except Exception as e:
        logger.error(f"Error fetching accounts by hierarchy: {e}")
        return {"success": False, "error": str(e), "accounts": []}


def get_account_amounts(cursor, accounts, context):
    """Get financial amounts for accounts from data input tables"""
    account_codes = [acc["account_code"] for acc in accounts]
    if not account_codes:
        return {}

    amounts = {}

    try:
        # Get entity amounts
        if context.get("entity_id") and context.get("scenario_id"):
            cursor.execute(
                """
                SELECT ea.account_id, acc.account_code,
                       SUM(ea.amount) as total_amount, ea.currency
                FROM entity_amounts ea
                JOIN accounts acc ON ea.account_id = acc.account_code::int
                WHERE acc.account_code = ANY(%s)
                  AND ea.scenario_id = %s
                  AND ea.entity_id = %s
                GROUP BY ea.account_id, acc.account_code, ea.currency
            """,
                (account_codes, context.get("scenario_id"), context.get("entity_id")),
            )

            entity_amounts = cursor.fetchall()

            for amount in entity_amounts:
                account_code = amount["account_code"]
                if account_code not in amounts:
                    amounts[account_code] = {}
                amounts[account_code]["entity_amount"] = float(
                    amount["total_amount"] or 0
                )
                amounts[account_code]["currency"] = amount["currency"]

        # Get IC amounts
        cursor.execute(
            """
            SELECT ic.account_id, acc.account_code,
                   SUM(ic.amount) as total_amount, ic.currency
            FROM ic_amounts ic
            JOIN accounts acc ON ic.account_id = acc.account_code::int
            WHERE acc.account_code = ANY(%s)
            GROUP BY ic.account_id, acc.account_code, ic.currency
        """,
            (account_codes,),
        )

        ic_amounts = cursor.fetchall()

        for amount in ic_amounts:
            account_code = amount["account_code"]
            if account_code not in amounts:
                amounts[account_code] = {}
            amounts[account_code]["ic_amount"] = float(amount["total_amount"] or 0)

        # Get other amounts
        cursor.execute(
            """
            SELECT oa.account_id, acc.account_code,
                   SUM(oa.amount) as total_amount, oa.currency
            FROM other_amounts oa
            JOIN accounts acc ON oa.account_id = acc.account_code::int
            WHERE acc.account_code = ANY(%s)
            GROUP BY oa.account_id, acc.account_code, oa.currency
        """,
            (account_codes,),
        )

        other_amounts = cursor.fetchall()

        for amount in other_amounts:
            account_code = amount["account_code"]
            if account_code not in amounts:
                amounts[account_code] = {}
            amounts[account_code]["other_amount"] = float(amount["total_amount"] or 0)

    except Exception as e:
        logger.error(f"Error getting account amounts: {e}")

    return amounts


# ============================================================================
# REPORT GENERATION
# ============================================================================


@router.post("/generate")
async def generate_financial_report(
    report_request: ReportRequest, company_name: str = Query(...)
):
    """Generate financial report based on process context and settings"""
    try:
        conn = get_company_connection(company_name)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get hierarchical account structure
        account_tree = get_hierarchical_accounts(
            cur, report_request.hierarchy_selection, report_request.process_context
        )

        # Generate report based on type
        report_data = None
        if report_request.report_settings.report_type == "balance_sheet":
            report_data = generate_balance_sheet(cur, account_tree, report_request)
        elif report_request.report_settings.report_type == "income_statement":
            report_data = generate_income_statement(cur, account_tree, report_request)
        elif report_request.report_settings.report_type == "cash_flow":
            report_data = generate_cash_flow(cur, account_tree, report_request)
        elif report_request.report_settings.report_type == "statement_equity":
            report_data = generate_statement_equity(cur, account_tree, report_request)
        else:
            raise HTTPException(status_code=400, detail="Unsupported report type")

        # Apply report settings (rounding, filtering, etc.)
        formatted_report = apply_report_settings(
            report_data, report_request.report_settings
        )

        # Save report metadata
        report_metadata = save_report_metadata(cur, report_request, company_name)

        cur.close()
        conn.close()

        return {
            "success": True,
            "report_id": report_metadata["report_id"],
            "report_data": formatted_report,
            "generated_at": datetime.utcnow().isoformat(),
            "settings": report_request.report_settings.dict(),
        }

    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}",
        )


def get_hierarchical_accounts(cursor, hierarchy_selection, process_context):
    """Get hierarchical account structure with amounts"""
    # Get accounts under selected hierarchy
    cursor.execute(
        """
        WITH RECURSIVE hierarchy_tree AS (
            -- Base case: selected hierarchy
            SELECT hierarchy_id, hierarchy_name, parent_hierarchy_id, level_number, 1 as depth
            FROM hierarchies
            WHERE hierarchy_id = %s

            UNION ALL

            -- Recursive case: child hierarchies
            SELECT h.hierarchy_id, h.hierarchy_name, h.parent_hierarchy_id,
                   h.level_number, ht.depth + 1
            FROM hierarchies h
            JOIN hierarchy_tree ht ON h.parent_hierarchy_id = ht.hierarchy_id
            WHERE (%s IS NULL OR ht.depth < %s)
        )
        SELECT DISTINCT a.account_code, a.account_name, a.account_type,
               a.hierarchy_id, h.hierarchy_name, h.level_number,
               h.parent_hierarchy_id
        FROM accounts a
        JOIN hierarchy_tree h ON a.hierarchy_id = h.hierarchy_id
        ORDER BY h.level_number, a.account_code
    """,
        (
            hierarchy_selection.hierarchy_id,
            hierarchy_selection.level_limit,
            hierarchy_selection.level_limit,
        ),
    )

    accounts = cursor.fetchall()

    # Get amounts for these accounts
    account_amounts = get_account_amounts(cursor, accounts, process_context.dict())

    # Build hierarchical structure
    account_tree = build_account_tree(accounts, account_amounts)

    return account_tree


def build_account_tree(accounts, amounts):
    """Build hierarchical account tree with amounts"""
    account_dict = {}

    for account in accounts:
        account_dict[account["account_code"]] = {
            **dict(account),
            "children": [],
            "amounts": amounts.get(account["account_code"], {}),
            "subtotal": 0,
        }

    # Calculate subtotals and build tree
    root_accounts = []

    for account in account_dict.values():
        # Calculate account total
        account_amounts = account["amounts"]
        entity_amt = account_amounts.get("entity_amount", 0)
        ic_amt = account_amounts.get("ic_amount", 0)
        other_amt = account_amounts.get("other_amount", 0)

        account["subtotal"] = entity_amt + ic_amt + other_amt

        # Add to appropriate parent or root
        if account["parent_hierarchy_id"]:
            # Find parent account with same hierarchy
            parent_found = False
            for parent_account in account_dict.values():
                if parent_account["hierarchy_id"] == account["parent_hierarchy_id"]:
                    parent_account["children"].append(account)
                    parent_found = True
                    break

            if not parent_found:
                root_accounts.append(account)
        else:
            root_accounts.append(account)

    return root_accounts


def generate_balance_sheet(cursor, account_tree, report_request):
    """Generate Balance Sheet report"""
    balance_sheet = {
        "report_type": "Balance Sheet",
        "report_title": f"Balance Sheet - {report_request.process_context.entity_name or 'Consolidated'}",
        "periods": report_request.report_settings.periods,
        "currency": report_request.report_settings.currency,
        "sections": {
            "assets": {"title": "ASSETS", "accounts": [], "total": 0},
            "liabilities": {"title": "LIABILITIES", "accounts": [], "total": 0},
            "equity": {"title": "EQUITY", "accounts": [], "total": 0},
        },
        "totals": {"total_assets": 0, "total_liabilities_equity": 0},
    }

    # Categorize accounts by type
    for account in account_tree:
        account_type = account.get("account_type", "").lower()

        if "asset" in account_type:
            balance_sheet["sections"]["assets"]["accounts"].append(account)
            balance_sheet["sections"]["assets"]["total"] += account.get("subtotal", 0)
        elif "liability" in account_type or "payable" in account_type:
            balance_sheet["sections"]["liabilities"]["accounts"].append(account)
            balance_sheet["sections"]["liabilities"]["total"] += account.get(
                "subtotal", 0
            )
        elif "equity" in account_type or "capital" in account_type:
            balance_sheet["sections"]["equity"]["accounts"].append(account)
            balance_sheet["sections"]["equity"]["total"] += account.get("subtotal", 0)

    balance_sheet["totals"]["total_assets"] = balance_sheet["sections"]["assets"][
        "total"
    ]
    balance_sheet["totals"]["total_liabilities_equity"] = (
        balance_sheet["sections"]["liabilities"]["total"]
        + balance_sheet["sections"]["equity"]["total"]
    )

    return balance_sheet


def generate_income_statement(cursor, account_tree, report_request):
    """Generate Income Statement (P&L) report"""
    income_statement = {
        "report_type": "Income Statement",
        "report_title": f"Income Statement - {report_request.process_context.entity_name or 'Consolidated'}",
        "periods": report_request.report_settings.periods,
        "currency": report_request.report_settings.currency,
        "sections": {
            "revenue": {"title": "REVENUE", "accounts": [], "total": 0},
            "cost_of_sales": {"title": "COST OF SALES", "accounts": [], "total": 0},
            "operating_expenses": {
                "title": "OPERATING EXPENSES",
                "accounts": [],
                "total": 0,
            },
            "other_income": {"title": "OTHER INCOME", "accounts": [], "total": 0},
            "finance_costs": {"title": "FINANCE COSTS", "accounts": [], "total": 0},
        },
        "calculations": {
            "gross_profit": 0,
            "operating_profit": 0,
            "profit_before_tax": 0,
            "net_profit": 0,
        },
    }

    # Categorize accounts by type
    for account in account_tree:
        account_type = account.get("account_type", "").lower()
        account_name = account.get("account_name", "").lower()

        if "revenue" in account_type or "sales" in account_name:
            income_statement["sections"]["revenue"]["accounts"].append(account)
            income_statement["sections"]["revenue"]["total"] += account.get(
                "subtotal", 0
            )
        elif "cost" in account_name and "sales" in account_name:
            income_statement["sections"]["cost_of_sales"]["accounts"].append(account)
            income_statement["sections"]["cost_of_sales"]["total"] += account.get(
                "subtotal", 0
            )
        elif "expense" in account_type or "operating" in account_name:
            income_statement["sections"]["operating_expenses"]["accounts"].append(
                account
            )
            income_statement["sections"]["operating_expenses"]["total"] += account.get(
                "subtotal", 0
            )
        elif "income" in account_type and "operating" not in account_name:
            income_statement["sections"]["other_income"]["accounts"].append(account)
            income_statement["sections"]["other_income"]["total"] += account.get(
                "subtotal", 0
            )
        elif "finance" in account_name or "interest" in account_name:
            income_statement["sections"]["finance_costs"]["accounts"].append(account)
            income_statement["sections"]["finance_costs"]["total"] += account.get(
                "subtotal", 0
            )

    # Calculate key metrics
    revenue = income_statement["sections"]["revenue"]["total"]
    cost_of_sales = income_statement["sections"]["cost_of_sales"]["total"]
    operating_expenses = income_statement["sections"]["operating_expenses"]["total"]
    other_income = income_statement["sections"]["other_income"]["total"]
    finance_costs = income_statement["sections"]["finance_costs"]["total"]

    income_statement["calculations"]["gross_profit"] = revenue - cost_of_sales
    income_statement["calculations"]["operating_profit"] = (
        income_statement["calculations"]["gross_profit"] - operating_expenses
    )
    income_statement["calculations"]["profit_before_tax"] = (
        income_statement["calculations"]["operating_profit"]
        + other_income
        - finance_costs
    )
    # Simplified tax calculation - would need tax rate from settings
    tax_rate = 0.25  # 25% default
    income_statement["calculations"]["net_profit"] = income_statement["calculations"][
        "profit_before_tax"
    ] * (1 - tax_rate)

    return income_statement


def generate_cash_flow(cursor, account_tree, report_request):
    """Generate Cash Flow Statement"""
    cash_flow = {
        "report_type": "Cash Flow Statement",
        "report_title": f"Cash Flow Statement - {report_request.process_context.entity_name or 'Consolidated'}",
        "periods": report_request.report_settings.periods,
        "currency": report_request.report_settings.currency,
        "sections": {
            "operating": {
                "title": "CASH FLOWS FROM OPERATING ACTIVITIES",
                "items": [],
                "total": 0,
            },
            "investing": {
                "title": "CASH FLOWS FROM INVESTING ACTIVITIES",
                "items": [],
                "total": 0,
            },
            "financing": {
                "title": "CASH FLOWS FROM FINANCING ACTIVITIES",
                "items": [],
                "total": 0,
            },
        },
        "totals": {"net_cash_flow": 0, "opening_cash": 0, "closing_cash": 0},
    }

    # This would require more sophisticated logic to categorize cash flows
    # For now, return basic structure

    return cash_flow


def generate_statement_equity(cursor, account_tree, report_request):
    """Generate Statement of Changes in Equity"""
    statement_equity = {
        "report_type": "Statement of Changes in Equity",
        "report_title": f"Statement of Changes in Equity - {report_request.process_context.entity_name or 'Consolidated'}",
        "periods": report_request.report_settings.periods,
        "currency": report_request.report_settings.currency,
        "components": {
            "share_capital": {"opening": 0, "movements": [], "closing": 0},
            "retained_earnings": {"opening": 0, "movements": [], "closing": 0},
            "other_reserves": {"opening": 0, "movements": [], "closing": 0},
            "nci": {"opening": 0, "movements": [], "closing": 0},
        },
        "totals": {"total_opening": 0, "total_movements": 0, "total_closing": 0},
    }

    # This would require movement analysis from previous periods
    # For now, return basic structure

    return statement_equity


def apply_report_settings(report_data, settings):
    """Apply formatting settings to report"""
    # Apply rounding
    if settings.rounding_factor > 1:
        report_data = apply_rounding(report_data, settings.rounding_factor)

    # Filter zero balances
    if not settings.show_zero_balances:
        report_data = filter_zero_balances(report_data)

    return report_data


def apply_rounding(report_data, factor):
    """Apply rounding factor to all amounts"""

    # Recursive function to round all numeric values
    def round_value(obj):
        if isinstance(obj, dict):
            return {k: round_value(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [round_value(item) for item in obj]
        elif isinstance(obj, (int, float)):
            return round(obj / factor, 2)
        else:
            return obj

    return round_value(report_data)


def filter_zero_balances(report_data):
    """Remove accounts with zero balances"""

    def filter_accounts(accounts):
        return [acc for acc in accounts if acc.get("subtotal", 0) != 0]

    if "sections" in report_data:
        for section in report_data["sections"].values():
            if "accounts" in section:
                section["accounts"] = filter_accounts(section["accounts"])

    return report_data


def save_report_metadata(cursor, report_request, company_name):
    """Save report generation metadata"""
    report_id = str(uuid.uuid4())

    try:
        # Create reports table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS financial_reports (
                report_id VARCHAR(50) PRIMARY KEY,
                company_name VARCHAR(255),
                report_type VARCHAR(50),
                process_context JSONB,
                hierarchy_selection JSONB,
                report_settings JSONB,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                generated_by VARCHAR(255)
            )
        """)

        # Insert report metadata
        cursor.execute(
            """
            INSERT INTO financial_reports
            (report_id, company_name, report_type, process_context, hierarchy_selection, report_settings)
            VALUES (%s, %s, %s, %s, %s, %s)
        """,
            (
                report_id,
                company_name,
                report_request.report_settings.report_type,
                json.dumps(report_request.process_context.dict()),
                json.dumps(report_request.hierarchy_selection.dict()),
                json.dumps(report_request.report_settings.dict()),
            ),
        )

        cursor.connection.commit()

    except Exception as e:
        logger.error(f"Error saving report metadata: {e}")

    return {"report_id": report_id}


# ============================================================================
# EXPORT FUNCTIONALITY
# ============================================================================


@router.get("/export/{report_id}")
async def export_report(
    report_id: str,
    format: Literal["pdf", "excel"] = Query("pdf"),
    company_name: str = Query(...),
):
    """Export generated report to PDF or Excel"""
    try:
        conn = get_company_connection(company_name)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get report metadata
        cur.execute(
            """
            SELECT * FROM financial_reports WHERE report_id = %s
        """,
            (report_id,),
        )

        report_metadata = cur.fetchone()
        if not report_metadata:
            raise HTTPException(status_code=404, detail="Report not found")

        # Regenerate report (or could cache it)
        process_context = ProcessContext(
            **json.loads(report_metadata["process_context"])
        )
        hierarchy_selection = HierarchySelection(
            **json.loads(report_metadata["hierarchy_selection"])
        )
        report_settings = ReportSettings(
            **json.loads(report_metadata["report_settings"])
        )

        report_request = ReportRequest(
            process_context=process_context,
            hierarchy_selection=hierarchy_selection,
            report_settings=report_settings,
        )

        # Generate report data
        account_tree = get_hierarchical_accounts(
            cur, hierarchy_selection, process_context
        )

        if report_settings.report_type == "balance_sheet":
            report_data = generate_balance_sheet(cur, account_tree, report_request)
        elif report_settings.report_type == "income_statement":
            report_data = generate_income_statement(cur, account_tree, report_request)
        else:
            report_data = {"error": "Unsupported report type for export"}

        formatted_report = apply_report_settings(report_data, report_settings)

        cur.close()
        conn.close()

        # Generate export file
        if format == "pdf":
            return export_to_pdf(formatted_report, report_id)
        elif format == "excel":
            return export_to_excel(formatted_report, report_id)
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format")

    except Exception as e:
        logger.error(f"Error exporting report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export report: {str(e)}",
        )


def export_to_pdf(report_data, report_id):
    """Export report to PDF"""
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="PDF export is not available. Please install reportlab: pip install reportlab",
        )

    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")

    try:
        # Create PDF document
        doc = SimpleDocTemplate(temp_file.name, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=16,
            spaceAfter=30,
            alignment=1,  # Center
        )

        story.append(
            Paragraph(report_data.get("report_title", "Financial Report"), title_style)
        )
        story.append(Spacer(1, 12))

        # Report sections
        if "sections" in report_data:
            for section_key, section in report_data["sections"].items():
                # Section header
                story.append(Paragraph(section["title"], styles["Heading2"]))
                story.append(Spacer(1, 6))

                # Account table
                table_data = [["Account Code", "Account Name", "Amount"]]

                for account in section.get("accounts", []):
                    table_data.append(
                        [
                            account.get("account_code", ""),
                            account.get("account_name", ""),
                            f"{account.get('subtotal', 0):,.2f}",
                        ]
                    )

                # Section total
                table_data.append(
                    ["", f"Total {section['title']}", f"{section.get('total', 0):,.2f}"]
                )

                if len(table_data) > 1 and REPORTLAB_AVAILABLE:
                    table = Table(table_data)
                    table.setStyle(
                        TableStyle(
                            [
                                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                                ("FONTSIZE", (0, 0), (-1, 0), 10),
                                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                                ("BACKGROUND", (0, -1), (-1, -1), colors.beige),
                                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                            ]
                        )
                    )
                    story.append(table)
                    story.append(Spacer(1, 12))

        if REPORTLAB_AVAILABLE:
            # Build PDF
            doc.build(story)

            # Return file response
            from fastapi.responses import FileResponse

            return FileResponse(
                temp_file.name,
                media_type="application/pdf",
                filename=f"report_{report_id}.pdf",
            )
        else:
            raise HTTPException(status_code=503, detail="PDF export not available")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create PDF: {str(e)}")


def export_to_excel(report_data, report_id):
    """Export report to Excel"""
    output = io.BytesIO()

    try:
        # Check if openpyxl is available
        try:
            import openpyxl
        except ImportError:
            # Fallback to xlsxwriter if available, or raise error
            try:
                with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
                    pass  # Test if xlsxwriter works
                engine = "xlsxwriter"
            except:
                raise HTTPException(
                    status_code=503,
                    detail="Excel export requires openpyxl or xlsxwriter. Install with: pip install openpyxl",
                )
        else:
            engine = "openpyxl"

        with pd.ExcelWriter(output, engine=engine) as writer:
            # Create main report sheet
            if "sections" in report_data:
                all_data = []

                for section_key, section in report_data["sections"].items():
                    # Section header
                    all_data.append([section["title"], "", ""])
                    all_data.append(["Account Code", "Account Name", "Amount"])

                    # Account data
                    for account in section.get("accounts", []):
                        all_data.append(
                            [
                                account.get("account_code", ""),
                                account.get("account_name", ""),
                                account.get("subtotal", 0),
                            ]
                        )

                    # Section total
                    all_data.append(
                        ["", f"Total {section['title']}", section.get("total", 0)]
                    )
                    all_data.append(["", "", ""])  # Empty row

                # Write to Excel
                df = pd.DataFrame(
                    all_data, columns=["Account Code", "Account Name", "Amount"]
                )
                df.to_excel(writer, sheet_name="Report", index=False)

                # Add summary sheet if calculations exist
                if "calculations" in report_data:
                    calc_data = []
                    for calc_name, calc_value in report_data["calculations"].items():
                        calc_data.append(
                            [calc_name.replace("_", " ").title(), calc_value]
                        )

                    df_calc = pd.DataFrame(calc_data, columns=["Metric", "Value"])
                    df_calc.to_excel(writer, sheet_name="Summary", index=False)

        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=report_{report_id}.xlsx"
            },
        )

    except Exception as e:
        logger.error(f"Error creating Excel: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create Excel: {str(e)}")
    finally:
        output.seek(0)  # Reset to beginning for reading


# ============================================================================
# DRILL-DOWN FUNCTIONALITY
# ============================================================================


@router.get("/drill-down/{account_code}")
async def drill_down_account(
    account_code: str,
    company_name: str = Query(...),
    process_context: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
):
    """Get detailed transaction data for an account"""
    try:
        conn = get_company_connection(company_name)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Parse process context
        context = json.loads(process_context) if process_context else {}

        # Get entity amounts
        entity_query = """
            SELECT ea.*, e.entity_name, s.scenario_name, p.period_name
            FROM entity_amounts ea
            LEFT JOIN entity_axes e ON ea.entity_id = e.id
            LEFT JOIN scenarios s ON ea.scenario_id = s.id
            LEFT JOIN periods p ON ea.period_id = p.id
            WHERE ea.account_id = (SELECT id FROM account_axes WHERE account_code = %s LIMIT 1)
        """

        params = [account_code]

        if context.get("entity_id"):
            entity_query += " AND ea.entity_id = %s"
            params.append(context["entity_id"])

        if context.get("scenario_id"):
            entity_query += " AND ea.scenario_id = %s"
            params.append(context["scenario_id"])

        if start_date and end_date:
            entity_query += " AND ea.created_at BETWEEN %s AND %s"
            params.extend([start_date, end_date])

        entity_query += " ORDER BY ea.created_at DESC"

        cur.execute(entity_query, params)
        entity_amounts = cur.fetchall()

        # Get IC amounts
        ic_query = """
            SELECT ic.*, fe.entity_name as from_entity, te.entity_name as to_entity
            FROM ic_amounts ic
            LEFT JOIN entity_axes fe ON ic.from_entity_id = fe.id
            LEFT JOIN entity_axes te ON ic.to_entity_id = te.id
            WHERE ic.account_id = (SELECT id FROM account_axes WHERE account_code = %s LIMIT 1)
            ORDER BY ic.created_at DESC
        """

        cur.execute(ic_query, [account_code])
        ic_amounts = cur.fetchall()

        # Get other amounts
        other_query = """
            SELECT oa.*, e.entity_name
            FROM other_amounts oa
            LEFT JOIN entity_axes e ON oa.entity_id = e.id
            WHERE oa.account_id = (SELECT id FROM account_axes WHERE account_code = %s LIMIT 1)
            ORDER BY oa.created_at DESC
        """

        cur.execute(other_query, [account_code])
        other_amounts = cur.fetchall()

        cur.close()
        conn.close()

        return {
            "success": True,
            "account_code": account_code,
            "entity_amounts": entity_amounts or [],
            "ic_amounts": ic_amounts or [],
            "other_amounts": other_amounts or [],
            "total_records": len(entity_amounts or [])
            + len(ic_amounts or [])
            + len(other_amounts or []),
        }

    except Exception as e:
        logger.error(f"Error in drill-down: {e}")
        return {
            "success": False,
            "error": str(e),
            "entity_amounts": [],
            "ic_amounts": [],
            "other_amounts": [],
        }


# ============================================================================
# REPORT TEMPLATES AND CACHING
# ============================================================================


@router.post("/templates/save")
async def save_report_template(
    template_name: str = Query(...),
    template_config: Dict[str, Any] = {},
    company_name: str = Query(...),
    current_user: dict = Depends(get_current_active_user),
):
    """Save a report template for reuse"""
    try:
        conn = get_company_connection(company_name)
        cur = conn.cursor()

        # Create templates table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS report_templates (
                template_id VARCHAR(50) PRIMARY KEY,
                template_name VARCHAR(255),
                template_config JSONB,
                company_name VARCHAR(255),
                created_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        template_id = str(uuid.uuid4())

        # Insert template
        cur.execute(
            """
            INSERT INTO report_templates (template_id, template_name, template_config, company_name, created_by)
            VALUES (%s, %s, %s, %s, %s)
        """,
            (
                template_id,
                template_name,
                json.dumps(template_config),
                company_name,
                current_user.get("username", "system"),
            ),
        )

        conn.commit()
        cur.close()
        conn.close()

        return {
            "success": True,
            "template_id": template_id,
            "message": "Report template saved successfully",
        }

    except Exception as e:
        logger.error(f"Error saving template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save template: {str(e)}",
        )


@router.get("/templates")
async def get_report_templates(company_name: str = Query(...)):
    """Get saved report templates"""
    try:
        conn = get_company_connection(company_name)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT template_id, template_name, template_config, created_by, created_at
            FROM report_templates
            WHERE company_name = %s
            ORDER BY created_at DESC
        """,
            (company_name,),
        )

        templates = cur.fetchall()

        cur.close()
        conn.close()

        return {"success": True, "templates": templates or []}

    except Exception as e:
        logger.error(f"Error fetching templates: {e}")
        return {"success": False, "error": str(e), "templates": []}
