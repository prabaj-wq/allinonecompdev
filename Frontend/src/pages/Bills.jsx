import React, { useState, useEffect } from 'react'
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  Building,
  User,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Save,
  RefreshCw,
  CreditCard,
  Banknote,
  Wallet,
  Calculator
} from 'lucide-react'

const Bills = () => {
  const [selectedCompany, setSelectedCompany] = useState('Sample Corp Ltd')
  const [selectedPeriod, setSelectedPeriod] = useState('2025')
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [showNewBillModal, setShowNewBillModal] = useState(false)
  
  // Bills data
  const [bills, setBills] = useState([
    {
      id: 1,
      billNumber: 'BILL-2025-001',
      vendor: 'Office Supplies Co.',
      category: 'Office Supplies',
      description: 'Monthly office supplies and stationery',
      amount: 1250.00,
      currency: 'USD',
      billDate: '2025-01-15',
      dueDate: '2025-02-15',
      status: 'pending',
      paymentMethod: 'bank_transfer',
      assignedTo: 'John Smith',
      approvalStatus: 'approved',
      notes: 'Regular monthly supplies',
      attachments: ['invoice.pdf', 'receipt.pdf'],
      lastUpdated: '2025-01-15 10:30:00'
    },
    {
      id: 2,
      billNumber: 'BILL-2025-002',
      vendor: 'IT Services Ltd.',
      category: 'IT Services',
      description: 'Software licensing and maintenance',
      amount: 5000.00,
      currency: 'USD',
      billDate: '2025-01-20',
      dueDate: '2025-02-20',
      status: 'paid',
      paymentMethod: 'credit_card',
      assignedTo: 'Sarah Johnson',
      approvalStatus: 'approved',
      notes: 'Annual software renewal',
      attachments: ['license.pdf', 'invoice.pdf'],
      lastUpdated: '2025-01-20 14:45:00'
    },
    {
      id: 3,
      billNumber: 'BILL-2025-003',
      vendor: 'Utilities Corp.',
      category: 'Utilities',
      description: 'Electricity and water services',
      amount: 850.00,
      currency: 'USD',
      billDate: '2025-01-25',
      dueDate: '2025-02-25',
      status: 'overdue',
      paymentMethod: 'bank_transfer',
      assignedTo: 'Mike Wilson',
      approvalStatus: 'pending',
      notes: 'Utility services for January',
      attachments: ['utility_bill.pdf'],
      lastUpdated: '2025-01-25 09:15:00'
    },
    {
      id: 4,
      billNumber: 'BILL-2025-004',
      vendor: 'Marketing Agency',
      category: 'Marketing',
      description: 'Digital marketing campaign',
      amount: 3000.00,
      currency: 'USD',
      billDate: '2025-01-30',
      dueDate: '2025-03-01',
      status: 'pending',
      paymentMethod: 'bank_transfer',
      assignedTo: 'Lisa Brown',
      approvalStatus: 'approved',
      notes: 'Q1 marketing campaign',
      attachments: ['campaign_brief.pdf', 'invoice.pdf'],
      lastUpdated: '2025-01-30 16:20:00'
    }
  ])

  // Bill categories
  const [categories] = useState([
    'Office Supplies', 'IT Services', 'Utilities', 'Marketing', 'Travel', 'Legal', 'Consulting', 'Insurance', 'Rent', 'Other'
  ])

  // Payment methods
  const [paymentMethods] = useState([
    'bank_transfer', 'credit_card', 'check', 'cash', 'paypal', 'wire_transfer'
  ])

  // Approval statuses
  const [approvalStatuses] = useState([
    'pending', 'approved', 'rejected', 'under_review'
  ])

  const companies = [
    'Sample Corp Ltd', 'FinFusion360', 'Kayal', 'Backo', 'Tech Solutions Inc'
  ]

  const periods = ['2023', '2024', '2025', '2026']
  const statuses = ['all', 'pending', 'paid', 'overdue', 'cancelled']
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']

  useEffect(() => {
    loadBillsData()
  }, [selectedCompany, selectedPeriod])

  const loadBillsData = async () => {
    try {
      setIsLoading(true)
      console.log(`Loading bills data for ${selectedCompany} - ${selectedPeriod}`)
      // In real implementation, this would call the API
      setTimeout(() => {
        console.log('Bills data loaded successfully')
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error loading bills data:', error)
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getApprovalColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'under_review':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'bank_transfer':
        return <Banknote className="w-4 h-4" />
      case 'credit_card':
        return <CreditCard className="w-4 h-4" />
      case 'check':
        return <FileText className="w-4 h-4" />
      case 'cash':
        return <Wallet className="w-4 h-4" />
      case 'paypal':
        return <CreditCard className="w-4 h-4" />
      case 'wire_transfer':
        return <Banknote className="w-4 h-4" />
      default:
        return <DollarSign className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      'paid': 'Paid',
      'pending': 'Pending',
      'overdue': 'Overdue',
      'cancelled': 'Cancelled'
    }
    return labels[status] || status
  }

  const getApprovalLabel = (status) => {
    const labels = {
      'approved': 'Approved',
      'pending': 'Pending',
      'rejected': 'Rejected',
      'under_review': 'Under Review'
    }
    return labels[status] || status
  }

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'bank_transfer': 'Bank Transfer',
      'credit_card': 'Credit Card',
      'check': 'Check',
      'cash': 'Cash',
      'paypal': 'PayPal',
      'wire_transfer': 'Wire Transfer'
    }
    return labels[method] || method
  }

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || bill.status === filterStatus
    const matchesCategory = filterCategory === 'all' || bill.category === filterCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const paidAmount = bills.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + bill.amount, 0)
  const pendingAmount = bills.filter(bill => bill.status === 'pending').reduce((sum, bill) => sum + bill.amount, 0)
  const overdueAmount = bills.filter(bill => bill.status === 'overdue').reduce((sum, bill) => sum + bill.amount, 0)

  const handleDeleteBill = (billId) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      setBills(bills.filter(bill => bill.id !== billId))
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-3">Bills Management</h1>
            <p className="text-green-100 text-xl max-w-2xl">
              Comprehensive bill tracking, approval workflows, and payment management
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <Receipt className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Company and Period Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {periods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end space-x-3">
            <button
              onClick={loadBillsData}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </button>
            <button 
              onClick={() => setShowNewBillModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Bill
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Bills</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                ${totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Paid</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                ${paidAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                ${pendingAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-yellow-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Overdue</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                ${overdueAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-500 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search bills, vendors, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : getStatusLabel(status)}
                </option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <button className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'bills', label: 'Bills', icon: Receipt },
              { id: 'analytics', label: 'Analytics', icon: PieChart },
              { id: 'reports', label: 'Reports', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Bills Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Status Distribution</h4>
                  <div className="space-y-3">
                    {['paid', 'pending', 'overdue', 'cancelled'].map(status => {
                      const count = bills.filter(b => b.status === status).length
                      const percentage = bills.length > 0 ? (count / bills.length) * 100 : 0
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {getStatusLabel(status)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  status === 'paid' ? 'bg-green-500' :
                                  status === 'pending' ? 'bg-yellow-500' :
                                  status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                              {count}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Category Distribution</h4>
                  <div className="space-y-3">
                    {categories.slice(0, 5).map(category => {
                      const count = bills.filter(b => b.category === category).length
                      const percentage = bills.length > 0 ? (count / bills.length) * 100 : 0
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {category}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                              {count}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Recent Bills</h4>
                <div className="space-y-3">
                  {bills
                    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
                    .slice(0, 5)
                    .map(bill => (
                      <div key={bill.id} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {bill.billNumber} - {bill.vendor} - ${bill.amount}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(bill.lastUpdated).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Bills Tab */}
          {activeTab === 'bills' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">All Bills</h3>
                <div className="flex space-x-2">
                  <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredBills.map((bill) => (
                  <div key={bill.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Receipt className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{bill.billNumber}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {bill.vendor} • {bill.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(bill.status)}`}>
                          {getStatusLabel(bill.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getApprovalColor(bill.approvalStatus)}`}>
                          {getApprovalLabel(bill.approvalStatus)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ${bill.amount.toLocaleString()} {bill.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bill Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{bill.billDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{bill.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Payment Method</p>
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(bill.paymentMethod)}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {getPaymentMethodLabel(bill.paymentMethod)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</p>
                      <p className="text-sm text-gray-900 dark:text-white">{bill.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assigned To</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{bill.assignedTo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                        <p className="text-sm text-gray-900 dark:text-white">{bill.notes}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Attachments</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {bill.attachments.length} file(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 px-3 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors duration-200">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteBill(bill.id)}
                        className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Bills Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Monthly Trend</h4>
                  <div className="h-64 flex items-end justify-center space-x-2">
                    {[65, 78, 90, 85, 92, 88, 95, 87, 93, 89, 96, 91].map((value, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-8 bg-green-500 rounded-t"
                          style={{ height: `${value}%` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Category Breakdown</h4>
                  <div className="space-y-3">
                    {categories.slice(0, 6).map((category, index) => {
                      const amount = bills.filter(b => b.category === category).reduce((sum, b) => sum + b.amount, 0)
                      const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {category}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                              ${amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Bills Reports</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Payment Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Bills</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Paid</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${paidAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Outstanding</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${(totalAmount - paidAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Vendor Analysis</h4>
                  <div className="space-y-3">
                    {bills
                      .reduce((acc, bill) => {
                        acc[bill.vendor] = (acc[bill.vendor] || 0) + bill.amount
                        return acc
                      }, {})
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([vendor, amount]) => (
                        <div key={vendor} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-24">
                            {vendor}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </button>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
                      <Calculator className="w-4 h-4 mr-2" />
                      Generate Summary
                    </button>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Bills
