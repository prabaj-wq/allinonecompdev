import React, { useState, useEffect } from 'react'
import { Plus, Trash2, DollarSign, Calendar, FileText, AlertCircle, CheckCircle } from 'lucide-react'

const JournalEntryForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  accounts, 
  selectedEntity,
  selectedCategory 
}) => {
  const [formData, setFormData] = useState({
    journal_number: '',
    description: '',
    journal_date: new Date().toISOString().split('T')[0],
    period: '01',
    year: new Date().getFullYear(),
    journal_type: 'MANUAL',
    reference_number: '',
    notes: '',
    debit_entries: [],
    credit_entries: []
  })

  const [errors, setErrors] = useState({})
  const [totalDebits, setTotalDebits] = useState(0)
  const [totalCredits, setTotalCredits] = useState(0)
  const [isBalanced, setIsBalanced] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        journal_number: '',
        description: '',
        journal_date: new Date().toISOString().split('T')[0],
        period: '01',
        year: new Date().getFullYear(),
        journal_type: 'MANUAL',
        reference_number: '',
        notes: '',
        debit_entries: [],
        credit_entries: []
      })
      setErrors({})
    }
  }, [isOpen])

  useEffect(() => {
    const debitTotal = formData.debit_entries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0)
    const creditTotal = formData.credit_entries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0)
    
    setTotalDebits(debitTotal)
    setTotalCredits(creditTotal)
    setIsBalanced(Math.abs(debitTotal - creditTotal) < 0.01)
  }, [formData.debit_entries, formData.credit_entries])

  const addDebitEntry = () => {
    setFormData(prev => ({
      ...prev,
      debit_entries: [...prev.debit_entries, {
        account_code: '',
        account_name: '',
        entity_code: selectedEntity?.entity_code || '',
        entity_name: selectedEntity?.entity_name || '',
        amount: '',
        description: '',
        reference: ''
      }]
    }))
  }

  const addCreditEntry = () => {
    setFormData(prev => ({
      ...prev,
      credit_entries: [...prev.credit_entries, {
        account_code: '',
        account_name: '',
        entity_code: selectedEntity?.entity_code || '',
        entity_name: selectedEntity?.entity_name || '',
        amount: '',
        description: '',
        reference: ''
      }]
    }))
  }

  const updateDebitEntry = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      debit_entries: prev.debit_entries.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
  }

  const updateCreditEntry = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      credit_entries: prev.credit_entries.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
  }

  const removeDebitEntry = (index) => {
    setFormData(prev => ({
      ...prev,
      debit_entries: prev.debit_entries.filter((_, i) => i !== index)
    }))
  }

  const removeCreditEntry = (index) => {
    setFormData(prev => ({
      ...prev,
      credit_entries: prev.credit_entries.filter((_, i) => i !== index)
    }))
  }

  const handleAccountSelect = (entryIndex, entryType, accountCode) => {
    const account = accounts.find(acc => acc.account_code === accountCode)
    if (account) {
      if (entryType === 'debit') {
        updateDebitEntry(entryIndex, 'account_code', accountCode)
        updateDebitEntry(entryIndex, 'account_name', account.account_name)
      } else {
        updateCreditEntry(entryIndex, 'account_code', accountCode)
        updateCreditEntry(entryIndex, 'account_name', account.account_name)
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.journal_number.trim()) {
      newErrors.journal_number = 'Journal number is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (formData.debit_entries.length === 0) {
      newErrors.debit_entries = 'At least one debit entry is required'
    }
    if (formData.credit_entries.length === 0) {
      newErrors.credit_entries = 'At least one credit entry is required'
    }
    if (!isBalanced) {
      newErrors.balance = 'Journal entries must balance'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Journal Entry</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {selectedEntity?.entity_name} - {selectedCategory?.category_name}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Journal Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Journal Number *
              </label>
              <input
                type="text"
                value={formData.journal_number}
                onChange={(e) => setFormData({...formData, journal_number: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.journal_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="JE-001"
              />
              {errors.journal_number && (
                <p className="text-red-500 text-xs mt-1">{errors.journal_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.journal_date}
                onChange={(e) => setFormData({...formData, journal_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Period
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({...formData, period: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i+1} value={String(i+1).padStart(2, '0')}>
                    {String(i+1).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="2020"
                max="2030"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter journal description"
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Invoice number, contract reference, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Journal Type
              </label>
              <select
                value={formData.journal_type}
                onChange={(e) => setFormData({...formData, journal_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MANUAL">Manual</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="RECLASSIFICATION">Reclassification</option>
                <option value="ELIMINATION">Elimination</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          {/* Balance Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Debits: ${totalDebits.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Credits: ${totalCredits.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {isBalanced ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isBalanced ? 'Balanced' : 'Unbalanced'}
                </span>
              </div>
            </div>
            {errors.balance && (
              <p className="text-red-500 text-xs mt-2">{errors.balance}</p>
            )}
          </div>

          {/* Debit Entries */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-green-700 dark:text-green-400">
                <DollarSign className="inline h-5 w-5 mr-2" />
                Debit Entries
              </h4>
              <button
                onClick={addDebitEntry}
                className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Debit
              </button>
            </div>
            
            {formData.debit_entries.map((entry, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account
                  </label>
                  <select
                    value={entry.account_code}
                    onChange={(e) => handleAccountSelect(index, 'debit', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.account_code} value={account.account_code}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={entry.amount}
                    onChange={(e) => updateDebitEntry(index, 'amount', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={entry.description}
                    onChange={(e) => updateDebitEntry(index, 'description', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Line description"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={entry.reference}
                    onChange={(e) => updateDebitEntry(index, 'reference', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Line reference"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => removeDebitEntry(index)}
                    className="px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {errors.debit_entries && (
              <p className="text-red-500 text-xs mt-2">{errors.debit_entries}</p>
            )}
          </div>

          {/* Credit Entries */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-red-700 dark:text-red-400">
                <DollarSign className="inline h-5 w-5 mr-2" />
                Credit Entries
              </h4>
              <button
                onClick={addCreditEntry}
                className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Credit
              </button>
            </div>
            
            {formData.credit_entries.map((entry, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account
                  </label>
                  <select
                    value={entry.account_code}
                    onChange={(e) => handleAccountSelect(index, 'credit', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.account_code} value={account.account_code}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={entry.amount}
                    onChange={(e) => updateCreditEntry(index, 'amount', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={entry.description}
                    onChange={(e) => updateCreditEntry(index, 'description', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Line description"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={entry.reference}
                    onChange={(e) => updateCreditEntry(index, 'reference', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Line reference"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => removeCreditEntry(index)}
                    className="px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {errors.credit_entries && (
              <p className="text-red-500 text-xs mt-2">{errors.credit_entries}</p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isBalanced}
            className={`px-4 py-2 rounded-lg ${
              isBalanced 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
          >
            Create Journal Entry
          </button>
        </div>
      </div>
    </div>
  )
}

export default JournalEntryForm
