#!/usr/bin/env node
/**
 * @fileoverview Local Runner Implementation
 * @description Local process execution runner with PTY support
 */

import { spawn, exec } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { Runner, ExecResult, ExecOptions, ExecEnv } from '../contract/universal-contract.js'

const execAsync = promisify(exec)

/**
 * Local runner implementation using child_process
 * @extends Runner
 */
export class LocalRunner extends Runner {
  constructor(options = {}) {
    super()
    this.options = options
    this.processes = new Set()
  }

  /**
   * Get the runner's environment type
   * @returns {ExecEnv} Environment type
   */
  getEnvironment() {
    return ExecEnv.LOCAL
  }

  /**
   * Execute a command locally
   * @param {string|string[]} command - Command to execute
   * @param {ExecOptions} [options] - Execution options
   * @returns {Promise<ExecResult>} Execution result
   */
  async exec(command, options = {}) {
    const opts = new ExecOptions(options)
    const startTime = Date.now()

    // Convert command to array if string
    const cmdArray = Array.isArray(command) ? command : command.split(' ')
    const [cmd, ...args] = cmdArray

    // Prepare environment
    const env = {
      ...process.env,
      ...opts.env,
      // Deterministic environment
      TZ: 'UTC',
      LANG: 'C',
      LC_ALL: 'C',
      // Override color and terminal settings for testing
      FORCE_COLOR: '1',
      NODE_ENV: 'development',
      TERM: 'xterm-256color',
    }

    // Remove color suppression variables (must be after opts.env)
    delete env.NO_COLOR
    delete env.COLOR

    // Remove network access if requested
    if (opts.network === 'none') {
      // This would require more sophisticated network isolation
      // For now, we'll just set a flag
      env.CLI_TEST_NO_NETWORK = 'true'
    }

    return new Promise((resolve, reject) => {
      const process = spawn(cmd, args, {
        cwd: opts.cwd,
        env,
        stdio: opts.pty ? 'pipe' : ['pipe', 'pipe', 'pipe'],
      })

      this.processes.add(process)

      let stdout = ''
      let stderr = ''

      // Set up timeout
      const timeoutId = setTimeout(() => {
        process.kill('SIGTERM')
        reject(new Error(`Command timed out after ${opts.timeoutMs}ms`))
      }, opts.timeoutMs)

      // Capture output
      if (process.stdout) {
        process.stdout.on('data', (data) => {
          stdout += data.toString()
        })
      }

      if (process.stderr) {
        process.stderr.on('data', (data) => {
          stderr += data.toString()
        })
      }

      // Handle process completion
      process.on('close', (code, signal) => {
        clearTimeout(timeoutId)
        this.processes.delete(process)

        const durationMs = Date.now() - startTime

        const result = new ExecResult({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          durationMs,
          env: opts.env,
          cwd: opts.cwd,
          command: cmdArray.join(' '),
          environment: ExecEnv.LOCAL,
        })

        resolve(result)
      })

      process.on('error', (error) => {
        clearTimeout(timeoutId)
        this.processes.delete(process)
        reject(error)
      })
    })
  }

  /**
   * Execute command with PTY support for interactive CLIs
   * @param {string[]} command - Command to execute
   * @param {string} script - PTY interaction script
   * @param {ExecOptions} [options] - Execution options
   * @returns {Promise<ExecResult>} Execution result
   */
  async execPty(command, script, options = {}) {
    const opts = new ExecOptions(options)
    const startTime = Date.now()

    // For PTY support, we'll use a simplified approach
    // In a full implementation, you'd use node-pty or similar
    const cmdArray = Array.isArray(command) ? command : command.split(' ')
    const [cmd, ...args] = cmdArray

    // Prepare environment
    const env = {
      ...process.env,
      ...opts.env,
      TZ: 'UTC',
      LANG: 'C',
      LC_ALL: 'C',
    }

    return new Promise((resolve, reject) => {
      const process = spawn(cmd, args, {
        cwd: opts.cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      this.processes.add(process)

      let stdout = ''
      let stderr = ''

      // Set up timeout
      const timeoutId = setTimeout(() => {
        process.kill('SIGTERM')
        reject(new Error(`PTY command timed out after ${opts.timeoutMs}ms`))
      }, opts.timeoutMs)

      // Capture output
      if (process.stdout) {
        process.stdout.on('data', (data) => {
          stdout += data.toString()
        })
      }

      if (process.stderr) {
        process.stderr.on('data', (data) => {
          stderr += data.toString()
        })
      }

      // Send script input
      if (process.stdin && script) {
        process.stdin.write(script)
        process.stdin.end()
      }

      // Handle process completion
      process.on('close', (code, signal) => {
        clearTimeout(timeoutId)
        this.processes.delete(process)

        const durationMs = Date.now() - startTime

        const result = new ExecResult({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          durationMs,
          env: opts.env,
          cwd: opts.cwd,
          command: cmdArray.join(' '),
          environment: ExecEnv.LOCAL,
        })

        resolve(result)
      })

      process.on('error', (error) => {
        clearTimeout(timeoutId)
        this.processes.delete(process)
        reject(error)
      })
    })
  }

  /**
   * Setup local runner
   * @param {ExecOptions} [options] - Setup options
   * @returns {Promise<void>}
   */
  async setup(options = {}) {
    // Local runner doesn't need setup
    return Promise.resolve()
  }

  /**
   * Teardown local runner
   * @returns {Promise<void>}
   */
  async teardown() {
    // Kill any remaining processes
    for (const process of this.processes) {
      try {
        process.kill('SIGTERM')
      } catch (error) {
        // Process may already be dead
      }
    }
    this.processes.clear()
    return Promise.resolve()
  }
}

/**
 * Create a local runner instance
 * @param {Object} [options] - Runner options
 * @returns {LocalRunner} Local runner instance
 */
export function createLocalRunner(options = {}) {
  return new LocalRunner(options)
}
