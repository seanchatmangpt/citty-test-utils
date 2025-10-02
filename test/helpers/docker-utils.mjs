// test/helpers/docker-utils.mjs
// Docker-specific test utilities

import { execAsync, waitForCondition } from './test-utils.mjs'

/**
 * Check if Docker daemon is running
 * @returns {Promise<boolean>} True if Docker is running
 */
export async function isDockerRunning() {
  try {
    await execAsync('docker info')
    return true
  } catch {
    return false
  }
}

/**
 * Get running Docker containers by label
 * @param {string} label - Container label
 * @returns {Promise<Array<string>>} Array of container IDs
 */
export async function getContainersByLabel(label) {
  try {
    const { stdout } = await execAsync(`docker ps -aq --filter "label=${label}"`)
    return stdout.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Stop and remove Docker containers by label
 * @param {string} label - Container label
 * @returns {Promise<void>}
 */
export async function cleanupContainersByLabel(label) {
  const containers = await getContainersByLabel(label)

  if (containers.length > 0) {
    try {
      await execAsync(`docker rm -f ${containers.join(' ')}`)
    } catch (error) {
      console.warn(`Warning: Failed to cleanup containers: ${error.message}`)
    }
  }
}

/**
 * Wait for container to be ready
 * @param {string} containerId - Container ID
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<boolean>} True if container is ready
 */
export async function waitForContainer(containerId, timeout = 30000) {
  return await waitForCondition(async () => {
    try {
      const { stdout } = await execAsync(`docker inspect -f '{{.State.Running}}' ${containerId}`)
      return stdout.trim() === 'true'
    } catch {
      return false
    }
  }, timeout)
}

/**
 * Check if container is healthy
 * @param {string} containerId - Container ID
 * @returns {Promise<boolean>} True if healthy
 */
export async function isContainerHealthy(containerId) {
  try {
    const { stdout } = await execAsync(`docker inspect -f '{{.State.Health.Status}}' ${containerId}`)
    return stdout.trim() === 'healthy'
  } catch {
    return false
  }
}

/**
 * Get container logs
 * @param {string} containerId - Container ID
 * @param {number} lines - Number of lines to retrieve
 * @returns {Promise<string>} Container logs
 */
export async function getContainerLogs(containerId, lines = 100) {
  try {
    const { stdout } = await execAsync(`docker logs --tail ${lines} ${containerId}`)
    return stdout
  } catch (error) {
    return ''
  }
}

/**
 * Execute command in container
 * @param {string} containerId - Container ID
 * @param {string} command - Command to execute
 * @returns {Promise<object>} Execution result
 */
export async function execInContainer(containerId, command) {
  try {
    const { stdout, stderr } = await execAsync(`docker exec ${containerId} ${command}`)
    return { stdout, stderr, exitCode: 0 }
  } catch (error) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      exitCode: error.code || 1
    }
  }
}

/**
 * Copy file to container
 * @param {string} containerId - Container ID
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination path in container
 * @returns {Promise<boolean>} True if successful
 */
export async function copyToContainer(containerId, sourcePath, destPath) {
  try {
    await execAsync(`docker cp ${sourcePath} ${containerId}:${destPath}`)
    return true
  } catch {
    return false
  }
}

/**
 * Copy file from container
 * @param {string} containerId - Container ID
 * @param {string} sourcePath - Source path in container
 * @param {string} destPath - Destination file path
 * @returns {Promise<boolean>} True if successful
 */
export async function copyFromContainer(containerId, sourcePath, destPath) {
  try {
    await execAsync(`docker cp ${containerId}:${sourcePath} ${destPath}`)
    return true
  } catch {
    return false
  }
}

/**
 * Check if Docker Compose is available
 * @returns {Promise<boolean>} True if available
 */
export async function isDockerComposeAvailable() {
  try {
    await execAsync('docker compose version')
    return true
  } catch {
    try {
      await execAsync('docker-compose --version')
      return true
    } catch {
      return false
    }
  }
}
