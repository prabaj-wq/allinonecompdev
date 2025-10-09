import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
  Building,
  User,
  Database,
  Link,
  Unlink
} from 'lucide-react'
import { useCompany } from '../contexts/CompanyContext'
import { ConsolidationService } from '../services/consolidationService'

const ICTransactions = () => {
  const { selectedCompany, entities, ifrsAccounts, refreshCompanyData } = useCompany()
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTransaction] = useState(null)
  
  // Filters
  const [entityFilter, setEntityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    entity_id: '',
    counterparty_id: '',
    entity_account_id: '',
    counterparty_account_id: '',
    transaction_category: '',
    description: '',
    amount: '',
    debit_amount: '',
    credit_amount: '',
    currency: 'USD',
    transaction_date: '',
    period: '',
    year: ''
  })

  // Sync with Process module
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [currentEntity, setCurrentEntity] = useState('')
  const [currentCounterparty, setCurrentCounterparty] = useState('')

  // Load data when component mounts or company changes
  useEffect(() => {
    if (selectedCompany) {
      console.log('🏢 ICTransactions: Company selected, loading transactions...')
      loadTransactions()
      syncWithProcessModule()
    }
  }, [selectedCompany])

  // Debug: Log when CompanyContext data changes
  useEffect(() => {
    console.log('📊 ICTransactions: CompanyContext entities updated:', entities?.length || 0)
    console.log('📊 ICTransactions: CompanyContext accounts updated:', ifrsAccounts?.length || 0)
    console.log('🔍 ICTransactions: Full entities object:', entities)
    console.log('🔍 ICTransactions: Full ifrsAccounts object:', ifrsAccounts)
    console.log('🔍 ICTransactions: Selected company:', selectedCompany)
  }, [entities, ifrsAccounts, selectedCompany])

  // Force refresh when component mounts
  useEffect(() => {
    console.log('🚀 ICTransactions: Component mounted, forcing refresh...')
    if (refreshCompanyData) {
      refreshCompanyData()
    }
  }, [refreshCompanyData])

  // Sync with Process module every 5 seconds
  useEffect(() => {
    const interval = setInterval(syncWithProcessModule, 5000)
    return () => clearInterval(interval)
  }, [])

  const syncWithProcessModule = () => {
    const processPeriod = localStorage.getItem('currentPeriod')
    const processYear = localStorage.getItem('currentYear')
    const processEntity = localStorage.getItem('currentEntity')
    const processCounterparty = localStorage.getItem('currentCounterparty')
    
    if (processPeriod) setSelectedPeriod(processPeriod)
    if (processYear) setSelectedYear(processYear)
    if (processEntity) setCurrentEntity(processEntity)
    if (processCounterparty) setCurrentCounterparty(processCounterparty)
    
    // Auto-fill form if empty
    if (processEntity && !formData.entity_id) {
      setFormData(prev => ({ ...prev, entity_id: processEntity }))
    }
    if (processCounterparty && !formData.counterparty_id) {
      setFormData(prev => ({ ...prev, counterparty_id: processCounterparty }))
    }
    if (processPeriod && !formData.period) {
      setFormData(prev => ({ ...prev, period: processPeriod }))
    }
    if (processYear && !formData.year) {
      setFormData(prev => ({ ...prev, year: processYear }))
    }
  }

  const loadTransactions = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 ICTransactions: Loading transactions for company:', selectedCompany)
      
      // Only load transactions since entities and accounts come from CompanyContext
      const transactionsResponse = await fetch('/api/consolidation/enhanced-ic-transactions', { credentials: 'include' })
      
      let transactionsData = { transactions: [] }
      
      if (transactionsResponse.ok) {
        transactionsData = await transactionsResponse.json()
        console.log('📊 ICTransactions: Transactions loaded:', transactionsData)
      } else {
        console.warn('Failed to load transactions:', transactionsResponse.status)
      }
      
      setTransactions(transactionsData.transactions || [])
    } catch (error) {
      console.error('❌ ICTransactions: Error loading transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.entity_id || !formData.counterparty_id || !formData.entity_account_id || 
        !formData.counterparty_account_id || !formData.transaction_category || 
        (!formData.debit_amount && !formData.credit_amount)) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const url = editingTransaction 
        ? `/api/consolidation/enhanced-ic-transactions/${editingTransaction.id}`
        : '/api/consolidation/enhanced-ic-transactions'
      
      const method = editingTransaction ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadTransactions()
        setShowAddModal(false)
        setEditingTransaction(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
      alert('Error saving transaction')
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      entity_id: transaction.entity_id,
      counterparty_id: transaction.counterparty_id,
      entity_account_id: transaction.entity_account_id,
      counterparty_account_id: transaction.counterparty_account_id,
      transaction_category: transaction.transaction_category,
      description: transaction.description || '',
      amount: transaction.amount,
      debit_amount: transaction.debit_amount || '',
      credit_amount: transaction.credit_amount || '',
      currency: transaction.currency || 'USD',
      transaction_date: transaction.transaction_date,
      period: transaction.period,
      year: transaction.year
    })
    setShowAddModal(true)
  }

  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const response = await fetch(`/api/consolidation/enhanced-ic-transactions/${transactionId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
        if (response.ok) {
          await loadTransactions()
        }
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      entity_id: '',
      counterparty_id: '',
      entity_account_id: '',
      counterparty_account_id: '',
      transaction_category: '',
      description: '',
      amount: '',
      debit_amount: '',
      credit_amount: '',
      currency: 'USD',
      transaction_date: new Date().toISOString().split('T')[0],
      period: selectedPeriod,
      year: selectedYear
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'matched': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reconciled': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'matched': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'reconciled': return <Link className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (entityFilter && transaction.entity_id !== entityFilter && transaction.counterparty_id !== entityFilter) return false
    if (statusFilter && transaction.status !== statusFilter) return false
    if (periodFilter && transaction.period !== periodFilter) return false
    if (yearFilter && transaction.year !== yearFilter) return false
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase()
      return (
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.transaction_category?.toLowerCase().includes(searchLower) ||
        transaction.entity_id?.toLowerCase().includes(searchLower) ||
        transaction.counterparty_id?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">No company selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">IC Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage intercompany transactions with enhanced features
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add IC Transaction
          </button>
          <button
            onClick={loadTransactions}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Transactions
          </button>
          <button
            onClick={refreshCompanyData}
            className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Company Data
          </button>
          <button
            onClick={() => {
              console.log('🔍 Current entities from CompanyContext:', entities)
              console.log('🔍 Current accounts from CompanyContext:', ifrsAccounts)
              console.log('�� Current company:', selectedCompany)
              alert(`Entities loaded: ${entities?.length || 0}\nAccounts loaded: ${ifrsAccounts?.length || 0}\nCompany: ${selectedCompany || 'None'}`)
            }}
            className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
          >
            Debug Data
          </button>
        </div>
      </div>

      {/* Process Module Context Display */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="font-medium text-blue-800 dark:text-blue-200">Entity:</span>
              <span className="ml-2 text-blue-600 dark:text-blue-400">{currentEntity || 'Not Set'}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-blue-800 dark:text-blue-200">Counterparty:</span>
              <span className="ml-2 text-blue-600 dark:text-blue-400">{currentCounterparty || 'Not Set'}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-blue-800 dark:text-blue-200">Period:</span>
              <span className="ml-2 text-blue-600 dark:text-blue-400">{selectedPeriod || 'Not Set'}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-blue-800 dark:text-blue-200">Year:</span>
              <span className="ml-2 text-blue-600 dark:text-blue-400">{selectedYear || 'Not Set'}</span>
            </div>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Auto-sync every 5 seconds
          </div>
        </div>
      </div>

      {/* Data Loading Status */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="text-sm text-green-800 dark:text-green-200">
          <strong>Data Status:</strong> Entities: {entities?.length || 0} | Accounts: {ifrsAccounts?.length || 0} | 
          Company: {selectedCompany || 'None'} | Loading: {isLoading ? 'Yes' : 'No'}
        </div>
        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
          <strong>Source:</strong> CompanyContext data (same as Process.jsx)
        </div>
        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
          <strong>Entities:</strong> {entities?.map(e => e.entity_name || e.name).join(', ') || 'None'}
        </div>
        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
          <strong>Accounts:</strong> {ifrsAccounts?.map(a => `${a.account_code} - ${a.description || 'No Description'}`).join(', ') || 'None'}
        </div>
        <div className="text-xs text-red-600 dark:text-red-400 mt-2">
          <strong>DEBUG:</strong> Entities type: {typeof entities} | Is Array: {Array.isArray(entities)} | 
          Accounts type: {typeof ifrsAccounts} | Is Array: {Array.isArray(ifrsAccounts)}
        </div>
        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
          <strong>DEBUG:</strong> Entities keys: {entities ? Object.keys(entities).join(', ') : 'null'} | 
          Accounts keys: {ifrsAccounts ? Object.keys(ifrsAccounts).join(', ') : 'null'}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity</label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Entities</option>
              {entities.map(entity => (
                <option key={entity.entity_code || entity.id} value={entity.entity_code || entity.id}>
                  {entity.entity_name || entity.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="matched">Matched</option>
              <option value="reconciled">Reconciled</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Periods</option>
              <option value="January">January</option>
              <option value="February">February</option>
              <option value="March">March</option>
              <option value="April">April</option>
              <option value="May">May</option>
              <option value="June">June</option>
              <option value="July">July</option>
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Years</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            IC Transactions ({filteredTransactions.length})
          </h2>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading transactions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Counterparty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Credit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Period/Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.entity_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.counterparty_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {transaction.transaction_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.amount}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">{transaction.currency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${transaction.debit_amount ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                        {transaction.debit_amount || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${transaction.credit_amount ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                        {transaction.credit_amount || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {transaction.period} {transaction.year}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">{transaction.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit Transaction"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Transaction"
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
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingTransaction ? 'Edit IC Transaction' : 'Add New IC Transaction'}
            </h3>
            
            {/* Debug Info in Modal */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Modal Debug:</strong> Entities: {entities.length} | Accounts: {ifrsAccounts.length}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Entity IDs: {entities.map(e => e.entity_code || e.id).join(', ')}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Account Codes: {ifrsAccounts.map(a => a.account_code).join(', ')}
              </div>
            </div>
            

            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entity Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Entity <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.entity_id}
                    onChange={(e) => setFormData({...formData, entity_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Entity</option>
                    {entities.length > 0 ? (
                      entities.map(entity => (
                        <option key={entity.entity_code || entity.id} value={entity.entity_code || entity.id}>
                          {entity.entity_name || entity.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No entities available</option>
                    )}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    Available entities: {entities.length} | Current: {formData.entity_id}
                  </div>
                </div>

                {/* Counterparty Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Counterparty <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.counterparty_id}
                    onChange={(e) => setFormData({...formData, counterparty_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Counterparty</option>
                    {entities.map(entity => (
                      <option key={entity.entity_code || entity.id} value={entity.entity_code || entity.id}>
                        {entity.entity_name || entity.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Entity Account Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Entity Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.entity_account_id}
                    onChange={(e) => setFormData({...formData, entity_account_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Entity Account</option>
                    {ifrsAccounts.map(account => (
                      <option key={account.account_code || account.id} value={account.account_code || account.id}>
                        {account.account_code} - {account.description || account.account_name || 'No Description'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Counterparty Account Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Counterparty Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.counterparty_account_id}
                    onChange={(e) => setFormData({...formData, counterparty_account_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Counterparty Account</option>
                    {ifrsAccounts.map(account => (
                      <option key={account.account_code || account.id} value={account.account_code || account.id}>
                        {account.account_code} - {account.description || account.account_name || 'No Description'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transaction Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transaction Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.transaction_category}
                    onChange={(e) => setFormData({...formData, transaction_category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    <option value="receivable">Receivable</option>
                    <option value="payable">Payable</option>
                    <option value="loan">Loan</option>
                    <option value="dividend">Dividend</option>
                    <option value="service">Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>

                {/* Debit Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Debit Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.debit_amount}
                    onChange={(e) => setFormData({...formData, debit_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter debit amount"
                  />
                </div>

                {/* Credit Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Credit Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.credit_amount}
                    onChange={(e) => setFormData({...formData, credit_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter credit amount"
                  />
                </div>

                {/* Transaction Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({...formData, period: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Period</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Year</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              {/* Description - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                  placeholder="Enter transaction description"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingTransaction(null)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ICTransactions
