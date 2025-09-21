#!/usr/bin/env node
/**
 * @fileoverview Universal Reporters
 * @description Report generation for test results in various formats
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'

/**
 * Test report interface
 * @typedef {Object} TestReport
 * @property {Array} suites - Test suites
 * @property {Object} stats - Test statistics
 * @property {string} [artifactsDir] - Artifacts directory
 * @property {Date} timestamp - Report timestamp
 * @property {string} version - Framework version
 */
class TestReport {
  constructor(options = {}) {
    this.suites = options.suites || []
    this.stats = options.stats || { pass: 0, fail: 0, skip: 0, durationMs: 0 }
    this.artifactsDir = options.artifactsDir
    this.timestamp = options.timestamp || new Date()
    this.version = options.version || '1.0.0'
  }
}

/**
 * Test suite result
 * @typedef {Object} TestSuite
 * @property {string} name - Suite name
 * @property {Array} tests - Test results
 * @property {Object} stats - Suite statistics
 * @property {number} durationMs - Suite duration
 * @property {Date} timestamp - Suite timestamp
 */
class TestSuite {
  constructor(options = {}) {
    this.name = options.name || 'unnamed'
    this.tests = options.tests || []
    this.stats = options.stats || { pass: 0, fail: 0, skip: 0 }
    this.durationMs = options.durationMs || 0
    this.timestamp = options.timestamp || new Date()
  }
}

/**
 * Test result
 * @typedef {Object} TestResult
 * @property {string} name - Test name
 * @property {boolean} passed - Whether test passed
 * @property {number} durationMs - Test duration
 * @property {string} [error] - Error message if failed
 * @property {Object} [artifacts] - Test artifacts
 * @property {Date} timestamp - Test timestamp
 */
class TestResult {
  constructor(options = {}) {
    this.name = options.name || 'unnamed'
    this.passed = options.passed || false
    this.durationMs = options.durationMs || 0
    this.error = options.error
    this.artifacts = options.artifacts || {}
    this.timestamp = options.timestamp || new Date()
  }
}

/**
 * Base reporter class
 * @abstract
 */
class BaseReporter {
  constructor(options = {}) {
    this.options = options
  }

  /**
   * Generate report
   * @param {TestReport} report - Test report data
   * @returns {Promise<string>} Report content
   */
  async generate(report) {
    throw new Error('Reporter.generate() must be implemented by subclass')
  }

  /**
   * Write report to file
   * @param {TestReport} report - Test report data
   * @param {string} filePath - Output file path
   * @returns {Promise<void>}
   */
  async write(report, filePath) {
    const content = await this.generate(report)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, content, 'utf8')
  }
}

/**
 * JSON reporter
 * @extends BaseReporter
 */
class JsonReporter extends BaseReporter {
  async generate(report) {
    return JSON.stringify(report, null, 2)
  }
}

/**
 * JUnit XML reporter
 * @extends BaseReporter
 */
class JUnitReporter extends BaseReporter {
  async generate(report) {
    const xml = []
    xml.push('<?xml version="1.0" encoding="UTF-8"?>')
    xml.push(
      `<testsuites name="CLI Tests" tests="${report.stats.pass + report.stats.fail}" failures="${
        report.stats.fail
      }" time="${report.stats.durationMs / 1000}">`
    )

    for (const suite of report.suites) {
      xml.push(
        `  <testsuite name="${this.escapeXml(suite.name)}" tests="${
          suite.stats.pass + suite.stats.fail
        }" failures="${suite.stats.fail}" time="${suite.durationMs / 1000}">`
      )

      for (const test of suite.tests) {
        if (test.passed) {
          xml.push(
            `    <testcase name="${this.escapeXml(test.name)}" time="${test.durationMs / 1000}"/>`
          )
        } else {
          xml.push(
            `    <testcase name="${this.escapeXml(test.name)}" time="${test.durationMs / 1000}">`
          )
          xml.push(`      <failure message="${this.escapeXml(test.error || 'Test failed')}"/>`)
          xml.push(`    </testcase>`)
        }
      }

      xml.push('  </testsuite>')
    }

    xml.push('</testsuites>')
    return xml.join('\n')
  }

  escapeXml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}

/**
 * HTML reporter
 * @extends BaseReporter
 */
class HtmlReporter extends BaseReporter {
  async generate(report) {
    const html = []
    html.push('<!DOCTYPE html>')
    html.push('<html lang="en">')
    html.push('<head>')
    html.push('  <meta charset="UTF-8">')
    html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">')
    html.push('  <title>CLI Test Report</title>')
    html.push('  <style>')
    html.push(this.getStyles())
    html.push('  </style>')
    html.push('</head>')
    html.push('<body>')
    html.push('  <div class="container">')
    html.push('    <h1>CLI Test Report</h1>')
    html.push(this.generateSummary(report))
    html.push(this.generateSuites(report))
    html.push('  </div>')
    html.push('</body>')
    html.push('</html>')
    return html.join('\n')
  }

  getStyles() {
    return `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
      .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
      .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
      .stat-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
      .stat-card.pass { border-left: 4px solid #28a745; }
      .stat-card.fail { border-left: 4px solid #dc3545; }
      .stat-card.skip { border-left: 4px solid #ffc107; }
      .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
      .stat-label { color: #666; text-transform: uppercase; font-size: 0.9em; }
      .suite { margin: 30px 0; border: 1px solid #ddd; border-radius: 6px; }
      .suite-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; font-weight: bold; }
      .test { padding: 10px 15px; border-bottom: 1px solid #eee; }
      .test:last-child { border-bottom: none; }
      .test.pass { background: #d4edda; }
      .test.fail { background: #f8d7da; }
      .test-name { font-weight: bold; margin-bottom: 5px; }
      .test-error { color: #721c24; font-family: monospace; font-size: 0.9em; }
      .duration { color: #666; font-size: 0.9em; }
    `
  }

  generateSummary(report) {
    const html = []
    html.push('    <div class="summary">')
    html.push(`      <div class="stat-card pass">`)
    html.push(`        <div class="stat-number">${report.stats.pass}</div>`)
    html.push(`        <div class="stat-label">Passed</div>`)
    html.push(`      </div>`)
    html.push(`      <div class="stat-card fail">`)
    html.push(`        <div class="stat-number">${report.stats.fail}</div>`)
    html.push(`        <div class="stat-label">Failed</div>`)
    html.push(`      </div>`)
    html.push(`      <div class="stat-card skip">`)
    html.push(`        <div class="stat-number">${report.stats.skip}</div>`)
    html.push(`        <div class="stat-label">Skipped</div>`)
    html.push(`      </div>`)
    html.push(`      <div class="stat-card">`)
    html.push(
      `        <div class="stat-number">${(report.stats.durationMs / 1000).toFixed(2)}s</div>`
    )
    html.push(`        <div class="stat-label">Duration</div>`)
    html.push(`      </div>`)
    html.push('    </div>')
    return html.join('\n')
  }

  generateSuites(report) {
    const html = []
    for (const suite of report.suites) {
      html.push('    <div class="suite">')
      html.push(
        `      <div class="suite-header">${this.escapeHtml(suite.name)} (${
          suite.stats.pass + suite.stats.fail
        } tests, ${suite.stats.fail} failed)</div>`
      )

      for (const test of suite.tests) {
        const className = test.passed ? 'pass' : 'fail'
        html.push(`      <div class="test ${className}">`)
        html.push(`        <div class="test-name">${this.escapeHtml(test.name)}</div>`)
        html.push(`        <div class="duration">${(test.durationMs / 1000).toFixed(3)}s</div>`)
        if (test.error) {
          html.push(`        <div class="test-error">${this.escapeHtml(test.error)}</div>`)
        }
        html.push('      </div>')
      }

      html.push('    </div>')
    }
    return html.join('\n')
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}

/**
 * TAP (Test Anything Protocol) reporter
 * @extends BaseReporter
 */
class TapReporter extends BaseReporter {
  async generate(report) {
    const lines = []
    lines.push('TAP version 13')
    lines.push(`1..${report.stats.pass + report.stats.fail}`)

    let testNumber = 1
    for (const suite of report.suites) {
      for (const test of suite.tests) {
        if (test.passed) {
          lines.push(`ok ${testNumber} ${test.name}`)
        } else {
          lines.push(`not ok ${testNumber} ${test.name}`)
          if (test.error) {
            lines.push(`  ---`)
            lines.push(`  error: ${test.error}`)
            lines.push(`  ...`)
          }
        }
        testNumber++
      }
    }

    return lines.join('\n')
  }
}

/**
 * Collection of all reporters
 */
const reporters = {
  json: JsonReporter,
  junit: JUnitReporter,
  html: HtmlReporter,
  tap: TapReporter,
}

/**
 * Create a reporter instance
 * @param {string} type - Reporter type
 * @param {Object} [options] - Reporter options
 * @returns {BaseReporter} Reporter instance
 */
function createReporter(type, options = {}) {
  const ReporterClass = reporters[type]
  if (!ReporterClass) {
    throw new Error(`Unknown reporter type: ${type}`)
  }
  return new ReporterClass(options)
}

// Export all reporter classes and utilities
export {
  TestReport,
  TestSuite,
  TestResult,
  BaseReporter,
  JsonReporter,
  JUnitReporter,
  HtmlReporter,
  TapReporter,
  createReporter,
}
