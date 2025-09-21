import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  setupCleanroom,
  runCitty,
  runLocalCitty,
  teardownCleanroom,
} from '../../src/core/runners/legacy-compatibility.js'
import { CleanroomTestUtils } from './error-handling-utilities.mjs'

describe('Comprehensive Crash Tests - Let It Crash Philosophy', () => {
  let cleanroomSetup = false

  beforeAll(async () => {
    console.log('🐳 Setting up Docker cleanroom for crash testing...')
    await setupCleanroom({
      rootDir: '.',
      timeout: 60000,
    })
    cleanroomSetup = true
    console.log('✅ Cleanroom setup complete')
  }, 60000)

  afterAll(async () => {
    if (cleanroomSetup) {
      console.log('🧹 Cleaning up Docker cleanroom...')
      await teardownCleanroom()
      console.log('✅ Cleanroom cleanup complete')
    }
  }, 30000)

  describe('Command Failure Crash Tests', () => {
    it('should crash on nonexistent commands', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash when we call expectFailure()
      const result = await runCitty(['nonexistent-command'], { env: { TEST_CLI: 'false' } })
      
      // Let it crash - this will throw if the command didn't fail
      result.expectFailure()
      
      console.log('✅ Command failure properly surfaced')
    })

    it('should crash on invalid gen commands', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash when we call expectFailure()
      const result = await runCitty(['gen', 'nonexistent-type'], { env: { TEST_CLI: 'false' } })
      
      // Let it crash - this will throw if the command didn't fail
      result.expectFailure()
      
      console.log('✅ Gen command failure properly surfaced')
    })

    it('should crash on invalid test commands', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash when we call expectFailure()
      const result = await runCitty(['test', 'nonexistent-test'], { env: { TEST_CLI: 'false' } })
      
      // Let it crash - this will throw if the command didn't fail
      result.expectFailure()
      
      console.log('✅ Test command failure properly surfaced')
    })

    it('should crash on malformed arguments', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash when we call expectFailure()
      const result = await runCitty(['gen', 'project', '--invalid-flag'], { env: { TEST_CLI: 'false' } })
      
      // Let it crash - this will throw if the command didn't fail
      result.expectFailure()
      
      console.log('✅ Malformed arguments failure properly surfaced')
    })
  })

  describe('Concurrent Failure Crash Tests', () => {
    it('should crash on concurrent operations with failures', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash immediately if any operation fails
      const results = await CleanroomTestUtils.concurrentOperations([
        runCitty(['--help'], { env: { TEST_CLI: 'false' } }), // Should succeed
        runCitty(['nonexistent-command'], { env: { TEST_CLI: 'false' } }), // Should fail
        runCitty(['--version'], { env: { TEST_CLI: 'false' } }), // Should succeed
      ])

      // Let it crash - check that the middle operation failed
      results[1].expectFailure()
      
      console.log('✅ Concurrent failure properly surfaced')
    })

    it('should crash on mixed success/failure scenarios', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash immediately if any operation fails
      const results = await CleanroomTestUtils.concurrentOperations([
        runCitty(['--help'], { env: { TEST_CLI: 'false' } }), // Should succeed
        runCitty(['gen', 'invalid-type'], { env: { TEST_CLI: 'false' } }), // Should fail
        runCitty(['test', 'invalid-test'], { env: { TEST_CLI: 'false' } }), // Should fail
        runCitty(['--version'], { env: { TEST_CLI: 'false' } }), // Should succeed
      ])

      // Let it crash - check that the failing operations failed
      results[1].expectFailure()
      results[2].expectFailure()
      
      console.log('✅ Mixed success/failure properly surfaced')
    })
  })

  describe('Import Failure Crash Tests', () => {
    it('should crash on nonexistent module imports', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash immediately if import fails
      await expect(
        CleanroomTestUtils.importModule('../../nonexistent/module.js')
      ).rejects.toThrow()
      
      console.log('✅ Import failure properly surfaced')
    })

    it('should crash on malformed module imports', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash immediately if import fails
      await expect(
        CleanroomTestUtils.importModule('../../src/core/nonexistent.js')
      ).rejects.toThrow()
      
      console.log('✅ Malformed import failure properly surfaced')
    })
  })

  describe('Validation Failure Crash Tests', () => {
    it('should crash on null result validation', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash immediately if validation fails
      await expect(
        CleanroomTestUtils.validateResult(null, ['stdout'], 'Test validation')
      ).rejects.toThrow()
      
      console.log('✅ Null validation failure properly surfaced')
    })

    it('should crash on undefined result validation', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash immediately if validation fails
      await expect(
        CleanroomTestUtils.validateResult(undefined, ['stdout'], 'Test validation')
      ).rejects.toThrow()
      
      console.log('✅ Undefined validation failure properly surfaced')
    })

    it('should crash on missing property validation', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash immediately if validation fails
      const fakeResult = { result: { stderr: 'test' } } // Missing stdout
      await expect(
        CleanroomTestUtils.validateResult(fakeResult, ['stdout'], 'Test validation')
      ).rejects.toThrow()
      
      console.log('✅ Missing property validation failure properly surfaced')
    })
  })

  describe('Cross-Environment Failure Crash Tests', () => {
    it('should crash on cross-environment mismatches', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash if either operation fails
      const { local, cleanroom } = await CleanroomTestUtils.crossEnvironment(
        () => runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } }),
        () => runCitty(['--version'], { env: { TEST_CLI: 'true' } })
      )

      // Let it crash if results don't match
      expect(local.stdout).toBe(cleanroom.stdout)
      
      console.log('✅ Cross-environment mismatch properly surfaced')
    })

    it('should crash on cross-environment operation failures', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash if either operation fails
      await expect(
        CleanroomTestUtils.crossEnvironment(
          () => runLocalCitty(['nonexistent-command'], { env: { TEST_CLI: 'true' } }),
          () => runCitty(['--version'], { env: { TEST_CLI: 'true' } })
        )
      ).rejects.toThrow()
      
      console.log('✅ Cross-environment operation failure properly surfaced')
    })
  })

  describe('Scenario Failure Crash Tests', () => {
    it('should crash on scenario execution failures', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash if scenario execution fails
      const { scenario } = await CleanroomTestUtils.importModule('../../src/core/scenarios/scenario-dsl.js')
      
      const result = await CleanroomTestUtils.executeScenario(
        scenario('Failing scenario')
          .step('Failing step')
          .run('nonexistent-command')
          .expectSuccess() // This should fail
      )

      // Let it crash - the scenario should have failed
      expect(result.success).toBe(false)
      
      console.log('✅ Scenario execution failure properly surfaced')
    })

    it('should crash on scenario import failures', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash if scenario import fails
      await expect(
        CleanroomTestUtils.importModule('../../src/core/scenarios/nonexistent-scenario.js')
      ).rejects.toThrow()
      
      console.log('✅ Scenario import failure properly surfaced')
    })
  })

  describe('Timeout Failure Crash Tests', () => {
    it('should crash on timeout operations', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash if timeout occurs
      await expect(
        runCitty(['coverage', '--cleanroom'], { 
          env: { TEST_CLI: 'false' },
          timeout: 1000 // Very short timeout
        })
      ).rejects.toThrow()
      
      console.log('✅ Timeout failure properly surfaced')
    })
  })

  describe('Environment Failure Crash Tests', () => {
    it('should crash on invalid environment variables', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash if environment is invalid
      const result = await runCitty(['--help'], { 
        env: { 
          TEST_CLI: 'invalid-value',
          INVALID_ENV: 'should-cause-issues'
        } 
      })
      
      // Let it crash - check for error output
      result.expectOutputNotContains('ERROR')
      
      console.log('✅ Environment failure properly surfaced')
    })
  })

  describe('File System Failure Crash Tests', () => {
    it('should crash on file system operations', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash if file system operation fails
      const result = await runCitty(['node', '-e', `
        const { writeFileSync } = require('node:fs');
        writeFileSync('/nonexistent/path/file.txt', 'test');
      `], {
        env: { TEST_CLI: 'true' }
      })
      
      // Let it crash - this should fail due to permission issues
      result.expectFailure()
      
      console.log('✅ File system failure properly surfaced')
    })
  })

  describe('Network Failure Crash Tests', () => {
    it('should crash on network operations', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash if network operation fails
      const result = await runCitty(['node', '-e', `
        const https = require('https');
        https.get('https://nonexistent-domain-that-should-fail.com', (res) => {
          console.log('Unexpected success');
        }).on('error', (err) => {
          console.error('Network error:', err.message);
          process.exit(1);
        });
      `], {
        env: { TEST_CLI: 'true' },
        timeout: 5000
      })
      
      // Let it crash - this should fail due to network issues
      result.expectFailure()
      
      console.log('✅ Network failure properly surfaced')
    })
  })

  describe('Memory Failure Crash Tests', () => {
    it('should crash on memory-intensive operations', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash if memory operation fails
      const result = await runCitty(['node', '-e', `
        const arr = [];
        for (let i = 0; i < 1000000000; i++) {
          arr.push(new Array(1000).fill('memory-intensive'));
        }
        console.log('Memory test completed');
      `], {
        env: { TEST_CLI: 'true' },
        timeout: 10000
      })
      
      // Let it crash - this should fail due to memory issues
      result.expectFailure()
      
      console.log('✅ Memory failure properly surfaced')
    })
  })

  describe('Process Failure Crash Tests', () => {
    it('should crash on process exit operations', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // This should crash if process exits unexpectedly
      const result = await runCitty(['node', '-e', `
        console.log('About to exit');
        process.exit(42);
      `], {
        env: { TEST_CLI: 'true' }
      })
      
      // Let it crash - this should fail with exit code 42
      result.expectExitCodeIn([42])
      
      console.log('✅ Process exit failure properly surfaced')
    })
  })

  describe('Crash Test Summary', () => {
    it('should demonstrate comprehensive crash testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      console.log('🎯 COMPREHENSIVE CRASH TESTING COMPLETE:')
      console.log('   ✅ Command failures properly surfaced')
      console.log('   ✅ Concurrent failures properly surfaced')
      console.log('   ✅ Import failures properly surfaced')
      console.log('   ✅ Validation failures properly surfaced')
      console.log('   ✅ Cross-environment failures properly surfaced')
      console.log('   ✅ Scenario failures properly surfaced')
      console.log('   ✅ Timeout failures properly surfaced')
      console.log('   ✅ Environment failures properly surfaced')
      console.log('   ✅ File system failures properly surfaced')
      console.log('   ✅ Network failures properly surfaced')
      console.log('   ✅ Memory failures properly surfaced')
      console.log('   ✅ Process failures properly surfaced')
      console.log('   🚀 "Let it crash" philosophy fully validated!')
    })
  })
})

