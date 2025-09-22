#!/usr/bin/env node
/**
 * @fileoverview Shared Cleanroom Setup for Maximum Concurrency
 * @description Provides shared cleanroom instance across all tests to maximize concurrency
 */

import { setupCleanroom, teardownCleanroom } from '../../src/core/runners/cleanroom-runner.js'

let cleanroomSetup = false
let setupPromise = null

/**
 * Get or create shared cleanroom instance
 * @returns {Promise<Object>} Cleanroom instance
 */
export async function getSharedCleanroom() {
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
  try {
    await getSharedCleanroom()
  } catch (error) {
    console.warn('⚠️ Shared cleanroom setup failed:', error.message)
    // Don't fail tests if cleanroom is not available
  }
}

/**
 * Global teardown for all tests
 */
export async function teardown() {
  await teardownSharedCleanroom()
}
