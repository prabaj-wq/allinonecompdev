import { pythonAPI } from './pythonIntegration'

// Workflow Management Service
export const workflowService = {
  // Workflow CRUD operations
  createWorkflow: (workflowData) => pythonAPI.post('/api/workflows/', workflowData),
  getWorkflows: (filters = {}) => pythonAPI.get('/api/workflows/', { params: filters }),
  getWorkflow: (workflowId) => pythonAPI.get(`/api/workflows/${workflowId}`),
  updateWorkflow: (workflowId, workflowData) => pythonAPI.put(`/api/workflows/${workflowId}`, workflowData),
  deleteWorkflow: (workflowId) => pythonAPI.delete(`/api/workflows/${workflowId}`),

  // Workflow execution
  executeWorkflow: (workflowId, executionData) => pythonAPI.post(`/api/workflows/${workflowId}/execute`, executionData),
  getWorkflowExecutions: (workflowId) => pythonAPI.get(`/api/workflows/${workflowId}/executions`),

  // Workflow templates
  createTemplate: (templateData) => pythonAPI.post('/api/workflows/templates', templateData),
  getTemplates: (filters = {}) => pythonAPI.get('/api/workflows/templates', { params: filters }),

  // Workflow analytics
  getAnalytics: () => pythonAPI.get('/api/workflows/analytics/summary'),

  // Integration with other tabs
  integrateWithTab: (workflowId, tabName, action, data = {}) => 
    pythonAPI.post(`/api/workflows/${workflowId}/integrate/${tabName}`, { action, data }),

  // Mock data for development
  getMockWorkflows: () => {
    return Promise.resolve([
      {
        id: 1,
        name: 'Monthly Close Process',
        description: 'End-of-month financial close workflow',
        status: 'active',
        progress: 75,
        participants: 8,
        dueDate: '2025-01-31',
        steps: [
          { id: 1, name: 'Trial Balance Review', status: 'completed', assignee: 'John Doe', dueDate: '2025-01-25' },
          { id: 2, name: 'Adjusting Entries', status: 'in-progress', assignee: 'Jane Smith', dueDate: '2025-01-27' },
          { id: 3, name: 'Financial Statements', status: 'pending', assignee: 'Mike Johnson', dueDate: '2025-01-29' },
          { id: 4, name: 'Management Review', status: 'pending', assignee: 'Sarah Wilson', dueDate: '2025-01-30' },
          { id: 5, name: 'Final Approval', status: 'pending', assignee: 'David Brown', dueDate: '2025-01-31' }
        ]
      },
      {
        id: 2,
        name: 'Quarterly Audit Process',
        description: 'Quarterly internal audit workflow',
        status: 'active',
        progress: 0,
        participants: 12,
        dueDate: '2025-03-31',
        steps: [
          { id: 1, name: 'Risk Assessment', status: 'pending', assignee: 'Audit Team', dueDate: '2025-03-15' },
          { id: 2, name: 'Field Work', status: 'pending', assignee: 'Audit Team', dueDate: '2025-03-25' },
          { id: 3, name: 'Report Drafting', status: 'pending', assignee: 'Audit Team', dueDate: '2025-03-28' },
          { id: 4, name: 'Management Review', status: 'pending', assignee: 'Management', dueDate: '2025-03-30' },
          { id: 5, name: 'Board Approval', status: 'pending', assignee: 'Board', dueDate: '2025-03-31' }
        ]
      }
    ])
  },

  getMockTemplates: () => {
    return Promise.resolve([
      {
        id: 1,
        name: 'Monthly Close',
        category: 'Finance',
        icon: '📊',
        description: 'Standard monthly financial close process',
        workflow_structure: [
          { type: 'task', name: 'Upload Trial Balance', integration_tab: 'Trial Balance', assignee: 'Entity Owner' },
          { type: 'validation', name: 'Validate TB Data', integration_tab: 'Trial Balance', assignee: 'Finance Team' },
          { type: 'task', name: 'Enter IC Amounts', integration_tab: 'Process Module', assignee: 'Consolidation Team' },
          { type: 'task', name: 'Post Adjusting Entries', integration_tab: 'Journal Entries', assignee: 'Accounting Team' },
          { type: 'task', name: 'Run Consolidation', integration_tab: 'Consolidation', assignee: 'Consolidation Team' },
          { type: 'approval', name: 'Finance Lead Review', integration_tab: 'Consolidation', assignee: 'Finance Lead' },
          { type: 'task', name: 'Generate Financial Statements', integration_tab: 'Financial Statements', assignee: 'Reporting Team' },
          { type: 'approval', name: 'Final Approval', integration_tab: 'Financial Statements', assignee: 'CFO' }
        ]
      },
      {
        id: 2,
        name: 'Budget Planning',
        category: 'Planning',
        icon: '💰',
        description: 'Annual budget planning and approval process',
        workflow_structure: [
          { type: 'task', name: 'Draft Budget', integration_tab: 'Forecast & Budget', assignee: 'Budget Owner' },
          { type: 'approval', name: 'Manager Review', integration_tab: 'Forecast & Budget', assignee: 'Department Manager' },
          { type: 'task', name: 'Finance Consolidation', integration_tab: 'Consolidation', assignee: 'Finance Team' },
          { type: 'task', name: 'Variance Analysis', integration_tab: 'Variance Analysis', assignee: 'Analytics Team' },
          { type: 'approval', name: 'Final Approval', integration_tab: 'Financial Statements', assignee: 'Board' }
        ]
      }
    ])
  }
}

// Workflow block types and configurations
export const workflowBlockTypes = {
  task: {
    name: 'Task',
    icon: '📋',
    color: 'bg-blue-500',
    description: 'Assign work to users or teams',
    integration: ['Trial Balance', 'Journal Entries', 'Process Module']
  },
  approval: {
    name: 'Approval',
    icon: '✅',
    color: 'bg-green-500',
    description: 'Require approval before proceeding',
    integration: ['Consolidation', 'Financial Statements', 'Audit']
  },
  notification: {
    name: 'Notification',
    icon: '🔔',
    color: 'bg-yellow-500',
    description: 'Send automated notifications',
    integration: ['All Tabs']
  },
  decision: {
    name: 'Decision',
    icon: '🤔',
    color: 'bg-purple-500',
    description: 'Conditional workflow branching',
    integration: ['All Tabs']
  },
  integration: {
    name: 'Integration',
    icon: '🔗',
    color: 'bg-indigo-500',
    description: 'Connect with other system tabs',
    integration: ['Trial Balance', 'Consolidation', 'Forecast & Budget']
  },
  document: {
    name: 'Document',
    icon: '📄',
    color: 'bg-red-500',
    description: 'Upload or generate documents',
    integration: ['Financial Statements', 'Audit', 'Compliance']
  },
  calculation: {
    name: 'Calculation',
    icon: '🧮',
    color: 'bg-teal-500',
    description: 'Perform automated calculations',
    integration: ['Variance Analysis', 'Financial Ratios', 'Consolidation']
  },
  validation: {
    name: 'Validation',
    icon: '🔍',
    color: 'bg-orange-500',
    description: 'Validate data or results',
    integration: ['Trial Balance', 'Consolidation', 'Financial Statements']
  }
}

// Integration tab mappings
export const integrationTabs = {
  'Trial Balance': {
    name: 'Trial Balance',
    icon: '📊',
    actions: ['Upload', 'Validate', 'Review', 'Export']
  },
  'Journal Entries': {
    name: 'Journal Entries',
    icon: '📝',
    actions: ['Create', 'Post', 'Review', 'Approve']
  },
  'Consolidation': {
    name: 'Consolidation',
    icon: '🔗',
    actions: ['Run', 'Review', 'Approve', 'Export']
  },
  'Forecast & Budget': {
    name: 'Forecast & Budget',
    icon: '💰',
    actions: ['Create', 'Review', 'Approve', 'Activate']
  },
  'Variance Analysis': {
    name: 'Variance Analysis',
    icon: '📈',
    actions: ['Calculate', 'Review', 'Report']
  },
  'Audit': {
    name: 'Audit',
    icon: '🔍',
    actions: ['Plan', 'Execute', 'Review', 'Report']
  },
  'Financial Statements': {
    name: 'Financial Statements',
    icon: '📋',
    actions: ['Generate', 'Review', 'Approve', 'Publish']
  }
}
