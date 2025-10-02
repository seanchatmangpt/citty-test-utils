#!/usr/bin/env node
// src/commands/test/error.js - Test error verb command

import { defineCommand } from 'citty'
import { scenarios } from '../../core/scenarios/scenarios.js'

export const errorCommand = defineCommand({
  meta: {
    name: 'error',
    description: 'Test error scenarios',
  },
  args: {
    command: {
      type: 'positional',
      description: 'Command to test for errors',
      required: true,
    },
    message: {
      type: 'string',
      description: 'Expected error message or pattern',
      required: true,
    },
    environment: {
      type: 'string',
      description: 'Test environment (local, cleanroom)',
      default: 'local',
    },
  },
  run: async (ctx) => {
    const { command, message, environment, json, verbose } = ctx.args

    if (verbose) {
      console.error(`Testing error scenario: "${command}" in ${environment}`)
    }

    // Parse command string into array
    const commandArgs = command.split(' ').filter(Boolean)

    // Execute error scenario - NO try-catch, fail fast!
    const scenario = scenarios.errorCase(commandArgs, message, environment)
    const result = await scenario.execute()

    // Format output
    const output = {
      command,
      expectedError: message,
      environment,
      success: result.success,
      timestamp: new Date().toISOString(),
    }

    if (json) {
      console.log(JSON.stringify(output, null, 2))
    } else {
      console.log(`Error Test: ${command}`)
      console.log(`Expected Error: ${message}`)
      console.log(`Environment: ${environment}`)
      console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`)
    }

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1)
  },
})
