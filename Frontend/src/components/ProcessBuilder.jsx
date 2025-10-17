import React, { useState, useCallback, useRef, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Trash2, Save, Copy, Settings, Plus, Play, ArrowLeft } from 'lucide-react'
import ProcessNodeTypes from './ProcessNodeTypes'
import ProcessElementSidebar from './ProcessElementSidebar'
import ProcessNodePanel from './ProcessNodePanel'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'

// Inner component that uses ReactFlow hooks
const ProcessBuilderCanvas = ({ processId, processName, onSave, onDelete, onBack, selectedCompany, getAuthHeaders }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [nodePanelOpen, setNodePanelOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [loadingWorkflow, setLoadingWorkflow] = useState(false)
  const { getNodes, getEdges, setCenter } = useReactFlow()
  const reactFlowWrapper = useRef(null)

  // Load workflow on mount
  useEffect(() => {
    if (processId) {
      loadWorkflow()
    } else {
      console.error('🔴 ProcessBuilder: processId is undefined!')
    }
  }, [processId])

  const loadWorkflow = async () => {
    if (!processId) {
      console.error('🔴 Cannot load workflow: processId is undefined')
      return
    }

    setLoadingWorkflow(true)
    try {
      const url = `/api/process/${processId}/workflow?company_name=${encodeURIComponent(selectedCompany)}`
      console.log('📥 Loading workflow from:', url)
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Workflow loaded:', data)
        if (data.nodes && data.edges) {
          setNodes(data.nodes)
          setEdges(data.edges)
          setIsDirty(false)
        }
      } else {
        console.warn(`⚠️ Workflow endpoint returned ${response.status}, starting with empty canvas`)
        // This is OK - new process might not have a saved workflow yet
      }
    } catch (error) {
      console.error('❌ Error loading workflow:', error)
      // Silently fail - user can start with empty canvas
    } finally {
      setLoadingWorkflow(false)
    }
  }

  const onConnect = useCallback(
    (connection) => {
      setEdges((eds) => addEdge(connection, eds))
      setIsDirty(true)
    },
    [setEdges]
  )

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
    setNodePanelOpen(true)
  }, [])

  const onNodesChangeInternal = useCallback(
    (changes) => {
      onNodesChange(changes)
      setIsDirty(true)
    },
    [onNodesChange]
  )

  const onEdgesChangeInternal = useCallback(
    (changes) => {
      onEdgesChange(changes)
      setIsDirty(true)
    },
    [onEdgesChange]
  )

  const addNode = useCallback((type, label) => {
    const id = `node-${Date.now()}`
    const newNode = {
      id,
      data: {
        label,
        type,
        config: {
          description: '',
          category: '',
          required: false,
          defaultValue: '',
        },
      },
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      type: type,
    }
    setNodes((nds) => [...nds, newNode])
    setIsDirty(true)
  }, [setNodes])

  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
    setIsDirty(true)
  }, [setNodes, setEdges])

  const duplicateNode = useCallback((node) => {
    const newId = `${node.id}-copy-${Date.now()}`
    const newNode = {
      ...node,
      id: newId,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
    }
    setNodes((nds) => [...nds, newNode])
    setIsDirty(true)
  }, [setNodes])

  const updateNodeData = useCallback((nodeId, data) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
    )
    setIsDirty(true)
  }, [setNodes])

  const handleSave = useCallback(async () => {
    if (!processId) {
      console.error('🔴 Save failed: Process ID is not set')
      alert('❌ Cannot save: Process ID is not set')
      return
    }

    if (!selectedCompany) {
      console.error('🔴 Save failed: Company is not selected')
      alert('❌ Cannot save: Company is not selected')
      return
    }

    setIsSaving(true)
    const workflow = {
      nodes: getNodes(),
      edges: getEdges(),
      process_id: processId,
    }

    try {
      const url = `/api/process/${processId}/workflow?company_name=${encodeURIComponent(selectedCompany)}`
      console.log('💾 Saving workflow to:', url)
      console.log('📦 Workflow data:', workflow)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(workflow),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to save workflow (${response.status}): ${error}`)
      }

      const result = await response.json()
      console.log('✅ Workflow saved successfully:', result)
      
      setIsDirty(false)
      alert('✅ Process workflow saved successfully!')
      onSave?.()
    } catch (error) {
      console.error('❌ Error saving workflow:', error)
      alert(`❌ Failed to save workflow: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }, [getNodes, getEdges, processId, selectedCompany, getAuthHeaders, onSave])

  const handleDeleteNode = useCallback(() => {
    if (selectedNode) {
      if (window.confirm('Delete this node?')) {
        deleteNode(selectedNode.id)
        setNodePanelOpen(false)
      }
    }
  }, [selectedNode, deleteNode])

  const handleCenter = useCallback(() => {
    if (nodes.length > 0) {
      setCenter(0, 0, { zoom: 1, duration: 800 })
    }
  }, [nodes, setCenter])

  const nodeTypes = ProcessNodeTypes

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <ProcessElementSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onAddNode={addNode}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Back to processes"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-white">{processName || 'Process Builder'}</h2>
            {isDirty && <span className="text-sm text-yellow-400">● Unsaved changes</span>}
            {loadingWorkflow && <span className="text-sm text-blue-400">⏳ Loading workflow...</span>}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCenter}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              title="Center view"
            >
              <Settings size={18} />
            </button>

            <button
              onClick={() => selectedNode && duplicateNode(selectedNode)}
              disabled={!selectedNode}
              className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-white transition-colors"
              title="Duplicate node"
            >
              <Copy size={18} />
            </button>

            <button
              onClick={handleDeleteNode}
              disabled={!selectedNode}
              className="p-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-white transition-colors"
              title="Delete node"
            >
              <Trash2 size={18} />
            </button>

            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
            >
              Delete Process
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeInternal}
            onEdgesChange={onEdgesChangeInternal}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#334155" gap={16} />
            <Controls position="top-left" />
            <MiniMap
              maskColor="rgba(0, 0, 0, 0.5)"
              position="bottom-right"
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(71, 85, 105, 0.5)',
              }}
            />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-slate-400 text-lg mb-4">👈 Drag elements from the sidebar to start</p>
                <p className="text-slate-500 text-sm">Click nodes to configure them</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node Configuration Panel */}
      <ProcessNodePanel
        isOpen={nodePanelOpen}
        onClose={() => setNodePanelOpen(false)}
        node={selectedNode}
        onUpdate={updateNodeData}
        onDelete={handleDeleteNode}
      />
    </div>
  )
}

// Outer wrapper component that provides ReactFlow context
const ProcessBuilder = (props) => {
  const { selectedCompany } = useCompany()
  const { getAuthHeaders } = useAuth()

  if (!props.processId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">❌ Process ID is required</p>
          <button
            onClick={props.onBack}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <ProcessBuilderCanvas
        {...props}
        selectedCompany={selectedCompany}
        getAuthHeaders={getAuthHeaders}
      />
    </ReactFlowProvider>
  )
}

export default ProcessBuilder