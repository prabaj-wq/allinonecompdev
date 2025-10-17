# Process Management Fix - Testing Guide

## What Was Fixed

Three new API endpoints were added to `Backend/routers/process_builder_enhanced.py`:

1. **POST `/api/process/catalog`** - Create a new process
2. **PUT `/api/process/catalog/{id}`** - Update an existing process  
3. **DELETE `/api/process/catalog/{id}`** - Delete a process

These endpoints now match what the Frontend (Process.jsx) expects when users:
- Click "Create Process"
- Edit a process
- Delete a process

## How to Test

### Step 1: Start the Backend
```bash
# Navigate to Backend directory
cd Backend

# Start the FastAPI server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Start the Frontend
```bash
# In a new terminal, navigate to Frontend directory
cd Frontend

# Start the development server
npm run dev
```

### Step 3: Test CREATE Process
1. Open browser and navigate to the Process Management page
2. Click "Create Process" button
3. Fill in:
   - Process Name: "Test Process"
   - Description: "Testing the create endpoint"
   - Process Type: Select any type from dropdown
4. Click "Save"
5. **Expected Result**: 
   - Success notification appears
   - Process appears in the list on the left

**What's Happening Behind the Scenes**:
- Frontend sends: `POST /api/process/catalog?company_name=CompanyName`
- Backend receives and saves to `process_definitions` table
- Returns: `{ "success": true, "process": { "id": 123, "created_at": "2024-01-15T..." } }`

### Step 4: Test UPDATE Process
1. Click the edit icon (pencil) on any process in the list
2. Modify the name or description
3. Click "Save"
4. **Expected Result**:
   - Success notification appears
   - Process list updates with new data

**What's Happening Behind the Scenes**:
- Frontend sends: `PUT /api/process/catalog/123?company_name=CompanyName`
- Backend updates the record
- Returns: `{ "success": true, "process": { "id": 123, "updated_at": "..." } }`

### Step 5: Test DELETE Process
1. Click the delete icon (trash) on any non-default process
2. Confirm the deletion
3. **Expected Result**:
   - Process is removed from the list
   - Success notification appears

**What's Happening Behind the Scenes**:
- Frontend sends: `DELETE /api/process/catalog/123?company_name=CompanyName`
- Backend deletes from database
- Returns: `{ "success": true, "message": "Process deleted successfully" }`

## Browser Console Checks

During testing, check the browser's Developer Console (F12):

### ✅ Good Signs
- GET requests to `/api/process/catalog` return 200 (list)
- POST requests to `/api/process/catalog` return 200 (create)
- PUT requests to `/api/process/catalog/{id}` return 200 (update)
- DELETE requests to `/api/process/catalog/{id}` return 200 (delete)
- No "Not authenticated" errors

### ❌ Issues to Fix If You See Them
- **404 errors**: Check that the backend is running and endpoints exist
- **401 errors**: Check authentication token is valid
- **400 errors**: Check request body format matches expected schema
- **500 errors**: Check backend logs for detailed error messages

## Endpoint Details

### Request/Response Examples

#### CREATE
```bash
curl -X POST http://localhost:8000/api/process/catalog?company_name=MyCompany \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "New Process",
    "description": "Test process",
    "process_type": "Consolidation"
  }'
```

Response:
```json
{
  "success": true,
  "process": {
    "id": 42,
    "created_at": "2024-01-15T10:30:00"
  }
}
```

#### UPDATE
```bash
curl -X PUT http://localhost:8000/api/process/catalog/42?company_name=MyCompany \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Name",
    "description": "Updated description",
    "process_type": "Consolidation"
  }'
```

Response:
```json
{
  "success": true,
  "process": {
    "id": 42,
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T11:45:00"
  }
}
```

#### DELETE
```bash
curl -X DELETE http://localhost:8000/api/process/catalog/42?company_name=MyCompany \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "message": "Process deleted successfully"
}
```

#### LIST (Already Existed)
```bash
curl -X GET http://localhost:8000/api/process/catalog?company_name=MyCompany \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "processes": [
    {
      "id": 1,
      "name": "Default Process",
      "description": "Main consolidation",
      "process_type": "Consolidation",
      "fiscal_year": 2024,
      "base_currency": "USD",
      "status": "draft",
      "created_at": "2024-01-10T09:00:00"
    }
  ]
}
```

## Troubleshooting

### Issue: "Process not found" when updating
- Check that the process ID is correct
- Verify the company_name matches the process's company

### Issue: "Not authenticated" errors
- Ensure you're logged in with proper permissions
- Check that auth token is being sent in headers
- Verify token hasn't expired

### Issue: Database errors
- Ensure PostgreSQL is running
- Check database credentials in .env
- Verify process_definitions table exists

### Issue: CORS errors
- Verify frontend URL is in CORS whitelist in main.py
- Check that credentials: 'include' is set in fetch requests

## Files Modified

- `Backend/routers/process_builder_enhanced.py`
  - Added POST /catalog endpoint (lines 517-575)
  - Added PUT /catalog/{process_id} endpoint (lines 577-633)
  - Added DELETE /catalog/{process_id} endpoint (lines 635-668)

## Files NOT Modified (Deprecated)

These files are NOT used and can be safely deleted if desired:
- `Backend/routers/_deprecated/process.py.bak`
- `Backend/routers/_deprecated/process_builder.py.bak`
- `Backend/routers/_deprecated/process_builder_v2.py.bak`

## Next Steps

After testing, verify that:
- [ ] All three CRUD operations work
- [ ] Browser console shows no errors
- [ ] Notification messages appear correctly
- [ ] Process list updates after each operation
- [ ] No authentication/authorization issues

If everything works, the Process Management feature is now fully functional!