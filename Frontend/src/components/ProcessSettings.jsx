import React, { useState, useEffect } from 'react'
import { Plus, Trash2, X, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react'

const ProcessSettings = ({
  workflow = {},
  periods = [],
  rules = [],
  onAddPeriod,
  onAddRule,
  onDeleteRule,
  onUpdateSettings,
  isLoading = false,
  activeTab = 'general',
  onTabChange = () => {}
}) => {
  const [localSettings, setLocalSettings] = useState(workflow?.settings || {})
  const [periodForm, setPeriodForm] = useState({
    period_name: '',
    period_start_date: '',
    period_end_date: '',
  })
  const [ruleForm, setRuleForm] = useState({
    rule_name: '',
    rule_type: 'fx_translation',
    priority: 0,
    rule_config: {}
  })
  const [expandedSections, setExpandedSections] = useState({
    settings: true,
    periods: false,
    rules: false,
    validation: false,
  })

  const RULE_TYPES = [
    { value: 'fx_translation', label: 'FX Translation' },
    { value: 'intercompany', label: 'Intercompany Elimination' },
    { value: 'nci_calculation', label: 'NCI Calculation' },
    { value: 'fair_value', label: 'Fair Value Adjustment' },
    { value: 'deferred_tax', label: 'Deferred Tax' },
    { value: 'rounding', label: 'Rounding Rule' },
    { value: 'validation', label: 'Validation Rule' },
  ]

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    try {
      await onUpdateSettings(localSettings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const handleAddPeriod = async (e) => {
    e.preventDefault()
    if (!periodForm.period_name) return
    try {
      await onAddPeriod(periodForm)
      setPeriodForm({ period_name: '', period_start_date: '', period_end_date: '' })
    } catch (error) {
      console.error('Failed to add period:', error)
    }
  }

  const handleAddRule = async (e) => {
    e.preventDefault()
    if (!ruleForm.rule_name) return
    try {
      await onAddRule(ruleForm)
      setRuleForm({ rule_name: '', rule_type: 'fx_translation', priority: 0, rule_config: {} })
    } catch (error) {
      console.error('Failed to add rule:', error)
    }
  }

  return (
    <div className="process-settings-panel">
      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => onTabChange('general')}
        >
          General
        </button>
        <button
          className={`tab ${activeTab === 'periods' ? 'active' : ''}`}
          onClick={() => onTabChange('periods')}
        >
          Periods
        </button>
        <button
          className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => onTabChange('rules')}
        >
          Rules
        </button>
        <button
          className={`tab ${activeTab === 'validation' ? 'active' : ''}`}
          onClick={() => onTabChange('validation')}
        >
          Validation
        </button>
      </div>

      <div className="settings-content">
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="settings-section">
            <div className="section-header" onClick={() => toggleSection('settings')}>
              <ChevronDown 
                size={20} 
                className={`chevron ${expandedSections.settings ? 'expanded' : ''}`}
              />
              <h3>General Settings</h3>
            </div>

            {expandedSections.settings && (
              <div className="section-content">
                <div className="form-group">
                  <label>Workflow Name</label>
                  <input
                    type="text"
                    value={workflow?.name || ''}
                    readOnly
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={workflow?.description || ''}
                    readOnly
                    className="form-textarea"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Process Type</label>
                    <select
                      value={localSettings?.process_type || 'general'}
                      onChange={(e) => handleSettingChange('process_type', e.target.value)}
                      className="form-select"
                    >
                      <option value="general">General</option>
                      <option value="consolidation">Consolidation</option>
                      <option value="close">Period Close</option>
                      <option value="forecast">Forecast</option>
                      <option value="budget">Budget</option>
                      <option value="reporting">Reporting</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fiscal Year</label>
                    <input
                      type="text"
                      value={localSettings?.fiscal_year || new Date().getFullYear()}
                      onChange={(e) => handleSettingChange('fiscal_year', e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Base Currency</label>
                    <input
                      type="text"
                      placeholder="e.g., USD, EUR"
                      value={localSettings?.base_currency || ''}
                      onChange={(e) => handleSettingChange('base_currency', e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Rounding Precision</label>
                    <select
                      value={localSettings?.rounding_precision || '2'}
                      onChange={(e) => handleSettingChange('rounding_precision', e.target.value)}
                      className="form-select"
                    >
                      <option value="0">Whole Numbers</option>
                      <option value="1">1 Decimal Place</option>
                      <option value="2">2 Decimal Places</option>
                      <option value="3">3 Decimal Places</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={localSettings?.allow_simulation || false}
                      onChange={(e) => handleSettingChange('allow_simulation', e.target.checked)}
                    />
                    Allow Simulation Before Finalization
                  </label>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                >
                  Save Settings
                </button>
              </div>
            )}
          </div>
        )}

        {/* Periods Tab */}
        {activeTab === 'periods' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>Workflow Periods</h3>
            </div>

            <div className="periods-list">
              {periods && periods.length > 0 ? (
                periods.map(period => (
                  <div key={period.id} className="period-item">
                    <div className="period-info">
                      <h4>{period.period_name}</h4>
                      <p>
                        {period.period_start_date} to {period.period_end_date}
                      </p>
                    </div>
                    <div className="period-status">
                      {period.is_open ? (
                        <span className="badge badge-open">Open</span>
                      ) : (
                        <span className="badge badge-closed">Closed</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">No periods defined yet</p>
              )}
            </div>

            <form onSubmit={handleAddPeriod} className="add-period-form">
              <h4>Add Period</h4>
              <div className="form-group">
                <label>Period Name</label>
                <input
                  type="text"
                  placeholder="e.g., January 2025"
                  value={periodForm.period_name}
                  onChange={(e) => setPeriodForm({ ...periodForm, period_name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={periodForm.period_start_date}
                    onChange={(e) => setPeriodForm({ ...periodForm, period_start_date: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={periodForm.period_end_date}
                    onChange={(e) => setPeriodForm({ ...periodForm, period_end_date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                <Plus size={18} /> Add Period
              </button>
            </form>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>Processing Rules</h3>
            </div>

            <div className="rules-list">
              {rules && rules.length > 0 ? (
                rules
                  .sort((a, b) => b.priority - a.priority)
                  .map(rule => (
                    <div key={rule.id} className="rule-item">
                      <div className="rule-info">
                        <h4>{rule.rule_name}</h4>
                        <p className="rule-type">{rule.rule_type}</p>
                        <span className="priority-badge">Priority: {rule.priority}</span>
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onDeleteRule(rule.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
              ) : (
                <p className="empty-message">No rules defined yet</p>
              )}
            </div>

            <form onSubmit={handleAddRule} className="add-rule-form">
              <h4>Add Rule</h4>
              <div className="form-group">
                <label>Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g., Monthly FX Translation"
                  value={ruleForm.rule_name}
                  onChange={(e) => setRuleForm({ ...ruleForm, rule_name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rule Type</label>
                  <select
                    value={ruleForm.rule_type}
                    onChange={(e) => setRuleForm({ ...ruleForm, rule_type: e.target.value })}
                    className="form-select"
                  >
                    {RULE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={ruleForm.priority}
                    onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                <Plus size={18} /> Add Rule
              </button>
            </form>
          </div>
        )}

        {/* Validation Tab */}
        {activeTab === 'validation' && (
          <div className="settings-section">
            <div className="section-header">
              <h3>Validation Checks</h3>
            </div>

            <div className="validation-checks">
              <div className="check-item">
                <CheckCircle size={20} className="check-icon pass" />
                <div className="check-details">
                  <h4>Balance Sheet Balance</h4>
                  <p>Assets = Liabilities + Equity</p>
                </div>
              </div>

              <div className="check-item">
                <CheckCircle size={20} className="check-icon pass" />
                <div className="check-details">
                  <h4>Intercompany Net to Zero</h4>
                  <p>All intercompany balances must eliminate completely</p>
                </div>
              </div>

              <div className="check-item">
                <AlertCircle size={20} className="check-icon warn" />
                <div className="check-details">
                  <h4>Entity Coverage</h4>
                  <p>All consolidation entities have been configured</p>
                </div>
              </div>

              <div className="check-item">
                <AlertCircle size={20} className="check-icon warn" />
                <div className="check-details">
                  <h4>FX Rates Complete</h4>
                  <p>FX rates defined for all required currency pairs</p>
                </div>
              </div>

              <div className="check-item">
                <CheckCircle size={20} className="check-icon pass" />
                <div className="check-details">
                  <h4>Ownership Percentages</h4>
                  <p>All ownership percentages sum to 100%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProcessSettings