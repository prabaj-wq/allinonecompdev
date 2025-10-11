import React, { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Lock, 
  Shield, 
  Database, 
  ChevronRight, 
  ChevronLeft,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react'

const UserCreationWizard = ({ isVisible, onClose, onUserCreated, selectedCompany }) => {
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
    
    if (!raw || typeof raw !== 'object') {
      return {}
    }

    const normalised = {}
    Object.keys(raw).forEach((database) => {
      const basePermissions = { read: false, write: false, execute: false }
      const rawPermissions = raw[database]

      if (typeof rawPermissions === 'object' && rawPermissions !== null) {
        // Handle object with read/write/execute properties
        Object.keys(basePermissions).forEach((key) => {
          const rawValue = rawPermissions[key]
          if (typeof rawValue === 'boolean') {
            basePermissions[key] = rawValue
          } else if (typeof rawValue === 'string') {
            basePermissions[key] = ['true', '1', 'yes', 'allow', 'allowed'].includes(rawValue.toLowerCase())
          }
        })

        // Handle permissions array within the object
        if (Array.isArray(rawPermissions.permissions)) {
          rawPermissions.permissions.forEach((permission) => {
            const normalisedPermission = String(permission).toLowerCase()
            if (normalisedPermission === 'full_access') {
              basePermissions.read = basePermissions.write = basePermissions.execute = true
            } else if (Object.prototype.hasOwnProperty.call(basePermissions, normalisedPermission)) {
              basePermissions[normalisedPermission] = true
            }
          })
        }
      } else if (Array.isArray(rawPermissions)) {
        const lowered = rawPermissions.map((permission) => String(permission).toLowerCase())
        if (lowered.includes('full_access')) {
          basePermissions.read = basePermissions.write = basePermissions.execute = true
        } else {
          Object.keys(basePermissions).forEach((key) => {
            if (lowered.includes(key)) {
              basePermissions[key] = true
            }
          })
        }
      } else if (typeof rawPermissions === 'string') {
        const lowered = rawPermissions.toLowerCase()
        if (lowered === 'full_access') {
          basePermissions.read = basePermissions.write = basePermissions.execute = true
        } else if (Object.prototype.hasOwnProperty.call(basePermissions, lowered)) {
          basePermissions[lowered] = true
        }
      } else if (typeof rawPermissions === 'boolean') {
        basePermissions.read = rawPermissions
      }

      normalised[database] = basePermissions
    })

    return normalised
  }

  const sanitizeRole = (role) => {
    if (!role) {
      return role
    }

    return {
      ...role,
      page_permissions: normalizePagePermissions(role.page_permissions),
      database_permissions: normalizeDatabasePermissions(role.database_permissions)
    }
  }

  const [currentStep, setCurrentStep] = useState(1)
  const [roles, setRoles] = useState([])
  const [databases, setDatabases] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // User data state
  const [userData, setUserData] = useState({
    // Step 1: Basic Info
    username: '',
    email: '',
    full_name: '',
    department: '',
    position: '',
    phone: '',
    password: '',
    role_id: '',
    
    // Step 2: Page Permissions (inherited from role but customizable)
    page_permissions: {},
    
    // Step 3: Database Permissions (inherited from role but customizable)
    database_permissions: {}
  })
  
  const [selectedRole, setSelectedRole] = useState(null)
  const [errors, setErrors] = useState({})

  // Load roles and databases
  useEffect(() => {
    if (isVisible) {
      loadRoles()
      loadDatabases()
    }
  }, [isVisible, selectedCompany])

  const loadRoles = async () => {
    try {
      const response = await fetch(`/api/role-management/roles?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const normalisedRoles = (data.roles || []).map((role) => sanitizeRole(role))
        setRoles(normalisedRoles)
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
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
      console.error('Failed to load databases:', error)
    }
  }

  // Handle role selection and inherit permissions
  const handleRoleChange = (roleId) => {
    const role = roles.find(r => r.id === parseInt(roleId))
    const safeRole = sanitizeRole(role)
    setSelectedRole(safeRole)

    const inheritedPagePermissions = safeRole ? { ...normalizePagePermissions(safeRole.page_permissions) } : {}
    const inheritedDatabasePermissions = safeRole ? { ...normalizeDatabasePermissions(safeRole.database_permissions) } : {}

    setUserData(prev => ({
      ...prev,
      role_id: roleId,
      page_permissions: inheritedPagePermissions,
      database_permissions: inheritedDatabasePermissions
    }))
  }

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {}
    if (!userData.username.trim()) newErrors.username = 'Username is required'
    if (!userData.email.trim()) newErrors.email = 'Email is required'
    if (!userData.full_name.trim()) newErrors.full_name = 'Full name is required'
    if (!userData.password.trim()) newErrors.password = 'Password is required'
    if (!userData.role_id) newErrors.role_id = 'Role is required'
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (userData.email && !emailRegex.test(userData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/role-management/users?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...userData,
          company_name: selectedCompany
        })
      })

      if (response.ok) {
        const result = await response.json()
        onUserCreated(result.user)
        onClose()
        resetForm()
      } else {
        const error = await response.json()
        setErrors({ submit: error.detail || 'Failed to create user' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setUserData({
      username: '', email: '', full_name: '', department: '', position: '', 
      phone: '', password: '', role_id: '', page_permissions: {}, database_permissions: {}
    })
    setSelectedRole(null)
    setErrors({})
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Create New User</h2>
              <p className="text-blue-100 mt-1">Step {currentStep} of 3</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6 flex items-center">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  step <= currentStep ? 'bg-white text-blue-600' : 'bg-blue-400 text-white'
                }`}>
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-colors ${
                    step < currentStep ? 'bg-white' : 'bg-blue-400'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Step Labels */}
          <div className="mt-2 flex justify-between text-sm text-blue-100">
            <span>Basic Information</span>
            <span>Page Access</span>
            <span>Database Access</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="h-4 w-4 mr-2" />
                    Username *
                  </label>
                  <input
                    type="text"
                    value={userData.username}
                    onChange={(e) => setUserData(prev => ({ ...prev, username: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="Enter username"
                  />
                  {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="h-4 w-4 mr-2" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Full Name */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="h-4 w-4 mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={userData.full_name}
                    onChange={(e) => setUserData(prev => ({ ...prev, full_name: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.full_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="Enter full name"
                  />
                  {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
                </div>

                {/* Role */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Shield className="h-4 w-4 mr-2" />
                    Role *
                  </label>
                  <select
                    value={userData.role_id}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.role_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white`}
                  >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  {errors.role_id && <p className="text-red-500 text-sm mt-1">{errors.role_id}</p>}
                </div>

                {/* Department */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building className="h-4 w-4 mr-2" />
                    Department
                  </label>
                  <input
                    type="text"
                    value={userData.department}
                    onChange={(e) => setUserData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter department"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Position
                  </label>
                  <input
                    type="text"
                    value={userData.position}
                    onChange={(e) => setUserData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter position"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Lock className="h-4 w-4 mr-2" />
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userData.password}
                      onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>
              </div>

              {/* Role Preview */}
              {selectedRole && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Selected Role: {selectedRole.name}</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{selectedRole.description}</p>
                  <div className="mt-2 flex items-center text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedRole.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                      selectedRole.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedRole.risk_level?.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Page Permissions */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Page Access Permissions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  These permissions are inherited from the selected role. You can customize them for this specific user.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(userData.page_permissions).map(([page, enabled]) => (
                  <div key={page} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{page.replace('/', '').replace('-', ' ').toUpperCase()}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Access to {page} module</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setUserData(prev => ({
                          ...prev,
                          page_permissions: {
                            ...prev.page_permissions,
                            [page]: e.target.checked
                          }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Database Permissions */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Database Access Permissions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Configure database-level access permissions. These will create actual database users with specified privileges.
                </p>
              </div>

              <div className="space-y-4">
                {databases.map(database => {
                  const dbPerms = userData.database_permissions[database.name] || { read: false, write: false, execute: false }
                  return (
                    <div key={database.name} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                            <Database className="h-4 w-4 mr-2" />
                            {database.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Database access configuration</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {['read', 'write', 'execute'].map(permission => (
                          <label key={permission} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={dbPerms[permission]}
                              onChange={(e) => setUserData(prev => ({
                                ...prev,
                                database_permissions: {
                                  ...prev.database_permissions,
                                  [database.name]: {
                                    ...dbPerms,
                                    [permission]: e.target.checked
                                  }
                                }
                              }))}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                              {permission}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Error Display */}
          {errors.submit && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700 dark:text-red-300">{errors.submit}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create User
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserCreationWizard
