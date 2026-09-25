# Citty Testing Infrastructure

This document outlines the architecture, components, and methodologies powering the testing suite of `citty-test-utils`.

---

## 1. Architectural Overview

The `citty-test-utils` testing infrastructure provides a robust, dual-strategy framework for verifying CLI application behavior. It exposes tools to execute command-line processes locally or within containerized sandboxes, evaluate outputs fluently, and compose multi-step integration scenarios.

```
                  ┌───────────────────────────────┐
                  │          Scenario DSL         │
                  └───────────────┬───────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  │        Unified Runner         │
                  └────────┬──────────────┬───────┘
                           │              │
        ┌──────────────────┴──┐        ┌──┴──────────────────┐
        │    Local Runner     │        │  Cleanroom Runner   │
        │  (Node.js Process)  │        │   (Testcontainers)  │
        └──────────┬──────────┘        └──────────┬──────────┘
                   │                              │
                   └──────────────┬───────────────┘
                                  ▼
                  ┌───────────────────────────────┐
                  │       Fluent Assertions       │
                  └───────────────────────────────┘
```

---

## 2. Core Execution Engines

### A. Local Runner (`src/core/runners/local-runner.js`)
* **Functions**: `runLocalCitty(firstArg, secondArg)` and `runLocalCittySafe(firstArg, secondArg)`.
* **Execution Strategy**: Spawns synchronous Node.js subprocesses using `child_process.spawnSync`. Avoids shell metacharacter parsing issues.
* **Signature Normalization**:
  * **Positional**: `runLocalCitty(args, options)`
  * **Options-Object**: `runLocalCitty(options)` (where options contains `args`, `cliPath`, `cwd`, `env`, `timeout`, etc.)
* **Behavior**:
  * `runLocalCitty`: Fail-fast mode when called as options-object. Throws on missing CLI path or non-zero exit code.
  * `runLocalCittySafe`: Catches internal execution errors, resolving to exit code `1` or error details instead of throwing.

### B. Cleanroom Runner (`src/core/runners/cleanroom-runner.js`)
* **Functions**: `runCitty(args, options)`.
* **Execution Strategy**: Uses `testcontainers` to run commands inside a pristine Docker container environment.
* **Shared Instance**: `test/setup/shared-cleanroom.mjs` configures a global container instance that persists across the test lifecycle to optimize execution time and concurrency.

---

## 3. Scenario DSL (`src/core/scenarios/scenario-dsl.js`)

The scenario builder enables defining sequential or concurrent multi-step test workflows with declarative expectations:
* **Chaining**: `.step(name, args, options)` followed by `.run(args, options)` to override/add commands, and `.expectSuccess()`, `.expectOutput(pattern)`, `.expectFailure()`, etc.
* **Execution modes**:
  * **Sequential**: Steps run in order, passing context and `lastResult`.
  * **Concurrent**: Steps are executed in parallel via `Promise.all`.
* **Validation**: During execution, if a step is found to have no command and no action function, it throws a validation error: `Step "<name>" has no command`.

---

## 4. Assertion Framework (`src/core/assertions/`)

All execution results are wrapped with fluent assertion utilities:
* `expectSuccess()`: Asserts that exit code is `0`.
* `expectFailure()`: Asserts that exit code is non-zero.
* `expectOutput(pattern)`: Asserts that stdout contains a string or matches a regular expression.
* `expectStderr(pattern)`: Asserts that stderr contains a string or matches a regular expression.
* `expectJson(validator)`: Parses stdout as JSON and optionally executes custom validation logic.
* `expectDuration(maxMs)`: Asserts execution completed within the specified threshold.
* `expectSnapshot(snapshotName, options)`: Invokes the snapshot comparison logic to check current output against recorded test outputs.

---

## 5. Test Suite Layout

Tests are categorized under the `test/` directory to mirror the codebase architecture:

* **Unit Tests (`test/unit/`)**:
  * Verify internal logic such as AST cache, CLI resolver, local runner options schema, and basic DSL chain parsing.
* **Integration Tests (`test/integration/`)**:
  * Verify process execution, error recovery, environmental configurations, and cleanroom Docker containers.
* **BDD/Scenario Tests (`test/bdd/` & `test/readme/`)**:
  * Validate end-to-end integration workflows against simulated and realistic workspace targets.

### Environmental Defaults (`test/setup/test-defaults.mjs`)
Vitest is configured to run `test/setup/test-defaults.mjs` before tests begin, setting default environments:
* `TEST_CLI_PATH`: Paths to the target CLI to execute (defaults to `/playground/src/cli.mjs` or fallback `/src/cli.mjs`).
* `TEST_CWD`: Current working directory for test commands.

---

## 6. How to Run Tests

Ensure dependencies are installed:
```bash
npm install
```

Execute tests using NPM scripts defined in `package.json`:
* Run all Vitest suites: `npm test`
* Run unit tests: `npm run test:unit`
* Run integration tests: `npm run test:integration`
* Run E2E requirement verification specifically: `npx vitest run test/integration/e2e-requirements.test.mjs`
