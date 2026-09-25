# Test Readiness Map

This file tracks the readiness and mapping of the 38 integration test cases defined in `SCOPE.md` to their implementations in `test/integration/e2e-requirements.test.mjs`.

## Test Suite Location
`test/integration/e2e-requirements.test.mjs`

## Mapping of Test Cases

### Tier 1: Feature Coverage (Tests 1-15)
| ID | Requirement | Test Block Describe / It | Status |
|---|---|---|---|
| 1 | `runLocalCitty(args, options)` positional | `Tier 1: Feature Coverage` > `should execute runLocalCitty with positional signature` | READY (expected fail) |
| 2 | `runLocalCitty(options)` options-object | `Tier 1: Feature Coverage` > `should execute runLocalCitty with options-object signature` | READY (expected fail) |
| 3 | `runLocalCitty(options)` without `args` | `Tier 1: Feature Coverage` > `should execute runLocalCitty with options-object lacking args` | READY (expected fail) |
| 4 | `runLocalCittySafe(args, options)` positional | `Tier 1: Feature Coverage` > `should execute runLocalCittySafe with positional signature` | READY (expected fail) |
| 5 | `runLocalCittySafe(options)` options-object | `Tier 1: Feature Coverage` > `should execute runLocalCittySafe with options-object signature` | READY (expected fail) |
| 6 | `runLocalCittySafe(options)` without `args` | `Tier 1: Feature Coverage` > `should execute runLocalCittySafe with options-object lacking args` | READY (expected fail) |
| 7 | `runLocalCitty` positional returns wrapped assertions (success) | `Tier 1: Feature Coverage` > `should return wrapped assertions for runLocalCitty positional success` | READY (expected fail) |
| 8 | `runLocalCitty` positional returns wrapped assertions (failure) | `Tier 1: Feature Coverage` > `should return wrapped assertions for runLocalCitty positional failure` | READY (expected fail) |
| 9 | `runLocalCittySafe` options returns wrapped assertions (output) | `Tier 1: Feature Coverage` > `should return wrapped assertions for runLocalCittySafe output check` | READY (expected fail) |
| 10 | `runLocalCittySafe` options returns wrapped assertions (stderr) | `Tier 1: Feature Coverage` > `should return wrapped assertions for runLocalCittySafe stderr check` | READY (expected fail) |
| 11 | Scenario DSL `.run(args)` chaining string | `Tier 1: Feature Coverage` > `should execute scenario DSL run chaining with string command` | READY (expected fail) |
| 12 | Scenario DSL `.run(args)` chaining array | `Tier 1: Feature Coverage` > `should execute scenario DSL run chaining with array command` | READY (expected fail) |
| 13 | Scenario DSL `.run(args, options)` custom options | `Tier 1: Feature Coverage` > `should execute scenario DSL run chaining with custom options` | READY (expected fail) |
| 14 | Scenario DSL validation on sequential execution | `Tier 1: Feature Coverage` > `should throw command validation error on sequential scenario execution` | READY (expected fail) |
| 15 | Scenario DSL validation on concurrent execution | `Tier 1: Feature Coverage` > `should throw command validation error on concurrent scenario execution` | READY (expected fail) |

### Tier 2: Boundary & Corner Cases (Tests 16-30)
| ID | Requirement | Test Block Describe / It | Status |
|---|---|---|---|
| 16 | `runLocalCitty` positional with empty array `[]` | `Tier 2: Boundary & Corner Cases` > `should handle runLocalCitty positional signature with empty array args` | READY (expected fail) |
| 17 | `runLocalCitty` positional with null/undefined `args` | `Tier 2: Boundary & Corner Cases` > `should throw or handle null/undefined args in runLocalCitty positional` | READY (expected fail) |
| 18 | `runLocalCitty` options-object with empty `args` | `Tier 2: Boundary & Corner Cases` > `should handle runLocalCitty options-object signature with empty/missing args` | READY (expected fail) |
| 19 | `runLocalCitty` options-object with non-array `args` | `Tier 2: Boundary & Corner Cases` > `should parse and handle non-array args in runLocalCitty options-object` | READY (expected fail) |
| 20 | `runLocalCittySafe` positional with empty array `[]` | `Tier 2: Boundary & Corner Cases` > `should handle runLocalCittySafe positional signature with empty array args` | READY (expected fail) |
| 21 | `runLocalCittySafe` options-object with empty `args` | `Tier 2: Boundary & Corner Cases` > `should handle runLocalCittySafe options-object signature with empty/missing args` | READY (expected fail) |
| 22 | Scenario DSL `.run()` before `.step()` | `Tier 2: Boundary & Corner Cases` > `should throw error when calling run before any step in Scenario DSL` | READY (expected fail) |
| 23 | Scenario DSL `.run()` with empty string command | `Tier 2: Boundary & Corner Cases` > `should execute Scenario DSL run with empty string command` | READY (expected fail) |
| 24 | Scenario DSL `.run()` with multiple spaces in command | `Tier 2: Boundary & Corner Cases` > `should parse Scenario DSL command with multiple consecutive spaces` | READY (expected fail) |
| 25 | Scenario DSL step with `action` but no command | `Tier 2: Boundary & Corner Cases` > `should execute step with action and no command without validation errors` | READY (expected fail) |
| 26 | Scenario DSL step with neither `action` nor command | `Tier 2: Boundary & Corner Cases` > `should throw validation error when step has neither action nor command` | READY (expected fail) |
| 27 | Scenario DSL step description with special characters | `Tier 2: Boundary & Corner Cases` > `should include special characters in validation error messages` | READY (expected fail) |
| 28 | `runLocalCitty` options-object with non-existent `cliPath` | `Tier 2: Boundary & Corner Cases` > `should throw missing CLI error for runLocalCitty options-object with invalid cliPath` | READY (expected fail) |
| 29 | `runLocalCitty` positional with non-existent `cliPath` | `Tier 2: Boundary & Corner Cases` > `should return failure result for runLocalCitty positional with invalid cliPath` | READY (expected fail) |
| 30 | `runLocalCittySafe` with non-existent `cliPath` | `Tier 2: Boundary & Corner Cases` > `should return failure result for runLocalCittySafe with invalid cliPath` | READY (expected fail) |

### Tier 3: Cross-Feature Combinations (Tests 31-33)
| ID | Requirement | Test Block Describe / It | Status |
|---|---|---|---|
| 31 | Scenario combining step styles | `Tier 3: Cross-Feature Combinations` > `should execute scenario combining inline step args and step.run chaining` | READY (expected fail) |
| 32 | Scenario validation + concurrent execution | `Tier 3: Cross-Feature Combinations` > `should fail entire concurrent scenario and report missing command error` | READY (expected fail) |
| 33 | Concurrent scenario with multiple missing commands | `Tier 3: Cross-Feature Combinations` > `should throw validation error reporting multiple missing commands in concurrent mode` | READY (expected fail) |

### Tier 4: Real-World Application Scenarios (Tests 34-38)
| ID | Requirement | Test Block Describe / It | Status |
|---|---|---|---|
| 34 | Multi-step sequential mock CLI workflow | `Tier 4: Real-World Application Scenarios` > `should execute multi-step sequential mock CLI workflow with run chaining and assertions` | READY (expected fail) |
| 35 | Multi-step concurrent mock CLI workflow | `Tier 4: Real-World Application Scenarios` > `should execute multi-step concurrent mock CLI operations with run chaining` | READY (expected fail) |
| 36 | Execute actual project CLI | `Tier 4: Real-World Application Scenarios` > `should execute actual project CLI using both positional and options-object signatures` | READY (expected fail) |
| 37 | Step dependency using `lastResult` | `Tier 4: Real-World Application Scenarios` > `should simulate step dependencies using lastResult with custom actions and run chaining` | READY (expected fail) |
| 38 | Interactive-like workflow scenario | `Tier 4: Real-World Application Scenarios` > `should execute interactive-like user scenario with file generation and analysis reports` | READY (expected fail) |
