import React, { useState, useEffect } from 'react'
import { 
  Layers, 
  Building2, 
  Calculator, 
  TrendingUp, 
  ArrowRight, 
  ArrowLeft,
  Plus,
  Minus,
  X,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Filter,
  Search,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  Percent,
  Calendar,
  Users,
  Globe,
  Lock,
  Unlock,
  Zap,
  Target,
  Activity,
  Database,
  FileText,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Copy,
  Save,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

const ConsolidationEngine = () => {
  const [activeTab, setActiveTab] = useState('entities')
  const [entities, setEntities] = useState([])
  const [eliminationRules, setEliminationRules] = useState([])
  const [intercompanyTransactions, setIntercompanyTransactions] = useState([])
  const [consolidationResults, setConsolidationResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [showEntityModal, setShowEntityModal] = useState(false)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  useEffect(() => {
    loadConsolidationData()
  }, [])

  const loadConsolidationData = async () => {
    setLoading(true)
    try {
      // Load entities
      const entitiesResponse = await fetch('/api/entities', {
        credentials: 'include'
      })
      
      if (entitiesResponse.ok) {
        const entitiesData = await entitiesResponse.json()
        setEntities(entitiesData)
      }

      // Load elimination rules
      const rulesResponse = await fetch('/api/elimination-rules', {
        credentials: 'include'
      })
      
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json()
        setEliminationRules(rulesData)
      }

      // Load intercompany transactions
      const transactionsResponse = await fetch('/api/intercompany-transactions', {
        credentials: 'include'
      })
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setIntercompanyTransactions(transactionsData)
      }

    } catch (err) {
      console.error('Error loading consolidation data:', err)
    } finally {
      setLoading(false)
    }
  }

  const runConsolidation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/consolidation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          entities: entities,
          elimination_rules: eliminationRules,
          intercompany_transactions: intercompanyTransactions
        })
      })

      if (response.ok) {
        const results = await response.json()
        setConsolidationResults(results)
      }
    } catch (err) {
      console.error('Error running consolidation:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderEntityHierarchy = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Entity Hierarchy
        </h3>
        <button
          onClick={() => setShowEntityModal(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Entity
        </button>
      </div>

      <div className="space-y-2">
        {entities.map((entity) => (
          <div
            key={entity.id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => setSelectedEntity(entity)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {entity.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {entity.entity_type} • {entity.currency}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  entity.consolidation_method === 'full' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {entity.consolidation_method}
                </span>
                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderEliminationRules = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Elimination Rules
        </h3>
        <button
          onClick={() => setShowRuleModal(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </button>
      </div>

      <div className="space-y-2">
        {eliminationRules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Calculator className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {rule.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {rule.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  rule.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {rule.status}
                </span>
                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderIntercompanyTransactions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Intercompany Transactions
        </h3>
        <button
          onClick={() => setShowTransactionModal(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                From Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                To Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {intercompanyTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {transaction.transaction_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {transaction.from_entity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {transaction.to_entity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  ${transaction.amount?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    transaction.status === 'matched' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : transaction.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderConsolidationResults = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Consolidation Results
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={runConsolidation}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Consolidation
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {consolidationResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {consolidationResults.map((result) => (
            <div
              key={result.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {result.entity_name}
                </h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  result.status === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {result.status}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div>Total Assets: ${result.total_assets?.toLocaleString()}</div>
                <div>Total Liabilities: ${result.total_liabilities?.toLocaleString()}</div>
                <div>Net Income: ${result.net_income?.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No consolidation results
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Run consolidation to see results
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Layers className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Advanced Consolidation Engine
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Enterprise-grade multi-entity consolidation with elimination rules
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'entities', name: 'Entity Hierarchy', icon: Building2 },
              { id: 'rules', name: 'Elimination Rules', icon: Calculator },
              { id: 'transactions', name: 'Intercompany Transactions', icon: ArrowRight },
              { id: 'results', name: 'Consolidation Results', icon: BarChart3 }
            ].map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {activeTab === 'entities' && renderEntityHierarchy()}
          {activeTab === 'rules' && renderEliminationRules()}
          {activeTab === 'transactions' && renderIntercompanyTransactions()}
          {activeTab === 'results' && renderConsolidationResults()}
        </div>
      </div>
    </div>
  )
}

export default ConsolidationEngine
