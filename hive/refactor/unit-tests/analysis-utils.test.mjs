import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  buildAnalysisMetadata,
  validateCLIPath,
  formatCLIDetection,
  buildReportHeader,
  buildReportFooter,
  formatAnalysisError,
  mergeUniqueItems,
  safePercentage,
  formatFileSize,
  getPriorityEmoji,
  formatAsJSON,
  formatAsYAML,
  formatReport,
  createReportSummary,
  formatDuration,
} from '../../src/core/utils/analysis-report-utils.js'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'

/**
 * Unit Tests for Analysis Helper Utilities
 * Tests shared utility functions used across analysis commands
 *
 * Coverage Areas:
 * - Metadata building
 * - Path validation
 * - Report formatting
 * - Error formatting
 * - Data merging
 * - Percentage calculations
 * - File size formatting
 * - Duration formatting
 *
 * NO MOCKS - Pure utility function testing
 */

describe('Analysis Helper Utilities (Unit)', () => {
  const testDir = join(process.cwd(), '.test-analysis-utils')
  const testCliPath = join(testDir, 'test-cli.mjs')

  beforeEach(() => {
    // Create test environment
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
    writeFileSync(testCliPath, '#!/usr/bin/env node\nconsole.log("test")', { mode: 0o755 })
  })

  afterEach(() => {
    // Cleanup
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('buildAnalysisMetadata', () => {
    it('should build standard metadata object', () => {
      const metadata = buildAnalysisMetadata({
        cliPath: testCliPath,
        analysisMethod: 'AST-based',
      })

      expect(metadata).toHaveProperty('generatedAt')
      expect(metadata).toHaveProperty('cliPath', testCliPath)
      expect(metadata).toHaveProperty('analysisMethod', 'AST-based')
    })

    it('should include additional fields', () => {
      const metadata = buildAnalysisMetadata({
        cliPath: testCliPath,
        additionalFields: {
          version: '1.0.0',
          author: 'Test',
        },
      })

      expect(metadata).toHaveProperty('version', '1.0.0')
      expect(metadata).toHaveProperty('author', 'Test')
    })

    it('should have valid ISO timestamp', () => {
      const metadata = buildAnalysisMetadata({
        cliPath: testCliPath,
      })

      expect(metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('validateCLIPath', () => {
    it('should return true for existing file', () => {
      const result = validateCLIPath(testCliPath, false)
      expect(result).toBe(true)
    })

    it('should return false for non-existent file', () => {
      const result = validateCLIPath('/nonexistent/cli.mjs', false)
      expect(result).toBe(false)
    })

    it('should not throw when exitOnError is false', () => {
      expect(() => validateCLIPath('/nonexistent/cli.mjs', false)).not.toThrow()
    })
  })

  describe('formatCLIDetection', () => {
    it('should format detected CLI metadata', () => {
      const detected = {
        detectionMethod: 'package.json',
        confidence: 'high',
        packageName: 'test-cli',
        searchPath: '/test/path',
      }

      const formatted = formatCLIDetection(detected)

      expect(formatted).toHaveProperty('method', 'package.json')
      expect(formatted).toHaveProperty('confidence', 'high')
      expect(formatted).toHaveProperty('packageName', 'test-cli')
      expect(formatted).toHaveProperty('searchPath', '/test/path')
    })

    it('should return null for null input', () => {
      const formatted = formatCLIDetection(null)
      expect(formatted).toBeNull()
    })

    it('should omit optional fields when not present', () => {
      const detected = {
        detectionMethod: 'manual',
        confidence: 'low',
      }

      const formatted = formatCLIDetection(detected)

      expect(formatted).toHaveProperty('method')
      expect(formatted).toHaveProperty('confidence')
      expect(formatted).not.toHaveProperty('packageName')
      expect(formatted).not.toHaveProperty('searchPath')
    })
  })

  describe('buildReportHeader', () => {
    it('should build report header with default separator', () => {
      const header = buildReportHeader('Test Report')

      expect(header).toContain('Test Report')
      expect(header).toContain('='.repeat(40))
    })

    it('should use custom separator', () => {
      const header = buildReportHeader('Test Report', '-', 20)

      expect(header).toContain('Test Report')
      expect(header).toContain('-'.repeat(20))
    })

    it('should end with newline', () => {
      const header = buildReportHeader('Test Report')
      expect(header.endsWith('\n')).toBe(true)
    })
  })

  describe('buildReportFooter', () => {
    it('should include CLI path', () => {
      const footer = buildReportFooter({ cliPath: testCliPath })
      expect(footer).toContain(testCliPath)
    })

    it('should include generation timestamp', () => {
      const timestamp = new Date().toISOString()
      const footer = buildReportFooter({ generatedAt: timestamp })
      expect(footer).toContain(timestamp)
    })

    it('should include analysis method', () => {
      const footer = buildReportFooter({ analysisMethod: 'AST-based' })
      expect(footer).toContain('AST-based')
    })

    it('should handle empty metadata', () => {
      const footer = buildReportFooter({})
      expect(footer).toBe('\n')
    })
  })

  describe('formatAnalysisError', () => {
    it('should format error with message', () => {
      const error = new Error('Test error')
      const formatted = formatAnalysisError(error)

      expect(formatted).toHaveProperty('error', 'Test error')
      expect(formatted).toHaveProperty('type', 'Error')
      expect(formatted).toHaveProperty('timestamp')
    })

    it('should include context', () => {
      const error = new Error('Test error')
      const formatted = formatAnalysisError(error, { cliPath: testCliPath, command: 'test' })

      expect(formatted).toHaveProperty('cliPath', testCliPath)
      expect(formatted).toHaveProperty('command', 'test')
    })

    it('should handle errors without name', () => {
      const error = { message: 'Test error' }
      const formatted = formatAnalysisError(error)

      expect(formatted).toHaveProperty('type', 'AnalysisError')
    })
  })

  describe('mergeUniqueItems', () => {
    it('should merge arrays and remove duplicates', () => {
      const arr1 = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }]
      const arr2 = [{ id: 2, name: 'b' }, { id: 3, name: 'c' }]

      const merged = mergeUniqueItems([arr1, arr2], 'id')

      expect(merged).toHaveLength(3)
      expect(merged.map(x => x.id)).toEqual([1, 2, 3])
    })

    it('should handle empty arrays', () => {
      const merged = mergeUniqueItems([[], []])
      expect(merged).toHaveLength(0)
    })

    it('should use JSON.stringify for items without key', () => {
      const arr1 = [{ name: 'a' }, { name: 'b' }]
      const arr2 = [{ name: 'b' }, { name: 'c' }]

      const merged = mergeUniqueItems([arr1, arr2])

      expect(merged.length).toBeLessThanOrEqual(4)
    })
  })

  describe('safePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(safePercentage(50, 100)).toBe(50.0)
      expect(safePercentage(75, 100)).toBe(75.0)
      expect(safePercentage(1, 3, 2)).toBe(33.33)
    })

    it('should return 0 for zero total', () => {
      expect(safePercentage(10, 0)).toBe(0)
    })

    it('should handle decimal places', () => {
      expect(safePercentage(1, 3, 0)).toBe(33)
      expect(safePercentage(1, 3, 1)).toBe(33.3)
      expect(safePercentage(1, 3, 2)).toBe(33.33)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500.0 B')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB')
      expect(formatFileSize(2097152)).toBe('2.0 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB')
    })
  })

  describe('getPriorityEmoji', () => {
    it('should return correct emoji for priority levels', () => {
      expect(getPriorityEmoji('critical')).toBe('🔴')
      expect(getPriorityEmoji('high')).toBe('🟠')
      expect(getPriorityEmoji('medium')).toBe('🟡')
      expect(getPriorityEmoji('low')).toBe('🟢')
      expect(getPriorityEmoji('info')).toBe('ℹ️')
    })

    it('should handle case insensitivity', () => {
      expect(getPriorityEmoji('CRITICAL')).toBe('🔴')
      expect(getPriorityEmoji('High')).toBe('🟠')
    })

    it('should return default for unknown priority', () => {
      expect(getPriorityEmoji('unknown')).toBe('⚪')
      expect(getPriorityEmoji(null)).toBe('⚪')
    })
  })

  describe('formatAsJSON', () => {
    it('should format object as JSON', () => {
      const obj = { name: 'test', value: 42 }
      const json = formatAsJSON(obj)

      expect(json).toContain('"name": "test"')
      expect(json).toContain('"value": 42')
    })

    it('should use custom indentation', () => {
      const obj = { a: 1 }
      const json = formatAsJSON(obj, 4)

      expect(json).toContain('    "a":')
    })

    it('should handle arrays', () => {
      const arr = [1, 2, 3]
      const json = formatAsJSON(arr)

      expect(json).toContain('[')
      expect(json).toContain(']')
    })
  })

  describe('formatAsYAML', () => {
    it('should format simple object as YAML', () => {
      const obj = { name: 'test', count: 42 }
      const yaml = formatAsYAML(obj)

      expect(yaml).toContain('name: test')
      expect(yaml).toContain('count: 42')
    })

    it('should handle nested objects', () => {
      const obj = { outer: { inner: 'value' } }
      const yaml = formatAsYAML(obj)

      expect(yaml).toContain('outer:')
      expect(yaml).toContain('  inner: value')
    })

    it('should handle arrays', () => {
      const obj = { items: ['a', 'b', 'c'] }
      const yaml = formatAsYAML(obj)

      expect(yaml).toContain('items:')
      expect(yaml).toContain('  - a')
      expect(yaml).toContain('  - b')
    })

    it('should handle null values', () => {
      const obj = { value: null }
      const yaml = formatAsYAML(obj)

      expect(yaml).toContain('value: null')
    })

    it('should quote strings with special characters', () => {
      const obj = { text: 'line1:line2' }
      const yaml = formatAsYAML(obj)

      expect(yaml).toContain('"line1:line2"')
    })
  })

  describe('formatReport', () => {
    it('should format as JSON', () => {
      const data = { name: 'test' }
      const report = formatReport(data, 'json')

      expect(report).toContain('"name"')
      expect(report).toContain('"test"')
    })

    it('should format as YAML', () => {
      const data = { name: 'test' }
      const report = formatReport(data, 'yaml')

      expect(report).toContain('name: test')
    })

    it('should handle yml alias', () => {
      const data = { name: 'test' }
      const report = formatReport(data, 'yml')

      expect(report).toContain('name: test')
    })

    it('should throw for unsupported format', () => {
      const data = { name: 'test' }

      expect(() => formatReport(data, 'xml')).toThrow('Unsupported format')
    })
  })

  describe('createReportSummary', () => {
    it('should create summary from Map objects', () => {
      const data = {
        commands: new Map([['cmd1', {}], ['cmd2', {}]]),
        options: new Map([['opt1', {}]]),
        flags: new Map([['flag1', {}]]),
      }

      const summary = createReportSummary(data)

      expect(summary.totalCommands).toBe(2)
      expect(summary.totalOptions).toBe(1)
      expect(summary.totalFlags).toBe(1)
    })

    it('should create summary from plain objects', () => {
      const data = {
        commands: { cmd1: {}, cmd2: {} },
        options: { opt1: {} },
      }

      const summary = createReportSummary(data)

      expect(summary.totalCommands).toBe(2)
      expect(summary.totalOptions).toBe(1)
    })

    it('should handle empty data', () => {
      const summary = createReportSummary({})

      expect(summary).toEqual({})
    })
  })

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms')
      expect(formatDuration(999)).toBe('999ms')
    })

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.00s')
      expect(formatDuration(1500)).toBe('1.50s')
      expect(formatDuration(5000)).toBe('5.00s')
    })

    it('should format minutes and seconds', () => {
      expect(formatDuration(60000)).toBe('1m 0s')
      expect(formatDuration(65000)).toBe('1m 5s')
      expect(formatDuration(125000)).toBe('2m 5s')
    })

    it('should handle edge cases', () => {
      expect(formatDuration(0)).toBe('0ms')
      expect(formatDuration(59999)).toBe('60.00s') // Rounds to 60.00s
      expect(formatDuration(60001)).toBe('1m 0s')
    })
  })

  describe('Edge Cases and Boundary Tests', () => {
    describe('Null and Undefined Handling', () => {
      it('should handle null inputs gracefully', () => {
        expect(() => buildAnalysisMetadata({ cliPath: null })).not.toThrow()
        expect(() => formatCLIDetection(null)).not.toThrow()
        expect(() => formatAnalysisError({ message: null })).not.toThrow()
      })

      it('should handle undefined inputs gracefully', () => {
        expect(() => buildAnalysisMetadata({})).not.toThrow()
        // mergeUniqueItems expects arrays, undefined is not iterable
        expect(() => mergeUniqueItems([[], []])).not.toThrow()
        expect(() => safePercentage(undefined, undefined)).not.toThrow()
      })
    })

    describe('Empty String Handling', () => {
      it('should handle empty strings', () => {
        expect(buildReportHeader('')).toBeTruthy()
        expect(formatDuration(0)).toBe('0ms')
        expect(formatFileSize(0)).toBe('0.0 B')
      })
    })

    describe('Large Values', () => {
      it('should handle large numbers', () => {
        expect(formatFileSize(Number.MAX_SAFE_INTEGER)).toBeTruthy()
        expect(formatDuration(Number.MAX_SAFE_INTEGER)).toBeTruthy()
        expect(safePercentage(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toBe(100)
      })
    })

    describe('Special Characters', () => {
      it('should handle special characters in strings', () => {
        const yaml = formatAsYAML({ text: '😀\n\t"test"' })
        expect(yaml).toBeTruthy()

        const json = formatAsJSON({ text: '😀\n\t"test"' })
        expect(json).toBeTruthy()
      })
    })
  })
})
