import React, { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Move,
  Copy,
  MoreHorizontal,
  Layers,
  Building2,
  X
} from 'lucide-react'
import RightSidebar from './RightSidebar'

const HierarchyTree = ({ items = [], hierarchies = [], elements = [], type = 'hierarchy' }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [showSidebar, setShowSidebar] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [sidebarMode, setSidebarMode] = useState('add') // 'add', 'edit', 'view'
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
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

  const handleAddItem = () => {
    setEditingItem(null)
    setSidebarMode('add')
    setShowSidebar(true)
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setSidebarMode('edit')
    setShowSidebar(true)
  }

  const handleViewItem = (item) => {
    setEditingItem(item)
    setSidebarMode('view')
    setShowSidebar(true)
  }

  const handleDeleteItem = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      console.log('Deleting item:', itemId)
      // TODO: Implement actual deletion
    }
  }

  const handleSidebarClose = () => {
    setShowSidebar(false)
    setEditingItem(null)
    setSidebarMode('add')
  }

  const handleSidebarSave = (savedEntity) => {
    console.log('Entity saved:', savedEntity)
    setShowSidebar(false)
    setEditingItem(null)
    setSidebarMode('add')
    // TODO: Refresh the data
  }

  // Drag and Drop handlers
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
      // TODO: Implement actual move logic with API call
    }
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const renderTreeNode = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedNodes.has(item.id)
    const isSelected = selectedItems.has(item.id)
    const isDraggedOver = dragOverItem?.id === item.id

    return (
      <div key={item.id} className="ml-4">
        <div 
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={(e) => handleDragOver(e, item)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item)}
          className={`flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors cursor-move ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          } ${
            isDraggedOver ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-600' : ''
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleNode(item.id)}
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
            onChange={() => toggleSelection(item.id)}
            className="mr-3"
          />

          {/* Node Icon */}
          <div className="p-1 rounded mr-3">
            {type === 'hierarchy' ? (
              <Layers className="h-4 w-4 text-blue-500" />
            ) : (
              <Building2 className="h-4 w-4 text-green-500" />
            )}
          </div>

          {/* Node Content */}
          <div className="flex-1 flex items-center">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {item.name}
              </div>
              {item.code && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Code: {item.code}
                </div>
              )}
              {item.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {item.description}
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="mr-3">
            <span className={`px-2 py-1 rounded-full text-xs ${
              item.status === 'Active' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
            }`}>
              {item.status || 'Active'}
            </span>
          </div>

          {/* Children Count */}
          {hasChildren && (
            <div className="mr-3 text-sm text-gray-500 dark:text-gray-400">
              ({item.children.length})
            </div>
          )}

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
            <button
              onClick={() => handleViewItem(item)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEditItem(item)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Move"
            >
              <Move className="h-4 w-4" />
            </button>
            <button
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteItem(item.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-500"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {item.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // Build tree structure from hierarchies and elements
  const buildTreeFromData = (hierarchies, elements) => {
    const tree = []
    
    // Add hierarchies as parent nodes
    hierarchies.forEach(hierarchy => {
      const hierarchyNode = {
        id: `hierarchy_${hierarchy.id}`,
        name: hierarchy.name,
        type: 'Hierarchy',
        status: hierarchy.status,
        description: hierarchy.description,
        count: hierarchy.count,
        isHierarchy: true,
        children: []
      }
      
      // Add elements that belong to this hierarchy
      elements.forEach(element => {
        if (element.hierarchy === hierarchy.name) {
          hierarchyNode.children.push({
            id: `element_${element.id}`,
            name: element.name,
            type: element.type,
            status: element.status,
            code: element.code,
            isHierarchy: false,
            children: []
          })
        }
      })
      
      tree.push(hierarchyNode)
    })
    
    return tree
  }

  // Create a more realistic tree structure for demonstration
  const createDemoTree = () => {
    return [
      {
        id: 1,
        name: "Legal Entities",
        code: "LEG",
        description: "Legal structure hierarchy",
        status: "Active",
        level: 0,
        children: [
          {
            id: 11,
            name: "Parent Company",
            code: "PARENT",
            description: "Main holding company",
            status: "Active",
            level: 1,
            children: [
              {
                id: 111,
                name: "US Operations",
                code: "US_OPS",
                description: "US business operations",
                status: "Active",
                level: 2,
                children: []
              },
              {
                id: 112,
                name: "EU Operations",
                code: "EU_OPS",
                description: "European business operations",
                status: "Active",
                level: 2,
                children: []
              }
            ]
          },
          {
            id: 12,
            name: "Subsidiary A",
            code: "SUB_A",
            description: "First subsidiary",
            status: "Active",
            level: 1,
            children: []
          }
        ]
      },
      {
        id: 2,
        name: "Business Units",
        code: "BU",
        description: "Operational business units",
        status: "Active",
        level: 0,
        children: [
          {
            id: 21,
            name: "Sales & Marketing",
            code: "SALES",
            description: "Sales and marketing operations",
            status: "Active",
            level: 1,
            children: []
          },
          {
            id: 22,
            name: "Operations",
            code: "OPS",
            description: "Core operations",
            status: "Active",
            level: 1,
            children: []
          }
        ]
      },
      {
        id: 3,
        name: "Geographic Regions",
        code: "GEO",
        description: "Geographic organization",
        status: "Active",
        level: 0,
        children: [
          {
            id: 31,
            name: "North America",
            code: "NA",
            description: "North American region",
            status: "Active",
            level: 1,
            children: []
          },
          {
            id: 32,
            name: "Europe",
            code: "EU",
            description: "European region",
            status: "Active",
            level: 1,
            children: []
          }
        ]
      }
    ]
  }

  const treeItems = (hierarchies.length > 0 || elements.length > 0) ? 
    buildTreeFromData(hierarchies, elements) : 
    (items.length > 0 ? buildTree(items) : createDemoTree())

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {type === 'hierarchy' ? 'Hierarchy Tree' : 'Account Tree'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {items.length} items • {selectedItems.size} selected
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleAddItem()}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {type === 'hierarchy' ? 'Hierarchy' : 'Element'}
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="space-y-1">
        {treeItems.length > 0 ? (
          treeItems.map(item => renderTreeNode(item))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No {type} items found</p>
            <p className="text-sm">Click "Add {type === 'hierarchy' ? 'Hierarchy' : 'Account'}" to create your first item</p>
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
        hierarchies={[]} // TODO: Pass actual hierarchies
        mode={sidebarMode}
      />
    </div>
  )
}

export default HierarchyTree
