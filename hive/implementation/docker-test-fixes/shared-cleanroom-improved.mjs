#!/usr/bin/env node
/**
 * @fileoverview Improved Shared Cleanroom Setup with Docker availability checking
 * @description Provides shared cleanroom instance with proper Docker availability detection
 */

import { setupCleanroom, teardownCleanroom } from '../../src/core/runners/cleanroom-runner.js'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

let cleanroomSetup = false
let setupPromise = null
let dockerAvailable = null

/**
 * Check if Docker is available and running
 * @returns {Promise<boolean>} True if Docker is available
 */
async function isDockerRunning() {
  if (dockerAvailable !== null) {
    return dockerAvailable
  }

  await execAsync('docker info --format "{{.ServerVersion}}"')
  dockerAvailable = true
  return true
}

/**
 * Get or create shared cleanroom instance
 * @returns {Promise<Object|null>} Cleanroom instance or null if Docker is unavailable
 */
export async function getSharedCleanroom() {
  // Check Docker availability first
  const available = await isDockerRunning().catch(() => false)

  if (!available) {
    console.warn('⚠️ Docker not available, cleanroom tests will be skipped')
    return null
  }

  if (!setupPromise) {
    setupPromise = setupCleanroom({
      rootDir: '.',
      timeout: 60000,
    })
  }

  if (!cleanroomSetup) {
    await setupPromise
    cleanroomSetup = true
    console.log('🐳 Shared cleanroom setup complete for concurrent testing')
  }

  return setupPromise
}

/**
 * Teardown shared cleanroom instance
 */
export async function teardownSharedCleanroom() {
  if (cleanroomSetup) {
    await teardownCleanroom()
    cleanroomSetup = false
    setupPromise = null
    dockerAvailable = null
    console.log('🧹 Shared cleanroom teardown complete')
  }
}

/**
 * Check if cleanroom is available
 * @returns {boolean} True if cleanroom is available
 */
export function isCleanroomAvailable() {
  return cleanroomSetup
}

/**
 * Global setup for all tests
 */
export async function setup() {
  await getSharedCleanroom().catch((error) => {
    console.warn('⚠️ Shared cleanroom setup failed:', error.message)
    // Don't fail tests if cleanroom is not available
  })
}

/**
 * Global teardown for all tests
 */
export async function teardown() {
  await teardownSharedCleanroom()
}
