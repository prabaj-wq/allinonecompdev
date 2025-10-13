import React, { useState, useEffect, useRef } from 'react'
import { Form, Button, Card, Alert, Typography } from 'antd'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { 
  RocketOutlined, 
  ApartmentOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  CheckOutlined
} from '@ant-design/icons'
import ParallaxBackground from './animations/ParallaxBackground'
import WelcomeStep from './steps/WelcomeStep'
import CompanyStep from './steps/CompanyStep'
import AdminStep from './steps/AdminStep'
import ConfirmStep from './steps/ConfirmStep'
import SuccessStep from './steps/SuccessStep'
import './OnboardingModern.css'

interface CompanyForm {
  companyName: string
  environmentType: string
  industry: string
  otherIndustry?: string
}

interface AdminForm {
  username: string
  email: string
  password: string
}

const OnboardingWizard: React.FC = () => {
  const [current, setCurrent] = useState(0)
  const [companyData, setCompanyData] = useState<CompanyForm | null>(null)
  const [adminData, setAdminData] = useState<AdminForm | null>(null)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState('')
  const [companyForm] = Form.useForm()
  const [adminForm] = Form.useForm()
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Handle window resize for confetti and parallax
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Focus management - ensure focus is properly managed when step changes
  useEffect(() => {
    if (contentRef.current) {
      // Focus the first focusable element in the content when step changes
      const firstFocusable = contentRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (firstFocusable instanceof HTMLElement) {
        firstFocusable.focus()
      }
    }
  }, [current])

  // Password strength calculator
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    let feedback = ''
    
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    
    if (strength < 50) {
      feedback = 'Weak'
    } else if (strength < 75) {
      feedback = 'Medium'
    } else {
      feedback = 'Strong'
    }
    
    setPasswordStrength(strength)
    setPasswordFeedback(feedback)
  }

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Education',
    'Government',
    'Energy',
    'Telecommunications',
    'Transportation',
    'Other'
  ]

  const environmentTypes = [
    'production',
    'development'
  ]

  const next = () => {
    if (current === 0) {
      setCurrent(current + 1)
      return
    }
    
    if (current === 1) {
      companyForm.validateFields().then(values => {
        // Handle "Other" industry case
        let industryValue = values.industry
        if (values.industry === 'Other' && values.otherIndustry) {
          industryValue = values.otherIndustry
        }
        
        const companyDataWithIndustry = {
          ...values,
          industry: industryValue
        }
        
        // Remove the otherIndustry field if it exists
        delete (companyDataWithIndustry as any).otherIndustry
        
        setCompanyData(companyDataWithIndustry as CompanyForm)
        setCurrent(current + 1)
      }).catch(() => {
        // Validation will show error messages
      })
      return
    }
    
    if (current === 2) {
      adminForm.validateFields().then(values => {
        setAdminData(values as AdminForm)
        setCurrent(current + 1)
      }).catch(() => {
        // Validation will show error messages
      })
      return
    }
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const handleSubmit = async () => {
    if (!companyData || !adminData) return
    
    setLoading(true)
    setError(null)
    
    // Log the data being sent
    const requestData = {
      company: {
        company_name: companyData.companyName,
        environment_type: companyData.environmentType,
        industry: companyData.industry
      },
      admin_user: {
        username: adminData.username,
        email: adminData.email,
        password: adminData.password
      }
    }
    
    console.log('Sending onboarding data:', requestData)
    
    // Simulate progress
    let progress = 0
    progressInterval.current = setInterval(() => {
      progress += 5
        if (progressInterval.current) clearInterval(progressInterval.current)
      }, 100)
    
    try {
      // Use the proxy URL for the request
      const response = await axios.post('/api/onboarding/complete', requestData, {
        timeout: 30000, // 30 second timeout for onboarding
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (progressInterval.current) clearInterval(progressInterval.current)
      
      if (response.status === 201) {
        setCompleted(true)
        setRedirecting(true)
        
        // Store authentication information
        if (response.data.token && response.data.company_name && response.data.username) {
          localStorage.setItem('authToken', response.data.token)
          localStorage.setItem('selectedCompany', response.data.company_name)
          localStorage.setItem('user', JSON.stringify({
            username: response.data.username,
            company: response.data.company_name,
            full_name: response.data.username
          }))
        }
        
        // Mark onboarding as complete in localStorage
        localStorage.setItem('onboardingComplete', 'true')
        // Also update the first_install.json file status
        localStorage.setItem('firstInstallComplete', 'true')
        
        // Check if response contains redirect information
        if (response.data.redirect) {
          // Show animation for 3 seconds then redirect
          setTimeout(() => {
            // Redirect to the specified path
            window.location.href = response.data.redirect
          }, 3000)
        } else {
          // Fallback redirect to Dashboard
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 3000)
        }
      }
    } catch (err: any) {
      if (progressInterval.current) clearInterval(progressInterval.current)
      // Log the error response
      console.error('Onboarding error response:', err.response)
      console.error('Onboarding error:', err)
      console.error('Onboarding error request:', err.request)
      
      // Improved error handling to show validation errors
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.')
      } else if (err.response?.status === 400) {
        // Handle bad request errors
        setError(err.response.data.detail || 'Invalid data provided. Please check your inputs.')
      } else if (err.response?.status === 422) {
        // Handle validation errors
        if (err.response.data?.detail) {
          if (Array.isArray(err.response.data.detail)) {
            // Handle validation error array
            const errorMessages = err.response.data.detail.map((error: any) => {
              // Handle different error formats
              if (typeof error === 'string') {
                return error
              } else if (error.msg) {
                return `${error.loc?.join('.') || 'Field'}: ${error.msg}`
              } else {
                return JSON.stringify(error)
              }
            }).join(', ')
            setError(`Validation errors: ${errorMessages}`)
          } else if (typeof err.response.data.detail === 'string') {
            // Handle single error message
            setError(err.response.data.detail)
          } else {
            // Handle object error message
            setError(JSON.stringify(err.response.data.detail))
          }
        } else {
          setError('Validation failed. Please check your inputs.')
        }
      } else if (err.response?.data) {
        // Handle other error formats
        if (typeof err.response.data === 'string') {
          setError(err.response.data)
        } else if (err.response.data.detail) {
          setError(err.response.data.detail)
        } else {
          setError(JSON.stringify(err.response.data))
        }
      } else {
        setError('Failed to complete onboarding. Please check your network connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      title: 'Welcome',
      icon: <RocketOutlined />,
      content: <WelcomeStep onNext={next} />
    },
    {
      title: 'Company',
      icon: <ApartmentOutlined />,
      content: <CompanyStep 
        form={companyForm}
        industries={industries}
        environmentTypes={environmentTypes}
      />
    },
    {
      title: 'Admin',
      icon: <UserOutlined />,
      content: <AdminStep 
        form={adminForm}
        passwordStrength={passwordStrength}
        passwordFeedback={passwordFeedback}
        onPasswordChange={calculatePasswordStrength}
      />
    },
    {
      title: 'Review',
      icon: <CheckCircleOutlined />,
      content: <ConfirmStep 
        companyData={companyData}
        adminData={adminData}
      />
    }
  ]

  // Calculate progress percentage
  const progressPercentage = ((current + 1) / steps.length) * 100

  if (completed) {
    return (
      <div className="onboarding-container">
        <ParallaxBackground />
        <div className="onboarding-content-wrapper">
          <Card className="onboarding-card success-card">
            <SuccessStep 
              windowSize={windowSize}
              redirecting={redirecting}
            />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-container">
      <ParallaxBackground />
      <div className="onboarding-content-wrapper">
        <Card className="onboarding-card">
          {/* Modern Progress Bar */}
          <div className="onboarding-progress-container">
            <div className="onboarding-progress-header">
              <h3 className="progress-title">Setup Progress</h3>
              <span className="progress-step">Step {current + 1} of {steps.length}</span>
            </div>
            
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <div className="step-indicators">
              {steps.map((step, index) => (
                <div className="step-indicator" key={index}>
                  <div className={`step-icon ${
                    index < current ? 'step-icon-completed' : 
                    index === current ? 'step-icon-active' : 'step-icon-default'
                  }`}>
                    {index < current ? (
                      <CheckOutlined />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className={`step-label ${
                    index < current ? 'step-label-completed' : 
                    index === current ? 'step-label-active' : ''
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="step-indicator-line" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="onboarding-content" ref={contentRef}>
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%' } as React.CSSProperties}
              >
                {steps[current].content}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert 
                message="Error" 
                description={error} 
                type="error" 
                showIcon 
                className="onboarding-alert"
              />
            </motion.div>
          )}
          
          <div className="onboarding-navigation">
            {current > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button 
                  onClick={prev} 
                  className="onboarding-secondary-button"
                  disabled={loading}
                >
                  Previous
                </Button>
              </motion.div>
            )}
            
            <div className="navigation-spacer" />
            
            <div className="navigation-buttons">
              {/* Only show Next/Complete button for steps after Welcome */}
              {current > 0 && current < steps.length - 1 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button 
                    type="primary" 
                    onClick={next}
                    className="onboarding-button"
                    disabled={loading}
                  >
                    Next
                  </Button>
                </motion.div>
              ) : current > 0 && current === steps.length - 1 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button 
                    type="primary" 
                    onClick={handleSubmit}
                    className="onboarding-button"
                    loading={loading}
                  >
                    {loading ? 'Setting up...' : 'Complete Setup'}
                  </Button>
                </motion.div>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default OnboardingWizard