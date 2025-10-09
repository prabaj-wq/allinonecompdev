import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'

const CompanyContext = createContext()

export const CompanyProvider = ({ children }) => {
  const { selectedCompany: authSelectedCompany, isAuthenticated, setSelectedCompany, user } = useAuth()
  const [companies, setCompanies] = useState([])
  const [entities, setEntities] = useState([])
  const [ifrsAccounts, setIfrsAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Use the selectedCompany from auth context
  const selectedCompany = authSelectedCompany
  
  // Debug logging
  useEffect(() => {
    console.log('🏢 CompanyContext Debug - Auth Selected Company:', authSelectedCompany)
    console.log('🏢 CompanyContext Debug - User:', user)
    console.log('🏢 CompanyContext Debug - Is Authenticated:', isAuthenticated)
  }, [authSelectedCompany, user, isAuthenticated])

  // Add selectCompany function that actually sets the selected company
  const selectCompany = (company) => {
    console.log('Company selected in CompanyContext:', company);
    // Set the selected company in the auth context
    if (company && typeof company === 'object') {
      setSelectedCompany(company.name)
      // Store in localStorage for persistence
      localStorage.setItem('selectedCompany', company.name)
      console.log('Stored company in localStorage:', company.name);
    } else if (typeof company === 'string') {
      setSelectedCompany(company)
      // Store in localStorage for persistence
      localStorage.setItem('selectedCompany', company)
      console.log('Stored company in localStorage:', company);
    }
  }

  // Define functions first using useCallback
  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use direct API call instead of ConsolidationService
      const response = await fetch('/api/auth/companies', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const companiesData = await response.json()
        console.log('🏢 CompanyContext: Loaded companies:', companiesData)
        
        // Convert company objects to the format expected by the frontend
        const formattedCompanies = (companiesData.companies || []).map(company => ({
          id: company.name, // Use name as ID for now
          name: company.name,
          code: company.code,
          type: 'Company',
          status: company.status,
          environment_type: company.environment_type,
          industry: company.industry,
          // Add default values for missing fields
          country: 'N/A',
          currency: 'N/A',
          employees: 'N/A',
          revenue: null
        }))
        
        setCompanies(formattedCompanies)
        console.log('🏢 CompanyContext: Formatted companies:', formattedCompanies)
      } else {
        console.error('Failed to load companies:', response.status)
        setCompanies([])
      }
      
    } catch (error) {
      console.error('Failed to load companies:', error)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCompanyData = useCallback(async () => {
    if (!selectedCompany) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🏢 CompanyContext: Fetching data for company:', selectedCompany)
      
      // Fetch company-specific data directly from backend APIs
      const [entitiesResponse, hierarchiesResponse] = await Promise.all([
        fetch(`/api/axes-entity/entities?company_name=${encodeURIComponent(selectedCompany)}`, { credentials: 'include' }),
        fetch(`/api/axes-entity/hierarchies?company_name=${encodeURIComponent(selectedCompany)}`, { credentials: 'include' })
      ])
      
      // Try to fetch IFRS accounts but don't fail if endpoint doesn't exist
      let accountsResponse = null
      try {
        accountsResponse = await fetch('/api/ifrs-accounts', { credentials: 'include' })
      } catch (error) {
        console.warn('IFRS accounts endpoint not available:', error)
      }
      
      let entitiesData = []
      let ifrsAccountsData = []
      let hierarchiesData = []
      
      if (entitiesResponse.ok) {
        const entitiesResult = await entitiesResponse.json()
        entitiesData = entitiesResult.entities || []
        console.log('🏢 CompanyContext: Loaded entities:', entitiesData.length)
      } else {
        console.warn('Failed to load entities:', entitiesResponse.status)
      }
      
      if (accountsResponse && accountsResponse.ok) {
        const accountsResult = await accountsResponse.json()
        ifrsAccountsData = accountsResult.accounts || []
        console.log('🏢 CompanyContext: Loaded accounts:', ifrsAccountsData.length)
      } else if (accountsResponse) {
        console.warn('Failed to load accounts:', accountsResponse.status)
      } else {
        console.log('🏢 CompanyContext: IFRS accounts endpoint not available, skipping')
      }
      
      if (hierarchiesResponse.ok) {
        const hierarchiesResult = await hierarchiesResponse.json()
        hierarchiesData = hierarchiesResult.hierarchies || []
        console.log('🏢 CompanyContext: Loaded hierarchies:', hierarchiesData.length)
      } else {
        console.warn('Failed to load hierarchies:', hierarchiesResponse.status)
      }
      
      // Set the data
      setEntities(entitiesData)
      setIfrsAccounts(ifrsAccountsData)
      
      console.log('🏢 CompanyContext: Loaded entities:', entitiesData.length, 'accounts:', ifrsAccountsData.length, 'hierarchies:', hierarchiesData.length)
      
    } catch (error) {
      console.error('Failed to load company data:', error)
      setError('Failed to load company data. Please try again.')
      // Fallback to sample data for the selected company
      loadSampleCompanyData()
    } finally {
      setLoading(false)
    }
  }, [selectedCompany])

  // Load available companies when authenticated (only once)
  useEffect(() => {
    if (isAuthenticated && companies.length === 0) {
      loadCompanies()
    }
  }, [isAuthenticated, companies.length, loadCompanies])

  // Auto-set company from user login if not already set
  useEffect(() => {
    if (user && user.company && !selectedCompany && isAuthenticated) {
      console.log('🏢 CompanyContext: Auto-setting company from user login:', user.company)
      setSelectedCompany(user.company)
    }
  }, [user, selectedCompany, isAuthenticated, setSelectedCompany])

  // Reset data when company changes
  useEffect(() => {
    if (selectedCompany) {
      setDataLoaded(false)
      setEntities([])
      setIfrsAccounts([])
      setError(null)
    }
  }, [selectedCompany])

  // Load company-specific data when company is selected (only once per company)
  useEffect(() => {
    if (selectedCompany && isAuthenticated && !dataLoaded) {
      console.log('🏢 CompanyContext: Loading data for company:', selectedCompany)
      setDataLoaded(true)
      loadCompanyData()
    }
  }, [selectedCompany, isAuthenticated, dataLoaded, loadCompanyData])

  const loadSampleCompanyData = () => {
    // Generate sample data based on selected company to demonstrate isolation
    const companyName = selectedCompany || 'Unknown Company'
    
    setEntities([
      {
        entity_code: `${companyName}_001`,
        entity_name: `${companyName} Main Entity`,
        entity_type: 'Parent',
        country: 'Canada',
        currency: 'CAD',
        hierarchy_id: 'H1'
      },
      {
        entity_code: `${companyName}_002`, 
        entity_name: `${companyName} Subsidiary`,
        entity_type: 'Subsidiary',
        country: 'Canada',
        currency: 'CAD',
        hierarchy_id: 'H2'
      }
    ])
    
    setIfrsAccounts([
      {
        account_code: '1000',
        account_name: 'Cash and Cash Equivalents',
        account_type: 'Asset',
        description: 'Cash and bank balances',
        hierarchy_id: 'A1'
      },
      {
        account_code: '2000',
        account_name: 'Accounts Receivable',
        account_type: 'Asset', 
        description: 'Trade receivables',
        hierarchy_id: 'A2'
      }
    ])
  }

  // CRUD operations for entities
  const addEntity = async (entityData) => {
    try {
      const result = await ConsolidationService.addEntity(entityData)
      if (result.success) {
        await loadCompanyData() // Refresh data
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Failed to add entity:', error)
      return { success: false, error: error.message }
    }
  }

  const updateEntity = async (entityCode, entityData) => {
    try {
      const result = await ConsolidationService.updateEntity(entityCode, entityData)
      if (result.success) {
        await loadCompanyData() // Refresh data
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Failed to update entity:', error)
      return { success: false, error: error.message }
    }
  }

  const deleteEntity = async (entityCode) => {
    try {
      const result = await ConsolidationService.deleteEntity(entityCode)
      if (result.success) {
        await loadCompanyData() // Refresh data
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Failed to delete entity:', error)
      return { success: false, error: error.message }
    }
  }

  // CRUD operations for IFRS accounts
  const addIFRSAccount = async (accountData) => {
    try {
      const result = await ConsolidationService.addIFRSAccount(accountData)
      if (result.success) {
        await loadCompanyData() // Refresh data
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Failed to add IFRS account:', error)
      return { success: false, error: error.message }
    }
  }

  const updateIFRSAccount = async (accountCode, accountData) => {
    try {
      const result = await ConsolidationService.updateIFRSAccount(accountCode, accountData)
      if (result.success) {
        await loadCompanyData() // Refresh data
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Failed to update IFRS account:', error)
      return { success: false, error: error.message }
    }
  }

  const deleteIFRSAccount = async (accountCode) => {
    try {
      const result = await ConsolidationService.deleteIFRSAccount(accountCode)
      if (result.success) {
        await loadCompanyData() // Refresh data
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Failed to delete IFRS account:', error)
      return { success: false, error: error.message }
    }
  }

  const refreshCompanyData = async () => {
    if (selectedCompany) {
      await loadCompanyData()
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    companies,
    selectedCompany,
    entities,
    ifrsAccounts,
    loading,
    error,
    addEntity,
    updateEntity,
    deleteEntity,
    addIFRSAccount,
    updateIFRSAccount,
    deleteIFRSAccount,
    refreshCompanyData,
    clearError,
    loadCompanies,
    loadCompanyData,
    selectCompany
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

export const useCompany = () => {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}