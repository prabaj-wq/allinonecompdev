import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import { ChevronLeft, Calendar, FileSpreadsheet, Building2 } from 'lucide-react'

const DataInput = () => {
  const { selectedCompany } = useCompany()
  const navigate = useNavigate()
  const location = useLocation()
  
  const searchParams = new URLSearchParams(location.search)
  const processName = searchParams.get('processName') || 'Process'
  const scenarioName = searchParams.get('scenarioName') || 'Not Set'
  const yearName = searchParams.get('yearName') || 'Not Set'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/process')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Data Input - {processName}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />{yearName}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet className="h-4 w-4" />{scenarioName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />{selectedCompany || 'No Company'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Data Input Module - Under Construction
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comprehensive data input with manual entry, file upload, and custom fields
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            See DATA_INPUT_IMPLEMENTATION_GUIDE.md for full specifications
          </p>
        </div>
      </div>
    </div>
  )
}

export default DataInput
