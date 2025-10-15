import React, { useState, useEffect } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import { 
  BookOpen, 
  Layers, 
  Settings, 
  Plus, 
  Eye, 
  BarChart3,
  TreePine,
  List,
  Network,
  Filter,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  Users,
  Globe,
  DollarSign,
  FileText,
  Calculator,
  ArrowUpDown
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import SummaryCard from '../components/SummaryCard'
import CustomFieldsManager from '../components/CustomFieldsManager'
import FSTDesigner from '../components/FSTDesigner'
import InteractiveGraph from '../components/InteractiveGraph'
import HierarchyTree from '../components/HierarchyTree'
import ElementsList from '../components/ElementsList'
import HierarchyManager from '../components/HierarchyManager'
import HierarchyTreeView from '../components/HierarchyTreeView'
import TagetikHierarchyNavigator from '../components/TagetikHierarchyNavigator'
import SimpleHierarchyTree from '../components/SimpleHierarchyTree'
import SimpleCanvas from '../components/SimpleCanvas'
import HierarchyNodesPanel from '../components/HierarchyNodesPanel'
import HierarchyEditorPanel from '../components/HierarchyEditorPanel'

const AxesAccounts = () => {
  const { selectedCompany, ifrsAccounts, entities, refreshCompanyData } = useCompany()
  const { isAuthenticated } = useAuth()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState('list') // list, tree, graph
  const [hierarchies, setHierarchies] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsType, setSettingsType] = useState(null) // 'hierarchies' or 'accounts'
  const [showFSTDesigner, setShowFSTDesigner] = useState(false)
  const [showHierarchyManager, setShowHierarchyManager] = useState(false)
  const [selectedHierarchy, setSelectedHierarchy] = useState(null)
  const [selectedElement, setSelectedElement] = useState(null)
  const [showCanvas, setShowCanvas] = useState(false)
  const [canvasItem, setCanvasItem] = useState(null)
  const [hierarchyStructure, setHierarchyStructure] = useState({
    nodes: [],
    unassigned_accounts: [],
    hierarchy_id: null
  })

  // Load data on component mount
  useEffect(() => {
    loadAccountData()
  }, [selectedCompany, isAuthenticated])

  // Use CompanyContext data as primary source
  useEffect(() => {
    console.log('📊 CompanyContext data update - ifrsAccounts:', ifrsAccounts?.length || 0, 'entities:', entities?.length || 0)
    
    if (ifrsAccounts && ifrsAccounts.length > 0) {
      // Transform accounts to match expected format
      const transformedAccounts = ifrsAccounts.map(account => ({
        id: account.id,
        code: account.account_code,
        name: account.account_name,
        type: account.account_type || 'Account',
        status: 'Active', // Default status
        hierarchy: 'No Hierarchy', // Will be updated below
        hierarchy_id: account.hierarchy_id,
        currency: account.currency || 'USD',
        balance: account.balance || 0
      }))
      
      setAccounts(transformedAccounts)
      console.log('📊 Using CompanyContext accounts:', ifrsAccounts.length)
    }
  }, [ifrsAccounts, entities])

  const loadAccountData = async () => {
    if (!selectedCompany || !isAuthenticated) return
    
    setLoading(true)
    try {
      // Load hierarchies from the axes-account endpoint for account-specific hierarchies
      const hierarchiesResponse = await fetch(`/api/axes-account/hierarchies?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      if (hierarchiesResponse.ok) {
        const hierarchiesData = await hierarchiesResponse.json()
        const hierarchiesList = hierarchiesData.hierarchies || []
        
        // Filter hierarchies by type (account type hierarchies)
        const accountHierarchies = hierarchiesList.filter(h => 
          h.hierarchy_type === 'account' || 
          h.hierarchy_type === 'Account' || 
          h.hierarchy_type === 'Account Organization' ||
          h.hierarchy_type === 'Chart of Accounts' ||
          h.hierarchy_type === 'Account Hierarchy' ||
          h.hierarchy_type === 'GL Accounts'
        )
        
        // Transform to match expected format
        const transformedHierarchies = accountHierarchies.map(hierarchy => ({
          id: hierarchy.id,
          name: hierarchy.hierarchy_name,
          description: hierarchy.description || '',
          count: 0, // Will be calculated below
          active: true,
          status: 'Active',
          type: hierarchy.hierarchy_type
        }))
        
        console.log('✅ Loaded account hierarchies from PostgreSQL:', transformedHierarchies.length)
        setHierarchies(transformedHierarchies)
        
        // Load all accounts directly from API with company context
        const accountsResponse = await fetch(`/api/axes-account/accounts?company_name=${encodeURIComponent(selectedCompany)}`, {
          credentials: 'include'
        })
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json()
          const allAccounts = accountsData.accounts || []
          
          // Transform accounts to match expected format
          const transformedAccounts = allAccounts.map(account => ({
            id: account.id,
            code: account.account_code,
            name: account.account_name,
            type: account.ifrs_category || 'Account',
            status: 'Active',
            hierarchy: 'No Hierarchy', // Will be updated below
            hierarchy_id: account.hierarchy_id,
            currency: account.currency || 'USD',
            balance: account.balance || 0,
            statement: account.statement || '',
            description: account.description || ''
          }))
          
          console.log('✅ Loaded accounts from PostgreSQL:', transformedAccounts.length)
          setAccounts(transformedAccounts)
          
          // Update hierarchy counts
          const updatedHierarchies = transformedHierarchies.map(hierarchy => {
            const accountCount = transformedAccounts.filter(account => account.hierarchy_id === hierarchy.id).length
            return {
              ...hierarchy,
              count: accountCount
            }
          })
          
          // Assign hierarchy names to accounts
          const accountsWithHierarchy = transformedAccounts.map(account => {
            const hierarchy = updatedHierarchies.find(h => h.id === account.hierarchy_id)
            return {
              ...account,
              hierarchy: hierarchy ? hierarchy.name : 'No Hierarchy'
            }
          })
          
          setHierarchies(updatedHierarchies)
          setAccounts(accountsWithHierarchy)
        } else {
          console.warn('Failed to load accounts from API')
        }
      } else {
        console.warn('Failed to load hierarchies, using mock data')
        setHierarchies([])
      }
    } catch (error) {
      console.error('Error loading account data:', error)
      setHierarchies([])
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsClick = (type) => {
    setSettingsType(type)
    setShowSettings(true)
  }

  const handleCustomFieldChange = async (type, fields) => {
    try {
      console.log(`Saving custom fields for ${type}:`, fields)
      
      // Convert fields object to array format expected by backend
      const fieldsArray = Object.values(fields).map(field => ({
        field_name: field.name,
        field_type: field.type,
        label: field.label || field.name,
        is_required: field.is_required || false,
        is_unique: field.is_unique || false,
        options: field.options || [],
        default_value: field.default_value || '',
        validation_rules: field.validation_rules || {},
        display_order: field.display_order || 0,
        sql_query: field.sql_query || ''
      }))
      
      const response = await fetch(`/api/axes-account/settings?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          axes_type: 'account',
          custom_fields: fieldsArray,
          linked_axes: []
        })
      })
      
      if (response.ok) {
        console.log('✅ Custom fields saved successfully')
        toast.success('Custom fields saved successfully!')
        
        // Reload data to reflect changes
        await loadAccountData()
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to save custom fields:', errorData)
        toast.error(errorData.detail || 'Failed to save custom fields')
      }
    } catch (error) {
      console.error('❌ Error saving custom fields:', error)
      toast.error('Error saving custom fields')
    }
  }

  const handleViewHierarchy = (hierarchy) => {
    handleHierarchySelect(hierarchy)
  }

  const handleAddHierarchy = async () => {
    console.log('Add hierarchy clicked')
    const hierarchyName = prompt('Enter hierarchy name:')
    if (hierarchyName) {
      try {
        const response = await fetch(`/api/axes-account/hierarchies?company_name=${encodeURIComponent(selectedCompany)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            hierarchy_name: hierarchyName,
            hierarchy_type: 'account',
            description: `Account hierarchy: ${hierarchyName}`
          })
        })
        
        if (response.ok) {
          console.log('Hierarchy created successfully')
          // Refresh data immediately
          await loadAccountData()
        } else {
          console.error('Failed to create hierarchy')
          alert('Failed to create hierarchy')
        }
      } catch (error) {
        console.error('Error creating hierarchy:', error)
        alert('Error creating hierarchy')
      }
    }
  }

  const handleAddElement = async (elementData) => {
    try {
      console.log('Creating account with data:', elementData)
      
      // Ensure elementData is properly structured
      const accountData = {
        account_name: elementData?.account_name || elementData?.name || '',
        account_code: elementData?.account_code || elementData?.code || '',
        account_type: elementData?.account_type || elementData?.type || '',
        currency: elementData?.currency || 'USD',
        hierarchy_id: elementData?.hierarchy_id || null,
        ifrs_category: elementData?.ifrs_category || '',
        statement: elementData?.statement || '',
        description: elementData?.description || '',
        balance: elementData?.balance || 0
      }
      
      console.log('Processed account data:', accountData)
      
      const response = await fetch(`/api/axes-account/accounts?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(accountData)
      })
      
      if (response.ok) {
        console.log('Account created successfully')
        // Refresh data immediately
        await loadAccountData()
        return true
      } else {
        const errorText = await response.text()
        console.error('Failed to create account:', response.status, errorText)
        
        // Handle specific error cases
        if (response.status === 400 && errorText.includes('already exists')) {
          alert(`Account creation failed: ${errorText}`)
        } else {
          alert('Failed to create account. Please try again.')
        }
        return false
      }
    } catch (error) {
      console.error('Error creating account:', error)
      return false
    }
  }

  const handleAddElementFromCanvas = (hierarchyId, parentId = null) => {
    // Create a new element with default values
    const newElement = {
      account_name: '',
      account_code: '',
      account_type: 'Asset',
      currency: 'USD',
      hierarchy_id: hierarchyId,
      parent_id: parentId,
      is_active: true,
      status: 'Active'
    }
    setSelectedElement(newElement)
  }

  // Simple flow handlers
  const handleHierarchySelect = async (hierarchy) => {
    setSelectedHierarchy(hierarchy)
    setActiveTab('hierarchies')
    setShowCanvas(false)
    
    // Load hierarchy structure (nodes and elements) for the selected hierarchy
    await loadHierarchyStructure(hierarchy.id)
  }

  const loadHierarchyStructure = async (hierarchyId) => {
    try {
      console.log('Loading account hierarchy structure for hierarchy ID:', hierarchyId)
      
      const response = await fetch(`/api/axes-account/hierarchy-structure/${hierarchyId}?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Account hierarchy structure loaded:', data)
        console.log('Nodes:', data.nodes)
        console.log('Unassigned entities:', data.unassigned_entities)
        
        // Set the hierarchy structure data exactly like entity hierarchy
        console.log('🔄 Setting hierarchy structure:', data)
        setHierarchyStructure(data)
        console.log('🔄 Hierarchy structure set successfully')
      } else {
        console.error('Failed to load account hierarchy structure:', response.status)
        // Fallback to empty structure
        setHierarchyStructure({
          nodes: [],
          unassigned_accounts: [],
          hierarchy_id: hierarchyId
        })
      }
    } catch (error) {
      console.error('Error loading account hierarchy structure:', error)
      // Fallback to empty structure
      setHierarchyStructure({
        nodes: [],
        unassigned_accounts: [],
        hierarchy_id: hierarchyId
      })
    }
  }

  const handleTreeDoubleClick = (item) => {
    setCanvasItem(item)
    setShowCanvas(true)
  }

  const handleCanvasClose = () => {
    setShowCanvas(false)
    setCanvasItem(null)
  }

  const handleSaveItem = async (itemData) => {
    try {
      // Check if this is a new item (no ID) or an existing item
      if (itemData.id) {
        // Existing item - edit
        await handleEditElement(itemData)
      } else {
        // New item - add
        await handleAddElement(itemData)
      }
    } catch (error) {
      console.error('Error saving item:', error)
      throw error
    }
  }

  const handleAddNode = async () => {
    console.log('Adding new node...')
    // This will be handled by the HierarchyEditorPanel
  }

  const refreshHierarchyStructure = async () => {
    console.log('🔄 refreshHierarchyStructure called')
    if (selectedHierarchy) {
      console.log('🔄 Refreshing hierarchy structure for:', selectedHierarchy.id)
      await loadHierarchyStructure(selectedHierarchy.id)
      console.log('🔄 Hierarchy structure refreshed')
    } else {
      console.log('🔄 No selected hierarchy to refresh')
    }
  }

  const handleAddChildElement = async (parentItem) => {
    try {
      console.log('Creating new child element for parent:', parentItem)
      
      const newElementData = {
        account_name: parentItem.account_name || 'New Account',
        account_code: parentItem.account_code || `ACC_${Date.now()}`,
        account_type: parentItem.account_type || 'Asset',
        currency: parentItem.currency || 'USD',
        hierarchy_id: selectedHierarchy?.id,
        parent_id: parentItem.id || null,
        is_active: true,
        status: 'Active'
      }

      console.log('New element data:', newElementData)

      const response = await fetch(`/api/axes-account/accounts?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newElementData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Element created successfully:', result)
        alert('Element created successfully!')
        await loadAccountData() // Refresh the data
      } else {
        const error = await response.json()
        console.error('Error creating element:', error)
        alert(`Error creating element: ${error.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating child element:', error)
      alert('Error creating element. Please try again.')
    }
  }

  const handleEditElement = async (elementData) => {
    try {
      // Use account_code for the API endpoint
      const accountCode = elementData.account_code || elementData.code
      console.log('Updating account with code:', accountCode)
      
      const response = await fetch(`/api/axes-account/accounts/${accountCode}?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          account_name: elementData.account_name,
          account_code: elementData.account_code,
          account_type: elementData.account_type,
          currency: elementData.currency,
          hierarchy_id: elementData.hierarchy_id,
          ifrs_category: elementData.ifrs_category,
          statement: elementData.statement,
          description: elementData.description,
          balance: elementData.balance
        })
      })
      
      if (response.ok) {
        console.log('Account updated successfully')
        // Refresh data immediately
        await loadAccountData()
        return true
      } else {
        console.error('Failed to update account')
        return false
      }
    } catch (error) {
      console.error('Error updating account:', error)
      return false
    }
  }

  const handleDeleteElement = async (elementCode) => {
    try {
      const response = await fetch(`/api/axes-account/accounts/${elementCode}?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        console.log('Account deleted successfully')
        // Refresh data immediately
        await loadAccountData()
        return true
      } else {
        console.error('Failed to delete account')
        return false
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      return false
    }
  }


  const handleExport = async (type) => {
    try {
      let data, filename
      
      if (type === 'hierarchies') {
        data = hierarchies
        filename = 'hierarchies_export.xlsx'
      } else if (type === 'accounts') {
        data = accounts
        filename = 'accounts_export.xlsx'
      }
      
      if (!data || data.length === 0) {
        alert(`No ${type} data to export`)
        return
      }
      
      // Create Excel file
      const response = await fetch('/api/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: type,
          data: data
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log(`${type} exported successfully`)
      } else {
        console.error(`Failed to export ${type}`)
        alert(`Failed to export ${type}`)
      }
    } catch (error) {
      console.error(`Error exporting ${type}:`, error)
      alert(`Error exporting ${type}`)
    }
  }

  const handleImport = async (type, file) => {
    if (!file) return
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      
      const response = await fetch('/api/import-data', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`${type} imported successfully:`, result)
        alert(`${type} imported successfully! ${result.count || 0} records processed.`)
        // Refresh data
        await loadAccountData()
      } else {
        console.error(`Failed to import ${type}`)
        alert(`Failed to import ${type}`)
      }
    } catch (error) {
      console.error(`Error importing ${type}:`, error)
      alert(`Error importing ${type}`)
    }
  }

  const handleExportHierarchyData = async () => {
    if (!selectedHierarchy || !hierarchyStructure) {
      alert('Please select a hierarchy first')
      return
    }

    try {
      // Prepare data for export
      const exportData = {
        nodes: hierarchyStructure.nodes || [],
        accounts: hierarchyStructure.unassigned_accounts || [],
        hierarchy_id: selectedHierarchy.id,
        hierarchy_name: selectedHierarchy.name
      }

      const response = await fetch('/api/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'account-hierarchy-complete',
          data: exportData
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `account_hierarchy_${selectedHierarchy.name}_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log('Account hierarchy data exported successfully')
      } else {
        console.error('Failed to export account hierarchy data')
        alert('Failed to export account hierarchy data')
      }
    } catch (error) {
      console.error('Error exporting account hierarchy data:', error)
      alert('Error exporting account hierarchy data')
    }
  }

  const handleImportHierarchyData = async (file) => {
    if (!file || !selectedHierarchy) {
      alert('Please select a hierarchy and file first')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'account-hierarchy-complete')
      formData.append('hierarchy_id', selectedHierarchy.id)

      const response = await fetch('/api/import-data', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Account hierarchy data imported successfully:', result)
        alert(`Account hierarchy data imported successfully! ${result.total_processed || 0} records processed.`)
        // Refresh hierarchy structure
        await refreshHierarchyStructure()
      } else {
        console.error('Failed to import account hierarchy data')
        alert('Failed to import account hierarchy data')
      }
    } catch (error) {
      console.error('Error importing account hierarchy data:', error)
      alert('Error importing account hierarchy data')
    }
  }

  const renderViewModeToggle = () => (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => setViewMode('list')}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'list' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        <List className="h-4 w-4 mr-2" />
        List
      </button>
      <button
        onClick={() => setViewMode('tree')}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'tree' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        <TreePine className="h-4 w-4 mr-2" />
        Tree
      </button>
      <button
        onClick={() => setViewMode('graph')}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'graph' 
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        <Network className="h-4 w-4 mr-2" />
        Graph
      </button>
    </div>
  )

  const renderOverviewTab = () => (
    <div className="p-6 space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hierarchies Summary Card */}
        <SummaryCard
          title="Hierarchies"
          icon={Layers}
          data={{
            total: hierarchies?.length || 0,
            active: hierarchies?.filter(h => h.active || h.status === 'Active').length || 0,
            items: [
              {
                label: 'Active',
                value: hierarchies?.filter(h => h.active || h.status === 'Active').length || 0,
                icon: '✅'
              },
              {
                label: 'Paused',
                value: hierarchies?.filter(h => !h.active && h.status !== 'Active').length || 0,
                icon: '⏸️'
              },
              {
                label: 'Hierarchy Types',
                value: [...new Set(hierarchies?.map(h => h.type).filter(Boolean))].length || 0,
                icon: '📋'
              }
            ]
          }}
          onSettingsClick={() => handleSettingsClick('hierarchies')}
          onViewClick={() => setActiveTab('hierarchies')}
          onDoubleClick={() => setActiveTab('hierarchies')}
          color="blue"
        />

        {/* Accounts Summary Card */}
        <SummaryCard
          title="Accounts"
          icon={BookOpen}
          data={{
            total: accounts?.length || 0,
            active: accounts?.filter(a => a.status === 'Active').length || 0,
            items: [
              {
                label: 'Distinct Currencies',
                value: [...new Set(accounts?.map(a => a.currency).filter(Boolean))].length || 0,
                icon: '💱'
              },
              {
                label: 'Asset Accounts',
                value: accounts?.filter(a => a.type === 'Asset' || a.type === 'asset').length || 0,
                icon: '💰'
              },
              {
                label: 'Account Types',
                value: [...new Set(accounts?.map(a => a.type).filter(Boolean))].length || 0,
                icon: '📊'
              }
            ]
          }}
          onSettingsClick={() => handleSettingsClick('accounts')}
          onViewClick={() => setActiveTab('accounts')}
          onDoubleClick={() => setActiveTab('accounts')}
          color="green"
        />
      </div>


    </div>
  )

  const renderHierarchiesTab = () => {
    if (showCanvas) {
      // Show canvas with left nodes and right editor
      return (
        <div className="h-full flex">
          {/* Left - Nodes Only */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 h-full">
            <HierarchyNodesPanel
              hierarchy={selectedHierarchy}
              hierarchyStructure={hierarchyStructure}
              onNodeSelect={setCanvasItem}
              selectedNode={canvasItem}
              onBack={handleCanvasClose}
              onAddNode={handleAddNode}
            />
          </div>
          
          {/* Right - Nodes + Elements Editor */}
          <div className="w-2/3 h-full">
            <HierarchyEditorPanel
              selectedNode={canvasItem}
              hierarchy={selectedHierarchy}
              hierarchyStructure={hierarchyStructure}
              onSave={handleSaveItem}
              onAddNode={handleAddNode}
              onDeleteNode={handleDeleteElement}
              onAddElement={handleAddElement}
              onDeleteElement={handleDeleteElement}
              onClose={handleCanvasClose}
              onRefresh={refreshHierarchyStructure}
              onExportHierarchyData={handleExportHierarchyData}
              onImportHierarchyData={handleImportHierarchyData}
              hierarchyType="account"
            />
          </div>
        </div>
      )
    } else {
      // Show hierarchy list like before
      return (
        <div className="p-6 space-y-6">
          {/* Hierarchy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hierarchies.map((hierarchy) => (
              <div
                key={hierarchy.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow cursor-pointer"
                onDoubleClick={async () => {
                  setSelectedHierarchy(hierarchy)
                  setShowCanvas(true)
                  // Load hierarchy structure when opening canvas
                  await loadHierarchyStructure(hierarchy.id)
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Layers className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {hierarchy.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {hierarchy.description || 'Account hierarchy structure'}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {accounts.filter(account => account.hierarchy_id === hierarchy.id).length} accounts
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        hierarchy.status === 'Active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {hierarchy.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Double-click to open hierarchy editor
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Hierarchy Button */}
          <div className="flex justify-center">
            <button
              onClick={handleAddHierarchy}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Hierarchy</span>
            </button>
          </div>

          {/* Export/Import Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hierarchy Data Management</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => handleExport('hierarchies')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Hierarchies
              </button>
              <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import Hierarchies
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => handleImport('hierarchies', e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )
    }
  }

  const renderAccountsTab = () => (
    <div className="p-6 space-y-6">
      {/* Export/Import Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Data Management</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => handleExport('accounts')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Accounts
          </button>
          <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import Accounts
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleImport('accounts', e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <ElementsList 
          items={accounts || []} 
          type="account"
          hierarchies={hierarchies || []}
          onAddItem={handleAddElement}
          onEditItem={handleEditElement}
          onDeleteItem={handleDeleteElement}
          onRefresh={loadAccountData}
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage account hierarchies and accounts</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshCompanyData}
                className="btn-secondary flex items-center"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'hierarchies', name: 'Hierarchies', icon: Layers },
              { id: 'accounts', name: 'Accounts', icon: BookOpen }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 flex flex-col">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'hierarchies' && renderHierarchiesTab()}
        {activeTab === 'accounts' && renderAccountsTab()}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <CustomFieldsManager
          type={settingsType}
          isVisible={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={(fields) => handleCustomFieldChange(settingsType, fields)}
          companyName={selectedCompany}
        />
      )}

      {/* FST Designer Modal */}
      {showFSTDesigner && (
        <FSTDesigner
          isVisible={showFSTDesigner}
          onClose={() => setShowFSTDesigner(false)}
        />
      )}

      {/* Hierarchy Manager Modal */}
      {showHierarchyManager && (
        <HierarchyManager
          isVisible={showHierarchyManager}
          onClose={() => {
            setShowHierarchyManager(false)
            setSelectedHierarchy(null)
          }}
          hierarchy={selectedHierarchy}
          onSave={() => {
            console.log('Saving hierarchy changes')
            // TODO: Implement save logic
          }}
        />
      )}

    </div>
  )
}

export default AxesAccounts
