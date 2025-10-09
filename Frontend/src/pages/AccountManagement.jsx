import React, { useState, useEffect, useRef } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import ProgressBar from '../components/ProgressBar'
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Layers,
  Tag,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  CheckCircle
} from 'lucide-react'

const AccountManagement = () => {
  const { selectedCompany, ifrsAccounts, entities, refreshCompanyData } = useCompany()
  const { isAuthenticated } = useAuth()
  
  const [accounts, setAccounts] = useState([])
  const [hierarchies, setHierarchies] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showHierarchyModal, setShowHierarchyModal] = useState(false)
  const [showEditHierarchyModal, setShowEditHierarchyModal] = useState(false)
  const [showDeleteHierarchyModal, setShowDeleteHierarchyModal] = useState(false)
  const [expandedHierarchies, setExpandedHierarchies] = useState(new Set())
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [draggedAccount, setDraggedAccount] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState(null)
  const [hierarchyToDelete, setHierarchyToDelete] = useState(null)
  const [notification, setNotification] = useState(null)
  
  // Progress bar state
  const [progressBar, setProgressBar] = useState({
    isVisible: false,
    progress: 0,
    message: '',
    type: 'default'
  })
  
  // Last update timestamp
  const [lastUpdateTime, setLastUpdateTime] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: '',
    description: '',
    hierarchy_id: '',
    statement: ''
  })

  const [editFormData, setEditFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: '',
    description: '',
    hierarchy_id: '',
    statement: ''
  })

  const [hierarchyFormData, setHierarchyFormData] = useState({
    hierarchy_name: '',
    description: '',
    hierarchy_type: 'account'
  })

  const [editHierarchyFormData, setEditHierarchyFormData] = useState({
    hierarchy_name: '',
    description: '',
    hierarchy_type: 'Account' // Force Account type for Account Management page
  })

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Progress bar helper functions
  const showProgressBar = (message, type = 'info') => {
    setProgressBar({
      isVisible: true,
      progress: 0,
      message,
      type
    })
  }

  const updateProgressBar = (progress, message) => {
    setProgressBar(prev => ({
      ...prev,
      progress,
      message: message || prev.message
    }))
  }

  const hideProgressBar = () => {
    setProgressBar(prev => ({
      ...prev,
      isVisible: false
    }))
  }

  // Load hierarchies first, then accounts (since accounts depend on hierarchies for filtering)
  useEffect(() => {
    if (selectedCompany && isAuthenticated) {
      console.log('🔐 Authentication check passed, loading data for company:', selectedCompany)
      loadHierarchies()
    } else if (!isAuthenticated) {
      console.log('🔐 User not authenticated, clearing data')
      setAccounts([])
      setHierarchies([])
    }
  }, [selectedCompany, isAuthenticated])

  // Load accounts after hierarchies are loaded
  useEffect(() => {
    if (selectedCompany && isAuthenticated && hierarchies.length > 0) {
      console.log('🔐 Hierarchies loaded, now loading accounts')
      loadAccounts()
    }
  }, [selectedCompany, isAuthenticated, hierarchies])

  // Use CompanyContext data as primary source
  useEffect(() => {
    console.log('📊 CompanyContext data update - ifrsAccounts:', ifrsAccounts?.length || 0, 'entities:', entities?.length || 0)
    
    if (ifrsAccounts && ifrsAccounts.length > 0) {
      setAccounts(ifrsAccounts)
      console.log('📊 Using CompanyContext accounts:', ifrsAccounts.length)
    }
    
    if (entities && entities.length > 0) {
      console.log('📊 CompanyContext entities available:', entities.length)
      // Hierarchies are now loaded from SQL database via CompanyContext
      console.log('📊 Hierarchies loaded from SQL database')
    }
  }, [ifrsAccounts, entities])

  // Auto-refresh data every 30 seconds to ensure real-time updates
  useEffect(() => {
    if (!selectedCompany || !isAuthenticated) return

    const interval = setInterval(async () => {
      console.log('🔄 Auto-refreshing data...')
      try {
        await refreshCompanyData()
        await loadAccounts()
        await loadHierarchies()
      } catch (error) {
        console.error('Auto-refresh error:', error)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [selectedCompany, isAuthenticated])



  const loadAccounts = async () => {
    if (!selectedCompany) return
    
    setLoading(true)
    try {
      // First try to get from CompanyContext
      if (ifrsAccounts && ifrsAccounts.length > 0) {
        // Filter accounts to only show those belonging to Account-type hierarchies
        const accountTypeHierarchyIds = hierarchies.filter(h => h.hierarchy_type === 'Account').map(h => h.id)
        const filteredAccounts = ifrsAccounts.filter(account => {
          if (!account.hierarchy_id) return true // Show unassigned accounts
          return accountTypeHierarchyIds.includes(account.hierarchy_id)
        })
        
        setAccounts(filteredAccounts)
        setLastUpdateTime(new Date())
        console.log('📊 Using CompanyContext accounts for company:', selectedCompany, 'Count:', ifrsAccounts.length)
        console.log('🔍 Filtered accounts for Account management:', filteredAccounts.length, 'Account-type hierarchy IDs:', accountTypeHierarchyIds)
        setLoading(false)
        return
      }

      // Fallback to API call
      const response = await fetch('/api/ifrs-accounts', {
        credentials: 'include' // Include session cookies
      })
      
      if (response.ok) {
        const data = await response.json()
        const allCompanyAccounts = data.accounts || []
        
        // Filter accounts to only show those belonging to Account-type hierarchies
        const accountTypeHierarchyIds = hierarchies.filter(h => h.hierarchy_type === 'Account').map(h => h.id)
        const filteredAccounts = allCompanyAccounts.filter(account => {
          if (!account.hierarchy_id) return true // Show unassigned accounts
          return accountTypeHierarchyIds.includes(account.hierarchy_id)
        })
        
        setAccounts(filteredAccounts)
        setLastUpdateTime(new Date())
        console.log('📊 Loaded all accounts from API for company:', selectedCompany, 'Count:', allCompanyAccounts.length)
        console.log('🔍 Filtered accounts for Account management:', filteredAccounts.length, 'Account-type hierarchy IDs:', accountTypeHierarchyIds)
      } else if (response.status === 401) {
        console.error('Authentication failed - user not logged in')
        showNotification('Authentication failed. Please log in again.', 'error')
        setAccounts([])
      } else {
        console.error('Failed to load accounts from API')
        setAccounts([])
        showNotification('Failed to load accounts. Please try refreshing.', 'error')
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
      setAccounts([])
      showNotification('Error loading accounts. Please check your connection.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadHierarchies = async () => {
    if (!selectedCompany) return
    
    try {
      // Load hierarchies from SQL database via API
      const response = await fetch('/api/hierarchies', {
        credentials: 'include' // Include session cookies
      })
      
      if (response.ok) {
        const data = await response.json()
        const allHierarchies = data.hierarchies || []
        
        // Filter to only show Account-type hierarchies on the Account Management page
        const accountHierarchies = allHierarchies.filter(h => h.hierarchy_type === 'Account')
        
        console.log('📊 Loaded all hierarchies from API for company:', selectedCompany, 'Count:', allHierarchies.length)
        console.log('🔍 Filtered Account hierarchies:', accountHierarchies.length, accountHierarchies.map(h => ({
          id: h.id,
          type: h.hierarchy_type,
          name: h.hierarchy_name
        })))
        
        setHierarchies(accountHierarchies)
        setLastUpdateTime(new Date())
      } else if (response.status === 401) {
        console.error('Authentication failed - user not logged in')
        showNotification('Authentication failed. Please log in again.', 'error')
        setHierarchies([])
      } else {
        console.error('Failed to load hierarchies from API')
        setHierarchies([])
        showNotification('Failed to load hierarchies. Please try refreshing.', 'error')
      }
    } catch (error) {
      console.error('Error loading hierarchies:', error)
      setHierarchies([])
      showNotification('Error loading hierarchies. Please check your connection.', 'error')
    }
  }

  const handleAddAccount = () => {
    setFormData({
      account_code: '',
      account_name: '',
      account_type: '',
      description: '',
      hierarchy_id: '',
      statement: ''
    })
    setShowAddModal(true)
  }

  const handleAddHierarchy = () => {
    setHierarchyFormData({
      hierarchy_name: '',
      description: '',
      hierarchy_type: 'Account' // Force Account type for Account Management page
    })
    setShowHierarchyModal(true)
  }

  const handleSaveAccount = async () => {
    try {
      showProgressBar('Creating account...', 'info')
      updateProgressBar(25, 'Validating account data...')
      
      const accountData = {
        account_code: formData.account_code,
        account_name: formData.account_name,
        account_type: formData.account_type,
        description: formData.description,
        hierarchy_id: formData.hierarchy_id || null,
        statement: formData.statement || null
      }

      updateProgressBar(50, 'Sending request to server...')
      
      const response = await fetch('/api/ifrs-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(accountData),
        credentials: 'include'
      })

      updateProgressBar(75, 'Processing response...')

      if (response.ok) {
        const result = await response.json()
        
        updateProgressBar(90, 'Updating interface...')
        
        // Add the new account to the state immediately
        if (result.account) {
          const newAccount = {
            ...result.account,
            // Ensure the account has the right structure for the UI
            account_type: result.account.account_type || result.account.ifrs_category,
            statement: result.account.statement || 'BS'
          }
          
          setAccounts(prevAccounts => [...prevAccounts, newAccount])
          
          // Also update the hierarchy counts if needed
          if (newAccount.hierarchy_id) {
            setHierarchies(prevHierarchies => 
              prevHierarchies.map(h => 
                h.id === newAccount.hierarchy_id 
                  ? { ...h, account_count: (h.account_count || 0) + 1 }
                  : h
              )
            )
          }
        }
        
        updateProgressBar(100, 'Account created successfully!')
        setTimeout(async () => {
          hideProgressBar()
          setShowAddModal(false)
          setFormData({
            account_code: '',
            account_name: '',
            account_type: '',
            description: '',
            hierarchy_id: '',
            statement: ''
          })
          
          // Refresh all data to ensure consistency
          await refreshCompanyData()
          await loadAccounts()
          await loadHierarchies()
          
          showNotification('Account added successfully!')
        }, 500)
      } else {
        const errorData = await response.json()
        updateProgressBar(100, 'Failed to create account')
        setTimeout(() => {
          hideProgressBar()
          showNotification(`Error: ${errorData.detail || 'Failed to add account'}`, 'error')
        }, 1000)
      }
    } catch (error) {
      console.error('Error saving account:', error)
      updateProgressBar(100, 'Error occurred')
      setTimeout(() => {
        hideProgressBar()
        showNotification('Error saving account. Please try again.', 'error')
      }, 1000)
    }
  }

  const handleSaveHierarchy = async () => {
    try {
      const hierarchyData = {
        hierarchy_name: hierarchyFormData.hierarchy_name,
        description: hierarchyFormData.description || null,
        hierarchy_type: 'Account' // Force Account type for Account Management page
      }

      const response = await fetch('/api/hierarchies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hierarchyData),
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        
        // Add the new hierarchy to the state immediately
        if (result.hierarchy_id) {
          const newHierarchy = {
            id: result.hierarchy_id,
            hierarchy_name: hierarchyFormData.hierarchy_name,
            description: hierarchyFormData.description || '',
            hierarchy_type: 'Account',
            account_count: 0
          }
          
          setHierarchies(prevHierarchies => [...prevHierarchies, newHierarchy])
        }
        
        setShowHierarchyModal(false)
        setHierarchyFormData({
          hierarchy_name: '',
          description: '',
          hierarchy_type: 'account'
        })
        
        // Refresh all data to ensure consistency
        await refreshCompanyData()
        await loadAccounts()
        await loadHierarchies()
        
        showNotification('Hierarchy added successfully!')
      } else {
        const errorData = await response.json()
        showNotification(`Error: ${errorData.detail || 'Failed to add hierarchy'}`, 'error')
      }
    } catch (error) {
      console.error('Error saving hierarchy:', error)
      showNotification('Error saving hierarchy. Please try again.', 'error')
    }
  }

  // Edit hierarchy functionality
  const handleEditHierarchy = (hierarchy) => {
    setEditHierarchyFormData({
      id: hierarchy.id, // Add this line to include the hierarchy ID
      hierarchy_name: hierarchy.hierarchy_name,
      description: hierarchy.description || '',
      hierarchy_type: hierarchy.hierarchy_type || 'account'
    })
    setShowEditHierarchyModal(true)
  }

  const handleUpdateHierarchy = async () => {
    try {
      const hierarchyData = {
        hierarchy_name: editHierarchyFormData.hierarchy_name,
        description: editHierarchyFormData.description || null,
        hierarchy_type: editHierarchyFormData.hierarchy_type
      }

      const response = await fetch(`/api/hierarchies/${editHierarchyFormData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hierarchyData),
        credentials: 'include'
      })

      if (response.ok) {
        // Refresh all data to ensure consistency
        await refreshCompanyData()
        await loadAccounts()
        await loadHierarchies()
        
        setShowEditHierarchyModal(false)
        setEditHierarchyFormData({
          hierarchy_name: '',
          description: '',
          hierarchy_type: 'Account'
        })
        showNotification('Hierarchy updated successfully!')
      } else {
        const errorData = await response.json()
        showNotification(`Error: ${errorData.detail || 'Failed to update hierarchy'}`, 'error')
      }
    } catch (error) {
      console.error('Error updating hierarchy:', error)
      showNotification('Error updating hierarchy. Please try again.', 'error')
    }
  }

  // Delete hierarchy functionality
  const handleDeleteHierarchy = (hierarchy) => {
    setHierarchyToDelete(hierarchy)
    setShowDeleteHierarchyModal(true)
  }

  const confirmDeleteHierarchy = async () => {
    if (!hierarchyToDelete) return

    try {
      const response = await fetch(`/api/hierarchies/${hierarchyToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // Refresh all data to ensure consistency
        await refreshCompanyData()
        await loadAccounts()
        await loadHierarchies()
        
        setShowDeleteHierarchyModal(false)
        setHierarchyToDelete(null)
        showNotification('Hierarchy deleted successfully!')
      } else {
        const errorData = await response.json()
        showNotification(`Error: ${errorData.detail || 'Failed to delete hierarchy'}`, 'error')
      }
    } catch (error) {
      console.error('Error deleting hierarchy:', error)
      showNotification('Error deleting hierarchy. Please try again.', 'error')
    }
  }

  // Edit account functionality
  const handleEditAccount = (account) => {
    setEditFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      description: account.description || '',
      hierarchy_id: account.hierarchy_id || '',
      statement: account.statement || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateAccount = async () => {
    try {
      const accountData = {
        account_code: editFormData.account_code,
        account_name: editFormData.account_name,
        account_type: editFormData.account_type,
        description: editFormData.description,
        hierarchy_id: editFormData.hierarchy_id || null,
        statement: editFormData.statement || null
      }

      const response = await fetch(`/api/ifrs-accounts/${editFormData.account_code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(accountData),
        credentials: 'include'
      })

      if (response.ok) {
        // Refresh all data to ensure consistency
        await refreshCompanyData()
        await loadAccounts()
        await loadHierarchies()
        
        setShowEditModal(false)
        setEditFormData({
          account_code: '',
          account_name: '',
          account_type: '',
          description: '',
          hierarchy_id: '',
          statement: ''
        })
        showNotification('Account updated successfully!')
      } else {
        const errorData = await response.json()
        showNotification(`Error: ${errorData.detail || 'Failed to update account'}`, 'error')
      }
    } catch (error) {
      console.error('Error updating account:', error)
      showNotification('Error updating account. Please try again.', 'error')
    }
  }

  // Delete account functionality
  const handleDeleteAccount = (account) => {
    setAccountToDelete(account)
    setShowDeleteModal(true)
  }

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return

    try {
      const response = await fetch(`/api/ifrs-accounts/${accountToDelete.account_code}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // Refresh all data to ensure consistency
        await refreshCompanyData()
        await loadAccounts()
        await loadHierarchies()
        
        setShowDeleteModal(false)
        setAccountToDelete(null)
        showNotification('Account deleted successfully!')
      } else {
        const errorData = await response.json()
        showNotification(`Error: ${errorData.detail || 'Failed to delete account'}`, 'error')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      showNotification('Error deleting account. Please try again.', 'error')
    }
  }

  const toggleHierarchyExpansion = (hierarchyId) => {
    const newExpanded = new Set(expandedHierarchies)
    if (newExpanded.has(hierarchyId)) {
      newExpanded.delete(hierarchyId)
    } else {
      newExpanded.add(hierarchyId)
    }
    setExpandedHierarchies(newExpanded)
  }

  // Drag and Drop functionality
  const handleDragStart = (e, account) => {
    setDraggedAccount(account)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetHierarchyId) => {
    e.preventDefault()
    if (draggedAccount && draggedAccount.hierarchy_id !== targetHierarchyId) {
      await handleMoveAccountToHierarchy(draggedAccount.account_code, targetHierarchyId)
    }
    setDraggedAccount(null)
  }

  const handleMoveAccountToHierarchy = async (accountCode, hierarchyId) => {
    try {
      showProgressBar('Moving account...', 'info')
      updateProgressBar(25, 'Preparing move operation...')
      
      const response = await fetch('/api/ifrs-accounts/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_code: accountCode,
          new_hierarchy_id: hierarchyId
        }),
        credentials: 'include'
      })

      updateProgressBar(75, 'Processing move...')

      if (response.ok) {
        updateProgressBar(90, 'Updating interface...')
        
        // Update the account in the state immediately
        setAccounts(prevAccounts => 
          prevAccounts.map(account => 
            account.account_code === accountCode 
              ? { ...account, hierarchy_id: hierarchyId }
              : account
          )
        )
        
        // Update hierarchy counts
        if (draggedAccount && draggedAccount.hierarchy_id) {
          // Decrease count from old hierarchy
          setHierarchies(prevHierarchies => 
            prevHierarchies.map(h => 
              h.id === draggedAccount.hierarchy_id 
                ? { ...h, account_count: Math.max(0, (h.account_count || 0) - 1) }
                : h
            )
          )
        }
        
        // Increase count in new hierarchy
        if (hierarchyId) {
          setHierarchies(prevHierarchies => 
            prevHierarchies.map(h => 
              h.id === hierarchyId 
                ? { ...h, account_count: (h.account_count || 0) + 1 }
                : h
            )
          )
        }
        
        updateProgressBar(100, 'Account moved successfully!')
        setTimeout(async () => {
          hideProgressBar()
          
          // Refresh all data to ensure consistency
          await refreshCompanyData()
          await loadAccounts()
          await loadHierarchies()
          
          showNotification('Account moved successfully!')
        }, 500)
      } else {
        const errorData = await response.json()
        updateProgressBar(100, 'Failed to move account')
        setTimeout(() => {
          hideProgressBar()
          showNotification(`Error: ${errorData.detail || 'Failed to move account'}`, 'error')
        }, 1000)
      }
    } catch (error) {
      console.error('Error moving account:', error)
      updateProgressBar(100, 'Error occurred')
      setTimeout(() => {
        hideProgressBar()
        showNotification('Error moving account. Please try again.', 'error')
      }, 1000)
    }
  }

  // Export functionality
  const handleExportAccounts = () => {
    const accountsToExport = selectedAccounts.length > 0 
      ? accounts.filter(account => selectedAccounts.includes(account.account_code))
      : accounts
    
    if (accountsToExport.length === 0) {
      showNotification('No accounts to export')
      return
    }

    // Convert to CSV format
    const headers = ['Account Code', 'Account Name', 'Category', 'Description', 'Statement', 'Hierarchy ID']
    const csvContent = [
      headers.join(','),
      ...accountsToExport.map(account => [
        account.account_code,
        `"${account.account_name}"`,
        account.account_type,
        `"${account.description || ''}"`,
        account.statement || '',
        account.hierarchy_id || ''
      ].join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `accounts_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Import functionality with backend API
  const handleImportAccounts = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      showNotification('Please select a valid CSV file')
      return
    }

    setImportLoading(true)
    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      
      // Parse CSV data
      const accountsToImport = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const account = {}
        headers.forEach((header, index) => {
          if (values[index]) {
            // Map CSV headers to API fields
            const fieldMap = {
              'Account Code': 'account_code',
              'Account Name': 'account_name',
              'Category': 'account_type',
              'Description': 'description',
              'Statement': 'statement',
              'Hierarchy ID': 'hierarchy_id'
            }
            const apiField = fieldMap[header] || header.toLowerCase().replace(/\s+/g, '_')
            account[apiField] = values[index]
          }
        })
        return account
      })

      if (accountsToImport.length === 0) {
        showNotification('No valid accounts found in CSV file')
        return
      }

      // Send to backend API for import
      const response = await fetch('/api/ifrs-accounts/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accounts: accountsToImport,
          company: selectedCompany
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        showNotification(`Successfully imported ${result.imported_count || accountsToImport.length} accounts!`)
        
        // Refresh all data to ensure consistency
        await refreshCompanyData()
        await loadAccounts()
        await loadHierarchies()
      } else {
        const errorData = await response.json()
        showNotification(`Import failed: ${errorData.detail || 'Unknown error occurred'}`, 'error')
      }
      
      // Reset file input
      event.target.value = ''
    } catch (error) {
      console.error('Error importing accounts:', error)
      showNotification('Error importing accounts. Please check the file format and try again.', 'error')
    } finally {
      setImportLoading(false)
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'Asset':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Liability':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Equity':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Income':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Expense':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Company Selected</h3>
          <p className="text-gray-600">Please select a company from the dropdown to view and manage accounts.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access account management.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading accounts for {selectedCompany}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Progress Bar */}
      <ProgressBar 
        isVisible={progressBar.isVisible}
        progress={progressBar.progress}
        message={progressBar.message}
        type={progressBar.type}
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-8 w-8 mr-3 text-blue-600" />
              Account Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage IFRS accounts, hierarchies, and categorization for{' '}
              <span className="font-semibold text-blue-600">
                {selectedCompany || 'Loading...'}
              </span>
            </p>
            {!selectedCompany && (
              <p className="text-sm text-red-600 mt-1">
                ⚠️ Please select a company to view accounts
              </p>
            )}
            {/* Debug info - remove in production */}
            <div className="text-xs text-gray-500 mt-1">
              🔐 Auth: {isAuthenticated ? 'Yes' : 'No'} | 
              🏢 Company: {selectedCompany || 'None'} | 
              📊 Accounts: {accounts.length} | 
              🗂️ Hierarchies: {hierarchies.length}
              {lastUpdateTime && (
                <span className="ml-2">
                  | 🕒 Last Update: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={async () => {
                try {
                  showProgressBar('Refreshing data...', 'info')
                  updateProgressBar(25, 'Refreshing company data...')
                  
                  await refreshCompanyData()
                  updateProgressBar(50, 'Loading accounts...')
                  await loadAccounts()
                  updateProgressBar(75, 'Loading hierarchies...')
                  await loadHierarchies()
                  
                  updateProgressBar(100, 'Data refreshed successfully!')
                  setTimeout(() => {
                    hideProgressBar()
                    showNotification('Data refreshed successfully!')
                  }, 500)
                } catch (error) {
                  console.error('Manual refresh error:', error)
                  updateProgressBar(100, 'Refresh failed')
                  setTimeout(() => {
                    hideProgressBar()
                    showNotification('Failed to refresh data', 'error')
                  }, 1000)
                }
              }}
              className="btn-secondary flex items-center"
              disabled={!selectedCompany || progressBar.isVisible}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${progressBar.isVisible ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleAddHierarchy}
              className="btn-secondary flex items-center"
              disabled={!selectedCompany}
            >
              <Layers className="h-4 w-4 mr-2" />
              Add Hierarchy
            </button>
            <button 
              onClick={handleAddAccount}
              className="btn-primary flex items-center"
              disabled={!selectedCompany}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Accounts</p>
              <p className="text-3xl font-bold text-gray-900">{accounts.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hierarchies</p>
              <p className="text-3xl font-bold text-gray-900">{hierarchies.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Layers className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(accounts.map(account => account.account_type)).size}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Tag className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Hierarchy View */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Account Hierarchy</h3>
        </div>
        <div className="p-6">
          {hierarchies.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Layers className="h-12 w-12 mx-auto mb-2" />
              <p>No hierarchies created yet</p>
              <p className="text-sm">Create hierarchies to organize your accounts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hierarchies.map(hierarchy => {
                const hierarchyAccounts = accounts.filter(account => account.hierarchy_id === hierarchy.id)
                const isExpanded = expandedHierarchies.has(hierarchy.id)
                
                return (
                  <div key={hierarchy.id} className="border border-gray-200 rounded-lg">
                    <div 
                      className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleHierarchyExpansion(hierarchy.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{hierarchy.hierarchy_name}</h4>
                          <p className="text-sm text-gray-500">{hierarchy.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{hierarchyAccounts.length} accounts</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditHierarchy(hierarchy)
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Hierarchy"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteHierarchy(hierarchy)
                            }}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Hierarchy"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div 
                        className="p-4 bg-white border-t border-gray-200"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, hierarchy.id)}
                      >
                        {hierarchyAccounts.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                            <p className="text-gray-500 mb-2">Drop accounts here</p>
                            <p className="text-sm text-gray-400">No accounts in this hierarchy</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {hierarchyAccounts.map(account => (
                              <div 
                                key={account.account_code} 
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                                draggable
                                onDragStart={(e) => handleDragStart(e, account)}
                                title="Drag to move account to another hierarchy"
                              >
                                <div>
                                  <div className="font-medium text-sm">{account.account_code}</div>
                                  <div className="text-xs text-gray-500">{account.account_name}</div>
                                </div>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(account.account_type)}`}>
                                  {account.account_type}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">All Accounts ({accounts.length})</h3>
            <div className="flex space-x-2">
              <button 
                onClick={handleExportAccounts}
                className="btn-secondary text-sm"
                disabled={accounts.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button 
                onClick={() => document.getElementById('importFileInput').click()}
                className="btn-secondary text-sm"
                disabled={importLoading}
              >
                {importLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {importLoading ? 'Importing...' : 'Import'}
              </button>
              <input
                id="importFileInput"
                type="file"
                accept=".csv"
                onChange={handleImportAccounts}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>
        <div className="p-6">
          {accounts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No accounts found</p>
          ) : (
            <div className="space-y-4">
              {/* Select All Checkbox */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedAccounts.length === accounts.length && accounts.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAccounts(accounts.map(account => account.account_code))
                    } else {
                      setSelectedAccounts([])
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({accounts.length} accounts)
                </span>
              </div>
              
              {accounts.map(account => (
                <div key={account.account_code} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.account_code)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAccounts([...selectedAccounts, account.account_code])
                        } else {
                          setSelectedAccounts(selectedAccounts.filter(code => code !== account.account_code))
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{account.account_code}</div>
                      <div className="text-sm text-gray-500">{account.account_name}</div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(account.account_type)}`}>
                      {account.account_type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditAccount(account)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Account"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add New Account</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveAccount(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Code *</label>
                  <input
                    type="text"
                    value={formData.account_code}
                    onChange={(e) => setFormData({...formData, account_code: e.target.value})}
                    className="form-input"
                    placeholder="e.g., 1000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Name *</label>
                  <input
                    type="text"
                    value={formData.account_name}
                    onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                    className="form-input"
                    placeholder="e.g., Cash and Cash Equivalents"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Category *</label>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData({...formData, account_type: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statement</label>
                  <select
                    value={formData.statement}
                    onChange={(e) => setFormData({...formData, statement: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Select Statement</option>
                    <option value="Income Statement">Income Statement</option>
                    <option value="Balance Sheet">Balance Sheet</option>
                    <option value="Cash Flow">Cash Flow</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="form-textarea"
                    placeholder="Account description..."
                    rows="3"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hierarchy</label>
                  <select
                    value={formData.hierarchy_id}
                    onChange={(e) => setFormData({...formData, hierarchy_id: e.target.value})}
                    className="form-select"
                  >
                    <option value="">No Hierarchy</option>
                    {hierarchies.map(hierarchy => (
                      <option key={hierarchy.id} value={hierarchy.id}>
                        {hierarchy.hierarchy_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Hierarchy Modal */}
      {showHierarchyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add New Hierarchy</h3>
              <button 
                onClick={() => setShowHierarchyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveHierarchy(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hierarchy Name *</label>
                  <input
                    type="text"
                    value={hierarchyFormData.hierarchy_name}
                    onChange={(e) => setHierarchyFormData({...hierarchyFormData, hierarchy_name: e.target.value})}
                    className="form-input"
                    placeholder="e.g., Asset Classification"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={hierarchyFormData.hierarchy_type}
                    onChange={(e) => setHierarchyFormData({...hierarchyFormData, hierarchy_type: e.target.value})}
                    className="form-select"
                  >
                    <option value="account">Account</option>
                    <option value="entity">Entity</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={hierarchyFormData.description}
                    onChange={(e) => setHierarchyFormData({...hierarchyFormData, description: e.target.value})}
                    className="form-textarea"
                    placeholder="Hierarchy description..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowHierarchyModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Hierarchy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Account</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdateAccount(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Code *</label>
                  <input
                    type="text"
                    value={editFormData.account_code}
                    onChange={(e) => setEditFormData({...editFormData, account_code: e.target.value})}
                    className="form-input"
                    placeholder="e.g., 1000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Name *</label>
                  <input
                    type="text"
                    value={editFormData.account_name}
                    onChange={(e) => setEditFormData({...editFormData, account_name: e.target.value})}
                    className="form-input"
                    placeholder="e.g., Cash and Cash Equivalents"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Category *</label>
                  <select
                    value={editFormData.account_type}
                    onChange={(e) => setEditFormData({...editFormData, account_type: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statement</label>
                  <select
                    value={editFormData.statement}
                    onChange={(e) => setEditFormData({...editFormData, statement: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Select Statement</option>
                    <option value="Income Statement">Income Statement</option>
                    <option value="Balance Sheet">Balance Sheet</option>
                    <option value="Cash Flow">Cash Flow</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="form-textarea"
                    placeholder="Account description..."
                    rows="3"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hierarchy</label>
                  <select
                    value={editFormData.hierarchy_id}
                    onChange={(e) => setEditFormData({...editFormData, hierarchy_id: e.target.value})}
                    className="form-select"
                  >
                    <option value="">No Hierarchy</option>
                    {hierarchies.map(hierarchy => (
                      <option key={hierarchy.id} value={hierarchy.id}>
                        {hierarchy.hierarchy_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Update Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the account <strong>{accountToDelete?.account_code} - {accountToDelete?.account_name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="btn-danger"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hierarchy Modal */}
      {showEditHierarchyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Hierarchy</h3>
              <button 
                onClick={() => setShowEditHierarchyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdateHierarchy(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hierarchy Name *</label>
                  <input
                    type="text"
                    value={editHierarchyFormData.hierarchy_name}
                    onChange={(e) => setEditHierarchyFormData({...editHierarchyFormData, hierarchy_name: e.target.value})}
                    className="form-input"
                    placeholder="e.g., Asset Classification"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={editHierarchyFormData.hierarchy_type}
                    onChange={(e) => setEditHierarchyFormData({...editHierarchyFormData, hierarchy_type: e.target.value})}
                    className="form-select"
                  >
                    <option value="account">Account</option>
                    <option value="entity">Entity</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editHierarchyFormData.description}
                    onChange={(e) => setEditHierarchyFormData({...editHierarchyFormData, description: e.target.value})}
                    className="form-textarea"
                    placeholder="Hierarchy description..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditHierarchyModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Update Hierarchy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Hierarchy Confirmation Modal */}
      {showDeleteHierarchyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Hierarchy</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the hierarchy <strong>{hierarchyToDelete?.hierarchy_name}</strong>? 
              This will also remove all accounts from this hierarchy. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteHierarchyModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteHierarchy}
                className="btn-danger"
              >
                Delete Hierarchy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountManagement
