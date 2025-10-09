import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Calculator,
  FileText,
  ArrowUpDown,
  Move,
  Copy,
  Eye,
  Download,
  Upload,
  Settings,
  Database,
  Link,
  Hash,
  Type,
  List,
  ToggleLeft,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp
} from 'lucide-react'

const FSTDesigner = ({ isVisible = false, onClose }) => {
  const [template, setTemplate] = useState({
    name: '',
    description: '',
    type: 'balance_sheet', // balance_sheet, income_statement, cash_flow
    items: []
  })
  const [selectedItem, setSelectedItem] = useState(null)
  const [showItemEditor, setShowItemEditor] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null)
  const [loading, setLoading] = useState(false)

  const templateTypes = [
    { value: 'balance_sheet', label: 'Balance Sheet', icon: FileText },
    { value: 'income_statement', label: 'Income Statement', icon: TrendingUp },
    { value: 'cash_flow', label: 'Cash Flow Statement', icon: ArrowUpDown },
    { value: 'custom', label: 'Custom Template', icon: Settings }
  ]

  const itemTypes = [
    { value: 'header', label: 'Header', icon: Type, description: 'Section header' },
    { value: 'line_item', label: 'Line Item', icon: List, description: 'Individual line item' },
    { value: 'formula', label: 'Formula', icon: Calculator, description: 'Calculated value' },
    { value: 'subtotal', label: 'Subtotal', icon: Hash, description: 'Subtotal calculation' },
    { value: 'total', label: 'Total', icon: CheckCircle, description: 'Total calculation' }
  ]

  const newItem = {
    id: null,
    type: 'line_item',
    label: '',
    code: '',
    formula: '',
    level: 0,
    is_bold: false,
    is_italic: false,
    show_zero: true,
    data_source: 'manual', // manual, account, hierarchy, formula
    account_codes: [],
    hierarchy_ids: [],
    custom_query: '',
    sort_order: 0
  }

  const [editingItem, setEditingItem] = useState(newItem)

  useEffect(() => {
    if (isVisible) {
      loadTemplate()
    }
  }, [isVisible])

  const loadTemplate = async () => {
    try {
      // Load existing FST template
      const response = await fetch('/api/universal-dimensions/fst-templates')
      const data = await response.json()
      if (data && data.length > 0) {
        setTemplate(data[0])
      }
    } catch (error) {
      console.error('Error loading FST template:', error)
      // Mock data for development
      setTemplate({
        name: 'Consolidated Balance Sheet',
        description: 'Main consolidated balance sheet template',
        type: 'balance_sheet',
        items: [
          { id: 1, type: 'header', label: 'ASSETS', level: 0, sort_order: 1 },
          { id: 2, type: 'header', label: 'Current Assets', level: 1, sort_order: 2 },
          { id: 3, type: 'line_item', label: 'Cash and Cash Equivalents', code: 'CASH', level: 2, sort_order: 3, data_source: 'account', account_codes: ['1000', '1001'] },
          { id: 4, type: 'line_item', label: 'Accounts Receivable', code: 'AR', level: 2, sort_order: 4, data_source: 'account', account_codes: ['1100'] },
          { id: 5, type: 'subtotal', label: 'Total Current Assets', level: 1, sort_order: 5, formula: 'SUM(CASH, AR)' },
          { id: 6, type: 'header', label: 'LIABILITIES', level: 0, sort_order: 6 },
          { id: 7, type: 'header', label: 'Current Liabilities', level: 1, sort_order: 7 },
          { id: 8, type: 'line_item', label: 'Accounts Payable', code: 'AP', level: 2, sort_order: 8, data_source: 'account', account_codes: ['2000'] },
          { id: 9, type: 'total', label: 'Total Liabilities', level: 1, sort_order: 9, formula: 'SUM(AP)' }
        ]
      })
    }
  }

  const handleAddItem = () => {
    setEditingItem({ ...newItem, sort_order: template.items.length + 1 })
    setShowItemEditor(true)
  }

  const handleEditItem = (item) => {
    setEditingItem({ ...item })
    setShowItemEditor(true)
  }

  const handleDeleteItem = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setTemplate({
        ...template,
        items: template.items.filter(item => item.id !== itemId)
      })
    }
  }

  const handleSaveItem = () => {
    if (!editingItem.label.trim()) {
      alert('Please enter a label for the item')
      return
    }

    const updatedItems = [...template.items]
    
    if (editingItem.id) {
      // Update existing item
      const index = updatedItems.findIndex(item => item.id === editingItem.id)
      updatedItems[index] = { ...editingItem }
    } else {
      // Add new item
      const newId = Math.max(...updatedItems.map(item => item.id || 0), 0) + 1
      updatedItems.push({ ...editingItem, id: newId })
    }

    setTemplate({
      ...template,
      items: updatedItems
    })
    
    setShowItemEditor(false)
    setEditingItem(newItem)
  }

  const handleMoveItem = (itemId, direction) => {
    const items = [...template.items]
    const index = items.findIndex(item => item.id === itemId)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex >= 0 && newIndex < items.length) {
      [items[index], items[newIndex]] = [items[newIndex], items[index]]
      // Update sort_order
      items.forEach((item, i) => {
        item.sort_order = i + 1
      })
      setTemplate({ ...template, items })
    }
  }

  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetItem) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem.id === targetItem.id) return

    const items = [...template.items]
    const draggedIndex = items.findIndex(item => item.id === draggedItem.id)
    const targetIndex = items.findIndex(item => item.id === targetItem.id)
    
    // Remove dragged item and insert at target position
    const [dragged] = items.splice(draggedIndex, 1)
    items.splice(targetIndex, 0, dragged)
    
    // Update sort_order
    items.forEach((item, i) => {
      item.sort_order = i + 1
    })
    
    setTemplate({ ...template, items })
    setDraggedItem(null)
  }

  const handleSaveTemplate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/universal-dimensions/fst-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      })
      
      if (response.ok) {
        alert('FST template saved successfully')
      } else {
        alert('Error saving FST template')
      }
    } catch (error) {
      console.error('Error saving FST template:', error)
      alert('Error saving FST template')
    } finally {
      setLoading(false)
    }
  }

  const renderItem = (item) => {
    const itemType = itemTypes.find(t => t.value === item.type)
    const IconComponent = itemType?.icon || List
    
    return (
      <div
        key={item.id}
        className={`flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg mb-2 cursor-move hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
          draggedItem?.id === item.id ? 'opacity-50' : ''
        }`}
        style={{ marginLeft: `${item.level * 20}px` }}
        draggable
        onDragStart={(e) => handleDragStart(e, item)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, item)}
      >
        <div className="flex items-center flex-1">
          <div className="p-1 rounded mr-3">
            <IconComponent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="flex-1">
            <div className={`flex items-center ${item.is_bold ? 'font-bold' : ''} ${item.is_italic ? 'italic' : ''}`}>
              <span className="text-gray-900 dark:text-white">{item.label}</span>
              {item.code && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({item.code})
                </span>
              )}
            </div>
            
            {item.formula && (
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Formula: {item.formula}
              </div>
            )}
            
            {item.data_source === 'account' && item.account_codes && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                Accounts: {item.account_codes.join(', ')}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleMoveItem(item.id, 'up')}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="Move up"
          >
            <ArrowUpDown className="h-3 w-3 rotate-180" />
          </button>
          <button
            onClick={() => handleMoveItem(item.id, 'down')}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="Move down"
          >
            <ArrowUpDown className="h-3 w-3" />
          </button>
          <button
            onClick={() => handleEditItem(item)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteItem(item.id)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-500"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  const renderItemEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {editingItem.id ? 'Edit Item' : 'Add New Item'}
        </h3>
        <button
          onClick={() => setShowItemEditor(false)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Item Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Item Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {itemTypes.map((type) => {
            const IconComponent = type.icon
            return (
              <button
                key={type.value}
                onClick={() => setEditingItem({ ...editingItem, type: type.value })}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  editingItem.type === type.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="font-medium">{type.label}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {type.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Label *
        </label>
        <input
          type="text"
          value={editingItem.label}
          onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Enter item label"
        />
      </div>

      {/* Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Code
        </label>
        <input
          type="text"
          value={editingItem.code}
          onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Enter item code"
        />
      </div>

      {/* Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Indentation Level
        </label>
        <select
          value={editingItem.level}
          onChange={(e) => setEditingItem({ ...editingItem, level: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value={0}>Level 0 (No indent)</option>
          <option value={1}>Level 1 (20px indent)</option>
          <option value={2}>Level 2 (40px indent)</option>
          <option value={3}>Level 3 (60px indent)</option>
          <option value={4}>Level 4 (80px indent)</option>
        </select>
      </div>

      {/* Data Source */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Data Source
        </label>
        <select
          value={editingItem.data_source}
          onChange={(e) => setEditingItem({ ...editingItem, data_source: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="manual">Manual Entry</option>
          <option value="account">Account Balance</option>
          <option value="hierarchy">Hierarchy Data</option>
          <option value="formula">Formula</option>
          <option value="custom_query">Custom SQL Query</option>
        </select>
      </div>

      {/* Formula */}
      {(editingItem.type === 'formula' || editingItem.type === 'subtotal' || editingItem.type === 'total') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Formula
          </label>
          <input
            type="text"
            value={editingItem.formula}
            onChange={(e) => setEditingItem({ ...editingItem, formula: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., SUM(CASH, AR) or CASH + AR"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use item codes in formulas. Available functions: SUM, AVG, MAX, MIN, IF
          </p>
        </div>
      )}

      {/* Account Codes */}
      {editingItem.data_source === 'account' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Account Codes
          </label>
          <input
            type="text"
            value={editingItem.account_codes?.join(', ') || ''}
            onChange={(e) => setEditingItem({ 
              ...editingItem, 
              account_codes: e.target.value.split(',').map(code => code.trim()).filter(code => code)
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., 1000, 1001, 1100"
          />
        </div>
      )}

      {/* Custom Query */}
      {editingItem.data_source === 'custom_query' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom SQL Query
          </label>
          <textarea
            value={editingItem.custom_query}
            onChange={(e) => setEditingItem({ ...editingItem, custom_query: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            rows="4"
            placeholder="SELECT SUM(balance) FROM accounts WHERE code IN ('1000', '1001')"
          />
        </div>
      )}

      {/* Formatting Options */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Formatting Options
        </label>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editingItem.is_bold}
              onChange={(e) => setEditingItem({ ...editingItem, is_bold: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Bold</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editingItem.is_italic}
              onChange={(e) => setEditingItem({ ...editingItem, is_italic: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Italic</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editingItem.show_zero}
              onChange={(e) => setEditingItem({ ...editingItem, show_zero: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Zero Values</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex space-x-3 pt-4">
        <button
          onClick={handleSaveItem}
          className="flex-1 btn-primary flex items-center justify-center"
        >
          <Save className="h-4 w-4 mr-2" />
          {editingItem.id ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </div>
  )

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              FST Designer
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Design Financial Statement Templates with formulas and dynamic data
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Template Settings */}
          <div className="w-1/3 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Type
                </label>
                <select
                  value={template.type}
                  onChange={(e) => setTemplate({ ...template, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {templateTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Enter template description"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSaveTemplate}
                  disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Template
                </button>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="w-2/3 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Template Items ({template.items.length})
              </h3>
              <button
                onClick={handleAddItem}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              {template.items.length > 0 ? (
                template.items
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(renderItem)
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items in template</p>
                  <p className="text-sm">Click "Add Item" to create your first template item</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Item Editor Modal */}
        {showItemEditor && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
              {renderItemEditor()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FSTDesigner
