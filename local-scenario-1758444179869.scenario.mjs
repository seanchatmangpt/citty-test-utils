#!/usr/bin/env node
// local-scenario-1758444179869.scenario.mjs - Custom scenario for local-scenario-1758444179869

import { scenario } from 'citty-test-utils/core/scenarios/scenario-dsl.js'
import { runLocalCitty, runCitty } from 'citty-test-utils'

export const local-scenario-1758444179869Scenario = scenario('Local Scenario 1758444179869 Scenario')
  
  .step('Execute command', async (ctx) => {
    
    const result = await runLocalCitty(['--help'], {
      cwd: '.',
      env: { TEST_CLI: 'true' },
      timeout: 10000
    })
    

    
    
    result.expectSuccess()
    
    result.expectOutput(/USAGE|COMMANDS/)
    
    result.expectNoStderr()
    
    

    return result
  })
  

// Export for easy testing
export async function runLocal-scenario-1758444179869Scenario(environment = 'local') {
  return await local-scenario-1758444179869Scenario.execute()
}

// Export scenario builder for customization
export { local-scenario-1758444179869Scenario as scenario }
