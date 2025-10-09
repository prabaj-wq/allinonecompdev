import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const BulkApprovalPanel = ({ 
  selectedRequests, 
  onBulkApprove, 
  onBulkReject, 
  onBulkEscalate,
  onClearSelection,
  allRequests 
}) => {
  const [bulkComment, setBulkComment] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  if (selectedRequests.length === 0) {
    return null;
  }

  const handleBulkAction = (action) => {
    setPendingAction(action);
    setShowConfirmation(true);
  };

  const confirmBulkAction = () => {
    switch (pendingAction) {
      case 'approve':
        onBulkApprove(selectedRequests, bulkComment);
        break;
      case 'reject':
        onBulkReject(selectedRequests, bulkComment);
        break;
      case 'escalate':
        onBulkEscalate(selectedRequests, bulkComment);
        break;
    }
    setShowConfirmation(false);
    setPendingAction(null);
    setBulkComment('');
  };

  const cancelBulkAction = () => {
    setShowConfirmation(false);
    setPendingAction(null);
  };

  const getActionStats = () => {
    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      departments: new Set(),
      accessTypes: new Set()
    };

    selectedRequests.forEach(id => {
      const request = allRequests.find(r => r.id === id);
      if (request) {
        stats[request.priority]++;
        stats.departments.add(request.department);
        stats.accessTypes.add(request.accessType);
      }
    });

    return {
      ...stats,
      departments: Array.from(stats.departments),
      accessTypes: Array.from(stats.accessTypes)
    };
  };

  const stats = getActionStats();

  if (showConfirmation) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 glass-enhanced border-t border-border/50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card/80 backdrop-blur-md rounded-lg p-6 border border-border/50">
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                pendingAction === 'approve' ? 'bg-success/20 text-success' :
                pendingAction === 'reject'? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'
              }`}>
                <Icon 
                  name={
                    pendingAction === 'approve' ? 'Check' :
                    pendingAction === 'reject' ? 'X' : 'ArrowUp'
                  } 
                  size={24} 
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Confirm Bulk {pendingAction === 'approve' ? 'Approval' : 
                                pendingAction === 'reject' ? 'Rejection' : 'Escalation'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You are about to {pendingAction} {selectedRequests.length} request{selectedRequests.length > 1 ? 's' : ''}. 
                  This action cannot be undone.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted/10 rounded-lg">
                    <div className="text-lg font-semibold text-error">{stats.critical}</div>
                    <div className="text-xs text-muted-foreground">Critical</div>
                  </div>
                  <div className="text-center p-3 bg-muted/10 rounded-lg">
                    <div className="text-lg font-semibold text-warning">{stats.high}</div>
                    <div className="text-xs text-muted-foreground">High</div>
                  </div>
                  <div className="text-center p-3 bg-muted/10 rounded-lg">
                    <div className="text-lg font-semibold text-blue-400">{stats.medium}</div>
                    <div className="text-xs text-muted-foreground">Medium</div>
                  </div>
                  <div className="text-center p-3 bg-muted/10 rounded-lg">
                    <div className="text-lg font-semibold text-muted-foreground">{stats.low}</div>
                    <div className="text-xs text-muted-foreground">Low</div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bulk Action Comment
                  </label>
                  <textarea
                    value={bulkComment}
                    onChange={(e) => setBulkComment(e.target.value)}
                    placeholder={`Add a comment for this bulk ${pendingAction}...`}
                    className="w-full p-3 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button variant="ghost" onClick={cancelBulkAction}>
                Cancel
              </Button>
              <Button
                variant={pendingAction === 'approve' ? 'success' : 
                        pendingAction === 'reject' ? 'destructive' : 'warning'}
                onClick={confirmBulkAction}
                iconName={
                  pendingAction === 'approve' ? 'Check' :
                  pendingAction === 'reject' ? 'X' : 'ArrowUp'
                }
                iconPosition="left"
              >
                Confirm {pendingAction === 'approve' ? 'Approval' : 
                         pendingAction === 'reject' ? 'Rejection' : 'Escalation'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-enhanced border-t border-border/50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-foreground">
                  {selectedRequests.length}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedRequests.length} request{selectedRequests.length > 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.departments.length} department{stats.departments.length > 1 ? 's' : ''} • {stats.accessTypes.length} access type{stats.accessTypes.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {stats.critical > 0 && (
                <span className="px-2 py-1 bg-error/10 text-error text-xs rounded-full border border-error/20">
                  {stats.critical} Critical
                </span>
              )}
              {stats.high > 0 && (
                <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full border border-warning/20">
                  {stats.high} High
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              iconName="X"
              iconPosition="left"
            >
              Clear
            </Button>
            
            <div className="h-6 w-px bg-border"></div>
            
            <Button
              variant="success"
              size="sm"
              onClick={() => handleBulkAction('approve')}
              iconName="Check"
              iconPosition="left"
            >
              Approve All
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('reject')}
              iconName="X"
              iconPosition="left"
            >
              Reject All
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('escalate')}
              iconName="ArrowUp"
              iconPosition="left"
            >
              Escalate All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkApprovalPanel;