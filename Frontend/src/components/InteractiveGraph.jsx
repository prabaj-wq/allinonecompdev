import React, { useState, useEffect, useRef } from 'react'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Settings,
  Eye,
  EyeOff,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Move,
  Link,
  Unlink,
  X
} from 'lucide-react'

const InteractiveGraph = ({ items = [], hierarchies = [], elements = [], type = 'hierarchy' }) => {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showSettings, setShowSettings] = useState(false)
  const [graphSettings, setGraphSettings] = useState({
    nodeSize: 60,
    nodeSpacing: 150,
    showLabels: true,
    showConnections: true,
    layout: 'hierarchical' // hierarchical, circular, force
  })
  
  const svgRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    generateGraphData()
  }, [items, hierarchies, elements, graphSettings])

  const generateGraphData = () => {
    const newNodes = []
    const newEdges = []

    // If we have hierarchies and elements, use them
    if (hierarchies.length > 0 || elements.length > 0) {
      // Add hierarchy nodes
      hierarchies.forEach((hierarchy, index) => {
        const node = {
          id: `hierarchy_${hierarchy.id}`,
          label: hierarchy.name,
          type: 'Hierarchy',
          status: hierarchy.status || 'Active',
          level: 0,
          x: 0,
          y: 0,
          size: graphSettings.nodeSize + 10,
          color: '#3b82f6',
          data: hierarchy
        }
        newNodes.push(node)

        // Add elements that belong to this hierarchy
        elements.forEach((element) => {
          if (element.hierarchy === hierarchy.name) {
            const elementNode = {
              id: `element_${element.id}`,
              label: element.name,
              type: element.type || 'Element',
              status: element.status || 'Active',
              level: 1,
              x: 0,
              y: 0,
              size: graphSettings.nodeSize,
              color: getNodeColor(element),
              data: element
            }
            newNodes.push(elementNode)

            // Create edge from hierarchy to element
            newEdges.push({
              id: `hierarchy_${hierarchy.id}-element_${element.id}`,
              source: `hierarchy_${hierarchy.id}`,
              target: `element_${element.id}`,
              type: 'hierarchy',
              weight: 1
            })
          }
        })
      })
    } else {
      // Fallback to items
      items.forEach((item, index) => {
        const node = {
          id: item.id,
          label: item.name,
          type: item.type || 'default',
          status: item.status || 'active',
          level: item.level || 0,
          x: 0, // Will be calculated by layout
          y: 0,
          size: graphSettings.nodeSize,
          color: getNodeColor(item),
          data: item
        }
        newNodes.push(node)

        // Generate edges based on relationships
        if (item.parent_id || item.hierarchy_id) {
          const parentId = item.parent_id || item.hierarchy_id
          newEdges.push({
            id: `${parentId}-${item.id}`,
            source: parentId,
            target: item.id,
            type: 'hierarchy',
            weight: 1
          })
        }
      })
    }

    // If no items, create demo data
    if (items.length === 0) {
      const demoNodes = [
        { id: 1, label: "Parent Company", type: "Parent", status: "Active", level: 0, x: 0, y: 0, size: graphSettings.nodeSize, color: "#3b82f6", data: { id: 1, name: "Parent Company", code: "ENT001" } },
        { id: 2, label: "Subsidiary A", type: "Subsidiary", status: "Active", level: 1, x: 0, y: 0, size: graphSettings.nodeSize, color: "#10b981", data: { id: 2, name: "Subsidiary A", code: "ENT002" } },
        { id: 3, label: "Subsidiary B", type: "Subsidiary", status: "Active", level: 1, x: 0, y: 0, size: graphSettings.nodeSize, color: "#10b981", data: { id: 3, name: "Subsidiary B", code: "ENT003" } },
        { id: 4, label: "US Operations", type: "Subsidiary", status: "Active", level: 2, x: 0, y: 0, size: graphSettings.nodeSize, color: "#f59e0b", data: { id: 4, name: "US Operations", code: "ENT004" } },
        { id: 5, label: "EU Operations", type: "Subsidiary", status: "Active", level: 2, x: 0, y: 0, size: graphSettings.nodeSize, color: "#f59e0b", data: { id: 5, name: "EU Operations", code: "ENT005" } }
      ]
      const demoEdges = [
        { id: "1-2", source: 1, target: 2, type: "hierarchy", weight: 1 },
        { id: "1-3", source: 1, target: 3, type: "hierarchy", weight: 1 },
        { id: "2-4", source: 2, target: 4, type: "hierarchy", weight: 1 },
        { id: "3-5", source: 3, target: 5, type: "hierarchy", weight: 1 }
      ]
      applyLayout(demoNodes, demoEdges)
      setNodes(demoNodes)
      setEdges(demoEdges)
      return
    }

    // Apply layout
    applyLayout(newNodes, newEdges)
    setNodes(newNodes)
    setEdges(newEdges)
  }

  const getNodeColor = (item) => {
    if (item.status === 'Inactive') return '#ef4444'
    if (item.type === 'Parent') return '#3b82f6'
    if (item.type === 'Subsidiary') return '#10b981'
    if (item.type === 'Account') return '#f59e0b'
    return '#6b7280'
  }

  const applyLayout = (nodes, edges) => {
    if (graphSettings.layout === 'hierarchical') {
      applyHierarchicalLayout(nodes, edges)
    } else if (graphSettings.layout === 'circular') {
      applyCircularLayout(nodes)
    } else if (graphSettings.layout === 'force') {
      applyForceLayout(nodes, edges)
    }
  }

  const applyHierarchicalLayout = (nodes, edges) => {
    const levels = {}
    const nodeMap = {}
    
    // Group nodes by level
    nodes.forEach(node => {
      if (!levels[node.level]) levels[node.level] = []
      levels[node.level].push(node)
      nodeMap[node.id] = node
    })

    // Position nodes
    Object.keys(levels).forEach((level, levelIndex) => {
      const levelNodes = levels[level]
      const levelWidth = levelNodes.length * graphSettings.nodeSpacing
      const startX = -levelWidth / 2

      levelNodes.forEach((node, nodeIndex) => {
        node.x = startX + nodeIndex * graphSettings.nodeSpacing
        node.y = levelIndex * graphSettings.nodeSpacing
      })
    })
  }

  const applyCircularLayout = (nodes) => {
    const radius = Math.max(200, nodes.length * 20)
    const centerX = 0
    const centerY = 0

    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length
      node.x = centerX + radius * Math.cos(angle)
      node.y = centerY + radius * Math.sin(angle)
    })
  }

  const applyForceLayout = (nodes, edges) => {
    // Simple force-directed layout
    const iterations = 100
    const k = Math.sqrt((400 * 400) / nodes.length)
    const dt = 0.1

    // Initialize positions randomly
    nodes.forEach(node => {
      node.x = (Math.random() - 0.5) * 400
      node.y = (Math.random() - 0.5) * 400
      node.vx = 0
      node.vy = 0
    })

    // Apply forces
    for (let i = 0; i < iterations; i++) {
      // Repulsion between all nodes
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const node1 = nodes[j]
          const node2 = nodes[k]
          const dx = node1.x - node2.x
          const dy = node1.y - node2.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (k * k) / distance

          node1.vx += (dx / distance) * force * dt
          node1.vy += (dy / distance) * force * dt
          node2.vx -= (dx / distance) * force * dt
          node2.vy -= (dy / distance) * force * dt
        }
      }

      // Attraction for connected nodes
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source)
        const target = nodes.find(n => n.id === edge.target)
        if (source && target) {
          const dx = target.x - source.x
          const dy = target.y - source.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (distance * distance) / k

          source.vx += (dx / distance) * force * dt
          source.vy += (dy / distance) * force * dt
          target.vx -= (dx / distance) * force * dt
          target.vy -= (dy / distance) * force * dt
        }
      })

      // Update positions
      nodes.forEach(node => {
        node.x += node.vx * dt
        node.y += node.vy * dt
        node.vx *= 0.9 // Damping
        node.vy *= 0.9
      })
    }
  }

  const handleMouseDown = (e) => {
    if (e.target === svgRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(Math.max(0.1, Math.min(3, zoom * delta)))
  }

  const handleNodeClick = (node) => {
    setSelectedNode(node)
  }

  const handleZoomIn = () => {
    setZoom(Math.min(3, zoom * 1.2))
  }

  const handleZoomOut = () => {
    setZoom(Math.max(0.1, zoom / 1.2))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const renderNode = (node) => (
    <g
      key={node.id}
      transform={`translate(${node.x}, ${node.y})`}
      className="cursor-pointer"
      onClick={() => handleNodeClick(node)}
    >
      {/* Node circle */}
      <circle
        r={node.size / 2}
        fill={node.color}
        stroke={selectedNode?.id === node.id ? '#3b82f6' : '#ffffff'}
        strokeWidth={selectedNode?.id === node.id ? 3 : 1}
        className="hover:opacity-80 transition-opacity"
      />
      
      {/* Node label */}
      {graphSettings.showLabels && (
        <text
          textAnchor="middle"
          dy=".35em"
          className="text-xs font-medium fill-white pointer-events-none"
          style={{ fontSize: Math.max(10, node.size / 6) }}
        >
          {node.label.length > 10 ? node.label.substring(0, 10) + '...' : node.label}
        </text>
      )}
      
      {/* Status indicator */}
      <circle
        cx={node.size / 2 - 5}
        cy={-node.size / 2 + 5}
        r="3"
        fill={node.status === 'Active' ? '#10b981' : '#ef4444'}
        className="pointer-events-none"
      />
    </g>
  )

  const renderEdge = (edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)
    
    if (!sourceNode || !targetNode) return null

    return (
      <line
        key={edge.id}
        x1={sourceNode.x}
        y1={sourceNode.y}
        x2={targetNode.x}
        y2={targetNode.y}
        stroke="#6b7280"
        strokeWidth="2"
        strokeDasharray={edge.type === 'hierarchy' ? '0' : '5,5'}
        className="pointer-events-none"
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Interactive Graph</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={graphSettings.layout}
            onChange={(e) => setGraphSettings({ ...graphSettings, layout: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="hierarchical">Hierarchical</option>
            <option value="circular">Circular</option>
            <option value="force">Force Directed</option>
          </select>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Graph Container */}
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className="w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center'
            }}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Edges */}
            {graphSettings.showConnections && edges.map(renderEdge)}
            
            {/* Nodes */}
            {nodes.map(renderNode)}
          </svg>
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Node count */}
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {nodes.length} nodes, {edges.length} connections
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Graph Settings</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Node Size
              </label>
              <input
                type="range"
                min="30"
                max="100"
                value={graphSettings.nodeSize}
                onChange={(e) => setGraphSettings({ ...graphSettings, nodeSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Node Spacing
              </label>
              <input
                type="range"
                min="100"
                max="300"
                value={graphSettings.nodeSpacing}
                onChange={(e) => setGraphSettings({ ...graphSettings, nodeSpacing: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showLabels"
                checked={graphSettings.showLabels}
                onChange={(e) => setGraphSettings({ ...graphSettings, showLabels: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="showLabels" className="text-sm text-gray-700 dark:text-gray-300">
                Show Labels
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showConnections"
                checked={graphSettings.showConnections}
                onChange={(e) => setGraphSettings({ ...graphSettings, showConnections: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="showConnections" className="text-sm text-gray-700 dark:text-gray-300">
                Show Connections
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute top-16 left-4 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Node Details</h4>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name:</span>
              <div className="text-sm text-gray-900 dark:text-white">{selectedNode.label}</div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
              <div className="text-sm text-gray-900 dark:text-white">{selectedNode.type}</div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
              <div className="text-sm text-gray-900 dark:text-white">{selectedNode.status}</div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Level:</span>
              <div className="text-sm text-gray-900 dark:text-white">{selectedNode.level}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InteractiveGraph
