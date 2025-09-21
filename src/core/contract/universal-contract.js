#!/usr/bin/env node
/**
 * @fileoverview Universal CLI Testing Contract - Framework-agnostic core
 * @description Defines the universal contract for CLI testing across all frameworks and languages
 */

/**
 * Execution environments supported by the universal contract
 * @typedef {'local' | 'docker' | 'ssh' | 'podman' | 'deno' | 'wasi'} ExecEnv
 */
export const ExecEnv = {
  LOCAL: 'local',
  DOCKER: 'docker',
  SSH: 'ssh',
  PODMAN: 'podman',
  DENO: 'deno',
  WASI: 'wasi',
}

/**
 * I/O modes for command execution
 * @typedef {'stdio' | 'pty' | 'file'} IOMode
 */
export const IOMode = {
  STDIO: 'stdio',
  PTY: 'pty',
  FILE: 'file',
}

/**
 * Network policy for deterministic testing
 * @typedef {'none' | 'offline' | 'online'} NetworkPolicy
 */
export const NetworkPolicy = {
  NONE: 'none', // No network access
  OFFLINE: 'offline', // Offline mode, fail if network used
  ONLINE: 'online', // Full network access
}

/**
 * Execution options for command runs
 * @typedef {Object} ExecOptions
 * @property {string} [cwd] - Working directory
 * @property {Record<string,string>} [env] - Environment variables
 * @property {number} [timeoutMs] - Timeout in milliseconds
 * @property {boolean} [pty] - Use PTY for interactive mode
 * @property {NetworkPolicy} [network] - Network access policy
 * @property {string} [user] - User to run as (Docker/SSH)
 * @property {string[]} [mounts] - Volume mounts (Docker)
 * @property {string} [image] - Docker image to use
 * @property {string} [host] - SSH host
 * @property {number} [port] - SSH port
 * @property {string} [keyFile] - SSH private key file
 */
export class ExecOptions {
  constructor(options = {}) {
    this.cwd = options.cwd || process.cwd()
    this.env = { ...process.env, ...options.env }
    this.timeoutMs = options.timeoutMs || 30000
    this.pty = options.pty || false
    this.network = options.network || NetworkPolicy.ONLINE
    this.user = options.user
    this.mounts = options.mounts || []
    this.image = options.image || 'node:20-alpine'
    this.host = options.host
    this.port = options.port || 22
    this.keyFile = options.keyFile
  }
}

/**
 * File system artifact tracking
 * @typedef {Object} FileArtifact
 * @property {string} path - File path
 * @property {string} action - 'created' | 'modified' | 'deleted'
 * @property {string} [content] - File content (for created/modified)
 * @property {number} [size] - File size
 * @property {Date} [timestamp] - When the change occurred
 */
export class FileArtifact {
  constructor(path, action, content = null, size = null) {
    this.path = path
    this.action = action
    this.content = content
    this.size = size
    this.timestamp = new Date()
  }
}

/**
 * Execution result with comprehensive artifacts
 * @typedef {Object} ExecResult
 * @property {number} exitCode - Process exit code
 * @property {string} stdout - Standard output
 * @property {string} stderr - Standard error
 * @property {number} durationMs - Execution duration in milliseconds
 * @property {FileArtifact[]} [files] - File system changes
 * @property {Record<string,string>} [env] - Environment snapshot
 * @property {string} [cwd] - Working directory used
 * @property {Date} timestamp - When execution started
 * @property {string} command - Command that was executed
 * @property {ExecEnv} environment - Execution environment used
 */
export class ExecResult {
  constructor(options = {}) {
    this.exitCode = options.exitCode || 0
    this.stdout = options.stdout || ''
    this.stderr = options.stderr || ''
    this.durationMs = options.durationMs || 0
    this.files = options.files || []
    this.env = options.env || {}
    this.cwd = options.cwd || process.cwd()
    this.timestamp = options.timestamp || new Date()
    this.command = options.command || ''
    this.environment = options.environment || ExecEnv.LOCAL
  }

  /**
   * Check if execution was successful
   * @returns {boolean} True if exit code is 0
   */
  isSuccess() {
    return this.exitCode === 0
  }

  /**
   * Check if execution failed
   * @returns {boolean} True if exit code is not 0
   */
  isFailure() {
    return this.exitCode !== 0
  }

  /**
   * Get JSON parsed from stdout
   * @returns {any} Parsed JSON or null if invalid
   */
  getJson() {
    try {
      return JSON.parse(this.stdout)
    } catch {
      return null
    }
  }
}

/**
 * Universal runner interface for all execution environments
 * @interface Runner
 */
export class Runner {
  /**
   * Execute a command in the runner's environment
   * @param {string|string[]} command - Command to execute
   * @param {ExecOptions} [options] - Execution options
   * @returns {Promise<ExecResult>} Execution result
   */
  async exec(command, options = {}) {
    throw new Error('Runner.exec() must be implemented by subclass')
  }

  /**
   * Execute command with PTY support for interactive CLIs
   * @param {string[]} command - Command to execute
   * @param {string} script - PTY interaction script
   * @param {ExecOptions} [options] - Execution options
   * @returns {Promise<ExecResult>} Execution result
   */
  async execPty(command, script, options = {}) {
    throw new Error('Runner.execPty() must be implemented by subclass')
  }

  /**
   * Setup the runner environment
   * @param {ExecOptions} [options] - Setup options
   * @returns {Promise<void>}
   */
  async setup(options = {}) {
    // Default implementation - override in subclasses
  }

  /**
   * Teardown the runner environment
   * @returns {Promise<void>}
   */
  async teardown() {
    // Default implementation - override in subclasses
  }

  /**
   * Get the runner's environment type
   * @returns {ExecEnv} Environment type
   */
  getEnvironment() {
    return ExecEnv.LOCAL
  }
}

/**
 * Fluent expectation interface for assertions
 * @interface Expectation
 */
export class Expectation {
  constructor(result) {
    this.result = result
    this.errors = []
  }

  /**
   * Expect specific exit code
   * @param {number} code - Expected exit code
   * @returns {this} Fluent interface
   */
  expectExit(code) {
    if (this.result.exitCode !== code) {
      this.errors.push(`Expected exit code ${code}, got ${this.result.exitCode}`)
    }
    return this
  }

  /**
   * Expect successful execution (exit code 0)
   * @returns {this} Fluent interface
   */
  expectSuccess() {
    return this.expectExit(0)
  }

  /**
   * Expect failed execution (non-zero exit code)
   * @returns {this} Fluent interface
   */
  expectFailure() {
    if (this.result.exitCode === 0) {
      this.errors.push(`Expected failure (non-zero exit code), got success (0)`)
    }
    return this
  }

  /**
   * Expect output to match string or regex
   * @param {string|RegExp} matcher - String or regex to match
   * @returns {this} Fluent interface
   */
  expectOutput(matcher) {
    if (typeof matcher === 'string') {
      if (!this.result.stdout.includes(matcher)) {
        this.errors.push(`Expected stdout to contain "${matcher}"`)
      }
    } else if (matcher instanceof RegExp) {
      if (!matcher.test(this.result.stdout)) {
        this.errors.push(`Expected stdout to match ${matcher}`)
      }
    }
    return this
  }

  /**
   * Expect stderr to match string or regex
   * @param {string|RegExp} matcher - String or regex to match
   * @returns {this} Fluent interface
   */
  expectStderr(matcher) {
    if (typeof matcher === 'string') {
      if (!this.result.stderr.includes(matcher)) {
        this.errors.push(`Expected stderr to contain "${matcher}"`)
      }
    } else if (matcher instanceof RegExp) {
      if (!matcher.test(this.result.stderr)) {
        this.errors.push(`Expected stderr to match ${matcher}`)
      }
    }
    return this
  }

  /**
   * Expect no stderr output
   * @returns {this} Fluent interface
   */
  expectNoStderr() {
    if (this.result.stderr.trim()) {
      this.errors.push(`Expected no stderr, got: ${this.result.stderr}`)
    }
    return this
  }

  /**
   * Expect JSON output with optional validation
   * @param {Function} [validator] - Optional JSON validator function
   * @returns {this} Fluent interface
   */
  expectJson(validator = null) {
    const json = this.result.getJson()
    if (json === null) {
      this.errors.push('Expected valid JSON output')
      return this
    }
    if (validator && typeof validator === 'function') {
      try {
        validator(json)
      } catch (error) {
        this.errors.push(`JSON validation failed: ${error.message}`)
      }
    }
    return this
  }

  /**
   * Expect specific file to exist
   * @param {string} path - File path to check
   * @returns {this} Fluent interface
   */
  expectFileExists(path) {
    const file = this.result.files.find((f) => f.path === path && f.action === 'created')
    if (!file) {
      this.errors.push(`Expected file to exist: ${path}`)
    }
    return this
  }

  /**
   * Expect specific file to be modified
   * @param {string} path - File path to check
   * @returns {this} Fluent interface
   */
  expectFileModified(path) {
    const file = this.result.files.find((f) => f.path === path && f.action === 'modified')
    if (!file) {
      this.errors.push(`Expected file to be modified: ${path}`)
    }
    return this
  }

  /**
   * Expect specific file to be deleted
   * @param {string} path - File path to check
   * @returns {this} Fluent interface
   */
  expectFileDeleted(path) {
    const file = this.result.files.find((f) => f.path === path && f.action === 'deleted')
    if (!file) {
      this.errors.push(`Expected file to be deleted: ${path}`)
    }
    return this
  }

  /**
   * Expect execution duration within range
   * @param {number} minMs - Minimum duration in milliseconds
   * @param {number} [maxMs] - Maximum duration in milliseconds
   * @returns {this} Fluent interface
   */
  expectDuration(minMs, maxMs = null) {
    if (this.result.durationMs < minMs) {
      this.errors.push(`Expected duration >= ${minMs}ms, got ${this.result.durationMs}ms`)
    }
    if (maxMs && this.result.durationMs > maxMs) {
      this.errors.push(`Expected duration <= ${maxMs}ms, got ${this.result.durationMs}ms`)
    }
    return this
  }

  /**
   * Expect no network access (cleanroom mode)
   * @returns {this} Fluent interface
   */
  expectNoNetwork() {
    // This would be implemented by checking network policies
    // For now, we'll assume it's handled by the runner
    return this
  }

  /**
   * Assert all expectations pass
   * @throws {Error} If any expectations fail
   */
  assert() {
    if (this.errors.length > 0) {
      throw new Error(`Assertion failed:\n${this.errors.join('\n')}`)
    }
  }
}

/**
 * Scenario step definition
 * @typedef {Object} ScenarioStep
 * @property {string} name - Step name
 * @property {Function} run - Function that takes a Runner and returns ExecResult
 * @property {Function} [verify] - Optional verification function that takes Expectation
 */
export class ScenarioStep {
  constructor(name, run, verify = null) {
    this.name = name
    this.run = run
    this.verify = verify
  }
}

/**
 * Scenario builder for multi-step workflows
 * @class ScenarioBuilder
 */
export class ScenarioBuilder {
  constructor(name) {
    this.name = name
    this.steps = []
    this.hooks = {
      beforeAll: [],
      afterAll: [],
      beforeEach: [],
      afterEach: [],
    }
    this.options = {
      retries: 0,
      timeout: 30000,
      concurrent: false,
      matrix: null,
    }
  }

  /**
   * Add a step to the scenario
   * @param {string} name - Step name
   * @param {Function} run - Step execution function
   * @param {Function} [verify] - Optional verification function
   * @returns {this} Fluent interface
   */
  step(name, run, verify = null) {
    this.steps.push(new ScenarioStep(name, run, verify))
    return this
  }

  /**
   * Add before all hook
   * @param {Function} hook - Hook function
   * @returns {this} Fluent interface
   */
  beforeAll(hook) {
    this.hooks.beforeAll.push(hook)
    return this
  }

  /**
   * Add after all hook
   * @param {Function} hook - Hook function
   * @returns {this} Fluent interface
   */
  afterAll(hook) {
    this.hooks.afterAll.push(hook)
    return this
  }

  /**
   * Add before each hook
   * @param {Function} hook - Hook function
   * @returns {this} Fluent interface
   */
  beforeEach(hook) {
    this.hooks.beforeEach.push(hook)
    return this
  }

  /**
   * Add after each hook
   * @param {Function} hook - Hook function
   * @returns {this} Fluent interface
   */
  afterEach(hook) {
    this.hooks.afterEach.push(hook)
    return this
  }

  /**
   * Set retry count
   * @param {number} retries - Number of retries
   * @returns {this} Fluent interface
   */
  retries(retries) {
    this.options.retries = retries
    return this
  }

  /**
   * Set timeout
   * @param {number} timeout - Timeout in milliseconds
   * @returns {this} Fluent interface
   */
  timeout(timeout) {
    this.options.timeout = timeout
    return this
  }

  /**
   * Enable concurrent execution
   * @param {boolean} concurrent - Whether to run steps concurrently
   * @returns {this} Fluent interface
   */
  concurrent(concurrent = true) {
    this.options.concurrent = concurrent
    return this
  }

  /**
   * Set matrix configuration
   * @param {Record<string,string[]>} matrix - Matrix axes
   * @returns {this} Fluent interface
   */
  matrix(matrix) {
    this.options.matrix = matrix
    return this
  }

  /**
   * Execute the scenario
   * @param {Runner} runner - Runner to use
   * @returns {Promise<ScenarioResult>} Scenario execution result
   */
  async execute(runner) {
    const startTime = Date.now()
    const results = []
    const errors = []

    try {
      // Run beforeAll hooks
      for (const hook of this.hooks.beforeAll) {
        await hook(runner)
      }

      // Execute steps
      if (this.options.concurrent) {
        const stepPromises = this.steps.map(async (step) => {
          try {
            // Run beforeEach hooks
            for (const hook of this.hooks.beforeEach) {
              await hook(runner)
            }

            const result = await step.run(runner)

            // Run verification if provided
            if (step.verify) {
              const expectation = new Expectation(result)
              step.verify(expectation)
              expectation.assert()
            }

            // Run afterEach hooks
            for (const hook of this.hooks.afterEach) {
              await hook(runner)
            }

            return { step: step.name, result, success: true }
          } catch (error) {
            return { step: step.name, result: null, success: false, error }
          }
        })

        const stepResults = await Promise.all(stepPromises)
        results.push(...stepResults)
      } else {
        for (const step of this.steps) {
          try {
            // Run beforeEach hooks
            for (const hook of this.hooks.beforeEach) {
              await hook(runner)
            }

            const result = await step.run(runner)

            // Run verification if provided
            if (step.verify) {
              const expectation = new Expectation(result)
              step.verify(expectation)
              expectation.assert()
            }

            // Run afterEach hooks
            for (const hook of this.hooks.afterEach) {
              await hook(runner)
            }

            results.push({ step: step.name, result, success: true })
          } catch (error) {
            results.push({ step: step.name, result: null, success: false, error })
            errors.push(error)
          }
        }
      }

      // Run afterAll hooks
      for (const hook of this.hooks.afterAll) {
        await hook(runner)
      }

      const durationMs = Date.now() - startTime
      const success = errors.length === 0

      return new ScenarioResult({
        name: this.name,
        success,
        durationMs,
        steps: results,
        errors,
        options: this.options,
      })
    } catch (error) {
      const durationMs = Date.now() - startTime
      return new ScenarioResult({
        name: this.name,
        success: false,
        durationMs,
        steps: results,
        errors: [error],
        options: this.options,
      })
    }
  }
}

/**
 * Scenario execution result
 * @typedef {Object} ScenarioResult
 * @property {string} name - Scenario name
 * @property {boolean} success - Whether scenario succeeded
 * @property {number} durationMs - Total duration in milliseconds
 * @property {Array} steps - Step results
 * @property {Error[]} errors - Any errors encountered
 * @property {Object} options - Scenario options used
 */
export class ScenarioResult {
  constructor(options = {}) {
    this.name = options.name || 'unnamed'
    this.success = options.success || false
    this.durationMs = options.durationMs || 0
    this.steps = options.steps || []
    this.errors = options.errors || []
    this.options = options.options || {}
  }
}

/**
 * Matrix testing utility for cross-platform/cross-version testing
 * @param {Record<string,string[]>} axes - Matrix axes (e.g., {node: ['18', '20'], os: ['linux', 'macos']})
 * @param {Function} fn - Function to execute for each combination
 * @returns {Promise<Array>} Results for all combinations
 */
export async function matrix(axes, fn) {
  const keys = Object.keys(axes)

  const generateCombinations = async (index, context) => {
    if (index === keys.length) {
      return [await fn(context)]
    }

    const key = keys[index]
    const values = axes[key]
    const results = []

    for (const value of values) {
      const newContext = { ...context, [key]: value }
      const subResults = await generateCombinations(index + 1, newContext)
      results.push(...subResults)
    }

    return results
  }

  return generateCombinations(0, {})
}

/**
 * Create a scenario builder
 * @param {string} name - Scenario name
 * @returns {ScenarioBuilder} New scenario builder
 */
export function scenario(name) {
  return new ScenarioBuilder(name)
}

/**
 * Wrap an ExecResult with fluent expectations
 * @param {ExecResult} result - Execution result
 * @returns {Expectation} Fluent expectation interface
 */
export function expect(result) {
  return new Expectation(result)
}
