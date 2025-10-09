import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Settings, 
  Filter,
  Calendar,
  User,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Share2,
  Printer,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Search,
  MoreVertical
} from 'lucide-react'

const ReportViewer = ({ report, onClose }) => {
  const [reportData, setReportData] = useState(null)
  const [definition, setDefinition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [executing, setExecuting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [filters, setFilters] = useState({})
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (report) {
      loadReportDefinition()
    }
  }, [report])

  const loadReportDefinition = async () => {
    if (!report) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/${report.id}/definition`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDefinition(data.definition)
        // Execute the report to get initial data
        await executeReport()
      } else {
        throw new Error('Failed to load report definition')
      }
    } catch (err) {
      console.error('Error loading report definition:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const executeReport = async () => {
    if (!report) return
    
    try {
      setExecuting(true)
      const response = await fetch(`/api/reports/${report.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          filters: filters,
          parameters: {}
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
        setError(null)
      } else {
        throw new Error('Failed to execute report')
      }
    } catch (err) {
      console.error('Error executing report:', err)
      setError(err.message)
    } finally {
      setExecuting(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const exportReport = (format) => {
    // This would implement actual export functionality
    console.log(`Exporting report as ${format}`)
  }

  const printReport = () => {
    window.print()
  }

  const shareReport = () => {
    // This would implement sharing functionality
    console.log('Sharing report')
  }

  const renderReportGrid = () => {
    if (!definition || !definition.layout) {
      return (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No report layout defined
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This report doesn't have a layout configured yet.
          </p>
        </div>
      )
    }

    const { rows, columns, cells } = definition.layout

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Column Headers */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <div className="w-48 p-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-medium text-gray-900 dark:text-white">
              Row Labels
            </div>
            {columns.map((column) => (
              <div key={column.id} className="flex-1 p-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {column.label}
                  </span>
                  <button
                    onClick={() => handleSort(column.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {sortConfig.key === column.id ? (
                      sortConfig.direction === 'asc' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Rows */}
        {rows.map((row) => (
          <div key={row.id} className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <div className="w-48 p-3 border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <span className="text-gray-900 dark:text-white">
                    {row.label}
                  </span>
                </div>
              </div>
              {columns.map((column) => {
                const cellValue = cells[`${row.id}_${column.id}`] || ''
                const displayValue = cellValue || '-'
                
                return (
                  <div key={column.id} className="flex-1 p-3 border-r border-gray-200 dark:border-gray-700">
                    <div className="text-right">
                      <span className={`text-gray-900 dark:text-white ${
                        typeof displayValue === 'number' ? 'font-mono' : ''
                      }`}>
                        {displayValue}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderFilters = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Filters
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Period
          </label>
          <select
            value={filters.period || ''}
            onChange={(e) => handleFilterChange('period', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Periods</option>
            <option value="current">Current Period</option>
            <option value="previous">Previous Period</option>
            <option value="ytd">Year to Date</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Entity
          </label>
          <select
            value={filters.entity || ''}
            onChange={(e) => handleFilterChange('entity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Entities</option>
            <option value="parent">Parent Company</option>
            <option value="subsidiary">Subsidiaries</option>
          </select>
        </div>
        
        <button
          onClick={executeReport}
          disabled={executing}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {executing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {executing ? 'Applying...' : 'Apply Filters'}
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Report
            </h3>
            <div className="mt-2 text-sm text-red-700">
              {error}
            </div>
            <div className="mt-4">
              <button
                onClick={onClose}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onClose}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {report.name}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {report.description || 'Custom financial report'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-md ${
                    showFilters 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title="Filters"
                >
                  <Filter className="h-4 w-4" />
                </button>
                
                <button
                  onClick={executeReport}
                  disabled={executing}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${executing ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="More Options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  
                  {showSettings && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => exportReport('excel')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export to Excel
                        </button>
                        <button
                          onClick={() => exportReport('pdf')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export to PDF
                        </button>
                        <button
                          onClick={printReport}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print Report
                        </button>
                        <button
                          onClick={shareReport}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters */}
          {showFilters && (
            <div className="lg:col-span-1">
              {renderFilters()}
            </div>
          )}

          {/* Main Content */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {/* Report Info */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <User className="h-4 w-4 mr-1" />
                    Created by {report.created_by}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    Last updated {new Date(report.updated_at).toLocaleDateString()}
                  </div>
                  {report.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {report.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {report.is_public && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Public
                    </span>
                  )}
                  {report.is_template && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Template
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {renderReportGrid()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportViewer
