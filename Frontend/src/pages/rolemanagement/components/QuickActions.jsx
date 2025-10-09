import React from 'react';
import { UserPlus, Upload, Users, Shield, Download, AlertTriangle, Keyboard } from 'lucide-react';
import Button from './ui/Button';

const QuickActions = ({ onActionClick }) => {
  const quickActions = [
    {
      id: 'add-user',
      title: 'Add New User',
      description: 'Create a new user account with role assignment',
      icon: UserPlus,
      color: 'primary',
      shortcut: 'Ctrl+N'
    },
    {
      id: 'bulk-import',
      title: 'Bulk Import Users',
      description: 'Import multiple users from CSV or Excel file',
      icon: Upload,
      color: 'secondary',
      shortcut: 'Ctrl+I'
    },
    {
      id: 'role-assignment',
      title: 'Bulk Role Assignment',
      description: 'Assign roles to multiple users at once',
      icon: Users,
      color: 'accent',
      shortcut: 'Ctrl+R'
    },
    {
      id: 'access-review',
      title: 'Access Review',
      description: 'Review and audit user access permissions',
      icon: Shield,
      color: 'warning',
      shortcut: 'Ctrl+A'
    },
    {
      id: 'export-report',
      title: 'Export Report',
      description: 'Generate compliance and audit reports',
      icon: Download,
      color: 'success',
      shortcut: 'Ctrl+E'
    },
    {
      id: 'emergency-access',
      title: 'Emergency Access',
      description: 'Grant temporary emergency access permissions',
      icon: AlertTriangle,
      color: 'error',
      shortcut: 'Ctrl+Shift+E'
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'primary': return 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20';
      case 'secondary': return 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20';
      case 'accent': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20';
      case 'success': return 'text-green-400 bg-green-500/10 border-green-500/20 hover:bg-green-500/20';
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20 hover:bg-gray-500/20';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
      <div className="p-6 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        <p className="text-sm text-gray-300 mt-1">
          Frequently used administrative tasks
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onActionClick(action.id)}
                className={`p-4 rounded-lg border transition-all duration-200 text-left hover:shadow-md ${getColorClasses(action.color)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getColorClasses(action.color)}`}>
                    <IconComponent size={20} />
                  </div>
                  <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                    {action.shortcut}
                  </span>
                </div>
                
                <h4 className="font-medium text-white mb-2">{action.title}</h4>
                <p className="text-sm text-gray-300">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">
            Use keyboard shortcuts for faster access
          </span>
          <button className="flex items-center space-x-2 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Keyboard size={16} />
            <span>View All Shortcuts</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
