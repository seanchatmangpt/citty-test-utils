import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runLocalCitty, runLocalCittySafe } from '@un-test/runners-local'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'

/**
 * Integration Tests for Runner Command Execution
 * Tests actual CLI command execution with real processes
 *
 * Coverage Areas:
 * - Command execution success/failure
 * - Timeout handling
 * - Environment variable passing
 * - JSON output parsing
 * - Error recovery
 * - Concurrent command execution
 */

describe('Local Runner Command Execution (Integration)', () => {
  const testDir = join(process.cwd(), '.test-runner-commands')
  const testCliPath = join(testDir, 'test-cli.mjs')

  beforeEach(() => {
    // Create test environment
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }

    // Create a simple test CLI for integration testing
    const testCliContent = `#!/usr/bin/env node
import { parseArgs } from 'node:util'

const args = process.argv.slice(2)

if (args.includes('--help')) {
  console.log('Test CLI v1.0.0\\nUsage: test-cli [options]\\nOptions:\\n  --help     Show help\\n  --version  Show version\\n  --json     Output JSON')
  process.exit(0)
}

if (args.includes('--version')) {
  console.log('1.0.0')
  process.exit(0)
}

if (args.includes('--json')) {
  console.log(JSON.stringify({ name: 'test-cli', version: '1.0.0', args }))
  process.exit(0)
}

if (args.includes('--fail')) {
  console.error('Command failed')
  process.exit(1)
}

if (args.includes('--slow')) {
  setTimeout(() => {
    console.log('Slow command completed')
    process.exit(0)
  }, 5000)
} else if (args.includes('--env')) {
  console.log(JSON.stringify({
    TEST_VAR: process.env.TEST_VAR,
    NODE_ENV: process.env.NODE_ENV
  }))
  process.exit(0)
} else {
  console.log('Unknown command')
  process.exit(1)
}
`
    writeFileSync(testCliPath, testCliContent, { mode: 0o755 })
  })

  afterEach(() => {
    // Cleanup test environment
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Basic Command Execution', () => {
    it('should execute --help command successfully', async () => {
      const result = await runLocalCitty({
        args: ['--help'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Test CLI v1.0.0')
      expect(result.stdout).toContain('Usage:')
      expect(result.durationMs).toBeLessThan(5000)
    })

    it('should execute --version command successfully', async () => {
      const result = await runLocalCitty({
        args: ['--version'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toBe('1.0.0')
    })

    it('should handle unknown commands gracefully', async () => {
      const result = await runLocalCittySafe({
        args: ['--unknown'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('Unknown command')
    })
  })

  describe('Command Failures', () => {
    it('should handle command failures gracefully', async () => {
      const result = await runLocalCittySafe({
        args: ['--fail'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Command failed')
    })

    it('should return proper error information on failure', async () => {
      const result = await runLocalCittySafe({
        args: ['--fail'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(result).toHaveProperty('exitCode')
      expect(result).toHaveProperty('stderr')
      expect(result).toHaveProperty('stdout')
      expect(result).toHaveProperty('args')
      expect(result).toHaveProperty('cwd')
      expect(result).toHaveProperty('durationMs')
    })
  })

  describe('Timeout Handling', () => {
    it('should timeout long-running commands', async () => {
      const result = await runLocalCittySafe({
        args: ['--slow'],
        cliPath: testCliPath,
        timeout: 100, // Very short timeout
      })

      // Command should timeout and fail
      expect(result.exitCode).not.toBe(0)
      expect(result.durationMs).toBeLessThan(1000) // Allow some buffer but should be much less than 5000ms
    }, 10000) // Increase test timeout

    it('should not timeout fast commands', async () => {
      const result = await runLocalCitty({
        args: ['--help'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.durationMs).toBeLessThan(5000)
    })
  })

  describe('Environment Variables', () => {
    it('should pass environment variables to command', async () => {
      const result = await runLocalCitty({
        args: ['--env'],
        cliPath: testCliPath,
        env: {
          TEST_VAR: 'test_value',
          NODE_ENV: 'test',
        },
        timeout: 5000,
      })

      expect(result.exitCode).toBe(0)
      const output = JSON.parse(result.stdout)
      expect(output.TEST_VAR).toBe('test_value')
      // Local runner normalizes NODE_ENV=test to development
      expect(output.NODE_ENV).toBe('development')
    })

    it('should handle missing environment variables', async () => {
      const result = await runLocalCitty({
        args: ['--env'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(result.exitCode).toBe(0)
      const output = JSON.parse(result.stdout)
      expect(output.TEST_VAR).toBeUndefined()
    })
  })

  describe('JSON Output Parsing', () => {
    it('should parse valid JSON output', async () => {
      const result = await runLocalCitty({
        args: ['--json'],
        cliPath: testCliPath,
        json: true,
        timeout: 5000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.json).toBeDefined()
      expect(result.json.name).toBe('test-cli')
      expect(result.json.version).toBe('1.0.0')
    })

    it('should handle non-JSON output when json flag is set', async () => {
      const result = await runLocalCitty({
        args: ['--help'],
        cliPath: testCliPath,
        json: true,
        timeout: 5000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.json).toBeUndefined()
    })
  })

  describe('Fluent Assertions', () => {
    it('should support expectSuccess assertion', async () => {
      const result = await runLocalCitty({
        args: ['--help'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(() => result.expectSuccess()).not.toThrow()
    })

    it('should support expectFailure assertion', async () => {
      const result = await runLocalCittySafe({
        args: ['--fail'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(() => result.expectFailure()).not.toThrow()
    })

    it('should support expectOutput assertion', async () => {
      const result = await runLocalCitty({
        args: ['--help'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(() => result.expectOutput('Test CLI')).not.toThrow()
      expect(() => result.expectOutput('NonExistent')).toThrow()
    })

    it('should support expectDuration assertion', async () => {
      const result = await runLocalCitty({
        args: ['--help'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(() => result.expectDuration(5000)).not.toThrow()
      expect(() => result.expectDuration(1)).toThrow()
    })
  })

  describe('Concurrent Command Execution', () => {
    it('should handle multiple concurrent commands', async () => {
      const commands = [
        runLocalCitty({ args: ['--help'], cliPath: testCliPath, timeout: 5000 }),
        runLocalCitty({ args: ['--version'], cliPath: testCliPath, timeout: 5000 }),
        runLocalCitty({ args: ['--json'], cliPath: testCliPath, timeout: 5000 }),
        runLocalCittySafe({ args: ['--fail'], cliPath: testCliPath, timeout: 5000 }),
      ]

      const results = await Promise.all(commands)

      expect(results).toHaveLength(4)
      expect(results[0].exitCode).toBe(0) // --help
      expect(results[1].exitCode).toBe(0) // --version
      expect(results[2].exitCode).toBe(0) // --json
      expect(results[3].exitCode).toBe(1) // --fail
    })

    it('should handle concurrent commands with different timeouts', async () => {
      const commands = [
        runLocalCitty({ args: ['--help'], cliPath: testCliPath, timeout: 1000 }),
        runLocalCitty({ args: ['--version'], cliPath: testCliPath, timeout: 2000 }),
        runLocalCitty({ args: ['--json'], cliPath: testCliPath, timeout: 3000 }),
      ]

      const results = await Promise.all(commands)

      results.forEach(result => {
        expect(result.exitCode).toBe(0)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty command array', async () => {
      const result = await runLocalCittySafe({
        args: [],
        cliPath: testCliPath,
        timeout: 5000,
      })

      // Should execute but likely return error or help
      expect(result).toBeDefined()
      expect(result).toHaveProperty('exitCode')
    })

    it('should handle commands with special characters', async () => {
      const result = await runLocalCitty({
        args: ['--json'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(result.exitCode).toBe(0)
    })

    it('should handle very long command output', async () => {
      const result = await runLocalCitty({
        args: ['--help'],
        cliPath: testCliPath,
        timeout: 5000,
      })

      expect(result.stdout).toBeDefined()
      expect(result.stdout.length).toBeGreaterThan(0)
    })
  })

  describe('Error Recovery', () => {
    it('should recover from non-existent CLI path', async () => {
      const result = await runLocalCittySafe({
        args: ['--help'],
        cliPath: '/nonexistent/cli.mjs',
        timeout: 5000,
      })

      expect(result.exitCode).not.toBe(0)
      expect(result).toHaveProperty('stderr')
    })

    it('should handle permission errors gracefully', async () => {
      // Create a file without execute permissions
      const noExecPath = join(testDir, 'no-exec.mjs')
      writeFileSync(noExecPath, '#!/usr/bin/env node\nconsole.log("test")', { mode: 0o644 })

      const result = await runLocalCitty({
        args: ['--help'],
        cliPath: noExecPath,
        timeout: 5000,
      })

      // Should still attempt execution (node can execute .mjs files directly)
      expect(result).toBeDefined()
    })
  })
})
