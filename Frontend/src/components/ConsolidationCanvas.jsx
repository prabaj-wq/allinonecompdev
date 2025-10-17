/**
 * ConsolidationCanvas Component
 * Workflow builder for IFRS consolidation processes
 */

import React, { useState, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Edit2,
  Play,
  Save,
  Settings,
  GitBranch,
  Database,
  Calculator,
  TrendingUp,
  DollarSign,
  AlertCircle,
  ChevronDown,
  Zap,
  Link2,
} from 'lucide-react'

// Consolidation node types with icons and descriptions
const CONSOLIDATION_NODE_TYPES = [
  {
    key: 'profit_loss',
    name: 'Profit/Loss Calculation',
    icon: TrendingUp,
    description: 'Calculate entity profit/loss, gross margin, operating profit',
    category: 'Calculations',
    inputs: ['entity', 'accounts', 'period'],
    outputs: ['profit', 'gross_margin', 'operating_profit'],
  },
  {
    key: 'nci_handling',
    name: 'NCI Handling',
    icon: DollarSign,
    description: 'Allocate Non-Controlling Interest share of profit/equity',
    category: 'Allocations',
    inputs: ['entity', 'profit', 'ownership'],
    outputs: ['nci_profit', 'nci_equity'],
  },
  {
    key: 'retained_earnings_rollforward',
    name: 'Retained Earnings Rollforward',
    icon: Calculator,
    description: 'Roll forward opening RE + profit - dividends + adjustments',
    category: 'Equity',
    inputs: ['opening_re', 'profit', 'dividends', 'adjustments'],
    outputs: ['closing_re'],
  },
  {
    key: 'fx_translation',
    name: 'FX Translation',
    icon: GitBranch,
    description: 'Translate foreign subsidiary balances, record CTA',
    category: 'FX',
    inputs: ['entity', 'balances', 'fx_rates'],
    outputs: ['translated_balances', 'cta_adjustment'],
  },
  {
    key: 'intercompany_elimination',
    name: 'Intercompany Eliminations',
    icon: Link2,
    description: 'Eliminate intercompany transactions and balances',
    category: 'Eliminations',
    inputs: ['intercompany_data', 'eliminations_rules'],
    outputs: ['eliminated_entries'],
  },
  {
    key: 'fair_value_adjustments',
    name: 'Fair Value Adjustments',
    icon: Database,
    description: 'Allocation, depreciation, goodwill impairment',
    category: 'Fair Value',
    inputs: ['acquisition_data', 'fair_values'],
    outputs: ['fair_value_entries', 'goodwill'],
  },
  {
    key: 'deferred_tax',
    name: 'Deferred Tax',
    icon: AlertCircle,
    description: 'Calculate deferred tax on adjustments',
    category: 'Tax',
    inputs: ['adjustments', 'tax_rate'],
    outputs: ['deferred_tax_entries'],
  },
  {
    key: 'opening_balances',
    name: 'Opening Balance Adjustments',
    icon: Database,
    description: 'Set opening balances for equity, RE, fair values',
    category: 'Setup',
    inputs: ['prior_period_data'],
    outputs: ['opening_balances_adjusted'],
  },
  {
    key: 'oci_items',
    name: 'OCI Items',
    icon: TrendingUp,
    description: 'Capture revaluation, FX adjustments, actuarial items',
    category: 'Equity',
    inputs: ['oci_transactions'],
    outputs: ['oci_closing_balance'],
  },
  {
    key: 'equity_statement',
    name: 'Statement of Changes in Equity',
    icon: Calculator,
    description: 'Automatically build SCE with NCI, OCI, dividends',
    category: 'Reporting',
    inputs: ['opening_equity', 'changes'],
    outputs: ['equity_statement'],
  },
]

const ConsolidationCanvas = ({
  processId,
  nodes = [],
  onAddNode,
  onDeleteNode,
  onUpdateNode,
  onConnectNodes,
  onRunProcess,
  isLoading,
}) => {
  const [selectedNode, setSelectedNode] = useState(null)
  const [showNodeLibrary, setShowNodeLibrary] = useState(false)
  const [hoveredNodeType, setHoveredNodeType] = useState(null)
  const [draggedNode, setDraggedNode] = useState(null)
  const [connections, setConnections] = useState([])
  const [editingNode, setEditingNode] = useState(null)

  const handleDragStart = (e, nodeType) => {
    setDraggedNode(nodeType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (!draggedNode) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    onAddNode({
      node_type: draggedNode.key,
      title: draggedNode.name,
      description: draggedNode.description,
      position_x: Math.round(x),
      position_y: Math.round(y),
      config: {
        inputs: draggedNode.inputs,
        outputs: draggedNode.outputs,
      },
    })

    setDraggedNode(null)
  }

  const handleNodeClick = (node) => {
    setSelectedNode(node.id === selectedNode?.id ? null : node)
  }

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Consolidation Workflow</h3>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {nodes.length} nodes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNodeLibrary(!showNodeLibrary)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Node
            </button>
            <button
              onClick={onRunProcess}
              disabled={isLoading || nodes.length === 0}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isLoading ? 'Running...' : 'Run Process'}
            </button>
          </div>
        </div>

        {/* Node Library Dropdown */}
        {showNodeLibrary && (
          <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            {CONSOLIDATION_NODE_TYPES.map((nodeType) => (
              <div
                key={nodeType.key}
                draggable
                onDragStart={(e) => handleDragStart(e, nodeType)}
                onMouseEnter={() => setHoveredNodeType(nodeType.key)}
                onMouseLeave={() => setHoveredNodeType(null)}
                className="cursor-move border-b border-gray-100 p-3 last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <div className="flex items-start gap-3">
                  <nodeType.icon className="mt-1 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{nodeType.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{nodeType.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {nodeType.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative flex-1 overflow-auto bg-gray-50 dark:bg-gray-900"
      >
        {nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Zap className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Drag consolidation nodes from the library to build your workflow
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nodes.map((node) => {
                const nodeType = CONSOLIDATION_NODE_TYPES.find((t) => t.key === node.node_type)
                const isSelected = selectedNode?.id === node.id

                return (
                  <div
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    className={`rounded-lg border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg dark:border-indigo-400 dark:bg-indigo-900/20'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    } cursor-pointer`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {nodeType && (
                          <nodeType.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{node.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{node.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingNode(node)
                          }}
                          className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteNode(node.id)
                          }}
                          className="rounded p-1 hover:bg-rose-100 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </button>
                      </div>
                    </div>

                    {node.config && (
                      <div className="mt-3 space-y-2 text-xs">
                        {node.config.inputs && node.config.inputs.length > 0 && (
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">Inputs:</p>
                            <div className="flex flex-wrap gap-1">
                              {node.config.inputs.map((input) => (
                                <span
                                  key={input}
                                  className="rounded bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                >
                                  {input}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {node.config.outputs && node.config.outputs.length > 0 && (
                          <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">Outputs:</p>
                            <div className="flex flex-wrap gap-1">
                              {node.config.outputs.map((output) => (
                                <span
                                  key={output}
                                  className="rounded bg-green-100 px-2 py-1 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                >
                                  {output}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {node.enabled === false && (
                      <div className="mt-2 rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Disabled
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Node Details Panel */}
      {editingNode && (
        <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">Edit Node</h4>
            <button
              onClick={() => setEditingNode(null)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                value={editingNode.title}
                onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="label">Enabled</label>
              <input
                type="checkbox"
                checked={editingNode.enabled}
                onChange={(e) => setEditingNode({ ...editingNode, enabled: e.target.checked })}
                className="h-4 w-4"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                value={editingNode.description}
                onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value })}
                className="form-input resize-none"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-2 md:col-span-2">
              <button
                onClick={() => setEditingNode(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateNode(editingNode)
                  setEditingNode(null)
                }}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsolidationCanvas