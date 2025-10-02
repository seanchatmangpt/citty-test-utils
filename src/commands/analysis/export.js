/**
 * @fileoverview Export coverage data subcommand
 * @description Export coverage data in structured formats (JSON, Turtle)
 */

import { defineCommand } from 'citty'
import { EnhancedASTCLIAnalyzer } from '../../core/coverage/enhanced-ast-cli-analyzer.js'
import { CLCoverageAnalyzer } from '../../core/coverage/cli-coverage-analyzer.js'
import { parseCliOptions, resolveCliPath } from '../../core/utils/analysis-helpers.js'
import { getCLIEntryArgs } from '../../core/utils/cli-entry-resolver.js'
import { writeFileSync } from 'fs'

export const exportCommand = defineCommand({
  meta: {
    name: 'export',
    description: '🚀 AST-based coverage data export (JSON, Turtle)',
  },
  args: {
    ...getCLIEntryArgs(),
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
    format: {
      type: 'string',
      description: 'Export format (json, turtle)',
      default: 'json',
    },
    output: {
      type: 'string',
      description: 'Output file path (required for export)',
      required: true,
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
    'base-uri': {
      type: 'string',
      description: 'Base URI for Turtle/RDF output',
      default: 'http://example.org/cli',
    },
    'cli-name': {
      type: 'string',
      description: 'CLI name for Turtle/RDF output',
      default: 'cli',
    },
  },
  run: async (ctx) => {
    try {
      // Parse CLI options using shared utility
      const options = parseCliOptions(ctx.args)
      const { format, output, verbose } = ctx.args
      const baseUri = ctx.args['base-uri']
      const cliName = ctx.args['cli-name']

      // Resolve CLI entry point (supports --entry-file, --cli-file, auto-detection)
      const resolvedCliPath = await resolveCliPath(options)

      if (verbose) {
        console.log('🚀 Starting AST-based CLI coverage analysis...')
        console.log(`CLI Path: ${resolvedCliPath}`)
        console.log(`Test Directory: ${options.testDir}`)
        console.log(`Format: ${format}`)
        console.log(`Output: ${output}`)
      }

      // Use AST-based analyzer for JSON, legacy analyzer for Turtle
      if (format === 'turtle') {
        const exportOptions = {
          cliPath: resolvedCliPath,
          testDir: options.testDir,
          format,
          verbose,
          includePatterns: options.includePatterns,
          excludePatterns: options.excludePatterns,
          baseUri,
          cliName,
        }

        const analyzer = new CLCoverageAnalyzer(exportOptions)
        const report = await analyzer.analyze(exportOptions)
        const formattedReport = await analyzer.formatReport(report, exportOptions)

        writeFileSync(output, formattedReport)
        console.log(`✅ Coverage data exported to: ${output}`)
        console.log(`📊 Format: ${format.toUpperCase()}`)
        console.log(
          `📈 Overall Coverage: ${report.coverage.summary.overall.percentage.toFixed(1)}%`
        )
      } else {
        // Use AST-based analyzer for JSON
        const analyzer = new EnhancedASTCLIAnalyzer({
          cliPath: resolvedCliPath,
          testDir: options.testDir,
          includePatterns: options.includePatterns,
          excludePatterns: options.excludePatterns,
          verbose: options.verbose,
        })

        const report = await analyzer.analyze()
        const formattedReport = await analyzer.formatReport(report, { format })

        writeFileSync(output, formattedReport)
        console.log(`✅ AST-based coverage data exported to: ${output}`)
        console.log(`📊 Format: ${format.toUpperCase()}`)
        console.log(
          `📈 Overall Coverage: ${report.coverage.summary.overall.percentage.toFixed(1)}%`
        )
      }
    } catch (error) {
      console.error(`❌ AST-based export failed: ${error.message}`)
      if (ctx.args.verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  },
})
