/**
 * @fileoverview Fail-fast file system utilities
 * @description File operations that FAIL IMMEDIATELY on errors with actionable messages
 *
 * PHILOSOPHY:
 * - No graceful recovery - let errors crash with clear messages
 * - No "safe" wrappers that hide failures
 * - No default fallbacks that mask problems
 * - Always provide actionable error messages
 */

import { readFileSync, existsSync, statSync } from 'fs'
import { resolve } from 'path'

/**
 * Custom error classes with actionable messages
 */
export class FileNotFoundError extends Error {
  constructor(path, attemptedPaths = []) {
    const pathList = attemptedPaths.length > 0
      ? attemptedPaths.join('\n  - ')
      : path

    super(
      `File not found: ${path}\n` +
      `\n` +
      `Attempted paths:\n` +
      `  - ${pathList}\n` +
      `\n` +
      `Possible fixes:\n` +
      `  1. Check if the file path is correct\n` +
      `  2. Ensure the file exists: ls -la ${path}\n` +
      `  3. Check current working directory: pwd\n` +
      `  4. Try using an absolute path\n` +
      `  5. Check file permissions: ls -l ${path}\n`
    )
    this.name = 'FileNotFoundError'
    this.code = 'ENOENT'
    this.path = path
    this.attemptedPaths = attemptedPaths
  }
}

export class PermissionError extends Error {
  constructor(path, operation = 'read') {
    super(
      `Permission denied: ${path}\n` +
      `\n` +
      `Operation: ${operation}\n` +
      `\n` +
      `Possible fixes:\n` +
      `  1. Check file permissions: ls -l ${path}\n` +
      `  2. Try running with sudo (if appropriate)\n` +
      `  3. Fix permissions: chmod 644 ${path}\n` +
      `  4. Check file ownership: ls -l ${path}\n` +
      `  5. Ensure you have read access to parent directories\n`
    )
    this.name = 'PermissionError'
    this.code = 'EACCES'
    this.path = path
    this.operation = operation
  }
}

export class FileTooLargeError extends Error {
  constructor(path, size, maxSize) {
    const sizeMB = (size / 1024 / 1024).toFixed(2)
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2)

    super(
      `File too large: ${path}\n` +
      `\n` +
      `File size: ${sizeMB} MB\n` +
      `Maximum allowed: ${maxSizeMB} MB\n` +
      `\n` +
      `Possible fixes:\n` +
      `  1. Increase maxSize option in file read call\n` +
      `  2. Process file in chunks instead of loading entire file\n` +
      `  3. Check if this is the correct file to analyze\n` +
      `  4. Remove or compress unnecessary content\n` +
      `  5. Use streaming API for large files\n`
    )
    this.name = 'FileTooLargeError'
    this.size = size
    this.maxSize = maxSize
    this.path = path
  }
}

export class InvalidPathError extends Error {
  constructor(path, reason, details = null) {
    super(
      `Invalid path: ${path}\n` +
      `\n` +
      `Reason: ${reason}\n` +
      `${details ? `Details: ${details}\n` : ''}` +
      `\n` +
      `Possible fixes:\n` +
      `  1. Ensure path is a non-empty string\n` +
      `  2. Check for invalid characters in path\n` +
      `  3. Avoid path traversal (../) unless intended\n` +
      `  4. Use absolute paths when possible\n` +
      `  5. Verify the path format for your OS\n`
    )
    this.name = 'InvalidPathError'
    this.path = path
    this.reason = reason
    this.details = details
  }
}

export class NotAFileError extends Error {
  constructor(path, actualType) {
    super(
      `Not a regular file: ${path}\n` +
      `\n` +
      `Actual type: ${actualType}\n` +
      `\n` +
      `Possible fixes:\n` +
      `  1. Check if path points to a directory instead of file\n` +
      `  2. Use isDirectory() to check before reading\n` +
      `  3. Verify the path is correct\n` +
      `  4. Check if path is a symlink: ls -la ${path}\n` +
      `  5. Ensure you're using the correct API for the file type\n`
    )
    this.name = 'NotAFileError'
    this.path = path
    this.actualType = actualType
  }
}

/**
 * Read file with FAIL-FAST behavior
 *
 * THROWS immediately on ANY error. NO graceful recovery.
 *
 * @param {string} filePath - Path to file
 * @param {Object} options - Read options
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @param {number} options.maxSize - Maximum file size in bytes (default: 10MB)
 * @returns {string} File content
 * @throws {InvalidPathError} If path is invalid
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {PermissionError} If permission denied
 * @throws {NotAFileError} If path is not a regular file
 * @throws {FileTooLargeError} If file exceeds maxSize
 */
export function readFile(filePath, options = {}) {
  const {
    encoding = 'utf8',
    maxSize = 10 * 1024 * 1024, // 10MB default
  } = options

  // Validate input - FAIL if invalid
  if (!filePath || typeof filePath !== 'string') {
    throw new InvalidPathError(
      filePath,
      'Path must be a non-empty string',
      `Received: ${typeof filePath}`
    )
  }

  // Resolve path
  let resolvedPath
  try {
    resolvedPath = resolve(filePath)
  } catch (error) {
    throw new InvalidPathError(
      filePath,
      'Failed to resolve path',
      error.message
    )
  }

  // Check existence - FAIL if not found
  if (!existsSync(resolvedPath)) {
    throw new FileNotFoundError(resolvedPath, [
      filePath,
      resolvedPath,
      resolve(process.cwd(), filePath),
    ])
  }

  // Get file stats - FAIL on permission error
  let stats
  try {
    stats = statSync(resolvedPath)
  } catch (error) {
    if (error.code === 'EACCES') {
      throw new PermissionError(resolvedPath, 'stat')
    }
    // Re-throw with context
    throw new InvalidPathError(
      resolvedPath,
      'Failed to stat file',
      error.message
    )
  }

  // Check if it's a file - FAIL if not
  if (!stats.isFile()) {
    const actualType = stats.isDirectory() ? 'directory' :
                       stats.isSymbolicLink() ? 'symlink' :
                       stats.isSocket() ? 'socket' :
                       stats.isFIFO() ? 'FIFO' :
                       'unknown'

    throw new NotAFileError(resolvedPath, actualType)
  }

  // Check file size - FAIL if too large
  if (stats.size > maxSize) {
    throw new FileTooLargeError(resolvedPath, stats.size, maxSize)
  }

  // Empty file is allowed (return empty string)
  if (stats.size === 0) {
    return ''
  }

  // Read file - FAIL on any error
  try {
    return readFileSync(resolvedPath, encoding)
  } catch (error) {
    if (error.code === 'EACCES') {
      throw new PermissionError(resolvedPath, 'read')
    }
    if (error.code === 'ELOOP') {
      throw new InvalidPathError(
        resolvedPath,
        'Circular symlink detected',
        'Too many symbolic links'
      )
    }
    if (error.code === 'ENAMETOOLONG') {
      throw new InvalidPathError(
        resolvedPath,
        'Path name too long',
        `Path length: ${resolvedPath.length}`
      )
    }

    // Unknown error - still fail with context
    throw new Error(
      `Failed to read file: ${resolvedPath}\n` +
      `\n` +
      `Error: ${error.message}\n` +
      `Code: ${error.code || 'unknown'}\n` +
      `\n` +
      `Possible fixes:\n` +
      `  1. Check if file is locked by another process\n` +
      `  2. Verify file encoding is correct (current: ${encoding})\n` +
      `  3. Try reading file with different encoding\n` +
      `  4. Check disk space and file system errors\n` +
      `  5. Enable verbose logging for more details\n`
    )
  }
}

/**
 * Validate path is safe (no traversal outside project)
 *
 * @param {string} path - Path to validate
 * @param {string} basePath - Base path to restrict to (default: cwd)
 * @returns {boolean} True if safe
 * @throws {InvalidPathError} If path cannot be resolved
 */
export function isSafePath(path, basePath = process.cwd()) {
  try {
    const resolved = resolve(path)
    const base = resolve(basePath)
    return resolved.startsWith(base)
  } catch (error) {
    throw new InvalidPathError(
      path,
      'Failed to validate path safety',
      error.message
    )
  }
}

/**
 * Check if path exists
 *
 * @param {string} path - Path to check
 * @returns {boolean} True if exists
 * @throws {InvalidPathError} If path is invalid
 */
export function pathExists(path) {
  if (!path || typeof path !== 'string') {
    throw new InvalidPathError(
      path,
      'Path must be a non-empty string',
      `Received: ${typeof path}`
    )
  }

  return existsSync(path)
}

/**
 * Get file stats
 *
 * @param {string} path - Path to file
 * @returns {Object} File stats
 * @throws {InvalidPathError} If path is invalid
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {PermissionError} If permission denied
 */
export function getFileStats(path) {
  if (!path || typeof path !== 'string') {
    throw new InvalidPathError(
      path,
      'Path must be a non-empty string',
      `Received: ${typeof path}`
    )
  }

  try {
    return statSync(path)
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new FileNotFoundError(path)
    }
    if (error.code === 'EACCES') {
      throw new PermissionError(path, 'stat')
    }
    throw new InvalidPathError(
      path,
      'Failed to get file stats',
      error.message
    )
  }
}

/**
 * Check if path is a file
 *
 * @param {string} path - Path to check
 * @returns {boolean} True if path is a file
 * @throws {InvalidPathError} If path is invalid
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {PermissionError} If permission denied
 */
export function isFile(path) {
  const stats = getFileStats(path)
  return stats.isFile()
}

/**
 * Check if path is a directory
 *
 * @param {string} path - Path to check
 * @returns {boolean} True if path is a directory
 * @throws {InvalidPathError} If path is invalid
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {PermissionError} If permission denied
 */
export function isDirectory(path) {
  const stats = getFileStats(path)
  return stats.isDirectory()
}

/**
 * Retry file operation with exponential backoff
 *
 * NOTE: Only retries on TRANSIENT errors (EAGAIN, EBUSY, etc.)
 * NEVER retries on PERMANENT errors (ENOENT, EACCES, etc.)
 *
 * @param {Function} operation - Operation to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Operation result
 * @throws {Error} After all retries exhausted or on permanent error
 */
export async function retryFileOperation(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000,
    backoffFactor = 2,
  } = options

  let lastError
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // NEVER retry permanent errors - fail immediately
      if (
        error instanceof FileNotFoundError ||
        error instanceof PermissionError ||
        error instanceof InvalidPathError ||
        error instanceof NotAFileError ||
        error instanceof FileTooLargeError
      ) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Increase delay for next attempt
      delay = Math.min(delay * backoffFactor, maxDelay)
    }
  }

  // All retries exhausted - fail with context
  throw new Error(
    `File operation failed after ${maxRetries + 1} attempts\n` +
    `\n` +
    `Last error: ${lastError.message}\n` +
    `\n` +
    `Possible fixes:\n` +
    `  1. Check if file is locked by another process\n` +
    `  2. Increase retry count or delay\n` +
    `  3. Verify file system is functioning correctly\n` +
    `  4. Check for disk space or quota issues\n` +
    `  5. Enable verbose logging to see all retry attempts\n`
  )
}

// Export all error types for specific error handling
export const ErrorTypes = {
  FileNotFoundError,
  PermissionError,
  FileTooLargeError,
  InvalidPathError,
  NotAFileError,
}
