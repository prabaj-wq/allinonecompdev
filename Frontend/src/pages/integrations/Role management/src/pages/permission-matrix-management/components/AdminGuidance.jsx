import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AdminGuidance = () => {
  const [activeSection, setActiveSection] = useState('legend');

  const sections = [
    { id: 'legend', label: 'Permission Legend', icon: 'Info' },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: 'Keyboard' },
    { id: 'best-practices', label: 'Best Practices', icon: 'CheckCircle' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: 'HelpCircle' }
  ];

  const permissionLegend = [
    {
      state: 'none',
      color: 'bg-red-500/40 text-red-100 border-red-400/30',
      icon: 'X',
      title: 'No Access',
      description: 'User cannot view or interact with this module'
    },
    {
      state: 'read',
      color: 'bg-blue-500/40 text-blue-100 border-blue-400/30',
      icon: 'Eye',
      title: 'Read Access',
      description: 'User can view data but cannot make changes'
    },
    {
      state: 'write',
      color: 'bg-emerald-500/40 text-emerald-100 border-emerald-400/30',
      icon: 'Edit',
      title: 'Write Access',
      description: 'User can view and modify data in this module'
    }
  ];

  const shortcuts = [
    { key: 'Space', action: 'Toggle permission state for selected cell' },
    { key: '↑↓←→', action: 'Navigate between matrix cells' },
    { key: 'Ctrl + S', action: 'Save current permission changes' },
    { key: 'Ctrl + Z', action: 'Undo last permission change' },
    { key: 'Ctrl + A', action: 'Select all roles' },
    { key: 'Esc', action: 'Clear current selection' }
  ];

  const bestPractices = [
    {
      title: 'Principle of Least Privilege',
      description: 'Grant users the minimum permissions necessary to perform their job functions.',
      icon: 'Shield'
    },
    {
      title: 'Regular Access Reviews',
      description: 'Conduct quarterly reviews of user permissions to ensure they remain appropriate.',
      icon: 'Calendar'
    },
    {
      title: 'Role-Based Assignment',
      description: 'Assign permissions based on job roles rather than individual user requests.',
      icon: 'Users'
    },
    {
      title: 'Document Changes',
      description: 'Always document the business justification for permission changes.',
      icon: 'FileText'
    }
  ];

  const troubleshootingTips = [
    {
      issue: 'Permission changes not saving',
      solution: 'Check network connectivity and ensure you have admin privileges.',
      icon: 'AlertTriangle'
    },
    {
      issue: 'Matrix loading slowly',
      solution: 'Use filters to reduce the number of displayed roles and modules.',
      icon: 'Clock'
    },
    {
      issue: 'Bulk operations failing',
      solution: 'Reduce selection size and try again. Maximum 50 roles per bulk operation.',
      icon: 'AlertCircle'
    },
    {
      issue: 'Export not working',
      solution: 'Ensure pop-ups are enabled and check browser download settings.',
      icon: 'Download'
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'legend':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Permission States</h3>
            {permissionLegend.map((item) => (
              <div key={item.state} className="flex items-start space-x-3 p-3 rounded-lg glass-container">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${item.color}`}>
                  <Icon name={item.icon} size={14} />
                </div>
                <div>
                  <div className="font-medium text-foreground">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start space-x-2">
                <Icon name="Lightbulb" size={16} className="text-primary mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Quick Tip</div>
                  <div className="text-sm text-muted-foreground">
                    Click any permission cell to cycle through states: None → Read → Write
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Keyboard Shortcuts</h3>
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg glass-container">
                <div className="text-sm text-muted-foreground">{shortcut.action}</div>
                <div className="flex items-center space-x-1">
                  {shortcut.key.split(' + ').map((key, keyIndex) => (
                    <React.Fragment key={keyIndex}>
                      {keyIndex > 0 && <span className="text-muted-foreground">+</span>}
                      <kbd className="px-2 py-1 text-xs font-mono bg-muted text-muted-foreground rounded border">
                        {key}
                      </kbd>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'best-practices':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Security Best Practices</h3>
            {bestPractices.map((practice, index) => (
              <div key={index} className="p-4 rounded-lg glass-container">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Icon name={practice.icon} size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground mb-1">{practice.title}</div>
                    <div className="text-sm text-muted-foreground">{practice.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'troubleshooting':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Common Issues</h3>
            {troubleshootingTips.map((tip, index) => (
              <div key={index} className="p-4 rounded-lg glass-container">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                    <Icon name={tip.icon} size={16} className="text-warning" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground mb-1">{tip.issue}</div>
                    <div className="text-sm text-muted-foreground">{tip.solution}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="glass-container border border-border/50 rounded-xl p-6 h-fit">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="BookOpen" size={20} className="text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Administrator Guide</h2>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-col space-y-2 mb-6">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveSection(section.id)}
            iconName={section.icon}
            iconPosition="left"
            className="justify-start"
          >
            {section.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-border/30">
        <div className="text-sm font-medium text-foreground mb-3">Quick Actions</div>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
            className="w-full justify-start"
          >
            Download User Manual
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="MessageCircle"
            iconPosition="left"
            className="w-full justify-start"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminGuidance;