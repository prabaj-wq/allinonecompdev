import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import IntegrationPage from '../../components/IntegrationPage'
import { 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  PieChart 
} from 'lucide-react'

const RevenueAnalytics = () => {
  const quickActions = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Revenue Trends"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Performance Metrics"
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: "Financial Reports"
    },
    {
      icon: <PieChart className="w-5 h-5" />,
      label: "Revenue Distribution"
    }
  ]

  return (
    <ProtectedRoute integrationName="Revenue analytics">
      <IntegrationPage
        integrationName="Revenue analytics"
        port={3007}
        description="Revenue analysis, forecasting, and performance tracking"
        quickActions={quickActions}
        version="2.5.0"
        users="30 active"
        lastUpdated="6 hours ago"
      />
    </ProtectedRoute>
  )
}

export default RevenueAnalytics
