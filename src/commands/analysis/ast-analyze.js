#!/usr/bin/env node
/**
 * @fileoverview AST-based analysis command
 * @description Uses AST parsing for accurate CLI coverage analysis
 */

import { defineCommand } from 'citty'
import { EnhancedASTCLIAnalyzer } from '../../core/coverage/enhanced-ast-cli-analyzer.js'
import { writeFileSync } from 'fs'

export const astAnalyzeCommand = defineCommand({
  meta: {
    name: 'ast-analyze',
    description: 'Analyze CLI test coverage using AST parsing for accurate results',
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
    } = ctx.args

    try {
      const analyzer = new EnhancedASTCLIAnalyzer({
        cliPath,
        testDir,
        includePatterns: includePatterns.split(',').map((p) => p.trim()),
        excludePatterns: excludePatterns.split(',').map((p) => p.trim()),
        verbose,
      })

      const report = await analyzer.analyze()
      const formattedReport = await analyzer.formatReport(report, { format })

      if (output) {
        writeFileSync(output, formattedReport)
        console.log(`✅ AST-based analysis report saved to: ${output}`)
      } else {
        console.log(formattedReport)
      }
    } catch (error) {
      console.error(`❌ AST analysis failed: ${error.message}`)
      process.exit(1)
    }
  },
})
