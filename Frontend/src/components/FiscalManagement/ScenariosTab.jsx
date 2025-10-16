import React, { useState, useEffect } from 'react'
import { useCompany } from '../../contexts/CompanyContext'
import ScenarioCustomFieldsTab from './ScenarioCustomFieldsTab'
import {
  Plus, Edit, Trash2, Copy, Eye, BarChart3, TrendingUp, Target, Layers,
  CheckCircle, XCircle, AlertCircle, Filter, RefreshCw, MoreVertical,
  Star, Archive, Lock, Unlock, Settings, Download, Upload, ChevronRight
} from 'lucide-react'

const ScenariosTab = ({ year }) => {
  const { selectedCompany } = useCompany()
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingScenario, setEditingScenario] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState(null)
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

  const handleEditScenario = (scenario) => {
    setEditingScenario(scenario)
    setShowCreateModal(true)
  }

  const handleDeleteScenario = async (scenarioId) => {
    if (!selectedCompany || !window.confirm('Are you sure you want to delete this scenario?')) return

    try {
      const response = await fetch(`/api/fiscal-management/scenarios/${scenarioId}`, {
        method: 'DELETE',
        headers: { 'X-Company-Database': selectedCompany }
      })

      if (response.ok) {
        window.showToast?.('Scenario deleted successfully!', 'success')
        fetchScenarios() // Refresh the list
      } else {
        const error = await response.json()
        window.showToast?.(error.detail || 'Failed to delete scenario', 'error')
      }
    } catch (error) {
      console.error('Error deleting scenario:', error)
      window.showToast?.('Failed to delete scenario', 'error')
    }
  }

  const handleDuplicateScenario = async (scenario) => {
    if (!selectedCompany) return;

    try {
      // Create a copy with a new name
      const duplicateData = {
        ...scenario,
        scenario_code: `${scenario.scenario_code}_COPY`,
        scenario_name: `${scenario.scenario_name} (Copy)`,
        version_number: '1.0'
      };

      const response = await fetch(`/api/fiscal-management/fiscal-years/${year.id}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany
        },
        body: JSON.stringify(duplicateData)
      });

      if (response.ok) {
        window.showToast?.('Scenario duplicated successfully!', 'success');
        fetchScenarios(); // Refresh the list
      } else {
        const error = await response.json();
        window.showToast?.(error.error || 'Failed to duplicate scenario', 'error');
      }
    } catch (error) {
      console.error('Error duplicating scenario:', error);
      window.showToast?.('Failed to duplicate scenario', 'error');
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

  // Filter scenarios
  const filteredScenarios = scenarios.filter(scenario => {
    const matchesType = filterType === 'all' || scenario.scenario_type === filterType
    const matchesStatus = filterStatus === 'all' || scenario.status === filterStatus
    return matchesType && matchesStatus
  })

  if (selectedScenario) {
    return (
      <ScenarioDetailsView
        scenario={selectedScenario}
        year={year}
        onBack={() => setSelectedScenario(null)}
        onUpdate={fetchScenarios}
      />
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
              <option value="actual">Actual</option>
              <option value="budget">Budget</option>
              <option value="forecast">Forecast</option>
              <option value="what_if">What-If</option>
              <option value="stress">Stress Test</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Scenario</span>
          </button>
          <button
            onClick={fetchScenarios}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Scenarios Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredScenarios.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Scenarios Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create scenarios to model different financial situations for this fiscal year.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Scenario</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Scenario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredScenarios.map((scenario) => (
                  <tr key={scenario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {scenario.scenario_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {scenario.scenario_code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getScenarioTypeIcon(scenario.scenario_type)}
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {scenario.scenario_type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        scenario.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        scenario.status === 'locked' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        scenario.status === 'archived' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {scenario.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {scenario.version_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(scenario.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedScenario(scenario)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditScenario(scenario)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDuplicateScenario(scenario)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteScenario(scenario.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateScenarioModal
          year={year}
          onClose={() => {
            setShowCreateModal(false)
            setEditingScenario(null)
          }}
          onSuccess={fetchScenarios}
          editScenario={editingScenario}
        />
      )}
    </div>
  )
}

// Scenario Details Component
const ScenarioDetailsView = ({ scenario, year, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Eye },
    { id: 'custom-fields', name: 'Custom Fields', icon: Settings },
    { id: 'data', name: 'Scenario Data', icon: Layers }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 transform rotate-180" />
          </button>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {scenario.scenario_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {scenario.scenario_code} • {scenario.scenario_type.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          scenario.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          scenario.status === 'locked' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
          scenario.status === 'archived' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }`}>
          {scenario.status}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
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
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-6">
        {activeTab === 'overview' && (
          <ScenarioOverviewTab scenario={scenario} year={year} />
        )}
        {activeTab === 'custom-fields' && (
          <ScenarioCustomFieldsTab scenario={scenario} year={year} />
        )}
        {activeTab === 'data' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scenario Data</h4>
            <p className="text-gray-500 dark:text-gray-400">Scenario data management will be implemented here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Scenario Overview Tab Component
const ScenarioOverviewTab = ({ scenario, year }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scenario Overview</h4>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scenario Code</label>
            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              {scenario.scenario_code}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scenario Name</label>
            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              {scenario.scenario_name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg capitalize">
              {scenario.scenario_type.replace('_', ' ')}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Version</label>
            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              {scenario.version_number}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <p className={`text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg ${
              scenario.status === 'active' ? 'text-green-800 dark:text-green-200' :
              scenario.status === 'locked' ? 'text-red-800 dark:text-red-200' :
              scenario.status === 'archived' ? 'text-gray-800 dark:text-gray-200' :
              'text-yellow-800 dark:text-yellow-200'
            }`}>
              {scenario.status}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created</label>
            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              {new Date(scenario.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              {scenario.description || 'No description provided'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Create/Edit Scenario Modal Component
const CreateScenarioModal = ({ year, onClose, onSuccess, editScenario = null }) => {
  const { selectedCompany } = useCompany()
  const [formData, setFormData] = useState({
    scenario_code: editScenario?.scenario_code || '',
    scenario_name: editScenario?.scenario_name || '',
    scenario_type: editScenario?.scenario_type || 'budget',
    description: editScenario?.description || '',
    version_number: editScenario?.version_number || '1.0',
    status: editScenario?.status || 'draft',
    is_baseline: editScenario?.is_baseline || false,
    allow_overrides: editScenario?.allow_overrides || true,
    auto_calculate: editScenario?.auto_calculate || true,
    consolidation_method: editScenario?.consolidation_method || 'full'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editScenario ? 'PUT' : 'POST'
      const url = editScenario 
        ? `/api/fiscal-management/scenarios/${editScenario.id}`
        : `/api/fiscal-management/fiscal-years/${year.id}/scenarios`

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany
        },
        body: JSON.stringify({
          ...formData,
          custom_field_definitions: []
        })
      })

      if (response.ok) {
        onClose()
        onSuccess()
        window.showToast?.(
          editScenario 
            ? 'Scenario updated successfully!' 
            : 'Scenario created successfully!', 
          'success'
        )
      } else {
        const error = await response.json()
        window.showToast?.(error.error || `Failed to ${editScenario ? 'update' : 'create'} scenario`, 'error')
      }
    } catch (error) {
      console.error(`Error ${editScenario ? 'updating' : 'creating'} scenario:`, error)
      window.showToast?.(`Failed to ${editScenario ? 'update' : 'create'} scenario`, 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editScenario ? 'Edit Scenario' : 'Create New Scenario'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scenario Code *</label>
              <input
                type="text"
                required
                value={formData.scenario_code}
                onChange={(e) => setFormData({...formData, scenario_code: e.target.value})}
                placeholder="e.g., BUDGET2024"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scenario Name *</label>
              <input
                type="text"
                required
                value={formData.scenario_name}
                onChange={(e) => setFormData({...formData, scenario_name: e.target.value})}
                placeholder="e.g., Annual Budget 2024"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <select
                value={formData.scenario_type}
                onChange={(e) => setFormData({...formData, scenario_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="actual">Actual</option>
                <option value="budget">Budget</option>
                <option value="forecast">Forecast</option>
                <option value="what_if">What-If</option>
                <option value="stress">Stress Test</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Version</label>
              <input
                type="text"
                value={formData.version_number}
                onChange={(e) => setFormData({...formData, version_number: e.target.value})}
                placeholder="e.g., 1.0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Optional description for this scenario..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {editScenario ? 'Update Scenario' : 'Create Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScenariosTab
