/**
 * @fileoverview Analyze CLI coverage subcommand
 * @description Analyze CLI test coverage by walking help output and finding tests
 */

import { defineCommand } from 'citty'
import { CLCoverageAnalyzer } from '../../core/coverage/cli-coverage-analyzer.js'
import { writeFileSync } from 'fs'

export const analyzeCommand = defineCommand({
  meta: {
    name: 'analyze',
    description: 'Analyze CLI test coverage by walking help output and finding tests',
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
      description: 'Output format (text, json, turtle)',
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
        console.error('🔍 Starting CLI coverage analysis...')
        console.error(`CLI Path: ${cliPath}`)
        console.error(`Test Directory: ${testDir}`)
        console.error(`Format: ${format}`)
        console.error(`Use Test CLI: ${useTestCli}`)
      }

      const analyzer = new CLCoverageAnalyzer(options)
      const report = await analyzer.analyze(options)
      const formattedReport = await analyzer.formatReport(report, options)

      if (output) {
        writeFileSync(output, formattedReport)
        console.log(`📄 Report written to: ${output}`)
      } else {
        console.log(formattedReport)
      }
    } catch (error) {
      console.error('❌ Coverage analysis failed:')
      console.error(error.message)
      if (verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  },
})
