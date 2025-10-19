import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import {
  ChevronLeft, Calendar, FileSpreadsheet, Building2, Plus,
  Users, TrendingUp, Calculator, Upload, Download, Link,
  Edit, Trash2, RefreshCw, DollarSign, X, Loader2
} from 'lucide-react'

const DataInput = () => {
  const { selectedCompany } = useCompany()
  const { getAuthHeaders } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Parse URL parameters from Process.jsx navigation
  const searchParams = new URLSearchParams(location.search)
  const processId = searchParams.get('processId')
  const processName = searchParams.get('processName') || 'Data Input'

  // State management
  const [activeCard, setActiveCard] = useState('entity_amounts')
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState(null)
  
  // Custom fields configuration from process
  const [customFieldsConfig, setCustomFieldsConfig] = useState({
    entity_amounts: [],
    ic_amounts: [],
    other_amounts: []
  })

  // Form state
  const [formData, setFormData] = useState({
    entity_id: '',
    account_id: '',
    amount: '',
    currency_code: 'USD',
    description: '',
    transaction_date: '',
    reference_id: '',
    period_id: '',
    from_entity_id: '',
    to_entity_id: '',
    from_account_id: '',
    to_account_id: '',
    transaction_type: '',
    fx_rate: '1.0',
    adjustment_type: '',
    custom_transaction_type: ''
  })

  // Reference data
  const [entities, setEntities] = useState([])
  const [accounts, setAccounts] = useState([])
  const [periods, setPeriods] = useState([])
  const [scenarios, setScenarios] = useState([])

  const showToast = (message, type = 'success') => {
    // Use built-in notification system
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Fetch process configuration and custom fields
  useEffect(() => {
    if (processId && selectedCompany) {
      fetchProcessConfig()
      fetchReferenceData()
    }
  }, [processId, selectedCompany])

  useEffect(() => {
    if (processId && selectedCompany) {
      fetchEntries()
    }
  }, [processId, selectedCompany, activeCard])

  const fetchProcessConfig = async () => {
    try {
      const response = await fetch(
        `/api/financial-process/processes/${processId}/configuration?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
        }
      )
      if (response.ok) {
        const config = await response.json()
        const customFields = config.configuration?.settings?.data_input_custom_fields || {
          entity_amounts: [],
          ic_amounts: [],
          other_amounts: []
        }
        setCustomFieldsConfig(customFields)
        console.log('📋 Custom fields loaded:', customFields)
      }
    } catch (error) {
      console.error('Error fetching process config:', error)
    }
  }

  const fetchReferenceData = async () => {
    try {
      // Fetch entities
      const entitiesRes = await fetch(
        `/api/axes-entity/elements?company_name=${encodeURIComponent(selectedCompany)}`,
        { credentials: 'include', headers: { ...getAuthHeaders() } }
      )
      if (entitiesRes.ok) {
        const data = await entitiesRes.json()
        setEntities(Array.isArray(data) ? data : [])
      }

      // Fetch accounts
      const accountsRes = await fetch(
        `/api/axes-account/elements?company_name=${encodeURIComponent(selectedCompany)}`,
        { credentials: 'include', headers: { ...getAuthHeaders() } }
      )
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json()
        setAccounts(Array.isArray(accountsData) ? accountsData : [])
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
    }
  }

  const fetchEntries = async () => {
    if (!selectedCompany || !processId) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/financial-process/processes/${processId}/data-input/${activeCard}?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
      showToast('Failed to load entries', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveEntry = async () => {
    if (!selectedCompany || !processId) {
      showToast('Missing required context data', 'error')
      return
    }

    setSaving(true)
    try {
      // Build entry data with custom fields
      const customFields = {}
      const customFieldDefs = customFieldsConfig[activeCard] || []
      customFieldDefs.forEach(field => {
        if (formData[field.name]) {
          customFields[field.name] = formData[field.name]
        }
      })

      const entryData = {
        entity_code: formData.entity_code || formData.entity_id,
        period_code: formData.period_code || formData.period_id,
        period_date: formData.transaction_date,
        account_code: formData.account_code || formData.account_id,
        amount: parseFloat(formData.amount) || 0,
        currency: formData.currency_code || 'USD',
        description: formData.description,
        origin: 'web_input',
        custom_fields: customFields
      }

      // Add type-specific fields
      if (activeCard === 'ic_amounts') {
        entryData.counterparty_entity_code = formData.to_entity_id
        entryData.ic_reason = formData.transaction_type
      } else if (activeCard === 'other_amounts') {
        entryData.adjustment_type = formData.adjustment_type
      }

      const response = await fetch(
        `/api/financial-process/processes/${processId}/data-input/${activeCard}?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(entryData)
        }
      )

      if (response.ok) {
        showToast('Entry saved successfully!', 'success')
        setShowManualEntry(false)
        resetForm()
        fetchEntries()
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to save entry')
      }
    } catch (error) {
      console.error('Error saving entry:', error)
      showToast(error.message || 'Failed to save entry', 'error')
    } finally {
      setSaving(false)
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
      adjustment_type: '',
      custom_transaction_type: ''
    })
  }

  const fileInputRef = useRef(null)

  // Export functionality
  const handleExport = async (cardType) => {
    try {
      const response = await fetch(`/api/data-input/export/${cardType}?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${cardType}_data_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('Data exported successfully', 'success')
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      showToast('Export failed', 'error')
    }
  }

  // Import functionality
  const handleImport = async (event, cardType) => {
    const file = event.target.files[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('card_type', cardType)
    
    try {
      const response = await fetch(`/api/data-input/import?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        showToast(`Import completed: ${result.imported} records imported, ${result.updated} updated`, 'success')
        // Refresh data here if needed
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      showToast(`Import failed: ${error.message}`, 'error')
    } finally {
      // Reset file input
      event.target.value = ''
    }
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
            <button 
              onClick={() => handleExport(activeCard)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleImport(e, activeCard)}
              accept=".csv"
              style={{ display: 'none' }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Counterparty</th>
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
                          {entity.entity_code || entity.code} - {entity.entity_name || entity.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Year and period will be automatically calculated</p>
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
                          {account.account_code} - {account.account_name}
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
                    <input
                      type="text"
                      value={formData.currency_code || ''}
                      onChange={(e) => setFormData({...formData, currency_code: e.target.value.toUpperCase()})}
                      placeholder="USD, EUR, GBP, etc."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                      maxLength={3}
                      required
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
                      Entity *
                    </label>
                    <select
                      value={formData.from_entity_id}
                      onChange={(e) => setFormData({...formData, from_entity_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select From Entity</option>
                      {entities.map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.entity_code || entity.code} - {entity.entity_name || entity.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Counterparty *
                    </label>
                    <select
                      value={formData.to_entity_id}
                      onChange={(e) => setFormData({...formData, to_entity_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select To Entity</option>
                      {entities.map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.entity_code || entity.code} - {entity.entity_name || entity.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account *
                    </label>
                    <select
                      value={formData.from_account_id}
                      onChange={(e) => setFormData({...formData, from_account_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select From Account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.account_code} - {account.account_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Counterparty Account *
                    </label>
                    <select
                      value={formData.to_account_id}
                      onChange={(e) => setFormData({...formData, to_account_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select To Account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.account_code} - {account.account_name}
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
                      <option value="sale_goods">Sale of goods or inventory</option>
                      <option value="provision_services">Provision of services (shared services)</option>
                      <option value="licences_royalties">Licences / Royalties / IP transfers</option>
                      <option value="loans_advances">Loans / Advances / Finance charges</option>
                      <option value="dividends">Dividends / Capital distributions</option>
                      <option value="asset_transfers">Asset transfers (fixed assets, inter-company disposals)</option>
                      <option value="cost_allocations">Cost allocations / cost recharges</option>
                      <option value="clearing_settlement">Intercompany clearing/settlement of bank/cash flows</option>
                      <option value="inventory_unrealised">Intercompany inventory transfers with unrealised profit</option>
                      <option value="investment_equity">Inter-entity investment or equity transactions</option>
                      <option value="service_reimbursement">Service fee reimbursement / cost sharing</option>
                      <option value="lease_rental">Intercompany lease / rental transactions</option>
                      <option value="upstream_downstream">Upstream/downstream asset or equity flows</option>
                      <option value="lateral">Lateral transactions</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  {/* Show custom field when 'Other' is selected */}
                  {formData.transaction_type === 'other' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Specify Transaction Type *
                      </label>
                      <input
                        type="text"
                        value={formData.custom_transaction_type || ''}
                        onChange={(e) => setFormData({...formData, custom_transaction_type: e.target.value})}
                        placeholder="Enter custom transaction type"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Currency
                    </label>
                    <input
                      type="text"
                      value={formData.currency_code || ''}
                      onChange={(e) => setFormData({...formData, currency_code: e.target.value.toUpperCase()})}
                      placeholder="USD, EUR, GBP, etc."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                      maxLength={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                      required
                    />
                  </div>
                </div>

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
                  <p className="text-xs text-gray-500 mt-1">Year and period will be automatically calculated from transaction date</p>
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
                          {entity.entity_code || entity.code} - {entity.entity_name || entity.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Year and period will be automatically calculated</p>
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
                          {account.account_code} - {account.account_name}
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
                    <input
                      type="text"
                      value={formData.currency_code || ''}
                      onChange={(e) => setFormData({...formData, currency_code: e.target.value.toUpperCase()})}
                      placeholder="USD, EUR, GBP, etc."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                      maxLength={3}
                    />
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
                  {processName}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {selectedCompany || 'No Company'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>Process Data Input</span>
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
