import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import PermissionMatrix from './components/PermissionMatrix';
import FilterBar from './components/FilterBar';
import AdminGuidance from './components/AdminGuidance';
import IntegrationStatus from './components/IntegrationStatus';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const PermissionMatrixManagement = () => {
  const [activeTab, setActiveTab] = useState('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [filters, setFilters] = useState({
    showElevated: true,
    showStandard: true,
    showViewOnly: true,
    showNone: true,
    showRead: true,
    showWrite: true,
    categories: []
  });

  // Mock data for roles
  const [roles] = useState([
    {
      id: 'admin',
      name: 'System Administrator',
      type: 'elevated',
      icon: 'Shield',
      description: 'Full system access with administrative privileges'
    },
    {
      id: 'security-admin',
      name: 'Security Administrator',
      type: 'elevated',
      icon: 'Lock',
      description: 'Security-focused administrative access'
    },
    {
      id: 'hr-manager',
      name: 'HR Manager',
      type: 'standard',
      icon: 'Users',
      description: 'Human resources management access'
    },
    {
      id: 'finance-manager',
      name: 'Finance Manager',
      type: 'standard',
      icon: 'DollarSign',
      description: 'Financial systems management access'
    },
    {
      id: 'department-head',
      name: 'Department Head',
      type: 'standard',
      icon: 'Crown',
      description: 'Departmental oversight and management'
    },
    {
      id: 'team-lead',
      name: 'Team Lead',
      type: 'standard',
      icon: 'UserCheck',
      description: 'Team management and coordination'
    },
    {
      id: 'employee',
      name: 'Standard Employee',
      type: 'view-only',
      icon: 'User',
      description: 'Basic employee access rights'
    },
    {
      id: 'contractor',
      name: 'External Contractor',
      type: 'view-only',
      icon: 'UserX',
      description: 'Limited access for external contractors'
    },
    {
      id: 'intern',
      name: 'Intern',
      type: 'view-only',
      icon: 'GraduationCap',
      description: 'Supervised access for interns'
    },
    {
      id: 'auditor',
      name: 'Compliance Auditor',
      type: 'view-only',
      icon: 'Search',
      description: 'Read-only access for compliance reviews'
    }
  ]);

  // Mock data for system modules
  const [modules] = useState([
    { id: 'user-mgmt', name: 'User Management', category: 'Core', icon: 'Users' },
    { id: 'role-mgmt', name: 'Role Management', category: 'Core', icon: 'UserCog' },
    { id: 'system-config', name: 'System Config', category: 'Core', icon: 'Settings' },
    { id: 'audit-logs', name: 'Audit Logs', category: 'Security', icon: 'FileText' },
    { id: 'security-policies', name: 'Security Policies', category: 'Security', icon: 'Shield' },
    { id: 'payroll', name: 'Payroll System', category: 'Financial', icon: 'DollarSign' },
    { id: 'accounting', name: 'Accounting', category: 'Financial', icon: 'Calculator' },
    { id: 'hr-records', name: 'HR Records', category: 'HR', icon: 'FolderOpen' },
    { id: 'employee-data', name: 'Employee Data', category: 'HR', icon: 'UserCheck' },
    { id: 'reports', name: 'Reports & Analytics', category: 'Analytics', icon: 'BarChart3' },
    { id: 'dashboards', name: 'Dashboards', category: 'Analytics', icon: 'Monitor' },
    { id: 'backup-restore', name: 'Backup & Restore', category: 'Core', icon: 'Database' }
  ]);

  // Mock permissions data
  const [permissions, setPermissions] = useState([
    // System Administrator - Full access
    { roleId: 'admin', moduleId: 'user-mgmt', level: 'write' },
    { roleId: 'admin', moduleId: 'role-mgmt', level: 'write' },
    { roleId: 'admin', moduleId: 'system-config', level: 'write' },
    { roleId: 'admin', moduleId: 'audit-logs', level: 'write' },
    { roleId: 'admin', moduleId: 'security-policies', level: 'write' },
    { roleId: 'admin', moduleId: 'payroll', level: 'write' },
    { roleId: 'admin', moduleId: 'accounting', level: 'write' },
    { roleId: 'admin', moduleId: 'hr-records', level: 'write' },
    { roleId: 'admin', moduleId: 'employee-data', level: 'write' },
    { roleId: 'admin', moduleId: 'reports', level: 'write' },
    { roleId: 'admin', moduleId: 'dashboards', level: 'write' },
    { roleId: 'admin', moduleId: 'backup-restore', level: 'write' },
    
    // Security Administrator
    { roleId: 'security-admin', moduleId: 'user-mgmt', level: 'write' },
    { roleId: 'security-admin', moduleId: 'role-mgmt', level: 'write' },
    { roleId: 'security-admin', moduleId: 'audit-logs', level: 'write' },
    { roleId: 'security-admin', moduleId: 'security-policies', level: 'write' },
    { roleId: 'security-admin', moduleId: 'reports', level: 'read' },
    
    // HR Manager
    { roleId: 'hr-manager', moduleId: 'hr-records', level: 'write' },
    { roleId: 'hr-manager', moduleId: 'employee-data', level: 'write' },
    { roleId: 'hr-manager', moduleId: 'payroll', level: 'read' },
    { roleId: 'hr-manager', moduleId: 'reports', level: 'read' },
    
    // Finance Manager
    { roleId: 'finance-manager', moduleId: 'payroll', level: 'write' },
    { roleId: 'finance-manager', moduleId: 'accounting', level: 'write' },
    { roleId: 'finance-manager', moduleId: 'reports', level: 'read' },
    
    // Standard Employee
    { roleId: 'employee', moduleId: 'dashboards', level: 'read' },
    { roleId: 'employee', moduleId: 'employee-data', level: 'read' },
    
    // Auditor
    { roleId: 'auditor', moduleId: 'audit-logs', level: 'read' },
    { roleId: 'auditor', moduleId: 'reports', level: 'read' },
    { roleId: 'auditor', moduleId: 'security-policies', level: 'read' }
  ]);

  // Filter roles based on search and filters
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = (filters.showElevated && role.type === 'elevated') ||
                       (filters.showStandard && role.type === 'standard') ||
                       (filters.showViewOnly && role.type === 'view-only');
    
    return matchesSearch && matchesType;
  });

  const handlePermissionChange = (roleId, moduleId, newLevel) => {
    setPermissions(prev => {
      const existingIndex = prev.findIndex(p => p.roleId === roleId && p.moduleId === moduleId);
      
      if (existingIndex >= 0) {
        if (newLevel === 'none') {
          return prev.filter((_, index) => index !== existingIndex);
        } else {
          return prev.map((permission, index) => 
            index === existingIndex ? { ...permission, level: newLevel } : permission
          );
        }
      } else if (newLevel !== 'none') {
        return [...prev, { roleId, moduleId, level: newLevel }];
      }
      
      return prev;
    });
    
    setHasUnsavedChanges(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRoleSelect = (roleId, selected) => {
    setSelectedRoles(prev => 
      selected 
        ? [...prev, roleId]
        : prev.filter(id => id !== roleId)
    );
  };

  const handleBulkAction = (actionId) => {
    console.log(`Performing bulk action: ${actionId} on roles:`, selectedRoles);
    // Implement bulk action logic here
  };

  const handleExport = () => {
    console.log('Exporting permission matrix...');
    // Implement export logic here
  };

  const handleSave = () => {
    console.log('Saving permission changes...');
    setHasUnsavedChanges(false);
    // Implement save logic here
  };

  const tabs = [
    { id: 'matrix', label: 'Permission Matrix', icon: 'Grid3X3' },
    { id: 'integrations', label: 'System Integrations', icon: 'Plug' }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            if (hasUnsavedChanges) {
              handleSave();
            }
            break;
          case 'a':
            event.preventDefault();
            setSelectedRoles(filteredRoles.map(role => role.id));
            break;
          default:
            break;
        }
      } else if (event.key === 'Escape') {
        setSelectedRoles([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, filteredRoles]);

  return (
    <>
      <Helmet>
        <title>Permission Matrix Management - PermissionMatrix Pro</title>
        <meta name="description" content="Manage user permissions across organizational systems with interactive matrix interface" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        
        <main className="pt-16">
          <div className="max-w-[1600px] mx-auto p-6">
            <Breadcrumb />
            
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Permission Matrix Management
                </h1>
                <p className="text-muted-foreground">
                  Manage user access rights across organizational systems with visual matrix interface
                </p>
              </div>
              
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-warning/10 border border-warning/20">
                  <Icon name="AlertTriangle" size={16} className="text-warning" />
                  <span className="text-sm text-warning font-medium">Unsaved Changes</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    iconName="Save"
                    iconPosition="left"
                  >
                    Save Now
                  </Button>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center space-x-1 mb-6 glass-container border border-border/50 rounded-xl p-1 w-fit">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  iconName={tab.icon}
                  iconPosition="left"
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'matrix' && (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Content */}
                <div className="xl:col-span-3 space-y-6">
                  <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onBulkAction={handleBulkAction}
                    selectedRoles={selectedRoles}
                    onExport={handleExport}
                    onSave={handleSave}
                  />
                  
                  <PermissionMatrix
                    roles={filteredRoles}
                    modules={modules}
                    permissions={permissions}
                    onPermissionChange={handlePermissionChange}
                    selectedRoles={selectedRoles}
                    onRoleSelect={handleRoleSelect}
                  />
                </div>

                {/* Sidebar */}
                <div className="xl:col-span-1">
                  <AdminGuidance />
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3">
                  <IntegrationStatus />
                </div>
                <div className="xl:col-span-1">
                  <AdminGuidance />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default PermissionMatrixManagement;