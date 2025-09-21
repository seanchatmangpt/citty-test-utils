#!/usr/bin/env node
// src/commands/generate.js - Generate noun command

import { defineCommand } from 'citty'
import { projectCommand } from './gen/project.js'
import { testCommand } from './gen/test.js'
import { scenarioCommand } from './gen/scenario.js'
import { cliCommand } from './gen/cli.js'
import { configCommand } from './gen/config.js'

export const genCommand = defineCommand({
  meta: {
    name: 'gen',
    description: 'Generate test files and templates using nunjucks',
  },
  run: async (ctx) => {
    const { json, verbose } = ctx.args

    if (ctx.args._.length === 0) {
      const help = {
        name: 'generate',
        description: 'Generate test files and templates using nunjucks',
        usage: 'ctu generate <verb> [options]',
        verbs: [
          { name: 'project', description: 'Generate complete project structure' },
          { name: 'test', description: 'Generate test file template' },
          { name: 'scenario', description: 'Generate scenario template' },
          { name: 'cli', description: 'Generate CLI template' },
          { name: 'config', description: 'Generate configuration files' },
        ],
      }

      if (json) {
        console.log(JSON.stringify(help, null, 2))
      } else {
        console.log('Generate Command - Generate test files and templates using nunjucks')
        console.log('')
        console.log('USAGE ctu generate <verb> [options]')
        console.log('')
        console.log('VERBS')
        console.log('')
        help.verbs.forEach((verb) => {
          console.log(`  ${verb.name.padEnd(12)} ${verb.description}`)
        })
        console.log('')
        console.log('EXAMPLES')
        console.log('  ctu generate project my-cli --description "My CLI"')
        console.log('  ctu generate test my-feature --test-type cleanroom')
        console.log('  ctu generate scenario user-workflow --environment local')
        console.log('')
        console.log('Use ctu generate <verb> --help for more information about a verb.')
      }
      return
    }
  },
  subCommands: {
    project: projectCommand,
    test: testCommand,
    scenario: scenarioCommand,
    cli: cliCommand,
    config: configCommand,
  },
})
