import React, { useState, useEffect } from 'react'
import { 
  Globe,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Calendar,
  DollarSign,
  Calculator,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Database,
  Settings,
  Target,
  Shield,
  Zap,
  Star,
  Award,
  MapPin,
  Tag,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  BookOpen,
  Users,
  Building2,
  RefreshCw
} from 'lucide-react'

const ForexRates = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('January 2025')
  const [selectedCurrency, setSelectedCurrency] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [forexRates, setForexRates] = useState([])

  // Mock data - in real app this would come from API
  const mockForexRates = [
    {
      id: 1,
      baseCurrency: 'USD',
      targetCurrency: 'EUR',
      rate: 0.85,
      previousRate: 0.84,
      change: 0.01,
      changePercent: 1.19,
      date: '2025-01-15',
      source: 'ECB',
      status: 'Active',
      lastUpdated: '2025-01-15 10:30',
      updatedBy: 'John Doe'
    },
    {
      id: 2,
      baseCurrency: 'USD',
      targetCurrency: 'GBP',
      rate: 0.78,
      previousRate: 0.79,
      change: -0.01,
      changePercent: -1.27,
      date: '2025-01-15',
      source: 'BoE',
      status: 'Active',
      lastUpdated: '2025-01-15 11:15',
      updatedBy: 'Jane Smith'
    },
    {
      id: 3,
      baseCurrency: 'USD',
      targetCurrency: 'CAD',
      rate: 1.35,
      previousRate: 1.34,
      change: 0.01,
      changePercent: 0.75,
      date: '2025-01-15',
      source: 'BoC',
      status: 'Active',
      lastUpdated: '2025-01-15 12:00',
      updatedBy: 'Mike Johnson'
    }
  ]

  useEffect(() => {
    setForexRates(mockForexRates)
  }, [])

  const handleEdit = (row) => {
    setEditingRow(row)
    setIsEditing(true)
  }

  const handleSave = (rowId, updates) => {
    setForexRates(prev => prev.map(item => 
      item.id === rowId 
        ? { 
            ...item, 
            ...updates,
            lastUpdated: new Date().toLocaleString(),
            updatedBy: 'Current User'
          }
        : item
    ))
    setIsEditing(false)
    setEditingRow(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingRow(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Inactive':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const formatRate = (rate) => {
    return rate.toFixed(4)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Globe className="h-8 w-8 mr-3 text-yellow-600" />
              Forex Rate Management
            </h1>
            <p className="text-gray-600 mt-2">Manage exchange rates and currency conversions</p>
          </div>
          <div className="flex space-x-3">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-select"
            >
              <option value="January 2025">January 2025</option>
              <option value="December 2024">December 2024</option>
              <option value="November 2024">November 2024</option>
            </select>
            <button className="btn-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Rate
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rates</p>
              <p className="text-3xl font-bold text-gray-900">{forexRates.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Rates</p>
              <p className="text-3xl font-bold text-gray-900">
                {forexRates.filter(rate => rate.status === 'Active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Currencies</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(forexRates.map(rate => rate.targetCurrency)).size}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-3xl font-bold text-gray-900">Today</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Trends */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Exchange Rate Trends</h3>
        </div>
        <div className="p-6">
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-2" />
              <p>Exchange rate trends chart</p>
              <p className="text-sm">Interactive chart showing currency rate movements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forex Rates Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select 
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="form-select"
              >
                <option value="all">All Currencies</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button className="btn-secondary flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button className="btn-secondary flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
              <button className="btn-secondary flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button className="btn-secondary flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency Pair</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forexRates.map((rate) => (
                  <tr key={rate.id} className="table-row-hover">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {rate.baseCurrency}/{rate.targetCurrency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatRate(rate.rate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getChangeIcon(rate.change)}
                        <span className={`text-sm font-medium ml-1 ${getChangeColor(rate.change)}`}>
                          {rate.change > 0 ? '+' : ''}{formatRate(rate.change)} ({rate.changePercent > 0 ? '+' : ''}{rate.changePercent}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rate.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rate.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(rate.status)}`}>
                        {rate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEdit(rate)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Currency Conversion Calculator */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Currency Converter</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                Convert Currency
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Currency</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Currency</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="w-full btn-primary">
                  Convert
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                Rate Information
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Rate:</span>
                  <span className="font-medium text-gray-900">1 USD = 0.85 EUR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Previous Rate:</span>
                  <span className="font-medium text-gray-900">1 USD = 0.84 EUR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Change:</span>
                  <span className="font-medium text-green-600">+0.01 (+1.19%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <span className="font-medium text-gray-900">2025-01-15 10:30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Source:</span>
                  <span className="font-medium text-gray-900">ECB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForexRates
