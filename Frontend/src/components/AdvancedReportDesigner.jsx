import React, { useState, useEffect, useRef, useCallback } from 'react'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import { HyperFormula } from 'hyperformula'
import 'handsontable/dist/handsontable.full.css'
import './ReportDesigner.css'
import FormulaEditor from './FormulaEditor'
import DataSourcesPanel from './DataSourcesPanel'
import ReportImportExport from './ReportImportExport'
import { 
  ArrowLeft, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Eye, 
  Settings,
  FileText,
  BarChart3,
  Calculator,
  Filter,
  Download,
  Upload,
  Grid,
  Layout,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
  Move,
  Copy,
  RotateCcw,
  RotateCw,
  Lock,
  Unlock,
  Eye as EyeIcon,
  EyeOff,
  Zap,
  Link,
  Image,
  Table,
  Columns,
  Rows,
  Calculator as FunctionIcon,
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
  Database,
  Globe,
  RefreshCw,
  Building2,
  TrendingUp,
  PieChart,
  Activity,
  Target,
  Award,
  Star,
  Heart,
  Zap as Lightning,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Edit
} from 'lucide-react'

// Register all Handsontable modules
registerAllModules()

const AdvancedReportDesigner = ({ report, onSave, onCancel }) => {
  const hotTableRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    report_type: 'custom',
    category: '',
    is_public: false,
    is_template: false
  })
  
  const [hotData, setHotData] = useState([
    ['Total Assets', 1000000, 950000, 50000, 'Strong growth in asset base'],
    ['Current Assets', 600000, 580000, 20000, 'Improved liquidity position'],
    ['Cash and Cash Equivalents', 200000, 180000, 20000, 'Increased due to Q4 collections'],
    ['Accounts Receivable', 150000, 160000, -10000, 'Improved collection efficiency'],
    ['Inventory', 250000, 240000, 10000, 'Seasonal buildup for Q1'],
    ['Non-Current Assets', 400000, 370000, 30000, 'Capital investments'],
    ['Property, Plant & Equipment', 300000, 280000, 20000, 'New equipment acquisition'],
    ['Intangible Assets', 100000, 90000, 10000, 'Software development costs'],
    ['Total Liabilities', 600000, 580000, 20000, 'Controlled debt levels'],
    ['Current Liabilities', 200000, 190000, 10000, 'Manageable short-term obligations'],
    ['Accounts Payable', 120000, 110000, 10000, 'Increased vendor payments'],
    ['Short-term Debt', 80000, 80000, 0, 'Revolving credit facility'],
    ['Non-Current Liabilities', 400000, 390000, 10000, 'Long-term financing'],
    ['Long-term Debt', 400000, 390000, 10000, 'Term loan drawdown'],
    ['Total Equity', 400000, 370000, 30000, 'Strong equity position'],
    ['Share Capital', 200000, 200000, 0, 'No new issuances'],
    ['Retained Earnings', 200000, 170000, 30000, 'Strong Q4 performance']
  ])
  
  const [columns, setColumns] = useState([
    { title: 'Row Labels', width: 250, renderer: 'html' },
    { title: 'Current Period', type: 'numeric', format: '$0,0.00', width: 150 },
    { title: 'Previous Period', type: 'numeric', format: '$0,0.00', width: 150 },
    { title: 'Variance', type: 'numeric', format: '$0,0.00', width: 150 },
    { title: 'Notes', type: 'text', width: 200 }
  ])
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [activeTab, setActiveTab] = useState('design') // 'design', 'data', 'formatting', 'preview'
  const [selectedCell, setSelectedCell] = useState(null)
  const [showFormulaEditor, setShowFormulaEditor] = useState(false)
  const [showDataSources, setShowDataSources] = useState(false)
  const [showHierarchyPanel, setShowHierarchyPanel] = useState(true)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
  const [hierarchyPanelCollapsed, setHierarchyPanelCollapsed] = useState(false)
  const [hierarchyData, setHierarchyData] = useState([])
  const [formulaEngine, setFormulaEngine] = useState(null)
  const [cellMeta, setCellMeta] = useState({})
  const [filters, setFilters] = useState({})
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' })
  const [selectedDataSources, setSelectedDataSources] = useState([])
  const [showImportExport, setShowImportExport] = useState(false)

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        description: report.description || '',
        report_type: report.report_type,
        category: report.category || '',
        is_public: report.is_public,
        is_template: report.is_template
      })
      
      // Load existing definition if available
      loadReportDefinition()
    }
    
    // Initialize HyperFormula with proper error handling
    try {
      const engine = HyperFormula.buildEmpty({
        licenseKey: 'gpl-v3'
      })
      setFormulaEngine(engine)
    } catch (error) {
      console.warn('HyperFormula initialization failed:', error)
      setFormulaEngine(null)
    }
    
    // Load hierarchy data
    loadHierarchyData()
  }, [report])

  // Force Handsontable to render properly
  useEffect(() => {
    const timer = setTimeout(() => {
      const hotInstance = hotTableRef.current?.hotInstance
      if (hotInstance) {
        console.log('Handsontable data before render:', hotInstance.getData())
        console.log('Handsontable row count:', hotInstance.countRows())
        console.log('Handsontable column count:', hotInstance.countCols())
        
        // Force re-render with proper settings
        hotInstance.updateSettings({
          data: hotData,
          rowHeights: 25
        })
        
        hotInstance.render()
        console.log('Handsontable rendered with data:', hotInstance.getData())
      }
    }, 200)
    
    return () => clearTimeout(timer)
  }, [hotData])

  const loadReportDefinition = async () => {
    if (!report) return
    
    try {
      const response = await fetch(`/api/reports/${report.id}/definition`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.definition && data.definition.hotData) {
          setHotData(data.definition.hotData)
        }
        if (data.definition && data.definition.columns) {
          setColumns(data.definition.columns)
        }
        if (data.definition && data.definition.cellMeta) {
          setCellMeta(data.definition.cellMeta)
        }
      }
    } catch (err) {
      console.error('Error loading report definition:', err)
    }
  }

  const loadHierarchyData = async () => {
    try {
      // Load entity hierarchy
      const entityResponse = await fetch('/api/entities', {
        credentials: 'include'
      })
      
      // Load account hierarchy
      const accountResponse = await fetch('/api/accounts', {
        credentials: 'include'
      })
      
      // Load trial balance data
      const tbResponse = await fetch('/api/tb-files', {
        credentials: 'include'
      })
      
      if (entityResponse.ok && accountResponse.ok) {
        const entities = await entityResponse.json()
        const accounts = await accountResponse.json()
        const tbData = tbResponse.ok ? await tbResponse.json() : []
        
        setHierarchyData([
          {
            id: 'entities',
            name: 'Entities',
            type: 'folder',
            children: entities.map(entity => ({
              id: `entity_${entity.id}`,
              name: entity.name,
              type: 'entity',
              data: entity
            }))
          },
          {
            id: 'accounts',
            name: 'Accounts',
            type: 'folder',
            children: accounts.map(account => ({
              id: `account_${account.id}`,
              name: account.name,
              type: 'account',
              data: account
            }))
          },
          {
            id: 'trial_balance',
            name: 'Trial Balance',
            type: 'folder',
            children: tbData.map(tb => ({
              id: `tb_${tb.id}`,
              name: tb.filename || `TB ${tb.period}`,
              type: 'trial_balance',
              data: tb
            }))
          }
        ])
      }
    } catch (err) {
      console.error('Error loading hierarchy data:', err)
      // Set fallback data if API fails
      setHierarchyData([
        {
          id: 'entities',
          name: 'Entities',
          type: 'folder',
          children: [
            { id: 'entity_1', name: 'Parent Company', type: 'entity', data: { id: 1, name: 'Parent Company' } },
            { id: 'entity_2', name: 'Subsidiary A', type: 'entity', data: { id: 2, name: 'Subsidiary A' } }
          ]
        },
        {
          id: 'accounts',
          name: 'Accounts',
          type: 'folder',
          children: [
            { id: 'account_1', name: 'Cash and Cash Equivalents', type: 'account', data: { id: 1, name: 'Cash and Cash Equivalents' } },
            { id: 'account_2', name: 'Accounts Receivable', type: 'account', data: { id: 2, name: 'Accounts Receivable' } }
          ]
        }
      ])
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Report name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const hotInstance = hotTableRef.current?.hotInstance
      const currentData = hotInstance ? hotInstance.getData() : hotData
      
      const reportData = {
        ...formData,
        definition: {
          hotData: currentData,
          columns: columns,
          cellMeta: cellMeta,
          filters: filters,
          sortConfig: sortConfig
        }
      }
      
      await onSave(reportData)
    } catch (err) {
      console.error('Error saving report:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAfterChange = useCallback((changes, source) => {
    // Prevent infinite loops by only updating on user changes
    if (source === 'edit' || source === 'CopyPaste.paste' || source === 'Autofill.fill') {
      const hotInstance = hotTableRef.current?.hotInstance
      if (hotInstance) {
        const newData = hotInstance.getData()
        setHotData(newData)
      }
    }
  }, [])

  const handleAfterSelection = useCallback((row, col, row2, col2) => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance) {
      const cellValue = hotInstance.getDataAtCell(row, col)
      const cellMeta = hotInstance.getCellMeta(row, col)
      
      setSelectedCell({
        row,
        col,
        value: cellValue,
        meta: cellMeta
      })
    }
  }, [])

  const addRow = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance) {
      hotInstance.alter('insert_row', hotInstance.countRows())
    }
  }

  const addColumn = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance) {
      const newColIndex = hotInstance.countCols()
      hotInstance.alter('insert_col', newColIndex)
      
      // Add new column to columns config
      setColumns(prev => [...prev, {
        data: newColIndex,
        title: `Column ${newColIndex + 1}`,
        type: 'text',
        width: 150
      }])
    }
  }

  const deleteRow = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance && selectedCell) {
      hotInstance.alter('remove_row', selectedCell.row)
    }
  }

  const deleteColumn = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance && selectedCell) {
      hotInstance.alter('remove_col', selectedCell.col)
    }
  }

  const applyFormatting = (format) => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance && selectedCell) {
      const { row, col } = selectedCell
      
      switch (format) {
        case 'bold':
          hotInstance.setCellMeta(row, col, 'className', 'htBold')
          break
        case 'italic':
          hotInstance.setCellMeta(row, col, 'className', 'htItalic')
          break
        case 'underline':
          hotInstance.setCellMeta(row, col, 'className', 'htUnderline')
          break
        case 'currency':
          hotInstance.setCellMeta(row, col, 'type', 'numeric')
          hotInstance.setCellMeta(row, col, 'format', '$0,0.00')
          break
        case 'percentage':
          hotInstance.setCellMeta(row, col, 'type', 'numeric')
          hotInstance.setCellMeta(row, col, 'format', '0.00%')
          break
        case 'number':
          hotInstance.setCellMeta(row, col, 'type', 'numeric')
          hotInstance.setCellMeta(row, col, 'format', '0,0.00')
          break
      }
      
      hotInstance.render()
    }
  }

  const handleDragFromHierarchy = (draggedItem, targetRow = null, targetCol = null) => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance) {
      const row = targetRow !== null ? targetRow : (selectedCell?.row || 0)
      const col = targetCol !== null ? targetCol : (selectedCell?.col || 0)
      
      // Insert the dragged item into the target cell
      hotInstance.setDataAtCell(row, col, draggedItem.name)
      
      // Add metadata about the dragged item
      hotInstance.setCellMeta(row, col, 'hierarchyItem', draggedItem)
      hotInstance.setCellMeta(row, col, 'className', 'htHierarchyItem')
      
      // If it's a parent item with children, add them as nested rows
      if (draggedItem.data && draggedItem.data.children) {
        const children = draggedItem.data.children
        children.forEach((child, index) => {
          const childRow = row + index + 1
          hotInstance.alter('insert_row', childRow)
          hotInstance.setDataAtCell(childRow, col, `  ${child.name}`)
          hotInstance.setCellMeta(childRow, col, 'hierarchyItem', child)
          hotInstance.setCellMeta(childRow, col, 'className', 'htChildItem')
        })
      }
      
      hotInstance.render()
    }
  }

  const handleFormulaSave = (formula) => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance && selectedCell) {
      const { row, col } = selectedCell
      
      // Set the formula in the cell
      hotInstance.setDataAtCell(row, col, formula)
      
      // Add formula metadata
      hotInstance.setCellMeta(row, col, 'formula', formula)
      hotInstance.setCellMeta(row, col, 'type', 'numeric')
      
      hotInstance.render()
    }
  }

  const handleDataSourceSelect = (sources) => {
    setSelectedDataSources(sources)
  }

  const handleImport = (importData) => {
    // Process imported data and update the Handsontable
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance && importData.preview) {
      // Convert preview data to Handsontable format
      const newData = importData.preview
      hotInstance.loadData(newData)
      setHotData(newData)
    }
  }

  const renderHierarchyPanel = () => (
    <div className="h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Enhanced Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-600" />
              Live Data Sources
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag & drop to build your report
            </p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setShowDataSources(true)}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
              title="Manage Data Sources"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={loadHierarchyData}
              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Live Status Indicator */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-600 dark:text-green-400 font-medium">Live Data Connected</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Enhanced Data Categories */}
          {hierarchyData.map((category) => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    {category.id === 'entities' ? (
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : category.id === 'accounts' ? (
                      <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{category.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.children.length} items available
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                    Active
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
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
                    className="group flex items-center space-x-3 p-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-move transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm"
                  >
                    <div className="flex-shrink-0">
                      {item.type === 'entity' ? (
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      ) : item.type === 'account' ? (
                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                          <Calculator className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      ) : item.type === 'trial_balance' ? (
                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                          <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                          <File className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.type === 'entity' ? 'Business Entity' : 
                         item.type === 'account' ? 'Chart of Accounts' : 
                         item.type === 'trial_balance' ? 'Trial Balance Data' : 'Data Source'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <Move className="h-3 w-3 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Advanced Quick Actions */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Zap className="h-4 w-4 mr-2 text-yellow-500" />
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowDataSources(true)}
                className="flex items-center space-x-2 p-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
              >
                <Plus className="h-4 w-4 text-blue-600" />
                <span>Add Source</span>
              </button>
              <button
                onClick={() => setShowFormulaEditor(true)}
                className="flex items-center space-x-2 p-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-all"
              >
                <Calculator className="h-4 w-4 text-green-600" />
                <span>Formulas</span>
              </button>
              <button
                onClick={() => setShowImportExport(true)}
                className="flex items-center space-x-2 p-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all"
              >
                <Download className="h-4 w-4 text-purple-600" />
                <span>Import/Export</span>
              </button>
              <button
                onClick={loadHierarchyData}
                className="flex items-center space-x-2 p-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all"
              >
                <RefreshCw className="h-4 w-4 text-orange-600" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Live Data Stats */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <Activity className="h-4 w-4 mr-2 text-green-600" />
                Live Data Statistics
              </h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center">
                  <div className="font-bold text-green-600 dark:text-green-400">
                    {hierarchyData.reduce((sum, cat) => sum + cat.children.length, 0)}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600 dark:text-blue-400">
                    {hierarchyData.length}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Categories</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFormattingToolbar = () => (
    <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Row/Column Operations */}
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
            <button
              onClick={addRow}
              className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
              title="Insert Row"
            >
              <Rows className="h-4 w-4" />
            </button>
            <button
              onClick={addColumn}
              className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-all"
              title="Insert Column"
            >
              <Columns className="h-4 w-4" />
            </button>
            <button
              onClick={deleteRow}
              disabled={!selectedCell}
              className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all disabled:opacity-50"
              title="Delete Row"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
            <button
              onClick={() => applyFormatting('bold')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all font-bold"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormatting('italic')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all italic"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormatting('underline')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all underline"
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </button>
          </div>

          {/* Number Formatting */}
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
            <button
              onClick={() => applyFormatting('currency')}
              className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-all"
              title="Currency Format"
            >
              <DollarSign className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormatting('percentage')}
              className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
              title="Percentage Format"
            >
              <Percent className="h-4 w-4" />
            </button>
            <button
              onClick={() => applyFormatting('number')}
              className="p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-all"
              title="Number Format"
            >
              <FunctionIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all"
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all"
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all"
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          {/* Advanced Tools */}
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
            <button
              onClick={() => setShowFormulaEditor(true)}
              className="p-2 text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-md transition-all"
              title="Formula Editor"
            >
              <Calculator className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowImportExport(true)}
              className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all"
              title="Import/Export"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              className="p-2 text-gray-500 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-md transition-all"
              title="Conditional Formatting"
            >
              <Palette className="h-4 w-4" />
            </button>
            <button
              className="p-2 text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-all"
              title="Data Validation"
            >
              <Shield className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Enhanced Cell Info */}
        <div className="flex items-center space-x-4 text-sm">
          {selectedCell && (
            <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-700 dark:text-blue-300">
                {String.fromCharCode(65 + selectedCell.col)}{selectedCell.row + 1}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Table className="h-4 w-4" />
              <span className="font-medium">{hotData.length} rows</span>
            </div>
            <div className="flex items-center space-x-1">
              <Columns className="h-4 w-4" />
              <span className="font-medium">{columns.length} columns</span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400 font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPropertiesPanel = () => (
    <div className="h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Enhanced Header */}
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
          {selectedCell ? `Cell ${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1} • Row ${selectedCell.row + 1}, Column ${selectedCell.col + 1}` : 'Select a cell to edit its properties'}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {selectedCell ? (
            <>
              {/* Cell Value Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <Edit className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Cell Value</h4>
                </div>
                <input
                  type="text"
                  value={selectedCell.value || ''}
                  onChange={(e) => {
                    const hotInstance = hotTableRef.current?.hotInstance
                    if (hotInstance) {
                      hotInstance.setDataAtCell(selectedCell.row, selectedCell.col, e.target.value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Enter cell value..."
                />
              </div>

              {/* Cell Type Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <Type className="h-4 w-4 text-green-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Data Type</h4>
                </div>
                <select
                  value={selectedCell.meta?.type || 'text'}
                  onChange={(e) => {
                    const hotInstance = hotTableRef.current?.hotInstance
                    if (hotInstance) {
                      hotInstance.setCellMeta(selectedCell.row, selectedCell.col, 'type', e.target.value)
                      hotInstance.render()
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="text">📝 Text</option>
                  <option value="numeric">🔢 Number</option>
                  <option value="date">📅 Date</option>
                  <option value="checkbox">☑️ Checkbox</option>
                  <option value="dropdown">📋 Dropdown</option>
                  <option value="formula">🧮 Formula</option>
                </select>
              </div>

              {/* Formatting Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <Palette className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Formatting</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number Format
                    </label>
                    <input
                      type="text"
                      value={selectedCell.meta?.format || ''}
                      onChange={(e) => {
                        const hotInstance = hotTableRef.current?.hotInstance
                        if (hotInstance) {
                          hotInstance.setCellMeta(selectedCell.row, selectedCell.col, 'format', e.target.value)
                          hotInstance.render()
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="e.g., $0,0.00 or 0.00%"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Background
                      </label>
                      <input
                        type="color"
                        value="#ffffff"
                        onChange={(e) => {
                          const hotInstance = hotTableRef.current?.hotInstance
                          if (hotInstance) {
                            hotInstance.setCellMeta(selectedCell.row, selectedCell.col, 'className', `bg-[${e.target.value}]`)
                            hotInstance.render()
                          }
                        }}
                        className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Text Color
                      </label>
                      <input
                        type="color"
                        value="#000000"
                        onChange={(e) => {
                          const hotInstance = hotTableRef.current?.hotInstance
                          if (hotInstance) {
                            hotInstance.setCellMeta(selectedCell.row, selectedCell.col, 'className', `text-[${e.target.value}]`)
                            hotInstance.render()
                          }
                        }}
                        className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Properties */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Advanced</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Data Validation</span>
                    <button className="p-1.5 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-md transition-all">
                      <Shield className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Conditional Format</span>
                    <button className="p-1.5 text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-md transition-all">
                      <Palette className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Add Comment</span>
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all">
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Link to Source</span>
                    <button className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-all">
                      <Link className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cell Statistics */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                  Cell Statistics
                </h5>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-blue-600 dark:text-blue-400">
                      {selectedCell.row + 1}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Row</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedCell.col + 1}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Column</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-20"></div>
                <Grid className="relative mx-auto h-16 w-16 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                No Cell Selected
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Click on any cell in the spreadsheet to view and edit its properties, formatting, and advanced options.
              </p>
              <div className="mt-6 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const hotTableSettings = {
    data: hotData,
    columns: columns,
    colHeaders: true,
    rowHeaders: true,
    width: '100%',
    height: '100%',
    licenseKey: 'non-commercial-and-evaluation',
    readOnly: false,
    allowEmpty: true,
    allowInsertRow: true,
    allowInsertColumn: true,
    allowRemoveRow: true,
    allowRemoveColumn: true,
    renderAllRows: false,
    viewportRowRenderingOffset: 50,
    viewportColumnRenderingOffset: 10,
    rowHeights: 30,
    stretchH: 'all',
    stretchV: 'none',
    fixedRowsTop: 1,
    fixedColumnsLeft: 1,
    autoColumnSize: false,
    autoRowSize: false,
    wordWrap: false,
    manualRowResize: true,
    manualColumnResize: true,
    // Enhanced scrolling and performance
    virtualRendering: true,
    virtualScrolling: true,
    // Better alignment and formatting
    className: 'htCenter htMiddle',
    // Fix alignment issues
    autoWrapRow: false,
    autoWrapCol: false,
    // Improved cell selection and interaction
    selectionMode: 'range',
    fillHandle: {
      direction: 'vertical',
      autoInsertRow: true
    },
    contextMenu: [
      'row_above', 'row_below', 'col_left', 'col_right',
      'remove_row', 'remove_col', 'undo', 'redo',
      'copy', 'cut', 'paste', 'freeze_column',
      'unfreeze_column', 'borders', 'commentsAdd',
      'commentsEdit', 'commentsRemove', 'commentsReadOnly',
      'mergeCells', 'unmergeCells'
    ],
    filters: true,
    dropdownMenu: true,
    manualColumnResize: true,
    manualRowResize: true,
    manualColumnMove: true,
    manualRowMove: true,
    multiColumnSorting: true,
    comments: true,
    mergeCells: true,
    copyPaste: true,
    undoRedo: true,
    fillHandle: true,
    trimWhitespace: false,
    afterChange: handleAfterChange,
    afterSelection: handleAfterSelection,
    afterSelectionEnd: handleAfterSelection,
    afterOnCellMouseDown: (event, coords, td) => {
      console.log('Cell clicked:', coords)
      // Force selection update - only if coords are valid
      if (coords && typeof coords.row === 'number' && typeof coords.col === 'number' && coords.row >= 0 && coords.col >= 0) {
        const hotInstance = hotTableRef.current?.hotInstance
        if (hotInstance) {
          try {
            const cellValue = hotInstance.getDataAtCell(coords.row, coords.col)
            const cellMeta = hotInstance.getCellMeta(coords.row, coords.col)
            
            setSelectedCell({
              row: coords.row,
              col: coords.col,
              value: cellValue,
              meta: cellMeta,
              // Add more cell information
              cellType: cellMeta.type || 'text',
              format: cellMeta.format || '',
              className: cellMeta.className || '',
              readOnly: cellMeta.readOnly || false
            })
            
            // Automatically show properties panel when cell is selected
            setShowPropertiesPanel(true)
          } catch (error) {
            console.warn('Error accessing cell:', error)
          }
        }
      }
    },
    beforeOnCellMouseDown: (event, coords, td) => {
      // Handle drag and drop from hierarchy
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'copy'
      }
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 report-designer-container">
      {/* Compact Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
              placeholder="Enter report name"
            />
            {errors.name && (
              <span className="text-sm text-red-600">{errors.name}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden main-content-area">
        {/* Left Sidebar - Data Sources (Collapsible) */}
        <div className={`${showHierarchyPanel ? (hierarchyPanelCollapsed ? 'w-16' : 'w-80') : 'w-0'} transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0`}>
          {showHierarchyPanel && (
            <div className="h-full flex flex-col">
              {/* Sidebar Header with Toggle */}
              <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex-shrink-0">
                {!hierarchyPanelCollapsed && (
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">IFRS Data Sources</h3>
                  </div>
                )}
                <button
                  onClick={() => setHierarchyPanelCollapsed(!hierarchyPanelCollapsed)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={hierarchyPanelCollapsed ? "Expand panel" : "Collapse panel"}
                >
                  {hierarchyPanelCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 overflow-hidden">
                {renderHierarchyPanel()}
              </div>
            </div>
          )}
        </div>

        {/* Main Spreadsheet Area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ overflow: 'hidden' }}>
          {/* Formatting Toolbar */}
          <div style={{ flexShrink: 0 }}>
            {renderFormattingToolbar()}
          </div>

          {/* Enhanced Handsontable Area with proper scrolling */}
          <div className="flex-1 p-4 min-h-0" style={{ overflow: 'hidden' }}>
            <div 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm relative h-full w-full"
              style={{ minHeight: '600px', height: '100%', overflow: 'hidden' }}
              onDrop={(e) => {
                e.preventDefault()
                const dragData = e.dataTransfer.getData('application/json')
                if (dragData) {
                  try {
                    const draggedItem = JSON.parse(dragData)
                    console.log('Dropped item:', draggedItem)
                    
                    // Get the drop position from the event
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const y = e.clientY - rect.top
                    
                    // Calculate approximate row/column from position
                    const hotInstance = hotTableRef.current?.hotInstance
                    if (hotInstance) {
                      const cellCoords = hotInstance.getCellAtPixel(x, y)
                      if (cellCoords) {
                        handleDragFromHierarchy(draggedItem, cellCoords.row, cellCoords.col)
                      } else {
                        // Fallback to selected cell or first cell
                        handleDragFromHierarchy(draggedItem)
                      }
                    }
                  } catch (err) {
                    console.error('Error parsing drag data:', err)
                  }
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-600')
                e.currentTarget.classList.add('ring-4', 'ring-blue-200', 'dark:ring-blue-800')
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-600')
                e.currentTarget.classList.remove('ring-4', 'ring-blue-200', 'dark:ring-blue-800')
              }}
            >
              {/* Drop Zone Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium opacity-0 transition-opacity duration-200" id="drop-indicator">
                  Drop here to add to report
                </div>
              </div>
              
              {/* Handsontable Container with proper scrolling */}
              <div className="h-full w-full hot-container" style={{ height: '100%', overflow: 'auto' }}>
                <HotTable
                  key={`hot-table-${hotData.length}-${showHierarchyPanel}-${showPropertiesPanel}`}
                  ref={hotTableRef}
                  settings={hotTableSettings}
                />
              </div>
              
              {/* Grid Status Overlay */}
              <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Live Grid</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{hotData.length} rows</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties Panel (Only shows when cell is selected) */}
        <div className={`${showPropertiesPanel && selectedCell ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0`}>
          {showPropertiesPanel && selectedCell && (
            <div className="h-full flex flex-col">
              {/* Properties Panel Header with Close Button */}
              <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cell Properties</h3>
                  {selectedCell && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {String.fromCharCode(65 + selectedCell.col)}{selectedCell.row + 1}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowPropertiesPanel(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Close properties panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Properties Panel Content */}
              <div className="flex-1 overflow-hidden">
                {renderPropertiesPanel()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Floating Action Buttons */}
      <div className="fixed bottom-6 left-6 flex flex-col space-y-3 z-50">
        <button
          onClick={() => setShowHierarchyPanel(!showHierarchyPanel)}
          className={`p-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 ${
            showHierarchyPanel 
              ? 'bg-blue-600 text-white shadow-blue-500/25' 
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
          }`}
          title={showHierarchyPanel ? "Hide Data Sources" : "Show Data Sources"}
        >
          <Database className="h-6 w-6" />
        </button>
        <button
          onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
          className={`p-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 ${
            showPropertiesPanel && selectedCell
              ? 'bg-purple-600 text-white shadow-purple-500/25' 
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
          }`}
          title={selectedCell ? (showPropertiesPanel ? "Hide Properties" : "Show Properties") : "Click a cell first"}
          disabled={!selectedCell}
        >
          <Settings className="h-6 w-6" />
        </button>
        
        {/* Quick Actions Button */}
        <button
          onClick={() => {
            setShowHierarchyPanel(true)
            setShowPropertiesPanel(true)
          }}
          className="p-4 rounded-full shadow-xl bg-green-600 text-white hover:bg-green-700 transition-all duration-300 transform hover:scale-110 shadow-green-500/25"
          title="Show All Panels"
        >
          <Layout className="h-6 w-6" />
        </button>
      </div>

      {/* Modals */}
      <FormulaEditor
        isOpen={showFormulaEditor}
        onClose={() => setShowFormulaEditor(false)}
        onSave={handleFormulaSave}
        initialFormula={selectedCell?.meta?.formula || ''}
        selectedCell={selectedCell}
      />

      <DataSourcesPanel
        isOpen={showDataSources}
        onClose={() => setShowDataSources(false)}
        onSelectDataSource={handleDataSourceSelect}
        selectedDataSources={selectedDataSources}
      />

      <ReportImportExport
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        reportData={hotData}
        onImport={handleImport}
      />
    </div>
  )
}

export default AdvancedReportDesigner
