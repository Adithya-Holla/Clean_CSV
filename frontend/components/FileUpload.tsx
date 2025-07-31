'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { API_ENDPOINTS } from '../utils/api'

interface FileUploadProps {
  onUpload: (data: any) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export default function FileUpload({ onUpload, isLoading, setIsLoading }: FileUploadProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // File size validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    // Show file size warning for large files
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 5) {
      const proceed = confirm(`Large file detected (${fileSizeMB.toFixed(1)}MB). Processing may take several minutes. Continue?`);
      if (!proceed) return;
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(API_ENDPOINTS.upload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minute timeout for large files
      })

      onUpload(response.data)
    } catch (error: any) {
      console.error('Upload failed:', error)
      let errorMessage = 'Upload failed. Please try again.'
      
      if (error?.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout - file too large or connection too slow'
      } else if (error?.response?.status === 0 || error?.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running.'
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }
      
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [onUpload, setIsLoading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: isLoading
  })

  // Don't render dropzone until client-side hydration is complete
  if (!isMounted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border-2 border-dashed rounded-lg p-12 text-center border-gray-300">
          <DocumentArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Loading file upload...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Upload Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your CSV File</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get started by uploading your messy CSV file. Our AI-powered cleaning engine will analyze your data and prepare it for processing.
        </p>
      </div>

      {/* Enhanced Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 transform ${
          isDragActive
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 scale-105 shadow-xl shadow-blue-500/25'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 hover:shadow-lg'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-pink-400/10 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10">
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full border-t-purple-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-800 mb-2">Analyzing Your Data</p>
                <p className="text-gray-600">Processing file structure and data types...</p>
                <div className="mt-4 max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          ) : isDragActive ? (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 mb-2">Perfect! Drop it here</p>
                <p className="text-gray-600">Release to start the magic ✨</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 mb-3">
                  Drag & Drop Your CSV File
                </p>
                <p className="text-gray-600 mb-6">or click to browse your computer</p>
                <button
                  type="button"
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Choose File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Info Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Secure Upload</h3>
          <p className="text-sm text-gray-600">Your data is processed locally and never stored permanently</p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Lightning Fast</h3>
          <p className="text-sm text-gray-600">Advanced algorithms clean your data in seconds</p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Smart Cleaning</h3>
          <p className="text-sm text-gray-600">Handles outliers, missing values, and encoding automatically</p>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Supported format: CSV files only • Maximum file size: 10MB
        </p>
      </div>
    </div>
  )
}
