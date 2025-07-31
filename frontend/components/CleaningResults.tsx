'use client'

import { API_ENDPOINTS } from '../utils/api'

import { useState } from 'react'

interface CleaningResult {
  success: boolean
  original_shape: [number, number]
  cleaned_shape: [number, number]
  rows_removed: number
  download_id: string
  keymap_download_id: string | null
  preview: any[]
  encoding_keymap: Record<string, Record<number, string>>
}

interface CleaningResultsProps {
  result: CleaningResult
  onStartOver: () => void
}

export default function CleaningResults({ result, onStartOver }: CleaningResultsProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingKeymap, setIsDownloadingKeymap] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(API_ENDPOINTS.download(result.download_id))
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'cleaned_data.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Download failed. Please try again.')
      }
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadKeymap = async () => {
    if (!result.keymap_download_id) return
    
    setIsDownloadingKeymap(true)
    try {
      const response = await fetch(API_ENDPOINTS.downloadKeymap(result.keymap_download_id))
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'encoding_keymap.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Keymap download failed. Please try again.')
      }
    } catch (error) {
      console.error('Keymap download failed:', error)
      alert('Keymap download failed. Please try again.')
    } finally {
      setIsDownloadingKeymap(false)
    }
  }

  if (!result.success) {
    return (
      <div className="text-center space-y-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-red-900 mb-4">Processing Failed</h2>
          <p className="text-red-700 mb-6 max-w-md mx-auto">
            We encountered an issue while cleaning your data. This might be due to file format issues or data incompatibility.
          </p>
          <button
            onClick={onStartOver}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const retentionPercentage = (result.cleaned_shape[0] / result.original_shape[0]) * 100

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">🎉 Success!</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your data has been professionally cleaned and is ready for analysis or machine learning.
        </p>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Original</h4>
          <p className="text-2xl font-bold text-blue-600 mb-1">
            {result.original_shape[0].toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">rows × {result.original_shape[1]} cols</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Cleaned</h4>
          <p className="text-2xl font-bold text-green-600 mb-1">
            {result.cleaned_shape[0].toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">rows × {result.cleaned_shape[1]} cols</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Processed</h4>
          <p className="text-2xl font-bold text-purple-600 mb-1">
            {result.rows_removed}
          </p>
          <p className="text-sm text-gray-600">
            {result.rows_removed > 0 ? 'rows removed' : 'rows modified'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              retentionPercentage >= 95 ? 'bg-green-500' : 
              retentionPercentage >= 90 ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Retention</h4>
          <p className="text-2xl font-bold text-orange-600 mb-1">
            {retentionPercentage.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">data preserved</p>
        </div>
      </div>

      {/* Data Retention Visualization */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-4">Data Processing Summary</h4>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Data Retention Rate</span>
              <span>{retentionPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ${
                  retentionPercentage >= 95 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                  retentionPercentage >= 90 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                  'bg-gradient-to-r from-red-500 to-pink-500'
                }`}
                style={{ width: `${retentionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h5 className="font-medium text-green-900 mb-2">✅ What was improved:</h5>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Missing values handled</li>
                <li>• Outliers processed</li>
                <li>• Data types optimized</li>
                <li>• Categorical encoding applied</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">📊 Ready for:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Machine Learning models</li>
                <li>• Statistical analysis</li>
                <li>• Data visualization</li>
                <li>• Business intelligence</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Data Preview */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h4 className="text-xl font-semibold text-gray-900">Cleaned Data Preview</h4>
          <p className="text-sm text-gray-600 mt-1">First 5 rows of your processed dataset</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                {result.preview.length > 0 && Object.keys(result.preview[0]).map((col) => (
                  <th key={col} className="px-6 py-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {result.preview.slice(0, 5).map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {Object.entries(row).map(([col, value]) => (
                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof value === 'number' ? (
                        <span className="font-mono">{value.toFixed(3)}</span>
                      ) : (
                        String(value)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Encoding Keymap */}
      {result.encoding_keymap && Object.keys(result.encoding_keymap).length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Categorical Encoding Reference</h4>
                <p className="text-sm text-gray-600 mt-1">Understand what each encoded number represents</p>
              </div>
              {result.keymap_download_id && (
                <button
                  onClick={handleDownloadKeymap}
                  disabled={isDownloadingKeymap}
                  className="px-4 py-2 border border-purple-300 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 flex items-center transition-all duration-200"
                >
                  {isDownloadingKeymap ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700 mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(result.encoding_keymap).map(([column, mapping]) => (
                <div key={column} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h5 className="font-semibold text-gray-900 truncate">{column}</h5>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Object.entries(mapping).map(([code, value]) => (
                      <div key={code} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-mono">
                          {code}
                        </span>
                        <span className="text-sm text-gray-700 truncate ml-3 flex-1" title={value}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Action Buttons */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <button
            onClick={onStartOver}
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clean Another File
          </button>
          
          <div className="flex space-x-4">
            {result.keymap_download_id && (
              <button
                onClick={handleDownloadKeymap}
                disabled={isDownloadingKeymap}
                className="inline-flex items-center px-6 py-3 border border-blue-300 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              >
                {isDownloadingKeymap ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-2"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Keymap
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <div className="text-left">
                    <div className="font-semibold">Downloading...</div>
                    <div className="text-sm opacity-90">Preparing your file</div>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold">Download Cleaned Data</div>
                    <div className="text-sm opacity-90">Get your processed CSV</div>
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
