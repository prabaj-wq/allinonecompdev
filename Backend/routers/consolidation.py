"""
IFRS Consolidation Module
- Comprehensive consolidation workflows
- Consolidation nodes, rules, and scenarios
- Supports all IFRS consolidation features
"""

from fastapi import (
    APIRouter,
    HTTPException,
    status,
    Query,
    Body,
    Depends,
)
from typing import Optional, Dict, Any, List, Set
from pydantic import BaseModel, validator
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import sql
import os
import json
import re
from datetime import datetime
from decimal import Decimal
from contextlib import contextmanager

from auth.dependencies import get_current_active_user
from database import User


router = APIRouter(prefix="/consolidation", tags=["Consolidation"])


# ============================================================================
# CONSOLIDATION DATABASE SCHEMA MANAGEMENT
# ============================================================================


def get_db_config() -> Dict[str, Any]:
    """Get database connection configuration."""
    host = os.getenv("POSTGRES_HOST", "postgres" if os.getenv("DOCKER_ENV") == "true" else "localhost")
    return {
        "host": host,
        "port": os.getenv("POSTGRES_PORT", "5432"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "epm_password"),
    }


def normalize_company_db_name(company_name: str) -> str:
    """Normalise the company name to match database naming rules."""
    if not company_name:
        return "default_company"
    sanitized = re.sub(r"[^a-z0-9_]", "_", company_name.lower().replace(" ", "_"))
    sanitized = sanitized.strip("_")
    return sanitized or "default_company"


@contextmanager
def company_connection(company_name: str):
    """Context manager that yields a connection to the company specific database."""
    db_name = normalize_company_db_name(company_name)
    try:
        conn = psycopg2.connect(database=db_name, **get_db_config())
    except psycopg2.OperationalError as exc:
        raise HTTPException(status_code=404, detail=f"Database for company '{company_name}' is not available: {exc}")
    try:
        yield conn
    finally:
        conn.close()


def ensure_consolidation_schema(conn: psycopg2.extensions.connection) -> None:
    """Create all consolidation tables."""
    cur = conn.cursor()

    # Consolidation entities/structure
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_entities (
            id SERIAL PRIMARY KEY,
            entity_code VARCHAR(255) NOT NULL,
            entity_name VARCHAR(255) NOT NULL,
            parent_entity_code VARCHAR(255),
            ownership_percentage NUMERIC(5, 2) DEFAULT 100,
            measurement_method VARCHAR(50) DEFAULT 'proportionate',
            nci_measurement VARCHAR(50) DEFAULT 'fair_value',
            acquisition_date DATE,
            functional_currency VARCHAR(10),
            reporting_currency VARCHAR(10),
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(entity_code)
        )
        """
    )

    # Consolidation scenarios
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_scenarios (
            id SERIAL PRIMARY KEY,
            scenario_key VARCHAR(128) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            scenario_type VARCHAR(50) DEFAULT 'actual',
            fiscal_year VARCHAR(10) NOT NULL,
            parent_scenario_id INTEGER REFERENCES consolidation_scenarios(id),
            status VARCHAR(50) DEFAULT 'draft',
            settings JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            updated_by INTEGER
        )
        """
    )

    # Consolidation processes
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_processes (
            id SERIAL PRIMARY KEY,
            process_key VARCHAR(128) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            scenario_id INTEGER REFERENCES consolidation_scenarios(id),
            process_type VARCHAR(100) DEFAULT 'consolidation',
            status VARCHAR(50) DEFAULT 'draft',
            canvas_config JSONB DEFAULT '{}',
            rules JSONB DEFAULT '{}',
            custom_fields JSONB DEFAULT '[]',
            restrictions JSONB DEFAULT '{}',
            audit_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            updated_by INTEGER
        )
        """
    )

    # Consolidation nodes (workflow steps)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_nodes (
            id SERIAL PRIMARY KEY,
            process_id INTEGER NOT NULL REFERENCES consolidation_processes(id),
            node_key VARCHAR(128) NOT NULL,
            node_type VARCHAR(100) NOT NULL,
            title VARCHAR(255),
            description TEXT,
            position_x INTEGER,
            position_y INTEGER,
            config JSONB DEFAULT '{}',
            enabled BOOLEAN DEFAULT true,
            execution_order INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(process_id, node_key)
        )
        """
    )

    # Consolidation node inputs/outputs
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_node_mappings (
            id SERIAL PRIMARY KEY,
            source_node_id INTEGER REFERENCES consolidation_nodes(id),
            target_node_id INTEGER REFERENCES consolidation_nodes(id),
            mapping_key VARCHAR(255),
            mapping_config JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Consolidation periods
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_periods (
            id SERIAL PRIMARY KEY,
            process_id INTEGER NOT NULL REFERENCES consolidation_processes(id),
            period_code VARCHAR(50) NOT NULL,
            period_name VARCHAR(255),
            start_date DATE,
            end_date DATE,
            is_open BOOLEAN DEFAULT true,
            period_order INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(process_id, period_code)
        )
        """
    )

    # Consolidation rules
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_rules (
            id SERIAL PRIMARY KEY,
            process_id INTEGER NOT NULL REFERENCES consolidation_processes(id),
            rule_key VARCHAR(128) NOT NULL,
            rule_type VARCHAR(100),
            rule_name VARCHAR(255),
            description TEXT,
            rule_logic JSONB DEFAULT '{}',
            priority INTEGER DEFAULT 0,
            enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(process_id, rule_key)
        )
        """
    )

    # FX rates
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_fx_rates (
            id SERIAL PRIMARY KEY,
            scenario_id INTEGER NOT NULL REFERENCES consolidation_scenarios(id),
            from_currency VARCHAR(10),
            to_currency VARCHAR(10),
            rate_type VARCHAR(50) DEFAULT 'closing',
            rate_date DATE,
            rate_value NUMERIC(18, 6),
            average_rate NUMERIC(18, 6),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(scenario_id, from_currency, to_currency, rate_type, rate_date)
        )
        """
    )

    # Intercompany transactions
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_intercompany (
            id SERIAL PRIMARY KEY,
            scenario_id INTEGER NOT NULL REFERENCES consolidation_scenarios(id),
            from_entity_code VARCHAR(255),
            to_entity_code VARCHAR(255),
            account_code VARCHAR(255),
            period VARCHAR(50),
            amount NUMERIC(18, 2),
            currency VARCHAR(10),
            description TEXT,
            elimination_method VARCHAR(50) DEFAULT 'full',
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Fair value adjustments
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_fair_values (
            id SERIAL PRIMARY KEY,
            scenario_id INTEGER NOT NULL REFERENCES consolidation_scenarios(id),
            acquired_entity_code VARCHAR(255),
            asset_code VARCHAR(255),
            fair_value NUMERIC(18, 2),
            carrying_amount NUMERIC(18, 2),
            adjustment NUMERIC(18, 2),
            useful_life INTEGER,
            depreciation_method VARCHAR(50),
            goodwill_amount NUMERIC(18, 2),
            impairment_amount NUMERIC(18, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # NCI calculations
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_nci (
            id SERIAL PRIMARY KEY,
            scenario_id INTEGER NOT NULL REFERENCES consolidation_scenarios(id),
            entity_code VARCHAR(255),
            period VARCHAR(50),
            ownership_percentage NUMERIC(5, 2),
            entity_profit NUMERIC(18, 2),
            nci_share_profit NUMERIC(18, 2),
            nci_equity_opening NUMERIC(18, 2),
            nci_equity_closing NUMERIC(18, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # OCI items
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_oci_items (
            id SERIAL PRIMARY KEY,
            scenario_id INTEGER NOT NULL REFERENCES consolidation_scenarios(id),
            entity_code VARCHAR(255),
            period VARCHAR(50),
            oci_type VARCHAR(100),
            item_description TEXT,
            opening_balance NUMERIC(18, 2) DEFAULT 0,
            current_period NUMERIC(18, 2) DEFAULT 0,
            reclassifications NUMERIC(18, 2) DEFAULT 0,
            tax_effect NUMERIC(18, 2) DEFAULT 0,
            closing_balance NUMERIC(18, 2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Consolidation audit trail
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_audit_trail (
            id SERIAL PRIMARY KEY,
            process_id INTEGER NOT NULL REFERENCES consolidation_processes(id),
            action VARCHAR(255),
            entity_type VARCHAR(100),
            entity_id INTEGER,
            old_value JSONB,
            new_value JSONB,
            user_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Consolidation staging (for simulation)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS consolidation_staging (
            id SERIAL PRIMARY KEY,
            process_id INTEGER NOT NULL REFERENCES consolidation_processes(id),
            scenario_id INTEGER REFERENCES consolidation_scenarios(id),
            node_id INTEGER REFERENCES consolidation_nodes(id),
            data_type VARCHAR(100),
            entity_code VARCHAR(255),
            account_code VARCHAR(255),
            period VARCHAR(50),
            amount NUMERIC(18, 2),
            currency VARCHAR(10),
            calculation_method VARCHAR(100),
            status VARCHAR(50) DEFAULT 'staged',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Create indexes
    cur.execute("CREATE INDEX IF NOT EXISTS idx_consol_entities_code ON consolidation_entities(entity_code)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_consol_scenarios_year ON consolidation_scenarios(fiscal_year)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_consol_processes_scenario ON consolidation_processes(scenario_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_consol_nodes_process ON consolidation_nodes(process_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_consol_periods_process ON consolidation_periods(process_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_consol_rules_process ON consolidation_rules(process_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_consol_audit_process ON consolidation_audit_trail(process_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_consol_staging_process ON consolidation_staging(process_id)")

    conn.commit()
    cur.close()


# ============================================================================
# PYDANTIC MODELS
# ============================================================================


class ConsolidationEntityModel(BaseModel):
    entity_code: str
    entity_name: str
    parent_entity_code: Optional[str] = None
    ownership_percentage: float = 100.0
    measurement_method: str = "proportionate"
    nci_measurement: str = "fair_value"
    acquisition_date: Optional[str] = None
    functional_currency: str = "USD"
    reporting_currency: str = "USD"
    status: str = "active"


class ConsolidationScenarioModel(BaseModel):
    name: str
    description: Optional[str] = None
    scenario_type: str = "actual"
    fiscal_year: str
    parent_scenario_id: Optional[int] = None


class ConsolidationProcessModel(BaseModel):
    name: str
    description: Optional[str] = None
    scenario_id: int
    process_type: str = "consolidation"


class ConsolidationNodeModel(BaseModel):
    node_type: str
    title: str
    description: Optional[str] = None
    position_x: int = 0
    position_y: int = 0
    config: Dict[str, Any] = {}
    enabled: bool = True
    execution_order: Optional[int] = None


class ConsolidationRuleModel(BaseModel):
    rule_type: str
    rule_name: str
    description: Optional[str] = None
    rule_logic: Dict[str, Any] = {}
    priority: int = 0
    enabled: bool = True


class FXRateModel(BaseModel):
    from_currency: str
    to_currency: str
    rate_type: str = "closing"
    rate_date: str
    rate_value: float
    average_rate: Optional[float] = None


# ============================================================================
# CONSOLIDATION ENDPOINTS
# ============================================================================


@router.post("/entities/create")
async def create_consolidation_entity(
    company_name: str = Query(...),
    entity: ConsolidationEntityModel = Body(...),
    current_user: User = Depends(get_current_active_user),
):
    """Create a consolidation entity."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                INSERT INTO consolidation_entities
                (entity_code, entity_name, parent_entity_code, ownership_percentage, measurement_method,
                 nci_measurement, acquisition_date, functional_currency, reporting_currency, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, entity_code, entity_name
                """,
                (
                    entity.entity_code,
                    entity.entity_name,
                    entity.parent_entity_code,
                    entity.ownership_percentage,
                    entity.measurement_method,
                    entity.nci_measurement,
                    entity.acquisition_date,
                    entity.functional_currency,
                    entity.reporting_currency,
                    entity.status,
                ),
            )
            result = cur.fetchone()
            conn.commit()
            cur.close()
            return dict(result) if result else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entities/list")
async def list_consolidation_entities(
    company_name: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """List all consolidation entities."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM consolidation_entities ORDER BY entity_name")
            entities = cur.fetchall()
            cur.close()
            return {"entities": [dict(e) for e in entities]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scenarios/create")
async def create_consolidation_scenario(
    company_name: str = Query(...),
    scenario: ConsolidationScenarioModel = Body(...),
    current_user: User = Depends(get_current_active_user),
):
    """Create a consolidation scenario."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            scenario_key = re.sub(r"[^a-z0-9_]", "_", scenario.name.lower().strip())
            scenario_key = re.sub(r"_+", "_", scenario_key).strip("_")[:60]

            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                INSERT INTO consolidation_scenarios
                (scenario_key, name, description, scenario_type, fiscal_year, parent_scenario_id, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, scenario_key, name, fiscal_year, status
                """,
                (scenario_key, scenario.name, scenario.description, scenario.scenario_type, 
                 scenario.fiscal_year, scenario.parent_scenario_id, current_user.id),
            )
            result = cur.fetchone()
            conn.commit()
            cur.close()
            return dict(result) if result else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenarios/list")
async def list_consolidation_scenarios(
    company_name: str = Query(...),
    fiscal_year: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
):
    """List consolidation scenarios."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            if fiscal_year:
                cur.execute(
                    "SELECT * FROM consolidation_scenarios WHERE fiscal_year = %s ORDER BY created_at DESC",
                    (fiscal_year,)
                )
            else:
                cur.execute("SELECT * FROM consolidation_scenarios ORDER BY created_at DESC")
            
            scenarios = cur.fetchall()
            cur.close()
            return {"scenarios": [dict(s) for s in scenarios]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/processes/create")
async def create_consolidation_process(
    company_name: str = Query(...),
    process: ConsolidationProcessModel = Body(...),
    current_user: User = Depends(get_current_active_user),
):
    """Create a consolidation process."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            process_key = re.sub(r"[^a-z0-9_]", "_", process.name.lower().strip())
            process_key = re.sub(r"_+", "_", process_key).strip("_")[:60]

            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                INSERT INTO consolidation_processes
                (process_key, name, description, scenario_id, process_type, created_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, process_key, name, scenario_id, status
                """,
                (process_key, process.name, process.description, process.scenario_id, 
                 process.process_type, current_user.id),
            )
            result = cur.fetchone()
            conn.commit()
            cur.close()
            return dict(result) if result else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/processes/list")
async def list_consolidation_processes(
    company_name: str = Query(...),
    scenario_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user),
):
    """List consolidation processes."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            if scenario_id:
                cur.execute(
                    "SELECT * FROM consolidation_processes WHERE scenario_id = %s ORDER BY created_at DESC",
                    (scenario_id,)
                )
            else:
                cur.execute("SELECT * FROM consolidation_processes ORDER BY created_at DESC")
            
            processes = cur.fetchall()
            cur.close()
            return {"processes": [dict(p) for p in processes]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/processes/{process_id}/nodes/add")
async def add_consolidation_node(
    company_name: str = Query(...),
    process_id: int = None,
    node: ConsolidationNodeModel = Body(...),
    current_user: User = Depends(get_current_active_user),
):
    """Add a node to a consolidation process."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            node_key = f"{node.node_type}_{datetime.now().timestamp()}"
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                INSERT INTO consolidation_nodes
                (process_id, node_key, node_type, title, description, position_x, position_y, 
                 config, enabled, execution_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, node_key, node_type, title
                """,
                (process_id, node_key, node.node_type, node.title, node.description,
                 node.position_x, node.position_y, json.dumps(node.config), node.enabled,
                 node.execution_order),
            )
            result = cur.fetchone()
            conn.commit()
            cur.close()
            return dict(result) if result else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/processes/{process_id}/nodes/list")
async def list_process_nodes(
    company_name: str = Query(...),
    process_id: int = None,
    current_user: User = Depends(get_current_active_user),
):
    """List all nodes for a process."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                SELECT cn.*, 
                       ARRAY_AGG(cm.target_node_id) FILTER (WHERE cm.source_node_id = cn.id) as output_nodes,
                       ARRAY_AGG(cm.source_node_id) FILTER (WHERE cm.target_node_id = cn.id) as input_nodes
                FROM consolidation_nodes cn
                LEFT JOIN consolidation_node_mappings cm ON cn.id = cm.source_node_id OR cn.id = cm.target_node_id
                WHERE cn.process_id = %s
                GROUP BY cn.id
                ORDER BY cn.execution_order
                """,
                (process_id,)
            )
            nodes = cur.fetchall()
            cur.close()
            return {"nodes": [dict(n) for n in nodes]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/processes/{process_id}/rules/add")
async def add_consolidation_rule(
    company_name: str = Query(...),
    process_id: int = None,
    rule: ConsolidationRuleModel = Body(...),
    current_user: User = Depends(get_current_active_user),
):
    """Add a consolidation rule to a process."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            rule_key = f"{rule.rule_type}_{datetime.now().timestamp()}"
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                INSERT INTO consolidation_rules
                (process_id, rule_key, rule_type, rule_name, description, rule_logic, priority, enabled)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, rule_key, rule_name, rule_type
                """,
                (process_id, rule_key, rule.rule_type, rule.rule_name, rule.description,
                 json.dumps(rule.rule_logic), rule.priority, rule.enabled),
            )
            result = cur.fetchone()
            conn.commit()
            cur.close()
            return dict(result) if result else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fx-rates/set")
async def set_fx_rate(
    company_name: str = Query(...),
    scenario_id: int = Query(...),
    rate: FXRateModel = Body(...),
    current_user: User = Depends(get_current_active_user),
):
    """Set FX rates for consolidation."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                INSERT INTO consolidation_fx_rates
                (scenario_id, from_currency, to_currency, rate_type, rate_date, rate_value, average_rate)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (scenario_id, from_currency, to_currency, rate_type, rate_date)
                DO UPDATE SET rate_value = %s, average_rate = %s
                RETURNING scenario_id, from_currency, to_currency, rate_value
                """,
                (scenario_id, rate.from_currency, rate.to_currency, rate.rate_type, rate.rate_date,
                 rate.rate_value, rate.average_rate, rate.rate_value, rate.average_rate),
            )
            result = cur.fetchone()
            conn.commit()
            cur.close()
            return dict(result) if result else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fx-rates/get")
async def get_fx_rates(
    company_name: str = Query(...),
    scenario_id: int = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    """Get FX rates for a scenario."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                "SELECT * FROM consolidation_fx_rates WHERE scenario_id = %s ORDER BY rate_date DESC",
                (scenario_id,)
            )
            rates = cur.fetchall()
            cur.close()
            return {"rates": [dict(r) for r in rates]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/processes/{process_id}/details")
async def get_process_details(
    company_name: str = Query(...),
    process_id: int = None,
    current_user: User = Depends(get_current_active_user),
):
    """Get detailed process information including nodes, rules, and configuration."""
    try:
        with company_connection(company_name) as conn:
            ensure_consolidation_schema(conn)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get process
            cur.execute("SELECT * FROM consolidation_processes WHERE id = %s", (process_id,))
            process = cur.fetchone()
            
            if not process:
                raise HTTPException(status_code=404, detail="Process not found")
            
            # Get nodes
            cur.execute(
                "SELECT * FROM consolidation_nodes WHERE process_id = %s ORDER BY execution_order",
                (process_id,)
            )
            nodes = cur.fetchall()
            
            # Get rules
            cur.execute(
                "SELECT * FROM consolidation_rules WHERE process_id = %s ORDER BY priority",
                (process_id,)
            )
            rules = cur.fetchall()
            
            # Get periods
            cur.execute(
                "SELECT * FROM consolidation_periods WHERE process_id = %s ORDER BY period_order",
                (process_id,)
            )
            periods = cur.fetchall()
            
            cur.close()
            
            return {
                "process": dict(process),
                "nodes": [dict(n) for n in nodes],
                "rules": [dict(r) for r in rules],
                "periods": [dict(p) for p in periods],
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
