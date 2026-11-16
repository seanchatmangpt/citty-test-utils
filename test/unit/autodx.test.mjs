import { describe, it, expect, afterEach } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'pathe'
import {
  retry,
  waitFor,
  createTempFile,
  cleanupTempFiles,
  matchHelp,
  matchVersion,
  helpOutputPattern,
  versionOutputPattern,
  autoHeal,
} from '../../packages/autodx/index.js'

describe('AutoDX QoL Helpers', () => {
  let tempFiles = []

  afterEach(async () => {
    if (tempFiles.length > 0) {
      await cleanupTempFiles(tempFiles)
      tempFiles = []
    }
  })

  it('createTempFile & cleanupTempFiles should work', async () => {
    const file = await createTempFile('hello world', '.txt')
    tempFiles.push(file)
    expect(file).toContain('citty-test-')
    expect(file).toContain('.txt')
    expect(existsSync(file)).toBe(true)
    expect(readFileSync(file, 'utf8')).toBe('hello world')

    await cleanupTempFiles([file])
    expect(existsSync(file)).toBe(false)
  })

  it('retry should retry failing function', async () => {
    let attempts = 0
    const fn = async () => {
      attempts++
      if (attempts < 3) throw new Error('fail')
      return 'success'
    }

    const res = await retry(fn, 5, 10)
    expect(res).toBe('success')
    expect(attempts).toBe(3)
  })

  it('retry should throw last error on failure', async () => {
    const fn = async () => {
      throw new Error('persistent fail')
    }

    await expect(retry(fn, 3, 10)).rejects.toThrow('persistent fail')
  })

  it('waitFor should wait for condition', async () => {
    let met = false
    setTimeout(() => {
      met = true
    }, 50)

    const res = await waitFor(async () => met, 1000, 10)
    expect(res).toBe(true)
  })

  it('waitFor should throw on timeout', async () => {
    const fn = async () => false
    await expect(waitFor(fn, 50, 10)).rejects.toThrow('Condition not met')
  })
})

describe('AutoDX Magic Patterns', () => {
  it('should match help outputs', () => {
    expect(matchHelp('USAGE: mycli <command> [options]')).toBe(true)
    expect(matchHelp('Available COMMANDS:')).toBe(true)
    expect(matchHelp('Show options')).toBe(true)
    expect(matchHelp('Hello world')).toBe(false)
  })

  it('should match versions', () => {
    expect(matchVersion('1.0.0')).toBe(true)
    expect(matchVersion('v2.34.123')).toBe(true)
    expect(matchVersion('version')).toBe(false)
  })
})

describe('AutoDX Self-Healing', () => {
  let tempFiles = []

  afterEach(async () => {
    if (tempFiles.length > 0) {
      await cleanupTempFiles(tempFiles)
      tempFiles = []
    }
  })

  it('autoHeal should heal a failing test file', async () => {
    const content = `
import { describe, it, expect } from 'vitest'

describe('temp fail test', () => {
  it('should be wrong initially', () => {
    expect('hello').toBe('world')
  })
})
`.trim()
    const tempTestFile = await createTempFile(content, '.test.mjs')
    tempFiles.push(tempTestFile)

    expect(existsSync(tempTestFile)).toBe(true)

    // Call autoHeal targeting only this temp test file
    await autoHeal({ cwd: process.cwd(), args: [tempTestFile] })

    // Verify file content was corrected in place
    const updatedContent = readFileSync(tempTestFile, 'utf8')
    expect(updatedContent).toMatch(/expect\('hello'\)\.toBe\(['"]hello['"]\)/)
  })
})
