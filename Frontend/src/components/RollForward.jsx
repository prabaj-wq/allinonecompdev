import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  FileCheck,
  FileX,
  History,
  Zap,
  Calculator,
  Filter,
  Search
} from 'lucide-react'

const RollForward = ({ 
  entities, 
  ifrsAccounts, 
  selectedPeriod, 
  selectedYear,
  onNotification 
}) => {
  const [rollforwardData, setRollforwardData] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [filters, setFilters] = useState({
    entity: '',
    account: '',
    status: '',
    period: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [newRollforward, setNewRollforward] = useState({
    entity_id: '',
    account_id: '',
    previous_period: '',
    previous_year: '',
    opening_balance: '',
    movements: '',
    adjustments: '',
    eliminations: '',
    closing_balance: '',
    status: 'draft',
    notes: '',
    effective_date: new Date().toISOString().split('T')[0]
  })

  // Sample data structure for demonstration
  const sampleRollforwardData = [
    {
      id: 1,
      entity_name: 'Sample Corp Ltd',
      account_name: 'Cash and Cash Equivalents',
      account_code: '1000',
      previous_period: 'September',
      previous_year: '2024',
      opening_balance: 1500000,
      movements: 250000,
      adjustments: -50000,
      eliminations: 0,
      closing_balance: 1700000,
      status: 'finalized',
      notes: 'Opening balance carried forward from Q3',
      effective_date: '2024-10-01'
    },
    {
      id: 2,
      entity_name: 'Sample Corp Ltd',
      account_name: 'Accounts Receivable',
      account_code: '1100',
      previous_period: 'September',
      previous_year: '2024',
      opening_balance: 850000,
      movements: 125000,
      adjustments: 0,
      eliminations: -75000,
      closing_balance: 900000,
      status: 'draft',
      notes: 'Intercompany eliminations applied',
      effective_date: '2024-10-01'
    }
  ]

  useEffect(() => {
    // Load sample data for now
    setRollforwardData(sampleRollforwardData)
  }, [])

  const handleAddRollforward = () => {
    if (!newRollforward.entity_id || !newRollforward.account_id) {
      onNotification('Please select both entity and account', 'error')
      return
    }

    const newItem = {
      id: Date.now(),
      ...newRollforward,
      entity_name: entities.find(e => e.id === newRollforward.entity_id)?.name || '',
      account_name: ifrsAccounts.find(a => a.id === newRollforward.account_id)?.name || '',
      account_code: ifrsAccounts.find(a => a.id === newRollforward.account_id)?.account_code || ''
    }

    setRollforwardData(prev => [...prev, newItem])
    setNewRollforward({
      entity_id: '',
      account_id: '',
      previous_period: '',
      previous_year: '',
      opening_balance: '',
      movements: '',
      adjustments: '',
      eliminations: '',
      closing_balance: '',
      status: 'draft',
      notes: '',
      effective_date: new Date().toISOString().split('T')[0]
    })
    setShowAddModal(false)
    onNotification('Roll forward entry added successfully', 'success')
  }

  const handleEditRollforward = (item) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  const handleUpdateRollforward = () => {
    if (!editingItem) return

    setRollforwardData(prev => 
      prev.map(item => 
        item.id === editingItem.id ? editingItem : item
      )
    )
    setShowEditModal(false)
    setEditingItem(null)
    onNotification('Roll forward entry updated successfully', 'success')
  }

  const handleDeleteRollforward = (id) => {
    if (window.confirm('Are you sure you want to delete this roll forward entry?')) {
      setRollforwardData(prev => prev.filter(item => item.id !== id))
      onNotification('Roll forward entry deleted successfully', 'success')
    }
  }

  const handleStatusChange = (id, newStatus) => {
    setRollforwardData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      )
    )
    onNotification(`Status changed to ${newStatus}`, 'success')
  }

  const filteredData = rollforwardData.filter(item => {
    const matchesEntity = !filters.entity || item.entity_name.toLowerCase().includes(filters.entity.toLowerCase())
    const matchesAccount = !filters.account || item.account_name.toLowerCase().includes(filters.account.toLowerCase())
    const matchesStatus = !filters.status || item.status === filters.status
    const matchesSearch = !searchTerm || 
      item.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.account_code.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesEntity && matchesAccount && matchesStatus && matchesSearch
  })

  const exportToCSV = () => {
    const csvContent = [
      ['Entity', 'Account Code', 'Account Name', 'Previous Period', 'Previous Year', 'Opening Balance', 'Movements', 'Adjustments', 'Eliminations', 'Closing Balance', 'Status', 'Notes'],
      ...filteredData.map(item => [
        item.entity_name,
        item.account_code,
        item.account_name,
        item.previous_period,
        item.previous_year,
        item.opening_balance,
        item.movements,
        item.adjustments,
        item.eliminations,
        item.closing_balance,
        item.status,
        item.notes
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rollforward_${selectedPeriod}_${selectedYear}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'finalized': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Roll Forward Management</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage balance carry-forward and period-to-period tracking</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Roll Forward
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Accounts</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{rollforwardData.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Finalized</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {rollforwardData.filter(item => item.status === 'finalized').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">In Review</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {rollforwardData.filter(item => item.status === 'review').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Square className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {rollforwardData.filter(item => item.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entity</label>
            <select
              value={filters.entity}
              onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Entities</option>
              {entities.map(entity => (
                <option key={entity.id} value={entity.name}>{entity.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account</label>
            <select
              value={filters.account}
              onChange={(e) => setFilters(prev => ({ ...prev, account: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Accounts</option>
              {ifrsAccounts.map(account => (
                <option key={account.id} value={account.name}>{account.account_code} - {account.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="finalized">Finalized</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Period</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Periods</option>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Roll Forward Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Previous Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Opening Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Movements</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Adjustments</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Eliminations</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Closing Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {item.entity_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="font-medium">{item.account_code}</div>
                      <div className="text-gray-500 dark:text-gray-400">{item.account_name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.previous_period} {item.previous_year}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.opening_balance)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.movements)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.adjustments)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.eliminations)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.closing_balance)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(item.status)}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Review</option>
                      <option value="finalized">Finalized</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditRollforward(item)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRollforward(item.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Roll Forward Entry</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entity</label>
                <select
                  value={newRollforward.entity_id}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, entity_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Entity</option>
                  {entities.map(entity => (
                    <option key={entity.id} value={entity.id}>{entity.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account</label>
                <select
                  value={newRollforward.account_id}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, account_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Account</option>
                  {ifrsAccounts.map(account => (
                    <option key={account.id} value={account.id}>{account.account_code} - {account.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Previous Period</label>
                <select
                  value={newRollforward.previous_period}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, previous_period: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Period</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Previous Year</label>
                <input
                  type="text"
                  value={newRollforward.previous_year}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, previous_year: e.target.value }))}
                  placeholder="2024"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRollforward.opening_balance}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, opening_balance: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Movements</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRollforward.movements}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, movements: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adjustments</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRollforward.adjustments}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, adjustments: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eliminations</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRollforward.eliminations}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, eliminations: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Effective Date</label>
                <input
                  type="date"
                  value={newRollforward.effective_date}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, effective_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                value={newRollforward.notes}
                onChange={(e) => setNewRollforward(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRollforward}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Roll Forward Entry</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entity</label>
                <input
                  type="text"
                  value={editingItem.entity_name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account</label>
                <input
                  type="text"
                  value={`${editingItem.account_code} - ${editingItem.account_name}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.opening_balance}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, opening_balance: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Movements</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.movements}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, movements: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adjustments</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.adjustments}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, adjustments: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eliminations</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.eliminations}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, eliminations: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={editingItem.status}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="finalized">Finalized</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                value={editingItem.notes}
                onChange={(e) => setEditingItem(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRollforward}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RollForward
