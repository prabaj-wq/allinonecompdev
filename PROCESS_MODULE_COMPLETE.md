# Process Module - Complete Implementation Guide

## Overview

The **Process Module** is a comprehensive, canvas-based workflow automation framework for the All in One Company platform. It enables users to build custom financial processes like consolidations, roll-forwards, adjustments, and more without coding.

### Key Features

✅ **Canvas-Based Builder** - Drag-and-drop workflow design  
✅ **16 Pre-Built Node Types** - Ready to use financial process templates  
✅ **3-Panel Layout** - Left sidebar (add nodes), center (canvas), right (config)  
✅ **Company Database Isolation** - Secure multi-tenant architecture  
✅ **Full Audit Trail** - Track all changes with user attribution  
✅ **Simulation Mode** - Preview before finalization  
✅ **Complete Validation** - Business rule checking  

---

## Architecture

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  HEADER: Process Name | Status | Settings | Actions │
├──────────┬───────────────────────────┬──────────────┤
│          │                           │              │
│  LEFT    │     CENTER CANVAS         │    RIGHT     │
│  PANEL   │                           │    PANEL     │
│  (Add    │   [Node] → [Node] →      │ (Node Config)│
│   Nodes) │   [Node] → [Node]        │              │
│          │                           │              │
├──────────┴───────────────────────────┴──────────────┤
│ Status Bar | Messages                                │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **Create Process** → Define metadata (name, type, fiscal year)
2. **Add Nodes** → Select from 16 templates, customize config
3. **Connect Nodes** → Draw connections for data flow
4. **Configure Settings** → Set periods, rules, validation
5. **Simulate** → Preview results in staging tables (no production impact)
6. **Finalize** → Commit workflow for production use
7. **Audit Trail** → Track all changes

---

## 16 Pre-Built Node Types

### Financial Core Processes

#### 1. **Journal Entries** 📖
Create and manage journal entries with full accounting control
- Entry date tracking
- Auto-reversal support
- Account mappings
- Narrative and reference fields

#### 2. **Forms & Data Collection** 📝
Collect custom data from users via structured forms
- Custom form fields
- Required field validation
- Submission tracking
- Data type support (text, number, date, select, textarea, boolean)

#### 3. **Entity Structure** 🔀
Define and manage entity hierarchies and ownership
- Parent-child relationships
- Ownership percentage tracking
- Acquisition date recording
- Multi-level hierarchies

#### 4. **Trial Balance Verification** ✅
Verify and reconcile trial balances with tolerance
- Tolerance thresholds (amount + percentage)
- Auto-reconciliation option
- Exception reporting
- Balance verification

### Consolidation Processes

#### 5. **Intercompany Eliminations** 🔗
Eliminate IC transactions (sales, loans, profit)
- Upstream/downstream elimination
- Profit in inventory support
- FX difference handling
- FIFO/LIFO/Weighted Average inventory methods

#### 6. **FX / Foreign Currency Translation** 🌍
Handle currency translation and revaluation
- Closing rate vs average rate
- CTA (Currency Translation Adjustment) recording
- Equity vs P&L treatment
- Opening balance revaluation

#### 7. **Fair Value Adjustments** 💵
Record and depreciate acquisition fair values
- Push-down vs consolidation accounting
- Amortization calculation
- Impairment testing
- Useful life configuration

#### 8. **Deferred Taxes** 📊
Calculate deferred tax impacts on adjustments
- Configurable tax rates
- Jurisdiction-specific rules
- DTA recognition methods
- Valuation allowance support

#### 9. **Non-Controlling Interest (NCI)** 👥
Allocate profits and equity to minority shareholders
- Proportionate share vs fair value measurement
- Profit allocation
- OCI allocation
- Dividend tracking

#### 10. **Retained Earnings Rollforward** 📈
Calculate period-end retained earnings
- Opening balance methods
- Adjustment tracking
- Dividend deductions
- Error correction support

### Extended Processes

#### 11. **Goodwill & Impairment Testing** ⚠️
Test and record goodwill impairment
- Fair value assessment
- Cash generating unit (CGU) definition
- Discount rate configuration
- Growth rate assumptions

#### 12. **Profit / Loss Calculation** 📊
Calculate profit at entity, group, or segment level
- Gross vs operating vs net profit
- Segment reporting
- Comparative period analysis
- Multi-level profit reporting

#### 13. **Opening Balance Adjustments** 🗄️
Manage opening balances for consolidation
- Prior period sourcing
- Manual adjustments
- Validation checking
- Balance reconciliation

#### 14. **Prior Period Errors & Restatements** ⚠️
Handle prior period errors and accounting changes
- Material error classification
- Restatement dating
- Disclosure requirements
- Compliance tracking

#### 15. **Other Comprehensive Income (OCI)** 📉
Capture items outside P&L but in equity
- Revaluation reserves
- Currency translation adjustments
- Actuarial gains/losses
- Reclassification tracking

#### 16. **Earnings Per Share (EPS) Calculation** 🧮
Calculate basic and diluted EPS
- Weighted average shares
- Treasury stock adjustments
- Dilution from options/conversions
- Comparative EPS

---

## Getting Started

### 1. Create a New Process

**Via UI:**
- Click "New Process" button
- Enter process name
- Select process type (consolidation, roll-forward, adjustments, period_close, forecasting)
- Enter fiscal year
- Click Create

**Process Status Flow:**
```
Draft → Active → Completed
```

### 2. Add Nodes to Canvas

**Steps:**
1. Click "Add Nodes" in left panel
2. Popup appears with all 16 node templates
3. Click node type icon to select
4. Click "Add Node"
5. Node appears on canvas

**Configure Node:**
1. Click node on canvas to select (blue highlight)
2. Right panel shows configuration options
3. Edit title, description, node-specific settings
4. Add custom fields if needed
5. Save changes

### 3. Connect Nodes

**Connection Steps:**
1. Left-click source node
2. Right-click target node (or use connection port)
3. Connection line appears showing data flow
4. Mapping can be configured for data transformation

### 4. Configure Process Settings

**Settings Panel Tabs:**

#### General Tab
- Base currency (USD, EUR, GBP, JPY, CNY)
- Rounding precision
- Simulation mode enablement
- Approval requirements
- Auto-calculation settings

#### Periods Tab
- Add multiple periods (Jan 2025, Feb 2025, etc.)
- Set start/end dates
- Mark as open/closed
- Track fiscal year

#### Rules Tab
Add processing rules with priority:
- **FX Translation** - Exchange rate rules
- **Intercompany** - IC elimination rules  
- **NCI** - Ownership allocation rules
- **Fair Value** - Depreciation rules
- **Deferred Tax** - Tax calculation rules
- **Rounding** - Precision rules
- **Validation** - Balance checking rules

#### Validation Tab
- Balance sheet balance check
- Intercompany net-to-zero
- Entity coverage verification
- FX rates completeness
- Ownership percentage validation
- Goodwill impairment testing
- Fair value reconciliation
- Deferred tax position

---

## Node Configuration Examples

### FX Translation Node

```
Title: "Currency Translation - SGD to USD"

Configuration:
├─ Translation Method: Closing Rate
├─ CTA Treatment: Equity (OCI)
├─ Rate Date: Period End
└─ Revalue Opening: Yes

Custom Fields:
├─ Exchange Rate: [1.35]
├─ CTA Account Code: [2100]
└─ Translation Method: [dropdown]
```

### Intercompany Eliminations Node

```
Title: "Eliminate IC - Company B Payables"

Configuration:
├─ Elimination Method: Full
├─ Inventory Method: FIFO
├─ Profit in Inventory: Enabled
└─ FX Differences: Record

Custom Fields:
├─ IC Account Pair: [A/R 1100 ↔ A/P 2100]
├─ Tolerance Amount: [0.01]
└─ Manual Exceptions: [textarea]
```

### Retained Earnings Rollforward Node

```
Title: "RE Rollforward - Group Level"

Configuration:
├─ Opening Balance: From Prior Period
├─ Track Adjustments: Enabled
├─ Deduct Dividends: Yes
└─ Error Correction: Enabled

Custom Fields:
├─ Opening RE Balance: [auto-calculate]
├─ Current Period P/L: [linked node]
├─ Dividends Paid: [1000]
└─ Prior Period Errors: [0]
```

---

## Workflow Examples

### Example 1: Simple Consolidation

```
Process: "2025 Q1 Consolidation"
Type: Consolidation
Fiscal Year: 2025

Nodes:
1. Journal Entries (Opening Balances)
   └→ 2. Entity Structure (Ownership Setup)
       └→ 3. FX Translation (Currency Conversion)
           └→ 4. Intercompany Eliminations (Remove IC)
               └→ 5. NCI Allocation (Minority Interest)
                   └→ 6. Retained Earnings Rollforward (Final RE)

Periods:
- Q1 2025: Jan 1 - Mar 31, 2025

Validation:
- Balance Sheet Balance
- Intercompany Net to Zero
- Entity Coverage
```

### Example 2: Roll-Forward with Fair Value

```
Process: "2025 Roll-Forward"
Type: Roll-Forward
Fiscal Year: 2025

Nodes:
1. Opening Balance Adjustments
   └→ 2. Fair Value Adjustments (Depreciation)
       └→ 3. Deferred Taxes (Tax Impact)
           └→ 4. Profit Calculation
               └→ 5. Retained Earnings Rollforward

Periods:
- Jan 2025: Jan 1-31
- Feb 2025: Feb 1-28
- Mar 2025: Mar 1-31
- Q1 Total: Jan 1 - Mar 31

Rules:
- FX Translation (if applicable)
- Fair Value Amortization (8-year life)
- Deferred Tax (25% rate)
```

### Example 3: Complex Multi-Entity

```
Process: "Multi-Entity Consolidation"
Type: Consolidation
Fiscal Year: 2025

Entity Structure:
- Parent (100% ownership)
  ├─ Sub A (80% ownership)
  │  └─ Sub A1 (60% of Sub A)
  └─ Sub B (75% ownership)

Nodes:
1. Entity Structure Setup
2. Opening Balances (all entities)
3. FX Translation (Sub A in AUD, Sub B in EUR)
4. Intercompany Eliminations:
   - Parent ↔ Sub A
   - Parent ↔ Sub B
   - Sub A ↔ Sub B
5. Fair Value Adjustments
6. Goodwill Impairment Testing
7. NCI Allocation (Sub A: 20%, Sub A1: 40%, Sub B: 25%)
8. Deferred Taxes
9. Retained Earnings Rollforward
10. Consolidated Output

Validation:
- All checks enabled
```

---

## API Endpoints Reference

### Process Management

```
POST /api/process/create
Create new process

GET /api/process/list?company_id=X
List all processes

GET /api/process/{id}/details?company_id=X
Get process with all nodes, connections, periods, rules

PUT /api/process/{id}/update?company_id=X
Update process settings
```

### Node Management

```
POST /api/process/{id}/nodes/add?company_id=X
Add node to canvas

PUT /api/process/{id}/nodes/{node_id}/update?company_id=X
Update node configuration

DELETE /api/process/{id}/nodes/{node_id}/delete?company_id=X
Delete node and cascade connections
```

### Node Connections

```
POST /api/process/{id}/nodes/connect?company_id=X
Connect two nodes

DELETE /api/process/{id}/connections/{conn_id}/delete?company_id=X
Delete connection
```

### Periods & Rules

```
POST /api/process/{id}/periods/add?company_id=X
Add period to process

POST /api/process/{id}/rules/add?company_id=X
Add processing rule
```

### Simulation & Finalization

```
POST /api/process/{id}/simulate?company_id=X
Run process in simulation (staging tables)

POST /api/process/{id}/finalize?company_id=X
Finalize process (production)
```

### Templates

```
GET /api/process/templates/all
Get all 16 node templates
```

---

## Database Schema

### Core Tables

**process_main**
- Process definitions with metadata
- Status tracking (draft, active, completed)
- Settings storage (JSONB)

**process_nodes**
- Individual workflow nodes
- Canvas positioning (x, y)
- Configuration storage
- Custom fields

**process_connections**
- Node-to-node relationships
- Data flow mapping
- Connection status

**process_periods**
- Time periods for execution
- Open/closed tracking

**process_rules**
- Processing rules with priority
- Rule configuration

**process_staging**
- Simulation results
- Temporary data storage
- Execution status tracking

**process_audit**
- Complete change history
- User attribution
- Action logging

---

## Simulation & Finalization Flow

### Simulation Mode

1. User clicks "Simulate"
2. System creates staging run (UUID)
3. Each enabled node executed to staging table
4. No production tables modified
5. Results available for review
6. User can iterate and adjust

### Finalization

1. User reviews simulation results
2. Makes any adjustments
3. Clicks "Finalize"
4. Staging data copied to production tables
5. Process marked as "completed"
6. Audit trail recorded

### Data Isolation

- Staging tables only written during simulation
- Production tables untouched until finalization
- Multiple simulations can be compared
- Full rollback capability

---

## Best Practices

### Process Design

✅ **Start Simple**
- Begin with core financial process
- Add complexity incrementally
- Test frequently with simulation

✅ **Logical Node Ordering**
- Journal entries first
- Calculations next
- Eliminations and adjustments
- Allocations (NCI, FX, Tax)
- Final consolidation output

✅ **Configure Validation**
- Enable all balance checks
- Set tolerance levels appropriately
- Use warnings not errors initially

✅ **Use Custom Fields**
- Add context-specific fields
- Track assumptions
- Document exceptions

### Data Quality

✅ **Validate Inputs**
- Check trial balance balances
- Verify all entities included
- Confirm exchange rates present

✅ **Test Edge Cases**
- Acquisitions during period
- Disposals
- 100% ownership
- Zero balances

✅ **Audit Trail Review**
- Monitor who made changes
- Track all adjustments
- Document justifications

---

## Troubleshooting

### Common Issues

**Q: Nodes won't connect**
A: Ensure both nodes exist in same process, check for circular references

**Q: Simulation fails**
A: Check validation errors in settings, verify all required fields filled

**Q: Canvas slow with many nodes**
A: Limit to 20-30 nodes per process, consider splitting into sub-processes

**Q: Data not saving**
A: Verify company_id is correct, check authentication token validity

---

## File Structure

```
Backend/
├─ routers/
│  └─ process_builder.py          (850 lines - all APIs)

Frontend/
├─ components/
│  ├─ ProcessBuilderPage.jsx       (650 lines - main page)
│  └─ ProcessBuilder/
│     ├─ NodeTemplatePanel.jsx     (180 lines - left sidebar)
│     ├─ ProcessCanvas.jsx         (280 lines - center canvas)
│     ├─ NodeConfigPanel.jsx       (380 lines - right panel)
│     └─ ProcessSettingsPanel.jsx  (450 lines - settings)

├─ styles/
│  └─ ProcessBuilder.css            (1000+ lines - complete styling)
```

---

## Integration

### How It's Integrated

1. **Backend Router** - Registered in `main.py`
2. **Company Database** - Uses existing company isolation
3. **Authentication** - JWT token validation on all endpoints
4. **Audit Trail** - Integrated with existing audit system
5. **Database** - PostgreSQL with automatic schema creation

### How to Use

1. Navigate to `/process` route in frontend
2. Create new process or open existing
3. Build workflow using nodes
4. Configure settings
5. Simulate and finalize

---

## Support & Maintenance

### Monitoring

- Check audit trail for changes
- Monitor staging table size
- Review simulation runs
- Track finalization status

### Updates

- Node templates can be extended
- New rule types can be added
- Custom fields are configurable
- Validation rules are flexible

### Performance

- All queries indexed
- Foreign keys optimized
- JSONB columns for flexibility
- Pagination available for large lists

---

## Version Information

**Module**: Process Module (Process Builder)  
**Version**: 1.0  
**Status**: ✅ Production Ready  
**Database**: PostgreSQL (auto-creates schema)  
**Frontend**: React with Lucide icons  

---

## Next Steps

1. ✅ Create new process
2. ✅ Add nodes from templates
3. ✅ Configure node settings
4. ✅ Connect nodes for data flow
5. ✅ Set periods and rules
6. ✅ Run simulation
7. ✅ Review and adjust
8. ✅ Finalize workflow

Start building! 🚀