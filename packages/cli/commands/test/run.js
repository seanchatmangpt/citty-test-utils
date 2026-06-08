#!/usr/bin/env node
import { consola } from '@un-test/core'
// src/commands/test/run.js - Test run verb command

import { defineCommand } from 'citty'
import { scenarioTemplates as scenarios } from '@un-test/scenario'
import { setupCleanroom } from '@un-test/runners-cleanroom'

export const runCommand = defineCommand({
  meta: {
    name: 'run',
    description: 'Run test scenarios',
  },
  args: {
    scenario: {
      type: 'positional',
      description: 'Test scenario to run (help, version, error, all)',
      default: 'all',
    },
    environment: {
      type: 'string',
      description: 'Test environment (local, cleanroom)',
      default: 'local',
    },
    timeout: {
      type: 'number',
      description: 'Test timeout in milliseconds',
      default: 10000,
    },
  },
  run: async (ctx) => {
    const { scenario: scenarioName, environment, timeout, json, verbose } = ctx.args

    if (verbose) {
      consola.error(`Running ${scenarioName} scenario in ${environment} environment`)
    }

    try {
      let result

      if (environment === 'cleanroom') {
        await setupCleanroom({ rootDir: process.cwd() })
      }

      if (scenarioName === 'all') {
        // Run all scenarios
        const results = []

        // Help scenario
        const helpResult = await scenarios.help(environment).execute()
        results.push({ scenario: 'help', success: helpResult.success })

        // Version scenario
        const versionResult = await scenarios.version(environment).execute()
        results.push({ scenario: 'version', success: versionResult.success })

        result = {
          environment,
          scenarios: results,
          allPassed: results.every((r) => r.success),
          timestamp: new Date().toISOString(),
        }
      } else {
        // Run specific scenario
        const scenarioRunner = scenarios[scenarioName]
        if (!scenarioRunner) {
          const error = {
            error: 'Invalid scenario',
            scenario: scenarioName,
            validScenarios: Object.keys(scenarios),
          }
          if (json) {
            console.log(JSON.stringify(error))
          } else {
            consola.error(
              `Error: Invalid scenario. Valid scenarios: ${Object.keys(scenarios).join(', ')}`
            )
          }
          process.exit(1)
        }

        const scenarioResult = await scenarioRunner(environment).execute()
        result = {
          scenario: scenarioName,
          environment,
          success: scenarioResult.success,
          timestamp: new Date().toISOString(),
        }
      }

      if (json) {
        console.log(JSON.stringify(result))
      } else {
        if (result.allPassed !== undefined) {
          console.log(`Test Results (${environment}):`)
          result.scenarios.forEach((r) => {
            console.log(`  ${r.scenario}: ${r.success ? '✅ PASS' : '❌ FAIL'}`)
          })
          console.log(`Overall: ${result.allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`)
        } else {
          console.log(`${result.scenario}: ${result.success ? '✅ PASS' : '❌ FAIL'}`)
        }
      }
    } catch (error) {
      consola.fatal(`❌ Test run failed!`)
      throw error
    }
  },
})
