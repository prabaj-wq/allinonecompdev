import React, { useState } from 'react';
import { 
  Activity, LogIn, LogOut, Shield, UserCog, AlertTriangle, Settings, 
  RefreshCw, Globe, MapPin, Monitor, MoreHorizontal 
} from 'lucide-react';
import Button from './ui/Button';

const ActivityFeed = ({ activities }) => {
  const [filter, setFilter] = useState('all');

  const filterOptions = [
    { value: 'all', label: 'All Activities', icon: Activity },
    { value: 'login', label: 'Logins', icon: LogIn },
    { value: 'permission', label: 'Permissions', icon: Shield },
    { value: 'role', label: 'Role Changes', icon: UserCog },
    { value: 'security', label: 'Security', icon: AlertTriangle }
  ];

  const filteredActivities = activities.filter((activity) =>
    filter === 'all' || activity.type === filter
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return LogIn;
      case 'logout': return LogOut;
      case 'permission': return Shield;
      case 'role': return UserCog;
      case 'security': return AlertTriangle;
    }
  };

  const getActivityColor = (type, severity) => {
    if (severity === 'high') return 'text-red-600 dark:text-red-400';
    if (severity === 'medium') return 'text-yellow-600 dark:text-yellow-400';
    
    switch (type) {
      case 'login': return 'text-green-600 dark:text-green-400';
      case 'logout': return 'text-blue-600 dark:text-blue-400';
      case 'permission': return 'text-purple-600 dark:text-purple-400';
      case 'security': return 'text-red-600 dark:text-red-400';
      case 'system': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return activityTime.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Feed</h3>
          </div>
          <button className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {filteredActivities.length > 0 ? (
          <div className="p-6 space-y-4">
            {filteredActivities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 ${getActivityColor(activity.type, activity.severity)}`}>
                    <ActivityIcon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{activity.description}</p>
                    {activity.details && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        {activity.details.user && (
                          <div>User: {activity.details.user}</div>
                        )}
                        {activity.details.location && (
                          <div>Location: {activity.details.location}</div>
                        )}
                        {activity.details.device && (
                          <span className="flex items-center space-x-1">
                            <Monitor size={12} />
                            <span>{activity.details.device}</span>
                          </span>
                        )}
                      </div>
                    )}
                    
                    {activity.severity === 'high' && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                          High Risk
                        </span>
                        <button className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded border border-gray-200 dark:border-gray-600 transition-colors">
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Activity size={48} className="text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activities found</h4>
            <p className="text-gray-600 dark:text-gray-300">
              No activities match the selected filter
            </p>
          </div>
        )}
      </div>

      {filteredActivities.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
            <Eye className="h-4 w-4" />
            <span>View All Activities</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
