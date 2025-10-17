import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen, FileText, GitBranch, CheckCircle, Link as LinkIcon,
  Globe, DollarSign, Percent, Users, TrendingUp, AlertCircle,
  BarChart3, Database, AlertTriangle, Activity, Calculator,
  Trash2, Edit2, Copy, ArrowRight
} from 'lucide-react';

const NODE_ICONS = {
  journal_entries: BookOpen,
  forms: FileText,
  entity_structure: GitBranch,
  tb_verification: CheckCircle,
  intercompany_eliminations: LinkIcon,
  fx_translation: Globe,
  fair_value_adjustments: DollarSign,
  deferred_taxes: Percent,
  nci_allocation: Users,
  retained_earnings_rollforward: TrendingUp,
  goodwill_impairment: AlertCircle,
  profit_calculation: BarChart3,
  opening_balance_adjustments: Database,
  prior_period_errors: AlertTriangle,
  oci_items: Activity,
  epa_calculation: Calculator
};

const ProcessCanvas = React.forwardRef(({
  nodes = [],
  connections = [],
  selectedNode,
  onSelectNode,
  onUpdateNode,
  onDeleteNode,
  onConnectNodes,
  zoom = 1
}, ref) => {
  const canvasRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [connectMode, setConnectMode] = useState(false);
  const [sourceNode, setSourceNode] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const handleCanvasMouseDown = (e) => {
    if (e.button === 2) { // Right click
      setPan({ x: e.clientX, y: e.clientY });
      setIsDragging(true);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDragging && e.button !== 2) {
      const dx = e.clientX - pan.x;
      const dy = e.clientY - pan.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    if (connectMode) {
      if (!sourceNode) {
        setSourceNode(nodeId);
      } else if (sourceNode !== nodeId) {
        onConnectNodes(sourceNode, nodeId);
        setConnectMode(false);
        setSourceNode(null);
      }
    } else {
      onSelectNode(nodes.find(n => n.id === nodeId));
    }
  };

  const handleContextMenu = (e, nodeId) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const handleDeleteNode = () => {
    if (contextMenu?.nodeId) {
      onDeleteNode(contextMenu.nodeId);
      setContextMenu(null);
    }
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="process-canvas-container">
      <svg
        ref={canvasRef}
        className="process-canvas"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0'
        }}
      >
        {/* Draw connections */}
        {connections.map((conn, idx) => {
          const sourceNode = nodes.find(n => n.id === conn.source_node_id);
          const targetNode = nodes.find(n => n.id === conn.target_node_id);
          if (!sourceNode || !targetNode) return null;

          const x1 = sourceNode.position_x + 120;
          const y1 = sourceNode.position_y + 50;
          const x2 = targetNode.position_x;
          const y2 = targetNode.position_y + 50;

          return (
            <g key={`conn-${idx}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#4f46e5"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            </g>
          );
        })}

        {/* Arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#4f46e5" />
          </marker>
        </defs>

        {/* Draw nodes */}
        {nodes.map(node => {
          const Icon = NODE_ICONS[node.node_type];
          const isSelected = selectedNode?.id === node.id;

          return (
            <g
              key={`node-${node.id}`}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onContextMenu={(e) => handleContextMenu(e, node.id)}
              className="node-group"
            >
              {/* Node background */}
              <rect
                x={node.position_x}
                y={node.position_y}
                width="120"
                height="100"
                rx="8"
                className={`node-rect ${isSelected ? 'selected' : ''} ${sourceNode === node.id ? 'source' : ''}`}
                style={{
                  fill: isSelected ? '#dbeafe' : '#f3f4f6',
                  stroke: isSelected ? '#3b82f6' : '#d1d5db',
                  strokeWidth: isSelected ? 2 : 1
                }}
              />

              {/* Node icon */}
              {Icon && (
                <foreignObject
                  x={node.position_x + 40}
                  y={node.position_y + 10}
                  width="40"
                  height="40"
                >
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Icon size={28} style={{ color: '#4f46e5' }} />
                  </div>
                </foreignObject>
              )}

              {/* Node title */}
              <text
                x={node.position_x + 60}
                y={node.position_y + 70}
                textAnchor="middle"
                className="node-text"
                style={{ fontSize: '12px', fontWeight: 'bold' }}
              >
                {node.title.substring(0, 15)}
              </text>

              {/* Connection port */}
              <circle
                cx={node.position_x + 120}
                cy={node.position_y + 50}
                r="4"
                fill={sourceNode === node.id ? '#ef4444' : '#4f46e5'}
                opacity="0.5"
                style={{ cursor: 'pointer' }}
              />
            </g>
          );
        })}
      </svg>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={handleDeleteNode} className="menu-item danger">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}

      {/* Canvas controls hint */}
      <div className="canvas-hint">
        <small>Right-click to pan • Click node to select • Ctrl+Click to connect</small>
      </div>
    </div>
  );
});

ProcessCanvas.displayName = 'ProcessCanvas';
export default ProcessCanvas;