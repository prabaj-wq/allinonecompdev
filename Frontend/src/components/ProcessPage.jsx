import React, { useState, useEffect, useCallback } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import {
  Plus, Settings, Save, Play, CheckCircle, AlertCircle, 
  ChevronLeft, X, Loader2, Eye, Eye2
} from 'lucide-react'
import ProcessCanvas from './ProcessCanvas'
import ProcessSettings from './ProcessSettings'
import NodeEditor from './NodeEditor'
import '../styles/ProcessPage.css'

const ProcessPage = () => {
  const { selectedCompany } = useCompany()
  const { isAuthenticated, getAuthHeaders } = useAuth()

  // Workflow states
  const [workflows, setWorkflows] = useState([])
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [workflowCreating, setWorkflowCreating] = useState(false)

  // UI states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [nodeEditorOpen, setNodeEditorOpen] = useState(false)
  const [settingsView, setSettingsView] = useState('canvas') // 'canvas' or 'settings'
  const [activeSettingsTab, setActiveSettingsTab] = useState('general')
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [nodeTemplates, setNodeTemplates] = useState([])
  const [nodeSuggestions, setNodeSuggestions] = useState([])
  const [simulationMode, setSimulationMode] = useState(false)
  const [simulationRunId, setSimulationRunId] = useState(null)

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    process_type: 'general'
  })
  const [notification, setNotification] = useState(null)

  // =========================================================================
  // UTILITIES
  // =========================================================================

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const authHeaders = () => getAuthHeaders()

  const apiUrl = (path) => `/api/workflow${path}`

  // =========================================================================
  // WORKFLOW OPERATIONS
  // =========================================================================

  const fetchWorkflows = useCallback(async () => {
    if (!selectedCompany || !isAuthenticated) return
    setWorkflowLoading(true)
    try {
      const response = await fetch(
        apiUrl('/workflows/list') + `?company_name=${encodeURIComponent(selectedCompany)}`,
        { method: 'GET', headers: authHeaders(), credentials: 'include' }
      )
      if (!response.ok) throw new Error('Failed to load workflows')
      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error('Failed to fetch workflows:', error)
      showNotification('Failed to load workflows', 'error')
    } finally {
      setWorkflowLoading(false)
    }
  }, [selectedCompany, isAuthenticated])

  const fetchNodeTemplates = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/node-templates/all'))
      if (!response.ok) throw new Error('Failed to load templates')
      const data = await response.json()
      setNodeTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to fetch node templates:', error)
    }
  }, [])

  const fetchNodeSuggestions = useCallback(async () => {
    if (!selectedWorkflow) return
    try {
      const response = await fetch(
        apiUrl(`/node-templates/suggestions?workflow_id=${selectedWorkflow.workflow_id}&company_name=${encodeURIComponent(selectedCompany)}`),
        { method: 'GET', headers: authHeaders(), credentials: 'include' }
      )
      if (!response.ok) throw new Error('Failed to load suggestions')
      const data = await response.json()
      setNodeSuggestions(data.node_templates || [])
    } catch (error) {
      console.error('Failed to fetch node suggestions:', error)
    }
  }, [selectedWorkflow, selectedCompany, isAuthenticated])

  useEffect(() => {
    fetchWorkflows()
    fetchNodeTemplates()
  }, [fetchWorkflows, fetchNodeTemplates])

  useEffect(() => {
    fetchNodeSuggestions()
  }, [fetchNodeSuggestions])

  // =========================================================================
  // WORKFLOW CREATION
  // =========================================================================

  const handleCreateWorkflow = async (e) => {
    e.preventDefault()
    if (!createForm.name) return

    setWorkflowCreating(true)
    try {
      const response = await fetch(
        apiUrl('/workflows/create') + `?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(createForm)
        }
      )
      if (!response.ok) throw new Error('Failed to create workflow')
      const data = await response.json()
      showNotification('Workflow created successfully')
      setCreateForm({ name: '', description: '', process_type: 'general' })
      setCreateModalOpen(false)
      await fetchWorkflows()
    } catch (error) {
      console.error('Failed to create workflow:', error)
      showNotification('Failed to create workflow', 'error')
    } finally {
      setWorkflowCreating(false)
    }
  }

  const selectWorkflow = useCallback(async (workflowId) => {
    setWorkflowLoading(true)
    try {
      const response = await fetch(
        apiUrl(`/workflows/${workflowId}/details?company_name=${encodeURIComponent(selectedCompany)}`),
        { method: 'GET', headers: authHeaders(), credentials: 'include' }
      )
      if (!response.ok) throw new Error('Failed to load workflow details')
      const data = await response.json()
      setSelectedWorkflow(data.workflow)
    } catch (error) {
      console.error('Failed to select workflow:', error)
      showNotification('Failed to load workflow details', 'error')
    } finally {
      setWorkflowLoading(false)
    }
  }, [selectedCompany, isAuthenticated])

  // =========================================================================
  // NODE OPERATIONS
  // =========================================================================

  const handleAddNode = async (nodeType) => {
    if (!selectedWorkflow) return
    setNodeEditorOpen(true)
  }

  const handleNodeSave = async (nodeConfig) => {
    if (!selectedWorkflow) return

    try {
      const response = await fetch(
        apiUrl(`/workflows/${selectedWorkflow.workflow_id}/nodes/add?company_name=${encodeURIComponent(selectedCompany)}`),
        {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(nodeConfig)
        }
      )
      if (!response.ok) throw new Error('Failed to add node')
      showNotification('Node added successfully')
      setNodeEditorOpen(false)
      await selectWorkflow(selectedWorkflow.workflow_id)
    } catch (error) {
      console.error('Failed to add node:', error)
      showNotification('Failed to add node', 'error')
    }
  }

  const handleDeleteNode = async (nodeId) => {
    if (!selectedWorkflow || !confirm('Delete this node?')) return

    try {
      const response = await fetch(
        apiUrl(`/workflows/${selectedWorkflow.workflow_id}/nodes/${nodeId}/delete?company_name=${encodeURIComponent(selectedCompany)}`),
        { method: 'DELETE', headers: authHeaders(), credentials: 'include' }
      )
      if (!response.ok) throw new Error('Failed to delete node')
      showNotification('Node deleted')
      await selectWorkflow(selectedWorkflow.workflow_id)
    } catch (error) {
      console.error('Failed to delete node:', error)
      showNotification('Failed to delete node', 'error')
    }
  }

  const handleConnectNodes = async (sourceId, targetId) => {
    if (!selectedWorkflow) return

    try {
      const response = await fetch(
        apiUrl(`/workflows/${selectedWorkflow.workflow_id}/nodes/connect?company_name=${encodeURIComponent(selectedCompany)}`),
        {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            source_node_id: sourceId,
            target_node_id: targetId,
            connection_type: 'sequential'
          })
        }
      )
      if (!response.ok) throw new Error('Failed to connect nodes')
      showNotification('Nodes connected')
      await selectWorkflow(selectedWorkflow.workflow_id)
    } catch (error) {
      console.error('Failed to connect nodes:', error)
      showNotification('Failed to connect nodes', 'error')
    }
  }

  // =========================================================================
  // SIMULATION & EXECUTION
  // =========================================================================

  const handleRunSimulation = async () => {
    if (!selectedWorkflow) return

    setSimulationMode(true)
    try {
      const response = await fetch(
        apiUrl(`/workflows/${selectedWorkflow.workflow_id}/simulate?company_name=${encodeURIComponent(selectedCompany)}`),
        { method: 'POST', headers: authHeaders(), credentials: 'include' }
      )
      if (!response.ok) throw new Error('Failed to run simulation')
      const data = await response.json()
      setSimulationRunId(data.simulation_run_id)
      showNotification('Simulation started')
    } catch (error) {
      console.error('Failed to run simulation:', error)
      showNotification('Failed to run simulation', 'error')
      setSimulationMode(false)
    }
  }

  const handleFinalizeWorkflow = async () => {
    if (!selectedWorkflow || !confirm('Finalize this workflow?')) return

    try {
      const response = await fetch(
        apiUrl(`/workflows/${selectedWorkflow.workflow_id}/finalize?company_name=${encodeURIComponent(selectedCompany)}`),
        { method: 'POST', headers: authHeaders(), credentials: 'include' }
      )
      if (!response.ok) throw new Error('Failed to finalize workflow')
      showNotification('Workflow finalized')
      await selectWorkflow(selectedWorkflow.workflow_id)
    } catch (error) {
      console.error('Failed to finalize workflow:', error)
      showNotification('Failed to finalize workflow', 'error')
    }
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  if (!selectedWorkflow) {
    return (
      <div className="process-page">
        <div className="page-header">
          <h1>Process Management</h1>
          <p>Build automated workflows for financial processes</p>
        </div>

        <div className="workflows-section">
          <div className="section-header">
            <h2>My Workflows</h2>
            <button
              className="btn btn-primary"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={20} /> New Workflow
            </button>
          </div>

          {workflowLoading ? (
            <div className="loading-state">
              <Loader2 size={40} className="spinner" />
              <p>Loading workflows...</p>
            </div>
          ) : workflows.length > 0 ? (
            <div className="workflows-grid">
              {workflows.map(workflow => (
                <div
                  key={workflow.id}
                  className="workflow-card"
                  onClick={() => selectWorkflow(workflow.workflow_id)}
                >
                  <div className="card-header">
                    <h3>{workflow.name}</h3>
                    <span className={`status-badge status-${workflow.status}`}>
                      {workflow.status}
                    </span>
                  </div>
                  <p className="card-description">{workflow.description}</p>
                  <div className="card-footer">
                    <span className="badge badge-type">{workflow.process_type}</span>
                    <span className="date">
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <AlertCircle size={48} />
              <h3>No workflows yet</h3>
              <p>Create your first workflow to get started</p>
            </div>
          )}
        </div>

        {createModalOpen && (
          <>
            <div className="modal-overlay" onClick={() => setCreateModalOpen(false)} />
            <div className="modal open">
              <div className="modal-header">
                <h2>Create New Workflow</h2>
                <button className="close-btn" onClick={() => setCreateModalOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateWorkflow} className="modal-body">
                <div className="form-group">
                  <label>Workflow Name *</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g., Q4 2025 Consolidation"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Describe this workflow..."
                    className="form-textarea"
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Process Type</label>
                  <select
                    value={createForm.process_type}
                    onChange={(e) => setCreateForm({ ...createForm, process_type: e.target.value })}
                    className="form-select"
                  >
                    <option value="general">General</option>
                    <option value="consolidation">Consolidation</option>
                    <option value="close">Period Close</option>
                    <option value="forecast">Forecast</option>
                  </select>
                </div>
              </form>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={workflowCreating}
                  onClick={handleCreateWorkflow}
                >
                  {workflowCreating ? 'Creating...' : 'Create Workflow'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Workflow Editor View
  return (
    <div className="process-page workflow-editor">
      {/* Header with workflow info */}
      <div className="workflow-header">
        <div className="header-left">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedWorkflow(null)
              setSimulationMode(false)
            }}
          >
            <ChevronLeft size={20} /> Back
          </button>
          <div className="workflow-info">
            <h1>{selectedWorkflow?.name}</h1>
            <span className={`status-badge status-${selectedWorkflow?.status}`}>
              {selectedWorkflow?.status}
            </span>
          </div>
        </div>
        <div className="header-right">
          <button
            className={`btn ${settingsView === 'canvas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setSettingsView('canvas')
              setActiveSettingsTab('general')
            }}
          >
            Canvas
          </button>
          <button
            className={`btn ${settingsView === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSettingsView('settings')}
          >
            <Settings size={20} /> Settings
          </button>
          {simulationMode ? (
            <button className="btn btn-warning" onClick={() => setSimulationMode(false)}>
              <Eye size={20} /> Simulation Mode
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleRunSimulation}
              disabled={!selectedWorkflow?.nodes || selectedWorkflow.nodes.length === 0}
            >
              <Play size={20} /> Simulate
            </button>
          )}
          <button
            className="btn btn-success"
            onClick={handleFinalizeWorkflow}
            disabled={selectedWorkflow?.status === 'finalized'}
          >
            <CheckCircle size={20} /> Finalize
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="workflow-content">
        {settingsView === 'canvas' ? (
          <>
            <div className="canvas-section">
              <ProcessCanvas
                workflowId={selectedWorkflow.workflow_id}
                nodes={selectedWorkflow.nodes || []}
                connections={selectedWorkflow.connections || []}
                onAddNode={handleAddNode}
                onDeleteNode={handleDeleteNode}
                onEditNode={(nodeId) => setSelectedNodeId(nodeId)}
                onConnectNodes={handleConnectNodes}
                onRunSimulation={handleRunSimulation}
                selectedNode={selectedWorkflow.nodes?.find(n => n.id === selectedNodeId)}
                onSelectNode={setSelectedNodeId}
                simulationRunning={simulationMode}
              />
            </div>

            {/* Node suggestions sidebar */}
            <div className="node-suggestions">
              <h3>Node Templates</h3>
              <div className="suggestions-list">
                {nodeSuggestions.map(template => (
                  <div
                    key={template.type}
                    className={`suggestion-item ${template.recommended ? 'recommended' : ''}`}
                    onClick={() => handleAddNode(template.type)}
                  >
                    <div className="suggestion-header">
                      <h4>{template.title}</h4>
                      {template.recommended && (
                        <span className="badge badge-recommended">Recommended</span>
                      )}
                    </div>
                    <p className="suggestion-description">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="settings-section">
            <ProcessSettings
              workflow={selectedWorkflow}
              periods={selectedWorkflow.periods || []}
              rules={selectedWorkflow.rules || []}
              onAddPeriod={async (period) => {
                // Implementation for adding periods
              }}
              onAddRule={async (rule) => {
                // Implementation for adding rules
              }}
              onDeleteRule={async (ruleId) => {
                // Implementation for deleting rules
              }}
              onUpdateSettings={async (settings) => {
                // Implementation for updating settings
              }}
              activeTab={activeSettingsTab}
              onTabChange={setActiveSettingsTab}
            />
          </div>
        )}
      </div>

      {/* Node Editor Modal */}
      <NodeEditor
        node={null}
        nodeTemplates={nodeTemplates}
        isOpen={nodeEditorOpen}
        onClose={() => setNodeEditorOpen(false)}
        onSave={handleNodeSave}
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  )
}

export default ProcessPage