#!/usr/bin/env node
// src/enterprise-global-setup.js - Enterprise Global Setup

import { enterpriseTestRunner } from '../runners/enterprise-test-runner.js'

/**
 * Enterprise Global Setup
 *
 * Sets up enterprise environment for the entire test suite
 */

export default async function setup() {
  console.log('🚀 Setting up Enterprise Test Environment...')

  // Initialize enterprise test runner
  await enterpriseTestRunner.setupEnterpriseContext({
    environment: 'test',
    compliance: 'SOC2',
    region: 'us-east-1',
    user: 'test-user',
    role: 'admin',
    workspace: 'test-workspace',
  })

  console.log('✅ Enterprise Test Environment ready')
}
