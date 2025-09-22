import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  runLocalCitty,
  setupCleanroom,
  runCitty,
  teardownCleanroom,
  scenario,
  testUtils,
} from '../../index.js'

describe('BDD Tests - GitVan CLI Testing Scenarios', () => {
  describe('Feature: CLI Help System', () => {
    describe('Scenario: User requests help', () => {
      it('Given a user wants to understand GitVan commands', async () => {
        // Setup: User is ready to learn about GitVan
        const userContext = { wantsHelp: true }
        expect(userContext.wantsHelp).toBe(true)
      })

      it("When the user runs 'ctu --help'", async () => {
        const result = await runLocalCitty(['--help'])

        // Then the system should display usage information
        result.expectSuccess().expectOutput('USAGE').expectOutput('ctu').expectOutput('COMMANDS')
      })

      it('And the help should include all available commands', async () => {
        const result = await runLocalCitty(['--help'])

        const expectedCommands = [
          'test',
          'gen',
          'runner',
          'info',
          'analysis',
        ]

        expectedCommands.forEach((command) => {
          result.expectOutput(command)
        })
      })

      it('And the help should be well-formatted', async () => {
        const result = await runLocalCitty(['--help'])

        result
          .expectOutputLength(1000, 5000) // Reasonable length
          .expectNoStderr() // No errors
      })
    })

    describe('Scenario: User requests version information', () => {
      it('Given a user wants to check GitVan version', async () => {
        const userContext = { wantsVersion: true }
        expect(userContext.wantsVersion).toBe(true)
      })

      it("When the user runs 'ctu --version'", async () => {
        const result = await runLocalCitty(['--version'])

        // Then the system should display version information
        result.expectSuccess().expectOutput(/^\d+\.\d+\.\d+$/) // Semantic version format
      })

      it('And the version should be valid', async () => {
        const result = await runLocalCitty(['--version'])

        const version = result.result.stdout.trim()
        const versionParts = version.split('.')

        expect(versionParts).toHaveLength(3)
        expect(versionParts.every((part) => !isNaN(parseInt(part)))).toBe(true)
      })
    })
  })

  describe('Feature: Error Handling', () => {
    describe('Scenario: User enters invalid command', () => {
      it('Given a user enters an unknown command', async () => {
        const userContext = { invalidCommand: 'unknown-command' }
        expect(userContext.invalidCommand).toBe('unknown-command')
      })

      it("When the user runs 'ctu unknown-command'", async () => {
        const result = await runLocalCitty(['unknown-command'])

        // Then the system should handle the error gracefully
        result.expectFailure()
      })

      it('And the system should provide helpful error message', async () => {
        const result = await runLocalCitty(['unknown-command'])

        result.expectStderr(/Unknown command/).expectStderr(/unknown-command/)
      })

      it('And the system should not crash', async () => {
        const result = await runLocalCitty(['unknown-command'])

        // Exit code should be non-zero but not indicate a crash
        expect(result.result.exitCode).toBeGreaterThan(0)
        expect(result.result.exitCode).toBeLessThan(128) // Not a signal
      })
    })
  })

  describe('Feature: Command-Specific Help', () => {
    describe('Scenario: User requests help for specific command', () => {
      const commands = ['test', 'gen', 'runner', 'info', 'analysis']

      commands.forEach((command) => {
        it(`Given a user wants help for '${command}' command`, async () => {
          const userContext = { command }
          expect(userContext.command).toBe(command)
        })

        it(`When the user runs 'ctu ${command} --help'`, async () => {
          const result = await runLocalCitty([command, '--help'])

          // Then the system should display command-specific help
          result.expectSuccess()
        })

        it(`And the help should be relevant to '${command}'`, async () => {
          const result = await runLocalCitty([command, '--help'])

          // Command-specific help should contain the command name
          result.expectOutput(new RegExp(command, 'i'))
        })
      })
    })
  })

  describe('Feature: Docker Cleanroom Testing', () => {
    describe('Scenario: User runs commands in isolated environment', () => {
      beforeAll(async () => {
        await setupCleanroom({ rootDir: '/Users/sac/gitvan' })
      })

      afterAll(async () => {
        await teardownCleanroom()
      })

      it('Given a clean Docker environment is available', async () => {
        const environmentContext = { cleanroom: true }
        expect(environmentContext.cleanroom).toBe(true)
      })

      it('When the user runs commands in the cleanroom', async () => {
        const result = await runCitty(['--help'])

        // Then commands should work in the isolated environment
        result.expectSuccess().expectOutput('USAGE')
      })

      it('And the cleanroom should provide consistent results', async () => {
        const result1 = await runCitty(['--version'])
        const result2 = await runCitty(['--version'])

        expect(result1.result.stdout).toBe(result2.result.stdout)
        expect(result1.result.exitCode).toBe(result2.result.exitCode)
      })

      it('And multiple commands should work in the same container', async () => {
        const helpResult = await runCitty(['--help'])
        const versionResult = await runCitty(['--version'])

        helpResult.expectSuccess().expectOutput('USAGE')
        versionResult.expectSuccess().expectOutput(/^\d+\.\d+\.\d+$/)
      })
    })
  })

  describe('Feature: Complex Workflow Testing', () => {
    describe('Scenario: User performs multi-step GitVan workflow', () => {
      it('Given a user wants to test a complete GitVan workflow', async () => {
        const workflowContext = {
          steps: ['help', 'version', 'init-help', 'hooks-help'],
          expectedOutcome: 'all-steps-successful',
        }
        expect(workflowContext.steps).toHaveLength(4)
      })

      it('When the user executes the workflow using scenario DSL', async () => {
        const workflowScenario = scenario('Complete GitVan Workflow')
          .step('Get general help')
          .run(['--help'])
          .expect((result) => result.expectSuccess().expectOutput('USAGE'))

          .step('Check version')
          .run(['--version'])
          .expect((result) => result.expectSuccess().expectOutput(/^\d+\.\d+\.\d+$/))

          .step('Get init command help')
          .run(['init', '--help'])
          .expect((result) => result.expectSuccess())

          .step('Get hooks command help')
          .run(['hooks', '--help'])
          .expect((result) => result.expectSuccess())

        const results = await workflowScenario.execute(runLocalCitty)

        // Then all steps should complete successfully
        expect(results).toHaveLength(4)
        expect(results.every((r) => r.result.result.exitCode === 0)).toBe(true)
      })

      it('And the workflow should be reproducible', async () => {
        const workflowScenario = scenario('Reproducible Workflow')
          .step('Version check')
          .run(['--version'])
          .expect((result) => result.expectSuccess())

        const results1 = await workflowScenario.execute(runLocalCitty)
        const results2 = await workflowScenario.execute(runLocalCitty)

        expect(results1[0].result.result.stdout).toBe(results2[0].result.result.stdout)
      })
    })
  })

  describe('Feature: Test Utilities Integration', () => {
    describe('Scenario: User needs temporary files for testing', () => {
      it('Given a user needs to create test files', async () => {
        const testContext = { needsTempFiles: true }
        expect(testContext.needsTempFiles).toBe(true)
      })

      it('When the user creates temporary files', async () => {
        const tempFile = await testUtils.createTempFile('test content', '.txt')

        // Then the file should be created successfully
        expect(tempFile).toContain('citty-test-')

        const { readFileSync, existsSync } = await import('node:fs')
        expect(existsSync(tempFile)).toBe(true)
        expect(readFileSync(tempFile, 'utf8')).toBe('test content')
      })

      it('And the user can clean up the files', async () => {
        const tempFile = await testUtils.createTempFile('cleanup test', '.txt')

        await testUtils.cleanupTempFiles([tempFile])

        const { existsSync } = await import('node:fs')
        expect(existsSync(tempFile)).toBe(false)
      })
    })

    describe('Scenario: User needs retry logic for flaky operations', () => {
      it('Given a user has a potentially flaky operation', async () => {
        const retryContext = { operation: 'flaky', maxAttempts: 3 }
        expect(retryContext.maxAttempts).toBe(3)
      })

      it('When the user uses retry utility', async () => {
        let attempts = 0
        const flakyOperation = async () => {
          attempts++
          if (attempts < 2) {
            throw new Error(`Attempt ${attempts} failed`)
          }
          return 'success'
        }

        const result = await testUtils.retry(flakyOperation, 3, 10)

        // Then the operation should eventually succeed
        expect(result).toBe('success')
        expect(attempts).toBe(2)
      })
    })

    describe('Scenario: User needs to wait for conditions', () => {
      it('Given a user needs to wait for a condition', async () => {
        const waitContext = { condition: 'async-operation-complete' }
        expect(waitContext.condition).toBe('async-operation-complete')
      })

      it('When the user uses waitFor utility', async () => {
        let conditionMet = false
        setTimeout(() => {
          conditionMet = true
        }, 50)

        const result = await testUtils.waitFor(() => conditionMet, 1000, 10)

        // Then the condition should be met
        expect(result).toBe(true)
      })
    })
  })

  describe('Feature: Cross-Environment Testing', () => {
    describe('Scenario: User tests across local and cleanroom environments', () => {
      it('Given a user wants to test consistency across environments', async () => {
        const consistencyContext = {
          environments: ['local', 'cleanroom'],
          testCommand: '--version',
        }
        expect(consistencyContext.environments).toHaveLength(2)
      })

      it('When the user runs the same command in both environments', async () => {
        // Local environment
        const localResult = await runLocalCitty(['--version'])
        localResult.expectSuccess()

        // Cleanroom environment
        await setupCleanroom({ rootDir: '/Users/sac/gitvan' })
        const cleanroomResult = await runCitty(['--version'])
        cleanroomResult.expectSuccess()
        await teardownCleanroom()

        // Then results should be consistent
        expect(localResult.result.stdout).toBe(cleanroomResult.result.stdout)
        expect(localResult.result.exitCode).toBe(cleanroomResult.result.exitCode)
      })
    })
  })
})
