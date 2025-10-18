
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
  Layers3,
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  PlayCircle,
  StopCircle
} from 'lucide-react'

// Define process flow categories
const ENTITY_FLOW = [
  'data_input',
  'journal_entry',
  'fx_translation',
  'deferred_tax',
  'profit_loss',
  'retained_earnings',
  'validation',
  'report_generation'
]

const CONSOLIDATION_FLOW = [
  'data_input',
  'intercompany_elimination',
  'nci_allocation',
  'goodwill_impairment',
  'consolidation_output',
  'report_generation'
]

// Node execution status
const NODE_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ERROR: 'error'
}

const createBezierPath = (fromX, fromY, toX, toY) => {
  const dx = Math.abs(toX - fromX)
  const control = Math.max(dx * 0.5, 80)
  const controlPoint1X = fromX + control
  const controlPoint2X = toX - control
  return `M ${fromX},${fromY} C ${controlPoint1X},${fromY} ${controlPoint2X},${toY} ${toX},${toY}`
}

const getNodeAnchorPosition = (node, side = 'out') => {
  if (!node) {
    return { x: 0, y: 0 }
  }

  const width = node.width ?? 200
  const height = node.height ?? 100
  const x = side === 'out' ? node.x + width : node.x
  const y = node.y + height / 2

  return { x, y }
}

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
    type: 'journal_entry',
    title: 'Journal Entries',
    description: 'Create and manage journal entries linked to workflows',
    icon: BookOpen,
    category: 'Journal',
    color: 'bg-rose-500'
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
  // Refs for flow management
  const flowContainerRef = useRef(null)

  // Main State
  const [currentView, setCurrentView] = useState('processes') // processes, flow, settings
  const [selectedProcessId, setSelectedProcessId] = useState(null)
  const [selectedScenarioId, setSelectedScenarioId] = useState(null)
  const [selectedEntities, setSelectedEntities] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedPeriod, setSelectedPeriod] = useState('Q4')
  const [flowMode, setFlowMode] = useState('entity') // 'entity' or 'consolidation'
  
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
  
  // Flow State
  const [processNodes, setProcessNodes] = useState([])
  const [nodeStatuses, setNodeStatuses] = useState({})
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeLibraryOpen, setNodeLibraryOpen] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionStep, setExecutionStep] = useState(0)
  const [availableEntities, setAvailableEntities] = useState([])
  const [entitySelectorOpen, setEntitySelectorOpen] = useState(false)

  // Fetch available entities from axes_entity
  const fetchAvailableEntities = useCallback(async () => {
    if (!selectedCompany || !isAuthenticated) return
    
    try {
      const response = await fetch(
        `/api/axes-entity/elements?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      )
      if (!response.ok) throw new Error('Failed to load entities')
      const data = await response.json()
      setAvailableEntities(data.elements || [])
    } catch (error) {
      console.error('Failed to load entities:', error)
      showNotification('Unable to load entities', 'error')
    }
  }, [selectedCompany, isAuthenticated, getAuthHeaders])

  // Initialize process nodes based on flow mode
  const initializeProcessNodes = useCallback(() => {
    const flowNodes = flowMode === 'entity' ? ENTITY_FLOW : CONSOLIDATION_FLOW
    const nodes = flowNodes.map((nodeType, index) => {
      const nodeTemplate = NODE_LIBRARY.find(n => n.type === nodeType)
      return {
        id: `${nodeType}_${index}`,
        type: nodeType,
        name: nodeTemplate?.title || nodeType,
        description: nodeTemplate?.description || '',
        icon: nodeTemplate?.icon || Layers,
        color: nodeTemplate?.color || 'bg-gray-500',
        category: nodeTemplate?.category || 'Processing',
        status: NODE_STATUS.PENDING,
        order: index,
        dependencies: index > 0 ? [flowNodes[index - 1]] : []
      }
    })
    setProcessNodes(nodes)
    
    // Initialize node statuses
    const statuses = {}
    nodes.forEach(node => {
      statuses[node.id] = NODE_STATUS.PENDING
    })
    setNodeStatuses(statuses)
  }, [flowMode])

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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedSettingsNode, setSelectedSettingsNode] = useState(null)
  const [nodeConfigurations, setNodeConfigurations] = useState({})


  // Utility Functions
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const authHeaders = () => getAuthHeaders()

  // Execute process simulation
  const executeProcessSimulation = async () => {
    if (!selectedProcessId || selectedEntities.length === 0) {
      showNotification('Please select entities and ensure a process is selected', 'error')
      return
    }

    setIsExecuting(true)
    setExecutionStep(0)
    
    try {
      const response = await fetch(
        `/api/financial-process/processes/${selectedProcessId}/execute-flow?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            flow_mode: flowMode,
            entities: selectedEntities,
            year: selectedYear,
            period: selectedPeriod
          })
        }
      )
      
      if (!response.ok) throw new Error('Failed to execute process flow')
      const data = await response.json()
      
      // Update node statuses based on execution results
      const flowNodes = flowMode === 'entity' ? ENTITY_FLOW : CONSOLIDATION_FLOW
      const newStatuses = {}
      
      flowNodes.forEach((nodeType, index) => {
        const nodeId = `${nodeType}_${index}`
        newStatuses[nodeId] = NODE_STATUS.COMPLETED
      })
      
      setNodeStatuses(newStatuses)
      showNotification(`Process simulation completed successfully in ${data.results.total_processing_time_ms}ms`, 'success')
      
    } catch (error) {
      console.error('Process execution failed:', error)
      showNotification('Process execution failed', 'error')
      
      // Mark all nodes as error
      const flowNodes = flowMode === 'entity' ? ENTITY_FLOW : CONSOLIDATION_FLOW
      const errorStatuses = {}
      flowNodes.forEach((nodeType, index) => {
        const nodeId = `${nodeType}_${index}`
        errorStatuses[nodeId] = NODE_STATUS.ERROR
      })
      setNodeStatuses(errorStatuses)
    } finally {
      setIsExecuting(false)
      setExecutionStep(0)
    }
  }

  // Execute individual node
  const executeNode = async (nodeId, nodeType) => {
    if (isExecuting || selectedEntities.length === 0) {
      showNotification('Please select entities before executing individual nodes', 'error')
      return
    }
    
    setNodeStatuses(prev => ({ ...prev, [nodeId]: NODE_STATUS.RUNNING }))
    
    try {
      const response = await fetch(
        `/api/financial-process/processes/${selectedProcessId}/execute-node?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            node_id: nodeId,
            node_type: nodeType,
            entities: selectedEntities,
            year: selectedYear,
            period: selectedPeriod
          })
        }
      )
      
      if (!response.ok) throw new Error('Failed to execute node')
      const data = await response.json()
      
      if (data.status === 'success') {
        setNodeStatuses(prev => ({ ...prev, [nodeId]: NODE_STATUS.COMPLETED }))
        showNotification(`${nodeType} executed successfully`, 'success')
      } else {
        setNodeStatuses(prev => ({ ...prev, [nodeId]: NODE_STATUS.ERROR }))
        showNotification(`Failed to execute ${nodeType}: ${data.results?.message || 'Unknown error'}`, 'error')
      }
    } catch (error) {
      console.error('Node execution failed:', error)
      setNodeStatuses(prev => ({ ...prev, [nodeId]: NODE_STATUS.ERROR }))
      showNotification(`Failed to execute ${nodeType}`, 'error')
    }
  }

  // Node Navigation with context
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
      'data_input': '/trial-balance',
      'journal_entry': '/journal-entries'
    }
    
    const route = nodeRoutes[nodeType] || '/dashboard'
    
    // Pass context parameters
    const params = new URLSearchParams({
      year: selectedYear.toString(),
      period: selectedPeriod,
      entities: selectedEntities.join(','),
      process: selectedProcessId || ''
    })
    
    navigate(`${route}?${params.toString()}`)
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

  // Fetch Process Details and initialize nodes
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
      
      // Initialize process nodes based on flow mode
      initializeProcessNodes()
      
    } catch (error) {
      console.error('Failed to load process details:', error)
      showNotification('Failed to load process details', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, getAuthHeaders, initializeProcessNodes])

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


  // Add node to flow
  const addNodeToFlow = (nodeType) => {
    const nodeTemplate = NODE_LIBRARY.find(n => n.type === nodeType)
    if (!nodeTemplate) return

    const newNode = {
      id: `${nodeType}_${processNodes.length}`,
      type: nodeType,
      name: nodeTemplate.title,
      description: nodeTemplate.description,
      icon: nodeTemplate.icon,
      color: nodeTemplate.color,
      category: nodeTemplate.category,
      status: NODE_STATUS.PENDING,
      order: processNodes.length,
      dependencies: processNodes.length > 0 ? [processNodes[processNodes.length - 1].type] : []
    }

    setProcessNodes([...processNodes, newNode])
    setNodeStatuses(prev => ({ ...prev, [newNode.id]: NODE_STATUS.PENDING }))
    showNotification('Node added to flow', 'success')
    setNodeLibraryOpen(false)
  }

  // Remove node from flow
  const removeNodeFromFlow = (nodeId) => {
    setProcessNodes(nodes => nodes.filter(n => n.id !== nodeId))
    setNodeStatuses(prev => {
      const newStatuses = { ...prev }
      delete newStatuses[nodeId]
      return newStatuses
    })
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
    showNotification('Node removed from flow', 'success')
  }

  // Move node in flow
  const moveNodeInFlow = (nodeId, direction) => {
    const nodeIndex = processNodes.findIndex(n => n.id === nodeId)
    if (nodeIndex === -1) return
    
    const newIndex = direction === 'up' ? nodeIndex - 1 : nodeIndex + 1
    if (newIndex < 0 || newIndex >= processNodes.length) return
    
    const newNodes = [...processNodes]
    const [movedNode] = newNodes.splice(nodeIndex, 1)
    newNodes.splice(newIndex, 0, { ...movedNode, order: newIndex })
    
    // Update orders
    newNodes.forEach((node, index) => {
      node.order = index
    })
    
    setProcessNodes(newNodes)
  }

  // Get node status icon and color
  const getNodeStatusIcon = (status) => {
    switch (status) {
      case NODE_STATUS.COMPLETED:
        return { icon: CheckCircle, color: 'text-green-500' }
      case NODE_STATUS.RUNNING:
        return { icon: Loader2, color: 'text-blue-500 animate-spin' }
      case NODE_STATUS.ERROR:
        return { icon: AlertCircle, color: 'text-red-500' }
      default:
        return { icon: Clock, color: 'text-gray-400' }
    }
  }

  // Reset all node statuses
  const resetNodeStatuses = () => {
    const resetStatuses = {}
    processNodes.forEach(node => {
      resetStatuses[node.id] = NODE_STATUS.PENDING
    })
    setNodeStatuses(resetStatuses)
    showNotification('Node statuses reset', 'success')
  }

  // Toggle entity selection
  const toggleEntitySelection = (entityCode) => {
    setSelectedEntities(prev => {
      if (prev.includes(entityCode)) {
        return prev.filter(e => e !== entityCode)
      } else {
        return [...prev, entityCode]
      }
    })
  }

  // Select all entities
  const selectAllEntities = () => {
    setSelectedEntities(availableEntities.map(e => e.element_code))
  }

  // Clear entity selection
  const clearEntitySelection = () => {
    setSelectedEntities([])
  }

  // Node configuration functions
  const updateNodeConfiguration = (nodeType, config) => {
    setNodeConfigurations(prev => ({
      ...prev,
      [nodeType]: { ...prev[nodeType], ...config }
    }))
  }

  // Get node configuration with defaults
  const getNodeConfiguration = (nodeType) => {
    const defaults = {
      fiscal_management: {
        years: [2023, 2024, 2025, 2026],
        periods: ['Q1', 'Q2', 'Q3', 'Q4', 'FY'],
        default_year: selectedYear,
        default_period: selectedPeriod
      },
      data_input: {
        included_entities: selectedEntities,
        excluded_entities: [],
        data_sources: ['Trial Balance', 'Manual Entry', 'Import'],
        validation_rules: true
      },
      journal_entry: {
        auto_reverse: false,
        approval_required: true,
        included_entities: selectedEntities,
        excluded_entities: []
      },
      fx_translation: {
        method: 'current_rate',
        rate_source: 'central_bank',
        included_entities: selectedEntities,
        excluded_entities: []
      },
      consolidation_output: {
        elimination_method: 'full',
        nci_calculation: 'proportional',
        included_entities: selectedEntities,
        excluded_entities: []
      }
    }
    
    return {
      ...defaults[nodeType],
      ...nodeConfigurations[nodeType]
    }
  }

  // Render flow node tile
  const renderFlowNodeTile = (node, index) => {
    const IconComponent = node.icon || Layers
    const status = nodeStatuses[node.id] || NODE_STATUS.PENDING
    const statusInfo = getNodeStatusIcon(status)
    const StatusIcon = statusInfo.icon
    
    return (
      <div key={node.id} className="flex items-center">
        {/* Node Tile */}
        <div
          className={`relative flex-shrink-0 w-64 h-32 bg-white dark:bg-gray-800 border-2 rounded-xl shadow-lg cursor-pointer transition-all hover:shadow-xl ${
            selectedNode?.id === node.id
              ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
              : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
          }`}
          onClick={() => setSelectedNode(node)}
          onDoubleClick={() => navigateToNodePage(node.type)}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${node.color} text-white`}>
                  <IconComponent className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {node.name}
                  </h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    {node.category}
                  </p>
                </div>
              </div>
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 flex-1 overflow-hidden line-clamp-2">
              {node.description}
            </p>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Step {index + 1}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    executeNode(node.id, node.name)
                  }}
                  disabled={isExecuting || status === NODE_STATUS.RUNNING}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Run this step"
                >
                  <PlayCircle className="h-4 w-4 text-green-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeNodeFromFlow(node.id)
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Remove from flow"
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Arrow connector */}
        {index < processNodes.length - 1 && (
          <div className="flex-shrink-0 mx-4">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>
    )
  }

  // Render entity selector
  const renderEntitySelector = () => (
    <div className="relative">
      <button
        onClick={() => setEntitySelectorOpen(!entitySelectorOpen)}
        className="btn-secondary inline-flex items-center gap-2 min-w-48"
      >
        <Building2 className="h-4 w-4" />
        {selectedEntities.length === 0
          ? 'Select Entities'
          : selectedEntities.length === 1
          ? `1 Entity Selected`
          : `${selectedEntities.length} Entities Selected`
        }
        <ChevronDown className={`h-4 w-4 transition-transform ${
          entitySelectorOpen ? 'rotate-180' : ''
        }`} />
      </button>
      
      {entitySelectorOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Select Entities</h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllEntities}
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Select All
                </button>
                <button
                  onClick={clearEntitySelection}
                  className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {availableEntities.map((entity) => (
                <label key={entity.element_code} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEntities.includes(entity.element_code)}
                    onChange={() => toggleEntitySelection(entity.element_code)}
                    className="form-checkbox mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {entity.element_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {entity.element_code}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ============================================================================
  // USE EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchProcesses()
    fetchReferenceData()
    fetchAvailableEntities()
  }, [fetchProcesses, fetchReferenceData, fetchAvailableEntities])

  useEffect(() => {
    if (selectedProcessId) {
      fetchProcessDetails(selectedProcessId)
      fetchScenarios(selectedProcessId)
    }
  }, [selectedProcessId, fetchProcessDetails, fetchScenarios])

  useEffect(() => {
    initializeProcessNodes()
  }, [flowMode, initializeProcessNodes])

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
        setCurrentView('flow')
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

  // Render process flow diagram
  const renderFlowDiagram = () => (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Process Flow Diagram</h3>
        <div className="flex gap-2">
          <button
            onClick={resetNodeStatuses}
            className="btn-secondary text-sm"
            disabled={isExecuting}
          >
            Reset Status
          </button>
        </div>
      </div>
      
      {processNodes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Workflow className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No nodes in the flow. Add nodes to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center gap-0 min-w-max">
            {processNodes.map((node, index) => renderFlowNodeTile(node, index))}
          </div>
        </div>
      )}
    </div>
  )

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

  // Flow View
  const renderFlowView = () => {
    const selectedProcess = processes.find(p => p.id === selectedProcessId)
    
    return (
      <div className="space-y-6">
        {/* Flow Header */}
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
                  {selectedProcess?.name || 'Process Flow'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProcess?.description || 'Execute your financial process workflow'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={executeProcessSimulation}
                disabled={isExecuting || selectedEntities.length === 0 || processNodes.length === 0}
                className="btn-primary inline-flex items-center gap-2"
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run Simulation
              </button>
              <button
                onClick={() => {
                  setCurrentView('settings')
                  setSelectedSettingsNode(null)
                }}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
          </div>
        </section>

        {/* Process Controls */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex flex-wrap items-center gap-4">
            {/* Entity Selector */}
            {renderEntitySelector()}
            
            {/* Year and Period Selectors */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="form-select text-sm"
              >
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="form-select text-sm"
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
                <option value="FY">Full Year</option>
              </select>
            </div>
            
            {/* Flow Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setFlowMode('entity')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  flowMode === 'entity'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Entity-wise
              </button>
              <button
                onClick={() => setFlowMode('consolidation')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  flowMode === 'consolidation'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Consolidation
              </button>
            </div>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            
            <button
              onClick={() => setNodeLibraryOpen(!nodeLibraryOpen)}
              className={`inline-flex items-center gap-2 text-sm ${
                nodeLibraryOpen 
                  ? 'btn-primary' 
                  : 'btn-secondary'
              }`}
            >
              <Plus className="h-4 w-4" />
              {nodeLibraryOpen ? 'Hide Library' : 'Add Nodes'}
            </button>
          </div>
        </section>

        {/* Node Library Panel */}
        {nodeLibraryOpen && (
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 overflow-hidden">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Available Process Nodes - Click to add to flow
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {NODE_LIBRARY.map((nodeType) => {
                  const IconComponent = nodeType.icon
                  return (
                    <div
                      key={nodeType.type}
                      onClick={() => addNodeToFlow(nodeType.type)}
                      className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-400 hover:shadow-md transition cursor-pointer bg-white dark:bg-gray-900 group"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${nodeType.color} text-white`}>
                          <IconComponent className="h-4 w-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {nodeType.title}
                          </h4>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400">
                            {nodeType.category}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {nodeType.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Process Flow Diagram */}
        {renderFlowDiagram()}

        {/* Properties Panel */}
        {selectedNode && (
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Node Properties</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="label">Node Name</label>
                    <input
                      type="text"
                      value={selectedNode.name}
                      onChange={(e) => {
                        const updatedNode = { ...selectedNode, name: e.target.value }
                        setSelectedNode(updatedNode)
                        setProcessNodes(nodes => 
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
                        setProcessNodes(nodes => 
                          nodes.map(n => n.id === selectedNode.id ? updatedNode : n)
                        )
                      }}
                      className="form-input resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="label">Node Type</label>
                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {selectedNode.type}
                    </div>
                  </div>
                  
                  <div>
                    <label className="label">Status</label>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const status = nodeStatuses[selectedNode.id] || NODE_STATUS.PENDING
                        const statusInfo = getNodeStatusIcon(status)
                        const StatusIcon = statusInfo.icon
                        return (
                          <>
                            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                            <span className="text-sm capitalize">{status}</span>
                          </>
                        )
                      })()} 
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
                      onClick={() => removeNodeFromFlow(selectedNode.id)}
                      className="btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    )
  }

  // Settings View
  const renderSettingsView = () => {
    const selectedProcess = processes.find(p => p.id === selectedProcessId)
    const flowNodes = flowMode === 'entity' ? ENTITY_FLOW : CONSOLIDATION_FLOW
    
    return (
      <div className="space-y-6">
        {/* Settings Header */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('flow')}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to Process
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Process Settings - {selectedProcess?.name}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure individual nodes and their dependencies
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Settings Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Node List */}
          <div className="col-span-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Process Nodes</h3>
              <div className="space-y-2">
                {flowNodes.map((nodeType, index) => {
                  const nodeTemplate = NODE_LIBRARY.find(n => n.type === nodeType)
                  const IconComponent = nodeTemplate?.icon || Layers
                  const isSelected = selectedSettingsNode === nodeType
                  
                  return (
                    <button
                      key={nodeType}
                      onClick={() => setSelectedSettingsNode(nodeType)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${nodeTemplate?.color || 'bg-gray-500'} text-white`}>
                          <IconComponent className="h-4 w-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {nodeTemplate?.title || nodeType}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Step {index + 1}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Panel - Node Configuration */}
          <div className="col-span-8">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              {selectedSettingsNode ? (
                <div>
                  {(() => {
                    const nodeTemplate = NODE_LIBRARY.find(n => n.type === selectedSettingsNode)
                    const IconComponent = nodeTemplate?.icon || Layers
                    const config = getNodeConfiguration(selectedSettingsNode)
                    
                    return (
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${nodeTemplate?.color || 'bg-gray-500'} text-white`}>
                            <IconComponent className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {nodeTemplate?.title || selectedSettingsNode}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {nodeTemplate?.description}
                            </p>
                          </div>
                        </div>

                        {/* Node-specific configuration */}
                        {selectedSettingsNode === 'fiscal_management' && (
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Fiscal Year Settings</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="label">Available Years</label>
                                  <div className="space-y-2">
                                    {[2023, 2024, 2025, 2026].map(year => (
                                      <label key={year} className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={config.years?.includes(year)}
                                          onChange={(e) => {
                                            const years = config.years || []
                                            if (e.target.checked) {
                                              updateNodeConfiguration(selectedSettingsNode, {
                                                years: [...years, year]
                                              })
                                            } else {
                                              updateNodeConfiguration(selectedSettingsNode, {
                                                years: years.filter(y => y !== year)
                                              })
                                            }
                                          }}
                                          className="form-checkbox mr-2"
                                        />
                                        <span className="text-sm">{year}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="label">Available Periods</label>
                                  <div className="space-y-2">
                                    {['Q1', 'Q2', 'Q3', 'Q4', 'FY'].map(period => (
                                      <label key={period} className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={config.periods?.includes(period)}
                                          onChange={(e) => {
                                            const periods = config.periods || []
                                            if (e.target.checked) {
                                              updateNodeConfiguration(selectedSettingsNode, {
                                                periods: [...periods, period]
                                              })
                                            } else {
                                              updateNodeConfiguration(selectedSettingsNode, {
                                                periods: periods.filter(p => p !== period)
                                              })
                                            }
                                          }}
                                          className="form-checkbox mr-2"
                                        />
                                        <span className="text-sm">{period}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Entity-based nodes configuration */}
                        {['data_input', 'journal_entry', 'fx_translation', 'consolidation_output'].includes(selectedSettingsNode) && (
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Entity Configuration</h4>
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <label className="label">Included Entities</label>
                                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                    {availableEntities.map(entity => (
                                      <label key={entity.element_code} className="flex items-center p-1">
                                        <input
                                          type="checkbox"
                                          checked={config.included_entities?.includes(entity.element_code)}
                                          onChange={(e) => {
                                            const included = config.included_entities || []
                                            if (e.target.checked) {
                                              updateNodeConfiguration(selectedSettingsNode, {
                                                included_entities: [...included, entity.element_code]
                                              })
                                            } else {
                                              updateNodeConfiguration(selectedSettingsNode, {
                                                included_entities: included.filter(e => e !== entity.element_code)
                                              })
                                            }
                                          }}
                                          className="form-checkbox mr-2"
                                        />
                                        <span className="text-sm">{entity.element_name}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="label">Excluded Entities</label>
                                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                    {availableEntities.map(entity => (
                                      <label key={entity.element_code} className="flex items-center p-1">
                                        <input
                                          type="checkbox"
                                          checked={config.excluded_entities?.includes(entity.element_code)}
                                          onChange={(e) => {
                                            const excluded = config.excluded_entities || []
                                            if (e.target.checked) {
                                              updateNodeConfiguration(selectedSettingsNode, {
                                                excluded_entities: [...excluded, entity.element_code]
                                              })
                                            } else {
                                              updateNodeConfiguration(selectedSettingsNode, {
                                                excluded_entities: excluded.filter(e => e !== entity.element_code)
                                              })
                                            }
                                          }}
                                          className="form-checkbox mr-2"
                                        />
                                        <span className="text-sm">{entity.element_name}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Node-specific settings */}
                            {selectedSettingsNode === 'journal_entry' && (
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Journal Entry Settings</h4>
                                <div className="space-y-3">
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={config.auto_reverse}
                                      onChange={(e) => updateNodeConfiguration(selectedSettingsNode, {
                                        auto_reverse: e.target.checked
                                      })}
                                      className="form-checkbox mr-2"
                                    />
                                    <span className="text-sm">Auto-reverse entries</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={config.approval_required}
                                      onChange={(e) => updateNodeConfiguration(selectedSettingsNode, {
                                        approval_required: e.target.checked
                                      })}
                                      className="form-checkbox mr-2"
                                    />
                                    <span className="text-sm">Require approval</span>
                                  </label>
                                </div>
                              </div>
                            )}

                            {selectedSettingsNode === 'fx_translation' && (
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3">FX Translation Settings</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="label">Translation Method</label>
                                    <select
                                      value={config.method || 'current_rate'}
                                      onChange={(e) => updateNodeConfiguration(selectedSettingsNode, {
                                        method: e.target.value
                                      })}
                                      className="form-select"
                                    >
                                      <option value="current_rate">Current Rate Method</option>
                                      <option value="temporal">Temporal Method</option>
                                      <option value="monetary_nonmonetary">Monetary/Non-monetary</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="label">Rate Source</label>
                                    <select
                                      value={config.rate_source || 'central_bank'}
                                      onChange={(e) => updateNodeConfiguration(selectedSettingsNode, {
                                        rate_source: e.target.value
                                      })}
                                      className="form-select"
                                    >
                                      <option value="central_bank">Central Bank</option>
                                      <option value="bloomberg">Bloomberg</option>
                                      <option value="manual">Manual Entry</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Save Configuration */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setSelectedSettingsNode(null)}
                              className="btn-secondary"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                showNotification(`Configuration saved for ${nodeTemplate?.title}`, 'success')
                              }}
                              className="btn-primary"
                            >
                              Save Configuration
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })()} 
                </div>
              ) : (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a Node to Configure
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a node from the left panel to configure its settings and dependencies.
                  </p>
                </div>
              )}
            </div>
          </div>
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
      
      {currentView === 'flow' && selectedProcessId && renderFlowView()}
      
      {currentView === 'settings' && selectedProcessId && renderSettingsView()}
      
      {/* Click outside to close entity selector */}
      {entitySelectorOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setEntitySelectorOpen(false)}
        />
      )}
      
      {/* Always render modals */}
      <div>
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
