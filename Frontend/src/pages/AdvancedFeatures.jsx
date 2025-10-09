import React, { useState } from 'react'
import { 
  BarChart3, 
  Database, 
  FileText, 
  TrendingUp, 
  Users, 
  Settings, 
  Zap, 
  Globe, 
  Shield, 
  Workflow,
  Eye,
  Play,
  ArrowRight,
  Star,
  CheckCircle,
  Sparkles,
  Layers,
  PieChart,
  LineChart,
  Activity,
  Target,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Upload,
  Filter,
  Search,
  Plus,
  Grid,
  Table,
  Calendar,
  DollarSign,
  Percent,
  Calculator,
  BookOpen,
  Lightbulb,
  Rocket,
  Clock,
  X
} from 'lucide-react'

const AdvancedFeatures = () => {
  const [selectedFeature, setSelectedFeature] = useState(null)

  const advancedFeatures = [
    {
      id: 'enterprise-reporting',
      title: 'Enterprise Reporting Engine',
      description: 'Advanced financial reporting with real-time data integration, nested hierarchies, and enterprise-grade features',
      icon: BarChart3,
      color: 'blue',
      features: [
        'Real-time PostgreSQL data integration',
        'Nested hierarchical data display',
        'Advanced formula engine with HyperFormula',
        'Drag-and-drop report building',
        'Multi-currency support',
        'Consolidation and elimination rules',
        'Variance analysis and KPI tracking',
        'Professional formatting and styling',
        'Import/Export in multiple formats',
        'Audit trail and compliance features'
      ],
      status: 'completed',
      component: 'AdvancedReportDesigner'
    },
    {
      id: 'data-modeling',
      title: 'Enterprise Data Modeling',
      description: 'Sophisticated data modeling engine for complex financial structures and relationships',
      icon: Database,
      color: 'green',
      features: [
        'Multi-dimensional data modeling',
        'Entity relationship mapping',
        'Custom field definitions',
        'Data validation and integrity',
        'Schema versioning',
        'Performance optimization',
        'Data lineage tracking',
        'Automated data quality checks'
      ],
      status: 'in-progress',
      component: 'EnterpriseDataModeling'
    },
    {
      id: 'consolidation-engine',
      title: 'Advanced Consolidation Engine',
      description: 'Enterprise-grade consolidation with elimination rules, intercompany transactions, and multi-entity support',
      icon: Layers,
      color: 'purple',
      features: [
        'Multi-entity consolidation',
        'Automatic elimination entries',
        'Intercompany transaction matching',
        'Currency translation',
        'Consolidation adjustments',
        'Minority interest calculations',
        'Step-by-step consolidation',
        'Consolidation reporting'
      ],
      status: 'pending',
      component: 'ConsolidationEngine'
    },
    {
      id: 'workflow-management',
      title: 'Workflow & Approval Management',
      description: 'Sophisticated workflow engine with approval processes, notifications, and task management',
      icon: Workflow,
      color: 'orange',
      features: [
        'Custom workflow designer',
        'Multi-level approval processes',
        'Task assignment and tracking',
        'Email notifications',
        'Deadline management',
        'Escalation rules',
        'Audit trail',
        'Mobile notifications'
      ],
      status: 'pending',
      component: 'WorkflowManagement'
    },
    {
      id: 'security-compliance',
      title: 'Security & Compliance',
      description: 'Enterprise-grade security with role-based access, audit trails, and compliance reporting',
      icon: Shield,
      color: 'red',
      features: [
        'Role-based access control',
        'Multi-factor authentication',
        'Data encryption',
        'Audit logging',
        'Compliance reporting',
        'Data privacy controls',
        'Session management',
        'Security monitoring'
      ],
      status: 'pending',
      component: 'SecurityCompliance'
    },
    {
      id: 'analytics-dashboard',
      title: 'Advanced Analytics & Dashboards',
      description: 'Comprehensive analytics with interactive dashboards, KPIs, and business intelligence',
      icon: TrendingUp,
      color: 'indigo',
      features: [
        'Interactive dashboards',
        'Real-time KPI monitoring',
        'Predictive analytics',
        'Data visualization',
        'Custom metrics',
        'Trend analysis',
        'Performance benchmarking',
        'Executive reporting'
      ],
      status: 'pending',
      component: 'AnalyticsDashboard'
    },
    {
      id: 'integration-platform',
      title: 'Integration Platform',
      description: 'Seamless integration with external systems, APIs, and data sources',
      icon: Globe,
      color: 'teal',
      features: [
        'REST API integration',
        'Real-time data sync',
        'ETL processes',
        'Third-party connectors',
        'Data transformation',
        'Error handling',
        'Monitoring and logging',
        'Scalable architecture'
      ],
      status: 'pending',
      component: 'IntegrationPlatform'
    },
    {
      id: 'performance-optimization',
      title: 'Performance Optimization',
      description: 'Advanced performance tuning with caching, indexing, and optimization algorithms',
      icon: Zap,
      color: 'yellow',
      features: [
        'Intelligent caching',
        'Database optimization',
        'Query performance tuning',
        'Load balancing',
        'Auto-scaling',
        'Performance monitoring',
        'Resource optimization',
        'Bottleneck identification'
      ],
      status: 'pending',
      component: 'PerformanceOptimization'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'in-progress': return RefreshCw
      case 'pending': return Clock
      default: return Clock
    }
  }

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      purple: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
      orange: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
      red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      indigo: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
      teal: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
      yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
    }
    return colors[color] || colors.blue
  }

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      indigo: 'text-indigo-600',
      teal: 'text-teal-600',
      yellow: 'text-yellow-600'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Advanced Features Showcase
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Enterprise-grade features for the most advanced financial reporting system
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600 dark:text-gray-400">In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600 dark:text-gray-400">Planned</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advancedFeatures.map((feature) => {
            const IconComponent = feature.icon
            const StatusIcon = getStatusIcon(feature.status)
            
            return (
              <div
                key={feature.id}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${getColorClasses(feature.color)}`}
                onClick={() => setSelectedFeature(feature)}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {feature.status.replace('-', ' ')}
                  </span>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <div className={`p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-fit`}>
                    <IconComponent className={`h-8 w-8 ${getIconColor(feature.color)}`} />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {feature.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-2">
                    {feature.features.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        <span>{item}</span>
                      </div>
                    ))}
                    {feature.features.length > 3 && (
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        +{feature.features.length - 3} more features
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-4">
                    <button className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                      {feature.status === 'completed' ? 'View Feature' : 'Coming Soon'}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}>
                  <selectedFeature.icon className={`h-8 w-8 ${getIconColor(selectedFeature.color)}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {selectedFeature.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedFeature.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedFeature.status)}`}>
                    <StatusIcon className="h-4 w-4 mr-2" />
                    {selectedFeature.status.replace('-', ' ')}
                  </span>
                  {selectedFeature.status === 'completed' && (
                    <span className="text-sm text-green-600 dark:text-green-400">
                      ✓ Ready for production use
                    </span>
                  )}
                </div>

                {/* Features List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Key Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedFeature.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Technical Implementation
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Component:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedFeature.component}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Integration:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">PostgreSQL + React + FastAPI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFeature.status === 'completed' 
                    ? 'This feature is fully implemented and ready to use'
                    : 'This feature is planned for future development'
                  }
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedFeature(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Close
                  </button>
                  {selectedFeature.status === 'completed' && (
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                      <Play className="h-4 w-4 mr-2" />
                      Launch Feature
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedFeatures
