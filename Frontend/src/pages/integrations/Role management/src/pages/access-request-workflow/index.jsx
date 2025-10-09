import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';

import Button from '../../components/ui/Button';
import RequestQueue from './components/RequestQueue';
import RequestDetails from './components/RequestDetails';
import FilterPanel from './components/FilterPanel';
import BulkApprovalPanel from './components/BulkApprovalPanel';
import WorkflowAnalytics from './components/WorkflowAnalytics';

const AccessRequestWorkflow = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    department: 'all',
    accessTypes: [],
    showOverdue: false,
    showEscalated: false,
    myApprovalsOnly: false,
    dateFrom: '',
    dateTo: ''
  });

  // Mock data for access requests
  const [requests, setRequests] = useState([
    {
      id: 'REQ-2025-001',
      requesterName: 'Sarah Johnson',
      requesterEmail: 'sarah.johnson@company.com',
      requesterAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      department: 'Engineering',
      jobTitle: 'Senior Software Engineer',
      manager: 'Michael Chen',
      resourceName: 'Production Database Access',
      accessType: 'Read/Write',
      priority: 'high',
      status: 'pending',
      justification: `I need access to the production database to investigate and resolve critical performance issues affecting our main application. The current slowdown is impacting customer experience and requires immediate attention to identify bottlenecks in our query execution.`,
      submittedAt: '2025-01-27T09:30:00Z',
      dueDate: '2025-01-29T17:00:00Z',
      riskAssessment: {
        level: 'medium',
        score: 65,
        factors: [
          { name: 'Data Sensitivity', impact: 'high' },
          { name: 'User Experience', impact: 'high' },
          { name: 'Access Duration', impact: 'medium' },
          { name: 'User Role', impact: 'low' }
        ]
      },
      approvalChain: [
        { name: 'Michael Chen', role: 'Engineering Manager', status: 'approved', timestamp: '2025-01-27T10:15:00Z' },
        { name: 'David Wilson', role: 'IT Security Lead', status: 'pending', timestamp: null },
        { name: 'Emily Davis', role: 'CISO', status: 'pending', timestamp: null }
      ]
    },
    {
      id: 'REQ-2025-002',
      requesterName: 'Alex Rodriguez',
      requesterEmail: 'alex.rodriguez@company.com',
      requesterAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      department: 'Marketing',
      jobTitle: 'Marketing Analyst',
      manager: 'Lisa Thompson',
      resourceName: 'Analytics Dashboard',
      accessType: 'Read Only',
      priority: 'medium',
      status: 'approved',
      justification: `I require read-only access to the analytics dashboard to prepare monthly performance reports and analyze campaign effectiveness for the upcoming quarterly review meeting.`,
      submittedAt: '2025-01-26T14:20:00Z',
      dueDate: '2025-01-28T17:00:00Z',
      riskAssessment: {
        level: 'low',
        score: 25,
        factors: [
          { name: 'Data Sensitivity', impact: 'low' },
          { name: 'Access Type', impact: 'low' },
          { name: 'User Role', impact: 'low' },
          { name: 'Business Need', impact: 'medium' }
        ]
      },
      approvalChain: [
        { name: 'Lisa Thompson', role: 'Marketing Manager', status: 'approved', timestamp: '2025-01-26T15:30:00Z' },
        { name: 'David Wilson', role: 'IT Security Lead', status: 'approved', timestamp: '2025-01-27T08:45:00Z' }
      ]
    },
    {
      id: 'REQ-2025-003',
      requesterName: 'Jennifer Kim',
      requesterEmail: 'jennifer.kim@company.com',
      requesterAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      department: 'Sales',
      jobTitle: 'Sales Director',
      manager: 'Robert Brown',
      resourceName: 'CRM Admin Panel',
      accessType: 'Administrative',
      priority: 'critical',
      status: 'escalated',
      justification: `Urgent access needed to CRM admin panel to resolve data synchronization issues affecting our Q1 sales pipeline. Multiple deals are at risk due to incorrect customer information and missing contact details.`,
      submittedAt: '2025-01-25T16:45:00Z',
      dueDate: '2025-01-27T12:00:00Z',
      riskAssessment: {
        level: 'high',
        score: 85,
        factors: [
          { name: 'Admin Privileges', impact: 'high' },
          { name: 'Data Modification', impact: 'high' },
          { name: 'Business Impact', impact: 'high' },
          { name: 'Urgency', impact: 'high' }
        ]
      },
      approvalChain: [
        { name: 'Robert Brown', role: 'VP Sales', status: 'approved', timestamp: '2025-01-25T17:20:00Z' },
        { name: 'David Wilson', role: 'IT Security Lead', status: 'pending', timestamp: null },
        { name: 'Emily Davis', role: 'CISO', status: 'pending', timestamp: null }
      ]
    },
    {
      id: 'REQ-2025-004',
      requesterName: 'Mark Thompson',
      requesterEmail: 'mark.thompson@company.com',
      requesterAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      department: 'HR',
      jobTitle: 'HR Specialist',
      manager: 'Amanda White',
      resourceName: 'Employee Records System',
      accessType: 'Read Only',
      priority: 'low',
      status: 'rejected',
      justification: `I need access to employee records to prepare annual performance review documentation and update organizational charts for the upcoming restructuring initiative.`,
      submittedAt: '2025-01-24T11:30:00Z',
      dueDate: '2025-01-30T17:00:00Z',
      riskAssessment: {
        level: 'medium',
        score: 55,
        factors: [
          { name: 'Personal Data', impact: 'high' },
          { name: 'Access Type', impact: 'low' },
          { name: 'User Role', impact: 'medium' },
          { name: 'Data Volume', impact: 'medium' }
        ]
      },
      approvalChain: [
        { name: 'Amanda White', role: 'HR Manager', status: 'approved', timestamp: '2025-01-24T13:15:00Z' },
        { name: 'David Wilson', role: 'IT Security Lead', status: 'rejected', timestamp: '2025-01-25T09:30:00Z' }
      ]
    },
    {
      id: 'REQ-2025-005',
      requesterName: 'Carlos Martinez',
      requesterEmail: 'carlos.martinez@company.com',
      requesterAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      department: 'Finance',
      jobTitle: 'Financial Analyst',
      manager: 'Patricia Lee',
      resourceName: 'Financial Reporting System',
      accessType: 'Read/Write',
      priority: 'high',
      status: 'pending',
      justification: `Access required to financial reporting system to complete quarterly financial statements and prepare budget variance analysis for the board meeting scheduled next week.`,
      submittedAt: '2025-01-27T08:15:00Z',
      dueDate: '2025-01-30T17:00:00Z',
      riskAssessment: {
        level: 'high',
        score: 78,
        factors: [
          { name: 'Financial Data', impact: 'high' },
          { name: 'Regulatory Compliance', impact: 'high' },
          { name: 'Access Type', impact: 'medium' },
          { name: 'User Role', impact: 'medium' }
        ]
      },
      approvalChain: [
        { name: 'Patricia Lee', role: 'Finance Manager', status: 'approved', timestamp: '2025-01-27T09:00:00Z' },
        { name: 'David Wilson', role: 'IT Security Lead', status: 'pending', timestamp: null },
        { name: 'Emily Davis', role: 'CISO', status: 'pending', timestamp: null }
      ]
    },
    {
      id: 'REQ-2025-006',
      requesterName: 'Rachel Green',
      requesterEmail: 'rachel.green@company.com',
      requesterAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      department: 'Operations',
      jobTitle: 'Operations Coordinator',
      manager: 'James Wilson',
      resourceName: 'Inventory Management System',
      accessType: 'Read Only',
      priority: 'medium',
      status: 'pending',
      justification: `I need read-only access to the inventory management system to track supply chain metrics and prepare monthly operational reports for management review.`,
      submittedAt: '2025-01-27T13:45:00Z',
      dueDate: '2025-01-31T17:00:00Z',
      riskAssessment: {
        level: 'low',
        score: 35,
        factors: [
          { name: 'Data Sensitivity', impact: 'medium' },
          { name: 'Access Type', impact: 'low' },
          { name: 'User Role', impact: 'low' },
          { name: 'Business Need', impact: 'medium' }
        ]
      },
      approvalChain: [
        { name: 'James Wilson', role: 'Operations Manager', status: 'pending', timestamp: null }
      ]
    }
  ]);

  const requestStats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    escalated: requests.filter(r => r.status === 'escalated').length,
    critical: requests.filter(r => r.priority === 'critical').length,
    high: requests.filter(r => r.priority === 'high').length,
    medium: requests.filter(r => r.priority === 'medium').length,
    low: requests.filter(r => r.priority === 'low').length
  };

  const handleRequestSelect = (request) => {
    setSelectedRequest(request);
  };

  const handleBulkSelect = (requestId, isSelected) => {
    if (isSelected) {
      setSelectedRequests([...selectedRequests, requestId]);
    } else {
      setSelectedRequests(selectedRequests.filter(id => id !== requestId));
    }
  };

  const handleApprove = (requestId, comment) => {
    setRequests(requests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'approved' }
        : req
    ));
    if (selectedRequest?.id === requestId) {
      setSelectedRequest({ ...selectedRequest, status: 'approved' });
    }
  };

  const handleReject = (requestId, comment) => {
    setRequests(requests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'rejected' }
        : req
    ));
    if (selectedRequest?.id === requestId) {
      setSelectedRequest({ ...selectedRequest, status: 'rejected' });
    }
  };

  const handleEscalate = (requestId) => {
    setRequests(requests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'escalated' }
        : req
    ));
    if (selectedRequest?.id === requestId) {
      setSelectedRequest({ ...selectedRequest, status: 'escalated' });
    }
  };

  const handleBulkApprove = (requestIds, comment) => {
    setRequests(requests.map(req => 
      requestIds.includes(req.id) 
        ? { ...req, status: 'approved' }
        : req
    ));
    setSelectedRequests([]);
  };

  const handleBulkReject = (requestIds, comment) => {
    setRequests(requests.map(req => 
      requestIds.includes(req.id) 
        ? { ...req, status: 'rejected' }
        : req
    ));
    setSelectedRequests([]);
  };

  const handleBulkEscalate = (requestIds, comment) => {
    setRequests(requests.map(req => 
      requestIds.includes(req.id) 
        ? { ...req, status: 'escalated' }
        : req
    ));
    setSelectedRequests([]);
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      department: 'all',
      accessTypes: [],
      showOverdue: false,
      showEscalated: false,
      myApprovalsOnly: false,
      dateFrom: '',
      dateTo: ''
    });
  };

  // Auto-select first request on load
  useEffect(() => {
    if (requests.length > 0 && !selectedRequest) {
      setSelectedRequest(requests[0]);
    }
  }, [requests, selectedRequest]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-full mx-auto p-6">
          <div className="mb-6">
            <Breadcrumb />
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Access Request Workflow
                </h1>
                <p className="text-muted-foreground">
                  Streamline permission requests and approval processes with automated routing and comprehensive tracking
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  iconName={showFilters ? "EyeOff" : "Eye"}
                  iconPosition="left"
                >
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowAnalytics(true)}
                  iconName="BarChart3"
                  iconPosition="left"
                >
                  Analytics
                </Button>
                
                <Button
                  variant="default"
                  iconName="Plus"
                  iconPosition="left"
                >
                  New Request
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="glass-container p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-foreground">{requestStats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="glass-container p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-warning">{requestStats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="glass-container p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-success">{requestStats.approved}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
            <div className="glass-container p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-error">{requestStats.rejected}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </div>
            <div className="glass-container p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-400">{requestStats.escalated}</div>
              <div className="text-xs text-muted-foreground">Escalated</div>
            </div>
            <div className="glass-container p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-error">{requestStats.critical}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex gap-6 h-[calc(100vh-300px)]">
            {/* Filters Panel */}
            {showFilters && (
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
                requestStats={requestStats}
              />
            )}

            {/* Request Queue */}
            <div className="w-96 glass-container rounded-lg">
              <RequestQueue
                requests={requests}
                selectedRequest={selectedRequest}
                onRequestSelect={handleRequestSelect}
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            {/* Request Details */}
            <div className="flex-1 glass-container rounded-lg">
              <RequestDetails
                request={selectedRequest}
                onApprove={handleApprove}
                onReject={handleReject}
                onEscalate={handleEscalate}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Bulk Approval Panel */}
      <BulkApprovalPanel
        selectedRequests={selectedRequests}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onBulkEscalate={handleBulkEscalate}
        onClearSelection={() => setSelectedRequests([])}
        allRequests={requests}
      />

      {/* Analytics Modal */}
      <WorkflowAnalytics
        isVisible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </div>
  );
};

export default AccessRequestWorkflow;