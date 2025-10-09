import React, { useState } from 'react'
import { 
  Server, 
  RefreshCw, 
  Package, 
  Play, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download,
  Activity,
  Zap,
  Terminal,
  Cpu,
  HardDrive,
  Database
} from 'lucide-react'

const SystemManagement = () => {
  const [isInstalling, setIsInstalling] = useState(false)
  const [installationStatus, setInstallationStatus] = useState({})
  const [lastInstallTime, setLastInstallTime] = useState(null)
  const [systemStatus, setSystemStatus] = useState({
    backend: 'running',
    mainApp: 'running',
    integrations: 'ready'
  })

  const integrationList = [
    'Main React App',
    'Asset management',
    'Compliance management', 
    'CRM',
    'ESG',
    'Project management',
    'Purchase order management',
    'Revenue analytics',
    'Stakeholder management'
  ]

  const handleInstallAllDependencies = async () => {
    setIsInstalling(true)
    setInstallationStatus({})
    
    try {
      console.log('🚀 Starting dependency installation for all integrations...')
      
      const response = await fetch('/api/integrations/install-all-dependencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Installation completed:', result)
        
        setInstallationStatus(result.results || {})
        setLastInstallTime(new Date())
        
        // Show success notification
        alert('🎉 All dependencies installed successfully! Integration apps are now ready to launch.')
      } else {
        const errorText = await response.text()
        console.error('❌ Installation failed:', errorText)
        alert('❌ Installation failed. Please check the console for details.')
      }
    } catch (error) {
      console.error('❌ Installation error:', error)
      alert('❌ Installation error. Please check the console for details.')
    } finally {
      setIsInstalling(false)
    }
  }

  const handleLaunchIntegration = async (integrationName) => {
    try {
      console.log(`🚀 Launching ${integrationName}...`)
      
      const response = await fetch('/api/launch-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integration: integrationName
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Integration launched:', result)
        
        // Open the integration in a new window
        setTimeout(() => {
          window.open(result.url, '_blank')
        }, 2000)
        
        alert(`🚀 ${integrationName} is starting... It will open in a new window shortly.`)
      } else {
        const errorText = await response.text()
        console.error('❌ Launch failed:', errorText)
        alert(`❌ Failed to launch ${integrationName}`)
      }
    } catch (error) {
      console.error('❌ Launch error:', error)
      alert(`❌ Error launching ${integrationName}`)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'installing':
        return <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'ready':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      case 'installing':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage application dependencies and system services
          </p>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Backend API</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Port 8000</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(systemStatus.backend)}
              <Server className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Main App</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Port 3000</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(systemStatus.mainApp)}
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Integrations</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Ports 3001-3008</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(systemStatus.integrations)}
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Dependency Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                NPM Dependency Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Install and manage npm dependencies for all integration apps
              </p>
            </div>
            <button
              onClick={handleInstallAllDependencies}
              disabled={isInstalling}
              className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
                isInstalling
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isInstalling ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Install All Dependencies
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          {lastInstallTime && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Last installation completed: {lastInstallTime.toLocaleString()}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrationList.map((integration) => {
              const status = installationStatus[integration]
              const isMainApp = integration === 'Main React App'
              
              return (
                <div
                  key={integration}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                      {integration}
                    </h3>
                    {status && status.includes('Dependencies checked/installed') ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : status && status.includes('Error') ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {isMainApp ? 'Port 3000' : `Port ${3001 + integrationList.indexOf(integration) - 1}`}
                  </p>
                  
                  {status && (
                    <p className={`text-xs px-2 py-1 rounded border ${
                      status.includes('Error') ? getStatusColor('error') : getStatusColor('ready')
                    }`}>
                      {status}
                    </p>
                  )}
                  
                  {!isMainApp && (
                    <button
                      onClick={() => handleLaunchIntegration(integration)}
                      className="mt-2 w-full flex items-center justify-center px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Launch
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Common system management tasks
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => window.open('http://localhost:8000/docs', '_blank')}
              className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="text-center">
                <Database className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">API Docs</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">View API documentation</p>
              </div>
            </button>

            <button
              onClick={() => window.open('http://localhost:3000', '_blank')}
              className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="text-center">
                <Activity className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Main App</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Open main application</p>
              </div>
            </button>

            <button
              onClick={handleInstallAllDependencies}
              disabled={isInstalling}
              className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Dependencies</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Install all npm packages</p>
              </div>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="text-center">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Refresh</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Reload application</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Information</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Application Ports</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Main React App:</span>
                  <span className="font-mono text-gray-900 dark:text-white">http://localhost:3000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Backend API:</span>
                  <span className="font-mono text-gray-900 dark:text-white">http://localhost:8000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Integrations:</span>
                  <span className="font-mono text-gray-900 dark:text-white">http://localhost:3001-3008</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Integration Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Integrations:</span>
                  <span className="text-gray-900 dark:text-white">{integrationList.length - 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Dependencies Installed:</span>
                  <span className="text-gray-900 dark:text-white">
                    {Object.keys(installationStatus).filter(key => 
                      installationStatus[key]?.includes('Dependencies checked/installed')
                    ).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Ready to Launch:</span>
                  <span className="text-green-600">
                    {lastInstallTime ? 'Yes' : 'Run dependency install first'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemManagement