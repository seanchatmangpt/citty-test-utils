#!/usr/bin/env node
// src/cli.mjs - Citty Test Utils CLI - Main Entry Point

import { defineCommand, runMain } from 'citty'
import { testCommand } from './commands/test.js'
import { genCommand } from './commands/gen.js'
import { runnerCommand } from './commands/runner.js'
import { infoCommand } from './commands/info.js'
import { analysisCommand } from './commands/analysis.js'

const cittyTestUtils = defineCommand({
  meta: {
    name: 'ctu',
    version: '0.4.0',
    description: 'Citty Test Utils CLI - Comprehensive testing framework for CLI applications',
  },
  args: {
    'show-help': {
      type: 'boolean',
      description: 'Show help information',
      default: false,
    },
    'show-version': {
      type: 'boolean',
      description: 'Show version information',
      default: false,
    },
    json: {
      type: 'boolean',
      description: 'Output in JSON format',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
    },
  },
  run: async (ctx) => {
    const { 'show-help': showHelp, 'show-version': showVersion, json, verbose } = ctx.args

    if (showVersion) {
      const version = '0.4.0'
      if (json) {
        console.log(JSON.stringify({ version, name: 'ctu' }))
      } else {
        console.log(version)
      }
      return
    }

    if (showHelp || ctx.args._.length === 0) {
      const help = {
        name: 'ctu',
        version: '0.4.0',
        description: 'Citty Test Utils CLI - Comprehensive testing framework for CLI applications',
        usage: 'ctu <noun> <verb> [options]',
        nouns: [
          { name: 'test', description: 'Run tests and scenarios' },
          { name: 'gen', description: 'Generate test files and templates' },
          { name: 'runner', description: 'Custom runner functionality' },
          { name: 'info', description: 'Show CLI information' },
          { name: 'analysis', description: 'Analyze CLI test coverage and generate reports' },
        ],
      }

      if (json) {
        console.log(JSON.stringify(help, null, 2))
      } else {
        console.log(
          'Citty Test Utils CLI - Comprehensive testing framework for CLI applications (ctu v0.4.0)'
        )
        console.log('')
        console.log('USAGE ctu <noun> <verb> [options]')
        console.log('')
        console.log('NOUNS')
        console.log('')
        help.nouns.forEach((noun) => {
          console.log(`  ${noun.name.padEnd(12)} ${noun.description}`)
        })
        console.log('')
        console.log('EXAMPLES')
        console.log('  ctu test run --environment local')
        console.log('  ctu gen project my-cli')
        console.log('  ctu runner execute --command "node --version"')
        console.log('  ctu info version')
        console.log('  ctu analysis analyze --verbose')
        console.log('  ctu analysis stats')
        console.log('  ctu analysis export --format json --output coverage.json')
        console.log('')
        console.log('Use ctu <noun> --help for more information about a noun.')
      }
      return
    }
  },
  subCommands: {
    test: testCommand,
    gen: genCommand,
    runner: runnerCommand,
    info: infoCommand,
    analysis: analysisCommand,
  },
})

// Only run the CLI when this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMain(cittyTestUtils)
}
