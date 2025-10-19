# Data Input Module - Complete Implementation Guide

## ✅ Issue Fixed: Fiscal Year Input Focus Loss
**Problem**: When typing in fiscal year fields, users had to click after each character.  
**Solution**: Fixed by using callback form of `setState` (`prev => ({...prev, field: value})`) instead of direct state spreading.  
**Status**: ✅ **FIXED** - Pushed to main (commit 06c455d)

---

## 📋 Data Input Module Requirements

### Overview
Three card types with comprehensive data entry, validation, custom fields, and file upload:
1. **Entity Amounts** - Financial data for individual entities
2. **IC Amounts (Intercompany)** - Intercompany transactions with From/To tracking
3. **Other Amounts** - Adjustments and additional data

---

## 🎯 Core Fields by Card Type

### 1. Entity Amounts Card

| Field Name | Type | Description | Required |
|-----------|------|-------------|----------|
| Entity | Dropdown | Select from axes_entity | ✅ |
| Period | Dropdown | Month/Quarter within year | ✅ |
| Account | Dropdown | Select from axes_account | ✅ |
| Amount | Number | Numeric value (debit/credit) | ✅ |
| Currency | Dropdown | Currency code (USD, EUR, etc.) | ✅ |
| Scenario | Auto | From process context | ✅ |
| Description | Text | Memo/notes about entry | |
| Transaction Date | Date | Date of transaction | |
| Custom Fields | Dynamic | User-defined additional fields | |

**Backend Table**: `entity_amounts`
```sql
CREATE TABLE entity_amounts (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL,
    scenario_id INTEGER NOT NULL,
    year_id INTEGER NOT NULL,
    entity_id INTEGER NOT NULL,
    period_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    description TEXT,
    transaction_date DATE,
    upload_version VARCHAR(50),
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_by VARCHAR(100),
    edited_at TIMESTAMP
)
```

### 2. IC Amounts Card (Intercompany)

| Field Name | Type | Description | Required |
|-----------|------|-------------|----------|
| From Entity | Dropdown | Originating entity | ✅ |
| To Entity | Dropdown | Counterparty entity | ✅ |
| From Account | Dropdown | Account in From Entity | ✅ |
| To Account | Dropdown | Account in To Entity | ✅ |
| Period | Dropdown | Period/date of transaction | ✅ |
| Amount | Number | Transaction value | ✅ |
| Currency | Dropdown | Currency code | ✅ |
| FX Rate | Number | Exchange rate (if multi-currency) | |
| Transaction Type | Dropdown | Sale/Loan/Cost allocation/Service | ✅ |
| Counterparty Ref ID | Text | Invoice or reference number | |
| Description | Text | Transaction notes | |
| Scenario | Auto | From process context | ✅ |
| Custom Fields | Dynamic | User-defined fields | |

**Backend Table**: `ic_amounts`
```sql
CREATE TABLE ic_amounts (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL,
    scenario_id INTEGER NOT NULL,
    year_id INTEGER NOT NULL,
    from_entity_id INTEGER NOT NULL,
    to_entity_id INTEGER NOT NULL,
    from_account_id INTEGER NOT NULL,
    to_account_id INTEGER NOT NULL,
    period_id INTEGER NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    fx_rate DECIMAL(10,6),
    transaction_type VARCHAR(50),
    reference_id VARCHAR(100),
    description TEXT,
    custom_fields_jsonb JSONB,
    upload_version VARCHAR(50),
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_by VARCHAR(100),
    edited_at TIMESTAMP,
    CONSTRAINT check_different_entities CHECK (from_entity_id != to_entity_id)
)
```

**Validation Rules for IC Amounts**:
- ✅ From Entity ≠ To Entity
- ✅ Both From Account and To Account must exist
- ✅ If currencies differ, FX rate required
- ⚠️ Warn if sum of From entries ≠ sum of To entries (double-entry check)
- ✅ Transaction Type must be from allowed list

### 3. Other Amounts Card

| Field Name | Type | Description | Required |
|-----------|------|-------------|----------|
| Entity | Dropdown | Entity or "Global" | |
| Period | Dropdown | Period of adjustment | ✅ |
| Account | Dropdown | Account affected | ✅ |
| Amount | Number | Adjustment amount | ✅ |
| Currency | Dropdown | Currency code | ✅ |
| Adjustment Type | Dropdown | Manual/One-off/Reclassification | ✅ |
| Description | Text | Reason for adjustment | ✅ |
| Transaction Date | Date | Date of adjustment | |
| Scenario | Auto | From process context | ✅ |
| Custom Fields | Dynamic | User-defined fields | |

**Backend Table**: `other_amounts`
```sql
CREATE TABLE other_amounts (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL,
    scenario_id INTEGER NOT NULL,
    year_id INTEGER NOT NULL,
    entity_id INTEGER,
    period_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    transaction_date DATE,
    upload_version VARCHAR(50),
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_by VARCHAR(100),
    edited_at TIMESTAMP
)
```

---

## 🔧 Custom Fields System

**Already Implemented** in `data_input_custom_fields` table:
```sql
CREATE TABLE data_input_custom_fields (
    id SERIAL PRIMARY KEY,
    card_type VARCHAR(50) NOT NULL,  -- 'entity_amounts', 'ic_amounts', 'other_amounts'
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(20) NOT NULL,  -- 'text', 'number', 'date', 'dropdown', 'checkbox'
    is_required BOOLEAN DEFAULT FALSE,
    options TEXT,  -- Pipe-separated for dropdowns: "Option1|Option2|Option3"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
)
```

**API Endpoints**:
- `GET /api/data-input/{card_type}/custom-fields?company_name={company}`
- `POST /api/data-input/{card_type}/custom-fields?company_name={company}`
- `DELETE /api/data-input/{card_type}/custom-fields/{id}?company_name={company}`

**Example Custom Fields**:
- Entity Amounts: "Cost Center", "Department", "Project Code"
- IC Amounts: "Elimination Method", "Business Segment", "Region"
- Other Amounts: "Approval Status", "Audit Flag", "Notes Category"

---

## 📊 User Interface Components

### 1. Card Selection View
```
┌─────────────────────────────────────────────┐
│ Data Input - Process Name                   │
│ Year: 2024 | Scenario: Actuals | Company    │
└─────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Entity       │  │ IC Amounts   │  │ Other        │
│ Amounts      │  │ (Interco)    │  │ Amounts      │
│              │  │              │  │              │
│ 1,245 rows   │  │ 89 rows      │  │ 34 rows      │
│ ✅ 1,200 OK  │  │ ✅ 85 OK     │  │ ✅ 30 OK     │
│ ❌ 45 errors │  │ ⚠️ 4 warn    │  │ ❌ 4 errors  │
│              │  │              │  │              │
│ Last: 2hrs   │  │ Last: 1hr    │  │ Last: 3hrs   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 2. Data Entry Table View
```
┌──────────────────────────────────────────────────────────────┐
│ Entity Amounts - Data Management                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Add Row  │ │ Upload   │ │ Download │ │ Custom   │        │
│ │          │ │ CSV      │ │ Template │ │ Fields   │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├──────────────────────────────────────────────────────────────┤
│ Filters: [Entity ▼] [Period ▼] [Account ▼]  🔍 Search       │
├──────────────────────────────────────────────────────────────┤
│ Entity  │Period│Account│Amount   │Currency│Date  │...│Actions│
│─────────┼──────┼───────┼─────────┼────────┼──────┼───┼───────│
│ USA Inc │ Q1   │ 1000  │ 50,000  │ USD    │ ...  │...│ ✏️ 🗑️  │
│ UK Ltd  │ Q1   │ 1100  │ 25,000  │ GBP    │ ...  │...│ ✏️ 🗑️  │
│ ...     │ ...  │ ...   │ ...     │ ...    │ ...  │...│ ...   │
└──────────────────────────────────────────────────────────────┘
Status: 1,245 rows | Validated: 1,200 ✅ | Errors: 45 ❌
```

### 3. Manual Entry Modal
```
┌──────────────────────────────────────────────┐
│ Add New Entry - Entity Amounts               │
├──────────────────────────────────────────────┤
│ Entity: [Select Entity ▼           ] *       │
│ Period: [Select Period ▼           ] *       │
│ Account: [Select Account ▼         ] *       │
│ Amount: [_______________           ] *       │
│ Currency: [USD ▼                   ] *       │
│ Description: [                     ]         │
│ Date: [mm/dd/yyyy                  ]         │
│ ─── Custom Fields ───                        │
│ Cost Center: [_______________     ]          │
│ Department: [Select ▼             ]          │
├──────────────────────────────────────────────┤
│           [Cancel]  [Save Entry]             │
└──────────────────────────────────────────────┘
```

### 4. IC Amounts Special View
```
┌──────────────────────────────────────────────────────────────┐
│ IC Amounts (Intercompany) - Data Management                  │
├──────────────────────────────────────────────────────────────┤
│ From Entity │To Entity│From Acc│To Acc│Amount│Type  │Actions│
│─────────────┼─────────┼────────┼──────┼──────┼──────┼───────│
│ USA Inc     │ UK Ltd  │ 4000   │ 5000 │10,000│ Sale │ ✏️ 🗑️  │
│ UK Ltd      │ USA Inc │ 5000   │ 4000 │10,000│ Sale │ ✏️ 🗑️  │
│ ...         │ ...     │ ...    │ ...  │ ...  │ ...  │ ...   │
└──────────────────────────────────────────────────────────────┘
⚠️ Warning: Sum of From entries (20,000) matches To entries ✅
```

---

## 📤 File Upload Workflow

### Upload Modal Flow:
1. **Select File**: CSV/Excel drag-drop or browse
2. **Map Columns**: Auto-detect or manual mapping
3. **Validation**: Pre-validate all rows
4. **Review Errors**: Show rows with errors
5. **Confirm**: Accept all or fix errors
6. **Save**: Create new upload version

### Column Mapping Interface:
```
┌──────────────────────────────────────────────┐
│ Map File Columns to System Fields            │
├──────────────────────────────────────────────┤
│ File Column        → System Field            │
│─────────────────────────────────────────────│
│ Entity Name        → [Entity ▼        ]     │
│ Period             → [Period ▼        ]     │
│ GL Account         → [Account ▼       ]     │
│ Amount             → [Amount ▼        ]     │
│ Currency           → [Currency ▼      ]     │
│ Cost Centre        → [Custom Field ▼  ]     │
├──────────────────────────────────────────────┤
│ ✅ Auto-detected 6 of 8 columns              │
│ [Skip Unmapped] [Continue to Validation]    │
└──────────────────────────────────────────────┘
```

### Validation Results:
```
┌──────────────────────────────────────────────┐
│ Upload Validation Results                    │
├──────────────────────────────────────────────┤
│ Total Rows: 1,500                            │
│ ✅ Valid: 1,445                              │
│ ❌ Errors: 55                                │
│                                              │
│ Error Details:                               │
│ Row 15: Entity "ABC Corp" not found          │
│ Row 23: Account "9999" does not exist        │
│ Row 47: Amount must be numeric               │
│ Row 89: Period "Q5" invalid for FY2024       │
│ ...                                          │
├──────────────────────────────────────────────┤
│ [Download Error Report]  [Fix & Re-upload]  │
│ [Accept Valid Rows Only]  [Cancel]          │
└──────────────────────────────────────────────┘
```

---

## 🔐 Backend API Specifications

### Manual Entry Endpoints

**Create Entry**:
```
POST /api/data-input/{card_type}/entries?company_name={company}
Body: {
  "process_id": 1,
  "scenario_id": 1,
  "year_id": 1,
  "entity_id": 5,
  "period_id": 3,
  "account_id": 100,
  "amount": 50000.00,
  "currency_code": "USD",
  "description": "Q1 Revenue",
  "transaction_date": "2024-03-31",
  "custom_fields": {
    "cost_center": "CC001",
    "department": "Sales"
  }
}
```

**Get Entries**:
```
GET /api/data-input/{card_type}/entries?company_name={company}&process_id=1&scenario_id=1
Response: [
  {
    "id": 1,
    "entity_id": 5,
    "entity_name": "USA Inc",
    "period_id": 3,
    "period_name": "Q1",
    "account_id": 100,
    "account_code": "1000",
    "amount": 50000.00,
    "currency_code": "USD",
    "description": "Q1 Revenue",
    "created_by": "john.doe",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

**Update Entry**:
```
PUT /api/data-input/{card_type}/entries/{id}?company_name={company}
Body: { "amount": 55000.00, "description": "Q1 Revenue - Updated" }
```

**Delete Entry**:
```
DELETE /api/data-input/{card_type}/entries/{id}?company_name={company}
```

### File Upload Endpoints

**Upload File**:
```
POST /api/data-input/{card_type}/upload?company_name={company}
Form Data:
  - file: [binary]
  - process_id: 1
  - scenario_id: 1
  - year_id: 1
  - column_mapping: {JSON mapping}
Response: {
  "upload_id": "upload_20240115_001",
  "total_rows": 1500,
  "valid_rows": 1445,
  "error_rows": 55,
  "errors": [...]
}
```

**Get Upload Status**:
```
GET /api/data-input/{card_type}/uploads/{upload_id}?company_name={company}
```

**Download Template**:
```
GET /api/data-input/{card_type}/template?company_name={company}
Returns: CSV with all required + custom field columns
```

### IC Amounts Special Endpoints

**Validate IC Balance**:
```
POST /api/data-input/ic_amounts/validate-balance?company_name={company}
Body: { "process_id": 1, "scenario_id": 1, "period_id": 3 }
Response: {
  "balanced": false,
  "mismatches": [
    {
      "from_entity": "USA Inc",
      "to_entity": "UK Ltd",
      "from_total": 100000,
      "to_total": 95000,
      "difference": 5000
    }
  ]
}
```

---

## 🎨 Frontend Component Structure

```
DataInput.jsx
├── CardSelector (3 cards overview)
├── EntityAmountsManager
│   ├── DataTable
│   ├── ManualEntryModal
│   ├── FileUploadModal
│   ├── CustomFieldsManager
│   └── ValidationSummary
├── ICAmountsManager
│   ├── ICDataTable (special From/To columns)
│   ├── ICManualEntryModal
│   ├── ICFileUploadModal
│   ├── BalanceValidation
│   └── CustomFieldsManager
└── OtherAmountsManager
    ├── DataTable
    ├── ManualEntryModal
    ├── FileUploadModal
    ├── CustomFieldsManager
    └── ValidationSummary
```

---

## ✅ Implementation Checklist

### Phase 1: Core Infrastructure ✅
- [x] Database tables created during onboarding
- [x] Custom fields table exists
- [x] Basic API endpoints for CRUD

### Phase 2: Manual Entry (Priority)
- [ ] Manual entry modal with all core fields
- [ ] Dropdown population from axes (entity, account, period)
- [ ] Custom fields display in modal
- [ ] Inline validation
- [ ] Save to database with audit trail

### Phase 3: Data Table Display
- [ ] Fetch and display entries
- [ ] Pagination/infinite scroll
- [ ] Filtering by entity/period/account
- [ ] Search functionality
- [ ] Edit/delete inline
- [ ] Status indicators (validated/error)

### Phase 4: IC Amounts Specialization
- [ ] From/To Entity dropdowns
- [ ] From/To Account dropdowns
- [ ] Transaction Type dropdown
- [ ] Balance validation warnings
- [ ] Double-entry check logic

### Phase 5: File Upload
- [ ] Drag-drop file upload
- [ ] CSV/Excel parsing
- [ ] Column mapping interface
- [ ] Pre-validation before save
- [ ] Error reporting
- [ ] Download template
- [ ] Upload version tracking

### Phase 6: Custom Fields Management
- [ ] "Manage Custom Fields" modal
- [ ] Add/edit/delete custom fields
- [ ] Dynamic column addition to tables
- [ ] Custom field validation

### Phase 7: Status & Reporting
- [ ] Card status summary
- [ ] Version history view
- [ ] Download data as CSV
- [ ] Validation report export

---

## 🚀 Quick Start for Developers

1. **Fix Fiscal Year Input** ✅ DONE
   - Already committed and pushed

2. **Backend Ready** ✅
   - Tables auto-create during onboarding
   - Custom fields API exists
   - Need to add full CRUD endpoints for entries

3. **Next Steps**:
   - Implement manual entry modal first
   - Add data table display
   - Then file upload
   - Finally IC Amounts specialization

---

## 📚 Reference Documents

- **Database Schema**: See `Backend/routers/data_input.py` for table creation
- **Custom Fields API**: Lines 190-245 in `data_input.py`
- **Process Context**: URL params from `Process.jsx` navigation

---

**Status**: 
- ✅ Fiscal Year Input Fix: **COMPLETE** 
- 📋 Data Input Implementation: **GUIDE CREATED** - Ready for development

See this guide as the single source of truth for implementing the comprehensive Data Input module.
