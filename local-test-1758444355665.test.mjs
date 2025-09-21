#!/usr/bin/env node
// local-test-1758444355665.test.mjs - Test for local-test-1758444355665

import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from 'citty-test-utils'
import { scenario } from 'citty-test-utils/core/scenarios/scenario-dsl.js'
import { scenarios } from 'citty-test-utils/core/scenarios/scenarios.js'

describe('local-test-1758444355665', () => {
  

  test('should local test 1758444355665', async () => {
    
    const result = await runLocalCitty(['--help'], {
      cwd: '.',
      env: { TEST_CLI: 'true' },
      timeout: 10000
    })
    

    
    
    result.expectSuccess()
    
    result.expectOutput(/USAGE|COMMANDS/)
    
    result.expectNoStderr()
    
    
  })

  
})
