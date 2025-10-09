import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  FileText, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Filter,
  PieChart
} from 'lucide-react';

const CashFlow = () => {
  const [activeTab, setActiveTab] = useState('operating');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [showProjections, setShowProjections] = useState(true);
  const [loading, setLoading] = useState(false);

  const [cashFlowData, setCashFlowData] = useState({
    operating: {
      netIncome: { value: 2500000, change: 0.15, trend: 'up' },
      depreciation: { value: 800000, change: 0.05, trend: 'up' },
      workingCapitalChanges: { value: -300000, change: -0.20, trend: 'down' },
      otherOperating: { value: 150000, change: 0.10, trend: 'up' },
      netOperatingCashFlow: { value: 3150000, change: 0.12, trend: 'up' }
    },
    investing: {
      capitalExpenditure: { value: -1800000, change: -0.25, trend: 'down' },
      acquisitions: { value: -500000, change: -0.50, trend: 'down' },
      assetSales: { value: 200000, change: 0.30, trend: 'up' },
      investments: { value: -300000, change: -0.15, trend: 'down' },
      netInvestingCashFlow: { value: -2400000, change: -0.28, trend: 'down' }
    },
    financing: {
      debtIssuance: { value: 1000000, change: 0.20, trend: 'up' },
      debtRepayment: { value: -800000, change: -0.10, trend: 'down' },
      dividends: { value: -600000, change: 0.05, trend: 'up' },
      shareRepurchase: { value: -200000, change: -0.30, trend: 'down' },
      netFinancingCashFlow: { value: -600000, change: -0.08, trend: 'down' }
    }
  });

  const [metrics, setMetrics] = useState({
    freeCashFlow: { value: 1350000, change: 0.18, trend: 'up' },
    operatingCashFlowRatio: { value: 0.85, change: 0.05, trend: 'up' },
    cashFlowCoverageRatio: { value: 2.8, change: 0.12, trend: 'up' },
    cashConversionCycle: { value: 45, change: -0.08, trend: 'down' },
    cashFlowToDebtRatio: { value: 0.35, change: 0.10, trend: 'up' }
  });

  const [projections, setProjections] = useState({
    nextQuarter: { operating: 3400000, investing: -2000000, financing: -500000 },
    nextYear: { operating: 14000000, investing: -8000000, financing: -2000000 }
  });

  const [historicalTrends, setHistoricalTrends] = useState({
    operating: [2800000, 2950000, 3100000, 3150000],
    investing: [-2000000, -2200000, -2300000, -2400000],
    financing: [-500000, -550000, -580000, -600000]
  });

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <div className="w-4 h-4 text-gray-600">—</div>;
      default: return null;
    }
  };

  const calculateCashFlowHealth = () => {
    const operating = cashFlowData.operating.netOperatingCashFlow.value;
    const investing = cashFlowData.investing.netInvestingCashFlow.value;
    const financing = cashFlowData.financing.netFinancingCashFlow.value;
    
    if (operating > 0 && Math.abs(investing) < operating * 0.8) return 'excellent';
    if (operating > 0 && Math.abs(investing) < operating) return 'good';
    if (operating > 0) return 'fair';
    return 'poor';
  };

  const generateCashFlowReport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Cash Flow Report generated successfully!');
    }, 2000);
  };

  const exportCashFlowData = (format) => {
    const data = {
      cashFlowData,
      metrics,
      projections,
      period: selectedPeriod,
      entity: selectedEntity,
      timestamp: new Date().toISOString()
    };
    
    console.log(`Exporting ${format.toUpperCase()}:`, data);
  };

  const tabs = [
    { id: 'operating', name: 'Operating Activities', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'investing', name: 'Investing Activities', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'financing', name: 'Financing Activities', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'metrics', name: 'Cash Flow Metrics', icon: <PieChart className="w-4 h-4" /> },
    { id: 'projections', name: 'Projections', icon: <Calendar className="w-4 h-4" /> }
  ];

  const cashFlowHealth = calculateCashFlowHealth();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cash Flow Analysis</h1>
          <p className="text-gray-600 mt-2">Comprehensive cash flow analysis and forecasting</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateCashFlowReport}
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

      {/* Cash Flow Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Operating Cash Flow</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatCurrency(cashFlowData.operating.netOperatingCashFlow.value)}
          </div>
          <div className="text-sm text-gray-600">
            {cashFlowData.operating.netOperatingCashFlow.change > 0 ? '+' : ''}
            {(cashFlowData.operating.netOperatingCashFlow.change * 100).toFixed(1)}% vs prev
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Free Cash Flow</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatCurrency(metrics.freeCashFlow.value)}
          </div>
          <div className="text-sm text-gray-600">
            {metrics.freeCashFlow.change > 0 ? '+' : ''}
            {(metrics.freeCashFlow.change * 100).toFixed(1)}% vs prev
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Cash Flow Health</h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              cashFlowHealth === 'excellent' ? 'bg-green-100 text-green-800' :
              cashFlowHealth === 'good' ? 'bg-blue-100 text-blue-800' :
              cashFlowHealth === 'fair' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {cashFlowHealth.charAt(0).toUpperCase() + cashFlowHealth.slice(1)}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {((cashFlowData.operating.netOperatingCashFlow.value / 
               Math.abs(cashFlowData.investing.netInvestingCashFlow.value)) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">Coverage Ratio</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Net Cash Change</h3>
            <div className={`w-5 h-5 rounded-full ${
              (cashFlowData.operating.netOperatingCashFlow.value + 
               cashFlowData.investing.netInvestingCashFlow.value + 
               cashFlowData.financing.netFinancingCashFlow.value) > 0 ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>
          <div className={`text-2xl font-bold mb-1 ${
            (cashFlowData.operating.netOperatingCashFlow.value + 
             cashFlowData.investing.netInvestingCashFlow.value + 
             cashFlowData.financing.netFinancingCashFlow.value) > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(
              cashFlowData.operating.netOperatingCashFlow.value + 
              cashFlowData.investing.netInvestingCashFlow.value + 
              cashFlowData.financing.netFinancingCashFlow.value
            )}
          </div>
          <div className="text-sm text-gray-600">Period Change</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Entity</label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Entities</option>
              <option value="parent">Parent Company</option>
              <option value="subsidiary1">Subsidiary 1</option>
              <option value="subsidiary2">Subsidiary 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
              <option value="standard">Standard Analysis</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="forecast">Forecast Analysis</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showProjections}
                onChange={(e) => setShowProjections(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show Projections</span>
            </label>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => exportCashFlowData('csv')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              CSV
            </button>
            <button
              onClick={() => exportCashFlowData('excel')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Excel
            </button>
            <button
              onClick={() => exportCashFlowData('pdf')}
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
          {activeTab === 'operating' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(cashFlowData.operating).map(([key, item]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {getTrendIcon(item.trend)}
                    </div>
                    <div className={`text-2xl font-bold mb-2 ${
                      item.value >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.value)}
                    </div>
                    <div className={`text-sm ${getChangeColor(item.change)}`}>
                      {item.change > 0 ? '+' : ''}
                      {(item.change * 100).toFixed(1)}% vs previous
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Operating Cash Flow Chart */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Operating Cash Flow Trend</h3>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                    <p>Interactive Chart Component</p>
                    <p className="text-sm">Net Operating CF: $3.15M | Trend: +12%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'investing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(cashFlowData.investing).map(([key, item]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {getTrendIcon(item.trend)}
                    </div>
                    <div className={`text-2xl font-bold mb-2 ${
                      item.value >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.value)}
                    </div>
                    <div className={`text-sm ${getChangeColor(item.change)}`}>
                      {item.change > 0 ? '+' : ''}
                      {(item.change * 100).toFixed(1)}% vs previous
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'financing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(cashFlowData.financing).map(([key, item]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {getTrendIcon(item.trend)}
                    </div>
                    <div className={`text-2xl font-bold mb-2 ${
                      item.value >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.value)}
                    </div>
                    <div className={`text-sm ${getChangeColor(item.change)}`}>
                      {item.change > 0 ? '+' : ''}
                      {(item.change * 100).toFixed(1)}% vs previous
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(metrics).map(([key, metric]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {key === 'freeCashFlow' ? formatCurrency(metric.value) :
                       key === 'operatingCashFlowRatio' || key === 'cashFlowToDebtRatio' ? 
                       (metric.value * 100).toFixed(1) + '%' :
                       key === 'cashConversionCycle' ? metric.value + ' days' :
                       metric.value.toFixed(1)}
                    </div>
                    <div className={`text-sm ${getChangeColor(metric.change)}`}>
                      {metric.change > 0 ? '+' : ''}
                      {(metric.change * 100).toFixed(1)}% vs previous
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'projections' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Next Quarter Projections</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Operating Cash Flow:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(projections.nextQuarter.operating)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Investing Cash Flow:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(projections.nextQuarter.investing)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Financing Cash Flow:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(projections.nextQuarter.financing)}
                      </span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Net Cash Flow:</span>
                      <span className="text-green-600">
                        {formatCurrency(
                          projections.nextQuarter.operating + 
                          projections.nextQuarter.investing + 
                          projections.nextQuarter.financing
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Next Year Projections</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Operating Cash Flow:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(projections.nextYear.operating)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Investing Cash Flow:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(projections.nextYear.investing)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Financing Cash Flow:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(projections.nextYear.financing)}
                      </span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Net Cash Flow:</span>
                      <span className="text-green-600">
                        {formatCurrency(
                          projections.nextYear.operating + 
                          projections.nextYear.investing + 
                          projections.nextYear.financing
                        )}
                      </span>
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
            Cash Flow Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Strong Operating Cash Generation</p>
                <p className="text-sm text-gray-600">$3.15M operating cash flow covers all investing needs</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Healthy Free Cash Flow</p>
                <p className="text-sm text-gray-600">$1.35M available for dividends and debt reduction</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Monitor Working Capital</p>
                <p className="text-sm text-gray-600">$300K increase in working capital requirements</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Cash Flow Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Operating Activities:</span>
              <span className="font-semibold text-green-600">+$3.15M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Investing Activities:</span>
              <span className="font-semibold text-red-600">-$2.40M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Financing Activities:</span>
              <span className="font-semibold text-red-600">-$0.60M</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between font-semibold">
              <span>Net Cash Change:</span>
              <span className="text-green-600">+$0.15M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlow;
