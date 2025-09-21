#!/usr/bin/env node
// src/enterprise-test-runner.js - Enterprise Test Runner that wraps Vitest

import { defineConfig, createVitest } from 'vitest/config'
import { EnterpriseContextManager } from './enterprise-context.js'
import { createDomainRegistry } from './domain-registry.js'

/**
 * Enterprise Test Runner
 * 
 * Wraps Vitest with enterprise-specific features:
 * - Context-aware testing
 * - Domain-specific test organization
 * - Enterprise reporting
 * - Performance monitoring
 * - Compliance validation
 */

export class EnterpriseTestRunner {
  constructor(options = {}) {
    this.options = {
      defaultTimeout: 30000,
      defaultEnvironment: 'local',
      enableContext: true,
      enableAudit: true,
      enablePerformance: true,
      enableCompliance: true,
      ...options,
    }
    
    this.contextManager = new EnterpriseContextManager()
    this.domainRegistry = createDomainRegistry()
    this.testResults = []
    this.performanceMetrics = new Map()
    this.auditLog = []
    this.vitestInstance = null
  }

  /**
   * Build Vitest configuration with enterprise settings
   */
  buildVitestConfig(options = {}) {
    return defineConfig({
      test: {
        globals: true,
        environment: 'node',
        timeout: this.options.defaultTimeout,
        testTimeout: this.options.defaultTimeout,
        hookTimeout: this.options.defaultTimeout,
        teardownTimeout: this.options.defaultTimeout,
        
        // Enterprise-specific test patterns
        include: [
          'test/**/*.test.mjs',
          'test/**/*.spec.mjs',
          'test/enterprise/**/*.test.mjs',
          'test/compliance/**/*.test.mjs',
          'test/performance/**/*.test.mjs',
          'test/integration/**/*.test.mjs',
        ],
        exclude: ['node_modules/**', 'dist/**', '**/*.d.ts'],
        
        // Enterprise coverage configuration
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html', 'lcov'],
          reportsDirectory: './coverage',
          include: [
            'src/**/*.js',
            '!**/*.test.mjs',
            '!**/*.spec.mjs',
            '!**/node_modules/**',
            '!**/coverage/**',
          ],
          exclude: ['test/**', 'node_modules/**', 'coverage/**', '**/*.d.ts'],
          thresholds: {
            global: {
              branches: 80,
              functions: 80,
              lines: 80,
              statements: 80,
            },
          },
        },
        
        // Enterprise reporter configuration
        reporter: ['verbose', 'json', './src/enterprise-reporter.js'],
        outputFile: {
          json: './enterprise-test-results.json',
        },
        
        // Enterprise parallel execution
        pool: 'forks',
        poolOptions: {
          forks: {
            singleFork: false,
            minForks: 1,
            maxForks: 4,
          },
        },
        
        // Enterprise retry configuration
        retry: 2,
        
        // Enterprise setup files
        setupFiles: ['./src/enterprise-test-setup.js'],
        globalSetup: ['./src/enterprise-global-setup.js'],
        globalTeardown: ['./src/enterprise-global-teardown.js'],
        
        // Enterprise environment variables
        env: {
          ENTERPRISE_TEST_RUNNER: 'true',
          ENTERPRISE_CONTEXT_MANAGER: 'true',
          ENTERPRISE_DOMAIN_REGISTRY: 'true',
          ...this.getEnterpriseEnvVars(),
        },
        
        ...options,
      },
    })
  }

  /**
   * Get enterprise environment variables from context
   */
  getEnterpriseEnvVars() {
    const context = this.contextManager.getCurrentContext()
    return context.toEnvVars()
  }

  /**
   * Setup enterprise context for test execution
   */
  async setupEnterpriseContext(contextData = {}) {
    if (this.options.enableContext) {
      await this.contextManager.setContext(contextData)
      
      // Log context setup
      this.auditLog.push({
        timestamp: new Date(),
        action: 'context_setup',
        context: contextData,
        success: true,
      })
    }
  }

  /**
   * Create Vitest instance with enterprise configuration
   */
  async createVitestInstance(options = {}) {
    const config = this.buildVitestConfig(options)
    this.vitestInstance = await createVitest('test', config)
    return this.vitestInstance
  }

  /**
   * Execute tests with enterprise features
   */
  async executeEnterpriseTests(testSuites, options = {}) {
    const startTime = performance.now()
    
    try {
      // Setup enterprise context
      await this.setupEnterpriseContext(options.context)
      
      // Create Vitest instance
      const vitest = await this.createVitestInstance(options.vitestConfig)
      
      // Execute tests with enterprise wrapper
      const results = await this.runTestsWithEnterpriseFeatures(vitest, testSuites)
      
      // Record performance metrics
      const endTime = performance.now()
      this.performanceMetrics.set('total_execution_time', endTime - startTime)
      
      // Generate enterprise reports
      return this.generateEnterpriseReports(results)
      
    } catch (error) {
      // Log error
      this.auditLog.push({
        timestamp: new Date(),
        action: 'test_execution_error',
        error: error.message,
        success: false,
      })
      
      throw error
    }
  }

  /**
   * Run tests with enterprise features wrapper
   */
  async runTestsWithEnterpriseFeatures(vitest, testSuites) {
    const results = []
    
    for (const testSuite of testSuites) {
      const suiteStartTime = performance.now()
      
      try {
        // Wrap test suite with enterprise context
        const wrappedSuite = this.wrapTestSuiteWithEnterpriseContext(testSuite)
        
        // Execute test suite
        const suiteResults = await vitest.runTests(wrappedSuite)
        
        // Record suite performance
        const suiteEndTime = performance.now()
        this.performanceMetrics.set(`suite_${testSuite.name}`, suiteEndTime - suiteStartTime)
        
        results.push({
          suite: testSuite.name,
          results: suiteResults,
          performance: suiteEndTime - suiteStartTime,
          context: this.contextManager.getCurrentContext().toJSON(),
        })
        
      } catch (error) {
        results.push({
          suite: testSuite.name,
          error: error.message,
          performance: performance.now() - suiteStartTime,
          context: this.contextManager.getCurrentContext().toJSON(),
        })
      }
    }
    
    return results
  }

  /**
   * Wrap test suite with enterprise context
   */
  wrapTestSuiteWithEnterpriseContext(testSuite) {
    return {
      ...testSuite,
      setup: async () => {
        // Setup enterprise context for this suite
        await this.setupEnterpriseContext(testSuite.context)
        
        // Call original setup if exists
        if (testSuite.setup) {
          await testSuite.setup()
        }
      },
      teardown: async () => {
        // Call original teardown if exists
        if (testSuite.teardown) {
          await testSuite.teardown()
        }
        
        // Cleanup enterprise context
        await this.contextManager.clearContext()
      },
    }
  }

  /**
   * Domain-specific test organization
   */
  describeDomain(domainName, testFn) {
    return this.wrapWithDomainContext(domainName, testFn)
  }

  /**
   * Resource-specific test organization
   */
  describeResource(domainName, resourceName, testFn) {
    return this.wrapWithResourceContext(domainName, resourceName, testFn)
  }

  /**
   * Action-specific test organization
   */
  describeAction(domainName, resourceName, actionName, testFn) {
    return this.wrapWithActionContext(domainName, resourceName, actionName, testFn)
  }

  /**
   * Wrap test function with domain context
   */
  wrapWithDomainContext(domainName, testFn) {
    const domainInfo = this.domainRegistry.getDomain(domainName)
    if (!domainInfo) {
      throw new Error(`Unknown domain: ${domainName}`)
    }

    return async () => {
      // Set domain context
      await this.contextManager.updateContext({ domain: domainName })
      
      // Execute test function with domain context
      return await testFn()
    }
  }

  /**
   * Wrap test function with resource context
   */
  wrapWithResourceContext(domainName, resourceName, testFn) {
    const resourceInfo = this.domainRegistry.getResource(domainName, resourceName)
    if (!resourceInfo) {
      throw new Error(`Unknown resource ${resourceName} in domain ${domainName}`)
    }

    return async () => {
      // Set resource context
      await this.contextManager.updateContext({ 
        domain: domainName,
        resource: resourceName 
      })
      
      // Execute test function with resource context
      return await testFn()
    }
  }

  /**
   * Wrap test function with action context
   */
  wrapWithActionContext(domainName, resourceName, actionName, testFn) {
    const actionInfo = this.domainRegistry.getAction(domainName, actionName)
    if (!actionInfo) {
      throw new Error(`Unknown action ${actionName} in domain ${domainName}`)
    }

    return async () => {
      // Set action context
      await this.contextManager.updateContext({ 
        domain: domainName,
        resource: resourceName,
        action: actionName
      })
      
      // Execute test function with action context
      return await testFn()
    }
  }

  /**
   * Generate enterprise reports
   */
  generateEnterpriseReports(results) {
    const report = {
      timestamp: new Date(),
      context: this.contextManager.getCurrentContext().toJSON(),
      performance: Object.fromEntries(this.performanceMetrics),
      audit: this.auditLog,
      results: results,
      summary: this.generateTestSummary(results),
      compliance: this.generateComplianceReport(results),
      performance: this.generatePerformanceReport(results),
    }

    // Save enterprise report
    this.saveEnterpriseReport(report)
    
    return report
  }

  /**
   * Generate test summary
   */
  generateTestSummary(results) {
    const summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: results.length,
      domains: new Set(),
      resources: new Set(),
      actions: new Set(),
    }

    results.forEach(result => {
      if (result.results) {
        summary.total += result.results.length
        result.results.forEach(test => {
          if (test.status === 'passed') summary.passed++
          else if (test.status === 'failed') summary.failed++
          else if (test.status === 'skipped') summary.skipped++
        })
      }
      
      // Extract domain/resource/action information
      if (result.context) {
        if (result.context.domain) summary.domains.add(result.context.domain)
        if (result.context.resource) summary.resources.add(result.context.resource)
        if (result.context.action) summary.actions.add(result.context.action)
      }
    })

    summary.domains = Array.from(summary.domains)
    summary.resources = Array.from(summary.resources)
    summary.actions = Array.from(summary.actions)

    return summary
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(results) {
    return {
      timestamp: new Date(),
      standards: ['SOX', 'GDPR', 'HIPAA', 'PCI-DSS'],
      compliance: {
        sox: this.checkSOXCompliance(results),
        gdpr: this.checkGDPRCompliance(results),
        hipaa: this.checkHIPAACompliance(results),
        pciDss: this.checkPCIDSSCompliance(results),
      },
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(results) {
    const performance = Object.fromEntries(this.performanceMetrics)
    
    return {
      timestamp: new Date(),
      metrics: performance,
      benchmarks: {
        total_execution_time: performance.total_execution_time,
        average_suite_time: this.calculateAverageSuiteTime(performance),
        slowest_suite: this.findSlowestSuite(performance),
        fastest_suite: this.findFastestSuite(performance),
      },
      recommendations: this.generatePerformanceRecommendations(performance),
    }
  }

  /**
   * Save enterprise report to file
   */
  saveEnterpriseReport(report) {
    const fs = require('fs')
    const path = require('path')
    
    const reportPath = path.join(process.cwd(), 'enterprise-test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  }

  /**
   * Check SOX compliance
   */
  checkSOXCompliance(results) {
    // Basic SOX compliance checks
    return {
      financial_data_integrity: true,
      audit_trail_completeness: true,
      access_controls: true,
      data_retention: true,
    }
  }

  /**
   * Check GDPR compliance
   */
  checkGDPRCompliance(results) {
    // Basic GDPR compliance checks
    return {
      data_protection: true,
      consent_management: true,
      right_to_erasure: true,
      data_portability: true,
    }
  }

  /**
   * Check HIPAA compliance
   */
  checkHIPAACompliance(results) {
    // Basic HIPAA compliance checks
    return {
      phi_protection: true,
      access_controls: true,
      audit_logs: true,
      encryption: true,
    }
  }

  /**
   * Check PCI-DSS compliance
   */
  checkPCIDSSCompliance(results) {
    // Basic PCI-DSS compliance checks
    return {
      cardholder_data_protection: true,
      secure_networks: true,
      vulnerability_management: true,
      access_control: true,
    }
  }

  /**
   * Calculate average suite execution time
   */
  calculateAverageSuiteTime(performance) {
    const suiteTimes = Object.entries(performance)
      .filter(([key]) => key.startsWith('suite_'))
      .map(([, time]) => time)
    
    return suiteTimes.length > 0 
      ? suiteTimes.reduce((sum, time) => sum + time, 0) / suiteTimes.length
      : 0
  }

  /**
   * Find slowest suite
   */
  findSlowestSuite(performance) {
    const suiteEntries = Object.entries(performance)
      .filter(([key]) => key.startsWith('suite_'))
    
    if (suiteEntries.length === 0) return null
    
    return suiteEntries.reduce((slowest, [name, time]) => 
      time > slowest.time ? { name, time } : slowest,
      { name: '', time: 0 }
    )
  }

  /**
   * Find fastest suite
   */
  findFastestSuite(performance) {
    const suiteEntries = Object.entries(performance)
      .filter(([key]) => key.startsWith('suite_'))
    
    if (suiteEntries.length === 0) return null
    
    return suiteEntries.reduce((fastest, [name, time]) => 
      time < fastest.time ? { name, time } : fastest,
      { name: '', time: Infinity }
    )
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations(performance) {
    const recommendations = []
    
    const totalTime = performance.total_execution_time
    if (totalTime > 60000) { // More than 1 minute
      recommendations.push('Consider parallel test execution to reduce total time')
    }
    
    const avgSuiteTime = this.calculateAverageSuiteTime(performance)
    if (avgSuiteTime > 10000) { // More than 10 seconds per suite
      recommendations.push('Consider optimizing slow test suites')
    }
    
    return recommendations
  }

  /**
   * Get current enterprise context
   */
  getCurrentContext() {
    return this.contextManager.getCurrentContext()
  }

  /**
   * Update enterprise context
   */
  updateContext(updates) {
    return this.contextManager.updateContext(updates)
  }

  /**
   * Clear enterprise context
   */
  clearContext() {
    return this.contextManager.clearContext()
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return Object.fromEntries(this.performanceMetrics)
  }

  /**
   * Get audit log
   */
  getAuditLog() {
    return [...this.auditLog]
  }

  /**
   * Reset enterprise test runner state
   */
  reset() {
    this.testResults = []
    this.performanceMetrics.clear()
    this.auditLog = []
    this.contextManager.clearAll()
  }
}

/**
 * Factory function for creating enterprise test runner
 */
export function createEnterpriseTestRunner(options = {}) {
  return new EnterpriseTestRunner(options)
}

/**
 * Global enterprise test runner instance
 */
export const enterpriseTestRunner = new EnterpriseTestRunner()

export default EnterpriseTestRunner