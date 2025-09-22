// playground/scenario-config.mjs
import { runLocalCitty, runCitty } from 'citty-test-utils'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { promisify } from 'node:util'

// Get the playground directory path
const __filename = fileURLToPath(import.meta.url)
const playgroundDir = dirname(__filename)

// Add fluent assertions to any result object
function addFluentAssertions(result) {
  result.expectSuccess = () => {
    if (result.exitCode !== 0) {
      throw new Error(`Expected success (exit code 0), got ${result.exitCode}`)
    }
    return result
  }

  result.expectFailure = () => {
    if (result.exitCode === 0) {
      throw new Error(`Expected failure (non-zero exit code), got ${result.exitCode}`)
    }
    return result
  }

  result.expectOutput = (pattern) => {
    if (typeof pattern === 'string') {
      if (!result.stdout.includes(pattern)) {
        throw new Error(`Expected output to contain "${pattern}", got: ${result.stdout}`)
      }
    } else if (pattern instanceof RegExp) {
      if (!pattern.test(result.stdout)) {
        throw new Error(`Expected output to match ${pattern}, got: ${result.stdout}`)
      }
    }
    return result
  }

  result.expectStderr = (pattern) => {
    if (typeof pattern === 'string') {
      if (!result.stderr.includes(pattern)) {
        throw new Error(`Expected stderr to contain "${pattern}", got: ${result.stderr}`)
      }
    } else if (pattern instanceof RegExp) {
      if (!pattern.test(result.stderr)) {
        throw new Error(`Expected stderr to match ${pattern}, got: ${result.stderr}`)
      }
    }
    return result
  }

  result.expectJson = (validator) => {
    try {
      const json = JSON.parse(result.stdout)
      if (validator) {
        validator(json)
      }
    } catch (error) {
      throw new Error(`JSON validation failed: ${error.message}`)
    }
    return result
  }

  return result
}

// Custom runner for playground CLI
async function runPlaygroundLocal(args, options = {}) {
  const { cwd = playgroundDir, timeout = 10000 } = options

  return new Promise((resolve) => {
    const child = spawn('node', ['src/cli.mjs', ...args], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...options.env },
    })

    let stdout = ''
    let stderr = ''
    let timeoutId

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      clearTimeout(timeoutId)
      const result = {
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        args,
        cwd: cwd,
      }

      // Parse JSON if --json flag is present
      if (args.includes('--json')) {
        try {
          result.json = JSON.parse(result.stdout)
        } catch (e) {
          result.json = undefined
        }
      }

      addFluentAssertions(result)
      resolve({ result })
    })

    timeoutId = setTimeout(() => {
      child.kill()
      const result = { exitCode: 1, stdout: '', stderr: 'Timeout', args, cwd }
      addFluentAssertions(result)
      resolve({ result })
    }, timeout)
  })
}

// Wrapper for cleanroom runner that adds fluent assertions
async function runPlaygroundCleanroom(args, options = {}) {
  // For cleanroom, we need to run the playground CLI inside the Docker container
  // The playground CLI should be available at the root of the container
  const result = await runCitty(args, {
    ...options,
    cliPath: 'src/cli.mjs', // Use playground CLI in cleanroom
  })
  // runCitty already returns a wrapped result with expectations, so we don't need to add them
  return { result }
}

// Create playground-specific scenarios with correct working directory
export const scenarios = {
  help(env = 'local') {
    return {
      async execute() {
        const exec = env === 'cleanroom' ? runPlaygroundCleanroom : runPlaygroundLocal
        const options = {
          cwd: env === 'cleanroom' ? undefined : playgroundDir,
        }
        const result = await exec(['--show-help'], options)
        result.result.expectSuccess().expectOutput(/USAGE|COMMANDS/i)
        return { success: true, result: result.result }
      },
    }
  },

  version(env = 'local') {
    return {
      async execute() {
        const exec = env === 'cleanroom' ? runPlaygroundCleanroom : runPlaygroundLocal
        const options = {
          cwd: env === 'cleanroom' ? undefined : playgroundDir,
        }
        const result = await exec(['--show-version'], options)
        result.result.expectSuccess().expectOutput(/\d+\.\d+\.\d+/)
        return { success: true, result: result.result }
      },
    }
  },

  invalidCommand(cmd = 'nonexistent', env = 'local') {
    return {
      async execute() {
        const exec = env === 'cleanroom' ? runPlaygroundCleanroom : runPlaygroundLocal
        const options = {
          cwd: env === 'cleanroom' ? undefined : playgroundDir,
        }
        const result = await exec([cmd], options)
        result.result.expectFailure()
        return { success: true, result: result.result }
      },
    }
  },

  jsonOutput(args, env = 'local') {
    return {
      async execute() {
        const exec = env === 'cleanroom' ? runPlaygroundCleanroom : runPlaygroundLocal
        const options = {
          cwd: env === 'cleanroom' ? undefined : playgroundDir,
        }
        const result = await exec(args, options)
        result.result.expectSuccess().expectJson(() => {})
        return { success: true, result: result.result }
      },
    }
  },

  subcommand(cmd, args = [], env = 'local') {
    return {
      async execute() {
        const exec = env === 'cleanroom' ? runPlaygroundCleanroom : runPlaygroundLocal
        const options = {
          cwd: env === 'cleanroom' ? undefined : playgroundDir,
        }
        const result = await exec([cmd, ...args], options)
        result.result.expectSuccess()
        return { success: true, result: result.result }
      },
    }
  },

  idempotent(args, env = 'local') {
    return {
      async execute() {
        const exec = env === 'cleanroom' ? runPlaygroundCleanroom : runPlaygroundLocal
        const options = {
          cwd: env === 'cleanroom' ? undefined : playgroundDir,
        }

        const result1 = await exec(args, options)
        const result2 = await exec(args, options)

        result1.result.expectSuccess()
        result2.result.expectSuccess()

        if (result1.result.stdout !== result2.result.stdout) {
          throw new Error('Idempotent operation produced different outputs')
        }

        return { success: true, results: [result1.result, result2.result] }
      },
    }
  },

  concurrent(runs, env = 'local') {
    return {
      async execute() {
        const exec = env === 'cleanroom' ? runPlaygroundCleanroom : runPlaygroundLocal
        const options = {
          cwd: env === 'cleanroom' ? undefined : playgroundDir,
        }

        const promises = runs.map((run) => exec(run.args, { ...options, ...run.opts }))
        const results = await Promise.all(promises)

        results.forEach((result) => result.result.expectSuccess())

        return { success: true, results: results.map((r) => r.result) }
      },
    }
  },

  errorCase(args, msgOrRe, env = 'local') {
    return {
      async execute() {
        const exec = env === 'cleanroom' ? runPlaygroundCleanroom : runPlaygroundLocal
        const options = {
          cwd: env === 'cleanroom' ? undefined : playgroundDir,
        }
        const result = await exec(args, options)
        result.result.expectFailure()
        if (msgOrRe) {
          result.result.expectStderr(msgOrRe)
        }
        return { success: true, result: result.result }
      },
    }
  },
}

// Custom scenario function for playground CLI
export function scenario(name) {
  const steps = []
  let currentStep = null
  let concurrent = false

  const builder = {
    step(description) {
      if (currentStep) {
        steps.push(currentStep)
      }
      currentStep = {
        description,
        command: null,
        expectations: [],
        concurrent: false,
      }
      return builder
    },

    run(args) {
      if (!currentStep) {
        throw new Error('Must call step() before run()')
      }
      currentStep.command = args
      return builder
    },

    expectSuccess() {
      if (!currentStep) {
        throw new Error('Must call step() before expectSuccess()')
      }
      currentStep.expectations.push('success')
      return builder
    },

    expectFailure() {
      if (!currentStep) {
        throw new Error('Must call step() before expectFailure()')
      }
      currentStep.expectations.push('failure')
      return builder
    },

    expectOutput(pattern) {
      if (!currentStep) {
        throw new Error('Must call step() before expectOutput()')
      }
      currentStep.expectations.push({ type: 'output', pattern })
      return builder
    },

    expectStderr(pattern) {
      if (!currentStep) {
        throw new Error('Must call step() before expectStderr()')
      }
      currentStep.expectations.push({ type: 'stderr', pattern })
      return builder
    },

    expectJson(validator) {
      if (!currentStep) {
        throw new Error('Must call step() before expectJson()')
      }
      currentStep.expectations.push({ type: 'json', validator })
      return builder
    },

    concurrent() {
      concurrent = true
      return builder
    },

    sequential() {
      concurrent = false
      return builder
    },

    async execute(env = 'local') {
      if (currentStep) {
        steps.push(currentStep)
      }

      if (steps.length === 0) {
        throw new Error('No steps defined')
      }

      const results = []
      const exec = env === 'cleanroom' ? runPlaygroundCleanroom : runPlaygroundLocal
      const options = {
        cwd: env === 'cleanroom' ? undefined : playgroundDir,
      }

      if (concurrent) {
        // Execute all steps concurrently
        const promises = steps.map(async (step) => {
          if (!step.command) {
            throw new Error(`Step "${step.description}" has no command`)
          }

          const result = await exec(step.command, options)

          // Apply expectations
          for (const expectation of step.expectations) {
            if (expectation === 'success') {
              result.result.expectSuccess()
            } else if (expectation === 'failure') {
              result.result.expectFailure()
            } else if (expectation.type === 'output') {
              result.result.expectOutput(expectation.pattern)
            } else if (expectation.type === 'stderr') {
              result.result.expectStderr(expectation.pattern)
            } else if (expectation.type === 'json') {
              result.result.expectJson(expectation.validator)
            }
          }

          return { step: step.description, result: result.result }
        })

        const stepResults = await Promise.all(promises)
        results.push(...stepResults)
      } else {
        // Execute steps sequentially
        for (const step of steps) {
          if (!step.command) {
            throw new Error(`Step "${step.description}" has no command`)
          }

          const result = await exec(step.command, options)

          // Apply expectations
          for (const expectation of step.expectations) {
            if (expectation === 'success') {
              result.result.expectSuccess()
            } else if (expectation === 'failure') {
              result.result.expectFailure()
            } else if (expectation.type === 'output') {
              result.result.expectOutput(expectation.pattern)
            } else if (expectation.type === 'stderr') {
              result.result.expectStderr(expectation.pattern)
            } else if (expectation.type === 'json') {
              result.result.expectJson(expectation.validator)
            }
          }

          results.push({ step: step.description, result: result.result })
        }
      }

      return { success: true, concurrent, results }
    },
  }

  return builder
}

// Export concurrent scenario factory function
export function concurrentScenario(name) {
  return scenario(name).concurrent()
}
