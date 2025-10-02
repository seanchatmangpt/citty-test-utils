/**
 * @fileoverview Input validation utilities for command options
 * @description Validates and sanitizes user inputs to prevent crashes and security issues
 */

import { existsSync, statSync } from 'fs'
import { resolve } from 'path'
import { isSafePath, isFile, isDirectory } from './file-utils.js'

/**
 * Validation error class with field tracking
 */
export class ValidationError extends Error {
  constructor(message, field, value) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.value = value
  }
}

/**
 * Validation result class
 */
class ValidationResult {
  constructor() {
    this.errors = []
    this.warnings = []
  }

  addError(message, field, value) {
    this.errors.push(new ValidationError(message, field, value))
  }

  addWarning(message, field) {
    this.warnings.push({ message, field })
  }

  isValid() {
    return this.errors.length === 0
  }

  getErrorMessage() {
    if (this.errors.length === 0) return null
    return `Validation failed:\n${this.errors.map((e) => `  - ${e.message}`).join('\n')}`
  }

  throwIfInvalid() {
    if (!this.isValid()) {
      const error = new ValidationError(this.getErrorMessage(), 'options')
      error.errors = this.errors
      throw error
    }
  }
}

/**
 * Validate file path exists and is accessible
 * @param {string} path - Path to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateFilePath(path, options = {}) {
  const {
    fieldName = 'path',
    required = true,
    mustExist = true,
    mustBeFile = true,
    checkSafety = true,
  } = options

  const result = new ValidationResult()

  // Check required
  if (!path) {
    if (required) {
      result.addError(`${fieldName} is required`, fieldName, path)
    }
    return result
  }

  // Validate type
  if (typeof path !== 'string') {
    result.addError(`${fieldName} must be a string`, fieldName, path)
    return result
  }

  // Resolve path
  let resolvedPath
  try {
    resolvedPath = resolve(path)
  } catch (error) {
    result.addError(`${fieldName} is invalid: ${error.message}`, fieldName, path)
    return result
  }

  // Check safety (path traversal)
  if (checkSafety && !isSafePath(resolvedPath)) {
    result.addError(
      `${fieldName} is outside project directory: ${resolvedPath}`,
      fieldName,
      path
    )
    return result
  }

  // Check existence
  if (mustExist) {
    if (!existsSync(resolvedPath)) {
      result.addError(`${fieldName} not found: ${resolvedPath}`, fieldName, path)
      return result
    }

    // Check file type
    try {
      const stats = statSync(resolvedPath)

      if (mustBeFile && !stats.isFile()) {
        result.addError(`${fieldName} is not a file: ${resolvedPath}`, fieldName, path)
      }
    } catch (error) {
      if (error.code === 'EACCES') {
        result.addError(`${fieldName} permission denied: ${resolvedPath}`, fieldName, path)
      } else {
        result.addError(
          `${fieldName} cannot be accessed: ${error.message}`,
          fieldName,
          path
        )
      }
    }
  }

  return result
}

/**
 * Validate directory path
 * @param {string} path - Path to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateDirectoryPath(path, options = {}) {
  const {
    fieldName = 'directory',
    required = true,
    mustExist = true,
    checkSafety = true,
  } = options

  const result = new ValidationResult()

  // Check required
  if (!path) {
    if (required) {
      result.addError(`${fieldName} is required`, fieldName, path)
    }
    return result
  }

  // Validate type
  if (typeof path !== 'string') {
    result.addError(`${fieldName} must be a string`, fieldName, path)
    return result
  }

  // Resolve path
  let resolvedPath
  try {
    resolvedPath = resolve(path)
  } catch (error) {
    result.addError(`${fieldName} is invalid: ${error.message}`, fieldName, path)
    return result
  }

  // Check safety
  if (checkSafety && !isSafePath(resolvedPath)) {
    result.addError(
      `${fieldName} is outside project directory: ${resolvedPath}`,
      fieldName,
      path
    )
    return result
  }

  // Check existence
  if (mustExist) {
    if (!existsSync(resolvedPath)) {
      result.addError(`${fieldName} not found: ${resolvedPath}`, fieldName, path)
      return result
    }

    // Check is directory
    try {
      const stats = statSync(resolvedPath)
      if (!stats.isDirectory()) {
        result.addError(`${fieldName} is not a directory: ${resolvedPath}`, fieldName, path)
      }
    } catch (error) {
      if (error.code === 'EACCES') {
        result.addError(`${fieldName} permission denied: ${resolvedPath}`, fieldName, path)
      } else {
        result.addError(
          `${fieldName} cannot be accessed: ${error.message}`,
          fieldName,
          path
        )
      }
    }
  }

  return result
}

/**
 * Validate regex pattern
 * @param {string} pattern - Pattern to validate
 * @param {string} fieldName - Field name for error messages
 * @returns {Object} Validation result
 */
function validatePattern(pattern, fieldName = 'pattern') {
  const result = new ValidationResult()

  if (!pattern || typeof pattern !== 'string') {
    result.addError(`${fieldName} must be a non-empty string`, fieldName, pattern)
    return result
  }

  try {
    new RegExp(pattern)
  } catch (error) {
    result.addError(`${fieldName} is invalid regex: ${error.message}`, fieldName, pattern)
  }

  return result
}

/**
 * Validate analyze command options
 * @param {Object} options - Command options
 * @param {string} options.cliPath - Path to CLI file
 * @param {string} options.testDir - Path to test directory
 * @param {Array<string>} options.includePatterns - Patterns to include
 * @param {Array<string>} options.excludePatterns - Patterns to exclude
 * @throws {ValidationError} If validation fails
 * @returns {boolean} True if valid
 */
export function validateAnalyzeOptions(options) {
  const result = new ValidationResult()

  // Validate options object
  if (!options || typeof options !== 'object') {
    result.addError('Options must be an object', 'options', options)
    result.throwIfInvalid()
  }

  // Validate cliPath
  const cliPathResult = validateFilePath(options.cliPath, {
    fieldName: 'cliPath',
    required: true,
    mustExist: true,
    mustBeFile: true,
    checkSafety: true,
  })
  result.errors.push(...cliPathResult.errors)
  result.warnings.push(...cliPathResult.warnings)

  // Validate testDir
  const testDirResult = validateDirectoryPath(options.testDir, {
    fieldName: 'testDir',
    required: true,
    mustExist: true,
    checkSafety: true,
  })
  result.errors.push(...testDirResult.errors)
  result.warnings.push(...testDirResult.warnings)

  // Validate includePatterns
  if (options.includePatterns) {
    if (!Array.isArray(options.includePatterns)) {
      result.addError(
        'includePatterns must be an array',
        'includePatterns',
        options.includePatterns
      )
    } else {
      for (const pattern of options.includePatterns) {
        const patternResult = validatePattern(pattern, 'includePattern')
        result.errors.push(...patternResult.errors)
      }
    }
  }

  // Validate excludePatterns
  if (options.excludePatterns) {
    if (!Array.isArray(options.excludePatterns)) {
      result.addError(
        'excludePatterns must be an array',
        'excludePatterns',
        options.excludePatterns
      )
    } else {
      for (const pattern of options.excludePatterns) {
        const patternResult = validatePattern(pattern, 'excludePattern')
        result.errors.push(...patternResult.errors)
      }
    }
  }

  // Validate format
  if (options.format) {
    const validFormats = ['text', 'json', 'turtle']
    if (!validFormats.includes(options.format)) {
      result.addError(
        `format must be one of: ${validFormats.join(', ')}`,
        'format',
        options.format
      )
    }
  }

  // Throw if invalid
  result.throwIfInvalid()

  return true
}

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized input
 */
export function sanitizeString(input, options = {}) {
  const { maxLength = 1000, allowedChars = /^[a-zA-Z0-9._\-/]+$/ } = options

  if (!input || typeof input !== 'string') {
    return ''
  }

  // Trim and truncate
  let sanitized = input.trim().slice(0, maxLength)

  // Remove dangerous characters
  if (allowedChars) {
    if (!allowedChars.test(sanitized)) {
      sanitized = sanitized.replace(/[^a-zA-Z0-9._\-/]/g, '')
    }
  }

  return sanitized
}

/**
 * Validate and sanitize command line arguments
 * @param {Array<string>} args - Arguments to validate
 * @returns {Array<string>} Sanitized arguments
 */
export function sanitizeCommandArgs(args) {
  if (!Array.isArray(args)) {
    throw new ValidationError('Arguments must be an array', 'args', args)
  }

  return args.map((arg) => {
    if (typeof arg !== 'string') {
      throw new ValidationError('All arguments must be strings', 'args', arg)
    }

    // Prevent shell metacharacters
    if (/[;&|`$(){}[\]<>]/.test(arg)) {
      throw new ValidationError('Argument contains shell metacharacters', 'args', arg)
    }

    return arg
  })
}
