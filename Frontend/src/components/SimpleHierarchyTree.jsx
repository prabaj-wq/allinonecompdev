import React, { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  Folder,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react'

const SimpleHierarchyTree = ({ 
  hierarchy, 
  entities = [], 
  onDoubleClick,
  onAddElement,
  onEditElement,
  onDeleteElement
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [selectedNode, setSelectedNode] = useState(null)

  // Build tree structure from entities
  const buildTree = () => {
    const tree = []
    const entityMap = new Map()
    
    // Create map of entities
    entities.forEach(entity => {
      entityMap.set(entity.id, { ...entity, children: [] })
    })
    
    // Build tree structure
    entities.forEach(entity => {
      if (entity.parent_id && entityMap.has(entity.parent_id)) {
        entityMap.get(entity.parent_id).children.push(entityMap.get(entity.id))
      } else {
        tree.push(entityMap.get(entity.id))
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
    setSelectedNode(node)
  }

  const handleNodeDoubleClick = (node) => {
    onDoubleClick && onDoubleClick(node)
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
          onDoubleClick={() => handleNodeDoubleClick(node)}
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

          {/* Node Icon */}
          <div className="mr-2">
            <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>

          {/* Node Content */}
          <div className="flex-1 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {node.entity_name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {node.entity_code} • {node.entity_type}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddElement && onAddElement(node)
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-blue-600 dark:text-blue-400"
                title="Add child element"
              >
                <Plus className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditElement && onEditElement(node)
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-green-600 dark:text-green-400"
                title="Edit element"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteElement && onDeleteElement(node)
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-600 dark:text-red-400"
                title="Delete element"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
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

  const tree = buildTree()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {hierarchy?.name || 'Hierarchy'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {entities.length} entities
              </p>
            </div>
          </div>
          <button
            onClick={() => onAddElement && onAddElement(null)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Root Element</span>
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tree.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No entities found</p>
            <p className="text-sm">Click "Add Root Element" to create the first one</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map(node => renderTreeNode(node))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💡 <strong>Tip:</strong> Double-click any element to open detailed view
        </p>
      </div>
    </div>
  )
}

export default SimpleHierarchyTree
