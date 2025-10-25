import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import {
  Plus, Save, Upload, FileSpreadsheet, Trash2, Edit3, Check, X,
  Calculator, Building2, Calendar, DollarSign, FileText, AlertCircle,
  ChevronRight, Settings, Download, RefreshCw, Clock, CheckCircle,
  Copy, Paperclip, Eye, Send, UserCheck, Repeat, Archive
} from 'lucide-react'

const JournalEntry = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { selectedCompany } = useCompany()
  
  // Process context from URL
  const processId = searchParams.get('processId')
  const entityId = searchParams.get('entityId') || searchParams.get('entity') || 'all'
  const scenarioId = searchParams.get('scenarioId') || searchParams.get('scenario')
  const fiscalYear = searchParams.get('year') || searchParams.get('yearId') || '2025'
  const period = searchParams.get('period') || searchParams.get('periodId') || 'Q1'
  
  // State
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [currentBatch, setCurrentBatch] = useState(null)
  const [journalLines, setJournalLines] = useState([])
  const [entities, setEntities] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Enhanced form state
  const [journalReference, setJournalReference] = useState('')
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [extractedPeriod, setExtractedPeriod] = useState('')
  const [extractedYear, setExtractedYear] = useState('')
  const [status, setStatus] = useState('draft')
  
  // Templates & Recurring
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState([])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState('monthly')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  
  // Attachments
  const [attachments, setAttachments] = useState([])
  const [showAttachments, setShowAttachments] = useState(false)
  
  // Initialize
  useEffect(() => {
    if (selectedCompany) {
      fetchInitialData()
    }
  }, [selectedCompany])
  
  // Extract period and year from date
  useEffect(() => {
    if (journalDate) {
      const date = new Date(journalDate)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      
      // Determine quarter
      const quarter = Math.ceil(month / 3)
      setExtractedPeriod(`Q${quarter}`)
      setExtractedYear(year.toString())
    }
  }, [journalDate])
  
  const fetchInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchCategories(),
        fetchEntities(),
        fetchAccounts()
      ])
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
        setCategories(data.categories || [])
        
        if (data.categories.length === 0) {
          await createDefaultCategories()
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }
  
  const createDefaultCategories = async () => {
    const defaultCategories = [
      { category_code: 'ACCR', category_name: 'Accruals', description: 'Period-end accrual entries', color: '#3B82F6', icon: 'Clock' },
      { category_code: 'IC', category_name: 'Inter-Company', description: 'IC eliminations', color: '#8B5CF6', icon: 'Building2' },
      { category_code: 'DEP', category_name: 'Depreciation', description: 'Asset depreciation', color: '#F97316', icon: 'Calculator' },
      { category_code: 'MA', category_name: 'Manual Adjustments', description: 'General adjustments', color: '#10B981', icon: 'Edit3' },
      { category_code: 'REC', category_name: 'Recurring', description: 'Monthly recurring entries', color: '#6366F1', icon: 'RefreshCw' },
      { category_code: 'TAX', category_name: 'Tax Adjustments', description: 'Tax provisions', color: '#EF4444', icon: 'FileText' },
      { category_code: 'FX', category_name: 'FX Revaluation', description: 'FX revaluation', color: '#06B6D4', icon: 'DollarSign' },
      { category_code: 'CONS', category_name: 'Consolidation', description: 'Consolidation adjustments', color: '#8B5CF6', icon: 'FileSpreadsheet' }
    ]
    
    const promises = defaultCategories.map(cat =>
      fetch(`/api/journal-entry/categories?company_name=${selectedCompany}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cat, created_by: 'system' })
      }).catch(err => console.error(`Error creating ${cat.category_name}:`, err))
    )
    
    await Promise.all(promises)
    fetchCategories()
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
  
  const fetchTemplates = async (categoryId) => {
    try {
      const response = await fetch(
        `/api/journal-entry/templates?company_name=${selectedCompany}&category_id=${categoryId}`
      )
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }
  
  const selectCategory = async (category) => {
    setSelectedCategory(category)
    await fetchTemplates(category.id)
    
    // Create new batch
    try {
      const batchData = {
        journal_reference: `${category.category_code}-${Date.now()}`,
        journal_date: journalDate,
        description: `${category.category_name} Entry`,
        process_id: processId ? parseInt(processId) : null,
        entity_id: entityId !== 'all' ? entityId : null,
        scenario_id: scenarioId ? parseInt(scenarioId) : null,
        fiscal_year: extractedYear || fiscalYear,
        period: extractedPeriod || period,
        category_id: category.id,
        category: category.category_name,
        created_by: 'current_user'
      }
      
      const response = await fetch(`/api/journal-entry/batches?company_name=${selectedCompany}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData)
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentBatch({ id: data.batch_id, batch_number: data.batch_number, ...batchData })
        setJournalReference(batchData.journal_reference)
        setDescription(batchData.description)
        setJournalLines([])
      }
    } catch (error) {
      console.error('Error creating batch:', error)
    }
  }
  
  const addDebitLine = () => {
    const newLine = {
      id: `temp_${Date.now()}`,
      line_number: journalLines.length + 1,
      entry_type: 'debit',
      entity_code: entityId !== 'all' ? entityId : '',
      entity_name: '',
      account_code: '',
      account_name: '',
      amount: 0,
      currency: 'INR',
      description: ''
    }
    setJournalLines([...journalLines, newLine])
  }
  
  const addCreditLine = () => {
    const newLine = {
      id: `temp_${Date.now()}`,
      line_number: journalLines.length + 1,
      entry_type: 'credit',
      entity_code: entityId !== 'all' ? entityId : '',
      entity_name: '',
      account_code: '',
      account_name: '',
      amount: 0,
      currency: 'INR',
      description: ''
    }
    setJournalLines([...journalLines, newLine])
  }
  
  const updateLine = (index, field, value) => {
    const updatedLines = [...journalLines]
    updatedLines[index] = { ...updatedLines[index], [field]: value }
    
    if (field === 'entity_code') {
      const entity = entities.find(e => e.code === value)
      if (entity) updatedLines[index].entity_name = entity.name
    }
    
    if (field === 'account_code') {
      const account = accounts.find(a => a.code === value)
      if (account) updatedLines[index].account_name = account.name
    }
    
    setJournalLines(updatedLines)
  }
  
  const removeLine = (index) => {
    setJournalLines(journalLines.filter((_, i) => i !== index))
  }
  
  const calculateTotals = () => {
    const totalDebits = journalLines
      .filter(line => line.entry_type === 'debit')
      .reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0)
    
    const totalCredits = journalLines
      .filter(line => line.entry_type === 'credit')
      .reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0)
    
    return {
      totalDebits,
      totalCredits,
      difference: Math.abs(totalDebits - totalCredits),
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
    }
  }
  
  const saveBatch = async () => {
    if (!currentBatch || journalLines.length === 0) return
    
    const { isBalanced } = calculateTotals()
    if (!isBalanced) {
      alert('Debits and credits must be balanced!')
      return
    }
    
    setSaving(true)
    try {
      // Update batch header
      await fetch(`/api/journal-entry/batches/${currentBatch.id}?company_name=${selectedCompany}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journal_reference: journalReference,
          journal_date: journalDate,
          description,
          modified_by: 'current_user'
        })
      })
      
      // Save lines
      for (const line of journalLines) {
        if (line.id.toString().startsWith('temp_')) {
          await fetch(`/api/journal-entry/batches/${currentBatch.id}/lines?company_name=${selectedCompany}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...line, created_by: 'current_user' })
          })
        }
      }
      
      // Save as template if recurring
      if (isRecurring) {
        await fetch(`/api/journal-entry/templates?company_name=${selectedCompany}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_name: `${selectedCategory.category_name} - ${new Date().toLocaleDateString()}`,
            template_code: `TMPL_${Date.now()}`,
            description,
            category_id: selectedCategory.id,
            is_recurring: true,
            recurrence_pattern: recurrencePattern,
            recurrence_end_date: recurrenceEndDate,
            default_entity: entityId !== 'all' ? entityId : null,
            default_scenario: scenarioId,
            template_lines: journalLines.map(line => ({
              entry_type: line.entry_type,
              account_code: line.account_code,
              account_name: line.account_name,
              amount: line.amount,
              currency: line.currency,
              description: line.description
            })),
            created_by: 'current_user'
          })
        })
      }
      
      alert('Journal saved successfully!')
      
      // Reset
      setSelectedCategory(null)
      setCurrentBatch(null)
      setJournalLines([])
      setJournalReference('')
      setDescription('')
      setIsRecurring(false)
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error saving journal entry')
    } finally {
      setSaving(false)
    }
  }
  
  const submitForApproval = async () => {
    if (!currentBatch) return
    
    try {
      const response = await fetch(
        `/api/journal-entry/batches/${currentBatch.id}/submit?company_name=${selectedCompany}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submitted_by: 'current_user', comments: '' })
        }
      )
      
      if (response.ok) {
        alert('Journal submitted for approval!')
        setStatus('submitted')
      }
    } catch (error) {
      console.error('Error submitting:', error)
    }
  }
  
  const copyBatch = async () => {
    if (!currentBatch) return
    
    try {
      const response = await fetch(
        `/api/journal-entry/batches/${currentBatch.id}/copy?company_name=${selectedCompany}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            journal_date: new Date().toISOString().split('T')[0],
            created_by: 'current_user'
          })
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        alert(`Copied! New batch: ${data.batch_number}`)
        window.location.reload()
      }
    } catch (error) {
      console.error('Error copying:', error)
    }
  }
  
  const applyTemplate = async (template) => {
    try {
      const templateLines = JSON.parse(template.template_lines || '[]')
      const newLines = templateLines.map((tLine, idx) => ({
        id: `temp_${Date.now()}_${idx}`,
        line_number: idx + 1,
        ...tLine
      }))
      
      setJournalLines(newLines)
      setShowTemplates(false)
      alert('Template applied!')
    } catch (error) {
      console.error('Error applying template:', error)
    }
  }
  
  const uploadAttachment = async (e) => {
    if (!currentBatch) return
    
    const file = e.target.files[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch(
        `/api/journal-entry/batches/${currentBatch.id}/attachments?company_name=${selectedCompany}&uploaded_by=current_user`,
        {
          method: 'POST',
          body: formData
        }
      )
      
      if (response.ok) {
        alert('Attachment uploaded!')
        // Refresh attachments
        const attResponse = await fetch(
          `/api/journal-entry/batches/${currentBatch.id}/attachments?company_name=${selectedCompany}`
        )
        if (attResponse.ok) {
          const data = await attResponse.json()
          setAttachments(data.attachments || [])
        }
      }
    } catch (error) {
      console.error('Error uploading attachment:', error)
    }
  }
  
  const { totalDebits, totalCredits, difference, isBalanced } = calculateTotals()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select to create journal</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => selectCategory(category)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedCategory?.id === category.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div 
                  className="p-2 rounded-lg text-white"
                  style={{ backgroundColor: category.color || '#3B82F6' }}
                >
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {category.category_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {category.description}
                  </p>
                </div>
                {selectedCategory?.id === category.id && (
                  <ChevronRight className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t">
          <button
            onClick={() => navigate('/settings/journal-categories')}
            className="w-full flex items-center justify-center px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Categories
          </button>
        </div>
      </div>
      
      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedCategory ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a Category
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a category from the left to begin
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedCategory.category_name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Process: {processId || 'Standalone'} | Entity: {entityId} | Period: {extractedPeriod || period}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                    status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Templates
                  </button>
                  <button
                    onClick={copyBatch}
                    disabled={!currentBatch}
                    className="flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </button>
                  <button
                    onClick={saveBatch}
                    disabled={saving || journalLines.length === 0 || !isBalanced}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {status === 'draft' && (
                    <button
                      onClick={submitForApproval}
                      disabled={!currentBatch || !isBalanced}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit
                    </button>
                  )}
                </div>
              </div>
              
              {/* Journal Header */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-1">Journal Reference</label>
                  <input
                    type="text"
                    value={journalReference}
                    onChange={(e) => setJournalReference(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                    placeholder="JE-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                  />
                  {extractedPeriod && (
                    <p className="text-xs text-gray-500 mt-1">Period: {extractedPeriod} {extractedYear}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                    placeholder="Journal description"
                  />
                </div>
              </div>
              
              {/* Recurring Toggle */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label className="flex items-center text-sm font-medium">
                      <Repeat className="h-4 w-4 mr-2" />
                      Recurring Entry
                    </label>
                  </div>
                  {isRecurring && (
                    <div className="flex items-center space-x-3">
                      <select
                        value={recurrencePattern}
                        onChange={(e) => setRecurrencePattern(e.target.value)}
                        className="px-3 py-1 border rounded bg-white dark:bg-gray-800 text-sm"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                      </select>
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="px-3 py-1 border rounded bg-white dark:bg-gray-800 text-sm"
                        placeholder="End date"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Attachments */}
              <div className="mt-4 flex items-center space-x-3">
                <label className="flex items-center px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload Attachment
                  <input
                    type="file"
                    onChange={uploadAttachment}
                    className="hidden"
                    multiple
                  />
                </label>
                {attachments.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            {/* Journal Lines */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="text-lg font-medium">Journal Lines</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={addDebitLine}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Debit
                    </button>
                    <button
                      onClick={addCreditLine}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Credit
                    </button>
                  </div>
                </div>
                
                {/* Grid Header */}
                <div className="grid grid-cols-12 gap-2 p-4 bg-gray-50 dark:bg-gray-700 text-sm font-medium border-b">
                  <div className="col-span-1">Type</div>
                  <div className="col-span-2">Entity</div>
                  <div className="col-span-3">Account</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-1">Action</div>
                </div>
                
                {/* Lines */}
                <div className="max-h-96 overflow-y-auto">
                  {journalLines.map((line, index) => (
                    <div key={line.id} className="grid grid-cols-12 gap-2 p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="col-span-1 flex items-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          line.entry_type === 'debit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {line.entry_type === 'debit' ? 'DR' : 'CR'}
                        </span>
                      </div>
                      
                      <div className="col-span-2">
                        <select
                          value={line.entity_code}
                          onChange={(e) => updateLine(index, 'entity_code', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                        >
                          <option value="">Entity</option>
                          {entities.map(entity => (
                            <option key={entity.code} value={entity.code}>{entity.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-span-3">
                        <select
                          value={line.account_code}
                          onChange={(e) => updateLine(index, 'account_code', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                        >
                          <option value="">Account</option>
                          {accounts.map(account => (
                            <option key={account.code} value={account.code}>
                              {account.code} - {account.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={line.amount}
                          onChange={(e) => updateLine(index, 'amount', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                          placeholder="Description"
                        />
                      </div>
                      
                      <div className="col-span-1 flex items-center">
                        <button
                          onClick={() => removeLine(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {journalLines.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No lines. Click "Add Debit" or "Add Credit" to begin.
                    </div>
                  )}
                </div>
                
                {/* Totals */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="text-sm">
                        <span className="text-gray-600">Total Debits: </span>
                        <span className="font-medium text-green-600">
                          ₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Total Credits: </span>
                        <span className="font-medium text-red-600">
                          ₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className={`flex items-center text-sm font-medium ${
                        isBalanced ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isBalanced ? (
                          <><CheckCircle className="h-4 w-4 mr-1" />Balanced</>
                        ) : (
                          <><AlertCircle className="h-4 w-4 mr-1" />Diff: ₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {journalLines.length} line{journalLines.length !== 1 ? 's' : ''} | {currentBatch?.batch_number || 'New'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Templates</h3>
              <button onClick={() => setShowTemplates(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {templates.map(template => (
                <div key={template.id} className="p-4 border rounded-lg mb-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{template.template_name}</h4>
                      <p className="text-sm text-gray-500">{template.description}</p>
                      {template.is_recurring && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-2 inline-block">
                          Recurring: {template.recurrence_pattern}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => applyTemplate(template)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-center text-gray-500 py-8">No templates available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JournalEntry
