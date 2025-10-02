import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

/**
 * CLI Path Selection - Demonstrating Custom CLI Paths
 *
 * This file shows how to test different CLIs using the cliPath option.
 * Perfect for testing multiple CLIs or custom entry points!
 */

describe('CLI Path Selection', () => {
  describe('Using Custom CLI Paths', () => {
    it('should test playground CLI directly', async () => {
      // Test a specific CLI file
      const result = await runLocalCitty({
        cliPath: './playground/src/cli.mjs',
        args: ['--show-help']
      })

      result
        .expectSuccess()
        .expectOutput(/playground/)
        .expectOutput(/COMMANDS/)
    })

    it('should test with different CLI entry point', async () => {
      const result = await runLocalCitty({
        cliPath: './playground/src/cli.mjs',
        args: ['greet', 'Alice']
      })

      result
        .expectSuccess()
        .expectOutput(/Hello, Alice/)
    })

    it('should work with absolute paths', async () => {
      const result = await runLocalCitty({
        cliPath: process.cwd() + '/playground/src/cli.mjs',
        args: ['--show-version']
      })

      result
        .expectSuccess()
        .expectOutput(/1\.0\.0/)
    })
  })

  describe('Analysis Commands with CLI Path', () => {
    it('should discover CLI structure', async () => {
      const result = await runLocalCitty({
        args: [
          'analysis',
          'discover',
          '--cli-path', 'playground/src/cli.mjs',
          '--format', 'text'
        ]
      })

      result
        .expectSuccess()
        .expectOutput(/CLI Structure Discovery/)
        .expectOutput(/playground/)
    })

    it('should analyze test coverage', async () => {
      const result = await runLocalCitty({
        args: [
          'analysis',
          'analyze',
          '--cli-path', 'playground/src/cli.mjs',
          '--test-dir', 'playground/test',
          '--format', 'text'
        ]
      })

      result
        .expectSuccess()
        .expectOutput(/Test Coverage Analysis/)
    })
  })

  describe('Multiple CLIs in Same Test Suite', () => {
    it('should test main CLI', async () => {
      const result = await runLocalCitty({
        cliPath: './src/cli.mjs',
        args: ['--help']
      })

      result.expectSuccess()
    })

    it('should test playground CLI', async () => {
      const result = await runLocalCitty({
        cliPath: './playground/src/cli.mjs',
        args: ['--help']
      })

      result.expectSuccess()
    })
  })

  describe('Advanced Path Scenarios', () => {
    it('should combine custom path with environment', async () => {
      const result = await runLocalCitty({
        cliPath: './playground/src/cli.mjs',
        args: ['greet', 'Test'],
        env: { DEBUG: 'true' }
      })

      result
        .expectSuccess()
        .expectOutput(/Hello, Test/)
    })

    it('should handle path with timeout', async () => {
      const result = await runLocalCitty({
        cliPath: './playground/src/cli.mjs',
        args: ['info'],
        timeout: 5000
      })

      result.expectSuccess()
    })
  })
})
