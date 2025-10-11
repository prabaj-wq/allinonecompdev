import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useCompany } from '../../contexts/CompanyContext'
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, Download, RefreshCw, Filter, Search, X, Calendar, User, Activity, Database, Settings, Eye, Trash2, BarChart3, TrendingUp, AlertCircle, Plus, ExternalLink } from 'lucide-react'
import AdminAuthWrapper from './components/AdminAuthWrapper'
import RoleManagementNavigation from './components/RoleManagementNavigation'

const ComplianceAuditCenter = () => {
  // ===== CONTEXT HOOKS =====
  const { selectedCompany: authSelectedCompany } = useAuth()
  const { selectedCompany: companyContextCompany } = useCompany()
  
  // Use the company from auth context as primary, fallback to company context
  const selectedCompany = authSelectedCompany || companyContextCompany
  
  // ===== STATE MANAGEMENT =====
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState(null)
  const [dateRange, setDateRange] = useState('today')
  const [selectedLog, setSelectedLog] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [viewMode, setViewMode] = useState('table') // table or cards
  const [autoRefresh, setAutoRefresh] = useState(false)
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchAuditLogs = useCallback(
    async (showSuccessMessage = false) => {
      if (!selectedCompany) {
        setAuditLogs([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const params = new URLSearchParams({
          company_name: selectedCompany,
          limit: '200',
          offset: '0'
        })

        const response = await fetch(`/api/role-management/audit-logs?${params.toString()}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch audit logs')
        }

        const data = await response.json()
        const normalisedLogs = Array.isArray(data.logs)
          ? data.logs.map((log, index) => ({
              id: log.id ?? `${index}-${log.timestamp ?? ''}`,
              timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
              user: log.username || log.user || 'unknown',
              action: log.action || 'Activity',
              resource: log.resource || log.resource_id || 'N/A',
              status: log.status || 'success',
              details: log.details || '',
              ip: log.ip_address || log.ip || 'N/A'
            }))
          : []

        setAuditLogs(normalisedLogs)
        if (showSuccessMessage) {
          showToast('Audit logs refreshed', 'success')
        }
      } catch (error) {
        console.error('Failed to load audit logs', error)
        setAuditLogs([])
        showToast('Failed to load audit logs', 'error')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [selectedCompany]
  )

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  useEffect(() => {
    if (!autoRefresh) {
      return undefined
    }
    const interval = setInterval(() => {
      fetchAuditLogs()
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchAuditLogs])

  // Enhanced filtering with search and date range
  const filteredLogs = auditLogs.filter(log => {
    const matchesFilter = filter === 'all' || log.status === filter
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesDateRange = true
    const now = new Date()
    const logDate = new Date(log.timestamp)
    
    switch (dateRange) {
      case 'today':
        matchesDateRange = logDate.toDateString() === now.toDateString()
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDateRange = logDate >= weekAgo
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDateRange = logDate >= monthAgo
        break
      default:
        matchesDateRange = true
    }
    
    return matchesFilter && matchesSearch && matchesDateRange
  })

  // Statistics
  const totalLogs = auditLogs.length
  const successLogs = auditLogs.filter(log => log.status === 'success').length
  const failedLogs = auditLogs.filter(log => log.status === 'failed').length
  const todayLogs = auditLogs.filter(log => {
    const today = new Date().toDateString()
    return new Date(log.timestamp).toDateString() === today
  }).length

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource', 'IP Address', 'Status', 'Details'],
      ...filteredLogs.map(log => [
        (log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)).toISOString(),
        log.user,
        log.action,
        log.resource,
        log.ip || 'N/A',
        log.status,
        log.details
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


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
                    Compliance Audit Center
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Monitor system activities and compliance for {selectedCompany}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                      autoRefresh 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Activity className="h-4 w-4" />
                    <span>Auto Refresh</span>
                  </button>
                  <button
                    onClick={() => {
                      setRefreshing(true)
                      fetchAuditLogs(true)
                    }}
                    disabled={refreshing}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Logs</span>
                  </button>
                </div>
              </div>

              {/* Advanced Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </select>

                  {/* Date Range Filter */}
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  {/* View Mode Toggle */}
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-lg ${viewMode === 'cards' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Logs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalLogs}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Success</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{successLogs}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Failed</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{failedLogs}</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayLogs}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Audit Logs</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Timestamp</th>
                      <th className="text-left p-4 text-gray-900 dark:text-white font-medium">User</th>
                      <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Action</th>
                      <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Resource</th>
                      <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Status</th>
                      <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-500 dark:text-gray-400">
                          Loading audit logs...
                        </td>
                      </tr>
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-500 dark:text-gray-400">
                          No audit activity found for the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="p-4 text-gray-900 dark:text-white">
                            {(log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)).toLocaleString()}
                          </td>
                          <td className="p-4 text-gray-900 dark:text-white">{log.user}</td>
                          <td className="p-4 text-gray-900 dark:text-white">{log.action}</td>
                          <td className="p-4 text-gray-900 dark:text-white">{log.resource}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500 dark:text-gray-400">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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

export default ComplianceAuditCenter
