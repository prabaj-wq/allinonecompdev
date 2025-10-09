import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ConnectionTestModal = ({ isOpen, onClose, system, onRunTest }) => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testSteps, setTestSteps] = useState([]);

  const defaultTestSteps = [
    { id: 1, name: 'DNS Resolution', status: 'pending', duration: null },
    { id: 2, name: 'TCP Connection', status: 'pending', duration: null },
    { id: 3, name: 'SSL Handshake', status: 'pending', duration: null },
    { id: 4, name: 'Authentication', status: 'pending', duration: null },
    { id: 5, name: 'API Response', status: 'pending', duration: null }
  ];

  useEffect(() => {
    if (isOpen && system) {
      setTestSteps(defaultTestSteps);
      setTestResults(null);
    }
  }, [isOpen, system]);

  const runConnectionTest = async () => {
    setIsRunning(true);
    setTestResults(null);

    // Simulate test execution
    for (let i = 0; i < defaultTestSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setTestSteps(prev => prev.map((step, index) => {
        if (index === i) {
          const success = Math.random() > 0.2; // 80% success rate
          return {
            ...step,
            status: success ? 'success' : 'failed',
            duration: Math.floor(Math.random() * 500) + 50
          };
        }
        return step;
      }));
    }

    // Set final results
    const successCount = testSteps.filter(step => step.status === 'success').length;
    setTestResults({
      overall: successCount === defaultTestSteps.length ? 'success' : 'failed',
      successRate: Math.floor((successCount / defaultTestSteps.length) * 100),
      totalDuration: testSteps.reduce((sum, step) => sum + (step.duration || 0), 0)
    });

    setIsRunning(false);
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'success': return 'CheckCircle';
      case 'failed': return 'XCircle';
      case 'running': return 'Loader';
      default: return 'Circle';
    }
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'failed': return 'text-error';
      case 'running': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-enhanced max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Icon name={system?.icon || 'Activity'} size={20} color="white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Connection Test</h2>
                <p className="text-sm text-muted-foreground">{system?.name}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-foreground">Test Connection</h3>
              <p className="text-sm text-muted-foreground">Verify connectivity and authentication</p>
            </div>
            <Button
              variant="default"
              onClick={runConnectionTest}
              disabled={isRunning}
              loading={isRunning}
              iconName="Play"
            >
              {isRunning ? 'Testing...' : 'Run Test'}
            </Button>
          </div>

          <div className="space-y-4">
            {testSteps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-4 p-4 glass-container">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepColor(step.status)}`}>
                  <Icon 
                    name={getStepIcon(step.status)} 
                    size={16} 
                    className={step.status === 'running' ? 'animate-spin' : ''}
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{step.name}</span>
                    {step.duration && (
                      <span className="text-xs text-muted-foreground">{step.duration}ms</span>
                    )}
                  </div>
                  {step.status === 'failed' && (
                    <p className="text-xs text-error mt-1">Connection failed - check network settings</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {testResults && (
            <div className="mt-6 p-4 glass-container border border-border/50">
              <div className="flex items-center space-x-3 mb-4">
                <Icon 
                  name={testResults.overall === 'success' ? 'CheckCircle' : 'XCircle'} 
                  size={24} 
                  className={testResults.overall === 'success' ? 'text-success' : 'text-error'}
                />
                <div>
                  <h4 className="text-lg font-medium text-foreground">
                    {testResults.overall === 'success' ? 'Connection Successful' : 'Connection Failed'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Success Rate: {testResults.successRate}% | Total Duration: {testResults.totalDuration}ms
                  </p>
                </div>
              </div>
              
              {testResults.overall === 'success' && (
                <div className="text-sm text-success bg-success/10 p-3 rounded-lg">
                  All connection tests passed successfully. The system is ready for synchronization.
                </div>
              )}
              
              {testResults.overall === 'failed' && (
                <div className="text-sm text-error bg-error/10 p-3 rounded-lg">
                  Some connection tests failed. Please check system configuration and network connectivity.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border/30 flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {testResults && testResults.overall === 'success' && (
            <Button variant="default" iconName="RefreshCw">
              Force Sync Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionTestModal;