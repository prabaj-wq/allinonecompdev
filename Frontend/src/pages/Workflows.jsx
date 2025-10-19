import React, { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  FileText, 
  Calendar,
  Filter,
  Search,
  Download,
  Upload,
  Settings,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  UserCheck,
  UserX,
  MessageSquare,
  Paperclip,
  BarChart3,
  TrendingUp,
  Activity,
  Save,
  Copy,
  Share2,
  Zap,
  Target,
  GitBranch,
  FileCheck,
  AlertCircle,
  CheckSquare,
  Square,
  Circle,
  Triangle,
  Star
} from 'lucide-react'

const Workflows = () => {
  const [activeTab, setActiveTab] = useState('designer')
  const [workflows, setWorkflows] = useState([])
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [isDesigning, setIsDesigning] = useState(false)
  const [draggedBlock, setDraggedBlock] = useState(null)
  const [workflowCanvas, setWorkflowCanvas] = useState([])
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [workflowType, setWorkflowType] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [showBlockProperties, setShowBlockProperties] = useState(false)
  const [workflowTemplates, setWorkflowTemplates] = useState([])
  const [executingWorkflow, setExecutingWorkflow] = useState(null)
  const [executionProgress, setExecutionProgress] = useState(0)
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 })
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
  const [canvasZoom, setCanvasZoom] = useState(1)
  const [connectionLines, setConnectionLines] = useState([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState(null)

  // Sample workflow data
  const sampleWorkflows = [
    {
      id: 1,
      name: 'Monthly Close Process',
      description: 'End-of-month financial close workflow',
      status: 'active',
      progress: 75,
      participants: 8,
      dueDate: '2025-01-31',
      steps: [
        { id: 1, name: 'Trial Balance Review', status: 'completed', assignee: 'John Doe', dueDate: '2025-01-25' },
        { id: 2, name: 'Adjusting Entries', status: 'in-progress', assignee: 'Jane Smith', dueDate: '2025-01-27' },
        { id: 3, name: 'Financial Statements', status: 'pending', assignee: 'Mike Johnson', dueDate: '2025-01-29' },
        { id: 4, name: 'Management Review', status: 'pending', assignee: 'Sarah Wilson', dueDate: '2025-01-30' },
        { id: 5, name: 'Final Approval', status: 'pending', assignee: 'David Brown', dueDate: '2025-01-31' }
      ]
    },
    {
      id: 2,
      name: 'Quarterly Audit Process',
      description: 'Quarterly internal audit workflow',
      status: 'active',
      progress: 0,
      participants: 12,
      dueDate: '2025-03-31',
      steps: [
        { id: 1, name: 'Risk Assessment', status: 'pending', assignee: 'Audit Team', dueDate: '2025-03-15' },
        { id: 2, name: 'Field Work', status: 'pending', assignee: 'Audit Team', dueDate: '2025-03-25' },
        { id: 3, name: 'Report Drafting', status: 'pending', assignee: 'Audit Team', dueDate: '2025-03-28' },
        { id: 4, name: 'Management Review', status: 'pending', assignee: 'Management', dueDate: '2025-03-30' },
        { id: 5, name: 'Board Approval', status: 'pending', assignee: 'Board', dueDate: '2025-03-31' }
      ]
    }
  ]

  // Enhanced workflow blocks with integration capabilities
  const workflowBlocks = [
    { 
      id: 'task', 
      name: 'Task', 
      icon: '📋', 
      color: 'bg-blue-500',
      description: 'Assign work to users or teams',
      integration: ['Trial Balance', 'Journal Entries', 'Process Module']
    },
    { 
      id: 'approval', 
      name: 'Approval', 
      icon: '✅', 
      color: 'bg-green-500',
      description: 'Require approval before proceeding',
      integration: ['Consolidation', 'Financial Statements', 'Audit']
    },
    { 
      id: 'notification', 
      name: 'Notification', 
      icon: '🔔', 
      color: 'bg-yellow-500',
      description: 'Send automated notifications',
      integration: ['All Tabs']
    },
    { 
      id: 'decision', 
      name: 'Decision', 
      icon: '🤔', 
      color: 'bg-purple-500',
      description: 'Conditional workflow branching',
      integration: ['All Tabs']
    },
    { 
      id: 'integration', 
      name: 'Integration', 
      icon: '🔗', 
      color: 'bg-indigo-500',
      description: 'Connect with other system tabs',
      integration: ['Trial Balance', 'Consolidation', 'Forecast & Budget']
    },
    { 
      id: 'document', 
      name: 'Document', 
      icon: '📄', 
      color: 'bg-red-500',
      description: 'Upload or generate documents',
      integration: ['Financial Statements', 'Audit', 'Compliance']
    },
    { 
      id: 'calculation', 
      name: 'Calculation', 
      icon: '🧮', 
      color: 'bg-teal-500',
      description: 'Perform automated calculations',
      integration: ['Variance Analysis', 'Financial Ratios', 'Consolidation']
    },
    { 
      id: 'validation', 
      name: 'Validation', 
      icon: '🔍', 
      color: 'bg-orange-500',
      description: 'Validate data or results',
      integration: ['Trial Balance', 'Consolidation', 'Financial Statements']
    }
  ]

  // Pre-built workflow templates
  const defaultTemplates = [
    {
      id: 1,
      name: 'Monthly Close Process',
      category: 'Finance',
      icon: '📊',
      description: 'Standard monthly financial close process',
      workflow_structure: [
        { type: 'task', name: 'Upload Trial Balance', integration_tab: 'Trial Balance', assignee: 'Entity Owner' },
        { type: 'validation', name: 'Validate TB Data', integration_tab: 'Trial Balance', assignee: 'Finance Team' },
        { type: 'task', name: 'Enter IC Amounts', integration_tab: 'Process Module', assignee: 'Consolidation Team' },
        { type: 'task', name: 'Post Adjusting Entries', integration_tab: 'Journal Entries', assignee: 'Accounting Team' },
        { type: 'task', name: 'Run Consolidation', integration_tab: 'Consolidation', assignee: 'Consolidation Team' },
        { type: 'approval', name: 'Finance Lead Review', integration_tab: 'Consolidation', assignee: 'Finance Lead' },
        { type: 'task', name: 'Generate Financial Statements', integration_tab: 'Financial Statements', assignee: 'Reporting Team' },
        { type: 'approval', name: 'Final Approval', integration_tab: 'Financial Statements', assignee: 'CFO' }
      ]
    },
    {
      id: 2,
      name: 'Budget Planning Workflow',
      category: 'Planning',
      icon: '💰',
      description: 'Annual budget planning and approval process',
      workflow_structure: [
        { type: 'task', name: 'Draft Budget', integration_tab: 'Forecast & Budget', assignee: 'Budget Owner' },
        { type: 'approval', name: 'Manager Review', integration_tab: 'Forecast & Budget', assignee: 'Department Manager' },
        { type: 'task', name: 'Finance Consolidation', integration_tab: 'Consolidation', assignee: 'Finance Team' },
        { type: 'task', name: 'Variance Analysis', integration_tab: 'Variance Analysis', assignee: 'Analytics Team' },
        { type: 'approval', name: 'Final Approval', integration_tab: 'Financial Statements', assignee: 'Board' }
      ]
    },
    {
      id: 3,
      name: 'Quarterly Audit Process',
      category: 'Audit',
      icon: '🔍',
      description: 'Quarterly internal audit workflow',
      workflow_structure: [
        { type: 'task', name: 'Risk Assessment', integration_tab: 'Audit', assignee: 'Audit Team' },
        { type: 'task', name: 'Field Work', integration_tab: 'Audit', assignee: 'Audit Team' },
        { type: 'task', name: 'Report Drafting', integration_tab: 'Audit', assignee: 'Audit Team' },
        { type: 'approval', name: 'Management Review', integration_tab: 'Audit', assignee: 'Management' },
        { type: 'approval', name: 'Board Approval', integration_tab: 'Audit', assignee: 'Board' }
      ]
    }
  ]

  useEffect(() => {
    setWorkflows(sampleWorkflows)
    setWorkflowTemplates(defaultTemplates)
  }, [])

  const handleDragStart = (e, block) => {
    setDraggedBlock(block)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (draggedBlock) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left - canvasPosition.x) / canvasZoom
      const y = (e.clientY - rect.top - canvasPosition.y) / canvasZoom
      
      const newBlock = {
        id: Date.now(),
        type: draggedBlock.id,
        name: `${draggedBlock.name} ${workflowCanvas.length + 1}`,
        x: Math.max(0, x),
        y: Math.max(0, y),
        config: {
          assignee: '',
          integration_tab: '',
          integration_action: '',
          estimated_duration: 1,
          dependencies: []
        }
      }
      
      setWorkflowCanvas([...workflowCanvas, newBlock])
      setDraggedBlock(null)
      setIsDesigning(true)
    }
  }

  const handleCanvasMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      setIsDraggingCanvas(true)
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (isDraggingCanvas) {
      setCanvasPosition(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }))
    }
    
    // Update connection preview while connecting
    if (isConnecting && connectionStart) {
      const rect = e.currentTarget.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - canvasPosition.x) / canvasZoom
      const mouseY = (e.clientY - rect.top - canvasPosition.y) / canvasZoom
      
      // Update the preview line endpoint to follow mouse
      const previewLine = document.querySelector('#preview-line')
      if (previewLine) {
        previewLine.setAttribute('x2', (mouseX * canvasZoom) + canvasPosition.x + 20)
        previewLine.setAttribute('y2', (mouseY * canvasZoom) + canvasPosition.y + 20)
      }
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false)
  }

  const handleCanvasWheel = (e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    setCanvasZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.3), 2))
  }

  const handleBlockMouseDown = (e, block) => {
    e.stopPropagation()
    if (e.button === 0) { // Left click
      setSelectedBlock(block)
      setShowBlockProperties(true)
    } else if (e.button === 2) { // Right click
      e.preventDefault()
      setIsConnecting(true)
      setConnectionStart(block)
    }
  }

  const handleBlockMouseUp = (e, block) => {
    if (isConnecting && connectionStart && connectionStart.id !== block.id) {
      const newConnection = {
        id: Date.now(),
        from: connectionStart.id,
        to: block.id,
        type: 'default'
      }
      setConnectionLines([...connectionLines, newConnection])
      setIsConnecting(false)
      setConnectionStart(null)
    }
  }

  const resetCanvas = () => {
    setCanvasPosition({ x: 0, y: 0 })
    setCanvasZoom(1)
  }

  const deleteConnection = (connectionId) => {
    setConnectionLines(connectionLines.filter(conn => conn.id !== connectionId))
  }

  const clearAllConnections = () => {
    setConnectionLines([])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleBlockClick = (block) => {
    setSelectedBlock(block)
    setShowBlockProperties(true)
  }

  const handleBlockUpdate = (blockId, updates) => {
    setWorkflowCanvas(workflowCanvas.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ))
  }

  const handleSaveWorkflow = () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name')
      return
    }

    const newWorkflow = {
      id: Date.now(),
      name: workflowName,
      description: workflowDescription,
      type: workflowType,
      assigned_to: assignedTo,
      due_date: dueDate,
      status: 'active',
      progress: 0,
      participants: 1,
      steps: workflowCanvas.map((block, index) => ({
        id: index + 1,
        name: block.name,
        status: 'pending',
        assignee: block.config.assignee || 'Unassigned',
        dueDate: dueDate
      }))
    }

    setWorkflows([...workflows, newWorkflow])
    setWorkflowCanvas([])
    setIsDesigning(false)
    setWorkflowName('')
    setWorkflowDescription('')
    setWorkflowType('')
    setAssignedTo('')
    setDueDate('')
    setSelectedBlock(null)
    setShowBlockProperties(false)
  }

  const handleUseTemplate = (template) => {
    setWorkflowName(template.name)
    setWorkflowDescription(template.description)
    setWorkflowType(template.category)
    setWorkflowCanvas(template.workflow_structure.map((step, index) => ({
      id: Date.now() + index,
      type: step.type,
      name: step.name,
      x: 100 + (index * 200),
      y: 100,
      config: {
        assignee: step.assignee || '',
        integration_tab: step.integration_tab || '',
        integration_action: '',
        estimated_duration: 1,
        dependencies: []
      }
    })))
    setIsDesigning(true)
    setActiveTab('designer')
  }

  const handleExecuteWorkflow = (workflow) => {
    setExecutingWorkflow(workflow)
    setExecutionProgress(0)
    
    // Simulate workflow execution
    const interval = setInterval(() => {
      setExecutionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setExecutingWorkflow(null)
          return 0
        }
        return prev + 10
      })
    }, 500)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in-progress': return <Clock className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'overdue': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getBlockIcon = (type) => {
    const block = workflowBlocks.find(b => b.id === type)
    return block ? block.icon : '📋'
  }

  const getBlockColor = (type) => {
    const block = workflowBlocks.find(b => b.id === type)
    return block ? block.color : 'bg-gray-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Workflow Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Design, automate, and monitor business processes and workflows
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'designer', name: 'Workflow Designer', icon: '🎨' },
            { id: 'monitoring', name: 'Live Monitoring', icon: '📊' },
            { id: 'templates', name: 'Templates', icon: '📋' },
            { id: 'analytics', name: 'Analytics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Workflow Designer Tab */}
      {activeTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Workflow Blocks */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Workflow Blocks</h3>
              <div className="space-y-3">
                {workflowBlocks.map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, block)}
                    className={`p-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-move hover:border-slate-400 dark:hover:border-slate-500 transition-colors ${block.color} text-white`}
                  >
                    <div className="text-2xl mb-1">{block.icon}</div>
                    <div className="text-sm font-medium mb-1">{block.name}</div>
                    <div className="text-xs opacity-90">{block.description}</div>
                    <div className="text-xs opacity-75 mt-1">
                      Integrates with: {block.integration.slice(0, 2).join(', ')}
                      {block.integration.length > 2 && '...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Workflow Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Workflow Canvas</h3>
                <div className="flex items-center space-x-2">
                  <button onClick={resetCanvas} className="btn-secondary">
                    <Target className="h-4 w-4 mr-2" />
                    Reset View
                  </button>
                  <button className="btn-secondary">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </button>
                  <button className="btn-primary">
                    <Play className="h-4 w-4 mr-2" />
                    Test
                  </button>
                  {isDesigning && (
                    <button onClick={handleSaveWorkflow} className="btn-primary">
                      <Save className="h-4 w-4 mr-2" />
                      Save Workflow
                    </button>
                  )}
                </div>
              </div>
              
              {/* Canvas Controls */}
              <div className="flex items-center space-x-4 mb-4 text-sm text-slate-600 dark:text-slate-400">
                <span>Zoom: {Math.round(canvasZoom * 100)}%</span>
                <span>Position: ({Math.round(canvasPosition.x)}, {Math.round(canvasPosition.y)})</span>
                <span className="text-xs">💡 Drag canvas to move • Scroll to zoom • Right-click blocks to connect</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={clearAllConnections}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    disabled={connectionLines.length === 0}
                  >
                    Clear Connections
                  </button>
                  <span className="text-xs text-slate-500">
                    {connectionLines.length} custom connections
                  </span>
                </div>
              </div>
              
              <div
                className="min-h-96 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg relative overflow-hidden cursor-move"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onWheel={handleCanvasWheel}
                onContextMenu={(e) => e.preventDefault()}
              >
                {workflowCanvas.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-2">🚀</div>
                    <p className="text-slate-500 dark:text-slate-400">Start designing your workflow</p>
                    <button 
                      onClick={() => setIsDesigning(true)}
                      className="btn-primary mt-3"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start Designing
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Render workflow blocks */}
                    {workflowCanvas.map((block, index) => (
                      <div
                        key={block.id}
                        onMouseDown={(e) => handleBlockMouseDown(e, block)}
                        onMouseUp={(e) => handleBlockMouseUp(e, block)}
                        className={`absolute p-2 rounded-lg cursor-pointer transition-all hover:scale-110 ${
                          selectedBlock?.id === block.id ? 'ring-2 ring-blue-500' : ''
                        } ${getBlockColor(block.type)} text-white shadow-lg`}
                        style={{ 
                          left: (block.x * canvasZoom) + canvasPosition.x, 
                          top: (block.y * canvasZoom) + canvasPosition.y,
                          transform: `scale(${canvasZoom})`,
                          transformOrigin: 'top left'
                        }}
                      >
                        <div className="text-sm mb-1">{getBlockIcon(block.type)}</div>
                        <div className="text-xs font-medium text-center leading-tight">{block.name}</div>
                      </div>
                    ))}
                    
                    {/* Render custom connection lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {/* Auto-connections between sequential blocks */}
                      {workflowCanvas.length > 1 && workflowCanvas.slice(0, -1).map((block, index) => {
                        const nextBlock = workflowCanvas[index + 1]
                        const fromBlock = workflowCanvas.find(b => b.id === block.id)
                        const toBlock = workflowCanvas.find(b => b.id === nextBlock.id)
                        
                        if (fromBlock && toBlock) {
                          const fromX = (fromBlock.x * canvasZoom) + canvasPosition.x + 20
                          const fromY = (fromBlock.y * canvasZoom) + canvasPosition.y + 20
                          const toX = (toBlock.x * canvasZoom) + canvasPosition.x + 20
                          const toY = (toBlock.y * canvasZoom) + canvasPosition.y + 20
                          
                          return (
                            <g key={`auto-${block.id}-${nextBlock.id}`}>
                              <line
                                x1={fromX}
                                y1={fromY}
                                x2={toX}
                                y2={toY}
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                markerEnd="url(#arrowhead)"
                              />
                            </g>
                          )
                        }
                        return null
                      })}
                      
                      {/* Custom connection lines */}
                      {connectionLines.map((connection) => {
                        const fromBlock = workflowCanvas.find(b => b.id === connection.from)
                        const toBlock = workflowCanvas.find(b => b.id === connection.to)
                        
                        if (fromBlock && toBlock) {
                          const fromX = (fromBlock.x * canvasZoom) + canvasPosition.x + 20
                          const fromY = (fromBlock.y * canvasZoom) + canvasPosition.y + 20
                          const toX = (toBlock.x * canvasZoom) + canvasPosition.x + 20
                          const toY = (toBlock.y * canvasZoom) + canvasPosition.y + 20
                          
                          return (
                            <g key={connection.id}>
                              <line
                                x1={fromX}
                                y1={fromY}
                                x2={toX}
                                y2={toY}
                                stroke="#ef4444"
                                strokeWidth="3"
                                markerEnd="url(#customArrowhead)"
                              />
                            </g>
                          )
                        }
                        return null
                      })}
                      
                      {/* Connection preview while connecting */}
                      {isConnecting && connectionStart && (
                        <line
                          id="preview-line"
                          x1={(connectionStart.x * canvasZoom) + canvasPosition.x + 20}
                          y1={(connectionStart.y * canvasZoom) + canvasPosition.y + 20}
                          x2={(connectionStart.x * canvasZoom) + canvasPosition.x + 20}
                          y2={(connectionStart.y * canvasZoom) + canvasPosition.y + 20}
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeDasharray="3,3"
                          markerEnd="url(#previewArrowhead)"
                        />
                      )}
                      
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                        </marker>
                        <marker
                          id="customArrowhead"
                          markerWidth="12"
                          markerHeight="8"
                          refX="10"
                          refY="4"
                          orient="auto"
                        >
                          <polygon points="0 0, 12 4, 0 8" fill="#ef4444" />
                        </marker>
                        <marker
                          id="previewArrowhead"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                        </marker>
                      </defs>
                    </svg>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Properties</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Enter workflow name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Enter workflow description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Workflow Type
                  </label>
                  <select 
                    value={workflowType}
                    onChange={(e) => setWorkflowType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Select type</option>
                    <option value="Finance">Finance</option>
                    <option value="Audit">Audit</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Planning">Planning</option>
                    <option value="Projects">Projects</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Assignees
                  </label>
                  <select 
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Select assignees</option>
                    <option value="John Doe">John Doe</option>
                    <option value="Jane Smith">Jane Smith</option>
                    <option value="Mike Johnson">Mike Johnson</option>
                    <option value="Finance Team">Finance Team</option>
                    <option value="Audit Team">Audit Team</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Workflow Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Active Workflows', count: 12, color: 'bg-blue-500', icon: Activity },
              { title: 'Completed Today', count: 8, color: 'bg-green-500', icon: CheckCircle },
              { title: 'Overdue Tasks', count: 3, color: 'bg-red-500', icon: AlertTriangle },
              { title: 'Pending Approvals', count: 5, color: 'bg-yellow-500', icon: Clock }
            ].map((stat) => (
              <div key={stat.title} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow List */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Active Workflows</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search workflows..."
                      className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <button className="btn-secondary">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </button>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white">{workflow.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}>
                          {workflow.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mb-3">{workflow.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{workflow.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${workflow.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Workflow Steps */}
                      <div className="space-y-2">
                        {workflow.steps.map((step) => (
                          <div key={step.id} className="flex items-center space-x-3 text-sm">
                            <div className={`p-1 rounded-full ${getStatusColor(step.status)}`}>
                              {getStatusIcon(step.status)}
                            </div>
                            <span className="text-slate-700 dark:text-slate-300">{step.name}</span>
                            <span className="text-slate-500 dark:text-slate-500">→</span>
                            <span className="text-slate-600 dark:text-slate-400">{step.assignee}</span>
                            <span className="text-slate-500 dark:text-slate-500">Due: {step.dueDate}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-6">
                      <button 
                        onClick={() => handleExecuteWorkflow(workflow)}
                        className="btn-primary"
                        disabled={executingWorkflow?.id === workflow.id}
                      >
                        {executingWorkflow?.id === workflow.id ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Execute
                          </>
                        )}
                      </button>
                      <button className="btn-secondary">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </button>
                      <button className="btn-secondary">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                      <button className="btn-secondary">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Progress Modal */}
          {executingWorkflow && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96">
                <h3 className="text-lg font-semibold mb-4">Executing: {executingWorkflow.name}</h3>
                <div className="mb-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${executionProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{executionProgress}% Complete</p>
                </div>
                <div className="text-sm text-slate-600">
                  <p>Current Step: {executingWorkflow.steps[Math.floor(executionProgress / 20)]?.name || 'Initializing...'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowTemplates.map((template) => (
              <div key={template.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{template.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{template.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{template.category}</p>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{template.description}</p>
                
                {/* Template Steps Preview */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Workflow Steps:</p>
                  <div className="space-y-1">
                    {template.workflow_structure.slice(0, 3).map((step, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                        <div className={`w-2 h-2 rounded-full ${getBlockColor(step.type).replace('bg-', 'bg-')}`}></div>
                        <span>{step.name}</span>
                      </div>
                    ))}
                    {template.workflow_structure.length > 3 && (
                      <p className="text-xs text-slate-500">+{template.workflow_structure.length - 3} more steps</p>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleUseTemplate(template)}
                  className="btn-primary w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workflow Performance Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Workflow Performance</h3>
              <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Performance Chart</p>
                </div>
              </div>
            </div>

            {/* Task Completion Trends */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Task Completion Trends</h3>
              <div className="h-64 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                  <p>Trends Chart</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Key Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">85%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Average Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">2.3 days</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Average Task Duration</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">94%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">On-Time Delivery</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Properties Modal */}
      {showBlockProperties && selectedBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Block Properties: {selectedBlock.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Block Name
                </label>
                <input
                  type="text"
                  value={selectedBlock.name}
                  onChange={(e) => handleBlockUpdate(selectedBlock.id, { name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Assignee
                </label>
                <select
                  value={selectedBlock.config.assignee}
                  onChange={(e) => handleBlockUpdate(selectedBlock.id, { 
                    config: { ...selectedBlock.config, assignee: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Select assignee</option>
                  <option value="John Doe">John Doe</option>
                  <option value="Jane Smith">Jane Smith</option>
                  <option value="Mike Johnson">Mike Johnson</option>
                  <option value="Finance Team">Finance Team</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Integration Tab
                </label>
                <select
                  value={selectedBlock.config.integration_tab}
                  onChange={(e) => handleBlockUpdate(selectedBlock.id, { 
                    config: { ...selectedBlock.config, integration_tab: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Select tab</option>
                  <option value="Trial Balance">Trial Balance</option>
                  <option value="Journal Entries">Journal Entries</option>
                  <option value="Consolidation">Consolidation</option>
                  <option value="Forecast & Budget">Forecast & Budget</option>
                  <option value="Variance Analysis">Variance Analysis</option>
                  <option value="Audit">Audit</option>
                  <option value="Financial Statements">Financial Statements</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  value={selectedBlock.config.estimated_duration}
                  onChange={(e) => handleBlockUpdate(selectedBlock.id, { 
                    config: { ...selectedBlock.config, estimated_duration: parseInt(e.target.value) || 1 }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  min="1"
                />
              </div>
            </div>
                         
             {/* Connection Management */}
             <div className="border-t pt-4 mt-4">
               <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Connections</h4>
               <div className="space-y-2">
                 {connectionLines.filter(conn => conn.from === selectedBlock.id || conn.to === selectedBlock.id).map((connection) => (
                   <div key={connection.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-700 p-2 rounded">
                     <span>
                       {connection.from === selectedBlock.id ? 'From this block' : 'To this block'}
                     </span>
                     <button
                       onClick={() => deleteConnection(connection.id)}
                       className="text-red-500 hover:text-red-700"
                     >
                       ×
                     </button>
                   </div>
                 ))}
                 {connectionLines.filter(conn => conn.from === selectedBlock.id || conn.to === selectedBlock.id).length === 0 && (
                   <p className="text-xs text-slate-500">No connections</p>
                 )}
               </div>
             </div>
             
             <div className="flex justify-end space-x-3 mt-6">
               <button 
                 onClick={() => setShowBlockProperties(false)}
                 className="btn-secondary"
               >
                 Close
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Workflows
