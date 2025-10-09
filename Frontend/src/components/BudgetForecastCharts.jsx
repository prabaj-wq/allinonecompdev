import React from 'react'
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  AlertCircle
} from 'lucide-react'

// Budget vs Actual Comparison Chart
export const BudgetVsActualChart = ({ data, title = "Budget vs Actual Performance" }) => {
  const chartData = data || {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    budget: [100000, 120000, 110000, 130000, 125000, 140000],
    actual: [95000, 125000, 105000, 135000, 120000, 145000]
  }

  const maxValue = Math.max(...chartData.budget, ...chartData.actual)
  const height = 300

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="relative" style={{ height: height + 60 }}>
        <svg width="100%" height={height} className="mb-4">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={i}
              x1="0"
              y1={(i / 5) * height}
              x2="100%"
              y2={(i / 5) * height}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Budget bars */}
          {chartData.budget.map((value, index) => {
            const barHeight = (value / maxValue) * height
            const barWidth = 100 / chartData.budget.length - 2
            const x = (index * 100) / chartData.budget.length + 1
            const y = height - barHeight

            return (
              <g key={`budget-${index}`}>
                <rect
                  x={`${x}%`}
                  y={y}
                  width={`${barWidth}%`}
                  height={barHeight}
                  fill="#3b82f6"
                  opacity="0.7"
                />
                <text
                  x={`${x + barWidth / 2}%`}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  ${(value / 1000).toFixed(0)}k
                </text>
              </g>
            )
          })}

          {/* Actual bars */}
          {chartData.actual.map((value, index) => {
            const barHeight = (value / maxValue) * height
            const barWidth = 100 / chartData.actual.length - 2
            const x = (index * 100) / chartData.actual.length + 1
            const y = height - barHeight

            return (
              <g key={`actual-${index}`}>
                <rect
                  x={`${x + barWidth / 4}%`}
                  y={y}
                  width={`${barWidth / 2}%`}
                  height={barHeight}
                  fill="#10b981"
                  opacity="0.8"
                />
              </g>
            )
          })}

          {/* X-axis labels */}
          {chartData.labels.map((label, index) => {
            const x = (index * 100) / chartData.labels.length + 50 / chartData.labels.length
            return (
              <text
                key={label}
                x={`${x}%`}
                y={height + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {label}
              </text>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="flex justify-center space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 opacity-70 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Budget</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 opacity-80 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Actual</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Forecast Trend Chart
export const ForecastTrendChart = ({ data, title = "Forecast Trend Analysis" }) => {
  const chartData = data || {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    base: [100000, 105000, 110000, 115000, 120000, 125000, 130000, 135000],
    optimistic: [110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000],
    pessimistic: [90000, 95000, 100000, 105000, 110000, 115000, 120000, 125000]
  }

  const maxValue = Math.max(...chartData.base, ...chartData.optimistic, ...chartData.pessimistic)
  const height = 300

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="relative" style={{ height: height + 60 }}>
        <svg width="100%" height={height} className="mb-4">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={i}
              x1="0"
              y1={(i / 5) * height}
              x2="100%"
              y2={(i / 5) * height}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Base scenario line */}
          <polyline
            points={chartData.base.map((value, index) => {
              const x = (index / (chartData.base.length - 1)) * 100
              const y = height - (value / maxValue) * height
              return `${x}%,${y}`
            }).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
          />

          {/* Optimistic scenario line */}
          <polyline
            points={chartData.optimistic.map((value, index) => {
              const x = (index / (chartData.optimistic.length - 1)) * 100
              const y = height - (value / maxValue) * height
              return `${x}%,${y}`
            }).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Pessimistic scenario line */}
          <polyline
            points={chartData.pessimistic.map((value, index) => {
              const x = (index / (chartData.pessimistic.length - 1)) * 100
              const y = height - (value / maxValue) * height
              return `${x}%,${y}`
            }).join(' ')}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Data points */}
          {chartData.base.map((value, index) => {
            const x = (index / (chartData.base.length - 1)) * 100
            const y = height - (value / maxValue) * height
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={y}
                r="4"
                fill="#3b82f6"
              />
            )
          })}

          {/* X-axis labels */}
          {chartData.labels.map((label, index) => {
            const x = (index / (chartData.labels.length - 1)) * 100
            return (
              <text
                key={label}
                x={`${x}%`}
                y={height + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {label}
              </text>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="flex justify-center space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Base Scenario</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Optimistic</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Pessimistic</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Variance Analysis Chart
export const VarianceAnalysisChart = ({ data, title = "Variance Analysis" }) => {
  const chartData = data || [
    { category: 'Revenue', budget: 1200000, actual: 1180000, variance: -1.67 },
    { category: 'Expenses', budget: 800000, actual: 820000, variance: 2.5 },
    { category: 'Marketing', budget: 150000, actual: 145000, variance: -3.33 },
    { category: 'Operations', budget: 200000, actual: 210000, variance: 5.0 },
    { category: 'IT', budget: 100000, actual: 95000, variance: -5.0 }
  ]

  const maxVariance = Math.max(...chartData.map(item => Math.abs(item.variance)))
  const height = 300

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {chartData.map((item, index) => {
          const barWidth = (Math.abs(item.variance) / maxVariance) * 100
          const isPositive = item.variance > 0
          
          return (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-24 text-sm font-medium text-gray-700">
                {item.category}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div
                  className={`h-4 rounded-full ${
                    isPositive ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                ></div>
              </div>
              <div className="w-20 text-right">
                <span className={`text-sm font-medium ${
                  isPositive ? 'text-red-600' : 'text-green-600'
                }`}>
                  {isPositive ? '+' : ''}{item.variance.toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-center space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Under Budget</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Over Budget</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// KPI Dashboard Cards
export const KPIDashboard = ({ metrics }) => {
  const defaultMetrics = metrics || {
    budgetAccuracy: 92.5,
    forecastAccuracy: 88.3,
    timelySubmissions: 95.2,
    approvalRate: 87.8,
    totalBudgets: 15,
    activeForecasts: 8,
    varianceAlerts: 3,
    completionRate: 94.1
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Budget Accuracy</p>
            <p className="text-2xl font-bold text-gray-900">{defaultMetrics.budgetAccuracy}%</p>
            <p className="text-xs text-gray-500">Target: 90%</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Forecast Accuracy</p>
            <p className="text-2xl font-bold text-gray-900">{defaultMetrics.forecastAccuracy}%</p>
            <p className="text-xs text-gray-500">Target: 85%</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Timely Submissions</p>
            <p className="text-2xl font-bold text-gray-900">{defaultMetrics.timelySubmissions}%</p>
            <p className="text-xs text-gray-500">On schedule</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg">
            <AlertCircle className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Variance Alerts</p>
            <p className="text-2xl font-bold text-gray-900">{defaultMetrics.varianceAlerts}</p>
            <p className="text-xs text-gray-500">Require attention</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Scenario Comparison Chart
export const ScenarioComparisonChart = ({ data, title = "Scenario Comparison" }) => {
  const chartData = data || {
    scenarios: ['Base', 'Optimistic', 'Pessimistic'],
    revenue: [1000000, 1150000, 900000],
    expenses: [800000, 840000, 864000],
    netIncome: [200000, 310000, 36000]
  }

  const maxValue = Math.max(...chartData.revenue, ...chartData.expenses, ...chartData.netIncome)
  const height = 300

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="relative" style={{ height: height + 60 }}>
        <svg width="100%" height={height} className="mb-4">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={i}
              x1="0"
              y1={(i / 5) * height}
              x2="100%"
              y2={(i / 5) * height}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Revenue bars */}
          {chartData.revenue.map((value, index) => {
            const barHeight = (value / maxValue) * height
            const barWidth = 100 / chartData.revenue.length / 3 - 1
            const x = (index * 100) / chartData.revenue.length + barWidth
            const y = height - barHeight

            return (
              <g key={`revenue-${index}`}>
                <rect
                  x={`${x}%`}
                  y={y}
                  width={`${barWidth}%`}
                  height={barHeight}
                  fill="#3b82f6"
                />
                <text
                  x={`${x + barWidth / 2}%`}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  ${(value / 1000).toFixed(0)}k
                </text>
              </g>
            )
          })}

          {/* Expenses bars */}
          {chartData.expenses.map((value, index) => {
            const barHeight = (value / maxValue) * height
            const barWidth = 100 / chartData.expenses.length / 3 - 1
            const x = (index * 100) / chartData.expenses.length + barWidth * 2
            const y = height - barHeight

            return (
              <g key={`expenses-${index}`}>
                <rect
                  x={`${x}%`}
                  y={y}
                  width={`${barWidth}%`}
                  height={barHeight}
                  fill="#ef4444"
                />
              </g>
            )
          })}

          {/* Net Income bars */}
          {chartData.netIncome.map((value, index) => {
            const barHeight = (value / maxValue) * height
            const barWidth = 100 / chartData.netIncome.length / 3 - 1
            const x = (index * 100) / chartData.netIncome.length + barWidth * 3
            const y = height - barHeight

            return (
              <g key={`netIncome-${index}`}>
                <rect
                  x={`${x}%`}
                  y={y}
                  width={`${barWidth}%`}
                  height={barHeight}
                  fill="#10b981"
                />
              </g>
            )
          })}

          {/* X-axis labels */}
          {chartData.scenarios.map((scenario, index) => {
            const x = (index * 100) / chartData.scenarios.length + 50 / chartData.scenarios.length
            return (
              <text
                key={scenario}
                x={`${x}%`}
                y={height + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {scenario}
              </text>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="flex justify-center space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Revenue</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Expenses</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Net Income</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default {
  BudgetVsActualChart,
  ForecastTrendChart,
  VarianceAnalysisChart,
  KPIDashboard,
  ScenarioComparisonChart
}
