import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock child_process at the module level
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
  execSync: vi.fn(),
  spawn: vi.fn(),
}))

import { runLocalCitty } from '../../src/core/runners/legacy-compatibility.js'
import { execSync, spawn } from 'node:child_process'

describe('Local Runner Unit Tests', () => {
  describe('runLocalCitty', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should execute command successfully', async () => {
      // Mock execSync for vitest environment
      execSync.mockReturnValue('Mock output')

      const result = await runLocalCitty(['--help'], { env: { TEST_CLI: 'true' } })

      expect(result).toBeDefined()
      expect(result.result).toBeDefined()
      expect(result.result.exitCode).toBe(0)
      expect(result.result.stdout).toBe('Mock output')
    })

    it('should handle process errors by returning result with exit code', async () => {
      // Mock execSync to throw error
      const error = new Error('Process exec failed')
      error.status = 1
      error.stdout = ''
      error.stderr = 'Error message'
      execSync.mockImplementation(() => {
        throw error
      })

      const result = await runLocalCitty(['--help'], { env: { TEST_CLI: 'true' } })

      expect(result).toBeDefined()
      expect(result.result.exitCode).toBe(1)
      expect(result.result.stderr).toBe('Error message')
    })

    it('should handle timeout by returning result with exit code', async () => {
      // Mock execSync to throw timeout error
      const error = new Error('Command timed out')
      error.status = 1
      error.stdout = ''
      error.stderr = 'Command timed out'
      execSync.mockImplementation(() => {
        throw error
      })

      const result = await runLocalCitty(['--help'], { timeout: 10, env: { TEST_CLI: 'true' } })

      expect(result).toBeDefined()
      expect(result.result.exitCode).toBe(1)
      expect(result.result.stderr).toBe('Command timed out')
    })

    it('should handle JSON parsing', async () => {
      // Mock execSync to return JSON output
      execSync.mockReturnValue('{"version": "3.0.0"}')

      const result = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })

      // Use expectJson to parse JSON
      result.expectJson()
      expect(result.json).toEqual({ version: '3.0.0' })
    })

    it('should handle invalid JSON gracefully', async () => {
      // Mock execSync to return invalid JSON
      execSync.mockReturnValue('not json')

      const result = await runLocalCitty(['--help'], { env: { TEST_CLI: 'true' } })

      // expectJson should throw for invalid JSON
      expect(() => result.expectJson()).toThrow('Expected valid JSON output')
    })

    it('should pass environment variables', async () => {
      // Mock execSync
      execSync.mockReturnValue('Mock output')

      await runLocalCitty(['--help'], { env: { TEST_VAR: 'test_value', TEST_CLI: 'true' } })

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('node test-cli.mjs --help'),
        expect.objectContaining({
          env: expect.objectContaining({
            TEST_VAR: 'test_value',
            TEST_CLI: 'true',
          }),
        })
      )
    })
  })
})
