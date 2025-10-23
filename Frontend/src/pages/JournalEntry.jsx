import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import {
  Plus, Save, Upload, FileSpreadsheet, Trash2, Edit3, Check, X,
  Calculator, Building2, Calendar, DollarSign, FileText, AlertCircle,
  ChevronRight, Settings, Download, RefreshCw, Clock, CheckCircle
} from 'lucide-react'

const JournalEntry = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { selectedCompany } = useCompany()
  
  // Process context from URL parameters
  const processId = searchParams.get('processId')
  const entityId = searchParams.get('entityId') || 'all'
  const scenarioId = searchParams.get('scenarioId')
  const fiscalYear = searchParams.get('year') || '2025'
  const period = searchParams.get('period') || 'Q1'
  
  // State management
  const [selectedCategory, setSelectedCategory] = useState('manual_adjustments')
  const [currentBatch, setCurrentBatch] = useState(null)
  const [journalLines, setJournalLines] = useState([])
  const [categories, setCategories] = useState([])
  const [entities, setEntities] = useState([])
  const [accounts, setAccounts] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [contextEntity, setContextEntity] = useState(entityId)
  const [contextScenario, setContextScenario] = useState(scenarioId)
  const [contextPeriod, setContextPeriod] = useState(period)

  // Categories configuration
  const defaultCategories = [
    {
      id: 'accruals',
      name: 'Accruals',
      description: 'Period-end accrual entries',
      icon: Clock,
      color: 'bg-blue-500'
    },
    {
      id: 'intercompany',
      name: 'Inter-Company Settlement',
      description: 'IC eliminations and settlements',
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      id: 'depreciation',
      name: 'Depreciation',
      description: 'Asset depreciation and amortization',
      icon: Calculator,
      color: 'bg-orange-500'
    },
    {
      id: 'manual_adjustments',
      name: 'Manual Adjustments',
      description: 'General manual adjustments',
      icon: Edit3,
      color: 'bg-green-500'
    },
    {
      id: 'recurring_entries',
      name: 'Recurring Entries',
      description: 'Monthly recurring journal entries',
      icon: RefreshCw,
      color: 'bg-indigo-500'
    },
    {
      id: 'tax_adjustments',
      name: 'Tax Adjustments',
      description: 'Tax provision and adjustments',
      icon: FileText,
      color: 'bg-red-500'
    },
    {
      id: 'fx_revaluation',
      name: 'FX Revaluation',
      description: 'Foreign exchange revaluation',
      icon: DollarSign,
      color: 'bg-cyan-500'
    },
    {
      id: 'consolidation',
      name: 'Consolidation Entries',
      description: 'Group consolidation adjustments',
      icon: FileSpreadsheet,
      color: 'bg-violet-500'
    }
  ]

  // Initialize component
  useEffect(() => {
    fetchInitialData()
  }, [selectedCompany, selectedCategory])

  const fetchInitialData = async () => {
    if (!selectedCompany) return
    
    setLoading(true)
    try {
      // Fetch categories, entities, accounts in parallel
      await Promise.all([
        fetchCategories(),
        fetchEntities(),
        fetchAccounts(),
        fetchTemplates()
      ])
      
      // Create new batch for selected category
      await createNewBatch()
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/journal-entry/categories?company_name=${selectedCompany}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || defaultCategories)
      } else {
        setCategories(defaultCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories(defaultCategories)
    }
  }

  const fetchEntities = async () => {
    try {
      const response = await fetch(`/api/axes-entity/elements?company_name=${selectedCompany}`)
      if (response.ok) {
        const data = await response.json()
        setEntities(data.elements || [])
      }
    } catch (error) {
      console.error('Error fetching entities:', error)
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/axes-account/elements?company_name=${selectedCompany}`)
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.elements || [])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/journal-entry/templates?company_name=${selectedCompany}&category=${selectedCategory}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const createNewBatch = async () => {
    try {
      const batchData = {
        description: `${selectedCategory} - ${new Date().toLocaleDateString()}`,
        process_id: processId,
        entity_id: contextEntity,
        scenario_id: contextScenario,
        fiscal_year: fiscalYear,
        period: contextPeriod,
        category: selectedCategory,
        created_by: 'current_user'
      }

      const response = await fetch(`/api/journal-entry/batches?company_name=${selectedCompany}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData)
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentBatch({
          id: data.batch_id,
          batch_number: data.batch_number,
          ...batchData
        })
        setJournalLines([])
      }
    } catch (error) {
      console.error('Error creating batch:', error)
    }
  }

  const addJournalLine = () => {
    const newLine = {
      id: `temp_${Date.now()}`,
      line_number: journalLines.length + 1,
      transaction_date: new Date().toISOString().split('T')[0],
      period: contextPeriod,
      entity_code: contextEntity !== 'all' ? contextEntity : '',
      entity_name: '',
      account_debit_code: '',
      account_debit_name: '',
      account_credit_code: '',
      account_credit_name: '',
      amount: 0,
      currency: 'INR',
      description: '',
      reference_number: '',
      custom_fields: {}
    }
    setJournalLines([...journalLines, newLine])
  }

  const updateJournalLine = (index, field, value) => {
    const updatedLines = [...journalLines]
    updatedLines[index] = { ...updatedLines[index], [field]: value }
    
    // Auto-populate entity name when entity code changes
    if (field === 'entity_code') {
      const entity = entities.find(e => e.code === value)
      if (entity) {
        updatedLines[index].entity_name = entity.name
      }
    }
    
    // Auto-populate account names when account codes change
    if (field === 'account_debit_code') {
      const account = accounts.find(a => a.code === value)
      if (account) {
        updatedLines[index].account_debit_name = account.name
      }
    }
    
    if (field === 'account_credit_code') {
      const account = accounts.find(a => a.code === value)
      if (account) {
        updatedLines[index].account_credit_name = account.name
      }
    }
    
    setJournalLines(updatedLines)
  }

  const removeJournalLine = (index) => {
    const updatedLines = journalLines.filter((_, i) => i !== index)
    setJournalLines(updatedLines)
  }

  const saveBatch = async () => {
    if (!currentBatch || journalLines.length === 0) return
    
    setSaving(true)
    try {
      // Save each journal line
      for (const line of journalLines) {
        if (line.id.toString().startsWith('temp_')) {
          const response = await fetch(`/api/journal-entry/batches/${currentBatch.id}/lines?company_name=${selectedCompany}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...line,
              created_by: 'current_user'
            })
          })
          
          if (!response.ok) {
            throw new Error(`Failed to save line ${line.line_number}`)
          }
        }
      }
      
      // Show success message
      alert('Journal batch saved successfully!')
      
    } catch (error) {
      console.error('Error saving batch:', error)
      alert('Error saving journal batch: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const calculateTotals = () => {
    const totalDebits = journalLines.reduce((sum, line) => {
      return sum + (line.account_debit_code ? parseFloat(line.amount || 0) : 0)
    }, 0)
    
    const totalCredits = journalLines.reduce((sum, line) => {
      return sum + (line.account_credit_code ? parseFloat(line.amount || 0) : 0)
    }, 0)
    
    return { totalDebits, totalCredits, isBalanced: totalDebits === totalCredits }
  }

  const { totalDebits, totalCredits, isBalanced } = calculateTotals()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading journal entry module...</span>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Left Panel - Categories */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Journal Categories</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Select a category to create entries</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {defaultCategories.map((category) => {
            const IconComponent = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${category.color} text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {category.description}
                    </p>
                  </div>
                  {selectedCategory === category.id && (
                    <ChevronRight className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Panel - Journal Entry Form */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Journal Entry - {defaultCategories.find(c => c.id === selectedCategory)?.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Process: {processId || 'Standalone'} | Entity: {contextEntity} | Scenario: {contextScenario} | Period: {contextPeriod}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={saveBatch}
                disabled={saving || journalLines.length === 0}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload Batch
              </button>
            </div>
          </div>

          {/* Context Bar */}
          <div className="mt-4 flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <select
                value={contextEntity}
                onChange={(e) => setContextEntity(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
              >
                <option value="all">All Entities</option>
                {entities.map(entity => (
                  <option key={entity.code} value={entity.code}>
                    {entity.name} ({entity.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <select
                value={contextScenario}
                onChange={(e) => setContextScenario(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
              >
                <option value="actual">Actual</option>
                <option value="budget">Budget</option>
                <option value="forecast">Forecast</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={contextPeriod}
                onChange={(e) => setContextPeriod(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
              >
                <option value="Q1">Q1 2025</option>
                <option value="Q2">Q2 2025</option>
                <option value="Q3">Q3 2025</option>
                <option value="Q4">Q4 2025</option>
              </select>
            </div>
          </div>
        </div>

        {/* Journal Lines Grid */}
        <div className="flex-1 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Journal Entries</h3>
              <button
                onClick={addJournalLine}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </button>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-12 gap-2 p-4 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
              <div className="col-span-1">#</div>
              <div className="col-span-2">Account (Debit)</div>
              <div className="col-span-2">Account (Credit)</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Reference</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* Journal Lines */}
            <div className="max-h-96 overflow-y-auto">
              {journalLines.map((line, index) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 p-4 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="col-span-1 flex items-center text-sm text-gray-500">
                    {index + 1}
                  </div>
                  
                  <div className="col-span-2">
                    <select
                      value={line.account_debit_code}
                      onChange={(e) => updateJournalLine(index, 'account_debit_code', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Debit Account</option>
                      {accounts.map(account => (
                        <option key={account.code} value={account.code}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <select
                      value={line.account_credit_code}
                      onChange={(e) => updateJournalLine(index, 'account_credit_code', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select Credit Account</option>
                      {accounts.map(account => (
                        <option key={account.code} value={account.code}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={line.amount}
                      onChange={(e) => updateJournalLine(index, 'amount', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateJournalLine(index, 'description', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                      placeholder="Description"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={line.reference_number}
                      onChange={(e) => updateJournalLine(index, 'reference_number', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                      placeholder="Reference"
                    />
                  </div>
                  
                  <div className="col-span-1 flex items-center">
                    <button
                      onClick={() => removeJournalLine(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Validation Summary */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Debits: </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₹{totalDebits.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Credits: </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₹{totalCredits.toLocaleString()}
                    </span>
                  </div>
                  <div className={`flex items-center text-sm ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {isBalanced ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Balanced
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Out of Balance: ₹{Math.abs(totalDebits - totalCredits).toLocaleString()}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {journalLines.length} entries | Batch: {currentBatch?.batch_number || 'New'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JournalEntry
