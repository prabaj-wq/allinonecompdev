import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Save, 
  Download, 
  Database, 
  Table, 
  Columns, 
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'

// Use relative URLs to work with Vite proxy
const BACKEND_URL = ''

const SQLQueryConsole = () => {
  const { user, getAuthHeaders } = useAuth()
  const { selectedCompany } = useCompany()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tables, setTables] = useState([])
  const [expandedTables, setExpandedTables] = useState({})
  const [savedQueries, setSavedQueries] = useState([])
  const [showSavedQueries, setShowSavedQueries] = useState(false)
  const [queryHistory, setQueryHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  useEffect(() => {
    fetchTables()
    fetchSavedQueries()
    fetchQueryHistory()
  }, [selectedCompany])

  const fetchTables = async () => {
    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/sql/tables`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
      })
      const data = await response.json()
      if (data.success) {
        setTables(data.data)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    }
  }

  const fetchSavedQueries = async () => {
    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/sql/saved-queries`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
      })
      const data = await response.json()
      if (data.success) {
        setSavedQueries(data.data)
      }
    } catch (error) {
      console.error('Error fetching saved queries:', error)
    }
  }

  const fetchQueryHistory = async () => {
    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/sql/history`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
      })
      const data = await response.json()
      if (data.success) {
        setQueryHistory(data.data)
      }
    } catch (error) {
      console.error('Error fetching query history:', error)
    }
  }

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
    const validation = validateQuery(query)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/sql/execute`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          query: query.trim(),
          page: currentPage,
          page_size: pageSize
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.data)
        // Add to history (frontend only, backend also stores it)
        setQueryHistory(prev => [{
          id: Date.now(),
          query: query.trim(),
          timestamp: new Date().toISOString(),
          status: 'success',
          rows_returned: data.data.rows?.length || 0
        }, ...prev.slice(0, 49)]) // Keep last 50 queries
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

  const saveQuery = async () => {
    if (!query.trim()) return

    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/sql/save-query`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          name: `Query ${new Date().toLocaleString()}`,
          query: query.trim(),
          description: 'Saved query'
        }),
      })

      const data = await response.json()
      if (data.success) {
        await fetchSavedQueries()
      }
    } catch (error) {
      console.error('Error saving query:', error)
    }
  }

  const loadSavedQuery = (savedQuery) => {
    setQuery(savedQuery.query)
    setShowSavedQueries(false)
  }

  const loadQueryFromHistory = (historyItem) => {
    setQuery(historyItem.query)
    setShowHistory(false)
  }

  const insertTableName = (tableName) => {
    setQuery(prev => prev + (prev.endsWith(' ') ? '' : ' ') + tableName)
  }

  const insertColumnName = (tableName, columnName) => {
    setQuery(prev => prev + (prev.endsWith(' ') ? '' : ' ') + `${tableName}.${columnName}`)
  }

  const toggleTableExpansion = (tableName) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }))
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
      a.download = `query_results_${new Date().toISOString().split('T')[0]}.csv`
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

  const commonTemplates = [
    {
      name: 'Show All Tables',
      query: 'SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name;'
    },
    {
      name: 'Show Table Structure',
      query: 'SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = \'your_table_name\' ORDER BY ordinal_position;'
    },
    {
      name: 'Count Records',
      query: 'SELECT COUNT(*) as total_records FROM your_table_name;'
    },
    {
      name: 'Sample Data',
      query: 'SELECT * FROM your_table_name LIMIT 10;'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  SQL Query Console
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Secure PostgreSQL query interface - SELECT queries only
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    PostgreSQL
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Read-only access
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Table Browser */}
          <div className="lg:col-span-1">
            {/* Database Schema */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Schema
                </h3>
              </div>
              
              <div className="p-4 pb-6 pr-12 space-y-2 max-h-96 overflow-hidden">
                <div className="overflow-y-auto overflow-x-auto custom-scrollbar min-w-64" style={{ maxHeight: '384px' }}>
                  {tables.map((table) => (
                    <div key={table.table_name} className="space-y-1 min-w-max">
                      <button
                        onClick={() => toggleTableExpansion(table.table_name)}
                        className="flex items-center w-full text-left text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white min-w-max py-1"
                      >
                        {expandedTables[table.table_name] ? (
                          <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />
                        )}
                        <Table className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate min-w-0">{table.table_name}</span>
                      </button>
                      
                      {expandedTables[table.table_name] && (
                        <div className="ml-6 space-y-1 min-w-max">
                          {table.columns?.map((column) => (
                            <button
                              key={column.column_name}
                              onClick={() => insertColumnName(table.table_name, column.column_name)}
                              className="flex items-center w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ml-4 group min-w-max py-1"
                            >
                              <Columns className="h-4 w-4 mr-2 flex-shrink-0" />
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <span className="block truncate">{column.column_name}</span>
                                <span className="block text-gray-500 dark:text-gray-500 text-xs truncate">
                                  ({column.data_type})
                                </span>
                              </div>
                            </button>
                          ))}
                          <button
                            onClick={() => insertTableName(table.table_name)}
                            className="flex items-center w-full text-left text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-4 group min-w-max py-1"
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
            <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Quick Templates
                </h3>
              </div>
              
              <div className="p-4 space-y-2">
                {commonTemplates.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => setQuery(template.query)}
                    className="w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Query Editor & Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Query Editor */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    SQL Query Editor
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyQuery}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </button>
                    <button
                      onClick={clearQuery}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowSavedQueries(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Saved
                    </button>
                    <button
                      onClick={() => setShowHistory(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <History className="h-4 w-4 mr-2" />
                      History
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your SELECT query here...\n\nExample: SELECT * FROM users LIMIT 10;"
                    rows={8}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
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
                      
                      <button
                        onClick={saveQuery}
                        disabled={!query.trim()}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Query
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Only SELECT queries allowed
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 dark:text-red-300" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Query Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Display */}
            {results && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Query Results
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
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
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {results.columns?.map((column) => (
                          <th
                            key={column}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {results.rows?.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {results.columns?.map((column) => (
                            <td
                              key={column}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                            >
                              {row[column] !== null && row[column] !== undefined 
                                ? String(row[column])
                                : <span className="text-gray-400 dark:text-gray-500">NULL</span>
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {results.total_count > pageSize && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Rows per page:
                        </span>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                          <option value={250}>250</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Page {currentPage} of {Math.ceil(results.total_count / pageSize)}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={currentPage >= Math.ceil(results.total_count / pageSize)}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Queries Modal */}
      {showSavedQueries && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Saved Queries
                </h3>
                <button
                  onClick={() => setShowSavedQueries(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedQueries.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No saved queries yet.
                  </p>
                ) : (
                  savedQueries.map((savedQuery) => (
                    <div
                      key={savedQuery.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => loadSavedQuery(savedQuery)}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {savedQuery.name}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        {savedQuery.description}
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 font-mono truncate">
                        {savedQuery.query}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Query History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Query History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {queryHistory.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No query history yet.
                  </p>
                ) : (
                  queryHistory.map((historyItem) => (
                    <div
                      key={historyItem.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => loadQueryFromHistory(historyItem)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          historyItem.status === 'success' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {historyItem.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(historyItem.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-400 dark:text-gray-500 text-xs font-mono truncate">
                        {historyItem.query}
                      </p>
                      {historyItem.rows_returned > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {historyItem.rows_returned} rows returned
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SQLQueryConsole