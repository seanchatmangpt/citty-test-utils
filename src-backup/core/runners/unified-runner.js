/**
 * @fileoverview Unified Runner for Citty Testing (v1.0.0)
 * @description Single entry point for running CLI tests with automatic mode detection
 *
 * Features:
 * - Auto-detect mode: cleanroom vs local based on config
 * - Config hierarchy: vitest.config > options > defaults
 * - Fluent assertions on results
 * - Fail-fast with clear error messages
 *
 * @example
 * // Simple usage - auto-detects mode from config
 * const result = await runCitty(['--help'])
 * result.expectSuccess().expectOutput('Usage:')
 *
 * @example
 * // Override config with options
 * const result = await runCitty(['test'], {
 *   cleanroom: { enabled: false }, // Force local mode
 *   timeout: 5000
 * })
 *
 * @example
 * // Explicit cleanroom config
 * const result = await runCitty(['deploy'], {
 *   cleanroom: {
 *     enabled: true,
 *     nodeImage: 'node:20-alpine',
 *     memoryLimit: '1g'
 *   }
 * })
 */

import { existsSync } from 'node:fs'
import { resolve } from 'pathe'
import { z } from 'zod'
import { execSync } from 'node:child_process'
import { loadConfig } from 'c12'
import { defu } from 'defu'
import { consola } from '../utils/logging.js'

// Import existing runners
import { runLocalCitty as executeLocal, runLocalCittySafe } from './local-runner.js'
import { setupCleanroom, runCitty as executeCleanroom, teardownCleanroom, isCleanroomActive } from './cleanroom-runner.js'
import { wrapExpectation } from '../assertions/assertions.js'

/**
 * Zod schema for cleanroom configuration
 */
const CleanroomConfigSchema = z.object({
  enabled: z.boolean().default(false),
  nodeImage: z.string().optional().default('node:20-alpine'),
  memoryLimit: z.string().optional().default('512m'),
  cpuLimit: z.string().optional().default('1.0'),
  timeout: z.number().positive().optional().default(60000),
  rootDir: z.string().optional().default('.'),
}).optional()

/**
 * Zod schema for unified runner options
 */
const UnifiedRunnerOptionsSchema = z.object({
  // CLI execution options
  cliPath: z.string().optional(),
  cwd: z.string().optional(),
  env: z.any().optional(),
  timeout: z.number().positive().optional(),

  // Cleanroom options
  cleanroom: CleanroomConfigSchema,

  // Output options
  json: z.boolean().optional(),

  // Mode override
  mode: z.enum(['local', 'cleanroom', 'auto']).optional(),
}).passthrough()

/**
 * Load project configuration using c12
 */
async function loadCittyConfig(cwd = process.cwd(), overrides = {}) {
  const defaults = {
    cliPath: process.env.TEST_CLI_PATH || './src/cli.mjs',
    cwd: cwd && existsSync(cwd) ? cwd : process.cwd(),
    env: {},
    timeout: 30000,
    cleanroom: {
      enabled: false,
      nodeImage: 'node:20-alpine',
      memoryLimit: '512m',
      cpuLimit: '1.0',
      timeout: 60000,
      rootDir: '.',
    },
    json: false,
    mode: 'auto',
  }

  try {
    const { config } = await loadConfig({
      name: 'ctu',
      cwd: cwd && existsSync(cwd) ? cwd : process.cwd(),
      defaults,
      overrides,
    })

    return config
  } catch (error) {
    consola.warn(`Failed to load configuration: ${error.message}`)
    return defu(overrides, defaults)
  }
}

/**
 * Unified CLI runner with automatic mode detection
 */
export async function runCitty(args, options = {}) {
  // Validate arguments
  if (!Array.isArray(args)) {
    throw new Error(
      `Invalid arguments: expected array, got ${typeof args}\n` +
      `Usage: runCitty(['--help'], options)`
    )
  }

  // Load and merge config
  const config = await loadCittyConfig(options.cwd, options)

  // Detect mode
  const mode = config.mode === 'auto' 
    ? (config.cleanroom?.enabled || isCleanroomActive() ? 'cleanroom' : 'local')
    : config.mode

  // Execute based on mode
  let result
  if (mode === 'cleanroom') {
    result = await executeCleanroomMode(args, config)
  } else {
    result = await executeLocalMode(args, config)
  }

  // Wrap with assertions
  if (typeof result.expectSuccess !== 'function') {
    result = wrapExpectation(result)
  }

  result.mode = mode
  result.config = config

  return result
}

async function executeLocalMode(args, config) {
  const { cliPath, cwd, env, timeout } = config
  const resolvedCliPath = resolve(cwd, cliPath)

  if (!existsSync(resolvedCliPath)) {
    throw new Error(`CLI file not found: ${resolvedCliPath}`)
  }

  return executeLocal({ cliPath, cwd, env, timeout, args, failFast: false })
}

async function executeCleanroomMode(args, config) {
  const { cleanroom, cwd, env, timeout, json } = config

  checkDockerAvailability()

  await setupCleanroom({
    rootDir: cleanroom.rootDir || cwd,
    nodeImage: cleanroom.nodeImage,
    memoryLimit: cleanroom.memoryLimit,
    cpuLimit: cleanroom.cpuLimit,
    timeout: cleanroom.timeout,
  })

  return await executeCleanroom(args, { json, cwd: '/app', timeout, env })
}

function checkDockerAvailability() {
  try {
    execSync('docker ps', { stdio: 'pipe' })
  } catch (error) {
    throw new Error(`Docker is not available: ${error.message}`)
  }
}

export async function runCittySafe(args, options = {}) {
  try {
    return await runCitty(args, options)
  } catch (error) {
    return wrapExpectation({
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: error.message || String(error),
      args,
      cwd: options.cwd || process.cwd(),
      durationMs: 0,
      command: `runCitty(${JSON.stringify(args)})`,
      error,
    })
  }
}

export async function getCittyConfig(options = {}) {
  const config = await loadCittyConfig(options.cwd, options)
  return {
    ...config,
    detectedMode: config.mode === 'auto'
      ? (config.cleanroom?.enabled ? 'cleanroom' : 'local')
      : config.mode
  }
}

/**
 * Re-export teardown for convenience
 */
export { teardownCleanroom }

// Default export
export default runCitty
