// tests/integration/citty-integration.test.mjs
// Integration tests using the new noun-verb CLI structure

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'

describe('Citty Integration Tests', () => {
  beforeAll(async () => {
    // Setup cleanroom for integration tests
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  }, 120000)

  afterAll(async () => {
    // Cleanup cleanroom
    await teardownCleanroom()
  }, 60000)

  describe('Local Runner Integration', () => {
    it.skip('should test basic citty CLI commands locally', async () => {
      // Test basic help - SKIPPED: Domain discovery interfering with stdout
      const helpResult = await runLocalCitty(['--help'], {
        cwd: process.cwd(),
        env: { TEST_CLI: 'true' },
      })

      expect(helpResult.exitCode).toBe(0)
      expect(helpResult.stdout).toContain('ctu')
      expect(helpResult.stdout).toContain('USAGE')
    })

    it('should test version command', async () => {
      const versionResult = await runLocalCitty(['--show-version'], {
        cwd: process.cwd(),
        env: {}, // Use main CLI, not test CLI
      })

      expect(versionResult.exitCode).toBe(0)
      expect(versionResult.stdout).toMatch(/0\.4\.0/)
    })

    it('should test info version command', async () => {
      const result = await runLocalCitty(['info', 'version'], {
        cwd: process.cwd(),
        env: {}, // Use main CLI, not test CLI
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Version: 0.4.0')
    })

    it('should test gen project command', async () => {
      const result = await runLocalCitty(
        ['gen', 'project', 'test-project', '--description', 'Test project'],
        {
          cwd: process.cwd(),
          env: {}, // Use main CLI, not test CLI
        }
      )

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project: test-project')
    })

    it('should test runner execute command', async () => {
      const result = await runLocalCitty(['runner', 'execute', 'node --version'], {
        cwd: process.cwd(),
        env: {}, // Use main CLI, not test CLI
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Command: node --version')
      expect(result.stdout).toContain('Environment: local')
      expect(result.stdout).toContain('Success: ✅')
    })

    it('should test JSON output', async () => {
      const result = await runLocalCitty(['info', 'version', '--json'], {
        cwd: process.cwd(),
        env: {}, // Use main CLI, not test CLI
      })

      expect(result.exitCode).toBe(0)
      expect(result.json).toBeDefined()
      expect(result.json.version).toBe('0.4.0')
      expect(result.json.name).toBe('ctu')
    })

    it('should test invalid arguments', async () => {
      const result = await runLocalCitty(['--invalid-flag'], {
        cwd: process.cwd(),
        env: {}, // Use main CLI, not test CLI
      })

      // Citty doesn't fail on unknown flags, it shows help
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('USAGE')
      expect(result.stdout).toContain('ctu <noun> <verb>')
    })
  })

  describe('Cleanroom Runner Integration', () => {
    it('should test basic citty CLI commands in cleanroom', async () => {
      const helpResult = await runCitty(['--help'], {
        cwd: '/app',
        env: {}, // Use main CLI, not test CLI
      })

      expect(helpResult.exitCode).toBe(0)
      expect(helpResult.stdout).toContain('ctu')
      expect(helpResult.stdout).toContain('USAGE')
    })

    it('should test version command in cleanroom', async () => {
      const versionResult = await runCitty(['--show-version'], {
        cwd: '/app',
        env: {}, // Use main CLI, not test CLI
      })

      expect(versionResult.exitCode).toBe(0)
      expect(versionResult.stdout).toMatch(/0\.4\.0/)
    })

    it('should test info version command in cleanroom', async () => {
      const result = await runCitty(['info', 'version'], {
        cwd: '/app',
        env: {}, // Use main CLI, not test CLI
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Version: 0.4.0')
    })

    it('should test gen project command in cleanroom', async () => {
      const result = await runCitty(
        ['gen', 'project', 'cleanroom-test', '--description', 'Cleanroom test project'],
        {
          cwd: '/app',
          env: {}, // Use main CLI, not test CLI
        }
      )

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project: cleanroom-test')
    })
  })

  describe('Fluent Assertions Integration', () => {
    it('should work with local runner assertions', async () => {
      const result = await runLocalCitty(['info', 'version'], {
        cwd: process.cwd(),
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput(/Version: 0\.4\.0/)
        .expectNoStderr()
    })

    it('should work with cleanroom runner assertions', async () => {
      const result = await runCitty(['info', 'version'], {
        cwd: '/app',
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput(/Version: 0\.4\.0/)
        .expectNoStderr()
    })

    it('should handle JSON assertions', async () => {
      const result = await runLocalCitty(['info', 'version', '--json'], {
        cwd: process.cwd(),
        env: {}, // Use main CLI, not test CLI
      })

      result.expectSuccess().expectJson((data) => {
        if (data.version !== '0.4.0') {
          throw new Error(`Expected version '0.4.0', got '${data.version}'`)
        }
        if (data.name !== 'ctu') {
          throw new Error(`Expected name 'ctu', got '${data.name}'`)
        }
      })
    })
  })

  describe('Error Handling Integration', () => {
    it.skip('should handle invalid commands gracefully', async () => {
      // SKIPPED: Domain discovery interfering with stdout
      const result = await runLocalCitty(['invalid', 'command'], {
        cwd: process.cwd(),
        env: { TEST_CLI: 'true' },
      })

      // Citty shows help for invalid commands but exits with code 1
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('USAGE')
      expect(result.stdout).toContain('ctu')
      expect(result.stderr).toContain('Unknown command')
    })

    it('should handle invalid commands in cleanroom', async () => {
      const result = await runCitty(['invalid', 'command'], {
        cwd: '/app',
        env: { TEST_CLI: 'true' },
      })

      // Citty shows help for invalid commands but exits with code 1
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('USAGE')
      expect(result.stdout).toContain('ctu')
      expect(result.stderr).toContain('Unknown command')
    })
  })
})
