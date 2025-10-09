import { useState, useEffect, createContext, useContext, useRef } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const initialized = useRef(false)

  // Initialize auth state from cookies/localStorage on mount - ONLY ONCE
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      initializeAuth()
    }
  }, [])

  // Add a function to check if we're already authenticated
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/user-info', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const userInfo = await response.json()
        if (userInfo.company_name && userInfo.username) {
          // We have a valid session
          const userData = {
            username: userInfo.username,
            company: userInfo.company_name,
            role: 'admin',
            full_name: userInfo.username,
            user_id: userInfo.user_id,
            email: userInfo.email
          }
          
          setUser(userData)
          setIsAuthenticated(true)
          setSelectedCompany(userInfo.company_name)
          
          // Store in localStorage for persistence
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('selectedCompany', userInfo.company_name)
          
          console.log('✅ Restored session. Company set to:', userInfo.company_name)
          
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Auth status check failed:', error)
      return false
    }
  }

  const initializeAuth = async () => {
    try {
      console.log('🔍 Initializing authentication...')
      
      // First, check if onboarding is required
      // If onboarding is required, we shouldn't try to authenticate
      const onboardingComplete = localStorage.getItem('onboardingComplete')
      if (onboardingComplete !== 'true') {
        // Check with backend
        try {
          const response = await axios.get('/api/onboarding/status', {
            timeout: 5000
          })
          
          // If onboarding is required, don't try to authenticate
          if (response.data && response.data.onboarding_required) {
            console.log('🔍 Onboarding required, skipping authentication check')
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Failed to check onboarding status:', error)
          // If we get an HTML response, it means the backend route isn't found
          if (error.response && error.response.data && typeof error.response.data === 'string' && error.response.data.includes('<html')) {
            console.log('🔍 Received HTML response for onboarding check, assuming onboarding required')
            setLoading(false)
            return
          } else if (error.response && error.response.status === 404) {
            console.log('🔍 Onboarding status endpoint not found, assuming onboarding required')
            setLoading(false)
            return
          } else {
            // For other errors, assume onboarding is required to avoid infinite loop
            console.log('🔍 Assuming onboarding required due to error, skipping authentication check')
            setLoading(false)
            return
          }
        }
      }
      
      // First, try to check if we already have a valid session
      const isAuthenticated = await checkAuthStatus()
      
      if (isAuthenticated) {
        console.log('🔍 Valid session found, user is authenticated')
        setLoading(false)
        return
      }
      
      // Check if we have a valid Bearer token in localStorage
      const authToken = localStorage.getItem('authToken')
      const storedUser = localStorage.getItem('user')
      const storedCompany = localStorage.getItem('selectedCompany')
      
      if (authToken && storedUser && storedCompany) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          setIsAuthenticated(true)
          setSelectedCompany(storedCompany)
          console.log('🔍 Restored auth state from localStorage for company:', storedCompany)
          console.log('🔍 Using Bearer token for API authentication')
        } catch (error) {
          console.error('Failed to parse stored user data:', error)
          localStorage.removeItem('user')
          localStorage.removeItem('selectedCompany')
          localStorage.removeItem('authToken')
        }
      }
      
      // If still not authenticated, check URL parameters for auth transfer
      const urlParams = new URLSearchParams(window.location.search)
      const authTokenParam = urlParams.get('token')
      const companyParam = urlParams.get('company')
      
      if (authTokenParam && companyParam) {
        console.log('🔍 Found auth token in URL parameters, setting up authentication')
        localStorage.setItem('authToken', authTokenParam)
        localStorage.setItem('selectedCompany', companyParam)
        
        const userData = {
          username: 'admin', // Default username
          company: companyParam,
          role: 'admin',
          full_name: 'Admin User',
          user_id: null,
          email: null
        }
        
        setUser(userData)
        setIsAuthenticated(true)
        setSelectedCompany(companyParam)
        localStorage.setItem('user', JSON.stringify(userData))
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      console.log('🚀 Login attempt with:', credentials)
      
      // New company-based authentication system
      if (credentials.company_name && credentials.username && credentials.password) {
        const response = await fetch('/api/auth/login-json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            company_name: credentials.company_name,
            username: credentials.username,
            password: credentials.password
          }),
          credentials: 'include' // Include cookies
        })

        console.log('🚀 Login response status:', response.status)

        if (response.ok) {
          const result = await response.json()
          console.log('🚀 Login response data:', result)
          
          if (result.success) {
            // Login successful - cookies are set automatically
            // Backend returns: { success, message, token, company_name, username, user_id, email }
            const userData = {
              username: result.username,
              company: result.company_name,
              role: 'admin', // Admin role for onboarding users
              full_name: result.username,
              user_id: result.user_id,
              email: result.email
            }
            
            console.log('🚀 Setting user data after login:', userData)
            
            // Store the Bearer token for API authentication
            if (result.token) {
              localStorage.setItem('authToken', result.token)
              console.log('🚀 Bearer token stored in localStorage:', result.token)
            }
            
            // Update state
            setUser(userData)
            setIsAuthenticated(true)
            setSelectedCompany(result.company_name)
            
            // Store in localStorage for persistence
            localStorage.setItem('user', JSON.stringify(userData))
            localStorage.setItem('selectedCompany', result.company_name)
            
            console.log('✅ User logged in successfully. Company set to:', result.company_name)
            
            return { success: true }
          } else {
            return { success: false, error: result.message || 'Login failed' }
          }
        } else {
          const errorData = await response.json()
          console.log('🚀 Error data received:', errorData)
          
          // Handle different error formats
          let errorMessage = 'Login failed'
          
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // Handle validation errors array
              errorMessage = errorData.detail.map(err => err.msg || err.message || 'Validation error').join(', ')
            } else {
              errorMessage = errorData.detail
            }
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
          
          return { success: false, error: errorMessage }
        }
      } else {
        return { success: false, error: 'Missing required credentials' }
      }
    } catch (error) {
      console.error('🚀 Login error:', error)
      return { success: false, error: 'Network error. Please check your connection.' }
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear all auth data
      setUser(null)
      setIsAuthenticated(false)
      setSelectedCompany(null)
      localStorage.removeItem('user')
      localStorage.removeItem('selectedCompany')
      localStorage.removeItem('authToken')
      
      // Redirect to Python login page
      window.location.href = '/login'
    }
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Add Bearer token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    selectedCompany,
    login,
    logout,
    getAuthHeaders,
    setSelectedCompany
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}