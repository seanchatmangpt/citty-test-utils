/**
 * citty-test-utils v1.0.0
 * Unified testing framework for CLI applications
 */

// ===== PRIMARY API (v1.0.0) =====

/**
 * Unified runner - auto-detects local vs cleanroom mode
 *
 * @example Basic usage
 * import { runCitty } from 'citty-test-utils'
 * const result = await runCitty(['--help'])
 * result.expectSuccess()
 *
 * @example Force cleanroom mode
 * const result = await runCitty(['test'], {
 *   cleanroom: { enabled: true }
 * })
 */
export {
  runCitty,
  runCittySafe,
  getCittyConfig,
  teardownCleanroom
} from './src/core/runners/unified-runner.js'

/**
 * Simplified Scenario DSL (v1.0.0)
 *
 * @example
 * import { scenario } from 'citty-test-utils'
 *
 * await scenario('Build workflow')
 *   .step('Check version', '--version').expectSuccess()
 *   .step('Build prod', ['build', '--prod']).expectSuccess()
 *   .execute() // auto-detects mode from vitest.config
 */
export { scenario } from './src/core/scenarios/scenario-dsl.js'

/**
 * Fluent Assertions
 */
export { wrapExpectation } from './src/core/assertions/assertions.js'

/**
 * Snapshot Testing
 */
export { matchSnapshot, snapshotUtils } from './src/core/assertions/snapshot.js'

/**
 * Test Utilities
 */
export * from './src/core/utils/context-manager.js'

/**
 * CLI Coverage Analysis
 */
export * from './src/core/coverage/cli-coverage-analyzer.js'

// ===== DEPRECATED (Backward Compatibility) =====

/**
 * @deprecated Use runCitty() instead
 * Kept for backward compatibility with v0.6.x code
 */
export {
  runLocalCitty,
  runLocalCittySafe
} from './src/core/runners/local-runner.js'

/**
 * @deprecated Use runCitty() with cleanroom.enabled option
 */
export {
  runCitty as runCleanroom,
  setupCleanroom,
  teardownCleanroom as cleanupCleanroom
} from './src/core/runners/cleanroom-runner.js'
