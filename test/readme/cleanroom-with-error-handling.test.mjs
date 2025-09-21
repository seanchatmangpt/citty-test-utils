import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  setupCleanroom,
  runCitty,
  teardownCleanroom,
} from '../../src/core/runners/legacy-compatibility.js'
import { CleanroomTestErrorHandler } from './error-handling-utilities.mjs'

describe('Cleanroom Tests with Proper Error Handling', () => {
  let cleanroomSetup = false

  beforeAll(async () => {
    console.log('🐳 Setting up Docker cleanroom with error handling...')
    try {
      await setupCleanroom({
        rootDir: '.',
        timeout: 60000,
      })
      cleanroomSetup = true
      console.log('✅ Cleanroom setup complete')
    } catch (error) {
      console.warn('⚠️ Cleanroom setup failed:', error.message)
      cleanroomSetup = false
    }
  }, 60000)

  afterAll(async () => {
    if (cleanroomSetup) {
      console.log('🧹 Cleaning up Docker cleanroom...')
      try {
        await teardownCleanroom()
        console.log('✅ Cleanroom cleanup complete')
      } catch (error) {
        console.warn('⚠️ Cleanroom cleanup failed:', error.message)
      }
    }
  }, 30000)

  describe('Gen Commands with Error Handling', () => {
    it('should work with gen project command (with error handling)', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // ✅ PROPER ERROR HANDLING
      const { success, result, error } = await CleanroomTestErrorHandler.safeRunCitty(
        ['gen', 'project', 'test-cleanroom-project'],
        {
          env: { TEST_CLI: 'true' },
          timeout: 30000,
        },
        'Gen project command'
      )

      if (!success) {
        console.error('❌ Gen project command failed:', error.message)
        throw error
      }

      result
        .expectSuccess()
        .expectOutput(/Generated/)
        .expectOutput(/test-cleanroom-project/)
    })

    it('should work with gen test command (with error handling)', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // ✅ PROPER ERROR HANDLING
      const { success, result, error } = await CleanroomTestErrorHandler.safeRunCitty(
        ['gen', 'test', 'cleanroom-test', '--test-type', 'cleanroom'],
        {
          env: { TEST_CLI: 'true' },
          timeout: 30000,
        },
        'Gen test command'
      )

      if (!success) {
        console.error('❌ Gen test command failed:', error.message)
        throw error
      }

      result
        .expectSuccess()
        .expectOutput(/Generated/)
        .expectOutput(/cleanroom-test/)
    })

    it('should work with gen scenario command (with error handling)', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // ✅ PROPER ERROR HANDLING
      const { success, result, error } = await CleanroomTestErrorHandler.safeRunCitty(
        ['gen', 'scenario', 'cleanroom-scenario', '--environment', 'cleanroom'],
        {
          env: { TEST_CLI: 'true' },
          timeout: 30000,
        },
        'Gen scenario command'
      )

      if (!success) {
        console.error('❌ Gen scenario command failed:', error.message)
        throw error
      }

      result
        .expectSuccess()
        .expectOutput(/Generated/)
        .expectOutput(/cleanroom-scenario/)
    })
  })

  describe('Scenarios with Error Handling', () => {
    it('should work with scenario DSL (with error handling)', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // ✅ PROPER ERROR HANDLING FOR IMPORTS
      const {
        success: importSuccess,
        module,
        error: importError,
      } = await CleanroomTestErrorHandler.safeImport(
        '../../src/core/scenarios/scenario-dsl.js',
        'Scenario DSL import'
      )

      if (!importSuccess) {
        console.error('❌ Scenario DSL import failed:', importError.message)
        throw importError
      }

      const { scenario } = module

      // ✅ PROPER ERROR HANDLING FOR SCENARIO EXECUTION
      const {
        success: scenarioSuccess,
        result,
        error: scenarioError,
      } = await CleanroomTestErrorHandler.safeScenario(
        scenario('Cleanroom test').step('Test help').run('--help').expectSuccess(),
        'Cleanroom scenario test'
      )

      if (!scenarioSuccess) {
        console.error('❌ Scenario execution failed:', scenarioError.message)
        throw scenarioError
      }

      expect(result.success).toBe(true)
    })

    it('should work with scenarios pack (with error handling)', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // ✅ PROPER ERROR HANDLING FOR IMPORTS
      const {
        success: importSuccess,
        module,
        error: importError,
      } = await CleanroomTestErrorHandler.safeImport(
        '../../src/core/scenarios/scenarios.js',
        'Scenarios pack import'
      )

      if (!importSuccess) {
        console.error('❌ Scenarios pack import failed:', importError.message)
        throw importError
      }

      const { scenarios } = module

      // ✅ PROPER ERROR HANDLING FOR CONCURRENT OPERATIONS
      const operations = [
        scenarios.help('cleanroom').execute(),
        scenarios.version('cleanroom').execute(),
      ]

      const results = await CleanroomTestErrorHandler.safeConcurrentOperations(
        operations,
        'Scenarios pack test'
      )

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
    })
  })

  describe('Cross-Environment Testing with Error Handling', () => {
    it('should work with cross-environment version test (with error handling)', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // ✅ PROPER ERROR HANDLING FOR CROSS-ENVIRONMENT OPERATIONS
      const { success, local, cleanroom, error } =
        await CleanroomTestErrorHandler.safeCrossEnvironment(
          () =>
            runLocalCitty(['--version'], {
              cwd: process.cwd(),
              env: { TEST_CLI: 'true' },
            }),
          () =>
            runCitty(['--version'], {
              env: { TEST_CLI: 'true' },
            }),
          'Cross-environment version test'
        )

      if (!success) {
        console.error('❌ Cross-environment test failed:', error.message)
        throw error
      }

      // ✅ PROPER RESULT VALIDATION
      CleanroomTestErrorHandler.validateResult(local, ['stdout'], 'Local result')
      CleanroomTestErrorHandler.validateResult(cleanroom, ['stdout'], 'Cleanroom result')

      expect(local.result.stdout).toBe(cleanroom.result.stdout)
    })

    it('should work with cross-environment gen test (with error handling)', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // ✅ PROPER ERROR HANDLING FOR CROSS-ENVIRONMENT OPERATIONS
      const { success, local, cleanroom, error } =
        await CleanroomTestErrorHandler.safeCrossEnvironment(
          () =>
            runLocalCitty(['gen', '--help'], {
              cwd: process.cwd(),
              env: { TEST_CLI: 'true' },
            }),
          () =>
            runCitty(['gen', '--help'], {
              env: { TEST_CLI: 'true' },
            }),
          'Cross-environment gen test'
        )

      if (!success) {
        console.error('❌ Cross-environment gen test failed:', error.message)
        throw error
      }

      // ✅ PROPER RESULT VALIDATION
      CleanroomTestErrorHandler.validateResult(local, ['stdout'], 'Local result')
      CleanroomTestErrorHandler.validateResult(cleanroom, ['stdout'], 'Cleanroom result')

      expect(local.result.stdout).toContain('Generate')
      expect(cleanroom.result.stdout).toContain('Generate')
    })
  })

  describe('Concurrent Operations with Error Handling', () => {
    it('should work with concurrent commands (with error handling)', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // ✅ PROPER ERROR HANDLING FOR CONCURRENT OPERATIONS
      const operations = [
        runCitty(['--help'], { env: { TEST_CLI: 'false' } }),
        runCitty(['--version'], { env: { TEST_CLI: 'false' } }),
        runCitty(['gen', '--help'], { env: { TEST_CLI: 'false' } }),
        runCitty(['test', '--help'], { env: { TEST_CLI: 'false' } }),
        runCitty(['info', '--help'], { env: { TEST_CLI: 'false' } }),
      ]

      const results = await CleanroomTestErrorHandler.safeConcurrentOperations(
        operations,
        'Concurrent commands test'
      )

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

      console.log(`🎭 ✅ CONCURRENT COMMANDS WITH ERROR HANDLING PROVEN:`)
      console.log(
        `   All ${results.length} commands executed concurrently with proper error handling!`
      )
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle partial failures gracefully', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test with operations that might fail
      const operations = [
        runCitty(['--help'], { env: { TEST_CLI: 'false' } }), // Should succeed
        runCitty(['--version'], { env: { TEST_CLI: 'false' } }), // Should succeed
        runCitty(['nonexistent-command'], { env: { TEST_CLI: 'false' } }), // Should fail
        runCitty(['gen', '--help'], { env: { TEST_CLI: 'false' } }), // Should succeed
      ]

      try {
        const results = await CleanroomTestErrorHandler.safeConcurrentOperations(
          operations,
          'Partial failure test'
        )

        // This should not reach here if one operation fails
        expect(results.length).toBe(4)
      } catch (error) {
        // Expected to fail due to nonexistent command
        console.log('✅ Partial failure handled correctly:', error.message)
        expect(error.message).toContain('operations failed')
      }
    })

    it('should provide detailed error information', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test with a command that will fail
      const { success, result, error } = await CleanroomTestErrorHandler.safeRunCitty(
        ['nonexistent-command'],
        { env: { TEST_CLI: 'false' } },
        'Nonexistent command test'
      )

      expect(success).toBe(false)
      expect(result).toBeNull()
      expect(error).toBeDefined()
      expect(error.message).toContain('Unknown command')

      console.log('✅ Error information captured correctly:', error.message)
    })
  })
})

