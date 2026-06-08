# Vision 2030: The AutoDX Framework

## The North Star
By 2030, `un-test-utils` will transition from a "testing framework" to an **Autonomous Development Companion** for CLI engineering. The philosophy is simple: **Developers write behavior; the framework writes everything else.**

## The Evolution of the Developer Experience

Currently, creating a robust CLI requires immense context switching. A developer must write the logic, write the unit tests, write the integration scenarios, configure the CI/CD pipeline, mock the network responses, manage Docker cleanrooms, and keep the Markdown documentation perfectly synced with the code.

**The 2030 End-State:**
1. Developer writes a new `citty` command definition.
2. Developer writes the business logic handler.
3. Developer runs the command once to verify it works.
4. **The framework does the rest.**

## Core Pillars of the 2030 Architecture

### 1. Generative Coverage (`auto cover` & `auto magic`)
We will move beyond merely analyzing the AST to *acting* upon it. The AST Analyzer (`@un-test/coverage`) will map the finite state machine of the CLI. Using symbolic execution, it will calculate every possible configuration of flags and arguments. 
*   **Result:** It will proactively generate the minimal set of `scenario()` tests required to hit 100% path coverage, catching edge cases the developer hasn't even considered.

### 2. Session Transpilation (`auto record`)
Writing tests manually will become an anti-pattern. Developers will boot `utu auto record`, dropping them into a sub-shell. They will interact with their CLI exactly as an end-user would.
*   **Result:** The engine captures `stdin`, `stdout`, `stderr`, and exit codes, transpiling the human interaction into perfect, deterministic `@un-test/scenario` DSL code.

### 3. Imperceptible Isolation (`auto isolate`)
"It works on my machine" will be eradicated. When `@un-test/runners-cleanroom` detects system-level operations (file writes, specific OS commands, node version requirements), it will automatically scaffold a highly optimized Docker environment.
*   **Result:** Tests run in complete isolation with zero user configuration, utilizing aggressive caching layers to ensure cleanroom execution is as fast as local execution.

### 4. Zero-Friction Determinism (`auto mock`)
Testing CLIs that interact with the network or volatile file systems is inherently flaky.
*   **Result:** Through deep Node.js module interception (e.g., `diagnostics_channel` or monkey-patching `fetch`), the framework will listen to network requests during a successful test run and automatically serialize the responses into mocked fixtures. Subsequent runs will instantly route to these mocks, ensuring 100% offline determinism.

### 5. Living Documentation (`auto docs`)
Documentation drift is a solved problem. The framework will treat the AST as the absolute source of truth.
*   **Result:** It will continuously parse the `citty` definitions and automatically rewrite the project's `README.md` and Wiki. If a developer changes a flag's description in the code, the documentation updates instantly. Verified test scenarios will be automatically formatted and injected into the docs as "Usage Examples".

### 6. The Omnipresent Daemon (`auto evolve`)
The culmination of the 2030 vision is a continuous background loop. 
*   **Result:** Running `utu auto evolve` acts as a silent pair programmer. It watches the file system. On save, it analyzes the AST diff, generates the missing tests, updates the mocks, rewrites the documentation, and heals broken snapshots. It guarantees that the project's tests, isolation, and documentation are always perfectly aligned with the codebase at any given millisecond.

## The Paradigm Shift
We are moving away from **Test-Driven Development (TDD)** to **Behavior-Driven Generation (BDG)**. By 2030, `un-test-utils` will eliminate the boilerplate of software engineering, allowing developers to focus purely on solving the user's problem.