import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function ProcessSettingsPanel({
  processId,
  periods = [],
  rules = [],
  onClose,
  companyId,
  token
}) {
  const [activeTab, setActiveTab] = useState('general');
  const [localPeriods, setLocalPeriods] = useState(periods);
  const [localRules, setLocalRules] = useState(rules);
  const [newPeriod, setNewPeriod] = useState(null);
  const [newRule, setNewRule] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddPeriod = async () => {
    if (!newPeriod || !newPeriod.period_name) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/process/${processId}/periods/add?company_id=${companyId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newPeriod)
        }
      );
      if (!response.ok) throw new Error('Failed to add period');
      
      setLocalPeriods([...localPeriods, newPeriod]);
      setNewPeriod(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRule || !newRule.rule_name) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/process/${processId}/rules/add?company_id=${companyId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newRule)
        }
      );
      if (!response.ok) throw new Error('Failed to add rule');
      
      setLocalRules([...localRules, newRule]);
      setNewRule(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-panel">
      <div className="panel-header">
        <h3>Process Settings</h3>
        <button className="btn-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`tab ${activeTab === 'periods' ? 'active' : ''}`}
          onClick={() => setActiveTab('periods')}
        >
          Periods
        </button>
        <button
          className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Rules
        </button>
        <button
          className={`tab ${activeTab === 'validation' ? 'active' : ''}`}
          onClick={() => setActiveTab('validation')}
        >
          Validation
        </button>
      </div>

      <div className="settings-content">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="tab-pane">
            <div className="form-group">
              <label>Base Currency</label>
              <select>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>JPY</option>
                <option>CNY</option>
              </select>
            </div>

            <div className="form-group">
              <label>Rounding Precision</label>
              <select>
                <option value="0">Whole numbers</option>
                <option value="2">2 Decimal places</option>
                <option value="4">4 Decimal places</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input type="checkbox" defaultChecked />
                Enable Simulation Mode
              </label>
            </div>

            <div className="form-group">
              <label>
                <input type="checkbox" defaultChecked />
                Require Approval Before Finalization
              </label>
            </div>

            <div className="form-group">
              <label>
                <input type="checkbox" />
                Auto-calculate Derived Fields
              </label>
            </div>
          </div>
        )}

        {/* Periods Tab */}
        {activeTab === 'periods' && (
          <div className="tab-pane">
            <div className="periods-list">
              <h4>Process Periods</h4>
              {localPeriods.length === 0 ? (
                <p className="text-muted">No periods added yet</p>
              ) : (
                <div className="list-items">
                  {localPeriods.map((period, idx) => (
                    <div key={idx} className="list-item">
                      <div className="item-info">
                        <strong>{period.period_name}</strong>
                        <small>
                          {period.start_date} to {period.end_date}
                        </small>
                        <small className="text-muted">FY {period.fiscal_year}</small>
                      </div>
                      <span className={`status-badge ${period.is_open ? 'open' : 'closed'}`}>
                        {period.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="add-period-form">
              <h4>Add Period</h4>
              {newPeriod ? (
                <div className="form-inputs">
                  <input
                    type="text"
                    placeholder="Period name (e.g., Jan 2025)"
                    value={newPeriod.period_name || ''}
                    onChange={(e) => setNewPeriod({ ...newPeriod, period_name: e.target.value })}
                  />
                  <input
                    type="date"
                    value={newPeriod.start_date || ''}
                    onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })}
                  />
                  <input
                    type="date"
                    value={newPeriod.end_date || ''}
                    onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Fiscal year"
                    value={newPeriod.fiscal_year || ''}
                    onChange={(e) => setNewPeriod({ ...newPeriod, fiscal_year: parseInt(e.target.value) })}
                  />
                  <div className="button-group">
                    <button className="btn-primary" onClick={handleAddPeriod} disabled={loading}>
                      Add
                    </button>
                    <button className="btn-ghost" onClick={() => setNewPeriod(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn-secondary" onClick={() => setNewPeriod({})}>
                  <Plus size={16} /> Add Period
                </button>
              )}
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="tab-pane">
            <div className="rules-list">
              <h4>Processing Rules</h4>
              {localRules.length === 0 ? (
                <p className="text-muted">No rules added yet</p>
              ) : (
                <div className="list-items">
                  {localRules.map((rule, idx) => (
                    <div key={idx} className="list-item">
                      <div className="item-info">
                        <strong>{rule.rule_name}</strong>
                        <small className="text-muted">{rule.rule_type}</small>
                        <small>Priority: {rule.priority || 10}</small>
                      </div>
                      <button className="btn-icon-small danger">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="add-rule-form">
              <h4>Add Rule</h4>
              {newRule ? (
                <div className="form-inputs">
                  <select
                    value={newRule.rule_type || ''}
                    onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value })}
                  >
                    <option value="">Select rule type</option>
                    <option value="fx_translation">FX Translation</option>
                    <option value="intercompany">Intercompany</option>
                    <option value="nci">NCI</option>
                    <option value="fair_value">Fair Value</option>
                    <option value="deferred_tax">Deferred Tax</option>
                    <option value="rounding">Rounding</option>
                    <option value="validation">Validation</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Rule name"
                    value={newRule.rule_name || ''}
                    onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Priority (1-100)"
                    value={newRule.priority || 10}
                    onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                  />
                  <div className="button-group">
                    <button className="btn-primary" onClick={handleAddRule} disabled={loading}>
                      Add
                    </button>
                    <button className="btn-ghost" onClick={() => setNewRule(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn-secondary" onClick={() => setNewRule({})}>
                  <Plus size={16} /> Add Rule
                </button>
              )}
            </div>
          </div>
        )}

        {/* Validation Tab */}
        {activeTab === 'validation' && (
          <div className="tab-pane">
            <div className="validation-checks">
              <h4>Validation Checks</h4>
              
              <div className="check-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Balance Sheet Balance (Assets = Liabilities + Equity)
                </label>
              </div>

              <div className="check-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Intercompany Net to Zero
                </label>
              </div>

              <div className="check-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Entity Coverage (All entities included)
                </label>
              </div>

              <div className="check-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  FX Rates Complete
                </label>
              </div>

              <div className="check-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Ownership Percentages (Total = 100%)
                </label>
              </div>

              <div className="check-item">
                <label>
                  <input type="checkbox" />
                  Goodwill Impairment Tested
                </label>
              </div>

              <div className="check-item">
                <label>
                  <input type="checkbox" />
                  Fair Value Adjustments Reconciled
                </label>
              </div>

              <div className="check-item">
                <label>
                  <input type="checkbox" />
                  Deferred Tax Position Calculated
                </label>
              </div>
            </div>

            <div className="validation-settings">
              <h4>Alert Settings</h4>
              <label>
                <input type="radio" name="alert" defaultChecked /> Fail on Any Error
              </label>
              <label>
                <input type="radio" name="alert" /> Warn but Allow Continue
              </label>
              <label>
                <input type="radio" name="alert" /> Warnings Only
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}