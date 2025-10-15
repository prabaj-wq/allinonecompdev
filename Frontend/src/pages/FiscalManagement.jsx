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
  Zap
} from 'lucide-react'

const FiscalManagement = () => {
  const { selectedCompany } = useCompany()
  const [fiscalYears, setFiscalYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch fiscal years
  const fetchFiscalYears = async () => {
    if (!selectedCompany) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/fiscal-management/fiscal-years?include_periods=true&include_scenarios=true`, {
        headers: {
          'X-Company-Database': selectedCompany
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFiscalYears(data.fiscal_years || [])
      }
    } catch (error) {
      console.error('Error fetching fiscal years:', error)
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
              {year.periods?.length || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Periods</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {year.scenarios?.length || 0}
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
            <button className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
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
    status: 'draft',
    is_consolidation_year: true,
    consolidation_method: 'full'
  })

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCompany) return
    
    try {
      const response = await fetch('/api/fiscal-management/fiscal-years', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowCreateModal(false)
        setFormData({
          year_code: '',
          year_name: '',
          start_date: '',
          end_date: '',
          description: '',
          status: 'draft',
          is_consolidation_year: true,
          consolidation_method: 'full'
        })
        fetchFiscalYears()
        window.showToast?.('Fiscal year created successfully!', 'success')
      } else {
        const error = await response.json()
        window.showToast?.(error.error || 'Failed to create fiscal year', 'error')
      }
    } catch (error) {
      console.error('Error creating fiscal year:', error)
      window.showToast?.('Failed to create fiscal year', 'error')
    }
  }

  const CreateFiscalYearModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Fiscal Year
          </h2>
          <button
            onClick={() => setShowCreateModal(false)}
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
                onChange={(e) => setFormData({...formData, year_code: e.target.value})}
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
                onChange={(e) => setFormData({...formData, year_name: e.target.value})}
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
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
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
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
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
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_consolidation_year}
                onChange={(e) => setFormData({...formData, is_consolidation_year: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable Consolidation</span>
            </label>
            <select 
              value={formData.consolidation_method}
              onChange={(e) => setFormData({...formData, consolidation_method: e.target.value})}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="full">Full Consolidation</option>
              <option value="proportional">Proportional Consolidation</option>
              <option value="equity">Equity Method</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Fiscal Year
            </button>
          </div>
        </form>
      </div>
    </div>
  )

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
              <option value="draft">Draft</option>
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
      {showCreateModal && <CreateFiscalYearModal />}
    </div>
  )
}

// Fiscal Year Details Component (will be implemented separately)
const FiscalYearDetails = ({ year, onBack }) => {
  const [activeTab, setActiveTab] = useState('periods')
  const [periods, setPeriods] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(false)

  const tabs = [
    { id: 'periods', name: 'Periods', icon: Clock, count: periods.length },
    { id: 'scenarios', name: 'Scenarios', icon: Layers, count: scenarios.length },
    { id: 'settings', name: 'Settings', icon: Settings, count: null },
    { id: 'audit', name: 'Audit Trail', icon: History, count: null }
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
                onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'periods' && <PeriodsTab year={year} />}
        {activeTab === 'scenarios' && <ScenariosTab year={year} />}
        {activeTab === 'settings' && <SettingsTab year={year} />}
        {activeTab === 'audit' && <AuditTab year={year} />}
      </div>
    </div>
  )
}

// Tab Components
const SettingsTab = ({ year }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fiscal Year Settings</h3>
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Consolidation Method</label>
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="full">Full Consolidation</option>
            <option value="proportional">Proportional Consolidation</option>
            <option value="equity">Equity Method</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
          </select>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Enable Inter-company Eliminations</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Auto-calculate Minority Interest</span>
        </label>
      </div>
    </div>
  </div>
)

const AuditTab = ({ year }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Audit Trail</h3>
    <p className="text-gray-500 dark:text-gray-400">Audit trail functionality will be implemented here.</p>
  </div>
)

export default FiscalManagement
