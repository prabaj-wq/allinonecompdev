import React, { useState, useEffect } from 'react'
import { 
  Shield, 
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
  DollarSign,
  Percent,
  Calendar,
  Building,
  UserCheck,
  Lock,
  Unlock,
  Users,
  Zap,
  Lightbulb,
  Clock,
  Globe,
  Activity,
  Brain
} from 'lucide-react'

const PortersFiveForces = ({ industry, level }) => {
  const [forcesData, setForcesData] = useState({
    competitiveRivalry: {
      intensity: 'medium',
      factors: ['number_of_competitors', 'market_growth', 'product_differentiation'],
      score: 50
    },
    supplierPower: {
      intensity: 'medium',
      factors: ['supplier_concentration', 'switching_costs', 'substitute_inputs'],
      score: 50
    },
    buyerPower: {
      intensity: 'medium',
      factors: ['buyer_concentration', 'switching_costs', 'price_sensitivity'],
      score: 50
    },
    threatOfSubstitution: {
      intensity: 'medium',
      factors: ['substitute_availability', 'switching_costs', 'price_performance'],
      score: 50
    },
    threatOfNewEntry: {
      intensity: 'medium',
      factors: ['barriers_to_entry', 'capital_requirements', 'regulatory_hurdles'],
      score: 50
    }
  })

  const [analysisResults, setAnalysisResults] = useState({
    overallAttractiveness: null,
    dominantForces: [],
    recommendations: [],
    industryInsights: [],
    competitivePosition: null
  })

  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [activeAnalysis, setActiveAnalysis] = useState('forces_analysis')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const fiveForces = [
    {
      id: 'competitiveRivalry',
      name: 'Competitive Rivalry',
      description: 'Intensity of competition among existing firms',
      icon: Shield,
      color: 'red',
      factors: [
        { id: 'number_of_competitors', name: 'Number of Competitors', weight: 30 },
        { id: 'market_growth', name: 'Market Growth Rate', weight: 25 },
        { id: 'product_differentiation', name: 'Product Differentiation', weight: 20 },
        { id: 'exit_barriers', name: 'Exit Barriers', weight: 15 },
        { id: 'fixed_costs', name: 'Fixed Costs', weight: 10 }
      ]
    },
    {
      id: 'supplierPower',
      name: 'Supplier Power',
      description: 'Bargaining power of suppliers',
      icon: Building,
      color: 'orange',
      factors: [
        { id: 'supplier_concentration', name: 'Supplier Concentration', weight: 30 },
        { id: 'switching_costs', name: 'Switching Costs', weight: 25 },
        { id: 'substitute_inputs', name: 'Substitute Inputs', weight: 20 },
        { id: 'forward_integration', name: 'Forward Integration Threat', weight: 15 },
        { id: 'input_importance', name: 'Input Importance', weight: 10 }
      ]
    },
    {
      id: 'buyerPower',
      name: 'Buyer Power',
      description: 'Bargaining power of customers',
      icon: Users,
      color: 'blue',
      factors: [
        { id: 'buyer_concentration', name: 'Buyer Concentration', weight: 30 },
        { id: 'switching_costs', name: 'Switching Costs', weight: 25 },
        { id: 'price_sensitivity', name: 'Price Sensitivity', weight: 20 },
        { id: 'backward_integration', name: 'Backward Integration Threat', weight: 15 },
        { id: 'product_importance', name: 'Product Importance', weight: 10 }
      ]
    },
    {
      id: 'threatOfSubstitution',
      name: 'Threat of Substitution',
      description: 'Threat of substitute products or services',
      icon: Target,
      color: 'green',
      factors: [
        { id: 'substitute_availability', name: 'Substitute Availability', weight: 35 },
        { id: 'switching_costs', name: 'Switching Costs', weight: 25 },
        { id: 'price_performance', name: 'Price-Performance Ratio', weight: 25 },
        { id: 'buyer_propensity', name: 'Buyer Propensity to Substitute', weight: 15 }
      ]
    },
    {
      id: 'threatOfNewEntry',
      name: 'Threat of New Entry',
      description: 'Threat of new competitors entering the market',
      icon: Zap,
      color: 'purple',
      factors: [
        { id: 'barriers_to_entry', name: 'Barriers to Entry', weight: 30 },
        { id: 'capital_requirements', name: 'Capital Requirements', weight: 25 },
        { id: 'regulatory_hurdles', name: 'Regulatory Hurdles', weight: 20 },
        { id: 'economies_of_scale', name: 'Economies of Scale', weight: 15 },
        { id: 'brand_loyalty', name: 'Brand Loyalty', weight: 10 }
      ]
    }
  ]

  const industryDefaults = {
    banking: {
      competitiveRivalry: { intensity: 'high', score: 75 },
      supplierPower: { intensity: 'low', score: 25 },
      buyerPower: { intensity: 'medium', score: 50 },
      threatOfSubstitution: { intensity: 'medium', score: 50 },
      threatOfNewEntry: { intensity: 'high', score: 80 }
    },
    manufacturing: {
      competitiveRivalry: { intensity: 'high', score: 70 },
      supplierPower: { intensity: 'medium', score: 55 },
      buyerPower: { intensity: 'medium', score: 45 },
      threatOfSubstitution: { intensity: 'medium', score: 50 },
      threatOfNewEntry: { intensity: 'medium', score: 60 }
    },
    retail: {
      competitiveRivalry: { intensity: 'very_high', score: 85 },
      supplierPower: { intensity: 'medium', score: 50 },
      buyerPower: { intensity: 'high', score: 70 },
      threatOfSubstitution: { intensity: 'high', score: 65 },
      threatOfNewEntry: { intensity: 'low', score: 30 }
    },
    healthcare: {
      competitiveRivalry: { intensity: 'medium', score: 50 },
      supplierPower: { intensity: 'high', score: 75 },
      buyerPower: { intensity: 'low', score: 25 },
      threatOfSubstitution: { intensity: 'low', score: 30 },
      threatOfNewEntry: { intensity: 'very_high', score: 85 }
    },
    technology: {
      competitiveRivalry: { intensity: 'very_high', score: 90 },
      supplierPower: { intensity: 'low', score: 30 },
      buyerPower: { intensity: 'high', score: 70 },
      threatOfSubstitution: { intensity: 'very_high', score: 80 },
      threatOfNewEntry: { intensity: 'low', score: 25 }
    },
    energy: {
      competitiveRivalry: { intensity: 'medium', score: 55 },
      supplierPower: { intensity: 'high', score: 70 },
      buyerPower: { intensity: 'medium', score: 50 },
      threatOfSubstitution: { intensity: 'medium', score: 45 },
      threatOfNewEntry: { intensity: 'very_high', score: 85 }
    },
    real_estate: {
      competitiveRivalry: { intensity: 'medium', score: 50 },
      supplierPower: { intensity: 'medium', score: 50 },
      buyerPower: { intensity: 'medium', score: 50 },
      threatOfSubstitution: { intensity: 'low', score: 35 },
      threatOfNewEntry: { intensity: 'medium', score: 55 }
    },
    general: {
      competitiveRivalry: { intensity: 'medium', score: 50 },
      supplierPower: { intensity: 'medium', score: 50 },
      buyerPower: { intensity: 'medium', score: 50 },
      threatOfSubstitution: { intensity: 'medium', score: 50 },
      threatOfNewEntry: { intensity: 'medium', score: 50 }
    }
  }

  useEffect(() => {
    loadSavedAnalyses()
    
    // Set industry defaults
    const defaults = industryDefaults[industry] || industryDefaults.general
    setForcesData(prev => ({
      competitiveRivalry: { ...prev.competitiveRivalry, ...defaults.competitiveRivalry },
      supplierPower: { ...prev.supplierPower, ...defaults.supplierPower },
      buyerPower: { ...prev.buyerPower, ...defaults.buyerPower },
      threatOfSubstitution: { ...prev.threatOfSubstitution, ...defaults.threatOfSubstitution },
      threatOfNewEntry: { ...prev.threatOfNewEntry, ...defaults.threatOfNewEntry }
    }))
  }, [industry])

  const loadSavedAnalyses = () => {
    try {
      const saved = localStorage.getItem('portersFiveForcesAnalyses')
      if (saved) {
        setSavedAnalyses(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved analyses:', error)
    }
  }

  const saveAnalysis = () => {
    if (!analysisResults.overallAttractiveness) return

    const newAnalysis = {
      id: Date.now(),
      forcesData: { ...forcesData },
      results: { ...analysisResults },
      timestamp: new Date().toISOString(),
      industry
    }

    const updated = [...savedAnalyses, newAnalysis]
    setSavedAnalyses(updated)
    localStorage.setItem('portersFiveForcesAnalyses', JSON.stringify(updated))
  }

  const analyzePortersFiveForces = () => {
    const { competitiveRivalry, supplierPower, buyerPower, threatOfSubstitution, threatOfNewEntry } = forcesData
    
    // Calculate overall industry attractiveness (lower scores = more attractive)
    const totalScore = competitiveRivalry.score + supplierPower.score + buyerPower.score + 
                      threatOfSubstitution.score + threatOfNewEntry.score
    const averageScore = totalScore / 5
    
    let overallAttractiveness = 'Moderate'
    if (averageScore < 30) overallAttractiveness = 'Very High'
    else if (averageScore < 50) overallAttractiveness = 'High'
    else if (averageScore < 70) overallAttractiveness = 'Moderate'
    else if (averageScore < 85) overallAttractiveness = 'Low'
    else overallAttractiveness = 'Very Low'

    // Identify dominant forces
    const dominantForces = []
    if (competitiveRivalry.score > 70) dominantForces.push('High Competitive Rivalry')
    if (supplierPower.score > 70) dominantForces.push('High Supplier Power')
    if (buyerPower.score > 70) dominantForces.push('High Buyer Power')
    if (threatOfSubstitution.score > 70) dominantForces.push('High Threat of Substitution')
    if (threatOfNewEntry.score > 70) dominantForces.push('High Threat of New Entry')

    // Determine competitive position
    let competitivePosition = 'Moderate'
    if (averageScore < 40) competitivePosition = 'Strong'
    else if (averageScore > 70) competitivePosition = 'Weak'

    // Generate recommendations
    const recommendations = []
    
    if (competitiveRivalry.score > 70) {
      recommendations.push('Focus on differentiation and cost leadership strategies')
    }
    
    if (supplierPower.score > 70) {
      recommendations.push('Develop alternative suppliers or backward integration')
    }
    
    if (buyerPower.score > 70) {
      recommendations.push('Increase switching costs and build customer loyalty')
    }
    
    if (threatOfSubstitution.score > 70) {
      recommendations.push('Invest in innovation and unique value propositions')
    }
    
    if (threatOfNewEntry.score > 70) {
      recommendations.push('Strengthen barriers to entry and competitive advantages')
    }

    // Add industry-specific recommendations
    if (industry === 'technology') {
      recommendations.push('Focus on rapid innovation and network effects')
    } else if (industry === 'banking') {
      recommendations.push('Leverage regulatory barriers and customer relationships')
    } else if (industry === 'retail') {
      recommendations.push('Emphasize customer experience and operational efficiency')
    }

    // Generate industry insights
    const industryInsights = []
    
    if (overallAttractiveness === 'Very High' || overallAttractiveness === 'High') {
      industryInsights.push('Industry shows strong profit potential')
    } else if (overallAttractiveness === 'Very Low' || overallAttractiveness === 'Low') {
      industryInsights.push('Industry faces significant competitive pressures')
    }

    if (dominantForces.length > 2) {
      industryInsights.push('Multiple competitive forces are creating pressure')
    }

    setAnalysisResults({
      overallAttractiveness,
      dominantForces,
      recommendations,
      industryInsights,
      competitivePosition,
      averageScore
    })
  }

  const handleForceChange = (forceId, field, value) => {
    setForcesData(prev => ({
      ...prev,
      [forceId]: {
        ...prev[forceId],
        [field]: value
      }
    }))
  }

  const handleScoreChange = (forceId, score) => {
    setForcesData(prev => ({
      ...prev,
      [forceId]: {
        ...prev[forceId],
        score: parseInt(score)
      }
    }))
  }

  const renderForcesAnalysis = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Porter's Five Forces Analysis
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Analyze the competitive forces that shape your industry
          </p>

          <div className="space-y-6">
            {fiveForces.map((force) => {
              const Icon = force.icon
              const forceData = forcesData[force.id]
              
              return (
                <div key={force.id} className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg bg-${force.color}-100 dark:bg-${force.color}-900/30`}>
                      <Icon className={`h-6 w-6 text-${force.color}-600`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {force.name}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {force.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Intensity Level
                      </label>
                      <select
                        value={forceData.intensity}
                        onChange={(e) => handleForceChange(force.id, 'intensity', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      >
                        <option value="very_low">Very Low</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="very_high">Very High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Force Score (0-100)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={forceData.score}
                        onChange={(e) => handleScoreChange(force.id, e.target.value)}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>0 (Weak)</span>
                        <span className="font-medium">{forceData.score}</span>
                        <span>100 (Strong)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="font-medium text-slate-900 dark:text-white mb-2">
                      Key Factors
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {force.factors.map((factor) => (
                        <div key={factor.id} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {factor.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={analyzePortersFiveForces}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Analyze Five Forces</span>
            </button>
            
            {analysisResults.overallAttractiveness && (
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
    if (!analysisResults.overallAttractiveness) return null

    const attractivenessColor = analysisResults.overallAttractiveness === 'Very High' ? 'green' :
                               analysisResults.overallAttractiveness === 'High' ? 'blue' :
                               analysisResults.overallAttractiveness === 'Moderate' ? 'yellow' :
                               analysisResults.overallAttractiveness === 'Low' ? 'orange' : 'red'

    return (
      <div className="space-y-6">
        {/* Five Forces Results */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Porter's Five Forces Analysis Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                attractivenessColor === 'green' ? 'text-green-600' :
                attractivenessColor === 'blue' ? 'text-blue-600' :
                attractivenessColor === 'yellow' ? 'text-yellow-600' :
                attractivenessColor === 'orange' ? 'text-orange-600' : 'text-red-600'
              }`}>
                {analysisResults.overallAttractiveness}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Industry Attractiveness
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analysisResults.competitivePosition}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Competitive Position
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {analysisResults.averageScore.toFixed(0)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Average Force Score
              </p>
            </div>
          </div>
        </div>

        {/* Force Scores Visualization */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Force Scores
          </h3>
          <div className="space-y-4">
            {fiveForces.map((force) => {
              const forceData = forcesData[force.id]
              const scoreColor = forceData.score > 70 ? 'red' : forceData.score > 50 ? 'yellow' : 'green'
              
              return (
                <div key={force.id} className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium text-slate-900 dark:text-white">
                    {force.name}
                  </div>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full ${
                        scoreColor === 'green' ? 'bg-green-500' :
                        scoreColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${forceData.score}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-sm font-medium text-slate-900 dark:text-white">
                    {forceData.score}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dominant Forces */}
        {analysisResults.dominantForces.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Dominant Forces</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysisResults.dominantForces.map((force, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-slate-700 dark:text-slate-300">{force}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysisResults.recommendations.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              <span>Strategic Recommendations</span>
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

        {/* Industry Insights */}
        {analysisResults.industryInsights.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <span>Industry Insights</span>
            </h3>
            <ul className="space-y-2">
              {analysisResults.industryInsights.map((insight, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-600 dark:text-slate-400">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Porter's Five Forces
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analyze competitive forces and industry attractiveness
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
      {renderForcesAnalysis()}

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
                    {analysis.results.overallAttractiveness} attractiveness
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    - {analysis.results.competitivePosition} position
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

export default PortersFiveForces
