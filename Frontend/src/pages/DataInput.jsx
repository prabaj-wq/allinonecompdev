import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import {
  Upload, Download, Plus, X, CheckCircle2,
  FileSpreadsheet, Trash2, Users, Building2, DollarSign,
  Calendar, Settings, ChevronLeft
} from 'lucide-react'

const DataInput = () => {
  const { selectedCompany } = useCompany()
  const { getAuthHeaders } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get context from URL params
  const searchParams = new URLSearchParams(location.search)
  const processName = searchParams.get('processName') || 'Process'
  const scenarioName = searchParams.get('scenarioName') || 'Not Set'
  const yearName = searchParams.get('yearName') || 'Not Set'

  // State
  const [activeCard, setActiveCard] = useState('entity_amounts')
  const [cardData] = useState({
    entity_amounts: { rows: 0, validated: 0, errors: 0 },
    ic_amounts: { rows: 0, validated: 0, errors: 0 },
    other_amounts: { rows: 0, validated: 0, errors: 0 }
  })

  const cards = [
    { id: 'entity_amounts', title: 'Entity Amounts', icon: Building2, description: 'Financial data for individual entities', color: 'bg-blue-500' },
    { id: 'ic_amounts', title: 'IC Amounts (Intercompany)', icon: Users, description: 'Intercompany transaction data', color: 'bg-purple-500' },
    { id: 'other_amounts', title: 'Other Amounts', icon: DollarSign, description: 'Additional financial data and adjustments', color: 'bg-green-500' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Context */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/process')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Data Input - {processName}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {yearName}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet className="h-4 w-4" />
                    {scenarioName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {selectedCompany || 'No Company'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/process')}
              className="btn-primary inline-flex items-center gap-2"
            >
              Back to Process
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {cards.map((card) => {
            const IconComponent = card.icon
            const cardStatus = cardData[card.id]
            const isActive = activeCard === card.id

            return (
              <div
                key={card.id}
                onClick={() => setActiveCard(card.id)}
                className={`relative overflow-hidden rounded-xl border-2 bg-white dark:bg-gray-950 p-6 cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'border-blue-500 shadow-xl scale-105'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  {isActive && <CheckCircle2 className="h-6 w-6 text-blue-500" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {card.description}
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rows uploaded:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {cardStatus?.rows || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Validated:</span>
                    <span className="font-semibold text-green-600">
                      {cardStatus?.validated || 0} OK
                    </span>
                  </div>
                  {cardStatus?.errors > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Errors:</span>
                      <span className="font-semibold text-red-600">
                        {cardStatus.errors}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Active Card Management */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {cards.find(c => c.id === activeCard)?.title || 'Data Management'}
              </h2>
              <div className="flex items-center gap-2">
                <button className="btn-secondary inline-flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
                <button className="btn-primary inline-flex items-center gap-2 text-sm">
                  <Upload className="h-4 w-4" />
                  Upload File
                </button>
                <button className="btn-primary inline-flex items-center gap-2 text-sm">
                  <Plus className="h-4 w-4" />
                  Manual Entry
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Data Input Module</h3>
              <p className="text-sm">
                Upload files or manually enter financial data for {cards.find(c => c.id === activeCard)?.title}
              </p>
              <p className="text-xs mt-4 text-gray-400">
                Feature coming soon with full upload, validation, and data management capabilities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataInput
