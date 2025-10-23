import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import {
  Plus, Settings, Play, Pause, RotateCcw, ChevronRight, X,
  Building2, TrendingUp, Users, Repeat, Globe, Link, Target,
  DollarSign, Calendar, PieChart, Zap, AlertCircle, BarChart3,
  FileSpreadsheet, BookOpen, Upload, Layers, Workflow, Loader2,
  CheckCircle, Lock, Unlock
} from 'lucide-react'

// Icon mapping for converting string names to components
const ICON_MAP = {
  Upload, FileSpreadsheet, BookOpen, DollarSign, Globe, Users,
  Repeat, TrendingUp, Target, Link, PieChart, AlertCircle,
  BarChart3, Layers, Zap, CheckCircle, Settings, Calendar,
  Building2, Workflow, Plus, Play, Pause, RotateCcw, ChevronRight, X, Lock, Unlock
}

// Helper function to get icon component from string name
const getIconComponent = (iconName) => {
  if (typeof iconName === 'function') return iconName // Already a component
  if (typeof iconName === 'string' && ICON_MAP[iconName]) return ICON_MAP[iconName]
  return FileSpreadsheet // Default fallback icon
}

// Helper function to get icon name from component (for saving)
const getIconName = (iconComponent) => {
  if (typeof iconComponent === 'string') return iconComponent // Already a string
  // Find the icon name by comparing the component
  for (const [name, component] of Object.entries(ICON_MAP)) {
    if (component === iconComponent) return name
  }
  return 'FileSpreadsheet' // Default fallback
}

// Helper to serialize nodes (convert icons to strings)
const serializeNodes = (nodes) => {
  return nodes.map(node => ({
    ...node,
    icon: getIconName(node.icon)
  }))
}

// Helper to deserialize nodes (convert icon strings back to components)
const deserializeNodes = (nodes) => {
  if (!Array.isArray(nodes)) return []
  return nodes.map(node => ({
    ...node,
    icon: getIconComponent(node.icon)
  }))
}

// Node Library - Segregated by Entity-wise and Consolidation flows
const NODE_LIBRARY = [
  // ==================== ENTITY-WISE NODES ====================
  {
    type: 'data_input',
    title: 'Data Input',
    description: 'Import and validate financial data from various sources',
    icon: Upload,
    category: 'Entity',
    flowType: 'entity',
    color: 'bg-blue-500',
    dependencies: []
  },
  {
    type: 'journal_entry',
    title: 'Journal Entries',
    description: 'Create and manage journal entries',
    icon: BookOpen,
    category: 'Entity',
    flowType: 'entity',
    color: 'bg-blue-600',
    dependencies: ['data_input']
  },
  {
    type: 'roll_forward',
    title: 'Roll Forward',
    description: 'Roll forward balances to next period',
    icon: Repeat,
    category: 'Entity',
    flowType: 'entity',
    color: 'bg-purple-600',
    dependencies: []
  },
  {
    type: 'fx_translation',
    title: 'FX Translation',
    description: 'Foreign exchange translation and currency conversion',
    icon: Globe,
    category: 'Entity',
    flowType: 'entity',
    color: 'bg-cyan-500',
    dependencies: ['journal_entry']
  },
  {
    type: 'deferred_tax',
    title: 'Deferred Tax',
    description: 'Calculate deferred tax assets and liabilities',
    icon: DollarSign,
    category: 'Entity',
    flowType: 'entity',
    color: 'bg-yellow-500',
    dependencies: ['profit_loss']
  },
  {
    type: 'goodwill',
    title: 'Goodwill',
    description: 'Goodwill impairment testing and adjustments',
    icon: Target,
    category: 'Entity',
    flowType: 'both',
    color: 'bg-indigo-500',
    dependencies: []
  },
  {
    type: 'profit_loss',
    title: 'Profit & Loss',
    description: 'Calculate comprehensive P&L statements',
    icon: TrendingUp,
    category: 'Entity',
    flowType: 'entity',
    color: 'bg-green-500',
    dependencies: ['journal_entry', 'fx_translation']
  },
  {
    type: 'retained_earnings',
    title: 'Retained Earnings',
    description: 'Roll forward retained earnings',
    icon: Repeat,
    category: 'Entity',
    flowType: 'entity',
    color: 'bg-orange-500',
    dependencies: ['profit_loss']
  },
  {
    type: 'eps_calculation',
    title: 'EPS Calculation',
    description: 'Calculate basic and diluted earnings per share',
    icon: PieChart,
    category: 'Entity',
    flowType: 'entity',
    color: 'bg-pink-500',
    dependencies: ['profit_loss']
  },
  {
    type: 'opening_balance',
    title: 'Opening Balance Adjustments',
    description: 'Set and adjust opening balances from prior period',
    icon: Calendar,
    category: 'Entity',
    flowType: 'entity',
    color: 'bg-gray-600',
    dependencies: []
  },
  {
    type: 'validation',
    title: 'Validation',
    description: 'Validate balances and completeness checks',
    icon: AlertCircle,
    category: 'Entity',
    flowType: 'both',
    color: 'bg-red-600',
    dependencies: []
  },
  {
    type: 'custom_calculation',
    title: 'Custom Calculation Logic',
    description: 'Execute custom business calculation logic',
    icon: Settings,
    category: 'Entity',
    flowType: 'both',
    color: 'bg-slate-500',
    dependencies: []
  },
  {
    type: 'reports',
    title: 'Reports',
    description: 'Generate financial reports and statements',
    icon: FileSpreadsheet,
    category: 'Entity',
    flowType: 'both',
    color: 'bg-gray-500',
    dependencies: []
  },
  {
    type: 'compare_scenarios',
    title: 'Compare Scenarios',
    description: 'Compare actuals vs budget vs forecast',
    icon: BarChart3,
    category: 'Entity',
    flowType: 'both',
    color: 'bg-purple-500',
    dependencies: []
  },
  
  // ==================== CONSOLIDATION NODES ====================
  {
    type: 'entity_data_load',
    title: 'Entity Data Load',
    description: 'Load data from all entities for consolidation',
    icon: Upload,
    category: 'Consolidation',
    flowType: 'consolidation',
    color: 'bg-blue-500',
    dependencies: []
  },
  {
    type: 'intercompany_elimination',
    title: 'Intercompany Elimination',
    description: 'Eliminate intercompany transactions and balances',
    icon: Link,
    category: 'Consolidation',
    flowType: 'consolidation',
    color: 'bg-red-500',
    dependencies: ['entity_data_load']
  },
  {
    type: 'nci_allocation',
    title: 'NCI (Non-Controlling Interest)',
    description: 'Calculate and allocate non-controlling interest',
    icon: Users,
    category: 'Consolidation',
    flowType: 'consolidation',
    color: 'bg-purple-500',
    dependencies: ['intercompany_elimination']
  },
  {
    type: 'consolidation_output',
    title: 'Consolidation Output',
    description: 'Generate consolidated financial statements',
    icon: Layers,
    category: 'Consolidation',
    flowType: 'consolidation',
    color: 'bg-violet-600',
    dependencies: ['nci_allocation', 'goodwill']
  },
  {
    type: 'consolidated_reports',
    title: 'Consolidated Reports',
    description: 'Generate group-level consolidated reports',
    icon: FileSpreadsheet,
    category: 'Consolidation',
    flowType: 'consolidation',
    color: 'bg-indigo-600',
    dependencies: ['consolidation_output']
  }
]

// Custom Fields Configuration Component for Data Input - Entity-Aware
const DataInputCustomFieldsConfig = ({ processSettings, onUpdate, selectedEntityContext, getEntityCustomFields, updateEntityCustomFields }) => {
  const [activeTab, setActiveTab] = useState('entity_amounts')
  
  // Get entity-specific custom fields
  const entityCustomFields = selectedEntityContext ? getEntityCustomFields(selectedEntityContext) : {
    entity_amounts: [],
    ic_amounts: [],
    other_amounts: []
  }
  
  const [customFields, setCustomFields] = useState(entityCustomFields)

  // Update custom fields when entity context changes
  React.useEffect(() => {
    if (selectedEntityContext && getEntityCustomFields) {
      const newEntityCustomFields = getEntityCustomFields(selectedEntityContext)
      setCustomFields(newEntityCustomFields)
    }
  }, [selectedEntityContext, getEntityCustomFields])

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'sql_query', label: 'SQL Query' },
    { value: 'checkbox', label: 'Checkbox' }
  ]

  const addCustomField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      name: '',
      label: '',
      field_type: 'text',
      required: false,
      options: [],
      sql_query: '',
      default_value: ''
    }
    
    const updated = {
      ...customFields,
      [type]: [...customFields[type], newField]
    }
    setCustomFields(updated)
    onUpdate({ data_input_custom_fields: updated })
  }

  const updateField = (type, fieldId, updates) => {
    const updated = {
      ...customFields,
      [type]: customFields[type].map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }
    setCustomFields(updated)
    // Don't auto-save on every keystroke
  }

  const saveCustomFields = () => {
    if (selectedEntityContext && updateEntityCustomFields) {
      updateEntityCustomFields(selectedEntityContext, customFields)
    } else {
      onUpdate({ data_input_custom_fields: customFields })
    }
  }

  const removeField = (type, fieldId) => {
    const updated = {
      ...customFields,
      [type]: customFields[type].filter(f => f.id !== fieldId)
    }
    setCustomFields(updated)
    if (selectedEntityContext && updateEntityCustomFields) {
      updateEntityCustomFields(selectedEntityContext, updated)
    } else {
      onUpdate({ data_input_custom_fields: updated })
    }
  }

  const tabs = [
    { id: 'entity_amounts', label: 'Entity Amounts', icon: Building2 },
    { id: 'ic_amounts', label: 'IC Amounts', icon: Link },
    { id: 'other_amounts', label: 'Other Amounts', icon: DollarSign }
  ]

  return (
    <div className="space-y-6">
      {/* Entity Context Header */}
      {selectedEntityContext && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {selectedEntityContext === 'all' ? 'Default Custom Fields (All Entities)' : `Custom Fields for Entity: ${selectedEntityContext}`}
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {selectedEntityContext === 'all' 
                  ? 'These custom fields will apply to all entities unless overridden' 
                  : 'These custom fields are specific to this entity only'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full">
                  {customFields[tab.id].length}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Custom Fields List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Custom Fields for {tabs.find(t => t.id === activeTab)?.label}
          </h4>
          <button
            onClick={() => addCustomField(activeTab)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Field
          </button>
        </div>

        {customFields[activeTab].length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No custom fields defined yet</p>
            <button
              onClick={() => addCustomField(activeTab)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              Add your first custom field
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {customFields[activeTab].map((field, index) => (
              <div key={field.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Field #{index + 1}</span>
                  <button
                    onClick={() => removeField(activeTab, field.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Field Name (code)
                    </label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateField(activeTab, field.id, { name: e.target.value })}
                      onBlur={saveCustomFields}
                      placeholder="e.g., project_code"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Label (display)
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(activeTab, field.id, { label: e.target.value })}
                      onBlur={saveCustomFields}
                      placeholder="e.g., Project Code"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Field Type
                    </label>
                    <select
                      value={field.field_type}
                      onChange={(e) => {
                        updateField(activeTab, field.id, { field_type: e.target.value })
                        saveCustomFields()
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                    >
                      {fieldTypes.map(ft => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Value
                    </label>
                    <input
                      type="text"
                      value={field.default_value}
                      onChange={(e) => updateField(activeTab, field.id, { default_value: e.target.value })}
                      onBlur={saveCustomFields}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>

                {field.field_type === 'dropdown' && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dropdown Options (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={field.options_string || (field.options || []).join(', ')}
                      onChange={(e) => updateField(activeTab, field.id, { 
                        options_string: e.target.value
                      })}
                      onBlur={(e) => {
                        // Convert string to array on blur
                        const optionsArray = e.target.value.split(',').map(o => o.trim()).filter(o => o)
                        updateField(activeTab, field.id, { 
                          options: optionsArray,
                          options_string: e.target.value
                        })
                        saveCustomFields()
                      }}
                      placeholder="Option 1, Option 2, Option 3"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">Type your options separated by commas, then click outside to save</p>
                  </div>
                )}

                {field.field_type === 'sql_query' && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SQL Query
                    </label>
                    <textarea
                      value={field.sql_query}
                      onChange={(e) => updateField(activeTab, field.id, { sql_query: e.target.value })}
                      onBlur={saveCustomFields}
                      placeholder="SELECT id, name FROM table"
                      rows={2}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">Click outside to save</p>
                  </div>
                )}

                <div className="mt-3 flex items-center">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => {
                      updateField(activeTab, field.id, { required: e.target.checked })
                      saveCustomFields()
                    }}
                    className="rounded"
                  />
                  <label className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                    Required field
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          <strong>Note:</strong> These custom fields will appear in the Data Input page when this process is selected.
          Changes are saved automatically.
        </p>
      </div>
    </div>
  )
}

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
    settings: {}
  })
  const [editingProcess, setEditingProcess] = useState(null)
  const [notification, setNotification] = useState(null)
  
  // Workflow State
  const [workflowNodes, setWorkflowNodes] = useState([])
  const [entityWorkflowNodes, setEntityWorkflowNodes] = useState([]) // Separate for entity mode
  const [consolidationWorkflowNodes, setConsolidationWorkflowNodes] = useState([]) // Separate for consolidation mode
  const [selectedNode, setSelectedNode] = useState(null)
  const [showNodeLibrary, setShowNodeLibrary] = useState(false)
  const [nodeFilter, setNodeFilter] = useState('all') // Category filter
  
  // Flow Mode State
  const [flowMode, setFlowMode] = useState('entity') // 'entity' or 'consolidation'
  
  // Entity Selection State
  const [availableEntities, setAvailableEntities] = useState([])
  const [selectedEntities, setSelectedEntities] = useState([])
  const [showEntitySelector, setShowEntitySelector] = useState(false)
  
  // Fiscal Management State
  const [fiscalYears, setFiscalYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedPeriods, setSelectedPeriods] = useState([]) // Changed to multi-select
  const [availablePeriods, setAvailablePeriods] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [showFiscalSetup, setShowFiscalSetup] = useState(false)
  const [showPeriodSelector, setShowPeriodSelector] = useState(false)
  const [fiscalSettingsLocked, setFiscalSettingsLocked] = useState(false) // Lock fiscal settings once configured

  // Save State
  const [savingConfig, setSavingConfig] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)

  // Entity-specific Configuration State
  const [selectedEntityContext, setSelectedEntityContext] = useState('all') // 'all' or specific entity ID
  const [entityNodeConfigs, setEntityNodeConfigs] = useState({}) // { entityId: { nodeId: { enabled: true, settings: {} } } }

  const markUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  const getEntityIdentifier = useCallback((entity) => {
    return entity?.code || entity?.entity_code || entity?.id || entity?.value || ''
  }, [])

  const getEntityName = useCallback((entity) => {
    return entity?.name || entity?.entity_name || entity?.label || entity?.title || 'Unnamed Entity'
  }, [])

  const getEntityCode = useCallback((entity) => {
    return entity?.code || entity?.entity_code || getEntityIdentifier(entity)
  }, [getEntityIdentifier])

  const renderSaveStatus = useCallback(() => {
    if (hasUnsavedChanges) {
      return (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Unsaved changes</span>
        </div>
      )
    }

    if (lastSavedAt) {
      const timestamp = new Date(lastSavedAt)
      const formatted = Number.isNaN(timestamp.getTime())
        ? 'Recently'
        : timestamp.toLocaleTimeString()

      return (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>Saved {formatted}</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        <span>No changes yet</span>
      </div>
    )
  }, [hasUnsavedChanges, lastSavedAt])

  // Entity-specific workflow configuration functions
  const getEntityNodeConfig = useCallback((entityId, nodeId) => {
    const entityConfigs = entityNodeConfigs[entityId] || {}
    return entityConfigs[nodeId] || { enabled: true, settings: {} }
  }, [entityNodeConfigs])

  const updateEntityNodeConfig = useCallback((entityId, nodeId, updates) => {
    console.log(`🔧 Updating entity config for ${entityId}, node ${nodeId}:`, updates)
    setEntityNodeConfigs(prev => ({
      ...prev,
      [entityId]: {
        ...prev[entityId],
        [nodeId]: {
          ...getEntityNodeConfig(entityId, nodeId),
          ...updates
        }
      }
    }))
    setHasUnsavedChanges(true)
    markUnsavedChanges()
  }, [getEntityNodeConfig, markUnsavedChanges])

  const getEntityWorkflowNodes = useCallback((entityId) => {
    if (entityId === 'all') {
      // For "all" view, show nodes grouped by entity
      // Only show entities that actually have nodes
      const entitiesWithNodes = new Set()
      workflowNodes.forEach(node => {
        if (node.entityContext) {
          entitiesWithNodes.add(node.entityContext)
        }
      })
      
      // Return nodes only from entities that have nodes
      return workflowNodes.filter(node => 
        node.entityContext && entitiesWithNodes.has(node.entityContext)
      )
    }
    
    // Filter nodes based on entity-specific configuration AND entity context
    return workflowNodes.filter(node => {
      // Check if node was added for this specific entity
      const wasAddedForThisEntity = node.entityContext === entityId
      
      // Check if node is enabled for this entity
      const config = getEntityNodeConfig(entityId, node.id)
      const isEnabledForEntity = config.enabled
      
      // Show node if it was added for this entity OR if it's a global node that's enabled for this entity
      return wasAddedForThisEntity || (node.entityContext === undefined && isEnabledForEntity)
    })
  }, [workflowNodes, getEntityNodeConfig])

  const getEntityCustomFields = useCallback((entityId) => {
    const entityConfig = entityNodeConfigs[entityId] || {}
    const dataInputConfig = entityConfig['data_input'] || {}
    return dataInputConfig.settings?.data_input_custom_fields || {
      entity_amounts: [],
      ic_amounts: [],
      other_amounts: []
    }
  }, [entityNodeConfigs])

  const updateEntityCustomFields = useCallback((entityId, customFields) => {
    updateEntityNodeConfig(entityId, 'data_input', {
      settings: {
        data_input_custom_fields: customFields
      }
    })
  }, [updateEntityNodeConfig])

  // Get workflow nodes for current entity context
  const getCurrentWorkflowNodes = useCallback(() => {
    return getEntityWorkflowNodes(selectedEntityContext)
  }, [getEntityWorkflowNodes, selectedEntityContext])

  const syncWorkflowNodes = useCallback((updatedNodes, { markDirty = true } = {}) => {
    setWorkflowNodes(updatedNodes)

    if (flowMode === 'entity') {
      setEntityWorkflowNodes(updatedNodes)
    } else if (flowMode === 'consolidation') {
      setConsolidationWorkflowNodes(updatedNodes)
    }

    if (markDirty) {
      markUnsavedChanges()
    }
  }, [flowMode, markUnsavedChanges])
  
  // Get unique categories from NODE_LIBRARY
  const categories = ['all', ...new Set(NODE_LIBRARY.map(node => node.category))]
  
  // Get filtered nodes based on flow mode and configuration
  const getAvailableNodes = () => {
    return NODE_LIBRARY.filter(node => {
      // Check if node type already exists in workflow with specific config
      const existingNode = workflowNodes.find(n => n.type === node.type)
      
      if (existingNode && existingNode.config) {
        // If node exists in workflow, respect its config settings
        if (flowMode === 'entity') {
          return existingNode.config.availableForEntity !== false
        } else if (flowMode === 'consolidation') {
          return existingNode.config.availableForConsolidation !== false
        }
      }
      
      // Default behavior: check flowType
      return node.flowType === flowMode || node.flowType === 'both'
    })
  }

  // Utility Functions
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // Fallback data functions for development/testing when backend is unavailable

  // Fetch processes from database - with fallback data for development/testing when API is unavailable
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
          console.error('❌ Authentication failed, redirecting to login...')
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
          return
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
      // Do not inject mock data; show empty to reflect real backend state
      setProcesses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCompany && getAuthHeaders) {
      fetchProcesses()
      fetchEntities()
      fetchFiscalYears()
    }
  }, [selectedCompany, getAuthHeaders])

  // Fetch all periods when fiscal years are loaded
  useEffect(() => {
    if (fiscalYears.length > 0) {
      fetchAllPeriods()
    } else {
      // Clear periods and scenarios when no fiscal years
      setAvailablePeriods([])
      setSelectedPeriods([])
      setScenarios([])
      setSelectedScenario(null)
      setSelectedYear(null)
    }
  }, [fiscalYears])

  // Auto-select all entities when consolidation mode is selected
  useEffect(() => {
    if (flowMode === 'consolidation' && availableEntities.length > 0) {
      const allEntityIds = availableEntities.map(e => getEntityIdentifier(e))
      setSelectedEntities(allEntityIds)
    }
  }, [flowMode, availableEntities, getEntityIdentifier])

  // Load process configuration when selectedProcess changes
  useEffect(() => {
    if (selectedProcess?.id && selectedCompany) {
      console.log('🔄 Loading configuration for process:', selectedProcess.name)
      loadProcessConfiguration(selectedProcess.id)
    }
  }, [selectedProcess?.id, selectedCompany])

  // Fetch entities from AxesEntity - with fallback data for development/testing when API is unavailable
  const fetchEntities = async () => {
    if (!selectedCompany) return
    
    try {
      const response = await fetch(`/api/axes-entity/elements?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Fetched entities response:', data)
        
        // Handle different response formats
        let entities = []
        if (Array.isArray(data)) {
          entities = data
        } else if (data && Array.isArray(data.elements)) {
          entities = data.elements
        } else if (data && Array.isArray(data.entities)) {
          entities = data.entities
        }
        
        console.log('✅ Parsed entities:', entities)
        setAvailableEntities(entities)
      } else {
        console.warn('⚠️ Entity API returned status:', response.status)
        setAvailableEntities([])
      }
    } catch (error) {
      console.error('❌ Error fetching entities:', error)
      setAvailableEntities([])
    }
  }

  // Fetch fiscal years - with fallback data for development/testing when API is unavailable
  const fetchFiscalYears = async () => {
    if (!selectedCompany) return
    
    try {
      const response = await fetch(`/api/fiscal-management/fiscal-years?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany,
          ...getAuthHeaders()
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📅 Fetched fiscal years:', data)
        const years = data?.fiscal_years || data || []
        // Ensure we always set an array
        setFiscalYears(Array.isArray(years) ? years : [])
        // Periods will be fetched by useEffect when fiscalYears changes
      } else {
        console.warn('⚠️ Fiscal years API returned status:', response.status)
        // Do not inject mock data
        setFiscalYears([])
      }
    } catch (error) {
      console.error('❌ Error fetching fiscal years:', error)
      // Do not inject mock data
      setFiscalYears([])
    }
  }

  // Fetch all periods from all fiscal years
  const fetchAllPeriods = async () => {
    if (!selectedCompany || fiscalYears.length === 0) return
    
    try {
      // Fetch periods from all fiscal years
      const allPeriodsPromises = fiscalYears.map(async (fy) => {
        const response = await fetch(`/api/fiscal-management/fiscal-years/${fy.id}/periods`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Database': selectedCompany,
            ...getAuthHeaders()
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          // Add fiscal year info to each period
          return (data?.periods || []).map(period => ({
            ...period,
            fiscalYear: fy,
            fiscalYearId: fy.id,
            fiscalYearName: `${fy.year} - ${fy.name}`
          }))
        }
        return []
      })
      
      const periodsArrays = await Promise.all(allPeriodsPromises)
      const allPeriods = periodsArrays.flat()
      console.log('📊 Fetched all periods:', allPeriods)
      setAvailablePeriods(allPeriods)
    } catch (error) {
      console.error('❌ Error fetching periods:', error)
    }
  }
  
  // Fetch periods for selected year (keep for backward compatibility)
  const fetchPeriodsForYear = async (yearId) => {
    if (!selectedCompany || !yearId) return
    
    try {
      const response = await fetch(`/api/fiscal-management/fiscal-years/${yearId}/periods`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany,
          ...getAuthHeaders()
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Fetched periods:', data)
        setAvailablePeriods(data?.periods || [])
      }
    } catch (error) {
      console.error('❌ Error fetching periods:', error)
    }
  }

  // Fetch scenarios for selected year
  const fetchScenariosForYear = async (yearId) => {
    if (!selectedCompany || !yearId) return
    
    try {
      const response = await fetch(`/api/fiscal-management/fiscal-years/${yearId}/scenarios`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany,
          ...getAuthHeaders()
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('🎯 Fetched scenarios:', data)
        const scenarioList = data?.scenarios || []
        setScenarios(Array.isArray(scenarioList) ? scenarioList : [])
        if (Array.isArray(scenarioList) && scenarioList.length > 0) {
          setSelectedScenario(scenarioList[0].id)
        }
      } else {
        setScenarios([])
      }
    } catch (error) {
      console.error('❌ Error fetching scenarios:', error)
      setScenarios([])
    }
  }

  // Load process configuration (nodes, settings, etc.) - with fallback data when API fails
  const loadProcessConfiguration = async (processId) => {
    if (!selectedCompany || !processId) return
    
    try {
      const response = await fetch(`/api/financial-process/processes/${processId}/configuration?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (response.ok) {
        const config = await response.json()
        console.log('⚙️ Loaded process configuration:', config)
        
        // Safely load workflows with validation AND deserialize icons
        const safeEntityNodes = deserializeNodes(config.entityWorkflowNodes || [])
        const safeConsolidationNodes = deserializeNodes(config.consolidationWorkflowNodes || [])
        const safeNodes = deserializeNodes(config.nodes || [])
        
        setEntityWorkflowNodes(safeEntityNodes)
        setConsolidationWorkflowNodes(safeConsolidationNodes)
        
        // Set current workflow based on mode with proper fallback
        const currentFlowMode = config.flowMode || 'entity'
        setFlowMode(currentFlowMode)
        
        if (currentFlowMode === 'entity') {
          setWorkflowNodes(safeEntityNodes.length > 0 ? safeEntityNodes : safeNodes)
        } else if (currentFlowMode === 'consolidation') {
          setWorkflowNodes(safeConsolidationNodes.length > 0 ? safeConsolidationNodes : safeNodes)
        } else {
          setWorkflowNodes(safeNodes)
        }
        
        console.log('✅ Loaded nodes:', { entityNodes: safeEntityNodes.length, consolidationNodes: safeConsolidationNodes.length })
        
        // Safely set other config values
        if (Array.isArray(config.selectedEntities)) setSelectedEntities(config.selectedEntities)
        if (config.fiscalYear) {
          setSelectedYear(config.fiscalYear)
          fetchPeriodsForYear(config.fiscalYear)
          fetchScenariosForYear(config.fiscalYear)
        }
        if (Array.isArray(config.periods)) setSelectedPeriods(config.periods)
        if (config.scenario) setSelectedScenario(config.scenario)
        if (config.fiscalSettingsLocked !== undefined) setFiscalSettingsLocked(config.fiscalSettingsLocked)
        
        // Load entity-specific configurations after main config is loaded
        await loadEntityConfigurations()
      } else {
        console.warn(`⚠️ Configuration load returned status ${response.status}`)
        // Do not inject mock configuration
        setWorkflowNodes([])
        setEntityWorkflowNodes([])
        setConsolidationWorkflowNodes([])
        setFlowMode('entity')
        setSelectedEntities([])
        setSelectedYear(null)
        setSelectedPeriods([])
        setSelectedScenario(null)
        setFiscalSettingsLocked(false)
      }
    } catch (error) {
      console.error('❌ Error loading process configuration:', error)
      // Clear state on error
      setWorkflowNodes([])
      setEntityWorkflowNodes([])
      setConsolidationWorkflowNodes([])
      setFlowMode('entity')
      setSelectedEntities([])
      setSelectedYear(null)
      setSelectedPeriods([])
      setSelectedScenario(null)
      setFiscalSettingsLocked(false)
    }
  }

  // Save process configuration (manual save)
  const saveProcessConfiguration = async () => {
    if (!selectedProcess || !selectedCompany) return
    
    // Save current workflow to appropriate mode before saving
    const currentEntityNodes = flowMode === 'entity' ? workflowNodes : entityWorkflowNodes
    const currentConsolidationNodes = flowMode === 'consolidation' ? workflowNodes : consolidationWorkflowNodes
    
    // Serialize nodes (convert icons to strings) before saving
    const config = {
      nodes: serializeNodes(workflowNodes), // Current active nodes
      entityWorkflowNodes: serializeNodes(currentEntityNodes),
      consolidationWorkflowNodes: serializeNodes(currentConsolidationNodes),
      flowMode,
      selectedEntities,
      fiscalYear: selectedYear,
      periods: selectedPeriods,
      scenario: selectedScenario,
      fiscalSettingsLocked
    }
    
    try {
      const response = await fetch(`/api/financial-process/processes/${selectedProcess.id}/configuration?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany,
          ...getAuthHeaders()
        },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Configuration saved to PostgreSQL:', result)
        setHasUnsavedChanges(false)
        setLastSavedAt(new Date())
      } else {
        const errorText = await response.text()
        console.error(`❌ Failed to save configuration (${response.status}):`, errorText)
        showNotification('Failed to save configuration', 'error')
      }
    } catch (error) {
      console.error('❌ Error saving configuration:', error)
      showNotification('Failed to save configuration - check connection', 'error')
    }
  }

  const getFilteredNodesForEntity = (entityId) => {
    if (entityId === 'all') return workflowNodes
    
    return workflowNodes.filter(node => {
      const config = getEntityNodeConfig(entityId, node.id)
      return config.enabled
    })
  }

  // Load entity-specific configurations from backend
  const loadEntityConfigurations = async () => {
    if (!selectedProcess?.id) return

    try {
      const response = await fetch(`/api/financial-process/processes/${selectedProcess.id}/entity-node-configs?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Entity configurations loaded:', result)
        
        // Convert backend format to frontend format
        const loadedConfigs = {}
        result.configurations.forEach(config => {
          if (!loadedConfigs[config.entity_code]) {
            loadedConfigs[config.entity_code] = {}
          }
          loadedConfigs[config.entity_code][config.node_id] = {
            enabled: config.enabled,
            settings: config.settings || {}
          }
        })
        
        // Merge with existing configs (preserve 'all' configs)
        setEntityNodeConfigs(prev => ({
          ...prev,
          ...loadedConfigs
        }))
      } else {
        console.warn(`⚠️ Failed to load entity configurations (${response.status})`)
      }
    } catch (error) {
      console.error('❌ Error loading entity configurations:', error)
    }
  }

  // Save entity-specific configurations to backend
  const saveEntityConfigurations = async () => {
    if (!selectedProcess?.id) return

    try {
      setSavingConfig(true)
      
      // Convert entityNodeConfigs to the format expected by backend
      const configs = []
      
      Object.entries(entityNodeConfigs).forEach(([entityCode, nodeConfigs]) => {
        if (entityCode !== 'all') { // Skip 'all' - only save specific entity configs
          Object.entries(nodeConfigs).forEach(([nodeId, config]) => {
            configs.push({
              entity_code: entityCode,
              node_id: nodeId,
              enabled: config.enabled,
              settings: config.settings || {}
            })
          })
        }
      })

      console.log('💾 Saving entity configurations:', configs)

      const response = await fetch(`/api/financial-process/processes/${selectedProcess.id}/entity-node-configs?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(configs)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Entity configurations saved:', result)
        showNotification('✅ Entity configurations saved successfully!', 'success')
        setHasUnsavedChanges(false)
        setLastSavedAt(new Date())
      } else {
        const errorText = await response.text()
        console.error(`❌ Failed to save entity configurations (${response.status}):`, errorText)
        showNotification('Failed to save entity configurations', 'error')
      }
    } catch (error) {
      console.error('❌ Error saving entity configurations:', error)
      showNotification('Failed to save entity configurations - check connection', 'error')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleConsolidationModeEntitySelection = () => {
    if (flowMode === 'consolidation') {
      // Auto-select all entities for consolidation
      setSelectedEntities(availableEntities.map(e => getEntityIdentifier(e)))
      showNotification('All entities selected for consolidation mode', 'success')
    }
  }

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
        settings: processForm.settings,
        status: 'active' // Set default status
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
          console.error('❌ Authentication failed, redirecting to login...')
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
          return
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
                      fiscal_year: typeof process.fiscal_year === 'object' ? process.fiscal_year?.id || '' : process.fiscal_year,
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
                <span>FY {typeof process.fiscal_year === 'object' ? JSON.stringify(process.fiscal_year) : (process.fiscal_year || 'N/A')}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Created {new Date(process.created_at).toLocaleDateString()}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={async () => {
                    console.log('🔧 Opening workflow for process:', process)
                    setSelectedProcess(process)
                    setCurrentView('workflow')
                    showNotification(`Opening ${process.name} workflow`, 'success')
                    // Load process configuration
                    await loadProcessConfiguration(process.id)
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

  // Add node to workflow - Entity-Specific Version
  const addNodeToWorkflow = async (nodeType) => {
    const nodeTemplate = NODE_LIBRARY.find(n => n.type === nodeType)
    if (!nodeTemplate) return
    
    // Check if we're in entity-specific context
    if (selectedEntityContext === 'all') {
      showNotification('⚠️ Please select a specific entity to add nodes. Nodes cannot be added to "All Entities" view.', 'warning')
      return
    }
    
    const newNode = {
      id: `${crypto.randomUUID()}`,
      type: nodeType,
      title: nodeTemplate.title,
      description: nodeTemplate.description,
      icon: nodeTemplate.icon,
      color: nodeTemplate.color,
      category: nodeTemplate.category,
      flowType: nodeTemplate.flowType,
      dependencies: nodeTemplate.dependencies || [],
      status: 'pending',
      entityContext: selectedEntityContext, // Track which entity this node belongs to
      config: {
        enabled: true,
        availableForEntity: true,
        availableForConsolidation: nodeTemplate.flowType === 'consolidation' || nodeTemplate.flowType === 'both',
        restrictions: {}
      },
      sequence: getCurrentWorkflowNodes().length
    }
    
    // Add to global workflow nodes
    const updatedNodes = [...workflowNodes, newNode]
    setWorkflowNodes(updatedNodes)
    
    // Set entity-specific configuration
    updateEntityNodeConfig(selectedEntityContext, newNode.id, { 
      enabled: true, 
      settings: {
        addedByEntity: selectedEntityContext,
        createdAt: new Date().toISOString()
      }
    })
    
    // IMPORTANT: Also update the mode-specific workflow
    if (flowMode === 'entity') {
      setEntityWorkflowNodes(updatedNodes)
    } else {
      setConsolidationWorkflowNodes(updatedNodes)
    }
    
    // Save node to backend database
    try {
      const response = await fetch(`/api/financial-process/processes/${selectedProcess.id}/nodes?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          id: newNode.id,
          type: newNode.type,
          title: newNode.title,
          name: newNode.title,
          description: newNode.description,
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          entityContext: newNode.entityContext,
          status: newNode.status,
          sequence: newNode.sequence,
          configuration: newNode.config || {}
        })
      })

      if (response.ok) {
        console.log(`✅ Node ${newNode.title} saved to database for entity ${selectedEntityContext}`)
        showNotification(`Added ${nodeTemplate.title} to ${selectedEntityContext} workflow`, 'success')
      } else {
        console.error(`❌ Failed to save node to database: ${response.status}`)
        showNotification(`Added ${nodeTemplate.title} locally (database save failed)`, 'warning')
      }
    } catch (error) {
      console.error('❌ Error saving node to database:', error)
      showNotification(`Added ${nodeTemplate.title} locally (database save failed)`, 'warning')
    }
    
    setShowNodeLibrary(false)
    
    // Update save status after adding node
    setHasUnsavedChanges(true)
    setLastSavedAt(new Date())
  }

  // Remove node from workflow
  const removeNodeFromWorkflow = (nodeId) => {
    const updatedNodes = workflowNodes.filter(n => n.id !== nodeId)
    setWorkflowNodes(updatedNodes)
    
    // IMPORTANT: Also update the mode-specific workflow
    if (flowMode === 'entity') {
      setEntityWorkflowNodes(updatedNodes)
    } else {
      setConsolidationWorkflowNodes(updatedNodes)
    }
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
    showNotification('Node removed from workflow', 'success')
    
    // Auto-save with a small delay to ensure state is updated
    // Manual save - removed auto-save
  }

  // Run individual node
  const runNode = async (nodeId) => {
    const node = workflowNodes.find(n => n.id === nodeId)
    if (!node) return

    // Validation
    if (flowMode === 'entity' && selectedEntities.length === 0) {
      showNotification('Please select at least one entity', 'error')
      return
    }
    if (selectedPeriods.length === 0) {
      showNotification('Please select at least one period', 'error')
      return
    }
    if (!selectedScenario) {
      showNotification('Please select a scenario', 'error')
      return
    }

    // Update status to running
    setWorkflowNodes(workflowNodes.map(n => 
      n.id === nodeId ? { ...n, status: 'running' } : n
    ))

    try {
      const response = await fetch(`/api/financial-process/processes/${selectedProcess.id}/execute-node`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany,
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          nodeId,
          nodeType: node.type,
          entities: selectedEntities,
          fiscalYear: selectedYear,
          periods: selectedPeriods,
          scenario: selectedScenario,
          flowMode
        })
      })

      if (response.ok) {
        setWorkflowNodes(workflowNodes.map(n => 
          n.id === nodeId ? { ...n, status: 'completed' } : n
        ))
        showNotification(`${node.title} executed successfully`, 'success')
        // Manual save - removed auto-save after execution
      } else {
        throw new Error('Node execution failed')
      }
    } catch (error) {
      setWorkflowNodes(workflowNodes.map(n => 
        n.id === nodeId ? { ...n, status: 'error' } : n
      ))
      showNotification(`${node.title} execution failed`, 'error')
    }
  }

  // Run simulation (all nodes sequentially)
  const runSimulation = async () => {
    if (workflowNodes.length === 0) {
      showNotification('No nodes to execute', 'error')
      return
    }

    // Validation
    if (flowMode === 'entity' && selectedEntities.length === 0) {
      showNotification('Please select at least one entity', 'error')
      return
    }
    if (selectedPeriods.length === 0) {
      showNotification('Please select at least one period', 'error')
      return
    }
    if (!selectedScenario) {
      showNotification('Please select a scenario', 'error')
      return
    }

    showNotification('🚀 Starting simulation...', 'success')

    // Reset all nodes to pending
    setWorkflowNodes(workflowNodes.map(n => ({ ...n, status: 'pending' })))

    // Sort nodes by sequence
    const sortedNodes = [...workflowNodes].sort((a, b) => a.sequence - b.sequence)

    for (const node of sortedNodes) {
      // Check if dependencies are met
      const dependenciesMet = node.dependencies.every(depType => {
        const depNode = workflowNodes.find(n => n.type === depType)
        return depNode && depNode.status === 'completed'
      })

      if (!dependenciesMet && node.dependencies.length > 0) {
        showNotification(`⚠️ Skipping ${node.title} - dependencies not met`, 'error')
        setWorkflowNodes(prev => prev.map(n => 
          n.id === node.id ? { ...n, status: 'error' } : n
        ))
        continue
      }

      await runNode(node.id)
      // Small delay between nodes for better UX
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    showNotification('✅ Simulation completed successfully!', 'success')
    // Update save status after simulation
    setHasUnsavedChanges(true)
    setLastSavedAt(new Date())
  }

  // Render workflow view with advanced layout
  const renderWorkflowView = () => {
    const availableNodes = getAvailableNodes()

    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* Top Toolbar - Enhanced */}
        <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          {/* First Row - Navigation and Controls */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
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
                  onClick={() => {
                    if (selectedEntityContext === 'all') {
                      showNotification('⚠️ Please select a specific entity to add nodes', 'warning')
                      return
                    }
                    setShowNodeLibrary(!showNodeLibrary)
                  }}
                  disabled={selectedEntityContext === 'all'}
                  className={`btn-secondary inline-flex items-center gap-2 text-sm ${
                    selectedEntityContext === 'all' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={selectedEntityContext === 'all' ? 'Select a specific entity to add nodes' : 'Add Node'}
                >
                  <Plus className="h-4 w-4" />
                  Add Node
                </button>
                <button
                  onClick={async () => {
                    try {
                      setSavingConfig(true)
                      // Save both main configuration and entity-specific configurations
                      await saveProcessConfiguration()
                      await saveEntityConfigurations()
                      showNotification('✅ Process flow saved successfully!', 'success')
                    } catch (error) {
                      console.error('❌ Error saving process flow:', error)
                      showNotification('❌ Failed to save process flow. Please try again.', 'error')
                    } finally {
                      setSavingConfig(false)
                    }
                  }}
                  disabled={savingConfig}
                  className="btn-success inline-flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {savingConfig ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {savingConfig ? 'Saving...' : 'Save Flow'}
                </button>
                <button 
                  onClick={() => setCurrentView('settings')}
                  className="btn-secondary inline-flex items-center gap-2 text-sm"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button 
                  onClick={runSimulation}
                  disabled={workflowNodes.length === 0}
                  className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-4 w-4" />
                  Run Simulation
                </button>
              </div>
            </div>
          </div>

          {/* Second Row - Selectors and Toggle */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Flow Mode Toggle */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    // Save current workflow before switching
                    if (flowMode === 'consolidation') {
                      setConsolidationWorkflowNodes(workflowNodes)
                    }
                    // Load entity workflow
                    setFlowMode('entity')
                    setWorkflowNodes(entityWorkflowNodes)
                    showNotification('Switched to Entity-wise mode', 'success')
                    saveProcessConfiguration()
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    flowMode === 'entity'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Entity-wise
                </button>
                <button
                  onClick={() => {
                    // Save current workflow before switching
                    if (flowMode === 'entity') {
                      setEntityWorkflowNodes(workflowNodes)
                    }
                    // Load consolidation workflow
                    setFlowMode('consolidation')
                    setWorkflowNodes(consolidationWorkflowNodes)
                    
                    // Auto-select all entities for consolidation
                    const allEntityIds = availableEntities.map(e => getEntityIdentifier(e))
                    setSelectedEntities(allEntityIds)
                    
                    // Set entity context to 'all' for consolidation
                    setSelectedEntityContext('all')
                    
                    showNotification('Switched to Consolidation mode - All entities selected', 'success')
                    saveProcessConfiguration()
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    flowMode === 'consolidation'
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Layers className="h-4 w-4 inline mr-1" />
                  Consolidation
                </button>
              </div>

              {/* Entity Context Selector - Only show in Entity mode */}
              {flowMode === 'entity' && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Entity Context:
                  </label>
                  <select
                    value={selectedEntityContext}
                    onChange={(e) => setSelectedEntityContext(e.target.value)}
                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Entities</option>
                    {availableEntities.map((entity) => (
                      <option key={getEntityIdentifier(entity)} value={getEntityIdentifier(entity)}>
                        {getEntityName(entity)} ({getEntityCode(entity)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Consolidation Mode Info */}
              {flowMode === 'consolidation' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Consolidation Mode - All Entities Selected
                  </span>
                </div>
              )}

              {/* Entity Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowEntitySelector(!showEntitySelector)}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span className="font-medium">
                    {selectedEntities.length === 0 
                      ? 'Select Entities' 
                      : `${selectedEntities.length} ${selectedEntities.length === 1 ? 'Entity' : 'Entities'}`}
                  </span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${showEntitySelector ? 'rotate-90' : ''}`} />
                </button>

                {/* Entity Dropdown */}
                {showEntitySelector && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowEntitySelector(false)} />
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 max-h-96 overflow-auto">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <span className="font-medium text-sm">Select Entities</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedEntities(availableEntities.map(e => e.code || e.id))}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => setSelectedEntities([])}
                            className="text-xs text-gray-600 hover:text-gray-700"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        {availableEntities.length === 0 ? (
                          <div className="text-center py-4 text-sm text-gray-500">
                            No entities available
                          </div>
                        ) : (
                          availableEntities.map((entity) => {
                            const entityIdentifier = entity.code || entity.entity_code || entity.id
                            const entityName = entity.name || entity.entity_name || entity.label || 'Unnamed Entity'
                            const entityCode = entity.code || entity.entity_code || entityIdentifier

                            return (
                              <label
                                key={entityIdentifier}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedEntities.includes(entityIdentifier)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (!selectedEntities.includes(entityIdentifier)) {
                                        setSelectedEntities([...selectedEntities, entityIdentifier])
                                        markUnsavedChanges()
                                      }
                                    } else {
                                      setSelectedEntities(selectedEntities.filter(id => id !== entityIdentifier))
                                      markUnsavedChanges()
                                    }
                                  }}
                                  className="rounded"
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">{entityName}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{entityCode}</span>
                                </div>
                              </label>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Period Multi-Selector - Now includes year info */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (fiscalSettingsLocked) {
                      showNotification('🔒 Fiscal settings are locked. Unlock to make changes.', 'error')
                      return
                    }
                    if (fiscalYears.length === 0) {
                      showNotification('⚠️ No fiscal years found. Please add fiscal years in Fiscal Management first.', 'error')
                      return
                    }
                    setShowPeriodSelector(!showPeriodSelector)
                  }}
                  disabled={fiscalSettingsLocked || fiscalYears.length === 0}
                  className={`px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg transition-all flex items-center gap-2 ${
                    fiscalSettingsLocked || fiscalYears.length === 0
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-400'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {fiscalYears.length === 0 
                      ? 'No Fiscal Years Available'
                      : selectedPeriods.length === 0 
                        ? 'Select Periods' 
                        : `${selectedPeriods.length} Period${selectedPeriods.length === 1 ? '' : 's'}`}
                  </span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${showPeriodSelector ? 'rotate-90' : ''}`} />
                </button>

                {/* Period Dropdown */}
                {showPeriodSelector && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPeriodSelector(false)} />
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 max-h-96 overflow-auto animate-in slide-in-from-top-2">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <span className="font-medium text-sm">Select Periods</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedPeriods(availablePeriods.map(p => p.id))
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPeriods([])
                            }}
                            className="text-xs text-gray-600 hover:text-gray-700"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        {fiscalYears.length === 0 ? (
                          <div className="text-center py-6 text-sm text-gray-500">
                            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="font-medium mb-1">No Fiscal Years Found</p>
                            <p>Please add fiscal years in Fiscal Management settings first.</p>
                          </div>
                        ) : availablePeriods.length === 0 ? (
                          <div className="text-center py-4 text-sm text-gray-500">
                            No periods available. Create periods in Fiscal Management.
                          </div>
                        ) : (
                          availablePeriods.map((period) => (
                            <label
                              key={period.id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPeriods.includes(period.id)}
                                onChange={(e) => {
                                  let newSelectedPeriods
                                  if (e.target.checked) {
                                    newSelectedPeriods = [...selectedPeriods, period.id]
                                  } else {
                                    newSelectedPeriods = selectedPeriods.filter(id => id !== period.id)
                                  }
                                  setSelectedPeriods(newSelectedPeriods)
                                  
                                  // Auto-determine fiscal year from selected periods
                                  if (newSelectedPeriods.length > 0) {
                                    const firstPeriod = availablePeriods.find(p => p.id === newSelectedPeriods[0])
                                    if (firstPeriod && firstPeriod.fiscalYearId) {
                                      setSelectedYear(firstPeriod.fiscalYearId)
                                      // Fetch scenarios for this year
                                      fetchScenariosForYear(firstPeriod.fiscalYearId)
                                    }
                                  }
                                  
                                  // Manual save - removed auto-save
                                }}
                                className="rounded"
                              />
                              <div className="flex-1">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{period.period_name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">({period.period_code})</span>
                                    {period.fiscalYearName && (
                                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                        {period.fiscalYearName}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Scenario Selector */}
              <select
                value={selectedScenario || ''}
                onChange={(e) => {
                  if (fiscalSettingsLocked) {
                    showNotification('🔒 Fiscal settings are locked. Unlock to make changes.', 'error')
                    return
                  }
                  setSelectedScenario(e.target.value)
                }}
                disabled={fiscalSettingsLocked || fiscalYears.length === 0}
                className={`px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg transition-all ${
                  fiscalSettingsLocked || fiscalYears.length === 0
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:border-blue-400'
                }`}
              >
                <option value="">
                  {fiscalYears.length === 0 ? 'No Fiscal Years Available' : 'Select Scenario'}
                </option>
                {fiscalYears.length > 0 && scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.scenario_name} ({scenario.scenario_type})
                  </option>
                ))}
              </select>

              {/* Lock/Unlock Button */}
              <button
                onClick={() => {
                  if (selectedPeriods.length === 0 || !selectedScenario) {
                    showNotification('Please select periods and scenario before locking', 'error')
                    return
                  }
                  setFiscalSettingsLocked(!fiscalSettingsLocked)
                  saveProcessConfiguration()
                  showNotification(
                    !fiscalSettingsLocked 
                      ? '🔒 Fiscal settings locked. Only selected periods and scenario will be available.' 
                      : '🔓 Fiscal settings unlocked. You can now change selections.',
                    'success'
                  )
                }}
                className={`px-3 py-2 text-sm rounded-lg inline-flex items-center gap-2 transition-all ${
                  fiscalSettingsLocked
                    ? 'bg-amber-100 text-amber-800 border-2 border-amber-300 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                    : 'bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                }`}
                title={fiscalSettingsLocked ? 'Unlock fiscal settings' : 'Lock fiscal settings'}
              >
                {fiscalSettingsLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                <span className="font-medium">
                  {fiscalSettingsLocked ? 'Locked' : 'Unlocked'}
                </span>
              </button>

              {/* Save status indicator */}
              <div className="ml-auto">
                {renderSaveStatus()}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Workflow Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Node Library Expandable Panel */}
            {showNodeLibrary && (
              <div className="bg-gradient-to-r from-white via-blue-50 to-white dark:from-gray-950 dark:via-blue-900/10 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800 p-4 shadow-lg transition-all duration-300 ease-in-out" style={{ animation: 'slideDown 0.3s ease-out' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Node Library - {flowMode === 'entity' ? '🏢 Entity-wise' : '🔗 Consolidation'} ({availableNodes.length} nodes)
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowNodeLibrary(false)}
                    className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all hover:shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Horizontal Scrolling Node Library */}
                <div className="overflow-x-auto">
                  <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
                    {availableNodes.map((node, idx) => {
                      const IconComponent = getIconComponent(node.icon)
                      // Check if node is added for current entity context
                      const isAdded = selectedEntityContext === 'all' 
                        ? workflowNodes.some(n => n.type === node.type)
                        : getCurrentWorkflowNodes().some(n => n.type === node.type)
                      return (
                        <div
                          key={node.type}
                          onClick={async () => !isAdded && await addNodeToWorkflow(node.type)}
                          style={{ 
                            animation: `slideIn 0.3s ease-out ${idx * 0.05}s both`
                          }}
                          className={`flex-shrink-0 w-36 p-3 border-2 rounded-xl transition-all duration-300 bg-gradient-to-br transform ${
                            isAdded
                              ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700 opacity-70 cursor-not-allowed'
                              : 'from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer hover:shadow-xl hover:scale-105'
                          }`}
                          title={node.description}
                        >
                          <div className={`w-10 h-10 rounded-xl ${node.color} flex items-center justify-center mb-2 shadow-md transform transition-transform ${!isAdded && 'group-hover:scale-110'}`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                            {node.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {node.category}
                          </p>
                          {isAdded && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Added
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Workflow Nodes - Horizontal Scroll */}
            <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              {/* Entity Context Info */}
              {selectedEntityContext === 'all' ? (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      All Entities View - Read Only
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    You're viewing all entity workflows. To add or configure nodes, please select a specific entity from the Entity Context dropdown above.
                  </p>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Showing workflow for: {availableEntities.find(e => getEntityIdentifier(e) === selectedEntityContext)?.name || selectedEntityContext}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Only nodes for this entity are shown. Nodes added here will be specific to this entity only.
                  </p>
                </div>
              )}

              {getCurrentWorkflowNodes().length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400 dark:text-gray-500">
                    <Workflow className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Nodes in Workflow</h3>
                    <p className="text-sm mb-4">
                      {selectedEntityContext === 'all' 
                        ? 'Select a specific entity to add nodes' 
                        : 'Click "Add Node" to start building your process'}
                    </p>
                    <button
                      onClick={() => {
                        if (selectedEntityContext === 'all') {
                          showNotification('⚠️ Please select a specific entity to add nodes', 'warning')
                          return
                        }
                        setShowNodeLibrary(true)
                      }}
                      disabled={selectedEntityContext === 'all'}
                      className={`btn-primary inline-flex items-center gap-2 ${
                        selectedEntityContext === 'all' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      {selectedEntityContext === 'all' ? 'Select Entity First' : 'Add Your First Node'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="min-w-max">
                  {/* Horizontal Node Flow */}
                  <div className="flex items-center gap-4">
                    {getCurrentWorkflowNodes().map((node, index) => {
                      const IconComponent = getIconComponent(node.icon)
                      const isSelected = selectedNode?.id === node.id
                      
                      return (
                        <React.Fragment key={node.id}>
                          {/* Node Card */}
                          <div
                            onClick={() => setSelectedNode(node)}
                            onDoubleClick={() => {
                              // Navigate to relevant module based on node type
                              if (node.type === 'data_input' || node.type === 'entity_data_load') {
                                // Navigate to Data Input page with context
                                const params = new URLSearchParams({
                                  processId: selectedProcess.id,
                                  processName: selectedProcess.name,
                                  scenario: selectedScenario || '',
                                  scenarioName: scenarios.find(s => s.id === selectedScenario)?.scenario_name || '',
                                  year: selectedYear || '',
                                  yearName: fiscalYears.find(fy => fy.id === selectedYear)?.year || '',
                                  entities: selectedEntities.join(',') || '',
                                  entityContext: selectedEntityContext || 'all',
                                  defaultEntity: selectedEntityContext !== 'all' ? selectedEntityContext : (selectedEntities.length === 1 ? selectedEntities[0] : ''),
                                  flowMode: flowMode || 'entity'
                                })
                                navigate(`/data-input?${params.toString()}`)
                                
                                // Show context-aware notification
                                const entityContextMsg = selectedEntityContext !== 'all' 
                                  ? ` for ${availableEntities.find(e => getEntityIdentifier(e) === selectedEntityContext)?.entity_name || selectedEntityContext}`
                                  : ''
                                showNotification(`Opening ${node.title} module${entityContextMsg}...`, 'success')
                              } else if (node.type === 'journal_entry') {
                                // Navigate to Journal Entry page with context
                                const params = new URLSearchParams({
                                  processId: selectedProcess.id,
                                  processName: selectedProcess.name,
                                  entityId: selectedEntityContext !== 'all' ? selectedEntityContext : 'all',
                                  scenarioId: selectedScenario || '',
                                  year: selectedYear || '',
                                  period: selectedPeriod || 'Q1'
                                })
                                navigate(`/journal-entry?${params.toString()}`)
                                
                                // Show context-aware notification
                                const entityContextMsg = selectedEntityContext !== 'all' 
                                  ? ` for ${availableEntities.find(e => getEntityIdentifier(e) === selectedEntityContext)?.entity_name || selectedEntityContext}`
                                  : ''
                                showNotification(`Opening ${node.title} module${entityContextMsg}...`, 'success')
                              } else {
                                showNotification(`${node.title} module coming soon...`, 'info')
                              }
                            }}
                            className={`flex-shrink-0 w-64 bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 rounded-xl shadow-lg border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl ${
                              isSelected 
                                ? 'border-blue-500 ring-4 ring-blue-200 dark:ring-blue-800 scale-105' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                            } ${
                              node.status === 'running' ? 'animate-pulse' : ''
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

                              {/* Entity Configuration Badges */}
                              {selectedEntityContext === 'all' && availableEntities.length > 0 && (
                                <div className="mb-3">
                                  <div className="flex flex-wrap gap-1">
                                    {availableEntities.slice(0, 3).map((entity) => {
                                      const entityId = getEntityIdentifier(entity)
                                      const entityConfig = getEntityNodeConfig(entityId, node.id)
                                      const isEnabled = entityConfig.enabled
                                      
                                      return (
                                        <span
                                          key={entityId}
                                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                                            isEnabled
                                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                          }`}
                                          title={`${getEntityName(entity)}: ${isEnabled ? 'Enabled' : 'Disabled'}`}
                                        >
                                          {isEnabled ? '✓' : '✗'} {getEntityCode(entity)}
                                        </span>
                                      )
                                    })}
                                    {availableEntities.length > 3 && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        +{availableEntities.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Entity configurations
                                  </p>
                                </div>
                              )}

                              {/* Node Status & Actions */}
                              <div className="space-y-2">
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
                                
                                {/* Run Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    runNode(node.id)
                                  }}
                                  disabled={node.status === 'running'}
                                  className="w-full px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Play className="h-3 w-3" />
                                  Run Node
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Arrow Connector */}
                          {index < getCurrentWorkflowNodes().length - 1 && (
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

  // Render Settings View
  const renderSettingsView = () => {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('workflow')}
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all hover:shadow-md"
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Process Settings - {selectedProcess?.name}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Configure nodes, dependencies, and fiscal settings
                </p>
              </div>
            </div>
            {/* Save button and status indicator */}
            <div className="flex items-center gap-3">
              <button
                onClick={saveEntityConfigurations}
                disabled={savingConfig}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                {savingConfig ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </button>
              {renderSaveStatus()}
            </div>
          </div>
        </div>

        {/* Entity Context Selector */}
        <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Configure Settings for:
            </label>
            <select
              value={selectedEntityContext}
              onChange={(e) => setSelectedEntityContext(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Entities (Default)</option>
              {availableEntities.map((entity) => (
                <option key={getEntityIdentifier(entity)} value={getEntityIdentifier(entity)}>
                  {getEntityName(entity)} ({getEntityCode(entity)})
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {selectedEntityContext === 'all' 
                ? 'Changes apply to all entities unless overridden' 
                : `Configuring specific settings for ${availableEntities.find(e => getEntityIdentifier(e) === selectedEntityContext)?.name || 'selected entity'}`}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Node List */}
          <div className="w-80 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                All Available Nodes ({NODE_LIBRARY.length})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Select any node to configure. Green badge = Added to workflow
              </p>
              <div className="space-y-2">
                {NODE_LIBRARY.map((nodeTemplate) => {
                  const IconComponent = nodeTemplate.icon
                  // Find if this node type is added to workflow
                  const workflowNode = workflowNodes.find(n => n.type === nodeTemplate.type)
                  const isInWorkflow = !!workflowNode
                  const isActive = selectedNode?.type === nodeTemplate.type || selectedNode?.id === workflowNode?.id
                  
                  // Get entity-specific configuration
                  const entityConfig = workflowNode ? getEntityNodeConfig(selectedEntityContext, workflowNode.id) : { enabled: true, settings: {} }
                  const isEnabledForEntity = entityConfig.enabled
                  
                  return (
                    <button
                      key={nodeTemplate.type}
                      onClick={() => {
                        // If node is in workflow, select the workflow instance
                        // Otherwise, create a temporary node for configuration
                        if (workflowNode) {
                          setSelectedNode(workflowNode)
                        } else {
                          setSelectedNode({
                            ...nodeTemplate,
                            id: `temp-${nodeTemplate.type}`,
                            status: 'pending',
                            config: {
                              enabled: true,
                              availableForEntity: nodeTemplate.flowType === 'entity' || nodeTemplate.flowType === 'both',
                              availableForConsolidation: nodeTemplate.flowType === 'consolidation' || nodeTemplate.flowType === 'both',
                              restrictions: {}
                            }
                          })
                        }
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${nodeTemplate.color} flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {nodeTemplate.title}
                            </p>
                            {isInWorkflow && (
                              <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                                ✓
                              </span>
                            )}
                            {isInWorkflow && selectedEntityContext !== 'all' && (
                              <span className={`px-1.5 py-0.5 text-xs rounded ${
                                isEnabledForEntity 
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {isEnabledForEntity ? 'ON' : 'OFF'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {nodeTemplate.category}
                          </p>
                        </div>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Fiscal Management Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Fiscal Management
                </h3>
                <button
                  onClick={() => setShowFiscalSetup(!showFiscalSetup)}
                  className="w-full p-3 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg hover:border-purple-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Setup Fiscal Year & Periods
                    </span>
                  </div>
                </button>
              </div>

            </div>
          </div>

          {/* Right Panel - Configuration */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedNode ? (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  {/* Node Header */}
                  <div className="flex items-center gap-4 mb-6">
                    {selectedNode.icon && (
                      <div className={`w-16 h-16 rounded-xl ${selectedNode.color} flex items-center justify-center`}>
                        <selectedNode.icon className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedNode.title}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedNode.description}
                      </p>
                    </div>
                  </div>

                  {/* Configuration Sections */}
                  <div className="space-y-6">
                    {/* Basic Settings */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Basic Settings
                      </h3>
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
                            onBlur={() => saveProcessConfiguration()} // Auto-save on blur
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                          />
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
                            onBlur={() => saveProcessConfiguration()} // Auto-save on blur
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Entity-Specific Configuration */}
                    {workflowNodes.find(n => n.id === selectedNode.id) && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Entity Configuration
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {selectedEntityContext === 'all' ? 'Default Configuration' : `Configuration for ${availableEntities.find(e => getEntityIdentifier(e) === selectedEntityContext)?.name || 'Selected Entity'}`}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {selectedEntityContext === 'all' 
                                  ? 'This configuration applies to all entities unless overridden'
                                  : 'This configuration is specific to the selected entity'}
                              </p>
                            </div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={getEntityNodeConfig(selectedEntityContext, selectedNode.id).enabled}
                                onChange={(e) => {
                                  updateEntityNodeConfig(selectedEntityContext, selectedNode.id, { enabled: e.target.checked })
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Enabled
                              </span>
                            </label>
                          </div>
                          
                          {selectedEntityContext === 'all' && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                  Apply to All Entities
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  const config = getEntityNodeConfig('all', selectedNode.id)
                                  availableEntities.forEach(entity => {
                                    const entityId = getEntityIdentifier(entity)
                                    updateEntityNodeConfig(entityId, selectedNode.id, config)
                                  })
                                  showNotification('Configuration applied to all entities', 'success')
                                }}
                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Apply Current Settings to All Entities
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dependencies */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Dependencies
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        This node depends on:
                      </p>
                      {selectedNode.dependencies && selectedNode.dependencies.length > 0 ? (
                        <div className="space-y-2">
                          {selectedNode.dependencies.map((depType, idx) => {
                            const depNode = NODE_LIBRARY.find(n => n.type === depType)
                            return depNode ? (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className={`w-8 h-8 rounded ${depNode.color} flex items-center justify-center`}>
                                  <depNode.icon className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-sm text-gray-900 dark:text-white">{depNode.title}</span>
                              </div>
                            ) : null
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No dependencies</p>
                      )}
                    </div>

                    {/* Availability Toggle */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Availability
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                          <input
                            type="checkbox"
                            checked={selectedNode.config?.availableForEntity || false}
                            onChange={(e) => {
                              const updated = workflowNodes.map(n => 
                                n.id === selectedNode.id 
                                  ? { ...n, config: { ...n.config, availableForEntity: e.target.checked } } 
                                  : n
                              )
                              setWorkflowNodes(updated)
                              setSelectedNode({ 
                                ...selectedNode, 
                                config: { ...selectedNode.config, availableForEntity: e.target.checked }
                              })
                              saveProcessConfiguration() // Auto-save
                            }}
                            className="rounded"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Available in Entity-wise Mode
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Enable this node for entity-level processing
                            </p>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
                          <input
                            type="checkbox"
                            checked={selectedNode.config?.availableForConsolidation || false}
                            onChange={(e) => {
                              const updated = workflowNodes.map(n => 
                                n.id === selectedNode.id 
                                  ? { ...n, config: { ...n.config, availableForConsolidation: e.target.checked } } 
                                  : n
                              )
                              setWorkflowNodes(updated)
                              setSelectedNode({ 
                                ...selectedNode, 
                                config: { ...selectedNode.config, availableForConsolidation: e.target.checked }
                              })
                              saveProcessConfiguration() // Auto-save
                            }}
                            className="rounded"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Available in Consolidation Mode
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Enable this node for consolidation processing
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Restrictions */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Restrictions & Rules
                      </h3>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Additional configuration options and business rules can be defined here based on the node type.
                        </p>
                      </div>
                    </div>

                    {/* Custom Fields Configuration - Only for Data Input Node */}
                    {selectedNode.type === 'data_input' && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Data Input Custom Fields
                        </h3>
                        <DataInputCustomFieldsConfig 
                          processSettings={processForm.settings}
                          selectedEntityContext={selectedEntityContext}
                          getEntityCustomFields={getEntityCustomFields}
                          updateEntityCustomFields={updateEntityCustomFields}
                          onUpdate={(settings) => {
                            setProcessForm(prev => ({
                              ...prev,
                              settings: { ...prev.settings, ...settings }
                            }))
                            saveProcessConfiguration()
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Node Selected</p>
                  <p className="text-sm">Select a node from the left sidebar to configure it</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fiscal Setup Modal */}
        {showFiscalSetup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-h-[80vh] overflow-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Fiscal Year Setup
                  </h3>
                  <button
                    onClick={() => setShowFiscalSetup(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Fiscal Year
                    </label>
                    <select
                      value={selectedYear || ''}
                      onChange={(e) => {
                        const yearId = e.target.value ? parseInt(e.target.value) : null
                        setSelectedYear(yearId)
                        if (yearId) {
                          fetchPeriodsForYear(yearId)
                          fetchScenariosForYear(yearId)
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="">Choose a year</option>
                      {Array.isArray(fiscalYears) && fiscalYears.map((fy) => (
                        <option key={fy.id} value={fy.id}>
                          {fy.year_name || fy.year_code || 'Unnamed Year'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        Current Selection
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Fiscal Year: </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedYear && Array.isArray(fiscalYears) ? (fiscalYears.find(fy => fy.id === selectedYear)?.year_name || 'N/A') : 'Not selected'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Periods: </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedPeriods.length > 0 ? `${selectedPeriods.length} selected` : 'Not selected'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Scenario: </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedScenario ? scenarios.find(s => s.id === selectedScenario)?.scenario_name || 'N/A' : 'Not selected'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        <strong>Note:</strong> Use the toolbar above to select fiscal year, periods, and scenario. This dialog shows your current selection.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setShowFiscalSetup(false)
                      }}
                      className="w-full btn-primary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

  if (currentView === 'settings' && selectedProcess) {
    return renderSettingsView()
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
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  💡 <strong>Note:</strong> Fiscal year, periods, and scenarios will be configured inside the process settings after creation.
                </p>
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
