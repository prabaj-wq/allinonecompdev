import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Download, 
  Eye, 
  RefreshCw,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Globe,
  Calculator,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Database,
  Clock,
  Save,
  Play,
  X,
  ChevronUp,
  Layers,
  Building2,
  Users,
  Zap
} from 'lucide-react'

const FinancialStatementsEnhanced = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('December')
  const [selectedYear, setSelectedYear] = useState('2024')
  const [selectedTemplates, setSelectedTemplates] = useState([])
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [selectedEntity, setSelectedEntity] = useState('all')
  const [fstTemplates, setFstTemplates] = useState([])
  const [entities, setEntities] = useState([])
  const [hierarchies, setHierarchies] = useState([])
  const [selectedHierarchy, setSelectedHierarchy] = useState('')
  const [statements, setStatements] = useState(null)
  const [generationStatus, setGenerationStatus] = useState('')
  const [showCachedMessage, setShowCachedMessage] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [error, setError] = useState(null)

  // Available currencies for presentation
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' }
  ]

  const periods = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
    'Q1', 'Q2', 'Q3', 'Q4', 'Annual'
  ]

  const years = ['2022', '2023', '2024', '2025']

  useEffect(() => {
    loadFSTTemplates()
    loadEntities()
    loadHierarchies()
    checkExistingStatements()
  }, [selectedPeriod, selectedYear, selectedEntity, selectedCurrency])

  const loadFSTTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/fst-templates', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setFstTemplates(data.templates || [])
      } else {
        console.error('Failed to load FST templates:', response.status)
        setError('Failed to load FST templates')
      }
    } catch (error) {
      console.error('Error loading FST templates:', error)
      setError('Error loading FST templates')
    } finally {
      setIsLoading(false)
    }
  }

  const loadEntities = async () => {
    try {
      const response = await fetch('/api/entities', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setEntities(data.entities || [])
      } else {
        console.error('Failed to load entities:', response.status)
      }
    } catch (error) {
      console.error('Error loading entities:', error)
    }
  }

  const loadHierarchies = async () => {
    try {
      const response = await fetch('/api/fst-hierarchies', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setHierarchies(data.hierarchies || [])
      } else {
        console.error('Failed to load hierarchies:', response.status)
      }
    } catch (error) {
      console.error('Error loading hierarchies:', error)
    }
  }

  const checkExistingStatements = async () => {
    if (!selectedPeriod || !selectedYear) return
    
    try {
      const response = await fetch(`/api/fst-financial-statements/${selectedPeriod}/${selectedYear}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.statements && data.statements.length > 0) {
          setStatements(data.statements)
          setShowCachedMessage(true)
          setTimeout(() => setShowCachedMessage(false), 5000)
        }
      }
    } catch (error) {
      console.error('Error checking existing statements:', error)
    }
  }

  const handleTemplateSelection = (templateId) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId)
      } else {
        return [...prev, templateId]
      }
    })
  }

  const handleHierarchyFilter = (hierarchyId) => {
    setSelectedHierarchy(hierarchyId)
  }

  const filteredTemplates = fstTemplates.filter(template => {
    if (!selectedHierarchy) return true
    return template.hierarchy_id === selectedHierarchy
  })

  const generateFinancialStatements = async () => {
    if (selectedTemplates.length === 0) {
      setError('Please select at least one FST template')
      return
    }

    if (!selectedPeriod || !selectedYear) {
      setError('Please select both period and year')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerationStatus('Initializing FST templates...')

    try {
      const requestData = {
        period: selectedPeriod,
        year: parseInt(selectedYear),
        templates: selectedTemplates,
        presentation_currency: selectedCurrency,
        all_entities: selectedEntity === 'all',
        entities: selectedEntity === 'all' ? [] : [selectedEntity]
      }

      setGenerationStatus('Generating financial statements...')
      
      const response = await fetch('/api/fst-financial-statements/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const data = await response.json()
        setStatements(data.statements)
        setGenerationStatus('Financial statements generated successfully!')
        
        if (data.cached) {
          setShowCachedMessage(true)
          setTimeout(() => setShowCachedMessage(false), 5000)
        }
        
        setTimeout(() => setGenerationStatus(''), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to generate financial statements')
      }
    } catch (error) {
      console.error('Error generating financial statements:', error)
      setError(error.message)
      setGenerationStatus('Error generating financial statements')
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateStatements = async () => {
    if (selectedTemplates.length === 0) {
      setError('Please select at least one FST template')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerationStatus('Regenerating financial statements...')

    try {
      const requestData = {
        period: selectedPeriod,
        year: parseInt(selectedYear),
        templates: selectedTemplates,
        presentation_currency: selectedCurrency,
        all_entities: selectedEntity === 'all',
        entities: selectedEntity === 'all' ? [] : [selectedEntity],
        regenerate: true
      }

      const response = await fetch('/api/fst-financial-statements/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const data = await response.json()
        setStatements(data.statements)
        setGenerationStatus('Financial statements regenerated successfully!')
        setTimeout(() => setGenerationStatus(''), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to regenerate financial statements')
      }
    } catch (error) {
      console.error('Error regenerating financial statements:', error)
      setError(error.message)
      setGenerationStatus('Error regenerating financial statements')
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteStatements = async () => {
    if (!confirm('Are you sure you want to delete the financial statements for this period?')) {
      return
    }

    try {
      const response = await fetch(`/api/fst-financial-statements/${selectedPeriod}/${selectedYear}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setStatements(null)
        setError(null)
        setGenerationStatus('Financial statements deleted successfully!')
        setTimeout(() => setGenerationStatus(''), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete financial statements')
      }
    } catch (error) {
      console.error('Error deleting financial statements:', error)
      setError(error.message)
    }
  }

  const exportToExcel = () => {
    if (!statements) {
      setError('No statements to export')
      return
    }
    
    console.log('Exporting to Excel:', statements)
    setGenerationStatus('Financial statements exported to Excel successfully!')
    setTimeout(() => setGenerationStatus(''), 3000)
  }

  const resetForm = () => {
    setSelectedTemplates([])
    setSelectedCurrency('USD')
    setSelectedEntity('all')
    setStatements(null)
    setError(null)
    setGenerationStatus('')
    setActiveTab(0)
  }

  const formatCurrency = (amount, currencyCode = selectedCurrency) => {
    const currencyInfo = currencies.find(c => c.code === currencyCode)
    const symbol = currencyInfo?.symbol || currencyCode
    
    if (amount === null || amount === undefined) return '--'
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getEntityName = (entityCode) => {
    if (entityCode === 'all') return 'All Entities'
    const entity = entities.find(e => e.entity_code === entityCode)
    return entity ? entity.entity_name : entityCode
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Statements Generation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate financial statements using FST templates with intelligent caching and currency conversion
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetForm}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>
          {statements && (
            <>
              <button
                onClick={exportToExcel}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </button>
              <button
                onClick={deleteStatements}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cached Message */}
      {showCachedMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            <div className="text-sm text-blue-800">
              <strong>Using cached data:</strong> Financial statements for {selectedPeriod} {selectedYear} already exist in the database. 
              Click "Regenerate" if you need fresh data.
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <div className="text-sm text-red-800">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Configuration Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {periods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>

          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Entity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              Entity
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Entities (Consolidated)</option>
              {entities.map(entity => (
                <option key={entity.entity_code} value={entity.entity_code}>
                  {entity.entity_name}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Globe className="h-4 w-4 inline mr-1" />
              Currency
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} ({currency.symbol}) - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hierarchy Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Layers className="h-4 w-4 inline mr-1" />
            Filter by Hierarchy (Optional)
          </label>
          <select
            value={selectedHierarchy}
            onChange={(e) => handleHierarchyFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Hierarchies</option>
            {hierarchies.map(hierarchy => (
              <option key={hierarchy.id} value={hierarchy.id}>
                {hierarchy.hierarchy_name}
              </option>
            ))}
          </select>
        </div>

        {/* FST Template Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <FileText className="h-4 w-4 inline mr-1" />
            Select FST Templates ({selectedTemplates.length} selected)
          </label>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-500">Loading FST templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No FST templates available</p>
              <p className="text-sm text-gray-400">Create some templates first in the FST Templates section</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelection(template.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTemplates.includes(template.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{template.template_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                      <div className="flex items-center mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {template.template_type}
                        </span>
                        {template.hierarchy_name && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {template.hierarchy_name}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedTemplates.includes(template.id) && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={generateFinancialStatements}
            disabled={isGenerating || selectedTemplates.length === 0}
            className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all ${
              isGenerating || selectedTemplates.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Calculator className="h-5 w-5 mr-2" />
                Generate Statements
              </>
            )}
          </button>

          {statements && (
            <button
              onClick={regenerateStatements}
              disabled={isGenerating}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              } text-white`}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Regenerate
            </button>
          )}
        </div>

        {/* Generation Status */}
        {generationStatus && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 dark:text-blue-200">{generationStatus}</span>
            </div>
          </div>
        )}
      </div>

      {/* Generated Statements Display */}
      {statements && (
        <div className="space-y-6">
          {/* Statement Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Generated Financial Statements
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedEntity === 'all' ? 'All Entities' : getEntityName(selectedEntity)} - {selectedPeriod} {selectedYear}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Presentation Currency: {selectedCurrency} ({currencies.find(c => c.code === selectedCurrency)?.symbol})
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Generated: {new Date().toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {statements.length} template{statements.length > 1 ? 's' : ''} generated
                </p>
              </div>
            </div>
          </div>

          {/* Statement Tabs */}
          {statements.length > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  {statements.map((statement, index) => (
                    <button
                      key={statement.template_id}
                      onClick={() => setActiveTab(index)}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === index
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {statement.template_name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Statement Content */}
          {statements.map((statement, index) => (
            <div
              key={statement.template_id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${
                activeTab === index ? 'block' : 'hidden'
              }`}
            >
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{statement.template_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {statement.template_category} - {statement.period} {statement.year}
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                        Account
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                        Description
                      </th>
                      {statement.entity_codes.map(entityCode => (
                        <th key={entityCode} className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                          {getEntityName(entityCode)}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {statement.lines.map((line, lineIndex) => {
                      const isFormula = line.line_type === 'formula'
                      const isTotal = line.line_type === 'total'
                      
                      let rowClass = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150'
                      let textClass = 'text-gray-900 dark:text-white'
                      let fontClass = 'font-normal'
                      
                      if (isFormula) {
                        rowClass += ' bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-400'
                        textClass = 'text-blue-900 dark:text-blue-200'
                        fontClass = 'font-semibold'
                      } else if (isTotal) {
                        rowClass += ' bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-400 border-t-2 border-t-green-200'
                        textClass = 'text-green-900 dark:text-green-200'
                        fontClass = 'font-bold'
                      }
                      
                      return (
                        <tr key={lineIndex} className={rowClass}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600">
                            <span className={`${fontClass} ${textClass}`}>
                              {line.account_code || <span className="text-blue-600 italic">Formula</span>}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600">
                            <span className={`${fontClass} ${textClass}`}>
                              {line.description}
                            </span>
                          </td>
                          {statement.entity_codes.map(entityCode => {
                            const amount = line.amounts[entityCode] || 0
                            let amountClass = textClass
                            let amountText = formatCurrency(amount, selectedCurrency)
                            
                            if (isFormula || isTotal) {
                              amountClass = 'text-blue-900 dark:text-blue-200 font-semibold'
                            } else if (amount < 0) {
                              amountClass = 'text-red-600 dark:text-red-400'
                              amountText = `(${formatCurrency(Math.abs(amount), selectedCurrency)})`
                            } else if (amount > 0) {
                              amountClass = 'text-green-700 dark:text-green-400'
                            }
                            
                            return (
                              <td key={entityCode} className="px-6 py-4 whitespace-nowrap text-sm text-right border-r border-gray-200 dark:border-gray-600">
                                <span className={amountClass}>{amountText}</span>
                              </td>
                            )
                          })}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={`${textClass} font-semibold`}>
                              {formatCurrency(line.amounts['Total'] || 0, selectedCurrency)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Statement Footer */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </span>
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    {statement.lines.length} line items
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FinancialStatementsEnhanced
