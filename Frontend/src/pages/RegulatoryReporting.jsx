import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Download, 
  Upload, 
  Eye, 
  Edit, 
  Send, 
  Calendar,
  Filter,
  Search,
  BarChart3,
  Shield,
  Users,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Info,
  Globe,
  Calculator,
  Leaf
} from 'lucide-react'

const RegulatoryReporting = () => {
  const { user } = useAuth()
  const { selectedCompany } = useCompany()
  const [activeTab, setActiveTab] = useState('catalog')
  const [selectedReport, setSelectedReport] = useState(null)
  const [reports, setReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [filters, setFilters] = useState({
    jurisdiction: '',
    regulation: '',
    period: '',
    entity: '',
    status: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationResults, setValidationResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  useEffect(() => {
    filterReports()
  }, [reports, filters, searchTerm])

  const loadReports = async () => {
    setLoading(true)
    try {
      // Mock data for demonstration
      const mockReports = [
        {
          id: 1,
          name: 'IFRS Annual Financial Statements',
          jurisdiction: 'International',
          regulation: 'IFRS',
          period: 'Annual',
          entity: 'Consolidated',
          status: 'Draft',
          dueDate: '2025-03-31',
          lastModified: '2025-01-15',
          preparer: 'John Doe',
          reviewer: 'Jane Smith',
          approver: 'Mike Johnson',
          validationErrors: 3,
          validationWarnings: 2,
          dataSources: ['Trial Balance', 'General Ledger', 'Entity Data'],
          attachments: 5,
          version: '1.2'
        },
        {
          id: 2,
          name: 'US GAAP Quarterly Report',
          jurisdiction: 'United States',
          regulation: 'US GAAP',
          period: 'Quarterly',
          entity: 'Parent Company',
          status: 'Under Review',
          dueDate: '2025-02-15',
          lastModified: '2025-01-10',
          preparer: 'Sarah Wilson',
          reviewer: 'David Brown',
          approver: 'Lisa Chen',
          validationErrors: 1,
          validationWarnings: 0,
          dataSources: ['Trial Balance', 'Subsidiary Data'],
          attachments: 3,
          version: '2.1'
        },
        {
          id: 3,
          name: 'Local Tax Filing',
          jurisdiction: 'Local',
          regulation: 'Tax Code',
          period: 'Annual',
          entity: 'All Entities',
          status: 'Filed',
          dueDate: '2025-01-31',
          lastModified: '2025-01-05',
          preparer: 'Alex Rodriguez',
          reviewer: 'Maria Garcia',
          approver: 'Carlos Lopez',
          validationErrors: 0,
          validationWarnings: 0,
          dataSources: ['Tax Calculations', 'Entity Data'],
          attachments: 8,
          version: '3.0'
        },
        {
          id: 4,
          name: 'ESG Sustainability Report',
          jurisdiction: 'International',
          regulation: 'ESG Standards',
          period: 'Annual',
          entity: 'Consolidated',
          status: 'Draft',
          dueDate: '2025-06-30',
          lastModified: '2025-01-12',
          preparer: 'Emma Thompson',
          reviewer: 'James Wilson',
          approver: 'Sophie Davis',
          validationErrors: 2,
          validationWarnings: 4,
          dataSources: ['ESG Metrics', 'Sustainability Data'],
          attachments: 12,
          version: '1.0'
        }
      ]
      setReports(mockReports)
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterReports = () => {
    let filtered = reports.filter(report => {
      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.regulation.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilters = (!filters.jurisdiction || report.jurisdiction === filters.jurisdiction) &&
                            (!filters.regulation || report.regulation === filters.regulation) &&
                            (!filters.period || report.period === filters.period) &&
                            (!filters.entity || report.entity === filters.entity) &&
                            (!filters.status || report.status === filters.status)
      
      return matchesSearch && matchesFilters
    })
    
    setFilteredReports(filtered)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'Under Review': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Filed': return 'bg-green-100 text-green-800 border-green-300'
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Draft': return <Edit className="w-3 h-3" />
      case 'Under Review': return <Clock className="w-3 h-3" />
      case 'Approved': return <CheckCircle className="w-3 h-3" />
      case 'Filed': return <Send className="w-3 h-3" />
      default: return <Info className="w-3 h-3" />
    }
  }

  const getModuleColor = (module) => {
    switch (module) {
      case 'Consolidation': return 'bg-blue-100 text-blue-800'
      case 'Financial Statements': return 'bg-green-100 text-green-800'
      case 'Tax': return 'bg-purple-100 text-purple-800'
      case 'ESG': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getModuleIcon = (module) => {
    switch (module) {
      case 'Consolidation': return <BarChart3 className="w-3 h-3" />
      case 'Financial Statements': return <FileText className="w-3 h-3" />
      case 'Tax': return <Calculator className="w-3 h-3" />
      case 'ESG': return <Leaf className="w-3 h-3" />
      default: return <Settings className="w-3 h-3" />
    }
  }

  const getJurisdictionIcon = (jurisdiction) => {
    switch (jurisdiction) {
      case 'International': return <Globe className="w-4 h-4" />
      case 'United States': return <Shield className="w-4 h-4" />
      case 'Local': return <Settings className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const runValidation = (report) => {
    // Mock validation results
    const mockValidation = [
      {
        type: 'error',
        field: 'Total Assets',
        message: 'Total assets do not match between balance sheet and trial balance',
        severity: 'high',
        suggestion: 'Review consolidation eliminations'
      },
      {
        type: 'error',
        field: 'Revenue Recognition',
        message: 'Revenue recognition criteria not met for contract XYZ',
        severity: 'high',
        suggestion: 'Review contract terms and IFRS 15 compliance'
      },
      {
        type: 'warning',
        field: 'Related Party Transactions',
        message: 'Related party disclosure incomplete',
        severity: 'medium',
        suggestion: 'Add missing related party relationships'
      },
      {
        type: 'warning',
        field: 'Segment Reporting',
        message: 'Segment information may not meet quantitative thresholds',
        severity: 'medium',
        suggestion: 'Review segment identification criteria'
      }
    ]
    
    setValidationResults(mockValidation)
    setSelectedReport(report)
    setShowValidationModal(true)
  }

  const tabs = [
    { id: 'catalog', label: 'Report Catalog', icon: FileText },
    { id: 'drafts', label: 'Drafts', icon: Edit },
    { id: 'under-review', label: 'Under Review', icon: Clock },
    { id: 'filed', label: 'Filed', icon: Send },
    { id: 'calendar', label: 'Filing Calendar', icon: Calendar },
    { id: 'templates', label: 'Templates', icon: BookOpen },
    { id: 'guidance', label: 'Guidance', icon: HelpCircle }
  ]

  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Regulatory Reporting
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please select a company to continue
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Regulatory Reporting
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage regulatory compliance, filings, and reporting requirements
              </p>
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Report
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Total Reports</p>
                  <p className="text-2xl font-bold text-blue-600">{reports.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">Due This Month</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {reports.filter(r => new Date(r.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900 dark:text-green-200">Filed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {reports.filter(r => r.status === 'Filed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {reports.filter(r => new Date(r.dueDate) < new Date()).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Report Catalog Tab */}
            {activeTab === 'catalog' && (
              <div className="space-y-6">
                {/* Filters and Search */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search reports..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Jurisdiction
                      </label>
                      <select
                        value={filters.jurisdiction}
                        onChange={(e) => handleFilterChange('jurisdiction', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      >
                        <option value="">All Jurisdictions</option>
                        <option value="International">International</option>
                        <option value="United States">United States</option>
                        <option value="Local">Local</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Regulation
                      </label>
                      <select
                        value={filters.regulation}
                        onChange={(e) => handleFilterChange('regulation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      >
                        <option value="">All Regulations</option>
                        <option value="IFRS">IFRS</option>
                        <option value="US GAAP">US GAAP</option>
                        <option value="Tax Code">Tax Code</option>
                        <option value="ESG Standards">ESG Standards</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Period
                      </label>
                      <select
                        value={filters.period}
                        onChange={(e) => handleFilterChange('period', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      >
                        <option value="">All Periods</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Annual">Annual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Entity
                      </label>
                      <select
                        value={filters.entity}
                        onChange={(e) => handleFilterChange('entity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      >
                        <option value="">All Entities</option>
                        <option value="Consolidated">Consolidated</option>
                        <option value="Parent Company">Parent Company</option>
                        <option value="All Entities">All Entities</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      >
                        <option value="">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Filed">Filed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reports List */}
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            {getJurisdictionIcon(report.jurisdiction)}
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {report.name}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                              {getStatusIcon(report.status)}
                              <span className="ml-1">{report.status}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Jurisdiction</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{report.jurisdiction}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Regulation</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{report.regulation}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Period</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{report.period}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(report.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Last Modified</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(report.lastModified).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Version</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{report.version}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Attachments</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{report.attachments}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Preparer: {report.preparer}</span>
                            <span>Reviewer: {report.reviewer}</span>
                            <span>Approver: {report.approver}</span>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => runValidation(report)}
                            className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Validate
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report)
                              setShowReportModal(true)
                            }}
                            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                          <button className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </button>
                        </div>
                      </div>

                      {/* Validation Summary */}
                      {(report.validationErrors > 0 || report.validationWarnings > 0) && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="flex items-center space-x-4 text-sm">
                            {report.validationErrors > 0 && (
                              <span className="flex items-center text-red-600">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                {report.validationErrors} errors
                              </span>
                            )}
                            {report.validationWarnings > 0 && (
                              <span className="flex items-center text-yellow-600">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                {report.validationWarnings} warnings
                              </span>
                            )}
                            <button
                              onClick={() => runValidation(report)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other tabs content would go here */}
            {activeTab !== 'catalog' && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {tabs.find(t => t.id === activeTab)?.label} Coming Soon
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This feature is under development.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Validation Modal */}
        {showValidationModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Validation Results - {selectedReport.name}
                </h3>
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {validationResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        result.type === 'error' 
                          ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                          : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {result.type === 'error' ? (
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {result.field}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {result.message}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            <strong>Suggestion:</strong> {result.suggestion}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                            Fix Now
                          </button>
                          <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                            Ignore
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Export Results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RegulatoryReporting
