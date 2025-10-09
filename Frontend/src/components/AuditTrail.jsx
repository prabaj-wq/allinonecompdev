import React, { useState, useEffect } from 'react'
import { 
  History, 
  User, 
  Clock, 
  Edit, 
  Plus, 
  Trash2, 
  Eye,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'

const AuditTrail = ({ 
  tableName, 
  recordId, 
  isVisible = false, 
  onClose 
}) => {
  const [auditRecords, setAuditRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedRecords, setExpandedRecords] = useState(new Set())
  const [filter, setFilter] = useState('all') // all, insert, update, delete
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isVisible && tableName && recordId) {
      loadAuditTrail()
    }
  }, [isVisible, tableName, recordId])

  const loadAuditTrail = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/universal-dimensions/audit-trail/${tableName}/${recordId}`)
      // const data = await response.json()
      
      // Mock data for now
      const mockData = [
        {
          id: 1,
          action: 'INSERT',
          old_values: null,
          new_values: {
            name: 'Corporate Structure',
            description: 'Main corporate hierarchy'
          },
          changed_by: 'admin',
          changed_at: new Date().toISOString(),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...'
        },
        {
          id: 2,
          action: 'UPDATE',
          old_values: {
            name: 'Corporate Structure',
            description: 'Main corporate hierarchy'
          },
          new_values: {
            name: 'Corporate Structure',
            description: 'Main corporate hierarchy with updated description'
          },
          changed_by: 'admin',
          changed_at: new Date(Date.now() - 3600000).toISOString(),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...'
        },
        {
          id: 3,
          action: 'INSERT',
          old_values: null,
          new_values: {
            code: 'ENT001',
            name: 'Parent Company',
            type: 'Parent'
          },
          changed_by: 'user1',
          changed_at: new Date(Date.now() - 7200000).toISOString(),
          ip_address: '192.168.1.2',
          user_agent: 'Mozilla/5.0...'
        }
      ]
      
      setAuditRecords(mockData)
    } catch (error) {
      console.error('Error loading audit trail:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRecord = (recordId) => {
    const newExpanded = new Set(expandedRecords)
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId)
    } else {
      newExpanded.add(recordId)
    }
    setExpandedRecords(newExpanded)
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'INSERT':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const filteredRecords = auditRecords.filter(record => {
    const matchesFilter = filter === 'all' || record.action === filter
    const matchesSearch = searchTerm === '' || 
      record.changed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.action.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <History className="h-6 w-6 mr-3 text-blue-600" />
              Audit Trail
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Change history for {tableName} record #{recordId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Actions</option>
                <option value="INSERT">Created</option>
                <option value="UPDATE">Updated</option>
                <option value="DELETE">Deleted</option>
              </select>
            </div>
            
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Audit Records */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => toggleRecord(record.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {expandedRecords.has(record.id) ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                          {getActionIcon(record.action)}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(record.action)}`}>
                              {record.action}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              by {record.changed_by}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(record.changed_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{record.ip_address}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {record.action === 'INSERT' ? 'Created' : 
                           record.action === 'UPDATE' ? 'Updated' : 'Deleted'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(record.changed_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {expandedRecords.has(record.id) && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Old Values */}
                        {record.old_values && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                              Previous Values
                            </h4>
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                              <pre className="text-xs text-red-800 dark:text-red-300 whitespace-pre-wrap">
                                {JSON.stringify(record.old_values, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                        
                        {/* New Values */}
                        {record.new_values && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              New Values
                            </h4>
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                              <pre className="text-xs text-green-800 dark:text-green-300 whitespace-pre-wrap">
                                {JSON.stringify(record.new_values, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Additional Info */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div>
                            <span className="font-medium">IP Address:</span> {record.ip_address}
                          </div>
                          <div>
                            <span className="font-medium">User Agent:</span> {record.user_agent?.substring(0, 50)}...
                          </div>
                          <div>
                            <span className="font-medium">Record ID:</span> {record.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredRecords.length} audit records found
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuditTrail
