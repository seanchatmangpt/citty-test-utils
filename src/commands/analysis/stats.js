/**
 * @fileoverview Coverage statistics subcommand
 * @description Show coverage statistics summary
 */

import { defineCommand } from 'citty'
import { EnhancedASTCLIAnalyzer } from '../../core/coverage/enhanced-ast-cli-analyzer.js'
import {
  parseCliOptions,
  resolveCliPath,
  handleAnalysisError,
  displayAnalysisMetadata,
  displayCoverageSummary,
  displayRecommendations,
  displayCommandDetails,
  displayUntestedItems,
} from '../../core/utils/analysis-helpers.js'
import { getCLIEntryArgs } from '../../core/utils/cli-entry-resolver.js'

/**
 * Statistics command definition
 * Displays comprehensive coverage statistics summary
 */
export const statsCommand = defineCommand({
  meta: {
    name: 'stats',
    description: '🚀 AST-based coverage statistics summary',
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
    try {
      // Parse CLI options using shared utility
      const options = parseCliOptions(ctx.args)

      // Resolve CLI entry point (supports --entry-file, --cli-file, auto-detection)
      const resolvedCliPath = await resolveCliPath(options)

      // Create analyzer instance
      const analyzer = new EnhancedASTCLIAnalyzer({
        cliPath: resolvedCliPath,
        testDir: options.testDir,
        includePatterns: options.includePatterns,
        excludePatterns: options.excludePatterns,
        verbose: options.verbose,
      })

      // Display metadata if verbose
      displayAnalysisMetadata(options.verbose, options)

      // Perform analysis
      const report = await analyzer.analyze()

      // Display enhanced statistics using shared utilities
      displayCoverageSummary(report)
      displayRecommendations(report.recommendations, 3)
      displayCommandDetails(report.commands)
      displayUntestedItems(report.coverage.details)
    } catch (error) {
      handleAnalysisError(error, ctx.args.verbose, 'statistics calculation')
    }
  },
})
