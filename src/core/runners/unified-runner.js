#!/usr/bin/env node
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
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { execSync } from 'node:child_process'

// Import existing runners
import { runLocalCitty as executeLocal, runLocalCittySafe } from './local-runner.js'
import { setupCleanroom, runCitty as executeCleanroom, teardownCleanroom } from './cleanroom-runner.js'
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
 * Note: Using z.any() for env due to Zod v4 record API limitations
 */
const UnifiedRunnerOptionsSchema = z.object({
  // CLI execution options
  cliPath: z.string().optional(),
  cwd: z.string().optional(),
  env: z.any().optional(), // Record<string, string> - using any() for Zod v4 compatibility
  timeout: z.number().positive().optional().default(30000),

  // Cleanroom options
  cleanroom: CleanroomConfigSchema,

  // Output options
  json: z.boolean().optional().default(false),

  // Mode override (bypasses auto-detection)
  mode: z.enum(['local', 'cleanroom', 'auto']).optional().default('auto'),
}).passthrough()

/**
 * Vitest config schema (citty section)
 */
const VitestCittyConfigSchema = z.object({
  cliPath: z.string().optional(),
  cwd: z.string().optional(),
  cleanroom: CleanroomConfigSchema.optional(),
  timeout: z.number().positive().optional(),
  env: z.any().optional(), // Record<string, string>
}).optional()

/**
 * Load vitest config and extract citty settings
 *
 * @param {string} [configPath] - Optional path to vitest config
 * @returns {Promise<Object>} Parsed citty config section or empty object
 */
async function loadVitestConfig(configPath) {
  try {
    // Try to find vitest config in current directory
    const cwd = process.cwd()
    const configFiles = [
      configPath,
      resolve(cwd, 'vitest.config.js'),
      resolve(cwd, 'vitest.config.mjs'),
      resolve(cwd, 'vitest.config.ts'),
    ].filter(Boolean)

    for (const file of configFiles) {
      if (existsSync(file)) {
        // Dynamically import the config
        const config = await import(file)
        const vitestConfig = config.default || config

        // Extract citty-specific settings from test.env or top-level citty key
        const cittyConfig = {
          cliPath: vitestConfig.test?.env?.TEST_CLI_PATH,
          cwd: vitestConfig.test?.env?.TEST_CWD,
          timeout: vitestConfig.test?.testTimeout,
          // Check for citty section
          ...(vitestConfig.citty || {}),
        }

        // Validate and return
        return VitestCittyConfigSchema.parse(cittyConfig)
      }
    }

    // No config found, return empty object
    return {}
  } catch (error) {
    // Config loading failed, return empty object (fail gracefully)
    console.warn(`Warning: Failed to load vitest config: ${error.message}`)
    return {}
  }
}

/**
 * Merge configuration with proper precedence
 * Priority: options > vitest config > environment > defaults
 *
 * @param {Object} vitestConfig - Config from vitest.config
 * @param {Object} options - User-provided options
 * @param {Object} defaults - Default values
 * @returns {Object} Merged configuration
 */
function mergeConfig(vitestConfig = {}, options = {}, defaults = {}) {
  return {
    // CLI path: options > vitest > env > default
    cliPath: options.cliPath
      || vitestConfig.cliPath
      || process.env.TEST_CLI_PATH
      || defaults.cliPath
      || './src/cli.mjs',

    // Working directory: options > vitest > env > default
    cwd: options.cwd
      || vitestConfig.cwd
      || process.env.TEST_CWD
      || defaults.cwd
      || process.cwd(),

    // Environment variables: merge all sources
    env: options.env !== undefined ? options.env : (vitestConfig.env || defaults.env || {}),

    // Timeout: options > vitest > default
    timeout: options.timeout
      || vitestConfig.timeout
      || defaults.timeout
      || 30000,

    // Cleanroom config: deep merge
    cleanroom: {
      enabled: options.cleanroom?.enabled
        ?? vitestConfig.cleanroom?.enabled
        ?? defaults.cleanroom?.enabled
        ?? false,
      nodeImage: options.cleanroom?.nodeImage
        || vitestConfig.cleanroom?.nodeImage
        || defaults.cleanroom?.nodeImage
        || 'node:20-alpine',
      memoryLimit: options.cleanroom?.memoryLimit
        || vitestConfig.cleanroom?.memoryLimit
        || defaults.cleanroom?.memoryLimit
        || '512m',
      cpuLimit: options.cleanroom?.cpuLimit
        || vitestConfig.cleanroom?.cpuLimit
        || defaults.cleanroom?.cpuLimit
        || '1.0',
      timeout: options.cleanroom?.timeout
        || vitestConfig.cleanroom?.timeout
        || defaults.cleanroom?.timeout
        || 60000,
      rootDir: options.cleanroom?.rootDir
        || vitestConfig.cleanroom?.rootDir
        || defaults.cleanroom?.rootDir
        || '.',
    },

    // JSON output flag
    json: options.json ?? defaults.json ?? false,

    // Mode override
    mode: options.mode || defaults.mode || 'auto',
  }
}

/**
 * Detect execution mode based on configuration
 *
 * @param {Object} config - Merged configuration
 * @returns {string} Detected mode: 'cleanroom' or 'local'
 */
function detectMode(config) {
  // If mode is explicitly set and not 'auto', use it
  if (config.mode !== 'auto') {
    return config.mode
  }

  // Auto-detect: check if cleanroom is enabled
  if (config.cleanroom?.enabled === true) {
    return 'cleanroom'
  }

  // Default to local mode
  return 'local'
}

/**
 * Execute CLI in local mode
 *
 * @param {string[]} args - CLI arguments
 * @param {Object} config - Merged configuration
 * @returns {Promise<Object>} Execution result
 */
async function executeLocalMode(args, config) {
  const { cliPath, cwd, env, timeout } = config

  // Validate CLI path exists
  const resolvedCliPath = resolve(cwd, cliPath)
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
      `  4. Check your working directory (cwd) is correct\n` +
      `  5. Configure in vitest.config: test.env.TEST_CLI_PATH`
    )
  }

  // Execute using local runner
  const result = executeLocal({
    cliPath,
    cwd,
    env,
    timeout,
    args,
  })

  return result
}

/**
 * Execute CLI in cleanroom mode
 *
 * @param {string[]} args - CLI arguments
 * @param {Object} config - Merged configuration
 * @returns {Promise<Object>} Execution result
 */
async function executeCleanroomMode(args, config) {
  const { cleanroom, cwd, env, timeout, json } = config

  // Setup cleanroom if not already initialized
  await setupCleanroom({
    rootDir: cleanroom.rootDir || cwd,
    nodeImage: cleanroom.nodeImage,
    memoryLimit: cleanroom.memoryLimit,
    cpuLimit: cleanroom.cpuLimit,
    timeout: cleanroom.timeout,
  })

  // Execute in cleanroom
  const result = await executeCleanroom(args, {
    json,
    cwd: '/app', // Container working directory
    timeout,
    env,
  })

  // The cleanroom runner already wraps with expectations
  return result
}

/**
 * Unified CLI runner with automatic mode detection
 *
 * Single function signature for all CLI testing needs.
 * Automatically detects whether to use local or cleanroom mode based on config.
 *
 * @param {string[]} args - CLI arguments to execute
 * @param {Object} [options={}] - Execution options (optional)
 * @param {string} [options.cliPath] - Path to CLI file (overrides config)
 * @param {string} [options.cwd] - Working directory (overrides config)
 * @param {Object} [options.env] - Environment variables (merged with config)
 * @param {number} [options.timeout=30000] - Execution timeout in ms
 * @param {Object} [options.cleanroom] - Cleanroom configuration
 * @param {boolean} [options.cleanroom.enabled] - Enable cleanroom mode
 * @param {string} [options.cleanroom.nodeImage] - Docker image
 * @param {string} [options.cleanroom.memoryLimit] - Memory limit
 * @param {string} [options.cleanroom.cpuLimit] - CPU limit
 * @param {boolean} [options.json=false] - Parse stdout as JSON
 * @param {string} [options.mode='auto'] - Force mode: 'local', 'cleanroom', or 'auto'
 * @returns {Promise<Object>} Result with fluent assertions
 *
 * @throws {Error} If CLI file not found (local mode)
 * @throws {Error} If Docker not available (cleanroom mode)
 * @throws {Error} If validation fails (invalid options)
 *
 * @example
 * // Auto-detect mode from config
 * const result = await runCitty(['--help'])
 * result.expectSuccess().expectOutput('Usage:')
 *
 * @example
 * // Force local mode
 * const result = await runCitty(['test'], { mode: 'local' })
 *
 * @example
 * // Force cleanroom mode
 * const result = await runCitty(['deploy'], {
 *   cleanroom: { enabled: true }
 * })
 *
 * @example
 * // Override config from vitest.config
 * const result = await runCitty(['build'], {
 *   cliPath: './custom-cli.js',
 *   timeout: 60000
 * })
 */
export async function runCitty(args, options = {}) {
  // Validate arguments
  if (!Array.isArray(args)) {
    throw new Error(
      `Invalid arguments: expected array, got ${typeof args}\n` +
      `Usage: runCitty(['--help'], options)\n` +
      `Example: runCitty(['test', '--verbose'])`
    )
  }

  // Validate options with Zod
  const validatedOptions = UnifiedRunnerOptionsSchema.parse(options)

  // Load vitest config
  const vitestConfig = await loadVitestConfig(validatedOptions.configPath)

  // Merge configuration with proper precedence
  const config = mergeConfig(vitestConfig, validatedOptions, {
    cliPath: './src/cli.mjs',
    cwd: process.cwd(),
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
  })

  // Detect mode
  const mode = detectMode(config)

  // Execute based on mode
  let result
  if (mode === 'cleanroom') {
    result = await executeCleanroomMode(args, config)
  } else {
    result = await executeLocalMode(args, config)
  }

  // Wrap with assertions if not already wrapped
  if (typeof result.expectSuccess !== 'function') {
    result = wrapExpectation(result)
  }

  // Add metadata about execution
  result.mode = mode
  result.config = config

  return result
}

/**
 * Safe version of runCitty that catches errors and returns result object
 * Useful for testing error cases without throwing
 *
 * @param {string[]} args - CLI arguments
 * @param {Object} [options={}] - Execution options
 * @returns {Promise<Object>} Result object (never throws)
 *
 * @example
 * // Test error handling
 * const result = await runCittySafe(['invalid-command'])
 * result.expectFailure().expectStderr('Unknown command')
 */
export async function runCittySafe(args, options = {}) {
  try {
    return await runCitty(args, options)
  } catch (error) {
    // Return error as result object
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

/**
 * Get current configuration (useful for debugging)
 *
 * @param {Object} [options={}] - Options to merge
 * @returns {Promise<Object>} Resolved configuration
 *
 * @example
 * const config = await getCittyConfig()
 * console.log('Mode:', config.mode)
 * console.log('CLI Path:', config.cliPath)
 * console.log('Cleanroom:', config.cleanroom)
 */
export async function getCittyConfig(options = {}) {
  const validatedOptions = UnifiedRunnerOptionsSchema.parse(options)
  const vitestConfig = await loadVitestConfig(validatedOptions.configPath)
  const config = mergeConfig(vitestConfig, validatedOptions, {
    cliPath: './src/cli.mjs',
    cwd: process.cwd(),
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
  })

  return {
    ...config,
    detectedMode: detectMode(config),
  }
}

/**
 * Re-export teardown for convenience
 */
export { teardownCleanroom }

// Default export
export default runCitty
