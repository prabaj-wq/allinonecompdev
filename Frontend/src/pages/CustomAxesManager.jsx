import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
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
  ArrowUpDown,
  ArrowLeft
} from 'lucide-react'
import SummaryCard from '../components/SummaryCard'
import CustomFieldsManager from '../components/CustomFieldsManager'
import ElementsList from '../components/ElementsList'
import HierarchyNodesPanel from '../components/HierarchyNodesPanel'
import HierarchyEditorPanel from '../components/HierarchyEditorPanel'

const CustomAxesManager = () => {
  const { axisName } = useParams()
  const { selectedCompany } = useCompany()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState('list') // list, tree, graph
  const [hierarchies, setHierarchies] = useState([])
  const [elements, setElements] = useState([])
  const [axisInfo, setAxisInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsType, setSettingsType] = useState(null)
  const [selectedHierarchy, setSelectedHierarchy] = useState(null)
  const [selectedElement, setSelectedElement] = useState(null)
  const [showCanvas, setShowCanvas] = useState(false)
  const [canvasItem, setCanvasItem] = useState(null)
  const [hierarchyStructure, setHierarchyStructure] = useState({
    nodes: [],
    unassigned_entities: [],
    hierarchy_id: null
  })

  // Load data on component mount and when company changes
  useEffect(() => {
    if (selectedCompany && axisName) {
      loadAxisData()
    }
  }, [selectedCompany, axisName])

  const loadAxisData = async () => {
    setLoading(true)
    try {
      console.log('Loading custom axis data for:', axisName)
      
      // Load axis information from custom-axes API
      const axisResponse = await fetch(`/api/custom-axes/${axisName}?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (axisResponse.ok) {
        const axisData = await axisResponse.json()
        setAxisInfo(axisData.axis)
        console.log('✅ Loaded axis info:', axisData.axis)
      }

      // Load hierarchies using axes-entity API (same as entity management)
      const hierarchiesResponse = await fetch(`/api/axes-entity/hierarchies?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (hierarchiesResponse.ok) {
        const hierarchiesData = await hierarchiesResponse.json()
        const hierarchiesList = hierarchiesData.hierarchies || []
        
        // Filter for custom type hierarchies or create custom ones
        const customHierarchies = hierarchiesList.filter(h => 
          h.hierarchy_type === 'custom' || 
          h.hierarchy_type === axisName ||
          h.hierarchy_name.toLowerCase().includes(axisName.toLowerCase())
        )
        
        console.log('✅ Loaded custom axis hierarchies:', customHierarchies.length)
        setHierarchies(customHierarchies)
        
        // Load elements using axes-entity API (same as entity management)
        const elementsResponse = await fetch(`/api/axes-entity/entities?company_name=${encodeURIComponent(selectedCompany)}`, {
          credentials: 'include'
        })
        
        if (elementsResponse.ok) {
          const elementsData = await elementsResponse.json()
          const elementsList = elementsData.entities || []
          
          // Filter elements that belong to custom hierarchies
          const customElements = elementsList.filter(element => 
            customHierarchies.some(h => h.id === element.hierarchy_id)
          )
          
          // Transform elements to match expected format
          const transformedElements = customElements.map(element => ({
            id: element.id,
            code: element.code,
            name: element.name,
            type: element.entity_type || 'Element',
            status: 'Active',
            hierarchy: 'No Hierarchy',
            hierarchy_id: element.hierarchy_id,
            entity_type: element.entity_type,
            geography: element.geography,
            currency: element.currency,
            custom_fields: element.custom_fields || {}
          }))
          
          // Update hierarchy counts
          const updatedHierarchies = customHierarchies.map(hierarchy => {
            const elementCount = transformedElements.filter(element => element.hierarchy_id === hierarchy.id).length
            return {
              ...hierarchy,
              count: elementCount
            }
          })
          
          // Assign hierarchy names to elements
          const elementsWithHierarchy = transformedElements.map(element => {
            const hierarchy = updatedHierarchies.find(h => h.id === element.hierarchy_id)
            return {
              ...element,
              hierarchy: hierarchy ? hierarchy.hierarchy_name : 'No Hierarchy'
            }
          })
          
          console.log('✅ Loaded custom axis elements:', elementsWithHierarchy.length)
          setHierarchies(updatedHierarchies)
          setElements(elementsWithHierarchy)
        } else {
          console.warn('Failed to load elements')
          setElements([])
        }
      } else {
        console.warn('Failed to load hierarchies')
        setHierarchies([])
        setElements([])
      }
    } catch (error) {
      console.error('Error loading custom axis data:', error)
      setHierarchies([])
      setElements([])
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

  const handleAddHierarchy = async () => {
    const hierarchyName = prompt('Enter hierarchy name:')
    if (hierarchyName) {
      try {
        const response = await fetch(`/api/axes-entity/hierarchies?company_name=${encodeURIComponent(selectedCompany)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            hierarchy_name: hierarchyName,
            hierarchy_type: axisName, // Use axis name as hierarchy type
            description: `Custom hierarchy for ${axisName}: ${hierarchyName}`
          })
        })
        
        if (response.ok) {
          console.log('Hierarchy created successfully')
          await loadAxisData()
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
      console.log('Creating custom axis element with data:', elementData)
      
      // Transform element data to match entity format
      const entityData = {
        name: elementData.name || elementData.entity_name || '',
        code: elementData.code || elementData.entity_code || '',
        entity_type: elementData.entity_type || elementData.type || 'Custom',
        geography: elementData.geography || elementData.country || '',
        currency: elementData.currency || 'USD',
        hierarchy_id: elementData.hierarchy_id || null,
        parent_id: elementData.parent_id || null,
        level: elementData.level || 0,
        custom_fields: elementData.custom_fields || {}
      }
      
      const response = await fetch(`/api/axes-entity/entities?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(entityData)
      })
      
      if (response.ok) {
        console.log('Element created successfully')
        await loadAxisData()
        return true
      } else {
        const errorText = await response.text()
        console.error('Failed to create element:', response.status, errorText)
        alert('Failed to create element. Please try again.')
        return false
      }
    } catch (error) {
      console.error('Error creating element:', error)
      return false
    }
  }

  const handleHierarchySelect = async (hierarchy) => {
    setSelectedHierarchy(hierarchy)
    setActiveTab('hierarchies')
    setShowCanvas(false)
    
    // Load hierarchy structure for the selected hierarchy
    await loadHierarchyStructure(hierarchy.id)
  }

  const loadHierarchyStructure = async (hierarchyId) => {
    try {
      console.log('Loading hierarchy structure for hierarchy ID:', hierarchyId)
      
      const response = await fetch(`/api/axes-entity/hierarchy-structure/${hierarchyId}?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Hierarchy structure loaded:', data)
        setHierarchyStructure(data)
      } else {
        console.error('Failed to load hierarchy structure:', response.status)
        setHierarchyStructure({
          nodes: [],
          unassigned_entities: [],
          hierarchy_id: hierarchyId
        })
      }
    } catch (error) {
      console.error('Error loading hierarchy structure:', error)
      setHierarchyStructure({
        nodes: [],
        unassigned_entities: [],
        hierarchy_id: hierarchyId
      })
    }
  }

  const handleCanvasClose = () => {
    setShowCanvas(false)
    setCanvasItem(null)
  }

  const handleSaveItem = async (itemData) => {
    try {
      if (itemData.id) {
        await handleEditElement(itemData)
      } else {
        await handleAddElement(itemData)
      }
    } catch (error) {
      console.error('Error saving item:', error)
      throw error
    }
  }

  const handleEditElement = async (elementData) => {
    try {
      const elementCode = elementData.code
      console.log('Updating element with code:', elementCode)
      
      // Transform element data to match entity format
      const entityData = {
        name: elementData.name || elementData.entity_name || '',
        code: elementData.code || elementData.entity_code || '',
        entity_type: elementData.entity_type || elementData.type || 'Custom',
        geography: elementData.geography || elementData.country || '',
        currency: elementData.currency || 'USD',
        hierarchy_id: elementData.hierarchy_id || null,
        parent_id: elementData.parent_id || null,
        level: elementData.level || 0,
        custom_fields: elementData.custom_fields || {}
      }
      
      const response = await fetch(`/api/axes-entity/entities/${elementCode}?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(entityData)
      })
      
      if (response.ok) {
        console.log('Element updated successfully')
        await loadAxisData()
        return true
      } else {
        console.error('Failed to update element')
        return false
      }
    } catch (error) {
      console.error('Error updating element:', error)
      return false
    }
  }

  const handleDeleteElement = async (elementCode) => {
    try {
      const response = await fetch(`/api/axes-entity/entities/${elementCode}?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        console.log('Element deleted successfully')
        await loadAxisData()
        return true
      } else {
        console.error('Failed to delete element')
        return false
      }
    } catch (error) {
      console.error('Error deleting element:', error)
      return false
    }
  }

  const refreshHierarchyStructure = async () => {
    if (selectedHierarchy) {
      await loadHierarchyStructure(selectedHierarchy.id)
    }
  }

  const handleAddNode = async () => {
    console.log('Adding new node...')
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
                label: 'Total Elements',
                value: elements?.length || 0,
                icon: '📊'
              },
              {
                label: 'Custom Fields',
                value: axisInfo?.columns?.length || 0,
                icon: '🔧'
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
            total: elements?.length || 0,
            active: elements?.filter(e => e.status === 'Active').length || 0,
            items: [
              {
                label: 'With Hierarchy',
                value: elements?.filter(e => e.hierarchy_id).length || 0,
                icon: '🏗️'
              },
              {
                label: 'Unassigned',
                value: elements?.filter(e => !e.hierarchy_id).length || 0,
                icon: '📋'
              },
              {
                label: 'Table Name',
                value: axisInfo?.table_name || 'N/A',
                icon: '🗃️'
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
      return (
        <div className="h-full flex">
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
              hierarchyType="custom"
              customFields={axisInfo?.columns || []}
            />
          </div>
        </div>
      )
    } else {
      return (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hierarchies.map((hierarchy) => (
              <div
                key={hierarchy.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow cursor-pointer"
                onDoubleClick={async () => {
                  setSelectedHierarchy(hierarchy)
                  setShowCanvas(true)
                  await loadHierarchyStructure(hierarchy.id)
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Layers className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {hierarchy.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {hierarchy.description || `${axisName} hierarchy structure`}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        {elements.filter(element => element.hierarchy_id === hierarchy.id).length} elements
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

          <div className="flex justify-center">
            <button
              onClick={handleAddHierarchy}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Hierarchy</span>
            </button>
          </div>
        </div>
      )
    }
  }

  const renderElementsTab = () => (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <ElementsList 
          items={elements || []} 
          type="element"
          hierarchies={hierarchies || []}
          onAddItem={handleAddElement}
          onEditItem={handleEditElement}
          onDeleteItem={handleDeleteElement}
          onRefresh={loadAxisData}
          customFields={axisInfo?.columns || []}
        />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading {axisName} Management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {axisInfo?.axis_name || axisName} Management
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage {axisName} hierarchies and elements
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadAxisData}
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
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
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
    </div>
  )
}

export default CustomAxesManager
