import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Upload, 
  Download, 
  Settings, 
  Layers, 
  List, 
  TreePine,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Move,
  Copy,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Info,
  FileSpreadsheet,
  FileText
} from 'lucide-react'
import { exportHierarchyToExcel, exportSelectedElements, importFromExcel } from '../utils/excelExport'
import CustomFieldsSettings from './CustomFieldsSettings'
import AuditTrail from './AuditTrail'

const UniversalDimensionTemplate = ({ 
  dimensionType = 'Entity',
  dimensionIcon = Layers,
  apiEndpoint = '/api/entities',
  customFields = [],
  onCustomFieldChange = () => {}
}) => {
  const [hierarchies, setHierarchies] = useState([])
  const [elements, setElements] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('tree') // 'tree' or 'list'
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [customFieldsConfig, setCustomFieldsConfig] = useState(customFields)
  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarContent, setSidebarContent] = useState(null)
  const [bulkActionMode, setBulkActionMode] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [auditTrailRecord, setAuditTrailRecord] = useState(null)

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API calls
      // const response = await fetch(apiEndpoint)
      // const data = await response.json()
      
      // Mock data for now
      setHierarchies([
        {
          id: 1,
          name: 'Corporate Structure',
          description: 'Main corporate hierarchy',
          level: 0,
          parent_id: null,
          children: [
            {
              id: 2,
              name: 'North America',
              description: 'North American operations',
              level: 1,
              parent_id: 1,
              children: [
                {
                  id: 3,
                  name: 'USA',
                  description: 'United States operations',
                  level: 2,
                  parent_id: 2,
                  children: []
                }
              ]
            }
          ]
        }
      ])
      
      setElements([
        {
          id: 1,
          code: 'ENT001',
          name: 'Parent Company',
          type: 'Parent',
          status: 'Active',
          hierarchy_id: 1,
          custom_fields: {}
        },
        {
          id: 2,
          code: 'ENT002',
          name: 'Subsidiary A',
          type: 'Subsidiary',
          status: 'Active',
          hierarchy_id: 2,
          custom_fields: {}
        }
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddHierarchy = () => {
    setSidebarContent({
      type: 'add-hierarchy',
      title: 'Add New Hierarchy',
      data: { name: '', description: '', parent_id: null }
    })
    setShowSidebar(true)
  }

  const handleAddElement = () => {
    setSidebarContent({
      type: 'add-element',
      title: 'Add New Element',
      data: { code: '', name: '', type: '', hierarchy_id: null }
    })
    setShowSidebar(true)
  }

  const handleEditItem = (item, type) => {
    setSidebarContent({
      type: `edit-${type}`,
      title: `Edit ${type}`,
      data: item
    })
    setShowSidebar(true)
  }

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      const result = await importFromExcel(file)
      
      // Process imported data
      if (result.hierarchies.length > 0) {
        console.log('Imported hierarchies:', result.hierarchies)
        // TODO: Send to backend API
      }
      
      if (result.elements.length > 0) {
        console.log('Imported elements:', result.elements)
        // TODO: Send to backend API
      }

      // Show success message
      alert(`Import successful! ${result.hierarchies.length} hierarchies and ${result.elements.length} elements imported.`)
      
    } catch (error) {
      console.error('Import error:', error)
      alert('Import failed: ' + error.message)
    } finally {
      setLoading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleExport = () => {
    try {
      const result = exportHierarchyToExcel(hierarchies, elements, dimensionType)
      if (result.success) {
        alert(`Export successful! File saved as: ${result.filename}`)
      } else {
        alert(`Export failed: ${result.message}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed: ' + error.message)
    }
  }

  const handleExportSelected = () => {
    if (selectedItems.size === 0) {
      alert('Please select elements to export')
      return
    }

    try {
      const selectedElements = elements.filter(element => selectedItems.has(element.id))
      const result = exportSelectedElements(selectedElements, dimensionType)
      if (result.success) {
        alert(`Export successful! ${result.message}`)
      } else {
        alert(`Export failed: ${result.message}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed: ' + error.message)
    }
  }

  const handleSaveCustomFields = (updatedFields) => {
    setCustomFieldsConfig(updatedFields)
    onCustomFieldChange(updatedFields)
    // TODO: Save to backend API
    console.log('Custom fields saved:', updatedFields)
  }

  const handleDragStart = (e, item, type) => {
    setDraggedItem({ ...item, type })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.outerHTML)
  }

  const handleDragOver = (e, targetItem) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverItem(targetItem)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e, targetItem) => {
    e.preventDefault()
    
    if (!draggedItem || !targetItem) return

    // Prevent dropping on itself
    if (draggedItem.id === targetItem.id) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    // Handle hierarchy reordering
    if (draggedItem.type === 'hierarchy' && targetItem.type === 'hierarchy') {
      handleHierarchyReorder(draggedItem, targetItem)
    }
    
    // Handle element reordering
    if (draggedItem.type === 'element' && targetItem.type === 'element') {
      handleElementReorder(draggedItem, targetItem)
    }

    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleHierarchyReorder = (draggedHierarchy, targetHierarchy) => {
    // TODO: Implement hierarchy reordering logic
    console.log('Reordering hierarchy:', draggedHierarchy.name, 'to', targetHierarchy.name)
    
    // Update local state
    const updatedHierarchies = [...hierarchies]
    // Implementation would go here
    
    setHierarchies(updatedHierarchies)
  }

  const handleElementReorder = (draggedElement, targetElement) => {
    // TODO: Implement element reordering logic
    console.log('Reordering element:', draggedElement.name, 'to', targetElement.name)
    
    // Update local state
    const updatedElements = [...elements]
    // Implementation would go here
    
    setElements(updatedElements)
  }

  const handleBulkMove = () => {
    if (selectedItems.size === 0) {
      alert('Please select elements to move')
      return
    }

    // TODO: Implement bulk move functionality
    console.log('Bulk move selected items:', Array.from(selectedItems))
    alert(`Moving ${selectedItems.size} selected items`)
  }

  const handleBulkEdit = () => {
    if (selectedItems.size === 0) {
      alert('Please select elements to edit')
      return
    }

    // TODO: Implement bulk edit functionality
    console.log('Bulk edit selected items:', Array.from(selectedItems))
    alert(`Editing ${selectedItems.size} selected items`)
  }

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) {
      alert('Please select elements to delete')
      return
    }

    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} selected items?`)) {
      // TODO: Implement bulk delete functionality
      console.log('Bulk delete selected items:', Array.from(selectedItems))
      
      // Update local state
      const updatedElements = elements.filter(element => !selectedItems.has(element.id))
      setElements(updatedElements)
      setSelectedItems(new Set())
      
      alert(`Deleted ${selectedItems.size} items`)
    }
  }

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderHierarchyTree = (nodes, level = 0) => {
    return nodes.map(node => (
      <div key={node.id} className="ml-4">
        <div 
          className={`flex items-center py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group transition-colors ${
            dragOverItem?.id === node.id ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600' : ''
          } ${
            draggedItem?.id === node.id ? 'opacity-50' : ''
          }`}
          draggable
          onDragStart={(e) => handleDragStart(e, node, 'hierarchy')}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
        >
          <button
            onClick={() => toggleNode(node.id)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-2"
          >
            {node.children && node.children.length > 0 ? (
              expandedNodes.has(node.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>
          
          <div className="flex-1 flex items-center">
            <Layers className="h-4 w-4 text-blue-500 mr-2" />
            <span className="font-medium">{node.name}</span>
            <span className="text-sm text-gray-500 ml-2">({node.children?.length || 0} children)</span>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setAuditTrailRecord({ tableName: 'dimension_hierarchies', recordId: node.id })
                setShowAuditTrail(true)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1"
              title="View audit trail"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEditItem(node, 'hierarchy')}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEditItem(node, 'hierarchy')}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
        
        {expandedNodes.has(node.id) && node.children && (
          <div className="ml-4">
            {renderHierarchyTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  const renderElementsList = () => {
    return elements.map(element => (
      <div 
        key={element.id} 
        className={`flex items-center py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors ${
          dragOverItem?.id === element.id ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600' : ''
        } ${
          draggedItem?.id === element.id ? 'opacity-50' : ''
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, element, 'element')}
        onDragOver={(e) => handleDragOver(e, element)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, element)}
      >
        <input
          type="checkbox"
          checked={selectedItems.has(element.id)}
          onChange={(e) => {
            const newSelected = new Set(selectedItems)
            if (e.target.checked) {
              newSelected.add(element.id)
            } else {
              newSelected.delete(element.id)
            }
            setSelectedItems(newSelected)
          }}
          className="mr-3"
        />
        
        <div className="flex-1 grid grid-cols-4 gap-4">
          <div>
            <span className="font-medium">{element.code}</span>
          </div>
          <div>
            <span>{element.name}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500">{element.type}</span>
          </div>
          <div>
            <span className={`px-2 py-1 rounded-full text-xs ${
              element.status === 'Active' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
            }`}>
              {element.status}
            </span>
          </div>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setAuditTrailRecord({ tableName: 'dimension_elements', recordId: element.id })
              setShowAuditTrail(true)
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1"
            title="View audit trail"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditItem(element, 'element')}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditItem(element, 'element')}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>
    ))
  }

  const renderSidebar = () => {
    if (!showSidebar || !sidebarContent) return null

    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {sidebarContent.title}
            </h3>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {sidebarContent.type === 'add-hierarchy' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hierarchy Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter hierarchy name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows="3"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parent Hierarchy
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                    <option value="">Select parent hierarchy</option>
                    {/* TODO: Populate with actual hierarchies */}
                  </select>
                </div>
              </div>
            )}

            {sidebarContent.type === 'add-element' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Element Code
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter element code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Element Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter element name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                    <option value="">Select type</option>
                    <option value="Parent">Parent</option>
                    <option value="Subsidiary">Subsidiary</option>
                    <option value="Branch">Branch</option>
                    <option value="Division">Division</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hierarchy
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                    <option value="">Select hierarchy</option>
                    {/* TODO: Populate with actual hierarchies */}
                  </select>
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Custom Fields
                </h4>
                <div className="space-y-3">
                  {customFields.map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'text' && (
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder={field.placeholder}
                        />
                      )}
                      {field.type === 'select' && (
                        <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                          <option value="">Select {field.name}</option>
                          {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {field.type === 'boolean' && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {field.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSidebar(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement save functionality
                  setShowSidebar(false)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                {React.createElement(dimensionIcon, { className: "h-8 w-8 mr-3 text-blue-600" })}
                {dimensionType} Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage {dimensionType.toLowerCase()} hierarchies and elements with advanced customization
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSettings(true)}
                className="btn-secondary flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
              <button
                onClick={loadData}
                className="btn-secondary flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Taskbar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAddHierarchy}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Hierarchy
              </button>
              <button
                onClick={handleAddElement}
                className="btn-secondary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Element
              </button>
              <label className="btn-secondary flex items-center cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <div className="relative group">
                <button className="btn-secondary flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={handleExport}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export All Data
                    </button>
                    <button
                      onClick={handleExportSelected}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export Selected
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setViewMode('tree')}
                  className={`px-3 py-2 flex items-center ${
                    viewMode === 'tree' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <TreePine className="h-4 w-4 mr-1" />
                  Tree
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 flex items-center ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hierarchies Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-blue-600" />
                  Hierarchies
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {hierarchies.length} active
                </span>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="space-y-2">
                  {viewMode === 'tree' ? (
                    renderHierarchyTree(hierarchies)
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      List view for hierarchies coming soon
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Elements Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <List className="h-5 w-5 mr-2 text-green-600" />
                  Elements
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {elements.length} total
                </span>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div>Code</div>
                    <div>Name</div>
                    <div>Type</div>
                    <div>Status</div>
                  </div>
                  {renderElementsList()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedItems.size} items selected
              </span>
              <button 
                onClick={handleBulkMove}
                className="btn-secondary flex items-center"
              >
                <Move className="h-4 w-4 mr-2" />
                Move
              </button>
              <button 
                onClick={handleBulkEdit}
                className="btn-secondary flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button 
                onClick={handleBulkDelete}
                className="btn-secondary flex items-center text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
              <button 
                onClick={handleExportSelected}
                className="btn-secondary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      {renderSidebar()}

      {/* Custom Fields Settings Modal */}
      <CustomFieldsSettings
        dimensionType={dimensionType}
        customFields={customFieldsConfig}
        onSave={handleSaveCustomFields}
        onClose={() => setShowSettings(false)}
        isVisible={showSettings}
      />

      {/* Audit Trail Modal */}
      <AuditTrail
        tableName={auditTrailRecord?.tableName}
        recordId={auditTrailRecord?.recordId}
        isVisible={showAuditTrail}
        onClose={() => setShowAuditTrail(false)}
      />
    </div>
  )
}

export default UniversalDimensionTemplate
