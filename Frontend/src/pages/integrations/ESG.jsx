import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import IntegrationPage from '../../components/IntegrationPage'
import { 
  Leaf, 
  Globe, 
  Users, 
  TrendingUp 
} from 'lucide-react'

const ESG = () => {
  const quickActions = [
    {
      icon: <Leaf className="w-5 h-5" />,
      label: "Environmental Metrics"
    },
    {
      icon: <Globe className="w-5 h-5" />,
      label: "Sustainability Reports"
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Social Impact"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "ESG Performance"
    }
  ]

  return (
    <ProtectedRoute integrationName="ESG">
      <IntegrationPage
        integrationName="ESG"
        port={3004}
        description="Environmental, Social & Governance reporting and analytics"
        quickActions={quickActions}
        version="2.0.0"
        users="15 active"
        lastUpdated="5 days ago"
      />
    </ProtectedRoute>
  )
}

export default ESG
