import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

class BusinessToolsService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/business-tools`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor for authentication
    this.api.interceptors.request.use(
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

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('authToken')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Get available business theories
  async getBusinessTheories() {
    try {
      const response = await this.api.get('/theories')
      return response.data
    } catch (error) {
      console.error('Error fetching business theories:', error)
      throw error
    }
  }

  // Get supported industries
  async getIndustries() {
    try {
      const response = await this.api.get('/industries')
      return response.data
    } catch (error) {
      console.error('Error fetching industries:', error)
      throw error
    }
  }

  // Time Value of Money calculations
  async calculateTVM(data) {
    try {
      const response = await this.api.post('/calculations/tvm', data)
      return response.data
    } catch (error) {
      console.error('Error calculating TVM:', error)
      throw error
    }
  }

  // CAPM calculations
  async calculateCAPM(data) {
    try {
      const response = await this.api.post('/calculations/capm', data)
      return response.data
    } catch (error) {
      console.error('Error calculating CAPM:', error)
      throw error
    }
  }

  // Porter's Five Forces analysis
  async analyzePortersFiveForces(data) {
    try {
      const response = await this.api.post('/analysis/porters-five-forces', data)
      return response.data
    } catch (error) {
      console.error('Error analyzing Porter\'s Five Forces:', error)
      throw error
    }
  }

  // SWOT analysis
  async analyzeSWOT(data) {
    try {
      const response = await this.api.post('/analysis/swot', data)
      return response.data
    } catch (error) {
      console.error('Error analyzing SWOT:', error)
      throw error
    }
  }

  // Lean Six Sigma analysis
  async analyzeLeanSixSigma(data) {
    try {
      const response = await this.api.post('/analysis/lean-six-sigma', data)
      return response.data
    } catch (error) {
      console.error('Error analyzing Lean Six Sigma:', error)
      throw error
    }
  }

  // Save analysis results
  async saveAnalysis(data) {
    try {
      const response = await this.api.post('/save-analysis', data)
      return response.data
    } catch (error) {
      console.error('Error saving analysis:', error)
      throw error
    }
  }

  // Get saved analyses
  async getSavedAnalyses(analysisType) {
    try {
      const response = await this.api.get(`/saved-analyses/${analysisType}`)
      return response.data
    } catch (error) {
      console.error('Error fetching saved analyses:', error)
      throw error
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.api.get('/health')
      return response.data
    } catch (error) {
      console.error('Error checking health:', error)
      throw error
    }
  }

  // Utility methods for common calculations
  calculatePresentValue(futureValue, interestRate, periods) {
    return futureValue / Math.pow(1 + interestRate, periods)
  }

  calculateFutureValue(presentValue, interestRate, periods) {
    return presentValue * Math.pow(1 + interestRate, periods)
  }

  calculateAnnuityPresentValue(payment, interestRate, periods) {
    if (interestRate === 0) {
      return payment * periods
    }
    return payment * ((1 - Math.pow(1 + interestRate, -periods)) / interestRate)
  }

  calculateLoanPayment(principal, interestRate, periods) {
    if (interestRate === 0) {
      return principal / periods
    }
    return principal * (interestRate * Math.pow(1 + interestRate, periods)) / (Math.pow(1 + interestRate, periods) - 1)
  }

  calculateCAPMExpectedReturn(riskFreeRate, marketReturn, beta) {
    return riskFreeRate + beta * (marketReturn - riskFreeRate)
  }

  // Format currency
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  // Format percentage
  formatPercentage(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Validate input data
  validateInput(data, requiredFields) {
    const errors = []
    
    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        errors.push(`${field} is required`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Export data to CSV
  exportToCSV(data, filename) {
    const csvContent = this.convertToCSV(data)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Convert data to CSV format
  convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return ''
    }

    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        return typeof value === 'string' ? `"${value}"` : value
      })
      csvRows.push(values.join(','))
    }

    return csvRows.join('\n')
  }

  // Save to localStorage
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      return false
    }
  }

  // Load from localStorage
  loadFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return null
    }
  }

  // Clear localStorage
  clearLocalStorage(key) {
    try {
      if (key) {
        localStorage.removeItem(key)
      } else {
        localStorage.clear()
      }
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }
}

// Create and export a singleton instance
const businessToolsService = new BusinessToolsService()
export default businessToolsService
