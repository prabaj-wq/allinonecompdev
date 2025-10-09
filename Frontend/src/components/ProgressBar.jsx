import React, { useState, useEffect } from 'react';

const ProgressBar = ({ 
  isVisible, 
  progress = 0, 
  message = 'Processing...', 
  type = 'default',
  autoHide = true,
  autoHideDelay = 3000 
}) => {
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    if (isVisible && autoHide && progress >= 100) {
      const timer = setTimeout(() => {
        setShouldHide(true);
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, progress, autoHide, autoHideDelay]);

  useEffect(() => {
    if (isVisible) {
      setShouldHide(false);
    }
  }, [isVisible]);

  if (!isVisible || shouldHide) return null;

  const getBarColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-purple-500';
    }
  };

  const getMessageColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-purple-700';
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-200">
        <div 
          className={`h-full transition-all duration-300 ease-out ${getBarColor()}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      
      {/* Message bar */}
      <div className={`bg-white border-b border-gray-200 shadow-sm px-4 py-2 ${getMessageColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Spinner for ongoing operations */}
            {progress < 100 && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            )}
            {/* Checkmark for completed operations */}
            {progress >= 100 && (
              <div className="text-green-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <span className="text-sm font-medium">{message}</span>
          </div>
          
          {/* Progress percentage */}
          <span className="text-xs font-mono">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
