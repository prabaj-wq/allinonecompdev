import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, ChevronDown } from 'lucide-react'

const NodeEditor = ({
  node = null,
  nodeTemplates = [],
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  isLoading = false
}) => {
  const [nodeConfig, setNodeConfig] = useState({
    title: '',
    description: '',
    node_type: '',
    custom_fields: [],
    node_config: {},
    is_enabled: true,
  })
  const [customFieldForm, setCustomFieldForm] = useState(null)
  const [fieldEditingIndex, setFieldEditingIndex] = useState(null)

  useEffect(() => {
    if (node) {
      setNodeConfig({
        title: node.title || '',
        description: node.description || '',
        node_type: node.node_type || '',
        custom_fields: node.custom_fields || [],
        node_config: node.node_config || {},
        is_enabled: node.is_enabled !== false,
      })
    }
  }, [node, isOpen])

  const handleAddCustomField = () => {
    setCustomFieldForm({
      field_name: '',
      field_label: '',
      field_type: 'text',
      options: [],
      default_value: '',
      is_required: false,
      validation_rules: {},
    })
  }

  const handleSaveCustomField = () => {
    if (!customFieldForm.field_name || !customFieldForm.field_label) {
      alert('Field name and label are required')
      return
    }

    if (fieldEditingIndex !== null) {
      const updated = [...nodeConfig.custom_fields]
      updated[fieldEditingIndex] = customFieldForm
      setNodeConfig({ ...nodeConfig, custom_fields: updated })
      setFieldEditingIndex(null)
    } else {
      setNodeConfig({
        ...nodeConfig,
        custom_fields: [...nodeConfig.custom_fields, customFieldForm]
      })
    }
    setCustomFieldForm(null)
  }

  const handleDeleteCustomField = (index) => {
    setNodeConfig({
      ...nodeConfig,
      custom_fields: nodeConfig.custom_fields.filter((_, i) => i !== index)
    })
  }

  const handleEditCustomField = (index) => {
    setCustomFieldForm(nodeConfig.custom_fields[index])
    setFieldEditingIndex(index)
  }

  const handleConfigChange = (key, value) => {
    setNodeConfig(prev => ({
      ...prev,
      node_config: {
        ...prev.node_config,
        [key]: value
      }
    }))
  }

  const handleSaveNode = async () => {
    if (!nodeConfig.title) {
      alert('Node title is required')
      return
    }
    await onSave(nodeConfig)
  }

  const template = nodeTemplates.find(t => t.type === nodeConfig.node_type)

  return (
    <>
      {isOpen && <div className="modal-overlay" onClick={onClose} />}
      
      <div className={`modal ${isOpen ? 'open' : ''}`}>
        <div className="modal-header">
          <h2>{node ? 'Edit Node' : 'Create Node'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <h3>Node Properties</h3>

            <div className="form-group">
              <label htmlFor="node-title">Title *</label>
              <input
                id="node-title"
                type="text"
                value={nodeConfig.title}
                onChange={(e) => setNodeConfig({ ...nodeConfig, title: e.target.value })}
                placeholder="e.g., Monthly FX Translation"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="node-description">Description</label>
              <textarea
                id="node-description"
                value={nodeConfig.description}
                onChange={(e) => setNodeConfig({ ...nodeConfig, description: e.target.value })}
                placeholder="Describe what this node does..."
                className="form-textarea"
                rows="2"
              />
            </div>

            {!node && (
              <div className="form-group">
                <label htmlFor="node-type">Node Type *</label>
                <select
                  id="node-type"
                  value={nodeConfig.node_type}
                  onChange={(e) => setNodeConfig({ ...nodeConfig, node_type: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select a template</option>
                  {nodeTemplates.map(t => (
                    <option key={t.type} value={t.type}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={nodeConfig.is_enabled}
                  onChange={(e) => setNodeConfig({ ...nodeConfig, is_enabled: e.target.checked })}
                />
                Enable this node
              </label>
            </div>
          </div>

          {template && (
            <>
              <div className="form-section">
                <h3>Template Info</h3>
                <p className="info-text">{template.description}</p>
                <div className="info-box">
                  <div className="info-row">
                    <strong>Inputs:</strong>
                    <code>{template.inputs.join(', ')}</code>
                  </div>
                  <div className="info-row">
                    <strong>Outputs:</strong>
                    <code>{template.outputs.join(', ')}</code>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Node Configuration</h3>
                {template.type === 'fx_translation' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="fx-type">Translation Method</label>
                      <select
                        id="fx-type"
                        value={nodeConfig.node_config.translation_method || 'closing_rate'}
                        onChange={(e) => handleConfigChange('translation_method', e.target.value)}
                        className="form-select"
                      >
                        <option value="closing_rate">Closing Rate</option>
                        <option value="average_rate">Average Rate</option>
                        <option value="historical_rate">Historical Rate</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={nodeConfig.node_config.record_cta || false}
                          onChange={(e) => handleConfigChange('record_cta', e.target.checked)}
                        />
                        Record Currency Translation Adjustment (CTA)
                      </label>
                    </div>
                  </>
                )}

                {template.type === 'intercompany_elimination' && (
                  <div className="form-group">
                    <label htmlFor="ic-method">Elimination Method</label>
                    <select
                      id="ic-method"
                      value={nodeConfig.node_config.elimination_method || 'full'}
                      onChange={(e) => handleConfigChange('elimination_method', e.target.value)}
                      className="form-select"
                    >
                      <option value="full">Full Elimination</option>
                      <option value="proportionate">Proportionate</option>
                      <option value="by_amount">By Amount</option>
                    </select>
                  </div>
                )}

                {template.type === 'nci_calculation' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="nci-method">Measurement Method</label>
                      <select
                        id="nci-method"
                        value={nodeConfig.node_config.measurement_method || 'proportionate'}
                        onChange={(e) => handleConfigChange('measurement_method', e.target.value)}
                        className="form-select"
                      >
                        <option value="proportionate">Proportionate Share</option>
                        <option value="fair_value">Fair Value</option>
                      </select>
                    </div>
                  </>
                )}

                {template.type === 'deferred_tax' && (
                  <div className="form-group">
                    <label htmlFor="tax-rate">Standard Tax Rate (%)</label>
                    <input
                      id="tax-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={nodeConfig.node_config.tax_rate || 20}
                      onChange={(e) => handleConfigChange('tax_rate', parseFloat(e.target.value))}
                      className="form-input"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div className="form-section">
            <div className="section-header" onClick={() => {}} style={{ cursor: 'default' }}>
              <h3>Custom Fields</h3>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleAddCustomField}
              >
                <Plus size={18} /> Add Field
              </button>
            </div>

            <div className="custom-fields-list">
              {nodeConfig.custom_fields.map((field, index) => (
                <div key={index} className="custom-field-item">
                  <div className="field-info">
                    <strong>{field.field_label}</strong>
                    <span className="field-type">{field.field_type}</span>
                    {field.is_required && <span className="badge badge-required">Required</span>}
                  </div>
                  <div className="field-actions">
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleEditCustomField(index)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-xs"
                      onClick={() => handleDeleteCustomField(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {customFieldForm && (
            <div className="custom-field-editor">
              <h4>{fieldEditingIndex !== null ? 'Edit Custom Field' : 'Add Custom Field'}</h4>

              <div className="form-group">
                <label htmlFor="cf-name">Field Name *</label>
                <input
                  id="cf-name"
                  type="text"
                  value={customFieldForm.field_name}
                  onChange={(e) => setCustomFieldForm({ ...customFieldForm, field_name: e.target.value })}
                  placeholder="e.g., fx_rate"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cf-label">Field Label *</label>
                <input
                  id="cf-label"
                  type="text"
                  value={customFieldForm.field_label}
                  onChange={(e) => setCustomFieldForm({ ...customFieldForm, field_label: e.target.value })}
                  placeholder="e.g., FX Rate"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cf-type">Field Type</label>
                <select
                  id="cf-type"
                  value={customFieldForm.field_type}
                  onChange={(e) => setCustomFieldForm({ ...customFieldForm, field_type: e.target.value })}
                  className="form-select"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Dropdown</option>
                  <option value="textarea">Long Text</option>
                  <option value="boolean">Yes/No</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={customFieldForm.is_required}
                    onChange={(e) => setCustomFieldForm({ ...customFieldForm, is_required: e.target.checked })}
                  />
                  Make this field required
                </label>
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveCustomField}
                >
                  Save Field
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setCustomFieldForm(null)
                    setFieldEditingIndex(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSaveNode}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Node'}
          </button>
        </div>
      </div>
    </>
  )
}

export default NodeEditor