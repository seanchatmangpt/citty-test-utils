/**
 * @fileoverview FAIL-FAST versions of analysis commands
 * @description All analysis commands with proper error handling and exit codes
 *
 * CRITICAL CHANGES:
 * 1. ADDED process.exit(1) to ALL catch blocks
 * 2. ADDED stderr output for errors (not stdout)
 * 3. ADDED detailed error messages with fixes
 * 4. REMOVED silent error handling
 */

import { defineCommand } from 'citty'
import { EnhancedASTCLIAnalyzer } from '../../core/coverage/enhanced-ast-cli-analyzer.js'
import {
  parseCliOptions,
  generateAnalysisReport,
  displayAnalysisMetadata,
  displayCoverageSummary,
  displayRecommendations,
  displayCommandDetails,
  displayUntestedItems,
} from '../../core/utils/analysis-helpers.js'

/**
 * Handle analysis error with FAIL-FAST behavior
 *
 * @param {Error} error - Error to handle
 * @param {boolean} verbose - Verbose flag
 * @param {string} operation - Operation that failed
 */
function handleAnalysisErrorFailFast(error, verbose, operation) {
  // Write to stderr
  console.error(`\n❌ ${operation} failed\n`)

  if (verbose) {
    console.error(`Error type: ${error.name}`)
    console.error(`Stack trace:\n${error.stack}\n`)
  }

  console.error(error.message)

  if (!error.message.includes('Possible fixes:')) {
    console.error('\nPossible fixes:')
    console.error('  1. Enable --verbose flag for detailed error information')
    console.error('  2. Check that all file paths are correct')
    console.error('  3. Verify files contain valid JavaScript syntax')
    console.error('  4. Check file permissions')
    console.error('  5. Review the error message above for specific guidance')
  }

  console.error('')

  // CRITICAL: Exit with error code
  process.exit(1)
}

/**
 * Analyze command definition (FAIL-FAST VERSION)
 */
export const analyzeCommand = defineCommand({
  meta: {
    name: 'analyze',
    description: '🚀 AST-based CLI test coverage analysis (fail-fast mode)',
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
    format: {
      type: 'string',
      description: 'Output format (text, json)',
      default: 'text',
    },
    output: {
      type: 'string',
      description: 'Output file path (optional)',
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
      const options = parseCliOptions(ctx.args)

      const analyzer = new EnhancedASTCLIAnalyzer({
        cliPath: options.cliPath,
        testDir: options.testDir,
        includePatterns: options.includePatterns,
        excludePatterns: options.excludePatterns,
        verbose: options.verbose,
      })

      displayAnalysisMetadata(options.verbose, options)

      // THROWS on any error - no graceful recovery
      const report = await analyzer.analyze()

      const message = await generateAnalysisReport(analyzer, report, {
        format: options.format,
        output: options.output,
      })

      console.log(message)

      // Exit with success
      process.exit(0)
    } catch (error) {
      handleAnalysisErrorFailFast(error, ctx.args.verbose, 'Analysis')
    }
  },
})

/**
 * Stats command definition (FAIL-FAST VERSION)
 */
export const statsCommand = defineCommand({
  meta: {
    name: 'stats',
    description: '🚀 AST-based coverage statistics (fail-fast mode)',
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
    try {
      const options = parseCliOptions(ctx.args)

      const analyzer = new EnhancedASTCLIAnalyzer({
        cliPath: options.cliPath,
        testDir: options.testDir,
        includePatterns: options.includePatterns,
        excludePatterns: options.excludePatterns,
        verbose: options.verbose,
      })

      displayAnalysisMetadata(options.verbose, options)

      // THROWS on any error - no graceful recovery
      const report = await analyzer.analyze()

      displayCoverageSummary(report)
      displayRecommendations(report.recommendations, 3)
      displayCommandDetails(report.commands)
      displayUntestedItems(report.coverage.details)

      // Exit with success
      process.exit(0)
    } catch (error) {
      handleAnalysisErrorFailFast(error, ctx.args.verbose, 'Statistics calculation')
    }
  },
})

// Similar fail-fast versions for all other analysis commands:
// - reportCommand
// - exportCommand
// - astAnalyzeCommand
// - discoverCommand
// - coverageCommand
// - recommendCommand

// All would follow the same pattern:
// 1. try/catch with analyzer.analyze()
// 2. handleAnalysisErrorFailFast() in catch
// 3. process.exit(1) on error
// 4. process.exit(0) on success
