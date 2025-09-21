#!/usr/bin/env node
/**
 * @fileoverview Universal Scenario Packs
 * @description Pre-built scenarios for common CLI testing patterns
 */

import { scenario, matrix } from '../contract/universal-contract.js'

/**
 * Help command scenario
 * @param {string} [command='--help'] - Help command to test
 * @returns {ScenarioBuilder} Help scenario builder
 */
function helpScenario(command = '--help') {
  return scenario('Help Command')
    .step('Show help', async (runner) => {
      return await runner.exec(command)
    })
    .step('Verify help output', async (runner) => {
      const result = await runner.exec(command)
      const expectation = new (await import('../contract/universal-contract.js')).Expectation(
        result
      )
      expectation
        .expectSuccess()
        .expectOutput(/usage|help|commands/i)
        .expectNoStderr()
      expectation.assert()
      return result
    })
}

/**
 * Version command scenario
 * @param {string} [command='--version'] - Version command to test
 * @returns {ScenarioBuilder} Version scenario builder
 */
function versionScenario(command = '--version') {
  return scenario('Version Command')
    .step('Show version', async (runner) => {
      return await runner.exec(command)
    })
    .step('Verify version output', async (runner) => {
      const result = await runner.exec(command)
      const expectation = new (await import('../contract/universal-contract.js')).Expectation(
        result
      )
      expectation
        .expectSuccess()
        .expectOutput(/\d+\.\d+\.\d+/)
        .expectNoStderr()
      expectation.assert()
      return result
    })
}

/**
 * Invalid command scenario
 * @param {string} [command='invalid-command'] - Invalid command to test
 * @returns {ScenarioBuilder} Invalid command scenario builder
 */
function invalidCommandScenario(command = 'invalid-command') {
  return scenario('Invalid Command')
    .step('Run invalid command', async (runner) => {
      return await runner.exec(command)
    })
    .step('Verify error handling', async (runner) => {
      const result = await runner.exec(command)
      const expectation = new (await import('../contract/universal-contract.js')).Expectation(
        result
      )
      expectation.expectFailure().expectStderr(/unknown|invalid|not found|error/i)
      expectation.assert()
      return result
    })
}

/**
 * JSON mode scenario
 * @param {string} [command='--json'] - JSON command to test
 * @returns {ScenarioBuilder} JSON mode scenario builder
 */
function jsonModeScenario(command = '--json') {
  return scenario('JSON Mode')
    .step('Run with JSON flag', async (runner) => {
      return await runner.exec(command)
    })
    .step('Verify JSON output', async (runner) => {
      const result = await runner.exec(command)
      const expectation = new (await import('../contract/universal-contract.js')).Expectation(
        result
      )
      expectation
        .expectSuccess()
        .expectJson((json) => {
          if (typeof json !== 'object' || json === null) {
            throw new Error('Expected valid JSON object')
          }
        })
        .expectNoStderr()
      expectation.assert()
      return result
    })
}

/**
 * Idempotent operation scenario
 * @param {string[]} commands - Commands to test for idempotency
 * @returns {ScenarioBuilder} Idempotent scenario builder
 */
function idempotentScenario(commands) {
  return scenario('Idempotent Operation')
    .step('First run', async (runner) => {
      return await runner.exec(commands[0])
    })
    .step('Second run', async (runner) => {
      return await runner.exec(commands[1] || commands[0])
    })
    .step('Verify idempotency', async (runner) => {
      const result1 = await runner.exec(commands[0])
      const result2 = await runner.exec(commands[1] || commands[0])

      const expectation1 = new (await import('../contract/universal-contract.js')).Expectation(
        result1
      )
      const expectation2 = new (await import('../contract/universal-contract.js')).Expectation(
        result2
      )

      expectation1.expectSuccess()
      expectation2.expectSuccess()

      // Results should be identical
      if (result1.stdout !== result2.stdout) {
        throw new Error('Idempotent operation produced different output')
      }

      expectation1.assert()
      expectation2.assert()
      return result2
    })
}

/**
 * Concurrent execution scenario
 * @param {string[]} commands - Commands to run concurrently
 * @returns {ScenarioBuilder} Concurrent scenario builder
 */
function concurrentScenario(commands) {
  return scenario('Concurrent Execution')
    .concurrent(true)
    .step('Run commands concurrently', async (runner) => {
      const promises = commands.map((cmd) => runner.exec(cmd))
      const results = await Promise.all(promises)

      // Verify all succeeded
      for (const result of results) {
        const expectation = new (await import('../contract/universal-contract.js')).Expectation(
          result
        )
        expectation.expectSuccess()
        expectation.assert()
      }

      return results[0] // Return first result for step result
    })
}

/**
 * Configuration CRUD scenario
 * @param {string} configCommand - Configuration command
 * @param {string} getCommand - Get configuration command
 * @param {string} setCommand - Set configuration command
 * @param {string} deleteCommand - Delete configuration command
 * @returns {ScenarioBuilder} Configuration CRUD scenario builder
 */
function configCrudScenario(configCommand, getCommand, setCommand, deleteCommand) {
  return scenario('Configuration CRUD')
    .step('Get initial config', async (runner) => {
      return await runner.exec(getCommand)
    })
    .step('Set configuration', async (runner) => {
      return await runner.exec(setCommand)
    })
    .step('Verify configuration set', async (runner) => {
      const result = await runner.exec(getCommand)
      const expectation = new (await import('../contract/universal-contract.js')).Expectation(
        result
      )
      expectation.expectSuccess()
      expectation.assert()
      return result
    })
    .step('Delete configuration', async (runner) => {
      return await runner.exec(deleteCommand)
    })
    .step('Verify configuration deleted', async (runner) => {
      const result = await runner.exec(getCommand)
      const expectation = new (await import('../contract/universal-contract.js')).Expectation(
        result
      )
      expectation.expectSuccess()
      expectation.assert()
      return result
    })
}

/**
 * File generation scenario
 * @param {string} generateCommand - File generation command
 * @param {string} outputFile - Expected output file
 * @returns {ScenarioBuilder} File generation scenario builder
 */
function fsGenerateScenario(generateCommand, outputFile) {
  return scenario('File Generation')
    .step('Generate file', async (runner) => {
      return await runner.exec(generateCommand)
    })
    .step('Verify file created', async (runner) => {
      const result = await runner.exec(generateCommand)
      const expectation = new (await import('../contract/universal-contract.js')).Expectation(
        result
      )
      expectation.expectSuccess().expectFileExists(outputFile)
      expectation.assert()
      return result
    })
}

/**
 * Interactive login scenario
 * @param {string} loginCommand - Login command
 * @param {string} username - Username to input
 * @param {string} password - Password to input
 * @returns {ScenarioBuilder} Interactive login scenario builder
 */
function interactiveLoginScenario(loginCommand, username, password) {
  return scenario('Interactive Login')
    .step('Login interactively', async (runner) => {
      const script = `${username}\n${password}\n`
      return await runner.execPty(loginCommand.split(' '), script)
    })
    .step('Verify login success', async (runner) => {
      const script = `${username}\n${password}\n`
      const result = await runner.execPty(loginCommand.split(' '), script)
      const expectation = new (await import('../contract/universal-contract.js')).Expectation(
        result
      )
      expectation.expectSuccess().expectOutput(/welcome|success|logged in/i)
      expectation.assert()
      return result
    })
}

/**
 * Cross-environment consistency scenario
 * @param {string[]} commands - Commands to test across environments
 * @param {string[]} environments - Environments to test
 * @returns {ScenarioBuilder} Cross-environment scenario builder
 */
function crossEnvironmentScenario(commands, environments = ['local', 'docker']) {
  return scenario('Cross-Environment Consistency')
    .matrix({ environment: environments })
    .step('Run command in environment', async (runner) => {
      const results = []
      for (const cmd of commands) {
        const result = await runner.exec(cmd)
        results.push(result)
      }
      return results[0] // Return first result for step result
    })
    .step('Verify consistency', async (runner) => {
      // This step would compare results across environments
      // Implementation depends on how matrix results are handled
      const result = await runner.exec(commands[0])
      const expectation = new (await import('../contract/universal-contract.js')).Expectation(
        result
      )
      expectation.expectSuccess()
      expectation.assert()
      return result
    })
}

/**
 * Performance benchmark scenario
 * @param {string} command - Command to benchmark
 * @param {number} iterations - Number of iterations
 * @param {number} maxDurationMs - Maximum acceptable duration
 * @returns {ScenarioBuilder} Performance benchmark scenario builder
 */
function performanceBenchmarkScenario(command, iterations = 10, maxDurationMs = 1000) {
  return scenario('Performance Benchmark')
    .step('Run performance test', async (runner) => {
      const results = []
      for (let i = 0; i < iterations; i++) {
        const result = await runner.exec(command)
        results.push(result)
      }
      return results[0] // Return first result for step result
    })
    .step('Verify performance', async (runner) => {
      const result = await runner.exec(command)
      const expectation = new (await import('../contract/universal-contract.js')).Expectation(
        result
      )
      expectation.expectSuccess().expectDuration(0, maxDurationMs)
      expectation.assert()
      return result
    })
}

/**
 * Collection of all scenario packs
 */
const scenarioPacks = {
  help: helpScenario,
  version: versionScenario,
  invalidCommand: invalidCommandScenario,
  jsonMode: jsonModeScenario,
  idempotent: idempotentScenario,
  concurrent: concurrentScenario,
  configCrud: configCrudScenario,
  fsGenerate: fsGenerateScenario,
  interactiveLogin: interactiveLoginScenario,
  crossEnvironment: crossEnvironmentScenario,
  performanceBenchmark: performanceBenchmarkScenario,
}

// Export all scenario functions
export {
  helpScenario,
  versionScenario,
  invalidCommandScenario,
  jsonModeScenario,
  idempotentScenario,
  concurrentScenario,
  configCrudScenario,
  fsGenerateScenario,
  interactiveLoginScenario,
  crossEnvironmentScenario,
  performanceBenchmarkScenario,
  scenarioPacks,
}
