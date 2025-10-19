import React, { useState, useEffect } from 'react'
import { useCompany } from '../../contexts/CompanyContext'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Unlock,
  MoreVertical,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Download,
  Settings,
  Copy
} from 'lucide-react'

const PeriodsTab = ({ year }) => {
  const { selectedCompany } = useCompany()
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Fetch periods for the fiscal year
  const fetchPeriods = async () => {
    if (!selectedCompany || !year) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/fiscal-management/fiscal-years/${year.id}/periods`, {
        headers: {
          'X-Company-Database': selectedCompany
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPeriods(data.periods || [])
      }
    } catch (error) {
      console.error('Error fetching periods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditPeriod = (period) => {
    setEditingPeriod(period)
    setShowCreateModal(true)
  }

  const handleDeletePeriod = async (periodId) => {
    if (!selectedCompany || !window.confirm('Are you sure you want to delete this period?')) return

    try {
      const response = await fetch(`/api/fiscal-management/periods/${periodId}`, {
        method: 'DELETE',
        headers: { 'X-Company-Database': selectedCompany }
      })

      if (response.ok) {
        window.showToast?.('Period deleted successfully!', 'success')
        fetchPeriods() // Refresh the list
      } else {
        const error = await response.json()
        window.showToast?.(error.detail || 'Failed to delete period', 'error')
      }
    } catch (error) {
      console.error('Error deleting period:', error)
      window.showToast?.('Failed to delete period', 'error')
    }
  }

  const handleDuplicatePeriod = async (period) => {
    if (!selectedCompany) return;

    try {
      // Create a copy with a new name
      const duplicateData = {
        ...period,
        period_code: `${period.period_code}_COPY`,
        period_name: `${period.period_name} (Copy)`
      };

      const response = await fetch(`/api/fiscal-management/fiscal-years/${year.id}/periods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany
        },
        body: JSON.stringify(duplicateData)
      });

      if (response.ok) {
        window.showToast?.('Period duplicated successfully!', 'success');
        fetchPeriods(); // Refresh the list
      } else {
        const error = await response.json();
        window.showToast?.(error.error || 'Failed to duplicate period', 'error');
      }
    } catch (error) {
      console.error('Error duplicating period:', error);
      window.showToast?.('Failed to duplicate period', 'error');
    }
  }

  useEffect(() => {
    fetchPeriods()
  }, [selectedCompany, year])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Unlock className="h-4 w-4 text-green-500" />
      case 'closed': return <Lock className="h-4 w-4 text-yellow-500" />
      case 'locked': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'locked': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPeriodTypeIcon = (type) => {
    switch (type) {
      case 'month': return <Calendar className="h-4 w-4 text-blue-500" />
      case 'quarter': return <Clock className="h-4 w-4 text-purple-500" />
      case 'year': return <Calendar className="h-4 w-4 text-green-500" />
      default: return <Settings className="h-4 w-4 text-gray-500" />
    }
  }

  // Filter periods
  const filteredPeriods = periods.filter(period => {
    const matchesType = filterType === 'all' || period.period_type === filterType
    const matchesStatus = filterStatus === 'all' || period.status === filterStatus
    return matchesType && matchesStatus
  })

  const CreatePeriodModal = ({ editPeriod = null }) => {
    const [formData, setFormData] = useState({
      period_code: editPeriod?.period_code || '',
      period_name: editPeriod?.period_name || '',
      period_type: editPeriod?.period_type || 'month',
      start_date: editPeriod?.start_date ? new Date(editPeriod.start_date).toISOString().split('T')[0] : '',
      end_date: editPeriod?.end_date ? new Date(editPeriod.end_date).toISOString().split('T')[0] : '',
      status: editPeriod?.status || 'open',
      is_rollup_period: editPeriod?.is_rollup_period || false,
      consolidation_enabled: editPeriod?.consolidation_enabled || true,
      description: editPeriod?.description || ''
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      
      try {
        const method = editPeriod ? 'PUT' : 'POST'
        const url = editPeriod 
          ? `/api/fiscal-management/periods/${editPeriod.id}`
          : `/api/fiscal-management/fiscal-years/${year.id}/periods`

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Database': selectedCompany
          },
          body: JSON.stringify(editPeriod ? formData : {
            ...formData,
            fiscal_year_id: year.id
          })
        })

        if (response.ok) {
          setShowCreateModal(false)
          fetchPeriods()
          window.showToast?.(
            editPeriod 
              ? 'Period updated successfully!' 
              : 'Period created successfully!', 
            'success'
          )
          setFormData({
            period_code: '',
            period_name: '',
            period_type: 'month',
            start_date: '',
            end_date: '',
            status: 'open',
            is_rollup_period: false,
            consolidation_enabled: true,
            description: ''
          })
        } else {
          const error = await response.json()
          window.showToast?.(error.error || `Failed to ${editPeriod ? 'update' : 'create'} period`, 'error')
        }
      } catch (error) {
        console.error(`Error ${editPeriod ? 'updating' : 'creating'} period:`, error)
        window.showToast?.(`Failed to ${editPeriod ? 'update' : 'create'} period`, 'error')
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editPeriod ? 'Edit Period' : 'Create New Period'}
            </h2>
            <button
              onClick={() => {
                setShowCreateModal(false)
                setEditingPeriod(null)
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Period Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.period_code}
                  onChange={(e) => setFormData({...formData, period_code: e.target.value})}
                  placeholder="e.g., P01, Jan2024"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Period Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.period_name}
                  onChange={(e) => setFormData({...formData, period_name: e.target.value})}
                  placeholder="e.g., January 2024"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Period Type
                </label>
                <select
                  value={formData.period_type}
                  onChange={(e) => setFormData({...formData, period_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="month">Monthly</option>
                  <option value="quarter">Quarterly</option>
                  <option value="year">Annual</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
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
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Optional description for this period..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_rollup_period}
                  onChange={(e) => setFormData({...formData, is_rollup_period: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Rollup Period</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.consolidation_enabled}
                  onChange={(e) => setFormData({...formData, consolidation_enabled: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Consolidation</span>
              </label>
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
                {editPeriod ? 'Update Period' : 'Create Period'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const BulkCreateModal = () => {
    const [bulkType, setBulkType] = useState('month')
    
    const handleBulkCreate = async () => {
      try {
        console.log('🚀 Creating bulk periods for year:', year.id)
        const response = await fetch(`/api/fiscal-management/fiscal-years/${year.id}/periods/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Database': selectedCompany
          },
          body: JSON.stringify({
            fiscal_year_id: year.id,
            period_type: bulkType,
            auto_generate: true
          })
        })

        console.log('📡 Bulk create response status:', response.status)

        if (response.ok) {
          const result = await response.json()
          console.log('✅ Bulk periods created:', result)
          setShowBulkCreateModal(false)
          fetchPeriods()
          window.showToast?.(`${result.message}`, 'success')
        } else {
          const error = await response.json()
          console.error('❌ Bulk create error:', error)
          window.showToast?.(error.error || 'Failed to create periods', 'error')
        }
      } catch (error) {
        console.error('❌ Network error creating bulk periods:', error)
        window.showToast?.('Network error - please check if backend is running', 'error')
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Auto-Generate Periods
            </h2>
            <button
              onClick={() => {
                setShowBulkCreateModal(false)
                setEditingPeriod(null)
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Period Type
              </label>
              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="month">Monthly Periods</option>
                <option value="quarter">Quarterly Periods</option>
              </select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This will automatically generate {bulkType === 'month' ? '12 monthly' : '4 quarterly'} periods 
                for the fiscal year {year.year_name} ({new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}).
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowBulkCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Generate Periods
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Annual</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="locked">Locked</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBulkCreateModal(true)}
            className="flex items-center space-x-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>Auto-Generate</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Period</span>
          </button>
          <button
            onClick={fetchPeriods}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Periods Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredPeriods.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Periods Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create periods to define the time structure for this fiscal year.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setShowBulkCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span>Auto-Generate Periods</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Manual Period</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Consolidation
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPeriods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {period.period_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {period.period_code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getPeriodTypeIcon(period.period_type)}
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {period.period_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(period.status)}`}>
                        {getStatusIcon(period.status)}
                        <span className="capitalize">{period.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {period.consolidation_enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {period.consolidation_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEditPeriod(period)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePeriod(period.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDuplicatePeriod(period)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CreatePeriodModal editPeriod={editingPeriod} />}
      {showBulkCreateModal && <BulkCreateModal />}
    </div>
  )
}

export default PeriodsTab
