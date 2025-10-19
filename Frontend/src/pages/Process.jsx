import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import {
  Plus, Settings, Play, Pause, RotateCcw, ChevronRight, X,
  Building2, TrendingUp, Users, Repeat, Globe, Link, Target,
  DollarSign, Calendar, PieChart, Zap, AlertCircle, BarChart3,
  FileSpreadsheet, BookOpen, Upload, Layers, Workflow, Loader2
} from 'lucide-react'

// Extended Node Library with 26+ Financial Process Nodes
const NODE_LIBRARY = [
  // Data Input & Import
  {
    type: 'data_input',
    title: 'Data Input',
    description: 'Import and validate financial data from various sources',
    icon: Upload,
    category: 'Input',
    color: 'bg-blue-500'
  },
  {
    type: 'data_import',
    title: 'Data Import',
    description: 'Import from Excel, CSV, ERP systems',
    icon: Upload,
    category: 'Input',
    color: 'bg-cyan-600'
  },
  // Core Financial Calculations
  {
    type: 'profit_loss',
    title: 'P&L Calculation',
    description: 'Calculate comprehensive P&L statements with detailed breakdowns',
    icon: TrendingUp,
    category: 'Calculation',
    color: 'bg-green-500'
  },
  {
    type: 'balance_sheet',
    title: 'Balance Sheet',
    description: 'Compile and classify balance sheet items',
    icon: BarChart3,
    category: 'Calculation',
    color: 'bg-green-600'
  },
  {
    type: 'cash_flow',
    title: 'Cash Flow Statement',
    description: 'Generate cash flow statements (indirect/direct method)',
    icon: DollarSign,
    category: 'Calculation',
    color: 'bg-emerald-500'
  },
  // Consolidation Features
  {
    type: 'nci_allocation',
    title: 'NCI Handling',
    description: 'Non-Controlling Interest allocations and calculations',
    icon: Users,
    category: 'Consolidation',
    color: 'bg-purple-500'
  },
  {
    type: 'intercompany_elimination',
    title: 'IC Eliminations',
    description: 'Eliminate intercompany transactions and balances',
    icon: Link,
    category: 'Consolidation',
    color: 'bg-red-500'
  },
  {
    type: 'goodwill_impairment',
    title: 'Goodwill Test',
    description: 'Goodwill impairment testing and fair value adjustments',
    icon: Target,
    category: 'Consolidation',
    color: 'bg-indigo-500'
  },
  {
    type: 'consolidation_output',
    title: 'Consolidation Output',
    description: 'Generate consolidated statements',
    icon: Layers,
    category: 'Consolidation',
    color: 'bg-violet-600'
  },
  // Foreign Currency & Translation
  {
    type: 'fx_translation',
    title: 'FX Translation',
    description: 'Foreign exchange translation and currency conversion',
    icon: Globe,
    category: 'FX',
    color: 'bg-cyan-500'
  },
  {
    type: 'fx_revaluation',
    title: 'FX Revaluation',
    description: 'Revalue foreign currency balances',
    icon: Repeat,
    category: 'FX',
    color: 'bg-sky-500'
  },
  // Tax Calculations
  {
    type: 'deferred_tax',
    title: 'Deferred Tax',
    description: 'Calculate deferred tax assets and liabilities',
    icon: DollarSign,
    category: 'Tax',
    color: 'bg-yellow-500'
  },
  {
    type: 'current_tax',
    title: 'Current Tax',
    description: 'Calculate current period tax provision',
    icon: Calendar,
    category: 'Tax',
    color: 'bg-amber-500'
  },
  // Equity & Earnings
  {
    type: 'retained_earnings',
    title: 'Retained Earnings',
    description: 'Roll forward retained earnings',
    icon: Repeat,
    category: 'Equity',
    color: 'bg-orange-500'
  },
  {
    type: 'eps_calculation',
    title: 'EPS Calculation',
    description: 'Calculate basic and diluted EPS',
    icon: PieChart,
    category: 'Equity',
    color: 'bg-pink-500'
  },
  {
    type: 'equity_reconciliation',
    title: 'Equity Reconciliation',
    description: 'Reconcile changes in equity',
    icon: BarChart3,
    category: 'Equity',
    color: 'bg-rose-500'
  },
  // Journal Entries
  {
    type: 'journal_entry',
    title: 'Journal Entry',
    description: 'Create manual journal entries',
    icon: BookOpen,
    category: 'Journals',
    color: 'bg-blue-600'
  },
  {
    type: 'auto_journals',
    title: 'Auto Journals',
    description: 'Generate automatic adjustment journals',
    icon: Zap,
    category: 'Journals',
    color: 'bg-yellow-600'
  },
  // Opening & Closing
  {
    type: 'opening_balance',
    title: 'Opening Balance',
    description: 'Set opening balances from prior period',
    icon: Calendar,
    category: 'Period',
    color: 'bg-gray-600'
  },
  {
    type: 'closing_balance',
    title: 'Closing Balance',
    description: 'Calculate and post closing balances',
    icon: Calendar,
    category: 'Period',
    color: 'bg-slate-600'
  },
  {
    type: 'rollforward',
    title: 'Roll Forward',
    description: 'Roll forward balances to next period',
    icon: ChevronRight,
    category: 'Period',
    color: 'bg-stone-600'
  },
  // Validation & Reporting
  {
    type: 'validation',
    title: 'Validation',
    description: 'Validate balances and completeness checks',
    icon: AlertCircle,
    category: 'Validation',
    color: 'bg-red-600'
  },
  {
    type: 'reconciliation',
    title: 'Reconciliation',
    description: 'Reconcile accounts and balances',
    icon: Settings,
    category: 'Validation',
    color: 'bg-orange-600'
  },
  {
    type: 'report_generation',
    title: 'Report Generation',
    description: 'Generate financial reports and statements',
    icon: FileSpreadsheet,
    category: 'Output',
    color: 'bg-gray-500'
  },
  // Advanced Features
  {
    type: 'allocation',
    title: 'Allocation',
    description: 'Allocate costs and revenues across entities',
    icon: PieChart,
    category: 'Advanced',
    color: 'bg-purple-600'
  },
  {
    type: 'reclassification',
    title: 'Reclassification',
    description: 'Reclassify accounts and transactions',
    icon: Repeat,
    category: 'Advanced',
    color: 'bg-indigo-600'
  },
  {
    type: 'custom_calculation',
    title: 'Custom Calculation',
    description: 'Execute custom business logic',
    icon: Settings,
    category: 'Advanced',
    color: 'bg-slate-500'
  }
]

const Process = () => {
  const { selectedCompany } = useCompany()
  const { getAuthHeaders } = useAuth()
  const navigate = useNavigate()

  // Main State
  const [currentView, setCurrentView] = useState('overview') // 'overview', 'workflow', 'settings'
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [processDrawerOpen, setProcessDrawerOpen] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState(null)
  const [processForm, setProcessForm] = useState({
    name: '',
    description: '',
    type: 'actuals',
    fiscal_year: new Date().getFullYear(),
    reporting_currency: 'USD',
    settings: {}
  })
  const [editingProcess, setEditingProcess] = useState(null)
  const [notification, setNotification] = useState(null)
  
  // Workflow State
  const [workflowNodes, setWorkflowNodes] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [showNodeLibrary, setShowNodeLibrary] = useState(false)
  const [nodeFilter, setNodeFilter] = useState('all') // Category filter
  
  // Get unique categories from NODE_LIBRARY
  const categories = ['all', ...new Set(NODE_LIBRARY.map(node => node.category))]

  // Utility Functions
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // Fetch processes from database
  const fetchProcesses = async () => {
    if (!selectedCompany) return
    
    try {
      setLoading(true)
      console.log('🚀 Fetching processes for company:', selectedCompany)
      
      const response = await fetch(`/api/financial-process/processes?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.')
        } else if (response.status === 404) {
          throw new Error('Company database not found.')
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }
      
      const data = await response.json()
      console.log('📋 Fetched processes:', data)
      setProcesses((data && Array.isArray(data)) ? data : (data?.processes || []))
    } catch (error) {
      console.error('❌ Error fetching processes:', error)
      showNotification(error.message || 'Failed to load processes', 'error')
      setProcesses([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCompany && getAuthHeaders) {
      fetchProcesses()
    }
  }, [selectedCompany, getAuthHeaders])

  // Save Process
  const saveProcess = async () => {
    if (!processForm.name.trim()) {
      showNotification('Please provide a process name', 'error')
      return
    }
    
    try {
      setLoading(true)
      
      const processData = {
        name: processForm.name,
        description: processForm.description,
        process_type: processForm.type,
        fiscal_year: processForm.fiscal_year,
        reporting_currency: processForm.reporting_currency,
        settings: processForm.settings
      }
      
      let response
      if (editingProcess) {
        // Update existing process
        response = await fetch(`/api/financial-process/processes/${editingProcess.id}?company_name=${encodeURIComponent(selectedCompany)}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(processData)
        })
      } else {
        // Create new process
        response = await fetch(`/api/financial-process/processes?company_name=${encodeURIComponent(selectedCompany)}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(processData)
        })
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.')
        } else if (response.status === 404) {
          throw new Error('Company database not found.')
        } else {
          const errorText = await response.text()
          throw new Error(`Failed to save process: ${errorText || response.status}`)
        }
      }
      
      const savedProcess = await response.json()
      console.log('💾 Process saved:', savedProcess)
      
      // Refresh the processes list
      await fetchProcesses()
      
      showNotification(editingProcess ? 'Process updated successfully' : 'Process created successfully', 'success')
      
      setProcessDrawerOpen(false)
      setEditingProcess(null)
      setProcessForm({
        name: '',
        description: '',
        type: 'actuals',
        fiscal_year: new Date().getFullYear(),
        reporting_currency: 'USD',
        settings: {}
      })
    } catch (error) {
      console.error('Failed to save process:', error)
      showNotification(error.message || 'Failed to save process', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Render process cards
  const renderProcessCards = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {processes.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No processes found</p>
            <p className="text-sm">Create your first process to get started</p>
          </div>
        </div>
      ) : (
        processes.map((process) => (
          <div
            key={process.id}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {process.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {process.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  process.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {process.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingProcess(process)
                    setProcessForm({
                      name: process.name,
                      description: process.description,
                      type: process.process_type || process.type || 'actuals',
                      fiscal_year: process.fiscal_year,
                      reporting_currency: process.reporting_currency,
                      settings: process.settings || {}
                    })
                    setProcessDrawerOpen(true)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>FY {process.fiscal_year}</span>
                <span>{process.reporting_currency}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Created {new Date(process.created_at).toLocaleDateString()}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    console.log('🔧 Opening workflow for process:', process)
                    setSelectedProcess(process)
                    setCurrentView('workflow')
                    showNotification(`Opening ${process.name} workflow`, 'success')
                  }}
                  className="btn-primary text-sm flex-1"
                >
                  Open Workflow
                </button>
                <button
                  onClick={() => {
                    showNotification(`Running ${process.name} process`, 'success')
                  }}
                  className="btn-secondary text-sm px-3"
                  title="Run Process"
                >
                  <Play className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  // Add node to workflow
  const addNodeToWorkflow = (nodeType) => {
    const nodeTemplate = NODE_LIBRARY.find(n => n.type === nodeType)
    if (!nodeTemplate) return
    
    const newNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      title: nodeTemplate.title,
      description: nodeTemplate.description,
      icon: nodeTemplate.icon,
      color: nodeTemplate.color,
      category: nodeTemplate.category,
      status: 'pending', // pending, running, completed, error
      config: {},
      sequence: workflowNodes.length
    }
    
    setWorkflowNodes([...workflowNodes, newNode])
    showNotification(`Added ${nodeTemplate.title} to workflow`, 'success')
    setShowNodeLibrary(false)
  }

  // Remove node from workflow
  const removeNodeFromWorkflow = (nodeId) => {
    setWorkflowNodes(workflowNodes.filter(n => n.id !== nodeId))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
    showNotification('Node removed from workflow', 'success')
  }

  // Render workflow view with advanced layout
  const renderWorkflowView = () => {
    const filteredNodes = nodeFilter === 'all' 
      ? NODE_LIBRARY 
      : NODE_LIBRARY.filter(n => n.category === nodeFilter)

    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* Top Toolbar */}
        <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Navigation & Process Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setCurrentView('overview')
                  setSelectedProcess(null)
                  setWorkflowNodes([])
                  setSelectedNode(null)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Back to processes"
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedProcess?.name}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedProcess?.description || 'Financial Process Workflow'}
                </p>
              </div>
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowNodeLibrary(!showNodeLibrary)}
                className="btn-secondary inline-flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Node
              </button>
              <button 
                onClick={() => setCurrentView('settings')}
                className="btn-secondary inline-flex items-center gap-2 text-sm"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button 
                onClick={() => showNotification('Running simulation...', 'success')}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Play className="h-4 w-4" />
                Run Simulation
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Workflow Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Node Library Expandable Panel */}
            {showNodeLibrary && (
              <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Node Library ({filteredNodes.length} nodes)
                  </h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={nodeFilter}
                      onChange={(e) => setNodeFilter(e.target.value)}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNodeLibrary(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {/* Horizontal Scrolling Node Library */}
                <div className="overflow-x-auto">
                  <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
                    {filteredNodes.map((node) => {
                      const IconComponent = node.icon
                      return (
                        <div
                          key={node.type}
                          onClick={() => addNodeToWorkflow(node.type)}
                          className="flex-shrink-0 w-32 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all hover:shadow-md bg-white dark:bg-gray-900"
                          title={node.description}
                        >
                          <div className={`w-10 h-10 rounded-lg ${node.color} flex items-center justify-center mb-2`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2">
                            {node.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {node.category}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Workflow Nodes - Horizontal Scroll */}
            <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              {workflowNodes.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400 dark:text-gray-500">
                    <Workflow className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Nodes in Workflow</h3>
                    <p className="text-sm mb-4">Click "Add Node" to start building your process</p>
                    <button
                      onClick={() => setShowNodeLibrary(true)}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Node
                    </button>
                  </div>
                </div>
              ) : (
                <div className="min-w-max">
                  {/* Horizontal Node Flow */}
                  <div className="flex items-center gap-4">
                    {workflowNodes.map((node, index) => {
                      const IconComponent = node.icon
                      const isSelected = selectedNode?.id === node.id
                      
                      return (
                        <React.Fragment key={node.id}>
                          {/* Node Card */}
                          <div
                            onClick={() => setSelectedNode(node)}
                            onDoubleClick={() => {
                              // Navigate to relevant module
                              showNotification(`Opening ${node.title} module...`, 'success')
                              // You can add navigation logic here based on node type
                            }}
                            className={`flex-shrink-0 w-64 bg-white dark:bg-gray-950 rounded-xl shadow-md border-2 transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="p-4">
                              {/* Node Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-lg ${node.color} flex items-center justify-center flex-shrink-0`}>
                                    <IconComponent className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                      {node.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {node.category}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeNodeFromWorkflow(node.id)
                                  }}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-600"
                                  title="Remove node"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Node Description */}
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {node.description}
                              </p>

                              {/* Node Status */}
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  node.status === 'completed' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : node.status === 'running'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                    : node.status === 'error'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                  {node.status === 'completed' && '✓'}
                                  {node.status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                                  {node.status === 'error' && '!'}
                                  {node.status === 'pending' && '⏱'}
                                  <span className="ml-1">{node.status}</span>
                                </span>
                                <span className="text-xs text-gray-400">#{index + 1}</span>
                              </div>
                            </div>
                          </div>

                          {/* Arrow Connector */}
                          {index < workflowNodes.length - 1 && (
                            <ChevronRight className="h-8 w-8 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Node Settings (when node is selected) */}
          {selectedNode && (
            <div className="w-80 bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
              <div className="p-4">
                {/* Settings Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Node Settings
                  </h3>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Node Info */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    {selectedNode.icon && (
                      <div className={`w-12 h-12 rounded-lg ${selectedNode.color} flex items-center justify-center`}>
                        <selectedNode.icon className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {selectedNode.title}
                      </h4>
                      <p className="text-xs text-gray-500">{selectedNode.category}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedNode.description}
                  </p>
                </div>

                {/* Configuration Options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Node Name
                    </label>
                    <input
                      type="text"
                      value={selectedNode.title}
                      onChange={(e) => {
                        const updated = workflowNodes.map(n => 
                          n.id === selectedNode.id ? { ...n, title: e.target.value } : n
                        )
                        setWorkflowNodes(updated)
                        setSelectedNode({ ...selectedNode, title: e.target.value })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedNode.status}
                      onChange={(e) => {
                        const updated = workflowNodes.map(n => 
                          n.id === selectedNode.id ? { ...n, status: e.target.value } : n
                        )
                        setWorkflowNodes(updated)
                        setSelectedNode({ ...selectedNode, status: e.target.value })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="pending">Pending</option>
                      <option value="running">Running</option>
                      <option value="completed">Completed</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={selectedNode.description}
                      onChange={(e) => {
                        const updated = workflowNodes.map(n => 
                          n.id === selectedNode.id ? { ...n, description: e.target.value } : n
                        )
                        setWorkflowNodes(updated)
                        setSelectedNode({ ...selectedNode, description: e.target.value })
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 space-y-2">
                    <button
                      onClick={() => showNotification(`Running ${selectedNode.title}...`, 'success')}
                      className="w-full btn-primary text-sm inline-flex items-center justify-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Run This Node
                    </button>
                    <button
                      onClick={() => {
                        showNotification(`Opening ${selectedNode.title} configuration...`, 'success')
                      }}
                      className="w-full btn-secondary text-sm inline-flex items-center justify-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show loading if company is not selected yet or auth is not ready
  if (!selectedCompany || !getAuthHeaders) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">
            {!selectedCompany ? 'Loading company context...' : 'Loading authentication...'}
          </p>
        </div>
      </div>
    )
  }

  // Render based on current view
  if (currentView === 'workflow' && selectedProcess) {
    return renderWorkflowView()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Process Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage financial consolidation processes for {selectedCompany} ({processes.length} processes)
            </p>
          </div>
          <button
            onClick={() => setProcessDrawerOpen(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Process
          </button>
        </div>
      </section>

      {/* Process Cards */}
      <section>
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 p-12 text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
            Loading processes...
          </div>
        ) : (
          renderProcessCards()
        )}
      </section>

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
                    type: 'actuals',
                    fiscal_year: new Date().getFullYear(),
                    reporting_currency: 'USD',
                    settings: {}
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
                  placeholder="Enter process name"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={processForm.description}
                  onChange={(e) => setProcessForm({ ...processForm, description: e.target.value })}
                  className="form-textarea"
                  rows={3}
                  placeholder="Enter process description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    value={processForm.type}
                    onChange={(e) => setProcessForm({ ...processForm, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="actuals">Actuals</option>
                    <option value="budget">Budget</option>
                    <option value="forecast">Forecast</option>
                  </select>
                </div>
                <div>
                  <label className="label">Fiscal Year</label>
                  <select
                    value={processForm.fiscal_year}
                    onChange={(e) => setProcessForm({ ...processForm, fiscal_year: parseInt(e.target.value) })}
                    className="form-select"
                  >
                    {[2023, 2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setProcessDrawerOpen(false)
                    setEditingProcess(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProcess}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Saving...' : editingProcess ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg p-4 shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default Process
