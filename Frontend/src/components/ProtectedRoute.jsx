import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../contexts/PermissionsContext'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Lock, ArrowLeft } from 'lucide-react'

const ProtectedRoute = ({ 
  children, 
  integrationName = null,
  redirectUrl = null,
  showLogin = true,
  requiredPage = null, // Page path that user must have access to
  adminOnly = false // Whether this route requires admin access
}) => {
  const { isAuthenticated, isLoading } = useAuth()
  const { hasPageAccess, isAdmin, loading: permissionsLoading } = usePermissions()
  const navigate = useNavigate()

  // Show loading spinner while checking authentication or permissions
  if (isLoading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoading ? 'Checking authentication...' : 'Loading permissions...'}
          </p>
        </div>
      </div>
    )
  }

  // If not authenticated and login should be shown
  if (!isAuthenticated && showLogin) {
    // Redirect to the main login page
    navigate('/')
    return null
  }

  // If not authenticated and login should not be shown, redirect to main app
  if (!isAuthenticated && !showLogin) {
    window.location.href = '/'
    return null
  }

  // Check admin access if required
  if (adminOnly && !isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have administrator privileges to access this page.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Check specific page access if required
  if (requiredPage && !hasPageAccess(requiredPage)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you need access.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // User is authenticated and has required permissions, show the protected content
  return children
}

export default ProtectedRoute