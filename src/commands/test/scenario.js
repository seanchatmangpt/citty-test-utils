#!/usr/bin/env node
// src/commands/test/scenario.js - Test scenario verb command

import { defineCommand } from 'citty'
import { scenarios } from '../../core/scenarios/scenarios.js'

export const scenarioCommand = defineCommand({
  meta: {
    name: 'scenario',
    description: 'Execute custom scenarios',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Scenario name (help, version, invalidCommand, etc.)',
      required: true,
    },
    environment: {
      type: 'string',
      description: 'Test environment (local, cleanroom)',
      default: 'local',
    },
    args: {
      type: 'string',
      description: 'Additional arguments for the scenario (comma-separated)',
    },
  },
  run: async (ctx) => {
    const { name, environment, json, verbose, args: scenarioArgs } = ctx.args

    if (verbose) {
      console.error(`Executing scenario: ${name} in ${environment}`)
    }

    // Get the scenario function
    const scenarioFn = scenarios[name]
    if (!scenarioFn) {
      throw new Error(`Unknown scenario: ${name}. Available scenarios: ${Object.keys(scenarios).join(', ')}`)
    }

    // Parse additional arguments if provided
    const additionalArgs = scenarioArgs ? scenarioArgs.split(',').map(arg => arg.trim()) : []

    // Execute the scenario - NO try-catch, fail fast!
    const scenario = scenarioFn(...additionalArgs, environment)
    const result = await scenario.execute()

    // Format output
    const output = {
      scenario: name,
      environment,
      success: result.success,
      results: result.results || [],
      timestamp: new Date().toISOString(),
    }

    if (json) {
      console.log(JSON.stringify(output, null, 2))
    } else {
      console.log(`Scenario: ${name}`)
      console.log(`Environment: ${environment}`)
      console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`)
      if (verbose && result.results) {
        console.log('\nResults:')
        console.log(JSON.stringify(result.results, null, 2))
      }
    }

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1)
  },
})
