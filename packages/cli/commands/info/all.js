#!/usr/bin/env node
import { consola } from '@un-test/core'
// src/commands/info/all.js - Info all verb command

import { defineCommand } from 'citty'

export const allCommand = defineCommand({
  meta: {
    name: 'all',
    description: 'Show all information',
  },
  run: async (ctx) => {
    const { json, verbose } = ctx.args

    if (verbose) {
      consola.error('Showing all information')
    }

    const result = {
      command: 'all',
      status: 'pending',
      message: 'all information will be implemented',
      timestamp: new Date().toISOString(),
    }

    if (json) {
      console.log(JSON.stringify(result))
    } else {
      console.log(`all information: ${result.status}`)
    }
  },
})
