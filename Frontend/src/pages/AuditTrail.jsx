import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { pythonServices } from '../services/pythonIntegration'

import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Clock, 
  User, 
  Activity,
  Calendar,
  FileText,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Trash2,
  Settings,
  Shield,
  Globe,
  Building,
  Calculator,
  Network,
  FileSpreadsheet,
  Upload,
  Edit,
  Plus,
  Minus,
  DollarSign,
  Percent,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

const AuditTrail = () => {
  const { user } = useAuth()
  const [auditEntries, setAuditEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    entity: '',
    module: '',
    amountMin: '',
    amountMax: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [dateRange, setDateRange] = useState('all')
  const [sortBy, setSortBy] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [totalEntries, setTotalEntries] = useState(0)

  // Load audit trail data from new audit logging system
  const loadAuditTrail = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get logs from the working consolidation audit trail endpoint
      let response
      try {
        console.log('📊 Fetching logs from consolidation audit trail...')
        response = await pythonServices.getConsolidationAuditTrail()
        console.log('📊 Response from consolidation system:', response)
        if (response.data && response.data.audit_trail) {
          console.log(`✅ Found ${response.data.audit_trail.length} logs in consolidation system`)
          // Normalize the audit entries to ensure they have all required fields
          const normalizedEntries = response.data.audit_trail.map(entry => ({
            id: entry.id || Math.random().toString(36).substr(2, 9),
            timestamp: entry.timestamp || new Date().toISOString(),
            user: entry.user || 'Unknown',
            action: entry.action || 'Unknown Action',
            module: entry.module || 'Consolidation',
            entity: entry.entity || 'System',
            status: entry.status || 'Completed',
            details: entry.details || entry.description || entry.action || 'No details available',
            amount: entry.amount || 0,
            ip_address: entry.ip_address || 'Unknown'
          }))
          
          // Debug: Show the structure of first few entries
          console.log('🔍 Sample audit entries structure:')
          console.log('Original entries:', response.data.audit_trail.slice(0, 3))
          console.log('Normalized entries:', normalizedEntries.slice(0, 3))
          
          setAuditEntries(normalizedEntries)
          setTotalEntries(normalizedEntries.length)
        } else {
          console.log('⚠️ No audit trail data found, using sample data')
          setAuditEntries(getSampleAuditData())
          setTotalEntries(5)
        }
      } catch (error) {
        console.log('⚠️ Failed to load consolidation audit trail, using sample data:', error)
        // Fallback to sample data
        setAuditEntries(getSampleAuditData())
        setTotalEntries(5)
      }
      

      
    } catch (error) {
      console.error('Failed to load audit trail:', error)
      // Fallback to sample data on error
      setAuditEntries(getSampleAuditData())
      setTotalEntries(5)
      

    } finally {
      setLoading(false)
    }
  }, [])

  // Sample audit data for development/testing
  const getSampleAuditData = () => [
    {
      id: 1,
      timestamp: '2024-01-15T16:00:00Z',
      user: 'John Doe',
      action: 'Trial Balance Uploaded',
      module: 'Process Module',
      entity: 'Sample Corp Ltd',
      status: 'Completed',
      details: 'Successfully uploaded trial balance for Q4 2024',
      changes: { file: 'tb_q4_2024.xlsx', records: 1250, amount: 2500000 },
      ip_address: '192.168.1.100',
      amount: 2500000
    },
    {
      id: 2,
      timestamp: '2024-01-15T14:45:00Z',
      user: 'Jane Smith',
      action: 'Consolidation Processed',
      module: 'Consolidation',
      entity: 'Sample Corp Ltd',
      status: 'Completed',
      details: 'Consolidation completed for Q4 2024 period',
      changes: { entities: 5, accounts: 150, eliminations: 12, total_assets: 5000000 },
      ip_address: '192.168.1.101',
      amount: 5000000
    },
    {
      id: 3,
      timestamp: '2024-01-14T16:45:00Z',
      user: 'Mike Johnson',
      action: 'Financial Statements Generated',
      module: 'Financial Statements',
      entity: 'Sample Corp Ltd',
      status: 'Completed',
      details: 'Generated balance sheet and income statement',
      changes: { statements: ['Balance Sheet', 'Income Statement'], revenue: 3000000, expenses: 2000000 },
      ip_address: '192.168.1.102',
      amount: 3000000
    },
    {
      id: 4,
      timestamp: '2024-01-14T14:20:00Z',
      user: 'Sarah Wilson',
      action: 'Entity Updated',
      module: 'Consolidation',
      entity: 'Subsidiary A',
      status: 'Completed',
      details: 'Updated entity information and hierarchy',
      changes: { name: 'Subsidiary A Ltd', country: 'Canada', ownership: '80%' },
      ip_address: '192.168.1.103',
      amount: 0
    },
    {
      id: 5,
      timestamp: '2024-01-14T11:30:00Z',
      user: 'David Brown',
      action: 'Audit Materiality Updated',
      module: 'Audit Materiality',
      entity: 'Sample Corp Ltd',
      status: 'Completed',
      details: 'Updated materiality thresholds for 2024',
      changes: { threshold: '5% of total assets', risk: 'Medium', materiality_amount: 250000 },
      ip_address: '192.168.1.104',
      amount: 250000
    },
    {
      id: 6,
      timestamp: '2024-01-13T15:15:00Z',
      user: 'Lisa Chen',
      action: 'Intercompany Elimination',
      module: 'Consolidation',
      entity: 'Sample Corp Ltd',
      status: 'Completed',
      details: 'Processed intercompany eliminations for Q4',
      changes: { eliminations: 8, total_amount: 450000, matched: 6, unmatched: 2 },
      ip_address: '192.168.1.105',
      amount: 450000
    },
    {
      id: 7,
      timestamp: '2024-01-13T10:30:00Z',
      user: 'Robert Kim',
      action: 'Foreign Exchange Rate Updated',
      module: 'Forex Management',
      entity: 'Sample Corp Ltd',
      status: 'Completed',
      details: 'Updated FX rates for December 2024',
      changes: { currencies: ['USD', 'EUR', 'GBP'], rates_updated: 15 },
      ip_address: '192.168.1.106',
      amount: 0
    },
    {
      id: 8,
      timestamp: '2024-01-12T16:20:00Z',
      user: 'Emily Davis',
      action: 'Account Hierarchy Modified',
      module: 'Account Management',
      entity: 'Sample Corp Ltd',
      status: 'Completed',
      details: 'Restructured account hierarchy for better reporting',
      changes: { accounts_modified: 25, new_groups: 3, deleted_groups: 1 },
      ip_address: '192.168.1.107',
      amount: 0
    }
  ]

  useEffect(() => {
    loadAuditTrail()
  }, [loadAuditTrail])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filters change
  }

  const handleDateRangeChange = (range) => {
    setDateRange(range)
    const now = new Date()
    let fromDate = ''
    let toDate = ''

    switch (range) {
      case 'today':
        fromDate = now.toISOString().split('T')[0]
        toDate = now.toISOString().split('T')[0]
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        fromDate = weekAgo.toISOString().split('T')[0]
        toDate = now.toISOString().split('T')[0]
        break
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        fromDate = monthAgo.toISOString().split('T')[0]
        toDate = now.toISOString().split('T')[0]
        break
      case 'quarter':
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        fromDate = quarterAgo.toISOString().split('T')[0]
        toDate = now.toISOString().split('T')[0]
        break
      case 'year':
        fromDate = `${now.getFullYear()}-01-01`
        toDate = now.toISOString().split('T')[0]
        break
      default:
        fromDate = ''
        toDate = ''
    }

    setFilters(prev => ({ ...prev, dateFrom: fromDate, dateTo: toDate }))
  }

  const getStatusIcon = (status) => {
    if (!status || typeof status !== 'string') return <Activity className="h-4 w-4 text-gray-600" />
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    if (!status || typeof status !== 'string') return 'bg-gray-100 text-gray-800 border-gray-200'
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getModuleIcon = (module) => {
    if (!module || typeof module !== 'string') return <Database className="h-4 w-4" />
    const moduleLower = module.toLowerCase()
    if (moduleLower.includes('consolidation')) return <Network className="h-4 w-4" />
    if (moduleLower.includes('materiality')) return <Calculator className="h-4 w-4" />
    if (moduleLower.includes('account')) return <FileSpreadsheet className="h-4 w-4" />
    if (moduleLower.includes('entity')) return <Building className="h-4 w-4" />
    if (moduleLower.includes('template')) return <FileText className="h-4 w-4" />
    if (moduleLower.includes('forex')) return <Globe className="h-4 w-4" />
    if (moduleLower.includes('process')) return <Settings className="h-4 w-4" />
    if (moduleLower.includes('financial')) return <TrendingUp className="h-4 w-4" />
    return <Database className="h-4 w-4" />
  }

  const getModuleColor = (module) => {
    if (!module || typeof module !== 'string') return 'text-gray-600 bg-gray-50'
    const moduleLower = module.toLowerCase()
    if (moduleLower.includes('consolidation')) return 'text-blue-600 bg-blue-50'
    if (moduleLower.includes('materiality')) return 'text-orange-600 bg-orange-50'
    if (moduleLower.includes('account')) return 'text-green-600 bg-green-50'
    if (moduleLower.includes('entity')) return 'text-purple-600 bg-purple-50'
    if (moduleLower.includes('template')) return 'text-indigo-600 bg-indigo-50'
    if (moduleLower.includes('forex')) return 'text-teal-600 bg-teal-50'
    if (moduleLower.includes('process')) return 'text-gray-600 bg-gray-50'
    if (moduleLower.includes('financial')) return 'text-emerald-600 bg-emerald-50'
    return 'text-gray-600 bg-gray-50'
  }

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = (entry.action && entry.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (entry.user && entry.user.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (entry.details && entry.details.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilters = (!filters.action || (entry.action && entry.action.toLowerCase().includes(filters.action.toLowerCase()))) &&
                          (!filters.user || (entry.user && entry.user.toLowerCase().includes(filters.user.toLowerCase()))) &&
                          (!filters.status || entry.status === filters.status) &&
                          (!filters.module || (entry.module && entry.module.toLowerCase().includes(filters.module.toLowerCase()))) &&
                          (!filters.entity || (entry.entity && entry.entity.toLowerCase().includes(filters.entity.toLowerCase()))) &&
                          (!filters.amountMin || (entry.amount && entry.amount >= parseFloat(filters.amountMin))) &&
                          (!filters.amountMax || (entry.amount && entry.amount <= parseFloat(filters.amountMax)))

    // Date range filtering
    if (filters.dateFrom || filters.dateTo) {
      const entryDate = new Date(entry.timestamp)
      if (filters.dateFrom && entryDate < new Date(filters.dateFrom)) return false
      if (filters.dateTo && entryDate > new Date(filters.dateTo + 'T23:59:59')) return false
    }

    return matchesSearch && matchesFilters
  })

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let aValue = a[sortBy] || ''
    let bValue = b[sortBy] || ''
    
    if (sortBy === 'timestamp') {
      aValue = new Date(aValue || new Date())
      bValue = new Date(bValue || new Date())
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const paginatedEntries = sortedEntries.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(sortedEntries.length / pageSize)

  const exportAuditTrail = async () => {
    try {
      setExporting(true)
      
      // Create CSV content
      const headers = ['Timestamp', 'User', 'Action', 'Module', 'Entity', 'Status', 'Details', 'Amount', 'IP Address']
      const csvContent = [
        headers.join(','),
        ...filteredEntries.map(entry => [
          formatTimestamp(entry.timestamp || new Date()),
          entry.action || '',
          entry.user || '',
          entry.module || '',
          entry.entity || '',
          entry.status || '',
          entry.details || '',
          entry.amount || 0,
          entry.ip_address || ''
        ].join(','))
      ].join('\n')

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `audit-trail-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      

      
    } catch (error) {
      console.error('Failed to export audit trail:', error)
      

    } finally {
      setExporting(false)
    }
  }



  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit trail...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-600 mt-1">
              Complete history of all system activities and changes
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                {totalEntries} total entries
              </span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Last updated: {new Date().toLocaleString()}
              </span>

            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadAuditTrail}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
                         <button
               onClick={exportAuditTrail}
               disabled={exporting}
               className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
             >
               <Download className="h-4 w-4 mr-2" />
               {exporting ? 'Exporting...' : 'Export'}
             </button>

          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2 text-indigo-600" />
          Filters & Search
        </h2>
        
        {/* Quick Date Range Filters */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quick Date Range</label>
          <div className="flex flex-wrap gap-2">
            {['all', 'today', 'week', 'month', 'quarter', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => handleDateRangeChange(range)}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  dateRange === range
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search actions, users, details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <input
              type="text"
              placeholder="Filter by action"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <input
              type="text"
              placeholder="Filter by user"
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
            <input
              type="text"
              placeholder="Filter by module"
              value={filters.module}
              onChange={(e) => handleFilterChange('module', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
            <input
              type="text"
              placeholder="Filter by entity"
              value={filters.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Min</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                placeholder="Min amount"
                value={filters.amountMin}
                onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Max</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                placeholder="Max amount"
                value={filters.amountMax}
                onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Audit Trail Entries */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Audit Trail Entries ({filteredEntries.length})
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="timestamp">Timestamp</option>
                  <option value="user">User</option>
                  <option value="action">Action</option>
                  <option value="module">Module</option>
                  <option value="entity">Entity</option>
                  <option value="amount">Amount</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('timestamp')}>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Timestamp
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('user')}>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    User
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('action')}>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Action
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('module')}>
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Module
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('entity')}>
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Entity
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Amount
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {formatTimestamp(entry.timestamp || new Date())}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      {typeof entry.user === 'string' ? entry.user : 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      <div className="font-medium">{typeof entry.action === 'string' ? entry.action : 'Unknown Action'}</div>
                      {entry.details && (
                        <div className="text-gray-500 text-xs mt-1 truncate" title={typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)}>
                          {typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModuleColor(entry.module)}`}>
                        {getModuleIcon(entry.module)}
                        <span className="ml-1">{typeof entry.module === 'string' ? entry.module : 'System'}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof entry.entity === 'string' ? entry.entity : 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatAmount(typeof entry.amount === 'number' ? entry.amount : 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}>
                      {getStatusIcon(entry.status)}
                      <span className="ml-1">{typeof entry.status === 'string' ? entry.status : 'Completed'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedEntry(entry)
                        setShowDetails(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center hover:bg-indigo-50 px-2 py-1 rounded"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit entries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredEntries.length)} of {filteredEntries.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedEntry && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Audit Entry Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">{formatTimestamp(selectedEntry.timestamp || new Date())}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedEntry.user || 'Unknown'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action</label>
                  <p className="text-sm text-gray-900">{selectedEntry.action || 'Unknown Action'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Module</label>
                  <p className="text-sm text-gray-900">{selectedEntry.module || 'System'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Entity</label>
                  <p className="text-sm text-gray-900">{selectedEntry.entity || 'System'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedEntry.status)}`}>
                    {getStatusIcon(selectedEntry.status)}
                    <span className="ml-1">{selectedEntry.status || 'Completed'}</span>
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-sm text-gray-900">{formatAmount(selectedEntry.amount || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">IP Address</label>
                  <p className="text-sm text-gray-900">{selectedEntry.ip_address || 'Unknown'}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Details</label>
                <p className="text-sm text-gray-900">{selectedEntry.details || 'No details available'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Changes</label>
                <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md overflow-x-auto">
                  {JSON.stringify(selectedEntry.changes || {}, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditTrail
