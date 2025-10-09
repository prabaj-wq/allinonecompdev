import React, { useState, useEffect } from 'react'
import { 
  Compass, 
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
  Trash2
} from 'lucide-react'

const SWOTAnalysis = ({ industry, level }) => {
  const [swotData, setSwotData] = useState({
    strengths: [
      { id: 1, text: 'Strong brand recognition', impact: 'high', category: 'marketing' },
      { id: 2, text: 'Experienced management team', impact: 'high', category: 'leadership' }
    ],
    weaknesses: [
      { id: 1, text: 'Limited market presence', impact: 'medium', category: 'market' },
      { id: 2, text: 'High operational costs', impact: 'high', category: 'operations' }
    ],
    opportunities: [
      { id: 1, text: 'Growing market demand', impact: 'high', category: 'market' },
      { id: 2, text: 'Technology advancement', impact: 'medium', category: 'technology' }
    ],
    threats: [
      { id: 1, text: 'Intense competition', impact: 'high', category: 'competition' },
      { id: 2, text: 'Economic downturn', impact: 'medium', category: 'economic' }
    ]
  })

  const [analysisResults, setAnalysisResults] = useState({
    overallScore: null,
    strategicPriorities: [],
    recommendations: [],
    actionItems: [],
    riskAssessment: null
  })

  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [activeAnalysis, setActiveAnalysis] = useState('swot_matrix')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const impactLevels = [
    { id: 'low', name: 'Low', color: 'green', weight: 1 },
    { id: 'medium', name: 'Medium', color: 'yellow', weight: 2 },
    { id: 'high', name: 'High', color: 'red', weight: 3 }
  ]

  const categories = {
    strengths: [
      { id: 'marketing', name: 'Marketing & Brand' },
      { id: 'operations', name: 'Operations' },
      { id: 'finance', name: 'Financial' },
      { id: 'technology', name: 'Technology' },
      { id: 'leadership', name: 'Leadership' },
      { id: 'human_resources', name: 'Human Resources' }
    ],
    weaknesses: [
      { id: 'market', name: 'Market Position' },
      { id: 'operations', name: 'Operations' },
      { id: 'finance', name: 'Financial' },
      { id: 'technology', name: 'Technology' },
      { id: 'leadership', name: 'Leadership' },
      { id: 'human_resources', name: 'Human Resources' }
    ],
    opportunities: [
      { id: 'market', name: 'Market Expansion' },
      { id: 'technology', name: 'Technology' },
      { id: 'partnerships', name: 'Partnerships' },
      { id: 'regulatory', name: 'Regulatory' },
      { id: 'economic', name: 'Economic' },
      { id: 'social', name: 'Social Trends' }
    ],
    threats: [
      { id: 'competition', name: 'Competition' },
      { id: 'economic', name: 'Economic' },
      { id: 'regulatory', name: 'Regulatory' },
      { id: 'technology', name: 'Technology' },
      { id: 'market', name: 'Market' },
      { id: 'operational', name: 'Operational' }
    ]
  }

  const industryDefaults = {
    banking: {
      strengths: [
        { text: 'Strong regulatory compliance', impact: 'high', category: 'regulatory' },
        { text: 'Established customer base', impact: 'high', category: 'market' }
      ],
      weaknesses: [
        { text: 'High regulatory costs', impact: 'high', category: 'finance' },
        { text: 'Legacy technology systems', impact: 'medium', category: 'technology' }
      ],
      opportunities: [
        { text: 'Digital banking growth', impact: 'high', category: 'technology' },
        { text: 'Fintech partnerships', impact: 'medium', category: 'partnerships' }
      ],
      threats: [
        { text: 'Fintech disruption', impact: 'high', category: 'competition' },
        { text: 'Interest rate volatility', impact: 'medium', category: 'economic' }
      ]
    },
    manufacturing: {
      strengths: [
        { text: 'Efficient production processes', impact: 'high', category: 'operations' },
        { text: 'Quality control systems', impact: 'high', category: 'operations' }
      ],
      weaknesses: [
        { text: 'High capital requirements', impact: 'high', category: 'finance' },
        { text: 'Supply chain dependencies', impact: 'medium', category: 'operations' }
      ],
      opportunities: [
        { text: 'Automation and Industry 4.0', impact: 'high', category: 'technology' },
        { text: 'Emerging markets expansion', impact: 'medium', category: 'market' }
      ],
      threats: [
        { text: 'Raw material price volatility', impact: 'high', category: 'economic' },
        { text: 'Environmental regulations', impact: 'medium', category: 'regulatory' }
      ]
    },
    retail: {
      strengths: [
        { text: 'Strong brand portfolio', impact: 'high', category: 'marketing' },
        { text: 'Omnichannel presence', impact: 'high', category: 'technology' }
      ],
      weaknesses: [
        { text: 'High inventory costs', impact: 'high', category: 'finance' },
        { text: 'Seasonal demand fluctuations', impact: 'medium', category: 'market' }
      ],
      opportunities: [
        { text: 'E-commerce growth', impact: 'high', category: 'technology' },
        { text: 'Personalization trends', impact: 'medium', category: 'social' }
      ],
      threats: [
        { text: 'Online competition', impact: 'high', category: 'competition' },
        { text: 'Changing consumer preferences', impact: 'medium', category: 'market' }
      ]
    },
    general: {
      strengths: [
        { text: 'Strong team capabilities', impact: 'high', category: 'human_resources' },
        { text: 'Innovative products', impact: 'high', category: 'technology' }
      ],
      weaknesses: [
        { text: 'Limited resources', impact: 'medium', category: 'finance' },
        { text: 'Market awareness', impact: 'medium', category: 'marketing' }
      ],
      opportunities: [
        { text: 'Market growth', impact: 'high', category: 'market' },
        { text: 'Technology advancement', impact: 'medium', category: 'technology' }
      ],
      threats: [
        { text: 'Competitive pressure', impact: 'high', category: 'competition' },
        { text: 'Economic uncertainty', impact: 'medium', category: 'economic' }
      ]
    }
  }

  useEffect(() => {
    loadSavedAnalyses()
    
    // Set industry defaults
    const defaults = industryDefaults[industry] || industryDefaults.general
    setSwotData(prev => ({
      strengths: defaults.strengths.map((item, index) => ({ ...item, id: index + 1 })),
      weaknesses: defaults.weaknesses.map((item, index) => ({ ...item, id: index + 1 })),
      opportunities: defaults.opportunities.map((item, index) => ({ ...item, id: index + 1 })),
      threats: defaults.threats.map((item, index) => ({ ...item, id: index + 1 }))
    }))
  }, [industry])

  const loadSavedAnalyses = () => {
    try {
      const saved = localStorage.getItem('swotAnalyses')
      if (saved) {
        setSavedAnalyses(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved analyses:', error)
    }
  }

  const saveAnalysis = () => {
    if (!analysisResults.overallScore) return

    const newAnalysis = {
      id: Date.now(),
      swotData: { ...swotData },
      results: { ...analysisResults },
      timestamp: new Date().toISOString(),
      industry
    }

    const updated = [...savedAnalyses, newAnalysis]
    setSavedAnalyses(updated)
    localStorage.setItem('swotAnalyses', JSON.stringify(updated))
  }

  const addItem = (category) => {
    const newItem = {
      id: Date.now(),
      text: '',
      impact: 'medium',
      category: categories[category][0].id
    }
    
    setSwotData(prev => ({
      ...prev,
      [category]: [...prev[category], newItem]
    }))
    
    setEditingItem(newItem.id)
  }

  const updateItem = (category, itemId, field, value) => {
    setSwotData(prev => ({
      ...prev,
      [category]: prev[category].map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }))
  }

  const deleteItem = (category, itemId) => {
    setSwotData(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== itemId)
    }))
  }

  const analyzeSWOT = () => {
    // Calculate overall score based on impact levels
    const calculateCategoryScore = (items) => {
      return items.reduce((sum, item) => {
        const impactWeight = impactLevels.find(level => level.id === item.impact)?.weight || 1
        return sum + impactWeight
      }, 0)
    }

    const strengthsScore = calculateCategoryScore(swotData.strengths)
    const weaknessesScore = calculateCategoryScore(swotData.weaknesses)
    const opportunitiesScore = calculateCategoryScore(swotData.opportunities)
    const threatsScore = calculateCategoryScore(swotData.threats)

    const overallScore = (strengthsScore + opportunitiesScore) - (weaknessesScore + threatsScore)

    // Determine strategic priorities
    const strategicPriorities = []
    
    if (strengthsScore > weaknessesScore) {
      strategicPriorities.push('Leverage strengths to capitalize on opportunities')
    } else {
      strategicPriorities.push('Address weaknesses before pursuing opportunities')
    }
    
    if (threatsScore > opportunitiesScore) {
      strategicPriorities.push('Develop defensive strategies against threats')
    } else {
      strategicPriorities.push('Focus on growth opportunities')
    }

    // Generate recommendations
    const recommendations = []
    
    // SO Strategies (Strengths + Opportunities)
    if (strengthsScore > 0 && opportunitiesScore > 0) {
      recommendations.push('Develop aggressive growth strategies leveraging strengths')
    }
    
    // WO Strategies (Weaknesses + Opportunities)
    if (weaknessesScore > 0 && opportunitiesScore > 0) {
      recommendations.push('Address weaknesses to capitalize on opportunities')
    }
    
    // ST Strategies (Strengths + Threats)
    if (strengthsScore > 0 && threatsScore > 0) {
      recommendations.push('Use strengths to defend against threats')
    }
    
    // WT Strategies (Weaknesses + Threats)
    if (weaknessesScore > 0 && threatsScore > 0) {
      recommendations.push('Implement defensive strategies to minimize weaknesses and threats')
    }

    // Generate action items
    const actionItems = []
    
    // High impact strengths
    const highImpactStrengths = swotData.strengths.filter(item => item.impact === 'high')
    if (highImpactStrengths.length > 0) {
      actionItems.push('Maximize utilization of high-impact strengths')
    }
    
    // High impact weaknesses
    const highImpactWeaknesses = swotData.weaknesses.filter(item => item.impact === 'high')
    if (highImpactWeaknesses.length > 0) {
      actionItems.push('Prioritize addressing high-impact weaknesses')
    }
    
    // High impact opportunities
    const highImpactOpportunities = swotData.opportunities.filter(item => item.impact === 'high')
    if (highImpactOpportunities.length > 0) {
      actionItems.push('Develop strategies to capture high-impact opportunities')
    }
    
    // High impact threats
    const highImpactThreats = swotData.threats.filter(item => item.impact === 'high')
    if (highImpactThreats.length > 0) {
      actionItems.push('Develop contingency plans for high-impact threats')
    }

    // Risk assessment
    let riskAssessment = 'Low'
    if (threatsScore > 6) riskAssessment = 'High'
    else if (threatsScore > 3) riskAssessment = 'Medium'

    setAnalysisResults({
      overallScore,
      strategicPriorities,
      recommendations,
      actionItems,
      riskAssessment,
      strengthsScore,
      weaknessesScore,
      opportunitiesScore,
      threatsScore
    })
  }

  const renderSWOTMatrix = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Compass className="h-6 w-6 text-teal-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              SWOT Analysis Matrix
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Analyze your organization's internal strengths and weaknesses, and external opportunities and threats
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Strengths
                </h4>
                <button
                  onClick={() => addItem('strengths')}
                  className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {swotData.strengths.map((item) => (
                  <div key={item.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    {editingItem === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => updateItem('strengths', item.id, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter strength"
                        />
                        <div className="flex space-x-2">
                          <select
                            value={item.impact}
                            onChange={(e) => updateItem('strengths', item.id, 'impact', e.target.value)}
                            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            {impactLevels.map((level) => (
                              <option key={level.id} value={level.id}>
                                {level.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={item.category}
                            onChange={(e) => updateItem('strengths', item.id, 'category', e.target.value)}
                            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            {categories.strengths.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">{item.text}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.impact === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              item.impact === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {item.impact}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {categories.strengths.find(cat => cat.id === item.category)?.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingItem(item.id)}
                            className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteItem('strengths', item.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Weaknesses
                </h4>
                <button
                  onClick={() => addItem('weaknesses')}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {swotData.weaknesses.map((item) => (
                  <div key={item.id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    {editingItem === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => updateItem('weaknesses', item.id, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="Enter weakness"
                        />
                        <div className="flex space-x-2">
                          <select
                            value={item.impact}
                            onChange={(e) => updateItem('weaknesses', item.id, 'impact', e.target.value)}
                            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            {impactLevels.map((level) => (
                              <option key={level.id} value={level.id}>
                                {level.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={item.category}
                            onChange={(e) => updateItem('weaknesses', item.id, 'category', e.target.value)}
                            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            {categories.weaknesses.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">{item.text}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.impact === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              item.impact === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {item.impact}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {categories.weaknesses.find(cat => cat.id === item.category)?.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingItem(item.id)}
                            className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteItem('weaknesses', item.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  Opportunities
                </h4>
                <button
                  onClick={() => addItem('opportunities')}
                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {swotData.opportunities.map((item) => (
                  <div key={item.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    {editingItem === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => updateItem('opportunities', item.id, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter opportunity"
                        />
                        <div className="flex space-x-2">
                          <select
                            value={item.impact}
                            onChange={(e) => updateItem('opportunities', item.id, 'impact', e.target.value)}
                            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            {impactLevels.map((level) => (
                              <option key={level.id} value={level.id}>
                                {level.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={item.category}
                            onChange={(e) => updateItem('opportunities', item.id, 'category', e.target.value)}
                            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            {categories.opportunities.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">{item.text}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.impact === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              item.impact === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {item.impact}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {categories.opportunities.find(cat => cat.id === item.category)?.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingItem(item.id)}
                            className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteItem('opportunities', item.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Threats */}
            <div className="bg-white dark:bg-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  Threats
                </h4>
                <button
                  onClick={() => addItem('threats')}
                  className="p-2 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {swotData.threats.map((item) => (
                  <div key={item.id} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    {editingItem === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => updateItem('threats', item.id, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter threat"
                        />
                        <div className="flex space-x-2">
                          <select
                            value={item.impact}
                            onChange={(e) => updateItem('threats', item.id, 'impact', e.target.value)}
                            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            {impactLevels.map((level) => (
                              <option key={level.id} value={level.id}>
                                {level.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={item.category}
                            onChange={(e) => updateItem('threats', item.id, 'category', e.target.value)}
                            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            {categories.threats.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="px-2 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">{item.text}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.impact === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              item.impact === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {item.impact}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {categories.threats.find(cat => cat.id === item.category)?.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingItem(item.id)}
                            className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteItem('threats', item.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={analyzeSWOT}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>Analyze SWOT</span>
            </button>
            
            {analysisResults.overallScore && (
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
    if (!analysisResults.overallScore) return null

    const scoreColor = analysisResults.overallScore > 0 ? 'green' : 
                     analysisResults.overallScore > -3 ? 'yellow' : 'red'

    return (
      <div className="space-y-6">
        {/* SWOT Results */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              SWOT Analysis Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                scoreColor === 'green' ? 'text-green-600' :
                scoreColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analysisResults.overallScore > 0 ? '+' : ''}{analysisResults.overallScore}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Overall Score
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analysisResults.strengthsScore}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Strengths Score
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analysisResults.opportunitiesScore}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Opportunities Score
              </p>
            </div>

            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                analysisResults.riskAssessment === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                analysisResults.riskAssessment === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
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

        {/* Strategic Priorities */}
        {analysisResults.strategicPriorities.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Strategic Priorities</span>
            </h3>
            <ul className="space-y-2">
              {analysisResults.strategicPriorities.map((priority, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-600 dark:text-slate-400">{priority}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {analysisResults.recommendations.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span>Strategic Recommendations</span>
            </h3>
            <ul className="space-y-2">
              {analysisResults.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
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
              <Activity className="h-5 w-5 text-green-500" />
              <span>Action Items</span>
            </h3>
            <ul className="space-y-2">
              {analysisResults.actionItems.map((item, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-600 dark:text-slate-400">{item}</span>
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
            SWOT Analysis
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analyze strengths, weaknesses, opportunities, and threats
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
      {renderSWOTMatrix()}

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
                    Score: {analysis.results.overallScore > 0 ? '+' : ''}{analysis.results.overallScore}
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

export default SWOTAnalysis
