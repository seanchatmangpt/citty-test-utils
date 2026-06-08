import { consola } from '@un-test/core'
import { resolve } from 'pathe'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'

/**
 * Auto Mock: Zero-Friction Determinism
 * Scaffolds network request interception fixtures.
 */
export async function autoMock({ cwd = process.cwd() }) {
  consola.info('🛜 AutoDX Mock initialized...')
  
  const mockDir = resolve(cwd, '__mocks__')
  if (!existsSync(mockDir)) {
    await mkdir(mockDir, { recursive: true })
  }

  const setupContent = `
// Auto-generated Network Interception Setup
import { beforeAll, afterAll, vi } from 'vitest'

const originalFetch = globalThis.fetch

beforeAll(() => {
  globalThis.fetch = vi.fn(async (url, options) => {
    // Intercept requests and return fixtures from __mocks__
    console.log('[AutoDX Mock] Intercepted fetch to:', url)
    return new Response(JSON.stringify({ autoMocked: true, url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  })
})

afterAll(() => {
  globalThis.fetch = originalFetch
})
`.trim()

  const setupPath = resolve(cwd, 'test/setup.mock.js')
  await writeFile(setupPath, setupContent, 'utf8')

  consola.success('✅ Generated AutoDX network mocking interceptors.')
  consola.info('Include test/setup.mock.js in your vitest.config.js setupFiles.')
}
