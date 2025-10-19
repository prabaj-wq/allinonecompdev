import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import {
  ChevronLeft, Calendar, FileSpreadsheet, Building2, Plus,
  Users, TrendingUp, Calculator, Upload, Download, Settings,
  Edit, Trash2, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react'

const DataInput = () => {
  const { selectedCompany } = useCompany()
  const { getAuthHeaders } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Parse URL parameters from Process.jsx navigation
  const searchParams = new URLSearchParams(location.search)
  const processId = searchParams.get('processId')
  const processName = searchParams.get('processName') || 'Process'
  const scenarioId = searchParams.get('scenario')
  const scenarioName = searchParams.get('scenarioName') || 'Not Set'
  const yearId = searchParams.get('year')
  const yearName = searchParams.get('yearName') || 'Not Set'
  const entitiesParam = searchParams.get('entities') || ''

  // State management
  const [activeCard, setActiveCard] = useState('entity_amounts') // entity_amounts, ic_amounts, other_amounts
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  // Form state for manual entry
  const [formData, setFormData] = useState({
    entity_id: '',
    period_id: '',
    account_id: '',
    amount: '',
    currency_code: 'USD',
    description: '',
    transaction_date: '',
    // IC Amounts specific fields
    from_entity_id: '',
    to_entity_id: '',
    from_account_id: '',
    to_account_id: '',
    fx_rate: '',
    transaction_type: '',
    reference_id: '',
    // Other Amounts specific fields
    adjustment_type: ''
  })

  // Reference data
  const [entities, setEntities] = useState([])
  const [accounts, setAccounts] = useState([])
  const [periods, setPeriods] = useState([])
  const [scenarios, setScenarios] = useState([])

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // Fetch reference data
  useEffect(() => {
    fetchReferenceData()
    fetchEntries()
  }, [selectedCompany, activeCard])

  const fetchReferenceData = async () => {
    if (!selectedCompany) return

    try {
      // Fetch entities
      const entitiesResponse = await fetch(`/api/axes-entity/elements?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      if (entitiesResponse.ok) {
        const entitiesData = await entitiesResponse.json()
        setEntities(entitiesData || [])
      }

      // Fetch accounts
      const accountsResponse = await fetch(`/api/axes-account/elements?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        setAccounts(accountsData || [])
      }

      // Fetch periods for the selected year
      if (yearId) {
        const periodsResponse = await fetch(`/api/fiscal-management/fiscal-years/${yearId}/periods`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Database': selectedCompany,
            ...getAuthHeaders()
          }
        })
        if (periodsResponse.ok) {
          const periodsData = await periodsResponse.json()
          setPeriods(periodsData?.periods || [])
        }
      }

      // Fetch scenarios for the selected year
      if (yearId) {
        const scenariosResponse = await fetch(`/api/fiscal-management/fiscal-years/${yearId}/scenarios`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Database': selectedCompany,
            ...getAuthHeaders()
          }
        })
        if (scenariosResponse.ok) {
          const scenariosData = await scenariosResponse.json()
          setScenarios(scenariosData?.scenarios || [])
        }
      }
    } catch (error) {
      console.error('Error fetching reference data:', error)
      showNotification('Failed to load reference data', 'error')
    }
  }

  const fetchEntries = async () => {
    if (!selectedCompany || !processId || !scenarioId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/data-input/${activeCard}/entries?company_name=${encodeURIComponent(selectedCompany)}&process_id=${processId}&scenario_id=${scenarioId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEntries(data || [])
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
      showNotification('Failed to load entries', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveEntry = async () => {
    if (!selectedCompany || !processId || !scenarioId) {
      showNotification('Missing required context data', 'error')
      return
    }

    // Basic validation
    if (activeCard === 'entity_amounts') {
      if (!formData.entity_id || !formData.period_id || !formData.account_id || !formData.amount) {
        showNotification('Please fill all required fields', 'error')
        return
      }
    } else if (activeCard === 'ic_amounts') {
      if (!formData.from_entity_id || !formData.to_entity_id || !formData.from_account_id || !formData.to_account_id || !formData.amount) {
        showNotification('Please fill all required fields', 'error')
        return
      }
    } else if (activeCard === 'other_amounts') {
      if (!formData.period_id || !formData.account_id || !formData.amount || !formData.adjustment_type) {
        showNotification('Please fill all required fields', 'error')
        return
      }
    }

    try {
      const entryData = {
        process_id: parseInt(processId),
        scenario_id: parseInt(scenarioId),
        year_id: parseInt(yearId),
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        fx_rate: parseFloat(formData.fx_rate) || null
      }

      const response = await fetch(`/api/data-input/${activeCard}/manual-entry?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(entryData)
      })

      if (response.ok) {
        showNotification('Entry saved successfully', 'success')
        setShowManualEntry(false)
        resetForm()
        fetchEntries() // Refresh the list
      } else {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to save entry')
      }
    } catch (error) {
      console.error('Error saving entry:', error)
      showNotification(error.message || 'Failed to save entry', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      entity_id: '',
      period_id: '',
      account_id: '',
      amount: '',
      currency_code: 'USD',
      description: '',
      transaction_date: '',
      from_entity_id: '',
      to_entity_id: '',
      from_account_id: '',
      to_account_id: '',
      fx_rate: '',
      transaction_type: '',
      reference_id: '',
      adjustment_type: ''
    })
  }

  // Card configuration
  const cards = [
    {
      id: 'entity_amounts',
      title: 'Entity Amounts',
      description: 'Financial data for individual entities',
      icon: Building2,
      color: 'bg-blue-500',
      count: entries.length
    },
    {
      id: 'ic_amounts',
      title: 'IC Amounts',
      description: 'Intercompany transactions',
      icon: Users,
      color: 'bg-purple-500',
      count: 0 // Would need separate fetch for IC amounts
    },
    {
      id: 'other_amounts',
      title: 'Other Amounts',
      description: 'Adjustments and additional data',
      icon: Calculator,
      color: 'bg-green-500',
      count: 0 // Would need separate fetch for Other amounts
    }
  ]

  const renderCardContent = () => {
    const activeCardData = cards.find(card => card.id === activeCard)

    return (
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg ${activeCardData.color} flex items-center justify-center`}>
              <activeCardData.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeCardData.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activeCardData.description}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowManualEntry(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Entry
            </button>
            <button className="btn-secondary inline-flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload CSV
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {activeCard === 'entity_amounts' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Currency</th>
                  </>
                )}
                {activeCard === 'ic_amounts' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">From Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">To Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  </>
                )}
                {activeCard === 'other_amounts' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  </>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    Loading entries...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No entries found. Click "Add Entry" to create your first entry.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {activeCard === 'entity_amounts' && (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {entities.find(e => e.id === entry.entity_id)?.name || entry.entity_name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {periods.find(p => p.id === entry.period_id)?.period_name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {accounts.find(a => a.id === entry.account_id)?.account_name || entry.account_code || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {entry.amount?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {entry.currency_code}
                        </td>
                      </>
                    )}
                    {activeCard === 'ic_amounts' && (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {entities.find(e => e.id === entry.from_entity_id)?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {entities.find(e => e.id === entry.to_entity_id)?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {entry.amount?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {entry.transaction_type}
                        </td>
                      </>
                    )}
                    {activeCard === 'other_amounts' && (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {entities.find(e => e.id === entry.entity_id)?.name || 'Global'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {periods.find(p => p.id === entry.period_id)?.period_name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {accounts.find(a => a.id === entry.account_id)?.account_name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {entry.amount?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {entry.adjustment_type}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {entry.description}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderManualEntryModal = () => {
    if (!showManualEntry) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New Entry - {cards.find(c => c.id === activeCard)?.title}
              </h3>
              <button
                onClick={() => {
                  setShowManualEntry(false)
                  resetForm()
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {activeCard === 'entity_amounts' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Entity *
                    </label>
                    <select
                      value={formData.entity_id}
                      onChange={(e) => setFormData({...formData, entity_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Entity</option>
                      {entities.map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name} ({entity.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Period *
                    </label>
                    <select
                      value={formData.period_id}
                      onChange={(e) => setFormData({...formData, period_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Period</option>
                      {periods.map(period => (
                        <option key={period.id} value={period.id}>
                          {period.period_name} ({period.period_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account *
                    </label>
                    <select
                      value={formData.account_id}
                      onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.account_name} ({account.account_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Currency *
                    </label>
                    <select
                      value={formData.currency_code}
                      onChange={(e) => setFormData({...formData, currency_code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Transaction Date
                    </label>
                    <input
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    placeholder="Optional description or notes"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
              </>
            )}

            {activeCard === 'ic_amounts' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      From Entity *
                    </label>
                    <select
                      value={formData.from_entity_id}
                      onChange={(e) => setFormData({...formData, from_entity_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select From Entity</option>
                      {entities.map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name} ({entity.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      To Entity *
                    </label>
                    <select
                      value={formData.to_entity_id}
                      onChange={(e) => setFormData({...formData, to_entity_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select To Entity</option>
                      {entities.map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name} ({entity.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      From Account *
                    </label>
                    <select
                      value={formData.from_account_id}
                      onChange={(e) => setFormData({...formData, from_account_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select From Account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.account_name} ({account.account_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      To Account *
                    </label>
                    <select
                      value={formData.to_account_id}
                      onChange={(e) => setFormData({...formData, to_account_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select To Account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.account_name} ({account.account_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Transaction Type *
                    </label>
                    <select
                      value={formData.transaction_type}
                      onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Type</option>
                      <option value="sale">Sale</option>
                      <option value="purchase">Purchase</option>
                      <option value="loan">Loan</option>
                      <option value="service">Service</option>
                      <option value="cost_allocation">Cost Allocation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Currency
                    </label>
                    <select
                      value={formData.currency_code}
                      onChange={(e) => setFormData({...formData, currency_code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      FX Rate
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.fx_rate}
                      onChange={(e) => setFormData({...formData, fx_rate: e.target.value})}
                      placeholder="1.0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reference ID
                    </label>
                    <input
                      type="text"
                      value={formData.reference_id}
                      onChange={(e) => setFormData({...formData, reference_id: e.target.value})}
                      placeholder="Invoice or reference number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Period
                    </label>
                    <select
                      value={formData.period_id}
                      onChange={(e) => setFormData({...formData, period_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Period</option>
                      {periods.map(period => (
                        <option key={period.id} value={period.id}>
                          {period.period_name} ({period.period_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                    placeholder="Transaction description"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
              </>
            )}

            {activeCard === 'other_amounts' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Entity
                    </label>
                    <select
                      value={formData.entity_id}
                      onChange={(e) => setFormData({...formData, entity_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Entity (or leave blank for Global)</option>
                      {entities.map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name} ({entity.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Period *
                    </label>
                    <select
                      value={formData.period_id}
                      onChange={(e) => setFormData({...formData, period_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Period</option>
                      {periods.map(period => (
                        <option key={period.id} value={period.id}>
                          {period.period_name} ({period.period_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account *
                    </label>
                    <select
                      value={formData.account_id}
                      onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.account_name} ({account.account_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Adjustment Type *
                    </label>
                    <select
                      value={formData.adjustment_type}
                      onChange={(e) => setFormData({...formData, adjustment_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Type</option>
                      <option value="manual">Manual</option>
                      <option value="one_off">One-off</option>
                      <option value="reclassification">Reclassification</option>
                      <option value="correction">Correction</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Currency
                    </label>
                    <select
                      value={formData.currency_code}
                      onChange={(e) => setFormData({...formData, currency_code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    placeholder="Reason for adjustment"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setShowManualEntry(false)
                  resetForm()
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveEntry}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/process')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Data Input - {processName}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />{yearName}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet className="h-4 w-4" />{scenarioName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />{selectedCompany || 'No Company'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : notification.type === 'error'
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="p-6">
        {/* Card Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => setActiveCard(card.id)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                activeCard === card.id
                  ? `${card.color} border-opacity-100 text-white`
                  : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className={`font-semibold ${activeCard === card.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {card.title}
                  </h3>
                  <p className={`text-sm ${activeCard === card.id ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                    {card.description}
                  </p>
                  <p className={`text-xs mt-1 ${activeCard === card.id ? 'text-white/60' : 'text-gray-500 dark:text-gray-500'}`}>
                    {card.count} entries
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Card Content */}
        {renderCardContent()}
      </div>

      {/* Manual Entry Modal */}
      {renderManualEntryModal()}
    </div>
  )
}

export default DataInput
