import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import {
  ChevronLeft, Calendar, FileSpreadsheet, Building2, Plus,
  Users, TrendingUp, Calculator, Upload, Download, Link,
  Edit, Trash2, RefreshCw, DollarSign, X, Loader2, Filter
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
  const yearId = searchParams.get('year')
  const scenarioId = searchParams.get('scenario')
  const entitiesParam = searchParams.get('entities')
  const entityContext = searchParams.get('entityContext') || 'all'
  const defaultEntity = searchParams.get('defaultEntity') || ''
  const flowMode = searchParams.get('flowMode') || 'entity'

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
  
  // Entity filtering state
  const [selectedEntityFilter, setSelectedEntityFilter] = useState('all')
  const [selectedICEntityFilter, setSelectedICEntityFilter] = useState('all')
  const [selectedOtherEntityFilter, setSelectedOtherEntityFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filteredEntries, setFilteredEntries] = useState([])
  
  // File upload ref
  const fileInputRef = useRef(null)

  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Calculate balances and totals for each card type
  const calculateCardStats = (cardType) => {
    const cardEntries = entries.filter(entry => {
      if (cardType === 'entity_amounts') return entry.type === 'entity' || !entry.type
      if (cardType === 'ic_amounts') return entry.type === 'intercompany'
      if (cardType === 'other_amounts') return entry.type === 'other'
      return true
    })

    const totalBalance = cardEntries.reduce((sum, entry) => {
      const amount = parseFloat(entry.amount) || 0
      return sum + amount
    }, 0)

    const filteredCardEntries = filteredEntries.filter(entry => {
      if (cardType === 'entity_amounts') return entry.type === 'entity' || !entry.type
      if (cardType === 'ic_amounts') return entry.type === 'intercompany'
      if (cardType === 'other_amounts') return entry.type === 'other'
      return true
    })

    const filteredBalance = filteredCardEntries.reduce((sum, entry) => {
      const amount = parseFloat(entry.amount) || 0
      return sum + amount
    }, 0)

    return {
      totalCount: cardEntries.length,
      filteredCount: filteredCardEntries.length,
      totalBalance,
      filteredBalance,
      isBalanced: Math.abs(totalBalance) < 0.01, // Consider balanced if within 1 cent
      isFilteredBalanced: Math.abs(filteredBalance) < 0.01
    }
  }

  // Export functionality
  const handleExport = async (cardType) => {
    try {
      const params = new URLSearchParams({ company_name: selectedCompany })
      if (processId) params.append('process_id', processId)
      if (scenarioId) {
        const trimmedScenario = `${scenarioId}`.trim()
        if (trimmedScenario) params.append('scenario_id', trimmedScenario)
      }

      const response = await fetch(`/api/data-input/export/${cardType}?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
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

    if (!file.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('card_type', cardType)
    formData.append('company_name', selectedCompany)
    if (processId) formData.append('process_id', processId)
    if (scenarioId) formData.append('scenario_id', scenarioId)

    try {
      const response = await fetch('/api/data-input/import', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        showToast(`Imported ${result.imported_count} entries successfully`, 'success')
        fetchEntries() // Refresh the entries
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

  // Card configuration with balance calculations
  const cards = [
    {
      id: 'entity_amounts',
      title: 'Entity Amounts',
      description: 'Financial data for individual entities',
      icon: Building2,
      color: 'bg-blue-500',
      ...calculateCardStats('entity_amounts')
    },
    {
      id: 'ic_amounts',
      title: 'IC Amounts',
      description: 'Intercompany transactions',
      icon: Users,
      color: 'bg-purple-500',
      ...calculateCardStats('ic_amounts')
    },
    {
      id: 'other_amounts',
      title: 'Other Amounts',
      description: 'Adjustments and additional data',
      icon: Calculator,
      color: 'bg-green-500',
      ...calculateCardStats('other_amounts')
    }
  ]

  // Fetch entries (placeholder - you'll need to implement this)
  const fetchEntries = async () => {
    setLoading(true)
    try {
      // Implement your fetch logic here
      setEntries([])
      setFilteredEntries([])
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (processId && selectedCompany) {
      fetchEntries()
    }
  }, [processId, selectedCompany, activeCard])

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
              {/* Balance and Count Info */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Total: {activeCardData.totalCount} entries
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    activeCardData.isBalanced 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    Balance: {activeCardData.totalBalance?.toFixed(2) || '0.00'}
                    {activeCardData.isBalanced ? ' ✓' : ' ⚠️'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary inline-flex items-center gap-2 ${showFilters ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                    Loading entries...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                    No entries found. Click "Add Entry" to create your first entry.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {entry.entity_name || entry.entity_code || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {entry.amount || '0.00'} {entry.currency_code || 'USD'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {entry.description || 'No description'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4">
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
                  <div className={`text-xs mt-1 ${activeCard === card.id ? 'text-white/60' : 'text-gray-500 dark:text-gray-500'}`}>
                    <div className="flex items-center gap-2">
                      <span>{card.totalCount} entries</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        card.isBalanced 
                          ? activeCard === card.id ? 'bg-white/20 text-white' : 'bg-green-100 text-green-800'
                          : activeCard === card.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-800'
                      }`}>
                        {card.totalBalance?.toFixed(2) || '0.00'} {card.isBalanced ? '✓' : '⚠️'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Card Content */}
        {renderCardContent()}
      </div>
    </div>
  )
}

export default DataInput
