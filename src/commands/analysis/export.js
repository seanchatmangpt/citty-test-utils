/**
 * @fileoverview Export coverage data subcommand
 * @description Export coverage data in structured formats (JSON, Turtle)
 */

import { defineCommand } from 'citty'
import { CLCoverageAnalyzer } from '../../core/coverage/cli-coverage-analyzer.js'
import { writeFileSync } from 'fs'

export const exportCommand = defineCommand({
  meta: {
    name: 'export',
    description: 'Export coverage data in structured formats (JSON, Turtle)',
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
    const {
      'cli-path': cliPath,
      'test-dir': testDir,
      'use-test-cli': useTestCli,
      format,
      output,
      verbose,
      'include-patterns': includePatterns,
      'exclude-patterns': excludePatterns,
      'base-uri': baseUri,
      'cli-name': cliName,
    } = ctx.args

    try {
      const options = {
        cliPath,
        testDir,
        useTestCli,
        format,
        verbose,
        includePatterns: includePatterns.split(',').map((p) => p.trim()),
        excludePatterns: excludePatterns.split(',').map((p) => p.trim()),
        baseUri,
        cliName,
      }

      if (verbose) {
        console.error('📤 Exporting coverage data...')
        console.error(`CLI Path: ${cliPath}`)
        console.error(`Test Directory: ${testDir}`)
        console.error(`Format: ${format}`)
        console.error(`Output: ${output}`)
      }

      const analyzer = new CLCoverageAnalyzer(options)
      const report = await analyzer.analyze(options)
      const formattedReport = await analyzer.formatReport(report, options)

      writeFileSync(output, formattedReport)
      console.log(`✅ Coverage data exported to: ${output}`)
      console.log(`📊 Format: ${format.toUpperCase()}`)
      console.log(`📈 Overall Coverage: ${report.coverage.summary.overall.percentage.toFixed(1)}%`)
    } catch (error) {
      console.error('❌ Export failed:')
      console.error(error.message)
      if (verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  },
})
