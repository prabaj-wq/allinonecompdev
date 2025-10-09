import React from 'react'
import { Settings, Eye, TrendingUp, Users, Globe, DollarSign } from 'lucide-react'

const SummaryCard = ({ 
  title, 
  icon: Icon, 
  data, 
  onSettingsClick, 
  onViewClick, 
  onDoubleClick,
  onItemClick,
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      accent: 'bg-blue-100 dark:bg-blue-800'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      accent: 'bg-green-100 dark:bg-green-800'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
      accent: 'bg-purple-100 dark:bg-purple-800'
    }
  }

  const colors = colorClasses[color]

  return (
    <div 
      className={`${colors.bg} ${colors.border} border rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer`}
      onDoubleClick={onDoubleClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`${colors.accent} p-2 rounded-lg mr-3`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Summary overview</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={onViewClick}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.total}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{data.active}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
        </div>
      </div>

      {/* Items List - Only show if items are provided */}
      {data.items && data.items.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.items.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 cursor-pointer transition-colors"
                onClick={() => onItemClick && onItemClick(item)}
              >
                <div className="flex items-center">
                  <span className="text-gray-700 dark:text-gray-300 mr-2">
                    {item.icon}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {item.label}
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-3 w-3 mr-1" />
            {data.active > 0 ? `${Math.round((data.active / data.total) * 100)}% active` : '0% active'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummaryCard
