#!/usr/bin/env node
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
      console.error('Showing all information')
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
