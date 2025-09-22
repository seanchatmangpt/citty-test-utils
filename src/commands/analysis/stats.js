/**
 * @fileoverview Coverage statistics subcommand
 * @description Show coverage statistics summary
 */

import { defineCommand } from 'citty'
import { CLCoverageAnalyzer } from '../../core/coverage/cli-coverage-analyzer.js'

export const statsCommand = defineCommand({
  meta: {
    name: 'stats',
    description: 'Show coverage statistics summary',
  },
  args: {
    'cli-path': {
      type: 'string',
      description: 'Path to CLI file to analyze',
      default: 'src/cli.mjs',
    },
    'test-dir': {
      type: 'string',
      description: 'Directory containing test files',
      default: 'test',
    },
    'use-test-cli': {
      type: 'boolean',
      description: 'Use test CLI instead of main CLI for analysis',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
    },
    'include-patterns': {
      type: 'string',
      description: 'Comma-separated file patterns to include',
      default: '.test.mjs,.test.js,.spec.mjs,.spec.js',
    },
    'exclude-patterns': {
      type: 'string',
      description: 'Comma-separated patterns to exclude',
      default: 'node_modules,.git,coverage',
    },
  },
  run: async (ctx) => {
    const {
      'cli-path': cliPath,
      'test-dir': testDir,
      'use-test-cli': useTestCli,
      verbose,
      'include-patterns': includePatterns,
      'exclude-patterns': excludePatterns,
    } = ctx.args

    try {
      const options = {
        cliPath,
        testDir,
        useTestCli,
        format: 'text',
        verbose,
        includePatterns: includePatterns.split(',').map((p) => p.trim()),
        excludePatterns: excludePatterns.split(',').map((p) => p.trim()),
      }

      if (verbose) {
        console.error('📈 Calculating coverage statistics...')
        console.error(`CLI Path: ${cliPath}`)
        console.error(`Test Directory: ${testDir}`)
      }

      const analyzer = new CLCoverageAnalyzer(options)
      const report = await analyzer.analyze(options)

      // Display statistics summary
      console.log('📊 Enhanced CLI Coverage Statistics')
      console.log('==================================')
      console.log(`CLI: ${report.metadata.cliPath}`)
      console.log(`Test Directory: ${report.metadata.testDir}`)
      console.log(`Total Test Files: ${report.metadata.totalTestFiles}`)
      console.log(`Total Commands: ${report.metadata.totalCommands}`)
      console.log(`Total Arguments: ${report.metadata.totalArguments}`)
      console.log(`Total Flags: ${report.metadata.totalFlags}`)
      console.log(`Total Options: ${report.metadata.totalOptions}`)
      console.log('')
      console.log('📈 Coverage Summary:')
      console.log(
        `  Commands: ${report.coverage.summary.commands.tested}/${
          report.coverage.summary.commands.total
        } (${report.coverage.summary.commands.percentage.toFixed(1)}%)`
      )
      console.log(
        `  Arguments: ${report.coverage.summary.arguments.tested}/${
          report.coverage.summary.arguments.total
        } (${report.coverage.summary.arguments.percentage.toFixed(1)}%)`
      )
      console.log(
        `  Flags: ${report.coverage.summary.flags.tested}/${
          report.coverage.summary.flags.total
        } (${report.coverage.summary.flags.percentage.toFixed(1)}%)`
      )
      console.log(
        `  Options: ${report.coverage.summary.options.tested}/${
          report.coverage.summary.options.total
        } (${report.coverage.summary.options.percentage.toFixed(1)}%)`
      )
      console.log(
        `  Overall: ${report.coverage.summary.overall.tested}/${
          report.coverage.summary.overall.total
        } (${report.coverage.summary.overall.percentage.toFixed(1)}%)`
      )
      console.log('')

      if (report.recommendations.length > 0) {
        console.log('💡 Top Recommendations:')
        report.recommendations.slice(0, 3).forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec.message}`)
        })
      }
    } catch (error) {
      console.error('❌ Statistics calculation failed:')
      console.error(error.message)
      if (verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  },
})
