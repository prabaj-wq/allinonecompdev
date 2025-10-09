import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useCompany } from '../../contexts/CompanyContext'
import { Shield, Server, Database, Cloud, Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle, XCircle, Activity, Clock, Users, HardDrive, Zap, Settings, MoreVertical, Download, Upload, Eye, Trash2, Edit3, Plus, Filter, Search, BarChart3, TrendingUp, AlertCircle, X } from 'lucide-react'
import AdminAuthWrapper from './components/AdminAuthWrapper'
import RoleManagementNavigation from './components/RoleManagementNavigation'

const SystemIntegrationMonitor = () => {
  // ===== CONTEXT HOOKS =====
  const { selectedCompany: authSelectedCompany } = useAuth()
  const { selectedCompany: companyContextCompany } = useCompany()
  
  // Use the company from auth context as primary, fallback to company context
  const selectedCompany = authSelectedCompany || companyContextCompany
  
  // ===== STATE MANAGEMENT =====
  const [integrations, setIntegrations] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // grid or list
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Filter integrations based on status and search
  const filteredIntegrations = integrations.filter(integration => {
    const matchesFilter = filter === 'all' || integration.status === filter
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.type.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Mock integration data
  const mockIntegrations = [
    {
      id: 1,
      name: 'EPM Tool Database',
      type: 'PostgreSQL',
      description: 'Main application database',
      status: 'connected',
      lastSync: new Date(Date.now() - 5 * 60 * 1000),
      host: 'localhost:5432',
      database: 'epm_tool',
      users: 25,
      tables: 15,
      health: 98,
      responseTime: 45
    },
    {
      id: 2,
      name: 'Authentication Service',
      type: 'Internal API',
      description: 'User authentication and authorization',
      status: 'connected',
      lastSync: new Date(Date.now() - 2 * 60 * 1000),
      host: 'localhost:8000/api/auth',
      database: 'auth_tokens',
      users: 25,
      tables: 3,
      health: 100,
      responseTime: 12
    },
    {
      id: 3,
      name: 'Company Database - FinFusion360',
      type: 'PostgreSQL',
      description: 'FinFusion360 company data',
      status: 'connected',
      lastSync: new Date(Date.now() - 10 * 60 * 1000),
      host: 'localhost:5432',
      database: 'FinFusion360',
      users: 8,
      tables: 12,
      health: 95,
      responseTime: 67
    },
    {
      id: 4,
      name: 'Company Database - Default Company',
      type: 'PostgreSQL',
      description: 'Default company data',
      status: 'connected',
      lastSync: new Date(Date.now() - 15 * 60 * 1000),
      host: 'localhost:5432',
      database: 'Default Company',
      users: 12,
      tables: 18,
      health: 92,
      responseTime: 89
    },
    {
      id: 5,
      name: 'Backup Service',
      type: 'File System',
      description: 'Automated database backups',
      status: 'warning',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      host: '/var/backups',
      database: 'backup_files',
      users: 1,
      tables: 0,
      health: 75,
      responseTime: 234
    },
    {
      id: 6,
      name: 'External API Gateway',
      type: 'REST API',
      description: 'Third-party integrations',
      status: 'error',
      lastSync: new Date(Date.now() - 6 * 60 * 60 * 1000),
      host: 'api.external.com',
      database: 'N/A',
      users: 0,
      tables: 0,
      health: 0,
      responseTime: 0
    }
  ];

  useEffect(() => {
    // Load integrations data
    setIntegrations(mockIntegrations);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      // Update last sync times
      setIntegrations(prev => prev.map(integration => ({
        ...integration,
        lastSync: integration.status === 'connected' ? new Date() : integration.lastSync
      })));
    }, 2000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default:
        return <Server className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  const getIntegrationIcon = (type) => {
    switch (type) {
      case 'PostgreSQL':
        return <Database className="h-6 w-6 text-blue-400" />
      case 'Internal API':
        return <Server className="h-6 w-6 text-green-400" />
      case 'REST API':
        return <Wifi className="h-6 w-6 text-purple-400" />
      case 'File System':
        return <Server className="h-6 w-6 text-orange-400" />
      default:
        return <Server className="h-6 w-6 text-gray-400" />
    }
  }

  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const warningCount = integrations.filter(i => i.status === 'warning').length
  const errorCount = integrations.filter(i => i.status === 'error').length
  const avgHealth = integrations.length > 0 ? integrations.reduce((sum, i) => sum + i.health, 0) / integrations.length : 0

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
        <main className="p-6 space-y-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Navigation */}
            <RoleManagementNavigation />
            
            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    System Integration Monitor
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Monitor system integrations and connection status for {selectedCompany}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Integration</span>
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh Status</span>
                  </button>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search integrations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Filter */}
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="connected">Connected</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  {/* View Mode Toggle */}
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  >
                    <Activity className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Integrations</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{integrations.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Connected</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{connectedCount}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Warnings</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{warningCount}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Errors</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{errorCount}</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Cards */}
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredIntegrations.map((integration) => (
                <div key={integration.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getIntegrationIcon(integration.type)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{integration.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{integration.type}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                      {integration.status}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{integration.description}</p>
                  
                  {/* Integration Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Host:</span>
                      <span className="text-gray-900 dark:text-white font-mono text-xs">{integration.host}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Database:</span>
                      <span className="text-gray-900 dark:text-white">{integration.database}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Users:</span>
                      <span className="text-gray-900 dark:text-white">{integration.users}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Tables:</span>
                      <span className="text-gray-900 dark:text-white">{integration.tables}</span>
                    </div>
                  </div>

                  {/* Health Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Health</span>
                      <span className="text-gray-900 dark:text-white font-medium">{integration.health}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          integration.health >= 80 ? 'bg-green-500' :
                          integration.health >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${integration.health}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Response Time */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-500 dark:text-gray-400">Response Time:</span>
                    <span className={`font-medium ${
                      integration.responseTime < 100 ? 'text-green-600 dark:text-green-400' :
                      integration.responseTime < 500 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {integration.responseTime}ms
                    </span>
                  </div>

                  {/* Last Sync */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-500 dark:text-gray-400">Last Sync:</span>
                    <span className="text-gray-900 dark:text-white">{integration.lastSync.toLocaleTimeString()}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => showToast(`Testing connection to ${integration.name}...`, 'info')}
                        className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <Zap className="h-3 w-3" />
                        <span>Test</span>
                      </button>
                      <button
                        onClick={() => setSelectedIntegration(integration)}
                        className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => showToast(`Configuring ${integration.name}...`, 'info')}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => showToast(`Refreshing ${integration.name}...`, 'info')}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              {toast.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-auto p-1 hover:bg-black hover:bg-opacity-20 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminAuthWrapper>
  )
}

export default SystemIntegrationMonitor;
