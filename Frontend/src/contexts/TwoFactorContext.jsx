import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { generateSecret, generateQRCodeData, generateBackupCodes, verifyTOTP } from '../utils/qrCodeGenerator'

const TwoFactorContext = createContext()

export const useTwoFactor = () => {
  const context = useContext(TwoFactorContext)
  if (!context) {
    throw new Error('useTwoFactor must be used within a TwoFactorProvider')
  }
  return context
}

export const TwoFactorProvider = ({ children }) => {
  const { user } = useAuth()
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [is2FAVerified, setIs2FAVerified] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState([])

  useEffect(() => {
    if (user) {
      // Check if user has 2FA enabled
      check2FAStatus()
    }
  }, [user])

  const check2FAStatus = async () => {
    try {
      // Check if user has 2FA enabled from login
      const globalRequires2FA = localStorage.getItem('requires2FA')
      
      if (globalRequires2FA === 'true') {
        // User has 2FA enabled, check for verification
        const userId = user?.email || user?.id || user?.username
        if (userId) {
          const stored2FA = localStorage.getItem(`2fa_${userId}`)
          if (stored2FA) {
            const twoFAData = JSON.parse(stored2FA)
            setIs2FAEnabled(twoFAData.enabled)
            setIs2FAVerified(twoFAData.verified)
            // Only require 2FA if enabled but not verified
            setRequires2FA(twoFAData.enabled && !twoFAData.verified)
          } else {
            // User should have 2FA but no data found - this shouldn't happen
            setRequires2FA(false)
          }
        }
      } else {
        // User doesn't have 2FA enabled - no verification required
        setRequires2FA(false)
        setIs2FAEnabled(false)
        setIs2FAVerified(false)
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error)
      // On error, don't require 2FA
      setRequires2FA(false)
    }
  }

  const setup2FA = async () => {
    try {
      // Generate a new secret for TOTP
      const newSecret = generateSecret()
      setSecret(newSecret)
      
      // Generate QR code
      const qrCodeData = generateQRCodeData(newSecret, user?.email || 'user')
      setQrCode(qrCodeData)
      
      // Generate backup codes
      const codes = generateBackupCodes()
      setBackupCodes(codes)
      
      console.log('🔧 2FA Setup Data:', {
        secret: newSecret,
        qrCode: qrCodeData,
        backupCodes: codes,
        userEmail: user?.email || 'user'
      })
      
      return { secret: newSecret, qrCode: qrCodeData, backupCodes: codes }
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      throw error
    }
  }

  const enable2FA = async (token) => {
    try {
      // Verify the token
      const isValid = verifyToken(token, secret)
      if (isValid) {
        setIs2FAEnabled(true)
        setIs2FAVerified(true)
        setRequires2FA(false)
        
        // Store in localStorage
        const twoFAData = {
          enabled: true,
          verified: true,
          secret: secret,
          backupCodes: backupCodes
        }
        const userId = user?.email || user?.id || user?.username
        localStorage.setItem(`2fa_${userId}`, JSON.stringify(twoFAData))
        
        // Set global flag
        localStorage.setItem('requires2FA', 'true')
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      return false
    }
  }

  const verify2FA = async (token) => {
    try {
      const isValid = verifyToken(token, secret)
      if (isValid) {
        setIs2FAVerified(true)
        setRequires2FA(false)
        
        // Update localStorage
        const userId = user?.email || user?.id || user?.username
        const stored2FA = localStorage.getItem(`2fa_${userId}`)
        if (stored2FA) {
          const twoFAData = JSON.parse(stored2FA)
          twoFAData.verified = true
          localStorage.setItem(`2fa_${userId}`, JSON.stringify(twoFAData))
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error verifying 2FA:', error)
      return false
    }
  }

  const disable2FA = async () => {
    try {
      setIs2FAEnabled(false)
      setIs2FAVerified(false)
      setRequires2FA(false)
      setSecret('')
      setQrCode('')
      setBackupCodes([])
      
      // Remove from localStorage
      const userId = user?.email || user?.id || user?.username
      localStorage.removeItem(`2fa_${userId}`)
      // Remove global flag
      localStorage.removeItem('requires2FA')
      
      return true
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      return false
    }
  }

  const verifyBackupCode = async (code) => {
    try {
      const userId = user?.email || user?.id || user?.username
      const stored2FA = localStorage.getItem(`2fa_${userId}`)
      if (stored2FA) {
        const twoFAData = JSON.parse(stored2FA)
        const isValid = twoFAData.backupCodes.includes(code)
        
        if (isValid) {
          // Remove used backup code
          const updatedCodes = twoFAData.backupCodes.filter(c => c !== code)
          twoFAData.backupCodes = updatedCodes
          localStorage.setItem(`2fa_${userId}`, JSON.stringify(twoFAData))
          
          setIs2FAVerified(true)
          setRequires2FA(false)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error verifying backup code:', error)
      return false
    }
  }



  const verifyToken = (token, secret) => {
    // Use the utility function for TOTP verification
    return verifyTOTP(token, secret)
  }

  const value = {
    is2FAEnabled,
    is2FAVerified,
    requires2FA,
    qrCode,
    secret,
    backupCodes,
    setup2FA,
    enable2FA,
    verify2FA,
    disable2FA,
    verifyBackupCode,
    check2FAStatus
  }

  return (
    <TwoFactorContext.Provider value={value}>
      {children}
    </TwoFactorContext.Provider>
  )
}
