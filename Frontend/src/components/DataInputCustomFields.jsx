import React, { useState, useEffect } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import {
  Plus, Edit, Trash2, X, Save, Settings, Type, Hash, Calendar, 
  List, ToggleLeft, Database, AlertCircle, CheckCircle
} from 'lucide-react'

const DataInputCustomFields = ({ 
  cardType, 
  isVisible = false, 
  onClose, 
  onSave 
}) => {
  const { selectedCompany } = useCompany()
  const { getAuthHeaders } = useAuth()
  const [fields, setFields] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState(null)
  
  const [newField, setNewField] = useState({
    field_name: '',
    field_type: 'text',
    is_required: false,
    options: ''
  })

  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  useEffect(() => {
    if (isVisible && cardType && selectedCompany) {
      loadCustomFields()
    }
  }, [isVisible, cardType, selectedCompany])

  const loadCustomFields = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/data-input/custom-fields/${cardType}?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setFields(data.fields || [])
        console.log('✅ Loaded custom fields:', data.fields)
      } else {
        console.error('Failed to load custom fields:', response.status)
        setFields([])
      }
    } catch (error) {
      console.error('Error loading custom fields:', error)
      showToast('Failed to load custom fields', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fieldTypes = [
    { value: 'text', label: 'Text', icon: Type, description: 'Single line text input' },
    { value: 'textarea', label: 'Text Area', icon: Type, description: 'Multi-line text input' },
    { value: 'number', label: 'Number', icon: Hash, description: 'Numeric input' },
    { value: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
    { value: 'dropdown', label: 'Dropdown', icon: List, description: 'Select from predefined options' },
    { value: 'checkbox', label: 'Checkbox', icon: ToggleLeft, description: 'Yes/No checkbox' }
  ]

  const handleAddField = () => {
    setNewField({
      field_name: '',
      field_type: 'text',
      is_required: false,
      options: ''
    })
    setEditingField(null)
    setShowAddForm(true)
  }

  const handleEditField = (field) => {
    setNewField({
      field_name: field.field_name,
      field_type: field.field_type,
      is_required: field.is_required || false,
      options: field.options || ''
    })
    setEditingField(field)
    setShowAddForm(true)
  }

  const handleSaveField = async () => {
    if (!newField.field_name.trim()) {
      showToast('Field name is required', 'error')
      return
    }

    if (newField.field_type === 'dropdown' && !newField.options.trim()) {
      showToast('Options are required for dropdown fields', 'error')
      return
    }

    setSaving(true)
    try {
      const url = editingField 
        ? `/api/data-input/custom-fields/${cardType}/${editingField.id}?company_name=${encodeURIComponent(selectedCompany)}`
        : `/api/data-input/custom-fields/${cardType}?company_name=${encodeURIComponent(selectedCompany)}`
      
      const method = editingField ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newField)
      })

      if (response.ok) {
        showToast(editingField ? 'Field updated successfully!' : 'Field created successfully!', 'success')
        setShowAddForm(false)
        setEditingField(null)
        loadCustomFields() // Reload fields
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to save field')
      }
    } catch (error) {
      console.error('Error saving field:', error)
      showToast(error.message || 'Failed to save field', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm('Are you sure you want to delete this field? This will remove it from all entries.')) {
      return
    }

    try {
      const response = await fetch(
        `/api/data-input/custom-fields/${cardType}/${fieldId}?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
        }
      )

      if (response.ok) {
        showToast('Field deleted successfully!', 'success')
        loadCustomFields() // Reload fields
      } else {
        throw new Error('Failed to delete field')
      }
    } catch (error) {
      console.error('Error deleting field:', error)
      showToast('Failed to delete field', 'error')
    }
  }

  const handleSaveAllSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch(
        `/api/data-input/custom-fields/${cardType}/bulk-save?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ fields: fields.map(f => ({
            field_name: f.field_name,
            field_type: f.field_type,
            is_required: f.is_required || false,
            options: f.options || ''
          })) })
        }
      )

      if (response.ok) {
        showToast('Custom fields settings saved successfully!', 'success')
        if (onSave) onSave()
        onClose()
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Custom Fields Settings - {cardType.replace('_', ' ').toUpperCase()}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure custom fields for {cardType.replace('_', ' ')} data input
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mx-6 mt-4 p-3 rounded-lg ${
            notification.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              {notification.message}
            </div>
          </div>
        )}

        <div className="flex h-[calc(90vh-180px)]">
          {/* Fields List */}
          <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Custom Fields ({fields.length})
              </h3>
              <button
                onClick={handleAddField}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading fields...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field) => {
                  const fieldType = fieldTypes.find(ft => ft.value === field.field_type)
                  const IconComponent = fieldType?.icon || Type
                  
                  return (
                    <div
                      key={field.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {field.field_name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {fieldType?.label || field.field_type}
                              {field.is_required && ' • Required'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditField(field)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {fields.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No custom fields configured</p>
                    <p className="text-sm">Click "Add Field" to create your first custom field</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Field Editor */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {showAddForm ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingField ? 'Edit Field' : 'Add New Field'}
                  </h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Field Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Field Name *
                    </label>
                    <input
                      type="text"
                      value={newField.field_name}
                      onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="e.g., project_code, department, priority"
                    />
                  </div>

                  {/* Field Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Field Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {fieldTypes.map((type) => {
                        const IconComponent = type.icon
                        return (
                          <button
                            key={type.value}
                            onClick={() => setNewField({ ...newField, field_type: type.value })}
                            className={`p-3 border rounded-lg text-left transition-colors ${
                              newField.field_type === type.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span className="font-medium">{type.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {type.description}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Options for Dropdown */}
                  {newField.field_type === 'dropdown' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dropdown Options *
                      </label>
                      <textarea
                        value={newField.options}
                        onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        rows="3"
                        placeholder="Enter options separated by commas (e.g., High, Medium, Low)"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Separate options with commas
                      </p>
                    </div>
                  )}

                  {/* Required Checkbox */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newField.is_required}
                        onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Required field</span>
                    </label>
                  </div>

                  {/* Save Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveField}
                      disabled={saving}
                      className="flex-1 btn-primary inline-flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {editingField ? 'Update Field' : 'Add Field'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a field to edit or add a new field</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {fields.length} custom fields configured
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Close
            </button>
            <button
              onClick={handleSaveAllSettings}
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataInputCustomFields
