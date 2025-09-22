#!/usr/bin/env node
// src/commands/analysis.js - Analysis noun command

import { defineCommand } from 'citty'
import { analyzeCommand } from './analysis/analyze.js'
import { reportCommand } from './analysis/report.js'
import { exportCommand } from './analysis/export.js'
import { statsCommand } from './analysis/stats.js'

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
            name: 'analyze',
            description: 'Analyze CLI test coverage by walking help output and finding tests',
          },
          { name: 'report', description: 'Generate a detailed coverage report' },
          {
            name: 'export',
            description: 'Export coverage data in structured formats (JSON, Turtle)',
          },
          { name: 'stats', description: 'Show coverage statistics summary' },
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
        console.log('  ctu analysis analyze --cli-path src/cli.mjs --test-dir test')
        console.log('  ctu analysis report --format json --output coverage.json')
        console.log('  ctu analysis export --format turtle --output coverage.ttl')
        console.log('  ctu analysis stats --verbose')
        console.log('')
        console.log('Use ctu analysis <verb> --help for more information about a verb.')
      }
      return
    }
  },
  subCommands: {
    analyze: analyzeCommand,
    report: reportCommand,
    export: exportCommand,
    stats: statsCommand,
  },
})
