import { consola } from '../../core/utils/logging.js'
/**
 * @fileoverview Analyze CLI coverage subcommand
 * @description Analyze CLI test coverage with AST caching
 */

import { defineCommand } from 'citty'
import { ASTAnalyzer } from '../../core/coverage/ast-analyzer.js'
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
 */
export const analyzeCommand = defineCommand({
  meta: {
    name: 'analyze',
    description: 'Analyze CLI test coverage',
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
      consola.start('🚀 Analyzing CLI test coverage...')
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

      // Display metadata if verbose
      displayAnalysisMetadata(options.verbose, options)

      const report = await analyzer.analyze()

      const message = await generateAnalysisReport(analyzer, report, {
        format: options.format,
        output: options.output,
      })

      console.log(message)
    } catch (error) {
      handleAnalysisError(error, ctx.args.verbose, 'analysis')
    }
  },
})
