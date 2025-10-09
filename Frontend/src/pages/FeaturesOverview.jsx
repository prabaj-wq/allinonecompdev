import React from 'react'
import { 
  BarChart3, 
  Link as LinkIcon, 
  TrendingUp, 
  FileText, 
  Settings, 
  Edit3, 
  Building2, 
  HardDrive, 
  Eye, 
  FileSpreadsheet, 
  Activity, 
  Receipt, 
  Calculator, 
  Layers, 
  Globe, 
  BookOpen, 
  FileText, 
  Clipboard, 
  BarChart, 
  Shield, 
  Users, 
  Lock, 
  Cog, 
  Monitor, 
  Server, 
  Database, 
  Upload, 
  Network, 
  Wifi, 
  Video, 
  HelpCircle,
  CheckCircle,
  Star,
  Zap,
  Target,
  PieChart,
  Clock,
  DollarSign,
  Plus,
  Download,
  RefreshCw,
  Filter,
  MoreHorizontal,
  Archive,
  Key,
  Cloud,
  AlertTriangle,
  Info,
  ExternalLink,
  Copy,
  Trash2,
  Edit,
  Save,
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  Tablet,
  Printer,
  Camera,
  Mic,
  Headphones,
  Radio,
  Tv,
  Gamepad,
  Mouse,
  Keyboard,
  Usb,
  Bluetooth,
  Signal,
  Battery,
  Power,
  PowerOff,
  Flame,
  Snowflake,
  Droplets,
  CloudRain,
  Zap,
  Sun,
  Moon,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Laugh,
  AlertCircle,
  X,
  ChevronRight,
  ChevronLeft,
  SortAsc,
  SortDesc,
  Search,
  Bell,
  User,
  Menu,
  XCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CreditCard,
  Calendar
} from 'lucide-react'

const FeaturesOverview = () => {
  const featureCategories = [
    {
      name: 'Core Financial Management',
      description: 'Essential financial consolidation and reporting features',
      color: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-100',
      iconColor: 'text-blue-600',
      features: [
        {
          name: 'Dashboard',
          description: 'Financial overview and insights with real-time metrics',
          icon: BarChart3,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/dashboard'
        },
        {
          name: 'Consolidation',
          description: 'Multi-entity consolidation with elimination entries',
          icon: LinkIcon,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/consolidation'
        },
        {
          name: 'Financial Statements',
          description: 'P&L, Balance Sheet & Cash Flow generation',
          icon: TrendingUp,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/financial-statements'
        },
        {
          name: 'IFRS Templates',
          description: 'IFRS standards library and compliance templates',
          icon: FileText,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/ifrs-templates'
        }
      ]
    },
    {
      name: 'Data Processing & Management',
      description: 'Advanced data processing, validation, and management tools',
      color: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-100',
      iconColor: 'text-orange-600',
      features: [
        {
          name: 'Process Module',
          description: 'Data processing & validation with AI-powered workflows',
          icon: Settings,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/process'
        },
        {
          name: 'Amounts Edit',
          description: 'Edit financial amounts with audit trail',
          icon: Edit3,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/amounts-edit'
        },
        {
          name: 'Asset Register',
          description: 'Fixed asset management and depreciation tracking',
          icon: Building2,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/asset-register'
        },
        {
          name: 'Backup & Restore',
          description: 'Data backup & recovery with encryption',
          icon: HardDrive,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/backup-restore'
        }
      ]
    },
    {
      name: 'Audit & Compliance',
      description: 'Comprehensive audit and compliance management',
      color: 'from-red-50 to-pink-50',
      borderColor: 'border-red-100',
      iconColor: 'text-red-600',
      features: [
        {
          name: 'Audit Materiality',
          description: 'Audit thresholds & materiality calculations',
          icon: Eye,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/audit-materiality'
        },
        {
          name: 'Audit',
          description: 'Audit working papers and documentation',
          icon: FileSpreadsheet,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/audit'
        },
        {
          name: 'Audit Trail',
          description: 'Track all system changes and modifications',
          icon: Activity,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/audit-trail'
        }
      ]
    },
    {
      name: 'Transaction Management',
      description: 'Complete transaction lifecycle management',
      color: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-100',
      iconColor: 'text-green-600',
      features: [
        {
          name: 'Bills',
          description: 'Bill management & tracking system',
          icon: Receipt,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/bills'
        },
        {
          name: 'Bank Reconciliation',
          description: 'Bank statement reconciliation tools',
          icon: Calculator,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/bank-reconciliation'
        },
        {
          name: 'Forecast & Budget',
          description: 'Budgeting & forecasting capabilities',
          icon: TrendingUp,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/forecast-budget'
        }
      ]
    },
    {
      name: 'Advanced Features',
      description: 'Specialized financial and operational features',
      color: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-100',
      iconColor: 'text-purple-600',
      features: [
        {
          name: 'FST Items',
          description: 'Financial Statement Template management',
          icon: Layers,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/fst-items'
        },
        {
          name: 'Forex Rate Management',
          description: 'Exchange rate management and conversion',
          icon: Globe,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/forex-rates'
        },
        {
          name: 'Entity Management',
          description: 'Manage business entities and subsidiaries',
          icon: Building2,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/entities'
        },
        {
          name: 'Account Management',
          description: 'Chart of accounts management',
          icon: BookOpen,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/accounts'
        },
        {
          name: 'Journal Entries',
          description: 'Manual journal entries with approval workflow',
          icon: FileText,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/journal-entries'
        },
        {
          name: 'Trial Balance',
          description: 'Trial balance reports and analysis',
          icon: Clipboard,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/trial-balance'
        }
      ]
    },
    {
      name: 'Reporting & Analytics',
      description: 'Advanced financial reporting and analytical tools',
      color: 'from-indigo-50 to-blue-50',
      borderColor: 'border-indigo-100',
      iconColor: 'text-indigo-600',
      features: [
        {
          name: 'Financial Ratios',
          description: 'Financial ratio analysis and benchmarking',
          icon: BarChart,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/financial-ratios'
        },
        {
          name: 'Cash Flow Analysis',
          description: 'Cash flow statements and analysis',
          icon: TrendingUp,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/cash-flow'
        },
        {
          name: 'Variance Analysis',
          description: 'Budget vs actual analysis and reporting',
          icon: TrendingUp,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/variance-analysis'
        }
      ]
    },
    {
      name: 'Compliance & Regulatory',
      description: 'Regulatory compliance and reporting features',
      color: 'from-yellow-50 to-amber-50',
      borderColor: 'border-yellow-100',
      iconColor: 'text-yellow-600',
      features: [
        {
          name: 'Tax Management',
          description: 'Tax calculations & filing support',
          icon: Calculator,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/tax-management'
        },
        {
          name: 'Regulatory Reporting',
          description: 'Regulatory compliance reporting',
          icon: FileText,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/regulatory-reporting'
        },
        {
          name: 'Internal Controls',
          description: 'Internal control framework management',
          icon: Shield,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/internal-controls'
        }
      ]
    },
    {
      name: 'System & Administration',
      description: 'System administration and user management',
      color: 'from-gray-50 to-slate-50',
      borderColor: 'border-gray-100',
      iconColor: 'text-gray-600',
      features: [
        {
          name: 'User Management',
          description: 'Manage system users and access',
          icon: Users,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/user-management'
        },
        {
          name: 'Role Management',
          description: 'User roles & permissions management',
          icon: Lock,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/role-management'
        },
        {
          name: 'System Settings',
          description: 'System configuration and preferences',
          icon: Cog,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/settings'
        },
        {
          name: 'System Monitoring',
          description: 'System health & performance monitoring',
          icon: Monitor,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/system-monitoring'
        },
        {
          name: 'API Management',
          description: 'API endpoints & documentation',
          icon: Server,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/api-management'
        },
        {
          name: 'Database Management',
          description: 'Database administration and maintenance',
          icon: Database,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/database-management'
        }
      ]
    },
    {
      name: 'Integration & Connectivity',
      description: 'External system integration and data connectivity',
      color: 'from-teal-50 to-cyan-50',
      borderColor: 'border-teal-100',
      iconColor: 'text-teal-600',
      features: [
        {
          name: 'Data Import/Export',
          description: 'Data import & export tools',
          icon: Upload,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/data-import-export'
        },
        {
          name: 'Third Party Integrations',
          description: 'External system integrations',
          icon: Network,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/integrations'
        },
        {
          name: 'API Integrations',
          description: 'API-based integrations and connectivity',
          icon: Wifi,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/api-integrations'
        }
      ]
    },
    {
      name: 'Help & Support',
      description: 'User support and documentation resources',
      color: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-100',
      iconColor: 'text-pink-600',
      features: [
        {
          name: 'Documentation',
          description: 'User guides & documentation',
          icon: BookOpen,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/documentation'
        },
        {
          name: 'Support Center',
          description: 'Technical support & help desk',
          icon: HelpCircle,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/support'
        },
        {
          name: 'Training Materials',
          description: 'Training videos & materials',
          icon: Video,
          status: 'Complete',
          statusColor: 'bg-green-100 text-green-800',
          href: '/training'
        }
      ]
    }
  ]

  const totalFeatures = featureCategories.reduce((sum, category) => sum + category.features.length, 0)
  const completedFeatures = featureCategories.reduce((sum, category) => 
    sum + category.features.filter(f => f.status === 'Complete').length, 0
  )

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center mb-4">
            <Star className="h-10 w-10 mr-4 text-indigo-600" />
            IFRS Consolidation Tool - Features Overview
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive financial consolidation and reporting platform with {totalFeatures} features designed for IFRS compliance, 
            multi-entity management, and advanced financial analytics.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm">
              <div className="text-3xl font-bold text-indigo-600">{totalFeatures}</div>
              <div className="text-sm text-gray-600">Total Features</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
              <div className="text-3xl font-bold text-green-600">{completedFeatures}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm">
              <div className="text-3xl font-bold text-purple-600">{featureCategories.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Categories */}
      <div className="space-y-8">
        {featureCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className={`bg-gradient-to-r ${category.color} rounded-2xl p-6 border ${category.borderColor}`}>
            <div className="flex items-center mb-6">
              <div className={`p-3 bg-white rounded-xl shadow-sm ${category.borderColor}`}>
                <category.icon className={`h-8 w-8 ${category.iconColor}`} />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                <p className="text-gray-600">{category.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.features.map((feature, featureIndex) => {
                const IconComponent = feature.icon
                return (
                  <div key={featureIndex} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <IconComponent className="h-5 w-5 text-gray-600 mr-2" />
                        <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${feature.statusColor}`}>
                        {feature.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                    <a 
                      href={feature.href}
                      className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View Feature
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Summary</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-6">
            This IFRS Consolidation Tool provides a comprehensive solution for financial professionals, 
            auditors, and compliance officers. It combines advanced financial management capabilities with 
            robust audit trails, regulatory compliance features, and modern user experience design.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-green-100">
              <div className="text-2xl font-bold text-green-600">IFRS Compliant</div>
              <div className="text-sm text-gray-600">Built for international standards</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-green-100">
              <div className="text-2xl font-bold text-green-600">Multi-Entity</div>
              <div className="text-sm text-gray-600">Support for complex structures</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-green-100">
              <div className="text-2xl font-bold text-green-600">Audit Ready</div>
              <div className="text-sm text-gray-600">Complete audit trail</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-green-100">
              <div className="text-2xl font-bold text-green-600">Cloud Ready</div>
              <div className="text-sm text-gray-600">Modern architecture</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeaturesOverview
