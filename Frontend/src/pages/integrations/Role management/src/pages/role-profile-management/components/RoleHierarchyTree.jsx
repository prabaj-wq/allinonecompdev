import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';

const RoleHierarchyTree = ({ roles, selectedRole, onRoleSelect, searchTerm, onSearchChange }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root', 'administrative', 'operational', 'view-only']));

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getRoleIcon = (type) => {
    switch (type) {
      case 'elevated': return 'ShieldAlert';
      case 'standard': return 'Shield';
      case 'view-only': return 'Eye';
      default: return 'User';
    }
  };

  const getRoleTypeColor = (type) => {
    switch (type) {
      case 'elevated': return 'text-red-400';
      case 'standard': return 'text-blue-400';
      case 'view-only': return 'text-emerald-400';
      default: return 'text-gray-400';
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedRoles = {
    elevated: filteredRoles.filter(role => role.type === 'elevated'),
    standard: filteredRoles.filter(role => role.type === 'standard'),
    'view-only': filteredRoles.filter(role => role.type === 'view-only')
  };

  const TreeNode = ({ id, label, icon, children, count }) => {
    const isExpanded = expandedNodes.has(id);
    const hasChildren = children && children.length > 0;

    return (
      <div className="mb-1">
        <div
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
            hasChildren ? 'hover:bg-white/5' : ''
          }`}
          onClick={() => hasChildren && toggleNode(id)}
        >
          {hasChildren && (
            <Icon
              name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
              size={16}
              className="text-muted-foreground"
            />
          )}
          {!hasChildren && <div className="w-4" />}
          
          <Icon name={icon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground flex-1">{label}</span>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground bg-white/10 px-2 py-1 rounded-full">
              {count}
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-6 mt-1">
            {children.map((child, index) => (
              <div key={index}>{child}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const RoleItem = ({ role }) => (
    <div
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
        selectedRole?.id === role.id
          ? 'bg-primary/20 border border-primary/30' :'hover:bg-white/5'
      }`}
      onClick={() => onRoleSelect(role)}
    >
      <Icon
        name={getRoleIcon(role.type)}
        size={16}
        className={getRoleTypeColor(role.type)}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{role.name}</div>
        <div className="text-xs text-muted-foreground">{role.userCount} users</div>
      </div>
      {role.isTemplate && (
        <Icon name="Bookmark" size={12} className="text-warning" />
      )}
    </div>
  );

  return (
    <div className="glass-container p-4 rounded-xl border border-border/50 h-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">Role Hierarchy</h3>
        
        {/* Search */}
        <Input
          type="search"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mb-4"
        />
      </div>

      {/* Tree Structure */}
      <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-300px)]">
        <TreeNode
          id="root"
          label="All Roles"
          icon="FolderOpen"
          count={filteredRoles.length}
        >
          <TreeNode
            id="administrative"
            label="Administrative Roles"
            icon="ShieldAlert"
            count={groupedRoles.elevated.length}
          >
            {groupedRoles.elevated.map(role => (
              <RoleItem key={role.id} role={role} />
            ))}
          </TreeNode>

          <TreeNode
            id="operational"
            label="Operational Roles"
            icon="Shield"
            count={groupedRoles.standard.length}
          >
            {groupedRoles.standard.map(role => (
              <RoleItem key={role.id} role={role} />
            ))}
          </TreeNode>

          <TreeNode
            id="view-only"
            label="View-Only Roles"
            icon="Eye"
            count={groupedRoles['view-only'].length}
          >
            {groupedRoles['view-only'].map(role => (
              <RoleItem key={role.id} role={role} />
            ))}
          </TreeNode>
        </TreeNode>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-red-400">{groupedRoles.elevated.length}</div>
            <div className="text-xs text-muted-foreground">Elevated</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">{groupedRoles.standard.length}</div>
            <div className="text-xs text-muted-foreground">Standard</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400">{groupedRoles['view-only'].length}</div>
            <div className="text-xs text-muted-foreground">View Only</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleHierarchyTree;