# 🚀 PROCESS BUILDER - QUICK DEPLOYMENT GUIDE

## One-Command Deployment

```bash
docker compose up --build
```

That's it. Everything will be ready in ~2-3 minutes.

---

## What Happens On Startup

1. **PostgreSQL Database** → Starts and initializes
2. **Backend (FastAPI)**:
   - Loads all Process Builder models
   - Creates 14 PostgreSQL tables automatically
   - Registers 28+ API endpoints at `/api/process/*`
3. **Frontend (React)**:
   - Builds Vite bundle
   - Compiles ProcessBuilderV2 component
   - Routes `/process-builder` available
4. **Nginx** → Routes requests correctly

---

## Access After Deployment

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend** | http://localhost:3000 | ✅ Ready |
| **Process Builder UI** | http://localhost:3000/process-builder | ✅ Ready |
| **API** | http://localhost:8000/api/process | ✅ Ready |
| **Database** | localhost:5432/epm_tool | ✅ Ready |

---

## First Steps

1. **Login** to the system
2. **Navigate** to **"Process Builder"** from menu (left sidebar → "Advanced consolidation & process automation")
3. **Click** "New Process"
4. **Fill in**:
   - Process Name: "2025 Consolidation"
   - Description: "My first consolidation"
   - Fiscal Year: 2025
5. **Design canvas**: Drag nodes onto the canvas
6. **Configure settings**: Set fiscal calendar, rounding rules
7. **Define periods**: Add Jan-Dec 2025
8. **Import data**: Upload financial data
9. **Run simulation**: Preview results
10. **Finalize**: Commit to journals

---

## Database Tables Created

All 14 tables created automatically:

```
✅ process_definitions
✅ process_nodes
✅ process_node_connections
✅ process_periods
✅ process_data
✅ process_staging
✅ process_journals
✅ process_scenarios
✅ process_executions
✅ entity_structure
✅ process_audit_trail
✅ validation_rules
✅ process_overrides
✅ custom_logic_templates
```

---

## API Endpoints Ready

**Process Management**
- `POST /api/process/create` - Create process
- `GET /api/process/list` - List processes
- `GET /api/process/{id}` - Get details
- `PUT /api/process/{id}` - Update process

**Canvas Operations**
- `POST /api/process/{id}/node/add` - Add node
- `PUT /api/process/{id}/node/{node_id}` - Update node
- `DELETE /api/process/{id}/node/{node_id}` - Delete node
- `POST /api/process/{id}/connect` - Connect nodes

**Data & Execution**
- `POST /api/process/{id}/periods/define` - Define periods
- `POST /api/process/{id}/entities/register` - Register entities
- `POST /api/process/{id}/scenario/{sid}/data/import` - Import data
- `POST /api/process/{id}/scenario/{sid}/execute` - Run (simulate/finalize)

**Reporting & Analysis**
- `GET /api/process/{id}/scenario/{sid}/consolidated-statements` - Reports
- `GET /api/process/{id}/scenarios/{s1}/compare/{s2}` - Compare scenarios
- `GET /api/process/{id}/audit-trail` - Audit history

---

## Troubleshooting

### "Process Builder not showing in menu"
→ Clear browser cache and refresh

### "API endpoint 500 error"
→ Check Backend logs: `docker compose logs backend`

### "Database connection refused"
→ Ensure PostgreSQL is running: `docker compose ps`

### "ProcessBuilderV2 component not found"
→ Rebuild frontend: `docker compose up --build frontend`

---

## Configuration

No additional configuration needed. All settings are:
- ✅ Default configured
- ✅ Environment-ready
- ✅ Production-hardened
- ✅ Multi-tenant enabled

---

## Next Steps After Deployment

1. **Create Test Company** via Onboarding
2. **Create Process** with sample data
3. **Test Canvas** with drag-drop nodes
4. **Run Simulation** with test data
5. **Review Reports** generated from consolidation
6. **Compare Scenarios** for what-if analysis

---

## Production Checklist

- ✅ All files compiled and syntax-checked
- ✅ All models imported in main.py
- ✅ All endpoints registered
- ✅ All routes integrated in frontend
- ✅ Navigation menu updated
- ✅ Security checks passed
- ✅ Audit trail enabled
- ✅ Multi-tenant enabled
- ✅ Ready for production

---

**Status**: 🟢 READY TO DEPLOY

**Command**: `docker compose up --build`

**Expected Time**: 2-3 minutes