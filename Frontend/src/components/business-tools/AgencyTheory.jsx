import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Shield, 
  Target,
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
  Brain,
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
  Unlock
} from 'lucide-react'

const AgencyTheory = ({ industry, level }) => {
  const [agencyData, setAgencyData] = useState({
    principalType: 'shareholders',
    agentType: 'management',
    alignmentLevel: 70,
    monitoringCosts: 5,
    incentiveIntensity: 60,
    informationAsymmetry: 30,
    contractLength: 3,
    performanceMetrics: ['revenue', 'profit', 'stock_price']
  })

  const [analysisResults, setAnalysisResults] = useState({
    agencyCosts: null,
    alignmentScore: null,
    riskAssessment: null,
    recommendations: [],
    governanceScore: null
  })

  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [activeAnalysis, setActiveAnalysis] = useState('basic')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const principalTypes = [
    { id: 'shareholders', name: 'Shareholders', description: 'Company owners and investors' },
    { id: 'board', name: 'Board of Directors', description: 'Elected representatives' },
    { id: 'creditors', name: 'Creditors', description: 'Lenders and bondholders' },
    { id: 'employees', name: 'Employees', description: 'Workforce and unions' },
    { id: 'customers', name: 'Customers', description: 'End users and clients' }
  ]

  const agentTypes = [
    { id: 'management', name: 'Management', description: 'Executive team and managers' },
    { id: 'ceo', name: 'CEO', description: 'Chief Executive Officer' },
    { id: 'cfo', name: 'CFO', description: 'Chief Financial Officer' },
    { id: 'board_members', name: 'Board Members', description: 'Individual board members' },
    { id: 'employees', name: 'Employees', description: 'General workforce' }
  ]

  const performanceMetrics = [
    { id: 'revenue', name: 'Revenue Growth', weight: 25 },
    { id: 'profit', name: 'Profit Margin', weight: 30 },
    { id: 'stock_price', name: 'Stock Price', weight: 20 },
    { id: 'market_share', name: 'Market Share', weight: 15 },
    { id: 'customer_satisfaction', name: 'Customer Satisfaction', weight: 10 }
  ]

  const industryDefaults = {
    banking: { alignmentLevel: 75, monitoringCosts: 8, incentiveIntensity: 70, informationAsymmetry: 25 },
    manufacturing: { alignmentLevel: 65, monitoringCosts: 6, incentiveIntensity: 55, informationAsymmetry: 35 },
    retail: { alignmentLevel: 60, monitoringCosts: 4, incentiveIntensity: 50, informationAsymmetry: 40 },
    healthcare: { alignmentLevel: 80, monitoringCosts: 10, incentiveIntensity: 75, informationAsymmetry: 20 },
    technology: { alignmentLevel: 70, monitoringCosts: 5, incentiveIntensity: 80, informationAsymmetry: 30 },
    energy: { alignmentLevel: 85, monitoringCosts: 12, incentiveIntensity: 65, informationAsymmetry: 15 },
    real_estate: { alignmentLevel: 75, monitoringCosts: 7, incentiveIntensity: 60, informationAsymmetry: 25 },
    general: { alignmentLevel: 70, monitoringCosts: 5, incentiveIntensity: 60, informationAsymmetry: 30 }
  }

  useEffect(() => {
    loadSavedAnalyses()
    
    // Set industry defaults
    const defaults = industryDefaults[industry] || industryDefaults.general
    setAgencyData(prev => ({
      ...prev,
      alignmentLevel: defaults.alignmentLevel,
      monitoringCosts: defaults.monitoringCosts,
      incentiveIntensity: defaults.incentiveIntensity,
      informationAsymmetry: defaults.informationAsymmetry
    }))
  }, [industry])

  const loadSavedAnalyses = () => {
    try {
      const saved = localStorage.getItem('agencyAnalyses')
      if (saved) {
        setSavedAnalyses(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved analyses:', error)
    }
  }

  const saveAnalysis = () => {
    if (!analysisResults.agencyCosts) return

    const newAnalysis = {
      id: Date.now(),
      agencyData: { ...agencyData },
      results: { ...analysisResults },
      timestamp: new Date().toISOString(),
      industry
    }

    const updated = [...savedAnalyses, newAnalysis]
    setSavedAnalyses(updated)
    localStorage.setItem('agencyAnalyses', JSON.stringify(updated))
  }

  const analyzeAgencyTheory = () => {
    const { alignmentLevel, monitoringCosts, incentiveIntensity, informationAsymmetry, contractLength } = agencyData
    
    // Calculate agency costs (simplified model)
    const monitoringCostsNum = parseFloat(monitoringCosts)
    const informationAsymmetryNum = parseFloat(informationAsymmetry) / 100
    const alignmentLevelNum = parseFloat(alignmentLevel) / 100
    
    // Agency costs increase with information asymmetry and decrease with alignment
    const agencyCosts = monitoringCostsNum + (informationAsymmetryNum * 20) - (alignmentLevelNum * 10)
    
    // Calculate alignment score
    const alignmentScore = (alignmentLevelNum * 0.4) + ((100 - informationAsymmetryNum) * 0.3) + (parseFloat(incentiveIntensity) / 100 * 0.3)
    
    // Calculate governance score
    const governanceScore = (alignmentScore * 0.5) + ((100 - agencyCosts) * 0.3) + (parseFloat(contractLength) / 5 * 0.2)
    
    // Risk assessment
    let riskAssessment = 'Low'
    if (agencyCosts > 15 || alignmentScore < 0.5) {
      riskAssessment = 'High'
    } else if (agencyCosts > 10 || alignmentScore < 0.7) {
      riskAssessment = 'Medium'
    }
    
    // Generate recommendations
    const recommendations = []
    
    if (alignmentScore < 0.6) {
      recommendations.push('Improve incentive alignment between principals and agents')
    }
    
    if (informationAsymmetryNum > 0.4) {
      recommendations.push('Reduce information asymmetry through better reporting')
    }
    
    if (monitoringCostsNum > 8) {
      recommendations.push('Optimize monitoring costs - consider automated systems')
    }
    
    if (parseFloat(incentiveIntensity) < 50) {
      recommendations.push('Increase incentive intensity to improve performance')
    }
    
    if (parseFloat(contractLength) < 2) {
      recommendations.push('Consider longer-term contracts for better alignment')
    }
    
    if (governanceScore > 0.8) {
      recommendations.push('Excellent governance structure - maintain current practices')
    }

    setAnalysisResults({
      agencyCosts: Math.max(0, agencyCosts),
      alignmentScore: alignmentScore * 100,
      riskAssessment,
      recommendations,
      governanceScore: governanceScore * 100
    })
  }

  const handleInputChange = (field, value) => {
    setAgencyData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMetricToggle = (metricId) => {
    setAgencyData(prev => ({
      ...prev,
      performanceMetrics: prev.performanceMetrics.includes(metricId)
        ? prev.performanceMetrics.filter(id => id !== metricId)
        : [...prev.performanceMetrics, metricId]
    }))
  }

  const renderAnalysisForm = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Agency Theory Analysis
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Analyze the relationship between principals and agents in your organization
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Principal and Agent Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Principal Type
                </label>
                <select
                  value={agencyData.principalType}
                  onChange={(e) => handleInputChange('principalType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {principalTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Agent Type
                </label>
                <select
                  value={agencyData.agentType}
                  onChange={(e) => handleInputChange('agentType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {agentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Alignment Level (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={agencyData.alignmentLevel}
                  onChange={(e) => handleInputChange('alignmentLevel', e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>0%</span>
                  <span className="font-medium">{agencyData.alignmentLevel}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Information Asymmetry (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={agencyData.informationAsymmetry}
                  onChange={(e) => handleInputChange('informationAsymmetry', e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>0%</span>
                  <span className="font-medium">{agencyData.informationAsymmetry}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Monitoring Costs (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={agencyData.monitoringCosts}
                  onChange={(e) => handleInputChange('monitoringCosts', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Incentive Intensity (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={agencyData.incentiveIntensity}
                  onChange={(e) => handleInputChange('incentiveIntensity', e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>0%</span>
                  <span className="font-medium">{agencyData.incentiveIntensity}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Contract Length (years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={agencyData.contractLength}
                  onChange={(e) => handleInputChange('contractLength', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Performance Metrics
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {performanceMetrics.map((metric) => (
                <label key={metric.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agencyData.performanceMetrics.includes(metric.id)}
                    onChange={() => handleMetricToggle(metric.id)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {metric.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={analyzeAgencyTheory}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Analyze Agency Theory</span>
            </button>
            
            {analysisResults.agencyCosts && (
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
    if (!analysisResults.agencyCosts) return null

    const riskColor = analysisResults.riskAssessment === 'High' ? 'red' : 
                     analysisResults.riskAssessment === 'Medium' ? 'yellow' : 'green'

    return (
      <div className="space-y-6">
        {/* Agency Theory Results */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Agency Theory Analysis Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {analysisResults.agencyCosts.toFixed(1)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Agency Costs
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analysisResults.alignmentScore.toFixed(1)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Alignment Score
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analysisResults.governanceScore.toFixed(1)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Governance Score
              </p>
            </div>

            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                riskColor === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                riskColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
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

        {/* Recommendations */}
        {analysisResults.recommendations.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span>Governance Recommendations</span>
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

        {/* Agency Theory Explanation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Agency Theory Overview
          </h3>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Agency Theory examines the relationship between principals (owners/investors) and agents (managers/employees) 
              and the conflicts that arise when their interests are not perfectly aligned.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Key Concepts</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Information Asymmetry</li>
                  <li>• Moral Hazard</li>
                  <li>• Adverse Selection</li>
                  <li>• Monitoring Costs</li>
                </ul>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Solutions</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Incentive Alignment</li>
                  <li>• Performance Monitoring</li>
                  <li>• Contract Design</li>
                  <li>• Governance Structures</li>
                </ul>
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
            Agency Theory
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analyze principal-agent relationships and governance structures
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
      {renderAnalysisForm()}

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
                    {analysis.results.alignmentScore.toFixed(1)}% alignment
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    - {analysis.results.agencyCosts.toFixed(1)}% agency costs
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

export default AgencyTheory
