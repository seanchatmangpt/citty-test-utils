#!/usr/bin/env node
// src/commands/info.js - Info noun command

import { defineCommand } from 'citty'
import { versionCommand } from './info/version.js'
import { featuresCommand } from './info/features.js'
import { configCommand } from './info/config.js'
import { allCommand } from './info/all.js'

export const infoCommand = defineCommand({
  meta: {
    name: 'info',
    description: 'Show CLI information',
  },
  run: async (ctx) => {
    const { json, verbose } = ctx.args

    if (ctx.args._.length === 0) {
      const help = {
        name: 'info',
        description: 'Show CLI information',
        usage: 'ctu info <verb> [options]',
        verbs: [
          { name: 'version', description: 'Show version information' },
          { name: 'features', description: 'Show available features' },
          { name: 'config', description: 'Show configuration information' },
          { name: 'all', description: 'Show all information' },
        ],
      }

      if (json) {
        console.log(JSON.stringify(help, null, 2))
      } else {
        console.log('Info Command - Show CLI information')
        console.log('')
        console.log('USAGE ctu info <verb> [options]')
        console.log('')
        console.log('VERBS')
        console.log('')
        help.verbs.forEach((verb) => {
          console.log(`  ${verb.name.padEnd(12)} ${verb.description}`)
        })
        console.log('')
        console.log('EXAMPLES')
        console.log('  ctu info version')
        console.log('  ctu info features')
        console.log('  ctu info config')
        console.log('  ctu info all')
        console.log('')
        console.log('Use ctu info <verb> --help for more information about a verb.')
      }
      return
    }
  },
  subCommands: {
    version: versionCommand,
    features: featuresCommand,
    config: configCommand,
    all: allCommand,
  },
})
