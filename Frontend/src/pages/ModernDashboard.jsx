import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'
import { useTheme } from '../contexts/ThemeContext'
import './ModernDashboard.css'
import { 
  Search,
  BarChart3, 
  Building2,
  BookOpen,
  Workflow,
  BarChart,
  ClipboardList,
  Layers,
  HardDrive,
  Receipt,
  Calculator,
  Target,
  FileSpreadsheet,
  TrendingUp,
  FileText,
  Sparkles,
  LinkIcon,
  Database,
  Calendar,
  ArrowUpDown,
  DollarSign,
  Percent,
  Compass,
  Zap,
  Shield,
  Globe,
  Activity,
  Eye,
  Settings,
  HelpCircle,
  Users,
  Lock,
  Monitor,
  Server,
  Download,
  Wifi,
  Lightbulb,
  User,
  Bell,
  Sun,
  Moon,
  LogOut,
  MessageCircle,
  X,
  Send,
  Plus,
  Minus,
  Grid,
  List,
  RefreshCw,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Maximize2,
  Filter,
  Star,
  ChevronRight,
  ChevronLeft,
  Menu
} from 'lucide-react'

const ModernDashboard = () => {
  console.log('🎨 ModernDashboard component loaded successfully!')
  
  const { user } = useAuth()
  const { selectedCompany } = useCompany()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  
  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [showDashboardSwitcher, setShowDashboardSwitcher] = useState(false)
  const [currentDashboard, setCurrentDashboard] = useState('modern')
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showAddTileModal, setShowAddTileModal] = useState(false)
  const [editingTile, setEditingTile] = useState(null)
  const [customTiles, setCustomTiles] = useState([])
  const [hiddenTiles, setHiddenTiles] = useState(new Set())
  const [newTile, setNewTile] = useState({
    name: '',
    href: '',
    description: '',
    category: 'core',
    icon: 'BarChart3',
    type: 'page', // 'page', 'embed', 'task'
    embedUrl: '',
    width: 1,
    height: 1
  })
  const [tileNotes, setTileNotes] = useState({})
  const [tileTodos, setTileTodos] = useState({})
  const [showTileDetails, setShowTileDetails] = useState(null)
  const [newNote, setNewNote] = useState('')
  const [newTodo, setNewTodo] = useState('')
  const [draggedItem, setDraggedItem] = useState(null)
  const [dropZone, setDropZone] = useState(null)
  const [tilePositions, setTilePositions] = useState({})
  const [tileSizes, setTileSizes] = useState({})
  const [isResizing, setIsResizing] = useState(null)
  const [showAddTileDropdown, setShowAddTileDropdown] = useState(false)
  const [tasks, setTasks] = useState([])
  const [newTaskText, setNewTaskText] = useState('')
  const [selectedPage, setSelectedPage] = useState(null)
  const [showDatabaseSwitcher, setShowDatabaseSwitcher] = useState(false)
  const [selectedDatabase, setSelectedDatabase] = useState('Production DB')
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [openApps, setOpenApps] = useState([])
  const [focusedApp, setFocusedApp] = useState(null)
  const [showSnapZones, setShowSnapZones] = useState(false)
  const [dragSnapZone, setDragSnapZone] = useState(null)
  const [hoveredTile, setHoveredTile] = useState(null)
  const [widgets, setWidgets] = useState([])

  // Complete navigation items from Layout.jsx
  const allPages = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, description: 'Financial overview and insights', category: 'core' },
    { name: 'Entity Management', href: '/entity', icon: Building2, description: 'Manage business entities and hierarchies', category: 'core' },
    { name: 'Account Management', href: '/accounts', icon: BookOpen, description: 'Chart of accounts and categorization', category: 'core' },
    { name: 'Process Module', href: '/process', icon: Workflow, description: 'Data processing & validation', category: 'core' },
    { name: 'Trial Balance', href: '/trial-balance', icon: BarChart, description: 'Trial balance reports', category: 'reporting' },
    { name: 'Journal Entries', href: '/journal-entries', icon: ClipboardList, description: 'Manual journal entries', category: 'core' },
    { name: 'FST Items', href: '/fst-items', icon: Layers, description: 'Financial Statement Templates', category: 'reporting' },
    { name: 'Asset Register', href: '/asset-register', icon: HardDrive, description: 'Fixed asset management', category: 'assets' },
    { name: 'Bills', href: '/bills', icon: Receipt, description: 'Bill management & tracking', category: 'core' },
    { name: 'Bank Reconciliation', href: '/bank-reconciliation', icon: Calculator, description: 'Bank statement reconciliation', category: 'reconciliation' },
    { name: 'Supplier Reconciliation', href: '/supplier-reconciliation', icon: Target, description: 'Supplier invoice and payment reconciliation', category: 'reconciliation' },
    { name: 'Purchase Orders', href: '/integrations/purchase-order-management', icon: FileSpreadsheet, description: 'Procurement & purchase orders', category: 'core' },
    { name: 'Financial Statements', href: '/financial-statements', icon: TrendingUp, description: 'P&L, Balance Sheet & Cash Flow', category: 'reporting' },
    { name: 'Custom Reports', href: '/reports', icon: FileText, description: 'Create and manage custom financial reports', category: 'reporting' },
    { name: 'Advanced Features', href: '/advanced-features', icon: Sparkles, description: 'Enterprise-grade features showcase', category: 'advanced' },
    { name: 'Consolidation', href: '/consolidation', icon: LinkIcon, description: 'Multi-entity consolidation', category: 'advanced' },
    { name: 'IFRS Templates', href: '/ifrs-templates', icon: FileText, description: 'IFRS standards library', category: 'compliance' },
    { name: 'ETL Pipeline', href: '/etl', icon: Database, description: 'Extract, Transform & Load data pipeline', category: 'system' },
    { name: 'Forecast & Budget', href: '/forecast-budget', icon: Calendar, description: 'Budgeting & forecasting', category: 'analytics' },
    { name: 'Variance Analysis', href: '/variance-analysis', icon: ArrowUpDown, description: 'Budget vs actual analysis', category: 'analytics' },
    { name: 'Cash Flow Analysis', href: '/cash-flow', icon: DollarSign, description: 'Cash flow statements', category: 'analytics' },
    { name: 'Financial Ratios', href: '/financial-ratios', icon: Percent, description: 'Financial ratio analysis', category: 'analytics' },
    { name: 'Narrative Reporting', href: '/narrative-reporting', icon: FileText, description: 'Rich text reporting and collaboration', category: 'reporting' },
    { name: 'What-If Analysis', href: '/what-if-analysis', icon: Compass, description: 'Scenario modeling and sensitivity analysis', category: 'analytics' },
    { name: 'Real-Time Analytics', href: '/real-time-analytics', icon: Zap, description: 'Unified analytics dashboard', category: 'analytics' },
    { name: 'Regulatory Reporting', href: '/regulatory-reporting', icon: FileText, description: 'Regulatory compliance', category: 'compliance' },
    { name: 'Global Compliance', href: '/global-compliance', icon: Shield, description: 'Multi-jurisdiction compliance management', category: 'compliance' },
    { name: 'ESG', href: '/integrations/esg', icon: Globe, description: 'Environmental, Social & Governance', category: 'compliance' },
    { name: 'Audit', href: '/audit', icon: FileSpreadsheet, description: 'Audit working papers', category: 'audit' },
    { name: 'Audit Trail', href: '/audit-trail', icon: Activity, description: 'Track all system changes', category: 'audit' },
    { name: 'Internal Controls', href: '/internal-controls', icon: Shield, description: 'Internal control framework', category: 'audit' },
    { name: 'Compliance Management', href: '/integrations/compliance-management', icon: CheckCircle, description: 'Regulatory compliance tracking', category: 'compliance' },
    { name: 'Forex Rate Management', href: '/forex-rates', icon: Globe, description: 'Exchange rate management', category: 'advanced' },
    { name: 'Axes', href: '/axes', icon: BarChart3, description: 'Universal dimensions template for entities, accounts, and more', category: 'advanced' },
    { name: 'Custom Axes', href: '/custom-axes', icon: BarChart3, description: 'Custom dimensions for reporting', category: 'advanced' },
    { name: 'Workflows', href: '/workflows', icon: Activity, description: 'Workflow automation and process management', category: 'system' },
    { name: 'Stakeholder Management', href: '/integrations/stakeholder-management', icon: Users, description: 'Stakeholder engagement', category: 'system' },
    { name: 'CRM', href: '/integrations/crm', icon: Users, description: 'Customer relationship management', category: 'system' },
    { name: 'Project Management', href: '/integrations/project-management', icon: Layers, description: 'Project planning & tracking', category: 'system' },
    { name: 'Revenue Analytics', href: '/integrations/revenue-analytics', icon: TrendingUp, description: 'Revenue analysis & forecasting', category: 'analytics' },
    { name: 'Role Management', href: '/integrations/role-management', icon: Lock, description: 'User roles, permissions, and access control management', category: 'system' },
    { name: 'System Monitoring', href: '/system-monitoring', icon: Monitor, description: 'System health & performance', category: 'system' },
    { name: 'System Management', href: '/system-management', icon: Settings, description: 'NPM dependencies & integration management', category: 'system' },
    { name: 'Database Management', href: '/database-management', icon: Database, description: 'Database administration', category: 'system' },
    { name: 'Backup & Restore', href: '/backup-restore', icon: HardDrive, description: 'Data backup & recovery', category: 'system' },
    { name: 'Data Import/Export', href: '/data-import-export', icon: Download, description: 'Data import & export tools', category: 'system' },
    { name: 'API Management', href: '/api-management', icon: Server, description: 'API endpoints & documentation', category: 'system' },
    { name: 'Third Party Integrations', href: '/third-party-integration', icon: Globe, description: 'External system integrations', category: 'system' },
    { name: 'Integration Summary', href: '/integration-summary', icon: BarChart3, description: 'Consolidated view of all integrations', category: 'system' },
    { name: 'Integration Hub', href: '/integration-hub', icon: LinkIcon, description: 'OS-like app launcher for all integrations', category: 'system' },
    { name: 'Documentation', href: '/documentation', icon: BookOpen, description: 'User guides & documentation', category: 'system' },
    { name: 'Training Materials', href: '/training', icon: FileText, description: 'Training videos & materials', category: 'system' },
    { name: 'Support Center', href: '/support', icon: HelpCircle, description: 'Technical support & help', category: 'system' },
    { name: 'System Settings', href: '/settings', icon: Settings, description: 'System configuration', category: 'system' },
    { name: 'Audit Materiality', href: '/audit-materiality', icon: Eye, description: 'Audit thresholds & materiality', category: 'audit' },
    { name: 'Tax Management', href: '/tax-management', icon: Calculator, description: 'Tax calculations & filing', category: 'compliance' },
    { name: 'Asset Management', href: '/integrations/asset-management', icon: Building2, description: 'Fixed asset lifecycle management', category: 'assets' },
    { name: 'Business Valuation & Impairment', href: '/business-valuation', icon: Calculator, description: 'Business valuation, DCF analysis & impairment testing', category: 'analytics' },
    { name: 'SQL Query Console', href: '/sql-query-console', icon: Database, description: 'Secure PostgreSQL query interface - SELECT only', category: 'system' },
    { name: 'Business Tools', href: '/business-tools', icon: Lightbulb, description: 'Advanced business analysis tools and frameworks', category: 'advanced' },
    { name: 'Quantum Finance', href: '/quantum-finance', icon: Zap, description: 'Advanced quantum finance features for portfolio optimization, risk modeling, forecasting, and analytics', category: 'advanced' }
  ]

  // Navigation items from Layout.jsx (core modules)
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: BarChart3,
      description: 'Financial overview and insights',
      category: 'core'
    },
    { 
      name: 'Entity Management', 
      href: '/entity', 
      icon: Building2,
      description: 'Manage business entities and hierarchies',
      category: 'core'
    },
    { 
      name: 'Account Management', 
      href: '/accounts', 
      icon: BookOpen,
      description: 'Chart of accounts and categorization',
      category: 'core'
    },
    { 
      name: 'Process Module', 
      href: '/process', 
      icon: Workflow,
      description: 'Data processing & validation',
      category: 'core'
    },
    { 
      name: 'Trial Balance', 
      href: '/trial-balance', 
      icon: BarChart,
      description: 'Trial balance reports',
      category: 'reporting'
    },
    { 
      name: 'Journal Entries', 
      href: '/journal-entries', 
      icon: ClipboardList,
      description: 'Manual journal entries',
      category: 'core'
    },
    { 
      name: 'Financial Statements', 
      href: '/financial-statements', 
      icon: TrendingUp,
      description: 'P&L, Balance Sheet & Cash Flow',
      category: 'reporting'
    },
    { 
      name: 'Consolidation', 
      href: '/consolidation', 
      icon: LinkIcon,
      description: 'Multi-entity consolidation',
      category: 'advanced'
    },
    { 
      name: 'Bank Reconciliation', 
      href: '/bank-reconciliation', 
      icon: Calculator,
      description: 'Bank statement reconciliation',
      category: 'reconciliation'
    },
    { 
      name: 'Asset Register', 
      href: '/asset-register', 
      icon: HardDrive,
      description: 'Fixed asset management',
      category: 'assets'
    },
    { 
      name: 'Financial Ratios', 
      href: '/financial-ratios', 
      icon: Percent,
      description: 'Financial ratio analysis',
      category: 'analytics'
    },
    { 
      name: 'Audit Trail', 
      href: '/audit-trail', 
      icon: Activity,
      description: 'Track all system changes',
      category: 'audit'
    },
    { 
      name: 'System Settings', 
      href: '/settings', 
      icon: Settings,
      description: 'System configuration',
      category: 'system'
    },
    { 
      name: 'Real-Time Analytics', 
      href: '/real-time-analytics', 
      icon: Zap,
      description: 'Unified analytics dashboard',
      category: 'analytics'
    },
    { 
      name: 'Global Compliance', 
      href: '/global-compliance', 
      icon: Shield,
      description: 'Multi-jurisdiction compliance management',
      category: 'compliance'
    },
    { 
      name: 'Business Tools', 
      href: '/business-tools',
      icon: Lightbulb,
      description: 'Advanced business analysis tools',
      category: 'advanced'
    }
  ]

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Modules', icon: Grid },
    { id: 'core', name: 'Core Functions', icon: BarChart3 },
    { id: 'reporting', name: 'Reporting', icon: FileText },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'compliance', name: 'Compliance', icon: Shield },
    { id: 'system', name: 'System', icon: Settings },
    { id: 'advanced', name: 'Advanced', icon: Sparkles }
  ]

  // Financial ratios for right sidebar
  const [financialRatios, setFinancialRatios] = useState([
    {
      name: 'Current Ratio',
      value: '2.45',
      change: '+0.2',
      trend: 'up',
      status: 'excellent',
      description: 'Liquidity measure'
    },
    {
      name: 'Debt-to-Equity',
      value: '0.42',
      change: '-0.05',
      trend: 'down',
      status: 'excellent',
      description: 'Financial leverage'
    },
    {
      name: 'ROE',
      value: '18.2%',
      change: '+2.1%',
      trend: 'up',
      status: 'excellent',
      description: 'Return on equity'
    },
    {
      name: 'Net Profit Margin',
      value: '12.5%',
      change: '+1.2%',
      trend: 'up',
      status: 'excellent',
      description: 'Profitability'
    },
    {
      name: 'Quick Ratio',
      value: '1.85',
      change: '0.0',
      trend: 'stable',
      status: 'excellent',
      description: 'Acid-test ratio'
    }
  ])
  const allTiles = [...navigation.filter(item => !hiddenTiles.has(item.name)), ...customTiles]
  const filteredNavigation = allTiles.filter(item => {
    const matchesSearch = searchQuery === '' || 
                         item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.href && item.href.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Enhanced search that includes all pages when searching
  const searchResults = searchQuery ? allPages.filter(page => 
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.href.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10) : [] // Limit to 10 results

  // Dashboard options
  const dashboardOptions = [
    { id: 'modern', name: 'Modern Dashboard', description: 'Clean, tile-based interface' },
    { id: 'enhanced', name: 'Enhanced Dashboard', description: 'Advanced analytics view' }
  ]

  const handleDashboardSwitch = (dashboardId) => {
    setCurrentDashboard(dashboardId)
    setShowDashboardSwitcher(false)
    
    if (dashboardId === 'enhanced') {
      navigate('/dashboard-enhanced')
    } else if (dashboardId === 'modern') {
      navigate('/dashboard-modern')
    }
  }

  const handleNavigationClick = (item) => {
    // Open apps in Windows-style interface instead of navigating
    openApp(item)
  }

  const getCategoryColor = (category) => {
    const colors = {
      core: 'from-emerald-600 to-teal-700',        // Sea green
      reporting: 'from-blue-800 to-blue-900',      // Deep blue
      analytics: 'from-yellow-500 to-amber-600',   // Yellow
      compliance: 'from-slate-600 to-slate-700',   // Silver/gray
      system: 'from-slate-800 to-black',           // Black/dark gray
      advanced: 'from-emerald-500 to-teal-600',    // Sea green variant
      audit: 'from-blue-700 to-indigo-800',        // Deep blue variant
      reconciliation: 'from-yellow-400 to-yellow-600', // Yellow variant
      assets: 'from-slate-500 to-slate-600'        // Silver
    }
    return colors[category] || 'from-slate-600 to-slate-700'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'text-emerald-600 bg-emerald-50'
      case 'good':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-emerald-600" />
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4" />
    }
  }

  // Icon mapping for custom tiles
  const iconMap = {
    BarChart3, Building2, BookOpen, Workflow, BarChart, ClipboardList, Layers,
    HardDrive, Receipt, Calculator, Target, FileSpreadsheet, TrendingUp, FileText,
    Sparkles, LinkIcon, Database, Calendar, ArrowUpDown, DollarSign, Percent,
    Compass, Zap, Shield, Globe, Activity, Eye, Settings, HelpCircle, Users,
    Lock, Monitor, Server, Download, Wifi, Lightbulb
  }

  const getIconComponent = (iconName) => {
    return iconMap[iconName] || BarChart3
  }

  // Widget Components (empty for now - can add custom widgets later)

  const renderWidget = (widget) => {
    // Widget rendering function - currently no widgets active
    return <div className="h-full bg-gray-200 rounded-xl" />
  }

  // Hover Card Component with Smart Positioning
  const HoverCard = ({ item, tileId }) => {
    if (hoveredTile !== tileId) return null
    
    // Calculate available space for smart positioning
    const leftSidebarWidth = leftSidebarCollapsed ? 0 : 320
    const rightSidebarWidth = rightSidebarCollapsed ? 0 : 320
    const availableWidth = window.innerWidth - leftSidebarWidth - rightSidebarWidth
    
    // Determine card position based on available space
    const cardWidth = 320 // Increased from 280 for better readability
    const shouldPositionRight = availableWidth < 600 // If cramped, position differently
    
    return (
      <div 
        className={`fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 p-4 z-[100] animate-in slide-in-from-top-2 duration-200 ${
          shouldPositionRight ? 'right-4 top-20' : 'absolute top-full left-0 mt-2'
        }`}
        style={{
          width: `${cardWidth}px`,
          maxWidth: shouldPositionRight ? '90vw' : `${availableWidth - 40}px`
        }}
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${getCategoryColor(item.category)} shadow-lg`}>
            <item.icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{item.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{item.category}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{item.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">Click to open in optimized window</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Ready</span>
          </div>
        </div>
      </div>
    )
  }

  // Load saved configuration from localStorage
  useEffect(() => {
    const loadConfiguration = () => {
      try {
        const savedCustomTiles = localStorage.getItem('modernDashboard_customTiles')
        const savedHiddenTiles = localStorage.getItem('modernDashboard_hiddenTiles')
        const savedTileNotes = localStorage.getItem('modernDashboard_tileNotes')
        const savedTileTodos = localStorage.getItem('modernDashboard_tileTodos')
        const savedTilePositions = localStorage.getItem('modernDashboard_tilePositions')
        const savedTileSizes = localStorage.getItem('modernDashboard_tileSizes')
        const savedTasks = localStorage.getItem('modernDashboard_tasks')

        if (savedCustomTiles) setCustomTiles(JSON.parse(savedCustomTiles))
        if (savedHiddenTiles) setHiddenTiles(new Set(JSON.parse(savedHiddenTiles)))
        if (savedTileNotes) setTileNotes(JSON.parse(savedTileNotes))
        if (savedTileTodos) setTileTodos(JSON.parse(savedTileTodos))
        if (savedTilePositions) setTilePositions(JSON.parse(savedTilePositions))
        if (savedTileSizes) setTileSizes(JSON.parse(savedTileSizes))
        if (savedTasks) setTasks(JSON.parse(savedTasks))
      } catch (error) {
        console.error('Error loading configuration:', error)
      }
    }
    
    loadConfiguration()
  }, [])

  // Save configuration to localStorage
  const saveConfiguration = () => {
    localStorage.setItem('modernDashboard_customTiles', JSON.stringify(customTiles))
    localStorage.setItem('modernDashboard_hiddenTiles', JSON.stringify([...hiddenTiles]))
    localStorage.setItem('modernDashboard_tileNotes', JSON.stringify(tileNotes))
    localStorage.setItem('modernDashboard_tileTodos', JSON.stringify(tileTodos))
    localStorage.setItem('modernDashboard_tilePositions', JSON.stringify(tilePositions))
    localStorage.setItem('modernDashboard_tileSizes', JSON.stringify(tileSizes))
    localStorage.setItem('modernDashboard_tasks', JSON.stringify(tasks))
  }

  // Tile management functions
  const addCustomTile = () => {
    const isValid = newTile.name && (
      (newTile.type === 'page' && newTile.href) ||
      (newTile.type === 'embed' && newTile.embedUrl) ||
      (newTile.type === 'task')
    )
    
    if (isValid) {
      const tile = {
        ...newTile,
        id: Date.now(),
        icon: getIconComponent(newTile.icon),
        isCustom: true
      }
      setCustomTiles([...customTiles, tile])
      setTileSizes({
        ...tileSizes,
        [tile.id]: { width: newTile.width, height: newTile.height }
      })
      setNewTile({ name: '', href: '', description: '', category: 'core', icon: 'BarChart3', type: 'page', embedUrl: '', width: 1, height: 1 })
      setShowAddTileModal(false)
      saveConfiguration()
    }
  }

  const removeTile = (tileId, isCustom = false) => {
    if (isCustom) {
      setCustomTiles(customTiles.filter(tile => tile.id !== tileId))
    } else {
      setHiddenTiles(new Set([...hiddenTiles, tileId]))
    }
    saveConfiguration()
  }

  const editTile = (tile) => {
    setEditingTile(tile)
    setNewTile({
      name: tile.name,
      href: tile.href,
      description: tile.description,
      category: tile.category,
      icon: tile.icon.name || 'BarChart3'
    })
    setShowAddTileModal(true)
  }

  const updateTile = () => {
    if (editingTile && newTile.name && newTile.href) {
      if (editingTile.isCustom) {
        setCustomTiles(customTiles.map(tile => 
          tile.id === editingTile.id 
            ? { ...tile, ...newTile, icon: getIconComponent(newTile.icon) }
            : tile
        ))
      }
      setEditingTile(null)
      setNewTile({ name: '', href: '', description: '', category: 'core', icon: 'BarChart3' })
      setShowAddTileModal(false)
      saveConfiguration()
    }
  }

  const restoreTile = (tileName) => {
    const newHiddenTiles = new Set(hiddenTiles)
    newHiddenTiles.delete(tileName)
    setHiddenTiles(newHiddenTiles)
    saveConfiguration()
  }

  // Notes and Todos management
  const addNote = (tileId) => {
    if (newNote.trim()) {
      const notes = tileNotes[tileId] || []
      setTileNotes({
        ...tileNotes,
        [tileId]: [...notes, { id: Date.now(), text: newNote.trim(), timestamp: new Date().toISOString() }]
      })
      setNewNote('')
      saveConfiguration()
    }
  }

  const removeNote = (tileId, noteId) => {
    const notes = tileNotes[tileId] || []
    setTileNotes({
      ...tileNotes,
      [tileId]: notes.filter(note => note.id !== noteId)
    })
    saveConfiguration()
  }

  const addTodo = (tileId) => {
    if (newTodo.trim()) {
      const todos = tileTodos[tileId] || []
      setTileTodos({
        ...tileTodos,
        [tileId]: [...todos, { id: Date.now(), text: newTodo.trim(), completed: false, timestamp: new Date().toISOString() }]
      })
      setNewTodo('')
      saveConfiguration()
    }
  }

  const toggleTodo = (tileId, todoId) => {
    const todos = tileTodos[tileId] || []
    setTileTodos({
      ...tileTodos,
      [tileId]: todos.map(todo => 
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    })
    saveConfiguration()
  }

  const removeTodo = (tileId, todoId) => {
    const todos = tileTodos[tileId] || []
    setTileTodos({
      ...tileTodos,
      [tileId]: todos.filter(todo => todo.id !== todoId)
    })
    saveConfiguration()
  }

  const getTileId = (item) => item.id || item.name

  // Handle page selection and auto-fill
  const handlePageSelect = (page) => {
    setSelectedPage(page)
    setNewTile({
      ...newTile,
      name: page.name,
      href: page.href,
      description: page.description,
      category: page.category,
      icon: page.icon.name || 'BarChart3'
    })
  }

  // Windows-style app management
  const openApp = (page, optimized = false) => {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    let size = { width: 800, height: 600 }
    let position = { x: 100 + openApps.length * 30, y: 100 + openApps.length * 30 }
    
    if (optimized) {
      // Optimized size based on screen and content
      size = {
        width: Math.min(1200, screenWidth * 0.7),
        height: Math.min(800, screenHeight * 0.7)
      }
      position = {
        x: (screenWidth - size.width) / 2,
        y: (screenHeight - size.height) / 2
      }
    }
    
    const newApp = {
      id: `${page.name}-${Date.now()}`,
      title: page.name,
      icon: page.icon,
      url: page.href,
      position,
      size,
      isMinimized: false,
      isMaximized: false
    }
    setOpenApps([...openApps, newApp])
    setFocusedApp(newApp.id)
  }

  const closeApp = (appId) => {
    setOpenApps(openApps.filter(app => app.id !== appId))
    if (focusedApp === appId) {
      setFocusedApp(openApps.length > 1 ? openApps[0].id : null)
    }
  }

  const minimizeApp = (appId) => {
    setOpenApps(openApps.map(app => 
      app.id === appId ? { ...app, isMinimized: true } : app
    ))
  }

  const maximizeApp = (appId) => {
    setOpenApps(openApps.map(app => 
      app.id === appId ? { 
        ...app, 
        isMinimized: false,
        isMaximized: true,
        position: { x: 0, y: 0 },
        size: { width: window.innerWidth, height: window.innerHeight }
      } : app
    ))
  }

  const snapApp = (appId, snapType) => {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    let newPosition = { x: 0, y: 0 }
    let newSize = { width: screenWidth, height: screenHeight }
    
    switch (snapType) {
      case 'left':
        newSize = { width: screenWidth / 2, height: screenHeight }
        newPosition = { x: 0, y: 0 }
        break
      case 'right':
        newSize = { width: screenWidth / 2, height: screenHeight }
        newPosition = { x: screenWidth / 2, y: 0 }
        break
      case 'top':
        newSize = { width: screenWidth, height: screenHeight / 2 }
        newPosition = { x: 0, y: 0 }
        break
      case 'bottom':
        newSize = { width: screenWidth, height: screenHeight / 2 }
        newPosition = { x: 0, y: screenHeight / 2 }
        break
      case 'top-left':
        newSize = { width: screenWidth / 2, height: screenHeight / 2 }
        newPosition = { x: 0, y: 0 }
        break
      case 'top-right':
        newSize = { width: screenWidth / 2, height: screenHeight / 2 }
        newPosition = { x: screenWidth / 2, y: 0 }
        break
      case 'bottom-left':
        newSize = { width: screenWidth / 2, height: screenHeight / 2 }
        newPosition = { x: 0, y: screenHeight / 2 }
        break
      case 'bottom-right':
        newSize = { width: screenWidth / 2, height: screenHeight / 2 }
        newPosition = { x: screenWidth / 2, y: screenHeight / 2 }
        break
      default:
        // Full screen
        break
    }
    
    setOpenApps(openApps.map(app => 
      app.id === appId ? { 
        ...app, 
        isMinimized: false,
        isMaximized: snapType === 'maximize',
        position: newPosition,
        size: newSize
      } : app
    ))
    setShowSnapZones(false)
  }

  const focusApp = (appId) => {
    setFocusedApp(appId)
    setOpenApps(openApps.map(app => 
      app.id === appId ? { ...app, isMinimized: false } : app
    ))
  }

  // Window dragging functionality
  const [draggingApp, setDraggingApp] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Window resizing functionality
  const [resizingApp, setResizingApp] = useState(null)
  const [resizeDirection, setResizeDirection] = useState(null)
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 })

  const handleWindowMouseDown = (e, appId) => {
    if (e.target.closest('.window-controls')) return // Don't drag when clicking controls
    
    const app = openApps.find(a => a.id === appId)
    if (!app || app.isMaximized) return // Don't drag maximized windows
    
    e.preventDefault() // Prevent text selection
    document.body.style.userSelect = 'none' // Disable text selection globally
    document.body.style.webkitUserSelect = 'none'
    
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setDraggingApp(appId)
    focusApp(appId)
  }

  const handleWindowMouseMove = useCallback((e) => {
    if (!draggingApp) return
    
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y
    
    // Detect snap zones while dragging
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const snapThreshold = 50
    
    let snapZone = null
    
    if (e.clientX < snapThreshold) {
      if (e.clientY < snapThreshold) {
        snapZone = 'top-left'
      } else if (e.clientY > screenHeight - snapThreshold) {
        snapZone = 'bottom-left'
      } else {
        snapZone = 'left'
      }
    } else if (e.clientX > screenWidth - snapThreshold) {
      if (e.clientY < snapThreshold) {
        snapZone = 'top-right'
      } else if (e.clientY > screenHeight - snapThreshold) {
        snapZone = 'bottom-right'
      } else {
        snapZone = 'right'
      }
    } else if (e.clientY < snapThreshold) {
      snapZone = 'top'
    }
    
    setDragSnapZone(snapZone)
    
    setOpenApps(prev => prev.map(app => 
      app.id === draggingApp 
        ? { ...app, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
        : app
    ))
  }, [draggingApp, dragOffset])

  const handleWindowMouseUp = useCallback(() => {
    // Snap if in a snap zone
    if (dragSnapZone && draggingApp) {
      snapApp(draggingApp, dragSnapZone)
    }
    
    setDraggingApp(null)
    setDragOffset({ x: 0, y: 0 })
    setDragSnapZone(null)
    
    // Restore text selection
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
  }, [dragSnapZone, draggingApp, snapApp])

  useEffect(() => {
    if (draggingApp) {
      document.addEventListener('mousemove', handleWindowMouseMove)
      document.addEventListener('mouseup', handleWindowMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleWindowMouseMove)
        document.removeEventListener('mouseup', handleWindowMouseUp)
      }
    }
  }, [draggingApp, handleWindowMouseMove, handleWindowMouseUp])

  // Window resizing handlers
  const handleResizeMouseDown = (e, appId, direction) => {
    e.stopPropagation()
    e.preventDefault() // Prevent text selection
    
    const app = openApps.find(a => a.id === appId)
    if (!app || app.isMaximized) return

    document.body.style.userSelect = 'none' // Disable text selection globally
    document.body.style.webkitUserSelect = 'none'

    setResizingApp(appId)
    setResizeDirection(direction)
    setResizeStartSize({ width: app.size.width, height: app.size.height })
    
    // Store the initial position for proper calculation
    setResizeStartPos({ 
      x: e.clientX, 
      y: e.clientY,
      windowX: app.position.x,
      windowY: app.position.y
    })
    
    focusApp(appId)
  }

  const handleResizeMouseMove = useCallback((e) => {
    if (!resizingApp || !resizeDirection) return

    const deltaX = e.clientX - resizeStartPos.x
    const deltaY = e.clientY - resizeStartPos.y

    let newSize = { ...resizeStartSize }
    let newPosition = { x: resizeStartPos.windowX, y: resizeStartPos.windowY }

    // Calculate new dimensions based on resize direction
    if (resizeDirection.includes('right')) {
      newSize.width = Math.max(50, resizeStartSize.width + deltaX)
    }
    if (resizeDirection.includes('left')) {
      const proposedWidth = resizeStartSize.width - deltaX
      newSize.width = Math.max(50, proposedWidth)
      // Adjust position when resizing from left
      newPosition.x = resizeStartPos.windowX + (resizeStartSize.width - newSize.width)
    }
    if (resizeDirection.includes('bottom')) {
      newSize.height = Math.max(50, resizeStartSize.height + deltaY)
    }
    if (resizeDirection.includes('top')) {
      const proposedHeight = resizeStartSize.height - deltaY
      newSize.height = Math.max(50, proposedHeight)
      // Adjust position when resizing from top
      newPosition.y = resizeStartPos.windowY + (resizeStartSize.height - newSize.height)
    }

    setOpenApps(prev => prev.map(a => 
      a.id === resizingApp 
        ? { ...a, size: newSize, position: newPosition }
        : a
    ))
  }, [resizingApp, resizeDirection, resizeStartPos, resizeStartSize])

  const handleResizeMouseUp = useCallback(() => {
    setResizingApp(null)
    setResizeDirection(null)
    setResizeStartPos({ x: 0, y: 0 })
    setResizeStartSize({ width: 0, height: 0 })
    
    // Restore text selection
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
  }, [])

  useEffect(() => {
    if (resizingApp) {
      document.addEventListener('mousemove', handleResizeMouseMove)
      document.addEventListener('mouseup', handleResizeMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleResizeMouseMove)
        document.removeEventListener('mouseup', handleResizeMouseUp)
      }
    }
  }, [resizingApp, handleResizeMouseMove, handleResizeMouseUp])

  // Drag and Drop Functions
  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    if (!draggedItem) return

    const draggedIndex = filteredNavigation.findIndex(item => getTileId(item) === getTileId(draggedItem))
    if (draggedIndex === targetIndex) return

    // Reorder tiles
    const newNavigation = [...filteredNavigation]
    const [removed] = newNavigation.splice(draggedIndex, 1)
    newNavigation.splice(targetIndex, 0, removed)

    // Update positions
    const newPositions = {}
    newNavigation.forEach((item, index) => {
      newPositions[getTileId(item)] = index
    })
    setTilePositions(newPositions)
    setDraggedItem(null)
    saveConfiguration()
  }

  // Task Management Functions
  const addTask = () => {
    if (newTaskText.trim()) {
      const task = {
        id: Date.now(),
        text: newTaskText.trim(),
        completed: false,
        timestamp: new Date().toISOString()
      }
      setTasks([...tasks, task])
      setNewTaskText('')
      saveConfiguration()
    }
  }

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
    saveConfiguration()
  }

  const removeTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId))
    saveConfiguration()
  }

  // Tile Resizing Functions
  const handleResizeStart = (e, tileId) => {
    e.stopPropagation()
    setIsResizing(tileId)
  }

  const handleResize = (tileId, width, height) => {
    setTileSizes({
      ...tileSizes,
      [tileId]: { width, height }
    })
    saveConfiguration()
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' 
        : 'bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50'
    }`}>
      {/* Top Navigation Bar with Theme Support */}
      <div className={`sticky top-0 z-50 shadow-lg transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-gray-800 via-slate-700 to-gray-800 border-b border-gray-600'
          : 'bg-gradient-to-r from-yellow-200 via-yellow-100 to-amber-100 border-b border-yellow-300'
      }`}>
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              className="p-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors"
            >
              {leftSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Launch Modules</h1>
          </div>

          {/* Center section - Title */}
          <div className="flex-1 text-center">
            <h2 className={`text-xl font-semibold transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-100' : 'text-slate-700'
            }`}>
              IFRS Consolidation Tool
            </h2>
            <div className={`flex items-center justify-center space-x-4 text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
            }`}>
              <span>{selectedCompany?.name || 'No company selected'}</span>
              <span>•</span>
              <div className="relative">
                <button
                  onClick={() => setShowDatabaseSwitcher(!showDatabaseSwitcher)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1 ${
                    theme === 'dark' 
                      ? 'bg-gray-700/70 hover:bg-gray-600/90 text-gray-200' 
                      : 'bg-white/70 hover:bg-white/90 text-gray-700'
                  }`}
                >
                  <Database className="h-4 w-4" />
                  <span>{selectedDatabase}</span>
                  <ChevronRight className={`h-3 w-3 transition-transform ${showDatabaseSwitcher ? 'rotate-90' : ''}`} />
                </button>
                
                {showDatabaseSwitcher && (
                  <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 rounded-lg shadow-xl border z-50 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-600' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="p-2">
                      <div className="mb-2">
                        <button
                          onClick={() => {
                            // Add new database functionality
                            setShowDatabaseSwitcher(false)
                            // You can add modal for new database here
                          }}
                          className={`w-full text-left p-2 rounded transition-colors text-sm font-medium ${
                            theme === 'dark' 
                              ? 'text-blue-400 hover:bg-gray-700' 
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Plus className="h-4 w-4" />
                            <span>Add New Database</span>
                          </div>
                        </button>
                      </div>
                      <div className={`border-t pt-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                        {['Production DB', 'Staging DB', 'Development DB', 'Test DB'].map((db) => (
                          <button
                            key={db}
                            onClick={() => {
                              setSelectedDatabase(db)
                              setShowDatabaseSwitcher(false)
                            }}
                            className={`w-full text-left p-2 rounded transition-colors text-sm ${
                              selectedDatabase === db 
                                ? theme === 'dark' 
                                  ? 'bg-blue-900/50 text-blue-300 font-medium' 
                                  : 'bg-blue-50 text-blue-700 font-medium'
                                : theme === 'dark'
                                  ? 'text-gray-300 hover:bg-gray-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Database className="h-4 w-4" />
                              <span>{db}</span>
                              {selectedDatabase === db && <CheckCircle className="h-4 w-4 ml-auto" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <span>•</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Dashboard Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowDashboardSwitcher(!showDashboardSwitcher)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/50 hover:bg-white/70 rounded-lg transition-colors"
              >
                <Grid className="h-5 w-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              
              {showDashboardSwitcher && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Switch Dashboard</h3>
                    {dashboardOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleDashboardSwitch(option.id)}
                        className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                          currentDashboard === option.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-gray-800">{option.name}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications */}
            <button className="p-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="text-right">
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-100' : 'text-slate-800'
                  }`}>
                    {user?.name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className={`text-xs transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                  }`}>
                    {user?.role || 'User'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              </button>

              {showUserProfile && (
                <div className={`absolute top-full right-0 mt-2 w-56 rounded-lg shadow-xl border z-50 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="p-2">
                    <div className={`px-3 py-2 border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                      <p className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                        {user?.name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserProfile(false)
                          // Navigate to profile
                        }}
                        className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                          theme === 'dark' 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Profile Settings</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowUserProfile(false)
                          // Navigate to preferences
                        }}
                        className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                          theme === 'dark' 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Settings className="h-4 w-4" />
                          <span>Preferences</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowUserProfile(false)
                          // Handle logout
                          logout()
                        }}
                        className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                          theme === 'dark' 
                            ? 'text-red-400 hover:bg-gray-700' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
              className="p-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors"
            >
              {rightSidebarCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Search & Filters */}
        <div className={`modern-dashboard-sidebar-left shadow-lg transition-all duration-300 ${
          leftSidebarCollapsed ? 'w-0' : 'w-80'
        } ${
          theme === 'dark' ? 'bg-gray-800 border-r border-gray-600' : 'bg-white border-r border-gray-200'
        }`}>
          <div className="p-6 h-full overflow-y-auto">
            {!leftSidebarCollapsed && (
              <>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Search & Filter</h3>
                
                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category Filters */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <category.icon className="h-5 w-5" />
                      <span className="text-sm">{category.name}</span>
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">View Mode</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className={`transition-all duration-300 ${
            leftSidebarCollapsed && rightSidebarCollapsed 
              ? 'p-6' // Full padding when both sidebars closed
              : (!leftSidebarCollapsed && !rightSidebarCollapsed)
              ? 'p-3' // Reduced padding when both sidebars open for more space
              : 'p-4' // Medium padding when one sidebar open
          }`}>
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}>Launch Modules</h2>
                  <p className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Access all your financial modules and tools from this centralized hub
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      editMode 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {editMode ? 'Exit Edit Mode' : 'Customize Tiles'}
                  </button>
                  {editMode && (
                    <div className="relative">
                      <button
                        onClick={() => setShowAddTileDropdown(!showAddTileDropdown)}
                        className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <span>Add Widget</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${showAddTileDropdown ? 'rotate-90' : ''}`} />
                      </button>
                      
                      {showAddTileDropdown && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                          <div className="p-2">
                            <button
                              onClick={() => {
                                setNewTile({...newTile, type: 'page'})
                                setShowAddTileModal(true)
                                setShowAddTileDropdown(false)
                              }}
                              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-medium text-gray-900">📄 Page/Function</div>
                              <div className="text-sm text-gray-500">Link to internal pages or functions</div>
                            </button>
                            
                            <button
                              onClick={() => {
                                setNewTile({...newTile, type: 'embed'})
                                setShowAddTileModal(true)
                                setShowAddTileDropdown(false)
                              }}
                              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-medium text-gray-900">🌐 Website Embed</div>
                              <div className="text-sm text-gray-500">Embed external websites or apps</div>
                            </button>
                            
                            <button
                              onClick={() => {
                                setNewTile({...newTile, type: 'task'})
                                setShowAddTileModal(true)
                                setShowAddTileDropdown(false)
                              }}
                              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-medium text-gray-900">✅ Task Manager</div>
                              <div className="text-sm text-gray-500">Create a task management widget</div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tiles */}
            {viewMode === 'grid' ? (
              <div className="relative">
                {/* Widgets Section */}
                <div className="grid grid-cols-12 gap-4 mb-8">
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className="transition-all duration-300 ease-out hover:scale-105 hover:z-10"
                      style={{
                        gridColumn: `span ${widget.size.width}`,
                        gridRow: `span ${widget.size.height}`,
                        animation: `slideInFromLeft 0.8s ease-out forwards`
                      }}
                    >
                      {renderWidget(widget)}
                    </div>
                  ))}
                </div>

                {/* Main App Tiles Grid - Responsive based on sidebar state */}
                <div className={`grid gap-4 auto-rows-fr ${
                  leftSidebarCollapsed && rightSidebarCollapsed 
                    ? 'grid-cols-12' // Full width - 12 columns
                    : (!leftSidebarCollapsed && !rightSidebarCollapsed)
                    ? 'grid-cols-8' // Both sidebars open - 8 columns for better visibility
                    : 'grid-cols-10' // One sidebar open - 10 columns
                }`}>
                {filteredNavigation.map((item, index) => {
                  const tileId = getTileId(item)
                  const notes = tileNotes[tileId] || []
                  const todos = tileTodos[tileId] || []
                  const completedTodos = todos.filter(todo => todo.completed).length
                  
                  const tileSize = tileSizes[tileId] || { width: 1, height: 1 }
                  
                  return (
                    <div
                      key={tileId}
                      draggable={editMode}
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onClick={() => !editMode && openApp(item, true)}
                      onMouseEnter={() => setHoveredTile(tileId)}
                      onMouseLeave={() => setHoveredTile(null)}
                      className={`group relative rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 overflow-hidden backdrop-blur-sm ${
                        theme === 'dark' 
                          ? 'bg-gray-800/80 border border-gray-600/50 hover:bg-gray-700/90' 
                          : 'bg-white/80 border border-gray-200/50 hover:bg-white/95'
                      } ${editMode ? 'cursor-move' : 'cursor-pointer'} ${
                        draggedItem && getTileId(draggedItem) === tileId ? 'opacity-50' : ''
                      }`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        opacity: 0,
                        animation: `slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 50}ms forwards`,
                        gridColumn: `span ${Math.min(Math.max(tileSize.width, 2), 
                          leftSidebarCollapsed && rightSidebarCollapsed ? 4 : 
                          (!leftSidebarCollapsed && !rightSidebarCollapsed) ? 3 : 3)}`,
                        gridRow: `span ${tileSize.height}`,
                        minHeight: '120px'
                      }}
                    >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(item.category)} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                    
                    <div className="relative p-6">
                      {/* Responsive content based on tile size */}
                      {tileSize.width === 1 && tileSize.height === 1 ? (
                        // Small tile - Icon + Name + Description
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryColor(item.category)} shadow-lg mb-2`}>
                            <item.icon className="h-5 w-5 text-white" />
                          </div>
                          <h3 className={`text-sm font-medium group-hover:text-blue-600 transition-colors leading-tight mb-1 ${
                            theme === 'dark' ? 'text-gray-100' : 'text-slate-800'
                          }`}>
                            {item.name}
                          </h3>
                          <p className={`text-xs leading-tight ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {item.description}
                          </p>
                        </div>
                      ) : tileSize.width === 2 && tileSize.height === 1 ? (
                        // Landscape tile - Icon + Name horizontal
                        <div className="flex items-center space-x-3 h-full">
                          <div className={`p-3 rounded-lg bg-gradient-to-br ${getCategoryColor(item.category)} shadow-lg flex-shrink-0`}>
                            <item.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                              {item.name}
                            </h3>
                            <p className="text-xs text-gray-600 truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Default/Large tile - Full content
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg bg-gradient-to-br ${getCategoryColor(item.category)} shadow-lg`}>
                              <item.icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                              {item.category}
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </h3>
                      
                          <p className="text-sm text-gray-600 leading-relaxed mb-3">
                            {item.description}
                          </p>

                          {/* Render different content based on tile type */}
                          {item.type === 'embed' && item.embedUrl && (
                            <div className="mb-3">
                              <iframe
                                src={item.embedUrl}
                                className="w-full h-32 rounded border"
                                title={item.name}
                                sandbox="allow-same-origin allow-scripts"
                              />
                            </div>
                          )}

                          {item.type === 'task' && (
                            <div className="mb-3">
                              <div className="space-y-2 max-h-24 overflow-y-auto">
                                {(tileTodos[tileId] || []).slice(0, 3).map((todo) => (
                                  <div key={todo.id} className="flex items-center space-x-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={todo.completed}
                                      onChange={() => toggleTodo(tileId, todo.id)}
                                      className="rounded"
                                    />
                                    <span className={todo.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                                      {todo.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {(tileTodos[tileId] || []).length > 3 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  +{(tileTodos[tileId] || []).length - 3} more tasks
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Notes and Todos indicators */}
                          {(notes.length > 0 || todos.length > 0) && (
                            <div className="flex items-center space-x-3 mb-3">
                              {notes.length > 0 && (
                                <div className="flex items-center space-x-1 text-xs text-blue-600">
                                  <FileText className="h-3 w-3" />
                                  <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {todos.length > 0 && (
                                <div className="flex items-center space-x-1 text-xs text-green-600">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>{completedTodos}/{todos.length} done</span>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      
                      {editMode ? (
                        <div className="mt-4 flex items-center space-x-2">
                          {item.isCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                editTile(item)
                              }}
                              className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeTile(item.id || item.name, item.isCustom)
                            }}
                            className="flex-1 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium transition-colors"
                          >
                            {item.isCustom ? 'Delete' : 'Hide'}
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>Open Module</span>
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowTileDetails(tileId)
                              }}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
                            >
                              Options
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Resize handles in edit mode */}
                      {editMode && (
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleResize(tileId, 1, 1) // Resize to icon size
                            }}
                            className="w-5 h-5 bg-gray-400 hover:bg-blue-500 text-white rounded text-xs opacity-0 group-hover:opacity-80 transition-all duration-200"
                            title="Icon size"
                          >
                            <Grid className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const currentSize = tileSizes[tileId] || { width: 1, height: 1 }
                              handleResize(tileId, Math.min(currentSize.width + 1, 4), currentSize.height)
                            }}
                            className="w-5 h-5 bg-gray-400 hover:bg-green-500 text-white rounded text-xs opacity-0 group-hover:opacity-80 transition-all duration-200"
                            title="Increase width"
                          >
                            +
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const currentSize = tileSizes[tileId] || { width: 1, height: 1 }
                              handleResize(tileId, Math.max(currentSize.width - 1, 1), currentSize.height)
                            }}
                            className="w-5 h-5 bg-gray-400 hover:bg-red-500 text-white rounded text-xs opacity-0 group-hover:opacity-80 transition-all duration-200"
                            title="Decrease width"
                          >
                            -
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover Card */}
                    <HoverCard item={item} tileId={tileId} />
                  </div>
                  )
                })}
                </div>
              </div>
            ) : (
              // List view
              <div className="space-y-4">
                {filteredNavigation.map((item, index) => (
                  <div
                    key={getTileId(item)}
                    onClick={() => !editMode && openApp(item, true)}
                    className={`group flex items-center p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border border-gray-600 hover:bg-gray-700' 
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${getCategoryColor(item.category)} mr-4`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold group-hover:text-blue-600 transition-colors ${
                        theme === 'dark' ? 'text-gray-100' : 'text-slate-800'
                      }`}>
                        {item.name}
                      </h3>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Key Ratios */}
        <div className={`modern-dashboard-sidebar-right shadow-lg transition-all duration-300 ${
          rightSidebarCollapsed ? 'w-0' : 'w-80'
        } ${
          theme === 'dark' ? 'bg-gray-800 border-l border-gray-600' : 'bg-white border-l border-gray-200'
        }`}>
          <div className="p-6 h-full overflow-y-auto">
            {!rightSidebarCollapsed && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">Key Financial Ratios</h3>
                  <RefreshCw className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                </div>
                
                <div className="space-y-4">
                  {financialRatios.map((ratio, index) => (
                    <div
                      key={ratio.name}
                      className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-slate-700">{ratio.name}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ratio.status)}`}>
                          {ratio.status}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-slate-800">{ratio.value}</span>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(ratio.trend)}
                          <span className={`text-sm font-medium ${
                            ratio.trend === 'up' ? 'text-emerald-600' : 
                            ratio.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {ratio.change}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600">{ratio.description}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Quick Actions</h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => navigate('/financial-statements')}
                      className="w-full text-left p-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-emerald-700" />
                        <span className="text-sm font-medium text-emerald-800">Generate Reports</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => navigate('/consolidation')}
                      className="w-full text-left p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg border border-blue-300 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <LinkIcon className="h-5 w-5 text-blue-800" />
                        <span className="text-sm font-medium text-blue-900">Run Consolidation</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => navigate('/process')}
                      className="w-full text-left p-3 bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 rounded-lg border border-yellow-200 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Workflow className="h-5 w-5 text-yellow-700" />
                        <span className="text-sm font-medium text-yellow-800">Process Data</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Global Task Manager */}
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">📋 Quick Tasks</h4>
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {tasks.map((task) => (
                      <div key={task.id} className={`flex items-center space-x-2 p-2 rounded ${
                        task.completed ? 'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="rounded"
                        />
                        <span className={`text-xs flex-1 ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-700'
                        }`}>
                          {task.text}
                        </span>
                        <button
                          onClick={() => removeTask(task.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      placeholder="Add a quick task..."
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                      onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    />
                    <button
                      onClick={addTask}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Tile Modal */}
      {showAddTileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingTile ? 'Edit Tile' : 'Add New Tile'}
              </h3>
              <button
                onClick={() => {
                  setShowAddTileModal(false)
                  setEditingTile(null)
                  setNewTile({ name: '', href: '', description: '', category: 'core', icon: 'BarChart3' })
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newTile.name}
                  onChange={(e) => setNewTile({ ...newTile, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tile name"
                />
              </div>

              {newTile.type === 'page' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Page</label>
                  <select
                    value={selectedPage ? selectedPage.name : ''}
                    onChange={(e) => {
                      const page = allPages.find(p => p.name === e.target.value)
                      if (page) handlePageSelect(page)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  >
                    <option value="">Choose a page...</option>
                    {allPages.map((page) => (
                      <option key={page.name} value={page.name}>
                        {page.name}
                      </option>
                    ))}
                  </select>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL/Path</label>
                  <input
                    type="text"
                    value={newTile.href}
                    onChange={(e) => setNewTile({ ...newTile, href: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="/your-custom-page"
                    readOnly={selectedPage}
                  />
                </div>
              )}

              {newTile.type === 'embed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={newTile.embedUrl}
                    onChange={(e) => setNewTile({ ...newTile, embedUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Note: Some websites may not allow embedding</p>
                </div>
              )}

              {newTile.type === 'task' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task List Name</label>
                  <input
                    type="text"
                    value={newTile.name}
                    onChange={(e) => setNewTile({ ...newTile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="My Tasks"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTile.description}
                  onChange={(e) => setNewTile({ ...newTile, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the module"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newTile.category}
                  onChange={(e) => setNewTile({ ...newTile, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="core">Core Functions</option>
                  <option value="reporting">Reporting</option>
                  <option value="analytics">Analytics</option>
                  <option value="compliance">Compliance</option>
                  <option value="system">System</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <select
                  value={newTile.icon}
                  onChange={(e) => setNewTile({ ...newTile, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="BarChart3">Bar Chart</option>
                  <option value="Building2">Building</option>
                  <option value="BookOpen">Book</option>
                  <option value="Workflow">Workflow</option>
                  <option value="Calculator">Calculator</option>
                  <option value="Database">Database</option>
                  <option value="Settings">Settings</option>
                  <option value="TrendingUp">Trending Up</option>
                  <option value="FileText">File Text</option>
                  <option value="Users">Users</option>
                  <option value="Shield">Shield</option>
                  <option value="Globe">Globe</option>
                  <option value="Zap">Zap</option>
                  <option value="Lightbulb">Lightbulb</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                  <select
                    value={newTile.width}
                    onChange={(e) => setNewTile({ ...newTile, width: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 Column</option>
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <select
                    value={newTile.height}
                    onChange={(e) => setNewTile({ ...newTile, height: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 Row</option>
                    <option value={2}>2 Rows</option>
                    <option value={3}>3 Rows</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddTileModal(false)
                  setEditingTile(null)
                  setSelectedPage(null)
                  setNewTile({ name: '', href: '', description: '', category: 'core', icon: 'BarChart3', type: 'page', embedUrl: '', width: 1, height: 1 })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingTile ? updateTile : addCustomTile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTile ? 'Update' : 'Add Tile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Tiles Panel */}
      {editMode && hiddenTiles.size > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Hidden Tiles</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {[...hiddenTiles].map((tileName) => (
              <div key={tileName} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{tileName}</span>
                <button
                  onClick={() => restoreTile(tileName)}
                  className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs transition-colors"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tile Details Modal */}
      {showTileDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">
                {filteredNavigation.find(item => getTileId(item) === showTileDetails)?.name || 'Tile Options'}
              </h3>
              <button
                onClick={() => setShowTileDetails(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Actions Section */}
              <div>
                <h4 className="text-lg font-medium text-slate-700 mb-3">Quick Actions</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const item = filteredNavigation.find(item => getTileId(item) === showTileDetails)
                      if (item) openApp(item, true)
                    }}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Open Page/Function
                  </button>
                  
                  <button
                    onClick={() => {
                      const item = filteredNavigation.find(item => getTileId(item) === showTileDetails)
                      if (item && item.href) {
                        navigator.clipboard.writeText(`${window.location.origin}${item.href}`)
                        // You could add a toast notification here
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Copy Link
                  </button>
                  
                  <button
                    onClick={() => {
                      const item = filteredNavigation.find(item => getTileId(item) === showTileDetails)
                      if (item && item.href) {
                        window.open(item.href, '_blank')
                      }
                    }}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Open in New Tab
                  </button>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h4 className="text-lg font-medium text-slate-700 mb-3">Notes</h4>
                <div className="space-y-3 mb-4">
                  {(tileNotes[showTileDetails] || []).map((note) => (
                    <div key={note.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-sm text-slate-700">{note.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(note.timestamp).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => removeNote(showTileDetails, note.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addNote(showTileDetails)}
                  />
                  <button
                    onClick={() => addNote(showTileDetails)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Todos Section */}
              <div>
                <h4 className="text-lg font-medium text-slate-700 mb-3">To-dos</h4>
                <div className="space-y-2 mb-4">
                  {(tileTodos[showTileDetails] || []).map((todo) => (
                    <div key={todo.id} className={`rounded-lg p-3 border ${
                      todo.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleTodo(showTileDetails, todo.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            todo.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {todo.completed && <CheckCircle className="h-3 w-3 text-white" />}
                        </button>
                        <span className={`text-sm flex-1 ${
                          todo.completed ? 'line-through text-gray-500' : 'text-slate-700'
                        }`}>
                          {todo.text}
                        </span>
                        <button
                          onClick={() => removeTodo(showTileDetails, todo.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Add a to-do..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addTodo(showTileDetails)}
                  />
                  <button
                    onClick={() => addTodo(showTileDetails)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Windows-style App Windows */}
      {openApps.map((app) => (
        <div
          key={app.id}
          className={`fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 transition-all duration-200 select-none ${
            app.isMinimized ? 'hidden' : 'block'
          } ${app.isMaximized ? 'z-[60]' : focusedApp === app.id ? 'z-[55]' : 'z-[52]'}`}
          style={{
            left: app.position.x,
            top: app.position.y,
            width: app.size.width,
            height: app.size.height,
          }}
          onClick={(e) => {
            e.stopPropagation()
            focusApp(app.id)
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            focusApp(app.id)
          }}
        >
          {/* Window Title Bar */}
          <div 
            className={`flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-t-lg cursor-move ${
              focusedApp === app.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onMouseDown={(e) => handleWindowMouseDown(e, app.id)}
          >
            <div className="flex items-center space-x-2">
              <app.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {app.title}
              </span>
            </div>
            <div className="flex items-center space-x-1 window-controls">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  minimizeApp(app.id)
                }}
                className="w-6 h-6 rounded hover:bg-yellow-200 dark:hover:bg-yellow-600 flex items-center justify-center transition-colors"
              >
                <Minus className="h-3 w-3 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  maximizeApp(app.id)
                }}
                className="w-6 h-6 rounded hover:bg-green-200 dark:hover:bg-green-600 flex items-center justify-center transition-colors"
              >
                <Maximize2 className="h-3 w-3 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeApp(app.id)
                }}
                className="w-6 h-6 rounded hover:bg-red-200 dark:hover:bg-red-600 flex items-center justify-center transition-colors"
              >
                <X className="h-3 w-3 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Window Content */}
          <div className="flex-1 h-full relative">
            <iframe
              src={app.url}
              className="w-full h-full border-0 rounded-b-lg"
              title={app.title}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
            
            {/* Resize handles - only show when not maximized */}
            {!app.isMaximized && (
              <>
                {/* Corner handles */}
                <div
                  className="absolute -top-1 -left-1 w-4 h-4 cursor-nw-resize opacity-0 hover:opacity-100 bg-blue-500 rounded-br transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, app.id, 'top-left')}
                />
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 cursor-ne-resize opacity-0 hover:opacity-100 bg-blue-500 rounded-bl transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, app.id, 'top-right')}
                />
                <div
                  className="absolute -bottom-1 -left-1 w-4 h-4 cursor-sw-resize opacity-0 hover:opacity-100 bg-blue-500 rounded-tr transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, app.id, 'bottom-left')}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-100 bg-blue-500 rounded-tl transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, app.id, 'bottom-right')}
                />
                
                {/* Edge handles */}
                <div
                  className="absolute -top-1 left-4 right-4 h-2 cursor-n-resize opacity-0 hover:opacity-100 bg-blue-500 transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, app.id, 'top')}
                />
                <div
                  className="absolute -bottom-1 left-4 right-4 h-2 cursor-s-resize opacity-0 hover:opacity-100 bg-blue-500 transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, app.id, 'bottom')}
                />
                <div
                  className="absolute -left-1 top-4 bottom-4 w-2 cursor-w-resize opacity-0 hover:opacity-100 bg-blue-500 transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, app.id, 'left')}
                />
                <div
                  className="absolute -right-1 top-4 bottom-4 w-2 cursor-e-resize opacity-0 hover:opacity-100 bg-blue-500 transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, app.id, 'right')}
                />
              </>
            )}
          </div>
        </div>
      ))}

      {/* Taskbar for minimized apps */}
      {openApps.some(app => app.isMinimized) && (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-gray-800/90 backdrop-blur-sm rounded-t-lg px-4 py-2 z-50">
          <div className="flex items-center space-x-2">
            {openApps.filter(app => app.isMinimized).map((app) => (
              <button
                key={app.id}
                onClick={() => focusApp(app.id)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                <app.icon className="h-4 w-4 text-white" />
                <span className="text-sm text-white truncate max-w-24">{app.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Windows-style Snap Zones - Show when dragging */}
      {draggingApp && (
        <div className="fixed inset-0 z-[65] pointer-events-none">
          {/* Left Snap Zone */}
          <div className={`absolute left-0 top-0 w-1/2 h-full transition-all duration-150 ${
            dragSnapZone === 'left' ? 'bg-blue-500/30 border-2 border-blue-500' : 'bg-blue-500/10 border border-blue-300'
          }`}>
            {dragSnapZone === 'left' && (
              <div className="flex items-center justify-center h-full">
                <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium">
                  Snap Left
                </div>
              </div>
            )}
          </div>
          
          {/* Right Snap Zone */}
          <div className={`absolute right-0 top-0 w-1/2 h-full transition-all duration-150 ${
            dragSnapZone === 'right' ? 'bg-blue-500/30 border-2 border-blue-500' : 'bg-blue-500/10 border border-blue-300'
          }`}>
            {dragSnapZone === 'right' && (
              <div className="flex items-center justify-center h-full">
                <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium">
                  Snap Right
                </div>
              </div>
            )}
          </div>
          
          {/* Top Snap Zone */}
          <div className={`absolute top-0 left-1/4 w-1/2 h-1/2 transition-all duration-150 ${
            dragSnapZone === 'top' ? 'bg-green-500/30 border-2 border-green-500' : 'bg-green-500/10 border border-green-300'
          }`}>
            {dragSnapZone === 'top' && (
              <div className="flex items-center justify-center h-full">
                <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium">
                  Maximize
                </div>
              </div>
            )}
          </div>
          
          {/* Corner Snap Zones */}
          <div className={`absolute top-0 left-0 w-1/4 h-1/2 transition-all duration-150 ${
            dragSnapZone === 'top-left' ? 'bg-purple-500/30 border-2 border-purple-500' : 'bg-purple-500/10 border border-purple-300'
          }`}>
            {dragSnapZone === 'top-left' && (
              <div className="flex items-center justify-center h-full">
                <div className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm">
                  Top Left
                </div>
              </div>
            )}
          </div>
          
          <div className={`absolute top-0 right-0 w-1/4 h-1/2 transition-all duration-150 ${
            dragSnapZone === 'top-right' ? 'bg-purple-500/30 border-2 border-purple-500' : 'bg-purple-500/10 border border-purple-300'
          }`}>
            {dragSnapZone === 'top-right' && (
              <div className="flex items-center justify-center h-full">
                <div className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm">
                  Top Right
                </div>
              </div>
            )}
          </div>
          
          <div className={`absolute bottom-0 left-0 w-1/4 h-1/2 transition-all duration-150 ${
            dragSnapZone === 'bottom-left' ? 'bg-purple-500/30 border-2 border-purple-500' : 'bg-purple-500/10 border border-purple-300'
          }`}>
            {dragSnapZone === 'bottom-left' && (
              <div className="flex items-center justify-center h-full">
                <div className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm">
                  Bottom Left
                </div>
              </div>
            )}
          </div>
          
          <div className={`absolute bottom-0 right-0 w-1/4 h-1/2 transition-all duration-150 ${
            dragSnapZone === 'bottom-right' ? 'bg-purple-500/30 border-2 border-purple-500' : 'bg-purple-500/10 border border-purple-300'
          }`}>
            {dragSnapZone === 'bottom-right' && (
              <div className="flex items-center justify-center h-full">
                <div className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm">
                  Bottom Right
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default ModernDashboard
