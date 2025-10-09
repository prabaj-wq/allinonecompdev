import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  Calendar,
  User,
  Building,
  TrendingUp,
  BarChart3,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Settings,
  Bell,
  MapPin,
  Star,
  Bookmark,
  Info
} from 'lucide-react'

const SupplierReconciliation = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Supplier reconciliation state
  const [reconciliations, setReconciliations] = useState([])
  const [reconciliationLoading, setReconciliationLoading] = useState(false)
  const [showAddReconciliationModal, setShowAddReconciliationModal] = useState(false)
  const [selectedReconciliation, setSelectedReconciliation] = useState(null)
  const [reconciliationFilters, setReconciliationFilters] = useState({
    status: 'all',
    supplier: 'all',
    period: 'all'
  })

  // Enhanced features state
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showAuditLogModal, setShowAuditLogModal] = useState(false)
  const [auditLogs, setAuditLogs] = useState([])
  const [selectedItemForDispute, setSelectedItemForDispute] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Sample supplier reconciliation data
  const sampleReconciliations = [
    {
      id: 1,
      supplier_name: 'ABC Manufacturing Ltd',
      supplier_code: 'ABC001',
      reconciliation_period: '2024-01',
      reconciliation_date: '2024-01-31',
      status: 'completed',
      assigned_to: 'John Smith',
      supplier_balance: 125000.00,
      our_balance: 125000.00,
      difference_amount: 0.00,
      reconciled_amount: 125000.00,
      notes: 'All items matched successfully',
      reconciliation_items: [
        {
          id: 1,
          item_type: 'invoice',
          reference_number: 'INV-2024-001',
          item_date: '2024-01-15',
          description: 'Raw materials supply',
          amount: 50000.00,
          currency: 'USD',
          status: 'matched',
          matched_item_id: 2,
          notes: 'Matched with payment PMT-2024-001'
        },
        {
          id: 2,
          item_type: 'payment',
          reference_number: 'PMT-2024-001',
          item_date: '2024-01-20',
          description: 'Payment for invoice INV-2024-001',
          amount: -50000.00,
          currency: 'USD',
          status: 'matched',
          matched_item_id: 1,
          notes: 'Matched with invoice INV-2024-001'
        },
        {
          id: 3,
          item_type: 'invoice',
          reference_number: 'INV-2024-002',
          item_date: '2024-01-25',
          description: 'Equipment maintenance services',
          amount: 75000.00,
          currency: 'USD',
          status: 'matched',
          matched_item_id: 4,
          notes: 'Matched with payment PMT-2024-002'
        },
        {
          id: 4,
          item_type: 'payment',
          reference_number: 'PMT-2024-002',
          item_date: '2024-01-30',
          description: 'Payment for invoice INV-2024-002',
          amount: -75000.00,
          currency: 'USD',
          status: 'matched',
          matched_item_id: 3,
          notes: 'Matched with invoice INV-2024-002'
        }
      ],
      attachments: [
        { id: 1, filename: 'abc_statement_jan2024.pdf', file_type: 'pdf', file_size: 1024000 },
        { id: 2, filename: 'abc_reconciliation_report.xlsx', file_type: 'xlsx', file_size: 512000 }
      ]
    },
    {
      id: 2,
      supplier_name: 'XYZ Logistics Inc',
      supplier_code: 'XYZ002',
      reconciliation_period: '2024-01',
      reconciliation_date: '2024-01-31',
      status: 'in-progress',
      assigned_to: 'Sarah Johnson',
      supplier_balance: 87500.00,
      our_balance: 85000.00,
      difference_amount: 2500.00,
      reconciled_amount: 85000.00,
      notes: 'Discrepancy found - investigating',
      reconciliation_items: [
        {
          id: 5,
          item_type: 'invoice',
          reference_number: 'INV-2024-003',
          item_date: '2024-01-10',
          description: 'Transportation services',
          amount: 45000.00,
          currency: 'USD',
          status: 'matched',
          matched_item_id: 6,
          notes: 'Matched with payment PMT-2024-003'
        },
        {
          id: 6,
          item_type: 'payment',
          reference_number: 'PMT-2024-003',
          item_date: '2024-01-15',
          description: 'Payment for invoice INV-2024-003',
          amount: -45000.00,
          currency: 'USD',
          status: 'matched',
          matched_item_id: 5,
          notes: 'Matched with invoice INV-2024-003'
        },
        {
          id: 7,
          item_type: 'invoice',
          reference_number: 'INV-2024-004',
          item_date: '2024-01-20',
          description: 'Warehousing services',
          amount: 42500.00,
          currency: 'USD',
          status: 'unmatched',
          matched_item_id: null,
          notes: 'No matching payment found'
        }
      ],
      attachments: [
        { id: 3, filename: 'xyz_statement_jan2024.pdf', file_type: 'pdf', file_size: 768000 }
      ]
    },
    {
      id: 3,
      supplier_name: 'Tech Solutions Corp',
      supplier_code: 'TECH003',
      reconciliation_period: '2024-01',
      reconciliation_date: '2024-01-31',
      status: 'disputed',
      assigned_to: 'Mike Chen',
      supplier_balance: 150000.00,
      our_balance: 145000.00,
      difference_amount: 5000.00,
      reconciled_amount: 145000.00,
      notes: 'Dispute over late payment charges',
      reconciliation_items: [
        {
          id: 8,
          item_type: 'invoice',
          reference_number: 'INV-2024-005',
          item_date: '2024-01-05',
          description: 'Software licensing fees',
          amount: 100000.00,
          currency: 'USD',
          status: 'matched',
          matched_item_id: 9,
          notes: 'Matched with payment PMT-2024-004'
        },
        {
          id: 9,
          item_type: 'payment',
          reference_number: 'PMT-2024-004',
          item_date: '2024-01-25',
          description: 'Payment for invoice INV-2024-005',
          amount: -100000.00,
          currency: 'USD',
          status: 'matched',
          matched_item_id: 8,
          notes: 'Matched with invoice INV-2024-005'
        },
        {
          id: 10,
          item_type: 'invoice',
          reference_number: 'INV-2024-006',
          item_date: '2024-01-15',
          description: 'IT consulting services',
          amount: 45000.00,
          currency: 'USD',
          status: 'matched',
          matched_item_id: 11,
          notes: 'Matched with payment PMT-2024-005'
        },
        {
          id: 11,
          item_type: 'payment',
          reference_number: 'PMT-2024-005',
          item_date: '2024-01-30',
          description: 'Payment for invoice INV-2024-006',
          amount: -45000.00,
          currency: 'USD',
          status: 'matched',
          matched_item_id: 10,
          notes: 'Matched with invoice INV-2024-006'
        },
        {
          id: 12,
          item_type: 'adjustment',
          reference_number: 'ADJ-2024-001',
          item_date: '2024-01-31',
          description: 'Late payment charges',
          amount: 5000.00,
          currency: 'USD',
          status: 'disputed',
          matched_item_id: null,
          notes: 'Disputed - charges not agreed'
        }
      ],
      attachments: [
        { id: 4, filename: 'tech_statement_jan2024.pdf', file_type: 'pdf', file_size: 1536000 },
        { id: 5, filename: 'dispute_letter.pdf', file_type: 'pdf', file_size: 256000 }
      ]
    }
  ]

  const suppliers = [
    { id: 'ABC001', name: 'ABC Manufacturing Ltd', status: 'active' },
    { id: 'XYZ002', name: 'XYZ Logistics Inc', status: 'active' },
    { id: 'TECH003', name: 'Tech Solutions Corp', status: 'active' },
    { id: 'SUP004', name: 'Supply Chain Partners', status: 'inactive' }
  ]

  const periods = [
    { id: '2024-01', name: 'January 2024' },
    { id: '2023-12', name: 'December 2023' },
    { id: '2023-11', name: 'November 2023' },
    { id: '2023-10', name: 'October 2023' }
  ]

  useEffect(() => {
    loadReconciliations()
    loadStatusSummary()
  }, [])

  useEffect(() => {
    loadReconciliations()
  }, [reconciliationFilters, searchQuery])

  const loadReconciliations = async () => {
    setReconciliationLoading(true)
    try {
      const params = new URLSearchParams()
      if (reconciliationFilters.status !== 'all') params.append('status', reconciliationFilters.status)
      if (reconciliationFilters.supplier !== 'all') params.append('supplier', reconciliationFilters.supplier)
      if (reconciliationFilters.period !== 'all') params.append('period', reconciliationFilters.period)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/supplier-reconciliations/filtered?${params}`, {
        credentials: 'include' // Include cookies for authentication
      })
      if (response.ok) {
        const data = await response.json()
        setReconciliations(data.reconciliations)
      } else if (response.status === 401) {
        console.log('Authentication required - using sample data')
        setReconciliations(sampleReconciliations)
      } else {
        console.log('API error - using sample data')
        setReconciliations(sampleReconciliations)
      }
    } catch (error) {
      console.error('Error loading reconciliations:', error)
      // Fallback to sample data
      setReconciliations(sampleReconciliations)
    } finally {
      setReconciliationLoading(false)
    }
  }

  const loadStatusSummary = async () => {
    try {
      const response = await fetch('/api/supplier-reconciliations/status-summary', {
        credentials: 'include' // Include cookies for authentication
      })
      if (response.ok) {
        const data = await response.json()
        setReconciliationStats(data)
      } else if (response.status === 401) {
        console.log('Authentication required - using default stats')
        // Keep default stats
      } else {
        console.log('API error - using default stats')
      }
    } catch (error) {
      console.error('Error loading status summary:', error)
    }
  }

  const handleAddReconciliation = () => {
    setShowAddReconciliationModal(true)
  }

  const handleReconciliationClick = (reconciliation) => {
    setSelectedReconciliation(reconciliation)
  }

  const handleMatchItems = (reconciliationId, item1Id, item2Id) => {
    setReconciliations(prev => 
      prev.map(reconciliation => 
        reconciliation.id === reconciliationId 
          ? {
              ...reconciliation,
              reconciliation_items: reconciliation.reconciliation_items.map(item =>
                item.id === item1Id || item.id === item2Id
                  ? { ...item, status: 'matched', matched_item_id: item.id === item1Id ? item2Id : item1Id }
                  : item
              )
            }
          : reconciliation
      )
    )
  }

  const handleDisputeItem = (reconciliationId, itemId) => {
    const reconciliation = reconciliations.find(r => r.id === reconciliationId)
    const item = reconciliation?.reconciliation_items.find(i => i.id === itemId)
    if (item) {
      setSelectedItemForDispute({ reconciliationId, itemId, item })
      setShowDisputeModal(true)
    }
  }

  const handleCreateDispute = async (disputeData) => {
    try {
      const formData = new FormData()
      formData.append('dispute_type', disputeData.type)
      formData.append('reason', disputeData.reason)
      formData.append('priority', disputeData.priority)
      formData.append('assigned_to', disputeData.assignedTo || '')
      formData.append('item_id', selectedItemForDispute.itemId)

      const response = await fetch(`/api/supplier-reconciliations/${selectedItemForDispute.reconciliationId}/disputes`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        // Update the item status to disputed
        setReconciliations(prev => 
          prev.map(reconciliation => 
            reconciliation.id === selectedItemForDispute.reconciliationId 
              ? {
                  ...reconciliation,
                  status: 'disputed',
                  reconciliation_items: reconciliation.reconciliation_items.map(item =>
                    item.id === selectedItemForDispute.itemId
                      ? { ...item, status: 'disputed' }
                      : item
                  )
                }
              : reconciliation
          )
        )
        setShowDisputeModal(false)
        setSelectedItemForDispute(null)
        loadStatusSummary() // Refresh stats
      }
    } catch (error) {
      console.error('Error creating dispute:', error)
    }
  }

  const handleUploadAttachment = async (reconciliationId, file) => {
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/supplier-reconciliations/${reconciliationId}/attachments`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        // Refresh the reconciliation data
        loadReconciliations()
      }
    } catch (error) {
      console.error('Error uploading attachment:', error)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDownloadAttachment = async (reconciliationId, attachmentId) => {
    try {
      const response = await fetch(`/api/supplier-reconciliations/${reconciliationId}/attachments/${attachmentId}/download`, {
        credentials: 'include'
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'attachment'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading attachment:', error)
    }
  }

  const handleViewAuditLog = async (reconciliationId) => {
    try {
      const response = await fetch(`/api/supplier-reconciliations/${reconciliationId}/audit-log`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.audit_logs)
        setShowAuditLogModal(true)
      }
    } catch (error) {
      console.error('Error loading audit log:', error)
    }
  }

  const handleCalculateSummary = async (reconciliationId) => {
    try {
      const response = await fetch(`/api/supplier-reconciliations/${reconciliationId}/calculate-summary`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // Update the reconciliation with new summary
        setReconciliations(prev => 
          prev.map(reconciliation => 
            reconciliation.id === reconciliationId 
              ? {
                  ...reconciliation,
                  supplier_balance: data.summary.supplier_balance,
                  our_balance: data.summary.our_balance,
                  difference_amount: data.summary.difference_amount,
                  reconciled_amount: data.summary.reconciled_amount
                }
              : reconciliation
          )
        )
      }
    } catch (error) {
      console.error('Error calculating summary:', error)
    }
  }

  const handleExportReconciliation = async (reconciliationId, format = 'pdf') => {
    try {
      const response = await fetch(`/api/supplier-reconciliations/${reconciliationId}/export?format=${format}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // For now, just show the data. In production, you would download the file
        console.log('Export data:', data)
        alert(`Export ${format.toUpperCase()} generated successfully`)
      }
    } catch (error) {
      console.error('Error exporting reconciliation:', error)
    }
  }

  const filteredReconciliations = reconciliations.filter(reconciliation => {
    if (reconciliationFilters.status !== 'all' && reconciliation.status !== reconciliationFilters.status) return false
    if (reconciliationFilters.supplier !== 'all' && reconciliation.supplier_code !== reconciliationFilters.supplier) return false
    if (reconciliationFilters.period !== 'all' && reconciliation.reconciliation_period !== reconciliationFilters.period) return false
    return true
  })

  // State for reconciliation stats (will be loaded from API)
  const [reconciliationStats, setReconciliationStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    disputed: 0,
    pending: 0,
    totalDifference: 0
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'disputed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getItemStatusColor = (status) => {
    switch (status) {
      case 'matched': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'unmatched': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'disputed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getItemTypeIcon = (type) => {
    switch (type) {
      case 'invoice': return <FileText className="h-4 w-4 text-blue-500" />
      case 'payment': return <DollarSign className="h-4 w-4 text-green-500" />
      case 'credit_note': return <XCircle className="h-4 w-4 text-red-500" />
      case 'adjustment': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Supplier Reconciliation</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Match supplier invoices with payments and resolve discrepancies
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </button>
          <button 
            onClick={handleAddReconciliation}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Reconciliation
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {[
          { title: 'Total Reconciliations', count: reconciliationStats.total, color: 'bg-blue-500', icon: <BarChart3 className="h-5 w-5" /> },
          { title: 'Completed', count: reconciliationStats.completed, color: 'bg-green-500', icon: <CheckCircle className="h-5 w-5" /> },
          { title: 'In Progress', count: reconciliationStats.inProgress, color: 'bg-yellow-500', icon: <Clock className="h-5 w-5" /> },
          { title: 'Disputed', count: reconciliationStats.disputed, color: 'bg-red-500', icon: <AlertTriangle className="h-5 w-5" /> },
          { title: 'Pending', count: reconciliationStats.pending, color: 'bg-gray-500', icon: <Clock className="h-5 w-5" /> },
          { title: 'Total Difference', count: `$${(reconciliationStats.totalDifference || 0).toLocaleString()}`, color: 'bg-orange-500', icon: <DollarSign className="h-5 w-5" /> }
        ].map((stat) => (
          <div key={stat.title} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center text-white mr-3`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
            <select 
              value={reconciliationFilters.status} 
              onChange={(e) => setReconciliationFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Supplier</label>
            <select 
              value={reconciliationFilters.supplier} 
              onChange={(e) => setReconciliationFilters(prev => ({ ...prev, supplier: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Period</label>
            <select 
              value={reconciliationFilters.period} 
              onChange={(e) => setReconciliationFilters(prev => ({ ...prev, period: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="all">All Periods</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>{period.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reconciliations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => setReconciliationFilters({ status: 'all', supplier: 'all', period: 'all' })}
              className="btn-secondary w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reconciliations List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        {reconciliationLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading reconciliations...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredReconciliations.map((reconciliation) => (
              <div key={reconciliation.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-slate-900 dark:text-white">{reconciliation.supplier_name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reconciliation.status)}`}>
                        {reconciliation.status}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">({reconciliation.supplier_code})</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-slate-500 dark:text-slate-500">Period:</span>
                        <span className="ml-2 text-slate-700 dark:text-slate-300">{reconciliation.reconciliation_period}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-500">Assigned To:</span>
                        <span className="ml-2 text-slate-700 dark:text-slate-300">{reconciliation.assigned_to}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-500">Reconciliation Date:</span>
                        <span className="ml-2 text-slate-700 dark:text-slate-300">{reconciliation.reconciliation_date}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-500">Difference:</span>
                        <span className={`ml-2 font-medium ${reconciliation.difference_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          ${reconciliation.difference_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Balance Summary */}
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
                      <h5 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Balance Summary</h5>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-500">Supplier Balance:</span>
                          <span className="ml-2 font-medium text-slate-700 dark:text-slate-300">
                            ${reconciliation.supplier_balance.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-500">Our Balance:</span>
                          <span className="ml-2 font-medium text-slate-700 dark:text-slate-300">
                            ${reconciliation.our_balance.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-500">Difference:</span>
                          <span className={`ml-2 font-medium ${reconciliation.difference_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            ${reconciliation.difference_amount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-500">Reconciled:</span>
                          <span className="ml-2 font-medium text-slate-700 dark:text-slate-300">
                            ${reconciliation.reconciled_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reconciliation Items */}
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Reconciliation Items</h5>
                      <div className="space-y-2">
                        {reconciliation.reconciliation_items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 p-2 bg-white dark:bg-slate-600 rounded border">
                            <div className="flex items-center space-x-2">
                              {getItemTypeIcon(item.item_type)}
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getItemStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="font-medium">{item.reference_number}</span>
                                <span className="text-slate-500">{item.item_date}</span>
                                <span className="text-slate-600 dark:text-slate-300">{item.description}</span>
                                <span className={`font-medium ${item.amount < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  ${Math.abs(item.amount).toLocaleString()}
                                </span>
                              </div>
                              {item.notes && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              {item.status === 'unmatched' && (
                                <>
                                  <button 
                                    onClick={() => handleMatchItems(reconciliation.id, item.id, item.id)}
                                    className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                    title="Mark as matched"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDisputeItem(reconciliation.id, item.id)}
                                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    title="Mark as disputed"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Attachments */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-sm font-medium text-slate-900 dark:text-white">Attachments</h5>
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            id={`file-upload-${reconciliation.id}`}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleUploadAttachment(reconciliation.id, e.target.files[0])
                              }
                            }}
                          />
                          <label
                            htmlFor={`file-upload-${reconciliation.id}`}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 cursor-pointer"
                          >
                            {uploadingFile ? 'Uploading...' : 'Upload'}
                          </label>
                        </div>
                      </div>
                      {reconciliation.attachments && reconciliation.attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {reconciliation.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-600 rounded-lg px-3 py-2">
                              <FileText className="h-4 w-4 text-slate-500" />
                              <span className="text-sm text-slate-700 dark:text-slate-300">{attachment.filename}</span>
                              <span className="text-xs text-slate-500">({Math.round(attachment.file_size / 1024)}KB)</span>
                              <button
                                onClick={() => handleDownloadAttachment(reconciliation.id, attachment.id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Download"
                              >
                                <Download className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No attachments uploaded</p>
                      )}
                    </div>

                    {reconciliation.notes && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">{reconciliation.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-6">
                    <button 
                      onClick={() => handleReconciliationClick(reconciliation)}
                      className="btn-secondary"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    <button 
                      onClick={() => handleCalculateSummary(reconciliation.id)}
                      className="btn-secondary"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recalculate
                    </button>
                    <button 
                      onClick={() => handleViewAuditLog(reconciliation.id)}
                      className="btn-secondary"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Audit Log
                    </button>
                    <button 
                      onClick={() => handleExportReconciliation(reconciliation.id, 'pdf')}
                      className="btn-secondary"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </button>
                    <button 
                      onClick={() => handleExportReconciliation(reconciliation.id, 'xlsx')}
                      className="btn-secondary"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create Dispute</h3>
            <DisputeForm 
              item={selectedItemForDispute?.item}
              onSubmit={handleCreateDispute}
              onCancel={() => {
                setShowDisputeModal(false)
                setSelectedItemForDispute(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Audit Log</h3>
              <button 
                onClick={() => setShowAuditLogModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-slate-900 dark:text-white">{log.action}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{log.description}</p>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    User: {log.user_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Dispute Form Component
const DisputeForm = ({ item, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'amount',
    reason: '',
    priority: 'medium',
    assignedTo: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Dispute Type
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value="amount">Amount Discrepancy</option>
          <option value="date">Date Mismatch</option>
          <option value="reference">Reference Number</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Reason
        </label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          rows="3"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Priority
        </label>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Assign To (Optional)
        </label>
        <input
          type="text"
          value={formData.assignedTo}
          onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          placeholder="User name or email"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Create Dispute
        </button>
      </div>
    </form>
  )
}

export default SupplierReconciliation
