/**
 * Validation utilities for Universal Dimensions Template
 * Handles unique code validation, field validation, and data integrity
 */

/**
 * Validate unique code across hierarchies and elements
 * @param {string} code - The code to validate
 * @param {Array} existingItems - Array of existing items with codes
 * @param {string} currentId - Current item ID (for updates)
 * @returns {Object} Validation result
 */
export const validateUniqueCode = (code, existingItems, currentId = null) => {
  if (!code || code.trim() === '') {
    return {
      isValid: false,
      message: 'Code is required'
    }
  }

  // Check for duplicates
  const duplicate = existingItems.find(item => 
    (item.code === code || item.entity_code === code) && item.id !== currentId
  )

  if (duplicate) {
    return {
      isValid: false,
      message: `Code "${code}" already exists`
    }
  }

  // Check format (alphanumeric with optional underscores/hyphens)
  const codePattern = /^[A-Z0-9][A-Z0-9_-]*[A-Z0-9]$|^[A-Z0-9]$/
  if (!codePattern.test(code)) {
    return {
      isValid: false,
      message: 'Code must be alphanumeric, start and end with letter/number, and can contain underscores or hyphens'
    }
  }

  return {
    isValid: true,
    message: 'Code is valid'
  }
}

/**
 * Validate custom field value based on field configuration
 * @param {any} value - The value to validate
 * @param {Object} fieldConfig - Field configuration object
 * @returns {Object} Validation result
 */
export const validateCustomField = (value, fieldConfig) => {
  const { type, required, unique, options } = fieldConfig

  // Check required validation
  if (required && (!value || value.toString().trim() === '')) {
    return {
      isValid: false,
      message: `${fieldConfig.name} is required`
    }
  }

  // Skip validation if value is empty and not required
  if (!value || value.toString().trim() === '') {
    return {
      isValid: true,
      message: 'Value is valid'
    }
  }

  // Type-specific validation
  switch (type) {
    case 'text':
      if (typeof value !== 'string') {
        return {
          isValid: false,
          message: 'Value must be text'
        }
      }
      break

    case 'number':
      if (isNaN(Number(value))) {
        return {
          isValid: false,
          message: 'Value must be a number'
        }
      }
      break

    case 'select':
      if (options && !options.includes(value)) {
        return {
          isValid: false,
          message: `Value must be one of: ${options.join(', ')}`
        }
      }
      break

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return {
          isValid: false,
          message: 'Value must be true or false'
        }
      }
      break

    case 'date':
      if (isNaN(Date.parse(value))) {
        return {
          isValid: false,
          message: 'Value must be a valid date'
        }
      }
      break

    case 'sql_query':
      // Basic SQL validation (can be enhanced)
      if (typeof value !== 'string' || !value.toLowerCase().includes('select')) {
        return {
          isValid: false,
          message: 'Value must be a valid SELECT query'
        }
      }
      break

    default:
      break
  }

  return {
    isValid: true,
    message: 'Value is valid'
  }
}

/**
 * Validate entity data before save
 * @param {Object} entityData - Entity data to validate
 * @param {Array} existingEntities - Existing entities for uniqueness check
 * @param {Array} customFields - Custom field configurations
 * @returns {Object} Validation result
 */
export const validateEntityData = (entityData, existingEntities, customFields = []) => {
  const errors = []

  // Validate required fields
  if (!entityData.entity_name || entityData.entity_name.trim() === '') {
    errors.push('Entity name is required')
  }

  if (!entityData.entity_code || entityData.entity_code.trim() === '') {
    errors.push('Entity code is required')
  }

  // Validate unique code
  const codeValidation = validateUniqueCode(entityData.entity_code, existingEntities, entityData.id)
  if (!codeValidation.isValid) {
    errors.push(codeValidation.message)
  }

  // Validate custom fields
  customFields.forEach(field => {
    const value = entityData[field.name]
    const fieldValidation = validateCustomField(value, field)
    if (!fieldValidation.isValid) {
      errors.push(fieldValidation.message)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length === 0 ? 'Entity data is valid' : 'Please fix the following errors'
  }
}

/**
 * Validate hierarchy data before save
 * @param {Object} hierarchyData - Hierarchy data to validate
 * @param {Array} existingHierarchies - Existing hierarchies for uniqueness check
 * @param {Array} customFields - Custom field configurations
 * @returns {Object} Validation result
 */
export const validateHierarchyData = (hierarchyData, existingHierarchies, customFields = []) => {
  const errors = []

  // Validate required fields
  if (!hierarchyData.name || hierarchyData.name.trim() === '') {
    errors.push('Name is required')
  }

  if (!hierarchyData.code || hierarchyData.code.trim() === '') {
    errors.push('Code is required')
  }

  // Validate unique code
  const codeValidation = validateUniqueCode(hierarchyData.code, existingHierarchies, hierarchyData.id)
  if (!codeValidation.isValid) {
    errors.push(codeValidation.message)
  }

  // Validate custom fields
  customFields.forEach(field => {
    const value = hierarchyData[field.name]
    const fieldValidation = validateCustomField(value, field)
    if (!fieldValidation.isValid) {
      errors.push(fieldValidation.message)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length === 0 ? 'Hierarchy data is valid' : 'Please fix the following errors'
  }
}

/**
 * Generate unique code suggestion
 * @param {string} baseName - Base name to generate code from
 * @param {Array} existingItems - Existing items to avoid duplicates
 * @returns {string} Suggested unique code
 */
export const generateUniqueCode = (baseName, existingItems) => {
  if (!baseName) return ''

  // Convert to uppercase and replace spaces/special chars with underscores
  let baseCode = baseName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  // Ensure it starts and ends with alphanumeric
  if (!/^[A-Z0-9]/.test(baseCode)) {
    baseCode = 'A' + baseCode
  }
  if (!/[A-Z0-9]$/.test(baseCode)) {
    baseCode = baseCode + '1'
  }

  // Check if base code is unique
  const existingCodes = existingItems.map(item => item.code || item.entity_code)
  if (!existingCodes.includes(baseCode)) {
    return baseCode
  }

  // Add number suffix
  let counter = 1
  let suggestedCode = baseCode + '_' + counter
  while (existingCodes.includes(suggestedCode)) {
    counter++
    suggestedCode = baseCode + '_' + counter
  }

  return suggestedCode
}

/**
 * Sanitize input data
 * @param {any} value - Value to sanitize
 * @param {string} type - Data type
 * @returns {any} Sanitized value
 */
export const sanitizeInput = (value, type = 'text') => {
  if (value === null || value === undefined) {
    return ''
  }

  switch (type) {
    case 'text':
      return value.toString().trim()
    
    case 'number':
      const num = Number(value)
      return isNaN(num) ? 0 : num
    
    case 'boolean':
      if (typeof value === 'boolean') return value
      return value === 'true' || value === '1' || value === 1
    
    case 'date':
      const date = new Date(value)
      return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
    
    default:
      return value.toString().trim()
  }
}
