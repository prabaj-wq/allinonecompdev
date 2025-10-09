import React, { useState, useEffect } from 'react'
import { 
  Save, 
  X, 
  Layers,
  AlertCircle
} from 'lucide-react'

const HierarchyCreateModal = ({ 
  isOpen, 
  onClose, 
  onSave,
  hierarchy = null // For editing existing hierarchy
}) => {
  const [formData, setFormData] = useState({
    hierarchy_name: '',
    description: '',
    hierarchy_type: 'entity'
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Update form data when hierarchy prop changes (for editing)
  useEffect(() => {
    if (hierarchy) {
      setFormData({
        hierarchy_name: hierarchy.hierarchy_name || '',
        description: hierarchy.description || '',
        hierarchy_type: hierarchy.hierarchy_type || 'entity'
      })
    } else {
      // Reset form for new hierarchy
      setFormData({
        hierarchy_name: '',
        description: '',
        hierarchy_type: 'entity'
      })
    }
  }, [hierarchy, isOpen])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.hierarchy_name?.trim()) {
      newErrors.hierarchy_name = 'Hierarchy name is required'
    } else if (formData.hierarchy_name.length < 2) {
      newErrors.hierarchy_name = 'Hierarchy name must be at least 2 characters long'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const success = await onSave(formData)
      if (success) {
        // Reset form
        setFormData({
          hierarchy_name: '',
          description: '',
          hierarchy_type: 'entity'
        })
        onClose()
      }
    } catch (error) {
      console.error('Error saving hierarchy:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Layers className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {hierarchy ? 'Edit Hierarchy' : 'Create New Hierarchy'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Hierarchy Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hierarchy Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.hierarchy_name}
                onChange={(e) => handleInputChange('hierarchy_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.hierarchy_name 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                }`}
                placeholder="e.g., Geography, Legal Structure, Business Units"
              />
              {errors.hierarchy_name && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.hierarchy_name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500"
                rows={3}
                placeholder="Describe what this hierarchy is used for..."
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Hierarchies are like folders</strong> that organize your entities. 
                For example, create "Geography" to organize entities like Asia, Europe, etc.
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>
              {loading 
                ? (hierarchy ? 'Updating...' : 'Creating...') 
                : (hierarchy ? 'Update Hierarchy' : 'Create Hierarchy')
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default HierarchyCreateModal
