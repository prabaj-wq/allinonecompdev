import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Minus } from 'lucide-react';

export default function NodeConfigPanel({ node, onUpdate, onDelete, onClose }) {
  const [title, setTitle] = useState(node.title || '');
  const [description, setDescription] = useState(node.description || '');
  const [config, setConfig] = useState(node.configuration || {});
  const [customFields, setCustomFields] = useState(node.custom_fields || []);
  const [newField, setNewField] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    onUpdate(node.id, {
      title,
      description,
      configuration: config,
      custom_fields: customFields
    });
    setHasChanges(false);
  };

  const handleConfigChange = (key, value) => {
    setConfig({ ...config, [key]: value });
    setHasChanges(true);
  };

  const addCustomField = () => {
    if (newField && newField.name) {
      setCustomFields([...customFields, newField]);
      setNewField(null);
      setHasChanges(true);
    }
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  // Render node-specific configuration fields
  const renderNodeConfig = () => {
    switch (node.node_type) {
      case 'fx_translation':
        return (
          <div className="config-section">
            <h4>FX Translation Settings</h4>
            <label>
              Translation Method:
              <select
                value={config.translation_method || 'closing_rate'}
                onChange={(e) => handleConfigChange('translation_method', e.target.value)}
              >
                <option value="closing_rate">Closing Rate</option>
                <option value="average">Average Rate</option>
              </select>
            </label>
            <label>
              CTA Treatment:
              <select
                value={config.cta_treatment || 'equity'}
                onChange={(e) => handleConfigChange('cta_treatment', e.target.value)}
              >
                <option value="equity">Equity (OCI)</option>
                <option value="p_and_l">P&L</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={config.revalue_opening || false}
                onChange={(e) => handleConfigChange('revalue_opening', e.target.checked)}
              />
              Revalue Opening Balance
            </label>
          </div>
        );

      case 'intercompany_eliminations':
        return (
          <div className="config-section">
            <h4>Intercompany Elimination Settings</h4>
            <label>
              Elimination Method:
              <select
                value={config.elimination_method || 'full'}
                onChange={(e) => handleConfigChange('elimination_method', e.target.value)}
              >
                <option value="full">Full Elimination</option>
                <option value="partial">Partial Elimination</option>
              </select>
            </label>
            <label>
              Inventory Method:
              <select
                value={config.inventory_method || 'fifo'}
                onChange={(e) => handleConfigChange('inventory_method', e.target.value)}
              >
                <option value="fifo">FIFO</option>
                <option value="lifo">LIFO</option>
                <option value="weighted_avg">Weighted Average</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={config.profit_in_inventory !== false}
                onChange={(e) => handleConfigChange('profit_in_inventory', e.target.checked)}
              />
              Include Profit in Inventory
            </label>
            <label>
              FX Differences Treatment:
              <select
                value={config.fx_differences || 'record'}
                onChange={(e) => handleConfigChange('fx_differences', e.target.value)}
              >
                <option value="record">Record</option>
                <option value="defer">Defer</option>
                <option value="ignore">Ignore</option>
              </select>
            </label>
          </div>
        );

      case 'deferred_taxes':
        return (
          <div className="config-section">
            <h4>Deferred Tax Settings</h4>
            <label>
              Tax Rate (%):
              <input
                type="number"
                step="0.1"
                value={config.tax_rate || 25}
                onChange={(e) => handleConfigChange('tax_rate', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Jurisdiction:
              <input
                type="text"
                value={config.jurisdiction || 'default'}
                onChange={(e) => handleConfigChange('jurisdiction', e.target.value)}
              />
            </label>
            <label>
              DTA Recognition:
              <select
                value={config.dta_recognition || 'full'}
                onChange={(e) => handleConfigChange('dta_recognition', e.target.value)}
              >
                <option value="full">Full</option>
                <option value="partial">Partial</option>
                <option value="none">None</option>
              </select>
            </label>
          </div>
        );

      case 'nci_allocation':
        return (
          <div className="config-section">
            <h4>NCI Allocation Settings</h4>
            <label>
              Measurement Method:
              <select
                value={config.measurement_method || 'proportionate'}
                onChange={(e) => handleConfigChange('measurement_method', e.target.value)}
              >
                <option value="proportionate">Proportionate Share</option>
                <option value="fair_value">Fair Value</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={config.profit_allocation !== false}
                onChange={(e) => handleConfigChange('profit_allocation', e.target.checked)}
              />
              Allocate Profit to NCI
            </label>
            <label>
              <input
                type="checkbox"
                checked={config.oci_allocation !== false}
                onChange={(e) => handleConfigChange('oci_allocation', e.target.checked)}
              />
              Allocate OCI to NCI
            </label>
            <label>
              <input
                type="checkbox"
                checked={config.dividend_tracking !== false}
                onChange={(e) => handleConfigChange('dividend_tracking', e.target.checked)}
              />
              Track Dividends
            </label>
          </div>
        );

      case 'retained_earnings_rollforward':
        return (
          <div className="config-section">
            <h4>Retained Earnings Rollforward</h4>
            <label>
              Opening Balance Method:
              <select
                value={config.opening_balance_method || 'from_prior'}
                onChange={(e) => handleConfigChange('opening_balance_method', e.target.value)}
              >
                <option value="from_prior">From Prior Period</option>
                <option value="manual">Manual Entry</option>
                <option value="calculated">Calculated</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={config.adjustment_tracking !== false}
                onChange={(e) => handleConfigChange('adjustment_tracking', e.target.checked)}
              />
              Track Adjustments
            </label>
            <label>
              <input
                type="checkbox"
                checked={config.dividend_deduction !== false}
                onChange={(e) => handleConfigChange('dividend_deduction', e.target.checked)}
              />
              Deduct Dividends
            </label>
            <label>
              <input
                type="checkbox"
                checked={config.error_correction !== false}
                onChange={(e) => handleConfigChange('error_correction', e.target.checked)}
              />
              Support Error Corrections
            </label>
          </div>
        );

      default:
        return (
          <div className="config-section">
            <p className="text-muted">No specific configuration for this node type</p>
          </div>
        );
    }
  };

  return (
    <div className="node-config-panel">
      <div className="panel-header">
        <h3>Node Configuration</h3>
        <button className="btn-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="panel-body">
        {/* Basic Info */}
        <div className="config-section">
          <h4>Basic Information</h4>
          <label>
            Title:
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }}
            />
          </label>
          <label>
            Description:
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setHasChanges(true); }}
              rows="3"
            />
          </label>
          <p className="text-muted text-small">Node Type: <code>{node.node_type}</code></p>
        </div>

        {/* Node-specific configuration */}
        {renderNodeConfig()}

        {/* Custom Fields */}
        <div className="config-section">
          <h4>Custom Fields</h4>
          {customFields.length > 0 && (
            <div className="fields-list">
              {customFields.map((field, idx) => (
                <div key={idx} className="field-item">
                  <div className="field-info">
                    <strong>{field.name}</strong>
                    <span className="field-type">({field.type})</span>
                    {field.required && <span className="badge-required">Required</span>}
                  </div>
                  <button
                    className="btn-icon-small danger"
                    onClick={() => removeCustomField(idx)}
                  >
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {newField ? (
            <div className="add-field">
              <input
                type="text"
                placeholder="Field name"
                value={newField.name || ''}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              />
              <select
                value={newField.type || 'text'}
                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Select</option>
                <option value="textarea">Textarea</option>
                <option value="boolean">Boolean</option>
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={newField.required || false}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                />
                Required
              </label>
              <button className="btn-secondary" onClick={() => addCustomField()}>
                Add
              </button>
              <button className="btn-ghost" onClick={() => setNewField(null)}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => setNewField({ name: '', type: 'text', required: false })}
            >
              <Plus size={16} /> Add Custom Field
            </button>
          )}
        </div>
      </div>

      <div className="panel-footer">
        <button
          className="btn-danger"
          onClick={() => { if (window.confirm('Delete this node?')) onDelete(node.id); }}
        >
          <Trash2 size={16} /> Delete Node
        </button>
        <button
          className="btn-primary"
          disabled={!hasChanges}
          onClick={handleSave}
        >
          <Save size={16} /> Save Changes
        </button>
      </div>
    </div>
  );
}