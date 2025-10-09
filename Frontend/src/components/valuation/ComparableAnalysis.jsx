import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Building2, 
  DollarSign,
  TrendingUp,
  BarChart3,
  FileText,
  Edit
} from 'lucide-react'

const ComparableAnalysis = ({ valuation, onBack }) => {
  const [comparables, setComparables] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    peer_company: '',
    industry: '',
    market_cap: '',
    metric_type: 'P/E',
    metric_value: '',
    revenue: '',
    ebitda: '',
    net_income: '',
    analyst_comments: '',
    weight: 1.0
  })

  useEffect(() => {
    if (valuation) {
      fetchComparables()
    }
  }, [valuation])

  const fetchComparables = async () => {
    if (!valuation?.id) return
    
    try {
      const response = await fetch(`/api/valuation/valuations/${valuation.id}`)
      const data = await response.json()
      if (data.success && data.data.comparables) {
        setComparables(data.data.comparables)
      }
    } catch (error) {
      console.error('Error fetching comparables:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      peer_company: '',
      industry: '',
      market_cap: '',
      metric_type: 'P/E',
      metric_value: '',
      revenue: '',
      ebitda: '',
      net_income: '',
      analyst_comments: '',
      weight: 1.0
    })
    setEditingId(null)
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/valuation/valuations/${valuation.id}/comparables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchComparables()
        resetForm()
        setIsEditing(false)
      } else {
        setErrors({ submit: data.message || 'Failed to save comparable' })
      }
    } catch (error) {
      console.error('Error saving comparable:', error)
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (comparable) => {
    setFormData({
      peer_company: comparable.peer_company || '',
      industry: comparable.industry || '',
      market_cap: comparable.market_cap || '',
      metric_type: comparable.metric_type || 'P/E',
      metric_value: comparable.metric_value || '',
      revenue: comparable.revenue || '',
      ebitda: comparable.ebitda || '',
      net_income: comparable.net_income || '',
      analyst_comments: comparable.analyst_comments || '',
      weight: comparable.weight || 1.0
    })
    setEditingId(comparable.id)
    setIsEditing(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this comparable?')) return
    
    try {
      // Note: You'll need to add a DELETE endpoint to your API
      const response = await fetch(`/api/valuation/comparables/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await fetchComparables()
      }
    } catch (error) {
      console.error('Error deleting comparable:', error)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.peer_company) {
      newErrors.peer_company = 'Peer company is required'
    }
    
    if (!formData.metric_type) {
      newErrors.metric_type = 'Metric type is required'
    }
    
    if (formData.weight && (formData.weight < 0 || formData.weight > 1)) {
      newErrors.weight = 'Weight must be between 0 and 1'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const metricTypes = [
    { value: 'P/E', label: 'Price/Earnings (P/E)' },
    { value: 'EV/EBITDA', label: 'EV/EBITDA' },
    { value: 'EV/Revenue', label: 'EV/Revenue' },
    { value: 'P/B', label: 'Price/Book (P/B)' },
    { value: 'P/S', label: 'Price/Sales (P/S)' },
    { value: 'EV/Assets', label: 'EV/Assets' }
  ]

  const calculateAverageMetric = () => {
    if (comparables.length === 0) return null
    
    const validMetrics = comparables.filter(c => c.metric_value && c.weight)
    if (validMetrics.length === 0) return null
    
    const weightedSum = validMetrics.reduce((sum, c) => sum + (c.metric_value * c.weight), 0)
    const totalWeight = validMetrics.reduce((sum, c) => sum + c.weight, 0)
    
    return totalWeight > 0 ? weightedSum / totalWeight : null
  }

  if (!valuation) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No Valuation Selected
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Please select a valuation to perform comparable analysis.
        </p>
      </div>
    )
  }

  const averageMetric = calculateAverageMetric()

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Comparable Analysis - {valuation.valuation_type} Valuation
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Analyze peer companies and industry multiples
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Comparable
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      resetForm()
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
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
                {editingId ? 'Edit Comparable' : 'Add New Comparable'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
              {/* Company Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peer Company *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="peer_company"
                    value={formData.peer_company}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.peer_company 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                </div>
                {errors.peer_company && (
                  <p className="mt-1 text-sm text-red-600">{errors.peer_company}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  placeholder="e.g., Technology, Healthcare"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Financial Metrics */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Metric Type *
                </label>
                <select
                  name="metric_type"
                  value={formData.metric_type}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.metric_type 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                >
                  {metricTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.metric_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.metric_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Metric Value
                </label>
                <input
                  type="number"
                  name="metric_value"
                  value={formData.metric_value}
                  onChange={handleInputChange}
                  placeholder="e.g., 15.5"
                  step="0.01"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weight
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="1.0"
                  step="0.1"
                  min="0"
                  max="1"
                  className={`block w-full px-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.weight 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Weight between 0 and 1 (higher = more important)
                </p>
              </div>

              {/* Additional Financial Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Market Cap ($M)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="market_cap"
                    value={formData.market_cap}
                    onChange={handleInputChange}
                    placeholder="1000"
                    step="0.01"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Revenue ($M)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="revenue"
                    value={formData.revenue}
                    onChange={handleInputChange}
                    placeholder="500"
                    step="0.01"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  EBITDA ($M)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="ebitda"
                    value={formData.ebitda}
                    onChange={handleInputChange}
                    placeholder="100"
                    step="0.01"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Net Income ($M)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="net_income"
                    value={formData.net_income}
                    onChange={handleInputChange}
                    placeholder="50"
                    step="0.01"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Analyst Comments
                </label>
                <textarea
                  name="analyst_comments"
                  value={formData.analyst_comments}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Add your analysis and observations..."
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
            </form>
          </div>
        </div>

        {/* Results and List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Analysis Summary
              </h3>
            </div>
            
            <div className="px-6 py-6">
              {averageMetric ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Average {formData.metric_type}
                    </h4>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {averageMetric.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                      Companies Analyzed
                    </h4>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {comparables.length}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                      Total Weight
                    </h4>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {comparables.reduce((sum, c) => sum + (c.weight || 0), 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No Analysis Yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Add comparable companies to see analysis summary.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Comparables List */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Comparable Companies ({comparables.length})
              </h3>
            </div>
            
            <div className="px-6 py-6">
              {comparables.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No comparables yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get started by adding your first comparable company.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comparables.map((comparable) => (
                    <div key={comparable.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              {comparable.peer_company}
                            </h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {comparable.metric_type}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Weight: {comparable.weight}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {comparable.industry && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Industry:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{comparable.industry}</span>
                              </div>
                            )}
                            {comparable.metric_value && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">{comparable.metric_type}:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">{comparable.metric_value}</span>
                              </div>
                            )}
                            {comparable.market_cap && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Market Cap:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">${comparable.market_cap}M</span>
                              </div>
                            )}
                            {comparable.revenue && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Revenue:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">${comparable.revenue}M</span>
                              </div>
                            )}
                          </div>
                          
                          {comparable.analyst_comments && (
                            <div className="mt-3">
                              <span className="text-gray-500 dark:text-gray-400">Comments:</span>
                              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                {comparable.analyst_comments}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(comparable)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => handleDelete(comparable.id)}
                            className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
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

export default ComparableAnalysis
