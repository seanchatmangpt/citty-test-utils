import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupCleanroom, teardownCleanroom } from 'citty-test-utils'
import { scenarios, scenario } from '../../scenario-config.mjs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the playground directory path
const __filename = fileURLToPath(import.meta.url)
const playgroundDir = join(dirname(__filename), '../..')

describe('Advanced Scenario Testing', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: playgroundDir, timeout: 30000 })
  })

  afterAll(async () => {
    await teardownCleanroom()
  })

  describe('Complex Workflow Scenarios', () => {
    it('should execute complete user workflow', async () => {
      const userWorkflow = scenario('Complete User Workflow')
        .step('Get help information')
        .run(['--show-help'])
        .expectSuccess()
        .expectOutput(/playground/)
        .expectOutput(/COMMANDS/)
        .step('Get version')
        .run(['--show-version'])
        .expectSuccess()
        .expectOutput(/1\.0\.0/)
        .step('Greet user')
        .run(['greet', 'User'])
        .expectSuccess()
        .expectOutput(/Hello, User/)
        .step('Perform math operations')
        .run(['math', 'add', '10', '20'])
        .expectSuccess()
        .expectOutput(/10 \+ 20 = 30/)
        .step('Get playground info')
        .run(['info'])
        .expectSuccess()
        .expectOutput(/Playground CLI Information/)

      const result = await userWorkflow.execute('local')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(5)
      expect(result.concurrent).toBe(false)
    })

    it('should execute error handling workflow', async () => {
      const errorWorkflow = scenario('Error Handling Workflow')
        .step('Test generic error')
        .run(['error', 'generic'])
        .expectFailure()
        .expectStderr(/Generic error occurred/)
        .step('Test validation error')
        .run(['error', 'validation'])
        .expectFailure()
        .expectStderr(/Validation error/)
        .step('Test invalid command')
        .run(['invalid-command'])
        .expectFailure()
        .expectStderr(/Unknown command/)
        .step('Test missing arguments')
        .run(['math', 'add'])
        .expectFailure()

      const result = await errorWorkflow.execute('local')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(4)
    })

    it('should execute JSON workflow', async () => {
      const jsonWorkflow = scenario('JSON Output Workflow')
        .step('Get JSON greeting')
        .run(['greet', 'JSON', '--json'])
        .expectSuccess()
        .expectJson((json) => {
          expect(json.message).toBe('Hello, JSON!')
          expect(json.count).toBe(1)
          expect(json.verbose).toBe(false)
        })
        .step('Get JSON math result')
        .run(['math', 'add', '15', '25', '--json'])
        .expectSuccess()
        .expectJson((json) => {
          expect(json.operation).toBe('add')
          expect(json.a).toBe(15)
          expect(json.b).toBe(25)
          expect(json.result).toBe(40)
        })
        .step('Get JSON multiply result')
        .run(['math', 'multiply', '6', '7', '--json'])
        .expectSuccess()
        .expectJson((json) => {
          expect(json.operation).toBe('multiply')
          expect(json.a).toBe(6)
          expect(json.b).toBe(7)
          expect(json.result).toBe(42)
        })
        .step('Get JSON info')
        .run(['info', '--json'])
        .expectSuccess()
        .expectJson((json) => {
          expect(json.name).toBe('citty-test-utils-playground')
          expect(json.version).toBe('1.0.0')
          expect(json.commands).toBeDefined()
        })

      const result = await jsonWorkflow.execute('local')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(4)
    })

    it('should execute math operations workflow', async () => {
      const mathWorkflow = scenario('Math Operations Workflow')
        .step('Add numbers')
        .run(['math', 'add', '5', '3'])
        .expectSuccess()
        .expectOutput(/5 \+ 3 = 8/)
        .step('Multiply numbers')
        .run(['math', 'multiply', '4', '7'])
        .expectSuccess()
        .expectOutput(/4 × 7 = 28/)
        .step('Add larger numbers')
        .run(['math', 'add', '100', '200'])
        .expectSuccess()
        .expectOutput(/100 \+ 200 = 300/)
        .step('Multiply larger numbers')
        .run(['math', 'multiply', '12', '15'])
        .expectSuccess()
        .expectOutput(/12 × 15 = 180/)

      const result = await mathWorkflow.execute('local')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(4)
    })

    it('should execute greeting variations workflow', async () => {
      const greetingWorkflow = scenario('Greeting Variations Workflow')
        .step('Simple greeting')
        .run(['greet', 'Alice'])
        .expectSuccess()
        .expectOutput(/Hello, Alice/)
        .step('Greeting with count')
        .run(['greet', 'Bob', '--count', '3'])
        .expectSuccess()
        .expectOutput(/Hello, Bob! \(1\/3\)/)
        .expectOutput(/Hello, Bob! \(2\/3\)/)
        .expectOutput(/Hello, Bob! \(3\/3\)/)
        .step('Greeting with verbose')
        .run(['greet', 'Charlie', '--verbose'])
        .expectSuccess()
        .expectOutput(/Verbose mode enabled/)
        .expectOutput(/Hello, Charlie/)
        .step('Greeting with both options')
        .run(['greet', 'David', '--count', '2', '--verbose'])
        .expectSuccess()
        .expectOutput(/Verbose mode enabled/)
        .expectOutput(/Hello, David! \(1\/2\)/)
        .expectOutput(/Hello, David! \(2\/2\)/)

      const result = await greetingWorkflow.execute('local')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(4)
    })
  })

  describe('Concurrent Scenario Execution', () => {
    it('should execute concurrent scenarios', async () => {
      const concurrentWorkflow = scenario('Concurrent Operations')
        .concurrent()
        .step('Greet Alice')
        .run(['greet', 'Alice'])
        .expectSuccess()
        .expectOutput(/Hello, Alice/)
        .step('Greet Bob')
        .run(['greet', 'Bob'])
        .expectSuccess()
        .expectOutput(/Hello, Bob/)
        .step('Math operation')
        .run(['math', 'add', '1', '1'])
        .expectSuccess()
        .expectOutput(/1 \+ 1 = 2/)

      const result = await concurrentWorkflow.execute('local')

      expect(result.success).toBe(true)
      expect(result.concurrent).toBe(true)
      expect(result.results).toHaveLength(3)
    })

    it('should execute mixed concurrent and sequential steps', async () => {
      const mixedWorkflow = scenario('Mixed Execution Workflow')
        .step('Sequential step 1')
        .run(['greet', 'Sequential'])
        .expectSuccess()
        .expectOutput(/Hello, Sequential/)
        .concurrent()
        .step('Concurrent step 1')
        .run(['math', 'add', '5', '5'])
        .expectSuccess()
        .expectOutput(/5 \+ 5 = 10/)
        .step('Concurrent step 2')
        .run(['math', 'multiply', '3', '3'])
        .expectSuccess()
        .expectOutput(/3 × 3 = 9/)
        .sequential()
        .step('Sequential step 2')
        .run(['info'])
        .expectSuccess()
        .expectOutput(/Playground CLI Information/)

      const result = await mixedWorkflow.execute('local')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(4)
    })
  })

  describe('Cleanroom Scenario Execution', () => {
    it('should execute complex workflow in cleanroom', async () => {
      const cleanroomWorkflow = scenario('Cleanroom Complex Workflow')
        .step('Get help in cleanroom')
        .run(['--show-help'])
        .expectSuccess()
        .expectOutput(/playground/)
        .step('Greet in cleanroom')
        .run(['greet', 'Cleanroom'])
        .expectSuccess()
        .expectOutput(/Hello, Cleanroom/)
        .step('Math in cleanroom')
        .run(['math', 'add', '15', '25'])
        .expectSuccess()
        .expectOutput(/15 \+ 25 = 40/)
        .step('JSON in cleanroom')
        .run(['greet', 'JSON', '--json'])
        .expectSuccess()
        .expectJson((json) => {
          expect(json.message).toBe('Hello, JSON!')
        })

      const result = await cleanroomWorkflow.execute('cleanroom')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(4)
    })

    it('should execute concurrent operations in cleanroom', async () => {
      const concurrentCleanroomWorkflow = scenario('Concurrent Cleanroom Operations')
        .concurrent()
        .step('Greet Alice in cleanroom')
        .run(['greet', 'Alice'])
        .expectSuccess()
        .expectOutput(/Hello, Alice/)
        .step('Greet Bob in cleanroom')
        .run(['greet', 'Bob'])
        .expectSuccess()
        .expectOutput(/Hello, Bob/)
        .step('Math in cleanroom')
        .run(['math', 'multiply', '6', '7'])
        .expectSuccess()
        .expectOutput(/6 × 7 = 42/)

      const result = await concurrentCleanroomWorkflow.execute('cleanroom')

      expect(result.success).toBe(true)
      expect(result.concurrent).toBe(true)
      expect(result.results).toHaveLength(3)
    })
  })

  describe('Error Scenario Handling', () => {
    it('should handle mixed success and failure scenarios', async () => {
      const mixedResultWorkflow = scenario('Mixed Success and Failure')
        .step('Successful command')
        .run(['greet', 'Success'])
        .expectSuccess()
        .expectOutput(/Hello, Success/)
        .step('Failed command')
        .run(['error', 'generic'])
        .expectFailure()
        .expectStderr(/Generic error occurred/)
        .step('Another successful command')
        .run(['math', 'add', '1', '1'])
        .expectSuccess()
        .expectOutput(/1 \+ 1 = 2/)

      const result = await mixedResultWorkflow.execute('local')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(3)
    })

    it('should handle timeout scenarios', async () => {
      const timeoutWorkflow = scenario('Timeout Handling')
        .step('Normal command')
        .run(['greet', 'Normal'])
        .expectSuccess()
        .expectOutput(/Hello, Normal/)
        .step('Timeout command')
        .run(['error', 'timeout'])
        .expectFailure()

      const result = await timeoutWorkflow.execute('local')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
    })
  })

  describe('Pre-built Scenario Extensions', () => {
    it('should execute extended help scenario', async () => {
      const result = await scenarios.help('local').execute()

      expect(result.success).toBe(true)
      expect(result.result.stdout).toContain('playground')
      expect(result.result.stdout).toContain('COMMANDS')
    })

    it('should execute extended version scenario', async () => {
      const result = await scenarios.version('local').execute()

      expect(result.success).toBe(true)
      expect(result.result.stdout).toMatch(/1\.0\.0/)
    })

    it('should execute extended JSON scenario', async () => {
      const result = await scenarios.jsonOutput(['greet', 'Extended', '--json'], 'local').execute()

      expect(result.success).toBe(true)
      expect(result.result.json).toBeDefined()
      expect(result.result.json.message).toBe('Hello, Extended!')
    })

    it('should execute extended subcommand scenario', async () => {
      const result = await scenarios.subcommand('math', ['multiply', '8', '9'], 'local').execute()

      expect(result.success).toBe(true)
      expect(result.result.stdout).toContain('8 × 9 = 72')
    })

    it('should execute extended idempotent scenario', async () => {
      const result = await scenarios.idempotent(['greet', 'Idempotent'], 'local').execute()

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.results[0].stdout).toBe(result.results[1].stdout)
    })

    it('should execute extended concurrent scenario', async () => {
      const runs = [
        { args: ['greet', 'Concurrent1'], opts: {} },
        { args: ['greet', 'Concurrent2'], opts: {} },
        { args: ['math', 'add', '2', '2'], opts: {} },
        { args: ['math', 'multiply', '3', '3'], opts: {} },
      ]

      const result = await scenarios.concurrent(runs, 'local').execute()

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(4)
    })

    it('should execute extended error scenario', async () => {
      const result = await scenarios
        .errorCase(['error', 'validation'], /Validation error/, 'local')
        .execute()

      expect(result.success).toBe(true)
    })
  })

  describe('Scenario Validation', () => {
    it('should validate scenario structure', async () => {
      const invalidScenario = scenario('Invalid Scenario').step('Step without command')
      // Missing .run() call

      await expect(invalidScenario.execute('local')).rejects.toThrow(
        'Step "Step without command" has no command'
      )
    })

    it('should validate empty scenarios', async () => {
      const emptyScenario = scenario('Empty Scenario')

      await expect(emptyScenario.execute('local')).rejects.toThrow('No steps defined')
    })

    it('should validate step expectations', async () => {
      const expectationScenario = scenario('Expectation Validation')
        .step('Test expectations')
        .run(['greet', 'Test'])
        .expectSuccess()
        .expectOutput(/Hello, Test/)
        .expectNoStderr()

      const result = await expectationScenario.execute('local')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })
  })
})
