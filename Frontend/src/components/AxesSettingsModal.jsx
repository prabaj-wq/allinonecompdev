import React, { useState, useEffect } from 'react'
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Database, 
  Link,
  AlertCircle,
  CheckCircle,
  Loader,
  Eye,
  Code,
  Settings
} from 'lucide-react'

const AxesSettingsModal = ({ 
  isOpen, 
  onClose, 
  axesSettings, 
  onSave, 
  companyName 
}) => {
  const [settings, setSettings] = useState({
    axes_type: 'entity',
    custom_fields: [],
    linked_axes: []
  })
  const [loading, setLoading] = useState(false)
  const [testingSQL, setTestingSQL] = useState({})
  const [sqlResults, setSqlResults] = useState({})

  useEffect(() => {
    if (axesSettings) {
      setSettings({
        axes_type: axesSettings.axes_type || 'entity',
        custom_fields: axesSettings.custom_fields || [],
        linked_axes: axesSettings.linked_axes || []
      })
    }
  }, [axesSettings])

  const fieldTypes = [
    { value: 'text', label: 'Text', icon: '📝' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'dropdown', label: 'Static Dropdown', icon: '📋' },
    { value: 'sql_dropdown', label: 'SQL Dropdown', icon: '🗄️' },
    { value: 'boolean', label: 'Boolean', icon: '☑️' },
    { value: 'date', label: 'Date', icon: '📅' }
  ]

  const addCustomField = () => {
    const newField = {
      field_name: '',
      field_type: 'text',
      is_required: false,
      sql_query: null,
      dropdown_values: null,
      validation_rules: null
    }
    
    setSettings(prev => ({
      ...prev,
      custom_fields: [...prev.custom_fields, newField]
    }))
  }

  const removeCustomField = (index) => {
    setSettings(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.filter((_, i) => i !== index)
    }))
  }

  const updateCustomField = (index, field, value) => {
    setSettings(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const testSQLQuery = async (fieldIndex, sqlQuery) => {
    if (!sqlQuery.trim()) return

    setTestingSQL(prev => ({ ...prev, [fieldIndex]: true }))
    
    try {
      const response = await fetch(
        `/api/axes-entity/validate-sql?sql_query=${encodeURIComponent(sqlQuery)}&company_name=${companyName}`,
        { credentials: 'include' }
      )
      
      const result = await response.json()
      setSqlResults(prev => ({ ...prev, [fieldIndex]: result }))
    } catch (error) {
      setSqlResults(prev => ({ 
        ...prev, 
        [fieldIndex]: { 
          valid: false, 
          error: error.message,
          sample_data: [] 
        }
      }))
    } finally {
      setTestingSQL(prev => ({ ...prev, [fieldIndex]: false }))
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(settings)
      onClose()
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderCustomFieldForm = (field, index) => (
    <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Custom Field #{index + 1}
        </h4>
        <button
          onClick={() => removeCustomField(index)}
          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Field Name
          </label>
          <input
            type="text"
            value={field.field_name}
            onChange={(e) => updateCustomField(index, 'field_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="e.g., Department, Region, Account_Link"
          />
        </div>

        {/* Field Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Field Type
          </label>
          <select
            value={field.field_type}
            onChange={(e) => updateCustomField(index, 'field_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {fieldTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Required Checkbox */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={field.is_required}
          onChange={(e) => updateCustomField(index, 'is_required', e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Required Field
        </label>
      </div>

      {/* Static Dropdown Values */}
      {field.field_type === 'dropdown' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Dropdown Options (one per line)
          </label>
          <textarea
            value={field.dropdown_values?.join('\n') || ''}
            onChange={(e) => updateCustomField(index, 'dropdown_values', e.target.value.split('\n').filter(v => v.trim()))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            rows={4}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
        </div>
      )}

      {/* SQL Query for SQL Dropdown */}
      {field.field_type === 'sql_dropdown' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <Database className="h-4 w-4 mr-1" />
            SQL Query (SELECT statement only)
          </label>
          <div className="space-y-2">
            <textarea
              value={field.sql_query || ''}
              onChange={(e) => updateCustomField(index, 'sql_query', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              rows={4}
              placeholder="SELECT account_code FROM accounts WHERE company_id = ':active_company_id'"
            />
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => testSQLQuery(index, field.sql_query)}
                disabled={!field.sql_query?.trim() || testingSQL[index]}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {testingSQL[index] ? (
                  <Loader className="h-3 w-3 animate-spin" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
                <span>Test Query</span>
              </button>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Use :active_company_id as placeholder for current company
              </div>
            </div>
          </div>

          {/* SQL Test Results */}
          {sqlResults[index] && (
            <div className={`p-3 rounded-lg border ${
              sqlResults[index].valid 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {sqlResults[index].valid ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <span className={`text-sm font-medium ${
                  sqlResults[index].valid 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {sqlResults[index].valid ? 'Query Valid' : 'Query Error'}
                </span>
              </div>
              
              {sqlResults[index].valid ? (
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p>✓ {sqlResults[index].column_count} column(s) returned</p>
                  <p>✓ {sqlResults[index].row_count} sample row(s)</p>
                  {sqlResults[index].sample_data.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Sample values:</p>
                      <div className="bg-white dark:bg-gray-800 rounded p-2 mt-1 font-mono text-xs">
                        {sqlResults[index].sample_data.slice(0, 5).map((row, i) => (
                          <div key={i}>{JSON.stringify(row)}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-700 dark:text-red-300">
                  {sqlResults[index].error}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Axes Entity Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Axes Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Axes Type
              </label>
              <select
                value={settings.axes_type}
                onChange={(e) => setSettings(prev => ({ ...prev, axes_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="entity">Entity</option>
                <option value="account">Account</option>
                <option value="time">Time</option>
                <option value="scenario">Scenario</option>
              </select>
            </div>

            {/* Custom Fields Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Custom Fields
                </h3>
                <button
                  onClick={addCustomField}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Field</span>
                </button>
              </div>

              {settings.custom_fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No custom fields defined</p>
                  <p className="text-sm">Add custom fields to extend entity attributes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {settings.custom_fields.map((field, index) => 
                    renderCustomFieldForm(field, index)
                  )}
                </div>
              )}
            </div>

            {/* Linked Axes Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Link className="h-5 w-5 mr-2" />
                Linked Axes
              </h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Link to other axes (comma-separated)
                </label>
                <input
                  type="text"
                  value={settings.linked_axes?.join(', ') || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    linked_axes: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="account, time, scenario"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Link this entity axis to other axes for cross-dimensional relationships
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 Configuration Tips
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Use SQL dropdowns to link entities to accounts or other dimensions</li>
                <li>• Custom fields support validation rules and required constraints</li>
                <li>• SQL queries can reference :active_company_id for multi-tenant support</li>
                <li>• Test SQL queries before saving to ensure they work correctly</li>
              </ul>
            </div>
          </div>
        </div>

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
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AxesSettingsModal
