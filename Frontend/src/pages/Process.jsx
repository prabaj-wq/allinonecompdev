import React, { useState, useEffect, useMemo } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import {
  Upload,
  Download,
  RefreshCw,
  Save,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Building2,
  Layers,
  Plus,
} from 'lucide-react'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const entryCategories = [
  'Manual Entry',
  'Adjustment',
  'Reclassification',
  'Intercompany',
  'Elimination',
  'Opening Balance',
  'Custom',
  'Imported',
]

const getDefaultPeriod = () => {
  const now = new Date()
  return `Q${Math.floor(now.getMonth() / 3) + 1}`
}

const getDefaultYear = () => new Date().getFullYear().toString()

const defaultFormState = {
  entity_code: '',
  account_code: '',
  amount: '',
  entry_type: 'debit',
  currency: '',
  entry_category: 'Manual Entry',
  counterparty: '',
  description: '',
}

const Process = () => {
  const { selectedCompany } = useCompany()
  const { isAuthenticated, getAuthHeaders } = useAuth()

  const [period, setPeriod] = useState(getDefaultPeriod())
  const [year, setYear] = useState(getDefaultYear())
  const [referenceData, setReferenceData] = useState({ accounts: [], entities: [], currencies: [] })
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState({ count: 0, total_debit: 0, total_credit: 0, net_balance: 0 })

  const [formState, setFormState] = useState(defaultFormState)
  const [formMode, setFormMode] = useState('create')
  const [editingEntry, setEditingEntry] = useState(null)

  const [loadingReference, setLoadingReference] = useState(false)
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [submittingEntry, setSubmittingEntry] = useState(false)
  const [uploadState, setUploadState] = useState({ file: null, uploading: false, errors: [] })
  const [notification, setNotification] = useState(null)

  const periodOptions = useMemo(() => [...QUARTERS, ...MONTHS], [])

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear()
    return Array.from({ length: 6 }).map((_, idx) => (now - idx).toString())
  }, [])

  useEffect(() => {
    if (!selectedCompany || !isAuthenticated) return
    fetchReferenceData()
  }, [selectedCompany, isAuthenticated])

  useEffect(() => {
    if (!selectedCompany || !isAuthenticated) return
    fetchEntries()
  }, [selectedCompany, isAuthenticated, period, year])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const authHeaders = () => getAuthHeaders()

  const fetchReferenceData = async () => {
    if (!selectedCompany) return

    setLoadingReference(true)
    try {
      const response = await fetch(
        `/api/process/reference-data?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'GET',
          headers: authHeaders(),
          credentials: 'include',
        }
      )

      if (!response.ok) throw new Error(`Failed to load reference data (${response.status})`)

      const data = await response.json()
      setReferenceData({
        accounts: data.accounts || [],
        entities: data.entities || [],
        currencies: data.currencies || [],
      })
    } catch (error) {
      console.error('Process: failed to load reference data', error)
      showNotification('Unable to load accounts and entities. Please try again.', 'error')
    } finally {
      setLoadingReference(false)
    }
  }

  const fetchEntries = async () => {
    if (!selectedCompany || !period || !year) return

    setLoadingEntries(true)
    try {
      const response = await fetch(
        `/api/process/entries?company_name=${encodeURIComponent(selectedCompany)}&period=${encodeURIComponent(
          period
        )}&year=${encodeURIComponent(year)}`,
        {
          method: 'GET',
          headers: authHeaders(),
          credentials: 'include',
        }
      )

      if (!response.ok) throw new Error(`Failed to load entries (${response.status})`)

      const data = await response.json()
      setEntries(data.entries || [])
      setSummary(data.summary || { count: 0, total_debit: 0, total_credit: 0, net_balance: 0 })
    } catch (error) {
      console.error('Process: failed to load entries', error)
      showNotification('Unable to load process entries.', 'error')
      setEntries([])
      setSummary({ count: 0, total_debit: 0, total_credit: 0, net_balance: 0 })
    } finally {
      setLoadingEntries(false)
    }
  }

  const formattedCurrency = (value, currency = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value || 0)
    } catch {
      const amount = value?.toFixed ? value.toFixed(2) : value || 0
      return `${amount} ${currency}`
    }
  }

  const selectedAccount = useMemo(
    () => referenceData.accounts.find((acc) => acc.code === formState.account_code),
    [referenceData.accounts, formState.account_code]
  )

  const selectedEntity = useMemo(
    () => referenceData.entities.find((entity) => entity.code === formState.entity_code),
    [referenceData.entities, formState.entity_code]
  )

  useEffect(() => {
    if (selectedEntity && !formState.currency) {
      setFormState((prev) => ({
        ...prev,
        currency: selectedEntity.currency || 'USD',
      }))
    }
  }, [selectedEntity])

  const handleFormChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormState({
      ...defaultFormState,
      currency: selectedEntity?.currency || 'USD',
    })
    setFormMode('create')
    setEditingEntry(null)
  }

  const handleSubmitEntry = async (e) => {
    e.preventDefault()

    if (!selectedCompany) {
      showNotification('Please select a company first.', 'error')
      return
    }

    if (!formState.entity_code || !formState.account_code || !formState.amount) {
      showNotification('Please fill in all required fields before submitting.', 'error')
      return
    }

    const payload = {
      period,
      year,
      entity_code: formState.entity_code,
      account_code: formState.account_code,
      amount: parseFloat(formState.amount),
      entry_type: formState.entry_type,
      currency: formState.currency || selectedEntity?.currency || 'USD',
      entry_category: formState.entry_category,
      counterparty: formState.counterparty || null,
      description: formState.description || null,
      account_name: selectedAccount?.name,
      entity_name: selectedEntity?.name,
    }

    const url =
      formMode === 'edit' && editingEntry
        ? `/api/process/entries/${editingEntry.id}?company_name=${encodeURIComponent(selectedCompany)}`
        : `/api/process/entries?company_name=${encodeURIComponent(selectedCompany)}`

    const method = formMode === 'edit' && editingEntry ? 'PUT' : 'POST'

    setSubmittingEntry(true)
    try {
      const response = await fetch(url, {
        method,
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to save entry')
      }

      await fetchEntries()
      resetForm()
      showNotification(`Entry ${formMode === 'edit' ? 'updated' : 'recorded'} successfully.`)
    } catch (error) {
      console.error('Process: failed to submit entry', error)
      showNotification(error.message || 'Unable to save entry.', 'error')
    } finally {
      setSubmittingEntry(false)
    }
  }

  const handleEditEntry = (entry) => {
    setFormState({
      entity_code: entry.entity_code || '',
      account_code: entry.account_code || '',
      amount: entry.amount?.toString() || '',
      entry_type: entry.entry_type || 'debit',
      currency: entry.currency || selectedEntity?.currency || 'USD',
      entry_category: entry.entry_category || 'Manual Entry',
      counterparty: entry.counterparty || '',
      description: entry.description || '',
    })
    setFormMode('edit')
    setEditingEntry(entry)
  }

  const handleDeleteEntry = async (entry) => {
    if (!selectedCompany) return

    const confirmed = window.confirm(`Delete entry ${entry.account_code} for ${entry.entity_code}?`)
    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/process/entries/${entry.id}?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to delete entry')
      }

      showNotification('Entry deleted successfully.')
      await fetchEntries()
    } catch (error) {
      console.error('Process: failed to delete entry', error)
      showNotification(error.message || 'Unable to delete entry.', 'error')
    }
  }

  const handleUploadChange = (event) => {
    const file = event.target.files?.[0] || null
    setUploadState({ file, uploading: false, errors: [] })
  }

  const handleUploadSubmit = async () => {
    if (!selectedCompany || !uploadState.file) {
      showNotification('Please choose a file to import.', 'error')
      return
    }

    const formData = new FormData()
    formData.append('file', uploadState.file)
    formData.append('period', period)
    formData.append('year', year)

    const headers = authHeaders()
    delete headers['Content-Type']

    setUploadState((prev) => ({ ...prev, uploading: true, errors: [] }))
    try {
      const response = await fetch(
        `/api/process/entries/upload?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          headers,
          credentials: 'include',
          body: formData,
        }
      )

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Import failed')
      }

      cons
const errorCount = data.errors?.length || 0
      if (errorCount > 0) {
        showNotification(`Imported with ${errorCount} warning(s).`, 'error')
      } else {
        showNotification(`Imported ${data.inserted || 0} entries successfully.`)
      }

      await fetchEntries()
      setUploadState({ file: null, uploading: false, errors: data.errors || [] })
    } catch (error) {
      console.error('Process: upload error', error)
      showNotification(error.message || 'Failed to import file.', 'error')
      setUploadState((prev) => ({ ...prev, uploading: false }))
    }
  }

  const downloadTemplate = () => {
    const template = [
      ['entity_code', 'account_code', 'amount', 'entry_type', 'currency', 'entry_category', 'counterparty', 'description'],
      ['ENT_001', '1000', '120000', 'debit', 'USD', 'Manual Entry', '', 'Period adjustment'],
      ['ENT_002', '2000', '45000', 'credit', 'USD', 'Intercompany', 'ENT_010', 'Intercompany settlement'],
    ]

    const csvContent = template.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'process-import-template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const refreshAll = () => {
    fetchReferenceData()
    fetchEntries()
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-blue-600 dark:text-blue-300">
            <Layers className="h-4 w-4" />
            Process Workspace
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">Trial Balance Processing</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Record manual adjustments or import balances for {selectedCompany || 'your selected company'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {periodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            onClick={refreshAll}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Entries this period</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{summary.count}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Manual &amp; imported adjustments</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Total debits</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formattedCurrency(summary.total_debit, formState.currency || 'USD')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Captured against selected period</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Total credits</span>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-400">
            {formattedCurrency(summary.total_credit, formState.currency || 'USD')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Net balance {formattedCurrency(summary.net_balance, formState.currency || 'USD')}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formMode === 'edit' ? 'Edit entry' : 'Create manual entry'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Capture adjustments directly into the trial balance.
              </p>
            </div>
            {formMode === 'edit' && (
              <button
                onClick={resetForm}
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
              >
                <Plus className="h-4 w-4" />
                New entry
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitEntry} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Entity</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    value={formState.entity_code}
                    onChange={(e) => handleFormChange('entity_code', e.target.value)}
                    className="form-select pl-10"
                    required
                  >
                    <option value="" disabled>
                      Select entity
                    </option>
                    {referenceData.entities.map((entity) => (
                      <option key={entity.code} value={entity.code}>
                        {entity.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Account</label>
                <div className="relative">
                  <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    value={formState.account_code}
                    onChange={(e) => handleFormChange('account_code', e.target.value)}
                    className="form-select pl-10"
                    required
                  >
                    <option value="" disabled>
                      Select account
                    </option>
                    {referenceData.accounts.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="label">Entry type</label>
                <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
                  {['debit', 'credit'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleFormChange('entry_type', type)}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                        formState.entry_type === type
                          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      {type === 'debit' ? 'Debit' : 'Credit'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="label">Currency</label>
                <select
                  value={formState.currency || ''}
                  onChange={(e) => handleFormChange('currency', e.target.value)}
                  className="form-select"
                >
                  <option value="">Default ({selectedEntity?.currency || 'USD'})</option>
                  {[...(referenceData.currencies || []), 'USD', 'EUR', 'GBP'].map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  value={formState.entry_category}
                  onChange={(e) => handleFormChange('entry_category', e.target.value)}
                  className="form-select"
                >
                  {entryCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Counterparty (optional)</label>
                <input
                  type="text"
                  value={formState.counterparty}
                  onChange={(e) => handleFormChange('counterparty', e.target.value)}
                  className="form-input"
                  placeholder="Intercompany entity code"
                />
              </div>
            </div>

            <div>
              <label className="label">Narrative</label>
              <textarea
                value={formState.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                rows={3}
                className="form-input resize-none"
                placeholder="Add context for this entry"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {formMode === 'edit' && (
                <button type="button" onClick={resetForm} className="btn-secondary" disabled={submittingEntry}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={submittingEntry}>
                <Save className="h-4 w-4" />
                {submittingEntry ? 'Saving...' : formMode === 'edit' ? 'Save changes' : 'Add entry'}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk import</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Upload CSV or XLSX files using the standard template.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
            >
              <Download className="h-4 w-4" />
              Template
            </button>
          </div>

          <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-600 dark:bg-gray-800">
            <FileSpreadsheet className="mx-auto h-10 w-10 text-indigo-500" />
            <p className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200">
              Drag a CSV/XLSX file here, or click to browse.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Required columns: entity_code, account_code, amount. Optional: entry_type, currency, description.
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xlsm"
              onChange={handleUploadChange}
              className="mt-4 w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-100 dark:text-gray-300 dark:file:border-gray-600 dark:file:bg-gray-900 dark:file:text-gray-200"
            />
            {uploadState.file && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Selected file: <span className="font-medium">{uploadState.file.name}</span>
              </p>
            )}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleUploadSubmit}
                className="btn-primary inline-flex items-center gap-2"
                disabled={!uploadState.file || uploadState.uploading}
              >
                <Upload className="h-4 w-4" />
                {uploadState.uploading ? 'Importing...' : 'Import balances'}
              </button>
            </div>
            {uploadState.errors.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-400 bg-amber-50 p-3 text-left text-xs text-amber-700 dark:border-amber-500 dark:bg-amber-900/40 dark:text-amber-200">
                <p className="font-semibold">Import warnings:</p>
                <ul className="mt-1 space-y-1">
                  {uploadState.errors.slice(0, 5).map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                  {uploadState.errors.length > 5 && (
                    <li>• {uploadState.errors.length - 5} additional warning(s)...</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Processed entries</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {period} · {year} · {summary.count} record{summary.count === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchEntries}
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
          >
            <RefreshCw className={`h-4 w-4 ${loadingEntries ? 'animate-spin' : ''}`} />
            Refresh data
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="text-left">
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Entity</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Account</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Counterparty</th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Narrative</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loadingEntries ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading entries...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    No entries captured for {period} {year}. Use the form above or import a file to get started.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{entry.entity_code}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{entry.entity_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{entry.account_code}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{entry.account_name}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                      {formattedCurrency(entry.amount, entry.currency || 'USD')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          entry.entry_type === 'debit'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}
                      >
                        {entry.entry_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {entry.entry_category || 'Manual Entry'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {entry.counterparty || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {entry.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditEntry(entry)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                          title="Edit entry"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50"
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-lg ${
            notification.type === 'success'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-200'
              : 'border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-400 dark:bg-rose-900/30 dark:text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs uppercase tracking-wide">
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

export default Process
