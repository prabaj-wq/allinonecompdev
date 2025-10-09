import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const BulkOperationsToolbar = ({ 
  selectedRoles, 
  onCreateRole, 
  onDuplicateRoles, 
  onDeleteRoles, 
  onExportRoles,
  onClearSelection 
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const exportOptions = [
    { value: 'pdf', label: 'Export as PDF' },
    { value: 'excel', label: 'Export as Excel' },
    { value: 'csv', label: 'Export as CSV' },
    { value: 'json', label: 'Export as JSON' }
  ];

  const handleBulkAction = (action) => {
    if (action === 'delete' && selectedRoles.length > 0) {
      setConfirmAction(action);
      setShowConfirmDialog(true);
    } else if (action === 'duplicate' && selectedRoles.length > 0) {
      onDuplicateRoles(selectedRoles);
    }
  };

  const confirmBulkAction = () => {
    if (confirmAction === 'delete') {
      onDeleteRoles(selectedRoles);
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleExport = (format) => {
    onExportRoles(selectedRoles.length > 0 ? selectedRoles : 'all', format);
  };

  return (
    <>
      <div className="glass-container p-4 rounded-xl border border-border/50 mb-6">
        <div className="flex items-center justify-between">
          {/* Left Section - Selection Info */}
          <div className="flex items-center space-x-4">
            {selectedRoles.length > 0 ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Icon name="CheckSquare" size={16} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear Selection
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Icon name="Grid3X3" size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No roles selected</span>
              </div>
            )}
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2">
            {/* Create New Role */}
            <Button
              variant="default"
              size="sm"
              onClick={onCreateRole}
              iconName="Plus"
              iconPosition="left"
            >
              Create Role
            </Button>

            {/* Bulk Actions - Only show when roles are selected */}
            {selectedRoles.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('duplicate')}
                  iconName="Copy"
                  iconPosition="left"
                >
                  Duplicate ({selectedRoles.length})
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  iconName="Trash2"
                  iconPosition="left"
                >
                  Delete ({selectedRoles.length})
                </Button>
              </>
            )}

            {/* Export Dropdown */}
            <div className="relative group">
              <Button
                variant="outline"
                size="sm"
                iconName="Download"
                iconPosition="left"
              >
                Export
              </Button>
              
              <div className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="glass-enhanced border border-border/50 rounded-xl shadow-glass-lg">
                  <div className="p-2">
                    {exportOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleExport(option.value)}
                        className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        <Icon name="FileText" size={16} />
                        <span>{option.label}</span>
                      </button>
                    ))}
                    <div className="border-t border-border/50 mt-2 pt-2">
                      <button
                        onClick={() => handleExport('template')}
                        className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Icon name="Template" size={16} />
                        <span>Export as Template</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {selectedRoles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-foreground">
                  {selectedRoles.reduce((sum, role) => sum + role.userCount, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Users</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-400">
                  {selectedRoles.filter(role => role.type === 'elevated').length}
                </div>
                <div className="text-xs text-muted-foreground">Elevated Roles</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-400">
                  {selectedRoles.filter(role => role.type === 'standard').length}
                </div>
                <div className="text-xs text-muted-foreground">Standard Roles</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-400">
                  {selectedRoles.filter(role => role.type === 'view-only').length}
                </div>
                <div className="text-xs text-muted-foreground">View-Only Roles</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-100">
          <div className="glass-enhanced p-6 rounded-xl border border-border/50 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center">
                <Icon name="AlertTriangle" size={20} className="text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Confirm Deletion</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''}? 
              This will remove all associated permissions and user assignments.
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmBulkAction}
              >
                Delete Roles
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkOperationsToolbar;