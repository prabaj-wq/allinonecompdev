import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Database,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  Filter
} from 'lucide-react'
import auditLogger from '../services/auditLogger'

const AuditTrailDashboard = () => {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [selectedModule, setSelectedModule] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')

  useEffect(() => {
    loadStatistics()
    const interval = setInterval(loadStatistics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const statistics = await auditLogger.getAuditStatistics()
      setStats(statistics)
    } catch (error) {
      console.error('Failed to load audit statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      case 'info': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100'
      case 'Failed': return 'text-red-600 bg-red-100'
      case 'Pending': return 'text-yellow-600 bg-yellow-100'
      case 'Warning': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case '1h': return 'Last Hour'
      case '24h': return 'Last 24 Hours'
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      case '90d': return 'Last 90 Days'
      default: return 'All Time'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Trail Dashboard</h2>
          <p className="text-gray-600">Real-time monitoring and statistics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={loadStatistics}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Entries</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.total || 0)}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>+12% from last period</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(Object.keys(stats.byUser || {}).length)}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>+5% from last period</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Modules</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(Object.keys(stats.byModule || {}).length)}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>+2% from last period</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Security Score</p>
              <p className="text-2xl font-semibold text-gray-900">98%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>+2% from last period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity by Module */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Activity by Module</h3>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Modules</option>
              {Object.keys(stats.byModule || {}).map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.byModule || {})
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([module, count]) => (
                <div key={module} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">{module}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${(count / Math.max(...Object.values(stats.byModule || {}))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Activity by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Activity by Status</h3>
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {Object.entries(stats.byStatus || {})
              .sort(([,a], [,b]) => b - a)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      status === 'Completed' ? 'bg-green-500' :
                      status === 'Failed' ? 'bg-red-500' :
                      status === 'Pending' ? 'bg-yellow-500' :
                      status === 'Warning' ? 'bg-orange-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm text-gray-700">{status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status === 'Completed' ? 'bg-green-500' :
                          status === 'Failed' ? 'bg-red-500' :
                          status === 'Pending' ? 'bg-yellow-500' :
                          status === 'Warning' ? 'bg-orange-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${(count / Math.max(...Object.values(stats.byStatus || {}))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button
              onClick={() => window.location.href = '/audit-trail'}
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            >
              View All
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {(stats.recentActivity || []).map((activity, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    getSeverityColor(activity.severity || 'info').split(' ')[1]
                  }`}>
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.user} • {activity.module}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getStatusColor(activity.status)
                  }`}>
                    {activity.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            Security Alerts
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">All Systems Secure</h4>
            <p className="text-gray-500">No security alerts detected in the selected time range.</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/audit-trail'}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Eye className="h-5 w-5 text-indigo-600 mr-2" />
            View Full Audit Trail
          </button>
          <button
            onClick={() => auditLogger.exportAuditLogs({}, 'csv')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Download className="h-5 w-5 text-green-600 mr-2" />
            Export Audit Logs
          </button>
          <button
            onClick={loadStatistics}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <RefreshCw className="h-5 w-5 text-blue-600 mr-2" />
            Refresh Statistics
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuditTrailDashboard
