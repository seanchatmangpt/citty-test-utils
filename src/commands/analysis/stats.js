/**
 * @fileoverview Coverage statistics subcommand
 * @description Show coverage statistics summary
 */

import { defineCommand } from 'citty'
import { EnhancedASTCLIAnalyzer } from '../../core/coverage/enhanced-ast-cli-analyzer.js'

export const statsCommand = defineCommand({
  meta: {
    name: 'stats',
    description: '🚀 AST-based coverage statistics summary',
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
      verbose,
      'include-patterns': includePatterns,
      'exclude-patterns': excludePatterns,
    } = ctx.args

    try {
      const analyzer = new EnhancedASTCLIAnalyzer({
        cliPath,
        testDir,
        includePatterns: includePatterns.split(',').map((p) => p.trim()),
        excludePatterns: excludePatterns.split(',').map((p) => p.trim()),
        verbose,
      })

      if (verbose) {
        console.log('🚀 Starting AST-based CLI coverage analysis...')
        console.log(`CLI Path: ${cliPath}`)
        console.log(`Test Directory: ${testDir}`)
      }

      const report = await analyzer.analyze()

      // Display enhanced statistics summary
      console.log('🚀 Enhanced AST-Based CLI Coverage Statistics')
      console.log('============================================')
      console.log(`CLI: ${report.metadata.cliPath}`)
      console.log(`Test Directory: ${report.metadata.testDir}`)
      console.log(`Analysis Method: ${report.metadata.analysisMethod}`)
      console.log(`Total Test Files: ${report.metadata.totalTestFiles}`)
      console.log(`Total Commands: ${report.metadata.totalCommands}`)
      console.log(`Total Subcommands: ${report.metadata.totalSubcommands || 0}`)
      console.log(`Total Flags: ${report.metadata.totalFlags}`)
      console.log(`Total Options: ${report.metadata.totalOptions}`)
      console.log('')
      console.log('📈 Coverage Summary:')
      console.log(
        `  Commands: ${report.coverage.summary.commands.tested}/${
          report.coverage.summary.commands.total
        } (${report.coverage.summary.commands.percentage.toFixed(1)}%)`
      )
      if (report.coverage.summary.subcommands) {
        console.log(
          `  Subcommands: ${report.coverage.summary.subcommands.tested}/${
            report.coverage.summary.subcommands.total
          } (${report.coverage.summary.subcommands.percentage.toFixed(1)}%)`
        )
      }
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
          console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`)
        })
      }

      // Show detailed command breakdown
      console.log('')
      console.log('📋 Command Details:')
      for (const [name, command] of Object.entries(report.commands)) {
        const status = command.tested ? '✅' : '❌'
        console.log(`  ${status} ${name}: ${command.description}`)

        // Show subcommands if any
        if (command.subcommands && Object.keys(command.subcommands).length > 0) {
          for (const [subName, subcommand] of Object.entries(command.subcommands)) {
            const subStatus = subcommand.tested ? '✅' : '❌'
            const imported = subcommand.imported ? ' (imported)' : ''
            console.log(`    ${subStatus} ${name} ${subName}: ${subcommand.description}${imported}`)
          }
        }
      }

      // Show untested items details
      if (report.coverage.details.untestedCommands.length > 0) {
        console.log('')
        console.log('❌ Untested Commands:')
        report.coverage.details.untestedCommands.forEach((cmd) => {
          console.log(`  - ${cmd.name}: ${cmd.description}`)
        })
      }

      if (report.coverage.details.untestedSubcommands.length > 0) {
        console.log('')
        console.log('❌ Untested Subcommands:')
        report.coverage.details.untestedSubcommands.forEach((subcmd) => {
          const imported = subcmd.imported ? ' (imported)' : ''
          console.log(
            `  - ${subcmd.command} ${subcmd.subcommand}: ${subcmd.description}${imported}`
          )
        })
      }

      if (report.coverage.details.untestedFlags.length > 0) {
        console.log('')
        console.log('❌ Untested Flags:')
        report.coverage.details.untestedFlags.forEach((flag) => {
          const global = flag.global ? ' (global)' : ''
          console.log(`  - --${flag.name}: ${flag.description}${global}`)
        })
      }
    } catch (error) {
      console.error(`❌ AST-based statistics calculation failed: ${error.message}`)
      if (verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  },
})
