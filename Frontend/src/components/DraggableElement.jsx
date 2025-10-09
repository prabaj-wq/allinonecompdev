import React, { useState } from 'react'
import { GripVertical, Building2, Folder } from 'lucide-react'

const DraggableElement = ({ 
  element, 
  onDragStart, 
  onDragEnd, 
  onDrop, 
  isDragging = false,
  isDropTarget = false,
  type = 'element' // 'element' or 'node'
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: element.id,
      type: type,
      element: element
    }))
    
    if (onDragStart) {
      onDragStart(element, type)
    }
  }

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(element, type)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'))
      
      if (onDrop) {
        onDrop(dragData, element)
      }
    } catch (error) {
      console.error('Error parsing drag data:', error)
    }
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 cursor-move
        ${isDragging ? 'opacity-50 bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}
        ${isDropTarget ? 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-600' : ''}
        ${!isDragging && !isDropTarget ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500' : ''}
      `}
    >
      {/* Drag Handle */}
      <div className="flex-shrink-0">
        <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      </div>

      {/* Icon */}
      <div className="flex-shrink-0">
        {type === 'node' ? (
          <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        ) : (
          <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {element.entity_name || element.name || 'Unnamed'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {element.entity_code || element.code || 'No Code'} • {element.entity_type || element.type || 'Unknown'}
            </p>
          </div>
          
          {/* Drag indicator */}
          {isHovered && (
            <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
              Drag to reorder
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DraggableElement
