import React, { useState, useEffect } from 'react'
import { usePermissions } from '../contexts/PermissionsContext'
import { useAuth } from '../hooks/useAuth'
import { Database, ChevronDown, Lock } from 'lucide-react'

const DatabaseSelector = ({ 
  selectedDatabase, 
  onDatabaseChange, 
  className = "",
  placeholder = "Select Database",
  showPermissions = false 
}) => {
  const { selectedCompany } = useAuth()
  const { filterDatabasesByPermissions, getDatabasePermissions, isAdmin } = usePermissions()
  const [databases, setDatabases] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (selectedCompany) {
      loadDatabases()
    }
  }, [selectedCompany])

  const loadDatabases = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/role-management/databases?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const allDatabases = data.databases || []
        
        // Filter databases based on user permissions (unless user is admin)
        const accessibleDatabases = isAdmin() ? allDatabases : filterDatabasesByPermissions(allDatabases)
        
        console.log('🗄️ All databases:', allDatabases.length)
        console.log('🔐 Accessible databases:', accessibleDatabases.length)
        
        setDatabases(accessibleDatabases)
      }
    } catch (error) {
      console.error('Error loading databases:', error)
      setDatabases([])
    } finally {
      setLoading(false)
    }
  }

  const handleDatabaseSelect = (database) => {
    onDatabaseChange(database)
    setIsOpen(false)
  }

  const getSelectedDatabaseName = () => {
    if (!selectedDatabase) return placeholder
    return typeof selectedDatabase === 'string' ? selectedDatabase : selectedDatabase.name
  }

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <div className="flex items-center">
            <Database className="h-4 w-4 mr-2 animate-pulse" />
            <span>Loading databases...</span>
          </div>
        </div>
      </div>
    )
  }

  if (databases.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <Lock className="h-4 w-4 mr-2" />
            <span>No accessible databases</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex items-center justify-between"
      >
        <div className="flex items-center">
          <Database className="h-4 w-4 mr-2" />
          <span>{getSelectedDatabaseName()}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {databases.map((database) => {
            const dbName = typeof database === 'string' ? database : database.name
            const permissions = getDatabasePermissions(dbName)
            
            return (
              <button
                key={dbName}
                type="button"
                onClick={() => handleDatabaseSelect(database)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{dbName}</span>
                  </div>
                  
                  {showPermissions && (
                    <div className="flex space-x-1">
                      {permissions.read && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded text-xs">
                          R
                        </span>
                      )}
                      {permissions.write && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded text-xs">
                          W
                        </span>
                      )}
                      {permissions.execute && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 rounded text-xs">
                          E
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {typeof database === 'object' && database.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-6">
                    {database.description}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}
      
      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default DatabaseSelector
