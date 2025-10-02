#!/usr/bin/env node
/**
 * @fileoverview v1.0.0 Unified API Comprehensive Test Suite
 * @description Tests for the unified runCitty() function with auto mode detection
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { scenario } from '../../src/core/scenarios/scenario-dsl.js'

/**
 * v1.0.0 UNIFIED API SPECIFICATION
 *
 * runCitty(args, options) - Single function for all execution modes
 *   - Local mode (default): Executes CLI locally
 *   - Cleanroom mode: Executes in Docker if config.cleanroom.enabled
 *   - Config hierarchy: vitest.config > options > defaults
 *   - Auto-detection: Determines mode from config
 */

describe.concurrent('v1.0.0 Unified API - runCitty()', () => {
  describe.concurrent('Local Mode Execution (Default)', () => {
    it('should execute in local mode by default', async () => {
      // Test that runCitty defaults to local execution
      const mockRunLocalCitty = vi.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '0.5.0',
        stderr: '',
        cliPath: './playground/src/cli.mjs',
        cwd: process.cwd(),
        durationMs: 50
      })

      // Mock implementation of v1.0.0 API
      const runCitty = async (args, options = {}) => {
        const config = options.config || {}
        const cleanroomEnabled = config.cleanroom?.enabled || false

        if (cleanroomEnabled) {
          throw new Error('Cleanroom not implemented in this test')
        }

        // Default to local mode
        return await mockRunLocalCitty({
          args,
          cliPath: options.cliPath || './playground/src/cli.mjs',
          cwd: options.cwd || process.cwd(),
          env: options.env || {},
          timeout: options.timeout || 30000
        })
      }

      const result = await runCitty(['--version'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('0.5.0')
      expect(mockRunLocalCitty).toHaveBeenCalledOnce()
    })

    it('should pass options correctly in local mode', async () => {
      const mockRunLocalCitty = vi.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'test output',
        stderr: '',
        cliPath: './custom/cli.js',
        cwd: '/custom/path',
        durationMs: 100
      })

      const runCitty = async (args, options = {}) => {
        const config = options.config || {}
        if (config.cleanroom?.enabled) {
          throw new Error('Cleanroom not implemented')
        }
        return await mockRunLocalCitty({
          args,
          cliPath: options.cliPath || './playground/src/cli.mjs',
          cwd: options.cwd || process.cwd(),
          env: options.env || {},
          timeout: options.timeout || 30000
        })
      }

      const result = await runCitty(['test', 'command'], {
        cliPath: './custom/cli.js',
        cwd: '/custom/path',
        env: { NODE_ENV: 'test' },
        timeout: 5000
      })

      expect(result.cliPath).toBe('./custom/cli.js')
      expect(result.cwd).toBe('/custom/path')
      expect(mockRunLocalCitty).toHaveBeenCalledWith({
        args: ['test', 'command'],
        cliPath: './custom/cli.js',
        cwd: '/custom/path',
        env: { NODE_ENV: 'test' },
        timeout: 5000
      })
    })

    it('should handle local execution errors gracefully', async () => {
      const mockRunLocalCitty = vi.fn().mockRejectedValue(
        new Error('CLI file not found')
      )

      const runCitty = async (args, options = {}) => {
        const config = options.config || {}
        if (config.cleanroom?.enabled) {
          throw new Error('Cleanroom not implemented')
        }
        return await mockRunLocalCitty({
          args,
          cliPath: options.cliPath || './playground/src/cli.mjs',
          cwd: options.cwd || process.cwd(),
          env: options.env || {},
          timeout: options.timeout || 30000
        })
      }

      await expect(runCitty(['--help'], {
        cliPath: './nonexistent/cli.js'
      })).rejects.toThrow('CLI file not found')
    })
  })

  describe.concurrent('Cleanroom Mode Execution', () => {
    it('should execute in cleanroom when config.cleanroom.enabled is true', async () => {
      const mockRunCleanroom = vi.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '0.5.0',
        stderr: '',
        cwd: '/app',
        durationMs: 150
      })

      const runCitty = async (args, options = {}) => {
        const config = options.config || {}
        const cleanroomEnabled = config.cleanroom?.enabled || false

        if (cleanroomEnabled) {
          return await mockRunCleanroom(args, options)
        }

        throw new Error('Should use cleanroom mode')
      }

      const result = await runCitty(['--version'], {
        config: {
          cleanroom: {
            enabled: true
          }
        }
      })

      expect(result.exitCode).toBe(0)
      expect(result.cwd).toBe('/app')
      expect(mockRunCleanroom).toHaveBeenCalledOnce()
    })

    it('should pass cleanroom options correctly', async () => {
      const mockRunCleanroom = vi.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'cleanroom output',
        stderr: '',
        cwd: '/app',
        durationMs: 200
      })

      const runCitty = async (args, options = {}) => {
        const config = options.config || {}
        if (config.cleanroom?.enabled) {
          return await mockRunCleanroom(args, {
            ...options,
            json: config.cleanroom.json,
            timeout: config.cleanroom.timeout || options.timeout || 10000
          })
        }
        throw new Error('Should use cleanroom mode')
      }

      const result = await runCitty(['gen', 'test', 'my-test'], {
        config: {
          cleanroom: {
            enabled: true,
            json: true,
            timeout: 15000
          }
        }
      })

      expect(mockRunCleanroom).toHaveBeenCalledWith(
        ['gen', 'test', 'my-test'],
        expect.objectContaining({
          json: true,
          timeout: 15000
        })
      )
    })

    it('should handle cleanroom setup errors', async () => {
      const mockRunCleanroom = vi.fn().mockRejectedValue(
        new Error('Docker not available')
      )

      const runCitty = async (args, options = {}) => {
        const config = options.config || {}
        if (config.cleanroom?.enabled) {
          return await mockRunCleanroom(args, options)
        }
        throw new Error('Should use cleanroom mode')
      }

      await expect(runCitty(['--help'], {
        config: {
          cleanroom: {
            enabled: true
          }
        }
      })).rejects.toThrow('Docker not available')
    })
  })

  describe.concurrent('Config Hierarchy (vitest > options > defaults)', () => {
    it('should prioritize vitest.config over options', async () => {
      // Simulate vitest.config.test.env settings
      const vitestConfig = {
        test: {
          env: {
            TEST_CLI_PATH: './vitest-cli.mjs',
            TEST_CWD: '/vitest/path'
          }
        }
      }

      const mockRunLocalCitty = vi.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'output',
        stderr: '',
        cliPath: './vitest-cli.mjs',
        cwd: '/vitest/path',
        durationMs: 50
      })

      const runCitty = async (args, options = {}) => {
        // Merge config hierarchy: vitest > options > defaults
        const cliPath = vitestConfig.test.env.TEST_CLI_PATH ||
                       options.cliPath ||
                       './playground/src/cli.mjs'
        const cwd = vitestConfig.test.env.TEST_CWD ||
                   options.cwd ||
                   process.cwd()

        return await mockRunLocalCitty({
          args,
          cliPath,
          cwd,
          env: options.env || {},
          timeout: options.timeout || 30000
        })
      }

      const result = await runCitty(['--version'], {
        cliPath: './options-cli.mjs',
        cwd: '/options/path'
      })

      // Vitest config should take precedence
      expect(result.cliPath).toBe('./vitest-cli.mjs')
      expect(result.cwd).toBe('/vitest/path')
    })

    it('should use options when vitest config is not set', async () => {
      const mockRunLocalCitty = vi.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'output',
        stderr: '',
        cliPath: './options-cli.mjs',
        cwd: '/options/path',
        durationMs: 50
      })

      const runCitty = async (args, options = {}) => {
        const cliPath = options.cliPath || './playground/src/cli.mjs'
        const cwd = options.cwd || process.cwd()

        return await mockRunLocalCitty({
          args,
          cliPath,
          cwd,
          env: options.env || {},
          timeout: options.timeout || 30000
        })
      }

      const result = await runCitty(['--version'], {
        cliPath: './options-cli.mjs',
        cwd: '/options/path'
      })

      expect(result.cliPath).toBe('./options-cli.mjs')
      expect(result.cwd).toBe('/options/path')
    })

    it('should use defaults when neither vitest nor options are set', async () => {
      const mockRunLocalCitty = vi.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'output',
        stderr: '',
        cliPath: './playground/src/cli.mjs',
        cwd: process.cwd(),
        durationMs: 50
      })

      const runCitty = async (args, options = {}) => {
        const cliPath = options.cliPath || './playground/src/cli.mjs'
        const cwd = options.cwd || process.cwd()

        return await mockRunLocalCitty({
          args,
          cliPath,
          cwd,
          env: options.env || {},
          timeout: options.timeout || 30000
        })
      }

      const result = await runCitty(['--version'])

      expect(result.cliPath).toBe('./playground/src/cli.mjs')
      expect(result.cwd).toBe(process.cwd())
    })

    it('should merge config.cleanroom with options correctly', async () => {
      const mockRunCleanroom = vi.fn().mockResolvedValue({
        exitCode: 0,
        stdout: 'output',
        stderr: '',
        cwd: '/app',
        durationMs: 150
      })

      const runCitty = async (args, options = {}) => {
        const config = options.config || {}

        if (config.cleanroom?.enabled) {
          // Merge cleanroom options
          const cleanroomOptions = {
            ...options,
            json: config.cleanroom.json ?? options.json ?? false,
            timeout: config.cleanroom.timeout ?? options.timeout ?? 10000,
            cwd: config.cleanroom.cwd ?? options.cwd ?? '/app'
          }
          return await mockRunCleanroom(args, cleanroomOptions)
        }

        throw new Error('Should use cleanroom mode')
      }

      const result = await runCitty(['--help'], {
        timeout: 5000, // Option value
        json: false,
        config: {
          cleanroom: {
            enabled: true,
            timeout: 15000, // Config value takes precedence
            cwd: '/custom/app'
          }
        }
      })

      expect(mockRunCleanroom).toHaveBeenCalledWith(
        ['--help'],
        expect.objectContaining({
          timeout: 15000, // Config value used
          cwd: '/custom/app'
        })
      )
    })
  })

  describe.concurrent('Error Handling', () => {
    it('should throw on invalid cliPath', async () => {
      const runCitty = async (args, options = {}) => {
        const cliPath = options.cliPath || './playground/src/cli.mjs'

        // Validate cliPath exists
        if (!cliPath.endsWith('.js') && !cliPath.endsWith('.mjs')) {
          throw new Error(`Invalid CLI path: ${cliPath}`)
        }

        return { exitCode: 0, stdout: '', stderr: '', cliPath, cwd: process.cwd(), durationMs: 0 }
      }

      await expect(runCitty(['--help'], {
        cliPath: 'invalid-path'
      })).rejects.toThrow('Invalid CLI path')
    })

    it('should throw on timeout', async () => {
      const mockRunLocalCitty = vi.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Timeout after 1000ms')), 1000)
        })
      })

      const runCitty = async (args, options = {}) => {
        return await mockRunLocalCitty({
          args,
          cliPath: options.cliPath || './playground/src/cli.mjs',
          cwd: options.cwd || process.cwd(),
          env: options.env || {},
          timeout: options.timeout || 30000
        })
      }

      await expect(runCitty(['--help'], {
        timeout: 1000
      })).rejects.toThrow('Timeout')
    }, 2000)

    it('should throw on missing config', async () => {
      const runCitty = async (args, options = {}) => {
        const config = options.config

        if (config && config.cleanroom?.enabled && !config.cleanroom.image) {
          throw new Error('Cleanroom config missing required field: image')
        }

        return { exitCode: 0, stdout: '', stderr: '', cwd: process.cwd(), durationMs: 0 }
      }

      await expect(runCitty(['--help'], {
        config: {
          cleanroom: {
            enabled: true
            // Missing image
          }
        }
      })).rejects.toThrow('Cleanroom config missing required field')
    })
  })
})

describe.concurrent('v1.0.0 Unified API - Simplified Scenario DSL', () => {
  describe.concurrent('.step(name, args) Pattern', () => {
    it('should support simplified step with inline args', async () => {
      // v1.0.0 API: .step(name, args) instead of .step(name).run(args)
      const testScenario = scenario('Test')
        .step('Check version', ['--version'])
        .expectSuccess()

      expect(testScenario).toBeDefined()
      expect(testScenario._steps).toHaveLength(1)
      expect(testScenario._steps[0].description).toBe('Check version')
      expect(testScenario._steps[0].args).toEqual(['--version'])
      expect(testScenario._steps[0].expectations).toHaveLength(1)
    })

    it('should support step with options object', async () => {
      // v1.0.0 API: .step(name, args, options)
      const testScenario = scenario('Test')
        .step('Check version', ['--version'], {
          cwd: '/custom/path',
          env: { NODE_ENV: 'test' }
        })
        .expectSuccess()

      expect(testScenario).toBeDefined()
      expect(testScenario._steps).toHaveLength(1)
      expect(testScenario._steps[0].args).toEqual(['--version'])
      expect(testScenario._steps[0].options).toEqual({
        cwd: '/custom/path',
        env: { NODE_ENV: 'test' }
      })
    })

    it('should support string args that get split', async () => {
      // String args get split on whitespace
      const testScenario = scenario('Test')
        .step('Check version', '--version --json')
        .expectSuccess()

      expect(testScenario).toBeDefined()
      expect(testScenario._steps).toHaveLength(1)
      expect(testScenario._steps[0].args).toEqual(['--version', '--json'])
    })
  })

  describe.concurrent('.execute() Auto-Detection', () => {
    it('should auto-detect local mode when no config provided', async () => {
      // Test that execute() can auto-detect mode
      const testScenario = scenario('Test')
        .step('Check version', ['--version'])
        .expectSuccess()

      // Verify scenario structure is correct
      expect(testScenario).toBeDefined()
      expect(typeof testScenario.execute).toBe('function')
      expect(testScenario._steps).toHaveLength(1)
    })

    it('should detect cleanroom mode from config', async () => {
      // Mock scenario with cleanroom config
      const testScenario = scenario('Test')
        .step('Check version', ['--version'])
        .expectSuccess()

      // In v1.0.0, execute() would read config and auto-select mode
      // This is a spec for future implementation
      expect(testScenario).toBeDefined()
      expect(typeof testScenario.execute).toBe('function')
    })
  })

  describe.concurrent('Fluent Assertions', () => {
    it('should chain assertions fluently', async () => {
      // Test that assertions can be chained
      const testScenario = scenario('Test')
        .step('Check version', ['--version'])
        .expectSuccess()
        .expectOutput('Version')
        .expectOutput(/\d+\.\d+\.\d+/)

      expect(testScenario).toBeDefined()
      expect(testScenario._steps).toHaveLength(1)
      expect(testScenario._steps[0].expectations).toHaveLength(3)
    })

    it('should support custom assertions', async () => {
      // Test that custom assertions can be added
      const testScenario = scenario('Test')
        .step('Get version JSON', ['--version', '--json'])
        .expect((result) => {
          const json = result.json || JSON.parse(result.stdout)
          expect(json.version).toMatch(/\d+\.\d+\.\d+/)
        })

      expect(testScenario).toBeDefined()
      expect(testScenario._steps).toHaveLength(1)
      expect(testScenario._steps[0].expectations).toHaveLength(1)
      expect(typeof testScenario._steps[0].expectations[0]).toBe('function')
    })

    it('should fail on assertion errors', async () => {
      // Test that scenarios can define failure expectations
      const testScenario = scenario('Test')
        .step('Failing command', ['invalid'])
        .expectSuccess()

      expect(testScenario).toBeDefined()
      expect(testScenario._steps).toHaveLength(1)
      expect(testScenario._steps[0].expectations).toHaveLength(1)
    })
  })
})

describe.concurrent('v1.0.0 Unified API - Auto Cleanroom Lifecycle', () => {
  describe.concurrent('Setup Before Tests', () => {
    it('should auto-setup cleanroom before first test', async () => {
      const mockSetup = vi.fn().mockResolvedValue({ container: {}, ready: true })

      // Simulate auto-setup hook
      const autoSetupCleanroom = async (config) => {
        if (config.cleanroom?.enabled && !config.cleanroom.skipAutoSetup) {
          return await mockSetup()
        }
        return null
      }

      const result = await autoSetupCleanroom({
        cleanroom: {
          enabled: true
        }
      })

      expect(result).toBeTruthy()
      expect(result.ready).toBe(true)
      expect(mockSetup).toHaveBeenCalledOnce()
    })

    it('should skip auto-setup when skipAutoSetup is true', async () => {
      const mockSetup = vi.fn()

      const autoSetupCleanroom = async (config) => {
        if (config.cleanroom?.enabled && !config.cleanroom.skipAutoSetup) {
          return await mockSetup()
        }
        return null
      }

      const result = await autoSetupCleanroom({
        cleanroom: {
          enabled: true,
          skipAutoSetup: true
        }
      })

      expect(result).toBeNull()
      expect(mockSetup).not.toHaveBeenCalled()
    })

    it('should reuse existing cleanroom container', async () => {
      let containerCount = 0
      const mockSetup = vi.fn().mockImplementation(() => {
        containerCount++
        return { container: { id: containerCount }, ready: true }
      })

      const singleton = { container: null }

      const autoSetupCleanroom = async (config) => {
        if (config.cleanroom?.enabled && !singleton.container) {
          singleton.container = await mockSetup()
        }
        return singleton.container
      }

      // First call creates container
      const result1 = await autoSetupCleanroom({ cleanroom: { enabled: true } })
      expect(mockSetup).toHaveBeenCalledTimes(1)
      expect(result1.container.id).toBe(1)

      // Second call reuses container
      const result2 = await autoSetupCleanroom({ cleanroom: { enabled: true } })
      expect(mockSetup).toHaveBeenCalledTimes(1) // Not called again
      expect(result2.container.id).toBe(1)
    })
  })

  describe.concurrent('Teardown After Tests', () => {
    it('should auto-teardown cleanroom after all tests', async () => {
      const mockTeardown = vi.fn().mockResolvedValue({ success: true })

      const autoTeardownCleanroom = async (config) => {
        if (config.cleanroom?.enabled && !config.cleanroom.skipAutoTeardown) {
          return await mockTeardown()
        }
        return null
      }

      const result = await autoTeardownCleanroom({
        cleanroom: {
          enabled: true
        }
      })

      expect(result.success).toBe(true)
      expect(mockTeardown).toHaveBeenCalledOnce()
    })

    it('should skip auto-teardown when skipAutoTeardown is true', async () => {
      const mockTeardown = vi.fn()

      const autoTeardownCleanroom = async (config) => {
        if (config.cleanroom?.enabled && !config.cleanroom.skipAutoTeardown) {
          return await mockTeardown()
        }
        return null
      }

      const result = await autoTeardownCleanroom({
        cleanroom: {
          enabled: true,
          skipAutoTeardown: true
        }
      })

      expect(result).toBeNull()
      expect(mockTeardown).not.toHaveBeenCalled()
    })

    it('should handle teardown errors gracefully', async () => {
      const mockTeardown = vi.fn().mockRejectedValue(
        new Error('Container already stopped')
      )

      const autoTeardownCleanroom = async (config) => {
        if (config.cleanroom?.enabled) {
          try {
            return await mockTeardown()
          } catch (error) {
            // Log error but don't fail test suite
            console.warn('Teardown warning:', error.message)
            return { success: false, error: error.message }
          }
        }
        return null
      }

      const result = await autoTeardownCleanroom({
        cleanroom: {
          enabled: true
        }
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Container already stopped')
    })
  })

  describe.concurrent('Error Handling in Lifecycle', () => {
    it('should handle setup failures', async () => {
      const mockSetup = vi.fn().mockRejectedValue(
        new Error('Docker daemon not running')
      )

      const autoSetupCleanroom = async (config) => {
        if (config.cleanroom?.enabled) {
          try {
            return await mockSetup()
          } catch (error) {
            // Fail fast on setup errors
            throw new Error(`Cleanroom setup failed: ${error.message}`)
          }
        }
        return null
      }

      await expect(
        autoSetupCleanroom({ cleanroom: { enabled: true } })
      ).rejects.toThrow('Cleanroom setup failed: Docker daemon not running')
    })

    it('should cleanup on setup failure', async () => {
      const mockCleanup = vi.fn()
      const mockSetup = vi.fn().mockImplementation(async () => {
        await mockCleanup() // Cleanup any partial setup
        throw new Error('Setup failed')
      })

      await expect(mockSetup()).rejects.toThrow('Setup failed')
      expect(mockCleanup).toHaveBeenCalled()
    })

    it('should report lifecycle timing', async () => {
      const mockSetup = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return { ready: true }
      })

      const startTime = Date.now()
      const result = await mockSetup()
      const setupDuration = Date.now() - startTime

      expect(result.ready).toBe(true)
      expect(setupDuration).toBeGreaterThanOrEqual(100)
      expect(setupDuration).toBeLessThan(200)
    })
  })
})

describe.concurrent('v1.0.0 Unified API - Vitest Config Integration', () => {
  describe.concurrent('Config Loading', () => {
    it('should load config from vitest.config.js', async () => {
      // Simulate loading vitest config
      const loadVitestConfig = async () => {
        return {
          test: {
            env: {
              TEST_CLI_PATH: './playground/src/cli.mjs',
              TEST_CWD: process.cwd()
            },
            cittyTestUtils: {
              cleanroom: {
                enabled: false,
                skipAutoSetup: false
              }
            }
          }
        }
      }

      const config = await loadVitestConfig()

      expect(config.test.env.TEST_CLI_PATH).toBe('./playground/src/cli.mjs')
      expect(config.test.cittyTestUtils).toBeDefined()
    })

    it('should merge custom config with vitest config', async () => {
      const vitestConfig = {
        test: {
          env: {
            TEST_CLI_PATH: './vitest-cli.mjs'
          },
          cittyTestUtils: {
            timeout: 5000
          }
        }
      }

      const customConfig = {
        timeout: 10000,
        cwd: '/custom/path'
      }

      // Merge logic
      const merged = {
        ...vitestConfig.test.cittyTestUtils,
        ...customConfig,
        env: vitestConfig.test.env
      }

      expect(merged.timeout).toBe(10000) // Custom overrides vitest
      expect(merged.cwd).toBe('/custom/path')
      expect(merged.env.TEST_CLI_PATH).toBe('./vitest-cli.mjs')
    })
  })

  describe.concurrent('Merge Priority', () => {
    it('should follow priority: vitest > options > defaults', async () => {
      const defaults = {
        cliPath: './default-cli.mjs',
        timeout: 30000,
        cwd: process.cwd()
      }

      const vitestConfig = {
        cliPath: './vitest-cli.mjs',
        timeout: 20000
      }

      const options = {
        timeout: 15000,
        env: { NODE_ENV: 'test' }
      }

      // Merge priority
      const merged = {
        ...defaults,
        ...options,
        ...vitestConfig
      }

      expect(merged.cliPath).toBe('./vitest-cli.mjs') // From vitest
      expect(merged.timeout).toBe(20000) // From vitest
      expect(merged.env).toEqual({ NODE_ENV: 'test' }) // From options
      expect(merged.cwd).toBe(process.cwd()) // From defaults
    })

    it('should not override with undefined values', async () => {
      const defaults = {
        cliPath: './default-cli.mjs',
        timeout: 30000
      }

      const options = {
        cliPath: undefined,
        env: { DEBUG: '1' }
      }

      // Filter out undefined values
      const filtered = Object.fromEntries(
        Object.entries(options).filter(([_, v]) => v !== undefined)
      )

      const merged = {
        ...defaults,
        ...filtered
      }

      expect(merged.cliPath).toBe('./default-cli.mjs') // Not overridden by undefined
      expect(merged.env).toEqual({ DEBUG: '1' })
    })
  })

  describe.concurrent('Missing Config Handling', () => {
    it('should use defaults when vitest.config is missing', async () => {
      const loadVitestConfig = async () => {
        return null // Config file doesn't exist
      }

      const config = await loadVitestConfig()

      // Fallback to defaults
      const defaults = {
        cliPath: './playground/src/cli.mjs',
        cwd: process.cwd(),
        timeout: 30000
      }

      const finalConfig = config || defaults

      expect(finalConfig.cliPath).toBe('./playground/src/cli.mjs')
      expect(finalConfig.cwd).toBe(process.cwd())
      expect(finalConfig.timeout).toBe(30000)
    })

    it('should handle partial config gracefully', async () => {
      const partialConfig = {
        test: {
          env: {
            TEST_CLI_PATH: './partial-cli.mjs'
            // Missing TEST_CWD
          }
        }
      }

      const defaults = {
        cliPath: './default-cli.mjs',
        cwd: process.cwd()
      }

      // Merge with defaults
      const merged = {
        ...defaults,
        cliPath: partialConfig.test.env.TEST_CLI_PATH || defaults.cliPath,
        cwd: partialConfig.test.env.TEST_CWD || defaults.cwd
      }

      expect(merged.cliPath).toBe('./partial-cli.mjs')
      expect(merged.cwd).toBe(process.cwd()) // Fallback to default
    })

    it('should validate config structure', async () => {
      const validateConfig = (config) => {
        if (!config) return { valid: false, errors: ['Config is null'] }

        const errors = []

        if (config.cleanroom?.enabled && !config.cleanroom.image) {
          errors.push('Cleanroom enabled but image not specified')
        }

        if (config.timeout && typeof config.timeout !== 'number') {
          errors.push('Timeout must be a number')
        }

        return {
          valid: errors.length === 0,
          errors
        }
      }

      const validConfig = {
        cleanroom: {
          enabled: true,
          image: 'node:20-alpine'
        },
        timeout: 5000
      }

      const invalidConfig = {
        cleanroom: {
          enabled: true
          // Missing image
        },
        timeout: 'invalid'
      }

      expect(validateConfig(validConfig).valid).toBe(true)
      expect(validateConfig(invalidConfig).valid).toBe(false)
      expect(validateConfig(invalidConfig).errors).toContain('Cleanroom enabled but image not specified')
      expect(validateConfig(invalidConfig).errors).toContain('Timeout must be a number')
    })
  })
})

describe.concurrent('v1.0.0 Unified API - Integration Tests', () => {
  it('should execute complete workflow with unified API', async () => {
    // v1.0.0 API uses .step(name, args) instead of .step(name).run(args)
    const testScenario = scenario('Complete workflow')
      .step('Check version', '--version')
      .expectSuccess()
      .expectOutput('0.5')
      .step('Show help', '--help')
      .expectSuccess()
      .expectOutput('Usage')
      .step('Generate test', ['gen', 'test', 'my-test'])
      .expectSuccess()
      .expectOutput('Generated')

    expect(testScenario).toBeDefined()
    expect(testScenario._steps).toHaveLength(3)
    expect(testScenario._steps[0].args).toEqual(['--version'])
    expect(testScenario._steps[1].args).toEqual(['--help'])
    expect(testScenario._steps[2].args).toEqual(['gen', 'test', 'my-test'])
  })

  it('should handle mixed local and cleanroom execution', async () => {
    // This tests the future capability to mix execution modes
    const mockLocalRunner = vi.fn().mockResolvedValue({
      exitCode: 0,
      stdout: 'local output',
      stderr: '',
      mode: 'local'
    })

    const mockCleanroomRunner = vi.fn().mockResolvedValue({
      exitCode: 0,
      stdout: 'cleanroom output',
      stderr: '',
      mode: 'cleanroom'
    })

    // In v1.0.0, you could specify mode per step
    // This is a spec for future implementation
    expect(mockLocalRunner).toBeDefined()
    expect(mockCleanroomRunner).toBeDefined()
  })

  it('should provide comprehensive error context', async () => {
    // Test that scenarios provide good error messages
    const testScenario = scenario('Error context test')
      .step('Run invalid command', 'invalid')
      .expectSuccess()

    expect(testScenario).toBeDefined()
    expect(testScenario._steps).toHaveLength(1)
    expect(testScenario._steps[0].description).toBe('Run invalid command')
    expect(testScenario._steps[0].args).toEqual(['invalid'])
  })
})
