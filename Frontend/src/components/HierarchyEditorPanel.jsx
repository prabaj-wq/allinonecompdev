import React, { useState, useEffect } from 'react'
import NotificationBubble from './NotificationBubble'
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
  Upload
} from 'lucide-react'
import DraggableElement from './DraggableElement'

const HierarchyEditorPanel = ({ 
  selectedNode,
  hierarchy,
  hierarchyStructure = { nodes: [], unassigned_entities: [], unassigned_accounts: [] },
  onSave,
  onAddNode,
  onDeleteNode,
  onAddElement,
  onDeleteElement,
  onClose,
  onRefresh,
  onExportHierarchyData,
  onImportHierarchyData,
  hierarchyType = 'entity' // 'entity' or 'account'
}) => {
  const [formData, setFormData] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItemType, setNewItemType] = useState('element') // 'node' or 'element'
  const [draggedItem, setDraggedItem] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [showElementSelector, setShowElementSelector] = useState(false)
  const [selectedEntities, setSelectedEntities] = useState([])
  const [selectionKey, setSelectionKey] = useState(0) // Force re-render
  const [selectedItem, setSelectedItem] = useState(null) // For properties sidebar
  const [showPropertiesSidebar, setShowPropertiesSidebar] = useState(false)
  const [allAccounts, setAllAccounts] = useState([]) // All accounts for selection
  const [notification, setNotification] = useState(null) // Notification state
  
  // Helper function to show notifications
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
  }
  
  // Debug selectedEntities state changes
  useEffect(() => {
    console.log('🔍 selectedEntities state changed:', selectedEntities)
  }, [selectedEntities])

  // Debug hierarchyStructure and selectedNode state changes
  useEffect(() => {
    console.log('🔍 HierarchyEditorPanel - hierarchyStructure changed:', hierarchyStructure);
    console.log('🔍 HierarchyEditorPanel - selectedNode changed:', selectedNode);
    if (selectedNode && hierarchyStructure?.nodes) {
      const currentSelectedNodeData = hierarchyStructure.nodes.find(node => node.id === selectedNode.id);
      console.log('🔍 HierarchyEditorPanel - currentSelectedNodeData (after refresh):', currentSelectedNodeData);
      console.log('🔍 HierarchyEditorPanel - elements in currentSelectedNodeData:', currentSelectedNodeData?.elements);
    }
  }, [hierarchyStructure, selectedNode]);

  useEffect(() => {
    if (selectedNode) {
      if (hierarchyType === 'account') {
        setFormData({
          node_name: selectedNode.node_name || selectedNode.name || '',
          node_code: selectedNode.node_code || selectedNode.code || '',
          description: selectedNode.description || '',
          hierarchy_id: selectedNode.hierarchy_id || null,
          parent_node_id: selectedNode.parent_node_id || null,
          level: selectedNode.level || 0,
          sort_order: selectedNode.sort_order || 0
        })
      } else {
        setFormData({
          entity_name: selectedNode.entity_name || '',
          entity_code: selectedNode.entity_code || '',
          entity_type: selectedNode.entity_type || 'Subsidiary',
          country: selectedNode.country || '',
          currency: selectedNode.currency || 'USD',
          hierarchy_id: selectedNode.hierarchy_id || null,
          is_active: selectedNode.is_active !== false,
          status: selectedNode.status || 'Active'
        })
      }
      setIsEditing(false)
    }
  }, [selectedNode, hierarchyType])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Code is always required for both nodes and elements
    const codeField = hierarchyType === 'account' ? 'node_code' : 'code'
    const nameField = hierarchyType === 'account' ? 'node_name' : 'name'
    
    if (!formData[codeField]?.trim()) {
      newErrors[codeField] = 'Code is required'
    }
    
    // Name/Description is always required for both nodes and elements
    if (!formData[nameField]?.trim()) {
      newErrors[nameField] = newItemType === 'node' ? 'Description is required' : 'Name is required'
    }
    
    // Entity type is only required for elements, not nodes
    if (newItemType === 'element' && !formData.entity_type?.trim()) {
      newErrors.entity_type = 'Entity type is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    try {
      if (newItemType === 'node') {
        // Debug: Log the form data being sent
        console.log('🚀 Sending node data:', formData)
        console.log('🚀 Form data keys:', Object.keys(formData))
        console.log('🚀 Hierarchy type:', hierarchyType)
        
        // For nodes, call the appropriate hierarchy-nodes API endpoint based on type
        const endpoint = hierarchyType === 'account' ? '/api/account-hierarchy-nodes' : '/api/axes-entity/hierarchy-nodes'
        const response = await fetch(`${endpoint}?company_name=Default%20Company`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('Node created successfully:', result)
          showNotification('Node created successfully!', 'success')
          setShowAddForm(false)
          setIsEditing(false)
          setFormData({})
          setErrors({})
          // Refresh the hierarchy structure to show the new node
          if (onRefresh) {
            await onRefresh()
          }
        } else {
          const error = await response.json()
          console.error('Error creating node:', error)
          showNotification(`Error creating node: ${error.detail || 'Unknown error'}`, 'error')
        }
      } else {
        // For elements, use the existing onSave function
        if (onSave) {
          await onSave(formData)
          setShowAddForm(false)
          setIsEditing(false)
          setFormData({})
          setErrors({})
        }
      }
    } catch (error) {
      console.error('Error saving:', error)
      showNotification('Error saving. Please try again.', 'error')
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setIsEditing(false)
    setFormData({})
    setErrors({})
    setShowElementSelector(false)
    setSelectedEntities([])
  }

  const handleEntityToggle = (entity) => {
    console.log('🔍 handleEntityToggle called with:', entity)
    console.log('🔍 Entity ID:', entity.id, 'Type:', typeof entity.id)
    
    setSelectedEntities(prev => {
      console.log('🔍 Current selectedEntities:', prev)
      console.log('🔍 Current selectedEntities IDs:', prev.map(e => e.id))
      
      const isSelected = prev.some(e => e.id === entity.id)
      console.log('🔍 Is selected:', isSelected)
      
      if (isSelected) {
        const newSelection = prev.filter(e => e.id !== entity.id)
        console.log('🔍 Removing, new selection:', newSelection)
        setSelectionKey(prev => prev + 1) // Force re-render
        return newSelection
      } else {
        const newSelection = [...prev, entity]
        console.log('🔍 Adding, new selection:', newSelection)
        setSelectionKey(prev => prev + 1) // Force re-render
        return newSelection
      }
    })
  }

  const handleAssignElements = async () => {
    try {
      console.log('🚀 Assigning elements to node:', selectedNode)
      console.log('🚀 Selected entities:', selectedEntities)
      console.log('🚀 Hierarchy type:', hierarchyType)
      
      // Assign selected entities to the current node
      for (const entity of selectedEntities) {
        const updateData = {
          ...entity,
          node_id: selectedNode?.id || null, // Assign to the selected node
          hierarchy_id: hierarchy?.id
        }
        
        console.log('🚀 selectedNode?.id:', selectedNode?.id)
        console.log('🚀 hierarchy?.id:', hierarchy?.id)
        console.log('🚀 updateData.node_id:', updateData.node_id)
        console.log('🚀 updateData.hierarchy_id:', updateData.hierarchy_id)
        
        // Ensure we're assigning to the correct node
        if (!selectedNode?.id) {
          console.error('🚀 ERROR: No selected node ID! Cannot assign account.')
          showNotification('Error: No node selected. Please select a node first.', 'error')
          return
        }
        
        console.log('🚀 Updating entity with data:', updateData)
        console.log('🚀 Entity ID being sent:', entity.id, 'Type:', typeof entity.id)
        console.log('🚀 Account code:', entity.account_code || entity.code)
        
        // Call the API to update the entity's/account's node_id
        const endpoint = hierarchyType === 'account' ? `/api/ifrs-accounts/${entity.account_code || entity.code}` : `/api/axes-entity/entities/${entity.id}`
        console.log('🚀 Using endpoint:', endpoint)
        const response = await fetch(`${endpoint}?company_name=Default%20Company`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updateData)
        })
        
        console.log('🚀 Response status:', response.status)
        console.log('🚀 Response ok:', response.ok)
        
        if (response.ok) {
          const responseData = await response.json()
          console.log('🚀 Response data:', responseData)
          console.log(`🚀 Entity ${entity.id} assigned to node ${selectedNode?.id}`)
        } else {
          const error = await response.text()
          console.error('🚀 Error response:', error)
          console.error(`🚀 Failed to assign entity ${entity.id}:`, error)
          showNotification(`Failed to assign entity ${entity.name}: ${error || 'Unknown error'}`, 'error')
        }
      }
      
      // Refresh the hierarchy structure to show the changes
      if (onRefresh) {
        await onRefresh()
      }
      
      setShowElementSelector(false)
      setSelectedEntities([])
      showNotification(`Successfully assigned ${selectedEntities.length} ${hierarchyType === 'account' ? 'account(s)' : 'element(s)'} to the node!`, 'success')
    } catch (error) {
      console.error('Error assigning elements:', error)
      showNotification('Error assigning elements. Please try again.', 'error')
    }
  }

  const loadAllAccounts = async () => {
    if (hierarchyType === 'account') {
      try {
        const response = await fetch('/api/ifrs-accounts', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          const accounts = data.accounts || []
          console.log('🔍 Raw accounts from API:', accounts)
          
          // Transform accounts to match expected format
          const transformedAccounts = accounts.map((account, index) => ({
            id: account.id || `temp_${index}`, // Ensure ID is never undefined
            name: account.account_name || account.name || 'Unnamed Account',
            code: account.account_code || account.code || `CODE_${index}`,
            type: account.ifrs_category || account.account_type || 'Account',
            account_name: account.account_name || account.name || 'Unnamed Account',
            account_code: account.account_code || account.code || `CODE_${index}`,
            account_type: account.ifrs_category || account.account_type || 'Account',
            ifrs_category: account.ifrs_category || '',
            statement: account.statement || '',
            description: account.description || '',
            balance: account.balance || 0,
            hierarchy_id: account.hierarchy_id,
            node_id: account.node_id
          }))
          
          console.log('🔍 Transformed accounts sample:', transformedAccounts.slice(0, 2))
          console.log('🔍 Account IDs:', transformedAccounts.map(acc => acc.id))
          
          setAllAccounts(transformedAccounts)
        } else {
          console.error('Failed to load all accounts')
          setAllAccounts([])
        }
      } catch (error) {
        console.error('Error loading all accounts:', error)
        setAllAccounts([])
      }
    }
  }

  const handleAddNew = (type) => {
    console.log('handleAddNew called with type:', type)
    
    if (type === 'node') {
      // For nodes, show the form to create new node
      setNewItemType(type)
      setShowAddForm(true)
      setIsEditing(true)
      
      // Create new node data based on hierarchy type
      const newItem = hierarchyType === 'account' ? {
        node_name: '', // Description
        node_code: '', // Code
        description: '', // Additional description field
        hierarchy_id: hierarchy?.id,
        parent_node_id: selectedNode?.id || null,
        level: selectedNode ? (selectedNode.level || 0) + 1 : 0,
        sort_order: 0
      } : {
        name: '', // Name for the node
        code: '', // Code for the node
        hierarchy_id: hierarchy?.id,
        parent_id: selectedNode?.id || null,
        level: selectedNode ? (selectedNode.level || 0) + 1 : 0,
        sort_order: 0
      }
      
      setFormData(newItem)
      setErrors({})
    } else if (type === 'element') {
      // For elements, show multi-select dropdown of existing entities/accounts
      setShowElementSelector(true)
      setSelectedEntities([])
      
      // Load all accounts if this is an account hierarchy
      if (hierarchyType === 'account') {
        loadAllAccounts()
      }
    }
  }

  const handleDragStart = (element, type) => {
    setDraggedItem({ element, type })
  }

  const handleDragEnd = (element, type) => {
    setDraggedItem(null)
    setDropTarget(null)
  }

  const handleDrop = async (draggedData, dropTarget) => {
    if (!draggedData || !dropTarget) return
    
    try {
      // Handle drag and drop logic here
      console.log('Dropped:', draggedData, 'on:', dropTarget)
      setDraggedItem(null)
      setDropTarget(null)
    } catch (error) {
      console.error('Error moving element:', error)
    }
  }

  const getChildNodesAndElements = () => {
    if (selectedNode) {
      // Find the selected node in the hierarchy structure
      const findNodeById = (nodes, id) => {
        for (const node of nodes) {
          if (node.id === id) return node
          if (node.children) {
            const found = findNodeById(node.children, id)
            if (found) return found
          }
        }
        return null
      }
      
      const selectedNodeData = findNodeById(hierarchyStructure.nodes || [], selectedNode.id)
      const childNodes = selectedNodeData?.children || []
      const nodeElements = selectedNodeData?.entities || []
      
      console.log('🔍 getChildNodesAndElements - selectedNode:', selectedNode)
      console.log('🔍 getChildNodesAndElements - selectedNodeData:', selectedNodeData)
      console.log('🔍 getChildNodesAndElements - nodeElements:', nodeElements)
      
      return {
        childNodes: childNodes,
        elements: nodeElements
      }
    } else {
      // Show root nodes and unassigned entities/accounts
      const rootNodes = hierarchyStructure.nodes || []
      const unassignedItems = hierarchyStructure.unassigned_entities || hierarchyStructure.unassigned_accounts || []
      
      return {
        childNodes: rootNodes,
        elements: unassignedItems
      }
    }
  }

  const { childNodes, elements } = getChildNodesAndElements()
  console.log('HierarchyEditorPanel - hierarchyStructure:', hierarchyStructure)
  console.log('HierarchyEditorPanel - selectedNode:', selectedNode)
  console.log('Child nodes:', childNodes)
  console.log('Elements:', elements)

  const handleItemClick = (item, type) => {
    setSelectedItem({ ...item, type })
    setShowPropertiesSidebar(true)
  }

  const handleClosePropertiesSidebar = () => {
    setShowPropertiesSidebar(false)
    setSelectedItem(null)
  }

  const handleExportHierarchyData = async () => {
    try {
      const nodesData = hierarchyStructure.nodes || []
      const elementsData = hierarchyStructure.unassigned_entities || hierarchyStructure.unassigned_accounts || []
      
      if (nodesData.length === 0 && elementsData.length === 0) {
        showNotification('No data to export', 'info')
        return
      }
      
      const response = await fetch('/api/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'hierarchy-complete',
          data: {
            nodes: nodesData,
            elements: elementsData,
            hierarchy_id: hierarchy?.id,
            hierarchy_name: hierarchy?.name
          }
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `hierarchy_data_${hierarchy?.name || 'export'}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log('Hierarchy data exported successfully')
      } else {
        console.error('Failed to export hierarchy data')
        showNotification('Failed to export hierarchy data', 'error')
      }
    } catch (error) {
      console.error('Error exporting hierarchy data:', error)
      showNotification('Error exporting hierarchy data', 'error')
    }
  }

  const handleImportHierarchyData = async (file) => {
    if (!file) return
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'hierarchy-complete')
      formData.append('hierarchy_id', hierarchy?.id)
      
      const response = await fetch('/api/import-data', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Hierarchy data imported successfully:', result)
        showNotification(`Hierarchy data imported successfully! ${result.new_records || 0} new records, ${result.updated_records || 0} updated records.`, 'success')
        onRefresh && onRefresh()
      } else {
        console.error('Failed to import hierarchy data')
        showNotification('Failed to import hierarchy data', 'error')
      }
    } catch (error) {
      console.error('Error importing hierarchy data:', error)
      showNotification('Error importing hierarchy data', 'error')
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Notification Bubble */}
      {notification && (
        <NotificationBubble
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedNode ? (selectedNode.name || selectedNode.entity_name) : 'Root Elements'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {childNodes.length} nodes, {elements.length} elements
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                console.log('Assign Elements button clicked')
                handleAddNew('element')
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Assign Elements</span>
            </button>
            
            {/* Export/Import Buttons */}
            <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
              <button
                onClick={handleExportHierarchyData}
                className="flex items-center space-x-1 px-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Export Hierarchy Data"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Export</span>
              </button>
              <label className="flex items-center space-x-1 px-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                     title="Import Hierarchy Data">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Import</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => handleImportHierarchyData(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area - Child Nodes and Elements */}
      <div className="flex-1 overflow-y-auto p-6">
        {childNodes.length === 0 && elements.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No content found</p>
            <p className="text-sm">Add nodes or elements to create a hierarchy</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Child Nodes Section */}
            {childNodes.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Nodes ({childNodes.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {childNodes.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => handleItemClick(node, 'node')}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {node.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {node.code} • {node.elements?.length || 0} elements
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteNode && onDeleteNode(node)
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Elements Section */}
            {elements.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Elements ({elements.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {elements.map((element) => (
                    <div
                      key={element.id}
                      onClick={() => handleItemClick(element, 'element')}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {element.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {element.code} • {element.type || 'Entity'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteElement && onDeleteElement(element)
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add New Item Form Modal */}
      {showAddForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          style={{
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6"
            style={{
              zIndex: 10000,
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '28rem',
              padding: '1.5rem'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New {newItemType === 'node' ? 'Node' : 'Element'}
              </h3>
              <button 
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              {newItemType === 'node' ? (
                // Node form - only Code and Description (folder/container)
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={hierarchyType === 'account' ? (formData.node_code || '') : (formData.code || '')}
                      onChange={(e) => handleInputChange(hierarchyType === 'account' ? 'node_code' : 'code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter unique code (e.g., AMERICAS, EMEA)"
                    />
                    {(errors.entity_code || errors.node_code) && (
                      <p className="text-red-500 text-sm mt-1">{errors.entity_code || errors.node_code}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={hierarchyType === 'account' ? (formData.node_name || '') : (formData.name || '')}
                      onChange={(e) => handleInputChange(hierarchyType === 'account' ? 'node_name' : 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter description (e.g., Americas Region, EMEA Operations)"
                    />
                    {(errors.entity_name || errors.node_name) && (
                      <p className="text-red-500 text-sm mt-1">{errors.entity_name || errors.node_name}</p>
                    )}
                  </div>
                </>
              ) : (
                // Element form - full entity fields
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.entity_name || ''}
                      onChange={(e) => handleInputChange('entity_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter element name"
                    />
                    {(errors.entity_name || errors.node_name) && (
                      <p className="text-red-500 text-sm mt-1">{errors.entity_name || errors.node_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={formData.entity_code || ''}
                      onChange={(e) => handleInputChange('entity_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter unique code"
                    />
                    {(errors.entity_code || errors.node_code) && (
                      <p className="text-red-500 text-sm mt-1">{errors.entity_code || errors.node_code}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.entity_type || ''}
                      onChange={(e) => handleInputChange('entity_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Subsidiary">Subsidiary</option>
                      <option value="Parent">Parent</option>
                      <option value="Joint Venture">Joint Venture</option>
                      <option value="Associate">Associate</option>
                    </select>
                    {errors.entity_type && (
                      <p className="text-red-500 text-sm mt-1">{errors.entity_type}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency || 'USD'}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Create {newItemType === 'node' ? 'Node' : 'Element'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Element Selector Modal */}
      {showElementSelector && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          style={{
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-6"
            style={{
              zIndex: 10000,
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '42rem',
              padding: '1.5rem'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select {hierarchyType === 'account' ? 'Accounts' : 'Entities'} to Add
              </h3>
              <button 
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select {hierarchyType === 'account' ? 'accounts' : 'entities'} from the list below to add them to this hierarchy.
              </p>
            </div>

            {/* Entity/Account List */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {(() => {
                // For account hierarchies, use allAccounts; for entity hierarchies, use hierarchy structure
                const itemsToShow = hierarchyType === 'account' ? allAccounts : 
                  ((hierarchyStructure.unassigned_entities || []).concat(hierarchyStructure.unassigned_accounts || []))
                
                
                if (itemsToShow.length === 0) {
                  return (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No {hierarchyType === 'account' ? 'accounts' : 'items'} available
                    </div>
                  )
                }
                
                return (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {itemsToShow.map((item) => {
                    const isSelected = selectedEntities.some(e => e.id === item.id)
                    console.log(`🔍 Item ${item.id} (${item.name || item.account_name}): isSelected = ${isSelected}`)
                    console.log(`🔍 selectedEntities:`, selectedEntities)
                    console.log(`🔍 item.id:`, item.id, typeof item.id)
                    console.log(`🔍 selectedEntities.map(e => e.id):`, selectedEntities.map(e => e.id))
                    return (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          // Prevent double-click if clicking on checkbox
                          if (e.target.type !== 'checkbox') {
                            handleEntityToggle(item)
                          }
                        }}
                        className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            key={`${item.id}-${selectionKey}`}
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleEntityToggle(item)
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {item.entity_name || item.account_name || item.name || 'Unnamed Item'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.entity_code || item.account_code || item.code || 'No Code'} • {item.entity_type || item.account_type || item.type || 'No Type'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                )
              })()}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedEntities.length} {hierarchyType === 'account' ? 'account(s)' : 'entity(ies)'} selected
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  type="button" 
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignElements}
                  disabled={selectedEntities.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add {selectedEntities.length} {hierarchyType === 'account' ? 'Account(s)' : 'Element(s)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Properties Sidebar */}
      {showPropertiesSidebar && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedItem.type === 'node' ? (
                      <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    )}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedItem.type === 'node' ? 'Node Properties' : 'Element Properties'}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedItem.name || selectedItem.entity_name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClosePropertiesSidebar}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Properties Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Basic Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {selectedItem.type === 'node' ? 'Node Name' : 'Entity Name'}
                        </label>
                        <input
                          type="text"
                          value={selectedItem.name || selectedItem.entity_name || ''}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Code
                        </label>
                        <input
                          type="text"
                          value={selectedItem.code || selectedItem.entity_code || ''}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          readOnly
                        />
                      </div>
                      {selectedItem.type === 'element' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type
                          </label>
                          <input
                            type="text"
                            value={selectedItem.type || selectedItem.entity_type || ''}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            readOnly
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Properties */}
                  {selectedItem.type === 'node' && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Node Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                          </label>
                          <textarea
                            value={selectedItem.description || ''}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Elements Count
                          </label>
                          <input
                            type="text"
                            value={selectedItem.elements?.length || 0}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedItem.type === 'element' && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Entity Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            value={selectedItem.country || ''}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Currency
                          </label>
                          <input
                            type="text"
                            value={selectedItem.currency || ''}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Actions
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          // TODO: Implement edit functionality
                          console.log('Edit clicked for:', selectedItem)
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Edit {selectedItem.type === 'node' ? 'Node' : 'Element'}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (selectedItem.type === 'node') {
                            onDeleteNode && onDeleteNode(selectedItem)
                          } else {
                            onDeleteElement && onDeleteElement(selectedItem)
                          }
                          handleClosePropertiesSidebar()
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete {selectedItem.type === 'node' ? 'Node' : 'Element'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HierarchyEditorPanel