import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import App from './App'
import Onboarding from './components/Onboarding'
import { AuthProvider } from './hooks/useAuth'

const AppWithOnboarding: React.FC = () => {
  const [onboardingRequired, setOnboardingRequired] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Check if onboarding has already been completed locally
        const localOnboardingComplete = localStorage.getItem('onboardingComplete')
        console.log('Local onboarding complete status:', localOnboardingComplete)
        
        if (localOnboardingComplete === 'true') {
          setOnboardingRequired(false)
          setLoading(false)
          return
        }

        // Check with backend using the proxy URL
        console.log('Checking onboarding status with backend...')
        // Use the proxy path instead of direct URL
        const response = await axios.get('/api/onboarding/status', {
          timeout: 5000, // 5 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        })
        console.log('Backend onboarding status response:', response)
        console.log('Backend onboarding status response data:', response.data)
        
        // The backend returns { "onboarding_required": true/false }
        if (response.data && typeof response.data.onboarding_required !== 'undefined') {
          setOnboardingRequired(response.data.onboarding_required)
        } else {
          // If the structure is different, check if onboarding is needed based on first_install.json
          console.log('Checking first install status...')
          const firstInstallResponse = await axios.get('/first-install-status')
          console.log('First install status response:', firstInstallResponse.data)
          setOnboardingRequired(firstInstallResponse.data.first_install)
        }
      } catch (error: any) {
        console.error('Failed to check onboarding status:', error)
        console.error('Error response:', error.response)
        console.error('Error request:', error.request)
        
        // If we get an HTML response, it means the backend route isn't found
        if (error.response && error.response.data && typeof error.response.data === 'string' && error.response.data.includes('<html')) {
          console.log('Received HTML response, assuming onboarding is required')
          setOnboardingRequired(true)
        } else if (error.code === 'ECONNABORTED') {
          console.log('Request timeout, assuming onboarding is required')
          setOnboardingRequired(true)
        } else if (error.response && error.response.status === 404) {
          console.log('Backend route not found, assuming onboarding is required')
          setOnboardingRequired(true)
        } else {
          // Default to showing onboarding if we can't check
          // But to avoid infinite loops, let's check localStorage as a fallback
          const localOnboardingComplete = localStorage.getItem('onboardingComplete')
          if (localOnboardingComplete === 'true') {
            setOnboardingRequired(false)
          } else {
            setOnboardingRequired(true)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking onboarding status...</p>
        </div>
      </div>
    )
  }

  console.log('Onboarding required:', onboardingRequired)

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {onboardingRequired ? (
            <>
              <Route path="/onboarding/*" element={<Onboarding />} />
              <Route path="*" element={<Navigate to="/onboarding" replace />} />
            </>
          ) : (
            <Route path="*" element={<App />} />
          )}
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default AppWithOnboarding