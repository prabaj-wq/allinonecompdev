import React, { createContext, useContext, useState, useEffect } from 'react'

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
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('authToken'))
  const [selectedCompany, setSelectedCompany] = useState(localStorage.getItem('selectedCompany'))

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const storedToken = localStorage.getItem('authToken')
      if (storedToken) {
        // Verify token with backend
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
          setIsAuthenticated(true)
          setToken(storedToken)
          
          // Set company from user data if not already set
          if (userData.user?.company && !selectedCompany) {
            setSelectedCompany(userData.user.company)
            localStorage.setItem('selectedCompany', userData.user.company)
          }
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('authToken')
          setToken(null)
          setUser(null)
          setIsAuthenticated(false)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('authToken')
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (response.ok) {
        const data = await response.json()
        const { user: userData, token: authToken } = data
        
        // Store token and user data
        localStorage.setItem('authToken', authToken)
        setToken(authToken)
        setUser(userData)
        setIsAuthenticated(true)
        
        // Set company from login response
        if (userData.company) {
          setSelectedCompany(userData.company)
          localStorage.setItem('selectedCompany', userData.company)
        }
        
        return { success: true, user: userData }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error during login' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('selectedCompany')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    setSelectedCompany(null)
    
    // Redirect to main login page
    window.location.href = '/'
  }

  const register = async (userData) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, message: data.message }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Network error during registration' }
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
        return { success: true, user: updatedUser }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || 'Profile update failed' }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      return { success: false, error: 'Network error during profile update' }
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    token,
    selectedCompany,
    setSelectedCompany,
    login,
    logout,
    register,
    updateProfile,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
