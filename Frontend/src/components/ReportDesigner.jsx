import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Eye, 
  Settings,
  FileText,
  BarChart3,
  Calculator,
  Filter,
  Download,
  Upload,
  Grid,
  Layout,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
  Move,
  Copy,
  RotateCcw,
  RotateCw
} from 'lucide-react'

const ReportDesigner = ({ report, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    report_type: 'custom',
    category: '',
    is_public: false,
    is_template: false
  })
  
  const [definition, setDefinition] = useState({
    layout: {
      rows: [],
      columns: [],
      cells: {}
    },
    formulas: {},
    filters: {},
    formatting: {},
    data_sources: []
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [activeTab, setActiveTab] = useState('design') // 'design', 'data', 'formatting', 'preview'
  const [selectedCell, setSelectedCell] = useState(null)
  const [showFormulaEditor, setShowFormulaEditor] = useState(false)
  const [showDataSources, setShowDataSources] = useState(false)

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        description: report.description || '',
        report_type: report.report_type,
        category: report.category || '',
        is_public: report.is_public,
        is_template: report.is_template
      })
      
      // Load existing definition if available
      loadReportDefinition()
    }
  }, [report])

  const loadReportDefinition = async () => {
    if (!report) return
    
    try {
      const response = await fetch(`/api/reports/${report.id}/definition`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDefinition(data.definition)
      }
    } catch (err) {
      console.error('Error loading report definition:', err)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Report name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const reportData = {
        ...formData,
        definition: definition
      }
      
      await onSave(reportData)
    } catch (err) {
      console.error('Error saving report:', err)
    } finally {
      setLoading(false)
    }
  }

  const addRow = () => {
    const newRow = {
      id: `row_${Date.now()}`,
      type: 'data',
      label: 'New Row',
      level: 0,
      formula: '',
      format: 'number'
    }
    
    setDefinition(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        rows: [...prev.layout.rows, newRow]
      }
    }))
  }

  const addColumn = () => {
    const newColumn = {
      id: `col_${Date.now()}`,
      type: 'data',
      label: 'New Column',
      period: 'current',
      format: 'number'
    }
    
    setDefinition(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        columns: [...prev.layout.columns, newColumn]
      }
    }))
  }

  const updateCell = (rowId, colId, value) => {
    setDefinition(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        cells: {
          ...prev.layout.cells,
          [`${rowId}_${colId}`]: value
        }
      }
    }))
  }

  const updateRow = (rowId, field, value) => {
    setDefinition(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        rows: prev.layout.rows.map(row => 
          row.id === rowId ? { ...row, [field]: value } : row
        )
      }
    }))
  }

  const updateColumn = (colId, field, value) => {
    setDefinition(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        columns: prev.layout.columns.map(col => 
          col.id === colId ? { ...col, [field]: value } : col
        )
      }
    }))
  }

  const deleteRow = (rowId) => {
    setDefinition(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        rows: prev.layout.rows.filter(row => row.id !== rowId),
        cells: Object.fromEntries(
          Object.entries(prev.layout.cells).filter(([key]) => !key.startsWith(`${rowId}_`))
        )
      }
    }))
  }

  const deleteColumn = (colId) => {
    setDefinition(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        columns: prev.layout.columns.filter(col => col.id !== colId),
        cells: Object.fromEntries(
          Object.entries(prev.layout.cells).filter(([key]) => !key.endsWith(`_${colId}`))
        )
      }
    }))
  }

  const renderDesignTab = () => (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={addRow}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </button>
            <button
              onClick={addColumn}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFormulaEditor(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Formulas
            </button>
            <button
              onClick={() => setShowDataSources(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Data Sources
            </button>
          </div>
        </div>
      </div>

      {/* Report Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Column Headers */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <div className="w-48 p-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 font-medium text-gray-900 dark:text-white">
                Row Labels
              </div>
              {definition.layout.columns.map((column) => (
                <div key={column.id} className="flex-1 p-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={column.label}
                      onChange={(e) => updateColumn(column.id, 'label', e.target.value)}
                      className="bg-transparent border-none outline-none font-medium text-gray-900 dark:text-white w-full"
                    />
                    <button
                      onClick={() => deleteColumn(column.id)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="w-12 p-3 bg-gray-50 dark:bg-gray-700">
                <button
                  onClick={addColumn}
                  className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Data Rows */}
          {definition.layout.rows.map((row) => (
            <div key={row.id} className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex">
                <div className="w-48 p-3 border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRow(row.id, 'label', e.target.value)}
                      className="bg-transparent border-none outline-none text-gray-900 dark:text-white w-full"
                    />
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {definition.layout.columns.map((column) => (
                  <div key={column.id} className="flex-1 p-3 border-r border-gray-200 dark:border-gray-700">
                    <input
                      type="text"
                      value={definition.layout.cells[`${row.id}_${column.id}`] || ''}
                      onChange={(e) => updateCell(row.id, column.id, e.target.value)}
                      className="bg-transparent border-none outline-none text-gray-900 dark:text-white w-full"
                      placeholder="Formula or value"
                    />
                  </div>
                ))}
                <div className="w-12 p-3"></div>
              </div>
            </div>
          ))}

          {/* Add Row Button */}
          <div className="p-3">
            <button
              onClick={addRow}
              className="w-full h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDataTab = () => (
    <div className="flex-1 p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Sources
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Configure data sources for your report. This feature will be expanded to include
          entity hierarchies, account structures, and custom data connections.
        </p>
      </div>
    </div>
  )

  const renderFormattingTab = () => (
    <div className="flex-1 p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Formatting Options
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Customize the appearance of your report with formatting options.
        </p>
      </div>
    </div>
  )

  const renderPreviewTab = () => (
    <div className="flex-1 p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Report Preview
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Preview how your report will look when executed.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onCancel}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {report ? 'Edit Report' : 'Create New Report'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Design your custom financial report
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Saving...' : 'Save Report'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Report Properties */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Report Properties
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Report Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                      errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter report name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter report description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select category</option>
                    <option value="financial">Financial</option>
                    <option value="operational">Operational</option>
                    <option value="compliance">Compliance</option>
                    <option value="management">Management</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Report Type
                  </label>
                  <select
                    value={formData.report_type}
                    onChange={(e) => handleInputChange('report_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="custom">Custom</option>
                    <option value="standard">Standard</option>
                    <option value="template">Template</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => handleInputChange('is_public', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Make public
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_template}
                      onChange={(e) => handleInputChange('is_template', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Save as template
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'design', label: 'Design', icon: Layout },
                    { id: 'data', label: 'Data Sources', icon: BarChart3 },
                    { id: 'formatting', label: 'Formatting', icon: Palette },
                    { id: 'preview', label: 'Preview', icon: Eye }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1">
                {activeTab === 'design' && renderDesignTab()}
                {activeTab === 'data' && renderDataTab()}
                {activeTab === 'formatting' && renderFormattingTab()}
                {activeTab === 'preview' && renderPreviewTab()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportDesigner
