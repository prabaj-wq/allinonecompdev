import React, { useState, useEffect } from 'react'
import { 
  Server, 
  Code, 
  FileText, 
  Play, 
  RefreshCw, 
  Plus, 
  Edit, 
  Eye, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Activity, 
  BarChart3, 
  Settings, 
  Shield, 
  Database, 
  Search,
  Filter,
  Calculator
} from 'lucide-react'

const APIIntegrations = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [apis, setApis] = useState([])
  const [selectedApi, setSelectedApi] = useState(null)
  const [showNewApi, setShowNewApi] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadAPIData()
  }, [])

  const loadAPIData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock API data
      const mockAPIs = [
        {
          id: 1,
          name: 'Financial Data API',
          description: 'Real-time financial data integration for market feeds',
          baseUrl: 'https://api.financial-data.com/v1',
          status: 'active',
          version: '1.2.0',
          endpoints: 24,
          rateLimit: '1000 requests/hour',
          lastUsed: '2024-01-15T10:30:00',
          responseTime: 245,
          successRate: 99.8,
          category: 'Financial',
          authentication: 'OAuth 2.0',
          documentation: 'https://docs.financial-data.com',
          tags: ['financial', 'real-time', 'market-data']
        },
        {
          id: 2,
          name: 'Banking Integration API',
          description: 'Secure banking data integration for account reconciliation',
          baseUrl: 'https://api.banking-integration.com/v2',
          status: 'active',
          version: '2.1.0',
          endpoints: 18,
          rateLimit: '500 requests/hour',
          lastUsed: '2024-01-15T09:15:00',
          responseTime: 189,
          successRate: 99.9,
          category: 'Banking',
          authentication: 'API Key + JWT',
          documentation: 'https://docs.banking-integration.com',
          tags: ['banking', 'secure', 'reconciliation']
        },
        {
          id: 3,
          name: 'Tax Calculation API',
          description: 'Automated tax calculation and compliance checking',
          baseUrl: 'https://api.tax-calculation.com/v1',
          status: 'maintenance',
          version: '1.0.5',
          endpoints: 12,
          rateLimit: '2000 requests/hour',
          lastUsed: '2024-01-15T08:45:00',
          responseTime: 156,
          successRate: 99.7,
          category: 'Tax',
          authentication: 'API Key',
          documentation: 'https://docs.tax-calculation.com',
          tags: ['tax', 'compliance', 'calculation']
        },
        {
          id: 4,
          name: 'Audit Trail API',
          description: 'Comprehensive audit trail and logging system',
          baseUrl: 'https://api.audit-trail.com/v1',
          status: 'active',
          version: '1.3.2',
          endpoints: 8,
          rateLimit: '5000 requests/hour',
          lastUsed: '2024-01-15T11:20:00',
          responseTime: 89,
          successRate: 100.0,
          category: 'Audit',
          authentication: 'API Key + IP Whitelist',
          documentation: 'https://docs.audit-trail.com',
          tags: ['audit', 'logging', 'compliance']
        }
      ]
      setApis(mockAPIs)
    } catch (error) {
      console.error('Error loading API data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'inactive': return <XCircle className="h-4 w-4 text-gray-600" />
      case 'maintenance': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Financial': return <BarChart3 className="h-5 w-5 text-blue-600" />
      case 'Banking': return <Database className="h-5 w-5 text-green-600" />
      case 'Tax': return <Calculator className="h-5 w-5 text-purple-600" />
      case 'Audit': return <Shield className="h-5 w-5 text-orange-600" />
      default: return <Server className="h-5 w-5 text-gray-600" />
    }
  }

  const filteredAPIs = apis.filter(api => {
    const matchesSearch = api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         api.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         api.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || api.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading API integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage external API connections and integrations</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewApi(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New API
          </button>
          <button
            onClick={loadAPIData}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* API Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total APIs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{apis.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active APIs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {apis.filter(api => api.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Endpoints</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {apis.reduce((sum, api) => sum + api.endpoints, 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Code className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(apis.reduce((sum, api) => sum + api.responseTime, 0) / apis.length)}ms
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search APIs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="error">Error</option>
            </select>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-white">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* API List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">API Integrations</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and monitor external API connections</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {filteredAPIs.map((api) => (
              <div key={api.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getCategoryIcon(api.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{api.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(api.status)}`}>
                          {getStatusIcon(api.status)}
                          <span className="ml-1">{api.status}</span>
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">v{api.version}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">{api.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Base URL</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{api.baseUrl}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Endpoints</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{api.endpoints}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Rate Limit</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{api.rateLimit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Response Time</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{api.responseTime}ms</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Category: {api.category}</span>
                        <span>Auth: {api.authentication}</span>
                        <span>Success Rate: {api.successRate}%</span>
                        <span>Last Used: {new Date(api.lastUsed).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {api.tags.map((tag, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedApi(api)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400" title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400" title="Test">
                      <Play className="h-4 w-4" />
                    </button>
                    <a
                      href={api.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
                      title="Documentation"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API Details Modal */}
      {selectedApi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedApi.name}</h3>
              <button
                onClick={() => setSelectedApi(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">API Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                    <p className="text-gray-900 dark:text-white">{selectedApi.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Base URL</p>
                    <p className="text-gray-900 dark:text-white font-mono text-sm">{selectedApi.baseUrl}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Version</p>
                    <p className="text-gray-900 dark:text-white">{selectedApi.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Authentication</p>
                    <p className="text-gray-900 dark:text-white">{selectedApi.authentication}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Performance Metrics</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Response Time</p>
                    <p className="text-gray-900 dark:text-white">{selectedApi.responseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
                    <p className="text-gray-900 dark:text-white">{selectedApi.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rate Limit</p>
                    <p className="text-gray-900 dark:text-white">{selectedApi.rateLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Used</p>
                    <p className="text-gray-900 dark:text-white">{new Date(selectedApi.lastUsed).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <a
                  href={selectedApi.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Documentation
                </a>
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Play className="h-4 w-4 mr-2" />
                  Test API
                </button>
                <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default APIIntegrations
