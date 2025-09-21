#!/usr/bin/env node
// cross-env-test-1758443997888.test.mjs - Test for cross-env-test-1758443997888

import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from 'citty-test-utils'
import { scenario } from 'citty-test-utils/core/scenarios/scenario-dsl.js'
import { scenarios } from 'citty-test-utils/core/scenarios/scenarios.js'

describe('cross-env-test-1758443997888', () => {
  

  test('should cross env test 1758443997888', async () => {
    
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
