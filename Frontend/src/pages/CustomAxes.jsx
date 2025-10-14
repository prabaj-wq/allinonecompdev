import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'
import { 
  Plus, 
  Eye, 
  Download, 
  Settings, 
  Search,
  BarChart3,
  FileText,
  Calendar,
  Tag,
  CheckCircle,
  Edit,
  Trash2,
  Layers,
  BookOpen,
  RefreshCw,
  Upload,
  X,
  ArrowRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const CustomAxes = () => {
  const { user } = useAuth()
  const { selectedCompany } = useCompany()
  
  // State management
  const [axes, setAxes] = useState([])
  const [selectedAxis, setSelectedAxis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Form states for creating/editing axes
  const [axisForm, setAxisForm] = useState({
    axis_name: '',
    description: '',
    columns: []
  })
  
  // Column form state
  const [columnForm, setColumnForm] = useState({
    column_name: '',
    field_type: 'text',
    is_required: false,
    options: [], // For dropdown/checkbox options
    default_value: '',
    validation_rules: {}
  })

  // Load data on component mount
  useEffect(() => {
    loadAxesData()
  }, [selectedCompany])

  const loadAxesData = async () => {
    if (!selectedCompany) return
    
    setLoading(true)
    try {
      // Load axes from API with company context
      const response = await fetch(`/api/custom-axes?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setAxes(data.axes || [])
        console.log('✅ Loaded custom axes:', data.axes?.length || 0)
      } else {
        console.warn('Failed to load axes from API, no axes available')
        // No mock data - only show user-created axes
        setAxes([])
      }
    } catch (error) {
      console.error('Error loading axes data:', error)
      setAxes([])
    } finally {
      setLoading(false)
    }
  }

  const createAxis = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/custom-axes?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(axisForm)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Axis created successfully:', result)
        
        // Refresh the axes list
        await loadAxesData()
        
        // Reset form and close modal
        setAxisForm({
          axis_name: '',
          description: '',
          columns: []
        })
        setShowCreateModal(false)
        
        toast.success('Custom axis created successfully!')
      } else {
        const error = await response.json()
        console.error('Failed to create axis:', error)
        toast.error(error.detail || 'Failed to create axis')
      }
    } catch (error) {
      console.error('Error creating axis:', error)
      toast.error('Error creating axis')
    } finally {
      setLoading(false)
    }
  }

  const editAxis = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/custom-axes/${selectedAxis.id}?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(axisForm)
      })
      
      if (response.ok) {
        console.log('✅ Axis updated successfully')
        
        // Refresh the axes list
        await loadAxesData()
        
        // Reset form and close modal
        setAxisForm({
          axis_name: '',
          description: '',
          columns: []
        })
        setShowEditModal(false)
        setSelectedAxis(null)
        
        toast.success('Axis updated successfully!')
      } else {
        const error = await response.json()
        console.error('Failed to update axis:', error)
        toast.error(error.detail || 'Failed to update axis')
      }
    } catch (error) {
      console.error('Error updating axis:', error)
      toast.error('Error updating axis')
    } finally {
      setLoading(false)
    }
  }

  const deleteAxis = async (axisId) => {
    if (!confirm('Are you sure you want to delete this axis? This will also delete the associated table and all data. This action cannot be undone.')) {
      return
    }
    
    try {
      setLoading(true)
      
      const response = await fetch(`/api/custom-axes/${axisId}?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        console.log('✅ Axis deleted successfully')
        
        // Refresh the axes list
        await loadAxesData()
        
        toast.success('Axis deleted successfully!')
      } else {
        const error = await response.json()
        console.error('Failed to delete axis:', error)
        toast.error(error.detail || 'Failed to delete axis')
      }
    } catch (error) {
      console.error('Error deleting axis:', error)
      toast.error('Error deleting axis')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (axis) => {
    setSelectedAxis(axis)
    setAxisForm({
      axis_name: axis.axis_name,
      description: axis.description,
      columns: axis.columns || []
    })
    setShowEditModal(true)
  }

  const addColumn = () => {
    if (!columnForm.column_name) {
      toast.error('Please enter a column name')
      return
    }
    
    // Check if column name already exists
    const existingColumn = axisForm.columns.find(col => 
      col.column_name.toLowerCase() === columnForm.column_name.toLowerCase()
    )
    if (existingColumn) {
      toast.error('Column name already exists')
      return
    }
    
    const newColumn = {
      ...columnForm,
      id: Date.now() // Temporary ID for UI
    }
    
    setAxisForm({
      ...axisForm,
      columns: [...axisForm.columns, newColumn]
    })
    
    // Reset column form
    setColumnForm({
      column_name: '',
      field_type: 'text',
      is_required: false,
      options: [],
      default_value: '',
      validation_rules: {}
    })
    
    toast.success('Column added successfully!')
  }

  const removeColumn = (columnIdOrIndex) => {
    setAxisForm({
      ...axisForm,
      columns: axisForm.columns.filter((col, index) => 
        typeof columnIdOrIndex === 'number' ? index !== columnIdOrIndex : col.id !== columnIdOrIndex
      )
    })
    toast.success('Column removed')
  }

  const updateColumnOptions = (columnId, newOptions) => {
    setAxisForm({
      ...axisForm,
      columns: axisForm.columns.map(col => 
        col.id === columnId ? { ...col, options: newOptions } : col
      )
    })
  }

  const getFieldTypeIcon = (type) => {
    switch (type) {
      case 'text': return <FileText className="w-4 h-4" />
      case 'number': return <BarChart3 className="w-4 h-4" />
      case 'date': return <Calendar className="w-4 h-4" />
      case 'checkbox': return <CheckCircle className="w-4 h-4" />
      case 'dropdown': return <Tag className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getFieldTypeColor = (type) => {
    switch (type) {
      case 'text': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'number': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'date': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
      case 'checkbox': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'dropdown': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const filteredAxes = axes.filter(axis => {
    const matchesSearch = axis.axis_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         axis.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && axis.is_active) ||
                         (filterStatus === 'inactive' && !axis.is_active)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading Custom Axes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
                Custom Axes Management
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create and manage custom dimensions with dynamic tables and columns
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadAxesData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Axis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Axes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{axes.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Axes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {axes.filter(a => a.is_active).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Nodes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {axes.reduce((sum, axis) => sum + (axis.nodes_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Tag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Columns</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {axes.reduce((sum, axis) => sum + (axis.columns?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search axes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Axes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAxes.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No custom axes found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by creating your first custom axis'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Axis
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredAxes.map((axis) => (
              <div
                key={axis.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {axis.axis_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Table: {axis.table_name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        axis.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {axis.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {axis.description || 'No description provided'}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Columns:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {axis.columns?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Nodes:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {axis.nodes_count || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* Columns Preview */}
                  {axis.columns && axis.columns.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Columns:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {axis.columns.slice(0, 3).map((column, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs ${getFieldTypeColor(column.field_type)}`}
                          >
                            {getFieldTypeIcon(column.field_type)}
                            <span className="ml-1">{column.column_name}</span>
                          </span>
                        ))}
                        {axis.columns.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{axis.columns.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(axis)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const axisNameForUrl = axis.axis_name.toLowerCase().replace(/\s+/g, '_')
                          console.log('Navigating to:', `/custom-axes/${axisNameForUrl}/manage`)
                          window.location.href = `/custom-axes/${axisNameForUrl}/manage`
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent rounded text-xs font-medium text-white bg-purple-600 hover:bg-purple-700"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Manage
                      </button>
                    </div>
                    <button
                      onClick={() => deleteAxis(axis.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 rounded text-xs font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Axis Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Custom Axis
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Axis Name *
                    </label>
                    <input
                      type="text"
                      value={axisForm.axis_name}
                      onChange={(e) => setAxisForm({...axisForm, axis_name: e.target.value})}
                      placeholder="e.g., Products, Departments"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={axisForm.description}
                      onChange={(e) => setAxisForm({...axisForm, description: e.target.value})}
                      placeholder="Brief description of this axis"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Column Definition */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Define Columns
                  </h4>
                  
                  {/* Add Column Form */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Column Name *
                        </label>
                        <input
                          type="text"
                          value={columnForm.column_name}
                          onChange={(e) => setColumnForm({...columnForm, column_name: e.target.value})}
                          placeholder="e.g., product_code"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Field Type *
                        </label>
                        <select
                          value={columnForm.field_type}
                          onChange={(e) => setColumnForm({...columnForm, field_type: e.target.value, options: []})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="dropdown">Dropdown</option>
                        </select>
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          onClick={addColumn}
                          className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Column
                        </button>
                      </div>
                    </div>
                    
                    {/* Options for dropdown/checkbox */}
                    {(columnForm.field_type === 'dropdown' || columnForm.field_type === 'checkbox') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Options (one per line)
                        </label>
                        <textarea
                          value={columnForm.options.join('\n')}
                          onChange={(e) => setColumnForm({...columnForm, options: e.target.value.split('\n').filter(opt => opt.trim())})}
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center mt-3">
                      <input
                        type="checkbox"
                        checked={columnForm.is_required}
                        onChange={(e) => setColumnForm({...columnForm, is_required: e.target.checked})}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Required field</span>
                    </div>
                  </div>

                  {/* Defined Columns List */}
                  {axisForm.columns.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Defined Columns ({axisForm.columns.length})
                      </h5>
                      <div className="space-y-2">
                        {axisForm.columns.map((column) => (
                          <div
                            key={column.id}
                            className="flex items-center justify-between bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg p-3"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-1 rounded ${getFieldTypeColor(column.field_type)}`}>
                                {getFieldTypeIcon(column.field_type)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {column.column_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {column.field_type} {column.is_required && '• Required'}
                                  {column.options.length > 0 && ` • ${column.options.length} options`}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeColumn(column.id)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={createAxis}
                disabled={!axisForm.axis_name || axisForm.columns.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Axis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Axis Modal - Similar to Create but with existing data */}
      {showEditModal && selectedAxis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Axis: {selectedAxis.axis_name}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Axis Name *
                    </label>
                    <input
                      type="text"
                      value={axisForm.axis_name}
                      onChange={(e) => setAxisForm({...axisForm, axis_name: e.target.value})}
                      placeholder="e.g., Products, Departments"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={axisForm.description}
                      onChange={(e) => setAxisForm({...axisForm, description: e.target.value})}
                      placeholder="Brief description of this axis"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Existing Columns */}
                {axisForm.columns.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                      Existing Columns ({axisForm.columns.length})
                    </h4>
                    <div className="space-y-2">
                      {axisForm.columns.map((column, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-500 rounded-lg p-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-1 rounded ${getFieldTypeColor(column.field_type)}`}>
                              {getFieldTypeIcon(column.field_type)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {column.column_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {column.field_type} {column.is_required && '• Required'}
                                {column.options && column.options.length > 0 && ` • ${column.options.length} options`}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeColumn(index)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Remove column"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Columns */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Add New Columns
                  </h4>
                  
                  {/* Add Column Form */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Column Name *
                        </label>
                        <input
                          type="text"
                          value={columnForm.column_name}
                          onChange={(e) => setColumnForm({...columnForm, column_name: e.target.value})}
                          placeholder="e.g., category, priority"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Data Type *
                        </label>
                        <select
                          value={columnForm.field_type}
                          onChange={(e) => setColumnForm({...columnForm, field_type: e.target.value, options: []})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:text-white"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="checkbox">Yes/No</option>
                          <option value="dropdown">Dropdown</option>
                        </select>
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addColumn}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                          <Plus className="w-4 h-4 inline mr-2" />
                          Add Column
                        </button>
                      </div>
                    </div>
                    
                    {/* Options for Dropdown */}
                    {columnForm.field_type === 'dropdown' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Dropdown Options (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={columnForm.options.join(', ')}
                          onChange={(e) => setColumnForm({
                            ...columnForm, 
                            options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt)
                          })}
                          placeholder="Option 1, Option 2, Option 3"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                    )}
                    
                    {/* Default Value */}
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Default Value (optional)
                      </label>
                      <input
                        type="text"
                        value={columnForm.default_value}
                        onChange={(e) => setColumnForm({...columnForm, default_value: e.target.value})}
                        placeholder="Default value for this field"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-600 dark:text-white"
                      />
                    </div>
                    
                    {/* Required Checkbox */}
                    <div className="mt-3 flex items-center">
                      <input
                        type="checkbox"
                        id="edit-column-required"
                        checked={columnForm.is_required}
                        onChange={(e) => setColumnForm({...columnForm, is_required: e.target.checked})}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="edit-column-required" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Required field
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={editAxis}
                disabled={!axisForm.axis_name}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Axis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomAxes