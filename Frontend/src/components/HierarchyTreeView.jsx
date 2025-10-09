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
  AlertCircle,
  Folder,
  FolderOpen
} from 'lucide-react'

const HierarchyTreeView = ({ 
  hierarchies, 
  entities, 
  onAddHierarchy,
  onEditHierarchy,
  onDeleteHierarchy,
  onAddNode,
  onAddElement,
  onEditNode,
  onDeleteNode,
  onEditElement,
  onDeleteElement
}) => {
  const [expandedHierarchies, setExpandedHierarchies] = useState(new Set())
  const [selectedHierarchy, setSelectedHierarchy] = useState(null)
  const [showCanvas, setShowCanvas] = useState(false)
  const [canvasData, setCanvasData] = useState([])
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)

  // Build hierarchy structure from real data
  const buildHierarchyStructure = () => {
    const structure = {}
    
    hierarchies.forEach(hierarchy => {
      // Get entities for this hierarchy
      const hierarchyEntities = entities.filter(entity => entity.hierarchy_id === hierarchy.id)
      
      structure[hierarchy.id] = {
        nodes: [], // For now, no nested nodes
        subnodes: [], // For now, no subnodes
        elements: hierarchyEntities.map(entity => ({
          id: entity.id,
          name: entity.name,
          code: entity.code,
          type: entity.type || 'Entity',
          node_id: null, // Entities are at root level for now
          level: 0,
          entity: entity // Keep original entity data
        }))
      }
    })
    
    return structure
  }
  
  const hierarchyStructure = buildHierarchyStructure()

  const toggleHierarchy = (hierarchyId) => {
    const newExpanded = new Set(expandedHierarchies)
    if (newExpanded.has(hierarchyId)) {
      newExpanded.delete(hierarchyId)
    } else {
      newExpanded.add(hierarchyId)
    }
    setExpandedHierarchies(newExpanded)
  }

  const handleHierarchyDoubleClick = (hierarchy) => {
    setSelectedHierarchy(hierarchy)
    setShowCanvas(true)
    
    // Load canvas data for this hierarchy
    const structure = hierarchyStructure[hierarchy.id] || { nodes: [], subnodes: [], elements: [] }
    setCanvasData([...structure.nodes, ...structure.subnodes, ...structure.elements])
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

  const renderHierarchyNode = (hierarchy) => {
    const isExpanded = expandedHierarchies.has(hierarchy.id)
    const structure = hierarchyStructure[hierarchy.id] || { nodes: [], subnodes: [], elements: [] }
    const allItems = [...structure.nodes, ...structure.subnodes, ...structure.elements]
    const treeItems = buildTree(allItems)

    return (
      <div key={hierarchy.id} className="mb-4">
        {/* Hierarchy Header */}
        <div 
          className="flex items-center py-3 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
          onDoubleClick={() => handleHierarchyDoubleClick(hierarchy)}
        >
          <button
            onClick={() => toggleHierarchy(hierarchy.id)}
            className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded mr-3"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-blue-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-blue-600" />
            )}
          </button>

          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded mr-3">
            <FolderOpen className="h-5 w-5 text-blue-600" />
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 dark:text-white text-lg">
                {hierarchy.name}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({hierarchy.count} entities)
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Hierarchy
              </span>
            </div>
            {hierarchy.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {hierarchy.description}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAddNode && onAddNode(hierarchy.id)}
              className="p-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
              title="Add Node"
            >
              <Plus className="h-4 w-4 text-blue-600" />
            </button>
            <button
              onClick={() => onEditHierarchy && onEditHierarchy(hierarchy)}
              className="p-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
              title="Edit Hierarchy"
            >
              <Edit className="h-4 w-4 text-blue-600" />
            </button>
            <button
              onClick={() => onDeleteHierarchy && onDeleteHierarchy(hierarchy.id)}
              className="p-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
              title="Delete Hierarchy"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        </div>

        {/* Hierarchy Content */}
        {isExpanded && (
          <div className="ml-8 mt-2 space-y-2">
            {structure.elements.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No entities in this hierarchy</p>
                <button
                  onClick={() => onAddElement && onAddElement(hierarchy.id)}
                  className="mt-2 btn-primary text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Entity
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {structure.elements.map(entity => (
                  <div 
                    key={entity.id}
                    className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors"
                  >
                    {/* Entity Icon */}
                    <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded mr-3">
                      <Building2 className="h-4 w-4 text-gray-600" />
                    </div>

                    {/* Entity Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {entity.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({entity.code})
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {entity.type}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditElement && onEditElement(entity)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Edit Entity"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => onDeleteElement && onDeleteElement(entity.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Delete Entity"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderTreeNode = (node, hierarchyId) => {
    const hasChildren = node.children && node.children.length > 0
    const structure = hierarchyStructure[hierarchyId] || { elements: [] }
    const nodeElements = structure.elements.filter(el => el.node_id === node.id)

    return (
      <div key={node.id} className="ml-4">
        <div 
          className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors"
          style={{ marginLeft: `${node.level * 20}px` }}
        >
          {/* Node Icon */}
          <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded mr-3">
            {node.type === 'Node' ? (
              <Layers className="h-4 w-4 text-green-600" />
            ) : (
              <Building2 className="h-4 w-4 text-orange-600" />
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
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
              }`}>
                {node.type}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddNode && onAddNode(hierarchyId, node.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Add Sub-Node"
            >
              <Plus className="h-4 w-4 text-green-600" />
            </button>
            <button
              onClick={() => onAddElement && onAddElement(hierarchyId, node.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Add Element"
            >
              <Building2 className="h-4 w-4 text-blue-600" />
            </button>
            <button
              onClick={() => onEditNode && onEditNode(node)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Edit Node"
            >
              <Edit className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => onDeleteNode && onDeleteNode(node.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Delete Node"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && (
          <div>
            {node.children.map(child => renderTreeNode(child, hierarchyId))}
          </div>
        )}

        {/* Render Elements for this node */}
        {nodeElements.map(element => (
          <div 
            key={element.id}
            className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors ml-8"
            style={{ marginLeft: `${(node.level + 1) * 20 + 32}px` }}
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
                onClick={() => onEditElement && onEditElement(element)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Edit Element"
              >
                <Edit className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => onDeleteElement && onDeleteElement(element.id)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Delete Element"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderCanvas = () => {
    if (!showCanvas || !selectedHierarchy) return null

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setShowCanvas(false)}
        />
        
        {/* Canvas Modal */}
        <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedHierarchy.name} - Canvas View
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Visual management of nodes, sub-nodes, and elements
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCanvas(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Canvas Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {canvasData.map(item => (
                <div 
                  key={item.id}
                  className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-center mb-3">
                    <div className={`p-2 rounded-lg mr-3 ${
                      item.type === 'Node' ? 'bg-green-100 dark:bg-green-900/30' :
                      item.type === 'SubNode' ? 'bg-orange-100 dark:bg-orange-900/30' :
                      'bg-gray-100 dark:bg-gray-600'
                    }`}>
                      {item.type === 'Node' ? (
                        <Layers className="h-5 w-5 text-green-600" />
                      ) : item.type === 'SubNode' ? (
                        <Building2 className="h-5 w-5 text-orange-600" />
                      ) : (
                        <Building2 className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.code}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === 'Node' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      item.type === 'SubNode' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {item.type}
                    </span>
                    <div className="flex space-x-1">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {canvasData.length} items in {selectedHierarchy.name}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCanvas(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => onAddNode && onAddNode(selectedHierarchy.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Node
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add Hierarchy Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => onAddHierarchy && onAddHierarchy()}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Hierarchy
        </button>
      </div>

      {/* Hierarchies List */}
      <div className="space-y-4">
        {hierarchies.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hierarchies created yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start by creating your first hierarchy to organize your entities
            </p>
            <button
              onClick={() => onAddHierarchy && onAddHierarchy()}
              className="btn-primary flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Hierarchy
            </button>
          </div>
        ) : (
          hierarchies.map(hierarchy => renderHierarchyNode(hierarchy))
        )}
      </div>

      {/* Canvas Modal */}
      {renderCanvas()}
    </div>
  )
}

export default HierarchyTreeView
