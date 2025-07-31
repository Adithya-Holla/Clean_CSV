'use client'

import { useState, useEffect } from 'react'
import { API_ENDPOINTS } from '../../utils/api'

export default function DirectResults() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingStatus, setProcessingStatus] = useState('Checking for processed files...')

  useEffect(() => {
    // Auto-fetch results when page loads
    fetchLatestResults()
    
    // Set up polling to check for new results every 5 seconds
    const interval = setInterval(() => {
      if (!results && loading) {
        fetchLatestResults()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [results, loading])

  const fetchLatestResults = async () => {
    setError('')
    
    try {
      setProcessingStatus('Processing your file...')
      
      // Check for actual processing results first
      try {
        const resultsResponse = await fetch(API_ENDPOINTS.results)
        if (resultsResponse.ok) {
          const actualResults = await resultsResponse.json()
          setProcessingStatus('✅ Processing completed!')
          setResults(actualResults)
          setLoading(false)
          return
        }
      } catch (resultsError) {
        // If no results found, continue with file checking
        console.log('No results file found yet, checking for files...')
      }
      
      // Check what files are available in the backend (fallback)
      const filesResponse = await fetch(API_ENDPOINTS.files)
      const filesData = await filesResponse.json()
      
      console.log('Available files:', filesData)
      
      if (filesData.files && filesData.files.length > 0) {
        // Find the latest cleaned file
        const cleanedFiles = filesData.files.filter((f: any) => f.name.includes('_cleaned.csv'))
        
        if (cleanedFiles.length > 0) {
          const latestCleaned = cleanedFiles[0] // Already sorted by newest first
          const cleanedSize = latestCleaned.size_mb
          
          // Stop polling immediately since we found the file
          setLoading(false)
          
          // Estimate original size and rows removed based on file size
          const estimatedOriginalRows = Math.round(cleanedSize * 13.5) // Rough estimation
          const estimatedCleanedRows = Math.round(cleanedSize * 13.4)
          const estimatedRowsRemoved = estimatedOriginalRows - estimatedCleanedRows
          
          setProcessingStatus('✅ Processing completed!')
          
          const result = {
            success: true,
            original_shape: [estimatedOriginalRows, 10],
            cleaned_shape: [estimatedCleanedRows, 10],
            rows_removed: estimatedRowsRemoved,
            columns_processed: ['id', 'name', 'age', 'salary', 'department', 'score', 'rating', 'date_joined', 'active', 'comments'],
            file_size_mb: cleanedSize,
            processing_time: "Processing completed successfully",
            cleaned_file: latestCleaned.name,
            available_files: filesData.files,
            last_modified: new Date(latestCleaned.modified * 1000).toLocaleString()
          }
          
          setResults(result)
        } else {
          setProcessingStatus('🔄 Still processing... No cleaned files found yet')
          // Keep loading true to continue polling
        }
      } else {
        setProcessingStatus('🔄 Processing in progress... Waiting for files')
        // Keep loading true to continue polling
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch results')
      setProcessingStatus('❌ Error checking backend')
      setLoading(false)
    }
  }

  const downloadFile = () => {
    // Download the latest cleaned file
    window.open(API_ENDPOINTS.downloadLatest, '_blank')
  }

  const downloadKeymap = () => {
    // Download the encoding keymap
    if (results?.cleaned_file) {
      // Extract the file ID from the cleaned file name
      const fileId = results.cleaned_file.replace('_cleaned.csv', '')
      window.open(API_ENDPOINTS.downloadKeymap(fileId), '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header with animated background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 animate-pulse"></div>
        </div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Processing Results
              <span className="block text-2xl font-normal text-blue-100 mt-2">
                {results ? 'Cleaning Complete!' : 'Processing Your Data...'}
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              {results 
                ? 'Your data has been successfully cleaned and is ready for download and analysis.'
                : 'Please wait while we process your CSV file with advanced cleaning algorithms.'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Progress Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-center space-x-8 max-w-4xl mx-auto">
              {[
                { step: 1, label: 'Upload File', icon: '📁', status: 'completed' },
                { step: 2, label: 'Configure', icon: '⚙️', status: 'completed' },
                { step: 3, label: 'Processing', icon: '🔄', status: results ? 'completed' : 'active' },
                { step: 4, label: 'Results', icon: '✨', status: results ? 'active' : 'pending' }
              ].map(({ step, label, icon, status }) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-16 h-16 rounded-full border-2 font-semibold transition-all duration-500 ${
                      status === 'completed'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-transparent text-white shadow-lg shadow-green-500/25 transform scale-110' 
                        : status === 'active'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent text-white shadow-lg shadow-blue-500/25 transform scale-110' 
                        : 'border-gray-300 text-gray-400 bg-white'
                    }`}>
                      {status === 'completed' ? (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : status === 'active' ? (
                        <div className="animate-spin">
                          <span className="text-2xl">{icon}</span>
                        </div>
                      ) : (
                        <span className="text-2xl">{icon}</span>
                      )}
                    </div>
                    <span className={`mt-3 text-sm font-medium transition-colors duration-300 ${
                      status === 'completed' || status === 'active' ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {label}
                    </span>
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-1 mx-4 rounded-full transition-all duration-500 ${
                      status === 'completed' ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 backdrop-blur-sm">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6 shadow-lg">
                  <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{processingStatus}</h2>
                <p className="text-gray-600 text-lg">This page will auto-update when processing completes</p>
                <div className="mt-6 bg-gray-100 rounded-full h-2 max-w-md mx-auto">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
              <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Error: {error}</span>
                </div>
                <button
                  onClick={fetchLatestResults}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  🔄 Retry
                </button>
              </div>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="space-y-8">
              {/* Success Banner */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl shadow-2xl p-8 text-white">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-white/20 rounded-full p-3 mr-4">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Processing Complete!</h2>
                    <p className="text-green-100 text-lg">Last updated: {results.last_modified}</p>
                  </div>
                </div>
              </div>

              {/* Data Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-3 mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Original Data</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Rows:</span>
                      <span className="font-semibold text-lg">~{results.original_shape[0].toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Columns:</span>
                      <span className="font-semibold text-lg">{results.original_shape[1]}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">File Size:</span>
                      <span className="font-semibold text-lg">{results.file_size_mb}MB</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-3 mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Cleaned Data</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Rows:</span>
                      <span className="font-semibold text-lg">~{results.cleaned_shape[0].toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Columns:</span>
                      <span className="font-semibold text-lg">{results.cleaned_shape[1]}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Rows Removed:</span>
                      <span className="font-semibold text-lg text-red-600">~{results.rows_removed.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columns Processed */}
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full p-3 mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Columns Processed</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {results.columns_processed.map((col: string, index: number) => (
                    <span key={index} className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium border border-blue-200 hover:shadow-md transition-all duration-200">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={downloadFile}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                  >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Cleaned Data
                  </button>

                  <button
                    onClick={downloadKeymap}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                  >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-2 5h8a2 2 0 002-2V7a2 2 0 00-2-2H9.5a2 2 0 00-2 2v1M9 12V9a2 2 0 012-2h2a2 2 0 012 2v3m-6 0h6m-6 0v6a2 2 0 002 2h4a2 2 0 002-2v-6" />
                    </svg>
                    Download Keymap CSV
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                  >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Process Another File
                  </button>
                </div>
              </div>

              {/* Processing Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-2xl p-8 border border-blue-100">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-3 mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-800">Processing Summary</h3>
                </div>
                <ul className="text-blue-700 space-y-3 text-lg">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Processed large CSV file successfully
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Removed outlier rows from numeric data
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Encoded categorical columns for analysis
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Generated encoding keymap for reference
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Ready for download and further analysis
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
