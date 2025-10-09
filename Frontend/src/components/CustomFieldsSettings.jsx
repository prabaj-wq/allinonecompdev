import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Database,
  List,
  ToggleLeft,
  ToggleRight,
  Hash,
  Calendar,
  Type,
  AlertCircle,
  CheckCircle,
  Info,
  Settings
} from 'lucide-react'

const CustomFieldsSettings = ({ 
  dimensionType, 
  customFields = [], 
  onSave, 
  onClose,
  isVisible = false 
}) => {
  const [fields, setFields] = useState(customFields)
  const [editingField, setEditingField] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    options: [],
    is_required: false,
    is_unique: false,
    default_value: '',
    validation_rules: {},
    display_order: 0
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setFields(customFields)
  }, [customFields])

  const fieldTypes = [
    { value: 'text', label: 'Text', icon: Type, description: 'Single line text input' },
    { value: 'textarea', label: 'Text Area', icon: Type, description: 'Multi-line text input' },
    { value: 'number', label: 'Number', icon: Hash, description: 'Numeric input' },
    { value: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
    { value: 'select', label: 'Dropdown', icon: List, description: 'Select from predefined options' },
    { value: 'boolean', label: 'Yes/No', icon: ToggleLeft, description: 'Boolean checkbox' },
    { value: 'sql_query', label: 'SQL Query', icon: Database, description: 'Dynamic options from SQL query' },
    { value: 'reference', label: 'Reference', icon: Database, description: 'Link to another dimension' }
  ]

  const handleAddField = () => {
    setErrors({})
    setNewField({
      name: '',
      label: '',
      type: 'text',
      options: [],
      is_required: false,
      is_unique: false,
      default_value: '',
      validation_rules: {},
      display_order: fields.length
    })
    setShowAddForm(true)
  }

  const handleEditField = (field) => {
    setEditingField(field)
    setNewField({ ...field })
    setShowAddForm(true)
  }

  const handleDeleteField = (fieldId) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      setFields(fields.filter(f => f.id !== fieldId))
    }
  }

  const validateField = (field) => {
    const errors = {}
    
    if (!field.name.trim()) {
      errors.name = 'Field name is required'
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
      errors.name = 'Field name must start with a letter or underscore and contain only letters, numbers, and underscores'
    }
    
    if (!field.label.trim()) {
      errors.label = 'Field label is required'
    }
    
    if (field.type === 'select' && (!field.options || field.options.length === 0)) {
      errors.options = 'At least one option is required for select fields'
    }
    
    if (field.type === 'sql_query' && !field.sql_query) {
      errors.sql_query = 'SQL query is required'
    }
    
    return errors
  }

  const handleSaveField = () => {
    const fieldErrors = validateField(newField)
    setErrors(fieldErrors)
    
    if (Object.keys(fieldErrors).length > 0) {
      return
    }

    if (editingField) {
      // Update existing field
      setFields(fields.map(f => 
        f.id === editingField.id 
          ? { ...newField, id: editingField.id }
          : f
      ))
    } else {
      // Add new field
      const newId = Math.max(...fields.map(f => f.id || 0), 0) + 1
      setFields([...fields, { ...newField, id: newId }])
    }
    
    setShowAddForm(false)
    setEditingField(null)
    setNewField({
      name: '',
      label: '',
      type: 'text',
      options: [],
      is_required: false,
      is_unique: false,
      default_value: '',
      validation_rules: {},
      display_order: 0
    })
  }

  const handleSaveAll = () => {
    onSave(fields)
    onClose()
  }

  const addOption = () => {
    setNewField({
      ...newField,
      options: [...(newField.options || []), { value: '', label: '' }]
    })
  }

  const updateOption = (index, key, value) => {
    const options = [...(newField.options || [])]
    options[index] = { ...options[index], [key]: value }
    setNewField({ ...newField, options })
  }

  const removeOption = (index) => {
    const options = [...(newField.options || [])]
    options.splice(index, 1)
    setNewField({ ...newField, options })
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Custom Fields Settings
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Configure custom fields for {dimensionType} elements
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Fields List */}
          <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Current Fields ({fields.length})
              </h3>
              <button
                onClick={handleAddField}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const fieldType = fieldTypes.find(ft => ft.value === field.type)
                const IconComponent = fieldType?.icon || Type
                
                return (
                  <div
                    key={field.id || index}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {field.label}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {field.name} • {fieldType?.label || field.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {field.is_required && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full">
                            Required
                          </span>
                        )}
                        {field.is_unique && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                            Unique
                          </span>
                        )}
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
                  <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No custom fields configured</p>
                  <p className="text-sm">Click "Add Field" to create your first custom field</p>
                </div>
              )}
            </div>
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
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingField(null)
                      setErrors({})
                    }}
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
                      value={newField.name}
                      onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="e.g., country, currency, is_public"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Field Label */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Field Label *
                    </label>
                    <input
                      type="text"
                      value={newField.label}
                      onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.label ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="e.g., Country, Currency, Is Public Company"
                    />
                    {errors.label && (
                      <p className="text-red-500 text-sm mt-1">{errors.label}</p>
                    )}
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
                            onClick={() => setNewField({ ...newField, type: type.value })}
                            className={`p-3 border rounded-lg text-left transition-colors ${
                              newField.type === type.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
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

                  {/* Options for Select Fields */}
                  {newField.type === 'select' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Options *
                      </label>
                      <div className="space-y-2">
                        {(newField.options || []).map((option, index) => (
                          <div key={index} className="flex space-x-2">
                            <input
                              type="text"
                              value={option.value}
                              onChange={(e) => updateOption(index, 'value', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="Value"
                            />
                            <input
                              type="text"
                              value={option.label}
                              onChange={(e) => updateOption(index, 'label', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="Label"
                            />
                            <button
                              onClick={() => removeOption(index)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addOption}
                          className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                        >
                          <Plus className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                      {errors.options && (
                        <p className="text-red-500 text-sm mt-1">{errors.options}</p>
                      )}
                    </div>
                  )}

                  {/* SQL Query for SQL Query Fields */}
                  {newField.type === 'sql_query' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        SQL Query *
                      </label>
                      <textarea
                        value={newField.sql_query || ''}
                        onChange={(e) => setNewField({ ...newField, sql_query: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                          errors.sql_query ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        rows="4"
                        placeholder="SELECT id, name FROM table_name WHERE condition = ?"
                      />
                      {errors.sql_query && (
                        <p className="text-red-500 text-sm mt-1">{errors.sql_query}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Use SELECT queries only. The query should return id and name columns.
                      </p>
                    </div>
                  )}

                  {/* Default Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Value
                    </label>
                    <input
                      type="text"
                      value={newField.default_value}
                      onChange={(e) => setNewField({ ...newField, default_value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Default value for this field"
                    />
                  </div>

                  {/* Validation Options */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Validation Options
                    </label>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newField.is_required}
                          onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newField.is_unique}
                          onChange={(e) => setNewField({ ...newField, is_unique: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Unique</span>
                      </label>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSaveField}
                      className="flex-1 btn-primary flex items-center justify-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
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
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomFieldsSettings
