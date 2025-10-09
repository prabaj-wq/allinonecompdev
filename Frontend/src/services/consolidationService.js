// Consolidation Service - Comprehensive IFRS Consolidation Logic
// This service handles all consolidation-related API calls and data processing
// Enhanced with professional consolidation algorithms and IFRS compliance

import { 
  trialBalanceAPI, 
  processAPI, 
  ifrsAccountsAPI, 
  entitiesAPI, 
  hierarchiesAPI, 
  fstAPI, 
  financialStatementsAPI, 
  fxRatesAPI, 
  consolidationAPI, 
  auditMaterialityAPI, 
  financialIndicatorsAPI,
  assetAPI,
  billsAPI,
  backupAPI,
  ifrsStandardsAPI,
  ifrsTemplatesAPI
} from './api'

const API_BASE = '/api'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  const companyName = localStorage.getItem('selectedCompany') || 'Sample Corp Ltd'
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    'X-Company-Name': companyName
  }
}

// Consolidation calculation utilities
const ConsolidationUtils = {
  // Calculate ownership percentage and NCI
  calculateOwnershipAndNCI(ownershipPercentage) {
    const ownership = parseFloat(ownershipPercentage) || 0
    const nci = 100 - ownership
    return { ownership, nci }
  },

  // Calculate goodwill using different methods
  calculateGoodwill(purchaseConsideration, fairValueNetAssets, ownershipPercentage, method = 'Partial') {
    const ownership = parseFloat(ownershipPercentage) / 100
    const purchasePrice = parseFloat(purchaseConsideration) || 0
    const netAssets = parseFloat(fairValueNetAssets) || 0
    
    if (method === 'Full') {
      // Full goodwill method - calculate goodwill on 100% of subsidiary
      const fullGoodwill = purchasePrice - (netAssets * ownership)
      return {
        fullGoodwill: fullGoodwill,
        parentGoodwill: fullGoodwill * ownership,
        nciGoodwill: fullGoodwill * (1 - ownership),
        totalGoodwill: fullGoodwill
      }
    } else {
      // Partial goodwill method - goodwill only for parent's share
      const partialGoodwill = purchasePrice - (netAssets * ownership)
      return {
        fullGoodwill: partialGoodwill / ownership,
        parentGoodwill: partialGoodwill,
        nciGoodwill: 0,
        totalGoodwill: partialGoodwill
      }
    }
  },

  // Calculate NCI value
  calculateNCIValue(netAssets, goodwill, nciPercentage) {
    const nci = parseFloat(nciPercentage) / 100
    const netAssetsValue = parseFloat(netAssets) || 0
    const goodwillValue = parseFloat(goodwill) || 0
    
    return (netAssetsValue + goodwillValue) * nci
  },

  // Eliminate intercompany transactions
  eliminateIntercompanyTransactions(transactions) {
    const eliminations = []
    const matched = new Set()
    
    transactions.forEach((transaction, index) => {
      if (matched.has(index)) return
      
      // Find matching counterparty transaction
      const matchingIndex = transactions.findIndex((t, i) => 
        i !== index && 
        !matched.has(i) &&
        t.entity === transaction.counterparty &&
        t.counterparty === transaction.entity &&
        t.transactionType === transaction.transactionType &&
        Math.abs(t.entityAmount - transaction.counterpartyAmount) < 0.01
      )
      
      if (matchingIndex !== -1) {
        const matchingTransaction = transactions[matchingIndex]
        matched.add(index)
        matched.add(matchingIndex)
        
        eliminations.push({
          type: 'IC_ELIMINATION',
          description: `Eliminate ${transaction.transactionType} between ${transaction.entity} and ${transaction.counterparty}`,
          debitAccount: transaction.entityAccount,
          creditAccount: transaction.counterpartyAccount,
          amount: Math.min(transaction.entityAmount, matchingTransaction.entityAmount),
          entity: transaction.entity,
          counterparty: transaction.counterparty,
          originalTransactions: [transaction, matchingTransaction]
        })
      }
    })
    
    return eliminations
  },

  // Calculate consolidated balances
  calculateConsolidatedBalances(entityBalances, ownershipStructures, eliminations = []) {
    const consolidated = {}
    
    // Group balances by account
    const accountBalances = {}
    entityBalances.forEach(balance => {
      const accountCode = balance.accountCode
      if (!accountBalances[accountCode]) {
        accountBalances[accountCode] = []
      }
      accountBalances[accountCode].push(balance)
    })
    
    // Calculate consolidated amount for each account
    Object.keys(accountBalances).forEach(accountCode => {
      const balances = accountBalances[accountCode]
      let consolidatedAmount = 0
      let parentAmount = 0
      let subsidiaryAmounts = {}
      
      balances.forEach(balance => {
        const entity = balance.entity
        const amount = parseFloat(balance.amount) || 0
        
        // Find ownership structure for this entity
        const ownership = ownershipStructures.find(os => 
          os.subsidiaryEntity === entity || os.parentEntity === entity
        )
        
        if (ownership) {
          if (ownership.subsidiaryEntity === entity) {
            // This is a subsidiary - apply ownership percentage
            const ownershipPct = parseFloat(ownership.ownershipPercentage) / 100
            consolidatedAmount += amount * ownershipPct
            subsidiaryAmounts[entity] = amount
          } else {
            // This is the parent - include 100%
            consolidatedAmount += amount
            parentAmount = amount
          }
        } else {
          // No ownership structure - assume 100% ownership
          consolidatedAmount += amount
          if (entity === 'Parent Corp' || entity.includes('Parent')) {
            parentAmount = amount
          } else {
            subsidiaryAmounts[entity] = amount
          }
        }
      })
      
      // Apply eliminations
      const accountEliminations = eliminations.filter(e => 
        e.debitAccount === accountCode || e.creditAccount === accountCode
      )
      
      accountEliminations.forEach(elimination => {
        if (elimination.debitAccount === accountCode) {
          consolidatedAmount -= elimination.amount
        } else if (elimination.creditAccount === accountCode) {
          consolidatedAmount += elimination.amount
        }
      })
      
      consolidated[accountCode] = {
        accountCode,
        accountDescription: balances[0]?.accountDescription || '',
        parentAmount,
        subsidiaryAmounts,
        consolidatedAmount,
        eliminations: accountEliminations
      }
    })
    
    return consolidated
  },

  // Generate consolidation journal entries
  generateConsolidationJournals(eliminations, ownershipAdjustments, goodwillAdjustments) {
    const journals = []
    
    // IC Elimination journals
    eliminations.forEach((elimination, index) => {
      journals.push({
        journalNumber: `CJ-IC-${Date.now()}-${index + 1}`,
        description: elimination.description,
        date: new Date().toISOString().split('T')[0],
        type: 'IC_ELIMINATION',
        entries: [
          {
            type: 'Debit',
            accountCode: elimination.debitAccount,
            entity: elimination.entity,
            amount: elimination.amount,
            description: `Eliminate IC ${elimination.type}`
          },
          {
            type: 'Credit',
            accountCode: elimination.creditAccount,
            entity: elimination.counterparty,
            amount: elimination.amount,
            description: `Eliminate IC ${elimination.type}`
          }
        ]
      })
    })
    
    // Ownership/NCI adjustment journals
    ownershipAdjustments.forEach((adjustment, index) => {
      journals.push({
        journalNumber: `CJ-OWN-${Date.now()}-${index + 1}`,
        description: `Ownership adjustment for ${adjustment.entity}`,
        date: new Date().toISOString().split('T')[0],
        type: 'OWNERSHIP_ADJUSTMENT',
        entries: adjustment.entries
      })
    })
    
    // Goodwill journals
    goodwillAdjustments.forEach((adjustment, index) => {
      journals.push({
        journalNumber: `CJ-GW-${Date.now()}-${index + 1}`,
        description: `Goodwill adjustment for ${adjustment.entity}`,
        date: new Date().toISOString().split('T')[0],
        type: 'GOODWILL_ADJUSTMENT',
        entries: adjustment.entries
      })
    })
    
    return journals
  },

  // Calculate roll-forward balances
  calculateRollForwardBalances(openingBalances, movements, adjustments, eliminations) {
    const rollForward = {}
    
    Object.keys(openingBalances).forEach(accountCode => {
      const opening = parseFloat(openingBalances[accountCode]) || 0
      const movement = parseFloat(movements[accountCode]) || 0
      const adjustment = parseFloat(adjustments[accountCode]) || 0
      const elimination = parseFloat(eliminations[accountCode]) || 0
      
      rollForward[accountCode] = {
        openingBalance: opening,
        movements: movement,
        adjustments: adjustment,
        eliminations: elimination,
        closingBalance: opening + movement + adjustment + elimination
      }
    })
    
    return rollForward
  },

  // Validate consolidation calculations
  validateConsolidation(consolidatedBalances, eliminations) {
    const errors = []
    const warnings = []
    
    // Check for unbalanced eliminations
    eliminations.forEach(elimination => {
      if (elimination.debitAccount === elimination.creditAccount) {
        errors.push(`Invalid elimination: Same account for debit and credit`)
      }
    })
    
    // Check for negative balances in asset accounts
    Object.values(consolidatedBalances).forEach(balance => {
      if (balance.accountCode.startsWith('1') && balance.consolidatedAmount < 0) {
        warnings.push(`Negative balance in asset account ${balance.accountCode}`)
      }
    })
    
    // Check for material differences
    Object.values(consolidatedBalances).forEach(balance => {
      const totalEntityAmount = balance.parentAmount + Object.values(balance.subsidiaryAmounts).reduce((sum, amt) => sum + amt, 0)
      const difference = Math.abs(balance.consolidatedAmount - totalEntityAmount)
      const percentage = (difference / totalEntityAmount) * 100
      
      if (percentage > 5 && totalEntityAmount > 10000) {
        warnings.push(`Large consolidation difference in account ${balance.accountCode}: ${percentage.toFixed(2)}%`)
      }
    })
    
    return { errors, warnings }
  }
}

export class ConsolidationService {
  // ===== AUTHENTICATION & COMPANY MANAGEMENT =====
  static async verifyAuth() {
    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        headers: getAuthHeaders()
      })
      return response.ok ? await response.json() : null
    } catch (error) {
      console.error('Auth verification failed:', error)
      return null
    }
  }

  static async getCompanies() {
    try {
      const response = await fetch(`${API_BASE}/companies`, {
        headers: getAuthHeaders()
      })
      return response.ok ? await response.json() : []
    } catch (error) {
      console.error('Failed to fetch companies:', error)
      return []
    }
  }

  // ===== ENTITIES & ACCOUNTS =====
  static async getEntities() {
    try {
      const result = await entitiesAPI.getEntities()
      return result.data || []
    } catch (error) {
      console.error('Failed to fetch entities:', error)
      return []
    }
  }

  static async getIFRSAccounts() {
    try {
      const result = await ifrsAccountsAPI.getAccounts()
      return result.data || []
    } catch (error) {
      console.error('Failed to fetch IFRS accounts:', error)
      return []
    }
  }

  // ===== ADDITIONAL FUNCTIONS =====
  static async getAdditionalRules() {
    try {
      const response = await fetch(`${API_BASE}/consolidation/rules`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.rules || []
      }
      return []
    } catch (error) {
      console.error('Failed to fetch additional rules:', error)
      return []
    }
  }

  static async getRollforwardAccounts() {
    try {
      const response = await fetch(`${API_BASE}/consolidation/rollforward`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.rollforwardAccounts || []
      }
      return []
    } catch (error) {
      console.error('Failed to fetch rollforward accounts:', error)
      return []
    }
  }

  static async getFSTTemplates() {
    try {
      const result = await fstAPI.getTemplates()
      return result.data || []
    } catch (error) {
      console.error('Failed to fetch FST templates:', error)
      return []
    }
  }

  static async getConsolidationAccounts() {
    try {
      const result = await ifrsAccountsAPI.getAccounts()
      return { accounts: result.data || [] }
    } catch (error) {
      console.error('Failed to fetch consolidation accounts:', error)
      return { accounts: [] }
    }
  }

  static async getConsolidationData() {
    try {
      const [icTransactions, ownerships, journals] = await Promise.all([
        this.getICTransactions(),
        this.getOwnershipStructures(),
        this.getConsolidationJournals()
      ])
      
      return {
        ic_items: icTransactions,
        ownerships: ownerships,
        journals: journals
      }
    } catch (error) {
      console.error('Failed to fetch consolidation data:', error)
      return {
        ic_items: [],
        ownerships: [],
        journals: []
      }
    }
  }

  static async loadJournals() {
    try {
      const result = await this.getConsolidationJournals()
      return result
    } catch (error) {
      console.error('Failed to load journals:', error)
      return []
    }
  }

  // ===== ADDITIONAL RULES FUNCTIONS =====
  static async createAdditionalRule(ruleData) {
    try {
      const response = await fetch(`${API_BASE}/consolidation/additional-rules`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ruleData)
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Failed to create rule' }
      }
    } catch (error) {
      console.error('Failed to create additional rule:', error)
      return { success: false, error: error.message }
    }
  }

  static async getAdditionalRules(filters = {}) {
    try {
      const queryParams = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          queryParams.append(key, filters[key])
        }
      })
      
      const response = await fetch(`${API_BASE}/consolidation/additional-rules?${queryParams}`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        return { success: true, data: data.rules || [] }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Failed to fetch rules' }
      }
    } catch (error) {
      console.error('Failed to fetch additional rules:', error)
      return { success: false, error: error.message }
    }
  }

  static async updateAdditionalRule(ruleId, ruleData) {
    try {
      const response = await fetch(`${API_BASE}/consolidation/additional-rules/${ruleId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(ruleData)
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Failed to update rule' }
      }
    } catch (error) {
      console.error('Failed to update additional rule:', error)
      return { success: false, error: error.message }
    }
  }

  static async deleteAdditionalRule(ruleId) {
    try {
      const response = await fetch(`${API_BASE}/consolidation/additional-rules/${ruleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Failed to delete rule' }
      }
    } catch (error) {
      console.error('Failed to delete additional rule:', error)
      return { success: false, error: error.message }
    }
  }

  static async simulateAdditionalRules(simulationData) {
    try {
      const response = await fetch(`${API_BASE}/consolidation/additional-rules/simulate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(simulationData)
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Failed to simulate rules' }
      }
    } catch (error) {
      console.error('Failed to simulate additional rules:', error)
      return { success: false, error: error.message }
    }
  }

  static async applyAdditionalRules(applicationData) {
    try {
      const response = await fetch(`${API_BASE}/consolidation/additional-rules/apply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(applicationData)
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Failed to apply rules' }
      }
    } catch (error) {
      console.error('Failed to apply additional rules:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== RULE TEMPLATES =====
  static getRuleTemplates() {
    return [
      {
        id: 'reclassify',
        name: 'Reclassification Rule',
        description: 'Move amounts between accounts for reporting purposes',
        template: {
          name: '',
          description: '',
          rule_type: 'reclassify',
          conditions: [
            {
              field: 'account_code',
              operator: 'equals',
              value: ''
            }
          ],
          actions: [
            {
              type: 'reclassify',
              to_account: '',
              amount: '',
              description: 'Reclassify to different account'
            }
          ],
          priority: 1,
          is_active: true
        }
      },
      {
        id: 'eliminate',
        name: 'IC Elimination Rule',
        description: 'Automatically eliminate intercompany transactions',
        template: {
          name: '',
          description: '',
          rule_type: 'eliminate',
          conditions: [
            {
              field: 'account_name',
              operator: 'contains',
              value: 'intercompany'
            }
          ],
          actions: [
            {
              type: 'eliminate',
              description: 'Eliminate IC transactions'
            }
          ],
          priority: 1,
          is_active: true
        }
      },
      {
        id: 'allocate',
        name: 'Allocation Rule',
        description: 'Allocate amounts based on percentages or formulas',
        template: {
          name: '',
          description: '',
          rule_type: 'allocate',
          conditions: [
            {
              field: 'net_amount',
              operator: 'greater_than',
              value: 0
            }
          ],
          actions: [
            {
              type: 'allocate',
              percentage: 100,
              description: 'Allocate amount'
            }
          ],
          priority: 1,
          is_active: true
        }
      },
      {
        id: 'adjust',
        name: 'Manual Adjustment Rule',
        description: 'Apply manual adjustments to specific accounts',
        template: {
          name: '',
          description: '',
          rule_type: 'adjust',
          conditions: [
            {
              field: 'entity_id',
              operator: 'equals',
              value: ''
            }
          ],
          actions: [
            {
              type: 'adjust',
              amount: 0,
              description: 'Manual adjustment'
            }
          ],
          priority: 1,
          is_active: true
        }
      }
    ]
  }

  // ===== CONDITION OPERATORS =====
  static getConditionOperators() {
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'starts_with', label: 'Starts With' },
      { value: 'ends_with', label: 'Ends With' },
      { value: 'greater_than', label: 'Greater Than' },
      { value: 'less_than', label: 'Less Than' },
      { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
      { value: 'less_than_or_equal', label: 'Less Than or Equal' }
    ]
  }

  // ===== CONDITION FIELDS =====
  static getConditionFields() {
    return [
      { value: 'entity_id', label: 'Entity ID' },
      { value: 'account_code', label: 'Account Code' },
      { value: 'account_name', label: 'Account Name' },
      { value: 'net_amount', label: 'Net Amount' },
      { value: 'debit_amount', label: 'Debit Amount' },
      { value: 'credit_amount', label: 'Credit Amount' },
      { value: 'period', label: 'Period' },
      { value: 'year', label: 'Year' }
    ]
  }

  // ===== ACTION TYPES =====
  static getActionTypes() {
    return [
      { value: 'reclassify', label: 'Reclassify' },
      { value: 'eliminate', label: 'Eliminate' },
      { value: 'allocate', label: 'Allocate' },
      { value: 'adjust', label: 'Adjust' }
    ]
  }

  // ===== TRIAL BALANCE & PROCESS INTEGRATION =====
  static async uploadTrialBalance(file, period, year) {
    try {
      const result = await trialBalanceAPI.upload(file, period, year)
      return { success: true, data: result.data }
    } catch (error) {
      console.error('Failed to upload trial balance:', error)
      return { success: false, error: error.message }
    }
  }

  static async getTrialBalanceData() {
    try {
      const result = await trialBalanceAPI.getData()
      return result.data || []
    } catch (error) {
      console.error('Failed to fetch trial balance data:', error)
      return []
    }
  }

  static async getProcessEntries(period, year) {
    try {
      const result = await processAPI.getEntries(period, year)
      return result.data || []
    } catch (error) {
      console.error('Failed to fetch process entries:', error)
      return []
    }
  }

  static async createProcessEntry(entryData) {
    try {
      const result = await processAPI.createEntry(entryData)
      return { success: true, data: result.data }
    } catch (error) {
      console.error('Failed to create process entry:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== INTERCOMPANY TRANSACTIONS =====
  static async getICTransactions(filters = {}) {
    try {
      const queryParams = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key])
      })
      
      const response = await fetch(`${API_BASE}/consolidation/ic-transactions?${queryParams}`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        return data || []
      }
      return []
    } catch (error) {
      console.error('Failed to fetch IC transactions:', error)
      return []
    }
  }

  static async createICTransaction(transactionData) {
    try {
      const response = await fetch(`${API_BASE}/consolidation/ic-transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(transactionData)
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result.transaction }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Failed to create IC transaction' }
      }
    } catch (error) {
      console.error('Failed to create IC transaction:', error)
      return { success: false, error: error.message }
    }
  }

  static async autoMatchICTransactions() {
    try {
      const response = await fetch(`${API_BASE}/consolidation/ic-transactions/auto-match`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Auto-matching failed' }
      }
    } catch (error) {
      console.error('Auto-matching failed:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== CONSOLIDATION JOURNALS =====
  static async getConsolidationJournals(filters = {}) {
    try {
      const queryParams = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key])
      })
      
      const response = await fetch(`${API_BASE}/consolidation/journals?${queryParams}`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.journals || []
      }
      return []
    } catch (error) {
      console.error('Failed to fetch consolidation journals:', error)
      return []
    }
  }

  static async createConsolidationJournal(journalData) {
    try {
      const response = await fetch(`${API_BASE}/consolidation/journals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(journalData)
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result.journal }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Failed to create journal' }
      }
    } catch (error) {
      console.error('Failed to create consolidation journal:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== OWNERSHIP STRUCTURES =====
  static async getOwnershipStructures() {
    try {
      const response = await fetch(`${API_BASE}/consolidation/ownership`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.ownerships || []
      }
      return []
    } catch (error) {
      console.error('Failed to fetch ownership structures:', error)
      return []
    }
  }

  static async createOwnershipStructure(ownershipData) {
    try {
      const response = await fetch(`${API_BASE}/consolidation/ownership`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ownershipData)
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result.ownership }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Failed to create ownership structure' }
      }
    } catch (error) {
      console.error('Failed to create ownership structure:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== CONSOLIDATION CALCULATIONS =====
  static async performConsolidation(period, year, entities, accounts) {
    try {
      // Get all necessary data
      const [icTransactions, ownershipStructures, processEntries] = await Promise.all([
        this.getICTransactions({ period, year }),
        this.getOwnershipStructures(),
        this.getProcessEntries(period, year)
      ])

      // Perform IC eliminations
      const eliminations = ConsolidationUtils.eliminateIntercompanyTransactions(icTransactions)
      
      // Calculate ownership adjustments
      const ownershipAdjustments = ownershipStructures.map(ownership => {
        const { ownership: ownershipPct, nci } = ConsolidationUtils.calculateOwnershipAndNCI(ownership.ownershipPercentage)
        const goodwill = ConsolidationUtils.calculateGoodwill(
          ownership.purchaseConsideration,
          ownership.fairValueNetAssets,
          ownership.ownershipPercentage,
          ownership.goodwillMethod
        )
        
        return {
          entity: ownership.subsidiaryEntity,
          ownershipPercentage: ownershipPct,
          nciPercentage: nci,
          goodwill,
          entries: [
            {
              type: 'Debit',
              accountCode: '1000', // Investment in subsidiary
              entity: ownership.parentEntity,
              amount: ownership.purchaseConsideration,
              description: `Investment in ${ownership.subsidiaryEntity}`
            },
            {
              type: 'Credit',
              accountCode: '3000', // NCI
              entity: ownership.subsidiaryEntity,
              amount: ConsolidationUtils.calculateNCIValue(
                ownership.fairValueNetAssets,
                goodwill.totalGoodwill,
                nci
              ),
              description: `NCI in ${ownership.subsidiaryEntity}`
            }
          ]
        }
      })

      // Calculate consolidated balances
      const consolidatedBalances = ConsolidationUtils.calculateConsolidatedBalances(
        processEntries,
        ownershipStructures,
        eliminations
      )

      // Generate consolidation journals
      const consolidationJournals = ConsolidationUtils.generateConsolidationJournals(
        eliminations,
        ownershipAdjustments,
        []
      )

      // Validate consolidation
      const validation = ConsolidationUtils.validateConsolidation(consolidatedBalances, eliminations)

      return {
        success: true,
        data: {
          consolidatedBalances,
          eliminations,
          ownershipAdjustments,
          consolidationJournals,
          validation,
          summary: {
            totalEntities: entities.length,
            totalAccounts: accounts.length,
            totalEliminations: eliminations.length,
            totalAdjustments: ownershipAdjustments.length,
            totalJournals: consolidationJournals.length
          }
        }
      }
    } catch (error) {
      console.error('Consolidation calculation failed:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== CONSOLIDATED FINANCIAL STATEMENTS =====
  static async generateConsolidatedFinancials(period, year, templateIds = []) {
    try {
      // Get FST templates
      const templates = await fstAPI.getTemplates()
      const selectedTemplates = templates.filter(t => templateIds.includes(t.id))
      
      // Perform consolidation
      const consolidation = await this.performConsolidation(period, year)
      
      if (!consolidation.success) {
        return { success: false, error: consolidation.error }
      }

      // Generate financial statements based on templates
      const financialStatements = selectedTemplates.map(template => {
        const templateElements = template.elements || []
        const consolidatedAccounts = templateElements.map(element => {
          const accountCode = element.account_code
          const consolidatedBalance = consolidation.data.consolidatedBalances[accountCode]
          
          return {
            accountCode,
            accountDescription: element.account_name || element.name,
            consolidatedAmount: consolidatedBalance?.consolidatedAmount || 0,
            parentAmount: consolidatedBalance?.parentAmount || 0,
            subsidiaryAmounts: consolidatedBalance?.subsidiaryAmounts || {},
            eliminations: consolidatedBalance?.eliminations || [],
            templateElement: element
          }
        })

        return {
          templateId: template.id,
          templateName: template.name,
          templateType: template.type,
          period,
          year,
          accounts: consolidatedAccounts,
          totalAssets: consolidatedAccounts
            .filter(acc => acc.accountCode.startsWith('1'))
            .reduce((sum, acc) => sum + acc.consolidatedAmount, 0),
          totalLiabilities: consolidatedAccounts
            .filter(acc => acc.accountCode.startsWith('2'))
            .reduce((sum, acc) => sum + acc.consolidatedAmount, 0),
          totalEquity: consolidatedAccounts
            .filter(acc => acc.accountCode.startsWith('3'))
            .reduce((sum, acc) => sum + acc.consolidatedAmount, 0),
          totalRevenue: consolidatedAccounts
            .filter(acc => acc.accountCode.startsWith('4'))
            .reduce((sum, acc) => sum + acc.consolidatedAmount, 0),
          totalExpenses: consolidatedAccounts
            .filter(acc => acc.accountCode.startsWith('5'))
            .reduce((sum, acc) => sum + acc.consolidatedAmount, 0)
        }
      })

      // Save consolidated financial statements to SQL
      const saveResult = await this.saveConsolidatedFinancialsToSQL(financialStatements, period, year)
      
      if (!saveResult.success) {
        console.warn('Failed to save consolidated financials to SQL:', saveResult.error)
      }

      return {
        success: true,
        data: {
          financialStatements,
          consolidation: consolidation.data,
          savedToSQL: saveResult.success,
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Failed to generate consolidated financials:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== SAVE CONSOLIDATED FINANCIAL STATEMENTS TO SQL =====
  static async saveConsolidatedFinancialsToSQL(financialStatements, period, year) {
    try {
      const response = await fetch(`${API_BASE}/consolidation/save-financials`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          financialStatements,
          period,
          year,
          generatedAt: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Failed to save financial statements' }
      }
    } catch (error) {
      console.error('Failed to save consolidated financials to SQL:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== ROLL-FORWARD CALCULATIONS =====
  static async calculateRollForward(period, year, previousPeriod, previousYear) {
    try {
      // Get current and previous period data
      const [currentEntries, previousEntries] = await Promise.all([
        this.getProcessEntries(period, year),
        this.getProcessEntries(previousPeriod, previousYear)
      ])

      // Group by account
      const currentBalances = {}
      const previousBalances = {}
      
      currentEntries.forEach(entry => {
        const accountCode = entry.account_code
        if (!currentBalances[accountCode]) {
          currentBalances[accountCode] = 0
        }
        currentBalances[accountCode] += parseFloat(entry.amount) || 0
      })

      previousEntries.forEach(entry => {
        const accountCode = entry.account_code
        if (!previousBalances[accountCode]) {
          previousBalances[accountCode] = 0
        }
        previousBalances[accountCode] += parseFloat(entry.amount) || 0
      })

      // Calculate roll-forward
      const rollForward = {}
      const allAccounts = new Set([...Object.keys(currentBalances), ...Object.keys(previousBalances)])
      
      allAccounts.forEach(accountCode => {
        const opening = previousBalances[accountCode] || 0
        const closing = currentBalances[accountCode] || 0
        const movement = closing - opening
        
        rollForward[accountCode] = {
          accountCode,
          openingBalance: opening,
          closingBalance: closing,
          movement,
          period,
          year
        }
      })

      return {
        success: true,
        data: rollForward
      }
    } catch (error) {
      console.error('Roll-forward calculation failed:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== EXPORT FUNCTIONS =====
  static async exportConsolidationData(period, year, format = 'csv') {
    try {
      const response = await fetch(`${API_BASE}/consolidation/export?period=${period}&year=${year}&format=${format}`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `consolidation_${period}_${year}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.detail || 'Export failed' }
      }
    } catch (error) {
      console.error('Export failed:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== UTILITY FUNCTIONS =====
  static getConsolidationUtils() {
    return ConsolidationUtils
  }

  static formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  static formatPercentage(value, decimals = 2) {
    return `${(value * 100).toFixed(decimals)}%`
  }
}

export default ConsolidationService
