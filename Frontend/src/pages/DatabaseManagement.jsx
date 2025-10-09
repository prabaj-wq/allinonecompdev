import React, { useState, useEffect } from 'react'
import { 
  Database, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  RefreshCw, 
  Settings, 
  Activity, 
  BarChart3, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Play, 
  Pause, 
  FileText, 
  Calendar, 
  User, 
  Tag, 
  HardDrive, 
  Server, 
  Network, 
  Zap,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Table,
  Columns,
  Key,
  Copy
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const DatabaseManagement = () => {
  const { getAuthHeaders } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('databases')
  const [databases, setDatabases] = useState([])
  const [tables, setTables] = useState([])
  const [selectedDatabase, setSelectedDatabase] = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableStructure, setTableStructure] = useState(null)
  const [showNewDatabase, setShowNewDatabase] = useState(false)
  const [performanceData, setPerformanceData] = useState(null)
  const [expandedTables, setExpandedTables] = useState({})
  const [newDatabaseForm, setNewDatabaseForm] = useState({
    name: '',
    copy_structure: false,
    source_database: ''
  })

  useEffect(() => {
    loadDatabaseData()
    
    // Auto-refresh database data every 30 seconds for monitoring
    const interval = setInterval(() => {
      if (activeTab === 'monitoring') {
        console.log('Auto-refreshing database data for monitoring...')
        loadDatabaseData()
      }
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [activeTab])

  const loadDatabaseData = async () => {
    setIsLoading(true)
    try {
      const authHeaders = getAuthHeaders()
      console.log('Fetching databases with auth headers')
      
      const response = await fetch('/api/database-management/active-databases', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Received database data:', data)
        
        if (data.success && data.databases) {
          // Filter out system databases (epm_tool and postgres)
          const filteredDatabases = data.databases.filter(
            db => db.name !== 'epm_tool' && db.name !== 'postgres'
          )
          console.log('Filtered databases:', filteredDatabases)
          setDatabases(filteredDatabases)
        } else {
          console.error('API returned no databases')
          setDatabases([])
        }
      } else {
        console.error('API request failed:', response.status, response.statusText)
        if (response.status === 401) {
          console.error('Authentication failed - user may need to login')
        }
        setDatabases([])
      }
    } catch (error) {
      console.error('Error loading database data:', error)
      setDatabases([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadTablesForDatabase = async (dbName) => {
    setIsLoading(true)
    try {
      const authHeaders = getAuthHeaders()
      console.log('Fetching tables for database:', dbName)
      
      // Use the database-specific API endpoint
      const response = await fetch(`/api/database-management/database-info/${dbName}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.tables) {
          // Transform the data to match our expected format
          const transformedTables = data.tables.map(table => ({
            name: table.table_name,
            rows: 0,
            size: table.size || '0 kB',
            size_bytes: table.size_bytes || 0,
            last_modified: new Date().toISOString(),
            columns: [] // Will be loaded on expand
          }))
          
          console.log(`Loaded ${transformedTables.length} tables for ${dbName}:`, transformedTables)
          setTables(transformedTables)
        } else {
          console.error('Failed to load tables:', data.message)
          setTables([])
        }
      } else {
        console.error('API request failed:', response.status)
        setTables([])
      }
    } catch (error) {
      console.error('Error loading tables:', error)
      setTables([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // SQL Query Console state and functions
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const validateQuery = (sql) => {
    const trimmed = sql.trim().toLowerCase()
    
    // Check if it starts with SELECT
    if (!trimmed.startsWith('select')) {
      return { valid: false, error: 'Only SELECT queries are allowed for security reasons.' }
    }
    
    // Check for forbidden keywords
    const forbiddenKeywords = [
      'insert', 'update', 'delete', 'drop', 'create', 'alter', 'truncate', 
      'grant', 'revoke', 'execute', 'call', 'begin', 'commit', 'rollback'
    ]
    
    for (const keyword of forbiddenKeywords) {
      if (trimmed.includes(keyword)) {
        return { valid: false, error: `Keyword '${keyword.toUpperCase()}' is not allowed for security reasons.` }
      }
    }
    
    return { valid: true, error: null }
  }

  const executeQuery = async () => {
    if (!selectedDatabase) {
      setError('Please select a database first')
      return
    }

    const validation = validateQuery(query)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const authHeaders = getAuthHeaders()
      console.log('Executing query on database:', selectedDatabase)
      
      // Use database-specific query execution
      const response = await fetch(`/api/database-management/execute-query`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          database_name: selectedDatabase,
          query: query.trim(),
          query_type: 'SELECT'
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Transform the response to match expected format
        setResults({
          columns: data.columns,
          rows: data.rows,
          total_count: data.row_count
        })
      } else {
        setError(data.message || 'Query execution failed')
      }
    } catch (error) {
      console.error('Error executing query:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleTableExpansion = async (tableName) => {
    const isExpanding = !expandedTables[tableName]
    
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: isExpanding
    }))
    
    // Load table structure if expanding and not already loaded
    if (isExpanding && selectedDatabase) {
      const table = tables.find(t => t.name === tableName)
      if (table && (!table.columns || table.columns.length === 0)) {
        await loadTableStructure(tableName)
      }
    }
  }
  
  const loadTableStructure = async (tableName) => {
    if (!selectedDatabase) return
    
    try {
      const authHeaders = getAuthHeaders()
      const response = await fetch(
        `/api/database-management/table-structure/${selectedDatabase}/${tableName}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.columns) {
          // Update the table with column information
          setTables(prevTables =>
            prevTables.map(table =>
              table.name === tableName
                ? { ...table, columns: data.columns }
                : table
            )
          )
        }
      }
    } catch (error) {
      console.error('Error loading table structure:', error)
    }
  }

  const insertTableName = (tableName) => {
    setQuery(prev => prev + (prev.endsWith(' ') ? '' : ' ') + tableName)
  }

  const insertColumnName = (tableName, columnName) => {
    setQuery(prev => prev + (prev.endsWith(' ') ? '' : ' ') + `${tableName}.${columnName}`)
  }

  const exportResults = (format) => {
    if (!results?.rows) return

    if (format === 'csv') {
      const headers = Object.keys(results.rows[0] || {})
      const csvContent = [
        headers.join(','),
        ...results.rows.map(row => 
          headers.map(header => {
            const value = row[header]
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `query_results_${selectedDatabase}_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(query)
  }

  const clearQuery = () => {
    setQuery('')
    setResults(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Database Management</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor and manage database operations, performance, and backups</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewDatabase(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Database
              </button>
              <button
                onClick={loadDatabaseData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'databases', label: 'Databases', icon: Database },
              { id: 'tables', label: 'Tables', icon: Table },
              { id: 'monitoring', label: 'Monitoring', icon: Activity },
              { id: 'sql-query', label: 'SQL Query', icon: Search }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Databases Tab */}
        {activeTab === 'databases' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">All Databases</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing all PostgreSQL databases on your server ({databases.length} databases found)
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={loadDatabaseData}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowNewDatabase(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Database
            </button>
          </div>
        </div>

            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Loading databases...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {databases.map((db) => (
                  <div key={db.name} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Database className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {db.name}
                              </h3>
                              {db.name === 'finfusion360' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Main
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">PostgreSQL</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(db.status)}`}>
                            {db.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Size:</span>
                          <span className="text-gray-900">{db.size}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Tables:</span>
                          <span className="text-gray-900">{db.table_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Active Connections:</span>
                          <span className="text-gray-900">{db.active_connections}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Connection Limit:</span>
                          <span className="text-gray-900">{db.connection_limit}</span>
                        </div>
                        {db.created_date && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Created:</span>
                          <span className="text-gray-900">
                              {new Date(db.created_date).toLocaleDateString()}
                          </span>
                        </div>
                          )}
                        </div>
                      
                      <div className="mt-6 flex justify-between items-center">
                        <button
                          onClick={() => {
                            setActiveTab('tables')
                            setSelectedDatabase(db.name)
                            loadTablesForDatabase(db.name)
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          View Tables
                          </button>
                        <div className="flex space-x-2">
                          {db.name !== 'finfusion360' && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to drop the database "${db.name}"? This action cannot be undone.`)) {
                                  // Handle drop database
                                  console.log('Dropping database:', db.name)
                                }
                              }}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Drop Database"
                            >
                              <Trash2 className="h-4 w-4" />
                          </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Database Tables</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedDatabase || ''}
                  onChange={(e) => {
                    setSelectedDatabase(e.target.value)
                    if (e.target.value) {
                      loadTablesForDatabase(e.target.value)
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Database</option>
                  {databases.map((db) => (
                    <option key={db.name} value={db.name}>
                      {db.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedDatabase && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Tables in {selectedDatabase}
                  </h3>
              </div>
                {isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                    <p className="mt-2 text-sm text-gray-500">Loading tables...</p>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="space-y-2">
                    {tables.map((table) => (
                        <div key={table.name} className="border border-gray-200 rounded-lg">
                          <button
                            onClick={() => {
                              if (expandedTables[table.name]) {
                                setExpandedTables(prev => ({ ...prev, [table.name]: false }))
                              } else {
                                setExpandedTables(prev => ({ ...prev, [table.name]: true }))
                              }
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {expandedTables[table.name] ? (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                )}
                                <Table className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900">{table.name}</span>
                                <span className="text-sm text-gray-500">
                                  ({table.columns?.length || 0} columns)
                          </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{table.size}</span>
                                <span>{table.rows} rows</span>
                              </div>
                            </div>
                          </button>
                          
                          {expandedTables[table.name] && (
                            <div className="border-t border-gray-200 bg-gray-50">
                              <div className="px-4 py-3">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Columns</h4>
                                <div className="space-y-2">
                                  {table.columns?.map((column) => (
                                    <div key={column.column_name} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                                      <div className="flex items-center space-x-3">
                                        <Columns className="h-4 w-4 text-gray-400" />
                                        <span className="font-mono text-sm text-gray-900">{column.column_name}</span>
                                        <span className="text-xs text-gray-500">({column.data_type})</span>
                                      </div>
                          <div className="flex items-center space-x-2">
                                        {column.is_nullable === 'NO' && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            NOT NULL
                                          </span>
                                        )}
                                        {column.column_default && (
                                          <span className="text-xs text-gray-500">
                                            Default: {column.column_default}
                                          </span>
                                        )}
                          </div>
                                    </div>
                    ))}
              </div>
            </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Real-time Database Monitoring</h2>
              <button
                onClick={loadDatabaseData}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-800">
                  Auto-refreshing every 30 seconds • Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {databases.map((db) => (
                <div key={db.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{db.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(db.status)}`}>
                      {db.status}
                    </span>
                </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Size:</span>
                      <span className="text-sm font-medium text-gray-900">{db.size}</span>
              </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Tables:</span>
                      <span className="text-sm font-medium text-gray-900">{db.table_count}</span>
                          </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Active Connections:</span>
                      <span className="text-sm font-medium text-gray-900">{db.active_connections}</span>
              </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Connection Limit:</span>
                      <span className="text-sm font-medium text-gray-900">{db.connection_limit}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Connection Usage</span>
                      <span>{db.connection_limit > 0 ? Math.round((db.active_connections / db.connection_limit) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${db.connection_limit > 0 ? Math.min((db.active_connections / db.connection_limit) * 100, 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SQL Query Tab */}
        {activeTab === 'sql-query' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">SQL Query Console</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedDatabase || ''}
                  onChange={(e) => {
                    setSelectedDatabase(e.target.value)
                    setQuery('')
                    setResults(null)
                    setError(null)
                    if (e.target.value) {
                      loadTablesForDatabase(e.target.value)
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Database</option>
                  {databases.map((db) => (
                    <option key={db.name} value={db.name}>
                      {db.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedDatabase ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Table Browser */}
                <div className="lg:col-span-1">
                  {/* Database Schema */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Database className="h-5 w-5 mr-2" />
                        {selectedDatabase} Schema
                      </h3>
                    </div>
                    
                    <div className="p-4 pb-6 pr-12 space-y-2 max-h-96 overflow-hidden">
                      <div className="overflow-y-auto overflow-x-auto custom-scrollbar min-w-64" style={{ maxHeight: '384px' }}>
                        {tables.map((table) => (
                          <div key={table.name} className="space-y-1 min-w-max">
                            <button
                              onClick={() => toggleTableExpansion(table.name)}
                              className="flex items-center w-full text-left text-sm text-gray-700 hover:text-gray-900 min-w-max py-1"
                            >
                              {expandedTables[table.name] ? (
                                <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />
                              )}
                              <Table className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate min-w-0">{table.name}</span>
                            </button>
                            
                            {expandedTables[table.name] && (
                              <div className="ml-6 space-y-1 min-w-max">
                                {table.columns && table.columns.length > 0 ? (
                                  table.columns.map((column) => (
                                    <button
                                      key={column.column_name}
                                      onClick={() => insertColumnName(table.name, column.column_name)}
                                      className="flex items-center w-full text-left text-xs text-gray-600 hover:text-gray-800 ml-4 group min-w-max py-1"
                                    >
                                      <Columns className="h-4 w-4 mr-2 flex-shrink-0" />
                                      <div className="min-w-0 flex-1 overflow-hidden">
                                        <span className="block truncate">{column.column_name}</span>
                                        <span className="block text-gray-500 text-xs truncate">
                                          ({column.data_type})
                                        </span>
                                      </div>
                                      {column.is_primary_key && (
                                        <Key className="h-3 w-3 text-yellow-600 ml-1 flex-shrink-0" />
                                      )}
                                    </button>
                                  ))
                                ) : (
                                  <div className="ml-4 text-xs text-gray-400 py-1">Loading columns...</div>
                                )}
                                <button
                                  onClick={() => insertTableName(table.name)}
                                  className="flex items-center w-full text-left text-xs text-blue-600 hover:text-blue-800 ml-4 group min-w-max py-1"
                                >
                                  <Database className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">Insert table name</span>
                                </button>
                              </div>
                            )}
            </div>
                        ))}
          </div>
                    </div>
                  </div>

                  {/* Quick Templates */}
                  <div className="mt-6 bg-white shadow rounded-lg">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900">
                        Quick Templates
                      </h3>
                  </div>
                    
                    <div className="p-4 space-y-2">
                      <button
                        onClick={() => setQuery(`SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`)}
                        className="w-full text-left text-xs text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4 inline mr-2" />
                        Show All Tables
                      </button>
                      <button
                        onClick={() => setQuery(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'your_table_name' ORDER BY ordinal_position;`)}
                        className="w-full text-left text-xs text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4 inline mr-2" />
                        Show Table Structure
                      </button>
                      <button
                        onClick={() => setQuery(`SELECT COUNT(*) as total_records FROM your_table_name;`)}
                        className="w-full text-left text-xs text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4 inline mr-2" />
                        Count Records
                      </button>
                      <button
                        onClick={() => setQuery(`SELECT * FROM your_table_name LIMIT 10;`)}
                        className="w-full text-left text-xs text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4 inline mr-2" />
                        Sample Data
                      </button>
                  </div>
                  </div>
                </div>

                {/* Main Content - Query Editor & Results */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Query Editor */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          SQL Query Editor - {selectedDatabase}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={copyQuery}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </button>
                          <button
                            onClick={clearQuery}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Clear
                          </button>
                  </div>
                </div>
              </div>

                    <div className="px-6 py-4">
                <div className="space-y-4">
                        <textarea
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder={`Enter your SELECT query for ${selectedDatabase}...\n\nExample: SELECT * FROM users LIMIT 10;`}
                          rows={8}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                        />
                        
                  <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={executeQuery}
                              disabled={loading || !query.trim()}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Executing...
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Execute Query
                                </>
                              )}
                            </button>
                  </div>
                          
                          <div className="text-sm text-gray-500">
                            Only SELECT queries allowed
                  </div>
                  </div>
                  </div>
                </div>
              </div>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Query Error
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            {error}
            </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results Display */}
                  {results && (
                    <div className="bg-white shadow rounded-lg">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              Query Results
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{results.rows?.length || 0} rows returned</span>
                              {results.total_count && (
                                <>
                                  <span>•</span>
                                  <span>Total: {results.total_count}</span>
                                </>
                              )}
                </div>
                </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => exportResults('csv')}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export CSV
                            </button>
                </div>
                </div>
              </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {results.columns?.map((column) => (
                                <th
                                  key={column}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {results.rows?.map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-gray-50">
                                {results.columns?.map((column) => (
                                  <td
                                    key={column}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                  >
                                    {row[column] !== null && row[column] !== undefined 
                                      ? String(row[column])
                                      : <span className="text-gray-400">NULL</span>
                                    }
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
            </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Database</h3>
                <p className="text-gray-600">
                  Choose a database from the dropdown above to start running SQL queries.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DatabaseManagement
