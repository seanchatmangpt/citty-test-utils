import { consola } from '../../core/utils/logging.js'
/**
 * @fileoverview Generate coverage report subcommand
 * @description Generate a detailed coverage report with AST caching
 */

import { defineCommand } from 'citty'
import { ASTAnalyzer } from '../../core/coverage/ast-analyzer.js'
import { parseCliOptions, resolveCliPath } from '../../core/utils/analysis-helpers.js'
import { getCLIEntryArgs } from '../../core/utils/cli-entry-resolver.js'
import { writeFileSync } from 'node:fs'

export const reportCommand = defineCommand({
  meta: {
    name: 'report',
    description: 'Generate a detailed coverage report',
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
    if (ctx.args.format !== 'json') {
      consola.start('📊 Generating CLI coverage report...')
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
      const formattedReport = options.format === 'json' 
        ? JSON.stringify(report, null, 2)
        : await formatTextReport(report)

      if (options.output) {
        writeFileSync(options.output, formattedReport)
        consola.success(`✅ AST-based report saved to: ${options.output}`)
      } else {
        console.log(formattedReport)
      }
    } catch (error) {
      consola.error(`❌ AST-based report generation failed: ${error.message}`)
      if (ctx.args.verbose) {
        consola.error(error.stack)
      }
      process.exit(1)
    }
  },
})

/**
 * Format text report (helper for consolidated analyzer)
 */
async function formatTextReport(report) {
  const lines = []
  lines.push('🚀 Optimized AST-Based CLI Test Coverage Analysis')
  lines.push('='.repeat(50))
  lines.push('')
  lines.push('📈 Summary:')
  lines.push(`  Main Command: ${report.coverage.summary.mainCommand.tested ? '✅' : '❌'} (${report.coverage.summary.mainCommand.percentage.toFixed(1)}%)`)
  lines.push(`  Subcommands:  ${report.coverage.summary.subcommands.tested}/${report.coverage.summary.subcommands.total} (${report.coverage.summary.subcommands.percentage.toFixed(1)}%)`)
  lines.push(`  Overall:      ${report.coverage.summary.overall.tested}/${report.coverage.summary.overall.total} (${report.coverage.summary.overall.percentage.toFixed(1)}%)`)
  lines.push('')
  lines.push('ℹ️  Analysis Info:')
  lines.push(`  CLI Path: ${report.metadata.cliPath}`)
  lines.push(`  Test Dir: ${report.metadata.testDir}`)
  lines.push(`  Test Files: ${report.metadata.totalTestFiles}`)
  lines.push('')
  
  if (report.recommendations.length > 0) {
    lines.push('💡 Recommendations:')
    report.recommendations.forEach(r => lines.push(`  - [${r.priority.toUpperCase()}] ${r.message}`))
  }
  
  return lines.join('\n')
}
