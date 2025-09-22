#!/usr/bin/env node
/**
 * @fileoverview Integration Test for CLI Coverage Analysis
 * @description Tests the CLI coverage analysis capability with real CLI and test files
 */

import { describe, it, expect } from 'vitest'
import {
  analyzeCLICoverage,
  getCLICoverageReport,
} from '../../src/core/coverage/cli-coverage-analyzer.js'

describe('CLI Coverage Analysis Integration', () => {
  describe('Real CLI Analysis', () => {
    it('should analyze test CLI coverage', async () => {
      const report = await analyzeCLICoverage({
        cliPath: 'test-cli.mjs',
        testDir: 'test',
        useTestCli: true,
        verbose: false,
      })

      // Should have discovered commands from test CLI
      expect(report.summary).toBeDefined()
      expect(report.summary.mainCommands).toBeDefined()
      expect(report.summary.subcommands).toBeDefined()
      expect(report.summary.overall).toBeDefined()

      // Should have found some commands
      expect(Object.keys(report.commands).length).toBeGreaterThan(0)

      // Should have metadata
      expect(report.metadata).toBeDefined()
      expect(report.metadata.analyzedAt).toBeDefined()
      expect(report.metadata.cliPath).toBe('test-cli.mjs')
      expect(report.metadata.testDir).toBe('test')

      console.log('📊 Coverage Analysis Results:')
      console.log(
        `  Main Commands: ${report.summary.mainCommands.tested}/${
          report.summary.mainCommands.total
        } (${report.summary.mainCommands.percentage.toFixed(1)}%)`
      )
      console.log(
        `  Subcommands: ${report.summary.subcommands.tested}/${
          report.summary.subcommands.total
        } (${report.summary.subcommands.percentage.toFixed(1)}%)`
      )
      console.log(
        `  Overall: ${report.summary.overall.tested}/${
          report.summary.overall.total
        } (${report.summary.overall.percentage.toFixed(1)}%)`
      )
    })

    it('should generate formatted coverage report', async () => {
      const report = await getCLICoverageReport({
        cliPath: 'test-cli.mjs',
        testDir: 'test',
        useTestCli: true,
        verbose: false,
      })

      expect(typeof report).toBe('string')
      expect(report).toContain('CLI Test Coverage Analysis')
      expect(report).toContain('Summary:')
      expect(report).toContain('Analysis Info:')

      console.log('\n📋 Formatted Coverage Report:')
      console.log(report)
    })

    it('should analyze main CLI coverage', async () => {
      console.log('Current working directory:', process.cwd())
      console.log('Testing main CLI analysis...')
      
      const report = await analyzeCLICoverage({
        cliPath: 'src/cli.mjs',
        testDir: 'test',
        useTestCli: false,
        verbose: true,
      })

      console.log('Report received:', {
        commandsCount: Object.keys(report.commands).length,
        commands: Object.keys(report.commands),
        summary: report.summary
      })

      // Should have discovered commands from main CLI
      expect(report.summary).toBeDefined()
      expect(report.commands).toBeDefined()

      // Should have found main CLI commands
      expect(Object.keys(report.commands).length).toBeGreaterThan(0)

      console.log('\n📊 Main CLI Coverage Analysis:')
      console.log(`  Commands Found: ${Object.keys(report.commands).length}`)
      console.log(`  Overall Coverage: ${report.summary.overall.percentage.toFixed(1)}%`)
    })

    it('should generate JSON format report', async () => {
      const report = await analyzeCLICoverage({
        cliPath: 'test-cli.mjs',
        testDir: 'test',
        useTestCli: true,
        verbose: false,
      })

      const jsonReport = JSON.stringify(report, null, 2)

      expect(() => JSON.parse(jsonReport)).not.toThrow()

      const parsed = JSON.parse(jsonReport)
      expect(parsed.summary).toBeDefined()
      expect(parsed.commands).toBeDefined()
      expect(parsed.metadata).toBeDefined()

      console.log('\n📄 JSON Report Sample:')
      console.log(
        JSON.stringify(
          {
            summary: parsed.summary,
            commandsCount: Object.keys(parsed.commands).length,
            recommendationsCount: parsed.recommendations.length,
          },
          null,
          2
        )
      )
    })

    it('should provide actionable recommendations', async () => {
      const report = await analyzeCLICoverage({
        cliPath: 'test-cli.mjs',
        testDir: 'test',
        useTestCli: true,
        verbose: false,
      })

      expect(report.recommendations).toBeDefined()
      expect(Array.isArray(report.recommendations)).toBe(true)

      // Should have different types of recommendations
      const recommendationTypes = new Set(report.recommendations.map((r) => r.type))
      expect(recommendationTypes.size).toBeGreaterThan(0)

      console.log('\n💡 Recommendations:')
      report.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'
        console.log(`  ${priority} ${rec.message}`)
        if (rec.suggestion) {
          console.log(`     → ${rec.suggestion}`)
        }
      })
    })

    it('should handle verbose output', async () => {
      const report = await getCLICoverageReport({
        cliPath: 'test-cli.mjs',
        testDir: 'test',
        useTestCli: true,
        verbose: true,
      })

      expect(typeof report).toBe('string')
      expect(report).toContain('CLI Test Coverage Analysis')

      // Verbose report should include more detail
      expect(report).toContain('Commands Detail:')
    })

    it('should analyze specific test patterns', async () => {
      const report = await analyzeCLICoverage({
        cliPath: 'test-cli.mjs',
        testDir: 'test',
        useTestCli: true,
        includePatterns: ['.test.mjs'],
        excludePatterns: ['node_modules', '.git', 'coverage'],
        verbose: false,
      })

      expect(report.metadata).toBeDefined()
      expect(report.metadata.totalTestFiles).toBeGreaterThanOrEqual(0)

      console.log('\n🔍 Test Pattern Analysis:')
      console.log(`  Test Files Found: ${report.metadata.totalTestFiles}`)
      console.log(`  Commands Analyzed: ${Object.keys(report.commands).length}`)
    })
  })

  describe('Coverage Analysis Features', () => {
    it('should discover command structure from help', async () => {
      const report = await analyzeCLICoverage({
        cliPath: 'test-cli.mjs',
        testDir: 'test',
        useTestCli: true,
        verbose: false,
      })

      // Should have discovered the main commands from test CLI
      const expectedCommands = ['greet', 'math', 'error', 'info']

      for (const expectedCmd of expectedCommands) {
        expect(report.commands[expectedCmd]).toBeDefined()
        expect(report.commands[expectedCmd].name).toBe(expectedCmd)
        expect(report.commands[expectedCmd].description).toBeDefined()
      }

      console.log('\n📋 Discovered Commands:')
      Object.entries(report.commands).forEach(([name, cmd]) => {
        const status = cmd.tested ? '✅' : '❌'
        console.log(`  ${status} ${name}: ${cmd.description}`)
      })
    })

    it('should calculate accurate coverage percentages', async () => {
      const report = await analyzeCLICoverage({
        cliPath: 'test-cli.mjs',
        testDir: 'test',
        useTestCli: true,
        verbose: false,
      })

      // Coverage percentages should be valid
      expect(report.summary.mainCommands.percentage).toBeGreaterThanOrEqual(0)
      expect(report.summary.mainCommands.percentage).toBeLessThanOrEqual(100)
      expect(report.summary.subcommands.percentage).toBeGreaterThanOrEqual(0)
      expect(report.summary.subcommands.percentage).toBeLessThanOrEqual(100)
      expect(report.summary.overall.percentage).toBeGreaterThanOrEqual(0)
      expect(report.summary.overall.percentage).toBeLessThanOrEqual(100)

      // Coverage should be calculated correctly
      const expectedMainPercentage =
        (report.summary.mainCommands.tested / report.summary.mainCommands.total) * 100
      expect(report.summary.mainCommands.percentage).toBeCloseTo(expectedMainPercentage, 1)

      console.log('\n📊 Coverage Accuracy Check:')
      console.log(
        `  Main Commands: ${report.summary.mainCommands.tested}/${
          report.summary.mainCommands.total
        } = ${report.summary.mainCommands.percentage.toFixed(1)}%`
      )
      console.log(
        `  Subcommands: ${report.summary.subcommands.tested}/${
          report.summary.subcommands.total
        } = ${report.summary.subcommands.percentage.toFixed(1)}%`
      )
      console.log(
        `  Overall: ${report.summary.overall.tested}/${
          report.summary.overall.total
        } = ${report.summary.overall.percentage.toFixed(1)}%`
      )
    })

    it('should provide comprehensive metadata', async () => {
      const report = await analyzeCLICoverage({
        cliPath: 'test-cli.mjs',
        testDir: 'test',
        useTestCli: true,
        verbose: false,
      })

      expect(report.metadata).toBeDefined()
      expect(report.metadata.analyzedAt).toBeDefined()
      expect(report.metadata.cliPath).toBe('test-cli.mjs')
      expect(report.metadata.testDir).toBe('test')
      expect(typeof report.metadata.totalTestFiles).toBe('number')

      // AnalyzedAt should be a valid ISO date
      expect(() => new Date(report.metadata.analyzedAt)).not.toThrow()
      expect(new Date(report.metadata.analyzedAt).getTime()).toBeGreaterThan(0)

      console.log('\nℹ️  Analysis Metadata:')
      console.log(`  Analyzed At: ${new Date(report.metadata.analyzedAt).toLocaleString()}`)
      console.log(`  CLI Path: ${report.metadata.cliPath}`)
      console.log(`  Test Directory: ${report.metadata.testDir}`)
      console.log(`  Test Files: ${report.metadata.totalTestFiles}`)
    })
  })
})
