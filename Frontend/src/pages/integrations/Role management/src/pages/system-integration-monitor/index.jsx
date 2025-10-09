import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SystemCard from './components/SystemCard';
import SyncLogEntry from './components/SyncLogEntry';
import PerformanceChart from './components/PerformanceChart';
import AlertPanel from './components/AlertPanel';
import SyncStatusPanel from './components/SyncStatusPanel';
import ConnectionTestModal from './components/ConnectionTestModal';

const SystemIntegrationMonitor = () => {
  const [selectedSystem, setSelectedSystem] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedTestSystem, setSelectedTestSystem] = useState(null);

  // Mock data for connected systems
  const connectedSystems = [
    {
      id: 'ad',
      name: 'Active Directory',
      type: 'Identity Provider',
      icon: 'Users',
      status: 'healthy',
      lastSync: new Date(Date.now() - 300000),
      responseTime: 145,
      recordsSynced: 15420,
      errorCount: 0
    },
    {
      id: 'ldap',
      name: 'LDAP Server',
      type: 'Directory Service',
      icon: 'Database',
      status: 'healthy',
      lastSync: new Date(Date.now() - 180000),
      responseTime: 89,
      recordsSynced: 8750,
      errorCount: 0
    },
    {
      id: 'okta',
      name: 'Okta SSO',
      type: 'Identity Provider',
      icon: 'Shield',
      status: 'warning',
      lastSync: new Date(Date.now() - 900000),
      responseTime: 234,
      recordsSynced: 12300,
      errorCount: 3
    },
    {
      id: 'azure',
      name: 'Azure AD',
      type: 'Cloud Identity',
      icon: 'Cloud',
      status: 'healthy',
      lastSync: new Date(Date.now() - 120000),
      responseTime: 167,
      recordsSynced: 22100,
      errorCount: 0
    },
    {
      id: 'hr',
      name: 'HR Management System',
      type: 'Business Application',
      icon: 'UserCheck',
      status: 'error',
      lastSync: new Date(Date.now() - 3600000),
      responseTime: 0,
      recordsSynced: 5600,
      errorCount: 12
    },
    {
      id: 'erp',
      name: 'ERP Platform',
      type: 'Business Application',
      icon: 'Building',
      status: 'maintenance',
      lastSync: new Date(Date.now() - 7200000),
      responseTime: 0,
      recordsSynced: 18900,
      errorCount: 0
    }
  ];

  // Mock sync logs
  const syncLogs = [
    {
      id: 1,
      system: 'Active Directory',
      operation: 'sync',
      status: 'success',
      description: 'Full user directory synchronization completed successfully',
      timestamp: new Date(Date.now() - 300000),
      recordsAffected: 1250,
      duration: 2340
    },
    {
      id: 2,
      system: 'Okta SSO',
      operation: 'update',
      status: 'failed',
      description: 'Failed to update user permissions for 3 accounts',
      timestamp: new Date(Date.now() - 450000),
      recordsAffected: 3,
      duration: 890
    },
    {
      id: 3,
      system: 'Azure AD',
      operation: 'create',
      status: 'success',
      description: 'New user accounts created and provisioned',
      timestamp: new Date(Date.now() - 600000),
      recordsAffected: 15,
      duration: 1200
    },
    {
      id: 4,
      system: 'HR Management System',
      operation: 'error',
      status: 'failed',
      description: 'Connection timeout during employee data retrieval',
      timestamp: new Date(Date.now() - 900000),
      recordsAffected: 0,
      duration: 30000
    },
    {
      id: 5,
      system: 'LDAP Server',
      operation: 'sync',
      status: 'success',
      description: 'Incremental sync completed - group memberships updated',
      timestamp: new Date(Date.now() - 1200000),
      recordsAffected: 450,
      duration: 1800
    }
  ];

  // Mock performance data
  const performanceData = [
    { time: '00:00', value: 145 },
    { time: '04:00', value: 132 },
    { time: '08:00', value: 189 },
    { time: '12:00', value: 234 },
    { time: '16:00', value: 198 },
    { time: '20:00', value: 167 },
    { time: '24:00', value: 156 }
  ];

  const throughputData = [
    { time: '00:00', value: 1250 },
    { time: '04:00', value: 890 },
    { time: '08:00', value: 2340 },
    { time: '12:00', value: 1890 },
    { time: '16:00', value: 2100 },
    { time: '20:00', value: 1650 },
    { time: '24:00', value: 1420 }
  ];

  // Mock alerts
  const alerts = [
    {
      id: 1,
      title: 'HR System Connection Failed',
      description: 'Unable to establish connection to HR Management System. Last successful sync was 1 hour ago.',
      severity: 'critical',
      system: 'HR Management System',
      timestamp: new Date(Date.now() - 300000),
      affectedUsers: 156
    },
    {
      id: 2,
      title: 'Okta Sync Warnings',
      description: 'Multiple permission update failures detected. 3 user accounts require manual review.',
      severity: 'warning',
      system: 'Okta SSO',
      timestamp: new Date(Date.now() - 600000),
      affectedUsers: 3
    },
    {
      id: 3,
      title: 'High Response Times',
      description: 'Azure AD response times are above normal thresholds. Performance monitoring recommended.',
      severity: 'info',
      system: 'Azure AD',
      timestamp: new Date(Date.now() - 900000),
      affectedUsers: null
    }
  ];

  // Mock sync statistics
  const syncStats = {
    successful: 1247,
    pending: 23,
    failed: 8,
    healthPercentage: 94,
    lastFullSync: '2 hours ago',
    avgDuration: 1850,
    recordsProcessed: 45600,
    nextScheduled: 'In 4 hours'
  };

  const systemOptions = [
    { value: 'all', label: 'All Systems' },
    ...connectedSystems.map(system => ({
      value: system.id,
      label: system.name
    }))
  ];

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  const tabOptions = [
    { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
    { id: 'systems', label: 'Systems', icon: 'Server' },
    { id: 'logs', label: 'Sync Logs', icon: 'FileText' },
    { id: 'performance', label: 'Performance', icon: 'TrendingUp' },
    { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle' }
  ];

  const handleViewSystemDetails = (systemId) => {
    console.log('View details for system:', systemId);
  };

  const handleTestConnection = (systemId) => {
    const system = connectedSystems.find(s => s.id === systemId);
    setSelectedTestSystem(system);
    setIsTestModalOpen(true);
  };

  const handleDismissAlert = (alertId) => {
    console.log('Dismiss alert:', alertId);
  };

  const handleViewAlertDetails = (alertId) => {
    console.log('View alert details:', alertId);
  };

  const handleManualSync = () => {
    console.log('Manual sync triggered');
  };

  const filteredSystems = connectedSystems.filter(system => {
    const matchesSearch = system.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         system.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedSystem === 'all' || system.id === selectedSystem;
    return matchesSearch && matchesFilter;
  });

  const filteredLogs = syncLogs.filter(log => {
    const matchesSearch = log.system.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedSystem === 'all' || 
                         log.system.toLowerCase().includes(connectedSystems.find(s => s.id === selectedSystem)?.name.toLowerCase() || '');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />
          
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">System Integration Monitor</h1>
              <p className="text-muted-foreground">
                Monitor and manage external system connections and data synchronization
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" iconName="Download">
                Export Report
              </Button>
              <Button variant="default" iconName="RefreshCw">
                Refresh All
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="glass-container p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Input
                  type="search"
                  placeholder="Search systems or logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64"
                />
                
                <Select
                  options={systemOptions}
                  value={selectedSystem}
                  onChange={setSelectedSystem}
                  placeholder="Filter by system"
                  className="w-full sm:w-48"
                />
                
                <Select
                  options={timeRangeOptions}
                  value={selectedTimeRange}
                  onChange={setSelectedTimeRange}
                  placeholder="Time range"
                  className="w-full sm:w-40"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 px-3 py-2 glass-container rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">Live Updates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-1 mb-8 glass-container p-2 rounded-lg">
            {tabOptions.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary/20 text-primary border border-primary/30' :'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
                {tab.id === 'alerts' && alerts.length > 0 && (
                  <span className="bg-error text-white text-xs px-2 py-0.5 rounded-full">
                    {alerts.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-container p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success/20 flex items-center justify-center">
                    <Icon name="CheckCircle" size={24} className="text-success" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{connectedSystems.filter(s => s.status === 'healthy').length}</p>
                  <p className="text-sm text-muted-foreground">Healthy Systems</p>
                </div>
                
                <div className="glass-container p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warning/20 flex items-center justify-center">
                    <Icon name="AlertTriangle" size={24} className="text-warning" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{connectedSystems.filter(s => s.status === 'warning').length}</p>
                  <p className="text-sm text-muted-foreground">Warning Status</p>
                </div>
                
                <div className="glass-container p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-error/20 flex items-center justify-center">
                    <Icon name="XCircle" size={24} className="text-error" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{connectedSystems.filter(s => s.status === 'error').length}</p>
                  <p className="text-sm text-muted-foreground">Failed Systems</p>
                </div>
                
                <div className="glass-container p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Icon name="Activity" size={24} className="text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{connectedSystems.reduce((sum, s) => sum + s.recordsSynced, 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Records Synced</p>
                </div>
              </div>

              {/* Sync Status and Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SyncStatusPanel syncStats={syncStats} onManualSync={handleManualSync} />
                <AlertPanel 
                  alerts={alerts} 
                  onDismissAlert={handleDismissAlert}
                  onViewDetails={handleViewAlertDetails}
                />
              </div>
            </div>
          )}

          {activeTab === 'systems' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSystems.map((system) => (
                <SystemCard
                  key={system.id}
                  system={system}
                  onViewDetails={handleViewSystemDetails}
                  onTestConnection={handleTestConnection}
                />
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <SyncLogEntry key={log.id} log={log} />
              ))}
              
              {filteredLogs.length === 0 && (
                <div className="glass-container p-12 text-center">
                  <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Logs Found</h3>
                  <p className="text-muted-foreground">No sync logs match your current filters</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PerformanceChart
                data={performanceData}
                title="Response Time Trends"
                metric="Response Time"
                color="#8B5CF6"
              />
              <PerformanceChart
                data={throughputData}
                title="Data Throughput"
                metric="Records/Hour"
                color="#10B981"
              />
            </div>
          )}

          {activeTab === 'alerts' && (
            <AlertPanel 
              alerts={alerts} 
              onDismissAlert={handleDismissAlert}
              onViewDetails={handleViewAlertDetails}
            />
          )}
        </div>
      </main>

      {/* Connection Test Modal */}
      <ConnectionTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        system={selectedTestSystem}
        onRunTest={() => {}}
      />
    </div>
  );
};

export default SystemIntegrationMonitor;