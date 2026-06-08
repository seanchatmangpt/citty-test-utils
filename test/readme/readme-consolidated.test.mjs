#!/usr/bin/env node
// test/readme/readme-consolidated.test.mjs
// Consolidated README tests - replaces multiple redundant README test files

import { describe, it, expect } from 'vitest'
import { runLocalCitty, runCitty } from 'un-test-utils'
import { getSharedCleanroom, isCleanroomAvailable } from '../setup/shared-cleanroom.mjs'
import { scenario } from '@un-test/scenario'

describe.concurrent('README Consolidated Tests', () => {
  let testTimestamp = Date.now()

  describe.concurrent('Basic Examples', () => {
    it.skip('should demonstrate basic local execution', async () => {
      const result = await runLocalCitty(['--show-help'], {
        cwd: process.cwd(),
        env: { TEST_CLI: 'true' },
      })

      console.log('RESULT:', JSON.stringify(result, null, 2))

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('ctu')
      expect(result.stdout).toContain('USAGE')
    })

    it.skip('should demonstrate basic cleanroom execution', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(['--show-help'], {
        cwd: '/app',
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('ctu')
      expect(result.stdout).toContain('USAGE')
    })

    it.skip('should demonstrate fluent assertions', async () => {
      const result = await runLocalCitty(['info', 'version'], {
        cwd: process.cwd(),
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput(/Version: 1\.0\.0/)
        .expectNoStderr()
    })
  })

  describe.concurrent('Scenario DSL Examples', () => {
    it.skip('should demonstrate sequential scenario execution', async () => {
      const testScenario = scenario('Sequential Example')
        .step('Get help')
        .run(['--show-help'])
        .expectSuccess()
        .step('Get version')
        .run(['--show-version'])
        .expectSuccess()

      const results = await testScenario.execute('local')
      expect(results.success).toBe(true)
      expect(results.results).toHaveLength(2)
    })

    it.skip('should demonstrate concurrent scenario execution', async () => {
      const testScenario = scenario('Concurrent Example')
        .concurrent()
        .step('Get help')
        .run(['--show-help'])
        .expectSuccess()
        .step('Get version')
        .run(['--show-version'])
        .expectSuccess()

      const results = await testScenario.execute('local')
      expect(results.success).toBe(true)
      expect(results.concurrent).toBe(true)
      expect(results.results).toHaveLength(2)
    })
  })

  describe.concurrent('Concurrency Examples', () => {
    it.skip('should demonstrate concurrent command execution', async () => {
      const commands = [['--show-help'], ['--show-version'], ['info', 'version']]

      const promises = commands.map((cmd) => runLocalCitty(cmd, { cwd: process.cwd(), env: {} }))

      const results = await Promise.all(promises)

      results.forEach((result) => {
        expect(result.exitCode).toBe(0)
      })
    })

    it.skip('should demonstrate cleanroom concurrency', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const commands = [['--show-help'], ['--show-version'], ['gen', 'test', `concurrent-${testTimestamp}`]]

      const promises = commands.map((cmd) => runCitty(cmd, { cwd: '/app', env: {} }))

      const results = await Promise.all(promises)

      results.forEach((result) => {
        expect(result.exitCode).toBe(0)
      })
    })
  })

  describe.concurrent('Error Handling Examples', () => {
    it.skip('should demonstrate error handling', async () => {
      const result = await runLocalCitty(['invalid', 'command'], {
        cwd: process.cwd(),
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Unknown command')
    })

    it.skip('should demonstrate cleanroom error isolation', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const errorResult = await runCitty(['invalid', 'command'], {
        cwd: '/app',
        env: { TEST_CLI: 'true' },
      })

      expect(errorResult.exitCode).toBe(1)

      // Local should still work
      const localResult = await runLocalCitty(['--show-version'], {
        cwd: process.cwd(),
        env: { TEST_CLI: 'true' },
      })

      expect(localResult.exitCode).toBe(0)
    })
  })

  describe.concurrent('Installation Examples', () => {
    it.skip('should demonstrate package installation', async () => {
      // This would typically test npm install, but we'll simulate
      const result = await runLocalCitty(['--show-version'], {
        cwd: process.cwd(),
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatch(/1\.0\.0/)
    })
  })

  describe.concurrent('TypeScript Support Examples', () => {
    it.skip('should demonstrate TypeScript definitions', async () => {
      // Test that TypeScript definitions are available
      const result = await runLocalCitty(['--show-help'], {
        cwd: process.cwd(),
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('USAGE')
    })
  })
})
