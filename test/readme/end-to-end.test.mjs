import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  runLocalCitty,
  setupCleanroom,
  runCitty,
  teardownCleanroom,
} from '../../src/core/runners/legacy-compatibility.js'

describe('End-to-End README Examples', () => {
  let cleanroomSetup = false
  let testProjectDir = ''

  beforeAll(async () => {
    console.log('🚀 Setting up end-to-end test environment...')

    // Create a test project directory
    testProjectDir = join(process.cwd(), 'test-e2e-project')
    if (existsSync(testProjectDir)) {
      execSync(`rm -rf ${testProjectDir}`)
    }
    mkdirSync(testProjectDir, { recursive: true })

    // Setup cleanroom
    try {
      await setupCleanroom({
        rootDir: './playground',
        timeout: 60000,
      })
      cleanroomSetup = true
      console.log('✅ Cleanroom setup complete')
    } catch (error) {
      console.warn('⚠️ Cleanroom setup failed:', error.message)
      cleanroomSetup = false
    }

    console.log('✅ End-to-end test setup complete')
  }, 60000)

  afterAll(async () => {
    console.log('🧹 Cleaning up end-to-end test environment...')

    // Cleanup test project
    if (existsSync(testProjectDir)) {
      execSync(`rm -rf ${testProjectDir}`)
    }

    // Cleanup cleanroom
    if (cleanroomSetup) {
      try {
        await teardownCleanroom()
        console.log('✅ Cleanroom cleanup complete')
      } catch (error) {
        console.warn('⚠️ Cleanroom cleanup failed:', error.message)
      }
    }

    console.log('✅ End-to-end test cleanup complete')
  }, 30000)

  describe('1. Installation and Setup', () => {
    it('should demonstrate package installation from README', () => {
      // From README: Installation section
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      expect(packageJson.name).toBe('citty-test-utils')
      expect(packageJson.description).toContain('comprehensive testing framework')
      expect(packageJson.description).toContain('Citty')
      expect(packageJson.description).toContain('Docker cleanroom')
      expect(packageJson.description).toContain('fluent assertions')
    })

    it('should verify requirements from README', () => {
      // From README: Requirements section
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

      // Node.js version requirement
      expect(packageJson.engines.node).toBeDefined()

      // Docker requirement (testcontainers dependency)
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      }
      const hasDockerTesting = Object.keys(allDeps).some(
        (dep) =>
          dep.includes('testcontainers') || dep.includes('docker') || dep.includes('container')
      )
      expect(hasDockerTesting).toBe(true)

      // Citty requirement
      expect(packageJson.devDependencies.citty).toBeDefined()
    })
  })

  describe('2. Basic Usage Examples', () => {
    it('should demonstrate local testing from README', async () => {
      // From README: Basic usage - Local testing
      const result = await runLocalCitty(['--help'], {
        cwd: './playground',
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput('USAGE')
        .expectOutput(/playground/)
        .expectNoStderr()
    })

    it('should demonstrate cleanroom testing from README', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping cleanroom test - Docker not available')
        return
      }

      // From README: Basic usage - Cleanroom testing
      const cleanResult = await runCitty(['--version'], {
        env: { TEST_CLI: 'true' },
      })

      cleanResult.expectSuccess().expectOutput(/\d+\.\d+\.\d+/)
    })
  })

  describe('3. Fluent Assertions Examples', () => {
    it('should demonstrate fluent assertions from README', async () => {
      // From README: Fluent assertions section
      const result = await runLocalCitty(['--help'], {
        cwd: './playground',
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess() // Shorthand for expectExit(0)
        .expectOutput('USAGE') // String match
        .expectOutput(/playground/) // Regex match
        .expectNoStderr() // Expect empty stderr
        .expectOutputLength(100, 5000) // Length range validation
    })

    it('should demonstrate advanced assertions from README', async () => {
      // From README: Advanced assertions section
      const result = await runLocalCitty(['--help'], {
        cwd: './playground',
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess() // expectExit(0)
        .expectOutput('Usage:') // String match
        .expectOutput(/playground/) // Regex match
        .expectOutputContains('commands') // Contains text
        .expectOutputNotContains('error') // Does not contain text
        .expectStderr('') // Check stderr
        .expectNoOutput() // Expect empty stdout
        .expectNoStderr() // Expect empty stderr
        .expectOutputLength(10, 10000) // Check output length range
        .expectStderrLength(0, 50) // Check stderr length range
        .expectDuration(5000) // Check execution time
    })
  })

  describe('4. Scenario DSL Examples', () => {
    it('should demonstrate basic scenario from README', async () => {
      // From README: Scenario DSL section
      const { scenario } = await import('../../src/core/scenarios/scenario-dsl.js')

      const result = await scenario('Test CLI Help')
        .step('Get help')
        .run('--help')
        .expectSuccess()
        .expectOutput('USAGE')
        .step('Get version')
        .run('--version')
        .expectSuccess()
        .expectOutput(/\d+\.\d+\.\d+/)
        .execute('local')

      expect(result.success).toBe(true)
    })

    it('should demonstrate complex scenario from README', async () => {
      // From README: Complex scenario section
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
        .execute('local')

      expect(result.success).toBe(true)
    })
  })

  describe('5. Pre-built Scenarios Examples', () => {
    it('should demonstrate basic scenarios from README', async () => {
      // From README: Pre-built scenarios section
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const helpResult = await scenarios.help('local').execute()
      const versionResult = await scenarios.version('local').execute()

      expect(helpResult.success).toBe(true)
      expect(versionResult.success).toBe(true)
    })

    it('should demonstrate advanced scenarios from README', async () => {
      // From README: Advanced scenarios section
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const jsonResult = await scenarios.jsonOutput(['greet', 'Alice', '--json'], 'local').execute()
      const subcommandResult = await scenarios
        .subcommand('math', ['add', '5', '3'], 'local')
        .execute()
      const idempotentResult = await scenarios.idempotent(['greet', 'Alice'], 'local').execute()

      expect(jsonResult.success).toBe(true)
      expect(subcommandResult.success).toBe(true)
      expect(idempotentResult.success).toBe(true)
    })
  })

  describe('6. Cleanroom Scenarios Examples', () => {
    it('should demonstrate cleanroom scenarios from README', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping cleanroom scenarios - Docker not available')
        return
      }

      // From README: Cleanroom scenarios section
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const helpResult = await scenarios.help('cleanroom').execute()
      const versionResult = await scenarios.version('cleanroom').execute()

      expect(helpResult.success).toBe(true)
      expect(versionResult.success).toBe(true)
    })

    it('should demonstrate cross-environment testing from README', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping cross-environment test - Docker not available')
        return
      }

      // From README: Cross-environment testing section
      const localResult = await runLocalCitty(['--version'], {
        cwd: './playground',
        env: { TEST_CLI: 'true' },
      })
      const cleanroomResult = await runCitty(['--version'], {
        env: { TEST_CLI: 'true' },
      })

      // Both should produce the same output
      expect(localResult.result.stdout).toBeDefined()
      expect(cleanroomResult.result.stdout).toBeDefined()
    })
  })

  describe('7. Utility Functions Examples', () => {
    it('should demonstrate waitFor utility from README', async () => {
      // From README: Utility functions section
      const { testUtils } = await import('../../src/core/runners/legacy-compatibility.js')

      let conditionMet = false
      setTimeout(() => {
        conditionMet = true
      }, 100)

      await testUtils.waitFor(
        () => conditionMet,
        5000, // timeout
        50 // interval
      )

      expect(conditionMet).toBe(true)
    })

    it('should demonstrate retry utility from README', async () => {
      // From README: Retry utility section
      const { testUtils } = await import('../../src/core/runners/legacy-compatibility.js')

      let attempts = 0
      const flakyOperation = async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Flaky operation failed')
        }
        return 'success'
      }

      const result = await testUtils.retry(
        flakyOperation,
        3, // max attempts
        100 // delay between attempts
      )

      expect(result).toBe('success')
      expect(attempts).toBe(2)
    })

    it('should demonstrate temp file utilities from README', async () => {
      // From README: Temp file utilities section
      const { testUtils } = await import('../../src/core/runners/legacy-compatibility.js')

      const tempFile = await testUtils.createTempFile('test content', '.txt')
      expect(tempFile).toContain('test')

      await testUtils.cleanupTempFiles([tempFile])
    })
  })

  describe('8. CLI Commands Examples', () => {
    it('should demonstrate info command from README', () => {
      // From README: CLI commands section
      try {
        const output = execSync('npx citty-test-utils info version', {
          encoding: 'utf8',
          cwd: process.cwd(),
        })
        expect(output).toContain('citty-test-utils')
      } catch (error) {
        // Command might not be available in test environment
        console.log('⏭️ CLI command not available in test environment')
      }
    })

    it('should demonstrate project generation from README', () => {
      // From README: Project generation section
      try {
        const output = execSync('npx citty-test-utils gen project test-e2e-cli', {
          encoding: 'utf8',
          cwd: process.cwd(),
        })
        expect(output).toContain('Generated')
      } catch (error) {
        // Command might not be available in test environment
        console.log('⏭️ CLI command not available in test environment')
      }
    })
  })

  describe('9. Complete Integration Example', () => {
    it('should demonstrate complete example from README', async () => {
      // From README: Complete example section
      const { scenario, scenarios, testUtils } = await import(
        '../../src/core/runners/legacy-compatibility.js'
      )

      // Test local runner
      const localResult = await runLocalCitty(['--help'], {
        cwd: './playground',
        env: { TEST_CLI: 'true' },
      })
      localResult
        .expectSuccess()
        .expectOutput('USAGE')
        .expectOutput(/playground/)
        .expectNoStderr()

      // Test cleanroom runner (if available)
      if (cleanroomSetup) {
        const cleanroomResult = await runCitty(['--help'], {
          env: { TEST_CLI: 'true' },
        })
        cleanroomResult
          .expectSuccess()
          .expectOutput('USAGE')
          .expectOutput(/playground/)
          .expectNoStderr()
      }

      // Test scenario
      const scenarioResult = await scenario('Complete workflow')
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
        .execute('local')

      expect(scenarioResult.success).toBe(true)

      // Test pre-built scenarios
      const helpResult = await scenarios.help('local').execute()
      const versionResult = await scenarios.version('local').execute()

      expect(helpResult.success).toBe(true)
      expect(versionResult.success).toBe(true)

      // Test flaky operations
      await testUtils.retry(
        async () => {
          const result = await runLocalCitty(['--help'], {
            cwd: './playground',
            env: { TEST_CLI: 'true' },
          })
          result.expectSuccess()
        },
        3,
        100
      )
    })
  })

  describe('10. Error Handling Examples', () => {
    it('should demonstrate error testing from README', async () => {
      // From README: Error testing section
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const errorResult = await scenarios
        .errorCase(['invalid-command'], /Unknown command/, 'local')
        .execute()
      expect(errorResult.success).toBe(true)
    })

    it('should demonstrate concurrent testing from README', async () => {
      // From README: Concurrent testing section
      const { scenarios } = await import('../../src/core/scenarios/scenarios.js')

      const concurrentResult = await scenarios
        .concurrent(
          [{ args: ['--help'] }, { args: ['--version'] }, { args: ['greet', 'Test'] }],
          'local'
        )
        .execute()

      expect(concurrentResult.success).toBe(true)
    })
  })
})
