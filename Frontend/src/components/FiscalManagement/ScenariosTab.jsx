import React, { useState, useEffect } from 'react'
import { useCompany } from '../../contexts/CompanyContext'
import { 
  Plus, Edit, Trash2, Copy, Eye, BarChart3, TrendingUp, Target, Layers,
  CheckCircle, XCircle, AlertCircle, Filter, RefreshCw, MoreVertical,
  Star, Archive, Lock, Unlock, Settings, Download, Upload
} from 'lucide-react'

const ScenariosTab = ({ year }) => {
  const { selectedCompany } = useCompany()
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchScenarios = async () => {
    if (!selectedCompany || !year) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/fiscal-management/fiscal-years/${year.id}/scenarios`, {
        headers: { 'X-Company-Database': selectedCompany }
      })
      
      if (response.ok) {
        const data = await response.json()
        setScenarios(data.scenarios || [])
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScenarios()
  }, [selectedCompany, year])

  const getScenarioTypeIcon = (type) => {
    const icons = {
      actual: <CheckCircle className="h-4 w-4 text-green-500" />,
      budget: <Target className="h-4 w-4 text-blue-500" />,
      forecast: <TrendingUp className="h-4 w-4 text-purple-500" />,
      what_if: <BarChart3 className="h-4 w-4 text-orange-500" />,
      stress: <AlertCircle className="h-4 w-4 text-red-500" />,
      custom: <Settings className="h-4 w-4 text-gray-500" />
    }
    return icons[type] || <Layers className="h-4 w-4 text-gray-500" />
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      final: 'bg-blue-100 text-blue-800 border-blue-200',
      archived: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const filteredScenarios = scenarios.filter(scenario => {
    const matchesType = filterType === 'all' || scenario.scenario_type === filterType
    const matchesStatus = filterStatus === 'all' || scenario.status === filterStatus
    return matchesType && matchesStatus
  })

  const CreateScenarioModal = () => {
    const [formData, setFormData] = useState({
      scenario_code: '', scenario_name: '', scenario_type: 'budget',
      description: '', assumptions: '', is_baseline: false,
      allow_overrides: true, auto_calculate: true, consolidation_method: 'full'
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      try {
        const response = await fetch(`/api/fiscal-management/fiscal-years/${year.id}/scenarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Database': selectedCompany
          },
          body: JSON.stringify({ ...formData, fiscal_year_id: year.id })
        })

        if (response.ok) {
          setShowCreateModal(false)
          setFormData({
            scenario_code: '', scenario_name: '', scenario_type: 'budget', description: '',
            parent_scenario_id: null, version_number: '1.0', status: 'draft', is_baseline: false,
            allow_overrides: true, auto_calculate: true, consolidation_method: 'full'
          })
          fetchScenarios()
          window.showToast?.('Scenario created successfully!', 'success')
        } else {
          const error = await response.json()
          window.showToast?.(error.error || 'Failed to create scenario', 'error')
        }
      } catch (error) {
        console.error('Error creating scenario:', error)
        window.showToast?.('Failed to create scenario', 'error')
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Scenario</h2>
            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scenario Code *</label>
                <input type="text" required value={formData.scenario_code}
                  onChange={(e) => setFormData({...formData, scenario_code: e.target.value})}
                  placeholder="e.g., BUDGET2024" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scenario Name *</label>
                <input type="text" required value={formData.scenario_name}
                  onChange={(e) => setFormData({...formData, scenario_name: e.target.value})}
                  placeholder="e.g., Annual Budget 2024" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scenario Type</label>
                <select value={formData.scenario_type} onChange={(e) => setFormData({...formData, scenario_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                  <option value="actual">Actual</option>
                  <option value="budget">Budget</option>
                  <option value="forecast">Forecast</option>
                  <option value="what_if">What-If Analysis</option>
                  <option value="stress">Stress Test</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Consolidation Method</label>
                <select value={formData.consolidation_method} onChange={(e) => setFormData({...formData, consolidation_method: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                  <option value="full">Full Consolidation</option>
                  <option value="proportional">Proportional</option>
                  <option value="equity">Equity Method</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the purpose and scope of this scenario..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={formData.is_baseline} onChange={(e) => setFormData({...formData, is_baseline: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Set as Baseline</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={formData.allow_overrides} onChange={(e) => setFormData({...formData, allow_overrides: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow Manual Overrides</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button type="button" onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Create Scenario</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm">
            <option value="all">All Types</option>
            <option value="actual">Actual</option>
            <option value="budget">Budget</option>
            <option value="forecast">Forecast</option>
            <option value="what_if">What-If</option>
            <option value="stress">Stress Test</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm">
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="final">Final</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
            <Plus className="h-4 w-4" />
            <span>Add Scenario</span>
          </button>
          <button onClick={fetchScenarios} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredScenarios.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border">
          <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Scenarios Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Create scenarios to model different financial outcomes.</p>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto">
            <Plus className="h-4 w-4" />
            <span>Create First Scenario</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario) => (
            <div key={scenario.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getScenarioTypeIcon(scenario.scenario_type)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{scenario.scenario_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{scenario.scenario_code}</p>
                  </div>
                </div>
                {scenario.is_baseline && <Star className="h-5 w-5 text-yellow-500" />}
              </div>
              
              <div className="space-y-3 mb-4">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(scenario.status)}`}>
                  {scenario.status.charAt(0).toUpperCase() + scenario.status.slice(1)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{scenario.description || 'No description provided'}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400"><Eye className="h-4 w-4" /></button>
                  <button className="text-gray-600 hover:text-gray-800 dark:text-gray-400"><Edit className="h-4 w-4" /></button>
                  <button className="text-green-600 hover:text-green-800 dark:text-green-400"><Copy className="h-4 w-4" /></button>
                </div>
                <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && <CreateScenarioModal />}
    </div>
  )
}

export default ScenariosTab
