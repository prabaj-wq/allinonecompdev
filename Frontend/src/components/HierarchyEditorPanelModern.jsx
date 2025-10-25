import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Building2, 
  Folder,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Download,
  Upload,
  Users,
  Settings,
  Eye,
  MoreVertical,
  ChevronRight,
  Search,
  Check,
  CheckSquare,
  Square
} from 'lucide-react'

const NodeForm = ({ onSave, onCancel, parentNode }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.code.trim()) newErrors.code = 'Code is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-4">
      <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3">
        Add Child Node to {parentNode?.name || 'Root'}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Node Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Sub Region"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Node Code *
            </label>
            <input
              type="text"
              placeholder="e.g., SR"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.code ? 'border-red-500' : 'border-gray-300'
              } dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500`}
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="submit"
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Create Node</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
        </div>
      </form>
    </div>
  )
}

const ElementForm = ({ element, onSave, onCancel, isEditing = false, hierarchy, customFields = [] }) => {
  const [formData, setFormData] = useState({
    name: element?.name || '',
    code: element?.code || '',
    entity_type: element?.entity_type || 'Subsidiary',
    geography: element?.geography || '',
    currency: element?.currency || 'USD',
    custom_fields: element?.custom_fields || {}
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.code.trim()) newErrors.code = 'Code is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSave({
        ...formData,
        hierarchy_id: hierarchy?.id
      })
    }
  }

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldName]: value
      }
    }))
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
      <h4 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
        {isEditing ? 'Edit Element' : 'Add New Element'}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Element Name *
            </label>
            <input
              type="text"
              placeholder="e.g., ABC Corporation"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Element Code *
            </label>
            <input
              type="text"
              placeholder="e.g., ABC"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.code ? 'border-red-500' : 'border-gray-300'
              } dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500`}
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Entity Type
            </label>
            <select
              value={formData.entity_type}
              onChange={(e) => setFormData(prev => ({ ...prev, entity_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
            >
              <option value="Parent">Parent</option>
              <option value="Subsidiary">Subsidiary</option>
              <option value="Associate">Associate</option>
              <option value="Investment">Investment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Geography
            </label>
            <input
              type="text"
              placeholder="e.g., North America, Europe"
              value={formData.geography}
              onChange={(e) => setFormData(prev => ({ ...prev, geography: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
              <option value="CHF">CHF</option>
              <option value="CNY">CNY</option>
            </select>
          </div>
        </div>
        
        {/* Custom Fields */}
        {customFields.length > 0 && (
          <div className="border-t pt-3">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Fields</h5>
            <div className="grid grid-cols-2 gap-3">
              {customFields.map((field) => (
                <div key={field.field_name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.display_name}
                  </label>
                  {field.field_type === 'text' && (
                    <input
                      type="text"
                      value={formData.custom_fields[field.field_name] || ''}
                      onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
                    />
                  )}
                  {field.field_type === 'dropdown' && (
                    <select
                      value={formData.custom_fields[field.field_name] || ''}
                      onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select...</option>
                      {field.dropdown_values?.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="submit"
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isEditing ? 'Update Element' : 'Create Element'}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
        </div>
      </form>
    </div>
  )
}

const ElementSelector = ({ availableElements, onAssign, onCancel, selectedNode }) => {
  const [selectedElements, setSelectedElements] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredElements = availableElements.filter(element =>
    element.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleElement = (elementId) => {
    setSelectedElements(prev => 
      prev.includes(elementId) 
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    )
  }

  const handleAssign = () => {
    if (selectedElements.length > 0) {
      onAssign(selectedElements)
    }
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
      <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
        Assign Elements to {selectedNode?.name || 'Root'}
      </h4>
      

      {/* Element List */}
      <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
        {filteredElements.map((element) => (
          <div
            key={element.id}
            onClick={() => toggleElement(element.id)}
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
              selectedElements.includes(element.id)
                ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-600'
                : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {selectedElements.includes(element.id) ? (
              <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">{element.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {element.code} • {element.entity_type} • {element.geography || 'No geography'} • {element.currency}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {selectedElements.length} element{selectedElements.length !== 1 ? 's' : ''} selected
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAssign}
            disabled={selectedElements.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            <span>Assign Selected</span>
          </button>
          <button
            onClick={onCancel}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const HierarchyEditorPanelModern = ({ 
  selectedNode,
  hierarchy,
  hierarchyStructure = { nodes: [], unassigned_entities: [] },
  onClose,
  onRefresh,
  selectedCompany,
  axisType = 'entity' // 'entity' or 'account'
}) => {
  // Determine API endpoints based on axis type
  const apiBase = axisType === 'account' ? 'axes-account' : 'axes-entity';
  const elementName = axisType === 'account' ? 'accounts' : 'entities';
  const [elements, setElements] = useState([])
  const [allElements, setAllElements] = useState([]) // All elements for selection
  const [loading, setLoading] = useState(false)
  const [showAddElementForm, setShowAddElementForm] = useState(false)
  const [showElementSelector, setShowElementSelector] = useState(false)
  const [editingElement, setEditingElement] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [customFields, setCustomFields] = useState([])
  const [showAddNodeForm, setShowAddNodeForm] = useState(false)

  // Load elements when selectedNode changes
  useEffect(() => {
    loadCustomFields()
    loadAllElements()
    if (selectedNode) {
      loadNodeElements()
    } else {
      loadUnassignedElements()
    }
  }, [selectedNode, hierarchyStructure])

  const loadCustomFields = async () => {
    try {
      const response = await fetch(`/api/${apiBase}/settings?company_name=${selectedCompany}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setCustomFields(data.custom_fields || [])
      }
    } catch (error) {
      console.error('Error loading custom fields:', error)
    }
  }

  const loadAllElements = async () => {
    try {
      const response = await fetch(`/api/${apiBase}/${elementName}?company_name=${selectedCompany}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setAllElements(data.entities || [])
      }
    } catch (error) {
      console.error('Error loading all elements:', error)
    }
  }

  const loadNodeElements = async () => {
    if (!selectedCompany || !hierarchy?.id) {
      console.warn('Missing selectedCompany or hierarchy.id for loadNodeElements')
      return
    }
    
    try {
      setLoading(true)
      const url = selectedNode?.id 
        ? `/api/${apiBase}/${elementName}?company_name=${selectedCompany}&hierarchy_id=${hierarchy.id}&node_id=${selectedNode.id}`
        : `/api/${apiBase}/${elementName}?company_name=${selectedCompany}&hierarchy_id=${hierarchy.id}`
      console.log('🔄 Loading node elements:', url)
      
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Full API response:', data)
        console.log('✅ Node elements loaded:', data.entities?.length || 0)
        setElements(data.entities || [])
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to load node elements:', response.status, errorText)
        setElements([])
      }
    } catch (error) {
      console.error('❌ Error loading node elements:', error)
      setElements([])
    } finally {
      setLoading(false)
    }
  }

  const loadUnassignedElements = async () => {
    if (!selectedCompany || !hierarchy?.id) {
      console.warn('Missing selectedCompany or hierarchy.id for loadUnassignedElements')
      return
    }
    
    try {
      setLoading(true)
      // For unassigned elements, we need to pass parent_id as null (not the string 'null')
      const url = `/api/${apiBase}/${elementName}?company_name=${selectedCompany}&hierarchy_id=${hierarchy.id}`
      console.log('🔄 Loading unassigned elements:', url)
      
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Filter for elements with no parent_id (unassigned to nodes)
        const unassignedElements = (data.entities || []).filter(entity => entity.parent_id === null)
        console.log('✅ Unassigned elements loaded:', unassignedElements.length)
        setElements(unassignedElements)
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to load unassigned elements:', response.status, errorText)
        setElements([])
      }
    } catch (error) {
      console.error('❌ Error loading unassigned elements:', error)
      setElements([])
    } finally {
      setLoading(false)
    }
  }

  const createElement = async (elementData) => {
    try {
      const response = await fetch(`/api/${apiBase}/${elementName}?company_name=${selectedCompany}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...elementData,
          parent_id: selectedNode?.id || null,
          hierarchy_id: hierarchy?.id
        })
      })

      if (response.ok) {
        console.log('✅ Element created successfully')
        setShowAddElementForm(false)
        
        // Comprehensive refresh to ensure UI is updated
        await loadAllElements() // Refresh available elements
        if (selectedNode) {
          await loadNodeElements()
        } else {
          await loadUnassignedElements()
        }
        if (onRefresh) {
          await onRefresh()
        }
        return true
      } else {
        const error = await response.text()
        console.error('❌ Failed to create element:', error)
        return false
      }
    } catch (error) {
      console.error('❌ Error creating element:', error)
      return false
    }
  }

  const updateElement = async (elementId, elementData) => {
    try {
      const response = await fetch(`/api/${apiBase}/${elementName}/${elementId}?company_name=${selectedCompany}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(elementData)
      })

      if (response.ok) {
        console.log('✅ Element updated successfully')
        setEditingElement(null)
        
        // Comprehensive refresh to ensure UI is updated
        await loadAllElements() // Refresh available elements
        if (selectedNode) {
          await loadNodeElements()
        } else {
          await loadUnassignedElements()
        }
        if (onRefresh) {
          await onRefresh()
        }
        return true
      } else {
        const error = await response.text()
        console.error('❌ Failed to update element:', error)
        return false
      }
    } catch (error) {
      console.error('❌ Error updating element:', error)
      return false
    }
  }

  const unassignElement = async (elementId) => {
    if (!confirm('Are you sure you want to remove this element from this node? The element will not be deleted, just unassigned.')) {
      return false
    }

    try {
      // Unassign by setting node_id to null
      const response = await fetch(`/api/${apiBase}/${elementName}/${elementId}?company_name=${selectedCompany}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          node_id: null,
          hierarchy_id: null
        })
      })

      if (response.ok) {
        console.log('✅ Element unassigned successfully')
        if (selectedNode) {
          loadNodeElements()
        } else {
          loadUnassignedElements()
        }
        if (onRefresh) {
          onRefresh()
        }
        return true
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to unassign element:', errorText)
        return false
      }
    } catch (error) {
      console.error('❌ Error unassigning element:', error)
      return false
    }
  }

  const deleteElement = async (elementId) => {
    if (!confirm('Are you sure you want to permanently delete this element? This action cannot be undone.')) {
      return false
    }

    try {
      const response = await fetch(`/api/${apiBase}/${elementName}/${elementId}?company_name=${selectedCompany}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        console.log('✅ Element deleted successfully')
        if (selectedNode) {
          loadNodeElements()
        } else {
          loadUnassignedElements()
        }
        if (onRefresh) {
          onRefresh()
        }
        return true
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to delete element:', errorText)
        return false
      }
    } catch (error) {
      console.error('❌ Error deleting element:', error)
      return false
    }
  }

  const assignElements = async (elementIds) => {
    try {
      if (!selectedNode) {
        console.error('No node selected for assignment')
        return false
      }

      console.log('🔄 Assigning elements to node:', selectedNode.id, 'Elements:', elementIds)
      console.log('🔍 Selected node details:', selectedNode)
      console.log('🔍 Hierarchy details:', hierarchy)
      
      // Calculate the target level for assigned elements
      const targetLevel = selectedNode ? selectedNode.level + 1 : 0
      
      for (const elementId of elementIds) {
        const assignmentData = {
          node_id: selectedNode.id,
          hierarchy_id: hierarchy.id,
          level: targetLevel
        }
        console.log('🔍 Assignment data for element', elementId, ':', assignmentData)
        
        const response = await fetch(`/api/${apiBase}/${elementName}/${elementId}?company_name=${selectedCompany}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(assignmentData)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Failed to assign element:', elementId, errorText)
          return false
        }
        
        const result = await response.json()
        console.log('✅ Element', elementId, 'assigned successfully. Result:', result)
      }

      console.log('✅ All elements assigned successfully')
      setShowElementSelector(false)
      
      // Refresh all data to ensure consistency
      await loadAllElements() // Refresh the available elements list
      if (selectedNode) {
        await loadNodeElements()
      } else {
        await loadUnassignedElements()
      }
      if (onRefresh) {
        await onRefresh()
      }
      return true
    } catch (error) {
      console.error('❌ Error assigning elements:', error)
      return false
    }
  }

  const handleSaveElement = async (elementData) => {
    if (editingElement) {
      await updateElement(editingElement.id, elementData)
    } else {
      await createElement(elementData)
    }
  }

  const handleCancelForm = () => {
    setShowAddElementForm(false)
    setShowElementSelector(false)
    setShowAddNodeForm(false)
    setEditingElement(null)
  }

  const handleAddChildNode = () => {
    setShowAddNodeForm(true)
  }

  const createChildNode = async (nodeData) => {
    try {
      const response = await fetch(`/api/${apiBase}/hierarchy-nodes?company_name=${selectedCompany}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...nodeData,
          parent_id: selectedNode?.id,
          hierarchy_id: hierarchy?.id,
          level: selectedNode ? selectedNode.level + 1 : 0
        })
      })

      if (response.ok) {
        console.log('✅ Child node created successfully')
        setShowAddNodeForm(false)
        if (onRefresh) {
          onRefresh()
        }
        return true
      } else {
        const error = await response.text()
        console.error('❌ Failed to create child node:', error)
        return false
      }
    } catch (error) {
      console.error('❌ Error creating child node:', error)
      return false
    }
  }

  // Get available elements for assignment (not already assigned to this node)
  const getAvailableElements = () => {
    const assignedElementIds = elements.map(e => e.id)
    return allElements.filter(element => !assignedElementIds.includes(element.id))
  }

  const filteredElements = elements.filter(element =>
    element.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {selectedNode ? (
              <>
                <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedNode.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Code: {selectedNode.code}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Root Elements
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Unassigned elements in {hierarchy?.hierarchy_name}
                  </p>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowElementSelector(true)}
            >
              <Users className="h-4 w-4" />
              <span>Assign Elements</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Add Node Form */}
        {showAddNodeForm && (
          <NodeForm
            onSave={createChildNode}
            onCancel={handleCancelForm}
            parentNode={selectedNode}
          />
        )}

        {/* Element Selector */}
        {showElementSelector && (
          <ElementSelector
            availableElements={getAvailableElements()}
            onAssign={assignElements}
            onCancel={handleCancelForm}
            selectedNode={selectedNode}
          />
        )}

        {/* Add Element Form */}
        {showAddElementForm && (
          <ElementForm
            onSave={handleSaveElement}
            onCancel={handleCancelForm}
            hierarchy={hierarchy}
            customFields={customFields}
          />
        )}

        {/* Edit Element Form */}
        {editingElement && (
          <ElementForm
            element={editingElement}
            onSave={handleSaveElement}
            onCancel={handleCancelForm}
            isEditing={true}
            hierarchy={hierarchy}
            customFields={customFields}
          />
        )}

        {/* Elements List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading elements...</p>
          </div>
        ) : filteredElements.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No elements found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {selectedNode 
                ? `No elements assigned to ${selectedNode.name}` 
                : 'No unassigned elements in this hierarchy'
              }
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setShowElementSelector(true)}
              >
                <Users className="h-4 w-4" />
                <span>Assign Existing</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredElements.map((element) => (
              <div
                key={element.id}
                className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {element.name}
                      </h4>
                      <div className="grid grid-cols-2 gap-x-6 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <div className="flex items-center space-x-4">
                          <span><strong>Code:</strong> {element.code}</span>
                          <span><strong>Type:</strong> {element.entity_type || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span><strong>Geography:</strong> {element.geography || 'N/A'}</span>
                          <span><strong>Currency:</strong> {element.currency || 'N/A'}</span>
                        </div>
                      </div>
                      {/* Custom Fields Display */}
                      {element.custom_fields && Object.keys(element.custom_fields).length > 0 && (
                        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <strong>Custom:</strong> {Object.entries(element.custom_fields).map(([key, value]) => `${key}: ${value}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingElement(element)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400"
                      title="Edit element"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {selectedNode ? (
                      <button
                        onClick={() => unassignElement(element.id)}
                        className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg text-orange-600 dark:text-orange-400"
                        title="Remove from node"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteElement(element.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400"
                        title="Delete element permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            {filteredElements.length} element{filteredElements.length !== 1 ? 's' : ''} 
            {searchTerm && ` matching "${searchTerm}"`}
          </span>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400">
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HierarchyEditorPanelModern
