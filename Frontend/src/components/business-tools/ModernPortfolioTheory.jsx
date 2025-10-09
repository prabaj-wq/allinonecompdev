import React, { useState, useEffect } from 'react'
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  Activity,
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
  LineChart,
  Info,
  Filter,
  Search,
  Plus,
  Trash2
} from 'lucide-react'

const ModernPortfolioTheory = ({ industry, level }) => {
  const [portfolio, setPortfolio] = useState({
    assets: [
      { name: 'Stock A', weight: 30, expectedReturn: 12, volatility: 20, correlation: 0.3 },
      { name: 'Stock B', weight: 40, expectedReturn: 10, volatility: 15, correlation: 0.5 },
      { name: 'Bond C', weight: 30, expectedReturn: 6, volatility: 8, correlation: 0.2 }
    ],
    riskFreeRate: 3.5,
    marketReturn: 8.0
  })

  const [optimizationResults, setOptimizationResults] = useState({
    efficientFrontier: [],
    optimalPortfolio: null,
    sharpeRatio: null,
    portfolioReturn: null,
    portfolioRisk: null
  })

  const [savedPortfolios, setSavedPortfolios] = useState([])
  const [activeView, setActiveView] = useState('portfolio')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const assetTypes = [
    { name: 'Large Cap Stocks', expectedReturn: 10, volatility: 18, correlation: 0.7 },
    { name: 'Small Cap Stocks', expectedReturn: 12, volatility: 25, correlation: 0.6 },
    { name: 'International Stocks', expectedReturn: 9, volatility: 22, correlation: 0.5 },
    { name: 'Government Bonds', expectedReturn: 4, volatility: 6, correlation: 0.1 },
    { name: 'Corporate Bonds', expectedReturn: 6, volatility: 10, correlation: 0.3 },
    { name: 'Real Estate', expectedReturn: 8, volatility: 15, correlation: 0.4 },
    { name: 'Commodities', expectedReturn: 7, volatility: 20, correlation: 0.2 },
    { name: 'Cash', expectedReturn: 2, volatility: 1, correlation: 0.0 }
  ]

  const industryDefaults = {
    banking: { riskFreeRate: 3.5, marketReturn: 8.2, focusAssets: ['Government Bonds', 'Corporate Bonds', 'Large Cap Stocks'] },
    manufacturing: { riskFreeRate: 3.5, marketReturn: 7.8, focusAssets: ['Large Cap Stocks', 'International Stocks', 'Real Estate'] },
    retail: { riskFreeRate: 3.5, marketReturn: 9.1, focusAssets: ['Small Cap Stocks', 'Large Cap Stocks', 'Real Estate'] },
    healthcare: { riskFreeRate: 3.5, marketReturn: 6.9, focusAssets: ['Large Cap Stocks', 'Government Bonds', 'International Stocks'] },
    technology: { riskFreeRate: 3.5, marketReturn: 11.4, focusAssets: ['Small Cap Stocks', 'Large Cap Stocks', 'International Stocks'] },
    energy: { riskFreeRate: 3.5, marketReturn: 7.2, focusAssets: ['Large Cap Stocks', 'Commodities', 'Real Estate'] },
    real_estate: { riskFreeRate: 3.5, marketReturn: 6.5, focusAssets: ['Real Estate', 'Government Bonds', 'Large Cap Stocks'] },
    general: { riskFreeRate: 3.5, marketReturn: 8.0, focusAssets: ['Large Cap Stocks', 'Government Bonds', 'International Stocks'] }
  }

  useEffect(() => {
    loadSavedPortfolios()
    
    // Set industry defaults
    const defaults = industryDefaults[industry] || industryDefaults.general
    setPortfolio(prev => ({
      ...prev,
      riskFreeRate: defaults.riskFreeRate,
      marketReturn: defaults.marketReturn
    }))
  }, [industry])

  const loadSavedPortfolios = () => {
    try {
      const saved = localStorage.getItem('mptPortfolios')
      if (saved) {
        setSavedPortfolios(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved portfolios:', error)
    }
  }

  const savePortfolio = () => {
    if (!optimizationResults.optimalPortfolio) return

    const newPortfolio = {
      id: Date.now(),
      portfolio: { ...portfolio },
      results: { ...optimizationResults },
      timestamp: new Date().toISOString(),
      industry
    }

    const updated = [...savedPortfolios, newPortfolio]
    setSavedPortfolios(updated)
    localStorage.setItem('mptPortfolios', JSON.stringify(updated))
  }

  const addAsset = () => {
    const newAsset = {
      name: `Asset ${portfolio.assets.length + 1}`,
      weight: 0,
      expectedReturn: 8,
      volatility: 15,
      correlation: 0.5
    }
    
    setPortfolio(prev => ({
      ...prev,
      assets: [...prev.assets, newAsset]
    }))
  }

  const removeAsset = (index) => {
    setPortfolio(prev => ({
      ...prev,
      assets: prev.assets.filter((_, i) => i !== index)
    }))
  }

  const updateAsset = (index, field, value) => {
    setPortfolio(prev => ({
      ...prev,
      assets: prev.assets.map((asset, i) => 
        i === index ? { ...asset, [field]: parseFloat(value) || 0 } : asset
      )
    }))
  }

  const calculatePortfolioMetrics = () => {
    const { assets, riskFreeRate } = portfolio
    
    // Calculate portfolio return
    const portfolioReturn = assets.reduce((sum, asset) => 
      sum + (asset.weight / 100) * asset.expectedReturn, 0
    )

    // Calculate portfolio variance using correlation matrix
    let portfolioVariance = 0
    for (let i = 0; i < assets.length; i++) {
      for (let j = 0; j < assets.length; j++) {
        const weightI = assets[i].weight / 100
        const weightJ = assets[j].weight / 100
        const volI = assets[i].volatility / 100
        const volJ = assets[j].volatility / 100
        const correlation = i === j ? 1 : assets[i].correlation
        
        portfolioVariance += weightI * weightJ * volI * volJ * correlation
      }
    }

    const portfolioRisk = Math.sqrt(portfolioVariance) * 100
    const sharpeRatio = (portfolioReturn - riskFreeRate) / (portfolioRisk / 100)

    // Generate efficient frontier points
    const efficientFrontier = generateEfficientFrontier()

    setOptimizationResults({
      efficientFrontier,
      optimalPortfolio: { return: portfolioReturn, risk: portfolioRisk },
      sharpeRatio,
      portfolioReturn,
      portfolioRisk
    })
  }

  const generateEfficientFrontier = () => {
    const points = []
    const { assets, riskFreeRate } = portfolio
    
    // Generate 20 points along the efficient frontier
    for (let i = 0; i <= 20; i++) {
      const targetReturn = 2 + (i * 0.5) // From 2% to 12%
      
      // Simple optimization: find minimum risk for target return
      // This is a simplified version - real optimization would use quadratic programming
      const minRisk = Math.max(5, targetReturn * 1.5) // Simplified relationship
      
      points.push({
        return: targetReturn,
        risk: minRisk,
        sharpe: (targetReturn - riskFreeRate) / (minRisk / 100)
      })
    }
    
    return points
  }

  const optimizePortfolio = () => {
    // Simple optimization: maximize Sharpe ratio
    const { assets, riskFreeRate } = portfolio
    
    // For demonstration, we'll use equal weights as a starting point
    // In practice, you'd use quadratic programming or other optimization methods
    const equalWeights = 100 / assets.length
    
    const optimizedAssets = assets.map(asset => ({
      ...asset,
      weight: equalWeights
    }))
    
    setPortfolio(prev => ({
      ...prev,
      assets: optimizedAssets
    }))
    
    calculatePortfolioMetrics()
  }

  const renderPortfolioBuilder = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <PieChart className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Portfolio Builder
              </h3>
            </div>
            <button
              onClick={addAsset}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Asset</span>
            </button>
          </div>

          <div className="space-y-4">
            {portfolio.assets.map((asset, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    value={asset.name}
                    onChange={(e) => updateAsset(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={asset.weight}
                    onChange={(e) => updateAsset(index, 'weight', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Expected Return (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={asset.expectedReturn}
                    onChange={(e) => updateAsset(index, 'expectedReturn', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Volatility (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={asset.volatility}
                    onChange={(e) => updateAsset(index, 'volatility', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Correlation
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="-1"
                    max="1"
                    value={asset.correlation}
                    onChange={(e) => updateAsset(index, 'correlation', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => removeAsset(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={calculatePortfolioMetrics}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Calculate Metrics</span>
            </button>
            
            <button
              onClick={optimizePortfolio}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Optimize Portfolio</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderResults = () => {
    if (!optimizationResults.portfolioReturn) return null

    return (
      <div className="space-y-6">
        {/* Portfolio Metrics */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Portfolio Analysis Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {optimizationResults.portfolioReturn.toFixed(2)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Expected Return
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {optimizationResults.portfolioRisk.toFixed(2)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Portfolio Risk
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {optimizationResults.sharpeRatio.toFixed(2)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Sharpe Ratio
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {portfolio.assets.length}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Number of Assets
              </p>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            {optimizationResults.optimalPortfolio && (
              <button
                onClick={savePortfolio}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Portfolio</span>
              </button>
            )}
          </div>
        </div>

        {/* Efficient Frontier Visualization */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Efficient Frontier
          </h3>
          <div className="h-64 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <LineChart className="h-12 w-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 dark:text-slate-400">
                Efficient Frontier Chart
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Risk vs Return visualization would be displayed here
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Portfolio Allocation
          </h3>
          <div className="space-y-3">
            {portfolio.assets.map((asset, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                  ></div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {asset.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-slate-600 dark:text-slate-400">
                    {asset.expectedReturn}% return
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {asset.volatility}% risk
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {asset.weight}%
                  </span>
                </div>
              </div>
            ))}
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
            Modern Portfolio Theory
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Build and optimize diversified portfolios using MPT principles
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

      {/* View Selector */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveView('portfolio')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeView === 'portfolio'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          Portfolio Builder
        </button>
        <button
          onClick={() => setActiveView('results')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeView === 'results'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          Analysis Results
        </button>
      </div>

      {/* Portfolio Builder */}
      {activeView === 'portfolio' && renderPortfolioBuilder()}

      {/* Results */}
      {activeView === 'results' && renderResults()}

      {/* Asset Types Reference */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Common Asset Types
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {assetTypes.map((asset, index) => (
            <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                {asset.name}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {asset.expectedReturn}% return, {asset.volatility}% risk
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Portfolios */}
      {savedPortfolios.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Saved Portfolios
          </h3>
          <div className="space-y-3">
            {savedPortfolios.slice(-5).map((portfolio) => (
              <div key={portfolio.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {portfolio.results.portfolioReturn.toFixed(2)}% return
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    - {portfolio.results.portfolioRisk.toFixed(2)}% risk
                  </span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(portfolio.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ModernPortfolioTheory
