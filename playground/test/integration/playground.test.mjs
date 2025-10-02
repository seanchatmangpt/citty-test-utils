/**
 * Playground Integration Tests - v1.0.0 API
 * Tests the playground CLI using unified runner
 */

import { describe, it, expect } from 'vitest'
import { runCitty, scenario } from 'citty-test-utils'

describe('Playground CLI v1.0.0', () => {
  it('should show help', async () => {
    const result = await runCitty(['--show-help'])

    result
      .expectSuccess()
      .expectOutput(/USAGE/)
      .expectOutput(/playground/)
  })

  it('should show version', async () => {
    const result = await runCitty(['--show-version'])

    result
      .expectSuccess()
      .expectOutput(/\d+\.\d+\.\d+/)  // Just match version pattern
  })

  it('should handle invalid commands', async () => {
    // Use runCittySafe for expected failures
    const { runCittySafe } = await import('citty-test-utils')
    const result = await runCittySafe(['invalid-command'])

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should run multi-step scenario', async () => {
    await scenario('Playground workflow')
      .step('Show version', '--show-version')
      .expectSuccess()
      .step('Show help', '--show-help')
      .expectSuccess()
      .execute()
  })

  it('should use config from vitest.config.js', async () => {
    // No cliPath needed - comes from config!
    const result = await runCitty(['--show-help'])

    result.expectSuccess()
    expect(result.command).toContain('cli.mjs')
  })
})
