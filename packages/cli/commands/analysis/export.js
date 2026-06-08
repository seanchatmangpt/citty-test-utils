import { consola } from '@un-test/core'
/**
 * @fileoverview Export coverage data subcommand
 * @description Export coverage data in structured formats (JSON, Turtle) with AST caching
 */

import { defineCommand } from 'citty'
import { ASTAnalyzer } from '@un-test/coverage'
import { CLCoverageAnalyzer } from '@un-test/coverage'
import { parseCliOptions, resolveCliPath } from '@un-test/coverage'
import { getCLIEntryArgs } from '@un-test/coverage'
import { writeFileSync } from 'node:fs'

export const exportCommand = defineCommand({
  meta: {
    name: 'export',
    description: 'Export coverage data in structured formats (JSON, Turtle)',
  },
  args: {
    ...getCLIEntryArgs(),
    'show-help': {
      type: 'boolean',
      description: 'Show help information',
    },
    help: {
      type: 'boolean',
      description: 'Show help information',
    },
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
    if (ctx.args['show-help'] || ctx.args.help) {
      console.log('ctu analysis export - Export coverage data in structured formats')
      console.log('\nOPTIONS')
      console.log('  --format      Export format (json, turtle)')
      console.log('  --output      Output file path (required for export)')
      console.log('  --base-uri    Base URI for Turtle/RDF output')
      console.log('  --cli-name    CLI name for Turtle/RDF output')
      return
    }

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
      consola.fatal(`❌ AST-based export failed!`)
      throw error
    }
  },
})
