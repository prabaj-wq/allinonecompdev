import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Save, Play, Download, Settings, AlertCircle, CheckCircle,
  ZoomIn, ZoomOut, Grid3x3, Edit2, Copy, Eye, Calendar, Users, DollarSign,
  TrendingUp, Layers, GitBranch, BarChart3, Lock, Unlock, XCircle
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import '../styles/ProcessBuilderV2.css';

const ProcessBuilderV2 = () => {
  const { selectedCompany } = useCompany();
  // ==================== STATE ====================
  const [processes, setProcesses] = useState([]);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [currentExecution, setCurrentExecution] = useState(null);
  
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [draggingNode, setDraggingNode] = useState(null);
  const [notification, setNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [mode, setMode] = useState('list'); // list, edit, execute, report
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'consolidation',
    fiscal_year: new Date().getFullYear()
  });
  
  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  // ==================== NOTIFICATIONS ====================
  const notify = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // ==================== NODE TEMPLATES ====================
  const NODE_TEMPLATES = [
    {
      type: 'journal_entry',
      name: 'Journal Entry',
      color: '#3B82F6',
      icon: '📝',
      description: 'Create manual journal entries',
      config: {
        entries: [],
        validation: true,
        auto_balance: true
      }
    },
    {
      type: 'rollforward',
      name: 'Roll Forward',
      color: '#10B981',
      icon: '↗️',
      description: 'Roll forward balances from prior period',
      config: {
        opening_balance_code: '',
        closing_balance_code: '',
        include_movements: true
      }
    },
    {
      type: 'fx_translation',
      name: 'FX Translation',
      color: '#F59E0B',
      icon: '💱',
      description: 'Translate foreign currency transactions',
      config: {
        method: 'current', // current or temporal
        fx_rates: {}
      }
    },
    {
      type: 'intercompany_elimination',
      name: 'IC Elimination',
      color: '#EF4444',
      icon: '✂️',
      description: 'Eliminate intercompany transactions',
      config: {
        intercompany_accounts: {},
        eliminate_profit_in_inventory: true
      }
    },
    {
      type: 'nci_allocation',
      name: 'NCI Allocation',
      color: '#8B5CF6',
      icon: '👥',
      description: 'Calculate non-controlling interest',
      config: {
        nci_percentage: 0,
        method: 'fair_value', // fair_value or proportionate_share
        subsidiary_profit: 0,
        subsidiary_equity: 0
      }
    },
    {
      type: 'deferred_tax',
      name: 'Deferred Tax',
      color: '#06B6D4',
      icon: '📊',
      description: 'Calculate deferred tax adjustments',
      config: {
        tax_rate: 0.21,
        temporary_differences: {}
      }
    },
    {
      type: 'goodwill_impairment',
      name: 'Goodwill Test',
      color: '#EC4899',
      icon: '🔍',
      description: 'Test goodwill for impairment',
      config: {
        goodwill_amount: 0,
        fair_value: 0,
        carrying_value: 0
      }
    },
    {
      type: 'profit_loss',
      name: 'P&L Calculation',
      color: '#14B8A6',
      icon: '💹',
      description: 'Calculate profit and loss statement',
      config: {
        revenue_code: '',
        cogs_code: '',
        operating_expenses: 0,
        tax_rate: 0.21
      }
    },
    {
      type: 'retained_earnings',
      name: 'Retained Earnings',
      color: '#F97316',
      icon: '📈',
      description: 'Roll forward retained earnings',
      config: {
        opening_retained_earnings: 0,
        net_profit: 0,
        dividends: 0,
        other_adjustments: 0
      }
    },
    {
      type: 'eps_calculation',
      name: 'EPS Calc',
      color: '#6366F1',
      icon: '📉',
      description: 'Calculate basic and diluted EPS',
      config: {
        net_income: 0,
        weighted_shares: 1,
        dilutive_securities: 0
      }
    },
    {
      type: 'opening_balance',
      name: 'Opening Balance',
      color: '#78716C',
      icon: '🏁',
      description: 'Set opening balances from prior year',
      config: {
        source_scenario_id: '',
        adjustment_rules: []
      }
    },
    {
      type: 'consolidation_output',
      name: 'Consolidation Output',
      color: '#059669',
      icon: '✅',
      description: 'Generate consolidated statements',
      config: {
        include_elimination_schedules: true,
        include_nci_detail: true
      }
    },
    {
      type: 'validation',
      name: 'Validation',
      color: '#DC2626',
      icon: '⚠️',
      description: 'Validate balances and completeness',
      config: {
        checks: ['balance_sheet', 'intercompany', 'completeness'],
        stop_on_error: false
      }
    },
    {
      type: 'data_import',
      name: 'Data Import',
      color: '#0891B2',
      icon: '📥',
      description: 'Import financial data',
      config: {
        source_type: 'file', // file, api, database
        mapping_rules: []
      }
    },
    {
      type: 'oci_item',
      name: 'OCI Items',
      color: '#A21CAF',
      icon: '🔄',
      description: 'Track OCI items and reclassifications',
      config: {
        items: [],
        track_reclassification: true
      }
    },
    {
      type: 'scenario_comparison',
      name: 'Comparison',
      color: '#7C3AED',
      icon: '🔄',
      description: 'Compare scenarios or versions',
      config: {
        scenario_1_id: '',
        scenario_2_id: '',
        comparison_type: 'variance' // variance, ratio, absolute
      }
    },
    {
      type: 'custom_calculation',
      name: 'Custom Logic',
      color: '#64748B',
      icon: '⚙️',
      description: 'Execute custom calculation logic',
      config: {
        logic_code: '',
        input_fields: [],
        output_fields: []
      }
    },
    {
      type: 'report_generation',
      name: 'Report',
      color: '#374151',
      icon: '📄',
      description: 'Generate financial reports',
      config: {
        report_type: 'consolidated_statements', // consolidated_statements, elimination_schedule, changes_in_equity
        output_format: 'pdf' // pdf, excel, html
      }
    }
  ];

  // ==================== API CALLS ====================
  const apiCall = async (method, endpoint, data = null) => {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Important: sends session cookies
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(`/api${endpoint}`, options);
      
      if (!response.ok) {
        let errorDetail = 'API Error';
        try {
          const error = await response.json();
          errorDetail = error.detail || error.message || `Error ${response.status}`;
        } catch (e) {
          errorDetail = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorDetail);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error calling ${endpoint}:`, error.message);
      throw error;
    }
  };

  const loadProcesses = async () => {
    if (!selectedCompany) {
      notify('Please select a company first', 'error');
      return;
    }
    try {
      setLoading(true);
      const data = await apiCall('GET', `/process/catalog?company_name=${selectedCompany}`);
      setProcesses(Array.isArray(data) ? data : data.processes || []);
    } catch (error) {
      console.error('Error loading processes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProcess = async (processId) => {
    if (!selectedCompany) {
      notify('Please select a company first', 'error');
      return;
    }
    try {
      setLoading(true);
      const data = await apiCall('GET', `/process/${processId}?company_name=${selectedCompany}`);
      setCurrentProcess(data);
      setNodes(data.nodes || []);
      setConnections(data.connections || []);
      setMode('edit');
    } catch (error) {
      console.error('Error loading process:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load processes on component mount or when company changes
  useEffect(() => {
    if (selectedCompany) {
      loadProcesses();
    }
  }, [selectedCompany]);

  const createProcess = async (name, description, type, fiscal_year) => {
    if (!selectedCompany) {
      notify('Please select a company first', 'error');
      return;
    }
    try {
      const data = await apiCall('POST', `/process/create?company_name=${selectedCompany}`, {
        name,
        description,
        process_type: type,
        fiscal_year,
        settings: {}
      });
      
      notify(`Process "${name}" created`, 'success');
      loadProcesses();
      setMode('list');
    } catch (error) {
      console.error('Error creating process:', error);
    }
  };

  const addNode = async (template, x, y) => {
    if (!currentProcess || !selectedCompany) return;
    
    try {
      const data = await apiCall('POST', `/process/${currentProcess.id}/node/add?company_name=${selectedCompany}`, {
        node_type: template.type,
        title: template.name,
        position_x: x,
        position_y: y,
        configuration: template.config
      });
      
      const newNode = {
        id: data.id,
        type: template.type,
        name: template.name,
        x,
        y,
        configuration: template.config,
        custom_logic: null,
        custom_fields: {}
      };
      
      setNodes([...nodes, newNode]);
      notify(`Node "${template.name}" added`, 'success');
    } catch (error) {
      console.error('Error adding node:', error);
    }
  };

  const updateNode = async (nodeId, updates) => {
    if (!currentProcess || !selectedCompany) return;
    
    try {
      await apiCall('PUT', `/process/${currentProcess.id}/node/${nodeId}?company_name=${selectedCompany}`, updates);
      
      setNodes(nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n));
      notify('Node updated', 'success');
    } catch (error) {
      console.error('Error updating node:', error);
    }
  };

  const deleteNode = async (nodeId) => {
    if (!currentProcess || !selectedCompany) return;
    
    try {
      await apiCall('DELETE', `/process/${currentProcess.id}/node/${nodeId}?company_name=${selectedCompany}`);
      
      setNodes(nodes.filter(n => n.id !== nodeId));
      setConnections(connections.filter(c => c.from_node_id !== nodeId && c.to_node_id !== nodeId));
      setSelectedNode(null);
      notify('Node deleted', 'success');
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  const connectNodes = async (fromNodeId, toNodeId) => {
    if (!currentProcess || !selectedCompany) return;
    
    try {
      const data = await apiCall('POST', `/process/${currentProcess.id}/connect?company_name=${selectedCompany}`, {
        from_node_id: fromNodeId,
        to_node_id: toNodeId,
        connection_type: 'sequential'
      });
      
      const newConnection = {
        id: data.id,
        from_node_id: fromNodeId,
        to_node_id: toNodeId,
        type: 'sequential',
        data_mapping: {}
      };
      
      setConnections([...connections, newConnection]);
      notify('Connection created', 'success');
    } catch (error) {
      console.error('Error creating connection:', error);
    }
  };

  const executeProcess = async (scenario, executionType = 'simulate') => {
    if (!currentProcess || !scenario) return;
    
    try {
      setLoading(true);
      const data = await apiCall('POST', `/process/${currentProcess.id}/scenario/${scenario.id}/execute`, {
        execution_type: executionType
      });
      
      setCurrentExecution(data);
      setMode('report');
      notify(`Process executed in ${data.execution_time_ms}ms`, 'success');
      
      if (data.alerts.length > 0) {
        data.alerts.forEach(alert => {
          notify(alert.message, alert.type);
        });
      }
    } catch (error) {
      console.error('Error executing process:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== UI FUNCTIONS ====================
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
    }
  };

  const handleNodeDragStart = (e, nodeId) => {
    setDraggingNode(nodeId);
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const template = JSON.parse(e.dataTransfer.getData('template'));
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    addNode(template, x, y);
  };

  // ==================== RENDER FUNCTIONS ====================
  const renderCanvas = () => {
    return (
      <div className="canvas-container">
        <div
          ref={canvasRef}
          className="canvas"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`
          }}
          onClick={handleCanvasClick}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
        >
          <svg ref={svgRef} className="canvas-svg" width="2000" height="1500">
            {/* Grid */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="2000" height="1500" fill="url(#grid)" />

            {/* Connections */}
            {connections.map(conn => {
              const fromNode = nodes.find(n => n.id === conn.from_node_id);
              const toNode = nodes.find(n => n.id === conn.to_node_id);
              if (!fromNode || !toNode) return null;

              return (
                <g key={conn.id}>
                  <line
                    x1={fromNode.x + 50}
                    y1={fromNode.y + 30}
                    x2={toNode.x + 50}
                    y2={toNode.y + 30}
                    stroke="#ccc"
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
                <polygon points="0 0, 10 3, 0 6" fill="#999" />
              </marker>
            </defs>
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const template = NODE_TEMPLATES.find(t => t.type === node.type);
            return (
              <div
                key={node.id}
                className={`canvas-node ${selectedNode?.id === node.id ? 'selected' : ''}`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  backgroundColor: template?.color || '#9CA3AF'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                draggable
                onDragStart={(e) => handleNodeDragStart(e, node.id)}
              >
                <div className="node-icon">{template?.icon}</div>
                <div className="node-title">{node.name}</div>
                <div className="node-type">{template?.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLeftPanel = () => {
    return (
      <div className="left-panel">
        <div className="panel-header">
          <h3>Node Templates</h3>
          <Settings size={20} />
        </div>

        <div className="templates-list">
          {NODE_TEMPLATES.map(template => (
            <div
              key={template.type}
              className="template-item"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('template', JSON.stringify(template));
              }}
              style={{ borderLeftColor: template.color }}
            >
              <div className="template-icon">{template.icon}</div>
              <div className="template-info">
                <div className="template-name">{template.name}</div>
                <div className="template-desc">{template.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRightPanel = () => {
    if (!selectedNode) {
      return (
        <div className="right-panel">
          <div className="panel-header">
            <h3>Configuration</h3>
          </div>
          <div className="panel-empty">
            <AlertCircle size={32} />
            <p>Select a node to configure</p>
          </div>
        </div>
      );
    }

    const template = NODE_TEMPLATES.find(t => t.type === selectedNode.type);

    return (
      <div className="right-panel">
        <div className="panel-header">
          <h3>{selectedNode.name}</h3>
          <Trash2
            size={18}
            className="delete-btn"
            onClick={() => deleteNode(selectedNode.id)}
          />
        </div>

        <div className="config-form">
          <div className="form-group">
            <label>Node Name</label>
            <input
              type="text"
              value={selectedNode.name}
              onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
              placeholder="Enter node name"
            />
          </div>

          <div className="form-group">
            <label>Type: {template?.name}</label>
            <p className="text-sm text-gray-600">{template?.description}</p>
          </div>

          <div className="form-group">
            <label>Configuration (JSON)</label>
            <textarea
              value={JSON.stringify(selectedNode.configuration, null, 2)}
              onChange={(e) => {
                try {
                  const config = JSON.parse(e.target.value);
                  updateNode(selectedNode.id, { configuration: config });
                } catch (err) {
                  // Invalid JSON, just update display
                }
              }}
              className="config-textarea"
              rows="8"
            />
          </div>

          <div className="form-group">
            <label>Custom Logic (Python)</label>
            <textarea
              value={selectedNode.custom_logic || ''}
              onChange={(e) => updateNode(selectedNode.id, { custom_logic: e.target.value })}
              placeholder="# Enter custom calculation logic"
              className="config-textarea"
              rows="6"
            />
          </div>

          <button className="btn-primary" onClick={() => notify('Node configuration saved', 'success')}>
            <Save size={16} /> Save Configuration
          </button>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="list-view-container">
        <div className="list-header">
          <h2>Processes</h2>
          <button className="btn-primary" onClick={() => setMode('create')}>
            <Plus size={16} /> New Process
          </button>
        </div>

        <div className="processes-grid">
          {processes.map(process => (
            <div key={process.id} className="process-card">
              <div className="card-header">
                <h3>{process.name}</h3>
                <span className={`status-badge status-${process.status}`}>{process.status}</span>
              </div>
              <div className="card-body">
                <p className="card-description">{process.type}</p>
                <p className="card-meta">Fiscal Year: {process.fiscal_year}</p>
                <p className="card-meta">Created: {new Date(process.created_at).toLocaleDateString()}</p>
              </div>
              <div className="card-actions">
                <button className="btn-secondary" onClick={() => loadProcess(process.id)}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="btn-secondary" onClick={() => alert('Delete' + process.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCreateView = () => {
    return (
      <div className="create-view-container">
        <div className="create-header">
          <button className="btn-secondary" onClick={() => setMode('list')}>
            ← Back
          </button>
          <h2>Create New Process</h2>
        </div>

        <div className="create-form">
          <div className="form-group">
            <label>Process Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., 2025 Consolidation"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the process..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Process Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="consolidation">Consolidation</option>
                <option value="rollforward">Roll Forward</option>
                <option value="simulation">Simulation</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>

            <div className="form-group">
              <label>Fiscal Year</label>
              <input
                type="number"
                value={formData.fiscal_year}
                onChange={(e) => setFormData({ ...formData, fiscal_year: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn-primary"
              onClick={() => createProcess(formData.name, formData.description, formData.type, formData.fiscal_year)}
            >
              Create Process
            </button>
            <button className="btn-secondary" onClick={() => setMode('list')}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditView = () => {
    if (!currentProcess) return null;

    return (
      <div className="edit-view-container">
        <div className="edit-header">
          <button className="btn-secondary" onClick={() => setMode('list')}>
            ← Back
          </button>
          <h2>{currentProcess.name}</h2>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => executeProcess(currentScenario, 'simulate')}>
              <Play size={16} /> Run Simulation
            </button>
            <button className="btn-primary" onClick={() => executeProcess(currentScenario, 'finalize')}>
              <CheckCircle size={16} /> Finalize
            </button>
          </div>
        </div>

        <div className="editor-layout">
          {renderLeftPanel()}
          {renderCanvas()}
          {renderRightPanel()}
        </div>
      </div>
    );
  };

  const renderReportView = () => {
    if (!currentExecution) return null;

    return (
      <div className="report-view-container">
        <div className="report-header">
          <button className="btn-secondary" onClick={() => setMode('edit')}>
            ← Back to Editor
          </button>
          <h2>Execution Report</h2>
        </div>

        <div className="report-content">
          <div className="report-section">
            <h3>Execution Summary</h3>
            <div className="report-grid">
              <div className="report-item">
                <span className="label">Status:</span>
                <span className={`status-${currentExecution.status}`}>{currentExecution.status}</span>
              </div>
              <div className="report-item">
                <span className="label">Execution Time:</span>
                <span>{currentExecution.execution_time_ms}ms</span>
              </div>
              <div className="report-item">
                <span className="label">Alerts:</span>
                <span>{currentExecution.alerts.length}</span>
              </div>
              <div className="report-item">
                <span className="label">Errors:</span>
                <span>{currentExecution.errors.length}</span>
              </div>
            </div>
          </div>

          {currentExecution.alerts.length > 0 && (
            <div className="report-section">
              <h3>Alerts & Warnings</h3>
              <div className="alerts-list">
                {currentExecution.alerts.map((alert, idx) => (
                  <div key={idx} className={`alert alert-${alert.type}`}>
                    <AlertCircle size={16} />
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(currentExecution.results).length > 0 && (
            <div className="report-section">
              <h3>Results</h3>
              <div className="results-display">
                <pre>{JSON.stringify(currentExecution.results, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="report-actions">
            <button className="btn-secondary">
              <Download size={16} /> Download PDF
            </button>
            <button className="btn-secondary">
              <Download size={16} /> Download Excel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== LIFECYCLE ====================
  useEffect(() => {
    loadProcesses();
  }, []);

  // ==================== RENDER ====================
  return (
    <div className="process-builder-v2">
      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification notification-${notif.type}`}>
            {notif.type === 'success' && <CheckCircle size={16} />}
            {notif.type === 'error' && <XCircle size={16} />}
            {notif.type === 'warning' && <AlertCircle size={16} />}
            <span>{notif.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}>
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      {loading && <div className="loading-overlay"><div className="spinner"></div></div>}

      {mode === 'list' && renderListView()}
      {mode === 'create' && renderCreateView()}
      {mode === 'edit' && renderEditView()}
      {mode === 'report' && renderReportView()}
    </div>
  );
};

export default ProcessBuilderV2;