/**
 * @fileoverview Generate coverage report subcommand
 * @description Generate a detailed coverage report
 */

import { defineCommand } from 'citty'
import { EnhancedASTCLIAnalyzer } from '../../core/coverage/enhanced-ast-cli-analyzer.js'
import { parseCliOptions, resolveCliPath } from '../../core/utils/analysis-helpers.js'
import { getCLIEntryArgs } from '../../core/utils/cli-entry-resolver.js'
import { writeFileSync } from 'fs'

export const reportCommand = defineCommand({
  meta: {
    name: 'report',
    description: '🚀 AST-based detailed coverage report',
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
    try {
      // Parse CLI options using shared utility
      const options = parseCliOptions(ctx.args)

      // Resolve CLI entry point (supports --entry-file, --cli-file, auto-detection)
      const resolvedCliPath = await resolveCliPath(options)

      const analyzer = new EnhancedASTCLIAnalyzer({
        cliPath: resolvedCliPath,
        testDir: options.testDir,
        includePatterns: options.includePatterns,
        excludePatterns: options.excludePatterns,
        verbose: options.verbose,
      })

      if (options.verbose) {
        console.log('🚀 Starting AST-based CLI coverage analysis...')
        console.log(`CLI Path: ${resolvedCliPath}`)
        console.log(`Test Directory: ${options.testDir}`)
        console.log(`Format: ${options.format}`)
      }

      const report = await analyzer.analyze()
      const formattedReport = await analyzer.formatReport(report, { format: options.format })

      if (options.output) {
        writeFileSync(options.output, formattedReport)
        console.log(`✅ AST-based report saved to: ${options.output}`)
      } else {
        console.log(formattedReport)
      }
    } catch (error) {
      console.error(`❌ AST-based report generation failed: ${error.message}`)
      if (options.verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  },
})
