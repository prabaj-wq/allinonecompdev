import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useCompany } from '../../contexts/CompanyContext'
import {
  Users,
  Shield,
  Activity,
  AlertTriangle,
  UserCheck,
  Database,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  Eye,
  Zap,
  Clock,
  Calendar,
  Settings,
  Lock,
  Unlock,
  Monitor,
  FileText
} from 'lucide-react'
import AdminAuthWrapper from './components/AdminAuthWrapper'
import RoleManagementNavigation from './components/RoleManagementNavigation'
import UserCreationWizard from './components/UserCreationWizard'

const UserAccessDashboard = () => {
  // ===== CONTEXT HOOKS =====
  const { selectedCompany: authSelectedCompany } = useAuth()
  const { selectedCompany: companyContextCompany } = useCompany()
  
  // Use the company from auth context as primary, fallback to company context
  const selectedCompany = authSelectedCompany || companyContextCompany
  
  const parseJsonField = (value, fallback = {}) => {
    if (value === null || value === undefined) {
      return fallback
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return parsed ?? fallback
      } catch (error) {
        return fallback
      }
    }
    if (typeof value === 'object') {
      return value
    }
    return fallback
  }

  const normalizePagePermissions = (value) => {
    const raw = parseJsonField(value, {})
    if (Array.isArray(raw)) {
      return raw.reduce((acc, route) => {
        if (typeof route === 'string') {
          acc[route] = true
        }
        return acc
      }, {})
    }
    if (raw && typeof raw === 'object') {
      return Object.keys(raw).reduce((acc, key) => {
        const permissionValue = raw[key]
        if (typeof permissionValue === 'boolean') {
          acc[key] = permissionValue
        } else if (typeof permissionValue === 'string') {
          acc[key] = ['true', '1', 'yes', 'access', 'allowed', 'full_access'].includes(permissionValue.toLowerCase())
        } else if (permissionValue && typeof permissionValue === 'object') {
          acc[key] = Object.values(permissionValue).some(Boolean)
        } else {
          acc[key] = Boolean(permissionValue)
        }
        return acc
      }, {})
    }
    return {}
  }

  const normalizeDatabasePermissions = (value) => {
    const raw = parseJsonField(value, {})
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {}
    }

    const normalised = {}

    Object.entries(raw).forEach(([database, permissions]) => {
      const basePermissions = { read: false, write: false, execute: false }

      if (permissions && typeof permissions === 'object' && !Array.isArray(permissions)) {
        Object.keys(basePermissions).forEach((key) => {
          const rawValue = permissions[key]
          if (typeof rawValue === 'boolean') {
            basePermissions[key] = rawValue
          } else if (typeof rawValue === 'string') {
            basePermissions[key] = ['true', '1', 'yes', 'allow', 'allowed'].includes(rawValue.toLowerCase())
          }
        })

        if (Array.isArray(permissions.permissions)) {
          permissions.permissions.forEach((permission) => {
            const normalisedPermission = String(permission).toLowerCase()
            if (normalisedPermission === 'full_access') {
              basePermissions.read = basePermissions.write = basePermissions.execute = true
            } else if (Object.prototype.hasOwnProperty.call(basePermissions, normalisedPermission)) {
              basePermissions[normalisedPermission] = true
            }
          })
        }
      } else if (Array.isArray(permissions)) {
        const lowered = permissions.map((permission) => String(permission).toLowerCase())
        if (lowered.includes('full_access')) {
          basePermissions.read = basePermissions.write = basePermissions.execute = true
        } else {
          Object.keys(basePermissions).forEach((key) => {
            if (lowered.includes(key)) {
              basePermissions[key] = true
            }
          })
        }
      } else if (typeof permissions === 'string') {
        const lowered = permissions.toLowerCase()
        if (lowered === 'full_access') {
          basePermissions.read = basePermissions.write = basePermissions.execute = true
        } else if (Object.prototype.hasOwnProperty.call(basePermissions, lowered)) {
          basePermissions[lowered] = true
        }
      } else if (typeof permissions === 'boolean') {
        basePermissions.read = permissions
      }

      normalised[database] = basePermissions
    })

    return normalised
  }

  const sanitizeUser = (user) => {
    if (!user) {
      return user
    }

    const metadata = user.metadata || {}

    return {
      ...user,
      metadata,
      full_name: user.full_name || metadata.full_name || user.username,
      department: user.department || metadata.department || '',
      position: user.position || metadata.position || '',
      phone: user.phone || metadata.phone || '',
      page_permissions: normalizePagePermissions(user.page_permissions || metadata.page_permissions),
      database_permissions: normalizeDatabasePermissions(user.database_permissions || metadata.database_permissions)
    }
  }

  // ===== STATE MANAGEMENT =====
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [databases, setDatabases] = useState([])
  const [systemModules, setSystemModules] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    full_name: '',
    role_id: '',
    database_access: [],
    permissions: {},
    department: '',
    position: '',
    phone: '',
    temporary_password: ''
  })
  const [showAccessTestModal, setShowAccessTestModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [userActivity, setUserActivity] = useState([])
  const [testingUser, setTestingUser] = useState(null)
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  const loadUsers = async () => {
    if (!selectedCompany) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/role-management/users?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const cleanedUsers = (data.users || []).map((user) => sanitizeUser(user))
        setUsers(cleanedUsers)
      } else {
        const error = await response.json().catch(() => ({}))
        const errorMessage = error && error.detail ? error.detail : 'Failed to load users'
        showToast(errorMessage, 'error')
        setUsers([])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      showToast('Error loading users', 'error')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    if (!selectedCompany) return
    
    try {
      const response = await fetch(`/api/role-management/roles?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setRoles(Array.isArray(data.roles) ? data.roles : [])
      } else {
        showToast('Failed to load roles', 'error')
        setRoles([])
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      showToast('Error loading roles', 'error')
      setRoles([])
    }
  }

  const loadDatabases = async () => {
    if (!selectedCompany) return
    
    try {
      const response = await fetch(`/api/role-management/databases?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDatabases(Array.isArray(data.databases) ? data.databases : [])
      } else {
        setDatabases([])
      }
    } catch (error) {
      console.error('Error loading databases:', error)
      setDatabases([])
    }
  }

  const loadSystemModules = async () => {
    if (!selectedCompany) return
    
    try {
      const response = await fetch(`/api/role-management/system-modules?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSystemModules(data.modules && typeof data.modules === 'object' ? data.modules : {})
      } else {
        setSystemModules({})
      }
    } catch (error) {
      console.error('Error loading system modules:', error)
      setSystemModules({})
    }
  }

  const fetchUserDetails = async (userId) => {
    try {
      const response = await fetch(`/api/role-management/users/${userId}?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSelectedUser(data.user ? sanitizeUser(data.user) : null)
        setShowUserDetails(true)
      } else {
        showToast('Failed to fetch user details', 'error')
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      showToast('Error fetching user details', 'error')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([loadUsers(), loadRoles(), loadDatabases(), loadSystemModules()])
      showToast('Data refreshed successfully', 'success')
    } catch (error) {
      showToast('Failed to refresh data', 'error')
    } finally {
      setRefreshing(false)
    }
  };

  const handleQuickAction = (actionId) => {
    console.log(`Quick action triggered: ${actionId}`);
    // Handle quick action logic here
  };

  useEffect(() => {
    if (selectedCompany) {
      setLoading(true)
      Promise.all([loadUsers(), loadRoles(), loadDatabases(), loadSystemModules()]).finally(() => {
        setLoading(false)
      })
    }
  }, [selectedCompany])

  // ===== USER MANAGEMENT FUNCTIONS =====
  const handleAddUser = () => {
    setNewUser({
      email: '',
      username: '',
      full_name: '',
      role_id: '',
      database_access: [],
      permissions: {},
      department: '',
      position: '',
      phone: '',
      temporary_password: ''
    })
    setShowAddUserModal(true)
  }

  const handlePermissionToggle = (module, permission) => {
    setNewUser(prev => {
      const newPermissions = { ...prev.permissions }
      if (!newPermissions[module]) {
        newPermissions[module] = []
      }
      
      const permissionIndex = newPermissions[module].indexOf(permission)
      if (permissionIndex > -1) {
        newPermissions[module].splice(permissionIndex, 1)
        if (newPermissions[module].length === 0) {
          delete newPermissions[module]
        }
      } else {
        newPermissions[module].push(permission)
      }
      
      return { ...prev, permissions: newPermissions }
    })
  }

  const handleDatabaseToggle = (database) => {
    setNewUser(prev => {
      const newDatabaseAccess = [...prev.database_access]
      const dbIndex = newDatabaseAccess.indexOf(database)
      
      if (dbIndex > -1) {
        newDatabaseAccess.splice(dbIndex, 1)
      } else {
        newDatabaseAccess.push(database)
      }
      
      return { ...prev, database_access: newDatabaseAccess }
    })
  }

  // ===== FILTERED DATA =====
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    if (!user || typeof user !== 'object') return false
    
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role_id === filterRole
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active)
    
    return matchesSearch && matchesRole && matchesStatus
  }) : []

  // ===== ACCESS TESTING FUNCTIONS =====
  const handleTestAccess = async (user) => {
    setTestingUser(user)
    setShowAccessTestModal(true)
    
    try {
      const response = await fetch(`/api/role-management/check-access?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: user.id })
      })
      
      if (response.ok) {
        const data = await response.json()
        setTestResults(data.access_results)
      } else {
        showToast('Failed to test user access', 'error')
      }
    } catch (error) {
      console.error('Error testing access:', error)
      showToast('Error testing user access', 'error')
    }
  }

  const loadUserActivity = async (user) => {
    setTestingUser(user)
    setShowActivityModal(true)
    
    try {
      const response = await fetch(`/api/role-management/user-activity/${user.id}?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserActivity(data.activities || [])
      } else {
        showToast('Failed to load user activity', 'error')
      }
    } catch (error) {
      console.error('Error loading activity:', error)
      showToast('Error loading user activity', 'error')
    }
  }

  const handleCreateUser = async () => {
    if (!selectedCompany) {
      showToast('No company selected', 'error')
      return
    }

    if (!newUser.email.trim() || !newUser.username.trim()) {
      showToast('Email and username are required', 'error')
      return
    }

    try {
      const response = await fetch(`/api/role-management/users?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newUser)
      })
      
      if (response.ok) {
        showToast('User created successfully', 'success')
        setShowAddUserModal(false)
        setNewUser({
          email: '',
          username: '',
          full_name: '',
          role_id: '',
          database_access: [],
          permissions: {},
          department: '',
          position: '',
          phone: '',
          temporary_password: ''
        })
        loadUsers() // Refresh users list
      } else {
        const error = await response.json().catch(() => ({ detail: 'Failed to create user' }))
        showToast(error.detail || 'Failed to create user', 'error')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      showToast('Error creating user', 'error')
    }
  }

  // Early return if no company selected
  if (!selectedCompany) {
    return (
      <AdminAuthWrapper>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Company Selected</h2>
            <p className="text-gray-600 dark:text-gray-300">Please select a company to access the user dashboard.</p>
          </div>
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
            
            {/* Role Management Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Role Management System
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Complete access control and permission management for {selectedCompany}
                  </p>
                </div>
              </div>
              
              {/* Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a href="/rolemanagement/user-access-dashboard" className="block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">User Access Dashboard</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Monitor and manage user permissions</p>
                    </div>
                  </div>
                </a>
                
                <a href="/rolemanagement/role-profile-management" className="block p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Role Profile Management</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Configure user roles and permissions</p>
                    </div>
                  </div>
                </a>
                
                <a href="/rolemanagement/permission-matrix-management" className="block p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Permission Matrix</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Detailed permission configuration</p>
                    </div>
                  </div>
                </a>
                
                <a href="/rolemanagement/compliance-audit-center" className="block p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Compliance & Audit</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Monitor system activities and compliance</p>
                    </div>
                  </div>
                </a>
                
                <a href="/rolemanagement/access-request-workflow" className="block p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Access Requests</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Review and manage access requests</p>
                    </div>
                  </div>
                </a>
                
              </div>
            </div>

            {/* Current Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    User Access Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Manage user access and permissions for {selectedCompany}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button 
                    onClick={handleAddUser}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add User</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Roles</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{roles.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Sessions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.filter(u => u.is_active).length}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <Activity className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Security Alerts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Role Filter */}
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Roles</option>
                    {roles.map((role) => {
                      const roleId = role?.id || role?.name || Math.random().toString()
                      const roleName = role?.name || role?.display_name || role?.id || 'Unknown Role'
                      return (
                        <option key={roleId} value={roleId}>{roleName}</option>
                      )
                    })}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {filteredUsers.length} users
                  </span>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h2>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">User</th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Role</th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Database Access</th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Status</th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Last Login</th>
                        <th className="text-left p-4 text-gray-900 dark:text-white font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers.map((user) => {
                        if (!user || !user.id) return null
                        
                        return (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="p-4">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{user.full_name || 'Unknown User'}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.email || 'No Email'}</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">@{user.username || 'no-username'}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                                {user.role_name || 'No Role'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(user.database_access) && user.database_access.slice(0, 2).map((db, index) => (
                                  <span key={`${user.id}-db-${index}`} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 rounded text-xs">
                                    {typeof db === 'string' ? db : db?.name || 'Unknown DB'}
                                  </span>
                                ))}
                                {Array.isArray(user.database_access) && user.database_access.length > 2 && (
                                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                    +{user.database_access.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.is_active 
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                                  : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                              }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-gray-500 dark:text-gray-400">
                              {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => fetchUserDetails(user.id)}
                                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleTestAccess(user)}
                                  className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                  title="Test Access"
                                >
                                  <Zap className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => loadUserActivity(user)}
                                  className="p-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                  title="View Activity"
                                >
                                  <Activity className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }).filter(Boolean)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>

        {/* User Creation Wizard */}
        <UserCreationWizard
          isVisible={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onUserCreated={(newUser) => {
            const normalizedUser = sanitizeUser(newUser)
            setUsers(prev => [normalizedUser, ...prev])
            showToast('User created successfully with database access!', 'success')
            setShowAddUserModal(false)
            loadUsers() // Refresh the user list
          }}
          selectedCompany={selectedCompany}
        />

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.full_name}</h2>
                      <p className="text-gray-600 dark:text-gray-300">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Role</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600">{selectedUser.role_name || 'No Role'}</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Database className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Database Access</span>
                    </div>
                    <p className="text-lg font-bold text-green-600">{selectedUser.database_access?.length || 0}</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Status</span>
                    </div>
                    <p className={`text-lg font-bold ${selectedUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Access</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.database_access?.map((db) => (
                      <span key={db} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                        {db}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedUser.permissions || {}).map(([module, permissions]) => (
                      <div key={module} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 capitalize">
                          {module.replace('_', ' ')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(permissions) && permissions.map((permission) => (
                            <span
                              key={permission}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Access Test Modal */}
        {showAccessTestModal && testingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Test Results</h2>
                      <p className="text-gray-600 dark:text-gray-300">Testing access for {testingUser.full_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAccessTestModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {testResults ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-gray-900 dark:text-white">Accessible Modules</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{testResults.accessible_modules?.length || 0}</p>
                      </div>
                      
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lock className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-gray-900 dark:text-white">Restricted Modules</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600">{testResults.restricted_modules?.length || 0}</p>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Database className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-gray-900 dark:text-white">Database Access</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{testResults.database_access?.length || 0}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accessible Modules</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testResults.accessible_modules?.map((module) => (
                          <div key={module.name} className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                            <div className="flex items-center space-x-2 mb-2">
                              <Unlock className="h-4 w-4 text-green-600" />
                              <h4 className="font-medium text-gray-900 dark:text-white">{module.name}</h4>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {module.permissions?.map((permission) => (
                                <span key={permission} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Restricted Modules</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testResults.restricted_modules?.map((module) => (
                          <div key={module.name} className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                            <div className="flex items-center space-x-2 mb-2">
                              <Lock className="h-4 w-4 text-red-600" />
                              <h4 className="font-medium text-gray-900 dark:text-white">{module.name}</h4>
                            </div>
                            <p className="text-sm text-red-600">Access Denied</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Access</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {testResults.database_access?.map((db) => (
                          <div key={db.name} className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                            <div className="flex items-center space-x-2 mb-2">
                              <Database className="h-4 w-4 text-blue-600" />
                              <h4 className="font-medium text-gray-900 dark:text-white">{db.name}</h4>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {db.permissions?.map((permission) => (
                                <span key={permission} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-lg">Testing user access...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Modal */}
        {showActivityModal && testingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Activity</h2>
                      <p className="text-gray-600 dark:text-gray-300">Activity history for {testingUser.full_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowActivityModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {userActivity.length > 0 ? (
                  <div className="space-y-4">
                    {userActivity.map((activity, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            {activity.action === 'login' && <Monitor className="h-4 w-4 text-green-600" />}
                            {activity.action === 'logout' && <X className="h-4 w-4 text-red-600" />}
                            {activity.action === 'access' && <Eye className="h-4 w-4 text-blue-600" />}
                            {activity.action === 'permission_change' && <Settings className="h-4 w-4 text-orange-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                                {activity.action.replace('_', ' ')}
                              </h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(activity.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{activity.description}</p>
                            {activity.resource && (
                              <div className="mt-2">
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded text-xs">
                                  {activity.resource}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No activity found for this user</p>
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

export default UserAccessDashboard
