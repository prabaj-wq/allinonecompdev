import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Filter,
  Search,
  BarChart3,
  Clock,
  TrendingUp,
  Eye,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';

const InternalControls = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [selectedControlType, setSelectedControlType] = useState('all');
  const [loading, setLoading] = useState(false);

  const [controlData, setControlData] = useState({
    overview: {
      totalControls: 156,
      activeControls: 142,
      inactiveControls: 14,
      criticalControls: 23,
      highRiskControls: 45,
      mediumRiskControls: 68,
      lowRiskControls: 20,
      overallEffectiveness: 0.89,
      lastAssessment: '2024-01-15',
      nextAssessment: '2024-04-15'
    },
    byCategory: {
      financial: {
        total: 45,
        active: 42,
        critical: 8,
        effectiveness: 0.93,
        lastTested: '2024-01-10',
        status: 'effective'
      },
      operational: {
        total: 38,
        active: 35,
        critical: 6,
        effectiveness: 0.87,
        lastTested: '2024-01-12',
        status: 'effective'
      },
      compliance: {
        total: 32,
        active: 28,
        critical: 5,
        effectiveness: 0.84,
        lastTested: '2024-01-08',
        status: 'needs_attention'
      },
      it: {
        total: 25,
        active: 22,
        critical: 2,
        effectiveness: 0.88,
        lastTested: '2024-01-14',
        status: 'effective'
      },
      security: {
        total: 16,
        active: 15,
        critical: 2,
        effectiveness: 0.94,
        lastTested: '2024-01-15',
        status: 'effective'
      }
    },
    byEntity: {
      parent: {
        total: 89,
        active: 82,
        effectiveness: 0.92,
        status: 'effective'
      },
      subsidiary1: {
        total: 45,
        active: 40,
        effectiveness: 0.85,
        status: 'needs_attention'
      },
      subsidiary2: {
        total: 22,
        active: 20,
        effectiveness: 0.91,
        status: 'effective'
      }
    },
    controlList: [
      {
        id: 'IC001',
        name: 'Segregation of Duties - Cash Management',
        category: 'financial',
        entity: 'parent',
        risk: 'high',
        status: 'active',
        effectiveness: 0.95,
        lastTested: '2024-01-10',
        nextTest: '2024-04-10',
        owner: 'John Smith',
        description: 'Ensures cash receipts and disbursements are handled by different personnel'
      },
      {
        id: 'IC002',
        name: 'System Access Controls',
        category: 'it',
        entity: 'parent',
        risk: 'critical',
        status: 'active',
        effectiveness: 0.92,
        lastTested: '2024-01-14',
        nextTest: '2024-04-14',
        owner: 'Sarah Johnson',
        description: 'Controls access to financial systems and sensitive data'
      },
      {
        id: 'IC003',
        name: 'Bank Reconciliation',
        category: 'financial',
        entity: 'subsidiary1',
        risk: 'high',
        status: 'active',
        effectiveness: 0.78,
        lastTested: '2024-01-05',
        nextTest: '2024-04-05',
        owner: 'Mike Davis',
        description: 'Monthly reconciliation of bank accounts with general ledger'
      },
      {
        id: 'IC004',
        name: 'Inventory Count Procedures',
        category: 'operational',
        entity: 'parent',
        risk: 'medium',
        status: 'active',
        effectiveness: 0.88,
        lastTested: '2024-01-12',
        nextTest: '2024-04-12',
        owner: 'Lisa Wilson',
        description: 'Quarterly physical inventory counts and reconciliation'
      },
      {
        id: 'IC005',
        name: 'Vendor Approval Process',
        category: 'operational',
        entity: 'subsidiary2',
        risk: 'medium',
        status: 'inactive',
        effectiveness: 0.65,
        lastTested: '2023-12-15',
        nextTest: '2024-03-15',
        owner: 'Tom Brown',
        description: 'Approval workflow for new vendor setup and changes'
      }
    ],
    testing: {
      planned: 45,
      inProgress: 12,
      completed: 89,
      overdue: 8,
      failed: 3,
      upcoming: [
        { control: 'IC001', dueDate: '2024-02-15', priority: 'high' },
        { control: 'IC003', dueDate: '2024-02-20', priority: 'high' },
        { control: 'IC005', dueDate: '2024-02-25', priority: 'medium' }
      ]
    },
    incidents: [
      {
        id: 'INC001',
        control: 'IC003',
        severity: 'medium',
        description: 'Bank reconciliation not completed within required timeframe',
        date: '2024-01-15',
        status: 'resolved',
        action: 'Process updated and additional training provided'
      },
      {
        id: 'INC002',
        control: 'IC005',
        severity: 'high',
        description: 'Vendor approval bypassed for emergency purchase',
        date: '2024-01-10',
        status: 'investigating',
        action: 'Under review by compliance team'
      }
    ]
  });

  const [filters, setFilters] = useState({
    controlType: 'all',
    riskLevel: 'all',
    status: 'all',
    entity: 'all'
  });

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'needs_attention': return 'bg-yellow-100 text-yellow-800';
      case 'effective': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffectivenessColor = (effectiveness) => {
    if (effectiveness >= 0.9) return 'text-green-600';
    if (effectiveness >= 0.8) return 'text-yellow-600';
    if (effectiveness >= 0.7) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIncidentStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'open': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDaysUntil = (date) => {
    const today = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateStatus = (dueDate) => {
    const daysUntil = calculateDaysUntil(dueDate);
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'urgent';
    if (daysUntil <= 30) return 'warning';
    return 'safe';
  };

  const getDueDateColor = (status) => {
    switch (status) {
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'safe': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const generateControlReport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Internal Controls Report generated successfully!');
    }, 2000);
  };

  const exportControlData = (format) => {
    const data = {
      controlData,
      filters,
      period: selectedPeriod,
      entity: selectedEntity,
      timestamp: new Date().toISOString()
    };
    
    console.log(`Exporting ${format.toUpperCase()}:`, data);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'byCategory', name: 'By Category', icon: <Shield className="w-4 h-4" /> },
    { id: 'byEntity', name: 'By Entity', icon: <Eye className="w-4 h-4" /> },
    { id: 'controlList', name: 'Control List', icon: <FileText className="w-4 h-4" /> },
    { id: 'testing', name: 'Testing & Monitoring', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'incidents', name: 'Incidents & Issues', icon: <AlertTriangle className="w-4 h-4" /> }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Internal Controls</h1>
          <p className="text-gray-600 mt-2">Comprehensive control framework management and monitoring</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateControlReport}
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
            <h3 className="text-sm font-medium text-gray-700">Total Controls</h3>
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {controlData.overview.totalControls}
          </div>
          <div className="text-sm text-gray-600">
            {controlData.overview.activeControls} Active
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Overall Effectiveness</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {(controlData.overview.overallEffectiveness * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">
            Last assessed: {new Date(controlData.overview.lastAssessment).toLocaleDateString()}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Critical Controls</h3>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600 mb-1">
            {controlData.overview.criticalControls}
          </div>
          <div className="text-sm text-gray-600">
            High risk controls requiring attention
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Next Assessment</h3>
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {calculateDaysUntil(controlData.overview.nextAssessment)}
          </div>
          <div className="text-sm text-gray-600">Days until next review</div>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Control Type</label>
            <select
              value={filters.controlType}
              onChange={(e) => setFilters({...filters, controlType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="financial">Financial</option>
              <option value="operational">Operational</option>
              <option value="compliance">Compliance</option>
              <option value="it">IT</option>
              <option value="security">Security</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="needs_attention">Needs Attention</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => exportControlData('csv')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              CSV
            </button>
            <button
              onClick={() => exportControlData('excel')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Excel
            </button>
            <button
              onClick={() => exportControlData('pdf')}
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
                  <h3 className="text-lg font-semibold mb-4">Control Distribution</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Critical Controls:</span>
                      <span className="font-semibold text-red-600">
                        {controlData.overview.criticalControls}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">High Risk Controls:</span>
                      <span className="font-semibold text-orange-600">
                        {controlData.overview.highRiskControls}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Medium Risk Controls:</span>
                      <span className="font-semibold text-yellow-600">
                        {controlData.overview.mediumRiskControls}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Low Risk Controls:</span>
                      <span className="font-semibold text-green-600">
                        {controlData.overview.lowRiskControls}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Effectiveness Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Overall Effectiveness:</span>
                      <span className="font-semibold text-green-600">
                        {(controlData.overview.overallEffectiveness * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Controls:</span>
                      <span className="font-semibold text-blue-600">
                        {controlData.overview.activeControls}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Inactive Controls:</span>
                      <span className="font-semibold text-red-600">
                        {controlData.overview.inactiveControls}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Control Coverage:</span>
                      <span className="font-semibold text-blue-600">
                        {((controlData.overview.activeControls / controlData.overview.totalControls) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overview Chart */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Control Effectiveness Overview</h3>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Interactive Chart Component</p>
                    <p className="text-sm">Overall Effectiveness: 89% | Critical Controls: 23</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'byCategory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(controlData.byCategory).map(([key, category]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(category.status)
                      }`}>
                        {category.status.replace('_', ' ').split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Controls:</span>
                        <span className="font-medium">{category.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Active Controls:</span>
                        <span className="font-medium">{category.active}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Critical Controls:</span>
                        <span className="font-medium">{category.critical}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Effectiveness:</span>
                        <span className={`font-medium ${getEffectivenessColor(category.effectiveness)}`}>
                          {(category.effectiveness * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Tested:</span>
                        <span className="font-medium">
                          {new Date(category.lastTested).toLocaleDateString()}
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
                {Object.entries(controlData.byEntity).map(([key, entity]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-700 capitalize">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(entity.status)
                      }`}>
                        {entity.status.replace('_', ' ').split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Controls:</span>
                        <span className="font-medium">{entity.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Active Controls:</span>
                        <span className="font-medium">{entity.active}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Effectiveness:</span>
                        <span className={`font-medium ${getEffectivenessColor(entity.effectiveness)}`}>
                          {(entity.effectiveness * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'controlList' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Control ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Effectiveness
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next Test
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {controlData.controlList.map((control, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {control.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{control.name}</div>
                            <div className="text-xs text-gray-500">{control.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {control.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {control.entity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getRiskColor(control.risk)
                          }`}>
                            {control.risk.charAt(0).toUpperCase() + control.risk.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getStatusColor(control.status)
                          }`}>
                            {control.status.replace('_', ' ').split(' ').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={getEffectivenessColor(control.effectiveness)}>
                            {(control.effectiveness * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getDueDateColor(getDueDateStatus(control.nextTest))
                          }`}>
                            {new Date(control.nextTest).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Testing Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Planned:</span>
                      <span className="font-medium text-blue-600">{controlData.testing.planned}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">In Progress:</span>
                      <span className="font-medium text-yellow-600">{controlData.testing.inProgress}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium text-green-600">{controlData.testing.completed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Overdue:</span>
                      <span className="font-medium text-red-600">{controlData.testing.overdue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Failed:</span>
                      <span className="font-medium text-red-600">{controlData.testing.failed}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Upcoming Tests</h3>
                  <div className="space-y-2">
                    {controlData.testing.upcoming.map((test, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{test.control}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getDueDateColor(getDueDateStatus(test.dueDate))
                        }`}>
                          {new Date(test.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Incident ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Control
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action Taken
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {controlData.incidents.map((incident, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {incident.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {incident.control}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getSeverityColor(incident.severity)
                          }`}>
                            {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {incident.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(incident.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getIncidentStatusColor(incident.status)
                          }`}>
                            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {incident.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            Control Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Strong Overall Effectiveness</p>
                <p className="text-sm text-gray-600">89% effectiveness rate across all controls</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Good Control Coverage</p>
                <p className="text-sm text-gray-600">91% of controls are currently active</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Monitor Compliance Controls</p>
                <p className="text-sm text-gray-600">84% effectiveness needs improvement</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Control Recommendations</h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Immediate:</strong> Review and update compliance controls for Subsidiary 1
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Short-term:</strong> Implement automated testing for IT controls
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Long-term:</strong> Develop comprehensive control framework documentation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternalControls;
