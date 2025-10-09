import React, { useState, useEffect } from 'react'
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Database, 
  Link,
  Layers,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react'

const AxesEntityForm = ({ 
  entity, 
  onSave, 
  onCancel, 
  axesSettings, 
  entities,
  hierarchies = [],
  companyName 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parent_id: null,
    hierarchy_id: null,
    level: 0,
    entity_type: 'Subsidiary',
    geography: '',
    currency: 'USD',
    custom_fields: {}
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [dropdownData, setDropdownData] = useState({})
  const [loadingDropdowns, setLoadingDropdowns] = useState({})

  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name || '',
        code: entity.code || '',
        parent_id: entity.parent_id || null,
        hierarchy_id: entity.hierarchy_id || null,
        level: entity.level || 0,
        entity_type: entity.entity_type || 'Subsidiary',
        geography: entity.geography || '',
        currency: entity.currency || 'USD',
        custom_fields: entity.custom_fields || {}
      })
    } else {
      // Reset form for new entity
      setFormData({
        name: '',
        code: '',
        parent_id: null,
        hierarchy_id: null,
        level: 0,
        entity_type: 'Subsidiary',
        geography: '',
        currency: 'USD',
        custom_fields: {}
      })
    }
  }, [entity])

  useEffect(() => {
    // Load dropdown data for SQL-driven fields
    loadDropdownData()
  }, [axesSettings])

  const loadDropdownData = async () => {
    if (!axesSettings.custom_fields) return

    // Now custom_fields is an object, so we get the values
    const customFieldsArray = Object.entries(axesSettings.custom_fields || {}).map(([name, config]) => ({
      field_name: name,
      ...config
    }))

    const sqlFields = customFieldsArray.filter(
      field => field && field.type === 'sql_query' && field.sql_query
    )

    for (const field of sqlFields) {
      setLoadingDropdowns(prev => ({ ...prev, [field.field_name]: true }))
      
      try {
        const response = await fetch(
          `/api/axes-entity/dropdown-values?field_name=${field.field_name}&sql_query=${encodeURIComponent(field.sql_query)}&company_name=${companyName}`,
          { credentials: 'include' }
        )
        
        if (response.ok) {
          const data = await response.json()
          setDropdownData(prev => ({
            ...prev,
            [field.field_name]: data.values || []
          }))
        }
      } catch (error) {
        console.error(`Error loading dropdown data for ${field.field_name}:`, error)
      } finally {
        setLoadingDropdowns(prev => ({ ...prev, [field.field_name]: false }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Entity name is required'
    }
    
    if (!formData.code?.trim()) {
      newErrors.code = 'Entity code is required'
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and underscores'
    }

    // Validate custom fields that are required
    if (axesSettings.custom_fields) {
      Object.entries(axesSettings.custom_fields).forEach(([fieldName, fieldConfig]) => {
        if (fieldConfig.is_required) {
          const value = formData.custom_fields[fieldName]
          if (!value || (typeof value === 'string' && !value.trim())) {
            newErrors[`custom_${fieldName}`] = `${fieldConfig.label || fieldName} is required`
          }
        }
      })
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
        onCancel() // Close form on success
      }
    } catch (error) {
      console.error('Error saving entity:', error)
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

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldName]: value
      }
    }))
    
    // Clear error when user starts typing
    const errorKey = `custom_${fieldName}`
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }))
    }
  }

  const renderCustomField = (fieldName, field) => {
    const fieldType = field.type
    const value = formData.custom_fields[fieldName] || ''
    const errorKey = `custom_${fieldName}`
    const hasError = !!errors[errorKey]

    // Get field type icon and label
    const getFieldTypeInfo = (type) => {
      switch (type) {
        case 'text': return { icon: '📝', label: 'Text' }
        case 'textarea': return { icon: '📄', label: 'Long Text' }
        case 'number': return { icon: '🔢', label: 'Number' }
        case 'date': return { icon: '📅', label: 'Date' }
        case 'select': return { icon: '📋', label: 'Dropdown' }
        case 'boolean': return { icon: '☑️', label: 'Yes/No' }
        case 'sql_query': return { icon: '🗄️', label: 'Database Query' }
        default: return { icon: '📝', label: 'Text' }
      }
    }

    const typeInfo = getFieldTypeInfo(fieldType)

    switch (fieldType) {
      case 'text':
      case 'textarea':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                {field.label || fieldName}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                {typeInfo.label}
              </span>
            </label>
            {fieldType === 'textarea' ? (
              <textarea
                value={value}
                onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  hasError 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                }`}
                placeholder={`Enter ${field.label || fieldName}`}
                rows={3}
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  hasError 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                }`}
                placeholder={`Enter ${field.label || fieldName}`}
              />
            )}
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors[errorKey]}</p>
            )}
          </div>
        )

      case 'number':
        return (
          <div key={field.field_name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.field_name}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                hasError 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
              }`}
              placeholder={`Enter ${field.field_name}`}
            />
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors[errorKey]}</p>
            )}
          </div>
        )

      case 'dropdown':
      case 'select':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                {field.label || fieldName}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                {typeInfo.label}
              </span>
            </label>
            <select
              value={value}
              onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                hasError 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
              }`}
            >
              <option value="">Select {field.label || fieldName}</option>
              {(field.dropdown_values || field.options)?.map(option => (
                <option key={typeof option === 'string' ? option : option.value} 
                        value={typeof option === 'string' ? option : option.value}>
                  {typeof option === 'string' ? option : option.label}
                </option>
              ))}
            </select>
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors[errorKey]}</p>
            )}
          </div>
        )

      case 'sql_dropdown':
      case 'sql_query':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <Database className="h-4 w-4 mr-1" />
              {field.label || fieldName}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <select
                value={value}
                onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
                disabled={loadingDropdowns[fieldName]}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  hasError 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                } ${loadingDropdowns[fieldName] ? 'opacity-50' : ''}`}
              >
                <option value="">
                  {loadingDropdowns[fieldName] ? 'Loading...' : `Select ${field.label || fieldName}`}
                </option>
                {dropdownData[fieldName]?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {loadingDropdowns[fieldName] && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors[errorKey]}</p>
            )}
          </div>
        )

      case 'boolean':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                {field.label || fieldName}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                {typeInfo.label}
              </span>
            </label>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`${fieldName}_radio`}
                  value="true"
                  checked={value === true || value === 'true'}
                  onChange={() => handleCustomFieldChange(fieldName, true)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`${fieldName}_radio`}
                  value="false"
                  checked={value === false || value === 'false' || !value}
                  onChange={() => handleCustomFieldChange(fieldName, false)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">No</span>
              </label>
            </div>
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors[errorKey]}</p>
            )}
          </div>
        )

      case 'date':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                {field.label || fieldName}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                {typeInfo.label}
              </span>
            </label>
            <input
              type="date"
              value={value || ''}
              onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                hasError 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
              }`}
            />
            {hasError && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors[errorKey]}</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  // Get available parent entities (excluding self and descendants)
  const getAvailableParents = () => {
    if (!entity) return entities // New entity can have any parent
    
    // For existing entity, exclude self and descendants
    const excludeIds = new Set([entity.id])
    
    const addDescendants = (parentId) => {
      entities.forEach(e => {
        if (e.parent_id === parentId && !excludeIds.has(e.id)) {
          excludeIds.add(e.id)
          addDescendants(e.id)
        }
      })
    }
    
    addDescendants(entity.id)
    
    return entities.filter(e => !excludeIds.has(e.id))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {entity ? 'Edit Entity' : 'Create New Entity'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.name 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                  }`}
                  placeholder="Enter entity name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.code 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                  }`}
                  placeholder="ENTITY_CODE"
                />
                {errors.code && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.code}</p>
                )}
              </div>
            </div>

            {/* Hierarchy Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Layers className="h-4 w-4 mr-1" />
                Hierarchy (Folder)
              </label>
              <select
                value={formData.hierarchy_id || ''}
                onChange={(e) => {
                  const hierarchyId = e.target.value ? parseInt(e.target.value) : null
                  handleInputChange('hierarchy_id', hierarchyId)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500"
              >
                <option value="">Select Hierarchy</option>
                {hierarchies.map(hierarchy => (
                  <option key={hierarchy.id} value={hierarchy.id}>
                    {hierarchy.hierarchy_name} ({hierarchy.entity_count || 0} entities)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Choose which hierarchy/folder this entity belongs to
              </p>
            </div>

            {/* Parent Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Link className="h-4 w-4 mr-1" />
                Parent Entity
              </label>
              <select
                value={formData.parent_id || ''}
                onChange={(e) => {
                  const parentId = e.target.value ? parseInt(e.target.value) : null
                  const parent = entities.find(e => e.id === parentId)
                  handleInputChange('parent_id', parentId)
                  handleInputChange('level', parent ? parent.level + 1 : 0)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500"
              >
                <option value="">No Parent (Root Entity)</option>
                {getAvailableParents().map(entity => (
                  <option key={entity.id} value={entity.id}>
                    {'  '.repeat(entity.level)}{entity.name} ({entity.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Standard Finance Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Entity Type
                </label>
                <select
                  value={formData.entity_type}
                  onChange={(e) => handleInputChange('entity_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500"
                >
                  <option value="Parent">Parent</option>
                  <option value="Subsidiary">Subsidiary</option>
                  <option value="Division">Division</option>
                  <option value="Department">Department</option>
                  <option value="Branch">Branch</option>
                  <option value="Legal Entity">Legal Entity</option>
                  <option value="Business Unit">Business Unit</option>
                  <option value="Cost Center">Cost Center</option>
                  <option value="Profit Center">Profit Center</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Geography
                </label>
                <input
                  type="text"
                  value={formData.geography}
                  onChange={(e) => handleInputChange('geography', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500"
                  placeholder="e.g., North America, EMEA"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currency
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500"
                  placeholder="USD, EUR, GBP, etc."
                  maxLength={3}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter 3-letter currency code (e.g., USD, EUR, GBP)
                </p>
              </div>
            </div>


            {/* Custom Fields */}
            {axesSettings.custom_fields && Object.keys(axesSettings.custom_fields).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Custom Fields
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    ({Object.keys(axesSettings.custom_fields).length} fields)
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(axesSettings.custom_fields).map(([fieldName, field]) => renderCustomField(fieldName, field))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{loading ? 'Saving...' : 'Save Entity'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AxesEntityForm
