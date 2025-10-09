import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const RequestDetails = ({ request, onApprove, onReject, onEscalate }) => {
  const [approvalComment, setApprovalComment] = useState('');
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);

  if (!request) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Icon name="FileText" size={64} className="text-muted-foreground mb-4 mx-auto" />
          <h3 className="text-lg font-medium text-foreground mb-2">Select a Request</h3>
          <p className="text-sm text-muted-foreground">
            Choose a request from the queue to view details
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-warning bg-warning/10 border-warning/20';
      case 'approved': return 'text-success bg-success/10 border-success/20';
      case 'rejected': return 'text-error bg-error/10 border-error/20';
      case 'escalated': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getRiskLevel = (level) => {
    switch (level) {
      case 'high': return { color: 'text-error', bg: 'bg-error/10', border: 'border-error/20' };
      case 'medium': return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' };
      case 'low': return { color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' };
      default: return { color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = () => {
    onApprove(request.id, approvalComment);
    setApprovalComment('');
  };

  const handleReject = () => {
    onReject(request.id, approvalComment);
    setApprovalComment('');
  };

  const riskStyle = getRiskLevel(request.riskAssessment.level);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Access Request Details
            </h2>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                {request.status}
              </span>
              <span className="text-sm text-muted-foreground">
                ID: {request.id}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Icon name="ExternalLink" size={16} />
            </Button>
            <Button variant="ghost" size="sm">
              <Icon name="MoreVertical" size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Requester Information */}
          <div className="glass-container p-4 rounded-lg">
            <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
              <Icon name="User" size={20} className="mr-2" />
              Requester Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Image
                  src={request.requesterAvatar}
                  alt={request.requesterName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-foreground">{request.requesterName}</p>
                  <p className="text-sm text-muted-foreground">{request.requesterEmail}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Department:</span>
                  <span className="text-sm text-foreground">{request.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Job Title:</span>
                  <span className="text-sm text-foreground">{request.jobTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Manager:</span>
                  <span className="text-sm text-foreground">{request.manager}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="glass-container p-4 rounded-lg">
            <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
              <Icon name="FileText" size={20} className="mr-2" />
              Request Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Resource</label>
                <p className="text-foreground mt-1">{request.resourceName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Access Type</label>
                <p className="text-foreground mt-1">{request.accessType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Justification</label>
                <p className="text-foreground mt-1 leading-relaxed">{request.justification}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                  <p className="text-foreground mt-1">{formatDate(request.submittedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <p className="text-foreground mt-1">{formatDate(request.dueDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="glass-container p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground flex items-center">
                <Icon name="Shield" size={20} className="mr-2" />
                Risk Assessment
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRiskAssessment(!showRiskAssessment)}
              >
                <Icon name={showRiskAssessment ? "ChevronUp" : "ChevronDown"} size={16} />
              </Button>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${riskStyle.color} ${riskStyle.bg} ${riskStyle.border}`}>
                {request.riskAssessment.level} Risk
              </span>
              <span className="text-sm text-muted-foreground">
                Score: {request.riskAssessment.score}/100
              </span>
            </div>

            {showRiskAssessment && (
              <div className="space-y-3">
                {request.riskAssessment.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                    <span className="text-sm text-foreground">{factor.name}</span>
                    <span className={`text-sm font-medium ${
                      factor.impact === 'high' ? 'text-error' :
                      factor.impact === 'medium' ? 'text-warning' : 'text-success'
                    }`}>
                      {factor.impact}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approval Chain */}
          <div className="glass-container p-4 rounded-lg">
            <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
              <Icon name="GitBranch" size={20} className="mr-2" />
              Approval Chain
            </h3>
            <div className="space-y-3">
              {request.approvalChain.map((approver, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-muted/10 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    approver.status === 'approved' ? 'bg-success text-success-foreground' :
                    approver.status === 'pending' ? 'bg-warning text-warning-foreground' :
                    approver.status === 'rejected' ? 'bg-error text-error-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <Icon 
                      name={
                        approver.status === 'approved' ? 'Check' :
                        approver.status === 'pending' ? 'Clock' :
                        approver.status === 'rejected' ? 'X' : 'User'
                      } 
                      size={16} 
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{approver.name}</p>
                    <p className="text-xs text-muted-foreground">{approver.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {approver.status === 'pending' ? 'Pending' : formatDate(approver.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {request.status === 'pending' && (
        <div className="p-6 border-t border-border/50 bg-card/50">
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="Add comments for your decision..."
              className="w-full p-3 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="success"
              onClick={handleApprove}
              iconName="Check"
              iconPosition="left"
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              iconName="X"
              iconPosition="left"
            >
              Reject
            </Button>
            <Button
              variant="outline"
              onClick={() => onEscalate(request.id)}
              iconName="ArrowUp"
              iconPosition="left"
            >
              Escalate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetails;