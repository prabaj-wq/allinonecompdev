import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Settings, 
  BarChart3, 
  Shield, 
  Zap,
  Thermometer,
  Gauge,
  Network,
  Monitor
} from 'lucide-react'

const SystemMonitoring = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [systemMetrics, setSystemMetrics] = useState({})
  const [alerts, setAlerts] = useState([])
  const [performanceData, setPerformanceData] = useState([])
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')

  useEffect(() => {
    loadSystemData()
    const interval = setInterval(loadSystemData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadSystemData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock system metrics
      const mockMetrics = {
        cpu: {
          usage: Math.floor(Math.random() * 30) + 20,
          cores: 8,
          temperature: Math.floor(Math.random() * 20) + 45,
          status: 'healthy'
        },
        memory: {
          usage: Math.floor(Math.random() * 40) + 30,
          total: 32,
          available: 22,
          status: 'healthy'
        },
        disk: {
          usage: Math.floor(Math.random() * 20) + 60,
          total: 1000,
          available: 400,
          status: 'warning'
        },
        network: {
          incoming: Math.floor(Math.random() * 100) + 50,
          outgoing: Math.floor(Math.random() * 50) + 25,
          status: 'healthy'
        },
        database: {
          connections: Math.floor(Math.random() * 20) + 10,
          queries: Math.floor(Math.random() * 1000) + 500,
          status: 'healthy'
        },
        uptime: '15 days, 8 hours, 32 minutes',
        lastBackup: '2 hours ago',
        securityStatus: 'secure'
      }
      setSystemMetrics(mockMetrics)

      // Mock alerts
      const mockAlerts = [
        {
          id: 1,
          type: 'warning',
          message: 'Disk usage approaching 80% threshold',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          severity: 'medium'
        },
        {
          id: 2,
          type: 'info',
          message: 'Scheduled maintenance completed successfully',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          severity: 'low'
        },
        {
          id: 3,
          type: 'success',
          message: 'Backup completed successfully',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          severity: 'low'
        }
      ]
      setAlerts(mockAlerts)

      // Mock performance data
      const mockPerformance = Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString(),
        cpu: Math.floor(Math.random() * 30) + 20,
        memory: Math.floor(Math.random() * 40) + 30,
        disk: Math.floor(Math.random() * 20) + 60,
        network: Math.floor(Math.random() * 100) + 50
      }))
      setPerformanceData(mockPerformance)
    } catch (error) {
      console.error('Error loading system data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'info': return <Clock className="h-5 w-5 text-blue-600" />
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading system metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time system health & performance monitoring</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={loadSystemData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.cpu?.usage}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{systemMetrics.cpu?.cores} cores</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Cpu className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Temperature</span>
              <span>{systemMetrics.cpu?.temperature}°C</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${systemMetrics.cpu?.usage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.memory?.usage}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{systemMetrics.memory?.available}GB available</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Total: {systemMetrics.memory?.total}GB</span>
              <span>{systemMetrics.memory?.usage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${systemMetrics.memory?.usage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disk Usage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.disk?.usage}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{systemMetrics.disk?.available}GB free</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <HardDrive className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Total: {systemMetrics.disk?.total}GB</span>
              <span>{systemMetrics.disk?.usage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${systemMetrics.disk?.usage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Network</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.network?.incoming} MB/s</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Incoming</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Wifi className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Outgoing</span>
              <span>{systemMetrics.network?.outgoing} MB/s</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(systemMetrics.network?.outgoing / systemMetrics.network?.incoming) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Status</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Current system health indicators</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Server className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Server Status</span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('healthy')}`}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Healthy
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Database</span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('healthy')}`}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Healthy
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Security</span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('healthy')}`}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Secure
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Uptime</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{systemMetrics.uptime}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <HardDrive className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Last Backup</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{systemMetrics.lastBackup}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Alerts</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Recent system notifications</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{alert.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Trends</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">System performance over time</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">CPU</p>
              <p className="text-2xl font-bold text-blue-600">{systemMetrics.cpu?.usage}%</p>
              <TrendingUp className="h-4 w-4 mx-auto text-green-500" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Memory</p>
              <p className="text-2xl font-bold text-green-600">{systemMetrics.memory?.usage}%</p>
              <TrendingDown className="h-4 w-4 mx-auto text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Disk</p>
              <p className="text-2xl font-bold text-yellow-600">{systemMetrics.disk?.usage}%</p>
              <TrendingUp className="h-4 w-4 mx-auto text-yellow-500" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Network</p>
              <p className="text-2xl font-bold text-purple-600">{systemMetrics.network?.incoming} MB/s</p>
              <TrendingUp className="h-4 w-4 mx-auto text-green-500" />
            </div>
          </div>
          
          <div className="space-y-4">
            {performanceData.slice(-12).map((data, index) => (
              <div key={index} className="flex items-center space-x-4">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-16">{data.time}</span>
                <div className="flex-1 flex space-x-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${data.cpu}%` }}
                    ></div>
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${data.memory}%` }}
                    ></div>
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${data.disk}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Database Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Database Performance</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Database connection and query metrics</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{systemMetrics.database?.connections}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Connections</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{systemMetrics.database?.queries}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Queries/sec</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Gauge className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-600">98.5%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Response Time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemMonitoring
