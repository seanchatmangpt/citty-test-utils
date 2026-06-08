/**
 * @fileoverview Local Runner for Citty Testing
 */

import { spawnSync } from 'child_process'
import { existsSync, statSync } from 'node:fs'
import { resolve, dirname } from 'pathe'
import { destr } from 'destr'
import { consola, monitorPerformance } from '../utils/logging.js'
import { fileURLToPath } from 'node:url'
import { wrapExpectation } from '../assertions/assertions.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultCliPath = resolve(__dirname, '../../../src/cli.mjs')

/**
 * Normalizes input arguments and options into a standard object
 */
function normalizeOptions(firstArg, secondArg) {
  const ensureArrayOfStrings = (a) => {
    if (a === null || a === undefined) return []
    if (Array.isArray(a)) return a.map(val => String(val))
    if (typeof a === 'string') {
      const trimmed = a.trim()
      return trimmed === '' ? [] : trimmed.split(/\s+/)
    }
    return [String(a)]
  }

  if (secondArg !== undefined) {
    if (firstArg === null || firstArg === undefined) {
      throw new TypeError('Command arguments must be a string or an array of strings')
    }
    return { ...secondArg, args: ensureArrayOfStrings(firstArg) }
  }

  if (firstArg === null || firstArg === undefined) {
    return { args: [] }
  }

  const isPlainObject = (val) => {
    return val !== null && typeof val === 'object' && !Array.isArray(val) && Object.getPrototypeOf(val) === Object.prototype
  }

  if (!isPlainObject(firstArg)) {
    return { args: ensureArrayOfStrings(firstArg) }
  }

  const opts = { ...firstArg }
  opts.args = ensureArrayOfStrings(opts.args)
  return opts
}

/**
 * Enhanced error reporter using consola
 */
function reportCommandFailure(result) {
  consola.error(`Command failed: ${result.command}`)
  
  consola.box({
    title: '❌ Execution Error',
    style: { padding: 1, borderColor: 'red' },
    message: [
      `Exit Code: ${result.exitCode}`,
      `Duration:  ${result.durationMs}ms`,
      `CLI Path:  ${result.cliPath}`,
      '',
      '--- Stdout ---',
      result.stdout || '(empty)',
      '',
      '--- Stderr ---',
      result.stderr || '(empty)',
    ].join('\n')
  })
}

/**
 * Core runner function for local execution
 */
export function runLocalCitty(firstArg, secondArg) {
  const isPositional = Array.isArray(firstArg) || typeof firstArg === 'string'
  let options
  try {
    options = normalizeOptions(firstArg, secondArg)
  } catch (err) {
    if (isPositional) {
      const res = { success: false, exitCode: 1, stdout: '', stderr: err.message, args: [], cliPath: '', cwd: process.cwd(), durationMs: 0, duration: 0, command: 'unknown' }
      return wrapWithAssertions(res)
    }
    throw err
  }

  // Manual Validation - matches test expectations for specific error strings
  if (options.cliPath === '') throw new Error('cliPath cannot be empty')
  if (options.cliPath !== undefined && typeof options.cliPath !== 'string') throw new Error('cliPath must be a string')
  if (options.timeout !== undefined && (typeof options.timeout !== 'number' || options.timeout <= 0)) throw new Error('timeout must be a positive number')
  if (options.env !== undefined && (options.env === null || typeof options.env !== 'object')) throw new Error('env must be an object')
  if (options.env) {
    for (const [key, value] of Object.entries(options.env)) {
      if (typeof value !== 'string') throw new Error(`env value for key "${key}" must be a string`)
    }
  }
  
  if (!options.cwd && process.env.TEST_CWD) options.cwd = process.env.TEST_CWD
  
  let targetCliPath = options.cliPath
  if (!targetCliPath) {
    if (options.env?.TEST_CLI === 'true' || process.env.TEST_CLI === 'true') targetCliPath = defaultCliPath
    else if (process.env.TEST_CLI_PATH) targetCliPath = process.env.TEST_CLI_PATH
  }

  const finalCliPath = targetCliPath || defaultCliPath
  const cwd = options.cwd || process.cwd()
  const env = options.env || {}
  const timeout = options.timeout || 30000
  const args = options.args || []
  const failFast = options.failFast || false

  const resolvedCliPath = resolve(cwd, finalCliPath)

  if (!existsSync(resolvedCliPath)) {
    const errorMsg = `CLI file not found: ${resolvedCliPath}\nPossible fixes:\n1. Ensure the file exists at the specified path.\n2. Check the working directory.\nExpected path: ${resolvedCliPath}\nWorking directory: ${cwd}`
    const res = { success: false, exitCode: 1, stdout: '', stderr: errorMsg, args, cliPath: resolvedCliPath, cwd, durationMs: 0, duration: 0, command: `node "${resolvedCliPath}" ${args.join(' ')}` }
    if (isPositional) return wrapWithAssertions(res)
    throw new Error(errorMsg)
  }

  const cleanEnv = { ...process.env, ...env }
  if (cleanEnv.NODE_ENV === 'test') cleanEnv.NODE_ENV = 'development'
  delete cleanEnv.VITEST
  delete cleanEnv.NODE_OPTIONS

  const startTime = Date.now()
  const spawnResult = spawnSync('node', [resolvedCliPath, ...args], { cwd, env: cleanEnv, timeout, encoding: 'utf8' })
  const durationMs = Date.now() - startTime
  const exitCode = spawnResult.status !== null ? spawnResult.status : (spawnResult.error ? 1 : 0)

  // Track performance baseline
  monitorPerformance(`${finalCliPath} ${args.join(' ')}`, durationMs).catch(() => {})

  const result = {
    success: exitCode === 0 && !spawnResult.error,
    exitCode,
    stdout: (spawnResult.stdout || '').trim(),
    stderr: (spawnResult.stderr || '').trim() || (spawnResult.error ? spawnResult.error.message : ''),
    args,
    cliPath: resolvedCliPath,
    cwd,
    durationMs,
    duration: durationMs,
    command: `node "${resolvedCliPath}" ${args.join(' ')}`
  }

  if ((exitCode !== 0 || spawnResult.error) && failFast) {
    reportCommandFailure(result)
    const err = spawnResult.error || new Error(`Command failed: ${result.command}`)
    Object.assign(err, result)
    throw err
  }

  return wrapWithAssertions(result)
}

/**
 * Fluent assertion wrapper
 */
export function wrapWithAssertions(result) {
  const wrapped = wrapExpectation(result)
  wrapped.result = result
  wrapped.durationMs = result.durationMs
  wrapped.duration = result.duration
  
  if (!('json' in wrapped)) {
    Object.defineProperty(wrapped, 'json', { 
      get() { try { JSON.parse(result.stdout); return destr(result.stdout) } catch { return undefined } },
      configurable: true, enumerable: true
    })
  }
  
  const originalExpectOutput = wrapped.expectOutput
  wrapped.expectOutput = function(pattern) {
    if (typeof pattern === 'string' && !result.stdout.includes(pattern)) {
       throw new Error(`Expected stdout to match ${pattern}, got: ${result.stdout}\nCommand: ${result.command}`)
    }
    return originalExpectOutput ? originalExpectOutput.call(this, pattern) : this
  }
  
  wrapped.then = function(ok, fail) {
    const { then: _, ...plain } = this
    return Promise.resolve(plain).then(ok, fail)
  }
  
  return wrapped
}

export { runCitty } from './cleanroom-runner.js'

export function runLocalCittySafe(firstArg, secondArg) {
  try { return runLocalCitty(firstArg, secondArg) }
  catch (e) { 
    return wrapWithAssertions({ 
      success: false, exitCode: 1, stdout: '', stderr: e.message, 
      args: [], cliPath: '', cwd: process.cwd(), durationMs: 0, duration: 0, command: 'unknown' 
    }) 
  }
}
