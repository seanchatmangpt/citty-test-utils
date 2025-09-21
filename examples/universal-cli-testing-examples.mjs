#!/usr/bin/env node
/**
 * @fileoverview Universal CLI Testing Examples
 * @description Examples showing how to use the universal contract with different frameworks
 */

import {
  LocalRunner,
  DockerRunner,
  nodeAdapter,
  pythonAdapter,
  goAdapter,
  createUniversalRunner,
  scenario,
  helpScenario,
  versionScenario,
  jsonModeScenario,
  expect,
  matrix,
  createReporter,
  TestReport,
} from '../index.js'

/**
 * Example 1: Testing a Node.js CLI with local runner
 */
export async function nodeCliExample() {
  console.log('=== Node.js CLI Testing Example ===')

  // Create local runner
  const runner = new LocalRunner()

  // Create Node.js adapter
  const adapter = nodeAdapter('src/cli.mjs')

  // Create universal runner
  const universalRunner = createUniversalRunner(adapter, runner)

  try {
    // Test help command
    const helpResult = await universalRunner.run(['--help'])
    console.log('Help command result:', helpResult.isSuccess())

    // Test with fluent assertions
    const versionResult = await universalRunner.run(['--version'])
    expect(versionResult)
      .expectSuccess()
      .expectOutput(/\d+\.\d+\.\d+/)
      .expectNoStderr()
      .assert()

    console.log('✅ Node.js CLI tests passed')
  } catch (error) {
    console.error('❌ Node.js CLI tests failed:', error.message)
  } finally {
    await runner.teardown()
  }
}

/**
 * Example 2: Testing a Python CLI with Docker runner
 */
export async function pythonCliExample() {
  console.log('=== Python CLI Testing Example ===')

  // Create Docker runner
  const runner = new DockerRunner({
    image: 'python:3.11-alpine',
    mounts: [{ source: process.cwd(), target: '/app' }],
  })

  // Create Python adapter
  const adapter = pythonAdapter('cli')

  // Create universal runner
  const universalRunner = createUniversalRunner(adapter, runner)

  try {
    await runner.setup()

    // Test help command
    const helpResult = await universalRunner.run(['--help'])
    console.log('Python help result:', helpResult.isSuccess())

    // Test JSON output
    const jsonResult = await universalRunner.run(['--json'])
    expect(jsonResult).expectSuccess().expectJson().assert()

    console.log('✅ Python CLI tests passed')
  } catch (error) {
    console.error('❌ Python CLI tests failed:', error.message)
  } finally {
    await runner.teardown()
  }
}

/**
 * Example 3: Testing a Go CLI with cross-platform matrix
 */
export async function goCliMatrixExample() {
  console.log('=== Go CLI Matrix Testing Example ===')

  // Define matrix axes
  const axes = {
    goVersion: ['1.19', '1.20', '1.21'],
    os: ['linux', 'alpine'],
  }

  // Run matrix tests
  const results = await matrix(axes, async (context) => {
    const runner = new DockerRunner({
      image: `golang:${context.goVersion}-${context.os}`,
      mounts: [{ source: process.cwd(), target: '/app' }],
    })

    const adapter = goAdapter('./dist/app')
    const universalRunner = createUniversalRunner(adapter, runner)

    try {
      await runner.setup()

      const result = await universalRunner.run(['--version'])
      expect(result).expectSuccess().assert()

      return { context, success: true }
    } catch (error) {
      return { context, success: false, error: error.message }
    } finally {
      await runner.teardown()
    }
  })

  console.log('Matrix results:', results)
  console.log('✅ Go CLI matrix tests completed')
}

/**
 * Example 4: Using pre-built scenario packs
 */
export async function scenarioPacksExample() {
  console.log('=== Scenario Packs Example ===')

  const runner = new LocalRunner()
  const adapter = nodeAdapter('src/cli.mjs')
  const universalRunner = createUniversalRunner(adapter, runner)

  try {
    // Run help scenario
    const helpScenarioResult = await helpScenario().execute(universalRunner.getRunner())
    console.log('Help scenario:', helpScenarioResult.success)

    // Run version scenario
    const versionScenarioResult = await versionScenario().execute(universalRunner.getRunner())
    console.log('Version scenario:', versionScenarioResult.success)

    // Run JSON mode scenario
    const jsonScenarioResult = await jsonModeScenario().execute(universalRunner.getRunner())
    console.log('JSON scenario:', jsonScenarioResult.success)

    console.log('✅ Scenario packs tests completed')
  } catch (error) {
    console.error('❌ Scenario packs tests failed:', error.message)
  } finally {
    await runner.teardown()
  }
}

/**
 * Example 5: Custom scenario with PTY support
 */
export async function ptyScenarioExample() {
  console.log('=== PTY Scenario Example ===')

  const runner = new LocalRunner()
  const adapter = nodeAdapter('src/cli.mjs')
  const universalRunner = createUniversalRunner(adapter, runner)

  try {
    // Create custom interactive scenario
    const interactiveScenario = scenario('Interactive CLI')
      .step('Interactive command', async (runner) => {
        const script = 'y\nusername\npassword\n'
        return await runner.execPty(['interactive'], script)
      })
      .step('Verify interaction', async (runner) => {
        const script = 'y\nusername\npassword\n'
        const result = await runner.execPty(['interactive'], script)
        expect(result)
          .expectSuccess()
          .expectOutput(/welcome|success/i)
          .assert()
        return result
      })

    const result = await interactiveScenario.execute(runner)
    console.log('Interactive scenario:', result.success)

    console.log('✅ PTY scenario tests completed')
  } catch (error) {
    console.error('❌ PTY scenario tests failed:', error.message)
  } finally {
    await runner.teardown()
  }
}

/**
 * Example 6: Generating reports
 */
export async function reportGenerationExample() {
  console.log('=== Report Generation Example ===')

  // Create test report
  const report = new TestReport({
    suites: [
      {
        name: 'CLI Tests',
        tests: [
          { name: 'Help Command', passed: true, durationMs: 150 },
          { name: 'Version Command', passed: true, durationMs: 120 },
          { name: 'Invalid Command', passed: false, durationMs: 80, error: 'Command not found' },
        ],
        stats: { pass: 2, fail: 1, skip: 0 },
        durationMs: 350,
      },
    ],
    stats: { pass: 2, fail: 1, skip: 0, durationMs: 350 },
  })

  // Generate different report formats
  const jsonReporter = createReporter('json')
  const htmlReporter = createReporter('html')
  const junitReporter = createReporter('junit')
  const tapReporter = createReporter('tap')

  try {
    await jsonReporter.write(report, 'test-results.json')
    await htmlReporter.write(report, 'test-results.html')
    await junitReporter.write(report, 'test-results.xml')
    await tapReporter.write(report, 'test-results.tap')

    console.log('✅ Reports generated successfully')
  } catch (error) {
    console.error('❌ Report generation failed:', error.message)
  }
}

/**
 * Example 7: Cross-language CLI testing
 */
export async function crossLanguageExample() {
  console.log('=== Cross-Language CLI Testing Example ===')

  const languages = [
    { name: 'Node.js', adapter: nodeAdapter('src/cli.mjs') },
    { name: 'Python', adapter: pythonAdapter('cli') },
    { name: 'Go', adapter: goAdapter('./dist/app') },
  ]

  const runner = new LocalRunner()

  for (const lang of languages) {
    try {
      const universalRunner = createUniversalRunner(lang.adapter, runner)

      // Test help command across languages
      const result = await universalRunner.run(['--help'])
      expect(result).expectSuccess().assert()

      console.log(`✅ ${lang.name} CLI test passed`)
    } catch (error) {
      console.log(`❌ ${lang.name} CLI test failed:`, error.message)
    }
  }

  await runner.teardown()
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Running Universal CLI Testing Examples\n')

  try {
    await nodeCliExample()
    console.log()

    await pythonCliExample()
    console.log()

    await goCliMatrixExample()
    console.log()

    await scenarioPacksExample()
    console.log()

    await ptyScenarioExample()
    console.log()

    await reportGenerationExample()
    console.log()

    await crossLanguageExample()
    console.log()

    console.log('🎉 All examples completed successfully!')
  } catch (error) {
    console.error('💥 Examples failed:', error.message)
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples()
}
