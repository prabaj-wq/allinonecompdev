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
  NodeTypes,
  Connection,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Trash2, Save, Copy, Settings, Plus, Play } from 'lucide-react'
import ProcessNodeTypes from './ProcessNodeTypes'
import ProcessElementSidebar from './ProcessElementSidebar'
import ProcessNodePanel from './ProcessNodePanel'

const ProcessBuilder = ({ processId, processName, onSave, onDelete }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [nodePanelOpen, setNodePanelOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [zoom, setZoom] = useState(1)
  const { getNodes, getEdges, setCenter } = useReactFlow()
  const reactFlowWrapper = useRef(null)

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
    const workflow = {
      nodes: getNodes(),
      edges: getEdges(),
      process_id: processId,
    }

    try {
      const response = await fetch(
        `/api/process/save-workflow?company_name=${encodeURIComponent(localStorage.getItem('selectedCompany') || '')}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
          body: JSON.stringify(workflow),
        }
      )

      if (!response.ok) throw new Error('Failed to save workflow')
      setIsDirty(false)
      onSave?.()
      alert('Process workflow saved successfully!')
    } catch (error) {
      console.error('Error saving workflow:', error)
      alert('Failed to save workflow')
    }
  }, [getNodes, getEdges, processId, onSave])

  const handleDeleteNode = useCallback(() => {
    if (selectedNode) {
      deleteNode(selectedNode.id)
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
            <h2 className="text-xl font-bold text-white">{processName || 'Process Builder'}</h2>
            {isDirty && <span className="text-sm text-yellow-400">● Unsaved changes</span>}
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
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              Save
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
                <p className="text-slate-400 text-lg mb-4">Drag elements from the sidebar to start</p>
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
        onDelete={() => {
          deleteNode(selectedNode.id)
          setNodePanelOpen(false)
        }}
      />
    </div>
  )
}

export default ProcessBuilder