#!/usr/bin/env node
// src/commands/test.js - Test noun command

import { defineCommand } from 'citty'
import { runCommand } from './test/run.js'
import { scenarioCommand } from './test/scenario.js'
import { helpCommand } from './test/help.js'
import { versionCommand } from './test/version.js'
import { errorCommand } from './test/error.js'

export const testCommand = defineCommand({
  meta: {
    name: 'test',
    description: 'Run tests and scenarios',
  },
  run: async (ctx) => {
    const { json, verbose } = ctx.args

    if (ctx.args._.length === 0) {
      const help = {
        name: 'test',
        description: 'Run tests and scenarios',
        usage: 'ctu test <verb> [options]',
        verbs: [
          { name: 'run', description: 'Run test scenarios' },
          { name: 'scenario', description: 'Execute custom scenarios' },
          { name: 'help', description: 'Test help command' },
          { name: 'version', description: 'Test version command' },
          { name: 'error', description: 'Test error scenarios' },
        ],
      }

      if (json) {
        console.log(JSON.stringify(help, null, 2))
      } else {
        console.log('Test Command - Run tests and scenarios')
        console.log('')
        console.log('USAGE ctu test <verb> [options]')
        console.log('')
        console.log('VERBS')
        console.log('')
        help.verbs.forEach((verb) => {
          console.log(`  ${verb.name.padEnd(12)} ${verb.description}`)
        })
        console.log('')
        console.log('EXAMPLES')
        console.log('  ctu test run --environment local')
        console.log('  ctu test scenario --name "my-scenario"')
        console.log('  ctu test help --environment cleanroom')
        console.log('')
        console.log('Use ctu test <verb> --help for more information about a verb.')
      }
      return
    }
  },
  subCommands: {
    run: runCommand,
    scenario: scenarioCommand,
    help: helpCommand,
    version: versionCommand,
    error: errorCommand,
  },
})
