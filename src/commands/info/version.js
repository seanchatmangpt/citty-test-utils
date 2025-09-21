#!/usr/bin/env node
// src/commands/info/version.js - Info version verb command

import { defineCommand } from 'citty'

export const versionCommand = defineCommand({
  meta: {
    name: 'version',
    description: 'Show version information',
  },
  run: async (ctx) => {
    const { json, verbose } = ctx.args

    if (verbose) {
      console.error('Showing version information')
    }

    const version = '0.3.1'
    const result = {
      version,
      name: 'ctu',
      timestamp: new Date().toISOString(),
    }

    if (json) {
      console.log(JSON.stringify(result))
    } else {
      console.log(`Version: ${version}`)
    }
  },
})
