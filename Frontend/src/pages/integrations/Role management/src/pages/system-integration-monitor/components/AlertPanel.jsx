import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AlertPanel = ({ alerts, onDismissAlert, onViewDetails }) => {
  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical': return 'AlertTriangle';
      case 'warning': return 'AlertCircle';
      case 'info': return 'Info';
      default: return 'Bell';
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-error border-error/30 bg-error/10';
      case 'warning': return 'text-warning border-warning/30 bg-warning/10';
      case 'info': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      default: return 'text-muted-foreground border-border/30 bg-muted/10';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  if (alerts.length === 0) {
    return (
      <div className="glass-container p-8 text-center">
        <Icon name="CheckCircle" size={48} className="text-success mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">All Systems Healthy</h3>
        <p className="text-muted-foreground">No active alerts or issues detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Active Alerts</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{alerts.length} active</span>
          <Button variant="ghost" size="sm" iconName="RefreshCw">
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className={`glass-container p-4 border ${getAlertColor(alert.severity)}`}>
            <div className="flex items-start space-x-3">
              <Icon 
                name={getAlertIcon(alert.severity)} 
                size={20} 
                className={getAlertColor(alert.severity).split(' ')[0]}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(alert.timestamp)}</span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-muted-foreground">
                    {alert.system}
                  </span>
                  {alert.affectedUsers && (
                    <span className="text-xs text-muted-foreground">
                      {alert.affectedUsers} users affected
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onViewDetails(alert.id)}
                  className="px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  Details
                </button>
                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertPanel;