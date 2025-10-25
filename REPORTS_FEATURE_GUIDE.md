# Financial Reports Feature - Complete Implementation Guide

## Overview

The Financial Reports feature provides comprehensive financial statement generation directly from the Process module, with full integration to process context (entity, scenario, fiscal year, periods) and hierarchical account structures.

## Features Implemented

### 1. **Reports Button in Process Workflow**
- Location: Top toolbar in Process workflow view
- Validation: Ensures fiscal year, periods, and scenario are selected before opening
- Opens modal with full report generation capabilities

### 2. **Reports Node Integration**
- Reports node can be added to workflow canvas
- **Double-click**: Opens report generation modal
- **Run Node button**: Changed to "Open Reports" - opens modal
- **Context-aware**: Uses current process settings automatically

### 3. **Hierarchical Account Selection**
- Dropdown populated from `axes_accounts` hierarchies
- Tree-based navigation with expand/collapse
- Supports nested structures (e.g., Assets → Current Assets → Cash)
- Visual hierarchy display with proper indentation

### 4. **Entity-wise Column Display**
Each entity selected in the process gets its own set of columns:
- **Entity Amount** (Blue #3B82F6) - Regular entity amounts
- **IC Amount** (Green #10B981) - Intercompany amounts
- **Other Amount** (Amber #F59E0B) - Other adjustments
- **Total** (per entity) - Sum of all three amounts
- **Grand Total** - Aggregate across all entities

### 5. **Report Settings Panel**
- Toggle zero balances on/off
- Show/hide IC amounts
- Show/hide other amounts
- Rounding options: Units, Thousands, Millions
- Color-coded legend for easy identification

### 6. **Data Retrieval Logic**

#### Backend Filters Applied:
```sql
-- All data filtered by:
- process_id (current process)
- scenario_id (selected scenario)
- period_ids (selected periods)
- Entity-wise aggregation
```

#### Data Sources:
1. **entity_amounts** table - Regular entity transactions
2. **ic_amounts** table - Intercompany transactions
3. **other_amounts** table - Other adjustments/eliminations

### 7. **Report Generation Flow**

```
User clicks "Reports" button
    ↓
Validates process context
    ↓
Opens ProcessReports modal
    ↓
User selects hierarchy from dropdown
    ↓
User configures report settings
    ↓
Clicks "Generate Report"
    ↓
Backend fetches data with filters:
  - process_id
  - scenario_id
  - period_ids
  - account hierarchy
    ↓
Groups amounts by:
  - Account code
  - Entity
  - Amount type (entity/IC/other)
    ↓
Builds hierarchical structure
    ↓
Calculates subtotals at each level
    ↓
Displays in table format with:
  - Expandable/collapsible nodes
  - Entity columns
  - Color-coded amounts
```

## File Structure

### Backend Files

#### 1. `Backend/routers/financial_reports.py`
Main reports router with comprehensive functionality:

**Key Functions:**
- `get_report_hierarchies()` - Fetch account hierarchies
- `get_accounts_by_hierarchy()` - Get accounts under a hierarchy
- `generate_financial_report()` - Main report generation
- `get_account_amounts()` - Fetch and aggregate amounts by entity
- `export_to_pdf()` - PDF export (requires reportlab)
- `export_to_excel()` - Excel export (requires openpyxl)
- `drill_down_account()` - Transaction-level details

**Data Structure:**
```python
amounts = {
    "account_code": {
        "entities": {
            "entity_id": {
                "entity_amount": float,
                "ic_amount": float,
                "other_amount": float
            }
        },
        "currency": "USD"
    }
}
```

#### 2. `Backend/main.py`
- Imports financial_reports router (optional import)
- Includes router at `/api/financial-reports` endpoint
- Graceful fallback if dependencies missing

#### 3. `Backend/requirements.txt`
```
reportlab==4.0.7      # PDF generation
openpyxl==3.1.2       # Excel export
```

### Frontend Files

#### 1. `Frontend/src/components/ProcessReports.jsx`
Main React component (701 lines) with:

**Features:**
- Hierarchy tree navigation with expand/collapse
- Entity-wise column rendering
- Color-coded amount display
- Report settings panel
- Export functionality
- Error handling and user feedback
- Loading states

**Props:**
```javascript
{
  processContext: {
    processId: string,
    processName: string,
    entityId: string | null,
    entityName: string | null,
    scenarioId: string,
    scenarioName: string,
    fiscalYear: number,
    selectedPeriods: string[],
    periodNames: string[]
  },
  onClose: function
}
```

#### 2. `Frontend/src/pages/Process.jsx`
Updated with:
- Reports button in toolbar (line ~2090)
- Reports node double-click handler (line ~2891)
- Run Node button for Reports (line ~3044)
- ProcessReports modal integration (line ~4007)

## Usage Guide

### For End Users

#### Step 1: Configure Process
1. Open Process module
2. Select or create a process
3. Configure:
   - Entity Context (BackoOy or specific entity)
   - Fiscal Year
   - Periods (at least one)
   - Scenario

#### Step 2: Add Reports Node (Optional)
1. Click "Add Node" in workflow
2. Select "Reports" from node library
3. Node appears in workflow canvas

#### Step 3: Open Reports
**Method A: Toolbar Button**
- Click "Reports" button in top toolbar

**Method B: Reports Node**
- Double-click the Reports node card
- OR click "Open Reports" button on node

#### Step 4: Generate Report
1. Select account hierarchy from dropdown
   - Example: "Assets" or "Balance Sheet Structure"
2. Configure settings:
   - Show/hide zero balances
   - Include/exclude IC amounts
   - Include/exclude other amounts
   - Select rounding (units/thousands/millions)
3. Click "Generate Report"

#### Step 5: View Results
- Expand/collapse hierarchy nodes using chevron icons
- View amounts by entity in columns:
  - Blue = Entity amounts
  - Green = IC amounts
  - Amber = Other amounts
- See subtotals at each hierarchy level
- Grand total in rightmost column

#### Step 6: Export (Optional)
- Click "Excel" button for spreadsheet export
- Click "PDF" button for printable report

### For Developers

#### Adding New Report Types

1. **Backend** - Add to `financial_reports.py`:
```python
def generate_custom_report(cursor, account_tree, report_request):
    custom_report = {
        "report_type": "Custom Report",
        "report_title": "My Custom Report",
        "sections": {
            "custom_section": {
                "title": "CUSTOM SECTION",
                "accounts": [],
                "total": 0
            }
        }
    }
    # Add custom logic
    return custom_report
```

2. **Frontend** - Update report type selection:
```javascript
report_settings: {
  report_type: 'custom_report',  // Add new type
  // ... other settings
}
```

#### Customizing Column Display

Edit `ProcessReports.jsx` - `renderAccountRow()` function:
```javascript
// Add custom column
<td className="px-3 py-3 text-sm text-right">
  <span style={{ color: customColor }}>
    {formatNumber(customAmount, reportSettings.roundingFactor)}
  </span>
</td>
```

## Database Schema Requirements

### Required Tables

#### 1. `entity_amounts`
```sql
CREATE TABLE entity_amounts (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL,
    scenario_id INTEGER NOT NULL,
    year_id INTEGER,
    period_id INTEGER NOT NULL,
    entity_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    amount FLOAT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    origin VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `ic_amounts`
```sql
CREATE TABLE ic_amounts (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL,
    scenario_id INTEGER NOT NULL,
    year_id INTEGER,
    period_id INTEGER NOT NULL,
    from_entity_id INTEGER NOT NULL,
    to_entity_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    amount FLOAT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. `other_amounts`
```sql
CREATE TABLE other_amounts (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL,
    scenario_id INTEGER NOT NULL,
    year_id INTEGER,
    period_id INTEGER NOT NULL,
    entity_id INTEGER,
    account_id INTEGER,
    amount FLOAT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. `accounts`
```sql
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    account_code VARCHAR(50) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50),
    hierarchy_id VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. `hierarchies`
```sql
CREATE TABLE hierarchies (
    hierarchy_id VARCHAR(50) PRIMARY KEY,
    hierarchy_name VARCHAR(255) NOT NULL,
    hierarchy_type VARCHAR(50),
    description TEXT,
    parent_hierarchy_id VARCHAR(50),
    level_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. Get Hierarchies
```
GET /api/financial-reports/hierarchies
Query Params:
  - company_name: string (required)
  - hierarchy_type: string (optional, e.g., "Account")

Response:
{
  "success": true,
  "hierarchies": [
    {
      "hierarchy_id": "H1",
      "hierarchy_name": "Assets",
      "hierarchy_type": "Account",
      "children": [...]
    }
  ]
}
```

### 2. Generate Report
```
POST /api/financial-reports/generate
Query Params:
  - company_name: string (required)

Body:
{
  "process_context": {
    "process_id": "uuid",
    "scenario_id": "uuid",
    "fiscal_year": 2025,
    "period_ids": ["period1", "period2"]
  },
  "hierarchy_selection": {
    "hierarchy_id": "H1",
    "hierarchy_name": "Assets",
    "include_children": true
  },
  "report_settings": {
    "report_type": "balance_sheet",
    "show_zero_balances": false,
    "currency": "USD",
    "rounding_factor": 1
  }
}

Response:
{
  "success": true,
  "report_id": "uuid",
  "report_data": {
    "report_title": "Balance Sheet",
    "sections": {
      "assets": {
        "title": "ASSETS",
        "accounts": [...],
        "total": 1000000
      }
    }
  }
}
```

### 3. Export Report
```
GET /api/financial-reports/export/{report_id}
Query Params:
  - company_name: string (required)
  - format: "pdf" | "excel" (required)

Response: File download
```

### 4. Drill Down
```
GET /api/financial-reports/drill-down/{account_code}
Query Params:
  - company_name: string (required)
  - process_context: JSON string (optional)

Response:
{
  "success": true,
  "account_code": "1000",
  "entity_amounts": [...],
  "ic_amounts": [...],
  "other_amounts": [...]
}
```

## Error Handling

### Backend Errors
1. **Missing Dependencies**
   - reportlab not installed → PDF export shows 503 error with helpful message
   - openpyxl not installed → Falls back to xlsxwriter or shows error

2. **Missing Data**
   - No hierarchies → Returns empty array
   - No accounts → Returns empty report sections
   - No amounts → Shows zero balances or empty cells

3. **Invalid Context**
   - Missing process_id → Uses default or shows error
   - Invalid period_ids → Filters them out

### Frontend Errors
1. **API Failures**
   - Connection error → Shows "Unable to connect" message with retry button
   - 404 error → Shows "Module not available" message
   - 503 error → Shows specific error from backend

2. **Validation Errors**
   - No hierarchy selected → Alert before generation
   - No fiscal year → Notification when clicking Reports button
   - No periods → Notification when clicking Reports button
   - No scenario → Notification when clicking Reports button

3. **User Feedback**
   - Loading spinner during data fetch
   - Success notification on report generation
   - Error display with clear messages
   - Retry options for failed operations

## Docker Deployment

### Building with Dependencies

```bash
# Stop existing containers
docker-compose down

# Rebuild backend with new dependencies
docker-compose build backend

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

### Without Docker

```bash
# Install Python dependencies
cd Backend
pip install -r requirements.txt

# Start backend
python main.py

# In another terminal, start frontend
cd Frontend
npm install
npm run dev
```

## Troubleshooting

### Issue: Reports button does nothing
**Solution:** Check console for errors. Ensure:
- Process is selected
- Fiscal year is selected
- At least one period is selected
- Scenario is selected

### Issue: No hierarchies in dropdown
**Solution:** 
1. Check if account hierarchies exist in axes_accounts module
2. Verify hierarchy_type is "Account"
3. Check backend logs for database connection issues

### Issue: No amounts showing in report
**Solution:**
1. Verify data exists in data_input tables
2. Check that process_id matches between process and data_input
3. Verify scenario_id and period_ids match
4. Check backend logs for SQL errors

### Issue: PDF export fails
**Solution:**
```bash
pip install reportlab==4.0.7
docker-compose restart backend  # If using Docker
```

### Issue: Excel export fails
**Solution:**
```bash
pip install openpyxl==3.1.2
docker-compose restart backend  # If using Docker
```

## Performance Considerations

### Database Optimization
```sql
-- Add indexes for faster queries
CREATE INDEX idx_entity_amounts_process ON entity_amounts(process_id, scenario_id, period_id);
CREATE INDEX idx_entity_amounts_account ON entity_amounts(account_id);
CREATE INDEX idx_ic_amounts_process ON ic_amounts(process_id, scenario_id, period_id);
CREATE INDEX idx_other_amounts_process ON other_amounts(process_id, scenario_id, period_id);
```

### Frontend Optimization
- Lazy load account details only when hierarchy selected
- Pagination for large account lists (future enhancement)
- Virtual scrolling for many entities (future enhancement)
- Memoization of report calculations

### Backend Optimization
- Use prepared statements for repeated queries
- Implement caching for frequently accessed reports
- Batch process account amount fetching
- Compress large report exports

## Future Enhancements

### Planned Features
1. **Comparative Reports** - Show multiple periods side by side
2. **Variance Analysis** - Calculate and display variances
3. **Custom Report Templates** - Save and reuse report configurations
4. **Scheduled Reports** - Automatic report generation
5. **Email Distribution** - Send reports to stakeholders
6. **Chart Visualization** - Graphical representation of data
7. **Comments & Annotations** - Add notes to report items
8. **Version Control** - Track report changes over time

### Enhancement Ideas
- Multi-currency support with conversion
- Drill-through to source documents
- Consolidation adjustments visibility
- Audit trail for report generation
- Role-based report access control

## Support & Maintenance

### Logs Location
- Backend: Docker container logs or console output
- Frontend: Browser console (F12)

### Common Log Messages
```
✅ "Entity configurations loaded" - Successfully loaded entity configs
✅ "Configuration saved to PostgreSQL" - Process saved
❌ "Error fetching hierarchies" - Database connection issue
❌ "Failed to generate report" - Data retrieval problem
⚠️  "Financial reports module not available" - Import failed
```

### Version History
- **v1.0.0** (2025-01-25) - Initial release
  - Basic report generation
  - Entity-wise columns
  - Hierarchical display
  - Export to PDF/Excel
  - Full process integration

## Credits & License

Developed for All-in-One Company Production System
Integration with Process Builder, Data Input, and Axes Management modules

---

**Last Updated:** January 25, 2025
**Version:** 1.0.0
**Status:** Production Ready ✅