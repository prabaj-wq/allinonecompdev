import React, { useState } from 'react'
import { 
  Eye,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Filter,
  Search,
  BarChart3,
  PieChart,
  LineChart,
  Shield,
  Target,
  DollarSign,
  Percent,
  Calendar,
  Clock,
  User,
  FileText,
  Save,
  RefreshCw
} from 'lucide-react'

const AuditMateriality = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isCalculating, setIsCalculating] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('2025')

  const materialityData = {
    overview: {
      totalAssets: 25000000,
      totalRevenue: 15000000,
      netIncome: 2500000,
      materialityThreshold: 1250000,
      tolerableMisstatement: 625000,
      performanceMateriality: 937500
    },
    thresholds: [
      {
        id: 1,
        name: 'Overall Materiality',
        type: 'Percentage',
        value: 5.0,
        amount: 1250000,
        description: '5% of net income',
        status: 'Active',
        lastUpdated: '2025-01-15'
      },
      {
        id: 2,
        name: 'Performance Materiality',
        type: 'Percentage',
        value: 3.75,
        amount: 937500,
        description: '75% of overall materiality',
        status: 'Active',
        lastUpdated: '2025-01-15'
      },
      {
        id: 3,
        name: 'Tolerable Misstatement',
        type: 'Percentage',
        value: 2.5,
        amount: 625000,
        description: '50% of overall materiality',
        status: 'Active',
        lastUpdated: '2025-01-15'
      }
    ],
    calculations: [
      {
        id: 1,
        account: 'Cash and Cash Equivalents',
        balance: 3500000,
        risk: 'Low',
        materiality: 175000,
        status: 'Reviewed',
        auditor: 'John Smith',
        date: '2025-01-20'
      },
      {
        id: 2,
        account: 'Accounts Receivable',
        balance: 2800000,
        risk: 'Medium',
        materiality: 140000,
        status: 'In Progress',
        auditor: 'Sarah Johnson',
        date: '2025-01-19'
      },
      {
        id: 3,
        account: 'Inventory',
        balance: 4200000,
        risk: 'High',
        materiality: 210000,
        status: 'Pending',
        auditor: 'Mike Davis',
        date: '2025-01-18'
      }
    ]
  }

  const handleCalculateMateriality = async () => {
    setIsCalculating(true)
    // Simulate calculation
    setTimeout(() => {
      setIsCalculating(false)
    }, 2000)
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reviewed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Eye className="h-8 w-8 mr-3 text-red-600" />
              Audit Materiality
            </h1>
            <p className="text-gray-600 mt-2">Set and manage audit materiality thresholds and calculations</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleCalculateMateriality}
              disabled={isCalculating}
              className="btn-primary flex items-center"
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Materiality
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-3xl font-bold text-gray-900">$25M</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Materiality</p>
              <p className="text-3xl font-bold text-gray-900">$1.25M</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <Target className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Performance Materiality</p>
              <p className="text-3xl font-bold text-gray-900">$937.5K</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tolerable Misstatement</p>
              <p className="text-3xl font-bold text-gray-900">$625K</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['overview', 'thresholds', 'calculations', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200 ${
                  activeTab === tab
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Materiality Overview</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                    Materiality Calculation
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Net Income</span>
                      <span className="font-medium text-gray-900">$2,500,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Materiality Rate</span>
                      <span className="font-medium text-gray-900">5%</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Overall Materiality</span>
                        <span className="text-lg font-bold text-red-600">$1,250,000</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Performance Materiality
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Overall Materiality</span>
                      <span className="font-medium text-gray-900">$1,250,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Performance Rate</span>
                      <span className="font-medium text-gray-900">75%</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Performance Materiality</span>
                        <span className="text-lg font-bold text-green-600">$937,500</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">Materiality Guidelines</h4>
                    <p className="text-sm text-blue-700">Overall materiality is typically set at 5% of net income. Performance materiality is usually 75% of overall materiality, and tolerable misstatement is 50% of overall materiality.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Thresholds Tab */}
          {activeTab === 'thresholds' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Materiality Thresholds</h3>
                <button className="btn-primary flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Threshold
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materialityData.thresholds.map((threshold) => (
                      <tr key={threshold.id} className="table-row-hover">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{threshold.name}</div>
                            <div className="text-sm text-gray-500">{threshold.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{threshold.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{threshold.value}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${threshold.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(threshold.status)}`}>
                            {threshold.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900" title="Edit">
                              <Edit className="h-4 w-4" />
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
          )}

          {/* Calculations Tab */}
          {activeTab === 'calculations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Account Materiality Calculations</h3>
                <div className="flex space-x-3">
                  <select className="form-select">
                    <option value="">All Accounts</option>
                    <option value="cash">Cash</option>
                    <option value="receivables">Receivables</option>
                    <option value="inventory">Inventory</option>
                  </select>
                  <button className="btn-secondary flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materiality</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auditor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materialityData.calculations.map((calc) => (
                      <tr key={calc.id} className="table-row-hover">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{calc.account}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${calc.balance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRiskColor(calc.risk)}`}>
                            {calc.risk}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${calc.materiality.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(calc.status)}`}>
                            {calc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calc.auditor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900" title="Edit">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900" title="Review">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Materiality Reports</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    Materiality Summary Report
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">Comprehensive overview of all materiality thresholds and calculations</p>
                  <button className="btn-primary w-full">Generate Report</button>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-green-600" />
                    Risk Assessment Report
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">Detailed risk analysis by account and materiality level</p>
                  <button className="btn-primary w-full">Generate Report</button>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <LineChart className="h-5 w-5 mr-2 text-purple-600" />
                    Trend Analysis Report
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">Historical materiality trends and changes over time</p>
                  <button className="btn-primary w-full">Generate Report</button>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-orange-600" />
                    Audit Documentation
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">Complete audit trail and materiality documentation</p>
                  <button className="btn-primary w-full">Generate Report</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuditMateriality
