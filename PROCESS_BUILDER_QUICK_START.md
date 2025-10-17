# 🚀 Process Builder - Quick Start Guide

## ⏱️ 5-Minute Setup

### Step 1: Update Route (30 seconds)

**File**: `Frontend/src/components/TwoFactorWrapper.jsx`

```jsx
// Line ~12 - Add this import:
import ProcessManagement from '../pages/ProcessManagement'

// Line ~125 - Change this:
// FROM:
<Route path="/process" element={<Process />} />

// TO:
<Route path="/process" element={<ProcessManagement />} />
```

### Step 2: Start Frontend (3 minutes)

```bash
cd Frontend
npm start
```

### Step 3: Test (2 minutes)

1. Go to http://localhost:5173/process
2. Click "New Process"
3. Fill form and create
4. Click "Edit"
5. Drag element from left sidebar
6. Drop on canvas
7. See the magic! ✨

---

## 🎮 How to Use

### Create a Process
```
1. Click [+ New Process]
2. Enter:
   - Process Name: "Monthly Consolidation"
   - Description: Optional
   - Process Type: Consolidation
   - Fiscal Year: 2024
3. Click [Create Process]
```

### Open the Builder
```
1. Click [Edit] button on any process
2. Modern interactive canvas opens
```

### Add Nodes
```
Option A - Click:
  Click any element in the sidebar → appears on canvas

Option B - Drag:
  Click & hold element → drag to canvas → release
```

### Connect Nodes
```
1. Hover over a node to see connection points
2. Click and drag from RIGHT side (output)
3. Drag to LEFT side (input) of another node
4. Release to create connection
```

### Edit Node
```
1. Click any node on canvas
2. Right panel opens
3. Edit: Label, Description, Category, etc.
4. Click [Save Changes]
5. Or click [Delete Node] to remove
```

### Save Workflow
```
Click [Save] button in toolbar
Wait for confirmation message
Changes saved to backend
```

---

## 🎨 Node Types (Drag These!)

| Color | Type | Purpose |
|-------|------|---------|
| 🟢 Green | Start | Begin workflow |
| 🔴 Red | End | Finish workflow |
| 🔵 Blue | Process | Do work |
| 🟡 Yellow | Decision | Branch logic |
| 🟣 Purple | Data | Load/query data |
| 🟦 Indigo | Approval | Get sign-off |
| 🟠 Orange | Document | Generate docs |
| 🔵 Cyan | Notification | Send alerts |
| 🟢 Emerald | Report | Create reports |
| 🩷 Fuchsia | Assignment | Assign tasks |

---

## 📋 Example Workflow

### Monthly Close (Copy This!)

```
[Start]
   ↓
[Receive Trial Balance] (Data node)
   ↓
[Calculate Adjustments] (Process node)
   ↓
[Review & Approve] (Approval node)
   ├─→ Approved
   │    ↓
   │  [Post Journals] (Process node)
   │    ↓
   │  [Generate Report] (Report node)
   │    ↓
   │  [End]
   │
   └─→ Rejected
       ↓
     [Revise] (Assignment node)
       ↓
     [Re-review] (Approval node)
     (loops back to Post Journals on approval)
```

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Delete selected node | Delete key |
| Duplicate node | Ctrl+D (coming soon) |
| Save | Ctrl+S (coming soon) |
| Undo | Ctrl+Z (via React Flow) |
| Redo | Ctrl+Y (via React Flow) |
| Zoom in | Scroll up |
| Zoom out | Scroll down |
| Pan | Click + drag on canvas |

---

## 🔧 Toolbar Buttons

| Button | Action |
|--------|--------|
| ⚙️ | Center view |
| 📋 | Duplicate selected node |
| 🗑️ | Delete selected node |
| 💾 | Save workflow |
| ❌ | Delete entire process |

---

## 💡 Tips & Tricks

### Tip 1: Use Descriptive Labels
✅ "Validate GL Data" 
❌ "Validate"

### Tip 2: Always Start & End
✅ Every workflow should have Start → ... → End
❌ Missing start or end nodes

### Tip 3: Fill Descriptions
Use the description field to explain what each node does

### Tip 4: Set Categories
Choose appropriate categories for quick visual organization

### Tip 5: Configure Approval Nodes
Always set assignee and time limit for approval steps

---

## 🚨 Troubleshooting

### Problem: Nodes won't appear when dragged
**Solution**: Try clicking the element in the sidebar instead

### Problem: Can't connect nodes
**Solution**: 
- Drag from RIGHT port (output)
- To LEFT port (input)
- Wait for connection line to appear

### Problem: Changes not saving
**Solution**:
- Click the [Save] button explicitly
- Check browser console for errors
- Verify internet connection

### Problem: Builder looks broken (missing styles)
**Solution**: Refresh the page (Ctrl+R)

### Problem: Can't click nodes
**Solution**: Make sure they're not selected. Click empty canvas first, then click node

---

## 📊 What Gets Saved?

When you click [Save], this data goes to the backend:

```
✓ Node positions
✓ Node labels & descriptions
✓ Node configurations
✓ All connections between nodes
✓ Node types (Start, Process, Decision, etc.)
✓ Timestamp
✓ Process ID
```

All of this can be edited later!

---

## 🎯 Common Workflows

### Close/Consolidation Process
```
Start → Load TB → Calculate Adj → Post → Report → End
```

### Approval Workflow
```
Start → Prepare → Approve → Yes → Execute → End
                     ↓
                    No → Reject → End
```

### Data Pipeline
```
Start → Extract → Transform → Load → Validate → End
```

### Report Generation
```
Start → Collect Data → Calculate → Generate PDF → Email → End
```

---

## 📱 Mobile Usage

| Screen Size | Support |
|---|---|
| Desktop (1920+) | ✅ Full featured |
| Tablet (768-1024) | ✅ Good |
| Mobile (320-767) | ⚠️ Basic (sidebar collapses) |

**Mobile Tip**: Collapse the left sidebar to see more canvas space

---

## 📞 Quick Help

**Something not working?**

1. Check browser console (F12)
2. Look for red error messages
3. Try refreshing the page
4. Check your internet connection
5. Read `PROCESS_BUILDER_MODERN.md` for detailed help

**Want more features?**

- Multi-user collaboration (coming soon)
- Workflow templates (coming soon)
- Process versioning (coming soon)
- Export/import workflows (coming soon)

---

## ✅ Validation Rules

Before you save, make sure:

- [ ] Process has a name
- [ ] Workflow has at least Start and End
- [ ] All nodes have labels
- [ ] All connections make sense
- [ ] No broken/incomplete connections

---

## 🔐 Who Can Access?

✅ Authenticated users with Process permission
✅ Your current company
❌ Other users' processes
❌ If not authenticated

---

## 📊 What Happens When I Save?

```
Click [Save]
   ↓
Workflow data collected
   ↓
Sent to backend /api/process/save-workflow
   ↓
Backend validates
   ↓
Database updated
   ↓
Success message shown
   ↓
You can navigate away safely
```

---

## 🎓 Learning Path

**Beginner** (5 min)
- [ ] Read this quick start
- [ ] Create first process
- [ ] Add 3 nodes (Start, Process, End)
- [ ] Connect them
- [ ] Save

**Intermediate** (15 min)
- [ ] Add Decision nodes
- [ ] Create branches
- [ ] Edit all node properties
- [ ] Practice complex workflows
- [ ] Test save/load

**Advanced** (30 min)
- [ ] Create realistic workflows
- [ ] Configure approval steps
- [ ] Set up error handling paths
- [ ] Optimize layout
- [ ] Document processes

---

## 🎉 Ready to Build?

1. ✅ Update route (copy-paste from Step 1 above)
2. ✅ Start frontend (`npm start`)
3. ✅ Go to `/process` in browser
4. ✅ Create your first process
5. ✅ Open the builder
6. ✅ Build your first workflow
7. ✅ Click Save
8. ✅ Celebrate! 🎊

---

## 📚 More Info

For detailed information, see:
- **Full Guide**: `PROCESS_BUILDER_MODERN.md`
- **Integration**: `PROCESS_BUILDER_INTEGRATION.md`
- **Technical Summary**: `PROCESS_BUILDER_SUMMARY.md`

---

**That's it!** You're ready to use the modern Process Builder. Enjoy! 🚀

*Last updated: 2024*