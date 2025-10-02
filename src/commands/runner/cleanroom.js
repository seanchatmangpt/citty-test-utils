#!/usr/bin/env node
/**
 * @fileoverview Cleanroom runner command for Citty CLI
 * @description Execute CLI commands in isolated Docker container
 */

import { defineCommand } from 'citty'
import { setupCleanroom, runCitty, teardownCleanroom } from '../../core/runners/cleanroom-runner.js'

/**
 * Cleanroom runner command definition
 * Executes CLI commands in isolated Docker environment
 */
export const cleanroomCommand = defineCommand({
  meta: {
    name: 'cleanroom',
    description: 'Run command in isolated cleanroom (Docker container)',
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
    'docker-image': {
      type: 'string',
      description: 'Docker image to use',
      default: 'node:20-alpine',
    },
    'root-dir': {
      type: 'string',
      description: 'Root directory to mount in container',
      default: '.',
    },
    'memory-limit': {
      type: 'string',
      description: 'Container memory limit',
      default: '512m',
    },
    'cpu-limit': {
      type: 'string',
      description: 'Container CPU limit',
      default: '1.0',
    },
    teardown: {
      type: 'boolean',
      description: 'Teardown container after execution',
      default: true,
    },
  },
  run: async (ctx) => {
    const {
      command,
      timeout,
      json,
      verbose,
      'docker-image': dockerImage,
      'root-dir': rootDir,
      'memory-limit': memoryLimit,
      'cpu-limit': cpuLimit,
      teardown,
    } = ctx.args

    if (verbose) {
      console.error(`Setting up cleanroom environment...`)
    }

    // Setup cleanroom container - NO try-catch, fail fast!
    await setupCleanroom({
      rootDir,
      nodeImage: dockerImage,
      memoryLimit,
      cpuLimit,
      timeout: timeout * 2, // Give container extra time to start
    })

    if (verbose) {
      console.error(`Running command in cleanroom: ${command}`)
    }

    // Parse command string into array
    const commandArray = command.split(' ').filter(Boolean)

    // Execute using cleanroom runner - NO try-catch, fail fast!
    const result = await runCitty(commandArray, {
      timeout,
      json,
      cwd: '/app',
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
        environment: 'cleanroom',
        dockerImage,
        timestamp: new Date().toISOString(),
      }, null, 2))
    } else {
      console.log(`Running in cleanroom: ${command}`)
      console.log(`Docker Image: ${dockerImage}`)
      console.log(`Exit Code: ${result.exitCode}`)
      console.log(`Duration: ${result.durationMs}ms`)
      console.log(`\nOutput:\n${result.stdout}`)

      if (result.stderr) {
        console.error(`\nErrors:\n${result.stderr}`)
      }
    }

    // Teardown if requested
    if (teardown) {
      if (verbose) {
        console.error(`Tearing down cleanroom environment...`)
      }
      await teardownCleanroom()
    }

    // Exit with same code as command
    process.exit(result.exitCode)
  },
})
