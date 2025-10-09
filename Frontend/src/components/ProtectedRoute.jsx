import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const ProtectedRoute = ({ 
  children, 
  integrationName = null,
  redirectUrl = null,
  showLogin = true 
}) => {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
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

  // User is authenticated, show the protected content
  return children
}

export default ProtectedRoute