import React, { useState } from 'react';
import { 
  CheckCircle, RefreshCw, XCircle, Circle, Settings, ChevronUp, ChevronDown, 
  Eye, Plus, AlertCircle, Building, Server, Users, Shield 
} from 'lucide-react';
import Button from './ui/Button';

const SystemIntegrationPanel = ({ integrations }) => {
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'syncing': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'disconnected': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return CheckCircle;
      case 'syncing': return RefreshCw;
      case 'error': return XCircle;
      case 'disconnected': return Circle;
      default: return Circle;
    }
  };

  const getIntegrationIcon = (iconName) => {
    switch (iconName) {
      case 'Building': return Building;
      case 'Server': return Server;
      case 'Users': return Users;
      case 'Shield': return Shield;
      default: return Server;
    }
  };

  const formatLastSync = (timestamp) => {
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - syncTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return syncTime.toLocaleDateString();
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">System Integrations</h3>
          <Button variant="outline" size="sm" iconName="Settings">
            Configure
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {integrations.map((integration) => {
          const StatusIcon = getStatusIcon(integration.status);
          const IntegrationIcon = getIntegrationIcon(integration.icon);
          
          return (
            <div
              key={integration.id}
              className="p-4 rounded-lg border border-white/20 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => setSelectedIntegration(integration.id === selectedIntegration ? null : integration.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <IntegrationIcon size={24} color="white" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white">{integration.name}</h4>
                    <p className="text-sm text-gray-300">{integration.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(integration.status)}`}>
                      <StatusIcon 
                        size={12} 
                        className={`mr-1 ${integration.status === 'syncing' ? 'animate-spin' : ''}`}
                      />
                      {integration.status}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Last sync: {formatLastSync(integration.lastSync)}
                    </p>
                  </div>
                  
                  {selectedIntegration === integration.id ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedIntegration === integration.id && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold text-white">{integration.stats.totalUsers}</p>
                      <p className="text-xs text-gray-400">Total Users</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold text-white">{integration.stats.syncedToday}</p>
                      <p className="text-xs text-gray-400">Synced Today</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold text-white">{integration.stats.errors}</p>
                      <p className="text-xs text-gray-400">Sync Errors</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-white">Recent Sync Activities</h5>
                    {integration.recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-white/5">
                        <div className="flex items-center space-x-3">
                          {activity.type === 'success' ? (
                            <CheckCircle size={16} className="text-green-400" />
                          ) : (
                            <AlertCircle size={16} className="text-yellow-400" />
                          )}
                          <span className="text-sm text-white">{activity.message}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatLastSync(activity.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors">
                        <RefreshCw size={14} />
                        <span>Sync Now</span>
                      </button>
                      <button className="flex items-center space-x-2 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Eye size={14} />
                        <span>View Logs</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">Auto-sync:</span>
                      <div className={`w-8 h-4 rounded-full transition-colors ${integration.autoSync ? 'bg-green-500' : 'bg-gray-600'}`}>
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform transform ${integration.autoSync ? 'translate-x-4' : 'translate-x-0.5'} mt-0.5`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/20 text-center">
        <button className="flex items-center space-x-2 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors mx-auto">
          <Plus size={16} />
          <span>Add Integration</span>
        </button>
      </div>
    </div>
  );
};

export default SystemIntegrationPanel;
