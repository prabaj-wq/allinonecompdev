# Financial Statements Feature - Complete Implementation

## Overview
Implemented a comprehensive Financial Statements feature that generates hierarchy-based reports with drill-down capability, entity segregation, and export functionality.

## Features Implemented

### 1. **Node Configuration Settings**
- **Account Hierarchy Selection**: Choose from available account hierarchies in Axes Account module
- **Report Type**: Balance Sheet, Profit & Loss, Cash Flow Statement
- **Display Options**:
  - Show/Hide Zero Balances
  - Show/Hide IC (Intercompany) Column
  - Show/Hide Other Amounts Column
- **Rounding Factor**: Units, Thousands, Millions
- **Currency**: Configurable currency display

### 2. **Hierarchy-Based Report Generation**
- **Account Hierarchy Integration**: Pulls account structure from Axes Account module
- **Multi-Level Display**: Shows parent nodes and child accounts with proper indentation
- **Expand/Collapse**: Interactive tree view for drilling into hierarchy levels
- **Entity Segregation**: Separate columns for each entity in the process context
- **Column Types**:
  - Entity Amount (from entity_amounts table)
  - IC Amount (from ic_amounts table)
  - Other Amount (from other_amounts table)
  - Total per entity
  - Grand Total across all entities

### 3. **Data Aggregation**
- **Process Context Aware**: Uses selected process, scenario, fiscal year, and periods
- **Multi-Table Aggregation**: Combines data from:
  - `{process}_entity_amounts_entries`
  - `{process}_ic_amounts_entries`
  - `{process}_other_amounts_entries`
- **Automatic Rollup**: Parent nodes show sum of all child accounts and nodes
- **Zero Balance Filtering**: Option to hide accounts with zero balances

### 4. **Drill-Down Capability**
- **Click-to-View Details**: Click any amount cell to see underlying transactions
- **Transaction Details Modal**: Shows:
  - Transaction Date
  - Reference ID
  - Description
  - Amount
  - Transaction Type (Entity/IC/Other)
- **Filtered by Context**: Only shows transactions for selected periods and scenario

### 5. **Export Functionality**
- **Excel Export**: 
  - Professional formatting with headers
  - Company name and generation date
  - Hierarchical structure preserved
  - Entity columns with proper labels
- **PDF Export**: Placeholder for future implementation
- **Downloadable Files**: Automatic download with timestamped filename

### 6. **Search and Filter**
- **Account Search**: Real-time search across account codes and names
- **Hierarchy Filtering**: Search results maintain hierarchy context
- **Visual Feedback**: Highlighted search results

## Technical Architecture

### Frontend Components

#### **FinancialStatements.jsx**
Location: `Frontend/src/components/FinancialStatements.jsx`

**Key Features**:
- Modal-based interface with settings panel
- Configurable report parameters
- Interactive hierarchy tree rendering
- Drill-down modal for transaction details
- Export functionality integration

**State Management**:
```javascript
- config: Node configuration (hierarchy, report type, display options)
- reportData: Generated report structure with nodes and amounts
- entities: List of entities from process context
- expandedNodes: Set of expanded hierarchy nodes
- drillDownData: Transaction details for drill-down
```

**Key Functions**:
- `generateReport()`: Calls backend API to generate report
- `handleDrillDown()`: Fetches transaction details for an account
- `exportToExcel()`: Exports report to Excel format
- `calculateNodeTotal()`: Recursively calculates node totals
- `renderHierarchyNode()`: Renders hierarchy tree structure
- `renderAccountRow()`: Renders individual account rows

### Backend API Endpoints

#### **financial_statements.py**
Location: `Backend/routers/financial_statements.py`

**Endpoints**:

1. **POST /financial-statements/generate**
   - Generates financial statement based on hierarchy
   - Request Body:
     ```json
     {
       "company_name": "string",
       "process_id": int,
       "scenario_id": int,
       "hierarchy_id": int,
       "entity_ids": [array],
       "period_ids": [array],
       "report_type": "balance_sheet|profit_loss|cash_flow",
       "show_zero_balances": bool,
       "show_ic_column": bool,
       "show_other_column": bool,
       "rounding_factor": int,
       "currency": "string"
     }
     ```
   - Response: Hierarchical report structure with amounts

2. **GET /financial-statements/drill-down**
   - Fetches transaction details for an account
   - Query Parameters:
     - company_name
     - process_id
     - scenario_id
     - account_code
     - entity_id
     - period_ids (comma-separated)
   - Response: List of transactions with details

3. **POST /financial-statements/export**
   - Exports report to Excel or PDF
   - Request Body:
     ```json
     {
       "company_name": "string",
       "report_data": object,
       "config": object,
       "format": "excel|pdf"
     }
     ```
   - Response: File download stream

**Key Functions**:
- `generate_financial_statements()`: Main report generation logic
  - Fetches hierarchy structure from account_hierarchy_nodes
  - Retrieves accounts mapped to hierarchy
  - Aggregates amounts from data input tables
  - Builds tree structure with amounts
  - Returns hierarchical report data

- `get_drill_down_data()`: Transaction detail retrieval
  - Queries entity_amounts, ic_amounts, other_amounts tables
  - Filters by account, entity, scenario, and periods
  - Returns formatted transaction list

- `export_financial_statement()`: Export functionality
  - Creates Excel workbook with openpyxl
  - Formats headers and data rows
  - Returns streaming response for download

## Database Schema Requirements

### Tables Used:
1. **account_hierarchy_nodes**: Hierarchy structure
2. **axes_accounts**: Account master with node mapping
3. **{process}_entity_amounts_entries**: Entity-level amounts
4. **{process}_ic_amounts_entries**: Intercompany amounts
5. **{process}_other_amounts_entries**: Other adjustments

### Key Fields:
- **Hierarchy**: id, code, name, parent_id, level, hierarchy_id
- **Accounts**: account_code, account_name, node_id
- **Amounts**: account_code, entity_id, amount, scenario_id, period_id

## Integration with Process Module

### Process.jsx Updates
Location: `Frontend/src/pages/Process.jsx`

**Changes Made**:
1. Replaced `ProcessReports` import with `FinancialStatements`
2. Updated process context to include:
   - entityIds (array instead of single entityId)
   - entityNames (array of entity names)
   - fiscalYearName (for display)
3. Added nodeConfig prop for configuration persistence
4. Added onSaveConfig callback for saving node settings

**Context Passed**:
```javascript
{
  processId: Process ID
  processName: Process name
  entityIds: Array of entity IDs
  entityNames: Array of entity names
  scenarioId: Selected scenario ID
  scenarioName: Scenario name
  fiscalYear: Fiscal year ID
  fiscalYearName: Fiscal year name
  selectedPeriods: Array of period IDs
  periodNames: Array of period names
}
```

## User Workflow

### Step 1: Configure Settings
1. Click "Reports" button in Process module
2. Click Settings icon in Financial Statements modal
3. Select Account Hierarchy (required)
4. Choose Report Type (Balance Sheet/P&L/Cash Flow)
5. Set display options (zero balances, IC column, other column)
6. Choose rounding factor (Units/Thousands/Millions)
7. Click "Save Configuration"

### Step 2: Generate Report
1. Click "Generate Report" button
2. System fetches hierarchy structure
3. Aggregates amounts from data input tables
4. Displays hierarchical report with entity columns
5. Top-level nodes expanded by default

### Step 3: Navigate Report
1. Click expand/collapse icons to drill into hierarchy
2. Use search box to find specific accounts
3. Scroll horizontally to view all entity columns
4. View totals at node and grand total levels

### Step 4: Drill Down
1. Click any amount cell to view details
2. Modal shows underlying transactions:
   - Transaction date
   - Reference ID
   - Description
   - Amount
   - Type (Entity/IC/Other)
3. Close modal to return to report

### Step 5: Export
1. Click "Export Excel" button
2. System generates formatted Excel file
3. File downloads automatically with timestamp
4. Open in Excel for further analysis

## Benefits

### For Users:
- **Comprehensive View**: See all entities side-by-side
- **Flexible Configuration**: Customize report to needs
- **Drill-Down Analysis**: Investigate amounts in detail
- **Professional Output**: Export-ready financial statements
- **IFRS Compliant**: Follows standard hierarchy structure

### For System:
- **Reusable Component**: Can be used in multiple modules
- **Scalable Architecture**: Handles large hierarchies efficiently
- **Maintainable Code**: Clear separation of concerns
- **Extensible Design**: Easy to add new features

## Future Enhancements

### Planned Features:
1. **PDF Export**: Full PDF generation with formatting
2. **Report Templates**: Save and reuse report configurations
3. **Version Control**: Save report snapshots with timestamps
4. **Comparison Mode**: Compare multiple periods side-by-side
5. **Custom Calculations**: Add calculated fields and ratios
6. **Notes and Annotations**: Add explanatory notes to reports
7. **Email Distribution**: Schedule and email reports
8. **Dashboard Integration**: Embed key metrics in dashboards

### Technical Improvements:
1. **Performance Optimization**: Caching and lazy loading
2. **Offline Mode**: Generate reports without backend
3. **Real-time Updates**: WebSocket for live data
4. **Advanced Filtering**: Complex filter expressions
5. **Custom Formatting**: User-defined number formats

## Testing Checklist

- [ ] Generate report with single entity
- [ ] Generate report with multiple entities
- [ ] Test expand/collapse functionality
- [ ] Verify amount aggregation accuracy
- [ ] Test drill-down for all amount types
- [ ] Verify zero balance filtering
- [ ] Test IC and Other column toggle
- [ ] Verify rounding factor application
- [ ] Test search functionality
- [ ] Export to Excel and verify format
- [ ] Test with different hierarchies
- [ ] Verify process context integration
- [ ] Test with different scenarios and periods
- [ ] Verify error handling for missing data

## Troubleshooting

### Common Issues:

**Issue**: "Failed to fetch account hierarchies"
- **Cause**: No hierarchies created in Axes Account module
- **Solution**: Create at least one account hierarchy first

**Issue**: Report shows no data
- **Cause**: No data input entries for selected context
- **Solution**: Add entries in Data Input module for the process

**Issue**: Drill-down shows no transactions
- **Cause**: No detailed entries for the account/entity combination
- **Solution**: Verify data exists in data input tables

**Issue**: Export fails
- **Cause**: Missing openpyxl dependency
- **Solution**: Install openpyxl: `pip install openpyxl`

## Files Modified/Created

### Frontend:
- ✅ **Created**: `Frontend/src/components/FinancialStatements.jsx` (new component)
- ✅ **Modified**: `Frontend/src/pages/Process.jsx` (integration)

### Backend:
- ✅ **Modified**: `Backend/routers/financial_statements.py` (complete rewrite)

### Documentation:
- ✅ **Created**: `FINANCIAL_STATEMENTS_IMPLEMENTATION.md` (this file)

## Summary

The Financial Statements feature provides a comprehensive, hierarchy-based reporting solution that:
- Integrates seamlessly with the Process module
- Leverages existing Axes Account hierarchies
- Aggregates data from multiple data input tables
- Provides drill-down capability for detailed analysis
- Supports export to Excel for external use
- Offers flexible configuration options
- Maintains IFRS compliance through proper hierarchy structure

This implementation replaces the previous ProcessReports component with a more robust, feature-rich solution that meets enterprise financial reporting requirements.
