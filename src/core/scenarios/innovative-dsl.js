import { defineCommand, runMain } from 'citty'
import { consola } from 'consola'
import { listen } from 'listhen'
import { createApp, eventHandler, toNodeListener } from 'h3'
import { defineHooks } from 'crossws'
import { ofetch } from 'ofetch'
import { getPort } from 'get-port-please'
import { runLocalCitty, wrapWithAssertions } from '@un-test/runners-local'
import { runCitty } from '@un-test/runners-cleanroom'
import { matchSnapshot, snapshotUtils } from '@un-test/core'
import { resolve } from 'pathe'

/**
 * Innovative Feature #2: Mock API Servers in Scenarios
 * Powered by listhen + h3
 */
export function scenario(name) {
  const steps = []
  let currentStep = null
  let concurrentMode = false
  let mode = null
  let mockServer = null

  const builder = {
    /**
     * Start a temporary mock server for the CLI to interact with
     * Supports both HTTP and WebSockets
     */
    mockAPI(routes = {}, wsOptions = {}) {
      return this.action('Start Mock API', async () => {
        const app = createApp()
        for (const [path, handler] of Object.entries(routes)) {
          app.use(path, eventHandler(handler))
        }
        
        const ws = { url: "ws://localhost" };
        const port = await getPort()
        
        mockServer = await listen(toNodeListener(app), {
          port,
          showURL: false,
          clipboard: false,
          ws,
        })
        
        const wsUrl = mockServer.url.replace('http', 'ws')
        consola.success(`🌍 Mock API started at ${mockServer.url}`)
        if (wsOptions.hooks || wsOptions.handlers) {
          consola.success(`🔌 WebSocket enabled at ${wsUrl}`)
        }
        return { success: true, url: mockServer.url, port: mockServer.port, ws, wsUrl }
      })
    },

    step(stepName, args, options = {}) {
      if (typeof args === 'function') return this.action(stepName, args)

      const normalizeArgs = (a) => {
        if (a === undefined || a === null) return null
        if (typeof a === 'string') {
          const trimmed = a.trim()
          return trimmed === '' ? [] : trimmed.split(/\s+/)
        }
        return Array.isArray(a) ? a : []
      }

      const argsArray = normalizeArgs(args)
      currentStep = {
        description: stepName,
        args: argsArray,
        options,
        expectations: [],
        action: null,
        command: argsArray !== null ? { args: argsArray, options } : null
      }
      steps.push(currentStep)
      return this
    },

    action(stepName, actionFn) {
      currentStep = { description: stepName, args: null, options: {}, expectations: [], action: actionFn }
      steps.push(currentStep)
      return this
    },

    async execute(customRunner) {
      const executionMode = mode || process.env.TEST_RUNNER || 'local'
      const results = []
      let lastResult = null

      try {
        for (const step of steps) {
          if (!step.action && (step.args === null || step.args === undefined || (Array.isArray(step.args) && step.args.length === 0))) {
            throw new Error(`Step "${step.description}" has no command`)
          }

          consola.start(`🔄 Executing: ${step.description}`)
          let result

          // If we have a mock server, inject its URL into env for the step
          if (mockServer && !step.action) {
            step.options.env = { ...step.options.env, MOCK_API_URL: mockServer.url }
          }

          const fetchClient = ofetch.create({
            baseURL: mockServer?.url,
            retry: 0,
            headers: {
              'x-test-scenario': name
            }
          })

          if (step.action) {
            result = await step.action({ lastResult, mockServer, context: {}, ofetch: fetchClient })
          } else {
            result = await executeStep(step, executionMode, customRunner)
          }

          lastResult = result
          for (const expectation of step.expectations) expectation(result)
          results.push({ step: step.description, result, success: true })
          consola.success(`✅ Step completed: ${step.description}`)
        }
      } finally {
        if (mockServer) {
          await mockServer.close()
          consola.info('🛑 Mock API server stopped')
        }
      }

      return { scenario: name, results, success: results.every((r) => r.success), lastResult, mode: executionMode }
    },

    expectSuccess() { return this.expect((result) => result.expectSuccess()) },
    expectOutput(match) { return this.expect((result) => result.expectOutput(match)) },
    expect(expectationFn) {
      if (!currentStep) throw new Error('Must call step() before expect()')
      currentStep.expectations.push(expectationFn)
      return this
    },
    mode(executionMode) { mode = executionMode; return this }
  }

  return builder
}

async function executeStep(step, executionMode, customRunner) {
  const { args, options } = step
  if (customRunner && typeof customRunner === 'function') return await customRunner(args, options)
  if (executionMode === 'cleanroom') {
    return await runCitty(args, { cwd: options.cwd || '/app', env: options.env || {}, timeout: options.timeout || 10000 })
  } else {
    const runOptions = { args, cliPath: options.cliPath || process.env.TEST_CLI_PATH || './src/cli.mjs', cwd: options.cwd || process.env.TEST_CWD || process.cwd(), env: { ...options.env, TEST_CLI: 'true' }, timeout: options.timeout || 30000, failFast: false }
    return runLocalCitty(runOptions)
  }
}
