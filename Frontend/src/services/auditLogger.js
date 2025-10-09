import { pythonServices } from './pythonIntegration'

class AuditLogger {
  constructor() {
    this.isEnabled = true
    this.logBuffer = []
    this.bufferSize = 5 // Reduced for more frequent saves
    this.flushInterval = 3000 // 3 seconds for more frequent saves
    this.setupAutoFlush()
    this.initializeLogFile()
  }

  // Enable/disable audit logging
  enable() {
    this.isEnabled = true
    console.log('Audit logging enabled')
  }

  disable() {
    this.isEnabled = false
    console.log('Audit logging disabled')
  }

  // Initialize log file structure
  async initializeLogFile() {
    try {
      // Create the audit logs folder and initial CSV structure
      const companyName = this.getCurrentCompany()
      await pythonServices.initializeAuditLogs(companyName)
    } catch (error) {
      console.error('Failed to initialize audit logs:', error)
    }
  }

  // Log an audit event - this is called for EVERY user action
  log(action, details = {}, context = {}) {
    if (!this.isEnabled) return

    const auditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      user: this.getCurrentUser(),
      action: action,
      module: context.module || 'Unknown',
      entity: context.entity || 'System',
      status: context.status || 'Completed',
      details: details.description || action,
      changes: details.changes || {},
      ip_address: this.getClientIP(),
      amount: details.amount || 0,
      session_id: this.getSessionId(),
      user_agent: navigator.userAgent,
      url: window.location.href,
      method: context.method || 'GET',
      response_time: context.responseTime || 0,
      error_message: context.error || null,
      severity: context.severity || 'info',
      company: this.getCurrentCompany(),
      page_title: document.title,
      browser_info: this.getBrowserInfo(),
      screen_resolution: this.getScreenResolution(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }

    // Add to buffer
    this.logBuffer.push(auditEntry)

    // Flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      this.flush()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Audit Log:', auditEntry)
    }

    return auditEntry
  }

  // Log consolidation-related actions
  logConsolidation(action, details = {}, context = {}) {
    return this.log(action, details, {
      ...context,
      module: 'Consolidation',
      severity: 'high'
    })
  }

  // Log financial statement actions
  logFinancialStatement(action, details = {}, context = {}) {
    return this.log(action, details, {
      ...context,
      module: 'Financial Statements',
      severity: 'high'
    })
  }

  // Log trial balance actions
  logTrialBalance(action, details = {}, context = {}) {
    return this.log(action, details, {
      ...context,
      module: 'Trial Balance',
      severity: 'medium'
    })
  }

  // Log entity management actions
  logEntityManagement(action, details = {}, context = {}) {
    return this.log(action, details, {
      ...context,
      module: 'Entity Management',
      severity: 'medium'
    })
  }

  // Log account management actions
  logAccountManagement(action, details = {}, context = {}) {
    return this.log(action, details, {
      ...context,
      module: 'Account Management',
      severity: 'medium'
    })
  }

  // Log audit materiality actions
  logAuditMateriality(action, details = {}, context = {}) {
    return this.log(action, details, {
      ...context,
      module: 'Audit Materiality',
      severity: 'high'
    })
  }

  // Log user authentication actions
  logAuthentication(action, details = {}, context = {}) {
    return this.log(action, details, {
      ...context,
      module: 'Authentication',
      severity: 'critical'
    })
  }

  // Log data import/export actions
  logDataOperation(action, details = {}, context = {}) {
    return this.log(action, details, {
      ...context,
      module: 'Data Operations',
      severity: 'high'
    })
  }

  // Log system configuration changes
  logSystemConfig(action, details = {}, context = {}) {
    return this.log(action, details, {
      ...context,
      module: 'System Configuration',
      severity: 'high'
    })
  }

  // Log page navigation
  logPageNavigation(page, details = {}, context = {}) {
    return this.log(`Page Navigation: ${page}`, details, {
      ...context,
      module: 'Navigation',
      severity: 'low'
    })
  }

  // Log form submissions
  logFormSubmission(form, details = {}, context = {}) {
    return this.log(`Form Submitted: ${form}`, details, {
      ...context,
      module: 'Forms',
      severity: 'medium'
    })
  }

  // Log data modifications
  logDataModification(operation, details = {}, context = {}) {
    return this.log(`Data ${operation}`, details, {
      ...context,
      module: 'Data Management',
      severity: 'high'
    })
  }

  // Log file operations
  logFileOperation(operation, details = {}, context = {}) {
    return this.log(`File ${operation}`, details, {
      ...context,
      module: 'File Operations',
      severity: 'medium'
    })
  }

  // Log error events
  logError(action, error, context = {}) {
    return this.log(action, {
      description: error.message || error,
      changes: { error: true, stack: error.stack }
    }, {
      ...context,
      status: 'Failed',
      severity: 'critical',
      error: error.message || error
    })
  }

  // Log warning events
  logWarning(action, details = {}, context = {}) {
    return this.log(action, details, {
      ...context,
      status: 'Warning',
      severity: 'warning'
    })
  }

  // Log info events
  logInfo(action, details = {}, context = {}) {
    return this.log(action, details, {
      ...context,
      status: 'Info',
      severity: 'info'
    })
  }

  // Flush buffered logs to backend CSV file
  async flush() {
    if (this.logBuffer.length === 0) return

    try {
      const logsToSend = [...this.logBuffer]
      this.logBuffer = []

      // Get current company name
      const companyName = this.getCurrentCompany()
      
      // Send to Python backend to save to CSV
      await pythonServices.logAuditTrail(logsToSend, companyName)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📤 Flushed ${logsToSend.length} audit logs to CSV file`)
      }
    } catch (error) {
      console.error('Failed to flush audit logs:', error)
      // Don't restore logs to prevent infinite loops
      // Also don't fail the main application if audit logging fails
    }
  }

  // Setup automatic flushing
  setupAutoFlush() {
    setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flush()
      }
    }, this.flushInterval)
  }

  // Generate unique ID for audit entries
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Get current user from auth context
  getCurrentUser() {
    try {
      // Try to get from localStorage or sessionStorage
      const user = localStorage.getItem('user') || 
                   sessionStorage.getItem('user') || 
                   'admin' // Default fallback
      
      if (typeof user === 'string') {
        try {
          const parsedUser = JSON.parse(user)
          return parsedUser?.username || 'admin'
        } catch {
          return user || 'admin'
        }
      }
      return 'admin'
    } catch {
      return 'admin' // Default fallback
    }
  }

  // Get current company
  getCurrentCompany() {
    try {
      // Try to get from localStorage with different keys
      const company = localStorage.getItem('selectedCompany') || 
                     localStorage.getItem('currentCompany') || 
                     sessionStorage.getItem('selectedCompany') || 
                     sessionStorage.getItem('currentCompany') || 
                     'FinFusion360' // Default fallback
      return company
    } catch {
      return 'FinFusion360' // Default fallback
    }
  }

  // Get client IP (approximate)
  getClientIP() {
    // In a real application, this would come from the server
    // For now, return a placeholder
    return 'Client IP'
  }

  // Get session ID
  getSessionId() {
    try {
      return sessionStorage.getItem('sessionId') || 
             localStorage.getItem('sessionId') || 
             'Unknown Session'
    } catch {
      return 'Unknown Session'
    }
  }

  // Get browser information
  getBrowserInfo() {
    const ua = navigator.userAgent
    let browser = 'Unknown'
    let version = 'Unknown'

    if (ua.includes('Chrome')) {
      browser = 'Chrome'
      version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox'
      version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
    } else if (ua.includes('Safari')) {
      browser = 'Safari'
      version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown'
    } else if (ua.includes('Edge')) {
      browser = 'Edge'
      version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown'
    }

    return `${browser} ${version}`
  }

  // Get screen resolution
  getScreenResolution() {
    return `${screen.width}x${screen.height}`
  }

  // Get all audit logs
  async getAuditLogs(filters = {}) {
    try {
      const companyName = this.getCurrentCompany()
      const response = await pythonServices.getAuditLogs(companyName)
      return response.data?.logs || []
    } catch (error) {
      console.error('Failed to get audit logs:', error)
      return []
    }
  }

  // Export audit logs
  async exportAuditLogs(filters = {}, format = 'csv') {
    try {
      const logs = await this.getAuditLogs(filters)
      
      if (format === 'csv') {
        return this.exportToCSV(logs)
      } else if (format === 'json') {
        return this.exportToJSON(logs)
      }
      
      throw new Error(`Unsupported export format: ${format}`)
    } catch (error) {
      console.error('Failed to export audit logs:', error)
      throw error
    }
  }

  // Export to CSV format
  exportToCSV(logs) {
    const headers = [
      'ID', 'Timestamp', 'User', 'Action', 'Module', 'Entity', 'Status',
      'Details', 'Amount', 'IP Address', 'Session ID', 'URL', 'Severity',
      'Company', 'Page Title', 'Browser Info', 'Screen Resolution', 'Timezone',
      'Method', 'Response Time', 'Error Message', 'Changes'
    ]

    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.timestamp,
        log.user,
        log.action,
        log.module,
        log.entity,
        log.status,
        `"${log.details || ''}"`,
        log.amount || 0,
        log.ip_address || '',
        log.session_id || '',
        log.url || '',
        log.severity || 'info',
        log.company || '',
        `"${log.page_title || ''}"`,
        `"${log.browser_info || ''}"`,
        log.screen_resolution || '',
        log.timezone || '',
        log.method || '',
        log.response_time || 0,
        `"${log.error_message || ''}"`,
        `"${JSON.stringify(log.changes || {}).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    return csvContent
  }

  // Export to JSON format
  exportToJSON(logs) {
    return JSON.stringify(logs, null, 2)
  }

  // Clear audit logs (admin only)
  async clearAuditLogs() {
    try {
      await pythonServices.clearAuditTrail()
      console.log('Audit logs cleared')
    } catch (error) {
      console.error('Failed to clear audit logs:', error)
      throw error
    }
  }

  // Get audit statistics
  async getAuditStatistics() {
    try {
      const logs = await this.getAuditLogs()
      
      const stats = {
        total: logs.length,
        byModule: {},
        byStatus: {},
        byUser: {},
        bySeverity: {},
        byDate: {},
        byCompany: {},
        recentActivity: logs.slice(0, 10)
      }

      logs.forEach(log => {
        // Count by module
        stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1
        
        // Count by status
        stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1
        
        // Count by user
        stats.byUser[log.user] = (stats.byUser[log.user] || 0) + 1
        
        // Count by severity
        stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1
        
        // Count by company
        stats.byCompany[log.company] = (stats.byCompany[log.company] || 0) + 1
        
        // Count by date
        const date = new Date(log.timestamp).toDateString()
        stats.byDate[date] = (stats.byDate[date] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Failed to get audit statistics:', error)
      return {}
    }
  }

  // Force immediate save of current buffer
  async forceSave() {
    if (this.logBuffer.length > 0) {
      await this.flush()
    }
  }

  // Get log file path for current company
  getLogFilePath() {
    const company = this.getCurrentCompany()
    return `${company}/auditlogs/logs.csv`
  }
}

// Create singleton instance
const auditLogger = new AuditLogger()

// Export the singleton instance
export default auditLogger

// Export individual logging functions for convenience
export const {
  log,
  logConsolidation,
  logFinancialStatement,
  logTrialBalance,
  logEntityManagement,
  logAccountManagement,
  logAuditMateriality,
  logAuthentication,
  logDataOperation,
  logSystemConfig,
  logPageNavigation,
  logFormSubmission,
  logDataModification,
  logFileOperation,
  logError,
  logWarning,
  logInfo,
  forceSave
} = auditLogger

// Export utility functions
export const {
  getAuditLogs,
  exportAuditLogs,
  getAuditStatistics,
  clearAuditLogs,
  getLogFilePath
} = auditLogger
