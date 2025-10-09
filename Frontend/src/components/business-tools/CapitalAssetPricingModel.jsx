import React, { useState, useEffect } from 'react'
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  LineChart,
  DollarSign,
  Percent,
  Save,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  Brain,
  Calculator,
  PieChart,
  Info,
  Filter,
  Search,
  Activity,
  Shield
} from 'lucide-react'

const CapitalAssetPricingModel = ({ industry, level }) => {
  const [capmData, setCapmData] = useState({
    riskFreeRate: 3.5,
    marketReturn: 8.0,
    beta: 1.0,
    stockPrice: 100,
    expectedReturn: 8.0,
    marketRiskPremium: 4.5
  })

  const [analysisResults, setAnalysisResults] = useState({
    capmExpectedReturn: null,
    alpha: null,
    requiredReturn: null,
    riskAssessment: null,
    recommendations: []
  })

  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [activeAnalysis, setActiveAnalysis] = useState('basic')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const analysisTypes = [
    { id: 'basic', name: 'Basic CAPM', description: 'Standard CAPM calculation' },
    { id: 'advanced', name: 'Advanced CAPM', description: 'Multi-factor CAPM analysis' },
    { id: 'portfolio', name: 'Portfolio CAPM', description: 'Portfolio-level CAPM analysis' },
    { id: 'sensitivity', name: 'Sensitivity Analysis', description: 'Beta sensitivity analysis' }
  ]

  const betaRanges = [
    { range: '0.0 - 0.5', description: 'Very Low Risk', interpretation: 'Less volatile than market' },
    { range: '0.5 - 0.8', description: 'Low Risk', interpretation: 'Moderately less volatile than market' },
    { range: '0.8 - 1.2', description: 'Market Risk', interpretation: 'Similar volatility to market' },
    { range: '1.2 - 1.5', description: 'High Risk', interpretation: 'More volatile than market' },
    { range: '1.5+', description: 'Very High Risk', interpretation: 'Significantly more volatile than market' }
  ]

  const industryDefaults = {
    banking: { riskFreeRate: 3.5, marketReturn: 8.2, beta: 1.1, marketRiskPremium: 4.7 },
    manufacturing: { riskFreeRate: 3.5, marketReturn: 7.8, beta: 0.9, marketRiskPremium: 4.3 },
    retail: { riskFreeRate: 3.5, marketReturn: 9.1, beta: 1.3, marketRiskPremium: 5.6 },
    healthcare: { riskFreeRate: 3.5, marketReturn: 6.9, beta: 0.7, marketRiskPremium: 3.4 },
    technology: { riskFreeRate: 3.5, marketReturn: 11.4, beta: 1.4, marketRiskPremium: 7.9 },
    energy: { riskFreeRate: 3.5, marketReturn: 7.2, beta: 1.0, marketRiskPremium: 3.7 },
    real_estate: { riskFreeRate: 3.5, marketReturn: 6.5, beta: 0.8, marketRiskPremium: 3.0 },
    general: { riskFreeRate: 3.5, marketReturn: 8.0, beta: 1.0, marketRiskPremium: 4.5 }
  }

  useEffect(() => {
    loadSavedAnalyses()
    
    // Set industry defaults
    const defaults = industryDefaults[industry] || industryDefaults.general
    setCapmData(prev => ({
      ...prev,
      riskFreeRate: defaults.riskFreeRate,
      marketReturn: defaults.marketReturn,
      beta: defaults.beta,
      marketRiskPremium: defaults.marketRiskPremium
    }))
  }, [industry])

  const loadSavedAnalyses = () => {
    try {
      const saved = localStorage.getItem('capmAnalyses')
      if (saved) {
        setSavedAnalyses(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved analyses:', error)
    }
  }

  const saveAnalysis = () => {
    if (!analysisResults.capmExpectedReturn) return

    const newAnalysis = {
      id: Date.now(),
      capmData: { ...capmData },
      results: { ...analysisResults },
      timestamp: new Date().toISOString(),
      industry
    }

    const updated = [...savedAnalyses, newAnalysis]
    setSavedAnalyses(updated)
    localStorage.setItem('capmAnalyses', JSON.stringify(updated))
  }

  const calculateCAPM = () => {
    const { riskFreeRate, marketReturn, beta, expectedReturn } = capmData
    
    if (!riskFreeRate || !marketReturn || !beta) return

    const riskFreeRateNum = parseFloat(riskFreeRate) / 100
    const marketReturnNum = parseFloat(marketReturn) / 100
    const betaNum = parseFloat(beta)
    const expectedReturnNum = parseFloat(expectedReturn) / 100

    // CAPM Formula: E(R) = Rf + β(Rm - Rf)
    const capmExpectedReturn = riskFreeRateNum + betaNum * (marketReturnNum - riskFreeRateNum)
    
    // Calculate alpha (excess return)
    const alpha = expectedReturnNum - capmExpectedReturn
    
    // Calculate required return (minimum return needed)
    const requiredReturn = capmExpectedReturn
    
    // Risk assessment based on beta
    let riskAssessment = 'Market Risk'
    if (betaNum < 0.5) riskAssessment = 'Very Low Risk'
    else if (betaNum < 0.8) riskAssessment = 'Low Risk'
    else if (betaNum < 1.2) riskAssessment = 'Market Risk'
    else if (betaNum < 1.5) riskAssessment = 'High Risk'
    else riskAssessment = 'Very High Risk'

    // Generate recommendations
    const recommendations = []
    if (alpha > 0.02) {
      recommendations.push('Stock appears undervalued - consider buying')
    } else if (alpha < -0.02) {
      recommendations.push('Stock appears overvalued - consider selling')
    } else {
      recommendations.push('Stock appears fairly valued')
    }

    if (betaNum > 1.5) {
      recommendations.push('High beta stock - expect high volatility')
    } else if (betaNum < 0.5) {
      recommendations.push('Low beta stock - expect low volatility')
    }

    if (capmExpectedReturn > marketReturnNum) {
      recommendations.push('Expected return exceeds market return')
    } else {
      recommendations.push('Expected return below market return')
    }

    setAnalysisResults({
      capmExpectedReturn: capmExpectedReturn * 100,
      alpha: alpha * 100,
      requiredReturn: requiredReturn * 100,
      riskAssessment,
      recommendations
    })
  }

  const handleInputChange = (field, value) => {
    setCapmData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const renderBasicCAPM = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              CAPM Analysis
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Calculate expected return using the Capital Asset Pricing Model
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Risk-Free Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={capmData.riskFreeRate}
                onChange={(e) => handleInputChange('riskFreeRate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter risk-free rate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Market Return (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={capmData.marketReturn}
                onChange={(e) => handleInputChange('marketReturn', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter market return"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Beta
              </label>
              <input
                type="number"
                step="0.01"
                value={capmData.beta}
                onChange={(e) => handleInputChange('beta', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter beta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Expected Return (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={capmData.expectedReturn}
                onChange={(e) => handleInputChange('expectedReturn', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter expected return"
              />
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={calculateCAPM}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Calculate CAPM</span>
            </button>
            
            {analysisResults.capmExpectedReturn && (
              <button
                onClick={saveAnalysis}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Analysis</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderResults = () => {
    if (!analysisResults.capmExpectedReturn) return null

    const betaNum = parseFloat(capmData.beta)
    const riskColor = betaNum < 0.8 ? 'green' : betaNum < 1.2 ? 'blue' : betaNum < 1.5 ? 'yellow' : 'red'

    return (
      <div className="space-y-6">
        {/* CAPM Results */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              CAPM Analysis Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {analysisResults.capmExpectedReturn.toFixed(2)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                CAPM Expected Return
              </p>
            </div>

            <div className="text-center">
              <div className={`text-3xl font-bold ${
                analysisResults.alpha > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analysisResults.alpha > 0 ? '+' : ''}{analysisResults.alpha.toFixed(2)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Alpha (Excess Return)
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analysisResults.requiredReturn.toFixed(2)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Required Return
              </p>
            </div>

            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                riskColor === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                riskColor === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                riskColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {analysisResults.riskAssessment}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Risk Assessment
              </p>
            </div>
          </div>
        </div>

        {/* Beta Interpretation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Beta Interpretation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {betaRanges.map((range, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${
                betaNum >= parseFloat(range.range.split(' - ')[0]) && 
                betaNum <= parseFloat(range.range.split(' - ')[1].replace('+', '')) || 
                (range.range.includes('+') && betaNum >= parseFloat(range.range.split(' - ')[0]))
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {range.range}
                </h4>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {range.description}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {range.interpretation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {analysisResults.recommendations.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span>Investment Recommendations</span>
            </h3>
            <ul className="space-y-2">
              {analysisResults.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-600 dark:text-slate-400">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CAPM Formula Explanation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            CAPM Formula
          </h3>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                E(R) = Rf + β(Rm - Rf)
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <p><strong>E(R)</strong> = Expected return on the asset</p>
                <p><strong>Rf</strong> = Risk-free rate</p>
                <p><strong>β</strong> = Beta (systematic risk)</p>
                <p><strong>Rm</strong> = Expected market return</p>
                <p><strong>(Rm - Rf)</strong> = Market risk premium</p>
              </div>
            </div>
          </div>
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
            Capital Asset Pricing Model
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Calculate expected returns and assess risk using CAPM
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

      {/* Analysis Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {analysisTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveAnalysis(type.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeAnalysis === type.id
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              {type.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {type.description}
            </p>
          </button>
        ))}
      </div>

      {/* Analysis Form */}
      {activeAnalysis === 'basic' && renderBasicCAPM()}

      {/* Results */}
      {renderResults()}

      {/* Saved Analyses */}
      {savedAnalyses.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Saved Analyses
          </h3>
          <div className="space-y-3">
            {savedAnalyses.slice(-5).map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    Beta: {analysis.capmData.beta}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    - {analysis.results.capmExpectedReturn.toFixed(2)}% expected return
                  </span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(analysis.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CapitalAssetPricingModel
