import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { useForm } from 'react-hook-form'
import { ChromePicker } from 'react-color'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
// Remove CSS imports to use Theming API instead
// import 'ag-grid-community/styles/ag-grid.css'
// import 'ag-grid-community/styles/ag-theme-alpine.css'
import './CustomReportDesigner.css'

// Register AgGrid modules
ModuleRegistry.registerModules([AllCommunityModule])

// Debug: Log that component is being imported
console.log('CustomReportDesigner: Component imported successfully!')

// Icons
import { 
  Database, 
  Settings, 
  Save, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff,
  Calculator,
  Filter,
  Palette,
  FileText,
  BarChart3,
  Building2,
  DollarSign,
  Percent,
  Calendar,
  User,
  Tag,
  Bookmark,
  MessageSquare,
  Paperclip,
  Search,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  Globe,
  RefreshCw,
  TrendingUp,
  PieChart,
  Activity,
  Target,
  Award,
  Star,
  Heart,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  ArrowLeft,
  X
} from 'lucide-react'

const CustomReportDesigner = ({ report, onSave, onCancel }) => {
  console.log('CustomReportDesigner: Component rendering with props:', { report, onSave, onCancel })
  
  const gridRef = useRef()
  const [gridApi, setGridApi] = useState(null)
  const [columnApi, setColumnApi] = useState(null)
  const [rowData, setRowData] = useState([])
  const [columnDefs, setColumnDefs] = useState([])
  const [selectedCell, setSelectedCell] = useState(null)
  const [showHierarchyPanel, setShowHierarchyPanel] = useState(true)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true)
  const [showFormulaEditor, setShowFormulaEditor] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [hierarchyData, setHierarchyData] = useState([])
  const [formulaEditorValue, setFormulaEditorValue] = useState('')
  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [notes, setNotes] = useState({})
  const [conditionalFormats, setConditionalFormats] = useState({})
  const [filters, setFilters] = useState({})
  const [isLive, setIsLive] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Form handling
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: report?.name || 'Custom Report',
      description: report?.description || '',
      category: report?.category || 'Financial',
      isPublic: report?.isPublic || false
    }
  })

  // Initialize grid with sample data
  useEffect(() => {
    if (!isInitialized) {
      console.log('CustomReportDesigner: Initializing grid...')
      initializeGrid()
      loadHierarchyData()
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Force grid refresh when rowData changes
  useEffect(() => {
    if (gridApi && rowData.length > 0) {
      console.log('CustomReportDesigner: Updating grid with new data...', rowData.length, 'rows')
      gridApi.setGridOption('rowData', rowData)
    }
  }, [rowData, gridApi])

  // Ensure data is always available (but only once)
  useEffect(() => {
    if (rowData.length === 0 && columnDefs.length === 0 && isInitialized) {
      console.log('CustomReportDesigner: No data detected, re-initializing...')
      initializeGrid()
    }
  }, [rowData.length, columnDefs.length, isInitialized])

  const initializeGrid = () => {
    console.log('CustomReportDesigner: Setting up initial columns and data...')
    const initialColumns = [
      { 
        field: 'accountCode', 
        headerName: 'Account Code', 
        width: 100, 
        pinned: 'left',
        cellStyle: { 
          fontWeight: '600',
          padding: '12px 16px',
          fontSize: '13px',
          textAlign: 'left',
          borderRight: '2px solid #d1d5db'
        },
        headerClass: 'ag-header-cell-custom',
        suppressMenu: true,
        sortable: false
      },
      { 
        field: 'accountName', 
        headerName: 'Account Name', 
        width: 280, 
        pinned: 'left',
        cellStyle: { 
          fontWeight: '500',
          padding: '12px 16px',
          fontSize: '13px',
          textAlign: 'left',
          borderRight: '2px solid #d1d5db'
        },
        headerClass: 'ag-header-cell-custom',
        suppressMenu: true,
        sortable: false
      },
      { 
        field: 'currentYear', 
        headerName: 'Current Year', 
        width: 150, 
        type: 'numericColumn',
        cellStyle: { 
          textAlign: 'right',
          padding: '12px 16px',
          fontSize: '13px',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontWeight: '500'
        },
        valueFormatter: (params) => {
          if (params.value && typeof params.value === 'number') {
            return `$${params.value.toLocaleString()}`
          }
          return params.value || ''
        },
        headerClass: 'ag-header-cell-custom',
        suppressMenu: true,
        sortable: false
      },
      { 
        field: 'previousYear', 
        headerName: 'Previous Year', 
        width: 150, 
        type: 'numericColumn',
        cellStyle: { 
          textAlign: 'right',
          padding: '12px 16px',
          fontSize: '13px',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontWeight: '500'
        },
        valueFormatter: (params) => {
          if (params.value && typeof params.value === 'number') {
            return `$${params.value.toLocaleString()}`
          }
          return params.value || ''
        },
        headerClass: 'ag-header-cell-custom',
        suppressMenu: true,
        sortable: false
      },
      { 
        field: 'variance', 
        headerName: 'Variance', 
        width: 110, 
        type: 'numericColumn',
        cellStyle: { 
          textAlign: 'right',
          padding: '12px 16px',
          fontSize: '13px',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontWeight: '500'
        },
        valueFormatter: (params) => {
          if (params.value && typeof params.value === 'number') {
            return `${params.value > 0 ? '+' : ''}${params.value.toFixed(1)}%`
          }
          return ''
        },
        headerClass: 'ag-header-cell-custom',
        suppressMenu: true,
        sortable: false
      },
      { 
        field: 'notes', 
        headerName: 'Notes', 
        width: 160,
        cellStyle: {
          padding: '12px 16px',
          fontSize: '13px',
          textAlign: 'left'
        },
        cellRenderer: (params) => {
          const note = notes[params.node.id]
          return note ? (
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <span className="text-xs text-gray-600 truncate">{note.substring(0, 20)}...</span>
            </div>
          ) : null
        },
        headerClass: 'ag-header-cell-custom',
        suppressMenu: true,
        sortable: false
      }
    ]

    const initialData = [
      {
        id: '1',
        accountCode: '1000',
        accountName: 'CASH AND CASH EQUIVALENTS',
        currentYear: 1500000,
        previousYear: 1200000,
        variance: 25.0,
        level: 0,
        isGroup: true
      },
      {
        id: '1-1',
        accountCode: '1100',
        accountName: '  Cash on Hand',
        currentYear: 500000,
        previousYear: 400000,
        variance: 25.0,
        level: 1,
        isGroup: false
      },
      {
        id: '1-2',
        accountCode: '1200',
        accountName: '  Bank Accounts',
        currentYear: 1000000,
        previousYear: 800000,
        variance: 25.0,
        level: 1,
        isGroup: false
      },
      {
        id: '2',
        accountCode: '2000',
        accountName: 'ACCOUNTS RECEIVABLE',
        currentYear: 2500000,
        previousYear: 2200000,
        variance: 13.6,
        level: 0,
        isGroup: true
      },
      {
        id: '2-1',
        accountCode: '2100',
        accountName: '  Trade Receivables',
        currentYear: 2000000,
        previousYear: 1800000,
        variance: 11.1,
        level: 1,
        isGroup: false
      },
      {
        id: '2-2',
        accountCode: '2200',
        accountName: '  Other Receivables',
        currentYear: 500000,
        previousYear: 400000,
        variance: 25.0,
        level: 1,
        isGroup: false
      },
      {
        id: '3',
        accountCode: '3000',
        accountName: 'INVENTORY',
        currentYear: 1800000,
        previousYear: 1600000,
        variance: 12.5,
        level: 0,
        isGroup: true
      },
      {
        id: '3-1',
        accountCode: '3100',
        accountName: '  Raw Materials',
        currentYear: 800000,
        previousYear: 700000,
        variance: 14.3,
        level: 1,
        isGroup: false
      },
      {
        id: '3-2',
        accountCode: '3200',
        accountName: '  Finished Goods',
        currentYear: 1000000,
        previousYear: 900000,
        variance: 11.1,
        level: 1,
        isGroup: false
      },
      {
        id: '4',
        accountCode: '4000',
        accountName: 'TOTAL CURRENT ASSETS',
        currentYear: 5800000,
        previousYear: 5000000,
        variance: 16.0,
        level: 0,
        isGroup: true
      }
    ]

    console.log('CustomReportDesigner: Setting column definitions and row data...', { columns: initialColumns.length, rows: initialData.length })
    setColumnDefs(initialColumns)
    setRowData(initialData)
    console.log('CustomReportDesigner: Grid initialization complete!')
  }

  const loadHierarchyData = async () => {
    try {
      // Load entity hierarchy
      const entityResponse = await fetch('/api/entities', {
        credentials: 'include'
      })
      
      // Load account hierarchy
      const accountResponse = await fetch('/api/ifrs-accounts', {
        credentials: 'include'
      })
      
      if (entityResponse.ok && accountResponse.ok) {
        const entities = await entityResponse.json()
        const accounts = await accountResponse.json()
        
        setHierarchyData([
          {
            id: 'entities',
            name: 'Business Entities',
            type: 'folder',
            icon: Building2,
            children: entities.map(entity => ({
              id: `entity_${entity.id}`,
              name: entity.name,
              type: 'entity',
              icon: Building2,
              data: entity
            }))
          },
          {
            id: 'accounts',
            name: 'Chart of Accounts',
            type: 'folder',
            icon: Calculator,
            children: accounts.map(account => ({
              id: `account_${account.id}`,
              name: account.name,
              type: 'account',
              icon: Calculator,
              data: account
            }))
          },
          {
            id: 'financial_statements',
            name: 'Financial Statements',
            type: 'folder',
            icon: BarChart3,
            children: [
              { id: 'bs', name: 'Balance Sheet', type: 'statement', icon: BarChart3 },
              { id: 'pl', name: 'Profit & Loss', type: 'statement', icon: TrendingUp },
              { id: 'cf', name: 'Cash Flow', type: 'statement', icon: Activity }
            ]
          }
        ])
      }
    } catch (err) {
      console.error('Error loading hierarchy data:', err)
      // Set fallback data
      setHierarchyData([
        {
          id: 'entities',
          name: 'Business Entities',
          type: 'folder',
          icon: Building2,
          children: [
            { id: 'entity_1', name: 'Parent Company', type: 'entity', icon: Building2, data: { code: 'PC001' } },
            { id: 'entity_2', name: 'Subsidiary A', type: 'entity', icon: Building2, data: { code: 'SA001' } },
            { id: 'entity_3', name: 'Subsidiary B', type: 'entity', icon: Building2, data: { code: 'SB001' } }
          ]
        },
        {
          id: 'accounts',
          name: 'IFRS Accounts',
          type: 'folder',
          icon: Calculator,
          children: [
            { id: 'account_1', name: 'Cash and Cash Equivalents', type: 'account', icon: Calculator, data: { code: '1000' } },
            { id: 'account_2', name: 'Trade Receivables', type: 'account', icon: Calculator, data: { code: '2000' } },
            { id: 'account_3', name: 'Inventories', type: 'account', icon: Calculator, data: { code: '3000' } },
            { id: 'account_4', name: 'Property, Plant & Equipment', type: 'account', icon: Calculator, data: { code: '4000' } },
            { id: 'account_5', name: 'Trade Payables', type: 'account', icon: Calculator, data: { code: '5000' } },
            { id: 'account_6', name: 'Borrowings', type: 'account', icon: Calculator, data: { code: '6000' } }
          ]
        },
        {
          id: 'financial_statements',
          name: 'Financial Statements',
          type: 'folder',
          icon: BarChart3,
          children: [
            { id: 'bs', name: 'Balance Sheet', type: 'statement', icon: BarChart3 },
            { id: 'pl', name: 'Profit & Loss', type: 'statement', icon: TrendingUp },
            { id: 'cf', name: 'Cash Flow', type: 'statement', icon: Activity }
          ]
        }
      ])
    }
  }

  const onGridReady = (params) => {
    console.log('CustomReportDesigner: Grid is ready!', { rowDataLength: rowData.length })
    setGridApi(params.api)
    setColumnApi(params.columnApi)
    
    // Ensure data is loaded when grid is ready
    if (rowData.length > 0) {
      console.log('CustomReportDesigner: Setting row data in grid...', rowData)
      // Use the correct method for setting data
      params.api.setGridOption('rowData', rowData)
      console.log('CustomReportDesigner: ✅ Grid data loaded successfully!')
    } else {
      console.log('CustomReportDesigner: No row data available yet, will set when available')
    }
  }

  const onCellClicked = (params) => {
    setSelectedCell({
      rowIndex: params.rowIndex,
      column: params.column,
      value: params.value,
      data: params.data
    })
  }

  const onCellValueChanged = (params) => {
    // Handle live data updates
    if (isLive) {
      // Update backend data
      updateBackendData(params.data)
    }
  }

  const updateBackendData = async (data) => {
    try {
      await fetch(`/api/reports/${report?.id}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })
    } catch (err) {
      console.error('Error updating data:', err)
    }
  }

  const handleDragFromHierarchy = (draggedItem, targetRow = null, targetCol = null) => {
    if (gridApi && selectedCell) {
      const rowIndex = targetRow !== null ? targetRow : selectedCell.rowIndex
      
      // Insert the dragged item into the target row
      const newRow = {
        id: `new_${Date.now()}`,
        accountCode: draggedItem.data?.code || '',
        accountName: draggedItem.name,
        currentYear: 0,
        previousYear: 0,
        variance: 0,
        level: 0,
        isGroup: false,
        isDragged: true
      }
      
      // Insert row at the target position
      const updatedData = [...rowData]
      updatedData.splice(rowIndex + 1, 0, newRow)
      setRowData(updatedData)
      
      // Update grid with new data
      if (gridApi) {
        gridApi.setGridOption('rowData', updatedData)
      }
      
      // If it's a parent item with children, add them as nested rows
      if (draggedItem.children) {
        draggedItem.children.forEach((child, index) => {
          const childRow = {
            id: `child_${Date.now()}_${index}`,
            accountCode: child.data?.code || '',
            accountName: `  ${child.name}`,
            currentYear: 0,
            previousYear: 0,
            variance: 0,
            level: 1,
            isGroup: false,
            isDragged: true
          }
          updatedData.splice(rowIndex + 2 + index, 0, childRow)
        })
        setRowData(updatedData)
        
        // Update grid with all new data
        if (gridApi) {
          gridApi.setGridOption('rowData', updatedData)
        }
      }
    }
  }

  const addCustomRow = () => {
    const newRow = {
      id: `custom_${Date.now()}`,
      accountCode: '',
      accountName: 'Custom Row',
      currentYear: 0,
      previousYear: 0,
      variance: 0,
      level: 0,
      isGroup: false,
      isCustom: true
    }
    
    const updatedData = [...rowData, newRow]
    setRowData(updatedData)
    
    // Update grid with new data
    if (gridApi) {
      gridApi.setGridOption('rowData', updatedData)
    }
  }

  const deleteRow = () => {
    if (selectedCell && gridApi) {
      const updatedData = rowData.filter((_, index) => index !== selectedCell.rowIndex)
      setRowData(updatedData)
      setSelectedCell(null)
      
      // Update grid with new data
      gridApi.setGridOption('rowData', updatedData)
    }
  }

  const addFormula = () => {
    if (selectedCell) {
      setFormulaEditorValue('=SUM(')
      setShowFormulaEditor(true)
    }
  }

  const saveFormula = (formula) => {
    if (selectedCell && gridApi) {
      // Apply formula to selected cell
      const updatedData = [...rowData]
      updatedData[selectedCell.rowIndex][selectedCell.column.getColId()] = formula
      setRowData(updatedData)
      setShowFormulaEditor(false)
      
      // Update grid with new data
      gridApi.setGridOption('rowData', updatedData)
    }
  }

  const addNote = () => {
    if (selectedCell) {
      const note = prompt('Enter note:')
      if (note) {
        setNotes(prev => ({
          ...prev,
          [selectedCell.data.id]: note
        }))
      }
    }
  }

  const applyConditionalFormat = (condition, color) => {
    if (selectedCell) {
      setConditionalFormats(prev => ({
        ...prev,
        [selectedCell.data.id]: { condition, color }
      }))
    }
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rowData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Custom Report')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(data, `${watch('name') || 'Custom Report'}.xlsx`)
  }

  const exportToPDF = () => {
    // Implement PDF export
    console.log('PDF export functionality')
  }

  const importFromExcel = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        setRowData(jsonData)
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const renderHierarchyPanel = () => (
    <div className="h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
              <Database className="h-3 w-3 mr-1.5 text-blue-600" />
              IFRS Data Sources
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Drag & drop to build your report
            </p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={loadHierarchyData}
              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className={`font-medium ${isLive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
            {isLive ? 'Live Data Connected' : 'Offline Mode'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-4">
          {hierarchyData.length > 0 ? hierarchyData.map((category) => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                    <category.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{category.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.children.length} items
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </div>
              
              <div className="ml-4 space-y-2">
                {category.children.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(item))
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    className="group flex items-center space-x-2 p-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md cursor-move transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm"
                  >
                    <div className="flex-shrink-0">
                      <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-sm">
                        <item.icon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate text-xs">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.type === 'entity' ? 'Entity' : 
                         item.type === 'account' ? 'IFRS Account' : 
                         item.type === 'statement' ? 'Statement' : 'Data'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading data sources...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderPropertiesPanel = () => (
    <div className="h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-l border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="h-5 w-5 mr-2 text-purple-600" />
            Cell Properties
          </h3>
          {selectedCell && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Active</span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedCell ? `Row ${selectedCell.rowIndex + 1}, Column ${selectedCell.column.getColId()}` : 'Select a cell to edit its properties'}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {selectedCell ? (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <Edit className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Cell Value</h4>
                </div>
                <input
                  type="text"
                  value={selectedCell.value || ''}
                  onChange={(e) => {
                    if (gridApi) {
                      gridApi.setValue(selectedCell.column, selectedCell.rowIndex, e.target.value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Enter cell value..."
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Advanced</h4>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={addFormula}
                    className="w-full flex items-center justify-between p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-md transition-all"
                  >
                    <span>Add Formula</span>
                    <Calculator className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={addNote}
                    className="w-full flex items-center justify-between p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                  >
                    <span>Add Note</span>
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-full flex items-center justify-between p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-md transition-all"
                  >
                    <span>Color Formatting</span>
                    <Palette className="h-4 w-4" />
                  </button>
                  
                  {showColorPicker && (
                    <div className="mt-3">
                      <ChromePicker
                        color={selectedColor}
                        onChange={(color) => setSelectedColor(color.hex)}
                        onChangeComplete={(color) => {
                          applyConditionalFormat('custom', color.hex)
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-20"></div>
                <BarChart3 className="relative mx-auto h-16 w-16 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                No Cell Selected
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Click on any cell in the grid to view and edit its properties, formatting, and advanced options.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderFormulaEditor = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Formula Editor</h3>
          <button
            onClick={() => setShowFormulaEditor(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formula
            </label>
            <input
              type="text"
              value={formulaEditorValue}
              onChange={(e) => setFormulaEditorValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="=SUM(A1:A10)"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => saveFormula(formulaEditorValue)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Formula
            </button>
            <button
              onClick={() => setShowFormulaEditor(false)}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <input
                {...register('name')}
                className="text-xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="Enter report name"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Live Custom Report Designer
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isLive ? 'Live' : 'Offline'}
              </span>
            </div>
            
            <button
              onClick={exportToExcel}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            
            <label className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Import</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={importFromExcel}
                className="hidden"
              />
            </label>
            
            <button
              onClick={onCancel}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit(onSave)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Hierarchy */}
        <div className={`${showHierarchyPanel ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden`}>
          {showHierarchyPanel && renderHierarchyPanel()}
        </div>

        {/* Main Grid Area */}
        <div className="flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
          {/* Toolbar */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={addCustomRow}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Row</span>
                </button>
                
                <button
                  onClick={deleteRow}
                  disabled={!selectedCell}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete Row</span>
                </button>
                
                <button
                  onClick={addFormula}
                  disabled={!selectedCell}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calculator className="h-3 w-3" />
                  <span>Add Formula</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLive(!isLive)}
                  className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-md transition-colors ${
                    isLive 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-white' : 'bg-gray-500'}`}></div>
                  <span>{isLive ? 'Live Mode' : 'Offline Mode'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid Container */}
          <div className="flex-1 p-3" style={{ overflow: 'hidden', minHeight: '700px' }}>
            <div 
              className="ag-theme-quartz h-full w-full rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white"
              style={{ height: '100%', minHeight: '700px' }}
              onDrop={(e) => {
                e.preventDefault()
                const dragData = e.dataTransfer.getData('application/json')
                if (dragData) {
                  try {
                    const draggedItem = JSON.parse(dragData)
                    handleDragFromHierarchy(draggedItem)
                  } catch (err) {
                    console.error('Error parsing drag data:', err)
                  }
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
              }}
            >
              {(() => {
                console.log('CustomReportDesigner: Rendering grid section...', { 
                  rowDataLength: rowData.length, 
                  columnDefsLength: columnDefs.length,
                  hasGridApi: !!gridApi 
                })
                
                if (rowData.length > 0 && columnDefs.length > 0) {
                  return (
                    <div className="h-full w-full">
                      <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        onGridReady={onGridReady}
                        onCellClicked={onCellClicked}
                        onCellValueChanged={onCellValueChanged}
                        defaultColDef={{
                          resizable: true,
                          sortable: false,
                          filter: false,
                          editable: true,
                          minWidth: 100,
                          suppressMenu: true,
                          suppressMovable: true
                        }}
                        rowSelection={{ type: 'single', enableClickSelection: true }}
                        animateRows={true}
                        enableCellTextSelection={true}
                        ensureDomOrder={true}
                        theme="quartz"
                        getRowStyle={(params) => {
                          if (params.data.isDragged) {
                            return { 
                              backgroundColor: '#EFF6FF', 
                              borderLeft: '4px solid #3B82F6',
                              fontWeight: '500'
                            }
                          }
                          if (params.data.isCustom) {
                            return { 
                              backgroundColor: '#F0FDF4', 
                              borderLeft: '4px solid #22C55E',
                              fontWeight: '500'
                            }
                          }
                          if (params.data.isGroup) {
                            return { 
                              backgroundColor: '#FEF3C7', 
                              fontWeight: 'bold',
                              fontSize: '14px',
                              borderLeft: '3px solid #F59E0B'
                            }
                          }
                          return { 
                            fontSize: '13px',
                            lineHeight: '1.4'
                          }
                        }}
                        getRowHeight={(params) => {
                          return params.data.isGroup ? 50 : 46
                        }}
                      />
                    </div>
                  )
                } else {
                  // Fallback: Show a simple table with sample data
                  const fallbackData = [
                    { accountCode: '1000', accountName: 'CASH AND CASH EQUIVALENTS', currentYear: 1500000, previousYear: 1200000, variance: '25.0%' },
                    { accountCode: '1100', accountName: '  Cash on Hand', currentYear: 500000, previousYear: 400000, variance: '25.0%' },
                    { accountCode: '1200', accountName: '  Bank Accounts', currentYear: 1000000, previousYear: 800000, variance: '25.0%' },
                    { accountCode: '2000', accountName: 'ACCOUNTS RECEIVABLE', currentYear: 2500000, previousYear: 2200000, variance: '13.6%' },
                    { accountCode: '2100', accountName: '  Trade Receivables', currentYear: 2000000, previousYear: 1800000, variance: '11.1%' },
                    { accountCode: '2200', accountName: '  Other Receivables', currentYear: 500000, previousYear: 400000, variance: '25.0%' }
                  ]
                  
                  return (
                    <div className="h-full w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Report Grid</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Fallback table view - AgGrid loading...</p>
                      </div>
                      <div className="overflow-auto h-full">
                        <table className="w-full">
                          <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account Code</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account Name</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Year</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Previous Year</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Variance</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {fallbackData.map((row, index) => (
                              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.accountCode}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.accountName}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">${row.currentYear.toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">${row.previousYear.toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">{row.variance}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className={`${showPropertiesPanel ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden`}>
          {showPropertiesPanel && renderPropertiesPanel()}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 left-4 flex flex-col space-y-2">
        <button
          onClick={() => setShowHierarchyPanel(!showHierarchyPanel)}
          className="p-3 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          title="Toggle Data Sources"
        >
          <Database className="h-5 w-5" />
        </button>
        <button
          onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
          className="p-3 rounded-full shadow-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          title="Toggle Properties"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Formula Editor Modal */}
      {showFormulaEditor && renderFormulaEditor()}
    </div>
  )
}

export default CustomReportDesigner
