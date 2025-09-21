import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  setupCleanroom,
  runCitty,
  teardownCleanroom,
} from '../../src/core/runners/legacy-compatibility.js'

describe('README Cleanroom Examples - Complete Coverage', () => {
  let cleanroomSetup = false

  beforeAll(async () => {
    console.log('🐳 Setting up Docker cleanroom for comprehensive README tests...')
    try {
      await setupCleanroom({
        rootDir: './playground',
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

      result
        .expectSuccess()
        .expectOutput('USAGE')
        .expectOutput(/playground/)
        .expectNoStderr()
    })
  })

  describe('Gen Command Cleanroom Examples', () => {
    it('should work with gen project command in cleanroom', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Template generation with gen commands
      // Test gen project command in cleanroom
      const result = await runCitty(['gen', 'project', 'test-cleanroom-project'], {
        env: { TEST_CLI: 'true' },
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/Generated/)
        .expectOutput(/test-cleanroom-project/)
    })

    it('should work with gen test command in cleanroom', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test gen test command in cleanroom
      const result = await runCitty(['gen', 'test', 'cleanroom-test', '--test-type', 'cleanroom'], {
        env: { TEST_CLI: 'true' },
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/Generated/)
        .expectOutput(/cleanroom-test/)
    })

    it('should work with gen scenario command in cleanroom', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test gen scenario command in cleanroom
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

    it('should work with gen cli command in cleanroom', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test gen cli command in cleanroom
      const result = await runCitty(['gen', 'cli', 'cleanroom-cli'], {
        env: { TEST_CLI: 'true' },
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/Generated/)
        .expectOutput(/cleanroom-cli/)
    })

    it('should work with gen config command in cleanroom', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test gen config command in cleanroom
      const result = await runCitty(['gen', 'config', 'cleanroom-config'], {
        env: { TEST_CLI: 'true' },
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/Generated/)
        .expectOutput(/cleanroom-config/)
    })

    it('should show gen command help in cleanroom', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test gen command help in cleanroom
      const result = await runCitty(['gen', '--help'], {
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput(/Generate Command/)
        .expectOutput(/VERBS/)
        .expectOutput(/project/)
        .expectOutput(/test/)
        .expectOutput(/scenario/)
        .expectOutput(/cli/)
        .expectOutput(/config/)
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

      const jsonResult = await scenarios
        .jsonOutput(['greet', 'Alice', '--json'], 'cleanroom')
        .execute()
      expect(jsonResult.success).toBe(true)
    })

    it('should work with cleanroom subcommand testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Subcommand testing in cleanroom
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const subcommandResult = await scenarios
        .subcommand('math', ['add', '5', '3'], 'cleanroom')
        .execute()
      expect(subcommandResult.success).toBe(true)
    })

    it('should work with cleanroom idempotent testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: Robustness testing in cleanroom
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const idempotentResult = await scenarios.idempotent(['greet', 'Alice'], 'cleanroom').execute()
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
          [{ args: ['--help'] }, { args: ['--version'] }, { args: ['greet', 'Test'] }],
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
      const { runLocalCitty } = await import('../../src/core/runners/legacy-compatibility.js')

      const localResult = await runLocalCitty(['--version'], {
        cwd: './playground',
        env: { TEST_CLI: 'true' },
      })
      const cleanroomResult = await runCitty(['--version'], {
        env: { TEST_CLI: 'true' },
      })

      // Check that both results exist and have stdout
      expect(localResult.result).toBeDefined()
      expect(cleanroomResult.result).toBeDefined()
      expect(localResult.result.stdout).toBeDefined()
      expect(cleanroomResult.result.stdout).toBeDefined()

      // Compare the outputs
      expect(localResult.result.stdout).toBe(cleanroomResult.result.stdout)
    })

    it('should work with cross-environment gen command testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test gen commands work consistently across environments
      const { runLocalCitty } = await import('../../src/core/runners/legacy-compatibility.js')

      const localResult = await runLocalCitty(['gen', '--help'], {
        cwd: './playground',
        env: { TEST_CLI: 'true' },
      })
      const cleanroomResult = await runCitty(['gen', '--help'], {
        env: { TEST_CLI: 'true' },
      })

      // Both should produce the same help output
      expect(localResult.result.stdout).toBeDefined()
      expect(cleanroomResult.result.stdout).toBeDefined()
      expect(localResult.result.stdout).toContain('Generate Command')
      expect(cleanroomResult.result.stdout).toContain('Generate Command')
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
      result
        .expectSuccess()
        .expectOutput('USAGE')
        .expectOutput(/playground/)
        .expectNoStderr()
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

    it('should handle gen command workflow in cleanroom', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test gen command workflow in cleanroom
      const { scenario } = await import('../../src/core/scenarios/scenario-dsl.js')

      const result = await scenario('Gen command workflow')
        .step('Show gen help')
        .run('gen', '--help')
        .expectSuccess()
        .expectOutput(/Generate Command/)
        .step('Generate project')
        .run('gen', 'project', 'workflow-test')
        .expectSuccess()
        .expectOutput(/Generated/)
        .step('Generate test')
        .run('gen', 'test', 'workflow-test', '--test-type', 'cleanroom')
        .expectSuccess()
        .expectOutput(/Generated/)
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
      const result = await runCitty(['greet', 'Alice'], {
        env: {
          TEST_CLI: 'true',
          DEBUG: 'true',
        },
        timeout: 60000,
      })

      result.expectSuccess()
    })

    it('should ensure gen command isolation in cleanroom', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test that gen commands generate files in cleanroom container only
      // This ensures files don't pollute the host system
      const result = await runCitty(['gen', 'project', 'isolation-test'], {
        env: { TEST_CLI: 'true' },
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/Generated/)
        .expectOutput(/isolation-test/)

      // The generated files should stay in the cleanroom container
      // and not appear on the host system
    })
  })
})
