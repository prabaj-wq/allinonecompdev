import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  Upload,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  DollarSign,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'

const Accounts = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [newAccount, setNewAccount] = useState({
    code: '',
    name: '',
    type: 'asset',
    category: 'current',
    description: '',
    parentAccount: null,
    isActive: true
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data for accounts
      const mockAccounts = [
        {
          id: 1,
          code: '1000',
          name: 'Assets',
          type: 'asset',
          category: 'parent',
          description: 'Total assets of the company',
          parentAccount: null,
          isActive: true,
          balance: 2500000,
          previousBalance: 2300000,
          change: 200000,
          changePercent: 8.7
        },
        {
          id: 2,
          code: '1100',
          name: 'Current Assets',
          type: 'asset',
          category: 'current',
          description: 'Assets expected to be converted to cash within one year',
          parentAccount: 1,
          isActive: true,
          balance: 1200000,
          previousBalance: 1100000,
          change: 100000,
          changePercent: 9.1
        },
        {
          id: 3,
          code: '1110',
          name: 'Cash and Cash Equivalents',
          type: 'asset',
          category: 'current',
          description: 'Cash on hand and in bank accounts',
          parentAccount: 2,
          isActive: true,
          balance: 450000,
          previousBalance: 400000,
          change: 50000,
          changePercent: 12.5
        },
        {
          id: 4,
          code: '1120',
          name: 'Accounts Receivable',
          type: 'asset',
          category: 'current',
          description: 'Amounts owed by customers',
          parentAccount: 2,
          isActive: true,
          balance: 380000,
          previousBalance: 350000,
          change: 30000,
          changePercent: 8.6
        },
        {
          id: 5,
          code: '1130',
          name: 'Inventory',
          type: 'asset',
          category: 'current',
          description: 'Raw materials, work in progress, and finished goods',
          parentAccount: 2,
          isActive: true,
          balance: 320000,
          previousBalance: 300000,
          change: 20000,
          changePercent: 6.7
        },
        {
          id: 6,
          code: '1200',
          name: 'Non-Current Assets',
          type: 'asset',
          category: 'non-current',
          description: 'Long-term assets not expected to be converted to cash within one year',
          parentAccount: 1,
          isActive: true,
          balance: 1300000,
          previousBalance: 1200000,
          change: 100000,
          changePercent: 8.3
        },
        {
          id: 7,
          code: '1210',
          name: 'Property, Plant and Equipment',
          type: 'asset',
          category: 'non-current',
          description: 'Tangible long-term assets used in operations',
          parentAccount: 6,
          isActive: true,
          balance: 800000,
          previousBalance: 750000,
          change: 50000,
          changePercent: 6.7
        },
        {
          id: 8,
          code: '1220',
          name: 'Intangible Assets',
          type: 'asset',
          category: 'non-current',
          description: 'Non-physical assets with long-term value',
          parentAccount: 6,
          isActive: true,
          balance: 500000,
          previousBalance: 450000,
          change: 50000,
          changePercent: 11.1
        },
        {
          id: 9,
          code: '2000',
          name: 'Liabilities',
          type: 'liability',
          category: 'parent',
          description: 'Total liabilities of the company',
          parentAccount: null,
          isActive: true,
          balance: 800000,
          previousBalance: 750000,
          change: 50000,
          changePercent: 6.7
        },
        {
          id: 10,
          code: '2100',
          name: 'Current Liabilities',
          type: 'liability',
          category: 'current',
          description: 'Obligations due within one year',
          parentAccount: 9,
          isActive: true,
          balance: 450000,
          previousBalance: 420000,
          change: 30000,
          changePercent: 7.1
        },
        {
          id: 11,
          code: '3000',
          name: 'Equity',
          type: 'equity',
          category: 'parent',
          description: 'Shareholders equity and retained earnings',
          parentAccount: null,
          isActive: true,
          balance: 1700000,
          previousBalance: 1550000,
          change: 150000,
          changePercent: 9.7
        },
        {
          id: 12,
          code: '4000',
          name: 'Revenue',
          type: 'revenue',
          category: 'income',
          description: 'Income from business operations',
          parentAccount: null,
          isActive: true,
          balance: 4500000,
          previousBalance: 4200000,
          change: 300000,
          changePercent: 7.1
        },
        {
          id: 13,
          code: '5000',
          name: 'Expenses',
          type: 'expense',
          category: 'cost',
          description: 'Costs incurred in business operations',
          parentAccount: null,
          isActive: true,
          balance: 3200000,
          previousBalance: 3000000,
          change: 200000,
          changePercent: 6.7
        }
      ]
      setAccounts(mockAccounts)
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAccount = async () => {
    if (!newAccount.code || !newAccount.name || !newAccount.type) return
    
    try {
      const account = {
        id: Date.now(),
        ...newAccount,
        balance: 0,
        previousBalance: 0,
        change: 0,
        changePercent: 0
      }
      
      setAccounts([...accounts, account])
      setNewAccount({ code: '', name: '', type: 'asset', category: 'current', description: '', parentAccount: null, isActive: true })
      setShowAddAccount(false)
    } catch (error) {
      console.error('Error adding account:', error)
    }
  }

  const handleDeleteAccount = (id) => {
    setAccounts(accounts.filter(account => account.id !== id))
  }

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || account.type === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'asset': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'liability': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'equity': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'revenue': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'expense': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'asset': return <TrendingUp className="h-4 w-4" />
      case 'liability': return <TrendingDown className="h-4 w-4" />
      case 'equity': return <BarChart3 className="h-4 w-4" />
      case 'revenue': return <DollarSign className="h-4 w-4" />
      case 'expense': return <DollarSign className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getChangeColor = (change) => {
    return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
  }

  const getChangeIcon = (change) => {
    return change > 0 ? <TrendingUp className="h-4 w-4" /> : change < 0 ? <TrendingDown className="h-4 w-4" /> : null
  }

  const getIndentation = (account) => {
    if (!account.parentAccount) return 0
    const parent = accounts.find(a => a.id === account.parentAccount)
    if (!parent) return 0
    return getIndentation(parent) + 1
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Chart of accounts and account hierarchy</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
        </div>
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0))}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Liabilities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0))}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Equity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(accounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + a.balance, 0))}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0))}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0))}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="asset">Assets</option>
              <option value="liability">Liabilities</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expenses</option>
            </select>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chart of Accounts</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredAccounts.length} of {accounts.length} accounts
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Sort by:</span>
              <select className="border-0 bg-transparent focus:ring-0 text-gray-700 dark:text-gray-300">
                <option>Code</option>
                <option>Name</option>
                <option>Type</option>
                <option>Balance</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-2">
            {filteredAccounts.map((account) => (
              <div 
                key={account.id} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                style={{ marginLeft: `${getIndentation(account) * 24}px` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{account.code}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAccountTypeColor(account.type)}`}>
                        {getAccountTypeIcon(account.type)}
                        <span className="ml-1">{account.type}</span>
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{account.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{account.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(account.balance)}
                    </div>
                    <div className="flex items-center text-sm">
                      {getChangeIcon(account.change)}
                      <span className={`ml-1 ${getChangeColor(account.change)}`}>
                        {account.change > 0 ? '+' : ''}{formatCurrency(account.change)}
                      </span>
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        ({account.changePercent > 0 ? '+' : ''}{account.changePercent}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedAccount(account)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAccount(account.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Account</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Code</label>
                <input
                  type="text"
                  value={newAccount.code}
                  onChange={(e) => setNewAccount({...newAccount, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter account code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter account name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({...newAccount, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={newAccount.category}
                  onChange={(e) => setNewAccount({...newAccount, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="current">Current</option>
                  <option value="non-current">Non-Current</option>
                  <option value="parent">Parent Account</option>
                  <option value="income">Income</option>
                  <option value="cost">Cost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Account</label>
                <select
                  value={newAccount.parentAccount || ''}
                  onChange={(e) => setNewAccount({...newAccount, parentAccount: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">No Parent</option>
                  {accounts.filter(a => a.category === 'parent').map(account => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newAccount.description}
                  onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                  placeholder="Enter account description"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddAccount}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Account
              </button>
              <button
                onClick={() => setShowAddAccount(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Detail Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedAccount.name}</h3>
              <button
                onClick={() => setSelectedAccount(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Account Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Code:</span>
                    <span className="ml-2 font-medium">{selectedAccount.code}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="ml-2 font-medium">{selectedAccount.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="ml-2 font-medium">{selectedAccount.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="ml-2 font-medium">{selectedAccount.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedAccount.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Financial Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Current Balance:</span>
                    <span className="ml-2 font-bold text-lg">{formatCurrency(selectedAccount.balance)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Previous Balance:</span>
                    <span className="ml-2 font-medium">{formatCurrency(selectedAccount.previousBalance)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Change:</span>
                    <span className={`ml-2 font-medium ${getChangeColor(selectedAccount.change)}`}>
                      {selectedAccount.change > 0 ? '+' : ''}{formatCurrency(selectedAccount.change)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Change %:</span>
                    <span className={`ml-2 font-medium ${getChangeColor(selectedAccount.changePercent)}`}>
                      {selectedAccount.changePercent > 0 ? '+' : ''}{selectedAccount.changePercent}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Edit className="h-4 w-4 mr-2 inline" />
                  Edit Account
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                  <Eye className="h-4 w-4 mr-2 inline" />
                  View Transactions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Accounts
