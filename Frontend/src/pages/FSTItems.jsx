import React, { useState, useEffect } from 'react'
import { 
  Layers,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Calendar,
  DollarSign,
  Calculator,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Database,
  Settings,
  Target,
  Shield,
  Zap,
  Star,
  Award,
  MapPin,
  Tag,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  BookOpen,
  Globe,
  Users,
  Building2,
  FolderOpen,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Info,
  ArrowLeft,
  BarChart
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'
import { fstAPI, fstHierarchiesAPI, ifrsAccountsAPI } from '../services/api'

const FSTItems = () => {
  const { user } = useAuth()
  const { currentCompany } = useCompany()
  
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [fstItems, setFstItems] = useState([])
  
  // State for FST management
  const [activeTab, setActiveTab] = useState('templates') // Only 'templates' tab now
  const [hierarchies, setHierarchies] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  
  // FST Hierarchy modals
  const [showAddHierarchyModal, setShowAddHierarchyModal] = useState(false)
  const [showEditHierarchyModal, setShowEditHierarchyModal] = useState(false)
  const [showDeleteHierarchyModal, setShowDeleteHierarchyModal] = useState(false)
  const [selectedHierarchy, setSelectedHierarchy] = useState(null)
  const [editingHierarchy, setEditingHierarchy] = useState({
    hierarchy_name: '',
    hierarchy_type: '',
    description: ''
  })
  const [expandedHierarchies, setExpandedHierarchies] = useState(new Set())
  
  // FST Template modals
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false)
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false)
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState({
    template_name: '',
    template_type: '',
    description: '',
    version: '1.0'
  })

  // Template Elements management
  const [showElementsModal, setShowElementsModal] = useState(false)
  const [selectedTemplateForElements, setSelectedTemplateForElements] = useState(null)
  const [templateElementsMap, setTemplateElementsMap] = useState({}) // template_id -> elements
  const [currentTemplateId, setCurrentTemplateId] = useState(null)
  const [showAddElementModal, setShowAddElementModal] = useState(false)
  const [showEditElementModal, setShowEditElementModal] = useState(false)
  const [notification, setNotification] = useState(null) // { message, type: 'success' | 'error' }
  const [editingElement, setEditingElement] = useState({
    element_name: '',
    element_type: 'Line Item',
    account_code: '',
    description: '',
    formula: '',
    position: 0,
    color: '#3B82F6',
    format: 'standard'
  })

  // Element types - now separate options instead of dropdown
  const elementTypeOptions = [
    { 
      type: 'Line Item', 
      label: 'Line Item (Link to IFRS Account)',
      description: 'Direct link to account from Account Management',
      color: '#3B82F6'
    },
    { 
      type: 'Formula', 
      label: 'Formula',
      description: 'Mathematical calculation using other elements',
      color: '#10B981'
    },
    { 
      type: 'Header', 
      label: 'Header',
      description: 'Section header with title',
      color: '#8B5CF6'
    }
  ]
  
  // Template types for filtering
  const templateTypes = [
    'Balance Sheet',
    'Income Statement', 
    'Cash Flow',
    'Statement of Changes in Equity',
    'Notes to Financial Statements'
  ]
  
  // IFRS Accounts state
  const [ifrsAccounts, setIfrsAccounts] = useState([])
  
  // Template Detail Modal state
  const [showTemplateDetailModal, setShowTemplateDetailModal] = useState(false)
  const [selectedTemplateForDetail, setSelectedTemplateForDetail] = useState(null)
  const [quickActionType, setQuickActionType] = useState(null) // Track quick action type
  const [showTestViewModal, setShowTestViewModal] = useState(false)

  // Mock data - in real app this would come from API
  const mockFstItems = [
    {
      id: 1,
      itemCode: 'FST001',
      itemName: 'Revenue Recognition',
      category: 'Income Statement',
      description: 'Template for revenue recognition under various accounting standards',
      status: 'Active',
      lastModified: '2025-01-15 10:30',
      modifiedBy: 'John Doe',
      version: '1.2',
      elementsCount: 15,
      usageCount: 45
    },
    {
      id: 2,
      itemCode: 'FST002',
      itemName: 'Lease Accounting',
      category: 'Balance Sheet',
      description: 'Template for lease accounting under IFRS 16 and ASC 842',
      status: 'Active',
      lastModified: '2025-01-15 11:15',
      modifiedBy: 'Jane Smith',
      version: '2.1',
      elementsCount: 22,
      usageCount: 32
    },
    {
      id: 3,
      itemCode: 'FST003',
      itemName: 'Financial Instruments',
      category: 'Balance Sheet',
      description: 'Template for financial instruments classification and measurement',
      status: 'Active',
      lastModified: '2025-01-15 12:00',
      modifiedBy: 'Mike Johnson',
      version: '1.8',
      elementsCount: 28,
      usageCount: 38
    }
  ]



  // Mock data for FST hierarchies
  const mockHierarchies = [
    {
      id: 1,
      hierarchy_name: 'Balance Sheet Template',
      hierarchy_type: 'Balance Sheet',
      description: 'Standard balance sheet template with asset and liability classifications',
      created_at: '2025-01-10',
      elements_count: 5,
      status: 'Active'
    },
    {
      id: 2,
      hierarchy_name: 'Income Statement Template',
      hierarchy_type: 'Income Statement',
      description: 'Comprehensive income statement template with revenue and expense categories',
      created_at: '2025-01-12',
      elements_count: 5,
      status: 'Active'
    }
  ]

  // Mock data for FST templates
  const mockTemplates = [
    {
      id: 1,
      template_name: 'Standard Balance Sheet',
      template_type: 'Balance Sheet',
      description: 'Comprehensive balance sheet template with asset and liability classifications',
      created_at: '2025-01-10',
      elements_count: 25,
      usage_count: 12,
      status: 'Active',
      version: '1.0'
    },
    {
      id: 2,
      template_name: 'Income Statement Pro',
      template_type: 'Income Statement',
      description: 'Professional income statement template with revenue and expense categories',
      created_at: '2025-01-12',
      elements_count: 18,
      usage_count: 8,
      status: 'Active',
      version: '1.2'
    },
    {
      id: 3,
      template_name: 'Cash Flow Statement',
      template_type: 'Cash Flow',
      description: 'Detailed cash flow statement template with operating, investing, and financing activities',
      created_at: '2025-01-15',
      elements_count: 22,
      usage_count: 5,
      status: 'Active',
      version: '1.1'
    }
  ]

  // Helper to show notifications
  const showNotification = (message, type) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000) // Hide after 3 seconds
  }

  useEffect(() => {
    console.log('Component mounted, loading FST data...')
    loadFSTData()
  }, [])

  // Load elements for all templates when component mounts
  useEffect(() => {
    if (templates.length > 0) {
      loadElementsForAllTemplates()
    }
  }, []) // Remove templates dependency to prevent infinite loop

  // Function to load elements for all templates
  const loadElementsForAllTemplates = async () => {
    try {
      console.log('Loading elements for all templates...')
      for (const template of templates) {
        await loadElementsForTemplate(template.id)
      }
    } catch (error) {
      console.error('Error loading elements for all templates:', error)
    }
  }

  // Debug effect to monitor templateElements state
  useEffect(() => {
    if (currentTemplateId && templateElementsMap[currentTemplateId]) {
      const elements = templateElementsMap[currentTemplateId]
      console.log('templateElements state changed for template', currentTemplateId, ':', elements.length, elements)
      
      // Save elements to localStorage as backup
      if (elements.length > 0 && selectedTemplateForDetail) {
        localStorage.setItem(`fst_elements_${currentTemplateId}`, JSON.stringify(elements))
        
        // Auto-save to database in real-time
        autoSaveToDatabase(selectedTemplateForDetail)
      }
    }
  }, [templateElementsMap, currentTemplateId, selectedTemplateForDetail])

  // Effect to load elements from localStorage when component mounts
  useEffect(() => {
    if (templates.length > 0) {
      loadElementsFromLocalStorage()
    }
  }, []) // Remove templates dependency to prevent infinite loop

  // Function to load elements from localStorage as fallback
  const loadElementsFromLocalStorage = () => {
    try {
      console.log('Loading elements from localStorage...')
      const newTemplateElementsMap = {}
      
      templates.forEach(template => {
        const storedElements = localStorage.getItem(`fst_elements_${template.id}`)
        if (storedElements) {
          try {
            const parsedElements = JSON.parse(storedElements)
            newTemplateElementsMap[template.id] = parsedElements
            console.log(`Loaded ${parsedElements.length} elements from localStorage for template ${template.id}`)
          } catch (parseError) {
            console.error(`Error parsing stored elements for template ${template.id}:`, parseError)
          }
        }
      })
      
      if (Object.keys(newTemplateElementsMap).length > 0) {
        setTemplateElementsMap(prev => ({
          ...prev,
          ...newTemplateElementsMap
        }))
        console.log('Elements loaded from localStorage successfully')
      }
    } catch (error) {
      console.error('Error loading elements from localStorage:', error)
    }
  }

  // Effect to save elements to backend when component unmounts or when user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save all elements to backend before page unload
      saveAllElementsToBackend()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Save elements when tab becomes hidden
        saveAllElementsToBackend()
      } else {
        // Refresh elements when tab becomes visible again
        if (currentTemplateId && currentTemplateId !== 'undefined') {
          loadElementsForTemplate(currentTemplateId)
        }
      }
    }

    const handleFocus = () => {
      // Refresh elements when window regains focus
      if (currentTemplateId && currentTemplateId !== 'undefined') {
        loadElementsForTemplate(currentTemplateId)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      // Save elements when component unmounts
      saveAllElementsToBackend()
    }
  }, []) // Remove dependencies to prevent infinite loop




  // Function to save all elements to backend
  const saveAllElementsToBackend = async () => {
    try {
      console.log('Saving all elements to backend...')
      for (const [templateId, elements] of Object.entries(templateElementsMap)) {
        if (elements && elements.length > 0) {
          for (const element of elements) {
            try {
              const backendElement = {
                template_id: parseInt(templateId),
                element_type: element.element_type === 'Formula' ? 'formula' : 
                             element.element_type === 'Header' ? 'header' : 'element',
                name: element.element_name,
                account_code: element.account_code || null,
                formula: element.formula || null,
                description: element.description || null,
                display_order: element.position || element.element_number
              }
              
              if (element.id && element.id.toString().startsWith('element_') && element.id !== 'undefined') {
                // This is a backend element, update it
                await fstAPI.updateElement(element.id, backendElement)
              } else {
                // This is a new element, add it
                await fstAPI.addElement(templateId, backendElement)
              }
            } catch (error) {
              console.error(`Error saving element ${element.element_name} to backend:`, error)
            }
          }
        }
      }
      console.log('All elements saved to backend successfully')
    } catch (error) {
      console.error('Error saving elements to backend:', error)
    }
  }

  // Auto-save function that saves to PostgreSQL database
  const autoSaveToDatabase = async (template) => {
    if (!template || !currentTemplateId || !templateElementsMap[currentTemplateId]) return
    
    const currentElements = templateElementsMap[currentTemplateId]
    if (currentElements.length === 0) return
    
    try {
      // Create CSV content
      const sortedElements = [...currentElements].sort((a, b) => 
        (a.position || a.element_number || 0) - (b.position || a.element_number || 0)
      )

      const headers = [
        'Position',
        'Element Number',
        'Element Name',
        'Element Type',
        'Account Code',
        'Description',
        'Formula',
        'Color',
        'Format'
      ].join(',')

      const rows = sortedElements.map(element => [
        element.position || element.element_number || '',
        element.element_number || '',
        `"${element.element_name || ''}"`,
        element.element_type || '',
        element.account_code || '',
        `"${element.description || ''}"`,
        `"${element.formula || ''}"`,
        element.color || '',
        element.format || ''
      ].join(','))

      const csvContent = [headers, ...rows].join('\n')
      
      // Save to localStorage as permanent CSV backup
      localStorage.setItem(`fst_csv_${template.id}`, csvContent)
      
      // Try to save to backend (but don't show errors to user)
      try {
        // Save elements to PostgreSQL database instead of CSV
        for (const element of currentElements) {
          try {
            const backendElement = {
              template_id: parseInt(template.id),
              element_type: element.element_type === 'Formula' ? 'formula' : 
                           element.element_type === 'Header' ? 'header' : 'element',
              name: element.element_name,
              account_code: element.account_code || null,
              formula: element.formula || null,
              description: element.description || null,
              display_order: element.position || element.element_number
            }
            
            if (element.id && element.id.toString().startsWith('element_') && element.id !== 'undefined') {
              await fstAPI.updateElement(element.id, backendElement)
            } else {
              await fstAPI.addElement(template.id, backendElement)
            }
          } catch (error) {
            console.error(`Error saving element ${element.element_name}:`, error)
          }
        }
        console.log('Auto-saved template elements to PostgreSQL database')
      } catch (error) {
        console.log('Auto-save to backend failed, but saved locally:', error)
      }
      
    } catch (error) {
      console.error('Error in auto-save to CSV:', error)
    }
  }

  const loadFSTData = async () => {
    setLoading(true)
    try {
      console.log('Loading FST data from PostgreSQL database...')
      
      // Load FST templates
      const templatesResponse = await fstAPI.getTemplates()
      console.log('Raw templates response:', templatesResponse)
      
      // Handle different response structures
      let templatesData = []
      if (templatesResponse.data && templatesResponse.data.templates) {
        templatesData = templatesResponse.data.templates
      } else if (templatesResponse.data && Array.isArray(templatesResponse.data)) {
        templatesData = templatesResponse.data
      } else if (Array.isArray(templatesResponse)) {
        templatesData = templatesResponse
      } else {
        console.warn('Unexpected templates response structure:', templatesResponse)
        templatesData = []
      }
      
      // Transform templates data to match UI expectations
      const transformedTemplates = templatesData.map(template => ({
        id: template.id,
        template_name: template.line_item || template.template_name, // Map from backend field
        template_type: template.statement_type || template.template_type, // Map from backend field
        description: template.category || template.description || '', // Map from backend field
        created_at: template.created_at || template.created_date || new Date().toISOString(),
        elements_count: template.elements_count || template.elementsCount || 0,
        usage_count: template.usage_count || template.usageCount || 0,
        status: template.status || 'Active',
        version: template.version || '1.0'
      }))
      
      // Ensure templates have elementsCount for dashboard calculations
      const templatesWithElements = transformedTemplates.map(template => ({
        ...template,
        elementsCount: template.elements_count || 0,
        usageCount: template.usage_count || 0
      }))
      
      console.log('Loaded templates:', templatesWithElements)
      console.log('Template count:', templatesWithElements.length)
      
      setTemplates(templatesWithElements)
      
      // Load FST hierarchies
      const hierarchiesResponse = await fstHierarchiesAPI.getAll()
      const hierarchiesData = hierarchiesResponse.data.hierarchies || []
      
      const transformedHierarchies = hierarchiesData.map(hierarchy => ({
        id: hierarchy.id,
        hierarchy_name: hierarchy.hierarchy_name,
        hierarchy_type: hierarchy.hierarchy_type,
        description: hierarchy.description || '',
        created_at: hierarchy.created_date || new Date().toISOString(),
        elements_count: 0,
        status: 'Active'
      }))
      
      setHierarchies(transformedHierarchies)
      
      // Create FST Items from templates (mapping templates to items)
      const fstItemsData = transformedTemplates.map(template => ({
        id: template.id,
        itemCode: template.id,
        itemName: template.template_name,
        category: template.template_type,
        description: template.description,
        status: template.status,
        lastModified: template.created_at,
        modifiedBy: user?.name || 'User',
        version: template.version,
        elementsCount: template.elements_count,
        usageCount: template.usage_count
      }))
      
      setFstItems(fstItemsData)
      
      // Load IFRS Accounts for dropdowns
      const ifrsResponse = await ifrsAccountsAPI.getAll()
      const ifrsData = ifrsResponse.data.accounts || []
      setIfrsAccounts(ifrsData)
      
      console.log('FST data loaded successfully:', { 
        templates: transformedTemplates.length, 
        hierarchies: transformedHierarchies.length,
        fstItems: fstItemsData.length,
        ifrsAccounts: ifrsData.length,
        templatesWithElements: templatesWithElements,
        totalElements: templatesWithElements.reduce((sum, template) => sum + (template.elementsCount || 0), 0)
      })
      
    } catch (error) {
      console.error('Error loading FST data:', error)
      
      // Fallback to mock data if API fails
      console.log('API failed, using mock data fallback...')
      
      const mockTemplatesWithElements = mockTemplates.map(template => ({
        ...template,
        elementsCount: template.elements_count || 0,
        usageCount: template.usage_count || 0
      }))
      
      // Debug: Log the mock templates to see their structure
      console.log('Mock templates with elements:', mockTemplatesWithElements)
      
      setTemplates(mockTemplatesWithElements)
      setFstItems(mockFstItems)
      setHierarchies(mockHierarchies)
      
      console.log('Using mock data fallback:', {
        mockTemplates: mockTemplates,
        mockTemplatesWithElements: mockTemplatesWithElements,
        totalElements: mockTemplatesWithElements.reduce((sum, template) => sum + (template.elementsCount || 0), 0)
      })
    } finally {
      setLoading(false)
    }
  }

  // FST Hierarchy functions
  const handleAddHierarchy = () => {
    setEditingHierarchy({
      hierarchy_name: '',
      hierarchy_type: '',
      description: ''
    })
    setShowAddHierarchyModal(true)
  }

  const handleEditHierarchy = (hierarchy) => {
    setEditingHierarchy({
      id: hierarchy.id,
      hierarchy_name: hierarchy.hierarchy_name,
      hierarchy_type: hierarchy.hierarchy_type,
      description: hierarchy.description || ''
    })
    setShowEditHierarchyModal(true)
  }

  const handleDeleteHierarchy = (hierarchy) => {
    setSelectedHierarchy(hierarchy)
    setShowDeleteHierarchyModal(true)
  }

  const handleSaveHierarchy = async () => {
    try {
      setLoading(true)
      
      if (editingHierarchy.id) {
        // Update existing hierarchy
        await fstHierarchiesAPI.update(editingHierarchy.id, editingHierarchy)
        setHierarchies(prev => prev.map(h => 
          h.id === editingHierarchy.id 
            ? { ...h, ...editingHierarchy }
            : h
        ))
      } else {
        // Add new hierarchy
        const response = await fstHierarchiesAPI.create(editingHierarchy)
        const newHierarchy = {
          ...editingHierarchy,
          id: response.data.id || Date.now(),
          created_at: new Date().toISOString(),
          elements_count: 0,
          status: 'Active'
        }
        setHierarchies(prev => [...prev, newHierarchy])
      }
      
      setShowAddHierarchyModal(false)
      setShowEditHierarchyModal(false)
    } catch (error) {
      console.error('Error saving hierarchy:', error)
      alert('Error saving hierarchy. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteHierarchy = async () => {
    try {
      setLoading(true)
      await fstHierarchiesAPI.delete(selectedHierarchy.id)
      setHierarchies(prev => prev.filter(h => h.id !== selectedHierarchy.id))
      setShowDeleteHierarchyModal(false)
    } catch (error) {
      console.error('Error deleting hierarchy:', error)
      alert('Error deleting hierarchy. Please try again.')
    } finally {
      setLoading(false)
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

  // FST Template functions
  const handleAddTemplate = () => {
    setEditingTemplate({
      template_name: '',
      template_type: '',
      description: '',
      version: '1.0'
    })
    setShowAddTemplateModal(true)
  }

  // Function to create a sample template if none exist
  const createSampleTemplate = async () => {
    try {
      setLoading(true)
      
      const sampleTemplate = {
        statement_type: 'Income Statement',
        category: 'Financial Statement',
        line_item: 'Sample Income Statement',
        company_id: currentCompany?.id || 1
      }
      
      console.log('Creating sample template:', sampleTemplate)
      
      const response = await fstAPI.createTemplate(sampleTemplate)
      console.log('Sample template created:', response.data)
      
      // Reload templates
      await loadFSTData()
      
      showNotification('Sample template created successfully!', 'success')
      
    } catch (error) {
      console.error('Error creating sample template:', error)
      showNotification('Error creating sample template', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate({
      id: template.id,
      template_name: template.template_name,
      template_type: template.template_type,
      description: template.description || '',
      version: template.version || '1.0'
    })
    setShowEditTemplateModal(true)
  }

  const handleDeleteTemplate = (template) => {
    setSelectedTemplate(template)
    setShowDeleteTemplateModal(true)
  }

  const handleSaveTemplate = async () => {
    try {
      setLoading(true)
      
      if (editingTemplate.id) {
        // Update existing template
        await fstAPI.updateTemplate(editingTemplate.id, editingTemplate)
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id 
            ? { ...t, ...editingTemplate }
            : t
        ))
      } else {
        // Add new template - map frontend fields to backend fields
        const backendTemplate = {
          statement_type: editingTemplate.template_type,
          category: editingTemplate.description,
          line_item: editingTemplate.template_name,
          company_id: currentCompany?.id || 1
        }
        const response = await fstAPI.createTemplate(backendTemplate)
        const newTemplate = {
          ...editingTemplate,
          id: response.data.id || Date.now(),
          created_at: new Date().toISOString(),
          elements_count: 0,
          usage_count: 0,
          status: 'Active',
          version: editingTemplate.version || '1.0'
        }
        setTemplates(prev => [...prev, newTemplate])
        
        // Also update FST Items
        const newFstItem = {
          id: newTemplate.id,
          itemCode: newTemplate.id,
          itemName: newTemplate.template_name,
          category: newTemplate.template_type,
          description: newTemplate.description,
          status: newTemplate.status,
          lastModified: newTemplate.created_at,
          modifiedBy: user?.name || 'User',
          version: newTemplate.version,
          elementsCount: newTemplate.elements_count,
          usageCount: newTemplate.usage_count
        }
        setFstItems(prev => [...prev, newFstItem])
      }
      
      setShowAddTemplateModal(false)
      setShowEditTemplateModal(false)
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error saving template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteTemplate = async () => {
    try {
      setLoading(true)
      await fstAPI.deleteTemplate(selectedTemplate.id)
      setTemplates(prev => prev.filter(t => t.id !== selectedTemplate.id))
      setFstItems(prev => prev.filter(i => i.id !== selectedTemplate.id))
      setShowDeleteTemplateModal(false)
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get current template elements
  const getCurrentTemplateElements = () => {
    if (!currentTemplateId) return []
    const elements = templateElementsMap[currentTemplateId] || []
    // Ensure all elements have required properties
    return elements.filter(element => element && element.id && element.element_name)
  }

  // Template Elements functions
  const handleOpenElements = async (template) => {
    setSelectedTemplateForElements(template)
    setShowElementsModal(true)
    
    try {
      setLoading(true)
      // Load real elements from CSV for this template
      const response = await fstAPI.getElements(template.id)
      const elementsData = response.data.elements || []
      
      // Transform elements data to match UI expectations
      const transformedElements = elementsData.map((element, index) => ({
        id: element.id,
        template_id: element.template_id,
        element_number: index + 1, // Sequential numbering
        element_name: element.name,
        element_type: element.element_type === 'formula' ? 'Formula' : 'Line Item',
        account_code: element.account_code || '',
        description: element.description || '',
        formula: element.formula || '',
        parent_id: element.parent_id || null,
        created_at: element.created_date || new Date().toISOString()
      }))
      
      // Store elements in template-specific map
      setTemplateElementsMap(prev => ({
        ...prev,
        [templateId]: transformedElements
      }))
      console.log(`Loaded ${transformedElements.length} elements for template ${template.template_name}`)
    } catch (error) {
      console.error('Error loading template elements:', error)
      // Set empty elements for this template
      setTemplateElementsMap(prev => ({
        ...prev,
        [templateId]: []
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleAddElement = () => {
    setEditingElement({
      element_name: '',
      element_type: 'Line Item',
      account_code: '',
      description: '',
      formula: '',
      position: 0,
      color: '#3B82F6',
      format: 'standard'
    })
    setQuickActionType(null)
    setShowAddElementModal(true)
  }

  const handleEditElement = (element) => {
    setEditingElement({
      id: element.id,
      element_name: element.element_name || element.name,
      element_type: element.element_type,
      account_code: element.account_code,
      description: element.description,
      formula: element.formula,
      position: element.position,
      color: element.color,
      format: element.format
    })
    setShowEditElementModal(true)
  }

  const handleSaveElement = async () => {
    try {
      setLoading(true)
      
      if (editingElement.id && editingElement.id !== 'undefined' && editingElement.id !== '') {
        // Update existing element
        const currentElements = getCurrentTemplateElements()
        const updatedElements = currentElements.map(e => 
          e.id === editingElement.id 
            ? { ...e, ...editingElement }
            : e
        )
        
        // Update template-specific map
        setTemplateElementsMap(prev => ({
          ...prev,
          [currentTemplateId]: updatedElements
        }))
        
        // Save updated element to backend
        try {
          const backendElement = {
            template_id: currentTemplateId,
            element_type: editingElement.element_type === 'Formula' ? 'formula' : 
                         editingElement.element_type === 'Header' ? 'header' : 'element',
            name: editingElement.element_name,
            account_code: editingElement.account_code || null,
            formula: editingElement.formula || null,
            description: editingElement.description || null,
            display_order: editingElement.position || editingElement.element_number
          }
          
          await fstAPI.updateElement(editingElement.id, backendElement)
          console.log('Element updated in backend successfully')
        } catch (error) {
          console.error('Error updating element in backend:', error)
          showNotification('Element updated locally but failed to save to backend', 'warning')
        }
        
        showNotification('Element updated successfully!', 'success')
      } else {
        // Add new element
        const currentElements = getCurrentTemplateElements()
        const newPosition = currentElements.length + 1
        
        // Map frontend fields to backend fields
        const backendElement = {
          template_id: currentTemplateId,
          element_type: editingElement.element_type === 'Formula' ? 'formula' : 
                       editingElement.element_type === 'Header' ? 'header' : 'element',
          name: editingElement.element_name,
          account_code: editingElement.account_code || null,
          formula: editingElement.formula || null,
          description: editingElement.description || null,
          display_order: newPosition
        }
        
        // Save to backend
        try {
          const response = await fstAPI.addElement(currentTemplateId, backendElement)
          const savedElement = response.data.element
          
          // Transform backend response to frontend format
          const newElement = {
            id: savedElement.id,
            template_id: savedElement.template_id,
            element_number: newPosition,
            position: savedElement.display_order || newPosition,
            element_name: savedElement.name,
            element_type: savedElement.element_type === 'formula' ? 'Formula' : 
                         savedElement.element_type === 'header' ? 'Header' : 'Line Item',
            account_code: savedElement.account_code || '',
            description: savedElement.description || '',
            formula: savedElement.formula || '',
            color: editingElement.color || '#3B82F6',
            format: editingElement.format || 'standard',
            created_at: savedElement.created_date || new Date().toISOString()
          }
          
          // Add to current template elements
          const updatedElements = [...currentElements, newElement]
          setTemplateElementsMap(prev => ({
            ...prev,
            [currentTemplateId]: updatedElements
          }))
          
          // Update template elements count
          if (selectedTemplateForDetail) {
            const updatedTemplate = { ...selectedTemplateForDetail, elementsCount: updatedElements.length }
            setSelectedTemplateForDetail(updatedTemplate)
            setTemplates(prev => prev.map(t => 
              t.id === currentTemplateId ? updatedTemplate : t
            ))
          }
          
        } catch (error) {
          console.error('Error saving element to backend:', error)
          showNotification('Error saving element to backend. Element saved locally.', 'warning')
          // Don't return here - continue with local save
        }
        
        showNotification('Element saved successfully!', 'success')
      }
      
      setShowAddElementModal(false)
      setShowEditElementModal(false)
      setQuickActionType(null)
      
      // Refresh the current template elements
      if (currentTemplateId) {
        await loadTemplateElements(currentTemplateId)
      }
      
      // Reset editing element
      setEditingElement({
        element_name: '',
        element_type: 'Line Item',
        account_code: '',
        description: '',
        formula: '',
        position: 0,
        color: '#3B82F6',
        format: 'standard'
      })
    } catch (error) {
      console.error('Error saving element:', error)
      showNotification('Error saving element. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteElement = async (element) => {
    try {
      setLoading(true)
      
      const currentElements = getCurrentTemplateElements()
      const filtered = currentElements.filter(e => e.id !== element.id)
      // Reorder element numbers
      const reordered = filtered.map((e, index) => ({ ...e, element_number: index + 1 }))
      
      // Update template-specific map
      setTemplateElementsMap(prev => ({
        ...prev,
        [currentTemplateId]: reordered
      }))
      
      // Update template elements count
      if (selectedTemplateForDetail) {
        const updatedTemplate = { ...selectedTemplateForDetail }
        updatedTemplate.elementsCount = Math.max(0, (updatedTemplate.elementsCount || 0) - 1)
        setSelectedTemplateForDetail(updatedTemplate)
        
        // Update in templates list
        setTemplates(prev => prev.map(t => 
          t.id === selectedTemplateForDetail.id ? updatedTemplate : t
        ))
      }
      
      showNotification('Element deleted successfully!', 'success')
    } catch (error) {
      console.error('Error deleting element:', error)
      showNotification('Error deleting element. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Formula testing functionality
  const testFormulas = () => {
    if (getCurrentTemplateElements().length === 0) {
      showNotification('No elements to test. Please add some elements first.', 'error')
      return
    }

    // First pass: Generate random test data for Line Item elements only
    const testData = getCurrentTemplateElements().map(element => {
      let testValue = 0
      
      if (element.element_type === 'Line Item') {
        // Generate random value between 1000 and 11000
        testValue = Math.floor(Math.random() * 10000) + 1000
      } else if (element.element_type === 'Header') {
        testValue = 0 // Headers don't have values
      }
      // Formula elements will be calculated in the second pass
      
      return {
        ...element,
        testValue: testValue
      }
    })

    // Second pass: Calculate formulas using the test data from first pass
    const finalTestData = testData.map(element => {
      if (element.element_type === 'Formula') {
        try {
          const formula = element.formula
          let calculatedFormula = formula
          
          // Replace element positions with their actual test values
          getCurrentTemplateElements().forEach((el, index) => {
            if (el.element_type === 'Line Item') {
              // Find the test value for this element by position
              const elementTestData = testData.find(testEl => 
                testEl.position === el.position || testEl.element_number === el.element_number
              )
              if (elementTestData && elementTestData.testValue) {
                // Replace position numbers in formulas (e.g., "1 + 2 + 3")
                calculatedFormula = calculatedFormula.replace(new RegExp(`\\b${el.position}\\b`, 'g'), elementTestData.testValue)
                calculatedFormula = calculatedFormula.replace(new RegExp(`\\b${el.element_number}\\b`, 'g'), elementTestData.testValue)
                
                // Debug: Log each replacement
                console.log(`Replacing position ${el.position} with value ${elementTestData.testValue}`)
              }
            }
          })
          
          // Also replace element names with their values for better formula support
          getCurrentTemplateElements().forEach(el => {
            if (el.element_type === 'Line Item') {
              const elementTestData = testData.find(testEl => testEl.id === el.id)
              if (elementTestData && elementTestData.testValue) {
                // Replace element names in formulas
                calculatedFormula = calculatedFormula.replace(new RegExp(`\\b${el.element_name}\\b`, 'gi'), elementTestData.testValue)
              }
            }
          })
          
          // Debug: Log the formula transformation
          console.log(`Original formula: "${formula}"`)
          console.log(`After position replacement: "${calculatedFormula}"`)
          console.log(`Formula "${formula}" becomes "${calculatedFormula}"`)
          
          // Evaluate the formula safely
          const result = eval(calculatedFormula)
          console.log(`Formula result: ${result}`)
          return {
            ...element,
            testValue: result || 0
          }
        } catch (error) {
          console.error('Formula calculation error:', error)
          return {
            ...element,
            testValue: 0
          }
        }
      }
      
      return element
    })

    // Create a formatted test results display
    let testResults = `🧪 Test Formulas Results\n`
    testResults += `Template: ${selectedTemplateForDetail?.template_name || 'Template'}\n`
    testResults += `Generated: ${new Date().toLocaleString()}\n\n`

    testResults += `📊 Element Values:\n`
    testResults += `${'─'.repeat(60)}\n`

    finalTestData.forEach(element => {
      if (element.element_type === 'Header') {
        testResults += `\n📋 ${element.element_name.toUpperCase()}\n`
        testResults += `${'─'.repeat(element.element_name.length + 3)}\n`
      } else {
        const formattedValue = element.format === 'currency' ? 
          `$${element.testValue.toLocaleString()}` : 
          element.format === 'percentage' ? 
          `${element.testValue.toFixed(2)}%` : 
          element.format === 'number' ? 
          element.testValue.toLocaleString() : 
          element.testValue.toString()
        
        testResults += `${element.position || element.element_number}. ${element.element_name.padEnd(30)} ${formattedValue.padStart(15)}\n`
        
        if (element.element_type === 'Formula' && element.formula) {
          testResults += `   └─ Formula: ${element.formula}\n`
        }

      }
    })

    // Update the templateElements with test data for consistency
    const currentElements = getCurrentTemplateElements()
    const updatedElements = currentElements.map(element => {
      const testElement = finalTestData.find(testEl => testEl.id === element.id)
      return testElement ? { ...element, testValue: testElement.testValue } : element
    })
    
    // Update template-specific map
    setTemplateElementsMap(prev => ({
      ...prev,
      [currentTemplateId]: updatedElements
    }))

    // Show test results in a more user-friendly way
    showNotification('Test Formulas results generated successfully!', 'success')
    console.log('Test Formulas Results:', testResults)
  }

  // Test View functionality - Visual preview of FST
  const testView = () => {
    if (getCurrentTemplateElements().length === 0) {
      showNotification('No elements to preview. Please add some elements first.', 'error')
      return
    }

    // First pass: Generate random test data for Line Item elements only
    const testData = getCurrentTemplateElements().map(element => {
      let testValue = 0
      
      if (element.element_type === 'Line Item') {
        // Generate random value between 1000 and 11000
        testValue = Math.floor(Math.random() * 10000) + 1000
      } else if (element.element_type === 'Header') {
        testValue = 0 // Headers don't have values
      }
      // Formula elements will be calculated in the second pass
      
      return {
        ...element,
        testValue: testValue
      }
    })

    // Second pass: Calculate formulas using the test data from first pass
    const finalTestData = testData.map(element => {
      if (element.element_type === 'Formula') {
        try {
          const formula = element.formula
          let calculatedFormula = formula
          
          // Replace element positions with their actual test values
          getCurrentTemplateElements().forEach((el, index) => {
            if (el.element_type === 'Line Item') {
              // Find the test value for this element by position
              const elementTestData = testData.find(testEl => 
                testEl.position === el.position || testEl.element_number === el.element_number
              )
              if (elementTestData && elementTestData.testValue) {
                // Replace position numbers in formulas (e.g., "1 + 2 + 3")
                calculatedFormula = calculatedFormula.replace(new RegExp(`\\b${el.position}\\b`, 'g'), elementTestData.testValue)
                calculatedFormula = calculatedFormula.replace(new RegExp(`\\b${el.element_number}\\b`, 'g'), elementTestData.testValue)
                
                // Debug: Log each replacement
                console.log(`TestView: Replacing position ${el.position} with value ${elementTestData.testValue}`)
              }
            }
          })
          
          // Also replace element names with their values for better formula support
          getCurrentTemplateElements().forEach(el => {
            if (el.element_type === 'Line Item') {
              const elementTestData = testData.find(testEl => testEl.id === el.id)
              if (elementTestData && elementTestData.testValue) {
                // Replace element names in formulas
                calculatedFormula = calculatedFormula.replace(new RegExp(`\\b${el.element_name}\\b`, 'gi'), elementTestData.testValue)
              }
            }
          })
          
          // Debug: Log the formula transformation
          console.log(`TestView Original formula: "${formula}"`)
          console.log(`TestView After position replacement: "${calculatedFormula}"`)
          console.log(`TestView Formula "${formula}" becomes "${calculatedFormula}"`)
          
          // Evaluate the formula safely
          const result = eval(calculatedFormula)
          console.log(`TestView Formula result: ${result}`)
          return {
            ...element,
            testValue: result || 0
          }
        } catch (error) {
          console.error('TestView Formula calculation error:', error)
          return {
            ...element,
            testValue: 0
          }
          }
        }
      
      return element
    })

    // Generate test data for the modal display
    console.log('Test View data generated for modal display')
    
    // Update the templateElements with test data for display
    const currentElements = getCurrentTemplateElements()
    const updatedElements = currentElements.map(element => {
      const testElement = finalTestData.find(testEl => testEl.id === element.id)
      return testElement ? { ...element, testValue: testElement.testValue } : element
    })
    
    // Update template-specific map
    setTemplateElementsMap(prev => ({
      ...prev,
      [currentTemplateId]: updatedElements
    }))

    // Show preview in a modal instead of alert
    setShowTestViewModal(true)
  }

  // Reorder elements functionality
  const reorderElements = (elementId, newPosition) => {
    const currentElements = getCurrentTemplateElements()
    const elements = [...currentElements]
    const elementIndex = elements.findIndex(e => e.id === elementId)
    
    if (elementIndex === -1) return
    
    const element = elements[elementIndex]
    
    // Remove element from old position
    elements.splice(elementIndex, 1)
    
    // Insert at new position
    elements.splice(newPosition - 1, 0, element)
    
    // Update positions and element numbers
    const reorderedElements = elements.map((el, index) => ({
      ...el,
      position: index + 1,
      element_number: index + 1
    }))
    
    // Update template-specific map
    setTemplateElementsMap(prev => ({
      ...prev,
      [currentTemplateId]: reorderedElements
    }))
  }

  // Template Detail Modal functions (Double-click functionality)
  const handleTemplateDoubleClick = async (template) => {
    console.log('Opening template detail modal for:', template)
    
    // Only change template if it's different from current one
    if (selectedTemplateForDetail?.id !== template.id) {
      setSelectedTemplateForDetail(template)
      setCurrentTemplateId(template.id) // Set current template ID
      
      // Load elements for this specific template
      await loadElementsForTemplate(template.id)
    }
    
    setShowTemplateDetailModal(true)
  }

  // Function to load elements for a specific template
  const loadElementsForTemplate = async (templateId) => {
    // Prevent loading with undefined template_id
    if (!templateId || templateId === 'undefined') {
      console.log('Skipping element load for undefined template_id')
      return
    }
    
    try {
      setLoading(true)
      console.log('Loading elements for template:', templateId)
      
      // Load elements from database API
      const response = await fstAPI.getElements(templateId)
      const elementsData = response.data.elements || []
      
      console.log('Raw elements data:', elementsData)
      
      // Transform elements data to match UI expectations
      const transformedElements = elementsData.map((element, index) => ({
        id: element.id,
        template_id: element.template_id,
        element_number: index + 1,
        position: element.display_order || index + 1,
        element_name: element.name || `Element ${index + 1}`, // Use the correct property from backend with fallback
        element_type: element.element_type === 'formula' ? 'Formula' : 
                     element.element_type === 'header' ? 'Header' : 'Line Item',
        account_code: element.account_code || '',
        description: element.description || '',
        formula: element.formula || '',
        color: element.color || '#3B82F6',
        format: element.format || 'standard',
        created_at: element.created_date || new Date().toISOString()
      }))
      
      console.log('Transformed elements:', transformedElements)
      
      // Ensure all elements have required properties
      const safeElements = transformedElements.map(element => ({
        ...element,
        element_name: element.element_name || `Element ${element.element_number}`,
        element_type: element.element_type || 'Line Item',
        position: element.position || element.element_number || 1
      }))
      
      // Store elements in template-specific map
      setTemplateElementsMap(prev => ({
        ...prev,
        [templateId]: safeElements
      }))
      
      // Update template's elementsCount
      const updatedTemplate = { ...selectedTemplateForDetail, elementsCount: transformedElements.length }
      setSelectedTemplateForDetail(updatedTemplate)
      
      // Update in templates list
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? updatedTemplate : t
      ))
      
      // Also save to localStorage as backup
      localStorage.setItem(`fst_elements_${templateId}`, JSON.stringify(safeElements))
      
    } catch (error) {
      console.error('Error loading template elements:', error)
      // Try to load from localStorage as fallback
      const storedElements = localStorage.getItem(`fst_elements_${templateId}`)
      if (storedElements) {
        try {
          const parsedElements = JSON.parse(storedElements)
          setTemplateElementsMap(prev => ({
            ...prev,
            [templateId]: parsedElements
          }))
          console.log(`Loaded ${parsedElements.length} elements from localStorage for template ${templateId}`)
        } catch (parseError) {
          console.error('Error parsing stored elements:', parseError)
          setTemplateElementsMap(prev => ({
            ...prev,
            [templateId]: []
          }))
        }
      } else {
        // Set empty elements for this template
        setTemplateElementsMap(prev => ({
          ...prev,
          [templateId]: []
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const closeTemplateDetailModal = () => {
    // Elements are automatically saved to database in real-time, no need to prompt user
    setShowTemplateDetailModal(false)
    setShowElementsModal(false)
    // DON'T clear selectedTemplateForDetail or currentTemplateId to keep elements visible
    // Elements will persist in templateElementsMap
  }

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    // Safety check: ensure template exists
    if (!template) return false
    
    // Don't filter if templates are still loading
    if (loading) return true
    
    // Check if template has required properties (either template_name or line_item or statement_type)
    const hasName = template.template_name || template.line_item || template.statement_type
    if (!hasName) return false
    
    const templateName = template.template_name || template.line_item || template.statement_type || ''
    const templateType = template.template_type || template.statement_type || ''
    const templateDescription = template.description || template.category || ''
    
    // If no search term, show all templates that have names
    const matchesSearch = searchTerm === '' || 
                         (templateName && templateName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (templateDescription && templateDescription.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = selectedType === '' || templateType === selectedType
    const matchesStatus = selectedStatus === '' || template.status === selectedStatus
    
    console.log('Filtering template:', {
      id: template.id,
      name: templateName,
      type: templateType,
      description: templateDescription,
      hasName,
      searchTerm,
      selectedType,
      selectedStatus,
      matchesSearch,
      matchesType,
      matchesStatus,
      result: matchesSearch && matchesType && matchesStatus
    })
    
    return matchesSearch && matchesType && matchesStatus
  })
  
  console.log('Filtered templates count:', filteredTemplates.length)

  // CSV Integration functions
  const saveTemplateToCSV = async (template) => {
    try {
      if (!currentCompany) {
        console.error('No company selected')
        return
      }

      // Create CSV content
      const csvContent = `id,template_name,template_type,description,version,created_date\n${template.id},${template.template_name},${template.template_type},${template.description},${template.version || '1.0'},${new Date().toISOString()}`

      // In a real app, you would send this to your backend API
      // For now, we'll simulate saving to CSV
      console.log('Saving template to CSV:', csvContent)
      
      // Update local state
      setTemplates(prev => {
        if (template.id) {
          return prev.map(t => t.id === template.id ? template : t)
        } else {
          return [...prev, { ...template, id: Date.now() }]
        }
      })

      // Close modal
      setShowAddTemplateModal(false)
      setShowEditTemplateModal(false)
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  // Export template elements to CSV in proper order
  const exportTemplateElementsToCSV = async (template) => {
    if (!template || !currentTemplateId || !templateElementsMap[currentTemplateId]) {
      showNotification('No template or elements to export', 'error')
      return
    }

    const currentElements = templateElementsMap[currentTemplateId]
    if (currentElements.length === 0) {
      showNotification('No elements to export', 'error')
      return
    }

    try {
      setLoading(true)
      
      // Sort elements by position to ensure proper order
      const sortedElements = [...currentElements].sort((a, b) => 
        (a.position || a.element_number || 0) - (b.position || b.element_number || 0)
      )

      // All elements are already saved locally, no need to save to backend
      console.log('Exporting elements from local storage')

      // Create CSV headers
      const headers = [
        'Position',
        'Element Number',
        'Element Name',
        'Element Type',
        'Account Code',
        'Description',
        'Formula',
        'Color',
        'Format'
      ].join(',')

      // Create CSV rows
      const rows = sortedElements.map(element => [
        element.position || element.element_number || '',
        element.element_number || '',
        `"${element.element_name || ''}"`,
        element.element_type || '',
        element.account_code || '',
        `"${element.description || ''}"`,
        `"${element.formula || ''}"`,
        element.color || '',
        element.format || ''
      ].join(','))

      // Combine headers and rows
      const csvContent = [headers, ...rows].join('\n')

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${template.template_name}_elements_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // CSV is automatically saved to localStorage in real-time
      console.log('CSV exported and saved to localStorage')

      console.log('Exported template elements to CSV:', csvContent)
      showNotification('Template elements exported successfully! CSV saved to localStorage in real-time.', 'success')
      
    } catch (error) {
      console.error('Error exporting template elements:', error)
      showNotification('Error exporting template elements. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      'Balance Sheet': 'bg-blue-100 text-blue-800',
      'Income Statement': 'bg-green-100 text-green-800',
      'Cash Flow': 'bg-purple-100 text-purple-800',
      'Statement of Changes in Equity': 'bg-orange-100 text-orange-800',
      'Notes to Financial Statements': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type) => {
    const icons = {
      'Balance Sheet': <BarChart3 className="w-4 h-4" />,
      'Income Statement': <TrendingUp className="w-4 h-4" />,
      'Cash Flow': <Calculator className="w-4 h-4" />,
      'Statement of Changes in Equity': <Users className="w-4 h-4" />,
      'Notes to Financial Statements': <FileText className="w-4 h-4" />
    }
    return icons[type] || <FileText className="w-4 h-4" />
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Paused':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Archived':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }







  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Notification Component */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-300 transform ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } ${notification ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
          {notification.message}
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 border border-blue-100 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <Layers className="h-6 w-6 text-white" />
              </div>
              Financial Statement Templates
            </h1>
            <p className="text-lg text-gray-600 ml-16">Design professional financial statements with IFRS account mappings and advanced formulas</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
                <div className="text-sm text-gray-600">Templates</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Only FST Templates */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">FST Templates</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {templates.length} Templates
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleAddTemplate}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Template
              </button>
              <button 
                onClick={loadFSTData}
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl transition-all duration-200 flex items-center border border-gray-200 shadow-sm hover:shadow-md"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* FST Templates Tab - Main Content */}
        <div className="p-8 px-12">

          {/* Search and Filter */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Search Templates</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search by template name, description, or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Template Type</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white min-w-[180px]"
                    >
                      <option value="">All Types</option>
                      {templateTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white min-w-[160px]"
                    >
                      <option value="">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700 mb-1">Total Templates</p>
                  <p className="text-3xl font-bold text-blue-900">{templates.length}</p>
                  <p className="text-xs text-blue-600 mt-1">Financial statement templates</p>
                </div>
                <div className="p-4 bg-blue-200 rounded-2xl">
                  <Layers className="h-8 w-8 text-blue-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700 mb-1">Active Templates</p>
                  <p className="text-3xl font-bold text-green-900">
                    {templates.filter(template => template.status === 'Active').length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Ready for use</p>
                </div>
                <div className="p-4 bg-green-200 rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-green-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-700 mb-1">Total Elements</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {(() => {
                      const total = templates.reduce((sum, template) => sum + (template.elementsCount || 0), 0);
                      return total;
                    })()}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Accounts & formulas</p>
                </div>
                <div className="p-4 bg-purple-200 rounded-2xl">
                  <FileText className="h-8 w-8 text-purple-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-700 mb-1">Total Usage</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {(() => {
                      const total = templates.reduce((sum, template) => sum + (template.usageCount || 0), 0);
                      return total;
                    })()}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Times used</p>
                </div>
                <div className="p-4 bg-orange-200 rounded-2xl">
                  <TrendingUp className="h-8 w-8 text-orange-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg text-gray-600">Loading templates...</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* FST Templates Tab */}
        {activeTab === 'templates' && (
          <div className="pt-6 px-8 pb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">FST Templates</h3>
              <div className="flex space-x-3">
                <button 
                  onClick={loadFSTData}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>



            {/* Templates Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading FST data from PostgreSQL...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {filteredTemplates.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? 'No templates match your search criteria.' : 'No FST templates have been created yet.'}
                    </p>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">Debug Info:</p>
                      <p className="text-sm text-gray-500">Total templates: {templates.length}</p>
                      <p className="text-sm text-gray-500">Filtered templates: {filteredTemplates.length}</p>
                      <p className="text-sm text-gray-500">Search term: "{searchTerm}"</p>
                      <p className="text-sm text-gray-500">Selected type: "{selectedType}"</p>
                      <p className="text-sm text-gray-500">Selected status: "{selectedStatus}"</p>
                    </div>
                    <div className="space-y-3">
                      <button 
                        onClick={loadFSTData}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors mr-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Load Templates
                      </button>
                      <button 
                        onClick={createSampleTemplate}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors mr-2"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Create Sample Template
                      </button>
                      <button 
                        onClick={handleAddTemplate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Template
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                <div 
                  key={template.id} 
                  className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 mx-2" 
                  onDoubleClick={() => handleTemplateDoubleClick(template)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${getTypeColor(template.template_type)}`}>
                      {getTypeIcon(template.template_type)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(template.status)}`}>
                        {template.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const newStatus = template.status === 'Active' ? 'Paused' : 'Active'
                          const updatedTemplate = {...template, status: newStatus}
                          // Update in templates list
                          setTemplates(prev => prev.map(t => 
                            t.id === template.id ? updatedTemplate : t
                          ))
                          // Save to backend
                          if (fstAPI.updateTemplate) {
                            fstAPI.updateTemplate(template.id, updatedTemplate)
                              .then(() => console.log('Template status updated'))
                              .catch(err => console.error('Error updating template status:', err))
                          }
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                          template.status === 'Active' 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                        title={template.status === 'Active' ? 'Pause Template' : 'Activate Template'}
                      >
                        {template.status === 'Active' ? '⏸️' : '▶️'}
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.template_name}</h3>
                  
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(template.template_type)} mb-3`}>
                    {template.template_type}
                  </span>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Elements:</span>
                      <span className="font-medium text-gray-900">{template.elements_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Usage:</span>
                      <span className="font-medium text-gray-900">{template.usage_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Version:</span>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 flex items-center justify-center space-x-2">
                          <span>{template.version}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const newVersion = prompt('Enter new version:', template.version)
                              if (newVersion && newVersion !== template.version) {
                                const updatedTemplate = {...template, version: newVersion}
                                // Update in templates list
                                setTemplates(prev => prev.map(t => 
                                  t.id === template.id ? updatedTemplate : t
                                ))
                                // Save to backend
                                if (fstAPI.updateTemplate) {
                                  fstAPI.updateTemplate(template.id, updatedTemplate)
                                    .then(() => console.log('Template version updated'))
                                    .catch(err => console.error('Error updating template version:', err))
                                }
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-all duration-200"
                            title="Edit Version"
                          >
                            ✏️
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">Version</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditTemplate(template)
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTemplateDoubleClick(template)
                        }}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Open Editor
                      </button>

                    </div>
                    <div className="flex items-center justify-center text-xs text-gray-500 bg-gray-50 py-2 rounded-lg">
                      <Eye className="h-3 w-3 mr-1" />
                      Double-click to open template editor
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => handleDeleteTemplate(template)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Template
                    </button>
                  </div>
                </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FST Hierarchy Modals */}
      {/* Add/Edit Hierarchy Modal */}
      {(showAddHierarchyModal || showEditHierarchyModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingHierarchy.id ? 'Edit Hierarchy' : 'Create New Hierarchy'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type
                  </label>
                  <select
                    value={editingHierarchy.hierarchy_type}
                    onChange={(e) => setEditingHierarchy({...editingHierarchy, hierarchy_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Template Type</option>
                    {templateTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editingHierarchy.hierarchy_name}
                    onChange={(e) => setEditingHierarchy({...editingHierarchy, hierarchy_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Balance Sheet Template, Income Statement Template"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingHierarchy.description}
                    onChange={(e) => setEditingHierarchy({...editingHierarchy, description: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of this hierarchy"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAddHierarchyModal(false) || setShowEditHierarchyModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHierarchy}
                  disabled={!editingHierarchy.hierarchy_name || !editingHierarchy.hierarchy_type}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingHierarchy.id ? 'Save Changes' : 'Create Hierarchy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Hierarchy Confirmation Modal */}
      {showDeleteHierarchyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Hierarchy
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete "{selectedHierarchy?.hierarchy_name}"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteHierarchyModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteHierarchy}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FST Template Modals */}
      {/* Add/Edit Template Modal */}
      {(showAddTemplateModal || showEditTemplateModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTemplate.id ? 'Edit Template' : 'Create New Template'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.template_name}
                    onChange={(e) => setEditingTemplate({...editingTemplate, template_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type
                  </label>
                  <select
                    value={editingTemplate.template_type}
                    onChange={(e) => setEditingTemplate({...editingTemplate, template_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    {templateTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.version}
                    onChange={(e) => setEditingTemplate({...editingTemplate, version: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1.0"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAddTemplateModal(false) || setShowEditTemplateModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!editingTemplate.template_name || !editingTemplate.template_type}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTemplate.id ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      {showDeleteTemplateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Template
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete "{selectedTemplate?.template_name}"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteTemplateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTemplate}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Elements Modal */}
      {showElementsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Layers className="h-6 w-6 mr-3 text-indigo-600" />
                Template Elements
              </h3>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowElementsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => {
                    setQuickActionType('Line Item')
                    setShowAddElementModal(true)
                    setEditingElement({
                      ...editingElement,
                      element_type: 'Line Item',
                      color: '#3B82F6'
                    })
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Element
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Info className="h-4 w-4" />
                <span>Sequential numbering (1, 2, 3...) for formula references.</span>
              </div>
            </div>

            {/* Elements List */}
            <div className="space-y-4">
                              {getCurrentTemplateElements().map((element, index) => (
                <div 
                  key={element.id} 
                  className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300"
                  style={{
                    borderLeftColor: element.color || '#3B82F6',
                    borderLeftWidth: '4px'
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span 
                          className="text-white px-2 py-1 rounded-lg text-sm font-bold min-w-[32px] text-center"
                          style={{ backgroundColor: element.color || '#3B82F6' }}
                        >
                          {element.position || element.element_number || index + 1}
                        </span>
                        <h5 className="text-lg font-bold text-gray-900">{element.element_name}</h5>
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: element.color || '#3B82F6' }}
                        >
                          {element.element_type}
                        </span>
                        {element.format && element.format !== 'standard' && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                            {element.format}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                        {element.account_code && (
                          <div className="flex items-center text-gray-700 bg-blue-50 p-2 rounded-lg">
                            <Tag className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="font-medium">Code:</span>
                            <span className="ml-1 font-bold">{element.account_code}</span>
                          </div>
                        )}
                        {element.formula && (
                          <div className="flex items-center text-gray-700 bg-green-50 p-2 rounded-lg">
                            <Calculator className="h-4 w-4 mr-2 text-green-600" />
                            <span className="font-medium">Formula:</span>
                            <span className="ml-1 font-mono bg-white px-2 py-1 rounded border text-xs">{element.formula}</span>
                          </div>
                        )}
                        <div className="flex items-center text-gray-700 bg-gray-50 p-2 rounded-lg">
                          <Settings className="h-4 w-4 mr-2 text-gray-600" />
                          <span className="font-medium">Position:</span>
                          <span className="ml-1 font-bold">{element.position || element.element_number || index + 1}</span>
                        </div>
                      </div>
                      
                      {element.description && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-700 text-sm">{element.description}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditElement(element)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-all duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteElement(element)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Position Controls */}
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => reorderElements(element.id, Math.max(1, (element.position || element.element_number || index + 1) - 1))}
                          disabled={(element.position || element.element_number || index + 1) <= 1}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button 
                                                              onClick={() => reorderElements(element.id, Math.min(getCurrentTemplateElements().length, (element.position || element.element_number || index + 1) + 1))}
                                    disabled={(element.position || element.element_number || index + 1) >= getCurrentTemplateElements().length}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

                              {getCurrentTemplateElements().length === 0 && (
              <div className="text-center py-12">
                <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No elements found
                </h3>
                <p className="text-gray-500 mb-4">
                  Get started by adding your first template element
                </p>
                <button
                  onClick={() => {
                    setQuickActionType('Line Item')
                    setShowAddElementModal(true)
                    setEditingElement({
                      ...editingElement,
                      element_type: 'Line Item',
                      color: '#3B82F6'
                    })
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Element
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Element Modal - Compact Layout */}
      {showAddElementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <h3 className="text-xl font-bold">Add New Element</h3>
              <p className="text-blue-100 text-sm">Create a new element for your template</p>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSaveElement(); }} className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-140px)] relative">
              {/* Scroll indicator */}
              <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-full">
                Scroll to see all fields
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="element_name" className="block text-sm font-semibold text-gray-700 mb-2">Element Name *</label>
                  <input
                    type="text"
                    id="element_name"
                    required
                    value={editingElement.element_name}
                    onChange={(e) => setEditingElement({ ...editingElement, element_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter element name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Element Type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {elementTypeOptions.map((option) => (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => setEditingElement({ ...editingElement, element_type: option.type, color: option.color })}
                        disabled={quickActionType !== null}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          editingElement.element_type === option.type
                            ? `border-${option.color} bg-${option.color} text-white`
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        } ${quickActionType !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{
                          borderColor: editingElement.element_type === option.type ? option.color : undefined,
                          backgroundColor: editingElement.element_type === option.type ? option.color : undefined
                        }}
                      >
                        <div className="font-semibold text-sm">{option.label}</div>
                        <div className="text-xs opacity-80 mt-1">{option.description}</div>
                        {quickActionType !== null && (
                          <div className="text-xs mt-2 text-blue-600 font-medium">
                            Pre-selected via Quick Action
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {quickActionType !== null && (
                    <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
                      <Info className="h-4 w-4 inline mr-1" />
                      Element type is pre-selected based on your quick action selection
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="position" className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                  <input
                    type="number"
                    id="position"
                    min="1"
                                    max={getCurrentTemplateElements().length + 1}
                value={editingElement.position || getCurrentTemplateElements().length + 1}
                onChange={(e) => {
                  const newPosition = Math.max(1, Math.min(getCurrentTemplateElements().length + 1, parseInt(e.target.value) || 1))
                      setEditingElement({ ...editingElement, position: newPosition })
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Position in template"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Position 1-{getCurrentTemplateElements().length + 1} (1 = first, {getCurrentTemplateElements().length + 1} = last)
                  </p>
                </div>
                
                <div>
                  <label htmlFor="color" className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <input
                    type="color"
                    id="color"
                    value={editingElement.color}
                    onChange={(e) => setEditingElement({ ...editingElement, color: e.target.value })}
                    className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer"
                  />
                </div>
                
                <div>
                  <label htmlFor="format" className="block text-sm font-semibold text-gray-700 mb-2">Format</label>
                  <select
                    id="format"
                    value={editingElement.format}
                    onChange={(e) => setEditingElement({ ...editingElement, format: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="standard">Standard</option>
                    <option value="currency">Currency</option>
                    <option value="percentage">Percentage</option>
                    <option value="number">Number</option>
                    <option value="text">Text</option>
                  </select>
                </div>
              </div>
              
              {editingElement.element_type === 'Line Item' && (
                <div className="mt-3">
                  <label htmlFor="ifrs_account" className="block text-sm font-semibold text-gray-700 mb-2">IFRS Account *</label>
                  <select
                    id="ifrs_account"
                    required
                    value={editingElement.account_code}
                    onChange={(e) => {
                      const selectedAccount = ifrsAccounts.find(acc => acc.account_code === e.target.value)
                      setEditingElement({ 
                        ...editingElement, 
                        account_code: e.target.value,
                        element_name: selectedAccount ? selectedAccount.account_name : editingElement.element_name,
                        description: selectedAccount ? selectedAccount.description : editingElement.description
                      })
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select IFRS Account</option>
                    {ifrsAccounts.map(account => (
                      <option key={account.id} value={account.account_code}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {editingElement.element_type !== 'Line Item' && (
                <div className="mt-3">
                  <label htmlFor="account_code" className="block text-sm font-semibold text-gray-700 mb-2">
                    {editingElement.element_type === 'Formula' ? 'Formula Name' : 
                     editingElement.element_type === 'Header' ? 'Header Name' : 'Account Code'} *
                  </label>
                  <input
                    type="text"
                    id="account_code"
                    required
                    value={editingElement.account_code}
                    onChange={(e) => setEditingElement({ ...editingElement, account_code: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder={editingElement.element_type === 'Formula' ? 'Enter formula name' : 
                                editingElement.element_type === 'Header' ? 'Enter header name' : 'Enter account code'}
                  />
                </div>
              )}
              
              <div className="mt-3">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  id="description"
                  value={editingElement.description}
                  onChange={(e) => setEditingElement({ ...editingElement, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter element description"
                />
              </div>
              {/* Enhanced Formula Input for Formula Type */}
              {editingElement.element_type === 'Formula' && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="formula" className="block text-sm font-semibold text-gray-700 mb-2">Formula *</label>
                    <textarea
                      id="formula"
                      required
                      value={editingElement.formula}
                      onChange={(e) => setEditingElement({ ...editingElement, formula: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-lg"
                      placeholder="Enter formula (e.g., 1 + 2 + 3)"
                    />
                  </div>
                  
                  {/* Formula Helper */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                      <Calculator className="h-5 w-5 mr-2" />
                      Formula Builder
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-700 mb-2 font-medium">Common Operators:</p>
                        <div className="flex flex-wrap gap-2">
                          {['+', '-', '*', '/', '(', ')', '='].map(op => (
                            <button
                              key={op}
                              type="button"
                              onClick={() => {
                                const textarea = document.getElementById('formula')
                                if (textarea) {
                                  const start = textarea.selectionStart
                                  const end = textarea.selectionEnd
                                  const value = editingElement.formula
                                  const newValue = value.substring(0, start) + op + value.substring(end)
                                  setEditingElement({ ...editingElement, formula: newValue })
                                  // Set cursor position after the inserted operator
                                  setTimeout(() => {
                                    textarea.focus()
                                    textarea.setSelectionRange(start + 1, start + 1)
                                  }, 0)
                                }
                              }}
                              className="px-3 py-2 bg-white text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-50 text-sm font-mono font-bold shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-2 font-medium">Available Elements:</p>
                        <div className="max-h-28 overflow-y-auto space-y-2 pr-2">
                          {getCurrentTemplateElements().map(element => (
                            <div key={element.id} className="text-sm text-blue-600 bg-white/80 px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => {
                              const textarea = document.getElementById('formula')
                              if (textarea) {
                                const start = textarea.selectionStart
                                const end = textarea.selectionEnd
                                const value = editingElement.formula
                                const elementRef = element.element_number || '?'
                                const newValue = value.substring(0, start) + elementRef + value.substring(end)
                                setEditingElement({ ...editingElement, formula: newValue })
                                setTimeout(() => {
                                  textarea.focus()
                                  textarea.setSelectionRange(start + elementRef.length, start + elementRef.length)
                                }, 0)
                              }
                            }}>
                              <span className="font-bold">{element.element_number || '?'}</span>: {element.element_name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddElementModal(false)
                    setQuickActionType(null)
                  }}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Add Element
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditElementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Element</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveElement(); }} className="space-y-3 relative">
              {/* Scroll indicator */}
              <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-full">
                Scroll to see all fields
              </div>
              <input type="hidden" value={editingElement.id} />
              <div>
                <label htmlFor="edit_element_name" className="block text-sm font-medium text-gray-700">Element Name</label>
                <input
                  type="text"
                  id="edit_element_name"
                  value={editingElement.element_name}
                  onChange={(e) => setEditingElement({ ...editingElement, element_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="edit_element_type" className="block text-sm font-medium text-gray-700">Element Type</label>
                <select
                  id="edit_element_type"
                  value={editingElement.element_type}
                  onChange={(e) => setEditingElement({ ...editingElement, element_type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Line Item">Line Item</option>
                  <option value="Formula">Formula</option>
                  <option value="Header">Header</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit_account_code" className="block text-sm font-medium text-gray-700">Account Code</label>
                <input
                  type="text"
                  id="edit_account_code"
                  value={editingElement.account_code}
                  onChange={(e) => setEditingElement({ ...editingElement, account_code: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="edit_description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="edit_description"
                  value={editingElement.description}
                  onChange={(e) => setEditingElement({ ...editingElement, description: e.target.value })}
                  rows="3"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="edit_formula" className="block text-sm font-medium text-gray-700">Formula</label>
                <textarea
                  id="edit_formula"
                  value={editingElement.formula}
                  onChange={(e) => setEditingElement({ ...editingElement, formula: e.target.value })}
                  rows="3"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="edit_position" className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="number"
                  id="edit_position"
                  min="1"
                  max={getCurrentTemplateElements().length}
                  value={editingElement.position || 1}
                  onChange={(e) => {
                    const newPosition = Math.max(1, Math.min(getCurrentTemplateElements().length, parseInt(e.target.value) || 1))
                    setEditingElement({ ...editingElement, position: newPosition })
                  }}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Position 1-{getCurrentTemplateElements().length} (1 = first, {getCurrentTemplateElements().length} = last)
                </p>
              </div>
              <div>
                <label htmlFor="edit_color" className="block text-sm font-medium text-gray-700">Color</label>
                <input
                  type="color"
                  id="edit_color"
                  value={editingElement.color || '#3B82F6'}
                  onChange={(e) => setEditingElement({ ...editingElement, color: e.target.value })}
                  className="w-full h-12 border border-gray-300 rounded-xl cursor-pointer"
                />
              </div>
              <div>
                <label htmlFor="edit_format" className="block text-sm font-medium text-gray-700">Format</label>
                <select
                  id="edit_format"
                  value={editingElement.format || 'standard'}
                  onChange={(e) => setEditingElement({ ...editingElement, format: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="standard">Standard</option>
                  <option value="currency">Currency</option>
                  <option value="percentage">Percentage</option>
                  <option value="number">Number</option>
                  <option value="text">Text</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowEditElementModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Element
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* Template Detail Modal (Double-click functionality) - Completely Redesigned */}
      {showTemplateDetailModal && selectedTemplateForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
            
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-xl border border-white/30">
                    <FileText className="text-white text-3xl" />
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold mb-2">{selectedTemplateForDetail.template_name}</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-blue-100 font-semibold text-lg">Template Editor</span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                        {selectedTemplateForDetail.status}
                      </span>
                      <span className="text-blue-100">• {selectedTemplateForDetail.template_type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={closeTemplateDetailModal}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center border border-white/30"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Templates
                  </button>
                  <button 
                    onClick={closeTemplateDetailModal}
                    className="text-white hover:bg-white/20 p-3 rounded-xl transition-all duration-200"
                  >
                    <X className="h-7 w-7" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main Content - New Layout */}
            <div className="flex h-[calc(95vh-200px)]">
              
              {/* Left Sidebar - Template Info & Actions */}
              <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
                
                {/* Template Information */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                      <Info className="h-4 w-4 text-white" />
                    </div>
                    Template Info
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 text-sm">Type:</span>
                      <span className="font-semibold text-gray-900">{selectedTemplateForDetail.template_type}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 text-sm">Status:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedTemplateForDetail.status)}`}>
                          {selectedTemplateForDetail.status}
                        </span>
                        <button
                          onClick={() => {
                            const newStatus = selectedTemplateForDetail.status === 'Active' ? 'Paused' : 'Active'
                            const updatedTemplate = {...selectedTemplateForDetail, status: newStatus}
                            setSelectedTemplateForDetail(updatedTemplate)
                            // Update in templates list
                            setTemplates(prev => prev.map(t => 
                              t.id === selectedTemplateForDetail.id ? updatedTemplate : t
                            ))
                            // Save to backend
                            if (fstAPI.updateTemplate) {
                              fstAPI.updateTemplate(selectedTemplateForDetail.id, updatedTemplate)
                                .then(() => console.log('Template status updated'))
                                .catch(err => console.error('Error updating template status:', err))
                            }
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                            selectedTemplateForDetail.status === 'Active' 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {selectedTemplateForDetail.status === 'Active' ? 'Pause' : 'Activate'}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 text-sm">Elements:</span>
                      <span className="font-semibold text-gray-900">{getCurrentTemplateElements().length}</span>
                    </div>
                    {/* Debug info */}
                    <div className="text-xs text-gray-400 text-center p-1 bg-gray-100 rounded">
                      Debug: {getCurrentTemplateElements().length} elements loaded
                    </div>
                    

                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 text-sm">Version:</span>
                      <input
                        type="text"
                        value={selectedTemplateForDetail.version || ''}
                        onChange={(e) => {
                          const updatedTemplate = {...selectedTemplateForDetail, version: e.target.value}
                          setSelectedTemplateForDetail(updatedTemplate)
                          // Update in templates list
                          setTemplates(prev => prev.map(t => 
                            t.id === selectedTemplateForDetail.id ? updatedTemplate : t
                          ))
                        }}
                        className="font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  {selectedTemplateForDetail.description && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{selectedTemplateForDetail.description}</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-3">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    Quick Actions
                  </h4>
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        setQuickActionType('Line Item')
                        setShowAddElementModal(true)
                        setEditingElement({
                          ...editingElement,
                          element_type: 'Line Item',
                          color: '#3B82F6'
                        })
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Element
                    </button>
                    <button 
                      onClick={() => {
                        setQuickActionType('Formula')
                        setShowAddElementModal(true)
                        setEditingElement({
                          ...editingElement,
                          element_type: 'Formula',
                          color: '#10B981'
                        })
                      }}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Add Formula
                    </button>
                    <button 
                      onClick={() => {
                        setQuickActionType('Header')
                        setShowAddElementModal(true)
                        setEditingElement({
                          ...editingElement,
                          element_type: 'Header',
                          color: '#8B5CF6'
                        })
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Add Header
                    </button>

                    <button 
                      onClick={testFormulas}
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test Formulas
                    </button>
                    <button 
                      onClick={testView}
                      className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Test View
                    </button>
                    <button 
                      onClick={() => loadElementsForTemplate(currentTemplateId)}
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Elements
                    </button>
                    <button 
                      onClick={() => exportTemplateElementsToCSV(selectedTemplateForDetail)}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export to CSV
                    </button>

                  </div>
                </div>
              </div>
              
              {/* Right Content - Elements List */}
              <div className="flex-1 bg-white overflow-hidden">
                <div className="h-full flex flex-col">
                  
                  {/* Elements Header */}
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-2xl font-bold text-gray-900 flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3">
                          <Layers className="h-5 w-5 text-white" />
                        </div>
                        Template Elements
                        <span className="ml-2 text-lg text-gray-500 font-normal">({getCurrentTemplateElements().length})</span>
                        {/* Debug info */}
                        <span className="ml-2 text-xs text-gray-400">Debug: {JSON.stringify(getCurrentTemplateElements().length)}</span>
                      </h4>
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                          <Calculator className="h-4 w-4 inline mr-2" />
                          Sequential: 1, 2, 3...
                        </div>
                        <button 
                          onClick={() => loadElementsForTemplate(currentTemplateId)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center shadow-md hover:shadow-lg mr-2"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </button>
                        <button 
                          onClick={() => setShowAddElementModal(true)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-xl transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Element
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Elements List */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                      <div className="flex justify-center items-center py-16">
                        <div className="text-center">
                          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-lg text-gray-600">Loading elements...</p>
                        </div>
                      </div>
                    ) : getCurrentTemplateElements().length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Database className="h-10 w-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Elements Added Yet</h3>
                        <p className="text-gray-600 mb-4">Start building your template by adding elements and formulas.</p>
                        <button 
                          onClick={() => setShowAddElementModal(true)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center mx-auto shadow-md hover:shadow-lg"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Element
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getCurrentTemplateElements()
                          .filter(element => element && element.id && element.element_name) // Safety check
                          .map((element, index) => (
                          <div 
                            key={element.id} 
                            className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300"
                            style={{
                              borderLeftColor: element.color || '#3B82F6',
                              borderLeftWidth: '4px'
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  <span 
                                    className="text-white px-2 py-1 rounded-lg text-sm font-bold min-w-[32px] text-center"
                                    style={{ backgroundColor: element.color || '#3B82F6' }}
                                  >
                                    {element.position || element.element_number || index + 1}
                                  </span>
                                  <h5 className="text-lg font-bold text-gray-900">{element.element_name}</h5>
                                  <span 
                                    className="px-2 py-1 rounded-full text-xs font-bold text-white"
                                    style={{ backgroundColor: element.color || '#3B82F6' }}
                                  >
                                    {element.element_type}
                                  </span>
                                  {element.format && element.format !== 'standard' && (
                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                      {element.format}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                                  {element.account_code && (
                                    <div className="flex items-center text-gray-700 bg-blue-50 p-2 rounded-lg">
                                      <Tag className="h-4 w-4 mr-2 text-blue-600" />
                                      <span className="font-medium">Code:</span>
                                      <span className="ml-1 font-bold">{element.account_code}</span>
                                    </div>
                                  )}
                                  {element.formula && (
                                    <div className="flex items-center text-gray-700 bg-green-50 p-2 rounded-lg">
                                      <Calculator className="h-4 w-4 mr-2 text-green-600" />
                                      <span className="font-medium">Formula:</span>
                                      <span className="ml-1 font-mono bg-white px-2 py-1 rounded border text-xs">{element.formula}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center text-gray-700 bg-gray-50 p-2 rounded-lg">
                                    <Settings className="h-4 w-4 mr-2 text-gray-600" />
                                    <span className="font-medium">Position:</span>
                                    <span className="ml-1 font-bold">{element.position || element.element_number || index + 1}</span>
                                  </div>
                                </div>
                                
                                {element.description && (
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-700 text-sm">{element.description}</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col space-y-2 ml-4">
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => handleEditElement(element)}
                                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-all duration-200"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteElement(element)}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-all duration-200"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                
                                {/* Position Controls */}
                                <div className="flex space-x-1">
                                  <button 
                                    onClick={() => reorderElements(element.id, Math.max(1, (element.position || element.element_number || index + 1) - 1))}
                                    disabled={(element.position || element.element_number || index + 1) <= 1}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    ↑
                                  </button>
                                  <button 
                                    onClick={() => reorderElements(element.id, Math.min(getCurrentTemplateElements().length, (element.position || element.element_number || index + 1) + 1))}
                                    disabled={(element.position || element.element_number || index + 1) >= getCurrentTemplateElements().length}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    ↓
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test View Modal */}
      {showTestViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-2">Financial Statement Preview</h3>
                  <p className="text-blue-100 text-lg">Generated for Q1 2025 • {getCurrentTemplateElements().length} Elements</p>
                </div>
                <button onClick={() => setShowTestViewModal(false)} className="text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200">
                  <X className="h-8 w-8" />
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
              {/* Professional Financial Report Table */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                    <div className="col-span-2">Position</div>
                    <div className="col-span-3">Account Code/Header</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-3 text-right">Amount</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {getCurrentTemplateElements().map((element, index) => {
                    if (element.element_type === 'Header') {
                      return (
                        <div key={element.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-l-4 border-blue-500">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-2">
                              <span className="text-blue-600 font-semibold">#{element.position || element.element_number}</span>
                            </div>
                            <div className="col-span-3">
                              <span className="text-blue-800 font-bold text-lg">{element.element_name.toUpperCase()}</span>
                            </div>
                            <div className="col-span-4">
                              <span className="text-blue-600 text-sm">Section Header</span>
                            </div>
                            <div className="col-span-3 text-right">
                              <span className="text-blue-600 font-semibold">—</span>
                            </div>
                          </div>
                        </div>
                      )
                    } else if (element.element_type === 'Formula') {
                      return (
                        <div key={element.id} className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-l-4 border-green-500">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-2">
                              <span className="text-green-600 font-semibold">#{element.position || element.element_number}</span>
                            </div>
                            <div className="col-span-3">
                              <span className="text-green-700 font-medium">{element.account_code || 'Formula'}</span>
                            </div>
                            <div className="col-span-4">
                              <span className="text-green-800">{element.description || element.element_name}</span>
                              <div className="text-xs text-green-600 mt-1 font-mono bg-green-100 px-2 py-1 rounded">
                                Formula: {element.formula}
                              </div>
                            </div>
                            <div className="col-span-3 text-right">
                              <span className="text-green-700 font-bold text-lg">
                                {element.testValue ? 
                                  (element.format === 'currency' ? 
                                    `$${element.testValue.toLocaleString()}` : 
                                    element.testValue.toLocaleString()
                                  ) : 
                                  '$0.00'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    } else {
                      // Line Item
                      return (
                        <div key={element.id} className="hover:bg-gray-50 transition-colors duration-150 px-6 py-4">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-2">
                              <span className="text-gray-600 font-semibold">#{element.position || element.element_number}</span>
                            </div>
                            <div className="col-span-3">
                              <span className="text-gray-800 font-medium">{element.account_code || '—'}</span>
                            </div>
                            <div className="col-span-4">
                              <span className="text-gray-900">{element.description || element.element_name}</span>
                            </div>
                            <div className="col-span-3 text-right">
                              <span className="text-gray-700 font-bold text-lg">
                                {element.testValue ? 
                                  (element.format === 'currency' ? 
                                    `$${element.testValue.toLocaleString()}` : 
                                    element.testValue.toLocaleString()
                                  ) : 
                                  '$0.00'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
              
              {/* Summary Footer */}
              <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
                    <span className="mx-2">•</span>
                    <span className="font-semibold">{getCurrentTemplateElements().length} line items</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Ready for Export
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FSTItems