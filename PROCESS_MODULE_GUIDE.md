# Process Module - Complete Guide

## Overview

The Process Module is a comprehensive **workflow automation framework** for building and executing complex financial processes. It provides a canvas-based workflow builder with drag-and-drop node support, comprehensive settings management, full simulation capabilities, and complete audit trail for regulatory compliance.

### Key Features

✅ **Canvas-Based Workflow Builder** - Visually design workflows with drag-drop nodes  
✅ **10+ Pre-Built Node Templates** - Journal Entries, Forms, Entity Structure, TB Verification, and more  
✅ **Smart Node Suggestions** - AI-recommended nodes based on workflow context  
✅ **Simulation Mode** - Preview changes in staging tables before finalizing  
✅ **Full Audit Trail** - Track every change with user attribution and timestamps  
✅ **Multi-Period Support** - Define and manage workflow periods  
✅ **Custom Processing Rules** - Configure validation, rounding, FX, and consolidation rules  
✅ **Company-Specific Isolation** - All data isolated by company database  
✅ **Version Control** - Draft → Finalized workflow progression  

---

## Architecture

### Database Schema

The Process Module uses 7 interconnected PostgreSQL tables:

#### 1. **workflows** - Main process definitions
```sql
CREATE TABLE workflows (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    process_type VARCHAR(50),           -- 'general', 'consolidation', 'close', etc.
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'in_progress', 'finalized'
    fiscal_year VARCHAR(10),
    canvas_config JSONB,               -- Stores canvas layout/visual config
    settings JSONB,                    -- Workflow-level settings
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(255),
    created_by_id INTEGER,
    updated_by VARCHAR(255),
    updated_by_id INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Use Case**: Stores the main workflow definition

---

#### 2. **workflow_nodes** - Individual workflow steps
```sql
CREATE TABLE workflow_nodes (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(100) UNIQUE NOT NULL,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id),
    node_type VARCHAR(50) NOT NULL,    -- 'journal_entries', 'fx_translation', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position_x NUMERIC(10, 2),         -- Canvas X position
    position_y NUMERIC(10, 2),         -- Canvas Y position
    node_config JSONB,                 -- Node-specific configuration
    input_schema JSONB,                -- Expected inputs
    output_schema JSONB,               -- Produced outputs
    custom_fields JSONB,               -- Custom fields defined for this node
    is_enabled BOOLEAN DEFAULT TRUE,
    execution_order INTEGER,           -- Sequential execution order
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Use Case**: Represents each step in the workflow

---

#### 3. **node_connections** - How nodes link together
```sql
CREATE TABLE node_connections (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id),
    source_node_id INTEGER NOT NULL REFERENCES workflow_nodes(id),
    target_node_id INTEGER NOT NULL REFERENCES workflow_nodes(id),
    connection_type VARCHAR(50),       -- 'sequential', 'conditional', 'branching'
    mapping JSONB,                     -- How source outputs map to target inputs
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);
```

**Use Case**: Connects nodes and defines data flow

---

#### 4. **workflow_periods** - Time periods for workflow execution
```sql
CREATE TABLE workflow_periods (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id),
    period_name VARCHAR(50) NOT NULL,  -- 'Jan 2025', 'Q1 2025', etc.
    period_start_date DATE,
    period_end_date DATE,
    fiscal_year VARCHAR(10),
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);
```

**Use Case**: Track workflow execution periods

---

#### 5. **workflow_staging** - Simulation/preview data
```sql
CREATE TABLE workflow_staging (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id),
    node_id INTEGER NOT NULL REFERENCES workflow_nodes(id),
    staging_run_id VARCHAR(100) NOT NULL, -- Unique per simulation run
    input_data JSONB,                  -- Input data to node
    output_data JSONB,                 -- Output produced by node
    execution_status VARCHAR(50),      -- 'pending', 'running', 'success', 'error'
    execution_log TEXT,                -- Execution details/errors
    executed_at TIMESTAMP,
    created_at TIMESTAMP
);
```

**Use Case**: Store simulation results for preview before commit

---

#### 6. **workflow_rules** - Validation and processing rules
```sql
CREATE TABLE workflow_rules (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50),             -- 'fx_translation', 'intercompany', 'deferred_tax', etc.
    rule_config JSONB,                 -- Rule-specific configuration
    priority INTEGER DEFAULT 0,        -- Execution order (higher first)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Use Case**: Define processing rules (FX, rounding, validation, etc.)

---

#### 7. **workflow_audit_trail** - Complete change history
```sql
CREATE TABLE workflow_audit_trail (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id),
    action VARCHAR(100),               -- 'CREATE', 'UPDATE', 'DELETE', 'FINALIZE'
    change_details JSONB,              -- What changed
    performed_by VARCHAR(255),
    performed_by_id INTEGER,
    audit_timestamp TIMESTAMP
);
```

**Use Case**: Track all changes for compliance and rollback

---

## API Endpoints

All endpoints are prefixed with `/api/workflow` and require authentication.

### Workflow Management

#### Create Workflow
```http
POST /workflow/workflows/create?company_name={company}

Request:
{
  "name": "Q4 2025 Consolidation",
  "description": "Quarterly consolidation process",
  "process_type": "consolidation",
  "settings": { "fiscal_year": "2025" }
}

Response:
{
  "status": "success",
  "workflow": {
    "id": 1,
    "workflow_id": "wf_abc123...",
    "name": "Q4 2025 Consolidation",
    "status": "draft"
  }
}
```

#### List Workflows
```http
GET /workflow/workflows/list?company_name={company}&process_type=consolidation&status=draft

Response:
{
  "workflows": [
    { "id": 1, "name": "...", "status": "draft", ... },
    { "id": 2, "name": "...", "status": "finalized", ... }
  ],
  "total": 2
}
```

#### Get Workflow Details
```http
GET /workflow/workflows/{workflow_id}/details?company_name={company}

Response:
{
  "workflow": { ... },
  "nodes": [ ... ],
  "connections": [ ... ],
  "periods": [ ... ],
  "rules": [ ... ]
}
```

#### Update Workflow Settings
```http
PUT /workflow/workflows/{workflow_id}/update?company_name={company}

Request:
{
  "settings": {
    "process_type": "consolidation",
    "base_currency": "USD",
    "rounding_precision": "2"
  }
}
```

---

### Node Management

#### Add Node
```http
POST /workflow/workflows/{workflow_id}/nodes/add?company_name={company}

Request:
{
  "node_type": "fx_translation",
  "title": "Monthly FX Translation",
  "description": "Translate foreign subsidiary balances",
  "position_x": 150,
  "position_y": 100,
  "node_config": {
    "translation_method": "closing_rate",
    "record_cta": true
  },
  "custom_fields": [
    {
      "field_name": "fx_rate",
      "field_label": "Exchange Rate",
      "field_type": "number",
      "is_required": true
    }
  ]
}
```

#### Connect Nodes
```http
POST /workflow/workflows/{workflow_id}/nodes/connect?company_name={company}

Request:
{
  "source_node_id": 1,
  "target_node_id": 2,
  "connection_type": "sequential",
  "mapping": {
    "fx_rate": "source.rate",
    "amount": "source.amount"
  }
}
```

#### Delete Node
```http
DELETE /workflow/workflows/{workflow_id}/nodes/{node_id}/delete?company_name={company}
```

---

### Periods & Rules

#### Add Period
```http
POST /workflow/workflows/{workflow_id}/periods/add?company_name={company}

Request:
{
  "period_name": "January 2025",
  "period_start_date": "2025-01-01",
  "period_end_date": "2025-01-31",
  "fiscal_year": "2025"
}
```

#### Add Rule
```http
POST /workflow/workflows/{workflow_id}/rules/add?company_name={company}

Request:
{
  "rule_name": "Monthly FX Translation",
  "rule_type": "fx_translation",
  "priority": 10,
  "rule_config": {
    "translation_method": "average_rate",
    "apply_to_all_subsidiaries": true
  }
}
```

---

### Simulation & Execution

#### Simulate Workflow
```http
POST /workflow/workflows/{workflow_id}/simulate?company_name={company}

Response:
{
  "status": "success",
  "simulation_run_id": "sim_xyz789...",
  "message": "Simulation started"
}
```

**What happens**:
1. Creates staging records for each enabled node
2. All data is temporary (staging tables only)
3. No changes to production data
4. User can review and make adjustments

#### Finalize Workflow
```http
POST /workflow/workflows/{workflow_id}/finalize?company_name={company}

Response:
{
  "status": "success",
  "message": "Workflow finalized"
}
```

**What happens**:
1. Marks workflow as 'finalized'
2. Can be locked/deployed
3. Audit trail records the finalization

---

### Node Templates

#### Get Node Suggestions
```http
GET /workflow/node-templates/suggestions?workflow_id={id}&company_name={company}

Response:
{
  "node_templates": [
    {
      "type": "intercompany_elimination",
      "title": "Intercompany Eliminations",
      "description": "Eliminate intercompany transactions",
      "inputs": ["amount", "counterparty_entity"],
      "outputs": ["eliminated_amount"],
      "recommended": true
    },
    { ... }
  ]
}
```

#### Get All Templates
```http
GET /workflow/node-templates/all

Response:
{
  "templates": [
    {
      "type": "journal_entries",
      "title": "Journal Entries",
      "description": "Create and manage journal entries",
      "inputs": ["account_code", "amount"],
      "outputs": ["entry_id"]
    },
    { ... }
  ]
}
```

---

## Node Types

### 1. **Journal Entries**
Creates and manages journal entries in the consolidation process

**Config Options**:
- Entry type (debit/credit)
- Counterparty entity
- Currency conversion rules

**Inputs**: `account_code`, `amount`, `entity_code`, `description`  
**Outputs**: `entry_id`, `balance`

**Use Case**: Record consolidation entries, FX adjustments, fair value changes

---

### 2. **Forms & Data Collection**
Collect custom data from users via structured forms

**Config Options**:
- Form schema definition
- Field validation rules
- Default values

**Inputs**: `form_schema`  
**Outputs**: `form_data`

**Use Case**: Collect manual adjustments, approvals, notes from process owners

---

### 3. **Entity Structure**
Define and manage entity hierarchies and ownership

**Config Options**:
- Parent-subsidiary relationships
- Ownership percentages
- Consolidation methods (full/proportionate)

**Inputs**: `entity_code`, `parent_entity`  
**Outputs**: `hierarchy_id`, `consolidation_method`

**Use Case**: Set up consolidation entity structure

---

### 4. **Trial Balance Verification**
Verify and reconcile trial balances

**Config Options**:
- Tolerance thresholds
- Accounts to verify
- Entity scope

**Inputs**: `debit_total`, `credit_total`, `by_account`  
**Outputs**: `is_balanced`, `variance`, `reconciliation_note`

**Use Case**: Validate TB balance before consolidation

---

### 5. **Intercompany Eliminations**
Eliminate intercompany transactions

**Config Options**:
- Elimination method (full/proportionate)
- Accounts to eliminate
- Profit-in-inventory rules

**Inputs**: `amount`, `counterparty_entity`, `account_code`  
**Outputs**: `eliminated_amount`, `gain_loss`

**Use Case**: Eliminate IC sales, receivables/payables, loans

---

### 6. **FX/Foreign Currency Translation**
Handle foreign currency conversions

**Config Options**:
- Translation method (closing/average/historical rate)
- Record CTA (Currency Translation Adjustment)
- Accounts excluded from translation

**Inputs**: `amount`, `from_currency`, `to_currency`, `fx_rate`  
**Outputs**: `translated_amount`, `fx_variance`, `cta_adjustment`

**Use Case**: Translate foreign subsidiary financial data

---

### 7. **Fair Value Adjustments**
Record and depreciate fair value differences from acquisition

**Config Options**:
- Fair value basis
- Useful life
- Amortization method (straight-line/accelerated)

**Inputs**: `fair_value`, `book_value`, `useful_life`  
**Outputs**: `adjustment`, `accumulated_amortization`, `year_amortization`

**Use Case**: Record and depreciate acquisition fair value differences

---

### 8. **Deferred Taxes**
Calculate deferred tax impacts

**Config Options**:
- Tax rate by jurisdiction
- Deferred tax account mappings
- Temporary differences

**Inputs**: `adjustment_amount`, `tax_rate`  
**Outputs**: `deferred_tax_asset`, `deferred_tax_liability`, `tax_expense`

**Use Case**: Record deferred tax impacts of consolidation adjustments

---

### 9. **Non-Controlling Interest (NCI)**
Calculate NCI allocations

**Config Options**:
- Measurement method (proportionate share/fair value)
- NCI percentage
- Profit allocation rules

**Inputs**: `subsidiary_profit`, `nci_percentage`, `subsidiary_equity`  
**Outputs**: `nci_amount`, `nci_equity`, `nci_profit_share`

**Use Case**: Allocate profits and equity to NCI

---

### 10. **Retained Earnings Rollforward**
Roll forward retained earnings balances

**Config Options**:
- Opening balance source
- Profit/loss source
- Dividend source
- Prior period adjustments

**Inputs**: `opening_balance`, `net_profit`, `dividends`, `adjustments`  
**Outputs**: `closing_balance`, `movement_schedule`

**Use Case**: Calculate period-end retained earnings

---

## Integration Steps

### 1. Backend Integration

Add to `Backend/main.py`:

```python
from routers.workflow_builder import router as workflow_router

app.include_router(workflow_router)
```

### 2. Frontend Integration

Import in your main layout component:

```jsx
import ProcessPage from './components/ProcessPage'

// In your routing:
<Route path="/process" element={<ProcessPage />} />
```

### 3. Database Setup

The schema is auto-created when the first workflow is accessed. No manual migration needed.

### 4. Add to Navigation

Add link to Process page in your main navigation menu:

```jsx
<NavLink to="/process">Process Management</NavLink>
```

---

## Workflow Examples

### Example 1: Quarterly Consolidation

1. **Create Workflow** → "Q4 2025 Consolidation"
2. **Add Nodes**:
   - Entity Structure (define subsidiary hierarchy)
   - Trial Balance Verification (verify entity TB)
   - FX Translation (translate foreign subsidiary)
   - Intercompany Eliminations (eliminate IC transactions)
   - NCI Calculation (allocate to minority shareholders)
   - Deferred Tax (record tax impacts)
   - Fair Value Adjustments (record acquisition fair values)
   - Retained Earnings (calculate closing balances)
3. **Connect Nodes** → Sequential data flow
4. **Define Periods** → Q4 (Oct, Nov, Dec)
5. **Add Rules** → FX rules, rounding rules, validation rules
6. **Simulate** → Preview consolidation results
7. **Finalize** → Lock workflow for production

---

### Example 2: Period Close Process

1. **Create Workflow** → "Monthly Close - Dec 2025"
2. **Add Nodes**:
   - Forms (collect manual journal entries)
   - Trial Balance Verification (validate TB)
   - Journal Entries (post journals to GL)
   - Retained Earnings Rollforward (calculate closing balance)
3. **Define Periods** → December 2025
4. **Add Rules** → Rounding rules, validation rules
5. **Simulate** → Preview close impact
6. **Finalize** → Lock period

---

## Best Practices

### Workflow Design
- ✅ Start with Entity Structure node
- ✅ Add verification nodes before and after critical steps
- ✅ Connect nodes in logical sequence
- ✅ Test with simulation mode before finalizing
- ✅ Document the purpose of each node

### Data Management
- ✅ Use staging tables during simulation
- ✅ Always verify data before committing
- ✅ Keep audit trail for compliance
- ✅ Archive closed processes

### Rules & Validation
- ✅ Set appropriate rounding precision
- ✅ Define validation thresholds
- ✅ Create rules for recurring adjustments
- ✅ Prioritize rules correctly

### Performance
- ✅ Limit nodes to 20-30 per workflow
- ✅ Use connection mappings to reduce data transfer
- ✅ Archive old simulation runs
- ✅ Monitor staging table size

---

## Troubleshooting

### Issue: "Database not found"
**Solution**: Ensure company database exists and is accessible

### Issue: Nodes not connecting
**Solution**: Verify both nodes exist and belong to same workflow

### Issue: Simulation not completing
**Solution**: Check staging table for execution_log details

### Issue: Audit trail missing
**Solution**: Ensure workflow_audit_trail table has proper indices

---

## Security

✅ **Authentication**: All endpoints require JWT token  
✅ **Authorization**: User can only access their company's workflows  
✅ **Data Isolation**: Company-specific database connections  
✅ **SQL Injection Prevention**: Parameterized queries throughout  
✅ **Audit Trail**: All changes logged with user attribution  

---

## Future Enhancements

1. **Workflow Scheduling** - Schedule automated execution
2. **Approval Workflows** - Multi-level approvals before finalization
3. **Workflow Comparison** - Compare different versions
4. **What-If Analysis** - Scenario branching and comparison
5. **Advanced Visualizations** - Workflow optimization suggestions
6. **Custom Operators** - Extend rule engine with conditional logic
7. **API Webhooks** - Trigger external systems on workflow completion
8. **Batch Processing** - Execute multiple workflows sequentially

---

## Support

For issues or questions:
1. Check audit trail for change history
2. Review staging table for simulation details
3. Verify database connectivity
4. Check authentication token validity

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready