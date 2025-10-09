import React, { useState, useEffect } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Building2,
  Layers,
  Folder,
  FolderOpen,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react'

const TagetikHierarchyNavigator = ({ 
  hierarchies = [], 
  entities = [],
  onAddNode,
  onAddElement,
  onEditNode,
  onEditElement,
  onDeleteNode,
  onDeleteElement,
  onNodeSelect
}) => {
  const [leftCanvasVisible, setLeftCanvasVisible] = useState(false)
  const [selectedHierarchy, setSelectedHierarchy] = useState(null)
  const [currentPath, setCurrentPath] = useState([]) // Track navigation path
  const [currentNodes, setCurrentNodes] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [rightPaneContent, setRightPaneContent] = useState(null)

  // Build hierarchy structure from real data
  const buildHierarchyStructure = () => {
    const structure = {}
    
    hierarchies.forEach(hierarchy => {
      // Get entities for this hierarchy
      const hierarchyEntities = entities.filter(entity => entity.hierarchy_id === hierarchy.id)
      
      structure[hierarchy.id] = {
        id: hierarchy.id,
        name: hierarchy.name,
        type: 'hierarchy',
        children: hierarchyEntities.map(entity => ({
          id: entity.id,
          name: entity.name,
          code: entity.code,
          type: 'entity',
          parent_id: hierarchy.id,
          level: 1,
          entity: entity
        }))
      }
    })
    
    return structure
  }

  const hierarchyStructure = buildHierarchyStructure()

  // Handle hierarchy double-click
  const handleHierarchyDoubleClick = (hierarchy) => {
    setSelectedHierarchy(hierarchy)
    setCurrentPath([{ id: hierarchy.id, name: hierarchy.name, type: 'hierarchy' }])
    setCurrentNodes(hierarchyStructure[hierarchy.id]?.children || [])
    setSelectedNode(null)
    setRightPaneContent(null)
    setLeftCanvasVisible(true)
  }

  // Handle node click in left canvas
  const handleNodeClick = (node) => {
    setSelectedNode(node)
    
    // Update right pane content
    setRightPaneContent({
      type: node.type,
      data: node,
      title: node.name,
      subtitle: node.code ? `Code: ${node.code}` : ''
    })

    // If it's an entity, show its details
    if (node.type === 'entity' && node.entity) {
      setRightPaneContent({
        type: 'entity',
        data: node.entity,
        title: node.entity.name,
        subtitle: `${node.entity.entity_type} • ${node.entity.country} • ${node.entity.currency}`,
        details: {
          'Entity Code': node.entity.entity_code,
          'Entity Type': node.entity.entity_type,
          'Country': node.entity.country,
          'Currency': node.entity.currency,
          'Status': node.entity.status || 'Active'
        }
      })
    }

    // Call parent callback
    if (onNodeSelect) {
      onNodeSelect(node)
    }
  }

  // Handle add child element
  const handleAddChild = (parentNode) => {
    if (onAddElement) {
      onAddElement(parentNode)
    }
  }

  // Handle navigation back
  const handleNavigateBack = () => {
    if (currentPath.length > 1) {
      const newPath = currentPath.slice(0, -1)
      const parentNode = newPath[newPath.length - 1]
      
      setCurrentPath(newPath)
      
      if (parentNode.type === 'hierarchy') {
        setCurrentNodes(hierarchyStructure[parentNode.id]?.children || [])
      }
    }
  }

  // Handle expand/collapse
  const toggleNodeExpansion = (nodeId) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  // Render tree lines and indentation
  const renderTreeLines = (level) => {
    const lines = []
    for (let i = 0; i < level; i++) {
      lines.push(
        <div key={i} className="w-4 h-full flex items-center justify-center">
          <div className="w-px h-full bg-gray-300 dark:bg-gray-600"></div>
        </div>
      )
    }
    return lines
  }

  // Render node with tree structure
  const renderNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const isSelected = selectedNode?.id === node.id

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors group ${
            isSelected 
              ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onClick={() => handleNodeClick(node)}
          style={{ marginLeft: `${level * 20}px` }}
        >
          {/* Tree Lines */}
          {level > 0 && (
            <div className="flex items-center">
              {renderTreeLines(level)}
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-px bg-gray-300 dark:bg-gray-600"></div>
              </div>
            </div>
          )}

          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleNodeExpansion(node.id)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-2"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}

          {/* Node Icon */}
          <div className={`p-1 rounded mr-3 ${
            node.type === 'hierarchy' 
              ? 'bg-blue-100 dark:bg-blue-900/30' 
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            {node.type === 'hierarchy' ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Building2 className="h-4 w-4 text-gray-600" />
            )}
          </div>

          {/* Node Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {node.name}
              </span>
              {node.code && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({node.code})
                </span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                node.type === 'hierarchy' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {node.type}
              </span>
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAddChild(node)
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-opacity"
            title="Add Child"
          >
            <Plus className="h-4 w-4 text-green-600" />
          </button>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (node.type === 'hierarchy' && onEditNode) {
                  onEditNode(node)
                } else if (node.type === 'entity' && onEditElement) {
                  onEditElement(node)
                }
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Edit"
            >
              <Edit className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (node.type === 'hierarchy' && onDeleteNode) {
                  onDeleteNode(node.id)
                } else if (node.type === 'entity' && onDeleteElement) {
                  onDeleteElement(node.id)
                }
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Main Hierarchy List */}
      <div className="flex-1 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Hierarchies
            </h2>
            <button
              onClick={() => setLeftCanvasVisible(!leftCanvasVisible)}
              className="btn-primary flex items-center"
            >
              <Layers className="h-4 w-4 mr-2" />
              Toggle Navigator
            </button>
          </div>

          {/* Hierarchy Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hierarchies.map(hierarchy => (
              <div key={hierarchy.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onDoubleClick={() => handleHierarchyDoubleClick(hierarchy)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FolderOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {hierarchy.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {hierarchy.count} entities
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Double-click to explore
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Left Canvas - Hierarchy Navigator */}
      {leftCanvasVisible && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Canvas Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Navigator
              </h3>
              <button
                onClick={() => setLeftCanvasVisible(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            
            {/* Breadcrumb */}
            {currentPath.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                  {currentPath.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {index > 0 && <span>/</span>}
                      <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
                        {item.name}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Canvas Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {currentNodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items in this level</p>
                <button
                  onClick={() => handleAddChild(selectedHierarchy)}
                  className="mt-2 btn-primary text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {currentNodes.map(node => renderNode(node))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Pane - Details */}
      {rightPaneContent && (
        <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Right Pane Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Details
              </h3>
              <button
                onClick={() => setRightPaneContent(null)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mt-1">
              {rightPaneContent.title}
            </h4>
            {rightPaneContent.subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {rightPaneContent.subtitle}
              </p>
            )}
          </div>

          {/* Right Pane Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {rightPaneContent.details && (
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 dark:text-white">Properties</h5>
                <div className="space-y-3">
                  {Object.entries(rightPaneContent.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{key}:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TagetikHierarchyNavigator
