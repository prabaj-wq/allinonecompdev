import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../contexts/AuthContext'
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
  const { isAuthenticated, getAuthHeaders } = useAuth()
  const navigate = useNavigate()

  // Main State
  const [currentView, setCurrentView] = useState('overview')
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [processDrawerOpen, setProcessDrawerOpen] = useState(false)
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

  // Initialize with demo processes
  useEffect(() => {
    console.log('🚀 Process module initializing...')
    
    const demoProcesses = [
      {
        id: 'demo-1',
        name: 'Actuals',
        description: 'Actual financial consolidation process',
        type: 'actuals',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'demo-2', 
        name: 'Budget',
        description: 'Budget planning and consolidation',
        type: 'budget',
        status: 'draft',
        created_at: new Date().toISOString()
      }
    ]
    
    console.log('📋 Setting demo processes:', demoProcesses)
    setProcesses(demoProcesses)
    setLoading(false)
  }, [])

  // Save Process
  const saveProcess = async () => {
    if (!processForm.name.trim()) {
      showNotification('Please provide a process name', 'error')
      return
    }
    
    try {
      setLoading(true)
      
      const newProcess = {
        id: editingProcess?.id || `process-${Date.now()}`,
        name: processForm.name,
        description: processForm.description,
        type: processForm.type,
        fiscal_year: processForm.fiscal_year,
        reporting_currency: processForm.reporting_currency,
        settings: processForm.settings,
        status: 'active',
        created_at: editingProcess?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Update local state
      if (editingProcess) {
        setProcesses(prev => prev.map(p => p.id === editingProcess.id ? newProcess : p))
        showNotification('Process updated successfully', 'success')
      } else {
        setProcesses(prev => [...prev, newProcess])
        showNotification('Process created successfully', 'success')
      }
      
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
      showNotification('Failed to save process', 'error')
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
                      type: process.type,
                      fiscal_year: process.fiscal_year,
                      reporting_currency: process.reporting_currency,
                      settings: process.settings
                    })
                    setProcessDrawerOpen(true)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Created {new Date(process.created_at).toLocaleDateString()}
              </div>
              <button
                onClick={() => {
                  showNotification(`Opening ${process.name} process`, 'success')
                }}
                className="btn-primary text-sm"
              >
                Open Process
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Process Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your financial consolidation processes ({processes.length} processes)
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
