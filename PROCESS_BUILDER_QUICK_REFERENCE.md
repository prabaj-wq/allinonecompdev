# Process Builder Enhanced - Quick Reference Guide

## 🚀 Start Using in 5 Minutes

### Step 1: Verify Files (30 seconds)
```bash
# Check backend file
ls Backend/routers/process_builder_enhanced.py

# Check frontend files
ls Frontend/src/components/ProcessBuilderEnhanced.jsx
ls Frontend/src/styles/ProcessBuilderEnhanced.css

# Check documentation
ls PROCESS_BUILDER_ENHANCED_*.md
```

### Step 2: Check Backend Integration (30 seconds)
```bash
# Verify import in main.py
grep "process_builder_enhanced" Backend/main.py

# Output should show:
# from routers import process_builder_enhanced
# app.include_router(process_builder_enhanced.router, prefix="/api")
```

### Step 3: Add Frontend Route (2 minutes)
**File**: `Frontend/src/App.jsx`

Find the routes section and add:
```jsx
import ProcessBuilderEnhanced from './components/ProcessBuilderEnhanced';

// Add this route
<Route path="/process-builder" element={<ProcessBuilderEnhanced />} />
```

### Step 4: Add Navigation (1 minute)
**File**: `Frontend/src/components/Navigation.jsx` (or similar)

Add this link:
```jsx
<NavLink to="/process-builder" className="nav-link">
  <Zap size={20} />
  <span>Process Builder</span>
</NavLink>
```

Import if needed:
```jsx
import { Zap } from 'lucide-react';
```

### Step 5: Start & Test (1 minute)
```bash
# Start backend
cd Backend && python main.py

# In another terminal, start frontend
cd Frontend && npm start

# Navigate to http://localhost:3000/process-builder
```

---

## 📋 File Locations

| Component | Location |
|-----------|----------|
| Backend Router | `Backend/routers/process_builder_enhanced.py` |
| Frontend Component | `Frontend/src/components/ProcessBuilderEnhanced.jsx` |
| Frontend Styles | `Frontend/src/styles/ProcessBuilderEnhanced.css` |
| Database Init | Auto-creates on first use |
| Documentation | `PROCESS_BUILDER_ENHANCED_*.md` |

---

## 🎨 UI Components Overview

### Left Panel (Node Selection)
- 18 node types with icons
- Descriptions for each
- Click to add to canvas
- Scrollable list

### Center Canvas
- SVG rendering
- Drag-drop nodes
- Zoom (Ctrl + Scroll)
- Pan (Right-click + drag)
- Connection lines

### Right Panel (Configuration)
- Selected node details
- Edit node name
- View configuration
- Save / Delete buttons

---

## 🔌 API Quick Reference

### Create Process
```bash
curl -X POST http://localhost:8000/api/process/create \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Process",
    "description": "Description",
    "process_type": "profit_loss",
    "fiscal_year": 2024
  }'
```

### Add Node
```bash
curl -X POST http://localhost:8000/api/process/node/add \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "process_id": 1,
    "node_type": "profit_loss",
    "node_name": "Q1 2024",
    "sequence_order": 1,
    "x_position": 100,
    "y_position": 100,
    "configuration": {}
  }'
```

### Get Full Process
```bash
curl -X GET http://localhost:8000/api/process/1/full \
  -H "Authorization: Bearer {token}"
```

### Validate Process
```bash
curl -X GET http://localhost:8000/api/process/validate/1 \
  -H "Authorization: Bearer {token}"
```

---

## 18 Node Types

### Core Financial
1. **profit_loss** - P&L Calculation
2. **nci_handling** - NCI Management
3. **retained_earnings_rollforward** - RE Rollforward
4. **statement_changes_equity** - SCE

### Consolidation
5. **fx_translation** - FX Translation
6. **intercompany_eliminations** - IC Eliminations
7. **goodwill_fair_value_adjustments** - Goodwill & FV
8. **deferred_taxes** - Deferred Taxes
9. **minority_associate_jv_accounting** - Minority/JV

### Adjustments
10. **opening_balance_adjustments** - Opening Balances
11. **prior_period_errors_changes** - Prior Period Errors

### Analysis
12. **oci_items** - OCI Items
13. **weighted_average_eps** - EPS Calculation
14. **valuation_impairment** - Impairment Testing

### What-If & Control
15. **what_if_simulation** - Simulation Mode
16. **scenario_version_control** - Scenarios
17. **alerts_exceptions** - Alerts
18. **entity_structure_ownership** - Entity Register

---

## 🎯 Common Tasks

### Create a Process
```
1. Navigate to /process-builder
2. Click "New Process"
3. Enter name and select type
4. Process created
```

### Add Financial Nodes
```
1. Click "Edit" on process
2. Click "Profit/Loss" template on left
3. Node appears on canvas
4. Repeat for other nodes
```

### Connect Nodes
```
1. From node → To node
2. Automatic sequential flow
3. Visual connection line appears
```

### Configure Node
```
1. Click node on canvas
2. Edit in right panel
3. Click Save
```

### Run Simulation
```
1. Click "Simulate" button
2. Process runs in staging
3. Results in execution history
```

### Compare Scenarios
```
1. Create multiple scenarios
2. Click "Compare"
3. Side-by-side comparison
```

---

## ⚠️ Troubleshooting

### Backend Issues
```
Error: ModuleNotFoundError
Fix: Check Backend/routers/process_builder_enhanced.py exists

Error: Table does not exist
Fix: Automatic on first API call, create a process

Error: Column does not exist
Fix: Ensure PostgreSQL is running and migrated
```

### Frontend Issues
```
Error: Cannot find CSS module
Fix: Verify import path: '../styles/ProcessBuilderEnhanced.css'

Error: Canvas not rendering
Fix: Open browser console (F12), check for errors

Error: Nodes not appearing
Fix: Ensure process is fetched, check network tab
```

### Database Issues
```
Error: Connection refused
Fix: Start PostgreSQL: docker-compose up -d postgres

Error: Permission denied
Fix: Check database user credentials in .env

Error: Tables not created
Fix: Call POST /api/process/create to trigger initialization
```

---

## 🔐 Security Notes

### Always Include
- ✅ Authorization header with Bearer token
- ✅ Content-Type: application/json
- ✅ Valid JWT token

### Automatically Handled
- ✅ Company ID from user context
- ✅ Data isolation by company
- ✅ User attribution on changes
- ✅ SQL injection prevention

---

## 📊 Database Quick Commands

### Check Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'process%';
```

### Check Company Data
```sql
SELECT * FROM process_definitions WHERE company_id = 1;
```

### View Audit Trail
```sql
SELECT * FROM process_audit_trail ORDER BY timestamp DESC;
```

### Check Entity Ownership
```sql
SELECT * FROM entity_ownership_register WHERE company_id = 1;
```

---

## 🎓 Example Workflow

### 1. Create Process
```
Name: "Q1 2024 Consolidation"
Type: "profit_loss"
Year: 2024
Currency: "USD"
```

### 2. Add Nodes
```
- Entity Structure (ownership register)
- Opening Balances (prior year carryforward)
- Profit/Loss Calculation
- IC Eliminations
- FX Translation
- NCI Handling
- Deferred Taxes
- Retained Earnings Rollforward
- Statement of Changes
```

### 3. Connect Nodes
```
Entity Structure → Opening Balances
Opening Balances → Profit/Loss
Profit/Loss → IC Eliminations
IC Eliminations → FX Translation
FX Translation → NCI Handling
NCI Handling → Deferred Taxes
Deferred Taxes → Retained Earnings
Retained Earnings → Statement of Changes
```

### 4. Configure Each Node
- Set parameters
- Define calculations
- Add custom fields

### 5. Validate & Test
- Click "Validate"
- Check for errors
- Fix issues

### 6. Run Simulation
- Click "Simulate"
- Review results
- Compare scenarios

### 7. Approve & Finalize
- Get sign-off
- Mark as complete
- Archive for compliance

---

## 📈 Performance Tips

### For Large Datasets
1. Use staging environment for simulations
2. Run validations before execution
3. Check audit trail for bottlenecks
4. Use filtering in list views

### For Multiple Processes
1. Create process templates
2. Reuse configurations
3. Copy scenarios between processes
4. Batch operations where possible

---

## 🔄 Update Process

### To Update Configuration
```
1. Edit node
2. Modify configuration JSON
3. Save changes
4. Re-run validation
5. Re-run simulation if needed
```

### To Change Node Type
```
1. Delete existing node
2. Add new node type
3. Reconfigure connections
4. Re-validate process
```

### To Rename Process
```
1. Get process ID
2. Call PUT /api/process/{id}
3. Update name field
4. Confirm update
```

---

## 📞 Support Matrix

| Issue | Solution |
|-------|----------|
| Can't see process | Check company_id, JWT token |
| Node not appearing | Verify node_type, refresh page |
| Calculations wrong | Check configuration, validate process |
| Database error | Check PostgreSQL status |
| API error | Check error logs in console |
| CSS not loading | Verify import path |

---

## ✅ Verification Checklist

Before considering complete:
- [ ] All files exist and readable
- [ ] Backend imports added
- [ ] Frontend routes added
- [ ] Navigation link added
- [ ] Can create process
- [ ] Can add nodes
- [ ] Can connect nodes
- [ ] Can validate
- [ ] Can simulate
- [ ] Database tables created
- [ ] Audit trail populated
- [ ] No errors in console
- [ ] Notifications working

---

## 🎯 Next Steps

1. **Today**: Integration (follow 5-minute guide above)
2. **Tomorrow**: Create test processes
3. **This week**: Add your consolidation logic
4. **Next week**: Test all scenarios
5. **Week after**: Go live with real data

---

## 📚 Resources

- **Complete Features**: PROCESS_BUILDER_ENHANCED_COMPLETE.md
- **Integration Guide**: PROCESS_BUILDER_ENHANCED_INTEGRATION.md
- **Final Summary**: PROCESS_BUILDER_ENHANCED_FINAL_SUMMARY.md
- **This Guide**: PROCESS_BUILDER_QUICK_REFERENCE.md

---

## 🚀 Ready to Launch!

Everything is integrated and ready to use. Just follow the 5-minute startup guide above and you're good to go!

**Questions?** Check the documentation or troubleshooting section.
**Issues?** See support matrix above.
**Ready?** Let's build! 🎉
