import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Save, 
  Calculator, 
  TrendingUp, 
  DollarSign,
  Percent,
  BarChart3,
  FileText
} from 'lucide-react'

const DCFModel = ({ valuation, onBack }) => {
  const [formData, setFormData] = useState({
    cash_flows: [1000000, 1100000, 1210000, 1331000, 1464100],
    discount_rate: 0.12,
    risk_free_rate: 0.03,
    equity_risk_premium: 0.06,
    beta: 1.5,
    terminal_growth_rate: 0.02,
    assumptions: '',
    notes: ''
  })
  
  const [dcfResult, setDcfResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (valuation) {
      // Load existing DCF data if available
      fetchDCFData()
    }
  }, [valuation])

  const fetchDCFData = async () => {
    if (!valuation?.id) return
    
    try {
      const response = await fetch(`/api/valuation/valuations/${valuation.id}`)
      const data = await response.json()
      if (data.success && data.data.dcf_details) {
        const dcf = data.data.dcf_details
        setFormData({
          cash_flows: dcf.cash_flows || [1000000, 1100000, 1210000, 1331000, 1464100],
          discount_rate: dcf.discount_rate || 0.12,
          risk_free_rate: dcf.risk_free_rate || 0.03,
          equity_risk_premium: dcf.equity_risk_premium || 0.06,
          beta: dcf.beta || 1.5,
          terminal_growth_rate: dcf.terminal_growth_rate || 0.02,
          assumptions: dcf.assumptions || '',
          notes: dcf.notes || ''
        })
        setDcfResult({
          present_value_cash_flows: dcf.present_value_cash_flows,
          present_value_terminal: dcf.present_value_terminal,
          terminal_value: dcf.terminal_value,
          total_enterprise_value: dcf.total_enterprise_value
        })
      }
    } catch (error) {
      console.error('Error fetching DCF data:', error)
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

  const handleCashFlowChange = (index, value) => {
    const newCashFlows = [...formData.cash_flows]
    newCashFlows[index] = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      cash_flows: newCashFlows
    }))
  }

  const addCashFlowYear = () => {
    const lastCashFlow = formData.cash_flows[formData.cash_flows.length - 1] || 0
    const newCashFlow = lastCashFlow * 1.1 // 10% growth assumption
    setFormData(prev => ({
      ...prev,
      cash_flows: [...prev.cash_flows, newCashFlow]
    }))
  }

  const removeCashFlowYear = (index) => {
    if (formData.cash_flows.length > 1) {
      setFormData(prev => ({
        ...prev,
        cash_flows: prev.cash_flows.filter((_, i) => i !== index)
      }))
    }
  }

  const calculateDCF = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/valuation/dcf/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cash_flows: formData.cash_flows,
          discount_rate: formData.discount_rate,
          terminal_growth_rate: formData.terminal_growth_rate
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setDcfResult(data.data)
      } else {
        setErrors({ calculation: data.message || 'Failed to calculate DCF' })
      }
    } catch (error) {
      console.error('Error calculating DCF:', error)
      setErrors({ calculation: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const saveDCF = async () => {
    if (!valuation?.id) return
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/valuation/valuations/${valuation.id}/dcf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsEditing(false)
        setDcfResult(data.data)
        setErrors({})
      } else {
        setErrors({ submit: data.message || 'Failed to save DCF' })
      }
    } catch (error) {
      console.error('Error saving DCF:', error)
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (formData.cash_flows.some(cf => cf <= 0)) {
      newErrors.cash_flows = 'All cash flows must be positive'
    }
    
    if (formData.discount_rate <= 0) {
      newErrors.discount_rate = 'Discount rate must be positive'
    }
    
    if (formData.terminal_growth_rate >= formData.discount_rate) {
      newErrors.terminal_growth_rate = 'Terminal growth rate must be less than discount rate'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCalculate = () => {
    if (validateForm()) {
      calculateDCF()
    }
  }

  if (!valuation) {
    return (
      <div className="text-center py-12">
        <Calculator className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No Valuation Selected
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Please select a valuation to perform DCF analysis.
        </p>
      </div>
    )
  }

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
                  DCF Analysis - {valuation.valuation_type} Valuation
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Discounted Cash Flow valuation model
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveDCF}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              DCF Inputs
            </h3>
          </div>
          
          <div className="px-6 py-6 space-y-6">
            {/* Cash Flows */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Projected Cash Flows
              </label>
              <div className="space-y-3">
                {formData.cash_flows.map((cf, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-16">
                      Year {index + 1}
                    </span>
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={cf}
                        onChange={(e) => handleCashFlowChange(index, e.target.value)}
                        disabled={!isEditing}
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.cash_flows 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600`}
                      />
                    </div>
                    {isEditing && formData.cash_flows.length > 1 && (
                      <button
                        onClick={() => removeCashFlowYear(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={addCashFlowYear}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
                  >
                    + Add Year
                  </button>
                )}
              </div>
              {errors.cash_flows && (
                <p className="mt-1 text-sm text-red-600">{errors.cash_flows}</p>
              )}
            </div>

            {/* Discount Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Rate (WACC) *
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="discount_rate"
                  value={formData.discount_rate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  step="0.001"
                  min="0"
                  max="1"
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.discount_rate 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600`}
                />
              </div>
              {errors.discount_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.discount_rate}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter as decimal (e.g., 0.12 for 12%)
              </p>
            </div>

            {/* Terminal Growth Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Terminal Growth Rate
              </label>
              <div className="relative">
                <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="terminal_growth_rate"
                  value={formData.terminal_growth_rate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  step="0.001"
                  min="0"
                  max="0.1"
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.terminal_growth_rate 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600`}
                />
              </div>
              {errors.terminal_growth_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.terminal_growth_rate}</p>
              )}
            </div>

            {/* Calculate Button */}
            {isEditing && (
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate DCF
                  </>
                )}
              </button>
            )}

            {/* Assumptions and Notes */}
            {isEditing && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Key Assumptions
                  </label>
                  <textarea
                    name="assumptions"
                    value={formData.assumptions}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Document key assumptions for the DCF model..."
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Additional notes and observations..."
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              DCF Results
            </h3>
          </div>
          
          <div className="px-6 py-6">
            {dcfResult ? (
              <div className="space-y-6">
                {/* Summary Results */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    Enterprise Value
                  </h4>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ${dcfResult.total_enterprise_value?.toLocaleString() || '0'}
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Present Value of Cash Flows:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${dcfResult.present_value_cash_flows?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Terminal Value:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${dcfResult.terminal_value?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Present Value of Terminal:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${dcfResult.present_value_terminal?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 dark:border-gray-600">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Enterprise Value:</span>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      ${dcfResult.total_enterprise_value?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>

                {/* Sensitivity Analysis Placeholder */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Sensitivity Analysis
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sensitivity analysis chart will be displayed here showing how the valuation changes with different discount rates and growth assumptions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No DCF Results
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isEditing 
                    ? 'Click "Calculate DCF" to see results'
                    : 'DCF analysis has not been performed yet'
                  }
                </p>
              </div>
            )}

            {/* Calculation Error */}
            {errors.calculation && (
              <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      {errors.calculation}
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DCFModel
