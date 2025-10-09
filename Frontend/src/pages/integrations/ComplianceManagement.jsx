import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import IntegrationPage from '../../components/IntegrationPage'
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle 
} from 'lucide-react'

const ComplianceManagement = () => {
  const quickActions = [
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Compliance Dashboard"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Regulatory Reports"
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "Risk Alerts"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      label: "Audit Checklist"
    }
  ]

  return (
    <ProtectedRoute integrationName="Complaince management">
      <IntegrationPage
        integrationName="Complaince management"
        port={3002}
        description="Regulatory compliance tracking, risk management, and audit preparation"
        quickActions={quickActions}
        version="1.8.0"
        users="8 active"
        lastUpdated="1 week ago"
      />
    </ProtectedRoute>
  )
}

export default ComplianceManagement
