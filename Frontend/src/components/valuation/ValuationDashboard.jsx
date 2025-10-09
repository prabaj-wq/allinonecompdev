import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Building2,
  Calculator,
  AlertTriangle,
  Plus
} from 'lucide-react'

const ValuationDashboard = ({ companyId }) => {
  const [summary, setSummary] = useState({
    total_valuations: 0,
    draft_valuations: 0,
    approved_valuations: 0
  })
  const [recentValuations, setRecentValuations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (companyId) {
      fetchDashboardData()
    }
  }, [companyId])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/valuation/dashboard/summary?company_id=${companyId}`)
      const data = await response.json()
      if (data.success) {
        setSummary(data.data.summary)
        setRecentValuations(data.data.recent_valuations)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      name: 'Total Valuations',
      value: summary.total_valuations,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Draft Valuations',
      value: summary.draft_valuations,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '+5%',
      changeType: 'increase'
    },
    {
      name: 'Approved Valuations',
      value: summary.approved_valuations,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'increase'
    },
    {
      name: 'Total Value',
      value: '$2.4M',
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'increase'
    }
  ]

  const quickActions = [
    {
      name: 'Create New Valuation',
      description: 'Start a new business valuation',
      icon: Plus,
      href: '#',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'DCF Calculator',
      description: 'Calculate discounted cash flow',
      icon: Calculator,
      href: '#',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Impairment Test',
      description: 'Test asset impairment',
      icon: AlertTriangle,
      href: '#',
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      name: 'Comparable Analysis',
      description: 'Analyze peer companies',
      icon: Building2,
      href: '#',
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Valuation Overview
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`inline-flex items-center justify-center h-8 w-8 rounded-md ${stat.color} text-white`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className={`text-sm ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} from last month
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <div
              key={action.name}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`inline-flex items-center justify-center h-10 w-10 rounded-md ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Valuations */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Valuations
        </h2>
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          {recentValuations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No valuations yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first valuation.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentValuations.map((valuation) => (
                <li key={valuation.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            valuation.status === 'approved' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : valuation.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {valuation.status}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {valuation.valuation_type} Valuation
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Analyst: {valuation.analyst}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        {new Date(valuation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Valuation Methods Overview */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Valuation Methods
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white">
                    <Calculator className="h-5 w-5" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    DCF Analysis
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Discounted Cash Flow valuation using projected cash flows and discount rates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-green-600 text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Comparable Analysis
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Valuation based on peer company multiples and industry benchmarks.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-purple-600 text-white">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Impairment Testing
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Test assets for impairment and calculate recoverable amounts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ValuationDashboard
