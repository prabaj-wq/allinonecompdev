import React from 'react';
import Icon from '../../../components/AppIcon';

const ComplianceMetrics = () => {
  const complianceMetrics = [
    {
      id: 'sox',
      title: 'SOX Compliance',
      score: 94,
      status: 'healthy',
      violations: 3,
      lastAudit: '2025-07-25',
      trend: 'up',
      description: 'Sarbanes-Oxley financial controls compliance'
    },
    {
      id: 'gdpr',
      title: 'GDPR Data Access',
      score: 87,
      status: 'warning',
      violations: 12,
      lastAudit: '2025-07-24',
      trend: 'down',
      description: 'General Data Protection Regulation compliance'
    },
    {
      id: 'hipaa',
      title: 'HIPAA Permissions',
      score: 98,
      status: 'healthy',
      violations: 1,
      lastAudit: '2025-07-26',
      trend: 'up',
      description: 'Health Insurance Portability and Accountability Act'
    },
    {
      id: 'custom',
      title: 'Custom Framework',
      score: 76,
      status: 'error',
      violations: 24,
      lastAudit: '2025-07-23',
      trend: 'stable',
      description: 'Organization-specific compliance requirements'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'healthy': return 'bg-success/10 border-success/20';
      case 'warning': return 'bg-warning/10 border-warning/20';
      case 'error': return 'bg-error/10 border-error/20';
      default: return 'bg-muted/10 border-muted/20';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return 'TrendingUp';
      case 'down': return 'TrendingDown';
      case 'stable': return 'Minus';
      default: return 'Minus';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-error';
      case 'stable': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {complianceMetrics.map((metric) => (
        <div key={metric.id} className={`glass-container p-6 border ${getStatusBg(metric.status)} hover:scale-105 transition-all duration-200`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg ${getStatusBg(metric.status)} flex items-center justify-center`}>
                <Icon name="Shield" size={20} className={getStatusColor(metric.status)} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{metric.title}</h3>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
            </div>
            <Icon 
              name={getTrendIcon(metric.trend)} 
              size={16} 
              className={getTrendColor(metric.trend)} 
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">{metric.score}%</span>
              <span className={`text-sm font-medium ${getStatusColor(metric.status)} capitalize`}>
                {metric.status}
              </span>
            </div>

            <div className="w-full bg-muted/20 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  metric.status === 'healthy' ? 'bg-success' :
                  metric.status === 'warning' ? 'bg-warning' : 'bg-error'
                }`}
                style={{ width: `${metric.score}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {metric.violations} violations
              </span>
              <span className="text-muted-foreground">
                Last: {new Date(metric.lastAudit).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ComplianceMetrics;