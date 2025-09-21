#!/usr/bin/env node
/**
 * @fileoverview Docker Runner Implementation
 * @description Docker container execution runner with network policies and file tracking
 */

import testcontainers from 'testcontainers'
const { GenericContainer } = testcontainers
import { join, resolve } from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import {
  Runner,
  ExecResult,
  ExecOptions,
  ExecEnv,
  FileArtifact,
} from '../contract/universal-contract.js'

/**
 * Docker runner implementation using testcontainers
 * @extends Runner
 */
export class DockerRunner extends Runner {
  constructor(options = {}) {
    super()
    this.options = {
      image: 'node:20-alpine',
      workingDir: '/app',
      mounts: [],
      networkPolicy: 'online',
      ...options,
    }
    this.container = null
    this.fileSnapshot = new Map()
  }

  /**
   * Get the runner's environment type
   * @returns {ExecEnv} Environment type
   */
  getEnvironment() {
    return ExecEnv.DOCKER
  }

  /**
   * Setup Docker runner with container
   * @param {ExecOptions} [options] - Setup options
   * @returns {Promise<void>}
   */
  async setup(options = {}) {
    const opts = new ExecOptions(options)

    // Create container with source code mounted
    this.container = await new GenericContainer(this.options.image)
      .withCopyDirectoriesToContainer([{ source: process.cwd(), target: '/app' }])
      .withWorkingDir(this.options.workingDir)
      .withEnvironment({
        TZ: 'UTC',
        LANG: 'C',
        LC_ALL: 'C',
        // Override color suppression for testing
        FORCE_COLOR: '1',
        ...opts.env,
      })
      .withBindMounts(this.options.mounts)
      .withNetworkMode(this.getNetworkMode())
      .withCommand(['sleep', 'infinity'])
      .start()

    // Take initial file snapshot
    await this.takeFileSnapshot()
  }

  /**
   * Get network mode based on policy
   * @returns {string} Docker network mode
   */
  getNetworkMode() {
    switch (this.options.networkPolicy) {
      case 'none':
        return 'none'
      case 'offline':
        return 'bridge' // Bridge with no external access
      case 'online':
      default:
        return 'bridge'
    }
  }

  /**
   * Take snapshot of files in container
   * @returns {Promise<void>}
   */
  async takeFileSnapshot() {
    try {
      const { output } = await this.container.exec(['find', this.options.workingDir, '-type', 'f'])
      const files = output.split('\n').filter((f) => f.trim())

      for (const file of files) {
        try {
          const { output: content } = await this.container.exec(['cat', file])
          this.fileSnapshot.set(file, content)
        } catch (error) {
          // File might not be readable, skip
        }
      }
    } catch (error) {
      // Container might not have find command, skip snapshot
    }
  }

  /**
   * Compare file snapshots to detect changes
   * @returns {Promise<FileArtifact[]>} File changes
   */
  async detectFileChanges() {
    const changes = []

    try {
      const { output } = await this.container.exec(['find', this.options.workingDir, '-type', 'f'])
      const currentFiles = output.split('\n').filter((f) => f.trim())

      // Check for new/modified files
      for (const file of currentFiles) {
        try {
          const { output: content } = await this.container.exec(['cat', file])
          const previousContent = this.fileSnapshot.get(file)

          if (!previousContent) {
            // New file
            changes.push(new FileArtifact(file, 'created', content, content.length))
          } else if (previousContent !== content) {
            // Modified file
            changes.push(new FileArtifact(file, 'modified', content, content.length))
          }
        } catch (error) {
          // File might not be readable, skip
        }
      }

      // Check for deleted files
      for (const [file] of this.fileSnapshot) {
        if (!currentFiles.includes(file)) {
          changes.push(new FileArtifact(file, 'deleted'))
        }
      }
    } catch (error) {
      // Container might not have find command, skip change detection
    }

    return changes
  }

  /**
   * Execute a command in Docker container
   * @param {string|string[]} command - Command to execute
   * @param {ExecOptions} [options] - Execution options
   * @returns {Promise<ExecResult>} Execution result
   */
  async exec(command, options = {}) {
    if (!this.container) {
      throw new Error('Docker runner not set up. Call setup() first.')
    }

    const opts = new ExecOptions(options)
    const startTime = Date.now()

    // Convert command to array if string
    const cmdArray = Array.isArray(command) ? command : command.split(' ')

    // Build full command with CLI path
    const fullCommand = ['node', 'src/cli.mjs', ...cmdArray]

    // Prepare environment
    const env = {
      TZ: 'UTC',
      LANG: 'C',
      LC_ALL: 'C',
      // Override color suppression for testing
      FORCE_COLOR: '1',
      ...opts.env,
    }

    // Remove color suppression variables
    delete env.NO_COLOR

    // Remove network access if requested
    if (opts.network === 'none') {
      env.CLI_TEST_NO_NETWORK = 'true'
    }

    try {
      const { exitCode, output, stderr } = await this.container.exec(fullCommand, {
        workdir: opts.cwd || this.options.workingDir,
        env,
        timeout: opts.timeoutMs,
      })

      const durationMs = Date.now() - startTime

      // Detect file changes
      const fileChanges = await this.detectFileChanges()

      const result = new ExecResult({
        exitCode: exitCode || 0,
        stdout: output.trim(),
        stderr: stderr.trim(),
        durationMs,
        files: fileChanges,
        env: opts.env,
        cwd: opts.cwd || this.options.workingDir,
        command: fullCommand.join(' '),
        environment: ExecEnv.DOCKER,
      })

      return result
    } catch (error) {
      const durationMs = Date.now() - startTime

      return new ExecResult({
        exitCode: 1,
        stdout: '',
        stderr: error.message,
        durationMs,
        files: [],
        env: opts.env,
        cwd: opts.cwd || this.options.workingDir,
        command: fullCommand.join(' '),
        environment: ExecEnv.DOCKER,
      })
    }
  }

  /**
   * Execute command with PTY support in Docker container
   * @param {string[]} command - Command to execute
   * @param {string} script - PTY interaction script
   * @param {ExecOptions} [options] - Execution options
   * @returns {Promise<ExecResult>} Execution result
   */
  async execPty(command, script, options = {}) {
    if (!this.container) {
      throw new Error('Docker runner not set up. Call setup() first.')
    }

    const opts = new ExecOptions(options)
    const startTime = Date.now()

    // Convert command to array if string
    const cmdArray = Array.isArray(command) ? command : command.split(' ')

    // Prepare environment
    const env = {
      TZ: 'UTC',
      LANG: 'C',
      LC_ALL: 'C',
      ...opts.env,
    }

    try {
      // For PTY in Docker, we'll use a script approach
      const scriptContent = `#!/bin/bash
${cmdArray.join(' ')} << 'EOF'
${script}
EOF`

      const { exitCode, output, stderr } = await this.container.exec(
        ['bash', '-c', scriptContent],
        {
          workdir: opts.cwd || this.options.workingDir,
          env,
          timeout: opts.timeoutMs,
        }
      )

      const durationMs = Date.now() - startTime

      // Detect file changes
      const fileChanges = await this.detectFileChanges()

      const result = new ExecResult({
        exitCode: exitCode || 0,
        stdout: output.trim(),
        stderr: stderr.trim(),
        durationMs,
        files: fileChanges,
        env: opts.env,
        cwd: opts.cwd || this.options.workingDir,
        command: fullCommand.join(' '),
        environment: ExecEnv.DOCKER,
      })

      return result
    } catch (error) {
      const durationMs = Date.now() - startTime

      return new ExecResult({
        exitCode: 1,
        stdout: '',
        stderr: error.message,
        durationMs,
        files: [],
        env: opts.env,
        cwd: opts.cwd || this.options.workingDir,
        command: fullCommand.join(' '),
        environment: ExecEnv.DOCKER,
      })
    }
  }

  /**
   * Teardown Docker runner
   * @returns {Promise<void>}
   */
  async teardown() {
    if (this.container) {
      await this.container.stop()
      this.container = null
    }
    this.fileSnapshot.clear()
    return Promise.resolve()
  }

  /**
   * Get container instance (for advanced usage)
   * @returns {StartedTestContainer|null} Container instance
   */
  getContainer() {
    return this.container
  }
}

/**
 * Create a Docker runner instance
 * @param {Object} [options] - Runner options
 * @returns {DockerRunner} Docker runner instance
 */
export function createDockerRunner(options = {}) {
  return new DockerRunner(options)
}
