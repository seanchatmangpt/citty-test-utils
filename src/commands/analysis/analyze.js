/**
 * @fileoverview Analyze CLI coverage subcommand
 * @description Analyze CLI test coverage by walking help output and finding tests
 */

import { defineCommand } from 'citty'
import { EnhancedASTCLIAnalyzer } from '../../core/coverage/enhanced-ast-cli-analyzer.js'
import { writeFileSync } from 'fs'

export const analyzeCommand = defineCommand({
  meta: {
    name: 'analyze',
    description: '🚀 AST-based CLI test coverage analysis for accurate results',
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
    'base-uri': {
      type: 'string',
      description: 'Base URI for RDF output (deprecated - use export command)',
      default: 'http://example.org/cli',
    },
    'cli-name': {
      type: 'string',
      description: 'CLI name for RDF output (deprecated - use export command)',
      default: 'cli',
    },
  },
  run: async (ctx) => {
    const {
      'cli-path': cliPath,
      'test-dir': testDir,
      format,
      output,
      verbose,
      'include-patterns': includePatterns,
      'exclude-patterns': excludePatterns,
      'base-uri': baseUri,
      'cli-name': cliName,
    } = ctx.args

    try {
      const analyzer = new EnhancedASTCLIAnalyzer({
        cliPath,
        testDir,
        includePatterns: includePatterns.split(',').map((p) => p.trim()),
        excludePatterns: excludePatterns.split(',').map((p) => p.trim()),
        verbose,
      })

      if (verbose) {
        console.log('🚀 Starting AST-based CLI coverage analysis...')
        console.log(`CLI Path: ${cliPath}`)
        console.log(`Test Directory: ${testDir}`)
        console.log(`Format: ${format}`)
      }

      const report = await analyzer.analyze()
      const formattedReport = await analyzer.formatReport(report, { format })

      if (output) {
        writeFileSync(output, formattedReport)
        console.log(`✅ AST-based analysis report saved to: ${output}`)
      } else {
        console.log(formattedReport)
      }
    } catch (error) {
      console.error(`❌ AST-based analysis failed: ${error.message}`)
      if (verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  },
})
