#!/usr/bin/env node
// src/commands/test/help.js - Test help verb command

import { defineCommand } from 'citty'
import { scenarios } from '../../core/scenarios/scenarios.js'

export const helpCommand = defineCommand({
  meta: {
    name: 'help',
    description: 'Test help command',
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
      console.error(`Testing help command in ${environment}`)
    }

    try {
      const result = await scenarios.help(environment).execute()
      
      const output = {
        command: 'help',
        environment,
        success: result.success,
        timestamp: new Date().toISOString(),
      }

      if (json) {
        console.log(JSON.stringify(output))
      } else {
        console.log(`Help test: ${result.success ? '✅ PASS' : '❌ FAIL'}`)
      }
    } catch (error) {
      const errorResult = {
        command: 'help',
        environment,
        error: error.message,
        timestamp: new Date().toISOString(),
      }

      if (json) {
        console.log(JSON.stringify(errorResult))
      } else {
        console.error(`Help test failed: ${error.message}`)
      }
      process.exit(1)
    }
  },
})
