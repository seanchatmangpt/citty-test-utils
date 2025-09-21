#!/usr/bin/env node
// snapshot-test.test.mjs - Test for snapshot-test

import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from 'citty-test-utils'
import { scenario } from 'citty-test-utils/core/scenarios/scenario-dsl.js'
import { scenarios } from 'citty-test-utils/core/scenarios/scenarios.js'

describe('snapshot-test', () => {
  

  test('should snapshot test', async () => {
    
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
