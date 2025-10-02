import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the playground directory path
const __filename = fileURLToPath(import.meta.url)
const playgroundDir = join(dirname(__filename), '../..')

describe('Fluent Assertions Integration Tests', () => {
  describe('Basic Assertions', () => {
    it('should support expectSuccess()', async () => {
      const result = await runLocalCitty(['greet', 'Test'], {
        cwd: playgroundDir,
      })

      result.expectSuccess()
      expect(result.result.exitCode).toBe(0)
    })

    it('should support expectFailure()', async () => {
      const result = await runLocalCitty(['invalid-command'], {
        cwd: playgroundDir,
      })

      result.expectFailure()
      expect(result.result.exitCode).not.toBe(0)
    })

    it('should support expectOutput() with string', async () => {
      const result = await runLocalCitty(['greet', 'Alice'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectOutput('Hello, Alice!')
    })

    it('should support expectOutput() with regex', async () => {
      const result = await runLocalCitty(['greet', 'Bob'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectOutput(/Hello, Bob/)
    })

    it('should support expectStderr()', async () => {
      const result = await runLocalCitty(['error', 'generic'], {
        cwd: playgroundDir,
      })

      result.expectFailure().expectStderr(/Generic error occurred/)
    })

    it('should support expectNoStderr()', async () => {
      const result = await runLocalCitty(['greet', 'Charlie'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectNoStderr()
    })
  })

  describe('JSON Assertions', () => {
    it('should support expectJson() with validator', async () => {
      const result = await runLocalCitty(['greet', 'Test', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result.expectSuccess().expectJson((json) => {
        expect(json.message).toBe('Hello, Test!')
        expect(json.count).toBe(1)
        expect(json.verbose).toBe(false)
      })
    })

    it('should support expectJson() without validator', async () => {
      const result = await runLocalCitty(['greet', 'Test', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result.expectSuccess().expectJson()
    })
  })

  describe('Advanced Assertions', () => {
    it('should support expectOutputLength()', async () => {
      const result = await runLocalCitty(['greet', 'Test'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectOutputLength(10, 50)
    })

    it('should support expectExit()', async () => {
      const result = await runLocalCitty(['greet', 'Test'], {
        cwd: playgroundDir,
      })

      result.expectExit(0)
    })

    it('should support expectExit() for failure', async () => {
      const result = await runLocalCitty(['error', 'generic'], {
        cwd: playgroundDir,
      })

      result.expectExit(1)
    })
  })

  describe('Method Chaining', () => {
    it('should support fluent method chaining', async () => {
      const result = await runLocalCitty(['greet', 'Alice', '--count', '2'], {
        cwd: playgroundDir,
      })

      result
        .expectSuccess()
        .expectOutput(/Hello, Alice/)
        .expectOutput(/\(1\/2\)/)
        .expectOutput(/\(2\/2\)/)
        .expectNoStderr()
        .expectOutputLength(20, 100)
    })

    it('should support complex chaining with JSON', async () => {
      const result = await runLocalCitty(['math', 'add', '5', '3', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result
        .expectSuccess()
        .expectJson((json) => {
          expect(json.operation).toBe('add')
          expect(json.a).toBe(5)
          expect(json.b).toBe(3)
          expect(json.result).toBe(8)
        })
        .expectNoStderr()
    })
  })

  describe('Error Messages', () => {
    it('should provide meaningful error messages for failed assertions', async () => {
      const result = await runLocalCitty(['greet', 'Test'], {
        cwd: playgroundDir,
      })

      expect(() => {
        result.expectOutput(/Not Found/)
      }).toThrow('Expected output to match /Not Found/')
    })

    it('should provide meaningful error messages for wrong exit codes', async () => {
      const result = await runLocalCitty(['greet', 'Test'], {
        cwd: playgroundDir,
      })

      expect(() => {
        result.expectFailure()
      }).toThrow('Expected failure (non-zero exit code), got 0')
    })

    it('should provide meaningful error messages for stderr expectations', async () => {
      const result = await runLocalCitty(['greet', 'Test'], {
        cwd: playgroundDir,
      })

      expect(() => {
        result.expectStderr(/Error/)
      }).toThrow('Expected stderr to match /Error/')
    })

    it('should provide meaningful error messages for JSON validation', async () => {
      const result = await runLocalCitty(['greet', 'Test'], {
        cwd: playgroundDir,
      })

      expect(() => {
        result.expectJson()
      }).toThrow('Expected valid JSON output')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty output', async () => {
      const result = await runLocalCitty(['--show-version'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectOutput('1.0.0')
    })

    it('should handle multiline output', async () => {
      const result = await runLocalCitty(['greet', 'Test', '--count', '2'], {
        cwd: playgroundDir,
      })

      result
        .expectSuccess()
        .expectOutput(/Hello, Test! \(1\/2\)/)
        .expectOutput(/Hello, Test! \(2\/2\)/)
    })

    it('should handle verbose output', async () => {
      const result = await runLocalCitty(['greet', 'Test', '--verbose'], {
        cwd: playgroundDir,
      })

      result
        .expectSuccess()
        .expectOutput(/Verbose mode enabled/)
        .expectOutput(/Hello, Test/)
    })
  })

  describe('Timeout Handling', () => {
    it('should handle timeout errors gracefully', async () => {
      const result = await runLocalCitty(['error', 'timeout'], {
        cwd: playgroundDir,
        timeout: 1000,
      })

      result.expectFailure()
    })
  })

  describe('Environment Variables', () => {
    it('should support custom environment variables', async () => {
      const result = await runLocalCitty(['greet', 'Test'], {
        cwd: playgroundDir,
        env: { TEST_MODE: 'true' },
      })

      result.expectSuccess().expectOutput(/Hello, Test/)
    })
  })
})
