import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, ChevronLeft, Save, Play, Check, AlertCircle,
  Settings, Eye, GitBranch, Trash2, Edit2, ZoomIn, ZoomOut
} from 'lucide-react';
import '../styles/ProcessBuilder.css';
import NodeTemplatePanel from './ProcessBuilder/NodeTemplatePanel';
import ProcessCanvas from './ProcessBuilder/ProcessCanvas';
import ProcessSettingsPanel from './ProcessBuilder/ProcessSettingsPanel';
import NodeConfigPanel from './ProcessBuilder/NodeConfigPanel';

export default function ProcessBuilderPage() {
  const [processes, setProcesses] = useState([]);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [view, setView] = useState('list'); // list, editor
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAddNodePopup, setShowAddNodePopup] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [rules, setRules] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [processStatus, setProcessStatus] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const canvasRef = useRef(null);

  const companyId = localStorage.getItem('company_id');
  const token = localStorage.getItem('access_token');

  // Load processes on mount
  useEffect(() => {
    if (view === 'list') {
      loadProcesses();
    }
  }, [view]);

  // Load process details when selected
  useEffect(() => {
    if (currentProcess && view === 'editor') {
      loadProcessDetails();
    }
  }, [currentProcess, view]);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/process/list?company_id=${companyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to load processes');
      const data = await response.json();
      setProcesses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProcessDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/process/${currentProcess.id}/details?company_id=${companyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to load process details');
      const data = await response.json();
      setNodes(data.nodes || []);
      setConnections(data.connections || []);
      setPeriods(data.periods || []);
      setRules(data.rules || []);
      setProcessStatus(data.process.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProcess = async (name, description, type, year) => {
    try {
      setLoading(true);
      const response = await fetch('/api/process/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          process_type: type,
          fiscal_year: year,
          company_id: parseInt(companyId)
        })
      });
      if (!response.ok) throw new Error('Failed to create process');
      const newProcess = await response.json();
      setCurrentProcess({ id: newProcess.id, name });
      setView('editor');
      setSuccessMessage('Process created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = async (nodeType, nodeConfig) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/process/${currentProcess.id}/nodes/add?company_id=${companyId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            process_id: currentProcess.id,
            node_type: nodeType,
            title: nodeConfig.title || nodeType,
            description: nodeConfig.description,
            position_x: nodeConfig.position_x || 100,
            position_y: nodeConfig.position_y || 100,
            configuration: nodeConfig.configuration || {},
            custom_fields: nodeConfig.custom_fields || []
          })
        }
      );
      if (!response.ok) throw new Error('Failed to add node');
      const newNode = await response.json();
      setNodes([...nodes, {
        id: newNode.id,
        node_id: newNode.node_id,
        node_type: nodeType,
        ...nodeConfig
      }]);
      setShowAddNodePopup(false);
      setSuccessMessage('Node added to canvas');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNode = async (nodeId, updates) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/process/${currentProcess.id}/nodes/${nodeId}/update?company_id=${companyId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        }
      );
      if (!response.ok) throw new Error('Failed to update node');
      
      setNodes(nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      ));
      setSelectedNode(null);
      setSuccessMessage('Node updated');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!window.confirm('Are you sure you want to delete this node?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/process/${currentProcess.id}/nodes/${nodeId}/delete?company_id=${companyId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error('Failed to delete node');
      
      setNodes(nodes.filter(n => n.id !== nodeId));
      setConnections(connections.filter(c => 
        c.source_node_id !== nodeId && c.target_node_id !== nodeId
      ));
      setSelectedNode(null);
      setSuccessMessage('Node deleted');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectNodes = async (sourceId, targetId) => {
    try {
      const response = await fetch(
        `/api/process/${currentProcess.id}/nodes/connect?company_id=${companyId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            source_node_id: sourceId,
            target_node_id: targetId
          })
        }
      );
      if (!response.ok) throw new Error('Failed to connect nodes');
      
      setConnections([...connections, {
        source_node_id: sourceId,
        target_node_id: targetId
      }]);
      setSuccessMessage('Nodes connected');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSimulate = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/process/${currentProcess.id}/simulate?company_id=${companyId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error('Failed to simulate');
      setSuccessMessage('Process simulated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // LIST VIEW
  if (view === 'list') {
    return (
      <div className="process-list-container">
        <div className="process-header">
          <h1>Process Module</h1>
          <button 
            className="btn-primary"
            onClick={() => {
              const name = prompt('Enter process name:');
              if (name) {
                const type = prompt('Select type:\n1. consolidation\n2. roll_forward\n3. adjustments\n4. period_close\n5. forecasting');
                const typeMap = {'1': 'consolidation', '2': 'roll_forward', '3': 'adjustments', '4': 'period_close', '5': 'forecasting'};
                const year = prompt('Enter fiscal year (e.g., 2025)');
                handleCreateProcess(name, '', typeMap[type], parseInt(year));
              }
            }}
          >
            <Plus size={18} /> New Process
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        {loading ? (
          <div className="loading">Loading processes...</div>
        ) : processes.length === 0 ? (
          <div className="empty-state">
            <h2>No processes yet</h2>
            <p>Create a new process to get started</p>
          </div>
        ) : (
          <div className="process-grid">
            {processes.map(proc => (
              <div key={proc.id} className="process-card">
                <div className="card-header">
                  <h3>{proc.name}</h3>
                  <span className={`status-badge status-${proc.status}`}>{proc.status}</span>
                </div>
                <p className="card-description">{proc.description}</p>
                <div className="card-meta">
                  <span className="meta-item">{proc.process_type}</span>
                  <span className="meta-item">FY {proc.fiscal_year}</span>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setCurrentProcess(proc);
                    setView('editor');
                  }}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // EDITOR VIEW
  return (
    <div className="process-editor-container">
      {/* Header */}
      <div className="editor-header">
        <button
          className="btn-icon"
          onClick={() => { setView('list'); setCurrentProcess(null); }}
          title="Back to list"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="header-title">
          <h1>{currentProcess?.name || 'Untitled Process'}</h1>
          <span className={`status-badge status-${processStatus}`}>{processStatus}</span>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            title="Settings"
          >
            <Settings size={18} /> Settings
          </button>
          <button
            className="btn-secondary"
            onClick={handleSimulate}
            disabled={loading}
            title="Run simulation"
          >
            <Play size={18} /> Simulate
          </button>
          <button
            className="btn-primary"
            disabled={loading}
            title="Finalize process"
          >
            <Check size={18} /> Finalize
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Main Editor Layout */}
      <div className="editor-layout">
        {/* Left Panel - Node Templates */}
        <div className="left-panel">
          <NodeTemplatePanel
            onAddNode={() => setShowAddNodePopup(true)}
            isOpen={showAddNodePopup}
            onSelectTemplate={handleAddNode}
            onClose={() => setShowAddNodePopup(false)}
          />
        </div>

        {/* Center - Canvas */}
        <div className="center-panel">
          <div className="canvas-toolbar">
            <button
              className="btn-icon"
              onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button
              className="btn-icon"
              onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
          </div>
          <ProcessCanvas
            ref={canvasRef}
            nodes={nodes}
            connections={connections}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onConnectNodes={handleConnectNodes}
            zoom={zoom}
          />
        </div>

        {/* Right Panel - Configuration */}
        {selectedNode && (
          <div className="right-panel">
            <NodeConfigPanel
              node={selectedNode}
              onUpdate={handleUpdateNode}
              onDelete={handleDeleteNode}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}

        {/* Settings Panel */}
        {showSettingsPanel && (
          <div className="settings-panel-overlay">
            <ProcessSettingsPanel
              processId={currentProcess?.id}
              periods={periods}
              rules={rules}
              onClose={() => setShowSettingsPanel(false)}
              companyId={companyId}
              token={token}
            />
          </div>
        )}
      </div>
    </div>
  );
}