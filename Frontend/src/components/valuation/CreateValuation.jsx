import React, { useState, useEffect } from 'react'
import { 
  Save, 
  X, 
  Building2, 
  Calendar, 
  User, 
  FileText,
  DollarSign,
  Globe
} from 'lucide-react'

const CreateValuation = ({ onCreated, companyId }) => {
  const [formData, setFormData] = useState({
    company_id: companyId,
    entity_id: '',
    asset_id: '',
    valuation_type: 'DCF',
    valuation_date: new Date().toISOString().split('T')[0],
    analyst: '',
    method: '',
    summary: '',
    base_value: '',
    currency: 'USD'
  })
  
  const [entities, setEntities] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (companyId) {
      fetchEntities()
      fetchAssets()
    }
  }, [companyId])

  const fetchEntities = async () => {
    try {
      const response = await fetch(`/api/entities?company_id=${companyId}`)
      const data = await response.json()
      if (data.success) {
        setEntities(data.data)
      }
    } catch (error) {
      console.error('Error fetching entities:', error)
    }
  }

  const fetchAssets = async () => {
    try {
      const response = await fetch(`/api/assets?company_id=${companyId}`)
      const data = await response.json()
      if (data.success) {
        setAssets(data.data)
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.valuation_type) {
      newErrors.valuation_type = 'Valuation type is required'
    }
    
    if (!formData.valuation_date) {
      newErrors.valuation_date = 'Valuation date is required'
    }
    
    if (!formData.analyst) {
      newErrors.analyst = 'Analyst is required'
    }
    
    if (!formData.method) {
      newErrors.method = 'Method is required'
    }
    
    if (formData.base_value && isNaN(formData.base_value)) {
      newErrors.base_value = 'Base value must be a valid number'
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
      const response = await fetch('/api/valuation/valuations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        onCreated(data.data)
        // Reset form
        setFormData({
          company_id: companyId,
          entity_id: '',
          asset_id: '',
          valuation_type: 'DCF',
          valuation_date: new Date().toISOString().split('T')[0],
          analyst: '',
          method: '',
          summary: '',
          base_value: '',
          currency: 'USD'
        })
        setErrors({})
      } else {
        setErrors({ submit: data.message || 'Failed to create valuation' })
      }
    } catch (error) {
      console.error('Error creating valuation:', error)
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const valuationTypes = [
    { value: 'DCF', label: 'Discounted Cash Flow' },
    { value: 'Comparables', label: 'Comparable Company Analysis' },
    { value: 'Transaction', label: 'Transaction Multiples' },
    { value: 'Asset-based', label: 'Asset-based Valuation' }
  ]

  const currencies = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'JPY', label: 'Japanese Yen (JPY)' },
    { value: 'CAD', label: 'Canadian Dollar (CAD)' },
    { value: 'AUD', label: 'Australian Dollar (AUD)' }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Create New Valuation
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Set up a new business valuation with comprehensive details
              </p>
            </div>
            <button
              onClick={() => onCreated(null)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valuation Type *
                </label>
                <select
                  name="valuation_type"
                  value={formData.valuation_type}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.valuation_type 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                >
                  {valuationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.valuation_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.valuation_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valuation Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="valuation_date"
                    value={formData.valuation_date}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.valuation_date 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                </div>
                {errors.valuation_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.valuation_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Analyst *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="analyst"
                    value={formData.analyst}
                    onChange={handleInputChange}
                    placeholder="Enter analyst name"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.analyst 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                </div>
                {errors.analyst && (
                  <p className="mt-1 text-sm text-red-600">{errors.analyst}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Method *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="method"
                    value={formData.method}
                    onChange={handleInputChange}
                    placeholder="e.g., Gordon Growth, Multiples"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.method 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                </div>
                {errors.method && (
                  <p className="mt-1 text-sm text-red-600">{errors.method}</p>
                )}
              </div>
            </div>
          </div>

          {/* Entity and Asset Selection */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Entity & Asset Selection
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entity (Optional)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    name="entity_id"
                    value={formData.entity_id}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Entity</option>
                    {entities.map(entity => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asset (Optional)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    name="asset_id"
                    value={formData.asset_id}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Asset</option>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.asset_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Financial Information
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base Value (Optional)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="base_value"
                    value={formData.base_value}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.base_value 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                </div>
                {errors.base_value && (
                  <p className="mt-1 text-sm text-red-600">{errors.base_value}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {currencies.map(currency => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Summary (Optional)
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              rows={4}
              placeholder="Provide a brief summary of the valuation approach and key assumptions..."
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {errors.submit}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => onCreated(null)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Valuation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateValuation
