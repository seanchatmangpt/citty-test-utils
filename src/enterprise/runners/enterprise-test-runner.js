#!/usr/bin/env node
// src/enterprise-test-runner.js
import { startVitest } from 'vitest/node'
import { writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { EnterpriseContextManager } from '../domain/enterprise-context.js'
import { DomainDiscoveryOrchestrator } from '../../core/discovery/domain-discovery-orchestrator.js'

// Shared context manager instance
const sharedContextManager = new EnterpriseContextManager()

export class EnterpriseTestRunner {
  constructor(options = {}) {
    this.options = {
      defaultTimeout: 30_000,
      enableContext: true,
      enableAudit: true,
      enablePerformance: true,
      enableCompliance: true,
      jsonOutputFile: resolve(process.cwd(), 'enterprise-test-results.json'),
      enterpriseReportFile: resolve(process.cwd(), 'enterprise-test-report.json'),
      // Domain discovery options
      autoDiscoverDomains: true,
      domainDiscoverySources: ['cli-analysis', 'config', 'package-json', 'plugins'],
      validateDomains: true,
      fallbackStrategy: 'generic',
      ...options,
    }
    this.contextManager = sharedContextManager
    this.domainOrchestrator = new DomainDiscoveryOrchestrator({
      configPath: options.configPath || './citty-test-config.json',
      cliPath: options.cliPath || './cli.js',
      packageJsonPath: options.packageJsonPath || './package.json',
      pluginDirectory: options.pluginDirectory || './plugins',
      autoDiscover: this.options.autoDiscoverDomains,
      validateDomains: this.options.validateDomains,
      fallbackStrategy: this.options.fallbackStrategy,
    })
    this.performanceMetrics = new Map()
    this.auditLog = []

    // Initialize domain discovery if enabled
    if (this.options.autoDiscoverDomains) {
      this.initializeDomainDiscovery()
    }
  }

  buildVitestUserConfig(overrides = {}) {
    const env = {
      ENTERPRISE_TEST_RUNNER: 'true',
      ENTERPRISE_CONTEXT_MANAGER: 'true',
      ENTERPRISE_DOMAIN_REGISTRY: 'true',
      ...this.getEnterpriseEnvVars(),
      ...(overrides.env || {}),
    }

    return {
      // vitest CLI flags in programmatic API
      watch: false,
      reporters: ['verbose', 'json', resolve(process.cwd(), 'src/enterprise-reporter.js')],
      outputFile: { json: this.options.jsonOutputFile },
      include: [
        'test/**/*.test.mjs',
        'test/**/*.spec.mjs',
        'test/enterprise/**/*.test.mjs',
        'test/compliance/**/*.test.mjs',
        'test/performance/**/*.test.mjs',
        'test/integration/**/*.test.mjs',
      ],
      exclude: ['node_modules/**', 'dist/**', '**/*.d.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.js', '!**/*.test.mjs', '!**/*.spec.mjs'],
        exclude: ['test/**', 'node_modules/**', 'coverage/**', '**/*.d.ts'],
        thresholds: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } },
      },
      pool: 'forks',
      poolOptions: { forks: { singleFork: false, minForks: 1, maxForks: 4 } },
      retry: 2,
      globals: true,
      environment: 'node',
      testTimeout: this.options.defaultTimeout,
      hookTimeout: this.options.defaultTimeout,
      teardownTimeout: this.options.defaultTimeout,
      setupFiles: [resolve(process.cwd(), 'src/enterprise-test-setup.js')],
      globalSetup: [resolve(process.cwd(), 'src/enterprise-global-setup.js')],
      globalTeardown: [resolve(process.cwd(), 'src/enterprise-global-teardown.js')],
      env,
      ...overrides,
    }
  }

  getEnterpriseEnvVars() {
    const ctx = this.contextManager.getCurrentContext()
    return typeof ctx.toEnvVars === 'function' ? ctx.toEnvVars() : {}
  }

  async setupEnterpriseContext(contextData = {}) {
    if (!this.options.enableContext) return
    await this.contextManager.setContext(contextData)
    this.auditLog.push({
      t: new Date().toISOString(),
      action: 'context_setup',
      context: contextData,
      ok: true,
    })
  }

  async executeEnterpriseTests({ vitestConfig = {}, context = {}, cliArgs = [] } = {}) {
    const t0 = performance.now()
    await this.setupEnterpriseContext(context)

    const userConfig = this.buildVitestUserConfig(vitestConfig)

    // Start Vitest once, await completion
    const vitest = await startVitest('test', cliArgs, userConfig)
    // When startVitest resolves, tests have completed. JSON reporter has written the file.

    const t1 = performance.now()
    if (this.options.enablePerformance)
      this.performanceMetrics.set('total_execution_time_ms', t1 - t0)

    const results = await this._readJsonResults()
    const report = this._generateEnterpriseReport(results)

    await writeFile(this.options.enterpriseReportFile, JSON.stringify(report, null, 2), 'utf8')
    return report
  }

  async _readJsonResults() {
    try {
      const raw = await readFile(this.options.jsonOutputFile, 'utf8')
      return JSON.parse(raw)
    } catch (e) {
      this.auditLog.push({
        t: new Date().toISOString(),
        action: 'read_json_results_error',
        error: String(e),
      })
      return {
        startTime: Date.now(),
        numFailedTestSuites: 0,
        numPassedTestSuites: 0,
        testResults: [],
      }
    }
  }

  _generateEnterpriseReport(jsonReport) {
    const results = jsonReport?.testResults ?? []
    const perf = Object.fromEntries(this.performanceMetrics)

    const summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: results.length,
      domains: [],
      resources: [],
      actions: [],
    }

    const domains = new Set(),
      resources = new Set(),
      actions = new Set()

    for (const suite of results) {
      for (const test of suite.assertionResults ?? []) {
        summary.total++
        if (test.status === 'passed') summary.passed++
        else if (test.status === 'failed') summary.failed++
        else if (test.status === 'pending' || test.status === 'skipped' || test.status === 'todo')
          summary.skipped++
      }
      const ctx = this.contextManager.getCurrentContext()
      if (ctx?.domain) domains.add(ctx.domain)
      if (ctx?.resource) resources.add(ctx.resource)
      if (ctx?.action) actions.add(ctx.action)
    }

    summary.domains = [...domains]
    summary.resources = [...resources]
    summary.actions = [...actions]

    const compliance = this.options.enableCompliance
      ? this._generateCompliance(results)
      : { enabled: false }

    const performanceReport = this.options.enablePerformance
      ? this._generatePerformance(perf)
      : { enabled: false }

    return {
      timestamp: new Date().toISOString(),
      context: this.contextManager.getCurrentContext()?.toJSON?.() ?? {},
      performanceMetrics: perf,
      performance: this.options.enablePerformance ? perf : { enabled: false },
      audit: this.auditLog,
      raw: jsonReport,
      summary,
      compliance,
      performanceReport,
      recommendations: this._generateRecommendations(summary, compliance, performanceReport),
    }
  }

  _generateCompliance(_results) {
    // Stubs. Replace with real checks.
    return {
      enabled: true,
      standards: ['SOX', 'GDPR', 'HIPAA', 'PCI-DSS'],
      checks: {
        sox: {
          financial_data_integrity: true,
          audit_trail_completeness: true,
          access_controls: true,
          data_retention: true,
        },
        gdpr: {
          data_protection: true,
          consent_management: true,
          right_to_erasure: true,
          data_portability: true,
        },
        hipaa: { phi_protection: true, access_controls: true, audit_logs: true, encryption: true },
        pci_dss: {
          cardholder_data_protection: true,
          secure_networks: true,
          vulnerability_management: true,
          access_control: true,
        },
      },
    }
  }

  _generatePerformance(perf) {
    const suiteEntries = Object.entries(perf).filter(([k]) => k.startsWith('suite_'))
    const times = suiteEntries.map(([, v]) => Number(v))
    const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0
    const slowest = suiteEntries.reduce(
      (m, e) => (e[1] > (m?.time ?? -1) ? { name: e[0], time: e[1] } : m),
      null
    )
    const fastest = suiteEntries.reduce(
      (m, e) => (e[1] < (m?.time ?? Infinity) ? { name: e[0], time: e[1] } : m),
      null
    )

    const recs = []
    if ((perf.total_execution_time_ms ?? 0) > 60_000)
      recs.push('Enable more parallelism or split slow suites.')
    if (avg > 10_000) recs.push('Optimize slow tests or cache heavy setup.')

    return {
      enabled: true,
      metrics: perf,
      benchmarks: {
        total_execution_time_ms: perf.total_execution_time_ms ?? 0,
        average_suite_time_ms: avg,
        slowest_suite: slowest,
        fastest_suite: fastest,
      },
      recommendations: recs,
    }
  }

  _generateRecommendations(summary, compliance, performanceReport) {
    const recommendations = []

    // Performance recommendations
    if (
      performanceReport.enabled &&
      performanceReport.benchmarks?.total_execution_time_ms > 60000
    ) {
      recommendations.push('Consider optimizing slow test suites or enabling more parallelism')
    }

    // Compliance recommendations
    if (compliance.enabled) {
      const failedChecks = Object.values(compliance.checks)
        .flat()
        .filter((check) => check === false)
      if (failedChecks.length > 0) {
        recommendations.push('Address compliance violations to meet enterprise standards')
      }
    }

    // Test coverage recommendations
    if (summary.failed > 0) {
      recommendations.push('Investigate and fix failing tests to improve reliability')
    }

    return recommendations
  }

  /**
   * Initialize domain discovery
   */
  async initializeDomainDiscovery() {
    try {
      console.log('🔍 Initializing domain discovery...')
      const discoveryResult = await this.domainOrchestrator.discoverDomains({
        sources: this.options.domainDiscoverySources,
        cliPath: this.options.cliPath,
        packageJsonPath: this.options.packageJsonPath,
        configPath: this.options.configPath,
      })

      console.log(`✅ Discovered ${discoveryResult.domains.length} domains`)
      this.auditLog.push({
        timestamp: new Date(),
        action: 'domain_discovery',
        details: {
          domainsDiscovered: discoveryResult.domains.length,
          sources: discoveryResult.metadata.sources.length,
        },
      })
    } catch (error) {
      console.warn('⚠️ Domain discovery failed:', error.message)
      this.auditLog.push({
        timestamp: new Date(),
        action: 'domain_discovery_failed',
        details: { error: error.message },
      })
    }
  }

  // Domain/resource/action wrappers (unchanged semantics, safer errors)
  describeDomain(domainName, testFn) {
    const info = this.domainOrchestrator.getDomain(domainName)
    if (!info) throw new Error(`Unknown domain: ${domainName}`)
    return async () => {
      await this.contextManager.updateContext({ domain: domainName })
      return testFn()
    }
  }

  describeResource(domainName, resourceName, testFn) {
    const info = this.domainOrchestrator
      .getDomainResources(domainName)
      ?.find((r) => r.name === resourceName)
    if (!info) throw new Error(`Unknown resource ${resourceName} in domain ${domainName}`)
    return async () => {
      await this.contextManager.updateContext({ domain: domainName, resource: resourceName })
      return testFn()
    }
  }

  describeAction(domainName, resourceName, actionName, testFn) {
    const info = this.domainOrchestrator
      .getDomainActions(domainName)
      ?.find((a) => a.name === actionName)
    if (!info) throw new Error(`Unknown action ${actionName} in domain ${domainName}`)
    return async () => {
      await this.contextManager.updateContext({
        domain: domainName,
        resource: resourceName,
        action: actionName,
      })
      return testFn()
    }
  }

  // Generate enterprise reports
  generateEnterpriseReports(results = []) {
    return this._generateEnterpriseReport({
      testResults: results,
      startTime: Date.now(),
      numFailedTestSuites: 0,
      numPassedTestSuites: results.length,
    })
  }

  // Accessors
  getCurrentContext() {
    return this.contextManager.getCurrentContext()
  }
  updateContext(updates) {
    return this.contextManager.updateContext(updates)
  }
  clearContext() {
    return this.contextManager.clearContext()
  }
  getPerformanceMetrics() {
    return Object.fromEntries(this.performanceMetrics)
  }
  getAuditLog() {
    return [...this.auditLog]
  }

  /**
   * Register domain at runtime
   */
  registerDomain(domain, options = {}) {
    return this.domainOrchestrator.registerDomain(domain, options)
  }

  /**
   * Create domain from template
   */
  async createDomainFromTemplate(templateName, data, options = {}) {
    return await this.domainOrchestrator.createDomainFromTemplate(templateName, data, options)
  }

  /**
   * Suggest template for CLI
   */
  async suggestTemplateForCLI(cliPath) {
    return await this.domainOrchestrator.suggestTemplateForCLI(cliPath)
  }

  /**
   * Get orchestrator statistics
   */
  getOrchestratorStats() {
    return this.domainOrchestrator.getStats()
  }

  reset() {
    this.performanceMetrics.clear()
    this.auditLog = []
    this.contextManager.clearAll?.()
  }
}

export function createEnterpriseTestRunner(options = {}) {
  return new EnterpriseTestRunner(options)
}

export const enterpriseTestRunner = new EnterpriseTestRunner()
export default EnterpriseTestRunner
