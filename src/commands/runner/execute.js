#!/usr/bin/env node
// src/commands/runner/execute.js - Runner execute verb command

import { defineCommand } from 'citty'
import { spawn, exec } from 'node:child_process'
import { promisify } from 'node:util'
import { runCitty } from '../../core/runners/cleanroom-runner.js'

const execAsync = promisify(exec)

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

    let result

    if (environment === 'cleanroom') {
      // For cleanroom, we need to use runCitty but with a different approach
      // Since runCitty is designed for CLI commands, we'll use it to run the command
      // through the CLI's runner execute functionality - NO try-catch, fail fast!
      const cleanroomResult = await runCitty(
        ['runner', 'execute', command, '--environment', 'local'],
        {
          cwd: '/app',
          timeout,
          env: { TEST_CLI: 'true' },
        }
      )

      result = {
        environment: 'cleanroom',
        command,
        exitCode: cleanroomResult.exitCode,
        stdout: cleanroomResult.stdout,
        stderr: cleanroomResult.stderr,
        success: cleanroomResult.exitCode === 0,
        timestamp: new Date().toISOString(),
      }
    } else {
      // Run command locally using exec - let errors bubble up
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        env: { ...process.env },
      }).catch(error => {
        // Transform exec errors into result format but still throw
        const errorResult = {
          environment: 'local',
          command,
          exitCode: error.code || 1,
          stdout: error.stdout || '',
          stderr: error.stderr || error.message,
          success: false,
          timestamp: new Date().toISOString(),
        }

        // Output the error result then throw
        if (json) {
          console.log(JSON.stringify(errorResult))
        } else {
          console.log(`Command: ${command}`)
          console.log(`Environment: ${environment}`)
          console.log(`Exit Code: ${errorResult.exitCode}`)
          console.log(`Success: ❌`)
          if (errorResult.stdout) {
            console.log('Output:')
            console.log(errorResult.stdout)
          }
          if (errorResult.stderr) {
            console.log('Errors:')
            console.log(errorResult.stderr)
          }
        }

        throw error
      })

      result = {
        environment: 'local',
        command,
        exitCode: 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: true,
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
  },
})
