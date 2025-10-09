import React from 'react';
import Icon from '../../../components/AppIcon';

const SystemCard = ({ system, onViewDetails, onTestConnection }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-success border-success/30 bg-success/10';
      case 'warning': return 'text-warning border-warning/30 bg-warning/10';
      case 'error': return 'text-error border-error/30 bg-error/10';
      case 'maintenance': return 'text-muted-foreground border-muted/30 bg-muted/10';
      default: return 'text-muted-foreground border-border/30 bg-muted/5';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return 'CheckCircle';
      case 'warning': return 'AlertTriangle';
      case 'error': return 'XCircle';
      case 'maintenance': return 'Settings';
      default: return 'Circle';
    }
  };

  const formatLastSync = (timestamp) => {
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - syncTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="glass-container p-6 hover:bg-white/15 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Icon name={system.icon} size={24} color="white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{system.name}</h3>
            <p className="text-sm text-muted-foreground">{system.type}</p>
          </div>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${getStatusColor(system.status)}`}>
          <Icon name={getStatusIcon(system.status)} size={16} />
          <span className="text-sm font-medium capitalize">{system.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Last Sync</p>
          <p className="text-sm font-medium text-foreground">{formatLastSync(system.lastSync)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Response Time</p>
          <p className="text-sm font-medium text-foreground">{system.responseTime}ms</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Records Synced</p>
          <p className="text-sm font-medium text-foreground">{system.recordsSynced.toLocaleString()}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Error Count</p>
          <p className={`text-sm font-medium ${system.errorCount > 0 ? 'text-error' : 'text-success'}`}>
            {system.errorCount}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Auto-sync enabled</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onTestConnection(system.id)}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Test Connection
          </button>
          <button
            onClick={() => onViewDetails(system.id)}
            className="px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemCard;