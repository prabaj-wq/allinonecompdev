import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ActivityFeed = ({ activities }) => {
  const [filter, setFilter] = useState('all');

  const filterOptions = [
  { value: 'all', label: 'All Activities', icon: 'Activity' },
  { value: 'login', label: 'Logins', icon: 'LogIn' },
  { value: 'permission', label: 'Permissions', icon: 'Shield' },
  { value: 'role', label: 'Role Changes', icon: 'UserCog' },
  { value: 'security', label: 'Security', icon: 'AlertTriangle' }];


  const filteredActivities = activities.filter((activity) =>
  filter === 'all' || activity.type === filter
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login':return 'LogIn';
      case 'logout':return 'LogOut';
      case 'permission':return 'Shield';
      case 'role':return 'UserCog';
      case 'security':return 'AlertTriangle';
      case 'system':return 'Settings';
      default:return 'Activity';
    }
  };

  const getActivityColor = (type, severity) => {
    if (severity === 'high') return 'text-error';
    if (severity === 'medium') return 'text-warning';

    switch (type) {
      case 'login':return 'text-success';
      case 'logout':return 'text-muted-foreground';
      case 'permission':return 'text-primary';
      case 'role':return 'text-secondary';
      case 'security':return 'text-error';
      case 'system':return 'text-accent';
      default:return 'text-muted-foreground';
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
    <div className="glass-container rounded-xl border border-border/50">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <Button variant="outline" size="sm" iconName="RefreshCw">
            Refresh
          </Button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          {filterOptions.map((option) =>
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            filter === option.value ?
            'text-primary bg-primary/10 border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`
            }>

              <Icon name={option.icon} size={16} />
              <span>{option.label}</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filteredActivities.length > 0 ?
        <div className="p-6 space-y-4">
            {filteredActivities.map((activity) =>
          <div
            key={activity.id}
            className="flex items-start space-x-4 p-4 rounded-lg hover:bg-white/5 transition-colors">

                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-background border border-border/50 ${getActivityColor(activity.type, activity.severity)}`}>
                  <Icon name={getActivityIcon(activity.type)} size={18} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.user}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {activity.description}
                  </p>
                  
                  {activity.details &&
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      {activity.details.ip &&
                <span className="flex items-center space-x-1">
                          <Icon name="Globe" size={12} />
                          <span>{activity.details.ip}</span>
                        </span>
                }
                      {activity.details.location &&
                <span className="flex items-center space-x-1">
                          <Icon name="MapPin" size={12} />
                          <span>{activity.details.location}</span>
                        </span>
                }
                      {activity.details.device &&
                <span className="flex items-center space-x-1 text-[rgba(118,57,142,1)]">
                          <Icon name="Monitor" size={12} />
                          <span>{activity.details.device}</span>
                        </span>
                }
                    </div>
              }
                  
                  {activity.severity === 'high' &&
              <div className="mt-2 flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-error/10 text-error border border-error/20">
                        High Risk
                      </span>
                      <Button variant="outline" size="xs">
                        Review
                      </Button>
                    </div>
              }
                </div>
              </div>
          )}
          </div> :

        <div className="p-12 text-center">
            <Icon name="Activity" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No activities found</h4>
            <p className="text-muted-foreground">
              No activities match the selected filter
            </p>
          </div>
        }
      </div>

      {filteredActivities.length > 0 &&
      <div className="p-4 border-t border-border/50 text-center">
          <Button variant="ghost" size="sm" iconName="MoreHorizontal">
            View All Activities
          </Button>
        </div>
      }
    </div>);

};

export default ActivityFeed;