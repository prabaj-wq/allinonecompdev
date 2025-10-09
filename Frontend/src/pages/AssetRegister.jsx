import React, { useState, useEffect } from 'react'
import { 
  Building2,
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
  FileText,
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
  AlertTriangle
} from 'lucide-react'

const AssetRegister = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Q1 2025')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [assets, setAssets] = useState([])

  // Mock data - in real app this would come from API
  const mockAssets = [
    {
      id: 1,
      assetCode: 'PPE001',
      assetName: 'Office Building',
      category: 'Buildings',
      location: 'New York',
      acquisitionDate: '2020-01-15',
      acquisitionCost: 5000000,
      currentValue: 4800000,
      accumulatedDepreciation: 200000,
      netBookValue: 4600000,
      usefulLife: 30,
      depreciationMethod: 'Straight Line',
      status: 'Active',
      lastModified: '2025-01-15 10:30',
      modifiedBy: 'John Doe'
    },
    {
      id: 2,
      assetCode: 'PPE002',
      assetName: 'Manufacturing Equipment',
      category: 'Machinery',
      location: 'Chicago',
      acquisitionDate: '2021-03-20',
      acquisitionCost: 2500000,
      currentValue: 2000000,
      accumulatedDepreciation: 500000,
      netBookValue: 2000000,
      usefulLife: 10,
      depreciationMethod: 'Declining Balance',
      status: 'Active',
      lastModified: '2025-01-15 11:15',
      modifiedBy: 'Jane Smith'
    },
    {
      id: 3,
      assetCode: 'PPE003',
      assetName: 'Company Vehicles',
      category: 'Vehicles',
      location: 'Los Angeles',
      acquisitionDate: '2022-06-10',
      acquisitionCost: 800000,
      currentValue: 600000,
      accumulatedDepreciation: 200000,
      netBookValue: 600000,
      usefulLife: 5,
      depreciationMethod: 'Straight Line',
      status: 'Active',
      lastModified: '2025-01-15 12:00',
      modifiedBy: 'Mike Johnson'
    }
  ]

  useEffect(() => {
    setAssets(mockAssets)
  }, [])

  const handleEdit = (row) => {
    setEditingRow(row)
    setIsEditing(true)
  }

  const handleSave = (rowId, updates) => {
    setAssets(prev => prev.map(item => 
      item.id === rowId 
        ? { 
            ...item, 
            ...updates,
            lastModified: new Date().toLocaleString(),
            modifiedBy: 'Current User'
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
      case 'Disposed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Under Construction':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateDepreciation = (cost, usefulLife, method) => {
    if (method === 'Straight Line') {
      return cost / usefulLife
    }
    return 0
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-6 border border-teal-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-8 w-8 mr-3 text-teal-600" />
              Asset Register
            </h1>
            <p className="text-gray-600 mt-2">Manage fixed assets, depreciation, and asset lifecycle</p>
          </div>
          <div className="flex space-x-3">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-select"
            >
              <option value="Q1 2025">Q1 2025</option>
              <option value="Q4 2024">Q4 2024</option>
              <option value="Q3 2024">Q3 2024</option>
            </select>
            <button className="btn-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-3xl font-bold text-gray-900">{assets.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(assets.reduce((sum, item) => sum + item.acquisitionCost, 0))}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Book Value</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(assets.reduce((sum, item) => sum + item.netBookValue, 0))}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Depreciation</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(assets.reduce((sum, item) => sum + item.accumulatedDepreciation, 0))}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Asset Categories Chart */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Asset Distribution by Category</h3>
        </div>
        <div className="p-6">
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Asset category distribution chart</p>
              <p className="text-sm">Interactive chart showing asset allocation by category</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
              >
                <option value="all">All Categories</option>
                <option value="Buildings">Buildings</option>
                <option value="Machinery">Machinery</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Equipment">Equipment</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acquisition Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Book Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset) => (
                  <tr key={asset.id} className="table-row-hover">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{asset.assetCode}</div>
                        <div className="text-sm text-gray-500">{asset.assetName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {asset.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(asset.acquisitionCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(asset.netBookValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEdit(asset)}
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

      {/* Depreciation Schedule */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Depreciation Schedule</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Useful Life</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Depreciation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accumulated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Life</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset) => {
                  const annualDepreciation = calculateDepreciation(asset.acquisitionCost, asset.usefulLife, asset.depreciationMethod)
                  const remainingLife = asset.usefulLife - (asset.accumulatedDepreciation / annualDepreciation)
                  
                  return (
                    <tr key={asset.id} className="table-row-hover">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{asset.assetName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.depreciationMethod}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.usefulLife} years</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(annualDepreciation)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(asset.accumulatedDepreciation)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {remainingLife > 0 ? `${remainingLife.toFixed(1)} years` : 'Fully Depreciated'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssetRegister
