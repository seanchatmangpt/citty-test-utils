import { GenericContainer } from 'testcontainers'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)
let singleton

const CONTAINER_LABEL = 'ctu-test'
const CONTAINER_TIMEOUT = 60000
const HEALTH_CHECK_TIMEOUT = 5000
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

/**
 * Check if Docker is available and running
 * @returns {Promise<boolean>} True if Docker is available
 */
async function checkDockerAvailable() {
  // Check docker version
  await execAsync('docker --version')

  // Verify Docker daemon is actually accessible
  await execAsync('docker info --format "{{.ServerVersion}}"')

  return true
}

/**
 * Clean up any existing test containers
 */
async function cleanupExistingContainers() {
  // Remove all containers with ctu-test label
  await execAsync(
    `docker rm -f $(docker ps -aq --filter "label=${CONTAINER_LABEL}") 2>/dev/null || true`
  )
}

/**
 * Verify container health
 * @param {Object} container - Container instance
 * @returns {Promise<boolean>} True if container is healthy
 */
async function verifyContainerHealth(container) {
  const { exitCode } = await container.exec(['echo', 'health-check'], {
    timeout: HEALTH_CHECK_TIMEOUT,
  })
  return exitCode === 0
}

/**
 * Retry an async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise<*>} Result of the function
 */
async function retryWithBackoff(fn, retries = MAX_RETRIES, delay = RETRY_DELAY) {
  for (let i = 0; i < retries; i++) {
    const { result, error } = await fn().catch((error) => ({ error }))

    if (!error) {
      return result
    }

    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)))
    } else {
      throw error
    }
  }
}

/**
 * Setup cleanroom environment with Docker
 * @param {Object} options - Setup options
 * @returns {Promise<Object>} Cleanroom instance
 */
export async function setupCleanroom({
  rootDir = '.',
  nodeImage = 'node:20-alpine',
  memoryLimit = '512m',
  cpuLimit = '1.0',
  timeout = CONTAINER_TIMEOUT,
} = {}) {
  if (!singleton) {
    // Check Docker availability first
    await checkDockerAvailable()

    // Clean up any previous test containers
    await cleanupExistingContainers()

    // Create container with retry logic for transient errors
    const container = await retryWithBackoff(async () => {
      return await new GenericContainer(nodeImage)
        .withCopyDirectoriesToContainer([{ source: rootDir, target: '/app' }])
        .withWorkingDir('/app')
        .withCommand(['sleep', 'infinity'])
        .withStartupTimeout(timeout)
        .withLabels({ [CONTAINER_LABEL]: 'true' })
        .start()
    })

    // Verify container health
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

/**
 * Run command in cleanroom
 * @param {string[]} args - Command arguments
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result
 */
export async function runCitty(
  args,
  { json = false, cwd = '/app', timeout = 10000, env = {} } = {}
) {
  if (!singleton) throw new Error('Cleanroom not initialized. Call setupCleanroom first.')

  // Verify container is still healthy
  const containerHealthy = await verifyContainerHealth(singleton.container)
  if (!containerHealthy) {
    throw new Error('Container is no longer healthy. Please restart cleanroom.')
  }

  const startTime = Date.now()

  // Use src/cli.mjs for command execution
  const cliPath = 'src/cli.mjs'

  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Command timed out after ${timeout}ms`)), timeout)
  })

  // Execute command with timeout and retry logic
  const execPromise = retryWithBackoff(async () => {
    return await singleton.container.exec(['node', cliPath, ...args], {
      workdir: cwd,
      env: {
        ...env,
        CITTY_DISABLE_DOMAIN_DISCOVERY: 'true',
      },
    })
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

/**
 * Teardown cleanroom environment
 */
export async function teardownCleanroom() {
  if (singleton) {
    // Verify container is still running before stopping
    const isHealthy = await verifyContainerHealth(singleton.container).catch(() => false)

    if (isHealthy) {
      await singleton.container.stop()
    }

    // Cleanup all test containers
    await cleanupExistingContainers()

    singleton = null
  }
}

/**
 * Safe JSON parsing
 * @param {string} str - String to parse
 * @returns {Object|undefined} Parsed JSON or undefined
 */
function safeJsonParse(str) {
  try {
    return JSON.parse(str)
  } catch {
    return undefined
  }
}
