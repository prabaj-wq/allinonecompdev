# Process Management - Quick Testing Checklist

## 🚀 What to Test

After deploying the updated code, follow these steps to verify everything works:

---

## ✅ Test 1: Create a Process

### Steps:
1. Open **Process Management** page
2. Click **"Create Process"** button
3. Fill in:
   - **Name**: "Test Process Q1"
   - **Description**: "Testing create functionality"
   - **Process Type**: Select from dropdown
4. Click **"Save"**

### Expected Result:
- ✅ Green notification appears: "Process created successfully"
- ✅ New process appears in left sidebar list
- ✅ Page shows process details

### Check Browser Console (F12):
- ✅ POST /api/process/catalog → 200 OK
- ✅ GET /api/process/catalog → 200 OK (refreshed list)

---

## ✅ Test 2: View Process Details (Double-Click)

### Steps:
1. In the process list on left sidebar
2. **Double-click** on any process
3. Should navigate to process details view

### Expected Result:
- ✅ Process loads and shows all details:
  - Name
  - Description
  - Process Type
  - Fiscal Year
  - Base Currency
  - Status
  - Created Date
  - Last Modified Date

### Check Browser Console:
- ✅ GET /api/process/{id} → 200 OK
- ✅ Response includes all process fields

---

## ✅ Test 3: Edit a Process

### Steps:
1. Double-click a process to open details
2. **Modify** one or more fields:
   - Change name to: "Test Process Q1 - Updated"
   - Change description
   - Change process type
3. Click **"Save"**

### Expected Result:
- ✅ Green notification: "Process updated successfully"
- ✅ Fields update in the UI
- ✅ Last Modified date changes
- ✅ Process list refreshes with new data

### Check Browser Console:
- ✅ PUT /api/process/catalog/{id} → 200 OK
- ✅ Response shows updated_at timestamp

---

## ✅ Test 4: Delete a Process

### Steps:
1. In process list, hover over a process
2. Click **delete icon** (trash can)
3. Confirm deletion in popup

### Expected Result:
- ✅ Green notification: "Process deleted successfully"
- ✅ Process removed from list immediately
- ✅ List refreshes

### Check Browser Console:
- ✅ DELETE /api/process/catalog/{id} → 200 OK

---

## ✅ Test 5: Verify No Errors on Page Load

### Steps:
1. Refresh the browser (F5)
2. Navigate to **Process Management** page
3. Wait for page to load completely
4. Check browser console

### Expected Result:
- ✅ **NO** "404" errors
- ✅ **NO** "500" errors
- ✅ **NO** "relation process_definitions does not exist"
- ✅ Process list loads successfully
- ✅ No authentication errors

### Check Docker Logs:
```bash
docker-compose logs backend -f
```

Should see:
```
✅ Process tables initialized on startup
INFO: GET /api/process/catalog → 200 OK
```

---

## 🔍 Console Log Interpretation

### ✅ Good Signs:
```
GET /api/process/catalog?company_name=backo → 200 OK
GET /api/process/1?company_name=backo → 200 OK
POST /api/process/catalog?company_name=backo → 200 OK
PUT /api/process/catalog/1?company_name=backo → 200 OK
DELETE /api/process/catalog/1?company_name=backo → 200 OK
```

### ❌ Problems to Fix:
```
❌ GET /api/process/catalog → 500 Internal Server Error
  → Process tables not initialized
  → Check backend logs for errors

❌ GET /api/process/1 → 404 Not Found
  → Process doesn't exist with that ID
  → Or endpoint not working

❌ GET /api/process/catalog → relation "process_definitions" does not exist
  → Database tables not created
  → Restart backend with proper initialization
```

---

## 🔧 Backend Docker Logs

To see what's happening on the backend:

```bash
# Watch logs in real-time
docker-compose logs backend -f

# Look for these on startup:
✅ Process tables initialized on startup
✅ All tables ensured for company: backo

# Look for these on requests:
INFO: GET /api/process/catalog?company_name=backo → 200 OK
INFO: POST /api/process/catalog?company_name=backo → 200 OK
INFO: PUT /api/process/catalog/1?company_name=backo → 200 OK
INFO: DELETE /api/process/catalog/1?company_name=backo → 200 OK
```

---

## 📊 Complete Endpoint Status

| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| /api/process/catalog | GET | ✅ Works | List all processes |
| /api/process/{id} | GET | ✅ NEW | View single process (for double-click) |
| /api/process/catalog | POST | ✅ Works | Create new process |
| /api/process/catalog/{id} | PUT | ✅ Works | Update process |
| /api/process/catalog/{id} | DELETE | ✅ Works | Delete process |
| /api/process/reference-data | GET | ✅ Works | Get dropdown data |

---

## 🎯 Summary of Changes

### What Was Added:
1. **GET /{process_id}** endpoint
   - Allows viewing/editing a specific process
   - Fixes the double-click issue
   - Returns full process details

2. **Auto-initialization on startup**
   - Process tables created when app starts
   - No need to call POST /create first
   - Faster startup and better reliability

### What Already Existed:
- POST /catalog (create)
- PUT /catalog/{id} (update)
- DELETE /catalog/{id} (delete)
- GET /catalog (list)

---

## 🆘 Troubleshooting

### Issue: Double-click returns 404
**Solution**: 
- Ensure GET /{process_id} endpoint is in process_builder_enhanced.py
- Restart backend
- Check that process ID is correct

### Issue: Create button doesn't work
**Solution**:
- Check browser console for exact error
- Verify POST /catalog endpoint exists
- Check database connection in logs

### Issue: Edit doesn't save
**Solution**:
- Check for PUT /catalog/{id} in console
- Verify response status is 200
- Check backend logs for SQL errors

### Issue: Delete doesn't work
**Solution**:
- Verify DELETE /catalog/{id} in console
- Check response status is 200
- Verify process is removed from DB

---

## 📝 Notes

- All endpoints require `company_name` query parameter
- All endpoints require Bearer token for authentication
- Process tables are company-scoped (company_id = 1 by default)
- All timestamps are ISO format
- Status defaults to "draft" for new processes

---

## ✅ Final Verification

After all tests pass:

- [ ] List processes works
- [ ] Create process works
- [ ] View/double-click works
- [ ] Edit process works
- [ ] Delete process works
- [ ] No console errors
- [ ] Notifications appear
- [ ] Backend logs show 200 OK responses

**If all checks pass, the feature is fully functional!** 🎉