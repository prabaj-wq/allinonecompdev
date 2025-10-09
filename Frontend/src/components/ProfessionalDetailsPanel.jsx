import React, { useState, useEffect } from 'react'
import { 
  Save, 
  X, 
  Building2, 
  MapPin, 
  DollarSign, 
  Tag,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react'

const ProfessionalDetailsPanel = ({ 
  selectedItem, 
  onSave, 
  onClose, 
  onAddCustomField,
  customFields = [],
  hierarchies = []
}) => {
  const [formData, setFormData] = useState({})
  const [customFieldValues, setCustomFieldValues] = useState({})
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedItem) {
      setFormData({
        entity_name: selectedItem.entity_name || '',
        entity_code: selectedItem.entity_code || '',
        entity_type: selectedItem.entity_type || '',
        country: selectedItem.country || '',
        currency: selectedItem.currency || 'USD',
        hierarchy_id: selectedItem.hierarchy_id || null,
        is_active: selectedItem.is_active !== false,
        status: selectedItem.status || 'Active'
      })

      // Load custom field values
      const customValues = {}
      customFields.forEach(field => {
        customValues[field.name] = selectedItem[field.name] || field.default_value || ''
      })
      setCustomFieldValues(customValues)
    }
  }, [selectedItem, customFields])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const handleCustomFieldChange = (fieldName, value) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.entity_name.trim()) {
      newErrors.entity_name = 'Entity name is required'
    }
    
    if (!formData.entity_code.trim()) {
      newErrors.entity_code = 'Entity code is required'
    }
    
    if (!formData.entity_type) {
      newErrors.entity_type = 'Entity type is required'
    }

    // Validate custom fields
    customFields.forEach(field => {
      if (field.is_required && !customFieldValues[field.name]) {
        newErrors[`custom_${field.name}`] = `${field.label} is required`
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const submitData = {
        ...formData,
        ...customFieldValues
      }
      
      await onSave(submitData)
      onClose()
    } catch (error) {
      console.error('Error saving entity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderCustomField = (field) => {
    const value = customFieldValues[field.name] || ''
    const error = errors[`custom_${field.name}`]

    switch (field.type) {
      case 'boolean':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  checked={value === 'true'}
                  onChange={(e) => handleCustomFieldChange(field.name, 'true')}
                  className="mr-2"
                />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  checked={value === 'false'}
                  onChange={(e) => handleCustomFieldChange(field.name, 'false')}
                  className="mr-2"
                />
                <span className="text-sm">No</span>
              </label>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        )

      default:
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={value}
              onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        )
    }
  }

  if (!selectedItem) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Item Selected</h3>
          <p className="text-gray-600 dark:text-gray-400">Select an entity from the hierarchy to view and edit details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedItem.entity_name || 'New Entity'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedItem.entity_code || 'New Code'} • {selectedItem.entity_type || 'Subsidiary'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Entity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.entity_name}
                  onChange={(e) => handleInputChange('entity_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter entity name"
                />
                {errors.entity_name && <p className="text-sm text-red-600 dark:text-red-400">{errors.entity_name}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Entity Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.entity_code}
                  onChange={(e) => handleInputChange('entity_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter entity code"
                />
                {errors.entity_code && <p className="text-sm text-red-600 dark:text-red-400">{errors.entity_code}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Entity Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.entity_type}
                  onChange={(e) => handleInputChange('entity_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select entity type</option>
                  <option value="Parent">Parent</option>
                  <option value="Subsidiary">Subsidiary</option>
                  <option value="Joint Venture">Joint Venture</option>
                  <option value="Associate">Associate</option>
                </select>
                {errors.entity_type && <p className="text-sm text-red-600 dark:text-red-400">{errors.entity_type}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hierarchy
                </label>
                <select
                  value={formData.hierarchy_id || ''}
                  onChange={(e) => handleInputChange('hierarchy_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select hierarchy</option>
                  {hierarchies.map(hierarchy => (
                    <option key={hierarchy.id} value={hierarchy.id}>{hierarchy.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter country"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Custom Fields
                </h3>
                <button
                  type="button"
                  onClick={() => onAddCustomField && onAddCustomField()}
                  className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Field</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map(renderCustomField)}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Status
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Saving...' : (selectedItem?.id ? 'Save Changes' : 'Create Entity')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ProfessionalDetailsPanel
