#!/usr/bin/env node
import { consola } from '@un-test/core'
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
      consola.error('Showing version information')
    }

    const version = '1.0.0'
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
