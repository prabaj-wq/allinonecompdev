import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, Download, Upload, Play, Save, X, Settings,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, Zap,
  Eye, EyeOff, Copy, Share2, Lock, Unlock, RefreshCw, TrendingUp,
  BarChart3, PieChart, LineChart, DollarSign, Users, Building2,
  FileText, Calculator, Database, GitBranch, Shield, Map, Globe
} from 'lucide-react';
import '../styles/ProcessBuilderEnhanced.css';

const ProcessBuilderEnhanced = () => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [currentView, setCurrentView] = useState('list'); // list, editor, settings, scenarios, audit
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [entities, setEntities] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [newConnection, setNewConnection] = useState(null);
  const [canvasZoom, setCanvasZoom] = useState(1);
  
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  
  const canvasRef = useRef(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const token = localStorage.getItem('access_token');

  // ============================================================================
  // NOTIFICATION SYSTEM
  // ============================================================================

  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
  }, []);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const fetchProcesses = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/process/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProcesses(data.processes || []);
      }
    } catch (error) {
      addNotification('Error fetching processes', 'error');
    }
  }, [apiUrl, token, addNotification]);

  const fetchFullProcess = useCallback(async (processId) => {
    try {
      const response = await fetch(`${apiUrl}/process/${processId}/full`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNodes(data.process.nodes || []);
        setConnections(data.process.connections || []);
        setSelectedProcess(data.process);
      }
    } catch (error) {
      addNotification('Error fetching process', 'error');
    }
  }, [apiUrl, token, addNotification]);

  const createProcess = useCallback(async (name, description, processType, fiscalYear) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/process/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name, description, process_type: processType, fiscal_year: fiscalYear
        })
      });
      const data = await response.json();
      if (data.success) {
        addNotification(`Process '${name}' created successfully`, 'success');
        fetchProcesses();
        return data.process_id;
      }
    } catch (error) {
      addNotification('Error creating process', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, token, addNotification, fetchProcesses]);

  const addNodeToCanvas = useCallback(async (nodeData) => {
    try {
      const response = await fetch(`${apiUrl}/process/node/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nodeData)
      });
      const data = await response.json();
      if (data.success) {
        addNotification(`Node '${nodeData.node_name}' added`, 'success');
        fetchFullProcess(selectedProcess.id);
        return data.node_id;
      }
    } catch (error) {
      addNotification('Error adding node', 'error');
    }
  }, [apiUrl, token, addNotification, selectedProcess, fetchFullProcess]);

  const updateNode = useCallback(async (nodeId, updates) => {
    try {
      const response = await fetch(`${apiUrl}/process/node/${nodeId}/edit`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (data.success) {
        addNotification('Node updated', 'success');
        fetchFullProcess(selectedProcess.id);
      }
    } catch (error) {
      addNotification('Error updating node', 'error');
    }
  }, [apiUrl, token, addNotification, selectedProcess, fetchFullProcess]);

  const deleteNode = useCallback(async (nodeId) => {
    try {
      const response = await fetch(`${apiUrl}/process/node/${nodeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        addNotification('Node deleted', 'success');
        fetchFullProcess(selectedProcess.id);
        setSelectedNode(null);
      }
    } catch (error) {
      addNotification('Error deleting node', 'error');
    }
  }, [apiUrl, token, addNotification, selectedProcess, fetchFullProcess]);

  const connectNodes = useCallback(async (fromNodeId, toNodeId, connectionType = 'sequential') => {
    try {
      const response = await fetch(`${apiUrl}/process/node/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_node_id: fromNodeId,
          to_node_id: toNodeId,
          connection_type: connectionType
        })
      });
      const data = await response.json();
      if (data.success) {
        addNotification('Connection created', 'success');
        fetchFullProcess(selectedProcess.id);
      }
    } catch (error) {
      addNotification('Error creating connection', 'error');
    }
  }, [apiUrl, token, addNotification, selectedProcess, fetchFullProcess]);

  const registerEntity = useCallback(async (entityData) => {
    try {
      const response = await fetch(`${apiUrl}/process/entity/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entityData)
      });
      const data = await response.json();
      if (data.success) {
        addNotification(`Entity '${entityData.entity_name}' registered`, 'success');
        fetchEntities();
        return true;
      }
    } catch (error) {
      addNotification('Error registering entity', 'error');
    }
  }, [apiUrl, token, addNotification]);

  const fetchEntities = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/process/entity/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEntities(data.entities || []);
      }
    } catch (error) {
      addNotification('Error fetching entities', 'error');
    }
  }, [apiUrl, token, addNotification]);

  const createScenario = useCallback(async (scenarioData) => {
    try {
      const response = await fetch(`${apiUrl}/process/scenario/create?process_id=${selectedProcess.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scenarioData)
      });
      const data = await response.json();
      if (data.success) {
        addNotification(`Scenario '${scenarioData.scenario_name}' created`, 'success');
        fetchScenarios();
        return data.scenario_id;
      }
    } catch (error) {
      addNotification('Error creating scenario', 'error');
    }
  }, [apiUrl, token, addNotification, selectedProcess]);

  const fetchScenarios = useCallback(async () => {
    if (!selectedProcess) return;
    try {
      const response = await fetch(`${apiUrl}/process/scenario/list?process_id=${selectedProcess.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setScenarios(data.scenarios || []);
      }
    } catch (error) {
      addNotification('Error fetching scenarios', 'error');
    }
  }, [apiUrl, token, addNotification, selectedProcess]);

  const executeProcess = useCallback(async (executionType = 'simulation') => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/process/execute?process_id=${selectedProcess.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          run_type: executionType,
          apply_to_staging: true
        })
      });
      const data = await response.json();
      if (data.success) {
        addNotification(`Process execution started: ${executionType}`, 'success');
        fetchExecutionHistory();
      }
    } catch (error) {
      addNotification('Error executing process', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, token, addNotification, selectedProcess]);

  const validateProcess = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/process/validate/${selectedProcess.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setShowValidationModal(data);
        addNotification('Validation complete', 'info');
      }
    } catch (error) {
      addNotification('Error validating process', 'error');
    }
  }, [apiUrl, token, addNotification, selectedProcess]);

  const fetchExecutionHistory = useCallback(async () => {
    if (!selectedProcess) return;
    try {
      const response = await fetch(`${apiUrl}/process/audit/${selectedProcess.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setExecutionHistory(data.audit_trail || []);
      }
    } catch (error) {
      addNotification('Error fetching execution history', 'error');
    }
  }, [apiUrl, token, addNotification, selectedProcess]);

  // ============================================================================
  // CANVAS OPERATIONS
  // ============================================================================

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
    }
  };

  const handleNodeDragStart = (e, nodeId) => {
    setDraggedNode(nodeId);
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    if (!draggedNode) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasZoom;
    const y = (e.clientY - rect.top) / canvasZoom;

    updateNode(draggedNode, { x_position: x, y_position: y });
    setDraggedNode(null);
  };

  const handleCanvasZoom = (e) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCanvasZoom(prev => Math.max(0.5, Math.min(2, prev * delta)));
  };

  // ============================================================================
  // NODE TEMPLATE DEFINITIONS WITH DETAILED BUSINESS LOGIC
  // ============================================================================

  const NODE_TEMPLATES = {
    profit_loss: {
      name: 'Profit/Loss Calculation',
      icon: TrendingUp,
      color: '#3B82F6',
      description: 'Calculate comprehensive profit & loss with segments',
      config: {
        gross_margin_method: 'weighted_average',
        include_discontinued: true,
        segment_profit_calc: false
      }
    },
    nci_handling: {
      name: 'NCI Handling',
      icon: Users,
      color: '#10B981',
      description: 'Non-Controlling Interest measurement and allocation',
      config: {
        measurement_method: 'proportionate_share',
        share_of_profit: true,
        equity_allocation_method: 'at_acquisition'
      }
    },
    retained_earnings_rollforward: {
      name: 'Retained Earnings Rollforward',
      icon: LineChart,
      color: '#F59E0B',
      description: 'Opening RE + Profit/Loss - Dividends + Adjustments = Closing RE',
      config: {
        opening_source: 'prior_year_close',
        include_oci_movement: true,
        include_reclassifications: true
      }
    },
    fx_translation: {
      name: 'FX Translation',
      icon: Globe,
      color: '#8B5CF6',
      description: 'Foreign currency translation & translation gains/losses',
      config: {
        method: 'current_rate',
        cta_location: 'oci',
        hedge_accounting: false
      }
    },
    intercompany_eliminations: {
      name: 'IC Eliminations',
      icon: GitBranch,
      color: '#EC4899',
      description: 'Eliminate intercompany transactions and unrealized profits',
      config: {
        elimination_scope: ['sales', 'loans', 'receivables', 'payables'],
        profit_in_inventory: true,
        ic_net_zero_validation: true
      }
    },
    goodwill_fair_value_adjustments: {
      name: 'Goodwill & Fair Value',
      icon: BarChart3,
      color: '#06B6D4',
      description: 'Manage goodwill, fair value allocations, and amortization',
      config: {
        fa_amortization_period: 5,
        amortization_method: 'straight_line',
        impairment_testing_frequency: 'annual'
      }
    },
    deferred_taxes: {
      name: 'Deferred Taxes',
      icon: FileText,
      color: '#14B8A6',
      description: 'Calculate deferred tax impacts on adjustments',
      config: {
        tax_rate: 0.25,
        effective_tax_rate: null,
        dt_adjustments_apply_to: ['fx', 'ic', 'goodwill']
      }
    },
    opening_balance_adjustments: {
      name: 'Opening Balances',
      icon: Database,
      color: '#6366F1',
      description: 'Manage opening balance adjustments and fair value differences',
      config: {
        opening_source: 'prior_year_close',
        adjustment_tracking: true
      }
    },
    minority_associate_jv_accounting: {
      name: 'Minority/Associate/JV',
      icon: Building2,
      color: '#F97316',
      description: 'Equity method, cost method, and JV accounting',
      config: {
        method: 'equity_method',
        share_of_profit_calc: true
      }
    },
    prior_period_errors_changes: {
      name: 'Prior Period Errors',
      icon: AlertCircle,
      color: '#DC2626',
      description: 'Handle restatements and prior period adjustments',
      config: {
        restatement_tracking: true
      }
    },
    statement_changes_equity: {
      name: 'Statement of Changes',
      icon: PieChart,
      color: '#059669',
      description: 'Automatically build changes in equity statement',
      config: {
        include_nci: true,
        include_oci: true
      }
    },
    oci_items: {
      name: 'OCI Items',
      icon: TrendingUp,
      color: '#7C3AED',
      description: 'Other Comprehensive Income items tracking',
      config: {
        reclassification_to_pl: true
      }
    },
    weighted_average_eps: {
      name: 'EPS Calculation',
      icon: Calculator,
      color: '#EA580C',
      description: 'Basic and diluted EPS with weighted average shares',
      config: {
        basic_eps: true,
        diluted_eps: true,
        weighted_average_method: 'daily'
      }
    },
    valuation_impairment: {
      name: 'Valuation & Impairment',
      icon: Shield,
      color: '#0891B2',
      description: 'Goodwill impairment, asset impairment testing',
      config: {
        impairment_threshold: 0.10,
        testing_frequency: 'annual'
      }
    },
    what_if_simulation: {
      name: 'What-If Simulation',
      icon: Zap,
      color: '#D97706',
      description: 'Run process with assumptions without updating production',
      config: {
        staging_mode: true
      }
    },
    scenario_version_control: {
      name: 'Scenario Control',
      icon: GitBranch,
      color: '#4F46E5',
      description: 'Compare base case vs scenarios',
      config: {}
    },
    alerts_exceptions: {
      name: 'Alerts & Exceptions',
      icon: AlertCircle,
      color: '#DC2626',
      description: 'Balance sheet balance checks, IC remainder alerts',
      config: {}
    },
    entity_structure_ownership: {
      name: 'Entity Structure',
      icon: Map,
      color: '#1F2937',
      description: 'Ownership register with consolidation methods',
      config: {}
    }
  };

  // ============================================================================
  // RENDER COMPONENTS
  // ============================================================================

  // Process List View
  const renderProcessList = () => (
    <div className="process-list-container">
      <div className="process-list-header">
        <h2>Process Definitions</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            // Show create process dialog
            const name = prompt('Enter process name:');
            if (name) {
              createProcess(name, '', 'profit_loss', new Date().getFullYear());
            }
          }}
        >
          <Plus size={18} /> New Process
        </button>
      </div>

      <div className="process-grid">
        {processes.map(process => (
          <div key={process.id} className="process-card">
            <div className="process-card-header">
              <h3>{process.name}</h3>
              <span className={`badge badge-${process.status}`}>{process.status}</span>
            </div>
            <p className="process-card-description">{process.description}</p>
            <div className="process-card-meta">
              <span>Type: {process.process_type}</span>
              <span>FY: {process.fiscal_year}</span>
            </div>
            <div className="process-card-actions">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setCurrentView('editor');
                  fetchFullProcess(process.id);
                }}
              >
                <Edit2 size={16} /> Edit
              </button>
              <button className="btn btn-sm btn-secondary">
                <Settings size={16} /> Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Canvas Renderer
  const renderCanvas = () => (
    <div className="canvas-container">
      <svg
        ref={canvasRef}
        className="process-canvas"
        style={{ transform: `scale(${canvasZoom})` }}
        onClick={handleCanvasClick}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
        onWheel={handleCanvasZoom}
      >
        {/* Draw connections */}
        {connections.map(conn => {
          const fromNode = nodes.find(n => n.id === conn.fromNode);
          const toNode = nodes.find(n => n.id === conn.toNode);
          
          if (!fromNode || !toNode) return null;

          return (
            <line
              key={conn.id}
              x1={fromNode.x + 150}
              y1={fromNode.y + 60}
              x2={toNode.x + 150}
              y2={toNode.y}
              stroke="#9CA3AF"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Draw nodes */}
        {nodes.map(node => {
          const template = NODE_TEMPLATES[node.type];
          const isSelected = selectedNode?.id === node.id;
          
          return (
            <g
              key={node.id}
              className={`node ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedNode(node)}
              draggable
              onDragStart={(e) => handleNodeDragStart(e, node.id)}
            >
              <rect
                x={node.x}
                y={node.y}
                width="300"
                height="120"
                rx="8"
                fill={template?.color || '#3B82F6'}
                opacity={node.active ? 1 : 0.5}
                stroke={isSelected ? '#000' : 'none'}
                strokeWidth={isSelected ? '2' : '0'}
              />
              <text x={node.x + 15} y={node.y + 25} className="node-title">
                {node.name}
              </text>
              <text x={node.x + 15} y={node.y + 50} className="node-type">
                {template?.name}
              </text>
              <text x={node.x + 15} y={node.y + 75} className="node-sequence">
                Sequence: {node.sequence}
              </text>
            </g>
          );
        })}

        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#9CA3AF" />
          </marker>
        </defs>
      </svg>
    </div>
  );

  // Right Panel - Node Configuration
  const renderNodeConfig = () => {
    if (!selectedNode) return <div className="config-panel-empty">Select a node to configure</div>;

    const template = NODE_TEMPLATES[selectedNode.type];

    return (
      <div className="config-panel">
        <div className="config-header">
          <h3>{selectedNode.name}</h3>
          <button onClick={() => setSelectedNode(null)} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="config-section">
          <label className="form-label">Node Name</label>
          <input
            type="text"
            value={selectedNode.name}
            onChange={(e) =>
              setSelectedNode({
                ...selectedNode,
                name: e.target.value
              })
            }
            className="form-input"
          />
        </div>

        <div className="config-section">
          <label className="form-label">Type</label>
          <div className="form-value">{template?.name}</div>
        </div>

        <div className="config-section">
          <label className="form-label">Configuration</label>
          <div className="config-json">
            <pre>{JSON.stringify(selectedNode.config, null, 2)}</pre>
          </div>
        </div>

        <div className="config-actions">
          <button
            className="btn btn-primary"
            onClick={() => updateNode(selectedNode.id, { node_name: selectedNode.name })}
          >
            <Save size={16} /> Save
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Delete this node?')) {
                deleteNode(selectedNode.id);
              }
            }}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  useEffect(() => {
    fetchProcesses();
    fetchEntities();
  }, [fetchProcesses, fetchEntities]);

  return (
    <div className="process-builder-enhanced">
      {/* Notification System */}
      <div className="notifications-container">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification notification-${notif.type}`}>
            {notif.type === 'success' && <CheckCircle size={18} />}
            {notif.type === 'error' && <AlertCircle size={18} />}
            {notif.type === 'info' && <Clock size={18} />}
            <span>{notif.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      {currentView === 'list' && renderProcessList()}

      {currentView === 'editor' && selectedProcess && (
        <div className="process-editor">
          <div className="editor-header">
            <h1>{selectedProcess.name}</h1>
            <div className="header-actions">
              <button className="btn btn-secondary" onClick={() => validateProcess()}>
                <CheckCircle size={18} /> Validate
              </button>
              <button className="btn btn-primary" onClick={() => executeProcess('simulation')}>
                <Zap size={18} /> Simulate
              </button>
              <button className="btn btn-secondary" onClick={() => setCurrentView('list')}>
                <X size={18} /> Back
              </button>
            </div>
          </div>

          <div className="editor-layout">
            {/* Left Sidebar - Node Templates */}
            <div className="node-templates-panel">
              <h3>Add Nodes</h3>
              <div className="templates-scroll">
                {Object.entries(NODE_TEMPLATES).map(([key, template]) => (
                  <div
                    key={key}
                    className="template-card"
                    onClick={() => {
                      const newNode = {
                        process_id: selectedProcess.id,
                        node_type: key,
                        node_name: template.name,
                        sequence_order: nodes.length + 1,
                        x_position: 100 + nodes.length * 50,
                        y_position: 100 + (nodes.length % 3) * 150,
                        configuration: template.config,
                        is_active: true
                      };
                      addNodeToCanvas(newNode);
                    }}
                  >
                    <div className="template-icon" style={{ background: template.color }}>
                      {template.icon && <template.icon size={24} color="white" />}
                    </div>
                    <div className="template-info">
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center - Canvas */}
            <div className="canvas-wrapper">
              {renderCanvas()}
            </div>

            {/* Right - Configuration */}
            <div className="config-wrapper">
              {renderNodeConfig()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessBuilderEnhanced;