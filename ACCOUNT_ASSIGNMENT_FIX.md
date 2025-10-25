# Account Assignment Fix - Elements Not Showing in Modal

## Issue
When clicking "Assign Elements" in the Axes Account Management hierarchy, the modal showed "No elements found" even though accounts existed in the Elements tab.

## Root Cause
The `loadAllAccounts()` function had three critical issues:

1. **Wrong API Endpoint**: Was calling `/api/ifrs-accounts` which doesn't exist
2. **Wrong Response Format**: Expected a plain array but API returns `{accounts: [...], total: N}`
3. **Wrong Field Mapping**: Was looking for `account_name` and `account_code` but backend returns `name` and `code`
4. **Wrong Update Endpoint**: Was using `account_code` as identifier but backend expects `account_id`

## Solution

### 1. Fixed API Endpoint
**Before:**
```javascript
const response = await fetch('/api/ifrs-accounts', {
  credentials: 'include'
})
```

**After:**
```javascript
const response = await fetch('/api/axes-account/accounts?company_name=Default%20Company', {
  credentials: 'include'
})
```

### 2. Fixed Response Parsing
**Before:**
```javascript
const accounts = await response.json()
```

**After:**
```javascript
const data = await response.json()
const accounts = data.accounts || data || []
```

### 3. Fixed Field Mapping
**Before:**
```javascript
{
  id: account.id || `temp_${index}`,
  name: account.account_name || account.name || 'Unnamed Account',
  code: account.account_code || account.code || `CODE_${index}`,
  // ...
}
```

**After:**
```javascript
{
  id: account.id || account.code || `temp_${index}`,
  name: account.name || 'Unnamed Account',
  code: account.code || `CODE_${index}`,
  account_name: account.name || 'Unnamed Account',
  account_code: account.code || `CODE_${index}`,
  account_type: account.account_type || 'Account',
  // ... all backend fields properly mapped
}
```

### 4. Fixed Update Endpoint
**Before:**
```javascript
const endpoint = hierarchyType === 'account' 
  ? `/api/axes-account/accounts/${entity.account_code || entity.code}`
  : `/api/axes-entity/entities/${entity.id}`
```

**After:**
```javascript
const endpoint = hierarchyType === 'account' 
  ? `/api/axes-account/accounts/${entity.id}`
  : `/api/axes-entity/entities/${entity.id}`
```

## Backend API Reference

### GET /api/axes-account/accounts
Returns:
```json
{
  "accounts": [
    {
      "id": 1,
      "name": "cash",
      "code": "1000",
      "account_type": "Asset",
      "statement": "N/A",
      "category": "N/A",
      "description": "N/A",
      "hierarchy_id": null,
      "node_id": null,
      "parent_id": null,
      "level": 0,
      "is_leaf": true
    }
  ],
  "total": 6
}
```

### PUT /api/axes-account/accounts/{account_id}
Expects:
- Path parameter: `account_id` (integer)
- Query parameter: `company_name`
- Body: Account update data including `node_id` and `hierarchy_id`

## Files Modified
- `Frontend/src/components/HierarchyEditorPanel.jsx`
  - Lines 308-356: Fixed `loadAllAccounts()` function
  - Lines 254-256: Fixed update endpoint to use `entity.id`

## Testing
1. ✅ Open Axes Account Management
2. ✅ Go to Hierarchies tab
3. ✅ Select a node (e.g., "Check1")
4. ✅ Click "Assign Elements"
5. ✅ Modal now shows all available accounts (cash, Equity, Long term loans, etc.)
6. ✅ Select accounts and click "Assign Selected"
7. ✅ Accounts are successfully assigned to the node
8. ✅ Hierarchy refreshes showing assigned accounts

## Console Logs Added
For debugging, the following logs are now available:
- `🔍 Loading all accounts from API...`
- `🔍 Response status: 200`
- `🔍 Raw data from API:` - Shows the full API response
- `🔍 Accounts array:` - Shows the extracted accounts array
- `🔍 Number of accounts: 6`
- `🔍 Processing account 0:` - Shows each account being transformed
- `🔍 Transformed accounts:` - Shows final transformed data
- `🚀 Updating entity:` - Shows which account is being assigned
- `🚀 Using endpoint:` - Shows the exact API endpoint being called

## Result
Users can now:
- ✅ See all available accounts in the assignment modal
- ✅ Select multiple accounts to assign
- ✅ Successfully assign accounts to hierarchy nodes
- ✅ See the hierarchy update immediately after assignment
