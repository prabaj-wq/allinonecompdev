import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building2, 
  BarChart3, 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Download, 
  RefreshCw, 
  Eye, 
  Edit, 
  FileText, 
  Shield, 
  Upload,
  Settings
} from 'lucide-react'
import { useCompany } from '../contexts/CompanyContext'
import ConsolidationService from '../services/consolidationService'

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('January')
  const [selectedYear, setSelectedYear] = useState('2025')
  const [financialData, setFinancialData] = useState({})
  const [tasks, setTasks] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [alerts, setAlerts] = useState([])
  const [performanceMetrics, setPerformanceMetrics] = useState({})
  const { selectedCompany, entities, accounts } = useCompany()

  console.log('📊 Dashboard: selectedCompany:', selectedCompany, 'entities:', entities, 'accounts:', accounts)

  useEffect(() => {
    console.log('📊 Dashboard: useEffect triggered, selectedCompany:', selectedCompany)
    if (selectedCompany) {
      loadDashboardData()
    }
  }, [selectedPeriod, selectedYear, selectedCompany])

  const loadDashboardData = async () => {
    if (!selectedCompany) return
    
    setIsLoading(true)
    try {
      console.log('📊 Dashboard: Loading data for company:', selectedCompany)
      
      // Use the authenticated ConsolidationService instead of direct fetch calls
      const [entitiesData, ifrsAccountsData] = await Promise.all([
        ConsolidationService.getEntities(),
        ConsolidationService.getIFRSAccounts()
      ])
      
      console.log('📊 Dashboard: Loaded entities:', entitiesData?.length || 0, 'accounts:', ifrsAccountsData?.length || 0)
      
      // For now, use sample data since the backend endpoints might not be fully implemented
      // In the future, these will come from the authenticated API calls above
      const sampleFinancialData = {
        overview: {
          totalAssets: 25000000,
          totalLiabilities: 15000000,
          netWorth: 10000000,
          monthlyRevenue: 5000000,
          monthlyExpenses: 4000000,
          profitMargin: 20,
          cashFlow: 3000000,
          workingCapital: 8000000
        },
        ratios: {
          currentRatio: 2.5,
          quickRatio: 1.8,
          debtToEquity: 0.6,
          roe: 15.2,
          roa: 8.7,
          assetTurnover: 1.2,
          inventoryTurnover: 6.5,
          daysSalesOutstanding: 45
        },
        trends: {
          revenueGrowth: 12.5,
          profitGrowth: 18.3,
          assetGrowth: 8.9,
          expenseGrowth: 10.2
        }
      }
      
      setFinancialData(sampleFinancialData)
      
      // Generate sample tasks and activities
      const sampleTasks = [
        {
          id: 1,
          title: `Review ${selectedPeriod} ${selectedYear} Financial Statements`,
          priority: 'high',
          dueDate: '2025-01-20',
          status: 'in-progress',
          assignee: 'John Smith',
          category: 'Financial Reporting',
          progress: 75
        },
        {
          id: 2,
          title: 'Update Consolidation Data',
          priority: 'medium',
          dueDate: '2025-01-25',
          status: 'pending',
          assignee: 'Sarah Johnson',
          category: 'Consolidation',
          progress: 25
        }
      ]
      setTasks(sampleTasks)
      
      const sampleActivities = [
        {
          id: 1,
          type: 'upload',
          description: `Trial balance uploaded for ${selectedPeriod} ${selectedYear}`,
          timestamp: new Date().toISOString(),
          user: 'John Smith',
          status: 'completed'
        },
        {
          id: 2,
          type: 'consolidation',
          description: 'Consolidation process completed',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'Sarah Johnson',
          status: 'completed'
        }
      ]
      setRecentActivities(sampleActivities)
      
      const samplePerformanceMetrics = {
        dataProcessing: {
          status: 'operational',
          uptime: 99.8,
          lastUpdated: new Date().toISOString()
        },
        consolidation: {
          status: 'operational',
          lastRun: new Date().toISOString(),
          successRate: 98.5
        },
        reporting: {
          status: 'operational',
          lastReport: new Date().toISOString(),
          accuracy: 99.9
        }
      }
      setPerformanceMetrics(samplePerformanceMetrics)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set default data on error
      setFinancialData({})
      setTasks([])
      setRecentActivities([])
      setPerformanceMetrics({})
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      case 'idle': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />
      case 'idle': return <Clock className="h-5 w-5 text-gray-600" />
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'high': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with glassmorphism */}
      <div className="flex items-center justify-between p-6 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 dark:bg-slate-800/20 dark:border-slate-700/30 shadow-2xl">
        <div>
          <h1 className="text-3xl font-bold text-white dark:text-slate-100 drop-shadow-lg">Dashboard</h1>
          <p className="text-white/80 dark:text-slate-300">
            Welcome back! Here's what's happening with {selectedCompany || 'your company'}.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white placeholder-white/70 dark:bg-slate-700/30 dark:border-slate-600/40 dark:text-slate-100"
          >
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white placeholder-white/70 dark:bg-slate-700/30 dark:border-slate-600/40 dark:text-slate-100"
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      )}

      {/* No Company Selected */}
      {!selectedCompany && !isLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">No Company Selected</h3>
          <p className="text-yellow-700">Please select a company to view dashboard data.</p>
        </div>
      )}

      {/* Dashboard Content - Only show when company is selected and not loading */}
      {selectedCompany && !isLoading && (
        <>
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${(financialData.overview?.totalAssets / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">+{financialData.trends?.assetGrowth || 0}%</span>
            <span className="text-gray-500 ml-2">from last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Worth</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${(financialData.overview?.netWorth / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">+{financialData.trends?.profitGrowth || 0}%</span>
            <span className="text-gray-500 ml-2">from last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit Margin</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {financialData.overview?.profitMargin || 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">+{financialData.trends?.revenueGrowth || 0}%</span>
            <span className="text-gray-500 ml-2">from last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Working Capital</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${(financialData.overview?.workingCapital / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">+{financialData.trends?.expenseGrowth || 0}%</span>
            <span className="text-gray-500 ml-2">from last period</span>
          </div>
        </div>
      </div>

      {/* Key Financial Ratios */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Key Financial Ratios</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{financialData.ratios?.currentRatio || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Ratio</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{financialData.ratios?.debtToEquity || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Debt-to-Equity</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{financialData.ratios?.roe || 0}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">ROE</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{financialData.ratios?.roa || 0}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">ROA</p>
          </div>
        </div>
      </div>

      {/* System Status & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Status</h3>
          <div className="space-y-4">
            {Object.entries(performanceMetrics).map(([key, metric]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(metric.status)}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <span className={`text-sm font-medium ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {recentActivities.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.user}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alerts & Notifications</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}>
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm">{alert.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Upload className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload TB</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <BarChart3 className="h-6 w-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generate Reports</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Settings className="h-6 w-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="h-6 w-6 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Export Data</span>
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
