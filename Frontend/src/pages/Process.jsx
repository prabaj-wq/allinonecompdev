
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
  },
  {
    type: 'fiscal_management',
    title: 'Fiscal Year & Scenario Management',
    description: 'Manage fiscal periods, scenarios, and consolidation rules',
    icon: Calendar,
    category: 'Management',
    color: 'bg-blue-600'
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
    fiscal_year: new Date().getFullYear()
  })
  const [processDrawerOpen, setProcessDrawerOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState(null)
  
  // Canvas State
  const [canvasMode, setCanvasMode] = useState('entity') // 'entity' or 'consolidation'
  const [canvasNodes, setCanvasNodes] = useState([])
  const [canvasConnections, setCanvasConnections] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [canvasZoom, setCanvasZoom] = useState(1)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [nodeLibraryOpen, setNodeLibraryOpen] = useState(false)
  const [draggedNode, setDraggedNode] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
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

  // Node Navigation
  const navigateToNodePage = (nodeType) => {
    const nodeRoutes = {
      'fiscal_management': '/fiscal-management',
      'profit_loss': '/financial-statements',
      'nci_allocation': '/consolidation',
      'retained_earnings': '/financial-statements',
      'fx_translation': '/forex-rates',
      'intercompany_elimination': '/consolidation',
      'goodwill_impairment': '/asset-register',
      'deferred_tax': '/financial-statements',
      'opening_balance': '/trial-balance',
      'associate_equity_method': '/consolidation',
      'eps_calculation': '/financial-statements',
      'what_if_analysis': '/what-if-analysis',
      'validation': '/audit-trail',
      'consolidation_output': '/consolidation',
      'report_generation': '/reports',
      'data_input': '/trial-balance'
    }
    
    const route = nodeRoutes[nodeType] || '/dashboard'
    navigate(route)
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
        fiscal_year: new Date().getFullYear()
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
      
      // Filter nodes by canvas mode
      const filteredNodes = (data.nodes || []).filter(node => 
        node.canvas_mode === canvasMode || !node.canvas_mode // Handle legacy nodes without canvas_mode
      )
      setCanvasNodes(filteredNodes)
      setCanvasConnections(data.connections || [])
    } catch (error) {
      console.error('Failed to load process details:', error)
      showNotification('Failed to load process details', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, getAuthHeaders, canvasMode])

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
  const addNodeToCanvas = async (nodeType, position) => {
    const nodeTemplate = NODE_LIBRARY.find(n => n.type === nodeType)
    if (!nodeTemplate) return

    const newNode = {
      id: generateNodeId(),
      type: nodeType,
      name: nodeTemplate.title,
      description: nodeTemplate.description,
      x: position?.x || Math.random() * 300 + 50,
      y: position?.y || Math.random() * 200 + 50,
      width: 200,
      height: 100,
      configuration: {},
      canvas_mode: canvasMode,
      is_active: true
    }

    // Save to backend
    try {
      const response = await fetch(
        `${API_URL}/api/financial-process/processes/${selectedProcessId}/nodes?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            type: newNode.type,
            name: newNode.name,
            description: newNode.description,
            sequence: canvasNodes.length + 1,
            x_position: newNode.x,
            y_position: newNode.y,
            canvas_mode: canvasMode,
            configuration: newNode.configuration
          })
        }
      )

      if (response.ok) {
        const savedNode = await response.json()
        newNode.id = savedNode.id // Use backend ID
        setCanvasNodes([...canvasNodes, newNode])
        setSelectedNode(newNode)
        showNotification('Node added successfully', 'success')
      } else {
        showNotification('Failed to add node', 'error')
      }
    } catch (error) {
      console.error('Error adding node:', error)
      showNotification('Error adding node', 'error')
    }
    
    setNodeLibraryOpen(false)
  }

  const updateNodePosition = async (nodeId, newPosition) => {
    setCanvasNodes(nodes => 
      nodes.map(node => 
        node.id === nodeId 
          ? { ...node, x: newPosition.x, y: newPosition.y }
          : node
      )
    )
    
    // Save position to backend
    try {
      await fetch(
        `${API_URL}/api/financial-process/nodes/${nodeId}?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ x_position: newPosition.x, y_position: newPosition.y })
        }
      )
    } catch (error) {
      console.error('Error updating node position:', error)
    }
  }

  const deleteNode = async (nodeId) => {
    try {
      await fetch(
        `${API_URL}/api/financial-process/nodes/${nodeId}?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      )
      
      setCanvasNodes(nodes => nodes.filter(n => n.id !== nodeId))
      setCanvasConnections(connections => 
        connections.filter(c => c.from_node_id !== nodeId && c.to_node_id !== nodeId)
      )
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null)
      }
      showNotification('Node deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting node:', error)
      showNotification('Error deleting node', 'error')
    }
  }

  const createConnection = async (fromNodeId, toNodeId) => {
    // Check if connection already exists
    const exists = canvasConnections.some(
      c => c.from_node_id === fromNodeId && c.to_node_id === toNodeId
    )
    if (exists) {
      showNotification('Connection already exists', 'error')
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/api/financial-process/processes/${selectedProcessId}/connections?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            from_node_id: fromNodeId,
            to_node_id: toNodeId,
            connection_type: 'data_flow',
            conditions: {},
            transformation_rules: {}
          })
        }
      )

      if (response.ok) {
        const newConnection = await response.json()
        setCanvasConnections([...canvasConnections, newConnection])
        showNotification('Connection created', 'success')
      } else {
        showNotification('Failed to create connection', 'error')
      }
    } catch (error) {
      console.error('Error creating connection:', error)
      showNotification('Error creating connection', 'error')
    }
  }

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation()
    
    // If Shift key is pressed, start connection mode
    if (e.shiftKey) {
      if (!isConnecting) {
        setIsConnecting(true)
        setConnectionStart(node.id)
      } else {
        // Complete the connection
        if (connectionStart && connectionStart !== node.id) {
          createConnection(connectionStart, node.id)
        }
        setIsConnecting(false)
        setConnectionStart(null)
      }
    } else {
      // Start dragging
      setIsDragging(true)
      setDraggedNodeId(node.id)
      setSelectedNode(node)
      
      const rect = canvasRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && draggedNodeId) {
      const rect = canvasRef.current.getBoundingClientRect()
      const newX = e.clientX - rect.left - dragOffset.x
      const newY = e.clientY - rect.top - dragOffset.y
      
      setCanvasNodes(nodes =>
        nodes.map(node =>
          node.id === draggedNodeId
            ? { ...node, x: Math.max(0, newX), y: Math.max(0, newY) }
            : node
        )
      )
    }
  }

  const handleMouseUp = () => {
    if (isDragging && draggedNodeId) {
      const draggedNode = canvasNodes.find(n => n.id === draggedNodeId)
      if (draggedNode) {
        updateNodePosition(draggedNodeId, { x: draggedNode.x, y: draggedNode.y })
      }
    }
    setIsDragging(false)
    setDraggedNodeId(null)
  }

  const startConnection = (nodeId) => {
    setIsConnecting(true)
    setConnectionStart(nodeId)
  }

  const completeConnection = (toNodeId) => {
    if (isConnecting && connectionStart && connectionStart !== toNodeId) {
      const newConnection = {
        id: `conn_${Date.now()}`,
        from_node_id: connectionStart,
        to_node_id: toNodeId,
        connection_type: 'data_flow'
      }
      setCanvasConnections([...canvasConnections, newConnection])
    }
    setIsConnecting(false)
    setConnectionStart(null)
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
      fiscal_year: process.fiscal_year
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
        className={`absolute bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg cursor-move select-none transition-all ${
          selectedNode?.id === node.id 
            ? 'border-indigo-500 shadow-indigo-200 dark:shadow-indigo-800/50 ring-2 ring-indigo-200 dark:ring-indigo-800' 
            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
        } ${isConnecting && connectionStart === node.id ? 'ring-2 ring-blue-400' : ''}`}
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
          zIndex: selectedNode?.id === node.id ? 10 : 2
        }}
        onMouseDown={(e) => handleNodeMouseDown(e, node)}
        onDoubleClick={() => navigateToNodePage(node.type)}
      >
        <div className="p-3 h-full flex flex-col relative">
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
          
          {/* Connection Points */}
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer" 
               title="Connection point" />
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer" 
               title="Connection point" />
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
              {/* Canvas Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setCanvasMode('entity')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    canvasMode === 'entity'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Entity-wise
                </button>
                <button
                  onClick={() => setCanvasMode('consolidation')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    canvasMode === 'consolidation'
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Consolidation
                </button>
              </div>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              
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
                disabled={executionLoading || canvasNodes.length === 0}
                className="btn-primary inline-flex items-center gap-2"
              >
                {executionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start Simulation
              </button>
            </div>
          </div>
        </section>

        {/* Canvas with Properties Panel */}
        <div className="flex gap-6 h-[600px]">
          {/* Main Canvas */}
          <div className="flex-1 relative rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div
              ref={canvasRef}
              className="absolute inset-0 cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedNode(null)
                  if (isConnecting) {
                    setIsConnecting(false)
                    setConnectionStart(null)
                  }
                }
              }}
            >
              {/* Render Connections */}
              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                {canvasConnections.map(connection => {
                  const fromNode = canvasNodes.find(n => n.id === connection.from_node_id)
                  const toNode = canvasNodes.find(n => n.id === connection.to_node_id)
                  if (!fromNode || !toNode) return null
                  
                  const fromX = fromNode.x + fromNode.width
                  const fromY = fromNode.y + fromNode.height / 2
                  const toX = toNode.x
                  const toY = toNode.y + toNode.height / 2
                  
                  return (
                    <line
                      key={connection.id}
                      x1={fromX}
                      y1={fromY}
                      x2={toX}
                      y2={toY}
                      stroke="#4f46e5"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  )
                })}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#4f46e5"
                    />
                  </marker>
                </defs>
              </svg>
              
              {/* Render Nodes */}
              {canvasNodes.map(renderCanvasNode)}
              
              {/* Connection Helper */}
              {isConnecting && (
                <div className="absolute top-4 left-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-2 rounded-lg text-sm">
                  Hold Shift and click another node to connect
                </div>
              )}
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
          
        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Node Properties</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Node Name</label>
                  <input
                    type="text"
                    value={selectedNode.name}
                    onChange={(e) => {
                      const updatedNode = { ...selectedNode, name: e.target.value }
                      setSelectedNode(updatedNode)
                      setCanvasNodes(nodes => 
                        nodes.map(n => n.id === selectedNode.id ? updatedNode : n)
                      )
                    }}
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={selectedNode.description}
                    onChange={(e) => {
                      const updatedNode = { ...selectedNode, description: e.target.value }
                      setSelectedNode(updatedNode)
                      setCanvasNodes(nodes => 
                        nodes.map(n => n.id === selectedNode.id ? updatedNode : n)
                      )
                    }}
                    className="form-input resize-none"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="label">Node Type</label>
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {selectedNode.type}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => navigateToNodePage(selectedNode.type)}
                    className="btn-primary flex-1 text-sm"
                  >
                    Open Module
                  </button>
                  <button
                    onClick={() => deleteNode(selectedNode.id)}
                    className="btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================================================
  // MAIN COMPONENT RETURN
  // ============================================================================
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
                    fiscal_year: new Date().getFullYear()
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
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setProcessDrawerOpen(false)
                    setEditingProcess(null)
                    setProcessForm({ 
                      name: '', 
                      description: '',
                      fiscal_year: new Date().getFullYear()
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
