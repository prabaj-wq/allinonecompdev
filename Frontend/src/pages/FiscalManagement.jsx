import React, { useState, useEffect } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import PeriodsTab from '../components/FiscalManagement/PeriodsTab'
import ScenariosTab from '../components/FiscalManagement/ScenariosTab'
import { 
  Calendar, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Settings, 
  History, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Copy,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Layers,
  Target,
  Zap,
  Save
} from 'lucide-react'

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Component Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-600 text-sm mt-1">{this.state.error?.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}

// Utility functions (moved outside component to be accessible by all components)
const getStatusIcon = (status) => {
  switch (status) {
    case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'locked': return <XCircle className="h-4 w-4 text-red-500" />
    case 'archived': return <History className="h-4 w-4 text-gray-500" />
    default: return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200'
    case 'locked': return 'bg-red-100 text-red-800 border-red-200'
    case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200'
    default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
}

const FiscalManagement = () => {
  const { selectedCompany } = useCompany()
  const [fiscalYears, setFiscalYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(null)
  const [editingYear, setEditingYear] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Handle edit fiscal year
  const handleEditFiscalYear = (year) => {
    setEditingYear(year);
    setFormData({
      year_code: year.year_code || '',
      year_name: year.year_name || '',
      start_date: year.start_date || '',
      end_date: year.end_date || '',
      description: year.description || '',
      status: year.status || 'active',
      is_consolidation_year: year.is_consolidation_year || true,
      consolidation_method: year.consolidation_method || 'full'
    });
    setShowCreateModal(true);
  };

  // Fetch fiscal years
  const fetchFiscalYears = async () => {
    if (!selectedCompany) {
      console.log('🏢 No company selected, skipping fetch')
      return
    }
    
    console.log('📡 Fetching fiscal years for company:', selectedCompany)
    setLoading(true)
    try {
      const response = await fetch(`/api/fiscal-management/fiscal-years`, {
        headers: {
          'X-Company-Database': selectedCompany
        }
      })
      
      console.log('📡 Fetch response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Fetched fiscal years:', data)
        
        // Fetch periods and scenarios counts for each fiscal year
        const fiscalYearsWithCounts = await Promise.all(
          (data.fiscal_years || []).map(async (year) => {
            try {
              // Fetch periods count
              const periodsResponse = await fetch(`/api/fiscal-management/fiscal-years/${year.id}/periods`, {
                headers: { 'X-Company-Database': selectedCompany }
              });
              
              // Fetch scenarios count
              const scenariosResponse = await fetch(`/api/fiscal-management/fiscal-years/${year.id}/scenarios`, {
                headers: { 'X-Company-Database': selectedCompany }
              });
              
              let periodsCount = 0;
              let scenariosCount = 0;
              
              if (periodsResponse.ok) {
                const periodsData = await periodsResponse.json();
                periodsCount = periodsData.total || periodsData.periods?.length || 0;
              }
              
              if (scenariosResponse.ok) {
                const scenariosData = await scenariosResponse.json();
                scenariosCount = scenariosData.total || scenariosData.scenarios?.length || 0;
              }
              
              return {
                ...year,
                periods_count: periodsCount,
                scenarios_count: scenariosCount
              };
            } catch (error) {
              console.error(`Error fetching counts for year ${year.id}:`, error);
              return {
                ...year,
                periods_count: 0,
                scenarios_count: 0
              };
            }
          })
        );
        
        setFiscalYears(fiscalYearsWithCounts);
      } else {
        const error = await response.json()
        console.error('❌ Fetch error:', error)
      }
    } catch (error) {
      console.error('❌ Network error fetching fiscal years:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiscalYears()
  }, [selectedCompany])

  // Filter fiscal years based on search and status
  const filteredFiscalYears = fiscalYears.filter(year => {
    const matchesSearch = year.year_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         year.year_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || year.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const FiscalYearCard = ({ year }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {year.year_name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {year.year_code} • {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(year.status)}`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(year.status)}
              <span className="capitalize">{year.status}</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {year.periods_count || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Periods</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {year.scenarios_count || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Scenarios</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {year.is_consolidation_year ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Consolidation</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedYear(year)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>View Details</span>
            </button>
            <button 
              onClick={() => handleEditFiscalYear(year)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          </div>
          <div className="flex space-x-1">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Copy className="h-4 w-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const [formData, setFormData] = useState({
    year_code: '',
    year_name: '',
    start_date: '',
    end_date: '',
    description: '',
    status: 'active',
    is_consolidation_year: true,
    consolidation_method: 'full'
  })

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    console.log('🚀 Form submitted with data:', formData)
    console.log('🏢 Selected company:', selectedCompany)
    
    if (!selectedCompany) {
      console.error('❌ No company selected')
      window.showToast?.('Please select a company first', 'error')
      return
    }
    
    try {
      console.log('📡 Making API call to create fiscal year...')
      
      const method = editingYear ? 'PUT' : 'POST';
      const url = editingYear 
        ? `/api/fiscal-management/fiscal-years/${editingYear.id}`
        : '/api/fiscal-management/fiscal-years';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany
        },
        body: JSON.stringify(formData)
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Fiscal year created/updated successfully:', result)
        
        setShowCreateModal(false)
        setEditingYear(null);
        setFormData({
          year_code: '',
          year_name: '',
          start_date: '',
          end_date: '',
          description: '',
          status: 'active',
          is_consolidation_year: true,
          consolidation_method: 'full'
        })
        fetchFiscalYears()
        window.showToast?.(
          editingYear 
            ? 'Fiscal year updated successfully!' 
            : 'Fiscal year created successfully!', 
          'success'
        )
      } else {
        const error = await response.json()
        console.error('❌ API Error:', error)
        window.showToast?.(error.error || `Failed to ${editingYear ? 'update' : 'create'} fiscal year (${response.status})`, 'error')
      }
    } catch (error) {
      console.error('❌ Network/Parse Error:', error)
      window.showToast?.('Network error - please check if backend is running', 'error')
    }
  }

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field) => (event) => {
    const checked = event.target.checked
    setFormData((prev) => ({ ...prev, [field]: checked }))
  }

  if (selectedYear) {
    return <FiscalYearDetails year={selectedYear} onBack={() => setSelectedYear(null)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Fiscal Management
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage fiscal years, periods, and scenarios for {selectedCompany}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Fiscal Year</span>
              </button>
              <button
                onClick={fetchFiscalYears}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search fiscal years..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
          </div>
        </div>

        {/* Fiscal Years Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredFiscalYears.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Fiscal Years Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first fiscal year.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Fiscal Year</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiscalYears.map((year) => (
              <FiscalYearCard key={year.id} year={year} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingYear ? 'Edit Fiscal Year' : 'Create New Fiscal Year'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingYear(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., FY2024"
                    value={formData.year_code}
                    onChange={handleFieldChange('year_code')}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Fiscal Year 2024"
                    value={formData.year_name}
                    onChange={handleFieldChange('year_name')}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={handleFieldChange('start_date')}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={handleFieldChange('end_date')}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional description for this fiscal year..."
                  value={formData.description}
                  onChange={handleFieldChange('description')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_consolidation_year}
                    onChange={handleCheckboxChange('is_consolidation_year')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable Consolidation</span>
                </label>
                <select
                  value={formData.consolidation_method}
                  onChange={handleFieldChange('consolidation_method')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="full">Full Consolidation</option>
                  <option value="equity">Equity Method</option>
                  <option value="proportional">Proportional Consolidation</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingYear(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingYear ? 'Update Fiscal Year' : 'Create Fiscal Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Fiscal Year Details Component (will be implemented separately)
const FiscalYearDetails = ({ year, onBack }) => {
  console.log('🏢 FiscalYearDetails rendered with year:', year)
  const [activeTab, setActiveTab] = useState('periods')
  const [periods, setPeriods] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(false)
  
  console.log('📋 Active tab:', activeTab)

  const tabs = [
    { id: 'periods', name: 'Periods', icon: Clock, count: periods.length },
    { id: 'scenarios', name: 'Scenarios', icon: Layers, count: scenarios.length },
    { id: 'settings', name: 'Settings', icon: Settings, count: null }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 transform rotate-180" />
              </button>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {year.year_name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {year.year_code} • {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(year.status)}`}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(year.status)}
                <span className="capitalize">{year.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('🔄 Tab clicked:', tab.id)
                  setActiveTab(tab.id)
                }}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.count !== null && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'periods' && (
          <div>
            <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">Error loading Periods Tab</div>}>
              <PeriodsTab year={year} />
            </ErrorBoundary>
          </div>
        )}
        {activeTab === 'scenarios' && (
          <div>
            <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">Error loading Scenarios Tab</div>}>
              <ScenariosTab year={year} />
            </ErrorBoundary>
          </div>
        )}
        {activeTab === 'settings' && (
          <div>
            <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">Error loading Settings Tab</div>}>
              <SettingsTab year={year} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  )
}

// Tab Components
const SettingsTab = ({ year }) => {
  const { selectedCompany } = useCompany();
  const [settings, setSettings] = useState({
    allow_simulations: year.settings?.allow_simulations ?? false,
    roll_forward_enabled: year.settings?.roll_forward_enabled ?? false,
    roll_forward_method: year.settings?.roll_forward_method ?? 'copy',
    roll_forward_adjustment: year.settings?.roll_forward_adjustment ?? 0,
    opening_balances_source: year.settings?.opening_balances_source ?? 'normal',
    opening_balances_scenario_id: year.settings?.opening_balances_scenario_id ?? null,
    opening_balances_period_id: year.settings?.opening_balances_period_id ?? null,
    enable_intercompany_eliminations: year.settings?.enable_intercompany_eliminations ?? true,
    auto_calculate_minority_interest: year.settings?.auto_calculate_minority_interest ?? true,
    enable_currency_translation: year.settings?.enable_currency_translation ?? true,
    consolidation_method: year.settings?.consolidation_method ?? 'full',
    reference_years_enabled: year.settings?.reference_years_enabled ?? false,
    reference_years_mode: year.settings?.reference_years_mode ?? 'previous'
  });
  
  const [scenarios, setScenarios] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [allYears, setAllYears] = useState([]);
  const [previousOffsets, setPreviousOffsets] = useState(Array.isArray(year.previous_year_offsets) ? year.previous_year_offsets : []);
  const [nextOffsets, setNextOffsets] = useState(Array.isArray(year.next_year_offsets) ? year.next_year_offsets : []);
  const [selectedRefYearId, setSelectedRefYearId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Fetch scenarios and periods for the dropdowns
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCompany || !year.id) return;
      
      setLoading(true);
      try {
        // Fetch scenarios
        const scenariosResponse = await fetch(`/api/fiscal-management/fiscal-years/${year.id}/scenarios`, {
          headers: { 'X-Company-Database': selectedCompany }
        });
        
        if (scenariosResponse.ok) {
          const scenariosData = await scenariosResponse.json();
          setScenarios(scenariosData.scenarios || []);
        }
        
        // Fetch periods
        const periodsResponse = await fetch(`/api/fiscal-management/fiscal-years/${year.id}/periods`, {
          headers: { 'X-Company-Database': selectedCompany }
        });
        
        if (periodsResponse.ok) {
          const periodsData = await periodsResponse.json();
          setPeriods(periodsData.periods || []);
        }

        // Fetch all fiscal years to compute reference offsets and show list
        const yearsResponse = await fetch(`/api/fiscal-management/fiscal-years`, {
          headers: { 'X-Company-Database': selectedCompany }
        });
        if (yearsResponse.ok) {
          const yearsData = await yearsResponse.json();
          setAllYears(yearsData.fiscal_years || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedCompany, year.id]);
  
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/fiscal-management/fiscal-years/${year.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany
        },
        body: JSON.stringify({
          settings: settings,
          custom_fields: year.custom_fields || {},
          previous_year_offsets: previousOffsets,
          next_year_offsets: nextOffsets
        })
      });
      
      if (response.ok) {
        window.showToast?.('Settings saved successfully!', 'success');
      } else {
        const error = await response.json();
        window.showToast?.(error.error || 'Failed to save settings', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      window.showToast?.('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getYearOrder = () => {
    // Sort allYears by start_date ascending to compute relative offsets
    return [...allYears].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  };

  const computeOffsetForYear = (targetYearId) => {
    const ordered = getYearOrder();
    const currentIndex = ordered.findIndex((y) => y.id === year.id);
    const targetIndex = ordered.findIndex((y) => y.id === Number(targetYearId));
    if (currentIndex === -1 || targetIndex === -1) return 0;
    return targetIndex - currentIndex; // negative for previous, positive for next
  };

  const addReferenceByYear = () => {
    if (!selectedRefYearId) return;
    const offset = computeOffsetForYear(selectedRefYearId);
    if (offset === 0) return;
    if (offset < 0) {
      const val = Math.abs(offset);
      if (!previousOffsets.includes(val)) setPreviousOffsets([...previousOffsets, val].sort((a,b)=>a-b));
    } else {
      if (!nextOffsets.includes(offset)) setNextOffsets([...nextOffsets, offset].sort((a,b)=>a-b));
    }
    setSelectedRefYearId('');
  };

  const removeOffset = (direction, value) => {
    if (direction === 'previous') setPreviousOffsets(previousOffsets.filter(v => v !== value));
    else setNextOffsets(nextOffsets.filter(v => v !== value));
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fiscal Year Settings</h3>
      
      <div className="space-y-6">
        {/* Simulations Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Allow Simulations</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Enable or disable simulation capabilities for this fiscal year</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_simulations}
              onChange={(e) => handleSettingChange('allow_simulations', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {/* Roll Forward Settings */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Enable Roll Forward</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Allow automatic data roll forward between periods</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.roll_forward_enabled || false}
                onChange={(e) => handleSettingChange('roll_forward_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {/* Show additional roll forward options only when enabled */}
          {settings.roll_forward_enabled && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Roll Forward Method</label>
                <select
                  value={settings.roll_forward_method || 'copy'}
                  onChange={(e) => handleSettingChange('roll_forward_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="copy">Copy Previous Period Data</option>
                  <option value="adjust">Copy with Adjustments</option>
                  <option value="zero">Start with Zero Balances</option>
                  <option value="formula">Apply Formula-Based Roll Forward</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Adjustment Percentage</label>
                <div className="relative">
                  <input
                    type="number"
                    min="-100"
                    max="100"
                    step="0.1"
                    value={settings.roll_forward_adjustment || 0}
                    onChange={(e) => handleSettingChange('roll_forward_adjustment', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400">%</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Default percentage adjustment for rolled forward data</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Opening Balances Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opening Balances Source</label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Select where opening balances should be sourced from</p>
          
          <div className="space-y-4">
            <div>
              <select
                value={settings.opening_balances_source}
                onChange={(e) => handleSettingChange('opening_balances_source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="normal">Normal (Current Year)</option>
                <option value="scenario">From Scenario</option>
                <option value="period">From Specific Period</option>
                <option value="year">From Another Year</option>
              </select>
            </div>
            
            {/* Conditional fields based on source selection */}
            {settings.opening_balances_source === 'scenario' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Scenario</label>
                <select
                  value={settings.opening_balances_scenario_id || ''}
                  onChange={(e) => handleSettingChange('opening_balances_scenario_id', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a scenario</option>
                  {scenarios.map(scenario => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.scenario_name} ({scenario.scenario_code})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {settings.opening_balances_source === 'period' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Period</label>
                <select
                  value={settings.opening_balances_period_id || ''}
                  onChange={(e) => handleSettingChange('opening_balances_period_id', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a period</option>
                  {periods.map(period => (
                    <option key={period.id} value={period.id}>
                      {period.period_name} ({period.period_code})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {settings.opening_balances_source === 'year' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Year</label>
                <select
                  value={settings.opening_balances_year_id || ''}
                  onChange={(e) => handleSettingChange('opening_balances_year_id', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a fiscal year</option>
                  {allYears.filter(y => y.id !== year.id).map(fy => (
                    <option key={fy.id} value={fy.id}>
                      {fy.year_name} ({fy.year_code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        
        {/* Existing Consolidation Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Consolidation Method</label>
          <select 
            value={settings.consolidation_method || 'full'}
            onChange={(e) => handleSettingChange('consolidation_method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="full">Full Consolidation</option>
            <option value="proportional">Proportional Consolidation</option>
            <option value="equity">Equity Method</option>
          </select>
        </div>
        
        
        {/* Additional Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Enable Inter-company Eliminations</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically eliminate inter-company transactions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_intercompany_eliminations ?? true}
                onChange={(e) => handleSettingChange('enable_intercompany_eliminations', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Auto-calculate Minority Interest</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically calculate minority interest amounts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_calculate_minority_interest ?? true}
                onChange={(e) => handleSettingChange('auto_calculate_minority_interest', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Enable Currency Translation</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enable foreign currency translation for consolidation</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_currency_translation ?? true}
                onChange={(e) => handleSettingChange('enable_currency_translation', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const AuditTab = ({ year }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Audit Trail</h3>
    <p className="text-gray-500 dark:text-gray-400">Audit trail functionality will be implemented here.</p>
  </div>
)

export default FiscalManagement
