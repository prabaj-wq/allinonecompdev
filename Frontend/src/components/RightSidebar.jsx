import React, { useState, useEffect } from 'react'
import { X, Save, Building2, Globe, Users, DollarSign, Plus, Trash2, AlertCircle } from 'lucide-react'
import { validateEntityData, generateUniqueCode, sanitizeInput } from '../utils/validation'

const RightSidebar = ({ 
  isVisible, 
  onClose, 
  onSave, 
  entity = null, 
  hierarchies = [],
  mode = 'add', // 'add', 'edit', 'view'
  customFields = [], // Custom fields for the specific axis
  axisName = null // Name of the custom axis
}) => {
  const [formData, setFormData] = useState(() => {
    if (customFields && customFields.length > 0) {
      // For custom axes - use dynamic fields
      const initialData = {
        element_name: '',
        element_code: '',
        element_type: axisName || 'Element',
        description: '',
        hierarchy_id: null,
        is_active: true
      }
      // Initialize custom field values
      customFields.forEach(field => {
        initialData[field.column_name] = field.default_value || ''
      })
      return initialData
    } else {
      // For entities - use standard fields
      return {
        entity_name: '',
        entity_code: '',
        entity_type: '',
        country: '',
        currency: 'USD',
        hierarchy_id: null,
        is_active: true
      }
    }
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [validationErrors, setValidationErrors] = useState([])
  const [isValidating, setIsValidating] = useState(false)
  const [customFieldValues, setCustomFieldValues] = useState({})

  useEffect(() => {
    console.log('RightSidebar props:', { customFields, axisName, entity, mode });
    console.log('Custom fields length:', customFields?.length);
    console.log('Custom fields data:', customFields);
    
    if (entity && mode === 'edit') {
      if (customFields && customFields.length > 0) {
        // For custom axes - populate custom fields
        const updatedData = {
          element_name: entity.name || entity.element_name || '',
          element_code: entity.code || entity.element_code || '',
          element_type: entity.type || entity.element_type || axisName || 'Element',
          description: entity.description || '',
          hierarchy_id: entity.hierarchy_id || null,
          is_active: entity.status === 'Active'
        }
        // Populate custom field values
        if (entity.custom_fields) {
          customFields.forEach(field => {
            updatedData[field.column_name] = entity.custom_fields[field.column_name] || field.default_value || ''
          })
        }
        setFormData(updatedData)
      } else {
        // For entities - populate standard fields
        setFormData({
          entity_name: entity.name || entity.entity_name || '',
          entity_code: entity.code || entity.entity_code || '',
          entity_type: entity.type || entity.entity_type || '',
          country: entity.country || '',
          currency: entity.currency || 'USD',
          hierarchy_id: entity.hierarchy_id || null,
          is_active: entity.status === 'Active'
        })
      }
    } else {
      // Reset form for new items
      if (customFields && customFields.length > 0) {
        const initialData = {
          element_name: '',
          element_code: '',
          element_type: axisName || 'Element',
          description: '',
          hierarchy_id: null,
          is_active: true
        }
        customFields.forEach(field => {
          initialData[field.column_name] = field.default_value || ''
        })
        setFormData(initialData)
      } else {
        setFormData({
          entity_name: '',
          entity_code: '',
          entity_type: '',
          country: '',
          currency: 'USD',
          hierarchy_id: null,
          is_active: true
        })
      }
    }
    setErrors({})
    // Don't load generic custom fields if we already have axis-specific custom fields
    // The loadCustomFields function was fetching generic fields, but we want to use the
    // customFields passed as props from ElementsList for the specific axis
  }, [entity, mode, isVisible, customFields, axisName])

  const validateForm = () => {
    const newErrors = {}
    const validationErrors = []
    
    // Dynamic validation based on whether we have custom fields or standard entity fields
    if (customFields && customFields.length > 0) {
      // Validate custom axis fields
      if (!formData.element_name?.trim()) {
        newErrors.element_name = `${axisName} name is required`
      }
      
      if (!formData.element_code?.trim()) {
        newErrors.element_code = `${axisName} code is required`
      }
      
      if (!formData.element_type) {
        newErrors.element_type = 'Type is required'
      }
      
      // Validate custom field requirements
      customFields.forEach(field => {
        if (field.is_required && !formData[field.column_name]) {
          newErrors[field.column_name] = `${field.column_name} is required`
        }
      })
    } else {
      // Validate standard entity fields
      if (!formData.entity_name?.trim()) {
        newErrors.entity_name = 'Entity name is required'
      }
      
      if (!formData.entity_code?.trim()) {
        newErrors.entity_code = 'Entity code is required'
      }
      
      if (!formData.entity_type) {
        newErrors.entity_type = 'Entity type is required'
      }
      
      // Enhanced validation using validation utilities for entities
      setIsValidating(true)
      
      const existingEntities = [] // This should come from props or API call
      
      const entityData = {
        id: entity?.id,
        entity_name: formData.entity_name,
        entity_code: formData.entity_code,
        entity_type: formData.entity_type,
        country: formData.country,
        currency: formData.currency,
        hierarchy_id: formData.hierarchy_id,
        status: formData.is_active ? 'Active' : 'Inactive'
      }

      const validation = validateEntityData(entityData, existingEntities)
      if (!validation.isValid) {
        validationErrors.push(...validation.errors)
      }
      
      setIsValidating(false)
    }
    
    setErrors(newErrors)
    setValidationErrors(validationErrors)
    
    return Object.keys(newErrors).length === 0 && validationErrors.length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('Form submission started')
    console.log('Form data:', formData)
    console.log('Custom field values:', customFieldValues)
    console.log('Entity:', entity)
    console.log('Mode:', mode)
    
    if (!validateForm()) {
      console.log('Form validation failed')
      return
    }

    setLoading(true)
    try {
      let entityData
      
      if (customFields && customFields.length > 0) {
        // For custom axes - structure data differently
        entityData = {
          element_name: formData.element_name,
          element_code: formData.element_code,
          element_type: formData.element_type || axisName,
          description: formData.description || '',
          hierarchy_id: formData.hierarchy_id,
          status: formData.is_active ? 'Active' : 'Inactive',
          custom_fields: {},
          id: entity?.id // Include the entity ID for editing
        }
        
        // Extract custom field values from formData
        customFields.forEach(field => {
          if (formData[field.column_name] !== undefined) {
            entityData.custom_fields[field.column_name] = formData[field.column_name]
          }
        })
        
        console.log('Custom axis entity data:', entityData)
      } else {
        // For standard entities
        entityData = {
          ...formData,
          status: formData.is_active ? 'Active' : 'Inactive',
          id: entity?.id, // Include the entity ID for editing
          entity_code: entity?.entity_code || formData.entity_code // Preserve original entity_code for editing
        }
        
        console.log('Standard entity data:', entityData)
      }

      console.log('Final entity data to save:', entityData)

      // Call onSave with the entity data for the parent to handle
      await onSave(entityData)
      onClose()
    } catch (error) {
      console.error('Error saving entity:', error)
      setErrors({ submit: 'Failed to save entity' })
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
        [field]: ''
      }))
    }
  }

  const handleDelete = async () => {
    if (!entity || !window.confirm(`Are you sure you want to delete "${entity.name}"?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/entities/${entity.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onSave({ deleted: true, id: entity.id })
        onClose()
      } else {
        setErrors({ submit: 'Failed to delete entity' })
      }
    } catch (error) {
      console.error('Error deleting entity:', error)
      setErrors({ submit: 'Failed to delete entity' })
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {mode === 'add' 
                  ? (axisName ? `Add New ${axisName} Element` : 'Add New Entity')
                  : mode === 'edit' 
                  ? (axisName ? `Edit ${axisName} Element` : 'Edit Entity')
                  : (axisName ? `View ${axisName} Element` : 'View Entity')
                }
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {mode === 'add' 
                  ? (axisName ? `Create a new ${axisName.toLowerCase()} element` : 'Create a new entity')
                  : mode === 'edit' 
                  ? (axisName ? 'Update element information' : 'Update entity information')
                  : (axisName ? 'View element details' : 'View entity details')
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* For Custom Axes: Show both basic element fields AND custom fields */}
            {customFields && customFields.length > 0 ? (
              <div className="space-y-6">
                {/* Basic Element Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Basic Information
                  </h3>
                  
                  {/* Element Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Element Name <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.element_name || ''}
                      onChange={(e) => handleInputChange('element_name', e.target.value)}
                      disabled={mode === 'view'}
                      className={`w-full px-3 py-2 border ${
                        errors.element_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        mode === 'view' ? 'bg-gray-100 dark:bg-gray-600' : ''
                      }`}
                      placeholder="Enter element name"
                    />
                    {errors.element_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.element_name}</p>
                    )}
                  </div>

                  {/* Element Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Element Code <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.element_code || ''}
                      onChange={(e) => handleInputChange('element_code', e.target.value)}
                      disabled={mode === 'view'}
                      className={`w-full px-3 py-2 border ${
                        errors.element_code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        mode === 'view' ? 'bg-gray-100 dark:bg-gray-600' : ''
                      }`}
                      placeholder="Enter element code"
                    />
                    {errors.element_code && (
                      <p className="text-red-500 text-xs mt-1">{errors.element_code}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      disabled={mode === 'view'}
                      rows={3}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        mode === 'view' ? 'bg-gray-100 dark:bg-gray-600' : ''
                      }`}
                      placeholder="Enter description (optional)"
                    />
                  </div>
                </div>

                {/* Custom Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    {axisName} Custom Fields
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {customFields.map((field) => (
                      <div key={field.column_name}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {field.column_name}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                          type="text"
                          value={formData[field.column_name] || ''}
                          onChange={(e) => handleInputChange(field.column_name, e.target.value)}
                          disabled={mode === 'view'}
                          className={`w-full px-3 py-2 border ${
                            errors[field.column_name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                            mode === 'view' ? 'bg-gray-100 dark:bg-gray-600' : ''
                          }`}
                          placeholder={field.default_value || `Enter ${field.column_name}`}
                        />
                        {errors[field.column_name] && (
                          <p className="text-red-500 text-xs mt-1">{errors[field.column_name]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                <p>Entity form fields here...</p>
              </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                      Validation Errors
                    </h4>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}
          </form>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between space-x-3">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </button>
            )}
            
            <div className="flex space-x-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              {mode !== 'view' && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {mode === 'add' ? (axisName ? `Create ${axisName} Element` : 'Create Entity') : (axisName ? `Update ${axisName} Element` : 'Update Entity')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RightSidebar
