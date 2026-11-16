import { describe, it, expect } from 'vitest'
import { runCitty, runCittySafe, getCittyConfig } from 'un-test-utils'
import { scenario } from '@un-test/scenario'

describe('v1.0.0 Unified API - runCitty()', () => {
  describe('Local Mode Execution (Default)', () => {
    it('should execute in local mode by default', async () => {
      const result = await runCitty(['--show-help'], {
        cliPath: './playground/src/cli.mjs',
      })

      expect(result.mode).toBe('local')
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('USAGE')
    })

    it('should pass options correctly in local mode', async () => {
      const result = await runCitty(['--show-help'], {
        cliPath: './playground/src/cli.mjs',
        cwd: process.cwd(),
        env: { TEST_VAR: 'value' },
        timeout: 10000,
      })

      expect(result.config.cliPath).toBe('./playground/src/cli.mjs')
      expect(result.config.cwd).toBe(process.cwd())
      expect(result.config.timeout).toBe(10000)
    })

    it('should handle local execution errors gracefully', async () => {
      await expect(
        runCitty(['test'], {
          cliPath: './nonexistent-cli.js',
          mode: 'local',
        })
      ).rejects.toThrow(/CLI file not found/)
    })
  })

  describe('Cleanroom Mode Configuration & Detection', () => {
    it('should detect cleanroom mode when config.cleanroom.enabled is true', async () => {
      const config = await getCittyConfig({
        cleanroom: { enabled: true },
      })
      expect(config.detectedMode).toBe('cleanroom')
    })

    it('should default to local mode when cleanroom is not enabled', async () => {
      const config = await getCittyConfig({
        cleanroom: { enabled: false },
      })
      expect(config.detectedMode).toBe('local')
    })
  })

  describe('Config Hierarchy (vitest > options > defaults)', () => {
    it('should prioritize options over defaults', async () => {
      const config = await getCittyConfig({
        timeout: 5000,
      })
      expect(config.timeout).toBe(5000)
    })

    it('should merge config.cleanroom with options correctly', async () => {
      const config = await getCittyConfig({
        timeout: 5000,
        cleanroom: {
          enabled: true,
          nodeImage: 'node:18-alpine',
        },
      })
      expect(config.timeout).toBe(5000)
      expect(config.cleanroom.enabled).toBe(true)
      expect(config.cleanroom.nodeImage).toBe('node:18-alpine')
    })
  })

  describe('Error Handling', () => {
    it('should throw on invalid arguments', async () => {
      await expect(runCitty('not-an-array')).rejects.toThrow(/Invalid arguments/)
    })

    it('should handle errors via runCittySafe', async () => {
      const result = await runCittySafe(['test'], {
        cliPath: './nonexistent-cli.js',
        mode: 'local',
      })

      expect(result.success).toBe(false)
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('CLI file not found')
    })
  })
})

describe('v1.0.0 Unified API - Simplified Scenario DSL', () => {
  describe('.step(name, args) Pattern', () => {
    it('should support simplified step with inline args', () => {
      const testScenario = scenario('Test')
        .step('Check version', ['--version'])
        .expectSuccess()

      expect(testScenario).toBeDefined()
      expect(testScenario._steps).toHaveLength(1)
      expect(testScenario._steps[0].description).toBe('Check version')
      expect(testScenario._steps[0].args).toEqual(['--version'])
    })

    it('should support step with options object', () => {
      const testScenario = scenario('Test')
        .step('Check version', ['--version'], {
          cwd: '/custom/path',
          env: { NODE_ENV: 'test' },
        })
        .expectSuccess()

      expect(testScenario).toBeDefined()
      expect(testScenario._steps[0].options).toEqual({
        cwd: '/custom/path',
        env: { NODE_ENV: 'test' },
      })
    })

    it('should support string args that get split', () => {
      const testScenario = scenario('Test')
        .step('Check version', '--version --json')
        .expectSuccess()

      expect(testScenario).toBeDefined()
      expect(testScenario._steps[0].args).toEqual(['--version', '--json'])
    })
  })

  describe('Fluent Assertions', () => {
    it('should chain assertions fluently', () => {
      const testScenario = scenario('Test')
        .step('Check version', ['--version'])
        .expectSuccess()
        .expectOutput('Version')

      expect(testScenario).toBeDefined()
      expect(testScenario._steps[0].expectations).toHaveLength(2)
    })
  })
})
