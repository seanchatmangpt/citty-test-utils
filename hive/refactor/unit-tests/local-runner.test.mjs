import { describe, it, expect } from 'vitest'
import { runLocalCitty, runLocalCittySafe, wrapWithAssertions } from '../../src/core/runners/local-runner.js'
import { existsSync, writeFileSync, unlinkSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Unit Tests for Local Runner
 * Tests the new runLocalCitty API that executes REAL CLI commands
 *
 * NO MOCKS - Tests actual CLI execution behavior!
 */

describe.concurrent('Local Runner Unit Tests', () => {
  const testDir = join(process.cwd(), '.test-local-runner')
  const testCliPath = join(testDir, 'test-cli.mjs')

  // Setup: Create a real test CLI
  beforeAll(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }

    // Create a simple test CLI that responds to various commands
    const testCliContent = `#!/usr/bin/env node
import { parseArgs } from 'node:util'

const args = process.argv.slice(2)

// Help command
if (args.includes('--help') || args.includes('-h')) {
  console.log('Test CLI v1.0.0')
  console.log('Usage: test-cli [command] [options]')
  console.log('')
  console.log('Commands:')
  console.log('  help     Show help')
  console.log('  version  Show version')
  console.log('')
  console.log('Options:')
  console.log('  --help, -h     Show help')
  console.log('  --version, -v  Show version')
  console.log('  --json         Output as JSON')
  process.exit(0)
}

// Version command
if (args.includes('--version') || args.includes('-v')) {
  if (args.includes('--json')) {
    console.log(JSON.stringify({ version: '1.0.0', name: 'test-cli' }))
  } else {
    console.log('1.0.0')
  }
  process.exit(0)
}

// Echo command (for testing arguments)
if (args.includes('echo')) {
  const echoArgs = args.slice(args.indexOf('echo') + 1)
  console.log(echoArgs.join(' '))
  process.exit(0)
}

// Error command (for testing failures)
if (args.includes('error')) {
  console.error('Test error message')
  process.exit(1)
}

// Slow command (for testing timeouts)
if (args.includes('slow')) {
  const delay = parseInt(args[args.indexOf('slow') + 1] || '100')
  setTimeout(() => {
    console.log('Done')
    process.exit(0)
  }, delay)
  return
}

// Default: show help
console.log('Unknown command. Use --help for usage information.')
process.exit(1)
`

    writeFileSync(testCliPath, testCliContent, { encoding: 'utf8', mode: 0o755 })
  })

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Zod Schema Validation', () => {
    it('should require cliPath or use default', () => {
      // Without cliPath, should use default from env or './src/cli.mjs'
      expect(() => {
        runLocalCitty({ args: ['--help'] })
      }).toThrow() // Throws because default CLI doesn't exist

      // With explicit cliPath
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--help']
      })
      expect(result.success).toBe(true)
    })

    it('should validate cliPath must be string', () => {
      expect(() => {
        runLocalCitty({ cliPath: 123, args: [] })
      }).toThrow()
    })

    it('should validate args must be array', () => {
      expect(() => {
        runLocalCitty({ cliPath: testCliPath, args: '--help' })
      }).toThrow()
    })

    it('should validate timeout must be positive number', () => {
      expect(() => {
        runLocalCitty({ cliPath: testCliPath, args: [], timeout: -100 })
      }).toThrow()

      expect(() => {
        runLocalCitty({ cliPath: testCliPath, args: [], timeout: 0 })
      }).toThrow()
    })

    it('should use defaults for optional fields', () => {
      const result = runLocalCitty({ cliPath: testCliPath })

      expect(result.args).toEqual([]) // Default empty args
      expect(result.cwd).toBeDefined() // Default cwd
      expect(result.exitCode).toBe(0)
    })

    it('should validate env must be object with string values', () => {
      expect(() => {
        runLocalCitty({
          cliPath: testCliPath,
          args: [],
          env: { TEST: 123 } // Number value
        })
      }).toThrow()

      // Valid env
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--help'],
        env: { TEST: 'valid' }
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Real CLI Execution', () => {
    it('should execute --help command successfully', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--help']
      })

      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Test CLI v1.0.0')
      expect(result.stdout).toContain('Usage:')
      expect(result.command).toContain('node')
      expect(result.command).toContain(testCliPath)
      expect(result.durationMs).toBeGreaterThan(0)
    })

    it('should execute --version command', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--version']
      })

      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toBe('1.0.0')
    })

    it('should execute command with JSON output', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--version', '--json']
      })

      expect(result.success).toBe(true)
      const json = JSON.parse(result.stdout)
      expect(json).toEqual({ version: '1.0.0', name: 'test-cli' })
    })

    it('should pass arguments correctly (echo test)', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['echo', 'hello', 'world']
      })

      expect(result.success).toBe(true)
      expect(result.stdout).toBe('hello world')
    })

    it('should handle arguments with spaces', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['echo', 'hello world', 'test phrase']
      })

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('hello world')
    })
  })

  describe('Error Handling', () => {
    it('should throw when CLI file not found (fail-fast)', () => {
      expect(() => {
        runLocalCitty({
          cliPath: '/nonexistent/cli.mjs',
          args: ['--help']
        })
      }).toThrow('CLI file not found')
    })

    it('should provide helpful error message for missing CLI', () => {
      try {
        runLocalCitty({
          cliPath: './missing-cli.mjs',
          args: ['--help']
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error.message).toContain('CLI file not found')
        expect(error.message).toContain('Possible fixes')
        expect(error.message).toContain('Expected path')
        expect(error.message).toContain('Working directory')
      }
    })

    it('should throw when command fails (fail-fast)', () => {
      // The 'error' command in test CLI exits with code 1
      expect(() => {
        runLocalCitty({
          cliPath: testCliPath,
          args: ['error']
        })
      }).toThrow()
    })

    it('should throw on timeout', () => {
      expect(() => {
        runLocalCitty({
          cliPath: testCliPath,
          args: ['slow', '5000'],
          timeout: 100 // Very short timeout
        })
      }).toThrow()
    })
  })

  describe('runLocalCittySafe (Error Handling Variant)', () => {
    it('should return error result instead of throwing', () => {
      const result = runLocalCittySafe({
        cliPath: testCliPath,
        args: ['error']
      })

      expect(result.success).toBe(false)
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Test error message')
    })

    it('should handle missing CLI gracefully', () => {
      const result = runLocalCittySafe({
        cliPath: '/nonexistent/cli.mjs',
        args: ['--help']
      })

      expect(result.success).toBe(false)
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('CLI file not found')
    })

    it('should return success result when command succeeds', () => {
      const result = runLocalCittySafe({
        cliPath: testCliPath,
        args: ['--help']
      })

      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Test CLI')
    })
  })

  describe('wrapWithAssertions', () => {
    it('should provide fluent assertion API', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--help']
      })

      const wrapped = wrapWithAssertions(result)

      // Should chain assertions
      expect(() => {
        wrapped
          .expectSuccess()
          .expectOutput('Test CLI')
          .expectOutput(/Usage:/)
          .expectDuration(5000)
      }).not.toThrow()
    })

    it('should fail on expectSuccess when command fails', () => {
      const result = runLocalCittySafe({
        cliPath: testCliPath,
        args: ['error']
      })

      const wrapped = wrapWithAssertions(result)

      expect(() => {
        wrapped.expectSuccess()
      }).toThrow('Expected success')
    })

    it('should validate expectFailure', () => {
      const successResult = runLocalCitty({
        cliPath: testCliPath,
        args: ['--help']
      })

      expect(() => {
        wrapWithAssertions(successResult).expectFailure()
      }).toThrow('Expected failure')
    })

    it('should validate expectOutput with string', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--help']
      })

      expect(() => {
        wrapWithAssertions(result).expectOutput('NONEXISTENT')
      }).toThrow('Expected output to contain')
    })

    it('should validate expectOutput with regex', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--help']
      })

      expect(() => {
        wrapWithAssertions(result).expectOutput(/NONEXISTENT/)
      }).toThrow('Expected output to match')
    })

    it('should validate expectJson', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--version', '--json']
      })

      const wrapped = wrapWithAssertions(result)

      // Should not throw for valid JSON
      expect(() => {
        wrapped.expectJson(json => {
          expect(json.version).toBe('1.0.0')
        })
      }).not.toThrow()
    })

    it('should throw expectJson for invalid JSON', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--help']
      })

      expect(() => {
        wrapWithAssertions(result).expectJson()
      }).toThrow()
    })

    it('should provide json getter', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--version', '--json']
      })

      const wrapped = wrapWithAssertions(result)
      expect(wrapped.json).toEqual({ version: '1.0.0', name: 'test-cli' })
    })

    it('should return undefined for invalid JSON in json getter', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--help']
      })

      const wrapped = wrapWithAssertions(result)
      expect(wrapped.json).toBeUndefined()
    })
  })

  describe('Concurrent Execution', () => {
    it('should execute multiple commands concurrently', async () => {
      const commands = [
        { args: ['--help'] },
        { args: ['--version'] },
        { args: ['echo', 'test1'] },
        { args: ['echo', 'test2'] },
      ]

      const promises = commands.map(cmd =>
        Promise.resolve(runLocalCitty({ cliPath: testCliPath, ...cmd }))
      )

      const results = await Promise.all(promises)

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.exitCode).toBe(0)
      })

      // Verify outputs
      expect(results[0].stdout).toContain('Test CLI')
      expect(results[1].stdout).toBe('1.0.0')
      expect(results[2].stdout).toBe('test1')
      expect(results[3].stdout).toBe('test2')
    })

    it('should handle concurrent failures', async () => {
      const commands = [
        { args: ['--help'] },
        { args: ['error'] },
        { args: ['--version'] },
      ]

      const promises = commands.map(cmd =>
        Promise.resolve().then(() => {
          try {
            return runLocalCitty({ cliPath: testCliPath, ...cmd })
          } catch (error) {
            return { success: false, error }
          }
        })
      )

      const results = await Promise.all(promises)

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[2].success).toBe(true)
    })
  })

  describe('Environment Variables', () => {
    it('should pass environment variables to CLI', () => {
      // Create a CLI that reads env vars
      const envCliPath = join(testDir, 'env-cli.mjs')
      writeFileSync(envCliPath, `#!/usr/bin/env node
console.log(process.env.TEST_VAR || 'not-set')
`, { encoding: 'utf8', mode: 0o755 })

      const result = runLocalCitty({
        cliPath: envCliPath,
        args: [],
        env: { TEST_VAR: 'test-value' }
      })

      expect(result.stdout).toBe('test-value')

      unlinkSync(envCliPath)
    })

    it('should merge env with process.env', () => {
      const envCliPath = join(testDir, 'env-cli2.mjs')
      writeFileSync(envCliPath, `#!/usr/bin/env node
console.log(process.env.PATH ? 'has-path' : 'no-path')
console.log(process.env.CUSTOM_VAR || 'no-custom')
`, { encoding: 'utf8', mode: 0o755 })

      const result = runLocalCitty({
        cliPath: envCliPath,
        args: [],
        env: { CUSTOM_VAR: 'custom-value' }
      })

      expect(result.stdout).toContain('has-path') // PATH from process.env
      expect(result.stdout).toContain('custom-value') // CUSTOM_VAR from env option

      unlinkSync(envCliPath)
    })
  })

  describe('Working Directory', () => {
    it('should use specified working directory', () => {
      const cwdTest = join(testDir, 'cwd-test')
      mkdirSync(cwdTest, { recursive: true })

      const cwdCliPath = join(cwdTest, 'cwd-cli.mjs')
      writeFileSync(cwdCliPath, `#!/usr/bin/env node
console.log(process.cwd())
`, { encoding: 'utf8', mode: 0o755 })

      const result = runLocalCitty({
        cliPath: cwdCliPath,
        args: [],
        cwd: cwdTest
      })

      expect(result.stdout).toBe(cwdTest)
      expect(result.cwd).toBe(cwdTest)

      rmSync(cwdTest, { recursive: true, force: true })
    })

    it('should resolve relative cliPath from cwd', () => {
      const cwdTest = join(testDir, 'cwd-test2')
      mkdirSync(cwdTest, { recursive: true })

      const relativeCli = join(cwdTest, 'relative-cli.mjs')
      writeFileSync(relativeCli, `#!/usr/bin/env node
console.log('relative')
`, { encoding: 'utf8', mode: 0o755 })

      const result = runLocalCitty({
        cliPath: './relative-cli.mjs',
        args: [],
        cwd: cwdTest
      })

      expect(result.stdout).toBe('relative')

      rmSync(cwdTest, { recursive: true, force: true })
    })
  })

  describe('Performance Tracking', () => {
    it('should track execution duration', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--help']
      })

      expect(result.durationMs).toBeGreaterThan(0)
      expect(result.durationMs).toBeLessThan(5000) // Should be fast
    })

    it('should track slow command duration', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['slow', '200'],
        timeout: 1000
      })

      expect(result.durationMs).toBeGreaterThanOrEqual(200)
      expect(result.durationMs).toBeLessThan(1000)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty args array', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: []
      })

      // Default behavior is to show help for unknown command
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('Unknown command')
    })

    it('should handle very long argument lists', () => {
      const longArgs = Array(100).fill('test')

      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['echo', ...longArgs]
      })

      expect(result.success).toBe(true)
      expect(result.stdout.split(' ')).toHaveLength(100)
    })

    it('should handle special characters in arguments', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['echo', 'hello\nworld', 'test\ttab']
      })

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('hello')
    })

    it('should handle unicode in arguments', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['echo', '😀', '🎉', '测试']
      })

      expect(result.success).toBe(true)
      expect(result.stdout).toContain('😀')
    })

    it('should trim output whitespace', () => {
      const result = runLocalCitty({
        cliPath: testCliPath,
        args: ['--version']
      })

      expect(result.stdout).toBe('1.0.0') // Trimmed
      expect(result.stdout).not.toMatch(/^\s/)
      expect(result.stdout).not.toMatch(/\s$/)
    })
  })
})
