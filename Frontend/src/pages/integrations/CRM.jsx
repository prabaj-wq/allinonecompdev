import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import IntegrationPage from '../../components/IntegrationPage'
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar 
} from 'lucide-react'

const CRM = () => {
  const quickActions = [
    {
      icon: <Users className="w-5 h-5" />,
      label: "Customer Database"
    },
    {
      icon: <Phone className="w-5 h-5" />,
      label: "Call Logs"
    },
    {
      icon: <Mail className="w-5 h-5" />,
      label: "Email Campaigns"
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Meeting Scheduler"
    }
  ]

  return (
    <ProtectedRoute integrationName="CRM">
      <IntegrationPage
        integrationName="CRM"
        port={3003}
        description="Customer relationship management and sales pipeline tracking"
        quickActions={quickActions}
        version="3.2.0"
        users="25 active"
        lastUpdated="3 days ago"
      />
    </ProtectedRoute>
  )
}

export default CRM
