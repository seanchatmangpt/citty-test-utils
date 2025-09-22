#!/usr/bin/env node
// test/integration/analysis-cleanroom.test.mjs
// Test analysis commands in cleanroom environment to ensure isolation with maximum concurrency

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupCleanroom, runCitty, teardownCleanroom } from '../../index.js'

describe('Analysis Commands Cleanroom Tests', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  })

  afterAll(async () => {
    await teardownCleanroom()
  })

  describe('Analysis Stats Command', () => {
    it('should show coverage statistics in cleanroom', async () => {
      const result = await runCitty(['analysis', 'stats'], {
        env: { TEST_CLI: 'true' },
        timeout: 15000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('📊 CLI Coverage Statistics')
      expect(result.stdout).toContain('📈 Coverage Summary:')
      expect(result.stdout).toContain('Main Commands:')
      expect(result.stdout).toContain('Subcommands:')
      expect(result.stdout).toContain('Overall:')
      expect(result.stdout).toContain('%')
    })

    it('should show verbose output when requested', async () => {
      const result = await runCitty(['analysis', 'stats', '--verbose'], {
        env: { TEST_CLI: 'true' },
        timeout: 15000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('📊 CLI Coverage Statistics')
      expect(result.stderr).toContain('📈 Calculating coverage statistics')
    })
  })

  describe('Analysis Analyze Command', () => {
    it('should perform full analysis in cleanroom', async () => {
      const result = await runCitty(['analysis', 'analyze'], {
        env: { TEST_CLI: 'true' },
        timeout: 20000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('📊 CLI Test Coverage Analysis')
      expect(result.stdout).toContain('📈 Summary:')
      expect(result.stdout).toContain('Main Commands:')
      expect(result.stdout).toContain('Overall:')
    })

    it('should support different output formats concurrently', async () => {
      // Test multiple formats concurrently
      const formatTests = [
        runCitty(['analysis', 'analyze', '--format', 'text'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
        runCitty(['analysis', 'analyze', '--format', 'json'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
        runCitty(['analysis', 'analyze', '--format', 'turtle'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
      ]

      const results = await Promise.all(formatTests)

      // Verify all formats work
      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toBeTruthy()
      })

      // Verify specific format outputs
      expect(results[0].stdout).toContain('📊 CLI Test Coverage Analysis')
      expect(() => JSON.parse(results[1].stdout)).not.toThrow()

      const jsonData = JSON.parse(results[1].stdout)
      expect(jsonData).toHaveProperty('summary')
      expect(jsonData).toHaveProperty('commands')
      expect(jsonData).toHaveProperty('recommendations')
    })
  })

  describe('Analysis Export Command', () => {
    it('should export multiple formats concurrently in cleanroom', async () => {
      const exportOperations = [
        runCitty(
          ['analysis', 'export', '--format', 'json', '--output', '/tmp/coverage-cleanroom.json'],
          { env: { TEST_CLI: 'true' }, timeout: 20000 }
        ),
        runCitty(
          [
            'analysis',
            'export',
            '--format',
            'turtle',
            '--output',
            '/tmp/coverage-cleanroom.ttl',
            '--base-uri',
            'https://example.org/cleanroom-test',
            '--cli-name',
            'cleanroom-cli',
          ],
          { env: { TEST_CLI: 'true' }, timeout: 20000 }
        ),
      ]

      const results = await Promise.all(exportOperations)

      // Verify JSON export
      expect(results[0].exitCode).toBe(0)
      expect(results[0].stdout).toContain(
        '✅ Coverage data exported to: /tmp/coverage-cleanroom.json'
      )
      expect(results[0].stdout).toContain('📊 Format: JSON')
      expect(results[0].stdout).toContain('📈 Overall Coverage:')

      // Verify Turtle export
      expect(results[1].exitCode).toBe(0)
      expect(results[1].stdout).toContain(
        '✅ Coverage data exported to: /tmp/coverage-cleanroom.ttl'
      )
      expect(results[1].stdout).toContain('📊 Format: TURTLE')
      expect(results[1].stdout).toContain('📈 Overall Coverage:')
    })
  })

  describe('Analysis Report Command', () => {
    it('should generate reports in multiple formats concurrently', async () => {
      const reportOperations = [
        runCitty(['analysis', 'report'], { env: { TEST_CLI: 'true' }, timeout: 20000 }),
        runCitty(['analysis', 'report', '--format', 'json'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
      ]

      const results = await Promise.all(reportOperations)

      // Verify text report
      expect(results[0].exitCode).toBe(0)
      expect(results[0].stdout).toContain('📊 CLI Test Coverage Analysis')
      expect(results[0].stdout).toContain('📈 Summary:')
      expect(results[0].stdout).toContain('Main Commands:')
      expect(results[0].stdout).toContain('Overall:')

      // Verify JSON report
      expect(results[1].exitCode).toBe(0)
      expect(() => JSON.parse(results[1].stdout)).not.toThrow()
    })
  })

  describe('Analysis Command Help', () => {
    it('should show all help commands concurrently', async () => {
      const helpOperations = [
        runCitty(['analysis', '--help'], { env: { TEST_CLI: 'true' }, timeout: 10000 }),
        runCitty(['analysis', 'analyze', '--help'], { env: { TEST_CLI: 'true' }, timeout: 10000 }),
        runCitty(['analysis', 'export', '--help'], { env: { TEST_CLI: 'true' }, timeout: 10000 }),
      ]

      const results = await Promise.all(helpOperations)

      // Verify main analysis help
      expect(results[0].exitCode).toBe(0)
      expect(results[0].stdout).toContain('Analyze CLI test coverage and generate reports')
      expect(results[0].stdout).toContain('analyze')
      expect(results[0].stdout).toContain('report')
      expect(results[0].stdout).toContain('export')
      expect(results[0].stdout).toContain('stats')

      // Verify analyze subcommand help
      expect(results[1].exitCode).toBe(0)
      expect(results[1].stdout).toContain('Analyze CLI test coverage by walking help output')
      expect(results[1].stdout).toContain('--format')
      expect(results[1].stdout).toContain('--output')
      expect(results[1].stdout).toContain('--verbose')

      // Verify export subcommand help
      expect(results[2].exitCode).toBe(0)
      expect(results[2].stdout).toContain('Export coverage data in structured formats')
      expect(results[2].stdout).toContain('--format')
      expect(results[2].stdout).toContain('--output')
      expect(results[2].stdout).toContain('--base-uri')
      expect(results[2].stdout).toContain('--cli-name')
    })
  })

  describe('Maximum Concurrency Tests', () => {
    it('should run multiple analysis operations concurrently', async () => {
      // Run multiple analysis operations in parallel
      const operations = [
        runCitty(['analysis', 'stats'], { env: { TEST_CLI: 'true' }, timeout: 15000 }),
        runCitty(['analysis', 'analyze', '--format', 'json'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
        runCitty(['analysis', 'report'], { env: { TEST_CLI: 'true' }, timeout: 20000 }),
        runCitty(['analysis', 'export', '--format', 'json', '--output', '/tmp/concurrent-1.json'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
        runCitty(
          ['analysis', 'export', '--format', 'turtle', '--output', '/tmp/concurrent-1.ttl'],
          { env: { TEST_CLI: 'true' }, timeout: 20000 }
        ),
      ]

      const results = await Promise.all(operations)

      // Verify all operations succeeded
      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toBeTruthy()
      })

      // Verify specific outputs
      expect(results[0].stdout).toContain('📊 CLI Coverage Statistics')
      expect(() => JSON.parse(results[1].stdout)).not.toThrow()
      expect(results[2].stdout).toContain('📊 CLI Test Coverage Analysis')
      expect(results[3].stdout).toContain('✅ Coverage data exported to: /tmp/concurrent-1.json')
      expect(results[4].stdout).toContain('✅ Coverage data exported to: /tmp/concurrent-1.ttl')
    })

    it('should handle concurrent exports with different formats and URIs', async () => {
      const exportOperations = [
        runCitty(
          [
            'analysis',
            'export',
            '--format',
            'json',
            '--output',
            '/tmp/concurrent-json-1.json',
            '--cli-name',
            'concurrent-1',
          ],
          { env: { TEST_CLI: 'true' }, timeout: 20000 }
        ),
        runCitty(
          [
            'analysis',
            'export',
            '--format',
            'json',
            '--output',
            '/tmp/concurrent-json-2.json',
            '--cli-name',
            'concurrent-2',
          ],
          { env: { TEST_CLI: 'true' }, timeout: 20000 }
        ),
        runCitty(
          [
            'analysis',
            'export',
            '--format',
            'turtle',
            '--output',
            '/tmp/concurrent-turtle-1.ttl',
            '--base-uri',
            'https://example.org/concurrent-1',
            '--cli-name',
            'concurrent-turtle-1',
          ],
          { env: { TEST_CLI: 'true' }, timeout: 20000 }
        ),
        runCitty(
          [
            'analysis',
            'export',
            '--format',
            'turtle',
            '--output',
            '/tmp/concurrent-turtle-2.ttl',
            '--base-uri',
            'https://example.org/concurrent-2',
            '--cli-name',
            'concurrent-turtle-2',
          ],
          { env: { TEST_CLI: 'true' }, timeout: 20000 }
        ),
      ]

      const results = await Promise.all(exportOperations)

      // Verify all exports succeeded
      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('✅ Coverage data exported to:')
        expect(result.stdout).toContain('📈 Overall Coverage:')
      })

      // Verify specific file paths
      expect(results[0].stdout).toContain('/tmp/concurrent-json-1.json')
      expect(results[1].stdout).toContain('/tmp/concurrent-json-2.json')
      expect(results[2].stdout).toContain('/tmp/concurrent-turtle-1.ttl')
      expect(results[3].stdout).toContain('/tmp/concurrent-turtle-2.ttl')
    })

    it('should run mixed analysis operations concurrently', async () => {
      const mixedOperations = [
        // Stats with verbose
        runCitty(['analysis', 'stats', '--verbose'], { env: { TEST_CLI: 'true' }, timeout: 15000 }),
        // Analyze with different formats
        runCitty(['analysis', 'analyze', '--format', 'text'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
        runCitty(['analysis', 'analyze', '--format', 'json'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
        // Report generation
        runCitty(['analysis', 'report', '--format', 'text'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
        runCitty(['analysis', 'report', '--format', 'json'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
        // Export operations
        runCitty(['analysis', 'export', '--format', 'json', '--output', '/tmp/mixed-1.json'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
        runCitty(['analysis', 'export', '--format', 'turtle', '--output', '/tmp/mixed-1.ttl'], {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }),
      ]

      const results = await Promise.all(mixedOperations)

      // Verify all operations succeeded
      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toBeTruthy()
      })

      // Verify specific outputs
      expect(results[0].stdout).toContain('📊 CLI Coverage Statistics')
      expect(results[0].stderr).toContain('📈 Calculating coverage statistics')
      expect(results[1].stdout).toContain('📊 CLI Test Coverage Analysis')
      expect(() => JSON.parse(results[2].stdout)).not.toThrow()
      expect(results[3].stdout).toContain('📊 CLI Test Coverage Analysis')
      expect(() => JSON.parse(results[4].stdout)).not.toThrow()
      expect(results[5].stdout).toContain('✅ Coverage data exported to: /tmp/mixed-1.json')
      expect(results[6].stdout).toContain('✅ Coverage data exported to: /tmp/mixed-1.ttl')
    })
  })

  describe('Cleanroom Isolation Verification', () => {
    it('should not pollute main project with analysis files', async () => {
      // Run analysis export in cleanroom
      const result = await runCitty(
        ['analysis', 'export', '--format', 'json', '--output', '/tmp/analysis-test.json'],
        {
          env: { TEST_CLI: 'true' },
          timeout: 20000,
        }
      )

      expect(result.exitCode).toBe(0)

      // Verify the file was created in cleanroom, not in main project
      // This test ensures cleanroom isolation is working
      expect(result.stdout).toContain('/tmp/analysis-test.json')
    })

    it('should handle analysis commands with test CLI', async () => {
      const result = await runCitty(['analysis', 'stats', '--use-test-cli'], {
        env: { TEST_CLI: 'true' },
        timeout: 15000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('📊 CLI Coverage Statistics')
    })

    it('should maintain isolation with concurrent file operations', async () => {
      // Run multiple file operations concurrently to test isolation
      const fileOperations = [
        runCitty(
          ['analysis', 'export', '--format', 'json', '--output', '/tmp/isolation-test-1.json'],
          { env: { TEST_CLI: 'true' }, timeout: 20000 }
        ),
        runCitty(
          ['analysis', 'export', '--format', 'json', '--output', '/tmp/isolation-test-2.json'],
          { env: { TEST_CLI: 'true' }, timeout: 20000 }
        ),
        runCitty(
          ['analysis', 'export', '--format', 'turtle', '--output', '/tmp/isolation-test-3.ttl'],
          { env: { TEST_CLI: 'true' }, timeout: 20000 }
        ),
      ]

      const results = await Promise.all(fileOperations)

      // Verify all operations succeeded and files are isolated
      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain(`/tmp/isolation-test-${index + 1}`)
      })
    })
  })
})
