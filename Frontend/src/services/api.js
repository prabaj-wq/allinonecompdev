import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ===== CORE AUTHENTICATION & COMPANY MANAGEMENT =====
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
  logout: () => api.post('/auth/logout'),
}

export const companyAPI = {
  getCompanies: () => api.get('/companies'),
  ensureSampleData: () => api.get('/ensure-sample-data'),
  forceRefreshSampleData: () => api.get('/force-refresh-sample-data'),
}

// ===== TRIAL BALANCE & PROCESS MODULE =====
export const trialBalanceAPI = {
  upload: (file, period, year) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('period', period)
    formData.append('year', year)
    return api.post('/process/upload-trial-balance', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getData: () => api.get('/trial-balance-data'),
  getFiles: () => api.get('/tb-files'),
  deleteFile: (filename) => api.delete(`/tb-files/${filename}`),
}

export const processAPI = {
  getEntries: (period, year) => api.get(`/process/entries?period=${period}&year=${year}`),
  createEntry: (entryData) => api.post('/process/entries', entryData),
  updateEntry: (entryId, entryData) => api.put(`/process/entries/${entryId}`, entryData),
  deleteEntry: (entryId) => api.delete(`/process/entries/${entryId}`),
  generateFinancialStatements: (period, year) => api.post('/process/generate-financial-statements', { period, year }),
  getBalances: (account, date) => api.get(`/process/balances?account=${account}&date=${date}`),
}

// ===== IFRS ACCOUNTS & ENTITIES =====
export const ifrsAccountsAPI = {
  getAll: () => api.get('/ifrs-accounts'),
  create: (accountData) => api.post('/ifrs-accounts', accountData),
  update: (accountCode, accountData) => api.put(`/ifrs-accounts/${accountCode}`, accountData),
  delete: (accountCode) => api.delete(`/ifrs-accounts/${accountCode}`),
  move: (accountCode, newHierarchyId) => api.post('/ifrs-accounts/move', { account_code: accountCode, new_hierarchy_id: newHierarchyId }),
  getForFST: () => api.get('/ifrs-accounts-for-fst'),
  getDropdown: () => api.get('/ifrs-accounts-dropdown'),
}

export const entitiesAPI = {
  getAll: () => api.get('/entities'),
  create: (entityData) => api.post('/entities', entityData),
  update: (entityCode, entityData) => api.put(`/entities/${entityCode}`, entityData),
  delete: (entityCode) => api.delete(`/entities/${entityCode}`),
  move: (entityCode, newHierarchyId) => api.post('/entities/move', { entity_code: entityCode, new_hierarchy_id: newHierarchyId }),
}

// ===== HIERARCHIES =====
export const hierarchiesAPI = {
  getAll: () => api.get('/hierarchies'),
  getByType: (type) => api.get(`/hierarchies/${type}`),
  create: (hierarchyData) => api.post('/hierarchies', hierarchyData),
  update: (hierarchyId, hierarchyData) => api.put(`/hierarchies/${hierarchyId}`, hierarchyData),
  delete: (hierarchyId) => api.delete(`/hierarchies/${hierarchyId}`),
}

export const entityHierarchiesAPI = {
  getAll: () => api.get('/entity-hierarchies'),
  create: (hierarchyData) => api.post('/entity-hierarchies', hierarchyData),
  update: (hierarchyId, hierarchyData) => api.put(`/entity-hierarchies/${hierarchyId}`, hierarchyData),
  delete: (hierarchyId) => api.delete(`/entity-hierarchies/${hierarchyId}`),
}

// ===== FINANCIAL STATEMENT TEMPLATES (FST) =====
export const fstAPI = {
  getTemplates: () => api.get('/fst-templates'),
  createTemplate: (templateData) => api.post('/fst-templates', templateData),
  updateTemplate: (templateId, templateData) => api.put(`/fst-templates/${templateId}`, templateData),
  deleteTemplate: (templateId) => api.delete(`/fst-templates/${templateId}`),
  moveTemplate: (templateName, newHierarchyId) => api.post('/fst-templates/move', { template_name: templateName, new_hierarchy_id: newHierarchyId }),
  getElements: (templateId) => api.get(`/fst-templates/${templateId}/elements`),
  addElement: (templateId, elementData) => api.post(`/fst-templates/${templateId}/elements`, elementData),
  updateElement: (elementId, elementData) => api.put(`/fst-templates/elements/${elementId}`, elementData),
  deleteElement: (elementId) => api.delete(`/fst-templates/elements/${elementId}`),
  testFormulas: (templateId) => api.post(`/fst-templates/${templateId}/test-formulas`),
  calculateFormula: (formula, period, year) => api.post('/fst-templates/calculate-formula', { formula, period, year }),
  generateStatement: (statementData) => api.post('/fst-templates/generate-statement', statementData),
}

export const fstHierarchiesAPI = {
  getAll: () => api.get('/fst-hierarchies'),
  create: (hierarchyData) => api.post('/fst-hierarchies', hierarchyData),
  update: (hierarchyId, hierarchyData) => api.put(`/fst-hierarchies/${hierarchyId}`, hierarchyData),
  delete: (hierarchyId) => api.delete(`/fst-hierarchies/${hierarchyId}`),
}

// ===== FINANCIAL STATEMENTS =====
export const financialStatementsAPI = {
  generate: (period, year) => api.post('/financial-statements/generate', { period, year }),
  generateFST: (statementRequest) => api.post('/fst-financial-statements/generate', statementRequest),
  export: (period, year, format) => api.get(`/financial-statements/export/${period}/${year}`, {
    params: { format },
    responseType: 'blob',
  }),
  exportFST: (exportRequest) => api.post('/fst-financial-statements/export', exportRequest),
  getAll: () => api.get('/financial-statements'),
  getEntityBreakdown: (filename) => api.get(`/financial-statements/${filename}/entity-breakdown`),
  getTemplates: () => api.get('/financial-statements/templates'),
}

// ===== FX RATES & CURRENCY CONVERSION =====
export const fxRatesAPI = {
  fetch: (fxRequest) => api.post('/fx-rates/fetch', fxRequest),
  update: (updateRequest) => api.post('/fx-rates/update', updateRequest),
  delete: (deleteRequest) => api.post('/fx-rates/delete', deleteRequest),
  check: (month, year) => api.get(`/fx-rates/check/${month}/${year}`),
}

// ===== CONSOLIDATION MODULE =====
export const consolidationAPI = {
  getData: () => api.get('/consolidation/data'),
  addICItem: (icItemData) => api.post('/consolidation/ic-item', icItemData),
  updateICItem: (updateRequest) => api.put('/consolidation/ic-item/update', updateRequest),
  deleteICItem: (itemId) => api.delete(`/consolidation/ic-item/${itemId}`),
  eliminateICItem: (eliminateRequest) => api.post('/consolidation/ic-item/eliminate', eliminateRequest),
  exportICItems: () => api.get('/consolidation/ic-items/export'),
  
  addJournal: (journalData) => api.post('/consolidation/journal', journalData),
  updateJournal: (updateRequest) => api.put('/consolidation/journal/update', updateRequest),
  deleteJournal: (journalId) => api.delete(`/consolidation/journal/${journalId}`),
  exportJournals: () => api.get('/consolidation/journals/export'),
  
  addOwnership: (ownershipData) => api.post('/consolidation/ownership', ownershipData),
  updateOwnership: (updateRequest) => api.put('/consolidation/ownership/update', updateRequest),
  changeOwnershipStatus: (statusRequest) => api.post('/consolidation/ownership/status', statusRequest),
  deleteOwnership: (ownershipId) => api.delete(`/consolidation/ownership/${ownershipId}`),
  
  getOwnerships: () => api.get('/consolidation/ownerships'),
  
  // Additional Rules API
  getRules: () => api.get('/consolidation/rules'),
  addRule: (ruleData) => api.post('/consolidation/rules', ruleData),
  updateRule: (ruleId, ruleData) => api.put(`/consolidation/rules/${ruleId}`, ruleData),
  deleteRule: (ruleId) => api.delete(`/consolidation/rules/${ruleId}`),
  toggleRuleStatus: (ruleId, status) => api.post(`/consolidation/rules/${ruleId}/status`, { status }),
  
  updateRollForward: (rollForwardData) => api.post('/consolidation/roll-forward', rollForwardData),
  getAuditTrail: () => api.get('/consolidation/audit-trail'),
}

// ===== JOURNAL ENTRY MODULE =====
export const journalAPI = {
  // Categories
  listCategories: (params) => api.get('/journal-entry/categories', { params }),
  createCategory: (payload) => api.post('/journal-entry/categories', payload),
  updateCategory: (categoryId, payload) => api.put(`/journal-entry/categories/${categoryId}`, payload),
  toggleCategory: (categoryId, payload) => api.post(`/journal-entry/categories/${categoryId}/toggle`, payload),

  // Approval workflows
  listWorkflows: (params) => api.get('/journal-entry/approval-workflows', { params }),
  createWorkflow: (payload) => api.post('/journal-entry/approval-workflows', payload),
  updateWorkflow: (workflowId, payload) => api.put(`/journal-entry/approval-workflows/${workflowId}`, payload),
  deleteWorkflow: (workflowId) => api.delete(`/journal-entry/approval-workflows/${workflowId}`),

  // Onboarding checklist
  listOnboarding: (params) => api.get('/journal-entry/onboarding', { params }),
  createOnboarding: (payload) => api.post('/journal-entry/onboarding', payload),
  updateOnboarding: (checklistId, payload) => api.put(`/journal-entry/onboarding/${checklistId}`, payload),
  deleteOnboarding: (checklistId) => api.delete(`/journal-entry/onboarding/${checklistId}`),

  // Period locks
  listLocks: (params) => api.get('/journal-entry/period-locks', { params }),
  upsertLock: (payload) => api.post('/journal-entry/period-locks', payload),
  deleteLock: (lockId, params) => api.delete(`/journal-entry/period-locks/${lockId}`, { params }),

  // Batches
  listBatches: (params) => api.get('/journal-entry/batches', { params }),
  getBatch: (batchId, params) => api.get(`/journal-entry/batches/${batchId}`, { params }),
  createBatch: (payload, params) => api.post('/journal-entry/batches', payload, { params }),
  updateBatch: (batchId, payload, params) => api.put(`/journal-entry/batches/${batchId}`, payload, { params }),
  deleteBatch: (batchId, params) => api.delete(`/journal-entry/batches/${batchId}`, { params }),

  // Batch actions
  validateBatch: (batchId, payload, params) => api.post(`/journal-entry/batches/${batchId}/validate`, payload, { params }),
  submitBatch: (batchId, payload, params) => api.post(`/journal-entry/batches/${batchId}/submit`, payload, { params }),
  approveBatch: (batchId, payload, params) => api.post(`/journal-entry/batches/${batchId}/approve`, payload, { params }),
  postBatch: (batchId, payload, params) => api.post(`/journal-entry/batches/${batchId}/post`, payload, { params }),
  rejectBatch: (batchId, payload, params) => api.post(`/journal-entry/batches/${batchId}/reject`, payload, { params }),
  revertBatch: (batchId, payload, params) => api.post(`/journal-entry/batches/${batchId}/revert`, payload, { params }),

  // Lines
  listLines: (batchId, params) => api.get(`/journal-entry/batches/${batchId}/lines`, { params }),
  createLine: (batchId, payload, params) => api.post(`/journal-entry/batches/${batchId}/lines`, payload, { params }),
  updateLine: (batchId, lineId, payload, params) => api.put(`/journal-entry/batches/${batchId}/lines/${lineId}`, payload, { params }),
  deleteLine: (batchId, lineId, params) => api.delete(`/journal-entry/batches/${batchId}/lines/${lineId}`, { params }),

  // Attachments
  listAttachments: (params) => api.get('/journal-entry/attachments', { params }),
  uploadAttachment: (payload, params) => {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })
    return api.post('/journal-entry/attachments', formData, {
      params,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteAttachment: (attachmentId, params) => api.delete(`/journal-entry/attachments/${attachmentId}`, { params }),

  // Templates & recurring
  listTemplates: (params) => api.get('/journal-entry/templates', { params }),
  createTemplate: (payload, params) => api.post('/journal-entry/templates', payload, { params }),
  updateTemplate: (templateId, payload, params) => api.put(`/journal-entry/templates/${templateId}`, payload, { params }),
  toggleTemplate: (templateId, payload, params) => api.post(`/journal-entry/templates/${templateId}/toggle`, payload, { params }),
  deleteTemplate: (templateId, params) => api.delete(`/journal-entry/templates/${templateId}`, { params }),
  applyTemplate: (templateId, payload, params) => api.post(`/journal-entry/templates/${templateId}/apply`, payload, { params }),
  generateRecurring: (payload, params) => api.post('/journal-entry/recurring/generate', payload, { params }),

  // Upload batches
  listUploadBatches: (params) => api.get('/journal-entry/upload-batches', { params }),
  getUploadBatch: (uploadBatchId, params) => api.get(`/journal-entry/upload-batches/${uploadBatchId}`, { params }),
  createUploadBatch: (payload, params) => api.post('/journal-entry/upload-batches', payload, { params }),
  updateUploadBatch: (uploadBatchId, payload, params) => {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })
    return api.put(`/journal-entry/upload-batches/${uploadBatchId}`, formData, {
      params,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Reporting & history
  getSummary: (params) => api.get('/journal-entry/reports/summary', { params }),
  getCategoryTrend: (params) => api.get('/journal-entry/reports/category-trend', { params }),
  getPeriodVariance: (params) => api.get('/journal-entry/reports/period-variance', { params }),
  listAuditEvents: (params) => api.get('/journal-entry/audit', { params }),
  listStatusHistory: (params) => api.get('/journal-entry/status-history', { params }),
  getBatchAuditTrail: (batchId, params) => api.get(`/journal-entry/batches/${batchId}/audit-trail`, { params }),
  getBatchStatusTimeline: (batchId, params) => api.get(`/journal-entry/batches/${batchId}/status-history`, { params }),
}

// ===== AUDIT & COMPLIANCE =====
export const auditAPI = {
  getAuditTrail: (filters) => api.get('/audit/trail', { params: filters }),
  getMateriality: () => api.get('/audit/materiality'),
  updateMateriality: (data) => api.put('/audit/materiality', data),
  exportAuditReport: (filters) => api.get('/audit/export', {
    params: filters,
    responseType: 'blob',
  }),
}

export const auditMaterialityAPI = {
  getAccounts: () => api.get('/audit-materiality/accounts'),
  getAccountBalance: (accountCode, year) => api.get(`/audit-materiality/account-balance/${accountCode}?year=${year}`),
  calculate: (materialityData) => api.post('/audit-materiality/calculate', materialityData),
  getList: () => api.get('/audit-materiality/list'),
}

// ===== FINANCIAL INDICATORS =====
export const financialIndicatorsAPI = {
  saveConfig: (configData) => api.post('/financial-indicators/config', configData),
  getConfig: () => api.get('/financial-indicators/config'),
  calculate: (period, year) => api.get(`/financial-indicators/calculate/${period}/${year}`),
}

// ===== ASSETS & BILLS =====
export const assetAPI = {
  getAssets: (filters) => api.get('/assets', { params: filters }),
  createAsset: (asset) => api.post('/assets', asset),
  updateAsset: (id, asset) => api.put(`/assets/${id}`, asset),
  deleteAsset: (id) => api.delete(`/assets/${id}`),
  exportAssets: (filters) => api.get('/assets/export', {
    params: filters,
    responseType: 'blob',
  }),
}

export const billsAPI = {
  getConfig: () => api.get('/bills/config'),
  saveConfig: (configData) => api.post('/bills/config', configData),
  getBills: (filters) => api.get('/bills/list', { params: filters }),
  createBill: (bill) => api.post('/bills/create', bill),
  uploadPDF: (billId, file) => {
    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('bill_id', billId)
    return api.post(`/bills/upload-pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// ===== BACKUP & RESTORE =====
export const backupAPI = {
  create: () => api.post('/backup/create'),
  list: () => api.get('/backup/list'),
  restore: (backupId) => api.post(`/backup/restore/${backupId}`),
  delete: (backupId) => api.delete(`/backup/delete/${backupId}`),
}

// ===== IFRS STANDARDS INTEGRATION =====
export const ifrsStandardsAPI = {
  getStandards: () => api.get('/ifrs-standards'),
  getStandardJournals: (standardCode) => api.get(`/ifrs-standard/${standardCode}/journals`),
  createStandardJournal: (standardCode, journalData) => api.post(`/ifrs-standard/${standardCode}/journals`, journalData),
}

export const ifrsTemplatesAPI = {
  uploadExcel: (standardCode, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/ifrs/${standardCode}/upload-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  openExcel: (standardCode, companyName, templateName) => api.post(`/ifrs/${standardCode}/open-excel`, { company_name: companyName, template_name: templateName }),
  getExcelFiles: (standardCode) => api.get(`/ifrs/${standardCode}/excel-files`),
  getCellValue: (standardCode, filename, sheetName, cellReference) => api.get(`/ifrs/${standardCode}/excel-cell-value`, {
    params: { filename, sheet_name: sheetName, cell_reference: cellReference }
  }),
  createJournalEntry: (standardCode, journalData) => api.post(`/ifrs/${standardCode}/journal-entry`, journalData),
  getJournalEntries: (standardCode) => api.get(`/ifrs/${standardCode}/journal-entries`),
  downloadExcel: (standardCode, filename) => api.get(`/ifrs/${standardCode}/download-excel/${filename}`, { responseType: 'blob' }),
}

// ===== UTILITY FUNCTIONS =====
export const uploadAPI = {
  uploadFile: (file, type) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

export const amountsAPI = {
  update: (updateData) => api.post('/amounts/update', updateData),
  delete: (deleteData) => api.delete('/amounts/delete', { data: deleteData }),
  batchUpdate: (updates) => api.post('/amounts/batch-update', updates),
  getAdjustments: () => api.get('/amounts/adjustments'),
  getFullEdit: () => api.get('/amounts/full-edit'),
}

export default api
