#!/usr/bin/env node
/**
 * @fileoverview Coverage analysis subcommand
 * @description Analyze test coverage using AST-based pattern matching for accurate results
 */

import { defineCommand } from 'citty'
import { EnhancedASTCLIAnalyzer } from '../../core/coverage/enhanced-ast-cli-analyzer.js'
import { resolveCLIEntry, getCLIEntryArgs } from '../../core/utils/cli-entry-resolver.js'
import {
  validateCLIPath,
  buildAnalysisMetadata,
} from '../../core/utils/analysis-report-utils.js'
import { writeFileSync } from 'fs'

export const coverageCommand = defineCommand({
  meta: {
    name: 'coverage',
    description: '📊 Analyze test coverage using AST-based pattern matching for accurate results',
  },
  args: {
    ...getCLIEntryArgs(),
    'test-dir': {
      type: 'string',
      description: 'Directory containing test files',
      default: 'test',
    },
    format: {
      type: 'string',
      description: 'Output format (text, json, html)',
      default: 'text',
    },
    output: {
      type: 'string',
      description: 'Output file path (optional)',
    },
    threshold: {
      type: 'string',
      description: 'Coverage threshold percentage (e.g., 80)',
      default: '0',
    },
    trends: {
      type: 'boolean',
      description: 'Include trend analysis',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Enable detailed output',
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
      'entry-file': entryFile,
      'cli-file': cliFile,
      'cli-path': cliPath,
      'test-dir': testDir,
      format,
      output,
      threshold,
      trends,
      verbose,
      'include-patterns': includePatterns,
      'exclude-patterns': excludePatterns,
    } = ctx.args

    try {
      // Resolve CLI entry point (supports --entry-file, --cli-file, auto-detection)
      const finalCLIPath = await resolveCLIEntry({
        entryFile,
        cliFile,
        cliPath,
        verbose,
      })

      const analyzer = new EnhancedASTCLIAnalyzer({
        cliPath: finalCLIPath,
        testDir,
        includePatterns: includePatterns.split(',').map((p) => p.trim()),
        excludePatterns: excludePatterns.split(',').map((p) => p.trim()),
        verbose,
      })

      if (verbose) {
        console.log('📊 Starting test coverage analysis...')
        console.log(`CLI Path: ${finalCLIPath}`)
        console.log(`Test Directory: ${testDir}`)
        console.log(`Format: ${format}`)
        console.log(`Threshold: ${threshold}%`)
        console.log(`Trends: ${trends}`)
      }

      // Perform coverage analysis with better error handling
      let report
      try {
        report = await analyzer.analyze()

        // Validate report structure
        if (!report || !report.coverage || !report.coverage.summary) {
          throw new Error(
            'Invalid analysis result: missing coverage data. ' +
              'This may occur with complex CLI structures. ' +
              'Try using --cli-path to specify exact CLI file.'
          )
        }
      } catch (analysisError) {
        // Provide helpful error message for complex projects
        if (analysisError.message.includes('Cannot convert undefined or null')) {
          console.error('❌ Coverage analysis failed for this CLI structure.')
          console.error('')
          console.error('This is a known issue with complex CLI architectures.')
          console.error('Possible solutions:')
          console.error('  1. Try the "discover" command instead for CLI structure analysis')
          console.error('  2. Use "recommend" command for test recommendations')
          console.error('  3. Check that your CLI file has valid citty commands')
          console.error('')
          console.error(`Debug info: CLI Path = ${finalCLIPath}`)
          if (verbose) {
            console.error('')
            console.error('Full error:')
            console.error(analysisError.stack)
          }
          process.exit(1)
        }
        throw analysisError
      }

      // Generate coverage report
      const coverageReport = generateCoverageReport(report, {
        cliPath,
        testDir,
        format,
        threshold: parseFloat(threshold),
        trends,
        verbose,
      })

      // Check threshold
      const overallCoverage = report.coverage.summary.overall.percentage
      if (parseFloat(threshold) > 0 && overallCoverage < parseFloat(threshold)) {
        console.error(`❌ Coverage threshold not met: ${overallCoverage.toFixed(1)}% < ${threshold}%`)
        process.exit(1)
      }

      if (output) {
        writeFileSync(output, coverageReport)
        console.log(`✅ Coverage analysis saved to: ${output}`)
      } else {
        console.log(coverageReport)
      }
    } catch (error) {
      console.error(`❌ Coverage analysis failed: ${error.message}`)
      if (verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  },
})

/**
 * Generate coverage report
 * @param {Object} report - Analysis report
 * @param {Object} options - Report options
 * @returns {string} Formatted coverage report
 */
function generateCoverageReport(report, options) {
  const { format, threshold, trends, verbose } = options

  switch (format.toLowerCase()) {
    case 'json':
      return generateJSONCoverageReport(report, options)
    case 'html':
      return generateHTMLCoverageReport(report, options)
    case 'text':
    default:
      return generateTextCoverageReport(report, options)
  }
}

/**
 * Generate text format coverage report
 * @param {Object} report - Analysis report
 * @param {Object} options - Report options
 * @returns {string} Text coverage report
 */
function generateTextCoverageReport(report, options) {
  const { cliPath, testDir, threshold, trends, verbose } = options
  const lines = []

  lines.push('📊 Test Coverage Analysis Report')
  lines.push('='.repeat(40))
  lines.push('')

  // Summary
  lines.push('📈 Coverage Summary:')
  lines.push(`  CLI Path: ${cliPath}`)
  lines.push(`  Test Directory: ${testDir}`)
  lines.push(`  Analysis Method: ${report.metadata.analysisMethod}`)
  lines.push(`  Threshold: ${threshold}%`)
  lines.push('')

  // Coverage Statistics
  const coverage = report.coverage.summary
  lines.push('📊 Coverage Statistics:')
  
  // Handle new hierarchy structure
  if (coverage.mainCommand) {
    lines.push(
      `  Main Command: ${coverage.mainCommand.tested}/${coverage.mainCommand.total} (${coverage.mainCommand.percentage.toFixed(1)}%)`
    )
  } else if (coverage.commands) {
    lines.push(
      `  Commands: ${coverage.commands.tested}/${coverage.commands.total} (${coverage.commands.percentage.toFixed(1)}%)`
    )
  }
  
  if (coverage.subcommands) {
    lines.push(
      `  Subcommands: ${coverage.subcommands.tested}/${coverage.subcommands.total} (${coverage.subcommands.percentage.toFixed(1)}%)`
    )
  }
  lines.push(
    `  Flags: ${coverage.flags.tested}/${coverage.flags.total} (${coverage.flags.percentage.toFixed(1)}%)`
  )
  lines.push(
    `  Options: ${coverage.options.tested}/${coverage.options.total} (${coverage.options.percentage.toFixed(1)}%)`
  )
  lines.push(
    `  Overall: ${coverage.overall.tested}/${coverage.overall.total} (${coverage.overall.percentage.toFixed(1)}%)`
  )
  lines.push('')

  // Threshold Status
  if (threshold > 0) {
    const status = coverage.overall.percentage >= threshold ? '✅' : '❌'
    lines.push(`🎯 Threshold Status: ${status} ${coverage.overall.percentage.toFixed(1)}% >= ${threshold}%`)
    lines.push('')
  }

  // Command Coverage Details with null/undefined safety
  lines.push('📋 Command Coverage Details:')
  const commands = report.commands || {}
  for (const [name, command] of Object.entries(commands)) {
    const status = command.tested ? '✅' : '❌'
    lines.push(`  ${status} ${name}: ${command.description || 'No description'}`)

    // Subcommands
    if (command.subcommands && Object.keys(command.subcommands).length > 0) {
      for (const [subName, subcommand] of Object.entries(command.subcommands)) {
        const subStatus = subcommand.tested ? '✅' : '❌'
        const imported = subcommand.imported ? ' (imported)' : ''
        lines.push(`    ${subStatus} ${name} ${subName}: ${subcommand.description || 'No description'}${imported}`)
      }
    }

    // Flags
    if (command.flags && Object.keys(command.flags).length > 0) {
      for (const [flagName, flag] of Object.entries(command.flags)) {
        const flagStatus = flag.tested ? '✅' : '❌'
        lines.push(`      ${flagStatus} --${flagName}: ${flag.description || 'No description'}`)
      }
    }

    // Options
    if (command.options && Object.keys(command.options).length > 0) {
      for (const [optionName, option] of Object.entries(command.options)) {
        const optionStatus = option.tested ? '✅' : '❌'
        lines.push(`      ${optionStatus} --${optionName}: ${option.description || 'No description'}`)
      }
    }
  }
  lines.push('')

  // Global Options Coverage with null/undefined safety
  const globalOptions = report.globalOptions || {}
  if (Object.keys(globalOptions).length > 0) {
    lines.push('🌐 Global Options Coverage:')
    for (const [name, option] of Object.entries(globalOptions)) {
      const status = option.tested ? '✅' : '❌'
      const type = option.isFlag ? 'flag' : 'option'
      lines.push(`  ${status} --${name} (${type}): ${option.description || 'No description'}`)
    }
    lines.push('')
  }

  // Untested Items
  const details = report.coverage.details
  if (details.untestedCommands.length > 0) {
    lines.push('❌ Untested Commands:')
    details.untestedCommands.forEach((cmd) => {
      lines.push(`  - ${cmd.name}: ${cmd.description}`)
    })
    lines.push('')
  }

  if (details.untestedSubcommands.length > 0) {
    lines.push('❌ Untested Subcommands:')
    details.untestedSubcommands.forEach((subcmd) => {
      const imported = subcmd.imported ? ' (imported)' : ''
      lines.push(`  - ${subcmd.command} ${subcmd.subcommand}: ${subcmd.description}${imported}`)
    })
    lines.push('')
  }

  if (details.untestedFlags.length > 0) {
    lines.push('❌ Untested Flags:')
    details.untestedFlags.forEach((flag) => {
      const global = flag.global ? ' (global)' : ''
      lines.push(`  - --${flag.name}: ${flag.description}${global}`)
    })
    lines.push('')
  }

  if (details.untestedOptions.length > 0) {
    lines.push('❌ Untested Options:')
    details.untestedOptions.forEach((option) => {
      const global = option.global ? ' (global)' : ''
      lines.push(`  - --${option.name}: ${option.description}${global}`)
    })
    lines.push('')
  }

  // Trend Analysis
  if (trends) {
    lines.push('📈 Trend Analysis:')
    lines.push('  Coverage trends over time would be displayed here')
    lines.push('  (Requires historical data collection)')
    lines.push('')
  }

  // Analysis Metadata
  if (verbose) {
    lines.push('ℹ️  Analysis Metadata:')
    lines.push(`  Analyzed At: ${new Date(report.metadata.analyzedAt).toLocaleString()}`)
    lines.push(`  CLI Path: ${report.metadata.cliPath}`)
    lines.push(`  Test Directory: ${report.metadata.testDir}`)
    lines.push(`  Analysis Method: ${report.metadata.analysisMethod}`)
    lines.push(`  Total Test Files: ${report.metadata.totalTestFiles}`)
    lines.push(`  Total Commands: ${report.metadata.totalCommands}`)
    lines.push(`  Total Subcommands: ${report.metadata.totalSubcommands || 0}`)
    lines.push(`  Total Flags: ${report.metadata.totalFlags}`)
    lines.push(`  Total Options: ${report.metadata.totalOptions}`)
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Generate JSON format coverage report
 * @param {Object} report - Analysis report
 * @param {Object} options - Report options
 * @returns {string} JSON coverage report
 */
function generateJSONCoverageReport(report, options) {
  const { threshold, trends, verbose } = options

  const coverageReport = {
    metadata: buildAnalysisMetadata({
      cliPath: report.metadata.cliPath,
      additionalFields: {
        threshold,
        trends,
        verbose,
        testDir: report.metadata.testDir,
      },
    }),
    coverage: report.coverage,
    commands: report.commands,
    globalOptions: report.globalOptions,
    recommendations: report.recommendations,
  }

  if (trends) {
    coverageReport.trends = {
      message: 'Trend analysis requires historical data collection',
      available: false,
    }
  }

  return JSON.stringify(coverageReport, null, 2)
}

/**
 * Generate HTML format coverage report
 * @param {Object} report - Analysis report
 * @param {Object} options - Report options
 * @returns {string} HTML coverage report
 */
function generateHTMLCoverageReport(report, options) {
  const { cliPath, testDir, threshold, trends, verbose } = options
  const coverage = report.coverage.summary

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Coverage Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .coverage-item { margin: 10px 0; }
        .coverage-bar { background: #ddd; height: 20px; border-radius: 10px; overflow: hidden; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); }
        .untested { background: #f44336; }
        .tested { background: #4CAF50; }
        .command { margin: 15px 0; padding: 10px; border-left: 4px solid #2196F3; }
        .subcommand { margin: 5px 0 5px 20px; }
        .flag, .option { margin: 5px 0 5px 40px; font-size: 0.9em; }
        .status { font-weight: bold; }
        .metadata { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Test Coverage Analysis Report</h1>
        <p><strong>CLI Path:</strong> ${cliPath}</p>
        <p><strong>Test Directory:</strong> ${testDir}</p>
        <p><strong>Analysis Method:</strong> ${report.metadata.analysisMethod}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <h2>📈 Coverage Summary</h2>
        <div class="coverage-item">
            <strong>Commands:</strong> ${coverage.commands.tested}/${coverage.commands.total} (${coverage.commands.percentage.toFixed(1)}%)
            <div class="coverage-bar">
                <div class="coverage-fill" style="width: ${coverage.commands.percentage}%"></div>
            </div>
        </div>
        ${coverage.subcommands ? `
        <div class="coverage-item">
            <strong>Subcommands:</strong> ${coverage.subcommands.tested}/${coverage.subcommands.total} (${coverage.subcommands.percentage.toFixed(1)}%)
            <div class="coverage-bar">
                <div class="coverage-fill" style="width: ${coverage.subcommands.percentage}%"></div>
            </div>
        </div>
        ` : ''}
        <div class="coverage-item">
            <strong>Flags:</strong> ${coverage.flags.tested}/${coverage.flags.total} (${coverage.flags.percentage.toFixed(1)}%)
            <div class="coverage-bar">
                <div class="coverage-fill" style="width: ${coverage.flags.percentage}%"></div>
            </div>
        </div>
        <div class="coverage-item">
            <strong>Options:</strong> ${coverage.options.tested}/${coverage.options.total} (${coverage.options.percentage.toFixed(1)}%)
            <div class="coverage-bar">
                <div class="coverage-fill" style="width: ${coverage.options.percentage}%"></div>
            </div>
        </div>
        <div class="coverage-item">
            <strong>Overall:</strong> ${coverage.overall.tested}/${coverage.overall.total} (${coverage.overall.percentage.toFixed(1)}%)
            <div class="coverage-bar">
                <div class="coverage-fill ${coverage.overall.percentage >= threshold ? 'tested' : 'untested'}" style="width: ${coverage.overall.percentage}%"></div>
            </div>
        </div>
    </div>

    <h2>📋 Command Coverage Details</h2>
    ${Object.entries(report.commands).map(([name, command]) => `
    <div class="command">
        <div class="status ${command.tested ? 'tested' : 'untested'}">${command.tested ? '✅' : '❌'} ${name}: ${command.description || 'No description'}</div>
        ${command.subcommands ? Object.entries(command.subcommands).map(([subName, subcommand]) => `
        <div class="subcommand ${subcommand.tested ? 'tested' : 'untested'}">${subcommand.tested ? '✅' : '❌'} ${name} ${subName}: ${subcommand.description || 'No description'}</div>
        `).join('') : ''}
        ${command.flags ? Object.entries(command.flags).map(([flagName, flag]) => `
        <div class="flag ${flag.tested ? 'tested' : 'untested'}">${flag.tested ? '✅' : '❌'} --${flagName}: ${flag.description || 'No description'}</div>
        `).join('') : ''}
        ${command.options ? Object.entries(command.options).map(([optionName, option]) => `
        <div class="option ${option.tested ? 'tested' : 'untested'}">${option.tested ? '✅' : '❌'} --${optionName}: ${option.description || 'No description'}</div>
        `).join('') : ''}
    </div>
    `).join('')}

    ${verbose ? `
    <div class="metadata">
        <h2>ℹ️ Analysis Metadata</h2>
        <p><strong>Analyzed At:</strong> ${new Date(report.metadata.analyzedAt).toLocaleString()}</p>
        <p><strong>Total Test Files:</strong> ${report.metadata.totalTestFiles}</p>
        <p><strong>Total Commands:</strong> ${report.metadata.totalCommands}</p>
        <p><strong>Total Subcommands:</strong> ${report.metadata.totalSubcommands || 0}</p>
        <p><strong>Total Flags:</strong> ${report.metadata.totalFlags}</p>
        <p><strong>Total Options:</strong> ${report.metadata.totalOptions}</p>
    </div>
    ` : ''}
</body>
</html>`
}
