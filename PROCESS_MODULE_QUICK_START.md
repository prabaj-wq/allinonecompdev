# Process Module - Quick Start Guide

## 5-Minute Setup

### ✅ Backend Integration (Already Done)
- ✔️ Created `Backend/routers/workflow_builder.py` with full API
- ✔️ Added router import to `Backend/main.py`
- ✔️ Registered all endpoints with `/api/workflow` prefix

### ✅ Frontend Components (Already Done)
- ✔️ `ProcessCanvas.jsx` - Drag-drop workflow builder
- ✔️ `ProcessSettings.jsx` - Configuration panel
- ✔️ `NodeEditor.jsx` - Node editor modal
- ✔️ `ProcessPage.jsx` - Main workflow management page
- ✔️ `ProcessCanvas.css` - Canvas styling
- ✔️ `ProcessSettings.css` - Settings styling
- ✔️ `ProcessPage.css` - Page styling

### ✅ Database Schema (Automatic)
Schema is created automatically on first use - no migration needed!

---

## Integration Checklist

### 1. Frontend - Add Route
In your routing file (e.g., `App.jsx` or `AppWithOnboarding.tsx`):

```jsx
import ProcessPage from './components/ProcessPage'

// In your routes:
<Route path="/process" element={<ProcessPage />} />
```

### 2. Frontend - Add Navigation Link
Add to main navigation menu:

```jsx
<NavLink to="/process" className="nav-link">
  <Layers size={20} /> Process Management
</NavLink>
```

### 3. Backend - No Additional Setup Needed!
The workflow_builder router is already registered in main.py.

### 4. Test
Start application and navigate to `/process`

---

## First Workflow: Creating a Simple Journal Entry Process

### Step 1: Access the Module
1. Click "Process Management" in navigation
2. Click "New Workflow"

### Step 2: Create Workflow
Fill in the form:
- **Name**: "Monthly Journal Entries"
- **Description**: "Process for collecting and posting monthly adjustments"
- **Process Type**: "general"

Click "Create Workflow"

### Step 3: Add Nodes
1. Click "Add Node" button
2. Select "Forms & Data Collection" from suggestions
   - Title: "Collect Adjustments"
   - Description: "Collect manual adjustments from users"
   - Click "Save Node"

3. Add second node: "Journal Entries"
   - Title: "Post Journals"
   - Description: "Post collected entries to GL"
   - Click "Save Node"

### Step 4: Connect Nodes
1. Click "Connect Nodes" button
2. Click on first node's connection port
3. Click on second node to complete connection
4. Nodes are now connected

### Step 5: Configure Settings
1. Click "Settings" button
2. Go to "Periods" tab
3. Add period "January 2025"
   - Start: 2025-01-01
   - End: 2025-01-31
4. Go to "Rules" tab
5. Add rule:
   - Name: "Rounding to 2 decimals"
   - Type: "Rounding Rule"
   - Priority: 10

### Step 6: Run Simulation
1. Click "Simulate" button
2. Process runs in staging tables
3. Review results
4. Make adjustments if needed

### Step 7: Finalize
1. Click "Finalize" button
2. Workflow is locked for production use
3. Audit trail records the finalization

---

## Node Types Quick Reference

### 1. **Journal Entries**
- Use for: Creating and posting journal entries
- Config: Entry type, counterparty entity, currency rules
- Inputs: account_code, amount, entity_code
- Outputs: entry_id, balance

### 2. **Forms & Data Collection**
- Use for: Collecting manual data from users
- Config: Form schema, validation rules
- Inputs: form_schema
- Outputs: form_data

### 3. **Entity Structure**
- Use for: Setting up consolidation entities
- Config: Parent-subsidiary relationships
- Inputs: entity_code, parent_entity
- Outputs: hierarchy_id

### 4. **Trial Balance Verification**
- Use for: Validating TB balance
- Config: Tolerance thresholds
- Inputs: debit_total, credit_total
- Outputs: is_balanced, variance

### 5. **Intercompany Eliminations**
- Use for: Eliminating IC transactions
- Config: Elimination method
- Inputs: amount, counterparty_entity
- Outputs: eliminated_amount

### 6. **FX/Foreign Currency Translation**
- Use for: Converting foreign currency balances
- Config: Translation method (closing/average rate)
- Inputs: amount, from_currency, fx_rate
- Outputs: translated_amount, fx_variance

### 7. **Fair Value Adjustments**
- Use for: Recording acquisition fair value differences
- Config: Useful life, amortization method
- Inputs: fair_value, book_value
- Outputs: adjustment, accumulated_amortization

### 8. **Deferred Taxes**
- Use for: Calculating deferred tax impacts
- Config: Tax rate
- Inputs: adjustment_amount, tax_rate
- Outputs: deferred_tax_asset, deferred_tax_liability

### 9. **Non-Controlling Interest (NCI)**
- Use for: Allocating profits to NCI
- Config: Measurement method, NCI %
- Inputs: subsidiary_profit, nci_percentage
- Outputs: nci_amount

### 10. **Retained Earnings Rollforward**
- Use for: Calculating period-end retained earnings
- Config: Opening balance source
- Inputs: opening_balance, net_profit, dividends
- Outputs: closing_balance

---

## Common Workflows

### Consolidation Workflow
1. Entity Structure → Sets up entity hierarchy
2. Trial Balance Verification → Validates entity TBs
3. FX Translation → Translates foreign subsidiaries
4. Intercompany Eliminations → Eliminates IC transactions
5. Fair Value Adjustments → Records acquisition fair values
6. Deferred Taxes → Calculates tax impacts
7. NCI Calculation → Allocates to minority shareholders
8. Retained Earnings → Calculates closing balances

### Period Close Workflow
1. Forms & Data Collection → Collects manual entries
2. Journal Entries → Posts entries
3. Trial Balance Verification → Validates TB
4. Retained Earnings → Calculates closing balance

### Intercompany Elimination Workflow
1. Forms → Collect IC transaction details
2. Intercompany Eliminations → Eliminate transactions
3. Trial Balance Verification → Verify results

---

## API Examples

### Create Workflow via API
```bash
curl -X POST "http://localhost:8000/api/workflow/workflows/create?company_name=MyCompany" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q4 Consolidation",
    "description": "Quarterly consolidation",
    "process_type": "consolidation"
  }'
```

### List Workflows
```bash
curl -X GET "http://localhost:8000/api/workflow/workflows/list?company_name=MyCompany&process_type=consolidation" \
  -H "Authorization: Bearer TOKEN"
```

### Add Node
```bash
curl -X POST "http://localhost:8000/api/workflow/workflows/wf_abc123/nodes/add?company_name=MyCompany" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "node_type": "fx_translation",
    "title": "FX Translation",
    "position_x": 150,
    "position_y": 100,
    "node_config": {
      "translation_method": "closing_rate"
    }
  }'
```

### Run Simulation
```bash
curl -X POST "http://localhost:8000/api/workflow/workflows/wf_abc123/simulate?company_name=MyCompany" \
  -H "Authorization: Bearer TOKEN"
```

---

## Database Tables

All tables are created automatically with proper indices:

```
workflows                 - Main workflow definitions
workflow_nodes           - Individual workflow steps
node_connections         - How nodes link together
workflow_periods         - Time periods for workflow
workflow_staging         - Simulation/preview data
workflow_rules           - Processing rules
workflow_audit_trail     - Complete change history
```

---

## Features Overview

### Canvas Builder
- ✅ Drag-drop node placement
- ✅ Visual connections between nodes
- ✅ Zoom in/out (Ctrl + scroll)
- ✅ Pan canvas (right-click drag)
- ✅ Node enable/disable toggle

### Node Configuration
- ✅ Customizable node titles/descriptions
- ✅ Node-specific configuration options
- ✅ Custom fields per node
- ✅ Input/output schema mapping

### Settings Panel
- ✅ Workflow general settings
- ✅ Period management
- ✅ Processing rules
- ✅ Real-time validation checks

### Simulation Mode
- ✅ Preview workflow execution
- ✅ Staging tables (temporary)
- ✅ No impact on production data
- ✅ Run multiple simulations

### Audit Trail
- ✅ Track all changes
- ✅ User attribution
- ✅ Timestamps
- ✅ Compliance-ready

---

## Troubleshooting

### "Cannot connect to database"
- Check company database exists
- Verify database credentials in .env
- Check POSTGRES_HOST setting

### "Nodes not showing on canvas"
- Refresh page
- Check browser console for errors
- Verify authentication token

### "Simulation not completing"
- Check workflow_staging table for errors
- Verify all required fields in nodes
- Check execution_log in staging table

### "API endpoints returning 404"
- Verify workflow_builder router is imported in main.py
- Verify `/api/workflow` prefix is correct
- Check router is included with `app.include_router()`

---

## Performance Tips

1. **Limit nodes** - Keep to 20-30 nodes per workflow
2. **Efficient connections** - Use direct connections instead of zigzag
3. **Archive old runs** - Clean up old simulation runs
4. **Monitor staging** - Keep staging table size manageable
5. **Use periods** - Segment workflows by period

---

## Security

✅ **Authentication**: JWT token required for all endpoints  
✅ **Authorization**: User can only access company workflows  
✅ **SQL Safety**: Parameterized queries prevent injection  
✅ **Audit Trail**: All changes logged with user attribution  
✅ **Data Isolation**: Per-company database connections  

---

## Next Steps

1. ✅ Integrate route in frontend
2. ✅ Add navigation link
3. ✅ Create first workflow
4. ✅ Build canvas with nodes
5. ✅ Configure settings
6. ✅ Run simulation
7. ✅ Finalize workflow
8. ✅ Review audit trail

---

## Support

For detailed documentation, see: `PROCESS_MODULE_GUIDE.md`

For API reference, see endpoint documentation in `/api/docs`

---

**Status**: ✅ Production Ready  
**Version**: 1.0  
**Last Updated**: 2024