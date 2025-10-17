# 🚀 Process Builder Integration Guide

## Quick Setup (5 minutes)

### Step 1: Update Route in TwoFactorWrapper.jsx

Replace the old Process route with the new ProcessManagement component:

**File**: `Frontend/src/components/TwoFactorWrapper.jsx`

**Find** (line ~125):
```jsx
<Route path="/process" element={
  <PageAccessWrapper requiredPage="/process" pageName="Process Management">
    <Process />
  </PageAccessWrapper>
} />
```

**Replace with**:
```jsx
<Route path="/process" element={
  <PageAccessWrapper requiredPage="/process" pageName="Process Management">
    <ProcessManagement />
  </PageAccessWrapper>
} />
```

### Step 2: Add Import

**In the same file** (around line 12), add:

```jsx
import ProcessManagement from '../pages/ProcessManagement'
```

### Step 3: Keep or Remove Old Route

You can choose to:

**Option A: Keep old `/process-builder` route** (for backward compatibility)
```jsx
<Route path="/process-builder" element={
  <PageAccessWrapper requiredPage="/process" pageName="Process Builder">
    <ProcessBuilderV2 />
  </PageAccessWrapper>
} />
```

**Option B: Point to new Modern Builder**
```jsx
<Route path="/process-builder" element={
  <PageAccessWrapper requiredPage="/process" pageName="Process Builder">
    <ProcessManagement />
  </PageAccessWrapper>
} />
```

We recommend **Option A** for now - keeping both for backward compatibility.

### Step 4: Verify Installation

1. Start the frontend: `npm start` (in Frontend directory)
2. Navigate to `/process` in your app
3. You should see:
   - A list of processes (or empty state)
   - "New Process" button
   - Edit button for each process
4. Click "New Process" to create one
5. Click "Edit" to open the modern builder

### Step 5: Test the Builder

```
1. Create a process: "Test Process"
2. Click "Edit" 
3. Drag "Start" element to canvas
4. Drag "Process" element to canvas
5. Drag "End" element to canvas
6. Connect them: Start → Process → End
7. Click "Save"
8. Return to list and verify it was saved
```

---

## Complete File Structure

After integration, you'll have these new files:

```
Frontend/src/
├── components/
│   ├── ProcessBuilder.jsx              ✨ NEW - Main canvas component
│   ├── ProcessNodeTypes.jsx            ✨ NEW - Node type definitions
│   ├── ProcessElementSidebar.jsx       ✨ NEW - Draggable sidebar
│   └── ProcessNodePanel.jsx            ✨ NEW - Node configuration
│
└── pages/
    └── ProcessManagement.jsx           ✨ NEW - List & creation UI
```

---

## Detailed Integration Steps

### Option 1: Manual Update (Recommended First Time)

#### Step 1: Verify React Flow Installation
```bash
cd Frontend
npm list reactflow
```

Expected output: `reactflow@11.11.4` or similar

#### Step 2: Copy New Files
Ensure these files exist:
- ✅ `Frontend/src/components/ProcessBuilder.jsx`
- ✅ `Frontend/src/components/ProcessNodeTypes.jsx`
- ✅ `Frontend/src/components/ProcessElementSidebar.jsx`
- ✅ `Frontend/src/components/ProcessNodePanel.jsx`
- ✅ `Frontend/src/pages/ProcessManagement.jsx`

#### Step 3: Update Imports in TwoFactorWrapper.jsx

Line ~12, add:
```jsx
import ProcessManagement from '../pages/ProcessManagement'
```

If you want to keep the old Process import for reference (optional):
```jsx
// import Process from '../pages/Process' // Old - can remove later
import ProcessManagement from '../pages/ProcessManagement' // New
```

#### Step 4: Update Route Mapping

Line ~125, change:
```jsx
// OLD
<Route path="/process" element={
  <PageAccessWrapper requiredPage="/process" pageName="Process Management">
    <Process />  {/* ← Remove this */}
  </PageAccessWrapper>
} />

// NEW
<Route path="/process" element={
  <PageAccessWrapper requiredPage="/process" pageName="Process Management">
    <ProcessManagement /> {/* ← Add this */}
  </PageAccessWrapper>
} />
```

#### Step 5: Verify and Test

```bash
cd Frontend
npm start
```

Navigate to `http://localhost:5173/process` in your browser.

---

### Option 2: Automated Update (If you have script access)

Create a file `update-process-routes.js` in the Frontend directory:

```javascript
const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src/components/TwoFactorWrapper.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import if not present
if (!content.includes('import ProcessManagement from')) {
  const importLine = "import ProcessManagement from '../pages/ProcessManagement'\n";
  const lastImportIndex = content.lastIndexOf("import ");
  const endOfLine = content.indexOf('\n', lastImportIndex);
  content = content.slice(0, endOfLine + 1) + importLine + content.slice(endOfLine + 1);
}

// Replace Process with ProcessManagement in route
content = content.replace(
  /<Route path="\/process" element=\{\s*<PageAccessWrapper[^>]*>\s*<Process \/>/,
  '<Route path="/process" element={\n            <PageAccessWrapper requiredPage="/process" pageName="Process Management">\n              <ProcessManagement />'
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Routes updated successfully!');
```

Run it:
```bash
node update-process-routes.js
```

---

## Troubleshooting Integration

### Issue: "ProcessManagement is not defined"

**Solution**: Ensure the import statement is at the top of TwoFactorWrapper.jsx:
```jsx
import ProcessManagement from '../pages/ProcessManagement'
```

Check the exact path - it should match your file structure.

### Issue: Styles not loading (builder looks broken)

**Solution**: React Flow styles need to be imported. Check if this is in ProcessBuilder.jsx:
```jsx
import 'reactflow/dist/style.css'
```

If not, the file might have been corrupted. Re-create it from the source.

### Issue: Button clicks don't work

**Solution**: Check that `useAuth()` and `useCompany()` hooks are available:
```jsx
const { selectedCompany } = useCompany()
const { isAuthenticated, getAuthHeaders } = useAuth()
```

If missing, verify these context providers are set up in App.jsx.

### Issue: API calls failing with 404

**Solution**: Verify backend endpoints exist:
```
POST /api/process/catalog
GET  /api/process/catalog
GET  /api/process/{id}
PUT  /api/process/catalog/{id}
DELETE /api/process/catalog/{id}
POST /api/process/save-workflow
```

Check the backend logs for errors.

---

## Feature Verification Checklist

After integration, verify these features work:

- [ ] **List View**
  - [ ] Page loads without errors
  - [ ] "New Process" button visible
  - [ ] Process list displays (if any exist)

- [ ] **Create Process**
  - [ ] "New Process" modal opens
  - [ ] Form validation works
  - [ ] Process created successfully
  - [ ] Appears in list

- [ ] **Open Builder**
  - [ ] "Edit" button opens builder
  - [ ] Canvas loads with empty state message

- [ ] **Canvas Interactions**
  - [ ] Can drag elements from sidebar
  - [ ] Elements appear on canvas
  - [ ] Can click to select elements
  - [ ] Configuration panel opens

- [ ] **Node Editing**
  - [ ] Panel allows changing label
  - [ ] Can set description
  - [ ] Can save changes
  - [ ] Changes persist

- [ ] **Connections**
  - [ ] Can drag between nodes
  - [ ] Connection lines appear
  - [ ] Connections can be deleted

- [ ] **Save Workflow**
  - [ ] "Save" button works
  - [ ] Backend receives data
  - [ ] Confirmation message shows

---

## Browser DevTools Debugging

### Check Console Errors
```javascript
// In browser console, check for:
console.log('Processes loaded:', window._processData);

// Check API calls in Network tab:
// GET /api/process/catalog?company_name=...
// POST /api/process/save-workflow
```

### React DevTools
1. Install React DevTools extension
2. Check if `ProcessManagement` component is mounted
3. Inspect props being passed
4. Check state changes when editing

---

## Backend Validation

Ensure these API endpoints are implemented:

```python
# Backend/routers/process_builder_enhanced.py

@router.get("/catalog")
async def get_processes(company_name: str, session):
    # Returns list of processes

@router.get("/{process_id}")
async def get_process(process_id: int, company_name: str, session):
    # Returns single process details

@router.post("/catalog")
async def create_process(data: dict, company_name: str, session):
    # Creates new process

@router.put("/catalog/{process_id}")
async def update_process(process_id: int, data: dict, company_name: str, session):
    # Updates process

@router.delete("/catalog/{process_id}")
async def delete_process(process_id: int, company_name: str, session):
    # Deletes process

@router.post("/save-workflow")
async def save_workflow(workflow_data: dict, company_name: str, session):
    # Saves workflow configuration
```

All endpoints should be present and functional. Check `Backend/routers/process_builder_enhanced.py`.

---

## Performance Optimization

For large workflows (100+ nodes), consider:

1. **Lazy loading**: Load nodes on demand
2. **Virtual rendering**: Use React virtualization
3. **Throttle updates**: Debounce save operations
4. **Worker threads**: Process heavy calculations

---

## Next Steps After Integration

1. ✅ Test basic CRUD operations
2. ✅ Create sample processes
3. ✅ Test workflow saving
4. ✅ Verify in production environment
5. ✅ Train users on new features
6. ✅ Monitor for errors in production

---

## Support & Documentation

- **Main Guide**: See `PROCESS_BUILDER_MODERN.md`
- **Backend Setup**: Check `Backend/routers/process_builder_enhanced.py`
- **Testing Guide**: Use `PROCESS_TESTING_CHECKLIST.md`

---

## Version Info

- **React Flow**: v11.11.4+
- **React**: 18.2.0+
- **Node**: 16.0.0+

Last updated: 2024