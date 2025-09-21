#!/usr/bin/env node
// src/enterprise-test-setup.js - Enterprise Test Setup

import { enterpriseTestRunner } from '../runners/enterprise-test-runner.js'

/**
 * Enterprise Test Setup
 *
 * Sets up enterprise context and utilities for each test file
 */

// Make enterprise test runner globally available
global.enterpriseTestRunner = enterpriseTestRunner

// Make enterprise context utilities globally available
global.describeDomain = enterpriseTestRunner.describeDomain.bind(enterpriseTestRunner)
global.describeResource = enterpriseTestRunner.describeResource.bind(enterpriseTestRunner)
global.describeAction = enterpriseTestRunner.describeAction.bind(enterpriseTestRunner)

// Make enterprise context management globally available
global.getEnterpriseContext = () => enterpriseTestRunner.getCurrentContext()
global.updateEnterpriseContext = (updates) => enterpriseTestRunner.updateContext(updates)
global.clearEnterpriseContext = () => enterpriseTestRunner.clearContext()

// Make enterprise utilities globally available
global.getPerformanceMetrics = () => enterpriseTestRunner.getPerformanceMetrics()
global.getAuditLog = () => enterpriseTestRunner.getAuditLog()

// Setup enterprise environment
if (typeof beforeEach !== 'undefined') {
  beforeEach(async () => {
    // Reset enterprise context for each test
    await enterpriseTestRunner.clearContext()
  })
}

if (typeof afterEach !== 'undefined') {
  afterEach(async () => {
    // Cleanup enterprise context after each test
    await enterpriseTestRunner.clearContext()
  })
}

// Setup enterprise test environment
if (typeof beforeAll !== 'undefined') {
  beforeAll(async () => {
    // Initialize enterprise test runner
    await enterpriseTestRunner.setupEnterpriseContext({
      environment: 'test',
      compliance: 'SOC2',
      region: 'us-east-1',
    })
  })
}

if (typeof afterAll !== 'undefined') {
  afterAll(async () => {
    // Cleanup enterprise test runner
    enterpriseTestRunner.reset()
  })
}
