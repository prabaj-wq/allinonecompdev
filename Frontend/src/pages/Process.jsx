
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import {
  Upload,
  Save,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Layers,
  Plus,
  Settings,
  X,
  ChevronRight,
  CirclePlus,
  Loader2,
  GitBranch,
  Repeat,
  Layout,
  BarChart3,
  Play,
  Pause,
  Square,
  Eye,
  EyeOff,
  Copy,
  Download,
  Filter,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  Zap,
  Globe,
  Users,
  PieChart,
  Activity,
  Database,
  Link,
  Workflow,
  MousePointer,
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Layers3
} from 'lucide-react'

const PROCESS_TYPES = [
  'Profit & Loss Calculation',
  'NCI Handling', 
  'Retained Earnings Rollforward',
  'FX Translation',
  'Intercompany Eliminations',
  'Goodwill & Fair Value Adjustments',
  'Deferred Taxes',
  'Opening Balance Adjustments',
  'Minority/Associate/JV Accounting',
  'Prior Period Errors & Changes',
  'Statement of Changes in Equity',
  'OCI Items',
  'EPS Calculation',
  'Valuation & Impairment',
  'What-If Simulation',
  'Scenario Version Control',
  'Alerts & Exceptions',
  'Entity Structure & Ownership'
]

const NODE_LIBRARY = [
  {
    type: 'data_input',
    title: 'Data Input',
    description: 'Import financial data from various sources',
    icon: Upload,
    category: 'Input',
    color: 'bg-blue-500'
  },
  {
    type: 'profit_loss',
    title: 'Profit & Loss Calculation',
    description: 'Calculate profit for entity, group, segments with margins',
    icon: TrendingUp,
    category: 'Calculation',
    color: 'bg-green-500'
  },
  {
    type: 'nci_allocation',
    title: 'NCI Handling',
    description: 'Non-controlling interest measurement and allocation',
    icon: Users,
    category: 'Processing',
    color: 'bg-purple-500'
  },
  {
    type: 'retained_earnings',
    title: 'Retained Earnings Rollforward',
    description: 'Roll-forward retained earnings with adjustments',
    icon: Repeat,
    category: 'Processing',
    color: 'bg-orange-500'
  },
  {
    type: 'fx_translation',
    title: 'FX Translation',
    description: 'Foreign currency translation and adjustments',
    icon: Globe,
    category: 'Processing',
    color: 'bg-cyan-500'
  },
  {
    type: 'intercompany_elimination',
    title: 'Intercompany Eliminations',
    description: 'Eliminate intercompany transactions and balances',
    icon: Link,
    category: 'Processing',
    color: 'bg-red-500'
  },
  {
    type: 'goodwill_impairment',
    title: 'Goodwill & Fair Value',
    description: 'Goodwill calculation and fair value adjustments',
    icon: Target,
    category: 'Processing',
    color: 'bg-indigo-500'
  },
  {
    type: 'deferred_tax',
    title: 'Deferred Taxes',
    description: 'Calculate deferred tax impacts and effects',
    icon: DollarSign,
    category: 'Processing',
    color: 'bg-yellow-500'
  },
  {
    type: 'opening_balance',
    title: 'Opening Balance Adjustments',
    description: 'Adjust opening balances for consolidation',
    icon: Calendar,
    category: 'Processing',
    color: 'bg-pink-500'
  },
  {
    type: 'associate_equity_method',
    title: 'Associate/JV Accounting',
    description: 'Equity method accounting for associates and JVs',
    icon: Building2,
    category: 'Processing',
    color: 'bg-teal-500'
  },
  {
    type: 'eps_calculation',
    title: 'EPS Calculation',
    description: 'Weighted average shares and EPS calculation',
    icon: PieChart,
    category: 'Calculation',
    color: 'bg-emerald-500'
  },
  {
    type: 'what_if_analysis',
    title: 'What-If Simulation',
    description: 'Run scenarios with different assumptions',
    icon: Zap,
    category: 'Analysis',
    color: 'bg-violet-500'
  },
  {
    type: 'validation',
    title: 'Validation & Alerts',
    description: 'Validate balances and generate alerts',
    icon: AlertCircle,
    category: 'Control',
    color: 'bg-amber-500'
  },
  {
    type: 'consolidation_output',
    title: 'Consolidation Output',
    description: 'Generate consolidated financial statements',
    icon: BarChart3,
    category: 'Output',
    color: 'bg-slate-500'
  },
  {
    type: 'report_generation',
    title: 'Report Generation',
    description: 'Generate detailed consolidation reports',
    icon: FileSpreadsheet,
    category: 'Output',
    color: 'bg-gray-500'
  }
]

const getDefaultPeriod = () => {
  const now = new Date()
  return `Q${Math.floor(now.getMonth() / 3) + 1}`
}

const getDefaultYear = () => new Date().getFullYear().toString()

const normaliseCustomFieldList = (fields = []) =>
  (fields || [])
    .map((field, index) => {
      const fieldName = (field.field_name || field.name || '').trim() || `custom_${index + 1}`
      return {
        field_name: fieldName,
        field_label: (field.field_label || field.label || fieldName).trim(),
        field_type: (field.field_type || field.type || 'text').toLowerCase(),
        options: (field.options || field.dropdown_values || [])
          .filter((option) => option !== undefined && option !== null)
          .map((option) => (typeof option === 'string' ? option : String(option))),
        default_value: field.default_value ?? '',
        is_required: !!field.is_required,
        is_unique: !!field.is_unique,
        validation_rules: field.validation_rules || {},
        display_order: field.display_order ?? index,
        sql_query: field.sql_query || '',
      }
    })
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

const buildCustomFieldDefaults = (fields = []) => {
  const defaults = {}
  fields.forEach((field) => {
    if (field.default_value !== undefined && field.default_value !== null && field.default_value !== '') {
      defaults[field.field_name] = field.default_value
    }
  })
  return defaults
}

const createEmptyCustomField = (order = 0) => ({
  field_name: '',
  field_label: '',
  field_type: 'text',
  options: [],
  default_value: '',
  is_required: false,
  is_unique: false,
  validation_rules: {},
  display_order: order,
  sql_query: '',
})

const defaultFormState = {
  entity_code: '',
  account_code: '',
  amount: '',
  entry_type: 'debit',
  currency: '',
  entry_category: 'Manual Entry',
  counterparty: '',
  description: '',
  custom_fields: {},
}

const Process = () => {
  const { selectedCompany } = useCompany()
  const { isAuthenticated, getAuthHeaders } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  // Main State
  const [currentView, setCurrentView] = useState('processes') // processes, canvas, scenarios, execution
  const [selectedProcessId, setSelectedProcessId] = useState(null)
  const [selectedScenarioId, setSelectedScenarioId] = useState(null)
  
  // Process Management
  const [processes, setProcesses] = useState([])
  const [processLoading, setProcessLoading] = useState(false)
  const [processForm, setProcessForm] = useState({ 
    name: '', 
    description: '', 
    process_type: PROCESS_TYPES[0],
    fiscal_year: new Date().getFullYear(),
    reporting_currency: 'USD'
  })
  const [processDrawerOpen, setProcessDrawerOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState(null)
  
  // Canvas State
  const [canvasNodes, setCanvasNodes] = useState([])
  const [canvasConnections, setCanvasConnections] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [draggedNode, setDraggedNode] = useState(null)
  const [canvasZoom, setCanvasZoom] = useState(1)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [nodeLibraryOpen, setNodeLibraryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  // Scenario Management
  const [scenarios, setScenarios] = useState([])
  const [scenarioForm, setScenarioForm] = useState({
    name: '',
    description: '',
    scenario_type: 'actual',
    fx_rate_overrides: {},
    custom_parameters: {}
  })
  const [scenarioDrawerOpen, setScenarioDrawerOpen] = useState(false)
  
  // Entity Structure
  const [entityStructure, setEntityStructure] = useState([])
  const [entityForm, setEntityForm] = useState({
    entity_code: '',
    entity_name: '',
    parent_entity_code: '',
    ownership_percentage: 100,
    consolidation_method: 'full_consolidation',
    functional_currency: 'USD'
  })
  
  // Execution & Results
  const [executions, setExecutions] = useState([])
  const [executionResults, setExecutionResults] = useState(null)
  const [executionLoading, setExecutionLoading] = useState(false)
  
  // Reference Data
  const [referenceData, setReferenceData] = useState({
    accounts: [],
    entities: [],
    currencies: [],
    node_types: []
  })
  
  // UI State
  const [notification, setNotification] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)


  // Utility Functions
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const authHeaders = () => getAuthHeaders()

  // Canvas Utility Functions
  const generateNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const getNodePosition = (event) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    
    return {
      x: (event.clientX - rect.left - canvasOffset.x) / canvasZoom,
      y: (event.clientY - rect.top - canvasOffset.y) / canvasZoom
    }
  }


  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  // Fetch Processes
  const fetchProcesses = useCallback(async () => {
    if (!selectedCompany || !isAuthenticated) return
    setProcessLoading(true)
    try {
      const response = await fetch(
        `/api/financial-process/processes?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      )
      if (!response.ok) throw new Error(`Failed to load processes (${response.status})`)
      const data = await response.json()
      setProcesses(data.processes || [])
    } catch (error) {
      console.error('Failed to load processes:', error)
      showNotification('Unable to load processes. Please try again.', 'error')
    } finally {
      setProcessLoading(false)
    }
  }, [selectedCompany, isAuthenticated, getAuthHeaders])

  // Create or Update Process
  const saveProcess = async () => {
    if (!selectedCompany || !processForm.name.trim()) {
      showNotification('Please provide a process name', 'error')
      return
    }
    
    setLoading(true)
    try {
      const isEditing = !!editingProcess
      const url = isEditing 
        ? `/api/financial-process/processes/${editingProcess.id}?company_name=${encodeURIComponent(selectedCompany)}`
        : `/api/financial-process/processes?company_name=${encodeURIComponent(selectedCompany)}`
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(processForm),
      })
      
      if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} process`)
      const data = await response.json()
      
      if (isEditing) {
        setProcesses(processes.map(p => p.id === editingProcess.id ? data.process : p))
        showNotification('Process updated successfully', 'success')
      } else {
        setProcesses([...processes, data.process])
        setSelectedProcessId(data.process.id)
        showNotification('Process created successfully', 'success')
      }
      
      setProcessDrawerOpen(false)
      setEditingProcess(null)
      setProcessForm({ 
        name: '', 
        description: '', 
        process_type: PROCESS_TYPES[0],
        fiscal_year: new Date().getFullYear(),
        reporting_currency: 'USD'
      })
    } catch (error) {
      console.error('Failed to save process:', error)
      showNotification(`Failed to ${editingProcess ? 'update' : 'create'} process`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Fetch Process Details
  const fetchProcessDetails = useCallback(async (processId) => {
    if (!selectedCompany || !processId) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `/api/financial-process/processes/${processId}?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      )
      
      if (!response.ok) throw new Error('Failed to load process details')
      const data = await response.json()
      
      setCanvasNodes(data.nodes || [])
      setCanvasConnections(data.connections || [])
    } catch (error) {
      console.error('Failed to load process details:', error)
      showNotification('Failed to load process details', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, getAuthHeaders])

  // Fetch Scenarios
  const fetchScenarios = useCallback(async (processId) => {
    if (!selectedCompany || !processId) return
    
    try {
      const response = await fetch(
        `/api/financial-process/processes/${processId}/scenarios?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      )
      
      if (!response.ok) throw new Error('Failed to load scenarios')
      const data = await response.json()
      setScenarios(data.scenarios || [])
    } catch (error) {
      console.error('Failed to load scenarios:', error)
      showNotification('Failed to load scenarios', 'error')
    }
  }, [selectedCompany, getAuthHeaders])

  // Fetch Reference Data
  const fetchReferenceData = useCallback(async () => {
    if (!selectedCompany || !isAuthenticated) return
    
    try {
      const response = await fetch(
        `/api/financial-process/reference-data?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      )
      
      if (!response.ok) throw new Error('Failed to load reference data')
      const data = await response.json()
      setReferenceData(data)
    } catch (error) {
      console.error('Failed to load reference data:', error)
    }
  }, [selectedCompany, isAuthenticated, getAuthHeaders])


  // Canvas Functions
  const addNodeToCanvas = (nodeType, position) => {
    const nodeTemplate = NODE_LIBRARY.find(n => n.type === nodeType)
    if (!nodeTemplate) return

    const newNode = {
      id: generateNodeId(),
      type: nodeType,
      name: nodeTemplate.title,
      description: nodeTemplate.description,
      x: position.x,
      y: position.y,
      width: 200,
      height: 100,
      configuration: {},
      is_active: true
    }

    setCanvasNodes([...canvasNodes, newNode])
    setSelectedNode(newNode)
  }

  const updateNodePosition = (nodeId, newPosition) => {
    setCanvasNodes(nodes => 
      nodes.map(node => 
        node.id === nodeId 
          ? { ...node, x: newPosition.x, y: newPosition.y }
          : node
      )
    )
  }

  const deleteNode = (nodeId) => {
    setCanvasNodes(nodes => nodes.filter(n => n.id !== nodeId))
    setCanvasConnections(connections => 
      connections.filter(c => c.from_node_id !== nodeId && c.to_node_id !== nodeId)
    )
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }

  const executeProcess = async () => {
    if (!selectedProcessId || !selectedScenarioId) {
      showNotification('Please select a process and scenario', 'error')
      return
    }

    setExecutionLoading(true)
    try {
      const response = await fetch(
        `/api/financial-process/processes/${selectedProcessId}/execute?scenario_id=${selectedScenarioId}&company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      )

      if (!response.ok) throw new Error('Failed to execute process')
      const data = await response.json()
      
      setExecutionResults(data.results)
      showNotification('Process executed successfully', 'success')
    } catch (error) {
      console.error('Failed to execute process:', error)
      showNotification('Failed to execute process', 'error')
    } finally {
      setExecutionLoading(false)
    }
  }

  // ============================================================================
  // USE EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchProcesses()
    fetchReferenceData()
  }, [fetchProcesses, fetchReferenceData])

  useEffect(() => {
    if (selectedProcessId) {
      fetchProcessDetails(selectedProcessId)
      fetchScenarios(selectedProcessId)
    }
  }, [selectedProcessId, fetchProcessDetails, fetchScenarios])

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const handleEditProcess = (process, e) => {
    e.stopPropagation()
    setProcessForm({
      name: process.name,
      description: process.description || '',
      process_type: process.process_type,
      fiscal_year: process.fiscal_year,
      reporting_currency: process.reporting_currency
    })
    setEditingProcess(process)
    setProcessDrawerOpen(true)
  }

  const handleDeleteProcess = async (process, e) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to delete "${process.name}"?`)) return
    
    try {
      const response = await fetch(
        `/api/financial-process/processes/${process.id}?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      )
      
      if (!response.ok) throw new Error('Failed to delete process')
      
      setProcesses(processes.filter(p => p.id !== process.id))
      showNotification('Process deleted successfully', 'success')
    } catch (error) {
      console.error('Failed to delete process:', error)
      showNotification('Failed to delete process', 'error')
    }
  }

  const renderProcessCard = (process) => (
    <div
      key={process.id}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition cursor-pointer ${
        selectedProcessId === process.id
          ? 'border-indigo-500 bg-indigo-50 shadow-lg dark:border-indigo-400 dark:bg-indigo-900/30'
          : 'border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/20'
      }`}
      onClick={() => {
        setSelectedProcessId(process.id)
        setCurrentView('canvas')
      }}
      onDoubleClick={(e) => handleEditProcess(process, e)}
    >
      {/* Action buttons */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-2">
          <button
            onClick={(e) => handleEditProcess(process, e)}
            className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Edit Process"
          >
            <Edit className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => handleDeleteProcess(process, e)}
            className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete Process"
          >
            <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1 pr-12">
          <div className="flex items-center gap-3 mb-2">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white`}>
              <Workflow className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{process.name}</h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-300">{process.process_type}</p>
            </div>
          </div>
          {process.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{process.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              FY {process.fiscal_year}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {process.reporting_currency}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              process.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              process.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {process.status || 'Draft'}
            </span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
      </div>
    </div>
  )

  const renderCanvasNode = (node) => {
    const nodeTemplate = NODE_LIBRARY.find(n => n.type === node.type)
    const IconComponent = nodeTemplate?.icon || Layers
    
    return (
      <div
        key={node.id}
        className={`absolute bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg cursor-move select-none ${
          selectedNode?.id === node.id 
            ? 'border-indigo-500 shadow-indigo-200 dark:shadow-indigo-800/50' 
            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
        }`}
        style={{
          left: node.x * canvasZoom + canvasOffset.x,
          top: node.y * canvasZoom + canvasOffset.y,
          width: node.width * canvasZoom,
          height: node.height * canvasZoom,
          transform: `scale(${canvasZoom})`,
          transformOrigin: 'top left'
        }}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedNode(node)
        }}
      >
        <div className="p-3 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded ${nodeTemplate?.color || 'bg-gray-500'} text-white text-xs`}>
              <IconComponent className="h-3 w-3" />
            </span>
            <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {node.name}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 flex-1 overflow-hidden">
            {node.description}
          </p>
          {selectedNode?.id === node.id && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteNode(node.id)
              }}
              className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Main render logic starts here
  const renderProcessesView = () => (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Process Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Build comprehensive consolidation processes with advanced workflow automation
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/fiscal-management')}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Scenarios
            </button>
            <button
              onClick={() => setProcessDrawerOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Process
            </button>
          </div>
        </div>
      </section>

      {/* Process Grid */}
      {processLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 p-12 text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
          Loading processes...
        </div>
      ) : processes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <Workflow className="mx-auto h-12 w-12 mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No processes yet</h3>
          <p className="mb-4">Create your first financial process to get started</p>
          <button
            onClick={() => setProcessDrawerOpen(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Process
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {processes.map(renderProcessCard)}
        </div>
      )}
    </div>
  )

  // Canvas View
  const renderCanvasView = () => {
    const selectedProcess = processes.find(p => p.id === selectedProcessId)
    
    return (
      <div className="space-y-6">
        {/* Canvas Header */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('processes')}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedProcess?.name || 'Process Canvas'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProcess?.description || 'Design your financial process workflow'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`btn-secondary inline-flex items-center gap-2 ${showGrid ? 'bg-indigo-50 text-indigo-600' : ''}`}
              >
                <Grid className="h-4 w-4" />
                Grid
              </button>
              <button
                onClick={() => setNodeLibraryOpen(true)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Node
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={executeProcess}
                disabled={executionLoading || !selectedScenarioId}
                className="btn-primary inline-flex items-center gap-2"
              >
                {executionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Execute
              </button>
            </div>
          </div>
        </section>

        {/* Canvas */}
        <div className="relative h-[600px] rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            style={{
              backgroundImage: showGrid 
                ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
                : 'none',
              backgroundSize: showGrid ? '20px 20px' : 'auto',
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (draggedNode) {
                const position = getNodePosition(e)
                addNodeToCanvas(draggedNode, position)
                setDraggedNode(null)
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => setSelectedNode(null)}
          >
            {canvasNodes.map(renderCanvasNode)}
          </div>

          {/* Canvas Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
            <button
              onClick={() => setCanvasZoom(Math.max(0.5, canvasZoom - 0.1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
              {Math.round(canvasZoom * 100)}%
            </span>
            <button
              onClick={() => setCanvasZoom(Math.min(2, canvasZoom + 0.1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            <button
              onClick={() => {
                setCanvasZoom(1)
                setCanvasOffset({ x: 0, y: 0 })
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Selected Node Properties */}
        {selectedNode && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Node Properties: {selectedNode.name}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => {
                    setSelectedNode({ ...selectedNode, name: e.target.value })
                    setCanvasNodes(nodes => 
                      nodes.map(n => n.id === selectedNode.id ? { ...n, name: e.target.value } : n)
                    )
                  }}
                  className="form-input"
                />
              </div>
              <div>
                <label className="label">Type</label>
                <input
                  type="text"
                  value={selectedNode.type}
                  disabled
                  className="form-input bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Description</label>
                <textarea
                  value={selectedNode.description}
                  onChange={(e) => {
                    setSelectedNode({ ...selectedNode, description: e.target.value })
                    setCanvasNodes(nodes => 
                      nodes.map(n => n.id === selectedNode.id ? { ...n, description: e.target.value } : n)
                    )
                  }}
                  className="form-input resize-none"
                  rows={3}
                />
              </div>
            </div>
          </section>
        )}
      </div>
    )
  }

  useEffect(() => {
    fetchProcesses()
  }, [fetchProcesses])

  useEffect(() => {
    if (!processes.length) {
      setSelectedProcessId(null)
      return
    }
    setSelectedProcessId((current) => {
      if (current && processes.some((process) => process.id === current)) {
        return current
      }
      return processes[0]?.id ?? null
    })
  }, [processes])

  // Main component return
  return (
    <>
      {/* Main Content */}
      {currentView === 'processes' && renderProcessesView()}
      
      {currentView === 'canvas' && selectedProcessId && renderCanvasView()}
      
      {/* Always render modals */}
      <div>
      {/* Node Library Modal */}
      {nodeLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Process Node</h2>
              <button
                onClick={() => setNodeLibraryOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {NODE_LIBRARY.map((nodeType) => {
                  const IconComponent = nodeType.icon
                  return (
                    <div
                      key={nodeType.type}
                      className="group relative flex flex-col p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 hover:shadow-md transition cursor-pointer"
                      draggable
                      onDragStart={() => setDraggedNode(nodeType.type)}
                      onClick={() => {
                        addNodeToCanvas(nodeType.type, { x: 100, y: 100 })
                        setNodeLibraryOpen(false)
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${nodeType.color} text-white`}>
                          <IconComponent className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{nodeType.title}</h3>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400">{nodeType.category}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{nodeType.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Process Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* General Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">General Settings</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Consolidation Method</label>
                      <select className="form-select">
                        <option value="full">Full Consolidation</option>
                        <option value="proportional">Proportional Consolidation</option>
                        <option value="equity">Equity Method</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Reporting Currency</label>
                      <select className="form-select">
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Elimination Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Elimination Settings</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Eliminate intercompany transactions
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Eliminate intercompany balances
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox" />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Apply minority interest adjustments
                      </span>
                    </label>
                  </div>
                </div>

                {/* FX Translation Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">FX Translation</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Translation Method</label>
                      <select className="form-select">
                        <option value="current">Current Rate Method</option>
                        <option value="temporal">Temporal Method</option>
                        <option value="mixed">Mixed Method</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Rate Source</label>
                      <select className="form-select">
                        <option value="manual">Manual Entry</option>
                        <option value="api">API Feed</option>
                        <option value="file">File Import</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Validation Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Validation & Controls</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Enable balance validation
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Require approval for execution
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox" />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Generate audit trail
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setSettingsOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSettingsOpen(false)
                  showNotification('Settings saved successfully', 'success')
                }}
                className="btn-primary"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Creation Modal */}
      {processDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingProcess ? 'Edit Process' : 'Create New Process'}
              </h2>
              <button
                onClick={() => {
                  setProcessDrawerOpen(false)
                  setEditingProcess(null)
                  setProcessForm({ 
                    name: '', 
                    description: '', 
                    process_type: PROCESS_TYPES[0],
                    fiscal_year: new Date().getFullYear(),
                    reporting_currency: 'USD'
                  })
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Process Name *</label>
                <input
                  type="text"
                  value={processForm.name}
                  onChange={(e) => setProcessForm({ ...processForm, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g., 2025 Q4 Consolidation"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={processForm.description}
                  onChange={(e) => setProcessForm({ ...processForm, description: e.target.value })}
                  className="form-input resize-none"
                  rows={3}
                  placeholder="Describe the purpose of this process"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Process Type</label>
                  <select
                    value={processForm.process_type}
                    onChange={(e) => setProcessForm({ ...processForm, process_type: e.target.value })}
                    className="form-select"
                  >
                    {PROCESS_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Fiscal Year</label>
                  <input
                    type="number"
                    value={processForm.fiscal_year}
                    onChange={(e) => setProcessForm({ ...processForm, fiscal_year: parseInt(e.target.value) })}
                    className="form-input"
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>
              <div>
                <label className="label">Reporting Currency</label>
                <select
                  value={processForm.reporting_currency}
                  onChange={(e) => setProcessForm({ ...processForm, reporting_currency: e.target.value })}
                  className="form-select"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setProcessDrawerOpen(false)
                    setEditingProcess(null)
                    setProcessForm({ 
                      name: '', 
                      description: '', 
                      process_type: PROCESS_TYPES[0],
                      fiscal_year: new Date().getFullYear(),
                      reporting_currency: 'USD'
                    })
                  }}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={saveProcess}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                  disabled={loading || !processForm.name.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {editingProcess ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {editingProcess ? 'Update Process' : 'Create Process'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-lg ${
            notification.type === 'success'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-200'
              : 'border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-400 dark:bg-rose-900/30 dark:text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs uppercase tracking-wide">
            Dismiss
          </button>
        </div>
      )}
      </div>
    </>
  )
}

export default Process
