import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import {
  Upload, Download, Plus, X, Save, AlertCircle, CheckCircle2,
  FileSpreadsheet, Edit2, Trash2, Users, Building2, DollarSign,
  Calendar, Settings, ChevronLeft, RefreshCw, Loader2
} from 'lucide-react'

const DataInput = () => {
  const { selectedCompany } = useCompany()
  const { getAuthHeaders } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get context from URL params
  const searchParams = new URLSearchParams(location.search)
  const processId = searchParams.get('processId')
  const processName = searchParams.get('processName')
  const scenarioId = searchParams.get('scenario')
  const scenarioName = searchParams.get('scenarioName')
  const yearId = searchParams.get('year')
  const yearName = searchParams.get('yearName')

  // State
  const [activeCard, setActiveCard] = useState('entity_amounts')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [customFields, setCustomFields] = useState([])
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showManualEntryModal, setShowManualEntryModal] = useState(false)
  
  // Custom field form
  const [customFieldForm, setCustomFieldForm] = useState({
    field_name: '',
    field_type: 'text',
    is_required: false,
    options: ''
  })

  // Upload state
  const [uploadFile, setUploadFile] = useState(null)
  
  // Manual entry state
  const [manualEntryForm, setManualEntryForm] = useState({
    account_id: '',
    entity_id: '',
    period_id: '',
    amount: '',
    currency: 'USD',
    description: ''
  })

  // Card data state
  const [cardData, setCardData] = useState({
    entity_amounts: { rows: 0, validated: 0, errors: 0, lastUpload: null },
    ic_amounts: { rows: 0, validated: 0, errors: 0, lastUpload: null },
    other_amounts: { rows: 0, validated: 0, errors: 0, lastUpload: null }
  })

  // Reference data
  const [accounts, setAccounts] = useState([])
  const [entities, setEntities] = useState([])
  const [periods, setPeriods] = useState([])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // Fetch reference data
  useEffect(() => {
    if (selectedCompany && getAuthHeaders) {
      fetchAccounts()
      fetchEntities()
      fetchPeriods()
      fetchCustomFields()
      fetchCardStatus()
    }
  }, [selectedCompany, getAuthHeaders, activeCard])

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/axes-account/elements?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      if (response.ok) {
        const data = await response.json()
        setAccounts(data || [])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchEntities = async () => {
    try {
      const response = await fetch(`/api/axes-entity/elements?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      if (response.ok) {
        const data = await response.json()
        setEntities(data || [])
      }
    } catch (error) {
      console.error('Error fetching entities:', error)
    }
  }

  const fetchPeriods = async () => {
    if (!yearId) return
    try {
      const response = await fetch(`/api/fiscal-management/fiscal-years/${yearId}/periods`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Company-Database': selectedCompany, ...getAuthHeaders() }
      })
      if (response.ok) {
        const data = await response.json()
        setPeriods(data?.periods || [])
      }
    } catch (error) {
      console.error('Error fetching periods:', error)
    }
  }

  const fetchCustomFields = async () => {
    try {
      const response = await fetch(`/api/data-input/custom-fields/${activeCard}?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })
      if (response.ok) {
        const data = await response.json()
        setCustomFields(data?.fields || [])
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error)
    }
  }

  const fetchCardStatus = async () => {
    try {
      const response = await fetch(`/api/data-input/${activeCard}/status?process_id=${processId}&scenario_id=${scenarioId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Company-Database': selectedCompany, ...getAuthHeaders() }
      })
      if (response.ok) {
        const data = await response.json()
        setCardData(prev => ({ ...prev, [activeCard]: data }))
      }
    } catch (error) {
      console.error('Error fetching card status:', error)
    }
  }

  const saveCustomField = async () => {
    if (!customFieldForm.field_name.trim()) {
      showNotification('Field name is required', 'error')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/data-input/custom-fields/${activeCard}?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(customFieldForm)
      })

      if (response.ok) {
        showNotification('Custom field added successfully', 'success')
        setShowCustomFieldModal(false)
        setCustomFieldForm({ field_name: '', field_type: 'text', is_required: false, options: '' })
        fetchCustomFields()
      } else {
        throw new Error('Failed to save custom field')
      }
    } catch (error) {
      console.error('Error saving custom field:', error)
      showNotification(error.message || 'Failed to save custom field', 'error')
    } finally {
      setLoading(false)
    }
  }

  const deleteCustomField = async (fieldId) => {
    if (!confirm('Are you sure you want to delete this custom field?')) return

    try {
      const response = await fetch(`/api/data-input/custom-fields/${activeCard}/${fieldId}?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      })

      if (response.ok) {
        showNotification('Custom field deleted successfully', 'success')
        fetchCustomFields()
      } else {
        throw new Error('Failed to delete custom field')
      }
    } catch (error) {
      console.error('Error deleting custom field:', error)
      showNotification(error.message || 'Failed to delete custom field', 'error')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadFile(file)
    showNotification(`File "${file.name}" selected. Ready to upload.`, 'success')
  }

  const processUpload = async () => {
    if (!uploadFile) return

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('process_id', processId)
      formData.append('scenario_id', scenarioId)
      formData.append('year_id', yearId)
      formData.append('card_type', activeCard)
      formData.append('origin', uploadFile.name)

      const response = await fetch(`/api/data-input/${activeCard}/upload?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...getAuthHeaders() },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        showNotification(`Upload successful! ${result.rows_inserted || 0} rows inserted`, 'success')
        setShowUploadModal(false)
        setUploadFile(null)
        fetchCardStatus()
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      showNotification(error.message || 'Upload failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveManualEntry = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/data-input/${activeCard}/manual-entry?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          ...manualEntryForm,
          process_id: processId,
          scenario_id: scenarioId,
          year_id: yearId,
          origin: 'manual_input'
        })
      })

      if (response.ok) {
        showNotification('Entry saved successfully', 'success')
        setShowManualEntryModal(false)
        setManualEntryForm({ account_id: '', entity_id: '', period_id: '', amount: '', currency: 'USD', description: '' })
        fetchCardStatus()
      } else {
        throw new Error('Failed to save entry')
      }
    } catch (error) {
      console.error('Error saving manual entry:', error)
      showNotification(error.message || 'Failed to save entry', 'error')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`/api/data-input/${activeCard}/template?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { ...getAuthHeaders() }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${activeCard}_template.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading template:', error)
      showNotification('Failed to download template', 'error')
    }
  }

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
              <button onClick={() => navigate(`/process`)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Data Input - {processName || 'Process'}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {yearName || 'Year Not Set'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet className="h-4 w-4" />
                    {scenarioName || 'Scenario Not Set'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {selectedCompany}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => navigate(`/process`)} className="btn-primary inline-flex items-center gap-2">
              Proceed to Process Canvas
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
                  isActive ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  {isActive && <CheckCircle2 className="h-6 w-6 text-blue-500" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{card.description}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rows uploaded:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{cardStatus.rows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Validated:</span>
                    <span className="font-semibold text-green-600">{cardStatus.validated} OK</span>
                  </div>
                  {cardStatus.errors > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Errors:</span>
                      <span className="font-semibold text-red-600">{cardStatus.errors}</span>
                    </div>
                  )}
                  {cardStatus.lastUpload && (
                    <div className="text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                      Last upload: {new Date(cardStatus.lastUpload).toLocaleString()}
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
                {cards.find(c => c.id === activeCard)?.title} - Data Management
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={downloadTemplate} className="btn-secondary inline-flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
                <button onClick={() => setShowUploadModal(true)} className="btn-primary inline-flex items-center gap-2 text-sm">
                  <Upload className="h-4 w-4" />
                  Upload File
                </button>
                <button onClick={() => setShowManualEntryModal(true)} className="btn-primary inline-flex items-center gap-2 text-sm">
                  <Plus className="h-4 w-4" />
                  Manual Entry
                </button>
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Fields</h3>
              <button onClick={() => setShowCustomFieldModal(true)} className="btn-secondary inline-flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" />
                Add Custom Field
              </button>
            </div>

            {customFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No custom fields defined</p>
                <p className="text-sm">Add custom fields to extend data capture</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customFields.map((field) => (
                  <div key={field.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {field.field_name}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        <p className="text-xs text-gray-500">{field.field_type}</p>
                      </div>
                      <button onClick={() => deleteCustomField(field.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {field.options && <p className="text-xs text-gray-600 dark:text-gray-400">Options: {field.options}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals continue in next message due to length */}
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg p-4 shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default DataInput
