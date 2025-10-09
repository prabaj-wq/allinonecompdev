import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Edit,
  Trash2,
  FileText,
  Calendar,
  Building2,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  Info,
  Clock,
  Users,
  Activity,
  BookOpen,
  Save,
  Folder,
  FolderPlus,
  BarChart3
} from 'lucide-react'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'

const JournalEntries = () => {
  const { selectedCompany, ifrsAccounts, entities } = useCompany()
  const { isAuthenticated, getAuthHeaders } = useAuth()
  
  // State management
  const [accounts, setAccounts] = useState([])
  const [localEntities, setLocalEntities] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [journals, setJournals] = useState([])
  const [journalCategories, setJournalCategories] = useState([])
  const [selectedJournalCategory, setSelectedJournalCategory] = useState(null)
  const [showJournalModal, setShowJournalModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  
  // Period and year selection for journals
  const [journalsPeriod, setJournalsPeriod] = useState('')
  const [journalsYear, setJournalsYear] = useState('')
  
  // Journal form state
  const [newJournal, setNewJournal] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    debitEntries: [],
    creditEntries: []
  })
  const [editingJournal, setEditingJournal] = useState(null)
  
  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    category_code: '',
    category_name: '',
    description: ''
  })
  

  // Available periods and years
  const periods = [
    'Q1', 'Q2', 'Q3', 'Q4',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const years = ['2025', '2024', '2023', '2022']
  const journalTypes = ['General', 'Adjusting', 'Closing', 'Reversing', 'Opening']
  
  // Load accounts and entities on component mount
  useEffect(() => {
    if (isAuthenticated && selectedCompany) {
      loadAccountsAndEntities()
    }
  }, [isAuthenticated, selectedCompany])

  // Load journals data when journals period/year changes
  useEffect(() => {
    if (journalsPeriod && journalsYear) {
      loadJournals(journalsPeriod, journalsYear)
      loadJournalCategories(true, journalsPeriod, journalsYear)
    }
  }, [journalsPeriod, journalsYear])

  // Core functions
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000)
  }, [])


  // ===== JOURNAL FUNCTIONS =====
  
  const loadAccountsAndEntities = async () => {
    if (!isAuthenticated) {
      console.error('❌ User not authenticated')
      return
    }
    
    setIsLoading(true)
    try {
      console.log('🔍 Loading accounts and entities for company:', selectedCompany)
      
      // Load accounts from API
      const accountsResponse = await fetch('/api/ifrs-accounts', {
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        const companyAccounts = accountsData.accounts || []
        setAccounts(companyAccounts)
        console.log('📊 Loaded accounts from API:', companyAccounts.length)
      } else {
        console.error('❌ Failed to load accounts from API:', accountsResponse.status)
        if (ifrsAccounts && ifrsAccounts.length > 0) {
          setAccounts(ifrsAccounts)
          console.log('📊 Using CompanyContext accounts as fallback:', ifrsAccounts.length)
        }
      }
      
      // Load entities from API
      const entitiesResponse = await fetch('/api/entities', {
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      
      if (entitiesResponse.ok) {
        const entitiesData = await entitiesResponse.json()
        const companyEntities = entitiesData.entities || []
        setLocalEntities(companyEntities)
        console.log('📊 Loaded entities from API:', companyEntities.length)
      } else {
        console.error('❌ Failed to load entities from API:', entitiesResponse.status)
        if (entities && entities.length > 0) {
          setLocalEntities(entities)
          console.log('📊 Using CompanyContext entities as fallback:', entities.length)
        }
      }
      
    } catch (error) {
      console.error('💥 Error in loadAccountsAndEntities:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const loadJournals = async (period = null, year = null) => {
    const targetPeriod = period || journalsPeriod
    const targetYear = year || journalsYear
    
    if (!targetPeriod || !targetYear) {
      console.warn('⏭️ Skipping journals load: no period/year selected')
      setJournals([])
      return
    }
    
    try {
      console.log('🔍 Loading journals...')
      let url = `/api/process/journals?period=${targetPeriod}&year=${parseInt(targetYear)}&source_type=journal`
      console.log('📡 Journal URL:', url)
      const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      console.log('📡 Journal response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Journal data:', data)
        console.log('📊 Journals array:', data.journals)
        const journalsArray = data.journals || []
        setJournals(journalsArray)
        console.log(`✅ Loaded ${journalsArray.length} journals`)
        console.log('📊 Journal details:', journalsArray.map(j => ({ 
          id: j.id, 
          category_id: j.category_id, 
          journal_number: j.journal_number,
          period: j.period,
          year: j.year
        })))
        console.log('📊 All journal category_ids:', journalsArray.map(j => j.category_id))
        console.log('📊 First journal full structure:', journalsArray[0])
      } else {
        console.error('❌ Failed to load journals:', response.status)
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        setJournals([])
      }
    } catch (error) {
      console.error('💥 Error loading journals:', error)
      setJournals([])
    }
  }

  const loadJournalCategories = async (includePeriodFilter = false, period = null, year = null) => {
    try {
      console.log('🔍 Loading journal categories...')
      let url = '/api/process/journal-categories'
      const targetPeriod = period || journalsPeriod
      const targetYear = year || journalsYear
      
      if (includePeriodFilter && targetPeriod && targetYear) {
        url += `?period=${targetPeriod}&year=${parseInt(targetYear)}&source_type=category`
        console.log('📅 Filtering categories by period:', targetPeriod, targetYear)
      }
      console.log('📡 Categories URL:', url)
      const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      console.log('📡 Categories response status:', response.status)
      if (response.ok) {
      const data = await response.json()
        console.log('📊 Journal categories data:', data)
        console.log('📊 Categories array:', data.categories)
        setJournalCategories(data.categories || [])
        console.log(`✅ Loaded ${data.categories?.length || 0} journal categories`)
        console.log('📊 Updated journalCategories state:', data.categories)
        console.log('📊 Category details:', data.categories?.map(c => ({ 
          id: c.id, 
          category_code: c.category_code, 
          category_name: c.category_name,
          full_category: c
        })))
      } else {
        console.error('❌ Failed to load journal categories:', response.status)
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        setJournalCategories([])
      }
    } catch (error) {
      console.error('💥 Error loading journal categories:', error)
      setJournalCategories([])
    }
  }

  const handleCategoryClick = (category) => {
    setSelectedJournalCategory(category)
    console.log('📁 Selected category:', category)
    console.log('📁 Category ID:', category.id, 'Type:', typeof category.id)
    console.log('📊 Current journals:', journals)
    console.log('📊 All journal category_ids:', journals.map(j => ({ id: j.id, category_id: j.category_id, type: typeof j.category_id })))
    const categoryJournals = journals.filter(journal => journal.category_id === category.id)
    console.log('🔍 Journals for this category:', categoryJournals)
    console.log('🔍 Filtering logic - looking for category_id ===', category.id)
  }

  const handleCreateCategory = async () => {
    if (!categoryForm.category_code || !categoryForm.category_name) {
      showNotification('Please fill in all required fields', 'error')
      return
    }
    if (!journalsPeriod || !journalsYear) {
      showNotification('Please select period and year first', 'error')
      return
    }
    if (isCreatingCategory) return
    
    try {
      setIsCreatingCategory(true)
      const payload = {
        ...categoryForm,
        period: journalsPeriod,
        year: journalsYear
      }
      console.log('📤 Creating category:', payload)
      
      const resp = await fetch('/api/process/journal-categories', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      
      if (resp.ok) {
        showNotification('Category created successfully!', 'success')
        setShowCategoryModal(false)
        setCategoryForm({ category_code: '', category_name: '', description: '' })
        await loadJournalCategories(true, journalsPeriod, journalsYear)
      } else {
        const err = await resp.json()
        showNotification(err.detail || 'Failed to create category', 'error')
      }
    } catch (e) {
      console.error(e)
      showNotification('Error creating category', 'error')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const handleDeleteCategory = async (categoryId, categoryCode) => {
    if (!window.confirm(`Are you sure you want to delete category "${categoryCode}"? This action cannot be undone.`)) {
      return
    }
    try {
      const response = await fetch(`/api/process/journal-categories/${categoryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      if (response.ok) {
        showNotification('Category deleted successfully!', 'success')
        await loadJournalCategories(true, journalsPeriod, journalsYear)
        // Clear selection if deleted category was selected
        if (selectedJournalCategory?.id === categoryId) {
          setSelectedJournalCategory(null)
        }
      } else {
        const error = await response.json()
        showNotification(`Failed to delete category: ${error.detail}`, 'error')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      showNotification('Error deleting category. Please try again.', 'error')
    }
  }

  // Journal entry management functions
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

  const canPostJournal = () => {
    const totalDebits = newJournal.debitEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)
    const totalCredits = newJournal.creditEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)
    return Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0
  }

  const handlePostJournal = async () => {
    if (!canPostJournal()) {
      showNotification('Journal is not balanced or has no entries', 'error')
      return
    }
    if (!selectedJournalCategory) {
      showNotification('Please select a category first', 'error')
      return
    }

    try {
      // Calculate total amount and check if balanced
      const totalDebits = newJournal.debitEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)
      const totalCredits = newJournal.creditEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)
      const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01
      
      // Check if this is an edit operation
      const isEdit = editingJournal !== null
      
      // Use the selected period and year instead of date-based conversion
      const journalData = {
        journalNumber: isEdit ? editingJournal.journal_number : `PJ-${Date.now()}`,
        date: newJournal.date,
        description: newJournal.description,
        period: journalsPeriod, // Use selected period
        year: parseInt(journalsYear), // Use selected year
        status: 'POSTED',
        totalAmount: totalDebits,
        balanced: isBalanced,
        category_id: parseInt(selectedJournalCategory.id),
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

      console.log('🔍 Journal data being sent:', journalData)
      console.log('🔍 Selected category:', selectedJournalCategory)
      console.log('🔍 Category ID being sent:', parseInt(selectedJournalCategory.id))
      console.log('🔍 Selected category ID:', selectedJournalCategory.id)

      console.log('🔍 Posting journal:', journalData)
      console.log('🔍 Is edit operation:', isEdit)

      // Add journal ID for edit operations
      if (isEdit) {
        journalData.id = editingJournal.id
      }

      const response = await fetch('/api/process/journals', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(journalData)
      })

      if (response.ok) {
        const result = await response.json()
        showNotification(isEdit ? 'Journal updated successfully!' : 'Journal posted successfully!', 'success')
        setShowJournalModal(false)
        setEditingJournal(null) // Clear editing state
        setNewJournal({
          date: new Date().toISOString().split('T')[0],
          description: '',
          debitEntries: [],
          creditEntries: []
        })
        // Reload journals with a small delay to ensure database is updated
        setTimeout(async () => {
          console.log('🔄 Reloading data after journal creation...')
          console.log('📊 Current period/year:', journalsPeriod, journalsYear)
          
          // Clear current state first
          setJournals([])
          setJournalCategories([])
          
          // Then reload
          await loadJournals()
          await loadJournalCategories(true, journalsPeriod, journalsYear)
          console.log('✅ Data reloaded after journal creation')
          
          // Force a re-render by updating state
          setJournals(prev => [...prev])
        }, 1500)
      } else {
        const error = await response.json()
        showNotification(`Error posting journal: ${error.detail}`, 'error')
      }
    } catch (error) {
      console.error('Error posting journal:', error)
      showNotification(`Error posting journal: ${error.message}`, 'error')
    }
  }

  const handleDeleteJournal = async (journalId) => {
    if (window.confirm('Are you sure you want to delete this journal?')) {
      try {
        const response = await fetch(`/api/process/journals/${journalId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include'
        })

        if (response.ok) {
          showNotification('Journal deleted successfully!', 'success')
          // Reload with delay to ensure database is updated
          setTimeout(async () => {
            console.log('🔄 Reloading data after journal deletion...')
            await loadJournals()
            await loadJournalCategories(true, journalsPeriod, journalsYear)
            console.log('✅ Data reloaded after journal deletion')
          }, 500)
        } else {
          const error = await response.json()
          showNotification(`Error deleting journal: ${error.detail}`, 'error')
        }
      } catch (error) {
        console.error('Error deleting journal:', error)
        showNotification(`Error deleting journal: ${error.message}`, 'error')
      }
    }
  }


  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Authentication Required</h2>
          <p className="text-gray-500">Please log in to access the Journal Entries module.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
              <p className="text-gray-600">Manage and create journal entries for {selectedCompany}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Process Journals</h2>
              <p className="text-gray-600">Manage journal categories and entries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Process Journals Interface */}
      <div className="space-y-6">
          {/* Period and Year Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Period and Year for Journals</h3>
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={journalsPeriod}
                  onChange={(e) => setJournalsPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                >
                  <option value="">Select Period</option>
                  {periods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={journalsYear}
                  onChange={(e) => setJournalsYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                >
                  <option value="">Select Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-shrink-0">
                <button
                  onClick={() => {
                    loadJournals(journalsPeriod, journalsYear)
                    loadJournalCategories(true, journalsPeriod, journalsYear)
                  }}
                  disabled={!journalsPeriod || !journalsYear}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load Data
                </button>
              </div>
            </div>
          </div>

          {/* Main Journal Management Interface */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex h-[600px]">
              {/* Left Sidebar - Categories */}
              <div className="w-1/3 border-r border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    disabled={!journalsPeriod || !journalsYear}
                    className={`px-3 py-1 text-white text-sm rounded-md transition-colors flex items-center ${
                      journalsPeriod && journalsYear 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Category
                  </button>
                </div>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {!journalsPeriod || !journalsYear ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm mb-3">Select period and year to view categories</p>
                    </div>
                  ) : journalCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm mb-3">No categories yet</p>
                      <button
                        onClick={() => setShowCategoryModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Add Your First Category
                      </button>
                    </div>
                  ) : (
                    journalCategories.map(category => {
                      const categoryJournals = journals.filter(journal => journal.category_id === category.id)
                      console.log(`📊 Category ${category.category_code} (ID: ${category.id}): Found ${categoryJournals.length} journals out of ${journals.length} total journals`)
                      if (categoryJournals.length > 0) {
                        console.log(`📊 Journals in ${category.category_code}:`, categoryJournals.map(j => ({ id: j.id, journal_number: j.journal_number, category_id: j.category_id })))
                      }
                      const totalDebits = categoryJournals.reduce((sum, journal) => {
                        const debits = journal.debitEntries ? journal.debitEntries.reduce((entrySum, entry) => entrySum + parseFloat(entry.amount || 0), 0) : 0
                        return sum + debits
                      }, 0)
                      const totalCredits = categoryJournals.reduce((sum, journal) => {
                        const credits = journal.creditEntries ? journal.creditEntries.reduce((entrySum, entry) => entrySum + parseFloat(entry.amount || 0), 0) : 0
                        return sum + credits
                      }, 0)
                      
                      
                      return (
                        <div
                          key={category.id}
                          onClick={() => handleCategoryClick(category)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                            selectedJournalCategory?.id === category.id
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{category.category_name}</h4>
                              <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                              <div className="flex items-center mt-2 space-x-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {categoryJournals.length} journals
                                </span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Debits: ${totalDebits.toLocaleString()}
                                </span>
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  Credits: ${totalCredits.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingCategory(category)
                                  setShowCategoryModal(true)
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteCategory(category.id, category.category_code)
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Main Panel - Journals */}
              <div className="flex-1 p-4">
                {!journalsPeriod || !journalsYear ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select Period and Year</h3>
                      <p className="text-gray-500 mb-4">
                        Please select a period and year above to start managing journal categories
                      </p>
                    </div>
                  </div>
                ) : selectedJournalCategory ? (
                  <div className="h-full flex flex-col">
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedJournalCategory.category_name} - {selectedJournalCategory.description}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Period: {journalsPeriod} {journalsYear}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            console.log('🔄 Manual refresh triggered')
                            await loadJournals()
                            await loadJournalCategories(true, journalsPeriod, journalsYear)
                            console.log('✅ Manual refresh completed')
                          }}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </button>
                        <button
                          onClick={() => {
                            setEditingJournal(null) // Clear editing state for new journal
                            setShowJournalModal(true)
                          }}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Journal
                        </button>
                      </div>
                    </div>


                    {/* Journals List */}
                    <div className="flex-1 overflow-y-auto">
                      {(() => {
                        
                        const categoryJournals = journals.filter(journal => 
                          journal.category_id === selectedJournalCategory.id
                        )
                        return categoryJournals.length === 0
                      })() ? (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 mb-3">No journals in this category</p>
                          <button
                            onClick={() => setShowJournalModal(true)}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                          >
                            Add Your First Journal
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(() => {
                            const categoryJournals = journals.filter(journal => 
                              journal.category_id === selectedJournalCategory.id
                            )
                            return categoryJournals.map(journal => (
                              <div key={journal.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-gray-900">
                                    {journal.journal_number}
                                  </h5>
                                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                    {new Date(journal.journal_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{journal.description}</p>
                                
                                <div className="mt-3 pt-2 border-t border-gray-200">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Debits:</span>
                                    <span className="font-medium text-green-600">
                                      ${journal.debitEntries ? journal.debitEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0).toLocaleString() : '0'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-600">Credits:</span>
                                    <span className="font-medium text-red-600">
                                      ${journal.creditEntries ? journal.creditEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0).toLocaleString() : '0'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      journal.status === 'POSTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {journal.status}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex justify-end space-x-2 mt-3">
                                  <button
                                    onClick={() => {
                                      setNewJournal({
                                        journal_number: journal.journal_number,
                                        description: journal.description,
                                        date: journal.date.split('T')[0], // Convert ISO date to YYYY-MM-DD
                                        period: journal.period,
                                        year: journal.year,
                                        debitEntries: journal.debitEntries,
                                        creditEntries: journal.creditEntries
                                      })
                                      setEditingJournal(journal) // Set the journal being edited
                                      setShowJournalModal(true)
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteJournal(journal.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Category</h3>
                      <p className="text-gray-500">
                        Choose a category from the sidebar to view and manage journals
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Create Journal Category'}
                </h3>
                <button
                  onClick={() => {
                    setShowCategoryModal(false)
                    setEditingCategory(null)
                    setCategoryForm({ category_code: '', category_name: '', description: '' })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category Code</label>
                  <input
                    type="text"
                    value={categoryForm.category_code}
                    onChange={(e) => setCategoryForm({...categoryForm, category_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ADJ, REV, COR"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                  <input
                    type="text"
                    value={categoryForm.category_name}
                    onChange={(e) => setCategoryForm({...categoryForm, category_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Adjustments, Reversals"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe what this category is used for"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryModal(false)
                      setEditingCategory(null)
                      setCategoryForm({ category_code: '', category_name: '', description: '' })
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    disabled={isCreatingCategory}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isCreatingCategory ? 'Creating...' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
            </div>
          </div>
        )}

      {/* Add Journal Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingJournal ? 'Edit Journal' : 'Add New Journal'}
                </h3>
                <button
                  onClick={() => {
                    setShowJournalModal(false)
                    setEditingJournal(null)
                    setNewJournal({
                      date: new Date().toISOString().split('T')[0],
                      description: '',
                      debitEntries: [],
                      creditEntries: []
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form className="space-y-6">
                {/* Journal Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={newJournal.date}
                      onChange={(e) => setNewJournal({...newJournal, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={newJournal.description}
                      onChange={(e) => setNewJournal({...newJournal, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Journal description"
                      required
                    />
                  </div>
                </div>

                {/* Debit Entries */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-900">Debit Entries</h4>
                    <button
                      type="button"
                      onClick={addDebitEntry}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Debit
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {newJournal.debitEntries.map((entry, index) => (
                      <div key={entry.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Account</label>
                          <select
                            value={entry.accountCode}
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.debitEntries]
                              updatedEntries[index].accountCode = e.target.value
                              setNewJournal({...newJournal, debitEntries: updatedEntries})
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            required
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
                          <label className="block text-xs font-medium text-gray-700 mb-1">Entity</label>
                          <select
                            value={entry.entity}
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.debitEntries]
                              updatedEntries[index].entity = e.target.value
                              setNewJournal({...newJournal, debitEntries: updatedEntries})
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            required
                          >
                            <option value="">Select Entity</option>
                            {localEntities.map(entity => (
                              <option key={entity.entity_code} value={entity.entity_code}>
                                {entity.entity_code} - {entity.entity_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={entry.amount}
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.debitEntries]
                              updatedEntries[index].amount = e.target.value
                              setNewJournal({...newJournal, debitEntries: updatedEntries})
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => removeDebitEntry(index)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            </div>

                {/* Credit Entries */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-900">Credit Entries</h4>
                    <button
                      type="button"
                      onClick={addCreditEntry}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Credit
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {newJournal.creditEntries.map((entry, index) => (
                      <div key={entry.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Account</label>
                          <select
                            value={entry.accountCode}
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.creditEntries]
                              updatedEntries[index].accountCode = e.target.value
                              setNewJournal({...newJournal, creditEntries: updatedEntries})
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            required
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
                          <label className="block text-xs font-medium text-gray-700 mb-1">Entity</label>
                          <select
                            value={entry.entity}
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.creditEntries]
                              updatedEntries[index].entity = e.target.value
                              setNewJournal({...newJournal, creditEntries: updatedEntries})
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            required
                          >
                            <option value="">Select Entity</option>
                            {localEntities.map(entity => (
                              <option key={entity.entity_code} value={entity.entity_code}>
                                {entity.entity_code} - {entity.entity_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            value={entry.amount}
                            onChange={(e) => {
                              const updatedEntries = [...newJournal.creditEntries]
                              updatedEntries[index].amount = e.target.value
                              setNewJournal({...newJournal, creditEntries: updatedEntries})
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => removeCreditEntry(index)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Balance Check */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Debits:</span>
                      <span className="ml-2 font-medium">
                        ${newJournal.debitEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0).toLocaleString()}
                      </span>
                          </div>
                    <div>
                      <span className="text-gray-600">Total Credits:</span>
                      <span className="ml-2 font-medium">
                        ${newJournal.creditEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0).toLocaleString()}
                          </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-600">Balance:</span>
                    <span className={`ml-2 font-medium ${
                      canPostJournal() ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {canPostJournal() ? '✓ Balanced' : '✗ Not Balanced'}
                          </span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJournalModal(false)
                      setNewJournal({
                        date: new Date().toISOString().split('T')[0],
                        description: '',
                        debitEntries: [],
                        creditEntries: []
                      })
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                            </button>
                  <button
                    type="button"
                    onClick={handlePostJournal}
                    disabled={!canPostJournal()}
                    className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors flex items-center ${
                      canPostJournal() 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Post Journal
                            </button>
                          </div>
              </form>
            </div>
            </div>
          </div>
        )}

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-yellow-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default JournalEntries
