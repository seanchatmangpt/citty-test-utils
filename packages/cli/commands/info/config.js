#!/usr/bin/env node
import { consola } from '@un-test/core'
// src/commands/info/config.js - Info config verb command

import { defineCommand } from 'citty'

export const configCommand = defineCommand({
  meta: {
    name: 'config',
    description: 'Show config information',
  },
  run: async (ctx) => {
    const { json, verbose } = ctx.args

    if (verbose) {
      consola.error('Showing config information')
    }

    const result = {
      command: 'config',
      status: 'pending',
      message: 'config information will be implemented',
      timestamp: new Date().toISOString(),
    }

    if (json) {
      console.log(JSON.stringify(result))
    } else {
      console.log(`config information: ${result.status}`)
    }
  },
})
