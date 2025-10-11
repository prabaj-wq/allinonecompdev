import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Grid3X3, UserCog, Users, FileText, Shield, Home } from 'lucide-react';

const Breadcrumb = () => {
  const location = useLocation();
  
  const routeMap = {
    '/rolemanagement/permission-matrix-management': {
      title: 'Permission Matrix Management',
      parent: null,
      icon: Grid3X3
    },
    '/rolemanagement/role-profile-management': {
      title: 'Role Profile Management',
      parent: null,
      icon: UserCog
    },
    '/rolemanagement/user-access-dashboard': {
      title: 'User Access Dashboard',
      parent: null,
      icon: Users
    },
    '/rolemanagement': {
      title: 'User Access Dashboard',
      parent: null,
      icon: Users
    },
    '/rolemanagement/access-request-workflow': {
      title: 'Access Request Workflow',
      parent: null,
      icon: FileText
    },
    '/rolemanagement/compliance-audit-center': {
      title: 'Compliance Audit Center',
      parent: null,
      icon: Shield
    }
  };

  const currentRoute = routeMap[location.pathname];
  
  if (!currentRoute) {
    return null;
  }

  const breadcrumbItems = [
    { title: 'Dashboard', path: '/dashboard', icon: Home },
    { title: currentRoute.title, path: location.pathname, icon: currentRoute.icon }
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <React.Fragment key={item.path}>
            {index > 0 && (
              <ChevronRight 
                size={16} 
                className="text-gray-400" 
              />
            )}
            
            {index === breadcrumbItems.length - 1 ? (
              <div className="flex items-center space-x-2 text-white font-medium">
                <IconComponent size={16} className="text-blue-400" />
                <span>{item.title}</span>
              </div>
            ) : (
              <Link
                to={item.path}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <IconComponent size={16} />
                <span>{item.title}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
