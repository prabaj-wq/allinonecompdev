import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const IntegrationStatus = () => {
  const [refreshing, setRefreshing] = useState(false);

  const integrations = [
    {
      id: 'financial',
      name: 'Financial Systems',
      type: 'ERP',
      status: 'connected',
      lastSync: '2025-07-28T06:45:00Z',
      syncFrequency: 'Every 15 minutes',
      recordCount: 15420,
      errorCount: 0,
      uptime: 99.8,
      description: 'SAP ERP financial modules integration for SOX compliance monitoring'
    },
    {
      id: 'hr',
      name: 'HR Platform',
      type: 'HRIS',
      status: 'connected',
      lastSync: '2025-07-28T07:00:00Z',
      syncFrequency: 'Every 30 minutes',
      recordCount: 8750,
      errorCount: 2,
      uptime: 99.5,
      description: 'Workday HRIS integration for employee access lifecycle management'
    },
    {
      id: 'regulatory',
      name: 'Regulatory Database',
      type: 'Compliance',
      status: 'warning',
      lastSync: '2025-07-28T05:30:00Z',
      syncFrequency: 'Daily',
      recordCount: 2340,
      errorCount: 5,
      uptime: 97.2,
      description: 'External regulatory requirements database for compliance framework updates'
    },
    {
      id: 'ldap',
      name: 'Active Directory',
      type: 'Identity',
      status: 'connected',
      lastSync: '2025-07-28T07:10:00Z',
      syncFrequency: 'Real-time',
      recordCount: 12680,
      errorCount: 0,
      uptime: 99.9,
      description: 'Microsoft Active Directory for user authentication and group membership'
    },
    {
      id: 'audit',
      name: 'Audit Trail System',
      type: 'Logging',
      status: 'error',
      lastSync: '2025-07-27T23:45:00Z',
      syncFrequency: 'Continuous',
      recordCount: 0,
      errorCount: 15,
      uptime: 85.3,
      description: 'Centralized audit logging system for compliance evidence collection'
    },
    {
      id: 'cloud',
      name: 'Cloud Services',
      type: 'Infrastructure',
      status: 'connected',
      lastSync: '2025-07-28T07:05:00Z',
      syncFrequency: 'Every 5 minutes',
      recordCount: 45230,
      errorCount: 1,
      uptime: 99.7,
      description: 'AWS/Azure cloud infrastructure monitoring for access control compliance'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-success bg-success/10 border-success/20';
      case 'warning': return 'text-warning bg-warning/10 border-warning/20';
      case 'error': return 'text-error bg-error/10 border-error/20';
      case 'disconnected': return 'text-muted-foreground bg-muted/10 border-muted/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return 'CheckCircle';
      case 'warning': return 'AlertTriangle';
      case 'error': return 'XCircle';
      case 'disconnected': return 'Circle';
      default: return 'Circle';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ERP': return 'Building';
      case 'HRIS': return 'Users';
      case 'Compliance': return 'Shield';
      case 'Identity': return 'Key';
      case 'Logging': return 'FileText';
      case 'Infrastructure': return 'Cloud';
      default: return 'Server';
    }
  };

  const formatLastSync = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Mock refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleTestConnection = (integration) => {
    console.log(`Testing connection for ${integration.name}`);
  };

  const handleViewLogs = (integration) => {
    console.log(`Viewing logs for ${integration.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Icon name="Zap" size={20} className="text-primary" />
          <span>System Integrations</span>
          <span className="text-sm text-muted-foreground">({integrations.length})</span>
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            iconName="RefreshCw"
            iconPosition="left"
          >
            Refresh Status
          </Button>
          <Button variant="outline" size="sm" iconName="Settings" iconPosition="left">
            Configure
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div key={integration.id} className="glass-container p-4 border border-border/50 hover:scale-105 transition-all duration-200">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon name={getTypeIcon(integration.type)} size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{integration.name}</h4>
                    <p className="text-xs text-muted-foreground">{integration.type}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center space-x-1 ${getStatusColor(integration.status)}`}>
                  <Icon name={getStatusIcon(integration.status)} size={12} />
                  <span className="capitalize">{integration.status}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground">{integration.description}</p>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Records</div>
                  <div className="text-sm font-semibold text-foreground">
                    {integration.recordCount.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Uptime</div>
                  <div className="text-sm font-semibold text-foreground">{integration.uptime}%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Errors</div>
                  <div className={`text-sm font-semibold ${integration.errorCount > 0 ? 'text-error' : 'text-success'}`}>
                    {integration.errorCount}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Last Sync</div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatLastSync(integration.lastSync)}
                  </div>
                </div>
              </div>

              {/* Sync Frequency */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Sync: {integration.syncFrequency}</span>
                {integration.status === 'connected' && (
                  <div className="flex items-center space-x-1 text-success">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span>Active</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTestConnection(integration)}
                  className="flex-1 text-xs"
                  iconName="Zap"
                  iconPosition="left"
                >
                  Test
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewLogs(integration)}
                  className="flex-1 text-xs"
                  iconName="FileText"
                  iconPosition="left"
                >
                  Logs
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="glass-container p-6 border border-border/50">
        <h4 className="text-lg font-semibold text-foreground mb-4">Integration Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-success mb-1">
              {integrations.filter(i => i.status === 'connected').length}
            </div>
            <div className="text-sm text-muted-foreground">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning mb-1">
              {integrations.filter(i => i.status === 'warning').length}
            </div>
            <div className="text-sm text-muted-foreground">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-error mb-1">
              {integrations.filter(i => i.status === 'error').length}
            </div>
            <div className="text-sm text-muted-foreground">Error</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground mb-1">
              {integrations.reduce((sum, i) => sum + i.recordCount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Records</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationStatus;