import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'
import { useTheme } from '../contexts/ThemeContext'
import CompanySelector from './CompanySelector'
import SearchBar from './SearchBar'
import ChatAssistant from './ChatAssistant'
import './Sidebar.css'
import './glassmorphism.css'
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  User,
  Settings as Cog,
  Bell,
  Search,
  BarChart3,
  Link as LinkIcon,
  TrendingUp,
  FileText,
  Sparkles,
  Settings,
  Database,
  Edit3,
  Building2,
  HardDrive,
  Eye,
  FileSpreadsheet,
  Calculator,
  Receipt,
  Activity,
  ChevronLeft,
  ChevronRight,
  Layers,
  Shield,
  Globe,
  BarChart,
  HelpCircle,
  Users,
  Lock,
  Monitor,
  Server,
  Download,
  Wifi,
  BookOpen,
  Workflow,
  Target,
  Calendar,
  ArrowUpDown,
  DollarSign,
  Percent,
  Compass,
  Zap,
  ClipboardList,
  CheckCircle,
  Handshake,
  UserCheck,
  Lightbulb
} from 'lucide-react'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)
  const [sqlRunningTabs, setSqlRunningTabs] = useState(['dashboard', 'trial-balance', 'consolidation'])
  const { user, logout } = useAuth()
  const { selectedCompany } = useCompany()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: BarChart3,
      description: 'Financial overview and insights'
    },
    { 
      name: 'Axes', 
      href: '/axes', 
      icon: BarChart3,
      description: 'Universal dimensions template for entities, accounts, and more'
    },
    { 
      name: 'Custom Axes', 
      href: '/custom-axes', 
      icon: BarChart3,
      description: 'Custom dimensions for reporting'
    },
    { 
      name: 'Entity Management', 
      href: '/entity', 
      icon: Building2,
      description: 'Manage business entities and hierarchies'
    },
    { 
      name: 'Account Management', 
      href: '/accounts', 
      icon: BookOpen,
      description: 'Chart of accounts and categorization'
    },
    { 
      name: 'Process Module', 
      href: '/process', 
      icon: Workflow,
      description: 'Data processing & validation'
    },
    { 
      name: 'HR Management', 
      href: '/hr-management', 
      icon: Users,
      description: 'People, payroll, benefits, and compliance control center'
    },
    { 
      name: 'Trial Balance', 
      href: '/trial-balance', 
      icon: BarChart,
      description: 'Trial balance reports'
    },
    { 
      name: 'Journal Entries', 
      href: '/journal-entries', 
      icon: ClipboardList,
      description: 'Manual journal entries'
    },
    { 
      name: 'FST Items', 
      href: '/fst-items', 
      icon: Layers,
      description: 'Financial Statement Templates'
    },
    { 
      name: 'Asset Register', 
      href: '/asset-register', 
      icon: HardDrive,
      description: 'Fixed asset management'
    },
    { 
      name: 'Bills', 
      href: '/bills', 
      icon: Receipt,
      description: 'Bill management & tracking'
    },
    { 
      name: 'Bank Reconciliation', 
      href: '/bank-reconciliation', 
      icon: Calculator,
      description: 'Bank statement reconciliation'
    },
    { 
      name: 'Supplier Reconciliation', 
      href: '/supplier-reconciliation', 
      icon: Target,
      description: 'Supplier invoice and payment reconciliation'
    },
    { 
      name: 'Purchase Orders', 
      href: '/integrations/purchase-order-management', 
      icon: FileSpreadsheet,
      description: 'Procurement & purchase orders'
    },
    { 
      name: 'Financial Statements', 
      href: '/financial-statements', 
      icon: TrendingUp,
      description: 'P&L, Balance Sheet & Cash Flow'
    },
      {
        name: 'Custom Reports',
        href: '/reports',
        icon: FileText,
        description: 'Create and manage custom financial reports'
      },
      {
        name: 'Advanced Features',
        href: '/advanced-features',
        icon: Sparkles,
        description: 'Enterprise-grade features showcase'
      },
    { 
      name: 'Consolidation', 
      href: '/consolidation', 
      icon: LinkIcon,
      description: 'Multi-entity consolidation'
    },
    { 
      name: 'Process Builder', 
      href: '/process-builder', 
      icon: Zap,
      description: 'Advanced consolidation & process automation'
    },
    { 
      name: 'IFRS Templates', 
      href: '/ifrs-templates', 
      icon: FileText,
      description: 'IFRS standards library'
    },
    { 
      name: 'ETL Pipeline', 
      href: '/etl', 
      icon: Database,
      description: 'Extract, Transform & Load data pipeline'
    },
    { 
      name: 'Forecast & Budget', 
      href: '/forecast-budget', 
      icon: Calendar,
      description: 'Budgeting & forecasting'
    },
    { 
      name: 'Variance Analysis', 
      href: '/variance-analysis', 
      icon: ArrowUpDown,
      description: 'Budget vs actual analysis'
    },
    { 
      name: 'Cash Flow Analysis', 
      href: '/cash-flow', 
      icon: DollarSign,
      description: 'Cash flow statements'
    },
    { 
      name: 'Financial Ratios', 
      href: '/financial-ratios', 
      icon: Percent,
      description: 'Financial ratio analysis'
    },
    { 
      name: 'Narrative Reporting', 
      href: '/narrative-reporting', 
      icon: FileText,
      description: 'Rich text reporting and collaboration'
    },
    { 
      name: 'What-If Analysis', 
      href: '/what-if-analysis', 
      icon: Compass,
      description: 'Scenario modeling and sensitivity analysis'
    },
    { 
      name: 'Real-Time Analytics', 
      href: '/real-time-analytics', 
      icon: Zap,
      description: 'Unified analytics dashboard'
    },
    { 
      name: 'Regulatory Reporting', 
      href: '/regulatory-reporting', 
      icon: FileText,
      description: 'Regulatory compliance'
    },
    { 
      name: 'Global Compliance', 
      href: '/global-compliance', 
      icon: Shield,
      description: 'Multi-jurisdiction compliance management'
    },
    { 
      name: 'ESG', 
      href: '/integrations/esg', 
      icon: Globe,
      description: 'Environmental, Social & Governance'
    },
    { 
      name: 'Audit', 
      href: '/audit', 
      icon: FileSpreadsheet,
      description: 'Audit working papers'
    },
    { 
      name: 'Audit Trail', 
      href: '/audit-trail', 
      icon: Activity,
      description: 'Track all system changes'
    },
    { 
      name: 'Internal Controls', 
      href: '/internal-controls', 
      icon: Shield,
      description: 'Internal control framework'
    },
    { 
      name: 'Compliance Management', 
      href: '/integrations/compliance-management', 
      icon: CheckCircle,
      description: 'Regulatory compliance tracking'
    },
    { 
      name: 'Forex Rate Management', 
      href: '/forex-rates', 
      icon: Globe,
      description: 'Exchange rate management'
    },
    { 
      name: 'Workflows', 
      href: '/workflows', 
      icon: Activity,
      description: 'Workflow automation and process management'
    },
    { 
      name: 'Stakeholder Management', 
      href: '/integrations/stakeholder-management', 
      icon: Handshake,
      description: 'Stakeholder engagement'
    },
    { 
      name: 'CRM', 
      href: '/integrations/crm', 
      icon: UserCheck,
      description: 'Customer relationship management'
    },
    { 
      name: 'Project Management', 
      href: '/integrations/project-management', 
      icon: Layers,
      description: 'Project planning & tracking'
    },
    { 
      name: 'Revenue Analytics', 
      href: '/integrations/revenue-analytics', 
      icon: TrendingUp,
      description: 'Revenue analysis & forecasting'
    },
    { 
      name: 'Role Management', 
      href: '/rolemanagement', 
      icon: Shield,
      description: 'User roles, permissions, and access control management'
    },
    { 
      name: 'System Monitoring', 
      href: '/system-monitoring', 
      icon: Monitor,
      description: 'System health & performance'
    },
    { 
      name: 'System Management', 
      href: '/system-management', 
      icon: Settings,
      description: 'NPM dependencies & integration management'
    },
    { 
      name: 'Database Management', 
      href: '/database-management', 
      icon: Database,
      description: 'Database administration'
    },
    { 
      name: 'Backup & Restore', 
      href: '/backup-restore', 
      icon: HardDrive,
      description: 'Data backup & recovery'
    },
    { 
      name: 'Data Import/Export', 
      href: '/data-import-export', 
      icon: Download,
      description: 'Data import & export tools'
    },
    { 
      name: 'API Management', 
      href: '/api-management', 
      icon: Server,
      description: 'API endpoints & documentation'
    },
    { 
      name: 'Third Party Integrations', 
      href: '/third-party-integration', 
      icon: Globe,
      description: 'External system integrations'
    },
    { 
      name: 'Integration Summary', 
      href: '/integration-summary', 
      icon: BarChart3,
      description: 'Consolidated view of all integrations'
    },
    { 
      name: 'Integration Hub', 
      href: '/integration-hub', 
      icon: LinkIcon,
      description: 'OS-like app launcher for all integrations'
    },
    { 
      name: 'Documentation', 
      href: '/documentation', 
      icon: BookOpen,
      description: 'User guides & documentation'
    },
    { 
      name: 'Training Materials', 
      href: '/training', 
      icon: FileText,
      description: 'Training videos & materials'
    },
    { 
      name: 'Support Center', 
      href: '/support', 
      icon: HelpCircle,
      description: 'Technical support & help'
    },
    { 
      name: 'System Settings', 
      href: '/settings', 
      icon: Cog,
      description: 'System configuration'
    },
    // Additional items that were not in the specified order but should remain
    { 
      name: 'Audit Materiality', 
      href: '/audit-materiality', 
      icon: Eye,
      description: 'Audit thresholds & materiality'
    },
    { 
      name: 'Tax Management', 
      href: '/tax-management', 
      icon: Calculator,
      description: 'Tax calculations & filing'
    },
    { 
      name: 'Asset Management', 
      href: '/integrations/asset-management', 
      icon: Building2,
      description: 'Fixed asset lifecycle management'
    },
    { 
      name: 'Business Valuation & Impairment', 
      href: '/business-valuation', 
      icon: Calculator,
      description: 'Business valuation, DCF analysis & impairment testing'
    },
    { 
      name: 'SQL Query Console', 
      href: '/sql-query-console', 
      icon: Database,
      description: 'Secure PostgreSQL query interface - SELECT only'
    },
    { 
      name: 'Business Tools', 
      href: '/business-tools',
      icon: Lightbulb,
      description: 'Advanced business analysis tools and frameworks'
    },
    { 
      name: 'Fiscal Management', 
      href: '/fiscal-management', 
      icon: Calendar,
      description: 'Fiscal year, period and scenario management'
    },
    { 
      name: 'Quantum Finance', 
      href: '/quantum-finance', 
      icon: Zap,
      description: 'Advanced quantum finance features for portfolio optimization, risk modeling, forecasting, and analytics'
    }
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (href) => {
    return location.pathname === href
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-slate-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white dark:bg-slate-800">
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-200 dark:border-slate-700">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">IFRS Consolidation Pro</h1>
            <button
              type="button"
              className="ml-auto p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col px-6 py-4 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group relative flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                    isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 shadow-md border-2 border-green-300 dark:border-green-600'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 hover:shadow-lg'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                {/* Background gradient effect on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-lg ${
                  isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                    : 'bg-gradient-to-br from-slate-500 to-gray-600'
                }`}></div>
                
                <div className="flex items-center justify-center relative z-10 mr-3">
                  <div className={`p-1 rounded-lg group-hover:scale-110 transition-transform duration-200 ${
                    isActive 
                      ? 'bg-blue-200 dark:bg-blue-800' 
                      : 'bg-transparent group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                  }`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex-1 relative z-10">
                  <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                {item.name}
                  </span>
                </div>
                
                {/* Hover arrow indicator */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1 z-10">
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                </div>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:bg-white dark:lg:bg-slate-800 lg:border-r lg:border-slate-200 dark:lg:border-slate-700 transition-all duration-300 ease-in-out flex-shrink-0 ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'
      }`}>
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Sidebar header */}
          <div className="flex items-center h-16 px-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex-shrink-0">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">IFRS Consolidation Pro</h1>
            )}
            <button
              onClick={toggleSidebar}
              className={`p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                sidebarCollapsed ? 'mx-auto' : 'ml-auto'
              }`}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-4 space-y-2 ${sidebarCollapsed ? 'px-2' : 'px-6'} overflow-y-auto`}>
            {!sidebarCollapsed && (
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Navigation Menu
              </h2>
            )}
            <div className="space-y-1">
        {navigation.map((item) => (
          <div key={item.name} className="relative">
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                `group relative flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                  isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 shadow-md border-2 border-green-300 dark:border-green-600'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 hover:shadow-lg'
                }`
              }
              title={sidebarCollapsed ? item.name : undefined}
            >
              {/* Background gradient effect on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-lg ${
                'bg-gradient-to-br from-slate-500 to-gray-600'
              }`}></div>
              
              <div className={`flex items-center justify-center relative z-10 ${sidebarCollapsed ? 'w-full' : 'mr-3'}`}>
                <div className={`p-1 rounded-lg group-hover:scale-110 transition-transform duration-200 ${
                  'bg-transparent group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                }`}>
                <item.icon className={`${sidebarCollapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
                </div>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 relative z-10">
                  <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                    {item.name}
                  </span>
                </div>
              )}
              
              {/* SQL Live Indicator */}
              {sqlRunningTabs.includes(item.href.replace('/', '')) && (
                <div className="absolute right-2 top-2 w-2 h-2 bg-green-500 rounded-full animate-pulse z-20">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
                </div>
              )}
              
              {/* Hover arrow indicator */}
              {!sidebarCollapsed && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1 z-10">
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                </div>
              )}
            </NavLink>
          </div>
        ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'
      }`}>
        {/* Top navigation bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-slate-700 dark:text-slate-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <SearchBar />
          </div>

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Company Selector */}
            <div className="hidden lg:block">
              <CompanySelector />
            </div>

            {/* Notifications */}
            <button className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 relative group">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-rose-500 rounded-full animate-pulse"></span>
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">Notifications</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No new notifications</p>
                </div>
              </div>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors duration-200"
            >
              {theme === 'dark' ? (
                <Sun className="h-6 w-6" />
              ) : (
                <Moon className="h-6 w-6" />
              )}
            </button>

            {/* Separator */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200 dark:lg:bg-slate-700" />

            {/* Profile dropdown */}
            <div className="relative group">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.username || user?.full_name || 'User'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role || 'User'}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
              
              {/* Profile dropdown menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <a href="/profile" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                    Your Profile
                  </a>
                  <a href="/settings" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                    Settings
                  </a>
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-8 w-full min-w-0">
          <div className={`w-full h-full min-w-0 transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'px-2 max-w-none' : 'px-6 max-w-7xl mx-auto'
          }`}>
            {children}
          </div>
        </main>
      </div>

      {/* Chat Assistant */}
      <ChatAssistant />
    </div>
  )
}

export default Layout
