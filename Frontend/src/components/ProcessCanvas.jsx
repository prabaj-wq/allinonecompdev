import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Plus, Trash2, Settings, Play, Download, Save, X, 
  GripHorizontal, AlertCircle, CheckCircle, Edit2, Eye
} from 'lucide-react'
import '../styles/ProcessCanvas.css'

const ProcessCanvas = ({ 
  workflowId, 
  nodes = [], 
  connections = [], 
  onAddNode, 
  onDeleteNode,
  onEditNode,
  onConnectNodes,
  onRunSimulation,
  isLoading = false,
  simulationRunning = false,
  selectedNode = null,
  onSelectNode = () => {}
}) => {
  const canvasRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState(null)
  const [connectionMode, setConnectionMode] = useState(false)
  const [sourceNodeId, setSourceNodeId] = useState(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [nodePositions, setNodePositions] = useState({})

  useEffect(() => {
    const positions = {}
    nodes.forEach(node => {
      positions[node.id] = {
        x: node.position_x || Math.random() * 400,
        y: node.position_y || Math.random() * 400,
      }
    })
    setNodePositions(positions)
  }, [nodes])

  const handleNodeMouseDown = (e, nodeId) => {
    if (connectionMode) return
    setIsDragging(true)
    setDraggedNode(nodeId)
    onSelectNode(nodeId)
  }

  const handleCanvasMouseMove = (e) => {
    if (!isDragging || !draggedNode || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / scale
    const y = (e.clientY - rect.top - pan.y) / scale

    setNodePositions(prev => ({
      ...prev,
      [draggedNode]: { x, y }
    }))
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
    setDraggedNode(null)
  }

  const handleWheel = (e) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    const newScale = Math.max(0.5, Math.min(2, scale + (e.deltaY > 0 ? -0.1 : 0.1)))
    setScale(newScale)
  }

  const handleCanvasPan = (e) => {
    if (e.button !== 2) return // Right mouse button
    setPan(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }))
  }

  const handleConnectionStart = (nodeId, e) => {
    e.stopPropagation()
    setConnectionMode(true)
    setSourceNodeId(nodeId)
  }

  const handleConnectionEnd = (targetNodeId, e) => {
    e.stopPropagation()
    if (connectionMode && sourceNodeId && sourceNodeId !== targetNodeId) {
      onConnectNodes(sourceNodeId, targetNodeId)
    }
    setConnectionMode(false)
    setSourceNodeId(null)
  }

  const renderConnections = () => {
    return connections.map((conn, idx) => {
      const sourceNode = nodes.find(n => n.id === conn.source_node_id)
      const targetNode = nodes.find(n => n.id === conn.target_node_id)

      if (!sourceNode || !targetNode || !nodePositions[sourceNode.id] || !nodePositions[targetNode.id]) {
        return null
      }

      const sourcePos = nodePositions[sourceNode.id]
      const targetPos = nodePositions[targetNode.id]

      return (
        <line
          key={`conn-${idx}`}
          x1={sourcePos.x + 100}
          y1={sourcePos.y + 40}
          x2={targetPos.x}
          y2={targetPos.y + 20}
          stroke="#3b82f6"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          className="connection-line"
        />
      )
    })
  }

  return (
    <div className="process-canvas-container">
      <div className="canvas-toolbar">
        <button 
          className="btn btn-primary"
          onClick={() => onAddNode()}
          disabled={isLoading}
        >
          <Plus size={18} /> Add Node
        </button>
        
        <button 
          className={`btn ${connectionMode ? 'btn-warning' : 'btn-secondary'}`}
          onClick={() => {
            setConnectionMode(!connectionMode)
            setSourceNodeId(null)
          }}
        >
          {connectionMode ? 'Cancel Connect' : 'Connect Nodes'}
        </button>

        <button 
          className="btn btn-success"
          onClick={onRunSimulation}
          disabled={isLoading || simulationRunning || nodes.length === 0}
        >
          <Play size={18} /> {simulationRunning ? 'Running...' : 'Simulate'}
        </button>

        <div className="zoom-controls">
          <button className="zoom-btn" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>−</button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button className="zoom-btn" onClick={() => setScale(s => Math.min(2, s + 0.1))}>+</button>
        </div>
      </div>

      <svg
        ref={canvasRef}
        className="canvas-svg"
        style={{
          transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
          cursor: connectionMode ? 'crosshair' : isDragging ? 'grabbing' : 'grab',
        }}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
        onMouseDown={handleCanvasPan}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>

        {renderConnections()}

        {nodes.map(node => {
          const pos = nodePositions[node.id] || { x: 0, y: 0 }
          const isSelected = selectedNode?.id === node.id

          return (
            <g
              key={`node-${node.id}`}
              className={`canvas-node ${isSelected ? 'selected' : ''} ${!node.is_enabled ? 'disabled' : ''}`}
              transform={`translate(${pos.x}, ${pos.y})`}
            >
              <rect
                width="180"
                height="80"
                rx="8"
                fill={isSelected ? '#dbeafe' : node.is_enabled ? '#f3f4f6' : '#e5e7eb'}
                stroke={isSelected ? '#0ea5e9' : node.is_enabled ? '#d1d5db' : '#9ca3af'}
                strokeWidth="2"
                className="node-rect"
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              />

              <text x="90" y="25" textAnchor="middle" className="node-title" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                {node.title}
              </text>

              <text x="90" y="45" textAnchor="middle" className="node-type" style={{ fontSize: '11px', fill: '#666' }}>
                {node.node_type}
              </text>

              {!node.is_enabled && (
                <text x="90" y="65" textAnchor="middle" style={{ fontSize: '10px', fill: '#dc2626' }}>
                  (Disabled)
                </text>
              )}

              {/* Connection port (right side) */}
              <circle
                cx="175"
                cy="40"
                r="6"
                fill={connectionMode && sourceNodeId === node.id ? '#fbbf24' : '#3b82f6'}
                onMouseDown={(e) => handleConnectionStart(node.id, e)}
                onMouseUp={(e) => handleConnectionEnd(node.id, e)}
                className="connection-port"
                style={{ cursor: 'pointer' }}
              />

              {/* Node actions */}
              <g className="node-actions" style={{ opacity: 0 }}>
                <rect x="5" y="-30" width="160" height="25" fill="white" stroke="#d1d5db" rx="4" />
                <text
                  x="15"
                  y="-10"
                  className="action-icon"
                  onClick={() => onEditNode(node.id)}
                  style={{ cursor: 'pointer', fontSize: '12px' }}
                >
                  Edit
                </text>
                <text
                  x="120"
                  y="-10"
                  className="action-icon delete"
                  onClick={() => onDeleteNode(node.id)}
                  style={{ cursor: 'pointer', fontSize: '12px' }}
                >
                  Delete
                </text>
              </g>
            </g>
          )
        })}
      </svg>

      {nodes.length === 0 && (
        <div className="canvas-empty-state">
          <AlertCircle size={48} />
          <h3>No nodes yet</h3>
          <p>Click "Add Node" to start building your workflow</p>
        </div>
      )}
    </div>
  )
}

export default ProcessCanvas