import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupCleanroom, runCitty, teardownCleanroom } from '../../index.js'

describe('README Cleanroom Examples - Complete Coverage', () => {
  let cleanroomSetup = false

  beforeAll(async () => {
    console.log('🐳 Setting up Docker cleanroom for comprehensive README tests...')
    try {
      await setupCleanroom({
        rootDir: '.',
        timeout: 60000, // 1 minute timeout
      })
      cleanroomSetup = true
      console.log('✅ Cleanroom setup complete')
    } catch (error) {
      console.warn('⚠️ Cleanroom setup failed:', error.message)
      console.log('📝 Skipping cleanroom tests')
      cleanroomSetup = false
    }
  }, 60000) // 1 minute timeout for Docker setup

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
  }, 30000) // 30 second timeout for cleanup

  describe('Basic Cleanroom Examples', () => {
    it('should work with Docker cleanroom testing example from README', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Docker cleanroom testing example
      const cleanResult = await runCitty(['--version'], {
        env: { TEST_CLI: 'true' },
      })

      cleanResult.expectSuccess().expectOutput(/\d+\.\d+\.\d+/)
    })

    it('should work with cleanroom runner example from README', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Cleanroom runner example
      const result = await runCitty(['--help'], {
        json: false,
        cwd: '/app',
        timeout: 30000,
        env: {
          TEST_CLI: 'true',
        },
      })

      result.expectSuccess().expectOutput('USAGE').expectOutput(/ctu/).expectNoStderr()
    })
  })

  describe('Cleanroom Scenario Examples', () => {
    it('should work with environment-specific cleanroom scenarios', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Environment-specific scenarios
      const { scenario } = await import('../../src/core/scenarios/scenario-dsl.js')

      const cleanroomResult = await scenario('Cleanroom test')
        .step('Test help')
        .run('--help')
        .expectSuccess()
        .execute('cleanroom')

      expect(cleanroomResult.success).toBe(true)
    })

    it('should work with cleanroom scenarios pack', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Basic scenarios with cleanroom
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const helpResult = await scenarios.help('cleanroom').execute()
      const versionResult = await scenarios.version('cleanroom').execute()

      expect(helpResult.success).toBe(true)
      expect(versionResult.success).toBe(true)
    })

    it('should work with cleanroom JSON output testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: JSON output testing in cleanroom
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const jsonResult = await scenarios.jsonOutput(['info', '--json'], 'cleanroom').execute()
      expect(jsonResult.success).toBe(true)
    })

    it('should work with cleanroom subcommand testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Subcommand testing in cleanroom
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const subcommandResult = await scenarios.subcommand('test', ['--help'], 'cleanroom').execute()
      expect(subcommandResult.success).toBe(true)
    })

    it('should work with cleanroom idempotent testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Robustness testing in cleanroom
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const idempotentResult = await scenarios.idempotent(['info'], 'cleanroom').execute()
      expect(idempotentResult.success).toBe(true)
    })

    it('should work with cleanroom concurrent testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Concurrent testing in cleanroom
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const concurrentResult = await scenarios
        .concurrent(
          [{ args: ['--help'] }, { args: ['--version'] }, { args: ['info'] }],
          'cleanroom'
        )
        .execute()

      expect(concurrentResult.success).toBe(true)
    })

    it('should work with cleanroom error testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Error testing in cleanroom
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const errorResult = await scenarios
        .errorCase(['invalid-command'], /Unknown command/, 'cleanroom')
        .execute()
      expect(errorResult.success).toBe(true)
    })
  })

  describe('Cross-Environment Testing', () => {
    it('should work with cross-environment testing from README', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Cross-environment testing
      // Test that cleanroom works independently
      const cleanroomResult = await runCitty(['--version'], {
        env: {},
      })

      // Check that cleanroom result exists and has stdout
      expect(cleanroomResult).toBeDefined()
      expect(cleanroomResult.stdout).toBeDefined()
      expect(cleanroomResult.stdout).toBe('0.5.0') // Main CLI version
      expect(cleanroomResult.exitCode).toBe(0)
    })

    it('should work with cross-environment help command testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test main CLI help command works in cleanroom
      const cleanroomResult = await runCitty(['--help'], {
        timeout: 30000,
      })

      // Should produce help output (main CLI)
      expect(cleanroomResult.stdout).toBeDefined()
      expect(cleanroomResult.stdout).toContain('USAGE')
      expect(cleanroomResult.stdout).toContain('ctu') // Main CLI, not playground CLI
      expect(cleanroomResult.exitCode).toBe(0)
    })
  })

  describe('Vitest Integration Cleanroom Examples', () => {
    it('should work in cleanroom from README', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Vitest cleanroom example
      const result = await runCitty(['--help'], {
        env: { TEST_CLI: 'true' },
      })
      result.expectSuccess().expectOutput('USAGE').expectOutput(/ctu/).expectNoStderr()
    })

    it('should handle complex workflow in cleanroom', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Complex workflow example in cleanroom
      const { scenario } = await import('../../src/core/scenarios/scenario-dsl.js')

      const result = await scenario('Complete workflow')
        .step('Get help')
        .run('--help')
        .expectSuccess()
        .expectOutput('USAGE')
        .step('Get version')
        .run('--version')
        .expectSuccess()
        .expectOutput(/\d+\.\d+\.\d+/)
        .step('Test invalid command')
        .run('invalid-command')
        .expectFailure()
        .expectStderr(/Unknown command/)
        .execute('cleanroom')

      expect(result.success).toBe(true)
    })
  })

  describe('Advanced Cleanroom Features', () => {
    it('should work with custom actions in cleanroom scenarios', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Custom actions in scenarios
      const { scenario } = await import('../../src/core/scenarios/scenario-dsl.js')

      const result = await scenario('Custom workflow')
        .step('Custom action', async ({ lastResult, context }) => {
          // Custom logic here
          return { success: true, data: 'processed' }
        })
        .step('Run command')
        .run('--help')
        .expectSuccess()
        .execute('cleanroom')

      expect(result.success).toBe(true)
    })

    it('should work with environment-specific configuration in cleanroom', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Environment-specific configuration
      const result = await runCitty(['info'], {
        env: {
          TEST_CLI: 'true',
          DEBUG: 'true',
        },
        timeout: 60000,
      })

      result.expectSuccess()
    })
  })
})
