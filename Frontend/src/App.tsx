import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, theme } from 'antd'
import './App.css'
import DashboardEnhanced from './pages/DashboardEnhanced'
import ProtectedRoute from './components/ProtectedRoute'
import TwoFactorWrapper from './components/TwoFactorWrapper'
import { TwoFactorProvider } from './contexts/TwoFactorContext'
import ToastContainer from './components/ToastContainer'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import { CompanyProvider } from './contexts/CompanyContext'
import { ThemeProvider } from './contexts/ThemeContext'

const { Content, Footer } = Layout

const AppContent: React.FC = () => {
  const { token } = theme.useToken()
  
  // Check if user is authenticated from localStorage first
  const authToken = localStorage.getItem('authToken')
  const storedUser = localStorage.getItem('user')
  
  // If no auth token or user data, show login immediately
  if (!authToken || !storedUser) {
    return <Login />
  }
  
  // If we have auth data, proceed with full auth check
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <ThemeProvider>
      <CompanyProvider>
        <TwoFactorProvider>
          <div style={{ minHeight: '100vh', width: '100vw', margin: 0, padding: 0 }}>
            <TwoFactorWrapper />
            <ToastContainer />
          </div>
        </TwoFactorProvider>
      </CompanyProvider>
    </ThemeProvider>
  )
}

const App: React.FC = () => {
  return <AppContent />
}

export default App