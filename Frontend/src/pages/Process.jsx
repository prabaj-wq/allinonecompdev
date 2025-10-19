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

// Node Library
const NODE_LIBRARY = [
  {
    type: 'data_input',
    title: 'Data Input',
    description: 'Import and validate financial data from various sources',
    icon: Upload,
    category: 'Input',
    color: 'bg-blue-500'
  },
  {
    type: 'profit_loss',
    title: 'Profit & Loss Calculation',
    description: 'Calculate comprehensive P&L statements with detailed breakdowns',
    icon: TrendingUp,
    category: 'Calculation',
    color: 'bg-green-500'
  },
  {
    type: 'nci_allocation',
    title: 'NCI Handling',
    description: 'Manage Non-Controlling Interest allocations and calculations',
    icon: Users,
    category: 'Processing',
    color: 'bg-purple-500'
  },
  {
    type: 'retained_earnings',
    title: 'Retained Earnings Rollforward',
    description: 'Calculate retained earnings movements and rollforward',
    icon: Repeat,
    category: 'Processing',
    color: 'bg-orange-500'
  },
  {
    type: 'fx_translation',
    title: 'FX Translation',
    description: 'Foreign exchange translation and currency conversion',
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
    description: 'Goodwill impairment testing and fair value adjustments',
    icon: Target,
    category: 'Processing',
    color: 'bg-indigo-500'
  },
  {
    type: 'deferred_tax',
    title: 'Deferred Taxes',
    description: 'Calculate deferred tax assets and liabilities',
    icon: DollarSign,
    category: 'Processing',
    color: 'bg-yellow-500'
  },
  {
    type: 'report_generation',
    title: 'Report Generation',
    description: 'Generate financial reports and statements',
    icon: FileSpreadsheet,
    category: 'Output',
    color: 'bg-gray-500'
  }
]

const Process = () => {
  const { selectedCompany } = useCompany()
  const { getAuthHeaders } = useAuth()
  const navigate = useNavigate()

  // Main State
  const [currentView, setCurrentView] = useState('overview')
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

  // Render workflow view
  const renderWorkflowView = () => (
    <div className="space-y-6">
      {/* Workflow Header */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setCurrentView('overview')
                setSelectedProcess(null)
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedProcess?.name} - Workflow
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Design and manage your financial process workflow
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary inline-flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button className="btn-primary inline-flex items-center gap-2">
              <Play className="h-4 w-4" />
              Run Process
            </button>
          </div>
        </div>
      </section>

      {/* Workflow Canvas */}
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Process Workflow</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag and drop nodes to build your financial process workflow
          </p>
        </div>
        
        <div className="p-6">
          {/* Node Library */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Node Library</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {NODE_LIBRARY.map((node) => {
                const IconComponent = node.icon
                return (
                  <div
                    key={node.type}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors"
                    title={node.description}
                  >
                    <div className={`w-8 h-8 rounded-lg ${node.color} flex items-center justify-center mb-2`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {node.title}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Canvas Area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 min-h-96 bg-gray-50 dark:bg-gray-900/50">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Workflow className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Workflow Canvas</h3>
              <p className="text-sm">Drag nodes from the library above to start building your workflow</p>
              <p className="text-xs mt-2">Full canvas functionality coming soon...</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )

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
