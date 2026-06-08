# 🛸 un-test-utils

> **The 1000x DX Modular Testing Framework for CLI Applications.**
> Built with *Combinatorial Maximalism* using the entire UnJS ecosystem.

![NPM Version](https://img.shields.io/npm/v/un-test-utils)
![License](https://img.shields.io/npm/l/un-test-utils)

`un-test-utils` (formerly `citty-test-utils`) is the fastest, most advanced CLI testing framework in the JavaScript ecosystem. It has been re-architected into a highly modular monorepo, allowing you to compose your own testing infrastructure using blazing-fast, isolated, and incredibly resilient UnJS primitives.

---

## ⚡ 1000x DX Features

We didn't just optimize; we completely shattered the testing paradigm:

*   **Sub-5 Second Execution:** Powered by Vitest multi-threading (`isolate: false`) and V8 module caching. Your entire end-to-end suite finishes before your finger leaves the enter key.
*   **The Config Maximalist (`c12` + `jiti` + `defu` + `confbox`):** Seamlessly load configurations from `.cturc`, `utu.config.ts`, YAML, or TOML files. Zero-build TS config loading.
*   **Ephemeral Network Scenarios (`listhen` + `crossws` + `get-port-please` + `ofetch`):** Need to test a CLI that hits an API? Spin up a mock HTTP/WebSocket server on a dynamic port directly inside your test step, and interact with it using a pre-configured `ofetch` client.
*   **Self-Healing ASTs (`magicast` + `magic-regexp`):** When a test fails due to a mismatched snapshot or string assertion, the framework can parse the underlying test file AST, find the exact broken `.toBe()` call using type-safe regex, and rewrite it automatically.
*   **Fatal QR Crash Dumps (`consola` + `uqr`):** Never lose context on a segmentation fault again. Critical runner failures generate a massive, base64-encoded Unicode QR code in your terminal containing the exact memory dump and error trace.
*   **Universal State Hashing (`ohash` + `destr` + `scule`):** Guarantee test determinism. Test environments are normalized to `camelCase`, IPC payloads are protected from prototype pollution, and execution history is hashed to detect infinite loops instantly.
*   **Performance Regression Monitor (`unstorage`):** Tracks your command execution times across runs and uses `consola.warn` to yell at you if a command suddenly gets 50% slower.

---

## 📦 The Monorepo Ecosystem

`un-test-utils` is split into hyper-focused packages so you only bundle what you need:

### `@un-test/core`
The brain. Contains the fundamental assertions, the unified `StateMaximalist` tracker, and the core CLI entry resolver.

### `@un-test/runners-local`
The high-performance local runner. Replaces heavy OS-level process spawning with a fast worker-pool design, complete with `consola` boxed error outputs.

### `@un-test/runners-cleanroom`
The heavy artillery. When `RUN_CLEANROOM=1` is set, it spins up isolated Docker containers for true CI-level validation, complete with `nanotar` packaging for failing containers.

### `@un-test/scenario`
The fluent DSL. Chain `.step()`, `.run()`, and `.mockAPI()` to build complex, self-documenting CLI workflows that are easy to read and maintain.

### `@un-test/coverage`
The intelligence layer. AST-powered CLI surface area analysis using `acorn` and heavily memoized via `unstorage` for instant cache hits.

---

## 🚀 Quick Start

### Install the CLI

```bash
# The CLI auto-detects your package manager (powered by nypm!)
npx utu install-deps
```

### Write a Scenario

```javascript
import { scenario } from '@un-test/scenario'

export const myCliTest = scenario('My CLI Workflow')
  // Spin up an ephemeral API server on a random port
  .mockAPI({
    '/ping': () => ({ status: 'ok' })
  })
  .step('Ping the mock server', ['--ping', '--json'])
  .expectSuccess()
  .expectJson(data => {
    expect(data.status).toBe('ok')
  })
```

### Run the Tests

```bash
npm test
```
*Wait 3 seconds.* You're done.

---

## 🛠️ UnJS Libraries Deployed

This framework is a love letter to UnJS. We utilize:
`citty`, `consola`, `destr`, `defu`, `pathe`, `c12`, `ohash`, `unstorage`, `std-env`, `magicast`, `magic-regexp`, `listhen`, `crossws`, `get-port-please`, `ofetch`, `uqr`, `scule`, `nypm`, `hookable`, `unbuild`, `mkdist`, `automd`, and `untyped`.

---

## 📝 License

MIT
