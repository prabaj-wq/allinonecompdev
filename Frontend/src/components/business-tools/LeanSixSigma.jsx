import React, { useState, useEffect } from 'react'
import { 
  Workflow, 
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
  Globe,
  Activity,
  Brain,
  Plus,
  Edit,
  Trash2,
  Settings,
  Cpu,
  Database
} from 'lucide-react'

const LeanSixSigma = ({ industry, level }) => {
  const [leanData, setLeanData] = useState({
    processType: 'manufacturing',
    currentState: {
      cycleTime: 100,
      defectRate: 5.0,
      throughput: 80,
      wastePercentage: 15,
      customerSatisfaction: 75
    },
    targetState: {
      cycleTime: 80,
      defectRate: 2.0,
      throughput: 95,
      wastePercentage: 5,
      customerSatisfaction: 90
    },
    wasteTypes: [
      { id: 'overproduction', name: 'Overproduction', level: 'medium', impact: 'high' },
      { id: 'waiting', name: 'Waiting', level: 'high', impact: 'medium' },
      { id: 'transportation', name: 'Transportation', level: 'low', impact: 'low' },
      { id: 'inventory', name: 'Excess Inventory', level: 'medium', impact: 'high' },
      { id: 'motion', name: 'Unnecessary Motion', level: 'low', impact: 'low' },
      { id: 'defects', name: 'Defects', level: 'high', impact: 'very_high' },
      { id: 'overprocessing', name: 'Overprocessing', level: 'medium', impact: 'medium' },
      { id: 'skills', name: 'Underutilized Skills', level: 'low', impact: 'medium' }
    ]
  })

  const [analysisResults, setAnalysisResults] = useState({
    improvementPotential: null,
    wasteScore: null,
    recommendations: [],
    actionItems: [],
    expectedBenefits: [],
    implementationPriority: null
  })

  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [activeAnalysis, setActiveAnalysis] = useState('waste_analysis')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const processTypes = [
    { id: 'manufacturing', name: 'Manufacturing', description: 'Production and assembly processes' },
    { id: 'service', name: 'Service', description: 'Customer service and support processes' },
    { id: 'administrative', name: 'Administrative', description: 'Office and administrative processes' },
    { id: 'logistics', name: 'Logistics', description: 'Supply chain and distribution processes' },
    { id: 'healthcare', name: 'Healthcare', description: 'Medical and healthcare processes' },
    { id: 'financial', name: 'Financial', description: 'Banking and financial processes' }
  ]

  const wasteLevels = [
    { id: 'none', name: 'None', color: 'green', weight: 0 },
    { id: 'low', name: 'Low', color: 'yellow', weight: 1 },
    { id: 'medium', name: 'Medium', color: 'orange', weight: 2 },
    { id: 'high', name: 'High', color: 'red', weight: 3 }
  ]

  const impactLevels = [
    { id: 'low', name: 'Low', weight: 1 },
    { id: 'medium', name: 'Medium', weight: 2 },
    { id: 'high', name: 'High', weight: 3 },
    { id: 'very_high', name: 'Very High', weight: 4 }
  ]

  const industryDefaults = {
    banking: {
      processType: 'financial',
      currentState: { cycleTime: 120, defectRate: 3.0, throughput: 85, wastePercentage: 12, customerSatisfaction: 80 },
      targetState: { cycleTime: 90, defectRate: 1.0, throughput: 95, wastePercentage: 5, customerSatisfaction: 92 }
    },
    manufacturing: {
      processType: 'manufacturing',
      currentState: { cycleTime: 100, defectRate: 5.0, throughput: 80, wastePercentage: 15, customerSatisfaction: 75 },
      targetState: { cycleTime: 80, defectRate: 2.0, throughput: 95, wastePercentage: 5, customerSatisfaction: 90 }
    },
    retail: {
      processType: 'service',
      currentState: { cycleTime: 60, defectRate: 2.0, throughput: 90, wastePercentage: 10, customerSatisfaction: 85 },
      targetState: { cycleTime: 45, defectRate: 1.0, throughput: 98, wastePercentage: 3, customerSatisfaction: 95 }
    },
    healthcare: {
      processType: 'healthcare',
      currentState: { cycleTime: 150, defectRate: 1.5, throughput: 70, wastePercentage: 20, customerSatisfaction: 80 },
      targetState: { cycleTime: 120, defectRate: 0.5, throughput: 85, wastePercentage: 8, customerSatisfaction: 95 }
    },
    technology: {
      processType: 'administrative',
      currentState: { cycleTime: 80, defectRate: 3.0, throughput: 85, wastePercentage: 12, customerSatisfaction: 82 },
      targetState: { cycleTime: 60, defectRate: 1.0, throughput: 95, wastePercentage: 5, customerSatisfaction: 92 }
    },
    energy: {
      processType: 'manufacturing',
      currentState: { cycleTime: 200, defectRate: 2.0, throughput: 75, wastePercentage: 18, customerSatisfaction: 78 },
      targetState: { cycleTime: 150, defectRate: 1.0, throughput: 90, wastePercentage: 8, customerSatisfaction: 88 }
    },
    real_estate: {
      processType: 'service',
      currentState: { cycleTime: 180, defectRate: 4.0, throughput: 70, wastePercentage: 16, customerSatisfaction: 75 },
      targetState: { cycleTime: 120, defectRate: 2.0, throughput: 85, wastePercentage: 8, customerSatisfaction: 88 }
    },
    general: {
      processType: 'administrative',
      currentState: { cycleTime: 100, defectRate: 5.0, throughput: 80, wastePercentage: 15, customerSatisfaction: 75 },
      targetState: { cycleTime: 80, defectRate: 2.0, throughput: 95, wastePercentage: 5, customerSatisfaction: 90 }
    }
  }

  useEffect(() => {
    loadSavedAnalyses()
    
    // Set industry defaults
    const defaults = industryDefaults[industry] || industryDefaults.general
    setLeanData(prev => ({
      ...prev,
      processType: defaults.processType,
      currentState: defaults.currentState,
      targetState: defaults.targetState
    }))
  }, [industry])

  const loadSavedAnalyses = () => {
    try {
      const saved = localStorage.getItem('leanSixSigmaAnalyses')
      if (saved) {
        setSavedAnalyses(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved analyses:', error)
    }
  }

  const saveAnalysis = () => {
    if (!analysisResults.improvementPotential) return

    const newAnalysis = {
      id: Date.now(),
      leanData: { ...leanData },
      results: { ...analysisResults },
      timestamp: new Date().toISOString(),
      industry
    }

    const updated = [...savedAnalyses, newAnalysis]
    setSavedAnalyses(updated)
    localStorage.setItem('leanSixSigmaAnalyses', JSON.stringify(updated))
  }

  const analyzeLeanSixSigma = () => {
    const { currentState, targetState, wasteTypes } = leanData
    
    // Calculate improvement potential
    const cycleTimeImprovement = ((currentState.cycleTime - targetState.cycleTime) / currentState.cycleTime) * 100
    const defectRateImprovement = ((currentState.defectRate - targetState.defectRate) / currentState.defectRate) * 100
    const throughputImprovement = ((targetState.throughput - currentState.throughput) / currentState.throughput) * 100
    const wasteReduction = ((currentState.wastePercentage - targetState.wastePercentage) / currentState.wastePercentage) * 100
    const satisfactionImprovement = ((targetState.customerSatisfaction - currentState.customerSatisfaction) / currentState.customerSatisfaction) * 100
    
    const improvementPotential = (cycleTimeImprovement + defectRateImprovement + throughputImprovement + wasteReduction + satisfactionImprovement) / 5

    // Calculate waste score
    const wasteScore = wasteTypes.reduce((total, waste) => {
      const levelWeight = wasteLevels.find(l => l.id === waste.level)?.weight || 0
      const impactWeight = impactLevels.find(i => i.id === waste.impact)?.weight || 0
      return total + (levelWeight * impactWeight)
    }, 0)

    // Generate recommendations
    const recommendations = []
    
    if (wasteScore > 20) {
      recommendations.push('High waste levels detected - implement 5S methodology')
    }
    
    if (currentState.defectRate > 3.0) {
      recommendations.push('High defect rate - apply Six Sigma DMAIC methodology')
    }
    
    if (currentState.cycleTime > 120) {
      recommendations.push('Long cycle times - implement value stream mapping')
    }
    
    if (currentState.wastePercentage > 15) {
      recommendations.push('High waste percentage - focus on waste elimination')
    }
    
    if (currentState.customerSatisfaction < 80) {
      recommendations.push('Low customer satisfaction - implement customer-focused improvements')
    }

    // Generate action items
    const actionItems = []
    
    // High impact wastes
    const highImpactWastes = wasteTypes.filter(waste => waste.impact === 'very_high' || waste.impact === 'high')
    if (highImpactWastes.length > 0) {
      actionItems.push('Address high-impact waste types first')
    }
    
    // Medium and high level wastes
    const significantWastes = wasteTypes.filter(waste => waste.level === 'high' || waste.level === 'medium')
    if (significantWastes.length > 0) {
      actionItems.push('Implement waste reduction strategies for significant waste types')
    }
    
    if (improvementPotential > 30) {
      actionItems.push('High improvement potential - prioritize quick wins')
    }

    // Expected benefits
    const expectedBenefits = []
    
    if (cycleTimeImprovement > 20) {
      expectedBenefits.push(`${cycleTimeImprovement.toFixed(1)}% reduction in cycle time`)
    }
    
    if (defectRateImprovement > 30) {
      expectedBenefits.push(`${defectRateImprovement.toFixed(1)}% reduction in defect rate`)
    }
    
    if (throughputImprovement > 15) {
      expectedBenefits.push(`${throughputImprovement.toFixed(1)}% increase in throughput`)
    }
    
    if (wasteReduction > 40) {
      expectedBenefits.push(`${wasteReduction.toFixed(1)}% reduction in waste`)
    }
    
    if (satisfactionImprovement > 10) {
      expectedBenefits.push(`${satisfactionImprovement.toFixed(1)}% improvement in customer satisfaction`)
    }

    // Implementation priority
    let implementationPriority = 'Medium'
    if (wasteScore > 25 || improvementPotential > 40) {
      implementationPriority = 'High'
    } else if (wasteScore < 10 && improvementPotential < 20) {
      implementationPriority = 'Low'
    }

    setAnalysisResults({
      improvementPotential,
      wasteScore,
      recommendations,
      actionItems,
      expectedBenefits,
      implementationPriority,
      cycleTimeImprovement,
      defectRateImprovement,
      throughputImprovement,
      wasteReduction,
      satisfactionImprovement
    })
  }

  const handleInputChange = (field, value) => {
    setLeanData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStateChange = (state, field, value) => {
    setLeanData(prev => ({
      ...prev,
      [state]: {
        ...prev[state],
        [field]: parseFloat(value) || 0
      }
    }))
  }

  const handleWasteChange = (wasteId, field, value) => {
    setLeanData(prev => ({
      ...prev,
      wasteTypes: prev.wasteTypes.map(waste => 
        waste.id === wasteId ? { ...waste, [field]: value } : waste
      )
    }))
  }

  const renderWasteAnalysis = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Workflow className="h-6 w-6 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Lean Six Sigma Analysis
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Analyze process efficiency and identify waste elimination opportunities
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Process Configuration */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Process Configuration</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Process Type
                </label>
                <select
                  value={leanData.processType}
                  onChange={(e) => handleInputChange('processType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {processTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current vs Target State */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Performance Metrics</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Cycle Time (min)
                  </label>
                  <input
                    type="number"
                    value={leanData.currentState.cycleTime}
                    onChange={(e) => handleStateChange('currentState', 'cycleTime', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Target Cycle Time (min)
                  </label>
                  <input
                    type="number"
                    value={leanData.targetState.cycleTime}
                    onChange={(e) => handleStateChange('targetState', 'cycleTime', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Defect Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={leanData.currentState.defectRate}
                    onChange={(e) => handleStateChange('currentState', 'defectRate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Target Defect Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={leanData.targetState.defectRate}
                    onChange={(e) => handleStateChange('targetState', 'defectRate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Throughput (%)
                  </label>
                  <input
                    type="number"
                    value={leanData.currentState.throughput}
                    onChange={(e) => handleStateChange('currentState', 'throughput', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Target Throughput (%)
                  </label>
                  <input
                    type="number"
                    value={leanData.targetState.throughput}
                    onChange={(e) => handleStateChange('targetState', 'throughput', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Waste (%)
                  </label>
                  <input
                    type="number"
                    value={leanData.currentState.wastePercentage}
                    onChange={(e) => handleStateChange('currentState', 'wastePercentage', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Target Waste (%)
                  </label>
                  <input
                    type="number"
                    value={leanData.targetState.wastePercentage}
                    onChange={(e) => handleStateChange('targetState', 'wastePercentage', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 8 Wastes Analysis */}
          <div className="mt-6">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">8 Wastes Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {leanData.wasteTypes.map((waste) => (
                <div key={waste.id} className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                  <h5 className="font-medium text-slate-900 dark:text-white mb-3">{waste.name}</h5>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Level
                      </label>
                      <select
                        value={waste.level}
                        onChange={(e) => handleWasteChange(waste.id, 'level', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      >
                        {wasteLevels.map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Impact
                      </label>
                      <select
                        value={waste.impact}
                        onChange={(e) => handleWasteChange(waste.id, 'impact', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      >
                        {impactLevels.map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={analyzeLeanSixSigma}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Analyze Process</span>
            </button>
            
            {analysisResults.improvementPotential && (
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
    if (!analysisResults.improvementPotential) return null

    const priorityColor = analysisResults.implementationPriority === 'High' ? 'red' : 
                         analysisResults.implementationPriority === 'Medium' ? 'yellow' : 'green'

    return (
      <div className="space-y-6">
        {/* Lean Six Sigma Results */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Lean Six Sigma Analysis Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {analysisResults.improvementPotential.toFixed(1)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Improvement Potential
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {analysisResults.wasteScore}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Waste Score
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analysisResults.cycleTimeImprovement.toFixed(1)}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Cycle Time Improvement
              </p>
            </div>

            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                priorityColor === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                priorityColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {analysisResults.implementationPriority} Priority
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Implementation Priority
              </p>
            </div>
          </div>
        </div>

        {/* Expected Benefits */}
        {analysisResults.expectedBenefits.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Expected Benefits</span>
            </h3>
            <ul className="space-y-2">
              {analysisResults.expectedBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-600 dark:text-slate-400">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {analysisResults.recommendations.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              <span>Improvement Recommendations</span>
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

        {/* Action Items */}
        {analysisResults.actionItems.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <span>Action Items</span>
            </h3>
            <ul className="space-y-2">
              {analysisResults.actionItems.map((item, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-600 dark:text-slate-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lean Six Sigma Methodology */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Lean Six Sigma Methodology
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Lean Principles</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Value identification</li>
                <li>• Value stream mapping</li>
                <li>• Flow optimization</li>
                <li>• Pull systems</li>
                <li>• Continuous improvement</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Six Sigma DMAIC</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Define the problem</li>
                <li>• Measure current performance</li>
                <li>• Analyze root causes</li>
                <li>• Improve the process</li>
                <li>• Control the improvements</li>
              </ul>
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
            Lean & Six Sigma
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analyze process efficiency and implement continuous improvement
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
      {renderWasteAnalysis()}

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
                    {analysis.results.improvementPotential.toFixed(1)}% improvement potential
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    - {analysis.results.implementationPriority} priority
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

export default LeanSixSigma
