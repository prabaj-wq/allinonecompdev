import React, { useState, useEffect } from 'react'
import { 
  BarChart3, TrendingUp, DollarSign, Users, Building2, 
  Activity, Eye, Settings, Plus, Download, RefreshCw, 
  Filter, Search, Grid3X3, Columns, Rows, MoreHorizontal,
  ArrowUp, ArrowDown, Minus, X, CheckCircle, AlertTriangle,
  Clock, Calendar, Globe, Target, Zap, Calculator, 
  PieChart, LineChart, BarChart, AreaChart
} from 'lucide-react'

const RealTimeAnalytics = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedEntity, setSelectedEntity] = useState('all')
  const [showWidgetPanel, setShowWidgetPanel] = useState(false)
  const [widgets, setWidgets] = useState([
    {
      id: 1,
      type: 'kpi',
      title: 'Total Revenue',
      value: 1250000,
      change: 8.5,
      trend: 'up',
      format: 'currency',
      size: 'medium',
      position: { x: 0, y: 0, w: 2, h: 1 }
    },
    {
      id: 2,
      type: 'kpi',
      title: 'EBITDA',
      value: 187500,
      change: 12.3,
      trend: 'up',
      format: 'currency',
      size: 'medium',
      position: { x: 2, y: 0, w: 2, h: 1 }
    },
    {
      id: 3,
      type: 'kpi',
      title: 'Net Income',
      value: 140625,
      change: -2.1,
      trend: 'down',
      format: 'currency',
      size: 'medium',
      position: { x: 4, y: 0, w: 2, h: 1 }
    },
    {
      id: 4,
      type: 'kpi',
      title: 'Cash Flow',
      value: 156250,
      change: 15.7,
      trend: 'up',
      format: 'currency',
      size: 'medium',
      position: { x: 6, y: 0, w: 2, h: 1 }
    },
    {
      id: 5,
      type: 'chart',
      title: 'Revenue Trend',
      chartType: 'line',
      data: [1000000, 1050000, 1100000, 1150000, 1200000, 1250000],
      labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      size: 'large',
      position: { x: 0, y: 1, w: 4, h: 2 }
    },
    {
      id: 6,
      type: 'chart',
      title: 'Entity Performance',
      chartType: 'bar',
      data: [300000, 250000, 200000, 150000, 100000, 50000],
      labels: ['Entity A', 'Entity B', 'Entity C', 'Entity D', 'Entity E', 'Entity F'],
      size: 'large',
      position: { x: 4, y: 1, w: 4, h: 2 }
    },
    {
      id: 7,
      type: 'table',
      title: 'Top Accounts',
      data: [
        { account: 'Revenue - Product A', amount: 450000, change: 12.5 },
        { account: 'Revenue - Product B', amount: 380000, change: 8.2 },
        { account: 'Revenue - Service C', amount: 320000, change: -3.1 },
        { account: 'Revenue - Product D', amount: 100000, change: 25.0 }
      ],
      size: 'medium',
      position: { x: 0, y: 3, w: 4, h: 2 }
    },
    {
      id: 8,
      type: 'kpi',
      title: 'Active Users',
      value: 156,
      change: 5.2,
      trend: 'up',
      format: 'number',
      size: 'small',
      position: { x: 4, y: 3, w: 2, h: 1 }
    },
    {
      id: 9,
      type: 'kpi',
      title: 'Processing Time',
      value: 2.3,
      change: -12.5,
      trend: 'down',
      format: 'time',
      size: 'small',
      position: { x: 6, y: 3, w: 2, h: 1 }
    }
  ])

  const availableWidgets = [
    { type: 'kpi', name: 'KPI Widget', icon: Target, description: 'Display key performance indicators' },
    { type: 'chart', name: 'Chart Widget', icon: BarChart3, description: 'Interactive charts and graphs' },
    { type: 'table', name: 'Table Widget', icon: Grid3X3, description: 'Data tables with sorting' },
    { type: 'gauge', name: 'Gauge Widget', icon: PieChart, description: 'Circular gauge indicators' },
    { type: 'metric', name: 'Metric Widget', icon: Calculator, description: 'Simple metric display' }
  ]

  const entities = [
    { id: 'all', name: 'All Entities', code: 'ALL' },
    { id: 'entity-a', name: 'Entity A', code: 'ENT-A' },
    { id: 'entity-b', name: 'Entity B', code: 'ENT-B' },
    { id: 'entity-c', name: 'Entity C', code: 'ENT-C' }
  ]

  const periods = [
    { id: 'day', name: 'Today', value: 'day' },
    { id: 'week', name: 'This Week', value: 'week' },
    { id: 'month', name: 'This Month', value: 'month' },
    { id: 'quarter', name: 'This Quarter', value: 'quarter' },
    { id: 'year', name: 'This Year', value: 'year' }
  ]

  const formatValue = (value, format) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)
      case 'number':
        return new Intl.NumberFormat('en-US').format(value)
      case 'time':
        return `${value}s`
      case 'percentage':
        return `${value}%`
      default:
        return value
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
      default:
        return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const addWidget = (widgetType) => {
    const newWidget = {
      id: Date.now(),
      type: widgetType,
      title: `New ${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)}`,
      value: 0,
      change: 0,
      trend: 'neutral',
      format: 'number',
      size: 'medium',
      position: { x: 0, y: widgets.length, w: 2, h: 1 }
    }
    setWidgets([...widgets, newWidget])
    setShowWidgetPanel(false)
  }

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'kpi':
        return (
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{widget.title}</h3>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {formatValue(widget.value, widget.format)}
            </div>
            <div className={`flex items-center text-sm ${getTrendColor(widget.trend)}`}>
              {getTrendIcon(widget.trend)}
              <span className="ml-1">{Math.abs(widget.change)}%</span>
              <span className="ml-1 text-slate-500 dark:text-slate-400">vs last period</span>
            </div>
          </div>
        )
      
      case 'chart':
        return (
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{widget.title}</h3>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="h-32 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-slate-500 dark:text-slate-400">
                {widget.chartType === 'line' ? <LineChart className="h-8 w-8 mx-auto mb-2" /> : <BarChart className="h-8 w-8 mx-auto mb-2" />}
                <p className="text-xs">{widget.chartType.charAt(0).toUpperCase() + widget.chartType.slice(1)} Chart</p>
              </div>
            </div>
          </div>
        )
      
      case 'table':
        return (
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{widget.title}</h3>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {widget.data.slice(0, 3).map((row, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-32">{row.account}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatValue(row.amount, 'currency')}
                    </span>
                    <span className={`text-xs ${row.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {row.change > 0 ? '+' : ''}{row.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Real-Time Analytics Hub</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Unified dashboard for operational and financial KPIs with real-time insights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Entity</label>
              <select 
                value={selectedEntity} 
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              >
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>{entity.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Period</label>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>{period.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="btn-secondary">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="btn-secondary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button 
              onClick={() => setShowWidgetPanel(!showWidgetPanel)}
              className="btn-secondary"
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: '📊' },
            { id: 'financial', name: 'Financial', icon: '💰' },
            { id: 'operational', name: 'Operational', icon: '⚙️' },
            { id: 'custom', name: 'Custom KPIs', icon: '🎯' }
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

      {/* Widget Panel */}
      {showWidgetPanel && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add Widgets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableWidgets.map((widget) => (
              <button
                key={widget.type}
                onClick={() => addWidget(widget.type)}
                className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <widget.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">{widget.name}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{widget.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-8 gap-4 auto-rows-min">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`col-span-${widget.position.w} row-span-${widget.position.h}`}
              style={{
                gridColumn: `span ${widget.position.w}`,
                gridRow: `span ${widget.position.h}`
              }}
            >
              {renderWidget(widget)}
            </div>
          ))}
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Total Assets', value: 2500000, change: 5.2, trend: 'up' },
              { title: 'Total Liabilities', value: 1200000, change: 2.1, trend: 'up' },
              { title: 'Equity', value: 1300000, change: 8.3, trend: 'up' },
              { title: 'Working Capital', value: 450000, change: -1.5, trend: 'down' }
            ].map((metric) => (
              <div key={metric.title} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">{metric.title}</h3>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {formatValue(metric.value, 'currency')}
                </div>
                <div className={`flex items-center text-sm ${getTrendColor(metric.trend)}`}>
                  {getTrendIcon(metric.trend)}
                  <span className="ml-1">{Math.abs(metric.change)}%</span>
                  <span className="ml-1 text-slate-500 dark:text-slate-400">vs last period</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Financial Ratios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">1.25</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Current Ratio</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">0.48</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Debt-to-Equity</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">15.0%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">ROE</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operational Tab */}
      {activeTab === 'operational' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Transaction Volume', value: 15420, change: 12.5, trend: 'up' },
              { title: 'Processing Time', value: 2.3, change: -8.2, trend: 'down' },
              { title: 'Error Rate', value: 0.15, change: -25.0, trend: 'down' },
              { title: 'Uptime', value: 99.8, change: 0.1, trend: 'up' },
              { title: 'Active Sessions', value: 234, change: 5.6, trend: 'up' },
              { title: 'Data Sync', value: 98.5, change: 1.2, trend: 'up' }
            ].map((metric) => (
              <div key={metric.title} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">{metric.title}</h3>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {metric.title.includes('Rate') || metric.title.includes('Uptime') || metric.title.includes('Sync') 
                    ? `${metric.value}%` 
                    : metric.title.includes('Time') 
                    ? `${metric.value}s` 
                    : metric.value.toLocaleString()}
                </div>
                <div className={`flex items-center text-sm ${getTrendColor(metric.trend)}`}>
                  {getTrendIcon(metric.trend)}
                  <span className="ml-1">{Math.abs(metric.change)}%</span>
                  <span className="ml-1 text-slate-500 dark:text-slate-400">vs last period</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom KPIs Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Custom KPI Builder</h3>
              <button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create KPI
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-400">Build custom KPIs based on your business needs and data sources.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RealTimeAnalytics
