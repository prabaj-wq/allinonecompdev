import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  ChevronDown, 
  Search, 
  Plus,
  Globe,
  DollarSign,
  Users,
  TrendingUp
} from 'lucide-react'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import CreateCompanyModal from './CreateCompanyModal'

const CompanySelector = () => {
  const { companies, selectedCompany: companyContextCompany, selectCompany } = useCompany()
  const { user, selectedCompany: authSelectedCompany } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Use auth context as primary source, fallback to company context
  const selectedCompany = authSelectedCompany || companyContextCompany
  
  // Debug logging
  useEffect(() => {
    console.log('🏢 CompanySelector Debug - Auth Company:', authSelectedCompany)
    console.log('🏢 CompanySelector Debug - Context Company:', companyContextCompany)
    console.log('🏢 CompanySelector Debug - Final Selected Company:', selectedCompany)
    console.log('🏢 CompanySelector Debug - User:', user)
  }, [authSelectedCompany, companyContextCompany, selectedCompany, user])

  // Auto-select user's company when they log in
  useEffect(() => {
    if (user && user.company && companies.length > 0) {
      // Check if currently selected company is different from user's company
      const currentCompanyName = typeof selectedCompany === 'string' 
        ? selectedCompany 
        : selectedCompany?.name
      
      if (currentCompanyName !== user.company) {
        console.log('🏢 Auto-selecting user company:', user.company, '(was:', currentCompanyName, ')')
        // Find the company object in the companies array
        const userCompany = companies.find(c => 
          (typeof c === 'string' ? c === user.company : c.name === user.company)
        )
        if (userCompany) {
          selectCompany(userCompany)
        } else {
          // If not found in companies array, use the user's company name directly
          selectCompany(user.company)
        }
      }
    }
  }, [user, companies])

  // Ensure companies is an array and handle both string and object formats
  const safeCompanies = Array.isArray(companies) ? companies : []
  
  // Reorder companies to show the logged-in company first
  const orderedCompanies = safeCompanies.sort((a, b) => {
    const companyAName = typeof a === 'string' ? a : (a.name || '');
    const companyBName = typeof b === 'string' ? b : (b.name || '');
    
    // If user is logged in and has a company, put that company first
    if (user && user.company) {
      if (companyAName === user.company) return -1;
      if (companyBName === user.company) return 1;
    }
    
    // Otherwise, maintain alphabetical order
    return companyAName.localeCompare(companyBName);
  });
  
  const filteredCompanies = orderedCompanies.filter(company => {
    if (typeof company === 'string') {
      // Handle string format (company names)
      return company.toLowerCase().includes(searchTerm.toLowerCase())
    } else if (company && typeof company === 'object') {
      // Handle object format (company objects with name, code, etc.)
      return (
        (company.name && company.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (company.code && company.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (company.industry && company.industry.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    return false
  })

  const handleCompanySelect = (company) => {
    console.log('Company selected in CompanySelector:', company);
    selectCompany(company)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleCreateCompany = () => {
    setIsOpen(false)
    setShowCreateModal(true)
  }

  const handleCreateSuccess = (companyData) => {
    setShowCreateModal(false)
    // Refresh the page to load the new company
    window.location.reload()
  }

  const getCompanyIcon = (type) => {
    switch (type) {
      case 'Parent':
        return <Building2 className="h-4 w-4 text-blue-600" />
      case 'Subsidiary':
        return <Building2 className="h-4 w-4 text-green-600" />
      case 'Joint Venture':
        return <Building2 className="h-4 w-4 text-purple-600" />
      case 'Associate':
        return <Building2 className="h-4 w-4 text-orange-600" />
      default:
        return <Building2 className="h-4 w-4 text-gray-600" />
    }
  }

  const getCompanyTypeColor = (type) => {
    switch (type) {
      case 'Parent':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Subsidiary':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Joint Venture':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Associate':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Helper function to get company display info
  const getCompanyDisplayInfo = (company) => {
    if (typeof company === 'string') {
      return {
        name: company,
        code: company.substring(0, 3).toUpperCase(),
        type: 'Company'
      }
    } else if (company && typeof company === 'object') {
      return {
        name: company.name || 'Unknown Company',
        code: company.code || company.name?.substring(0, 3).toUpperCase() || 'N/A',
        type: company.type || company.environment_type || 'Company',
        country: company.country || 'N/A',
        currency: company.currency || 'N/A',
        employees: company.employees || 'N/A',
        revenue: company.revenue || null
      }
    }
    return {
      name: 'Unknown Company',
      code: 'N/A',
      type: 'Company',
      country: 'N/A',
      currency: 'N/A',
      employees: 'N/A',
      revenue: null
    }
  }

  if (!selectedCompany) {
    return (
      <div className="p-2 text-center text-gray-500">
        <Building2 className="h-4 w-4 mx-auto mb-1 text-gray-400" />
        <p className="text-xs">No company</p>
      </div>
    )
  }

  const companyInfo = getCompanyDisplayInfo(selectedCompany)

  return (
    <div className="relative">
      {/* Compact Company Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200 text-xs"
      >
        <div className="flex-shrink-0">
          {getCompanyIcon(companyInfo.type)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate max-w-24">
            {companyInfo.name}
          </p>
          <p className="text-gray-500 truncate max-w-24">
            {companyInfo.code}
          </p>
        </div>
        <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Compact Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Company List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCompanies.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Building2 className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No entities found</p>
                <p className="text-xs text-gray-400">Try adjusting your search</p>
              </div>
            ) : (
              <div className="py-1">
                {filteredCompanies.map((company, index) => {
                  const companyDisplay = getCompanyDisplayInfo(company)
                  const isSelected = typeof selectedCompany === 'string' 
                    ? selectedCompany === company 
                    : selectedCompany.name === company.name
                  
                  return (
                    <button
                      key={company.name || index}
                      onClick={() => handleCompanySelect(company)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors duration-200 ${
                        isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getCompanyIcon(companyDisplay.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {companyDisplay.name}
                            </p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getCompanyTypeColor(companyDisplay.type)}`}>
                              {companyDisplay.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {companyDisplay.code} • {companyDisplay.country || 'N/A'}
                          </p>
                          {company && typeof company === 'object' && company.currency && (
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1">
                                <Globe className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{company.currency}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{company.employees || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {company.revenue ? `$${(company.revenue / 1000000).toFixed(1)}M` : 'N/A'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Create New Company Button */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button 
              onClick={handleCreateCompany}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Company</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Create Company Modal */}
      <CreateCompanyModal
        visible={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

export default CompanySelector