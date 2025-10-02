// src/core/utils/analysis-report-utils.js
// Shared utilities for analysis command reports - reduces code duplication

import { existsSync } from 'node:fs'

/**
 * Build standardized metadata object for analysis reports
 * Used by discover, coverage, and recommend commands
 *
 * @param {Object} options - Metadata options
 * @param {string} options.cliPath - Path to CLI file
 * @param {string} [options.analysisMethod='AST-based'] - Analysis method used
 * @param {Object} [options.additionalFields={}] - Command-specific fields
 * @returns {Object} Standardized metadata object
 */
export function buildAnalysisMetadata(options) {
  const { cliPath, analysisMethod = 'AST-based', additionalFields = {} } = options

  return {
    generatedAt: new Date().toISOString(),
    cliPath,
    analysisMethod,
    ...additionalFields,
  }
}

/**
 * Validate CLI path exists and show helpful error if not
 * Used by all three analysis commands to provide consistent error messages
 *
 * @param {string} cliPath - Path to validate
 * @param {boolean} [exitOnError=true] - Exit process if validation fails
 * @returns {boolean} True if path exists, false otherwise
 */
export function validateCLIPath(cliPath, exitOnError = true) {
  if (!existsSync(cliPath)) {
    console.error(`❌ CLI file not found: ${cliPath}`)
    console.error('💡 Tip: Run from project root or use --cli-path <path>')
    console.error('📁 Looking for: src/cli.mjs, cli.mjs, or bin/cli.mjs')

    if (exitOnError) {
      process.exit(1)
    }
    return false
  }
  return true
}

/**
 * Format CLI detection metadata for reports
 * Standardizes how detection information is displayed
 *
 * @param {Object|null} detectedCLI - Detection result from SmartCLIDetector
 * @returns {Object|null} Formatted detection metadata or null
 */
export function formatCLIDetection(detectedCLI) {
  if (!detectedCLI) {
    return null
  }

  return {
    method: detectedCLI.detectionMethod,
    confidence: detectedCLI.confidence,
    ...(detectedCLI.packageName && { packageName: detectedCLI.packageName }),
    ...(detectedCLI.searchPath && { searchPath: detectedCLI.searchPath }),
  }
}

/**
 * Build report header text
 * Creates consistent header formatting across all analysis reports
 *
 * @param {string} title - Report title
 * @param {string} [separator='='] - Separator character
 * @param {number} [width=40] - Total width of separator line
 * @returns {string} Formatted header
 */
export function buildReportHeader(title, separator = '=', width = 40) {
  return `${title}\n${separator.repeat(width)}\n`
}

/**
 * Build report footer with metadata
 * Creates consistent footer with generation time and path info
 *
 * @param {Object} metadata - Report metadata
 * @returns {string} Formatted footer text
 */
export function buildReportFooter(metadata) {
  let footer = '\n'

  if (metadata.cliPath) {
    footer += `📄 CLI Path: ${metadata.cliPath}\n`
  }

  if (metadata.generatedAt) {
    footer += `⏰ Generated: ${metadata.generatedAt}\n`
  }

  if (metadata.analysisMethod) {
    footer += `🔍 Method: ${metadata.analysisMethod}\n`
  }

  return footer
}

/**
 * Format error for consistent error reporting
 * Used when analysis operations fail
 *
 * @param {Error} error - The error object
 * @param {Object} context - Additional context (cliPath, command, etc.)
 * @returns {Object} Formatted error object for JSON output
 */
export function formatAnalysisError(error, context = {}) {
  return {
    error: error.message,
    type: error.name || 'AnalysisError',
    timestamp: new Date().toISOString(),
    ...context,
  }
}

/**
 * Merge and deduplicate arrays for recommendations/suggestions
 * Helper for combining multiple analysis results
 *
 * @param {Array} arrays - Arrays to merge
 * @param {string} [uniqueKey='id'] - Key to use for deduplication
 * @returns {Array} Merged and deduplicated array
 */
export function mergeUniqueItems(arrays, uniqueKey = 'id') {
  const seen = new Set()
  const merged = []

  for (const array of arrays) {
    for (const item of array) {
      const key = item[uniqueKey] || JSON.stringify(item)
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(item)
      }
    }
  }

  return merged
}

/**
 * Calculate percentage with safe division
 * Prevents division by zero errors in coverage calculations
 *
 * @param {number} value - Numerator
 * @param {number} total - Denominator
 * @param {number} [decimals=1] - Decimal places to round to
 * @returns {number} Percentage value (0-100)
 */
export function safePercentage(value, total, decimals = 1) {
  if (total === 0) return 0
  const percentage = (value / total) * 100
  return Number(percentage.toFixed(decimals))
}

/**
 * Format file size for human readability
 * Used in analysis reports for LOC and file size metrics
 *
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Get priority emoji for recommendations
 * Provides consistent visual indicators across reports
 *
 * @param {string} priority - Priority level (critical, high, medium, low)
 * @returns {string} Emoji indicator
 */
export function getPriorityEmoji(priority) {
  const emojiMap = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
    info: 'ℹ️',
  }
  return emojiMap[priority?.toLowerCase()] || '⚪'
}

/**
 * Format data as JSON string with pretty printing
 * Used for JSON report generation across all analysis commands
 *
 * @param {any} data - Data to format
 * @param {number} [indent=2] - Indentation spaces
 * @returns {string} Formatted JSON string
 *
 * @example
 * const json = formatAsJSON({ foo: 'bar', count: 42 })
 * // Returns formatted JSON with 2-space indentation
 */
export function formatAsJSON(data, indent = 2) {
  return JSON.stringify(data, null, indent)
}

/**
 * Format data as YAML string (simple implementation)
 * Provides basic YAML formatting for simple data structures
 * For complex YAML needs, consider using a dedicated YAML library
 *
 * @param {Object} data - Data to format as YAML
 * @param {number} [indent=0] - Current indentation level
 * @returns {string} YAML formatted string
 *
 * @example
 * const yaml = formatAsYAML({ name: 'test', count: 42 })
 * // Returns:
 * // name: test
 * // count: 42
 */
export function formatAsYAML(data, indent = 0) {
  const spaces = '  '.repeat(indent)
  const lines = []

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      lines.push(`${spaces}${key}: null`)
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      lines.push(`${spaces}${key}:`)
      lines.push(formatAsYAML(value, indent + 1))
    } else if (Array.isArray(value)) {
      lines.push(`${spaces}${key}:`)
      for (const item of value) {
        if (typeof item === 'object') {
          lines.push(`${spaces}  -`)
          lines.push(formatAsYAML(item, indent + 2))
        } else {
          lines.push(`${spaces}  - ${item}`)
        }
      }
    } else if (typeof value === 'string') {
      // Escape strings with special characters
      const needsQuotes = /[:\n\r]/.test(value)
      const formatted = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value
      lines.push(`${spaces}${key}: ${formatted}`)
    } else {
      lines.push(`${spaces}${key}: ${value}`)
    }
  }

  return lines.join('\n')
}

/**
 * Universal report formatter - dispatches to format-specific functions
 * Main entry point for formatting reports with multiple output formats
 *
 * @param {any} data - Data to format
 * @param {string} format - Output format ('json', 'yaml', 'text')
 * @param {Object} [options] - Format-specific options
 * @returns {string} Formatted report string
 * @throws {Error} If format is not supported
 *
 * @example
 * const report = formatReport(data, 'json')
 * const report = formatReport(data, 'yaml')
 */
export function formatReport(data, format, options = {}) {
  const normalizedFormat = format.toLowerCase()

  switch (normalizedFormat) {
    case 'json':
      return formatAsJSON(data, options.indent)

    case 'yaml':
    case 'yml':
      return formatAsYAML(data, options.indent)

    default:
      throw new Error(
        `Unsupported format: ${format}. Supported formats: json, yaml`
      )
  }
}

/**
 * Create report summary statistics
 * Generates summary statistics from analysis data for inclusion in reports
 *
 * @param {Object} data - Analysis data
 * @param {Map|Object} data.commands - Commands map or object
 * @param {Map|Object} [data.options] - Options map or object
 * @param {Map|Object} [data.flags] - Flags map or object
 * @returns {Object} Summary statistics
 *
 * @example
 * const summary = createReportSummary({
 *   commands: new Map([['help', {...}], ['version', {...}]]),
 *   options: new Map([['verbose', {...}]])
 * })
 * // Returns: { totalCommands: 2, totalOptions: 1, totalFlags: 0 }
 */
export function createReportSummary(data) {
  const summary = {}

  if (data.commands) {
    summary.totalCommands =
      data.commands instanceof Map
        ? data.commands.size
        : Object.keys(data.commands).length
  }

  if (data.options) {
    summary.totalOptions =
      data.options instanceof Map ? data.options.size : Object.keys(data.options).length
  }

  if (data.flags) {
    summary.totalFlags =
      data.flags instanceof Map ? data.flags.size : Object.keys(data.flags).length
  }

  return summary
}

/**
 * Format duration in human-readable format
 * Used for displaying analysis execution time
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Human-readable duration
 *
 * @example
 * formatDuration(500)    // '500ms'
 * formatDuration(1500)   // '1.50s'
 * formatDuration(65000)  // '1m 5s'
 */
export function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`
  }

  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}
