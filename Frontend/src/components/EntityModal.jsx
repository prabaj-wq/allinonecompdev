import React, { useState, useEffect } from 'react'
import { X, Save, Building2, Globe, Users, DollarSign } from 'lucide-react'

const EntityModal = ({ 
  isVisible, 
  onClose, 
  onSave, 
  entity = null, 
  hierarchies = [] 
}) => {
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    entity_type: '',
    country: '',
    currency: 'USD',
    hierarchy_id: null,
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (entity) {
      setFormData({
        entity_name: entity.name || '',
        entity_code: entity.code || '',
        entity_type: entity.type || '',
        country: entity.country || '',
        currency: entity.currency || 'USD',
        hierarchy_id: entity.hierarchy_id || null,
        is_active: entity.status === 'Active'
      })
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
    setErrors({})
  }, [entity, isVisible])

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
    
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const entityData = {
        ...formData,
        status: formData.is_active ? 'Active' : 'Inactive'
      }

      const url = entity ? `/api/entities/${entity.id}` : '/api/entities'
      const method = entity ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entityData)
      })

      if (response.ok) {
        const result = await response.json()
        onSave(result)
        onClose()
      } else {
        const error = await response.json()
        setErrors({ submit: error.message || 'Failed to save entity' })
      }
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

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {entity ? 'Edit Entity' : 'Add New Entity'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {entity ? 'Update entity information' : 'Create a new entity'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entity Name *
                </label>
                <input
                  type="text"
                  value={formData.entity_name}
                  onChange={(e) => handleInputChange('entity_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.entity_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter entity name"
                />
                {errors.entity_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.entity_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entity Code *
                </label>
                <input
                  type="text"
                  value={formData.entity_code}
                  onChange={(e) => handleInputChange('entity_code', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.entity_code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter entity code"
                />
                {errors.entity_code && (
                  <p className="text-red-500 text-sm mt-1">{errors.entity_code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entity Type *
                </label>
                <select
                  value={formData.entity_type}
                  onChange={(e) => handleInputChange('entity_type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.entity_type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select entity type</option>
                  <option value="Parent Company">Parent Company</option>
                  <option value="Subsidiary">Subsidiary</option>
                  <option value="Joint Venture">Joint Venture</option>
                  <option value="Branch">Branch</option>
                </select>
                {errors.entity_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.entity_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter country"
                />
                {errors.country && (
                  <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <option value="CAD">CAD</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hierarchy
                </label>
                <select
                  value={formData.hierarchy_id || ''}
                  onChange={(e) => handleInputChange('hierarchy_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select hierarchy</option>
                  {hierarchies.map((hierarchy) => (
                    <option key={hierarchy.id} value={hierarchy.id}>
                      {hierarchy.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Active Entity
              </label>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {entity ? 'Update Entity' : 'Create Entity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EntityModal
