#!/usr/bin/env node
/**
 * @fileoverview Local runner command for Citty CLI
 * @description Execute CLI commands locally with fluent assertions
 */

import { defineCommand } from 'citty'
import { runLocalCitty } from '../../core/runners/local-runner.js'

/**
 * Local runner command definition
 * Executes CLI commands in the local environment
 */
export const localCommand = defineCommand({
  meta: {
    name: 'local',
    description: 'Run command locally with fluent assertions',
  },
  args: {
    command: {
      type: 'positional',
      description: 'Command to run (e.g., "--help", "gen project")',
      required: true,
    },
    timeout: {
      type: 'number',
      description: 'Command timeout in milliseconds',
      default: 10000,
    },
    'cli-path': {
      type: 'string',
      description: 'Path to CLI file to execute',
    },
    cwd: {
      type: 'string',
      description: 'Working directory for command execution',
    },
  },
  run: async (ctx) => {
    const { command, timeout, json, verbose, 'cli-path': cliPath, cwd } = ctx.args

    if (verbose) {
      console.error(`Running command locally: ${command}`)
    }

    // Parse command string into array
    const commandArray = command.split(' ').filter(Boolean)

    // Execute using local runner - NO try-catch, fail fast!
    const result = await runLocalCitty(commandArray, {
      timeout,
      json,
      cliPath,
      cwd: cwd || process.cwd(),
    })

    // Format output based on json flag
    if (json) {
      console.log(JSON.stringify({
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: result.durationMs,
        command: commandArray,
        environment: 'local',
        timestamp: new Date().toISOString(),
      }, null, 2))
    } else {
      console.log(`Running locally: ${command}`)
      console.log(`Exit Code: ${result.exitCode}`)
      console.log(`Duration: ${result.durationMs}ms`)
      console.log(`\nOutput:\n${result.stdout}`)

      if (result.stderr) {
        console.error(`\nErrors:\n${result.stderr}`)
      }
    }

    // Exit with same code as command
    process.exit(result.exitCode)
  },
})
