#!/usr/bin/env node
// src/cli.mjs - Citty Test Utils CLI - Dogfood/Test CLI with Custom Runner

import { defineCommand, runMain } from 'citty'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../index.js'
import { scenario } from './core/scenarios/scenario-dsl.js'
import { scenarios } from './core/scenarios/scenarios.js'
import nunjucks from 'nunjucks'
import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname, basename, extname } from 'node:path'

const cittyTestUtils = defineCommand({
  meta: {
    name: 'citty-test-utils',
    version: '1.0.0',
    description: 'Citty Test Utils CLI - Comprehensive testing framework for CLI applications',
  },
  args: {
    'show-help': {
      type: 'boolean',
      description: 'Show help information',
      default: false,
    },
    'show-version': {
      type: 'boolean',
      description: 'Show version information',
      default: false,
    },
    json: {
      type: 'boolean',
      description: 'Output in JSON format',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
    },
  },
  run: async (ctx) => {
    const { 'show-help': showHelp, 'show-version': showVersion, json, verbose } = ctx.args

    if (showVersion) {
      const version = '1.0.0'
      if (json) {
        console.log(JSON.stringify({ version, name: 'citty-test-utils' }))
      } else {
        console.log(version)
      }
      return
    }

    if (showHelp || ctx.args._.length === 0) {
      const help = {
        name: 'citty-test-utils',
        version: '1.0.0',
        description: 'Citty Test Utils CLI - Comprehensive testing framework for CLI applications',
        usage: 'citty-test-utils <command> [options]',
        commands: [
          { name: 'greet', description: 'Greet someone' },
          { name: 'math', description: 'Perform mathematical operations' },
          { name: 'error', description: 'Simulate different types of errors' },
          { name: 'info', description: 'Show CLI information' },
          { name: 'test', description: 'Run test scenarios' },
          { name: 'runner', description: 'Custom runner functionality' },
          { name: 'generate', description: 'Generate test files and templates' },
        ],
      }

      if (json) {
        console.log(JSON.stringify(help, null, 2))
      } else {
        console.log(
          'Citty Test Utils CLI - Comprehensive testing framework for CLI applications (citty-test-utils v1.0.0)'
        )
        console.log('')
        console.log('USAGE citty-test-utils <command> [options]')
        console.log('')
        console.log('COMMANDS')
        console.log('')
        help.commands.forEach((cmd) => {
          console.log(`  ${cmd.name.padEnd(12)} ${cmd.description}`)
        })
        console.log('')
        console.log('Use citty-test-utils <command> --help for more information about a command.')
      }
      return
    }
  },
  subCommands: {
    greet: defineCommand({
      meta: {
        name: 'greet',
        description: 'Greet someone',
      },
      args: {
        name: {
          type: 'positional',
          description: 'Name to greet',
          default: 'World',
        },
        count: {
          type: 'number',
          description: 'Number of times to repeat',
          default: 1,
        },
        formal: {
          type: 'boolean',
          description: 'Use formal greeting',
          default: false,
        },
      },
      run: async (ctx) => {
        const { name, count, formal, json, verbose } = ctx.args

        if (verbose) {
          console.error('Verbose mode enabled')
        }

        const greeting = formal ? `Good day, ${name}` : `Hello, ${name}`
        const result = {
          message: greeting,
          count,
          formal,
          timestamp: new Date().toISOString(),
        }

        if (json) {
          console.log(JSON.stringify(result))
        } else {
          for (let i = 0; i < count; i++) {
            console.log(`${greeting}!`)
          }
        }
      },
    }),

    math: defineCommand({
      meta: {
        name: 'math',
        description: 'Perform mathematical operations',
      },
      args: {
        operation: {
          type: 'positional',
          description: 'Operation to perform (add, subtract, multiply, divide)',
          required: true,
        },
        a: {
          type: 'positional',
          description: 'First number',
          required: true,
        },
        b: {
          type: 'positional',
          description: 'Second number',
          required: true,
        },
        precision: {
          type: 'number',
          description: 'Decimal precision',
          default: 2,
        },
      },
      run: async (ctx) => {
        const { operation, a, b, precision, json, verbose } = ctx.args

        // Convert string arguments to numbers
        const numA = Number(a)
        const numB = Number(b)

        if (verbose) {
          console.error(`Performing ${operation} on ${numA} and ${numB}`)
        }

        let result
        switch (operation.toLowerCase()) {
          case 'add':
            result = numA + numB
            break
          case 'subtract':
            result = numA - numB
            break
          case 'multiply':
            result = numA * numB
            break
          case 'divide':
            if (numB === 0) {
              const error = { error: 'Division by zero', operation, a: numA, b: numB }
              if (json) {
                console.log(JSON.stringify(error))
              } else {
                console.error('Error: Division by zero')
              }
              process.exit(1)
            }
            result = numA / numB
            break
          default:
            const error = {
              error: 'Invalid operation',
              operation,
              validOperations: ['add', 'subtract', 'multiply', 'divide'],
            }
            if (json) {
              console.log(JSON.stringify(error))
            } else {
              console.error(
                'Error: Invalid operation. Valid operations: add, subtract, multiply, divide'
              )
            }
            process.exit(1)
        }

        const formattedResult = Number(result.toFixed(precision))
        const output = {
          operation,
          a: numA,
          b: numB,
          result: formattedResult,
          precision,
        }

        if (json) {
          console.log(JSON.stringify(output))
        } else {
          console.log(`${numA} ${operation} ${numB} = ${formattedResult}`)
        }
      },
    }),

    error: defineCommand({
      meta: {
        name: 'error',
        description: 'Simulate different types of errors',
      },
      args: {
        type: {
          type: 'positional',
          description: 'Error type (timeout, exit, exception, stderr)',
          required: true,
        },
        message: {
          type: 'string',
          description: 'Error message',
          default: 'Simulated error',
        },
        code: {
          type: 'number',
          description: 'Exit code for exit errors',
          default: 1,
        },
        delay: {
          type: 'number',
          description: 'Delay in milliseconds before error',
          default: 0,
        },
      },
      run: async (ctx) => {
        const { type, message, code, delay, json, verbose } = ctx.args

        if (verbose) {
          console.error(`Simulating ${type} error: ${message}`)
        }

        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        const errorInfo = {
          type,
          message,
          code,
          delay,
          timestamp: new Date().toISOString(),
        }

        switch (type.toLowerCase()) {
          case 'timeout':
            // Simulate timeout by waiting longer than expected
            await new Promise((resolve) => setTimeout(resolve, 10000))
            break
          case 'exit':
            if (json) {
              console.log(JSON.stringify({ error: errorInfo }))
            } else {
              console.error(`Error: ${message}`)
            }
            process.exit(code)
          case 'exception':
            throw new Error(message)
          case 'stderr':
            if (json) {
              console.log(JSON.stringify({ error: errorInfo }))
            } else {
              console.error(`Error: ${message}`)
            }
            process.exit(code)
          default:
            const error = {
              error: 'Invalid error type',
              type,
              validTypes: ['timeout', 'exit', 'exception', 'stderr'],
            }
            if (json) {
              console.log(JSON.stringify(error))
            } else {
              console.error(
                'Error: Invalid error type. Valid types: timeout, exit, exception, stderr'
              )
            }
            process.exit(1)
        }
      },
    }),

    info: defineCommand({
      meta: {
        name: 'info',
        description: 'Show CLI information',
      },
      args: {
        section: {
          type: 'positional',
          description: 'Information section (version, features, config, all)',
          default: 'all',
        },
      },
      run: async (ctx) => {
        const { section, json, verbose } = ctx.args

        if (verbose) {
          console.error(`Showing ${section} information`)
        }

        const info = {
          name: 'citty-test-utils',
          version: '1.0.0',
          description: 'Comprehensive testing framework for CLI applications',
          features: [
            'Local and cleanroom (Docker) testing',
            'Fluent assertions',
            'Scenario DSL',
            'Pre-built test scenarios',
            'Custom runner functionality',
            'Template generation',
            'Snapshot testing',
            'Enterprise testing patterns',
          ],
          config: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            cwd: process.cwd(),
          },
          timestamp: new Date().toISOString(),
        }

        if (json) {
          if (section === 'all') {
            console.log(JSON.stringify(info, null, 2))
          } else {
            console.log(JSON.stringify({ [section]: info[section] }, null, 2))
          }
        } else {
          switch (section.toLowerCase()) {
            case 'version':
              console.log(`Version: ${info.version}`)
              break
            case 'features':
              console.log('Features:')
              info.features.forEach((feature) => console.log(`  - ${feature}`))
              break
            case 'config':
              console.log('Configuration:')
              Object.entries(info.config).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`)
              })
              break
            case 'all':
            default:
              console.log(`Name: ${info.name}`)
              console.log(`Version: ${info.version}`)
              console.log(`Description: ${info.description}`)
              console.log('')
              console.log('Features:')
              info.features.forEach((feature) => console.log(`  - ${feature}`))
              console.log('')
              console.log('Configuration:')
              Object.entries(info.config).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`)
              })
              break
          }
        }
      },
    }),

    test: defineCommand({
      meta: {
        name: 'test',
        description: 'Run test scenarios',
      },
      args: {
        scenario: {
          type: 'positional',
          description: 'Test scenario to run (help, version, error, all)',
          default: 'all',
        },
        environment: {
          type: 'string',
          description: 'Test environment (local, cleanroom)',
          default: 'local',
        },
        timeout: {
          type: 'number',
          description: 'Test timeout in milliseconds',
          default: 10000,
        },
      },
      run: async (ctx) => {
        const { scenario: scenarioName, environment, timeout, json, verbose } = ctx.args

        if (verbose) {
          console.error(`Running ${scenarioName} scenario in ${environment} environment`)
        }

        try {
          let result

          if (scenarioName === 'all') {
            // Run all scenarios
            const results = []

            // Help scenario
            const helpResult = await scenarios.help(environment).execute()
            results.push({ scenario: 'help', success: helpResult.success })

            // Version scenario
            const versionResult = await scenarios.version(environment).execute()
            results.push({ scenario: 'version', success: versionResult.success })

            result = {
              environment,
              scenarios: results,
              allPassed: results.every((r) => r.success),
              timestamp: new Date().toISOString(),
            }
          } else {
            // Run specific scenario
            const scenarioRunner = scenarios[scenarioName]
            if (!scenarioRunner) {
              const error = {
                error: 'Invalid scenario',
                scenario: scenarioName,
                validScenarios: Object.keys(scenarios),
              }
              if (json) {
                console.log(JSON.stringify(error))
              } else {
                console.error(
                  `Error: Invalid scenario. Valid scenarios: ${Object.keys(scenarios).join(', ')}`
                )
              }
              process.exit(1)
            }

            const scenarioResult = await scenarioRunner(environment).execute()
            result = {
              scenario: scenarioName,
              environment,
              success: scenarioResult.success,
              timestamp: new Date().toISOString(),
            }
          }

          if (json) {
            console.log(JSON.stringify(result))
          } else {
            if (result.allPassed !== undefined) {
              console.log(`Test Results (${environment}):`)
              result.scenarios.forEach((r) => {
                console.log(`  ${r.scenario}: ${r.success ? '✅ PASS' : '❌ FAIL'}`)
              })
              console.log(`Overall: ${result.allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`)
            } else {
              console.log(`${result.scenario}: ${result.success ? '✅ PASS' : '❌ FAIL'}`)
            }
          }
        } catch (error) {
          const errorResult = {
            error: error.message,
            scenario: scenarioName,
            environment,
            timestamp: new Date().toISOString(),
          }

          if (json) {
            console.log(JSON.stringify(errorResult))
          } else {
            console.error(`Test failed: ${error.message}`)
          }
          process.exit(1)
        }
      },
    }),

    runner: defineCommand({
      meta: {
        name: 'runner',
        description: 'Custom runner functionality',
      },
      args: {
        command: {
          type: 'positional',
          description: 'Command to run',
          required: true,
        },
        environment: {
          type: 'string',
          description: 'Runner environment (local, cleanroom)',
          default: 'local',
        },
        timeout: {
          type: 'number',
          description: 'Command timeout in milliseconds',
          default: 10000,
        },
        cwd: {
          type: 'string',
          description: 'Working directory',
          default: '.',
        },
      },
      run: async (ctx) => {
        const { command, environment, timeout, cwd, json, verbose } = ctx.args

        if (verbose) {
          console.error(`Running command "${command}" in ${environment} environment`)
        }

        try {
          let result

          if (environment === 'cleanroom') {
            // Setup cleanroom
            await setupCleanroom({ rootDir: cwd, timeout: 60000 })

            try {
              // Run command in cleanroom
              const cleanroomResult = await runCitty([command], {
                cwd: '/app',
                timeout,
                env: { TEST_CLI: 'true' },
              })

              result = {
                environment: 'cleanroom',
                command,
                exitCode: cleanroomResult.result.exitCode,
                stdout: cleanroomResult.result.stdout,
                stderr: cleanroomResult.result.stderr,
                success: cleanroomResult.result.exitCode === 0,
                timestamp: new Date().toISOString(),
              }
            } finally {
              // Always cleanup
              await teardownCleanroom()
            }
          } else {
            // Run command locally
            const localResult = await runLocalCitty([command], {
              cwd,
              timeout,
              env: { TEST_CLI: 'true' },
            })

            result = {
              environment: 'local',
              command,
              exitCode: localResult.result.exitCode,
              stdout: localResult.result.stdout,
              stderr: localResult.result.stderr,
              success: localResult.result.exitCode === 0,
              timestamp: new Date().toISOString(),
            }
          }

          if (json) {
            console.log(JSON.stringify(result))
          } else {
            console.log(`Command: ${command}`)
            console.log(`Environment: ${environment}`)
            console.log(`Exit Code: ${result.exitCode}`)
            console.log(`Success: ${result.success ? '✅' : '❌'}`)
            if (result.stdout) {
              console.log('Output:')
              console.log(result.stdout)
            }
            if (result.stderr) {
              console.log('Errors:')
              console.log(result.stderr)
            }
          }
        } catch (error) {
          const errorResult = {
            error: error.message,
            command,
            environment,
            timestamp: new Date().toISOString(),
          }

          if (json) {
            console.log(JSON.stringify(errorResult))
          } else {
            console.error(`Runner failed: ${error.message}`)
          }
          process.exit(1)
        }
      },
    }),

    generate: defineCommand({
      meta: {
        name: 'generate',
        description: 'Generate test files and templates',
      },
      args: {
        template: {
          type: 'positional',
          description: 'Template to generate (test, scenario, config)',
          required: true,
        },
        name: {
          type: 'string',
          description: 'Name for the generated file',
          required: true,
        },
        output: {
          type: 'string',
          description: 'Output directory',
          default: '.',
        },
        format: {
          type: 'string',
          description: 'Output format (js, mjs, ts)',
          default: 'mjs',
        },
      },
      run: async (ctx) => {
        const { template, name, output, format, json, verbose } = ctx.args

        if (verbose) {
          console.error(`Generating ${template} template: ${name}.${format}`)
        }

        // TODO: Implement nunjucks template generation
        const result = {
          template,
          name,
          output,
          format,
          status: 'pending',
          message: 'Template generation will be implemented with nunjucks',
          timestamp: new Date().toISOString(),
        }

        if (json) {
          console.log(JSON.stringify(result))
        } else {
          console.log(`Generating ${template} template: ${name}.${format}`)
          console.log(`Output directory: ${output}`)
          console.log(`Status: ${result.status}`)
          console.log(`Note: ${result.message}`)
        }
      },
    }),
  },
})

// Only run the CLI when this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMain(cittyTestUtils)
}
