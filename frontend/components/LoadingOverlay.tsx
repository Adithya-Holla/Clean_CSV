'use client'

import { useEffect, useState } from 'react'

interface LoadingOverlayProps {
  isVisible: boolean
  message: string
  onCancel?: () => void
}

export default function LoadingOverlay({ isVisible, message, onCancel }: LoadingOverlayProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isVisible) return

    // Simple animated dots without keep-alive for now
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => {
      clearInterval(interval)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Animated spinner */}
          <div className="w-16 h-16 mx-auto mb-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div>

          {/* Message */}
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {message}{dots}
          </h3>

          {/* Status messages */}
          <div className="text-sm text-gray-600 mb-6">
            <p>Large files may take several minutes to process.</p>
            <p>Please keep this tab open and avoid refreshing.</p>
          </div>

          {/* Cancel button if provided */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}

          {/* Keep-alive indicator */}
          <div className="mt-4 text-xs text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Connection active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
