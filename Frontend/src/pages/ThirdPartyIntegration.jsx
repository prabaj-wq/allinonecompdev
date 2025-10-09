import React, { useState, useEffect } from 'react'
import { 
  Link, 
  Plus, 
  Search, 
  Filter, 
  Settings, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  Database,
  Cloud,
  Shield,
  Activity,
  BarChart3,
  Zap,
  Globe,
  Lock,
  Key,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  FileText,
  Calendar,
  User,
  Tag
} from 'lucide-react'

const ThirdPartyIntegration = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('integrations')
  const [integrations, setIntegrations] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [webhooks, setWebhooks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [showNewIntegration, setShowNewIntegration] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  useEffect(() => {
    loadIntegrationData()
  }, [])

  const loadIntegrationData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock integrations data
      const mockIntegrations = [
        {
          id: 1,
          name: 'QuickBooks Online',
          type: 'Accounting Software',
          status: 'active',
          lastSync: '2024-01-15T14:30:00',
          syncFrequency: 'hourly',
          apiVersion: 'v3.0',
          endpoints: ['accounts', 'transactions', 'invoices'],
          dataVolume: '2.5GB',
          lastError: null,
          health: 'excellent',
          tags: ['accounting', 'quickbooks', 'sync']
        },
        {
          id: 2,
          name: 'Salesforce CRM',
          type: 'Customer Management',
          status: 'active',
          lastSync: '2024-01-15T13:45:00',
          syncFrequency: 'daily',
          apiVersion: 'v58.0',
          endpoints: ['contacts', 'opportunities', 'accounts'],
          dataVolume: '1.8GB',
          lastError: null,
          health: 'good',
          tags: ['crm', 'salesforce', 'customers']
        },
        {
          id: 3,
          name: 'Xero Accounting',
          type: 'Accounting Software',
          status: 'inactive',
          lastSync: '2024-01-10T09:20:00',
          syncFrequency: 'daily',
          apiVersion: 'v2.0',
          endpoints: ['accounts', 'transactions'],
          dataVolume: '950MB',
          lastError: 'API rate limit exceeded',
          health: 'poor',
          tags: ['accounting', 'xero', 'inactive']
        },
        {
          id: 4,
          name: 'Microsoft Dynamics',
          type: 'ERP System',
          status: 'active',
          lastSync: '2024-01-15T12:15:00',
          syncFrequency: 'real-time',
          apiVersion: 'v9.0',
          endpoints: ['entities', 'transactions', 'dimensions'],
          dataVolume: '4.2GB',
          lastError: null,
          health: 'excellent',
          tags: ['erp', 'dynamics', 'real-time']
        }
      ]
      setIntegrations(mockIntegrations)

      // Mock API keys data
      const mockApiKeys = [
        {
          id: 1,
          name: 'QuickBooks API Key',
          key: 'qb_****_****_****_****',
          status: 'active',
          permissions: ['read', 'write'],
          createdAt: '2024-01-01T00:00:00',
          lastUsed: '2024-01-15T14:30:00',
          usage: '2,450 calls/month'
        },
        {
          id: 2,
          name: 'Salesforce API Key',
          key: 'sf_****_****_****_****',
          status: 'active',
          permissions: ['read'],
          createdAt: '2024-01-05T00:00:00',
          lastUsed: '2024-01-15T13:45:00',
          usage: '1,890 calls/month'
        }
      ]
      setApiKeys(mockApiKeys)

      // Mock webhooks data
      const mockWebhooks = [
        {
          id: 1,
          name: 'Transaction Update Webhook',
          url: 'https://api.company.com/webhooks/transactions',
          status: 'active',
          events: ['transaction.created', 'transaction.updated'],
          lastTriggered: '2024-01-15T14:25:00',
          successRate: '98.5%',
          retryCount: 0
        },
        {
          id: 2,
          name: 'Error Alert Webhook',
          url: 'https://api.company.com/webhooks/errors',
          status: 'active',
          events: ['error.occurred', 'sync.failed'],
          lastTriggered: '2024-01-15T10:15:00',
          successRate: '100%',
          retryCount: 0
        }
      ]
      setWebhooks(mockWebhooks)
    } catch (error) {
      console.error('Error loading integration data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'fair': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthIcon = (health) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'fair': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'poor': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredIntegrations = integrations.filter(integration => 
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Third Party Integrations</h1>
              <p className="text-sm text-gray-600 mt-1">Manage external system connections and API integrations</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewIntegration(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Integration
              </button>
              <button
                onClick={loadIntegrationData}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'integrations', label: 'Integrations', icon: Link },
              { id: 'api-keys', label: 'API Keys', icon: Key },
              { id: 'webhooks', label: 'Webhooks', icon: Zap },
              { id: 'monitoring', label: 'Monitoring', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search integrations, types, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Loading integrations...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {filteredIntegrations.map((integration) => (
                  <div key={integration.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Database className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {integration.name}
                              </h3>
                              <p className="text-sm text-gray-500">{integration.type}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                            {integration.status}
                          </span>
                          <div className={`${getHealthColor(integration.health)}`}>
                            {getHealthIcon(integration.health)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Last Sync:</span>
                          <span className="text-gray-900">
                            {new Date(integration.lastSync).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Sync Frequency:</span>
                          <span className="text-gray-900">{integration.syncFrequency}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">API Version:</span>
                          <span className="text-gray-900">{integration.apiVersion}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Data Volume:</span>
                          <span className="text-gray-900">{integration.dataVolume}</span>
                        </div>
                      </div>

                      {integration.lastError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                            <p className="text-sm text-red-700">{integration.lastError}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {integration.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {tag}
                            </span>
                          ))}
                          {integration.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{integration.tags.length - 3}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                            <Settings className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                            <Activity className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">API Keys</h3>
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New API Key
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Key</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiKeys.map((apiKey) => (
                      <tr key={apiKey.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{apiKey.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{apiKey.key}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${apiKey.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {apiKey.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {apiKey.permissions.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(apiKey.lastUsed).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{apiKey.usage}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Revoke</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Webhooks</h3>
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Webhook
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Triggered</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {webhooks.map((webhook) => (
                      <tr key={webhook.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{webhook.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono max-w-xs truncate">{webhook.url}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${webhook.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {webhook.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {webhook.events.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(webhook.lastTriggered).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{webhook.successRate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Integration Health Overview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Health Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Integrations</span>
                    <span className="text-2xl font-bold text-green-600">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Inactive Integrations</span>
                    <span className="text-2xl font-bold text-gray-600">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="text-2xl font-bold text-red-600">2.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Response Time</span>
                    <span className="text-2xl font-bold text-blue-600">245ms</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">QuickBooks sync completed successfully</span>
                    <span className="text-xs text-gray-400 ml-auto">2 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Salesforce data updated</span>
                    <span className="text-xs text-gray-400 ml-auto">15 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Xero API rate limit exceeded</span>
                    <span className="text-xs text-gray-400 ml-auto">1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">98.5%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">2.3s</div>
                  <div className="text-sm text-gray-600">Avg Sync Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">15.2K</div>
                  <div className="text-sm text-gray-600">API Calls Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">99.1%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ThirdPartyIntegration
