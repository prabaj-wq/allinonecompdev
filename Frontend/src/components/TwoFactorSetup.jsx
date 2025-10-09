import React, { useState, useEffect } from 'react'
import { useTwoFactor } from '../contexts/TwoFactorContext'
import { Shield, Smartphone, Key, Download, CheckCircle, AlertTriangle, Copy, Eye, EyeOff } from 'lucide-react'

// QR Code generation using multiple methods
const generateQRCode = async (data) => {
  try {
    // Method 1: Try using qrcode library if available
    if (typeof window !== 'undefined' && window.QRCode) {
      return await window.QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      })
    }
    
    // Method 2: Try dynamic import
    try {
      const qrcodeModule = await import('qrcode')
      const QRCode = qrcodeModule.default || qrcodeModule
      return await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      })
    } catch (importError) {
      console.warn('Dynamic import failed:', importError)
    }
    
    // Method 3: Use external QR code service as fallback
    const encodedData = encodeURIComponent(data)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`
    
  } catch (error) {
    console.error('All QR code generation methods failed:', error)
    throw error
  }
}

const TwoFactorSetup = ({ onSetupComplete }) => {
  const { setup2FA, enable2FA, is2FAEnabled } = useTwoFactor()
  const [step, setStep] = useState(1)
  const [qrCode, setQrCode] = useState('')
  const [qrCodeImage, setQrCodeImage] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [qrLibraryLoaded, setQrLibraryLoaded] = useState(false)

  useEffect(() => {
    if (step === 1) {
      initializeSetup()
    }
  }, [step])

  const initializeSetup = async () => {
    try {
      setLoading(true)
      const setupData = await setup2FA()
      setQrCode(setupData.qrCode)
      setSecret(setupData.secret)
      setBackupCodes(setupData.backupCodes)
      
      // Generate actual QR code image
      try {
        console.log('🔍 Generating QR code for:', setupData.qrCode)
        const qrImageDataUrl = await generateQRCode(setupData.qrCode)
        console.log('✅ QR code generated successfully:', qrImageDataUrl.substring(0, 50) + '...')
        setQrCodeImage(qrImageDataUrl)
        setQrLibraryLoaded(true)
      } catch (qrError) {
        console.error('❌ Failed to generate QR code image:', qrError)
        setError('Failed to generate QR code. Please use manual entry instead.')
        setQrLibraryLoaded(false)
      }
    } catch (error) {
      setError('Failed to initialize 2FA setup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEnable2FA = async (e) => {
    e.preventDefault()
    if (!token || token.length !== 6) return

    setLoading(true)
    setError('')

    try {
      const success = await enable2FA(token)
      if (success) {
        setStep(4) // Success step
        setTimeout(() => {
          onSetupComplete()
        }, 3000)
      } else {
        setError('Invalid verification code. Please try again.')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const downloadBackupCodes = () => {
    const content = `Consolidation Tool - Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes safe and secure. Each code can only be used once.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading && step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up 2FA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Two-Factor Authentication</h2>
          <p className="text-gray-600">Follow these steps to secure your account</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNumber 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step > stepNumber ? <CheckCircle className="w-5 h-5" /> : stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`w-16 h-1 mx-2 ${
                  step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: QR Code */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Scan QR Code</h3>
              <p className="text-gray-600 mb-6">
                Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code
              </p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 border-2 border-gray-200 rounded-lg">
                                 {qrCodeImage ? (
                   <img 
                     src={qrCodeImage} 
                     alt="QR Code for 2FA setup" 
                     className="w-48 h-48"
                   />
                 ) : (
                   <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-500">
                     <div className="text-center">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                       <p className="text-sm">Generating QR Code...</p>
                       <p className="text-xs text-gray-400">Please wait</p>
                     </div>
                   </div>
                 )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Manual Entry {!qrCodeImage && '(QR code generation failed - use this instead)'}
              </h4>
              <div className="flex items-center space-x-2">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={secret}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(secret)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {!qrCodeImage && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ QR code generation failed. Please use the manual entry above or refresh the page to try again.
                </p>
              )}
            </div>

            <div className="text-center space-y-3">
              {!qrCodeImage && (
                <button
                  onClick={initializeSetup}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2"
                >
                  Retry QR Code Generation
                </button>
              )}
              <button
                onClick={() => setStep(2)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Backup Codes
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Backup Codes */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Save Backup Codes</h3>
              <p className="text-gray-600 mb-6">
                Save these backup codes in a secure location. You can use them if you lose access to your authenticator app.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Each backup code can only be used once</li>
                    <li>Store them securely (password manager, safe, etc.)</li>
                    <li>Don't share them with anyone</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Your Backup Codes</h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showBackupCodes ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={downloadBackupCodes}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
              
              {showBackupCodes && (
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white px-3 py-2 border border-gray-200 rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Verify Setup
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Verify Setup</h3>
              <p className="text-gray-600 mb-6">
                Enter the 6-digit code from your authenticator app to complete the setup
              </p>
            </div>

            <form onSubmit={handleEnable2FA} className="space-y-6">
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

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  disabled={loading || token.length !== 6}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Verifying...' : 'Complete Setup'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">Setup Complete!</h3>
            <p className="text-gray-600">
              Two-factor authentication has been successfully enabled for your account.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Next time you log in:</strong> You'll be asked to enter a verification code from your authenticator app.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TwoFactorSetup
