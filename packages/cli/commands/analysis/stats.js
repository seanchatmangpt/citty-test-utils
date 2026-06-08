/**
 * @fileoverview Coverage statistics subcommand
 * @description Show coverage statistics summary with AST caching
 */

import { defineCommand } from 'citty'
import { consola } from '@un-test/core'
import { ASTAnalyzer } from '@un-test/coverage'
import {
  parseCliOptions,
  resolveCliPath,
  handleAnalysisError,
  displayAnalysisMetadata,
  displayCommandDetails,
  displayUntestedItems,
} from '@un-test/coverage'
import { getCLIEntryArgs } from '@un-test/coverage'

/**
 * Statistics command definition
 */
export const statsCommand = defineCommand({
  meta: {
    name: 'stats',
    description: 'Show coverage statistics summary',
  },
  args: {
    ...getCLIEntryArgs(),
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
    if (!ctx.args.json) {
      console.log('📊 Calculating CLI coverage statistics...')
    }
    try {
      const options = parseCliOptions(ctx.args)
      const resolvedCliPath = await resolveCliPath(options)

      const analyzer = new ASTAnalyzer({
        cliPath: resolvedCliPath,
        testDir: options.testDir,
        includePatterns: options.includePatterns,
        excludePatterns: options.excludePatterns,
        verbose: options.verbose,
      })

      const report = await analyzer.analyze()
      const { summary } = report.coverage

      console.log('📊 CLI Coverage Summary:')
      console.log(`  Main Command: ${summary.mainCommand.tested}/${summary.mainCommand.total} (${summary.mainCommand.percentage.toFixed(1)}%)`)
      console.log(`  Subcommands:  ${summary.subcommands.tested}/${summary.subcommands.total} (${summary.subcommands.percentage.toFixed(1)}%)`)
      console.log(`  Overall:      ${summary.overall.tested}/${summary.overall.total} (${summary.overall.percentage.toFixed(1)}%)`)

      displayCommandDetails(report.commands)
      displayUntestedItems(report.coverage.details)
    } catch (error) {
      handleAnalysisError(error, ctx.args.verbose, 'statistics calculation')
    }
  },
})
