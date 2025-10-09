import React from 'react';
import Icon from '../../../components/AppIcon';

const SyncStatusPanel = ({ syncStats, onManualSync }) => {
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <div className="glass-container p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Synchronization Status</h3>
        <button
          onClick={onManualSync}
          className="flex items-center space-x-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
        >
          <Icon name="RefreshCw" size={16} />
          <span className="text-sm font-medium">Manual Sync</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-success/20 flex items-center justify-center">
            <Icon name="CheckCircle" size={24} className="text-success" />
          </div>
          <p className="text-2xl font-bold text-foreground">{syncStats.successful}</p>
          <p className="text-sm text-muted-foreground">Successful Syncs</p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-warning/20 flex items-center justify-center">
            <Icon name="Clock" size={24} className="text-warning" />
          </div>
          <p className="text-2xl font-bold text-foreground">{syncStats.pending}</p>
          <p className="text-sm text-muted-foreground">Pending Syncs</p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-error/20 flex items-center justify-center">
            <Icon name="XCircle" size={24} className="text-error" />
          </div>
          <p className="text-2xl font-bold text-foreground">{syncStats.failed}</p>
          <p className="text-sm text-muted-foreground">Failed Syncs</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Overall Sync Health</span>
          <span className="text-sm text-muted-foreground">{syncStats.healthPercentage}%</span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(syncStats.healthPercentage)}`}
            style={{ width: `${syncStats.healthPercentage}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last Full Sync</p>
            <p className="text-sm font-medium text-foreground">{syncStats.lastFullSync}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Average Duration</p>
            <p className="text-sm font-medium text-foreground">{formatDuration(syncStats.avgDuration)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Records Processed</p>
            <p className="text-sm font-medium text-foreground">{syncStats.recordsProcessed.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Next Scheduled</p>
            <p className="text-sm font-medium text-foreground">{syncStats.nextScheduled}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncStatusPanel;