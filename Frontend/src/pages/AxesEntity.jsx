import React, { useState, useEffect } from 'react'
import { 
  Building2, 
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

const AxesEntity = () => {
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
    unassigned_entities: [],
    hierarchy_id: null
  })
  // Load data on component mount
  useEffect(() => {
    loadEntityData()
  }, [])

  const loadEntityData = async () => {
    setLoading(true)
    try {
      console.log('Loading hierarchies...')
      // Load hierarchies from the new axes-entity endpoint
      const hierarchiesResponse = await fetch('/api/axes-entity/hierarchies?company_name=Default%20Company', {
        credentials: 'include'
      })
      if (hierarchiesResponse.ok) {
        const hierarchiesData = await hierarchiesResponse.json()
        const hierarchiesList = hierarchiesData.hierarchies || []
        
        // Filter hierarchies by type (entity type hierarchies)
        const entityHierarchies = hierarchiesList.filter(h => 
          h.hierarchy_type === 'entity' || 
          h.hierarchy_type === 'Entity' || 
          h.hierarchy_type === 'Entity Organization' ||
          h.hierarchy_type === 'ge hi' ||
          h.hierarchy_type === 'Business Units' ||
          h.hierarchy_type === 'Legal Entities'
        )
        
        console.log('Loaded entity hierarchies from PostgreSQL:', entityHierarchies.length)
        setHierarchies(entityHierarchies)
        
        console.log('Loading entities...')
        // Load entities from the new axes-entity endpoint
        const entitiesResponse = await fetch('/api/axes-entity/entities?company_name=Default%20Company', {
          credentials: 'include'
        })
        if (entitiesResponse.ok) {
          const entitiesData = await entitiesResponse.json()
          const entitiesList = entitiesData.entities || []
          
          // Transform to match expected format
          const transformedEntities = entitiesList.map(entity => ({
            id: entity.id,
            code: entity.code,
            name: entity.name,
            type: entity.entity_type || 'Subsidiary',
            status: 'Active', // Default status
            hierarchy: 'No Hierarchy', // Will be updated below
            hierarchy_id: entity.hierarchy_id,
            country: entity.geography || '',
            currency: entity.currency || 'USD',
            entity_name: entity.name,
            entity_code: entity.code,
            entity_type: entity.entity_type,
            geography: entity.geography
          }))
          
          // Update hierarchy counts and assign entities to hierarchies
          const updatedHierarchies = entityHierarchies.map(hierarchy => {
            const entityCount = transformedEntities.filter(entity => entity.hierarchy_id === hierarchy.id).length
            return {
              ...hierarchy,
              count: entityCount
            }
          })
          
          // Assign hierarchy names to entities
          const entitiesWithHierarchy = transformedEntities.map(entity => {
            const hierarchy = transformedHierarchies.find(h => h.id === entity.hierarchy_id)
            return {
              ...entity,
              hierarchy: hierarchy ? hierarchy.name : 'No Hierarchy'
            }
          })
          
          console.log('✅ Loaded entities from PostgreSQL:', entitiesWithHierarchy.length)
          console.log('Entities with hierarchy_id:', entitiesWithHierarchy.filter(e => e.hierarchy_id))
          console.log('Sample entity:', entitiesWithHierarchy[0])
          setHierarchies(updatedHierarchies)
          setAccounts(entitiesWithHierarchy)
        } else {
          console.warn('Failed to load entities, using mock data')
          setAccounts([])
        }
      } else {
        console.warn('Failed to load hierarchies, using mock data')
        setHierarchies([])
        setAccounts([])
      }
    } catch (error) {
      console.error('Error loading entity data:', error)
      setHierarchies([])
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsClick = (type) => {
    setSettingsType(type)
    setShowSettings(true)
  }

  const handleCustomFieldChange = (type, fields) => {
    console.log(`Custom fields updated for ${type}:`, fields)
    // TODO: Save to backend and update database schema
  }

  const handleViewHierarchy = (hierarchy) => {
    handleHierarchySelect(hierarchy)
  }

  const handleAddHierarchy = async () => {
    console.log('Add hierarchy clicked')
    const hierarchyName = prompt('Enter hierarchy name:')
    if (hierarchyName) {
      try {
        const response = await fetch('/api/axes-entity/hierarchies?company_name=Default%20Company', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            hierarchy_name: hierarchyName,
            hierarchy_type: 'entity',
            description: `Entity hierarchy: ${hierarchyName}`
          })
        })
        
        if (response.ok) {
          console.log('Hierarchy created successfully')
          // Refresh data immediately
          await loadEntityData()
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
      console.log('Creating entity with data:', elementData)
      
      // Ensure elementData is properly structured for the new API
      const entityData = {
        name: elementData?.entity_name || elementData?.name || '',
        code: elementData?.entity_code || elementData?.code || '',
        entity_type: elementData?.entity_type || elementData?.type || 'Subsidiary',
        geography: elementData?.country || elementData?.geography || '',
        currency: elementData?.currency || 'USD',
        hierarchy_id: elementData?.hierarchy_id || null,
        parent_id: elementData?.parent_id || null,
        level: elementData?.level || 0,
        custom_fields: elementData?.custom_fields || {}
      }
      
      console.log('Processed entity data for new API:', entityData)
      
      const response = await fetch('/api/axes-entity/entities?company_name=Default%20Company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(entityData)
      })
      
      if (response.ok) {
        console.log('Entity created successfully')
        // Refresh data immediately
        await loadEntityData()
        return true
      } else {
        const errorText = await response.text()
        console.error('Failed to create entity:', response.status, errorText)
        
        // Handle specific error cases
        if (response.status === 400 && errorText.includes('already exists')) {
          alert(`Entity creation failed: ${errorText}`)
        } else {
          alert('Failed to create entity. Please try again.')
        }
        return false
      }
    } catch (error) {
      console.error('Error creating entity:', error)
      return false
    }
  }

  const handleAddElementFromCanvas = (hierarchyId, parentId = null) => {
    // Create a new element with default values
    const newElement = {
      entity_name: '',
      entity_code: '',
      entity_type: 'Subsidiary',
      country: '',
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
      console.log('Loading hierarchy structure for hierarchy ID:', hierarchyId)
      
      const response = await fetch(`/api/axes-entity/hierarchy-structure/${hierarchyId}?company_name=Default%20Company`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Hierarchy structure loaded:', data)
        console.log('Nodes:', data.nodes)
        console.log('Unassigned entities:', data.unassigned_entities)
        
        // Set the hierarchy structure data
        setHierarchyStructure(data)
      } else {
        console.error('Failed to load hierarchy structure:', response.status)
        // Fallback to empty structure
        setHierarchyStructure({
          nodes: [],
          unassigned_entities: [],
          hierarchy_id: hierarchyId
        })
      }
    } catch (error) {
      console.error('Error loading hierarchy structure:', error)
      // Fallback to empty structure
      setHierarchyStructure({
        nodes: [],
        unassigned_entities: [],
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

  const handleExport = async (type) => {
    try {
      let data, filename
      
      if (type === 'hierarchies') {
        data = hierarchies
        filename = 'hierarchies_export.xlsx'
      } else if (type === 'entities') {
        data = accounts
        filename = 'entities_export.xlsx'
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
        await loadEntityData()
      } else {
        console.error(`Failed to import ${type}`)
        alert(`Failed to import ${type}`)
      }
    } catch (error) {
      console.error(`Error importing ${type}:`, error)
      alert(`Error importing ${type}`)
    }
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
    if (selectedHierarchy) {
      await loadHierarchyStructure(selectedHierarchy.id)
    }
  }

  const handleAddChildElement = async (parentItem) => {
    try {
      console.log('Creating new child element for parent:', parentItem)
      
      const newElementData = {
        entity_name: parentItem.entity_name || 'New Element',
        entity_code: parentItem.entity_code || `ELEM_${Date.now()}`,
        entity_type: parentItem.entity_type || 'Subsidiary',
        country: parentItem.country || '',
        currency: parentItem.currency || 'USD',
        hierarchy_id: selectedHierarchy?.id,
        parent_id: parentItem.id || null,
        is_active: true,
        status: 'Active'
      }

      console.log('New element data:', newElementData)

      const response = await fetch('/api/entities', {
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
        await loadEntityData() // Refresh the data
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
      // Use entity_code for the API endpoint
      const entityCode = elementData.entity_code || elementData.code
      console.log('Updating entity with code:', entityCode)
      
      const response = await fetch(`/api/entities/${entityCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          entity_name: elementData.entity_name,
          entity_code: elementData.entity_code,
          entity_type: elementData.entity_type,
          country: elementData.country,
          currency: elementData.currency,
          hierarchy_id: elementData.hierarchy_id
        })
      })
      
      if (response.ok) {
        console.log('Entity updated successfully')
        // Refresh data immediately
        await loadEntityData()
        return true
      } else {
        console.error('Failed to update entity')
        return false
      }
    } catch (error) {
      console.error('Error updating entity:', error)
      return false
    }
  }

  const handleDeleteElement = async (elementCode) => {
    try {
      const response = await fetch(`/api/entities/${elementCode}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        console.log('Entity deleted successfully')
        // Refresh data immediately
        await loadEntityData()
        return true
      } else {
        console.error('Failed to delete entity')
        return false
      }
    } catch (error) {
      console.error('Error deleting entity:', error)
      return false
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

        {/* Elements Summary Card */}
        <SummaryCard
          title="Elements"
          icon={Building2}
          data={{
            total: accounts?.length || 0,
            active: accounts?.filter(a => a.status === 'Active').length || 0,
            items: [
              {
                label: 'Distinct Countries',
                value: [...new Set(accounts?.map(a => a.country).filter(Boolean))].length || 0,
                icon: '🌍'
              },
              {
                label: 'Parent Entities',
                value: accounts?.filter(a => a.type === 'Parent' || a.type === 'parent').length || 0,
                icon: '🏢'
              },
              {
                label: 'Entity Types',
                value: [...new Set(accounts?.map(a => a.type).filter(Boolean))].length || 0,
                icon: '📊'
              }
            ]
          }}
          onSettingsClick={() => handleSettingsClick('elements')}
          onViewClick={() => setActiveTab('elements')}
          onDoubleClick={() => setActiveTab('elements')}
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
                      {hierarchy.description || 'Entity hierarchy structure'}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        {accounts.filter(entity => entity.hierarchy_id === hierarchy.id).length} entities
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

  const renderElementsTab = () => (
    <div className="p-6 space-y-6">
      {/* Export/Import Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Entity Data Management</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => handleExport('entities')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Entities
          </button>
          <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import Entities
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleImport('entities', e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Elements List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <ElementsList 
          items={accounts || []} 
          type="element"
          hierarchies={hierarchies || []}
          onAddItem={handleAddElement}
          onEditItem={handleEditElement}
          onDeleteItem={handleDeleteElement}
          onRefresh={loadEntityData}
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
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entity Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage entity hierarchies and accounts</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadEntityData}
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
              { id: 'elements', name: 'Elements', icon: Building2 }
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
        {activeTab === 'elements' && renderElementsTab()}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <CustomFieldsManager
          type={settingsType}
          isVisible={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={(fields) => handleCustomFieldChange(settingsType, fields)}
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

export default AxesEntity