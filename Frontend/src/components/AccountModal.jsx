import React, { useState, useEffect } from 'react'
import { X, Save, BookOpen, DollarSign, FileText, Layers } from 'lucide-react'

const AccountModal = ({ 
  isVisible, 
  onClose, 
  onSave, 
  account = null, 
  hierarchies = [] 
}) => {
  const [formData, setFormData] = useState({
    account_name: '',
    account_code: '',
    account_type: 'Asset',
    ifrs_category: '',
    statement: '',
    description: '',
    currency: 'USD',
    hierarchy_id: null,
    balance: 0,
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (account) {
      setFormData({
        account_name: account.name || account.account_name || '',
        account_code: account.code || account.account_code || '',
        account_type: account.type || account.account_type || 'Asset',
        ifrs_category: account.ifrs_category || '',
        statement: account.statement || '',
        description: account.description || '',
        currency: account.currency || 'USD',
        hierarchy_id: account.hierarchy_id || null,
        balance: account.balance || 0,
        is_active: account.status === 'Active'
      })
    } else {
      setFormData({
        account_name: '',
        account_code: '',
        account_type: 'Asset',
        ifrs_category: '',
        statement: '',
        description: '',
        currency: 'USD',
        hierarchy_id: null,
        balance: 0,
        is_active: true
      })
    }
    setErrors({})
  }, [account, isVisible])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Account name is required'
    }
    
    if (!formData.account_code.trim()) {
      newErrors.account_code = 'Account code is required'
    }
    
    if (!formData.account_type) {
      newErrors.account_type = 'Account type is required'
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
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving account:', error)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {account ? 'Edit Account' : 'Add New Account'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {account ? 'Update account information' : 'Create a new account entry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Code *
              </label>
              <input
                type="text"
                value={formData.account_code}
                onChange={(e) => handleInputChange('account_code', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.account_code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 1000"
              />
              {errors.account_code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.account_code}</p>
              )}
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Name *
              </label>
              <input
                type="text"
                value={formData.account_name}
                onChange={(e) => handleInputChange('account_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.account_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Cash and Cash Equivalents"
              />
              {errors.account_name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.account_name}</p>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Category *
              </label>
              <select
                value={formData.account_type}
                onChange={(e) => handleInputChange('account_type', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.account_type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Category</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
              {errors.account_type && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.account_type}</p>
              )}
            </div>

            {/* Statement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statement
              </label>
              <select
                value={formData.statement}
                onChange={(e) => handleInputChange('statement', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Statement</option>
                <option value="Balance Sheet">Balance Sheet</option>
                <option value="Profit and Loss">Profit and Loss</option>
                <option value="Cash Flow">Cash Flow</option>
              </select>
            </div>

            {/* IFRS Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                IFRS Category
              </label>
              <input
                type="text"
                value={formData.ifrs_category}
                onChange={(e) => handleInputChange('ifrs_category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., Current Assets"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>

            {/* Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.00"
              />
            </div>

            {/* Hierarchy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hierarchy
              </label>
              <select
                value={formData.hierarchy_id || ''}
                onChange={(e) => handleInputChange('hierarchy_id', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">No Hierarchy</option>
                {hierarchies.map(hierarchy => (
                  <option key={hierarchy.id} value={hierarchy.id}>
                    {hierarchy.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Account description..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {account ? 'Update Account' : 'Add Account'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AccountModal

