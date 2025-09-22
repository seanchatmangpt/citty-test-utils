#!/usr/bin/env node
// src/commands/analysis.js - Analysis noun command

import { defineCommand } from 'citty'
import { analyzeCommand } from './analysis/analyze.js'
import { reportCommand } from './analysis/report.js'
import { exportCommand } from './analysis/export.js'
import { statsCommand } from './analysis/stats.js'
import { astAnalyzeCommand } from './analysis/ast-analyze.js'
import { discoverCommand } from './analysis/discover.js'
import { coverageCommand } from './analysis/coverage.js'
import { recommendCommand } from './analysis/recommend.js'

export const analysisCommand = defineCommand({
  meta: {
    name: 'analysis',
    description: 'Analyze CLI test coverage and generate reports',
  },
  run: async (ctx) => {
    const { json, verbose } = ctx.args

    if (ctx.args._.length === 0) {
      const help = {
        name: 'analysis',
        description: 'Analyze CLI test coverage and generate reports',
        usage: 'ctu analysis <verb> [options]',
        verbs: [
          {
            name: 'discover',
            description: '🔍 Discover CLI structure using AST parsing for accurate command extraction',
          },
          {
            name: 'coverage',
            description: '📊 Analyze test coverage using AST-based pattern matching for accurate results',
          },
          {
            name: 'recommend',
            description: '💡 Generate intelligent recommendations for improving test coverage',
          },
          {
            name: 'analyze',
            description: '🚀 AST-based CLI test coverage analysis for accurate results (legacy)',
          },
          {
            name: 'ast-analyze',
            description: '🚀 AST-based CLI coverage analysis for accurate results (legacy)',
          },
          { name: 'report', description: '🚀 AST-based detailed coverage report (legacy)' },
          {
            name: 'export',
            description: '🚀 AST-based coverage data export (JSON, Turtle) (legacy)',
          },
          { name: 'stats', description: '🚀 AST-based coverage statistics summary (legacy)' },
        ],
      }

      if (json) {
        console.log(JSON.stringify(help, null, 2))
      } else {
        console.log('Analysis Command - Analyze CLI test coverage and generate reports')
        console.log('')
        console.log('USAGE ctu analysis <verb> [options]')
        console.log('')
        console.log('VERBS')
        console.log('')
        help.verbs.forEach((verb) => {
          console.log(`  ${verb.name.padEnd(12)} ${verb.description}`)
        })
        console.log('')
        console.log('EXAMPLES')
        console.log('  ctu analysis discover --cli-path src/cli.mjs --format json')
        console.log('  ctu analysis coverage --test-dir test --threshold 80')
        console.log('  ctu analysis recommend --priority high --actionable')
        console.log('  ctu analysis analyze --cli-path src/cli.mjs --test-dir test (legacy)')
        console.log('  ctu analysis ast-analyze --verbose --format json (legacy)')
        console.log('  ctu analysis report --format json --output coverage.json (legacy)')
        console.log('  ctu analysis export --format turtle --output coverage.ttl (legacy)')
        console.log('  ctu analysis stats --verbose (legacy)')
        console.log('')
        console.log('Use ctu analysis <verb> --help for more information about a verb.')
      }
      return
    }
  },
  subCommands: {
    discover: discoverCommand,
    coverage: coverageCommand,
    recommend: recommendCommand,
    analyze: analyzeCommand,
    'ast-analyze': astAnalyzeCommand,
    report: reportCommand,
    export: exportCommand,
    stats: statsCommand,
  },
})
