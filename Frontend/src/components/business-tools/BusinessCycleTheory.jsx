import React, { useState, useEffect } from 'react'
import { 
  Activity, 
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
  Shield,
  Zap,
  Lightbulb,
  Clock,
  Globe
} from 'lucide-react'

const BusinessCycleTheory = ({ industry, level }) => {
  const [cycleData, setCycleData] = useState({
    currentPhase: 'expansion',
    gdpGrowth: 2.5,
    unemploymentRate: 5.2,
    inflationRate: 2.1,
    interestRate: 3.5,
    consumerConfidence: 75,
    businessConfidence: 70,
    timeHorizon: 'medium'
  })

  const [analysisResults, setAnalysisResults] = useState({
    cyclePhase: null,
    phaseDuration: null,
    nextPhase: null,
    recommendations: [],
    economicIndicators: [],
    riskAssessment: null
  })

  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [activeAnalysis, setActiveAnalysis] = useState('cycle_analysis')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const cyclePhases = [
    { 
      id: 'expansion', 
      name: 'Expansion', 
      description: 'Economic growth, rising employment, increasing GDP',
      characteristics: ['Rising GDP', 'Low unemployment', 'Increasing investment', 'High consumer confidence'],
      duration: '2-10 years',
      color: 'green'
    },
    { 
      id: 'peak', 
      name: 'Peak', 
      description: 'Maximum economic activity, full employment',
      characteristics: ['Peak GDP growth', 'Lowest unemployment', 'High inflation', 'Overheating signs'],
      duration: '6-18 months',
      color: 'yellow'
    },
    { 
      id: 'contraction', 
      name: 'Contraction', 
      description: 'Economic decline, rising unemployment, falling GDP',
      characteristics: ['Declining GDP', 'Rising unemployment', 'Decreasing investment', 'Low confidence'],
      duration: '6-18 months',
      color: 'orange'
    },
    { 
      id: 'trough', 
      name: 'Trough', 
      description: 'Lowest economic activity, high unemployment',
      characteristics: ['Lowest GDP', 'Highest unemployment', 'Deflation risk', 'Recovery signs'],
      duration: '6-12 months',
      color: 'red'
    }
  ]

  const economicIndicators = [
    { id: 'gdp_growth', name: 'GDP Growth', weight: 25, current: 2.5, trend: 'stable' },
    { id: 'unemployment', name: 'Unemployment Rate', weight: 20, current: 5.2, trend: 'stable' },
    { id: 'inflation', name: 'Inflation Rate', weight: 20, current: 2.1, trend: 'stable' },
    { id: 'interest_rates', name: 'Interest Rates', weight: 15, current: 3.5, trend: 'stable' },
    { id: 'consumer_confidence', name: 'Consumer Confidence', weight: 10, current: 75, trend: 'stable' },
    { id: 'business_confidence', name: 'Business Confidence', weight: 10, current: 70, trend: 'stable' }
  ]

  const industryDefaults = {
    banking: { gdpGrowth: 2.8, unemploymentRate: 4.8, inflationRate: 2.3, interestRate: 4.2, consumerConfidence: 78, businessConfidence: 75 },
    manufacturing: { gdpGrowth: 2.2, unemploymentRate: 5.5, inflationRate: 1.9, interestRate: 3.2, consumerConfidence: 72, businessConfidence: 68 },
    retail: { gdpGrowth: 2.6, unemploymentRate: 5.1, inflationRate: 2.4, interestRate: 3.8, consumerConfidence: 76, businessConfidence: 72 },
    healthcare: { gdpGrowth: 3.1, unemploymentRate: 4.5, inflationRate: 2.8, interestRate: 3.6, consumerConfidence: 80, businessConfidence: 78 },
    technology: { gdpGrowth: 3.5, unemploymentRate: 4.2, inflationRate: 2.0, interestRate: 3.4, consumerConfidence: 82, businessConfidence: 85 },
    energy: { gdpGrowth: 2.0, unemploymentRate: 5.8, inflationRate: 1.8, interestRate: 3.9, consumerConfidence: 68, businessConfidence: 65 },
    real_estate: { gdpGrowth: 2.3, unemploymentRate: 5.3, inflationRate: 2.2, interestRate: 4.1, consumerConfidence: 74, businessConfidence: 70 },
    general: { gdpGrowth: 2.5, unemploymentRate: 5.2, inflationRate: 2.1, interestRate: 3.5, consumerConfidence: 75, businessConfidence: 70 }
  }

  useEffect(() => {
    loadSavedAnalyses()
    
    // Set industry defaults
    const defaults = industryDefaults[industry] || industryDefaults.general
    setCycleData(prev => ({
      ...prev,
      gdpGrowth: defaults.gdpGrowth,
      unemploymentRate: defaults.unemploymentRate,
      inflationRate: defaults.inflationRate,
      interestRate: defaults.interestRate,
      consumerConfidence: defaults.consumerConfidence,
      businessConfidence: defaults.businessConfidence
    }))
  }, [industry])

  const loadSavedAnalyses = () => {
    try {
      const saved = localStorage.getItem('businessCycleAnalyses')
      if (saved) {
        setSavedAnalyses(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved analyses:', error)
    }
  }

  const saveAnalysis = () => {
    if (!analysisResults.cyclePhase) return

    const newAnalysis = {
      id: Date.now(),
      cycleData: { ...cycleData },
      results: { ...analysisResults },
      timestamp: new Date().toISOString(),
      industry
    }

    const updated = [...savedAnalyses, newAnalysis]
    setSavedAnalyses(updated)
    localStorage.setItem('businessCycleAnalyses', JSON.stringify(updated))
  }

  const analyzeBusinessCycle = () => {
    const { gdpGrowth, unemploymentRate, inflationRate, interestRate, consumerConfidence, businessConfidence } = cycleData
    
    // Determine current cycle phase based on indicators
    let cyclePhase = 'expansion'
    let phaseDuration = '2-3 years'
    let nextPhase = 'peak'
    let riskAssessment = 'Low'
    let recommendations = []
    let economicIndicators = []

    // Analyze GDP growth
    if (gdpGrowth > 3.0) {
      cyclePhase = 'peak'
      nextPhase = 'contraction'
      riskAssessment = 'Medium'
      recommendations.push('Consider defensive strategies - economy may be overheating')
    } else if (gdpGrowth < 1.0) {
      cyclePhase = 'contraction'
      nextPhase = 'trough'
      riskAssessment = 'High'
      recommendations.push('Implement recession strategies - focus on cash flow')
    } else if (gdpGrowth < 0) {
      cyclePhase = 'trough'
      nextPhase = 'expansion'
      riskAssessment = 'Very High'
      recommendations.push('Prepare for recovery - look for investment opportunities')
    }

    // Analyze unemployment
    if (unemploymentRate > 7.0) {
      if (cyclePhase === 'expansion') cyclePhase = 'contraction'
      recommendations.push('High unemployment indicates economic weakness')
    } else if (unemploymentRate < 4.0) {
      if (cyclePhase === 'expansion') cyclePhase = 'peak'
      recommendations.push('Low unemployment may indicate labor market tightness')
    }

    // Analyze inflation
    if (inflationRate > 3.0) {
      recommendations.push('High inflation may require monetary tightening')
    } else if (inflationRate < 1.0) {
      recommendations.push('Low inflation may indicate deflationary pressures')
    }

    // Analyze confidence indicators
    if (consumerConfidence < 60) {
      recommendations.push('Low consumer confidence may signal economic weakness')
    }
    
    if (businessConfidence < 60) {
      recommendations.push('Low business confidence may reduce investment')
    }

    // Generate economic indicators analysis
    economicIndicators = [
      { name: 'GDP Growth', value: gdpGrowth, status: gdpGrowth > 2.0 ? 'positive' : 'negative' },
      { name: 'Unemployment', value: unemploymentRate, status: unemploymentRate < 6.0 ? 'positive' : 'negative' },
      { name: 'Inflation', value: inflationRate, status: inflationRate > 1.0 && inflationRate < 3.0 ? 'positive' : 'negative' },
      { name: 'Interest Rates', value: interestRate, status: interestRate < 5.0 ? 'positive' : 'negative' },
      { name: 'Consumer Confidence', value: consumerConfidence, status: consumerConfidence > 70 ? 'positive' : 'negative' },
      { name: 'Business Confidence', value: businessConfidence, status: businessConfidence > 65 ? 'positive' : 'negative' }
    ]

    // Add phase-specific recommendations
    const currentPhaseData = cyclePhases.find(phase => phase.id === cyclePhase)
    if (currentPhaseData) {
      recommendations.push(`Current phase: ${currentPhaseData.name} - ${currentPhaseData.description}`)
    }

    // Add industry-specific recommendations
    if (industry === 'banking') {
      recommendations.push('Monitor interest rate sensitivity and credit quality')
    } else if (industry === 'manufacturing') {
      recommendations.push('Watch for supply chain disruptions and demand fluctuations')
    } else if (industry === 'retail') {
      recommendations.push('Monitor consumer spending patterns and inventory levels')
    }

    setAnalysisResults({
      cyclePhase,
      phaseDuration,
      nextPhase,
      recommendations,
      economicIndicators,
      riskAssessment
    })
  }

  const handleInputChange = (field, value) => {
    setCycleData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }))
  }

  const renderCycleAnalysis = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="h-6 w-6 text-cyan-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Business Cycle Analysis
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Analyze economic indicators to determine current business cycle phase
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Economic Indicators */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Economic Indicators</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  GDP Growth Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cycleData.gdpGrowth}
                  onChange={(e) => handleInputChange('gdpGrowth', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Unemployment Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cycleData.unemploymentRate}
                  onChange={(e) => handleInputChange('unemploymentRate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Inflation Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cycleData.inflationRate}
                  onChange={(e) => handleInputChange('inflationRate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cycleData.interestRate}
                  onChange={(e) => handleInputChange('interestRate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Confidence Indicators */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Confidence Indicators</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Consumer Confidence (0-100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cycleData.consumerConfidence}
                  onChange={(e) => handleInputChange('consumerConfidence', e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>0</span>
                  <span className="font-medium">{cycleData.consumerConfidence}</span>
                  <span>100</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Business Confidence (0-100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cycleData.businessConfidence}
                  onChange={(e) => handleInputChange('businessConfidence', e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>0</span>
                  <span className="font-medium">{cycleData.businessConfidence}</span>
                  <span>100</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Time Horizon
                </label>
                <select
                  value={cycleData.timeHorizon}
                  onChange={(e) => setCycleData(prev => ({ ...prev, timeHorizon: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="short">Short-term (1-2 years)</option>
                  <option value="medium">Medium-term (3-5 years)</option>
                  <option value="long">Long-term (5+ years)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={analyzeBusinessCycle}
              className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Analyze Business Cycle</span>
            </button>
            
            {analysisResults.cyclePhase && (
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
    if (!analysisResults.cyclePhase) return null

    const currentPhase = cyclePhases.find(phase => phase.id === analysisResults.cyclePhase)
    const riskColor = analysisResults.riskAssessment === 'Very High' ? 'red' : 
                     analysisResults.riskAssessment === 'High' ? 'orange' : 
                     analysisResults.riskAssessment === 'Medium' ? 'yellow' : 'green'

    return (
      <div className="space-y-6">
        {/* Business Cycle Results */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Business Cycle Analysis Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                currentPhase?.color === 'green' ? 'text-green-600' :
                currentPhase?.color === 'yellow' ? 'text-yellow-600' :
                currentPhase?.color === 'orange' ? 'text-orange-600' : 'text-red-600'
              }`}>
                {currentPhase?.name}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Current Phase
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analysisResults.nextPhase}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Next Expected Phase
              </p>
            </div>

            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                riskColor === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                riskColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                riskColor === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {analysisResults.riskAssessment} Risk
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Risk Assessment
              </p>
            </div>
          </div>
        </div>

        {/* Economic Indicators */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Economic Indicators Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysisResults.economicIndicators.map((indicator, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${
                indicator.status === 'positive' 
                  ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
                  : 'border-red-200 bg-red-50 dark:bg-red-900/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {indicator.name}
                  </h4>
                  <div className={`w-3 h-3 rounded-full ${
                    indicator.status === 'positive' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {indicator.value}%
                </p>
              </div>
            ))}
          </div>
        </div>

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

        {/* Business Cycle Phases */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Business Cycle Phases
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cyclePhases.map((phase, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${
                analysisResults.cyclePhase === phase.id
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    phase.color === 'green' ? 'bg-green-500' :
                    phase.color === 'yellow' ? 'bg-yellow-500' :
                    phase.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                  }`}></div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {phase.name}
                  </h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {phase.description}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Duration: {phase.duration}
                </p>
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
            Business Cycle Theory
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analyze economic cycles and forecast business conditions
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
      {renderCycleAnalysis()}

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
                    {analysis.results.cyclePhase}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    - {analysis.results.riskAssessment} risk
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

export default BusinessCycleTheory
