import React from 'react'
import { 
  Building2, 
  BookOpen, 
  Users, 
  Globe,
  ArrowRight,
  Settings,
  BarChart3,
  Layers,
  FileText,
  Calculator
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AxesOverview = () => {
  const navigate = useNavigate()

  const dimensions = [
    {
      id: 'entity',
      name: 'Entity',
      description: 'Manage business entities, subsidiaries, and organizational structure',
      icon: Building2,
      color: 'blue',
      href: '/axes/entity',
      features: ['Hierarchy Management', 'Entity Relationships', 'Custom Fields', 'Audit Trail'],
      stats: { total: 15, active: 12, hierarchies: 3 }
    },
    {
      id: 'accounts',
      name: 'Accounts',
      description: 'Chart of accounts, account hierarchies, and financial classifications',
      icon: BookOpen,
      color: 'green',
      href: '/axes/account',
      features: ['Account Hierarchies', 'IFRS Classifications', 'Custom Fields', 'Reporting'],
      stats: { total: 250, active: 200, hierarchies: 8 }
    },
    {
      id: 'users',
      name: 'Users',
      description: 'User management, roles, permissions, and access control',
      icon: Users,
      color: 'purple',
      href: '/axes/users',
      features: ['Role Management', 'Permissions', 'Access Control', 'User Groups'],
      stats: { total: 45, active: 40, hierarchies: 2 }
    },
    {
      id: 'geography',
      name: 'Geography',
      description: 'Geographic regions, countries, and location-based hierarchies',
      icon: Globe,
      color: 'orange',
      href: '/axes/geography',
      features: ['Regional Hierarchies', 'Country Management', 'Location Data', 'Territory Mapping'],
      stats: { total: 25, active: 20, hierarchies: 4 }
    }
  ]

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      accent: 'bg-blue-100 dark:bg-blue-800',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      accent: 'bg-green-100 dark:bg-green-800',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900/30'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
      accent: 'bg-purple-100 dark:bg-purple-800',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-600 dark:text-orange-400',
      accent: 'bg-orange-100 dark:bg-orange-800',
      hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30'
    }
  }

  const handleDimensionClick = (dimension) => {
    navigate(dimension.href)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Layers className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Axes Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage all dimensions and hierarchies</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="btn-secondary flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Dimensions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dimensions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4">
                <Layers className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hierarchies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dimensions.reduce((sum, d) => sum + d.stats.hierarchies, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Elements</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dimensions.reduce((sum, d) => sum + d.stats.total, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-4">
                <Calculator className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Elements</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dimensions.reduce((sum, d) => sum + d.stats.active, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dimensions.map((dimension) => {
            const colors = colorClasses[dimension.color]
            const IconComponent = dimension.icon
            
            return (
              <div
                key={dimension.id}
                onClick={() => handleDimensionClick(dimension)}
                className={`${colors.bg} ${colors.border} border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${colors.hover}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`${colors.accent} p-3 rounded-lg mr-4`}>
                      <IconComponent className={`h-8 w-8 ${colors.icon}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {dimension.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">
                        {dimension.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dimension.stats.total}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {dimension.stats.active}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {dimension.stats.hierarchies}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Hierarchies</div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Key Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {dimension.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Settings className="h-6 w-6 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">Global Settings</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Configure system-wide settings</div>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <BarChart3 className="h-6 w-6 text-green-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">Reports</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Generate dimension reports</div>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Calculator className="h-6 w-6 text-purple-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">FST Designer</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Design financial statements</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AxesOverview
