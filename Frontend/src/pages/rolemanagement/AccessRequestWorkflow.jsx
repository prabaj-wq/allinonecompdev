import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useCompany } from '../../contexts/CompanyContext'
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  MessageSquare, 
  RefreshCw, 
  Filter, 
  Search, 
  X, 
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  FileText,
  Building,
  Database,
  Settings,
  Zap
} from 'lucide-react'
import AdminAuthWrapper from './components/AdminAuthWrapper'
import RoleManagementNavigation from './components/RoleManagementNavigation'

const AccessRequestWorkflow = () => {
  // ===== CONTEXT HOOKS =====
  const { selectedCompany: authSelectedCompany } = useAuth()
  const { selectedCompany: companyContextCompany } = useCompany()
  
  // Use the company from auth context as primary, fallback to company context
  const selectedCompany = authSelectedCompany || companyContextCompany
  
  // ===== STATE MANAGEMENT =====
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [systemModules, setSystemModules] = useState({})
  const [databases, setDatabases] = useState([])
  const [newRequest, setNewRequest] = useState({
    requested_module: '',
    requested_page: '',
    requested_permissions: [],
    urgency: 'medium',
    business_justification: ''
  })
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ===== DATA LOADING FUNCTIONS =====
  const loadRequests = async () => {
    try {
      const response = await fetch(`/api/role-management/access-requests?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    }
  }

  const loadSystemModules = async () => {
    try {
      const response = await fetch(`/api/role-management/system-modules?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSystemModules(data.modules || {})
      }
    } catch (error) {
      console.error('Error loading system modules:', error)
    }
  }

  const loadDatabases = async () => {
    try {
      const response = await fetch(`/api/role-management/databases?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDatabases(data.databases || [])
      }
    } catch (error) {
      console.error('Error loading databases:', error)
    }
  }

  useEffect(() => {
    if (selectedCompany) {
      setLoading(true)
      Promise.all([
        loadRequests(),
        loadSystemModules(),
        loadDatabases()
      ]).finally(() => {
        setLoading(false)
      })
    }
  }, [selectedCompany])

  // ===== REQUEST MANAGEMENT FUNCTIONS =====
  const handleCreateRequest = async () => {
    if (!newRequest.requested_module || !newRequest.business_justification) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    try {
      const response = await fetch(`/api/role-management/access-requests?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newRequest)
      })
      
      if (response.ok) {
        showToast('Access request submitted successfully', 'success')
        setShowRequestModal(false)
        setNewRequest({
          requested_module: '',
          requested_page: '',
          requested_permissions: [],
          urgency: 'medium',
          business_justification: ''
        })
        loadRequests()
      } else {
        showToast('Failed to submit access request', 'error')
      }
    } catch (error) {
      console.error('Error creating request:', error)
      showToast('Error submitting request', 'error')
    }
  }

  const handleReviewRequest = async (requestId, action, comments = '') => {
    try {
      const response = await fetch(`/api/role-management/access-requests/${requestId}/review?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, comments })
      })
      
      if (response.ok) {
        showToast(`Request ${action}d successfully`, 'success')
        setShowReviewModal(false)
        setSelectedRequest(null)
        loadRequests()
      } else {
        showToast(`Failed to ${action} request`, 'error')
      }
    } catch (error) {
      console.error('Error reviewing request:', error)
      showToast('Error processing request', 'error')
    }
  }

  // ===== FILTERED DATA =====
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requested_module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.business_justification?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || request.status === filter
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <AdminAuthWrapper>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <RoleManagementNavigation />
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-lg">Loading access requests...</span>
              </div>
            </div>
          </main>
        </div>
      </AdminAuthWrapper>
    )
  }

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
        <main className="p-6 space-y-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Navigation */}
            <RoleManagementNavigation />
            
            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Access Request Workflow
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Review and manage access requests for {selectedCompany}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Request</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setRefreshing(true)
                      loadRequests().finally(() => setRefreshing(false))
                    }}
                    disabled={refreshing}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {filteredRequests.length} requests
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{requests.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {requests.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Approved</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {requests.filter(r => r.status === 'approved').length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {requests.filter(r => r.status === 'rejected').length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Access Requests Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Access Requests</h2>
              </div>
              
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No access requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Requester</th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Module/Page</th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Permissions</th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Urgency</th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Status</th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Date</th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="p-4">
                            <div className="flex items-center">
                              <User className="h-8 w-8 text-gray-400 mr-3" />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{request.requester_name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{request.requester_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-gray-900 dark:text-white font-medium">{request.requested_module}</div>
                            {request.requested_page && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">{request.requested_page}</div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {request.requested_permissions?.slice(0, 2).map((permission) => (
                                <span key={permission} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded text-xs">
                                  {permission}
                                </span>
                              ))}
                              {request.requested_permissions?.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                  +{request.requested_permissions.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.urgency === 'high' 
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                                : request.urgency === 'medium'
                                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                                : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                            }`}>
                              {request.urgency}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'approved' 
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                                : request.status === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                                : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500 dark:text-gray-400">
                            {new Date(request.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setShowReviewModal(true)
                                }}
                                className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              
                              {request.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleReviewRequest(request.id, 'approve')}
                                    className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleReviewRequest(request.id, 'reject')}
                                    className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>

        {/* New Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Request Access</h2>
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Module Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    System Module *
                  </label>
                  <select
                    value={newRequest.requested_module}
                    onChange={(e) => setNewRequest({ ...newRequest, requested_module: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Module</option>
                    {Object.entries(systemModules).map(([moduleKey, module]) => (
                      <option key={moduleKey} value={moduleKey}>{module.name}</option>
                    ))}
                  </select>
                </div>

                {/* Page Selection */}
                {newRequest.requested_module && systemModules[newRequest.requested_module] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specific Page/Tab
                    </label>
                    <select
                      value={newRequest.requested_page}
                      onChange={(e) => setNewRequest({ ...newRequest, requested_page: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Page (Optional)</option>
                      {systemModules[newRequest.requested_module].tabs?.map((tab) => (
                        <option key={tab.id} value={tab.id}>{tab.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requested Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['read', 'write', 'delete', 'admin'].map((permission) => (
                      <label key={permission} className="flex items-center space-x-2 cursor-pointer p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={newRequest.requested_permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRequest(prev => ({
                                ...prev,
                                requested_permissions: [...prev.requested_permissions, permission]
                              }))
                            } else {
                              setNewRequest(prev => ({
                                ...prev,
                                requested_permissions: prev.requested_permissions.filter(p => p !== permission)
                              }))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          {permission === 'read' && <Eye className="h-4 w-4 text-blue-600" />}
                          {permission === 'write' && <Edit className="h-4 w-4 text-green-600" />}
                          {permission === 'delete' && <Trash2 className="h-4 w-4 text-red-600" />}
                          {permission === 'admin' && <Shield className="h-4 w-4 text-purple-600" />}
                          <span className="text-sm text-gray-900 dark:text-white capitalize">{permission}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Urgency Level
                  </label>
                  <select
                    value={newRequest.urgency}
                    onChange={(e) => setNewRequest({ ...newRequest, urgency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low - Can wait</option>
                    <option value="medium">Medium - Normal priority</option>
                    <option value="high">High - Urgent</option>
                  </select>
                </div>

                {/* Business Justification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Justification *
                  </label>
                  <textarea
                    value={newRequest.business_justification}
                    onChange={(e) => setNewRequest({ ...newRequest, business_justification: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Please explain why you need this access and how it will be used..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRequest}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Submit Request</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Request Details</h2>
                      <p className="text-gray-600 dark:text-gray-300">Review and take action on this request</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Requester Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Requester Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Name:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedRequest.requester_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Email:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedRequest.requester_email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Requested:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(selectedRequest.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Request Details</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Module:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedRequest.requested_module}</span>
                      </div>
                      {selectedRequest.requested_page && (
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">Page:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedRequest.requested_page}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Urgency:</span>
                        <span className={`text-sm font-medium capitalize ${
                          selectedRequest.urgency === 'high' ? 'text-red-600' :
                          selectedRequest.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {selectedRequest.urgency}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Requested Permissions</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.requested_permissions?.map((permission) => (
                      <span key={permission} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium capitalize">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Business Justification */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Business Justification</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-white">{selectedRequest.business_justification}</p>
                  </div>
                </div>

                {/* Review Actions */}
                {selectedRequest.status === 'pending' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Actions</h3>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleReviewRequest(selectedRequest.id, 'approve')}
                        className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve Request</span>
                      </button>
                      <button
                        onClick={() => handleReviewRequest(selectedRequest.id, 'reject')}
                        className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject Request</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              {toast.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-auto p-1 hover:bg-black hover:bg-opacity-20 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminAuthWrapper>
  )
}

export default AccessRequestWorkflow
