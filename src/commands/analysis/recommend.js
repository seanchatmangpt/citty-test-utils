#!/usr/bin/env node
/**
 * @fileoverview Smart recommendations subcommand
 * @description Generate intelligent recommendations for improving test coverage
 */

import { defineCommand } from 'citty'
import { EnhancedASTCLIAnalyzer } from '../../core/coverage/enhanced-ast-cli-analyzer.js'
import { writeFileSync } from 'fs'

export const recommendCommand = defineCommand({
  meta: {
    name: 'recommend',
    description: '💡 Generate intelligent recommendations for improving test coverage',
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
      description: 'Output format (text, json, markdown)',
      default: 'text',
    },
    output: {
      type: 'string',
      description: 'Output file path (optional)',
    },
    priority: {
      type: 'string',
      description: 'Recommendation priority filter (high, medium, low, all)',
      default: 'all',
    },
    actionable: {
      type: 'boolean',
      description: 'Focus on actionable recommendations only',
      default: true,
    },
    verbose: {
      type: 'boolean',
      description: 'Enable detailed output',
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
      priority,
      actionable,
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

      if (verbose) {
        console.log('💡 Starting smart recommendations generation...')
        console.log(`CLI Path: ${cliPath}`)
        console.log(`Test Directory: ${testDir}`)
        console.log(`Format: ${format}`)
        console.log(`Priority: ${priority}`)
        console.log(`Actionable: ${actionable}`)
      }

      // Perform analysis to get recommendations
      const report = await analyzer.analyze()

      // Generate smart recommendations
      const recommendations = generateSmartRecommendations(report, {
        priority,
        actionable,
        verbose,
      })

      // Generate recommendation report
      const recommendationReport = generateRecommendationReport(recommendations, {
        cliPath,
        testDir,
        format,
        priority,
        actionable,
        verbose,
      })

      if (output) {
        writeFileSync(output, recommendationReport)
        console.log(`✅ Smart recommendations saved to: ${output}`)
      } else {
        console.log(recommendationReport)
      }
    } catch (error) {
      console.error(`❌ Smart recommendations generation failed: ${error.message}`)
      if (verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  },
})

/**
 * Generate smart recommendations based on coverage analysis
 * @param {Object} report - Analysis report
 * @param {Object} options - Recommendation options
 * @returns {Array} Smart recommendations
 */
function generateSmartRecommendations(report, options) {
  const { priority, actionable, verbose } = options
  const recommendations = []

  // Analyze coverage gaps
  const coverage = report.coverage.summary
  const details = report.coverage.details

  // High Priority Recommendations
  if (priority === 'all' || priority === 'high') {
    // Untested commands
    details.untestedCommands.forEach((command) => {
      recommendations.push({
        id: `cmd-${command.name}`,
        type: 'command',
        priority: 'high',
        title: `Add tests for command: ${command.name}`,
        description: `The command '${command.name}' has no test coverage`,
        impact: 'High - Core functionality untested',
        effort: 'Medium',
        actionable: true,
        suggestion: `Create test file: test/${command.name}.test.mjs`,
        example: `// Test for ${command.name} command
import { runLocalCitty } from '../src/core/runners/local-runner.js'

test('${command.name} command works', async () => {
  const result = await runLocalCitty(['${command.name}', '--help'])
  result.expectSuccess()
})`,
        command: command.name,
        subcommand: null,
        flag: null,
        option: null,
      })
    })

    // Untested subcommands
    details.untestedSubcommands.forEach((subcommand) => {
      recommendations.push({
        id: `subcmd-${subcommand.command}-${subcommand.subcommand}`,
        type: 'subcommand',
        priority: 'high',
        title: `Add tests for subcommand: ${subcommand.command} ${subcommand.subcommand}`,
        description: `The subcommand '${subcommand.command} ${subcommand.subcommand}' has no test coverage`,
        impact: 'High - Subcommand functionality untested',
        effort: 'Medium',
        actionable: true,
        suggestion: `Add test case for ${subcommand.command} ${subcommand.subcommand}`,
        example: `// Test for ${subcommand.command} ${subcommand.subcommand} subcommand
test('${subcommand.command} ${subcommand.subcommand} subcommand works', async () => {
  const result = await runLocalCitty(['${subcommand.command}', '${subcommand.subcommand}', '--help'])
  result.expectSuccess()
})`,
        command: subcommand.command,
        subcommand: subcommand.subcommand,
        flag: null,
        option: null,
      })
    })

    // Critical flags
    details.untestedFlags.forEach((flag) => {
      if (flag.global || flag.critical) {
        recommendations.push({
          id: `flag-${flag.name}`,
          type: 'flag',
          priority: 'high',
          title: `Add tests for flag: --${flag.name}`,
          description: `The flag '--${flag.name}' has no test coverage`,
          impact: flag.global ? 'High - Global flag untested' : 'High - Critical flag untested',
          effort: 'Low',
          actionable: true,
          suggestion: `Add test case for --${flag.name} flag`,
          example: `// Test for --${flag.name} flag
test('--${flag.name} flag works', async () => {
  const result = await runLocalCitty(['--${flag.name}'])
  result.expectSuccess()
})`,
          command: flag.command || 'global',
          subcommand: null,
          flag: flag.name,
          option: null,
        })
      }
    })
  }

  // Medium Priority Recommendations
  if (priority === 'all' || priority === 'medium') {
    // Regular flags
    details.untestedFlags.forEach((flag) => {
      if (!flag.global && !flag.critical) {
        recommendations.push({
          id: `flag-${flag.name}`,
          type: 'flag',
          priority: 'medium',
          title: `Add tests for flag: --${flag.name}`,
          description: `The flag '--${flag.name}' has no test coverage`,
          impact: 'Medium - Flag functionality untested',
          effort: 'Low',
          actionable: true,
          suggestion: `Add test case for --${flag.name} flag`,
          example: `// Test for --${flag.name} flag
test('--${flag.name} flag works', async () => {
  const result = await runLocalCitty(['--${flag.name}'])
  result.expectSuccess()
})`,
          command: flag.command || 'global',
          subcommand: null,
          flag: flag.name,
          option: null,
        })
      }
    })

    // Options
    details.untestedOptions.forEach((option) => {
      recommendations.push({
        id: `option-${option.name}`,
        type: 'option',
        priority: 'medium',
        title: `Add tests for option: --${option.name}`,
        description: `The option '--${option.name}' has no test coverage`,
        impact: 'Medium - Option functionality untested',
        effort: 'Low',
        actionable: true,
        suggestion: `Add test case for --${option.name} option`,
        example: `// Test for --${option.name} option
test('--${option.name} option works', async () => {
  const result = await runLocalCitty(['--${option.name}', 'test-value'])
  result.expectSuccess()
})`,
        command: option.command || 'global',
        subcommand: null,
        flag: null,
        option: option.name,
      })
    })
  }

  // Low Priority Recommendations
  if (priority === 'all' || priority === 'low') {
    // Coverage improvement suggestions
    if (coverage.overall.percentage < 90) {
      recommendations.push({
        id: 'coverage-improvement',
        type: 'coverage',
        priority: 'low',
        title: 'Improve overall test coverage',
        description: `Current coverage is ${coverage.overall.percentage.toFixed(1)}%, aim for 90%+`,
        impact: 'Low - Coverage improvement',
        effort: 'High',
        actionable: false,
        suggestion: 'Focus on high-priority untested items first',
        example: null,
        command: null,
        subcommand: null,
        flag: null,
        option: null,
      })
    }

    // Performance optimization
    recommendations.push({
      id: 'performance-optimization',
      type: 'performance',
      priority: 'low',
      title: 'Optimize test performance',
      description: 'Consider parallel test execution and caching',
      impact: 'Low - Performance improvement',
      effort: 'Medium',
      actionable: false,
      suggestion: 'Implement parallel test execution',
      example: null,
      command: null,
      subcommand: null,
      flag: null,
      option: null,
    })
  }

  // Filter by actionable if requested
  if (actionable) {
    return recommendations.filter((rec) => rec.actionable)
  }

  return recommendations
}

/**
 * Generate recommendation report
 * @param {Array} recommendations - Smart recommendations
 * @param {Object} options - Report options
 * @returns {string} Formatted recommendation report
 */
function generateRecommendationReport(recommendations, options) {
  const { format } = options

  switch (format.toLowerCase()) {
    case 'json':
      return generateJSONRecommendationReport(recommendations, options)
    case 'markdown':
      return generateMarkdownRecommendationReport(recommendations, options)
    case 'text':
    default:
      return generateTextRecommendationReport(recommendations, options)
  }
}

/**
 * Generate text format recommendation report
 * @param {Array} recommendations - Smart recommendations
 * @param {Object} options - Report options
 * @returns {string} Text recommendation report
 */
function generateTextRecommendationReport(recommendations, options) {
  const { cliPath, testDir, priority, actionable, verbose } = options
  const lines = []

  lines.push('💡 Smart Recommendations Report')
  lines.push('='.repeat(40))
  lines.push('')

  // Summary
  lines.push('📊 Recommendation Summary:')
  lines.push(`  CLI Path: ${cliPath}`)
  lines.push(`  Test Directory: ${testDir}`)
  lines.push(`  Priority Filter: ${priority}`)
  lines.push(`  Actionable Only: ${actionable}`)
  lines.push(`  Total Recommendations: ${recommendations.length}`)
  lines.push('')

  // Group by priority
  const highPriority = recommendations.filter((r) => r.priority === 'high')
  const mediumPriority = recommendations.filter((r) => r.priority === 'medium')
  const lowPriority = recommendations.filter((r) => r.priority === 'low')

  if (highPriority.length > 0) {
    lines.push('🔴 High Priority Recommendations:')
    highPriority.forEach((rec, index) => {
      lines.push(`  ${index + 1}. ${rec.title}`)
      lines.push(`     Description: ${rec.description}`)
      lines.push(`     Impact: ${rec.impact}`)
      lines.push(`     Effort: ${rec.effort}`)
      lines.push(`     Suggestion: ${rec.suggestion}`)
      if (rec.example) {
        lines.push(`     Example:`)
        rec.example.split('\n').forEach((line) => {
          lines.push(`       ${line}`)
        })
      }
      lines.push('')
    })
  }

  if (mediumPriority.length > 0) {
    lines.push('🟡 Medium Priority Recommendations:')
    mediumPriority.forEach((rec, index) => {
      lines.push(`  ${index + 1}. ${rec.title}`)
      lines.push(`     Description: ${rec.description}`)
      lines.push(`     Impact: ${rec.impact}`)
      lines.push(`     Effort: ${rec.effort}`)
      lines.push(`     Suggestion: ${rec.suggestion}`)
      if (rec.example) {
        lines.push(`     Example:`)
        rec.example.split('\n').forEach((line) => {
          lines.push(`       ${line}`)
        })
      }
      lines.push('')
    })
  }

  if (lowPriority.length > 0) {
    lines.push('🟢 Low Priority Recommendations:')
    lowPriority.forEach((rec, index) => {
      lines.push(`  ${index + 1}. ${rec.title}`)
      lines.push(`     Description: ${rec.description}`)
      lines.push(`     Impact: ${rec.impact}`)
      lines.push(`     Effort: ${rec.effort}`)
      lines.push(`     Suggestion: ${rec.suggestion}`)
      lines.push('')
    })
  }

  // Actionable Summary
  const actionableRecs = recommendations.filter((r) => r.actionable)
  if (actionableRecs.length > 0) {
    lines.push('✅ Actionable Recommendations Summary:')
    lines.push(`  Total Actionable: ${actionableRecs.length}`)
    lines.push(`  High Priority: ${actionableRecs.filter((r) => r.priority === 'high').length}`)
    lines.push(`  Medium Priority: ${actionableRecs.filter((r) => r.priority === 'medium').length}`)
    lines.push(`  Low Priority: ${actionableRecs.filter((r) => r.priority === 'low').length}`)
    lines.push('')
  }

  // Implementation Plan
  if (actionableRecs.length > 0) {
    lines.push('📋 Implementation Plan:')
    lines.push('  1. Start with high-priority recommendations')
    lines.push('  2. Focus on commands and subcommands first')
    lines.push('  3. Add flag and option tests incrementally')
    lines.push('  4. Run coverage analysis after each implementation')
    lines.push('  5. Aim for 90%+ overall coverage')
    lines.push('')
  }

  // Analysis Metadata
  if (verbose) {
    lines.push('ℹ️  Analysis Metadata:')
    lines.push(`  Generated At: ${new Date().toLocaleString()}`)
    lines.push(`  CLI Path: ${cliPath}`)
    lines.push(`  Test Directory: ${testDir}`)
    lines.push(`  Priority Filter: ${priority}`)
    lines.push(`  Actionable Only: ${actionable}`)
    lines.push(`  Analysis Method: AST-based`)
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Generate JSON format recommendation report
 * @param {Array} recommendations - Smart recommendations
 * @param {Object} options - Report options
 * @returns {string} JSON recommendation report
 */
function generateJSONRecommendationReport(recommendations, options) {
  const { cliPath, testDir, priority, actionable, verbose } = options

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      cliPath,
      testDir,
      priority,
      actionable,
      verbose,
      analysisMethod: 'AST-based',
    },
    summary: {
      totalRecommendations: recommendations.length,
      highPriority: recommendations.filter((r) => r.priority === 'high').length,
      mediumPriority: recommendations.filter((r) => r.priority === 'medium').length,
      lowPriority: recommendations.filter((r) => r.priority === 'low').length,
      actionable: recommendations.filter((r) => r.actionable).length,
    },
    recommendations: recommendations,
  }

  return JSON.stringify(report, null, 2)
}

/**
 * Generate Markdown format recommendation report
 * @param {Array} recommendations - Smart recommendations
 * @param {Object} options - Report options
 * @returns {string} Markdown recommendation report
 */
function generateMarkdownRecommendationReport(recommendations, options) {
  const { cliPath, testDir, priority, actionable, verbose } = options
  const lines = []

  lines.push('# 💡 Smart Recommendations Report')
  lines.push('')
  lines.push('## 📊 Summary')
  lines.push('')
  lines.push(`- **CLI Path:** ${cliPath}`)
  lines.push(`- **Test Directory:** ${testDir}`)
  lines.push(`- **Priority Filter:** ${priority}`)
  lines.push(`- **Actionable Only:** ${actionable}`)
  lines.push(`- **Total Recommendations:** ${recommendations.length}`)
  lines.push('')

  // Group by priority
  const highPriority = recommendations.filter((r) => r.priority === 'high')
  const mediumPriority = recommendations.filter((r) => r.priority === 'medium')
  const lowPriority = recommendations.filter((r) => r.priority === 'low')

  if (highPriority.length > 0) {
    lines.push('## 🔴 High Priority Recommendations')
    lines.push('')
    highPriority.forEach((rec, index) => {
      lines.push(`### ${index + 1}. ${rec.title}`)
      lines.push('')
      lines.push(`**Description:** ${rec.description}`)
      lines.push('')
      lines.push(`**Impact:** ${rec.impact}`)
      lines.push('')
      lines.push(`**Effort:** ${rec.effort}`)
      lines.push('')
      lines.push(`**Suggestion:** ${rec.suggestion}`)
      lines.push('')
      if (rec.example) {
        lines.push('**Example:**')
        lines.push('')
        lines.push('```javascript')
        lines.push(rec.example)
        lines.push('```')
        lines.push('')
      }
    })
  }

  if (mediumPriority.length > 0) {
    lines.push('## 🟡 Medium Priority Recommendations')
    lines.push('')
    mediumPriority.forEach((rec, index) => {
      lines.push(`### ${index + 1}. ${rec.title}`)
      lines.push('')
      lines.push(`**Description:** ${rec.description}`)
      lines.push('')
      lines.push(`**Impact:** ${rec.impact}`)
      lines.push('')
      lines.push(`**Effort:** ${rec.effort}`)
      lines.push('')
      lines.push(`**Suggestion:** ${rec.suggestion}`)
      lines.push('')
      if (rec.example) {
        lines.push('**Example:**')
        lines.push('')
        lines.push('```javascript')
        lines.push(rec.example)
        lines.push('```')
        lines.push('')
      }
    })
  }

  if (lowPriority.length > 0) {
    lines.push('## 🟢 Low Priority Recommendations')
    lines.push('')
    lowPriority.forEach((rec, index) => {
      lines.push(`### ${index + 1}. ${rec.title}`)
      lines.push('')
      lines.push(`**Description:** ${rec.description}`)
      lines.push('')
      lines.push(`**Impact:** ${rec.impact}`)
      lines.push('')
      lines.push(`**Effort:** ${rec.effort}`)
      lines.push('')
      lines.push(`**Suggestion:** ${rec.suggestion}`)
      lines.push('')
    })
  }

  // Implementation Plan
  const actionableRecs = recommendations.filter((r) => r.actionable)
  if (actionableRecs.length > 0) {
    lines.push('## 📋 Implementation Plan')
    lines.push('')
    lines.push('1. **Start with high-priority recommendations**')
    lines.push('2. **Focus on commands and subcommands first**')
    lines.push('3. **Add flag and option tests incrementally**')
    lines.push('4. **Run coverage analysis after each implementation**')
    lines.push('5. **Aim for 90%+ overall coverage**')
    lines.push('')
  }

  return lines.join('\n')
}
