/**
 * @fileoverview Analyze CLI coverage subcommand
 * @description Analyze CLI test coverage by walking help output and finding tests
 */

import { defineCommand } from 'citty'
import { EnhancedASTCLIAnalyzer } from '../../core/coverage/enhanced-ast-cli-analyzer.js'
import {
  parseCliOptions,
  resolveCliPath,
  generateAnalysisReport,
  handleAnalysisError,
  displayAnalysisMetadata,
} from '../../core/utils/analysis-helpers.js'
import { getCLIEntryArgs } from '../../core/utils/cli-entry-resolver.js'

/**
 * Analyze command definition
 * Performs AST-based CLI test coverage analysis
 */
export const analyzeCommand = defineCommand({
  meta: {
    name: 'analyze',
    description: '🚀 AST-based CLI test coverage analysis for accurate results',
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
    try {
      // Parse CLI options using shared utility
      const options = parseCliOptions(ctx.args)

      // Resolve CLI entry point (supports --entry-file, --cli-file, auto-detection)
      const resolvedCliPath = await resolveCliPath(options)

      // Create analyzer instance
      const analyzer = new EnhancedASTCLIAnalyzer({
        cliPath: resolvedCliPath,
        testDir: options.testDir,
        includePatterns: options.includePatterns,
        excludePatterns: options.excludePatterns,
        verbose: options.verbose,
      })

      // Display metadata if verbose
      displayAnalysisMetadata(options.verbose, options)

      // Perform analysis
      const report = await analyzer.analyze()

      // Generate and output report
      const message = await generateAnalysisReport(analyzer, report, {
        format: options.format,
        output: options.output,
      })

      if (options.output) {
        console.log(message)
      } else {
        console.log(message)
      }
    } catch (error) {
      handleAnalysisError(error, ctx.args.verbose, 'analysis')
    }
  },
})
