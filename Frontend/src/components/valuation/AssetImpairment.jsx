import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Building2, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit
} from 'lucide-react'

const AssetImpairment = ({ valuation, onBack }) => {
  const [impairmentTests, setImpairmentTests] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    asset_id: '',
    test_date: new Date().toISOString().split('T')[0],
    carrying_amount: '',
    recoverable_amount: '',
    fair_value: '',
    costs_to_sell: '',
    value_in_use: '',
    discount_rate: 0.10,
    notes: '',
    assumptions: ''
  })

  useEffect(() => {
    if (valuation) {
      fetchImpairmentTests()
      fetchAssets()
    }
  }, [valuation])

  const fetchImpairmentTests = async () => {
    if (!valuation?.id) return
    try {
      const response = await fetch(`/api/valuation/valuations/${valuation.id}`)
      const data = await response.json()
      if (data.success && data.data.impairment_tests) {
        setImpairmentTests(data.data.impairment_tests)
      }
    } catch (error) {
      console.error('Error fetching impairment tests:', error)
    }
  }

  const fetchAssets = async () => {
    if (!valuation?.company_id) return
    try {
      const response = await fetch(`/api/assets?company_id=${valuation.company_id}`)
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
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const resetForm = () => {
    setFormData({
      asset_id: '',
      test_date: new Date().toISOString().split('T')[0],
      carrying_amount: '',
      recoverable_amount: '',
      fair_value: '',
      costs_to_sell: '',
      value_in_use: '',
      discount_rate: 0.10,
      notes: '',
      assumptions: ''
    })
    setEditingId(null)
    setErrors({})
  }

  const calculateRecoverableAmount = () => {
    const fairValue = parseFloat(formData.fair_value) || 0
    const costsToSell = parseFloat(formData.costs_to_sell) || 0
    const valueInUse = parseFloat(formData.value_in_use) || 0
    const netFairValue = fairValue - costsToSell
    return Math.max(netFairValue, valueInUse)
  }

  const calculateImpairmentLoss = () => {
    const carryingAmount = parseFloat(formData.carrying_amount) || 0
    const recoverableAmount = calculateRecoverableAmount()
    return Math.max(0, carryingAmount - recoverableAmount)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const recoverableAmount = calculateRecoverableAmount()
      const impairmentLoss = calculateImpairmentLoss()
      
      const submitData = {
        ...formData,
        recoverable_amount: recoverableAmount,
        impairment_loss: impairmentLoss,
        result: impairmentLoss > 0 ? 'impaired' : 'not_impaired'
      }
      
      const response = await fetch(`/api/valuation/valuations/${valuation.id}/impairment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      const data = await response.json()
      if (data.success) {
        await fetchImpairmentTests()
        resetForm()
        setIsEditing(false)
      } else {
        setErrors({ submit: data.message || 'Failed to save impairment test' })
      }
    } catch (error) {
      console.error('Error saving impairment test:', error)
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (test) => {
    setFormData({
      asset_id: test.asset_id || '',
      test_date: test.test_date || new Date().toISOString().split('T')[0],
      carrying_amount: test.carrying_amount || '',
      recoverable_amount: test.recoverable_amount || '',
      fair_value: test.fair_value || '',
      costs_to_sell: test.costs_to_sell || '',
      value_in_use: test.value_in_use || '',
      discount_rate: test.discount_rate || 0.10,
      notes: test.notes || '',
      assumptions: test.assumptions || ''
    })
    setEditingId(test.id)
    setIsEditing(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this impairment test?')) return
    try {
      const response = await fetch(`/api/valuation/impairment/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchImpairmentTests()
      }
    } catch (error) {
      console.error('Error deleting impairment test:', error)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.asset_id) newErrors.asset_id = 'Asset selection is required'
    if (!formData.test_date) newErrors.test_date = 'Test date is required'
    if (!formData.carrying_amount || parseFloat(formData.carrying_amount) <= 0) {
      newErrors.carrying_amount = 'Carrying amount must be positive'
    }
    if (formData.discount_rate && (formData.discount_rate < 0 || formData.discount_rate > 1)) {
      newErrors.discount_rate = 'Discount rate must be between 0 and 1'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId)
    return asset ? asset.asset_name : 'Unknown Asset'
  }

  const getResultIcon = (result) => {
    switch (result) {
      case 'impaired': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'not_impaired': return <CheckCircle className="h-5 w-5 text-green-500" />
      default: return <XCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getResultColor = (result) => {
    switch (result) {
      case 'impaired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'not_impaired': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (!valuation) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No Valuation Selected
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Please select a valuation to perform impairment testing.
        </p>
      </div>
    )
  }

  const recoverableAmount = calculateRecoverableAmount()
  const impairmentLoss = calculateImpairmentLoss()

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={onBack} className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Asset Impairment Testing - {valuation.valuation_type} Valuation
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Test assets for impairment and calculate recoverable amounts
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <Plus className="h-4 w-4 mr-2" />
                  New Impairment Test
                </button>
              )}
              {isEditing && (
                <>
                  <button onClick={() => { setIsEditing(false); resetForm() }} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Saving...' : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingId ? 'Update' : 'Save'}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingId ? 'Edit Impairment Test' : 'New Impairment Test'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
              {/* Asset Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asset *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select name="asset_id" value={formData.asset_id} onChange={handleInputChange} className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.asset_id ? 'border-red-300 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}>
                    <option value="">Select Asset</option>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>{asset.asset_name}</option>
                    ))}
                  </select>
                </div>
                {errors.asset_id && <p className="mt-1 text-sm text-red-600">{errors.asset_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Date *
                </label>
                <input type="date" name="test_date" value={formData.test_date} onChange={handleInputChange} className={`block w-full px-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.test_date ? 'border-red-300 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
                {errors.test_date && <p className="mt-1 text-sm text-red-600">{errors.test_date}</p>}
              </div>

              {/* Carrying Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Carrying Amount ($) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="number" name="carrying_amount" value={formData.carrying_amount} onChange={handleInputChange} placeholder="1000000" step="0.01" min="0" className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.carrying_amount ? 'border-red-300 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
                </div>
                {errors.carrying_amount && <p className="mt-1 text-sm text-red-600">{errors.carrying_amount}</p>}
              </div>

              {/* Fair Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fair Value ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="number" name="fair_value" value={formData.fair_value} onChange={handleInputChange} placeholder="800000" step="0.01" min="0" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>

              {/* Costs to Sell */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Costs to Sell ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="number" name="costs_to_sell" value={formData.costs_to_sell} onChange={handleInputChange} placeholder="50000" step="0.01" min="0" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>

              {/* Value in Use */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Value in Use ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="number" name="value_in_use" value={formData.value_in_use} onChange={handleInputChange} placeholder="750000" step="0.01" min="0" className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>

              {/* Discount Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discount Rate
                </label>
                <input type="number" name="discount_rate" value={formData.discount_rate} onChange={handleInputChange} placeholder="0.10" step="0.001" min="0" max="1" className={`block w-full px-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.discount_rate ? 'border-red-300 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
                {errors.discount_rate && <p className="mt-1 text-sm text-red-600">{errors.discount_rate}</p>}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter as decimal (e.g., 0.10 for 10%)</p>
              </div>

              {/* Assumptions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Assumptions
                </label>
                <textarea name="assumptions" value={formData.assumptions} onChange={handleInputChange} rows={3} placeholder="Document key assumptions for the impairment test..." className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} placeholder="Additional notes and observations..." className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
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
            </form>
          </div>
        </div>

        {/* Results and List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calculation Preview */}
          {isEditing && (formData.carrying_amount || formData.fair_value || formData.value_in_use) && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Calculation Preview
                </h3>
              </div>
              
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Recoverable Amount
                    </h4>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${recoverableAmount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                      Impairment Loss
                    </h4>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ${impairmentLoss.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className={`rounded-lg p-4 ${impairmentLoss > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}>
                    <h4 className={`text-sm font-medium mb-2 ${impairmentLoss > 0 ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'}`}>
                      Result
                    </h4>
                    <div className={`text-2xl font-bold ${impairmentLoss > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {impairmentLoss > 0 ? 'Impaired' : 'Not Impaired'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Impairment Tests List */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Impairment Tests ({impairmentTests.length})
              </h3>
            </div>
            
            <div className="px-6 py-6">
              {impairmentTests.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No impairment tests yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get started by creating your first impairment test.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {impairmentTests.map((test) => (
                    <div key={test.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              {getAssetName(test.asset_id)}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultColor(test.result)}`}>
                              {test.result}
                            </span>
                            <div className="flex items-center">
                              {getResultIcon(test.result)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Test Date:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">
                                {new Date(test.test_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Carrying Amount:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">
                                ${test.carrying_amount?.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Recoverable Amount:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">
                                ${test.recoverable_amount?.toLocaleString()}
                              </span>
                            </div>
                            {test.impairment_loss > 0 && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Impairment Loss:</span>
                                <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                                  ${test.impairment_loss?.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {test.notes && (
                            <div className="mt-3">
                              <span className="text-gray-500 dark:text-gray-400">Notes:</span>
                              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                {test.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button onClick={() => handleEdit(test)} className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </button>
                          
                          <button onClick={() => handleDelete(test.id)} className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssetImpairment
