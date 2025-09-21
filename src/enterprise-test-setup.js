#!/usr/bin/env node
// src/enterprise-test-setup.js - Enterprise Test Setup

import { enterpriseTestRunner } from './enterprise-test-runner.js'

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
beforeEach(async () => {
  // Reset enterprise context for each test
  await enterpriseTestRunner.clearContext()
})

afterEach(async () => {
  // Cleanup enterprise context after each test
  await enterpriseTestRunner.clearContext()
})

// Setup enterprise test environment
beforeAll(async () => {
  // Initialize enterprise test runner
  await enterpriseTestRunner.setupEnterpriseContext({
    environment: 'test',
    compliance: 'SOC2',
    region: 'us-east-1',
  })
})

afterAll(async () => {
  // Cleanup enterprise test runner
  enterpriseTestRunner.reset()
})