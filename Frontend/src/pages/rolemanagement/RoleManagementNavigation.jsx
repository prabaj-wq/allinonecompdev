import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Users, Shield, Grid, FileText, GitBranch, Database } from 'lucide-react';

const RoleManagementNavigation = () => {
  const location = useLocation();

  const navigationItems = [
    {
      path: '/rolemanagement/user-access-dashboard',
      name: 'User Access Dashboard',
      icon: Users,
      description: 'Monitor and manage user permissions'
    },
    {
      path: '/rolemanagement/role-profile-management',
      name: 'Role Profile Management',
      icon: Shield,
      description: 'Configure user roles and permissions'
    },
    {
      path: '/rolemanagement/permission-matrix-management',
      name: 'Permission Matrix',
      icon: Grid,
      description: 'Detailed permission configuration'
    },
    {
      path: '/rolemanagement/compliance-audit-center',
      name: 'Compliance & Audit',
      icon: FileText,
      description: 'Monitor system activities and compliance'
    },
    {
      path: '/rolemanagement/access-request-workflow',
      name: 'Access Requests',
      icon: GitBranch,
      description: 'Review and manage access requests'
    },
    {
      path: '/rolemanagement/system-integration-monitor',
      name: 'System Integration',
      icon: Database,
      description: 'Monitor database connections and health'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || (path === '/rolemanagement/user-access-dashboard' && location.pathname === '/rolemanagement');
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 mb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between py-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Role Management System</h1>
            <p className="text-gray-300">Comprehensive user and permission management</p>
          </div>
        </div>
        
        <div className="flex space-x-1 overflow-x-auto pb-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg whitespace-nowrap transition-all duration-200 ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoleManagementNavigation;
