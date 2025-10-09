import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SystemIntegrationPanel = ({ integrations }) => {
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-success bg-success/10 border-success/20';
      case 'syncing': return 'text-warning bg-warning/10 border-warning/20';
      case 'error': return 'text-error bg-error/10 border-error/20';
      case 'disconnected': return 'text-muted-foreground bg-muted/10 border-muted/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return 'CheckCircle';
      case 'syncing': return 'RefreshCw';
      case 'error': return 'XCircle';
      case 'disconnected': return 'Circle';
      default: return 'Circle';
    }
  };

  const formatLastSync = (timestamp) => {
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - syncTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return syncTime.toLocaleDateString();
  };

  return (
    <div className="glass-container rounded-xl border border-border/50">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">System Integrations</h3>
          <Button variant="outline" size="sm" iconName="Settings">
            Configure
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="p-4 rounded-lg border border-border/30 hover:bg-white/5 transition-colors cursor-pointer"
            onClick={() => setSelectedIntegration(integration.id === selectedIntegration ? null : integration.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Icon name={integration.icon} size={24} color="white" />
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground">{integration.name}</h4>
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(integration.status)}`}>
                    <Icon 
                      name={getStatusIcon(integration.status)} 
                      size={12} 
                      className={`mr-1 ${integration.status === 'syncing' ? 'animate-spin' : ''}`}
                    />
                    {integration.status}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last sync: {formatLastSync(integration.lastSync)}
                  </p>
                </div>
                
                <Icon 
                  name={selectedIntegration === integration.id ? "ChevronUp" : "ChevronDown"} 
                  size={20} 
                  className="text-muted-foreground"
                />
              </div>
            </div>

            {/* Expanded Details */}
            {selectedIntegration === integration.id && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-foreground">{integration.stats.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-foreground">{integration.stats.syncedToday}</p>
                    <p className="text-xs text-muted-foreground">Synced Today</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-foreground">{integration.stats.errors}</p>
                    <p className="text-xs text-muted-foreground">Sync Errors</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-medium text-foreground">Recent Sync Activities</h5>
                  {integration.recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-background/30">
                      <div className="flex items-center space-x-3">
                        <Icon 
                          name={activity.type === 'success' ? 'CheckCircle' : 'AlertCircle'} 
                          size={16} 
                          className={activity.type === 'success' ? 'text-success' : 'text-warning'}
                        />
                        <span className="text-sm text-foreground">{activity.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatLastSync(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" iconName="RefreshCw">
                      Sync Now
                    </Button>
                    <Button variant="ghost" size="sm" iconName="Eye">
                      View Logs
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Auto-sync:</span>
                    <div className={`w-8 h-4 rounded-full transition-colors ${integration.autoSync ? 'bg-success' : 'bg-muted'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform transform ${integration.autoSync ? 'translate-x-4' : 'translate-x-0.5'} mt-0.5`}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border/50 text-center">
        <Button variant="ghost" size="sm" iconName="Plus">
          Add Integration
        </Button>
      </div>
    </div>
  );
};

export default SystemIntegrationPanel;