import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Spreadsheet, Worksheet } from '@jspreadsheet-ce/react'
import { useForm } from 'react-hook-form'
import { ChromePicker } from 'react-color'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import 'jspreadsheet-ce/dist/jspreadsheet.css'
import 'jsuites/dist/jsuites.css'

import { 
  ArrowLeft, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Eye, 
  Settings,
  FileText,
  BarChart3,
  Calculator,
  Filter,
  Download,
  Upload,
  Grid,
  Layout,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
  Move,
  Copy,
  RotateCcw,
  RotateCw,
  Lock,
  Unlock,
  Eye as EyeIcon,
  EyeOff,
  Zap,
  Link,
  Image,
  Table,
  Columns,
  Rows,
  Calculator as FunctionIcon,
  DollarSign,
  Percent,
  Calendar,
  User,
  Tag,
  Bookmark,
  MessageSquare,
  Paperclip,
  Search,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  Database,
  Globe,
  RefreshCw,
  Building2,
  TrendingUp,
  PieChart,
  Activity,
  Target,
  Award,
  Star,
  Heart,
  Zap as Lightning,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Edit,
  ChevronLeft,
  Layers,
  Circle,
  Play,
  AlertTriangle
} from 'lucide-react'

const AdvancedJspreadsheetReportDesigner = ({ report, onSave, onCancel }) => {
  const spreadsheetRef = useRef(null)
  
  // ===== CORE STATE MANAGEMENT =====
  // Report Configuration State
  const [reportConfig, setReportConfig] = useState({
    id: report?.id || null,
    name: report?.name || '',
    description: report?.description || '',
    reportType: 'consolidation', // consolidation, variance, cash_flow, etc.
    category: 'financial',
    isPublic: false,
    version: 1,
    lastModified: new Date().toISOString(),
    createdBy: 'current_user', // This would come from auth context
    companyId: 'current_company' // This would come from auth context
  })

  // Hierarchy and Metadata State - Updated structure
  const [hierarchyData, setHierarchyData] = useState({
    entityHierarchies: [],
    accountHierarchies: [],
    unassignedEntities: [],
    unassignedAccounts: [],
    dimensions: []
  })

  // Node expansion state for tree structure
  const [expandedNodes, setExpandedNodes] = useState({})
  const [hierarchyStructures, setHierarchyStructures] = useState({})

  // Spreadsheet State - Clean initialization
  const [spreadsheetData, setSpreadsheetData] = useState({
    sheets: [{
      id: 'sheet1',
      name: 'Consolidation Report',
      data: [], // Start with empty data
      columns: [
        { type: 'text', title: 'Account Code', width: 120 },
        { type: 'text', title: 'Account Name', width: 200 },
        { type: 'numeric', title: 'Amount', width: 150, mask: '$ #,##0' }
      ],
      rows: [],
      formulas: {},
      styles: {},
      comments: {},
      metadata: {
        rowMapping: {}, // Maps row index to account/entity ID
        columnMapping: {}, // Maps column index to period/entity ID
        cellMapping: {} // Maps cell to specific data point
      }
    }],
    activeSheetIndex: 0
  })

  // UI State
  const [uiState, setUiState] = useState({
    showHierarchyPanel: true,
    showPropertiesPanel: false,
    showFilterPanel: false,
    showRunReportModal: false,
    hierarchyPanelCollapsed: false,
    propertiesPanelCollapsed: false,
    selectedCell: null,
    selectedRange: null,
    isLive: false,
    isLoading: false,
    error: null
  })

  // Run Report Modal State
  const [runReportData, setRunReportData] = useState({
    showModal: false,
    mappedElements: [],
    fetchedAmounts: [],
    isLoading: false,
    error: null
  })

  // Simple Run dialog state (asks for period and month)
  const [runDialog, setRunDialog] = useState({
    open: false,
    period: 'January',  // Use January since that's what exists in the database
    year: 2025
  })

  // Cell Properties panel state for hierarchy linking and formatting
  const [panelDrop, setPanelDrop] = useState({
    droppedItem: null, // full node/element or hierarchy node object
    insertMode: 'nodes_elements', // 'nodes' | 'elements' | 'nodes_elements' | 'full_tree'
    valueMode: 'rollup', // 'simple' | 'rollup'
    displayMode: 'code', // 'code' | 'name' | 'both_h' | 'both_v' | 'none'
    showSubtotal: true,
    nodeColor: '#111827',
    childColor: '#374151',
    noteText: ''
  })

  // Filter State for Report Execution
  const [reportFilters, setReportFilters] = useState({
    period: {
      type: 'year', // year, quarter, month, custom
      values: [new Date().getFullYear()],
      comparison: null // for variance reports
    },
    entities: {
      type: 'all', // all, selected, excluded
      values: [],
      hierarchy: 'consolidated' // consolidated, individual, mixed
    },
    currencies: {
      type: 'functional', // functional, reporting, multiple
      values: ['USD'],
      conversion: 'spot' // spot, average, historical
    },
    dimensions: {
      businessUnit: [],
      geography: [],
      product: [],
      custom: {}
    },
    adjustments: {
      eliminations: true,
      reclassifications: true,
      custom: []
    }
  })

  // ===== CUSTOM TOOLBAR CONFIGURATION =====
  const customToolbar = {
    items: [
      {
        content: 'undo',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            spreadsheetRef.current[0].undo();
          }
        }
      },
      {
        content: 'redo',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            spreadsheetRef.current[0].redo();
          }
        }
      },
      {
        content: 'save',
        onclick: function() {
          handleSaveReport();
        }
      },
      {
        type: 'divisor',
      },
      {
        type: 'i',
        content: 'functions',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const getSelected = spreadsheetRef.current[0].getSelected(true)
            if (!getSelected || getSelected.length === 0) return
            const cellName = getSelected[0] // e.g., C5
            const match = cellName.match(/([A-Z]+)(\d+)/)
            if (!match) return
            const rowIndex = parseInt(match[2], 10) - 1
            const data = spreadsheetRef.current[0].getData() || []
            const lastCol = (data[rowIndex] ? data[rowIndex].length - 1 : 2)
            const colToLetter = (n) => {
              let s = ''
              let num = n + 1
              while (num > 0) {
                const m = (num - 1) % 26
                s = String.fromCharCode(65 + m) + s
                num = Math.floor((num - m - 1) / 26)
              }
              return s
            }
            const startAddr = `${colToLetter(2)}${rowIndex + 1}`
            const endAddr = `${colToLetter(Math.max(2, lastCol))}${rowIndex + 1}`
            spreadsheetRef.current[0].setValue(rowIndex, match[1].split('').reduce((a,c)=>a*26 + (c.charCodeAt(0)-64),0)-1, `=SUM(${startAddr}:${endAddr})`)
          }
        }
      },
      {
        type: 'i',
        content: 'contrast',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const getSelected = spreadsheetRef.current[0].getSelected(true)
            if (!getSelected || getSelected.length === 0) return
            const cellName = getSelected[0]
            const match = cellName.match(/([A-Z]+)(\d+)/)
            if (!match) return
            const rowIndex = parseInt(match[2], 10) - 1
            const data = spreadsheetRef.current[0].getData() || []
            const colToLetter = (n) => {
              let s = ''
              let num = n + 1
              while (num > 0) {
                const m = (num - 1) % 26
                s = String.fromCharCode(65 + m) + s
                num = Math.floor((num - m - 1) / 26)
              }
              return s
            }
            const styleChanges = {}
            for (let c = 2; c < (data[rowIndex]?.length || 3); c++) {
              const val = parseFloat(data[rowIndex]?.[c])
              if (!isNaN(val) && val < 0) {
                const addr = `${colToLetter(c)}${rowIndex + 1}`
                styleChanges[addr] = 'color:#dc2626;font-weight:bold'
              }
            }
            if (Object.keys(styleChanges).length > 0) {
              spreadsheetRef.current[0].setStyle(styleChanges)
            }
          }
        }
      },
      {
        type: 'select',
        width: '120px',
        options: ['Default', 'Verdana', 'Arial', 'Courier New', 'Times New Roman'],
        render: function(e) {
          return '<span style="font-family:' + e + '">' + e + '</span>';
        },
        onchange: function(a, b, c, d) {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const styleChanges = {};
            const cellNames = spreadsheetRef.current[0].getSelected(true);
            cellNames.forEach(cellName => {
              styleChanges[cellName] = 'font-family: ' + d;
            });
            spreadsheetRef.current[0].setStyle(styleChanges);
          }
        }
      },
      {
        type: 'select',
        width: '60px',
        options: ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px'],
        render: function(e) {
          return '<span style="font-size:' + e + '">' + e + '</span>';
        },
        onchange: function(a, b, c, d) {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const styleChanges = {};
            const cellNames = spreadsheetRef.current[0].getSelected(true);
            cellNames.forEach(cellName => {
              styleChanges[cellName] = 'font-size: ' + d;
            });
            spreadsheetRef.current[0].setStyle(styleChanges);
          }
        }
      },
      {
        type: 'i',
        content: 'format_align_left',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const styleChanges = {};
            const cellNames = spreadsheetRef.current[0].getSelected(true);
            cellNames.forEach(cellName => {
              styleChanges[cellName] = 'text-align: left';
            });
            spreadsheetRef.current[0].setStyle(styleChanges);
          }
        }
      },
      {
        type: 'i',
        content: 'format_align_center',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const styleChanges = {};
            const cellNames = spreadsheetRef.current[0].getSelected(true);
            cellNames.forEach(cellName => {
              styleChanges[cellName] = 'text-align: center';
            });
            spreadsheetRef.current[0].setStyle(styleChanges);
          }
        }
      },
      {
        type: 'i',
        content: 'format_align_right',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const styleChanges = {};
            const cellNames = spreadsheetRef.current[0].getSelected(true);
            cellNames.forEach(cellName => {
              styleChanges[cellName] = 'text-align: right';
            });
            spreadsheetRef.current[0].setStyle(styleChanges);
          }
        }
      },
      {
        type: 'i',
        content: 'format_bold',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const styleChanges = {};
            const cellNames = spreadsheetRef.current[0].getSelected(true);
            cellNames.forEach(cellName => {
              styleChanges[cellName] = 'font-weight: bold';
            });
            spreadsheetRef.current[0].setStyle(styleChanges);
          }
        }
      },
      {
        type: 'i',
        content: 'format_italic',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const styleChanges = {};
            const cellNames = spreadsheetRef.current[0].getSelected(true);
            cellNames.forEach(cellName => {
              styleChanges[cellName] = 'font-style: italic';
            });
            spreadsheetRef.current[0].setStyle(styleChanges);
          }
        }
      },
      {
        type: 'i',
        content: 'format_underlined',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const styleChanges = {};
            const cellNames = spreadsheetRef.current[0].getSelected(true);
            cellNames.forEach(cellName => {
              styleChanges[cellName] = 'text-decoration: underline';
            });
            spreadsheetRef.current[0].setStyle(styleChanges);
          }
        }
      },
      {
        type: 'i',
        content: 'format_color_text',
        onclick: function() {
          setUiState(prev => ({ ...prev, showPropertiesPanel: true }));
        }
      },
      {
        type: 'i',
        content: 'format_color_fill',
        onclick: function() {
          setUiState(prev => ({ ...prev, showPropertiesPanel: true }));
        }
      },
      {
        type: 'i',
        content: 'vertical_align_center',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const styleChanges = {};
            const cellNames = spreadsheetRef.current[0].getSelected(true);
            cellNames.forEach(cellName => {
              styleChanges[cellName] = 'vertical-align: middle';
            });
            spreadsheetRef.current[0].setStyle(styleChanges);
          }
        }
      },
      {
        type: 'i',
        content: 'web',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            spreadsheetRef.current[0].merge();
          }
        }
      },
      {
        type: 'i',
        content: 'border_all',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            const styleChanges = {};
            const cellNames = spreadsheetRef.current[0].getSelected(true);
            cellNames.forEach(cellName => {
              styleChanges[cellName] = 'border: 1px solid #000';
            });
            spreadsheetRef.current[0].setStyle(styleChanges);
          }
        }
      },
      {
        type: 'divisor',
      },
      {
        type: 'i',
        content: 'add',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            spreadsheetRef.current[0].insertRow();
          }
        }
      },
      {
        type: 'i',
        content: 'remove',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            spreadsheetRef.current[0].deleteRow();
          }
        }
      },
      {
        type: 'i',
        content: 'add_box',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            spreadsheetRef.current[0].insertColumn();
          }
        }
      },
      {
        type: 'i',
        content: 'remove_box',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            spreadsheetRef.current[0].deleteColumn();
          }
        }
      },
      {
        type: 'divisor',
      },
      {
        type: 'i',
        content: 'play_arrow',
        onclick: function() {
          setUiState(prev => ({ ...prev, showRunReportModal: true }));
        }
      },
      {
        type: 'i',
        content: 'fullscreen',
        onclick: function() {
          if (spreadsheetRef.current && spreadsheetRef.current[0]) {
            spreadsheetRef.current[0].fullscreen();
          }
        }
      }
    ]
  }
  
  // ===== FORM STATE =====
  const [formData, setFormData] = useState({
    name: reportConfig.name,
    description: reportConfig.description,
    report_type: reportConfig.reportType,
    category: reportConfig.category,
    is_public: reportConfig.isPublic,
    is_template: false
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // ===== CORE FUNCTIONS AND HANDLERS =====
  
  // Load hierarchy data from backend - Comprehensive implementation
  const loadHierarchyData = useCallback(async () => {
    try {
      setUiState(prev => ({ ...prev, isLoading: true, error: null }))
      
      console.log('🔄 Loading comprehensive hierarchy data from PostgreSQL...')
      
      // Fetch all data in parallel for better performance
      const [hierarchiesResponse, entitiesResponse, accountsResponse] = await Promise.all([
        fetch('/api/hierarchies', { credentials: 'include' }),
        fetch('/api/entities', { credentials: 'include' }),
        fetch('/api/ifrs-accounts', { credentials: 'include' })
      ])
      
      if (!hierarchiesResponse.ok || !entitiesResponse.ok || !accountsResponse.ok) {
        throw new Error('Failed to fetch hierarchy data from PostgreSQL')
      }
      
      const [hierarchiesData, entitiesData, accountsData] = await Promise.all([
        hierarchiesResponse.json(),
        entitiesResponse.json(),
        accountsResponse.json()
      ])
      
      // Process hierarchies data
      const allHierarchies = hierarchiesData.hierarchies || []
      console.log('📊 Loaded hierarchies:', allHierarchies.length)
      
      // Separate entity and account hierarchies
      const entityHierarchies = allHierarchies.filter(h => 
        h.hierarchy_type === 'entity' || 
        h.hierarchy_type === 'Entity' || 
        h.hierarchy_type === 'Entity Organization' ||
        h.hierarchy_type === 'ge hi' ||
        h.hierarchy_type === 'Business Units' ||
        h.hierarchy_type === 'Legal Entities'
      )
      
      const accountHierarchies = allHierarchies.filter(h => 
        h.hierarchy_type === 'account' || 
        h.hierarchy_type === 'Account' || 
        h.hierarchy_type === 'Account Organization' ||
        h.hierarchy_type === 'Chart of Accounts' ||
        h.hierarchy_type === 'Account Hierarchy' ||
        h.hierarchy_type === 'GL Accounts'
      )
      
      // Process entities data
      const allEntities = entitiesData.entities || []
      console.log('🏢 Loaded entities:', allEntities.length)
      
      // Process accounts data
      const allAccounts = accountsData.accounts || []
      console.log('📚 Loaded accounts:', allAccounts.length)
      
      // Transform data into comprehensive hierarchy structure
      const transformedHierarchy = {
        // Entity hierarchies with their elements
        entityHierarchies: entityHierarchies.map(hierarchy => ({
          id: hierarchy.id,
          name: hierarchy.hierarchy_name,
          description: hierarchy.description || '',
          type: 'entity_hierarchy',
          icon: Building2,
          children: allEntities
            .filter(entity => entity.hierarchy_id === hierarchy.id)
            .map(entity => ({
          id: entity.id,
              name: entity.entity_name,
              code: entity.entity_code,
          type: 'entity',
              hierarchy_id: entity.hierarchy_id,
          metadata: {
                entity_type: entity.entity_type,
                country: entity.country,
            currency: entity.currency,
                is_active: entity.is_active
              }
            }))
        })),
        
        // Account hierarchies with their elements
        accountHierarchies: accountHierarchies.map(hierarchy => ({
          id: hierarchy.id,
          name: hierarchy.hierarchy_name,
          description: hierarchy.description || '',
          type: 'account_hierarchy',
          icon: FileText,
          children: allAccounts
            .filter(account => account.hierarchy_id === hierarchy.id)
            .map(account => ({
              id: account.id,
              name: account.account_name,
              code: account.account_code,
              type: 'account',
              hierarchy_id: account.hierarchy_id,
              metadata: {
                account_type: account.account_type,
                ifrs_category: account.ifrs_category,
                statement: account.statement,
                currency: account.currency,
                balance: account.balance
              }
            }))
        })),
        
        // Unassigned entities (not in any hierarchy)
        unassignedEntities: allEntities
          .filter(entity => !entity.hierarchy_id)
          .map(entity => ({
            id: entity.id,
            name: entity.entity_name,
            code: entity.entity_code,
            type: 'entity',
            hierarchy_id: null,
            metadata: {
              entity_type: entity.entity_type,
            country: entity.country,
              currency: entity.currency,
              is_active: entity.is_active
          }
        })),
        
        // Unassigned accounts (not in any hierarchy)
        unassignedAccounts: allAccounts
          .filter(account => !account.hierarchy_id)
          .map(account => ({
          id: account.id,
            name: account.account_name,
            code: account.account_code,
          type: 'account',
            hierarchy_id: null,
          metadata: {
              account_type: account.account_type,
              ifrs_category: account.ifrs_category,
              statement: account.statement,
              currency: account.currency,
              balance: account.balance
          }
        })),
        
        // Additional dimensions
        dimensions: [
          {
            id: 'periods',
            name: 'Time Periods',
            type: 'dimension',
            icon: Calendar,
            children: [
              { id: 'year', name: 'Years', type: 'period' },
              { id: 'quarter', name: 'Quarters', type: 'period' },
              { id: 'month', name: 'Months', type: 'period' }
            ]
          },
          {
            id: 'currencies',
            name: 'Currencies',
            type: 'dimension',
            icon: DollarSign,
            children: [
              { id: 'usd', name: 'USD', type: 'currency' },
              { id: 'eur', name: 'EUR', type: 'currency' },
              { id: 'gbp', name: 'GBP', type: 'currency' }
            ]
          }
        ]
      }
      
      console.log('✅ Transformed hierarchy data:', {
        entityHierarchies: transformedHierarchy.entityHierarchies.length,
        accountHierarchies: transformedHierarchy.accountHierarchies.length,
        unassignedEntities: transformedHierarchy.unassignedEntities.length,
        unassignedAccounts: transformedHierarchy.unassignedAccounts.length
      })
      
      setHierarchyData(transformedHierarchy)
      setUiState(prev => ({ ...prev, isLoading: false }))
      
    } catch (error) {
      console.error('❌ Error loading hierarchy data:', error)
      setUiState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to load hierarchy data. Please try again.' 
      }))
    }
  }, [])

  // Load hierarchy structure for a specific hierarchy
  const loadHierarchyStructure = useCallback(async (hierarchyId, hierarchyType = 'entity') => {
    try {
      console.log(`🔄 Loading ${hierarchyType} hierarchy structure for ID:`, hierarchyId)
      
      const endpoint = hierarchyType === 'entity' 
        ? `/api/hierarchy-structure/${hierarchyId}`
        : `/api/account-hierarchy-structure/${hierarchyId}`
      
      const response = await fetch(endpoint, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${hierarchyType} hierarchy structure loaded:`, data)
        
        setHierarchyStructures(prev => ({
          ...prev,
          [hierarchyId]: data
        }))
        
        return data
      } else {
        console.error(`❌ Failed to load ${hierarchyType} hierarchy structure:`, response.status)
        return null
      }
    } catch (error) {
      console.error(`❌ Error loading ${hierarchyType} hierarchy structure:`, error)
      return null
    }
  }, [])

  // Toggle node expansion
  const toggleNodeExpansion = useCallback((nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }))
  }, [])

  // Force update spreadsheet data
  const forceSpreadsheetUpdate = useCallback(() => {
    if (spreadsheetRef.current && spreadsheetRef.current[0]) {
      console.log('🔄 Force updating spreadsheet...')
      
      // Get current data from state
      const currentSheet = spreadsheetData.sheets[spreadsheetData.activeSheetIndex]
      const currentData = currentSheet.data || []
      
      // Update the spreadsheet with current data
      currentData.forEach((row, rowIndex) => {
        if (Array.isArray(row)) {
          row.forEach((cellValue, colIndex) => {
            if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
              spreadsheetRef.current[0].setValue(rowIndex, colIndex, cellValue)
            }
          })
        }
      })
      
      // Force refresh by updating the component
      setTimeout(() => {
        if (spreadsheetRef.current && spreadsheetRef.current[0]) {
          // Force re-render by updating a dummy cell
          const currentData = spreadsheetRef.current[0].getData()
          spreadsheetRef.current[0].setData(currentData)
        }
      }, 50)
    }
  }, [spreadsheetData])

  // Build a flat list of items to insert based on insert mode
  const buildInsertList = useCallback((rootItem, mode) => {
    const items = []
    const isLeaf = (n) => !n?.children || n.children.length === 0
    const visit = (node, depth = 0) => {
      const nodeEntry = {
        kind: isLeaf(node) ? 'element' : 'node',
        type: node.type || 'account',
        name: node.name || node.entity_name || node.account_name,
        code: node.code || node.entity_code || node.account_code,
        depth,
        raw: node
      }
      if (mode === 'nodes') {
        if (nodeEntry.kind === 'node') items.push(nodeEntry)
      } else if (mode === 'elements') {
        if (nodeEntry.kind === 'element') items.push(nodeEntry)
      } else if (mode === 'nodes_elements') {
        if (nodeEntry.kind === 'node') items.push(nodeEntry)
        if (node.children) node.children.forEach(child => visit(child, depth + 1))
        return
      } else if (mode === 'full_tree') {
        items.push(nodeEntry)
      }
      if (node.children) node.children.forEach(child => visit(child, depth + 1))
    }
    // If dropped item already is a hierarchy node with children, use it; else treat as single element
    if (rootItem?.children && Array.isArray(rootItem.children)) {
      visit(rootItem, 0)
    } else {
      items.push({
        kind: 'element',
        type: rootItem?.type || 'account',
        name: rootItem?.name || rootItem?.entity_name || rootItem?.account_name,
        code: rootItem?.code || rootItem?.entity_code || rootItem?.account_code,
        depth: 0,
        raw: rootItem
      })
    }
    return items
  }, [])

  // Apply the dropped hierarchy configuration to the selected cell/rows
  const applyPanelHierarchy = useCallback(() => {
    if (!uiState.selectedCell || !panelDrop.droppedItem) return
    if (!(spreadsheetRef.current && spreadsheetRef.current[0])) return
    const grid = spreadsheetRef.current[0]
    const startRow = Math.max(0, uiState.selectedCell.row)
    const startCol = Math.max(0, uiState.selectedCell.col)

    const currentData = grid.getData() || []
    const ensureRow = (r) => { if (!currentData[r]) currentData[r] = [] }

    const items = buildInsertList(panelDrop.droppedItem, panelDrop.insertMode)

    // Insert items honoring displayMode; only write at selected row/col position
    const writeCell = (r, c, v) => { ensureRow(r); currentData[r][c] = v }
    items.forEach((it, idx) => {
      const r = startRow + idx
      const indent = it.depth > 0 ? ' '.repeat(it.depth * 2) : ''
      const code = it.code || ''
      const name = it.name || ''
      const at = { r, c: startCol }
      switch (panelDrop.displayMode) {
        case 'code':
          writeCell(at.r, at.c, code)
          break
        case 'name':
          writeCell(at.r, at.c, `${indent}${name}`)
          break
        case 'both_h': // code and name horizontally (same row)
          writeCell(at.r, at.c, code)
          writeCell(at.r, at.c + 1, `${indent}${name}`)
          break
        case 'both_v': // code on selected cell, name on cell below
          writeCell(at.r, at.c, code)
          writeCell(at.r + 1, at.c, `${indent}${name}`)
          break
        case 'none':
        default:
          // write nothing
          break
      }
      // Persist mapping for accounts/entities to support Run
      setSpreadsheetData(prev => {
        const newSheets = [...prev.sheets]
        const sheet = { ...newSheets[prev.activeSheetIndex] }
        sheet.metadata = sheet.metadata || { rowMapping: {}, columnMapping: {}, cellMapping: {} }
        // If it's an account/element, remember on the row
        if ((it.type === 'account' || it.raw?.type === 'account') && it.kind === 'element') {
          sheet.metadata.rowMapping[r] = {
            id: it.raw?.id,
            type: 'account',
            code: code,
            name: name
          }
        } else if ((it.type === 'entity' || it.raw?.type === 'entity') && it.kind === 'element') {
          sheet.metadata.rowMapping[r] = {
            id: it.raw?.id,
            type: 'entity',
            code: code,
            name: name
          }
        }
        newSheets[prev.activeSheetIndex] = sheet
        return { ...prev, sheets: newSheets }
      })
    })

    // Commit data back and force refresh
    grid.setData(currentData)

    // Style nodes and children if requested
    const colToLetter = (n) => {
      let s = ''
      let num = n + 1
      while (num > 0) {
        const m = (num - 1) % 26
        s = String.fromCharCode(65 + m) + s
        num = Math.floor((num - m - 1) / 26)
      }
      return s
    }
    const styles = {}
    items.forEach((it, idx) => {
      const r = startRow + idx
      const addStyle = (c) => {
        const addr = `${colToLetter(c)}${r + 1}`
        if (it.kind === 'node') styles[addr] = `font-weight:bold;color:${panelDrop.nodeColor}`
        else styles[addr] = `color:${panelDrop.childColor}`
      }
      if (panelDrop.displayMode === 'code') addStyle(startCol)
      else if (panelDrop.displayMode === 'name') addStyle(startCol)
      else if (panelDrop.displayMode === 'both_h') { addStyle(startCol); addStyle(startCol + 1) }
      else if (panelDrop.displayMode === 'both_v') { addStyle(startCol); /* row+1 style not necessary */ }
    })
    if (Object.keys(styles).length) grid.setStyle(styles)

    // Optional: show subtotal rows for nodes (label only); amounts will be from Run
    if (panelDrop.showSubtotal) {
      items.forEach((it, idx) => {
        if (it.kind === 'node') {
          const r = startRow + idx
          // We mark subtotal in metadata for future use
          setSpreadsheetData(prev => {
            const newSheets = [...prev.sheets]
            const sheet = { ...newSheets[prev.activeSheetIndex] }
            sheet.metadata = sheet.metadata || { rowMapping: {}, columnMapping: {}, cellMapping: {} }
            sheet.metadata.rowMapping[r] = {
              id: it.raw?.id,
              type: 'node',
              code: it.code,
              name: it.name,
              subtotal: true
            }
            newSheets[prev.activeSheetIndex] = sheet
            return { ...prev, sheets: newSheets }
          })
        }
      })
    }

    // Add note/comment if provided
    if (panelDrop.noteText && panelDrop.noteText.trim() !== '') {
      grid.setComments({ [`${colToLetter(startCol)}${startRow + 1}`]: panelDrop.noteText.trim() })
    }

    // Open properties panel state stays; user can re-apply
  }, [uiState.selectedCell, panelDrop, buildInsertList, setSpreadsheetData])

  // Handle drop into properties panel
  const onPropertiesPanelDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    let dragData = e.dataTransfer.getData('application/json')
    if (!dragData) dragData = e.dataTransfer.getData('text/plain')
    if (!dragData) return
    try {
      const item = JSON.parse(dragData)
      setPanelDrop(prev => ({ ...prev, droppedItem: item }))
    } catch (err) {
      console.error('Failed to parse dropped data in properties panel:', err)
    }
  }, [])

  // ===== SHEET MANAGEMENT FUNCTIONS =====
  
  // Add a new sheet
  const addNewSheet = useCallback(() => {
    const newSheetId = `sheet${spreadsheetData.sheets.length + 1}`
    const newSheet = {
      id: newSheetId,
      name: `Sheet ${spreadsheetData.sheets.length + 1}`,
      data: [], // Start with empty data
      columns: [
        { type: 'text', title: 'Account Code', width: 120 },
        { type: 'text', title: 'Account Name', width: 200 },
        { type: 'numeric', title: 'Amount', width: 150, mask: '$ #,##0' }
      ],
      rows: [],
      formulas: {},
      styles: {},
      comments: {},
      metadata: {
        rowMapping: {}, // Maps row index to account/entity ID
        columnMapping: {}, // Maps column index to period/entity ID
        cellMapping: {} // Maps cell to specific data point
      }
    }
    
    setSpreadsheetData(prev => ({
      ...prev,
      sheets: [...prev.sheets, newSheet],
      activeSheetIndex: prev.sheets.length // Switch to the new sheet
    }))
    
    console.log('📊 Added new sheet:', newSheetId)
  }, [spreadsheetData.sheets.length])

  // Switch to a different sheet
  const switchToSheet = useCallback((sheetIndex) => {
    if (sheetIndex >= 0 && sheetIndex < spreadsheetData.sheets.length) {
      setSpreadsheetData(prev => ({
        ...prev,
        activeSheetIndex: sheetIndex
      }))
      console.log('📊 Switched to sheet:', sheetIndex)
    }
  }, [spreadsheetData.sheets.length])

  // Delete a sheet (but keep at least one sheet)
  const deleteSheet = useCallback((sheetIndex) => {
    if (spreadsheetData.sheets.length > 1) {
      setSpreadsheetData(prev => {
        const newSheets = prev.sheets.filter((_, index) => index !== sheetIndex)
        const newActiveIndex = sheetIndex >= newSheets.length ? newSheets.length - 1 : sheetIndex
        
        return {
          ...prev,
          sheets: newSheets,
          activeSheetIndex: newActiveIndex
        }
      })
      console.log('🗑️ Deleted sheet:', sheetIndex)
    }
  }, [spreadsheetData.sheets.length])

  // Rename a sheet
  const renameSheet = useCallback((sheetIndex, newName) => {
    setSpreadsheetData(prev => {
      const newSheets = [...prev.sheets]
      newSheets[sheetIndex] = { ...newSheets[sheetIndex], name: newName }
      return { ...prev, sheets: newSheets }
    })
    console.log('📝 Renamed sheet:', sheetIndex, 'to:', newName)
  }, [])

  // Enhanced drag and drop handler with smart cell population
  const handleHierarchyDrop = useCallback((item, targetPosition) => {
    const { row, col } = targetPosition
    const currentSheet = spreadsheetData.sheets[spreadsheetData.activeSheetIndex]
    
    console.log('🎯 Dropping item:', item, 'at position:', targetPosition)
    
    // Use the calculated position directly (it's now always the selected cell)
    const targetRow = row
    const targetCol = col
    
    // Update spreadsheet data with new item
    setSpreadsheetData(prev => {
      const newSheets = [...prev.sheets]
      const sheet = { ...newSheets[prev.activeSheetIndex] }
      
      // Initialize metadata if not exists
      if (!sheet.metadata) {
        sheet.metadata = {
          rowMapping: {},
          columnMapping: {},
          cellMapping: {}
        }
      }
      
      // Smart cell population based on item type
      if (targetRow !== null && targetCol !== null) {
        // Dropping on a specific cell
        const cellKey = `${targetRow}_${targetCol}`
        
        if (item.type === 'account') {
          // For accounts: put code in cell, name in comment/tooltip
          sheet.metadata.cellMapping[cellKey] = {
            id: item.id,
            type: 'account',
            name: item.name,
            code: item.code,
            hierarchy_id: item.hierarchy_id,
            metadata: item.metadata
          }
          
          // Set account code as cell value
          if (!sheet.data[targetRow]) {
            sheet.data[targetRow] = []
          }
          sheet.data[targetRow][targetCol] = item.code
          
        } else if (item.type === 'entity') {
          // For entities: put name in cell, code in metadata
          sheet.metadata.cellMapping[cellKey] = {
            id: item.id,
            type: 'entity',
            name: item.name,
            code: item.code,
            hierarchy_id: item.hierarchy_id,
            metadata: item.metadata
          }
          
          // Set entity name as cell value
          if (!sheet.data[targetRow]) {
            sheet.data[targetRow] = []
          }
          sheet.data[targetRow][targetCol] = item.name
        }
        
        console.log('📊 Updated sheet data:', sheet.data)
        console.log('📊 Cell mapping:', sheet.metadata.cellMapping)
        
      } else if (targetRow !== null) {
        // Adding to row (account in first column, entity in header)
        sheet.metadata.rowMapping[targetRow] = {
          id: item.id,
          type: item.type,
          name: item.name,
          code: item.code,
          hierarchy_id: item.hierarchy_id,
          metadata: item.metadata
        }
        
        // Update row data
        if (!sheet.data[targetRow]) {
          sheet.data[targetRow] = []
        }
        
        if (item.type === 'account') {
          sheet.data[targetRow][0] = item.code // Account code in first column
          sheet.data[targetRow][1] = item.name // Account name in second column
        } else if (item.type === 'entity') {
          sheet.data[targetRow][0] = item.name // Entity name in first column
          sheet.data[targetRow][1] = item.code // Entity code in second column
        }
        
      } else if (targetCol !== null) {
        // Adding to column header
        sheet.metadata.columnMapping[targetCol] = {
          id: item.id,
          type: item.type,
          name: item.name,
          code: item.code,
          hierarchy_id: item.hierarchy_id,
          metadata: item.metadata
        }
        
        // Update column headers
        if (!sheet.columns[col]) {
          sheet.columns[col] = { 
            title: item.type === 'entity' ? item.name : item.code, 
            width: 120 
          }
        } else {
          sheet.columns[col].title = item.type === 'entity' ? item.name : item.code
        }
      }
      
      newSheets[prev.activeSheetIndex] = sheet
      return { ...prev, sheets: newSheets }
    })
    
    // Also update the spreadsheet component directly if available
    if (spreadsheetRef.current && spreadsheetRef.current[0]) {
      console.log('🔄 Updating spreadsheet component directly...')
      
      if (targetRow !== null && targetCol !== null) {
        // Update only the specific cell the user dropped on
        const cellValue = item.type === 'account' ? item.code : item.name
        console.log(`📝 Setting cell [${targetRow}, ${targetCol}] to:`, cellValue)
        spreadsheetRef.current[0].setValue(targetRow, targetCol, cellValue)
      } else if (row !== null) {
        // Update row
        if (item.type === 'account') {
          spreadsheetRef.current[0].setValue(row, 0, item.code)
          spreadsheetRef.current[0].setValue(row, 1, item.name)
        } else if (item.type === 'entity') {
          spreadsheetRef.current[0].setValue(row, 0, item.name)
          spreadsheetRef.current[0].setValue(row, 1, item.code)
        }
      } else if (col !== null) {
        // Update column header
        const columnConfig = spreadsheetRef.current[0].getConfig()
        if (columnConfig && columnConfig[col]) {
          columnConfig[col].title = item.type === 'entity' ? item.name : item.code
          spreadsheetRef.current[0].setConfig(columnConfig)
        }
      }
    } else {
      console.log('⚠️ Spreadsheet ref not available')
    }
  }, [spreadsheetData])

  // Handle cell selection (removed duplicate - using the more comprehensive version below)

  // Handle cell value changes
  const handleCellChange = useCallback((instance, cell, x, y, value) => {
    setSpreadsheetData(prev => {
      const newSheets = [...prev.sheets]
      const sheet = { ...newSheets[prev.activeSheetIndex] }
      
      // Update cell data
      if (!sheet.data[y]) {
        sheet.data[y] = []
      }
      sheet.data[y][x] = value
      
      // If cell is cleared (empty value), remove ALL metadata
      if (!value || value === '' || value === null || value === undefined) {
        const cellKey = `${y}_${x}`
        
        if (sheet.metadata) {
          // Remove cell mapping
          if (sheet.metadata.cellMapping && sheet.metadata.cellMapping[cellKey]) {
            const removedMapping = sheet.metadata.cellMapping[cellKey]
            delete sheet.metadata.cellMapping[cellKey]
            console.log('🗑️ Removed cell mapping for cleared cell:', cellKey, removedMapping)
          }
          
          // Remove row mapping if this cell was mapped to a row
          if (sheet.metadata.rowMapping && sheet.metadata.rowMapping[y.toString()]) {
            const removedRowMapping = sheet.metadata.rowMapping[y.toString()]
            delete sheet.metadata.rowMapping[y.toString()]
            console.log('🗑️ Removed row mapping for cleared cell:', y, removedRowMapping)
          }
          
          // Remove column mapping if this cell was mapped to a column
          if (sheet.metadata.columnMapping && sheet.metadata.columnMapping[x.toString()]) {
            const removedColMapping = sheet.metadata.columnMapping[x.toString()]
            delete sheet.metadata.columnMapping[x.toString()]
            console.log('🗑️ Removed column mapping for cleared cell:', x, removedColMapping)
          }
        }
      }
      
      // Update formulas if it's a formula
      if (typeof value === 'string' && value.startsWith('=')) {
        sheet.formulas[`${y}_${x}`] = value
      } else {
        delete sheet.formulas[`${y}_${x}`]
      }
      
      newSheets[prev.activeSheetIndex] = sheet
      return { ...prev, sheets: newSheets }
    })
  }, [])

  // Handle cell selection changes to detect deletions and update UI
  const handleCellSelection = useCallback((instance, cell, x, y) => {
    console.log('🎯 Cell selected:', { x, y, cell })
    
    // Update UI state for selected cell
    if (spreadsheetRef.current && spreadsheetRef.current[0]) {
      const value = spreadsheetRef.current[0].getValue(y, x)
      setUiState(prev => ({
        ...prev,
        selectedCell: {
          row: y,
          col: x,
          value: value,
          range: { x1: x, y1: y, x2: x, y2: y }
        },
        showPropertiesPanel: true
      }))
      console.log('✅ Updated selectedCell state:', { row: y, col: x, value })
    }
    
    // Check if the selected cell is empty and has a mapping
    const currentSheet = spreadsheetData.sheets[spreadsheetData.activeSheetIndex]
    const cellKey = `${y}_${x}`
    
    if (currentSheet.metadata && currentSheet.metadata.cellMapping && currentSheet.metadata.cellMapping[cellKey]) {
      // Check if the cell is actually empty
      const cellValue = currentSheet.data[y] && currentSheet.data[y][x]
      if (!cellValue || cellValue === '' || cellValue === null || cellValue === undefined) {
        // Remove the mapping
        setSpreadsheetData(prev => {
          const newSheets = [...prev.sheets]
          const sheet = { ...newSheets[prev.activeSheetIndex] }
          if (sheet.metadata && sheet.metadata.cellMapping) {
            delete sheet.metadata.cellMapping[cellKey]
            console.log('🗑️ Removed mapping for empty selected cell:', cellKey)
          }
          newSheets[prev.activeSheetIndex] = sheet
          return { ...prev, sheets: newSheets }
        })
      }
    }
  }, [spreadsheetData])

  // Handle keyboard events for Delete key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selectedCell = uiState.selectedCell
      if (selectedCell) {
        const { row, col } = selectedCell
        const cellKey = `${row}_${col}`
        
        console.log('🗑️ Delete key pressed for cell:', cellKey)
        
        // Clear the cell value
        if (spreadsheetRef.current && spreadsheetRef.current[0]) {
          spreadsheetRef.current[0].setValue(row, col, '')
        }
        
        // Remove ALL metadata for this cell
        setSpreadsheetData(prev => {
          const newSheets = [...prev.sheets]
          const sheet = { ...newSheets[prev.activeSheetIndex] }
          
          // Clear cell data
          if (sheet.data[row]) {
            sheet.data[row][col] = ''
          }
          
          // Remove ALL mappings for this cell
          if (sheet.metadata) {
            // Remove cell mapping
            if (sheet.metadata.cellMapping) {
              const removedMapping = sheet.metadata.cellMapping[cellKey]
              delete sheet.metadata.cellMapping[cellKey]
              if (removedMapping) {
                console.log('🗑️ Removed cell mapping:', cellKey, removedMapping)
              }
            }
            
            // Remove row mapping if this cell was mapped to a row
            if (sheet.metadata.rowMapping) {
              Object.keys(sheet.metadata.rowMapping).forEach(rowKey => {
                if (rowKey === row.toString()) {
                  const removedRowMapping = sheet.metadata.rowMapping[rowKey]
                  delete sheet.metadata.rowMapping[rowKey]
                  console.log('🗑️ Removed row mapping:', rowKey, removedRowMapping)
                }
              })
            }
            
            // Remove column mapping if this cell was mapped to a column
            if (sheet.metadata.columnMapping) {
              Object.keys(sheet.metadata.columnMapping).forEach(colKey => {
                if (colKey === col.toString()) {
                  const removedColMapping = sheet.metadata.columnMapping[colKey]
                  delete sheet.metadata.columnMapping[colKey]
                  console.log('🗑️ Removed column mapping:', colKey, removedColMapping)
                }
              })
            }
          }
          
          newSheets[prev.activeSheetIndex] = sheet
          return { ...prev, sheets: newSheets }
        })
        
        // Force spreadsheet update
        setTimeout(() => {
          forceSpreadsheetUpdate()
        }, 50)
      }
    }
  }, [uiState.selectedCell, forceSpreadsheetUpdate])

  // Save report configuration and data
  const handleSaveReport = useCallback(async () => {
    try {
      setLoading(true)
      
      const reportPayload = {
        config: reportConfig,
        spreadsheetData: spreadsheetData,
        filters: reportFilters,
        metadata: {
          lastModified: new Date().toISOString(),
          version: reportConfig.version + 1
        }
      }
      
      const response = await fetch('/api/reports', {
        method: reportConfig.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportPayload)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save report')
      }
      
      const savedReport = await response.json()
      setReportConfig(prev => ({ ...prev, id: savedReport.id, version: savedReport.version }))
      
      // Show success message
      console.log('Report saved successfully')
      
    } catch (error) {
      console.error('Error saving report:', error)
      setErrors(prev => ({ ...prev, save: 'Failed to save report. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }, [reportConfig, spreadsheetData, reportFilters])

  // Load report configuration and data
  const handleLoadReport = useCallback(async (reportId) => {
    try {
      setUiState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch(`/api/reports/${reportId}`)
      if (!response.ok) {
        throw new Error('Failed to load report')
      }
      
      const reportData = await response.json()
      
      // Restore report configuration
      setReportConfig(reportData.config)
      setSpreadsheetData(reportData.spreadsheetData)
      setReportFilters(reportData.filters)
      
      setUiState(prev => ({ ...prev, isLoading: false }))
      
    } catch (error) {
      console.error('Error loading report:', error)
      setUiState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to load report. Please try again.' 
      }))
    }
  }, [])

  // Fetch data from tb_entries based on account/entity relationships
  const fetchReportData = useCallback(async (accountCodes, entityCodes, period) => {
    try {
      console.log('🔄 Fetching report data for:', { accountCodes, entityCodes, period })
      // Use the working SQL API directly since report-data endpoint has issues
      console.log('🔄 Using SQL API fallback for report data...')
      
      // Build SQL query for the working endpoint
      const quote = (s) => `'${String(s).replace(/'/g, "''")}'`
      const accList = accountCodes.length ? accountCodes.map(quote).join(',') : ''
      const entList = entityCodes.length ? entityCodes.map(quote).join(',') : ''
      const perStr = String(period)
      
      let perConds = []
      perConds.push(`CAST(period AS TEXT) = ${quote(perStr)}`)
      perConds.push(`CAST(period AS TEXT) ILIKE ${quote('%' + perStr + '%')}`)
      
      const whereParts = [ `(${perConds.join(' OR ')})` ]
      if (accList) whereParts.push(`(account_code IN (${accList}))`)
      if (entList) whereParts.push(`(entity_code IN (${entList}))`)
      const whereClause = whereParts.join(' AND ')
      
      const sql = `SELECT account_code, entity_code, SUM(amount) AS amount, period
                   FROM tb_entries
                   WHERE ${whereClause}
                   GROUP BY account_code, entity_code, period
                   LIMIT 10000`
      
      const response = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: sql })
      })
      
      if (!response.ok) {
        throw new Error(`SQL API request failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('📊 SQL API result:', result)
      
      if (!result.success) {
        throw new Error(`SQL query failed: ${result.error}`)
      }
      
      // Handle different data formats from SQL API
      let rows = []
      console.log('🔍 Checking data format:', {
        hasData: !!result.data,
        dataType: typeof result.data,
        isDataArray: Array.isArray(result.data),
        hasDataRows: !!(result.data && result.data.rows),
        hasRows: !!result.rows
      })
      
      if (result.data && Array.isArray(result.data)) {
        rows = result.data
        console.log('✅ Using result.data (direct array)')
      } else if (result.data && result.data.rows && Array.isArray(result.data.rows)) {
        rows = result.data.rows
        console.log('✅ Using result.data.rows (nested array)')
      } else if (result.rows && Array.isArray(result.rows)) {
        rows = result.rows
        console.log('✅ Using result.rows (alternative structure)')
      } else {
        console.log('⚠️ Unexpected data format, using empty array:', result)
        rows = []
      }
      
      console.log('📋 Final rows array length:', rows.length)
      
      // Convert SQL result to the expected format
      const entries = rows.map(row => ({
        account_code: row.account_code,
        entity_code: row.entity_code,
        amount: parseFloat(row.amount) || 0,
        period: row.period
      }))
      
      console.log('✅ Converted entries:', entries)
      
      return {
        success: true,
        entries: entries,
        summary: {
          total_entries: entries.length,
          total_amount: entries.reduce((sum, e) => sum + e.amount, 0),
          unique_accounts: new Set(entries.map(e => e.account_code)).size,
          unique_entities: new Set(entries.map(e => e.entity_code)).size
        }
      }
      console.log('✅ Report data fetched:', data)
      return data
    } catch (error) {
      console.error('❌ Error fetching report data:', error)
      throw error
    }
  }, [reportFilters])

  // Run report with live data from PostgreSQL
  const handleRunReport = useCallback(async () => {
    try {
      // Prompt for period/month if dialog not open
      if (!runDialog.open) {
        setRunDialog({ open: true, period: reportFilters.period.values[0], month: reportFilters.period.month || '' })
        return
      }
      
      // Apply selected dialog filters
      setReportFilters(prev => ({
        ...prev,
        period: { ...prev.period, values: [runDialog.period], month: runDialog.month }
      }))
      
      setRunReportData(prev => ({ ...prev, isLoading: true, error: null, showModal: true }))
      
        const currentSheet = spreadsheetData.sheets[spreadsheetData.activeSheetIndex]
      const metadata = currentSheet.metadata || {}
      
      // Extract account rows and entity columns from current live grid
      let data = currentSheet.data || []
      if (spreadsheetRef.current && spreadsheetRef.current[0]) {
        try { data = spreadsheetRef.current[0].getData() || data } catch (e) {}
      }
      const headerRow = data[0] || []
      let entityColumns = []
      // Prefer metadata codes first (header text may be names)
      if (metadata.columnMapping) {
        Object.entries(metadata.columnMapping).forEach(([colKey, mapping]) => {
          const c = Number(colKey)
          if (!Number.isNaN(c) && mapping?.code) {
            entityColumns.push({ col: c, code: mapping.code, name: mapping.name || mapping.code })
          }
        })
      }
      // Then add any header text not already captured
      headerRow.forEach((v, c) => {
        if (v && typeof v === 'string' && v.trim() !== '') {
          if (!entityColumns.find(ec => ec.col === c)) {
            const txt = String(v).trim()
            entityColumns.push({ col: c, code: txt, name: txt })
          }
        }
      })
      // Fallback: read column titles (if user dropped into headers)
      if (entityColumns.length === 0 && Array.isArray(currentSheet.columns)) {
        currentSheet.columns.forEach((colDef, c) => {
          const title = (colDef && colDef.title) ? String(colDef.title).trim() : ''
          if (title && !['Account Code','Account Name','Amount'].includes(title)) {
            entityColumns.push({ col: c, code: title, name: title })
          }
        })
      }

      // Account rows: scan first column(s) for codes/names added via panel apply
      const accountRows = []
      for (let r = 1; r < data.length; r++) {
        const metaRow = metadata.rowMapping && metadata.rowMapping[r]
        const codeFromMeta = metaRow?.code
        const nameFromMeta = metaRow?.name
        const codeCell = (data[r] && data[r][0]) || ''
        const nameCell = (data[r] && data[r][1]) || ''
        const code = codeFromMeta || codeCell || nameCell
        const name = nameFromMeta || nameCell || codeCell
        if (code || name) {
          accountRows.push({ row: r, code, name })
        }
      }

      const accountCodes = accountRows.map(a => a.code)
      const entityCodes = entityColumns.map(e => e.code)
      const cellMappings = []
      
      console.log('📊 Extracted mappings:', { accountCodes, entityCodes, cellMappings })
      
      if (accountCodes.length === 0 && entityCodes.length === 0) {
        throw new Error('No accounts or entities found in the spreadsheet. Please drag and drop some elements first.')
      }
      
      // Fetch data from PostgreSQL
      const reportData = await fetchReportData(
        [...new Set(accountCodes)], // Remove duplicates
        [...new Set(entityCodes)], // Remove duplicates
        reportFilters.period.values[0]
      )
      
      // Build a quick lookup for amounts account_code + entity_code
      const dataMap = {}
      reportData.entries.forEach(entry => {
        dataMap[`${entry.account_code}_${entry.entity_code}`] = entry.amount || 0
      })
      
      // Build results on a new sheet as requested: row0 headers are entities, col0 is account code
      const resultsData = []
      resultsData[0] = []
      resultsData[0][0] = 'Account'
      entityColumns.forEach((eCol, idx) => {
        resultsData[0][idx + 1] = eCol.name || eCol.code
      })
      accountRows.forEach((aRow, rIdx) => {
        const outRowIndex = rIdx + 1
        resultsData[outRowIndex] = resultsData[outRowIndex] || []
        resultsData[outRowIndex][0] = aRow.code
        entityColumns.forEach((eCol, idx) => {
          const amount = dataMap[`${aRow.code}_${eCol.code}`] || 0
          resultsData[outRowIndex][idx + 1] = amount
        })
      })

      // Append new sheet and activate it
      setSpreadsheetData(prev => {
        const newSheets = [...prev.sheets]
        const resultsSheet = {
          id: `results_${Date.now()}`,
          name: 'Results',
          data: resultsData,
          columns: [
            { type: 'text', title: 'Account', width: 140 },
            ...entityColumns.map(e => ({ type: 'numeric', title: e.name || e.code, width: 120, mask: '$ #,##0' }))
          ],
          rows: [],
          formulas: {},
          styles: {},
          comments: {},
          metadata: { rowMapping: {}, columnMapping: {}, cellMapping: {} }
        }
        newSheets.push(resultsSheet)
        return { ...prev, sheets: newSheets, activeSheetIndex: newSheets.length - 1 }
      })
      
      // Force spreadsheet update
      setTimeout(() => {
        forceSpreadsheetUpdate()
      }, 100)
      
      // Finish
      setRunReportData(prev => ({ ...prev, isLoading: false, showModal: false }))
      setRunDialog(prev => ({ ...prev, open: false }))
      console.log('✅ Report data populated to Results sheet')
      
    } catch (error) {
      console.error('❌ Error running report:', error)
      setRunReportData(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Failed to run report. Please check your data and try again.' 
      }))
    }
  }, [reportConfig, spreadsheetData, reportFilters, fetchReportData])

  // Handle dialog submission and run report
  const handleDialogRunReport = useCallback(async () => {
    try {
      setRunDialog(prev => ({ ...prev, open: false }))
      
      // Apply selected dialog filters
      setReportFilters(prev => ({
        ...prev,
        period: { ...prev.period, values: [runDialog.period], month: runDialog.month }
      }))
      
      setRunReportData(prev => ({ ...prev, isLoading: true, error: null, showModal: true }))
      
      const currentSheet = spreadsheetData.sheets[spreadsheetData.activeSheetIndex]
      const metadata = currentSheet.metadata || {}
      
      // Extract account rows and entity columns from current live grid
      let data = currentSheet.data || []
      if (spreadsheetRef.current && spreadsheetRef.current[0]) {
        try { data = spreadsheetRef.current[0].getData() || data } catch (e) {}
      }
      const headerRow = data[0] || []
      let entityColumns = []
      // Prefer metadata codes first (header text may be names)
      if (metadata.columnMapping) {
        Object.entries(metadata.columnMapping).forEach(([colKey, mapping]) => {
          const c = Number(colKey)
          if (!Number.isNaN(c) && mapping?.code) {
            entityColumns.push({ col: c, code: mapping.code, name: mapping.name || mapping.code })
          }
        })
      }
      // Then add any header text not already captured
      headerRow.forEach((v, c) => {
        if (v && typeof v === 'string' && v.trim() !== '') {
          if (!entityColumns.find(ec => ec.col === c)) {
            const txt = String(v).trim()
            entityColumns.push({ col: c, code: txt, name: txt })
          }
        }
      })
      // Fallback: read column titles (if user dropped into headers)
      if (entityColumns.length === 0 && Array.isArray(currentSheet.columns)) {
        currentSheet.columns.forEach((colDef, c) => {
          const title = (colDef && colDef.title) ? String(colDef.title).trim() : ''
          if (title && !['Account Code','Account Name','Amount'].includes(title)) {
            entityColumns.push({ col: c, code: title, name: title })
          }
        })
      }

      // Account rows: scan first column(s) for codes/names added via panel apply
      const accountRows = []
      for (let r = 1; r < data.length; r++) {
        const metaRow = metadata.rowMapping && metadata.rowMapping[r]
        const codeFromMeta = metaRow?.code
        const nameFromMeta = metaRow?.name
        const codeCell = (data[r] && data[r][0]) || ''
        const nameCell = (data[r] && data[r][1]) || ''
        const code = codeFromMeta || codeCell || nameCell
        const name = nameFromMeta || nameCell || codeCell
        if (code || name) {
          accountRows.push({ row: r, code, name })
        }
      }

      const accountCodes = accountRows.map(a => a.code)
      const entityCodes = entityColumns.map(e => e.code)
      
      console.log('📊 Extracted mappings:', { accountCodes, entityCodes })
      
      if (accountCodes.length === 0 && entityCodes.length === 0) {
        throw new Error('No accounts or entities found in the spreadsheet. Please drag and drop some elements first.')
      }
      
      // Fetch data from PostgreSQL
      // Use the selected month name directly
      const reportData = await fetchReportData(
        [...new Set(accountCodes)], // Remove duplicates
        [...new Set(entityCodes)], // Remove duplicates
        runDialog.period  // Use the selected month name (January, February, December)
      )
      
      // Build a quick lookup for amounts account_code + entity_code
      const dataMap = {}
      reportData.entries.forEach(entry => {
        dataMap[`${entry.account_code}_${entry.entity_code}`] = entry.amount || 0
      })
      
      // Build results on a new sheet as requested: row0 headers are entities, col0 is account code
      const resultsData = []
      resultsData[0] = []
      resultsData[0][0] = 'Account'
      entityColumns.forEach((eCol, idx) => {
        resultsData[0][idx + 1] = eCol.name || eCol.code
      })
      accountRows.forEach((aRow, rIdx) => {
        const outRowIndex = rIdx + 1
        resultsData[outRowIndex] = resultsData[outRowIndex] || []
        resultsData[outRowIndex][0] = aRow.code
        entityColumns.forEach((eCol, idx) => {
          const amount = dataMap[`${aRow.code}_${eCol.code}`] || 0
          resultsData[outRowIndex][idx + 1] = amount
        })
      })

      // Append new sheet and activate it
      setSpreadsheetData(prev => {
        const newSheets = [...prev.sheets]
        const resultsSheet = {
          id: `results_${Date.now()}`,
          name: 'Results',
          data: resultsData,
          columns: [
            { type: 'text', title: 'Account', width: 140 },
            ...entityColumns.map(e => ({ type: 'numeric', title: e.name || e.code, width: 120, mask: '$ #,##0' }))
          ],
          rows: [],
          formulas: {},
          styles: {},
          comments: {},
          metadata: { rowMapping: {}, columnMapping: {}, cellMapping: {} }
        }
        newSheets.push(resultsSheet)
        return { ...prev, sheets: newSheets, activeSheetIndex: newSheets.length - 1 }
      })
      
      // Force spreadsheet update
      setTimeout(() => {
        forceSpreadsheetUpdate()
      }, 100)
      
      // Finish
      setRunReportData(prev => ({ ...prev, isLoading: false, showModal: false }))
      console.log('✅ Report data populated to Results sheet')
      
    } catch (error) {
      console.error('❌ Error running report:', error)
      setRunReportData(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Failed to run report. Please check your data and try again.' 
      }))
    }
  }, [runDialog, spreadsheetData, fetchReportData, forceSpreadsheetUpdate])

  // Export to Excel
  const handleExportToExcel = useCallback(() => {
    if (spreadsheetRef.current) {
      const data = spreadsheetRef.current.getData()
      const ws = XLSX.utils.aoa_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Consolidation Report')
      XLSX.writeFile(wb, `${reportConfig.name || 'consolidation_report'}.xlsx`)
    }
  }, [reportConfig.name])

  // Import from Excel
  const handleImportFromExcel = useCallback((event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        setSpreadsheetData(prev => {
          const newSheets = [...prev.sheets]
          const sheet = { ...newSheets[prev.activeSheetIndex] }
          sheet.data = jsonData
          newSheets[prev.activeSheetIndex] = sheet
          return { ...prev, sheets: newSheets }
        })
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  // Initialize component
  useEffect(() => {
    loadHierarchyData()
    
    // Load existing report if provided
    if (report?.id) {
      handleLoadReport(report.id)
    }
  }, [loadHierarchyData, handleLoadReport, report?.id])

  // Add keyboard event listener for Delete key
  useEffect(() => {
    const handleKeyDownEvent = (e) => {
      handleKeyDown(e)
    }
    
    document.addEventListener('keydown', handleKeyDownEvent)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDownEvent)
    }
  }, [handleKeyDown])

  // Force update spreadsheet when data changes
  useEffect(() => {
    if (spreadsheetData.sheets[spreadsheetData.activeSheetIndex].data.length > 0) {
      setTimeout(() => {
        forceSpreadsheetUpdate()
      }, 200)
    }
  }, [spreadsheetData.sheets[spreadsheetData.activeSheetIndex].data, forceSpreadsheetUpdate])

  // ===== RENDER FUNCTIONS =====
  
  // Render Run Report Modal
  const renderRunReportModal = () => {
    if (!runReportData.showModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Report Results
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Live data from PostgreSQL tb_entries table
                </p>
              </div>
            </div>
            <button
              onClick={() => setRunReportData(prev => ({ ...prev, showModal: false }))}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {runReportData.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Fetching data from PostgreSQL...</p>
                </div>
              </div>
            ) : runReportData.error ? (
              <div className="text-center py-12">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                  <p className="text-red-700 dark:text-red-300 font-medium">Error</p>
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{runReportData.error}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Mapped Elements Section */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Database className="h-4 w-4 mr-2 text-blue-600" />
                    Mapped Elements ({runReportData.mappedElements.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {runReportData.mappedElements.map((element, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          element.type === 'account'
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            element.type === 'account'
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : 'bg-green-100 dark:bg-green-900/30'
                          }`}>
                            {element.type === 'account' ? (
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {element.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {element.code} • {element.type}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Position: {element.position}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fetched Amounts Section */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                    Fetched Amounts ({runReportData.fetchedAmounts.length})
                  </h4>
                  {runReportData.fetchedAmounts.length > 0 ? (
                    <div className="space-y-3">
                      {runReportData.fetchedAmounts.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                                  <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.account.name} ({item.account.code})
                                </span>
                              </div>
                              <span className="text-gray-400">+</span>
                              <div className="flex items-center space-x-2">
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                                  <Building2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.entity.name} ({item.entity.code})
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                ${item.amount.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.position}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                        <p className="text-yellow-700 dark:text-yellow-300 font-medium">No Amounts Found</p>
                        <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
                          No matching data found in tb_entries for the current period
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Period: {reportFilters.period.values[0]} • 
              Total Elements: {runReportData.mappedElements.length} • 
              Found Amounts: {runReportData.fetchedAmounts.length}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setRunReportData(prev => ({ ...prev, showModal: false }))}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // TODO: Implement "Apply to Spreadsheet" functionality
                  console.log('Apply amounts to spreadsheet')
                  setRunReportData(prev => ({ ...prev, showModal: false }))
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Apply to Spreadsheet
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Render tree structure with nodes and elements
  const renderTreeNode = useCallback((node, level = 0, hierarchyType = 'entity') => {
    const isExpanded = expandedNodes[node.id]
    const hasChildren = node.children && node.children.length > 0
    const indentClass = `ml-${level * 4}`
    
    return (
      <div key={node.id} className="space-y-1">
        {/* Node Header */}
        <div className={`flex items-center space-x-2 p-2 rounded-md transition-all ${indentClass}`}>
          {hasChildren && (
            <button
              onClick={() => toggleNodeExpansion(node.id)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500" />
              )}
            </button>
          )}
          
          {!hasChildren && <div className="w-5" />}
          
          <div className="flex-shrink-0">
            <div className={`p-1 rounded-sm ${
              hierarchyType === 'entity' 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              {hierarchyType === 'entity' ? (
                <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              ) : (
                <FileText className="h-3 w-3 text-green-600 dark:text-green-400" />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {node.name || node.entity_name || node.account_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {node.code || node.entity_code || node.account_code} • {node.type || 'Node'}
            </p>
          </div>
        </div>
        
        {/* Node Children */}
        {isExpanded && hasChildren && (
          <div className="space-y-1">
            {node.children.map((child, index) => (
              <div
                key={`${child.id}-${index}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    ...child,
                    type: hierarchyType === 'entity' ? 'entity' : 'account',
                    hierarchy_id: node.hierarchy_id
                  }))
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                className={`ml-4 flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 cursor-move transition-all`}
              >
                <div className="flex-shrink-0">
                  <div className={`p-1 rounded-sm ${
                    hierarchyType === 'entity' 
                      ? 'bg-blue-100 dark:bg-blue-900/30' 
                      : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {hierarchyType === 'entity' ? (
                      <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <FileText className="h-3 w-3 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {child.name || child.entity_name || child.account_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {child.code || child.entity_code || child.account_code} • {child.type || 'Element'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }, [expandedNodes, toggleNodeExpansion])
  
  // Render hierarchy sidebar - Comprehensive implementation with real PostgreSQL data
  const renderHierarchySidebar = () => (
    <div className="h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
              <Database className="h-3 w-3 mr-1.5 text-blue-600" />
              IFRS Data Sources
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Drag & drop to build your report
            </p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={loadHierarchyData}
              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3 w-3 ${uiState.isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${uiState.isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className={`font-medium ${uiState.isLive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
            {uiState.isLive ? 'Live Data Connected' : 'Offline Mode'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {uiState.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Loading data sources...</p>
            </div>
          </div>
        ) : uiState.error ? (
          <div className="p-4 text-center">
            <div className="text-red-500 text-sm mb-2">⚠️ {uiState.error}</div>
            <button
              onClick={loadHierarchyData}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        ) : (
        <div className="p-3 space-y-4">
            {/* Entity Hierarchies Section */}
            {hierarchyData.entityHierarchies && hierarchyData.entityHierarchies.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Entity Hierarchies</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                        {hierarchyData.entityHierarchies.length} hierarchies
                  </p>
                </div>
              </div>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </div>
            
                <div className="ml-4 space-y-3">
                  {hierarchyData.entityHierarchies.map((hierarchy) => {
                    const hierarchyStructure = hierarchyStructures[hierarchy.id]
                    const hasStructure = hierarchyStructure && hierarchyStructure.nodes && hierarchyStructure.nodes.length > 0
                    
                    return (
                      <div key={hierarchy.id} className="space-y-2">
                        {/* Hierarchy Header with Load Structure Button */}
                        <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                          <button
                            onClick={() => {
                              if (!hierarchyStructure) {
                                loadHierarchyStructure(hierarchy.id, 'entity')
                              } else {
                                toggleNodeExpansion(`hierarchy-${hierarchy.id}`)
                              }
                            }}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded transition-colors"
                          >
                            {hierarchyStructure ? (
                              expandedNodes[`hierarchy-${hierarchy.id}`] ? (
                                <ChevronDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              )
                            ) : (
                              <ChevronRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            )}
                          </button>
                          
                          <div className="flex-shrink-0">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-sm">
                              <Layers className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 truncate">
                              {hierarchy.name}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                              {hasStructure ? `${hierarchyStructure.nodes.length} nodes` : `${hierarchy.children.length} entities`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Show Tree Structure if loaded */}
                        {hierarchyStructure && expandedNodes[`hierarchy-${hierarchy.id}`] && (
                          <div className="ml-4 space-y-1">
                            {hierarchyStructure.nodes.map((node, index) => 
                              <div key={`entity-node-${node.id}-${index}`}>
                                {renderTreeNode(node, 0, 'entity')}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Fallback to simple list if no structure loaded */}
                        {!hierarchyStructure && hierarchy.children.map((entity) => (
                <div
                  key={entity.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(entity))
                              e.dataTransfer.effectAllowed = 'copy'
                  }}
                            className="ml-4 flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 cursor-move transition-all"
                >
                  <div className="flex-shrink-0">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-sm">
                                <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {entity.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {entity.code} • {entity.metadata?.entity_type || 'Entity'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
                    )
                  })}
          </div>
              </div>
            )}

            {/* Account Hierarchies Section */}
            {hierarchyData.accountHierarchies && hierarchyData.accountHierarchies.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Account Hierarchies</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                        {hierarchyData.accountHierarchies.length} hierarchies
                  </p>
                </div>
              </div>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </div>
            
                <div className="ml-4 space-y-3">
                  {hierarchyData.accountHierarchies.map((hierarchy) => {
                    const hierarchyStructure = hierarchyStructures[hierarchy.id]
                    const hasStructure = hierarchyStructure && hierarchyStructure.nodes && hierarchyStructure.nodes.length > 0
                    
                    return (
                      <div key={hierarchy.id} className="space-y-2">
                        {/* Hierarchy Header with Load Structure Button */}
                        <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                          <button
                            onClick={() => {
                              if (!hierarchyStructure) {
                                loadHierarchyStructure(hierarchy.id, 'account')
                              } else {
                                toggleNodeExpansion(`hierarchy-${hierarchy.id}`)
                              }
                            }}
                            className="p-1 hover:bg-green-100 dark:hover:bg-green-800/30 rounded transition-colors"
                          >
                            {hierarchyStructure ? (
                              expandedNodes[`hierarchy-${hierarchy.id}`] ? (
                                <ChevronDown className="h-3 w-3 text-green-600 dark:text-green-400" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                              )
                            ) : (
                              <ChevronRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                            )}
                          </button>
                          
                          <div className="flex-shrink-0">
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-sm">
                              <Layers className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-green-900 dark:text-green-100 truncate">
                              {hierarchy.name}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-300">
                              {hasStructure ? `${hierarchyStructure.nodes.length} nodes` : `${hierarchy.children.length} accounts`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Show Tree Structure if loaded */}
                        {hierarchyStructure && expandedNodes[`hierarchy-${hierarchy.id}`] && (
                          <div className="ml-4 space-y-1">
                            {hierarchyStructure.nodes.map((node, index) => 
                              <div key={`account-node-${node.id}-${index}`}>
                                {renderTreeNode(node, 0, 'account')}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Fallback to simple list if no structure loaded */}
                        {!hierarchyStructure && hierarchy.children.map((account) => (
                <div
                  key={account.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(account))
                              e.dataTransfer.effectAllowed = 'copy'
                  }}
                            className="ml-4 flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 cursor-move transition-all"
                >
                  <div className="flex-shrink-0">
                    <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-sm">
                      <FileText className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {account.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {account.code} • {account.metadata?.ifrs_category || account.metadata?.account_type || 'Account'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
                    )
                  })}
          </div>
              </div>
            )}

            {/* Unassigned Entities Section */}
            {hierarchyData.unassignedEntities && hierarchyData.unassignedEntities.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                      <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Unassigned Entities</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {hierarchyData.unassignedEntities.length} entities
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </div>
                
                <div className="ml-4 space-y-2">
                  {hierarchyData.unassignedEntities.map((entity) => (
                    <div
                      key={entity.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify(entity))
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-600 cursor-move transition-all"
                    >
                      <div className="flex-shrink-0">
                        <div className="p-1 bg-orange-100 dark:bg-orange-900/30 rounded-sm">
                          <Building2 className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {entity.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {entity.code} • {entity.metadata?.entity_type || 'Entity'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unassigned Accounts Section */}
            {hierarchyData.unassignedAccounts && hierarchyData.unassignedAccounts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                      <FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Unassigned Accounts</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {hierarchyData.unassignedAccounts.length} accounts
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </div>
                
                <div className="ml-4 space-y-2">
                  {hierarchyData.unassignedAccounts.map((account) => (
                    <div
                      key={account.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify(account))
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300 dark:hover:border-yellow-600 cursor-move transition-all"
                    >
                      <div className="flex-shrink-0">
                        <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-sm">
                          <FileText className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {account.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {account.code} • {account.metadata?.ifrs_category || account.metadata?.account_type || 'Account'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Dimensions Section */}
            {hierarchyData.dimensions && hierarchyData.dimensions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                  <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Dimensions</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {hierarchyData.dimensions.length} dimensions
                  </p>
                </div>
              </div>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </div>
            
            <div className="ml-4 space-y-2">
                  {hierarchyData.dimensions.map((dimension) => (
                <div key={dimension.id} className="space-y-2">
                  <div className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                    <div className="flex-shrink-0">
                      <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-sm">
                            {dimension.icon ? <dimension.icon className="h-3 w-3 text-purple-600 dark:text-purple-400" /> : <Layers className="h-3 w-3 text-purple-600 dark:text-purple-400" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {dimension.name}
                      </p>
                    </div>
                  </div>
                  
                  {dimension.children && dimension.children.map((child) => (
                    <div
                      key={child.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify(child))
                            e.dataTransfer.effectAllowed = 'copy'
                      }}
                      className="ml-4 flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 cursor-move transition-all"
                    >
                      <div className="flex-shrink-0">
                        <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-sm">
                          <Circle className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {child.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
            )}

            {/* Instructions Panel */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    How to Build Your Report
                  </h4>
                  <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Drag <strong>accounts</strong> to cells - they'll show account codes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Drag <strong>entities</strong> to cells - they'll show entity names</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span>Click <strong>"Run Report"</strong> to fetch live data from PostgreSQL</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      <span>System will match account + entity combinations automatically</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {(!hierarchyData.entityHierarchies || hierarchyData.entityHierarchies.length === 0) &&
             (!hierarchyData.accountHierarchies || hierarchyData.accountHierarchies.length === 0) &&
             (!hierarchyData.unassignedEntities || hierarchyData.unassignedEntities.length === 0) &&
             (!hierarchyData.unassignedAccounts || hierarchyData.unassignedAccounts.length === 0) && (
              <div className="text-center py-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-20"></div>
                  <Database className="relative mx-auto h-12 w-12 text-gray-400" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                  No Data Sources Found
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Create hierarchies and entities in the Axes pages to see them here
                </p>
                <button
                  onClick={loadHierarchyData}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // Render properties panel
  const renderPropertiesPanel = () => (
    <div className="h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-l border-gray-200 dark:border-gray-700">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="h-3 w-3 mr-1.5 text-purple-600" />
            Cell Properties
          </h3>
          {uiState.selectedCell && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {String.fromCharCode(65 + uiState.selectedCell.col)}{uiState.selectedCell.row + 1}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-4">
          {uiState.selectedCell ? (
            <>
              {/* Cell Value */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Edit className="h-3 w-3 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Cell Value</h4>
                </div>
                <input
                  type="text"
                  value={uiState.selectedCell.value || ''}
                  onChange={(e) => {
                    if (spreadsheetRef.current) {
                      spreadsheetRef.current.setValue(uiState.selectedCell.row, uiState.selectedCell.col, e.target.value)
                    }
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="Enter cell value..."
                />
              </div>

              {/* Cell Formatting */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Type className="h-3 w-3 text-green-600" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Formatting</h4>
                </div>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all">
                    <span>Number Format</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <button className="w-full flex items-center justify-between p-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-all">
                    <span>Currency Format</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <button className="w-full flex items-center justify-between p-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-all">
                    <span>Date Format</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Cell Styling */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Palette className="h-3 w-3 text-pink-600" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Styling</h4>
                </div>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-md transition-all">
                    <span>Text Color</span>
                    <div className="w-4 h-4 bg-black rounded border"></div>
                  </button>
                  <button className="w-full flex items-center justify-between p-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-md transition-all">
                    <span>Background Color</span>
                    <div className="w-4 h-4 bg-white border rounded"></div>
                  </button>
                  <button className="w-full flex items-center justify-between p-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-md transition-all">
                    <span>Border Style</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-3 w-3 text-yellow-600" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Advanced</h4>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      // Add formula functionality
                      console.log('Add formula clicked')
                    }}
                    className="w-full flex items-center justify-between p-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-md transition-all"
                  >
                    <span>Add Formula</span>
                    <Calculator className="h-3 w-3" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-md transition-all">
                    <span>Color Formatting</span>
                    <Palette className="h-3 w-3" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all">
                    <span>Add Comment</span>
                    <MessageSquare className="h-3 w-3" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-all">
                    <span>Link to Source</span>
                    <Link className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-20"></div>
                <Grid className="relative mx-auto h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                No Cell Selected
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Click on a cell to view and edit its properties
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Render filter panel
  const renderFilterPanel = () => (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Report Filters</h3>
        <button
          onClick={() => setUiState(prev => ({ ...prev, showFilterPanel: false }))}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Period Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Period
          </label>
          <select
            value={reportFilters.period.values[0]}
            onChange={(e) => setReportFilters(prev => ({
              ...prev,
              period: { ...prev.period, values: [parseInt(e.target.value)] }
            }))}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
            <option value={2022}>2022</option>
          </select>
        </div>

        {/* Month Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Month (optional)
          </label>
          <input
            type="month"
            value={reportFilters.period.month || ''}
            onChange={(e) => setReportFilters(prev => ({
              ...prev,
              period: { ...prev.period, month: e.target.value }
            }))}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Entity Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Entity
          </label>
          <select
            value={reportFilters.entities.type}
            onChange={(e) => setReportFilters(prev => ({
              ...prev,
              entities: { ...prev.entities, type: e.target.value }
            }))}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Entities</option>
            <option value="selected">Selected Entities</option>
            <option value="excluded">Excluded Entities</option>
          </select>
        </div>

        {/* Currency Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Currency
          </label>
          <select
            value={reportFilters.currencies.values[0]}
            onChange={(e) => setReportFilters(prev => ({
              ...prev,
              currencies: { ...prev.currencies, values: [e.target.value] }
            }))}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>
    </div>
  )

  // Clean column definitions - no demo data
  const columns = [
    { 
      type: 'text', 
      title: 'Account Code', 
      width: 120,
      align: 'left',
      readOnly: false
    },
    { 
      type: 'text', 
      title: 'Account Name', 
      width: 200,
      align: 'left',
      readOnly: false
    },
    { 
      type: 'numeric', 
      title: 'Amount', 
      width: 150,
      align: 'right',
      mask: '$ #,##0',
      decimal: '.',
      readOnly: false
    }
  ]

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        description: report.description || '',
        report_type: report.report_type,
        category: report.category || '',
        is_public: report.is_public,
        is_template: report.is_template
      })
      
      if (report.definition && report.definition.spreadsheetData) {
        setSpreadsheetData(report.definition.spreadsheetData)
      }
    }
    
    loadHierarchyData()
  }, [report])


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Report name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      // Snapshot current sheet data from the grid into our structured state
      let updatedSpreadsheetData = spreadsheetData
      if (spreadsheetRef.current && spreadsheetRef.current[0]) {
        const data = spreadsheetRef.current[0].getData()
        updatedSpreadsheetData = {
          ...spreadsheetData,
          sheets: spreadsheetData.sheets.map((s, idx) => (
            idx === spreadsheetData.activeSheetIndex ? { ...s, data } : s
          ))
        }
      }

      const reportData = {
        ...formData,
        definition: {
          spreadsheetData: updatedSpreadsheetData,
          columns: columns,
          notes: notes,
          formulas: formulas,
          cellColors: cellColors
        }
      }
      
      await onSave(reportData)
    } catch (err) {
      console.error('Error saving report:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDragFromHierarchy = (draggedItem, targetPosition = {}) => {
    const { row: targetRow = null, col: targetCol = null } = targetPosition || {}
    if (spreadsheetRef.current && spreadsheetRef.current[0]) {
      const row = targetRow !== null ? targetRow : (uiState.selectedCell?.row ?? 0)
      const col = targetCol !== null ? targetCol : (uiState.selectedCell?.col ?? 0)
      
      // Insert the dragged item into the target cell
      spreadsheetRef.current[0].setValue(row, col, draggedItem.name)
      
      // If it's a parent item with children, add them as nested rows
      if (draggedItem.data && draggedItem.data.children) {
        const children = draggedItem.data.children
        children.forEach((child, index) => {
          const childRow = row + index + 1
          spreadsheetRef.current[0].setValue(childRow, col, `  ${child.name}`)
        })
      }
    }
  }

  const addCustomRow = () => {
    if (spreadsheetRef.current) {
      const newRow = ['', '', '', '', '', '']
      const currentData = spreadsheetRef.current.getData()
      currentData.push(newRow)
      setSpreadsheetData([...currentData])
    }
  }

  const deleteRow = () => {
    if (spreadsheetRef.current && spreadsheetRef.current[0] && uiState.selectedCell) {
      const currentData = spreadsheetRef.current[0].getData()
      if (currentData.length > 1) { // Keep at least header row
        currentData.splice(uiState.selectedCell.row, 1)
        setSpreadsheetData(prev => {
          const newSheets = [...prev.sheets]
          const sheet = { ...newSheets[prev.activeSheetIndex] }
          sheet.data = currentData
          newSheets[prev.activeSheetIndex] = sheet
          return { ...prev, sheets: newSheets }
        })
      }
    }
  }

  const addFormula = () => {
    if (uiState.selectedCell) {
      setUiState(prev => ({ ...prev, showFormulaEditor: true }))
    }
  }

  const handleFormulaSave = (formula) => {
    if (spreadsheetRef.current && uiState.selectedCell) {
      const { row, col } = uiState.selectedCell
      spreadsheetRef.current.setValue(row, col, formula)
      // Update formulas in spreadsheet data
      setSpreadsheetData(prev => {
        const newSheets = [...prev.sheets]
        const sheet = { ...newSheets[prev.activeSheetIndex] }
        sheet.formulas[`${row}_${col}`] = formula
        newSheets[prev.activeSheetIndex] = sheet
        return { ...prev, sheets: newSheets }
      })
    }
  }

  const exportToExcel = () => {
    if (spreadsheetRef.current) {
      const data = spreadsheetRef.current.getData()
      const ws = XLSX.utils.aoa_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Report')
      XLSX.writeFile(wb, `${formData.name || 'report'}.xlsx`)
    }
  }

  const importFromExcel = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        setSpreadsheetData(prev => {
          const newSheets = [...prev.sheets]
          const sheet = { ...newSheets[prev.activeSheetIndex] }
          sheet.data = jsonData
          newSheets[prev.activeSheetIndex] = sheet
          return { ...prev, sheets: newSheets }
        })
      }
      reader.readAsArrayBuffer(file)
    }
  }



  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
              placeholder="Enter report name"
            />
            {errors.name && (
              <span className="text-sm text-red-600">{errors.name}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <label className="inline-flex items-center px-3 py-1.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
              <Upload className="h-3 w-3 mr-1" />
              Import
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={importFromExcel}
                className="hidden"
              />
            </label>
            
            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </button>
            
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Save Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Hierarchy */}
        <div className={`${uiState.showHierarchyPanel ? (uiState.hierarchyPanelCollapsed ? 'w-16' : 'w-64') : 'w-0'} transition-all duration-300 overflow-hidden`}>
          {uiState.showHierarchyPanel && (
            <div className="h-full flex flex-col">
              {/* Sidebar Header with Toggle */}
              <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex-shrink-0">
                {!uiState.hierarchyPanelCollapsed && (
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">IFRS Data Sources</h3>
                  </div>
                )}
                <button
                  onClick={() => setUiState(prev => ({ ...prev, hierarchyPanelCollapsed: !prev.hierarchyPanelCollapsed }))}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={uiState.hierarchyPanelCollapsed ? "Expand panel" : "Collapse panel"}
                >
                  {uiState.hierarchyPanelCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 overflow-hidden">
                {!uiState.hierarchyPanelCollapsed && renderHierarchySidebar()}
              </div>
            </div>
          )}
        </div>

        {/* Main Spreadsheet Area */}
        <div className="flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
          {/* Sheet Tabs */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-4 py-1">
              <div className="flex items-center space-x-1">
                {spreadsheetData.sheets.map((sheet, index) => (
                  <div
                    key={sheet.id}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-t-md cursor-pointer transition-all ${
                      index === spreadsheetData.activeSheetIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => switchToSheet(index)}
                  >
                    <span className="text-sm font-medium">{sheet.name}</span>
                    {spreadsheetData.sheets.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSheet(index)
                        }}
                        className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete sheet"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addNewSheet}
                  className="flex items-center space-x-1 px-2 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-all"
                  title="Add new sheet"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add Sheet</span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Toolbar */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-2">
              {/* Left Section - Row Operations */}
              <div className="flex items-center space-x-1">
                <div className="flex items-center space-x-1 pr-3 border-r border-gray-200 dark:border-gray-700">
                <button
                  onClick={addCustomRow}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-all"
                    title="Add Row"
                >
                    <Plus className="h-4 w-4" />
                </button>
                
                <button
                  onClick={deleteRow}
                  disabled={!uiState.selectedCell}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete Row"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
                </div>
                
                {/* Formatting Tools */}
                <div className="flex items-center space-x-1 pl-3 border-r border-gray-200 dark:border-gray-700">
                <button
                  onClick={addFormula}
                  disabled={!uiState.selectedCell}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add Formula"
                  >
                    <Calculator className="h-4 w-4" />
                  </button>
                  
                  <button
                    disabled={!uiState.selectedCell}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Format Cell"
                  >
                    <Type className="h-4 w-4" />
                  </button>
                  
                  <button
                    disabled={!uiState.selectedCell}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cell Properties"
                  >
                    <Settings className="h-4 w-4" />
                </button>
              </div>
              
                {/* Alignment Tools */}
                <div className="flex items-center space-x-1 pl-3 border-r border-gray-200 dark:border-gray-700">
                  <button
                    disabled={!uiState.selectedCell}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Align Left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </button>
                  
                  <button
                    disabled={!uiState.selectedCell}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Align Center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </button>
                  
                  <button
                    disabled={!uiState.selectedCell}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Align Right"
                  >
                    <AlignRight className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Run Report Button */}
                <div className="flex items-center space-x-1 pl-3">
                  <button
                    onClick={handleRunReport}
                    disabled={runReportData.isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Run Report with Live Data"
                  >
                    {runReportData.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {runReportData.isLoading ? 'Running...' : 'Run Report'}
                    </span>
                  </button>
                  
                  {/* Selected Cell Indicator */}
                  {uiState.selectedCell ? (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-md">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                        Drop target: {String.fromCharCode(65 + uiState.selectedCell.col)}{uiState.selectedCell.row + 1}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-md">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs text-red-700 dark:text-red-300 font-medium">
                        Click a cell first, then drop elements
                      </span>
                    </div>
                  )}
                  
                  {/* Mapping Status Indicator */}
                  {(() => {
                    const currentSheet = spreadsheetData.sheets[spreadsheetData.activeSheetIndex]
                    const metadata = currentSheet.metadata || {}
                    const totalMappings = Object.keys(metadata.cellMapping || {}).length + 
                                        Object.keys(metadata.rowMapping || {}).length + 
                                        Object.keys(metadata.columnMapping || {}).length
                    
                    return totalMappings > 0 && (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                          {totalMappings} mapped
                        </span>
                      </div>
                    )
                  })()}
                  
                  {/* Debug Button */}
                  <button
                    onClick={() => {
                      console.log('🔍 Debug Info:')
                      console.log('Spreadsheet Data:', spreadsheetData)
                      console.log('Current Sheet:', spreadsheetData.sheets[spreadsheetData.activeSheetIndex])
                      console.log('Spreadsheet Ref:', spreadsheetRef.current)
                      console.log('UI State:', uiState)
                      console.log('Selected Cell:', uiState.selectedCell)
                      forceSpreadsheetUpdate()
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded"
                    title="Debug Spreadsheet"
                  >
                    Debug
                  </button>
                  
                  {/* Test Cell Selection Button */}
                  <button
                    onClick={() => {
                      // Manually set a selected cell for testing
                      setUiState(prev => ({
                        ...prev,
                        selectedCell: {
                          row: 2,
                          col: 3,
                          value: 'Test',
                          range: { x1: 3, y1: 2, x2: 3, y2: 2 }
                        }
                      }))
                      console.log('🧪 Manually set selected cell to D3')
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 rounded"
                    title="Test Cell Selection"
                  >
                    Test D3
                  </button>
                </div>
              </div>
              
              {/* Right Section - Status and Mode */}
              <div className="flex items-center space-x-3">
                {/* Cell Info */}
                {uiState.selectedCell && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {String.fromCharCode(65 + uiState.selectedCell.col)}{uiState.selectedCell.row + 1}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {uiState.selectedCell.value || 'Empty'}
                    </span>
                  </div>
                )}
                
                {/* Live Mode Toggle */}
                <button
                  onClick={() => setUiState(prev => ({ ...prev, isLive: !prev.isLive }))}
                  className={`flex items-center space-x-2 px-3 py-1.5 text-xs rounded-md transition-all ${
                    uiState.isLive 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                  title={uiState.isLive ? "Live Mode Active" : "Offline Mode"}
                >
                  <div className={`w-2 h-2 rounded-full ${uiState.isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="font-medium">{uiState.isLive ? 'Live' : 'Offline'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Spreadsheet Container with proper scrolling */}
          <div className="flex-1 p-3 overflow-hidden">
            <div 
              className="h-full w-full rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white overflow-auto"
              style={{ height: '100%', minHeight: '600px' }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                let dragData = e.dataTransfer.getData('application/json')
                if (!dragData) {
                  dragData = e.dataTransfer.getData('text/plain')
                }
                if (dragData) {
                  try {
                    const draggedItem = JSON.parse(dragData)
                    console.log('🎯 Dropped item:', draggedItem)
                    
                    // Prefer exact cell under cursor; treat near-top as column header drop
                    let row = 0
                    let col = 0
                    let isHeaderDrop = false
                    if (spreadsheetRef.current && spreadsheetRef.current[0] && typeof spreadsheetRef.current[0].getCellFromCoords === 'function') {
                      const tableRect = e.currentTarget.getBoundingClientRect()
                      const pxX = e.clientX - tableRect.left
                      const pxY = e.clientY - tableRect.top
                      const coords = spreadsheetRef.current[0].getCellFromCoords(pxX, pxY)
                      if (coords && typeof coords.x === 'number' && typeof coords.y === 'number') {
                        col = coords.x
                        row = coords.y
                        // Heuristic: if close to header area, treat as header mapping
                        if (pxY < 40 || row < 0) {
                          isHeaderDrop = true
                        }
                        console.log('🎯 Using cell under cursor:', { row, col, isHeaderDrop })
                      } else if (uiState.selectedCell) {
                        row = uiState.selectedCell.row
                        col = uiState.selectedCell.col
                        console.log('🎯 Fallback to selected cell:', { row, col })
                      }
                    } else if (uiState.selectedCell) {
                      row = uiState.selectedCell.row
                      col = uiState.selectedCell.col
                      console.log('🎯 Fallback to selected cell (no API):', { row, col })
                    }
                    
                    console.log('🎯 Drop Position:', {
                      selectedCell: uiState.selectedCell,
                      finalPosition: { row, col },
                      instruction: 'Click a cell first, then drop elements there'
                    })
                    
                    console.log('🎯 Final position:', { row, col })
                    
                    console.log('🎯 Drop position calculated:', { 
                      original: { x, y }, 
                      cell: { row, col },
                      corrected: { row: row, col: col },
                      item: draggedItem.name 
                    })
                    
                    // Ensure grid has enough rows before setting (avoid setData broadcasting)
                    if (spreadsheetRef.current && spreadsheetRef.current[0]) {
                      const grid = spreadsheetRef.current[0]
                      const neededRow = isHeaderDrop ? 0 : row
                      let currentLen = (grid.getData() || []).length
                      while (currentLen <= neededRow) {
                        grid.insertRow()
                        currentLen += 1
                      }
                    }
                    // Use the enhanced drop handler (header drop passes row=null)
                    handleHierarchyDrop(draggedItem, { row: isHeaderDrop ? null : row, col })
                  } catch (err) {
                    console.error('Error parsing drag data:', err)
                  }
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-600')
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-600')
              }}
            >
              <Spreadsheet
                ref={spreadsheetRef}
                tabs={true}
                toolbar={customToolbar}
                contextMenu={true}
                allowLiability={true}
                allowAsset={true}
                allowCash={true}
                allowInventory={true}
                allowReceivable={true}
                allowPayable={true}
                allowLoan={true}
                allowInvestment={true}
                allowDepreciation={true}
                allowAmortization={true}
                allowAccrual={true}
                allowDeferral={true}
                allowPrepaid={true}
                allowUnearned={true}
                allowContingent={true}
                allowProvisional={true}
                allowEstimated={true}
                allowActual={true}
                allowBudgeted={true}
                allowForecasted={true}
                allowProjected={true}
                allowPlanned={true}
                allowTargeted={true}
                allowExpected={true}
                allowPotential={true}
                allowPossible={true}
                allowProbable={true}
                allowCertain={true}
                allowGuaranteed={true}
                allowSecured={true}
                allowUnsecured={true}
                allowShortTerm={true}
                allowLongTerm={true}
                allowCurrent={true}
                allowNonCurrent={true}
                allowOperating={true}
                allowNonOperating={true}
                allowFinancing={true}
                allowInvesting={true}
                allowCashFlow={true}
                allowIncome={true}
                allowExpense={true}
                allowGross={true}
                allowNet={true}
                allowEBITDA={true}
                allowEBIT={true}
                allowEBT={true}
                allowEAT={true}
                allowEPS={true}
                allowDPS={true}
                allowROE={true}
                allowROA={true}
                allowROI={true}
                allowROCE={true}
                allowROIC={true}
                    onselection={(instance, borderLeftIndex, borderTopIndex, borderRightIndex, borderBottomIndex, origin) => {
                      console.log('🎯 Cell selected via onselection:', { 
                        borderLeftIndex, 
                        borderTopIndex, 
                        borderRightIndex, 
                        borderBottomIndex, 
                        origin 
                      })
                      
                      // Use the first selected cell coordinates (guard negative from header select)
                      const selectedRow = Math.max(0, borderTopIndex)
                      const selectedCol = Math.max(0, borderLeftIndex)
                      
                      // Update the selected cell state
                      setUiState(prev => ({
                        ...prev,
                        selectedCell: {
                          row: selectedRow,
                          col: selectedCol,
                          value: instance ? instance.getValue(selectedRow, selectedCol) : '',
                          range: { 
                            x1: borderLeftIndex, 
                            y1: borderTopIndex, 
                            x2: borderRightIndex, 
                            y2: borderBottomIndex 
                          }
                        },
                        showPropertiesPanel: true
                      }))
                      
                      console.log('✅ Updated selectedCell via onselection:', { row: selectedRow, col: selectedCol })
                    }}
                onAfterChange={(instance, cell, x, y, value) => {
                  console.log('Cell changed:', { x, y, value })
                  handleCellChange(instance, cell, x, y, value)
                }}
              >
                <Worksheet
                  data={spreadsheetData.sheets[spreadsheetData.activeSheetIndex].data}
                  columns={columns}
                  minDimensions={[10, 6]}
                  allowComments={true}
                  allowInsertRow={true}
                  allowInsertColumn={true}
                  allowDeleteRow={true}
                  allowDeleteColumn={true}
                  allowRenameColumn={true}
                  allowResizeColumn={true}
                  allowResizeRow={true}
                  allowSort={true}
                  allowCopy={true}
                  allowPaste={true}
                  allowCut={true}
                  allowUndo={true}
                  allowRedo={true}
                  allowSearch={true}
                  allowFindAndReplace={true}
                  allowMerge={true}
                  allowFreeze={true}
                  allowHide={true}
                  allowShow={true}
                  allowExport={true}
                  allowImport={true}
                  allowPrint={true}
                  allowSave={true}
                  allowLoad={true}
                  allowShare={true}
                  allowCollaboration={true}
                  allowVersionControl={true}
                  allowAuditTrail={true}
                  allowWorkflow={true}
                  allowApproval={true}
                  allowNotification={true}
                  allowEmail={true}
                  allowSms={true}
                  allowPush={true}
                  allowWebhook={true}
                  allowApi={true}
                  allowIntegration={true}
                  allowCustomization={true}
                  allowTheming={true}
                  allowLocalization={true}
                  allowAccessibility={true}
                  allowKeyboard={true}
                  allowMouse={true}
                  allowTouch={true}
                  allowGesture={true}
                  allowVoice={true}
                  allowAi={true}
                  allowMachineLearning={true}
                  allowAnalytics={true}
                  allowReporting={true}
                  allowLiability={true}
                  allowAsset={true}
                  allowCash={true}
                  allowInventory={true}
                  allowReceivable={true}
                  allowPayable={true}
                  allowLoan={true}
                  allowInvestment={true}
                  allowDepreciation={true}
                  allowAmortization={true}
                  allowAccrual={true}
                  allowDeferral={true}
                  allowPrepaid={true}
                  allowUnearned={true}
                  allowContingent={true}
                  allowProvisional={true}
                  allowEstimated={true}
                  allowActual={true}
                  allowBudgeted={true}
                  allowForecasted={true}
                  allowProjected={true}
                  allowPlanned={true}
                  allowTargeted={true}
                  allowExpected={true}
                  allowPotential={true}
                  allowPossible={true}
                  allowProbable={true}
                  allowCertain={true}
                  allowGuaranteed={true}
                  allowSecured={true}
                  allowUnsecured={true}
                  allowShortTerm={true}
                  allowLongTerm={true}
                  allowCurrent={true}
                  allowNonCurrent={true}
                  allowOperating={true}
                  allowNonOperating={true}
                  allowFinancing={true}
                  allowInvesting={true}
                  allowCashFlow={true}
                  allowIncome={true}
                  allowExpense={true}
                  allowGross={true}
                  allowNet={true}
                  allowEBITDA={true}
                  allowEBIT={true}
                  allowEBT={true}
                  allowEAT={true}
                  allowEPS={true}
                  allowDPS={true}
                  allowROE={true}
                  allowROA={true}
                  allowROI={true}
                  allowROCE={true}
                  allowROIC={true}
                />
              </Spreadsheet>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties (Only shows when cell is selected) */}
        <div className={`${uiState.showPropertiesPanel && uiState.selectedCell ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden`}>
          {uiState.showPropertiesPanel && uiState.selectedCell && (
            <div className="h-full flex flex-col">
              {/* Properties Panel Header with Close Button */}
              <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cell Properties</h3>
                  {uiState.selectedCell && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {String.fromCharCode(65 + uiState.selectedCell.col)}{uiState.selectedCell.row + 1}
                    </span>
                  )}
        </div>
                <button
                  onClick={() => setUiState(prev => ({ ...prev, showPropertiesPanel: false }))}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Close properties panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Properties Panel Content */}
              <div className="flex-1 overflow-hidden">
                {/* Drop zone */}
                <div
                  onDrop={onPropertiesPanelDrop}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                  className="m-3 p-3 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800"
                >
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    Drag hierarchy or nodes here to link to selected cell
                  </div>
                  {panelDrop.droppedItem && (
                    <div className="mt-2 text-xs text-purple-700 dark:text-purple-300">
                      Selected: {panelDrop.droppedItem.name || panelDrop.droppedItem.entity_name || panelDrop.droppedItem.account_name}
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="px-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Insert Mode</label>
                    <select
                      value={panelDrop.insertMode}
                      onChange={(e) => setPanelDrop(prev => ({ ...prev, insertMode: e.target.value }))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    >
                      <option value="nodes">Insert Nodes</option>
                      <option value="elements">Insert Elements</option>
                      <option value="nodes_elements">Insert Nodes with Elements</option>
                      <option value="full_tree">Insert Nodes, Subnodes, and Elements</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Value Mode</label>
                    <select
                      value={panelDrop.valueMode}
                      onChange={(e) => setPanelDrop(prev => ({ ...prev, valueMode: e.target.value }))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    >
                      <option value="simple">Simple Value</option>
                      <option value="rollup">Roll-up Total</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Display</label>
                    <select
                      value={panelDrop.displayMode}
                      onChange={(e) => setPanelDrop(prev => ({ ...prev, displayMode: e.target.value }))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    >
                      <option value="code">Code only</option>
                      <option value="name">Name only</option>
                      <option value="both_h">Both (Code | Name)</option>
                      <option value="both_v">Both (Code over Name)</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="subtotal"
                      type="checkbox"
                      checked={panelDrop.showSubtotal}
                      onChange={(e) => setPanelDrop(prev => ({ ...prev, showSubtotal: e.target.checked }))}
                    />
                    <label htmlFor="subtotal" className="text-xs text-gray-700 dark:text-gray-300">Show node subtotal</label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Node Color</label>
                      <input type="color" value={panelDrop.nodeColor} onChange={(e) => setPanelDrop(prev => ({ ...prev, nodeColor: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Children Color</label>
                      <input type="color" value={panelDrop.childColor} onChange={(e) => setPanelDrop(prev => ({ ...prev, childColor: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Note / Comment</label>
                    <textarea
                      rows={3}
                      value={panelDrop.noteText}
                      onChange={(e) => setPanelDrop(prev => ({ ...prev, noteText: e.target.value }))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      placeholder="Add an audit note..."
                    />
                  </div>

                  <div>
                    <button
                      onClick={applyPanelHierarchy}
                      disabled={!panelDrop.droppedItem}
                      className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Existing panel content */}
                {renderPropertiesPanel()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Run Dialog */}
      {runDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Run Report
                </h3>
                <button
                  onClick={() => setRunDialog(prev => ({ ...prev, open: false }))}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={runDialog.year || 2025}
                    onChange={(e) => setRunDialog(prev => ({ ...prev, year: parseInt(e.target.value) || 2025 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="2025"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Month
                  </label>
                  <select
                    value={runDialog.period}
                    onChange={(e) => setRunDialog(prev => ({ ...prev, period: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="December">December</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setRunDialog(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDialogRunReport}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  Run Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Report Modal */}
      {renderRunReportModal()}
    </div>
  )
}

export default AdvancedJspreadsheetReportDesigner
