import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';


const PermissionMatrix = ({ roles, modules, permissions, onPermissionChange, selectedRoles, onRoleSelect }) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const matrixRef = useRef(null);

  const permissionStates = ['none', 'read', 'write'];
  const permissionColors = {
    none: 'bg-red-500/40 text-red-100 border-red-400/30',
    read: 'bg-blue-500/40 text-blue-100 border-blue-400/30',
    write: 'bg-emerald-500/40 text-emerald-100 border-emerald-400/30'
  };

  const permissionIcons = {
    none: 'X',
    read: 'Eye',
    write: 'Edit'
  };

  const getPermissionState = (roleId, moduleId) => {
    const permission = permissions.find(p => p.roleId === roleId && p.moduleId === moduleId);
    return permission ? permission.level : 'none';
  };

  const handleCellClick = (roleId, moduleId) => {
    const currentState = getPermissionState(roleId, moduleId);
    const currentIndex = permissionStates.indexOf(currentState);
    const nextIndex = (currentIndex + 1) % permissionStates.length;
    const nextState = permissionStates[nextIndex];
    
    onPermissionChange(roleId, moduleId, nextState);
  };

  const handleCellHover = (event, roleId, moduleId) => {
    const rect = event.target.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredCell({ roleId, moduleId });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  const handleKeyDown = (event, roleId, moduleId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCellClick(roleId, moduleId);
    }
  };

  const renderTooltip = () => {
    if (!hoveredCell) return null;

    const role = roles.find(r => r.id === hoveredCell.roleId);
    const module = modules.find(m => m.id === hoveredCell.moduleId);
    const permission = getPermissionState(hoveredCell.roleId, hoveredCell.moduleId);

    return (
      <div
        className="fixed z-50 glass-enhanced border border-border/50 rounded-lg p-3 max-w-xs pointer-events-none"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translateX(-50%) translateY(-100%)'
        }}
      >
        <div className="text-sm font-medium text-foreground mb-1">
          {role?.name} → {module?.name}
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          Current Permission: <span className="capitalize font-medium">{permission}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Click to cycle: None → Read → Write
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="glass-container border border-border/50 rounded-xl overflow-hidden">
        <div className="overflow-auto max-h-[600px]" ref={matrixRef}>
          <table className="w-full">
            <thead className="sticky top-0 z-10 glass-container border-b border-border/50">
              <tr>
                <th className="sticky left-0 z-20 glass-container border-r border-border/50 p-4 text-left">
                  <div className="flex items-center space-x-2">
                    <Icon name="Users" size={16} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">Roles</span>
                  </div>
                </th>
                {modules.map((module) => (
                  <th key={module.id} className="p-4 text-center min-w-[120px]">
                    <div className="flex flex-col items-center space-y-1">
                      <Icon name={module.icon} size={16} className="text-primary" />
                      <span className="text-xs font-medium text-foreground">{module.name}</span>
                      <span className="text-xs text-muted-foreground">{module.category}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b border-border/30 hover:bg-white/5">
                  <td className="sticky left-0 z-10 glass-container border-r border-border/50 p-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.id)}
                        onChange={(e) => onRoleSelect(role.id, e.target.checked)}
                        className="w-4 h-4 rounded border-border/50 bg-input text-primary focus:ring-primary focus:ring-offset-0"
                      />
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          role.type === 'elevated' ? 'bg-red-500/20 text-red-400' :
                          role.type === 'standard'? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          <Icon name={role.icon} size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{role.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{role.type}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  {modules.map((module) => {
                    const permission = getPermissionState(role.id, module.id);
                    return (
                      <td key={module.id} className="p-2 text-center">
                        <button
                          className={`w-16 h-8 rounded-lg border transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${permissionColors[permission]}`}
                          onClick={() => handleCellClick(role.id, module.id)}
                          onMouseEnter={(e) => handleCellHover(e, role.id, module.id)}
                          onMouseLeave={handleCellLeave}
                          onKeyDown={(e) => handleKeyDown(e, role.id, module.id)}
                          tabIndex={0}
                          aria-label={`${role.name} ${module.name} permission: ${permission}`}
                        >
                          <Icon 
                            name={permissionIcons[permission]} 
                            size={14} 
                            className="mx-auto"
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {renderTooltip()}
    </div>
  );
};

export default PermissionMatrix;