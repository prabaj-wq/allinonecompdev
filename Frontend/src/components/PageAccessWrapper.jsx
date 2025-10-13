import React, { useState } from 'react'
import { usePermissions } from '../contexts/PermissionsContext'
import { useAuth } from '../hooks/useAuth'
import { Lock, Send, X, AlertTriangle } from 'lucide-react'

const PageAccessWrapper = ({ children, requiredPage, pageName }) => {
  const { hasPageAccess, isAdmin, userPermissions, loading } = usePermissions()
  const { user, selectedCompany } = useAuth()
  const [showAccessRequest, setShowAccessRequest] = useState(false)
  const [requestReason, setRequestReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [requestSubmitted, setRequestSubmitted] = useState(false)

  console.log('🔐 PageAccessWrapper Debug:', {
    requiredPage,
    pageName,
    user: user?.username,
    userPermissions,
    loading,
    isAdminResult: isAdmin()
  })

  // Admin users bypass all restrictions
  if (isAdmin()) {
    console.log('🔐 Admin access granted for:', pageName)
    return children
  }

  // Check if user has access to this page
  const hasAccess = hasPageAccess(requiredPage)
  console.log('🔐 Page access result for', requiredPage, ':', hasAccess)

  const handleAccessRequest = async () => {
    if (!requestReason.trim()) return

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/role-management/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username: user.username,
          company_name: selectedCompany,
          requested_page: requiredPage,
          page_name: pageName,
          reason: requestReason.trim(),
          request_type: 'page_access'
        })
      })

      if (response.ok) {
        setRequestSubmitted(true)
        setShowAccessRequest(false)
        setRequestReason('')
      } else {
        console.error('Failed to submit access request')
      }
    } catch (error) {
      console.error('Error submitting access request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!hasAccess) {
    return (
      <div className="relative min-h-screen">
        {/* Blurred content */}
        <div className="filter blur-md pointer-events-none select-none">
          {children}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Access Restricted
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You don't have permission to access <strong>{pageName || requiredPage}</strong>. 
                You can request access from your administrator.
              </p>

              {requestSubmitted ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2 mr-3">
                      <Send className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-green-800 dark:text-green-200">
                        Request Submitted
                      </h4>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        Your access request has been sent to the administrator.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowAccessRequest(true)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Request Access
                  </button>
                  
                  <button
                    onClick={() => window.history.back()}
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Access Request Modal */}
        {showAccessRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center z-[9999] pt-20">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Request Page Access
                </h3>
                <button
                  onClick={() => setShowAccessRequest(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Requested
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pageName || requiredPage}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {requiredPage}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Access *
                  </label>
                  <textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Please explain why you need access to this page..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={4}
                    required
                    autoFocus
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAccessRequest(false)}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAccessRequest}
                    disabled={!requestReason.trim() || submitting}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return children
}

export default PageAccessWrapper
