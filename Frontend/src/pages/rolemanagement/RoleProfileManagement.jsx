import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useCompany } from '../../contexts/CompanyContext'
import {
  Shield,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  UserCog,
  Lock,
  Unlock,
  Check,
  X,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  Eye,
  Activity,
  Database,
  BarChart3,
  Building,
  Calculator,
  List,
  Workflow,
  Save,
  RefreshCw,
  TrendingUp,
  Zap,
  FileText,
  Building2,
  BookOpen,
  ClipboardList,
  Layers,
  HardDrive,
  Receipt,
  Target,
  FileSpreadsheet,
  Sparkles,
  LinkIcon,
  DollarSign,
  Percent,
  Compass,
  Globe,
  Handshake,
  UserCheck,
  Monitor,
  Server,
  Download,
  HelpCircle,
  Cog,
  Lightbulb,
  ArrowUpDown,
  Wifi
} from 'lucide-react'
import AdminAuthWrapper from './components/AdminAuthWrapper'
import RoleManagementNavigation from './components/RoleManagementNavigation'

const RoleProfileManagement = () => {
  // ===== CONTEXT HOOKS =====
  const { selectedCompany: authSelectedCompany } = useAuth()
  const { selectedCompany: companyContextCompany } = useCompany()
  
  // Use the company from auth context as primary, fallback to company context
  const selectedCompany = authSelectedCompany || companyContextCompany
  const parseJsonField = (value, fallback = {}) => {
    if (value === null || value === undefined) {
      return fallback
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return parsed ?? fallback
      } catch (error) {
        return fallback
      }
    }
    if (typeof value === 'object') {
      return value
    }
    return fallback
  }

  const normalizePagePermissions = (value) => {
    const raw = parseJsonField(value, {})
    if (Array.isArray(raw)) {
      return raw.reduce((acc, route) => {
        if (typeof route === 'string') {
          acc[route] = true
        }
        return acc
      }, {})
    }
    if (raw && typeof raw === 'object') {
      return Object.keys(raw).reduce((acc, key) => {
        const permissionValue = raw[key]
        if (typeof permissionValue === 'boolean') {
          acc[key] = permissionValue
        } else if (typeof permissionValue === 'string') {
          acc[key] = ['true', '1', 'yes', 'access', 'allowed', 'full_access'].includes(permissionValue.toLowerCase())
        } else if (permissionValue && typeof permissionValue === 'object') {
          acc[key] = Object.values(permissionValue).some(Boolean)
        } else {
          acc[key] = Boolean(permissionValue)
        }
        return acc
      }, {})
    }
    return {}
  }

  const normalizeDatabasePermissions = (value) => {
    const raw = parseJsonField(value, {})
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {}
    }

    const normalised = {}

    Object.entries(raw).forEach(([database, permissions]) => {
      const basePermissions = { read: false, write: false, execute: false }

      if (permissions && typeof permissions === 'object' && !Array.isArray(permissions)) {
        Object.keys(basePermissions).forEach((key) => {
          const rawValue = permissions[key]
          if (typeof rawValue === 'boolean') {
            basePermissions[key] = rawValue
          } else if (typeof rawValue === 'string') {
            basePermissions[key] = ['true', '1', 'yes', 'allow', 'allowed'].includes(rawValue.toLowerCase())
          }
        })

        if (Array.isArray(permissions.permissions)) {
          permissions.permissions.forEach((permission) => {
            const normalisedPermission = String(permission).toLowerCase()
            if (normalisedPermission === 'full_access') {
              basePermissions.read = basePermissions.write = basePermissions.execute = true
            } else if (Object.prototype.hasOwnProperty.call(basePermissions, normalisedPermission)) {
              basePermissions[normalisedPermission] = true
            }
          })
        }
      } else if (Array.isArray(permissions)) {
        const lowered = permissions.map((permission) => String(permission).toLowerCase())
        if (lowered.includes('full_access')) {
          basePermissions.read = basePermissions.write = basePermissions.execute = true
        } else {
          Object.keys(basePermissions).forEach((key) => {
            if (lowered.includes(key)) {
              basePermissions[key] = true
            }
          })
        }
      } else if (typeof permissions === 'string') {
        const lowered = permissions.toLowerCase()
        if (lowered === 'full_access') {
          basePermissions.read = basePermissions.write = basePermissions.execute = true
        } else if (Object.prototype.hasOwnProperty.call(basePermissions, lowered)) {
          basePermissions[lowered] = true
        }
      } else if (typeof permissions === 'boolean') {
        basePermissions.read = permissions
      }

      normalised[database] = basePermissions
    })

    return normalised
  }

  const sanitizeRolePayload = (role) => {
    if (!role) {
      return role
    }

    return {
      ...role,
      page_permissions: normalizePagePermissions(role.page_permissions),
      database_permissions: normalizeDatabasePermissions(role.database_permissions)
    }
  }
  
  // ===== STATE MANAGEMENT =====
  const [roles, setRoles] = useState([])
  const [databases, setDatabases] = useState([])
  const [databaseTables, setDatabaseTables] = useState({})
  const [newRole, setNewRole] = useState({ 
    name: '', 
    description: '', 
    page_permissions: {},
    database_permissions: {}
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRoleDetails, setShowRoleDetails] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [isEditingRole, setIsEditingRole] = useState(false)
  const [editRoleData, setEditRoleData] = useState({
    name: '',
    description: '',
    page_permissions: {},
    database_permissions: {}
  })
  const [updatingRole, setUpdatingRole] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [lastActions, setLastActions] = useState([])
  const [risks, setRisks] = useState([])
  const [currentStep, setCurrentStep] = useState(1) // For multi-step role creation
  const [selectedDatabase, setSelectedDatabase] = useState(null)
  const [loadingTables, setLoadingTables] = useState(false)

  const availableDatabasesForEditing = useMemo(() => {
    const names = new Set()
    databases.forEach((database) => {
      if (typeof database === 'string') {
        names.add(database)
      } else if (database && typeof database === 'object' && database.name) {
        names.add(database.name)
      }
    })
    Object.keys(editRoleData.database_permissions || {}).forEach((database) => {
      if (database) {
        names.add(database)
      }
    })
    return Array.from(names)
  }, [databases, editRoleData.database_permissions])

  const selectedRoleDatabasePermissions = useMemo(
    () => normalizeDatabasePermissions(selectedRole?.database_permissions),
    [selectedRole]
  )

  // All available pages from Layout.jsx
  const allPages = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, category: 'Core' },
    { name: 'Entity Management', href: '/entity', icon: Building2, category: 'Core' },
    { name: 'Account Management', href: '/accounts', icon: BookOpen, category: 'Core' },
    { name: 'Process Module', href: '/process', icon: Workflow, category: 'Core' },
    { name: 'Trial Balance', href: '/trial-balance', icon: BarChart3, category: 'Financial' },
    { name: 'Journal Entries', href: '/journal-entries', icon: ClipboardList, category: 'Financial' },
    { name: 'FST Items', href: '/fst-items', icon: Layers, category: 'Financial' },
    { name: 'Asset Register', href: '/asset-register', icon: HardDrive, category: 'Financial' },
    { name: 'Bills', href: '/bills', icon: Receipt, category: 'Financial' },
    { name: 'Bank Reconciliation', href: '/bank-reconciliation', icon: Calculator, category: 'Financial' },
    { name: 'Supplier Reconciliation', href: '/supplier-reconciliation', icon: Target, category: 'Financial' },
    { name: 'Purchase Orders', href: '/integrations/purchase-order-management', icon: FileSpreadsheet, category: 'Financial' },
    { name: 'Financial Statements', href: '/financial-statements', icon: TrendingUp, category: 'Reporting' },
    { name: 'Custom Reports', href: '/reports', icon: FileText, category: 'Reporting' },
    { name: 'Advanced Features', href: '/advanced-features', icon: Sparkles, category: 'Advanced' },
    { name: 'Consolidation', href: '/consolidation', icon: LinkIcon, category: 'Advanced' },
    { name: 'IFRS Templates', href: '/ifrs-templates', icon: FileText, category: 'Compliance' },
    { name: 'ETL Pipeline', href: '/etl', icon: Database, category: 'Data' },
    { name: 'Forecast & Budget', href: '/forecast-budget', icon: Calendar, category: 'Planning' },
    { name: 'Variance Analysis', href: '/variance-analysis', icon: ArrowUpDown, category: 'Analysis' },
    { name: 'Cash Flow Analysis', href: '/cash-flow', icon: DollarSign, category: 'Analysis' },
    { name: 'Financial Ratios', href: '/financial-ratios', icon: Percent, category: 'Analysis' },
    { name: 'Narrative Reporting', href: '/narrative-reporting', icon: FileText, category: 'Reporting' },
    { name: 'What-If Analysis', href: '/what-if-analysis', icon: Compass, category: 'Analysis' },
    { name: 'Real-Time Analytics', href: '/real-time-analytics', icon: Zap, category: 'Analytics' },
    { name: 'Regulatory Reporting', href: '/regulatory-reporting', icon: FileText, category: 'Compliance' },
    { name: 'Global Compliance', href: '/global-compliance', icon: Shield, category: 'Compliance' },
    { name: 'ESG', href: '/integrations/esg', icon: Globe, category: 'Compliance' },
    { name: 'Audit', href: '/audit', icon: FileSpreadsheet, category: 'Compliance' },
    { name: 'Audit Trail', href: '/audit-trail', icon: Activity, category: 'Compliance' },
    { name: 'Internal Controls', href: '/internal-controls', icon: Shield, category: 'Compliance' },
    { name: 'Compliance Management', href: '/integrations/compliance-management', icon: CheckCircle, category: 'Compliance' },
    { name: 'Forex Rate Management', href: '/forex-rates', icon: Globe, category: 'Financial' },
    { name: 'Axes', href: '/axes', icon: BarChart3, category: 'Configuration' },
    { name: 'Custom Axes', href: '/custom-axes', icon: BarChart3, category: 'Configuration' },
    { name: 'Workflows', href: '/workflows', icon: Activity, category: 'Process' },
    { name: 'Stakeholder Management', href: '/integrations/stakeholder-management', icon: Handshake, category: 'CRM' },
    { name: 'CRM', href: '/integrations/crm', icon: UserCheck, category: 'CRM' },
    { name: 'Project Management', href: '/integrations/project-management', icon: Layers, category: 'Management' },
    { name: 'Revenue Analytics', href: '/integrations/revenue-analytics', icon: TrendingUp, category: 'Analytics' },
    { name: 'Role Management', href: '/rolemanagement', icon: Shield, category: 'Administration' },
    { name: 'System Monitoring', href: '/system-monitoring', icon: Monitor, category: 'Administration' },
    { name: 'System Management', href: '/system-management', icon: Settings, category: 'Administration' },
    { name: 'Database Management', href: '/database-management', icon: Database, category: 'Administration' },
    { name: 'Backup & Restore', href: '/backup-restore', icon: HardDrive, category: 'Administration' },
    { name: 'Data Import/Export', href: '/data-import-export', icon: Download, category: 'Administration' },
    { name: 'API Management', href: '/api-management', icon: Server, category: 'Administration' },
    { name: 'Third Party Integrations', href: '/third-party-integration', icon: Globe, category: 'Integration' },
    { name: 'Integration Summary', href: '/integration-summary', icon: BarChart3, category: 'Integration' },
    { name: 'Integration Hub', href: '/integration-hub', icon: LinkIcon, category: 'Integration' },
    { name: 'Documentation', href: '/documentation', icon: BookOpen, category: 'Support' },
    { name: 'Training Materials', href: '/training', icon: FileText, category: 'Support' },
    { name: 'Support Center', href: '/support', icon: HelpCircle, category: 'Support' },
    { name: 'System Settings', href: '/settings', icon: Cog, category: 'Administration' },
    { name: 'Audit Materiality', href: '/audit-materiality', icon: Eye, category: 'Compliance' },
    { name: 'Tax Management', href: '/tax-management', icon: Calculator, category: 'Financial' },
    { name: 'Asset Management', href: '/integrations/asset-management', icon: Building2, category: 'Management' },
    { name: 'Business Valuation & Impairment', href: '/business-valuation', icon: Calculator, category: 'Analysis' },
    { name: 'SQL Query Console', href: '/sql-query-console', icon: Database, category: 'Administration' },
    { name: 'Business Tools', href: '/business-tools', icon: Lightbulb, category: 'Tools' },
    { name: 'Quantum Finance', href: '/quantum-finance', icon: Zap, category: 'Advanced' }
  ]

  // Group pages by category
  const pagesByCategory = allPages.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = []
    acc[page.category].push(page)
    return acc
  }, {})

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ===== DATA FETCHING =====
  const fetchRoles = async () => {
    if (!selectedCompany) return
    
    try {
      const response = await fetch(`/api/role-management/roles?company_name=${encodeURIComponent(selectedCompany)}&search=${searchTerm}&status_filter=${filterStatus}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const parsedRoles = Array.isArray(data.roles) ? data.roles : []
        setRoles(parsedRoles.map((role) => sanitizeRolePayload(role)))
      } else {
        showToast('Failed to fetch roles', 'error')
        setRoles([])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      showToast('Error fetching roles', 'error')
      setRoles([])
    }
  }

  const fetchDatabases = async () => {
    if (!selectedCompany) return
    
    try {
      const response = await fetch(`/api/role-management/databases?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDatabases(Array.isArray(data.databases) ? data.databases : [])
      } else {
        setDatabases([])
      }
    } catch (error) {
      console.error('Error fetching databases:', error)
      setDatabases([])
    }
  }

  const fetchDatabaseTables = async (databaseName) => {
    if (!selectedCompany || !databaseName) return
    
    setLoadingTables(true)
    try {
      const response = await fetch(`/api/role-management/database-tables/${encodeURIComponent(databaseName)}?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const tables = Array.isArray(data.tables) ? data.tables : []
        
        setDatabaseTables(prev => ({
          ...prev,
          [databaseName]: tables
        }))
        
        // Auto-set full access for all tables
        if (tables.length > 0) {
          setFullAccessForAllTables(databaseName, tables)
        }
      } else {
        console.error('Failed to fetch tables:', response.status)
        setDatabaseTables(prev => ({
          ...prev,
          [databaseName]: []
        }))
      }
    } catch (error) {
      console.error('Error fetching database tables:', error)
      setDatabaseTables(prev => ({
        ...prev,
        [databaseName]: []
      }))
    } finally {
      setLoadingTables(false)
    }
  }

  const fetchRoleDetails = async (roleId) => {
    try {
      const response = await fetch(`/api/role-management/roles/${roleId}?company_name=${encodeURIComponent(selectedCompany)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const sanitizedRole = sanitizeRolePayload(data.role)
        setSelectedRole(sanitizedRole)
        setEditRoleData({
          name: sanitizedRole?.name || '',
          description: sanitizedRole?.description || '',
          page_permissions: sanitizedRole?.page_permissions || {},
          database_permissions: sanitizedRole?.database_permissions || {}
        })
        setIsEditingRole(false)
        setLastActions(data.audit_logs || [])
        setShowRoleDetails(true)
      } else {
        showToast('Failed to fetch role details', 'error')
      }
    } catch (error) {
      console.error('Error fetching role details:', error)
      showToast('Error fetching role details', 'error')
    }
  }

  // ===== ROLE MANAGEMENT =====
  const resetEditRoleData = () => {
    if (!selectedRole) return
    setEditRoleData({
      name: selectedRole.name || '',
      description: selectedRole.description || '',
      page_permissions: normalizePagePermissions(selectedRole.page_permissions),
      database_permissions: normalizeDatabasePermissions(selectedRole.database_permissions)
    })
  }

  const startRoleEdit = () => {
    if (!selectedRole) return
    resetEditRoleData()
    setIsEditingRole(true)
  }

  const toggleEditPagePermission = (pageHref) => {
    setEditRoleData((prev) => ({
      ...prev,
      page_permissions: {
        ...prev.page_permissions,
        [pageHref]: !prev.page_permissions?.[pageHref]
      }
    }))
  }

  const toggleEditDatabasePermission = (databaseName, permission) => {
    setEditRoleData((prev) => {
      const currentPermissions = {
        read: false,
        write: false,
        execute: false,
        ...(prev.database_permissions?.[databaseName] || {})
      }

      const updatedPermissions = {
        ...currentPermissions,
        [permission]: !currentPermissions[permission]
      }

      return {
        ...prev,
        database_permissions: {
          ...prev.database_permissions,
          [databaseName]: updatedPermissions
        }
      }
    })
  }

  const handleUpdateRole = async () => {
    if (!selectedRole || !selectedRole.id || !selectedCompany) {
      return
    }

    if (!editRoleData.name.trim()) {
      showToast('Role name is required', 'error')
      return
    }

    if (!editRoleData.description.trim()) {
      showToast('Role description is required', 'error')
      return
    }

    setUpdatingRole(true)
    try {
      const response = await fetch(`/api/role-management/roles/${selectedRole.id}?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editRoleData.name,
          description: editRoleData.description,
          page_permissions: editRoleData.page_permissions,
          database_permissions: editRoleData.database_permissions,
          company: selectedCompany
        })
      })

      if (response.ok) {
        const data = await response.json()
        const updatedRole = sanitizeRolePayload(data.role)
        setSelectedRole(updatedRole)
        setRoles((prev) => prev.map((role) => (role.id === updatedRole.id ? updatedRole : role)))
        setEditRoleData({
          name: updatedRole?.name || '',
          description: updatedRole?.description || '',
          page_permissions: updatedRole?.page_permissions || {},
          database_permissions: updatedRole?.database_permissions || {}
        })
        setIsEditingRole(false)
        showToast('Role updated successfully', 'success')
        fetchRoles()
      } else {
        const error = await response.json().catch(() => ({}))
        showToast(error.detail || 'Failed to update role', 'error')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      showToast('Error updating role', 'error')
    } finally {
      setUpdatingRole(false)
    }
  }

  const handleCancelRoleEdit = () => {
    resetEditRoleData()
    setIsEditingRole(false)
  }

  const handleCreateRole = async () => {
    if (!selectedCompany) {
      showToast('No company selected', 'error')
      return
    }

    if (!newRole.name.trim()) {
      showToast('Role name is required', 'error')
      return
    }

    if (!newRole.description.trim()) {
      showToast('Role description is required', 'error')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/role-management/roles?company_name=${encodeURIComponent(selectedCompany)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newRole.name,
          description: newRole.description,
          page_permissions: newRole.page_permissions,
          database_permissions: newRole.database_permissions,
          company: selectedCompany
        })
      })

      if (response.ok) {
        showToast('Role created successfully', 'success')
        setShowCreateModal(false)
        setNewRole({ name: '', description: '', page_permissions: {}, database_permissions: {} })
        setCurrentStep(1)
        setSelectedDatabase(null)
        fetchRoles()
      } else {
        const error = await response.json().catch(() => ({ detail: 'Failed to create role' }))
        showToast(error.detail || 'Failed to create role', 'error')
      }
    } catch (error) {
      console.error('Failed to create role:', error)
      showToast('Failed to create role: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePagePermissionToggle = (pageHref) => {
    setNewRole(prev => {
      const newPagePermissions = { ...prev.page_permissions }
      newPagePermissions[pageHref] = !newPagePermissions[pageHref]
      return { ...prev, page_permissions: newPagePermissions }
    })
  }

  const handleCategoryToggle = (category, enable) => {
    setNewRole(prev => {
      const newPagePermissions = { ...prev.page_permissions }
      const categoryPages = pagesByCategory[category] || []
      
      categoryPages.forEach(page => {
        newPagePermissions[page.href] = enable
      })
      
      return { ...prev, page_permissions: newPagePermissions }
    })
  }

  const handleDatabasePermissionToggle = (database, permission) => {
    setNewRole(prev => {
      const newDbPermissions = { ...prev.database_permissions }
      if (!newDbPermissions[database]) {
        newDbPermissions[database] = {}
      }
      
      newDbPermissions[database][permission] = !newDbPermissions[database][permission]
      
      return { ...prev, database_permissions: newDbPermissions }
    })
  }

  const handleTablePermissionToggle = (database, table, permission) => {
    setNewRole(prev => {
      const newDbPermissions = { ...prev.database_permissions }
      if (!newDbPermissions[database]) {
        newDbPermissions[database] = {}
      }
      if (!newDbPermissions[database].tables) {
        newDbPermissions[database].tables = {}
      }
      if (!newDbPermissions[database].tables[table]) {
        newDbPermissions[database].tables[table] = {}
      }
      
      newDbPermissions[database].tables[table][permission] = !newDbPermissions[database].tables[table][permission]
      
      return { ...prev, database_permissions: newDbPermissions }
    })
  }

  const handleSelectAllPages = () => {
    setNewRole(prev => {
      const newPagePermissions = {}
      allPages.forEach(page => {
        newPagePermissions[page.href] = true
      })
      return { ...prev, page_permissions: newPagePermissions }
    })
  }

  const handleDeselectAllPages = () => {
    setNewRole(prev => ({
      ...prev,
      page_permissions: {}
    }))
  }

  const handleDatabaseSelect = (database) => {
    setSelectedDatabase(database)
    
    // Always fetch tables when database is selected
    fetchDatabaseTables(database)
    
    // Set default full access for database
    setNewRole(prev => {
      const newDbPermissions = { ...prev.database_permissions }
      if (!newDbPermissions[database]) {
        newDbPermissions[database] = {
          read: true,
          write: true,
          execute: true,
          tables: {}
        }
      }
      return { ...prev, database_permissions: newDbPermissions }
    })
  }

  // Auto-set full access for tables when they are loaded
  const setFullAccessForAllTables = (database, tables) => {
    setNewRole(prev => {
      const newDbPermissions = { ...prev.database_permissions }
      if (!newDbPermissions[database]) {
        newDbPermissions[database] = {
          read: true,
          write: true,
          execute: true,
          tables: {}
        }
      }
      
      // Set full access for all tables
      tables.forEach(table => {
        if (!newDbPermissions[database].tables) {
          newDbPermissions[database].tables = {}
        }
        newDbPermissions[database].tables[table] = {
          read: true,
          write: true,
          full_access: true
        }
      })
      
      return { ...prev, database_permissions: newDbPermissions }
    })
  }

  // ===== EFFECTS =====
  useEffect(() => {
    if (selectedCompany) {
      setLoading(true)
      Promise.all([fetchRoles(), fetchDatabases()]).finally(() => {
        setLoading(false)
      })
    }
  }, [selectedCompany, searchTerm, filterStatus])

  // ===== UTILITY FUNCTIONS =====
  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-green-600 bg-green-100'
    }
  }

  const getPermissionCount = (permissions) => {
    if (!permissions || typeof permissions !== 'object') return 0
    return Object.keys(permissions).filter(key => permissions[key]).length
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Core': Building2,
      'Financial': Calculator,
      'Reporting': FileText,
      'Advanced': Sparkles,
      'Compliance': Shield,
      'Data': Database,
      'Planning': Calendar,
      'Analysis': BarChart3,
      'Analytics': Zap,
      'Process': Workflow,
      'CRM': UserCheck,
      'Management': Layers,
      'Administration': Settings,
      'Integration': Globe,
      'Support': HelpCircle,
      'Tools': Lightbulb,
      'Configuration': Cog
    }
    return icons[category] || Settings
  }

  // ===== FILTERED DATA =====
  const filteredRoles = Array.isArray(roles) ? roles.filter(role => {
    if (!role || typeof role !== 'object') return false
    
    const matchesSearch = (role.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (role.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && role.is_active) ||
                         (filterStatus === 'inactive' && !role.is_active) ||
                         (filterStatus === 'system' && role.is_system_role) ||
                         (filterStatus === 'custom' && !role.is_system_role)
    
    return matchesSearch && matchesFilter
  }) : []

  // Early return if no company selected
  if (!selectedCompany) {
    return (
      <AdminAuthWrapper>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Company Selected</h2>
            <p className="text-gray-600 dark:text-gray-300">Please select a company to access role management.</p>
          </div>
        </div>
      </AdminAuthWrapper>
    )
  }

  if (loading) {
    return (
      <AdminAuthWrapper>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <RoleManagementNavigation />
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-lg">Loading roles...</span>
              </div>
            </div>
          </main>
        </div>
      </AdminAuthWrapper>
    )
  }


  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
        <main className="p-6 space-y-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Navigation */}
            <RoleManagementNavigation />
            
            {/* Page Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Role Profile Management
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Create and manage user roles with granular permissions for {selectedCompany}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create New Role</span>
                </button>
              </div>

              {/* Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="system">System Roles</option>
                    <option value="custom">Custom Roles</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchRoles()}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Roles</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{roles.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Roles</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {roles.filter(r => r.is_active).length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Custom Roles</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {roles.filter(r => !r.is_system_role).length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <UserCog className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">High Risk</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {roles.filter(r => r.risk_level === 'high').length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200 cursor-pointer"
                  onClick={() => fetchRoleDetails(role.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${role.is_system_role ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-purple-100 dark:bg-purple-900/20'}`}>
                        <Shield className={`h-5 w-5 ${role.is_system_role ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(role.risk_level)}`}>
                            {role.risk_level?.toUpperCase() || 'LOW'}
                          </span>
                          {role.is_system_role && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              SYSTEM
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          fetchRoleDetails(role.id)
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!role.is_system_role && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle edit
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{role.description}</p>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Permissions</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        {getPermissionCount(role.permissions)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(role.permissions || {}).slice(0, 3).map(([module, perms]) => (
                        <div key={module} className="text-xs text-gray-500 dark:text-gray-400">
                          • {module}: {Array.isArray(perms) ? perms.length : 0} permissions
                        </div>
                      ))}
                      {Object.keys(role.permissions || {}).length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{Object.keys(role.permissions || {}).length - 3} more modules
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{role.user_count || 0} users</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(role.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Create Role Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Role</h2>
                      <button
                        onClick={() => {
                          setShowCreateModal(false)
                          setCurrentStep(1)
                          setNewRole({ name: '', description: '', page_permissions: {}, database_permissions: {} })
                          setSelectedDatabase(null)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    {/* Step Indicator */}
                    <div className="flex items-center space-x-4 mt-4">
                      <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                        <span>Basic Info</span>
                      </div>
                      <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                      <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                        <span>Permissions</span>
                      </div>
                      <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                      <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
                        <span>Database Access</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Role Name *
                          </label>
                          <input
                            type="text"
                            value={newRole.name}
                            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter role name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description *
                          </label>
                          <textarea
                            value={newRole.description}
                            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Describe the role and its responsibilities"
                          />
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Page Access Permissions</h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSelectAllPages}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Select All
                            </button>
                            <button
                              onClick={handleDeselectAllPages}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {Object.entries(pagesByCategory).map(([category, pages]) => {
                            const CategoryIcon = getCategoryIcon(category)
                            const categoryEnabled = pages.every(page => newRole.page_permissions[page.href])
                            const categoryPartial = pages.some(page => newRole.page_permissions[page.href]) && !categoryEnabled
                            
                            return (
                              <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <CategoryIcon className="h-5 w-5 text-blue-600" />
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{category}</h4>
                                    <span className="text-sm text-gray-500">({pages.length} pages)</span>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleCategoryToggle(category, true)}
                                      className={`px-2 py-1 text-xs rounded ${categoryEnabled ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-100'}`}
                                    >
                                      All
                                    </button>
                                    <button
                                      onClick={() => handleCategoryToggle(category, false)}
                                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-red-100"
                                    >
                                      None
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {pages.map((page) => {
                                    const PageIcon = page.icon
                                    return (
                                      <label key={page.href} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={newRole.page_permissions[page.href] || false}
                                          onChange={() => handlePagePermissionToggle(page.href)}
                                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <PageIcon className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm text-gray-900 dark:text-white">{page.name}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Access Permissions</h3>
                        
                        <div className="grid grid-cols-1 gap-6">
                          {databases.map((database) => (
                            <div key={database} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <Database className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{database}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Database Server</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDatabaseSelect(database)}
                                  className={`px-3 py-1 text-sm rounded ${
                                    selectedDatabase === database 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
                                  }`}
                                >
                                  {selectedDatabase === database ? 'Selected' : 'Select'}
                                </button>
                              </div>
                              
                              {/* Database Level Permissions */}
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Database Level Access</h5>
                                <div className="flex flex-wrap gap-3">
                                  {['read', 'write', 'execute'].map((permission) => (
                                    <label key={permission} className="flex items-center space-x-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={newRole.database_permissions[database]?.[permission] || false}
                                        onChange={() => handleDatabasePermissionToggle(database, permission)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-900 dark:text-white capitalize">{permission}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Table Level Permissions */}
                              {selectedDatabase === database && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Table Level Access</h5>
                                    {loadingTables && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
                                  </div>
                                  
                                  {databaseTables[database] && databaseTables[database].length > 0 ? (
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                      {databaseTables[database].map((table) => (
                                        <div key={table} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{table}</span>
                                            <button
                                              onClick={() => {
                                                // Set full access for this table
                                                setNewRole(prev => {
                                                  const newDbPermissions = { ...prev.database_permissions }
                                                  if (!newDbPermissions[database].tables) {
                                                    newDbPermissions[database].tables = {}
                                                  }
                                                  newDbPermissions[database].tables[table] = {
                                                    read: true,
                                                    write: true,
                                                    full_access: true
                                                  }
                                                  return { ...prev, database_permissions: newDbPermissions }
                                                })
                                              }}
                                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                              Full Access
                                            </button>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {['read', 'write', 'full_access'].map((permission) => (
                                              <label key={permission} className="flex items-center space-x-1 cursor-pointer">
                                                <input
                                                  type="checkbox"
                                                  checked={newRole.database_permissions[database]?.tables?.[table]?.[permission] || false}
                                                  onChange={() => handleTablePermissionToggle(database, table, permission)}
                                                  className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">
                                                  {permission.replace('_', ' ')}
                                                </span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : selectedDatabase === database && !loadingTables ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No tables found or unable to load tables</p>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {databases.length === 0 && (
                          <div className="text-center py-8">
                            <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No databases available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <button
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                      disabled={currentStep === 1}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex space-x-3">
                      {currentStep < 3 ? (
                        <button
                          onClick={() => setCurrentStep(currentStep + 1)}
                          disabled={currentStep === 1 && (!newRole.name.trim() || !newRole.description.trim())}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          onClick={handleCreateRole}
                          disabled={saving}
                          className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          <span>{saving ? 'Creating...' : 'Create Role'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Role Details Modal */}
            {showRoleDetails && selectedRole && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${selectedRole.is_system_role ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-purple-100 dark:bg-purple-900/20'}`}>
                          <Shield className={`h-6 w-6 ${selectedRole.is_system_role ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`} />
                        </div>
                        <div className="space-y-2">
                          {isEditingRole ? (
                            <input
                              value={editRoleData.name}
                              onChange={(e) => setEditRoleData((prev) => ({ ...prev, name: e.target.value }))}
                              className="w-full text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 pb-1"
                              placeholder="Role name"
                            />
                          ) : (
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRole.name}</h2>
                          )}
                          <div className="flex items-center flex-wrap gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(selectedRole.risk_level)}`}>
                              {selectedRole.risk_level?.toUpperCase() || 'LOW'} RISK
                            </span>
                            {selectedRole.is_system_role && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                SYSTEM ROLE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditingRole ? (
                          <>
                            <button
                              onClick={handleUpdateRole}
                              disabled={updatingRole}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {updatingRole ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              onClick={handleCancelRoleEdit}
                              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={startRoleEdit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Edit Role
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowRoleDetails(false)
                            setIsEditingRole(false)
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                      {isEditingRole ? (
                        <textarea
                          value={editRoleData.description}
                          onChange={(e) => setEditRoleData((prev) => ({ ...prev, description: e.target.value }))}
                          className="w-full min-h-[120px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Provide a description for this role"
                        />
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300">{selectedRole.description || 'No description provided.'}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-gray-900 dark:text-white">Assigned Users</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{selectedRole.user_count || 0}</p>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-gray-900 dark:text-white">Created</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(selectedRole.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-gray-900 dark:text-white">Last Modified</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {selectedRole.updated_at ? new Date(selectedRole.updated_at).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permissions</h3>
                      {isEditingRole ? (
                        <div className="space-y-4">
                          {Object.keys(pagesByCategory).length === 0 && (
                            <p className="text-gray-500 dark:text-gray-400">No pages available.</p>
                          )}
                          {Object.entries(pagesByCategory).map(([category, pages]) => (
                            <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-3">{category}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {pages.map((page) => (
                                  <label
                                    key={page.href}
                                    className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!!editRoleData.page_permissions[page.href]}
                                      onChange={() => toggleEditPagePermission(page.href)}
                                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span>{page.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(selectedRole.permissions || {}).map(([module, permissions]) => (
                            <div key={module} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2 capitalize">
                                {module.replace('_', ' ')}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(permissions) && permissions.map((permission) => (
                                  <span
                                    key={permission}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                  >
                                    {permission}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                          {(!selectedRole.permissions || Object.keys(selectedRole.permissions).length === 0) && (
                            <p className="text-gray-500 dark:text-gray-400 col-span-full">No page permissions assigned.</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Access</h3>
                      {isEditingRole ? (
                        <div className="space-y-4">
                          {availableDatabasesForEditing.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">No databases available.</p>
                          ) : (
                            availableDatabasesForEditing.map((database) => {
                              const permissions = editRoleData.database_permissions?.[database] || { read: false, write: false, execute: false }
                              return (
                                <div key={database} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900 dark:text-white">{database}</span>
                                    <div className="flex items-center gap-4">
                                      {['read', 'write', 'execute'].map((permission) => (
                                        <label
                                          key={`${database}-${permission}`}
                                          className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={!!permissions[permission]}
                                            onChange={() => toggleEditDatabasePermission(database, permission)}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                          />
                                          <span className="capitalize">{permission}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {Object.keys(selectedRoleDatabasePermissions || {}).length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">No database permissions assigned.</p>
                          ) : (
                            Object.entries(selectedRoleDatabasePermissions).map(([database, permissions]) => {
                              const activePermissions = Object.entries(permissions || {}).filter(([, allowed]) => allowed)
                              return (
                                <div key={database} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
                                  <span className="font-medium text-gray-900 dark:text-white">{database}</span>
                                  <div className="flex flex-wrap gap-2">
                                    {activePermissions.length > 0 ? (
                                      activePermissions.map(([permission]) => (
                                        <span
                                          key={`${database}-${permission}`}
                                          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full capitalize"
                                        >
                                          {permission}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">No access</span>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {lastActions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                          {lastActions.slice(0, 5).map((action, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex-shrink-0">
                                <Activity className="h-5 w-5 text-gray-500" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{action.action}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {action.username} • {new Date(action.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AdminAuthWrapper>
  )
}

export default RoleProfileManagement
