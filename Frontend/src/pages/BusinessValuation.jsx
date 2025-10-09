import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'
import ValuationList from '../components/valuation/ValuationList'
import CreateValuation from '../components/valuation/CreateValuation'
import DCFModel from '../components/valuation/DCFModel'
import ComparableAnalysis from '../components/valuation/ComparableAnalysis'
import AssetImpairment from '../components/valuation/AssetImpairment'
import ValuationDashboard from '../components/valuation/ValuationDashboard'
import { 
  BarChart3, 
  Plus, 
  Calculator, 
  Building2, 
  Eye,
  FileText,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

const BusinessValuation = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedValuation, setSelectedValuation] = useState(null)
  const [valuations, setValuations] = useState([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { selectedCompany } = useCompany()

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, description: 'Overview and summary' },
    { id: 'list', name: 'Valuations', icon: FileText, description: 'List and manage valuations' },
    { id: 'create', name: 'New Valuation', icon: Plus, description: 'Create new valuation' },
    { id: 'dcf', name: 'DCF Model', icon: Calculator, description: 'Discounted Cash Flow analysis' },
    { id: 'comparables', name: 'Comparables', icon: Building2, description: 'Comparable company analysis' },
    { id: 'impairment', name: 'Asset Impairment', icon: AlertTriangle, description: 'Impairment testing' }
  ]

  useEffect(() => {
    if (selectedCompany) {
      fetchValuations()
    }
  }, [selectedCompany])

  const fetchValuations = async () => {
    if (!selectedCompany) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/valuation/valuations?company_id=${selectedCompany.id}`)
      const data = await response.json()
      if (data.success) {
        setValuations(data.data)
      }
    } catch (error) {
      console.error('Error fetching valuations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleValuationSelect = (valuation) => {
    setSelectedValuation(valuation)
    setActiveTab('dcf') // Default to DCF tab when selecting a valuation
  }

  const handleValuationCreated = (newValuation) => {
    setValuations(prev => [newValuation, ...prev])
    setSelectedValuation(newValuation)
    setActiveTab('dcf')
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ValuationDashboard companyId={selectedCompany?.id} />
      case 'list':
        return (
          <ValuationList 
            valuations={valuations} 
            onSelect={handleValuationSelect}
            onRefresh={fetchValuations}
            loading={loading}
          />
        )
      case 'create':
        return (
          <CreateValuation 
            onCreated={handleValuationCreated}
            companyId={selectedCompany?.id}
          />
        )
      case 'dcf':
        return (
          <DCFModel 
            valuation={selectedValuation}
            onBack={() => setActiveTab('list')}
          />
        )
      case 'comparables':
        return (
          <ComparableAnalysis 
            valuation={selectedValuation}
            onBack={() => setActiveTab('list')}
          />
        )
      case 'impairment':
        return (
          <AssetImpairment 
            valuation={selectedValuation}
            onBack={() => setActiveTab('list')}
          />
        )
      default:
        return <ValuationDashboard companyId={selectedCompany?.id} />
    }
  }

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Company Selected
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please select a company to access Business Valuation & Impairment tools.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Business Valuation & Impairment
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Comprehensive valuation analysis, DCF modeling, and impairment testing
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedCompany.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Company
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default BusinessValuation
