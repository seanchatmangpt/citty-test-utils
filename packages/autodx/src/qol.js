import { resolve, dirname, join } from 'pathe'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { consola } from '@un-test/core'

/**
 * Hyper Advanced AutoQoL Zero-Config
 * Ensures all necessary config files exist for an optimal developer experience.
 */
export async function autoQoLZeroConfig({ cwd = process.cwd() }) {
  consola.info('🛠️ Initializing AutoQoL Zero-Config environment...')

  const vitestConfigPath = resolve(cwd, 'vitest.config.js')
  if (!existsSync(vitestConfigPath)) {
    consola.start('Generating zero-config vitest.config.js...')
    const configContent = `
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
`.trim()
    await writeFile(vitestConfigPath, configContent, 'utf8')
    consola.success('✅ Zero-config vitest.config.js generated!')
  } else {
    consola.success('✅ Configuration already optimized.')
  }

  // Generate a standard .gitignore if needed
  const gitignorePath = resolve(cwd, '.gitignore')
  if (!existsSync(gitignorePath)) {
    await writeFile(gitignorePath, 'node_modules\ndist\ncoverage\n.env\n', 'utf8')
    consola.success('✅ Default .gitignore generated.')
  }
}

/**
 * Retries a function up to a specified number of times with a delay.
 */
export async function retry(fn, retries = 5, delay = 10) {
  let lastError
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i < retries - 1 && delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError
}

/**
 * Polls a condition function until it returns true or times out.
 */
export async function waitFor(conditionFn, timeout = 5000, interval = 100) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await conditionFn()) return true
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  throw new Error(`Condition not met within ${timeout}ms`)
}

const createdTempFiles = new Set()

/**
 * Creates a temporary file in a designated sandbox directory and registers it for cleanup.
 */
export async function createTempFile(content, extension = '.txt') {
  const { mkdtempSync, writeFileSync } = await import('node:fs')
  // Use project test directory for test files so Vitest include pattern matches them
  const targetDir = extension.includes('.test.') ? resolve(process.cwd(), 'test') : tmpdir()
  const tempDir = mkdtempSync(join(targetDir, 'citty-test-'))
  const tempFile = join(tempDir, `test${extension}`)
  writeFileSync(tempFile, content)
  createdTempFiles.add(tempFile)
  return tempFile
}

/**
 * Cleans up all temporary files registered during the session.
 */
export async function cleanupTempFiles(files) {
  const { unlinkSync, rmdirSync } = await import('node:fs')
  const filesToClean = files || Array.from(createdTempFiles)
  for (const file of filesToClean) {
    try {
      unlinkSync(file)
      rmdirSync(dirname(file))
      createdTempFiles.delete(file)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }
}
