import React, { useState, useEffect } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit2, 
  Trash2, 
  Folder, 
  Building2,
  ArrowLeft,
  MoreHorizontal,
  Download,
  Filter,
  Settings
} from 'lucide-react'

const ProfessionalHierarchyCanvas = ({ 
  hierarchies = [], 
  entities = [], 
  onAddNode, 
  onAddElement, 
  onEditNode, 
  onEditElement, 
  onDeleteNode, 
  onDeleteElement,
  onNodeSelect,
  onElementSelect
}) => {
  const [selectedHierarchy, setSelectedHierarchy] = useState(null)
  const [currentPath, setCurrentPath] = useState([])
  const [currentNodes, setCurrentNodes] = useState([])
  const [currentElements, setCurrentElements] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null)

  // Initialize with first hierarchy if available
  useEffect(() => {
    if (hierarchies.length > 0 && !selectedHierarchy) {
      setSelectedHierarchy(hierarchies[0])
      loadHierarchyContent(hierarchies[0].id)
    }
  }, [hierarchies])

  const loadHierarchyContent = (hierarchyId, parentId = null) => {
    // Filter entities by hierarchy and parent
    const hierarchyEntities = entities.filter(entity => 
      entity.hierarchy_id === hierarchyId && 
      (parentId ? entity.parent_id === parentId : !entity.parent_id)
    )
    
    setCurrentElements(hierarchyEntities)
    setCurrentNodes([]) // For now, we'll treat all as elements
  }

  const handleHierarchySelect = (hierarchy) => {
    setSelectedHierarchy(hierarchy)
    setCurrentPath([{ id: hierarchy.id, name: hierarchy.name, type: 'hierarchy' }])
    loadHierarchyContent(hierarchy.id)
    setSelectedItem(null)
  }

  const handleItemClick = (item) => {
    setSelectedItem(item)
    if (item.type === 'node') {
      // Drill down into node
      const newPath = [...currentPath, { id: item.id, name: item.name, type: 'node' }]
      setCurrentPath(newPath)
      loadHierarchyContent(selectedHierarchy.id, item.id)
    } else {
      // Select element for editing
      onElementSelect && onElementSelect(item)
    }
  }

  const handleBack = () => {
    if (currentPath.length > 1) {
      const newPath = currentPath.slice(0, -1)
      setCurrentPath(newPath)
      const parentId = newPath.length > 1 ? newPath[newPath.length - 1].id : null
      loadHierarchyContent(selectedHierarchy.id, parentId)
    }
  }

  const handleAddItem = (type) => {
    if (onAddElement && selectedHierarchy) {
      onAddElement(selectedHierarchy.id, currentPath.length > 1 ? currentPath[currentPath.length - 1].id : null)
    }
  }

  const handleEditItem = (item) => {
    setSelectedItem(item)
    setIsEditing(true)
    onEditElement && onEditElement(item)
  }

  const handleDeleteItem = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      onDeleteElement && onDeleteElement(item)
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
    if (draggedItem && draggedItem.id !== targetItem.id) {
      // Handle reordering - implement API call
      console.log(`Moving ${draggedItem.name} to ${targetItem.name}`)
    }
    setDraggedItem(null)
  }

  const renderBreadcrumbs = () => (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
      {currentPath.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          <button
            onClick={() => {
              if (index < currentPath.length - 1) {
                const newPath = currentPath.slice(0, index + 1)
                setCurrentPath(newPath)
                const parentId = index > 0 ? newPath[index - 1].id : null
                loadHierarchyContent(selectedHierarchy.id, parentId)
              }
            }}
            className={`hover:text-blue-600 dark:hover:text-blue-400 ${
              index === currentPath.length - 1 ? 'font-semibold text-gray-900 dark:text-white' : ''
            }`}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  )

  const renderHierarchySelector = () => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Select Hierarchy</h3>
      <div className="grid grid-cols-1 gap-3">
        {hierarchies.map((hierarchy) => (
          <button
            key={hierarchy.id}
            onClick={() => handleHierarchySelect(hierarchy)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedHierarchy?.id === hierarchy.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{hierarchy.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {entities.filter(e => e.hierarchy_id === hierarchy.id).length} entities
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderCanvasContent = () => {
    if (!selectedHierarchy) {
      return renderHierarchySelector()
    }

    return (
      <div className="space-y-4">
        {renderBreadcrumbs()}
        
        {/* Add Item Button */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentPath[currentPath.length - 1]?.name || selectedHierarchy.name}
          </h3>
          <button
            onClick={() => handleAddItem('element')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Element</span>
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {currentElements.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No elements found</p>
              <p className="text-sm">Click "Add Element" to create the first one</p>
            </div>
          ) : (
            currentElements.map((element) => (
              <div
                key={element.id}
                draggable
                onDragStart={(e) => handleDragStart(e, element)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, element)}
                onClick={() => handleItemClick(element)}
                className={`p-4 rounded-lg border cursor-pointer transition-all group ${
                  selectedItem?.id === element.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{element.entity_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {element.entity_code} • {element.entity_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditItem(element)
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-blue-600 dark:text-blue-400"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteItem(element)
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {currentPath.length > 1 && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hierarchy Navigator</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Download className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {renderCanvasContent()}
      </div>
    </div>
  )
}

export default ProfessionalHierarchyCanvas
