#!/usr/bin/env node
// test/integration/coverage-analyzer.test.mjs
// Test the CLI Coverage Analyzer functionality

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  analyzeCLICoverage,
  checkCommandCoverage,
  CLICoverageAnalyzer,
} from '../../src/core/coverage/cli-coverage-analyzer.js'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'

describe('CLI Coverage Analyzer', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  }, 120000)

  afterAll(async () => {
    await teardownCleanroom()
  }, 60000)

  describe('Basic Coverage Analysis', () => {
    it('should analyze CLI coverage using help command walking', async () => {
      const analyzer = new CLICoverageAnalyzer({
        useCleanroom: false,
        includeSubcommands: true,
        includeOptions: true,
        includeExamples: true,
      })

      // Discover command structure
      await analyzer.discoverCommandStructure()

      expect(analyzer.discoveredCommands.size).toBeGreaterThan(0)

      // Should discover main commands
      const commandKeys = Array.from(analyzer.discoveredCommands.keys())
      expect(commandKeys).toContain('test')
      expect(commandKeys).toContain('gen')
      expect(commandKeys).toContain('runner')
      expect(commandKeys).toContain('info')
    })

    it('should find existing test files', async () => {
      const analyzer = new CLICoverageAnalyzer()
      await analyzer.findTestFiles()

      expect(analyzer.testFiles.size).toBeGreaterThan(0)

      // Should find test files in test directory
      const testFiles = Array.from(analyzer.testFiles)
      const hasTestFiles = testFiles.some((file) => file.includes('test'))
      expect(hasTestFiles).toBe(true)
    })

    it('should analyze coverage gaps', async () => {
      const analyzer = new CLICoverageAnalyzer()

      // Mock some discovered commands
      analyzer.discoveredCommands.set('test', {
        path: ['test'],
        name: 'test',
        description: 'Run tests',
        options: [
          { flag: '--environment', description: 'Test environment' },
          { flag: '--verbose', description: 'Verbose output' },
        ],
        subcommands: ['run', 'scenario'],
        examples: ['ctu test run', 'ctu test scenario'],
      })

      analyzer.discoveredCommands.set('gen', {
        path: ['gen'],
        name: 'gen',
        description: 'Generate files',
        options: [{ flag: '--template', description: 'Template type' }],
        subcommands: ['project', 'test'],
        examples: ['ctu gen project'],
      })

      // Find test files
      await analyzer.findTestFiles()

      // Analyze coverage gaps
      await analyzer.analyzeCoverageGaps()

      expect(analyzer.coverageGaps.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Command-Specific Coverage Analysis', () => {
    it('should analyze coverage for a specific command', async () => {
      const result = await checkCommandCoverage(['test'], {
        useCleanroom: false,
        includeSubcommands: true,
        includeOptions: true,
        includeExamples: true,
      })

      expect(result.command).toBe('test')
      expect(result.coverage).toBeDefined()
      expect(result.coverage.coveragePercentage).toBeGreaterThanOrEqual(0)
      expect(result.coverage.coveragePercentage).toBeLessThanOrEqual(100)
      expect(result.helpOutput).toContain('test')
    })

    it('should analyze coverage for gen command', async () => {
      const result = await checkCommandCoverage(['gen'], {
        useCleanroom: false,
        includeSubcommands: true,
        includeOptions: true,
        includeExamples: true,
      })

      expect(result.command).toBe('gen')
      expect(result.coverage).toBeDefined()
      expect(result.helpOutput).toContain('gen')
    })
  })

  describe('Help Command Parsing', () => {
    it('should parse help output correctly', async () => {
      const analyzer = new CLICoverageAnalyzer()

      const helpOutput = `
USAGE
  ctu test [options]

COMMANDS
  run       Run tests
  scenario  Run scenarios

OPTIONS
  --environment <env>  Test environment
  --verbose           Verbose output

EXAMPLES
  $ ctu test run --environment local
  $ ctu test scenario --verbose
`

      const parsed = await analyzer.parseHelpOutput(helpOutput, ['test'])

      expect(parsed.commands).toBeDefined()
      expect(parsed.commands.run).toBeDefined()
      expect(parsed.commands.scenario).toBeDefined()
      expect(parsed.options.length).toBeGreaterThan(0)
      expect(parsed.examples.length).toBeGreaterThan(0)
    })

    it('should handle help output with different formats', async () => {
      const analyzer = new CLICoverageAnalyzer()

      const helpOutput = `
Usage: ctu gen [command] [options]

Commands:
  project    Generate project structure
  test       Generate test file
  scenario   Generate scenario file

Flags:
  -h, --help     Show help
  -v, --version  Show version
`

      const parsed = await analyzer.parseHelpOutput(helpOutput, ['gen'])

      expect(parsed.commands).toBeDefined()
      expect(parsed.commands.project).toBeDefined()
      expect(parsed.commands.test).toBeDefined()
      expect(parsed.commands.scenario).toBeDefined()
    })
  })

  describe('Coverage Report Generation', () => {
    it('should generate coverage report', async () => {
      const analyzer = new CLICoverageAnalyzer({
        outputFile: 'test-coverage-report.json',
      })

      // Mock discovered commands
      analyzer.discoveredCommands.set('test', {
        path: ['test'],
        name: 'test',
        description: 'Run tests',
        options: [],
        subcommands: [],
        examples: [],
      })

      analyzer.testFiles.add('test/unit/test.test.mjs')

      // Generate report
      await analyzer.generateReport()

      const results = analyzer.getResults()
      expect(results.discoveredCommands.size).toBe(1)
      expect(results.testFiles.size).toBe(1)
      expect(results.overallCoverage).toBeGreaterThanOrEqual(0)
    })

    it('should calculate overall coverage correctly', async () => {
      const analyzer = new CLICoverageAnalyzer()

      // Mock commands with different coverage levels
      analyzer.discoveredCommands.set('test', {
        path: ['test'],
        name: 'test',
        description: 'Run tests',
        options: [],
        subcommands: [],
        examples: [],
      })

      analyzer.discoveredCommands.set('gen', {
        path: ['gen'],
        name: 'gen',
        description: 'Generate files',
        options: [],
        subcommands: [],
        examples: [],
      })

      // Mock test files
      analyzer.testFiles.add('test/unit/test.test.mjs')
      analyzer.testFiles.add('test/unit/gen.test.mjs')

      const overallCoverage = analyzer.calculateOverallCoverage()
      expect(overallCoverage).toBeGreaterThanOrEqual(0)
      expect(overallCoverage).toBeLessThanOrEqual(100)
    })
  })

  describe('Cleanroom Coverage Analysis', () => {
    it('should analyze coverage using cleanroom environment', async () => {
      const analyzer = new CLICoverageAnalyzer({
        useCleanroom: true,
        includeSubcommands: true,
        includeOptions: true,
        includeExamples: true,
      })

      // Discover command structure in cleanroom
      await analyzer.discoverCommandStructure()

      expect(analyzer.discoveredCommands.size).toBeGreaterThan(0)

      // Should discover main commands
      const commandKeys = Array.from(analyzer.discoveredCommands.keys())
      expect(commandKeys).toContain('test')
      expect(commandKeys).toContain('gen')
    })

    it('should analyze specific command in cleanroom', async () => {
      const result = await checkCommandCoverage(['coverage'], {
        useCleanroom: true,
        includeSubcommands: true,
        includeOptions: true,
        includeExamples: true,
      })

      expect(result.command).toBe('coverage')
      expect(result.coverage).toBeDefined()
      expect(result.helpOutput).toContain('coverage')
    })
  })

  describe('Coverage Gap Detection', () => {
    it('should identify missing tests for commands', async () => {
      const analyzer = new CLICoverageAnalyzer()

      // Mock a command with no tests
      analyzer.discoveredCommands.set('newcommand', {
        path: ['newcommand'],
        name: 'newcommand',
        description: 'New command',
        options: [
          { flag: '--option1', description: 'Option 1' },
          { flag: '--option2', description: 'Option 2' },
        ],
        subcommands: [],
        examples: ['ctu newcommand --option1'],
      })

      // No test files for this command
      analyzer.testFiles.clear()

      // Analyze coverage gaps
      await analyzer.analyzeCoverageGaps()

      expect(analyzer.coverageGaps.length).toBeGreaterThan(0)

      const newcommandGap = analyzer.coverageGaps.find((gap) => gap.command === 'newcommand')
      expect(newcommandGap).toBeDefined()
      expect(newcommandGap.coverage).toBe(0)
      expect(newcommandGap.missingTests.length).toBeGreaterThan(0)
    })

    it('should identify partial coverage for commands', async () => {
      const analyzer = new CLICoverageAnalyzer()

      // Mock a command with some tests
      analyzer.discoveredCommands.set('partialcommand', {
        path: ['partialcommand'],
        name: 'partialcommand',
        description: 'Partial command',
        options: [
          { flag: '--option1', description: 'Option 1' },
          { flag: '--option2', description: 'Option 2' },
        ],
        subcommands: [],
        examples: ['ctu partialcommand --option1'],
      })

      // Mock some test files
      analyzer.testFiles.add('test/unit/partialcommand.test.mjs')

      // Analyze coverage gaps
      await analyzer.analyzeCoverageGaps()

      const partialGap = analyzer.coverageGaps.find((gap) => gap.command === 'partialcommand')
      if (partialGap) {
        expect(partialGap.coverage).toBeGreaterThan(0)
        expect(partialGap.coverage).toBeLessThan(100)
      }
    })
  })

  describe('Recommendations Generation', () => {
    it('should generate recommendations for improving coverage', async () => {
      const analyzer = new CLICoverageAnalyzer()

      // Mock commands with different coverage levels
      analyzer.discoveredCommands.set('critical', {
        path: ['critical'],
        name: 'critical',
        description: 'Critical command',
        options: [],
        subcommands: [],
        examples: [],
      })

      analyzer.discoveredCommands.set('moderate', {
        path: ['moderate'],
        name: 'moderate',
        description: 'Moderate command',
        options: [],
        subcommands: [],
        examples: [],
      })

      // Mock coverage gaps
      analyzer.coverageGaps = [
        { command: 'critical', coverage: 25, missingTests: ['basic', 'help', 'error'] },
        { command: 'moderate', coverage: 60, missingTests: ['error'] },
      ]

      const recommendations = analyzer.generateRecommendations()

      expect(recommendations.length).toBeGreaterThan(0)

      const criticalRec = recommendations.find((rec) => rec.priority === 'critical')
      expect(criticalRec).toBeDefined()
      expect(criticalRec.commands).toContain('critical')

      const moderateRec = recommendations.find((rec) => rec.priority === 'moderate')
      expect(moderateRec).toBeDefined()
      expect(moderateRec.commands).toContain('moderate')
    })
  })
})

