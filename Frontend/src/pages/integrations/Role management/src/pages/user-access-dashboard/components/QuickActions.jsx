import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ onActionClick }) => {
  const quickActions = [
    {
      id: 'add-user',
      title: 'Add New User',
      description: 'Create a new user account with role assignment',
      icon: 'UserPlus',
      color: 'primary',
      shortcut: 'Ctrl+N'
    },
    {
      id: 'bulk-import',
      title: 'Bulk Import Users',
      description: 'Import multiple users from CSV or Excel file',
      icon: 'Upload',
      color: 'secondary',
      shortcut: 'Ctrl+I'
    },
    {
      id: 'role-assignment',
      title: 'Bulk Role Assignment',
      description: 'Assign roles to multiple users at once',
      icon: 'Users',
      color: 'accent',
      shortcut: 'Ctrl+R'
    },
    {
      id: 'access-review',
      title: 'Access Review',
      description: 'Review and audit user access permissions',
      icon: 'Shield',
      color: 'warning',
      shortcut: 'Ctrl+A'
    },
    {
      id: 'export-report',
      title: 'Export Report',
      description: 'Generate compliance and audit reports',
      icon: 'Download',
      color: 'success',
      shortcut: 'Ctrl+E'
    },
    {
      id: 'emergency-access',
      title: 'Emergency Access',
      description: 'Grant temporary emergency access permissions',
      icon: 'AlertTriangle',
      color: 'error',
      shortcut: 'Ctrl+Shift+E'
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'primary': return 'text-primary bg-primary/10 border-primary/20 hover:bg-primary/20';
      case 'secondary': return 'text-secondary bg-secondary/10 border-secondary/20 hover:bg-secondary/20';
      case 'accent': return 'text-accent bg-accent/10 border-accent/20 hover:bg-accent/20';
      case 'warning': return 'text-warning bg-warning/10 border-warning/20 hover:bg-warning/20';
      case 'success': return 'text-success bg-success/10 border-success/20 hover:bg-success/20';
      case 'error': return 'text-error bg-error/10 border-error/20 hover:bg-error/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20 hover:bg-muted/20';
    }
  };

  return (
    <div className="glass-container rounded-xl border border-border/50">
      <div className="p-6 border-b border-border/50">
        <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Frequently used administrative tasks
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onActionClick(action.id)}
              className={`p-4 rounded-lg border transition-all duration-200 text-left hover:shadow-md ${getColorClasses(action.color)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getColorClasses(action.color)}`}>
                  <Icon name={action.icon} size={20} />
                </div>
                <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded">
                  {action.shortcut}
                </span>
              </div>
              
              <h4 className="font-medium text-foreground mb-2">{action.title}</h4>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Use keyboard shortcuts for faster access
          </span>
          <Button variant="ghost" size="sm" iconName="Keyboard">
            View All Shortcuts
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;