import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import {
  BookOpen, FileText, GitBranch, CheckCircle, Link as LinkIcon,
  Globe, DollarSign, Percent, Users, TrendingUp, AlertCircle,
  BarChart3, Database, AlertTriangle, Activity, Calculator
} from 'lucide-react';

const NODE_ICONS = {
  journal_entries: BookOpen,
  forms: FileText,
  entity_structure: GitBranch,
  tb_verification: CheckCircle,
  intercompany_eliminations: LinkIcon,
  fx_translation: Globe,
  fair_value_adjustments: DollarSign,
  deferred_taxes: Percent,
  nci_allocation: Users,
  retained_earnings_rollforward: TrendingUp,
  goodwill_impairment: AlertCircle,
  profit_calculation: BarChart3,
  opening_balance_adjustments: Database,
  prior_period_errors: AlertTriangle,
  oci_items: Activity,
  epa_calculation: Calculator
};

const NODE_TEMPLATES = {
  journal_entries: {
    title: 'Journal Entries',
    description: 'Create and manage journal entries with account mappings'
  },
  forms: {
    title: 'Forms & Data Collection',
    description: 'Collect custom data from users via structured forms'
  },
  entity_structure: {
    title: 'Entity Structure',
    description: 'Define and manage entity hierarchies and ownership'
  },
  tb_verification: {
    title: 'Trial Balance Verification',
    description: 'Verify and reconcile trial balances with tolerance checks'
  },
  intercompany_eliminations: {
    title: 'Intercompany Eliminations',
    description: 'Eliminate IC transactions, profit in inventory'
  },
  fx_translation: {
    title: 'FX Translation',
    description: 'Handle currency conversion with CTA recording'
  },
  fair_value_adjustments: {
    title: 'Fair Value Adjustments',
    description: 'Record and depreciate acquisition fair value differences'
  },
  deferred_taxes: {
    title: 'Deferred Taxes',
    description: 'Calculate deferred tax impacts on adjustments'
  },
  nci_allocation: {
    title: 'NCI Allocation',
    description: 'Allocate profits and equity to minority shareholders'
  },
  retained_earnings_rollforward: {
    title: 'Retained Earnings Rollforward',
    description: 'Calculate period-end retained earnings'
  },
  goodwill_impairment: {
    title: 'Goodwill & Impairment',
    description: 'Test and record goodwill impairment'
  },
  profit_calculation: {
    title: 'Profit / Loss Calculation',
    description: 'Calculate profit for entity, group, segments'
  },
  opening_balance_adjustments: {
    title: 'Opening Balance Adjustments',
    description: 'Manage opening balances for consolidation'
  },
  prior_period_errors: {
    title: 'Prior Period Errors',
    description: 'Handle prior period errors and restatements'
  },
  oci_items: {
    title: 'OCI Items',
    description: 'Capture Other Comprehensive Income items'
  },
  epa_calculation: {
    title: 'EPS Calculation',
    description: 'Calculate basic and diluted EPS'
  }
};

export default function NodeTemplatePanel({ onAddNode, isOpen, onSelectTemplate, onClose }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [nodeConfig, setNodeConfig] = useState({});

  const handleSelectTemplate = (templateKey) => {
    setSelectedTemplate(templateKey);
    setNodeConfig({
      title: NODE_TEMPLATES[templateKey].title,
      description: NODE_TEMPLATES[templateKey].description,
      configuration: {},
      custom_fields: []
    });
  };

  const handleConfirmAdd = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, nodeConfig);
      setSelectedTemplate(null);
      setNodeConfig({});
    }
  };

  if (isOpen) {
    return (
      <div className="node-popup-overlay">
        <div className="node-popup">
          <div className="popup-header">
            <h2>Select Node Type</h2>
            <button className="btn-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="popup-body">
            <div className="templates-grid">
              {Object.entries(NODE_TEMPLATES).map(([key, template]) => {
                const Icon = NODE_ICONS[key];
                return (
                  <div
                    key={key}
                    className={`template-card ${selectedTemplate === key ? 'selected' : ''}`}
                    onClick={() => handleSelectTemplate(key)}
                  >
                    <Icon size={32} className="template-icon" />
                    <h4>{template.title}</h4>
                    <p>{template.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedTemplate && (
            <div className="popup-footer">
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleConfirmAdd}>
                <Plus size={18} /> Add Node
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="node-template-panel">
      <div className="panel-header">
        <h3>Add Nodes</h3>
      </div>

      <div className="templates-list">
        {Object.entries(NODE_TEMPLATES).map(([key, template]) => {
          const Icon = NODE_ICONS[key];
          return (
            <div
              key={key}
              className="template-item"
              onClick={() => onAddNode()}
              title={template.description}
            >
              <Icon size={24} />
              <div className="template-info">
                <p className="template-title">{template.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel-footer">
        <p className="panel-hint">Click a node type to add to canvas</p>
      </div>
    </div>
  );
}