#!/usr/bin/env node
// src/enterprise-global-teardown.js - Enterprise Global Teardown

import { enterpriseTestRunner } from './enterprise-test-runner.js'

/**
 * Enterprise Global Teardown
 * 
 * Cleans up enterprise environment after the entire test suite
 */

export default async function teardown() {
  console.log('🧹 Cleaning up Enterprise Test Environment...')
  
  // Reset enterprise test runner
  enterpriseTestRunner.reset()
  
  console.log('✅ Enterprise Test Environment cleaned up')
}