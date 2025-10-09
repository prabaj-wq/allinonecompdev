import React, { useState, useEffect } from 'react'
import { useTwoFactor } from '../contexts/TwoFactorContext'
import { Shield, Smartphone, Key, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const TwoFactorVerification = ({ onVerificationSuccess }) => {
  const { verify2FA, verifyBackupCode, is2FAEnabled } = useTwoFactor()
  const [token, setToken] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [lockoutTime, setLockoutTime] = useState(0)

  useEffect(() => {
    // Check if account is locked
    const lockoutEnd = localStorage.getItem('2fa_lockout_end')
    if (lockoutEnd) {
      const endTime = parseInt(lockoutEnd)
      if (Date.now() < endTime) {
        setLocked(true)
        setLockoutTime(endTime)
      } else {
        localStorage.removeItem('2fa_lockout_end')
      }
    }
  }, [])

  useEffect(() => {
    if (locked) {
      const timer = setInterval(() => {
        const remaining = lockoutTime - Date.now()
        if (remaining <= 0) {
          setLocked(false)
          setAttempts(0)
          localStorage.removeItem('2fa_lockout_end')
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [locked, lockoutTime])

  const handleTokenSubmit = async (e) => {
    e.preventDefault()
    if (locked) return

    setLoading(true)
    setError('')

    try {
      const isValid = await verify2FA(token)
      if (isValid) {
        setSuccess(true)
        setError('')
        setTimeout(() => {
          onVerificationSuccess()
        }, 1000)
      } else {
        setError('Invalid verification code. Please try again.')
        setAttempts(prev => prev + 1)
        checkLockout()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackupCodeSubmit = async (e) => {
    e.preventDefault()
    if (locked) return

    setLoading(true)
    setError('')

    try {
      const isValid = await verifyBackupCode(backupCode)
      if (isValid) {
        setSuccess(true)
        setError('')
        setTimeout(() => {
          onVerificationSuccess()
        }, 1000)
      } else {
        setError('Invalid backup code. Please try again.')
        setAttempts(prev => prev + 1)
        checkLockout()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const checkLockout = () => {
    if (attempts >= 5) {
      const lockoutDuration = 15 * 60 * 1000 // 15 minutes
      const endTime = Date.now() + lockoutDuration
      setLocked(true)
      setLockoutTime(endTime)
      localStorage.setItem('2fa_lockout_end', endTime.toString())
    }
  }

  const formatTimeRemaining = () => {
    const remaining = lockoutTime - Date.now()
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Successful!</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Temporarily Locked</h2>
          <p className="text-gray-600 mb-4">
            Too many failed attempts. Please wait before trying again.
          </p>
          <div className="text-lg font-mono text-red-600">
            {formatTimeRemaining()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
          <p className="text-gray-600">
            {is2FAEnabled 
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Set up two-factor authentication for enhanced security'
            }
          </p>
        </div>

        {!useBackupCode ? (
          <form onSubmit={handleTokenSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || token.length !== 6}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setUseBackupCode(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Use backup code instead
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBackupCodeSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Code
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="Enter backup code"
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter one of your backup codes
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !backupCode}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify Backup Code'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setUseBackupCode(false)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Use authenticator app instead
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  )
}

export default TwoFactorVerification
