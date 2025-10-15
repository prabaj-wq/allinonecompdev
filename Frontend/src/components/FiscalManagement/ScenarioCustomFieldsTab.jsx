import React, { useState, useEffect } from 'react'
import { useCompany } from '../../contexts/CompanyContext'
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  List,
  MoreVertical,
  Save,
  X
} from 'lucide-react'

const ScenarioCustomFieldsTab = ({ scenario }) => {
  const { selectedCompany } = useCompany()
  const [customFields, setCustomFields] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingField, setEditingField] = useState(null)

  // Fetch custom fields for this scenario
  const fetchCustomFields = async () => {
    if (!selectedCompany || !scenario) return

    setLoading(true)
    try {
      const response = await fetch(`/api/fiscal-management/scenarios/${scenario.id}/custom-fields`, {
        headers: {
          'X-Company-Database': selectedCompany
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCustomFields(data.custom_fields || [])
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomFields()
  }, [selectedCompany, scenario])

  const getFieldTypeIcon = (type) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4 text-blue-500" />
      case 'number': return <Hash className="h-4 w-4 text-green-500" />
      case 'date': return <Calendar className="h-4 w-4 text-purple-500" />
      case 'boolean': return <CheckSquare className="h-4 w-4 text-orange-500" />
      case 'dropdown': return <List className="h-4 w-4 text-red-500" />
      default: return <Settings className="h-4 w-4 text-gray-500" />
    }
  }

  const AddFieldModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: [],
      validation: {},
      default_value: '',
      description: ''
    })

    const handleSubmit = async (e) => {
      e.preventDefault()

      try {
        const response = await fetch(`/api/fiscal-management/scenarios/${scenario.id}/custom-fields`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Database': selectedCompany
          },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          setShowAddModal(false)
          setFormData({
            name: '',
            label: '',
            type: 'text',
            required: false,
            options: [],
            validation: {},
            default_value: '',
            description: ''
          })
          fetchCustomFields()
          window.showToast?.('Custom field added successfully!', 'success')
        } else {
          const error = await response.json()
          window.showToast?.(error.error || 'Failed to add custom field', 'error')
        }
      } catch (error) {
        console.error('Error adding custom field:', error)
        window.showToast?.('Failed to add custom field', 'error')
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Custom Field</h2>
            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., assumption_version"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Label *
                </label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({...formData, label: e.target.value})}
                  placeholder="e.g., Assumption Version"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean (Checkbox)</option>
                  <option value="dropdown">Dropdown</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Value
                </label>
                <input
                  type={formData.type === 'number' ? 'number' : formData.type === 'date' ? 'date' : 'text'}
                  value={formData.default_value}
                  onChange={(e) => setFormData({...formData, default_value: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {formData.type === 'dropdown' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dropdown Options (one per line)
                </label>
                <textarea
                  rows={3}
                  value={formData.options.join('\n')}
                  onChange={(e) => setFormData({...formData, options: e.target.value.split('\n').filter(opt => opt.trim())})}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Optional description for this field..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.required}
                  onChange={(e) => setFormData({...formData, required: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Required Field</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add Field
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const deleteField = async (fieldId) => {
    if (!confirm('Are you sure you want to delete this custom field?')) return

    try {
      const response = await fetch(`/api/fiscal-management/scenarios/${scenario.id}/custom-fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          'X-Company-Database': selectedCompany
        }
      })

      if (response.ok) {
        fetchCustomFields()
        window.showToast?.('Custom field deleted successfully!', 'success')
      } else {
        const error = await response.json()
        window.showToast?.(error.error || 'Failed to delete custom field', 'error')
      }
    } catch (error) {
      console.error('Error deleting custom field:', error)
      window.showToast?.('Failed to delete custom field', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Scenario Fields</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Customize this scenario with additional metadata fields
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Field</span>
        </button>
      </div>

      {/* Custom Fields List */}
      {customFields.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Custom Fields
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Add custom fields to extend scenario functionality with your own metadata.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Custom Field</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Default Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {customFields.map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {field.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {field.name}
                        </div>
                        {field.description && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {field.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getFieldTypeIcon(field.type)}
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {field.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {field.required ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {field.default_value || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingField(field)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteField(field.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {showAddModal && <AddFieldModal />}
    </div>
  )
}

export default ScenarioCustomFieldsTab
