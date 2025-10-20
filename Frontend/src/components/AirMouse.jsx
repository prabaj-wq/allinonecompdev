import React, { useState, useEffect, useRef } from 'react'
import { X, Video, VideoOff, Hand, Mouse, Wifi, WifiOff } from 'lucide-react'

const AirMouse = ({ isOpen, onClose }) => {
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cameraInitialized, setCameraInitialized] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const gestureIntervalRef = useRef(null)
  const cursorRef = useRef(null)

  // Check status on component mount
  useEffect(() => {
    if (isOpen) {
      checkStatus()
    }
  }, [isOpen])

  // Initialize video stream when component opens
  useEffect(() => {
    if (isOpen && !streamRef.current) {
      initializeStream()
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.src = ''
        streamRef.current = null
      }
    }
  }, [isOpen])

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/airmouse/status')
      const data = await response.json()
      
      if (!data.opencv_available) {
        setError('OpenCV/MediaPipe not available - missing system dependencies')
        setIsActive(false)
        setCameraInitialized(false)
        return
      }
      
      setIsActive(data.active)
      setCameraInitialized(data.camera_initialized)
      setError(null)
    } catch (err) {
      console.error('Failed to check air mouse status:', err)
      setError('Failed to check status')
    }
  }

  const initializeStream = () => {
    if (videoRef.current) {
      const streamUrl = '/api/airmouse/stream'
      videoRef.current.src = streamUrl
      streamRef.current = videoRef.current
    }
  }

  const startGesturePolling = () => {
    if (gestureIntervalRef.current) return
    
    gestureIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/airmouse/gesture-data')
        const data = await response.json()
        
        if (data.status === 'success' && data.active && data.gesture_data) {
          const { cursor_x, cursor_y, left_click, right_click } = data.gesture_data
          
          // Update cursor position
          updateCursorPosition(cursor_x, cursor_y)
          
          // Handle clicks
          if (left_click) {
            simulateClick('left')
          }
          if (right_click) {
            simulateClick('right')
          }
        } else if (data.status === 'error') {
          // Stop polling if there's an error
          stopGesturePolling()
          setError(data.message)
        }
      } catch (err) {
        console.error('Failed to get gesture data:', err)
      }
    }, 50) // 20 FPS polling
  }

  const stopGesturePolling = () => {
    if (gestureIntervalRef.current) {
      clearInterval(gestureIntervalRef.current)
      gestureIntervalRef.current = null
    }
  }

  const updateCursorPosition = (x, y) => {
    // Convert normalized coordinates to screen coordinates
    const screenX = x * window.screen.width
    const screenY = y * window.screen.height
    
    // Create or update virtual cursor
    if (!cursorRef.current) {
      cursorRef.current = document.createElement('div')
      cursorRef.current.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: rgba(0, 255, 0, 0.8);
        border: 2px solid #00ff00;
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        transition: all 0.1s ease;
      `
      document.body.appendChild(cursorRef.current)
    }
    
    cursorRef.current.style.left = `${screenX}px`
    cursorRef.current.style.top = `${screenY}px`
  }

  const simulateClick = (button) => {
    // Get element at cursor position
    const element = document.elementFromPoint(
      parseFloat(cursorRef.current?.style.left || 0),
      parseFloat(cursorRef.current?.style.top || 0)
    )
    
    if (element) {
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: button === 'left' ? 0 : 2
      })
      element.dispatchEvent(event)
    }
  }

  const toggleAirMouse = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/airmouse/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to toggle air mouse')
      }
      
      const data = await response.json()
      
      if (data.status === 'error') {
        setError(data.message)
        setIsActive(false)
        return
      }
      
      setIsActive(data.active)
      setError(null)
      
      // Initialize stream if not already done
      if (!streamRef.current && data.active) {
        initializeStream()
      }
      
      // Start or stop gesture polling
      if (data.active) {
        startGesturePolling()
      } else {
        stopGesturePolling()
      }
      
      // Check status after toggle
      setTimeout(checkStatus, 500)
      
    } catch (err) {
      console.error('Failed to toggle air mouse:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = async () => {
    // Stop gesture polling
    stopGesturePolling()
    
    // Remove virtual cursor
    if (cursorRef.current) {
      document.body.removeChild(cursorRef.current)
      cursorRef.current = null
    }
    
    // Stop air mouse if active
    if (isActive) {
      try {
        await fetch('/api/airmouse/stop', { method: 'POST' })
      } catch (err) {
        console.error('Failed to stop air mouse:', err)
      }
    }
    
    // Clean up stream
    if (streamRef.current) {
      streamRef.current.src = ''
      streamRef.current = null
    }
    
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <Hand className={`h-5 w-5 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Hands Free Control
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Control your mouse with hand gestures
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isActive 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
              }`}>
                {isActive ? (
                  <>
                    <Wifi className="h-4 w-4" />
                    HANDS FREE: ON
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    HANDS FREE: OFF
                  </>
                )}
              </div>
              {cameraInitialized && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  <Video className="h-4 w-4" />
                  Camera Ready
                </div>
              )}
            </div>
            
            <button
              onClick={toggleAirMouse}
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {isActive ? 'Stopping...' : 'Starting...'}
                </div>
              ) : (
                isActive ? 'Stop' : 'Start'
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Video Stream */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <img
              ref={videoRef}
              alt="Air Mouse Camera Stream"
              className="w-full h-full object-cover"
              onError={() => setError('Failed to load camera stream')}
            />
            
            {!cameraInitialized && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center text-white">
                  <VideoOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Camera Not Initialized</p>
                  <p className="text-sm opacity-75">Click Start to initialize camera</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mouse className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-medium text-blue-900 dark:text-blue-300">Move Mouse</h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Move your hand to control the cursor
              </p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Hand className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="font-medium text-green-900 dark:text-green-300">Left Click</h3>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400">
                Pinch index finger and thumb together
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Hand className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-medium text-purple-900 dark:text-purple-300">Right Click</h3>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Pinch middle finger and thumb together
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AirMouse
