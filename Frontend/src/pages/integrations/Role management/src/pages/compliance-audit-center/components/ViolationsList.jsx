import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ViolationsList = () => {
  const [selectedViolation, setSelectedViolation] = useState(null);

  const violations = [
    {
      id: 'V001',
      title: 'Excessive Financial System Access',
      severity: 'high',
      framework: 'SOX',
      department: 'Finance',
      user: 'John Smith',
      system: 'ERP Financial Module',
      description: 'User has both read and write access to financial reporting modules without proper segregation of duties approval.',
      riskScore: 85,
      detectedDate: '2025-07-26',
      status: 'open',
      recommendedAction: 'Remove write access and implement approval workflow for financial data modifications.',
      affectedRecords: 1247
    },
    {
      id: 'V002',
      title: 'GDPR Data Access Without Consent',
      severity: 'critical',
      framework: 'GDPR',
      department: 'Marketing',
      user: 'Sarah Johnson',
      system: 'Customer Database',
      description: 'Access to personal data of EU customers without documented consent or legitimate business purpose.',
      riskScore: 95,
      detectedDate: '2025-07-25',
      status: 'in_progress',
      recommendedAction: 'Immediately revoke access and conduct data processing impact assessment.',
      affectedRecords: 3421
    },
    {
      id: 'V003',
      title: 'Dormant Account with Admin Rights',
      severity: 'medium',
      framework: 'Custom',
      department: 'IT',
      user: 'Michael Brown',
      system: 'Active Directory',
      description: 'User account inactive for 90+ days but retains administrative privileges across multiple systems.',
      riskScore: 72,
      detectedDate: '2025-07-24',
      status: 'resolved',
      recommendedAction: 'Disable account and transfer administrative responsibilities to active personnel.',
      affectedRecords: 0
    },
    {
      id: 'V004',
      title: 'Healthcare Data Unauthorized Access',
      severity: 'high',
      framework: 'HIPAA',
      department: 'Operations',
      user: 'Lisa Davis',
      system: 'Patient Records System',
      description: 'Non-healthcare personnel accessing patient medical records without business justification.',
      riskScore: 88,
      detectedDate: '2025-07-23',
      status: 'open',
      recommendedAction: 'Revoke access immediately and conduct privacy impact assessment.',
      affectedRecords: 892
    },
    {
      id: 'V005',
      title: 'Conflicting Role Assignments',
      severity: 'medium',
      framework: 'SOX',
      department: 'Finance',
      user: 'Robert Wilson',
      system: 'Accounting System',
      description: 'User assigned both accounts payable and accounts receivable roles, violating segregation of duties.',
      riskScore: 76,
      detectedDate: '2025-07-22',
      status: 'in_progress',
      recommendedAction: 'Remove one role assignment and implement compensating controls.',
      affectedRecords: 567
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-error bg-error/10 border-error/20';
      case 'in_progress': return 'text-warning bg-warning/10 border-warning/20';
      case 'resolved': return 'text-success bg-success/10 border-success/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getFrameworkColor = (framework) => {
    switch (framework) {
      case 'SOX': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'GDPR': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'HIPAA': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'Custom': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const handleViolationClick = (violation) => {
    setSelectedViolation(selectedViolation?.id === violation.id ? null : violation);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Icon name="AlertTriangle" size={20} className="text-warning" />
          <span>Policy Violations</span>
          <span className="text-sm text-muted-foreground">({violations.length})</span>
        </h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" iconName="Download" iconPosition="left">
            Export
          </Button>
          <Button variant="outline" size="sm" iconName="RefreshCw" iconPosition="left">
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {violations.map((violation) => (
          <div key={violation.id} className="glass-container border border-border/50">
            <div 
              className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => handleViolationClick(violation)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-mono text-muted-foreground">{violation.id}</span>
                    <h4 className="text-sm font-semibold text-foreground">{violation.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getSeverityColor(violation.severity)} capitalize`}>
                        {violation.severity}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getFrameworkColor(violation.framework)}`}>
                        {violation.framework}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(violation.status)} capitalize`}>
                        {violation.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Icon name="User" size={12} />
                      <span>{violation.user}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="Building" size={12} />
                      <span>{violation.department}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="Server" size={12} />
                      <span>{violation.system}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="Calendar" size={12} />
                      <span>{new Date(violation.detectedDate).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">{violation.description}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">{violation.riskScore}</div>
                    <div className="text-xs text-muted-foreground">Risk Score</div>
                  </div>
                  <Icon 
                    name={selectedViolation?.id === violation.id ? "ChevronUp" : "ChevronDown"} 
                    size={16} 
                    className="text-muted-foreground" 
                  />
                </div>
              </div>
            </div>

            {selectedViolation?.id === violation.id && (
              <div className="border-t border-border/50 p-4 bg-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-semibold text-foreground mb-2">Recommended Action</h5>
                      <p className="text-sm text-muted-foreground">{violation.recommendedAction}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h6 className="text-xs font-medium text-foreground mb-1">Affected Records</h6>
                        <p className="text-sm text-muted-foreground">{violation.affectedRecords.toLocaleString()}</p>
                      </div>
                      <div>
                        <h6 className="text-xs font-medium text-foreground mb-1">Detection Date</h6>
                        <p className="text-sm text-muted-foreground">{new Date(violation.detectedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-foreground">Actions</h5>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="destructive" size="sm" iconName="UserX" iconPosition="left">
                        Revoke Access
                      </Button>
                      <Button variant="warning" size="sm" iconName="AlertTriangle" iconPosition="left">
                        Create Ticket
                      </Button>
                      <Button variant="outline" size="sm" iconName="FileText" iconPosition="left">
                        Generate Report
                      </Button>
                      <Button variant="ghost" size="sm" iconName="MessageSquare" iconPosition="left">
                        Add Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViolationsList;