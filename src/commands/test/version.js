#!/usr/bin/env node
// src/commands/test/version.js - Test version verb command

import { defineCommand } from 'citty'
import { scenarios } from '../../core/scenarios/scenarios.js'

export const versionCommand = defineCommand({
  meta: {
    name: 'version',
    description: 'Test version command',
  },
  args: {
    environment: {
      type: 'string',
      description: 'Test environment (local, cleanroom)',
      default: 'local',
    },
  },
  run: async (ctx) => {
    const { environment, json, verbose } = ctx.args

    if (verbose) {
      console.error(`Testing version command in ${environment}`)
    }

    try {
      const result = await scenarios.version(environment).execute()

      const output = {
        command: 'version',
        environment,
        success: result.success,
        timestamp: new Date().toISOString(),
      }

      if (json) {
        console.log(JSON.stringify(output))
      } else {
        console.log(`Version test: ${result.success ? '✅ PASS' : '❌ FAIL'}`)
      }
    } catch (error) {
      const errorResult = {
        command: 'version',
        environment,
        error: error.message,
        timestamp: new Date().toISOString(),
      }

      if (json) {
        console.log(JSON.stringify(errorResult))
      } else {
        console.error(`Version test failed: ${error.message}`)
      }
      process.exit(1)
    }
  },
})
