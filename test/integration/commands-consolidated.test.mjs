#!/usr/bin/env node
// test/integration/commands-consolidated.test.mjs
// Consolidated command tests - replaces multiple command-specific files

import { describe, it, expect } from 'vitest'
import { runLocalCitty, runCitty } from '../../index.js'
import { getSharedCleanroom, isCleanroomAvailable } from '../setup/shared-cleanroom.mjs'

describe.concurrent('Commands Consolidated Tests', () => {
  let testTimestamp = Date.now()

  describe.concurrent('Info Commands', () => {
    it('should test info version command locally', async () => {
      const result = await runLocalCitty(['info', 'version'], {
        cwd: process.cwd(),
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Version: 0.4.0')
    })

    it('should test info version command in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(['info', 'version'], {
        cwd: '/app',
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Version: 0.4.0')
    })

    it('should test JSON output', async () => {
      const result = await runLocalCitty(['info', 'version', '--json'], {
        cwd: process.cwd(),
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.json).toBeDefined()
      expect(result.json.version).toBe('0.4.0')
      expect(result.json.name).toBe('ctu')
    })
  })

  describe.concurrent('Gen Commands', () => {
    it('should test gen project command locally', async () => {
      const result = await runLocalCitty(
        ['gen', 'project', `test-project-${testTimestamp}`, '--description', 'Test project'],
        {
          cwd: process.cwd(),
          env: {},
        }
      )

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project')
    })

    it('should test gen project command in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(
        [
          'gen',
          'project',
          `cleanroom-test-${testTimestamp}`,
          '--description',
          'Cleanroom test project',
        ],
        {
          cwd: '/app',
          env: {},
        }
      )

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project')
    })

    it('should test gen test command', async () => {
      const result = await runLocalCitty(['gen', 'test', `test-${testTimestamp}`], {
        cwd: process.cwd(),
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated test template')
    })

    it('should test gen scenario command', async () => {
      const result = await runLocalCitty(['gen', 'scenario', `scenario-${testTimestamp}`], {
        cwd: process.cwd(),
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated scenario template')
    })

    it('should test gen cli command', async () => {
      const result = await runLocalCitty(['gen', 'cli', `cli-${testTimestamp}`], {
        cwd: process.cwd(),
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated CLI template')
    })
  })

  describe.concurrent('Runner Commands', () => {
    it('should test runner execute command locally', async () => {
      const result = await runLocalCitty(['runner', 'execute', '"node --version"'], {
        cwd: process.cwd(),
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Command: node --version')
      expect(result.stdout).toContain('Environment: local')
      expect(result.stdout).toContain('Success: ✅')
    })

    it('should test runner execute command in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(['runner', 'execute', '"node --version"'], {
        cwd: '/app',
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Command: node --version')
      expect(result.stdout).toContain('Environment: cleanroom')
      expect(result.stdout).toContain('Success: ✅')
    })
  })

  describe.concurrent('Test Commands', () => {
    it('should test test command locally', async () => {
      const result = await runLocalCitty(['test'], {
        cwd: process.cwd(),
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Test Command')
    })

    it('should test test command in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(['test'], {
        cwd: '/app',
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Test Command')
    })
  })

  describe.concurrent('Error Handling', () => {
    it('should handle invalid commands gracefully', async () => {
      const result = await runLocalCitty(['invalid', 'command'], {
        cwd: process.cwd(),
        env: { TEST_CLI: 'true' },
      })

      // Citty shows help for invalid commands but exits with code 0
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('USAGE')
      expect(result.stdout).toContain('ctu')
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

      // Citty shows help for invalid commands but exits with code 0
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('USAGE')
      expect(result.stdout).toContain('ctu')
    })
  })
})
