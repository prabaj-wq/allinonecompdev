import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  FileText, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Filter,
  Search,
  PieChart,
  Calendar,
  Target
} from 'lucide-react';

const VarianceAnalysis = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [varianceThreshold, setVarianceThreshold] = useState(10);
  const [loading, setLoading] = useState(false);

  const [varianceData, setVarianceData] = useState({
    overview: {
      totalBudget: 5000000,
      totalActual: 4850000,
      totalVariance: -150000,
      variancePercentage: -3.0,
      favorableVariances: 12,
      unfavorableVariances: 8
    },
    byCategory: {
      revenue: { budget: 8000000, actual: 7850000, variance: -150000, percentage: -1.9 },
      costOfGoods: { budget: 4000000, actual: 3950000, variance: 50000, percentage: 1.3 },
      operatingExpenses: { budget: 2000000, actual: 1950000, variance: 50000, percentage: 2.5 },
      administrative: { budget: 800000, actual: 820000, variance: -20000, percentage: -2.5 },
      marketing: { budget: 600000, actual: 580000, variance: 20000, percentage: 3.3 },
      research: { budget: 400000, actual: 380000, variance: 20000, percentage: 5.0 }
    },
    byEntity: {
      parent: { budget: 3000000, actual: 2900000, variance: -100000, percentage: -3.3 },
      subsidiary1: { budget: 1200000, actual: 1180000, variance: -20000, percentage: -1.7 },
      subsidiary2: { budget: 800000, actual: 770000, variance: -30000, percentage: -3.8 }
    },
    byAccount: [
      { account: 'Sales Revenue', budget: 8000000, actual: 7850000, variance: -150000, percentage: -1.9, status: 'warning' },
      { account: 'Cost of Sales', budget: 4000000, actual: 3950000, variance: 50000, percentage: 1.3, status: 'favorable' },
      { account: 'Salaries & Wages', budget: 1500000, actual: 1480000, variance: 20000, percentage: 1.3, status: 'favorable' },
      { account: 'Rent Expense', budget: 300000, actual: 320000, variance: -20000, percentage: -6.7, status: 'unfavorable' },
      { account: 'Utilities', budget: 200000, actual: 190000, variance: 10000, percentage: 5.0, status: 'favorable' },
      { account: 'Marketing', budget: 600000, actual: 580000, variance: 20000, percentage: 3.3, status: 'favorable' },
      { account: 'Depreciation', budget: 400000, actual: 400000, variance: 0, percentage: 0.0, status: 'neutral' },
      { account: 'Interest Expense', budget: 150000, actual: 160000, variance: -10000, percentage: -6.7, status: 'unfavorable' }
    ]
  });

  const [trends, setTrends] = useState({
    monthly: [
      { month: 'Jan', budget: 400000, actual: 395000, variance: -5000 },
      { month: 'Feb', budget: 420000, actual: 410000, variance: -10000 },
      { month: 'Mar', budget: 450000, actual: 440000, variance: -10000 },
      { month: 'Apr', budget: 480000, actual: 470000, variance: -10000 },
      { month: 'May', budget: 500000, actual: 485000, variance: -15000 },
      { month: 'Jun', budget: 520000, actual: 510000, variance: -10000 }
    ]
  });

  const [filters, setFilters] = useState({
    accountType: 'all',
    varianceType: 'all',
    entity: 'all',
    dateRange: 'current'
  });

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getVarianceColor = (variance) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVarianceStatus = (percentage, threshold = 10) => {
    const absPercentage = Math.abs(percentage);
    if (absPercentage <= threshold * 0.5) return 'favorable';
    if (absPercentage <= threshold) return 'warning';
    return 'unfavorable';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'favorable': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'unfavorable': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'neutral': return <div className="w-4 h-4 text-gray-600">—</div>;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'favorable': return 'bg-green-100 text-green-800';
      case 'unfavorable': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateVarianceMetrics = () => {
    const totalBudget = varianceData.overview.totalBudget;
    const totalActual = varianceData.overview.totalActual;
    const totalVariance = totalActual - totalBudget;
    const variancePercentage = (totalVariance / totalBudget) * 100;
    
    return {
      totalVariance,
      variancePercentage,
      isFavorable: totalVariance > 0
    };
  };

  const generateVarianceReport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Variance Analysis Report generated successfully!');
    }, 2000);
  };

  const exportVarianceData = (format) => {
    const data = {
      varianceData,
      trends,
      filters,
      period: selectedPeriod,
      entity: selectedEntity,
      timestamp: new Date().toISOString()
    };
    
    console.log(`Exporting ${format.toUpperCase()}:`, data);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'byCategory', name: 'By Category', icon: <PieChart className="w-4 h-4" /> },
    { id: 'byEntity', name: 'By Entity', icon: <Target className="w-4 h-4" /> },
    { id: 'byAccount', name: 'By Account', icon: <FileText className="w-4 h-4" /> },
    { id: 'trends', name: 'Trends', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  const varianceMetrics = calculateVarianceMetrics();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Variance Analysis</h1>
          <p className="text-gray-600 mt-2">Budget vs Actual performance analysis and insights</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateVarianceReport}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
            Generate Report
          </button>
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="current">Current Period</option>
              <option value="previous">Previous Period</option>
              <option value="ytd">Year to Date</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Total Budget</h3>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {formatCurrency(varianceData.overview.totalBudget)}
          </div>
          <div className="text-sm text-gray-600">Planned spending</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Total Actual</h3>
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatCurrency(varianceData.overview.totalActual)}
          </div>
          <div className="text-sm text-gray-600">Actual spending</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Total Variance</h3>
            {varianceMetrics.isFavorable ? 
              <CheckCircle className="w-5 h-5 text-green-600" /> : 
              <AlertTriangle className="w-5 h-5 text-red-600" />
            }
          </div>
          <div className={`text-2xl font-bold mb-1 ${
            varianceMetrics.isFavorable ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(Math.abs(varianceMetrics.totalVariance))}
          </div>
          <div className={`text-sm ${varianceMetrics.isFavorable ? 'text-green-600' : 'text-red-600'}`}>
            {varianceMetrics.isFavorable ? 'Favorable' : 'Unfavorable'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Variance %</h3>
            <TrendingUp className="w-5 h-5 text-gray-600" />
          </div>
          <div className={`text-2xl font-bold mb-1 ${
            varianceMetrics.isFavorable ? 'text-green-600' : 'text-red-600'
          }`}>
            {varianceMetrics.isFavorable ? '+' : ''}
            {varianceMetrics.variancePercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">vs Budget</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Entity</label>
            <select
              value={filters.entity}
              onChange={(e) => setFilters({...filters, entity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Entities</option>
              <option value="parent">Parent Company</option>
              <option value="subsidiary1">Subsidiary 1</option>
              <option value="subsidiary2">Subsidiary 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <select
              value={filters.accountType}
              onChange={(e) => setFilters({...filters, accountType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Variance Type</label>
            <select
              value={filters.varianceType}
              onChange={(e) => setFilters({...filters, varianceType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Variances</option>
              <option value="favorable">Favorable</option>
              <option value="unfavorable">Unfavorable</option>
              <option value="warning">Warning</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Threshold (%)</label>
            <input
              type="number"
              value={varianceThreshold}
              onChange={(e) => setVarianceThreshold(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => exportVarianceData('csv')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              CSV
            </button>
            <button
              onClick={() => exportVarianceData('excel')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Excel
            </button>
            <button
              onClick={() => exportVarianceData('pdf')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Variance Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Favorable Variances:</span>
                      <span className="font-semibold text-green-600">
                        {varianceData.overview.favorableVariances}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Unfavorable Variances:</span>
                      <span className="font-semibold text-red-600">
                        {varianceData.overview.unfavorableVariances}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Variance:</span>
                      <span className={`font-semibold ${
                        varianceMetrics.isFavorable ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(Math.abs(varianceMetrics.totalVariance))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Variance %:</span>
                      <span className={`font-semibold ${
                        varianceMetrics.isFavorable ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {varianceMetrics.isFavorable ? '+' : ''}
                        {varianceMetrics.variancePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Performance Indicators</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Budget Accuracy:</span>
                      <span className="font-semibold text-blue-600">
                        {((1 - Math.abs(varianceMetrics.variancePercentage) / 100) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cost Control:</span>
                      <span className="font-semibold text-green-600">
                        {varianceMetrics.isFavorable ? 'Excellent' : 'Needs Attention'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Forecast Reliability:</span>
                      <span className="font-semibold text-blue-600">
                        {Math.abs(varianceMetrics.variancePercentage) <= 5 ? 'High' : 
                         Math.abs(varianceMetrics.variancePercentage) <= 10 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overview Chart */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Budget vs Actual Overview</h3>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Interactive Chart Component</p>
                    <p className="text-sm">Budget: $5.0M | Actual: $4.85M | Variance: -3.0%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'byCategory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(varianceData.byCategory).map(([key, category]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {getStatusIcon(getVarianceStatus(category.percentage))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">{formatCurrency(category.budget)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Actual:</span>
                        <span className="font-medium">{formatCurrency(category.actual)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Variance:</span>
                        <span className={`font-medium ${getVarianceColor(category.variance)}`}>
                          {category.variance > 0 ? '+' : ''}
                          {formatCurrency(category.variance)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">%:</span>
                        <span className={`font-medium ${getVarianceColor(category.percentage)}`}>
                          {category.percentage > 0 ? '+' : ''}
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'byEntity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(varianceData.byEntity).map(([key, entity]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {getStatusIcon(getVarianceStatus(entity.percentage))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">{formatCurrency(entity.budget)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Actual:</span>
                        <span className="font-medium">{formatCurrency(entity.actual)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Variance:</span>
                        <span className={`font-medium ${getVarianceColor(entity.variance)}`}>
                          {entity.variance > 0 ? '+' : ''}
                          {formatCurrency(entity.variance)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">%:</span>
                        <span className={`font-medium ${getVarianceColor(entity.percentage)}`}>
                          {entity.percentage > 0 ? '+' : ''}
                          {entity.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'byAccount' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {varianceData.byAccount.map((account, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {account.account}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(account.budget)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(account.actual)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          getVarianceColor(account.variance)
                        }`}>
                          {account.variance > 0 ? '+' : ''}
                          {formatCurrency(account.variance)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          getVarianceColor(account.percentage)
                        }`}>
                          {account.percentage > 0 ? '+' : ''}
                          {account.percentage.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getStatusColor(account.status)
                          }`}>
                            {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Monthly Variance Trends</h3>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                    <p>Interactive Chart Component</p>
                    <p className="text-sm">6-month variance trend analysis</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Variance by Month</h3>
                  <div className="space-y-2">
                    {trends.monthly.map((month, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{month.month}</span>
                        <span className={`font-medium ${getVarianceColor(month.variance)}`}>
                          {month.variance > 0 ? '+' : ''}
                          {formatCurrency(month.variance)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Trend Analysis</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Average Variance:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          trends.monthly.reduce((sum, month) => sum + month.variance, 0) / trends.monthly.length
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Trend Direction:</span>
                      <span className="font-medium text-green-600">Improving</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Volatility:</span>
                      <span className="font-medium text-blue-600">Low</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-600" />
            Key Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Overall Favorable Performance</p>
                <p className="text-sm text-gray-600">3.0% under budget with strong cost control</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Revenue Management</p>
                <p className="text-sm text-gray-600">Sales revenue variance within acceptable range</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Monitor Rent Expenses</p>
                <p className="text-sm text-gray-600">6.7% over budget requires investigation</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Immediate:</strong> Investigate rent expense variance and negotiate better terms
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Short-term:</strong> Leverage favorable cost variances for strategic investments
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Long-term:</strong> Improve budget forecasting accuracy for better planning
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VarianceAnalysis;
