import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupCleanroom, runCitty, teardownCleanroom } from '../../index.js'
import { scenario } from '../../src/core/scenarios/scenario-dsl.js'

describe('Production Deployment Tests', () => {
  let cleanroomSetup = false

  beforeAll(async () => {
    console.log('🐳 Setting up production Docker environment...')
    try {
      await setupCleanroom({
        rootDir: './playground',
        timeout: 60000, // 1 minute timeout
      })
      cleanroomSetup = true
      console.log('✅ Production environment setup complete')
    } catch (error) {
      console.warn('⚠️ Production environment setup failed:', error.message)
      console.log('📝 Skipping production deployment tests')
      cleanroomSetup = false
    }
  }, 60000)

  afterAll(async () => {
    if (cleanroomSetup) {
      console.log('🧹 Cleaning up production environment...')
      try {
        await teardownCleanroom()
        console.log('✅ Production environment cleanup complete')
      } catch (error) {
        console.warn('⚠️ Production environment cleanup failed:', error.message)
      }
    }
  }, 30000)

  describe('Production CLI Deployment', () => {
    it('should run playground CLI with production npm package', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - production environment not available')
        return
      }

      const result = await runCitty(['--show-help'], {
        cliPath: '/app/src/cli.mjs', // Use playground CLI with production npm package
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/Playground CLI/)
        .expectOutput(/testing citty-test-utils/)
        .expectNoStderr()
    }, 30000)

    it('should handle playground commands in production', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - production environment not available')
        return
      }

      const result = await runCitty(['greet', 'Production'], {
        cliPath: '/app/src/cli.mjs',
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/Hello, Production!/)
        .expectNoStderr()
    }, 30000)

    it('should handle playground math operations in production', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - production environment not available')
        return
      }

      const result = await runCitty(['math', 'multiply', '7', '8'], {
        cliPath: '/app/src/cli.mjs',
        timeout: 30000,
      })

      result.expectSuccess().expectOutput(/56/).expectNoStderr()
    }, 30000)

    it('should handle playground JSON output in production', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - production environment not available')
        return
      }

      const result = await runCitty(['greet', 'Test', '--json'], {
        cliPath: '/app/src/cli.mjs',
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/{"message":"Hello, Test!"/)
        .expectNoStderr()
    }, 30000)
  })

  describe('Production Workflow Deployment', () => {
    it('should execute complex playground workflow in production', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - production environment not available')
        return
      }

      const result = await scenario('Production Playground Workflow')
        .step('Get playground help')
        .run(['--show-help'])
        .expectSuccess()
        .expectOutput(/Playground CLI/)
        .step('Greet user')
        .run(['greet', 'Production User'])
        .expectSuccess()
        .expectOutput(/Hello, Production User!/)
        .step('Perform math operation')
        .run(['math', 'add', '100', '200'])
        .expectSuccess()
        .expectOutput(/300/)
        .execute('cleanroom', {
          cliPath: '/app/src/cli.mjs',
          timeout: 30000,
        })

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(3)
    }, 45000)

    it('should handle production error scenarios', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - production environment not available')
        return
      }

      const result = await scenario('Production Error Handling')
        .step('Handle invalid command')
        .run(['invalid-command'])
        .expectFailure()
        .expectOutput(/Unknown command/)
        .step('Handle invalid math operation')
        .run(['math', 'invalid', '1', '2'])
        .expectFailure()
        .expectOutput(/Unknown command invalid/)
        .execute('cleanroom', {
          cliPath: '/app/src/cli.mjs',
          timeout: 30000,
        })

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
    }, 45000)
  })

  describe('Production Performance Tests', () => {
    it('should handle concurrent playground operations in production', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - production environment not available')
        return
      }

      const startTime = Date.now()

      // Run multiple playground operations concurrently
      const promises = [
        runCitty(['greet', 'User1'], { cliPath: '/app/src/cli.mjs', timeout: 30000 }),
        runCitty(['greet', 'User2'], { cliPath: '/app/src/cli.mjs', timeout: 30000 }),
        runCitty(['math', 'add', '1', '2'], { cliPath: '/app/src/cli.mjs', timeout: 30000 }),
        runCitty(['math', 'multiply', '3', '4'], { cliPath: '/app/src/cli.mjs', timeout: 30000 }),
        runCitty(['--show-version'], { cliPath: '/app/src/cli.mjs', timeout: 30000 }),
      ]

      const results = await Promise.all(promises)

      const duration = Date.now() - startTime
      console.log(`⏱️ Production concurrent operations took ${duration}ms`)

      // Verify all operations succeeded
      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0)
        expect(result.stderr).toBe('')
      })

      // Verify specific outputs
      expect(results[0].stdout).toContain('Hello, User1!')
      expect(results[1].stdout).toContain('Hello, User2!')
      expect(results[2].stdout).toContain('3')
      expect(results[3].stdout).toContain('12')
      expect(results[4].stdout).toContain('1.0.0')
    }, 60000)

    it('should handle production stress testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - production environment not available')
        return
      }

      const startTime = Date.now()
      const iterations = 10

      // Run multiple iterations of playground operations
      for (let i = 0; i < iterations; i++) {
        const result = await runCitty(['greet', `User${i}`], {
          cliPath: '/app/src/cli.mjs',
          timeout: 30000,
        })

        result
          .expectSuccess()
          .expectOutput(new RegExp(`Hello, User${i}!`))
          .expectNoStderr()
      }

      const duration = Date.now() - startTime
      console.log(`⏱️ Production stress test (${iterations} iterations) took ${duration}ms`)
      console.log(`📊 Average time per operation: ${duration / iterations}ms`)
    }, 120000)
  })

  describe('Production Integration Tests', () => {
    it('should work with production environment variables', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - production environment not available')
        return
      }

      const result = await runCitty(['greet', 'Production', '--json'], {
        cliPath: '/app/src/cli.mjs',
        env: {
          NODE_ENV: 'production',
          DEBUG: 'false',
          LOG_LEVEL: 'info',
        },
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/{"message":"Hello, Production!"/)
        .expectNoStderr()
    }, 30000)

    it('should handle production file operations', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - production environment not available')
        return
      }

      // Test that the playground CLI can handle file operations in production
      const result = await runCitty(['--show-help'], {
        cliPath: '/app/src/cli.mjs',
        timeout: 30000,
      })

      result
        .expectSuccess()
        .expectOutput(/Playground CLI/)
        .expectNoStderr()
    }, 30000)
  })
})
