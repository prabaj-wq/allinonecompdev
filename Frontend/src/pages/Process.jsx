
import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  ArrowRight,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  Building2,
  Layers,
  Plus,
  Settings,
  X,
  ChevronRight,
  CirclePlus,
  Loader2,
  Tag,
  GitBranch,
  Shield,
  Repeat,
} from 'lucide-react'

const PROCESS_TYPES = ['Consolidation', 'Close', 'Forecast', 'Budget', 'Reporting', 'Operational']

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'sql_query', label: 'SQL Driven' },
]

const WORKFLOW_LIBRARY = [
  {
    type: 'original_input',
    title: 'Original Input',
    description: 'Ingest balances from flat files or connected sources.',
    icon: Upload,
  },
  {
    type: 'manual_entry',
    title: 'Manual Entry',
    description: 'Collect adjustments directly from process owners.',
    icon: Edit,
  },
  {
    type: 'excel',
    title: 'Excel Import / Export',
    description: 'Synchronise with spreadsheet templates for mass updates.',
    icon: FileSpreadsheet,
  },
  {
    type: 'journal_entries',
    title: 'Journal Entries',
    description: 'Generate and approve journals downstream.',
    icon: GitBranch,
  },
  {
    type: 'forms',
    title: 'Forms & Analytics',
    description: 'Design review forms and connect to dashboards.',
    icon: Settings,
  },
]

const getDefaultPeriod = () => {
  const now = new Date()
  return `Q${Math.floor(now.getMonth() / 3) + 1}`
}

const getDefaultYear = () => new Date().getFullYear().toString()

const normaliseCustomFieldList = (fields = []) =>
  (fields || [])
    .map((field, index) => {
      const fieldName = (field.field_name || field.name || '').trim() || `custom_${index + 1}`
      return {
        field_name: fieldName,
        field_label: (field.field_label || field.label || fieldName).trim(),
        field_type: (field.field_type || field.type || 'text').toLowerCase(),
        options: (field.options || field.dropdown_values || [])
          .filter((option) => option !== undefined && option !== null)
          .map((option) => (typeof option === 'string' ? option : String(option))),
        default_value: field.default_value ?? '',
        is_required: !!field.is_required,
        is_unique: !!field.is_unique,
        validation_rules: field.validation_rules || {},
        display_order: field.display_order ?? index,
        sql_query: field.sql_query || '',
      }
    })
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

const buildCustomFieldDefaults = (fields = []) => {
  const defaults = {}
  fields.forEach((field) => {
    if (field.default_value !== undefined && field.default_value !== null && field.default_value !== '') {
      defaults[field.field_name] = field.default_value
    }
  })
  return defaults
}

const createEmptyCustomField = (order = 0) => ({
  field_name: '',
  field_label: '',
  field_type: 'text',
  options: [],
  default_value: '',
  is_required: false,
  is_unique: false,
  validation_rules: {},
  display_order: order,
  sql_query: '',
})

const defaultFormState = {
  entity_code: '',
  account_code: '',
  amount: '',
  entry_type: 'debit',
  currency: '',
  entry_category: 'Manual Entry',
  counterparty: '',
  description: '',
  custom_fields: {},
}

const Process = () => {
  const { selectedCompany } = useCompany()
  const { isAuthenticated, getAuthHeaders } = useAuth()

  const [period, setPeriod] = useState(getDefaultPeriod())
  const [year, setYear] = useState(getDefaultYear())
  const [referenceData, setReferenceData] = useState({
    accounts: [],
    entities: [],
    currencies: [],
    accountHierarchies: [],
    entityHierarchies: [],
  })
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

  const [processes, setProcesses] = useState([])
  const [processLoading, setProcessLoading] = useState(false)
  const [selectedProcessId, setSelectedProcessId] = useState(null)
  const [processDrawerOpen, setProcessDrawerOpen] = useState(false)
  const [processDrawerMode, setProcessDrawerMode] = useState('create')
  const [processSubmitting, setProcessSubmitting] = useState(false)
  const [processForm, setProcessForm] = useState({ name: '', description: '', process_type: PROCESS_TYPES[0] })
  const [processDeletingId, setProcessDeletingId] = useState(null)

  const [entryDrawerOpen, setEntryDrawerOpen] = useState(false)
  const [entryDrawerMode, setEntryDrawerMode] = useState('create')

  const [customFieldPanelOpen, setCustomFieldPanelOpen] = useState(false)
  const [customFieldDraft, setCustomFieldDraft] = useState([])
  const [customFieldForm, setCustomFieldForm] = useState(null)
  const [customFieldEditingIndex, setCustomFieldEditingIndex] = useState(null)
  const [customFieldOptionsInput, setCustomFieldOptionsInput] = useState('')
  const [customFieldErrors, setCustomFieldErrors] = useState({})
  const [customFieldSaving, setCustomFieldSaving] = useState(false)
  const [workflowDraft, setWorkflowDraft] = useState([])
  const [restrictionDraft, setRestrictionDraft] = useState({
    accounts: { mode: 'all', allowed_codes: [] },
    entities: { mode: 'all', allowed_codes: [] },
  })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [rollforwardOpen, setRollforwardOpen] = useState(false)
  const [rollforwardForm, setRollforwardForm] = useState({
    source_period: getDefaultPeriod(),
    source_year: getDefaultYear(),
    target_period: getDefaultPeriod(),
    target_year: getDefaultYear(),
  })
  const [rollforwardSubmitting, setRollforwardSubmitting] = useState(false)
  const [accountRestrictionInput, setAccountRestrictionInput] = useState('')
  const [entityRestrictionInput, setEntityRestrictionInput] = useState('')
  const [accountHierarchySelection, setAccountHierarchySelection] = useState('')
  const [entityHierarchySelection, setEntityHierarchySelection] = useState('')

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const authHeaders = () => getAuthHeaders()

  const fetchProcesses = useCallback(async () => {
    if (!selectedCompany || !isAuthenticated) return
    setProcessLoading(true)
    try {
      const response = await fetch(
        `/api/process/catalog?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'GET',
          headers: authHeaders(),
          credentials: 'include',
        }
      )
      if (!response.ok) throw new Error(`Failed to load process catalog (${response.status})`)
      const data = await response.json()
      const catalogue = Array.isArray(data.processes) ? data.processes : []
      setProcesses(catalogue)
    } catch (error) {
      console.error('Process: failed to load processes', error)
      showNotification('Unable to load process catalog. Please try again.', 'error')
    } finally {
      setProcessLoading(false)
    }
  }, [selectedCompany, isAuthenticated])

  useEffect(() => {
    fetchProcesses()
  }, [fetchProcesses])

  useEffect(() => {
    if (!processes.length) {
      setSelectedProcessId(null)
      return
    }
    setSelectedProcessId((current) => {
      if (current && processes.some((process) => process.id === current)) {
        return current
      }
      return processes[0]?.id ?? null
    })
  }, [processes])

  useEffect(() => {
    if (!selectedCompany || !isAuthenticated) return
    const loadReferenceData = async () => {
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
          accountHierarchies: data.account_hierarchies || [],
          entityHierarchies: data.entity_hierarchies || [],
        })
      } catch (error) {
        console.error('Process: failed to load reference data', error)
        showNotification('Unable to load accounts and entities. Please try again.', 'error')
      } finally {
        setLoadingReference(false)
      }
    }

    loadReferenceData()
  }, [selectedCompany, isAuthenticated])

  const fetchEntries = useCallback(async () => {
    if (!selectedCompany || !isAuthenticated || !selectedProcessId) return
    setLoadingEntries(true)
    try {
      const response = await fetch(
        `/api/process/entries?company_name=${encodeURIComponent(selectedCompany)}&period=${encodeURIComponent(
          period
        )}&year=${encodeURIComponent(year)}&process_id=${selectedProcessId}`,
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
  }, [selectedCompany, isAuthenticated, selectedProcessId, period, year])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const activeProcess = useMemo(() => processes.find((process) => process.id === selectedProcessId) || null, [
    processes,
    selectedProcessId,
  ])

  useEffect(() => {
    if (!activeProcess) {
      setWorkflowDraft([])
      setRestrictionDraft({
        accounts: { mode: 'all', allowed_codes: [] },
        entities: { mode: 'all', allowed_codes: [] },
      })
      setAccountRestrictionInput('')
      setEntityRestrictionInput('')
      setAccountHierarchySelection('')
      setEntityHierarchySelection('')
      return
    }

    const currentWorkflow = (activeProcess.settings?.workflow || []).map((step, index) => ({
      id: step.id || step.type || `step_${index + 1}`,
      type: step.type || step.id || `custom_${index + 1}`,
      title: step.title || step.type || `Step ${index + 1}`,
      description: step.description || '',
      enabled: step.enabled !== false,
    }))
    setWorkflowDraft(currentWorkflow)

    const restrictions = activeProcess.settings?.restrictions || {}
    setRestrictionDraft({
      accounts: {
        mode: restrictions.accounts?.mode || 'all',
        allowed_codes: [...new Set(restrictions.accounts?.allowed_codes || [])],
      },
      entities: {
        mode: restrictions.entities?.mode || 'all',
        allowed_codes: [...new Set(restrictions.entities?.allowed_codes || [])],
      },
    })
    setAccountRestrictionInput('')
    setEntityRestrictionInput('')
    setAccountHierarchySelection('')
    setEntityHierarchySelection('')
  }, [activeProcess])

  useEffect(() => {
    setRollforwardForm((prev) => ({
      ...prev,
      target_period: period,
      target_year: year,
    }))
  }, [period, year])

  useEffect(() => {
    if (!activeProcess) {
      setRollforwardOpen(false)
    }
  }, [activeProcess])

  const activeCustomFields = useMemo(() => normaliseCustomFieldList(activeProcess?.custom_fields || []), [activeProcess])

  const periodOptions = useMemo(
    () => ['Q1', 'Q2', 'Q3', 'Q4', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    []
  )

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear()
    return Array.from({ length: 6 }).map((_, index) => (now - index).toString())
  }, [])

  const selectedAccount = useMemo(
    () => referenceData.accounts.find((account) => account.code === formState.account_code),
    [referenceData.accounts, formState.account_code]
  )

  const selectedEntity = useMemo(
    () => referenceData.entities.find((entity) => entity.code === formState.entity_code),
    [referenceData.entities, formState.entity_code]
  )

  const accountHierarchyOptions = useMemo(() => {
    return (referenceData.accountHierarchies || []).flatMap((hierarchy) =>
      (hierarchy.nodes || [])
        .filter((node) => (node.codes || []).length > 0)
        .map((node) => ({
          value: `${hierarchy.id}:${node.id}`,
          label: `${hierarchy.hierarchy_name || hierarchy.name} • ${node.name || node.code || 'Node'} (${(node.codes || []).length})`,
          codes: node.codes || [],
        }))
    )
  }, [referenceData.accountHierarchies])

  const entityHierarchyOptions = useMemo(() => {
    return (referenceData.entityHierarchies || []).flatMap((hierarchy) =>
      (hierarchy.nodes || [])
        .filter((node) => (node.codes || []).length > 0)
        .map((node) => ({
          value: `${hierarchy.id}:${node.id}`,
          label: `${hierarchy.hierarchy_name || hierarchy.name} • ${node.name || node.code || 'Node'} (${(node.codes || []).length})`,
          codes: node.codes || [],
        }))
    )
  }, [referenceData.entityHierarchies])

  useEffect(() => {
    if (selectedEntity && !formState.currency) {
      setFormState((prev) => ({
        ...prev,
        currency: selectedEntity.currency || 'USD',
      }))
    }
  }, [selectedEntity])

  const resetEntryForm = () => {
    setFormState({
      ...defaultFormState,
      currency: selectedEntity?.currency || 'USD',
      custom_fields: buildCustomFieldDefaults(activeCustomFields),
    })
    setFormMode('create')
    setEditingEntry(null)
    setEntryDrawerMode('create')
  }

  const openCreateEntryDrawer = () => {
    resetEntryForm()
    setEntryDrawerOpen(true)
  }

  const closeEntryDrawer = () => {
    setEntryDrawerOpen(false)
    resetEntryForm()
  }

  const handleFormChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCustomFieldChange = (fieldName, value) => {
    setFormState((prev) => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldName]: value,
      },
    }))
  }

  const handleSubmitEntry = async (event) => {
    event.preventDefault()

    if (!selectedCompany || !selectedProcessId) {
      showNotification('Please select a company and process first.', 'error')
      return
    }

    if (!formState.entity_code || !formState.account_code || !formState.amount) {
      showNotification('Please fill in all required fields before submitting.', 'error')
      return
    }

    const missingCustomField = activeCustomFields.find(
      (field) => field.is_required && (formState.custom_fields?.[field.field_name] ?? '') === ''
    )
    if (missingCustomField) {
      showNotification(`Custom field "${missingCustomField.field_label}" is required.`, 'error')
      return
    }

    const preparedCustomFields = {}
    activeCustomFields.forEach((field) => {
      const rawValue = formState.custom_fields?.[field.field_name]
      if (rawValue === undefined || rawValue === null || rawValue === '') return
      if (field.field_type === 'number') {
        preparedCustomFields[field.field_name] = Number(rawValue)
      } else if (field.field_type === 'boolean') {
        preparedCustomFields[field.field_name] = rawValue === true || rawValue === 'true'
      } else {
        preparedCustomFields[field.field_name] = rawValue
      }
    })

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
      custom_fields: preparedCustomFields,
    }

    const url =
      formMode === 'edit' && editingEntry
        ? `/api/process/entries/${editingEntry.id}?company_name=${encodeURIComponent(
            selectedCompany
          )}&process_id=${selectedProcessId}`
        : `/api/process/entries?company_name=${encodeURIComponent(selectedCompany)}&process_id=${selectedProcessId}`

    const method = formMode === 'edit' && editingEntry ? 'PUT' : 'POST'

    setSubmittingEntry(true)
    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const responseData = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to save entry')
      }

      await fetchEntries()
      resetEntryForm()
      setEntryDrawerOpen(false)
      showNotification(`Entry ${formMode === 'edit' ? 'updated' : 'recorded'} successfully.`)
    } catch (error) {
      console.error('Process: failed to submit entry', error)
      showNotification(error.message || 'Unable to save entry.', 'error')
    } finally {
      setSubmittingEntry(false)
    }
  }

  const handleEditEntry = (entry) => {
    const customDefaults = buildCustomFieldDefaults(activeCustomFields)
    const normalisedCustomFields = { ...customDefaults }
    const entryCustom = entry.custom_fields || {}
    activeCustomFields.forEach((field) => {
      const value = entryCustom[field.field_name]
      if (value === undefined || value === null) return
      if (field.field_type === 'boolean') {
        normalisedCustomFields[field.field_name] = value === true || value === 'true'
      } else {
        normalisedCustomFields[field.field_name] = field.field_type === 'number' ? String(value) : value
      }
    })

    setFormState({
      entity_code: entry.entity_code || '',
      account_code: entry.account_code || '',
      amount: entry.amount?.toString() || '',
      entry_type: entry.entry_type || 'debit',
      currency: entry.currency || selectedEntity?.currency || 'USD',
      entry_category: entry.entry_category || 'Manual Entry',
      counterparty: entry.counterparty || '',
      description: entry.description || '',
      custom_fields: normalisedCustomFields,
    })
    setFormMode('edit')
    setEntryDrawerMode('edit')
    setEditingEntry(entry)
    setEntryDrawerOpen(true)
  }

  const handleDeleteEntry = async (entry) => {
    if (!selectedCompany || !selectedProcessId) return

    const confirmed = window.confirm(`Delete entry ${entry.account_code} for ${entry.entity_code}?`)
    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/process/entries/${entry.id}?company_name=${encodeURIComponent(selectedCompany)}&process_id=${selectedProcessId}`,
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
    if (!selectedCompany || !selectedProcessId || !uploadState.file) {
      showNotification('Please choose a process and a file to import.', 'error')
      return
    }

    const formData = new FormData()
    formData.append('file', uploadState.file)
    formData.append('period', period)
    formData.append('year', year)

    const headers = { ...authHeaders() }
    delete headers['Content-Type']

    setUploadState((prev) => ({ ...prev, uploading: true, errors: [] }))
    try {
      const response = await fetch(
        `/api/process/entries/upload?company_name=${encodeURIComponent(selectedCompany)}&process_id=${selectedProcessId}`,
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
    const baseHeaders = [
      'entity_code',
      'entity_name',
      'account_code',
      'account_name',
      'amount',
      'entry_type',
      'currency',
      'entry_category',
      'counterparty',
      'description',
    ]
    const customHeaders = activeCustomFields.map((field) => field.field_name)
    const headers = [...baseHeaders, ...customHeaders]

    const sampleRow = [
      'ENT_001',
      'Primary Entity',
      '1000',
      'Cash',
      '125000',
      'debit',
      'USD',
      'Manual Entry',
      '',
      'Manual adjustment',
      ...customHeaders.map(() => ''),
    ]

    const csvContent = [headers, sampleRow].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${activeProcess?.name || 'process'}-template.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const refreshAll = () => {
    fetchProcesses()
    fetchEntries()
  }

  const openCreateProcessDrawer = () => {
    setProcessForm({ name: '', description: '', process_type: PROCESS_TYPES[0] })
    setProcessDrawerMode('create')
    setProcessDrawerOpen(true)
  }

  const openEditProcessDrawer = (processToEdit = activeProcess) => {
    if (!processToEdit) return
    setSelectedProcessId(processToEdit.id)
    setProcessForm({
      id: processToEdit.id,
      name: processToEdit.name || '',
      description: processToEdit.description || '',
      process_type: processToEdit.process_type || PROCESS_TYPES[0],
    })
    setProcessDrawerMode('edit')
    setProcessDrawerOpen(true)
  }

  const handleProcessSubmit = async (event) => {
    event.preventDefault()
    if (!selectedCompany) {
      showNotification('Select a company before managing processes.', 'error')
      return
    }

    if (!processForm.name.trim()) {
      showNotification('Process name is required.', 'error')
      return
    }

    const isEdit = processDrawerMode === 'edit' && processForm.id
    const endpoint = isEdit
      ? `/api/process/catalog/${processForm.id}?company_name=${encodeURIComponent(selectedCompany)}`
      : `/api/process/catalog?company_name=${encodeURIComponent(selectedCompany)}`

    const method = isEdit ? 'PUT' : 'POST'
    const body = isEdit
      ? {
          name: processForm.name.trim(),
          description: processForm.description || '',
          process_type: processForm.process_type,
        }
      : {
          name: processForm.name.trim(),
          description: processForm.description || '',
          process_type: processForm.process_type,
          custom_fields: [],
        }

    setProcessSubmitting(true)
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const responseData = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to save process')
      }

      await fetchProcesses()
      if (responseData.process?.id) {
        setSelectedProcessId(responseData.process.id)
      }
      setProcessDrawerOpen(false)
      showNotification(`Process ${isEdit ? 'updated' : 'created'} successfully.`)
    } catch (error) {
      console.error('Process: failed to save process definition', error)
      showNotification(error.message || 'Unable to save process.', 'error')
    } finally {
      setProcessSubmitting(false)
    }
  }

  const handleDeleteProcess = async (process) => {
    if (process.readonly) {
      showNotification('The default process cannot be deleted.', 'error')
      return
    }

    const confirmed = window.confirm(`Delete process "${process.name}"? All associated entries will be removed.`)
    if (!confirmed) return

    setProcessDeletingId(process.id)
    try {
      const response = await fetch(
        `/api/process/catalog/${process.id}?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'include',
        }
      )
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to delete process')
      }
      await fetchProcesses()
      showNotification(`Process "${process.name}" deleted.`)
    } catch (error) {
      console.error('Process: failed to delete process definition', error)
      showNotification(error.message || 'Unable to delete process.', 'error')
    } finally {
      setProcessDeletingId(null)
    }
  }

  const openCustomFieldPanel = () => {
    if (!activeProcess) return
    setCustomFieldDraft(normaliseCustomFieldList(activeProcess.custom_fields || []))
    setCustomFieldForm(null)
    setCustomFieldEditingIndex(null)
    setCustomFieldOptionsInput('')
    setCustomFieldErrors({})
    setCustomFieldPanelOpen(true)
  }

  const handleStartAddCustomField = () => {
    setCustomFieldForm(createEmptyCustomField(customFieldDraft.length))
    setCustomFieldEditingIndex(null)
    setCustomFieldOptionsInput('')
    setCustomFieldErrors({})
  }

  const handleStartEditCustomField = (field, index) => {
    setCustomFieldForm({ ...field, display_order: index })
    setCustomFieldEditingIndex(index)
    setCustomFieldOptionsInput((field.options || []).join(', '))
    setCustomFieldErrors({})
  }
  const validateCustomFieldForm = () => {
    if (!customFieldForm) return false
    const errors = {}
    if (!customFieldForm.field_name.trim()) {
      errors.field_name = 'Field key is required'
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(customFieldForm.field_name.trim())) {
      errors.field_name = 'Use letters, numbers, or underscores (cannot start with a number)'
    } else if (
      customFieldDraft.some(
        (field, index) =>
          field.field_name === customFieldForm.field_name.trim() && index !== customFieldEditingIndex
      )
    ) {
      errors.field_name = 'Field key must be unique'
    }

    if (!customFieldForm.field_label.trim()) {
      errors.field_label = 'Display label is required'
    }

    if (customFieldForm.field_type === 'select') {
      const options = customFieldOptionsInput
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean)
      if (!options.length) {
        errors.options = 'Provide at least one option for dropdown fields'
      }
    }

    setCustomFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveCustomFieldDraft = () => {
    if (!customFieldForm) return
    if (!validateCustomFieldForm()) return

    const options =
      customFieldForm.field_type === 'select'
        ? customFieldOptionsInput
            .split(',')
            .map((option) => option.trim())
            .filter(Boolean)
        : []

    const updatedField = {
      ...customFieldForm,
      field_name: customFieldForm.field_name.trim(),
      field_label: customFieldForm.field_label.trim(),
      options,
    }

    setCustomFieldDraft((prev) => {
      const next = [...prev]
      if (customFieldEditingIndex !== null && customFieldEditingIndex >= 0) {
        next[customFieldEditingIndex] = updatedField
      } else {
        next.push({ ...updatedField, display_order: prev.length })
      }
      return next.map((field, index) => ({ ...field, display_order: index }))
    })

    setCustomFieldForm(null)
    setCustomFieldEditingIndex(null)
    setCustomFieldOptionsInput('')
    setCustomFieldErrors({})
  }

  const handleRemoveCustomField = (index) => {
    setCustomFieldDraft((prev) => prev.filter((_, idx) => idx !== index).map((field, idx) => ({ ...field, display_order: idx })))
  }

  const handleSaveCustomFields = async () => {
    if (!activeProcess || !selectedCompany) return
    setCustomFieldSaving(true)
    try {
      const payload = {
        custom_fields: customFieldDraft.map((field, index) => ({
          field_name: field.field_name.trim(),
          field_label: field.field_label.trim(),
          field_type: field.field_type,
          options: field.field_type === 'select' ? field.options : [],
          default_value: field.default_value,
          is_required: !!field.is_required,
          is_unique: !!field.is_unique,
          validation_rules: field.validation_rules || {},
          display_order: index,
          sql_query: field.field_type === 'sql_query' ? field.sql_query : '',
        })),
      }

      const response = await fetch(
        `/api/process/catalog/${activeProcess.id}/custom-fields?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to update custom fields')
      }

      await fetchProcesses()
      await fetchEntries()
      setCustomFieldPanelOpen(false)
      showNotification('Custom field configuration saved successfully.')
    } catch (error) {
      console.error('Process: custom field save failed', error)
      showNotification(error.message || 'Unable to save custom fields.', 'error')
    } finally {
      setCustomFieldSaving(false)
    }
  }

  const handleRestrictionModeChange = (scope, mode) => {
    setRestrictionDraft((prev) => ({
      ...prev,
      [scope]: {
        ...prev[scope],
        mode,
        allowed_codes: mode === 'all' ? [] : prev[scope].allowed_codes,
      },
    }))

    if (mode === 'all') {
      if (scope === 'accounts') {
        setAccountRestrictionInput('')
        setAccountHierarchySelection('')
      } else {
        setEntityRestrictionInput('')
        setEntityHierarchySelection('')
      }
    }
  }

  const handleToggleRestrictionCode = (scope, code) => {
    if (!code) return
    setRestrictionDraft((prev) => {
      const current = new Set(prev[scope].allowed_codes || [])
      if (current.has(code)) {
        current.delete(code)
      } else {
        current.add(code)
      }
      return {
        ...prev,
        [scope]: {
          ...prev[scope],
          mode: current.size === 0 ? 'all' : 'restricted',
          allowed_codes: Array.from(current),
        },
      }
    })
  }

  const handleApplyHierarchySelection = (scope, optionValue, options) => {
    if (!optionValue) return
    const option = options.find((candidate) => candidate.value === optionValue)
    if (!option) return
    setRestrictionDraft((prev) => {
      const current = new Set(prev[scope].allowed_codes || [])
      option.codes.forEach((code) => current.add(code))
      return {
        ...prev,
        [scope]: {
          ...prev[scope],
          mode: 'restricted',
          allowed_codes: Array.from(current),
        },
      }
    })
  }

  const handleClearRestrictions = (scope) => {
    setRestrictionDraft((prev) => ({
      ...prev,
      [scope]: { mode: 'all', allowed_codes: [] },
    }))
    if (scope === 'accounts') {
      setAccountRestrictionInput('')
      setAccountHierarchySelection('')
    } else {
      setEntityRestrictionInput('')
      setEntityHierarchySelection('')
    }
  }

  const handleAddManualRestrictionCode = (scope, code) => {
    const trimmed = code.trim()
    if (!trimmed) return
    handleRestrictionModeChange(scope, 'restricted')
    handleToggleRestrictionCode(scope, trimmed.toUpperCase())
    if (scope === 'accounts') {
      setAccountRestrictionInput('')
    } else {
      setEntityRestrictionInput('')
    }
  }

  const handleAddWorkflowStep = (type) => {
    const libraryItem = WORKFLOW_LIBRARY.find((item) => item.type === type)
    const timestamp = Date.now()
    const identifier = `${type}_${timestamp}`
    setWorkflowDraft((prev) => [
      ...prev,
      {
        id: identifier,
        type,
        title: libraryItem?.title || type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
        description: libraryItem?.description || '',
        enabled: true,
      },
    ])
  }

  const handleRemoveWorkflowStep = (stepId) => {
    setWorkflowDraft((prev) => prev.filter((step) => step.id !== stepId))
  }

  const handleReorderWorkflowStep = (index, direction) => {
    setWorkflowDraft((prev) => {
      const next = [...prev]
      const newIndex = index + direction
      if (newIndex < 0 || newIndex >= next.length) {
        return next
      }
      const [moved] = next.splice(index, 1)
      next.splice(newIndex, 0, moved)
      return next
    })
  }

  const handleWorkflowToggle = (stepId) => {
    setWorkflowDraft((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? {
              ...step,
              enabled: !step.enabled,
            }
          : step
      )
    )
  }

  const handleWorkflowFieldChange = (stepId, field, value) => {
    setWorkflowDraft((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, [field]: value } : step))
    )
  }

  const handleSaveProcessSettings = async () => {
    if (!activeProcess || !selectedCompany) return
    setSettingsSaving(true)
    try {
      const payload = {
        workflow: workflowDraft,
        restrictions: restrictionDraft,
      }

      const response = await fetch(
        `/api/process/catalog/${activeProcess.id}/settings?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to update process settings')
      }

      const data = await response.json()
      if (data.process) {
        setProcesses((prev) => prev.map((process) => (process.id === data.process.id ? data.process : process)))
      }
      showNotification('Process settings saved successfully.')
    } catch (error) {
      console.error('Process: settings update failed', error)
      showNotification(error.message || 'Unable to save process settings.', 'error')
    } finally {
      setSettingsSaving(false)
    }
  }

  const openRollforwardModal = () => {
    setRollforwardForm((prev) => ({
      ...prev,
      target_period: period,
      target_year: year,
      source_period: prev.source_period || period,
      source_year: prev.source_year || year,
    }))
    setRollforwardOpen(true)
  }

  const closeRollforwardModal = () => {
    setRollforwardOpen(false)
  }

  const handleRollforwardChange = (field, value) => {
    setRollforwardForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitRollforward = async (event) => {
    event.preventDefault()
    if (!selectedCompany || !selectedProcessId) return
    setRollforwardSubmitting(true)
    try {
      const response = await fetch(`/api/process/entries/rollforward`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          process_id: selectedProcessId,
          company_name: selectedCompany,
          source_period: rollforwardForm.source_period,
          source_year: rollforwardForm.source_year,
          target_period: rollforwardForm.target_period,
          target_year: rollforwardForm.target_year,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to roll forward entries')
      }

      const result = await response.json()
      showNotification(`Rollforward complete: ${result.inserted} inserted, ${result.updated} updated.`)
      setRollforwardOpen(false)
      fetchEntries()
    } catch (error) {
      console.error('Process: rollforward failed', error)
      showNotification(error.message || 'Unable to roll forward entries.', 'error')
    } finally {
      setRollforwardSubmitting(false)
    }
  }

  const renderCustomFieldInput = (field) => {
    const value = formState.custom_fields?.[field.field_name]
    const label = field.field_label || field.field_name

    if (field.field_type === 'boolean') {
      const booleanValue = value === true || value === 'true'
      return (
        <div key={field.field_name} className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCustomFieldChange(field.field_name, true)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                booleanValue
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-gray-300 text-gray-600 hover:border-indigo-500 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleCustomFieldChange(field.field_name, false)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                booleanValue === false
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-gray-300 text-gray-600 hover:border-indigo-500 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              No
            </button>
          </div>
        </div>
      )
    }

    if (field.field_type === 'select') {
      return (
        <div key={field.field_name} className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor={`cf-${field.field_name}`}>
            {label}
          </label>
          <select
            id={`cf-${field.field_name}`}
            value={value ?? ''}
            onChange={(event) => handleCustomFieldChange(field.field_name, event.target.value)}
            className="form-select"
          >
            <option value="">Select</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (field.field_type === 'textarea') {
      return (
        <div key={field.field_name} className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor={`cf-${field.field_name}`}>
            {label}
          </label>
          <textarea
            id={`cf-${field.field_name}`}
            value={value ?? ''}
            onChange={(event) => handleCustomFieldChange(field.field_name, event.target.value)}
            rows={3}
            className="form-input resize-none"
          />
        </div>
      )
    }

    const inputType = field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'

    return (
      <div key={field.field_name} className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor={`cf-${field.field_name}`}>
          {label}
        </label>
        <input
          id={`cf-${field.field_name}`}
          type={inputType}
          value={value ?? ''}
          onChange={(event) => handleCustomFieldChange(field.field_name, event.target.value)}
          className="form-input"
        />
      </div>
    )
  }
  const processSummaryCards = (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Entries this period</span>
          <TrendingUp className="h-4 w-4" />
        </div>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{summary.count}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Across {activeProcess?.name || 'selected process'}</p>
        <button
          type="button"
          onClick={openRollforwardModal}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 transition hover:text-indigo-500 focus:outline-none dark:text-indigo-300"
        >
          <Repeat className="h-3.5 w-3.5" />
          Rollforward entries
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Original input balance</span>
          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
          Debits {new Intl.NumberFormat('en-US', { style: 'currency', currency: formState.currency || 'USD' }).format(summary.total_debit || 0)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Credits {new Intl.NumberFormat('en-US', { style: 'currency', currency: formState.currency || 'USD' }).format(summary.total_credit || 0)}
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Net balance {new Intl.NumberFormat('en-US', { style: 'currency', currency: formState.currency || 'USD' }).format(summary.net_balance || 0)}
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
          Period {period} {year}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Workflow canvas</span>
          <GitBranch className="h-4 w-4 text-indigo-500" />
        </div>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{workflowDraft.length || 1} steps</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Design how data flows from input to reporting.</p>
        <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
          {workflowDraft.slice(0, 3).map((step) => (
            <span
              key={step.id}
              className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200"
            >
              {step.title || step.type}
            </span>
          ))}
          {workflowDraft.length > 3 && <span className="text-indigo-400 dark:text-indigo-300">+{workflowDraft.length - 3} more</span>}
        </div>
      </div>
    </section>
  )

  return (
    <div className="space-y-6">

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Process Catalogue</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create dedicated workspaces for each close, forecast, or operational process you manage.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateProcessDrawer}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>
      </section>

      {processLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 p-8 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading processes...
        </div>
      ) : processes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No processes yet. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {processes.map((process) => {
            const isActive = process.id === selectedProcessId
            return (
              <div
                key={process.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-indigo-500 ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm dark:border-indigo-400 dark:bg-indigo-900/30'
                    : 'border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedProcessId(process.id)}
                  className="flex w-full flex-1 items-start justify-between gap-4 text-left"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200">
                        <Layers className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">{process.name}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 font-medium dark:bg-indigo-900/40">
                            {process.process_type || 'Process'}
                          </span>
                          {process.readonly && <span className="text-[11px] text-gray-500 dark:text-gray-400">Default workspace</span>}
                        </div>
                      </div>
                    </div>
                    {process.description ? (
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{process.description}</p>
                    ) : (
                      <p className="mt-2 text-xs italic text-gray-400 dark:text-gray-500">Add a description to guide your team.</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{process.entry_count || 0} entries</span>
                      {process.last_updated_at && <span>Updated {new Date(process.last_updated_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <ChevronRight
                    className={`mt-1 h-4 w-4 flex-shrink-0 text-indigo-400 transition ${
                      isActive ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </button>
                {!process.readonly && (
                  <div
                    className={`pointer-events-auto absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/70 p-1 shadow-sm transition dark:bg-gray-950/70 ${
                      processDeletingId === process.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProcessId(process.id)
                        openEditProcessDrawer(process)
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
                      title="Edit process details"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={processDeletingId === process.id}
                      onClick={() => handleDeleteProcess(process)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-900/40"
                      title="Delete process"
                    >
                      {processDeletingId === process.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {entryDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-gray-900/40" onClick={closeEntryDrawer} />
          <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {entryDrawerMode === 'edit' ? 'Edit process entry' : 'Create process entry'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fields marked with * are mandatory.</p>
              </div>
              <button
                type="button"
                onClick={closeEntryDrawer}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form onSubmit={handleSubmitEntry} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Entity *</label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        value={formState.entity_code}
                        onChange={(event) => handleFormChange('entity_code', event.target.value)}
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
                    <label className="label">Account *</label>
                    <div className="relative">
                      <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        value={formState.account_code}
                        onChange={(event) => handleFormChange('account_code', event.target.value)}
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
                    <label className="label">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formState.amount}
                      onChange={(event) => handleFormChange('amount', event.target.value)}
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
                      onChange={(event) => handleFormChange('currency', event.target.value)}
                      className="form-select"
                    >
                      <option value="">Default ({selectedEntity?.currency || 'USD'})</option>
                      {[...(referenceData.currencies || []), 'USD', 'EUR', 'GBP']
                        .filter((value, index, self) => self.indexOf(value) === index)
                        .map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <input
                      type="text"
                      value={formState.entry_category}
                      onChange={(event) => handleFormChange('entry_category', event.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="label">Counterparty</label>
                    <input
                      type="text"
                      value={formState.counterparty}
                      onChange={(event) => handleFormChange('counterparty', event.target.value)}
                      className="form-input"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {activeCustomFields.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Custom attributes</h4>
                    <div className="grid gap-4">
                      {activeCustomFields.map((field) => (
                        <React.Fragment key={field.field_name}>{renderCustomFieldInput(field)}</React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Narrative</label>
                  <textarea
                    value={formState.description}
                    onChange={(event) => handleFormChange('description', event.target.value)}
                    rows={3}
                    className="form-input resize-none"
                    placeholder="Add context for this entry"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={closeEntryDrawer} className="btn-secondary" disabled={submittingEntry}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={submittingEntry}>
                    <Save className="h-4 w-4" />
                    {submittingEntry ? 'Saving...' : entryDrawerMode === 'edit' ? 'Save changes' : 'Add entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {processDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setProcessDrawerOpen(false)} />
          <div className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {processDrawerMode === 'edit' ? 'Edit process' : 'Create new process'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Define the metadata for this process workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProcessDrawerOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleProcessSubmit} className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={processForm.name}
                  onChange={(event) => setProcessForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={processForm.description}
                  onChange={(event) => setProcessForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="form-input resize-none"
                  placeholder="Optional contextual description"
                />
              </div>
              <div>
                <label className="label">Process type</label>
                <select
                  value={processForm.process_type}
                  onChange={(event) => setProcessForm((prev) => ({ ...prev, process_type: event.target.value }))}
                  className="form-select"
                >
                  {PROCESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setProcessDrawerOpen(false)} disabled={processSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={processSubmitting}>
                  <Save className="h-4 w-4" />
                  {processSubmitting ? 'Saving...' : processDrawerMode === 'edit' ? 'Save changes' : 'Create process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {customFieldPanelOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setCustomFieldPanelOpen(false)} />
          <div className="ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom fields</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Extend this process with tailored dimensions and filters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomFieldPanelOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="max-w-md text-sm text-gray-600 dark:text-gray-400">
                  Custom fields are immediately available on entry forms, imports, and exports. Use them to mirror Tagetik-style attribute modelling.
                </div>
                <button
                  type="button"
                  onClick={handleStartAddCustomField}
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:border-indigo-400 hover:text-indigo-700 dark:border-indigo-400/40 dark:text-indigo-300 dark:hover:border-indigo-400"
                >
                  <CirclePlus className="h-4 w-4" />
                  Add field
                </button>
              </div>

              <div className="space-y-3">
                {customFieldDraft.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    No custom fields configured yet.
                  </div>
                ) : (
                  customFieldDraft.map((field, index) => (
                    <div
                      key={field.field_name}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{field.field_label}</span>
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200">
                              {field.field_type}
                            </span>
                            {field.is_required && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Key: {field.field_name}</p>
                          {field.field_type === 'select' && field.options.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Options: {field.options.join(', ')}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEditCustomField(field, index)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-blue-900/40"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(index)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm hover:bg-rose-50 dark:bg-gray-900 dark:text-rose-300 dark:hover:bg-rose-900/40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {customFieldForm && (
                <div className="mt-6 rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm dark:border-indigo-400/40 dark:bg-indigo-950/30">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {customFieldEditingIndex !== null ? 'Edit custom field' : 'New custom field'}
                  </h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-1">
                      <label className="label">Field key *</label>
                      <input
                        type="text"
                        value={customFieldForm.field_name}
                        onChange={(event) =>
                          setCustomFieldForm((prev) => ({ ...prev, field_name: event.target.value }))
                        }
                        className="form-input"
                        disabled={customFieldEditingIndex !== null}
                      />
                      {customFieldErrors.field_name && (
                        <p className="mt-1 text-xs text-rose-500">{customFieldErrors.field_name}</p>
                      )}
                    </div>
                    <div className="md:col-span-1">
                      <label className="label">Display label *</label>
                      <input
                        type="text"
                        value={customFieldForm.field_label}
                        onChange={(event) =>
                          setCustomFieldForm((prev) => ({ ...prev, field_label: event.target.value }))
                        }
                        className="form-input"
                      />
                      {customFieldErrors.field_label && (
                        <p className="mt-1 text-xs text-rose-500">{customFieldErrors.field_label}</p>
                      )}
                    </div>
                    <div className="md:col-span-1">
                      <label className="label">Field type</label>
                      <select
                        value={customFieldForm.field_type}
                        onChange={(event) =>
                          setCustomFieldForm((prev) => ({ ...prev, field_type: event.target.value }))
                        }
                        className="form-select"
                      >
                        {FIELD_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-1">
                      <label className="label">Default value</label>
                      <input
                        type="text"
                        value={customFieldForm.default_value}
                        onChange={(event) =>
                          setCustomFieldForm((prev) => ({ ...prev, default_value: event.target.value }))
                        }
                        className="form-input"
                        placeholder="Optional"
                      />
                    </div>
                    {customFieldForm.field_type === 'select' && (
                      <div className="md:col-span-2">
                        <label className="label">Dropdown options *</label>
                        <input
                          type="text"
                          value={customFieldOptionsInput}
                          onChange={(event) => setCustomFieldOptionsInput(event.target.value)}
                          className="form-input"
                          placeholder="Comma separated list"
                        />
                        {customFieldErrors.options && (
                          <p className="mt-1 text-xs text-rose-500">{customFieldErrors.options}</p>
                        )}
                      </div>
                    )}
                    {customFieldForm.field_type === 'sql_query' && (
                      <div className="md:col-span-2">
                        <label className="label">SQL query</label>
                        <textarea
                          value={customFieldForm.sql_query}
                          onChange={(event) =>
                            setCustomFieldForm((prev) => ({ ...prev, sql_query: event.target.value }))
                          }
                          rows={3}
                          className="form-input resize-none"
                          placeholder="Optional SQL statement returning value and label"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 md:col-span-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={customFieldForm.is_required}
                          onChange={(event) =>
                            setCustomFieldForm((prev) => ({ ...prev, is_required: event.target.checked }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Required at entry
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomFieldForm(null)
                        setCustomFieldEditingIndex(null)
                        setCustomFieldOptionsInput('')
                        setCustomFieldErrors({})
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="button" onClick={handleSaveCustomFieldDraft} className="btn-primary inline-flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {customFieldEditingIndex !== null ? 'Update field' : 'Add field'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
              <div className="flex items-center justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setCustomFieldPanelOpen(false)}>
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomFields}
                  className="btn-primary inline-flex items-center gap-2"
                  disabled={customFieldSaving}
                >
                  <Save className="h-4 w-4" />
                  {customFieldSaving ? 'Saving...' : 'Save configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
