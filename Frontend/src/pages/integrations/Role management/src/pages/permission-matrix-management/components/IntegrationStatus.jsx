import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const IntegrationStatus = () => {
  const [integrations, setIntegrations] = useState([
    {
      id: 'active-directory',
      name: 'Active Directory',
      status: 'connected',
      lastSync: new Date(Date.now() - 300000), // 5 minutes ago
      syncFrequency: '15 minutes',
      icon: 'Server',
      users: 1247,
      errors: 0
    },
    {
      id: 'ldap',
      name: 'LDAP Server',
      status: 'connected',
      lastSync: new Date(Date.now() - 900000), // 15 minutes ago
      syncFrequency: '30 minutes',
      icon: 'Database',
      users: 856,
      errors: 0
    },
    {
      id: 'okta',
      name: 'Okta SSO',
      status: 'warning',
      lastSync: new Date(Date.now() - 3600000), // 1 hour ago
      syncFrequency: '1 hour',
      icon: 'Shield',
      users: 2103,
      errors: 3
    },
    {
      id: 'azure-ad',
      name: 'Azure AD',
      status: 'error',
      lastSync: new Date(Date.now() - 7200000), // 2 hours ago
      syncFrequency: '1 hour',
      icon: 'Cloud',
      users: 1892,
      errors: 12
    }
  ]);

  const [systemHealth, setSystemHealth] = useState({
    overall: 'healthy',
    apiLatency: 145,
    uptime: 99.97,
    activeConnections: 847
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      setSystemHealth(prev => ({
        ...prev,
        apiLatency: Math.floor(Math.random() * 100) + 100,
        activeConnections: Math.floor(Math.random() * 100) + 800
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return 'CheckCircle';
      case 'warning': return 'AlertTriangle';
      case 'error': return 'XCircle';
      default: return 'Circle';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'connected': return 'bg-success/10 border-success/20';
      case 'warning': return 'bg-warning/10 border-warning/20';
      case 'error': return 'bg-error/10 border-error/20';
      default: return 'bg-muted/10 border-muted/20';
    }
  };

  const formatLastSync = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      return `${hours}h ago`;
    }
  };

  const handleSync = (integrationId) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, lastSync: new Date(), status: 'connected' }
        : integration
    ));
  };

  const handleTestConnection = (integrationId) => {
    // Simulate connection test
    console.log(`Testing connection for ${integrationId}`);
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="glass-container border border-border/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">System Health</h2>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
            systemHealth.overall === 'healthy' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
          }`}>
            <Icon 
              name={systemHealth.overall === 'healthy' ? 'CheckCircle' : 'AlertTriangle'} 
              size={16} 
            />
            <span className="text-sm font-medium capitalize">{systemHealth.overall}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-container p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Zap" size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">API Latency</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{systemHealth.apiLatency}ms</div>
            <div className="text-xs text-muted-foreground">Average response time</div>
          </div>

          <div className="glass-container p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Activity" size={16} className="text-success" />
              <span className="text-sm font-medium text-foreground">Uptime</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{systemHealth.uptime}%</div>
            <div className="text-xs text-muted-foreground">Last 30 days</div>
          </div>

          <div className="glass-container p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Users" size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-foreground">Active Sessions</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{systemHealth.activeConnections}</div>
            <div className="text-xs text-muted-foreground">Current connections</div>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="glass-container border border-border/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Integration Status</h2>
          <Button
            variant="outline"
            size="sm"
            iconName="RefreshCw"
            iconPosition="left"
            onClick={() => window.location.reload()}
          >
            Refresh All
          </Button>
        </div>

        <div className="space-y-4">
          {integrations.map((integration) => (
            <div 
              key={integration.id} 
              className={`p-4 rounded-lg border ${getStatusBg(integration.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Icon name={integration.icon} size={20} className="text-primary" />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-foreground">{integration.name}</h3>
                      <Icon 
                        name={getStatusIcon(integration.status)} 
                        size={16} 
                        className={getStatusColor(integration.status)}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last sync: {formatLastSync(integration.lastSync)} • 
                      Sync every {integration.syncFrequency}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {integration.users.toLocaleString()} users
                    </div>
                    {integration.errors > 0 && (
                      <div className="text-sm text-error">
                        {integration.errors} error{integration.errors !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection(integration.id)}
                      iconName="Wifi"
                    >
                      Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSync(integration.id)}
                      iconName="RefreshCw"
                    >
                      Sync
                    </Button>
                  </div>
                </div>
              </div>

              {integration.errors > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-error/5 border border-error/20">
                  <div className="flex items-start space-x-2">
                    <Icon name="AlertCircle" size={16} className="text-error mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-error">Recent Errors</div>
                      <div className="text-sm text-muted-foreground">
                        Connection timeout, authentication failures detected
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-container border border-border/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            iconName="Settings"
            iconPosition="left"
          >
            <div className="text-left">
              <div className="font-medium">Configure Integrations</div>
              <div className="text-sm text-muted-foreground">Manage connection settings</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            iconName="FileText"
            iconPosition="left"
          >
            <div className="text-left">
              <div className="font-medium">View Sync Logs</div>
              <div className="text-sm text-muted-foreground">Check synchronization history</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            iconName="AlertTriangle"
            iconPosition="left"
          >
            <div className="text-left">
              <div className="font-medium">Error Reports</div>
              <div className="text-sm text-muted-foreground">Review integration issues</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            iconName="BarChart3"
            iconPosition="left"
          >
            <div className="text-left">
              <div className="font-medium">Performance Metrics</div>
              <div className="text-sm text-muted-foreground">View detailed analytics</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationStatus;