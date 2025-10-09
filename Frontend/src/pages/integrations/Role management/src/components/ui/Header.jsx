import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { cn } from '../../utils/cn';

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState('healthy');
  const location = useLocation();

  // Mock system status updates
  useEffect(() => {
    const statusInterval = setInterval(() => {
      const statuses = ['healthy', 'warning', 'error'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      setSystemStatus(randomStatus);
    }, 30000);

    return () => clearInterval(statusInterval);
  }, []);

  const navigationItems = [
    {
      label: 'Permissions',
      items: [
        { label: 'Permission Matrix', path: '/permission-matrix-management', icon: 'Grid3X3' },
        { label: 'Role Profiles', path: '/role-profile-management', icon: 'UserCog' }
      ]
    },
    {
      label: 'Users',
      items: [
        { label: 'Access Dashboard', path: '/user-access-dashboard', icon: 'Users' },
        { label: 'Access Requests', path: '/access-request-workflow', icon: 'FileText' }
      ]
    },
    {
      label: 'System',
      items: [
        { label: 'Integration Monitor', path: '/system-integration-monitor', icon: 'Activity' },
        { label: 'Compliance Audit', path: '/compliance-audit-center', icon: 'Shield' }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return 'CheckCircle';
      case 'warning': return 'AlertTriangle';
      case 'error': return 'XCircle';
      default: return 'Circle';
    }
  };

  const isActiveSection = (items) => {
    return items.some(item => location.pathname === item.path);
  };

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.user-menu-container')) {
      setIsUserMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-100 glass-container border-b border-border/50">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo Section */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Icon name="Shield" size={20} color="white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-background"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-foreground">PermissionMatrix</span>
              <span className="text-xs text-muted-foreground -mt-1">Pro</span>
            </div>
          </Link>

          {/* Primary Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((section) => (
              <div key={section.label} className="relative group">
                <button
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActiveSection(section.items)
                      ? 'text-primary bg-primary/10 border border-primary/20' :'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <span>{section.label}</span>
                  <Icon name="ChevronDown" size={16} className="transition-transform group-hover:rotate-180" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-200">
                  <div className="glass-dropdown-enhanced border border-white/30 rounded-xl shadow-glass-lg">
                    <div className="p-2">
                      {section.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "glass-dropdown-item flex items-center space-x-3 px-3 py-2.5 text-sm transition-all duration-200 font-medium",
                            location.pathname === item.path && "active"
                          )}
                        >
                          <Icon name={item.icon} size={16} />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* System Status Indicator */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg glass-container">
            <Icon 
              name={getStatusIcon(systemStatus)} 
              size={16} 
              className={`${getStatusColor(systemStatus)} animate-pulse`}
            />
            <span className="text-xs font-medium text-muted-foreground capitalize">
              {systemStatus}
            </span>
          </div>

          {/* User Menu */}
          <div className="relative user-menu-container">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUserMenuToggle}
              className="flex items-center space-x-2 px-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Icon name="User" size={16} color="white" />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">Admin User</span>
                <span className="text-xs text-muted-foreground">System Administrator</span>
              </div>
              <Icon name="ChevronDown" size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 glass-dropdown-enhanced border border-white/30 rounded-xl shadow-glass-lg animate-fade-in z-200">
                <div className="p-4 border-b border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Icon name="User" size={20} color="white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Admin User</p>
                      <p className="text-xs text-muted-foreground">admin@permissionmatrix.pro</p>
                      <p className="text-xs text-primary font-medium">System Administrator</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <button className="glass-dropdown-item flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-foreground transition-colors font-medium">
                    <Icon name="Settings" size={16} />
                    <span>Account Settings</span>
                  </button>
                  <button className="glass-dropdown-item flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-foreground transition-colors font-medium">
                    <Icon name="Calendar" size={16} />
                    <span>Schedule Audit</span>
                  </button>
                  <button className="glass-dropdown-item flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-foreground transition-colors font-medium">
                    <Icon name="HelpCircle" size={16} />
                    <span>Help & Support</span>
                  </button>
                  <button className="glass-dropdown-item flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-foreground transition-colors font-medium">
                    <Icon name="FileText" size={16} />
                    <span>Documentation</span>
                  </button>
                  <div className="border-t border-white/20 mt-2 pt-2">
                    <button className="glass-dropdown-item flex items-center space-x-3 w-full px-3 py-2.5 text-sm bg-secondary/10 text-primary font-medium">
                      <Icon name="Download" size={16} />
                      <span>Export Reports</span>
                    </button>
                    <button className="glass-dropdown-item flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-error font-medium">
                      <Icon name="LogOut" size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => {/* Mobile menu toggle logic */}}
          >
            <Icon name="Menu" size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;