import React, { useState, useEffect } from 'react'
import { 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  ChevronDown,
  BookOpen,
  Video,
  Download,
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  RefreshCw,
  Settings,
  User,
  Calendar,
  Tag,
  // Integration icons
  Building2,
  Shield,
  Users,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Globe,
  Layers,
  Network,
  Info
} from 'lucide-react'

const Support = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('tickets')
  const [tickets, setTickets] = useState([])
  const [knowledgeBase, setKnowledgeBase] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showNewTicket, setShowNewTicket] = useState(false)

  // Integration apps data
  const integrationApps = [
    {
      id: 'asset-management',
      name: 'Asset Management',
      description: 'Fixed asset lifecycle management and depreciation tracking',
      icon: Building2,
      category: 'Operations',
      status: 'Active',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      path: '/integrations/asset-management'
    },
    {
      id: 'compliance-management',
      name: 'Compliance Management',
      description: 'Regulatory compliance tracking and audit management',
      icon: Shield,
      category: 'Governance',
      status: 'Active',
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      path: '/integrations/compliance-management'
    },
    {
      id: 'crm',
      name: 'CRM',
      description: 'Customer relationship management and sales tracking',
      icon: Users,
      category: 'Sales',
      status: 'Active',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      path: '/integrations/crm'
    },
    {
      id: 'esg',
      name: 'ESG',
      description: 'Environmental, Social, and Governance reporting',
      icon: Globe,
      category: 'Sustainability',
      status: 'Active',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      path: '/integrations/esg'
    },
    {
      id: 'nfr',
      name: 'NFR',
      description: 'Non-Financial Risk management and reporting',
      icon: Shield,
      category: 'Risk',
      status: 'Active',
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      path: '/integrations/nfr'
    },
    {
      id: 'project-management',
      name: 'Project Management',
      description: 'Project planning, tracking, and resource management',
      icon: Layers,
      category: 'Operations',
      status: 'Active',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      path: '/integrations/project-management'
    },
    {
      id: 'purchase-order-management',
      name: 'Purchase Order Management',
      description: 'Procurement and purchase order processing',
      icon: FileSpreadsheet,
      category: 'Procurement',
      status: 'Active',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      path: '/integrations/purchase-order-management'
    },
    {
      id: 'revenue-analytics',
      name: 'Revenue Analytics',
      description: 'Revenue analysis and forecasting tools',
      icon: TrendingUp,
      category: 'Analytics',
      status: 'Active',
      badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
      path: '/integrations/revenue-analytics'
    },
    {
      id: 'stakeholder-management',
      name: 'Stakeholder Management',
      description: 'Stakeholder engagement and communication tracking',
      icon: Users,
      category: 'Relations',
      status: 'Active',
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
      path: '/integrations/stakeholder-management'
    }
  ]

  // Function to launch integration app
  const launchIntegration = async (app) => {
    try {
      // Map app IDs to their actual configurations
      const appConfigs = {
        'asset-management': { appName: 'Asset management', appPath: 'templates/integrations/Asset management', port: 3001 },
        'compliance-management': { appName: 'Complaince management', appPath: 'templates/integrations/Complaince management', port: 3002 },
        'crm': { appName: 'CRM', appPath: 'templates/integrations/CRM', port: 3003 },
        'esg': { appName: 'ESG', appPath: 'templates/integrations/ESG', port: 3004 },
        'nfr': { appName: 'NFR', appPath: 'templates/integrations/NFR', port: 3009 },
        'project-management': { appName: 'Project management', appPath: 'templates/integrations/Project management', port: 3005 },
        'purchase-order-management': { appName: 'Purchase order management', appPath: 'templates/integrations/Purchase order management', port: 3006 },
        'revenue-analytics': { appName: 'Revenue analytics', appPath: 'templates/integrations/Revenue analytics', port: 3007 },
        'stakeholder-management': { appName: 'Stakeholder management', appPath: 'templates/integrations/Stakeholder management', port: 3008 }
      }

      const config = appConfigs[app.id]
      if (!config) {
        alert('App configuration not found')
        return
      }

      // Call the backend API to start the React app
      const response = await fetch('/api/integrations/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Wait a moment for the server to fully start, then open the URL
        setTimeout(() => {
          window.open(data.url || `http://localhost:${config.port}`, '_blank')
        }, 3000)
        
        // Show success message
        alert(`${app.name} is starting... It will open in a new window shortly.`)
      } else {
        throw new Error('Failed to launch app')
      }
    } catch (error) {
      console.error('Error launching app:', error)
      alert(`Failed to launch ${app.name}. Please try again.`)
    }
  }

  useEffect(() => {
    loadSupportData()
  }, [])

  const loadSupportData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock tickets data
      const mockTickets = [
        {
          id: 1,
          title: 'Unable to export financial statements',
          description: 'Getting error when trying to export Q4 statements to PDF format',
          status: 'open',
          priority: 'high',
          category: 'Technical Issue',
          assignee: 'Support Team',
          createdAt: '2024-01-15T10:30:00',
          updatedAt: '2024-01-15T14:20:00',
          user: 'john.smith@company.com',
          tags: ['export', 'pdf', 'financial-statements']
        },
        {
          id: 2,
          title: 'Consolidation calculation discrepancy',
          description: 'There seems to be a mismatch in the consolidation calculations for subsidiary A',
          status: 'in-progress',
          priority: 'medium',
          category: 'Data Issue',
          assignee: 'Data Team',
          createdAt: '2024-01-14T15:45:00',
          updatedAt: '2024-01-15T09:15:00',
          user: 'sarah.johnson@company.com',
          tags: ['consolidation', 'calculation', 'subsidiary']
        },
        {
          id: 3,
          title: 'Login authentication problem',
          description: 'Users are experiencing intermittent login failures',
          status: 'resolved',
          priority: 'high',
          category: 'Authentication',
          assignee: 'IT Team',
          createdAt: '2024-01-13T08:20:00',
          updatedAt: '2024-01-14T16:30:00',
          user: 'mike.davis@company.com',
          tags: ['login', 'authentication', 'user-access']
        },
        {
          id: 4,
          title: 'Report generation slow performance',
          description: 'Monthly reports are taking longer than usual to generate',
          status: 'open',
          priority: 'low',
          category: 'Performance',
          assignee: 'Performance Team',
          createdAt: '2024-01-15T11:10:00',
          updatedAt: '2024-01-15T11:10:00',
          user: 'lisa.wilson@company.com',
          tags: ['performance', 'reports', 'monthly']
        }
      ]
      setTickets(mockTickets)

      // Mock knowledge base data
      const mockKnowledgeBase = [
        {
          id: 1,
          title: 'How to create a new consolidation',
          description: 'Step-by-step guide to creating a new consolidation entry',
          category: 'Consolidation',
          tags: ['consolidation', 'tutorial', 'new-entry'],
          views: 1250,
          helpful: 89,
          lastUpdated: '2024-01-10',
          content: 'Detailed step-by-step instructions...'
        },
        {
          id: 2,
          title: 'Troubleshooting export issues',
          description: 'Common solutions for PDF and Excel export problems',
          category: 'Technical',
          tags: ['export', 'troubleshooting', 'pdf', 'excel'],
          views: 890,
          helpful: 67,
          lastUpdated: '2024-01-08',
          content: 'Common export issues and solutions...'
        },
        {
          id: 3,
          title: 'User permission management',
          description: 'How to set up and manage user roles and permissions',
          category: 'Administration',
          tags: ['permissions', 'roles', 'user-management'],
          views: 567,
          helpful: 45,
          lastUpdated: '2024-01-05',
          content: 'User permission configuration guide...'
        },
        {
          id: 4,
          title: 'Data import best practices',
          description: 'Guidelines for importing data from external sources',
          category: 'Data Management',
          tags: ['import', 'data', 'best-practices'],
          views: 432,
          helpful: 38,
          lastUpdated: '2024-01-03',
          content: 'Data import guidelines and tips...'
        }
      ]
      setKnowledgeBase(mockKnowledgeBase)
    } catch (error) {
      console.error('Error loading support data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'in-progress': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'closed': return <XCircle className="h-4 w-4 text-gray-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredTickets = tickets.filter(ticket => 
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredKnowledgeBase = knowledgeBase.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading support center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Get help and manage support tickets</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewTicket(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </button>
          <button
            onClick={loadSupportData}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Support Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Live Chat</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Get instant help from our support team</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Start Chat
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Phone className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Phone Support</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Call us for urgent technical issues</p>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Call Now
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Mail className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Email Support</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Send us a detailed message</p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Send Email
          </button>
        </div>
      </div>

      {/* Integration Apps */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Integration Apps</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Connect with external systems and applications to enhance your workflow</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrationApps.map((app) => {
            const IconComponent = app.icon
            return (
              <div key={app.id} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${app.badgeColor}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-400">
                    {app.status}
                  </span>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{app.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{app.description}</p>
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300">
                    {app.category}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => launchIntegration(app)}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Launch App
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="App Info"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>



      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tickets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Support Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'knowledge'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Knowledge Base ({knowledgeBase.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'tickets' ? 'tickets' : 'knowledge base'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.title}</h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{ticket.status}</span>
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">{ticket.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.category}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Assignee</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.assignee}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Updated</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(ticket.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {ticket.tags.map((tag, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="View Details"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Knowledge Base Tab */}
          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              {filteredKnowledgeBase.map((article) => (
                <div key={article.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{article.title}</h3>
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30">
                          {article.category}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">{article.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{article.views}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Helpful</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{article.helpful}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{article.lastUpdated}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{article.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map((tag, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400" title="Helpful">
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title="Bookmark">
                        <Bookmark className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400" title="Share">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedTicket.title}</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Ticket Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                    <p className="text-gray-900 dark:text-white">{selectedTicket.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="text-gray-900 dark:text-white">{selectedTicket.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
                    <p className="text-gray-900 dark:text-white">{selectedTicket.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <p className="text-gray-900 dark:text-white">{selectedTicket.category}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Assignment & Timeline</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Assignee</p>
                    <p className="text-gray-900 dark:text-white">{selectedTicket.assignee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-gray-900 dark:text-white">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="text-gray-900 dark:text-white">{new Date(selectedTicket.updatedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">User</p>
                    <p className="text-gray-900 dark:text-white">{selectedTicket.user}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Reply
                </button>
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </button>
                <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                  <Settings className="h-4 w-4 mr-2" />
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Support

