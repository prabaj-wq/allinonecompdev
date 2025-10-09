import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const WorkflowAnalytics = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isVisible) return null;

  // Mock analytics data
  const approvalMetrics = [
    { name: 'Jan', approved: 45, rejected: 8, pending: 12, avgTime: 2.3 },
    { name: 'Feb', approved: 52, rejected: 6, pending: 15, avgTime: 2.1 },
    { name: 'Mar', approved: 48, rejected: 9, pending: 18, avgTime: 2.8 },
    { name: 'Apr', approved: 61, rejected: 4, pending: 14, avgTime: 1.9 },
    { name: 'May', approved: 55, rejected: 7, pending: 16, avgTime: 2.2 },
    { name: 'Jun', approved: 58, rejected: 5, pending: 13, avgTime: 2.0 }
  ];

  const departmentData = [
    { name: 'Engineering', value: 35, color: '#8B5CF6' },
    { name: 'Sales', value: 25, color: '#3B82F6' },
    { name: 'Marketing', value: 20, color: '#10B981' },
    { name: 'HR', value: 12, color: '#F59E0B' },
    { name: 'Finance', value: 8, color: '#EF4444' }
  ];

  const processingTimeData = [
    { name: 'Week 1', avgTime: 2.1, target: 2.0 },
    { name: 'Week 2', avgTime: 2.3, target: 2.0 },
    { name: 'Week 3', avgTime: 1.8, target: 2.0 },
    { name: 'Week 4', avgTime: 2.0, target: 2.0 }
  ];

  const riskDistribution = [
    { name: 'Low Risk', value: 60, color: '#10B981' },
    { name: 'Medium Risk', value: 30, color: '#F59E0B' },
    { name: 'High Risk', value: 10, color: '#EF4444' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'BarChart3' },
    { id: 'performance', label: 'Performance', icon: 'TrendingUp' },
    { id: 'compliance', label: 'Compliance', icon: 'Shield' },
    { id: 'insights', label: 'Insights', icon: 'Brain' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-container p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Icon name="Clock" size={20} className="text-primary" />
            <span className="text-xs text-success">↓ 12%</span>
          </div>
          <div className="text-2xl font-bold text-foreground">2.1</div>
          <div className="text-sm text-muted-foreground">Avg Processing Days</div>
        </div>
        
        <div className="glass-container p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Icon name="CheckCircle" size={20} className="text-success" />
            <span className="text-xs text-success">↑ 8%</span>
          </div>
          <div className="text-2xl font-bold text-foreground">94%</div>
          <div className="text-sm text-muted-foreground">Approval Rate</div>
        </div>
        
        <div className="glass-container p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Icon name="Users" size={20} className="text-blue-400" />
            <span className="text-xs text-warning">↑ 15%</span>
          </div>
          <div className="text-2xl font-bold text-foreground">127</div>
          <div className="text-sm text-muted-foreground">Active Requests</div>
        </div>
        
        <div className="glass-container p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Icon name="AlertTriangle" size={20} className="text-warning" />
            <span className="text-xs text-error">↑ 3%</span>
          </div>
          <div className="text-2xl font-bold text-foreground">8</div>
          <div className="text-sm text-muted-foreground">Overdue Requests</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-container p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Approval Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approvalMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="approved" fill="#10B981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="rejected" fill="#EF4444" radius={[2, 2, 0, 0]} />
                <Bar dataKey="pending" fill="#F59E0B" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-container p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4">Requests by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {departmentData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-container p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4">Processing Time Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processingTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="avgTime" stroke="#8B5CF6" strokeWidth={3} />
                <Line type="monotone" dataKey="target" stroke="#10B981" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-container p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4">Risk Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="glass-container p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">Approver Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Approver</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Requests</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Avg Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Approval Rate</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Sarah Johnson', requests: 45, avgTime: 1.8, rate: 96, status: 'excellent' },
                { name: 'Michael Chen', requests: 38, avgTime: 2.1, rate: 94, status: 'good' },
                { name: 'Emily Davis', requests: 52, avgTime: 2.4, rate: 92, status: 'good' },
                { name: 'David Wilson', requests: 29, avgTime: 3.2, rate: 88, status: 'needs-improvement' }
              ].map((approver, index) => (
                <tr key={index} className="border-b border-border/20">
                  <td className="py-3 px-4 text-sm text-foreground">{approver.name}</td>
                  <td className="py-3 px-4 text-sm text-foreground">{approver.requests}</td>
                  <td className="py-3 px-4 text-sm text-foreground">{approver.avgTime} days</td>
                  <td className="py-3 px-4 text-sm text-foreground">{approver.rate}%</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      approver.status === 'excellent' ? 'bg-success/10 text-success border border-success/20' :
                      approver.status === 'good'? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-warning/10 text-warning border border-warning/20'
                    }`}>
                      {approver.status === 'excellent' ? 'Excellent' :
                       approver.status === 'good' ? 'Good' : 'Needs Improvement'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl h-[90vh] glass-enhanced rounded-xl border border-border/50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Workflow Analytics</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive insights into approval workflows and performance metrics
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon name="X" size={20} />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6 bg-muted/10 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'performance' && renderPerformance()}
          {activeTab === 'compliance' && (
            <div className="text-center py-12">
              <Icon name="Shield" size={64} className="text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-medium text-foreground mb-2">Compliance Analytics</h3>
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </div>
          )}
          {activeTab === 'insights' && (
            <div className="text-center py-12">
              <Icon name="Brain" size={64} className="text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-medium text-foreground mb-2">AI Insights</h3>
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowAnalytics;