import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calculator, 
  FileText, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

const FinancialRatios = () => {
  const [activeTab, setActiveTab] = useState('liquidity');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [showBenchmarks, setShowBenchmarks] = useState(true);
  const [loading, setLoading] = useState(false);

  const [ratios, setRatios] = useState({
    liquidity: {
      currentRatio: { value: 2.15, benchmark: 2.0, trend: 'up', status: 'good' },
      quickRatio: { value: 1.45, benchmark: 1.0, trend: 'up', status: 'good' },
      cashRatio: { value: 0.85, benchmark: 0.5, trend: 'stable', status: 'excellent' },
      workingCapitalRatio: { value: 1.15, benchmark: 1.0, trend: 'up', status: 'good' }
    },
    profitability: {
      grossProfitMargin: { value: 0.35, benchmark: 0.30, trend: 'up', status: 'good' },
      operatingMargin: { value: 0.18, benchmark: 0.15, trend: 'up', status: 'good' },
      netProfitMargin: { value: 0.12, benchmark: 0.10, trend: 'stable', status: 'good' },
      returnOnAssets: { value: 0.08, benchmark: 0.06, trend: 'up', status: 'good' },
      returnOnEquity: { value: 0.15, benchmark: 0.12, trend: 'up', status: 'good' }
    },
    efficiency: {
      assetTurnover: { value: 0.85, benchmark: 0.80, trend: 'up', status: 'good' },
      inventoryTurnover: { value: 6.5, benchmark: 6.0, trend: 'stable', status: 'good' },
      receivablesTurnover: { value: 8.2, benchmark: 8.0, trend: 'up', status: 'good' },
      fixedAssetTurnover: { value: 2.1, benchmark: 2.0, trend: 'stable', status: 'good' }
    },
    leverage: {
      debtToEquity: { value: 0.45, benchmark: 0.50, trend: 'down', status: 'good' },
      debtToAssets: { value: 0.31, benchmark: 0.33, trend: 'down', status: 'good' },
      interestCoverage: { value: 4.2, benchmark: 3.0, trend: 'up', status: 'excellent' },
      debtServiceCoverage: { value: 2.8, benchmark: 2.5, trend: 'up', status: 'good' }
    },
    market: {
      priceToEarnings: { value: 18.5, benchmark: 20.0, trend: 'stable', status: 'good' },
      priceToBook: { value: 2.1, benchmark: 2.5, trend: 'stable', status: 'good' },
      dividendYield: { value: 0.025, benchmark: 0.020, trend: 'up', status: 'good' },
      earningsPerShare: { value: 2.85, benchmark: 2.50, trend: 'up', status: 'good' }
    }
  });

  const [historicalData, setHistoricalData] = useState({
    currentRatio: [1.8, 1.9, 2.0, 2.1, 2.15],
    quickRatio: [1.2, 1.3, 1.4, 1.4, 1.45],
    roe: [0.10, 0.12, 0.13, 0.14, 0.15]
  });

  const [benchmarks, setBenchmarks] = useState({
    industry: 'Technology',
    sector: 'Software',
    peerGroup: 'Mid-Cap Tech'
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />;
      case 'stable': return <div className="w-4 h-4 text-gray-600">—</div>;
      default: return null;
    }
  };

  const calculateZScore = (ratio, benchmark, stdDev = 0.1) => {
    return Math.abs((ratio - benchmark) / stdDev);
  };

  const generateReport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Simulate report generation
      alert('Financial Ratios Report generated successfully!');
    }, 2000);
  };

  const exportData = (format) => {
    const data = {
      ratios,
      benchmarks,
      period: selectedPeriod,
      entity: selectedEntity,
      timestamp: new Date().toISOString()
    };
    
    if (format === 'csv') {
      // CSV export logic
      console.log('Exporting CSV:', data);
    } else if (format === 'excel') {
      // Excel export logic
      console.log('Exporting Excel:', data);
    } else if (format === 'pdf') {
      // PDF export logic
      console.log('Exporting PDF:', data);
    }
  };

  const tabs = [
    { id: 'liquidity', name: 'Liquidity Ratios', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'profitability', name: 'Profitability Ratios', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'efficiency', name: 'Efficiency Ratios', icon: <Calculator className="w-4 h-4" /> },
    { id: 'leverage', name: 'Leverage Ratios', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'market', name: 'Market Ratios', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Ratios Analysis</h1>
          <p className="text-gray-600 mt-2">Comprehensive financial performance metrics and analysis</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateReport}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Benchmark Industry</label>
            <select
              value={benchmarks.industry}
              onChange={(e) => setBenchmarks({...benchmarks, industry: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="Technology">Technology</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Financial">Financial</option>
              <option value="Healthcare">Healthcare</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showBenchmarks}
                onChange={(e) => setShowBenchmarks(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show Benchmarks</span>
            </label>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => exportData('csv')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              CSV
            </button>
            <button
              onClick={() => exportData('excel')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Excel
            </button>
            <button
              onClick={() => exportData('pdf')}
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
          {activeTab === 'liquidity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(ratios.liquidity).map(([key, ratio]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {getTrendIcon(ratio.trend)}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {typeof ratio.value === 'number' && ratio.value < 1 ? 
                        (ratio.value * 100).toFixed(1) + '%' : 
                        ratio.value.toFixed(2)
                      }
                    </div>
                    {showBenchmarks && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          Benchmark: {ratio.benchmark.toFixed(2)}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(ratio.status)}`}>
                          {ratio.status.charAt(0).toUpperCase() + ratio.status.slice(1)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Liquidity Analysis Chart */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Liquidity Trend Analysis</h3>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Interactive Chart Component</p>
                    <p className="text-sm">Current Ratio: 2.15 | Quick Ratio: 1.45</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profitability' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(ratios.profitability).map(([key, ratio]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {getTrendIcon(ratio.trend)}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {(ratio.value * 100).toFixed(1)}%
                    </div>
                    {showBenchmarks && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          Benchmark: {(ratio.benchmark * 100).toFixed(1)}%
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(ratio.status)}`}>
                          {ratio.status.charAt(0).toUpperCase() + ratio.status.slice(1)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'efficiency' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(ratios.efficiency).map(([key, ratio]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {getTrendIcon(ratio.trend)}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {ratio.value.toFixed(1)}x
                    </div>
                    {showBenchmarks && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          Benchmark: {ratio.benchmark.toFixed(1)}x
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(ratio.status)}`}>
                          {ratio.status.charAt(0).toUpperCase() + ratio.status.slice(1)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'leverage' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(ratios.leverage).map(([key, ratio]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {getTrendIcon(ratio.trend)}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {ratio.value.toFixed(2)}
                    </div>
                    {showBenchmarks && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          Benchmark: {ratio.benchmark.toFixed(2)}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(ratio.status)}`}>
                          {ratio.status.charAt(0).toUpperCase() + ratio.status.slice(1)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(ratios.market).map(([key, ratio]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {getTrendIcon(ratio.trend)}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {key === 'dividendYield' ? (ratio.value * 100).toFixed(2) + '%' : ratio.value.toFixed(2)}
                    </div>
                    {showBenchmarks && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          Benchmark: {key === 'dividendYield' ? (ratio.benchmark * 100).toFixed(2) + '%' : ratio.benchmark.toFixed(2)}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(ratio.status)}`}>
                          {ratio.status.charAt(0).toUpperCase() + ratio.status.slice(1)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary and Insights */}
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
                <p className="font-medium text-green-800">Strong Liquidity Position</p>
                <p className="text-sm text-gray-600">Current ratio of 2.15 exceeds industry benchmark</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Improving Profitability</p>
                <p className="text-sm text-gray-600">ROE increased to 15% from previous period</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Monitor Inventory Turnover</p>
                <p className="text-sm text-gray-600">Slightly below industry average</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Ratio Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Excellent Ratios:</span>
              <span className="font-semibold text-green-600">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Good Ratios:</span>
              <span className="font-semibold text-blue-600">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Warning Ratios:</span>
              <span className="font-semibold text-yellow-600">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Poor Ratios:</span>
              <span className="font-semibold text-red-600">0</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between font-semibold">
              <span>Overall Score:</span>
              <span className="text-green-600">85/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialRatios;
