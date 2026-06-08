import { destr } from 'destr'
import { GenericContainer } from 'testcontainers'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)
let singleton
let execMutex = Promise.resolve()

async function acquireLock() {
  let release
  const nextLock = new Promise((resolve) => {
    release = resolve
  })
  const currentLock = execMutex
  execMutex = nextLock
  await currentLock
  return release
}

// Docker availability check - let it crash if Docker is not available
async function checkDockerAvailable() {
  if (process.env.RUN_CLEANROOM !== '1' && process.env.CI !== 'true') {
    throw new Error('Skipping Docker cleanroom tests for 1000x DX. Set RUN_CLEANROOM=1 or CI=true to execute.')
  }

  // Check docker --version
  await execAsync('docker --version')

  // Verify Docker daemon is actually accessible
  await execAsync('docker info --format "{{.ServerVersion}}"')

  return true
}

// Container health verification - let it crash if container is unhealthy
async function verifyContainerHealth(container) {
  const { exitCode } = await container.exec(['echo', 'health-check'], { timeout: 5000 })
  return exitCode === 0
}

export async function setupCleanroom({
  rootDir = '.',
  nodeImage = 'node:20-alpine',
  memoryLimit = '512m',
  cpuLimit = '1.0',
  timeout = 60000,
} = {}) {
  if (!singleton) {
    // Check Docker availability first - throws instantly if RUN_CLEANROOM!=1
    await checkDockerAvailable()

    const fs = await import('node:fs')
    const path = await import('pathe')
    const pkgPath = path.resolve(rootDir, 'package.json')
    let isCittyTestUtilsRoot = false
    try {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        if (pkg.name === 'citty-test-utils') {
          isCittyTestUtilsRoot = true
        }
      }
    } catch (e) {}

    const dirs = []
    const files = []

    if (isCittyTestUtilsRoot) {
      if (fs.existsSync(path.resolve(rootDir, 'src'))) {
        dirs.push({ source: path.resolve(rootDir, 'src'), target: '/app/src' })
      }
      if (fs.existsSync(path.resolve(rootDir, 'packages'))) {
        dirs.push({ source: path.resolve(rootDir, 'packages'), target: '/app/packages' })
      }
      if (fs.existsSync(path.resolve(rootDir, 'templates'))) {
        dirs.push({ source: path.resolve(rootDir, 'templates'), target: '/app/templates' })
      }
      if (fs.existsSync(path.resolve(rootDir, 'playground'))) {
        dirs.push({ source: path.resolve(rootDir, 'playground'), target: '/app/playground' })
      }
      if (fs.existsSync(path.resolve(rootDir, 'projects'))) {
        dirs.push({ source: path.resolve(rootDir, 'projects'), target: '/app/projects' })
      }
      if (fs.existsSync(path.resolve(rootDir, 'node_modules'))) {
        dirs.push({ source: path.resolve(rootDir, 'node_modules'), target: '/app/node_modules' })
      }
      if (fs.existsSync(path.resolve(rootDir, 'package.json'))) {
        files.push({ source: path.resolve(rootDir, 'package.json'), target: '/app/package.json' })
      }
      if (fs.existsSync(path.resolve(rootDir, 'index.js'))) {
        files.push({ source: path.resolve(rootDir, 'index.js'), target: '/app/index.js' })
      }
    } else {
      dirs.push({ source: rootDir, target: '/app' })
    }

    let containerBuilder = new GenericContainer(nodeImage)
      .withWorkingDir('/app')
      .withCommand(['sleep', 'infinity'])
      .withStartupTimeout(timeout)

    if (dirs.length > 0) {
      containerBuilder = containerBuilder.withCopyDirectoriesToContainer(dirs)
    }
    if (files.length > 0) {
      containerBuilder = containerBuilder.withCopyFilesToContainer(files)
    }

    const container = await containerBuilder.start()

    // Verify container health - let it crash if unhealthy
    const isHealthy = await verifyContainerHealth(container)
    if (!isHealthy) {
      await container.stop()
      throw new Error('Container failed health check after startup')
    }

    singleton = {
      container,
      memoryLimit,
      cpuLimit,
      timeout,
      createdAt: Date.now(),
    }
  }
  return singleton
}

export function isCleanroomActive() {
  return !!singleton
}

export async function runCitty(
  args,
  { json = false, cwd = '/app', timeout = 10000, env = {}, cliPath } = {}
) {
  if (!singleton) throw new Error('Cleanroom not initialized. Call setupCleanroom first.')

  const release = await acquireLock()
  try {
    // Verify container is still healthy - let it crash if unhealthy
    const containerHealthy = await verifyContainerHealth(singleton.container)
    if (!containerHealthy) {
      throw new Error('Container is no longer healthy. Please restart cleanroom.')
    }

    // Execute command directly - let it crash if it fails
    const startTime = Date.now()

    // Check if we should use the test CLI
    const useTestCli = env.TEST_CLI === 'true'
    let finalCliPath = cliPath
    if (!finalCliPath) {
      if (useTestCli) {
        finalCliPath = 'src/cli.mjs'
      } else if (process.env.TEST_CLI_PATH) {
        const path = await import('pathe')
        finalCliPath = path.relative(process.cwd(), path.resolve(process.env.TEST_CLI_PATH))
      } else {
        finalCliPath = 'src/cli.mjs'
      }
    }

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Command timed out after ${timeout}ms`)), timeout)
    })

    // Execute command with timeout
    const execPromise = singleton.container.exec(['node', finalCliPath, ...args], {
      workdir: cwd,
      env: {
        ...env,
        CITTY_DISABLE_DOMAIN_DISCOVERY: 'true',
      },
    })

    const { exitCode, output, stderr } = await Promise.race([execPromise, timeoutPromise])
    const durationMs = Date.now() - startTime

    const result = {
      exitCode,
      stdout: output.trim(),
      stderr: stderr.trim(),
      args,
      cwd,
      durationMs,
      json: json
        ? safeJsonParse(output)
        : args.includes('--json')
        ? safeJsonParse(output)
        : undefined,
    }

    // Wrap in expectations layer
    const { wrapExpectation } = await import('@un-test/core')
    const wrapped = wrapExpectation(result)
    wrapped.result = result
    return wrapped
  } finally {
    release()
  }
}

export async function teardownCleanroom() {
  if (singleton) {
    // Verify container is still running before stopping - let it crash if unhealthy
    const isHealthy = await verifyContainerHealth(singleton.container)

    if (isHealthy) {
      await singleton.container.stop()
    } else {
      throw new Error('Container was already unhealthy during teardown')
    }

    singleton = null
  }
}

function safeJsonParse(str) {
  try {
    return destr(str)
  } catch {
    return undefined
  }
}

export async function runCittySafe(args, options = {}) {
  try {
    return await runCitty(args, options)
  } catch (e) {
    const { consola, wrapExpectation } = await import('@un-test/core')
    consola.fatal(`❌ runCittySafe failed!`)
    return wrapExpectation({
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: e.message || String(e),
      args,
      cwd: options?.cwd || process.cwd(),
      durationMs: 0,
      command: `runCitty(${JSON.stringify(args)})`,
      error: e,
    })
  }
}
