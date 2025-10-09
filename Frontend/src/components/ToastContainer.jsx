import React, { useState, useCallback } from 'react'
import Toast from './Toast'

const ToastContainer = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random() // Ensure unique IDs even for rapid toasts
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Expose addToast method globally
  React.useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      window.showToast = addToast
      console.log('🍞 Toast system initialized, window.showToast is now available')
    }, 100)
    
    return () => {
      clearTimeout(timer)
      delete window.showToast
      console.log('🍞 Toast system cleaned up')
    }
  }, [addToast])

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

export default ToastContainer
