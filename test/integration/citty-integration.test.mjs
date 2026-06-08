// tests/integration/citty-integration.test.mjs
// Integration tests using the new noun-verb CLI structure with maximum concurrency

import { describe, it, expect } from 'vitest'
import { runLocalCitty, runCitty } from 'un-test-utils'
import { getSharedCleanroom, isCleanroomAvailable } from '../setup/shared-cleanroom.mjs'

describe.concurrent('Citty Integration Tests', () => {
  describe.concurrent('Local Runner Integration', () => {
    it('should test basic citty CLI commands locally', async () => {
      // Test basic help of the main CLI
      const helpResult = await runLocalCitty({
        args: ['--show-help'],
        env: { TEST_CLI: 'true' },
      })

      expect(helpResult.exitCode).toBe(0)
      expect(helpResult.stdout).toContain('ctu')
      expect(helpResult.stdout).toContain('USAGE')
    })

    it('should test version command', async () => {
      // Test playground version
      const versionResult = await runLocalCitty({
        args: ['--show-version'],
      })

      expect(versionResult.exitCode).toBe(0)
      expect(versionResult.stdout).toMatch(/1\.0\.0/)
    })

    it('should test info command', async () => {
      // Test playground info
      const result = await runLocalCitty({
        args: ['info'],
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Version: 1.0.0')
    })

    it('should test math add command', async () => {
      // Test playground math add (replaces gen project)
      const result = await runLocalCitty({
        args: ['math', 'add', '1', '2'],
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('1 + 2 = 3')
    })

    it('should test runner execute command', async () => {
      // Test main CLI runner execute
      const result = await runLocalCitty({
        args: ['runner', 'execute', 'node --version'],
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('node --version')
      expect(result.stdout).toContain('Success')
    })

    it('should test JSON output', async () => {
      // Test playground JSON output
      const result = await runLocalCitty({
        args: ['info', '--json'],
      })

      expect(result.exitCode).toBe(0)
      expect(result.json).toBeDefined()
      expect(result.json.version).toBe('1.0.0')
      expect(result.json.name).toBe('citty-test-utils-playground')
    })

    it('should test invalid arguments', async () => {
      const result = await runLocalCitty({
        args: ['--invalid-flag'],
      })

      // Citty doesn't fail on unknown flags, it shows help
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('USAGE')
      expect(result.stdout).toContain('playground greet|math|error|info')
    })

    it('should execute multiple local commands concurrently', async () => {
      const commands = [
        { args: ['--show-help'], expected: 'USAGE', env: { TEST_CLI: 'true' } },
        { args: ['--show-version'], expected: '1.0.0' },
        { args: ['info'], expected: 'Version: 1.0.0' },
        {
          args: ['math', 'add', '5', '5'],
          expected: '5 + 5 = 10',
        },
      ]

      const promises = commands.map((cmd) =>
        runLocalCitty({ args: cmd.args, env: cmd.env || {} })
      )

      const results = await Promise.all(promises)

      results.forEach((result, i) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain(commands[i].expected)
      })
    })
  })

  describe.concurrent('Cleanroom Runner Integration', () => {
    it('should test basic citty CLI commands in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const helpResult = await runCitty(['--show-help'], {
        cwd: '/app',
        env: { TEST_CLI: 'true' },
      })

      expect(helpResult.exitCode).toBe(0)
      expect(helpResult.stdout).toContain('ctu')
      expect(helpResult.stdout).toContain('USAGE')
    })

    it('should test version command in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const versionResult = await runCitty(['--show-version'], {
        cwd: '/app',
        env: {}, // Use playground
      })

      expect(versionResult.exitCode).toBe(0)
      expect(versionResult.stdout).toMatch(/1\.0\.0/)
    })

    it('should test info command in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(['info'], {
        cwd: '/app',
        env: {}, // Use playground
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Version: 1.0.0')
    })

    it('should test math add command in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(
        ['math', 'add', '10', '20'],
        {
          cwd: '/app',
          env: {}, // Use playground
        }
      )

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('10 + 20 = 30')
    })

    it('should execute multiple cleanroom commands concurrently', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const commands = [
        { args: ['--show-help'], expected: 'USAGE', env: { TEST_CLI: 'true' } },
        { args: ['--show-version'], expected: '1.0.0', env: {} },
        { args: ['info'], expected: 'Version: 1.0.0', env: {} },
        {
          args: ['math', 'add', '100', '200'],
          expected: '100 + 200 = 300',
          env: {}
        },
      ]

      const promises = commands.map((cmd) => runCitty(cmd.args, { cwd: '/app', env: cmd.env }))

      const results = await Promise.all(promises)

      results.forEach((result, i) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain(commands[i].expected)
      })
    })
  })

  describe.concurrent('Fluent Assertions Integration', () => {
    it('should work with local runner assertions', async () => {
      const result = await runLocalCitty({
        args: ['info'],
        env: {}, // Use playground
      })

      result
        .expectSuccess()
        .expectOutput(/Version: 1\.0\.0/)
        .expectNoStderr()
    })

    it('should work with cleanroom runner assertions', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(['info'], {
        cwd: '/app',
        env: {}, // Use playground
      })

      result
        .expectSuccess()
        .expectOutput(/Version: 1\.0\.0/)
        .expectNoStderr()
    })

    it('should handle JSON assertions', async () => {
      const result = await runLocalCitty({
        args: ['info', '--json'],
      })

      result.expectSuccess().expectJson((data) => {
        if (data.version !== '1.0.0') {
          throw new Error(`Expected version '1.0.0', got '${data.version}'`)
        }
        if (data.name !== 'citty-test-utils-playground') {
          throw new Error(`Expected name 'citty-test-utils-playground', got '${data.name}'`)
        }
      })
    })

    it('should handle multiple assertion types concurrently', async () => {
      const assertions = [
        runLocalCitty({ args: ['--show-help'], env: { TEST_CLI: 'true' } }).then((r) =>
          r.expectSuccess().expectOutput('USAGE')
        ),
        runLocalCitty({ args: ['--show-version'], env: {} }).then(
          (r) => r.expectSuccess().expectOutput('1.0.0')
        ),
        runLocalCitty({ args: ['info'], env: {} }).then(
          (r) => r.expectSuccess().expectOutput('Version: 1.0.0')
        ),
      ]

      await Promise.all(assertions)
    })
  })

  describe.concurrent('Error Handling Integration', () => {
    it('should handle invalid commands gracefully', async () => {
      const result = await runLocalCitty(['invalid', 'command'], {
        cwd: process.cwd(),
        env: { TEST_CLI: 'true' },
      })

      // Citty shows help for invalid commands but exits with code 1
      expect(result.exitCode).toBe(1)
      const output = result.stdout + result.stderr
      expect(output).toContain('Unknown command')
    })

    it('should handle invalid commands in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(['invalid', 'command'], {
        cwd: '/app',
        env: { TEST_CLI: 'true' },
      })

      // Citty shows help for invalid commands but exits with code 1
      expect(result.exitCode).toBe(1)
      const output = result.stdout + result.stderr
      expect(output).toContain('Unknown command')
    })

    it('should handle multiple error scenarios concurrently', async () => {
      const errorCommands = [
        ['invalid', 'command'],
        ['nonexistent', 'subcommand'],
      ]

      const promises = errorCommands.map((cmd) =>
        runLocalCitty({ args: cmd, env: { TEST_CLI: 'true' }, failFast: false })
      )

      const results = await Promise.all(promises)

      results.forEach((result) => {
        expect(result.exitCode).not.toBe(0)
      })
    })
  })
})
