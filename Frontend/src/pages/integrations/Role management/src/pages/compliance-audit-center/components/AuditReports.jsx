import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AuditReports = () => {
  const [selectedReport, setSelectedReport] = useState(null);

  const auditReports = [
    {
      id: 'RPT001',
      title: 'SOX Quarterly Compliance Report',
      type: 'sox',
      status: 'completed',
      generatedDate: '2025-07-25',
      generatedBy: 'Sarah Wilson',
      framework: 'SOX',
      period: 'Q2 2025',
      violations: 8,
      riskScore: 92,
      format: 'PDF',
      size: '2.4 MB',
      description: 'Comprehensive quarterly review of financial system access controls and segregation of duties compliance.',
      sections: ['Executive Summary', 'Violation Analysis', 'Risk Assessment', 'Remediation Plan'],
      downloadCount: 12
    },
    {
      id: 'RPT002',
      title: 'GDPR Data Access Audit',
      type: 'gdpr',
      status: 'in_progress',
      generatedDate: '2025-07-26',
      generatedBy: 'Michael Chen',
      framework: 'GDPR',
      period: 'July 2025',
      violations: 15,
      riskScore: 78,
      format: 'Excel',
      size: '5.1 MB',
      description: 'Monthly assessment of personal data access patterns and consent management across all customer-facing systems.',
      sections: ['Data Processing Activities', 'Consent Records', 'Access Logs', 'Breach Analysis'],
      downloadCount: 8
    },
    {
      id: 'RPT003',
      title: 'HIPAA Healthcare Permissions Review',
      type: 'hipaa',
      status: 'completed',
      generatedDate: '2025-07-24',
      generatedBy: 'Lisa Rodriguez',
      framework: 'HIPAA',
      period: 'June 2025',
      violations: 3,
      riskScore: 96,
      format: 'PDF',
      size: '1.8 MB',
      description: 'Monthly review of healthcare data access permissions and minimum necessary access compliance.',
      sections: ['Access Controls', 'Audit Logs', 'Privacy Incidents', 'Training Records'],
      downloadCount: 15
    },
    {
      id: 'RPT004',
      title: 'Custom Framework Assessment',
      type: 'custom',
      status: 'scheduled',
      generatedDate: '2025-07-28',
      generatedBy: 'System Automated',
      framework: 'Custom',
      period: 'July 2025',
      violations: 0,
      riskScore: 0,
      format: 'CSV',
      size: 'Pending',
      description: 'Organization-specific compliance framework assessment covering internal security policies and procedures.',
      sections: ['Policy Compliance', 'Access Reviews', 'Exception Reports', 'Trend Analysis'],
      downloadCount: 0
    },
    {
      id: 'RPT005',
      title: 'Annual Security Compliance Summary',
      type: 'comprehensive',
      status: 'completed',
      generatedDate: '2025-07-20',
      generatedBy: 'David Thompson',
      framework: 'Multi-Framework',
      period: 'FY 2025',
      violations: 42,
      riskScore: 87,
      format: 'PDF',
      size: '8.7 MB',
      description: 'Comprehensive annual report covering all compliance frameworks with executive summary and board presentation materials.',
      sections: ['Executive Summary', 'Framework Analysis', 'Trend Reports', 'Strategic Recommendations'],
      downloadCount: 25
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10 border-success/20';
      case 'in_progress': return 'text-warning bg-warning/10 border-warning/20';
      case 'scheduled': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'failed': return 'text-error bg-error/10 border-error/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'sox': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'gdpr': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'hipaa': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'custom': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      case 'comprehensive': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'PDF': return 'FileText';
      case 'Excel': return 'FileSpreadsheet';
      case 'CSV': return 'Database';
      default: return 'File';
    }
  };

  const handleReportClick = (report) => {
    setSelectedReport(selectedReport?.id === report.id ? null : report);
  };

  const handleDownload = (report, e) => {
    e.stopPropagation();
    // Mock download functionality
    console.log(`Downloading report: ${report.title}`);
  };

  const handleGenerateReport = () => {
    // Mock report generation
    console.log('Generating new audit report...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Icon name="FileText" size={20} className="text-primary" />
          <span>Audit Reports</span>
          <span className="text-sm text-muted-foreground">({auditReports.length})</span>
        </h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" iconName="Calendar" iconPosition="left">
            Schedule Report
          </Button>
          <Button variant="default" size="sm" iconName="Plus" iconPosition="left" onClick={handleGenerateReport}>
            Generate Report
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {auditReports.map((report) => (
          <div key={report.id} className="glass-container border border-border/50">
            <div 
              className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => handleReportClick(report)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <Icon name={getFormatIcon(report.format)} size={16} className="text-primary" />
                    <span className="text-sm font-mono text-muted-foreground">{report.id}</span>
                    <h4 className="text-sm font-semibold text-foreground">{report.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(report.status)} capitalize`}>
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getTypeColor(report.type)}`}>
                        {report.framework}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Icon name="Calendar" size={12} />
                      <span>{report.period}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="User" size={12} />
                      <span>{report.generatedBy}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="Clock" size={12} />
                      <span>{new Date(report.generatedDate).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="Download" size={12} />
                      <span>{report.downloadCount} downloads</span>
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right space-y-1">
                    {report.status === 'completed' && (
                      <>
                        <div className="text-sm font-medium text-foreground">{report.size}</div>
                        <div className="text-xs text-muted-foreground">{report.format}</div>
                      </>
                    )}
                    {report.violations > 0 && (
                      <div className="text-xs text-warning">{report.violations} violations</div>
                    )}
                  </div>
                  
                  {report.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDownload(report, e)}
                      iconName="Download"
                    />
                  )}
                  
                  <Icon 
                    name={selectedReport?.id === report.id ? "ChevronUp" : "ChevronDown"} 
                    size={16} 
                    className="text-muted-foreground" 
                  />
                </div>
              </div>
            </div>

            {selectedReport?.id === report.id && (
              <div className="border-t border-border/50 p-4 bg-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-semibold text-foreground mb-2">Report Sections</h5>
                      <div className="space-y-1">
                        {report.sections.map((section, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Icon name="ChevronRight" size={12} />
                            <span>{section}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {report.status === 'completed' && report.riskScore > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-foreground mb-2">Risk Assessment</h5>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-muted/20 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                report.riskScore >= 90 ? 'bg-success' :
                                report.riskScore >= 70 ? 'bg-warning' : 'bg-error'
                              }`}
                              style={{ width: `${report.riskScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">{report.riskScore}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-foreground">Actions</h5>
                    <div className="flex flex-wrap gap-2">
                      {report.status === 'completed' && (
                        <>
                          <Button variant="default" size="sm" iconName="Download" iconPosition="left">
                            Download
                          </Button>
                          <Button variant="outline" size="sm" iconName="Share" iconPosition="left">
                            Share
                          </Button>
                          <Button variant="outline" size="sm" iconName="Printer" iconPosition="left">
                            Print
                          </Button>
                        </>
                      )}
                      {report.status === 'in_progress' && (
                        <Button variant="outline" size="sm" iconName="Eye" iconPosition="left">
                          View Progress
                        </Button>
                      )}
                      {report.status === 'scheduled' && (
                        <Button variant="outline" size="sm" iconName="Edit" iconPosition="left">
                          Edit Schedule
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" iconName="Copy" iconPosition="left">
                        Duplicate
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

export default AuditReports;