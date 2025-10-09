import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestQueue = ({ 
  requests, 
  selectedRequest, 
  onRequestSelect, 
  filters, 
  onFiltersChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = request.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.resourceName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === 'all' || request.status === filters.status;
      const matchesPriority = filters.priority === 'all' || request.priority === filters.priority;
      const matchesDepartment = filters.department === 'all' || request.department === filters.department;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
    });
  }, [requests, searchTerm, filters]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-warning bg-warning/10 border-warning/20';
      case 'approved': return 'text-success bg-success/10 border-success/20';
      case 'rejected': return 'text-error bg-error/10 border-error/20';
      case 'escalated': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-error';
      case 'high': return 'text-warning';
      case 'medium': return 'text-blue-400';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return 'AlertTriangle';
      case 'high': return 'ArrowUp';
      case 'medium': return 'Minus';
      case 'low': return 'ArrowDown';
      default: return 'Circle';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const requestTime = new Date(timestamp);
    const diffInHours = Math.floor((now - requestTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Request Queue</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {filteredRequests.length} of {requests.length}
            </span>
            <Button variant="ghost" size="sm">
              <Icon name="RefreshCw" size={16} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'status', value: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
            { key: 'status', value: 'escalated', label: 'Escalated', count: requests.filter(r => r.status === 'escalated').length },
            { key: 'priority', value: 'critical', label: 'Critical', count: requests.filter(r => r.priority === 'critical').length }
          ].map((filter) => (
            <button
              key={`${filter.key}-${filter.value}`}
              onClick={() => onFiltersChange({ ...filters, [filter.key]: filter.value })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters[filter.key] === filter.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Request List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Icon name="Inbox" size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No requests found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms' : 'All requests have been processed'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => onRequestSelect(request)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 mb-2 ${
                  selectedRequest?.id === request.id
                    ? 'bg-primary/10 border-primary/30 shadow-md'
                    : 'glass-container hover:bg-white/5 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name={getPriorityIcon(request.priority)} 
                      size={16} 
                      className={getPriorityColor(request.priority)}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {request.requesterName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-medium text-foreground mb-1">
                    {request.resourceName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {request.accessType} access • {request.department}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatTimeAgo(request.submittedAt)}</span>
                  {request.dueDate && (
                    <span className={`${
                      new Date(request.dueDate) < new Date() ? 'text-error' : 'text-muted-foreground'
                    }`}>
                      Due: {new Date(request.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {request.status === 'escalated' && (
                  <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded text-xs text-warning">
                    <Icon name="Clock" size={12} className="inline mr-1" />
                    Escalated due to timeout
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestQueue;