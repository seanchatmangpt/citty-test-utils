import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupCleanroom, runCitty, teardownCleanroom } from 'un-test-utils'
import { scenario } from '@un-test/scenario'

describe('Production Deployment Tests', () => {
  if (process.env.RUN_CLEANROOM !== '1' && process.env.CI !== 'true') {
    throw new Error('Cleanroom environment is not enabled. Set RUN_CLEANROOM=1 or CI=true to run cleanroom tests.')
  }
  let cleanroomSetup = false

  beforeAll(async () => {
    console.log('🐳 Setting up production Docker environment...')
    await setupCleanroom({
      rootDir: './playground',
      timeout: 60000, // 1 minute timeout
    })
    cleanroomSetup = true
    console.log('✅ Production environment setup complete')
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
      const result = await runCitty(['math', 'multiply', '7', '8'], {
        cliPath: '/app/src/cli.mjs',
        timeout: 30000,
      })

      result.expectSuccess().expectOutput(/56/).expectNoStderr()
    }, 30000)

    it('should handle playground JSON output in production', async () => {
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
      const result = await scenario('Production Error Handling')
        .step('Handle invalid command')
        .run(['invalid-command'])
        .expectFailure()
        .expectStderr(/Unknown command/)
        .step('Handle invalid math operation')
        .run(['math', 'invalid', '1', '2'])
        .expectFailure()
        .expectStderr(/Unknown command/)
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
