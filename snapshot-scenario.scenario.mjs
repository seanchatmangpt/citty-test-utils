#!/usr/bin/env node
// snapshot-scenario.scenario.mjs - Custom scenario for snapshot-scenario

import { scenario } from 'citty-test-utils/core/scenarios/scenario-dsl.js'
import { runLocalCitty, runCitty } from 'citty-test-utils'

export const snapshot-scenarioScenario = scenario('Snapshot Scenario Scenario')
  
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
export async function runSnapshot-scenarioScenario(environment = 'local') {
  return await snapshot-scenarioScenario.execute()
}

// Export scenario builder for customization
export { snapshot-scenarioScenario as scenario }
