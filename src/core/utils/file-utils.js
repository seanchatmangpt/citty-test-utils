/**
 * @fileoverview Safe file system utilities with comprehensive error handling
 * @description Provides defensive file operations with graceful degradation
 */

import { readFileSync, existsSync, statSync } from 'fs'
import { resolve, dirname } from 'path'

/**
 * Custom error classes for specific failure types
 */
export class FileNotFoundError extends Error {
  constructor(path) {
    super(`File not found: ${path}`)
    this.name = 'FileNotFoundError'
    this.code = 'ENOENT'
    this.path = path
  }
}

export class PermissionError extends Error {
  constructor(path) {
    super(`Permission denied: ${path}`)
    this.name = 'PermissionError'
    this.code = 'EACCES'
    this.path = path
  }
}

export class FileTooLargeError extends Error {
  constructor(path, size, maxSize) {
    super(`File too large: ${path} (${size} > ${maxSize} bytes)`)
    this.name = 'FileTooLargeError'
    this.size = size
    this.maxSize = maxSize
    this.path = path
  }
}

export class InvalidPathError extends Error {
  constructor(path, reason) {
    super(`Invalid path: ${path} - ${reason}`)
    this.name = 'InvalidPathError'
    this.path = path
    this.reason = reason
  }
}

/**
 * Safely read file with comprehensive error handling
 * @param {string} filePath - Path to file
 * @param {Object} options - Read options
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @param {number} options.maxSize - Maximum file size in bytes (default: 10MB)
 * @param {boolean} options.throwOnError - Throw errors instead of returning null
 * @param {boolean} options.verbose - Enable verbose logging
 * @returns {string|null} File content or null on error
 */
export function safeReadFile(filePath, options = {}) {
  const {
    encoding = 'utf8',
    maxSize = 10 * 1024 * 1024, // 10MB default
    throwOnError = false,
    verbose = false,
  } = options

  try {
    // Validate input
    if (!filePath || typeof filePath !== 'string') {
      const error = new InvalidPathError(filePath, 'Path must be a non-empty string')
      if (throwOnError) throw error
      if (verbose) console.warn(`⚠️ ${error.message}`)
      return null
    }

    // Resolve path to prevent traversal
    const resolvedPath = resolve(filePath)

    // Check existence
    if (!existsSync(resolvedPath)) {
      const error = new FileNotFoundError(resolvedPath)
      if (throwOnError) throw error
      if (verbose) console.warn(`⚠️ ${error.message}`)
      return null
    }

    // Check file stats
    let stats
    try {
      stats = statSync(resolvedPath)
    } catch (error) {
      if (error.code === 'EACCES') {
        const permError = new PermissionError(resolvedPath)
        if (throwOnError) throw permError
        if (verbose) console.warn(`⚠️ ${permError.message}`)
        return null
      }
      throw error
    }

    // Check if it's a file
    if (!stats.isFile()) {
      const error = new InvalidPathError(resolvedPath, 'Not a regular file')
      if (throwOnError) throw error
      if (verbose) console.warn(`⚠️ ${error.message}`)
      return null
    }

    // Check file size
    if (stats.size > maxSize) {
      const error = new FileTooLargeError(resolvedPath, stats.size, maxSize)
      if (throwOnError) throw error
      if (verbose) console.warn(`⚠️ ${error.message}`)
      return null
    }

    // Check if file is empty
    if (stats.size === 0) {
      if (verbose) console.warn(`⚠️ Warning: File is empty: ${resolvedPath}`)
      return ''
    }

    // Read file
    return readFileSync(resolvedPath, encoding)
  } catch (error) {
    // Handle specific error codes
    if (error.code === 'EACCES') {
      const permError = new PermissionError(filePath)
      if (throwOnError) throw permError
      if (verbose) console.warn(`⚠️ ${permError.message}`)
      return null
    }

    if (error.code === 'ELOOP') {
      const loopError = new InvalidPathError(filePath, 'Circular symlink detected')
      if (throwOnError) throw loopError
      if (verbose) console.warn(`⚠️ ${loopError.message}`)
      return null
    }

    if (error.code === 'ENAMETOOLONG') {
      const nameError = new InvalidPathError(filePath, 'Path name too long')
      if (throwOnError) throw nameError
      if (verbose) console.warn(`⚠️ ${nameError.message}`)
      return null
    }

    // Re-throw custom errors
    if (
      error instanceof FileNotFoundError ||
      error instanceof PermissionError ||
      error instanceof FileTooLargeError ||
      error instanceof InvalidPathError
    ) {
      if (throwOnError) throw error
      if (verbose) console.warn(`⚠️ ${error.message}`)
      return null
    }

    // Generic error
    if (throwOnError) throw error
    if (verbose) console.warn(`⚠️ Error reading ${filePath}: ${error.message}`)
    return null
  }
}

/**
 * Validate path is safe (no traversal outside project)
 * @param {string} path - Path to validate
 * @param {string} basePath - Base path to restrict to (default: cwd)
 * @returns {boolean} True if safe
 */
export function isSafePath(path, basePath = process.cwd()) {
  try {
    const resolved = resolve(path)
    const base = resolve(basePath)
    return resolved.startsWith(base)
  } catch {
    return false
  }
}

/**
 * Safely check if path exists
 * @param {string} path - Path to check
 * @returns {boolean} True if exists
 */
export function safeExists(path) {
  try {
    return existsSync(path)
  } catch {
    return false
  }
}

/**
 * Safely get file stats
 * @param {string} path - Path to file
 * @returns {Object|null} File stats or null on error
 */
export function safeStatSync(path) {
  try {
    return statSync(path)
  } catch {
    return null
  }
}

/**
 * Check if path is a file
 * @param {string} path - Path to check
 * @returns {boolean} True if path is a file
 */
export function isFile(path) {
  const stats = safeStatSync(path)
  return stats ? stats.isFile() : false
}

/**
 * Check if path is a directory
 * @param {string} path - Path to check
 * @returns {boolean} True if path is a directory
 */
export function isDirectory(path) {
  const stats = safeStatSync(path)
  return stats ? stats.isDirectory() : false
}

/**
 * Retry file operation with exponential backoff
 * @param {Function} operation - Operation to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Operation result
 */
export async function retryFileOperation(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000,
    backoffFactor = 2,
    verbose = false,
  } = options

  let lastError
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry on permanent errors
      if (
        error instanceof FileNotFoundError ||
        error instanceof PermissionError ||
        error instanceof InvalidPathError
      ) {
        throw error
      }

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Log retry attempt
      if (verbose) {
        console.warn(`⚠️ Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`)
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Increase delay for next attempt
      delay = Math.min(delay * backoffFactor, maxDelay)
    }
  }

  // All retries exhausted
  throw lastError
}
