#!/usr/bin/env node
// src/commands/runner.js - Runner noun command

import { defineCommand } from 'citty'
import { executeCommand } from './runner/execute.js'
import { localCommand } from './runner/local.js'
import { cleanroomCommand } from './runner/cleanroom.js'

export const runnerCommand = defineCommand({
  meta: {
    name: 'runner',
    description: 'Custom runner functionality',
  },
  run: async (ctx) => {
    const { json, verbose } = ctx.args

    if (ctx.args._.length === 0) {
      const help = {
        name: 'runner',
        description: 'Custom runner functionality',
        usage: 'ctu runner <verb> [options]',
        verbs: [
          { name: 'execute', description: 'Execute command with custom runner' },
          { name: 'local', description: 'Run command locally' },
          { name: 'cleanroom', description: 'Run command in cleanroom (Docker)' },
        ],
      }

      if (json) {
        console.log(JSON.stringify(help, null, 2))
      } else {
        console.log('Runner Command - Custom runner functionality')
        console.log('')
        console.log('USAGE ctu runner <verb> [options]')
        console.log('')
        console.log('VERBS')
        console.log('')
        help.verbs.forEach((verb) => {
          console.log(`  ${verb.name.padEnd(12)} ${verb.description}`)
        })
        console.log('')
        console.log('EXAMPLES')
        console.log('  ctu runner execute --command "node --version" --environment local')
        console.log('  ctu runner local --command "npm test" --timeout 30000')
        console.log('  ctu runner cleanroom --command "node --version" --timeout 10000')
        console.log('')
        console.log('Use ctu runner <verb> --help for more information about a verb.')
      }
      return
    }
  },
  subCommands: {
    execute: executeCommand,
    local: localCommand,
    cleanroom: cleanroomCommand,
  },
})
