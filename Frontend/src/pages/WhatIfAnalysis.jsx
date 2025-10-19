import React, { useState } from 'react'
import { 
  TrendingUp, Plus, Save, Download, BarChart3, Calculator, 
  Target, Zap, DollarSign, Percent, Building2, Globe, 
  ChevronDown, ChevronRight, MoreHorizontal, Eye, Edit, 
  Trash2, Play, Pause, RotateCcw, Settings, Filter, Search,
  ArrowUp, ArrowDown, Minus, X, CheckCircle, AlertTriangle
} from 'lucide-react'

const WhatIfAnalysis = () => {
  const [activeTab, setActiveTab] = useState('scenarios')
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [showDriverPanel, setShowDriverPanel] = useState(false)
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: 'Base Case 2025',
      description: 'Current business plan with existing assumptions',
      status: 'active',
      lastModified: '2025-01-20',
      drivers: {
        revenueGrowth: 5.0,
        fxRate: 1.15,
        taxRate: 25.0,
        interestRate: 3.5
      },
      metrics: {
        revenue: 1000000,
        ebitda: 150000,
        netIncome: 112500,
        cashFlow: 125000
      }
    },
    {
      id: 2,
      name: 'Optimistic Growth',
      description: 'High growth scenario with favorable market conditions',
      status: 'active',
      lastModified: '2025-01-18',
      drivers: {
        revenueGrowth: 12.0,
        fxRate: 1.10,
        taxRate: 22.0,
        interestRate: 3.0
      },
      metrics: {
        revenue: 1120000,
        ebitda: 190000,
        netIncome: 148200,
        cashFlow: 165000
      }
    },
    {
      id: 3,
      name: 'Economic Downturn',
      description: 'Conservative scenario with economic challenges',
      status: 'active',
      lastModified: '2025-01-15',
      drivers: {
        revenueGrowth: -2.0,
        fxRate: 1.25,
        taxRate: 28.0,
        interestRate: 4.5
      },
      metrics: {
        revenue: 980000,
        ebitda: 120000,
        netIncome: 86400,
        cashFlow: 95000
      }
    }
  ])

  const drivers = [
    { id: 'revenueGrowth', name: 'Revenue Growth Rate', unit: '%', min: -10, max: 20, step: 0.5 },
    { id: 'fxRate', name: 'FX Rate (USD/EUR)', unit: 'rate', min: 0.8, max: 1.5, step: 0.01 },
    { id: 'taxRate', name: 'Effective Tax Rate', unit: '%', min: 15, max: 35, step: 0.5 },
    { id: 'interestRate', name: 'Interest Rate', unit: '%', min: 1, max: 8, step: 0.25 },
    { id: 'operatingMargin', name: 'Operating Margin', unit: '%', min: 5, max: 25, step: 0.5 },
    { id: 'workingCapital', name: 'Working Capital Days', unit: 'days', min: 30, max: 90, step: 5 }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const calculateImpact = (scenario) => {
    const baseCase = scenarios.find(s => s.status === 'active')
    if (!baseCase) return {}
    
    return {
      revenue: ((scenario.metrics.revenue - baseCase.metrics.revenue) / baseCase.metrics.revenue * 100).toFixed(1),
      ebitda: ((scenario.metrics.ebitda - baseCase.metrics.ebitda) / baseCase.metrics.ebitda * 100).toFixed(1),
      netIncome: ((scenario.metrics.netIncome - baseCase.metrics.netIncome) / baseCase.metrics.netIncome * 100).toFixed(1),
      cashFlow: ((scenario.metrics.cashFlow - baseCase.metrics.cashFlow) / baseCase.metrics.cashFlow * 100).toFixed(1)
    }
  }

  const handleDriverChange = (driverId, value) => {
    if (!selectedScenario) return
    
    const updatedScenario = { ...selectedScenario }
    updatedScenario.drivers[driverId] = parseFloat(value)
    
    // Recalculate metrics based on driver changes
    // This is a simplified calculation - in real app, would use proper financial models
    const baseRevenue = 1000000
    const newRevenue = baseRevenue * (1 + updatedScenario.drivers.revenueGrowth / 100)
    const newEbitda = newRevenue * (updatedScenario.drivers.operatingMargin || 15) / 100
    const newNetIncome = newEbitda * (1 - updatedScenario.drivers.taxRate / 100)
    const newCashFlow = newNetIncome + (newRevenue * 0.1) // Simplified cash flow
    
    updatedScenario.metrics = {
      revenue: Math.round(newRevenue),
      ebitda: Math.round(newEbitda),
      netIncome: Math.round(newNetIncome),
      cashFlow: Math.round(newCashFlow)
    }
    
    setSelectedScenario(updatedScenario)
    
    // Update scenarios list
    setScenarios(prev => prev.map(s => s.id === updatedScenario.id ? updatedScenario : s))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">What-If Analysis</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Scenario modeling and sensitivity analysis for strategic planning
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Scenario
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'scenarios', name: 'Scenarios', icon: '📊' },
            { id: 'drivers', name: 'Drivers', icon: '🎯' },
            { id: 'comparison', name: 'Comparison', icon: '📈' },
            { id: 'sensitivity', name: 'Sensitivity', icon: '🔍' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenarios List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Scenarios</h3>
              <div className="space-y-3">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedScenario?.id === scenario.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900 dark:text-white">{scenario.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(scenario.status)}`}>
                        {scenario.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{scenario.description}</p>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Modified: {scenario.lastModified}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scenario Details */}
          <div className="lg:col-span-2">
            {selectedScenario ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedScenario.name}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{selectedScenario.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="btn-secondary">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button className="btn-secondary">
                      <Play className="h-4 w-4 mr-2" />
                      Run
                    </button>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.entries(selectedScenario.metrics).map(([key, value]) => (
                    <div key={key} className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        ${(value / 1000).toFixed(0)}k
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Drivers */}
                <div>
                  <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Key Drivers</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(selectedScenario.drivers).map(([key, value]) => {
                      const driver = drivers.find(d => d.id === key)
                      if (!driver) return null
                      
                      return (
                        <div key={key} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {driver.name}
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => handleDriverChange(key, e.target.value)}
                              min={driver.min}
                              max={driver.max}
                              step={driver.step}
                              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                            />
                            <span className="text-sm text-slate-500 dark:text-slate-400">{driver.unit}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Select a Scenario</h3>
                <p className="text-slate-600 dark:text-slate-400">Choose a scenario from the left to view details and make adjustments</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drivers Tab */}
      {activeTab === 'drivers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Driver Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.map((driver) => (
                <div key={driver.id} className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-3">{driver.name}</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Current Value</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          defaultValue={driver.id === 'revenueGrowth' ? 5.0 : driver.id === 'fxRate' ? 1.15 : 25.0}
                          min={driver.min}
                          max={driver.max}
                          step={driver.step}
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        />
                        <span className="text-sm text-slate-500 dark:text-slate-400">{driver.unit}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Range</label>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{driver.min} {driver.unit}</span>
                        <span>{driver.max} {driver.unit}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${((driver.id === 'revenueGrowth' ? 5.0 : driver.id === 'fxRate' ? 1.15 : 25.0) - driver.min) / (driver.max - driver.min) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Scenario Comparison</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Metric</th>
                    {scenarios.map((scenario) => (
                      <th key={scenario.id} className="text-center py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {scenario.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['revenue', 'ebitda', 'netIncome', 'cashFlow'].map((metric) => (
                    <tr key={metric} className="border-b border-slate-200 dark:border-slate-700">
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 capitalize">
                        {metric.replace(/([A-Z])/g, ' $1').trim()}
                      </td>
                      {scenarios.map((scenario) => {
                        const impact = calculateImpact(scenario)
                        const value = scenario.metrics[metric]
                        const change = impact[metric]
                        
                        return (
                          <td key={scenario.id} className="py-3 px-4 text-center">
                            <div className="font-medium text-slate-900 dark:text-white">
                              ${(value / 1000).toFixed(0)}k
                            </div>
                            {scenario.status !== 'active' && (
                              <div className={`text-xs flex items-center justify-center ${
                                parseFloat(change) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {parseFloat(change) > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                                {change}%
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sensitivity Tab */}
      {activeTab === 'sensitivity' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Sensitivity Analysis</h3>
            <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Sensitivity Chart</p>
                <p className="text-sm">Tornado chart showing impact of driver changes</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WhatIfAnalysis
