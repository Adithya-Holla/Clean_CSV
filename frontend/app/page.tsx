'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import DataPreview from '@/components/DataPreview'
import CleaningOptions from '@/components/CleaningOptions'
import CleaningResults from '@/components/CleaningResults'
import LoadingOverlay from '@/components/LoadingOverlay'

interface FileData {
  file_id: string
  filename: string
  shape: [number, number]
  columns: string[]
  preview: any[]
  dtypes: Record<string, string>
  missing_values: Record<string, number>
  file_size_mb?: number
  is_sample?: boolean
  sample_size?: number
}

interface CleaningConfig {
  outlier_strategy: 'cap' | 'remove'
  z_score_threshold: number
  iqr_multiplier: number
  standardize: boolean
}

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

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [cleaningConfig, setCleaningConfig] = useState<CleaningConfig>({
    outlier_strategy: 'cap',
    z_score_threshold: 3.0,
    iqr_multiplier: 1.5,
    standardize: true
  })
  const [cleaningResult, setCleaningResult] = useState<CleaningResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [processingProgress, setProcessingProgress] = useState(0)

  const handleFileUpload = (data: FileData) => {
    setFileData(data)
    setCurrentStep(2)
  }

  const handleCleaningComplete = (result: CleaningResult) => {
    setCleaningResult(result)
    setCurrentStep(4)
    setIsLoading(false)
    setLoadingMessage('')
    setProcessingProgress(0)
  }

  const handleCleaningStart = () => {
    const fileSizeMB = fileData?.file_size_mb || 0
    setIsLoading(true)
    
    if (fileSizeMB > 10) {
      setLoadingMessage('Processing large file - this may take several minutes')
    } else {
      setLoadingMessage('Processing file')
    }
    // Remove the progress simulation that was causing issues
    setProcessingProgress(0)
  }

  const resetProcess = () => {
    setCurrentStep(1)
    setFileData(null)
    setCleaningResult(null)
    setIsLoading(false)
    setLoadingMessage('')
    setProcessingProgress(0)
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              CSV Data Cleaner
              <span className="block text-2xl font-normal text-blue-100 mt-2">
                Professional Data Processing
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Transform messy data into clean, analyzable datasets with our advanced cleaning algorithms. 
              Handle outliers, missing values, and categorical encoding with enterprise-grade precision.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Enhanced Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8 max-w-4xl mx-auto">
            {[
              { step: 1, label: 'Upload File', icon: '📁' },
              { step: 2, label: 'Preview Data', icon: '👁' },
              { step: 3, label: 'Configure', icon: '⚙️' },
              { step: 4, label: 'Results', icon: '✨' }
            ].map(({ step, label, icon }) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-full border-2 font-semibold transition-all duration-500 ${
                    currentStep >= step 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent text-white shadow-lg shadow-blue-500/25 transform scale-110' 
                      : currentStep === step - 1 
                      ? 'border-blue-300 text-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-300 text-gray-400 bg-white'
                  }`}>
                    {currentStep > step ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-2xl">{icon}</span>
                    )}
                  </div>
                  <span className={`mt-3 text-sm font-medium transition-colors duration-300 ${
                    currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                </div>
                {step < 4 && (
                  <div className={`w-20 h-1 mx-6 rounded-full transition-all duration-500 ${
                    currentStep > step ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content with enhanced styling */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 border border-gray-100 overflow-hidden">
            {currentStep === 1 && (
              <div className="p-8">
                <FileUpload onUpload={handleFileUpload} isLoading={isLoading} setIsLoading={setIsLoading} />
              </div>
            )}

            {currentStep === 2 && fileData && (
              <div className="p-8">
                <DataPreview 
                  data={fileData} 
                  onNext={() => setCurrentStep(3)}
                  onBack={() => setCurrentStep(1)}
                />
              </div>
            )}

            {currentStep === 3 && fileData && (
              <div className="p-8">
                <CleaningOptions
                  config={cleaningConfig}
                  setConfig={setCleaningConfig}
                  fileData={fileData}
                  onComplete={handleCleaningComplete}
                  onBack={() => setCurrentStep(2)}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  onCleaningStart={handleCleaningStart}
                />
              </div>
            )}

            {currentStep === 4 && cleaningResult && (
              <div className="p-8">
                <CleaningResults
                  result={cleaningResult}
                  onStartOver={resetProcess}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isLoading}
        message={loadingMessage}
        onCancel={() => {
          setIsLoading(false)
          setLoadingMessage('')
          setProcessingProgress(0)
        }}
      />
    </div>
  )
}
