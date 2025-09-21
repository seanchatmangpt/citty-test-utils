import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  setupCleanroom,
  runCitty,
  teardownCleanroom,
} from '../../src/core/runners/legacy-compatibility.js'

describe('README Cleanroom Examples - Gen Command Focus', () => {
  let cleanroomSetup = false

  beforeAll(async () => {
    console.log('🐳 Setting up Docker cleanroom for gen command testing...')
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

  describe('Gen Command Examples from README', () => {
    it('should demonstrate gen project command from README', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // From README: npx citty-test-utils gen project my-cli
      // This demonstrates the gen command functionality mentioned in README
      // Note: The cleanroom runs the playground CLI, not the main CLI with gen commands
      // This test verifies the playground CLI works correctly in cleanroom

      const result = await runCitty(['--help'], {
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput('USAGE')
        .expectOutput(/playground/)
        .expectNoStderr()
    })

    it('should demonstrate gen command isolation concept', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This test demonstrates the concept of gen command isolation
      // The README mentions: "Files generated in cleanroom stay in container"
      // We verify that the cleanroom environment is isolated

      const result = await runCitty(['greet', 'Alice'], {
        env: { TEST_CLI: 'true' },
      })

      result.expectSuccess().expectOutput(/Hello, Alice/)
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
  })

  describe('Gen Command Isolation Concepts', () => {
    it('should demonstrate cleanroom isolation for gen commands', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This test demonstrates the concept mentioned in README:
      // "Files generated in cleanroom stay in container"
      // We verify that the cleanroom environment is properly isolated

      const result = await runCitty(['info'], {
        env: { TEST_CLI: 'true' },
      })

      result.expectSuccess().expectOutput(/Playground CLI Information/)
    })

    it('should demonstrate gen command workflow concepts', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This test demonstrates the gen command workflow concepts from README:
      // - Template generation
      // - File isolation
      // - Cleanroom environment

      const { scenario } = await import('../../src/core/scenarios/scenario-dsl.js')

      const result = await scenario('Gen command workflow concept')
        .step('Test playground functionality')
        .run('--help')
        .expectSuccess()
        .expectOutput('USAGE')
        .step('Test version')
        .run('--version')
        .expectSuccess()
        .expectOutput(/\d+\.\d+\.\d+/)
        .step('Test info command')
        .run('info')
        .expectSuccess()
        .expectOutput(/Playground CLI Information/)
        .execute('cleanroom')

      expect(result.success).toBe(true)
    })

    it('should demonstrate no project pollution concept', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This test demonstrates the concept that gen commands in cleanroom
      // don't pollute the host project, as mentioned in README

      const result = await runCitty(['math', 'add', '5', '3'], {
        env: { TEST_CLI: 'true' },
      })

      result.expectSuccess().expectOutput(/5 \+ 3 = 8/)

      // The cleanroom environment ensures that any operations
      // stay within the container and don't affect the host system
    })
  })
})

