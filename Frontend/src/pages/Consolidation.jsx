import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Link as LinkIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  FileText,
  BarChart3,
  Calculator,
  Settings,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Database,
  PieChart,
  TrendingUp,
  Users,
  Globe,
  Shield,
  FileSpreadsheet,
  Calendar,
  Minus,
  X,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  AlertOctagon,
  FileCheck,
  FileX,
  History,
  Zap
} from 'lucide-react'
import ConsolidationService from '../services/consolidationService'
import { useCompany } from '../contexts/CompanyContext'

const Consolidation = () => {
  const { selectedCompany, entities: contextEntities, ifrsAccounts: contextAccounts } = useCompany()
  const [isLoading, setIsLoading] = useState(false)
  const [entities, setEntities] = useState([])
  const [ifrsAccounts, setIfrsAccounts] = useState([])
  const [consolidationData, setConsolidationData] = useState(null)
  const [icItems, setIcItems] = useState([])
  const [journals, setJournals] = useState([])
  const [ownerships, setOwnerships] = useState([])
  const [rollforwardAccounts, setRollforwardAccounts] = useState([])
  const [fstTemplates, setFstTemplates] = useState([])
  const [consolidationStatus, setConsolidationStatus] = useState('idle')
  const [selectedEntities, setSelectedEntities] = useState([])
  const [consolidationResults, setConsolidationResults] = useState(null)
  const [consolidatedFinancials, setConsolidatedFinancials] = useState([])
  const [selectedTemplates, setSelectedTemplates] = useState(['balance-sheet', 'income-statement', 'cash-flow'])
  const [showAddEntity, setShowAddEntity] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPeriod, setSelectedPeriod] = useState('December')
  const [selectedYear, setSelectedYear] = useState('2024')
  
  // Notification system
  const [notifications, setNotifications] = useState([])
  const [newEntity, setNewEntity] = useState({
    name: '',
    type: 'subsidiary',
    ownership: 100,
    country: '',
    currency: 'USD'
  })
  
  // IC Transaction related state
  const [showAddICTransaction, setShowAddICTransaction] = useState(false)
  const [entityFilter, setEntityFilter] = useState('')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [newICTransaction, setNewICTransaction] = useState({
    entity_id: '',
    counterparty_id: '',
    entity_account_id: '',
    counterparty_account_id: '',
    transaction_category: '',
    description: '',
    debit_amount: '',
    credit_amount: '',
    currency: 'USD',
    transaction_date: new Date().toISOString().split('T')[0],
    period: selectedPeriod,
    year: selectedYear,
    elimination: 'no'
  })

  // Consolidation Journal related state
  const [showAddJournalModal, setShowAddJournalModal] = useState(false)
  
  // Additional Rules related state
  const [additionalRules, setAdditionalRules] = useState([])
  const [showAddRuleModal, setShowAddRuleModal] = useState(false)
  const [showEditRuleModal, setShowEditRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    rule_type: 'reclassify',
    conditions: [{ field: 'account_code', operator: 'equals', value: '' }],
    actions: [{ type: 'reclassify', to_account: '', amount: '', description: '' }],
    priority: 1,
    is_active: true
  })
  const [simulationResults, setSimulationResults] = useState(null)
  const [showSimulationModal, setShowSimulationModal] = useState(false)
  const [ruleTemplates] = useState(ConsolidationService.getRuleTemplates())
  const [conditionOperators] = useState(ConsolidationService.getConditionOperators())
  const [conditionFields] = useState(ConsolidationService.getConditionFields())
  const [actionTypes] = useState(ConsolidationService.getActionTypes())

  // Enhanced Ownership related state
  const [showAddOwnershipModal, setShowAddOwnershipModal] = useState(false)
  const [showEditOwnershipModal, setShowEditOwnershipModal] = useState(false)
  const [editingOwnership, setEditingOwnership] = useState(null)
  const [newOwnership, setNewOwnership] = useState({
    parentEntity: '',
    subsidiaryEntity: '',
    ownershipPercentage: '',
    fairValueNetAssets: '',
    purchaseConsideration: '',
    goodwillMethod: 'Partial',
    relationshipType: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    nciPercentage: '',
    nciValue: '',
    goodwillValue: ''
  })

  // Roll Forward related state
  const [showAddRollforwardModal, setShowAddRollforwardModal] = useState(false)
  const [showEditRollforwardModal, setShowEditRollforwardModal] = useState(false)
  const [editingRollforward, setEditingRollforward] = useState(null)
  const [newRollforward, setNewRollforward] = useState({
    entity_id: '',
    account_id: '',
    previous_period: '',
    previous_year: '',
    opening_balance: '',
    movements: '',
    adjustments: '',
    eliminations: '',
    closing_balance: '',
    status: 'pending',
    notes: '',
    effective_date: new Date().toISOString().split('T')[0]
  })

  // Debug function to log accounts when modal opens
  const openAddJournalModal = () => {
    console.log('🔍 Opening journal modal with accounts:', ifrsAccounts)
    console.log('🔍 Account structure sample:', ifrsAccounts[0] || 'No accounts')
    console.log('🔍 Total accounts available:', ifrsAccounts.length)
    console.log('🔍 First 3 accounts:', ifrsAccounts.slice(0, 3))
    setShowAddJournalModal(true)
  }
  
  // Notification functions
  const addNotification = (message, type = 'success') => {
    const id = Date.now()
    const notification = { id, message, type, timestamp: new Date() }
    setNotifications(prev => [...prev, notification])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id)
    }, 5000)
  }
  
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  const [showEditJournalModal, setShowEditJournalModal] = useState(false)
  const [editingJournal, setEditingJournal] = useState(null)
  const [journalFilters, setJournalFilters] = useState({
    account: '',
    entity: '',
    date: '',
    description: '',
    status: ''
  })
  const [newJournal, setNewJournal] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    period: selectedPeriod,
    year: selectedYear,
    debitEntries: [],
    creditEntries: []
  })

  // Use CompanyContext data when available - this should take priority
  useEffect(() => {
    if (contextEntities && contextEntities.length > 0) {
      console.log('📊 Consolidation: Using CompanyContext entities:', contextEntities.length)
      setEntities(contextEntities)
    }
  }, [contextEntities])

  useEffect(() => {
    if (contextAccounts && contextAccounts.length > 0) {
      console.log('📊 Consolidation: Using CompanyContext accounts:', contextAccounts.length)
      console.log('🔍 CompanyContext accounts sample:', contextAccounts[0] || 'None')
      setIfrsAccounts(contextAccounts)
    }
  }, [contextAccounts])

  // Force update when CompanyContext data is available
  useEffect(() => {
    if (contextEntities && contextEntities.length > 0 && entities.length === 0) {
      console.log('🔄 Consolidation: Forcing entities update from CompanyContext')
      setEntities(contextEntities)
    }
  }, [contextEntities, entities.length])

  useEffect(() => {
    if (contextAccounts && contextAccounts.length > 0 && ifrsAccounts.length === 0) {
      console.log('🔄 Consolidation: Forcing accounts update from CompanyContext')
      setIfrsAccounts(contextAccounts)
    }
  }, [contextAccounts, ifrsAccounts.length])

  // Sync with Process module - get current period and year
  useEffect(() => {
    const syncWithProcessModule = () => {
      // Get current period and year from localStorage (Process module stores this)
      const processPeriod = localStorage.getItem('currentPeriod') || selectedPeriod
      const processYear = localStorage.getItem('currentYear') || selectedYear
      
      if (processPeriod !== selectedPeriod || processYear !== selectedYear) {
        setSelectedPeriod(processPeriod)
        setSelectedYear(processYear)
        // Update IC transaction form with new period/year
        setNewICTransaction(prev => ({
          ...prev,
          period: processPeriod,
          year: processYear
        }))
      }
      
      // Also sync with Process module's current entity and counterparty
      const processEntity = localStorage.getItem('currentEntity')
      const processCounterparty = localStorage.getItem('currentCounterparty')
      
      if (processEntity) {
        setNewICTransaction(prev => ({
          ...prev,
          entity_id: processEntity
        }))
      }
      
      if (processCounterparty) {
        setNewICTransaction(prev => ({
          ...prev,
          counterparty_id: processCounterparty
        }))
      }
      
      if (processEntity && processCounterparty) {
        console.log('🔄 Syncing with Process module:', { processEntity, processCounterparty, processPeriod, processYear })
      }
    }

    // Check for updates every 5 seconds
    const interval = setInterval(syncWithProcessModule, 5000)
    
    // Initial sync
    syncWithProcessModule()
    
    return () => clearInterval(interval)
  }, [selectedPeriod, selectedYear])

  useEffect(() => {
    if (selectedCompany) {
      loadAllData()
      loadICTransactions() // Load IC transactions separately
    }
  }, [selectedPeriod, selectedYear, selectedCompany])
  
  // Update newJournal when period/year changes
  useEffect(() => {
    setNewJournal(prev => ({
      ...prev,
      period: selectedPeriod,
      year: selectedYear
    }))
  }, [selectedPeriod, selectedYear])

  const loadAllData = async () => {
    if (!selectedCompany) return
    
    setIsLoading(true)
    try {
      console.log('🔄 Consolidation: Loading data for company:', selectedCompany)
      
      // Load all consolidation data in parallel
      const [
        entitiesData,
        ifrsAccountsData,
        consolidationDataResponse,
        rollforwardData,
        fstTemplatesData
      ] = await Promise.all([
        ConsolidationService.getEntities(),
        ConsolidationService.getConsolidationAccounts(),
        ConsolidationService.getConsolidationData(),
        ConsolidationService.getRollforwardAccounts(),
        ConsolidationService.getFSTTemplates()
      ])
      
      console.log('🔍 API responses:')
      console.log('  - ifrsAccountsData:', ifrsAccountsData)
      console.log('  - ifrsAccountsData.accounts:', ifrsAccountsData.accounts)
      console.log('  - ifrsAccountsData.accounts length:', ifrsAccountsData.accounts ? ifrsAccountsData.accounts.length : 'undefined')

      // Use CompanyContext data if available, otherwise fall back to API data
      const safeEntities = (contextEntities && contextEntities.length > 0) ? contextEntities : 
                          (Array.isArray(entitiesData) ? entitiesData : [])
      const safeIfrsAccounts = (contextAccounts && contextAccounts.length > 0) ? contextAccounts : 
                              (Array.isArray(ifrsAccountsData.accounts) ? ifrsAccountsData.accounts : [])
      const safeRollforwardAccounts = Array.isArray(rollforwardData) ? rollforwardAccounts : []
      const safeFstTemplates = Array.isArray(fstTemplatesData) ? fstTemplatesData : []
      
      console.log('🔍 Data loading decision:')
      console.log('  - CompanyContext accounts available:', contextAccounts && contextAccounts.length > 0)
      console.log('  - API accounts available:', ifrsAccountsData && ifrsAccountsData.accounts && Array.isArray(ifrsAccountsData.accounts))
      console.log('  - Final accounts to use:', safeIfrsAccounts.length)
      
      setEntities(safeEntities)
      setIfrsAccounts(safeIfrsAccounts)
      setConsolidationData(consolidationDataResponse || {})
      setRollforwardAccounts(safeRollforwardAccounts)
      setFstTemplates(safeFstTemplates)

      // Initialize with mock data if no rollforward data is available
      if (safeRollforwardAccounts.length === 0) {
        const mockData = [
          {
            id: 1,
            entity_name: 'Parent Company',
            account_code: '1000',
            account_name: 'Cash and Cash Equivalents',
            previous_period: 'November',
            previous_year: '2024',
            opening_balance: 1000000,
            movements: 50000,
            adjustments: 0,
            eliminations: 0,
            closing_balance: 1050000,
            status: 'finalized',
            notes: 'Opening balance carried forward from November'
          },
          {
            id: 2,
            entity_name: 'Subsidiary A',
            account_code: '2000',
            account_name: 'Accounts Receivable',
            previous_period: 'November',
            previous_year: '2024',
            opening_balance: 500000,
            movements: -25000,
            adjustments: 0,
            eliminations: 0,
            closing_balance: 475000,
            status: 'review',
            notes: 'Collections received during period'
          }
        ]
        setRollforwardAccounts(mockData)
      }

      // Extract specific data from consolidation response
      if (consolidationDataResponse) {
        setIcItems(consolidationDataResponse.ic_items || [])
        setOwnerships(consolidationDataResponse.ownerships || [])
      }
      
      // Load journals separately to ensure we get the latest data
      await loadJournals()

      console.log('✅ Consolidation: All data loaded successfully for company:', selectedCompany)
      console.log('📊 Entities:', entitiesData?.length || 0)
      console.log('📊 IFRS Accounts:', ifrsAccountsData?.length || 0)
      console.log('📊 Consolidation Data:', consolidationDataResponse ? 'Loaded' : 'None')
      
      // Debug: Log the actual accounts being used
      console.log('🔍 Accounts being used in component:', safeIfrsAccounts)
      console.log('🔍 Sample account structure:', safeIfrsAccounts[0] || 'No accounts loaded')
    } catch (error) {
      console.error('❌ Error loading consolidation data:', error)
      // Set default data on error
      setEntities([])
      setIfrsAccounts([])
      setConsolidationData({})
      setRollforwardAccounts([])
      setFstTemplates([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadEntities = async () => {
    try {
      const entitiesData = await ConsolidationService.getEntities()
      setEntities(entitiesData || [])
    } catch (error) {
      console.error('Error loading entities:', error)
    }
  }

  const loadICTransactions = async () => {
    try {
      const result = await ConsolidationService.getICTransactions()
      if (result.success) {
        console.log('📊 IC Transactions loaded:', result.data)
        // Ensure we always have an array, even if backend returns unexpected structure
        const transactions = Array.isArray(result.data) ? result.data : 
                           (result.data && result.data.ic_items && Array.isArray(result.data.ic_items)) ? result.data.ic_items : []
        console.log('🔍 IC Transactions data structure:', { 
          rawData: result.data, 
          isArray: Array.isArray(result.data), 
          hasIcItems: result.data && result.data.ic_items,
          finalTransactions: transactions 
        })
        setIcItems(transactions)
      } else {
        console.warn('Failed to load IC transactions:', result.error)
        setIcItems([])
      }
    } catch (error) {
      console.error('Error loading IC transactions:', error)
      setIcItems([])
    }
  }

  const loadJournals = async () => {
    try {
      console.log('🔄 Loading consolidation journals...')
      const response = await fetch('/api/consolidation/journals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'X-Company-Name': selectedCompany
        }
      })
      
      if (response.ok) {
        const journalsData = await response.json()
        console.log('📊 Journals loaded:', journalsData)
        setJournals(journalsData.journals || journalsData || [])
      } else {
        console.warn('Failed to load journals:', response.status)
        setJournals([])
      }
    } catch (error) {
      console.error('Error loading journals:', error)
      setJournals([])
    }
  }

  const syncICTransactionWithProcess = async (icTransaction) => {
    try {
      // Create entity entry in Process module (debit entry)
      if (icTransaction.entityAmount > 0) {
        const entityEntry = {
          entity_code: icTransaction.entity,
          account_code: icTransaction.entityAccount,
          period: icTransaction.period,
          year: icTransaction.year,
          month: icTransaction.period, // Use period as month
          amount: icTransaction.entityAmount // Positive amount for debit
        }
        
        // Create counterparty entry in Process module (credit entry)
        const counterpartyEntry = {
          entity_code: icTransaction.counterparty,
          account_code: icTransaction.counterpartyAccount,
          period: icTransaction.period,
          year: icTransaction.year,
          month: icTransaction.period, // Use period as month
          amount: -icTransaction.counterpartyAmount // Negative amount for credit
        }
        
        // Save both entries to Process module
        const entityResult = await ConsolidationService.createProcessEntry(entityEntry)
        const counterpartyResult = await ConsolidationService.createProcessEntry(counterpartyEntry)
        
        if (entityResult.success && counterpartyResult.success) {
          console.log('✅ IC Transaction synced with Process module:', { entityEntry, counterpartyEntry })
        } else {
          console.warn('⚠️ Partial Process sync:', { entityResult, counterpartyResult })
        }
      }
    } catch (error) {
      console.error('❌ Error syncing IC transaction with Process module:', error)
      // Don't fail the IC transaction creation if Process sync fails
    }
  }

  const handleTrialBalanceUpload = async (file) => {
    try {
      setIsLoading(true)
      const result = await ConsolidationService.uploadTrialBalance(file, selectedPeriod, selectedYear)
      if (result) {
        alert('Trial balance uploaded successfully!')
        // Reload data to show updated information
        await loadAllData()
      } else {
        alert('Failed to upload trial balance')
      }
    } catch (error) {
      console.error('Error uploading trial balance:', error)
      alert('Error uploading trial balance: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTrialBalanceData = async () => {
    try {
      setIsLoading(true)
      const trialBalanceData = await ConsolidationService.getTrialBalanceData()
      console.log('Trial balance data loaded:', trialBalanceData)
      // You can add state for trial balance data if needed
    } catch (error) {
      console.error('Error loading trial balance data:', error)
      alert('Error loading trial balance data: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEntity = async () => {
    if (!newEntity.name || !newEntity.type) return
    
    try {
      const entity = {
        id: Date.now(),
        ...newEntity,
        status: 'active',
        lastConsolidated: null,
        totalAssets: 0,
        totalLiabilities: 0,
        netIncome: 0
      }
      
      setEntities([...entities, entity])
      setNewEntity({ name: '', type: 'subsidiary', ownership: 100, country: '', currency: 'USD' })
      setShowAddEntity(false)
    } catch (error) {
      console.error('Error adding entity:', error)
    }
  }

  const handleDeleteEntity = (id) => {
    setEntities(entities.filter(entity => entity.id !== id))
  }

  // IC Transaction helper functions
  const getTransactionCategoryColor = (category) => {
    const colors = {
      receivable: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      payable: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      loan: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      dividend: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      service: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
    return colors[category] || colors.other
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      matched: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      reconciled: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      approved: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
    return colors[status] || colors.pending
  }

  const handleViewICTransaction = (transaction) => {
    // TODO: Implement view modal
    console.log('View transaction:', transaction)
  }

  const handleEditICTransaction = (transaction) => {
    setNewICTransaction({
      entity_id: transaction.entity_id || transaction.entity,
      counterparty_id: transaction.counterparty_id || transaction.counterparty,
      entity_account_id: transaction.entity_account_id || transaction.entity_account,
      counterparty_account_id: transaction.counterparty_account_id || transaction.counterparty_account,
      transaction_category: transaction.transaction_category || transaction.category,
      description: transaction.description || '',
      debit_amount: transaction.debit_amount || transaction.entity_amount || '',
      credit_amount: transaction.credit_amount || transaction.counterparty_amount || '',
      currency: transaction.currency || 'USD',
      transaction_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
      period: transaction.period || selectedPeriod,
      year: transaction.year || selectedYear
    })
    setShowAddICTransaction(true)
  }

  const handleDeleteICTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this IC transaction?')) {
      try {
        await ConsolidationService.deleteICTransaction(id)
        // Reload IC transactions to show updated list
        await loadICTransactions()
        alert('IC Transaction deleted successfully!')
      } catch (error) {
        console.error('Error deleting IC transaction:', error)
        alert('Error deleting IC transaction: ' + error.message)
      }
    }
  }

  const handleToggleElimination = async (id) => {
    try {
      const item = icItems.find(item => item.id === id)
      if (!item) return
      
      const newEliminationStatus = item.elimination === 'yes' ? 'no' : 'yes'
      
      // Update the local state immediately for better UX
      setIcItems(prev => prev.map(item => 
        item.id === id ? { ...item, elimination: newEliminationStatus } : item
      ))
      
      // Update in backend
      const result = await ConsolidationService.updateICTransactionElimination(id, newEliminationStatus)
      if (result.success) {
        addNotification(`Transaction ${newEliminationStatus === 'yes' ? 'eliminated' : 'un-eliminated'} successfully`, 'success')
      } else {
        // Revert local state if backend update failed
        setIcItems(prev => prev.map(item => 
          item.id === id ? { ...item, elimination: item.elimination === 'yes' ? 'no' : 'yes' } : item
        ))
        addNotification('Failed to update elimination status', 'error')
      }
    } catch (error) {
      console.error('Error toggling elimination:', error)
      addNotification('Failed to update elimination status', 'error')
    }
  }

  const handleAddICTransaction = async () => {
    // Use the form data as entered by the user and map to backend field names
    const transactionData = {
      transactionType: newICTransaction.transaction_category,
      entity: newICTransaction.entity_id,
      counterparty: newICTransaction.counterparty_id,
      entityAccount: newICTransaction.entity_account_id,
      counterpartyAccount: newICTransaction.counterparty_account_id,
      entityAmount: parseFloat(newICTransaction.debit_amount || 0),
      counterpartyAmount: parseFloat(newICTransaction.credit_amount || 0),
      period: selectedPeriod,
      year: selectedYear,
      description: newICTransaction.description || '',
      transactionDate: newICTransaction.transaction_date || new Date().toISOString(),
      elimination: newICTransaction.elimination || 'no'
    }
    
    if (!transactionData.entity || !transactionData.counterparty || 
        !transactionData.entityAccount || !transactionData.counterpartyAccount ||
        !transactionData.transactionType || 
        (!transactionData.entityAmount && !transactionData.counterpartyAmount)) {
      alert('Please fill in all required fields: Entity, Counterparty, Entity Account, Counterparty Account, Transaction Category, and at least one amount (Debit or Credit)')
      return
    }

    try {
      const result = await ConsolidationService.createICTransaction(transactionData)
      if (result.success) {
        setShowAddICTransaction(false)
        setNewICTransaction({
          entity_id: '',
          counterparty_id: '',
          entity_account_id: '',
          counterparty_account_id: '',
          transaction_category: '',
          description: '',
          debit_amount: '',
          credit_amount: '',
          currency: 'USD',
          transaction_date: new Date().toISOString().split('T')[0],
          period: selectedPeriod,
          year: selectedYear,
          elimination: 'no'
        })
        // Reload IC transactions to show the new entry immediately
        await loadICTransactions()
        
        // Sync with Process module - create corresponding entries (non-blocking)
        syncICTransactionWithProcess(transactionData).catch(error => {
          console.error('❌ Process sync failed:', error)
        })
        
        alert('IC Transaction created successfully!')
      } else {
        alert('Error creating IC transaction: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating IC transaction:', error)
      alert('Error creating IC transaction: ' + error.message)
    }
  }

  // Utility function for formatting currency

  // Consolidation Journal helper functions
  const getAccountName = (accountCode) => {
    const account = ifrsAccounts.find(acc => acc.account_code === accountCode)
    return account ? account.account_name : accountCode
  }

  const filteredJournals = journals.filter(journal => {
    if (journalFilters.account && !journal.debitEntries?.some(e => e.accountCode === journalFilters.account) && 
        !journal.creditEntries?.some(e => e.accountCode === journalFilters.account)) {
      return false
    }
    if (journalFilters.entity && !journal.debitEntries?.some(e => e.entity === journalFilters.entity) && 
        !journal.creditEntries?.some(e => e.entity === journalFilters.entity)) {
      return false
    }
    if (journalFilters.date && journal.date !== journalFilters.date) {
      return false
    }
    if (journalFilters.description && !journal.description.toLowerCase().includes(journalFilters.description.toLowerCase())) {
      return false
    }
    if (journalFilters.status === 'Balanced' && !journal.balanced) {
      return false
    }
    if (journalFilters.status === 'Unbalanced' && journal.balanced) {
      return false
    }
    return true
  })

  const clearJournalFilters = () => {
    setJournalFilters({
      account: '',
      entity: '',
      date: '',
      description: '',
      status: ''
    })
  }

  const addDebitEntry = () => {
    setNewJournal(prev => ({
      ...prev,
      debitEntries: [...prev.debitEntries, {
        id: Date.now(),
        accountCode: '',
        entity: '',
        amount: ''
      }]
    }))
  }

  const removeDebitEntry = (index) => {
    setNewJournal(prev => ({
      ...prev,
      debitEntries: prev.debitEntries.filter((_, i) => i !== index)
    }))
  }

  const addCreditEntry = () => {
    setNewJournal(prev => ({
      ...prev,
      creditEntries: [...prev.creditEntries, {
        id: Date.now(),
        accountCode: '',
        entity: '',
        amount: ''
      }]
    }))
  }

  const removeCreditEntry = (index) => {
    setNewJournal(prev => ({
      ...prev,
      creditEntries: prev.creditEntries.filter((_, i) => i !== index)
    }))
  }

  const recalculateJournalBalance = () => {
    // This will be handled by the backend validation
  }

  const canPostJournal = () => {
    const totalDebits = newJournal.debitEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)
    const totalCredits = newJournal.creditEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)
    return Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0
  }

  const postJournal = async () => {
    if (!canPostJournal()) {
      addNotification('Journal is not balanced or has no entries', 'error')
      return
    }

    try {
      // Calculate total amount and check if balanced
      const totalDebits = newJournal.debitEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)
      const totalCredits = newJournal.creditEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)
      const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 // Allow small rounding differences
      
      const journalData = {
        journalNumber: `CJ-${Date.now()}`, // Generate unique journal number
        date: newJournal.date,
        description: newJournal.description,
        period: newJournal.period,
        year: newJournal.year,
        status: 'POSTED',
        totalAmount: totalDebits,
        balanced: isBalanced,
        debitEntries: newJournal.debitEntries.map(entry => ({
          accountCode: entry.accountCode,
          entity: entry.entity,
          amount: parseFloat(entry.amount),
          description: entry.description || ''
        })),
        creditEntries: newJournal.creditEntries.map(entry => ({
          accountCode: entry.accountCode,
          entity: entry.entity,
          amount: parseFloat(entry.amount),
          description: entry.description || ''
        }))
      }

      console.log('🔍 Posting journal:', journalData)

      const response = await fetch('/api/consolidation/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'X-Company-Name': selectedCompany
        },
        body: JSON.stringify(journalData)
      })

      if (response.ok) {
        const result = await response.json()
        addNotification('Journal posted successfully!', 'success')
        setShowAddJournalModal(false)
        setNewJournal({
          date: new Date().toISOString().split('T')[0],
          description: '',
          period: selectedPeriod,
          year: selectedYear,
          debitEntries: [],
          creditEntries: []
        })
        // Reload journals
        await loadJournals()
      } else {
        const error = await response.json()
        addNotification(`Error posting journal: ${error.detail}`, 'error')
      }
    } catch (error) {
      console.error('Error posting journal:', error)
      addNotification(`Error posting journal: ${error.message}`, 'error')
    }
  }

  const editJournal = (journal) => {
    setEditingJournal(journal)
    setShowEditJournalModal(true)
  }

  const deleteJournal = async (journalId) => {
    if (window.confirm('Are you sure you want to delete this journal?')) {
      try {
        const response = await fetch(`/api/consolidation/journals/${journalId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'X-Company-Name': selectedCompany
          }
        })

        if (response.ok) {
          addNotification('Journal deleted successfully!', 'success')
          await loadJournals()
        } else {
          const error = await response.json()
          addNotification(`Error deleting journal: ${error.detail}`, 'error')
        }
      } catch (error) {
        console.error('Error deleting journal:', error)
        addNotification(`Error deleting journal: ${error.message}`, 'error')
      }
    }
  }

  const recalculateAllJournalBalances = () => {
    // This would typically call the backend to recalculate all journal balances
    addNotification('Journal balances recalculated!', 'success')
  }

  const exportJournalsToCSV = async () => {
    try {
      const response = await fetch('/api/consolidation/journals/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `consolidation_journals_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Error exporting journals')
      }
    } catch (error) {
      console.error('Error exporting journals:', error)
      alert('Error exporting journals: ' + error.message)
    }
  }
  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) return '$0.00'
    
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) return '$0.00'
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount)
  }

  const runConsolidation = async () => {
    if (selectedEntities.length === 0) {
      alert('Please select at least one entity to consolidate')
      return
    }

    setConsolidationStatus('running')
    
    try {
      // Perform comprehensive consolidation using the service
      const result = await ConsolidationService.performConsolidation(
        selectedPeriod, 
        selectedYear, 
        selectedEntities, 
        ifrsAccounts
      )
      
      if (result.success) {
        const { data } = result
        
        // Calculate consolidated results
        const totalAssets = Object.values(data.consolidatedBalances)
          .filter(balance => balance.accountCode.startsWith('1'))
          .reduce((sum, balance) => sum + balance.consolidatedAmount, 0)
        
        const totalLiabilities = Object.values(data.consolidatedBalances)
          .filter(balance => balance.accountCode.startsWith('2'))
          .reduce((sum, balance) => sum + balance.consolidatedAmount, 0)
        
        const totalRevenue = Object.values(data.consolidatedBalances)
          .filter(balance => balance.accountCode.startsWith('4'))
          .reduce((sum, balance) => sum + balance.consolidatedAmount, 0)
        
        const totalExpenses = Object.values(data.consolidatedBalances)
          .filter(balance => balance.accountCode.startsWith('5'))
          .reduce((sum, balance) => sum + balance.consolidatedAmount, 0)
        
        const netIncome = totalRevenue - totalExpenses
        const equity = totalAssets - totalLiabilities
        
        setConsolidationResults({
          totalAssets,
          totalLiabilities,
          totalRevenue,
          totalExpenses,
          netIncome,
          equity,
          entities: selectedEntities.length,
          timestamp: new Date().toISOString(),
          eliminations: data.eliminations,
          validation: data.validation,
          consolidatedBalances: data.consolidatedBalances
        })
        
        setConsolidationStatus('completed')
        addNotification('Consolidation completed successfully!', 'success')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Consolidation failed:', error)
      setConsolidationStatus('error')
      addNotification('Consolidation failed: ' + error.message, 'error')
    }
  }

  const generateConsolidatedFinancials = async () => {
    if (!consolidationResults || consolidationStatus !== 'completed') {
      alert('Please run consolidation first')
      return
    }

    if (selectedTemplates.length === 0) {
      alert('Please select at least one financial statement template')
      return
    }

    try {
      setIsLoading(true)
      
      // Map template names to template IDs (you would get these from FST templates)
      const templateMapping = {
        'balance-sheet': 'BS001',
        'income-statement': 'IS001', 
        'cash-flow': 'CF001'
      }
      
      const templateIds = selectedTemplates.map(template => templateMapping[template]).filter(Boolean)
      
      const result = await ConsolidationService.generateConsolidatedFinancials(
        selectedPeriod,
        selectedYear,
        templateIds
      )
      
      if (result.success) {
        setConsolidatedFinancials(result.data.financialStatements)
        addNotification('Consolidated financial statements generated and saved to SQL!', 'success')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to generate consolidated financials:', error)
      addNotification('Failed to generate financial statements: ' + error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelection = (template, isSelected) => {
    if (isSelected) {
      setSelectedTemplates(prev => [...prev, template])
    } else {
      setSelectedTemplates(prev => prev.filter(t => t !== template))
    }
  }

  const exportConsolidatedFinancials = async () => {
    if (!consolidatedFinancials || consolidatedFinancials.length === 0) {
      alert('No consolidated financial statements to export')
      return
    }

    try {
      const result = await ConsolidationService.exportConsolidationData(selectedPeriod, selectedYear, 'csv')
      if (result.success) {
        addNotification('Consolidated financial statements exported successfully!', 'success')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Export failed:', error)
      addNotification('Export failed: ' + error.message, 'error')
    }
  }

  const viewConsolidatedFinancials = () => {
    // This would open a detailed view modal
    console.log('View consolidated financials:', consolidatedFinancials)
    addNotification('Detailed view functionality coming soon!', 'info')
  }

  const getEntityTypeColor = (type) => {
    switch (type) {
      case 'parent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'subsidiary': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'joint_venture': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'associate': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  // ===== HELPER FUNCTIONS =====
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  const getRuleTypeColor = (ruleType) => {
    switch (ruleType) {
      case 'allocation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'elimination': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'adjustment': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'manual': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  // ===== OWNERSHIP CALCULATION FUNCTIONS =====
  const calculateOwnershipAndNCI = () => {
    const ownership = parseFloat(newOwnership.ownershipPercentage) || 0
    const nciPercentage = 100 - ownership
    const fairValue = parseFloat(newOwnership.fairValueNetAssets) || 0
    
    setNewOwnership(prev => ({
      ...prev,
      nciPercentage: nciPercentage.toFixed(2),
      nciValue: (fairValue * nciPercentage / 100).toFixed(2)
    }))
    
    calculateGoodwill()
  }

  const calculateGoodwill = () => {
    const ownershipPercent = parseFloat(newOwnership.ownershipPercentage) || 0
    const fairValue = parseFloat(newOwnership.fairValueNetAssets) || 0
    const consideration = parseFloat(newOwnership.purchaseConsideration) || 0
    
    if (ownershipPercent > 0 && fairValue > 0) {
      let goodwill = 0
      let nciValue = (100 - ownershipPercent) / 100 * fairValue
      
      if (newOwnership.goodwillMethod === 'Partial') {
        // Partial Goodwill: Purchase Consideration - (Parent % × FV Net Assets)
        goodwill = consideration - (ownershipPercent / 100 * fairValue)
      } else {
        // Full Goodwill: FV Net Assets - Purchase Consideration
        goodwill = fairValue - consideration
      }
      
      setNewOwnership(prev => ({
        ...prev,
        goodwillValue: goodwill.toFixed(2),
        nciValue: nciValue.toFixed(2)
      }))
    }
  }

  // ===== OWNERSHIP HELPER FUNCTIONS =====
  const initializeEditingOwnership = (ownership) => {
    setEditingOwnership({
      id: ownership.id,
      parentEntity: ownership.parent_entity || ownership.parentEntity,
      subsidiaryEntity: ownership.subsidiary_entity || ownership.subsidiaryEntity,
      ownershipPercentage: ownership.ownership_percentage || ownership.ownershipPercentage,
      fairValueNetAssets: ownership.fair_value_net_assets || ownership.fairValueNetAssets,
      purchaseConsideration: ownership.purchase_consideration || ownership.purchaseConsideration,
      goodwillMethod: ownership.goodwill_method || ownership.goodwillMethod || 'Partial',
      relationshipType: ownership.relationship_type || ownership.relationshipType || '',
      description: ownership.description || '',
      effectiveDate: ownership.effective_date || ownership.effectiveDate,
      validFrom: ownership.valid_from || ownership.validFrom || ownership.effective_date || ownership.effectiveDate,
      validTo: ownership.valid_to || ownership.validTo || '',
      nciPercentage: ownership.nci_percentage || ownership.nciPercentage,
      nciValue: ownership.nci_value || ownership.nciValue,
      goodwillValue: ownership.goodwill_value || ownership.goodwillValue
    })
  }

  // ===== INITIALIZATION FUNCTIONS =====
  const initializeNewRule = () => {
    setNewRule({
      name: '',
      description: '',
      rule_type: 'reclassify',
      conditions: [{ field: 'account_code', operator: 'equals', value: '' }],
      actions: [{ type: 'reclassify', to_account: '', amount: '', description: '' }],
      priority: 1,
      is_active: true
    })
  }

  const initializeNewOwnership = () => {
    setNewOwnership({
      parentEntity: '',
      subsidiaryEntity: '',
      ownershipPercentage: '',
      fairValueNetAssets: '',
      purchaseConsideration: '',
      goodwillMethod: 'Partial',
      relationshipType: '',
      description: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      nciPercentage: '',
      nciValue: '',
      goodwillValue: ''
    })
  }

  // ===== LOADING FUNCTIONS =====
  const loadRulesFromBackend = async () => {
    try {
      const rules = await ConsolidationService.getRules()
      setAdditionalRules(rules)
    } catch (error) {
      console.error('Failed to load rules:', error)
      addNotification('Failed to load additional rules', 'error')
    }
  }

  const loadOwnershipsFromBackend = async () => {
    try {
      const ownershipsData = await ConsolidationService.getOwnerships()
      setOwnerships(ownershipsData || [])
    } catch (error) {
      console.error('Failed to load ownerships:', error)
      addNotification('Failed to load ownership data', 'error')
    }
  }

  // ===== CRUD OPERATIONS =====
  const handleAddRule = async () => {
    try {
      const result = await ConsolidationService.addRule(newRule)
      if (result.success) {
        addNotification('Rule added successfully', 'success')
        setShowAddRuleModal(false)
        initializeNewRule()
        loadRulesFromBackend()
      } else {
        addNotification(result.error || 'Failed to add rule', 'error')
      }
    } catch (error) {
      console.error('Error adding rule:', error)
      addNotification('Failed to add rule', 'error')
    }
  }

  const handleEditRule = async () => {
    try {
      const result = await ConsolidationService.updateRule(editingRule.id, editingRule)
      if (result.success) {
        addNotification('Rule updated successfully', 'success')
        setShowEditRuleModal(false)
        setEditingRule(null)
        loadRulesFromBackend()
      } else {
        addNotification(result.error || 'Failed to update rule', 'error')
      }
    } catch (error) {
      console.error('Error updating rule:', error)
      addNotification('Failed to update rule', 'error')
    }
  }

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return
    
    try {
      const result = await ConsolidationService.deleteRule(ruleId)
      if (result.success) {
        addNotification('Rule deleted successfully', 'success')
        loadRulesFromBackend()
      } else {
        addNotification(result.error || 'Failed to delete rule', 'error')
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
      addNotification('Failed to delete rule', 'error')
    }
  }

  const handleToggleRuleStatus = async (ruleId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      const result = await ConsolidationService.toggleRuleStatus(ruleId, newStatus)
      if (result.success) {
        addNotification(`Rule ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success')
        loadRulesFromBackend()
      } else {
        addNotification(result.error || 'Failed to update rule status', 'error')
      }
    } catch (error) {
      console.error('Error toggling rule status:', error)
      addNotification('Failed to update rule status', 'error')
    }
  }

  const handleAddOwnership = async () => {
    try {
      const result = await ConsolidationService.addOwnership(newOwnership)
      if (result.success) {
        addNotification('Ownership added successfully', 'success')
        setShowAddOwnershipModal(false)
        initializeNewOwnership()
        loadOwnershipsFromBackend()
      } else {
        addNotification(result.error || 'Failed to add ownership', 'error')
      }
    } catch (error) {
      console.error('Error adding ownership:', error)
      addNotification('Failed to add ownership', 'error')
    }
  }

  const handleEditOwnership = async () => {
    try {
      const result = await ConsolidationService.updateOwnership(editingOwnership.id, editingOwnership)
      if (result.success) {
        addNotification('Ownership updated successfully', 'success')
        setShowEditOwnershipModal(false)
        setEditingOwnership(null)
        loadOwnershipsFromBackend()
      } else {
        addNotification(result.error || 'Failed to update ownership', 'error')
      }
    } catch (error) {
      console.error('Error updating ownership:', error)
      addNotification('Failed to update ownership', 'error')
    }
  }

  const handleDeleteOwnership = async (ownershipId) => {
    if (!window.confirm('Are you sure you want to delete this ownership record?')) return
    
    try {
      const result = await ConsolidationService.deleteOwnership(ownershipId)
      if (result.success) {
        addNotification('Ownership deleted successfully', 'success')
        loadOwnershipsFromBackend()
      } else {
        addNotification(result.error || 'Failed to delete ownership', 'error')
      }
    } catch (error) {
      console.error('Error deleting ownership:', error)
      addNotification('Failed to delete ownership', 'error')
    }
  }

  // ===== MISSING RULE FUNCTIONS =====
  const handleSimulateRules = async () => {
    try {
      setIsLoading(true)
      addNotification('Simulating rules...', 'info')
      
      // Simulate the rules and show results
      const simulationData = {
        rulesApplied: additionalRules.length,
        totalAdjustments: additionalRules.reduce((sum, rule) => sum + parseFloat(rule.adjustmentAmount || 0), 0),
        affectedAccounts: new Set(additionalRules.map(rule => rule.account)).size,
        affectedEntities: new Set(additionalRules.map(rule => rule.entity)).size
      }
      
      setSimulationResults(simulationData)
      setShowSimulationModal(true)
      addNotification('Rules simulation completed!', 'success')
    } catch (error) {
      console.error('Error simulating rules:', error)
      addNotification('Failed to simulate rules: ' + error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyRules = async () => {
    try {
      setIsLoading(true)
      addNotification('Applying rules...', 'info')
      
      // Apply the rules to the consolidation data
      const activeRules = additionalRules.filter(rule => rule.is_active)
      
      if (activeRules.length === 0) {
        addNotification('No active rules to apply', 'warning')
        return
      }
      
      // Simulate applying rules (in a real implementation, this would modify the consolidation data)
      const appliedRules = activeRules.map(rule => ({
        ...rule,
        appliedAt: new Date().toISOString(),
        status: 'applied'
      }))
      
      addNotification(`Successfully applied ${appliedRules.length} rules!`, 'success')
    } catch (error) {
      console.error('Error applying rules:', error)
      addNotification('Failed to apply rules: ' + error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseTemplate = (template) => {
    setNewRule({
      ...newRule,
      name: template.name,
      description: template.description,
      rule_type: template.template.rule_type,
      conditions: template.template.conditions || [{ field: 'account_code', operator: 'equals', value: '' }],
      actions: template.template.actions || [{ type: 'reclassify', to_account: '', amount: '', description: '' }]
    })
    setShowAddRuleModal(true)
    addNotification(`Template "${template.name}" loaded`, 'success')
  }

  const toggleRuleStatus = async (rule) => {
    try {
      const updatedRule = { ...rule, is_active: !rule.is_active }
      const result = await ConsolidationService.updateRule(rule.id, updatedRule)
      if (result.success) {
        setAdditionalRules(prev => prev.map(r => r.id === rule.id ? updatedRule : r))
        addNotification(`Rule ${updatedRule.is_active ? 'activated' : 'deactivated'} successfully`, 'success')
      } else {
        addNotification(result.error || 'Failed to update rule status', 'error')
      }
    } catch (error) {
      console.error('Error toggling rule status:', error)
      addNotification('Failed to update rule status', 'error')
    }
  }

  const editRule = (rule) => {
    setEditingRule(rule)
    setShowEditRuleModal(true)
  }

  // ===== EXPORT FUNCTIONS =====
  const exportRulesToCSV = () => {
    const csvContent = generateRulesCSV()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `consolidation-rules-${selectedPeriod}-${selectedYear}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    addNotification('Rules exported to CSV successfully', 'success')
  }

  const generateRulesCSV = () => {
    const headers = ['Rule Name', 'Type', 'Entity', 'Account', 'Adjustment Amount', 'Effective Date', 'Priority', 'Auto-Apply', 'Status', 'Description']
    const rows = additionalRules.map(rule => [
      rule.ruleName,
      rule.ruleType,
      rule.entity,
      rule.account,
      rule.adjustmentAmount,
      rule.effectiveDate,
      rule.priority,
      rule.autoApply ? 'Yes' : 'No',
      rule.status,
      rule.description
    ])
    
    return [headers, ...rows].map(row => row.map(field => `"${field || ''}"`).join(',')).join('\n')
  }

  const exportOwnershipsToCSV = () => {
    const csvContent = generateOwnershipsCSV()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ownership-structure-${selectedPeriod}-${selectedYear}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    addNotification('Ownership data exported to CSV successfully', 'success')
  }

  const generateOwnershipsCSV = () => {
    const headers = ['Parent Entity', 'Subsidiary Entity', 'Ownership %', 'NCI %', 'FV Net Assets', 'Consideration', 'Goodwill', 'NCI Value', 'Effective Date']
    const rows = ownerships.map(ownership => [
      ownership.parent_entity || ownership.parentEntity,
      ownership.subsidiary_entity || ownership.subsidiaryEntity,
      ownership.ownership_percentage || ownership.ownershipPercentage,
      ownership.nci_percentage || ownership.nciPercentage,
      ownership.fair_value_net_assets || ownership.fairValueNetAssets,
      ownership.purchase_consideration || ownership.purchaseConsideration,
      ownership.goodwill_value || ownership.goodwillValue,
      ownership.nci_value || ownership.nciValue,
      ownership.effective_date || ownership.effectiveDate
    ])
    
    return [headers, ...rows].map(row => row.map(field => `"${field || ''}"`).join(',')).join('\n')
  }

  // ===== ROLL FORWARD FUNCTIONS =====
  const handleAddRollforward = async () => {
    if (!newRollforward.entity_id || !newRollforward.account_id) {
      addNotification('Please fill in all required fields', 'warning')
      return
    }

    try {
      const rollforwardEntry = {
        id: Date.now(),
        ...newRollforward,
        entity_name: entities.find(e => e.id === newRollforward.entity_id)?.name || '',
        account_name: ifrsAccounts.find(a => a.id === newRollforward.account_id)?.name || '',
        closing_balance: parseFloat(newRollforward.opening_balance || 0) + 
                        parseFloat(newRollforward.movements || 0) + 
                        parseFloat(newRollforward.adjustments || 0) + 
                        parseFloat(newRollforward.eliminations || 0)
      }

      setRollforwardAccounts([...rollforwardAccounts, rollforwardEntry])
      setNewRollforward({
        entity_id: '',
        account_id: '',
        previous_period: '',
        previous_year: '',
        opening_balance: '',
        movements: '',
        adjustments: '',
        eliminations: '',
        status: 'pending',
        notes: '',
        effective_date: new Date().toISOString().split('T')[0]
      })
      setShowAddRollforwardModal(false)
      addNotification('Rollforward entry added successfully!', 'success')
    } catch (error) {
      console.error('Error adding rollforward entry:', error)
      addNotification('Failed to add rollforward entry: ' + error.message, 'error')
    }
  }

  const handleEditRollforward = (item) => {
    setEditingRollforward(item)
    setShowEditRollforwardModal(true)
  }

  const handleUpdateRollforward = async () => {
    if (!editingRollforward) return

    try {
      const updatedAccounts = rollforwardAccounts.map(account => 
        account.id === editingRollforward.id ? editingRollforward : account
      )
      setRollforwardAccounts(updatedAccounts)
      setShowEditRollforwardModal(false)
      setEditingRollforward(null)
      addNotification('Rollforward entry updated successfully!', 'success')
    } catch (error) {
      console.error('Error updating rollforward entry:', error)
      addNotification('Failed to update rollforward entry: ' + error.message, 'error')
    }
  }

  const handleDeleteRollforward = (id) => {
    if (window.confirm('Are you sure you want to delete this rollforward entry?')) {
      setRollforwardAccounts(rollforwardAccounts.filter(account => account.id !== id))
      addNotification('Rollforward entry deleted successfully!', 'success')
    }
  }

  const handleRollforwardStatusChange = (id, newStatus) => {
    setRollforwardAccounts(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      )
    )
    addNotification(`Status changed to ${newStatus}`, 'success')
  }

  const getRollforwardStatusColor = (status) => {
    switch (status) {
      case 'finalized': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const exportRollforwardToCSV = () => {
    if (rollforwardAccounts.length === 0) {
      addNotification('No rollforward data to export', 'warning')
      return
    }

    try {
      const csvContent = generateRollforwardCSV()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `rollforward_${selectedPeriod}_${selectedYear}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      addNotification('Rollforward data exported successfully!', 'success')
    } catch (error) {
      console.error('Export failed:', error)
      addNotification('Export failed: ' + error.message, 'error')
    }
  }

  const generateRollforwardCSV = () => {
    let csv = 'Entity,Account Code,Account Name,Previous Period,Previous Year,Opening Balance,Movements,Adjustments,Eliminations,Closing Balance,Status,Notes\n'
    
    rollforwardAccounts.forEach(account => {
      csv += `"${account.entity_name || ''}","${account.account_code || ''}","${account.account_name || ''}","${account.previous_period || ''}","${account.previous_year || ''}","${account.opening_balance || 0}","${account.movements || 0}","${account.adjustments || 0}","${account.eliminations || 0}","${account.closing_balance || 0}","${account.status || ''}","${account.notes || ''}"\n`
    })
    
    return csv
  }

  // ===== REFRESH FUNCTIONS =====
  const refreshRules = async () => {
    await loadRulesFromBackend()
    addNotification('Rules refreshed successfully', 'success')
  }

  const refreshOwnerships = async () => {
    await loadOwnershipsFromBackend()
    addNotification('Ownership data refreshed successfully', 'success')
  }

  // ===== COMPUTED PROPERTIES =====
  const canAddRule = () => {
    return newRule.ruleName && newRule.ruleType && newRule.entity && newRule.adjustmentAmount
  }

  const canAddOwnership = () => {
    return newOwnership.parentEntity && 
           newOwnership.subsidiaryEntity && 
           newOwnership.ownershipPercentage && 
           parseFloat(newOwnership.ownershipPercentage) >= 0 && 
           parseFloat(newOwnership.ownershipPercentage) <= 100 &&
           newOwnership.relationshipType &&
           newOwnership.validFrom
  }

  const canEditOwnership = () => {
    return editingOwnership && 
           editingOwnership.parentEntity && 
           editingOwnership.subsidiaryEntity && 
           editingOwnership.ownershipPercentage && 
           parseFloat(editingOwnership.ownershipPercentage) >= 0 && 
           parseFloat(editingOwnership.ownershipPercentage) <= 100 &&
           editingOwnership.relationshipType &&
           editingOwnership.validFrom
  }

  const rulesSummary = {
    total: additionalRules ? additionalRules.length : 0,
    active: additionalRules ? additionalRules.filter(rule => rule.status === 'active').length : 0,
    allocation: additionalRules ? additionalRules.filter(rule => rule.ruleType === 'allocation').length : 0,
    elimination: additionalRules ? additionalRules.filter(rule => rule.ruleType === 'elimination').length : 0
  }

  const ownershipSummary = {
    total: ownerships ? ownerships.length : 0,
    active: ownerships ? ownerships.filter(ownership => ownership.status === 'active').length : 0,
    totalOwnership: ownerships ? ownerships.reduce((sum, ownership) => sum + parseFloat(ownership.ownershipPercentage || ownership.ownership_percentage || 0), 0) : 0,
    totalNCI: ownerships ? ownerships.reduce((sum, ownership) => sum + parseFloat(ownership.nciPercentage || (100 - parseFloat(ownership.ownershipPercentage || ownership.ownership_percentage || 0))), 0) : 0,
    totalGoodwill: ownerships ? ownerships.reduce((sum, ownership) => sum + parseFloat(ownership.goodwill_value || ownership.goodwillValue || 0), 0) : 0,
    totalNCIValue: ownerships ? ownerships.reduce((sum, ownership) => sum + parseFloat(ownership.nci_value || ownership.nciValue || 0), 0) : 0
  }

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">No company selected</p>
          <p className="text-sm text-gray-500">Please select a company to view consolidation data</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading consolidation data for {selectedCompany}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification System */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`flex items-center p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : notification.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-auto text-white/80 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      
      {/* Company Header */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Building2 className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              {selectedCompany}
            </h2>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Consolidation data for {selectedPeriod} {selectedYear}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Consolidation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Multi-entity financial consolidation and reporting</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddEntity(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entity
          </button>
          <button
            onClick={runConsolidation}
            disabled={selectedEntities.length === 0 || consolidationStatus === 'running'}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Run Consolidation
          </button>
        </div>
      </div>





        {/* Period and Year Selection */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="January">January</option>
              <option value="February">February</option>
              <option value="March">March</option>
              <option value="April">April</option>
              <option value="May">May</option>
              <option value="June">June</option>
              <option value="July">July</option>
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
              { id: 'entities', name: 'Entities', icon: Building2 },
              { id: 'ic-items', name: 'IC Items', icon: LinkIcon },
              { id: 'journals', name: 'Journals', icon: FileText },
              { id: 'ownership', name: 'Ownership', icon: Users },
              { id: 'rollforward', name: 'Roll Forward', icon: TrendingUp },
              { id: 'additional-rules', name: 'Additional Rules', icon: Settings },
              { id: 'consolidation', name: 'Consolidation', icon: PieChart }
            ].map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

      {/* Consolidation Status */}
      {consolidationStatus !== 'idle' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(consolidationStatus)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {consolidationStatus === 'running' ? 'Consolidation in Progress...' : 
                   consolidationStatus === 'completed' ? 'Consolidation Completed' : 'Consolidation Error'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {consolidationStatus === 'running' ? 'Processing selected entities...' : 
                   consolidationStatus === 'completed' ? 'All entities have been consolidated successfully' : 'An error occurred during consolidation'}
                </p>
              </div>
            </div>
            {consolidationStatus === 'completed' && (
              <button
                onClick={() => setConsolidationStatus('idle')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Consolidation Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Consolidation Overview</h2>
              
              {entities.length === 0 && ifrsAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Available</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No entities or accounts found for {selectedCompany}. 
                    This usually means the company data hasn't been set up yet.
                  </p>
                  <div className="flex items-center justify-center space-x-3 text-sm text-gray-500">
                    <span>• Upload trial balance data</span>
                    <span>• Set up IFRS accounts</span>
                    <span>• Configure entities</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Building2 className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">Total Entities</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{entities.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <LinkIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">IC Items</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-blue-100">{icItems.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-purple-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-600">Journals</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-blue-100">{journals.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-orange-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-orange-600">Ownerships</p>
                        <p className="text-2xl font-bold text-orange-900 dark:text-blue-100">{ownerships.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trial Balance Upload */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Trial Balance Upload</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Trial Balance CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        handleTrialBalanceUpload(file)
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Upload trial balance data for {selectedPeriod} {selectedYear}
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => loadTrialBalanceData()}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Load Trial Balance
                  </button>
                </div>
              </div>
            </div>

            {/* Data Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Entities:</span>
                  <span className={`font-medium ${entities.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entities.length} loaded
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">IFRS Accounts:</span>
                  <span className={`font-medium ${ifrsAccounts.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ifrsAccounts.length} loaded
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Consolidation Data:</span>
                  <span className={`font-medium ${consolidationData && Object.keys(consolidationData).length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {consolidationData && Object.keys(consolidationData).length > 0 ? 'Available' : 'Not available'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => ConsolidationService.exportICItems()}
                  className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Export IC Items</span>
                </button>
                <button
                  onClick={() => ConsolidationService.exportJournals()}
                  className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Export Journals</span>
                </button>
                <button
                  onClick={() => ConsolidationService.exportFinancialStatements(selectedPeriod, selectedYear)}
                  className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Export Financials</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'entities' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Entities Management</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Currency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {entities.map((entity) => (
                    <tr key={entity.entity_code || entity.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{entity.entity_name || entity.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEntityTypeColor(entity.entity_type || entity.type)}`}>
                          {entity.entity_type || entity.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entity.country}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entity.currency}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ic-items' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Intercompany (IC) Matching</h2>
            
            {/* Process Module Context Display */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Process Context:</span>
                  <span className="text-blue-700 dark:text-blue-300">
                    {localStorage.getItem('currentEntity') || 'Default Entity'} → {localStorage.getItem('currentCounterparty') || 'Default Counterparty'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Period:</span>
                  <span className="text-blue-700 dark:text-blue-300">{selectedPeriod} {selectedYear}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <LinkIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Sync Status:</span>
                  <span className="text-green-600 dark:text-green-400">✓ Synced with Process Module</span>
                </div>
              </div>
            </div>

            {/* Add New IC Transaction Button */}
            <div className="mb-6 flex justify-between items-center">
              <button 
                onClick={() => setShowAddICTransaction(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add IC Transaction
              </button>
              <div className="flex space-x-3">
                <button 
                  onClick={loadICTransactions}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
                <button 
                  onClick={() => ConsolidationService.autoMatchICTransactions()}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Auto Match
                </button>
                <button 
                  onClick={() => ConsolidationService.exportICItems()}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entity</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  onChange={(e) => setEntityFilter(e.target.value)}
                >
                  <option value="">All Entities</option>
                  {(contextEntities && contextEntities.length > 0 ? contextEntities : entities).map(entity => (
                    <option key={entity.id || entity.entity_code} value={entity.id || entity.entity_code}>{entity.entity_name || entity.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction Type</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  onChange={(e) => setTransactionTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="receivable">Receivable</option>
                  <option value="payable">Payable</option>
                  <option value="loan">Loan</option>
                  <option value="dividend">Dividend</option>
                  <option value="service">Service</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="matched">Matched</option>
                  <option value="reconciled">Reconciled</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            </div>

            {/* IC Transactions Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Counterparty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entity Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Counterparty Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Elimination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.isArray(icItems) && icItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                          {item.entity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-green-500" />
                          {item.counterparty}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                          {item.entityAccount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                          {item.counterpartyAccount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionCategoryColor(item.transactionType)}`}>
                          {item.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {ConsolidationService.formatCurrency(item.entityAmount)} / {ConsolidationService.formatCurrency(item.counterpartyAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleToggleElimination(item.id)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                            item.elimination === 'yes' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}
                          title={item.elimination === 'yes' ? 'Click to un-eliminate' : 'Click to eliminate'}
                        >
                          {item.elimination === 'yes' ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewICTransaction(item)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditICTransaction(item)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteICTransaction(item.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {(!Array.isArray(icItems) || icItems.length === 0) && (
              <div className="text-center py-12">
                <LinkIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No IC Transactions Found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Get started by adding your first intercompany transaction.
                </p>
                <button 
                  onClick={() => setShowAddICTransaction(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add IC Transaction
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'journals' && (
          <div className="space-y-6">
            {/* Journals Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 dark:text-green-100">Total Debits</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${journals.reduce((sum, j) => sum + (j.debitEntries?.reduce((s, e) => s + parseFloat(e.amount || 0), 0) || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-red-900 dark:text-red-100">Total Credits</h3>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ${journals.reduce((sum, j) => sum + (j.creditEntries?.reduce((s, e) => s + parseFloat(e.amount || 0), 0) || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Balance</h3>
                <p className={`text-2xl font-bold ${
                  Math.abs(journals.reduce((sum, j) => sum + (j.debitEntries?.reduce((s, e) => s + parseFloat(e.amount || 0), 0) || 0), 0) - 
                           journals.reduce((sum, j) => sum + (j.creditEntries?.reduce((s, e) => s + parseFloat(e.amount || 0), 0) || 0), 0)) < 0.01 
                    ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  ${Math.abs(journals.reduce((sum, j) => sum + (j.debitEntries?.reduce((s, e) => s + parseFloat(e.amount || 0), 0) || 0), 0) - 
                           journals.reduce((sum, j) => sum + (j.creditEntries?.reduce((s, e) => s + parseFloat(e.amount || 0), 0) || 0), 0)).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900 dark:text-purple-100">Total Journals</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{journals.length}</p>
              </div>
            </div>

            {/* Journals Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Consolidation Journals</h2>
                <div className="flex space-x-3">
                  <button 
                    onClick={openAddJournalModal}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Journal Entry
                  </button>
                  <button 
                    onClick={recalculateAllJournalBalances}
                    className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Recalculate Balances
                  </button>
                  <button 
                    onClick={exportJournalsToCSV}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Journal Filters */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Journal Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
                    <select 
                      value={journalFilters.account} 
                      onChange={(e) => setJournalFilters({...journalFilters, account: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">All Accounts</option>
                      {ifrsAccounts.map(account => (
                        <option key={account.account_code} value={account.account_code}>
                          {account.account_code} - {account.account_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity</label>
                    <select 
                      value={journalFilters.entity} 
                      onChange={(e) => setJournalFilters({...journalFilters, entity: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">All Entities</option>
                      {entities.map(entity => (
                        <option key={entity.id} value={entity.entity_name}>
                          {entity.entity_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                    <input 
                      type="date" 
                      value={journalFilters.date} 
                      onChange={(e) => setJournalFilters({...journalFilters, date: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <input 
                      type="text" 
                      value={journalFilters.description} 
                      onChange={(e) => setJournalFilters({...journalFilters, description: e.target.value})}
                      placeholder="Search description..." 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select 
                      value={journalFilters.status} 
                      onChange={(e) => setJournalFilters({...journalFilters, status: e.target.value})}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">All Statuses</option>
                      <option value="Balanced">Balanced</option>
                      <option value="Unbalanced">Unbalanced</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={clearJournalFilters}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Journals Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Debit Entries</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Credit Entries</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredJournals.map((journal) => (
                      <tr key={journal.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(journal.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {journal.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="space-y-1">
                            {journal.debitEntries?.map((debit, idx) => (
                              <div key={idx} className="text-green-600 dark:text-green-400">
                                <span>{getAccountName(debit.accountCode)}</span>
                                <span className="text-gray-500 dark:text-gray-400"> - </span>
                                <span>{debit.entity}</span>
                                <span className="text-gray-500 dark:text-gray-400">: $</span>
                                <span>{parseFloat(debit.amount).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="space-y-1">
                            {journal.creditEntries?.map((credit, idx) => (
                              <div key={idx} className="text-red-600 dark:text-red-400">
                                <span>{getAccountName(credit.accountCode)}</span>
                                <span className="text-gray-500 dark:text-gray-400"> - </span>
                                <span>{credit.entity}</span>
                                <span className="text-gray-500 dark:text-gray-400">: $</span>
                                <span>{parseFloat(credit.amount).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          ${parseFloat(journal.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            journal.balanced ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {journal.balanced ? 'Balanced' : 'Unbalanced'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => editJournal(journal)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteJournal(journal.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* No Data Message */}
              {journals.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg">No journal entries found for this period.</p>
                  <p className="text-sm">Create your first consolidation journal to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ownership' && (
          <div className="space-y-6">
            {/* Ownership Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <LinkIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Total Ownerships</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{ownershipSummary?.total || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Active Ownerships</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{ownershipSummary?.active || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <Calculator className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Total Parent %</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{(ownershipSummary?.totalOwnership || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <Minus className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-600">Total NCI %</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{(ownershipSummary?.totalNCI || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-indigo-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-indigo-600">Total Goodwill</p>
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">${formatNumber(ownershipSummary?.totalGoodwill || 0)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-600">Total NCI Value</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">${formatNumber(ownershipSummary?.totalNCIValue || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ownership & NCI Structure</h2>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setShowAddOwnershipModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ownership
                  </button>
                  <button 
                    onClick={exportOwnershipsToCSV}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                  <button 
                    onClick={refreshOwnerships}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Enhanced Ownership Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Parent Entity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subsidiary Entity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Parent %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NCI %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">FV Net Assets</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Purchase Consideration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Goodwill Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Goodwill</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NCI Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valid From</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valid To</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {ownerships.map((ownership) => (
                      <tr key={ownership.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {ownership.parent_entity || ownership.parentEntity}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {ownership.subsidiary_entity || ownership.subsidiaryEntity}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                          {(ownership.ownership_percentage || ownership.ownershipPercentage || 0).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">
                          {(ownership.nci_percentage || ownership.nciPercentage || (100 - (ownership.ownership_percentage || ownership.ownershipPercentage || 0))).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ${formatNumber(ownership.fair_value_net_assets || ownership.fairValueNetAssets || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ${formatNumber(ownership.purchase_consideration || ownership.purchaseConsideration || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (ownership.relationship_type || ownership.relationshipType) === 'Acquisition'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : (ownership.relationship_type || ownership.relationshipType) === 'Merger'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : (ownership.relationship_type || ownership.relationshipType) === 'Joint Venture'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              : (ownership.relationship_type || ownership.relationshipType) === 'Restructuring/Spin-off'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {ownership.relationship_type || ownership.relationshipType || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (ownership.goodwill_method || ownership.goodwillMethod) === 'Partial' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            {ownership.goodwill_method || ownership.goodwillMethod || 'Partial'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                          ${formatNumber(ownership.goodwill_value || ownership.goodwillValue || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-purple-600">
                          ${formatNumber(ownership.nci_value || ownership.nciValue || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ownership.valid_from || ownership.validFrom || ownership.effective_date || ownership.effectiveDate}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ownership.valid_to || ownership.validTo || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                initializeEditingOwnership(ownership)
                                setShowEditOwnershipModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteOwnership(ownership.id)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {(!Array.isArray(ownerships) || ownerships.length === 0) && (
                <div className="text-center py-12">
                  <LinkIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Ownership Records Found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Create ownership structures to define parent-subsidiary relationships and calculate NCI and goodwill.
                  </p>
                  <button 
                    onClick={() => setShowAddOwnershipModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ownership
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rollforward' && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Roll Forward Management</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage balance carry-forward and period-to-period tracking</p>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setShowAddRollforwardModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Roll Forward
                  </button>
                  <button 
                    onClick={exportRollforwardToCSV}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Total Accounts</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{rollforwardAccounts.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Finalized</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-blue-100">
                        {rollforwardAccounts.filter(item => item.status === 'finalized').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">In Review</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                        {rollforwardAccounts.filter(item => item.status === 'review').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Square className="h-8 w-8 text-gray-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {rollforwardAccounts.filter(item => item.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Roll Forward Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Previous Period</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Opening Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Movements</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Adjustments</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Eliminations</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Closing Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {rollforwardAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {account.entity_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div>
                            <div className="font-medium">{account.account_code || 'N/A'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{account.account_name || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {account.previous_period || 'N/A'} {account.previous_year || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ConsolidationService.formatCurrency(account.opening_balance || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ConsolidationService.formatCurrency(account.movements || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ConsolidationService.formatCurrency(account.adjustments || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {ConsolidationService.formatCurrency(account.eliminations || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {ConsolidationService.formatCurrency(account.closing_balance || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            value={account.status || 'pending'}
                            onChange={(e) => handleRollforwardStatusChange(account.id, e.target.value)}
                            className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getRollforwardStatusColor(account.status || 'pending')}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="review">Review</option>
                            <option value="finalized">Finalized</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditRollforward(account)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteRollforward(account.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'additional-rules' && (
          <div className="space-y-6">
            {/* Additional Rules Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Consolidation Rules</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Create custom rules for reclassifications, eliminations, allocations, and adjustments
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleSimulateRules}
                    disabled={additionalRules.length === 0}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Simulate Rules
                  </button>
                  <button 
                    onClick={handleApplyRules}
                    disabled={additionalRules.length === 0}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Apply Rules
                  </button>
                  <button 
                    onClick={() => setShowAddRuleModal(true)}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Total Rules</h4>
                  <p className="text-2xl font-bold text-blue-600">{additionalRules.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">rules created</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Active Rules</h4>
                  <p className="text-2xl font-bold text-green-600">{additionalRules.filter(r => r.is_active).length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">rules active</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Rule Types</h4>
                  <p className="text-2xl font-bold text-purple-600">{new Set(additionalRules.map(r => r.rule_type)).size}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">different types</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Last Applied</h4>
                  <p className="text-2xl font-bold text-orange-600">-</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">not yet applied</p>
                </div>
              </div>
            </div>

            {/* Rule Templates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rule Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {ruleTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Use Template
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {template.template.rule_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Existing Rules</h3>
              {additionalRules.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Rules Created</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Create your first consolidation rule to get started.
                  </p>
                  <button
                    onClick={() => setShowAddRuleModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Rule
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {additionalRules.map((rule) => (
                    <div key={rule.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">{rule.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            rule.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {rule.rule_type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleRuleStatus(rule)}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${
                              rule.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                            }`}
                          >
                            {rule.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => editRule(rule)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {rule.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{rule.description}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Priority:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{rule.priority}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Conditions:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{rule.conditions?.length || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Actions:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{rule.actions?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'consolidation' && (
          <div className="space-y-6">
            {/* Consolidation Engine */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Consolidation Engine</h2>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={runConsolidation}
                    disabled={selectedEntities.length === 0 || consolidationStatus === 'running'}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <PieChart className="h-4 w-4 mr-2" />
                    Run Consolidation
                  </button>
                  <button 
                    onClick={generateConsolidatedFinancials}
                    disabled={consolidationStatus !== 'completed'}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Financial Statements
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Selected Entities</h4>
                  <p className="text-2xl font-bold text-blue-600">{selectedEntities.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">entities selected</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Consolidation Status</h4>
                  <p className="text-2xl font-bold text-green-600 capitalize">{consolidationStatus}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">current status</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">IC Eliminations</h4>
                  <p className="text-2xl font-bold text-red-600">{consolidationResults?.eliminations?.length || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">transactions eliminated</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Total Assets</h4>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(consolidationResults?.totalAssets || 0)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">consolidated</p>
                </div>
              </div>
            </div>

            {/* FST Template Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Statement Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      id="balance-sheet"
                      checked={selectedTemplates.includes('balance-sheet')}
                      onChange={(e) => handleTemplateSelection('balance-sheet', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="balance-sheet" className="font-medium text-gray-900 dark:text-white">Balance Sheet</label>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Assets, Liabilities, and Equity</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      id="income-statement"
                      checked={selectedTemplates.includes('income-statement')}
                      onChange={(e) => handleTemplateSelection('income-statement', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="income-statement" className="font-medium text-gray-900 dark:text-white">Income Statement</label>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Revenue, Expenses, and Net Income</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      id="cash-flow"
                      checked={selectedTemplates.includes('cash-flow')}
                      onChange={(e) => handleTemplateSelection('cash-flow', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="cash-flow" className="font-medium text-gray-900 dark:text-white">Cash Flow Statement</label>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Operating, Investing, and Financing</p>
                </div>
              </div>
            </div>

            {/* Consolidation Results */}
            {consolidationResults && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Consolidation Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(consolidationResults.totalAssets)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Liabilities</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(consolidationResults.totalLiabilities)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Income</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(consolidationResults.netIncome)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Equity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(consolidationResults.equity)}</p>
                  </div>
                </div>
                
                {/* IC Eliminations Summary */}
                {consolidationResults.eliminations && consolidationResults.eliminations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Intercompany Eliminations</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Eliminations</p>
                          <p className="text-xl font-bold text-red-600">{consolidationResults.eliminations.length}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                          <p className="text-xl font-bold text-red-600">
                            {formatCurrency(consolidationResults.eliminations.reduce((sum, e) => sum + e.amount, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                          <p className="text-xl font-bold text-green-600">Completed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Results */}
                {consolidationResults.validation && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Validation Results</h4>
                    <div className="space-y-3">
                      {consolidationResults.validation.errors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">Errors ({consolidationResults.validation.errors.length})</h5>
                          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                            {consolidationResults.validation.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {consolidationResults.validation.warnings.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Warnings ({consolidationResults.validation.warnings.length})</h5>
                          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                            {consolidationResults.validation.warnings.map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {consolidationResults.validation.errors.length === 0 && consolidationResults.validation.warnings.length === 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <h5 className="font-medium text-green-800 dark:text-green-200">Validation Passed</h5>
                          <p className="text-sm text-green-700 dark:text-green-300">No errors or warnings found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generated Financial Statements */}
            {consolidatedFinancials && consolidatedFinancials.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Financial Statements</h3>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={exportConsolidatedFinancials}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </button>
                    <button 
                      onClick={viewConsolidatedFinancials}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {consolidatedFinancials.map((statement, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{statement.templateName}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Assets:</span>
                          <span className="font-medium">{formatCurrency(statement.totalAssets)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Liabilities:</span>
                          <span className="font-medium">{formatCurrency(statement.totalLiabilities)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Equity:</span>
                          <span className="font-medium">{formatCurrency(statement.totalEquity)}</span>
                        </div>
                        {statement.totalRevenue > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Revenue:</span>
                            <span className="font-medium">{formatCurrency(statement.totalRevenue)}</span>
                          </div>
                        )}
                        {statement.totalExpenses > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Expenses:</span>
                            <span className="font-medium">{formatCurrency(statement.totalExpenses)}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Generated: {new Date(statement.generatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Consolidation Results */}
      {consolidationResults && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Consolidation Results</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Financial summary of consolidated entities</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(consolidationResults.totalAssets)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Liabilities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(consolidationResults.totalLiabilities)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Income</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(consolidationResults.netIncome)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Equity</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(consolidationResults.equity)}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Consolidated {consolidationResults.entities} entities</span>
                <span>Completed: {new Date(consolidationResults.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entities List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Entities</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage consolidation entities and ownership</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search entities..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <Filter className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {entities.map((entity) => (
              <div key={entity.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedEntities.includes(entity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEntities([...selectedEntities, entity])
                        } else {
                          setSelectedEntities(selectedEntities.filter(e => e.id !== entity.id))
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{entity.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEntityTypeColor(entity.type)}`}>
                          {entity.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{entity.ownership}% ownership</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">• {entity.country}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">• {entity.currency}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(entity.totalAssets)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Assets</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(entity.netIncome)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Net Income</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEntity(entity.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Entity Modal */}
      {showAddEntity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Entity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity Name</label>
                <input
                  type="text"
                  value={newEntity.name}
                  onChange={(e) => setNewEntity({...newEntity, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter entity name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity Type</label>
                <select
                  value={newEntity.type}
                  onChange={(e) => setNewEntity({...newEntity, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="subsidiary">Subsidiary</option>
                  <option value="joint_venture">Joint Venture</option>
                  <option value="associate">Associate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ownership %</label>
                <input
                  type="number"
                  value={newEntity.ownership}
                  onChange={(e) => setNewEntity({...newEntity, ownership: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                <input
                  type="text"
                  value={newEntity.country}
                  onChange={(e) => setNewEntity({...newEntity, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                <select
                  value={newEntity.currency}
                  onChange={(e) => setNewEntity({...newEntity, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddEntity}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Entity
              </button>
              <button
                onClick={() => setShowAddEntity(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit IC Transaction Modal */}
      {showAddICTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New IC Transaction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Entity <span className="text-red-500">*</span>
                </label>
                <select
                  value={newICTransaction.entity_id}
                  onChange={(e) => setNewICTransaction({...newICTransaction, entity_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Entity</option>
                  {(contextEntities && contextEntities.length > 0 ? contextEntities : entities).map(entity => (
                    <option key={entity.id || entity.entity_code} value={entity.id || entity.entity_code}>
                      {entity.entity_name || entity.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Counterparty Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Counterparty <span className="text-red-500">*</span>
                </label>
                <select
                  value={newICTransaction.counterparty_id}
                  onChange={(e) => setNewICTransaction({...newICTransaction, counterparty_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Counterparty</option>
                  {(contextEntities && contextEntities.length > 0 ? contextEntities : entities).map(entity => (
                    <option key={entity.id || entity.entity_code} value={entity.id || entity.entity_code}>
                      {entity.entity_name || entity.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Entity Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={newICTransaction.entity_account_id}
                  onChange={(e) => setNewICTransaction({...newICTransaction, entity_account_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Entity Account</option>
                  {(contextAccounts && contextAccounts.length > 0 ? contextAccounts : ifrsAccounts).map(account => (
                    <option key={account.id || account.account_code} value={account.id || account.account_code}>
                      {account.account_code} - {account.description || account.account_name || 'No Description'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Counterparty Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Counterparty Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={newICTransaction.counterparty_account_id}
                  onChange={(e) => setNewICTransaction({...newICTransaction, counterparty_account_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Counterparty Account</option>
                  {(contextAccounts && contextAccounts.length > 0 ? contextAccounts : ifrsAccounts).map(account => (
                    <option key={account.id || account.account_code} value={account.id || account.account_code}>
                      {account.account_code} - {account.description || account.account_name || 'No Description'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transaction Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newICTransaction.transaction_category}
                  onChange={(e) => setNewICTransaction({...newICTransaction, transaction_category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Category</option>
                  <option value="receivable">Receivable</option>
                  <option value="payable">Payable</option>
                  <option value="loan">Loan</option>
                  <option value="dividend">Dividend</option>
                  <option value="service">Service</option>
                  <option value="other">Other</option>
                </select>
              </div>



              {/* Debit Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Debit Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newICTransaction.debit_amount || ''}
                  onChange={(e) => setNewICTransaction({...newICTransaction, debit_amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter debit amount"
                />
              </div>

              {/* Credit Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Credit Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newICTransaction.credit_amount || ''}
                  onChange={(e) => setNewICTransaction({...newICTransaction, credit_amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter credit amount"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                <select
                  value={newICTransaction.currency}
                  onChange={(e) => setNewICTransaction({...newICTransaction, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>

              {/* Transaction Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Date</label>
                <input
                  type="date"
                  value={newICTransaction.transaction_date}
                  onChange={(e) => setNewICTransaction({...newICTransaction, transaction_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
                <select
                  value={newICTransaction.period}
                  onChange={(e) => setNewICTransaction({...newICTransaction, period: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                <select
                  value={newICTransaction.year}
                  onChange={(e) => setNewICTransaction({...newICTransaction, year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              {/* Elimination Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Elimination Status</label>
                <select
                  value={newICTransaction.elimination}
                  onChange={(e) => setNewICTransaction({...newICTransaction, elimination: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="no">No (Include in consolidation)</option>
                  <option value="yes">Yes (Eliminate from consolidation)</option>
                </select>
              </div>
            </div>

            {/* Description - Full Width */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={newICTransaction.description}
                onChange={(e) => setNewICTransaction({...newICTransaction, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
                placeholder="Enter transaction description"
              />
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddICTransaction}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add IC Transaction
              </button>
              <button
                onClick={() => setShowAddICTransaction(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Consolidation Journal Modal */}
      {showAddJournalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Consolidation Journal Entry</h3>
            
            {/* Debug Info - Remove in production */}
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Available Accounts: {ifrsAccounts.length}</p>
              <p>Available Entities: {entities.length}</p>
              <p>First Account: {ifrsAccounts[0] ? `${ifrsAccounts[0].account_code} - ${ifrsAccounts[0].account_name}` : 'None'}</p>
              <p>First Entity: {entities[0] ? entities[0].entity_name : 'None'}</p>
              <p>Accounts Data Type: {Array.isArray(ifrsAccounts) ? 'Array' : typeof ifrsAccounts}</p>
              <p>Sample Account Keys: {ifrsAccounts[0] ? Object.keys(ifrsAccounts[0]).join(', ') : 'None'}</p>
            </div>
            
            <div className="space-y-6">
              {/* Journal Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={newJournal.date} 
                    onChange={(e) => setNewJournal({...newJournal, date: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <input 
                    type="text" 
                    value={newJournal.description} 
                    onChange={(e) => setNewJournal({...newJournal, description: e.target.value})}
                    placeholder="Journal description" 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Debit Entries Section */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-green-700 dark:text-green-400">
                    <Plus className="h-4 w-4 mr-2 inline" />
                    Debit Entries
                  </h4>
                  <button 
                    onClick={addDebitEntry}
                    className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Debit
                  </button>
                </div>
                
                <div className="space-y-3">
                  {newJournal.debitEntries.map((debit, index) => (
                    <div key={debit.id} className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
                          <select 
                            value={debit.accountCode} 
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.debitEntries]
                              updatedEntries[index].accountCode = e.target.value
                              setNewJournal({...newJournal, debitEntries: updatedEntries})
                            }}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select Account</option>
                            {ifrsAccounts.map(account => (
                              <option key={account.account_code} value={account.account_code}>
                                {account.account_code} - {account.account_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Entity</label>
                          <select 
                            value={debit.entity} 
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.debitEntries]
                              updatedEntries[index].entity = e.target.value
                              setNewJournal({...newJournal, debitEntries: updatedEntries})
                            }}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select Entity</option>
                            {entities.map(entity => (
                              <option key={entity.id} value={entity.entity_name}>
                                {entity.entity_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                          <input 
                            type="number" 
                            value={debit.amount} 
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.debitEntries]
                              updatedEntries[index].amount = e.target.value
                              setNewJournal({...newJournal, debitEntries: updatedEntries})
                            }}
                            placeholder="0.00" 
                            step="0.01" 
                            min="0" 
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => removeDebitEntry(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Credit Entries Section */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-red-700 dark:text-red-400">
                    <Minus className="h-4 w-4 mr-2 inline" />
                    Credit Entries
                  </h4>
                  <button 
                    onClick={addCreditEntry}
                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Credit
                  </button>
                </div>
                
                <div className="space-y-3">
                  {newJournal.creditEntries.map((credit, index) => (
                    <div key={credit.id} className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
                          <select 
                            value={credit.accountCode} 
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.creditEntries]
                              updatedEntries[index].accountCode = e.target.value
                              setNewJournal({...newJournal, creditEntries: updatedEntries})
                            }}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select Account</option>
                            {ifrsAccounts.map(account => (
                              <option key={account.account_code} value={account.account_code}>
                                {account.account_code} - {account.account_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Entity</label>
                          <select 
                            value={credit.entity} 
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.creditEntries]
                              updatedEntries[index].entity = e.target.value
                              setNewJournal({...newJournal, creditEntries: updatedEntries})
                            }}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select Entity</option>
                            {entities.map(entity => (
                              <option key={entity.id} value={entity.entity_name}>
                                {entity.entity_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                          <input 
                            type="number" 
                            value={credit.amount} 
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.creditEntries]
                              updatedEntries[index].amount = e.target.value
                              setNewJournal({...newJournal, creditEntries: updatedEntries})
                            }}
                            placeholder="0.00" 
                            step="0.01" 
                            min="0" 
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => removeCreditEntry(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balance Validation */}
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        Total Debits: ${newJournal.debitEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        Total Credits: ${newJournal.creditEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium ${
                        Math.abs(newJournal.debitEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0) - 
                                 newJournal.creditEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)) < 0.01 
                          ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        Balance: ${Math.abs(newJournal.debitEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0) - 
                                           newJournal.creditEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`text-sm font-medium ${
                      Math.abs(newJournal.debitEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0) - 
                               newJournal.creditEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)) < 0.01 
                        ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {Math.abs(newJournal.debitEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0) - 
                                newJournal.creditEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)) < 0.01 
                        ? '✅ Journal is balanced and ready to post' 
                        : '❌ Journal is unbalanced - cannot post'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={postJournal}
                disabled={!canPostJournal()}
                className={`px-4 py-2 rounded-md text-white ${
                  canPostJournal() 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus className="h-4 w-4 mr-2 inline" />
                Post Journal
              </button>
              <button 
                onClick={() => setShowAddJournalModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <X className="h-4 w-4 mr-2 inline" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ownership Modal */}
      {showAddOwnershipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Ownership Structure</h3>
                <button 
                  onClick={() => setShowAddOwnershipModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parent Entity *
                  </label>
                  <select
                    value={newOwnership.parentEntity}
                    onChange={(e) => setNewOwnership(prev => ({ ...prev, parentEntity: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Parent Entity</option>
                    {entities.map(entity => (
                      <option key={entity.id} value={entity.entity_name}>
                        {entity.entity_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subsidiary Entity *
                  </label>
                  <select
                    value={newOwnership.subsidiaryEntity}
                    onChange={(e) => setNewOwnership(prev => ({ ...prev, subsidiaryEntity: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Subsidiary Entity</option>
                    {entities.map(entity => (
                      <option key={entity.id} value={entity.entity_name}>
                        {entity.entity_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ownership and Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ownership Percentage * (%)
                  </label>
                  <input
                    type="number"
                    value={newOwnership.ownershipPercentage}
                    onChange={(e) => setNewOwnership(prev => ({ ...prev, ownershipPercentage: e.target.value }))}
                    onBlur={calculateOwnershipAndNCI}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    NCI Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={newOwnership.nciPercentage}
                    readOnly
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    value={newOwnership.effectiveDate}
                    onChange={(e) => setNewOwnership(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Financial Values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fair Value of Net Assets *
                  </label>
                  <input
                    type="number"
                    value={newOwnership.fairValueNetAssets}
                    onChange={(e) => setNewOwnership(prev => ({ ...prev, fairValueNetAssets: e.target.value }))}
                    onBlur={calculateGoodwill}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Consideration
                  </label>
                  <input
                    type="number"
                    value={newOwnership.purchaseConsideration}
                    onChange={(e) => setNewOwnership(prev => ({ ...prev, purchaseConsideration: e.target.value }))}
                    onBlur={calculateGoodwill}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Relationship Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Relationship Type *
                </label>
                <select
                  value={newOwnership.relationshipType}
                  onChange={(e) => setNewOwnership(prev => ({ ...prev, relationshipType: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Relationship Type</option>
                  <option value="Acquisition">Acquisition</option>
                  <option value="Merger">Merger</option>
                  <option value="Joint Venture">Joint Venture</option>
                  <option value="Restructuring/Spin-off">Restructuring/Spin-off</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Goodwill Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goodwill Method
                </label>
                <select
                  value={newOwnership.goodwillMethod}
                  onChange={(e) => setNewOwnership(prev => ({ ...prev, goodwillMethod: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Partial">Partial Goodwill (Parent share only)</option>
                  <option value="Full">Full Goodwill (Includes NCI share)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newOwnership.description}
                  onChange={(e) => setNewOwnership(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description of the ownership relationship..."
                  rows="3"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Valid Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    value={newOwnership.validFrom}
                    onChange={(e) => setNewOwnership(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid To (Optional)
                  </label>
                  <input
                    type="date"
                    value={newOwnership.validTo}
                    onChange={(e) => setNewOwnership(prev => ({ ...prev, validTo: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium text-green-600">Ownership: <span className="font-bold">{newOwnership.ownershipPercentage || 0}%</span></span>
                    </div>
                    <div>
                      <span className="font-medium text-red-600">NCI: <span className="font-bold">{newOwnership.nciPercentage || 0}%</span></span>
                    </div>
                    <div>
                      <span className="font-medium text-indigo-600">Goodwill: <span className="font-bold">${formatNumber(newOwnership.goodwillValue || 0)}</span></span>
                    </div>
                    <div>
                      <span className="font-medium text-purple-600">NCI Value: <span className="font-bold">${formatNumber(newOwnership.nciValue || 0)}</span></span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                    <div>
                      <span className="font-medium">Method: {newOwnership.goodwillMethod === 'Partial' ? 'Partial Goodwill' : 'Full Goodwill'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Type: {newOwnership.relationshipType || 'Not Selected'}</span>
                    </div>
                    <div>
                      <span className="font-medium">FV Net Assets: ${formatNumber(newOwnership.fairValueNetAssets || 0)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <div className="mb-1">
                      <strong>Partial Goodwill:</strong> Purchase Consideration - (Parent % × FV Net Assets)
                    </div>
                    <div>
                      <strong>Full Goodwill:</strong> FV Net Assets - Purchase Consideration
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setShowAddOwnershipModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddOwnership}
                disabled={!canAddOwnership()}
                className={`px-4 py-2 rounded-md text-white ${
                  canAddOwnership() 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus className="h-4 w-4 mr-2 inline" />
                Add Ownership
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ownership Modal */}
      {showEditOwnershipModal && editingOwnership && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Ownership Structure</h3>
                <button 
                  onClick={() => setShowEditOwnershipModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parent Entity *
                  </label>
                  <select
                    value={editingOwnership.parentEntity}
                    onChange={(e) => setEditingOwnership(prev => ({ ...prev, parentEntity: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Parent Entity</option>
                    {entities.map(entity => (
                      <option key={entity.id} value={entity.entity_name}>
                        {entity.entity_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subsidiary Entity *
                  </label>
                  <select
                    value={editingOwnership.subsidiaryEntity}
                    onChange={(e) => setEditingOwnership(prev => ({ ...prev, subsidiaryEntity: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Subsidiary Entity</option>
                    {entities.map(entity => (
                      <option key={entity.id} value={entity.entity_name}>
                        {entity.entity_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ownership and Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ownership Percentage * (%)
                  </label>
                  <input
                    type="number"
                    value={editingOwnership.ownershipPercentage}
                    onChange={(e) => setEditingOwnership(prev => ({ ...prev, ownershipPercentage: e.target.value }))}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    NCI Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={editingOwnership.nciPercentage}
                    readOnly
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    value={editingOwnership.effectiveDate}
                    onChange={(e) => setEditingOwnership(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Financial Values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fair Value of Net Assets *
                  </label>
                  <input
                    type="number"
                    value={editingOwnership.fairValueNetAssets}
                    onChange={(e) => setEditingOwnership(prev => ({ ...prev, fairValueNetAssets: e.target.value }))}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Consideration
                  </label>
                  <input
                    type="number"
                    value={editingOwnership.purchaseConsideration}
                    onChange={(e) => setEditingOwnership(prev => ({ ...prev, purchaseConsideration: e.target.value }))}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Relationship Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Relationship Type *
                </label>
                <select
                  value={editingOwnership.relationshipType}
                  onChange={(e) => setEditingOwnership(prev => ({ ...prev, relationshipType: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Relationship Type</option>
                  <option value="Acquisition">Acquisition</option>
                  <option value="Merger">Merger</option>
                  <option value="Joint Venture">Joint Venture</option>
                  <option value="Restructuring/Spin-off">Restructuring/Spin-off</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Goodwill Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goodwill Method
                </label>
                <select
                  value={editingOwnership.goodwillMethod}
                  onChange={(e) => setEditingOwnership(prev => ({ ...prev, goodwillMethod: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Partial">Partial Goodwill (Parent share only)</option>
                  <option value="Full">Full Goodwill (Includes NCI share)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editingOwnership.description}
                  onChange={(e) => setEditingOwnership(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description of the ownership relationship..."
                  rows="3"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Valid Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    value={editingOwnership.validFrom}
                    onChange={(e) => setEditingOwnership(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid To (Optional)
                  </label>
                  <input
                    type="date"
                    value={editingOwnership.validTo}
                    onChange={(e) => setEditingOwnership(prev => ({ ...prev, validTo: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setShowEditOwnershipModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditOwnership}
                disabled={!canEditOwnership()}
                className={`px-4 py-2 rounded-md text-white ${
                  canEditOwnership() 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Edit className="h-4 w-4 mr-2 inline" />
                Update Ownership
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roll Forward Add Modal */}
      {showAddRollforwardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Roll Forward Entry</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entity</label>
                <select
                  value={newRollforward.entity_id}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, entity_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Entity</option>
                  {entities.map(entity => (
                    <option key={entity.id} value={entity.id}>{entity.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account</label>
                <select
                  value={newRollforward.account_id}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, account_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Account</option>
                  {ifrsAccounts.map(account => (
                    <option key={account.id} value={account.id}>{account.account_code} - {account.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Previous Period</label>
                <select
                  value={newRollforward.previous_period}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, previous_period: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Period</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Previous Year</label>
                <input
                  type="text"
                  value={newRollforward.previous_year}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, previous_year: e.target.value }))}
                  placeholder="2024"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRollforward.opening_balance}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, opening_balance: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Movements</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRollforward.movements}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, movements: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adjustments</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRollforward.adjustments}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, adjustments: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eliminations</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRollforward.eliminations}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, eliminations: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Effective Date</label>
                <input
                  type="date"
                  value={newRollforward.effective_date}
                  onChange={(e) => setNewRollforward(prev => ({ ...prev, effective_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                value={newRollforward.notes}
                onChange={(e) => setNewRollforward(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddRollforwardModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRollforward}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roll Forward Edit Modal */}
      {showEditRollforwardModal && editingRollforward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Roll Forward Entry</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entity</label>
                <input
                  type="text"
                  value={editingRollforward.entity_name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account</label>
                <input
                  type="text"
                  value={`${editingRollforward.account_code} - ${editingRollforward.account_name}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingRollforward.opening_balance}
                  onChange={(e) => setEditingRollforward(prev => ({ ...prev, opening_balance: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Movements</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingRollforward.movements}
                  onChange={(e) => setEditingRollforward(prev => ({ ...prev, movements: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adjustments</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingRollforward.adjustments}
                  onChange={(e) => setEditingRollforward(prev => ({ ...prev, adjustments: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eliminations</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingRollforward.eliminations}
                  onChange={(e) => setEditingRollforward(prev => ({ ...prev, eliminations: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={editingRollforward.status}
                  onChange={(e) => setEditingRollforward(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="review">Review</option>
                  <option value="finalized">Finalized</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                value={editingRollforward.notes}
                onChange={(e) => setEditingRollforward(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEditRollforwardModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRollforward}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Rule</h3>
              <button
                onClick={() => setShowAddRuleModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rule Name</label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rule Type</label>
                  <select
                    value={newRule.rule_type}
                    onChange={(e) => setNewRule(prev => ({ ...prev, rule_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="reclassify">Reclassify</option>
                    <option value="elimination">Elimination</option>
                    <option value="allocation">Allocation</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter rule description"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <input
                    type="number"
                    value={newRule.priority}
                    onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                  />
                </div>
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    checked={newRule.is_active}
                    onChange={(e) => setNewRule(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddRuleModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRule}
                disabled={!newRule.name || !newRule.rule_type}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {showEditRuleModal && editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Rule</h3>
              <button
                onClick={() => setShowEditRuleModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rule Name</label>
                  <input
                    type="text"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rule Type</label>
                  <select
                    value={editingRule.rule_type}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, rule_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="reclassify">Reclassify</option>
                    <option value="elimination">Elimination</option>
                    <option value="allocation">Allocation</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={editingRule.description}
                  onChange={(e) => setEditingRule(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <input
                    type="number"
                    value={editingRule.priority}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                  />
                </div>
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    checked={editingRule.is_active}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditRuleModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleEditRule}
                disabled={!editingRule.name || !editingRule.rule_type}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Update Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Results Modal */}
      {showSimulationModal && simulationResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rules Simulation Results</h3>
              <button
                onClick={() => setShowSimulationModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Rules Applied</h4>
                  <p className="text-2xl font-bold text-blue-600">{simulationResults.rulesApplied}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-100">Total Adjustments</h4>
                  <p className="text-2xl font-bold text-green-600">${simulationResults.totalAdjustments.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">Affected Accounts</h4>
                  <p className="text-2xl font-bold text-purple-600">{simulationResults.affectedAccounts}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900 dark:text-orange-100">Affected Entities</h4>
                  <p className="text-2xl font-bold text-orange-600">{simulationResults.affectedEntities}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Simulation Summary</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The simulation shows that {simulationResults.rulesApplied} rules would be applied, 
                  affecting {simulationResults.affectedAccounts} accounts across {simulationResults.affectedEntities} entities, 
                  with a total adjustment value of ${simulationResults.totalAdjustments.toLocaleString()}.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSimulationModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={handleApplyRules}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Apply Rules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Consolidation