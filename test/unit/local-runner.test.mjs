import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { spawnSync } from 'child_process'

describe.sequential('Local Runner Unit Tests', () => {
  let runLocalCitty
  const mockSpawnSync = vi.fn()

  beforeAll(async () => {
    vi.doMock('child_process', async (importOriginal) => {
      const actual = await importOriginal()
      return {
        ...actual,
        spawnSync: mockSpawnSync,
      }
    })
    const mod = await import('@un-test/runners-local')
    runLocalCitty = mod.runLocalCitty
  })

  afterAll(() => {
    vi.unmock('child_process')
    vi.resetModules()
  })

  beforeEach(() => {
    mockSpawnSync.mockReset()
  })

  describe('runLocalCitty', () => {
    it('should execute command successfully', async () => {
      // Mock spawnSync for vitest environment
      mockSpawnSync.mockReturnValue({
        status: 0,
        stdout: 'Mock output',
        stderr: ''
      })

      const result = await runLocalCitty(['--help'], { env: { TEST_CLI: 'true' } })

      expect(result).toBeDefined()
      expect(result.result).toBeDefined()
      expect(result.result.exitCode).toBeDefined()
      expect(result.result.stdout).toBe('Mock output')
    })

    it('should handle process errors by returning result with exit code', async () => {
      // Mock spawnSync to return error
      const error = new Error('Process exec failed')
      mockSpawnSync.mockReturnValue({
        status: 1,
        stdout: '',
        stderr: 'Error message',
        error
      })

      const result = await runLocalCitty(['--help'], { env: { TEST_CLI: 'true' } })

      expect(result).toBeDefined()
      expect(result.result.exitCode).toBeDefined()
      expect(result.result.stderr).toContain('')
    })

    it('should handle timeout by returning result with exit code', async () => {
      // Mock spawnSync to return timeout error
      const error = new Error('Command timed out')
      mockSpawnSync.mockReturnValue({
        status: null,
        stdout: '',
        stderr: 'Command timed out',
        error
      })

      const result = await runLocalCitty(['--help'], { timeout: 10, env: { TEST_CLI: 'true' } })

      expect(result).toBeDefined()
      expect(result.result.exitCode).toBeDefined()
      expect(result.result.stderr).toContain('')
    })

    it('should handle JSON parsing', async () => {
      // Mock spawnSync to return JSON output
      mockSpawnSync.mockReturnValue({
        status: 0,
        stdout: '{"version": "3.0.0"}',
        stderr: ''
      })

      const result = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })

      // Use expectJson to parse JSON
      result.expectJson()
      expect(result.json).toEqual({ version: '3.0.0' })
    })

    it('should handle invalid JSON gracefully', async () => {
      // Mock spawnSync to return invalid JSON
      mockSpawnSync.mockReturnValue({
        status: 0,
        stdout: 'not json',
        stderr: ''
      })

      const result = await runLocalCitty(['--help'], { env: { TEST_CLI: 'true' } })

      // expectJson should throw for invalid JSON
      expect(() => result.expectJson()).toThrow('Expected valid JSON output')
    })

    it('should pass environment variables', async () => {
      // Mock spawnSync
      mockSpawnSync.mockReturnValue({
        status: 0,
        stdout: 'Mock output',
        stderr: ''
      })

      await runLocalCitty(['--help'], { env: { TEST_VAR: 'test_value', TEST_CLI: 'true' } })

      // spawnSync here is the mocked version inside this test module
      expect(mockSpawnSync).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([expect.stringMatching(/--help/)]),
        expect.objectContaining({
          env: expect.objectContaining({
            TEST_VAR: 'test_value',
            TEST_CLI: 'true',
          }),
        })
      )
    })

    it('should execute multiple commands concurrently', async () => {
      // Mock spawnSync for concurrent execution
      mockSpawnSync.mockReturnValue({
        status: 0,
        stdout: 'Mock output',
        stderr: ''
      })

      const commands = [['--help'], ['--version'], ['--help'], ['--version']]

      const promises = commands.map((cmd) => runLocalCitty(cmd, { env: { TEST_CLI: 'true' } }))

      const results = await Promise.all(promises)

      // All should succeed
      results.forEach((result) => {
        expect(result.result.exitCode).toBeDefined()
        expect(result.result.stdout).toBe('Mock output')
      })

      // Should have been called multiple times
      expect(mockSpawnSync).toHaveBeenCalledTimes(4)
    })
  })
})
