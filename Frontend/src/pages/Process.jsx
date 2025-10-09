import React, { useState, useEffect, useRef } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import { 
  Plus, 
  Edit,
  Trash2,
  Search,
  Filter, 
  Download, 
  Upload,
  RefreshCw,
  DollarSign,
  BarChart3,
  Building2,
  FileText,
  X,
  Save,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  PieChart,
  Eye,
  Folder,
  FolderPlus
} from 'lucide-react'

const Process = () => {
  const { selectedCompany, ifrsAccounts, entities } = useCompany()
  const { isAuthenticated, getAuthHeaders } = useAuth()
  
  const [isLoading, setIsLoading] = useState(false)
  const [currentPeriod, setCurrentPeriod] = useState('')
  const [currentYear, setCurrentYear] = useState('')
  const [entries, setEntries] = useState([])
  const [accounts, setAccounts] = useState([])
  const [localEntities, setLocalEntities] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showCopyForwardModal, setShowCopyForwardModal] = useState(false)
  
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [lastEntry, setLastEntry] = useState(null)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  const [copyForwardForm, setCopyForwardForm] = useState({
    fromPeriod: '',
    fromYear: '',
    fromEntity: '',
    fromCategory: '',
    toPeriod: '',
    toYear: ''
  })

  const [entryForm, setEntryForm] = useState({
    entity_code: '',
    account_code: '',
    amount: '',
    currency: '',
    counterparty: '',
    entry_category: 'Manual Entry',
    custom_note: '',
    period: '',
    year: ''
  })

  const periods = [
    'Q1', 'Q2', 'Q3', 'Q4',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = ['2025', '2024', '2023', '2022']
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SGD']
  
  const entryCategories = [
    'Manual Entry',
    'Adjustment',
    'Reclassification',
    'Intercompany',
    'Elimination',
    'Opening Balance',
    'Custom'
  ]

  // Check authentication status
  const checkAuth = () => {
    if (!isAuthenticated) {
      console.error('❌ User not authenticated')
      return false
    }
    return true
  }

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000)
  }

  // Load accounts and entities on component mount
  useEffect(() => {
    if (isAuthenticated && selectedCompany) {
      console.log('🔐 User authenticated, loading data for company:', selectedCompany)
      loadAccountsAndEntities()
    }
  }, [isAuthenticated, selectedCompany])

  // Update entries when period/year changes
  useEffect(() => {
    if (!currentPeriod || !currentYear) return
    loadPeriodData()
  }, [currentPeriod, currentYear])


  const loadAccountsAndEntities = async () => {
    if (!checkAuth()) {
      console.error('❌ Authentication check failed, cannot load accounts and entities')
      return
    }
    
    setIsLoading(true)
    try {
      console.log('🔍 Loading accounts and entities for company:', selectedCompany)
      
      // Load accounts from API
      const accountsResponse = await fetch('/api/ifrs-accounts', {
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        const companyAccounts = accountsData.accounts || []
        setAccounts(companyAccounts)
        console.log('📊 Loaded accounts from API:', companyAccounts.length)
      } else {
        console.error('❌ Failed to load accounts from API:', accountsResponse.status)
        if (ifrsAccounts && ifrsAccounts.length > 0) {
          setAccounts(ifrsAccounts)
          console.log('📊 Using CompanyContext accounts as fallback:', ifrsAccounts.length)
        }
      }
      
      // Load entities from API
      const entitiesResponse = await fetch('/api/entities', {
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      
      if (entitiesResponse.ok) {
        const entitiesData = await entitiesResponse.json()
        const companyEntities = entitiesData.entities || []
        setLocalEntities(companyEntities)
        console.log('📊 Loaded entities from API:', companyEntities.length)
      } else {
        console.error('❌ Failed to load entities from API:', entitiesResponse.status)
        if (entities && entities.length > 0) {
          setLocalEntities(entities)
          console.log('📊 Using CompanyContext entities as fallback:', entities.length)
        }
      }
      
    } catch (error) {
      console.error('💥 Error in loadAccountsAndEntities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPeriodData = async () => {
    if (!currentPeriod || !currentYear) return
    
    setIsLoading(true)
    try {
      console.log(`🔍 Loading data for ${currentPeriod} ${currentYear}...`)
      
      // Load existing data for the selected period/year (process entries only)
      const response = await fetch(`/api/process/entries?period=${currentPeriod}&year=${currentYear}&source_type=process_entry`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      console.log('📡 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 API Response data:', data)
        
        let entriesArray = []
        if (data.entries && Array.isArray(data.entries)) {
          entriesArray = data.entries
        } else if (Array.isArray(data)) {
          entriesArray = data
        } else {
          console.log('⚠️ Unexpected data structure:', data)
          entriesArray = []
        }
        
        console.log('📋 Processed entries array:', entriesArray)
        
        // Remove duplicates based on entry_id
        const uniqueEntries = entriesArray.filter((entry, index, self) => 
          index === self.findIndex(e => e.entry_id === entry.entry_id)
        )
        
        if (uniqueEntries.length !== entriesArray.length) {
          console.log(`⚠️ Removed ${entriesArray.length - uniqueEntries.length} duplicate entries`)
        }
        
        setEntries(uniqueEntries)
        
        if (entriesArray.length > 0) {
          setLastEntry(entriesArray[entriesArray.length - 1])
          console.log(`✅ Loaded ${entriesArray.length} entries from SQL`)
        } else {
          console.log('ℹ️ No entries found in SQL database')
          setLastEntry(null)
        }
      } else {
        console.log('❌ API request failed with status:', response.status)
        const errorData = await response.text()
        console.log('❌ Error details:', errorData)
        setEntries([])
        setLastEntry(null)
      }
    } catch (error) {
      console.error('💥 Error loading period data:', error)
      setEntries([])
      setLastEntry(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getEntityCurrency = (entityCode) => {
    const entity = localEntities.find(e => e.entity_code === entityCode)
    return entity ? entity.currency : 'USD'
  }

  const calculateBalance = () => {
    const total = entries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)
    return {
      total: Math.abs(total),
      isBalanced: Math.abs(total) < 0.01,
      type: total > 0 ? 'debit' : 'credit'
    }
  }

  // Helper function to get account name
  const getAccountName = (accountCode) => {
    const account = accounts.find(acc => acc.account_code === accountCode)
    return account ? account.account_name : accountCode
  }

  const handleSaveEntry = async () => {
    if (!entryForm.entity_code || !entryForm.account_code || !entryForm.amount) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    try {
      const entryData = {
        entity_code: entryForm.entity_code,
        account_code: entryForm.account_code,
        amount: parseFloat(entryForm.amount),
        currency: entryForm.currency,
        counterparty: entryForm.counterparty,
        entry_category: entryForm.entry_category,
        custom_note: entryForm.entry_category === 'Custom' ? entryForm.custom_note : '',
        period: currentPeriod,
        year: currentYear
      }

      if (editingId) {
        // Update existing entry
        entryData.entry_id = editingId
        entryData.is_edit = true
        
        const response = await fetch('/api/process/entries', {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(entryData),
        })

        if (response.ok) {
          const result = await response.json()
          const updatedEntries = entries.map(entry => 
            entry.entry_id === editingId 
              ? { ...entry, ...entryData, entry_id: editingId }
              : entry
          )
          setEntries(updatedEntries)
          setLastEntry({ ...entryData, entry_id: editingId })
          setShowEditModal(false)
          setEditingId(null)
          
          // Reload data from SQL to ensure consistency
          await loadPeriodData()
          console.log('✅ Data reloaded from SQL after edit')
          
          showNotification('Entry updated successfully in SQL database!')
        } else {
          showNotification('Failed to update entry', 'error')
        }
      } else {
        // Add new entry
        const response = await fetch('/api/process/entries', {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(entryData),
        })

        if (response.ok) {
          const result = await response.json()
          const newEntry = {
            ...entryData,
            entry_id: result.entry_id,
            period: currentPeriod,
            year: currentYear
          }
          const updatedEntries = [...entries, newEntry]
          
          setEntries(updatedEntries)
          setLastEntry(newEntry)
          setShowAddModal(false)
          
          console.log('✅ New entry created:', newEntry)
          
          // Reload data from SQL to ensure consistency
          await loadPeriodData()
          console.log('✅ Data reloaded from SQL after add')
          
          showNotification('Entry added successfully to SQL database!')
        } else {
          const errorData = await response.json()
          console.error('❌ Failed to add entry:', errorData)
          showNotification(`Failed to add entry: ${errorData.detail || 'Unknown error'}`, 'error')
        }
      }

      // Reset form
      setEntryForm({
        entity_code: '',
        account_code: '',
        amount: '',
        currency: '',
        counterparty: '',
        entry_category: 'Manual Entry',
        custom_note: '',
        period: '',
        year: ''
      })
    } catch (error) {
      console.error('Error saving entry:', error)
      showNotification('Error saving entry. Please try again.', 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedEntry) return
    
    try {
      const response = await fetch(`/api/process/entries/${selectedEntry.entry_id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (response.ok) {
        const updatedEntries = entries.filter(entry => entry.entry_id !== selectedEntry.entry_id)
        setEntries(updatedEntries)
        setShowDeleteModal(false)
        setSelectedEntry(null)
        
        // Reload data from SQL to ensure consistency
        await loadPeriodData()
        
        showNotification('Entry deleted successfully from SQL!')
      } else {
        showNotification('Failed to delete entry', 'error')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      showNotification('Error deleting entry. Please try again.', 'error')
    }
  }

  const handleExport = () => {
    if (!currentPeriod || !currentYear) {
      showNotification('Please select period and year first', 'error')
      return
    }
    
    if (entries.length === 0) {
      showNotification('No entries to export', 'error')
      return
    }

    const filteredEntries = entries.filter(entry => {
      const matchesSearch = 
        (entry.entity_code && typeof entry.entity_code === 'string' && entry.entity_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.account_code && typeof entry.account_code === 'string' && entry.account_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.counterparty && typeof entry.counterparty === 'string' && entry.counterparty.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.entry_category && typeof entry.entry_category === 'string' && entry.entry_category.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'ic' && entry.counterparty && entry.counterparty.trim() !== '') ||
        (selectedStatus === 'non-ic' && (!entry.counterparty || entry.counterparty.trim() === ''))
      
      const matchesCategory = selectedCategory === 'all' || 
        (entry.entry_category && entry.entry_category === selectedCategory)
      
      return matchesSearch && matchesStatus && matchesCategory
    })

    if (filteredEntries.length === 0) {
      showNotification('No entries match the current filters', 'error')
      return
    }

    // Convert to CSV format
    const headers = ['Entry ID', 'Entity Code', 'Account Code', 'Amount', 'Currency', 'Counterparty', 'Entry Category', 'Custom Note', 'Period', 'Year']
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        entry.entry_id,
        `"${entry.entity_code}"`,
        entry.account_code,
        entry.amount,
        entry.currency,
        `"${entry.counterparty || ''}"`,
        entry.entry_category,
        `"${entry.custom_note || ''}"`,
        entry.period,
        entry.year
      ].join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `entries_${currentPeriod}_${currentYear}_filtered_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    showNotification(`Exported ${filteredEntries.length} filtered entries successfully!`)
  }


  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Company Selected</h3>
          <p className="text-gray-600">Please select a company from the dropdown to view and manage process entries.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access process management.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading process module...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">

      {/* Period and Year Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
            <select
              value={currentPeriod}
              onChange={(e) => setCurrentPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
            >
              <option value="">Select Period</option>
              {periods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
            >
              <option value="">Select Year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={() => loadPeriodData()}
              disabled={!currentPeriod || !currentYear || !isAuthenticated}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Load Data
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Entries</p>
              <p className="text-lg font-bold text-gray-900">{entries.length}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Amount</p>
              <p className="text-lg font-bold text-gray-900">
                ${entries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Entities</p>
              <p className="text-lg font-bold text-gray-900">
                {new Set(entries.map(entry => entry.entity_code)).size}
              </p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Status</p>
              <p className={`text-lg font-bold ${calculateBalance().isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                {calculateBalance().isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${calculateBalance().isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
              {calculateBalance().isBalanced ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Process Amounts</h3>
              <p className="text-sm text-gray-500">
                {currentPeriod && currentYear 
                  ? `${currentPeriod} ${currentYear} • Auto-saved to SQL` 
                  : 'Select period and year to view entries'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </button>
              <button onClick={handleExport} className="btn-secondary text-sm py-1 px-3">
                <Download className="h-3 w-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counterparty</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-3 text-center text-gray-500">
                    <div className="text-center py-4">
                      <Calendar className="text-3xl text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-500">
                        {currentPeriod && currentYear 
                          ? 'No entries found' 
                          : 'Select Period and Year'
                        }
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        {currentPeriod && currentYear 
                          ? `No entries found for ${currentPeriod} ${currentYear}` 
                          : 'Choose a period and year to view or manage entries'
                        }
                      </p>
                      {currentPeriod && currentYear && (
                        <button 
                          onClick={() => setShowAddModal(true)}
                          className="inline-block px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          Add First Entry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.entry_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {entry.entry_id}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6">
                          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Building2 className="h-3 w-3 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">{entry.entity_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {entry.account_code}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {entry.currency === 'EUR' ? '€' : 
                       entry.currency === 'GBP' ? '£' : 
                       entry.currency === 'CAD' ? 'C$' : 
                       entry.currency === 'AUD' ? 'A$' : 
                       entry.currency === 'JPY' ? '¥' : 
                       entry.currency === 'CHF' ? 'CHF' : 
                       entry.currency === 'SGD' ? 'S$' : '$'}
                      {parseFloat(entry.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {entry.currency}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {entry.counterparty || '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.entry_category === 'Intercompany' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        entry.entry_category === 'Adjustment' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        entry.entry_category === 'Opening Balance' ? 'bg-green-50 text-green-700 border border-green-200' :
                        entry.entry_category === 'Elimination' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {entry.entry_category || 'Manual Entry'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingId(entry.entry_id)
                            setSelectedEntry(entry)
                            setEntryForm({
                              entity_code: entry.entity_code,
                              account_code: entry.account_code,
                              amount: entry.amount,
                              currency: entry.currency,
                              counterparty: entry.counterparty || '',
                              entry_category: entry.entry_category || 'Manual Entry',
                              custom_note: entry.custom_note || '',
                              period: entry.period,
                              year: entry.year
                            })
                            setShowEditModal(true)
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                          title="Edit Entry"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedEntry(entry)
                            setShowDeleteModal(true)
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 className="h-3 w-3" />
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

      {/* Add/Edit Entry Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {showAddModal ? 'Add New Entry' : 'Edit Entry'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Entity</label>
                    <select
                      value={entryForm.entity_code}
                      onChange={(e) => {
                        const entity = e.target.value
                        setEntryForm({
                          ...entryForm,
                          entity_code: entity,
                          currency: getEntityCurrency(entity)
                        })
                      }}
                      className="form-select"
                      required
                    >
                      <option value="">Select Entity</option>
                      {localEntities.length > 0 ? (
                        localEntities.map((entity, index) => (
                          <option key={`${entity.entity_code}-${index}`} value={entity.entity_code}>
                            {entity.entity_code} - {entity.entity_name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No entities available</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">IFRS Account</label>
                    <select
                      value={entryForm.account_code}
                      onChange={(e) => setEntryForm({...entryForm, account_code: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="">Select Account</option>
                      {accounts.length > 0 ? (
                        accounts.map(account => (
                          <option key={account.account_code} value={account.account_code}>
                            {account.account_code} - {account.account_name || account.description || 'No Name'}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No accounts available</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={entryForm.amount}
                      onChange={(e) => setEntryForm({...entryForm, amount: e.target.value})}
                      className="form-input"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={entryForm.currency}
                      onChange={(e) => setEntryForm({...entryForm, currency: e.target.value})}
                      className="form-select"
                      required
                    >
                      {currencies.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Entry Category</label>
                    <select
                      value={entryForm.entry_category}
                      onChange={(e) => setEntryForm({...entryForm, entry_category: e.target.value})}
                      className="form-select"
                      required
                    >
                      {entryCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Counterparty (Optional)</label>
                    <input
                      type="text"
                      value={entryForm.counterparty}
                      onChange={(e) => setEntryForm({...entryForm, counterparty: e.target.value})}
                      className="form-input"
                      placeholder="Enter counterparty for intercompany transactions"
                    />
                  </div>
                  {entryForm.entry_category === 'Custom' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom Note</label>
                      <input
                        type="text"
                        value={entryForm.custom_note}
                        onChange={(e) => setEntryForm({...entryForm, custom_note: e.target.value})}
                        className="form-input"
                        placeholder="Enter custom note for this entry"
                        required
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setShowEditModal(false)
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEntry}
                    className="btn-primary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {showAddModal ? 'Add Entry' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Entry</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete entry <span className="font-semibold">{selectedEntry?.entry_id}</span>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' 
            ? 'bg-green-100 border-l-4 border-green-500 text-green-700' 
            : 'bg-red-100 border-l-4 border-red-500 text-red-700'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Process