import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const RoleDetailPanel = ({ role, onSave, onClose }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    type: role?.type || 'standard',
    isTemplate: role?.isTemplate || false
  });

  const modules = [
    { id: 'user-management', name: 'User Management', permission: 'write' },
    { id: 'financial-reports', name: 'Financial Reports', permission: 'read' },
    { id: 'system-settings', name: 'System Settings', permission: 'none' },
    { id: 'audit-logs', name: 'Audit Logs', permission: 'read' },
    { id: 'data-export', name: 'Data Export', permission: 'write' },
    { id: 'compliance', name: 'Compliance', permission: 'read' },
    { id: 'integrations', name: 'Integrations', permission: 'none' },
    { id: 'notifications', name: 'Notifications', permission: 'write' }
  ];

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'write': return 'text-emerald-400 bg-emerald-500/20';
      case 'read': return 'text-blue-400 bg-blue-500/20';
      case 'none': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'write': return 'Edit';
      case 'read': return 'Eye';
      case 'none': return 'X';
      default: return 'Minus';
    }
  };

  const handleSave = () => {
    onSave({ ...role, ...formData });
    setEditMode(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!role) {
    return (
      <div className="glass-container p-6 rounded-xl border border-border/50 h-full flex items-center justify-center">
        <div className="text-center">
          <Icon name="UserCog" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Role Selected</h3>
          <p className="text-muted-foreground">Select a role from the hierarchy to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-container p-6 rounded-xl border border-border/50 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon name="UserCog" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Role Details</h3>
            <p className="text-sm text-muted-foreground">Configure role permissions and settings</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {editMode ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Icon name="Edit" size={16} className="mr-2" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <Icon name="X" size={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-foreground mb-4">Basic Information</h4>
        <div className="space-y-4">
          <Input
            label="Role Name"
            value={editMode ? formData.name : role.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={!editMode}
          />
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
              value={editMode ? formData.description : role.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!editMode}
            />
          </div>

          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Role Type</label>
              <select
                className="px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                value={editMode ? formData.type : role.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                disabled={!editMode}
              >
                <option value="elevated">Elevated</option>
                <option value="standard">Standard</option>
                <option value="view-only">View Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <Checkbox
                checked={editMode ? formData.isTemplate : role.isTemplate}
                onChange={(e) => handleInputChange('isTemplate', e.target.checked)}
                disabled={!editMode}
              />
              <label className="text-sm text-foreground">Use as template</label>
            </div>
          </div>
        </div>
      </div>

      {/* Role Statistics */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-foreground mb-4">Statistics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-container p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Users" size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">Assigned Users</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{role.userCount}</div>
          </div>
          
          <div className="glass-container p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Grid3X3" size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">Module Access</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{role.moduleCount}</div>
          </div>
        </div>
      </div>

      {/* Module Permissions */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-foreground mb-4">Module Permissions</h4>
        <div className="space-y-2">
          {modules.map((module) => (
            <div key={module.id} className="flex items-center justify-between p-3 glass-container rounded-lg">
              <div className="flex items-center space-x-3">
                <Icon name="Package" size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{module.name}</span>
              </div>
              
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getPermissionColor(module.permission)}`}>
                <Icon name={getPermissionIcon(module.permission)} size={12} />
                <span className="text-xs font-medium capitalize">{module.permission}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Information */}
      <div className="border-t border-border/50 pt-4">
        <h4 className="text-md font-semibold text-foreground mb-4">Audit Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="text-foreground">{role.createdDate?.toLocaleDateString() || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Modified:</span>
            <span className="text-foreground">{role.lastModified?.toLocaleDateString() || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modified By:</span>
            <span className="text-foreground">{role.modifiedBy || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDetailPanel;