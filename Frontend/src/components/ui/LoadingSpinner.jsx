import React from 'react'
import { Loader2 } from 'lucide-react'

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-lg">Loading IFRS Consolidation Tool...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
