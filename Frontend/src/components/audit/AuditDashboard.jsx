import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Building,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Shield,
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  FileCheck,
  Clock3,
  Database,
  Settings,
  MoreHorizontal,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import AuditService from '../../services/auditService';

const AuditDashboard = ({ dashboardData, recentActivity }) => {
  const metrics = [
    {
      title: 'Total Engagements',
      value: dashboardData.engagements.total,
      change: '+12%',
      changeType: 'positive',
      icon: Building,
      color: 'blue'
    },
    {
      title: 'Active Workpapers',
      value: dashboardData.workpapers.in_progress,
      change: '+8%',
      changeType: 'positive',
      icon: FileText,
      color: 'green'
    },
    {
      title: 'Completed Workpapers',
      value: dashboardData.workpapers.completed,
      change: '+15%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      title: 'Open Findings',
      value: dashboardData.findings.open,
      change: '-5%',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'red'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      emerald: 'bg-emerald-500 text-white',
      red: 'bg-red-500 text-white',
      orange: 'bg-orange-500 text-white',
      purple: 'bg-purple-500 text-white'
    };
    return colors[color] || 'bg-gray-500 text-white';
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'not_started': 'bg-gray-100 text-gray-800',
      'review': 'bg-purple-100 text-purple-800',
      'open': 'bg-red-100 text-red-800',
      'resolved': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                <div className="flex items-center mt-2">
                  {metric.changeType === 'positive' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getColorClasses(metric.color)}`}>
                <metric.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workpaper Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Workpaper Status</h3>
            <PieChart className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {[
              { status: 'Completed', count: dashboardData.workpapers.completed, color: 'bg-green-500' },
              { status: 'In Progress', count: dashboardData.workpapers.in_progress, color: 'bg-blue-500' },
              { status: 'Not Started', count: dashboardData.workpapers.total - dashboardData.workpapers.completed - dashboardData.workpapers.in_progress, color: 'bg-gray-500' }
            ].map((item, index) => {
              const percentage = dashboardData.workpapers.total > 0 ? (item.count / dashboardData.workpapers.total) * 100 : 0;
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.status}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Assessment Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Assessment</h3>
            <AlertCircle className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">High Risk</span>
              </div>
              <span className="text-sm font-bold text-red-600">{dashboardData.risk_assessments.high_risk}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Medium Risk</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">5</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Low Risk</span>
              </div>
              <span className="text-sm font-bold text-green-600">12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { icon: Building, label: 'New Engagement', color: 'blue' },
            { icon: FileText, label: 'New Workpaper', color: 'green' },
            { icon: AlertTriangle, label: 'Add Finding', color: 'red' },
            { icon: Target, label: 'Risk Assessment', color: 'orange' },
            { icon: Calendar, label: 'Schedule Task', color: 'purple' },
            { icon: FileCheck, label: 'Confirmation', color: 'emerald' }
          ].map((action, index) => (
            <button
              key={index}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className={`p-3 rounded-lg ${getColorClasses(action.color)} mb-2`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <Activity className="w-5 h-5 text-gray-500" />
        </div>
        <div className="space-y-4">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {AuditService.formatDateTime(activity.timestamp)}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Audit Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Engagement Progress</h3>
            <Building className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{dashboardData.engagements.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{dashboardData.engagements.completed}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${dashboardData.engagements.total > 0 ? (dashboardData.engagements.completed / dashboardData.engagements.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Workpaper Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Workpaper Progress</h3>
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{dashboardData.workpapers.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{dashboardData.workpapers.in_progress}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${dashboardData.workpapers.total > 0 ? (dashboardData.workpapers.completed / dashboardData.workpapers.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Findings Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Findings Status</h3>
            <AlertTriangle className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Open</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{dashboardData.findings.open}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Resolved</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{dashboardData.findings.resolved}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${dashboardData.findings.total > 0 ? (dashboardData.findings.open / dashboardData.findings.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditDashboard;
