import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import IntegrationPage from '../../components/IntegrationPage'
import { 
  ClipboardList, 
  Calendar, 
  Users, 
  BarChart3 
} from 'lucide-react'

const ProjectManagement = () => {
  const quickActions = [
    {
      icon: <ClipboardList className="w-5 h-5" />,
      label: "Project Dashboard"
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Timeline View"
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Team Management"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Progress Reports"
    }
  ]

  return (
    <ProtectedRoute integrationName="Project management">
      <IntegrationPage
        integrationName="Project management"
        port={3005}
        description="Project planning, tracking, and team collaboration"
        quickActions={quickActions}
        version="1.9.0"
        users="18 active"
        lastUpdated="1 day ago"
      />
    </ProtectedRoute>
  )
}

export default ProjectManagement
