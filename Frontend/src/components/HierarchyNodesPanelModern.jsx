import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Folder,
  FolderOpen,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Save,
  X
} from 'lucide-react'

const NodeForm = ({ node, onSave, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: node?.name || '',
    code: node?.code || ''
  })
  const [errors, setErrors] = useState({})

  // Update form data when node prop changes (for editing)
  useEffect(() => {
    if (node) {
      setFormData({
        name: node.name || '',
        code: node.code || ''
      })
    }
  }, [node])

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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-4 mb-3 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <input
            type="text"
            placeholder="Node name (e.g., North America)"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-2 py-1 text-sm border rounded ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <input
            type="text"
            placeholder="Node code (e.g., NA)"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            className={`w-full px-2 py-1 text-sm border rounded ${
              errors.code ? 'border-red-500' : 'border-gray-300'
            } dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
          />
          {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="submit"
            className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
          >
            <Save className="h-3 w-3" />
            <span>{isEditing ? 'Update' : 'Create'}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
          >
            <X className="h-3 w-3" />
            <span>Cancel</span>
          </button>
        </div>
      </form>
    </div>
  )
}

const HierarchyNodesPanelModern = forwardRef(({ 
  hierarchy, 
  hierarchyStructure = { nodes: [], unassigned_entities: [] }, 
  onNodeSelect,
  selectedNode,
  onBack,
  onAddNode,
  selectedCompany,
  axisType = 'entity' // 'entity' or 'account'
}, ref) => {
  // Determine API endpoints based on axis type
  const apiBase = axisType === 'account' ? 'axes-account' : 'axes-entity';
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [hoveredNode, setHoveredNode] = useState(null)
  const [editingNode, setEditingNode] = useState(null)
  const [showAddNodeForm, setShowAddNodeForm] = useState(false)
  const [newNodeParent, setNewNodeParent] = useState(null)

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    addRootNode: () => handleAddNode(null)
  }))

  // Use the already properly nested tree structure from the API
  const buildNodeTree = () => {
    const { nodes } = hierarchyStructure || {}
    if (!nodes || !Array.isArray(nodes)) {
      return []
    }
    
    // The API already returns properly nested structure with children
    return nodes.map(node => ({
      ...node,
      type: 'node'
    }))
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

  // Node management functions
  const createNode = async (nodeData) => {
    try {
      const response = await fetch(`/api/${apiBase}/hierarchy-nodes?company_name=${selectedCompany}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...nodeData,
          hierarchy_id: hierarchy?.id,
          level: nodeData.parent_id ? 1 : 0
        })
      })

      if (response.ok) {
        const newNode = await response.json()
        console.log('✅ Node created successfully:', newNode)
        if (onAddNode) {
          onAddNode(newNode)
        }
        return true
      } else {
        const error = await response.text()
        console.error('❌ Failed to create node:', error)
        return false
      }
    } catch (error) {
      console.error('❌ Error creating node:', error)
      return false
    }
  }

  const updateNode = async (nodeId, nodeData) => {
    try {
      const response = await fetch(`/api/${apiBase}/hierarchy-nodes/${nodeId}?company_name=${selectedCompany}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(nodeData)
      })

      if (response.ok) {
        console.log('✅ Node updated successfully')
        if (onAddNode) {
          onAddNode()
        }
        return true
      } else {
        const error = await response.text()
        console.error('❌ Failed to update node:', error)
        return false
      }
    } catch (error) {
      console.error('❌ Error updating node:', error)
      return false
    }
  }

  const deleteNode = async (nodeId) => {
    if (!confirm('Are you sure you want to delete this node? This will also delete all child nodes.')) {
      return false
    }

    try {
      const response = await fetch(`/api/${apiBase}/hierarchy-nodes/${nodeId}?company_name=${selectedCompany}&cascade=true`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        console.log('✅ Node deleted successfully')
        if (onAddNode) {
          onAddNode()
        }
        return true
      } else {
        const error = await response.text()
        console.error('❌ Failed to delete node:', error)
        return false
      }
    } catch (error) {
      console.error('❌ Error deleting node:', error)
      return false
    }
  }

  const handleAddNode = (parentNode = null) => {
    setNewNodeParent(parentNode)
    setShowAddNodeForm(true)
    setEditingNode(null)
  }

  const handleEditNode = (node) => {
    setEditingNode(node)
    setShowAddNodeForm(false)
  }

  const handleSaveNode = async (nodeData) => {
    if (editingNode) {
      const success = await updateNode(editingNode.id, nodeData)
      if (success) {
        setEditingNode(null)
      }
    } else {
      const success = await createNode({
        ...nodeData,
        parent_id: newNodeParent?.id || null
      })
      if (success) {
        setShowAddNodeForm(false)
        setNewNodeParent(null)
      }
    }
  }

  const handleCancelForm = () => {
    setShowAddNodeForm(false)
    setEditingNode(null)
    setNewNodeParent(null)
  }

  const renderTreeNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const isSelected = selectedNode?.id === node.id
    const isHovered = hoveredNode === node.id

    return (
      <div key={node.id} className="select-none">
        {/* Node Form for Editing */}
        {editingNode?.id === node.id && (
          <div style={{ marginLeft: `${level * 20}px` }}>
            <NodeForm
              node={editingNode}
              onSave={handleSaveNode}
              onCancel={handleCancelForm}
              isEditing={true}
            />
          </div>
        )}

        {/* Node Item */}
        {editingNode?.id !== node.id && (
          <div
            style={{ marginLeft: `${level * 20}px` }}
            className={`group flex items-center py-2 px-3 rounded-xl cursor-pointer transition-all duration-200 ${
              isSelected 
                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-300/50 dark:border-blue-600/50 shadow-sm' 
                : isHovered 
                  ? 'bg-gray-100/80 dark:bg-gray-700/80 shadow-sm' 
                  : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/80 hover:shadow-sm'
            }`}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => onNodeSelect && onNodeSelect(node)}
          >
            {/* Expand/Collapse Button */}
            <div className="flex items-center mr-2">
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleNode(node.id)
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              ) : (
                <div className="w-5 h-5" />
              )}
            </div>

            {/* Folder Icon */}
            <div className="mr-2">
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>

            {/* Node Name */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {node.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {node.code}
              </div>
            </div>

            {/* Action Buttons (visible on hover) */}
            <div className={`flex items-center space-x-1 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddNode(node)
                }}
                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded text-blue-600 dark:text-blue-400"
                title="Add child node"
              >
                <Plus className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditNode(node)
                }}
                className="p-1 hover:bg-green-100 dark:hover:bg-green-900/50 rounded text-green-600 dark:text-green-400"
                title="Edit node"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNode(node.id)
                }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-red-600 dark:text-red-400"
                title="Delete node"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Add Node Form (for child nodes) */}
        {showAddNodeForm && newNodeParent?.id === node.id && (
          <div style={{ marginLeft: `${(level + 1) * 20}px` }}>
            <NodeForm
              onSave={handleSaveNode}
              onCancel={handleCancelForm}
              isEditing={false}
            />
          </div>
        )}

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const nodeTree = buildNodeTree()

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {hierarchy?.hierarchy_name || 'Hierarchy'}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
        {/* Add Root Node Form */}
        {showAddNodeForm && !newNodeParent && (
          <NodeForm
            onSave={handleSaveNode}
            onCancel={handleCancelForm}
            isEditing={false}
          />
        )}

        {nodeTree.length === 0 && !showAddNodeForm ? (
          <div className="text-center py-16">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full opacity-20"></div>
              </div>
              <div className="relative">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg mx-auto w-fit mb-4">
                  <Folder className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Nodes Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xs mx-auto">Create folders to organize your entities hierarchically</p>
            <button
              onClick={() => handleAddNode(null)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Node</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {nodeTree.map(node => renderTreeNode(node))}
          </div>
        )}
      </div>
    </div>
  )
})

export default HierarchyNodesPanelModern
