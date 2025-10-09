import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Plus,
  Save,
  X,
  Building2,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit,
  Eye
} from 'lucide-react'

const CategoryJournalPage = ({
  category,
  onBack,
  onJournalCreated,
  localEntities = [],
  accounts = [],
  currentPeriod = '',
  currentYear = '',
  getAuthHeaders
}) => {
  const [showJournalModal, setShowJournalModal] = useState(false)
  const [categoryJournals, setCategoryJournals] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [newJournal, setNewJournal] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    period: currentPeriod,
    year: currentYear,
    category_id: category?.id || null,
    debitEntries: [],
    creditEntries: []
  })

  useEffect(() => {
    if (category && category.id) {
      setNewJournal(prev => ({
        ...prev,
        category_id: category.id,
        period: currentPeriod,
        year: currentYear
      }))
      loadCategoryJournals()
    }
  }, [category, currentPeriod, currentYear])

  const loadCategoryJournals = async () => {
    if (!category || !category.id) return
    try {
      setIsLoading(true)
      const response = await fetch(`/api/process/journals?category_id=${category.id}&period=${encodeURIComponent(currentPeriod)}&year=${encodeURIComponent(currentYear)}&source_type=journal`, {
        headers: getAuthHeaders ? getAuthHeaders() : {},
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCategoryJournals(data.journals || [])
      } else {
        setCategoryJournals([])
      }
    } catch (err) {
      console.error('Error loading category journals:', err)
      setCategoryJournals([])
    } finally {
      setIsLoading(false)
    }
  }

  const addEntry = (type) => {
    const entry = { accountCode: '', entity: '', amount: '', description: '' }
    setNewJournal(prev => ({
      ...prev,
      [type === 'debit' ? 'debitEntries' : 'creditEntries']: [
        ...(type === 'debit' ? prev.debitEntries : prev.creditEntries),
        entry
      ]
    }))
  }

  const removeEntry = (type, index) => {
    setNewJournal(prev => ({
      ...prev,
      [type === 'debit' ? 'debitEntries' : 'creditEntries']: (type === 'debit' ? prev.debitEntries : prev.creditEntries).filter((_, i) => i !== index)
    }))
  }

  const updateEntry = (type, index, field, value) => {
    setNewJournal(prev => {
      const listKey = type === 'debit' ? 'debitEntries' : 'creditEntries'
      const list = [...prev[listKey]]
      list[index] = { ...list[index], [field]: value }
      return { ...prev, [listKey]: list }
    })
  }

  const totals = () => {
    const debitTotal = newJournal.debitEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    const creditTotal = newJournal.creditEntries.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    return { debitTotal, creditTotal, diff: debitTotal - creditTotal, balanced: Math.abs(debitTotal - creditTotal) < 0.01 && debitTotal > 0 }
  }

  const postJournal = async () => {
    const { debitTotal, creditTotal, balanced } = totals()
    if (!balanced || !newJournal.description.trim() || newJournal.debitEntries.length === 0 || newJournal.creditEntries.length === 0) {
      alert('Journal must have description, at least one debit and credit, and be perfectly balanced')
      return
    }

    const payload = {
      journalNumber: `PJ-${category?.category_code || 'CAT'}-${Date.now()}`,
      date: newJournal.date,
      description: newJournal.description,
      period: newJournal.period,
      year: newJournal.year,
      category_id: newJournal.category_id,
      status: 'POSTED',
      totalAmount: debitTotal,
      balanced: true,
      debitEntries: newJournal.debitEntries.map(e => ({
        accountCode: e.accountCode,
        entity: e.entity,
        amount: parseFloat(e.amount),
        description: e.description || ''
      })),
      creditEntries: newJournal.creditEntries.map(e => ({
        accountCode: e.accountCode,
        entity: e.entity,
        amount: parseFloat(e.amount),
        description: e.description || ''
      }))
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/process/journals', {
        method: 'POST',
        headers: { ...(getAuthHeaders ? getAuthHeaders() : {}), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      if (response.ok) {
        await response.json()
        setShowJournalModal(false)
        setNewJournal({
          date: new Date().toISOString().split('T')[0],
          description: '',
          period: currentPeriod,
          year: currentYear,
          category_id: category?.id || null,
          debitEntries: [],
          creditEntries: []
        })
        await loadCategoryJournals()
        onJournalCreated && onJournalCreated()
      } else {
        const err = await response.json()
        alert(err.detail || 'Failed to post journal')
      }
    } catch (err) {
      console.error('Error posting journal:', err)
      alert('Error posting journal')
    } finally {
      setIsLoading(false)
    }
  }

  const getAccountName = (code) => {
    const account = accounts.find(a => a.account_code === code)
    return account ? account.account_name : code
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Journals
          </button>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900">{category?.category_name || 'Category'}</h2>
            <p className="text-sm text-gray-500">Code: {category?.category_code} • {currentPeriod} {currentYear}</p>
          </div>
          <button onClick={() => setShowJournalModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2 inline" /> Add Journal
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Journals in this Category</h3>
          {categoryJournals.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No journals yet. Click "Add Journal" to create one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debits</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryJournals.map((j) => {
                    const debit = (j.debitEntries || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
                    const credit = (j.creditEntries || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
                    const balanced = Math.abs(debit - credit) < 0.01
                    return (
                      <tr key={j.id}>
                        <td className="px-4 py-2 text-sm">{new Date(j.date || j.journal_date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm">{j.description}</td>
                        <td className="px-4 py-2 text-sm text-green-700">${debit.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-red-700">${credit.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm font-medium">${(j.totalAmount || j.total_debits || debit).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {balanced ? 'Balanced' : 'Unbalanced'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <button className="text-blue-600 hover:text-blue-800 mr-3"><Eye className="h-4 w-4 inline" /> View</button>
                          <button className="text-yellow-600 hover:text-yellow-800 mr-3"><Edit className="h-4 w-4 inline" /> Edit</button>
                          <button className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4 inline" /> Delete</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showJournalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Process Journal</h3>
                <button onClick={() => setShowJournalModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={newJournal.description}
                    onChange={(e) => setNewJournal({ ...newJournal, description: e.target.value })}
                    className="form-input"
                    placeholder="Enter journal description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={newJournal.date}
                    onChange={(e) => setNewJournal({ ...newJournal, date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-md font-medium text-gray-900">Debit Entries</h4>
                    <button type="button" onClick={() => addEntry('debit')} className="btn-secondary text-sm">
                      <Plus className="h-4 w-4 mr-1 inline" /> Add Debit
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newJournal.debitEntries.map((entry, index) => (
                      <div key={`d-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-2 border rounded">
                        <select
                          value={entry.entity}
                          onChange={(e) => updateEntry('debit', index, 'entity', e.target.value)}
                          className="form-select text-sm"
                        >
                          <option value="">Select Entity</option>
                          {localEntities.map((ent, idx) => (
                            <option key={`${ent.entity_code}-${idx}`} value={ent.entity_code}>
                              {ent.entity_code}
                            </option>
                          ))}
                        </select>
                        <select
                          value={entry.accountCode}
                          onChange={(e) => updateEntry('debit', index, 'accountCode', e.target.value)}
                          className="form-select text-sm"
                        >
                          <option value="">Select Account</option>
                          {accounts.map(acc => (
                            <option key={acc.account_code} value={acc.account_code}>
                              {acc.account_code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={entry.amount}
                          onChange={(e) => updateEntry('debit', index, 'amount', e.target.value)}
                          className="form-input text-sm"
                          placeholder="Amount"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={entry.description || ''}
                            onChange={(e) => updateEntry('debit', index, 'description', e.target.value)}
                            className="form-input text-sm flex-1"
                            placeholder="Description"
                          />
                          <button type="button" onClick={() => removeEntry('debit', index)} className="text-red-600 hover:text-red-800 p-1">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-md font-medium text-gray-900">Credit Entries</h4>
                    <button type="button" onClick={() => addEntry('credit')} className="btn-secondary text-sm">
                      <Plus className="h-4 w-4 mr-1 inline" /> Add Credit
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newJournal.creditEntries.map((entry, index) => (
                      <div key={`c-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-2 border rounded">
                        <select
                          value={entry.entity}
                          onChange={(e) => updateEntry('credit', index, 'entity', e.target.value)}
                          className="form-select text-sm"
                        >
                          <option value="">Select Entity</option>
                          {localEntities.map((ent, idx) => (
                            <option key={`${ent.entity_code}-${idx}`} value={ent.entity_code}>
                              {ent.entity_code}
                            </option>
                          ))}
                        </select>
                        <select
                          value={entry.accountCode}
                          onChange={(e) => updateEntry('credit', index, 'accountCode', e.target.value)}
                          className="form-select text-sm"
                        >
                          <option value="">Select Account</option>
                          {accounts.map(acc => (
                            <option key={acc.account_code} value={acc.account_code}>
                              {acc.account_code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={entry.amount}
                          onChange={(e) => updateEntry('credit', index, 'amount', e.target.value)}
                          className="form-input text-sm"
                          placeholder="Amount"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={entry.description || ''}
                            onChange={(e) => updateEntry('credit', index, 'description', e.target.value)}
                            className="form-input text-sm flex-1"
                            placeholder="Description"
                          />
                          <button type="button" onClick={() => removeEntry('credit', index)} className="text-red-600 hover:text-red-800 p-1">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm">
                  <span className="mr-4">Debits: <span className="font-semibold text-green-700">${totals().debitTotal.toLocaleString()}</span></span>
                  <span className="mr-4">Credits: <span className="font-semibold text-red-700">${totals().creditTotal.toLocaleString()}</span></span>
                  <span>Diff: <span className={`font-semibold ${Math.abs(totals().diff) < 0.01 ? 'text-green-700' : 'text-red-700'}`}>${Math.abs(totals().diff).toLocaleString()}</span></span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowJournalModal(false)} className="btn-secondary">Cancel</button>
                  <button onClick={postJournal} className="btn-primary" disabled={isLoading || !totals().balanced}>
                    <Save className="h-4 w-4 mr-2 inline" /> Post Journal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryJournalPage
