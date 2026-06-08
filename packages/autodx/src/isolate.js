import { consola } from '@un-test/core'
import { resolve } from 'pathe'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

/**
 * Auto Isolate: Imperceptible Docker Isolation
 * Scans the project and automatically scaffolds a Docker cleanroom.
 */
export async function autoIsolate({ cwd = process.cwd() }) {
  consola.info('🐳 AutoDX Isolate initialized...')
  
  const pkgPath = resolve(cwd, 'package.json')
  let nodeVersion = '20-alpine'
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
    if (pkg.engines && pkg.engines.node) {
      const match = pkg.engines.node.match(/[\d]+/)
      if (match) nodeVersion = `${match[0]}-alpine`
    }
  }

  const dockerfileContent = `
FROM node:${nodeVersion}

WORKDIR /app

# Copy package management files
COPY package*.json pnpm-lock.yaml yarn.lock ./

# Install dependencies (fallback to npm if others fail)
RUN if [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \\
    elif [ -f yarn.lock ]; then yarn install; \\
    else npm install; fi

# Copy project files
COPY . .

# Link CLI if possible
RUN npm link || true

ENV CI=true
ENV RUN_CLEANROOM=0
`.trim()

  const dockerfilePath = resolve(cwd, 'Dockerfile')
  if (!existsSync(dockerfilePath)) {
    await writeFile(dockerfilePath, dockerfileContent, 'utf8')
    consola.success('✅ Generated optimized Dockerfile for cleanroom isolation.')
  } else {
    consola.info('🐳 Dockerfile already exists, skipping generation.')
  }

  // Update vitest config
  const vitestConfigPath = resolve(cwd, 'vitest.config.js')
  if (existsSync(vitestConfigPath)) {
    let config = await readFile(vitestConfigPath, 'utf8')
    if (!config.includes('cleanroom')) {
      // Basic injection attempt
      config = config.replace('test: {', 'test: {\n    citty: {\n      cleanroom: { enabled: true }\n    },')
      await writeFile(vitestConfigPath, config, 'utf8')
      consola.success('✅ Injected cleanroom configuration into vitest.config.js')
    } else {
      consola.info('🐳 Cleanroom configuration already present in vitest.config.js')
    }
  } else {
    consola.warn('⚠️ No vitest.config.js found. Run `utu auto qol` first.')
  }
}
