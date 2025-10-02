/**
 * @fileoverview Shared utilities for CLI analysis commands
 * @description Common functions for parsing, formatting, and error handling
 */

import { writeFileSync } from 'fs'

import { resolveCLIEntry } from './cli-entry-resolver.js'

/**
 * Parse common CLI options for analysis commands
 * @param {Object} args - Command line arguments
 * @returns {Object} Parsed options with defaults
 */
export function parseCliOptions(args) {
  return {
    // CLI entry resolution options
    entryFile: args['entry-file'],
    cliFile: args['cli-file'],
    cliPath: args['cli-path'] || 'src/cli.mjs',
    // Other options
    testDir: args['test-dir'] || 'test',
    format: args.format || 'text',
    output: args.output,
    verbose: args.verbose || false,
    includePatterns: (args['include-patterns'] || '.test.mjs,.test.js,.spec.mjs,.spec.js')
      .split(',')
      .map((p) => p.trim()),
    excludePatterns: (args['exclude-patterns'] || 'node_modules,.git,coverage')
      .split(',')
      .map((p) => p.trim()),
  }
}

/**
 * Resolve CLI entry point from options
 * @param {Object} options - Parsed options from parseCliOptions
 * @returns {Promise<string>} Resolved CLI path
 */
export async function resolveCliPath(options) {
  return await resolveCLIEntry({
    entryFile: options.entryFile,
    cliFile: options.cliFile,
    cliPath: options.cliPath,
    verbose: options.verbose,
  })
}

/**
 * Generate formatted analysis report
 * @param {Object} analyzer - Analyzer instance
 * @param {Object} report - Analysis report data
 * @param {Object} options - Formatting options
 * @returns {Promise<string>} Formatted report
 */
export async function generateAnalysisReport(analyzer, report, options = {}) {
  const { format = 'text', output } = options

  const formattedReport = await analyzer.formatReport(report, { format })

  if (output) {
    writeFileSync(output, formattedReport)
    return `✅ Analysis report saved to: ${output}`
  }

  return formattedReport
}

/**
 * Handle analysis errors with consistent formatting
 * @param {Error} error - Error object
 * @param {boolean} verbose - Enable verbose error output
 * @param {string} operation - Operation that failed (e.g., 'analysis', 'statistics')
 */
export function handleAnalysisError(error, verbose, operation = 'analysis') {
  console.error(`❌ AST-based ${operation} failed: ${error.message}`)

  if (verbose) {
    console.error(error.stack)
  }

  process.exit(1)
}

/**
 * Display verbose logging message
 * @param {boolean} verbose - Enable verbose output
 * @param {string} message - Message to display
 */
export function verboseLog(verbose, ...messages) {
  if (verbose) {
    console.log(...messages)
  }
}

/**
 * Display analysis metadata
 * @param {boolean} verbose - Enable verbose output
 * @param {Object} options - Analysis options
 */
export function displayAnalysisMetadata(verbose, options) {
  if (!verbose) return

  console.log('🚀 Starting AST-based CLI coverage analysis...')
  console.log(`CLI Path: ${options.cliPath}`)
  console.log(`Test Directory: ${options.testDir}`)

  if (options.format) {
    console.log(`Format: ${options.format}`)
  }
}

/**
 * Display coverage statistics summary
 * @param {Object} report - Analysis report
 */
export function displayCoverageSummary(report) {
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

  // Handle new hierarchy structure
  if (report.coverage.summary.mainCommand) {
    displayCoverageMetric(
      'Main Command',
      report.coverage.summary.mainCommand
    )
  } else if (report.coverage.summary.commands) {
    displayCoverageMetric(
      'Commands',
      report.coverage.summary.commands
    )
  }

  if (report.coverage.summary.subcommands) {
    displayCoverageMetric(
      'Subcommands',
      report.coverage.summary.subcommands
    )
  }

  displayCoverageMetric('Flags', report.coverage.summary.flags)
  displayCoverageMetric('Options', report.coverage.summary.options)
  displayCoverageMetric('Overall', report.coverage.summary.overall)
  console.log('')
}

/**
 * Display a single coverage metric
 * @param {string} label - Metric label
 * @param {Object} metric - Metric data (tested, total, percentage)
 */
function displayCoverageMetric(label, metric) {
  console.log(
    `  ${label}: ${metric.tested}/${metric.total} (${metric.percentage.toFixed(1)}%)`
  )
}

/**
 * Display recommendations from analysis
 * @param {Array} recommendations - Array of recommendation objects
 * @param {number} limit - Maximum number to display
 */
export function displayRecommendations(recommendations, limit = 3) {
  if (recommendations.length === 0) return

  console.log('💡 Top Recommendations:')
  recommendations.slice(0, limit).forEach((rec, index) => {
    console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`)
  })
}

/**
 * Display detailed command breakdown
 * @param {Object} commands - Commands object from report
 */
export function displayCommandDetails(commands) {
  console.log('')
  console.log('📋 Command Details:')

  for (const [name, command] of Object.entries(commands)) {
    const status = command.tested ? '✅' : '❌'
    console.log(`  ${status} ${name}: ${command.description}`)

    // Show subcommands if any
    if (command.subcommands && Object.keys(command.subcommands).length > 0) {
      for (const [subName, subcommand] of Object.entries(command.subcommands)) {
        const subStatus = subcommand.tested ? '✅' : '❌'
        const imported = subcommand.imported ? ' (imported)' : ''
        console.log(
          `    ${subStatus} ${name} ${subName}: ${subcommand.description}${imported}`
        )
      }
    }
  }
}

/**
 * Display untested items from coverage details
 * @param {Object} coverageDetails - Coverage details object
 */
export function displayUntestedItems(coverageDetails) {
  // Untested commands
  if (coverageDetails.untestedCommands.length > 0) {
    console.log('')
    console.log('❌ Untested Commands:')
    coverageDetails.untestedCommands.forEach((cmd) => {
      console.log(`  - ${cmd.name}: ${cmd.description}`)
    })
  }

  // Untested subcommands
  if (coverageDetails.untestedSubcommands.length > 0) {
    console.log('')
    console.log('❌ Untested Subcommands:')
    coverageDetails.untestedSubcommands.forEach((subcmd) => {
      const imported = subcmd.imported ? ' (imported)' : ''
      console.log(
        `  - ${subcmd.command} ${subcmd.subcommand}: ${subcmd.description}${imported}`
      )
    })
  }

  // Untested flags
  if (coverageDetails.untestedFlags.length > 0) {
    console.log('')
    console.log('❌ Untested Flags:')
    coverageDetails.untestedFlags.forEach((flag) => {
      const global = flag.global ? ' (global)' : ''
      console.log(`  - --${flag.name}: ${flag.description}${global}`)
    })
  }
}

/**
 * Validate result object for consistency
 * @param {Object} result - Result object to validate
 * @returns {Object} Validated and normalized result
 */
export function validateResult(result) {
  return {
    success: result.exitCode === 0,
    exitCode: result.exitCode || 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    durationMs: result.durationMs || 0,
    ...result,
  }
}
