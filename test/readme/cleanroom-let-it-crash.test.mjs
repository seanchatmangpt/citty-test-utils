import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  setupCleanroom,
  runCitty,
  runLocalCitty,
  teardownCleanroom,
} from '../../index.js'
import { CleanroomTestUtils } from './error-handling-utilities.mjs'

describe('Cleanroom Tests - Let It Crash Philosophy', () => {
  let cleanroomSetup = false

  beforeAll(async () => {
    console.log('🐳 Setting up Docker cleanroom...')
    await setupCleanroom({
      rootDir: '.',
      timeout: 60000,
    })
    cleanroomSetup = true
    console.log('✅ Cleanroom setup complete')
  }, 60000)

  afterAll(async () => {
    if (cleanroomSetup) {
      console.log('🧹 Cleaning up Docker cleanroom...')
      await teardownCleanroom()
      console.log('✅ Cleanroom cleanup complete')
    }
  }, 30000)

  describe('Gen Commands - Let It Crash', () => {
    it('should work with gen project command', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Let it crash if it fails
      const result = await runCitty(['gen', 'project', 'test-cleanroom-project'], {
        env: { TEST_CLI: 'true' },
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/Generated/)
        .expectOutput(/test-cleanroom-project/)
    })

    it('should work with gen test command', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Let it crash if it fails
      const result = await runCitty(['gen', 'test', 'cleanroom-test', '--test-type', 'cleanroom'], {
        env: { TEST_CLI: 'true' },
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/Generated/)
        .expectOutput(/cleanroom-test/)
    })

    it('should work with gen scenario command', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Let it crash if it fails
      const result = await runCitty(
        ['gen', 'scenario', 'cleanroom-scenario', '--environment', 'cleanroom'],
        {
          env: { TEST_CLI: 'true' },
          timeout: 30000,
        }
      )

      result
        .expectSuccess()
        .expectOutput(/Generated/)
        .expectOutput(/cleanroom-scenario/)
    })
  })

  describe('Scenarios - Let It Crash', () => {
    it('should work with scenario DSL', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Let it crash if import fails
      const { scenario } = await CleanroomTestUtils.importModule(
        '../../src/core/scenarios/scenario-dsl.js'
      )

      // Let it crash if scenario execution fails
      const result = await CleanroomTestUtils.executeScenario(
        scenario('Cleanroom test').step('Test help').run('--help').expectSuccess()
      )

      expect(result.success).toBe(true)
    })

    it('should work with scenarios pack', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Let it crash if import fails
      const { scenarios } = await CleanroomTestUtils.importModule(
        '../../src/core/scenarios/scenarios.js'
      )

      // Let it crash if any operation fails
      const results = await CleanroomTestUtils.concurrentOperations([
        scenarios.help('cleanroom').execute(),
        scenarios.version('cleanroom').execute(),
      ])

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
    })
  })

  describe('Cross-Environment Testing - Let It Crash', () => {
    it('should work with cross-environment version test', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Let it crash if either operation fails
      const { local, cleanroom } = await CleanroomTestUtils.crossEnvironment(
        () =>
          runLocalCitty(['--version'], {
            cwd: process.cwd(),
            env: { TEST_CLI: 'true' },
          }),
        () =>
          runCitty(['--version'], {
            env: { TEST_CLI: 'true' },
          })
      )

      // Validate results - let it crash if invalid
      CleanroomTestUtils.validateResult(local, ['stdout'], 'Local result')
      CleanroomTestUtils.validateResult(cleanroom, ['stdout'], 'Cleanroom result')

      expect(local.result.stdout).toBe(cleanroom.result.stdout)
    })

    it('should work with cross-environment gen test', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Let it crash if either operation fails
      const { local, cleanroom } = await CleanroomTestUtils.crossEnvironment(
        () =>
          runLocalCitty(['gen', '--help'], {
            cwd: process.cwd(),
            env: { TEST_CLI: 'true' },
          }),
        () =>
          runCitty(['gen', '--help'], {
            env: { TEST_CLI: 'true' },
          })
      )

      // Validate results - let it crash if invalid
      CleanroomTestUtils.validateResult(local, ['stdout'], 'Local result')
      CleanroomTestUtils.validateResult(cleanroom, ['stdout'], 'Cleanroom result')

      expect(local.result.stdout).toContain('Generate')
      expect(cleanroom.result.stdout).toContain('Generate')
    })
  })

  describe('Concurrent Operations - Let It Crash', () => {
    it('should work with concurrent commands', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Let it crash if any operation fails
      const results = await CleanroomTestUtils.concurrentOperations([
        runCitty(['--help'], { env: { TEST_CLI: 'false' } }),
        runCitty(['--version'], { env: { TEST_CLI: 'false' } }),
        runCitty(['gen', '--help'], { env: { TEST_CLI: 'false' } }),
        runCitty(['test', '--help'], { env: { TEST_CLI: 'false' } }),
        runCitty(['info', '--help'], { env: { TEST_CLI: 'false' } }),
      ])

      // All operations should succeed
      results.forEach((result, i) => {
        result.expectSuccess()
      })

      // Verify specific outputs
      expect(results[0].stdout).toContain('Citty Test Utils CLI')
      expect(results[1].stdout.trim()).toBe('0.4.0')
      expect(results[2].stdout).toContain('Generate')
      expect(results[3].stdout).toContain('test')
      expect(results[4].stdout).toContain('info')

      console.log(`🎭 ✅ CONCURRENT COMMANDS PROVEN:`)
      console.log(`   All ${results.length} commands executed concurrently!`)
    })
  })

  describe('Failure Surface Testing', () => {
    it('should surface failures immediately', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash immediately - let it fail fast
      await expect(
        runCitty(['nonexistent-command'], { env: { TEST_CLI: 'false' } })
      ).rejects.toThrow()
    })

    it('should surface concurrent failures immediately', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash immediately if any operation fails
      await expect(
        CleanroomTestUtils.concurrentOperations([
          runCitty(['--help'], { env: { TEST_CLI: 'false' } }), // Should succeed
          runCitty(['nonexistent-command'], { env: { TEST_CLI: 'false' } }), // Should fail
          runCitty(['--version'], { env: { TEST_CLI: 'false' } }), // Should succeed
        ])
      ).rejects.toThrow()
    })

    it('should surface import failures immediately', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash immediately if import fails
      await expect(CleanroomTestUtils.importModule('../../nonexistent/module.js')).rejects.toThrow()
    })

    it('should surface validation failures immediately', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash immediately if validation fails
      await expect(
        CleanroomTestUtils.validateResult(null, ['stdout'], 'Test validation')
      ).rejects.toThrow()
    })
  })
})

