import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runCitty, runCittySafe, getCittyConfig } from '../../src/core/runners/unified-runner.js'
import { resolve } from 'node:path'

describe('Unified Runner (v1.0.0)', () => {
  describe('runCitty() - Auto-detection', () => {
    it('should auto-detect local mode from config', async () => {
      const result = await runCitty(['--show-help'], {
        cliPath: './playground/src/cli.mjs',
        mode: 'auto'
      })

      expect(result.mode).toBe('local')
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('USAGE')
    })

    it('should support fluent assertions', async () => {
      const result = await runCitty(['--show-help'], {
        cliPath: './playground/src/cli.mjs'
      })

      // Should not throw
      result
        .expectSuccess()
        .expectOutput('USAGE')
        .expectExit(0)
    })

    it('should fail-fast with clear error for missing CLI', async () => {
      await expect(
        runCitty(['test'], {
          cliPath: './nonexistent-cli.js',
          mode: 'local'
        })
      ).rejects.toThrow(/CLI file not found/)
    })

    it('should validate arguments', async () => {
      await expect(
        runCitty('not-an-array')
      ).rejects.toThrow(/Invalid arguments/)
    })
  })

  describe('runCittySafe() - Error handling', () => {
    it('should return error as result object', async () => {
      const result = await runCittySafe(['test'], {
        cliPath: './nonexistent-cli.js',
        mode: 'local'
      })

      expect(result.success).toBe(false)
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('CLI file not found')
    })

    it('should support fluent assertions on errors', async () => {
      const result = await runCittySafe(['test'], {
        cliPath: './nonexistent-cli.js',
        mode: 'local'
      })

      result
        .expectFailure()
        .expectStderr('CLI file not found')
    })
  })

  describe('getCittyConfig() - Configuration', () => {
    it('should load and merge configuration', async () => {
      const config = await getCittyConfig({
        cliPath: './custom-cli.js',
        timeout: 5000
      })

      expect(config.cliPath).toBe('./custom-cli.js')
      expect(config.timeout).toBe(5000)
      expect(config.detectedMode).toBe('local')
    })

    it('should detect cleanroom mode when enabled', async () => {
      const config = await getCittyConfig({
        cleanroom: { enabled: true }
      })

      expect(config.detectedMode).toBe('cleanroom')
      expect(config.cleanroom.enabled).toBe(true)
    })

    it('should use environment variables', async () => {
      const config = await getCittyConfig()

      // Should use TEST_CLI_PATH from vitest.config if available
      if (process.env.TEST_CLI_PATH) {
        expect(config.cliPath).toBe(process.env.TEST_CLI_PATH)
      }
    })
  })

  describe('Configuration hierarchy', () => {
    it('should prioritize options over config', async () => {
      const result = await runCitty(['--show-help'], {
        cliPath: './playground/src/cli.mjs',
        timeout: 5000
      })

      expect(result.config.timeout).toBe(5000)
    })

    it('should merge environment variables', async () => {
      const result = await runCitty(['--show-help'], {
        cliPath: './playground/src/cli.mjs',
        env: { DEBUG: '1' }
      })

      expect(result.config.env).toBeDefined()
      expect(result.config.env.DEBUG).toBe('1')
    })

    it('should apply smart defaults', async () => {
      const result = await runCitty(['--show-help'], {
        cliPath: './playground/src/cli.mjs'
      })

      expect(result.config.timeout).toBeGreaterThan(0)
      expect(result.config.cleanroom.nodeImage).toBe('node:20-alpine')
    })
  })

  describe('Mode detection', () => {
    it('should respect mode override', async () => {
      const result = await runCitty(['--show-help'], {
        cliPath: './playground/src/cli.mjs',
        mode: 'local',
        cleanroom: { enabled: true } // Should be ignored
      })

      expect(result.mode).toBe('local')
    })

    it('should auto-detect based on cleanroom.enabled', async () => {
      const config = await getCittyConfig({
        cleanroom: { enabled: true }
      })

      expect(config.detectedMode).toBe('cleanroom')
    })

    it('should default to local mode', async () => {
      const config = await getCittyConfig({})

      expect(config.detectedMode).toBe('local')
    })
  })

  describe('Result metadata', () => {
    it('should include execution mode', async () => {
      const result = await runCitty(['--show-help'], {
        cliPath: './playground/src/cli.mjs'
      })

      expect(result.mode).toBeDefined()
      expect(['local', 'cleanroom']).toContain(result.mode)
    })

    it('should include merged config', async () => {
      const result = await runCitty(['--show-help'], {
        cliPath: './playground/src/cli.mjs',
        timeout: 5000
      })

      expect(result.config).toBeDefined()
      expect(result.config.timeout).toBe(5000)
    })

    it('should include standard result fields', async () => {
      const result = await runCitty(['--show-help'], {
        cliPath: './playground/src/cli.mjs'
      })

      expect(result.exitCode).toBeDefined()
      expect(result.stdout).toBeDefined()
      expect(result.stderr).toBeDefined()
      expect(result.args).toEqual(['--show-help'])
      expect(result.cwd).toBeDefined()
    })
  })
})
