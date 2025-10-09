import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'
import { 
  Download, 
  Upload, 
  FolderOpen, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Info,
  RefreshCw,
  Eye
} from 'lucide-react'

const DataImportExport = () => {
  const { user } = useAuth()
  const { selectedCompany } = useCompany()
  const [selectedFolders, setSelectedFolders] = useState([])
  const [availableFolders, setAvailableFolders] = useState([])
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState(null)

  useEffect(() => {
    if (selectedCompany) {
      loadAvailableFolders()
    }
  }, [selectedCompany])

  const loadAvailableFolders = async () => {
    try {
      // Mock data for demonstration
      const mockFolders = [
        { path: 'accounts', name: 'Accounts', fileCount: 15 },
        { path: 'data', name: 'Data Files', fileCount: 42 },
        { path: 'entities', name: 'Entities', fileCount: 8 },
        { path: 'fst', name: 'Financial Statements', fileCount: 23 },
        { path: 'hierarchies', name: 'Hierarchies', fileCount: 12 },
        { path: 'statements', name: 'Statements', fileCount: 67 },
        { path: 'uploads', name: 'Uploads', fileCount: 34 }
      ]
      setAvailableFolders(mockFolders)
    } catch (error) {
      console.error('Error loading folders:', error)
      setMessage('Failed to load company folders', 'error')
    }
  }

  const handleFolderToggle = (folder) => {
    setSelectedFolders(prev => 
      prev.find(f => f.path === folder.path)
        ? prev.filter(f => f.path !== folder.path)
        : [...prev, folder]
    )
  }

  const handleSelectAll = () => {
    setSelectedFolders([...availableFolders])
  }

  const handleDeselectAll = () => {
    setSelectedFolders([])
  }

  const handleExport = async () => {
    if (selectedFolders.length === 0) {
      setMessage('Please select at least one folder to export', 'error')
      return
    }

    setIsExporting(true)
    setExportProgress(0)
    setMessage('Preparing export...', 'info')

    // Simulate export process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setExportProgress(i)
    }

    // Create mock zip file
    const mockZipContent = `Mock ZIP file containing: ${selectedFolders.map(f => f.name).join(', ')}`
    const blob = new Blob([mockZipContent], { type: 'application/zip' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedCompany}_export_${new Date().toISOString().split('T')[0]}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    setMessage('Export completed successfully!', 'success')
    setIsExporting(false)
    setTimeout(() => setExportProgress(0), 2000)
  }

  const handleImport = async () => {
    if (!importFile) {
      setMessage('Please select a file to import', 'error')
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    setMessage('Preparing import...', 'info')

    // Simulate import process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 150))
      setImportProgress(i)
    }

    setMessage(`Import completed successfully! Files replaced.`, 'success')
    setImportProgress(100)
    setImportFile(null)
    setIsImporting(false)
    setTimeout(() => setImportProgress(0), 2000)
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file && file.name.endsWith('.zip')) {
      setImportFile(file)
      setMessage(`Selected file: ${file.name}`, 'info')
    } else {
      setMessage('Please select a valid ZIP file', 'error')
      setImportFile(null)
    }
  }

  const handlePreview = async () => {
    if (!importFile) return

    // Mock preview data
    const mockPreview = {
      totalFiles: 45,
      filesToReplace: 12,
      files: [
        { path: 'accounts/ifrs_accounts.csv', willReplace: true },
        { path: 'data/entries_January_2025.csv', willReplace: false },
        { path: 'entities/entities.csv', willReplace: true }
      ]
    }
    setPreviewData(mockPreview)
    setShowPreview(true)
  }

  const getMessageIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getMessageColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default: return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Data Import/Export
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please select a company to continue
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Data Import/Export
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Company: <span className="font-semibold">{selectedCompany}</span>
              </p>
            </div>
            <button
              onClick={loadAvailableFolders}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg border ${getMessageColor(messageType)} flex items-center space-x-2`}>
              {getMessageIcon(messageType)}
              <span>{message}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Download className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export Data
              </h2>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Folders to Export
                </span>
                <div className="space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-1">
                {availableFolders.map((folder) => (
                  <label
                    key={folder.path}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFolders.some(f => f.path === folder.path)}
                      onChange={() => handleFolderToggle(folder)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <FolderOpen className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {folder.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({folder.fileCount} files)
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {selectedFolders.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Selected {selectedFolders.length} folder(s) for export
                </p>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={isExporting || selectedFolders.length === 0}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Exporting... ({exportProgress}%)
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected Folders
                </>
              )}
            </button>

            {isExporting && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Import Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Import Data
              </h2>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select ZIP File to Import
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {importFile && (
                  <button
                    onClick={handlePreview}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium">Warning:</p>
                  <p>Importing will replace existing files with the same names. This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={isImporting || !importFile}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importing... ({importProgress}%)
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import and Replace Files
                </>
              )}
            </button>

            {isImporting && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && previewData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Import Preview
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Files:</span> {previewData.totalFiles}
                    </div>
                    <div>
                      <span className="font-medium">Files to Replace:</span> {previewData.filesToReplace}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Files to be imported:</h4>
                    <div className="space-y-1">
                      {previewData.files.map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span>{file.path}</span>
                          {file.willReplace && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Will Replace
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false)
                    handleImport()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Proceed with Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataImportExport
