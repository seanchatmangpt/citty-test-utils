import { consola } from '../../core/utils/logging.js'
/**
 * @fileoverview Export coverage data subcommand
 * @description Export coverage data in structured formats (JSON, Turtle) with AST caching
 */

import { defineCommand } from 'citty'
import { ASTAnalyzer } from '../../core/coverage/ast-analyzer.js'
import { CLCoverageAnalyzer } from '../../core/coverage/cli-coverage-analyzer.js'
import { parseCliOptions, resolveCliPath } from '../../core/utils/analysis-helpers.js'
import { getCLIEntryArgs } from '../../core/utils/cli-entry-resolver.js'
import { writeFileSync } from 'node:fs'

export const exportCommand = defineCommand({
  meta: {
    name: 'export',
    description: 'Export coverage data in structured formats (JSON, Turtle)',
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
    const { format, output, verbose } = ctx.args
    if (!output) {
      consola.error('❌ Missing required argument: --output')
      process.exit(1)
    }

    if (ctx.args.format !== 'json') {
      consola.start('📊 Exporting CLI coverage data...')
    }

    try {
      const options = parseCliOptions(ctx.args)
      const { format, output, verbose } = ctx.args
      const baseUri = ctx.args['base-uri']
      const cliName = ctx.args['cli-name']

      const resolvedCliPath = await resolveCliPath(options)

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
        consola.success(`✅ Coverage data exported to: ${output}`)
        consola.log(`📊 Format: ${format.toUpperCase()}`)
        consola.log(`📈 Overall Coverage: ${report.coverage.summary.overall.percentage.toFixed(1)}%`)
      } else {
        const analyzer = new ASTAnalyzer({
          cliPath: resolvedCliPath,
          testDir: options.testDir,
          includePatterns: options.includePatterns,
          excludePatterns: options.excludePatterns,
          verbose: options.verbose,
        })

        const report = await analyzer.analyze()
        const formattedReport = JSON.stringify(report, null, 2)

        writeFileSync(output, formattedReport)
        consola.success(`✅ AST-based coverage data exported to: ${output}`)
        consola.log(`📊 Format: ${format.toUpperCase()}`)
        consola.log(`📈 Overall Coverage: ${report.coverage.summary.overall.percentage.toFixed(1)}%`)
      }
    } catch (error) {
      consola.error(`❌ AST-based export failed: ${error.message}`)
      if (ctx.args.verbose) {
        consola.error(error.stack)
      }
      process.exit(1)
    }
  },
})
