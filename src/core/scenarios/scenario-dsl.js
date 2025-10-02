// Scenario DSL v1.0.0 - Simplified API
import { runLocalCitty, wrapWithAssertions } from '../runners/local-runner.js'
import { runCitty } from '../runners/cleanroom-runner.js'
import { matchSnapshot, snapshotUtils } from '../assertions/snapshot.js'

/**
 * Create a new test scenario with simplified v1.0.0 API
 *
 * @param {string} name - Scenario name
 * @returns {Object} Scenario builder with chainable methods
 *
 * @example v1.0.0 API
 * await scenario('Test')
 *   .step('Help', '--help').expectSuccess()
 *   .step('Build', ['build', '--prod']).expectSuccess()
 *   .execute()
 */
export function scenario(name) {
  const steps = []
  let currentStep = null
  let concurrentMode = false
  let mode = null // 'local', 'cleanroom', or null (auto-detect)

  const builder = {
    // Expose steps for testing
    get _steps() {
      return steps
    },

    /**
     * v1.0.0 API: Define a step with args combined
     * @param {string} stepName - Step description
     * @param {string|string[]} args - Command arguments (string gets split, array used as-is)
     * @param {Object} options - Optional execution options (cwd, env, timeout)
     * @returns {Object} this for chaining
     *
     * @example
     * .step('Run help', '--help')
     * .step('Build prod', ['build', '--prod'])
     * .step('Custom path', ['init'], { cwd: '/tmp/test' })
     */
    step(stepName, args, options = {}) {
      // Parse args into array
      const argsArray = typeof args === 'string'
        ? args.trim().split(/\s+/)
        : Array.isArray(args)
          ? args
          : []

      currentStep = {
        description: stepName,
        args: argsArray,
        options,
        expectations: [],
        action: null,
      }

      steps.push(currentStep)
      return this
    },

    /**
     * Add custom action step (advanced usage)
     */
    action(stepName, actionFn) {
      currentStep = {
        description: stepName,
        args: null,
        options: {},
        expectations: [],
        action: actionFn,
      }

      steps.push(currentStep)
      return this
    },

    /**
     * Add custom expectation function
     */
    expect(expectationFn) {
      if (!currentStep) {
        throw new Error('Must call step() before expect()')
      }
      currentStep.expectations.push(expectationFn)
      return this
    },

    /**
     * Enable concurrent execution mode
     */
    concurrent() {
      concurrentMode = true
      return this
    },

    /**
     * Disable concurrent execution mode (default)
     */
    sequential() {
      concurrentMode = false
      return this
    },

    /**
     * Set execution mode explicitly (optional, for backward compatibility)
     * @param {'local'|'cleanroom'} executionMode
     */
    mode(executionMode) {
      mode = executionMode
      return this
    },

    /**
     * v1.0.0 API: Execute all steps with auto-detected mode
     * Mode auto-detection:
     * 1. Uses explicitly set mode via .mode()
     * 2. Checks TEST_RUNNER environment variable
     * 3. Defaults to 'local'
     *
     * @returns {Promise<Object>} Execution results
     */
    async execute() {
      // Auto-detect mode if not explicitly set
      const executionMode = mode || process.env.TEST_RUNNER || 'local'

      const results = []
      let lastResult = null

      if (concurrentMode) {
        // Execute all steps concurrently
        console.log(`🚀 Executing ${steps.length} steps concurrently (${executionMode} mode)`)

        const concurrentPromises = steps.map(async (step, index) => {
          if (!step.args && !step.action) {
            throw new Error(`Step "${step.description}" has no args or action`)
          }

          if (!step.action && step.expectations.length === 0) {
            throw new Error(`Step "${step.description}" has no expectations`)
          }

          console.log(`🔄 Starting concurrent step ${index + 1}: ${step.description}`)

          let result

          if (step.action) {
            // Execute custom action
            result = await step.action({ lastResult, context: {} })
          } else {
            // Execute using unified runner
            result = await executeStep(step, executionMode)
          }

          // Apply expectations - let them crash if they fail
          for (const expectation of step.expectations) {
            expectation(result)
          }

          console.log(`✅ Concurrent step ${index + 1} completed: ${step.description}`)
          return { step: step.description, result, success: true, index }
        })

        const concurrentResults = await Promise.all(concurrentPromises)

        // Sort results by original step order
        concurrentResults.sort((a, b) => a.index - b.index)

        // Extract results and lastResult
        for (const concurrentResult of concurrentResults) {
          results.push(concurrentResult)
          if (concurrentResult.result) {
            lastResult = concurrentResult.result
          }
        }

        console.log(`🎉 All ${steps.length} concurrent steps completed`)
      } else {
        // Execute steps sequentially
        for (const step of steps) {
          if (!step.args && !step.action) {
            throw new Error(`Step "${step.description}" has no args or action`)
          }

          if (!step.action && step.expectations.length === 0) {
            throw new Error(`Step "${step.description}" has no expectations`)
          }

          console.log(`🔄 Executing: ${step.description}`)

          let result

          if (step.action) {
            // Execute custom action
            result = await step.action({ lastResult, context: {} })
          } else {
            // Execute using unified runner
            result = await executeStep(step, executionMode)
          }

          lastResult = result

          // Apply expectations - let them crash if they fail
          for (const expectation of step.expectations) {
            expectation(result)
          }

          results.push({ step: step.description, result, success: true })
          console.log(`✅ Step completed: ${step.description}`)
        }
      }

      return {
        scenario: name,
        results,
        success: results.every((r) => r.success),
        lastResult,
        concurrent: concurrentMode,
        mode: executionMode,
      }
    },

    // Convenience expectation methods
    expectSuccess() {
      return this.expect((result) => result.expectSuccess())
    },

    expectFailure() {
      return this.expect((result) => result.expectFailure())
    },

    expectExit(code) {
      return this.expect((result) => result.expectExit(code))
    },

    expectOutput(match) {
      return this.expect((result) => result.expectOutput(match))
    },

    expectStderr(match) {
      return this.expect((result) => result.expectStderr(match))
    },

    expectNoOutput() {
      return this.expect((result) => result.expectNoOutput())
    },

    expectNoStderr() {
      return this.expect((result) => result.expectNoStderr())
    },

    expectJson(validator) {
      return this.expect((result) => result.expectJson(validator))
    },

    // Snapshot testing methods
    expectSnapshot(snapshotName, options = {}) {
      return this.expect((result) => result.expectSnapshot(snapshotName, options))
    },

    expectSnapshotStdout(snapshotName, options = {}) {
      return this.expect((result) => result.expectSnapshotStdout(snapshotName, options))
    },

    expectSnapshotStderr(snapshotName, options = {}) {
      return this.expect((result) => result.expectSnapshotStderr(snapshotName, options))
    },

    expectSnapshotJson(snapshotName, options = {}) {
      return this.expect((result) => result.expectSnapshotJson(snapshotName, options))
    },

    expectSnapshotFull(snapshotName, options = {}) {
      return this.expect((result) => result.expectSnapshotFull(snapshotName, options))
    },

    expectSnapshotOutput(snapshotName, options = {}) {
      return this.expect((result) => result.expectSnapshotOutput(snapshotName, options))
    },

    // Snapshot step - creates a snapshot without expectations
    snapshot(snapshotName, options = {}) {
      return this.action(`Snapshot: ${snapshotName}`, async ({ lastResult }) => {
        if (!lastResult) {
          throw new Error('No previous result available for snapshot')
        }

        const testFile = options.testFile || getCallerFile()
        const snapshotType = options.type || 'stdout'
        const snapshotData = snapshotUtils.createSnapshotFromResult(lastResult, snapshotType)

        const snapshotResult = matchSnapshot(snapshotData, testFile, snapshotName, {
          args: lastResult.args,
          env: options.env,
          ...options,
        })

        if (!snapshotResult.match) {
          throw new Error(snapshotResult.error || `Snapshot mismatch: ${snapshotName}`)
        }

        return {
          snapshotName,
          snapshotResult,
          success: true,
        }
      })
    },
  }

  return builder
}

/**
 * Execute a single step using the appropriate runner
 * @private
 */
async function executeStep(step, executionMode) {
  const { args, options } = step

  if (executionMode === 'cleanroom') {
    // Cleanroom execution
    return await runCitty(args, {
      cwd: options.cwd || '/app',
      env: options.env || {},
      timeout: options.timeout || 10000,
    })
  } else {
    // Local execution (default)
    const runOptions = {
      args,
      cliPath: options.cliPath || process.env.TEST_CLI_PATH || './src/cli.mjs',
      cwd: options.cwd || process.env.TEST_CWD || process.cwd(),
      env: { ...options.env, TEST_CLI: 'true' },
      timeout: options.timeout || 30000,
    }

    const result = runLocalCitty(runOptions)
    return wrapWithAssertions(result)
  }
}

// Export concurrent scenario factory function
export function concurrentScenario(name) {
  return scenario(name).concurrent()
}

// Helper function to get caller file for snapshot testing
function getCallerFile() {
  const stack = new Error().stack
  const lines = stack.split('\n')

  // Find the first line that's not from this file
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes('.test.') || line.includes('.spec.')) {
      const match = line.match(/\((.+):\d+:\d+\)/)
      if (match) {
        return match[1]
      }
    }
  }

  // Fallback to current working directory
  return process.cwd()
}

// Utility functions for common test patterns
export const testUtils = {
  // Wait for a condition to be true
  async waitFor(conditionFn, timeout = 5000, interval = 100) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (await conditionFn()) return true
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
    throw new Error(`Condition not met within ${timeout}ms`)
  },

  // Retry a command until it succeeds
  async retry(runnerFn, maxAttempts = 3, delay = 1000) {
    let lastError
    for (let i = 0; i < maxAttempts; i++) {
      try {
        return await runnerFn()
      } catch (error) {
        lastError = error
        if (i < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }
    throw lastError
  },

  // Create a temporary file for testing
  async createTempFile(content, extension = '.txt') {
    const { writeFileSync, mkdtempSync } = await import('node:fs')
    const { join } = await import('node:path')
    const { tmpdir } = await import('node:os')

    const tempDir = mkdtempSync(join(tmpdir(), 'citty-test-'))
    const tempFile = join(tempDir, `test${extension}`)
    writeFileSync(tempFile, content)
    return tempFile
  },

  // Clean up temporary files - handle errors gracefully
  async cleanupTempFiles(files) {
    const { unlinkSync, rmdirSync } = await import('node:fs')
    const { dirname } = await import('node:path')

    for (const file of files) {
      try {
        unlinkSync(file)
        rmdirSync(dirname(file))
      } catch (error) {
        // Ignore errors for non-existent files
        if (error.code !== 'ENOENT') {
          throw error
        }
      }
    }
  },
}

// Convenience functions for different runner types
export function cleanroomScenario(name) {
  return scenario(name).mode('cleanroom')
}

export function localScenario(name) {
  return scenario(name).mode('local')
}

// Pre-built scenario templates (v1.0.0 API)
export const scenarioTemplates = {
  help: (options = {}) =>
    scenario('Help command')
      .step('Show help', '--help', options)
      .expectSuccess()
      .expectOutput(/USAGE/),

  version: (options = {}) =>
    scenario('Version check')
      .step('Get version', '--version', options)
      .expectSuccess()
      .expectOutput(/\d+\.\d+\.\d+/),

  invalidCommand: (options = {}) =>
    scenario('Invalid command handling')
      .step('Run invalid command', 'invalid-command', options)
      .expectFailure()
      .expectStderr(/Unknown command|not found/),

  initProject: (projectName = 'test-project', options = {}) =>
    scenario(`Initialize ${projectName}`)
      .step('Initialize project', ['init', projectName], options)
      .expectSuccess()
      .expectOutput(/Initialized/)
      .step('Check status', 'status', options)
      .expectSuccess(),

  buildAndTest: (options = {}) =>
    scenario('Build and test workflow')
      .step('Build project', 'build', options)
      .expectSuccess()
      .expectOutput(/Build complete/)
      .step('Run tests', 'test', options)
      .expectSuccess()
      .expectOutput(/Tests passed/),

  // Cleanroom-specific scenarios
  cleanroomInit: (projectName = 'test-project') =>
    cleanroomScenario(`Cleanroom init ${projectName}`)
      .step('Initialize in cleanroom', ['init', projectName])
      .expectSuccess()
      .step('List files', 'ls')
      .expectSuccess()
      .expectOutput(projectName),

  // Local development scenarios
  localDev: (options = {}) =>
    localScenario('Local development')
      .step('Start dev server', 'dev', { ...options, env: { NODE_ENV: 'development' } })
      .expectSuccess()
      .expectOutput(/Development server/),

  // Snapshot testing scenarios
  snapshotHelp: (options = {}) =>
    scenario('Snapshot help output')
      .step('Get help', '--help', options)
      .expectSuccess()
      .expectSnapshotStdout('help-output'),

  snapshotVersion: (options = {}) =>
    scenario('Snapshot version output')
      .step('Get version', '--version', options)
      .expectSuccess()
      .expectSnapshotStdout('version-output'),

  snapshotError: (options = {}) =>
    scenario('Snapshot error output')
      .step('Run invalid command', 'invalid-command', options)
      .expectFailure()
      .expectSnapshotStderr('error-output'),

  snapshotFull: (options = {}) =>
    scenario('Snapshot full result')
      .step('Run command', 'status', options)
      .expectSuccess()
      .expectSnapshotFull('status-result'),

  snapshotWorkflow: (options = {}) =>
    scenario('Snapshot workflow')
      .step('Initialize project', ['init', 'test-project'], options)
      .expectSuccess()
      .snapshot('init-output')
      .step('Check status', 'status', options)
      .expectSuccess()
      .snapshot('status-output', { type: 'full' }),

  // Cleanroom snapshot scenarios
  cleanroomSnapshot: (options = {}) =>
    cleanroomScenario('Cleanroom snapshot')
      .step('Run in cleanroom', '--version', options)
      .expectSuccess()
      .expectSnapshotStdout('cleanroom-version'),

  // Local snapshot scenarios
  localSnapshot: (options = {}) =>
    localScenario('Local snapshot')
      .step('Run locally', '--help', options)
      .expectSuccess()
      .expectSnapshotStdout('local-help'),
}
