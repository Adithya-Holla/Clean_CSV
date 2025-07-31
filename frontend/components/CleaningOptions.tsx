'use client'

import { useState } from 'react'
import { API_ENDPOINTS } from '../utils/api'
import axios from 'axios'

interface CleaningConfig {
  outlier_strategy: 'cap' | 'remove'
  z_score_threshold: number
  iqr_multiplier: number
  standardize: boolean
}

interface CleaningOptionsProps {
  config: CleaningConfig
  setConfig: (config: CleaningConfig) => void
  fileData: any
  onComplete: (result: any) => void
  onBack: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  onCleaningStart?: () => void
}

export default function CleaningOptions({ 
  config, 
  setConfig, 
  fileData, 
  onComplete, 
  onBack, 
  isLoading, 
  setIsLoading,
  onCleaningStart
}: CleaningOptionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleConfigChange = (key: keyof CleaningConfig, value: any) => {
    setConfig({ ...config, [key]: value })
  }

  const handleClean = async () => {
    // Check if it's a large file and warn user
    const fileSizeMB = fileData.file_size_mb || 0;
    if (fileSizeMB > 10) {
      const proceed = confirm(`Processing large file (${fileSizeMB.toFixed(1)}MB). This will redirect you to results page where you can monitor progress. Continue?`);
      if (!proceed) return;
    }

    // Call the start callback to show loading overlay briefly
    onCleaningStart?.();
    
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('file_id', fileData.file_id)
      formData.append('outlier_strategy', config.outlier_strategy)
      formData.append('z_score_threshold', config.z_score_threshold.toString())
      formData.append('iqr_multiplier', config.iqr_multiplier.toString())
      formData.append('standardize', config.standardize.toString())

      // Start the cleaning process but don't wait for it
      fetch(API_ENDPOINTS.clean, {
        method: 'POST',
        body: formData
      }).then(response => {
        console.log('Cleaning process started, response status:', response.status);
      }).catch(error => {
        console.log('Cleaning process initiated, may be running in background:', error);
      });

      // Immediately redirect to results page after starting the process
      setTimeout(() => {
        window.location.href = '/results';
      }, 1000); // Small delay to show the loading state briefly

    } catch (error: any) {
      console.error('Failed to start cleaning:', error)
      alert('Failed to start cleaning process. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Configure Data Cleaning</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Customize the cleaning process to match your data needs. Our algorithms will handle outliers, missing values, and prepare your data for analysis.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Configuration Sections */}
        <div className="p-8 space-y-8">
          
          {/* Output Format Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Output Format</h3>
                <p className="text-gray-600">Choose how you want your cleaned data formatted</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                config.standardize 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}>
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="standardize"
                    checked={config.standardize}
                    onChange={() => handleConfigChange('standardize', true)}
                    className="mt-1 focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold text-gray-900">Standardized</span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        ML Ready
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Perfect for machine learning algorithms. Values centered around 0 with standard deviation of 1.
                    </p>
                  </div>
                </div>
              </label>

              <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                !config.standardize 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}>
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="standardize"
                    checked={!config.standardize}
                    onChange={() => handleConfigChange('standardize', false)}
                    className="mt-1 focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold text-gray-900">Original Scale</span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Business Friendly
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ideal for reports and analysis. Maintains original units and interpretability.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Outlier Handling Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Outlier Strategy</h3>
                <p className="text-gray-600">How should we handle extreme values in your data?</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                config.outlier_strategy === 'cap' 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
              }`}>
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="outlier_strategy"
                    value="cap"
                    checked={config.outlier_strategy === 'cap'}
                    onChange={(e) => handleConfigChange('outlier_strategy', e.target.value)}
                    className="mt-1 focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold text-gray-900">Cap Outliers</span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Limit extreme values to reasonable bounds. Preserves all data points while reducing noise.
                    </p>
                  </div>
                </div>
              </label>

              <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                config.outlier_strategy === 'remove' 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
              }`}>
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="outlier_strategy"
                    value="remove"
                    checked={config.outlier_strategy === 'remove'}
                    onChange={(e) => handleConfigChange('outlier_strategy', e.target.value)}
                    className="mt-1 focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold text-gray-900">Remove Outliers</span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Data Loss
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Delete rows containing outliers. Results in cleaner data but smaller dataset.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left group"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Advanced Parameters</h3>
                  <p className="text-gray-600">Fine-tune the sensitivity of outlier detection</p>
                </div>
              </div>
              <svg
                className={`w-6 h-6 text-purple-500 transform transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-purple-200">
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Z-Score Threshold
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={config.z_score_threshold}
                    onChange={(e) => handleConfigChange('z_score_threshold', parseFloat(e.target.value))}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  />
                  <div className="mt-2 flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((config.z_score_threshold - 1) / 4) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm text-gray-600">
                      {config.z_score_threshold < 2 ? 'Very Sensitive' : 
                       config.z_score_threshold < 3 ? 'Sensitive' : 
                       config.z_score_threshold < 4 ? 'Balanced' : 'Conservative'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Lower values detect more outliers (default: 3.0)
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    IQR Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3"
                    value={config.iqr_multiplier}
                    onChange={(e) => handleConfigChange('iqr_multiplier', parseFloat(e.target.value))}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  />
                  <div className="mt-2 flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((config.iqr_multiplier - 0.5) / 2.5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm text-gray-600">
                      {config.iqr_multiplier < 1 ? 'Very Sensitive' : 
                       config.iqr_multiplier < 1.5 ? 'Sensitive' : 
                       config.iqr_multiplier < 2 ? 'Balanced' : 'Conservative'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Controls quartile-based outlier detection (default: 1.5)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Navigation */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Preview
            </button>
            
            <button
              onClick={handleClean}
              disabled={isLoading}
              className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <div className="text-left">
                    <div className="font-semibold">Processing Data...</div>
                    <div className="text-sm opacity-90">This may take a moment</div>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold">Start Cleaning</div>
                    <div className="text-sm opacity-90">Process your data</div>
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
