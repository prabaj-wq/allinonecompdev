import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import {
  Activity,
  AlertCircle,
  Building2,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  FileSpreadsheet,
  FileText,
  History,
  LineChart,
  Loader2,
  PieChart,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  CalendarDays,
  Paperclip,
  Plus,
  Upload,
  X,
  BarChart3
} from 'lucide-react'
import { journalAPI } from '../services/api'

const CURRENT_YEAR = new Date().getFullYear()
const FISCAL_YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(String)
const PERIOD_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: `Period ${index + 1}`
}))
const SCENARIO_OPTIONS = ['actual', 'budget', 'forecast']

const DEFAULT_CATEGORY_META = [
  {
    id: 'manual_adjustments',
    name: 'Manual Adjustments',
    description: 'General manual adjustments and ad-hoc postings',
    icon: Edit3,
    color: 'bg-green-500'
  },
  {
    id: 'accruals',
    name: 'Accruals',
    description: 'Deferred expenses, revenue and other accruals',
    icon: Clock,
    color: 'bg-blue-500'
  },
  {
    id: 'depreciation',
    name: 'Depreciation',
    description: 'Asset depreciation and amortisation',
    icon: Settings,
    color: 'bg-orange-500'
  },
  {
    id: 'recurring',
    name: 'Recurring Entries',
    description: 'Recurring entries generated from templates',
    icon: RefreshCw,
    color: 'bg-indigo-500'
  },
  {
    id: 'intercompany',
    name: 'Intercompany',
    description: 'Intercompany eliminations and settlements',
    icon: Building2,
    color: 'bg-purple-500'
  },
  {
    id: 'fx_revaluation',
    name: 'FX Revaluation',
    description: 'Foreign currency revaluation adjustments',
    icon: FileSpreadsheet,
    color: 'bg-cyan-500'
  },
  {
    id: 'tax_adjustments',
    name: 'Tax Adjustments',
    description: 'Tax provisions and statutory adjustments',
    icon: FileText,
    color: 'bg-red-500'
  },
  {
    id: 'consolidation',
    name: 'Consolidation',
    description: 'Group consolidation and eliminations',
    icon: Settings,
    color: 'bg-violet-500'
  }
]

const NotificationBanner = ({ notification }) => {
  if (!notification) return null

  const tone = notification.type === 'error'
    ? 'bg-red-50 text-red-600 border-red-200'
    : 'bg-green-50 text-green-600 border-green-200'

  return (
    <div className={`flex items-center justify-between px-4 py-2 text-sm border rounded-md ${tone}`}>
      <span>{notification.message}</span>
      <button onClick={notification.onDismiss} className="text-xs font-semibold uppercase tracking-wide">
        Dismiss
      </button>
    </div>
  )
}

const StatusTimeline = ({ history }) => {
  if (!history.length) {
    return <p className="text-xs text-gray-500">No status events captured yet.</p>
  }

  return (
    <ol className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
      {history.map((event) => (
        <li key={`${event.status}-${event.changed_at}`} className="flex items-start gap-2">
          <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-200">{event.status}</p>
            <p className="text-[11px] text-gray-500">{event.changed_at}</p>
            {event.changed_by && (
              <p className="text-[11px] text-gray-500">By {event.changed_by}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

const formatCurrency = (value = 0) => {
  const amount = Number.isNaN(Number(value)) ? 0 : Number(value)
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const JournalEntry = () => {
  const [searchParams] = useSearchParams()
  const { selectedCompany } = useCompany()

  const processId = searchParams.get('processId')
  const defaultEntity = searchParams.get('entityId') || 'all'
  const defaultScenario = searchParams.get('scenarioId') || searchParams.get('scenario') || 'actual'
  const defaultFiscalYear = searchParams.get('year') || searchParams.get('yearId') || String(CURRENT_YEAR)
  const defaultPeriod = searchParams.get('period') || searchParams.get('periodId') || '1'
  const defaultCategory = searchParams.get('category') || 'manual_adjustments'

  const [categories, setCategories] = useState([])
  const [entities, setEntities] = useState([])
  const [accounts, setAccounts] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory)

  const [currentBatch, setCurrentBatch] = useState(null)
  const [lines, setLines] = useState([])
  const [attachments, setAttachments] = useState([])
  const [statusHistory, setStatusHistory] = useState([])
  const [validationResult, setValidationResult] = useState(null)
  const [onboardingChecklist, setOnboardingChecklist] = useState([])
  const [summaryMetrics, setSummaryMetrics] = useState(null)
  const [categoryTrend, setCategoryTrend] = useState([])
  const [periodVariance, setPeriodVariance] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [templateActionLoading, setTemplateActionLoading] = useState(false)
  const [uploadBatches, setUploadBatches] = useState([])
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ description: '', file: null })
  const [templatePreview, setTemplatePreview] = useState({ open: false, rows: [], metadata: null })
  const [highlights, setHighlights] = useState([])
  const [auditEvents, setAuditEvents] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [checklistProgress, setChecklistProgress] = useState({ completed: 0, total: 0 })
  const [lineSaving, setLineSaving] = useState(false)
  const [notification, setNotification] = useState(null)
  const [attachmentForm, setAttachmentForm] = useState({ description: '', metadata: '' })
  const attachmentInputRef = useRef(null)
  const uploadInputRef = useRef(null)

  const [batchLoading, setBatchLoading] = useState(false)

  const [context, setContext] = useState({
    entity: defaultEntity,
    scenario: defaultScenario,
    fiscalYear: defaultFiscalYear,
    period: defaultPeriod
  })

  const paramsWithCompany = useMemo(() => selectedCompany ? { company_name: selectedCompany } : null, [selectedCompany])
  const isReady = Boolean(paramsWithCompany)

  const scopedParams = useMemo(() => {
    if (!selectedCompany) return null
    const base = {
      company_name: selectedCompany,
      scenario: context.scenario,
      fiscal_year: context.fiscalYear,
      period: context.period,
    }
    if (context.entity !== 'all') {
      base.entity_id = context.entity
    }
    return base
  }, [context.entity, context.fiscalYear, context.period, context.scenario, selectedCompany])

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({
      message,
      type,
      onDismiss: () => setNotification(null)
    })
  }, [])

  useEffect(() => {
    const nextCategory = searchParams.get('category') || defaultCategory
    const nextContext = {
      entity: searchParams.get('entityId') || 'all',
      scenario: searchParams.get('scenarioId') || searchParams.get('scenario') || defaultScenario,
      fiscalYear: searchParams.get('year') || searchParams.get('yearId') || defaultFiscalYear,
      period: searchParams.get('period') || searchParams.get('periodId') || defaultPeriod
    }

    setContext((prev) => {
      if (
        prev.entity === nextContext.entity &&
        prev.scenario === nextContext.scenario &&
        prev.fiscalYear === nextContext.fiscalYear &&
        prev.period === nextContext.period
      ) {
        return prev
      }
      return nextContext
    })

    if (nextCategory !== selectedCategory) {
      setSelectedCategory(nextCategory)
    }
  }, [defaultCategory, defaultFiscalYear, defaultPeriod, defaultScenario, searchParams, selectedCategory])

  const loadCategories = useCallback(async () => {
    if (!isReady) return
    try {
      const { data } = await journalAPI.listCategories({ ...paramsWithCompany, include_inactive: false })
      setCategories(Array.isArray(data?.categories) ? data.categories : [])
    } catch (error) {
      console.error('Failed to load categories', error)
      setCategories([])
    }
  }, [isReady, paramsWithCompany])

  const loadEntities = useCallback(async () => {
    if (!selectedCompany) return
    try {
      const response = await fetch(`/api/axes-entity/elements?company_name=${selectedCompany}`)
      if (response.ok) {
        const data = await response.json()
        const mapped = (data.elements || []).map((entity) => ({
          code: entity.code || entity.entity_code,
          name: entity.name || entity.entity_name
        }))
        setEntities(mapped)
      }
    } catch (error) {
      console.error('Failed to load entities', error)
    }
  }, [selectedCompany])

  const loadAccounts = useCallback(async () => {
    if (!selectedCompany) return
    try {
      const response = await fetch(`/api/axes-account/elements?company_name=${selectedCompany}`)
      if (response.ok) {
        const data = await response.json()
        const mapped = (data.elements || []).map((account) => ({
          code: account.code,
          name: account.name
        }))
        setAccounts(mapped)
      }
    } catch (error) {
      console.error('Failed to load accounts', error)
    }
  }, [selectedCompany])

  const loadTemplates = useCallback(async (categoryId) => {
    if (!isReady) return
    try {
      const { data } = await journalAPI.listTemplates({ ...paramsWithCompany, category: categoryId })
      setTemplates(Array.isArray(data?.templates) ? data.templates : [])
    } catch (error) {
      console.error('Failed to load templates', error)
      setTemplates([])
    }
  }, [isReady, paramsWithCompany])

  const loadLines = useCallback(async (batchId) => {
    if (!batchId || !isReady) {
      setLines([])
      return
    }
    try {
      const { data } = await journalAPI.listLines(batchId, paramsWithCompany)
      const mapped = (data?.lines || []).map((line) => ({
        ...line,
        amount: line.amount ?? line.debit_amount ?? line.credit_amount ?? 0,
        isNew: false
      }))
      setLines(mapped)
    } catch (error) {
      console.error('Failed to load journal lines', error)
      setLines([])
    }
  }, [isReady, paramsWithCompany])

  const loadAttachments = useCallback(async (batchId) => {
    if (!batchId || !isReady) {
      setAttachments([])
      return
    }
    try {
      const { data } = await journalAPI.listAttachments({ ...paramsWithCompany, batch_id: batchId })
      setAttachments(Array.isArray(data?.attachments) ? data.attachments : [])
    } catch (error) {
      console.error('Failed to load attachments', error)
      setAttachments([])
    }
  }, [isReady, paramsWithCompany])

  const loadStatusHistory = useCallback(async (batchId) => {
    if (!batchId || !isReady) {
      setStatusHistory([])
      return
    }
    try {
      const { data } = await journalAPI.getBatchStatusTimeline(batchId, paramsWithCompany)
      setStatusHistory(Array.isArray(data?.status_history) ? data.status_history : [])
    } catch (error) {
      console.error('Failed to load status history', error)
      setStatusHistory([])
    }
  }, [isReady, paramsWithCompany])

  const loadOnboardingChecklist = useCallback(async () => {
    if (!isReady || !processId) {
      setOnboardingChecklist([])
      return
    }
    try {
      const { data } = await journalAPI.listOnboarding({
        ...paramsWithCompany,
        process_id: processId,
        entity_id: context.entity === 'all' ? undefined : context.entity,
        scenario_id: context.scenario,
        fiscal_year: context.fiscalYear,
        period: context.period
      })
      const items = Array.isArray(data?.checklists) ? data.checklists : []
      setOnboardingChecklist(items)
      const completed = items.filter((item) => item.completed).length
      setChecklistProgress({ completed, total: items.length })
    } catch (error) {
      console.error('Failed to load onboarding checklist', error)
      setOnboardingChecklist([])
      setChecklistProgress({ completed: 0, total: 0 })
    }
  }, [context.entity, context.fiscalYear, context.period, context.scenario, isReady, paramsWithCompany, processId])

  const loadReports = useCallback(async () => {
    if (!scopedParams) {
      setSummaryMetrics(null)
      setCategoryTrend([])
      setPeriodVariance([])
      return
    }
    setReportsLoading(true)
    try {
      const params = { ...scopedParams, category: selectedCategory }
      const [summaryRes, trendRes, varianceRes] = await Promise.all([
        journalAPI.getSummary(params),
        journalAPI.getCategoryTrend(params),
        journalAPI.getPeriodVariance(params)
      ])

      setSummaryMetrics(summaryRes.data?.summary || summaryRes.data || null)
      setCategoryTrend(Array.isArray(trendRes.data?.trend) ? trendRes.data.trend : trendRes.data?.data || [])
      setPeriodVariance(Array.isArray(varianceRes.data?.variances) ? varianceRes.data.variances : varianceRes.data?.data || [])
    } catch (error) {
      console.error('Failed to load reporting widgets', error)
      setSummaryMetrics(null)
      setCategoryTrend([])
      setPeriodVariance([])
    } finally {
      setReportsLoading(false)
    }
  }, [scopedParams, selectedCategory])

  const loadUploadBatches = useCallback(async () => {
    if (!scopedParams) {
      setUploadBatches([])
      return
    }
    setUploadLoading(true)
    try {
      const { data } = await journalAPI.listUploadBatches({ ...scopedParams, category: selectedCategory })
      setUploadBatches(Array.isArray(data?.upload_batches) ? data.upload_batches : data?.records || [])
    } catch (error) {
      console.error('Failed to load upload batches', error)
      setUploadBatches([])
    } finally {
      setUploadLoading(false)
    }
  }, [scopedParams, selectedCategory])

  const loadAuditTrail = useCallback(async () => {
    if (!currentBatch || !paramsWithCompany) {
      setAuditEvents([])
      return
    }
    setAuditLoading(true)
    try {
      const { data } = await journalAPI.getBatchAuditTrail(currentBatch.id, paramsWithCompany)
      setAuditEvents(Array.isArray(data?.events) ? data.events : [])
    } catch (error) {
      console.error('Failed to load audit events', error)
      setAuditEvents([])
    } finally {
      setAuditLoading(false)
    }
  }, [currentBatch, paramsWithCompany])

  const ensureBatch = useCallback(async () => {
    if (!isReady || !selectedCategory) return
    setBatchLoading(true)

    const filters = {
      ...paramsWithCompany,
      category: selectedCategory,
      entity_id: context.entity === 'all' ? undefined : context.entity,
      scenario_id: context.scenario,
      fiscal_year: context.fiscalYear,
      period: context.period,
      status: 'draft',
      page: 1,
      page_size: 1
    }

    try {
      const { data } = await journalAPI.listBatches(filters)
      let batchRecord = data?.batches?.[0]

      if (!batchRecord) {
        const payload = {
          description: `${selectedCategory} – ${new Date().toLocaleDateString()}`,
          process_id: processId,
          entity_id: context.entity === 'all' ? null : context.entity,
          scenario_id: context.scenario,
          fiscal_year: context.fiscalYear,
          period: context.period,
          category: selectedCategory,
          created_by: 'system'
        }
        const response = await journalAPI.createBatch(payload, paramsWithCompany)
        batchRecord = {
          ...payload,
          id: response.data?.batch_id,
          batch_number: response.data?.batch_number,
          workflow_status: 'draft'
        }
      }

      setCurrentBatch(batchRecord)
      await Promise.all([
        loadLines(batchRecord.id),
        loadAttachments(batchRecord.id),
        loadStatusHistory(batchRecord.id)
      ])
      await loadAuditTrail()
    } catch (error) {
      console.error('Failed to establish batch', error)
      showNotification('Unable to initialise journal batch. Please retry.', 'error')
    } finally {
      setBatchLoading(false)
    }
  }, [context.entity, context.fiscalYear, context.period, context.scenario, isReady, loadAttachments, loadLines, loadStatusHistory, paramsWithCompany, processId, selectedCategory, showNotification])

  useEffect(() => {
    if (!isReady) return
    loadUploadBatches()
  }, [context.entity, context.fiscalYear, context.period, context.scenario, isReady, loadUploadBatches])

  useEffect(() => {
    if (!currentBatch) return
    loadAuditTrail()
  }, [currentBatch, loadAuditTrail])

  useEffect(() => {
    if (!summaryMetrics && !categoryTrend.length && !periodVariance.length) {
      setHighlights([])
      return
    }

    const nextHighlights = []

    if (summaryMetrics) {
      nextHighlights.push({
        label: 'Net Impact',
        value: `₹${formatCurrency(summaryMetrics.net_impact)}`,
        tone: summaryMetrics.net_impact >= 0 ? 'positive' : 'negative',
        description: summaryMetrics.net_impact >= 0 ? 'Positive net movement this period' : 'Net outflow detected'
      })
      if (summaryMetrics.pending_approvals) {
        nextHighlights.push({
          label: 'Approvals Pending',
          value: summaryMetrics.pending_approvals,
          tone: 'warning',
          description: 'Batches awaiting reviewer action'
        })
      }
    }

    if (categoryTrend.length) {
      const latest = categoryTrend[categoryTrend.length - 1]
      if (latest) {
        nextHighlights.push({
          label: `Trend ${latest.fiscal_year}/P${latest.period}`,
          value: `₹${formatCurrency(latest.amount)}`,
          tone: latest.amount >= 0 ? 'positive' : 'negative',
          description: 'Latest category movement'
        })
      }
    }

    if (periodVariance.length) {
      const largestVariance = [...periodVariance].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))[0]
      if (largestVariance) {
        nextHighlights.push({
          label: largestVariance.metric || largestVariance.label,
          value: `₹${formatCurrency(largestVariance.variance)}`,
          tone: Math.abs(largestVariance.variance) > 0 ? 'warning' : 'neutral',
          description: 'Most material variance'
        })
      }
    }

    setHighlights(nextHighlights.slice(0, 4))
  }, [categoryTrend, periodVariance, summaryMetrics])

  const addLine = useCallback(() => {
    setLines((prev) => {
      const entityCode = context.entity !== 'all' ? context.entity : ''
      const entityName = entityCode ? (entities.find((ent) => ent.code === entityCode)?.name || '') : ''

      return [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          line_number: prev.length + 1,
          transaction_date: new Date().toISOString().split('T')[0],
          entity_code: entityCode,
          entity_name: entityName,
          account_debit_code: '',
          account_credit_code: '',
          amount: '',
          description: '',
          reference_number: '',
          custom_fields: {},
          isNew: true
        }
      ]
    })
  }, [context.entity, entities])

  const updateLineField = (lineId, field, value) => {
    setLines((prev) => prev.map((line) => {
      if (line.id !== lineId) return line
      const next = { ...line, [field]: value }
      if (field === 'account_debit_code') {
        const account = accounts.find((acc) => acc.code === value)
        next.account_debit_name = account?.name || ''
      }
      if (field === 'account_credit_code') {
        const account = accounts.find((acc) => acc.code === value)
        next.account_credit_name = account?.name || ''
      }
      if (field === 'entity_code') {
        const entity = entities.find((ent) => ent.code === value)
        next.entity_name = entity?.name || ''
      }
      return next
    }))
  }

  const removeLine = async (lineId) => {
    if (!currentBatch || !isReady) return
    const target = lines.find((line) => line.id === lineId)
    if (!target) return

    if (!target.isNew) {
      try {
        await journalAPI.deleteLine(currentBatch.id, target.id, paramsWithCompany)
      } catch (error) {
        console.error('Failed to delete journal line', error)
        showNotification('Unable to delete journal line. Please retry.', 'error')
        return
      }
    }

    setLines((prev) => prev.filter((line) => line.id !== lineId))
    showNotification('Journal line removed', 'success')
  }

  const persistLines = async () => {
    if (!currentBatch || !isReady) return
    setLineSaving(true)

    try {
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        const payload = {
          transaction_date: line.transaction_date,
          line_number: index + 1,
          entity_code: line.entity_code || null,
          entity_name: line.entity_name || null,
          account_debit_code: line.account_debit_code || null,
          account_credit_code: line.account_credit_code || null,
          amount: Number(line.amount || 0),
          description: line.description,
          reference_number: line.reference_number,
          custom_fields: line.custom_fields || {}
        }

        if (line.isNew) {
          const { data } = await journalAPI.createLine(currentBatch.id, {
            ...payload,
            created_by: 'system'
          }, paramsWithCompany)
          line.id = data?.line_id
          line.isNew = false
        } else {
          await journalAPI.updateLine(currentBatch.id, line.id, {
            ...payload,
            modified_by: 'system'
          }, paramsWithCompany)
        }
      }

      await loadLines(currentBatch.id)
      showNotification('Journal lines saved', 'success')
    } catch (error) {
      console.error('Failed to save journal lines', error)
      showNotification('Unable to save journal lines. Review inputs and retry.', 'error')
    } finally {
      setLineSaving(false)
    }
  }

  const runValidation = async () => {
    if (!currentBatch || !isReady) return
    try {
      const { data } = await journalAPI.validateBatch(currentBatch.id, {
        performed_by: 'system'
      }, paramsWithCompany)
      setValidationResult(data)
      showNotification(data?.is_valid ? 'Validation passed.' : 'Validation identified issues.', data?.is_valid ? 'success' : 'error')
      await loadAuditTrail()
    } catch (error) {
      console.error('Validation failed', error)
      showNotification('Validation failed. Check logs for details.', 'error')
    }
  }

  const submitBatch = async () => {
    if (!currentBatch || !isReady) return
    try {
      await journalAPI.submitBatch(currentBatch.id, {
        submitted_by: 'system',
        comments: 'Submitted from UI'
      }, paramsWithCompany)
      await loadStatusHistory(currentBatch.id)
      await loadAuditTrail()
      showNotification('Batch submitted for approval', 'success')
    } catch (error) {
      console.error('Submit failed', error)
      showNotification('Submit failed. Resolve validation gaps.', 'error')
    }
  }

  const approveBatch = async () => {
    if (!currentBatch || !isReady) return
    try {
      await journalAPI.approveBatch(currentBatch.id, {
        approved_by: 'system',
        comments: 'Approved from UI'
      }, paramsWithCompany)
      await loadStatusHistory(currentBatch.id)
      await loadAuditTrail()
      showNotification('Batch approved', 'success')
    } catch (error) {
      console.error('Approval failed', error)
      showNotification('Unable to approve. Check workflow configuration.', 'error')
    }
  }

  const postBatch = async () => {
    if (!currentBatch || !isReady) return
    try {
      await journalAPI.postBatch(currentBatch.id, {
        posted_by: 'system',
        comments: 'Posted from UI'
      }, paramsWithCompany)
      await loadStatusHistory(currentBatch.id)
      await loadAuditTrail()
      showNotification('Batch posted successfully', 'success')
    } catch (error) {
      console.error('Post failed', error)
      showNotification('Post failed. Ensure approvals and locks are satisfied.', 'error')
    }
  }

  const handleAttachmentTrigger = () => {
    if (!attachmentForm.description) {
      showNotification('Add a description before uploading an attachment.', 'error')
      return
    }
    attachmentInputRef.current?.click()
  }

  const uploadAttachment = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !currentBatch || !isReady) return

    try {
      await journalAPI.uploadAttachment({
        batch_id: currentBatch.id,
        description: attachmentForm.description,
        metadata: attachmentForm.metadata,
        uploaded_by: 'system',
        file
      }, paramsWithCompany)
      await loadAttachments(currentBatch.id)
      setAttachmentForm({ description: '', metadata: '' })
      showNotification('Attachment uploaded', 'success')
    } catch (error) {
      console.error('Attachment upload failed', error)
      showNotification('Unable to upload attachment. Try again.', 'error')
    } finally {
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = async (attachmentId) => {
    if (!isReady) return
    try {
      await journalAPI.deleteAttachment(attachmentId, paramsWithCompany)
      await loadAttachments(currentBatch.id)
      showNotification('Attachment removed', 'success')
    } catch (error) {
      console.error('Failed to remove attachment', error)
      showNotification('Unable to remove attachment.', 'error')
    }
  }

  const handleTemplateToggle = async (template) => {
    if (!scopedParams) return
    try {
      await journalAPI.toggleTemplate(template.id || template.template_id, {
        is_active: !template.is_active,
        toggled_by: 'system'
      }, scopedParams)
      showNotification(`Template ${!template.is_active ? 'enabled' : 'disabled'}`, 'success')
      await loadTemplates(selectedCategory)
    } catch (error) {
      console.error('Failed to toggle template', error)
      showNotification('Unable to update template status.', 'error')
    }
  }

  const handleTemplateApply = async (template) => {
    if (!currentBatch || !scopedParams) return
    setTemplateActionLoading(true)
    try {
      await journalAPI.applyTemplate(template.id || template.template_id, {
        batch_id: currentBatch.id,
        apply_mode: 'append'
      }, scopedParams)
      await loadLines(currentBatch.id)
      showNotification('Template applied to batch', 'success')
    } catch (error) {
      console.error('Failed to apply template', error)
      showNotification('Unable to apply template. Review configuration.', 'error')
    } finally {
      setTemplateActionLoading(false)
    }
  }

  const handleTemplateDuplicate = async (template) => {
    if (!scopedParams) return
    setTemplateActionLoading(true)
    try {
      const payload = {
        name: `${template.name || template.template_name} Copy`,
        description: template.description,
        category: template.category || selectedCategory,
        is_active: template.is_active,
        recurrence_rule: template.recurrence_rule,
        expiry_date: template.expiry_date
      }
      await journalAPI.createTemplate(payload, scopedParams)
      await loadTemplates(selectedCategory)
      showNotification('Template duplicated', 'success')
    } catch (error) {
      console.error('Failed to duplicate template', error)
      showNotification('Unable to duplicate template.', 'error')
    } finally {
      setTemplateActionLoading(false)
    }
  }

  const handleTemplateRecurring = async (template) => {
    if (!scopedParams) return
    setTemplateActionLoading(true)
    try {
      await journalAPI.generateRecurring({
        template_id: template.id || template.template_id,
        generate_for_period: context.period,
        generate_for_year: context.fiscalYear
      }, scopedParams)
      showNotification('Recurring journals generated', 'success')
    } catch (error) {
      console.error('Failed to generate recurring journals', error)
      showNotification('Unable to generate recurring journals.', 'error')
    } finally {
      setTemplateActionLoading(false)
    }
  }

  const handleUploadTrigger = () => {
    uploadInputRef.current?.click()
  }

  const handleUploadFileChange = (event) => {
    const file = event.target.files?.[0]
    setUploadForm((prev) => ({ ...prev, file }))
  }

  const handleUploadSubmit = async () => {
    if (!uploadForm.file || !scopedParams) {
      showNotification('Select a file before uploading.', 'error')
      return
    }
    setUploadLoading(true)
    try {
      await journalAPI.createUploadBatch({
        description: uploadForm.description,
        category: selectedCategory,
        file: uploadForm.file,
        initiated_by: 'system'
      }, scopedParams)
      setUploadForm({ description: '', file: null })
      if (uploadInputRef.current) uploadInputRef.current.value = ''
      await loadUploadBatches()
      showNotification('Upload batch created', 'success')
    } catch (error) {
      console.error('Failed to create upload batch', error)
      showNotification('Unable to upload batch. Try again.', 'error')
    } finally {
      setUploadLoading(false)
    }
  }

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, line) => sum + (line.account_debit_code ? Number(line.amount || 0) : 0), 0)
    const credit = lines.reduce((sum, line) => sum + (line.account_credit_code ? Number(line.amount || 0) : 0), 0)
    const diff = debit - credit
    return {
      debit,
      credit,
      diff,
      isBalanced: Math.abs(diff) < 0.01
    }
  }, [lines])

  const categoryMeta = useMemo(() => {
    const fromApi = categories.find((cat) => cat.category_code?.toLowerCase() === selectedCategory.toLowerCase())
    if (fromApi) {
      return {
        id: fromApi.category_code,
        name: fromApi.category_name,
        description: fromApi.description,
        icon: Settings,
        color: 'bg-blue-500',
        requiresAttachments: fromApi.requires_attachments
      }
    }
    return DEFAULT_CATEGORY_META.find((meta) => meta.id === selectedCategory) || DEFAULT_CATEGORY_META[0]
  }, [categories, selectedCategory])

  if (!isReady || (batchLoading && !currentBatch)) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-sm text-gray-600">Preparing journal workspace…</span>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <header className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Journal Categories</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Routing determines workflows, validations & guardrails</p>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {DEFAULT_CATEGORY_META.map((category) => {
            const Icon = category.icon
            const isActive = selectedCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-150 text-left ${isActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${category.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">{category.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{category.description}</p>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-blue-500" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Onboarding Checklist</h4>
          {checklistProgress.total > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>{checklistProgress.completed}/{checklistProgress.total} completed</span>
                <span>{Math.round((checklistProgress.completed / checklistProgress.total) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(checklistProgress.completed / checklistProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          {onboardingChecklist.length === 0 ? (
            <p className="text-xs text-gray-500">No checklist items configured.</p>
          ) : (
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
              {onboardingChecklist.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span>{item.title || `${item.period}/${item.fiscal_year}`}</span>
                  <CheckCircle className={`h-4 w-4 ${item.completed ? 'text-green-500' : 'text-gray-300'}`} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 space-y-4">
          {notification && <NotificationBanner notification={notification} />}

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">{categoryMeta.name}</span>
                {currentBatch?.workflow_status && (
                  <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600">Workflow: {currentBatch.workflow_status}</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Batch {currentBatch?.batch_number || 'Draft'}
              </h1>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><History className="h-3 w-3" />Process: {processId || 'Ad-hoc'}</span>
                <span>Entity: {context.entity}</span>
                <span>Scenario: {context.scenario}</span>
                <span>Period: {context.period}/{context.fiscalYear}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={persistLines}
                disabled={lineSaving}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {lineSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Draft
              </button>
              <button onClick={runValidation} className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Validate
              </button>
              <button onClick={submitBatch} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                <Check className="h-4 w-4 mr-2" />
                Submit
              </button>
              <button onClick={approveBatch} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </button>
              <button onClick={postBatch} className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-black">
                <Upload className="h-4 w-4 mr-2" />
                Post
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Entity</label>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <select
                  value={context.entity}
                  onChange={(e) => setContext((prev) => ({ ...prev, entity: e.target.value }))}
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                >
                  <option value="all">All Entities</option>
                  {entities.map((entity) => (
                    <option key={entity.code} value={entity.code}>
                      {entity.name} ({entity.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Scenario</label>
              <select
                value={context.scenario}
                onChange={(e) => setContext((prev) => ({ ...prev, scenario: e.target.value }))}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
              >
                {SCENARIO_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Fiscal Year</label>
              <select
                value={context.fiscalYear}
                onChange={(e) => setContext((prev) => ({ ...prev, fiscalYear: e.target.value }))}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
              >
                {FISCAL_YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Period</label>
              <select
                value={context.period}
                onChange={(e) => setContext((prev) => ({ ...prev, period: e.target.value }))}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
              >
                {PERIOD_OPTIONS.map((periodOption) => (
                  <option key={periodOption.value} value={periodOption.value}>{periodOption.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Journal Lines</h3>
              <button onClick={addLine} className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </button>
            </header>

            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              <div className="col-span-1">#</div>
              <div className="col-span-2">Debit Account</div>
              <div className="col-span-2">Credit Account</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-2">Entity</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1">Actions</div>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
              {lines.length === 0 && (
                <div className="p-6 text-sm text-gray-500">No journal lines yet. Add rows to get started.</div>
              )}
              {lines.map((line, index) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 p-4 text-sm">
                  <div className="col-span-1 flex items-center text-xs text-gray-500">{index + 1}</div>

                  <div className="col-span-2">
                    <select
                      value={line.account_debit_code || ''}
                      onChange={(e) => updateLineField(line.id, 'account_debit_code', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select debit account</option>
                      {accounts.map((account) => (
                        <option key={`debit-${account.code}`} value={account.code}>
                          {account.code} – {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <select
                      value={line.account_credit_code || ''}
                      onChange={(e) => updateLineField(line.id, 'account_credit_code', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select credit account</option>
                      {accounts.map((account) => (
                        <option key={`credit-${account.code}`} value={account.code}>
                          {account.code} – {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <input
                      type="number"
                      value={line.amount}
                      onChange={(e) => updateLineField(line.id, 'amount', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="col-span-2">
                    <select
                      value={line.entity_code || ''}
                      onChange={(e) => updateLineField(line.id, 'entity_code', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="">Select entity</option>
                      {entities.map((entity) => (
                        <option key={`entity-${entity.code}`} value={entity.code}>
                          {entity.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <input
                      type="text"
                      value={line.description || ''}
                      onChange={(e) => updateLineField(line.id, 'description', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                      placeholder="Description"
                    />
                    <input
                      type="text"
                      value={line.reference_number || ''}
                      onChange={(e) => updateLineField(line.id, 'reference_number', e.target.value)}
                      className="mt-2 w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-800"
                      placeholder="Reference"
                    />
                  </div>

                  <div className="col-span-1 flex items-center justify-end">
                    <button onClick={() => removeLine(line.id)} className="inline-flex items-center p-1 text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800/60">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-gray-600 dark:text-gray-300">Debits:
                  <span className="font-semibold text-gray-900 dark:text-white ml-1">₹{formatCurrency(totals.debit)}</span>
                </span>
                <span className="text-gray-600 dark:text-gray-300">Credits:
                  <span className="font-semibold text-gray-900 dark:text-white ml-1">₹{formatCurrency(totals.credit)}</span>
                </span>
                <span className={`flex items-center text-sm ${totals.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.isBalanced ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />Balanced
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-1" />Diff ₹{formatCurrency(Math.abs(totals.diff))}
                    </>
                  )}
                </span>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                {lines.length} lines • Batch {currentBatch?.batch_number || 'Draft'}
              </div>
            </footer>
          </section>

          {validationResult && (
            <section className={`border rounded-lg ${validationResult.is_valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} p-4 text-sm`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-semibold">Validation {validationResult.is_valid ? 'Passed' : 'Failed'}</span>
                </div>
                <span className="text-xs text-gray-500">{validationResult.validated_at}</span>
              </div>
              {validationResult.messages && validationResult.messages.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {validationResult.messages.map((message, idx) => (
                    <li key={idx}>{message}</li>
                  ))}
                </ul>
              ) : (
                <p>No warnings detected.</p>
              )}
            </section>
          )}

          <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <header className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Attachments</h3>
                {categoryMeta.requiresAttachments && (
                  <p className="text-[11px] text-red-500">Attachments required for this category.</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="hidden"
                  onChange={uploadAttachment}
                />
                <input
                  type="text"
                  value={attachmentForm.description}
                  onChange={(e) => setAttachmentForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Attachment description"
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                />
                <button
                  onClick={handleAttachmentTrigger}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs hover:bg-black"
                >
                  <Paperclip className="h-4 w-4 mr-2" />Upload
                </button>
              </div>
            </header>

            <div className="max-h-64 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
              {attachments.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No supporting documents added yet.</p>
              ) : (
                attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{attachment.filename}</p>
                      <p className="text-xs text-gray-500">{attachment.description}</p>
                    </div>
                    <button onClick={() => removeAttachment(attachment.id)} className="text-xs text-red-500 hover:text-red-600">
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 col-span-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <History className="h-4 w-4 text-blue-500" />Status Timeline
              </h3>
              <StatusTimeline history={statusHistory} />
              <div className="mt-3 text-[11px] text-gray-500 flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-amber-400" />Workflow updates auto-refresh after actions.
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Templates</h3>
              {templates.length === 0 ? (
                <p className="text-xs text-gray-500">No templates configured for this category.</p>
              ) : (
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                  {templates.map((template) => (
                    <li key={template.id} className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {template.is_active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                            {template.template_type || 'Manual'}
                          </span>
                          {template.recurrence_rule && (
                            <span className="text-[11px] text-indigo-500 uppercase">Recurring</span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-white truncate">{template.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{template.description}</p>
                        {template.expiry_date && (
                          <p className="text-[11px] text-amber-500 flex items-center gap-1 mt-1">
                            <CalendarDays className="h-3 w-3" />Expires {template.expiry_date}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTemplateToggle(template)}
                          className="inline-flex items-center px-2 py-1 rounded-md text-[11px] border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          {template.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleTemplateApply(template)}
                          className="inline-flex items-center px-2 py-1 rounded-md text-[11px] bg-indigo-600 text-white hover:bg-indigo-700"
                          disabled={templateActionLoading}
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => handleTemplateDuplicate(template)}
                          className="inline-flex items-center px-2 py-1 rounded-md text-[11px] border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                          disabled={templateActionLoading}
                        >
                          <Copy className="h-3 w-3 mr-1" />Duplicate
                        </button>
                        {template.recurrence_rule && (
                          <button
                            onClick={() => handleTemplateRecurring(template)}
                            className="inline-flex items-center px-2 py-1 rounded-md text-[11px] bg-blue-600 text-white hover:bg-blue-700"
                            disabled={templateActionLoading}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />Generate
                          </button>
                        )}
                        <button
                          onClick={() => setTemplatePreview({ open: true, rows: template.preview_rows || [], metadata: template })}
                          className="inline-flex items-center px-2 py-1 rounded-md text-[11px] border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <Activity className="h-3 w-3 mr-1" />Preview
                        </button>
                        {template.expiry_date && (
                          <span className="text-[10px] text-gray-400">Expires {template.expiry_date}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 col-span-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />Highlights
              </h3>
              {highlights.length === 0 ? (
                <p className="text-xs text-gray-500">Run a batch or load reports to surface momentum highlights.</p>
              ) : (
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                  {highlights.map((item, idx) => (
                    <li key={`${item.label}-${idx}`} className={`p-2 rounded-lg border ${item.tone === 'positive' ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20' : item.tone === 'negative' ? 'border-rose-200 bg-rose-50 dark:bg-rose-900/20' : item.tone === 'warning' ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 bg-gray-50 dark:bg-gray-800'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">{item.label}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">{item.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 col-span-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Summary Snapshot</h3>
                <PieChart className="h-4 w-4 text-blue-500" />
              </div>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-6 text-xs text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />Loading metrics…
                </div>
              ) : summaryMetrics ? (
                <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
                  <div>
                    <p className="uppercase text-[11px] text-gray-500">Net Impact</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">₹{formatCurrency(summaryMetrics.net_impact)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-[11px] uppercase text-gray-500">Debits</p>
                      <p className="text-sm font-semibold text-green-600">₹{formatCurrency(summaryMetrics.total_debits)}</p>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-[11px] uppercase text-gray-500">Credits</p>
                      <p className="text-sm font-semibold text-red-500">₹{formatCurrency(summaryMetrics.total_credits)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-gray-500">Open Approvals</p>
                    <p className="text-sm font-semibold">{summaryMetrics.pending_approvals || 0}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No summary metrics available for this selection.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 col-span-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Category Trend</h3>
                <LineChart className="h-4 w-4 text-emerald-500" />
              </div>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-6 text-xs text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />Loading trend…
                </div>
              ) : categoryTrend.length ? (
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                  {categoryTrend.map((item) => (
                    <li key={`${item.period}-${item.fiscal_year}`} className="flex items-center justify-between">
                      <span>{item.fiscal_year}/P{item.period}</span>
                      <span className={`font-semibold ${item.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>₹{formatCurrency(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">No trend data available.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 col-span-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Period Variance</h3>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </div>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-6 text-xs text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />Loading variance…
                </div>
              ) : periodVariance.length ? (
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                  {periodVariance.map((item, index) => (
                    <li key={`${item.metric}-${index}`} className="flex items-center justify-between">
                      <span className="truncate mr-2">{item.metric || item.label}</span>
                      <span className={`font-semibold ${item.variance >= 0 ? 'text-amber-600' : 'text-blue-600'}`}>₹{formatCurrency(item.variance)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">No variance metrics available.</p>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />Audit Activity
                </h3>
                <button
                  onClick={loadAuditTrail}
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />Refresh
                </button>
              </div>
              {auditLoading ? (
                <div className="flex items-center justify-center py-6 text-xs text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />Loading audit trail…
                </div>
              ) : auditEvents.length ? (
                <ol className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
                  {auditEvents.slice(0, 6).map((event, idx) => (
                    <li key={`${event.event_id || idx}-${event.timestamp}`} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-purple-500" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white truncate">{event.action || event.event_type}</span>
                          <span className="text-[10px] text-gray-400">{event.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{event.description || event.details || 'No additional context provided.'}</p>
                        {event.actor && (
                          <p className="text-[10px] text-gray-400 mt-1">By {event.actor}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-gray-500">No audit events recorded for this batch yet.</p>
              )}
              {auditEvents.length > 6 && (
                <div className="mt-3 text-[11px] text-blue-600">Showing latest 6 events</div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />Finish Onboarding
                </h3>
                <span className="text-[11px] text-gray-400">Guided tasks</span>
              </div>
              {onboardingChecklist.length === 0 ? (
                <p className="text-xs text-gray-500">Configure onboarding items in Admin → Journals to guide preparers.</p>
              ) : (
                <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
                  <p>Keep the team aligned by closing the remaining checklist items.</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>{checklistProgress.completed}/{checklistProgress.total} completed</span>
                      <span>{Math.round((checklistProgress.completed / checklistProgress.total) * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${(checklistProgress.completed / checklistProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {onboardingChecklist.slice(0, 4).map((item) => (
                      <li key={`callout-${item.id}`} className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${item.completed ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={`truncate ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{item.title || `${item.period}/${item.fiscal_year}`}</span>
                      </li>
                    ))}
                  </ul>
                  {onboardingChecklist.length > 4 && (
                    <p className="text-[11px] text-gray-400">+{onboardingChecklist.length - 4} more tasks</p>
                  )}
                  <button
                    onClick={() => showNotification('Onboarding management coming soon to this workspace.')} 
                    className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white rounded-md text-xs hover:bg-emerald-700"
                  >
                    Launch Onboarding Console
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Upload & Import Batches</h3>
                <p className="text-[11px] text-gray-500">Drop recurring uploads to stage journal lines in bulk.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={uploadInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleUploadFileChange}
                />
                <input
                  type="text"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Upload description"
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                />
                <button
                  onClick={handleUploadTrigger}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs hover:bg-black"
                >
                  <Upload className="h-4 w-4 mr-2" />Choose File
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={uploadLoading}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-60"
                >
                  {uploadLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Upload Batch
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700 text-xs">
              {uploadLoading && uploadBatches.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />Loading upload history…
                </div>
              ) : uploadBatches.length === 0 ? (
                <p className="p-4 text-gray-500">No upload batches available.</p>
              ) : (
                uploadBatches.map((batch) => (
                  <div key={batch.id || batch.upload_batch_id} className="flex items-center justify-between px-2 py-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{batch.description || batch.filename}</p>
                      <p className="text-[11px] text-gray-500">{batch.created_at} • {batch.status || 'pending'}</p>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {batch.total_records ? `${batch.total_records} rows` : '--'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {templatePreview.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{templatePreview.metadata?.name || 'Template Preview'}</h3>
                <p className="text-xs text-gray-500">Simulated journal lines generated by this template</p>
              </div>
              <button onClick={() => setTemplatePreview({ open: false, rows: [], metadata: null })} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {templatePreview.rows && templatePreview.rows.length ? (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="text-left px-4 py-2">Line</th>
                      <th className="text-left px-4 py-2">Entity</th>
                      <th className="text-left px-4 py-2">Debit</th>
                      <th className="text-left px-4 py-2">Credit</th>
                      <th className="text-left px-4 py-2">Amount</th>
                      <th className="text-left px-4 py-2">Narration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {templatePreview.rows.map((row, index) => (
                      <tr key={`${row.account_code}-${index}`} className="text-gray-700 dark:text-gray-300">
                        <td className="px-4 py-2">{row.line_number || index + 1}</td>
                        <td className="px-4 py-2">{row.entity_code || '—'}</td>
                        <td className="px-4 py-2">{row.account_debit_code || '—'}</td>
                        <td className="px-4 py-2">{row.account_credit_code || '—'}</td>
                        <td className="px-4 py-2">₹{formatCurrency(row.amount)}</td>
                        <td className="px-4 py-2">{row.description || row.narration || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-12 text-center text-sm text-gray-500">
                  No preview rows configured for this template yet.
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500">
              <span>Recurring rule: {templatePreview.metadata?.recurrence_rule || 'Manual trigger'}</span>
              <span>Expiry: {templatePreview.metadata?.expiry_date || 'None'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JournalEntry
