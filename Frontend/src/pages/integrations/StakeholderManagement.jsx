import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import IntegrationPage from '../../components/IntegrationPage'
import { 
  Handshake, 
  Users, 
  MessageSquare, 
  Calendar 
} from 'lucide-react'

const StakeholderManagement = () => {
  const quickActions = [
    {
      icon: <Handshake className="w-5 h-5" />,
      label: "Stakeholder Directory"
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Communication Logs"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "Engagement Reports"
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Meeting Schedules"
    }
  ]

  return (
    <ProtectedRoute integrationName="Stakeholder management">
      <IntegrationPage
        integrationName="Stakeholder management"
        port={3008}
        description="Stakeholder engagement and communication management"
        quickActions={quickActions}
        version="1.7.0"
        users="12 active"
        lastUpdated="2 weeks ago"
      />
    </ProtectedRoute>
  )
}

export default StakeholderManagement
