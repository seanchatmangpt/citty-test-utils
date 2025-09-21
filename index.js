// Universal CLI Testing Contract (Framework-Agnostic)
export * from './src/core/contract/universal-contract.js'
export * from './src/core/adapters/adapters.js'
export * from './src/core/runners/local-runner.js'
export * from './src/core/runners/docker-runner.js'
export * from './src/core/scenarios/scenario-packs.js'
export * from './src/core/reporters/reporters.js'

// Legacy Compatibility Layer (for CLI testing)
export * from './src/core/runners/legacy-compatibility.js'

// Legacy Scenario DSL and Test Utils (for existing tests)
export * from './src/core/scenarios/scenario-dsl.js'
export * from './src/core/scenarios/scenarios.js'
export * from './src/core/assertions/assertions.js'
export * from './src/core/utils/context-manager.js'
