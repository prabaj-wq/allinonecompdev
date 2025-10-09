import React, { useState, useEffect } from 'react'
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Info,
  Save,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'

const TimeValueOfMoney = ({ industry, level }) => {
  const [calculations, setCalculations] = useState({
    presentValue: {
      futureValue: '',
      interestRate: '',
      periods: '',
      result: null
    },
    futureValue: {
      presentValue: '',
      interestRate: '',
      periods: '',
      result: null
    },
    annuity: {
      payment: '',
      interestRate: '',
      periods: '',
      result: null
    },
    loanPayment: {
      principal: '',
      interestRate: '',
      periods: '',
      result: null
    }
  })

  const [savedCalculations, setSavedCalculations] = useState([])
  const [activeCalculation, setActiveCalculation] = useState('presentValue')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const calculationTypes = [
    { id: 'presentValue', name: 'Present Value', description: 'Calculate current worth of future cash flow' },
    { id: 'futureValue', name: 'Future Value', description: 'Calculate future worth of current investment' },
    { id: 'annuity', name: 'Annuity Value', description: 'Calculate value of regular payments' },
    { id: 'loanPayment', name: 'Loan Payment', description: 'Calculate periodic loan payments' }
  ]

  const industryDefaults = {
    banking: { interestRate: 5.5, periods: 12 },
    manufacturing: { interestRate: 4.2, periods: 24 },
    retail: { interestRate: 6.8, periods: 12 },
    healthcare: { interestRate: 3.9, periods: 36 },
    technology: { interestRate: 7.2, periods: 18 },
    energy: { interestRate: 4.8, periods: 30 },
    real_estate: { interestRate: 5.1, periods: 30 },
    general: { interestRate: 5.0, periods: 12 }
  }

  useEffect(() => {
    // Load saved calculations
    loadSavedCalculations()
    
    // Set industry defaults
    const defaults = industryDefaults[industry] || industryDefaults.general
    setCalculations(prev => ({
      ...prev,
      presentValue: { ...prev.presentValue, interestRate: defaults.interestRate, periods: defaults.periods },
      futureValue: { ...prev.futureValue, interestRate: defaults.interestRate, periods: defaults.periods },
      annuity: { ...prev.annuity, interestRate: defaults.interestRate, periods: defaults.periods },
      loanPayment: { ...prev.loanPayment, interestRate: defaults.interestRate, periods: defaults.periods }
    }))
  }, [industry])

  const loadSavedCalculations = () => {
    try {
      const saved = localStorage.getItem('tvmCalculations')
      if (saved) {
        setSavedCalculations(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved calculations:', error)
    }
  }

  const saveCalculation = () => {
    const currentCalc = calculations[activeCalculation]
    if (!currentCalc.result) return

    const newCalculation = {
      id: Date.now(),
      type: activeCalculation,
      inputs: { ...currentCalc },
      result: currentCalc.result,
      timestamp: new Date().toISOString(),
      industry
    }

    const updated = [...savedCalculations, newCalculation]
    setSavedCalculations(updated)
    localStorage.setItem('tvmCalculations', JSON.stringify(updated))
  }

  const calculatePresentValue = () => {
    const { futureValue, interestRate, periods } = calculations.presentValue
    if (!futureValue || !interestRate || !periods) return

    const fv = parseFloat(futureValue)
    const rate = parseFloat(interestRate) / 100
    const n = parseFloat(periods)

    const pv = fv / Math.pow(1 + rate, n)
    
    setCalculations(prev => ({
      ...prev,
      presentValue: { ...prev.presentValue, result: pv }
    }))
  }

  const calculateFutureValue = () => {
    const { presentValue, interestRate, periods } = calculations.futureValue
    if (!presentValue || !interestRate || !periods) return

    const pv = parseFloat(presentValue)
    const rate = parseFloat(interestRate) / 100
    const n = parseFloat(periods)

    const fv = pv * Math.pow(1 + rate, n)
    
    setCalculations(prev => ({
      ...prev,
      futureValue: { ...prev.futureValue, result: fv }
    }))
  }

  const calculateAnnuity = () => {
    const { payment, interestRate, periods } = calculations.annuity
    if (!payment || !interestRate || !periods) return

    const pmt = parseFloat(payment)
    const rate = parseFloat(interestRate) / 100
    const n = parseFloat(periods)

    const pv = pmt * ((1 - Math.pow(1 + rate, -n)) / rate)
    
    setCalculations(prev => ({
      ...prev,
      annuity: { ...prev.annuity, result: pv }
    }))
  }

  const calculateLoanPayment = () => {
    const { principal, interestRate, periods } = calculations.loanPayment
    if (!principal || !interestRate || !periods) return

    const pv = parseFloat(principal)
    const rate = parseFloat(interestRate) / 100
    const n = parseFloat(periods)

    const pmt = pv * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1)
    
    setCalculations(prev => ({
      ...prev,
      loanPayment: { ...prev.loanPayment, result: pmt }
    }))
  }

  const handleInputChange = (calculationType, field, value) => {
    setCalculations(prev => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        [field]: value,
        result: null // Clear result when inputs change
      }
    }))
  }

  const runCalculation = () => {
    switch (activeCalculation) {
      case 'presentValue':
        calculatePresentValue()
        break
      case 'futureValue':
        calculateFutureValue()
        break
      case 'annuity':
        calculateAnnuity()
        break
      case 'loanPayment':
        calculateLoanPayment()
        break
      default:
        break
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const renderCalculationForm = () => {
    const currentCalc = calculations[activeCalculation]
    const calcType = calculationTypes.find(ct => ct.id === activeCalculation)

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calculator className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {calcType.name}
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {calcType.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCalculation === 'presentValue' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Future Value ($)
                  </label>
                  <input
                    type="number"
                    value={currentCalc.futureValue}
                    onChange={(e) => handleInputChange('presentValue', 'futureValue', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter future value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentCalc.interestRate}
                    onChange={(e) => handleInputChange('presentValue', 'interestRate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter interest rate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Number of Periods
                  </label>
                  <input
                    type="number"
                    value={currentCalc.periods}
                    onChange={(e) => handleInputChange('presentValue', 'periods', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of periods"
                  />
                </div>
              </>
            )}

            {activeCalculation === 'futureValue' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Present Value ($)
                  </label>
                  <input
                    type="number"
                    value={currentCalc.presentValue}
                    onChange={(e) => handleInputChange('futureValue', 'presentValue', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter present value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentCalc.interestRate}
                    onChange={(e) => handleInputChange('futureValue', 'interestRate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter interest rate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Number of Periods
                  </label>
                  <input
                    type="number"
                    value={currentCalc.periods}
                    onChange={(e) => handleInputChange('futureValue', 'periods', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of periods"
                  />
                </div>
              </>
            )}

            {activeCalculation === 'annuity' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Payment Amount ($)
                  </label>
                  <input
                    type="number"
                    value={currentCalc.payment}
                    onChange={(e) => handleInputChange('annuity', 'payment', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter payment amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentCalc.interestRate}
                    onChange={(e) => handleInputChange('annuity', 'interestRate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter interest rate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Number of Periods
                  </label>
                  <input
                    type="number"
                    value={currentCalc.periods}
                    onChange={(e) => handleInputChange('annuity', 'periods', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of periods"
                  />
                </div>
              </>
            )}

            {activeCalculation === 'loanPayment' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Principal Amount ($)
                  </label>
                  <input
                    type="number"
                    value={currentCalc.principal}
                    onChange={(e) => handleInputChange('loanPayment', 'principal', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter principal amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentCalc.interestRate}
                    onChange={(e) => handleInputChange('loanPayment', 'interestRate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter interest rate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Number of Periods
                  </label>
                  <input
                    type="number"
                    value={currentCalc.periods}
                    onChange={(e) => handleInputChange('loanPayment', 'periods', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of periods"
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={runCalculation}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Calculate</span>
            </button>
            
            {currentCalc.result && (
              <button
                onClick={saveCalculation}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Result</span>
              </button>
            )}
          </div>

          {currentCalc.result && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  Calculation Result
                </h4>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(currentCalc.result)}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Time Value of Money
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Calculate present value, future value, annuities, and loan payments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Industry: {industry}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Level: {level}
          </span>
        </div>
      </div>

      {/* Calculation Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {calculationTypes.map((calcType) => (
          <button
            key={calcType.id}
            onClick={() => setActiveCalculation(calcType.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeCalculation === calcType.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              {calcType.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {calcType.description}
            </p>
          </button>
        ))}
      </div>

      {/* Calculation Form */}
      {renderCalculationForm()}

      {/* Saved Calculations */}
      {savedCalculations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Saved Calculations
          </h3>
          <div className="space-y-3">
            {savedCalculations.slice(-5).map((calc) => (
              <div key={calc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {calculationTypes.find(ct => ct.id === calc.type)?.name}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    - {formatCurrency(calc.result)}
                  </span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(calc.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeValueOfMoney
