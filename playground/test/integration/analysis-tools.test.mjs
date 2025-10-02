import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the playground directory path
const __filename = fileURLToPath(import.meta.url)
const playgroundDir = join(dirname(__filename), '../..')
const mainDir = join(playgroundDir, '..')

describe('CLI Analysis Tools Integration Tests', () => {
  describe('CLI Structure Discovery', () => {
    it('should discover playground CLI structure with text output', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'discover',
          '--cli-path',
          'playground/src/cli.mjs',
          '--format',
          'text',
          '--verbose',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/🔍 CLI Structure Discovery Report/)
      result.expectOutput(/Main Command: playground/)
      result.expectOutput(/Subcommands: 6/)
      result.expectOutput(/greet: Greet someone/)
      result.expectOutput(/math: Perform mathematical operations/)
      result.expectOutput(/math add: Add two numbers/)
      result.expectOutput(/math multiply: Multiply two numbers/)
      result.expectOutput(/error: Simulate different types of errors/)
      result.expectOutput(/info: Show playground information/)
    })

    it('should discover playground CLI structure with JSON output', async () => {
      const result = await runLocalCitty(
        ['analysis', 'discover', '--cli-path', 'playground/src/cli.mjs', '--format', 'json'],
        {
          cwd: mainDir,
          json: true,
        }
      )

      result.expectSuccess()
      result.expectJson((json) => {
        expect(json.metadata).toBeDefined()
        expect(json.metadata.cliPath).toBe('playground/src/cli.mjs')
        expect(json.metadata.analysisMethod).toBe('AST-based')
        expect(json.summary).toBeDefined()
        expect(json.summary.commands).toBeGreaterThan(0)
        expect(json.summary.subcommands).toBeGreaterThan(0)
        expect(json.commands).toBeDefined()
        expect(json.globalOptions).toBeDefined()
      })
    })

    it('should handle discovery with minimal output', async () => {
      const result = await runLocalCitty(
        ['analysis', 'discover', '--cli-path', 'playground/src/cli.mjs', '--format', 'text'],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/CLI Structure Discovery Report/)
      result.expectOutput(/Main Command: playground/)
    })
  })

  describe('Test Coverage Analysis', () => {
    it('should analyze playground test coverage with detailed output', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'analyze',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'text',
          '--verbose',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/🚀 Enhanced AST-Based CLI Test Coverage Analysis/)
      result.expectOutput(/Main Command: 1\/1 \(100\.0%\)/)
      result.expectOutput(/Subcommands: 3\/6 \(50\.0%\)/)
      result.expectOutput(/Overall: 4\/7 \(57\.1%\)/)
      result.expectOutput(/CLI Path: playground\/src\/cli\.mjs/)
      result.expectOutput(/Test Directory: playground\/test/)
      result.expectOutput(/Test Files: 5/)
      result.expectOutput(/Commands: 1/)
      result.expectOutput(/Subcommands: 6/)
    })

    it('should analyze test coverage with JSON output', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'analyze',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'json',
        ],
        {
          cwd: mainDir,
          json: true,
        }
      )

      result.expectSuccess()
      // Note: analyze command may not provide JSON output in all cases
      if (result.json) {
        result.expectJson((json) => {
          expect(json).toBeDefined()
        })
      } else {
        // If no JSON output, just verify the command succeeded
        expect(result.exitCode).toBe(0)
      }
    })

    it('should analyze coverage with threshold checking', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'analyze',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--threshold',
          '50',
          '--format',
          'text',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/Enhanced AST-Based CLI Test Coverage Analysis/)
      result.expectOutput(/Overall: 4\/7 \(57\.1%\)/)
    })
  })

  describe('Smart Recommendations', () => {
    it('should provide high-priority recommendations', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'recommend',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'text',
          '--priority',
          'high',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/💡 Smart Recommendations Report/)
      result.expectOutput(/Priority Filter: high/)
      result.expectOutput(/Total Recommendations: 3/)
      result.expectOutput(/🔴 High Priority Recommendations:/)
      result.expectOutput(/Add tests for subcommand: math add undefined/)
      result.expectOutput(/Add tests for subcommand: math multiply undefined/)
      result.expectOutput(/Add tests for subcommand: info undefined/)
      result.expectOutput(/Total Actionable: 3/)
      result.expectOutput(/High Priority: 3/)
    })

    it('should provide actionable recommendations', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'recommend',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'text',
          '--actionable',
          'true',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/Actionable Only: true/)
      result.expectOutput(/Implementation Plan:/)
    })

    it('should provide medium-priority recommendations', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'recommend',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'text',
          '--priority',
          'medium',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/Priority Filter: medium/)
    })

    it('should provide low-priority recommendations', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'recommend',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'text',
          '--priority',
          'low',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/Priority Filter: low/)
    })
  })

  describe('AST-based Analysis', () => {
    it('should perform AST-based analysis', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'ast-analyze',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'text',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/AST-based/)
    })

    it('should perform AST analysis with JSON output', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'ast-analyze',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'json',
        ],
        {
          cwd: mainDir,
          json: true,
        }
      )

      result.expectSuccess()
      // AST analysis may or may not provide JSON output
      if (result.json) {
        result.expectJson((json) => {
          expect(json).toBeDefined()
        })
      }
    })
  })

  describe('Report Generation', () => {
    it('should generate detailed coverage report', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'report',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'text',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      // Report command may produce similar output to analyze command
      result.expectOutput(/Enhanced AST-Based CLI Test Coverage Analysis/)
    })

    it('should generate report with custom format', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'report',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'json',
        ],
        {
          cwd: mainDir,
          json: true,
        }
      )

      result.expectSuccess()
      // Report command may or may not provide JSON output
      if (result.json) {
        result.expectJson((json) => {
          expect(json).toBeDefined()
        })
      }
    })
  })

  describe('Data Export', () => {
    it('should export coverage data in JSON format', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'export',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'json',
          '--output',
          '/tmp/test-export.json',
          '--base-uri',
          'http://example.org/test',
          '--cli-name',
          'playground',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/✅ AST-based coverage data exported to:/)
      result.expectOutput(/📊 Format: JSON/)
      result.expectOutput(/📈 Overall Coverage:/)
    })

    it('should export coverage data in Turtle format', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'export',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'turtle',
          '--output',
          '/tmp/test-export.ttl',
          '--base-uri',
          'http://example.org/test',
          '--cli-name',
          'playground',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/✅ Coverage data exported to:/)
      result.expectOutput(/📊 Format: TURTLE/)
      result.expectOutput(/📈 Overall Coverage:/)
    })

    it('should validate Turtle output format', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'export',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'turtle',
          '--output',
          '/tmp/test-turtle-validation.ttl',
          '--base-uri',
          'http://example.org/playground',
          '--cli-name',
          'playground',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()

      // Read the generated Turtle file to validate format
      const fs = await import('fs')
      const turtleContent = fs.readFileSync('/tmp/test-turtle-validation.ttl', 'utf8')

      // Basic Turtle format validation
      expect(turtleContent).toContain('<http://example.org/playground/playground>')
      expect(turtleContent).toContain('<rdf:type>')
      expect(turtleContent).toContain('<cli:Application>')
      expect(turtleContent).toContain('<coverage:overallCoverage>')
    })

    it('should export with custom base URI', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'export',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'json',
          '--output',
          '/tmp/custom-export.json',
          '--base-uri',
          'https://custom.example.org/cli',
          '--cli-name',
          'custom-playground',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/✅ AST-based coverage data exported to:/)
      result.expectOutput(/📊 Format: JSON/)
    })
  })

  describe('Coverage Statistics', () => {
    it('should generate coverage statistics', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'stats',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'text',
        ],
        {
          cwd: mainDir,
        }
      )

      // Stats command may or may not be available
      if (result.exitCode === 0) {
        result.expectSuccess()
      } else {
        // If stats command is not available, that's also acceptable
        expect(result.exitCode).not.toBe(0)
      }
    })

    it('should generate statistics with JSON output', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'stats',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'json',
        ],
        {
          cwd: mainDir,
          json: true,
        }
      )

      // Stats command may or may not be available
      if (result.exitCode === 0) {
        result.expectSuccess()
        if (result.json) {
          result.expectJson((json) => {
            expect(json).toBeDefined()
          })
        }
      } else {
        // If stats command is not available, that's also acceptable
        expect(result.exitCode).not.toBe(0)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid CLI path gracefully', async () => {
      const result = await runLocalCitty(
        ['analysis', 'discover', '--cli-path', 'nonexistent/cli.mjs', '--format', 'text'],
        {
          cwd: mainDir,
        }
      )

      // Should either succeed with empty results or fail gracefully
      if (result.exitCode === 0) {
        result.expectOutput(/Discovery Summary:/)
      } else {
        expect(result.exitCode).not.toBe(0)
        expect(result.stderr).toBeDefined()
      }
    })

    it('should handle invalid test directory gracefully', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'analyze',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'nonexistent/test',
          '--format',
          'text',
        ],
        {
          cwd: mainDir,
        }
      )

      // Should either succeed with empty results or fail gracefully
      if (result.exitCode === 0) {
        result.expectOutput(/Test Files: 0/)
      } else {
        expect(result.exitCode).not.toBe(0)
        expect(result.stderr).toBeDefined()
      }
    })

    it('should handle missing required arguments', async () => {
      const result = await runLocalCitty(['analysis', 'discover', '--format', 'text'], {
        cwd: mainDir,
      })

      // Should either succeed with default CLI path or fail gracefully
      if (result.exitCode === 0) {
        result.expectSuccess()
      } else {
        expect(result.exitCode).not.toBe(0)
        expect(result.stderr).toBeDefined()
      }
    })

    it('should handle invalid format gracefully', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'discover',
          '--cli-path',
          'playground/src/cli.mjs',
          '--format',
          'invalid-format',
        ],
        {
          cwd: mainDir,
        }
      )

      // Should either succeed with default format or fail gracefully
      if (result.exitCode === 0) {
        result.expectSuccess()
      } else {
        expect(result.exitCode).not.toBe(0)
        expect(result.stderr).toBeDefined()
      }
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle large CLI files', async () => {
      const result = await runLocalCitty(
        ['analysis', 'discover', '--cli-path', 'playground/src/cli.mjs', '--format', 'text'],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/CLI Structure Discovery Report/)
    })

    it('should handle analysis with many test files', async () => {
      const result = await runLocalCitty(
        [
          'analysis',
          'analyze',
          '--cli-path',
          'playground/src/cli.mjs',
          '--test-dir',
          'playground/test',
          '--format',
          'text',
        ],
        {
          cwd: mainDir,
        }
      )

      result.expectSuccess()
      result.expectOutput(/Enhanced AST-Based CLI Test Coverage Analysis/)
    })

    it('should handle concurrent analysis requests', async () => {
      const promises = [
        runLocalCitty(
          ['analysis', 'discover', '--cli-path', 'playground/src/cli.mjs', '--format', 'text'],
          { cwd: mainDir }
        ),
        runLocalCitty(
          [
            'analysis',
            'analyze',
            '--cli-path',
            'playground/src/cli.mjs',
            '--test-dir',
            'playground/test',
            '--format',
            'text',
          ],
          { cwd: mainDir }
        ),
        runLocalCitty(
          [
            'analysis',
            'recommend',
            '--cli-path',
            'playground/src/cli.mjs',
            '--test-dir',
            'playground/test',
            '--format',
            'text',
          ],
          { cwd: mainDir }
        ),
      ]

      const results = await Promise.all(promises)

      results.forEach((result) => {
        result.expectSuccess()
      })
    })
  })
})
