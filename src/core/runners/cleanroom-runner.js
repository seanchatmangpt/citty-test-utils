import { GenericContainer } from 'testcontainers'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)
let singleton

// Docker availability check - let it crash if Docker is not available
async function checkDockerAvailable() {
  // Check docker --version
  await execAsync('docker --version')

  // Verify Docker daemon is actually accessible
  await execAsync('docker info --format "{{.ServerVersion}}"')

  return true
}

// No error categorization - let errors be raw

// Container health verification - let it crash if container is unhealthy
async function verifyContainerHealth(container) {
  const { exitCode } = await container.exec(['echo', 'health-check'], { timeout: 5000 })
  return exitCode === 0
}

// No validation - let invalid inputs crash

export async function setupCleanroom({
  rootDir = '.',
  nodeImage = 'node:20-alpine',
  memoryLimit = '512m',
  cpuLimit = '1.0',
  timeout = 60000,
} = {}) {
  if (!singleton) {
    // Check Docker availability first - let it crash if not available
    await checkDockerAvailable()

    const container = await new GenericContainer(nodeImage)
      .withCopyDirectoriesToContainer([{ source: rootDir, target: '/app' }])
      .withWorkingDir('/app')
      .withCommand(['sleep', 'infinity'])
      .withStartupTimeout(timeout)
      .start()

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

export async function runCitty(
  args,
  { json = false, cwd = '/app', timeout = 10000, env = {} } = {}
) {
  if (!singleton) throw new Error('Cleanroom not initialized. Call setupCleanroom first.')

  // Verify container is still healthy - let it crash if unhealthy
  const containerHealthy = await verifyContainerHealth(singleton.container)
  if (!containerHealthy) {
    throw new Error('Container is no longer healthy. Please restart cleanroom.')
  }

  // Execute command directly - let it crash if it fails
  const startTime = Date.now()

  // Check if we should use the test CLI
  const useTestCli = env.TEST_CLI === 'true'
  const cliPath = useTestCli ? 'src/cli.mjs' : 'src/cli.mjs' // Use src/cli.mjs

  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Command timed out after ${timeout}ms`)), timeout)
  })

  // Execute command with timeout
  const execPromise = singleton.container.exec(['node', cliPath, ...args], {
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
  const { wrapExpectation } = await import('../assertions/assertions.js')
  const wrapped = wrapExpectation(result)
  wrapped.result = result
  return wrapped
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

// No defensive patterns - let JSON parsing fail, let signals crash, no monitoring

function safeJsonParse(str) {
  try {
    return JSON.parse(str)
  } catch {
    return undefined
  }
}
