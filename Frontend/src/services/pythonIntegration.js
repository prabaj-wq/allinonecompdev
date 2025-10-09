import axios from 'axios'

// Create axios instance for Python backend
const pythonAPI = axios.create({
  baseURL: 'http://localhost:8000', // Your Python FastAPI server
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
pythonAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Python Backend Integration Services
export const pythonServices = {
  // Authentication
  login: (credentials) => pythonAPI.post('/login', credentials),
  logout: (token) => pythonAPI.get('/logout'),
  verifyAuth: (token) => pythonAPI.get('/api/user-info'),
  
  // Company Management
  getCompanies: () => pythonAPI.get('/api/companies'),
  createCompany: (companyData) => pythonAPI.post('/api/create-company', companyData),
  getCompanyData: (companyName) => pythonAPI.get(`/api/company/${companyName}`),
  
  // Trial Balance & Data
  uploadTrialBalance: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return pythonAPI.post('/upload-tb', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getTrialBalanceData: () => pythonAPI.get('/api/trial-balance-data'),
  getTBFiles: () => pythonAPI.get('/api/tb-files'),
  
  // Entities and Accounts
  getEntities: () => pythonAPI.get('/api/entities'),
  getIFRSAccounts: () => pythonAPI.get('/api/ifrs-accounts'),
  createEntity: (entityData) => pythonAPI.post('/api/entities', entityData),
  updateEntity: (entityCode, entityData) => pythonAPI.put(`/api/entities/${entityCode}`, entityData),
  deleteEntity: (entityCode) => pythonAPI.delete(`/api/entities/${entityCode}`),
  
  // Consolidation
  getConsolidationData: () => pythonAPI.get('/api/consolidation-data'),
  processConsolidation: (data) => pythonAPI.post('/api/consolidation/process', data),
  getConsolidationAuditTrail: () => pythonAPI.get('/api/consolidation/audit-trail'),
  
  // Financial Statements
  getFinancialStatements: () => pythonAPI.get('/api/financial-statements'),
  generateFinancialStatements: (data) => pythonAPI.post('/api/financial-statements/generate', data),
  exportFinancialStatements: (period, year) => pythonAPI.get(`/api/financial-statements/export/${period}/${year}`),
  
  // Process Module
  getProcessEntries: () => pythonAPI.get('/api/process/entries'),
  createProcessEntry: (entry) => pythonAPI.post('/api/process/entries', entry),
  updateProcessEntry: (entryId, entry) => pythonAPI.put(`/api/process/entries/${entryId}`, entry),
  deleteProcessEntry: (entryId) => pythonAPI.delete(`/api/process/entries/${entryId}`),
  uploadProcessTrialBalance: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return pythonAPI.post('/api/process/upload-trial-balance', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  generateProcessFinancialStatements: (data) => pythonAPI.post('/api/process/generate-financial-statements', data),
  
  // Rollforward Accounts
  getRollforwardAccounts: () => pythonAPI.get('/api/rollforward-accounts'),
  createRollforwardAccount: (account) => pythonAPI.post('/api/rollforward-accounts', account),
  updateRollforwardAccount: (accountId, account) => pythonAPI.put(`/api/rollforward-accounts/${accountId}`, account),
  deleteRollforwardAccount: (accountId) => pythonAPI.delete(`/api/rollforward-accounts/${accountId}`),
  
  // Amounts Edit
  updateAmount: (data) => pythonAPI.post('/api/amounts/update', data),
  deleteAmount: (data) => pythonAPI.post('/api/amounts/delete', data),
  batchUpdateAmounts: (data) => pythonAPI.post('/api/amounts/batch-update', data),
  getAmountAdjustments: () => pythonAPI.get('/api/amounts/adjustments'),
  createAmountAdjustment: (adjustment) => pythonAPI.post('/api/amount-adjustments', adjustment),
  
  // Asset Register
  getAssets: () => pythonAPI.get('/api/assets'),
  createAsset: (asset) => pythonAPI.post('/api/assets', asset),
  updateAsset: (assetId, asset) => pythonAPI.put(`/api/assets/${assetId}`, asset),
  deleteAsset: (assetId) => pythonAPI.delete(`/api/assets/${assetId}`),
  
  // Bills
  getBills: () => pythonAPI.get('/api/bills/list'),
  getBillsConfig: () => pythonAPI.get('/api/bills/config'),
  createBill: (bill) => pythonAPI.post('/api/bills', bill),
  updateBill: (billId, bill) => pythonAPI.put(`/api/bills/${billId}`, bill),
  deleteBill: (billId) => pythonAPI.delete(`/api/bills/${billId}`),
  
  // Audit
  getAuditMateriality: () => pythonAPI.get('/api/audit-materiality/list'),
  getAuditMaterialityAccounts: () => pythonAPI.get('/api/audit-materiality/accounts'),
  getAuditMaterialityAccountBalance: (accountCode) => pythonAPI.get(`/api/audit-materiality/account-balance/${accountCode}`),
  updateAuditMateriality: (data) => pythonAPI.put('/api/audit-materiality', data),
  
  // FX Rates
  fetchFXRates: (data) => pythonAPI.post('/api/fx-rates/fetch', data),
  updateFXRates: (data) => pythonAPI.post('/api/fx-rates/update', data),
  deleteFXRates: (data) => pythonAPI.post('/api/fx-rates/delete', data),
  checkFXRates: (month, year) => pythonAPI.get(`/api/fx-rates/check/${month}/${year}`),
  
  // Settings & Configuration
  getSettings: () => pythonAPI.get('/settings'),
  getFileStorageInfo: () => pythonAPI.get('/api/file-storage-info'),
  
  // Backup & Restore
  getBackups: () => pythonAPI.get('/api/backups'),
  createBackup: () => pythonAPI.post('/api/backup'),
  restoreBackup: (backupId) => pythonAPI.post(`/api/restore/${backupId}`),
  
  // Data Export
  exportData: (dataType, filters) => pythonAPI.get(`/api/export/${dataType}`, { 
    params: filters,
    responseType: 'blob'
  }),
  
  // Save All Data
  saveAllData: () => pythonAPI.post('/api/save-all-data'),
}

// Error handling for Python backend
pythonAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Python Backend Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default pythonAPI
