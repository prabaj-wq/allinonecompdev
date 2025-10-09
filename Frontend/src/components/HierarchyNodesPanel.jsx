import React, { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Folder,
  FolderOpen,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  MoreVertical
} from 'lucide-react'
import DraggableElement from './DraggableElement'

const HierarchyNodesPanel = ({ 
  hierarchy, 
  hierarchyStructure = { nodes: [], unassigned_entities: [] }, 
  onNodeSelect,
  selectedNode,
  onBack,
  onAddNode,
  companyName
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [draggedItem, setDraggedItem] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [editingNode, setEditingNode] = useState(null)
  const [showAddNodeForm, setShowAddNodeForm] = useState(false)
  const [newNodeParent, setNewNodeParent] = useState(null)

  // Build tree structure from hierarchy nodes
  const buildNodeTree = () => {
    const { nodes } = hierarchyStructure || {}
    if (!nodes || !Array.isArray(nodes)) {
      return []
    }
    
    const nodeMap = new Map()
    
    // Create map of nodes
    nodes.forEach(node => {
      nodeMap.set(node.id, { 
        ...node, 
        children: [],
        type: 'node',
        entity_name: node.name,
        entity_code: node.code,
        entity_type: 'Node'
      })
    })
    
    // Build tree structure
    const tree = []
    nodes.forEach(node => {
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id).children.push(nodeMap.get(node.id))
      } else {
        tree.push(nodeMap.get(node.id))
      }
    })
    
    return tree
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

  const handleNodeClick = (node) => {
    onNodeSelect && onNodeSelect(node)
  }

  // Node management functions
  const createNode = async (nodeData) => {
    try {
      const response = await fetch(`/api/hierarchy-nodes?company_name=${companyName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...nodeData,
          hierarchy_id: hierarchy?.id,
          level: nodeData.parent_id ? 1 : 0 // Simple level calculation
        })
      })

      if (response.ok) {
        const newNode = await response.json()
        console.log('✅ Node created successfully:', newNode)
        // Refresh the hierarchy structure
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
      const response = await fetch(`/api/hierarchy-nodes/${nodeId}?company_name=${companyName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(nodeData)
      })

      if (response.ok) {
        console.log('✅ Node updated successfully')
        // Refresh the hierarchy structure
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
    try {
      const response = await fetch(`/api/hierarchy-nodes/${nodeId}?company_name=${companyName}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        console.log('✅ Node deleted successfully')
        // Refresh the hierarchy structure
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
  }

  const handleEditNode = (node) => {
    setEditingNode(node)
  }

  const handleSaveNode = async (nodeData) => {
    if (editingNode) {
      // Update existing node
      const success = await updateNode(editingNode.id, nodeData)
      if (success) {
        setEditingNode(null)
      }
    } else {
      // Create new node
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

  // Drag and Drop Handlers
  const handleDragStart = (element, type) => {
    setDraggedItem({ element, type })
    console.log('Drag started in nodes panel:', element, type)
  }

  const handleDragEnd = (element, type) => {
    setDraggedItem(null)
    setDropTarget(null)
    console.log('Drag ended in nodes panel:', element, type)
  }

  const handleDrop = async (dragData, dropTarget) => {
    console.log('Drop in nodes panel:', dragData, 'onto', dropTarget)
    
    try {
      // Update the parent_id of the dragged element
      const updateData = {
        ...dragData.element,
        parent_id: dropTarget.id,
        hierarchy_id: hierarchy?.id
      }

      // Call the save function to update the element
      // Note: This would need to be passed as a prop from the parent component
      console.log('Element moved to node:', updateData)
    } catch (error) {
      console.error('Error moving element to node:', error)
    }
  }

  const renderTreeNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const isSelected = selectedNode?.id === node.id

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg ${
            isSelected ? 'bg-blue-100 dark:bg-blue-900/20' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-4 h-4 mr-2 flex items-center justify-center">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleNode(node.id)
                }}
                className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            ) : (
              <div className="w-3 h-3" />
            )}
          </div>

          {/* Draggable Node */}
          <DraggableElement
            element={node}
            type="node"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            isDragging={draggedItem?.element?.id === node.id}
            isDropTarget={dropTarget?.id === node.id}
          />
        </div>

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
  
  console.log('HierarchyNodesPanel - hierarchy:', hierarchy)
  console.log('HierarchyNodesPanel - hierarchyStructure:', hierarchyStructure)
  console.log('HierarchyNodesPanel - nodeTree:', nodeTree)

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {hierarchy?.name || 'Hierarchy'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hierarchyStructure.nodes?.length || 0} nodes, {hierarchyStructure.unassigned_entities?.length || 0} unassigned elements
              </p>
            </div>
          </div>
          {/* Add Node button removed - only available on right side */}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {nodeTree.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No nodes found</p>
            <p className="text-sm">Click "Add Node" to create folders for organizing elements</p>
          </div>
        ) : (
          <div className="space-y-1">
            {nodeTree.map(node => renderTreeNode(node))}
          </div>
        )}
      </div>

    </div>
  )
}

export default HierarchyNodesPanel
