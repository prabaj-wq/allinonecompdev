import React, { useState, useEffect } from 'react'
import { 
  Link, 
  Zap, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Database, 
  Cloud, 
  Shield, 
  Activity, 
  BarChart3, 
  Globe, 
  Key, 
  Webhook, 
  Code, 
  TestTube, 
  Eye, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  ExternalLink,
  Lock,
  Unlock,
  Calendar,
  User,
  Tag,
  Copy,
  FileText
} from 'lucide-react'

const ThirdPartyIntegrations = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('integrations')
  const [integrations, setIntegrations] = useState([])
  const [webhooks, setWebhooks] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [syncHistory, setSyncHistory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [showNewIntegration, setShowNewIntegration] = useState(false)
  const [showNewWebhook, setShowNewWebhook] = useState(false)
  const [showNewApiKey, setShowNewApiKey] = useState(false)

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
          name: 'SAP ERP System',
          type: 'ERP',
          vendor: 'SAP SE',
          status: 'active',
          lastSync: '2024-01-15T10:30:00',
          nextSync: '2024-01-15T16:30:00',
          syncFrequency: '6 hours',
          dataTypes: ['GL', 'AP', 'AR', 'Assets'],
          connectionType: 'API',
          security: 'OAuth 2.0',
          lastSyncStatus: 'success',
          recordsSynced: 15420,
          errors: 0,
          apiEndpoint: 'https://api.sap.com/v1',
          description: 'SAP ERP integration for financial data synchronization'
        },
        {
          id: 2,
          name: 'Oracle NetSuite',
          type: 'Cloud ERP',
          vendor: 'Oracle Corporation',
          status: 'active',
          lastSync: '2024-01-15T09:15:00',
          nextSync: '2024-01-15T15:15:00',
          syncFrequency: '6 hours',
          dataTypes: ['GL', 'Revenue', 'Expenses'],
          connectionType: 'REST API',
          security: 'API Key',
          lastSyncStatus: 'success',
          recordsSynced: 8920,
          errors: 0,
          apiEndpoint: 'https://rest.netsuite.com/rest/platform/v1',
          description: 'NetSuite cloud ERP integration for financial consolidation'
        },
        {
          id: 3,
          name: 'Microsoft Dynamics 365',
          type: 'ERP',
          vendor: 'Microsoft',
          status: 'paused',
          lastSync: '2024-01-14T18:45:00',
          nextSync: '2024-01-15T00:45:00',
          syncFrequency: '6 hours',
          dataTypes: ['GL', 'Projects', 'Fixed Assets'],
          connectionType: 'OData',
          security: 'Azure AD',
          lastSyncStatus: 'warning',
          recordsSynced: 12350,
          errors: 3,
          apiEndpoint: 'https://api.dynamics.com/v9.0',
          description: 'Dynamics 365 integration for project accounting and assets'
        },
        {
          id: 4,
          name: 'Salesforce CRM',
          type: 'CRM',
          vendor: 'Salesforce Inc.',
          status: 'active',
          lastSync: '2024-01-15T11:00:00',
          nextSync: '2024-01-15T17:00:00',
          syncFrequency: '6 hours',
          dataTypes: ['Revenue', 'Opportunities', 'Accounts'],
          connectionType: 'REST API',
          security: 'OAuth 2.0',
          lastSyncStatus: 'success',
          recordsSynced: 5670,
          errors: 0,
          apiEndpoint: 'https://api.salesforce.com/services/data/v58.0',
          description: 'Salesforce CRM integration for revenue recognition'
        }
      ]
      setIntegrations(mockIntegrations)

      // Mock webhooks data
      const mockWebhooks = [
        {
          id: 1,
          name: 'SAP GL Update Webhook',
          url: 'https://webhook.site/sap-gl-updates',
          events: ['gl_update', 'gl_create', 'gl_delete'],
          status: 'active',
          lastTriggered: '2024-01-15T10:25:00',
          triggerCount: 156,
          security: 'HMAC',
          description: 'Webhook for SAP general ledger updates'
        },
        {
          id: 2,
          name: 'NetSuite Revenue Webhook',
          url: 'https://webhook.site/netsuite-revenue',
          events: ['revenue_update', 'revenue_create'],
          status: 'active',
          lastTriggered: '2024-01-15T09:10:00',
          triggerCount: 89,
          security: 'HMAC',
          description: 'Webhook for NetSuite revenue recognition events'
        }
      ]
      setWebhooks(mockWebhooks)

      // Mock API keys data
      const mockApiKeys = [
        {
          id: 1,
          name: 'SAP Integration Key',
          key: 'sk_live_...',
          permissions: ['read', 'write'],
          status: 'active',
          created: '2024-01-01T00:00:00',
          lastUsed: '2024-01-15T10:30:00',
          usageCount: 15420,
          description: 'API key for SAP ERP integration'
        },
        {
          id: 2,
          name: 'NetSuite Integration Key',
          key: 'ns_live_...',
          permissions: ['read', 'write'],
          status: 'active',
          created: '2024-01-01T00:00:00',
          lastUsed: '2024-01-15T09:15:00',
          usageCount: 8920,
          description: 'API key for NetSuite integration'
        }
      ]
      setApiKeys(mockApiKeys)

      // Mock sync history data
      const mockSyncHistory = [
        {
          id: 1,
          integration: 'SAP ERP System',
          status: 'success',
          startTime: '2024-01-15T10:00:00',
          endTime: '2024-01-15T10:30:00',
          duration: '30 minutes',
          recordsProcessed: 15420,
          recordsSynced: 15420,
          errors: 0,
          warnings: 0
        },
        {
          id: 2,
          integration: 'Oracle NetSuite',
          status: 'success',
          startTime: '2024-01-15T09:00:00',
          endTime: '2024-01-15T09:15:00',
          duration: '15 minutes',
          recordsProcessed: 8920,
          recordsSynced: 8920,
          errors: 0,
          warnings: 0
        },
        {
          id: 3,
          integration: 'Microsoft Dynamics 365',
          status: 'warning',
          startTime: '2024-01-14T18:30:00',
          endTime: '2024-01-14T18:45:00',
          duration: '15 minutes',
          recordsProcessed: 12350,
          recordsSynced: 12347,
          errors: 3,
          warnings: 1
        }
      ]
      setSyncHistory(mockSyncHistory)
    } catch (error) {
      console.error('Error loading integration data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSyncStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      case 'inactive': return <Clock className="h-4 w-4 text-gray-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getSyncStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredIntegrations = integrations.filter(integration => 
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">3rd Party Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage external system connections and data synchronization</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewIntegration(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Integration
          </button>
          <button
            onClick={loadIntegrationData}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Integrations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {integrations.filter(i => i.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Successful Syncs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {syncHistory.filter(s => s.status === 'success').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Webhook className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Webhooks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {webhooks.filter(w => w.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Key className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">API Keys</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {apiKeys.filter(k => k.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('integrations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'integrations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Integrations ({integrations.length})
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'webhooks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Webhooks ({webhooks.length})
            </button>
            <button
              onClick={() => setActiveTab('apiKeys')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'apiKeys'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              API Keys ({apiKeys.length})
            </button>
            <button
              onClick={() => setActiveTab('syncHistory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'syncHistory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Sync History ({syncHistory.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              {filteredIntegrations.map((integration) => (
                <div key={integration.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{integration.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(integration.status)}`}>
                          {getStatusIcon(integration.status)}
                          <span className="ml-1">{integration.status}</span>
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30">
                          {integration.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{integration.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vendor</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{integration.vendor}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Connection</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{integration.connectionType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Security</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{integration.security}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Frequency</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{integration.syncFrequency}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Last Sync</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(integration.lastSync).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Next Sync</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(integration.nextSync).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Records Synced</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{integration.recordsSynced.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Last Status</p>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getSyncStatusColor(integration.lastSyncStatus)}`}>
                            {getSyncStatusIcon(integration.lastSyncStatus)}
                            <span className="ml-1">{integration.lastSyncStatus}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {integration.dataTypes.map((type, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedIntegration(integration)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400" title="Test Connection">
                        <TestTube className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{webhook.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(webhook.status)}`}>
                          {getStatusIcon(webhook.status)}
                          <span className="ml-1">{webhook.status}</span>
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{webhook.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">URL</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{webhook.url}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Security</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{webhook.security}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Last Triggered</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(webhook.lastTriggered).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Trigger Count</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{webhook.triggerCount}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30">
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title="Test Webhook">
                        <TestTube className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'apiKeys' && (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{apiKey.name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(apiKey.status)}`}>
                          {getStatusIcon(apiKey.status)}
                          <span className="ml-1">{apiKey.status}</span>
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{apiKey.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">API Key</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">{apiKey.key}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Permissions</p>
                          <div className="flex flex-wrap gap-1">
                            {apiKey.permissions.map((permission, index) => (
                              <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900/30">
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(apiKey.created).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Last Used</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(apiKey.lastUsed).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Usage Count</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{apiKey.usageCount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title="Copy Key">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sync History Tab */}
          {activeTab === 'syncHistory' && (
            <div className="space-y-4">
              {syncHistory.map((sync) => (
                <div key={sync.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{sync.integration}</h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getSyncStatusColor(sync.status)}`}>
                          {getSyncStatusIcon(sync.status)}
                          <span className="ml-1">{sync.status}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Start Time</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(sync.startTime).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">End Time</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(sync.endTime).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{sync.duration}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getSyncStatusColor(sync.status)}`}>
                            {getSyncStatusIcon(sync.status)}
                            <span className="ml-1">{sync.status}</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Records Processed</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{sync.recordsProcessed.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Records Synced</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{sync.recordsSynced.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Errors</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{sync.errors}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Warnings</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{sync.warnings}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title="View Logs">
                        <FileText className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400" title="Retry">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Integration Details Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedIntegration.name}</h3>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Integration Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                    <p className="text-gray-900 dark:text-white">{selectedIntegration.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vendor</p>
                    <p className="text-gray-900 dark:text-white">{selectedIntegration.vendor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Connection Type</p>
                    <p className="text-gray-900 dark:text-white">{selectedIntegration.connectionType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Security</p>
                    <p className="text-gray-900 dark:text-white">{selectedIntegration.security}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">API Endpoint</p>
                    <p className="text-gray-900 dark:text-white break-all">{selectedIntegration.apiEndpoint}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Sync Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="text-gray-900 dark:text-white">{selectedIntegration.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sync Frequency</p>
                    <p className="text-gray-900 dark:text-white">{selectedIntegration.syncFrequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Sync</p>
                    <p className="text-gray-900 dark:text-white">{new Date(selectedIntegration.lastSync).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Next Sync</p>
                    <p className="text-gray-900 dark:text-white">{new Date(selectedIntegration.nextSync).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Records Synced</p>
                    <p className="text-gray-900 dark:text-white">{selectedIntegration.recordsSynced.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Data Types</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedIntegration.dataTypes.map((type, index) => (
                  <span key={index} className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30">
                    {type}
                  </span>
                ))}
              </div>
              
              <div className="flex space-x-3">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </button>
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </button>
                <button className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
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

export default ThirdPartyIntegrations
