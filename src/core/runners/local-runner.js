#!/usr/bin/env node
/**
 * @fileoverview Local Runner for Citty Testing
 * @description Execute ANY CLI locally with proper validation and fail-fast behavior
 */

import { execSync } from 'child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

/**
 * Zod schema for runLocalCitty options
 * Defaults are read from environment variables set in test setup
 */
const LocalRunnerOptionsSchema = z.object({
  cliPath: z.string().optional().default(
    process.env.TEST_CLI_PATH || './src/cli.mjs'
  ),
  cwd: z.string().optional().default(
    process.env.TEST_CWD || process.cwd()
  ),
  env: z.record(z.string()).optional().default({}),
  timeout: z.number().positive().optional().default(30000),
  args: z.array(z.string()).optional().default([]),
})

/**
 * Execute ANY CLI command locally with full user control
 *
 * @param {Object} options - Execution options (validated with Zod)
 * @param {string} options.cliPath - REQUIRED: Path to CLI file to execute
 * @param {string} [options.cwd=process.cwd()] - Working directory for execution
 * @param {Object} [options.env={}] - Environment variables
 * @param {number} [options.timeout=30000] - Timeout in milliseconds
 * @param {string[]} [options.args=[]] - CLI arguments to pass
 * @returns {Object} Execution result with stdout, stderr, exitCode, durationMs
 *
 * @example
 * // Execute with explicit CLI path
 * const result = runLocalCitty({
 *   cliPath: './src/cli.mjs',
 *   args: ['--help'],
 *   cwd: '/path/to/project'
 * })
 *
 * @example
 * // Execute custom CLI in monorepo
 * const result = runLocalCitty({
 *   cliPath: './packages/my-cli/bin/cli.js',
 *   args: ['test', '--verbose'],
 *   env: { DEBUG: '1' }
 * })
 */
export function runLocalCitty(options) {
  // Validate options with Zod - throws immediately if invalid
  const validated = LocalRunnerOptionsSchema.parse(options)
  const { cliPath, cwd, env, timeout, args } = validated

  // Resolve CLI path to absolute
  const resolvedCliPath = resolve(cwd, cliPath)

  // Fail-fast: CLI file must exist
  if (!existsSync(resolvedCliPath)) {
    throw new Error(
      `CLI file not found: ${resolvedCliPath}\n` +
      `Expected path: ${cliPath}\n` +
      `Working directory: ${cwd}\n` +
      `Resolved to: ${resolvedCliPath}\n\n` +
      `Possible fixes:\n` +
      `  1. Check the cliPath is correct\n` +
      `  2. Ensure the file exists at the specified location\n` +
      `  3. Use an absolute path: cliPath: '/absolute/path/to/cli.js'\n` +
      `  4. Check your working directory (cwd) is correct`
    )
  }

  const startTime = Date.now()

  // Escape arguments containing spaces
  const escapedArgs = args.map(arg =>
    arg.includes(' ') ? `"${arg}"` : arg
  )

  const fullCommand = `node "${resolvedCliPath}" ${escapedArgs.join(' ')}`

  // Execute - no try-catch, let errors bubble (fail-fast!)
  const stdout = execSync(fullCommand, {
    cwd,
    env: { ...process.env, ...env },
    timeout,
    encoding: 'utf8',
    // Capture both stdout and stderr
    stdio: ['pipe', 'pipe', 'pipe']
  })

  const durationMs = Date.now() - startTime

  return {
    success: true,
    exitCode: 0,
    stdout: stdout.trim(),
    stderr: '',
    args,
    cliPath: resolvedCliPath,
    cwd,
    durationMs,
    command: fullCommand
  }
}

/**
 * Fluent assertion wrapper for test results
 * Use this to chain assertions on execution results
 *
 * @param {Object} result - Execution result from runLocalCitty
 * @returns {Object} Result with fluent assertion methods
 *
 * @example
 * const result = runLocalCitty({ cliPath: './cli.js', args: ['--help'] })
 * const assertions = wrapWithAssertions(result)
 * assertions
 *   .expectSuccess()
 *   .expectOutput('Usage:')
 *   .expectDuration(1000)
 */
export function wrapWithAssertions(result) {
  return {
    ...result,

    // Success/failure assertions
    expectSuccess() {
      if (result.exitCode !== 0) {
        throw new Error(
          `Expected success (exit code 0), got ${result.exitCode}\n` +
          `Command: ${result.command}\n` +
          `Working directory: ${result.cwd}\n` +
          `Stdout: ${result.stdout}\n` +
          `Stderr: ${result.stderr}`
        )
      }
      return this
    },

    expectFailure() {
      if (result.exitCode === 0) {
        throw new Error(
          `Expected failure (non-zero exit code), got ${result.exitCode}`
        )
      }
      return this
    },

    expectExit(code) {
      if (result.exitCode !== code) {
        throw new Error(
          `Expected exit code ${code}, got ${result.exitCode}\n` +
          `Stdout: ${result.stdout}\n` +
          `Stderr: ${result.stderr}`
        )
      }
      return this
    },

    // Output assertions
    expectOutput(pattern) {
      if (typeof pattern === 'string') {
        if (!result.stdout.includes(pattern)) {
          throw new Error(
            `Expected output to contain "${pattern}"\n` +
            `Got: ${result.stdout}`
          )
        }
      } else if (pattern instanceof RegExp) {
        if (!pattern.test(result.stdout)) {
          throw new Error(
            `Expected output to match ${pattern}\n` +
            `Got: ${result.stdout}`
          )
        }
      }
      return this
    },

    expectStderr(pattern) {
      if (typeof pattern === 'string') {
        if (!result.stderr.includes(pattern)) {
          throw new Error(
            `Expected stderr to contain "${pattern}"\n` +
            `Got: ${result.stderr}`
          )
        }
      } else if (pattern instanceof RegExp) {
        if (!pattern.test(result.stderr)) {
          throw new Error(
            `Expected stderr to match ${pattern}\n` +
            `Got: ${result.stderr}`
          )
        }
      }
      return this
    },

    // Performance assertions
    expectDuration(maxMs) {
      if (result.durationMs > maxMs) {
        throw new Error(
          `Expected duration <= ${maxMs}ms, got ${result.durationMs}ms`
        )
      }
      return this
    },

    // JSON assertions
    expectJson(validator) {
      const json = JSON.parse(result.stdout) // Throws if invalid JSON

      if (validator && typeof validator === 'function') {
        validator(json) // Throws if validation fails
      }

      return this
    },

    get json() {
      try {
        return JSON.parse(result.stdout)
      } catch {
        return undefined
      }
    }
  }
}

/**
 * Re-export runCitty from cleanroom-runner for convenience
 * This allows importing both runners from the same module
 */
export { runCitty } from './cleanroom-runner.js'

/**
 * Execute with error handling (catches execSync errors and returns result object)
 * Use this when you expect the command might fail and want to handle it gracefully
 *
 * @param {Object} options - Same options as runLocalCitty
 * @returns {Object} Result object (never throws, captures errors in result)
 */
export function runLocalCittySafe(options) {
  const validated = LocalRunnerOptionsSchema.parse(options)
  const { cliPath, cwd, env, timeout, args } = validated

  const resolvedCliPath = resolve(cwd, cliPath)

  if (!existsSync(resolvedCliPath)) {
    return {
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: `CLI file not found: ${resolvedCliPath}`,
      args,
      cliPath: resolvedCliPath,
      cwd,
      durationMs: 0,
      command: `node "${resolvedCliPath}" ${args.join(' ')}`
    }
  }

  const startTime = Date.now()
  const escapedArgs = args.map(arg =>
    arg.includes(' ') ? `"${arg}"` : arg
  )
  const fullCommand = `node "${resolvedCliPath}" ${escapedArgs.join(' ')}`

  try {
    const stdout = execSync(fullCommand, {
      cwd,
      env: { ...process.env, ...env },
      timeout,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })

    return {
      success: true,
      exitCode: 0,
      stdout: stdout.trim(),
      stderr: '',
      args,
      cliPath: resolvedCliPath,
      cwd,
      durationMs: Date.now() - startTime,
      command: fullCommand
    }
  } catch (error) {
    return {
      success: false,
      exitCode: error.status || 1,
      stdout: error.stdout ? error.stdout.toString().trim() : '',
      stderr: error.stderr ? error.stderr.toString().trim() : error.message,
      args,
      cliPath: resolvedCliPath,
      cwd,
      durationMs: Date.now() - startTime,
      command: fullCommand
    }
  }
}
