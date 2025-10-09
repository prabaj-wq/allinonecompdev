import React, { useState, useEffect, useCallback } from 'react'
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  Globe, 
  Users, 
  X,
  Save,
  Upload,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { useCompany } from '../contexts/CompanyContext'

const EntityPage = () => {
  const { selectedCompany } = useCompany()
  const [entities, setEntities] = useState([])
  const [hierarchies, setHierarchies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showHierarchyModal, setShowHierarchyModal] = useState(false)
  const [showEditHierarchyModal, setShowEditHierarchyModal] = useState(false)
  const [editingEntity, setEditingEntity] = useState(null)
  const [editingHierarchy, setEditingHierarchy] = useState(null)
  const [draggedEntity, setDraggedEntity] = useState(null)
  const [expandedHierarchies, setExpandedHierarchies] = useState(new Set())

  // Form states
  const [entityForm, setEntityForm] = useState({
    entity_code: '',
    entity_name: '',
    entity_type: '',
    country: '',
    currency: '',
    hierarchy_id: ''
  })

  const [hierarchyForm, setHierarchyForm] = useState({
    hierarchy_type: 'Entity', // Default to Entity type for Entity Management page
    hierarchy_name: '',
    description: 'Entity organization structure' // Provide a default description
  })

  // Entity types
  const entityTypes = [
    'Parent',
    'Subsidiary', 
    'Joint Venture',
    'Associate',
    'Branch',
    'Division',
    'Department'
  ]

  // Common currencies
  const currencies = [
    'USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'CHF', 'JPY', 'CNY', 'SGD'
  ]

  // Bulk edit state
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [selectedEntities, setSelectedEntities] = useState(new Set())
  const [bulkHierarchyId, setBulkHierarchyId] = useState('')

  // Load hierarchies first, then entities (since entities depend on hierarchies for filtering)
  useEffect(() => {
    if (selectedCompany) {
      console.log('🏢 EntityPage: Company selected, loading data for:', selectedCompany)
      loadHierarchies()
    } else {
      console.log('🏢 EntityPage: No company selected')
      setEntities([])
      setHierarchies([])
    }
  }, [selectedCompany])

  // Load entities after hierarchies are loaded
  useEffect(() => {
    if (selectedCompany && hierarchies.length > 0) {
      console.log('🏢 EntityPage: Hierarchies loaded, now loading entities')
      loadEntities()
    }
  }, [selectedCompany, hierarchies])
  
  // Monitor entities state changes for debugging
  useEffect(() => {
    console.log('🔄 Entities state changed:', entities.length, 'entities')
    if (entities.length > 0) {
      console.log('🔍 First few entities:', entities.slice(0, 3).map(e => ({
        id: e.id,
        name: e.entity_name,
        hierarchy_id: e.hierarchy_id
      })))
    }
  }, [entities])

  // Add error boundary for data loading failures
  const [dataLoadError, setDataLoadError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  const retryDataLoad = useCallback(async () => {
    setDataLoadError(null)
    setRetryCount(prev => prev + 1)
    try {
      await Promise.all([
        loadHierarchies(),
        loadEntities()
      ])
    } catch (error) {
      console.error('❌ Retry failed:', error)
      setDataLoadError(error.message)
    }
  }, [])

  const loadEntities = async () => {
    try {
      if (!selectedCompany) {
        console.error('No company selected')
        setEntities([])
        return
      }

      const response = await fetch('/api/entities', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Loaded entities for company:', selectedCompany, 'Count:', data.entities?.length || 0)
        console.log('📊 Entity details:', data.entities?.map(e => ({
          id: e.id,
          name: e.entity_name,
          code: e.entity_code,
          hierarchy_id: e.hierarchy_id
        })) || [])
        
        // Validate entity data structure
        const validEntities = data.entities || []
        console.log('🔍 Raw entities data from backend:', data)
        console.log('🔍 Valid entities count:', validEntities.length)
        
        const invalidEntities = validEntities.filter(e => !e.id || !e.entity_name)
        if (invalidEntities.length > 0) {
          console.warn('⚠️ Found invalid entities:', invalidEntities)
        }
        
        // Check for entities with missing hierarchy_id
        const entitiesWithoutHierarchy = validEntities.filter(e => !e.hierarchy_id || e.hierarchy_id === '')
        console.log('🔍 Entities without hierarchy:', entitiesWithoutHierarchy.length, entitiesWithoutHierarchy.map(e => e.entity_name))
        
        // Debug: Log all entities with their hierarchy_id
        console.log('🔍 All entities with hierarchy_id:', validEntities.map(e => ({
          id: e.id,
          name: e.entity_name,
          hierarchy_id: e.hierarchy_id,
          hierarchy_id_type: typeof e.hierarchy_id
        })))
        
        // Filter entities to only show those belonging to Entity-type hierarchies
        // This ensures we don't show entities that belong to Account-type hierarchies
        const entityTypeHierarchyIds = hierarchies.filter(h => h.hierarchy_type === 'Entity').map(h => h.id)
        const filteredEntities = validEntities.filter(e => {
          if (!e.hierarchy_id) return true // Show unassigned entities
          return entityTypeHierarchyIds.includes(e.hierarchy_id)
        })
        
        console.log('🔍 Entity-type hierarchy IDs:', entityTypeHierarchyIds)
        console.log('🔍 Filtered entities for Entity management:', filteredEntities.length, filteredEntities.map(e => ({
          id: e.id,
          name: e.entity_name,
          hierarchy_id: e.hierarchy_id
        })))
        
        console.log('🔍 Setting entities state with filtered entities:', filteredEntities)
        setEntities(filteredEntities)
      } else {
        console.error('Failed to load entities:', response.status)
        setEntities([])
      }
    } catch (error) {
      console.error('Error loading entities:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHierarchies = async () => {
    try {
      if (!selectedCompany) {
        console.error('No company selected')
        setHierarchies([])
        return
      }

      const response = await fetch('/api/hierarchies', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded all hierarchies for company:', selectedCompany, 'Count:', data.hierarchies?.length || 0)
        
        // Filter to only show Entity-type hierarchies on the Entity Management page
        const allHierarchies = data.hierarchies || []
        const entityHierarchies = allHierarchies.filter(h => h.hierarchy_type === 'Entity')
        
        console.log('🔍 Filtered Entity hierarchies:', entityHierarchies.length, entityHierarchies.map(h => ({
          id: h.id,
          type: h.hierarchy_type,
          name: h.hierarchy_name
        })))
        
        // Store current hierarchies before updating state
        const currentHierarchies = hierarchies
        
        setHierarchies(entityHierarchies)
        
        // Preserve expanded state and auto-expand newly created hierarchies
        const currentExpanded = new Set(expandedHierarchies)
        const newHierarchyIds = new Set(entityHierarchies.map(h => h.id))
        
        // Auto-expand newly created hierarchies that weren't in the previous list
        const previousHierarchyIds = new Set(currentHierarchies.map(h => h.id))
        const newlyCreated = new Set([...newHierarchyIds].filter(id => !previousHierarchyIds.has(id)))
        
        if (newlyCreated.size > 0) {
          console.log('🆕 Auto-expanding newly created Entity hierarchies:', Array.from(newlyCreated))
          newlyCreated.forEach(id => currentExpanded.add(id))
        }
        
        setExpandedHierarchies(currentExpanded)
      } else {
        console.error('Failed to load hierarchies:', response.status)
        setHierarchies([])
      }
    } catch (error) {
      console.error('Error loading hierarchies:', error)
      setHierarchies([])
    }
  }

  const handleCreateEntity = async (e) => {
    e.preventDefault()
    
    if (!selectedCompany) {
      showNotification('No company selected', 'error')
      return
    }
    
    const requestBody = {
      entity_name: entityForm.entity_name,
      entity_type: entityForm.entity_type,
      country: entityForm.country,
      currency: entityForm.currency,
      hierarchy_id: entityForm.hierarchy_id
    }

    try {
      const response = await fetch('/api/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        
        // Add the new entity to the state immediately
        if (result.entity) {
          const newEntity = {
            ...result.entity,
            // Ensure the entity has the right structure for the UI
            entity_code: result.entity.entity_code,
            entity_name: result.entity.entity_name,
            entity_type: result.entity.entity_type,
            country: result.entity.country,
            currency: result.entity.currency,
            hierarchy_id: result.entity.hierarchy_id
          }
          
          setEntities(prevEntities => [...prevEntities, newEntity])
          
          // Also update the hierarchy counts if needed
          if (newEntity.hierarchy_id) {
            setHierarchies(prevHierarchies => 
              prevHierarchies.map(h => 
                h.id === newEntity.hierarchy_id 
                  ? { ...h, entity_count: (h.entity_count || 0) + 1 }
                  : h
              )
            )
          }
        }
        
        setShowCreateModal(false)
        setEntityForm({
          entity_code: '',
          entity_name: '',
          entity_type: '',
          country: '',
          currency: '',
          hierarchy_id: ''
        })
        
        // Ensure the hierarchy is expanded if an entity was assigned to one
        if (entityForm.hierarchy_id) {
          setExpandedHierarchies(prev => new Set([...prev, entityForm.hierarchy_id]))
        }
        
        showNotification('Entity created successfully!', 'success')
      } else {
        const error = await response.json()
        showNotification(error.detail || 'Failed to create entity', 'error')
      }
    } catch (error) {
      console.error('Error creating entity:', error)
      showNotification('Error creating entity', 'error')
    }
  }

  const handleEditEntity = async (e) => {
    e.preventDefault()
    
    if (!selectedCompany) {
      showNotification('No company selected', 'error')
      return
    }
    
    try {
      const response = await fetch(`/api/entities/${editingEntity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entityForm),
        credentials: 'include'
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingEntity(null)
        setEntityForm({
          entity_code: '',
          entity_name: '',
          entity_type: '',
          country: '',
          currency: '',
          hierarchy_id: ''
        })
        
        // Ensure the hierarchy is expanded if an entity was assigned to one
        if (entityForm.hierarchy_id) {
          setExpandedHierarchies(prev => new Set([...prev, entityForm.hierarchy_id]))
        }
        
        // Reload both entities and hierarchies to ensure UI is in sync
        await Promise.all([loadHierarchies(), loadEntities()])
        showNotification('Entity updated successfully!', 'success')
      } else {
        const error = await response.json()
        showNotification(error.detail || 'Failed to update entity', 'error')
      }
    } catch (error) {
      console.error('Error updating entity:', error)
      showNotification('Error updating entity', 'error')
    }
  }

  const handleDeleteEntity = async (entityId) => {
    if (!window.confirm('Are you sure you want to delete this entity?')) return

    if (!selectedCompany) {
      showNotification('No company selected', 'error')
      return
    }

    try {
      const response = await fetch(`/api/entities/${entityId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // Reload both entities and hierarchies to ensure UI is in sync
        await Promise.all([loadHierarchies(), loadEntities()])
        showNotification('Entity deleted successfully!', 'success')
      } else {
        const error = await response.json()
        showNotification(error.detail || 'Failed to delete entity', 'error')
      }
    } catch (error) {
      console.error('Error deleting entity:', error)
      showNotification('Error deleting entity', 'error')
    }
  }

  const handleCreateHierarchy = async (e) => {
    e.preventDefault()
    
    if (!selectedCompany) {
      showNotification('No company selected', 'error')
      return
    }
    
    try {
      const response = await fetch('/api/hierarchies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hierarchy_type: 'Entity', // Force Entity type for Entity Management page
          hierarchy_name: hierarchyForm.hierarchy_name,
          description: hierarchyForm.description
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const responseData = await response.json()
        
        // Add the new hierarchy to the state immediately
        if (responseData.hierarchy_id) {
          const newHierarchy = {
            id: responseData.hierarchy_id,
            hierarchy_type: 'Entity',
            hierarchy_name: hierarchyForm.hierarchy_name,
            description: hierarchyForm.description || 'Entity organization structure',
            entity_count: 0
          }
          
          setHierarchies(prevHierarchies => [...prevHierarchies, newHierarchy])
          
          // Auto-expand the newly created hierarchy
          setExpandedHierarchies(prev => new Set([...prev, responseData.hierarchy_id]))
        }
        
        setShowHierarchyModal(false)
        setHierarchyForm({
          hierarchy_type: 'Entity',
          hierarchy_name: '',
          description: 'Entity organization structure'
        })
        
        showNotification('Entity hierarchy created successfully!', 'success')
      } else {
        const error = await response.json()
        showNotification(error.detail || 'Failed to create hierarchy', 'error')
      }
    } catch (error) {
      console.error('Error creating hierarchy:', error)
      showNotification('Error creating hierarchy', 'error')
    }
  }

  const handleMoveEntity = async (entityCode, newHierarchyId) => {
    if (!selectedCompany) {
      showNotification('No company selected', 'error')
      return
    }
    
    try {
      console.log('🔄 handleMoveEntity called with:', { entityCode, newHierarchyId })
      console.log('🔄 Request body:', JSON.stringify({
        entity_code: entityCode,
        new_hierarchy_id: newHierarchyId
      }))
      
      showNotification('Moving entity...', 'info')
      
      // Ensure proper data types and validate
      if (!entityCode) {
        console.error('❌ entityCode is missing or undefined')
        showNotification('Invalid entity data for move operation', 'error')
        return
      }
      
      if (!newHierarchyId) {
        console.error('❌ newHierarchyId is missing or undefined')
        showNotification('Invalid hierarchy data for move operation', 'error')
        return
      }
      
      const requestBody = {
        entity_code: String(entityCode),
        new_hierarchy_id: String(newHierarchyId)
      }
      
      console.log('🔄 Request body with proper types:', requestBody)
      console.log('🔄 Data types:', {
        entityCode: typeof entityCode,
        newHierarchyId: typeof newHierarchyId,
        entityCodeString: typeof requestBody.entity_code,
        newHierarchyIdString: typeof requestBody.new_hierarchy_id
      })
      
      const response = await fetch('/api/entities/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      })

      if (response.ok) {
        const responseData = await response.json()
        console.log('✅ Move response:', responseData)
        
        // Small delay to ensure backend has processed the move
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Ensure the target hierarchy is expanded
        setExpandedHierarchies(prev => new Set([...prev, newHierarchyId]))
        
        // Reload both entities and hierarchies to ensure UI is in sync
        // Use try-catch for each to prevent one failure from breaking the other
        try {
          await loadHierarchies()
        } catch (hierarchyError) {
          console.error('Error reloading hierarchies after move:', hierarchyError)
        }
        
        try {
          await loadEntities()
        } catch (entityError) {
          console.error('Error reloading entities after move:', entityError)
        }
        
        showNotification('Entity moved successfully!', 'success')
      } else {
        try {
          const error = await response.json()
          console.error('❌ Move entity error response:', error)
          
          // Handle different error response formats
          let errorMessage = 'Failed to move entity'
          if (error.detail) {
            if (typeof error.detail === 'string') {
              errorMessage = error.detail
            } else if (Array.isArray(error.detail)) {
              // Handle Pydantic validation errors
              errorMessage = error.detail.map(e => {
                if (e.msg) return e.msg
                if (e.type === 'missing') return `${e.loc && e.loc.length > 1 ? e.loc[1] : 'Field'} is required`
                if (e.type === 'type_error') return `${e.loc && e.loc.length > 1 ? e.loc[1] : 'Field'} has invalid type`
                return 'Validation error'
              }).join(', ')
            } else if (typeof error.detail === 'object') {
              errorMessage = error.detail.msg || 'Validation error'
            }
          }
          
          showNotification(errorMessage, 'error')
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError)
          showNotification('Failed to move entity', 'error')
        }
      }
    } catch (error) {
      console.error('❌ Error moving entity:', error)
      
      // Handle different error types
      let errorMessage = 'Error moving entity'
      if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      showNotification(errorMessage, 'error')
      
      // Try to reload data even if move failed to prevent blank page
      try {
        await Promise.all([loadHierarchies(), loadEntities()])
      } catch (reloadError) {
        console.error('Error reloading data after move failure:', reloadError)
      }
    }
  }

  const openEditHierarchyModal = (hierarchy) => {
    setEditingHierarchy(hierarchy)
    setHierarchyForm({
      hierarchy_type: hierarchy.hierarchy_type,
      hierarchy_name: hierarchy.hierarchy_name,
      description: hierarchy.description
    })
    setShowEditHierarchyModal(true)
  }

  const handleEditHierarchy = async (e) => {
    e.preventDefault()
    
    if (!selectedCompany || !editingHierarchy) {
      showNotification('No company selected or hierarchy not selected', 'error')
      return
    }
    
    const requestBody = {
      hierarchy_type: 'Entity', // Force Entity type for Entity Management page
      hierarchy_name: hierarchyForm.hierarchy_name,
      description: hierarchyForm.description
    }

    try {
      const response = await fetch(`/api/hierarchies/${editingHierarchy.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      })

      if (response.ok) {
        setShowEditHierarchyModal(false)
        setEditingHierarchy(null)
        setHierarchyForm({
          hierarchy_type: 'Entity',
          hierarchy_name: '',
          description: 'Entity organization structure'
        })
        
        // Ensure the edited hierarchy remains expanded
        if (editingHierarchy && editingHierarchy.id) {
          setExpandedHierarchies(prev => new Set([...prev, editingHierarchy.id]))
        }
        
        // Reload both entities and hierarchies to ensure UI is in sync
        await Promise.all([loadHierarchies(), loadEntities()])
        showNotification('Entity hierarchy updated successfully!', 'success')
      } else {
        const error = await response.json()
        showNotification(error.detail || 'Failed to update hierarchy', 'error')
      }
    } catch (error) {
      console.error('Error updating hierarchy:', error)
      showNotification('Error updating hierarchy', 'error')
    }
  }

  const handleDeleteHierarchy = async (hierarchyId) => {
    if (!confirm('Are you sure you want to delete this hierarchy? All entities in this hierarchy will become unassigned.')) {
      return
    }
    
    if (!selectedCompany) {
      showNotification('No company selected', 'error')
      return
    }
    
    try {
      showNotification('Deleting hierarchy...', 'info')
      
      const response = await fetch(`/api/hierarchies/${hierarchyId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // Remove the deleted hierarchy from expanded state
        setExpandedHierarchies(prev => {
          const newExpanded = new Set(prev)
          newExpanded.delete(hierarchyId)
          return newExpanded
        })
        
        // Reload both entities and hierarchies to ensure UI is in sync
        await Promise.all([loadHierarchies(), loadEntities()])
        showNotification('Entity hierarchy deleted successfully!', 'success')
      } else {
        const error = await response.json()
        showNotification(error.detail || 'Failed to delete hierarchy', 'error')
      }
    } catch (error) {
      console.error('Error deleting hierarchy:', error)
      showNotification('Error deleting hierarchy', 'error')
    }
  }

  const openEditModal = (entity) => {
    setEditingEntity(entity)
    setEntityForm({
      entity_code: entity.entity_code || '',
      entity_name: entity.entity_name,
      entity_type: entity.entity_type,
      country: entity.country,
      currency: entity.currency,
      hierarchy_id: entity.hierarchy_id || ''
    })
    setShowEditModal(true)
  }

  const resetForms = () => {
    setEntityForm({
      entity_code: '',
      entity_name: '',
      entity_type: '',
      country: '',
      currency: '',
      hierarchy_id: ''
    })
    setHierarchyForm({
      hierarchy_type: 'Entity',
      hierarchy_name: '',
      description: 'Entity organization structure'
    })
  }

  const showNotification = (message, type = 'info') => {
    console.log(`🔔 EntityPage: Attempting to show notification: ${message} (${type})`)
    if (window.showToast) {
      console.log('🍞 Toast system available, showing notification')
      window.showToast(message, type)
    } else {
      // Fallback to console if toast system not ready
      console.log(`⚠️ Toast system not ready, logging to console: ${type.toUpperCase()}: ${message}`)
      // Try to set up a retry mechanism
      setTimeout(() => {
        if (window.showToast) {
          console.log('🍞 Toast system now available on retry, showing notification')
          window.showToast(message, type)
        } else {
          console.log('❌ Toast system still not available after retry')
        }
      }, 200)
    }
  }

  // Export entities to Excel
  const exportEntities = () => {
    if (entities.length === 0) {
      showNotification('No entities to export', 'warning')
      return
    }

    const exportData = entities.map(entity => ({
      'Entity Code': entity.entity_code || '',
      'Entity Name': entity.entity_name,
      'Entity Type': entity.entity_type,
      'Country': entity.country,
      'Currency': entity.currency,
      'Hierarchy ID': entity.hierarchy_id || '',
      'Hierarchy Name': getHierarchyName(entity.hierarchy_id),
      'Hierarchy Type': getHierarchyType(entity.hierarchy_id)
    }))

    // Create CSV content
    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `entities_${selectedCompany}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    showNotification(`Exported ${entities.length} entities successfully!`, 'success')
  }

  // Import entities from Excel/CSV
  const importEntities = async (file) => {
    try {
      if (!selectedCompany) {
        showNotification('No company selected', 'error')
        return
      }

      showNotification('Processing import file...', 'info')
      
      // Read the CSV file
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      
      // Parse CSV data
      const importData = []
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          const row = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          importData.push(row)
        }
      }

      if (importData.length === 0) {
        showNotification('No data found in the file', 'warning')
        return
      }

      showNotification(`Found ${importData.length} entities to process`, 'info')

      // Check for duplicates and prepare import data
      const existingEntityCodes = new Set(entities.map(e => e.entity_code))
      const existingEntityNames = new Set(entities.map(e => e.entity_name))
      
      console.log(`🔍 Existing entity codes:`, Array.from(existingEntityCodes))
      console.log(`🔍 Existing entity names:`, Array.from(existingEntityNames))
      console.log(`🔍 Total existing entities:`, entities.length)
      
      const newEntities = []
      const duplicates = []
      const skipped = []
      const updates = []

      // Smart import logic: Handle export+new entities scenario
      const totalExistingEntities = entities.length
      console.log(`🔍 Import analysis: File has ${importData.length} entities, existing DB has: ${totalExistingEntities}`)
      
      // If file has more rows than existing entities, check if first N rows match existing entities
      const looksLikeExportPlusNew = importData.length > totalExistingEntities
      
      if (looksLikeExportPlusNew) {
        console.log(`📊 Detected potential export+new entities scenario (${importData.length} > ${totalExistingEntities})`)
        
        // Strategy: Process rows beyond the existing entity count as new entities
        // This assumes the user exported existing entities and added new ones at the end
        for (let i = 0; i < importData.length; i++) {
          const row = importData[i]
          const entityCode = row['Entity Code'] || row['entity_code'] || ''
          const entityName = row['Entity Name'] || row['entity_name'] || ''
          
          if (!entityCode && !entityName) {
            skipped.push({ ...row, reason: 'Missing entity code and name', rowIndex: i + 1 })
            continue
          }
          
          // Check if this is a duplicate - be more specific about what constitutes a duplicate
          const isDuplicateByCode = entityCode && existingEntityCodes.has(entityCode)
          const isDuplicateByName = entityName && existingEntityNames.has(entityName)
          
          console.log(`🔍 Checking row ${i + 1}: ${entityName} (${entityCode})`)
          console.log(`🔍 Is duplicate by code: ${isDuplicateByCode}, by name: ${isDuplicateByName}`)
          
          if (isDuplicateByCode || isDuplicateByName) {
            const reason = isDuplicateByCode ? `Duplicate entity code: ${entityCode}` : `Duplicate entity name: ${entityName}`
            duplicates.push({ ...row, reason: `${reason} (row ${i + 1})`, rowIndex: i + 1 })
            console.log(`⚠️ Skipping duplicate: ${reason}`)
            continue
          }
          
          // This is a new entity
          console.log(`➕ New entity detected at row ${i + 1}: ${entityName} (${entityCode})`)
          
          // Debug: Show all available columns and values
          console.log(`🔍 Row ${i + 1} data:`, row)
          console.log(`🔍 Available columns:`, Object.keys(row))
          
          // Ensure hierarchy_id is properly set
          let hierarchyId = row['Hierarchy ID'] || row['hierarchy_id'] || ''
          if (!hierarchyId) {
            console.log(`⚠️ No hierarchy_id found for ${entityName}, will be unassigned`)
          } else {
            console.log(`✅ Hierarchy ID set to: "${hierarchyId}" for ${entityName}`)
          }
          
          // Validate required fields
          const entityType = row['Entity Type'] || row['entity_type'] || 'Subsidiary'
          const country = row['Country'] || row['country'] || ''
          
          console.log(`🔍 Parsed values:`, {
            entity_code: entityCode,
            entity_name: entityName,
            entity_type: entityType,
            country: country,
            currency: row['Currency'] || row['currency'] || '',
            hierarchy_id: hierarchyId
          })
          
          const newEntity = {
            entity_code: entityCode,
            entity_name: entityName,
            entity_type: entityType,
            country: country,
            currency: row['Currency'] || row['currency'] || '',
            hierarchy_id: hierarchyId
          }
          console.log(`➕ New entity object:`, newEntity)
          newEntities.push(newEntity)
        }
      } else {
        // Standard import logic for new-only files
        console.log(`📊 Standard import mode (${importData.length} <= ${totalExistingEntities})`)
        
        for (const row of importData) {
          const entityCode = row['Entity Code'] || row['entity_code'] || ''
          const entityName = row['Entity Name'] || row['entity_name'] || ''
          
          if (!entityCode && !entityName) {
            skipped.push({ ...row, reason: 'Missing entity code and name' })
            continue
          }

          console.log(`🔍 Checking standard import: ${entityName} (${entityCode})`)
          const isDuplicateByCode = entityCode && existingEntityCodes.has(entityCode)
          const isDuplicateByName = entityName && existingEntityNames.has(entityName)
          console.log(`🔍 Is duplicate by code: ${isDuplicateByCode}, by name: ${isDuplicateByName}`)
          
          if (isDuplicateByCode || isDuplicateByName) {
            const reason = isDuplicateByCode ? `Duplicate entity code: ${entityCode}` : `Duplicate entity name: ${entityName}`
            duplicates.push({ ...row, reason: reason })
            console.log(`⚠️ Skipping duplicate: ${reason}`)
            continue
          }

          console.log(`➕ New entity in standard mode: ${entityName} (${entityCode})`)
          const newEntity = {
            entity_code: entityCode,
            entity_name: entityName,
            entity_type: row['Entity Type'] || row['entity_type'] || 'Subsidiary',
            country: row['Country'] || row['country'] || '',
            currency: row['Currency'] || row['currency'] || '',
            hierarchy_id: row['Hierarchy ID'] || row['hierarchy_id'] || ''
          }
          console.log(`➕ New entity object:`, newEntity)
          newEntities.push(newEntity)
        }
      }

      // Show summary
      let summaryMessage = `Import Summary: ${newEntities.length} new, ${duplicates.length} duplicates, ${skipped.length} skipped`
      
      if (looksLikeExportPlusNew && newEntities.length > 0) {
        summaryMessage += `\n📊 Detected export+new scenario: Processing ${newEntities.length} new entities from expanded file.`
      } else if (looksLikeExportPlusNew && newEntities.length === 0) {
        summaryMessage += `\n⚠️ File appears to contain exported entities but no new ones detected.`
      }
      
      if (duplicates.length > 0) {
        summaryMessage += `\n🔄 ${duplicates.length} existing entities will be skipped.`
      }
      
      console.log(`📈 Import summary: ${summaryMessage}`)
      console.log(`📈 New entities to import:`, newEntities.map(e => `${e.entity_name} (${e.entity_code})`))
      
      showNotification(summaryMessage, newEntities.length > 0 ? 'info' : 'warning')

      // Import new entities
      if (newEntities.length > 0) {
        console.log(`🚀 Starting import of ${newEntities.length} entities:`, newEntities)
        
        const importPromises = newEntities.map((entity, index) => {
          console.log(`🚀 Importing entity ${index + 1}:`, entity)
          
          // Validate required fields before sending
          if (!entity.entity_code || !entity.entity_name || !entity.entity_type || !entity.country) {
            console.error(`❌ Entity ${index + 1} missing required fields:`, {
              entity_code: entity.entity_code || 'MISSING',
              entity_name: entity.entity_name || 'MISSING',
              entity_type: entity.entity_type || 'MISSING',
              country: entity.country || 'MISSING'
            })
            return Promise.reject(new Error(`Entity ${index + 1} missing required fields`))
          }
          
          // Ensure all fields have valid values
          const formData = new FormData()
          formData.append('entity_code', entity.entity_code.trim())
          formData.append('entity_name', entity.entity_name.trim())
          formData.append('entity_type', entity.entity_type.trim())
          formData.append('country', entity.country.trim())
          formData.append('currency', entity.currency || '')
          formData.append('hierarchy_id', entity.hierarchy_id || '')
          
          console.log(`🚀 FormData for entity ${index + 1}:`, {
            entity_code: entity.entity_code,
            entity_name: entity.entity_name,
            entity_type: entity.entity_type,
            country: entity.country,
            currency: entity.currency,
            hierarchy_id: entity.hierarchy_id
          })
          
          return fetch('/api/entities', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Company-Name': company
            },
            body: formData,
            credentials: 'include'
          }).then(async (response) => {
            console.log(`🚀 Import response for entity ${index + 1}:`, response.status, response.statusText)
            if (response.ok) {
              const result = await response.json()
              console.log(`🚀 Import result for entity ${index + 1}:`, result)
            } else {
              console.error(`🚀 Import failed for entity ${index + 1}:`, response.status, response.statusText)
            }
            return response
          })
        })

        // Wait for all imports to complete
        const importResults = await Promise.all(importPromises)
        console.log('🚀 All import results:', importResults)
        
        // Check if all imports were successful
        const successfulImports = importResults.filter(response => response.ok)
        const failedImports = importResults.filter(response => !response.ok)
        
        console.log(`🚀 Successful imports: ${successfulImports.length}/${importResults.length}`)
        console.log(`🚀 Failed imports: ${failedImports.length}/${importResults.length}`)
        
        if (successfulImports.length === 0) {
          // Show more specific error message
          if (failedImports.length > 0) {
            const firstFailure = failedImports[0]
            console.error('❌ First import failure:', firstFailure)
            showNotification(`Import failed: ${firstFailure.status} ${firstFailure.statusText}`, 'error')
          } else {
            showNotification('All entity imports failed!', 'error')
          }
          return
        }
        
        // Ensure hierarchies are expanded for imported entities
        const hierarchyIds = newEntities
          .map(entity => entity.hierarchy_id)
          .filter(id => id && id !== '')
        
        if (hierarchyIds.length > 0) {
          setExpandedHierarchies(prev => new Set([...prev, ...hierarchyIds]))
        }
        
        // SIMPLE AND DIRECT APPROACH: Add imported entities directly to state
        console.log('🔄 Adding imported entities directly to state...')
        
        // Create new entity objects with proper structure
        const importedEntities = newEntities.map((entity, index) => ({
          id: `imported_${Date.now()}_${index}`, // Temporary ID
          entity_code: entity.entity_code,
          entity_name: entity.entity_name,
          entity_type: entity.entity_type,
          country: entity.country,
          currency: entity.currency,
          hierarchy_id: entity.hierarchy_id,
          created_date: new Date().toISOString()
        }))
        
        console.log('🔄 Imported entities to add:', importedEntities)
        
        // Add to existing entities state
        setEntities(prev => {
          const updatedEntities = [...prev, ...importedEntities]
          console.log('🔄 Updated entities state:', updatedEntities)
          return updatedEntities
        })
        
        showNotification(`Successfully imported ${importedEntities.length} entities!`, 'success')
        
        // Reload data in background to get proper IDs from backend
        setTimeout(async () => {
          console.log('🔄 Reloading data in background to sync with backend...')
          await loadEntities()
          await loadHierarchies()
        }, 1000)
      } else {
        showNotification('No new entities to import', 'warning')
      }

      // Log details for debugging
      if (duplicates.length > 0) {
        console.log('Duplicate entities:', duplicates)
      }
      if (skipped.length > 0) {
        console.log('Skipped entities:', skipped)
      }

    } catch (error) {
      console.error('Error importing entities:', error)
      showNotification('Error importing entities: ' + error.message, 'error')
    }
  }

  // Bulk update hierarchy
  const handleBulkHierarchyUpdate = async () => {
    if (selectedEntities.size === 0) {
      showNotification('Please select entities to update', 'error')
      return
    }

    const token = localStorage.getItem('authToken')
    const company = localStorage.getItem('selectedCompany')
    
    if (!token || !company) {
      showNotification('Authentication required', 'error')
      return
    }

    try {
      showNotification(`Updating ${selectedEntities.size} entities...`, 'info')
      
      // Store the target hierarchy ID before clearing
      const targetHierarchyId = bulkHierarchyId
      
      // Verify the target hierarchy exists
      if (targetHierarchyId && !hierarchies.find(h => h.id === targetHierarchyId)) {
        console.error('❌ Target hierarchy not found:', targetHierarchyId)
        showNotification('Target hierarchy not found. Please refresh and try again.', 'error')
        return
      }
      
      console.log('🔍 Target hierarchy verified:', targetHierarchyId)
      
      const updatePromises = Array.from(selectedEntities).map((entityId, index) => {
        const entity = entities.find(e => e.id === entityId)
        if (entity && entity.hierarchy_id !== targetHierarchyId) {
          console.log(`Moving entity ${index + 1}/${selectedEntities.size}: ${entity.entity_name} (${entity.entity_code || 'no code'}) to hierarchy: ${targetHierarchyId}`)
          console.log(`📤 Sending move request:`, {
            entity_code: entity.entity_code || entity.entity_name,
            new_hierarchy_id: targetHierarchyId
          })
          return fetch('/api/entities/move', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-Company-Name': company
            },
            body: JSON.stringify({
              entity_code: entity.entity_code || entity.entity_name, // Use entity_code if available, fallback to entity_name
              new_hierarchy_id: targetHierarchyId
            }),
            credentials: 'include'
          }).then(async response => {
            if (!response.ok) {
              console.error(`Failed to move entity ${entity.entity_name}:`, response.status)
              const errorText = await response.text()
              console.error(`Error response:`, errorText)
              throw new Error(`Failed to move entity ${entity.entity_name}: ${response.status}`)
            }
            const responseData = await response.json()
            console.log(`✅ Entity ${entity.entity_name} moved successfully:`, responseData)
            return response
          })
        }
        return Promise.resolve()
      })

      // Wait for all moves to complete
      const results = await Promise.all(updatePromises)
      console.log('📊 All move operations completed:', results.length, 'successful moves')
      
      showNotification('All entities updated successfully! Reloading data...', 'success')
      
      // Ensure the target hierarchy is expanded BEFORE clearing state
      if (targetHierarchyId) {
        setExpandedHierarchies(prev => new Set([...prev, targetHierarchyId]))
        console.log('🔍 Expanded hierarchy:', targetHierarchyId)
      }
      
      // Longer delay to ensure backend has processed all moves
      console.log('⏳ Waiting for backend to process moves...')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Reload entities and hierarchies to ensure UI is in sync
      console.log('🔄 Reloading data...')
      await Promise.all([loadEntities(), loadHierarchies()])
      
      // Clear selections and UI state AFTER data is reloaded
      setSelectedEntities(new Set())
      setBulkHierarchyId('')
      setBulkEditMode(false)
      
      showNotification('Bulk hierarchy update completed!', 'success')
    } catch (error) {
      console.error('Error in bulk update:', error)
      showNotification(`Error updating entities: ${error.message}`, 'error')
    }
  }

  // Toggle entity selection
  const toggleEntitySelection = (entityId) => {
    const newSelected = new Set(selectedEntities)
    if (newSelected.has(entityId)) {
      newSelected.delete(entityId)
    } else {
      newSelected.add(entityId)
    }
    setSelectedEntities(newSelected)
  }

  // Select all entities
  const selectAllEntities = () => {
    if (selectedEntities.size === entities.length) {
      setSelectedEntities(new Set())
    } else {
      setSelectedEntities(new Set(entities.map(e => e.id)))
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

  const getHierarchyName = (hierarchyId) => {
    const hierarchy = hierarchies.find(h => h.id === hierarchyId)
    return hierarchy ? hierarchy.hierarchy_name : 'No Hierarchy'
  }

  const getHierarchyType = (hierarchyId) => {
    const hierarchy = hierarchies.find(h => h.id === hierarchyId)
    return hierarchy ? hierarchy.hierarchy_type : 'Unknown'
  }

  const getEntitiesByHierarchy = (hierarchyId) => {
    if (!hierarchyId) {
      const unassigned = entities.filter(e => !e.hierarchy_id || e.hierarchy_id === '' || e.hierarchy_id === null)
      console.log('🔍 Unassigned entities:', unassigned.length, unassigned.map(e => e.entity_name))
      return unassigned
    }
    
    // Convert both to strings for comparison to handle type mismatches
    const hierarchyIdStr = String(hierarchyId)
    const assigned = entities.filter(e => String(e.hierarchy_id) === hierarchyIdStr)
    
    console.log(`🔍 Entities in hierarchy ${hierarchyId} (${hierarchyIdStr}):`, assigned.length, assigned.map(e => ({ 
      name: e.entity_name, 
      id: e.id, 
      hierarchy_id: e.hierarchy_id, 
      hierarchy_id_type: typeof e.hierarchy_id 
    })))
    
    // Debug: Check if there are any entities that might be mismatched
    if (assigned.length === 0 && entities.length > 0) {
      console.log(`⚠️ No entities found in hierarchy ${hierarchyId}, checking all entities:`)
      entities.forEach(e => {
        console.log(`  - Entity: ${e.entity_name}, hierarchy_id: "${e.hierarchy_id}" (type: ${typeof e.hierarchy_id})`)
      })
    }
    
    return assigned
  }

  const handleDragStart = (e, entity) => {
    setDraggedEntity(entity)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetHierarchyId) => {
    e.preventDefault()
    try {
      if (draggedEntity && draggedEntity.hierarchy_id !== targetHierarchyId) {
        console.log('🔄 Moving entity:', draggedEntity)
        console.log('🔄 Entity details:', {
          id: draggedEntity.id,
          entity_code: draggedEntity.entity_code,
          entity_name: draggedEntity.entity_name,
          hierarchy_id: draggedEntity.hierarchy_id,
          target_hierarchy: targetHierarchyId
        })
        
        // Use entity_code if available, otherwise use entity_name, or fallback to id
        const entityIdentifier = draggedEntity.entity_code || draggedEntity.entity_name || draggedEntity.id
        console.log('🔄 Using entity identifier:', entityIdentifier)
        
        if (!entityIdentifier) {
          console.error('❌ No valid entity identifier found:', draggedEntity)
          showNotification('Invalid entity data for move operation', 'error')
          return
        }
        
        handleMoveEntity(entityIdentifier, targetHierarchyId)
      }
    } catch (error) {
      console.error('❌ Error in handleDrop:', error)
      showNotification('Error during drag and drop operation', 'error')
    } finally {
      setDraggedEntity(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading entities...</p>
        </div>
      </div>
    )
  }

  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Company Selected</h2>
          <p className="text-gray-600 dark:text-gray-300">Please select a company to manage entities</p>
        </div>
      </div>
    )
  }

  // Safety check to prevent blank page
  if (!hierarchies || !entities) {
    console.warn('Missing data, attempting to reload...')
    // Trigger reload without blocking UI
    setTimeout(() => {
      if (!hierarchies) loadHierarchies()
      if (!entities) loadEntities()
    }, 100)
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading data...</p>
          <button
            onClick={retryDataLoad}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar - Centered for professional look */}
        <div className="flex justify-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={exportEntities}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center"
              title="Export as Excel"
            >
              <Save className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">Export</span>
            </button>
            <button
              onClick={async () => {
                console.log('🔄 Manual refresh triggered...')
                setLoading(true)
                await Promise.all([loadEntities(), loadHierarchies()])
                setLoading(false)
                console.log('🔄 Manual refresh completed')
              }}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </button>
            <label className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center cursor-pointer"
              title="Import Data">
              <Upload className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">Import</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files[0] && importEntities(e.target.files[0])}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setBulkEditMode(!bulkEditMode)}
              className={`px-3 py-2 ${bulkEditMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-lg font-medium transition-colors flex items-center`}
              title={bulkEditMode ? "Cancel Bulk Edit" : "Bulk Edit Hierarchy"}
            >
              <Layers className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">
                {bulkEditMode ? "Cancel" : "Bulk Edit"}
              </span>
            </button>
            <button
              onClick={() => setShowHierarchyModal(true)}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center"
              title="Add Hierarchy"
            >
              <Layers className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">Add Hierarchy</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
              title="Add Entity"
            >
              <Plus className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">Add Entity</span>
            </button>
          </div>
        </div>

        {/* Bulk Edit Controls - Show when bulk edit mode is active */}
        {bulkEditMode && entities.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select All:
                </label>
                <input
                  type="checkbox"
                  checked={selectedEntities.size === entities.length}
                  onChange={selectAllEntities}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedEntities.size} of {entities.length} entities selected
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Move to Hierarchy:
                </label>
                <select
                  value={bulkHierarchyId}
                  onChange={(e) => setBulkHierarchyId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">No Hierarchy</option>
                  {hierarchies.map(hierarchy => (
                    <option key={hierarchy.id} value={hierarchy.id}>
                      {hierarchy.hierarchy_name} ({hierarchy.hierarchy_type})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkHierarchyUpdate}
                  disabled={selectedEntities.size === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  Update Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{entities.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hierarchies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{hierarchies.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Countries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(entities.map(e => e.country)).size}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Parent Entities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {entities.filter(e => e.entity_type === 'Parent').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hierarchies and Entities */}
        <div className="space-y-6">
          {/* Hierarchies */}
          {hierarchies.map((hierarchy) => (
            <div key={hierarchy.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div 
                className="p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => toggleHierarchyExpansion(hierarchy.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {hierarchy.hierarchy_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {hierarchy.hierarchy_type} • {getEntitiesByHierarchy(hierarchy.id).length} entities
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {hierarchy.hierarchy_type}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditHierarchyModal(hierarchy)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edit hierarchy"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteHierarchy(hierarchy.id)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete hierarchy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {expandedHierarchies.has(hierarchy.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              
              {expandedHierarchies.has(hierarchy.id) && (
                <div 
                  className="p-6"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, hierarchy.id)}
                >
                  {getEntitiesByHierarchy(hierarchy.id).length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400 mb-2">Drop entities here</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">No entities in this hierarchy</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getEntitiesByHierarchy(hierarchy.id).map((entity) => (
                        <EntityCard
                          key={entity.id}
                          entity={entity}
                          onEdit={openEditModal}
                          onDelete={handleDeleteEntity}
                          onDragStart={handleDragStart}
                          hierarchyName={hierarchy.hierarchy_name}
                          hierarchyType={hierarchy.hierarchy_type}
                          isSelected={selectedEntities.has(entity.id)}
                          onToggleSelection={toggleEntitySelection}
                          showCheckbox={bulkEditMode}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* No Hierarchy Section - Moved to the end */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                No Hierarchy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Entities not assigned to any hierarchy
              </p>
            </div>
            <div className="p-6">
              {getEntitiesByHierarchy('').length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No unassigned entities
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getEntitiesByHierarchy('').map((entity) => (
                    <EntityCard
                      key={entity.id}
                      entity={entity}
                      onEdit={openEditModal}
                      onDelete={handleDeleteEntity}
                      onDragStart={handleDragStart}
                      hierarchyName="No Hierarchy"
                      hierarchyType="Unassigned"
                      isSelected={selectedEntities.has(entity.id)}
                      onToggleSelection={toggleEntitySelection}
                      showCheckbox={bulkEditMode}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Entity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Entity</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForms()
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEntity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entity Code
                </label>
                <input
                  type="text"
                  required
                  value={entityForm.entity_code}
                  onChange={(e) => setEntityForm({...entityForm, entity_code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter entity code"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entity Name
                </label>
                <input
                  type="text"
                  required
                  value={entityForm.entity_name}
                  onChange={(e) => setEntityForm({...entityForm, entity_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter entity name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entity Type
                </label>
                <select
                  required
                  value={entityForm.entity_type}
                  onChange={(e) => setEntityForm({...entityForm, entity_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Type</option>
                  {entityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  required
                  value={entityForm.country}
                  onChange={(e) => setEntityForm({...entityForm, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter country"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <input
                  type="text"
                  value={entityForm.currency}
                  onChange={(e) => setEntityForm({...entityForm, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., USD, EUR, GBP"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hierarchy
                </label>
                <select
                  value={entityForm.hierarchy_id}
                  onChange={(e) => setEntityForm({...entityForm, hierarchy_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">No Hierarchy</option>
                  {hierarchies.map(hierarchy => (
                    <option key={hierarchy.id} value={hierarchy.id}>
                      {hierarchy.hierarchy_name} ({hierarchy.hierarchy_type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForms()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Add Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entity Modal */}
      {showEditModal && editingEntity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Entity</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingEntity(null)
                  resetForms()
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditEntity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entity Code
                </label>
                <input
                  type="text"
                  required
                  value={entityForm.entity_code}
                  onChange={(e) => setEntityForm({...entityForm, entity_code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entity Name
                </label>
                <input
                  type="text"
                  required
                  value={entityForm.entity_name}
                  onChange={(e) => setEntityForm({...entityForm, entity_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entity Type
                </label>
                <select
                  required
                  value={entityForm.entity_type}
                  onChange={(e) => setEntityForm({...entityForm, entity_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {entityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  required
                  value={entityForm.country}
                  onChange={(e) => setEntityForm({...entityForm, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currency
                </label>
                <input
                  type="text"
                  value={entityForm.currency}
                  onChange={(e) => setEntityForm({...entityForm, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., USD, EUR, GBP"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hierarchy
                </label>
                <select
                  value={entityForm.hierarchy_id}
                  onChange={(e) => setEntityForm({...entityForm, hierarchy_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">No Hierarchy</option>
                  {hierarchies.map(hierarchy => (
                    <option key={hierarchy.id} value={hierarchy.id}>
                      {hierarchy.hierarchy_name} ({hierarchy.hierarchy_type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingEntity(null)
                    resetForms()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Update Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Hierarchy Modal */}
      {showHierarchyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Hierarchy</h3>
              <button
                onClick={() => {
                  setShowHierarchyModal(false)
                  resetForms()
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateHierarchy} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hierarchy Type
                </label>
                <input
                  type="text"
                  required
                  value={hierarchyForm.hierarchy_type}
                  onChange={(e) => setHierarchyForm({...hierarchyForm, hierarchy_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Geography, Business Unit, Legal"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hierarchy Name
                </label>
                <input
                  type="text"
                  required
                  value={hierarchyForm.hierarchy_name}
                  onChange={(e) => setHierarchyForm({...hierarchyForm, hierarchy_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Geographic Regions, Business Divisions"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={hierarchyForm.description}
                  onChange={(e) => setHierarchyForm({...hierarchyForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Optional description"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowHierarchyModal(false)
                    resetForms()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Add Hierarchy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hierarchy Modal */}
      {showEditHierarchyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Hierarchy</h3>
              <button
                onClick={() => {
                  setShowEditHierarchyModal(false)
                  setEditingHierarchy(null)
                  resetForms()
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditHierarchy} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hierarchy Type
                </label>
                <input
                  type="text"
                  required
                  value={hierarchyForm.hierarchy_type}
                  onChange={(e) => setHierarchyForm({...hierarchyForm, hierarchy_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Geography, Business Unit, Legal"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hierarchy Name
                </label>
                <input
                  type="text"
                  required
                  value={hierarchyForm.hierarchy_name}
                  onChange={(e) => setHierarchyForm({...hierarchyForm, hierarchy_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Geographic Regions, Business Divisions"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={hierarchyForm.description}
                  onChange={(e) => setHierarchyForm({...hierarchyForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Optional description"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditHierarchyModal(false)
                    setEditingHierarchy(null)
                    resetForms()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Update Hierarchy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Entity Card Component
const EntityCard = ({ entity, onEdit, onDelete, onDragStart, hierarchyName, hierarchyType, isSelected, onToggleSelection, showCheckbox }) => {
  const getEntityTypeColor = (type) => {
    switch (type) {
      case 'Parent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Subsidiary': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Joint Venture': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'Associate': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <div
      className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow cursor-move"
      draggable
      onDragStart={(e) => onDragStart(e, entity)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation()
                onToggleSelection(entity.id)
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          )}
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <span className="font-medium text-gray-900 dark:text-white">{entity.entity_name}</span>
            {entity.entity_code && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Code: {entity.entity_code}
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(entity)
            }}
            className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(entity.id)
            }}
            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEntityTypeColor(entity.entity_type)}`}>
            {entity.entity_type}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Country:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{entity.country}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Currency:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{entity.currency}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Hierarchy:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{hierarchyName}</span>
        </div>
      </div>
    </div>
  )
}

export default EntityPage
