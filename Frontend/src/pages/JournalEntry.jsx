import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import {
  Plus, Save, Trash2, ChevronDown, ChevronRight, Check, X, AlertCircle, CheckCircle, Repeat
} from 'lucide-react'

const JournalEntry = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { selectedCompany } = useCompany()
  
  // Process context from URL - REQUIRED
  const processId = searchParams.get('processId')
  const entityId = searchParams.get('entityId') || searchParams.get('entity')
  const scenarioId = searchParams.get('scenarioId') || searchParams.get('scenario')
  const period = searchParams.get('period') || searchParams.get('periodId')
  
  // State
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [journals, setJournals] = useState([])
  const [expandedJournalId, setExpandedJournalId] = useState(null)
  const [entities, setEntities] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  
  // New journal form
  const [showNewJournalForm, setShowNewJournalForm] = useState(false)
  const [journalReference, setJournalReference] = useState('')
  const [journalDescription, setJournalDescription] = useState('')
  const [journalLines, setJournalLines] = useState([])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringExpiresOn, setRecurringExpiresOn] = useState('')
  const [recurringRepeatDays, setRecurringRepeatDays] = useState(30)
  
  // Validate required params
  useEffect(() => {
    if (!processId || !scenarioId || !period) {
      alert('Missing required parameters: processId, scenarioId, and period are required')
      navigate('/process')
    }
  }, [processId, scenarioId, period, navigate])
  
  useEffect(() => {
    if (selectedCompany && processId) {
      fetchInitialData()
    }
  }, [selectedCompany, processId, scenarioId, period])
  
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
        const cats = data.categories || []
        setCategories(cats)
        
        if (cats.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(cats[0].id)
          fetchJournals(cats[0].id)
        } else if (cats.length === 0) {
          await createDefaultCategories()
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }
  
  const createDefaultCategories = async () => {
    const defaultCategories = [
      { category_code: 'MA', category_name: 'Manual Adjustments', description: 'General adjustments', color: '#10B981' },
      { category_code: 'ACCR', category_name: 'Accruals', description: 'Period-end accruals', color: '#3B82F6' },
      { category_code: 'DEP', category_name: 'Depreciation', description: 'Asset depreciation', color: '#F97316' },
      { category_code: 'TAX', category_name: 'Tax', description: 'Tax entries', color: '#EF4444' }
    ]
    
    for (const cat of defaultCategories) {
      await fetch(`/api/journal-entry/categories?company_name=${selectedCompany}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cat, created_by: 'system' })
      }).catch(err => console.error(err))
    }
    
    fetchCategories()
  }
  
  const fetchJournals = async (categoryId) => {
    try {
      const response = await fetch(
        `/api/journal-entry/batches?company_name=${selectedCompany}&process_id=${processId}&entity_id=${entityId}&scenario_id=${scenarioId}&period=${period}&category_id=${categoryId}`
      )
      if (response.ok) {
        const data = await response.json()
        setJournals(data.batches || [])
      }
    } catch (error) {
      console.error('Error fetching journals:', error)
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
  
  const selectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId)
    fetchJournals(categoryId)
    setShowNewJournalForm(false)
  }
  
  const startNewJournal = () => {
    setShowNewJournalForm(true)
    setJournalReference(`JE-${Date.now()}`)
    setJournalDescription('')
    setJournalLines([{ id: Date.now(), entry_type: 'debit', entity_code: entityId || '', account_code: '', amount: 0, description: '', reference_number: '' }])
    setIsRecurring(false)
    setRecurringExpiresOn('')
    setRecurringRepeatDays(30)
  }
  
  const addDebitLine = () => {
    setJournalLines([...journalLines, {
      id: Date.now(),
      entry_type: 'debit',
      entity_code: entityId || '',
      account_code: '',
      amount: 0,
      description: '',
      reference_number: ''
    }])
  }
  
  const addCreditLine = () => {
    setJournalLines([...journalLines, {
      id: Date.now(),
      entry_type: 'credit',
      entity_code: entityId || '',
      account_code: '',
      amount: 0,
      description: '',
      reference_number: ''
    }])
  }
  
  const updateLine = (index, field, value) => {
    const updated = [...journalLines]
    updated[index][field] = value
    
    if (field === 'entity_code') {
      const entity = entities.find(e => e.code === value)
      if (entity) updated[index].entity_name = entity.name
    }
    
    if (field === 'account_code') {
      const account = accounts.find(a => a.code === value)
      if (account) updated[index].account_name = account.name
    }
    
    setJournalLines(updated)
  }
  
  const removeLine = (index) => {
    setJournalLines(journalLines.filter((_, i) => i !== index))
  }
  
  const calculateBalance = () => {
    const debits = journalLines.filter(l => l.entry_type === 'debit').reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0)
    const credits = journalLines.filter(l => l.entry_type === 'credit').reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0)
    const difference = debits - credits
    return {
      debits,
      credits,
      difference,
      isBalanced: Math.abs(difference) < 0.01
    }
  }
  
  const saveJournal = async () => {
    const { isBalanced } = calculateBalance()
    
    if (!isBalanced) {
      alert('Journal must be balanced (Debits - Credits = 0)')
      return
    }
    
    if (journalLines.length === 0) {
      alert('Add at least one line')
      return
    }
    
    try {
      // Create batch
      const batchResponse = await fetch(`/api/journal-entry/batches?company_name=${selectedCompany}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journal_reference: journalReference,
          journal_date: new Date().toISOString().split('T')[0],
          description: journalDescription,
          process_id: parseInt(processId),
          entity_id: entityId,
          scenario_id: parseInt(scenarioId),
          fiscal_year: new Date().getFullYear().toString(),
          period: period,
          category_id: selectedCategoryId,
          status: 'draft',
          created_by: 'current_user',
          is_recurring: isRecurring,
          recurring_expires_on: recurringExpiresOn || null,
          recurring_repeat_days: isRecurring ? recurringRepeatDays : null
        })
      })
      
      if (!batchResponse.ok) {
        throw new Error('Failed to create journal')
      }
      
      const { batch_id } = await batchResponse.json()
      
      // Save lines
      for (const line of journalLines) {
        await fetch(`/api/journal-entry/batches/${batch_id}/lines?company_name=${selectedCompany}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entry_type: line.entry_type,
            entity_code: line.entity_code,
            entity_name: line.entity_name,
            account_code: line.account_code,
            account_name: line.account_name,
            amount: parseFloat(line.amount),
            description: line.description,
            reference_number: line.reference_number,
            created_by: 'current_user'
          })
        })
      }
      
      alert('Journal saved successfully!')
      setShowNewJournalForm(false)
      fetchJournals(selectedCategoryId)
    } catch (error) {
      console.error('Error saving journal:', error)
      alert('Error saving journal')
    }
  }
  
  const toggleJournalExpand = async (journalId) => {
    if (expandedJournalId === journalId) {
      setExpandedJournalId(null)
    } else {
      setExpandedJournalId(journalId)
      // Fetch lines for this journal
      try {
        const response = await fetch(`/api/journal-entry/batches/${journalId}/lines?company_name=${selectedCompany}`)
        if (response.ok) {
          const data = await response.json()
          // Update the journal with lines
          setJournals(journals.map(j => j.id === journalId ? { ...j, lines: data.lines } : j))
        }
      } catch (error) {
        console.error('Error fetching lines:', error)
      }
    }
  }
  
  const { debits, credits, difference, isBalanced } = calculateBalance()
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  }
  
  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Journal Entries</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Process: {processId} | Scenario: {scenarioId} | Period: {period} | Entity: {entityId || 'All'}
        </p>
      </div>
      
      {/* Category Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b px-4">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => selectCategory(category.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedCategoryId === category.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {category.category_name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!showNewJournalForm ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedCategory?.category_name || 'Select Category'}
              </h2>
              <button
                onClick={startNewJournal}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Journal
              </button>
            </div>
            
            {/* Journal Cards */}
            <div className="space-y-4">
              {journals.map((journal) => (
                <div key={journal.id} className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => toggleJournalExpand(journal.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {expandedJournalId === journal.id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{journal.journal_reference || journal.batch_number}</h3>
                          <p className="text-sm text-gray-500">{journal.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {journal.is_recurring && <Repeat className="h-4 w-4 text-blue-500" title="Recurring" />}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          journal.is_balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {journal.is_balanced ? '✓ Balanced' : '⚠ Unbalanced'}
                        </span>
                        <span className="text-sm text-gray-600">
                          ₹{(journal.total_debits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded View */}
                  {expandedJournalId === journal.id && journal.lines && (
                    <div className="border-t p-4 bg-gray-50 dark:bg-gray-700">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 dark:text-gray-300">
                            <th className="pb-2">Type</th>
                            <th className="pb-2">Entity</th>
                            <th className="pb-2">Account</th>
                            <th className="pb-2">Amount</th>
                            <th className="pb-2">Description</th>
                            <th className="pb-2">Ref#</th>
                          </tr>
                        </thead>
                        <tbody>
                          {journal.lines.map((line) => (
                            <tr key={line.id} className="border-t">
                              <td className="py-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  line.entry_type === 'debit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {line.entry_type === 'debit' ? 'DR' : 'CR'}
                                </span>
                              </td>
                              <td className="py-2">{line.entity_code}</td>
                              <td className="py-2">{line.account_code} - {line.account_name}</td>
                              <td className="py-2">₹{(line.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2">{line.description}</td>
                              <td className="py-2">{line.reference_number}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              
              {journals.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No journals yet. Click "New Journal" to create one.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* New Journal Form */
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Journal Entry</h2>
              <button onClick={() => setShowNewJournalForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Header Fields */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Journal Reference</label>
                <input
                  type="text"
                  value={journalReference}
                  onChange={(e) => setJournalReference(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={journalDescription}
                  onChange={(e) => setJournalDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Journal description"
                />
              </div>
            </div>
            
            {/* Recurring Option */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="font-medium">Recurring Entry</span>
              </label>
              
              {isRecurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Expires On</label>
                    <input
                      type="date"
                      value={recurringExpiresOn}
                      onChange={(e) => setRecurringExpiresOn(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Repeat Every (days)</label>
                    <input
                      type="number"
                      value={recurringRepeatDays}
                      onChange={(e) => setRecurringRepeatDays(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Journal Lines */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Lines</h3>
                <div className="flex space-x-2">
                  <button onClick={addDebitLine} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                    + Debit
                  </button>
                  <button onClick={addCreditLine} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                    + Credit
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {journalLines.map((line, index) => (
                  <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        line.entry_type === 'debit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {line.entry_type === 'debit' ? 'DR' : 'CR'}
                      </span>
                    </div>
                    <select value={line.entity_code} onChange={(e) => updateLine(index, 'entity_code', e.target.value)} className="col-span-2 px-2 py-1 border rounded text-sm">
                      <option value="">Entity</option>
                      {entities.map(e => <option key={e.code} value={e.code}>{e.name}</option>)}
                    </select>
                    <select value={line.account_code} onChange={(e) => updateLine(index, 'account_code', e.target.value)} className="col-span-2 px-2 py-1 border rounded text-sm">
                      <option value="">Account</option>
                      {accounts.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                    </select>
                    <input type="number" value={line.amount} onChange={(e) => updateLine(index, 'amount', e.target.value)} className="col-span-2 px-2 py-1 border rounded text-sm" placeholder="Amount" step="0.01" />
                    <input type="text" value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} className="col-span-2 px-2 py-1 border rounded text-sm" placeholder="Description" />
                    <input type="text" value={line.reference_number} onChange={(e) => updateLine(index, 'reference_number', e.target.value)} className="col-span-2 px-2 py-1 border rounded text-sm" placeholder="Ref#" />
                    <button onClick={() => removeLine(index)} className="col-span-1 text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Balance Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div className="flex space-x-6">
                  <span className="text-sm">Debits: <strong className="text-green-600">₹{debits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                  <span className="text-sm">Credits: <strong className="text-red-600">₹{credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                  <span className="text-sm">Difference: <strong>₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                </div>
                <div className={`flex items-center space-x-2 ${
                  isBalanced ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isBalanced ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  <span className="font-medium">{isBalanced ? 'Balanced' : 'Not Balanced'}</span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowNewJournalForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={saveJournal}
                disabled={!isBalanced || journalLines.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Journal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JournalEntry
