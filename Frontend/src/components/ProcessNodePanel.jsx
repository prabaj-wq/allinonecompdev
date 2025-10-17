import React, { useState, useEffect } from 'react'
import { X, Trash2, Save } from 'lucide-react'

const ProcessNodePanel = ({ isOpen, onClose, node, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    category: '',
    required: false,
    defaultValue: '',
    assignee: '',
    timeLimit: '',
  })

  useEffect(() => {
    if (node) {
      setFormData({
        label: node.data?.label || '',
        description: node.data?.config?.description || '',
        category: node.data?.config?.category || '',
        required: node.data?.config?.required || false,
        defaultValue: node.data?.config?.defaultValue || '',
        assignee: node.data?.config?.assignee || '',
        timeLimit: node.data?.config?.timeLimit || '',
      })
    }
  }, [node])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSave = () => {
    if (node) {
      onUpdate(node.id, {
        label: formData.label,
        config: {
          description: formData.description,
          category: formData.category,
          required: formData.required,
          defaultValue: formData.defaultValue,
          assignee: formData.assignee,
          timeLimit: formData.timeLimit,
        },
      })
      alert('Node updated successfully!')
    }
  }

  if (!isOpen || !node) return null

  return (
    <div className="fixed right-0 top-0 h-screen w-80 bg-slate-800 border-l border-slate-700 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
        <h3 className="text-lg font-bold text-white">Node Settings</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Type Badge */}
        <div className="bg-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Node Type</p>
          <p className="text-white font-semibold capitalize">{node.data?.type || 'Unknown'}</p>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Label</label>
          <input
            type="text"
            name="label"
            value={formData.label}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            placeholder="Enter node label"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Enter node description"
            rows="3"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select category</option>
            <option value="data_input">Data Input</option>
            <option value="processing">Processing</option>
            <option value="validation">Validation</option>
            <option value="approval">Approval</option>
            <option value="output">Output</option>
            <option value="reporting">Reporting</option>
          </select>
        </div>

        {/* Required */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="required"
            id="required"
            checked={formData.required}
            onChange={handleChange}
            className="w-4 h-4 rounded border-slate-600 text-blue-600 cursor-pointer"
          />
          <label htmlFor="required" className="ml-2 text-sm font-medium text-slate-300 cursor-pointer">
            Mark as Required
          </label>
        </div>

        {/* Default Value */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Default Value</label>
          <input
            type="text"
            name="defaultValue"
            value={formData.defaultValue}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            placeholder="Enter default value"
          />
        </div>

        {/* Assignee (for approval nodes) */}
        {node.data?.type === 'approval' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Assignee</label>
            <input
              type="text"
              name="assignee"
              value={formData.assignee}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              placeholder="Enter assignee"
            />
          </div>
        )}

        {/* Time Limit (for approval nodes) */}
        {node.data?.type === 'approval' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Time Limit (hours)</label>
            <input
              type="number"
              name="timeLimit"
              value={formData.timeLimit}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              placeholder="Enter time limit"
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-700 bg-slate-900 space-y-2">
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Save size={18} />
          Save Changes
        </button>

        <button
          onClick={onDelete}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={18} />
          Delete Node
        </button>
      </div>
    </div>
  )
}

export default ProcessNodePanel