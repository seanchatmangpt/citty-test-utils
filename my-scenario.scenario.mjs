#!/usr/bin/env node
// my-scenario.scenario.mjs - Custom scenario for my-scenario

import { scenario } from 'citty-test-utils/core/scenarios/scenario-dsl.js'
import { runLocalCitty, runCitty } from 'citty-test-utils'

export const my-scenarioScenario = scenario('My Scenario Scenario')
  
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
export async function runMy-scenarioScenario(environment = 'local') {
  return await my-scenarioScenario.execute()
}

// Export scenario builder for customization
export { my-scenarioScenario as scenario }
