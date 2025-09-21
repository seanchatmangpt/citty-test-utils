import { GenericContainer } from 'testcontainers'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import {
  withErrorRecovery,
  performHealthCheck,
  cleanupResources,
} from '../error-recovery/error-recovery.js'

const execAsync = promisify(exec)
let singleton

// Enhanced Docker availability check with daemon connectivity verification
async function checkDockerAvailable() {
  try {
    // Check docker --version
    await execAsync('docker --version')

    // Verify Docker daemon is actually accessible
    await execAsync('docker info --format "{{.ServerVersion}}"')

    return true
  } catch (error) {
    return false
  }
}

// Enhanced error categorization
function categorizeError(error, context = {}) {
  const message = error.message.toLowerCase()

  if (message.includes('image') || message.includes('pull')) {
    return {
      type: 'IMAGE_PULL_ERROR',
      message: `Docker image pull failed: ${error.message}`,
      suggestion: 'Check image name and registry connectivity',
    }
  }

  if (message.includes('auth') || message.includes('unauthorized')) {
    return {
      type: 'AUTHENTICATION_ERROR',
      message: `Docker registry authentication failed: ${error.message}`,
      suggestion: 'Check registry credentials and permissions',
    }
  }

  if (message.includes('permission') || message.includes('denied')) {
    return {
      type: 'PERMISSION_ERROR',
      message: `Permission denied: ${error.message}`,
      suggestion: 'Check file system permissions and Docker daemon access',
    }
  }

  if (message.includes('space') || message.includes('disk')) {
    return {
      type: 'DISK_SPACE_ERROR',
      message: `Insufficient disk space: ${error.message}`,
      suggestion: 'Free up disk space and retry',
    }
  }

  if (message.includes('memory') || message.includes('oom')) {
    return {
      type: 'MEMORY_ERROR',
      message: `Memory limit exceeded: ${error.message}`,
      suggestion: 'Increase memory limits or reduce resource usage',
    }
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      type: 'TIMEOUT_ERROR',
      message: `Operation timed out: ${error.message}`,
      suggestion: 'Increase timeout or check system performance',
    }
  }

  if (message.includes('network') || message.includes('connection')) {
    return {
      type: 'NETWORK_ERROR',
      message: `Network connectivity issue: ${error.message}`,
      suggestion: 'Check network connectivity and DNS resolution',
    }
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: error.message,
    suggestion: 'Check system logs for more details',
  }
}

// Container health verification
async function verifyContainerHealth(container) {
  try {
    const { exitCode } = await container.exec(['echo', 'health-check'], { timeout: 5000 })
    return exitCode === 0
  } catch (error) {
    return false
  }
}

// Environment validation
function validateEnvironment(env) {
  const errors = []

  // Check for invalid environment variable values
  for (const [key, value] of Object.entries(env)) {
    if (value === null || value === undefined) {
      errors.push(`Environment variable ${key} cannot be null or undefined`)
      continue
    }

    if (typeof value !== 'string') {
      errors.push(`Environment variable ${key} must be a string`)
    }

    // Check for size limits (Docker has ~1MB limit per env var)
    if (typeof value === 'string' && value.length > 1000000) {
      errors.push(`Environment variable ${key} exceeds size limit (1MB)`)
    }

    // Check for invalid characters
    if (typeof value === 'string' && value.includes('\0')) {
      errors.push(`Environment variable ${key} contains null character`)
    }
  }

  return errors
}

// Working directory validation
function validateWorkingDirectory(cwd) {
  if (typeof cwd !== 'string') {
    return ['Working directory must be a string']
  }

  if (!cwd.startsWith('/')) {
    return ['Working directory must be an absolute path']
  }

  return []
}

export async function setupCleanroom({
  rootDir = '.',
  nodeImage = 'node:20-alpine',
  memoryLimit = '512m',
  cpuLimit = '1.0',
  timeout = 60000,
} = {}) {
  if (!singleton) {
    // Check Docker availability first
    const dockerAvailable = await checkDockerAvailable()
    if (!dockerAvailable) {
      throw new Error('Docker is not available. Please ensure Docker is installed and running.')
    }

    try {
      const container = await new GenericContainer(nodeImage)
        .withCopyDirectoriesToContainer([{ source: rootDir, target: '/app' }])
        .withWorkingDir('/app')
        .withCommand(['sleep', 'infinity'])
        .withStartupTimeout(timeout)
        .start()

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
    } catch (error) {
      const categorized = categorizeError(error, { operation: 'setup', nodeImage })
      throw new Error(`${categorized.message}. ${categorized.suggestion}`)
    }
  }
  return singleton
}

export async function runCitty(
  args,
  { json = false, cwd = '/app', timeout = 10000, env = {} } = {}
) {
  if (!singleton) throw new Error('Cleanroom not initialized. Call setupCleanroom first.')

  // Validate inputs
  const envErrors = validateEnvironment(env)
  if (envErrors.length > 0) {
    throw new Error(`Environment validation failed: ${envErrors.join(', ')}`)
  }

  const cwdErrors = validateWorkingDirectory(cwd)
  if (cwdErrors.length > 0) {
    throw new Error(`Working directory validation failed: ${cwdErrors.join(', ')}`)
  }

  // Perform health check
  const isHealthy = await performHealthCheck()
  if (!isHealthy) {
    console.warn('System health check failed, attempting cleanup...')
    await cleanupResources()
  }

  // Verify container is still healthy
  const containerHealthy = await verifyContainerHealth(singleton.container)
  if (!containerHealthy) {
    throw new Error('Container is no longer healthy. Please restart cleanroom.')
  }

  // Execute with error recovery
  return await withErrorRecovery(
    async () => {
      const startTime = Date.now()

      try {
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
        return wrapExpectation(result)
      } catch (error) {
        const durationMs = Date.now() - startTime
        const categorized = categorizeError(error, { operation: 'exec', args, cwd })

        // Handle container execution errors with proper categorization
        const errorResult = {
          exitCode: 1,
          stdout: '',
          stderr: categorized.message,
          args,
          cwd,
          durationMs,
          json: undefined,
          errorType: categorized.type,
          suggestion: categorized.suggestion,
        }

        const { wrapExpectation } = await import('../assertions/assertions.js')
        return wrapExpectation(errorResult)
      }
    },
    { operation: 'cleanroom', args, cwd, timeout, env }
  )
}

export async function teardownCleanroom() {
  if (singleton) {
    try {
      // Verify container is still running before stopping
      const isHealthy = await verifyContainerHealth(singleton.container)

      if (isHealthy) {
        await singleton.container.stop()
      } else {
        console.warn('Container was already unhealthy during teardown')
      }
    } catch (error) {
      const categorized = categorizeError(error, { operation: 'teardown' })
      console.error(`Cleanup warning: ${categorized.message}`)
      // Don't throw - cleanup should be best effort
    } finally {
      singleton = null
    }
  }
}

// Enhanced JSON parsing with better error handling
function safeJsonParse(str) {
  if (!str || typeof str !== 'string') {
    return undefined
  }

  try {
    return JSON.parse(str)
  } catch (error) {
    // Log parsing error for debugging but don't throw
    console.warn(`JSON parsing failed: ${error.message}`)
    return undefined
  }
}

// Signal handling for graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, cleaning up...')
  await teardownCleanroom()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, cleaning up...')
  await teardownCleanroom()
  process.exit(0)
})

// Memory monitoring
if (singleton) {
  setInterval(() => {
    const memUsage = process.memoryUsage()
    if (memUsage.heapUsed > 500 * 1024 * 1024) {
      // 500MB threshold
      console.warn(`High memory usage detected: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`)
    }
  }, 30000) // Check every 30 seconds
}
