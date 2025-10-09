import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ComplianceMetrics from './components/ComplianceMetrics';
import AuditFilters from './components/AuditFilters';
import ComplianceTabs from './components/ComplianceTabs';
import IntegrationStatus from './components/IntegrationStatus';

const ComplianceAuditCenter = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filters, setFilters] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    console.log('Filters updated:', newFilters);
  };

  const handleExportCompliance = async () => {
    setIsExporting(true);
    // Mock export delay
    setTimeout(() => {
      setIsExporting(false);
      console.log('Compliance data exported');
    }, 3000);
  };

  const handleScheduleAudit = () => {
    console.log('Opening audit scheduling dialog');
  };

  const handleEmergencyAccess = () => {
    console.log('Initiating emergency access procedure');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />
          
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Icon name="Shield" size={24} color="white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Compliance Audit Center</h1>
                  <p className="text-muted-foreground">
                    Comprehensive compliance monitoring and audit reporting for regulatory requirements
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Icon name="Clock" size={16} />
                  <span>Last updated: {currentTime.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="Database" size={16} />
                  <span>Real-time monitoring active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleEmergencyAccess}
                iconName="AlertTriangle"
                iconPosition="left"
              >
                Emergency Access
              </Button>
              <Button
                variant="outline"
                onClick={handleScheduleAudit}
                iconName="Calendar"
                iconPosition="left"
              >
                Schedule Audit
              </Button>
              <Button
                variant="default"
                onClick={handleExportCompliance}
                loading={isExporting}
                iconName="Download"
                iconPosition="left"
              >
                Export Report
              </Button>
            </div>
          </div>

          {/* Quick Metrics Overview */}
          <div className="mb-8">
            <ComplianceMetrics />
          </div>

          {/* Audit Filters */}
          <div className="mb-8">
            <AuditFilters onFiltersChange={handleFiltersChange} />
          </div>

          {/* Main Content Tabs */}
          <div className="mb-8">
            <ComplianceTabs />
          </div>

          {/* Integration Status */}
          <div className="mb-8">
            <IntegrationStatus />
          </div>

          {/* Administrator Guidance Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              {/* Additional content area for future expansion */}
              <div className="glass-container p-6 border border-border/50">
                <div className="text-center py-12">
                  <Icon name="CheckCircle" size={48} className="text-success mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Compliance Monitoring Active
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    All compliance frameworks are being monitored in real-time. 
                    Use the tabs above to explore detailed compliance data, violations, and reports.
                  </p>
                </div>
              </div>
            </div>

            {/* Guidance Sidebar */}
            <div className="space-y-6">
              {/* Usage Instructions */}
              <div className="glass-container p-4 border border-border/50">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
                  <Icon name="HelpCircle" size={16} className="text-primary" />
                  <span>Quick Guide</span>
                </h4>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-start space-x-2">
                    <Icon name="Circle" size={8} className="mt-1 text-primary" />
                    <span>Use filters to scope audit analysis by date, department, or framework</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Icon name="Circle" size={8} className="mt-1 text-primary" />
                    <span>Click violations for detailed remediation recommendations</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Icon name="Circle" size={8} className="mt-1 text-primary" />
                    <span>Generate reports for regulatory submissions and board presentations</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Icon name="Circle" size={8} className="mt-1 text-primary" />
                    <span>Monitor integration status for data synchronization health</span>
                  </div>
                </div>
              </div>

              {/* Visual Legend */}
              <div className="glass-container p-4 border border-border/50">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
                  <Icon name="Palette" size={16} className="text-primary" />
                  <span>Status Legend</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                    <span className="text-muted-foreground">Compliant (90%+)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-warning"></div>
                    <span className="text-muted-foreground">Warning (70-89%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-error"></div>
                    <span className="text-muted-foreground">Non-compliant (&lt;70%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">In Progress</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-container p-4 border border-border/50">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
                  <Icon name="Zap" size={16} className="text-primary" />
                  <span>Quick Actions</span>
                </h4>
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs" iconName="FileText" iconPosition="left">
                    Generate Executive Summary
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs" iconName="Mail" iconPosition="left">
                    Email Compliance Report
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs" iconName="Calendar" iconPosition="left">
                    Schedule Recurring Audit
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs" iconName="Bell" iconPosition="left">
                    Configure Alerts
                  </Button>
                </div>
              </div>

              {/* Compliance Statistics */}
              <div className="glass-container p-4 border border-border/50">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
                  <Icon name="BarChart3" size={16} className="text-primary" />
                  <span>This Month</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Audits Completed</span>
                    <span className="font-semibold text-foreground">24</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Violations Resolved</span>
                    <span className="font-semibold text-success">18</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Reports Generated</span>
                    <span className="font-semibold text-foreground">12</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Avg. Response Time</span>
                    <span className="font-semibold text-foreground">2.3h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComplianceAuditCenter;