import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  Database,
  Banknote,
  CreditCard,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

const BankReconciliation = () => {
  const { user } = useAuth()
  const { selectedCompany } = useCompany()
  const [loading, setLoading] = useState(false)
  const [bankStatements, setBankStatements] = useState([])
  const [ledgerEntries, setLedgerEntries] = useState([])
  const [reconciledItems, setReconciledItems] = useState([])
  const [unreconciledItems, setUnreconciledItems] = useState([])
  const [selectedBank, setSelectedBank] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [filters, setFilters] = useState({
    status: '',
    amount: '',
    type: ''
  })

  // Sample data for demonstration
  useEffect(() => {
    loadBankReconciliationData()
  }, [])

  const loadBankReconciliationData = async () => {
    setLoading(true)
    try {
      // Sample data - replace with actual API calls later
      setBankStatements([
        {
          id: 1,
          bank_name: 'Chase Bank',
          account_number: '****1234',
          statement_date: '2024-01-31',
          opening_balance: 50000.00,
          closing_balance: 48750.00,
          total_deposits: 15000.00,
          total_withdrawals: 16250.00,
          status: 'Reconciled'
        },
        {
          id: 2,
          bank_name: 'Wells Fargo',
          account_number: '****5678',
          statement_date: '2024-01-31',
          opening_balance: 25000.00,
          closing_balance: 23800.00,
          total_deposits: 8000.00,
          total_withdrawals: 9200.00,
          status: 'Pending'
        }
      ])

      setLedgerEntries([
        {
          id: 1,
          date: '2024-01-15',
          description: 'Customer Payment - ABC Corp',
          reference: 'INV-001',
          amount: 5000.00,
          type: 'Credit',
          status: 'Reconciled',
          bank_reference: 'CHQ-123'
        },
        {
          id: 2,
          date: '2024-01-16',
          description: 'Office Supplies',
          reference: 'PO-456',
          amount: 250.00,
          type: 'Debit',
          status: 'Reconciled',
          bank_reference: 'CHQ-124'
        },
        {
          id: 3,
          date: '2024-01-17',
          description: 'Utility Bill',
          reference: 'UTIL-789',
          amount: 150.00,
          type: 'Debit',
          status: 'Unreconciled',
          bank_reference: null
        }
      ])

      setReconciledItems([
        {
          id: 1,
          date: '2024-01-15',
          description: 'Customer Payment - ABC Corp',
          amount: 5000.00,
          type: 'Credit',
          ledger_ref: 'INV-001',
          bank_ref: 'CHQ-123',
          reconciled_date: '2024-01-20'
        }
      ])

      setUnreconciledItems([
        {
          id: 3,
          date: '2024-01-17',
          description: 'Utility Bill',
          amount: 150.00,
          type: 'Debit',
          ledger_ref: 'UTIL-789',
          bank_ref: null,
          notes: 'Bank statement not received'
        }
      ])

    } catch (error) {
      console.error('Failed to load bank reconciliation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReconcileItem = (itemId) => {
    // Logic to reconcile an item
    console.log('Reconciling item:', itemId)
  }

  const handleUploadStatement = (file) => {
    // Logic to upload bank statement
    console.log('Uploading statement:', file)
  }

  const handleExportReconciliation = () => {
    // Logic to export reconciliation report
    console.log('Exporting reconciliation report')
  }

  const calculateReconciliationStatus = () => {
    const totalLedger = ledgerEntries.reduce((sum, item) => sum + item.amount, 0)
    const totalReconciled = reconciledItems.reduce((sum, item) => sum + item.amount, 0)
    const totalUnreconciled = unreconciledItems.reduce((sum, item) => sum + item.amount, 0)
    
    return {
      totalLedger,
      totalReconciled,
      totalUnreconciled,
      reconciliationRate: totalReconciled / totalLedger * 100
    }
  }

  const status = calculateReconciliationStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation</h1>
          <p className="text-gray-600">Reconcile bank statements with ledger entries</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Upload className="h-4 w-4 mr-2" />
            Upload Statement
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Reconciliation
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Banknote className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Ledger</p>
              <p className="text-2xl font-bold text-gray-900">${status.totalLedger.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reconciled</p>
              <p className="text-2xl font-bold text-gray-900">${status.totalReconciled.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unreconciled</p>
              <p className="text-2xl font-bold text-gray-900">${status.totalUnreconciled.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reconciliation Rate</p>
              <p className="text-2xl font-bold text-gray-900">{status.reconciliationRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account</label>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              <option value="">All Banks</option>
              <option value="chase">Chase Bank</option>
              <option value="wells">Wells Fargo</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">All Status</option>
              <option value="reconciled">Reconciled</option>
              <option value="unreconciled">Unreconciled</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bank Statements */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Bank Statements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statement Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closing Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bankStatements.map((statement) => (
                <tr key={statement.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{statement.bank_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statement.account_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statement.statement_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${statement.opening_balance.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${statement.closing_balance.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      statement.status === 'Reconciled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {statement.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                    <button className="text-indigo-600 hover:text-indigo-900">Reconcile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ledger Entries */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Ledger Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ledgerEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.type === 'Credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.status === 'Reconciled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                    {entry.status !== 'Reconciled' && (
                      <button className="text-indigo-600 hover:text-indigo-900">Reconcile</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reconciliation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reconciled Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Reconciled Items</h3>
          </div>
          <div className="p-6">
            {reconciledItems.map((item) => (
              <div key={item.id} className="border-b border-gray-200 py-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500">{item.date} - {item.ledger_ref}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      item.type === 'Credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.type === 'Credit' ? '+' : '-'}${item.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Reconciled: {item.reconciled_date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unreconciled Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Unreconciled Items</h3>
          </div>
          <div className="p-6">
            {unreconciledItems.map((item) => (
              <div key={item.id} className="border-b border-gray-200 py-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500">{item.date} - {item.ledger_ref}</p>
                    {item.notes && <p className="text-xs text-yellow-600 mt-1">{item.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      item.type === 'Credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.type === 'Credit' ? '+' : '-'}${item.amount.toLocaleString()}
                    </p>
                    <button 
                      className="text-xs text-indigo-600 hover:text-indigo-900 mt-1"
                      onClick={() => handleReconcileItem(item.id)}
                    >
                      Reconcile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BankReconciliation
