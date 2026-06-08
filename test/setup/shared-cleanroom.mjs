#!/usr/bin/env node
/**
 * @fileoverview Shared Cleanroom Setup for Maximum Concurrency
 * @description Provides shared cleanroom instance across all tests to maximize concurrency
 */

import { setupCleanroom, teardownCleanroom } from '@un-test/runners-cleanroom'

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

let setupFailedError = null

/**
 * Check if cleanroom is available
 * @returns {boolean} True if cleanroom is available
 */
export function isCleanroomAvailable() {
  if (setupFailedError) {
    throw setupFailedError
  }
  if (process.env.CLEANROOM_SETUP_ERROR) {
    throw new Error(process.env.CLEANROOM_SETUP_ERROR)
  }
  return cleanroomSetup || process.env.CLEANROOM_SETUP_SUCCESS === 'true'
}

/**
 * Global setup for all tests
 */
export async function setup() {
  if (process.env.RUN_CLEANROOM !== '1' && process.env.CI !== 'true') {
    console.log('⏭️ Skipping Docker cleanroom setup for fast DX (use RUN_CLEANROOM=1 to enable)')
    return
  }

  try {
    await getSharedCleanroom()
    process.env.CLEANROOM_SETUP_SUCCESS = 'true'
  } catch (error) {
    setupFailedError = error
    process.env.CLEANROOM_SETUP_ERROR = error.message
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
