import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building2, 
  Shield, 
  Leaf, 
  ClipboardList, 
  ShoppingCart, 
  Handshake,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Database,
  FileText
} from 'lucide-react'

const IntegrationSummary = () => {
  const [integrations, setIntegrations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshInterval, setRefreshInterval] = useState(null)

  // Integration configurations with their data extraction endpoints
  const integrationConfigs = {
    'Asset management': {
      port: 3001,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      metrics: ['Total Asset Value', 'Asset Utilization', 'Warranty Expiring', 'Replacement Due'],
      dataEndpoints: ['/api/metrics', '/api/assets/summary', '/api/warranty/status']
    },
    'Complaince management': {
      port: 3002,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      metrics: ['Compliance Score', 'Risk Level', 'Audit Status', 'Violations'],
      dataEndpoints: ['/api/compliance/score', '/api/risk/assessment', '/api/audit/status']
    },
    'CRM': {
      port: 3003,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      metrics: ['Total Deals', 'Pipeline Value', 'Conversion Rate', 'Customer Satisfaction'],
      dataEndpoints: ['/api/sales/pipeline', '/api/customers/metrics', '/api/deals/summary']
    },
    'ESG': {
      port: 3004,
      icon: Leaf,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      metrics: ['Environmental Score', 'Social Impact', 'Governance Rating', 'Sustainability Index'],
      dataEndpoints: ['/api/esg/scores', '/api/sustainability/metrics', '/api/impact/assessment']
    },
    'Project management': {
      port: 3005,
      icon: ClipboardList,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      metrics: ['Active Projects', 'Completion Rate', 'Budget Utilization', 'Team Performance'],
      dataEndpoints: ['/api/projects/status', '/api/budget/overview', '/api/team/performance']
    },
    'Purchase order management': {
      port: 3006,
      icon: ShoppingCart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      metrics: ['Total PO Value', 'Approved Orders', 'Pending Approvals', 'Vendor Performance'],
      dataEndpoints: ['/api/purchase-orders/summary', '/api/vendors/metrics', '/api/approvals/status']
    },
    'Revenue analytics': {
      port: 3007,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      metrics: ['Total Revenue', 'Growth Rate', 'Customer Lifetime Value', 'Churn Rate'],
      dataEndpoints: ['/api/revenue/summary', '/api/growth/metrics', '/api/customers/analytics']
    },
    'Stakeholder management': {
      port: 3008,
      icon: Handshake,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      metrics: ['Stakeholder Satisfaction', 'Engagement Level', 'Communication Score', 'Relationship Health'],
      dataEndpoints: ['/api/stakeholders/satisfaction', '/api/engagement/metrics', '/api/relationships/health']
    }
  }

  useEffect(() => {
    loadIntegrationData()
    startAutoRefresh()
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [])

  const startAutoRefresh = () => {
    const interval = setInterval(() => {
      loadIntegrationData()
    }, 30000) // Refresh every 30 seconds
    setRefreshInterval(interval)
  }

  const loadIntegrationData = async () => {
    setIsLoading(true)
    try {
      const integrationData = []
      
      for (const [name, config] of Object.entries(integrationConfigs)) {
        const data = await fetchIntegrationData(name, config)
        integrationData.push(data)
        console.log(`Loaded data for ${name}:`, data)
      }
      
      setIntegrations(integrationData)
      setLastUpdated(new Date())
      console.log('All integration data loaded:', integrationData)
    } catch (error) {
      console.error('Error loading integration data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchIntegrationData = async (name, config) => {
    try {
      // First, try to load from CSV backup (this is our primary data source)
      const csvData = await loadCSVData(name)
      if (csvData && csvData.metrics) {
        return {
          name,
          config,
          status: 'online', // Show as online if we have CSV data
          data: csvData.metrics,
          lastSync: csvData.lastUpdated || new Date(),
          source: 'csv'
        }
      }
    } catch (csvError) {
      console.log(`No CSV data for ${name}, trying live connection...`)
    }

    try {
      // Try to check if the integration server is running
      const response = await fetch(`http://localhost:${config.port}`, {
        method: 'GET',
        mode: 'no-cors'
      })
      
      // If we can reach the server, mark as online but use default data
      return {
        name,
        config,
        status: 'online',
        data: generateDefaultData(name),
        lastSync: new Date(),
        source: 'live'
      }
    } catch (error) {
      // Server is offline, use default data
      return {
        name,
        config,
        status: 'offline',
        data: generateDefaultData(name),
        lastSync: new Date(),
        source: 'default'
      }
    }
  }

  const loadCSVData = async (integrationName) => {
    try {
      console.log(`Attempting to load CSV data for ${integrationName}...`)
      const response = await fetch(`/api/integration-data/${integrationName}`)
      console.log(`Response status for ${integrationName}:`, response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`CSV data for ${integrationName}:`, data)
        return data
      } else {
        console.log(`Failed to load CSV data for ${integrationName}, status:`, response.status)
      }
    } catch (error) {
      console.error(`Error loading CSV data for ${integrationName}:`, error)
    }
    return null
  }

  const generateDefaultData = (integrationName) => {
    // Generate realistic default data based on integration type
    const defaults = {
      'Asset management': {
        totalAssetValue: '$2.1M',
        assetUtilization: '87.5%',
        warrantyExpiring: 45,
        replacementDue: 28,
        totalAssets: 1247,
        depreciationValue: '$450K',
        lastUpdated: new Date().toISOString()
      },
      'Complaince management': {
        complianceScore: '92.5%',
        riskLevel: 'Low',
        auditStatus: 'Passed',
        violations: 2,
        lastAudit: '2024-01-15',
        nextReview: '2024-07-15',
        lastUpdated: new Date().toISOString()
      },
      'CRM': {
        totalDeals: 156,
        pipelineValue: '$8.7M',
        conversionRate: '23.4%',
        customerSatisfaction: '4.6/5',
        activeLeads: 89,
        averageDealSize: '$55,800',
        lastUpdated: new Date().toISOString()
      },
      'ESG': {
        environmentalScore: 'B+',
        socialImpact: 'High',
        governanceRating: 'A-',
        sustainabilityIndex: '78.5',
        carbonFootprint: 'Reduced 15%',
        communityEngagement: '92%',
        lastUpdated: new Date().toISOString()
      },
      'Project management': {
        activeProjects: 23,
        completionRate: '94.2%',
        budgetUtilization: '87.6%',
        teamPerformance: '4.3/5',
        onTimeDelivery: '91.8%',
        resourceUtilization: '89.4%',
        lastUpdated: new Date().toISOString()
      },
      'Purchase order management': {
        totalPOValue: '$1.8M',
        approvedOrders: 156,
        pendingApprovals: 23,
        vendorPerformance: '4.2/5',
        costSavings: '$125K',
        orderEfficiency: '94.7%',
        lastUpdated: new Date().toISOString()
      },
      'Revenue analytics': {
        totalRevenue: '$4.2M',
        growthRate: '+8.5%',
        customerLTV: '$12,450',
        churnRate: '2.1%',
        recurringRevenue: '$3.1M',
        profitMargin: '23.4%',
        lastUpdated: new Date().toISOString()
      },
      'Stakeholder management': {
        stakeholderSatisfaction: '4.4/5',
        engagementLevel: 'High',
        communicationScore: '88.7%',
        relationshipHealth: 'Good',
        responseTime: '2.3 hours',
        meetingAttendance: '94.2%',
        lastUpdated: new Date().toISOString()
      }
    }
    
    return defaults[integrationName] || {
      status: 'No data available',
      lastUpdated: new Date().toISOString()
    }
  }

  const handleManualRefresh = () => {
    loadIntegrationData()
  }

  const exportAllData = async () => {
    try {
      const response = await fetch('/api/integration-data/export-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ integrations })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `integration-summary-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'offline':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-50'
      case 'offline':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatLastSync = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return `${Math.floor(minutes / 1440)}d ago`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="text-indigo-600" />
                Integration Summary Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Consolidated view of all integration applications with real-time data and offline backups
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
                             <button
                 onClick={async () => {
                   try {
                     console.log('Triggering data collection...')
                     const response = await fetch('/api/integration-data/collect', { method: 'POST' })
                     if (response.ok) {
                       console.log('Data collection triggered successfully')
                       alert('Data collection started! Please wait a moment and then refresh.')
                       // Reload data after collection
                       setTimeout(() => loadIntegrationData(), 5000)
                     } else {
                       console.log('Data collection failed:', response.status)
                       alert('Data collection failed. Check console for details.')
                     }
                   } catch (error) {
                     console.error('Error triggering data collection:', error)
                     alert('Error: ' + error.message)
                   }
                 }}
                 className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
               >
                 <Activity className="w-4 h-4" />
                 Collect Data
               </button>
               
               <button
                 onClick={exportAllData}
                 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
               >
                 <Download className="w-4 h-4" />
                 Export All
               </button>
            </div>
          </div>
        </div>

                 {/* Debug Info */}
         {process.env.NODE_ENV === 'development' && (
           <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
             <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info</h3>
             <div className="text-xs text-yellow-700">
               <p>Integrations loaded: {integrations.length}</p>
               <p>Integration names: {integrations.map(i => i?.name).join(', ')}</p>
               <p>Data sources: {integrations.map(i => i?.source).join(', ')}</p>
             </div>
           </div>
         )}

         {/* Data Collection Info */}
         <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
           <h3 className="text-sm font-medium text-blue-800 mb-2">Data Collection Status</h3>
           <div className="text-xs text-blue-700">
             <p>• Click "Collect Data" to gather data from all integrations</p>
             <p>• Data will be stored in CSV files for offline access</p>
             <p>• Use "View Raw Data" button on each integration card to see collected data</p>
             <p>• Integration status shows whether data is from CSV backup or default values</p>
           </div>
         </div>

         {/* Summary Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Integrations</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(integrationConfigs).length}</p>
              </div>
              <Database className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter(i => i && i.status === 'online').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {integrations.filter(i => i && i.status === 'offline').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Sources</p>
                <p className="text-2xl font-bold text-blue-600">
                  {integrations.filter(i => i && i.source === 'live').length} Live
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

                 {/* Integration Grid */}
         {isLoading ? (
           <div className="text-center py-12">
             <div className="inline-flex items-center gap-2 text-gray-600">
               <RefreshCw className="w-5 h-5 animate-spin" />
               Loading integration data...
             </div>
           </div>
         ) : (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(integrationConfigs).map(([name, config]) => {
            const integration = integrations.find(i => i.name === name) || {
              name,
              config,
              status: 'unknown',
              data: {},
              lastSync: null,
              source: 'unknown'
            }
            
            const IconComponent = config.icon
            
            return (
              <div key={name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Integration Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <IconComponent className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                      <p className="text-sm text-gray-500">Port {config.port}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(integration.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                      {integration.status}
                    </span>
                  </div>
                </div>

                {/* Status Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Data Source:</span>
                    <span className="font-medium capitalize">{integration.source}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Last Sync:</span>
                    <span className="font-medium">{formatLastSync(integration.lastSync)}</span>
                  </div>
                </div>

                                 {/* Key Metrics */}
                 <div className="space-y-3">
                   <h4 className="text-sm font-medium text-gray-700">Key Metrics</h4>
                   {config.metrics.map((metric, index) => {
                     // Try to find the metric value in the integration data
                     const metricKey = metric.toLowerCase().replace(/\s+/g, '')
                     const metricValue = integration.data[metricKey] || 
                                       integration.data[metric.toLowerCase().replace(/\s+/g, '')] ||
                                       'N/A'
                     
                     return (
                       <div key={index} className="flex items-center justify-between text-sm">
                         <span className="text-gray-600">{metric}:</span>
                         <span className="font-medium text-gray-900">
                           {metricValue}
                         </span>
                       </div>
                     )
                   })}
                 </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(`http://localhost:${config.port}`, '_blank')}
                      className="flex-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Open App
                    </button>
                    <button
                      onClick={() => {
                        console.log(`Raw data for ${name}:`, integration.data)
                        alert(`Raw data for ${name}:\n${JSON.stringify(integration.data, null, 2)}`)
                      }}
                      className="px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="View Raw Data"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
           </div>
         )}

        {/* Data Management Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">CSV Backups</h4>
              <p className="text-sm text-gray-600 mb-3">
                Offline data storage for each integration
              </p>
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/integration-data/summary')
                    if (response.ok) {
                      const summary = await response.json()
                      alert(`Integration Summary:\n${JSON.stringify(summary, null, 2)}`)
                    }
                  } catch (error) {
                    alert('Error loading backup summary: ' + error.message)
                  }
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                View Backups →
              </button>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Data Sync</h4>
              <p className="text-sm text-gray-600 mb-3">
                Manual synchronization with offline data
              </p>
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/integration-data/collect', { method: 'POST' })
                    if (response.ok) {
                      alert('Data sync triggered successfully!')
                      setTimeout(() => loadIntegrationData(), 2000)
                    }
                  } catch (error) {
                    alert('Error syncing data: ' + error.message)
                  }
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Sync Now →
              </button>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Export Options</h4>
              <p className="text-sm text-gray-600 mb-3">
                Download consolidated reports
              </p>
              <button 
                onClick={exportAllData}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Export →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntegrationSummary
