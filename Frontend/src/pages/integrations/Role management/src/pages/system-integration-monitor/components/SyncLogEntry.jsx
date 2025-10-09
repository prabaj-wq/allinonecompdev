import React from 'react';
import Icon from '../../../components/AppIcon';

const SyncLogEntry = ({ log }) => {
  const getOperationIcon = (operation) => {
    switch (operation) {
      case 'sync': return 'RefreshCw';
      case 'create': return 'Plus';
      case 'update': return 'Edit';
      case 'delete': return 'Trash2';
      case 'error': return 'AlertCircle';
      default: return 'Activity';
    }
  };

  const getOperationColor = (operation) => {
    switch (operation) {
      case 'sync': return 'text-blue-400';
      case 'create': return 'text-success';
      case 'update': return 'text-warning';
      case 'delete': return 'text-error';
      case 'error': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'success':
        return `${baseClasses} bg-success/20 text-success border border-success/30`;
      case 'failed':
        return `${baseClasses} bg-error/20 text-error border border-error/30`;
      case 'pending':
        return `${baseClasses} bg-warning/20 text-warning border border-warning/30`;
      default:
        return `${baseClasses} bg-muted/20 text-muted-foreground border border-muted/30`;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex items-center space-x-4 p-4 glass-container hover:bg-white/10 transition-colors">
      <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center ${getOperationColor(log.operation)}`}>
        <Icon name={getOperationIcon(log.operation)} size={20} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-foreground truncate">{log.system}</h4>
          <span className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">{log.description}</p>
        
        <div className="flex items-center space-x-3">
          <span className={getStatusBadge(log.status)}>{log.status}</span>
          
          {log.recordsAffected && (
            <span className="text-xs text-muted-foreground">
              {log.recordsAffected} records affected
            </span>
          )}
          
          {log.duration && (
            <span className="text-xs text-muted-foreground">
              {log.duration}ms
            </span>
          )}
        </div>
      </div>
      
      {log.status === 'failed' && (
        <button className="px-3 py-1.5 text-xs font-medium text-error hover:text-error/80 bg-error/10 hover:bg-error/20 rounded-lg transition-colors">
          Retry
        </button>
      )}
    </div>
  );
};

export default SyncLogEntry;