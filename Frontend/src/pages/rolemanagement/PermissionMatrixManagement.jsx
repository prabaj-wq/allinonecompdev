import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useCompany } from '../../contexts/CompanyContext'
import { 
  Shield, 
  Database, 
  Users, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Calculator,
  Building,
  List,
  Workflow,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  Search,
  Filter
} from 'lucide-react'
import AdminAuthWrapper from './components/AdminAuthWrapper'
import RoleManagementNavigation from './components/RoleManagementNavigation'

const PermissionMatrixManagement = () => {
  // ===== CONTEXT HOOKS =====
  const { selectedCompany: authSelectedCompany } = useAuth()
  const { selectedCompany: companyContextCompany } = useCompany()
  
  // Use the company from auth context as primary, fallback to company context
  const selectedCompany = authSelectedCompany || companyContextCompany
  
  // ===== STATE MANAGEMENT =====
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [databases, setDatabases] = useState([])
  const [systemModules, setSystemModules] = useState({})
  const [expandedModules, setExpandedModules] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [viewMode, setViewMode] = useState('matrix') // 'matrix' or 'cards'
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // System modules with hierarchical structure
  const coreSystemModules = {
    'core_system': {
      name: 'Core System',
      icon: Settings,
      tabs: [
        { id: 'dashboard', name: 'Dashboard', description: 'Main dashboard access' },
        { id: 'user_management', name: 'User Management', description: 'Manage users and profiles' },
        { id: 'role_management', name: 'Role Management', description: 'Configure roles and permissions' },
        { id: 'system_settings', name: 'System Settings', description: 'System configuration' }
      ]
    },
    'financial_tools': {
      name: 'Financial Tools',
      icon: Calculator,
      tabs: [
        { id: 'financial_reports', name: 'Financial Reports', description: 'Generate financial reports' },
        { id: 'budgeting', name: 'Budgeting', description: 'Budget planning and management' },
        { id: 'forecasting', name: 'Forecasting', description: 'Financial forecasting tools' },
        { id: 'analytics', name: 'Analytics', description: 'Financial analytics and insights' }
      ]
    },
    'entity_management': {
      name: 'Entity Management',
      icon: Building,
      tabs: [
        { id: 'entities', name: 'Entities', description: 'Manage business entities' },
        { id: 'hierarchies', name: 'Hierarchies', description: 'Entity hierarchy management' },
        { id: 'consolidation', name: 'Consolidation', description: 'Entity consolidation' }
      ]
    },
    'reporting': {
      name: 'Reporting',
      icon: BarChart3,
      tabs: [
        { id: 'standard_reports', name: 'Standard Reports', description: 'Pre-built reports' },
        { id: 'custom_reports', name: 'Custom Reports', description: 'Create custom reports' },
        { id: 'export_tools', name: 'Export Tools', description: 'Data export capabilities' }
      ]
    },
    'audit_compliance': {
      name: 'Audit & Compliance',
      icon: Eye,
      tabs: [
        { id: 'audit_logs', name: 'Audit Logs', description: 'System audit trails' },
        { id: 'compliance_reports', name: 'Compliance Reports', description: 'Regulatory compliance' },
        { id: 'security_monitoring', name: 'Security Monitoring', description: 'Security oversight' }
      ]
    }
  }

  const databasePermissions = ['read', 'write', 'execute', 'admin'];

  // Permission matrix state - now dynamic based on loaded roles and modules
  const [matrix, setMatrix] = useState({})
  const [databaseMatrix, setDatabaseMatrix] = useState({})

  // ===== DATA LOADING FUNCTIONS =====
  const loadRoles = async () => {
    try {
      const response = await fetch(`/api/role-management/roles?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Error loading roles:', error)
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

  const loadSystemModules = async () => {
    try {
      const response = await fetch(`/api/role-management/system-modules?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSystemModules({ ...coreSystemModules, ...data.modules })
      } else {
        setSystemModules(coreSystemModules)
      }
    } catch (error) {
      console.error('Error loading system modules:', error)
      setSystemModules(coreSystemModules)
    }
  }

  const loadPermissionMatrix = async () => {
    try {
      const response = await fetch(`/api/role-management/permission-matrix?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setMatrix(data.matrix || {})
        setDatabaseMatrix(data.database_matrix || {})
      }
    } catch (error) {
      console.error('Error loading permission matrix:', error)
    }
  }

  useEffect(() => {
    if (selectedCompany) {
      setLoading(true)
      Promise.all([
        loadRoles(),
        loadDatabases(), 
        loadSystemModules(),
        loadPermissionMatrix()
      ]).finally(() => {
        setLoading(false)
      })
    }
  }, [selectedCompany])

  // ===== PERMISSION MANAGEMENT FUNCTIONS =====
  const toggleModuleExpansion = (moduleKey) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }))
  }

  const togglePermission = (roleId, module, permission) => {
    setMatrix(prev => {
      const rolePerms = prev[roleId] || {}
      const modulePerms = rolePerms[module] || []
      const hasPermission = modulePerms.includes(permission)
      
      const newModulePerms = hasPermission
        ? modulePerms.filter(p => p !== permission)
        : [...modulePerms, permission]
      
      return {
        ...prev,
        [roleId]: {
          ...rolePerms,
          [module]: newModulePerms
        }
      }
    })
  }

  const toggleDatabasePermission = (roleId, database, permission) => {
    setDatabaseMatrix(prev => {
      const rolePerms = prev[roleId] || {}
      const dbPerms = rolePerms[database] || []
      const hasPermission = dbPerms.includes(permission)
      
      const newDbPerms = hasPermission
        ? dbPerms.filter(p => p !== permission)
        : [...dbPerms, permission]
      
      return {
        ...prev,
        [roleId]: {
          ...rolePerms,
          [database]: newDbPerms
        }
      }
    })
  }

  const hasPermission = (roleId, module, permission) => {
    return matrix[roleId]?.[module]?.includes(permission) || false
  }

  const hasDatabasePermission = (roleId, database, permission) => {
    return databaseMatrix[roleId]?.[database]?.includes(permission) || false
  }

  // ===== FILTERED DATA =====
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterRole === 'all' || role.id === filterRole
    return matchesSearch && matchesFilter
  })

  const handleSaveMatrix = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/role-management/permission-matrix?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          matrix, 
          database_matrix: databaseMatrix,
          company: selectedCompany 
        })
      })
      
      if (response.ok) {
        showToast('Permission matrix saved successfully!', 'success')
      } else {
        showToast('Failed to save permission matrix', 'error')
      }
    } catch (error) {
      console.error('Error saving matrix:', error)
      showToast('Failed to save permission matrix', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminAuthWrapper>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <RoleManagementNavigation />
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-lg">Loading permission matrix...</span>
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
                    Visual Permission Matrix
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Configure role-based permissions with visual matrix for {selectedCompany}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('matrix')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'matrix' 
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Matrix View
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'cards' 
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Cards View
                    </button>
                  </div>
                  
                  <button
                    onClick={handleSaveMatrix}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{saving ? 'Saving...' : 'Save Matrix'}</span>
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
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Roles</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {filteredRoles.length} roles • {Object.keys(systemModules).length} modules • {databases.length} databases
                  </span>
                </div>
              </div>
            </div>

            {viewMode === 'matrix' ? (
              /* Matrix View */
              <div className="space-y-8">
                {/* System Modules Matrix */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                      <Settings className="h-6 w-6 mr-2 text-blue-600" />
                      System Modules Permissions
                    </h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="text-left p-4 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-600 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                            Role
                          </th>
                          {Object.entries(systemModules).map(([moduleKey, module]) => {
                            const IconComponent = module.icon
                            return (
                              <th key={moduleKey} className="text-center p-4 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-600 min-w-[200px]">
                                <div className="flex items-center justify-center space-x-2">
                                  <IconComponent size={16} className="text-blue-600 dark:text-blue-400" />
                                  <span>{module.name}</span>
                                </div>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRoles.map((role) => (
                          <tr key={role.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="p-4 font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span>{role.name}</span>
                              </div>
                            </td>
                            {Object.entries(systemModules).map(([moduleKey, module]) => (
                              <td key={`${role.id}-${moduleKey}`} className="p-4">
                                <div className="space-y-2">
                                  {module.tabs?.map((tab) => {
                                    const isChecked = hasPermission(role.id, tab.id, 'access')
                                    return (
                                      <label key={tab.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => togglePermission(role.id, tab.id, 'access')}
                                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{tab.name}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Database Access Matrix */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                      <Database className="h-6 w-6 mr-2 text-green-600" />
                      Database Access Permissions
                    </h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="text-left p-4 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-600 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                            Role
                          </th>
                          {databases.map((database) => (
                            <th key={database} className="text-center p-4 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-600 min-w-[200px]">
                              <div className="flex items-center justify-center space-x-2">
                                <Database size={16} className="text-green-600 dark:text-green-400" />
                                <span>{database}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRoles.map((role) => (
                          <tr key={role.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="p-4 font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span>{role.name}</span>
                              </div>
                            </td>
                            {databases.map((database) => (
                              <td key={`${role.id}-${database}`} className="p-4">
                                <div className="grid grid-cols-2 gap-2">
                                  {databasePermissions.map((permission) => {
                                    const isChecked = hasDatabasePermission(role.id, database, permission)
                                    const permissionColors = {
                                      read: 'text-blue-600',
                                      write: 'text-yellow-600', 
                                      execute: 'text-purple-600',
                                      admin: 'text-red-600'
                                    }
                                    return (
                                      <label key={permission} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => toggleDatabasePermission(role.id, database, permission)}
                                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className={`text-sm capitalize ${permissionColors[permission]}`}>
                                          {permission}
                                        </span>
                                      </label>
                                    )
                                  })}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* Cards View */
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRoles.map((role) => (
                  <div key={role.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Role Permissions</p>
                      </div>
                    </div>

                    {/* System Modules */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">System Modules</h4>
                      <div className="space-y-3">
                        {Object.entries(systemModules).map(([moduleKey, module]) => {
                          const IconComponent = module.icon
                          return (
                            <div key={moduleKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <IconComponent className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{module.name}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                {module.tabs?.slice(0, 4).map((tab) => {
                                  const isChecked = hasPermission(role.id, tab.id, 'access')
                                  return (
                                    <label key={tab.id} className="flex items-center space-x-1 cursor-pointer text-xs">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => togglePermission(role.id, tab.id, 'access')}
                                        className="w-3 h-3 text-blue-600"
                                      />
                                      <span className="text-gray-700 dark:text-gray-300 truncate">{tab.name}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Database Access */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Database Access</h4>
                      <div className="space-y-2">
                        {databases.slice(0, 3).map((database) => (
                          <div key={database} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Database className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{database}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {databasePermissions.map((permission) => {
                                const isChecked = hasDatabasePermission(role.id, database, permission)
                                return (
                                  <label key={permission} className="flex items-center space-x-1 cursor-pointer text-xs">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleDatabasePermission(role.id, database, permission)}
                                      className="w-3 h-3 text-blue-600"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300 capitalize">{permission}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

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

export default PermissionMatrixManagement
