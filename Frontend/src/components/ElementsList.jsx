import React, { useState } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Move,
  Copy,
  MoreHorizontal,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Layers,
  X,
  Download,
  Upload
} from 'lucide-react'
import RightSidebar from './RightSidebar'

const ElementsList = ({ items = [], type = 'account', hierarchies = [], onAddItem, onEditItem, onDeleteItem, onRefresh, customFields = [], axisName = null }) => {
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showSidebar, setShowSidebar] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [sidebarMode, setSidebarMode] = useState('add') // 'add', 'edit', 'view'
  const [showImportModal, setShowImportModal] = useState(false)
  const [bulkActionMode, setBulkActionMode] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)

  const toggleSelection = (itemId) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)))
    }
  }

  const handleAddItem = () => {
    setEditingItem(null)
    setSidebarMode('add')
    setShowSidebar(true)
    // Don't call onAddItem immediately - let the form handle the submission
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setSidebarMode('edit')
    setShowSidebar(true)
    if (onEditItem) onEditItem(item)
  }

  const handleViewItem = (item) => {
    setEditingItem(item)
    setSidebarMode('view')
    setShowSidebar(true)
  }

  const handleDeleteItem = async (item) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      console.log('Deleting item:', item)
      if (onDeleteItem) {
        const success = await onDeleteItem(item.code || item.entity_code)
        if (!success) {
          alert('Failed to delete item')
        }
      }
    }
  }

  const handleSidebarClose = () => {
    setShowSidebar(false)
    setEditingItem(null)
    setSidebarMode('add')
  }

  const handleSidebarSave = async (savedEntity) => {
    console.log('Entity saved:', savedEntity)
    setShowSidebar(false)
    setEditingItem(null)
    setSidebarMode('add')
    
    // Call the appropriate API function
    let success = false
    if (savedEntity.id) {
      // Editing existing entity
      success = await onEditItem(savedEntity)
    } else {
      // Adding new entity
      success = await onAddItem(savedEntity)
    }
    
    if (success) {
      console.log('Entity operation successful')
    } else {
      console.error('Entity operation failed')
      alert('Failed to save entity')
    }
  }

  const handleImport = () => {
    setShowImportModal(true)
  }

  const handleFileImport = (event) => {
    const file = event.target.files[0]
    if (file) {
      console.log('Importing file:', file.name)
      // TODO: Implement file import logic
      setShowImportModal(false)
    }
  }

  // Bulk action handlers
  const handleCopyItem = (item) => {
    // Create a duplicate with a new name
    const duplicatedItem = {
      ...item,
      id: null, // New item
      name: `${item.name} (Copy)`,
      code: `${item.code}_COPY`
    }
    
    // Set as editing item to open sidebar in edit mode
    setEditingItem(duplicatedItem)
    setSidebarMode('add')
    setShowSidebar(true)
  }

  const handleBulkEdit = () => {
    console.log('Bulk edit selected items:', Array.from(selectedItems))
    // TODO: Implement bulk edit logic
  }

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.size} selected items?`)) {
      console.log('Bulk delete selected items:', Array.from(selectedItems))
      // TODO: Implement bulk delete logic
      setSelectedItems(new Set())
      setShowBulkActions(false)
    }
  }

  const handleBulkExport = () => {
    const selectedElements = items.filter(item => selectedItems.has(item.id))
    console.log('Bulk export selected items:', selectedElements)
    // TODO: Implement bulk export logic
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.code?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const aValue = a[sortField] || ''
      const bValue = b[sortField] || ''
      const comparison = aValue.toString().localeCompare(bValue.toString())
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {type === 'hierarchy' ? 'Hierarchies' : 'Elements'} List
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredItems.length} of {items.length} items • {selectedItems.size} selected
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn-secondary flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="btn-secondary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button 
            onClick={handleImport}
            className="btn-secondary flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
        </div>
      </div>

      {/* Add Element Button */}
      <div className="mb-4">
        <button 
          onClick={handleAddItem}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {type === 'hierarchy' ? 'Hierarchy' : 'Element'}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${type === 'hierarchy' ? 'hierarchies' : axisName ? `${axisName} elements` : 'elements'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkEdit}
                className="btn-secondary text-sm flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={handleBulkEdit}
                className="btn-secondary text-sm flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={handleBulkExport}
                className="btn-secondary text-sm flex items-center"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              <button
                onClick={handleBulkDelete}
                className="btn-danger text-sm flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Code</span>
                    {getSortIcon('code')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Type</span>
                    {getSortIcon('type')}
                  </div>
                </th>
                {/* Dynamic custom field columns */}
                {customFields && customFields.map((field) => (
                  <th 
                    key={field.column_name}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort(field.column_name)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{field.column_name}</span>
                      {getSortIcon(field.column_name)}
                    </div>
                  </th>
                ))}
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    selectedItems.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-1 rounded mr-3">
                        {type === 'hierarchy' ? (
                          <Layers className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Building2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.code || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {item.type || 'N/A'}
                    </span>
                  </td>
                  {/* Dynamic custom field values */}
                  {customFields && customFields.map((field) => (
                    <td key={field.column_name} className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {item.custom_fields?.[field.column_name] || '-'}
                      </span>
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {item.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewItem(item)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleCopyItem(item)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No {type === 'hierarchy' ? 'hierarchies' : axisName ? `${axisName} elements` : 'elements'} found</p>
            <p className="text-sm">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : `Click "Add ${type === 'hierarchy' ? 'Hierarchy' : 'Element'}" to create your first item`
              }
            </p>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedItems.size} items selected
            </span>
            <button className="btn-secondary flex items-center">
              <Move className="h-4 w-4 mr-2" />
              Move
            </button>
            <button className="btn-secondary flex items-center">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </button>
            <button className="btn-secondary flex items-center text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
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

      {/* Right Sidebar */}
      <RightSidebar
        isVisible={showSidebar}
        onClose={handleSidebarClose}
        onSave={handleSidebarSave}
        entity={editingItem}
        hierarchies={hierarchies}
        mode={sidebarMode}
        customFields={customFields}
        axisName={axisName}
      />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Data</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Select a file to import {type === 'hierarchy' ? 'hierarchies' : 'elements'}:
              </p>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileImport}
                  className="hidden"
                  id="file-import"
                />
                <label
                  htmlFor="file-import"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                >
                  Choose File
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Supports Excel (.xlsx, .xls) and CSV files
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ElementsList
