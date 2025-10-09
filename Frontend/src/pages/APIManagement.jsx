import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'
import { 
  Server, 
  Database, 
  FileSpreadsheet, 
  Network, 
  Key, 
  Plus,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  AlertCircle,
  Info,
  Settings,
  Zap,
  Globe,
  Lock,
  Unlock,
  Activity,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'

const APIManagement = () => {
  const { user } = useAuth()
  const { selectedCompany } = useCompany()
  const [apis, setApis] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingApi, setEditingApi] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [activeTab, setActiveTab] = useState('integrations')
  const [testResults, setTestResults] = useState({})

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'sap',
    baseUrl: '',
    apiKey: '',
    secretKey: '',
    username: '',
    password: '',
    description: '',
    isActive: true,
    rateLimit: 1000,
    timeout: 30
  })

  useEffect(() => {
    loadAPIs()
  }, [])

  const loadAPIs = async () => {
    setIsLoading(true)
    try {
      // Mock data for demonstration
      const mockApis = [
        {
          id: 1,
          name: 'SAP ECC Production',
          type: 'sap',
          baseUrl: 'https://sap.company.com',
          description: 'SAP ECC production system for financial data',
          isActive: true,
          rateLimit: 1000,
          timeout: 30
        },
        {
          id: 2,
          name: 'Excel Data Import',
          type: 'excel',
          baseUrl: 'local://excel-import',
          description: 'Excel file import and processing system',
          isActive: true,
          rateLimit: 500,
          timeout: 60
        },
        {
          id: 3,
          name: 'Bank API Integration',
          type: 'rest',
          baseUrl: 'https://api.bank.com/v1',
          description: 'Bank transaction data integration',
          isActive: false,
          rateLimit: 100,
          timeout: 15
        }
      ]
      setApis(mockApis)
    } catch (error) {
      setMessage('Failed to load APIs', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingApi) {
        // Update existing API
        setApis(prev => prev.map(api => 
          api.id === editingApi.id ? { ...api, ...formData } : api
        ))
        setMessage('API updated successfully', 'success')
      } else {
        // Add new API
        const newApi = {
          id: Date.now(),
          ...formData
        }
        setApis(prev => [...prev, newApi])
        setMessage('API added successfully', 'success')
      }
      
      setShowAddModal(false)
      setEditingApi(null)
      resetForm()
    } catch (error) {
      setMessage(`Error: ${error.message}`, 'error')
    }
  }

  const handleEdit = (api) => {
    setEditingApi(api)
    setFormData({
      name: api.name,
      type: api.type,
      baseUrl: api.baseUrl,
      apiKey: api.apiKey || '',
      secretKey: api.secretKey || '',
      username: api.username || '',
      password: api.password || '',
      description: api.description,
      isActive: api.isActive,
      rateLimit: api.rateLimit,
      timeout: api.timeout
    })
    setShowAddModal(true)
  }

  const handleDelete = async (apiId) => {
    if (!window.confirm('Are you sure you want to delete this API?')) return
    
    try {
      setApis(prev => prev.filter(api => api.id !== apiId))
      setMessage('API deleted successfully', 'success')
    } catch (error) {
      setMessage(`Error: ${error.message}`, 'error')
    }
  }

  const handleToggleStatus = async (apiId, currentStatus) => {
    try {
      setApis(prev => prev.map(api => 
        api.id === apiId ? { ...api, isActive: !currentStatus } : api
      ))
      setMessage(`API ${currentStatus ? 'deactivated' : 'activated'} successfully`, 'success')
    } catch (error) {
      setMessage(`Error: ${error.message}`, 'error')
    }
  }

  const handleTestAPI = async (api) => {
    try {
      setTestResults(prev => ({ ...prev, [api.id]: 'testing' }))
      
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const success = Math.random() > 0.3 // 70% success rate for demo
      setTestResults(prev => ({ ...prev, [api.id]: success ? 'success' : 'error' }))
      setMessage(
        success ? `API test successful for ${api.name}` : `API test failed for ${api.name}`,
        success ? 'success' : 'error'
      )
    } catch (error) {
      setTestResults(prev => ({ ...prev, [api.id]: 'error' }))
      setMessage(`API test error: ${error.message}`, 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'sap',
      baseUrl: '',
      apiKey: '',
      secretKey: '',
      username: '',
      password: '',
      description: '',
      isActive: true,
      rateLimit: 1000,
      timeout: 30
    })
  }

  const getMessageIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getMessageColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default: return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getTestResultIcon = (result) => {
    switch (result) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'testing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default: return null
    }
  }

  const getAPITypeIcon = (type) => {
    switch (type) {
      case 'sap': return <Database className="w-5 h-5 text-blue-500" />
      case 'excel': return <FileSpreadsheet className="w-5 h-5 text-green-500" />
      case 'rest': return <Globe className="w-5 h-5 text-purple-500" />
      case 'soap': return <Server className="w-5 h-5 text-orange-500" />
      default: return <Network className="w-5 h-5 text-gray-500" />
    }
  }

  const tabs = [
    { id: 'integrations', label: 'API Integrations', icon: Network },
    { id: 'sap', label: 'SAP Integration', icon: Database },
    { id: 'excel', label: 'Excel Integration', icon: FileSpreadsheet },
    { id: 'monitoring', label: 'API Monitoring', icon: Activity }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                API Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage third-party integrations, SAP connections, and Excel data sources
              </p>
            </div>
            <button
              onClick={() => {
                setEditingApi(null)
                resetForm()
                setShowAddModal(true)
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New API
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg border ${getMessageColor(messageType)} flex items-center space-x-2`}>
              {getMessageIcon(messageType)}
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* API Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Active API Integrations
                  </h3>
                  <button
                    onClick={loadAPIs}
                    className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </button>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Loading APIs...</p>
                  </div>
                ) : apis.length === 0 ? (
                  <div className="text-center py-8">
                    <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No APIs configured
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Get started by adding your first API integration
                    </p>
                    <button
                      onClick={() => {
                        setEditingApi(null)
                        resetForm()
                        setShowAddModal(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add First API
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {apis.map((api) => (
                      <div
                        key={api.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getAPITypeIcon(api.type)}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {api.name}
                              </h4>
                              <p className="text-sm text-gray-500">{api.description}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-xs text-gray-400">
                                  {api.baseUrl}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  api.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {api.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleTestAPI(api)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Test API"
                            >
                              {getTestResultIcon(testResults[api.id]) || <Play className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleEdit(api)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit API"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(api.id, api.isActive)}
                              className={`p-2 rounded-lg ${
                                api.isActive
                                  ? 'text-green-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-red-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={api.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {api.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(api.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete API"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SAP Integration Tab */}
            {activeTab === 'sap' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Database className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-200">
                        SAP Integration
                      </h3>
                      <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                        Connect to SAP systems to pull financial data, master data, and transaction data.
                        Supports both SAP ECC and S/4HANA systems.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">SAP ECC</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Connection Status</span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Connected</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Sync</span>
                        <span className="text-xs text-gray-500">2 hours ago</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Data Points</span>
                        <span className="text-xs text-gray-500">1,247</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">SAP S/4HANA</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Connection Status</span>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Sync</span>
                        <span className="text-xs text-gray-500">Never</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Data Points</span>
                        <span className="text-xs text-gray-500">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Excel Integration Tab */}
            {activeTab === 'excel' && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <FileSpreadsheet className="w-6 h-6 text-green-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-green-900 dark:text-green-200">
                        Excel Integration
                      </h3>
                      <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                        Import and export financial data using Excel files. Supports multiple formats including
                        .xlsx, .xls, and .csv files with automatic data validation and mapping.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Import Templates</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div>
                          <h5 className="font-medium text-sm text-gray-900 dark:text-white">Trial Balance</h5>
                          <p className="text-xs text-gray-500">Standard TB format</p>
                        </div>
                        <Download className="w-4 h-4 text-blue-500 cursor-pointer hover:text-blue-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div>
                          <h5 className="font-medium text-sm text-gray-900 dark:text-white">Journal Entries</h5>
                          <p className="text-xs text-gray-500">JE import format</p>
                        </div>
                        <Download className="w-4 h-4 text-blue-500 cursor-pointer hover:text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Export Formats</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div>
                          <h5 className="font-medium text-sm text-gray-900 dark:text-white">Financial Statements</h5>
                          <p className="text-xs text-gray-500">P&L, BS, CF</p>
                        </div>
                        <Upload className="w-4 h-4 text-green-500 cursor-pointer hover:text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div>
                          <h5 className="font-medium text-sm text-gray-900 dark:text-white">Consolidation Data</h5>
                          <p className="text-xs text-gray-500">Consolidated reports</p>
                        </div>
                        <Upload className="w-4 h-4 text-green-500 cursor-pointer hover:text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Active APIs</p>
                        <p className="text-2xl font-bold text-green-600">3</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Activity className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Total Requests</p>
                        <p className="text-2xl font-bold text-blue-600">2.4K</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Errors</p>
                        <p className="text-2xl font-bold text-yellow-600">23</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Zap className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Avg Response</p>
                        <p className="text-2xl font-bold text-purple-600">245ms</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit API Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingApi ? 'Edit API' : 'Add New API'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingApi(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="sap">SAP</option>
                      <option value="excel">Excel</option>
                      <option value="rest">REST API</option>
                      <option value="soap">SOAP</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base URL
                  </label>
                  <input
                    type="url"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://api.example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    API is active
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingApi(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingApi ? 'Update API' : 'Add API'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default APIManagement
