import React, { useState, useEffect } from 'react'
import { 
  Globe, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  Settings, 
  Bell, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  BarChart3, 
  BookOpen, 
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download as DownloadIcon,
  Upload as UploadIcon,
  RefreshCw,
  Info,
  // Warning icon removed - using AlertTriangle instead
  XCircle,
  ChevronDown,
  ChevronRight,
  Star,
  Bookmark,
  MoreHorizontal
} from 'lucide-react'

const GlobalCompliance = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedStandard, setSelectedStandard] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Disclosure checklist state
  const [disclosureChecklists, setDisclosureChecklists] = useState([])
  const [disclosureLoading, setDisclosureLoading] = useState(false)
  const [showAddDisclosureModal, setShowAddDisclosureModal] = useState(false)
  const [selectedDisclosure, setSelectedDisclosure] = useState(null)
  const [disclosureFilters, setDisclosureFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all'
  })

  // Sample compliance data
  const regions = [
    { id: 'us', name: 'United States', flag: '🇺🇸', standards: ['US GAAP', 'SOX', 'SEC'] },
    { id: 'eu', name: 'European Union', flag: '🇪🇺', standards: ['IFRS', 'EU Directives'] },
    { id: 'uk', name: 'United Kingdom', flag: '🇬🇧', standards: ['UK GAAP', 'FRS'] },
    { id: 'ca', name: 'Canada', flag: '🇨🇦', standards: ['ASPE', 'IFRS'] },
    { id: 'au', name: 'Australia', flag: '🇦🇺', standards: ['AASB', 'IFRS'] },
    { id: 'jp', name: 'Japan', flag: '🇯🇵', standards: ['JGAAP', 'IFRS'] }
  ]

  const complianceRules = [
    {
      id: 1,
      title: 'IFRS 15 Revenue Recognition',
      region: 'Global',
      standard: 'IFRS',
      status: 'active',
      lastUpdated: '2025-01-15',
      effectiveDate: '2025-01-01',
      description: 'Revenue recognition principles for contracts with customers',
      impact: 'High',
      category: 'Revenue',
      documents: ['IFRS_15_Standard.pdf', 'Implementation_Guide.pdf'],
      changes: 'Minor updates to disclosure requirements'
    },
    {
      id: 2,
      title: 'US GAAP Lease Accounting',
      region: 'US',
      standard: 'US GAAP',
      status: 'active',
      lastUpdated: '2025-01-10',
      effectiveDate: '2025-01-01',
      description: 'ASC 842 lease accounting standard implementation',
      impact: 'High',
      category: 'Leases',
      documents: ['ASC_842_Standard.pdf', 'FASB_Update.pdf'],
      changes: 'No recent changes'
    },
    {
      id: 3,
      title: 'EU Sustainability Reporting',
      region: 'EU',
      standard: 'CSRD',
      status: 'new',
      lastUpdated: '2025-01-20',
      effectiveDate: '2025-01-01',
      description: 'Corporate Sustainability Reporting Directive requirements',
      impact: 'Medium',
      category: 'Sustainability',
      documents: ['CSRD_Directive.pdf', 'ESRS_Standards.pdf'],
      changes: 'New standard effective 2025'
    }
  ]

  const filingCalendar = [
    {
      id: 1,
      entity: 'Sample Corp Ltd',
      jurisdiction: 'US',
      filingType: '10-K Annual Report',
      dueDate: '2025-03-31',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 2,
      entity: 'Sample Corp Ltd',
      jurisdiction: 'UK',
      filingType: 'Annual Accounts',
      dueDate: '2025-06-30',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 3,
      entity: 'Sample Corp Ltd',
      jurisdiction: 'EU',
      filingType: 'ESEF Filing',
      dueDate: '2025-04-30',
      status: 'pending',
      priority: 'high'
    }
  ]

  const recentUpdates = [
    {
      id: 1,
      title: 'IFRS 18 Primary Financial Statements',
      date: '2025-01-20',
      type: 'new',
      description: 'New standard for primary financial statements effective 2027',
      impact: 'High'
    },
    {
      id: 2,
      title: 'US GAAP Crypto Asset Accounting',
      date: '2025-01-18',
      type: 'update',
      description: 'Updated guidance for crypto asset measurement and disclosure',
      impact: 'Medium'
    },
    {
      id: 3,
      title: 'EU Taxonomy Regulation',
      date: '2025-01-15',
      type: 'update',
      description: 'Updated environmental sustainability criteria',
      impact: 'Medium'
    }
  ]

  // Sample disclosure checklist data
  const sampleDisclosureChecklists = [
    {
      id: 1,
      title: 'Financial Statement Disclosures',
      category: 'Financial Reporting',
      status: 'completed',
      priority: 'high',
      due_date: '2024-12-31',
      assigned_to: 'John Smith',
      description: 'Required disclosures for annual financial statements including related party transactions, contingent liabilities, and segment reporting.',
      compliance_framework: 'IFRS',
      risk_level: 'Medium',
      checklist_items: [
        { id: 1, item_text: 'Related party transactions disclosed', completed: true, notes: 'All related party transactions properly disclosed' },
        { id: 2, item_text: 'Contingent liabilities documented', completed: true, notes: 'Legal contingencies reviewed and disclosed' },
        { id: 3, item_text: 'Segment reporting prepared', completed: true, notes: 'Business segments identified and reported' },
        { id: 4, item_text: 'Subsequent events reviewed', completed: false, notes: 'Pending review of events after balance sheet date' }
      ],
      attachments: [
        { id: 1, filename: 'disclosure_template.docx', file_type: 'docx', file_size: 245760 }
      ]
    },
    {
      id: 2,
      title: 'Environmental Compliance Disclosures',
      category: 'Environmental',
      status: 'in-progress',
      priority: 'medium',
      due_date: '2024-11-30',
      assigned_to: 'Sarah Johnson',
      description: 'Environmental impact disclosures including carbon footprint, waste management, and sustainability initiatives.',
      compliance_framework: 'GRI Standards',
      risk_level: 'Low',
      checklist_items: [
        { id: 1, item_text: 'Carbon emissions calculated', completed: true, notes: 'Scope 1 and 2 emissions calculated' },
        { id: 2, item_text: 'Waste management data compiled', completed: false, notes: 'Data collection in progress' },
        { id: 3, item_text: 'Sustainability goals documented', completed: false, notes: 'Goals to be finalized' }
      ],
      attachments: [
        { id: 1, filename: 'environmental_policy.pdf', file_type: 'pdf', file_size: 1024000 }
      ]
    },
    {
      id: 3,
      title: 'Data Privacy Disclosures',
      category: 'Privacy & Security',
      status: 'pending',
      priority: 'high',
      due_date: '2024-12-15',
      assigned_to: 'Mike Chen',
      description: 'GDPR and data protection disclosures including data processing activities, retention policies, and user rights.',
      compliance_framework: 'GDPR',
      risk_level: 'High',
      checklist_items: [
        { id: 1, item_text: 'Data processing activities mapped', completed: false, notes: 'In progress' },
        { id: 2, item_text: 'Retention policies reviewed', completed: false, notes: 'Legal review required' },
        { id: 3, item_text: 'User rights procedures documented', completed: false, notes: 'To be completed' }
      ],
      attachments: [
        { id: 1, filename: 'privacy_policy.docx', file_type: 'docx', file_size: 512000 },
        { id: 2, filename: 'gdpr_guidance.pdf', file_type: 'pdf', file_size: 2048000 }
      ]
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getUpdateTypeIcon = (type) => {
    switch (type) {
      case 'new': return <Plus className="h-4 w-4" />
      case 'update': return <Edit className="h-4 w-4" />
      case 'deprecated': return <XCircle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getUpdateTypeColor = (type) => {
    switch (type) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'update': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'deprecated': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  // Disclosure checklist functions
  useEffect(() => {
    if (activeTab === 'disclosure') {
      loadDisclosureChecklists()
    }
  }, [activeTab])

  const loadDisclosureChecklists = async () => {
    setDisclosureLoading(true)
    try {
      // For now, use sample data. In production, this would be an API call
      // const response = await fetch('/api/disclosure-checklists')
      // const data = await response.json()
      // setDisclosureChecklists(data.checklists)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setDisclosureChecklists(sampleDisclosureChecklists)
    } catch (error) {
      console.error('Error loading disclosure checklists:', error)
    } finally {
      setDisclosureLoading(false)
    }
  }

  const handleAddDisclosure = () => {
    setShowAddDisclosureModal(true)
  }

  const handleDisclosureClick = (disclosure) => {
    setSelectedDisclosure(disclosure)
  }

  const handleUpdateChecklistItem = async (checklistId, itemId, completed, notes) => {
    try {
      // In production, this would be an API call
      // await fetch(`/api/disclosure-checklists/${checklistId}/items/${itemId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //   body: new URLSearchParams({ completed, notes })
      // })
      
      // Update local state
      setDisclosureChecklists(prev => 
        prev.map(checklist => 
          checklist.id === checklistId 
            ? {
                ...checklist,
                checklist_items: checklist.checklist_items.map(item =>
                  item.id === itemId 
                    ? { ...item, completed, notes }
                    : item
                )
              }
            : checklist
        )
      )
    } catch (error) {
      console.error('Error updating checklist item:', error)
    }
  }

  const filteredDisclosureChecklists = disclosureChecklists.filter(checklist => {
    if (disclosureFilters.status !== 'all' && checklist.status !== disclosureFilters.status) return false
    if (disclosureFilters.category !== 'all' && checklist.category !== disclosureFilters.category) return false
    if (disclosureFilters.priority !== 'all' && checklist.priority !== disclosureFilters.priority) return false
    return true
  })

  const disclosureStats = {
    total: disclosureChecklists.length,
    completed: disclosureChecklists.filter(d => d.status === 'completed').length,
    inProgress: disclosureChecklists.filter(d => d.status === 'in-progress').length,
    pending: disclosureChecklists.filter(d => d.status === 'pending').length,
    overdue: disclosureChecklists.filter(d => new Date(d.due_date) < new Date() && d.status !== 'completed').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Global Compliance & Reporting</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Multi-jurisdiction compliance management and regulatory reporting
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Upload className="h-4 w-4 mr-2" />
            Import Rules
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Notifications Bar */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Recent Regulatory Updates
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {recentUpdates.length} new updates available. Review and update your compliance framework.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            {showNotifications ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
        
        {showNotifications && (
          <div className="mt-4 space-y-3">
            {recentUpdates.map((update) => (
              <div key={update.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className={`p-1 rounded-full ${getUpdateTypeColor(update.type)}`}>
                  {getUpdateTypeIcon(update.type)}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">{update.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{update.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(update.impact)}`}>
                    {update.impact}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{update.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Compliance Overview', icon: '📊' },
            { id: 'rules', name: 'Regulatory Rules', icon: '📋' },
            { id: 'filing', name: 'Filing Calendar', icon: '📅' },
            { id: 'disclosure', name: 'Disclosure Checklist', icon: '✅' },
            { id: 'monitoring', name: 'Compliance Monitoring', icon: '🔍' },
            { id: 'resources', name: 'Resources', icon: '📚' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Compliance Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Regional Compliance Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region) => (
              <div key={region.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl">{region.flag}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{region.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{region.standards.join(', ')}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Compliance Score</span>
                    <span className="font-medium text-slate-900 dark:text-white">92%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Active Rules</span>
                    <span className="font-medium text-slate-900 dark:text-white">24</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-600 dark:text-slate-400">Pending Updates</span>
                    <span className="font-medium text-slate-900 dark:text-white">3</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compliance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Total Rules', count: 156, icon: BookOpen, color: 'bg-blue-500' },
              { title: 'Compliant Entities', count: 8, icon: CheckCircle, color: 'bg-green-500' },
              { title: 'Pending Reviews', count: 12, icon: Clock, color: 'bg-yellow-500' },
              { title: 'Overdue Filings', count: 2, icon: AlertTriangle, color: 'bg-red-500' }
            ].map((stat) => (
              <div key={stat.title} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regulatory Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Region</label>
                <select 
                  value={selectedRegion} 
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">All Regions</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Standard</label>
                <select 
                  value={selectedStandard} 
                  onChange={(e) => setSelectedStandard(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">All Standards</option>
                  <option value="IFRS">IFRS</option>
                  <option value="US GAAP">US GAAP</option>
                  <option value="UK GAAP">UK GAAP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search rules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button className="btn-secondary w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Rules List */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Regulatory Rules</h3>
            </div>
            
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {complianceRules.map((rule) => (
                <div key={rule.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white">{rule.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rule.status)}`}>
                          {rule.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(rule.impact)}`}>
                          {rule.impact} Impact
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mb-3">{rule.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-500">Region:</span>
                          <span className="ml-2 text-slate-700 dark:text-slate-300">{rule.region}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-500">Standard:</span>
                          <span className="ml-2 text-slate-700 dark:text-slate-300">{rule.standard}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-500">Category:</span>
                          <span className="ml-2 text-slate-700 dark:text-slate-300">{rule.category}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                        Last updated: {rule.lastUpdated} | Effective: {rule.effectiveDate}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-6">
                      <button className="btn-secondary">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </button>
                      <button className="btn-secondary">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                      <button className="btn-secondary">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filing Calendar Tab */}
      {activeTab === 'filing' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filing Calendar</h3>
                <div className="flex items-center space-x-3">
                  <button className="btn-secondary">
                    <Calendar className="h-4 w-4 mr-2" />
                    Export Calendar
                  </button>
                  <button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Filing
                  </button>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filingCalendar.map((filing) => (
                <div key={filing.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white">{filing.filingType}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(filing.status)}`}>
                          {filing.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(filing.priority)}`}>
                          {filing.priority} Priority
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-500">Entity:</span>
                          <span className="ml-2 text-slate-700 dark:text-slate-300">{filing.entity}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-500">Jurisdiction:</span>
                          <span className="ml-2 text-slate-700 dark:text-slate-300">{filing.jurisdiction}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-500">Due Date:</span>
                          <span className="ml-2 text-slate-700 dark:text-slate-300">{filing.dueDate}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-6">
                      <button className="btn-secondary">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </button>
                      <button className="btn-secondary">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Disclosure Checklist Tab */}
      {activeTab === 'disclosure' && (
        <div className="space-y-6">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Disclosure Checklist</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage and track disclosure requirements across compliance frameworks
              </p>
            </div>
            <button 
              onClick={handleAddDisclosure}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Disclosure
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { title: 'Total', count: disclosureStats.total, color: 'bg-blue-500' },
              { title: 'Completed', count: disclosureStats.completed, color: 'bg-green-500' },
              { title: 'In Progress', count: disclosureStats.inProgress, color: 'bg-yellow-500' },
              { title: 'Pending', count: disclosureStats.pending, color: 'bg-orange-500' },
              { title: 'Overdue', count: disclosureStats.overdue, color: 'bg-red-500' }
            ].map((stat) => (
              <div key={stat.title} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`} />
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                <select 
                  value={disclosureFilters.status} 
                  onChange={(e) => setDisclosureFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                <select 
                  value={disclosureFilters.category} 
                  onChange={(e) => setDisclosureFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  <option value="Financial Reporting">Financial Reporting</option>
                  <option value="Environmental">Environmental</option>
                  <option value="Privacy & Security">Privacy & Security</option>
                  <option value="Tax">Tax</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
                <select 
                  value={disclosureFilters.priority} 
                  onChange={(e) => setDisclosureFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={() => setDisclosureFilters({ status: 'all', category: 'all', priority: 'all' })}
                  className="btn-secondary w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Disclosure Checklists List */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            {disclosureLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading disclosure checklists...</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredDisclosureChecklists.map((checklist) => (
                  <div key={checklist.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-slate-900 dark:text-white">{checklist.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(checklist.status)}`}>
                            {checklist.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(checklist.priority)}`}>
                            {checklist.priority} Priority
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(checklist.risk_level)}`}>
                            {checklist.risk_level} Risk
                          </span>
                        </div>
                        
                        <p className="text-slate-600 dark:text-slate-400 mb-3">{checklist.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-slate-500 dark:text-slate-500">Category:</span>
                            <span className="ml-2 text-slate-700 dark:text-slate-300">{checklist.category}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-500">Assigned To:</span>
                            <span className="ml-2 text-slate-700 dark:text-slate-300">{checklist.assigned_to}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-500">Due Date:</span>
                            <span className="ml-2 text-slate-700 dark:text-slate-300">{checklist.due_date}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-500">Framework:</span>
                            <span className="ml-2 text-slate-700 dark:text-slate-300">{checklist.compliance_framework}</span>
                          </div>
                        </div>

                        {/* Checklist Items */}
                        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Checklist Items</h5>
                          <div className="space-y-2">
                            {checklist.checklist_items.map((item) => (
                              <div key={item.id} className="flex items-start space-x-3">
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={(e) => handleUpdateChecklistItem(checklist.id, item.id, e.target.checked, item.notes)}
                                  className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <p className={`text-sm ${item.completed ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {item.item_text}
                                  </p>
                                  {item.notes && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.notes}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Attachments */}
                        {checklist.attachments && checklist.attachments.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Attachments</h5>
                            <div className="flex flex-wrap gap-2">
                              {checklist.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-600 rounded-lg px-3 py-2">
                                  <FileText className="h-4 w-4 text-slate-500" />
                                  <span className="text-sm text-slate-700 dark:text-slate-300">{attachment.filename}</span>
                                  <span className="text-xs text-slate-500">({Math.round(attachment.file_size / 1024)}KB)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-6">
                        <button 
                          onClick={() => handleDisclosureClick(checklist)}
                          className="btn-secondary"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </button>
                        <button className="btn-secondary">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                        <button className="btn-secondary">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Score Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Compliance Score Trend</h3>
              <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                  <p>Compliance Score Chart</p>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Risk Assessment</h3>
              <div className="space-y-4">
                {[
                  { risk: 'High', count: 3, color: 'bg-red-500' },
                  { risk: 'Medium', count: 8, color: 'bg-yellow-500' },
                  { risk: 'Low', count: 15, color: 'bg-green-500' }
                ].map((item) => (
                  <div key={item.risk} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`} />
                      <span className="text-slate-700 dark:text-slate-300">{item.risk} Risk</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'IFRS Foundation', url: 'https://www.ifrs.org', description: 'Official IFRS standards and guidance' },
              { name: 'FASB', url: 'https://www.fasb.org', description: 'US GAAP standards and updates' },
              { name: 'SEC EDGAR', url: 'https://www.sec.gov/edgar', description: 'SEC filing database' },
              { name: 'EU Commission', url: 'https://ec.europa.eu', description: 'EU regulations and directives' },
              { name: 'UK FRC', url: 'https://www.frc.org.uk', description: 'UK accounting standards' },
              { name: 'Compliance Checklists', url: '#', description: 'Internal compliance checklists and templates' }
            ].map((resource) => (
              <div key={resource.name} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{resource.name}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{resource.description}</p>
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Resource
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobalCompliance
