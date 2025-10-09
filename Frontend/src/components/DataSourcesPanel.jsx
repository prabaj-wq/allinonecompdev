import React, { useState, useEffect } from 'react'
import { 
  X, 
  Database, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  RefreshCw,
  Link,
  Unlink,
  Settings,
  Filter,
  Search,
  Globe,
  Server,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Calculator,
  Calendar,
  Tag,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react'

const DataSourcesPanel = ({ isOpen, onClose, onSelectDataSource, selectedDataSources = [] }) => {
  const [dataSources, setDataSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSource, setEditingSource] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadDataSources()
    }
  }, [isOpen])

  const loadDataSources = async () => {
    setLoading(true)
    try {
      // Load entities
      const entitiesResponse = await fetch('/api/entities', {
        credentials: 'include'
      })
      
      // Load accounts
      const accountsResponse = await fetch('/api/accounts', {
        credentials: 'include'
      })
      
      // Load trial balance data
      const tbResponse = await fetch('/api/tb-files', {
        credentials: 'include'
      })
      
      if (entitiesResponse.ok && accountsResponse.ok) {
        const entities = await entitiesResponse.json()
        const accounts = await accountsResponse.json()
        const tbData = tbResponse.ok ? await tbResponse.json() : []
        
        const sources = [
          // Entity sources
          ...entities.map(entity => ({
            id: `entity_${entity.id}`,
            name: entity.name,
            type: 'entity',
            description: `Entity: ${entity.name}`,
            icon: Building2,
            color: 'blue',
            data: entity,
            lastUpdated: new Date().toISOString(),
            status: 'active'
          })),
          
          // Account sources
          ...accounts.map(account => ({
            id: `account_${account.id}`,
            name: account.name,
            type: 'account',
            description: `Account: ${account.account_code} - ${account.name}`,
            icon: Calculator,
            color: 'green',
            data: account,
            lastUpdated: new Date().toISOString(),
            status: 'active'
          })),
          
          // Trial balance sources
          ...tbData.map(tb => ({
            id: `tb_${tb.id}`,
            name: tb.filename || `Trial Balance ${tb.id}`,
            type: 'trial_balance',
            description: `Trial Balance: ${tb.period}`,
            icon: BarChart3,
            color: 'purple',
            data: tb,
            lastUpdated: tb.upload_date || new Date().toISOString(),
            status: 'active'
          })),
          
          // System sources
          {
            id: 'system_current_period',
            name: 'Current Period',
            type: 'system',
            description: 'Current reporting period data',
            icon: Calendar,
            color: 'orange',
            data: { period: 'current' },
            lastUpdated: new Date().toISOString(),
            status: 'active'
          },
          {
            id: 'system_previous_period',
            name: 'Previous Period',
            type: 'system',
            description: 'Previous reporting period data',
            icon: Calendar,
            color: 'orange',
            data: { period: 'previous' },
            lastUpdated: new Date().toISOString(),
            status: 'active'
          },
          {
            id: 'system_ytd',
            name: 'Year to Date',
            type: 'system',
            description: 'Year to date cumulative data',
            icon: TrendingUp,
            color: 'orange',
            data: { period: 'ytd' },
            lastUpdated: new Date().toISOString(),
            status: 'active'
          }
        ]
        
        setDataSources(sources)
      }
    } catch (err) {
      console.error('Error loading data sources:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredDataSources = dataSources.filter(source => {
    const matchesSearch = source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         source.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || source.type === filterType
    return matchesSearch && matchesFilter
  })

  const getTypeIcon = (type) => {
    switch (type) {
      case 'entity': return Building2
      case 'account': return Calculator
      case 'trial_balance': return BarChart3
      case 'system': return Server
      default: return Database
    }
  }

  const getTypeColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[color] || colors.blue
  }

  const handleSelectSource = (source) => {
    onSelectDataSource(source)
  }

  const handleToggleSource = (sourceId) => {
    const isSelected = selectedDataSources.some(s => s.id === sourceId)
    if (isSelected) {
      // Remove from selection
      const updated = selectedDataSources.filter(s => s.id !== sourceId)
      onSelectDataSource(updated)
    } else {
      // Add to selection
      const source = dataSources.find(s => s.id === sourceId)
      if (source) {
        onSelectDataSource([...selectedDataSources, source])
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Data Sources
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select data sources to include in your report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Filters and Search */}
          <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search data sources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="entity">Entities</option>
                  <option value="account">Accounts</option>
                  <option value="trial_balance">Trial Balance</option>
                  <option value="system">System</option>
                </select>
              </div>

              {/* Selected Sources Count */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <div className="font-medium">Selected Sources</div>
                  <div className="text-lg font-bold">{selectedDataSources.length}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={loadDataSources}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Data Sources List */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Available Data Sources ({filteredDataSources.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSelectDataSource([])}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => onSelectDataSource(filteredDataSources)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    Select All
                  </button>
                </div>
              </div>
            </div>

            {/* Data Sources Grid */}
            <div className="flex-1 p-4 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredDataSources.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No data sources found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No data sources are available.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDataSources.map((source) => {
                    const IconComponent = getTypeIcon(source.type)
                    const isSelected = selectedDataSources.some(s => s.id === source.id)
                    
                    return (
                      <div
                        key={source.id}
                        className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => handleToggleSource(source.id)}
                      >
                        {/* Selection Indicator */}
                        <div className="absolute top-3 right-3">
                          {isSelected ? (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                          )}
                        </div>

                        {/* Source Icon and Type */}
                        <div className="flex items-start space-x-3 mb-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(source.color)}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {source.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {source.type.replace('_', ' ').toUpperCase()}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {source.description}
                        </p>

                        {/* Status and Last Updated */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              source.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            <span>{source.status}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(source.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectSource(source)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingSource(source)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedDataSources.length} source{selectedDataSources.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Apply Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataSourcesPanel
