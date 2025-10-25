import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Building2, 
  Layers, 
  Settings, 
  Plus, 
  Edit3, 
  Edit,
  Trash2,
  TreePine,
  List,
  Network,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Save,
  X,
  ChevronRight,
  ChevronDown,
  Database,
  Link,
  Eye,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react'
import AxesEntityForm from '../components/AxesEntityForm'
import CustomFieldsManager from '../components/CustomFieldsManager'
import HierarchyCreateModal from '../components/HierarchyCreateModal'
import HierarchyNodesPanelModern from '../components/HierarchyNodesPanelModern'
import HierarchyEditorPanelModern from '../components/HierarchyEditorPanelModern'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'

const AxesEntityEnhanced = () => {
  // ===== CONTEXT HOOKS =====
  const { isAuthenticated, selectedCompany: authSelectedCompany, user } = useAuth()
  const { selectedCompany: companyContextCompany, companies } = useCompany()
  
  // Use the company from auth context as primary, fallback to company context
  const selectedCompany = authSelectedCompany || companyContextCompany
  
  // Debug logging to track company selection
  useEffect(() => {
    console.log('🏢 AxesEntity Debug - Auth Company:', authSelectedCompany)
    console.log('🏢 AxesEntity Debug - Context Company:', companyContextCompany)
    console.log('🏢 AxesEntity Debug - Final Selected Company:', selectedCompany)
    console.log('🏢 AxesEntity Debug - User:', user)
  }, [authSelectedCompany, companyContextCompany, selectedCompany, user])
  
  // ===== STATE MANAGEMENT =====
  const [activeTab, setActiveTab] = useState('overview')
  const [entities, setEntities] = useState([])
  const [hierarchyTree, setHierarchyTree] = useState([])
  const [hierarchies, setHierarchies] = useState([])
  const [selectedHierarchy, setSelectedHierarchy] = useState(null)
  const [axesSettings, setAxesSettings] = useState({ custom_fields: {}, linked_axes: [] })
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [showEntityForm, setShowEntityForm] = useState(false)
  const [snapAnimations, setSnapAnimations] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showHierarchyModal, setShowHierarchyModal] = useState(false)
  const [settingsType, setSettingsType] = useState('elements')
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)
  const [showCanvas, setShowCanvas] = useState(false)
  const [canvasItem, setCanvasItem] = useState(null)
  const [hierarchyStructure, setHierarchyStructure] = useState({
    nodes: [],
    unassigned_entities: [],
    hierarchy_id: null
  })

  // Ref for HierarchyNodesPanelModern to access its methods
  const hierarchyNodesPanelRef = useRef(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const createSnapEffect = (entityId) => {
    const row = document.querySelector(`[data-entity-id="${entityId}"]`)
    if (!row) return

    // Add entity to snap animations
    setSnapAnimations(prev => new Set([...prev, entityId]))

    // Create a clone of the row for the effect
    const rowClone = row.cloneNode(true)
    rowClone.style.position = 'absolute'
    rowClone.style.top = '0'
    rowClone.style.left = '0'
    rowClone.style.width = '100%'
    rowClone.style.height = '100%'
    rowClone.style.pointerEvents = 'none'
    rowClone.style.background = 'transparent'
    row.style.visibility = 'hidden'

    // Insert the clone
    row.parentNode.insertBefore(rowClone, row.nextSibling)

    // Apply the effect to the clone
    createThanosSnap(rowClone, () => {
      // Cleanup after effect completes
      if (rowClone.parentNode) {
        rowClone.parentNode.removeChild(rowClone)
      }
      row.style.visibility = 'visible'
      row.style.opacity = '0'
      row.style.transition = 'opacity 0.3s ease-out'

      setSnapAnimations(prev => {
        const newSet = new Set(prev)
        newSet.delete(entityId)
        return newSet
      })
    })
  }

  // ===== LIFECYCLE =====
  useEffect(() => {
    if (selectedCompany && isAuthenticated) {
      initializeAxesEntity()
    }
  }, [selectedCompany, isAuthenticated])

  const initializeAxesEntity = async () => {
    setLoading(true)
    try {
      console.log('🔄 Initializing axes entity system for company:', selectedCompany)
      
      // Step 1: Initialize database tables first
      try {
        console.log('📋 Initializing database tables...')
        const initResponse = await fetch(`/api/axes-entity/init?company_name=${selectedCompany}`, {
          method: 'POST',
          credentials: 'include'
        })
        
        if (initResponse.ok) {
          console.log('✅ Database tables initialized')
        } else {
          const errorText = await initResponse.text()
          console.warn('⚠️ Table initialization warning:', errorText)
          // Continue anyway - tables might already exist
        }
      } catch (initError) {
        console.warn('⚠️ Table initialization error (continuing):', initError)
        // Continue - tables might already exist
      }
      
      // Step 2: Load all data
      console.log('🔄 Loading all data for company:', selectedCompany)
      await Promise.all([
        loadAxesSettings(),
        loadHierarchies(),
        loadEntities(),
        loadHierarchyTree()
      ])
      showToast('✅ Data loaded successfully!', 'success')
      console.log('✅ All data loaded successfully for company:', selectedCompany)
    } catch (error) {
      console.error('❌ Error initializing axes entity:', error)
      showToast('❌ Failed to load data. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadAxesSettings = async () => {
    if (!selectedCompany) return
    try {
      console.log('📋 Loading axes settings...')
      const response = await fetch(`/api/axes-entity/settings?company_name=${selectedCompany}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        
        // Convert custom_fields array back to object format for frontend use
        if (Array.isArray(data.custom_fields)) {
          const customFieldsObject = {}
          data.custom_fields.forEach(field => {
            const fieldName = field.field_name || field.name
            customFieldsObject[fieldName] = {
              label: field.field_label || field.label,
              type: field.field_type === 'sql_dropdown' ? 'sql_query' : field.field_type,
              options: field.dropdown_values || field.options || [],
              is_required: field.is_required || false,
              is_unique: field.is_unique || false,
              default_value: field.default_value || '',
              validation_rules: field.validation_rules || {},
              display_order: field.display_order || 0,
              sql_query: field.sql_query || ''
            }
          })
          data.custom_fields = customFieldsObject
        }
        
        setAxesSettings(data)
        console.log('✅ Axes settings loaded:', data)
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to load axes settings:', response.status, errorText)
        throw new Error(`Failed to load settings: ${errorText}`)
      }
    } catch (error) {
      throw error
    }
  }

  const loadEntities = async () => {
    if (!selectedCompany) return
    try {
      console.log('🏢 Loading entities...')
      const response = await fetch(`/api/axes-entity/entities?company_name=${selectedCompany}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setEntities(data.entities || [])
        console.log('✅ Entities loaded:', data.entities?.length || 0, 'entities')
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to load entities:', response.status, errorText)
        throw new Error(`Failed to load entities: ${errorText}`)
      }
    } catch (error) {
      console.error('❌ Error loading entities:', error)
      throw error
    }
  }

  const loadHierarchyTree = async () => {
    // This function is used for refreshing hierarchy-related data
    // For now, it just refreshes hierarchies and entities
    try {
      setLoading(true)
      console.log('🌳 Loading hierarchy tree...')
      await Promise.all([
        loadHierarchies(),
        loadEntities()
      ])
      console.log('✅ Hierarchy tree loaded successfully')
    } catch (error) {
      console.error('❌ Error loading hierarchy tree:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHierarchies = async () => {
    try {
      console.log('📁 Loading hierarchies...')
      const response = await fetch(`/api/axes-entity/hierarchies?company_name=${selectedCompany}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setHierarchies(data.hierarchies || [])
        console.log('✅ Hierarchies loaded:', data.hierarchies?.length || 0, 'hierarchies')
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to load hierarchies:', response.status, errorText)
        throw new Error(`Failed to load hierarchies: ${errorText}`)
      }
    } catch (error) {
      console.error('Error loading hierarchy tree:', error)
    }
  }

  const loadHierarchyStructure = async (hierarchyId) => {
    try {
      console.log('📁 Loading hierarchy structure for hierarchy ID:', hierarchyId)
      
      const response = await fetch(`/api/axes-entity/hierarchy-structure/${hierarchyId}?company_name=${selectedCompany}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Hierarchy structure loaded:', data)
        setHierarchyStructure(data)
      } else {
        console.error('❌ Failed to load hierarchy structure:', response.status)
        // Fallback to empty structure
        setHierarchyStructure({
          nodes: [],
          unassigned_entities: [],
          hierarchy_id: hierarchyId
        })
      }
    } catch (error) {
      console.error('❌ Error loading hierarchy structure:', error)
      setHierarchyStructure({
        nodes: [],
        unassigned_entities: [],
        hierarchy_id: hierarchyId
      })
    }
  }

  const createEntity = async (entityData) => {
    try {
      console.log('🔄 Creating entity with data:', entityData)
      
      // Validate required fields
      if (!entityData.name?.trim()) {
        showToast('❌ Entity name is required', 'error')
        return false
      }
      if (!entityData.code?.trim()) {
        showToast('❌ Entity code is required', 'error')
        return false
      }

      const response = await fetch(`/api/axes-entity/entities?company_name=${selectedCompany}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(entityData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Entity created successfully:', result)
        showToast(`✅ Entity "${entityData.name}" created successfully!`, 'success')
        
        // Refresh data to show the new entity
        await refreshAllData()
        return true
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to create entity:', response.status, errorText)
        showToast(`❌ Failed to create entity: ${errorText}`, 'error')
        return false
      }
    } catch (error) {
      console.error('❌ Error creating entity:', error)
      showToast(`❌ Error creating entity: ${error.message}`, 'error')
      return false
    }
  }

  const updateEntity = async (entityId, entityData) => {
    try {
      const response = await fetch(`/api/axes-entity/entities/${entityId}?company_name=${selectedCompany}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(entityData)
      })
      
      if (response.ok) {
        await refreshAllData()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating entity:', error)
      return false
    }
  }

  const handleCustomFieldChange = async (type, fields) => {
    try {
      console.log(`🔄 Updating custom fields for ${type}:`, fields)
      
      // Convert fields object to array format expected by backend
      const fieldsArray = Object.entries(fields).map(([name, config]) => ({
        field_name: name,
        field_label: config.label || name,
        field_type: config.type === 'sql_query' ? 'sql_dropdown' : config.type,
        is_required: config.is_required || false,
        is_unique: config.is_unique || false,
        default_value: config.default_value || '',
        dropdown_values: config.options || [],
        sql_query: config.sql_query || null,
        validation_rules: config.validation_rules || {}
      }))
      
      console.log(`🔄 Converted fields to array format:`, fieldsArray)
      
      // Update local state immediately for better UX
      setAxesSettings(prev => ({
        ...prev,
        custom_fields: fields
      }))

      // Save to backend
      const response = await fetch(`/api/axes-entity/settings?company_name=${selectedCompany}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          axes_type: 'entity',
          custom_fields: fieldsArray,
          linked_axes: []
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Custom fields saved successfully:', result)
        showToast('✅ Custom fields saved successfully!', 'success')
        
        // Reload settings to ensure consistency
        await loadAxesSettings()
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to save custom fields:', response.status, errorText)
        showToast(`❌ Failed to save custom fields: ${errorText}`, 'error')
        
        // Revert local state on error
        await loadAxesSettings()
      }
    } catch (error) {
      console.error('❌ Error saving custom fields:', error)
      showToast(`❌ Error saving custom fields: ${error.message}`, 'error')
      
      // Revert local state on error
      await loadAxesSettings()
    }
  }

  const handleEntitySave = async (entityData) => {
    if (selectedEntity && selectedEntity.id) {
      return await updateEntity(selectedEntity.id, entityData)
    } else {
      return await createEntity(entityData)
    }
  }

  const handleAddHierarchy = () => {
    setShowHierarchyModal(true)
  }

  const handleHierarchySelect = async (hierarchy) => {
    console.log('🎯 Opening hierarchy canvas for:', hierarchy.hierarchy_name)
    setSelectedHierarchy(hierarchy)
    setShowCanvas(true)
    setCanvasItem(null)
    
    // Load hierarchy structure when opening canvas
    await loadHierarchyStructure(hierarchy.id)
  }

  const handleCanvasClose = () => {
    setShowCanvas(false)
    setSelectedHierarchy(null)
    setCanvasItem(null)
    setHierarchyStructure({
      nodes: [],
      unassigned_entities: [],
      hierarchy_id: null
    })
  }

  const refreshHierarchyStructure = async () => {
    if (selectedHierarchy) {
      await loadHierarchyStructure(selectedHierarchy.id)
    }
    // Also refresh the main hierarchies list to ensure it's up to date
    await loadHierarchies()
  }

  const refreshAllData = async () => {
    // Refresh all data to ensure sync between tabs
    await Promise.all([
      loadEntities(),
      loadHierarchies(),
      loadHierarchyTree(),
      selectedHierarchy ? loadHierarchyStructure(selectedHierarchy.id) : Promise.resolve()
    ])
  }

  const handleEditHierarchy = (hierarchy) => {
    // Open edit modal with hierarchy data
    setSelectedHierarchy(hierarchy)
    setShowHierarchyModal(true)
  }

  const handleDeleteHierarchy = async (hierarchy) => {
    if (!confirm(`Are you sure you want to delete the hierarchy "${hierarchy.hierarchy_name}"? This will also delete all nodes and unassign all entities.`)) {
      return
    }

    try {
      const response = await fetch(`/api/axes-entity/hierarchies/${hierarchy.id}?company_name=${selectedCompany}&cascade=true`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        showToast(`Hierarchy "${hierarchy.hierarchy_name}" deleted successfully`, 'success')
        await refreshAllData() // Refresh all data to ensure sync
      } else {
        const errorText = await response.text()
        showToast(`Failed to delete hierarchy: ${errorText}`, 'error')
      }
    } catch (error) {
      console.error('Error deleting hierarchy:', error)
      showToast('Failed to delete hierarchy', 'error')
    }
  }

  // Export hierarchy data as CSV
  const handleExportHierarchy = async (e) => {
    try {
      console.log('🔄 Export hierarchy button clicked - Event:', e)
      console.log('🔄 Selected hierarchy:', selectedHierarchy)
      
      // Prevent event bubbling
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      
      if (!selectedHierarchy) {
        showToast('❌ No hierarchy selected to export', 'error')
        return
      }

      console.log('🔄 Exporting hierarchy data as CSV...')
      
      // Get current hierarchy structure and entities
      const structureResponse = await fetch(`/api/axes-entity/hierarchy-structure/${selectedHierarchy.id}?company_name=${selectedCompany}`, {
        credentials: 'include'
      })
      
      if (!structureResponse.ok) {
        showToast('❌ Failed to load hierarchy structure', 'error')
        return
      }
      
      const structureData = await structureResponse.json()
      const nodes = structureData.nodes || []
      const entities = structureData.entities || []
      
      console.log('🔍 Raw structure data:', structureData)
      console.log('🔍 Nodes from API:', nodes.length)
      console.log('🔍 Entities from API:', entities.length)
      
      // Also try to get entities from the main entities list if structure doesn't have them
      if (entities.length === 0) {
        console.log('⚠️ No entities in structure, checking main entities list')
        console.log('🔍 Main entities available:', window.allEntities?.length || 'none')
      }
      
      // Create CSV data with columns: node_id, node_name, element, level, parent_node_code
      const csvData = []
      
      // Add header row with new format (including custom fields)
      const customFieldNames = Object.keys(axesSettings.custom_fields || {})
      const headers = ['node_id', 'node_name', 'elements', 'level', 'parent_node_code', ...customFieldNames]
      csvData.push(headers)
      
      // Helper function to flatten nested nodes
      const flattenNodes = (nodeList) => {
        const flattened = []
        
        const processNode = (node) => {
          flattened.push(node)
          if (node.children && node.children.length > 0) {
            node.children.forEach(child => processNode(child))
          }
        }
        
        nodeList.forEach(node => processNode(node))
        return flattened
      }
      
      // Flatten all nodes (including nested children)
      const allNodes = flattenNodes(nodes)
      
      // Helper function to find parent node code/name
      const getParentNodeCode = (node) => {
        if (!node.parent_id) return ''
        // Search in flattened nodes for parent
        const parentNode = allNodes.find(n => n.id == node.parent_id)
        if (parentNode) {
          // Use the code if available, otherwise generate from name
          if (parentNode.code) {
            return parentNode.code
          } else if (parentNode.name) {
            // Generate code like INDIA_NEW, KOLKATA_NEW
            return parentNode.name.toUpperCase().replace(/\s+/g, '_') + '_NEW'
          }
          return parentNode.id
        }
        return ''
      }
      
      console.log('📊 Exporting nodes:', allNodes.length, 'entities:', entities.length)
      console.log('📊 All nodes:', allNodes.map(n => ({ id: n.id, name: n.name, parent_id: n.parent_id })))
      console.log('📊 All entities:', entities.map(e => ({ id: e.id, code: e.code, node_id: e.node_id })))
      
      // Add all nodes with their structure (one row per node with all elements)
      allNodes.forEach(node => {
        // Get all entities assigned to this node
        const nodeEntities = entities.filter(entity => {
          const matches = entity.node_id == node.id
          if (matches) {
            console.log(`🔍 Entity ${entity.code} (${entity.id}) matches node ${node.name} (${node.id})`)
          }
          return matches
        })
        
        console.log(`📊 Node ${node.name} (${node.id}): found ${nodeEntities.length} entities:`, nodeEntities.map(e => e.code))
        
        // Also check all entities for this node using different comparisons
        const altCheck1 = entities.filter(e => e.node_id === node.id)
        const altCheck2 = entities.filter(e => String(e.node_id) === String(node.id))
        const altCheck3 = entities.filter(e => parseInt(e.node_id) === parseInt(node.id))
        
        if (altCheck1.length !== nodeEntities.length || altCheck2.length !== nodeEntities.length || altCheck3.length !== nodeEntities.length) {
          console.log(`🚨 Comparison mismatch for node ${node.name}:`, {
            '==': nodeEntities.length,
            '===': altCheck1.length, 
            'string': altCheck2.length,
            'parseInt': altCheck3.length
          })
        }
        
        // Create elements array in format [code1, code2, ...]
        let elementsArray = []
        if (nodeEntities.length > 0) {
          elementsArray = nodeEntities.map(entity => entity.code || '').filter(code => code)
        }
        
        // Format elements as [code1, code2, ...] or [] if empty
        const elementsString = elementsArray.length > 0 ? `[${elementsArray.join(', ')}]` : '[]'
        
        // Get parent node code with better logic
        const parentCode = getParentNodeCode(node)
        console.log(`📊 Node ${node.name} parent code:`, parentCode)
        
        // Add custom field values for entities in this node
        const customFieldValues = []
        if (nodeEntities.length > 0) {
          // Use first entity's custom fields as representative
          const firstEntity = nodeEntities[0]
          customFieldNames.forEach(fieldName => {
            const value = firstEntity.custom_fields?.[fieldName] || ''
            customFieldValues.push(value)
          })
        } else {
          // Empty values for nodes without entities
          customFieldValues.push(...new Array(customFieldNames.length).fill(''))
        }
        
        csvData.push([
          node.id,
          node.name || '',
          elementsString,
          node.level || 0,
          parentCode,
          ...customFieldValues
        ])
      })
      
      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n')
      
      // Create and download CSV file
      const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `hierarchy_${selectedHierarchy.hierarchy_name}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showToast(`✅ Exported hierarchy "${selectedHierarchy.hierarchy_name}" as CSV successfully!`, 'success')
      
    } catch (error) {
      console.error('❌ Error exporting hierarchy:', error)
      showToast('❌ Failed to export hierarchy', 'error')
    }
  }

  // Import hierarchy data from CSV with smart updates
  const handleImportHierarchy = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      if (!selectedHierarchy) {
        showToast('❌ No hierarchy selected for import', 'error')
        return
      }

      console.log('🔄 Importing hierarchy data from CSV...')
      
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        showToast('❌ Invalid CSV file. Must have header and data rows.', 'error')
        return
      }
      
      // Parse header
      const header = lines[0].split(',').map(col => col.replace(/"/g, '').trim())
      const requiredColumns = ['node_id', 'node_name', 'elements', 'level', 'parent_node_code']
      
      if (!requiredColumns.every(col => header.includes(col))) {
        showToast('❌ Invalid CSV format. Required columns: node_id, node_name, elements, level, parent_node_code', 'error')
        return
      }
      
      // Identify custom field columns (any column beyond the required ones)
      const customFieldColumns = header.filter(col => !requiredColumns.includes(col))
      console.log('📋 Custom field columns found:', customFieldColumns)
      
      let processedCount = 0
      let updatedCount = 0
      let skippedCount = 0
      
      // Get current hierarchy structure for comparison
      const structureResponse = await fetch(`/api/axes-entity/hierarchy-structure/${selectedHierarchy.id}?company_name=${selectedCompany}`, {
        credentials: 'include'
      })
      
      const currentStructure = structureResponse.ok ? await structureResponse.json() : { nodes: [], entities: [] }
      const currentNodes = currentStructure.nodes || []
      const currentEntities = currentStructure.entities || []
      
      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(val => val.replace(/"/g, '').trim())
        const rowData = {}
        
        header.forEach((col, index) => {
          rowData[col] = values[index] || ''
        })
        
        const { node_id, node_name, elements, level, parent_node_code } = rowData
        
        // Skip empty rows
        if (!node_id && !node_name) {
          skippedCount++
          continue
        }
        
        // Parse elements array from format [code1, code2, ...] or []
        let elementCodes = []
        if (elements && elements.trim()) {
          const elementsStr = elements.trim()
          if (elementsStr !== '[]' && elementsStr.startsWith('[') && elementsStr.endsWith(']')) {
            const innerContent = elementsStr.slice(1, -1).trim()
            if (innerContent) {
              elementCodes = innerContent.split(',').map(code => code.trim()).filter(code => code)
            }
          }
        }
        
        // Check if node exists, create if not
        let existingNode = currentNodes.find(n => n.id == node_id)
        if (!existingNode && node_name) {
          // Create new node
          let parentId = null
          if (parent_node_code) {
            const parentNode = currentNodes.find(n => 
              n.code === parent_node_code || 
              n.name === parent_node_code || 
              n.id == parent_node_code
            )
            parentId = parentNode?.id || null
          }
          
          const createResponse = await fetch(`/api/axes-entity/hierarchy-nodes?company_name=${selectedCompany}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              hierarchy_id: selectedHierarchy.id,
              name: node_name,
              code: node_name.toUpperCase().replace(/\s+/g, '_'), // Generate code from name
              parent_id: parentId,
              level: parseInt(level) || 0
            })
          })
          
          if (createResponse.ok) {
            const newNode = await createResponse.json()
            existingNode = newNode
            updatedCount++
          }
        }
        
        // Process element assignments for this node
        if (elementCodes.length > 0 && existingNode) {
          for (const elementCode of elementCodes) {
            const entityToAssign = currentEntities.find(e => e.code === elementCode)
            
            if (entityToAssign) {
              // Extract custom field values from the current row
              const customFields = { ...entityToAssign.custom_fields }
              customFieldColumns.forEach(fieldName => {
                const fieldIndex = header.indexOf(fieldName)
                if (fieldIndex !== -1 && values[fieldIndex]) {
                  customFields[fieldName] = values[fieldIndex]
                }
              })
              
              // Check if assignment or custom fields need to be updated
              const needsUpdate = entityToAssign.node_id != existingNode.id || 
                                JSON.stringify(entityToAssign.custom_fields) !== JSON.stringify(customFields)
              
              if (needsUpdate) {
                const updateResponse = await fetch(`/api/axes-entity/entities/${entityToAssign.id}?company_name=${selectedCompany}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    ...entityToAssign,
                    node_id: existingNode.id,
                    custom_fields: customFields
                  })
                })
                
                if (updateResponse.ok) {
                  updatedCount++
                }
              } else {
                skippedCount++
              }
            } else {
              // Create new entity if it doesn't exist
              console.log(`Creating new entity with code "${elementCode}"`)
              
              // Extract custom field values from the current row
              const customFields = {}
              customFieldColumns.forEach(fieldName => {
                const fieldIndex = header.indexOf(fieldName)
                if (fieldIndex !== -1 && values[fieldIndex]) {
                  customFields[fieldName] = values[fieldIndex]
                }
              })
              
              const createEntityResponse = await fetch(`/api/axes-entity/entities?company_name=${selectedCompany}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  name: elementCode, // Use code as name initially
                  code: elementCode,
                  entity_type: 'Standard',
                  hierarchy_id: selectedHierarchy.id,
                  node_id: existingNode.id,
                  geography: '',
                  currency: 'USD',
                  custom_fields: customFields
                })
              })
              
              if (createEntityResponse.ok) {
                updatedCount++
                console.log(`Created new entity: ${elementCode}`)
              } else {
                console.error(`Failed to create entity: ${elementCode}`)
                skippedCount++
              }
            }
          }
        } else if (elementCodes.length === 0) {
          // No elements to assign, just count as processed
          skippedCount++
        }
        
        processedCount++
      }
      
      // Refresh data
      await refreshAllData()
      
      // Show summary
      const messages = []
      if (updatedCount > 0) messages.push(`${updatedCount} assignments updated`)
      if (skippedCount > 0) messages.push(`${skippedCount} unchanged`)
      
      showToast(`✅ Import complete: ${messages.join(', ')} (${processedCount} rows processed)`, 'success')
      
    } catch (error) {
      console.error('❌ Error importing hierarchy:', error)
      showToast('❌ Failed to import CSV. Check file format and data.', 'error')
    }
    
    // Reset file input
    event.target.value = ''
  }

  // Export entities data as CSV
  const handleExportEntities = async (e) => {
    try {
      console.log('🔄 Export button clicked - Event:', e)
      console.log('🔄 Export button clicked - Entities length:', entities.length)
      
      // Prevent event bubbling
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      
      if (entities.length === 0) {
        showToast('❌ No entities to export', 'error')
        return
      }

      console.log('🔄 Exporting entities data as CSV...')
      
      // Create CSV data with entity information including custom fields
      const csvData = []
      
      // Get custom field names from settings
      const customFieldNames = Object.keys(axesSettings.custom_fields || {})
      console.log('📋 Custom fields for export:', customFieldNames)
      
      // Add header row with custom fields
      const headers = ['id', 'name', 'code', 'entity_type', 'geography', 'currency', ...customFieldNames]
      csvData.push(headers)
      
      // Add entity data with custom field values
      entities.forEach(entity => {
        // Base entity data
        const rowData = [
          entity.id || '',
          entity.name || '',
          entity.code || '',
          entity.entity_type || '',
          entity.geography || '',
          entity.currency || ''
        ]
        
        // Add custom field values
        customFieldNames.forEach(fieldName => {
          const value = entity.custom_fields?.[fieldName] || ''
          rowData.push(value)
        })
        
        csvData.push(rowData)
      })
      
      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n')
      
      // Create and download CSV file
      const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `entities_export_${selectedCompany}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showToast(`✅ Exported ${entities.length} entities as CSV successfully!`, 'success')
      
    } catch (error) {
      console.error('❌ Error exporting entities:', error)
      showToast('❌ Failed to export entities', 'error')
    }
  }

  // Import entities data from CSV with smart updates
  const handleImportEntities = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      console.log('🔄 Importing entities data from CSV...')
      
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        showToast('❌ Invalid CSV file. Must have header and data rows.', 'error')
        return
      }
      
      // Parse header
      const header = lines[0].split(',').map(col => col.replace(/"/g, '').trim())
      const requiredColumns = ['name', 'code']
      
      if (!requiredColumns.every(col => header.includes(col))) {
        showToast('❌ Invalid CSV format. Must include: name, code columns', 'error')
        return
      }
      
      // Identify custom field columns
      const baseColumns = ['id', 'name', 'code', 'entity_type', 'geography', 'currency', 'node_id']
      const customFieldColumns = header.filter(col => !baseColumns.includes(col))
      console.log('📋 Custom field columns found in CSV:', customFieldColumns)
      
      let importedCount = 0
      let updatedCount = 0
      let skippedCount = 0
      
      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(val => val.replace(/"/g, '').trim())
        const rowData = {}
        
        header.forEach((col, index) => {
          rowData[col] = values[index] || ''
        })
        
        // Skip empty rows
        if (!rowData.name && !rowData.code) {
          skippedCount++
          continue
        }
        
        // Check if entity already exists (by code)
        const existingEntity = entities.find(e => e.code === rowData.code)
        
        if (existingEntity) {
          // Extract custom field values from CSV
          const customFields = { ...existingEntity.custom_fields }
          customFieldColumns.forEach(fieldName => {
            if (rowData[fieldName] !== undefined) {
              customFields[fieldName] = rowData[fieldName]
            }
          })
          
          // Update existing entity only if there are changes
          const hasChanges = 
            existingEntity.name !== rowData.name ||
            existingEntity.entity_type !== rowData.entity_type ||
            existingEntity.geography !== rowData.geography ||
            existingEntity.currency !== rowData.currency ||
            existingEntity.node_id != (rowData.node_id || null) ||
            JSON.stringify(existingEntity.custom_fields) !== JSON.stringify(customFields)
          
          if (hasChanges) {
            const updateResponse = await fetch(`/api/axes-entity/entities/${existingEntity.id}?company_name=${selectedCompany}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                name: rowData.name,
                code: rowData.code,
                entity_type: rowData.entity_type || existingEntity.entity_type,
                geography: rowData.geography || existingEntity.geography,
                currency: rowData.currency || existingEntity.currency,
                custom_fields: customFields,
                node_id: rowData.node_id || null
              })
            })
            
            if (updateResponse.ok) {
              updatedCount++
            }
          } else {
            skippedCount++
          }
        } else {
          // Extract custom field values from CSV for new entity
          const customFields = {}
          customFieldColumns.forEach(fieldName => {
            if (rowData[fieldName] !== undefined) {
              customFields[fieldName] = rowData[fieldName]
            }
          })
          
          // Create new entity
          const createResponse = await fetch(`/api/axes-entity/entities?company_name=${selectedCompany}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              name: rowData.name,
              code: rowData.code,
              entity_type: rowData.entity_type || 'Entity',
              geography: rowData.geography || '',
              currency: rowData.currency || 'USD',
              custom_fields: customFields,
              node_id: rowData.node_id || null
            })
          })
          
          if (createResponse.ok) {
            importedCount++
          }
        }
      }
      
      // Refresh data
      await refreshAllData()
      
      // Show summary
      const messages = []
      if (importedCount > 0) messages.push(`${importedCount} new`)
      if (updatedCount > 0) messages.push(`${updatedCount} updated`)
      if (skippedCount > 0) messages.push(`${skippedCount} unchanged`)
      
      showToast(`✅ Import complete: ${messages.join(', ')} entities`, 'success')
      
    } catch (error) {
      console.error('❌ Error importing entities:', error)
      showToast('❌ Failed to import CSV. Check file format and data.', 'error')
    }
    
    // Reset file input
    event.target.value = ''
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      await initializeAxesEntity()
    } finally {
      setLoading(false)
    }
  }

  // Don't render if no company is selected
  if (!selectedCompany || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Loading Axes Entity System...
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {!isAuthenticated
              ? 'Please log in to access the system.'
              : `Please select a company. Current: ${selectedCompany || 'None'}`
            }
          </p>
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <div>Debug: Auth={isAuthenticated ? 'Yes' : 'No'}, Company={selectedCompany || 'None'}</div>
            <div>Auth Company: {authSelectedCompany || 'None'}</div>
            <div>Context Company: {companyContextCompany || 'None'}</div>
            <div>User: {user?.username || 'None'} @ {user?.company || 'None'}</div>
          </div>
        </div>
      </div>
    )
  }

  const handleSaveHierarchy = async (hierarchyData) => {
    try {
      const isEditing = selectedHierarchy !== null
      console.log(isEditing ? '🔄 Updating hierarchy:' : '🔄 Creating hierarchy:', hierarchyData)
      
      // Validate required fields
      if (!hierarchyData.hierarchy_name?.trim()) {
        showToast('❌ Hierarchy name is required', 'error')
        return false
      }

      if (!isEditing) {
        // Initialize tables first for new hierarchies
        await fetch(`/api/axes-entity/init?company_name=${selectedCompany}`, {
          method: 'POST',
          credentials: 'include'
        })
      }
      
      // Create or update the hierarchy
      const url = isEditing 
        ? `/api/axes-entity/hierarchies/${selectedHierarchy.id}?company_name=${selectedCompany}`
        : `/api/axes-entity/hierarchies?company_name=${selectedCompany}`
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(hierarchyData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Hierarchy ${isEditing ? 'updated' : 'created'} successfully:`, result)
        showToast(`✅ Hierarchy "${hierarchyData.hierarchy_name}" ${isEditing ? 'updated' : 'created'} successfully!`, 'success')
        
        // Refresh data to show the new hierarchy
        await Promise.all([loadHierarchies(), loadEntities(), loadHierarchyTree()])
        return true
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to create hierarchy:', response.status, errorText)
        showToast(`❌ Failed to create hierarchy: ${errorText}`, 'error')
        return false
      }
    } catch (error) {
      console.error('❌ Error creating hierarchy:', error)
      showToast(`❌ Error creating hierarchy: ${error.message}`, 'error')
      return false
    }
  }

  const deleteEntity = async (entityId) => {
    try {
      const response = await fetch(`/api/axes-entity/entities/${entityId}?company_name=${selectedCompany}&cascade=true`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await refreshAllData()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting entity:', error)
      return false
    }
  }

  // ===== TREE FUNCTIONS =====
  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderTreeNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const indent = level * 24

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg ${
            selectedEntity?.id === node.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : ''
          }`}
          style={{ marginLeft: `${indent}px` }}
          onClick={() => setSelectedEntity(node)}
        >
          <div className="flex items-center flex-1">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleNode(node.id)
                }}
                className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6 mr-2" />
            )}
            
            <div className={`p-2 rounded-lg mr-3 ${
              node.is_leaf 
                ? 'bg-green-100 dark:bg-green-900/20' 
                : 'bg-blue-100 dark:bg-blue-900/20'
            }`}>
              {node.is_leaf ? (
                <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">
                {node.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {node.code} • Level {node.level}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedEntity(node)
                  setShowEntityForm(true)
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <Edit3 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Delete entity "${node.name}"?`)) {
                    deleteEntity(node.id)
                  }
                }}
                className="p-1 hover:bg-red-200 dark:hover:bg-red-900/20 rounded"
              >
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // ===== RENDER FUNCTIONS =====
  const renderOverviewTab = () => (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Hierarchies Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <Layers className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Hierarchies
              </h3>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {hierarchies.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Folders/Containers</p>
            </div>
          </div>
        </div>

        {/* Entities Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Total Entities
              </h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {entities.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Items in hierarchies</p>
            </div>
          </div>
        </div>

        {/* Hierarchy Levels */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TreePine className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Max Levels
              </h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Math.max(...entities.map(e => e.level), 0) + 1}
              </p>
            </div>
          </div>
        </div>

        {/* Custom Fields */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Database className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Custom Fields
              </h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {Object.keys(axesSettings.custom_fields || {}).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setSelectedEntity(null)
              setShowEntityForm(true)
            }}
            className="flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Entity</span>
          </button>
          
          <button
            onClick={() => {
              setSettingsType('elements')
              setShowSettingsModal(true)
            }}
            className="flex items-center justify-center space-x-2 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>Configure Fields</span>
          </button>
          
          <button
            onClick={handleAddHierarchy}
            className="flex items-center justify-center space-x-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Layers className="h-5 w-5" />
            <span>Create Hierarchy</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderElementsTab = () => (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <button
              onClick={() => {
                setSelectedEntity(null)
                setShowEntityForm(true)
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Entity</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Export/Import buttons for entities */}
            <button
              onClick={(e) => {
                console.log('🔄 Export button clicked in embedded view')
                handleExportEntities(e)
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg relative z-10"
              style={{ pointerEvents: 'auto' }}
              title="Export entities to CSV"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
            
            <label className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>Import</span>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleImportEntities}
                className="hidden"
              />
            </label>
            
            <button
              onClick={loadHierarchyTree}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Entities List */}
      <div className="flex-1 overflow-auto p-4">
        {entities.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Geography</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Currency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hierarchy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {entities
                    .filter(entity => 
                      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      entity.code.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((entity) => (
                    <tr 
                      key={entity.id} 
                      data-entity-id={entity.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 ${
                        snapAnimations.has(entity.id) ? 'pointer-events-none' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {entity.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entity.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entity.entity_type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entity.geography || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entity.currency || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {hierarchies.find(h => h.id === entity.hierarchy_id)?.hierarchy_name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEntity(entity)
                              setShowEntityForm(true)
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete entity "${entity.name}"?`)) {
                                // Start the Thanos snap effect
                                createSnapEffect(entity.id)
                                
                                // Delete after animation starts
                                setTimeout(() => {
                                  deleteEntity(entity.id)
                                    .then(() => showToast('✅ Entity deleted successfully!', 'success'))
                                    .catch(() => showToast('❌ Failed to delete entity', 'error'))
                                }, 500) // Start deletion after 0.5s
                              }
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Delete"
                            disabled={snapAnimations.has(entity.id)}
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
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No entities found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first entity to get started
            </p>
            <button
              onClick={() => {
                setSelectedEntity(null)
                setShowEntityForm(true)
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Entity</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderHierarchiesTab = () => {
    // If canvas is open, show the split-panel view
    if (showCanvas && selectedHierarchy) {
      return (
        <div className="h-full flex bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
          {/* Fullscreen Card Container */}
          <div className="w-full h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 dark:border-gray-700/20 overflow-hidden m-2">
            <div className="h-full flex">
              {/* Left Panel - Hierarchy Tree */}
              <div className="w-2/5 h-full flex flex-col border-r border-gray-200/50 dark:border-gray-600/30">
                <div className="flex-shrink-0 p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-gray-800/80 dark:to-gray-700/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          {selectedHierarchy?.hierarchy_name}
                        </h2>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => hierarchyNodesPanelRef.current?.addRootNode()}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add Root</span>
                      </button>
                      <button
                        onClick={handleCanvasClose}
                        className="p-2 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-200 group"
                        title="Close hierarchy view"
                      >
                        <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <HierarchyNodesPanelModern
                    ref={hierarchyNodesPanelRef}
                    hierarchy={selectedHierarchy}
                    hierarchyStructure={hierarchyStructure}
                    onNodeSelect={setCanvasItem}
                    selectedNode={canvasItem}
                    onBack={handleCanvasClose}
                    onAddNode={refreshHierarchyStructure}
                    selectedCompany={selectedCompany}
                    axisType="entity"
                  />
                </div>
              </div>
              
              {/* Right Panel - Node Details & Elements */}
              <div className="w-3/5 h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <HierarchyEditorPanelModern
                    selectedNode={canvasItem}
                    hierarchy={selectedHierarchy}
                    hierarchyStructure={hierarchyStructure}
                    onClose={handleCanvasClose}
                    onRefresh={refreshAllData}
                    selectedCompany={selectedCompany}
                    axisType="entity"
                    showExportImport={true}
                    onExport={handleExportHierarchy}
                    onImport={handleImportHierarchy}
                    onAssignElements={() => setShowAssignModal(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Default hierarchy list view
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
        {/* Modern Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Hierarchies Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Create and manage organizational structures for your entities
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                {hierarchies.length} {hierarchies.length === 1 ? 'Hierarchy' : 'Hierarchies'}
              </div>
              
              
              <button
                onClick={handleAddHierarchy}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Create Hierarchy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hierarchies Grid */}
        <div className="flex-1 p-8 overflow-y-auto">
          {hierarchies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {hierarchies.map((hierarchy, index) => (
                <div
                  key={hierarchy.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1 overflow-hidden"
                  onDoubleClick={() => handleHierarchySelect(hierarchy)}
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animation: 'fadeInUp 0.8s ease-out forwards'
                  }}
                >
                  <div className="relative">
                    {/* Header with icon and title */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                          <Layers className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 leading-tight">
                            {hierarchy.hierarchy_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {hierarchy.description || 'Organizational structure for managing entities'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleHierarchySelect(hierarchy)
                          }}
                          className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors duration-200"
                          title="Open hierarchy"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditHierarchy(hierarchy)
                          }}
                          className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors duration-200"
                          title="Edit hierarchy"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteHierarchy(hierarchy)
                          }}
                          className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors duration-200"
                          title="Delete hierarchy"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Stats section */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {hierarchy.entity_count || 0}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Entities
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {hierarchy.node_count || 0}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Nodes
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                        {hierarchy.hierarchy_type || 'Standard'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full opacity-20"></div>
                </div>
                <div className="relative">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mx-auto w-fit mb-6">
                    <Layers className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                No Hierarchies Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                Create your first hierarchy to organize entities into structured folders like Geography, Legal Structure, Business Units, and more.
              </p>
              <button
                onClick={handleAddHierarchy}
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Hierarchy</span>
              </button>
              <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                💡 Tip: Start with a simple structure like "Geography" or "Legal Entities"
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex flex-col">
      {/* Modern Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="w-full px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
                  Axes Entity Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {selectedCompany ? `${selectedCompany} - Hierarchical entity structure` : 'Hierarchical entity structure with custom attributes'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setSettingsType('elements')
                  setShowSettingsModal(true)
                }}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Settings className="h-4 w-4" />
                <span className="font-medium">Settings</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Modern Navigation Tabs */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <nav className="flex space-x-1">
            {[
              { id: 'overview', name: 'Overview', icon: Eye },
              { id: 'elements', name: 'Elements', icon: Building2 },
              { id: 'hierarchies', name: 'Hierarchies', icon: Layers }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-6 rounded-t-xl font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform -translate-y-0.5'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'elements' && renderElementsTab()}
        {activeTab === 'hierarchies' && renderHierarchiesTab()}
      </div>

      {/* Modals */}
      {showEntityForm && (
        <AxesEntityForm
          entity={selectedEntity}
          onSave={handleEntitySave}
          onCancel={() => {
            setShowEntityForm(false)
            setSelectedEntity(null)
          }}
          axesSettings={axesSettings}
          entities={entities}
          hierarchies={hierarchies}
          companyName={selectedCompany}
        />
      )}

      {showSettingsModal && (
        <CustomFieldsManager
          type={settingsType}
          isVisible={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onSave={(fields) => handleCustomFieldChange(settingsType, fields)}
          companyName={selectedCompany}
        />
      )}

      {showHierarchyModal && (
        <HierarchyCreateModal
          isOpen={showHierarchyModal}
          onClose={() => {
            setShowHierarchyModal(false)
            setSelectedHierarchy(null) // Clear selected hierarchy when closing
          }}
          onSave={handleSaveHierarchy}
          hierarchy={selectedHierarchy} // Pass the selected hierarchy for editing
          hierarchyType="entity" // Specify entity hierarchy type
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          toast.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto p-1 hover:bg-black hover:bg-opacity-20 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AxesEntityEnhanced
