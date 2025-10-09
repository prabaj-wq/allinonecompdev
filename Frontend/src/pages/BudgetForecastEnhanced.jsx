import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'
import { 
  budgetService, 
  forecastService, 
  businessDriverService, 
  comparisonService, 
  rollingForecastService,
  budgetForecastUtils 
} from '../services/budgetForecastService'
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw, 
  Eye, 
  Plus, 
  Edit,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  Save,
  Copy,
  Share2,
  Users,
  Building,
  Layers,
  Zap,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Grid,
  List,
  Filter as FilterIcon
} from 'lucide-react'

const BudgetForecastEnhanced = () => {
  const { user } = useAuth()
  const { selectedCompany } = useCompany()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [viewMode, setViewMode] = useState('grid')
  
  // Data states
  const [budgets, setBudgets] = useState([])
  const [forecasts, setForecasts] = useState([])
  const [businessDrivers, setBusinessDrivers] = useState([])
  const [comparisons, setComparisons] = useState([])
  const [rollingForecasts, setRollingForecasts] = useState([])
  const [analytics, setAnalytics] = useState({})
  
  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState('2024')
  const [selectedScenario, setSelectedScenario] = useState('base')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Modal states
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [showForecastModal, setShowForecastModal] = useState(false)
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [showScenarioModal, setShowScenarioModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  // Form states
  const [budgetForm, setBudgetForm] = useState({
    budget_name: '',
    budget_type: 'ANNUAL',
    period_start: '',
    period_end: '',
    fiscal_year: 2024,
    description: '',
    department_id: '',
    project_id: ''
  })
  
  const [forecastForm, setForecastForm] = useState({
    forecast_name: '',
    forecast_type: 'REVENUE',
    forecast_method: 'DRIVER_BASED',
    forecast_frequency: 'MONTHLY',
    forecast_start_date: '',
    forecast_end_date: '',
    forecast_horizon: 12,
    description: ''
  })

  // Load data on component mount
  useEffect(() => {
    if (selectedCompany) {
      loadAllData()
    }
  }, [selectedCompany])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [
        budgetsResponse,
        forecastsResponse,
        driversResponse,
        comparisonsResponse,
        rollingForecastsResponse,
        budgetAnalyticsResponse,
        forecastAnalyticsResponse
      ] = await Promise.all([
        budgetService.getBudgets(selectedCompany),
        forecastService.getForecasts(selectedCompany),
        businessDriverService.getBusinessDrivers(selectedCompany),
        comparisonService.getComparisons(selectedCompany),
        rollingForecastService.getRollingForecasts(selectedCompany),
        comparisonService.getAnalyticsSummary(selectedCompany, 'budget'),
        comparisonService.getAnalyticsSummary(selectedCompany, 'forecast')
      ])

      if (budgetsResponse.success) setBudgets(budgetsResponse.budgets)
      if (forecastsResponse.success) setForecasts(forecastsResponse.forecasts)
      if (driversResponse.success) setBusinessDrivers(driversResponse.drivers)
      if (comparisonsResponse.success) setComparisons(comparisonsResponse.comparisons)
      if (rollingForecastsResponse.success) setRollingForecasts(rollingForecastsResponse.rolling_forecasts)
      
      setAnalytics({
        budget: budgetAnalyticsResponse.success ? budgetAnalyticsResponse.summary : {},
        forecast: forecastAnalyticsResponse.success ? forecastAnalyticsResponse.summary : {}
      })
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBudget = async () => {
    try {
      const response = await budgetService.createBudget(budgetForm, selectedCompany)
      if (response.success) {
        setShowBudgetModal(false)
        setBudgetForm({
          budget_name: '',
          budget_type: 'ANNUAL',
          period_start: '',
          period_end: '',
          fiscal_year: 2024,
          description: '',
          department_id: '',
          project_id: ''
        })
        loadAllData()
      }
    } catch (error) {
      console.error('Failed to create budget:', error)
    }
  }

  const handleCreateForecast = async () => {
    try {
      const response = await forecastService.createForecast(forecastForm, selectedCompany)
      if (response.success) {
        setShowForecastModal(false)
        setForecastForm({
          forecast_name: '',
          forecast_type: 'REVENUE',
          forecast_method: 'DRIVER_BASED',
          forecast_frequency: 'MONTHLY',
          forecast_start_date: '',
          forecast_end_date: '',
          forecast_horizon: 12,
          description: ''
        })
        loadAllData()
      }
    } catch (error) {
      console.error('Failed to create forecast:', error)
    }
  }

  const calculateMetrics = () => {
    const totalBudgets = budgets.length
    const approvedBudgets = budgets.filter(b => b.status === 'Approved').length
    const activeForecasts = forecasts.filter(f => f.status === 'Active').length
    const totalDrivers = businessDrivers.length
    
    return {
      totalBudgets,
      approvedBudgets,
      activeForecasts,
      totalDrivers,
      approvalRate: totalBudgets > 0 ? (approvedBudgets / totalBudgets) * 100 : 0
    }
  }

  const metrics = calculateMetrics()

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Budgets</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalBudgets}</p>
              <p className="text-xs text-gray-500">Approval Rate: {metrics.approvalRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Forecasts</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeForecasts}</p>
              <p className="text-xs text-gray-500">Real-time tracking</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Business Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalDrivers}</p>
              <p className="text-xs text-gray-500">Driver-based forecasting</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rolling Forecasts</p>
              <p className="text-2xl font-bold text-gray-900">{rollingForecasts.length}</p>
              <p className="text-xs text-gray-500">Continuous updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setShowBudgetModal(true)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-blue-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Create Budget</p>
              <p className="text-sm text-gray-500">New annual or project budget</p>
            </div>
          </button>
          
          <button 
            onClick={() => setShowForecastModal(true)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Create Forecast</p>
              <p className="text-sm text-gray-500">Revenue or expense forecast</p>
            </div>
          </button>
          
          <button 
            onClick={() => setShowDriverModal(true)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Zap className="h-5 w-5 text-purple-600 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Add Driver</p>
              <p className="text-sm text-gray-500">Business driver for forecasting</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Budgets</h3>
          <div className="space-y-3">
            {budgets.slice(0, 5).map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{budget.budget_name}</p>
                  <p className="text-sm text-gray-500">{budget.budget_type} • FY {budget.fiscal_year}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  budget.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  budget.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {budget.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Forecasts</h3>
          <div className="space-y-3">
            {forecasts.slice(0, 5).map((forecast) => (
              <div key={forecast.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{forecast.forecast_name}</p>
                  <p className="text-sm text-gray-500">{forecast.forecast_type} • {forecast.forecast_method}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  forecast.status === 'Active' ? 'bg-green-100 text-green-800' :
                  forecast.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {forecast.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget & Forecast Management</h1>
          <p className="text-gray-600">Comprehensive financial planning, forecasting, and budget management</p>
        </div>
        <div className="flex space-x-3">
          <button 
            className="btn-secondary"
            onClick={loadAllData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'budgets', label: 'Budgets', icon: FileText },
              { id: 'forecasts', label: 'Forecasts', icon: TrendingUp },
              { id: 'scenarios', label: 'Scenarios', icon: Layers },
              { id: 'analytics', label: 'Analytics', icon: PieChart }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'budgets' && <div>Budgets Tab Content</div>}
          {activeTab === 'forecasts' && <div>Forecasts Tab Content</div>}
          {activeTab === 'scenarios' && <div>Scenarios Tab Content</div>}
          {activeTab === 'analytics' && <div>Analytics Tab Content</div>}
        </div>
      </div>
    </div>
  )
}

export default BudgetForecastEnhanced
