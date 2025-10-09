import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import RoleHierarchyTree from './components/RoleHierarchyTree';
import RoleCard from './components/RoleCard';
import RoleDetailPanel from './components/RoleDetailPanel';
import BulkOperationsToolbar from './components/BulkOperationsToolbar';
import FilterBar from './components/FilterBar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const RoleProfileManagement = () => {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    roleType: 'all',
    permissionLevel: 'all',
    showTemplatesOnly: false,
    showActiveOnly: false,
    dateRange: 'all',
    sortBy: 'name-asc'
  });

  // Mock role data
  const mockRoles = [
    {
      id: 1,
      name: "System Administrator",
      description: `Complete system access with full administrative privileges including user management, system configuration, and security settings. This role provides unrestricted access to all system modules and functions.`,
      type: "elevated",
      userCount: 3,
      moduleCount: 12,
      writeAccess: 10,
      isTemplate: true,
      permissionHeatmap: ['write', 'write', 'write', 'write', 'write', 'write', 'write', 'write'],
      lastModified: new Date(Date.now() - 86400000),
      modifiedBy: "Admin User",
      createdDate: new Date(Date.now() - 2592000000)
    },
    {
      id: 2,
      name: "Department Manager",
      description: `Departmental oversight role with team management capabilities, budget access, and reporting functions. Includes user management within department scope and access to departmental analytics.`,
      type: "standard",
      userCount: 15,
      moduleCount: 8,
      writeAccess: 5,
      isTemplate: true,
      permissionHeatmap: ['write', 'read', 'write', 'read', 'none', 'read', 'write', 'read'],
      lastModified: new Date(Date.now() - 172800000),
      modifiedBy: "HR Manager",
      createdDate: new Date(Date.now() - 5184000000)
    },
    {
      id: 3,
      name: "Financial Analyst",
      description: `Specialized role for financial data analysis with access to financial reports, budget planning tools, and compliance modules. Read-write access to financial systems with audit trail requirements.`,
      type: "standard",
      userCount: 8,
      moduleCount: 6,
      writeAccess: 3,
      isTemplate: false,
      permissionHeatmap: ['read', 'write', 'write', 'read', 'none', 'none', 'read', 'write'],
      lastModified: new Date(Date.now() - 259200000),
      modifiedBy: "Finance Director",
      createdDate: new Date(Date.now() - 7776000000)
    },
    {
      id: 4,
      name: "HR Coordinator",
      description: `Human resources support role with employee data access, recruitment tools, and basic reporting capabilities. Includes access to employee lifecycle management and basic analytics.`,
      type: "standard",
      userCount: 5,
      moduleCount: 7,
      writeAccess: 4,
      isTemplate: false,
      permissionHeatmap: ['write', 'read', 'none', 'write', 'write', 'read', 'none', 'read'],
      lastModified: new Date(Date.now() - 345600000),
      modifiedBy: "HR Director",
      createdDate: new Date(Date.now() - 10368000000)
    },
    {
      id: 5,
      name: "Security Auditor",
      description: `Specialized security role with comprehensive audit access, compliance monitoring, and security report generation. Read-only access to sensitive systems with detailed logging requirements.`,
      type: "elevated",
      userCount: 2,
      moduleCount: 10,
      writeAccess: 2,
      isTemplate: true,
      permissionHeatmap: ['read', 'read', 'write', 'read', 'read', 'read', 'read', 'write'],
      lastModified: new Date(Date.now() - 432000000),
      modifiedBy: "Security Manager",
      createdDate: new Date(Date.now() - 12960000000)
    },
    {
      id: 6,
      name: "Guest User",
      description: `Limited access role for external users and temporary access. Provides basic system navigation with restricted functionality and read-only access to public information.`,
      type: "view-only",
      userCount: 25,
      moduleCount: 3,
      writeAccess: 0,
      isTemplate: true,
      permissionHeatmap: ['read', 'none', 'none', 'read', 'none', 'none', 'none', 'read'],
      lastModified: new Date(Date.now() - 518400000),
      modifiedBy: "System Admin",
      createdDate: new Date(Date.now() - 15552000000)
    },
    {
      id: 7,
      name: "Project Manager",
      description: `Project oversight role with team coordination capabilities, project tracking access, and resource management tools. Includes timeline management and project reporting functions.`,
      type: "standard",
      userCount: 12,
      moduleCount: 9,
      writeAccess: 6,
      isTemplate: false,
      permissionHeatmap: ['write', 'write', 'read', 'write', 'write', 'read', 'write', 'none'],
      lastModified: new Date(Date.now() - 604800000),
      modifiedBy: "Operations Manager",
      createdDate: new Date(Date.now() - 18144000000)
    },
    {
      id: 8,
      name: "Customer Support",
      description: `Customer service role with ticket management, customer data access, and support tool functionality. Includes communication tools and basic customer analytics access.`,
      type: "standard",
      userCount: 20,
      moduleCount: 5,
      writeAccess: 3,
      isTemplate: true,
      permissionHeatmap: ['read', 'write', 'none', 'read', 'write', 'none', 'read', 'write'],
      lastModified: new Date(Date.now() - 691200000),
      modifiedBy: "Support Manager",
      createdDate: new Date(Date.now() - 20736000000)
    }
  ];

  const [roles, setRoles] = useState(mockRoles);

  // Filter and sort roles
  const filteredRoles = roles.filter(role => {
    if (filters.search && !role.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !role.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.roleType !== 'all' && role.type !== filters.roleType) {
      return false;
    }
    if (filters.showTemplatesOnly && !role.isTemplate) {
      return false;
    }
    if (filters.showActiveOnly && role.userCount === 0) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'users-desc': return b.userCount - a.userCount;
      case 'users-asc': return a.userCount - b.userCount;
      case 'modified-desc': return b.lastModified - a.lastModified;
      case 'modified-asc': return a.lastModified - b.lastModified;
      default: return 0;
    }
  });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setShowDetailPanel(true);
  };

  const handleRoleEdit = (role) => {
    setSelectedRole(role);
    setShowDetailPanel(true);
  };

  const handleRoleDuplicate = (role) => {
    const newRole = {
      ...role,
      id: Math.max(...roles.map(r => r.id)) + 1,
      name: `${role.name} (Copy)`,
      userCount: 0,
      lastModified: new Date(),
      modifiedBy: "Admin User"
    };
    setRoles([...roles, newRole]);
  };

  const handleRoleDelete = (role) => {
    setRoles(roles.filter(r => r.id !== role.id));
    if (selectedRole?.id === role.id) {
      setSelectedRole(null);
      setShowDetailPanel(false);
    }
  };

  const handleBulkDuplicate = (selectedRoles) => {
    const newRoles = selectedRoles.map(role => ({
      ...role,
      id: Math.max(...roles.map(r => r.id)) + Math.random(),
      name: `${role.name} (Copy)`,
      userCount: 0,
      lastModified: new Date(),
      modifiedBy: "Admin User"
    }));
    setRoles([...roles, ...newRoles]);
    setSelectedRoles([]);
  };

  const handleBulkDelete = (selectedRoles) => {
    const selectedIds = selectedRoles.map(r => r.id);
    setRoles(roles.filter(r => !selectedIds.includes(r.id)));
    setSelectedRoles([]);
    if (selectedRole && selectedIds.includes(selectedRole.id)) {
      setSelectedRole(null);
      setShowDetailPanel(false);
    }
  };

  const handleCreateRole = () => {
    const newRole = {
      id: Math.max(...roles.map(r => r.id)) + 1,
      name: "New Role",
      description: "New role description",
      type: "standard",
      userCount: 0,
      moduleCount: 0,
      writeAccess: 0,
      isTemplate: false,
      permissionHeatmap: ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'none'],
      lastModified: new Date(),
      modifiedBy: "Admin User",
      createdDate: new Date()
    };
    setRoles([...roles, newRole]);
    setSelectedRole(newRole);
    setShowDetailPanel(true);
  };

  const handleExportRoles = (rolesToExport, format) => {
    console.log(`Exporting ${rolesToExport === 'all' ? 'all' : rolesToExport.length} roles as ${format}`);
  };

  const handleSaveRole = (updatedRole) => {
    setRoles(roles.map(role => role.id === updatedRole.id ? updatedRole : role));
    setSelectedRole(updatedRole);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      roleType: 'all',
      permissionLevel: 'all',
      showTemplatesOnly: false,
      showActiveOnly: false,
      dateRange: 'all',
      sortBy: 'name-asc'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-full mx-auto p-6">
          <Breadcrumb />
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Role Profile Management</h1>
                <p className="text-muted-foreground">
                  Manage role configurations, permissions, and user assignments across your organization
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailPanel(!showDetailPanel)}
                  iconName={showDetailPanel ? "PanelRightClose" : "PanelRightOpen"}
                  iconPosition="left"
                >
                  {showDetailPanel ? 'Hide' : 'Show'} Details
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCreateRole}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Create Role
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Operations Toolbar */}
          <BulkOperationsToolbar
            selectedRoles={selectedRoles}
            onCreateRole={handleCreateRole}
            onDuplicateRoles={handleBulkDuplicate}
            onDeleteRoles={handleBulkDelete}
            onExportRoles={handleExportRoles}
            onClearSelection={() => setSelectedRoles([])}
          />

          {/* Filter Bar */}
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={handleClearFilters}
            roleCount={filteredRoles.length}
          />

          {/* Main Content Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Panel - Role Hierarchy */}
            <div className="col-span-3">
              <RoleHierarchyTree
                roles={filteredRoles}
                selectedRole={selectedRole}
                onRoleSelect={handleRoleSelect}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>

            {/* Center Panel - Role Cards Grid */}
            <div className={`${showDetailPanel ? 'col-span-6' : 'col-span-9'}`}>
              {filteredRoles.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredRoles.map((role) => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      onEdit={handleRoleEdit}
                      onDuplicate={handleRoleDuplicate}
                      onDelete={handleRoleDelete}
                      onViewDetails={handleRoleSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-container p-12 rounded-xl border border-border/50 text-center">
                  <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Roles Found</h3>
                  <p className="text-muted-foreground mb-6">
                    No roles match your current filter criteria. Try adjusting your filters or create a new role.
                  </p>
                  <Button
                    variant="default"
                    onClick={handleCreateRole}
                    iconName="Plus"
                    iconPosition="left"
                  >
                    Create New Role
                  </Button>
                </div>
              )}
            </div>

            {/* Right Panel - Role Details */}
            {showDetailPanel && (
              <div className="col-span-3">
                <RoleDetailPanel
                  role={selectedRole}
                  onSave={handleSaveRole}
                  onClose={() => setShowDetailPanel(false)}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleProfileManagement;