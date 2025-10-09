import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Save,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  Target,
  Calculator,
  LineChart,
  Info,
  Filter,
  Search,
  Activity,
  DollarSign,
  Percent,
  Calendar,
  Building,
  UserCheck,
  Lock,
  Unlock,
  Users,
  Shield,
  Zap,
  Lightbulb
} from 'lucide-react'

const BehavioralFinance = ({ industry, level }) => {
  const [behavioralData, setBehavioralData] = useState({
    investorType: 'individual',
    riskTolerance: 'moderate',
    timeHorizon: 'medium',
    biases: [],
    decisionFactors: [],
    marketConditions: 'normal'
  })

  const [analysisResults, setAnalysisResults] = useState({
    biasScore: null,
    riskProfile: null,
    recommendations: [],
    behavioralInsights: [],
    decisionQuality: null
  })

  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [activeAnalysis, setActiveAnalysis] = useState('bias_assessment')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const investorTypes = [
    { id: 'individual', name: 'Individual Investor', description: 'Personal investment decisions' },
    { id: 'institutional', name: 'Institutional Investor', description: 'Professional investment management' },
    { id: 'retail', name: 'Retail Investor', description: 'Small-scale individual investing' },
    { id: 'day_trader', name: 'Day Trader', description: 'Short-term trading strategies' },
    { id: 'long_term', name: 'Long-term Investor', description: 'Buy and hold strategies' }
  ]

  const commonBiases = [
    { 
      id: 'confirmation_bias', 
      name: 'Confirmation Bias', 
      description: 'Seeking information that confirms existing beliefs',
      impact: 'High',
      category: 'Cognitive'
    },
    { 
      id: 'overconfidence', 
      name: 'Overconfidence', 
      description: 'Overestimating one\'s abilities and knowledge',
      impact: 'High',
      category: 'Cognitive'
    },
    { 
      id: 'loss_aversion', 
      name: 'Loss Aversion', 
      description: 'Feeling losses more strongly than equivalent gains',
      impact: 'Very High',
      category: 'Emotional'
    },
    { 
      id: 'anchoring', 
      name: 'Anchoring', 
      description: 'Relying too heavily on first piece of information',
      impact: 'Medium',
      category: 'Cognitive'
    },
    { 
      id: 'herding', 
      name: 'Herding', 
      description: 'Following the crowd in investment decisions',
      impact: 'High',
      category: 'Social'
    },
    { 
      id: 'recency_bias', 
      name: 'Recency Bias', 
      description: 'Giving more weight to recent events',
      impact: 'Medium',
      category: 'Cognitive'
    },
    { 
      id: 'availability_bias', 
      name: 'Availability Bias', 
      description: 'Overestimating probability of easily recalled events',
      impact: 'Medium',
      category: 'Cognitive'
    },
    { 
      id: 'gamblers_fallacy', 
      name: 'Gambler\'s Fallacy', 
      description: 'Believing past events affect future probabilities',
      impact: 'High',
      category: 'Cognitive'
    }
  ]

  const decisionFactors = [
    { id: 'emotions', name: 'Emotions', weight: 30 },
    { id: 'rational_analysis', name: 'Rational Analysis', weight: 40 },
    { id: 'social_influence', name: 'Social Influence', weight: 15 },
    { id: 'past_experience', name: 'Past Experience', weight: 10 },
    { id: 'intuition', name: 'Intuition', weight: 5 }
  ]

  const industryDefaults = {
    banking: { riskTolerance: 'conservative', timeHorizon: 'long', marketConditions: 'stable' },
    manufacturing: { riskTolerance: 'moderate', timeHorizon: 'medium', marketConditions: 'normal' },
    retail: { riskTolerance: 'moderate', timeHorizon: 'short', marketConditions: 'volatile' },
    healthcare: { riskTolerance: 'conservative', timeHorizon: 'long', marketConditions: 'stable' },
    technology: { riskTolerance: 'aggressive', timeHorizon: 'medium', marketConditions: 'volatile' },
    energy: { riskTolerance: 'moderate', timeHorizon: 'long', marketConditions: 'cyclical' },
    real_estate: { riskTolerance: 'conservative', timeHorizon: 'long', marketConditions: 'stable' },
    general: { riskTolerance: 'moderate', timeHorizon: 'medium', marketConditions: 'normal' }
  }

  useEffect(() => {
    loadSavedAnalyses()
    
    // Set industry defaults
    const defaults = industryDefaults[industry] || industryDefaults.general
    setBehavioralData(prev => ({
      ...prev,
      riskTolerance: defaults.riskTolerance,
      timeHorizon: defaults.timeHorizon,
      marketConditions: defaults.marketConditions
    }))
  }, [industry])

  const loadSavedAnalyses = () => {
    try {
      const saved = localStorage.getItem('behavioralFinanceAnalyses')
      if (saved) {
        setSavedAnalyses(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved analyses:', error)
    }
  }

  const saveAnalysis = () => {
    if (!analysisResults.biasScore) return

    const newAnalysis = {
      id: Date.now(),
      behavioralData: { ...behavioralData },
      results: { ...analysisResults },
      timestamp: new Date().toISOString(),
      industry
    }

    const updated = [...savedAnalyses, newAnalysis]
    setSavedAnalyses(updated)
    localStorage.setItem('behavioralFinanceAnalyses', JSON.stringify(updated))
  }

  const analyzeBehavioralFinance = () => {
    const { investorType, riskTolerance, timeHorizon, biases, decisionFactors, marketConditions } = behavioralData
    
    // Calculate bias score (0-100, higher = more biased)
    const biasScore = biases.length * 12.5 // Each bias adds 12.5 points
    
    // Determine risk profile
    let riskProfile = 'Balanced'
    if (riskTolerance === 'conservative') riskProfile = 'Conservative'
    else if (riskTolerance === 'aggressive') riskProfile = 'Aggressive'
    
    // Calculate decision quality
    const emotionalWeight = decisionFactors.find(df => df.id === 'emotions')?.weight || 30
    const rationalWeight = decisionFactors.find(df => df.id === 'rational_analysis')?.weight || 40
    const decisionQuality = (rationalWeight / (emotionalWeight + rationalWeight)) * 100
    
    // Generate behavioral insights
    const behavioralInsights = []
    
    if (biases.includes('loss_aversion')) {
      behavioralInsights.push('High loss aversion may lead to suboptimal risk-taking')
    }
    
    if (biases.includes('overconfidence')) {
      behavioralInsights.push('Overconfidence may result in excessive trading')
    }
    
    if (biases.includes('herding')) {
      behavioralInsights.push('Herding behavior may lead to market bubbles')
    }
    
    if (marketConditions === 'volatile' && biases.length > 3) {
      behavioralInsights.push('High bias count in volatile markets increases risk')
    }
    
    // Generate recommendations
    const recommendations = []
    
    if (biasScore > 50) {
      recommendations.push('Consider working with a financial advisor to reduce biases')
    }
    
    if (decisionQuality < 60) {
      recommendations.push('Increase rational analysis in decision-making process')
    }
    
    if (biases.includes('confirmation_bias')) {
      recommendations.push('Actively seek contradictory information before making decisions')
    }
    
    if (biases.includes('loss_aversion')) {
      recommendations.push('Focus on long-term goals rather than short-term losses')
    }
    
    if (biases.includes('herding')) {
      recommendations.push('Develop independent investment criteria')
    }
    
    if (timeHorizon === 'short' && riskTolerance === 'aggressive') {
      recommendations.push('Consider longer time horizon for aggressive strategies')
    }

    setAnalysisResults({
      biasScore,
      riskProfile,
      recommendations,
      behavioralInsights,
      decisionQuality
    })
  }

  const handleInputChange = (field, value) => {
    setBehavioralData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBiasToggle = (biasId) => {
    setBehavioralData(prev => ({
      ...prev,
      biases: prev.biases.includes(biasId)
        ? prev.biases.filter(id => id !== biasId)
        : [...prev.biases, biasId]
    }))
  }

  const handleDecisionFactorChange = (factorId, weight) => {
    setBehavioralData(prev => ({
      ...prev,
      decisionFactors: prev.decisionFactors.map(df => 
        df.id === factorId ? { ...df, weight: parseFloat(weight) || 0 } : df
      )
    }))
  }

  const renderBiasAssessment = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="h-6 w-6 text-pink-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Behavioral Finance Analysis
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Assess psychological biases and their impact on financial decisions
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Investor Profile */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Investor Type
                </label>
                <select
                  value={behavioralData.investorType}
                  onChange={(e) => handleInputChange('investorType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {investorTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Risk Tolerance
                </label>
                <select
                  value={behavioralData.riskTolerance}
                  onChange={(e) => handleInputChange('riskTolerance', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Time Horizon
                </label>
                <select
                  value={behavioralData.timeHorizon}
                  onChange={(e) => handleInputChange('timeHorizon', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="short">Short-term (1-2 years)</option>
                  <option value="medium">Medium-term (3-5 years)</option>
                  <option value="long">Long-term (5+ years)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Market Conditions
                </label>
                <select
                  value={behavioralData.marketConditions}
                  onChange={(e) => handleInputChange('marketConditions', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="stable">Stable</option>
                  <option value="normal">Normal</option>
                  <option value="volatile">Volatile</option>
                  <option value="cyclical">Cyclical</option>
                </select>
              </div>
            </div>

            {/* Decision Factors */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Decision Factors (Total: 100%)</h4>
              {decisionFactors.map((factor) => (
                <div key={factor.id}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {factor.name} ({factor.weight}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={factor.weight}
                    onChange={(e) => handleDecisionFactorChange(factor.id, e.target.value)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bias Selection */}
          <div className="mt-6">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Psychological Biases</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commonBiases.map((bias) => (
                <label key={bias.id} className="flex items-start space-x-3 cursor-pointer p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-pink-300 dark:hover:border-pink-600">
                  <input
                    type="checkbox"
                    checked={behavioralData.biases.includes(bias.id)}
                    onChange={() => handleBiasToggle(bias.id)}
                    className="mt-1 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {bias.name}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        bias.impact === 'Very High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        bias.impact === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {bias.impact}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {bias.description}
                    </p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mt-2">
                      {bias.category}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={analyzeBehavioralFinance}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Analyze Biases</span>
            </button>
            
            {analysisResults.biasScore && (
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
    if (!analysisResults.biasScore) return null

    const biasColor = analysisResults.biasScore > 60 ? 'red' : 
                     analysisResults.biasScore > 30 ? 'yellow' : 'green'

    return (
      <div className="space-y-6">
        {/* Behavioral Finance Results */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Behavioral Finance Analysis Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                biasColor === 'green' ? 'text-green-600' :
                biasColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analysisResults.biasScore.toFixed(0)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Bias Score (0-100)
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analysisResults.riskProfile}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Risk Profile
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analysisResults.decisionQuality.toFixed(0)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Decision Quality
              </p>
            </div>
          </div>
        </div>

        {/* Behavioral Insights */}
        {analysisResults.behavioralInsights.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span>Behavioral Insights</span>
            </h3>
            <ul className="space-y-2">
              {analysisResults.behavioralInsights.map((insight, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-600 dark:text-slate-400">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {analysisResults.recommendations.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span>Recommendations</span>
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

        {/* Bias Categories */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Common Behavioral Biases
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {commonBiases.map((bias, index) => (
              <div key={index} className={`p-3 rounded-lg border-2 ${
                behavioralData.biases.includes(bias.id)
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}>
                <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                  {bias.name}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {bias.description}
                </p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  bias.impact === 'Very High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  bias.impact === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {bias.impact}
                </span>
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
            Behavioral Finance
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analyze psychological biases and their impact on financial decisions
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

      {/* Analysis Form */}
      {renderBiasAssessment()}

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
                    {analysis.results.biasScore.toFixed(0)} bias score
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    - {analysis.results.riskProfile} risk profile
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

export default BehavioralFinance
