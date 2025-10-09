import React, { useState, useEffect } from 'react'
import { 
  Zap, 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Brain, 
  Eye, 
  BookOpen,
  Settings,
  Play,
  Target,
  Activity,
  Wind,
  Calculator,
  PieChart,
  LineChart,
  Globe,
  Users,
  Building,
  DollarSign,
  Percent,
  Calendar,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  Share,
  Lock,
  Unlock,
  Database,
  Cpu,
  Layers,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react'

const QuantumFinance = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [quantumMode, setQuantumMode] = useState(false)
  const [selectedBusinessContext, setSelectedBusinessContext] = useState('general')
  const [customizationLevel, setCustomizationLevel] = useState('basic')

  // Forecasting state
  const [forecastData, setForecastData] = useState(null)
  const [forecastModels, setForecastModels] = useState([])
  const [forecastHorizon, setForecastHorizon] = useState('medium')
  const [forecastAssumptions, setForecastAssumptions] = useState({})
  const [forecastScenarios, setForecastScenarios] = useState([])
  const [forecastAccuracy, setForecastAccuracy] = useState({})
  const [selectedModels, setSelectedModels] = useState([])

  // Market Sentiment state
  const [sentimentData, setSentimentData] = useState(null)
  const [sentimentSources, setSentimentSources] = useState([])
  const [sentimentWeights, setSentimentWeights] = useState({})
  const [sentimentTrends, setSentimentTrends] = useState([])
  const [sentimentAlerts, setSentimentAlerts] = useState([])
  const [sentimentThreshold, setSentimentThreshold] = useState(0.5)

  // Quantum Finance state
  const [quantumParameters, setQuantumParameters] = useState({})
  const [quantumAlgorithms, setQuantumAlgorithms] = useState([])
  const [quantumOptimization, setQuantumOptimization] = useState({})

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3, description: 'Quantum Finance Dashboard' },
    { id: 'portfolio', name: 'Portfolio Optimization', icon: Target, description: 'Quantum-Inspired Portfolio Optimization' },
    { id: 'risk', name: 'Risk Modeling', icon: Shield, description: 'Advanced Risk & Scenario Analysis' },
    { id: 'forecast', name: 'Forecasting', icon: TrendingUp, description: 'Hybrid Forecasting Models' },
    { id: 'sentiment', name: 'Market Sentiment', icon: Brain, description: 'AI-Based Sentiment Integration' },
    { id: 'visual', name: 'Visual Tools', icon: Eye, description: 'Interactive Exploration' },
    { id: 'education', name: 'Education', icon: BookOpen, description: 'Tutorials & Simulations' },
    { id: 'crypto', name: 'Quantum-Safe Crypto', icon: Shield, description: 'Quantum-Safe Cryptography' }
  ]

  const businessContexts = [
    { id: 'general', name: 'General', description: 'Standard quantum finance models' },
    { id: 'banking', name: 'Banking', description: 'Commercial and investment banking' },
    { id: 'insurance', name: 'Insurance', description: 'Insurance and reinsurance' },
    { id: 'hedge_fund', name: 'Hedge Fund', description: 'Alternative investments' },
    { id: 'pension', name: 'Pension Fund', description: 'Retirement and pension funds' },
    { id: 'retail', name: 'Retail Investment', description: 'Individual and retail investors' }
  ]

  const customizationLevels = [
    { id: 'basic', name: 'Basic', description: 'Pre-configured models with simple customization' },
    { id: 'advanced', name: 'Advanced', description: 'Full parameter control and business-specific models' },
    { id: 'expert', name: 'Expert', description: 'Complete customization with quantum algorithm tuning' }
  ]

  useEffect(() => {
    console.log('🔮 Quantum Finance component loaded successfully!')
    console.log('Current URL:', window.location.pathname)
    console.log('Component is rendering...')
    
    // Initialize advanced data
    initializeAdvancedData()
  }, [])

  const initializeAdvancedData = () => {
    // Initialize forecasting models
    setForecastModels([
      {
        id: 'arima',
        name: 'ARIMA',
        description: 'AutoRegressive Integrated Moving Average',
        type: 'time_series',
        parameters: { p: 1, d: 1, q: 1 },
        accuracy: 0.85,
        category: 'Traditional'
      },
      {
        id: 'exponential_smoothing',
        name: 'Exponential Smoothing',
        description: 'Holt-Winters exponential smoothing',
        type: 'time_series',
        parameters: { alpha: 0.3, beta: 0.1, gamma: 0.1 },
        accuracy: 0.82,
        category: 'Traditional'
      },
      {
        id: 'quantum_annealing',
        name: 'Quantum Annealing',
        description: 'Quantum-inspired optimization for forecasting',
        type: 'quantum',
        parameters: { temperature: 1.0, iterations: 1000 },
        accuracy: 0.88,
        category: 'Quantum'
      },
      {
        id: 'hybrid_quantum',
        name: 'Hybrid Quantum',
        description: 'Traditional + Quantum hybrid model',
        type: 'hybrid',
        parameters: { quantum_weight: 0.6, traditional_weight: 0.4 },
        accuracy: 0.91,
        category: 'Hybrid'
      },
      {
        id: 'monte_carlo',
        name: 'Monte Carlo',
        description: 'Stochastic simulation with quantum enhancement',
        type: 'simulation',
        parameters: { iterations: 10000, confidence: 0.95 },
        accuracy: 0.87,
        category: 'Simulation'
      },
      {
        id: 'lstm_neural',
        name: 'LSTM Neural Network',
        description: 'Long Short-Term Memory with quantum features',
        type: 'neural',
        parameters: { layers: 3, neurons: 128, epochs: 100 },
        accuracy: 0.89,
        category: 'Neural'
      }
    ])

    // Initialize sentiment sources
    setSentimentSources([
      {
        id: 'twitter',
        name: 'Twitter/X',
        type: 'social_media',
        weight: 0.3,
        active: true,
        description: 'Real-time social media sentiment'
      },
      {
        id: 'news',
        name: 'Financial News',
        type: 'news',
        weight: 0.4,
        active: true,
        description: 'Professional financial news sources'
      },
      {
        id: 'reddit',
        name: 'Reddit',
        type: 'social_media',
        weight: 0.2,
        active: true,
        description: 'Community discussions and sentiment'
      },
      {
        id: 'analyst_reports',
        name: 'Analyst Reports',
        type: 'professional',
        weight: 0.1,
        active: true,
        description: 'Professional analyst opinions'
      },
      {
        id: 'youtube',
        name: 'YouTube',
        type: 'social_media',
        weight: 0.15,
        active: false,
        description: 'Video content sentiment analysis'
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        type: 'professional',
        weight: 0.1,
        active: false,
        description: 'Professional network sentiment'
      }
    ])

    // Initialize quantum parameters
    setQuantumParameters({
      annealing_temperature: 1.0,
      quantum_iterations: 1000,
      superposition_factor: 0.5,
      entanglement_strength: 0.7,
      decoherence_rate: 0.1,
      quantum_noise: 0.05,
      coherence_time: 100
    })

    // Initialize default assumptions
    setForecastAssumptions({
      sales_growth_rate: 5.0,
      inflation_rate: 2.5,
      cost_growth_rate: 3.0,
      market_share: 15.0,
      competitive_pressure: 'medium',
      regulatory_impact: 'neutral',
      technology_disruption: 'low',
      economic_cycle: 'expansion'
    })
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quantum Finance Status */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">🔮 Quantum Finance Engine</h2>
            <p className="text-purple-100">Advanced quantum-inspired financial analytics and optimization</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${quantumMode ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm">{quantumMode ? 'Quantum Mode Active' : 'Classical Mode'}</span>
          </div>
        </div>
      </div>

      {/* Business Context Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Business Context Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Business Context</label>
            <select 
              value={selectedBusinessContext}
              onChange={(e) => setSelectedBusinessContext(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              {businessContexts.map(context => (
                <option key={context.id} value={context.id}>
                  {context.name} - {context.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Customization Level</label>
            <select 
              value={customizationLevel}
              onChange={(e) => setCustomizationLevel(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              {customizationLevels.map(level => (
                <option key={level.id} value={level.id}>
                  {level.name} - {level.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tabs.slice(1).map(tab => (
          <div 
            key={tab.id}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setActiveTab(tab.id)}
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                <tab.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold ml-3">{tab.name}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{tab.description}</p>
            <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm">
              <span>Explore</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quantum Finance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quantum Entanglement</p>
              <p className="text-2xl font-bold">87.3%</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Superposition Coherence</p>
              <p className="text-2xl font-bold">92.1%</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quantum Tunneling</p>
              <p className="text-2xl font-bold">15.7%</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Wind className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPortfolioOptimization = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Target className="w-6 h-6 mr-2" />
          Quantum-Inspired Portfolio Optimization
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Use classical algorithms mimicking quantum annealing to efficiently optimize investment portfolios.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Portfolio Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Portfolio Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  placeholder="Enter portfolio name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Risk Tolerance</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span>Conservative (0.0)</span>
                  <span>Aggressive (1.0)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Optimization Type</label>
                <select className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                  <option value="quantum_annealing">Quantum Annealing</option>
                  <option value="classical">Classical</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
            <div className="space-y-3">
              {['Stocks', 'Bonds', 'Commodities', 'Real Estate', 'Crypto'].map((asset, index) => (
                <div key={asset} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <span className="font-medium">{asset}</span>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12">0%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-4">
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-colors flex items-center">
            <Play className="w-4 h-4 mr-2" />
            Optimize Portfolio
          </button>
          <button className="px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )

  const renderRiskModeling = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Shield className="w-6 h-6 mr-2" />
          Advanced Risk Modeling & Scenario Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Monte Carlo simulations with enhanced parallelism to model non-linear risks and multi-factor stress scenarios.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Scenario Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Scenario Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  placeholder="Enter scenario name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Scenario Type</label>
                <select className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                  <option value="monte_carlo">Monte Carlo</option>
                  <option value="stress_test">Stress Test</option>
                  <option value="var">Value at Risk (VaR)</option>
                  <option value="cvar">Conditional VaR</option>
                  <option value="quantum_risk">Quantum Risk</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confidence Level</label>
                <select className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                  <option value="0.95">95%</option>
                  <option value="0.99">99%</option>
                  <option value="0.999">99.9%</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Risk Factors</h3>
            <div className="space-y-3">
              {['Market Risk', 'Credit Risk', 'Liquidity Risk', 'Operational Risk'].map((factor, index) => (
                <div key={factor} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-3" defaultChecked />
                    <span className="font-medium">{factor}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      className="w-16"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8">50%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Simulation Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Simulation Runs</label>
                <input 
                  type="number" 
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  defaultValue="10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time Horizon (Days)</label>
                <input 
                  type="number" 
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  defaultValue="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Business Context</label>
                <select className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                  <option value="banking">Banking</option>
                  <option value="insurance">Insurance</option>
                  <option value="hedge_fund">Hedge Fund</option>
                  <option value="pension">Pension Fund</option>
                  <option value="retail">Retail Investment</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-4">
          <button className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg hover:from-red-600 hover:to-orange-700 transition-colors flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Run Risk Simulation
          </button>
          <button className="px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            Save Scenario
          </button>
        </div>
      </div>
    </div>
  )

  // Forecasting functions
  const runForecast = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate sample forecast data
      const sampleData = {
        horizon: forecastHorizon,
        models: selectedModels.length > 0 ? selectedModels : forecastModels.slice(0, 2),
        assumptions: forecastAssumptions,
        scenarios: forecastScenarios,
        accuracy: { overall: 0.87, best_model: 'hybrid_quantum' },
        timestamp: new Date().toISOString()
      }
      
      setForecastData(sampleData)
      console.log('✅ Forecast completed successfully')
    } catch (error) {
      console.error('❌ Forecast failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeSentiment = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate sample sentiment data
      const sampleData = {
        sources: sentimentSources.filter(s => s.active),
        weights: sentimentWeights,
        trends: [
          { date: '2024-01-01', sentiment: 0.65, volume: 1000 },
          { date: '2024-01-02', sentiment: 0.68, volume: 1200 },
          { date: '2024-01-03', sentiment: 0.62, volume: 900 }
        ],
        alerts: [
          { type: 'positive', message: 'Strong positive sentiment detected', confidence: 0.85 },
          { type: 'volume', message: 'Unusual volume spike detected', confidence: 0.92 }
        ],
        timestamp: new Date().toISOString()
      }
      
      setSentimentData(sampleData)
      console.log('✅ Sentiment analysis completed successfully')
    } catch (error) {
      console.error('❌ Sentiment analysis failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderForecasting = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Advanced Forecasting
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={runForecast}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            <span>{isLoading ? 'Running...' : 'Run Forecast'}</span>
          </button>
          
          {forecastData && (
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Forecast Models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Models
          </h3>
          <div className="space-y-3">
            {forecastModels.map((model) => (
              <div key={model.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedModels.some(m => m.id === model.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedModels(prev => [...prev, model])
                      } else {
                        setSelectedModels(prev => prev.filter(m => m.id !== model.id))
                      }
                    }}
                    className="h-4 w-4 text-purple-600 rounded"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{model.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{model.description}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                      model.category === 'Quantum' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      model.category === 'Hybrid' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      model.category === 'Neural' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {model.category}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round(model.accuracy * 100)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Accuracy</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Forecast Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Forecast Horizon
              </label>
              <select
                value={forecastHorizon}
                onChange={(e) => setForecastHorizon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              >
                <option value="short">Short-term (1-3 months)</option>
                <option value="medium">Medium-term (3-12 months)</option>
                <option value="long">Long-term (1-5 years)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Context
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                <option value="retail">Retail & E-commerce</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="financial">Financial Services</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="energy">Energy & Utilities</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Volatility Regime
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                <option value="low">Low Volatility</option>
                <option value="medium">Medium Volatility</option>
                <option value="high">High Volatility</option>
                <option value="crisis">Crisis Mode</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Parameters */}
      {(customizationLevel === 'advanced' || customizationLevel === 'expert') && (
        <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Advanced Parameters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sales Growth Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={forecastAssumptions.sales_growth_rate}
                onChange={(e) => setForecastAssumptions(prev => ({
                  ...prev,
                  sales_growth_rate: parseFloat(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Inflation Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={forecastAssumptions.inflation_rate}
                onChange={(e) => setForecastAssumptions(prev => ({
                  ...prev,
                  inflation_rate: parseFloat(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cost Growth Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={forecastAssumptions.cost_growth_rate}
                onChange={(e) => setForecastAssumptions(prev => ({
                  ...prev,
                  cost_growth_rate: parseFloat(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Market Share (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={forecastAssumptions.market_share}
                onChange={(e) => setForecastAssumptions(prev => ({
                  ...prev,
                  market_share: parseFloat(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Competitive Pressure
              </label>
              <select 
                value={forecastAssumptions.competitive_pressure}
                onChange={(e) => setForecastAssumptions(prev => ({
                  ...prev,
                  competitive_pressure: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="extreme">Extreme</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Regulatory Impact
              </label>
              <select 
                value={forecastAssumptions.regulatory_impact}
                onChange={(e) => setForecastAssumptions(prev => ({
                  ...prev,
                  regulatory_impact: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              >
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Quantum Parameters */}
      {customizationLevel === 'expert' && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">
            Quantum Parameters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                Annealing Temperature
              </label>
              <input
                type="number"
                step="0.1"
                value={quantumParameters.annealing_temperature}
                onChange={(e) => setQuantumParameters(prev => ({
                  ...prev,
                  annealing_temperature: parseFloat(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                Quantum Iterations
              </label>
              <input
                type="number"
                value={quantumParameters.quantum_iterations}
                onChange={(e) => setQuantumParameters(prev => ({
                  ...prev,
                  quantum_iterations: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                Superposition Factor
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={quantumParameters.superposition_factor}
                onChange={(e) => setQuantumParameters(prev => ({
                  ...prev,
                  superposition_factor: parseFloat(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                Entanglement Strength
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={quantumParameters.entanglement_strength}
                onChange={(e) => setQuantumParameters(prev => ({
                  ...prev,
                  entanglement_strength: parseFloat(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                Decoherence Rate
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={quantumParameters.decoherence_rate}
                onChange={(e) => setQuantumParameters(prev => ({
                  ...prev,
                  decoherence_rate: parseFloat(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Scenario Analysis */}
      {(customizationLevel === 'advanced' || customizationLevel === 'expert') && (
        <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Scenario Analysis & What-If Modeling
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Base Case</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Growth Rate:</span>
                  <span className="font-medium">{forecastAssumptions.sales_growth_rate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Market Share:</span>
                  <span className="font-medium">{forecastAssumptions.market_share}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Competition:</span>
                  <span className="font-medium capitalize">{forecastAssumptions.competitive_pressure}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Optimistic Case</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Growth Rate:</span>
                  <span className="font-medium text-green-600">+{forecastAssumptions.sales_growth_rate * 1.5}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Market Share:</span>
                  <span className="font-medium text-green-600">+{forecastAssumptions.market_share * 1.3}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Competition:</span>
                  <span className="font-medium text-green-600">Low</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Pessimistic Case</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Growth Rate:</span>
                  <span className="font-medium text-red-600">{forecastAssumptions.sales_growth_rate * 0.5}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Market Share:</span>
                  <span className="font-medium text-red-600">{forecastAssumptions.market_share * 0.7}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Competition:</span>
                  <span className="font-medium text-red-600">Extreme</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Custom Scenario Builder</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scenario Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  placeholder="e.g., Economic Recession"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Probability (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  placeholder="25"
                />
              </div>
            </div>
            <div className="mt-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Custom Scenario</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Results */}
      {forecastData && (
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-4">
            Forecast Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                {Math.round(forecastData.accuracy.overall * 100)}%
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Overall Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                {forecastData.horizon === 'short' ? '3' : forecastData.horizon === 'medium' ? '12' : '60'}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Months Horizon</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                {forecastData.models.length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Models Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                {Math.round(Math.random() * 20 + 80)}%
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Confidence Level</div>
            </div>
          </div>
          
          {/* Advanced Performance Metrics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Model Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Best Model:</span>
                  <span className="font-medium text-purple-600">Hybrid Quantum</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">RMSE:</span>
                  <span className="font-medium">0.0234</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">MAE:</span>
                  <span className="font-medium">0.0187</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">R² Score:</span>
                  <span className="font-medium text-green-600">0.91</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Risk Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">VaR (95%):</span>
                  <span className="font-medium text-red-600">-2.3%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">CVaR (95%):</span>
                  <span className="font-medium text-red-600">-3.1%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Max Drawdown:</span>
                  <span className="font-medium text-orange-600">-5.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sharpe Ratio:</span>
                  <span className="font-medium text-green-600">1.47</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderMarketSentiment = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Market Sentiment Analysis
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={analyzeSentiment}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            <span>{isLoading ? 'Analyzing...' : 'Analyze Sentiment'}</span>
          </button>
          
          {sentimentData && (
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="h-4 w-4" />
              <span>Export Analysis</span>
            </button>
          )}
        </div>
      </div>

      {/* Sentiment Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sentiment Sources
          </h3>
          
          <div className="space-y-3">
            {sentimentSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={source.active}
                    onChange={(e) => {
                      setSentimentSources(prev => prev.map(s => 
                        s.id === source.id ? { ...s, active: e.target.checked } : s
                      ))
                    }}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{source.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{source.description}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                      source.type === 'social_media' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      source.type === 'news' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}>
                      {source.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={source.weight}
                    onChange={(e) => {
                      setSentimentSources(prev => prev.map(s => 
                        s.id === source.id ? { ...s, weight: parseFloat(e.target.value) } : s
                      ))
                    }}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Weight</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sentiment Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Decay Factor
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                placeholder="0.8"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sentiment Threshold
              </label>
              <input
                type="number"
                step="0.1"
                min="-1"
                max="1"
                value={sentimentThreshold}
                onChange={(e) => setSentimentThreshold(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alert Sensitivity
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="extreme">Extreme</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Geographic Focus
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                <option value="global">Global</option>
                <option value="north_america">North America</option>
                <option value="europe">Europe</option>
                <option value="asia">Asia</option>
                <option value="emerging_markets">Emerging Markets</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Sentiment Features */}
      {(customizationLevel === 'advanced' || customizationLevel === 'expert') && (
        <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Advanced Sentiment Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Keyword Tracking
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                rows="3"
                placeholder="Enter keywords to track (one per line)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entity Tracking
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                rows="3"
                placeholder="Enter entities to track (one per line)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Industry Focus
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                <option value="all">All Industries</option>
                <option value="technology">Technology</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="energy">Energy</option>
                <option value="retail">Retail</option>
                <option value="manufacturing">Manufacturing</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment-Forecast Integration */}
      {forecastData && sentimentData && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">
            Sentiment-Forecast Integration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Sentiment Impact on Forecast</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sentiment Score:</span>
                  <span className="font-medium text-blue-600">0.65</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Forecast Adjustment:</span>
                  <span className="font-medium text-green-600">+2.3%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Confidence Impact:</span>
                  <span className="font-medium text-purple-600">+5.2%</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Risk-Adjusted Forecast</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Base Forecast:</span>
                  <span className="font-medium">{forecastData.accuracy.overall * 100}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sentiment Adjusted:</span>
                  <span className="font-medium text-blue-600">{(forecastData.accuracy.overall * 100) + 5.2}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Risk Level:</span>
                  <span className="font-medium text-orange-600">Medium</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment Results */}
      {sentimentData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">
            Sentiment Analysis Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">0.65</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Overall Sentiment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {sentimentData.sources.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Active Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">12</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Trending Topics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {sentimentData.alerts.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Active Alerts</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderVisualTools = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Visual Exploration Tools
        </h2>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Plus className="h-4 w-4" />
            <span>Add Widget</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Save className="h-4 w-4" />
            <span>Save Dashboard</span>
          </button>
        </div>
      </div>

      {/* Dashboard Builder */}
      <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Interactive Dashboard Builder
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Widget Library */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Widget Library</h4>
            <div className="space-y-2">
              {[
                { name: 'Price Chart', icon: LineChart, type: 'chart' },
                { name: 'Volume Analysis', icon: BarChart3, type: 'chart' },
                { name: 'Sentiment Gauge', icon: Brain, type: 'gauge' },
                { name: 'Risk Metrics', icon: Shield, type: 'metrics' },
                { name: 'Portfolio Pie', icon: PieChart, type: 'chart' },
                { name: 'Heat Map', icon: Activity, type: 'heatmap' },
                { name: 'Correlation Matrix', icon: Database, type: 'matrix' },
                { name: 'News Feed', icon: Globe, type: 'feed' }
              ].map((widget, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                  <widget.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">{widget.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Canvas */}
          <div className="lg:col-span-3">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Dashboard Canvas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-96 bg-white dark:bg-slate-800 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
              {/* Sample Widgets */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-blue-900 dark:text-blue-200">Price Movement</h5>
                  <div className="flex space-x-1">
                    <button className="p-1 text-blue-600 hover:bg-blue-200 rounded">
                      <Maximize2 className="h-3 w-3" />
                    </button>
                    <button className="p-1 text-blue-600 hover:bg-blue-200 rounded">
                      <Settings className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="h-32 bg-white dark:bg-slate-700 rounded flex items-center justify-center">
                  <LineChart className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-green-900 dark:text-green-200">Sentiment Score</h5>
                  <div className="flex space-x-1">
                    <button className="p-1 text-green-600 hover:bg-green-200 rounded">
                      <Maximize2 className="h-3 w-3" />
                    </button>
                    <button className="p-1 text-green-600 hover:bg-green-200 rounded">
                      <Settings className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="h-32 bg-white dark:bg-slate-700 rounded flex items-center justify-center">
                  <Brain className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-purple-900 dark:text-purple-200">Risk Metrics</h5>
                  <div className="flex space-x-1">
                    <button className="p-1 text-purple-600 hover:bg-purple-200 rounded">
                      <Maximize2 className="h-3 w-3" />
                    </button>
                    <button className="p-1 text-purple-600 hover:bg-purple-200 rounded">
                      <Settings className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="h-32 bg-white dark:bg-slate-700 rounded flex items-center justify-center">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-orange-900 dark:text-orange-200">Portfolio Allocation</h5>
                  <div className="flex space-x-1">
                    <button className="p-1 text-orange-600 hover:bg-orange-200 rounded">
                      <Maximize2 className="h-3 w-3" />
                    </button>
                    <button className="p-1 text-orange-600 hover:bg-orange-200 rounded">
                      <Settings className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="h-32 bg-white dark:bg-slate-700 rounded flex items-center justify-center">
                  <PieChart className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Advanced Technical Indicators
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">RSI (Relative Strength Index)</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Current RSI:</span>
                <span className="font-medium text-blue-600">67.3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Signal:</span>
                <span className="font-medium text-green-600">Neutral</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '67.3%'}}></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Bollinger Bands</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Upper Band:</span>
                <span className="font-medium text-red-600">$125.40</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Middle Band:</span>
                <span className="font-medium text-gray-600">$118.20</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Lower Band:</span>
                <span className="font-medium text-green-600">$111.00</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">MACD</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">MACD Line:</span>
                <span className="font-medium text-blue-600">2.34</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Signal Line:</span>
                <span className="font-medium text-orange-600">1.89</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Histogram:</span>
                <span className="font-medium text-green-600">+0.45</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantum-Enhanced Analytics */}
      <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">
          Quantum-Enhanced Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Quantum Correlation Analysis</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Stock A vs Stock B</span>
                <span className="text-sm font-medium text-purple-600">0.87</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Market vs Sentiment</span>
                <span className="text-sm font-medium text-purple-600">0.72</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Risk vs Return</span>
                <span className="text-sm font-medium text-purple-600">0.65</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Quantum Pattern Recognition</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Bullish Pattern</span>
                <span className="text-sm font-medium text-green-600">85% Confidence</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Support Level</span>
                <span className="text-sm font-medium text-blue-600">$115.20</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Resistance Level</span>
                <span className="text-sm font-medium text-red-600">$128.50</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Data Streams */}
      <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Real-Time Data Streams
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Live Market Data</h4>
            <div className="space-y-2">
              {[
                { symbol: 'AAPL', price: '$175.43', change: '+2.34%', volume: '45.2M' },
                { symbol: 'GOOGL', price: '$142.67', change: '-1.23%', volume: '23.1M' },
                { symbol: 'MSFT', price: '$378.91', change: '+0.87%', volume: '18.7M' },
                { symbol: 'TSLA', price: '$248.12', change: '+3.45%', volume: '67.3M' }
              ].map((stock, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{stock.symbol}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{stock.price}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${stock.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.change}
                    </span>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{stock.volume}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">News & Events</h4>
            <div className="space-y-2">
              {[
                { title: 'Fed announces interest rate decision', time: '2 min ago', impact: 'High' },
                { title: 'Tech earnings beat expectations', time: '15 min ago', impact: 'Medium' },
                { title: 'Oil prices surge on supply concerns', time: '1 hour ago', impact: 'High' },
                { title: 'Cryptocurrency market volatility', time: '2 hours ago', impact: 'Medium' }
              ].map((news, index) => (
                <div key={index} className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{news.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{news.time}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      news.impact === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      news.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {news.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderQuantumSafeCrypto = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quantum-Safe Cryptography
        </h2>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Shield className="h-4 w-4" />
            <span>Enable Quantum-Safe Mode</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="h-4 w-4" />
            <span>Export Keys</span>
          </button>
        </div>
      </div>

      {/* Security Status Dashboard */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">🔐 Quantum-Safe Security Status</h3>
            <p className="text-purple-100">Advanced post-quantum cryptography protection active</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm">Quantum-Safe Mode Active</span>
          </div>
        </div>
      </div>

      {/* Post-Quantum Encryption Algorithms */}
      <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Post-Quantum Encryption Algorithms
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">CRYSTALS-Kyber</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-medium">Key Encapsulation</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Security Level:</span>
                <span className="font-medium text-green-600">Level 3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">CRYSTALS-Dilithium</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-medium">Digital Signature</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Security Level:</span>
                <span className="font-medium text-green-600">Level 3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">SPHINCS+</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-medium">Hash-Based Signature</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Security Level:</span>
                <span className="font-medium text-green-600">Level 5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Integration */}
      <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Blockchain Integration & Smart Contracts
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Smart Contract Security</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Financial Data Contract</span>
                <span className="text-sm font-medium text-green-600">Verified</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Portfolio Management</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Risk Assessment</span>
                <span className="text-sm font-medium text-blue-600">Pending</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Audit Trail</span>
                <span className="text-sm font-medium text-green-600">Immutable</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Blockchain Networks</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Ethereum Mainnet</span>
                <span className="text-sm font-medium text-blue-600">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Polygon</span>
                <span className="text-sm font-medium text-purple-600">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Arbitrum</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Base</span>
                <span className="text-sm font-medium text-orange-600">Connecting...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantum Key Distribution */}
      <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">
          Quantum Key Distribution (QKD)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">QKD Network Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">BB84 Protocol</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">E91 Protocol</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Key Generation Rate</span>
                <span className="text-sm font-medium text-blue-600">1.2 Mbps</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Error Rate</span>
                <span className="text-sm font-medium text-green-600">0.02%</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Secure Communication</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">End-to-End Encryption</span>
                <span className="text-sm font-medium text-green-600">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Perfect Forward Secrecy</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Zero-Knowledge Proofs</span>
                <span className="text-sm font-medium text-blue-600">Available</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Homomorphic Encryption</span>
                <span className="text-sm font-medium text-purple-600">Experimental</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Security Features */}
      <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Advanced Security Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Multi-Factor Authentication</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="h-4 w-4 text-green-600 rounded" />
                <span className="text-sm text-gray-900 dark:text-white">Biometric Authentication</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="h-4 w-4 text-green-600 rounded" />
                <span className="text-sm text-gray-900 dark:text-white">Hardware Security Keys</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="h-4 w-4 text-green-600 rounded" />
                <span className="text-sm text-gray-900 dark:text-white">Quantum Random Numbers</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Data Protection</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="h-4 w-4 text-green-600 rounded" />
                <span className="text-sm text-gray-900 dark:text-white">Field-Level Encryption</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="h-4 w-4 text-green-600 rounded" />
                <span className="text-sm text-gray-900 dark:text-white">Data Masking</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="h-4 w-4 text-green-600 rounded" />
                <span className="text-sm text-gray-900 dark:text-white">Tokenization</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Compliance & Auditing</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="h-4 w-4 text-green-600 rounded" />
                <span className="text-sm text-gray-900 dark:text-white">GDPR Compliance</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="h-4 w-4 text-green-600 rounded" />
                <span className="text-sm text-gray-900 dark:text-white">SOX Compliance</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="h-4 w-4 text-green-600 rounded" />
                <span className="text-sm text-gray-900 dark:text-white">Real-time Auditing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Metrics Dashboard */}
      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-4">
          Security Metrics Dashboard
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">99.9%</div>
            <div className="text-sm text-green-600 dark:text-green-400">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">0</div>
            <div className="text-sm text-green-600 dark:text-green-400">Security Breaches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">256-bit</div>
            <div className="text-sm text-green-600 dark:text-green-400">Encryption Strength</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">24/7</div>
            <div className="text-sm text-green-600 dark:text-green-400">Monitoring</div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderEducation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Education & Learning Resources
        </h2>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <BookOpen className="h-4 w-4" />
            <span>Start Learning Path</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Target className="h-4 w-4" />
            <span>Take Assessment</span>
          </button>
        </div>
      </div>

      {/* Learning Path Overview */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">🎓 Quantum Finance Learning Journey</h3>
            <p className="text-blue-100">Master quantum finance concepts with curated resources and interactive tutorials</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">85%</div>
            <div className="text-sm text-blue-100">Progress</div>
          </div>
        </div>
      </div>

      {/* Interactive Tutorials */}
      <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Interactive Tutorials & Concepts
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Quantum Computing Basics</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">In Progress</span>
              </div>
            </div>
            <button className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Continue Learning
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Quantum Finance Theory</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Not Started</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Not Started</span>
              </div>
            </div>
            <button className="w-full mt-3 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
              Start Learning
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Practical Applications</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Not Started</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Not Started</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Not Started</span>
              </div>
            </div>
            <button className="w-full mt-3 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
              Start Learning
            </button>
          </div>
        </div>
      </div>

      {/* Curated Learning Resources */}
      <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Curated Learning Resources (25+ Sources)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Official Blogs & Research */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Official Blogs & Research</h4>
            <div className="space-y-2">
              {[
                { name: 'IBM Quantum Finance Blog', type: 'Official Blog', level: 'Intermediate', url: 'https://www.ibm.com/quantum/finance' },
                { name: 'Google Quantum AI Research', type: 'Research', level: 'Advanced', url: 'https://quantumai.google/' },
                { name: 'Microsoft Quantum Development', type: 'Official Blog', level: 'Beginner', url: 'https://azure.microsoft.com/en-us/solutions/quantum-computing/' },
                { name: 'Rigetti Quantum Computing', type: 'Official Blog', level: 'Intermediate', url: 'https://www.rigetti.com/' },
                { name: 'IonQ Quantum Finance', type: 'Research', level: 'Advanced', url: 'https://ionq.com/' },
                { name: 'D-Wave Quantum Finance', type: 'Official Blog', level: 'Intermediate', url: 'https://www.dwavesys.com/' },
                { name: 'Quantinuum (Honeywell)', type: 'Research', level: 'Advanced', url: 'https://www.quantinuum.com/' },
                { name: 'AWS Quantum Computing', type: 'Official Blog', level: 'Beginner', url: 'https://aws.amazon.com/braket/' }
              ].map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm">{resource.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{resource.type}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      resource.level === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      resource.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {resource.level}
                    </span>
                    <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Papers & Journals */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Academic Papers & Journals</h4>
            <div className="space-y-2">
              {[
                { name: 'Nature Quantum Information', type: 'Journal', level: 'Advanced', url: 'https://www.nature.com/nqi/' },
                { name: 'Physical Review A', type: 'Journal', level: 'Advanced', url: 'https://journals.aps.org/pra/' },
                { name: 'Quantum Finance: A Review', type: 'Paper', level: 'Advanced', url: 'https://arxiv.org/abs/quant-fin' },
                { name: 'Journal of Quantum Finance', type: 'Journal', level: 'Advanced', url: 'https://www.worldscientific.com/worldscinet/jqf' },
                { name: 'Quantum Machine Learning in Finance', type: 'Paper', level: 'Advanced', url: 'https://arxiv.org/abs/quant-ml-fin' },
                { name: 'IEEE Quantum Engineering', type: 'Journal', level: 'Intermediate', url: 'https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=8922110' },
                { name: 'Quantum Portfolio Optimization', type: 'Paper', level: 'Advanced', url: 'https://arxiv.org/abs/quant-portfolio' },
                { name: 'Quantum Risk Management', type: 'Paper', level: 'Advanced', url: 'https://arxiv.org/abs/quant-risk' }
              ].map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm">{resource.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{resource.type}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      resource.level === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      resource.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {resource.level}
                    </span>
                    <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Online Courses & Tutorials */}
        <div className="mt-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Online Courses & Tutorials</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {[
                { name: 'Coursera: Quantum Computing for Finance', type: 'Course', level: 'Intermediate', provider: 'Coursera' },
                { name: 'edX: Quantum Finance Fundamentals', type: 'Course', level: 'Beginner', provider: 'edX' },
                { name: 'Udemy: Quantum Portfolio Management', type: 'Course', level: 'Intermediate', provider: 'Udemy' },
                { name: 'MIT OpenCourseWare: Quantum Finance', type: 'Course', level: 'Advanced', provider: 'MIT' },
                { name: 'Stanford Online: Quantum Risk Analysis', type: 'Course', level: 'Advanced', provider: 'Stanford' }
              ].map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm">{resource.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{resource.provider}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      resource.level === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      resource.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {resource.level}
                    </span>
                    <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { name: 'YouTube: Quantum Finance Explained', type: 'Video Series', level: 'Beginner', provider: 'YouTube' },
                { name: 'Khan Academy: Quantum Computing', type: 'Tutorial', level: 'Beginner', provider: 'Khan Academy' },
                { name: 'Brilliant: Quantum Finance', type: 'Interactive', level: 'Intermediate', provider: 'Brilliant' },
                { name: 'Codecademy: Quantum Programming', type: 'Tutorial', level: 'Intermediate', provider: 'Codecademy' },
                { name: 'FreeCodeCamp: Quantum Finance', type: 'Tutorial', level: 'Beginner', provider: 'FreeCodeCamp' }
              ].map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm">{resource.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{resource.provider}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      resource.level === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      resource.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {resource.level}
                    </span>
                    <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Certification Paths */}
      <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">
          Certification Paths & Skill Assessment
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Available Certifications</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">IBM Quantum Developer</span>
                <span className="text-sm font-medium text-blue-600">Available</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Google Quantum Computing</span>
                <span className="text-sm font-medium text-green-600">Available</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Microsoft Quantum Developer</span>
                <span className="text-sm font-medium text-blue-600">Available</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Quantum Finance Specialist</span>
                <span className="text-sm font-medium text-purple-600">Coming Soon</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Skill Assessment</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Quantum Computing Basics</span>
                <span className="text-sm font-medium text-green-600">85%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Financial Mathematics</span>
                <span className="text-sm font-medium text-green-600">92%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Portfolio Optimization</span>
                <span className="text-sm font-medium text-yellow-600">67%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-gray-900 dark:text-white">Risk Management</span>
                <span className="text-sm font-medium text-blue-600">78%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community & Forums */}
      <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Community & Forums
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Reddit Communities</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">r/QuantumComputing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">r/QuantumFinance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">r/QuantitativeFinance</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Discord Servers</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Quantum Computing Hub</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Finance & Tech</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Quantum Finance</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Professional Networks</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">LinkedIn Groups</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Meetup Events</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-900 dark:text-white">Conference Talks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'portfolio':
        return renderPortfolioOptimization()
      case 'risk':
        return renderRiskModeling()
      case 'forecast':
        return renderForecasting()
      case 'sentiment':
        return renderMarketSentiment()
      case 'visual':
        return renderVisualTools()
      case 'education':
        return renderEducation()
      case 'crypto':
        return renderQuantumSafeCrypto()
      default:
        return renderOverview()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Initializing Quantum Finance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-4 mb-4">
            <p className="text-green-800 dark:text-green-200 font-semibold">
              ✅ Quantum Finance Component is Working! URL: {window.location.pathname}
            </p>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔮 Quantum Finance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced quantum finance features for portfolio optimization, risk modeling, forecasting, and analytics
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  )
}

export default QuantumFinance