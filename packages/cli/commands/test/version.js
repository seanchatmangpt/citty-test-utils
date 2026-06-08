#!/usr/bin/env node
import { consola } from '@un-test/core'
// src/commands/test/version.js - Test version verb command

import { defineCommand } from 'citty'
import { scenarioTemplates as scenarios } from '@un-test/scenario'

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
      consola.error(`Testing version command in ${environment}`)
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
      consola.fatal(`❌ Version test failed!`)
      throw error
    }
  },
})
