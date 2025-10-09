import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { 
  Shield, ChevronDown, Grid3X3, UserCog, Users, FileText, Activity, 
  CheckCircle, AlertTriangle, XCircle, Circle, User, Settings, 
  Calendar, HelpCircle, Download, LogOut, Menu 
} from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
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
        { label: 'Permission Matrix', path: '/rolemanagement/permission-matrix-management', icon: Grid3X3 },
        { label: 'Role Profiles', path: '/rolemanagement/role-profile-management', icon: UserCog }
      ]
    },
    {
      label: 'Users',
      items: [
        { label: 'Access Dashboard', path: '/rolemanagement/user-access-dashboard', icon: Users },
        { label: 'Access Requests', path: '/rolemanagement/access-request-workflow', icon: FileText }
      ]
    },
    {
      label: 'System',
      items: [
        { label: 'Integration Monitor', path: '/rolemanagement/system-integration-monitor', icon: Activity },
        { label: 'Compliance Audit', path: '/rolemanagement/compliance-audit-center', icon: Shield }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      default: return Circle;
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-sm border-b border-white/20">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo Section */}
        <div className="flex items-center space-x-8">
          <Link to="/rolemanagement" className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Shield size={20} color="white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-white">Role Management</span>
              <span className="text-xs text-gray-300 -mt-1">Pro</span>
            </div>
          </Link>

          {/* Primary Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((section) => (
              <div key={section.label} className="relative group">
                <button
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActiveSection(section.items)
                      ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{section.label}</span>
                  <ChevronDown size={16} className="transition-transform group-hover:rotate-180" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl shadow-xl">
                    <div className="p-2">
                      {section.items.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-3 py-2.5 text-sm transition-all duration-200 font-medium rounded-lg ${
                              location.pathname === item.path 
                                ? 'bg-blue-500/20 text-blue-300' 
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <IconComponent size={16} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
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
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
            {(() => {
              const StatusIcon = getStatusIcon(systemStatus);
              return (
                <StatusIcon 
                  size={16} 
                  className={`${getStatusColor(systemStatus)} animate-pulse`}
                />
              );
            })()}
            <span className="text-xs font-medium text-gray-300 capitalize">
              {systemStatus}
            </span>
          </div>

          {/* User Menu */}
          <div className="relative user-menu-container">
            <button
              onClick={handleUserMenuToggle}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User size={16} color="white" />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-white">{user?.username || 'Admin User'}</span>
                <span className="text-xs text-gray-300">System Administrator</span>
              </div>
              <ChevronDown size={16} className={`text-gray-300 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User size={20} color="white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user?.username || 'Admin User'}</p>
                      <p className="text-xs text-gray-300">{user?.email || 'admin@company.com'}</p>
                      <p className="text-xs text-blue-400 font-medium">System Administrator</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <button className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                    <Settings size={16} />
                    <span>Account Settings</span>
                  </button>
                  <button className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                    <Calendar size={16} />
                    <span>Schedule Audit</span>
                  </button>
                  <button className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                    <HelpCircle size={16} />
                    <span>Help & Support</span>
                  </button>
                  <button className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium">
                    <FileText size={16} />
                    <span>Documentation</span>
                  </button>
                  <div className="border-t border-white/20 mt-2 pt-2">
                    <button className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors font-medium">
                      <Download size={16} />
                      <span>Export Reports</span>
                    </button>
                    <button 
                      onClick={logout}
                      className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <Menu size={20} className="text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
