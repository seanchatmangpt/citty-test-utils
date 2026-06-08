import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, runLocalCittySafe } from '@un-test/runners-local'
import { existsSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

describe('Challenger Adversarial Stress Tests', () => {
  const testDir = join(process.cwd(), '.test-challenger-stress')
  const testCliPath = join(testDir, 'test-cli.mjs')

  // Create test CLI
  beforeAll(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }

    // A test CLI that echoes arguments and returns specific statuses
    const cliContent = `#!/usr/bin/env node
const args = process.argv.slice(2)
if (args.includes('echo')) {
  console.log(args.slice(1).join(' '))
} else if (args.includes('exit')) {
  process.exit(parseInt(args[args.indexOf('exit') + 1] || '0'))
} else {
  console.log('default output')
}
`
    writeFileSync(testCliPath, cliContent, { encoding: 'utf8', mode: 0o755 })
  })

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Null / Undefined / Missing Options', () => {
    it('should use default config and succeed when arguments are missing or null/undefined in runLocalCitty', () => {
      // Missing entirely
      const res1 = runLocalCitty()
      expect(res1.success).toBe(true)

      // Null options
      const res2 = runLocalCitty(null)
      expect(res2.success).toBe(true)

      // Undefined options
      const res3 = runLocalCitty(undefined)
      expect(res3.success).toBe(true)
    })

    it('should use default config and succeed when arguments are missing or null/undefined in runLocalCittySafe', () => {
      const res1 = runLocalCittySafe()
      expect(res1.success).toBe(true)

      const res2 = runLocalCittySafe(null)
      expect(res2.success).toBe(true)

      const res3 = runLocalCittySafe(undefined)
      expect(res3.success).toBe(true)
    })

    it('should handle null positional argument with options object in runLocalCitty', () => {
      expect(() => runLocalCitty(null, { cliPath: testCliPath })).toThrow(TypeError)
      expect(() => runLocalCitty(undefined, { cliPath: testCliPath })).toThrow(TypeError)
    })

    it('should handle null positional argument with options object in runLocalCittySafe', () => {
      const res1 = runLocalCittySafe(null, { cliPath: testCliPath })
      expect(res1.success).toBe(false)
      expect(res1.stderr).toContain('Command arguments must be a string or an array of strings')

      const res2 = runLocalCittySafe(undefined, { cliPath: testCliPath })
      expect(res2.success).toBe(false)
      expect(res2.stderr).toContain('Command arguments must be a string or an array of strings')
    })
  })

  describe('Empty Strings & Empty Arrays', () => {
    it('should handle empty string in positional runLocalCitty', () => {
      const res = runLocalCitty('', { cliPath: testCliPath })
      expect(res.success).toBe(true)
      expect(res.args).toEqual([])
      expect(res.stdout).toBe('default output')
    })

    it('should handle empty array in positional runLocalCitty', () => {
      const res = runLocalCitty([], { cliPath: testCliPath })
      expect(res.success).toBe(true)
      expect(res.args).toEqual([])
      expect(res.stdout).toBe('default output')
    })

    it('should handle empty string in positional runLocalCittySafe', () => {
      const res = runLocalCittySafe('', { cliPath: testCliPath })
      expect(res.success).toBe(true)
      expect(res.args).toEqual([])
      expect(res.stdout).toBe('default output')
    })

    it('should handle empty array in positional runLocalCittySafe', () => {
      const res = runLocalCittySafe([], { cliPath: testCliPath })
      expect(res.success).toBe(true)
      expect(res.args).toEqual([])
      expect(res.stdout).toBe('default output')
    })
  })

  describe('Spaces in Filenames / Paths', () => {
    it('should support execution when cliPath contains spaces', () => {
      const spaceDir = join(testDir, 'space path')
      if (!existsSync(spaceDir)) {
        mkdirSync(spaceDir, { recursive: true })
      }
      const spaceCliPath = join(spaceDir, 'space-cli.mjs')
      const cliContent = `#!/usr/bin/env node\nconsole.log("space success")\n`
      writeFileSync(spaceCliPath, cliContent, { encoding: 'utf8', mode: 0o755 })

      const res = runLocalCitty([], { cliPath: spaceCliPath })
      expect(res.success).toBe(true)
      expect(res.stdout).toBe('space success')
    })

    it('should support execution when cwd contains spaces', () => {
      const spaceDir = join(testDir, 'cwd space path')
      if (!existsSync(spaceDir)) {
        mkdirSync(spaceDir, { recursive: true })
      }
      const relativeCliPath = './space-cli.mjs'
      const cliContent = `#!/usr/bin/env node\nconsole.log("cwd space success")\n`
      writeFileSync(join(spaceDir, 'space-cli.mjs'), cliContent, { encoding: 'utf8', mode: 0o755 })

      const res = runLocalCitty([], { cliPath: relativeCliPath, cwd: spaceDir })
      expect(res.success).toBe(true)
      expect(res.stdout).toBe('cwd space success')
    })
  })

  describe('Special Characters & Command Injection Prevention', () => {
    it('should escape special shell characters and prevent command injection', () => {
      // If the arguments are parsed or evaluated by a shell, this might run 'echo injected'
      const res = runLocalCitty(['echo', 'hello; echo injected', 'test | cat', '&&', 'exit 1'], { cliPath: testCliPath })
      expect(res.success).toBe(true)
      // The child process should receive these as literal arguments, not command operators
      expect(res.args).toEqual(['echo', 'hello; echo injected', 'test | cat', '&&', 'exit 1'])
      expect(res.stdout).toBe('hello; echo injected test | cat && exit 1')
    })

    it('should handle quotes inside arguments literally', () => {
      const res = runLocalCitty(['echo', '"quoted"', "'single-quoted'"], { cliPath: testCliPath })
      expect(res.success).toBe(true)
      expect(res.stdout).toBe('"quoted" \'single-quoted\'')
    })

    it('should handle backslashes and environment variables literally', () => {
      const res = runLocalCitty(['echo', '\\path\\to\\file', '$TEST_VAR'], { cliPath: testCliPath })
      expect(res.success).toBe(true)
      expect(res.stdout).toBe('\\path\\to\\file $TEST_VAR')
    })
  })

  describe('Invalid Fields validation', () => {
    it('should throw when cliPath is empty string in options', () => {
      expect(() => runLocalCitty({ cliPath: '' })).toThrow('cliPath cannot be empty')
    })

    it('should throw when cliPath is not a string', () => {
      expect(() => runLocalCitty({ cliPath: 123 })).toThrow('cliPath must be a string')
    })

    it('should throw when timeout is negative or zero', () => {
      expect(() => runLocalCitty({ cliPath: testCliPath, timeout: -1 })).toThrow('timeout must be a positive number')
      expect(() => runLocalCitty({ cliPath: testCliPath, timeout: 0 })).toThrow('timeout must be a positive number')
    })

    it('should throw when env is not an object', () => {
      expect(() => runLocalCitty({ cliPath: testCliPath, env: 'env' })).toThrow('env must be an object')
    })

    it('should throw when env values are not strings', () => {
      expect(() => runLocalCitty({ cliPath: testCliPath, env: { KEY: 123 } })).toThrow('env value for key "KEY" must be a string')
    })
  })
})
