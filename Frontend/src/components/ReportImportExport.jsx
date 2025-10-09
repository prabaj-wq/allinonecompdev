import React, { useState } from 'react'
import { 
  X, 
  Download, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  File,
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  EyeOff,
  Settings,
  Database,
  Globe,
  Link,
  Calendar,
  User,
  Tag,
  BarChart3,
  TrendingUp,
  Calculator,
  Filter,
  Search,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Copy,
  Share2,
  RefreshCw
} from 'lucide-react'

const ReportImportExport = ({ isOpen, onClose, reportData, onImport }) => {
  const [activeTab, setActiveTab] = useState('export') // 'export' or 'import'
  const [exportFormat, setExportFormat] = useState('excel')
  const [exportOptions, setExportOptions] = useState({
    includeFormulas: true,
    includeFormatting: true,
    includeData: true,
    includeCharts: false,
    includePivotTables: false,
    password: '',
    compress: false
  })
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [importOptions, setImportOptions] = useState({
    skipEmptyRows: true,
    skipEmptyColumns: true,
    firstRowAsHeaders: true,
    detectDataTypes: true,
    mapping: {}
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const exportFormats = [
    { id: 'excel', name: 'Excel (.xlsx)', icon: FileSpreadsheet, description: 'Microsoft Excel format with full formatting' },
    { id: 'csv', name: 'CSV (.csv)', icon: FileText, description: 'Comma-separated values for data exchange' },
    { id: 'pdf', name: 'PDF (.pdf)', icon: File, description: 'Portable document format for sharing' },
    { id: 'json', name: 'JSON (.json)', icon: Database, description: 'Structured data format for integration' }
  ]

  const handleExport = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, this would call the backend API
      const exportData = {
        format: exportFormat,
        options: exportOptions,
        data: reportData
      }
      
      console.log('Exporting with options:', exportData)
      
      setSuccess(`Report exported successfully as ${exportFormats.find(f => f.id === exportFormat)?.name}`)
    } catch (err) {
      setError('Export failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setImportFile(file)
      setError('')
      setSuccess('')
      
      // Simulate file preview
      setImportPreview({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleString(),
        preview: [
          ['Row Labels', 'Current Period', 'Previous Period', 'Variance'],
          ['Total Assets', '1000000', '950000', '50000'],
          ['Current Assets', '600000', '580000', '20000'],
          ['Cash', '200000', '180000', '20000'],
          ['Inventory', '400000', '400000', '0']
        ]
      })
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      setError('Please select a file to import')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, this would parse the file and call onImport
      const importData = {
        file: importFile,
        options: importOptions,
        preview: importPreview
      }
      
      console.log('Importing with options:', importData)
      
      if (onImport) {
        onImport(importData)
      }
      
      setSuccess('Report imported successfully')
      setImportFile(null)
      setImportPreview(null)
    } catch (err) {
      setError('Import failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderExportTab = () => (
    <div className="space-y-6">
      {/* Export Format Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Export Format
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportFormats.map((format) => {
            const IconComponent = format.icon
            return (
              <div
                key={format.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  exportFormat === format.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setExportFormat(format.id)}
              >
                <div className="flex items-start space-x-3">
                  <IconComponent className="h-6 w-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {format.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {format.description}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    exportFormat === format.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {exportFormat === format.id && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Export Options */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Export Options
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeFormulas}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeFormulas: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Include Formulas
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeFormatting}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeFormatting: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Include Formatting
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeData}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeData: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Include Data
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeCharts}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Include Charts
              </span>
            </label>
          </div>
          
          {exportFormat === 'excel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password Protection (Optional)
              </label>
              <input
                type="password"
                value={exportOptions.password}
                onChange={(e) => setExportOptions(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter password to protect file"
              />
            </div>
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <Loader className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Download className="h-5 w-5 mr-2" />
          )}
          {loading ? 'Exporting...' : 'Export Report'}
        </button>
      </div>
    </div>
  )

  const renderImportTab = () => (
    <div className="space-y-6">
      {/* File Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select File to Import
        </h3>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                  {importFile ? importFile.name : 'Click to upload or drag and drop'}
                </span>
                <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                  Excel, CSV, or JSON files up to 10MB
                </span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </div>
          </div>
        </div>
      </div>

      {/* File Preview */}
      {importPreview && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            File Preview
          </h3>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {importPreview.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(importPreview.size / 1024).toFixed(1)} KB • {importPreview.lastModified}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setImportFile(null)
                    setImportPreview(null)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {importPreview.preview[0]?.map((header, index) => (
                        <th
                          key={index}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {importPreview.preview.slice(1, 6).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importPreview.preview.length > 6 && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Showing first 5 rows of {importPreview.preview.length - 1} total rows
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Options */}
      {importPreview && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Import Options
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.skipEmptyRows}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, skipEmptyRows: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Skip Empty Rows
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.skipEmptyColumns}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, skipEmptyColumns: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Skip Empty Columns
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.firstRowAsHeaders}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, firstRowAsHeaders: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  First Row as Headers
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.detectDataTypes}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, detectDataTypes: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Detect Data Types
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Import Button */}
      {importPreview && (
        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Upload className="h-5 w-5 mr-2" />
            )}
            {loading ? 'Importing...' : 'Import Report'}
          </button>
        </div>
      )}
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Download className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Import / Export Report
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Import data from files or export your report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Export
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Upload className="h-4 w-4 mr-2 inline" />
              Import
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Status Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Success
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    {success}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'export' && renderExportTab()}
          {activeTab === 'import' && renderImportTab()}
        </div>
      </div>
    </div>
  )
}

export default ReportImportExport
