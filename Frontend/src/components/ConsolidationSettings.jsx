/**
 * ConsolidationSettings Component
 * Configure consolidation rules, scenarios, entities, and FX rates
 */

import React, { useState, useEffect } from 'react'
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  DollarSign,
  Building2,
  Settings,
  TrendingUp,
} from 'lucide-react'

const CONSOLIDATION_NODE_TYPES = [
  'profit_loss',
  'nci_handling',
  'retained_earnings_rollforward',
  'fx_translation',
  'intercompany_elimination',
  'fair_value_adjustments',
  'deferred_tax',
  'opening_balances',
  'oci_items',
  'equity_statement',
]

const NCI_MEASUREMENT_OPTIONS = [
  { value: 'fair_value', label: 'Fair Value' },
  { value: 'proportionate', label: 'Proportionate Share' },
]

const RULE_TYPES = [
  { value: 'fx_translation_rule', label: 'FX Translation Rule' },
  { value: 'intercompany_rule', label: 'Intercompany Rule' },
  { value: 'nci_calculation_rule', label: 'NCI Calculation Rule' },
  { value: 'elimination_rule', label: 'Elimination Rule' },
  { value: 'allocation_rule', label: 'Allocation Rule' },
  { value: 'rounding_rule', label: 'Rounding Rule' },
  { value: 'validation_rule', label: 'Validation Rule' },
]

const ConsolidationSettings = ({
  processId,
  scenario,
  entities = [],
  rules = [],
  fxRates = [],
  onSaveRule,
  onDeleteRule,
  onSaveFXRate,
  onDeleteFXRate,
  onAddEntity,
  isSaving,
}) => {
  const [activeTab, setActiveTab] = useState('rules')
  const [editingRule, setEditingRule] = useState(null)
  const [editingFXRate, setEditingFXRate] = useState(null)
  const [editingEntity, setEditingEntity] = useState(null)
  const [showNewRule, setShowNewRule] = useState(false)
  const [showNewFXRate, setShowNewFXRate] = useState(false)
  const [showNewEntity, setShowNewEntity] = useState(false)

  const [newRule, setNewRule] = useState({
    rule_type: 'fx_translation_rule',
    rule_name: '',
    description: '',
    rule_logic: {},
    priority: 0,
    enabled: true,
  })

  const [newFXRate, setNewFXRate] = useState({
    from_currency: '',
    to_currency: '',
    rate_type: 'closing',
    rate_date: new Date().toISOString().split('T')[0],
    rate_value: 1.0,
    average_rate: 1.0,
  })

  const [newEntity, setNewEntity] = useState({
    entity_code: '',
    entity_name: '',
    parent_entity_code: '',
    ownership_percentage: 100,
    measurement_method: 'proportionate',
    nci_measurement: 'fair_value',
    functional_currency: 'USD',
    reporting_currency: 'USD',
  })

  const handleSaveRule = () => {
    if (!newRule.rule_name.trim()) {
      alert('Rule name is required')
      return
    }
    onSaveRule(newRule)
    setNewRule({
      rule_type: 'fx_translation_rule',
      rule_name: '',
      description: '',
      rule_logic: {},
      priority: 0,
      enabled: true,
    })
    setShowNewRule(false)
  }

  const handleSaveFXRate = () => {
    if (!newFXRate.from_currency || !newFXRate.to_currency || !newFXRate.rate_value) {
      alert('All FX rate fields are required')
      return
    }
    onSaveFXRate(newFXRate)
    setNewFXRate({
      from_currency: '',
      to_currency: '',
      rate_type: 'closing',
      rate_date: new Date().toISOString().split('T')[0],
      rate_value: 1.0,
      average_rate: 1.0,
    })
    setShowNewFXRate(false)
  }

  const handleSaveEntity = () => {
    if (!newEntity.entity_code.trim() || !newEntity.entity_name.trim()) {
      alert('Entity code and name are required')
      return
    }
    onAddEntity(newEntity)
    setNewEntity({
      entity_code: '',
      entity_name: '',
      parent_entity_code: '',
      ownership_percentage: 100,
      measurement_method: 'proportionate',
      nci_measurement: 'fair_value',
      functional_currency: 'USD',
      reporting_currency: 'USD',
    })
    setShowNewEntity(false)
  }

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="flex items-center gap-1 px-4">
          {[
            { id: 'rules', label: 'Consolidation Rules', icon: Settings },
            { id: 'entities', label: 'Entities', icon: Building2 },
            { id: 'fxrates', label: 'FX Rates', icon: DollarSign },
            { id: 'validation', label: 'Validation', icon: AlertCircle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 font-medium transition-colors ${
                activeTab === id
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consolidation Rules</h3>
              <button
                onClick={() => setShowNewRule(!showNewRule)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Rule
              </button>
            </div>

            {showNewRule && (
              <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-4 font-semibold text-gray-900 dark:text-white">New Consolidation Rule</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Rule Type *</label>
                    <select
                      value={newRule.rule_type}
                      onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value })}
                      className="form-input"
                    >
                      {RULE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Rule Name *</label>
                    <input
                      type="text"
                      value={newRule.rule_name}
                      onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                      className="form-input"
                      placeholder="e.g., Standard FX Translation"
                    />
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <input
                      type="number"
                      value={newRule.priority}
                      onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newRule.enabled}
                      onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <label className="label !mb-0">Enabled</label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Description</label>
                    <textarea
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                      className="form-input resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button onClick={() => setShowNewRule(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleSaveRule} className="btn-primary inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Rule
                  </button>
                </div>
              </div>
            )}

            {rules.length > 0 ? (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">{rule.rule_name}</p>
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              rule.enabled
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            Priority: {rule.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{rule.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="rounded p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                        >
                          <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => onDeleteRule(rule.id)}
                          className="rounded p-1 hover:bg-rose-100 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-800">
                <Settings className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-600" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">No rules defined yet</p>
              </div>
            )}
          </div>
        )}

        {/* Entities Tab */}
        {activeTab === 'entities' && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consolidation Entities</h3>
              <button
                onClick={() => setShowNewEntity(!showNewEntity)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Entity
              </button>
            </div>

            {showNewEntity && (
              <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-4 font-semibold text-gray-900 dark:text-white">New Entity</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Entity Code *</label>
                    <input
                      type="text"
                      value={newEntity.entity_code}
                      onChange={(e) => setNewEntity({ ...newEntity, entity_code: e.target.value })}
                      className="form-input"
                      placeholder="e.g., PARENT"
                    />
                  </div>
                  <div>
                    <label className="label">Entity Name *</label>
                    <input
                      type="text"
                      value={newEntity.entity_name}
                      onChange={(e) => setNewEntity({ ...newEntity, entity_name: e.target.value })}
                      className="form-input"
                      placeholder="e.g., Parent Company"
                    />
                  </div>
                  <div>
                    <label className="label">Parent Entity</label>
                    <input
                      type="text"
                      value={newEntity.parent_entity_code}
                      onChange={(e) => setNewEntity({ ...newEntity, parent_entity_code: e.target.value })}
                      className="form-input"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="label">Ownership %</label>
                    <input
                      type="number"
                      value={newEntity.ownership_percentage}
                      onChange={(e) => setNewEntity({ ...newEntity, ownership_percentage: parseFloat(e.target.value) })}
                      className="form-input"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="label">NCI Measurement</label>
                    <select
                      value={newEntity.nci_measurement}
                      onChange={(e) => setNewEntity({ ...newEntity, nci_measurement: e.target.value })}
                      className="form-input"
                    >
                      {NCI_MEASUREMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Functional Currency</label>
                    <input
                      type="text"
                      value={newEntity.functional_currency}
                      onChange={(e) => setNewEntity({ ...newEntity, functional_currency: e.target.value })}
                      className="form-input"
                      placeholder="e.g., USD"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button onClick={() => setShowNewEntity(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleSaveEntity} className="btn-primary inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Entity
                  </button>
                </div>
              </div>
            )}

            {entities.length > 0 ? (
              <div className="space-y-3">
                {entities.map((entity) => (
                  <div
                    key={entity.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">{entity.entity_name}</p>
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-mono font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {entity.entity_code}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Ownership</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{entity.ownership_percentage}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">NCI Measurement</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{entity.nci_measurement}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Functional Currency</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{entity.functional_currency}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Reporting Currency</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{entity.reporting_currency}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-800">
                <Building2 className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-600" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">No entities defined yet</p>
              </div>
            )}
          </div>
        )}

        {/* FX Rates Tab */}
        {activeTab === 'fxrates' && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">FX Rates</h3>
              <button
                onClick={() => setShowNewFXRate(!showNewFXRate)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Rate
              </button>
            </div>

            {showNewFXRate && (
              <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-4 font-semibold text-gray-900 dark:text-white">New FX Rate</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">From Currency *</label>
                    <input
                      type="text"
                      value={newFXRate.from_currency}
                      onChange={(e) => setNewFXRate({ ...newFXRate, from_currency: e.target.value })}
                      className="form-input"
                      placeholder="e.g., EUR"
                    />
                  </div>
                  <div>
                    <label className="label">To Currency *</label>
                    <input
                      type="text"
                      value={newFXRate.to_currency}
                      onChange={(e) => setNewFXRate({ ...newFXRate, to_currency: e.target.value })}
                      className="form-input"
                      placeholder="e.g., USD"
                    />
                  </div>
                  <div>
                    <label className="label">Rate Type</label>
                    <select
                      value={newFXRate.rate_type}
                      onChange={(e) => setNewFXRate({ ...newFXRate, rate_type: e.target.value })}
                      className="form-input"
                    >
                      <option value="closing">Closing</option>
                      <option value="average">Average</option>
                      <option value="historical">Historical</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Rate Date *</label>
                    <input
                      type="date"
                      value={newFXRate.rate_date}
                      onChange={(e) => setNewFXRate({ ...newFXRate, rate_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="label">Rate Value *</label>
                    <input
                      type="number"
                      value={newFXRate.rate_value}
                      onChange={(e) => setNewFXRate({ ...newFXRate, rate_value: parseFloat(e.target.value) })}
                      className="form-input"
                      step="0.0001"
                    />
                  </div>
                  <div>
                    <label className="label">Average Rate</label>
                    <input
                      type="number"
                      value={newFXRate.average_rate}
                      onChange={(e) => setNewFXRate({ ...newFXRate, average_rate: parseFloat(e.target.value) })}
                      className="form-input"
                      step="0.0001"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button onClick={() => setShowNewFXRate(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleSaveFXRate} className="btn-primary inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Rate
                  </button>
                </div>
              </div>
            )}

            {fxRates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-2 text-left text-gray-900 dark:text-white">From</th>
                      <th className="px-4 py-2 text-left text-gray-900 dark:text-white">To</th>
                      <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Type</th>
                      <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Date</th>
                      <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Rate</th>
                      <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fxRates.map((rate) => (
                      <tr key={rate.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-2">{rate.from_currency}</td>
                        <td className="px-4 py-2">{rate.to_currency}</td>
                        <td className="px-4 py-2">{rate.rate_type}</td>
                        <td className="px-4 py-2">{rate.rate_date}</td>
                        <td className="px-4 py-2 font-semibold">{rate.rate_value.toFixed(6)}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => onDeleteFXRate(rate.id)}
                            className="text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-800">
                <DollarSign className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-600" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">No FX rates defined yet</p>
              </div>
            )}
          </div>
        )}

        {/* Validation Tab */}
        {activeTab === 'validation' && (
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Validation Rules</h3>
            <div className="space-y-4">
              {[
                { check: 'Balance Check', description: 'Assets = Liabilities + Equity', status: 'pending' },
                { check: 'Intercompany Net Zero', description: 'Intercompany accounts net to zero', status: 'pending' },
                { check: 'Entity Consolidation', description: 'All entities accounted for', status: 'pending' },
                { check: 'FX Rate Coverage', description: 'All currencies have rates', status: 'warning' },
                { check: 'Ownership Totals', description: 'Ownership percentages are valid', status: 'success' },
              ].map((item, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.check}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                    <span
                      className={`rounded px-3 py-1 text-xs font-semibold ${
                        item.status === 'success'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : item.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConsolidationSettings