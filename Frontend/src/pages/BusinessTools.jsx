import React, { useState, useEffect } from 'react'
import { 
  Calculator, 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Brain, 
  Eye, 
  BookOpen,
  Settings,
  Target,
  Activity,
  Wind,
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
  Save,
  RefreshCw,
  Info,
  HelpCircle,
  Database,
  Cpu,
  Layers,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Zap,
  Gamepad2,
  GitBranch,
  Workflow,
  Lightbulb,
  TrendingDown,
  ArrowUpDown,
  Compass,
  Lock,
  Unlock
} from 'lucide-react'

// Import individual theory components (we'll create these)
import TimeValueOfMoney from '../components/business-tools/TimeValueOfMoney'
import EfficientMarketHypothesis from '../components/business-tools/EfficientMarketHypothesis'
import ModernPortfolioTheory from '../components/business-tools/ModernPortfolioTheory'
import CapitalAssetPricingModel from '../components/business-tools/CapitalAssetPricingModel'
import AgencyTheory from '../components/business-tools/AgencyTheory'
import GameTheory from '../components/business-tools/GameTheory'
import BehavioralFinance from '../components/business-tools/BehavioralFinance'
import BusinessCycleTheory from '../components/business-tools/BusinessCycleTheory'
import PortersFiveForces from '../components/business-tools/PortersFiveForces'
import SWOTAnalysis from '../components/business-tools/SWOTAnalysis'
import LeanSixSigma from '../components/business-tools/LeanSixSigma'

const BusinessTools = () => {
  const [activeTab, setActiveTab] = useState('tvm')
  const [isLoading, setIsLoading] = useState(false)
  const [customizationLevel, setCustomizationLevel] = useState('basic')
  const [selectedIndustry, setSelectedIndustry] = useState('general')
  const [userPreferences, setUserPreferences] = useState({})

  // Business Tools tabs configuration
  const businessToolsTabs = [
    { 
      id: 'tvm', 
      name: 'Time Value of Money', 
      icon: Calculator, 
      description: 'Present & Future Value Calculations',
      color: 'bg-blue-500',
      theory: 'Core finance principle that money available now is worth more than the same amount in the future due to its potential earning capacity.'
    },
    { 
      id: 'emh', 
      name: 'Efficient Market Hypothesis', 
      icon: TrendingUp, 
      description: 'Market Efficiency Analysis',
      color: 'bg-green-500',
      theory: 'Theory asserting that asset prices fully reflect all available information, implying it is impossible to consistently outperform the market.'
    },
    { 
      id: 'mpt', 
      name: 'Modern Portfolio Theory', 
      icon: PieChart, 
      description: 'Portfolio Optimization & Diversification',
      color: 'bg-purple-500',
      theory: 'Developed by Harry Markowitz, focusing on optimizing portfolio diversification to maximize returns while minimizing risk.'
    },
    { 
      id: 'capm', 
      name: 'Capital Asset Pricing Model', 
      icon: Target, 
      description: 'Risk-Return Analysis & Beta Calculations',
      color: 'bg-orange-500',
      theory: 'Models expected return of an asset based on its risk relative to the market (beta).'
    },
    { 
      id: 'agency', 
      name: 'Agency Theory', 
      icon: Users, 
      description: 'Corporate Governance & Incentive Design',
      color: 'bg-red-500',
      theory: 'Examines conflicts of interest between principals (owners) and agents (managers).'
    },
    { 
      id: 'game', 
      name: 'Game Theory', 
      icon: Gamepad2, 
      description: 'Strategic Decision Making',
      color: 'bg-indigo-500',
      theory: 'Study of strategic interaction among rational decision-makers.'
    },
    { 
      id: 'behavioral', 
      name: 'Behavioral Finance', 
      icon: Brain, 
      description: 'Psychological Bias Analysis',
      color: 'bg-pink-500',
      theory: 'Recognizes psychological influences and biases affecting investor behavior.'
    },
    { 
      id: 'cycle', 
      name: 'Business Cycle Theory', 
      icon: Activity, 
      description: 'Economic Cycle Analysis & Forecasting',
      color: 'bg-cyan-500',
      theory: 'Analyzes fluctuations in economic activity over time (expansion, recession).'
    },
    { 
      id: 'porters', 
      name: 'Porter\'s Five Forces', 
      icon: Shield, 
      description: 'Industry Analysis Framework',
      color: 'bg-yellow-500',
      theory: 'Framework for analyzing industry attractiveness and competitive intensity.'
    },
    { 
      id: 'swot', 
      name: 'SWOT Analysis', 
      icon: Compass, 
      description: 'Strategic Planning Tool',
      color: 'bg-teal-500',
      theory: 'Tool to evaluate internal and external factors affecting a business.'
    },
    { 
      id: 'lean', 
      name: 'Lean & Six Sigma', 
      icon: Workflow, 
      description: 'Process Optimization & Quality Improvement',
      color: 'bg-emerald-500',
      theory: 'Methodologies focused on operational efficiency, waste reduction, and quality improvement.'
    }
  ]

  const industries = [
    { id: 'general', name: 'General Business', description: 'Universal business applications' },
    { id: 'banking', name: 'Banking & Finance', description: 'Financial services industry' },
    { id: 'manufacturing', name: 'Manufacturing', description: 'Production and operations' },
    { id: 'retail', name: 'Retail & E-commerce', description: 'Consumer goods and services' },
    { id: 'healthcare', name: 'Healthcare', description: 'Medical and pharmaceutical' },
    { id: 'technology', name: 'Technology', description: 'Software and IT services' },
    { id: 'energy', name: 'Energy & Utilities', description: 'Power and infrastructure' },
    { id: 'real_estate', name: 'Real Estate', description: 'Property and construction' }
  ]

  const customizationLevels = [
    { id: 'basic', name: 'Basic', description: 'Essential tools and calculations' },
    { id: 'intermediate', name: 'Intermediate', description: 'Advanced features and analysis' },
    { id: 'expert', name: 'Expert', description: 'Professional-grade tools and customization' }
  ]

  useEffect(() => {
    // Load user preferences and saved data
    loadUserPreferences()
  }, [])

  const loadUserPreferences = async () => {
    try {
      // Load from localStorage or API
      const saved = localStorage.getItem('businessToolsPreferences')
      if (saved) {
        setUserPreferences(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const saveUserPreferences = async () => {
    try {
      const preferences = {
        customizationLevel,
        selectedIndustry,
        activeTab,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('businessToolsPreferences', JSON.stringify(preferences))
      setUserPreferences(preferences)
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'tvm':
        return <TimeValueOfMoney industry={selectedIndustry} level={customizationLevel} />
      case 'emh':
        return <EfficientMarketHypothesis industry={selectedIndustry} level={customizationLevel} />
      case 'mpt':
        return <ModernPortfolioTheory industry={selectedIndustry} level={customizationLevel} />
      case 'capm':
        return <CapitalAssetPricingModel industry={selectedIndustry} level={customizationLevel} />
      case 'agency':
        return <AgencyTheory industry={selectedIndustry} level={customizationLevel} />
      case 'game':
        return <GameTheory industry={selectedIndustry} level={customizationLevel} />
      case 'behavioral':
        return <BehavioralFinance industry={selectedIndustry} level={customizationLevel} />
      case 'cycle':
        return <BusinessCycleTheory industry={selectedIndustry} level={customizationLevel} />
      case 'porters':
        return <PortersFiveForces industry={selectedIndustry} level={customizationLevel} />
      case 'swot':
        return <SWOTAnalysis industry={selectedIndustry} level={customizationLevel} />
      case 'lean':
        return <LeanSixSigma industry={selectedIndustry} level={customizationLevel} />
      default:
        return <TimeValueOfMoney industry={selectedIndustry} level={customizationLevel} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    Business Tools
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Advanced Financial & Business Analysis Tools
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Industry Selector */}
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>

              {/* Customization Level */}
              <select
                value={customizationLevel}
                onChange={(e) => setCustomizationLevel(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {customizationLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>

              <button
                onClick={saveUserPreferences}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Save Preferences"
              >
                <Save className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Theory Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6 sticky top-24">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Business Theories
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select a theory to explore its tools and applications
                </p>
              </div>

              <div className="space-y-2">
                {businessToolsTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        isActive ? 'bg-white/20' : tab.color
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          isActive ? 'text-white' : 'text-white'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{tab.name}</div>
                        <div className={`text-xs ${
                          isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {tab.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Theory Description */}
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                  Theory Overview
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {businessToolsTabs.find(tab => tab.id === activeTab)?.theory}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 min-h-[600px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg text-slate-600 dark:text-slate-400">Loading tools...</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {renderActiveTab()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessTools
