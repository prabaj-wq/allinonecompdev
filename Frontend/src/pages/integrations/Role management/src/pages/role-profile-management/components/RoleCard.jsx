import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RoleCard = ({ role, onEdit, onDuplicate, onDelete, onViewDetails }) => {
  const getRoleTypeColor = (type) => {
    switch (type) {
      case 'elevated': return 'bg-red-500/20 border-red-400/30';
      case 'standard': return 'bg-blue-500/20 border-blue-400/30';
      case 'view-only': return 'bg-emerald-500/20 border-emerald-400/30';
      default: return 'bg-gray-500/20 border-gray-400/30';
    }
  };

  const getRoleTypeIcon = (type) => {
    switch (type) {
      case 'elevated': return 'ShieldAlert';
      case 'standard': return 'Shield';
      case 'view-only': return 'Eye';
      default: return 'User';
    }
  };

  const getPermissionColor = (level) => {
    switch (level) {
      case 'none': return 'bg-red-500/40';
      case 'read': return 'bg-blue-500/40';
      case 'write': return 'bg-emerald-500/40';
      default: return 'bg-gray-500/40';
    }
  };

  const formatLastModified = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`glass-container p-6 rounded-xl border ${getRoleTypeColor(role.type)} hover:shadow-glass-lg transition-all duration-200 group`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg ${getRoleTypeColor(role.type)} flex items-center justify-center`}>
            <Icon name={getRoleTypeIcon(role.type)} size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {role.name}
            </h3>
            <p className="text-sm text-muted-foreground capitalize">{role.type} Role</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(role)}
            className="h-8 w-8 p-0"
          >
            <Icon name="Edit" size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(role)}
            className="h-8 w-8 p-0"
          >
            <Icon name="Copy" size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(role)}
            className="h-8 w-8 p-0 text-error hover:text-error"
          >
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {role.description}
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{role.userCount}</div>
          <div className="text-xs text-muted-foreground">Users</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{role.moduleCount}</div>
          <div className="text-xs text-muted-foreground">Modules</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{role.writeAccess}</div>
          <div className="text-xs text-muted-foreground">Write Access</div>
        </div>
      </div>

      {/* Permission Heatmap */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Permission Overview</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(role)}
            className="text-xs text-primary hover:text-primary"
          >
            View Details
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {role.permissionHeatmap.map((permission, index) => (
            <div
              key={index}
              className={`h-6 rounded ${getPermissionColor(permission)} border border-white/10`}
              title={`Module ${index + 1}: ${permission}`}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
        <div className="flex items-center space-x-2">
          <Icon name="Clock" size={12} />
          <span>Modified {formatLastModified(role.lastModified)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="User" size={12} />
          <span>{role.modifiedBy}</span>
        </div>
      </div>
    </div>
  );
};

export default RoleCard;