#!/usr/bin/env node
// src/commands/coverage.js
// CLI Coverage Analysis Command

import { analyzeCLICoverage, checkCommandCoverage } from '../core/coverage/cli-coverage-analyzer.js'
import { defineCommand } from 'citty'

export const coverageCommand = defineCommand({
  meta: {
    name: 'coverage',
    description: 'Analyze CLI test coverage by walking help commands',
  },
  args: {
    command: {
      type: 'string',
      description: 'Specific command to analyze (optional)',
      alias: 'c',
    },
    cleanroom: {
      type: 'boolean',
      description: 'Use cleanroom environment for analysis',
      alias: 'r',
      default: false,
    },
    output: {
      type: 'string',
      description: 'Output file for coverage report',
      alias: 'o',
      default: 'cli-coverage-report.json',
    },
    includeSubcommands: {
      type: 'boolean',
      description: 'Include subcommands in analysis',
      alias: 's',
      default: true,
    },
    includeOptions: {
      type: 'boolean',
      description: 'Include command options in analysis',
      alias: 'p',
      default: true,
    },
    includeExamples: {
      type: 'boolean',
      description: 'Include command examples in analysis',
      alias: 'e',
      default: true,
    },
  },
  async run({ args }) {
    console.log('🔍 CLI Coverage Analysis')
    console.log('========================\n')

    try {
      if (args.command) {
        // Analyze specific command
        console.log(`Analyzing command: ${args.command}`)
        const commandPath = args.command.split(' ')

        const result = await checkCommandCoverage(commandPath, {
          useCleanroom: args.cleanroom,
          includeSubcommands: args.includeSubcommands,
          includeOptions: args.includeOptions,
          includeExamples: args.includeExamples,
        })

        console.log(`\n📊 Coverage Analysis for: ${result.command}`)
        console.log('=====================================')
        console.log(`Coverage: ${result.coverage.coveragePercentage.toFixed(1)}%`)
        console.log(`Existing Tests: ${result.coverage.existingTests.length}`)
        console.log(`Missing Tests: ${result.coverage.missingTests.length}`)

        if (result.coverage.missingTests.length > 0) {
          console.log('\n🚨 Missing Tests:')
          result.coverage.missingTests.forEach((test) => {
            console.log(`  - ${test}`)
          })
        }

        if (result.coverage.existingTests.length > 0) {
          console.log('\n✅ Existing Tests:')
          result.coverage.existingTests.forEach((test) => {
            console.log(`  - ${test}`)
          })
        }
      } else {
        // Analyze entire CLI
        console.log('Analyzing entire CLI structure...')

        const results = await analyzeCLICoverage({
          useCleanroom: args.cleanroom,
          outputFile: args.output,
          includeSubcommands: args.includeSubcommands,
          includeOptions: args.includeOptions,
          includeExamples: args.includeExamples,
        })

        console.log(`\n📊 Analysis Complete!`)
        console.log(`Overall Coverage: ${results.overallCoverage.toFixed(1)}%`)
        console.log(`Commands Analyzed: ${results.discoveredCommands.size}`)
        console.log(`Coverage Gaps: ${results.coverageGaps.length}`)
        console.log(`Test Files Found: ${results.testFiles.size}`)
      }
    } catch (error) {
      console.error('❌ Coverage analysis failed:', error.message)
      process.exit(1)
    }
  },
})

