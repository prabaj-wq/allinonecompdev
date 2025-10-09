import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const Breadcrumb = () => {
  const location = useLocation();
  
  const routeMap = {
    '/permission-matrix-management': {
      title: 'Permission Matrix Management',
      parent: null,
      icon: 'Grid3X3'
    },
    '/role-profile-management': {
      title: 'Role Profile Management',
      parent: null,
      icon: 'UserCog'
    },
    '/user-access-dashboard': {
      title: 'User Access Dashboard',
      parent: null,
      icon: 'Users'
    },
    '/access-request-workflow': {
      title: 'Access Request Workflow',
      parent: null,
      icon: 'FileText'
    },
    '/compliance-audit-center': {
      title: 'Compliance Audit Center',
      parent: null,
      icon: 'Shield'
    },
    '/system-integration-monitor': {
      title: 'System Integration Monitor',
      parent: null,
      icon: 'Activity'
    }
  };

  const currentRoute = routeMap[location.pathname];
  
  if (!currentRoute || location.pathname === '/') {
    return null;
  }

  const breadcrumbItems = [
    { title: 'Dashboard', path: '/', icon: 'Home' },
    { title: currentRoute.title, path: location.pathname, icon: currentRoute.icon }
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && (
            <Icon 
              name="ChevronRight" 
              size={16} 
              className="text-muted-foreground" 
            />
          )}
          
          {index === breadcrumbItems.length - 1 ? (
            <div className="flex items-center space-x-2 text-foreground font-medium">
              <Icon name={item.icon} size={16} className="text-primary" />
              <span>{item.title}</span>
            </div>
          ) : (
            <Link
              to={item.path}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <Icon name={item.icon} size={16} />
              <span>{item.title}</span>
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;