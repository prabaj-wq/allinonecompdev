import React from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { useCompany } from '../../../contexts/CompanyContext'
import { Shield, AlertTriangle, LogIn, ArrowRight } from 'lucide-react'

const AdminAuthWrapper = ({ children }) => {
  // ===== CONTEXT HOOKS =====
  const { isAuthenticated, selectedCompany: authSelectedCompany, user, loading } = useAuth()
  const { selectedCompany: companyContextCompany } = useCompany()
  
  // Use the company from auth context as primary, fallback to company context
  const selectedCompany = authSelectedCompany || companyContextCompany
  
  // Check if user is admin (only by username, not role field)
  const isAdmin = user?.username === 'admin'
  
  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Checking authentication...
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Please wait while we verify your access.
          </p>
        </div>
      </div>
    )
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Authentication Required
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please log in with your admin credentials to access the Role Management system.
            </p>
            
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <LogIn className="h-5 w-5" />
              <span>Login as Admin</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Admin Access Only
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Role Management requires administrator privileges to ensure security and proper access control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If authenticated but not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Admin Access Required
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Only administrators can access the Role Management system.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p><span className="font-medium">Current User:</span> {user?.username || 'Unknown'}</p>
                <p><span className="font-medium">Role:</span> {user?.role || 'user'}</p>
                <p><span className="font-medium">Company:</span> {selectedCompany || 'None'}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <LogIn className="h-5 w-5" />
                <span>Login as Admin</span>
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If authenticated and admin, show the protected content
  return children
}

export default AdminAuthWrapper
