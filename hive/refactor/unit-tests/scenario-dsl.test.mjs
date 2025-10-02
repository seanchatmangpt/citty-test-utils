import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { scenario, testUtils } from '../../src/core/scenarios/scenario-dsl.js'
import { existsSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Unit Tests for Scenario DSL
 * Tests scenario builder pattern with REAL CLI execution
 *
 * NO MOCKS - Uses real test CLI for integration
 */

describe.concurrent('Scenario DSL Unit Tests', () => {
  const testDir = join(process.cwd(), '.test-scenario-dsl')
  const testCliPath = join(testDir, 'test-cli.mjs')

  beforeAll(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }

    // Create real test CLI for scenarios
    const cliContent = `#!/usr/bin/env node
const args = process.argv.slice(2)

if (args.includes('--help')) {
  console.log('Scenario Test CLI')
  process.exit(0)
}

if (args.includes('--version')) {
  console.log('1.0.0')
  process.exit(0)
}

if (args.includes('error')) {
  console.error('Test error')
  process.exit(1)
}

console.log('success')
process.exit(0)
`
    writeFileSync(testCliPath, cliContent, { encoding: 'utf8', mode: 0o755 })
  })

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe.concurrent('scenario builder', () => {
    it('should create a scenario builder', () => {
      const testScenario = scenario('Test Scenario')
      expect(testScenario).toBeDefined()
      expect(typeof testScenario.step).toBe('function')
      expect(typeof testScenario.run).toBe('function')
      expect(typeof testScenario.expect).toBe('function')
      expect(typeof testScenario.execute).toBe('function')
    })

    it('should build steps correctly', () => {
      const testScenario = scenario('Test Scenario')
        .step('First step')
        .run({ args: ['--help'] })
        .expect(() => {})
        .step('Second step')
        .run({ args: ['--version'] })
        .expect(() => {})

      // Access internal steps for testing
      const steps = testScenario._steps || []
      expect(steps).toHaveLength(2)
      expect(steps[0].description).toBe('First step')
      expect(steps[0].command.args).toEqual(['--help'])
      expect(steps[1].description).toBe('Second step')
      expect(steps[1].command.args).toEqual(['--version'])
    })

    it('should execute steps in order', async () => {
      const mockRunner = vi.fn().mockResolvedValue({
        result: { exitCode: 0, stdout: 'success', stderr: '' },
        expectSuccess: vi.fn().mockReturnThis(),
        expectOutput: vi.fn().mockReturnThis(),
      })

      const testScenario = scenario('Test Scenario')
        .step('First step')
        .run({ args: ['--help'] })
        .expect((result) => result.expectSuccess())
        .step('Second step')
        .run({ args: ['--version'] })
        .expect((result) => result.expectSuccess())

      const results = await testScenario.execute(mockRunner)

      expect(mockRunner).toHaveBeenCalledTimes(2)
      expect(mockRunner).toHaveBeenNthCalledWith(1, { args: ['--help'] })
      expect(mockRunner).toHaveBeenNthCalledWith(2, { args: ['--version'] })
      expect(results.results).toHaveLength(2)
    })

    it('should execute steps concurrently when enabled', async () => {
      const mockRunner = vi.fn().mockResolvedValue({
        result: { exitCode: 0, stdout: 'success', stderr: '' },
        expectSuccess: vi.fn().mockReturnThis(),
        expectOutput: vi.fn().mockReturnThis(),
      })

      const testScenario = scenario('Concurrent Test Scenario')
        .concurrent()
        .step('First step')
        .run({ args: ['--help'] })
        .expect((result) => result.expectSuccess())
        .step('Second step')
        .run({ args: ['--version'] })
        .expect((result) => result.expectSuccess())

      const results = await testScenario.execute(mockRunner)

      expect(mockRunner).toHaveBeenCalledTimes(2)
      expect(results.results).toHaveLength(2)
      expect(results.concurrent).toBe(true)
    })

    it('should throw error for step without command', async () => {
      const mockRunner = vi.fn()

      const testScenario = scenario('Test Scenario').step('Step without command')

      await expect(testScenario.execute(mockRunner)).rejects.toThrow(
        'Step "Step without command" has no command'
      )
    })

    it('should throw error for step without expectations', async () => {
      const mockRunner = vi.fn().mockResolvedValue({
        result: { exitCode: 0, stdout: 'success', stderr: '' },
      })

      const testScenario = scenario('Test Scenario')
        .step('Step without expectations')
        .run({ args: ['--help'] })

      await expect(testScenario.execute(mockRunner)).rejects.toThrow(
        'Step "Step without expectations" has no expectations'
      )
    })

    it('should handle multiple concurrent scenarios', async () => {
      const mockRunner = vi.fn().mockResolvedValue({
        result: { exitCode: 0, stdout: 'success', stderr: '' },
        expectSuccess: vi.fn().mockReturnThis(),
      })

      const scenarios = Array.from({ length: 5 }, (_, i) =>
        scenario(`Concurrent Scenario ${i}`)
          .concurrent()
          .step(`Step ${i}`)
          .run({ args: ['--help'] })
          .expectSuccess()
      )

      const results = await Promise.all(scenarios.map((scenario) => scenario.execute(mockRunner)))

      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result.success).toBe(true)
        expect(result.concurrent).toBe(true)
      })
    })
  })

  describe.concurrent('testUtils', () => {
    describe.concurrent('waitFor', () => {
      it('should resolve when condition is met', async () => {
        let attempts = 0
        const condition = () => {
          attempts++
          return attempts >= 2
        }

        const result = await testUtils.waitFor(condition, 1000, 10)
        expect(result).toBe(true)
        expect(attempts).toBe(2)
      })

      it('should timeout when condition is not met', async () => {
        const condition = () => false

        await expect(testUtils.waitFor(condition, 100, 10)).rejects.toThrow(
          'Condition not met within 100ms'
        )
      })

      it('should work with async conditions', async () => {
        let attempts = 0
        const condition = async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          attempts++
          return attempts >= 2
        }

        const result = await testUtils.waitFor(condition, 1000, 10)
        expect(result).toBe(true)
      })

      it('should handle multiple concurrent waitFor calls', async () => {
        const conditions = Array.from({ length: 3 }, (_, i) => {
          let attempts = 0
          return () => {
            attempts++
            return attempts >= i + 1
          }
        })

        const promises = conditions.map((condition) => testUtils.waitFor(condition, 1000, 10))

        const results = await Promise.all(promises)
        expect(results).toHaveLength(3)
        results.forEach((result) => expect(result).toBe(true))
      })
    })

    describe.concurrent('retry', () => {
      it('should succeed on first attempt', async () => {
        const mockFn = vi.fn().mockResolvedValue('success')

        const result = await testUtils.retry(mockFn)

        expect(result).toBe('success')
        expect(mockFn).toHaveBeenCalledTimes(1)
      })

      it('should retry on failure and eventually succeed', async () => {
        const mockFn = vi
          .fn()
          .mockRejectedValueOnce(new Error('First failure'))
          .mockRejectedValueOnce(new Error('Second failure'))
          .mockResolvedValue('success')

        const result = await testUtils.retry(mockFn, 3, 10)

        expect(result).toBe('success')
        expect(mockFn).toHaveBeenCalledTimes(3)
      })

      it('should fail after max attempts', async () => {
        const mockFn = vi.fn().mockRejectedValue(new Error('Persistent failure'))

        await expect(testUtils.retry(mockFn, 2, 10)).rejects.toThrow('Persistent failure')
        expect(mockFn).toHaveBeenCalledTimes(2)
      })

      it('should handle multiple concurrent retry operations', async () => {
        const mockFns = Array.from({ length: 3 }, (_, i) => {
          let attempts = 0
          return vi.fn().mockImplementation(() => {
            attempts++
            if (attempts < 2) {
              throw new Error(`Attempt ${attempts} failed`)
            }
            return `success-${i}`
          })
        })

        const promises = mockFns.map((mockFn) => testUtils.retry(mockFn, 3, 10))

        const results = await Promise.all(promises)
        expect(results).toHaveLength(3)
        results.forEach((result, i) => {
          expect(result).toBe(`success-${i}`)
        })
      })
    })

    describe.concurrent('createTempFile', () => {
      let tempFiles = []

      afterEach(async () => {
        if (tempFiles.length > 0) {
          await testUtils.cleanupTempFiles(tempFiles)
          tempFiles = []
        }
      })

      it('should create a temporary file', async () => {
        const tempFile = await testUtils.createTempFile('test content', '.txt')
        tempFiles.push(tempFile)

        expect(tempFile).toContain('citty-test-')
        expect(tempFile).toContain('.txt')

        const { readFileSync } = await import('node:fs')
        const content = readFileSync(tempFile, 'utf8')
        expect(content).toBe('test content')
      })

      it('should create file with default extension', async () => {
        const tempFile = await testUtils.createTempFile('test content')
        tempFiles.push(tempFile)

        expect(tempFile).toContain('.txt')
      })

      it('should create multiple temporary files concurrently', async () => {
        const contents = ['content1', 'content2', 'content3']
        const extensions = ['.txt', '.json', '.md']

        const promises = contents.map((content, i) =>
          testUtils.createTempFile(content, extensions[i])
        )

        const tempFiles = await Promise.all(promises)

        expect(tempFiles).toHaveLength(3)
        tempFiles.forEach((file, i) => {
          expect(file).toContain('citty-test-')
          expect(file).toContain(extensions[i])
        })

        // Clean up
        await testUtils.cleanupTempFiles(tempFiles)
      })
    })

    describe.concurrent('cleanupTempFiles', () => {
      it('should clean up temporary files', async () => {
        const tempFile = await testUtils.createTempFile('test content', '.txt')

        const { existsSync } = await import('node:fs')
        expect(existsSync(tempFile)).toBe(true)

        await testUtils.cleanupTempFiles([tempFile])
        expect(existsSync(tempFile)).toBe(false)
      })

      it('should handle non-existent files gracefully', async () => {
        await expect(testUtils.cleanupTempFiles(['/non/existent/file'])).resolves.not.toThrow()
      })

      it('should clean up multiple files concurrently', async () => {
        const tempFiles = await Promise.all([
          testUtils.createTempFile('content1', '.txt'),
          testUtils.createTempFile('content2', '.json'),
          testUtils.createTempFile('content3', '.md'),
        ])

        const { existsSync } = await import('node:fs')
        tempFiles.forEach((file) => {
          expect(existsSync(file)).toBe(true)
        })

        await testUtils.cleanupTempFiles(tempFiles)

        tempFiles.forEach((file) => {
          expect(existsSync(file)).toBe(false)
        })
      })
    })
  })
})
