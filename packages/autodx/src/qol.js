import { resolve } from 'pathe'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
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
