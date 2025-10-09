import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import ComplianceMetrics from './ComplianceMetrics';
import ViolationsList from './ViolationsList';
import AuditReports from './AuditReports';

const ComplianceTabs = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'BarChart3',
    component: ComplianceMetrics,
    description: 'Compliance metrics and status overview'
  },
  {
    id: 'violations',
    label: 'Violations',
    icon: 'AlertTriangle',
    component: ViolationsList,
    description: 'Policy violations and remediation actions',
    badge: 5
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'FileText',
    component: AuditReports,
    description: 'Generated audit reports and documentation'
  },
  {
    id: 'trends',
    label: 'Trends',
    icon: 'TrendingUp',
    component: () => <TrendsAnalysis />,
    description: 'Historical compliance trends and analytics'
  }];


  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || ComplianceMetrics;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="glass-container p-1 border border-border/50">
        <div className="flex items-center space-x-1">
          {tabs.map((tab) =>
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
            activeTab === tab.id ?
            'bg-primary text-primary-foreground shadow-md' :
            'text-muted-foreground hover:text-foreground hover:bg-white/5'}`
            }>

              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
              {tab.badge &&
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
            }
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px] mb-[-170px]">
        <ActiveComponent />
      </div>
    </div>);

};

// Trends Analysis Component
const TrendsAnalysis = () => {
  const trendData = [
  {
    framework: 'SOX',
    currentScore: 94,
    previousScore: 89,
    trend: 'up',
    monthlyData: [85, 87, 89, 91, 92, 94]
  },
  {
    framework: 'GDPR',
    currentScore: 87,
    previousScore: 92,
    trend: 'down',
    monthlyData: [92, 91, 90, 89, 88, 87]
  },
  {
    framework: 'HIPAA',
    currentScore: 98,
    previousScore: 96,
    trend: 'up',
    monthlyData: [94, 95, 96, 97, 97, 98]
  },
  {
    framework: 'Custom',
    currentScore: 76,
    previousScore: 76,
    trend: 'stable',
    monthlyData: [74, 75, 76, 76, 76, 76]
  }];


  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':return 'text-success';
      case 'down':return 'text-error';
      case 'stable':return 'text-muted-foreground';
      default:return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':return 'TrendingUp';
      case 'down':return 'TrendingDown';
      case 'stable':return 'Minus';
      default:return 'Minus';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Icon name="TrendingUp" size={20} className="text-primary" />
          <span>Compliance Trends</span>
        </h3>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="Calendar" size={16} />
          <span>Last 6 months</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trendData.map((item) =>
        <div key={item.framework} className="glass-container p-6 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-foreground">{item.framework}</h4>
              <div className="flex items-center space-x-2">
                <Icon
                name={getTrendIcon(item.trend)}
                size={16}
                className={getTrendColor(item.trend)} />

                <span className={`text-sm font-medium ${getTrendColor(item.trend)}`}>
                  {item.currentScore - item.previousScore > 0 ? '+' : ''}
                  {item.currentScore - item.previousScore}%
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">{item.currentScore}%</span>
                <span className="text-sm text-muted-foreground">Current Score</span>
              </div>

              <div className="w-full bg-muted/20 rounded-full h-2">
                <div
                className={`h-2 rounded-full transition-all duration-300 ${
                item.currentScore >= 90 ? 'bg-success' :
                item.currentScore >= 70 ? 'bg-warning' : 'bg-error'}`
                }
                style={{ width: `${item.currentScore}%` }} />

              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>6 months ago: {item.monthlyData[0]}%</span>
                <span>Current: {item.currentScore}%</span>
              </div>

              {/* Mini Chart Visualization */}
              <div className="flex items-end space-x-1 h-16">
                {item.monthlyData.map((value, index) =>
              <div
                key={index}
                className="flex-1 bg-primary/30 rounded-t"
                style={{ height: `${value / 100 * 100}%` }}
                title={`Month ${index + 1}: ${value}%`} />

              )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="glass-container p-6 border border-border/50">
        <h4 className="text-lg font-semibold text-foreground mb-4">Trend Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-success mb-1">2</div>
            <div className="text-sm text-muted-foreground">Improving Frameworks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-error mb-1">1</div>
            <div className="text-sm text-muted-foreground">Declining Frameworks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground mb-1">1</div>
            <div className="text-sm text-muted-foreground">Stable Frameworks</div>
          </div>
        </div>
      </div>
    </div>);

};

export default ComplianceTabs;