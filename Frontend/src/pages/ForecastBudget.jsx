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

const ForecastBudget = () => {
  const { user } = useAuth()
  const { selectedCompany } = useCompany()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [viewMode, setViewMode] = useState('grid') // grid or list
  
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

  const renderBudgets = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Budget Management</h3>
        <div className="flex space-x-3">
          <select 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
            <option value="Active">Active</option>
          </select>
          <button 
            onClick={() => setShowBudgetModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Budget
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets
          .filter(budget => statusFilter === 'all' || budget.status === statusFilter)
          .map((budget) => (
          <div key={budget.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-medium text-gray-900">{budget.budget_name}</h4>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                budget.status === 'Approved' ? 'bg-green-100 text-green-800' :
                budget.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {budget.status}
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium text-gray-900">{budget.budget_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fiscal Year:</span>
                <span className="text-sm font-medium text-gray-900">{budget.fiscal_year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue:</span>
                <span className="text-sm font-medium text-gray-900">
                  {budgetForecastUtils.formatCurrency(budget.total_revenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Expenses:</span>
                <span className="text-sm font-medium text-gray-900">
                  {budgetForecastUtils.formatCurrency(budget.total_expenses)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-900">Net Income:</span>
                <span className={`text-sm font-bold ${
                  budget.net_income >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {budgetForecastUtils.formatCurrency(budget.net_income)}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                View Details
              </button>
              <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderForecasts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Forecast Management</h3>
        <div className="flex space-x-3">
          <select 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="REVENUE">Revenue</option>
            <option value="EXPENSE">Expense</option>
            <option value="CASH_FLOW">Cash Flow</option>
          </select>
          <button 
            onClick={() => setShowForecastModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Forecast
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forecasts
          .filter(forecast => typeFilter === 'all' || forecast.forecast_type === typeFilter)
          .map((forecast) => (
          <div key={forecast.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-medium text-gray-900">{forecast.forecast_name}</h4>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                forecast.status === 'Active' ? 'bg-green-100 text-green-800' :
                forecast.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {forecast.status}
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium text-gray-900">{forecast.forecast_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Method:</span>
                <span className="text-sm font-medium text-gray-900">{forecast.forecast_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Frequency:</span>
                <span className="text-sm font-medium text-gray-900">{forecast.forecast_frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Horizon:</span>
                <span className="text-sm font-medium text-gray-900">{forecast.forecast_horizon} periods</span>
              </div>
              {forecast.accuracy_score && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accuracy:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {budgetForecastUtils.formatPercentage(forecast.accuracy_score)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                View Details
              </button>
              <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                Scenarios
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderScenarios = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Scenario Analysis</h3>
        <button 
          onClick={() => setShowScenarioModal(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Scenario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Base Scenario */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-lg font-medium text-gray-900">Base Scenario</h4>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              Base
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">Most likely outcome based on current trends and assumptions</p>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Probability:</span>
              <span className="text-sm font-medium text-gray-900">60%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenue Impact:</span>
              <span className="text-sm font-medium text-gray-900">0%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expense Impact:</span>
              <span className="text-sm font-medium text-gray-900">0%</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium text-gray-900">Net Income Impact:</span>
              <span className="text-sm font-bold text-gray-900">0%</span>
            </div>
          </div>
        </div>

        {/* Optimistic Scenario */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-lg font-medium text-gray-900">Optimistic Scenario</h4>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Optimistic
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">Best case scenario with market growth and favorable conditions</p>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Probability:</span>
              <span className="text-sm font-medium text-gray-900">20%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenue Impact:</span>
              <span className="text-sm font-medium text-green-600">+15%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expense Impact:</span>
              <span className="text-sm font-medium text-red-600">+5%</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium text-gray-900">Net Income Impact:</span>
              <span className="text-sm font-bold text-green-600">+25%</span>
            </div>
          </div>
        </div>

        {/* Pessimistic Scenario */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-lg font-medium text-gray-900">Pessimistic Scenario</h4>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
              Pessimistic
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">Worst case scenario with market downturn and challenges</p>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Probability:</span>
              <span className="text-sm font-medium text-gray-900">20%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenue Impact:</span>
              <span className="text-sm font-medium text-red-600">-10%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expense Impact:</span>
              <span className="text-sm font-medium text-red-600">+8%</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium text-gray-900">Net Income Impact:</span>
              <span className="text-sm font-bold text-red-600">-30%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Analytics & Reporting</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Budget vs Actual Performance</h4>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Budget vs Actual comparison chart</p>
              <p className="text-sm text-gray-400">Monthly variance analysis</p>
            </div>
          </div>
        </div>

        {/* Forecast Accuracy Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Forecast Accuracy Trends</h4>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center">
              <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Forecast accuracy over time</p>
              <p className="text-sm text-gray-400">Historical performance tracking</p>
            </div>
          </div>
        </div>

        {/* Variance Analysis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Variance Analysis</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">On Track Items</span>
              <span className="text-sm font-bold text-green-600">85%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Minor Variances</span>
              <span className="text-sm font-bold text-yellow-600">10%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Major Variances</span>
              <span className="text-sm font-bold text-red-600">5%</span>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Key Performance Indicators</h4>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Budget Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">92.5%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Forecast Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">88.3%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Timely Submissions</p>
              <p className="text-2xl font-bold text-gray-900">95.2%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Approval Rate</p>
              <p className="text-2xl font-bold text-gray-900">87.8%</p>
            </div>
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
          {activeTab === 'budgets' && renderBudgets()}
          {activeTab === 'forecasts' && renderForecasts()}
          {activeTab === 'scenarios' && renderScenarios()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Budget</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget Name</label>
                  <input
                    type="text"
                    value={budgetForm.budget_name}
                    onChange={(e) => setBudgetForm({...budgetForm, budget_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget Type</label>
                  <select
                    value={budgetForm.budget_type}
                    onChange={(e) => setBudgetForm({...budgetForm, budget_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="ANNUAL">Annual</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="PROJECT">Project</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={budgetForm.period_start}
                      onChange={(e) => setBudgetForm({...budgetForm, period_start: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={budgetForm.period_end}
                      onChange={(e) => setBudgetForm({...budgetForm, period_end: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fiscal Year</label>
                  <input
                    type="number"
                    value={budgetForm.fiscal_year}
                    onChange={(e) => setBudgetForm({...budgetForm, fiscal_year: parseInt(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={budgetForm.description}
                    onChange={(e) => setBudgetForm({...budgetForm, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBudget}
                  className="btn-primary"
                >
                  Create Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Modal */}
      {showForecastModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Forecast</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forecast Name</label>
                  <input
                    type="text"
                    value={forecastForm.forecast_name}
                    onChange={(e) => setForecastForm({...forecastForm, forecast_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forecast Type</label>
                  <select
                    value={forecastForm.forecast_type}
                    onChange={(e) => setForecastForm({...forecastForm, forecast_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="REVENUE">Revenue</option>
                    <option value="EXPENSE">Expense</option>
                    <option value="CASH_FLOW">Cash Flow</option>
                    <option value="BALANCE_SHEET">Balance Sheet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forecast Method</label>
                  <select
                    value={forecastForm.forecast_method}
                    onChange={(e) => setForecastForm({...forecastForm, forecast_method: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="DRIVER_BASED">Driver-Based</option>
                    <option value="TOP_DOWN">Top-Down</option>
                    <option value="BOTTOM_UP">Bottom-Up</option>
                    <option value="STATISTICAL">Statistical</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={forecastForm.forecast_start_date}
                      onChange={(e) => setForecastForm({...forecastForm, forecast_start_date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={forecastForm.forecast_end_date}
                      onChange={(e) => setForecastForm({...forecastForm, forecast_end_date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forecast Horizon (periods)</label>
                  <input
                    type="number"
                    value={forecastForm.forecast_horizon}
                    onChange={(e) => setForecastForm({...forecastForm, forecast_horizon: parseInt(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={forecastForm.description}
                    onChange={(e) => setForecastForm({...forecastForm, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowForecastModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateForecast}
                  className="btn-primary"
                >
                  Create Forecast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ForecastBudget
