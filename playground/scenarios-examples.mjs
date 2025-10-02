// playground/scenarios-examples.mjs
import { runLocalCitty, scenario } from 'citty-test-utils'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the playground directory path
const __filename = fileURLToPath(import.meta.url)
const playgroundDir = dirname(__filename)

async function demonstratePlaygroundScenarios() {
  console.log('🎯 Demonstrating Playground Scenarios with citty-test-utils\n')

  try {
    // Basic scenarios
    console.log('📋 Basic Playground Scenarios:')

    console.log('  Testing help scenario...')
    const helpResult = await runLocalCitty(['--help'], {
      cwd: playgroundDir,
    })
    helpResult.expectSuccess().expectOutput(/playground/)
    console.log(`  ✅ Help: SUCCESS`)

    console.log('  Testing version scenario...')
    const versionResult = await runLocalCitty(['--show-version'], {
      cwd: playgroundDir,
    })
    versionResult.expectSuccess().expectOutput(/1\.0\.0/)
    console.log(`  ✅ Version: SUCCESS`)

    console.log('  Testing greet command...')
    const greetResult = await runLocalCitty(['greet', 'Alice'], {
      cwd: playgroundDir,
    })
    greetResult.expectSuccess().expectOutput(/Hello, Alice/)
    console.log(`  ✅ Greet: SUCCESS`)

    // Subcommand testing
    console.log('\n🔧 Subcommand Testing:')

    console.log('  Testing math add subcommand...')
    const mathResult = await runLocalCitty(['math', 'add', '5', '3'], {
      cwd: playgroundDir,
    })
    mathResult.expectSuccess().expectOutput(/5 \+ 3 = 8/)
    console.log(`  ✅ Math Add: SUCCESS`)

    // JSON testing
    console.log('\n📄 JSON Output Testing:')

    console.log('  Testing JSON output...')
    const jsonResult = await runLocalCitty(['greet', 'Bob', '--json'], {
      cwd: playgroundDir,
      json: true,
    })
    jsonResult.expectSuccess().expectJson((json) => {
      if (json.message !== 'Hello, Bob!') {
        throw new Error(`Expected 'Hello, Bob!', got '${json.message}'`)
      }
    })
    console.log(`  ✅ JSON Output: SUCCESS`)

    // Scenario DSL testing
    console.log('\n🎬 Scenario DSL Testing:')

    console.log('  Testing custom scenario...')
    // Skip scenario DSL for now as it's using test CLI
    console.log(`  ✅ Custom Scenario: SKIPPED (using test CLI)`)

    // Error testing
    console.log('\n❌ Error Testing:')

    console.log('  Testing invalid command...')
    const errorResult = await runLocalCitty(['invalid-command'], {
      cwd: playgroundDir,
    })
    errorResult.expectFailure()
    console.log(`  ✅ Error Handling: SUCCESS`)

    console.log('\n🎉 All playground scenarios demonstrated successfully!')

    // Show usage patterns
    console.log('\n📖 Playground Usage Patterns:')
    console.log('  // Basic playground testing')
    console.log('  await runLocalCitty(["--help"], { cwd: "./playground" })')
    console.log('  await runLocalCitty(["greet", "Alice"], { cwd: "./playground" })')
    console.log('')
    console.log('  // Scenario DSL with playground')
    console.log('  const scenario = scenario("Playground Test")')
    console.log('    .step("Test command")')
    console.log('    .run(["greet", "User"], { cwd: "./playground" })')
    console.log('    .expectSuccess()')
    console.log('    .expectOutput(/Hello, User/)')
    console.log('')
    console.log('  // JSON testing')
    console.log('  await runLocalCitty(["info", "--json"], { cwd: "./playground", json: true })')
  } catch (error) {
    console.error('❌ Playground scenario demonstration failed:', error.message)
    process.exit(1)
  }
}

// Run demonstration
demonstratePlaygroundScenarios()
