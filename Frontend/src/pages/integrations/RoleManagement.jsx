import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import IntegrationPage from '../../components/IntegrationPage'
import { 
  Shield, 
  Users, 
  Key, 
  Lock 
} from 'lucide-react'

const RoleManagement = () => {
  const quickActions = [
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Role Profiles"
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "User Access"
    },
    {
      icon: <Key className="w-5 h-5" />,
      label: "Permission Matrix"
    },
    {
      icon: <Lock className="w-5 h-5" />,
      label: "Access Control"
    }
  ]

  return (
    <ProtectedRoute integrationName="Role management">
      <IntegrationPage
        integrationName="Role management"
        port={4028}
        description="User roles, permissions, and access control management"
        quickActions={quickActions}
        version="1.5.0"
        users="8 active"
        lastUpdated="1 week ago"
      />
    </ProtectedRoute>
  )
}

export default RoleManagement
