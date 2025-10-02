# Testing Strategy - Playground-First Approach

## Overview

Citty Test Utils uses a **playground-first testing strategy** where all tests execute against the **playground CLI**, which uses the **PUBLISHED version** of citty-test-utils from npm.

This ensures we test what users will actually consume, not the development version.

## Architecture

```
┌─────────────────────────────────────────┐
│  Vitest Test Suite                      │
│  (test/**/*.test.mjs)                   │
└────────────┬────────────────────────────┘
             │
             │ Uses runLocalCitty()
             ▼
┌─────────────────────────────────────────┐
│  local-runner.js                        │
│  Reads TEST_CLI_PATH from env           │
└────────────┬────────────────────────────┘
             │
             │ Defaults from vitest.config
             ▼
┌─────────────────────────────────────────┐
│  vitest.config.js                       │
│  env.TEST_CLI_PATH = ./playground/...   │
└────────────┬────────────────────────────┘
             │
             │ Executes
             ▼
┌─────────────────────────────────────────┐
│  Playground CLI                         │
│  Uses: citty-test-utils@^0.5.1 (npm)   │
│  From: playground/node_modules/         │
└─────────────────────────────────────────┘
```

## Configuration Summary

**vitest.config.js → test-defaults.mjs → local-runner.js → Playground CLI**

All tests now execute against `playground/src/cli.mjs` which uses the PUBLISHED citty-test-utils package from npm, ensuring we test what users actually consume.

No hardcoded paths. No mocks. Just real execution. 🎯
