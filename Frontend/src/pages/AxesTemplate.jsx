import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  Building2, 
  BookOpen, 
  Users, 
  Globe, 
  Tag,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react'

const AxesTemplate = () => {
  const navigate = useNavigate()
  const [hoveredCard, setHoveredCard] = useState(null)

  const dimensionTypes = [
    {
      id: 'entity',
      name: 'Entity',
      description: 'Business entities, subsidiaries, and organizational structure',
      icon: Building2,
      href: '/axes/entity',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-300',
      badge: 'Live',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    },
    {
      id: 'account',
      name: 'Account',
      description: 'Chart of accounts and financial categorization',
      icon: BookOpen,
      href: '/axes/account',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-300',
      badge: 'Coming Soon',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    },
    {
      id: 'user',
      name: 'User',
      description: 'User management and role-based access control',
      icon: Users,
      href: '/axes/user',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-700 dark:text-purple-300',
      badge: 'Coming Soon',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    },
    {
      id: 'location',
      name: 'Location',
      description: 'Geographic locations and regional management',
      icon: Globe,
      href: '/axes/location',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      borderColor: 'border-teal-200 dark:border-teal-800',
      textColor: 'text-teal-700 dark:text-teal-300',
      badge: 'Coming Soon',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    },
    {
      id: 'product',
      name: 'Product',
      description: 'Product catalog and inventory management',
      icon: Tag,
      href: '/axes/product',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-700 dark:text-orange-300',
      badge: 'Coming Soon',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    }
  ]

  const handleCardClick = (dimension) => {
    if (dimension.badge === 'Live') {
      navigate(dimension.href)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Universal Dimensions Template
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Create and manage hierarchical dimensions with customizable elements, 
            advanced filtering, and powerful export capabilities. Perfect for entities, 
            accounts, users, and any structured data.
          </p>
        </div>

        {/* Features Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-12 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Template Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl w-fit mx-auto mb-3">
                <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Hierarchy Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Multi-level hierarchies with drag-and-drop support</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl w-fit mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Custom Fields</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Add custom columns with validation and SQL queries</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl w-fit mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Export & Import</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Excel export with tree structure and bulk operations</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl w-fit mx-auto mb-3">
                <ArrowRight className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Audit Trail</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Complete versioning and change tracking</p>
            </div>
          </div>
        </div>

        {/* Dimension Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dimensionTypes.map((dimension) => {
            const IconComponent = dimension.icon
            const isHovered = hoveredCard === dimension.id
            const isClickable = dimension.badge === 'Live'
            
            return (
              <div
                key={dimension.id}
                className={`relative group cursor-pointer transition-all duration-300 transform ${
                  isClickable 
                    ? 'hover:scale-105 hover:-translate-y-2' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onMouseEnter={() => setHoveredCard(dimension.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardClick(dimension)}
              >
                <div className={`${dimension.bgColor} ${dimension.borderColor} border-2 rounded-2xl p-8 h-full transition-all duration-300 ${
                  isHovered && isClickable ? 'shadow-2xl' : 'shadow-lg'
                }`}>
                  {/* Badge */}
                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${dimension.badgeColor}`}>
                      {dimension.badge}
                    </div>
                    {isClickable && (
                      <ArrowRight className={`h-5 w-5 ${dimension.textColor} transition-transform duration-300 ${
                        isHovered ? 'translate-x-1' : ''
                      }`} />
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`p-4 bg-gradient-to-r ${dimension.color} rounded-2xl w-fit mb-6 transition-transform duration-300 ${
                    isHovered && isClickable ? 'scale-110' : ''
                  }`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className={`text-2xl font-bold ${dimension.textColor} mb-3`}>
                    {dimension.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {dimension.description}
                  </p>

                  {/* Hover Effect Overlay */}
                  {isClickable && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${dimension.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}></div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Getting Started Section */}
        <div className="mt-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Choose a dimension type above to start creating your hierarchical structure. 
              Each template comes with powerful features for managing complex organizational data.
            </p>
            <button
              onClick={() => navigate('/axes/entity')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Start with Entity Management
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AxesTemplate
