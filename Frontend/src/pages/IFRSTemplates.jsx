import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Plus, 
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Clock,
  Star,
  Calendar,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react'

const IFRSTemplates = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  useEffect(() => {
    loadIFRSTemplates()
  }, [])

  const loadIFRSTemplates = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data for categories
      const mockCategories = [
        { id: 'financial-instruments', name: 'Financial Instruments', count: 15 },
        { id: 'revenue-recognition', name: 'Revenue Recognition', count: 8 },
        { id: 'leases', name: 'Leases', count: 12 },
        { id: 'business-combinations', name: 'Business Combinations', count: 10 },
        { id: 'consolidation', name: 'Consolidation', count: 18 },
        { id: 'fair-value', name: 'Fair Value Measurement', count: 14 },
        { id: 'impairment', name: 'Impairment', count: 9 },
        { id: 'tax', name: 'Income Taxes', count: 11 }
      ]
      setCategories(mockCategories)

      // Mock data for templates
      const mockTemplates = [
        {
          id: 1,
          name: 'IFRS 9 - Financial Instruments',
          category: 'financial-instruments',
          version: '2023',
          status: 'active',
          lastUpdated: '2024-01-15',
          description: 'Comprehensive template for financial instruments classification, measurement, and impairment',
          features: ['Classification', 'Measurement', 'Impairment', 'Hedge Accounting'],
          compliance: 'Fully compliant',
          downloads: 1250,
          rating: 4.8
        },
        {
          id: 2,
          name: 'IFRS 15 - Revenue from Contracts with Customers',
          category: 'revenue-recognition',
          version: '2023',
          status: 'active',
          lastUpdated: '2024-01-10',
          description: 'Template for revenue recognition under the five-step model',
          features: ['Five-Step Model', 'Contract Identification', 'Performance Obligations', 'Transaction Price'],
          compliance: 'Fully compliant',
          downloads: 980,
          rating: 4.6
        },
        {
          id: 3,
          name: 'IFRS 16 - Leases',
          category: 'leases',
          version: '2023',
          status: 'active',
          lastUpdated: '2024-01-08',
          description: 'Template for lease accounting under the new standard',
          features: ['Right-of-Use Assets', 'Lease Liabilities', 'Short-term Leases', 'Low-value Assets'],
          compliance: 'Fully compliant',
          downloads: 1100,
          rating: 4.7
        },
        {
          id: 4,
          name: 'IFRS 3 - Business Combinations',
          category: 'business-combinations',
          version: '2023',
          status: 'active',
          lastUpdated: '2024-01-05',
          description: 'Template for business combination accounting and goodwill',
          features: ['Purchase Consideration', 'Identifiable Assets', 'Goodwill Calculation', 'Bargain Purchase'],
          compliance: 'Fully compliant',
          downloads: 750,
          rating: 4.5
        },
        {
          id: 5,
          name: 'IFRS 10 - Consolidated Financial Statements',
          category: 'consolidation',
          version: '2023',
          status: 'active',
          lastUpdated: '2024-01-12',
          description: 'Template for consolidation procedures and control assessment',
          features: ['Control Assessment', 'Consolidation Procedures', 'Non-controlling Interests', 'Changes in Ownership'],
          compliance: 'Fully compliant',
          downloads: 1350,
          rating: 4.9
        },
        {
          id: 6,
          name: 'IFRS 13 - Fair Value Measurement',
          category: 'fair-value',
          version: '2023',
          status: 'active',
          lastUpdated: '2024-01-03',
          description: 'Template for fair value measurement and disclosure requirements',
          features: ['Valuation Techniques', 'Level Hierarchy', 'Disclosures', 'Market Participants'],
          compliance: 'Fully compliant',
          downloads: 890,
          rating: 4.4
        }
      ]
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Error loading IFRS templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getComplianceColor = (compliance) => {
    if (compliance.includes('Fully compliant')) return 'text-green-600 dark:text-green-400'
    if (compliance.includes('Partially compliant')) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading IFRS templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">IFRS Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Standards library and compliance templates</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search IFRS templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map(category => (
          <div
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === category.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{category.count} templates</p>
              </div>
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Templates List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Templates</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredTemplates.length} of {templates.length} templates
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Sort by:</span>
              <select className="border-0 bg-transparent focus:ring-0 text-gray-700 dark:text-gray-300">
                <option>Name</option>
                <option>Date Updated</option>
                <option>Downloads</option>
                <option>Rating</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(template.status)}`}>
                        {template.status}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">v{template.version}</span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{template.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {template.downloads.toLocaleString()} downloads
                      </span>
                      <span className={`text-sm font-medium ${getComplianceColor(template.compliance)}`}>
                        {template.compliance}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {template.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors" title="Download">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Last updated: {template.lastUpdated}</span>
                  <span>Category: {categories.find(c => c.id === template.category)?.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedTemplate.name}</h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedTemplate.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Version:</span>
                      <span className="font-medium">{selectedTemplate.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="font-medium">{selectedTemplate.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Downloads:</span>
                      <span className="font-medium">{selectedTemplate.downloads.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Rating:</span>
                      <span className="font-medium">{selectedTemplate.rating}/5.0</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Compliance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`font-medium ${getComplianceColor(selectedTemplate.compliance)}`}>
                        {selectedTemplate.compliance}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                      <span className="font-medium">{selectedTemplate.lastUpdated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Category:</span>
                      <span className="font-medium">
                        {categories.find(c => c.id === selectedTemplate.category)?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="h-4 w-4 mr-2 inline" />
                  Download Template
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                  <Edit className="h-4 w-4 mr-2 inline" />
                  Customize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IFRSTemplates
