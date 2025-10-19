import React, { useState, useEffect } from 'react'
import { useCompany } from '../../contexts/CompanyContext'
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
    { id: 'settings', name: 'Settings', icon: Settings },
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
        {activeTab === 'settings' && (
          <ScenarioSettingsTab scenario={scenario} year={year} onUpdate={onUpdate} />
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

// Scenario Settings Tab Component
const ScenarioSettingsTab = ({ scenario, year, onUpdate }) => {
  const { selectedCompany } = useCompany()
  const [settings, setSettings] = useState(scenario.settings || {})
  const [allScenarios, setAllScenarios] = useState([])
  const [allFiscalYears, setAllFiscalYears] = useState([])
  const [previousReferences, setPreviousReferences] = useState(scenario.previous_references || [])
  const [upcomingReferences, setUpcomingReferences] = useState(scenario.upcoming_references || [])
  const [referenceDirection, setReferenceDirection] = useState('previous')
  const [selectedRefFiscalYearId, setSelectedRefFiscalYearId] = useState('')
  const [selectedRefScenarioId, setSelectedRefScenarioId] = useState('')
  const [availableScenariosForYear, setAvailableScenariosForYear] = useState([])
  const [saving, setSaving] = useState(false)

  // Fetch all fiscal years for reference
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!selectedCompany) return
      try {
        // Fetch all fiscal years for cross-year references
        const fiscalYearsResponse = await fetch(`/api/fiscal-management/fiscal-years`, {
          headers: { 'X-Company-Database': selectedCompany }
        })
        if (fiscalYearsResponse.ok) {
          const fiscalYearsData = await fiscalYearsResponse.json()
          setAllFiscalYears(fiscalYearsData.fiscal_years || [])
        }
      } catch (error) {
        console.error('Error fetching reference data:', error)
      }
    }
    fetchReferenceData()
  }, [selectedCompany])

  // Fetch scenarios when fiscal year is selected
  useEffect(() => {
    const fetchScenariosForYear = async () => {
      if (!selectedCompany || !selectedRefFiscalYearId) {
        setAvailableScenariosForYear([])
        return
      }
      
      try {
        const scenariosResponse = await fetch(`/api/fiscal-management/fiscal-years/${selectedRefFiscalYearId}/scenarios`, {
          headers: { 'X-Company-Database': selectedCompany }
        })
        if (scenariosResponse.ok) {
          const scenariosData = await scenariosResponse.json()
          setAvailableScenariosForYear(scenariosData.scenarios || [])
        }
      } catch (error) {
        console.error('Error fetching scenarios for year:', error)
        setAvailableScenariosForYear([])
      }
    }
    fetchScenariosForYear()
  }, [selectedCompany, selectedRefFiscalYearId])

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const generateReferenceCode = (direction, references) => {
    const prefix = direction === 'previous' ? 'prevref' : 'upcomref'
    let counter = 1
    while (references.some(ref => ref.code === `${prefix}${counter}`)) {
      counter++
    }
    return `${prefix}${counter}`
  }

  const addReference = () => {
    if (!selectedRefFiscalYearId || !selectedRefScenarioId) return
    
    const selectedFiscalYear = allFiscalYears.find(fy => fy.id === Number(selectedRefFiscalYearId))
    const selectedScenario = availableScenariosForYear.find(s => s.id === Number(selectedRefScenarioId))
    
    if (!selectedFiscalYear || !selectedScenario) return
    
    const newReference = {
      code: generateReferenceCode(referenceDirection, referenceDirection === 'previous' ? previousReferences : upcomingReferences),
      fiscal_year_id: selectedFiscalYear.id,
      fiscal_year_name: selectedFiscalYear.year_name,
      fiscal_year_code: selectedFiscalYear.year_code,
      scenario_id: selectedScenario.id,
      scenario_name: selectedScenario.scenario_name,
      scenario_code: selectedScenario.scenario_code,
      direction: referenceDirection
    }
    
    if (referenceDirection === 'previous') {
      setPreviousReferences([...previousReferences, newReference])
    } else {
      setUpcomingReferences([...upcomingReferences, newReference])
    }
    
    // Reset form
    setSelectedRefFiscalYearId('')
    setSelectedRefScenarioId('')
  }

  const removeReference = (direction, code) => {
    if (direction === 'previous') {
      setPreviousReferences(previousReferences.filter(ref => ref.code !== code))
    } else {
      setUpcomingReferences(upcomingReferences.filter(ref => ref.code !== code))
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/fiscal-management/scenarios/${scenario.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Database': selectedCompany
        },
        body: JSON.stringify({
          ...scenario,
          settings: settings,
          previous_references: previousReferences,
          upcoming_references: upcomingReferences
        })
      })
      if (response.ok) {
        window.showToast?.('Settings saved successfully!', 'success')
        onUpdate()
      } else {
        const error = await response.json()
        window.showToast?.(error.error || 'Failed to save settings', 'error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      window.showToast?.('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scenario Settings</h3>
      
      <div className="space-y-6">
        {/* Reference Scenarios */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Reference Scenarios</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Link this scenario to previous/next scenarios for comparison</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reference_scenarios_enabled || false}
                onChange={(e) => handleSettingChange('reference_scenarios_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.reference_scenarios_enabled && (
            <div className="mt-4 space-y-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              {/* Add Reference Form */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add New Reference</h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reference Direction</label>
                    <select
                      value={referenceDirection}
                      onChange={(e) => setReferenceDirection(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    >
                      <option value="previous">Previous</option>
                      <option value="upcoming">Upcoming/Future</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fiscal Year</label>
                    <select
                      value={selectedRefFiscalYearId}
                      onChange={(e) => {
                        setSelectedRefFiscalYearId(e.target.value)
                        setSelectedRefScenarioId('') // Reset scenario when year changes
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    >
                      <option value="">Select Fiscal Year</option>
                      {allFiscalYears.filter(fy => fy.id !== year.id).map((fy) => (
                        <option key={fy.id} value={fy.id}>
                          {fy.year_name} ({fy.year_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scenario</label>
                    <select
                      value={selectedRefScenarioId}
                      onChange={(e) => setSelectedRefScenarioId(e.target.value)}
                      disabled={!selectedRefFiscalYearId}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Choose a scenario</option>
                      {availableScenariosForYear.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.scenario_name} ({s.scenario_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addReference}
                      disabled={!selectedRefFiscalYearId || !selectedRefScenarioId}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Reference
                    </button>
                  </div>
                </div>
              </div>

              {/* References Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Previous Year References</h5>
                  <div className="space-y-2">
                    {previousReferences.length === 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 italic">None</div>
                    )}
                    {previousReferences.map((ref) => (
                      <div key={ref.code} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {ref.fiscal_year_name} – {ref.scenario_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Code: {ref.code} | {ref.fiscal_year_code} | {ref.scenario_code}
                          </div>
                        </div>
                        <button
                          onClick={() => removeReference('previous', ref.code)}
                          className="ml-2 p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
                          title="Remove reference"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Future Year References</h5>
                  <div className="space-y-2">
                    {upcomingReferences.length === 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 italic">None</div>
                    )}
                    {upcomingReferences.map((ref) => (
                      <div key={ref.code} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {ref.fiscal_year_name} – {ref.scenario_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Code: {ref.code} | {ref.fiscal_year_code} | {ref.scenario_code}
                          </div>
                        </div>
                        <button
                          onClick={() => removeReference('upcoming', ref.code)}
                          className="ml-2 p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors"
                          title="Remove reference"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
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
                <Settings className="h-4 w-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Scenario Overview Tab Component
const ScenarioOverviewTab = ({ scenario, year}) => {
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
    status: editScenario?.status || 'active',
    is_baseline: editScenario?.is_baseline || false,
    allow_overrides: editScenario?.allow_overrides || true,
    auto_calculate: editScenario?.auto_calculate || true,
    consolidation_method: editScenario?.consolidation_method || 'full'
  })
  
  const [customFields, setCustomFields] = useState(editScenario?.custom_field_definitions || [])
  const [showAddField, setShowAddField] = useState(false)
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    default_value: ''
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
          custom_field_definitions: customFields
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
          
          {/* Custom Fields Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Custom Fields</h3>
              <button
                type="button"
                onClick={() => setShowAddField(!showAddField)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {showAddField ? 'Cancel' : '+ Add Field'}
              </button>
            </div>
            
            {showAddField && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Field Name</label>
                    <input
                      type="text"
                      value={newField.name}
                      onChange={(e) => setNewField({...newField, name: e.target.value})}
                      placeholder="e.g., assumption_version"
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Display Label</label>
                    <input
                      type="text"
                      value={newField.label}
                      onChange={(e) => setNewField({...newField, label: e.target.value})}
                      placeholder="e.g., Assumption Version"
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField({...newField, type: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="boolean">Boolean</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Default Value</label>
                    <input
                      type="text"
                      value={newField.default_value}
                      onChange={(e) => setNewField({...newField, default_value: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (newField.name && newField.label) {
                      setCustomFields([...customFields, {...newField, id: Date.now()}])
                      setNewField({ name: '', label: '', type: 'text', required: false, default_value: '' })
                      setShowAddField(false)
                    }
                  }}
                  className="w-full px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Add Field
                </button>
              </div>
            )}
            
            {customFields.length > 0 && (
              <div className="space-y-2">
                {customFields.map((field) => (
                  <div key={field.id || field.name} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{field.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({field.type})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomFields(customFields.filter(f => (f.id || f.name) !== (field.id || field.name)))}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
