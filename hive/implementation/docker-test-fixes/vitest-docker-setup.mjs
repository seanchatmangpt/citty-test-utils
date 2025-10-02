#!/usr/bin/env node
/**
 * @fileoverview Vitest Global Setup for Docker Tests
 * @description Global setup/teardown for Docker-based tests with proper cleanup
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const CONTAINER_LABEL = 'ctu-test'

/**
 * Check if Docker is available
 * @returns {Promise<boolean>} True if Docker is available
 */
async function isDockerAvailable() {
  await execAsync('docker info --format "{{.ServerVersion}}"')
  return true
}

/**
 * Clean up all test containers
 */
async function cleanupTestContainers() {
  console.log('🧹 Cleaning up Docker test containers...')
  await execAsync(
    `docker rm -f $(docker ps -aq --filter "label=${CONTAINER_LABEL}") 2>/dev/null || true`
  )
}

/**
 * Global setup - runs before all tests
 */
export async function setup() {
  console.log('🚀 Starting global Docker test setup...')

  // Check Docker availability
  const dockerAvailable = await isDockerAvailable().catch(() => false)

  if (!dockerAvailable) {
    console.warn('⚠️ Docker not available, Docker-based tests will be skipped')
    return
  }

  console.log('✅ Docker is available')

  // Clean up any existing test containers
  await cleanupTestContainers()

  console.log('✅ Global Docker test setup complete')
}

/**
 * Global teardown - runs after all tests
 */
export async function teardown() {
  console.log('🧹 Starting global Docker test teardown...')

  // Clean up all test containers
  await cleanupTestContainers()

  console.log('✅ Global Docker test teardown complete')
}
