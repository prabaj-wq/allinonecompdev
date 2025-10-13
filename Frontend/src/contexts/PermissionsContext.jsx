import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

const PermissionsContext = createContext()

export const usePermissions = () => {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider')
  }
  return context
}

export const PermissionsProvider = ({ children }) => {
  const { user, isAuthenticated, selectedCompany } = useAuth()
  const [userPermissions, setUserPermissions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load user permissions when authenticated and company is selected
  useEffect(() => {
    if (isAuthenticated && selectedCompany && user) {
      loadUserPermissions()
    } else {
      setUserPermissions(null)
    }
  }, [isAuthenticated, selectedCompany, user])

  const loadUserPermissions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔐 Loading permissions for user:', user?.username, 'user object:', user, 'company:', selectedCompany)
      
      // Try different user ID properties
      const userId = user?.id || user?.user_id || user?.username
      if (!userId) {
        console.error('❌ No user ID found in user object:', user)
        setError('User ID not found')
        setUserPermissions(null)
        return
      }
      
      console.log('🔐 Using user ID:', userId)
      
      // First try to get user by ID, then fallback to username lookup
      let response = await fetch(`/api/role-management/users/${userId}?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      // If that fails and we used username, try a different approach
      if (!response.ok && typeof userId === 'string' && isNaN(userId)) {
        console.log('🔐 Trying username-based lookup for:', userId)
        response = await fetch(`/api/role-management/users?company_name=${encodeURIComponent(selectedCompany)}&username=${encodeURIComponent(userId)}`, {
          credentials: 'include'
        })
      }
      
      if (response.ok) {
        const data = await response.json()
        const permissions = data.user
        
        console.log('🔐 Loaded user permissions:', permissions)
        setUserPermissions(permissions)
      } else {
        console.error('Failed to load user permissions:', response.status)
        setError('Failed to load user permissions')
        setUserPermissions(null)
      }
    } catch (error) {
      console.error('Error loading user permissions:', error)
      setError('Error loading user permissions')
      setUserPermissions(null)
    } finally {
      setLoading(false)
    }
  }

  // Check if user has access to a specific page
  const hasPageAccess = (pagePath) => {
    // If permissions are loading or failed to load, deny access (no fallback)
    if (!userPermissions) {
      // Only allow access for the actual 'admin' username as a last resort
      if (user?.username === 'admin') {
        console.log('🔐 Granting access based on admin username fallback for:', pagePath)
        return true
      }
      console.log('🔐 No permissions loaded, denying access to:', pagePath)
      return false
    }
    
    if (!userPermissions.page_permissions) {
      console.log('🔐 No page permissions found, denying access to:', pagePath)
      return false
    }
    
    // Normalize the page path
    const normalizedPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`
    let hasAccess = userPermissions.page_permissions[normalizedPath] === true
    
    // Check if this is temporary access and if it has expired
    if (hasAccess && userPermissions.temporary_access && userPermissions.temporary_access[normalizedPath]) {
      const tempAccess = userPermissions.temporary_access[normalizedPath]
      if (tempAccess.granted_until) {
        const expiryDate = new Date(tempAccess.granted_until)
        const now = new Date()
        if (now > expiryDate) {
          console.log('🔐 Temporary access expired for:', normalizedPath, 'expired at:', expiryDate)
          hasAccess = false
        } else {
          console.log('🔐 Temporary access valid until:', expiryDate)
        }
      }
    }
    
    console.log('🔐 Page access check:', normalizedPath, 'hasAccess:', hasAccess)
    return hasAccess
  }

  // Check if user has access to a specific database
  const hasDatabaseAccess = (databaseName) => {
    if (!userPermissions || !userPermissions.database_permissions) {
      return false
    }
    
    const dbPerms = userPermissions.database_permissions[databaseName]
    if (!dbPerms) return false
    
    // User has access if they have any permission (read, write, or execute)
    return dbPerms.read || dbPerms.write || dbPerms.execute
  }

  // Get specific database permissions
  const getDatabasePermissions = (databaseName) => {
    if (!userPermissions || !userPermissions.database_permissions) {
      return { read: false, write: false, execute: false }
    }
    
    return userPermissions.database_permissions[databaseName] || { read: false, write: false, execute: false }
  }

  // Get all accessible databases
  const getAccessibleDatabases = () => {
    if (!userPermissions || !userPermissions.database_permissions) {
      return []
    }
    
    return Object.keys(userPermissions.database_permissions).filter(dbName => 
      hasDatabaseAccess(dbName)
    )
  }

  // Get all accessible pages
  const getAccessiblePages = () => {
    if (!userPermissions || !userPermissions.page_permissions) {
      return []
    }
    
    return Object.keys(userPermissions.page_permissions).filter(pagePath => 
      userPermissions.page_permissions[pagePath] === true
    )
  }

  // Check if user is admin (has access to role management)
  const isAdmin = () => {
    // Only check permission-based admin status, not the basic role field
    const adminByUsername = user?.username === 'admin'
    const adminByPermission = hasPageAccess('/rolemanagement')
    
    console.log('🔐 Admin check - by username:', adminByUsername, 'by permission:', adminByPermission)
    return adminByUsername || adminByPermission
  }

  // Filter databases based on user permissions
  const filterDatabasesByPermissions = (databases) => {
    if (!userPermissions || !Array.isArray(databases)) {
      return []
    }
    
    return databases.filter(db => {
      const dbName = typeof db === 'string' ? db : db.name
      return hasDatabaseAccess(dbName)
    })
  }

  // Refresh permissions
  const refreshPermissions = () => {
    if (isAuthenticated && selectedCompany && user) {
      loadUserPermissions()
    }
  }

  const value = {
    userPermissions,
    loading,
    error,
    hasPageAccess,
    hasDatabaseAccess,
    getDatabasePermissions,
    getAccessibleDatabases,
    getAccessiblePages,
    isAdmin,
    filterDatabasesByPermissions,
    refreshPermissions
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}
