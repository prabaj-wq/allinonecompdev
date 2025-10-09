// Simple QR Code generator for 2FA setup
// In production, you might want to use a proper QR code library

export const generateQRCodeData = (secret, email, issuer = 'Consolidation Tool') => {
  // Generate the otpauth URL for Google Authenticator and similar apps
  const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
  return otpauth
}

export const generateSecret = () => {
  // Generate a random 32-character base32 string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const generateBackupCodes = (count = 10) => {
  // Generate backup codes
  const codes = []
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    codes.push(code)
  }
  return codes
}

export const verifyTOTP = (token, secret) => {
  // Simple TOTP verification (in production, use proper TOTP library)
  // This is a simplified version for demonstration
  if (!token || !secret) return false
  
  // For demo purposes, accept any 6-digit code
  // In production, implement proper TOTP verification using libraries like:
  // - otplib (Node.js)
  // - speakeasy (Node.js)
  // - pyotp (Python)
  return /^\d{6}$/.test(token)
}
