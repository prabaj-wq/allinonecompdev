import React, { useState, useEffect } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Move, 
  Copy,
  X,
  Building2,
  Layers,
  Users,
  Globe,
  DollarSign,
  ArrowUpDown,
  Save,
  AlertCircle
} from 'lucide-react'

const HierarchyManager = ({ 
  isVisible, 
  onClose, 
  hierarchy, 
  onSave,
  onAddNode,
  onAddElement,
  onEditNode,
  onDeleteNode,
  onMoveNode
}) => {
  const [nodes, setNodes] = useState([])
  const [elements, setElements] = useState([])
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)
  const [showAddNodeModal, setShowAddNodeModal] = useState(false)
  const [showAddElementModal, setShowAddElementModal] = useState(false)
  const [editingNode, setEditingNode] = useState(null)
  const [newNodeData, setNewNodeData] = useState({
    name: '',
    code: '',
    type: 'Node',
    description: '',
    parent_id: null
  })

  useEffect(() => {
    if (hierarchy && isVisible) {
      loadHierarchyData()
    }
  }, [hierarchy, isVisible])

  const loadHierarchyData = async () => {
    try {
      // Load entities for this hierarchy from the existing API
      const response = await fetch('/api/entities', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const entities = data.entities || []
        
        // Filter entities for this hierarchy
        const hierarchyEntities = entities.filter(entity => 
          entity.hierarchy_id === hierarchy.id
        )
        
        console.log(`Loading ${hierarchyEntities.length} entities for hierarchy ${hierarchy.name}`)
        
        // Convert entities to elements for display
        const elements = hierarchyEntities.map(entity => ({
          id: entity.id,
          name: entity.entity_name,
          code: entity.entity_code,
          type: entity.entity_type || 'Entity',
          description: `${entity.country} - ${entity.currency}`,
          node_id: null, // For now, entities are at root level
          level: 0,
          entity: entity // Keep original entity data
        }))
        
        setElements(elements)
        setNodes([]) // For now, no nested nodes, just elements at root level
        
        console.log('✅ Loaded hierarchy data:', { elements: elements.length, nodes: 0 })
      } else {
        console.error('Failed to load hierarchy data')
        setElements([])
        setNodes([])
      }
    } catch (error) {
      console.error('Error loading hierarchy data:', error)
      setElements([])
      setNodes([])
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

  const buildTree = (items, parentId = null, level = 0) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        level,
        children: buildTree(items, item.id, level + 1)
      }))
  }

  const renderTreeNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedItems.has(node.id)
    const isDraggedOver = dragOverItem?.id === node.id

    return (
      <div key={node.id} className="ml-4">
        <div 
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
          className={`flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors cursor-move ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          } ${
            isDraggedOver ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-600' : ''
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleNode(node.id)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-2"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {/* Selection Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(node.id)}
            className="mr-3 rounded"
          />

          {/* Node Icon */}
          <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded mr-3">
            {node.type === 'Node' ? (
              <Layers className="h-4 w-4 text-blue-600" />
            ) : (
              <Building2 className="h-4 w-4 text-green-600" />
            )}
          </div>

          {/* Node Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {node.name}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({node.code})
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                node.type === 'Node' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {node.type}
              </span>
            </div>
            {node.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {node.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleAddSubNode(node.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Add Sub-Node"
            >
              <Plus className="h-4 w-4 text-green-600" />
            </button>
            <button
              onClick={() => handleAddElement(node.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Add Element"
            >
              <Building2 className="h-4 w-4 text-blue-600" />
            </button>
            <button
              onClick={() => handleEditNode(node)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Edit Node"
            >
              <Edit className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => handleDeleteNode(node.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Delete Node"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        </div>

        {/* Render Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
            {/* Render Elements for this node */}
            {renderNodeElements(node.id, level + 1)}
          </div>
        )}
      </div>
    )
  }

  const renderNodeElements = (nodeId, level) => {
    const nodeElements = elements.filter(el => el.node_id === nodeId)
    
    return nodeElements.map(element => (
      <div 
        key={element.id}
        className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors ml-8"
        style={{ marginLeft: `${level * 20 + 32}px` }}
      >
        {/* Element Icon */}
        <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded mr-3">
          <Building2 className="h-4 w-4 text-gray-600" />
        </div>

        {/* Element Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {element.name}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({element.code})
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              {element.type}
            </span>
          </div>
        </div>

        {/* Element Actions */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleEditElement(element)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Edit Element"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => handleDeleteElement(element.id)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Delete Element"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </div>
    ))
  }

  const toggleSelection = (itemId) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, item) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverItem(item)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e, targetItem) => {
    e.preventDefault()
    if (draggedItem && targetItem && draggedItem.id !== targetItem.id) {
      console.log(`Moving ${draggedItem.name} to ${targetItem.name}`)
      // TODO: Implement actual move logic
    }
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleAddSubNode = (parentId) => {
    setNewNodeData({
      name: '',
      code: '',
      type: 'SubNode',
      description: '',
      parent_id: parentId
    })
    setShowAddNodeModal(true)
  }

  const handleAddElement = (nodeId) => {
    setShowAddElementModal(true)
  }

  const handleEditNode = (node) => {
    setEditingNode(node)
    setNewNodeData({
      name: node.name,
      code: node.code,
      type: node.type,
      description: node.description || '',
      parent_id: node.parent_id
    })
    setShowAddNodeModal(true)
  }

  const handleDeleteNode = (nodeId) => {
    if (confirm('Are you sure you want to delete this node and all its children?')) {
      console.log('Deleting node:', nodeId)
      // TODO: Implement delete logic
    }
  }

  const handleEditElement = (element) => {
    console.log('Editing element:', element)
    // TODO: Implement edit element logic
  }

  const handleDeleteElement = (elementId) => {
    if (confirm('Are you sure you want to delete this element?')) {
      console.log('Deleting element:', elementId)
      // TODO: Implement delete logic
    }
  }

  const handleSaveNode = () => {
    console.log('Saving node:', newNodeData)
    // TODO: Implement save logic
    setShowAddNodeModal(false)
    setEditingNode(null)
    setNewNodeData({
      name: '',
      code: '',
      type: 'Node',
      description: '',
      parent_id: null
    })
  }

  if (!isVisible) return null

  const treeNodes = buildTree(nodes)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
              <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {hierarchy?.name} - Hierarchy Manager
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage nodes, sub-nodes, and elements in this hierarchy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddNodeModal(true)}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Hierarchy
              </button>
              <button
                onClick={() => setShowAddElementModal(true)}
                className="btn-secondary flex items-center"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Add Element
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedItems.size} selected
              </span>
              {selectedItems.size > 0 && (
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {treeNodes.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No nodes in this hierarchy
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Start by adding a root node to organize your hierarchy
              </p>
              <button
                onClick={() => setShowAddNodeModal(true)}
                className="btn-primary flex items-center mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Hierarchy
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {treeNodes.map(node => renderTreeNode(node))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {nodes.length} nodes, {elements.length} elements
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => onSave && onSave()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Node Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingNode ? 'Edit Node' : 'Add New Node'}
              </h3>
              <button
                onClick={() => {
                  setShowAddNodeModal(false)
                  setEditingNode(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Node Name *
                </label>
                <input
                  type="text"
                  value={newNodeData.name}
                  onChange={(e) => setNewNodeData({...newNodeData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter node name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Node Code *
                </label>
                <input
                  type="text"
                  value={newNodeData.code}
                  onChange={(e) => setNewNodeData({...newNodeData, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter node code"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Node Type
                </label>
                <select
                  value={newNodeData.type}
                  onChange={(e) => setNewNodeData({...newNodeData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="Node">Node</option>
                  <option value="SubNode">Sub-Node</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newNodeData.description}
                  onChange={(e) => setNewNodeData({...newNodeData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Enter node description"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddNodeModal(false)
                  setEditingNode(null)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingNode ? 'Update' : 'Create'} Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HierarchyManager
