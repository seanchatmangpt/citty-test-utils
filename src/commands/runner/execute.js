#!/usr/bin/env node
// src/commands/runner/execute.js - Runner execute verb command

import { defineCommand } from 'citty'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../../index.js'

export const executeCommand = defineCommand({
  meta: {
    name: 'execute',
    description: 'Execute command with custom runner',
  },
  args: {
    command: {
      type: 'positional',
      description: 'Command to run',
      required: true,
    },
    environment: {
      type: 'string',
      description: 'Runner environment (local, cleanroom)',
      default: 'local',
    },
    timeout: {
      type: 'number',
      description: 'Command timeout in milliseconds',
      default: 10000,
    },
    cwd: {
      type: 'string',
      description: 'Working directory',
      default: '.',
    },
  },
  run: async (ctx) => {
    const { command, environment, timeout, cwd, json, verbose } = ctx.args

    if (verbose) {
      console.error(`Running command "${command}" in ${environment} environment`)
    }

    try {
      let result

      if (environment === 'cleanroom') {
        // Setup cleanroom
        await setupCleanroom({ rootDir: cwd, timeout: 60000 })

        try {
          // Run command in cleanroom
          const cleanroomResult = await runCitty([command], {
            cwd: '/app',
            timeout,
            env: { TEST_CLI: 'true' },
          })

          result = {
            environment: 'cleanroom',
            command,
            exitCode: cleanroomResult.result.exitCode,
            stdout: cleanroomResult.result.stdout,
            stderr: cleanroomResult.result.stderr,
            success: cleanroomResult.result.exitCode === 0,
            timestamp: new Date().toISOString(),
          }
        } finally {
          // Always cleanup
          await teardownCleanroom()
        }
      } else {
        // Run command locally
        const localResult = await runLocalCitty([command], {
          cwd,
          timeout,
          env: { TEST_CLI: 'true' },
        })

        result = {
          environment: 'local',
          command,
          exitCode: localResult.result.exitCode,
          stdout: localResult.result.stdout,
          stderr: localResult.result.stderr,
          success: localResult.result.exitCode === 0,
          timestamp: new Date().toISOString(),
        }
      }

      if (json) {
        console.log(JSON.stringify(result))
      } else {
        console.log(`Command: ${command}`)
        console.log(`Environment: ${environment}`)
        console.log(`Exit Code: ${result.exitCode}`)
        console.log(`Success: ${result.success ? '✅' : '❌'}`)
        if (result.stdout) {
          console.log('Output:')
          console.log(result.stdout)
        }
        if (result.stderr) {
          console.log('Errors:')
          console.log(result.stderr)
        }
      }
    } catch (error) {
      const errorResult = {
        error: error.message,
        command,
        environment,
        timestamp: new Date().toISOString(),
      }

      if (json) {
        console.log(JSON.stringify(errorResult))
      } else {
        console.error(`Runner failed: ${error.message}`)
      }
      process.exit(1)
    }
  },
})
