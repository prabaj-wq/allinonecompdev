import React, { useState, useEffect } from 'react'
import {
  Building2,
  X,
  Save,
  AlertCircle,
  Database,
  FileText,
  Layers,
  DollarSign,
  BarChart3,
  TrendingUp
} from 'lucide-react'

const AxesAccountForm = ({
  account,
  onSave,
  onCancel,
  axesSettings,
  accounts,
  hierarchies,
  companyName
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    account_type: 'Asset',
    hierarchy_id: '',
    statement: 'balance_sheet',
    category: 'asset',
    custom_fields: {}
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [dropdownData, setDropdownData] = useState({})
  const [loadingDropdowns, setLoadingDropdowns] = useState({})

  // Statement options
  const statementOptions = [
    { value: 'balance_sheet', label: 'Balance Sheet' },
    { value: 'cashflow', label: 'Cash Flow' },
    { value: 'profit_and_loss', label: 'Profit and Loss' },
    { value: 'statement_of_changes_in_equity', label: 'Statement of Changes in Equity' }
  ]

  // Category options
  const categoryOptions = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' }
  ]

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        code: account.code || '',
        description: account.description || '',
        account_type: account.account_type || 'Asset',
        hierarchy_id: account.hierarchy_id || '',
        statement: account.statement || 'balance_sheet',
        category: account.category || 'asset',
        custom_fields: account.custom_fields || {}
      })
    }
  }, [account])

  useEffect(() => {
    if (axesSettings?.custom_fields) {
      loadDropdownData()
    }
  }, [axesSettings])

  const loadDropdownData = async () => {
    if (!axesSettings?.custom_fields) return

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
          `/api/axes-account/dropdown-values?field_name=${field.field_name}&sql_query=${encodeURIComponent(field.sql_query)}&company_name=${companyName}`,
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
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldName]: value
      }
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Account code is required'
    }

    // Check for duplicate codes
    const existingAccount = accounts?.find(e => 
      e.code === formData.code && e.id !== account?.id
    )
    if (existingAccount) {
      newErrors.code = 'Account code already exists'
    }

    // Validate custom fields
    if (axesSettings?.custom_fields) {
      Object.entries(axesSettings.custom_fields).forEach(([fieldName, fieldConfig]) => {
        if (fieldConfig.is_required && !formData.custom_fields[fieldName]) {
          newErrors[`custom_${fieldName}`] = `${fieldConfig.label} is required`
        }
      })
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
      const success = await onSave(formData)
      if (success) {
        onCancel() // Close form on success
      }
    } catch (error) {
      console.error('Error saving account:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFieldTypeInfo = (type) => {
    switch (type) {
      case 'text': return { icon: <FileText className="h-4 w-4" />, label: 'Text' }
      case 'textarea': return { icon: <FileText className="h-4 w-4" />, label: 'Long Text' }
      case 'number': return { icon: <TrendingUp className="h-4 w-4" />, label: 'Number' }
      case 'date': return { icon: <BarChart3 className="h-4 w-4" />, label: 'Date' }
      case 'select': return { icon: <Layers className="h-4 w-4" />, label: 'Dropdown' }
      case 'boolean': return { icon: <AlertCircle className="h-4 w-4" />, label: 'Yes/No' }
      case 'sql_query': return { icon: <Database className="h-4 w-4" />, label: 'Database Query' }
      default: return { icon: <FileText className="h-4 w-4" />, label: 'Text' }
    }
  }

  const renderCustomField = (fieldName, field) => {
    const typeInfo = getFieldTypeInfo(field.type)
    const value = formData.custom_fields[fieldName] || ''
    const hasError = errors[`custom_${fieldName}`]

    switch (field.type) {
      case 'text':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                {field.label || fieldName}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-xs text-gray-500 font-normal">
                {typeInfo.label}
              </span>
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder={`Enter ${field.label || fieldName}`}
            />
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                {field.label || fieldName}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-xs text-gray-500 font-normal">
                {typeInfo.label}
              </span>
            </label>
            <textarea
              value={value}
              onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder={`Enter ${field.label || fieldName}`}
            />
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                {field.label || fieldName}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-xs text-gray-500 font-normal">
                {typeInfo.label}
              </span>
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder={`Enter ${field.label || fieldName}`}
            />
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        )

      case 'date':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                {field.label || fieldName}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-xs text-gray-500 font-normal">
                {typeInfo.label}
              </span>
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            />
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                {field.label || fieldName}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-xs text-gray-500 font-normal">
                {typeInfo.label}
              </span>
            </label>
            <select
              value={value}
              onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            >
              <option value="">Select {field.label || fieldName}</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        )

      case 'boolean':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                {field.label || fieldName}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-xs text-gray-500 font-normal">
                {typeInfo.label}
              </span>
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={fieldName}
                  value="true"
                  checked={value === true || value === 'true'}
                  onChange={(e) => handleCustomFieldChange(fieldName, true)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={fieldName}
                  value="false"
                  checked={value === false || value === 'false' || value === ''}
                  onChange={(e) => handleCustomFieldChange(fieldName, false)}
                  className="mr-2"
                />
                No
              </label>
            </div>
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        )

      case 'sql_query':
        return (
          <div key={fieldName} className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                {field.label || fieldName}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-xs text-gray-500 font-normal">
                {typeInfo.label}
              </span>
            </label>
            <select
              value={value}
              onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
              disabled={loadingDropdowns[fieldName]}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            >
              <option value="">
                {loadingDropdowns[fieldName] ? 'Loading...' : `Select ${field.label || fieldName}`}
              </option>
              {dropdownData[fieldName]?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {account ? 'Edit Account' : 'Add New Account'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {account ? 'Update account information' : 'Create a new account in the system'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Code */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Enter account code"
                  />
                  {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
                </div>

                {/* Account Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Enter account name"
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                {/* Account Description */}
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Enter account description"
                  />
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Classification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Statement */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Statement *
                  </label>
                  <select
                    value={formData.statement}
                    onChange={(e) => handleInputChange('statement', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {statementOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Hierarchy */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Hierarchy
                  </label>
                  <select
                    value={formData.hierarchy_id}
                    onChange={(e) => handleInputChange('hierarchy_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select hierarchy</option>
                    {hierarchies?.map(hierarchy => (
                      <option key={hierarchy.id} value={hierarchy.id}>
                        {hierarchy.hierarchy_name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>


            {/* Custom Fields */}
            {axesSettings?.custom_fields && Object.keys(axesSettings.custom_fields).length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Custom Fields
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(axesSettings.custom_fields).map(([fieldName, field]) => 
                    renderCustomField(fieldName, field)
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Saving...' : (account ? 'Update Account' : 'Create Account')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AxesAccountForm
