import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, Building2, User, Lock, AlertCircle } from 'lucide-react'
import axios from 'axios'

const Login = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableCompanies, setAvailableCompanies] = useState([])
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const [onboardingRequired, setOnboardingRequired] = useState(null)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  
  const navigate = useNavigate()
  const { login, isAuthenticated, logout } = useAuth()

  // Check onboarding status when component mounts
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Check if onboarding has already been completed locally
        const localOnboardingComplete = localStorage.getItem('onboardingComplete')
        
        if (localOnboardingComplete === 'true') {
          setOnboardingRequired(false)
          setCheckingOnboarding(false)
          // Load companies only if onboarding is complete
          loadAvailableCompanies()
          return
        }

        // Check with backend using the proxy URL
        const response = await axios.get('/api/onboarding/status', {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        // The backend returns { "onboarding_required": true/false }
        if (response.data && typeof response.data.onboarding_required !== 'undefined') {
          const isOnboardingRequired = response.data.onboarding_required
          setOnboardingRequired(isOnboardingRequired)
          
          if (!isOnboardingRequired) {
            // Load companies only if onboarding is complete
            loadAvailableCompanies()
          }
        } else {
          // Default to requiring onboarding if we can't determine the status
          setOnboardingRequired(true)
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error)
        // If we get a 404 or other network error, assume onboarding is required
        // This prevents getting stuck in a loop
        setOnboardingRequired(true)
      } finally {
        setCheckingOnboarding(false)
      }
    }

    // Add a small delay to ensure proxy is ready
    const timer = setTimeout(() => {
      checkOnboardingStatus()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Redirect if onboarding is required
  useEffect(() => {
    if (onboardingRequired === true) {
      // Use navigate instead of window.location.href to avoid full page reload
      navigate('/onboarding')
    }
  }, [onboardingRequired, navigate])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const loadAvailableCompanies = async () => {
    setIsLoadingCompanies(true)
    try {
      console.log('Loading available companies...')
      const response = await fetch('/api/auth/companies')
      console.log('Companies response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Companies response data:', data)
        
        if (data && Array.isArray(data.companies)) {
          const companyNames = data.companies.map(company => company.name)
          console.log('Extracted company names:', companyNames)
          setAvailableCompanies(companyNames)
        } else if (Array.isArray(data)) {
          console.log('Direct array format:', data)
          setAvailableCompanies(data)
        } else {
          console.warn('Unexpected companies response format:', data)
          setAvailableCompanies([
            'Sample Corp Ltd',
            'Tech Solutions Inc',
            'Backo',
            'FinFusion360',
            'Kayal'
          ])
        }
      } else {
        console.warn('Companies response not ok, using fallback')
        setAvailableCompanies([
          'Sample Corp Ltd',
          'Tech Solutions Inc',
          'Backo',
          'FinFusion360',
          'Kayal'
        ])
      }
    } catch (error) {
      console.error('Failed to load companies:', error)
      setAvailableCompanies([
        'Sample Corp Ltd',
        'Tech Solutions Inc',
        'Backo',
        'FinFusion360',
        'Kayal'
      ])
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('📝 Login form submitted with:', formData)
      // Use the integrated authentication service
      const result = await login(formData)
      console.log('📝 Login result received:', result)
      
      if (result.success) {
        // Login successful, redirect to dashboard
        console.log('📝 Login successful, redirecting to dashboard')
        // Use window.location for immediate redirect
        window.location.href = '/dashboard'
      } else {
        console.log('📝 Login failed:', result.error)
        setError(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('📝 Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Clear form data
      setFormData({
        company_name: '',
        username: '',
        password: ''
      })
      // Clear any errors
      setError('')
    } catch (error) {
      console.error('Logout error:', error)
      setError('Failed to logout. Please try again.')
    }
  }

  const handleCompanySelect = (companyName) => {
    setFormData(prev => ({
      ...prev,
      company_name: companyName
    }))
  }

  // Show loading while checking onboarding status
  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking onboarding status...</p>
        </div>
      </div>
    )
  }

  // If onboarding is required, redirect (this should happen via useEffect)
  if (onboardingRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to onboarding...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            IFRS Consolidation Tool
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your company account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <div className="relative">
                <select
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                  disabled={isLoadingCompanies}
                >
                  <option value="">Select your company</option>
                  {Array.isArray(availableCompanies) && availableCompanies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              {isLoadingCompanies && (
                <p className="mt-1 text-xs text-gray-500">Loading companies...</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.company_name || !formData.username || !formData.password}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Company:</strong> Sample Corp Ltd</p>
              <p><strong>Username:</strong> admin</p>
              <p><strong>Password:</strong> admin123</p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Use these credentials to test the system. Each company has isolated data.
            </p>
            
            {/* Test Backend Integration Button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  console.log('Testing backend integration...')
                  
                  // Test companies endpoint
                  const companiesResponse = await fetch('/api/companies')
                  console.log('Companies response:', companiesResponse.status)
                  if (companiesResponse.ok) {
                    const companiesData = await companiesResponse.json()
                    console.log('Companies data:', companiesData)
                  }
                  
                  // Test login endpoint
                  const loginResponse = await fetch('/api/auth/login-json', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      company_name: 'Sample Corp Ltd',
                      username: 'admin',
                      password: 'admin123'
                    })
                  })
                  console.log('Login test response:', loginResponse.status)
                  if (loginResponse.ok) {
                    const loginData = await loginResponse.json()
                    console.log('Login test data:', loginData)
                  }
                  
                  console.log('Backend integration test completed')
                } catch (error) {
                  console.error('Backend integration test failed:', error)
                }
              }}
              className="mt-3 w-full px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              Test Backend Integration
            </button>
          </div>

          {/* Company Isolation Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              <strong>Data Isolation:</strong> Each company has completely separate data, 
              including accounts, entities, and financial statements.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 IFRS Consolidation Tool. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login