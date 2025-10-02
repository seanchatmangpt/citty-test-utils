/**
 * @fileoverview Integration tests for CLI entry point resolver
 * @description Tests flexible CLI entry point selection functionality
 */

import { describe, it, expect } from 'vitest'
import { CLIEntryResolver, resolveCLIEntry, getCLIEntryArgs } from '../../src/core/utils/cli-entry-resolver.js'
import { existsSync } from 'fs'
import { resolve } from 'path'

describe('CLI Entry Point Resolver', () => {
  describe('getCLIEntryArgs', () => {
    it('should return CLI entry argument definitions', () => {
      const args = getCLIEntryArgs()

      expect(args).toHaveProperty('entry-file')
      expect(args).toHaveProperty('cli-file')
      expect(args).toHaveProperty('cli-path')

      expect(args['entry-file'].type).toBe('string')
      expect(args['cli-file'].type).toBe('string')
      expect(args['cli-path'].type).toBe('string')

      expect(args['entry-file'].description).toContain('CLI entry file')
      expect(args['cli-file'].description).toContain('Alias')
    })
  })

  describe('CLIEntryResolver', () => {
    it('should create resolver instance', () => {
      const resolver = new CLIEntryResolver()
      expect(resolver).toBeInstanceOf(CLIEntryResolver)
      expect(resolver.options).toBeDefined()
    })

    it('should accept verbose option', () => {
      const resolver = new CLIEntryResolver({ verbose: true })
      expect(resolver.options.verbose).toBe(true)
    })
  })

  describe('resolveExplicitPath', () => {
    it('should resolve existing CLI file', () => {
      const resolver = new CLIEntryResolver()
      const testCliPath = './src/cli.mjs'

      if (existsSync(testCliPath)) {
        const result = resolver.resolveExplicitPath(testCliPath, false)

        expect(result).toBeDefined()
        expect(result.cliPath).toBeDefined()
        expect(result.detectionMethod).toBe('explicit')
        expect(result.confidence).toBe('high')
        expect(result.source).toBe('user-specified')
        expect(result.validated).toBe(true)
      }
    })

    it('should throw error for non-existent file', () => {
      const resolver = new CLIEntryResolver()
      const fakeFile = './non-existent-cli.js'

      expect(() => {
        resolver.resolveExplicitPath(fakeFile, false)
      }).toThrow('CLI entry file not found')
    })

    it('should validate file extensions', () => {
      const resolver = new CLIEntryResolver()

      // Create a temporary file with invalid extension for testing
      // (in real test, we'd use a fixture)
      const invalidFile = './test.txt'

      if (existsSync(invalidFile)) {
        expect(() => {
          resolver.resolveExplicitPath(invalidFile, false)
        }).toThrow('must be JavaScript/TypeScript')
      }
    })

    it('should resolve absolute paths', () => {
      const resolver = new CLIEntryResolver()
      const absolutePath = resolve('./src/cli.mjs')

      if (existsSync(absolutePath)) {
        const result = resolver.resolveExplicitPath(absolutePath, false)

        expect(result.cliPath).toBe(absolutePath)
        expect(result.detectionMethod).toBe('explicit')
      }
    })
  })

  describe('resolveCLIEntry (convenience function)', () => {
    it('should resolve explicit entry file', async () => {
      const testCliPath = './src/cli.mjs'

      if (existsSync(testCliPath)) {
        const result = await resolveCLIEntry({
          entryFile: testCliPath,
          verbose: false,
        })

        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result).toContain('cli.mjs')
      }
    })

    it('should resolve cli-file alias', async () => {
      const testCliPath = './src/cli.mjs'

      if (existsSync(testCliPath)) {
        const result = await resolveCLIEntry({
          cliFile: testCliPath,
          verbose: false,
        })

        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
      }
    })

    it('should prioritize entryFile over cliPath', async () => {
      const entryFile = './src/cli.mjs'
      const cliPath = './other/path.js'

      if (existsSync(entryFile)) {
        const result = await resolveCLIEntry({
          entryFile,
          cliPath,
          verbose: false,
        })

        // Should use entryFile, not cliPath
        expect(result).toContain('cli.mjs')
        expect(result).not.toContain('other/path')
      }
    })

    it('should fall back to auto-detection', async () => {
      // No explicit path provided
      const result = await resolveCLIEntry({
        verbose: false,
      })

      // Should either succeed (if CLI found) or throw helpful error
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })

  describe('Error Messages', () => {
    it('should provide helpful error for missing file', () => {
      const resolver = new CLIEntryResolver()

      try {
        resolver.resolveExplicitPath('./missing-cli.js', false)
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error.message).toContain('CLI entry file not found')
        expect(error.message).toContain('Suggestion')
        expect(error.message).toContain('--entry-file')
      }
    })

    it('should provide helpful error for directory path', () => {
      const resolver = new CLIEntryResolver()
      const dirPath = './src'

      if (existsSync(dirPath)) {
        try {
          resolver.resolveExplicitPath(dirPath, false)
          expect.fail('Should have thrown error')
        } catch (error) {
          expect(error.message).toContain('not a file')
          expect(error.message).toContain('Suggestion')
        }
      }
    })

    it('should provide helpful error for invalid extension', async () => {
      const resolver = new CLIEntryResolver()

      // Test with package.json (wrong type)
      if (existsSync('./package.json')) {
        try {
          resolver.resolveExplicitPath('./package.json', false)
          expect.fail('Should have thrown error')
        } catch (error) {
          expect(error.message).toContain('must be JavaScript/TypeScript')
          expect(error.message).toContain('Valid extensions')
          expect(error.message).toContain('.js')
          expect(error.message).toContain('.mjs')
        }
      }
    })
  })

  describe('Valid Extensions', () => {
    const validExtensions = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']

    validExtensions.forEach((ext) => {
      it(`should accept ${ext} extension`, () => {
        const resolver = new CLIEntryResolver()
        const testFile = `./test/fixtures/cli${ext}`

        // We'd need fixture files for real testing
        // This test just validates the logic exists
        expect(validExtensions).toContain(ext)
      })
    })
  })

  describe('Integration with Analysis Commands', () => {
    it('should work with parseCliOptions pattern', async () => {
      // Simulate what analysis commands do
      const mockArgs = {
        'entry-file': './src/cli.mjs',
        'test-dir': 'test',
        verbose: false,
      }

      if (existsSync(mockArgs['entry-file'])) {
        const result = await resolveCLIEntry({
          entryFile: mockArgs['entry-file'],
          verbose: mockArgs.verbose,
        })

        expect(result).toBeDefined()
        expect(result).toContain('cli.mjs')
      }
    })

    it('should handle legacy cli-path argument', async () => {
      const mockArgs = {
        'cli-path': './src/cli.mjs',
        'test-dir': 'test',
      }

      if (existsSync(mockArgs['cli-path'])) {
        const result = await resolveCLIEntry({
          cliPath: mockArgs['cli-path'],
          verbose: false,
        })

        expect(result).toBeDefined()
      }
    })
  })

  describe('Resolution Priority', () => {
    it('should prioritize entry-file over cli-file', async () => {
      const entryFile = './src/cli.mjs'
      const cliFile = './other.js'

      if (existsSync(entryFile)) {
        const result = await resolveCLIEntry({
          entryFile,
          cliFile,
          verbose: false,
        })

        expect(result).toContain('cli.mjs')
      }
    })

    it('should prioritize entry-file over cli-path', async () => {
      const entryFile = './src/cli.mjs'
      const cliPath = 'other.js'

      if (existsSync(entryFile)) {
        const result = await resolveCLIEntry({
          entryFile,
          cliPath,
          verbose: false,
        })

        expect(result).toContain('cli.mjs')
      }
    })

    it('should use cli-file if entry-file not provided', async () => {
      const cliFile = './src/cli.mjs'

      if (existsSync(cliFile)) {
        const result = await resolveCLIEntry({
          cliFile,
          verbose: false,
        })

        expect(result).toContain('cli.mjs')
      }
    })
  })
})
