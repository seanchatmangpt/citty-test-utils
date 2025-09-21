#!/usr/bin/env node
// src/enterprise-performance-test-runner.js - Enterprise Performance Test Runner

import { EnterpriseTestRunner } from './enterprise-test-runner.js'

/**
 * Enterprise Performance Test Runner
 * 
 * Extends EnterpriseTestRunner with performance-specific features:
 * - Performance monitoring
 * - Benchmarking capabilities
 * - Load testing support
 * - Performance optimization recommendations
 */

export class EnterprisePerformanceTestRunner extends EnterpriseTestRunner {
  constructor(options = {}) {
    super(options)
    this.performanceMonitor = new EnterprisePerformanceMonitor()
    this.benchmarks = new Map()
    this.loadTests = new Map()
    this.performanceThresholds = {
      commandExecution: 100, // ms
      testSuite: 10000, // ms
      totalExecution: 60000, // ms
    }
  }

  /**
   * Performance testing wrapper
   */
  performance(testFn) {
    return this.wrapWithPerformanceMonitoring(testFn)
  }

  /**
   * Performance benchmarking
   */
  benchmark(name, testFn) {
    return this.wrapWithBenchmarking(name, testFn)
  }

  /**
   * Load testing
   */
  load(testFn) {
    return this.wrapWithLoadTesting(testFn)
  }

  /**
   * Wrap test function with performance monitoring
   */
  wrapWithPerformanceMonitoring(testFn) {
    return async () => {
      const startTime = performance.now()
      const startMemory = process.memoryUsage()
      
      try {
        // Execute test function
        const result = await testFn()
        
        // Record performance metrics
        const endTime = performance.now()
        const endMemory = process.memoryUsage()
        
        this.recordPerformanceMetrics({
          name: testFn.name || 'anonymous',
          duration: endTime - startTime,
          memoryUsage: {
            start: startMemory,
            end: endMemory,
            delta: {
              rss: endMemory.rss - startMemory.rss,
              heapUsed: endMemory.heapUsed - startMemory.heapUsed,
              heapTotal: endMemory.heapTotal - startMemory.heapTotal,
              external: endMemory.external - startMemory.external,
            },
          },
          timestamp: new Date(),
          success: true,
        })
        
        return result
        
      } catch (error) {
        // Record performance metrics for failed test
        const endTime = performance.now()
        const endMemory = process.memoryUsage()
        
        this.recordPerformanceMetrics({
          name: testFn.name || 'anonymous',
          duration: endTime - startTime,
          memoryUsage: {
            start: startMemory,
            end: endMemory,
            delta: {
              rss: endMemory.rss - startMemory.rss,
              heapUsed: endMemory.heapUsed - startMemory.heapUsed,
              heapTotal: endMemory.heapTotal - startMemory.heapTotal,
              external: endMemory.external - startMemory.external,
            },
          },
          timestamp: new Date(),
          success: false,
          error: error.message,
        })
        
        throw error
      }
    }
  }

  /**
   * Wrap test function with benchmarking
   */
  wrapWithBenchmarking(name, testFn) {
    return async () => {
      const iterations = 10 // Default iterations for benchmarking
      const results = []
      
      // Warm up
      await testFn()
      
      // Benchmark iterations
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        await testFn()
        const endTime = performance.now()
        
        results.push(endTime - startTime)
      }
      
      // Calculate benchmark statistics
      const benchmark = this.calculateBenchmarkStatistics(name, results)
      this.benchmarks.set(name, benchmark)
      
      return benchmark
    }
  }

  /**
   * Wrap test function with load testing
   */
  wrapWithLoadTesting(testFn) {
    return async () => {
      const concurrency = 10 // Default concurrency for load testing
      const duration = 30000 // 30 seconds default duration
      
      const startTime = Date.now()
      const results = []
      
      // Run load test
      while (Date.now() - startTime < duration) {
        const promises = []
        
        for (let i = 0; i < concurrency; i++) {
          promises.push(this.runLoadTestIteration(testFn))
        }
        
        const iterationResults = await Promise.allSettled(promises)
        results.push(...iterationResults)
      }
      
      // Calculate load test statistics
      const loadTest = this.calculateLoadTestStatistics(results)
      this.loadTests.set('load_test', loadTest)
      
      return loadTest
    }
  }

  /**
   * Run single load test iteration
   */
  async runLoadTestIteration(testFn) {
    const startTime = performance.now()
    
    try {
      await testFn()
      return {
        success: true,
        duration: performance.now() - startTime,
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - startTime,
        error: error.message,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Record performance metrics
   */
  recordPerformanceMetrics(metrics) {
    this.performanceMonitor.recordMetrics(metrics)
  }

  /**
   * Calculate benchmark statistics
   */
  calculateBenchmarkStatistics(name, results) {
    const sorted = results.sort((a, b) => a - b)
    const sum = results.reduce((acc, val) => acc + val, 0)
    
    return {
      name,
      iterations: results.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / results.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      standardDeviation: this.calculateStandardDeviation(results, sum / results.length),
      timestamp: new Date(),
    }
  }

  /**
   * Calculate load test statistics
   */
  calculateLoadTestStatistics(results) {
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success)
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success)
    const durations = successful.map(r => r.value.duration)
    
    const sum = durations.reduce((acc, val) => acc + val, 0)
    
    return {
      totalRequests: results.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: (successful.length / results.length) * 100,
      averageResponseTime: sum / durations.length,
      minResponseTime: Math.min(...durations),
      maxResponseTime: Math.max(...durations),
      requestsPerSecond: results.length / 30, // Assuming 30 second duration
      timestamp: new Date(),
    }
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values, mean) {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length
    return Math.sqrt(avgSquaredDiff)
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(results) {
    const report = {
      timestamp: new Date(),
      thresholds: this.performanceThresholds,
      metrics: this.performanceMonitor.getMetrics(),
      benchmarks: Object.fromEntries(this.benchmarks),
      loadTests: Object.fromEntries(this.loadTests),
      summary: this.generatePerformanceSummary(),
      recommendations: this.generatePerformanceRecommendations(),
    }

    return report
  }

  /**
   * Generate performance summary
   */
  generatePerformanceSummary() {
    const metrics = this.performanceMonitor.getMetrics()
    const summary = {
      totalTests: metrics.length,
      averageDuration: 0,
      slowestTest: null,
      fastestTest: null,
      memoryUsage: {
        peak: 0,
        average: 0,
      },
      thresholdViolations: [],
    }

    if (metrics.length > 0) {
      const durations = metrics.map(m => m.duration)
      summary.averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
      
      const sortedByDuration = metrics.sort((a, b) => b.duration - a.duration)
      summary.slowestTest = sortedByDuration[0]
      summary.fastestTest = sortedByDuration[sortedByDuration.length - 1]
      
      const memoryUsages = metrics.map(m => m.memoryUsage.delta.heapUsed)
      summary.memoryUsage.peak = Math.max(...memoryUsages)
      summary.memoryUsage.average = memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length
      
      // Check threshold violations
      summary.thresholdViolations = metrics.filter(m => 
        m.duration > this.performanceThresholds.commandExecution
      )
    }

    return summary
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations() {
    const recommendations = []
    const metrics = this.performanceMonitor.getMetrics()
    
    if (metrics.length === 0) {
      return recommendations
    }

    const averageDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
    
    if (averageDuration > this.performanceThresholds.commandExecution) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Average test execution time exceeds threshold',
        current: `${averageDuration.toFixed(2)}ms`,
        threshold: `${this.performanceThresholds.commandExecution}ms`,
        action: 'Consider optimizing slow tests or increasing timeout',
      })
    }

    const slowTests = metrics.filter(m => m.duration > this.performanceThresholds.commandExecution * 2)
    if (slowTests.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: `${slowTests.length} tests are significantly slow`,
        tests: slowTests.map(t => t.name),
        action: 'Review and optimize slow tests',
      })
    }

    const memoryLeaks = metrics.filter(m => m.memoryUsage.delta.heapUsed > 50 * 1024 * 1024) // 50MB
    if (memoryLeaks.length > 0) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'Potential memory leaks detected',
        tests: memoryLeaks.map(t => t.name),
        action: 'Review memory usage and cleanup resources',
      })
    }

    return recommendations
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics()
  }

  /**
   * Get benchmarks
   */
  getBenchmarks() {
    return Object.fromEntries(this.benchmarks)
  }

  /**
   * Get load test results
   */
  getLoadTestResults() {
    return Object.fromEntries(this.loadTests)
  }

  /**
   * Set performance thresholds
   */
  setPerformanceThresholds(thresholds) {
    this.performanceThresholds = { ...this.performanceThresholds, ...thresholds }
  }

  /**
   * Check if performance meets thresholds
   */
  meetsPerformanceThresholds() {
    const metrics = this.performanceMonitor.getMetrics()
    const violations = metrics.filter(m => 
      m.duration > this.performanceThresholds.commandExecution
    )
    
    return violations.length === 0
  }
}

/**
 * Enterprise Performance Monitor
 */
class EnterprisePerformanceMonitor {
  constructor() {
    this.metrics = []
    this.maxMetrics = 1000 // Limit stored metrics
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics) {
    this.metrics.push(metrics)
    
    // Limit stored metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return [...this.metrics]
  }

  /**
   * Get metrics for specific test
   */
  getMetricsForTest(testName) {
    return this.metrics.filter(m => m.name === testName)
  }

  /**
   * Get average duration
   */
  getAverageDuration() {
    if (this.metrics.length === 0) return 0
    
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    return totalDuration / this.metrics.length
  }

  /**
   * Get peak memory usage
   */
  getPeakMemoryUsage() {
    if (this.metrics.length === 0) return 0
    
    return Math.max(...this.metrics.map(m => m.memoryUsage.delta.heapUsed))
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics = []
  }
}

/**
 * Factory function for creating enterprise performance test runner
 */
export function createEnterprisePerformanceTestRunner(options = {}) {
  return new EnterprisePerformanceTestRunner(options)
}

export default EnterprisePerformanceTestRunner