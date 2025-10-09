import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  FileText, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Filter,
  Search,
  PieChart,
  Globe,
  Shield,
  TrendingUp,
  Clock
} from 'lucide-react';

const TaxManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('all');
  const [loading, setLoading] = useState(false);

  const [taxData, setTaxData] = useState({
    overview: {
      totalTaxExpense: 1250000,
      currentTaxLiability: 850000,
      deferredTaxAssets: 150000,
      deferredTaxLiabilities: 200000,
      effectiveTaxRate: 0.25,
      statutoryTaxRate: 0.21,
      taxSavings: 180000
    },
    byJurisdiction: {
      federal: { 
        taxExpense: 800000, 
        taxRate: 0.21, 
        status: 'compliant',
        filingDeadline: '2024-03-15',
        lastFiling: '2023-03-15'
      },
      state: { 
        taxExpense: 300000, 
        taxRate: 0.06, 
        status: 'compliant',
        filingDeadline: '2024-04-15',
        lastFiling: '2023-04-15'
      },
      international: { 
        taxExpense: 150000, 
        taxRate: 0.15, 
        status: 'pending',
        filingDeadline: '2024-06-30',
        lastFiling: '2023-06-30'
      }
    },
    byEntity: {
      parent: { 
        taxExpense: 700000, 
        effectiveRate: 0.24, 
        status: 'compliant' 
      },
      subsidiary1: { 
        taxExpense: 350000, 
        effectiveRate: 0.26, 
        status: 'compliant' 
      },
      subsidiary2: { 
        taxExpense: 200000, 
        effectiveRate: 0.28, 
        status: 'review' 
      }
    },
    compliance: [
      { 
        jurisdiction: 'Federal', 
        entity: 'Parent Company', 
        filingType: 'Form 1120', 
        dueDate: '2024-03-15', 
        status: 'filed', 
        amount: 800000,
        penalties: 0,
        interest: 0
      },
      { 
        jurisdiction: 'State', 
        entity: 'Parent Company', 
        filingType: 'State Tax Return', 
        dueDate: '2024-04-15', 
        status: 'pending', 
        amount: 300000,
        penalties: 0,
        interest: 0
      },
      { 
        jurisdiction: 'International', 
        entity: 'Subsidiary 1', 
        filingType: 'Local Tax Return', 
        dueDate: '2024-06-30', 
        status: 'not_filed', 
        amount: 150000,
        penalties: 0,
        interest: 0
      }
    ],
    planning: {
      currentYear: {
        projectedIncome: 5000000,
        projectedTax: 1250000,
        taxSavings: 180000,
        strategies: [
          'Accelerated depreciation on new equipment',
          'R&D tax credits',
          'State tax optimization',
          'International tax planning'
        ]
      },
      nextYear: {
        projectedIncome: 5500000,
        projectedTax: 1375000,
        taxSavings: 200000,
        strategies: [
          'Enhanced R&D credits',
          'Geographic expansion planning',
          'Entity restructuring',
          'Tax-efficient financing'
        ]
      }
    }
  });

  const [filters, setFilters] = useState({
    taxType: 'all',
    complianceStatus: 'all',
    entity: 'all',
    jurisdiction: 'all'
  });

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getComplianceStatusColor = (status) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'not_filed': return 'bg-red-100 text-red-800';
      case 'filed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceIcon = (status) => {
    switch (status) {
      case 'compliant':
      case 'filed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'review': return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      case 'not_filed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const calculateDaysUntilDeadline = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineStatus = (deadline) => {
    const daysUntil = calculateDaysUntilDeadline(deadline);
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 30) return 'urgent';
    if (daysUntil <= 90) return 'warning';
    return 'safe';
  };

  const getDeadlineColor = (status) => {
    switch (status) {
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'safe': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const generateTaxReport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Tax Management Report generated successfully!');
    }, 2000);
  };

  const exportTaxData = (format) => {
    const data = {
      taxData,
      filters,
      period: selectedPeriod,
      entity: selectedEntity,
      jurisdiction: selectedJurisdiction,
      timestamp: new Date().toISOString()
    };
    
    console.log(`Exporting ${format.toUpperCase()}:`, data);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <PieChart className="w-4 h-4" /> },
    { id: 'byJurisdiction', name: 'By Jurisdiction', icon: <Globe className="w-4 h-4" /> },
    { id: 'byEntity', name: 'By Entity', icon: <Calculator className="w-4 h-4" /> },
    { id: 'compliance', name: 'Compliance', icon: <Shield className="w-4 h-4" /> },
    { id: 'planning', name: 'Tax Planning', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Management</h1>
          <p className="text-gray-600 mt-2">Comprehensive tax planning, compliance, and optimization</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateTaxReport}
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
            <h3 className="text-sm font-medium text-gray-700">Total Tax Expense</h3>
            <Calculator className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600 mb-1">
            {formatCurrency(taxData.overview.totalTaxExpense)}
          </div>
          <div className="text-sm text-gray-600">
            Effective Rate: {(taxData.overview.effectiveTaxRate * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Current Tax Liability</h3>
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {formatCurrency(taxData.overview.currentTaxLiability)}
          </div>
          <div className="text-sm text-gray-600">Due within 12 months</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Tax Savings</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatCurrency(taxData.overview.taxSavings)}
          </div>
          <div className="text-sm text-gray-600">Through optimization</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Compliance Score</h3>
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">92%</div>
          <div className="text-sm text-gray-600">All filings current</div>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Jurisdiction</label>
            <select
              value={filters.jurisdiction}
              onChange={(e) => setFilters({...filters, jurisdiction: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Jurisdictions</option>
              <option value="federal">Federal</option>
              <option value="state">State</option>
              <option value="international">International</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Type</label>
            <select
              value={filters.taxType}
              onChange={(e) => setFilters({...filters, taxType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="income">Income Tax</option>
              <option value="sales">Sales Tax</option>
              <option value="property">Property Tax</option>
              <option value="payroll">Payroll Tax</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Status</label>
            <select
              value={filters.complianceStatus}
              onChange={(e) => setFilters({...filters, complianceStatus: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="compliant">Compliant</option>
              <option value="pending">Pending</option>
              <option value="review">Under Review</option>
              <option value="not_filed">Not Filed</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => exportTaxData('csv')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              CSV
            </button>
            <button
              onClick={() => exportTaxData('excel')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <button
                onClick={() => exportTaxData('pdf')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                PDF
              </button>
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
                  <h3 className="text-lg font-semibold mb-4">Tax Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Tax Expense:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(taxData.overview.totalTaxExpense)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current Tax Liability:</span>
                      <span className="font-semibold text-orange-600">
                        {formatCurrency(taxData.overview.currentTaxLiability)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Deferred Tax Assets:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(taxData.overview.deferredTaxAssets)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Deferred Tax Liabilities:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(taxData.overview.deferredTaxLiabilities)}
                      </span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Net Tax Position:</span>
                      <span className={`font-semibold ${
                        (taxData.overview.deferredTaxAssets - taxData.overview.deferredTaxLiabilities) > 0 
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(taxData.overview.deferredTaxAssets - taxData.overview.deferredTaxLiabilities)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Tax Rates & Efficiency</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Effective Tax Rate:</span>
                      <span className="font-semibold text-blue-600">
                        {(taxData.overview.effectiveTaxRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Statutory Tax Rate:</span>
                      <span className="font-semibold text-gray-600">
                        {(taxData.overview.statutoryTaxRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax Savings:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(taxData.overview.taxSavings)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax Efficiency:</span>
                      <span className="font-semibold text-green-600">
                        {((1 - taxData.overview.effectiveTaxRate / taxData.overview.statutoryTaxRate) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overview Chart */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Tax Composition Overview</h3>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <PieChart className="w-12 h-12 mx-auto mb-2" />
                    <p>Interactive Chart Component</p>
                    <p className="text-sm">Federal: $800K | State: $300K | International: $150K</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'byJurisdiction' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(taxData.byJurisdiction).map(([key, jurisdiction]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </h3>
                      {getComplianceIcon(jurisdiction.status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax Expense:</span>
                        <span className="font-medium">{formatCurrency(jurisdiction.taxExpense)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax Rate:</span>
                        <span className="font-medium">{(jurisdiction.taxRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getComplianceStatusColor(jurisdiction.status)
                        }`}>
                          {jurisdiction.status.charAt(0).toUpperCase() + jurisdiction.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Next Filing:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getDeadlineColor(getDeadlineStatus(jurisdiction.filingDeadline))
                        }`}>
                          {new Date(jurisdiction.filingDeadline).toLocaleDateString()}
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
                {Object.entries(taxData.byEntity).map(([key, entity]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </h3>
                      {getComplianceIcon(entity.status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax Expense:</span>
                        <span className="font-medium">{formatCurrency(entity.taxExpense)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Effective Rate:</span>
                        <span className="font-medium">{(entity.effectiveRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getComplianceStatusColor(entity.status)
                        }`}>
                          {entity.status.charAt(0).toUpperCase() + entity.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jurisdiction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filing Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Penalties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {taxData.compliance.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.jurisdiction}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.entity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.filingType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getDeadlineColor(getDeadlineStatus(item.dueDate))
                          }`}>
                            {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getComplianceStatusColor(item.status)
                          }`}>
                            {item.status.replace('_', ' ').split(' ').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.penalties)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'planning' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Current Year Planning</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Projected Income:</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(taxData.planning.currentYear.projectedIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Projected Tax:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(taxData.planning.currentYear.projectedTax)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax Savings:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(taxData.planning.currentYear.taxSavings)}
                      </span>
                    </div>
                    <hr className="my-3" />
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Tax Strategies:</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {taxData.planning.currentYear.strategies.map((strategy, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Next Year Planning</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Projected Income:</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(taxData.planning.nextYear.projectedIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Projected Tax:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(taxData.planning.nextYear.projectedTax)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax Savings:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(taxData.planning.nextYear.taxSavings)}
                      </span>
                    </div>
                    <hr className="my-3" />
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Advanced Strategies:</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {taxData.planning.nextYear.strategies.map((strategy, index) => (
                          <li key={index} className="flex items-start">
                            <TrendingUp className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
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
            Tax Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Strong Tax Efficiency</p>
                <p className="text-sm text-gray-600">Effective rate 4% below statutory rate</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Good Compliance Record</p>
                <p className="text-sm text-gray-600">92% compliance score with no penalties</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Monitor International Filing</p>
                <p className="text-sm text-gray-600">Subsidiary 1 filing due in 6 months</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Tax Optimization Opportunities</h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>R&D Credits:</strong> Potential additional $50K in R&D tax credits
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>State Optimization:</strong> Review nexus positions for state tax savings
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>International Planning:</strong> Consider transfer pricing optimization
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxManagement;
