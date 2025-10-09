import React from 'react';
import Icon from '../../../components/AppIcon';

const DashboardStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: '+12',
      changeType: 'increase',
      icon: 'Users',
      color: 'primary'
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions,
      change: '+8',
      changeType: 'increase',
      icon: 'Activity',
      color: 'success'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      change: '-3',
      changeType: 'decrease',
      icon: 'Clock',
      color: 'warning'
    },
    {
      title: 'Security Alerts',
      value: stats.securityAlerts,
      change: '+2',
      changeType: 'increase',
      icon: 'AlertTriangle',
      color: 'error'
    },
    {
      title: 'Role Assignments',
      value: stats.roleAssignments,
      change: '+15',
      changeType: 'increase',
      icon: 'UserCog',
      color: 'secondary'
    },
    {
      title: 'System Integrations',
      value: stats.systemIntegrations,
      change: '0',
      changeType: 'neutral',
      icon: 'Zap',
      color: 'accent'
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'primary': return 'text-primary bg-primary/10 border-primary/20';
      case 'success': return 'text-success bg-success/10 border-success/20';
      case 'warning': return 'text-warning bg-warning/10 border-warning/20';
      case 'error': return 'text-error bg-error/10 border-error/20';
      case 'secondary': return 'text-secondary bg-secondary/10 border-secondary/20';
      case 'accent': return 'text-accent bg-accent/10 border-accent/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'increase': return 'text-success';
      case 'decrease': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'increase': return 'TrendingUp';
      case 'decrease': return 'TrendingDown';
      default: return 'Minus';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="glass-container rounded-xl border border-border/50 p-6 hover:shadow-glass-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${getColorClasses(stat.color)}`}>
              <Icon name={stat.icon} size={24} />
            </div>
            <div className="flex items-center space-x-1">
              <Icon 
                name={getChangeIcon(stat.changeType)} 
                size={16} 
                className={getChangeColor(stat.changeType)}
              />
              <span className={`text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                {stat.change}
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </h3>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;