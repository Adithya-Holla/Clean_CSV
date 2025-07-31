'use client'

interface DataPreviewProps {
  data: {
    filename: string
    shape: [number, number]
    columns: string[]
    preview: any[]
    dtypes: Record<string, string>
    missing_values: Record<string, number>
  }
  onNext: () => void
  onBack: () => void
}

export default function DataPreview({ data, onNext, onBack }: DataPreviewProps) {
  const { filename, shape, columns, preview, dtypes, missing_values } = data
  const totalMissingValues = Object.values(missing_values).reduce((a, b) => a + b, 0)
  const dataQualityScore = Math.max(0, 100 - (totalMissingValues / (shape[0] * shape[1]) * 100))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Data Analysis Complete</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Review your data structure and quality metrics before proceeding with the cleaning process.
        </p>
      </div>

      {/* Data Quality Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Dataset</h3>
          <p className="text-sm text-gray-600 truncate">{filename}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Size</h3>
          <p className="text-sm text-gray-600">{shape[0].toLocaleString()} × {shape[1]} cells</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Columns</h3>
          <p className="text-sm text-gray-600">{columns.length} features</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              dataQualityScore >= 90 ? 'bg-green-500' : 
              dataQualityScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Quality Score</h3>
          <p className="text-sm text-gray-600">{dataQualityScore.toFixed(1)}%</p>
        </div>
      </div>

      {/* Enhanced Data Sample */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Data Sample</h3>
          <p className="text-sm text-gray-600 mt-1">First 5 rows of your dataset</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                {columns.map((col, index) => (
                  <th key={col} className="px-6 py-4 border-b border-gray-200 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {col}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        dtypes[col] === 'object' ? 'bg-purple-100 text-purple-800' :
                        dtypes[col].includes('int') ? 'bg-blue-100 text-blue-800' :
                        dtypes[col].includes('float') ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {dtypes[col]}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preview.slice(0, 5).map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map((col) => (
                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm">
                      {row[col] !== null && row[col] !== undefined && row[col] !== '' ? (
                        <span className="text-gray-900">{String(row[col])}</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Missing
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Column Information */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Column Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">Detailed breakdown of each column's characteristics</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {columns.map((col) => {
              const missingCount = missing_values[col] || 0
              const missingPercentage = (missingCount / shape[0] * 100)
              
              return (
                <div key={col} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 truncate">{col}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      dtypes[col] === 'object' ? 'bg-purple-100 text-purple-800' :
                      dtypes[col].includes('int') ? 'bg-blue-100 text-blue-800' :
                      dtypes[col].includes('float') ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {dtypes[col]}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Missing Values:</span>
                      <span className={`font-medium ${missingCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {missingCount} ({missingPercentage.toFixed(1)}%)
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          missingPercentage > 20 ? 'bg-red-500' :
                          missingPercentage > 10 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.max(100 - missingPercentage, 0)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Navigation */}
      <div className="flex justify-between items-center pt-6">
        <button
          onClick={onBack}
          className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Upload
        </button>
        
        <button
          onClick={onNext}
          className="inline-flex items-center px-8 py-3 border border-transparent rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
        >
          Configure Cleaning
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
