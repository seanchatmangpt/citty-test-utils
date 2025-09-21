#!/usr/bin/env node
/**
 * @fileoverview Legacy Compatibility Layer
 * @description Provides compatibility between universal contract and legacy Citty-specific functions
 */

import { LocalRunner } from './local-runner.js'
import { DockerRunner } from './docker-runner.js'
import { ExecResult } from '../contract/universal-contract.js'

// Legacy compatibility functions for Citty-specific usage
let localRunner = null
let dockerRunner = null

/**
 * Legacy runLocalCitty function for Citty-specific projects
 * @param {string[]} command - Command array (e.g., ['--help'] or ['gen', 'project'])
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Result with fluent assertions
 */
export async function runLocalCitty(command, options = {}) {
  if (!localRunner) {
    localRunner = new LocalRunner()
  }

  // Always use the main CLI for testing (not test-cli.mjs)
  const fullCommand = ['node', 'src/cli.mjs', ...command]

  const result = await localRunner.exec(fullCommand, options)

  // Wrap result with legacy fluent assertion methods and add result property for compatibility
  const wrapped = wrapWithLegacyAssertions(result)
  wrapped.result = result
  return wrapped
}

/**
 * Legacy runCitty function for cleanroom testing
 * @param {string[]} command - Command array (e.g., ['--help'] or ['gen', 'project'])
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Result with fluent assertions
 */
export async function runCitty(command, options = {}) {
  if (!dockerRunner) {
    dockerRunner = new DockerRunner()
    await dockerRunner.setup()
  }

  // Always use the main CLI for testing (not test-cli.mjs)
  const fullCommand = ['node', 'src/cli.mjs', ...command]

  const result = await dockerRunner.exec(fullCommand, options)

  // Wrap result with legacy fluent assertion methods and add result property for compatibility
  const wrapped = wrapWithLegacyAssertions(result)
  wrapped.result = result
  return wrapped
}

/**
 * Legacy setupCleanroom function
 * @param {Object} options - Setup options
 */
export async function setupCleanroom(options = {}) {
  if (!dockerRunner) {
    dockerRunner = new DockerRunner(options)
    await dockerRunner.setup()
  }
}

/**
 * Legacy teardownCleanroom function
 */
export async function teardownCleanroom() {
  if (dockerRunner) {
    await dockerRunner.teardown()
    dockerRunner = null
  }
}

/**
 * Wrap ExecResult with legacy fluent assertion methods
 * @param {ExecResult} result - Universal contract result
 * @returns {Object} Result with legacy methods
 */
function wrapWithLegacyAssertions(result) {
  return {
    ...result,
    // Add result property for legacy compatibility
    result: result,

    // Legacy fluent assertion methods
    expectSuccess() {
      if (result.exitCode !== 0) {
        throw new Error(`Expected success (exit code 0), got ${result.exitCode}`)
      }
      return this
    },

    expectFailure() {
      if (result.exitCode === 0) {
        throw new Error(`Expected failure (non-zero exit code), got ${result.exitCode}`)
      }
      return this
    },

    expectExit(code) {
      if (result.exitCode !== code) {
        throw new Error(`Expected exit code ${code}, got ${result.exitCode}`)
      }
      return this
    },

    expectOutput(pattern) {
      if (typeof pattern === 'string') {
        if (!result.stdout.includes(pattern)) {
          throw new Error(`Expected output to contain "${pattern}", got: ${result.stdout}`)
        }
      } else if (pattern instanceof RegExp) {
        if (!pattern.test(result.stdout)) {
          throw new Error(`Expected output to match ${pattern}, got: ${result.stdout}`)
        }
      }
      return this
    },

    expectOutputContains(text) {
      if (!result.stdout.includes(text)) {
        throw new Error(`Expected output to contain "${text}", got: ${result.stdout}`)
      }
      return this
    },

    expectOutputNotContains(text) {
      if (result.stdout.includes(text)) {
        throw new Error(`Expected output not to contain "${text}", got: ${result.stdout}`)
      }
      return this
    },

    expectStderr(pattern) {
      if (typeof pattern === 'string') {
        if (!result.stderr.includes(pattern)) {
          throw new Error(`Expected stderr to contain "${pattern}", got: ${result.stderr}`)
        }
      } else if (pattern instanceof RegExp) {
        if (!pattern.test(result.stderr)) {
          throw new Error(`Expected stderr to match ${pattern}, got: ${result.stderr}`)
        }
      }
      return this
    },

    expectNoOutput() {
      if (result.stdout.trim() !== '') {
        throw new Error(`Expected no output, got: ${result.stdout}`)
      }
      return this
    },

    expectNoStderr() {
      if (result.stderr.trim() !== '') {
        throw new Error(`Expected no stderr, got: ${result.stderr}`)
      }
      return this
    },

    expectOutputLength(min, max) {
      const length = result.stdout.length
      if (length < min || length > max) {
        throw new Error(`Expected output length between ${min} and ${max}, got ${length}`)
      }
      return this
    },

    expectStderrLength(min, max) {
      const length = result.stderr.length
      if (length < min || length > max) {
        throw new Error(`Expected stderr length between ${min} and ${max}, got ${length}`)
      }
      return this
    },

    expectDuration(maxMs) {
      if (result.durationMs > maxMs) {
        throw new Error(`Expected duration <= ${maxMs}ms, got ${result.durationMs}ms`)
      }
      return this
    },

    expectJson(validator) {
      try {
        const json = JSON.parse(result.stdout)
        if (validator && typeof validator === 'function') {
          try {
            validator(json)
          } catch (validationError) {
            throw new Error(`JSON validation failed: ${validationError.message}`)
          }
        }
        // Add json property to the result for legacy compatibility
        this.json = json
        return this
      } catch (error) {
        if (error.message.includes('JSON validation failed')) {
          throw error
        }
        throw new Error(`Expected valid JSON output, got: ${result.stdout}`)
      }
    },

    // Add json property getter for legacy compatibility
    get json() {
      try {
        return JSON.parse(result.stdout)
      } catch {
        return undefined
      }
    },
  }
}
