#!/usr/bin/env node
// src/enterprise/performance/enterprise-performance-monitor.js - Enterprise Performance Monitor

/**
 * Enterprise Performance Monitor
 *
 * Monitors and tracks performance metrics for enterprise testing
 */

export class EnterprisePerformanceMonitor {
  constructor() {
    this.metrics = []
    this.thresholds = {
      commandExecution: 100, // ms
      testSuite: 10000, // ms
      totalExecution: 60000, // ms
    }
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics) {
    this.metrics.push({
      ...metrics,
      timestamp: new Date(),
    })
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return [...this.metrics]
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name) {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(count = 10) {
    return this.metrics.slice(-count)
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = []
  }

  /**
   * Set performance thresholds
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }

  /**
   * Get performance thresholds
   */
  getThresholds() {
    return { ...this.thresholds }
  }

  /**
   * Check if metrics meet thresholds
   */
  meetsThresholds() {
    if (this.metrics.length === 0) return true

    const latestMetrics = this.getLatestMetrics(1)[0]
    if (!latestMetrics) return true

    return (
      latestMetrics.duration <= this.thresholds.commandExecution &&
      latestMetrics.duration <= this.thresholds.testSuite
    )
  }

  /**
   * Get performance summary
   */
  getSummary() {
    if (this.metrics.length === 0) {
      return {
        totalTests: 0,
        averageDuration: 0,
        slowestTest: null,
        fastestTest: null,
        thresholdViolations: 0,
      }
    }

    const durations = this.metrics.map((m) => m.duration)
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const slowestTest = this.metrics.reduce((max, m) => (m.duration > max.duration ? m : max))
    const fastestTest = this.metrics.reduce((min, m) => (m.duration < min.duration ? m : min))
    const thresholdViolations = this.metrics.filter(
      (m) => m.duration > this.thresholds.commandExecution
    ).length

    return {
      totalTests: this.metrics.length,
      averageDuration,
      slowestTest,
      fastestTest,
      thresholdViolations,
    }
  }
}

export default EnterprisePerformanceMonitor
