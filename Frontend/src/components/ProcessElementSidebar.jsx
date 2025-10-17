import React from 'react'
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import {
  Play,
  Square,
  GitBranch,
  Database,
  FileText,
  CheckCircle,
  AlertCircle,
  Settings,
  Users,
  BarChart3,
} from 'lucide-react'

const ProcessElementSidebar = ({ isOpen, onToggle, onAddNode }) => {
  const elements = [
    { id: 'start', label: 'Start', type: 'start', icon: Play, color: 'bg-green-600' },
    { id: 'end', label: 'End', type: 'end', icon: Square, color: 'bg-red-600' },
    { id: 'process', label: 'Process', type: 'process', icon: Settings, color: 'bg-blue-600' },
    { id: 'decision', label: 'Decision', type: 'decision', icon: GitBranch, color: 'bg-yellow-500' },
    { id: 'data', label: 'Data', type: 'data', icon: Database, color: 'bg-purple-600' },
    { id: 'approval', label: 'Approval', type: 'approval', icon: CheckCircle, color: 'bg-indigo-600' },
    { id: 'document', label: 'Document', type: 'document', icon: FileText, color: 'bg-orange-600' },
    { id: 'notification', label: 'Notification', type: 'notification', icon: AlertCircle, color: 'bg-cyan-600' },
    { id: 'report', label: 'Report', type: 'report', icon: BarChart3, color: 'bg-emerald-600' },
    { id: 'assignment', label: 'Assignment', type: 'assignment', icon: Users, color: 'bg-fuchsia-600' },
  ]

  const handleDragStart = (e, element) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: element.type,
      label: element.label,
    }))
  }

  return (
    <div
      className={`bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {isOpen && (
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-blue-400" />
            <span className="font-bold text-white">Elements</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {isOpen ? (
            <ChevronLeft size={20} className="text-slate-400" />
          ) : (
            <ChevronRight size={20} className="text-slate-400" />
          )}
        </button>
      </div>

      {/* Elements */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {elements.map((element) => {
          const Icon = element.icon
          return (
            <div
              key={element.id}
              draggable
              onDragStart={(e) => handleDragStart(e, element)}
              onClick={() => onAddNode(element.type, element.label)}
              className={`${element.color} hover:opacity-90 cursor-grab active:cursor-grabbing rounded-lg p-3 text-white transition-all hover:shadow-lg transform hover:scale-105 ${
                !isOpen && 'flex justify-center'
              }`}
              title={element.label}
            >
              <div className={`flex items-center gap-2 ${!isOpen && 'justify-center'}`}>
                <Icon size={16} />
                {isOpen && <span className="text-sm font-medium">{element.label}</span>}
              </div>
              {isOpen && (
                <p className="text-xs text-opacity-75 text-white mt-1">
                  Drag to canvas or click
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <p className="text-xs text-slate-400 leading-relaxed">
            💡 <strong>Tip:</strong> Drag any element to the canvas to add it, or click to add it at a random position.
          </p>
        </div>
      )}
    </div>
  )
}

export default ProcessElementSidebar