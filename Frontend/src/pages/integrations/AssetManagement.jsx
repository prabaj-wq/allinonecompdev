import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import IntegrationPage from '../../components/IntegrationPage'
import { 
  Building2, 
  BarChart3, 
  FileText, 
  DollarSign 
} from 'lucide-react'

const AssetManagement = () => {
  const quickActions = [
    {
      icon: <Building2 className="w-5 h-5" />,
      label: "Asset Register"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Depreciation Report"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Asset Documents"
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: "Valuation Report"
    }
  ]

  return (
    <ProtectedRoute integrationName="Asset management">
      <IntegrationPage
        integrationName="Asset management"
        port={3001}
        description="Fixed asset lifecycle management, depreciation tracking, and asset valuation"
        quickActions={quickActions}
        version="2.1.0"
        users="12 active"
        lastUpdated="2 days ago"
      />
    </ProtectedRoute>
  )
}

export default AssetManagement
