import React from 'react';
import { Users, Activity, Clock, AlertTriangle, UserCog, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DashboardStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: '+12',
      changeType: 'increase',
      icon: Users,
      color: 'primary'
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions,
      change: '+8',
      changeType: 'increase',
      icon: Activity,
      color: 'success'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      change: '-3',
      changeType: 'decrease',
      icon: Clock,
      color: 'warning'
    },
    {
      title: 'Security Alerts',
      value: stats.securityAlerts,
      change: '+2',
      changeType: 'increase',
      icon: AlertTriangle,
      color: 'error'
    },
    {
      title: 'Role Assignments',
      value: stats.roleAssignments,
      change: '+15',
      changeType: 'increase',
      icon: UserCog,
      color: 'secondary'
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'primary': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'success': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'error': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'secondary': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
      case 'accent': return 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'increase': return 'text-green-600 dark:text-green-400';
      case 'decrease': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'increase': return TrendingUp;
      case 'decrease': return TrendingDown;
      default: return Minus;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        const ChangeIcon = getChangeIcon(stat.changeType);
        
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(stat.color)}`}>
                <IconComponent size={24} />
              </div>
              <div className="flex items-center space-x-1">
                <ChangeIcon 
                  size={16} 
                  className={getChangeColor(stat.changeType)}
                />
                <span className={`text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                  {stat.change}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{stat.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
