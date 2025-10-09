import React, { useState, useEffect, useCallback } from 'react'
import { 
  BarChart3, 
  Download, 
  RefreshCw, 
  Eye, 
  Filter, 
  Search, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter as FilterIcon,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  Info,
  Clock,
  Users,
  Activity
} from 'lucide-react'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'

const TrialBalance = () => {
  const { selectedCompany } = useCompany()
  const { isAuthenticated } = useAuth()
  
  // State management
  const [trialBalance, setTrialBalance] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [groupedView, setGroupedView] = useState(true)
  const [sortBy, setSortBy] = useState('account_code')
  const [sortOrder, setSortOrder] = useState('asc')
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [showManagementAlert, setShowManagementAlert] = useState(false)
  const [generatePeriod, setGeneratePeriod] = useState('')
  const [generateYear, setGenerateYear] = useState('')

  // Available periods and years
  const periods = [
    'Q1', 'Q2', 'Q3', 'Q4',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const years = ['2025', '2024', '2023', '2022']
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  // Account categories for filtering
  const accountCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Asset', label: 'Assets' },
    { value: 'Liability', label: 'Liabilities' },
    { value: 'Equity', label: 'Equity' },
    { value: 'Income', label: 'Income' },
    { value: 'Expense', label: 'Expenses' }
  ]

  // Core functions
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000)
  }, [])

  const loadTrialBalance = useCallback(async () => {
    if (!selectedPeriod || !selectedYear) {
      showNotification('Please select both period and year', 'warning')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/trial-balance/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          period: selectedPeriod,
          year: selectedYear,
          company_name: selectedCompany
        })
      })

      if (!response.ok) {
        throw new Error('Failed to load trial balance')
      }

      const data = await response.json()
      setTrialBalance(data.trial_balance || [])
      
      if (data.trial_balance && data.trial_balance.length > 0) {
        showNotification('Trial balance loaded successfully', 'success')
      } else {
        showNotification('No trial balance data found for the selected period', 'warning')
      }
    } catch (error) {
      console.error('Error loading trial balance:', error)
      showNotification('Error loading trial balance data', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [selectedPeriod, selectedYear, selectedCompany, showNotification])

  useEffect(() => {
    if (selectedCompany && selectedPeriod && selectedYear) {
      loadTrialBalance()
    }
  }, [selectedCompany, selectedPeriod, selectedYear, loadTrialBalance])

  // Calculate totals
  const totalDebits = trialBalance.reduce((sum, item) => sum + (item.debit_amount || 0), 0)
  const totalCredits = trialBalance.reduce((sum, item) => sum + (item.credit_amount || 0), 0)
  const totalBalance = totalDebits - totalCredits
  const isBalanced = Math.abs(totalBalance) < 0.01
  const difference = Math.abs(totalBalance)

  const handleGenerateTrialBalance = useCallback(() => {
    if (!generatePeriod || !generateYear) {
      showNotification('Please select both period and year before generating', 'warning')
      return
    }
    
    // Update the selected period and year for display
    setSelectedPeriod(generatePeriod)
    setSelectedYear(generateYear)
  }, [generatePeriod, generateYear, showNotification])

  // Data processing functions
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ChevronDown className="h-4 w-4 opacity-50" />
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  // Filter and sort data
  const filteredData = trialBalance
    .filter(item => {
      const matchesSearch = !searchTerm || 
        item.account_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || 
        item.ifrs_category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'account_code':
          aValue = a.account_code || ''
          bValue = b.account_code || ''
          break
        case 'account_name':
          aValue = a.account_name || ''
          bValue = b.account_name || ''
          break
        case 'debit_amount':
          aValue = a.debit_amount || 0
          bValue = b.debit_amount || 0
          break
        case 'credit_amount':
          aValue = a.credit_amount || 0
          bValue = b.credit_amount || 0
          break
        case 'balance':
          aValue = (a.debit_amount || 0) - (a.credit_amount || 0)
          bValue = (b.debit_amount || 0) - (b.credit_amount || 0)
          break
        default:
          aValue = a.account_code || ''
          bValue = b.account_code || ''
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
    })

  // Group data by category
  const groupedData = groupedView ? 
    filteredData.reduce((groups, item) => {
      const category = item.ifrs_category || 'Uncategorized'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
      return groups
    }, {}) : { 'All Accounts': filteredData }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="relative">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Calculating trial balance...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Please wait while we process your data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Trial Balance
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {selectedPeriod && selectedYear ? 
                  `Account balances for ${selectedPeriod} ${selectedYear}` : 
                  'Select period and year to view trial balance'
                }
              </p>
        </div>
        <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
              <button
                onClick={handleGenerateTrialBalance}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Generate TB
              </button>
              <button
                onClick={() => showNotification('Export feature coming soon', 'info')}
                disabled={trialBalance.length === 0}
                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  trialBalance.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>
        </div>

        {/* Generation Controls */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generate Trial Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Period for Generation
              </label>
              <select
                value={generatePeriod}
                onChange={(e) => setGeneratePeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Period</option>
                {periods.map(period => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year for Generation
              </label>
              <select
                value={generateYear}
                onChange={(e) => setGenerateYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateTrialBalance}
                disabled={!generatePeriod || !generateYear}
                className={`w-full px-4 py-2 rounded-lg transition-all duration-200 ${
                  !generatePeriod || !generateYear
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                }`}
              >
                <Calculator className="h-4 w-4 mr-2 inline" />
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Period
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Period</option>
                  {periods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Month</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {accountCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={groupedView}
                  onChange={(e) => setGroupedView(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Group by Category</span>
              </label>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Debits</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${totalDebits.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
          </div>
        </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Credits</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${totalCredits.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
          </div>
        </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Balance</p>
                <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalBalance.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                <div className="flex items-center mt-1">
                  {isBalanced ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      <span className="text-green-600 font-semibold text-lg">Balanced</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                      <span className="text-red-600 font-semibold text-lg">Unbalanced</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
          </div>
        </div>
      </div>

        {/* Management Alert for Unbalanced Trial Balance */}
        {!isBalanced && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Trial Balance Unbalanced
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  The trial balance shows a difference of <strong>${difference.toLocaleString()}</strong> between total debits and credits. 
                  This requires management attention to identify and correct the discrepancy.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowManagementAlert(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Report to Management
                  </button>
                  <button
                    onClick={() => setShowManagementAlert(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trial Balance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Trial Balance Details</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {filteredData.length} accounts • {selectedPeriod} {selectedYear}
                </p>
              </div>
              {!isBalanced && (
                <div className="flex items-center text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Difference: ${difference.toLocaleString()}</span>
                </div>
              )}
            </div>
        </div>
          
        <div className="p-6">
            {Object.entries(groupedData).map(([category, accounts]) => (
              <div key={category} className="mb-8 last:mb-0">
                {groupedView && (
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                      {category}
                    </h3>
                    <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                )}
                
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort('account_code')}
                        >
                          <div className="flex items-center">
                            Account Code
                            <SortIcon column="account_code" />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort('account_name')}
                        >
                          <div className="flex items-center">
                            Account Name
                            <SortIcon column="account_name" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Description
                        </th>
                        <th 
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort('debit_amount')}
                        >
                          <div className="flex items-center justify-end">
                            Debit
                            <SortIcon column="debit_amount" />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort('credit_amount')}
                        >
                          <div className="flex items-center justify-end">
                            Credit
                            <SortIcon column="credit_amount" />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort('balance')}
                        >
                          <div className="flex items-center justify-end">
                            Balance
                            <SortIcon column="balance" />
                          </div>
                        </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {accounts.map((item, index) => {
                        const balance = (item.debit_amount || 0) - (item.credit_amount || 0)
                        return (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {item.account_code}
                    </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.account_name}
                    </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                              {item.description || '-'}
                    </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white font-medium">
                              {item.debit_amount > 0 ? `$${item.debit_amount.toLocaleString()}` : '-'}
                    </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white font-medium">
                              {item.credit_amount > 0 ? `$${item.credit_amount.toLocaleString()}` : '-'}
                  </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                              <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ${balance.toLocaleString()}
                              </span>
                  </td>
                </tr>
                        )
                      })}
                    </tbody>
            </table>
          </div>
                
                {/* Category Totals */}
                {groupedView && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Category Debits: </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          ${accounts.reduce((sum, item) => sum + (item.debit_amount || 0), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Category Credits: </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          ${accounts.reduce((sum, item) => sum + (item.credit_amount || 0), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Category Balance: </span>
                        <span className={`font-bold ${accounts.reduce((sum, item) => sum + (item.debit_amount || 0) - (item.credit_amount || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${accounts.reduce((sum, item) => sum + (item.debit_amount || 0) - (item.credit_amount || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Grand Totals */}
            <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 text-center">
                Trial Balance Totals
              </h3>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">Total Debits</span>
                  <p className="font-bold text-blue-900 dark:text-blue-100 text-2xl mt-1">
                    ${totalDebits.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">Total Credits</span>
                  <p className="font-bold text-blue-900 dark:text-blue-100 text-2xl mt-1">
                    ${totalCredits.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">Net Balance</span>
                  <p className={`font-bold text-2xl mt-1 ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${totalBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Difference Display */}
              {!isBalanced && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                  <div className="text-center">
                    <p className="text-red-800 dark:text-red-200 font-semibold">
                      ⚠️ Trial Balance Difference: ${difference.toLocaleString()}
                    </p>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                      Management attention required to identify and correct this discrepancy.
                    </p>
                  </div>
                </div>
              )}
        </div>
          </div>
        </div>

        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-yellow-500 text-white'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
              {notification.type === 'error' && <AlertTriangle className="h-5 w-5 mr-2" />}
              {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 mr-2" />}
              <span className="flex-1">{notification.message}</span>
              <button
                onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                className="ml-4 hover:opacity-75"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrialBalance
