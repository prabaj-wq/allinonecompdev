import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
  Activity,
  Shield,
  RefreshCw,
  Building
} from 'lucide-react'
import AuditService from '../services/auditService'
import AuditEngagementForm from '../components/audit/AuditEngagementForm'
import AuditWorkpaperForm from '../components/audit/AuditWorkpaperForm'
import AuditDashboard from '../components/audit/AuditDashboard'

const Audit = () => {
  const [selectedCompany, setSelectedCompany] = useState('Sample Corp Ltd')
  const [selectedPeriod, setSelectedPeriod] = useState('2025')
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  
  // New state for comprehensive audit functionality
  const [engagements, setEngagements] = useState([])
  const [workpapers, setWorkpapers] = useState([])
  const [findings, setFindings] = useState([])
  const [riskAssessments, setRiskAssessments] = useState([])
  const [schedules, setSchedules] = useState([])
  const [confirmations, setConfirmations] = useState([])
  const [sampling, setSampling] = useState([])
  const [timeTracking, setTimeTracking] = useState([])
  const [independence, setIndependence] = useState([])
  const [documents, setDocuments] = useState([])
  
  // Form states
  const [showEngagementForm, setShowEngagementForm] = useState(false)
  const [showWorkpaperForm, setShowWorkpaperForm] = useState(false)
  const [editingEngagement, setEditingEngagement] = useState(null)
  const [editingWorkpaper, setEditingWorkpaper] = useState(null)
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    engagements: { total: 0, active: 0, completed: 0 },
    workpapers: { total: 0, completed: 0, in_progress: 0 },
    findings: { total: 0, open: 0, resolved: 0 },
    risk_assessments: { high_risk: 0 }
  })



  const companies = [
    'Sample Corp Ltd', 'FinFusion360', 'Kayal', 'Backo', 'Tech Solutions Inc'
  ]

  const periods = ['2023', '2024', '2025', '2026']
  const statuses = ['all', 'completed', 'in_progress', 'not_started', 'review']
  const priorities = ['low', 'medium', 'high', 'critical']
  const severities = ['low', 'medium', 'high', 'critical']

  useEffect(() => {
    loadAuditData()
  }, [selectedCompany, selectedPeriod])

  const loadAuditData = async () => {
    try {
      setIsLoading(true)
      console.log(`Loading audit data for ${selectedCompany} - ${selectedPeriod}`)
      
      // Load sample data instead of API calls for now
      loadSampleData()
      
      console.log('Audit data loaded successfully')
    } catch (error) {
      console.error('Error loading audit data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSampleData = () => {
    // Sample engagements
    setEngagements([
      {
        id: 1,
        engagement_name: 'Annual Audit 2025',
        client_name: 'Sample Corp Ltd',
        engagement_type: 'External Audit',
        period_start: '2025-01-01',
        period_end: '2025-12-31',
        risk_level: 'medium',
        status: 'in_progress',
        progress_percentage: 65,
        engagement_partner: 'John Smith',
        engagement_manager: 'Sarah Johnson'
      },
      {
        id: 2,
        engagement_name: 'Q1 Review 2025',
        client_name: 'Sample Corp Ltd',
        engagement_type: 'Review',
        period_start: '2025-01-01',
        period_end: '2025-03-31',
        risk_level: 'low',
        status: 'completed',
        progress_percentage: 100,
        engagement_partner: 'Mike Wilson',
        engagement_manager: 'Lisa Brown'
      }
    ])

    // Sample workpapers
    setWorkpapers([
    {
      id: 1,
      title: 'Revenue Recognition Testing',
        workpaper_number: 'WP-001',
        account_name: 'Revenue',
        account_code: '5000',
        assertion: 'Existence',
      status: 'completed',
      priority: 'high',
        assigned_to: 'Sarah Johnson',
        reviewer: 'John Smith',
        due_date: '2025-02-15',
        started_date: '2025-01-15',
        completed_date: '2025-02-10',
        reviewed_date: '2025-02-12',
        risk_level: 'high',
      materiality: 1250000,
        sample_size: 50,
        work_performed: 'Substantive testing of revenue transactions including vouching, analytical procedures, and cutoff testing.',
        findings: 'No material misstatements identified. All tested transactions were properly recorded.',
        conclusions: 'Revenue recognition appears to be accurate and complete.',
        recommendations: 'Continue current controls and monitoring procedures.',
        lastUpdated: '2025-02-12T10:30:00Z'
    },
    {
      id: 2,
      title: 'Inventory Valuation',
        workpaper_number: 'WP-002',
        account_name: 'Inventory',
        account_code: '1200',
        assertion: 'Valuation',
      status: 'in_progress',
      priority: 'medium',
        assigned_to: 'John Smith',
        reviewer: 'Sarah Johnson',
        due_date: '2025-02-10',
        started_date: '2025-01-20',
        completed_date: null,
        reviewed_date: null,
        risk_level: 'medium',
      materiality: 750000,
        sample_size: 30,
        work_performed: 'Physical count observation and pricing tests in progress.',
        findings: 'Minor pricing differences noted in some inventory items.',
        conclusions: 'Inventory appears to be fairly valued with minor adjustments needed.',
        recommendations: 'Review pricing procedures and implement additional controls.',
        lastUpdated: '2025-01-25T14:45:00Z'
    },
    {
      id: 3,
      title: 'Fixed Assets Verification',
        workpaper_number: 'WP-003',
        account_name: 'Property, Plant & Equipment',
        account_code: '1500',
        assertion: 'Existence',
      status: 'not_started',
      priority: 'low',
        assigned_to: 'Mike Wilson',
        reviewer: 'John Smith',
        due_date: '2025-02-20',
        started_date: null,
        completed_date: null,
        reviewed_date: null,
        risk_level: 'low',
      materiality: 500000,
        sample_size: 20,
        work_performed: '',
      findings: '',
        conclusions: '',
      recommendations: '',
        lastUpdated: '2025-01-10T09:15:00Z'
    }
  ])

    // Sample findings
    setFindings([
    {
      id: 1,
      title: 'Revenue Recognition Timing',
      severity: 'medium',
      category: 'Revenue',
      description: 'Some revenue transactions recorded in incorrect period',
      impact: 'Potential misstatement of $150,000',
      recommendation: 'Implement period-end cutoff procedures',
      status: 'open',
        assigned_to: 'Management',
        due_date: '2025-03-15',
        lastUpdated: '2025-01-15T10:30:00Z'
    },
    {
      id: 2,
      title: 'Inventory Pricing',
      severity: 'low',
      category: 'Inventory',
      description: 'Minor pricing differences in inventory valuation',
      impact: 'Potential misstatement of $25,000',
      recommendation: 'Review pricing procedures',
      status: 'in_progress',
        assigned_to: 'Management',
        due_date: '2025-02-28',
        lastUpdated: '2025-01-14T15:20:00Z'
      },
      {
        id: 3,
        title: 'Internal Control Weakness',
        severity: 'high',
        category: 'Internal Controls',
        description: 'Segregation of duties not properly implemented in cash disbursements',
        impact: 'Risk of fraud and misappropriation of assets',
        recommendation: 'Implement proper segregation of duties and additional controls',
        status: 'open',
        assigned_to: 'Management',
        due_date: '2025-03-30',
        lastUpdated: '2025-01-20T16:45:00Z'
      }
    ])

    // Sample schedules
    setSchedules([
    {
      id: 1,
      task: 'Planning Phase',
      startDate: '2025-01-01',
      endDate: '2025-01-15',
      status: 'completed',
      progress: 100,
        assignedTo: 'Audit Team'
    },
    {
      id: 2,
      task: 'Fieldwork Phase',
      startDate: '2025-01-16',
      endDate: '2025-02-28',
      status: 'in_progress',
      progress: 65,
        assignedTo: 'Audit Team'
      }
    ])

    // Sample risk assessments
    setRiskAssessments([
      {
        id: 1,
        engagement_id: 1,
        company_id: 1,
        risk_area: 'Revenue Recognition',
        risk_level: 'high',
        risk_description: 'Complex revenue recognition policies with multiple performance obligations',
        control_effectiveness: 'moderate',
        residual_risk: 'high',
        mitigation_strategies: 'Enhanced testing procedures and analytical review'
      },
      {
        id: 2,
        engagement_id: 1,
        company_id: 1,
        risk_area: 'Inventory Valuation',
        risk_level: 'medium',
        risk_description: 'Significant inventory balances with complex valuation methods',
        control_effectiveness: 'good',
        residual_risk: 'medium',
        mitigation_strategies: 'Physical count observation and pricing tests'
      }
    ])

    // Sample confirmations
    setConfirmations([
      {
        id: 1,
        workpaper_id: 1,
        company_id: 1,
        confirmation_type: 'Accounts Receivable',
        recipient_name: 'ABC Company Ltd',
        recipient_address: '123 Business St, City, State 12345',
        confirmation_date: '2025-01-15',
        response_date: '2025-01-20',
        response_status: 'confirmed',
        amount_confirmed: 50000,
        exceptions: null
      },
      {
        id: 2,
        workpaper_id: 1,
        company_id: 1,
        confirmation_type: 'Accounts Payable',
        recipient_name: 'XYZ Suppliers Inc',
        recipient_address: '456 Vendor Ave, City, State 67890',
        confirmation_date: '2025-01-16',
        response_date: null,
        response_status: 'pending',
        amount_confirmed: null,
        exceptions: null
      }
    ])

    // Sample sampling
    setSampling([
      {
        id: 1,
        workpaper_id: 1,
        company_id: 1,
        sampling_method: 'Statistical',
        population_size: 1000,
        sample_size: 50,
        confidence_level: 95,
        tolerable_error_rate: 5,
        expected_error_rate: 2,
        sample_items: 'Random selection using systematic sampling',
        results: 'No errors found in sample'
      }
    ])

    // Sample time tracking
    setTimeTracking([
      {
        id: 1,
        engagement_id: 1,
        company_id: 1,
        staff_member: 'Sarah Johnson',
        date: '2025-01-15',
        hours_worked: 8,
        activity_description: 'Revenue testing and documentation',
        billable_hours: 8,
        hourly_rate: 150
      },
      {
        id: 2,
        engagement_id: 1,
        company_id: 1,
        staff_member: 'John Smith',
        date: '2025-01-15',
        hours_worked: 6,
        activity_description: 'Inventory count observation',
        billable_hours: 6,
        hourly_rate: 200
      }
    ])

    // Sample independence
    setIndependence([
      {
        id: 1,
        company_id: 1,
        staff_member: 'Sarah Johnson',
        relationship_type: 'None',
        independence_status: 'Independent',
        risk_level: 'low',
        disclosure_date: '2025-01-01',
        review_date: '2025-01-15'
      },
      {
        id: 2,
        company_id: 1,
        staff_member: 'John Smith',
        relationship_type: 'Former Employee',
        independence_status: 'Requires Review',
        risk_level: 'medium',
        disclosure_date: '2025-01-01',
        review_date: '2025-01-20'
      }
    ])

    // Sample documents
    setDocuments([
      {
        id: 1,
        workpaper_id: 1,
        company_id: 1,
        title: 'Revenue Testing Documentation',
        document_type: 'Workpaper',
        file_size: 2048576,
        file_path: '/documents/wp-001-revenue-testing.pdf',
        created_at: '2025-01-15T10:30:00Z',
        created_by: 'Sarah Johnson'
      },
      {
        id: 2,
        workpaper_id: 2,
        company_id: 1,
        title: 'Inventory Count Sheets',
        document_type: 'Evidence',
        file_size: 1048576,
        file_path: '/documents/wp-002-inventory-count.pdf',
        created_at: '2025-01-20T14:45:00Z',
        created_by: 'John Smith'
      }
    ])

    // Update dashboard data
    setDashboardData({
      engagements: { total: 2, active: 1, completed: 1 },
      workpapers: { total: 3, completed: 1, in_progress: 1 },
      findings: { total: 3, open: 2, resolved: 1 },
      risk_assessments: { high_risk: 1 }
    })
  }

  const loadEngagements = async () => {
    try {
      const data = await AuditService.getEngagements({ company_id: 1 })
      setEngagements(data)
    } catch (error) {
      console.error('Error loading engagements:', error)
    }
  }

  const loadWorkpapers = async () => {
    try {
      const data = await AuditService.getWorkpapers({ company_id: 1 })
      setWorkpapers(data)
    } catch (error) {
      console.error('Error loading workpapers:', error)
    }
  }

  const loadFindings = async () => {
    try {
      const data = await AuditService.getFindings({ company_id: 1 })
      setFindings(data)
    } catch (error) {
      console.error('Error loading findings:', error)
    }
  }

  const loadRiskAssessments = async () => {
    try {
      const data = await AuditService.getRiskAssessments({ company_id: 1 })
      setRiskAssessments(data)
    } catch (error) {
      console.error('Error loading risk assessments:', error)
    }
  }

  const loadSchedules = async () => {
    try {
      const data = await AuditService.getSchedules({ company_id: 1 })
      setSchedules(data)
    } catch (error) {
      console.error('Error loading schedules:', error)
    }
  }

  const loadConfirmations = async () => {
    try {
      const data = await AuditService.getConfirmations({ company_id: 1 })
      setConfirmations(data)
    } catch (error) {
      console.error('Error loading confirmations:', error)
    }
  }

  const loadSampling = async () => {
    try {
      const data = await AuditService.getSampling({ company_id: 1 })
      setSampling(data)
    } catch (error) {
      console.error('Error loading sampling:', error)
    }
  }

  const loadTimeTracking = async () => {
    try {
      const data = await AuditService.getTimeTracking({ company_id: 1 })
      setTimeTracking(data)
    } catch (error) {
      console.error('Error loading time tracking:', error)
    }
  }

  const loadIndependence = async () => {
    try {
      const data = await AuditService.getIndependence({ company_id: 1 })
      setIndependence(data)
    } catch (error) {
      console.error('Error loading independence records:', error)
    }
  }

  const loadDocuments = async () => {
    try {
      const data = await AuditService.getDocuments({ company_id: 1 })
      setDocuments(data)
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      const data = await AuditService.getDashboard(1)
      setDashboardData(data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  // Form handlers
  const handleEngagementSave = async (engagement) => {
    try {
      if (editingEngagement) {
        await AuditService.updateEngagement(editingEngagement.id, engagement)
        setEditingEngagement(null)
      } else {
        await AuditService.createEngagement(engagement)
      }
      await loadEngagements()
      setShowEngagementForm(false)
    } catch (error) {
      console.error('Error saving engagement:', error)
    }
  }

  const handleWorkpaperSave = async (workpaper) => {
    try {
      if (editingWorkpaper) {
        await AuditService.updateWorkpaper(editingWorkpaper.id, workpaper)
        setEditingWorkpaper(null)
      } else {
        await AuditService.createWorkpaper(workpaper)
      }
      await loadWorkpapers()
      setShowWorkpaperForm(false)
    } catch (error) {
      console.error('Error saving workpaper:', error)
    }
  }

  const handleEngagementEdit = (engagement) => {
    setEditingEngagement(engagement)
    setShowEngagementForm(true)
  }

  const handleWorkpaperEdit = (workpaper) => {
    setEditingWorkpaper(workpaper)
    setShowWorkpaperForm(true)
  }

  const handleEngagementDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this engagement?')) {
      try {
        await AuditService.deleteEngagement(id)
        await loadEngagements()
      } catch (error) {
        console.error('Error deleting engagement:', error)
      }
    }
  }

  const handleWorkpaperDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this workpaper?')) {
      try {
        await AuditService.deleteWorkpaper(id)
        await loadWorkpapers()
      } catch (error) {
        console.error('Error deleting workpaper:', error)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'not_started':
        return 'bg-gray-100 text-gray-800'
      case 'review':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      'completed': 'Completed',
      'in_progress': 'In Progress',
      'not_started': 'Not Started',
      'review': 'Under Review'
    }
    return labels[status] || status
  }

  const filteredWorkpapers = workpapers.filter(workpaper => {
    const matchesSearch = workpaper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workpaper.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workpaper.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || workpaper.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         finding.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || finding.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-3">Audit Management</h1>
            <p className="text-blue-100 text-xl max-w-2xl">
              Comprehensive audit workpaper management, findings tracking, and audit schedule coordination
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Company and Period Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {periods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end space-x-3">
            <button
              onClick={loadAuditData}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              New
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Engagements</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {dashboardData.engagements.total}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <Building className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Completed Workpapers</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {dashboardData.workpapers.completed}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">In Progress</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {dashboardData.workpapers.in_progress}
              </p>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Open Findings</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {dashboardData.findings.open}
              </p>
            </div>
            <div className="p-3 bg-red-500 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search workpapers, findings, or assignees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : getStatusLabel(status)}
                </option>
              ))}
            </select>
            <button className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'engagements', label: 'Engagements', icon: Building },
              { id: 'workpapers', label: 'Workpapers', icon: FileText },
              { id: 'findings', label: 'Findings', icon: AlertTriangle },
              { id: 'risk_assessments', label: 'Risk Assessment', icon: AlertTriangle },
              { id: 'schedule', label: 'Schedule', icon: Calendar },
              { id: 'confirmations', label: 'Confirmations', icon: FileText },
              { id: 'sampling', label: 'Sampling', icon: Activity },
              { id: 'time_tracking', label: 'Time Tracking', icon: Activity },
              { id: 'independence', label: 'Independence', icon: Shield },
              { id: 'documents', label: 'Documents', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 whitespace-nowrap ${
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <AuditDashboard 
              dashboardData={dashboardData}
              recentActivity={[
                {
                  description: 'New engagement created: Annual Audit 2025',
                  timestamp: new Date().toISOString(),
                  status: 'completed'
                },
                {
                  description: 'Workpaper WP-001 completed',
                  timestamp: new Date(Date.now() - 3600000).toISOString(),
                  status: 'completed'
                },
                {
                  description: 'Risk assessment updated for Revenue cycle',
                  timestamp: new Date(Date.now() - 7200000).toISOString(),
                  status: 'in_progress'
                }
              ]}
            />
          )}

          {/* Engagements Tab */}
          {activeTab === 'engagements' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Audit Engagements</h3>
                <button 
                  onClick={() => setShowEngagementForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Engagement
                </button>
              </div>

              <div className="space-y-4">
                {engagements.map((engagement) => (
                  <div key={engagement.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{engagement.engagement_name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {engagement.client_name} • {engagement.engagement_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(engagement.status)}`}>
                          {getStatusLabel(engagement.status)}
                          </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(engagement.risk_level)}`}>
                          {engagement.risk_level}
                        </span>
                            </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Period</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {AuditService.formatDate(engagement.period_start)} - {AuditService.formatDate(engagement.period_end)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Partner</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{engagement.engagement_partner || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Manager</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{engagement.engagement_manager || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Progress</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{engagement.progress_percentage || 0}%</p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleEngagementEdit(engagement)}
                        className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleEngagementDelete(engagement.id)}
                        className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Assessment Tab */}
          {activeTab === 'risk_assessments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Risk Assessments</h3>
                <button className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  New Risk Assessment
                </button>
              </div>

              <div className="space-y-4">
                {riskAssessments.map((risk) => (
                  <div key={risk.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{risk.risk_area}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Risk Assessment</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(risk.risk_level)}`}>
                          {risk.risk_level}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(risk.control_effectiveness)}`}>
                          {risk.control_effectiveness}
                            </span>
                          </div>
                        </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Risk Description</p>
                        <p className="text-sm text-gray-900 dark:text-white">{risk.risk_description}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Residual Risk</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{risk.residual_risk}</p>
                  </div>
                </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Mitigation Strategies</p>
                      <p className="text-sm text-gray-900 dark:text-white">{risk.mitigation_strategies}</p>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 px-3 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors duration-200">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmations Tab */}
          {activeTab === 'confirmations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirmations</h3>
                <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  New Confirmation
                </button>
              </div>

              <div className="space-y-4">
                {confirmations.map((confirmation) => (
                  <div key={confirmation.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{confirmation.confirmation_type}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{confirmation.recipient_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(confirmation.response_status)}`}>
                          {confirmation.response_status}
                          </span>
                        {confirmation.amount_confirmed && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            ${confirmation.amount_confirmed.toLocaleString()}
                          </span>
                        )}
                            </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Recipient Address</p>
                        <p className="text-sm text-gray-900 dark:text-white">{confirmation.recipient_address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Confirmation Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{confirmation.confirmation_date}</p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 px-3 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors duration-200">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sampling Tab */}
          {activeTab === 'sampling' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sampling</h3>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  New Sampling
                </button>
              </div>

              <div className="space-y-4">
                {sampling.map((sample) => (
                  <div key={sample.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                          <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{sample.sampling_method} Sampling</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Population: {sample.population_size} | Sample: {sample.sample_size}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {sample.confidence_level}% Confidence
                            </span>
                          </div>
                        </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tolerable Error Rate</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{sample.tolerable_error_rate}%</p>
                  </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expected Error Rate</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{sample.expected_error_rate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Sample Size</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{sample.sample_size}</p>
                </div>
              </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Results</p>
                      <p className="text-sm text-gray-900 dark:text-white">{sample.results}</p>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 px-3 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors duration-200">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Tracking Tab */}
          {activeTab === 'time_tracking' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Time Tracking</h3>
                <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  New Time Entry
                </button>
              </div>

              <div className="space-y-4">
                {timeTracking.map((time) => (
                  <div key={time.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center">
                          <Activity className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{time.staff_member}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{time.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {time.hours_worked} hours
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          ${time.hourly_rate}/hr
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Activity Description</p>
                        <p className="text-sm text-gray-900 dark:text-white">{time.activity_description}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Billable Amount</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          ${(time.billable_hours * time.hourly_rate).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 px-3 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors duration-200">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                      </div>
                    ))}
                </div>
            </div>
          )}

          {/* Independence Tab */}
          {activeTab === 'independence' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Independence</h3>
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  New Independence Declaration
                </button>
              </div>

              <div className="space-y-4">
                {independence.map((ind) => (
                  <div key={ind.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                          <Shield className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{ind.staff_member}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{ind.relationship_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(ind.independence_status)}`}>
                          {ind.independence_status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ind.risk_level)}`}>
                          {ind.risk_level}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Disclosure Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{ind.disclosure_date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Review Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{ind.review_date}</p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 px-3 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors duration-200">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Documents</h3>
                <button className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Document
                </button>
              </div>

              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{doc.document_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Created By</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.created_by}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Created Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 px-3 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors duration-200">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workpapers Tab */}
          {activeTab === 'workpapers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Audit Workpapers</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  New Workpaper
                </button>
              </div>

              <div className="space-y-4">
                {filteredWorkpapers.map((workpaper) => (
                  <div key={workpaper.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{workpaper.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {workpaper.account_name} • {workpaper.workpaper_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(workpaper.status)}`}>
                          {getStatusLabel(workpaper.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(workpaper.priority)}`}>
                          {workpaper.priority}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assigned To</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{workpaper.assigned_to}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{workpaper.due_date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Materiality</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          ${workpaper.materiality ? workpaper.materiality.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {workpaper.lastUpdated ? new Date(workpaper.lastUpdated).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {workpaper.work_performed && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Work Performed</p>
                        <p className="text-sm text-gray-900 dark:text-white">{workpaper.work_performed}</p>
                      </div>
                    )}

                    {workpaper.findings && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Findings</p>
                        <p className="text-sm text-gray-900 dark:text-white">{workpaper.findings}</p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 px-3 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors duration-200">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Findings Tab */}
          {activeTab === 'findings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Audit Findings</h3>
                <button className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  New Finding
                </button>
              </div>

              <div className="space-y-4">
                {filteredFindings.map((finding) => (
                  <div key={finding.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{finding.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{finding.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getSeverityColor(finding.severity)}`}>
                          {finding.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(finding.status)}`}>
                          {finding.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</p>
                        <p className="text-sm text-gray-900 dark:text-white">{finding.description}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Impact</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{finding.impact}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Recommendation</p>
                        <p className="text-sm text-gray-900 dark:text-white">{finding.recommendation}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assigned To</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{finding.assignedTo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{finding.dueDate}</p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 px-3 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors duration-200">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Audit Schedule</h3>
                <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </button>
              </div>

              <div className="space-y-4">
                {schedules.map((task) => (
                  <div key={task.id} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{task.task}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {task.startDate} - {task.endDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {task.progress}%
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in_progress' ? 'bg-blue-500' :
                            task.status === 'review' ? 'bg-purple-500' : 'bg-gray-500'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assigned To</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{task.assignedTo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Dependencies</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 px-3 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors duration-200">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Form Modal */}
      {showEngagementForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <AuditEngagementForm
              engagement={editingEngagement}
              onSave={handleEngagementSave}
              onCancel={() => {
                setShowEngagementForm(false)
                setEditingEngagement(null)
              }}
              companyId={1}
            />
          </div>
        </div>
      )}

      {/* Workpaper Form Modal */}
      {showWorkpaperForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <AuditWorkpaperForm
              workpaper={editingWorkpaper}
              onSave={handleWorkpaperSave}
              onCancel={() => {
                setShowWorkpaperForm(false)
                setEditingWorkpaper(null)
              }}
              engagementId={1}
              companyId={1}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Audit
