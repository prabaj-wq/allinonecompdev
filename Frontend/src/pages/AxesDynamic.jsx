import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import { 
  BookOpen, 
  Layers, 
  Plus, 
  BarChart3,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Save,
  Download,
  Upload
} from 'lucide-react'
import SummaryCard from '../components/SummaryCard'
import CustomFieldsManager from '../components/CustomFieldsManager'
import ElementsList from '../components/ElementsList'
import HierarchyNodesPanel from '../components/HierarchyNodesPanel'
import HierarchyEditorPanel from '../components/HierarchyEditorPanel'
import { toast } from 'react-hot-toast'

const AxesDynamic = () => {
  const { axisName } = useParams()
  const navigate = useNavigate()
  const { selectedCompany, refreshCompanyData } = useCompany()
  const { isAuthenticated } = useAuth()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [hierarchies, setHierarchies] = useState([])
  const [elements, setElements] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsType, setSettingsType] = useState(null)
  const [selectedHierarchy, setSelectedHierarchy] = useState(null)
  const [showCanvas, setShowCanvas] = useState(false)
  const [canvasItem, setCanvasItem] = useState(null)
  const [hierarchyStructure, setHierarchyStructure] = useState({
    nodes: [],
    unassigned_entities: [],
    hierarchy_id: null
  })
  const [axisMetadata, setAxisMetadata] = useState(null)
  const [customFields, setCustomFields] = useState([])

  useEffect(() => {
    if (axisName && isAuthenticated) {
      loadAxisData()
      loadAxisMetadata()
    }
  }, [axisName, selectedCompany, isAuthenticated])

  const loadAxisMetadata = async () => {
    try {
      // Load the axis definition to get custom columns
      const response = await fetch('/api/axes', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const currentAxis = data.axes.find(axis => 
          axis.axis_name.toLowerCase().replace(/\s+/g, '_') === axisName.toLowerCase() ||
          axis.axis_name.toLowerCase() === axisName.toLowerCase() ||
          axis.axis_name.toLowerCase().replace(/\s+/g, '') === axisName.toLowerCase()
        )
        
        if (currentAxis) {
          setAxisMetadata(currentAxis)
          setCustomFields(currentAxis.columns || [])
          console.log('Loaded axis metadata:', currentAxis)
          console.log('Custom fields:', currentAxis.columns)
        } else {
          console.warn('Axis not found:', axisName, 'Available axes:', data.axes)
          
          // For the test axis, try to create it automatically
          if (axisName.toLowerCase() === 'test') {
            console.log('Creating test axis automatically...')
            await createTestAxis()
          } else {
            // For development: create a minimal axis structure for the requested axis
            const fallbackAxis = {
              axis_name: axisName,
              description: `${axisName} custom axis`,
              columns: []
            }
            setAxisMetadata(fallbackAxis)
            setCustomFields(fallbackAxis.columns)
          }
        }
      }
    } catch (error) {
      console.error('Error loading axis metadata:', error)
      setAxisMetadata({
        axis_name: axisName,
        description: `${axisName} custom axis`,
        columns: []
      })
      setCustomFields([])
    }
  }

  const createTestAxis = async () => {
    try {
      const testAxisData = {
        axis_name: 'test',
        description: 'Test management axis',
        columns: [
          {
            column_name: 'test',
            field_type: 'text',
            is_required: true,
            default_value: ''
          }
        ]
      }
      
      const response = await fetch('/api/axes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(testAxisData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Test axis created successfully:', result)
        
        // Reload axis metadata
        await loadAxisMetadata()
        toast.success('Test axis created successfully!')
      } else {
        const error = await response.json()
        console.error('Failed to create test axis:', error)
        toast.error('Failed to create test axis')
        
        // Use fallback
        const fallbackAxis = {
          axis_name: 'test',
          description: 'Test management axis (fallback)',
          columns: [
            { column_name: 'test', field_type: 'text', is_required: true, default_value: '' }
          ]
        }
        setAxisMetadata(fallbackAxis)
        setCustomFields(fallbackAxis.columns)
      }
    } catch (error) {
      console.error('Error creating test axis:', error)
      toast.error('Error creating test axis')
      
      // Use fallback
      const fallbackAxis = {
        axis_name: 'test',
        description: 'Test management axis (fallback)',
        columns: [
          { column_name: 'test', field_type: 'text', is_required: true, default_value: '' }
        ]
      }
      setAxisMetadata(fallbackAxis)
      setCustomFields(fallbackAxis.columns)
    }
  }

  const loadAxisData = async () => {
    setLoading(true)
    try {
      // Load hierarchies for this custom axis - using same endpoint as AxesEntity
      const hierarchiesResponse = await fetch('/api/hierarchies', {
        credentials: 'include'
      })
      
      if (hierarchiesResponse.ok) {
        const hierarchiesData = await hierarchiesResponse.json()
        const hierarchiesList = hierarchiesData.hierarchies || []
        
        // Filter hierarchies by axis name
        const axisHierarchies = hierarchiesList.filter(h => 
          h.hierarchy_type === axisName.toLowerCase() || 
          h.hierarchy_type === axisName ||
          h.hierarchy_type.toLowerCase() === axisName.toLowerCase()
        )
        
        const transformedHierarchies = axisHierarchies.map(hierarchy => ({
          id: hierarchy.id,
          name: hierarchy.hierarchy_name,
          description: hierarchy.description || '',
          count: 0, // Will be calculated below
          active: true,
          status: 'Active',
          type: hierarchy.hierarchy_type
        }))
        
        console.log('✅ Loaded custom axis hierarchies:', transformedHierarchies)
        setHierarchies(transformedHierarchies)
        
        // Load elements for this axis from the correct endpoint
        if (axisMetadata?.id) {
          const elementsResponse = await fetch(`/api/axes/${axisMetadata.id}/structure`, {
            credentials: 'include'
          })
          
          if (elementsResponse.ok) {
            const elementsData = await elementsResponse.json()
            const allElements = elementsData.unassigned_elements || []
            
            // Transform to match expected format
            const transformedElements = allElements.map(element => ({
              id: element.id,
              code: element.code || element.element_code,
              name: element.name || element.element_name,
              type: element.type || axisName,
              status: 'Active',
              hierarchy: 'No Hierarchy',
              hierarchy_id: null,
              description: element.description || '',
              custom_fields: element.custom_fields || {}
            }))
            
            console.log('✅ Loaded custom axis elements:', transformedElements)
            setElements(transformedElements)
          } else {
            console.warn('Failed to load elements from axis structure')
            setElements([])
          }
        } else {
          console.warn('No axis metadata available, cannot load elements')
          setElements([])
        }
      } else {
        console.warn('Failed to load hierarchies')
        setHierarchies([])
      }
    } catch (error) {
      console.error('Error loading axis data:', error)
      toast.error('Error loading axis data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddHierarchy = async () => {
    const hierarchyName = prompt('Enter hierarchy name:')
    if (hierarchyName) {
      try {
        const response = await fetch('/api/hierarchies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            hierarchy_name: hierarchyName,
            hierarchy_type: axisName.toLowerCase(),
            description: `${axisName} hierarchy: ${hierarchyName}`
          })
        })
        
        if (response.ok) {
          console.log('Hierarchy created successfully')
          await loadAxisData()
          toast.success('Hierarchy created successfully!')
        } else {
          console.error('Failed to create hierarchy')
          toast.error('Failed to create hierarchy')
        }
      } catch (error) {
        console.error('Error creating hierarchy:', error)
        toast.error('Error creating hierarchy')
      }
    }
  }

  const handleHierarchySelect = async (hierarchy) => {
    setSelectedHierarchy(hierarchy)
    setActiveTab('hierarchies')
    setShowCanvas(false)
    // Load hierarchy structure immediately when hierarchy is selected
    await loadHierarchyStructure(hierarchy.id)
  }

  const loadHierarchyStructure = async (hierarchyId) => {
    try {
      console.log('Loading hierarchy structure for hierarchy ID:', hierarchyId)
      
      // Use the same endpoint as AxesEntity and AxesAccounts
      const response = await fetch(`/api/hierarchy-structure/${hierarchyId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Hierarchy structure loaded:', data)
        console.log('Nodes:', data.nodes)
        console.log('Unassigned entities:', data.unassigned_entities)
        
        // Set the hierarchy structure data exactly like AxesEntity
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

  const handleCanvasClose = () => {
    setShowCanvas(false)
    setCanvasItem(null)
  }

  const promptForCustomFields = (initialData = {}) => {
    const fieldValues = { ...initialData }
    
    // First, get basic information
    const elementName = prompt('Enter element name:', initialData.element_name || initialData.name || '')
    if (!elementName) return null
    
    const elementCode = prompt('Enter element code:', initialData.element_code || initialData.code || `${axisName.toUpperCase()}_${Date.now()}`)
    if (!elementCode) return null
    
    fieldValues.element_name = elementName
    fieldValues.element_code = elementCode
    fieldValues.element_type = axisName
    
    // Then get custom field values
    for (const field of customFields) {
      const currentValue = initialData.custom_fields?.[field.column_name] || ''
      let value
      
      if (field.data_type === 'boolean') {
        value = confirm(`${field.column_name}: ${field.description || 'Enter value'}`)
      } else if (field.data_type === 'integer' || field.data_type === 'decimal') {
        value = prompt(`${field.column_name} (${field.data_type}): ${field.description || 'Enter value'}`, currentValue)
        if (value !== null) {
          value = field.data_type === 'integer' ? parseInt(value) : parseFloat(value)
        }
      } else {
        value = prompt(`${field.column_name}: ${field.description || 'Enter value'}`, currentValue)
      }
      
      if (value !== null && value !== '') {
        fieldValues[field.column_name] = value
      }
    }
    
    return fieldValues
  }

  const handleAddElement = async (elementData) => {
    try {
      let finalElementData = elementData
      
      // If elementData is coming from RightSidebar with proper structure
      if (elementData && elementData.element_name && elementData.custom_fields) {
        console.log('Creating custom axis element from RightSidebar with data:', elementData)
        
        // Use the element data as is - it's already properly structured
        const elementPayload = {
          element_name: elementData.element_name,
          element_code: elementData.element_code,
          element_type: elementData.element_type || axisName || 'Element',
          description: elementData.description || '',
          node_id: elementData.node_id || null, // null means unassigned
          hierarchy_id: selectedHierarchy?.id || elementData.hierarchy_id,
          custom_fields: elementData.custom_fields || {} // Use the structured custom_fields
        }
        
        console.log('Processed element payload from RightSidebar:', elementPayload)
        
        // Use the correct axes items endpoint based on axis metadata
        const response = await fetch(`/api/axes/${axisMetadata?.id}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            type: 'element',
            name: elementPayload.element_name,
            code: elementPayload.element_code,
            description: elementPayload.description,
            ...elementPayload.custom_fields // Include custom fields in the payload
          })
        })
        
        if (response.ok) {
          console.log('Element created successfully')
          await loadAxisData()
          await refreshHierarchyStructure()
          toast.success('Element created successfully!')
          return true
        } else {
          const errorText = await response.text()
          console.error('Failed to create element:', response.status, errorText)
          
          if (response.status === 400 && errorText.includes('already exists')) {
            toast.error(`Element creation failed: ${errorText}`)
          } else {
            toast.error('Failed to create element. Please try again.')
          }
          return false
        }
      }
      
      // Legacy handling for prompting for custom fields (keep for backward compatibility)
      if (!elementData || (!elementData.element_name && !elementData.name)) {
        finalElementData = promptForCustomFields()
        if (!finalElementData) return false // User cancelled
      }
      
      console.log('Creating custom axis element with data:', finalElementData)
      
      // Use the same structure as AxesEntity - create entry in hierarchy_elements table
      const elementPayload = {
        element_name: finalElementData?.element_name || finalElementData?.name || '',
        element_code: finalElementData?.element_code || finalElementData?.code || `ELEM_${Date.now()}`,
        element_type: finalElementData?.element_type || axisName || 'Element',
        description: finalElementData?.description || '',
        node_id: finalElementData?.node_id || null, // null means unassigned
        hierarchy_id: selectedHierarchy?.id || finalElementData?.hierarchy_id,
        // Add custom fields from axis definition
        custom_fields: {}
      }
      
      // Add custom column values
      customFields.forEach(col => {
        if (finalElementData[col.column_name] !== undefined) {
          elementPayload.custom_fields[col.column_name] = finalElementData[col.column_name]
        }
      })
      
      console.log('Processed element payload:', elementPayload)
      
      // Use the correct axes items endpoint
      const response = await fetch(`/api/axes/${axisMetadata?.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'element',
          name: finalElementData?.element_name || finalElementData?.name || '',
          code: finalElementData?.element_code || finalElementData?.code || `ELEM_${Date.now()}`,
          description: finalElementData?.description || '',
          ...(() => {
            const customFieldsData = {}
            customFields.forEach(col => {
              if (finalElementData[col.column_name] !== undefined) {
                customFieldsData[col.column_name] = finalElementData[col.column_name]
              }
            })
            return customFieldsData
          })()
        })
      })
      
      if (response.ok) {
        console.log('Element created successfully')
        await loadAxisData()
        await refreshHierarchyStructure()
        toast.success('Element created successfully!')
        return true
      } else {
        const errorText = await response.text()
        console.error('Failed to create element:', response.status, errorText)
        
        if (response.status === 400 && errorText.includes('already exists')) {
          toast.error(`Element creation failed: ${errorText}`)
        } else {
          toast.error('Failed to create element. Please try again.')
        }
        return false
      }
    } catch (error) {
      console.error('Error creating element:', error)
      toast.error('Error creating element')
      return false
    }
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

  const handleAddNode = async (nodeData) => {
    try {
      console.log('Creating hierarchy node with data:', nodeData)
      
      // Use the same structure as AxesEntity - create entry in hierarchy_nodes table
      const nodePayload = {
        entity_name: nodeData?.entity_name || nodeData?.name || '',  // node_name maps to entity_name
        entity_code: nodeData?.entity_code || nodeData?.code || `NODE_${Date.now()}`, // node_code maps to entity_code
        entity_type: 'Node', // Set type as Node for organizational containers
        country: '',
        currency: 'USD',
        hierarchy_id: selectedHierarchy?.id,
        parent_id: nodeData?.parent_node_id || null
      }
      
      console.log('Processed node payload:', nodePayload)
      
      // Use the same endpoint as AxesEntity for creating hierarchy nodes
      const response = await fetch('/api/hierarchy-nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(nodePayload)
      })
      
      if (response.ok) {
        console.log('Node created successfully')
        await refreshHierarchyStructure()
        toast.success('Node created successfully!')
        return true
      } else {
        const errorText = await response.text()
        console.error('Failed to create node:', response.status, errorText)
        toast.error('Failed to create node')
        return false
      }
    } catch (error) {
      console.error('Error creating node:', error)
      toast.error('Error creating node')
      return false
    }
  }

  const handleEditElement = async (elementData) => {
    try {
      // Prompt for updated values including custom fields
      const updatedData = promptForCustomFields(elementData)
      if (!updatedData) return false // User cancelled
      
      const elementId = elementData.id
      console.log('Updating element with ID:', elementId)
      
      // Use hierarchy_elements endpoint like AxesEntity
      const response = await fetch(`/api/hierarchy-elements/${elementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          element_name: updatedData.element_name,
          element_code: updatedData.element_code,
          element_type: updatedData.element_type || axisName,
          description: updatedData.description || '',
          custom_fields: (() => {
            const customFieldsData = {}
            customFields.forEach(col => {
              if (updatedData[col.column_name] !== undefined) {
                customFieldsData[col.column_name] = updatedData[col.column_name]
              }
            })
            return customFieldsData
          })()
        })
      })
      
      if (response.ok) {
        console.log('Element updated successfully')
        await loadAxisData()
        await refreshHierarchyStructure()
        toast.success('Element updated successfully!')
        return true
      } else {
        console.error('Failed to update element')
        toast.error('Failed to update element')
        return false
      }
    } catch (error) {
      console.error('Error updating element:', error)
      toast.error('Error updating element')
      return false
    }
  }

  const handleDeleteElement = async (elementId) => {
    try {
      // Use hierarchy_elements endpoint like AxesEntity
      const response = await fetch(`/api/hierarchy-elements/${elementId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        console.log('Element deleted successfully')
        await loadAxisData()
        await refreshHierarchyStructure()
        toast.success('Element deleted successfully!')
        return true
      } else {
        console.error('Failed to delete element')
        toast.error('Failed to delete element')
        return false
      }
    } catch (error) {
      console.error('Error deleting element:', error)
      toast.error('Error deleting element')
      return false
    }
  }

  const handleExport = async (type) => {
    try {
      let data, filename
      
      if (type === 'hierarchies') {
        data = hierarchies
        filename = `${axisName}_hierarchies_export.xlsx`
      } else if (type === 'elements') {
        data = elements
        filename = `${axisName}_elements_export.xlsx`
      }
      
      if (!data || data.length === 0) {
        alert(`No ${type} data to export`)
        return
      }
      
      const response = await fetch('/api/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: type,
          data: data,
          axis_name: axisName
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
        toast.success(`${type} exported successfully`)
      } else {
        console.error(`Failed to export ${type}`)
        toast.error(`Failed to export ${type}`)
      }
    } catch (error) {
      console.error(`Error exporting ${type}:`, error)
      toast.error(`Error exporting ${type}`)
    }
  }

  const handleImport = async (type, file) => {
    if (!file) return
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('axis_name', axisName)
      
      const response = await fetch('/api/import-data', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`${type} imported successfully:`, result)
        toast.success(`${type} imported successfully! ${result.count || 0} records processed.`)
        // Refresh data
        await loadAxisData()
      } else {
        console.error(`Failed to import ${type}`)
        toast.error(`Failed to import ${type}`)
      }
    } catch (error) {
      console.error(`Error importing ${type}:`, error)
      toast.error(`Error importing ${type}`)
    }
  }

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
          onSettingsClick={() => setShowSettings(true)}
          onViewClick={() => setActiveTab('hierarchies')}
          onDoubleClick={() => setActiveTab('hierarchies')}
          color="blue"
        />

        {/* Elements Summary Card */}
        <SummaryCard
          title="Elements"
          icon={BookOpen}
          data={{
            total: elements?.length || 0,
            active: elements?.filter(e => e.status === 'Active').length || 0,
            items: [
              {
                label: 'Custom Fields',
                value: customFields?.length || 0,
                icon: '🔧'
              },
              {
                label: 'Assigned',
                value: elements?.filter(e => e.hierarchy !== 'No Hierarchy').length || 0,
                icon: '📁'
              },
              {
                label: 'Element Types',
                value: [...new Set(elements?.map(e => e.type).filter(Boolean))].length || 0,
                icon: '📊'
              }
            ]
          }}
          onSettingsClick={() => setShowSettings(true)}
          onViewClick={() => setActiveTab('elements')}
          onDoubleClick={() => setActiveTab('elements')}
          color="green"
        />
      </div>

      {/* Custom Fields Information */}
      {customFields && customFields.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Custom Fields Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customFields.map((field, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white">{field.column_name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Type: {field.data_type}
                </p>
                {field.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {field.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderHierarchiesTab = () => {
    if (showCanvas) {
      // Show canvas with left nodes and right editor - exactly like AxesEntity
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
              hierarchyType={axisName.toLowerCase()}
              customFields={customFields} // Pass custom fields for prompting
            />
          </div>
        </div>
      )
    } else {
      // Show hierarchy list like AxesEntity
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
                        <BookOpen className="h-4 w-4 mr-1" />
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

          {/* Add Hierarchy Button */}
          <div className="flex justify-center">
            <button
              onClick={handleAddHierarchy}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{axisName} Data Management</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => handleExport('elements')}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Elements
          </button>
          <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import Elements
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleImport('elements', e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Elements List - exactly like AxesEntity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <ElementsList 
          items={elements || []} 
          type="element"
          hierarchies={hierarchies || []}
          onAddItem={handleAddElement}
          onEditItem={handleEditElement}
          onDeleteItem={handleDeleteElement}
          onRefresh={loadAxisData}
          customFields={customFields}
          axisName={axisName}
        />
      </div>
    </div>
  )

  if (!axisMetadata) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading {axisName}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header - exactly like AxesEntity */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {axisMetadata.axis_name} Management
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage {axisMetadata.axis_name.toLowerCase()} hierarchies and elements
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

      {/* Navigation Tabs - exactly like AxesEntity */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'hierarchies', name: 'Hierarchies', icon: Layers },
              { id: 'elements', name: 'Elements', icon: BookOpen }
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
          onSave={(fields) => {
            console.log('Custom fields updated:', fields)
            setShowSettings(false)
          }}
        />
      )}
    </div>
  )
}

export default AxesDynamic