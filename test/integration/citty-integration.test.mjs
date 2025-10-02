// tests/integration/citty-integration.test.mjs
// Integration tests using the new noun-verb CLI structure with maximum concurrency

import { describe, it, expect } from 'vitest'
import { runLocalCitty, runCitty } from '../../index.js'
import { getSharedCleanroom, isCleanroomAvailable } from '../setup/shared-cleanroom.mjs'

describe.concurrent('Citty Integration Tests', () => {
  describe.concurrent('Local Runner Integration', () => {
    it('should test basic citty CLI commands locally', async () => {
      // Test basic help
      const helpResult = await runLocalCitty({
        args: ['--help'],
        env: { TEST_CLI: 'true' },
      })

      expect(helpResult.exitCode).toBe(0)
      expect(helpResult.stdout).toContain('ctu')
      expect(helpResult.stdout).toContain('USAGE')
    })

    it('should test version command', async () => {
      const versionResult = await runLocalCitty({
        args: ['--show-version'],
      })

      expect(versionResult.exitCode).toBe(0)
      expect(versionResult.stdout).toMatch(/0\.5\.0/)
    })

    it('should test info version command', async () => {
      const result = await runLocalCitty({
        args: ['info', 'version'],
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Version: 0.5.0')
    })

    it('should test gen project command', async () => {
      const result = await runLocalCitty({
        args: ['gen', 'project', 'test-project', '--description', 'Test project'],
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project: test-project')
    })

    it('should test runner execute command', async () => {
      const result = await runLocalCitty({
        args: ['runner', 'execute', 'node --version'],
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Command: node --version')
      expect(result.stdout).toContain('Environment: local')
      expect(result.stdout).toContain('Success: ✅')
    })

    it('should test JSON output', async () => {
      const result = await runLocalCitty({
        args: ['info', 'version', '--json'],
      })

      expect(result.exitCode).toBe(0)
      expect(result.json).toBeDefined()
      expect(result.json.version).toBe('0.5.0')
      expect(result.json.name).toBe('ctu')
    })

    it('should test invalid arguments', async () => {
      const result = await runLocalCitty({
        args: ['--invalid-flag'],
      })

      // Citty doesn't fail on unknown flags, it shows help
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('USAGE')
      expect(result.stdout).toContain('ctu <noun> <verb>')
    })

    it('should execute multiple local commands concurrently', async () => {
      const commands = [
        { args: ['--help'], expected: 'USAGE' },
        { args: ['--show-version'], expected: '0.5.0' },
        { args: ['info', 'version'], expected: 'Version: 0.5.0' },
        {
          args: ['gen', 'project', 'concurrent-test', '--description', 'Concurrent test'],
          expected: 'Generated complete project',
        },
      ]

      const promises = commands.map((cmd) =>
        runLocalCitty({ args: cmd.args, env: { TEST_CLI: 'true' } })
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
      const helpResult = await runCitty(['--help'], {
        cwd: '/app',
        env: {}, // Use main CLI, not test CLI
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
        env: {}, // Use main CLI, not test CLI
      })

      expect(versionResult.exitCode).toBe(0)
      expect(versionResult.stdout).toMatch(/0\.5\.0/)
    })

    it('should test info version command in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(['info', 'version'], {
        cwd: '/app',
        env: {}, // Use main CLI, not test CLI
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Version: 0.5.0')
    })

    it('should test gen project command in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(
        ['gen', 'project', 'cleanroom-test', '--description', 'Cleanroom test project'],
        {
          cwd: '/app',
          env: {}, // Use main CLI, not test CLI
        }
      )

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project: cleanroom-test')
    })

    it('should execute multiple cleanroom commands concurrently', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const commands = [
        { args: ['--help'], expected: 'USAGE' },
        { args: ['--show-version'], expected: '0.5.0' },
        { args: ['info', 'version'], expected: 'Version: 0.5.0' },
        {
          args: ['gen', 'project', 'concurrent-cleanroom-test'],
          expected: 'Generated complete project',
        },
      ]

      const promises = commands.map((cmd) => runCitty(cmd.args, { cwd: '/app', env: {} }))

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
        args: ['info', 'version'],
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput(/Version: 0\.5\.0/)
        .expectNoStderr()
    })

    it('should work with cleanroom runner assertions', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(['info', 'version'], {
        cwd: '/app',
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput(/Version: 0\.5\.0/)
        .expectNoStderr()
    })

    it('should handle JSON assertions', async () => {
      const result = await runLocalCitty({
        args: ['info', 'version', '--json'],
      })

      result.expectSuccess().expectJson((data) => {
        if (data.version !== '0.5.0') {
          throw new Error(`Expected version '0.5.0', got '${data.version}'`)
        }
        if (data.name !== 'ctu') {
          throw new Error(`Expected name 'ctu', got '${data.name}'`)
        }
      })
    })

    it('should handle multiple assertion types concurrently', async () => {
      const assertions = [
        runLocalCitty({ args: ['--help'], env: { TEST_CLI: 'true' } }).then((r) =>
          r.expectSuccess().expectOutput('USAGE')
        ),
        runLocalCitty({ args: ['--show-version'], env: { TEST_CLI: 'true' } }).then(
          (r) => r.expectSuccess().expectOutput('0.5.0')
        ),
        runLocalCitty({ args: ['info', 'version'], env: { TEST_CLI: 'true' } }).then(
          (r) => r.expectSuccess().expectOutput('Version: 0.5.0')
        ),
      ]

      await Promise.all(assertions)
    })
  })

  describe.concurrent('Error Handling Integration', () => {
    it('should handle invalid commands gracefully', async () => {
      const result = await runLocalCitty({
        args: ['invalid', 'command'],
        env: { TEST_CLI: 'true' },
      })

      // Citty shows help for invalid commands but exits with code 1
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('USAGE')
      expect(result.stdout).toContain('ctu')
      expect(result.stderr).toContain('Unknown command')
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
      expect(result.stdout).toContain('USAGE')
      expect(result.stdout).toContain('ctu')
      expect(result.stderr).toContain('Unknown command')
    })

    it('should handle multiple error scenarios concurrently', async () => {
      const errorCommands = [
        ['invalid', 'command'],
        ['nonexistent', 'subcommand'],
      ]

      const promises = errorCommands.map((cmd) =>
        runLocalCitty({ args: cmd, env: { TEST_CLI: 'true' } })
      )

      const results = await Promise.all(promises)

      results.forEach((result) => {
        expect(result.exitCode).not.toBe(0)
      })
    })
  })
})
