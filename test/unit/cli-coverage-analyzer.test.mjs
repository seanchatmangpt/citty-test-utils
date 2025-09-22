#!/usr/bin/env node
/**
 * @fileoverview Test for CLI Coverage Analyzer
 * @description Tests the CLI coverage analysis capability
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  CLCoverageAnalyzer,
  analyzeCLICoverage,
  getCLICoverageReport,
} from '../../src/core/coverage/cli-coverage-analyzer.js'
import { runLocalCitty } from '../../src/core/runners/local-runner.js'

describe('CLI Coverage Analyzer', () => {
  let analyzer

  beforeEach(() => {
    analyzer = new CLCoverageAnalyzer({
      cliPath: 'test-cli.mjs',
      testDir: 'test',
      verbose: false,
    })
  })

  describe('Command Discovery', () => {
    it('should discover commands from help output', async () => {
      // Mock the runLocalCitty function to return test CLI help
      const mockHelpOutput = `Test CLI for citty-test-utils integration testing (ctu v0.4.0)

USAGE ctu greet|math|error|info

COMMANDS

  greet    Greet someone                     
   math    Perform mathematical operations   
  error    Simulate different types of errors
   info    Show test CLI information         

Use ctu <command> --help for more information about a command.`

      // Mock the runLocalCitty call
      const originalRunLocalCitty = runLocalCitty
      runLocalCitty = async () => ({
        result: {
          exitCode: 0,
          stdout: mockHelpOutput,
          stderr: '',
        },
      })

      await analyzer.discoverCommands({ useTestCli: true })

      expect(analyzer.commands.size).toBeGreaterThan(0)
      expect(analyzer.commands.has('greet')).toBe(true)
      expect(analyzer.commands.has('math')).toBe(true)
      expect(analyzer.commands.has('error')).toBe(true)
      expect(analyzer.commands.has('info')).toBe(true)

      // Restore original function
      runLocalCitty = originalRunLocalCitty
    })

    it('should parse command descriptions correctly', async () => {
      const mockHelpOutput = `Test CLI for citty-test-utils integration testing (ctu v0.4.0)

USAGE ctu greet|math|error|info

COMMANDS

  greet    Greet someone                     
   math    Perform mathematical operations   
  error    Simulate different types of errors
   info    Show test CLI information         

Use ctu <command> --help for more information about a command.`

      const originalRunLocalCitty = runLocalCitty
      runLocalCitty = async () => ({
        result: {
          exitCode: 0,
          stdout: mockHelpOutput,
          stderr: '',
        },
      })

      await analyzer.discoverCommands({ useTestCli: true })

      const greetCommand = analyzer.commands.get('greet')
      expect(greetCommand).toBeDefined()
      expect(greetCommand.description).toBe('Greet someone')
      expect(greetCommand.name).toBe('greet')

      runLocalCitty = originalRunLocalCitty
    })
  })

  describe('Test Discovery', () => {
    it('should find test files in directory', async () => {
      const testFiles = analyzer.findTestFiles('test', {
        includePatterns: ['.test.mjs', '.test.js'],
        excludePatterns: ['node_modules', '.git'],
      })

      // Should find some test files
      expect(Array.isArray(testFiles)).toBe(true)
    })

    it('should analyze test file content for commands', async () => {
      const mockTestContent = `
import { runLocalCitty } from '../src/core/runners/local-runner.js'

describe('CLI Tests', () => {
  it('should test greet command', async () => {
    const result = await runLocalCitty(['greet', 'Alice'])
    result.expectSuccess()
  })

  it('should test math add command', async () => {
    const result = await runLocalCitty(['math', 'add', '5', '3'])
    result.expectSuccess()
  })

  it('should test scenarios', async () => {
    await scenarios.help('local').execute()
    await scenarios.version('local').execute()
  })
})
`

      // Mock file reading
      const originalReadFileSync = require('fs').readFileSync
      require('fs').readFileSync = () => mockTestContent

      await analyzer.analyzeTestFile('test/example.test.mjs', { verbose: false })

      // Should have discovered commands
      expect(analyzer.commands.size).toBeGreaterThan(0)

      // Restore original function
      require('fs').readFileSync = originalReadFileSync
    })
  })

  describe('Coverage Calculation', () => {
    beforeEach(async () => {
      // Setup mock commands
      analyzer.commands.set('greet', {
        name: 'greet',
        description: 'Greet someone',
        tested: true,
        testFiles: ['test/greet.test.mjs'],
        subcommands: new Map(),
      })

      analyzer.commands.set('math', {
        name: 'math',
        description: 'Math operations',
        tested: false,
        testFiles: [],
        subcommands: new Map([
          [
            'add',
            {
              name: 'add',
              description: 'Add numbers',
              tested: true,
              testFiles: ['test/math.test.mjs'],
            },
          ],
          [
            'multiply',
            { name: 'multiply', description: 'Multiply numbers', tested: false, testFiles: [] },
          ],
        ]),
      })

      analyzer.commands.set('error', {
        name: 'error',
        description: 'Error simulation',
        tested: false,
        testFiles: [],
        subcommands: new Map(),
      })
    })

    it('should calculate coverage statistics correctly', async () => {
      await analyzer.calculateCoverage({ verbose: false })

      const mainCoverage = analyzer.coverage.get('main')
      expect(mainCoverage.total).toBe(3) // greet, math, error
      expect(mainCoverage.tested).toBe(1) // only greet is tested
      expect(mainCoverage.percentage).toBeCloseTo(33.33, 1)

      const subcommandCoverage = analyzer.coverage.get('subcommands')
      expect(subcommandCoverage.total).toBe(2) // add, multiply
      expect(subcommandCoverage.tested).toBe(1) // only add is tested
      expect(subcommandCoverage.percentage).toBeCloseTo(50, 1)

      const overallCoverage = analyzer.coverage.get('overall')
      expect(overallCoverage.total).toBe(5) // 3 main + 2 subcommands
      expect(overallCoverage.tested).toBe(2) // greet + add
      expect(overallCoverage.percentage).toBeCloseTo(40, 1)
    })
  })

  describe('Report Generation', () => {
    beforeEach(async () => {
      // Setup mock data
      analyzer.commands.set('greet', {
        name: 'greet',
        description: 'Greet someone',
        tested: true,
        testFiles: ['test/greet.test.mjs'],
        subcommands: new Map(),
      })

      analyzer.commands.set('math', {
        name: 'math',
        description: 'Math operations',
        tested: false,
        testFiles: [],
        subcommands: new Map([
          [
            'add',
            {
              name: 'add',
              description: 'Add numbers',
              tested: true,
              testFiles: ['test/math.test.mjs'],
            },
          ],
        ]),
      })

      analyzer.coverage.set('main', { total: 2, tested: 1, percentage: 50 })
      analyzer.coverage.set('subcommands', { total: 1, tested: 1, percentage: 100 })
      analyzer.coverage.set('overall', { total: 3, tested: 2, percentage: 66.67 })
    })

    it('should generate comprehensive report', () => {
      const report = analyzer.generateReport({ verbose: false })

      expect(report.summary).toBeDefined()
      expect(report.summary.mainCommands).toBeDefined()
      expect(report.summary.subcommands).toBeDefined()
      expect(report.summary.overall).toBeDefined()

      expect(report.commands).toBeDefined()
      expect(report.commands.greet).toBeDefined()
      expect(report.commands.math).toBeDefined()

      expect(report.recommendations).toBeDefined()
      expect(Array.isArray(report.recommendations)).toBe(true)

      expect(report.metadata).toBeDefined()
      expect(report.metadata.analyzedAt).toBeDefined()
    })

    it('should generate recommendations for untested commands', () => {
      const report = analyzer.generateReport({ verbose: false })

      const missingTestRecommendations = report.recommendations.filter(
        (rec) => rec.type === 'missing_test'
      )

      expect(missingTestRecommendations.length).toBeGreaterThan(0)
      expect(missingTestRecommendations.some((rec) => rec.command === 'math')).toBe(true)
    })

    it('should format report as text', () => {
      const report = analyzer.generateReport({ verbose: false })
      const formatted = analyzer.formatReport(report, { format: 'text', verbose: false })

      expect(typeof formatted).toBe('string')
      expect(formatted).toContain('CLI Test Coverage Analysis')
      expect(formatted).toContain('Summary:')
      expect(formatted).toContain('Recommendations:')
    })

    it('should format report as JSON', () => {
      const report = analyzer.generateReport({ verbose: false })
      const formatted = analyzer.formatReport(report, { format: 'json' })

      expect(() => JSON.parse(formatted)).not.toThrow()
      const parsed = JSON.parse(formatted)
      expect(parsed.summary).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should analyze CLI coverage end-to-end', async () => {
      // This test would run against the actual test CLI
      // For now, we'll mock the necessary parts

      const mockHelpOutput = `Test CLI for citty-test-utils integration testing (ctu v0.4.0)

USAGE ctu greet|math|error|info

COMMANDS

  greet    Greet someone                     
   math    Perform mathematical operations   
  error    Simulate different types of errors
   info    Show test CLI information         

Use ctu <command> --help for more information about a command.`

      const originalRunLocalCitty = runLocalCitty
      runLocalCitty = async () => ({
        result: {
          exitCode: 0,
          stdout: mockHelpOutput,
          stderr: '',
        },
      })

      const report = await analyzeCLICoverage({
        cliPath: 'test-cli.mjs',
        testDir: 'test',
        useTestCli: true,
        verbose: false,
      })

      expect(report.summary).toBeDefined()
      expect(report.commands).toBeDefined()
      expect(report.recommendations).toBeDefined()

      runLocalCitty = originalRunLocalCitty
    })

    it('should generate formatted coverage report', async () => {
      const mockHelpOutput = `Test CLI for citty-test-utils integration testing (ctu v0.4.0)

USAGE ctu greet|math|error|info

COMMANDS

  greet    Greet someone                     
   math    Perform mathematical operations   
  error    Simulate different types of errors
   info    Show test CLI information         

Use ctu <command> --help for more information about a command.`

      const originalRunLocalCitty = runLocalCitty
      runLocalCitty = async () => ({
        result: {
          exitCode: 0,
          stdout: mockHelpOutput,
          stderr: '',
        },
      })

      const report = await getCLICoverageReport({
        cliPath: 'test-cli.mjs',
        testDir: 'test',
        useTestCli: true,
        verbose: false,
      })

      expect(typeof report).toBe('string')
      expect(report).toContain('CLI Test Coverage Analysis')

      runLocalCitty = originalRunLocalCitty
    })
  })

  describe('Error Handling', () => {
    it('should handle CLI help failures gracefully', async () => {
      const originalRunLocalCitty = runLocalCitty
      runLocalCitty = async () => ({
        result: {
          exitCode: 1,
          stdout: '',
          stderr: 'Command not found',
        },
      })

      await expect(analyzer.discoverCommands({ useTestCli: true })).rejects.toThrow(
        'Command discovery failed'
      )

      runLocalCitty = originalRunLocalCitty
    })

    it('should handle missing test directory gracefully', async () => {
      const testFiles = analyzer.findTestFiles('nonexistent-directory', {
        includePatterns: ['.test.mjs'],
        excludePatterns: [],
      })

      expect(Array.isArray(testFiles)).toBe(true)
      expect(testFiles.length).toBe(0)
    })
  })
})
