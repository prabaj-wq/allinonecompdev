import { useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import auditLogger from '../services/auditLogger'

// Hook for automatic audit logging of all user actions
export const useAuditLogging = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Log page navigation automatically
  useEffect(() => {
    const pageName = location.pathname.split('/').pop() || 'home'
    const pageTitle = document.title
    
    auditLogger.logPageNavigation(pageName, {
      description: `User navigated to ${pageTitle}`,
      changes: {
        from: location.pathname,
        to: location.pathname,
        page_title: pageTitle,
        url: window.location.href
      }
    }, {
      entity: 'System',
      status: 'Completed'
    })
  }, [location.pathname])

  // Log form submissions
  const logFormSubmission = useCallback((formName, formData, context = {}) => {
    auditLogger.logFormSubmission(formName, {
      description: `Form submitted: ${formName}`,
      changes: {
        form_name: formName,
        form_data: formData,
        submission_time: new Date().toISOString()
      }
    }, {
      ...context,
      entity: context.entity || 'System',
      status: 'Completed'
    })
  }, [])

  // Log data modifications
  const logDataModification = useCallback((operation, data, context = {}) => {
    auditLogger.logDataModification(operation, {
      description: `Data ${operation} performed`,
      changes: {
        operation: operation,
        data_summary: typeof data === 'object' ? Object.keys(data) : data,
        modification_time: new Date().toISOString()
      }
    }, {
      ...context,
      entity: context.entity || 'System',
      status: 'Completed'
    })
  }, [])

  // Log file operations
  const logFileOperation = useCallback((operation, fileInfo, context = {}) => {
    auditLogger.logFileOperation(operation, {
      description: `File ${operation} performed`,
      changes: {
        operation: operation,
        file_name: fileInfo.name,
        file_size: fileInfo.size,
        file_type: fileInfo.type,
        operation_time: new Date().toISOString()
      }
    }, {
      ...context,
      entity: context.entity || 'System',
      status: 'Completed'
    })
  }, [])

  // Log user actions
  const logUserAction = useCallback((action, details = {}, context = {}) => {
    auditLogger.log(action, {
      description: details.description || action,
      changes: details.changes || {},
      amount: details.amount || 0
    }, {
      ...context,
      entity: context.entity || 'System',
      status: context.status || 'Completed'
    })
  }, [])

  // Log errors
  const logError = useCallback((action, error, context = {}) => {
    auditLogger.logError(action, error, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Log warnings
  const logWarning = useCallback((action, details = {}, context = {}) => {
    auditLogger.logWarning(action, details, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Log info
  const logInfo = useCallback((action, details = {}, context = {}) => {
    auditLogger.logInfo(action, details, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Log consolidation actions
  const logConsolidation = useCallback((action, details = {}, context = {}) => {
    auditLogger.logConsolidation(action, details, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Log financial statement actions
  const logFinancialStatement = useCallback((action, details = {}, context = {}) => {
    auditLogger.logFinancialStatement(action, details, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Log trial balance actions
  const logTrialBalance = useCallback((action, details = {}, context = {}) => {
    auditLogger.logTrialBalance(action, details, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Log entity management actions
  const logEntityManagement = useCallback((action, details = {}, context = {}) => {
    auditLogger.logEntityManagement(action, details, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Log account management actions
  const logAccountManagement = useCallback((action, details = {}, context = {}) => {
    auditLogger.logAccountManagement(action, details, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Log audit materiality actions
  const logAuditMateriality = useCallback((action, details = {}, context = {}) => {
    auditLogger.logAuditMateriality(action, details, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Log authentication actions
  const logAuthentication = useCallback((action, details = {}, context = {}) => {
    auditLogger.logAuthentication(action, details, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Log data operations
  const logDataOperation = useCallback((action, details = {}, context = {}) => {
    auditLogger.logDataOperation(action, details, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Log system configuration changes
  const logSystemConfig = useCallback((action, details = {}, context = {}) => {
    auditLogger.logSystemConfig(action, details, {
      ...context,
      entity: context.entity || 'System'
    })
  }, [])

  // Force save current logs
  const forceSave = useCallback(async () => {
    await auditLogger.forceSave()
  }, [])

  // Get log file path
  const getLogFilePath = useCallback(() => {
    return auditLogger.getLogFilePath()
  }, [])

  return {
    // Automatic logging functions
    logFormSubmission,
    logDataModification,
    logFileOperation,
    logUserAction,
    
    // Specific logging functions
    logError,
    logWarning,
    logInfo,
    logConsolidation,
    logFinancialStatement,
    logTrialBalance,
    logEntityManagement,
    logAccountManagement,
    logAuditMateriality,
    logAuthentication,
    logDataOperation,
    logSystemConfig,
    
    // Utility functions
    forceSave,
    getLogFilePath
  }
}

// Higher-order component for automatic audit logging
export const withAuditLogging = (WrappedComponent) => {
  return function WithAuditLoggingComponent(props) {
    const auditLogging = useAuditLogging()
    
    // Add audit logging to the wrapped component
    const enhancedProps = {
      ...props,
      auditLogging
    }
    
    return <WrappedComponent {...enhancedProps} />
  }
}

// Hook for logging specific user interactions
export const useUserInteractionLogging = () => {
  const { logUserAction, logFormSubmission, logDataModification } = useAuditLogging()

  // Log button clicks
  const logButtonClick = useCallback((buttonName, context = {}) => {
    logUserAction(`Button Clicked: ${buttonName}`, {
      description: `User clicked ${buttonName} button`,
      changes: {
        button_name: buttonName,
        click_time: new Date().toISOString(),
        page: window.location.pathname
      }
    }, context)
  }, [logUserAction])

  // Log link clicks
  const logLinkClick = useCallback((linkName, linkUrl, context = {}) => {
    logUserAction(`Link Clicked: ${linkName}`, {
      description: `User clicked ${linkName} link`,
      changes: {
        link_name: linkName,
        link_url: linkUrl,
        click_time: new Date().toISOString(),
        page: window.location.pathname
      }
    }, context)
  }, [logUserAction])

  // Log dropdown selections
  const logDropdownSelection = useCallback((dropdownName, selectedValue, context = {}) => {
    logUserAction(`Dropdown Selection: ${dropdownName}`, {
      description: `User selected ${selectedValue} from ${dropdownName} dropdown`,
      changes: {
        dropdown_name: dropdownName,
        selected_value: selectedValue,
        selection_time: new Date().toISOString(),
        page: window.location.pathname
      }
    }, context)
  }, [logUserAction])

  // Log search queries
  const logSearchQuery = useCallback((searchTerm, resultsCount, context = {}) => {
    logUserAction(`Search Query: ${searchTerm}`, {
      description: `User searched for "${searchTerm}"`,
      changes: {
        search_term: searchTerm,
        results_count: resultsCount,
        search_time: new Date().toISOString(),
        page: window.location.pathname
      }
    }, context)
  }, [logUserAction])

  // Log filter changes
  const logFilterChange = useCallback((filterName, filterValue, context = {}) => {
    logUserAction(`Filter Changed: ${filterName}`, {
      description: `User changed ${filterName} filter to ${filterValue}`,
      changes: {
        filter_name: filterName,
        filter_value: filterValue,
        change_time: new Date().toISOString(),
        page: window.location.pathname
      }
    }, context)
  }, [logUserAction])

  // Log sorting changes
  const logSortingChange = useCallback((sortBy, sortOrder, context = {}) => {
    logUserAction(`Sorting Changed: ${sortBy}`, {
      description: `User changed sorting to ${sortBy} in ${sortOrder} order`,
      changes: {
        sort_by: sortBy,
        sort_order: sortOrder,
        change_time: new Date().toISOString(),
        page: window.location.pathname
      }
    }, context)
  }, [logUserAction])

  // Log pagination changes
  const logPaginationChange = useCallback((pageNumber, pageSize, context = {}) => {
    logUserAction(`Pagination Changed: Page ${pageNumber}`, {
      description: `User navigated to page ${pageNumber} with ${pageSize} items per page`,
      changes: {
        page_number: pageNumber,
        page_size: pageSize,
        change_time: new Date().toISOString(),
        page: window.location.pathname
      }
    }, context)
  }, [logUserAction])

  // Log export actions
  const logExportAction = useCallback((exportType, exportFormat, recordCount, context = {}) => {
    logUserAction(`Export: ${exportType}`, {
      description: `User exported ${exportType} in ${exportFormat} format`,
      changes: {
        export_type: exportType,
        export_format: exportFormat,
        record_count: recordCount,
        export_time: new Date().toISOString(),
        page: window.location.pathname
      }
    }, context)
  }, [logUserAction])

  // Log import actions
  const logImportAction = useCallback((importType, fileName, recordCount, context = {}) => {
    logUserAction(`Import: ${importType}`, {
      description: `User imported ${importType} from ${fileName}`,
      changes: {
        import_type: importType,
        file_name: fileName,
        record_count: recordCount,
        import_time: new Date().toISOString(),
        page: window.location.pathname
      }
    }, context)
  }, [logUserAction])

  return {
    logButtonClick,
    logLinkClick,
    logDropdownSelection,
    logSearchQuery,
    logFilterChange,
    logSortingChange,
    logPaginationChange,
    logExportAction,
    logImportAction
  }
}

// Hook for logging data operations
export const useDataOperationLogging = () => {
  const { logDataModification, logDataOperation } = useAuditLogging()

  // Log data creation
  const logDataCreation = useCallback((dataType, data, context = {}) => {
    logDataModification('Created', {
      description: `New ${dataType} created`,
      changes: {
        data_type: dataType,
        data_summary: typeof data === 'object' ? Object.keys(data) : data,
        creation_time: new Date().toISOString()
      }
    }, context)
  }, [logDataModification])

  // Log data updates
  const logDataUpdate = useCallback((dataType, dataId, oldData, newData, context = {}) => {
    logDataModification('Updated', {
      description: `${dataType} with ID ${dataId} updated`,
      changes: {
        data_type: dataType,
        data_id: dataId,
        old_data: oldData,
        new_data: newData,
        update_time: new Date().toISOString()
      }
    }, context)
  }, [logDataModification])

  // Log data deletion
  const logDataDeletion = useCallback((dataType, dataId, deletedData, context = {}) => {
    logDataModification('Deleted', {
      description: `${dataType} with ID ${dataId} deleted`,
      changes: {
        data_type: dataType,
        data_id: dataId,
        deleted_data: deletedData,
        deletion_time: new Date().toISOString()
      }
    }, context)
  }, [logDataModification])

  // Log data validation
  const logDataValidation = useCallback((dataType, validationResult, context = {}) => {
    logDataOperation('Validation', {
      description: `${dataType} validation performed`,
      changes: {
        data_type: dataType,
        validation_result: validationResult,
        validation_time: new Date().toISOString()
      }
    }, context)
  }, [logDataOperation])

  // Log data processing
  const logDataProcessing = useCallback((dataType, processType, recordCount, context = {}) => {
    logDataOperation('Processing', {
      description: `${dataType} ${processType} processing completed`,
      changes: {
        data_type: dataType,
        process_type: processType,
        record_count: recordCount,
        processing_time: new Date().toISOString()
      }
    }, context)
  }, [logDataOperation])

  return {
    logDataCreation,
    logDataUpdate,
    logDataDeletion,
    logDataValidation,
    logDataProcessing
  }
}

export default useAuditLogging
