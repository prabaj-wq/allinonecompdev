import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  LineChart,
  Info,
  Save,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  Brain,
  Target,
  Activity,
  DollarSign,
  Percent,
  Calendar,
  Filter,
  Search
} from 'lucide-react'

const EfficientMarketHypothesis = ({ industry, level }) => {
  const [marketData, setMarketData] = useState({
    stockPrice: '',
    expectedReturn: '',
    riskFreeRate: '',
    marketReturn: '',
    beta: '',
    volatility: ''
  })

  const [analysisResults, setAnalysisResults] = useState({
    emhLevel: null,
    marketEfficiency: null,
    anomalies: [],
    recommendations: []
  })

  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [activeAnalysis, setActiveAnalysis] = useState('weak')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const emhLevels = [
    { 
      id: 'weak', 
      name: 'Weak Form EMH', 
      description: 'Past prices and volume data are already reflected in current prices',
      implications: ['Technical analysis is ineffective', 'Random walk hypothesis applies', 'Only fundamental analysis can provide edge']
    },
    { 
      id: 'semi-strong', 
      name: 'Semi-Strong Form EMH', 
      description: 'All publicly available information is reflected in stock prices',
      implications: ['Fundamental analysis is ineffective', 'Only insider information provides edge', 'News is quickly incorporated']
    },
    { 
      id: 'strong', 
      name: 'Strong Form EMH', 
      description: 'All information, including insider information, is reflected in prices',
      implications: ['No analysis method provides edge', 'Markets are perfectly efficient', 'Active management is futile']
    }
  ]

  const marketAnomalies = [
    { name: 'January Effect', description: 'Stocks tend to perform better in January', frequency: 'Annual' },
    { name: 'Monday Effect', description: 'Stocks tend to perform worse on Mondays', frequency: 'Weekly' },
    { name: 'Size Effect', description: 'Small-cap stocks outperform large-cap stocks', frequency: 'Persistent' },
    { name: 'Value Effect', description: 'Value stocks outperform growth stocks', frequency: 'Long-term' },
    { name: 'Momentum Effect', description: 'Recent winners continue to win', frequency: 'Short-term' },
    { name: 'Mean Reversion', description: 'Prices tend to revert to historical averages', frequency: 'Medium-term' }
  ]

  const industryDefaults = {
    banking: { riskFreeRate: 3.5, marketReturn: 8.2, beta: 1.1, volatility: 18.5 },
    manufacturing: { riskFreeRate: 3.5, marketReturn: 7.8, beta: 0.9, volatility: 22.3 },
    retail: { riskFreeRate: 3.5, marketReturn: 9.1, beta: 1.3, volatility: 25.7 },
    healthcare: { riskFreeRate: 3.5, marketReturn: 6.9, beta: 0.7, volatility: 16.2 },
    technology: { riskFreeRate: 3.5, marketReturn: 11.4, beta: 1.4, volatility: 28.9 },
    energy: { riskFreeRate: 3.5, marketReturn: 7.2, beta: 1.0, volatility: 31.4 },
    real_estate: { riskFreeRate: 3.5, marketReturn: 6.5, beta: 0.8, volatility: 19.8 },
    general: { riskFreeRate: 3.5, marketReturn: 8.0, beta: 1.0, volatility: 20.0 }
  }

  useEffect(() => {
    loadSavedAnalyses()
    
    // Set industry defaults
    const defaults = industryDefaults[industry] || industryDefaults.general
    setMarketData(prev => ({
      ...prev,
      riskFreeRate: defaults.riskFreeRate,
      marketReturn: defaults.marketReturn,
      beta: defaults.beta,
      volatility: defaults.volatility
    }))
  }, [industry])

  const loadSavedAnalyses = () => {
    try {
      const saved = localStorage.getItem('emhAnalyses')
      if (saved) {
        setSavedAnalyses(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved analyses:', error)
    }
  }

  const saveAnalysis = () => {
    if (!analysisResults.emhLevel) return

    const newAnalysis = {
      id: Date.now(),
      marketData: { ...marketData },
      results: { ...analysisResults },
      timestamp: new Date().toISOString(),
      industry
    }

    const updated = [...savedAnalyses, newAnalysis]
    setSavedAnalyses(updated)
    localStorage.setItem('emhAnalyses', JSON.stringify(updated))
  }

  const analyzeMarketEfficiency = () => {
    const { stockPrice, expectedReturn, riskFreeRate, marketReturn, beta, volatility } = marketData
    
    if (!stockPrice || !expectedReturn || !riskFreeRate || !marketReturn || !beta) return

    const stockPriceNum = parseFloat(stockPrice)
    const expectedReturnNum = parseFloat(expectedReturn)
    const riskFreeRateNum = parseFloat(riskFreeRate) / 100
    const marketReturnNum = parseFloat(marketReturn) / 100
    const betaNum = parseFloat(beta)
    const volatilityNum = parseFloat(volatility) / 100

    // Calculate CAPM expected return
    const capmExpectedReturn = riskFreeRateNum + betaNum * (marketReturnNum - riskFreeRateNum)
    
    // Calculate alpha (excess return)
    const alpha = expectedReturnNum - capmExpectedReturn
    
    // Determine EMH level based on analysis
    let emhLevel = 'weak'
    let marketEfficiency = 'Low'
    let anomalies = []
    let recommendations = []

    // Analyze for market efficiency
    if (Math.abs(alpha) < 0.02) { // Less than 2% alpha
      emhLevel = 'strong'
      marketEfficiency = 'High'
      recommendations.push('Market appears highly efficient - consider passive investing')
      recommendations.push('Active management likely to underperform after costs')
    } else if (Math.abs(alpha) < 0.05) { // Less than 5% alpha
      emhLevel = 'semi-strong'
      marketEfficiency = 'Medium'
      recommendations.push('Market shows moderate efficiency - selective active management may work')
      recommendations.push('Focus on information edge and low-cost strategies')
    } else {
      emhLevel = 'weak'
      marketEfficiency = 'Low'
      recommendations.push('Market shows inefficiencies - active management opportunities exist')
      recommendations.push('Consider fundamental analysis and value investing')
    }

    // Check for common anomalies
    if (volatilityNum > 0.3) {
      anomalies.push('High volatility suggests potential inefficiencies')
    }
    if (betaNum > 1.5) {
      anomalies.push('High beta indicates high sensitivity to market movements')
    }
    if (alpha > 0.05) {
      anomalies.push('Positive alpha suggests market inefficiency')
    }

    setAnalysisResults({
      emhLevel,
      marketEfficiency,
      anomalies,
      recommendations,
      alpha,
      capmExpectedReturn,
      stockPrice: stockPriceNum,
      expectedReturn: expectedReturnNum
    })
  }

  const handleInputChange = (field, value) => {
    setMarketData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const renderAnalysisForm = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Market Efficiency Analysis
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Analyze market efficiency using the Efficient Market Hypothesis framework
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Stock Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={marketData.stockPrice}
                onChange={(e) => handleInputChange('stockPrice', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter current stock price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Expected Return (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={marketData.expectedReturn}
                onChange={(e) => handleInputChange('expectedReturn', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter expected return"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Risk-Free Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={marketData.riskFreeRate}
                onChange={(e) => handleInputChange('riskFreeRate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                value={marketData.marketReturn}
                onChange={(e) => handleInputChange('marketReturn', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                value={marketData.beta}
                onChange={(e) => handleInputChange('beta', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter beta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Volatility (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={marketData.volatility}
                onChange={(e) => handleInputChange('volatility', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter volatility"
              />
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={analyzeMarketEfficiency}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analyze Efficiency</span>
            </button>
            
            {analysisResults.emhLevel && (
              <button
                onClick={saveAnalysis}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
    if (!analysisResults.emhLevel) return null

    const emhLevel = emhLevels.find(level => level.id === analysisResults.emhLevel)
    const efficiencyColor = analysisResults.marketEfficiency === 'High' ? 'green' : 
                           analysisResults.marketEfficiency === 'Medium' ? 'yellow' : 'red'

    return (
      <div className="space-y-6">
        {/* EMH Level Analysis */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Market Efficiency Analysis Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                efficiencyColor === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                efficiencyColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {analysisResults.marketEfficiency} Efficiency
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Market Efficiency Level
              </p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {emhLevel?.name}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                EMH Classification
              </p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {(analysisResults.alpha * 100).toFixed(2)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Alpha (Excess Return)
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
              EMH Level Description
            </h4>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {emhLevel?.description}
            </p>
            
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
              Key Implications
            </h4>
            <ul className="space-y-2">
              {emhLevel?.implications.map((implication, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-600 dark:text-slate-400">{implication}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Anomalies and Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysisResults.anomalies.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span>Market Anomalies Detected</span>
              </h4>
              <ul className="space-y-2">
                {analysisResults.anomalies.map((anomaly, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-600 dark:text-slate-400">{anomaly}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysisResults.recommendations.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span>Investment Recommendations</span>
              </h4>
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
            Efficient Market Hypothesis
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analyze market efficiency and identify investment opportunities
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

      {/* EMH Levels Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {emhLevels.map((level) => (
          <div
            key={level.id}
            className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
              activeAnalysis === level.id
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            onClick={() => setActiveAnalysis(level.id)}
          >
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {level.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {level.description}
            </p>
          </div>
        ))}
      </div>

      {/* Analysis Form */}
      {renderAnalysisForm()}

      {/* Results */}
      {renderResults()}

      {/* Market Anomalies Reference */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Common Market Anomalies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketAnomalies.map((anomaly, index) => (
            <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                {anomaly.name}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {anomaly.description}
              </p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {anomaly.frequency}
              </span>
            </div>
          ))}
        </div>
      </div>

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
                    {emhLevels.find(level => level.id === analysis.results.emhLevel)?.name}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    - {analysis.results.marketEfficiency} Efficiency
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

export default EfficientMarketHypothesis
