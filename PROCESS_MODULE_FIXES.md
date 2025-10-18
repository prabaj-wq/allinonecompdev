# Process Module Fixes - Complete Summary

## Issues Fixed

### 1. Database Table Mismatch ✓
**Problem:** The backend router was creating tables named `process_nodes` but the models defined `financial_process_nodes`, causing the error:
```
relation "company_finfusion360.process_nodes" does not exist
```

**Solution:** Updated all table references in `Backend/routers/financial_process.py`:
- Changed table name from `process_nodes` to `financial_process_nodes`
- Changed column names from `x_position`/`y_position` to `x`/`y` to match model
- Fixed all queries to use the correct table and column names

**Files Modified:**
- `Backend/routers/financial_process.py` - Lines 77-94, 101-102, 318, 365-368, 394-446, 448-483

### 2. Node Click Interactions ✓
**Problem:** 
- Clicking on nodes didn't properly show properties panel
- Settings button and "Open Module" button weren't working
- Double-click to open module wasn't functioning

**Solution:** Updated `Frontend/src/pages/Process.jsx`:
- Added separate `handleNodeClick` function for single click (selects node, shows properties)
- Modified `handleNodeMouseDown` to prevent dragging during Shift+click (connection mode)
- Added proper double-click handler to navigate to node's module page
- Fixed cursor styles (cursor-pointer instead of cursor-move)

**Files Modified:**
- `Frontend/src/pages/Process.jsx` - Lines 735-770, 981-998

### 3. API Endpoint Paths ✓
**Problem:** Update and delete endpoints had inconsistent paths

**Solution:** Standardized endpoint paths:
- Changed `PUT /processes/{process_id}/nodes/{node_id}` → `PUT /nodes/{node_id}`
- Changed `DELETE /processes/{process_id}/nodes/{node_id}` → `DELETE /nodes/{node_id}`
- Added proper field mapping for `x_position`/`y_position` → `x`/`y`

**Files Modified:**
- `Backend/routers/financial_process.py` - Lines 394-446, 448-483

## How to Use

### Running the Migration
To create the tables in your database, run:
```bash
cd Backend
python migrate_process_tables.py
```

This will:
1. List all company databases
2. Create/update all required tables
3. Migrate data from old `process_nodes` table if it exists
4. Drop the old table after migration

### Using the Process Module

#### 1. Adding Nodes to Canvas
- Click **"Show Node Library"** button
- Click on any node type to add it to the canvas
- Node will be added at a random position
- Click on the node to select it and view properties

#### 2. Node Interactions
- **Single Click:** Select node and show properties panel
- **Double Click:** Open the module page (e.g., Fiscal Management, FX Translation)
- **Drag:** Click and drag to move nodes
- **Shift+Click:** Start connection mode to link nodes

#### 3. Properties Panel
When a node is selected, the properties panel shows:
- **Node Name:** Edit the node name
- **Description:** Edit the node description
- **Node Type:** View the node type
- **Open Module:** Navigate to the module's page
- **Delete:** Remove the node from canvas

#### 4. Settings
Click the **Settings** button to configure:
- Consolidation method
- Reporting currency
- Elimination settings
- FX translation settings
- Validation controls

## Testing Checklist

### Before Testing
- [ ] Run migration script: `python Backend/migrate_process_tables.py`
- [ ] Restart backend server
- [ ] Clear browser cache and reload frontend

### Test Scenarios
1. **Create Process**
   - [ ] Click "New Process" button
   - [ ] Fill in process details
   - [ ] Click "Create Process"
   - [ ] Verify process appears in list

2. **Add Nodes**
   - [ ] Open a process (click on process card)
   - [ ] Click "Show Node Library"
   - [ ] Click on "Retained Earnings Rollforward" node
   - [ ] Verify node appears on canvas
   - [ ] Add 2-3 more nodes

3. **Node Interactions**
   - [ ] Click on a node - properties panel should appear
   - [ ] Edit node name - changes should reflect
   - [ ] Double-click on node - should navigate to module
   - [ ] Drag node - should move smoothly
   - [ ] Shift+click two nodes - should create connection

4. **Open Module**
   - [ ] Select a node
   - [ ] Click "Open Module" button in properties panel
   - [ ] Verify navigation to correct page

5. **Settings**
   - [ ] Click "Settings" button
   - [ ] Modify settings
   - [ ] Click "Save Settings"
   - [ ] Verify notification appears

6. **Delete Node**
   - [ ] Select a node
   - [ ] Click delete button (trash icon) in properties panel
   - [ ] Verify node is removed
   - [ ] Verify connections are also removed

## Database Schema

### Tables Created
1. **financial_processes** - Main process definitions
2. **financial_process_nodes** - Canvas nodes (NEW NAME)
3. **process_connections** - Node connections
4. **process_scenarios** - Scenario management

### Key Fields in financial_process_nodes
```sql
CREATE TABLE financial_process_nodes (
    id UUID PRIMARY KEY,
    process_id UUID REFERENCES financial_processes(id),
    node_type VARCHAR(50),
    name VARCHAR(255),
    description TEXT,
    x FLOAT,              -- Position X
    y FLOAT,              -- Position Y
    width FLOAT,
    height FLOAT,
    canvas_mode VARCHAR(50),  -- 'entity' or 'consolidation'
    configuration JSONB,
    is_active BOOLEAN,
    sequence INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Node Types and Navigation

| Node Type | Opens Module | Route |
|-----------|--------------|-------|
| fiscal_management | Fiscal Management | `/fiscal-management` |
| profit_loss | Financial Statements | `/financial-statements` |
| nci_allocation | Consolidation | `/consolidation` |
| retained_earnings | Financial Statements | `/financial-statements` |
| fx_translation | Forex Rates | `/forex-rates` |
| intercompany_elimination | Consolidation | `/consolidation` |
| goodwill_impairment | Asset Register | `/asset-register` |
| deferred_tax | Financial Statements | `/financial-statements` |
| opening_balance | Trial Balance | `/trial-balance` |
| associate_equity_method | Consolidation | `/consolidation` |
| eps_calculation | Financial Statements | `/financial-statements` |
| what_if_analysis | What-If Analysis | `/what-if-analysis` |
| validation | Audit Trail | `/audit-trail` |
| consolidation_output | Consolidation | `/consolidation` |
| report_generation | Reports | `/reports` |
| data_input | Trial Balance | `/trial-balance` |

## Known Limitations

1. **Canvas Zoom:** Currently functional but node positions may need adjustment after zoom
2. **Connection Validation:** No validation yet to prevent circular connections
3. **Auto-Layout:** No automatic node layout algorithm implemented
4. **Undo/Redo:** Not implemented yet

## Future Enhancements

1. Auto-arrange nodes in a clean layout
2. Connection validation and cycle detection
3. Export/import process definitions
4. Process templates library
5. Real-time collaboration
6. Version control for processes

## Troubleshooting

### "Table does not exist" Error
- Run the migration script: `python Backend/migrate_process_tables.py`
- Check database connection in `.env` file
- Verify company database exists

### Nodes Not Showing
- Check browser console for errors
- Verify API response in Network tab
- Check `canvas_mode` matches current mode (entity/consolidation)

### Properties Panel Not Showing
- Ensure node is selected (click on it)
- Check z-index in browser DevTools
- Verify `selectedNode` state is set

### Navigation Not Working
- Check `nodeRoutes` mapping in Process.jsx
- Verify routes exist in TwoFactorWrapper.jsx
- Check browser console for navigation errors

## Support

For issues or questions:
1. Check console logs (browser and backend)
2. Review this document
3. Check the error message carefully
4. Verify database connection and table existence
